/**
 * ============================================================
 * MOTOR DE CÁLCULO — GRIMÓRIO AFTY (fórmulas reais)
 * ============================================================
 * Fórmulas confirmadas pelo autor (transcrição em
 * docs/afty-formulas-base.md). Cálculo por MATEMÁTICA, ND 1→∞.
 *
 * Eixos da criatura: ND (Nível de Desafio) + Patamar + Tipo.
 *   • Tipo dirige os coeficientes de HP/PE/CD/Defesa/RD.
 *   • Patamar multiplica HP e escala Resistência/Atributos.
 *   • Alma (Integridade da Alma, 0–100+) multiplica o HP.
 *
 * ADIADO (marcado TODO, conforme o autor):
 *   • GUARDA (depende do contador de ataques consecutivos, CU9).
 *   • Perícias → Atenção usa Percepção = 0 por ora.
 *   • Grau de Equipamento (Ferramentas Amaldiçoadas) ainda não existe. O que
 *     entra hoje é o equipamento base: Defesa do uniforme, RD Física do
 *     escudo, penalidade de Destreza, carga e sobrecarga.
 *
 * MOTOR DE AUTOMAÇÃO (afty-efeitos.js): desde 2026-07-27 as Habilidades de
 *   Especialização, Talentos, Alto Nível, TREINAMENTOS e HABILIDADES GERAIS
 *   entram todos pelo mesmo caminho, `{ canal, expr }`, aplicado em estágios:
 *     0.  Fontes a montante do contexto: Treinamentos, Habilidades Gerais e os
 *         campos "+ OUTROS" da ficha. Concedem atributo, nível de aptidão e
 *         vagas de orçamento, tudo lido antes de os stats existirem.
 *     1a. `atributo` permanente  → o que os PRÉ-REQUISITOS enxergam.
 *     1b. `atributo` temporário  → o atributo FINAL da ficha.
 *     2.  Todos os outros canais, já lendo o atributo final.
 *   Por isso os catálogos escolhidos são resolvidos LOGO NO INÍCIO desta
 *   função, e não mais perto do fim.
 * ============================================================
 */

import { resolveOrigemAttrBonus, resolveDesenvolvimento } from "./afty-origens";
import { efeitosDeTreino } from "./afty-treinamentos";
import { resolveNiveisAptidao } from "./afty-aptidoes";
import { resolveEspecializacoes } from "./afty-especializacoes";
import {
  resolveHabilidades, efeitosInvocacaoControlador, getHabilidade, OPCAO_ESCOLHA_NOME,
} from "./afty-habilidades";
import { resolveTalentos, getTalento } from "./afty-talentos";
import {
  resolveAltoNivel, getMelhoriaSuperior, getHabilidadeLendaria, getHabilidadeApice,
} from "./afty-alto-nivel";
import { resolveInvocacoesList, resolveHordasList } from "./afty-invocacoes";
import {
  resolveEquipamentos, resolveCarga, grauFeiticeiro, alcanceDaArma, propriedadesDaArma,
  AFTY_GRAUS,
} from "./afty-equipamentos";
import { nivelMaxFeitico } from "./afty-feiticos";
import { resolveTestes, resolveDano } from "./afty-pericias";
import {
  buildCriaturaDslContext, coletarEfeitosCriatura, coletarEfeitosMontante,
  aplicarEfeitos, valorCanal, furaTetoEm,
  ehAtributoPermanente, ehAtributoTemporario, ehEstagio2, ehPreContexto,
  mesclarEfeitos, detalhesDoCanal,
} from "./afty-efeitos";
import { resolveGerais, contadorHabilidades, GERAL_BY_ID } from "./afty-gerais";

export const mod = (attr) => Math.floor(((attr ?? 10) - 10) / 2);

// Maestria == Treinamento (mesmo valor), por faixa de ND.
export const maestria = (nd) => {
  if (nd >= 26) return 8;
  if (nd >= 21) return 7;
  if (nd >= 17) return 6;
  if (nd >= 13) return 5;
  if (nd >= 9) return 4;
  if (nd >= 5) return 3;
  return 2;
};

// Multiplicador de HP por Patamar, aplicado direto sobre a base.
// A planilha tinha um `×2` fixo + patamarMult {comum 1, desafio 1, calamidade 1,5, beyond 2},
// o que dava um efetivo de 2/2/3/4 (Comum empatado com Desafio). O `×2` era, na prática,
// o multiplicador do Desafio: foi absorvido aqui, e o Comum virou metade do Desafio.
export const HP_PATAMAR_MULT = { comum: 1, desafio: 2, calamidade: 3, beyond: 4 };

// Stats que a aba Cálculos permite sobrescrever (valor final, padrão StatField).
export const OVERRIDABLE = ["hp", "pe", "defesa", "cd", "rdGeral", "rdEspecifico", "movimento", "resParcial", "atencao", "iniciativa"];

const INT = (x) => Math.floor(x); // INT() da planilha (ND > 0 → floor)

/** Rank de um grau de Ferramenta Amaldiçoada, para comparar dois. */
const grauRank = (v) => AFTY_GRAUS.find((g) => g.value === v)?.rank ?? 0;

export function deriveAfty(creature) {
  const core = creature?.core ?? {};
  const a = creature?.attributes ?? {};
  const ov = creature?.statOverrides ?? {};

  const tipo = core.tipo || "combatente";
  const patamar = core.patamar || "comum";
  const nd = Math.max(1, core.nd ?? 1);
  const almaAtual = creature?.alma?.atual ?? 100;
  const almaMult = almaAtual / 100;
  const qntPE = creature?.qntPE || "normal";

  const attrBonus = resolveOrigemAttrBonus(creature);
  const nivelAlloc = creature?.attrNivel ?? {};
  const desenv = resolveDesenvolvimento(creature);
  // Equipamento primeiro: os acessórios de atributo entram no cálculo do
  // efetivo. A CARGA não sai daqui, porque depende do mod de Força final.
  // BT antecipado só para as Cargas de Encantamento das Ferramentas (= BT).
  const bt = maestria(nd);                                          // Maestria == Treinamento
  const equip = resolveEquipamentos(creature, bt);

  // Limite EFETIVO por atributo = limite base (20 / poderes) + Desenvolvimento, teto 30.
  const limBase = (creature?.attrLimite && typeof creature.attrLimite === "object") ? creature.attrLimite : {};
  const limiteEfOf = (key) => Math.min((limBase[key] ?? 20) + (desenv[key] || 0), 30);

  // Atributo EFETIVO = base + nível + Desenvolvimento + bônus de origem.
  // Atributos de ORIGEM NÃO passam o limite (salvo os que digam explicitamente — TODO).
  // base+nível+Desenvolvimento já cabem no limite por construção (o Desenvolvimento
  // eleva valor E limite juntos); o bônus de origem é limitado ao limite efetivo.
  // Acessório de atributo (Anéis do Conhecimento, Bracelete da Força...) é o
  // único bônus que PASSA o limite: o texto deles diz "podendo superar o seu
  // limite de atributo, até o máximo de 30". Por isso ele entra depois do
  // clamp do limite, contra o teto duro de 30.
  const eff = (key) => {
    const dentroDoLimite = Math.min(
      (a[key] ?? 10) + (nivelAlloc[key] || 0) + (desenv[key] || 0) + (attrBonus[key] || 0),
      limiteEfOf(key),
    );
    return Math.min(dentroDoLimite + (equip.attrBonus[key] || 0), 30);
  };

  // Atributo e modificador BASE: tudo menos os efeitos de habilidade. É o que
  // os pré-requisitos e as expressões do Motor leem, para uma habilidade que
  // concede atributo não morder a própria conta.
  const attrBase = {
    forca: eff("forca"), destreza: eff("destreza"), constituicao: eff("constituicao"),
    inteligencia: eff("inteligencia"), sabedoria: eff("sabedoria"), presenca: eff("presenca"),
  };
  const modBase = Object.fromEntries(Object.entries(attrBase).map(([k, v]) => [k, mod(v)]));
  const attrLimiteEfetivo = {
    forca: limiteEfOf("forca"), destreza: limiteEfOf("destreza"), constituicao: limiteEfOf("constituicao"),
    inteligencia: limiteEfOf("inteligencia"), sabedoria: limiteEfOf("sabedoria"), presenca: limiteEfOf("presenca"),
  };

  // Mod. Técnica = modificador do atributo escolhido para a Técnica/CD
  const tecnicaAttr = core.tecnicaAttr || "inteligencia";

  const grau = grauFeiticeiro(nd);                                 // grau do feiticeiro por faixa de ND

  // ---------- ESTÁGIO 0: fontes A MONTANTE do contexto ----------
  // Treinamentos, Habilidades Gerais e os campos "+ OUTROS" da ficha foram
  // ABSORVIDOS pelo Motor em 2026-07-27 (decisão do autor): emitem
  // `{ canal, expr }` como qualquer outra fonte, em vez dos agregadores
  // paralelos que tinham. Entram ANTES de tudo porque concedem atributo, NÍVEL
  // DE APTIDÃO e VAGAS DE ORÇAMENTO, coisas lidas antes de os stats existirem.
  // Por isso rodam com um contexto reduzido (ND, Maestria, grau, patamar, tipo
  // e os atributos base), que é tudo de que as expressões deles precisam.
  const gerais = resolveGerais(creature, { nd, maestria: bt });
  const ctxMontante = buildCriaturaDslContext({
    nd, bt, grauRank: grau.rank, patamar, tipo, almaAtual,
    attrEff: attrBase, mods: modBase, modTecnica: modBase[tecnicaAttr] ?? 0,
    periciasProf: creature?.pericias,
  });
  const efMontante = aplicarEfeitos(
    [...efeitosDeTreino(creature), ...coletarEfeitosMontante(creature, gerais, GERAL_BY_ID)],
    ctxMontante,
  );
  // Os canais que precisam ser lidos ANTES do contexto principal: dois
  // alimentam resolveNiveisAptidao (nível de aptidão é variável do DSL) e um
  // alimenta o orçamento de Habilidades de Especialização. O resto (hp, pe,
  // movimento, defesa, atributo, focos, vagas de perícia e de aptidão) entra
  // pelo caminho normal do Motor, mais abaixo.
  const treino = {
    aptidao: valorCanal(efMontante, "pontosAptidao"),
    aptidaoTrilha: efMontante.porAlvo.nivelAptidao || {},
  };
  const vagasHabilidade = valorCanal(efMontante, "vagasHabilidade");

  // ============================================================
  // CATÁLOGOS ESCOLHIDOS + MOTOR DE AUTOMAÇÃO
  // ============================================================
  // Resolvidos AQUI, antes dos stats, e não mais perto do fim: é o que permite
  // um efeito de habilidade alcançar HP, Defesa, CD e companhia. Nenhum destes
  // precisa de stat, só de ND, Maestria, atributos e origem.
  //
  // ⚠ Os atributos usados no pré-requisito são os BASE (attrEff, sem efeito
  // nenhum de habilidade). Sem essa regra, habilidade que concede atributo
  // morde a própria conta. Ver o topo de afty-efeitos.js.

  // ⚠ Os níveis de aptidão saem MAIS ABAIXO, depois das Habilidades: elas
  // também concedem trilha (Aptidões de Luta, Aptidões de Combate), e a
  // concessão precisa entrar antes de `dom/au/cl/bar/er` virarem variável.

  // Especializações: NÃO entram em nenhum stat (quem dirige fórmula é o Tipo).
  // Resolvidas para a UI, a validação e o nível que os efeitos escalam.
  const especializacoes = resolveEspecializacoes(creature);

  // Talentos dividem o orçamento das Habilidades de Especialização, então saem
  // antes. O acesso deles lê ND, origem e atributos, nunca nível de classe.
  // ⚠ Este é um resolve PRELIMINAR: os ids e o gasto já são definitivos, mas o
  // `inacessiveis` é refeito mais abaixo, com o atributo já somado dos efeitos
  // PERMANENTES. Talento é o único catálogo cujo pré-requisito lê atributo.
  const origemId = creature?.core?.origem?.id ?? null;
  const talentosPre = resolveTalentos(creature, { nd, attrEff: attrBase, origemId });
  // bt entra por causa do Roubo de Habilidade, cujo limite de repetições é o
  // Bônus de Treinamento. O último parâmetro são as vagas extras da Habilidade
  // Geral Especialização.
  const habilidades = resolveHabilidades(
    creature, especializacoes.escolhidas, talentosPre.gastos, bt, vagasHabilidade,
  );
  // Alto Nível (21+). Além do ND, cada trilha exige a Habilidade Geral
  // correspondente, que só DESTRAVA (não dá vaga).
  const altoNivel = resolveAltoNivel(creature, {
    niveisPorEspec: habilidades.niveisPorEspec,
    habilidades: habilidades.escolhidas,
    destravado: gerais.destravado,
  });

  // Nível por especialização para o DSL: real (trava pré-requisito) e de
  // escalonamento (real + metade da outra classe, o que os efeitos escalam).
  const nivelEspec = {};
  for (const e of especializacoes.escolhidas) {
    nivelEspec[e.id] = { real: e.nivel ?? 0, escalonamento: e.nivelEscalonamento ?? e.nivel ?? 0 };
  }

  // Efeitos de ficha das entradas escolhidas. O catálogo de efeitos ainda está
  // VAZIO (Fase 0 é só a infraestrutura): a passada de conteúdo é a Fase 2/3 de
  // docs/afty-efeitos-criatura.md.
  // ⚠ TRÊS ESTÁGIOS (autor, 2026-07-27). O efeito de ATRIBUTO entra primeiro e
  // todo o resto lê o atributo já somado ("Tenho força 14. Recebo +6 de Força
  // fico com Força 20. Depois eu recebo +5 de Defesa (Mod. Força)"), e o
  // atributo se parte em permanente e temporário porque só o PERMANENTE conta
  // para pré-requisito ("Se o Modificador de Força for temporário, não! Se for
  // permanente, sim!"). Ver o topo de afty-efeitos.js.
  const efeitosTodos = coletarEfeitosCriatura({
    habilidades, talentos: talentosPre, altoNivel,
    catalogos: {
      habilidades: getHabilidade, talentos: getTalento, opcoes: OPCAO_ESCOLHA_NOME,
      altoNivel: (id) => getMelhoriaSuperior(id) || getHabilidadeLendaria(id) || getHabilidadeApice(id),
    },
  });

  // Estágio 0b: os canais que ALIMENTAM o contexto principal. Só nível de
  // aptidão por ora, porque `dom/au/cl/bar/er` são variáveis do DSL e uma
  // habilidade que concede trilha tem de entrar antes de o contexto existir.
  // Mesma regra do estágio de atributo: dentro dele um efeito não vê o irmão.
  const efPreContexto = aplicarEfeitos(efeitosTodos.filter(ehPreContexto), ctxMontante);
  // Níveis de aptidão por trilha: alocado (pago) + concedido (grátis,
  // direcionado). A concessão vem de dois lados, Treinamento e Habilidade.
  const trilhasConcedidas = { ...treino.aptidaoTrilha };
  for (const [k, v] of Object.entries(efPreContexto.porAlvo.nivelAptidao || {})) {
    trilhasConcedidas[k] = (trilhasConcedidas[k] || 0) + v;
  }
  const aptidao = resolveNiveisAptidao(creature?.aptidoes, trilhasConcedidas);

  const montarCtx = (attrs, mods) => buildCriaturaDslContext({
    nd, bt, grauRank: grau.rank, patamar, tipo, almaAtual,
    attrEff: attrs, mods, modTecnica: mods[tecnicaAttr] ?? 0,
    aptidao: aptidao.efetivo, nivelEspec, periciasProf: creature?.pericias,
  });
  // Soma um canal de atributo sobre uma base, respeitando o teto duro de 30 e a
  // exceção `furaTeto` (Aperfeiçoamento de Atributo diz "podendo superar o
  // máximo de 30").
  // ⚠ O teto NUNCA DERRUBA o que já estava acima dele: como esta função roda
  // duas vezes (permanente e depois temporário), clampar cru em 30 no segundo
  // passo desfaria um furaTeto legítimo do primeiro. O que o teto impede é
  // SUBIR além de 30, não estar além de 30.
  const somarAtributo = (partida, res) => {
    const out = {};
    for (const k of Object.keys(partida)) {
      const somado = partida[k] + valorCanal(res, "atributo", k);
      out[k] = furaTetoEm(res, k) ? somado : Math.min(somado, Math.max(30, partida[k]));
    }
    return out;
  };

  // Estágio 1a: atributo PERMANENTE, lendo o BASE. Dentro deste estágio um
  // efeito de atributo não vê o irmão, o que evita o laço A→B→A. O Treino de
  // Atributo (estágio 0) entra aqui junto, porque também é permanente.
  const efAttrPerm = mesclarEfeitos(
    { porAlvo: { atributo: efMontante.porAlvo.atributo || {} } },
    aplicarEfeitos(efeitosTodos.filter(ehAtributoPermanente), montarCtx(attrBase, modBase)),
  );
  // Este é o atributo que os PRÉ-REQUISITOS enxergam.
  const attrPermanente = somarAtributo(attrBase, efAttrPerm);
  const modPermanente = Object.fromEntries(Object.entries(attrPermanente).map(([k, v]) => [k, mod(v)]));

  // Talentos de novo, agora com o atributo permanente: só o `inacessiveis` muda.
  const talentos = resolveTalentos(creature, { nd, attrEff: attrPermanente, origemId });

  // Estágio 1b: atributo TEMPORÁRIO, por cima do permanente. Resulta no
  // atributo FINAL, que é o que a ficha mostra e o que os stats usam.
  const efAttrTemp = aplicarEfeitos(
    efeitosTodos.filter(ehAtributoTemporario),
    montarCtx(attrPermanente, modPermanente),
  );
  const attrEff = somarAtributo(attrPermanente, efAttrTemp);
  const modFor = mod(attrEff.forca);
  const modDes = mod(attrEff.destreza);
  const modCon = mod(attrEff.constituicao);
  const modInt = mod(attrEff.inteligencia);
  const modSab = mod(attrEff.sabedoria);
  const modPre = mod(attrEff.presenca);
  const modByAttr = { forca: modFor, destreza: modDes, constituicao: modCon, inteligencia: modInt, sabedoria: modSab, presenca: modPre };
  const modTecnica = modByAttr[tecnicaAttr] ?? 0;
  const maxForDex = Math.max(modFor, modDes);                       // Z8:Z9
  const maxAllMods = Math.max(modFor, modDes, modCon, modInt, modSab, modPre); // Z8:Z13
  // Carga só agora, com o mod de Força já fechado (acessório + efeitos).
  const carga = resolveCarga(equip.espacosUsados, modFor);

  // Estágio 2: todo o resto, com o contexto REMONTADO nos atributos finais. É
  // aqui que "Defesa igual ao Mod. Força" enxerga a Força 20.
  // `efMontante` entra inteiro no agregado para os `detalhes` da UI mostrarem a
  // linha de treino como origem. O canal de atributo dele já foi consumido no
  // estágio 1a, então sai daqui para não somar duas vezes.
  const efMontanteSemAtributo = { ...efMontante, porAlvo: { ...efMontante.porAlvo } };
  delete efMontanteSemAtributo.porAlvo.atributo;
  const ef = mesclarEfeitos(
    efMontanteSemAtributo, efPreContexto, efAttrPerm, efAttrTemp,
    aplicarEfeitos(efeitosTodos.filter(ehEstagio2), montarCtx(attrEff, modByAttr)),
  );
  const canal = (id, alvo = null) => valorCanal(ef, id, alvo);

  // ---------- HP (+ Treino de Resistência) ----------
  const hpBase =
    tipo === "combatente" ? 12 + (nd - 1) * 6 :
    tipo === "restringido" ? 12 * nd :
    /* misto | conjurador */ 10 + (nd - 1) * 5;
  const hpPatamarMult = HP_PATAMAR_MULT[patamar] ?? 1;
  // O bônus de item ("os seus pontos de vida máximos aumentam em 10") entra
  // DEPOIS da Alma e do Patamar, ao contrário do treino: é um valor fixo de
  // PV máximo, não uma parcela da base que o Patamar multiplicaria.
  // O canal `hp` do Motor entra ANTES do multiplicador de Alma (autor,
  // 2026-07-27), então fica junto do treino, dentro do parêntese.
  const hp = Math.round(almaMult * (hpBase + nd * modCon + canal("hp")) * hpPatamarMult) + equip.hpMaxBonus;

  // ---------- PE (+ Treinos de Compreensão/Controle de Energia/…) ----------
  const peBase =
    tipo === "conjurador" ? 6 * nd :
    tipo === "misto" ? 5 * nd :
    /* combatente | restringido */ 4 * nd;
  const peQnt =
    qntPE === "muito_pouca" ? -nd :
    qntPE === "pouca" ? -Math.floor(nd / 2) :
    qntPE === "grande" ? Math.floor(nd / 2) :
    qntPE === "muito_grande" ? nd : 0;
  const pe = peBase + peQnt + modTecnica + equip.peBonus + canal("pe");

  // ---------- Resistência Parcial ----------
  // Calamidade ganha +1 em ND 10, 20 e 30 (0 a 3).
  // Beyond ganha +1 em ND 1, 10, 20 e 30 (1 a 4) — o limiar de ND 1 é sempre
  // atendido, já que nd tem piso 1, então entra como constante.
  // Comum e Desafio não têm Resistência Parcial.
  const resThresh = (nd >= 10 ? 1 : 0) + (nd >= 20 ? 1 : 0) + (nd >= 30 ? 1 : 0);
  const resParcial =
    patamar === "calamidade" ? resThresh :
    patamar === "beyond" ? 1 + resThresh : 0;

  // ---------- Movimento (+ Treino de Agilidade, - sobrecarga) ----------
  const movimento = 9 + maxForDex * 1.5 + carga.movimento + equip.movimentoBonus + canal("movimento");

  // ---------- RD Geral ----------
  const rdGeralBase =
    tipo === "conjurador" ? (nd >= 10 ? Math.floor(nd / 2) : 0) :
    tipo === "misto" ? (nd >= 10 ? nd : Math.floor(nd / 2)) :
    /* combatente | restringido */ (nd >= 10 ? maxAllMods : 0) + nd;
  const rdGeral = rdGeralBase + equip.rdGeralBonus + canal("rdGeral");

  // ---------- RD Específico ----------
  const rdEspecifico =
    tipo === "conjurador" ? modTecnica :
    tipo === "misto" ? (nd >= 10 ? 2 * modTecnica : modTecnica) : 0;

  // ---------- CD ----------
  // O DIVISOR fica numa constante porque ele é o que a UI mostra como fonte do
  // valor ("Nível ÷ 1,75"), e não o nome da escala.
  const divisorCD =
    tipo === "conjurador" ? 1.25 :
    tipo === "misto" ? 1.5 :
    /* combatente | restringido */ 1.75;
  const cdTipo = INT(nd / divisorCD);
  const cd = 10 + cdTipo + (modTecnica + bt) + equip.cdBonus + canal("cd");

  // ---------- Aba Habilidades: Feitiços + Habilidades Gerais ----------
  // Contador ÚNICO para os dois (autor, 2026-07-26): dobro da Maestria, +2 no
  // Desafio, +4 na Calamidade, triplo da Maestria no Beyond. Substituiu o
  // antigo totalFeiticos(nd). A CD base dos Feitiços é a CD de Feitiçaria da
  // criatura (acima), que já usa o Atributo Principal da Técnica
  // (core.tecnicaAttr) e a Maestria. A criação de cada Feitiço só a desloca.
  // (`gerais` já foi resolvido lá em cima, junto dos outros catálogos.)
  const feiticosLista = Array.isArray(creature.feiticos) ? creature.feiticos : [];
  const feiticosGastos = feiticosLista.filter((f) => !f.variacaoDe).length;
  const contadorTotal = contadorHabilidades(bt, patamar);
  const contadorGastos = feiticosGastos + gerais.gastos;
  const orcamentoHabilidades = {
    total: contadorTotal,
    feiticos: feiticosGastos,
    gerais: gerais.gastos,
    gastos: contadorGastos,
    restante: contadorTotal - contadorGastos,
    excedeu: contadorGastos > contadorTotal,
  };
  const feiticos = {
    nivelMax: nivelMaxFeitico(nd),
    gastos: feiticosGastos,
    cdBase: cd,
  };

  // ---------- RD Física (só escudo por ora) ----------
  // Canal NOVO, separado de RD Geral e RD Específico. O autor confirmou que
  // a RD do escudo é FÍSICA. O sistema de RD Física em si ainda vem.
  const rdFisico = equip.rdFisico + canal("rdFisico");

  // ---------- Defesa / CA (+ uniforme, - sobrecarga; Treino de Luta ADIADO) ----------
  const divisorDefesa =
    tipo === "conjurador" ? 1.75 :
    tipo === "misto" ? 1.5 :
    /* combatente | restringido */ 1.25;
  const defTipo = INT(nd / divisorDefesa);
  const defesa = 10 + defTipo + modDes + bt + equip.uniformeDefesa + carga.defesa + equip.defesaBonus + canal("defesa");

  // ---------- Perícias, Jogadas de Ataque e Testes de Resistência ----------
  // Depende de cdTipo e defTipo: a planilha do autor (2026-07-27) mostra que a
  // CRIATURA não usa o "metade do nível" do livro (essa é a fórmula do JOGADOR).
  // Teste de Resistência usa a MESMA escala por Tipo da CD e da Defesa (Astúcia
  // e Vontade a da CD, Reflexos e Fortitude a da Defesa, Integridade ND/1,5 em
  // todo Tipo), e Jogada de Ataque usa ND/1,5 fixo. Só as Perícias seguem em
  // metade do ND, pendente de fórmula própria. Ver afty-pericias.js.
  //
  // Orçamento de perícias treinadas = 3 + maior mod entre INT e SAB + rank do
  // Grau do Feiticeiro (autor, 2026-07-27).
  const testes = resolveTestes(creature, {
    nd, bt, mods: modByAttr, tecnicaAttr, grauRank: grau.rank,
    escalaCD: cdTipo, escalaDefesa: defTipo,
    divisorCD, divisorDefesa,
    bonusVagas: canal("vagasPericia"),
    efeitos: ef,   // bonusPericia / bonusTR / bonusAcerto / proficienciaPericia
  });

  // ---------- Dano (planilha do autor, 2026-07-27) ----------
  // Uma linha por FONTE: o Ataque Básico e mais uma para cada arma equipada.
  // Todas usam a MESMA conta, e o dano listado na tabela da arma é ignorado. Da
  // arma vêm o Alcance, as Propriedades e o grau da Ferramenta Amaldiçoada.
  // Faixas e Manoplas não viram linha própria: são o Ataque Básico (grupo
  // "pugilato"). O Nível de Aptidão em Controle e Leitura entra na conta, daí
  // depender do `aptidao` já resolvido lá em cima.
  // ⚠ É "arma CARREGADA", não "equipada": a aba Equipamentos só deixa equipar
  // uniforme, escudo e item com efeito, então exigir `equipado` deixaria a lista
  // de dano sem nenhuma arma, para sempre. O autor pediu uma linha "para cada
  // Tipo de Arma colocado".
  const armasCarregadas = equip.entradas.filter((e) => e.tipo === "arma");
  const armasParaDano = armasCarregadas
    .filter((e) => e.def?.grupo !== "pugilato")
    .map((e) => ({
      id: e.def.id,
      nome: e.def.nome,
      grauArma: e.fa?.grau ?? null,
      fineza: !!e.def.props?.fineza,
      distancia: e.def.categoria === "distancia" || e.def.categoria === "arremesso",
      alcance: alcanceDaArma(e.def),
      propriedades: propriedadesDaArma(e.def),
    }));
  // O Ataque Básico só sobe de grau com Manoplas ou Faixas (autor, 2026-07-27).
  // Sem elas é Desarmado, que não soma nada. Com as duas vale o grau mais alto.
  const grauBasico = armasCarregadas
    .filter((e) => e.def?.grupo === "pugilato" && e.fa?.grau)
    .map((e) => e.fa.grau)
    .sort((x, y) => (grauRank(y) - grauRank(x)))[0] ?? null;
  const dano = resolveDano(creature, {
    nd, patamar, mods: modByAttr, aptidaoCL: aptidao.efetivo.cl,
    efeitos: ef, armas: armasParaDano, grauBasico,
  });

  // ---------- Atenção = 10 + bônus de Percepção (Percepção passiva) ----------
  const atencao = testes.atencao;

  // ---------- Iniciativa (autor, 2026-07-27) ----------
  // INT(Maestria / 2) + Mod. Destreza. Não usa o ND direto nem escala por Tipo.
  const iniciativa = INT(bt / 2) + modDes + canal("iniciativa");

  // ---------- Orçamentos (budgets do builder) ----------
  // Orçamento de Níveis de Aptidão. Só entram aqui os pontos LIVRES: os
  // limiares de ND, o +1 de Qnt.PE Muito Grande e as concessões de treino
  // "à sua escolha". As concessões DIRECIONADAS a uma trilha são grátis e
  // não passam pelo orçamento (ver resolveNiveisAptidao).
  //
  // ⚠ O +1 de Qnt.PE Muito Grande NÃO é o Raio Negro. A planilha rotulava
  // essa célula de "Raio Negro" e o autor confirmou (2026-07-16) que são
  // efeitos SEPARADOS: Qnt.PE Muito Grande dá +1 no orçamento e nada mais,
  // enquanto a aptidão Raio Negro dá +ND de PE e +1 DIRECIONADO em Aura.
  // Os dois somam. O efeito do Raio Negro ainda NÃO é aplicado (o motor não
  // lê aptidões escolhidas): fica para a passada de efeitos, quando o
  // catálogo fechar. Ver docs/afty-status.md.
  const aptidaoThresholds = [[2,1],[4,1],[6,1],[8,1],[10,2],[12,1],[14,1],[16,1],[18,1],[20,2]];
  const totalAptidao =
    aptidaoThresholds.reduce((s, [t, v]) => s + (nd >= t ? v : 0), 0) +
    (qntPE === "muito_grande" ? 1 : 0) +
    treino.aptidao;

  // Quantas Aptidões Amaldiçoadas a criatura PODE ter: só o que a Habilidade
  // Geral Aptidão concedeu (regra 4 em afty-gerais.js, o ND não dá nenhuma).
  // Segue separado e independente do orçamento de NÍVEIS de aptidão
  // (totalAptidao, os limiares de ND), que não mudou.
  const totalAptidoesAmaldicoadas = canal("vagasAptidao");

  // ⚠ Especializações, Talentos, Habilidades, Alto Nível, Aptidão e o MOTOR DE
  // AUTOMAÇÃO subiram para o topo desta função (logo depois dos atributos
  // base), porque os efeitos precisam alcançar os stats. Ver o bloco
  // "CATÁLOGOS ESCOLHIDOS + MOTOR DE AUTOMAÇÃO" lá em cima.

  // Invocações: a invocação lê valores do DONO (ND, BT = maestria(ND) e o Nível
  // de Controlador, o lado da multiclasse). Resolvidas aqui só para a UI e a
  // validação lerem de um lugar só. NÃO alimentam nenhum stat do dono.
  // Invocações usam o nível de ESCALONAMENTO de Controlador (real + metade da
  // outra classe): acesso a graus, metade do nível no bônus de teste, e os
  // limiares 6/12/18 de Invocações Móveis. Pré-requisitos de habilidade usam o real.
  const nivelControlador = especializacoes.escolhidas.find((e) => e.id === "controlador")?.nivelEscalonamento ?? 0;
  // Efeitos estáticos das Habilidades de Controlador escolhidas, aplicados a
  // TODAS as invocações do dono (via Motor de Automação, ver afty-habilidades.js).
  const efeitosInvoc = efeitosInvocacaoControlador(habilidades.escolhidas);
  // Concentrar Poder (6°): marca até floor(BT/2) invocações. O limite alimenta o
  // contador/validação da UI; o efeito em si é filtrado por `marcada` no motor.
  const temConcentrarPoder = habilidades.escolhidas.includes("ctr_concentrar_poder");
  const concentrarPoder = { ativo: temConcentrarPoder, limite: temConcentrarPoder ? Math.floor(bt / 2) : 0 };
  const donoInvoc = { nd, bt, nivelControlador, efeitos: efeitosInvoc, concentrarPoder };
  const invocacoes = resolveInvocacoesList(creature?.invocacoes, donoInvoc);
  const hordas = resolveHordasList(creature?.hordas, creature?.invocacoes, donoInvoc);

  // Focos de interlúdio (orçamento de Treinamento) = ND + Outros.
  // "Outros" = bônus de poderes que concedem treinos (sistema futuro),
  // lido de creature.focosBonus (0 por ora), mais a Habilidade Geral
  // Treinamentos (metade do ND por pega).
  const focosTotais = nd + canal("focos");

  // (Pontos de atributo agora vêm do método + pool de nível — ver afty-atributos.js.)

  // ---------- FONTES DE CADA VALOR (hover da UI) ----------
  // Uma parcela por origem, na ordem em que a fórmula soma. `texto` substitui o
  // número quando a parcela não é uma soma (multiplicadores do HP).
  // Parcelas do Motor entram nomeadas pela habilidade/treino que as gerou.
  const rotulo = { forca: "Força", destreza: "Destreza", constituicao: "Constituição",
    inteligencia: "Inteligência", sabedoria: "Sabedoria", presenca: "Presença" };
  const doMotor = (id, alvo = null) =>
    detalhesDoCanal(ef, id, alvo).map((d) => ({ label: d.nome, valor: d.valor }));
  const TIPO_LABEL = { combatente: "Combatente", misto: "Misto", conjurador: "Conjurador", restringido: "Restringido" };
  const PATAMAR_LABEL = { comum: "Comum", desafio: "Desafio", calamidade: "Calamidade", beyond: "Beyond" };
  const divTexto = (d) => String(d).replace(".", ",");

  const partes = {
    hp: [
      { label: `Base do Tipo (${TIPO_LABEL[tipo] ?? tipo})`, valor: hpBase },
      { label: "Constituição × ND", valor: nd * modCon },
      ...doMotor("hp"),
      ...(almaMult !== 1 ? [{ label: "Integridade da Alma", texto: `×${divTexto(almaMult)}` }] : []),
      ...(hpPatamarMult !== 1 ? [{ label: `Patamar (${PATAMAR_LABEL[patamar] ?? patamar})`, texto: `×${hpPatamarMult}` }] : []),
      ...(equip.hpMaxBonus ? [{ label: "Equipamento", valor: equip.hpMaxBonus }] : []),
    ],
    pe: [
      { label: `Base do Tipo (${TIPO_LABEL[tipo] ?? tipo})`, valor: peBase },
      ...(peQnt ? [{ label: "Quantidade de PE", valor: peQnt }] : []),
      { label: `Mod. da Técnica (${rotulo[tecnicaAttr] ?? tecnicaAttr})`, valor: modTecnica },
      ...(equip.peBonus ? [{ label: "Equipamento", valor: equip.peBonus }] : []),
      ...doMotor("pe"),
    ],
    defesa: [
      { label: "Base", valor: 10 },
      { label: `Nível ÷ ${divTexto(divisorDefesa)}`, valor: defTipo },
      { label: "Destreza", valor: modDes },
      { label: "Maestria", valor: bt },
      ...(equip.uniformeDefesa ? [{ label: "Uniforme", valor: equip.uniformeDefesa }] : []),
      ...(carga.defesa ? [{ label: "Sobrecarga", valor: carga.defesa }] : []),
      ...(equip.defesaBonus ? [{ label: "Equipamento", valor: equip.defesaBonus }] : []),
      ...doMotor("defesa"),
    ],
    cd: [
      { label: "Base", valor: 10 },
      { label: `Nível ÷ ${divTexto(divisorCD)}`, valor: cdTipo },
      { label: `Mod. da Técnica (${rotulo[tecnicaAttr] ?? tecnicaAttr})`, valor: modTecnica },
      { label: "Maestria", valor: bt },
      ...(equip.cdBonus ? [{ label: "Equipamento", valor: equip.cdBonus }] : []),
      ...doMotor("cd"),
    ],
    rdGeral: [
      { label: `Base do Tipo (${TIPO_LABEL[tipo] ?? tipo})`, valor: rdGeralBase },
      ...(equip.rdGeralBonus ? [{ label: "Equipamento", valor: equip.rdGeralBonus }] : []),
      ...doMotor("rdGeral"),
    ],
    rdEspecifico: [
      { label: `Base do Tipo (${TIPO_LABEL[tipo] ?? tipo})`, valor: rdEspecifico - canal("rdEspecifico") },
      ...doMotor("rdEspecifico"),
    ],
    movimento: [
      { label: "Base", valor: 9 },
      { label: "Maior de Força e Destreza × 1,5", valor: maxForDex * 1.5 },
      ...(carga.movimento ? [{ label: "Sobrecarga", valor: carga.movimento }] : []),
      ...(equip.movimentoBonus ? [{ label: "Equipamento", valor: equip.movimentoBonus }] : []),
      ...doMotor("movimento"),
    ],
    iniciativa: [
      { label: "Maestria ÷ 2", valor: INT(bt / 2) },
      { label: "Destreza", valor: modDes },
      ...doMotor("iniciativa"),
    ],
    atencao: [
      { label: "Base", valor: 10 },
      { label: "Percepção", valor: atencao - 10 },
    ],
    resParcial: [
      { label: `Patamar (${PATAMAR_LABEL[patamar] ?? patamar})`, valor: resParcial },
    ],
  };

  // ---------- overrides de valor final (aba Cálculos) ----------
  const calc = { hp, pe, defesa, cd, rdGeral, rdEspecifico, movimento, resParcial, atencao, iniciativa };
  const stats = {};
  for (const k of OVERRIDABLE) stats[k] = ov[k] != null ? ov[k] : calc[k];
  const isOverridden = (k) => ov[k] != null;

  return {
    ...stats,
    // metadados / valores não sobrescrevíveis
    calc,                 // valores calculados (antes do override)
    isOverridden,
    maestria: bt,
    almaMult,
    modTecnica,
    tecnicaAttr,
    totalAptidao,               // orçamento de NÍVEIS de aptidão (para no ND 20)
    totalAptidoesAmaldicoadas,  // quantas pode ter (só da Habilidade Geral Aptidão, 0 sem ela)
    aptidao,              // níveis por trilha: { alocado, concedido, efetivo, gastos }
    feiticos,             // { nivelMax, gastos, cdBase } — o orçamento é o de baixo
    gerais,               // { escolhidas, gastos, ganhos, destravado, maxVezes, acesso, inacessiveis }
    efeitos: ef,          // Motor de Automação: { porCanal, porAlvo, detalhes, avisos }
    testes,               // { pericias, resistencias, ataques, orcamento, atencao }
    dano,                 // { entradas: [{ id, nome, fonte, texto, alcance, propriedades, partes }] }
    partes,               // fontes de cada stat, para o hover da UI
    orcamentoHabilidades, // contador ÚNICO da aba: Feitiços + Habilidades Gerais
    especializacoes,      // { escolhidas, total, max, obrigatoria, completa, erro }
    habilidades,          // { escolhidas, total, gastos, restante, excedeu, inacessiveis, niveisPorEspec }
    talentos,             // { escolhidas, gastos, inacessiveis } — gasto já somado em habilidades.gastos
    altoNivel,            // { ativo, melhorias, lendarias, escolhas, apiceId } — orçamentos próprios
    invocacoes,           // { lista, total, custoTotal, temWarnings }
    hordas,               // { lista, total, custoTotal } (líder + membros escalados)
    focosTotais,          // orçamento de Focos de interlúdio = ND + bônus de poderes
    treino,               // contribuições agregadas dos Treinamentos (hp/pe/movimento/aptidao/defesa)
    nd, tipo, patamar,
    mods: { forca: modFor, destreza: modDes, constituicao: modCon, inteligencia: modInt, sabedoria: modSab, presenca: modPre },
    attrEff,              // valor EFETIVO por atributo (base + efeitos, teto 30 salvo furaTeto)
    attrPermanente,       // o que os PRÉ-REQUISITOS enxergam (sem os efeitos temporários)
    attrLimiteEfetivo,    // limite por atributo (base + Desenvolvimento, teto 30)
    attrDesenv: desenv,   // pontos de Desenvolvimento Inesperado por atributo
    attrBonus,            // bônus de atributo da origem (efetivo)
    // ---------- Equipamentos ----------
    grauFeiticeiro: grau,  // { value, label, rank, ndMin } derivado do ND
    equip,                 // parcelas do equipamento (entradas, custoGasto, avisos...)
    carga,                 // { espacosUsados, cargaLimite, cargaMaxima, sobrecarregado... }
    rdFisico,              // RD Física (escudo). Canal separado da RD Geral.
    penalidadeDestreza: equip.penalidadeDestreza, // uniforme + escudos, cumulativos
    guarda: null,         // TODO: depende do contador de ataques consecutivos
  };
}
