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

// Avaliador da DSL. Só o editor do Funcionamento Básico o usa aqui, para
// reexibir o valor de cada linha: a aplicação de verdade é do `aplicarEfeitos`.
import { evalNumber as evalNumberDsl } from "../../components/fm-dsl";
import { AFTY_RESISTENCIAS } from "./afty-schema";
import {
  ATTR_KEYS, ATTR_LABEL, ATTR_LIMITE_PADRAO, ATTR_LIMITE_MAX, ATTR_LIMITE_ABSOLUTO,
} from "./afty-atributos";
import {
  resolveOrigemAttrBonus, resolveDesenvolvimento, resolveEscolhasOrigem,
  limiteAtributoDaOrigem, resolveLimitePoolOrigem, origensQualificadas,
  fatorSlotsHabilidade,
} from "./afty-origens";
import { efeitosDeTreino } from "./afty-treinamentos";
import { resolveNiveisAptidao, trilhasDaOrigem, AFTY_APTIDOES } from "./afty-aptidoes";
import {
  efeitosDoDominio, listaDominios, resolveVersao as resolveVersaoDominio,
  duracaoDominio, areaDominio, custoDominio, pvBarreira, maxEfeitos, vagasUsadas,
  textoDoDominio,
} from "./afty-dominios";
import { resolveEspecializacoes, AFTY_ESPECIALIZACOES } from "./afty-especializacoes";
import {
  resolveHabilidades, efeitosInvocacaoControlador, getHabilidade, OPCAO_ESCOLHA_NOME,
  AFTY_HABILIDADES,
  resolveArmasDedicadas, efeitosArmasDedicadas, resolveEmpolgacao,
} from "./afty-habilidades";
import { resolveTalentos, getTalento, OPCAO_TALENTO_NOME, AFTY_TALENTOS } from "./afty-talentos";
import {
  resolveAltoNivel, getMelhoriaSuperior, getHabilidadeLendaria, getHabilidadeApice,
} from "./afty-alto-nivel";
import { resolveInvocacoesList, resolveHordasList } from "./afty-invocacoes";
import {
  resolveEquipamentos, resolveCarga, grauFeiticeiro, alcanceDaArma, propriedadesDaArma,
  podeSerArmaDedicada, grauDoRank,
} from "./afty-equipamentos";
import { nivelMaxFeitico, resumoFeiticos } from "./afty-feiticos";
import { resolveTestes, resolveDano, catalogoPericiasDaFicha } from "./afty-pericias";
import { resolveCura } from "./afty-cura";
import {
  buildCriaturaDslContext, coletarEfeitosCriatura, coletarEfeitosMontante, coletarEfeitosOrigem,
  coletarEfeitosAptidao,
  aplicarEfeitos, resolverExclusivos, valorCanal, furaTetoEm, efeitosDaTecnica, efeitosDosPassivos,
  efeitosDaSessao, EFEITO_CANAIS,
  ehAtributoPermanente, ehAtributoTemporario, ehEstagio2, ehPreContexto,
  mesclarEfeitos, detalhesDoCanal,
} from "./afty-efeitos";
import { resolveGerais, contadorHabilidades, GERAL_BY_ID } from "./afty-gerais";
import { resolveCombate, degrausBrutalidade } from "./afty-combate";

export const mod = (attr) => Math.floor(((attr ?? 10) - 10) / 2);

// Maestria == Treinamento (mesmo valor), por faixa de ND.
// Até o 21 a faixa é de 4 em 4 níveis; do 21 em diante, de 5 em 5
// (21, 26, 31, 36). Os dois últimos degraus vieram do autor em 2026-07-27.
export const maestria = (nd) => {
  if (nd >= 36) return 10;
  if (nd >= 31) return 9;
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
export const OVERRIDABLE = ["hp", "pe", "defesa", "cd", "rdGeral", "rdEspecifico", "rdAlma", "movimento", "resParcial", "atencao", "iniciativa"];

const INT = (x) => Math.floor(x); // INT() da planilha (ND > 0 → floor)

/**
 * As FAMÍLIAS de variável do DSL, completas.
 *
 * ⚠ Existe porque o `evalNumber` da 2.5.2 não trata identificador desconhecido:
 * a expressão inteira cai no fallback, calada. Sem isto, `2 + (esc_combatente
 * >= 8)` numa criatura sem Combatente daria 0 em vez de 2, e o Roubo de
 * Habilidade (Restringido 2°), que importa habilidade de outra classe, nunca
 * funcionaria. Montado uma vez, dos catálogos, e passado ao contexto.
 */
const VOCABULARIO_DSL = {
  pericias: [],
  resistencias: AFTY_RESISTENCIAS.map((r) => r.value),
  // `tem_*` cobre Habilidade, Talento E Aptidão: os Estilos de Combate leem
  // `tem_tal_adepto_de_combate` para saber se vieram pelo Talento, e o
  // Revestimento Evoluído (Maldição) lê `tem_mal_revestimento` para saber sobre
  // o que ele está melhorando. Os prefixos de id não colidem entre os três.
  habilidades: [
    ...AFTY_HABILIDADES.map((h) => h.id),
    ...AFTY_TALENTOS.map((t) => t.id),
    ...AFTY_APTIDOES.map((a) => a.id),
  ],
  especializacoes: AFTY_ESPECIALIZACOES.map((e) => e.id),
  // Toda booleana de escolha de Aptidão que pode existir, para nenhuma
  // expressão que a cite cair no fallback por ela não estar declarada.
  opcoesAptidao: AFTY_APTIDOES.flatMap((a) =>
    (a.opcoes?.valores ?? []).map((v) => `opt_${a.id}_${v.id}`)),
};

/**
 * @param creature ficha (só escolhas)
 * @param opcoes   ajustes de JOGO, que o CRIADOR nunca passa:
 *   • almaAtual — Integridade da Alma CORRENTE. Ver a nota do `almaMult` abaixo.
 */
export function deriveAfty(creature, opcoes = {}) {
  const core = creature?.core ?? {};
  const a = creature?.attributes ?? {};
  const ov = creature?.statOverrides ?? {};
  const vocabularioDsl = {
    ...VOCABULARIO_DSL,
    pericias: catalogoPericiasDaFicha(creature).map((p) => p.id),
  };

  const tipo = core.tipo || "combatente";
  // ⚠ O RESTRINGIDO NÃO TEM ENERGIA AMALDIÇOADA (autor, 2026-07-29). É a
  // definição da origem ("nascem com uma quantidade quase nula de energia").
  // Mas o RECURSO É O MESMO (autor, 2026-07-29): Ponto de Estamina e Ponto de
  // Energia são ambos PE, mesma pilha e mesmo valor, só com nome diferente na
  // boca do Restringido. Toda habilidade que diz "gaste PE" ele paga em
  // Estamina. O que a falta de energia amaldiçoada tira é a parte de APTIDÃO:
  // nenhum Nível de Aptidão e nenhuma Aptidão Amaldiçoada.
  // Segue o TIPO, e não a origem, porque o Tipo é quem dirige toda fórmula e a
  // origem Restringido já o força.
  const semEnergia = tipo === "restringido";
  // Nome do recurso na UI. O número é o mesmo dos outros Tipos.
  const recursoLabel = semEnergia ? "Estamina" : "Energia";
  const patamar = core.patamar || "comum";
  const nd = Math.max(1, core.nd ?? 1);
  // ⚠ A ficha do criador é sempre montada com a alma ÍNTEGRA (autor,
  // 2026-07-29): o campo "Integridade da Alma" saiu do formulário, porque o
  // Máximo da Alma já diz tudo, e dano na alma é coisa de jogo, não de criação.
  // Consequência: `almaMult` passou a seguir o MÁXIMO, então a Melhoria de Alma
  // e a Consciência Absoluta da Alma agora rendem PV de verdade (o multiplicador
  // era 1 fixo enquanto o campo ficava no 100 padrão).
  // O valor CORRENTE existe só no jogo, em `combatState.almaCurrent`.
  const almaMaxBase = creature?.alma?.max ?? 100;
  // A Alma que o DSL enxerga (`alma_atual`). No criador é o máximo, em jogo é o
  // corrente, e é o que faz um `quando: "alma_atual < 50"` significar algo. Sai
  // aqui em cima porque o contexto do DSL é montado bem antes de `almaMax`
  // existir (ele depende do canal, que depende do contexto).
  const almaAtualDsl = opcoes.almaAtual != null
    ? Math.max(0, Math.trunc(Number(opcoes.almaAtual) || 0))
    : almaMaxBase;
  const qntPE = creature?.qntPE || "normal";

  const attrBonus = resolveOrigemAttrBonus(creature);
  const nivelAlloc = creature?.attrNivel ?? {};
  const desenv = resolveDesenvolvimento(creature);
  // Pool que sobe SÓ o limite (Maldição). Irmão do desenvolvimento, e por isso
  // NÃO entra no `eff` lá embaixo: ele abre espaço, quem preenche é o jogador
  // com os pontos distribuíveis da origem.
  const limPool = resolveLimitePoolOrigem(creature);
  // Equipamento primeiro: os acessórios de atributo entram no cálculo do
  // efetivo. A CARGA não sai daqui, porque depende do mod de Força final.
  // BT antecipado só para as Cargas de Encantamento das Ferramentas (= BT).
  const bt = maestria(nd);                                          // Maestria == Treinamento
  const equip = resolveEquipamentos(creature, bt);

  // Limite EFETIVO por atributo = limite base (20 / poderes) + Desenvolvimento, teto 30.
  // O RESTRINGIDO eleva o limite dos FÍSICOS para 30: "Seu limite de atributo
  // para Força, Destreza e Constituição é 30 ao invés de 20" (Ápice Corporal
  // Humano). Vale o MAIOR entre o da ficha, o da origem e o do Tipo, para um
  // limite subido à mão nunca ser rebaixado.
  //
  // ⚠ Vem dos DOIS lados de propósito. A origem Restringido força o Tipo
  // Restringido, mas o Tipo pode ser escolhido sozinho na aba Informações, e o
  // autor confirmou (2026-07-29) que o limite é do Restringido, não de um
  // caminho específico até ele.
  const limBase = (creature?.attrLimite && typeof creature.attrLimite === "object") ? creature.attrLimite : {};
  const limTipo = tipo === "restringido"
    ? { forca: ATTR_LIMITE_MAX, destreza: ATTR_LIMITE_MAX, constituicao: ATTR_LIMITE_MAX }
    : {};
  // ⚠ Recebe a CRIATURA, e não o id: o limite do Gêmeo depende da morte do
  // irmão. Ele precisa estar aqui, no estágio 0, porque é aqui que o bônus de
  // atributo da própria origem é aparado.
  const limOrigem = { ...limiteAtributoDaOrigem(creature), ...limTipo };
  // Limite de ESTÁGIO 0: o que a ALOCAÇÃO respeita (base, pool de nível e bônus
  // de origem). O limite FINAL sai mais abaixo, somando o canal `limiteAtributo`
  // do Motor, que só existe depois de os catálogos serem resolvidos.
  const limiteBaseOf = (key) =>
    Math.min(
      Math.max(limBase[key] ?? ATTR_LIMITE_PADRAO, limOrigem[key] ?? 0)
        + (desenv[key] || 0) + (limPool[key] || 0),
      ATTR_LIMITE_MAX,
    );

  // Atributo EFETIVO = base + nível + Desenvolvimento + bônus de origem.
  // Atributos de ORIGEM NÃO passam o limite (salvo os que digam explicitamente — TODO).
  // base+nível+Desenvolvimento já cabem no limite por construção (o Desenvolvimento
  // eleva valor E limite juntos); o bônus de origem é limitado ao limite efetivo.
  // Acessório de atributo (Anéis do Conhecimento, Bracelete da Força...) é o
  // único bônus que PASSA o limite: o texto deles diz "podendo superar o seu
  // limite de atributo, até o máximo de 30". Por isso ele entra depois do
  // clamp do limite, contra o teto duro de 30.
  //
  // ⚠ O excedente do acessório é GUARDADO (`folgaEquip`), e não só somado: o
  // clamp do estágio 1 precisa saber quanto daquele valor está legitimamente
  // acima do limite, senão ele apararia o acessório de volta ao aparar o Motor.
  const folgaEquip = {};
  // Ponto de bônus PERDIDO no limite, por atributo. A convenção do projeto é a
  // origem ter prioridade e o ponto de nível voltar ao pool (o `nivMax` do
  // builder reserva o espaço), então a parcela de estágio 0 normalmente é zero.
  // A do estágio 1 (Motor) não é: Pináculo Físico num Restringido de Força 30 não
  // tem para onde ir. O builder avisa em vez de esconder.
  const perdaNoLimite = {};
  const eff = (key) => {
    const somado = (a[key] ?? 10) + (nivelAlloc[key] || 0) + (desenv[key] || 0) + (attrBonus[key] || 0);
    const dentroDoLimite = Math.min(somado, limiteBaseOf(key));
    perdaNoLimite[key] = somado - dentroDoLimite;
    const comEquip = Math.min(dentroDoLimite + (equip.attrBonus[key] || 0), ATTR_LIMITE_MAX);
    folgaEquip[key] = comEquip - dentroDoLimite;
    return comEquip;
  };

  // Atributo e modificador BASE: tudo menos os efeitos de habilidade. É o que
  // os pré-requisitos e as expressões do Motor leem, para uma habilidade que
  // concede atributo não morder a própria conta.
  const attrBase = {
    forca: eff("forca"), destreza: eff("destreza"), constituicao: eff("constituicao"),
    inteligencia: eff("inteligencia"), sabedoria: eff("sabedoria"), presenca: eff("presenca"),
  };
  const modBase = Object.fromEntries(Object.entries(attrBase).map(([k, v]) => [k, mod(v)]));

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
    nd, bt, grauRank: grau.rank, patamar, tipo, almaAtual: almaAtualDsl,
    irmaoMorto: !!creature?.core?.origem?.irmaoMorto,
    iniciativaIrmao: creature?.core?.origem?.iniciativaIrmao,
    attrEff: attrBase, mods: modBase, modTecnica: modBase[tecnicaAttr] ?? 0, tecnicaAttr,
    periciasProf: creature?.pericias,
    // O vocabulário entra AQUI TAMBÉM: o contexto reduzido não tem `esc_*` nem
    // `tem_*`, e sem eles declarados uma expressão que os citasse cairia inteira
    // no fallback, calada. Origem não escala com classe, então zero é a resposta
    // certa — mas ela precisa ser dada, não silenciada.
    vocabulario: vocabularioDsl,
  });
  // ORIGEM entra no montante junto do resto: ela concede vaga de habilidade, de
  // perícia, de feitiço e de aptidão, e vaga é lida antes de os stats existirem.
  // As escolhas aninhadas dela (Treinamentos de Clã, Empenho Implacável) saem
  // primeiro porque carregam efeito próprio.
  const escolhasOrigem = resolveEscolhasOrigem(creature, nd);
  // Nenhuma das cinco fontes do pool exclusivo alimenta o montante (elas dão
  // stat, não orçamento), mas a resolução entra aqui do mesmo jeito: sem ela um
  // exclusivo que aparecesse por engano sairia da soma e nunca voltaria.
  const efMontante = resolverExclusivos(aplicarEfeitos(
    [
      ...efeitosDeTreino(creature),
      ...coletarEfeitosOrigem(creature, escolhasOrigem),
      ...coletarEfeitosMontante(creature, gerais, GERAL_BY_ID),
    ],
    ctxMontante,
  ));
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
  // Vaga EXCLUSIVA de Talento (autor, 2026-08-03): o Talento Natural do Inato
  // dava vaga COMUM, e assim uma característica que o livro escreve como "um
  // Talento à escolha" pagava Habilidade de Especialização qualquer.
  const vagasTalento = valorCanal(efMontante, "vagasTalento");

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
  // Mais de uma quando o Gêmeo copia uma origem em Verdadeiras Origens.
  const origensQuali = origensQualificadas(creature);
  const talentosPre = resolveTalentos(creature, {
    nd, attrEff: attrBase, origemId, origensQualificadas: origensQuali, especializacoes: especializacoes.escolhidas,
  });
  // bt entra por causa do Roubo de Habilidade, cujo limite de repetições é o
  // Bônus de Treinamento. O último parâmetro são as vagas extras da Habilidade
  // Geral Especialização.
  const habilidades = resolveHabilidades(
    creature, especializacoes.escolhidas, talentosPre.gastos, bt, vagasHabilidade, vagasTalento,
    { nd, almaLivreEspecializacao: talentosPre.almaLivreEspecializacao },
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
  if (habilidades.almaLivre?.habilidadeId) {
    nivelEspec[habilidades.almaLivre.especializacaoId] = {
      real: habilidades.almaLivre.nivel,
      escalonamento: habilidades.almaLivre.nivel,
    };
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
  // Armas carregadas e as Dedicadas (Lutador 2°). Sobem para cá porque a
  // dedicação EMITE efeito (nível de dano e a propriedade Marcial), e efeito
  // tem de entrar no mesmo bolo dos outros, antes dos estágios.
  //
  // ⚠ É "arma EQUIPADA" desde 2026-08-01, quando a arma ganhou botão de equipar
  // na aba Equipamentos. Antes era toda arma CARREGADA, porque não havia como
  // equipar uma. Com o Acerto por grau entrando na linha, carregar uma arma na
  // mochila não pode mais render número.
  const armasCarregadas = equip.entradas.filter((e) => e.tipo === "arma" && e.equipado);
  // Grau de CÁLCULO da Ferramenta: cada encantamento desce um degrau, e o rank 0
  // não é grau nenhum (vira "desarmado" na tabela de dano adicional).
  const grauCalcDaArma = (e) => (e.fa ? (grauDoRank(e.fa.rankCalculo)?.value ?? null) : null);
  // Faixas e Manoplas (grupo pugilato) não viram linha: são o Ataque Básico.
  const armasParaDano = armasCarregadas
    .filter((e) => e.def?.grupo !== "pugilato")
    .map((e) => ({
      id: e.def.id,
      nome: e.def.nome,
      grauArma: grauCalcDaArma(e),
      // Acerto DESTA arma: +1 por grau da Ferramenta mais o que o encantamento
      // Precisa somar (autor, 2026-08-01). Fica na linha e não no Ataque da
      // categoria, senão o bônus vazaria para as outras armas.
      acertoGrau: e.fa?.acertoArma ?? 0,
      fontesAcerto: e.fa?.fontesAcerto ?? [],
      fineza: !!e.def.props?.fineza,
      critico: e.def.critico ?? 20,
      distancia: e.def.categoria === "distancia" || e.def.categoria === "arremesso",
      // Categoria e grupo alimentam os escopos de alvo (`cat:arremesso`,
      // `grupo:espada`), que é como o Combatente mira classes de arma inteiras.
      categoria: e.def.categoria ?? null,
      grupo: e.def.grupo ?? null,
      // Tipo de dano da arma (ct, im, pf), que é como os Especialistas em
      // Cortes, Concussão e Perfuração (Talentos) miram.
      tipoDano: e.def.dano?.tipo ?? null,
      alcance: alcanceDaArma(e.def),
      propriedades: propriedadesDaArma(e.def),
      elegivelDedicada: podeSerArmaDedicada(e.def),
    }));
  // O Ataque Básico só sobe de grau com Manoplas ou Faixas (autor, 2026-07-27).
  // Sem elas é Desarmado, que não soma nada. Com as duas vale o grau mais alto,
  // e é o grau de CÁLCULO que compara, porque é ele que vira número.
  const pugilato = armasCarregadas
    .filter((e) => e.def?.grupo === "pugilato" && e.fa)
    .sort((x, y) => (y.fa.rankCalculo - x.fa.rankCalculo))[0] ?? null;
  const grauBasico = pugilato ? grauCalcDaArma(pugilato) : null;
  const acertoGrauBasico = pugilato?.fa?.acertoArma ?? 0;
  const dedicadas = resolveArmasDedicadas(creature, armasParaDano, habilidades.escolhidas);

  const efeitosTodos = [
    ...coletarEfeitosCriatura({
      habilidades, talentos: talentosPre, altoNivel,
      catalogos: {
        habilidades: getHabilidade, talentos: getTalento,
        // Um mapa só para as opções dos dois catálogos: os ids não colidem
        // (prefixo `lut_`/`cmb_`/`res_` contra `tal_`).
        opcoes: { ...OPCAO_ESCOLHA_NOME, ...OPCAO_TALENTO_NOME },
        altoNivel: (id) => getMelhoriaSuperior(id) || getHabilidadeLendaria(id) || getHabilidadeApice(id),
      },
    }),
    // Direcionados por uma escolha que mora FORA do card da habilidade (a
    // marcação na linha de dano). Mesmo padrão do efeitosDeTreino.
    ...efeitosArmasDedicadas(dedicadas),
    // Funcionamento Básico da técnica: os únicos efeitos ESCRITOS pelo jogador,
    // porque a técnica é única no mundo e nenhum catálogo a cobre. Entram no
    // mesmo bolo, e os filtros de estágio abaixo roteiam pelo canal.
    ...efeitosDaTecnica(creature),
    // Passivos / Características criados pelo jogador usam o mesmo Motor, mas
    // entram na família exclusiva própria dos Feitiços Passivos.
    ...efeitosDosPassivos(creature),
    // Buffs de MESA, escritos na Ficha Final durante o jogo. Mesmo shape do
    // Funcionamento Básico, e por isso entram na mesma linha. Só existem quando
    // a Ficha injeta `buffsSessao`: o criador nunca os vê.
    ...efeitosDaSessao(creature),
    // Habilidade Única da Ferramenta equipada, a primeira das cinco fontes do
    // pool exclusivo a chegar no Motor. Já vem com o valor resolvido no contexto
    // do item (a expressão dela lê `grau`) e com `exclusivo` carimbado.
    ...equip.efeitosUnica,
    // Encantamentos das Ferramentas equipadas. Passaram a entrar pelo Motor em
    // 2026-08-01, no lugar de somarem em escalar: era o teto de sete canais que
    // mantinha metade deles como texto morto. Sem `exclusivo`, porque
    // encantamento soma normal e não é fonte do pool exclusivo.
    ...equip.efeitosEncantamento,
    // Aptidões Amaldiçoadas (2026-07-30). As de bancada leem `au` e `cl`, que
    // são variáveis do contexto principal, então caem todas no estágio 2.
    ...coletarEfeitosAptidao(creature, semEnergia),
  ];

  // Estágio 0b: os canais que ALIMENTAM o contexto principal. Só nível de
  // aptidão por ora, porque `dom/au/cl/bar/er` são variáveis do DSL e uma
  // habilidade que concede trilha tem de entrar antes de o contexto existir.
  // Mesma regra do estágio de atributo: dentro dele um efeito não vê o irmão.
  const efPreContexto = resolverExclusivos(aplicarEfeitos(efeitosTodos.filter(ehPreContexto), ctxMontante));

  // ---------- LIMITE EFETIVO DE ATRIBUTO (final) ----------
  // Agora sim: limite de estágio 0 (20 / ficha / Origem / Desenvolvimento) mais o
  // canal `limiteAtributo`, que chega de dois lugares. Do `efMontante` vem o
  // Treino de Atributo Completo, e do `efPreContexto` vêm as fontes que dizem
  // "o valor E o limite" (Incremento de Atributo, Quebra de Limites e o
  // Aperfeiçoamento de Atributo).
  const limiteMotorDe = (key) =>
    (efMontante.porAlvo.limiteAtributo?.[key] || 0) + (efPreContexto.porAlvo.limiteAtributo?.[key] || 0);
  // Teto do sistema por atributo: 30 para todo mundo, 32 onde o Aperfeiçoamento
  // de Atributo bateu. É o ÚNICO `furaTeto` do sistema, e ele vale tanto para o
  // limite quanto para o valor (o autor confirmou em 2026-07-29 que a Lendária
  // sobe as DUAS coisas em 2, então num atributo de limite 30 ela leva a 32).
  const tetoSistemaDe = (key) =>
    furaTetoEm(efPreContexto, key) || furaTetoEm(efMontante, key)
      ? ATTR_LIMITE_ABSOLUTO
      : ATTR_LIMITE_MAX;
  const attrLimiteEfetivo = Object.fromEntries(
    ATTR_KEYS.map((k) => [k, Math.min(limiteBaseOf(k) + limiteMotorDe(k), tetoSistemaDe(k))]),
  );

  // Níveis de aptidão por trilha: alocado (pago) + concedido (grátis,
  // direcionado). A concessão vem de dois lados, Treinamento e Habilidade.
  const trilhasConcedidas = { ...treino.aptidaoTrilha };
  for (const [k, v] of Object.entries(efPreContexto.porAlvo.nivelAptidao || {})) {
    trilhasConcedidas[k] = (trilhasConcedidas[k] || 0) + v;
  }
  // TETO por trilha: 5 mais o canal `limiteAptidao`. Chega dos mesmos dois
  // lugares do nível, porque as regras que quebram o teto emitem os dois canais
  // juntos (as duas Habilidades que dão "+1 podendo passar de 5", e a Expansão
  // de Domínio, que dá +2 em Aura, Controle e Leitura e Energia Reversa).
  const trilhasLimite = {};
  for (const fonte of [efMontante.porAlvo.limiteAptidao, efPreContexto.porAlvo.limiteAptidao]) {
    for (const [k, v] of Object.entries(fonte || {})) trilhasLimite[k] = (trilhasLimite[k] || 0) + v;
  }
  // Restringido não tem Nível de Aptidão nenhum: entra com a alocação vazia e
  // sem concessão, para as variáveis `dom/au/cl/bar/er` do DSL saírem zeradas
  // junto. Uma ficha que trocou de Tipo depois de alocar não fica mentindo.
  // Trilhas que a ORIGEM tem: a Maldição não possui Energia Reversa.
  const trilhasOrigem = trilhasDaOrigem(core?.origem?.id);
  const aptidao = semEnergia
    ? resolveNiveisAptidao(null, {}, null)
    : resolveNiveisAptidao(creature?.aptidoes, trilhasConcedidas, trilhasLimite, trilhasOrigem);

  // ---------- SIMULAÇÃO DE COMBATE ----------
  // Bancada de balanceamento (autor, 2026-07-28). Vira variável de DSL, e as
  // habilidades com `quando` ligam e desligam sozinhas. Os tetos dependem da
  // ficha, por isso saem daqui e não do módulo de combate.
  // `empolgacaoMaxima` sai do estágio 0b junto do nível de aptidão, e por isso
  // já está resolvido aqui: ele troca a tabela de dados de Empolgação, e a
  // média do dado é o que as Manobras de Empolgação somam.
  const nivelCmb = habilidades.niveisPorEfeito?.combatente ?? 0;
  const nivelRes = habilidades.niveisPorEfeito?.restringido ?? 0;

  // ---------- Expansão de Domínio ----------
  // ⚠ Entra numa SEGUNDA lista, e não no `efeitosTodos` lá de cima, por ordem de
  // declaração: os valores do domínio saem das tabelas indexadas pelo DOM, e o
  // `aptidao` só existe aqui. Os dois estágios que consomem efeito (atributo e o
  // resto) rodam depois deste ponto, então nenhum deles perde nada. O único que
  // roda ANTES é o pré-contexto, e o domínio não escreve em canal nenhum dele.
  const efeitosDominio = semEnergia ? [] : efeitosDoDominio(creature, {
    dom: aptidao.efetivo?.dom ?? 0,
    aptidoesEscolhidas: creature?.aptidoesAmaldicoadas ?? [],
  });
  const efeitosComDominio = efeitosDominio.length ? [...efeitosTodos, ...efeitosDominio] : efeitosTodos;

  // Resumo pronto para a aba Habilidades: cada expansão com os números que o
  // card mostra. A UI não recalcula nada, ela só exibe.
  const resumoDominios = (() => {
    const aptidoesIds = semEnergia ? [] : (creature?.aptidoesAmaldicoadas ?? []);
    const domNivel = aptidao.efetivo?.dom ?? 0;
    const barNivel = aptidao.efetivo?.bar ?? 0;
    const paredesResistentes = aptidoesIds.includes("paredes_resistentes");
    return {
      domNivel,
      barNivel,
      paredesResistentes,
      temAcertoGarantido: aptidoesIds.includes("acerto_garantido"),
      maxEfeitos: maxEfeitos(domNivel),
      ativoId: creature?.dominioAtivoId ?? null,
      lista: listaDominios(creature).map((d) => {
        const versao = resolveVersaoDominio(d, aptidoesIds);
        const comAG = !!d.acertoGarantido?.ativo;
        return {
          ...d,
          versao,
          custo: custoDominio(versao, comAG),
          duracao: duracaoDominio(domNivel, versao),
          area: areaDominio(versao, bt),
          pvBarreira: pvBarreira(barNivel, nd, paredesResistentes),
          vagasUsadas: vagasUsadas(d.efeitos),
          texto: textoDoDominio(d, { dom: domNivel, nd, bt, bar: barNivel, versao, paredesResistentes }),
        };
      }),
    };
  })();

  const combate = resolveCombate(creature, {
    brutalidadePE: degrausBrutalidade({ habilidades }),
    brutalidadePilha: bt,
    empolgacaoMaxima: valorCanal(efPreContexto, "empolgacaoMaxima") > 0,
    devastacaoPilha: bt,
    precisaoPE: 1 + Math.floor(nivelCmb / 4),
    pistoleiroEmperrar: habilidades.escolhidas.includes("cmb_pistoleiro_avancado") ? 6 : 2,
    adrenalinaAtletismo: habilidades.escolhidas.includes("res_restricao_definitiva") ? 8 : 4,
    cacadorFeiticeiros: 1 + Math.floor(nivelRes / 5),
    corpoDeAco: 1 + (nivelRes >= 10 ? 1 : 0) + (nivelRes >= 15 ? 1 : 0),
    // Tetos das faixas das Aptidões: os dois dependem do Nível de Aptidão em
    // Controle e Leitura, que só existe depois do resolveNiveisAptidao.
    cobrirSePE: 2 + 2 * (aptidao.efetivo?.cl ?? 0),
    estimuloTeste: aptidao.efetivo?.cl ?? 0,
    // A Cura Amplificada troca "1 + metade do nível" por "1 + o nível", e a Cura
    // em Grupo soma +2 no teto ("a quantidade máxima de pontos que podem ser
    // gastos aumenta em 2"). Confirmado pelo AppScript do autor (2026-07-30).
    fluxoPER: (() => {
      const ids = creature?.aptidoesAmaldicoadas ?? [];
      const er = aptidao.efetivo?.er ?? 0;
      return 1 + (ids.includes("cura_amplificada") ? er : Math.floor(er / 2))
        + (ids.includes("cura_em_grupo") ? 2 : 0);
    })(),
    // Regeneração Corporal (Maldição): "a quantidade máxima de pontos que podem
    // ser gastos passa a ser igual ao seu bônus de treinamento por rodada", que
    // a Regeneração Ampliada dobra. Irmão do fluxoPER, com PE no lugar de PER.
    regeneracaoPE: (creature?.aptidoesAmaldicoadas ?? []).includes("mal_regeneracao_ampliada")
      ? 2 * bt : bt,
    // Um interruptor por Habilidade Única marcada como ativa. Vêm da ficha, e
    // não do catálogo de estados, porque são instâncias de item.
    estadosExtras: equip.estadosUnica,
  });

  const montarCtx = (attrs, mods) => buildCriaturaDslContext({
    nd, bt, grauRank: grau.rank, patamar, tipo, almaAtual: almaAtualDsl,
    irmaoMorto: !!creature?.core?.origem?.irmaoMorto,
    iniciativaIrmao: creature?.core?.origem?.iniciativaIrmao,
    attrEff: attrs, mods, modTecnica: mods[tecnicaAttr] ?? 0, tecnicaAttr,
    aptidao: aptidao.efetivo, nivelEspec, periciasProf: creature?.pericias,
    resistenciasProf: creature?.resistenciasProf, combate,
    aptidaoOpcoes: semEnergia ? {} : creature?.aptidaoOpcoes,
    rdEscudoBase: equip.rdEscudoBase,
    // `tem_*` inclui Talentos e Aptidões escolhidos, não só as Habilidades.
    // ⚠ A lista de aptidões respeita o `semEnergia`: um Restringido não tem
    // Aptidões, e `tem_*` não pode dizer que tem.
    habilidadesEscolhidas: [
      ...habilidades.escolhidas,
      ...(talentosPre.escolhidas ?? []),
      ...(semEnergia ? [] : (Array.isArray(creature?.aptidoesAmaldicoadas) ? creature.aptidoesAmaldicoadas : [])),
    ],
    vocabulario: vocabularioDsl,
  });
  // Soma um canal de atributo sobre uma base, aparando nos TRÊS tetos do sistema
  // (ver o topo de afty-atributos.js).
  //
  // ⚠ ATÉ 2026-07-29 ISTO APARAVA EM 30, e não no limite do atributo. Era o bug
  // que deixava 36 efeitos do Motor mais o Treino de Atributo furarem o 20
  // calados. O limite do atributo é o teto normal, o 30 é o do sistema, e só o
  // Aperfeiçoamento de Atributo (`furaTeto`) chega ao 32.
  //
  // O acessório de atributo entra pela `folgaEquip`: o texto dele diz "podendo
  // superar o seu limite de atributo, até o máximo de 30", então ele levanta o
  // teto DAQUELE atributo pelo tanto que já contribuiu, sem levantar o do Motor.
  //
  // ⚠ O teto NUNCA DERRUBA o que já estava acima dele: como esta função roda
  // duas vezes (permanente e depois temporário), aparar cru no segundo passo
  // desfaria um furaTeto legítimo do primeiro. O que o teto impede é SUBIR além
  // dele, não estar além dele.
  // ⚠ NÃO há caminho separado para o `furaTeto` (revisto em 2026-07-29). Ele
  // deixou de ser "esta parcela fura o teto" e passou a ser "o teto DESTE
  // atributo é 32", porque o Aperfeiçoamento sobe o limite junto do valor. Com o
  // limite subindo, a parcela cabe pelo caminho normal, e a carona que a versão
  // anterior evitava virou o comportamento certo: quem levanta o limite levanta
  // para toda fonte, igual ao Incremento de Atributo e à Quebra de Limites.
  const somarAtributo = (partida, res) => {
    const out = {};
    for (const k of Object.keys(partida)) {
      const total = valorCanal(res, "atributo", k);
      const teto = Math.min(attrLimiteEfetivo[k] + (folgaEquip[k] || 0), tetoSistemaDe(k));
      out[k] = Math.min(partida[k] + total, Math.max(teto, partida[k]));
      perdaNoLimite[k] = (perdaNoLimite[k] || 0) + (partida[k] + total - out[k]);
    }
    return out;
  };

  // Estágio 1a: atributo PERMANENTE, lendo o BASE. Dentro deste estágio um
  // efeito de atributo não vê o irmão, o que evita o laço A→B→A. O Treino de
  // Atributo (estágio 0) entra aqui junto, porque também é permanente.
  const efAttrPerm = resolverExclusivos(mesclarEfeitos(
    { porAlvo: { atributo: efMontante.porAlvo.atributo || {} } },
    aplicarEfeitos(efeitosComDominio.filter(ehAtributoPermanente), montarCtx(attrBase, modBase)),
  ));
  // Este é o atributo que os PRÉ-REQUISITOS enxergam.
  const attrPermanente = somarAtributo(attrBase, efAttrPerm);
  const modPermanente = Object.fromEntries(Object.entries(attrPermanente).map(([k, v]) => [k, mod(v)]));

  // Talentos de novo, agora com o atributo permanente: só o `inacessiveis` muda.
  const talentos = resolveTalentos(creature, {
    nd, attrEff: attrPermanente, origemId, origensQualificadas: origensQuali, especializacoes: especializacoes.escolhidas,
  });

  // Estágio 1b: atributo TEMPORÁRIO, por cima do permanente. Resulta no
  // atributo FINAL, que é o que a ficha mostra e o que os stats usam.
  // ⚠ O `efAttrPerm.aplicado` viaja para cá porque `atributo` é o ÚNICO canal que
  // o motor resolve em dois estágios. Sem ele, uma Habilidade Única permanente de
  // +6 de Força e um Feitiço Auxiliar temporário de +4 na mesma Força somariam
  // 10, quando a regra do pool exclusivo manda ficar com 6.
  const efAttrTemp = resolverExclusivos(
    aplicarEfeitos(
      efeitosComDominio.filter(ehAtributoTemporario),
      montarCtx(attrPermanente, modPermanente),
    ),
    efAttrPerm.aplicado,
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
  // A carga desceu para DEPOIS do agregado de efeitos (`ef`), logo abaixo: o
  // canal `espacosCarga` sobe o limite, e ele só existe com tudo mesclado.

  // Estágio 2: todo o resto, com o contexto REMONTADO nos atributos finais. É
  // aqui que "Defesa igual ao Mod. Força" enxerga a Força 20.
  // `efMontante` entra inteiro no agregado para os `detalhes` da UI mostrarem a
  // linha de treino como origem. O canal de atributo dele já foi consumido no
  // estágio 1a, então sai daqui para não somar duas vezes.
  const efMontanteSemAtributo = { ...efMontante, porAlvo: { ...efMontante.porAlvo } };
  delete efMontanteSemAtributo.porAlvo.atributo;
  // Os quatro primeiros já voltaram do `resolverExclusivos` com a lista vazia e
  // os vencedores somados, então a disputa que sobra aqui é só a do estágio 2. E
  // ela não precisa do `aplicado` dos estágios anteriores: `atributo` é o único
  // canal que roda antes daqui, e o filtro `ehEstagio2` justamente o exclui.
  const ef = resolverExclusivos(mesclarEfeitos(
    efMontanteSemAtributo, efPreContexto, efAttrPerm, efAttrTemp,
    aplicarEfeitos(efeitosComDominio.filter(ehEstagio2), montarCtx(attrEff, modByAttr)),
  ));
  const canal = (id, alvo = null) => valorCanal(ef, id, alvo);

  // Funcionamento Básico da técnica, RESOLVIDO linha a linha, só para o editor
  // mostrar quanto cada expressão vale enquanto o jogador digita. É reavaliação,
  // não segunda aplicação: quem entra na conta é o `efeitosTodos` acima. Roda com
  // o contexto FINAL, então uma expressão que lê `mod_forca` vê a Força fechada.
  const ctxTecnica = montarCtx(attrEff, modByAttr);
  // A Habilidade Unica da Ferramenta precisa mostrar o mesmo valor que entra no
  // Motor. O equipamento e carregado antes de os atributos fecharem, mas a
  // expressao permanece viva e e reavaliada aqui com o contexto FINAL. As
  // variaveis proprias do item, como `grau`, continuam sobrescrevendo as da
  // criatura somente para aquela expressao.
  const equipFinal = {
    ...equip,
    efeitosUnica: equip.efeitosUnica.map((efeito) => ({
      ...efeito,
      valor: evalNumberDsl(
        efeito.expr,
        { ...ctxTecnica, ...(efeito.contextoDsl || {}) },
        0,
      ),
    })),
    entradas: equip.entradas.map((entrada) => {
      if (!entrada.fa) return entrada;
      return {
        ...entrada,
        fa: {
          ...entrada.fa,
          habilidadeEfeitos: entrada.fa.habilidadeEfeitos.map((efeito) => ({
            ...efeito,
            valor: evalNumberDsl(
              efeito.expr,
              { ...ctxTecnica, ...(efeito.contextoDsl || {}) },
              0,
            ),
          })),
        },
      };
    }),
  };
  const resolverEfeitosEditaveis = (lista) => (Array.isArray(lista) ? lista : [])
    .map((e) => {
      const def = EFEITO_CANAIS.find((c) => c.id === e?.canal) || null;
      const expr = String(e?.expr ?? "").trim();
      return {
        canal: e?.canal ?? "", alvo: e?.alvo ?? "", expr,
        quando: e?.quando ?? "", duracao: e?.duracao ?? "permanente",
        // `alvoTipo` diz à UI qual vocabulário oferecer (atributo, perícia, tr...).
        alvoTipo: def?.alvo ?? null,
        nota: def?.nota ?? null,
        valor: expr ? evalNumberDsl(expr, ctxTecnica, 0) : 0,
        ativo: !e?.quando || evalNumberDsl(String(e.quando), ctxTecnica, 0) !== 0,
      };
    });
  const tecnicaEfeitos = resolverEfeitosEditaveis(creature?.core?.tecnicaEfeitos);
  const passivosEfeitos = Object.fromEntries(
    (Array.isArray(creature?.feiticos) ? creature.feiticos : [])
      .filter((f) => f?.tipo === "passivo")
      .map((f) => [f.id, resolverEfeitosEditaveis(f.efeitosPassivo)]),
  );

  // Alma: o teto (100 + Melhoria de Alma) e o multiplicador de PV. Sai aqui, e
  // não lá em cima, porque o canal `almaMax` só existe com os efeitos mesclados.
  //
  // ⚠ NO CRIADOR os dois são o MESMO número, porque a criatura é montada íntegra
  // (o campo de Integridade saiu do formulário em 2026-07-29). EM JOGO não: a
  // fórmula do autor é `HP × (Alma.Atual / 100)`, então uma criatura com a alma
  // em 60 tem 60% do PV máximo, e o número grande da Ficha tem de cair junto. A
  // Ficha Final passa `opcoes.almaAtual`, e sem ele nada muda para o criador.
  const almaMax = almaMaxBase + canal("almaMax");
  const almaMult = (opcoes.almaAtual != null ? almaAtualDsl : almaMax) / 100;

  // Carga: mod de Força já fechado (acessório + efeitos) e o limite já somado do
  // canal `espacosCarga` (Otimização de Espaço, Suporte 2°).
  const carga = resolveCarga(equip.espacosUsados, modFor, canal("espacosCarga"));

  // ---------- HP (+ Treino de Resistência) ----------
  const hpBase =
    tipo === "combatente" ? 12 + (nd - 1) * 6 :
    tipo === "restringido" ? 12 * nd :
    /* misto | conjurador */ 10 + (nd - 1) * 5;
  const hpPatamarMult = HP_PATAMAR_MULT[patamar] ?? 1;
  // O bônus de item ("os seus pontos de vida máximos aumentam em 10") entra
  // ANTES da Alma e do Patamar (autor, 2026-08-01), junto do treino e do canal
  // `hp` do Motor. Num Beyond, um item de +10 vale 40.
  const hp = Math.round(almaMult * (hpBase + nd * modCon + canal("hp") + equip.hpMaxBonus) * hpPatamarMult);

  // ---------- PE (+ Treinos de Compreensão/Controle de Energia/…) ----------
  // UMA pilha só, para todo mundo. O Restringido a chama de Ponto de Estamina
  // (ou vigor) e os outros de Ponto de Energia, mas a abreviação é PE nos dois
  // casos e a conta é a mesma. Por isso a base do Restringido bate na régua com
  // o texto de Restrito pelos Céus: "você inicia com 4 pontos de estamina, e
  // recebe mais 4 a cada nível" = 4 × ND, igual à do Combatente. A habilidade
  // NÃO soma esses 4 × ND de novo (ver res_restrito_pelos_ceus).
  const peBase =
    tipo === "conjurador" ? 6 * nd :
    tipo === "misto" ? 5 * nd :
    /* combatente | restringido */ 4 * nd;
  // A Quantidade de PE mede a energia amaldiçoada com que se nasce, e o
  // Restringido não tem nenhuma: o seletor some do formulário e a parcela é 0.
  const peQnt = semEnergia ? 0 :
    qntPE === "muito_pouca" ? -nd :
    qntPE === "pouca" ? -Math.floor(nd / 2) :
    qntPE === "grande" ? Math.floor(nd / 2) :
    qntPE === "muito_grande" ? nd : 0;
  const pe = peBase + peQnt + modTecnica + canal("pe");

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
  const movimento = 9 + maxForDex * 1.5 + carga.movimento + canal("movimento");

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

  // ---------- RD a Alma ----------
  // A RD Geral vale para todo tipo de dano EXCETO alma, então o Dano na Alma
  // tem canal próprio (autor, 2026-07-29). Nenhum Tipo nem Patamar concede base:
  // só existe quem tem um poder que dá (hoje o Talento Alma Inquebrável).
  const rdAlma = canal("rdAlma");

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
  // ⚠ O contador comum pode ser MULTIPLICADO pela origem. Só os Gêmeos têm
  // isso hoje: metade com o irmão vivo, uma vez e meia depois da morte dele.
  // Arredonda para baixo, como todo o resto do Afty.
  const contadorBase = contadorHabilidades(bt, patamar);
  const fatorSlots = fatorSlotsHabilidade(creature);
  const contadorComum = Math.floor(contadorBase * fatorSlots);
  // As fontes do contador, para o hover poder dizer de onde o número veio. Sem
  // isso o Gêmeo vê metade das vagas e nada explicando.
  const partesContador = [
    { label: "Maestria e Patamar", valor: contadorBase },
    ...(fatorSlots !== 1
      ? [{
        label: creature?.core?.origem?.irmaoMorto ? "Gêmeos: irmão morto" : "Gêmeos: irmão vivo",
        texto: `× ${String(fatorSlots).replace(".", ",")}`,
      }]
      : []),
  ];
  // Vagas EXCLUSIVAS de Feitiço (autor, 2026-07-28): "Você fornece um Slot de
  // Habilidade somente para Feitiços, não podendo ser usada em Habilidades
  // Gerais". Hoje só a Lendária Dominância em Técnica concede. Os Feitiços
  // gastam PRIMEIRO as exclusivas, e só o que sobrar cai no contador comum.
  const vagasFeitico = canal("vagasFeitico");
  const feiticosNoExclusivo = Math.min(feiticosGastos, vagasFeitico);
  const gastosNoComum = (feiticosGastos - feiticosNoExclusivo) + gerais.gastos;
  const contadorTotal = contadorComum + vagasFeitico;
  const contadorGastos = feiticosGastos + gerais.gastos;
  const orcamentoHabilidades = {
    total: contadorTotal,
    comum: contadorComum,
    partesComum: partesContador,
    exclusivasFeitico: vagasFeitico,
    exclusivasUsadas: feiticosNoExclusivo,
    feiticos: feiticosGastos,
    gerais: gerais.gastos,
    gastos: contadorGastos,
    gastosNoComum,
    restante: contadorTotal - contadorGastos,
    // O excesso é medido no contador COMUM: uma vaga exclusiva sobrando não
    // libera Habilidade Geral nenhuma.
    excedeu: gastosNoComum > contadorComum,
  };
  const feiticos = {
    nivelMax: nivelMaxFeitico(nd),
    gastos: feiticosGastos,
    cdBase: cd,
    // Resumo pronto de cada Feitiço, para o Preview só exibir (mesma convenção
    // do `resumoDominios`: a UI não recalcula nada). O card da aba Habilidades
    // segue chamando os `calcularFeitico*` por conta própria, porque ele precisa
    // do objeto INTEIRO do cálculo, e não do resumo.
    lista: resumoFeiticos(creature, {
      nd,
      cdBase: cd,
      modTecnica,
      efeitos: ef,
      habilidades: habilidades.escolhidas,
      temEnergiaReversa: !semEnergia
        && Array.isArray(creature?.aptidoesAmaldicoadas)
        && creature.aptidoesAmaldicoadas.includes("energia_reversa"),
      invocacoes: Array.isArray(creature?.invocacoes) ? creature.invocacoes : [],
    }),
  };

  // ---------- RD Física ----------
  // Canal separado de RD Geral e RD Específico. ⚠ O ESCUDO saiu daqui em
  // 2026-08-01: a RD dele virou RD Geral (ver rdGeral acima). Sobrou o que é
  // explicitamente físico, como o encantamento Reforçado ("contra dano
  // físico") e a Aura Reforçada.
  const rdFisico = canal("rdFisico");

  // ---------- Defesa / CA (+ uniforme, - sobrecarga; Treino de Luta ADIADO) ----------
  const divisorDefesa =
    tipo === "conjurador" ? 1.75 :
    tipo === "misto" ? 1.5 :
    /* combatente | restringido */ 1.25;
  const defTipo = INT(nd / divisorDefesa);
  const defesa = 10 + defTipo + modDes + bt + equip.uniformeDefesa + carga.defesa + canal("defesa");

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
    // Penalidade de armadura e escudo, cumulativa, em testes de perícia que
    // usam Destreza. Voltou a valer em 2026-08-01.
    penalidadeDestreza: equip.penalidadeDestreza,
  });

  // ---------- Dano (planilha do autor, 2026-07-27) ----------
  // Uma linha por FONTE: o Ataque Básico e mais uma para cada arma equipada.
  // Todas usam a MESMA conta, e o dano listado na tabela da arma é ignorado. Da
  // arma vêm o Alcance, as Propriedades e o grau da Ferramenta Amaldiçoada.
  // Faixas e Manoplas não viram linha própria: são o Ataque Básico (grupo
  // "pugilato"). O Nível de Aptidão em Controle e Leitura entra na conta, daí
  // depender do `aptidao` já resolvido lá em cima.
  const dano = resolveDano(creature, {
    nd, patamar, mods: modByAttr, aptidaoCL: aptidao.efetivo.cl,
    efeitos: ef, armas: armasParaDano, grauBasico, acertoGrauBasico,
    // Os Ataques já resolvidos, para cada linha fechar o Acerto dela: o ataque
    // da categoria mais o grau da arma daquela linha.
    ataques: testes.ataques,
  });

  // ---------- Cura (2026-08-03) ----------
  // Uma linha por FONTE, igual ao Dano, mas o número vem todo do Motor: cada
  // poder escreve a rolagem dele no próprio texto, e não há fórmula única que
  // as cubra. Ver afty-cura.js.
  //
  // ⚠ Roda DEPOIS do dano e do PV: as fontes que espelham ("uma rolagem do seu
  // dano desarmado") copiam a linha do Ataque Básico, e os dois itens que curam
  // uma fração do PV precisam do PV já fechado.
  const cura = resolveCura({
    efeitos: ef,
    // O `semEnergia` já zera as aptidões, então o Restringido não ganha linha de
    // Energia Reversa por engano.
    aptidoes: semEnergia ? [] : (Array.isArray(creature?.aptidoesAmaldicoadas) ? creature.aptidoesAmaldicoadas : []),
    habilidades: habilidades.escolhidas,
    itens: equip.entradas,
    hp,
    danoBasico: dano.entradas.find((e) => e.id === "basico") ?? null,
  });

  // ---------- Empolgação (Lutador) ----------
  // Só a parte DERIVADA: a tabela de dados e o nível em que o combate começa.
  // O nível atual é estado de combate e a ficha não o guarda (autor, 2026-07-28).
  const empolgacao = resolveEmpolgacao(habilidades.escolhidas, {
    maxima: canal("empolgacaoMaxima"),
    bonusInicial: canal("empolgacaoInicial"),
  });

  // ---------- Atenção = 10 + bônus de Percepção (Percepção passiva) ----------
  const atencao = testes.atencao + canal("atencao");

  // ---------- PV Temporário ----------
  // Casca por cima do PV, não PV máximo: some quando o efeito acaba. Hoje só a
  // simulação de combate produz (Fluxo, Brutalidade Aprimorada e Eliminar e
  // Continuar).
  const pvTemporario = canal("pvTemporario");

  // ---------- Recursos de especialização ----------
  // Pontos de Preparo (Combatente). Zero para quem não tem a habilidade dona, e
  // o Preview esconde. A Estamina do Restringido NÃO mora aqui: é o próprio PE
  // com outro nome, então tudo que a alimenta usa o canal `pe`.
  const pontosPreparo = canal("pontosPreparo");

  // ---------- Regeneração ----------
  // Cura no INÍCIO do turno, em dados + fixo, igual às linhas de dano.
  // Sobrevivente (Lutador 4°) rola d6 e Corpo de Aço (Restringido 6°) rola d8:
  // o canal do DADO carrega as faces, e vale a maior das fontes.
  // ⚠ O dado é MÁXIMO, não soma: `canal()` somaria 6 + 8 = 14 faces.
  const facesRegen = detalhesDoCanal(ef, "regeneracaoFaces").map((x) => x.valor);
  const regeneracao = {
    dados: Math.max(0, canal("regeneracaoDados")),
    dado: `d${Math.max(6, ...facesRegen)}`,
    fixo: canal("regeneracaoFixa"),
  };

  // ---------- Integridade da Alma ----------
  // O `atual` é estado da ficha e o máximo é 100, elevável pela Melhoria de
  // Alma. É o teto: passar dele é o que faz o multiplicador de PV subir de 1.

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
  // ⚠ `canal("pontosAptidao")`, e não `treino.aptidao`: o orçamento vinha só do
  // estágio MONTANTE (Treinamentos e Habilidades Gerais), então uma HABILIDADE
  // que concedesse ponto de aptidão era descartada calada. O Elevar Aptidão do
  // Conjurador ("você aumenta um dos seus Níveis de Aptidão em 1") foi quem
  // expôs isso. O `ef` já traz o montante mesclado, então não dobra.
  const totalAptidao = semEnergia ? 0 : (
    aptidaoThresholds.reduce((s, [t, v]) => s + (nd >= t ? v : 0), 0) +
    (qntPE === "muito_grande" ? 1 : 0) +
    canal("pontosAptidao"));

  // Quantas Aptidões Amaldiçoadas a criatura PODE ter: só o que a Habilidade
  // Geral Aptidão concedeu (regra 4 em afty-gerais.js, o ND não dá nenhuma).
  // Segue separado e independente do orçamento de NÍVEIS de aptidão
  // (totalAptidao, os limiares de ND), que não mudou.
  const totalAptidoesAmaldicoadas = semEnergia ? 0 : canal("vagasAptidao");

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
  const nivelControlador = nivelEspec.controlador?.escalonamento ?? 0;
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
  const rotulo = ATTR_LABEL;
  // `suplantado` viaja junto para o hover poder mostrar o perdedor do pool
  // exclusivo apagado, em vez de escondê-lo. Sem isso o jogador veria o +5 do
  // Shikigami simplesmente sumir da ficha, sem nada dizendo por quê.
  const doMotor = (id, alvo = null) =>
    detalhesDoCanal(ef, id, alvo, true).map((d) => ({
      label: d.nome, valor: d.valor,
      ...(d.suplantado ? { suplantado: true } : {}),
    }));
  const TIPO_LABEL = { combatente: "Combatente", misto: "Misto", conjurador: "Conjurador", restringido: "Restringido" };
  const PATAMAR_LABEL = { comum: "Comum", desafio: "Desafio", calamidade: "Calamidade", beyond: "Beyond" };
  const divTexto = (d) => String(d).replace(".", ",");

  const partes = {
    hp: [
      { label: `Base do Tipo (${TIPO_LABEL[tipo] ?? tipo})`, valor: hpBase },
      { label: "Constituição × ND", valor: nd * modCon },
      ...doMotor("hp"),
      ...(equip.hpMaxBonus ? [{ label: "Equipamento", valor: equip.hpMaxBonus }] : []),
      ...(almaMult !== 1 ? [{ label: "Integridade da Alma", texto: `×${divTexto(almaMult)}` }] : []),
      ...(hpPatamarMult !== 1 ? [{ label: `Patamar (${PATAMAR_LABEL[patamar] ?? patamar})`, texto: `×${hpPatamarMult}` }] : []),
    ],
    pe: [
      { label: `Base do Tipo (${TIPO_LABEL[tipo] ?? tipo})`, valor: peBase },
      ...(peQnt ? [{ label: "Quantidade de PE", valor: peQnt }] : []),
      { label: `Mod. da Técnica (${rotulo[tecnicaAttr] ?? tecnicaAttr})`, valor: modTecnica },
      ...doMotor("pe"),
    ],
    defesa: [
      { label: "Base", valor: 10 },
      { label: `Nível ÷ ${divTexto(divisorDefesa)}`, valor: defTipo },
      { label: "Destreza", valor: modDes },
      { label: "Maestria", valor: bt },
      ...(equip.uniformeDefesa ? [{ label: "Uniforme", valor: equip.uniformeDefesa }] : []),
      ...(carga.defesa ? [{ label: "Sobrecarga", valor: carga.defesa }] : []),
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
    rdAlma: doMotor("rdAlma"),
    rdFisico: doMotor("rdFisico"),
    movimento: [
      { label: "Base", valor: 9 },
      { label: "Maior de Força e Destreza × 1,5", valor: maxForDex * 1.5 },
      ...(carga.movimento ? [{ label: "Sobrecarga", valor: carga.movimento }] : []),
      ...doMotor("movimento"),
    ],
    iniciativa: [
      { label: "Maestria ÷ 2", valor: INT(bt / 2) },
      { label: "Destreza", valor: modDes },
      ...doMotor("iniciativa"),
    ],
    pvTemporario: doMotor("pvTemporario"),
    pontosPreparo: doMotor("pontosPreparo"),
    atencao: [
      { label: "Base", valor: 10 },
      { label: "Percepção", valor: testes.atencao - 10 },
      ...doMotor("atencao"),
    ],
    resParcial: [
      { label: `Patamar (${PATAMAR_LABEL[patamar] ?? patamar})`, valor: resParcial },
    ],
  };

  // ---------- FONTES DE CADA ATRIBUTO E DE CADA LIMITE ----------
  // Dois hovers por linha da tabela de Atributos: um no valor efetivo e um no
  // limite. As parcelas do Motor entram NOMEADAS pela habilidade, talento ou
  // treino que as gerou, que é o que o `detalhes` do agregado carrega.
  //
  // A ordem é a da fórmula, e a última linha é a PERDA no limite, quando existe.
  // Ela é o que fecha a conta para o jogador: sem ela o hover soma 24 e o número
  // grande diz 20, sem explicação.
  const METODO_LABEL = { pontos: "Compra por Pontos", fixos: "Valores Fixos", rolagem: "Rolagem" };
  const partesAtributo = {};
  const partesLimite = {};
  for (const k of ATTR_KEYS) {
    const perdido = perdaNoLimite[k] || 0;
    partesAtributo[k] = [
      { label: `Base (${METODO_LABEL[creature?.attrMethod || "pontos"]})`, valor: a[k] ?? 10 },
      ...(nivelAlloc[k] ? [{ label: "Pontos de Nível", valor: nivelAlloc[k] }] : []),
      ...(attrBonus[k] ? [{ label: "Origem", valor: attrBonus[k] }] : []),
      ...(desenv[k] ? [{ label: "Desenvolvimento Inesperado", valor: desenv[k] }] : []),
      ...(equip.attrBonus[k] ? [{ label: "Equipamento", valor: equip.attrBonus[k] }] : []),
      ...doMotor("atributo", k),
      ...(perdido ? [{ label: `Perdido no limite ${attrLimiteEfetivo[k]}`, texto: `−${perdido}` }] : []),
    ];
    const daOrigem = Math.max(limBase[k] ?? ATTR_LIMITE_PADRAO, limOrigem[k] ?? 0) - ATTR_LIMITE_PADRAO;
    partesLimite[k] = [
      { label: "Limite padrão", valor: ATTR_LIMITE_PADRAO },
      ...(daOrigem ? [{ label: tipo === "restringido" ? "Ápice Corporal Humano" : "Origem", valor: daOrigem }] : []),
      ...(desenv[k] ? [{ label: "Desenvolvimento Inesperado", valor: desenv[k] }] : []),
      ...(limPool[k] ? [{ label: "Bônus em Atributo", valor: limPool[k] }] : []),
      ...doMotor("limiteAtributo", k),
    ];
  }

  // ---------- overrides de valor final (aba Cálculos) ----------
  const calc = { hp, pe, defesa, cd, rdGeral, rdEspecifico, rdAlma, movimento, resParcial, atencao, iniciativa };
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
    almaMax,               // teto da Integridade da Alma (100 + Melhoria de Alma)
    modTecnica,
    tecnicaAttr,
    totalAptidao,               // orçamento de NÍVEIS de aptidão (para no ND 20)
    totalAptidoesAmaldicoadas,  // quantas pode ter (só da Habilidade Geral Aptidão, 0 sem ela)
    aptidao,              // níveis por trilha: { alocado, concedido, efetivo, gastos }
    // As Aptidões Amaldiçoadas escolhidas, para o `requerAptidao` da bancada
    // saber quais linhas mostrar. Segue a trava do semEnergia, igual ao motor.
    aptidoesEscolhidas: semEnergia ? [] : (Array.isArray(creature?.aptidoesAmaldicoadas) ? creature.aptidoesAmaldicoadas : []),
    dominios: resumoDominios,
    // Proficiência RESOLVIDA por perícia (a escolhida mais a concedida pelo
    // Motor). É o que os requisitos de perícia das Aptidões conferem.
    periciaProf: Object.fromEntries((testes.pericias ?? []).map((p) => [p.id, p.prof ?? null])),
    feiticos,             // { nivelMax, gastos, cdBase } — o orçamento é o de baixo
    tecnicaEfeitos,       // Funcionamento Básico resolvido, para o editor mostrar o valor de cada linha
    passivosEfeitos,      // Motor resolvido por Feitiço Passivo / Característica
    gerais,               // { escolhidas, gastos, ganhos, destravado, maxVezes, acesso, inacessiveis }
    efeitos: ef,          // Motor de Automação: { porCanal, porAlvo, detalhes, avisos }
    testes,               // { pericias, resistencias, ataques, orcamento, atencao }
    dano,                 // { entradas: [{ id, nome, fonte, texto, alcance, propriedades, partes }] }
    cura,                 // { linhas: [{ id, nome, grupo, alcance, texto, fixo, usos, unidade, partes }] }
    dedicadas,            // Armas Dedicadas: { ativa, escolhidas, elegiveis, max, restante }
    empolgacao,           // Lutador: { ativa, aprimorada, inicial, max, tabela }
    combate,              // simulação: estado já aparado nos tetos da ficha
    pvTemporario,         // casca de PV vinda da simulação (Fluxo, Brutalidade Aprimorada)
    regeneracao,          // cura no início do turno: { dados, dado, fixo }
    pontosPreparo,        // recurso do Combatente (Artes do Combate), 0 sem ela
    recursoLabel,         // "Estamina" no Restringido, "Energia" no resto — mesmo PE
    partes,               // fontes de cada stat, para o hover da UI
    orcamentoHabilidades, // contador ÚNICO da aba: Feitiços + Habilidades Gerais
    origem: escolhasOrigem, // { porEscolha, mapa } — escolhas aninhadas de Origem e Clã
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
    attrEff,              // valor EFETIVO por atributo (base + efeitos, aparado no limite)
    attrPermanente,       // o que os PRÉ-REQUISITOS enxergam (sem os efeitos temporários)
    attrLimiteEfetivo,    // limite por atributo (padrão + Origem + Desenvolvimento + Motor, teto 30)
    attrDesenv: desenv,   // pontos de Desenvolvimento Inesperado por atributo
    attrBonus,            // bônus de atributo da origem (efetivo)
    attrEquip: equip.attrBonus, // acessórios de atributo (passam o limite, param em 30)
    attrPerda: perdaNoLimite,   // ponto de bônus desperdiçado no limite, por atributo
    // Quanto o Motor soma em cada atributo. O builder RESERVA este espaço no pool
    // de nível, pela mesma convenção do bônus de origem: a concessão tem
    // prioridade e o ponto alocado volta ao pool, em vez de sumir no teto.
    //
    // ⚠ Só o estágio PERMANENTE entra. Um efeito de atributo temporário (nenhum
    // existe hoje, mas o estágio 1b existe para eles) encolheria o pool de nível
    // do criador por causa de um estado ligado na bancada de simulação, e o
    // jogador perderia pontos de ficha ao ligar Brutalidade.
    attrMotor: Object.fromEntries(ATTR_KEYS.map((k) => [k, valorCanal(efAttrPerm, "atributo", k)])),
    partesAtributo,       // fontes de cada atributo, para o hover da UI
    partesLimite,         // fontes de cada limite, para o hover da UI
    // ---------- Equipamentos ----------
    trilhasAptidao: trilhasOrigem,  // as que a ORIGEM tem (a Maldição não tem `er`)
    grauFeiticeiro: grau,  // { value, label, rank, ndMin } derivado do ND
    equip: equipFinal,     // parcelas do equipamento (entradas, custoGasto, avisos...)
    carga,                 // { espacosUsados, cargaLimite, cargaMaxima, sobrecarregado... }
    rdFisico,              // RD Física. O escudo NÃO entra mais aqui (é RD Geral).
    penalidadeDestreza: equip.penalidadeDestreza, // uniforme + escudos, cumulativos
    guarda: null,         // TODO: depende do contador de ataques consecutivos
  };
}
