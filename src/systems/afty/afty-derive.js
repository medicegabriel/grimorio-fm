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
import { resolveHabilidades, efeitosInvocacaoControlador } from "./afty-habilidades";
import { resolveTalentos } from "./afty-talentos";
import { resolveAltoNivel } from "./afty-alto-nivel";
import { resolveInvocacoesList, resolveHordasList } from "./afty-invocacoes";
import { resolveEquipamentos, resolveCarga, grauFeiticeiro } from "./afty-equipamentos";
import { nivelMaxFeitico } from "./afty-feiticos";
import { resolveTestes } from "./afty-pericias";
import {
  buildCriaturaDslContext, coletarEfeitosCriatura, coletarEfeitosMontante,
  aplicarEfeitos, valorCanal, furaTetoEm,
  ehAtributoPermanente, ehAtributoTemporario, ehEstagio2, mesclarEfeitos,
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
export const OVERRIDABLE = ["hp", "pe", "defesa", "cd", "rdGeral", "rdEspecifico", "movimento", "resParcial", "atencao"];

const INT = (x) => Math.floor(x); // INT() da planilha (ND > 0 → floor)

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

  // Níveis de aptidão por trilha: alocado (pago) + concedido (grátis, direcionado).
  const aptidao = resolveNiveisAptidao(creature?.aptidoes, treino.aptidaoTrilha);

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
  const efeitosTodos = coletarEfeitosCriatura({ habilidades, talentos: talentosPre, altoNivel });
  const montarCtx = (attrs, mods) => buildCriaturaDslContext({
    nd, bt, grauRank: grau.rank, patamar, tipo, almaAtual,
    attrEff: attrs, mods, modTecnica: mods[tecnicaAttr] ?? 0,
    aptidao: aptidao.efetivo, nivelEspec,
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
    efMontanteSemAtributo, efAttrPerm, efAttrTemp,
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
  const cdTipo =
    tipo === "conjurador" ? INT(nd / 1.25) :
    tipo === "misto" ? INT(nd / 1.5) :
    /* combatente | restringido */ INT(nd / 1.75);
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
  const defTipo =
    tipo === "conjurador" ? INT(nd / 1.75) :
    tipo === "misto" ? INT(nd / 1.5) :
    /* combatente | restringido */ INT(nd / 1.25);
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
    bonusVagas: canal("vagasPericia"),
  });

  // ---------- Atenção = 10 + bônus de Percepção (Percepção passiva) ----------
  const atencao = testes.atencao;

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

  // ---------- overrides de valor final (aba Cálculos) ----------
  const calc = { hp, pe, defesa, cd, rdGeral, rdEspecifico, movimento, resParcial, atencao };
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
