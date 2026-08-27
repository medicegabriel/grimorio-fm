/**
 * ============================================================
 * SESSÃO DE JOGO — o estado que só existe com a ficha aberta na mesa
 * ============================================================
 * ⚠ A SESSÃO NÃO MORA NA FICHA. O `createBlankAfty` diz, na primeira linha, o
 * que a ficha é: "só ESCOLHAS, os stats são derivados". PV corrente não é
 * escolha, é runtime.
 *
 * O motivo prático é maior que o filosófico: o criador tem rascunho automático
 * que RESTAURA SOZINHO e um Salvar que grava a ficha inteira. Com a sessão
 * dentro da criatura, abrir o criador com um rascunho de ontem e salvar
 * **apagaria o PV da luta de agora**, calado. Em chave própria, a classe inteira
 * de bug deixa de existir, e de quebra o export da criatura não carrega PV de
 * meio combate.
 *
 * ⚠ O `combatState` do `createBlankAfty` é herança da 2.5.2 e nunca foi lido
 * pelo Afty. Isto o substitui. Ver a pergunta D2 em docs/afty-ficha-final.md.
 *
 * ⚠ O `combate` daqui é IRMÃO e não o mesmo do `creature.combate`. O da ficha é
 * a BANCADA DE BALANCEAMENTO do criador (o autor liga Brutalidade para ver o
 * pico ao montar uma criatura), e o daqui é o que está ligado na mesa AGORA. Se
 * os dois escrevessem no mesmo campo, toda sessão de jogo destruiria o cenário
 * de balanceamento. A Ficha deriva com `{ ...creature, combate: sessao.combate }`.
 * ============================================================
 */

import { normalizaConcedido, comConcessao, semConcessao } from "../afty-concessao";

const CHAVE_BASE = "fm_ficha_sessao_afty_v1";
const LOG_MAX = 50;

const chaveDe = (id) => `${CHAVE_BASE}:${id || "sem-id"}`;

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};

const entre = (v, min, max) => Math.min(max, Math.max(min, v));

/**
 * Sessão nova: recursos cheios. `derived` entra para os máximos, e sem ele a
 * sessão nasce zerada em vez de quebrar (a Ficha sempre passa).
 */
export function sessaoEmBranco(derived = null) {
  return {
    hpAtual: derived?.hp ?? 0,
    peAtual: derived?.pe ?? 0,
    /* PV temporário POR FONTE, igual ao de PE logo abaixo. Era um número só até
       2026-08-26, quando a Guarda Inabalável passou a entregar PV temporário e
       a regra dela exigiu saber QUAL parte do pote é a da Guarda: "a perda dos
       PVs temporários recebidos por essa característica" quebra a Guarda, e um
       número só não distingue o que se perdeu.

       ⚠ As fontes ACUMULAM entre si (autor, 2026-08-26: "mesmo pote, porém se
       acumula com outros PVs Temporários"), então o total é a SOMA. O que topa
       em vez de somar é a mesma fonte contra ela mesma, e é o que faz a Guarda
       voltar cheia a cada rodada sem virar pilha. */
    pvTempFontes: {},
    /* PE temporário POR FONTE: { [nome da fonte]: valor }. O total é a soma.
       ⚠ Por fonte e não um número só, porque a regra da mesma fonte é "TOPA,
       não acumula": o Completo do Treino de Controle de Energia entrega metade
       do Bônus de Treinamento no começo de TODA rodada, e somar viraria pilha
       infinita na rodada 10. O que a rodada faz é devolver ao teto da fonte o
       que foi gasto. Desenho copiado do `applyRoundStartResources` da 2.5.2. */
    peTempFontes: {},
    almaAtual: derived?.almaMax ?? 100,
    rodada: 0,
    /* GUARDA INABALÁVEL: quantos golpes já desgastaram o bônus nesta rodada, e
       se ela foi encerrada antes da hora (Raio Negro ou uma das oito condições).
       O bônus corrente e a Vida não moram aqui: o bônus SAI dos golpes e a Vida
       está no `pvTempFontes`, com a chave da Guarda. Ver `resolveGuarda`. */
    guardaGolpes: 0,
    guardaEncerrada: false,
    combate: {},
    condicoes: [],
    buffs: [],
    // O que o mestre CONCEDEU nesta sessão (Addons 8.3). Estado de sessão e
    // nunca ficha, por decisão do autor (2026-08-20): vale para tudo, não gasta
    // vaga nenhuma e morre junto com a sessão. Ver `afty-concessao.js`.
    concedido: [],
    usos: {},
    ultimoFeiticoDanoId: null,
    rituais: {},
    ritualAtual: null,
    favoritos: [],
    log: [],
    atualizadoEm: null,
  };
}

/**
 * Sanea o que veio do armazenamento. Chave ausente, JSON corrompido e
 * `localStorage` indisponível (modo privado, cota estourada) viram sessão nova,
 * em silêncio: nada disso pode derrubar a Ficha.
 */
export function normalizaSessao(bruta, derived = null) {
  const base = sessaoEmBranco(derived);
  if (!bruta || typeof bruta !== "object") return base;
  const lista = (v) => (Array.isArray(v) ? v : []);
  return {
    ...base,
    ...bruta,
    hpAtual: inteiro(bruta.hpAtual, base.hpAtual),
    peAtual: inteiro(bruta.peAtual, base.peAtual),
    /* ⚠ MIGRAÇÃO: sessão gravada antes de 2026-08-26 tem `pvTempAtual`, um
       número. Ele vira uma fonte com nome, e não é descartado: quem estava no
       meio de uma luta com casca de PV não a perde ao recarregar a página. */
    pvTempFontes: normalizaPvTemp(bruta.pvTempFontes, bruta.pvTempAtual),
    peTempFontes: normalizaPeTemp(bruta.peTempFontes),
    almaAtual: Math.max(0, inteiro(bruta.almaAtual, base.almaAtual)),
    rodada: Math.max(0, inteiro(bruta.rodada, 0)),
    guardaGolpes: Math.max(0, inteiro(bruta.guardaGolpes, 0)),
    guardaEncerrada: !!bruta.guardaEncerrada,
    combate: bruta.combate && typeof bruta.combate === "object" ? bruta.combate : {},
    usos: bruta.usos && typeof bruta.usos === "object" ? bruta.usos : {},
    ultimoFeiticoDanoId: typeof bruta.ultimoFeiticoDanoId === "string"
      ? bruta.ultimoFeiticoDanoId
      : null,
    rituais: bruta.rituais && typeof bruta.rituais === "object" ? bruta.rituais : {},
    ritualAtual: normalizaRitualAtual(bruta.ritualAtual),
    condicoes: lista(bruta.condicoes),
    buffs: lista(bruta.buffs),
    // ⚠ Passa pelo normalizador PRÓPRIO, e não pelo `lista` genérico: ele é
    // quem descarta família desconhecida e devolve o uid a quem perdeu o dele.
    // Id órfão SOBREVIVE de propósito, e vira linha morta na tela.
    concedido: normalizaConcedido(bruta.concedido),
    favoritos: lista(bruta.favoritos),
    log: lista(bruta.log).slice(0, LOG_MAX),
  };
}

export function carregarSessao(id, derived = null) {
  try {
    const cru = localStorage.getItem(chaveDe(id));
    if (!cru) return sessaoEmBranco(derived);
    return normalizaSessao(JSON.parse(cru), derived);
  } catch {
    return sessaoEmBranco(derived);
  }
}

export function salvarSessao(id, sessao) {
  try {
    localStorage.setItem(chaveDe(id), JSON.stringify({ ...sessao, atualizadoEm: Date.now() }));
    return true;
  } catch {
    // Cota estourada ou armazenamento bloqueado. A Ficha continua funcionando
    // na memória, e o que se perde é a sobrevivência ao recarregar.
    return false;
  }
}

export function limparSessao(id) {
  try {
    localStorage.removeItem(chaveDe(id));
  } catch { /* nada a fazer, e nada a quebrar */ }
}

/* ============================================================ */
/* PV TEMPORÁRIO                                                 */
/* ============================================================ */
/* A casca de PV, gasta ANTES do PV. Era um NÚMERO até 2026-08-26, e virou mapa
   por fonte quando a Guarda Inabalável passou a entregar PV temporário: a regra
   dela diz que a Guarda se quebra com "a perda dos PVs temporários recebidos por
   essa característica", e um número só não sabe de quem era o que se perdeu.

   ⚠ As fontes ACUMULAM, e o total é a SOMA (autor, 2026-08-26). É a diferença
   para o de PE, cujas fontes também somam entre si mas cuja regra de reposição
   ("a mesma fonte topa") é o que mais aparece no dia a dia.

   ⚠ NENHUMA FONTE ALIMENTAVA ESTE POTE até hoje. O `derived.pvTemporario` é
   calculado, aparece no Preview do criador e NUNCA chegava à sessão: só o
   `aplicaDano` mexia no campo, para baixo, a partir de um zero que ninguém
   subia. A Guarda é a primeira fonte de verdade. Ligar o `pvTemporario` da
   bancada é uma linha e está anotado em docs/a-fazer.md, mas é mudança de
   comportamento que o autor não pediu, então não entrou junto. */

/** Sanea o mapa de fontes. Aceita o `pvTempAtual` velho, que era um número. */
function normalizaPvTemp(bruto, legado) {
  const out = {};
  if (bruto && typeof bruto === "object" && !Array.isArray(bruto)) {
    for (const [nome, v] of Object.entries(bruto)) {
      const n = Math.max(0, inteiro(v, 0));
      if (nome && n > 0) out[String(nome)] = n;
    }
  }
  const velho = Math.max(0, inteiro(legado, 0));
  if (velho > 0 && !Object.keys(out).length) out[FONTE_PV_TEMP_LEGADO] = velho;
  return out;
}

/** O total de PV temporário disponível agora. */
export const pvTempTotal = (sessao) =>
  Object.values(sessao?.pvTempFontes ?? {}).reduce((soma, n) => soma + n, 0);

/**
 * Gasta `quanto` da casca de PV. Devolve `{ fontes, sobrou }`.
 *
 * ⚠ A GUARDA VAI PRIMEIRO, e isso é ASSUNÇÃO minha, não regra escrita: o autor
 * disse que a Vida da Guarda soma com as outras cascas e não disse em que ordem
 * o dano as come. A Guarda é a camada de FORA (a criatura a reergue toda rodada,
 * e as outras cascas não voltam), e ela precisa ser alcançável para a
 * característica funcionar como está escrita: se uma casca comprada absorvesse
 * antes, a Guarda ficaria praticamente inquebrável. Hoje a ordem não muda número
 * nenhum, porque a Guarda é a ÚNICA fonte deste pote. Anotado em a-fazer.md.
 */
export function drenaPvTemp(fontes, quanto) {
  const out = { ...(fontes ?? {}) };
  let resta = Math.max(0, Math.trunc(Number(quanto)) || 0);
  const ordem = [
    ...(out[FONTE_GUARDA] != null ? [FONTE_GUARDA] : []),
    ...Object.keys(out).filter((k) => k !== FONTE_GUARDA),
  ];
  for (const nome of ordem) {
    if (resta <= 0) break;
    const tira = Math.min(out[nome], resta);
    out[nome] -= tira;
    resta -= tira;
    if (out[nome] <= 0) delete out[nome];
  }
  return { fontes: out, sobrou: resta };
}

/* ============================================================ */
/* PE TEMPORÁRIO                                                 */
/* ============================================================ */
/* A casca de PE, gasta ANTES do PE normal. O autor pediu em 2026-08-26 que ela
   funcionasse "igual o da 2.5.2: usar a mesma barra de PE, e ir sobrescrevendo
   ela com outra cor".

   ⚠ UMA DIVERGÊNCIA DELIBERADA da 2.5.2, e é de forma, não de comportamento. Lá
   o PE temporário é PE ACIMA DO MÁXIMO (`peCurrent > peMax`), e aqui é um
   BUFFER separado, como o `pvTempAtual` que a Ficha já tinha. Os dois desenham
   a mesma barra e gastam na mesma ordem, e o buffer é melhor deste lado por dois
   motivos: o `aparaSessao` continua podendo aparar o `peAtual` no máximo sem
   apagar a casca, e o PV e o PE ficam com a MESMA forma na Ficha, em vez de uma
   casca de cada jeito. */

/** Sanea o mapa de fontes: nome vazio, valor não numérico e zero saem. */
function normalizaPeTemp(bruto) {
  if (!bruto || typeof bruto !== "object" || Array.isArray(bruto)) return {};
  const out = {};
  for (const [nome, v] of Object.entries(bruto)) {
    const n = Math.max(0, inteiro(v, 0));
    if (nome && n > 0) out[String(nome)] = n;
  }
  return out;
}

/** O total de PE temporário disponível agora. */
export const peTempTotal = (sessao) =>
  Object.values(sessao?.peTempFontes ?? {}).reduce((soma, n) => soma + n, 0);

/**
 * Gasta `quanto` da casca, na ordem em que as fontes estão. Devolve
 * `{ fontes, sobrou }`: `sobrou` é o que a casca não cobriu e tem de sair do PE
 * normal. Fonte zerada SAI do mapa, e é isso que faz a rodada seguinte reenchê-la.
 */
export function drenaPeTemp(fontes, quanto) {
  const out = { ...(fontes ?? {}) };
  let resta = Math.max(0, Math.trunc(Number(quanto)) || 0);
  for (const nome of Object.keys(out)) {
    if (resta <= 0) break;
    const tira = Math.min(out[nome], resta);
    out[nome] -= tira;
    resta -= tira;
    if (out[nome] <= 0) delete out[nome];
  }
  return { fontes: out, sobrou: resta };
}

/**
 * Entrega a casca de um GATILHO. `entradas` é `derived.peTemporario.combate` ou
 * `.rodada`, no formato `[{ nome, valor }]`.
 *
 * ⚠ A MESMA FONTE TOPA, não soma: quem já está com o valor cheio não ganha nada,
 * e quem gastou recebe de volta só a diferença. É o que separa "ganha metade do
 * BT toda rodada" de "acumula metade do BT toda rodada".
 */
export function aplicaPeTemporario(sessao, entradas = []) {
  if (!entradas.length) return sessao;
  const fontes = { ...(sessao.peTempFontes ?? {}) };
  let mudou = false;
  for (const entrada of entradas) {
    /* ⚠ A CHAVE é quem identifica a fonte, e ela leva o gatilho junto (ver
       `peTemporario` no afty-derive.js). O `nome` sozinho não serve, porque uma
       Linha de Treinamento pode emitir nos dois gatilhos com o mesmo nome. */
    const chave = String(entrada.chave ?? entrada.nome ?? "");
    const teto = Math.max(0, Math.trunc(Number(entrada.valor)) || 0);
    if (!chave || !teto) continue;
    if ((fontes[chave] ?? 0) >= teto) continue;
    fontes[chave] = teto;
    mudou = true;
  }
  return mudou ? { ...sessao, peTempFontes: fontes } : sessao;
}

/**
 * Gasto de PE: a casca vai primeiro, e só o que sobra desce no `peAtual`.
 * `quanto` é positivo. Ganho de PE não passa por aqui, ele é `peAtual` puro.
 */
export function gastaPe(sessao, quanto) {
  const custo = Math.max(0, Math.trunc(Number(quanto)) || 0);
  if (!custo) return sessao;
  const { fontes, sobrou } = drenaPeTemp(sessao.peTempFontes, custo);
  return { ...sessao, peTempFontes: fontes, peAtual: Math.max(0, sessao.peAtual - sobrou) };
}

/**
 * Apara os correntes nos máximos DA VEZ.


 *
 * ⚠ Existe por causa de duas coisas que mexem no teto sem passar por aqui: o
 * criador (uma Melhoria de Alma nova sobe o PV máximo) e a própria Alma, que
 * MULTIPLICA o PV. Uma criatura que perde Alma tem o PV máximo caindo junto, e
 * sem o clamp o corrente ficaria acima do máximo, calado.
 *
 * O PV temporário NÃO é aparado: ele é casca por fora do máximo, por definição.
 */
export function aparaSessao(sessao, derived) {
  const hpMax = Math.max(0, derived?.hp ?? 0);
  const peMax = Math.max(0, derived?.pe ?? 0);
  const almaMax = Math.max(0, derived?.almaMax ?? 100);
  const hpAtual = entre(sessao.hpAtual, 0, hpMax);
  const peAtual = entre(sessao.peAtual, 0, peMax);
  const almaAtual = entre(sessao.almaAtual, 0, almaMax);
  if (hpAtual === sessao.hpAtual && peAtual === sessao.peAtual && almaAtual === sessao.almaAtual) {
    return sessao;
  }
  return { ...sessao, hpAtual, peAtual, almaAtual };
}

/* ============================================================ */
/* CONCESSÃO DO MESTRE (Addons 8.3)                              */
/* ============================================================ */
/* O mestre dá alguma coisa à criatura no meio da luta, e ela passa a valer na
   hora, já calculada. As duas funções são escritoras como as outras daqui:
   recebem a sessão, devolvem outra, e nunca tocam na ficha. */

/** Concede uma entrada de catálogo. Devolve sessão nova. */
export function concedeNaSessao(sessao, familia, id, alvo = null) {
  const concedido = comConcessao(sessao.concedido, familia, id, alvo);
  if (concedido.length === (sessao.concedido?.length ?? 0)) return sessao;
  return { ...sessao, concedido };
}

/** Tira UMA pega concedida, pelo uid. */
export function removeConcessao(sessao, uid) {
  const concedido = semConcessao(sessao.concedido, uid);
  if (concedido.length === (sessao.concedido?.length ?? 0)) return sessao;
  return { ...sessao, concedido };
}

/**
 * Aplica dano.
 *
 * ⚠ A RD NÃO é abatida aqui, de propósito (decisão a confirmar, D9 em
 * docs/afty-ficha-final.md). O Afty tem RD Geral, Específica, Física e a da
 * Alma, e qual delas vale depende do TIPO do dano que chegou, que a Ficha não
 * tem como saber. Abater a errada é pior que não abater nenhuma, então o número
 * entra cru e as RDs ficam à vista no cabeçalho.
 *
 * O PV TEMPORÁRIO come primeiro, e o que sobra desce no PV. É a regra da casca:
 * ela existe para ser gasta antes da vida.
 */
export function aplicaDano(sessao, bruto) {
  const dano = Math.max(0, inteiro(bruto, 0));
  if (!dano) return sessao;
  /* A casca vai primeiro, e a Guarda é a primeira dela (ver `drenaPvTemp`). É
     aqui que a Guarda se quebra sozinha: zerando a fonte dela, o `resolveGuarda`
     passa a devolver `noAr: false` e o bônus some, sem flag nenhuma para manter
     em dia. */
  const { fontes, sobrou } = drenaPvTemp(sessao.pvTempFontes, dano);
  return {
    ...sessao,
    pvTempFontes: fontes,
    hpAtual: Math.max(0, sessao.hpAtual - sobrou),
  };
}

/** Aplica cura. Nunca passa do máximo, e nunca ressuscita PV temporário. */
export function aplicaCura(sessao, bruto, hpMax) {
  const cura = Math.max(0, inteiro(bruto, 0));
  if (!cura) return sessao;
  return { ...sessao, hpAtual: entre(sessao.hpAtual + cura, 0, Math.max(0, hpMax)) };
}

/* ============================================================ */
/* GUARDA INABALÁVEL (Calamidade e Beyond)                       */
/* ============================================================ */
/* "Inimigos poderosos precisam ser enfraquecidos para realmente sofrerem danos
   significativos." A característica tem DUAS metades e elas se quebram por
   caminhos diferentes:

     • o BÔNUS  — +5 (Calamidade) ou +10 (Beyond) em CA e nos cinco TRs, no
                  início da rodada, caindo 2 a cada ataque ou habilidade
                  sofrida, "independentemente de ser atingido, falhar ou ter
                  sucesso no TR". Zerar por golpes é o desgaste normal.
     • a VIDA   — 5 × ND (Calamidade) ou 10 × ND (Beyond) de PV temporário.
                  Chegando a zero, "a guarda é quebrada perdendo seus efeitos".

   As três respostas do autor (2026-08-26) que fecharam o comportamento:

   1. AS DUAS VOLTAM CHEIAS A CADA RODADA. A Vida não é durabilidade do combate
      inteiro: quebrar vale até o fim daquela rodada. É o mesmo desenho do
      `applyNewRoundEffects` da 2.5.2, que reseta a Guarda no vira-rodada.
   2. A Vida entra no MESMO POTE do PV temporário e ACUMULA com as outras
      fontes dele. Por isso ela mora no `pvTempFontes` e não num vital próprio:
      na tela é uma casca só, por cima da barra de PV.
   3. As condições e o Raio Negro derrubam AS DUAS METADES, e "enquanto durar a
      condição" nada volta. Saída a condição, a rodada seguinte reergue tudo.

   ⚠ "Incapacitado" está na lista do livro e NÃO entra aqui: o autor a retirou
   do sistema em 2026-08-26, e ela nunca existiu no CONDICOES_CATALOGO. */

/** A chave da Guarda dentro do `pvTempFontes`. É o nome que a tela mostra. */
export const FONTE_GUARDA = "Guarda Inabalável";

/** O nome que a casca de PV anônima recebe ao migrar do `pvTempAtual` velho. */
const FONTE_PV_TEMP_LEGADO = "PV Temporário";

const semAcento = (v) => String(v ?? "")
  .normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

/* As oito do livro. ⚠ São NOMES e não ids, porque é assim que a condição é
   gravada na sessão e no Feitiço (ver CONDICOES_CATALOGO em afty-feiticos.js), e
   porque uma condição de Addon entra pelo nome limpo. */
export const CONDICOES_QUEBRAM_GUARDA = [
  "Desprevenido", "Desorientado", "Confuso", "Exposto",
  "Fragilizado", "Atordoado", "Paralisado", "Inconsciente",
];

const QUEBRAM = new Set(CONDICOES_QUEBRAM_GUARDA.map(semAcento));

/** A primeira condição ativa que derruba a Guarda, ou null. */
export function condicaoQueQuebraGuarda(sessao) {
  const lista = Array.isArray(sessao?.condicoes) ? sessao.condicoes : [];
  return lista.find((c) => QUEBRAM.has(semAcento(c?.nome)))?.nome ?? null;
}

/**
 * O que a sessão tem a dizer sobre a Guarda, no formato que o `deriveAfty`
 * espera em `opcoes.guarda`.
 *
 * ⚠ QUEM RESOLVE A GUARDA É O DERIVE, e não este arquivo, e a razão não é
 * arrumação: o bônus SOMA na Defesa e nos cinco TRs, e esses números saem de
 * dentro do derive. Resolver aqui obrigaria a derivar duas vezes (uma para
 * saber o bônus, outra para aplicá-lo), e o painel de Encontros faz esse
 * cálculo por combatente. O resultado sai em `derived.guarda`.
 */
export function entradaDaGuarda(sessao) {
  return {
    golpes: Math.max(0, inteiro(sessao?.guardaGolpes, 0)),
    vida: Math.max(0, inteiro(sessao?.pvTempFontes?.[FONTE_GUARDA], 0)),
    encerrada: !!sessao?.guardaEncerrada,
    condicao: condicaoQueQuebraGuarda(sessao),
  };
}

/**
 * Reergue a Guarda: Vida cheia e contador de golpes zerado. Chamado pelo
 * vira-rodada e pelo começo da cena.
 *
 * ⚠ NÃO REERGUE debaixo de uma das oito condições ("enquanto durar a condição,
 * perde o Bônus e os PVs Temporários"), e nesse caso ela sai zerada em vez de
 * ficar com o que sobrou: a condição destrói, não suspende.
 *
 * ⚠ A fonte TOPA em vez de somar, igual à casca de PE. Sem isso a rodada 10 de
 * um Beyond ND 30 teria 3000 de casca.
 */
export function renovaGuarda(sessao, derived) {
  const base = derived?.guarda;
  const fontes = { ...(sessao?.pvTempFontes ?? {}) };
  if (!base?.ativa) {
    if (fontes[FONTE_GUARDA] == null) return sessao;
    delete fontes[FONTE_GUARDA];
    return { ...sessao, pvTempFontes: fontes };
  }
  const travada = condicaoQueQuebraGuarda(sessao) != null;
  const alvo = travada ? 0 : Math.max(0, base.vidaMax);
  if (alvo > 0) fontes[FONTE_GUARDA] = alvo; else delete fontes[FONTE_GUARDA];
  return { ...sessao, pvTempFontes: fontes, guardaGolpes: 0, guardaEncerrada: travada };
}

/**
 * Um ataque ou habilidade sofrida: o bônus cai 2, tenha atingido ou não.
 *
 * ⚠ O GOLPE QUE ZERA O BÔNUS QUEBRA A GUARDA, e a quebra leva o PV Temporário
 * junto (autor, 2026-08-26). São 3 golpes no Calamidade e 5 no Beyond. É o
 * caminho normal de derrubar a Guarda, e é o que faz a característica pedir
 * trabalho em equipe: uma criatura sozinha não tira três ataques numa rodada.
 *
 * Precisa do `derived` por causa do teto, que é de onde sai o número de golpes
 * que zera. Sem ele o contador sobe e nada mais acontece, que é o mesmo cuidado
 * do `descansar`: quem não conseguiu calcular a ficha não sabe o teto.
 */
export function sofreGolpeNaGuarda(sessao, derived = null) {
  const golpes = Math.max(0, inteiro(sessao?.guardaGolpes, 0)) + 1;
  const proxima = { ...sessao, guardaGolpes: golpes };
  const base = derived?.guarda;
  if (!base?.ativa) return proxima;
  if (base.passoPorGolpe * golpes < base.bonusMax) return proxima;
  const fontes = { ...(proxima.pvTempFontes ?? {}) };
  delete fontes[FONTE_GUARDA];
  return { ...proxima, pvTempFontes: fontes };
}

/**
 * Desfaz um golpe contado a mais. O contador não passa de zero.
 *
 * ⚠ NÃO RESSUSCITA O PV TEMPORÁRIO. Depois que a Guarda quebra, a casca dela foi
 * perdida e nada neste arquivo sabe quanto ela valia (o dano pode ter comido
 * parte antes). Por isso as telas desabilitam o desfazer com a Guarda quebrada:
 * ele serve para o golpe contado a mais ANTES da quebra, e prometer mais do que
 * isso seria devolver um número inventado. A rodada seguinte reergue tudo.
 */
export function desfazGolpeNaGuarda(sessao) {
  const golpes = Math.max(0, inteiro(sessao?.guardaGolpes, 0));
  if (!golpes) return sessao;
  return { ...sessao, guardaGolpes: golpes - 1 };
}

/**
 * Encerra a Guarda antes da hora: o Raio Negro. Derruba as duas metades, e a
 * rodada seguinte reergue tudo, porque o Raio Negro é EVENTO e não condição.
 */
export function encerraGuarda(sessao) {
  const fontes = { ...(sessao?.pvTempFontes ?? {}) };
  delete fontes[FONTE_GUARDA];
  return { ...sessao, pvTempFontes: fontes, guardaEncerrada: true };
}

/**
 * Grava a lista de condições e aplica o efeito delas sobre a Guarda. As duas
 * telas escrevem condição por aqui, e não direto no campo: se uma escrevesse
 * cru, a Guarda daquela tela ficaria de pé debaixo de um Atordoado.
 *
 * ⚠ A Vida é DESTRUÍDA ao entrar a condição, e não suspensa. Tirar a condição no
 * meio da rodada não a devolve: "depois, volta no início da rodada normalmente"
 * (autor, 2026-08-26).
 */
export function defineCondicoes(sessao, condicoes) {
  const lista = Array.isArray(condicoes) ? condicoes : [];
  const proxima = { ...sessao, condicoes: lista };
  if (condicaoQueQuebraGuarda(proxima) == null) return proxima;
  const fontes = { ...(proxima.pvTempFontes ?? {}) };
  delete fontes[FONTE_GUARDA];
  return { ...proxima, pvTempFontes: fontes };
}

/**
 * Fecha a rodada: o contador sobe e toda duração desce um.
 * O que zerou SAI, e volta na lista `expirou` para a Ficha poder avisar (buff
 * que some sem aviso é buff que o jogador continua contando na cabeça).
 */
export function proximaRodada(sessao, derived = null) {
  const expirou = [];
  const desce = (item) => {
    if (item.rodadas == null) return item;              // sem duração, fica
    const restam = item.rodadas - 1;
    if (restam <= 0) { expirou.push(item); return null; }
    return { ...item, rodadas: restam };
  };
  /* ⚠ A casca de PE do gatilho `rodada` volta ao teto AQUI, e não soma: ver
     `aplicaPeTemporario`. Sem `derived` nada acontece, que é o mesmo cuidado do
     `descansar`: quem não conseguiu calcular a ficha não sabe quanto entregar. */
  const base = {
    ...sessao,
    rodada: sessao.rodada + 1,
    buffs: sessao.buffs.map(desce).filter(Boolean),
    condicoes: sessao.condicoes.map(desce).filter(Boolean),
  };
  /* ⚠ SAIR DA RODADA 0 É COMEÇAR A CENA, e por isso a casca de `combate` entra
     junto aqui. A Ficha não tem botão de "iniciar combate": o que ela tem é o
     contador de rodada, que o Descansar zera. Sem esta linha, os 4 PE do Treino
     de Controle de Energia 2ª ("quando uma cena de combate iniciar") nunca
     chegariam a quem joga pela Ficha, só a quem joga pela aba de Encontros. */
  const comCena = sessao.rodada === 0
    ? aplicaPeTemporario(base, derived?.peTemporario?.combate ?? [])
    : base;
  /* ⚠ A GUARDA VOLTA CHEIA AQUI, as duas metades (autor, 2026-08-26). E a
     renovação vem DEPOIS do `desce` das condições: a condição que expirou nesta
     virada já saiu da lista, então a Guarda dela volta agora, e não só na
     rodada seguinte. */
  const comGuarda = renovaGuarda(
    aplicaPeTemporario(comCena, derived?.peTemporario?.rodada ?? []),
    derived,
  );
  return { sessao: comGuarda, expirou };
}

/**
 * A cena de combate COMEÇOU: entrega as duas cascas de uma vez. A de `combate`
 * vale a cena inteira e a de `rodada` já vale a primeira rodada, senão o Completo
 * do Treino de Controle de Energia só valeria a partir da segunda.
 */
export function iniciaCombate(sessao, derived = null) {
  if (!derived) return sessao;
  const comCena = aplicaPeTemporario(sessao, derived.peTemporario?.combate ?? []);
  // A Guarda entra junto: a primeira rodada já é rodada, e sem isto o mestre
  // abriria o combate com o chefe sem casca nenhuma até virar a rodada 2.
  return renovaGuarda(aplicaPeTemporario(comCena, derived.peTemporario?.rodada ?? []), derived);
}

/**
 * Descanso. Zera os usos gastos e os buffs com duração, e devolve os recursos.
 *
 * ⚠ O que cada tipo de descanso devolve no Afty é PERGUNTA ABERTA (D3). Até o
 * autor responder, o botão é um só e devolve tudo, que é o comportamento que
 * não engana: um descanso que devolvesse metade sem regra escrita seria número
 * inventado.
 *
 * ⚠ SEM `derived` a sessão volta INTACTA (2026-08-09). O `?? 0` abaixo fazia um
 * descanso sem os derivados ZERAR o PV e o PE em vez de reenchê-los, que é o
 * oposto do que o botão promete e não tem desfazer. Quem chama sem derivados é
 * quem não conseguiu calcular a ficha, e nesse caso não mexer é a única resposta
 * honesta: não dá para reencher até um máximo que ninguém sabe qual é.
 */
export function descansar(sessao, derived) {
  if (!derived) return sessao;
  return {
    ...sessao,
    hpAtual: Math.max(0, derived?.hp ?? 0),
    peAtual: Math.max(0, derived?.pe ?? 0),
    pvTempFontes: {},
    // A casca de PE morre com a cena, então o descanso a zera junto com a de PV.
    peTempFontes: {},
    rodada: 0,
    // A Guarda volta a zero com a rodada: fora de combate não há guarda erguida,
    // e o próximo `iniciaCombate` (ou a saída da rodada 0) a reergue cheia.
    guardaGolpes: 0,
    guardaEncerrada: false,
    usos: {},
    buffs: sessao.buffs.filter((b) => b.rodadas == null),
    condicoes: sessao.condicoes
      .filter((c) => c.rodadas == null)
      .filter((c) => c.id !== CHAVE_CONDICAO_RITUAL_ESTENDIDO),
    ritualAtual: null,
  };
}

const chaveUsoEstado = (id) => `estado:${id}:rodada`;

/** Um estado limitado já foi ativado na rodada atual? */
export function estadoUsadoNestaRodada(sessao, id) {
  return sessao?.usos?.[chaveUsoEstado(id)] === sessao?.rodada;
}

/**
 * Altera um estado catalogado e registra a ativação dos que só podem ser usados
 * uma vez por rodada. Desligar continua permitido, mas não libera uma segunda
 * ativação na mesma rodada.
 */
export function alteraEstadoCombate(sessao, estado, valor) {
  if (!estado?.id) return sessao;
  const combate = sessao?.combate && typeof sessao.combate === "object" ? sessao.combate : {};
  const ativando = !!valor && !combate[estado.id];
  if (ativando && estado.umaVezPorRodada && estadoUsadoNestaRodada(sessao, estado.id)) {
    return sessao;
  }
  return {
    ...sessao,
    combate: { ...combate, [estado.id]: valor },
    usos: ativando && estado.umaVezPorRodada
      ? { ...(sessao.usos || {}), [chaveUsoEstado(estado.id)]: sessao.rodada }
      : sessao.usos,
  };
}

/** Consome um estado de próximo uso sem apagar o registro da rodada. */
export function consomeEstadoCombate(sessao, id) {
  if (!id || !sessao?.combate?.[id]) return sessao;
  return { ...sessao, combate: { ...sessao.combate, [id]: false } };
}

/** Guarda o Feitiço de dano cuja primeira rolagem foi usada por último. */
export function registraFeiticoDano(sessao, id) {
  if (!id || sessao?.ultimoFeiticoDanoId === id) return sessao;
  return { ...sessao, ultimoFeiticoDanoId: id };
}

/** Atualiza a preparação de Ritual de um Feitiço sem tocar nas outras linhas. */
export function configuraRitual(sessao, feiticoId, proxima) {
  if (!feiticoId) return sessao;
  const rituais = sessao?.rituais && typeof sessao.rituais === "object" ? sessao.rituais : {};
  const atual = rituais[feiticoId] && typeof rituais[feiticoId] === "object"
    ? rituais[feiticoId]
    : {};
  const valor = typeof proxima === "function" ? proxima(atual) : proxima;
  if (!valor || typeof valor !== "object") return sessao;
  return { ...sessao, rituais: { ...rituais, [feiticoId]: valor } };
}

const CHAVE_USO_RITUALISTA = "cnj_ritualista";
const CHAVE_CONDICAO_RITUAL_ESTENDIDO = "ritual:desprevenido";

const ETAPAS_RITUAL = new Set(["pronto", "falhou", "preparando", "resolvido"]);

function normalizaRitualAtual(valor) {
  if (!valor || typeof valor !== "object" || typeof valor.feiticoId !== "string") return null;
  const etapa = valor.etapa === "adiado" ? "pronto" : valor.etapa;
  if (!ETAPAS_RITUAL.has(etapa)) return null;
  return {
    feiticoId: valor.feiticoId,
    tipo: valor.tipo === "estendido" ? "estendido" : "comum",
    etapa,
    usaRitualista: !!valor.usaRitualista,
  };
}

export function ritualEmAndamento(sessao) {
  return normalizaRitualAtual(sessao?.ritualAtual);
}

export function usosRitualista(sessao) {
  return Math.max(0, inteiro(sessao?.usos?.[CHAVE_USO_RITUALISTA], 0));
}

/** Consome uma aplicação da melhoria adicional de Ritualista. */
export function consomeRitualista(sessao) {
  return {
    ...sessao,
    usos: { ...(sessao.usos || {}), [CHAVE_USO_RITUALISTA]: usosRitualista(sessao) + 1 },
  };
}

const comRitualistaConsumido = (sessao, usaRitualista) => (
  usaRitualista ? consomeRitualista(sessao) : sessao
);

const removeCondicaoRitualEstendido = (sessao) => ({
  ...sessao,
  condicoes: (sessao.condicoes ?? []).filter((c) => c.id !== CHAVE_CONDICAO_RITUAL_ESTENDIDO),
});

const desarmaRitualistaDoFeitico = (sessao, feiticoId) => configuraRitual(
  sessao,
  feiticoId,
  (ritual) => ({ ...ritual, extraRitualista: false }),
);

/** Registra o resultado do teste do Ritual comum. */
export function iniciaRitualComum(sessao, feiticoId, sucesso, usaRitualista = false) {
  if (!feiticoId || ritualEmAndamento(sessao)) return sessao;
  const consumido = comRitualistaConsumido(sessao, usaRitualista);
  return {
    ...consumido,
    ritualAtual: {
      feiticoId,
      tipo: "comum",
      etapa: sucesso ? "pronto" : "falhou",
      usaRitualista: !!usaRitualista,
    },
  };
}

/** Inicia um Ritual comum cuja fonte dispensa o teste de Prestidigitação. */
export function iniciaRitualSemTeste(sessao, feiticoId, usaRitualista = false) {
  return iniciaRitualComum(sessao, feiticoId, true, usaRitualista);
}

/** Começa o primeiro turno do Ritual Estendido e aplica Desprevenido. */
export function iniciaRitualEstendido(sessao, feiticoId, usaRitualista = false) {
  if (!feiticoId || ritualEmAndamento(sessao)) return sessao;
  const consumido = comRitualistaConsumido(sessao, usaRitualista);
  const semMarcadorAnterior = (consumido.condicoes ?? [])
    .filter((c) => c.id !== CHAVE_CONDICAO_RITUAL_ESTENDIDO);
  return {
    ...consumido,
    condicoes: [
      ...semMarcadorAnterior,
      {
        id: CHAVE_CONDICAO_RITUAL_ESTENDIDO,
        nome: "Desprevenido",
        forca: "fraca",
        rodadas: null,
      },
    ],
    ritualAtual: {
      feiticoId,
      tipo: "estendido",
      etapa: "preparando",
      usaRitualista: !!usaRitualista,
    },
  };
}

/** O botão conclui a preparação estendida ou a continuação escolhida após a falha. */
export function concluiPreparacaoRitual(sessao, feiticoId) {
  const atual = ritualEmAndamento(sessao);
  if (!atual || atual.feiticoId !== feiticoId) return sessao;
  if (!["falhou", "preparando"].includes(atual.etapa)) return sessao;
  return {
    ...sessao,
    ritualAtual: {
      ...atual,
      etapa: "pronto",
    },
  };
}

/** Cancela ou interrompe o Ritual sem devolver Ritualista já gasto. */
export function cancelaRitual(sessao, feiticoId) {
  const atual = ritualEmAndamento(sessao);
  if (!atual || atual.feiticoId !== feiticoId) return sessao;
  const limpo = removeCondicaoRitualEstendido({ ...sessao, ritualAtual: null });
  return atual.usaRitualista ? desarmaRitualistaDoFeitico(limpo, feiticoId) : limpo;
}

/** O Feitiço pode ser resolvido agora, depois do teste ou da preparação. */
export function ritualProntoParaResolver(sessao, feiticoId) {
  const atual = ritualEmAndamento(sessao);
  return !!atual && atual.feiticoId === feiticoId && atual.etapa === "pronto";
}

/** Marca o Feitiço como resolvido e conserva o estado até o botão Encerrar. */
export function finalizaRitual(sessao, feiticoId) {
  const atual = ritualEmAndamento(sessao);
  if (!atual || atual.feiticoId !== feiticoId || !ritualProntoParaResolver(sessao, feiticoId)) {
    return sessao;
  }
  return removeCondicaoRitualEstendido({
    ...sessao,
    ritualAtual: { ...atual, etapa: "resolvido" },
  });
}

/** Encerra o Ritual resolvido e libera o botão para outro uso. */
export function encerraRitual(sessao, feiticoId) {
  const atual = ritualEmAndamento(sessao);
  if (!atual || atual.feiticoId !== feiticoId || atual.etapa !== "resolvido") return sessao;
  const limpo = { ...sessao, ritualAtual: null };
  return atual.usaRitualista ? desarmaRitualistaDoFeitico(limpo, feiticoId) : limpo;
}

/**
 * Desliga o Ritual daquele Feitiço e libera imediatamente outro uso.
 * As melhorias permanecem salvas para uma ativação futura. Ritualista já
 * consumido não é devolvido, seguindo o mesmo caminho de Cancelar e Encerrar.
 */
export function desativaRitual(sessao, feiticoId) {
  if (!feiticoId) return sessao;
  const atual = ritualEmAndamento(sessao);
  let proxima = sessao;
  if (atual?.feiticoId === feiticoId) {
    proxima = atual.etapa === "resolvido"
      ? encerraRitual(sessao, feiticoId)
      : cancelaRitual(sessao, feiticoId);
  }
  return configuraRitual(proxima, feiticoId, (ritual) => ({ ...ritual, ativo: false }));
}

/** Empilha uma rolagem no log, com teto. O mais novo fica em cima. */
export function registraRolagem(sessao, rolagem) {
  return { ...sessao, log: [rolagem, ...sessao.log].slice(0, LOG_MAX) };
}

export { LOG_MAX };
