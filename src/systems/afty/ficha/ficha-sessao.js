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
import {
  regrasDoTipoValor, ESTADOS_INVOCACAO, ESTADOS_TERMINAIS, ESTADOS_EM_CAMPO, estadoDaLinha,
  FONTE_PV_MECHA, entradaDeMesaDaHorda,
} from "../afty-invocacoes-tipos";
import { AFTY_TAMANHOS } from "../afty-schema";
import { normalizaAdaptacoes, avancarAdaptacoesNaRodada } from "../afty-adaptacao";
import { avancaArmasTransformaveis } from "../afty-armas-transformaveis";
import { ESTADO_APICE, RODADAS_APICE } from "../afty-talisma-apice";
import {
  PROPRIEDADES_GOLPE, vezesDaPropriedade, marcasDoGolpe, custoDoGolpe, normalizaGolpeEspecial,
} from "../afty-golpe-especial";

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
    /* ⚠ PISO ZERO, como no `aparaSessao` e no `descansar`. Esta era a única das
       três que não aparava, e a diferença não tinha como aparecer até
       2026-09-09: nada podia derivar negativo. A Passiva da Ficha de Jogador
       pode (ela tira o dobro do nível dela do PE Máximo, sem piso, por decisão
       do autor), e sem isto um combatente novo num Encontro nascia com o PE
       corrente negativo e só se corrigia no primeiro `aparaSessao`.

       O MÁXIMO continua podendo ser negativo. Quem apara é a pilha CORRENTE,
       que é o que se gasta na mesa. */
    hpAtual: Math.max(0, derived?.hp ?? 0),
    peAtual: Math.max(0, derived?.pe ?? 0),
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
    /* O MÁXIMO DE ALMA QUE ESTA SESSÃO JÁ VIU (2026-09-18). Existe por uma frase
       do livro que nunca tinha sido implementada: *"Sempre que seu máximo de
       Pontos de Vida aumentar, sua Integridade deve ser atualizada."*

       Sem ele, comprar a Consciência Absoluta da Alma subia o MÁXIMO de 162 para
       187 e deixava a corrente em 162, calada: a barra abria em 162 de 187 e o
       efeito parecia não ter funcionado. No jogador isso ficou pior ainda depois
       que o PV máximo passou a seguir a Alma corrente, porque os +25 de Alma
       deixavam de virar +25 de Vida.

       O que o `aparaSessao` faz com ele é somar a SUBIDA na corrente, e não
       encher: alma ferida continua ferida do mesmo tanto (autor, 2026-09-18). */
    almaMaxVisto: derived?.almaMax ?? 100,
    rodada: 0,
    /* GUARDA INABALÁVEL: quantos golpes já desgastaram o bônus nesta rodada, e
       se ela foi encerrada antes da hora (Raio Negro ou uma das oito condições).
       O bônus corrente e a Vida não moram aqui: o bônus SAI dos golpes e a Vida
       está no `pvTempFontes`, com a chave da Guarda. Ver `resolveGuarda`. */
    guardaGolpes: 0,
    guardaEncerrada: false,
    /* NÍVEL DE EXAUSTÃO (2026-09-09). Nasceu com o Vislumbre Celeste, cuja
       Fadiga Mental vira Exaustão ao encher, mas NÃO é dele: seis Habilidades
       Lendárias e a Expansão de Domínio dizem "você recebe um ponto de
       exaustão" desde sempre, e a ficha não tinha onde marcar. Por isso ele fica
       aqui, na sessão de todo mundo, e não atrás de primitiva nenhuma.

       ⚠ O QUE UM NÍVEL FAZ AINDA NÃO TEM FONTE NO AFTY. "Exausto" existe como
       nome de condição na lista da 2.5.2 e o `CONDICAO_TEXTOS` daqui está vazio,
       esperando o autor. Até lá o contador CONTA e MOSTRA, e a penalidade é de
       mesa. Está em docs/a-fazer.md. */
    exaustao: 0,
    combate: {},
    condicoes: [],
    buffs: [],
    /* AS INVOCAÇÕES NA MESA (2026-08-31): `{ [invId]: { emCampo, pvAtual,
       pvTempFontes, almaAtual, auxilios } }`.

       ⚠ ELAS ENTRARAM NA SESSÃO, e até aqui não estavam. O comentário da aba
       dizia o porquê: *"o PV da Invocação NÃO entra na sessão. Ele é o MÁXIMO, e
       não um recurso gasto"*. O que faltava era o descanso saber o que fazer com
       elas, e agora sabe (ver `descansar`). Sem isto o Controlador jogava a peça
       central do personagem dele anotando PV num papel ao lado.

       ⚠ MAPA POR ID, e não lista paralela à da ficha. A ordem das invocações
       muda no criador (elas sobem e descem), e uma lista por índice trocaria o
       PV de duas invocações de lugar sem ninguém ver. */
    invocacoes: {},
    /* O TITÃ NA MESA (2026-09-22): `{ cabeca, membros: [] }`. `null` quer dizer
       CHEIO, mesma convenção do PV de Invocação: a barra nasce cheia sem
       precisar de uma sessão que já saiba o máximo. Ver `afty-tita.js` para o
       máximo de cada parte. */
    tita: { cabeca: null, membros: [] },
    /* PONTOS DE PREPARO correntes (Combatente, Artes do Combate), desde
       2026-09-23. `null` quer dizer CHEIO, a convenção do PV de Invocação e do
       Titã: quem não é Combatente nunca escreve aqui, e quem é nasce cheio sem
       a sessão precisar saber o máximo. Ver `alteraPreparo`. */
    preparoAtual: null,
    // A casca de Preparo temporário (Postura do Céu), topada a cada rodada.
    preparoTemp: 0,
    /* As marcas do Golpe Especial que não viram número (Amplo, Impactante,
       Preciso, Sanguinário, Lento, Sacrifício), desde 2026-09-24. As que viram
       número são estados de bancada e moram no `combate`. Ver
       afty-golpe-especial.js. */
    golpeEspecial: {},
    // A Reserva para Invocação (Controlador 10°, 2026-09-30). Ver `ativaReservaInvocacao`.
    reservaInvocacao: { usada: false, modo: null, restantes: 0 },
    /* A cena dos compostos (2026-10-01, Etapa 9): a Quimera que já entrou nesta
       cena ("só pode manter 1 Quimera ativa por cena") e os líderes de Horda
       dissipada no combate ("se utilizar o líder da antiga horda em outra horda,
       ela tem seus pontos de vida máximos reduzidos pela metade"). */
    quimeraDaCena: null,
    lideresDeHordaDissolvida: [],
    // O que o mestre CONCEDEU nesta sessão (Addons 8.3). Estado de sessão e
    // nunca ficha, por decisão do autor (2026-08-20): vale para tudo, não gasta
    // vaga nenhuma e morre junto com a sessão. Ver `afty-concessao.js`.
    concedido: [],
    adaptacoes: {},
    // Interruptores manuais de efeitos condicionais abertos por Treinamentos.
    treinosAtivos: {},
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
 * A Alma corrente e o máximo já visto, na leitura do armazenamento.
 *
 * ⚠ MIGRAÇÃO ÚNICA (autor, 2026-09-18). Sessão gravada antes desta data não tem
 * `almaMaxVisto`, e a de JOGADOR abre com a Alma CHEIA. O motivo é que até aqui o
 * máximo da Alma subia sem levar a corrente junto, e o número gravado não
 * distingue uma alma ferida de uma alma que só ficou para trás. Com o PV máximo
 * passando a seguir a Alma corrente, preservar o número travado deixaria toda
 * ficha existente com menos Vida máxima do que ela tem direito, que é o oposto do
 * conserto. Entre isso e curar alguma ferida real, o autor escolheu encher.
 *
 * ⚠ A CRIATURA NÃO É TOCADA. Lá a Alma sempre foi porcentagem e sempre multiplicou
 * o PV, então o número gravado é ferida de verdade e encher seria apagá-la.
 */
function almaLida(bruta, base, derived) {
  const almaMax = Math.max(0, derived?.almaMax ?? 100);
  const gravada = Math.max(0, inteiro(bruta.almaAtual, base.almaAtual));
  // Sessão nova em folha já nasce com o campo, então a ausência dele é sempre
  // sessão velha. O `almaMaxVisto` é gravado para os dois sistemas: quando a
  // regra da criatura for decidida, o número já estará lá e será verdadeiro.
  if (bruta.almaMaxVisto == null) {
    const jogador = derived?.sistema === "player";
    return { almaAtual: jogador ? almaMax : gravada, almaMaxVisto: almaMax };
  }
  return {
    almaAtual: gravada,
    almaMaxVisto: Math.max(0, inteiro(bruta.almaMaxVisto, almaMax)),
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
    // Sessão gravada antes de 2026-09-09 não tem o campo, e zero é o certo.
    exaustao: Math.max(0, Math.trunc(Number(bruta.exaustao) || 0)),
    peTempFontes: normalizaPeTemp(bruta.peTempFontes),
    ...almaLida(bruta, base, derived),
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
    adaptacoes: normalizaAdaptacoes(bruta.adaptacoes),
    treinosAtivos: bruta.treinosAtivos && typeof bruta.treinosAtivos === "object"
      ? Object.fromEntries(Object.entries(bruta.treinosAtivos).map(([id, ativo]) => [id, !!ativo]))
      : {},
    invocacoes: normalizaInvocacoesSessao(bruta.invocacoes),
    tita: normalizaTitaSessao(bruta.tita, derived?.titaColosso?.membros),
    // Sessão gravada antes de 2026-09-23 não tem o campo, e cheio é o certo.
    preparoAtual: bruta.preparoAtual == null ? null : Math.max(0, inteiro(bruta.preparoAtual, 0)),
    preparoTemp: Math.max(0, inteiro(bruta.preparoTemp, 0)),
    golpeEspecial: normalizaGolpeEspecial(bruta.golpeEspecial),
    reservaInvocacao: normalizaReserva(bruta.reservaInvocacao),
    quimeraDaCena: typeof bruta.quimeraDaCena === "string" ? bruta.quimeraDaCena : null,
    lideresDeHordaDissolvida: lista(bruta.lideresDeHordaDissolvida).filter((x) => typeof x === "string"),
    favoritos: lista(bruta.favoritos),
    log: lista(bruta.log).slice(0, LOG_MAX),
  };
}

/* ============================================================ */
/* AS INVOCAÇÕES NA MESA                                         */
/* ============================================================ */
/**
 * ⚠ ENTRADA ÓRFÃ SOBREVIVE, e é a mesma escolha da concessão logo acima: a
 * invocação some da ficha por um instante enquanto alguém edita o criador com a
 * Ficha aberta noutra aba, e apagar o PV dela por causa disso seria perder a
 * luta. O que não existe simplesmente não é desenhado.
 */
/* ============================================================
   OS ESTADOS DE UMA INVOCAÇÃO NA MESA (2026-09-30, Etapa 3)
   ============================================================
   Eram três booleanos (`emCampo`, `abatida`, `exorcizada`), e com eles a mesa
   só sabia dizer "em campo", "caiu" e "morreu". Os tipos do Mecânicas caem de
   jeitos diferentes, então o estado virou um nome só, e a transição sai das
   regras do tipo (`regras.aZero` e `regras.terminal`, em afty-invocacoes-tipos.js).

   ⚠ NENHUM ESTADO APAGA A FICHA (decisão do autor, 2026-09-30). Morte permanente
   é estado, e remover a invocação é ação manual no criador.

   ⚠ OS TRÊS BOOLEANOS CONTINUAM ESCRITOS, derivados do estado, em toda linha.
   O `resolveInvocacao` lê `emCampo` do mapa cru, e sessão e Encontro salvos antes
   desta etapa só têm os booleanos. Ver `comBooleanos` e `estadoLegado`. */
/* Os conjuntos de estado moram na folha de tipos (afty-invocacoes-tipos.js), que
   o derive também lê, e saem daqui de novo para quem sempre os importou. */
export { ESTADOS_INVOCACAO, ESTADOS_TERMINAIS, ESTADOS_EM_CAMPO };
const ESTADO_VALIDO = new Set(ESTADOS_INVOCACAO);

/** O rótulo de tela de cada estado. */
export const ROTULO_ESTADO_INVOCACAO = {
  fora: "Fora de Campo", guardada: "Guardada", ativa: "Em Campo", dissipada: "Dissipada",
  desativada: "Desativada", quebrada: "Quebrada", recolhida: "Recolhida",
  exorcizada: "Exorcizada", destruida: "Destruída", morta: "Morta",
};

/** O estado de uma linha gravada no formato antigo. ⚠ Nada é convertido pelo
    tipo: uma Maldição que estava "abatida" (a regra de antes) continua
    dissipada, e a regra nova do tipo vale do próximo golpe em diante. */
const estadoLegado = (e) => estadoDaLinha({ ...e, estado: undefined });

/** A fração do PV com que ela volta: `null`, ou um número em (0, 1]. */
function fracaoDeRetorno(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n <= 1 ? n : null;
}

/** Os três booleanos antigos, derivados do estado. `abatida` é "volta com uma
    fração da vida", que é o que ela sempre quis dizer. */
function comBooleanos(linha) {
  return {
    ...linha,
    emCampo: linha.estado === "ativa",
    abatida: linha.retorno != null,
    exorcizada: ESTADOS_TERMINAIS.has(linha.estado),
  };
}

function normalizaEntrada(e) {
  if (!e || typeof e !== "object") return null;
  return { via: String(e.via || "invocar"), rodada: inteiro(e.rodada, 0), custo: Math.max(0, inteiro(e.custo, 0)) };
}

function normalizaInvocacoesSessao(bruto) {
  if (!bruto || typeof bruto !== "object") return {};
  const out = {};
  for (const [id, e] of Object.entries(bruto)) {
    if (!id || !e || typeof e !== "object") continue;
    out[id] = comBooleanos({
      estado: ESTADO_VALIDO.has(e.estado) ? e.estado : estadoLegado(e),
      /* ⚠ `null` quer dizer CHEIO, e não zero. A invocação nasce sem linha na
         sessão, e a primeira vez que a Ficha a desenha ela tem de aparecer com
         a vida inteira. Um zero aqui a mataria só por ter sido olhada.
         ⚠ PODE SER NEGATIVO: o Corpo desativado desce até −PV máximo. Quem
         apara pelo tipo é o `aparaInvocacoes`, que conhece o máximo. */
      pvAtual: e.pvAtual == null ? null : inteiro(e.pvAtual, 0),
      almaAtual: e.almaAtual == null ? null : Math.max(0, inteiro(e.almaAtual, 0)),
      pvTempFontes: normalizaPvTemp(e.pvTempFontes, null),
      auxilios: (e.auxilios && typeof e.auxilios === "object") ? { ...e.auxilios } : {},
      /* Linha antiga sem `estado`: a `abatida` de antes era a volta pela metade. */
      retorno: fracaoDeRetorno(e.retorno) ?? (e.estado == null && e.abatida ? 0.5 : null),
      quedas: Math.max(0, inteiro(e.quedas, 0)),
      exorcismos: Math.max(0, inteiro(e.exorcismos, 0)),
      bloqueadaAteFimDaCena: !!e.bloqueadaAteFimDaCena,
      ultimaEntrada: normalizaEntrada(e.ultimaEntrada),
      ...camposDeIntrinseca(e),
    });
  }
  return out;
}

/**
 * Tudo que a mesa opera como invocação: as da ficha e as QUIMERAS válidas.
 *
 * ⚠ A QUIMERA ENTRA COM A RESOLVIDA DELA (2026-09-23), sob o id `quimera:<id>`
 * que o `resolveQuimera` dá à cópia sintética. É o mesmo formato de invocação, com
 * PV, Integridade, Ações e auxílios, então a sessão a guarda na mesma tabela e os
 * escritores daqui servem para ela sem uma linha nova. Quem procurava o
 * máximo só em `derived.invocacoes.lista` achava zero para a Quimera, e zero de
 * máximo mata no primeiro clique.
 */
export function invocacoesDaMesa(derived) {
  const quimeras = (derived?.quimeras?.lista ?? [])
    .filter((q) => q.valido && q.resolvida)
    .map((q) => q.resolvida);
  /* As Hordas, os Corpos de Múltiplos Núcleos e o Mecha (2026-10-01, Etapa 9),
     pelo mesmo motivo da Quimera: a sessão procura o máximo de PV aqui. */
  const hordas = (derived?.hordas?.lista ?? []).map(entradaDeMesaDaHorda).filter(Boolean);
  const nucleos = (derived?.multiplosNucleos?.lista ?? [])
    .filter((g) => g.valido && g.resolvida)
    .map((g) => g.resolvida);
  return [
    ...(derived?.invocacoes?.lista ?? []), ...quimeras, ...hordas, ...nucleos,
    ...(derived?.mecha ? [derived.mecha] : []),
  ];
}

/** A invocação (ou Quimera) resolvida daquele id, ou `null`. */
export function invocacaoDaMesa(derived, invId) {
  if (!invId) return null;
  return invocacoesDaMesa(derived).find((i) => i.id === invId) ?? null;
}

/**
 * A linha daquela invocação, com o padrão de quem nunca foi tocada, mais três
 * campos de TELA que nunca são gravados: o rótulo do estado, se é morte
 * permanente e se ocupa vaga em campo. Eles saem daqui para a aba não importar a
 * sessão, que puxaria meio sistema para dentro de um componente de tela.
 */
export function estadoDaInvocacao(sessao, invId) {
  const linha = linhaDaInvocacao(sessao, invId);
  return {
    ...linha,
    rotulo: ROTULO_ESTADO_INVOCACAO[linha.estado],
    terminal: ESTADOS_TERMINAIS.has(linha.estado),
    /* A Bem Treinada em tarefa fora do combate "não é considerada como uma
       Invocação em Campo" (Adicionais). */
    contaNoCampo: ESTADOS_EM_CAMPO.has(linha.estado) && !linha.emTarefa,
    // Dentro de um composto ativo (2026-10-01, Etapa 9): o id dele e o rótulo.
    emComposto: compostoAtivoDe(sessao, invId),
    rotuloComposto: rotuloDoComposto(compostoAtivoDe(sessao, invId)),
  };
}

/** A linha GRAVÁVEL: só o que a sessão guarda. */
function linhaDaInvocacao(sessao, invId) {
  const e = sessao?.invocacoes?.[invId];
  const estado = ESTADO_VALIDO.has(e?.estado) ? e.estado : estadoLegado(e);
  const retorno = fracaoDeRetorno(e?.retorno) ?? (e && e.estado == null && e.abatida ? 0.5 : null);
  return comBooleanos({
    estado,
    pvAtual: e?.pvAtual ?? null,
    almaAtual: e?.almaAtual ?? null,
    pvTempFontes: e?.pvTempFontes ?? {},
    auxilios: e?.auxilios ?? {},
    retorno,
    quedas: Math.max(0, inteiro(e?.quedas, 0)),
    exorcismos: Math.max(0, inteiro(e?.exorcismos, 0)),
    bloqueadaAteFimDaCena: !!e?.bloqueadaAteFimDaCena,
    ultimaEntrada: e?.ultimaEntrada ?? null,
    ...camposDeIntrinseca(e),
  });
}

/**
 * O estado de mesa das Intrínsecas e Auras (2026-09-30, Etapa 6):
 *   auras     { [caracId]: true }, as Auras desta invocação em que o dono está
 *   emTarefa  a Bem Treinada cumprindo um comando fora do combate (sai da contagem)
 *   forma     "arma" | "armadura" | null, a Forma ligada. Ela segue EM CAMPO
 */
function camposDeIntrinseca(e) {
  const auras = {};
  for (const [id, v] of Object.entries((e?.auras && typeof e.auras === "object") ? e.auras : {})) if (v) auras[id] = true;
  const opcoes = {};
  for (const [id, v] of Object.entries((e?.opcoesDeEntrada && typeof e.opcoesDeEntrada === "object") ? e.opcoesDeEntrada : {})) if (v) opcoes[id] = true;
  return {
    auras,
    emTarefa: !!e?.emTarefa,
    forma: e?.forma === "arma" || e?.forma === "armadura" ? e.forma : null,
    /* As opções do Controlador (2026-09-30, Etapa 7): o que a mesa marcou para a
       PRÓXIMA entrada (Autonomia, Resistência Sobrecarregada), o que a entrada
       deixou valendo enquanto ela está em campo, e quantas vezes ela entrou desde
       o descanso (o Fantoche Supremo entra uma vez só). */
    opcoesDeEntrada: opcoes,
    autonomia: !!e?.autonomia,
    sobrecargaPv: Math.max(0, inteiro(e?.sobrecargaPv, 0)),
    entradasDesdeDescanso: Math.max(0, inteiro(e?.entradasDesdeDescanso, 0)),
    /* A duração do Corpo Amaldiçoado (2026-09-30, Etapa 8): as rodadas de combate
       desde que ele entrou (ou desde que o combate começou com ele em campo), e a
       manutenção da rodada que ainda não foi paga. Ver `avancaInvocacoesNaRodada`. */
    rodadasAtiva: Math.max(0, inteiro(e?.rodadasAtiva, 0)),
    manutencaoPendente: !!e?.manutencaoPendente,
    /* Os compostos (2026-10-01, Etapa 9). Na linha do COMPOSTO: quem está dentro
       (`componentes`), os membros ativos da Horda (`null` é todos), a metade do PV
       máximo do líder reaproveitado, a perda de metade já aplicada, o núcleo ativo
       do Corpo de Múltiplos Núcleos e as duas Marionetes do Mecha. */
    componentes: Array.isArray(e?.componentes) ? e.componentes.filter((x) => typeof x === "string") : [],
    membrosAtivos: Array.isArray(e?.membrosAtivos) ? e.membrosAtivos.filter((x) => typeof x === "string") : null,
    pvMaxMetade: !!e?.pvMaxMetade,
    metadePerdida: !!e?.metadePerdida,
    nucleoAtivo: typeof e?.nucleoAtivo === "string" ? e.nucleoAtivo : null,
    maiorId: typeof e?.maiorId === "string" ? e.maiorId : null,
    menorId: typeof e?.menorId === "string" ? e.menorId : null,
    menorQuebrada: !!e?.menorQuebrada,
  };
}

/** A linha de um composto que acabou: fora de campo, sem nada dentro. */
const COMPOSTO_DESFEITO = {
  estado: "fora", pvAtual: null, pvTempFontes: {}, auxilios: {}, auras: {}, forma: null,
  autonomia: false, sobrecargaPv: 0, retorno: null, quedas: 0, exorcismos: 0,
  componentes: [], membrosAtivos: null, pvMaxMetade: false, metadePerdida: false,
  maiorId: null, menorId: null, menorQuebrada: false, rodadasAtiva: 0, manutencaoPendente: false,
};

/** As linhas que são de composto que se DESFAZ (Horda, Quimera, Mecha). O Corpo
    de Múltiplos Núcleos é um Corpo de verdade, e segue as regras dele. */
const ehCompostoQueSeDesfaz = (id) => /^(horda|quimera):/.test(id) || id === "mecha";

/**
 * O composto ATIVO que tem esta invocação dentro (o id da linha dele), ou null.
 * Quem está numa Horda, numa Quimera, num Mecha ou num grupo de núcleos não entra
 * em campo sozinho, e o Mecha não se desfaz por um componente sair.
 */
export function compostoAtivoDe(sessao, invId) {
  if (!invId) return null;
  for (const [id, e] of Object.entries(sessao?.invocacoes || {})) {
    if (id === invId || estadoDaLinha(e) !== "ativa") continue;
    if (Array.isArray(e?.componentes) && e.componentes.includes(invId)) return id;
  }
  return null;
}

/** O rótulo de quem está dentro de um composto. */
export function rotuloDoComposto(id) {
  if (!id) return null;
  if (id === "mecha") return "No Mecha";
  if (id.startsWith("horda:")) return "Na Horda";
  if (id.startsWith("quimera:")) return "Na Quimera";
  if (id.startsWith("nucleos:")) return "Nos Núcleos";
  return "Em Composto";
}

/** A Reserva para Invocação, saneada. */
function normalizaReserva(r) {
  const modo = r?.modo === "metade" || r?.modo === "gratis" ? r.modo : null;
  return { usada: !!r?.usada, modo, restantes: modo ? Math.max(0, inteiro(r?.restantes, 0)) : 0 };
}

/** Escreve na linha daquela invocação, e refaz os booleanos. Devolve sessão nova. */
function comInvocacao(sessao, invId, partial) {
  if (!invId) return sessao;
  const atual = linhaDaInvocacao(sessao, invId);
  return {
    ...sessao,
    invocacoes: { ...(sessao.invocacoes || {}), [invId]: comBooleanos({ ...atual, ...partial }) },
  };
}

/** As regras de quem não as recebeu: o Shikigami, que é a regra de antes. */
const regrasOuPadrao = (regras) => regras || regrasDoTipoValor("shikigami");

/**
 * Para onde vai uma invocação cujo PV acabou de chegar a `pvDepois` (zero ou
 * menos, e o que passa de zero é o excedente). Devolve só o que muda.
 *
 * `jaCaida` diz que ela já estava a 0 ou menos antes do golpe: ela não "cai de
 * novo" (a Marionete não conta outra queda), e só o excedente decide.
 *
 * | Tipo (aZero)            | A 0 PV                          | Excedente acima do máximo |
 * |---|---|---|
 * | Shikigami (dissipada)   | dissipada, volta com ½          | exorcizada                |
 * | Técnica (dissipada)     | dissipada, volta com ½          | 1º: dissipada com ½. 2º antes do descanso: morta |
 * | Maldição (exorcizada)   | exorcizada                      | exorcizada                |
 * | Marionete (quebrada)    | quebrada (1ª volta com ½, 2ª com ¼), a 3ª queda destrói | destruída |
 * | Corpo (desativada)      | desativado, PV negativo         | a −PV máximo, destruído (núcleo quebrado) |
 */
export function transicaoDeQueda(regras, atual, pvDepois, max, jaCaida = false) {
  const r = regrasOuPadrao(regras);
  const maximo = Math.max(0, inteiro(max, 0));
  if (pvDepois > 0) return null;
  const passou = -pvDepois > maximo;   // "dano excedente SUPERIOR ao seu máximo de vida"
  const sai = { auxilios: {}, pvTempFontes: {}, auras: {}, forma: null, autonomia: false, sobrecargaPv: 0 };
  switch (r.aZero) {
    case "desativada": {
      if (pvDepois <= -maximo) return { ...sai, estado: "destruida", pvAtual: -maximo };
      return { ...sai, estado: "desativada", pvAtual: pvDepois };
    }
    case "quebrada": {
      if (passou) return { ...sai, estado: "destruida", pvAtual: 0 };
      if (jaCaida) return { ...sai, pvAtual: 0 };
      const quedas = (atual?.quedas || 0) + 1;
      if (quedas >= 3) return { ...sai, estado: "destruida", pvAtual: 0, quedas };
      return { ...sai, estado: "quebrada", pvAtual: 0, quedas, retorno: quedas === 1 ? 0.5 : 0.25 };
    }
    case "exorcizada":
      return { ...sai, estado: "exorcizada", pvAtual: 0 };
    case "dissipada":
    default: {
      if (!passou) return { ...sai, estado: "dissipada", pvAtual: 0, retorno: 0.5 };
      if (r.terminal === "morta") {
        const exorcismos = (atual?.exorcismos || 0) + 1;
        if (exorcismos >= 2) return { ...sai, estado: "morta", pvAtual: 0, exorcismos };
        return { ...sai, estado: "dissipada", pvAtual: 0, retorno: 0.5, exorcismos };
      }
      return { ...sai, estado: r.terminal, pvAtual: 0 };
    }
  }
}

/** O PV com que ela entra em campo agora. Guardada por vontade volta com o PV que
    tinha (Livro: "retornará com os mesmos pontos de vida que possuía quando
    dissipada"). Quem caiu volta com a fração. O resto, com o corrente. */
function pvInicialDe(atual, pvMax) {
  const max = Math.max(0, inteiro(pvMax, 0));
  if (atual.estado === "guardada") return atual.pvAtual;
  if (atual.retorno != null) return Math.floor(max * atual.retorno);
  return atual.pvAtual;
}

/**
 * A ENTRADA EM CAMPO (decisão do autor, 2026-09-30): uma função só para invocar e
 * ativar, porque "Ativar uma Invocação também conta como Invocá-la para todos os
 * efeitos" (Mecânicas). Quem quer saber se ela "acabou de ser invocada" lê
 * `contaComoInvocar`, e nunca compara a via.
 *
 * Pura: calcula, e não grava. Devolve `{ permitida, motivo, verbo, via,
 * contaComoInvocar, custo: { partes, total }, pvInicial }`.
 *
 * ⚠ O CUSTO SAI DO PE DO DONO na mesa (Ficha e Encontro), e a entrada recusa o
 * gasto que o PE não cobre. O Criador não chama esta função.
 */
export function entradaDaInvocacao(sessao, inv, { via = "invocar" } = {}) {
  const atual = estadoDaInvocacao(sessao, inv?.id);
  const regras = inv?.regras ?? regrasDoTipoValor(inv?.tipoMecanico);
  const verbo = regras.verbo === "ativar" ? "Ativar" : "Invocar";
  const nega = (motivo, custo = { partes: [], total: 0 }) => ({
    permitida: false, motivo, verbo, via, contaComoInvocar: false, custo, pvInicial: null,
  });
  if (!inv) return nega("Invocação Inexistente");
  if (ESTADOS_TERMINAIS.has(atual.estado)) return nega(ROTULO_ESTADO_INVOCACAO[atual.estado]);
  if (atual.estado === "ativa") return nega("Já Em Campo");
  if (atual.bloqueadaAteFimDaCena) return nega("Bloqueada Até o Fim da Cena");
  if (atual.estado === "quebrada" || atual.estado === "recolhida") return nega("Precisa Ser Reconstruída");
  if (atual.estado === "desativada") return nega("Núcleo Desativado");
  /* OS COMPOSTOS (2026-10-01, Etapa 9). Quem está dentro de um composto ativo não
     entra sozinho, e o composto só entra com todas as componentes livres (nem em
     campo, nem caídas, nem em outro composto, nem perdidas). */
  if (atual.emComposto) return nega(atual.rotuloComposto);
  // "Um Controlador só pode manter 1 Quimera ativa por cena" (Mecânicas).
  const ehQuimera = String(inv.id).startsWith("quimera:");
  if (ehQuimera && sessao?.quimeraDaCena && sessao.quimeraDaCena !== inv.id) return nega("Uma Quimera por Cena");
  for (const cid of Array.isArray(inv.componentesIds) ? inv.componentesIds : []) {
    const c = estadoDaInvocacao(sessao, cid);
    if (c.terminal || c.bloqueadaAteFimDaCena || c.emComposto
      || ["ativa", "quebrada", "recolhida", "desativada"].includes(c.estado)) {
      return nega("Componente Indisponível");
    }
  }
  /* Fantoche Supremo: "você só pode Invocar o seu fantoche supremo uma vez por
     descanso longo" (o botão de descanso é um só, e vale como longo). */
  if ((inv.marcadores ?? []).some((m) => m?.id === "fantoche_supremo") && atual.entradasDesdeDescanso >= 1) {
    return nega("Fantoche Supremo: Uma Vez por Descanso");
  }
  /* "Caso a Invocação seja dissipada voluntariamente, você pode optar por a
     retornar sem pagar o seu custo novamente" (Livro). */
  const voluntaria = atual.estado === "guardada";
  const base = voluntaria ? 0 : Math.max(0, inteiro(inv.custo, 0));
  const partes = voluntaria
    ? [{ label: "Retorno Sem Custo", valor: 0 }]
    : (Array.isArray(inv.fontes?.custo) && inv.fontes.custo.length ? [...inv.fontes.custo] : [{ label: "Custo", valor: base }]);
  /* RESERVA PARA INVOCAÇÃO (E-01, 2026-09-30): "trazer duas invocações com o custo
     reduzido pela metade ou uma invocação sem custo". Reduz o custo DA INVOCAÇÃO,
     e não o que se paga a mais (Autonomia, Sobrecarga). Arredonda para baixo. */
  const reserva = normalizaReserva(sessao?.reservaInvocacao);
  let custoDaInvocacao = base;
  let usaReserva = null;
  if (reserva.modo && reserva.restantes > 0 && base > 0) {
    const reducao = reserva.modo === "gratis" ? base : base - Math.floor(base / 2);
    custoDaInvocacao = base - reducao;
    partes.push({ label: "Reserva para Invocação", valor: -reducao });
    usaReserva = reserva.modo;
  }
  /* As opções marcadas para esta entrada: Autonomia (paga na entrada) e
     Resistência Sobrecarregada (PE a mais, PV máximo a mais em campo).

     ⚠ A AUTONOMIA DA MALDIÇÃO é paga "no início do combate" (Mecânicas), e é o
     `iniciaInvocacoesNoCombate` quem a cobra. Ativada com o combate JÁ correndo,
     a entrada dela é a entrada apropriada (decisão do autor, PV-10), e a
     Autonomia vem junto. */
  const emCombate = inteiro(sessao?.rodada, 0) > 0 || !!sessao?.combate?.ativo;
  let extras = 0;
  let autonomia = false;
  let sobrecargaPv = 0;
  for (const o of inv.opcoesDeUso ?? []) {
    const cobraAgora = o.quando === "entrada" || (o.quando === "inicioCombate" && emCombate);
    if (!atual.opcoesDeEntrada?.[o.id] || !cobraAgora || !Number.isFinite(o.custo)) continue;
    extras += o.custo;
    partes.push({ label: o.nome, valor: o.custo });
    if (o.id === "autonomia") autonomia = true;
    if (o.id === "sobrecarga") sobrecargaPv = Math.max(0, inteiro(o.pv, 0));
  }
  const total = custoDaInvocacao + extras;
  const custo = { partes, total };
  const disponivel = Math.max(0, inteiro(sessao?.peAtual, 0)) + peTempTotal(sessao);
  if (total > disponivel) return nega("PE Insuficiente", custo);
  return {
    permitida: true, motivo: null, verbo,
    via: voluntaria ? "retornoVoluntario" : usaReserva ? "reserva" : via,
    contaComoInvocar: true, custo, pvInicial: pvInicialDe(atual, inv.pv),
    usaReserva, autonomia, sobrecargaPv,
    /* O Corpo com CL 0 "dura" zero rodadas: ativado com o combate correndo, a
       manutenção já vale para esta rodada. */
    manutencaoImediata: !!inv.duracao && emCombate && inteiro(inv.duracao.rodadas, 0) <= 0,
    /* Os compostos: quem vai dentro, a Quimera da cena e a Horda de um líder que
       liderou outra dissipada neste combate (metade do PV máximo). */
    componentes: Array.isArray(inv.componentesIds) ? [...inv.componentesIds] : [],
    quimeraDaCena: ehQuimera ? inv.id : null,
    pvMaxMetade: !!inv.horda && (sessao?.lideresDeHordaDissolvida ?? []).includes(inv.liderId),
  };
}

/** Grava a entrada já calculada: gasta o PE (casca primeiro) e põe em campo. */
export function entraEmCampo(sessao, invId, entrada) {
  if (!invId || !entrada?.permitida) return sessao;
  let pago = gastaPe(sessao, entrada.custo?.total ?? 0);
  // A Reserva gasta uma entrada: a "Sem Custo" acaba nela, e a "pela Metade" vale para duas.
  if (entrada.usaReserva) {
    const r = normalizaReserva(pago.reservaInvocacao);
    const restantes = Math.max(0, r.restantes - 1);
    pago = { ...pago, reservaInvocacao: { ...r, restantes, modo: restantes ? r.modo : null } };
  }
  const atual = linhaDaInvocacao(sessao, invId);
  if (entrada.quimeraDaCena) pago = { ...pago, quimeraDaCena: entrada.quimeraDaCena };
  return comInvocacao(pago, invId, {
    estado: "ativa",
    // A Horda com metade do PV máximo nasce CHEIA dele: o `null` é o máximo novo.
    pvAtual: entrada.pvMaxMetade ? null : entrada.pvInicial,
    componentes: Array.isArray(entrada.componentes) ? entrada.componentes : [],
    membrosAtivos: null,
    pvMaxMetade: !!entrada.pvMaxMetade,
    metadePerdida: false,
    ultimaEntrada: { via: entrada.via, rodada: inteiro(sessao.rodada, 0), custo: entrada.custo?.total ?? 0 },
    autonomia: !!entrada.autonomia,
    sobrecargaPv: Math.max(0, inteiro(entrada.sobrecargaPv, 0)),
    opcoesDeEntrada: {},
    entradasDesdeDescanso: atual.entradasDesdeDescanso + 1,
    rodadasAtiva: 0,
    manutencaoPendente: !!entrada.manutencaoImediata,
  });
}

/** Marca ou desmarca uma opção do Controlador para a PRÓXIMA entrada desta
    invocação (Autonomia, Resistência Sobrecarregada). Quem cobra é a entrada. */
export function alternaOpcaoDeEntrada(sessao, invId, opcaoId, ligado) {
  if (!opcaoId) return sessao;
  const atual = linhaDaInvocacao(sessao, invId);
  const opcoesDeEntrada = { ...atual.opcoesDeEntrada };
  if (ligado) opcoesDeEntrada[opcaoId] = true;
  else delete opcoesDeEntrada[opcaoId];
  return comInvocacao(sessao, invId, { opcoesDeEntrada });
}

/**
 * Usa a Reserva para Invocação (Controlador 10°): "Uma vez por descanso curto,
 * você pode optar por usar a ação Invocar para trazer duas invocações com o custo
 * reduzido pela metade ou uma invocação sem custo". `modo` é "metade" (vale para
 * as duas próximas entradas) ou "gratis" (vale para a próxima). Uma vez por
 * descanso: depois de usada, só o descanso a devolve.
 */
export function ativaReservaInvocacao(sessao, modo) {
  const r = normalizaReserva(sessao?.reservaInvocacao);
  if (r.usada || (modo !== "metade" && modo !== "gratis")) return sessao;
  return { ...sessao, reservaInvocacao: { usada: true, modo, restantes: modo === "metade" ? 2 : 1 } };
}

/** Invoca ou ativa pela mesa, com o custo e as regras da resolvida. */
export function invocaNaMesa(sessao, derived, invId, opcoes = {}) {
  const inv = invocacaoDaMesa(derived, invId);
  return entraEmCampo(sessao, invId, entradaDaInvocacao(sessao, inv, opcoes));
}

/**
 * Tira de campo por vontade. Fica GUARDADA, com o PV que tinha: dissipar não
 * zera nada, e quem não dissipa (Marionete, Corpo, Maldição) fica fora de
 * combate do mesmo jeito. Os auxílios e a casca de PV caem: bônus que sobrevive
 * à fonte é bug com cara de número.
 */
export function saiDeCampo(sessao, invId) {
  const atual = estadoDaInvocacao(sessao, invId);
  if (atual.estado !== "ativa") return sessao;
  // O componente de um Mecha não sai sozinho: quem desfaz é o Separar.
  if (atual.emComposto === "mecha") return sessao;
  if (invId === "mecha") return separaMecha(sessao);
  /* "Uma Horda só pode ser dissipada voluntariamente no final do combate"
     (Livro). Com o combate correndo, o botão é recusado, e a Horda sai pela queda. */
  if (String(invId).startsWith("horda:")) {
    if (emCombateNaSessao(sessao)) return sessao;
    return comInvocacao(sessao, invId, COMPOSTO_DESFEITO);
  }
  return comInvocacao(sessao, invId, {
    estado: "guardada", auxilios: {}, pvTempFontes: {}, auras: {}, forma: null, autonomia: false, sobrecargaPv: 0,
    rodadasAtiva: 0, manutencaoPendente: false,
    // A Quimera (e o grupo de núcleos) guardados soltam as componentes.
    componentes: [],
  });
}

/** O combate está correndo: a rodada saiu do zero ou o Encontro o abriu. */
export const emCombateNaSessao = (sessao) => inteiro(sessao?.rodada, 0) > 0 || !!sessao?.combate?.ativo;

/* ============================================================ */
/* OS COMPOSTOS NA MESA (2026-10-01, Etapa 9)                    */
/* ============================================================ */

/** Uma componente cai (dissipada pela regra do tipo dela) ou é exorcizada (o
    excedente acima do máximo, que também segue o tipo: a Técnica conta o
    exorcismo, a Marionete é destruída). */
function quedaDoComponente(sessao, m, exorciza = false) {
  if (!m?.id) return sessao;
  const atual = linhaDaInvocacao(sessao, m.id);
  if (ESTADOS_TERMINAIS.has(atual.estado)) return sessao;
  const max = Math.max(0, inteiro(m.pv, 0));
  const queda = transicaoDeQueda(m.regras, atual, exorciza ? -(max + 1) : 0, max, false);
  return queda ? comInvocacao(sessao, m.id, queda) : sessao;
}

/**
 * Dano numa HORDA (Livro, "Criando Hordas"):
 *   "Quando uma horda chega a metade dos seus pontos de vida máximos, ela perde
 *    metade dos seus membros, iniciando pelos de grau menor" (os que saem são
 *    dissipados pela regra do tipo de cada um);
 *   "Caso o dano que ela receba seja metade da vida máxima da horda, ultrapassando
 *    o limiar de metade da vida, toda Invocação que fosse ser dissipada é
 *    exorcizada".
 * A 0 PV a Horda acaba: o líder e os membros que sobraram caem pelo tipo (e são
 * exorcizados com o excedente acima do máximo), e o líder fica marcado, porque a
 * Horda foi dissipada durante o combate.
 */
function aplicaDanoHorda(sessao, h, bruto) {
  const dano = Math.max(0, inteiro(bruto, 0));
  if (!dano) return sessao;
  const atual = estadoDaInvocacao(sessao, h.id);
  if (atual.estado !== "ativa") return sessao;
  const max = Math.max(0, inteiro(h.pv, 0));
  const pv = atual.pvAtual ?? max;
  const { fontes, sobrou } = drenaPvTemp(atual.pvTempFontes, dano);
  const restante = pv - sobrou;
  const metade = Math.floor(max / 2);
  const membros = Array.isArray(h.membrosDetalhe) ? h.membrosDetalhe : [];
  let ativos = atual.membrosAtivos ?? membros.map((m) => m.id);
  let out = sessao;
  const parcial = { pvTempFontes: fontes, pvAtual: restante };
  if (!atual.metadePerdida && pv > metade && restante <= metade) {
    const exorciza = sobrou >= metade;
    const saem = membrosQueSaemDaMesa(membros.filter((m) => ativos.includes(m.id)));
    for (const id of saem) out = quedaDoComponente(out, membros.find((m) => m.id === id), exorciza);
    ativos = ativos.filter((id) => !saem.includes(id));
    Object.assign(parcial, { membrosAtivos: ativos, metadePerdida: true });
  }
  if (restante > 0) return comInvocacao(out, h.id, parcial);
  const passou = -restante > max;
  out = quedaDoComponente(out, { id: h.liderId, regras: h.regras, pv: h.liderPv }, passou);
  for (const id of ativos) out = quedaDoComponente(out, membros.find((m) => m.id === id), passou);
  out = { ...out, lideresDeHordaDissolvida: [...new Set([...(out.lideresDeHordaDissolvida ?? []), h.liderId])] };
  return comInvocacao(out, h.id, COMPOSTO_DESFEITO);
}

/** Os membros que saem na metade da vida: metade, para baixo, do menor grau para
    o maior, e no mesmo grau o último que entrou. Mesma conta do
    `membrosQueSaem` do resolvedor, que a sessão não pode importar. */
function membrosQueSaemDaMesa(ativos) {
  const n = Math.floor(ativos.length / 2);
  return ativos
    .map((m, i) => ({ id: m.id, rank: m.rank ?? 0, i }))
    .sort((a, b) => a.rank - b.rank || b.i - a.i)
    .slice(0, n)
    .map((m) => m.id);
}

/**
 * Dano na QUIMERA: segue a do Shikigami, e a queda chega às componentes
 * (Mecânicas): "Caso ela seja exorcizada, os Shikigamis que são seus componentes
 * não são exorcizados, mas não poderão ser invocados novamente durante a mesma
 * cena. Se ela for dissipada, as regras comuns se aplicam a todos os seus
 * componentes."
 */
function aplicaDanoQuimera(sessao, q, bruto) {
  const antes = linhaDaInvocacao(sessao, q.id);
  let out = aplicaDanoInvocacao(sessao, q.id, bruto, q.pv, regrasDoTipoValor("shikigami"));
  const depois = linhaDaInvocacao(out, q.id);
  if (antes.estado !== "ativa" || depois.estado === "ativa") return out;
  const componentes = antes.componentes.length ? antes.componentes : (q.componentesIds ?? []);
  for (const cid of componentes) {
    const c = linhaDaInvocacao(out, cid);
    if (ESTADOS_TERMINAIS.has(c.estado)) continue;
    out = ESTADOS_TERMINAIS.has(depois.estado)
      ? comInvocacao(out, cid, { bloqueadaAteFimDaCena: true })
      : comInvocacao(out, cid, { estado: "dissipada", pvAtual: 0, retorno: 0.5 });
  }
  return comInvocacao(out, q.id, { componentes: [] });
}

/**
 * Dano no MECHA (Mecânicas): a casca é o PV da Marionete menor, e "Se o PV
 * Temporário acabar, a Marionete com menor PV é quebrada e suas Ações e
 * Características são desativadas". "Todas as regras de Marionete são aplicadas
 * normalmente": a 0 PV a maior quebra também, e o Mecha se desfaz.
 */
function aplicaDanoMecha(sessao, derived, mecha, bruto) {
  const antes = linhaDaInvocacao(sessao, "mecha");
  if (antes.estado !== "ativa") return sessao;
  const cascaAntes = antes.pvTempFontes?.[FONTE_PV_MECHA] ?? 0;
  let out = aplicaDanoInvocacao(sessao, "mecha", bruto, mecha.pv, regrasDoTipoValor("marionete"));
  const depois = linhaDaInvocacao(out, "mecha");
  const comp = (id) => {
    const r = invocacaoDaMesa(derived, id);
    return r ? { id, regras: r.regras, pv: r.pv } : null;
  };
  if (!antes.menorQuebrada && cascaAntes > 0 && (depois.pvTempFontes?.[FONTE_PV_MECHA] ?? 0) <= 0) {
    out = quedaDoComponente(out, comp(antes.menorId), false);
    out = comInvocacao(out, "mecha", { menorQuebrada: true });
  }
  if (depois.estado === "ativa") return out;
  const destruido = ESTADOS_TERMINAIS.has(depois.estado);
  out = quedaDoComponente(out, comp(antes.maiorId), destruido);
  return comInvocacao(out, "mecha", COMPOSTO_DESFEITO);
}

/**
 * O DANO NA MESA, por quem leva: a Horda, a Quimera e o Mecha têm regra própria
 * de queda, e o resto é a invocação comum pela regra do tipo. É o escritor que a
 * Ficha e o Encontro chamam.
 */
export function aplicaDanoNaMesa(sessao, derived, invId, bruto) {
  const inv = invocacaoDaMesa(derived, invId);
  if (!inv) return sessao;
  if (inv.horda) return aplicaDanoHorda(sessao, inv, bruto);
  if (inv.mecha) return aplicaDanoMecha(sessao, derived, inv, bruto);
  if (String(invId).startsWith("quimera:")) return aplicaDanoQuimera(sessao, inv, bruto);
  return aplicaDanoInvocacao(sessao, invId, bruto, inv.pv, inv.regras);
}

/**
 * Pode formar o Mecha com estas duas? (Mecânicas, "Criando Mechas"): 5 níveis em
 * Controlador (o real, DA-13), duas Marionetes ativas, do mesmo tamanho e maiores
 * que o Controlador (o tamanho que a ficha já deriva, PV-19), e nenhum Mecha
 * ativo. A adjacência é de mesa. Devolve `{ permitido, motivo, maiorId, menorId }`.
 */
export function mechaPermitido(sessao, derived, idA, idB) {
  const nega = (motivo) => ({ permitido: false, motivo, maiorId: null, menorId: null });
  if ((derived?.invocacoes?.nivelControladorReal ?? 0) < 5) return nega("Pede 5 Níveis de Controlador");
  if (linhaDaInvocacao(sessao, "mecha").estado === "ativa") return nega("Já Há um Mecha");
  if (!idA || !idB || idA === idB) return nega("Escolha Duas Marionetes");
  const a = invocacaoDaMesa(derived, idA);
  const b = invocacaoDaMesa(derived, idB);
  if (!a || !b || a.regras?.familia !== "marionete" || b.regras?.familia !== "marionete") return nega("Só Marionetes");
  for (const id of [idA, idB]) {
    const e = estadoDaInvocacao(sessao, id);
    if (e.estado !== "ativa" || e.emComposto) return nega("As Duas Precisam Estar Ativas");
  }
  if (a.tamanho !== b.tamanho) return nega("Tamanhos Diferentes");
  const ordem = (v) => AFTY_TAMANHOS.findIndex((x) => x.value === v);
  if (ordem(a.tamanho) <= ordem(derived?.tamanho ?? "medio")) return nega("Precisam Ser Maiores que o Controlador");
  const [maior, menor] = (b.pv > a.pv) ? [b, a] : [a, b];
  return { permitido: true, motivo: null, maiorId: maior.id, menorId: menor.id };
}

/**
 * Forma o Mecha (Ação Bônus): "O PV de um Mecha é igual a maior PV de seus
 * componentes com o menor PV sendo utilizada como PV Temporário". O PV atual de
 * cada uma vai junto: a maior dá o PV do Mecha, e a menor, a casca. As duas
 * seguem ativas, e é assim que o Mecha "conta como duas Invocações em campo".
 */
export function formaMecha(sessao, derived, idA, idB) {
  const p = mechaPermitido(sessao, derived, idA, idB);
  if (!p.permitido) return sessao;
  const maior = invocacaoDaMesa(derived, p.maiorId);
  const menor = invocacaoDaMesa(derived, p.menorId);
  const casca = Math.max(0, inteiro(linhaDaInvocacao(sessao, p.menorId).pvAtual ?? menor.pv, 0));
  return comInvocacao(sessao, "mecha", {
    ...COMPOSTO_DESFEITO,
    estado: "ativa",
    pvAtual: linhaDaInvocacao(sessao, p.maiorId).pvAtual ?? maior.pv,
    pvTempFontes: { [FONTE_PV_MECHA]: casca },
    componentes: [p.maiorId, p.menorId],
    maiorId: p.maiorId,
    menorId: p.menorId,
    ultimaEntrada: { via: "mecha", rodada: inteiro(sessao.rodada, 0), custo: 0 },
  });
}

/** Separa o Mecha (Ação Bônus): "A Marionete com maior PV tem sua vida igualizada
    aos do Mecha, enquanto a com menor PV fica com sua vida igualizada aos PVs
    Temporários". A menor que já quebrou continua quebrada. */
export function separaMecha(sessao) {
  const m = linhaDaInvocacao(sessao, "mecha");
  if (m.estado !== "ativa" || !m.maiorId) return sessao;
  let out = comInvocacao(sessao, m.maiorId, { pvAtual: m.pvAtual });
  if (!m.menorQuebrada && m.menorId) {
    out = comInvocacao(out, m.menorId, { pvAtual: Math.max(0, inteiro(m.pvTempFontes?.[FONTE_PV_MECHA], 0)) });
  }
  return comInvocacao(out, "mecha", COMPOSTO_DESFEITO);
}

/** Troca o núcleo ativo de um Corpo de Múltiplos Núcleos (Ação Simples): "a
    Invocação muda sua ficha para o núcleo desativado, porém mantém o PV atual". */
export function trocaNucleo(sessao, derived, mesaId) {
  const g = invocacaoDaMesa(derived, mesaId);
  if (!Array.isArray(g?.nucleos) || g.nucleos.length < 2) return sessao;
  const atual = linhaDaInvocacao(sessao, mesaId).nucleoAtivo ?? g.nucleoAtivo;
  const outro = g.nucleos.find((n) => n.id !== atual)?.id;
  return outro ? comInvocacao(sessao, mesaId, { nucleoAtivo: outro }) : sessao;
}

/**
 * Paga a manutenção do Corpo Amaldiçoado nesta rodada: "Você pode mantê-los
 * ativos após isso gastando 1 de PE, caso eles sejam de Quarto a Segundo Grau,
 * ou 2 de PE, caso eles sejam de Primeiro a Grau Especial por rodada"
 * (Mecânicas). `custo` vem da resolvida (`duracao.manutencao`). Sem PE, nada
 * muda, e a próxima rodada o tira de campo.
 */
export function pagaManutencaoCorpo(sessao, invId, custo) {
  const atual = linhaDaInvocacao(sessao, invId);
  const pe = Math.max(0, inteiro(custo, 0));
  if (atual.estado !== "ativa" || !atual.manutencaoPendente) return sessao;
  if (pe > Math.max(0, inteiro(sessao?.peAtual, 0)) + peTempTotal(sessao)) return sessao;
  return comInvocacao(gastaPe(sessao, pe), invId, { manutencaoPendente: false });
}

/** O Corpo que acabou a duração sem manutenção sai de campo com o PV que tinha.
    Ele não dissipa (o tipo não deixa): só deixa de estar ativo. */
const corpoSemManutencao = {
  estado: "fora", auxilios: {}, pvTempFontes: {}, auras: {}, forma: null, autonomia: false, sobrecargaPv: 0,
  rodadasAtiva: 0, manutencaoPendente: false,
};

/**
 * A virada de rodada das invocações (2026-09-30, Etapa 8). Só o Corpo
 * Amaldiçoado conta rodadas: com a duração (CL rodadas) vencida, a rodada nova
 * pede a manutenção, e a que passou sem ela o tira de campo. Pura.
 */
function avancaInvocacoesNaRodada(sessao, derived) {
  let out = sessao;
  for (const inv of invocacoesDaMesa(derived)) {
    if (!inv?.duracao) continue;
    const atual = linhaDaInvocacao(out, inv.id);
    if (atual.estado !== "ativa") continue;
    if (atual.manutencaoPendente) {
      out = comInvocacao(out, inv.id, corpoSemManutencao);
      continue;
    }
    const rodadasAtiva = atual.rodadasAtiva + 1;
    out = comInvocacao(out, inv.id, {
      rodadasAtiva, manutencaoPendente: rodadasAtiva >= Math.max(0, inteiro(inv.duracao.rodadas, 0)),
    });
  }
  return out;
}

/**
 * O combate começou com invocações em campo (2026-09-30, Etapa 8). "Uma Invocação
 * que comece o combate já ativada ou invocada é considerada como se tivesse
 * acabado de ser invocada ou ativada para Habilidades de Especialização como
 * 'Autonomia'" (Mecânicas). Então:
 *   - a Autonomia marcada e ainda não paga é cobrada agora (é a hora da
 *     Maldição: "devem ser pagos no início do combate"), se o PE cobrir;
 *   - a contagem de rodadas do Corpo começa do zero.
 */
function iniciaInvocacoesNoCombate(sessao, derived) {
  /* A CENA NOVA (2026-10-01, Etapa 9): a Quimera da cena e os líderes de Horda
     dissipada zeram, as componentes bloqueadas "durante a mesma cena" voltam, e a
     Quimera ou a Horda que acabaram na cena anterior podem ser formadas de novo. */
  const linhas = {};
  for (const [id, e] of Object.entries(sessao?.invocacoes || {})) {
    linhas[id] = ehCompostoQueSeDesfaz(id) && ESTADOS_TERMINAIS.has(estadoDaLinha(e))
      ? comBooleanos({ ...e, ...COMPOSTO_DESFEITO, bloqueadaAteFimDaCena: false })
      : (e?.bloqueadaAteFimDaCena ? { ...e, bloqueadaAteFimDaCena: false } : e);
  }
  let out = { ...sessao, invocacoes: linhas, quimeraDaCena: null, lideresDeHordaDissolvida: [] };
  for (const inv of invocacoesDaMesa(derived)) {
    const atual = linhaDaInvocacao(out, inv.id);
    if (atual.estado !== "ativa") continue;
    // Com CL 0, o Corpo já pede a manutenção na primeira rodada.
    const parcial = {
      rodadasAtiva: 0,
      manutencaoPendente: !!inv.duracao && inteiro(inv.duracao.rodadas, 0) <= 0,
    };
    const auto = (inv.opcoesDeUso ?? []).find((o) => o.id === "autonomia" && Number.isFinite(o.custo));
    const disponivel = Math.max(0, inteiro(out?.peAtual, 0)) + peTempTotal(out);
    if (auto && atual.opcoesDeEntrada?.autonomia && !atual.autonomia && auto.custo <= disponivel) {
      out = gastaPe(out, auto.custo);
      const opcoesDeEntrada = { ...atual.opcoesDeEntrada };
      delete opcoesDeEntrada.autonomia;
      Object.assign(parcial, {
        autonomia: true, opcoesDeEntrada,
        ultimaEntrada: { via: "inicioCombate", rodada: inteiro(out.rodada, 0), custo: auto.custo },
      });
    }
    out = comInvocacao(out, inv.id, parcial);
  }
  return out;
}

/** Marionete quebrada recolhida (Ação Bônus): deixa de ocupar vaga em campo. */
export function recolheInvocacao(sessao, invId) {
  const atual = estadoDaInvocacao(sessao, invId);
  if (atual.estado !== "quebrada") return sessao;
  return comInvocacao(sessao, invId, { estado: "recolhida" });
}

/** Marionete reconstruída (Ação Comum e teste de Ofício, rolados na mesa): volta
    a poder ser ativada, com a fração da queda (½ na 1ª, ¼ na 2ª). */
export function reconstroiInvocacao(sessao, invId, pvMax) {
  const atual = estadoDaInvocacao(sessao, invId);
  if (atual.estado !== "quebrada" && atual.estado !== "recolhida") return sessao;
  const max = Math.max(0, inteiro(pvMax, 0));
  return comInvocacao(sessao, invId, {
    estado: "fora", pvAtual: Math.floor(max * (atual.retorno ?? 0.5)), retorno: null,
  });
}

/**
 * COMPATIBILIDADE: o verbo de antes, que liga e desliga sem cobrar PE. A mesa usa
 * `invocaNaMesa` e `saiDeCampo`. Fica para quem ainda chama o antigo.
 */
export function poeInvocacaoEmCampo(sessao, invId, emCampo, pvMax = 0) {
  if (!emCampo) return saiDeCampo(sessao, invId);
  const atual = estadoDaInvocacao(sessao, invId);
  if (ESTADOS_TERMINAIS.has(atual.estado) || atual.estado === "ativa") return sessao;
  return comInvocacao(sessao, invId, { estado: "ativa", pvAtual: pvInicialDe(atual, pvMax) });
}

/** Liga ou desliga UM auxílio daquela invocação. */
export function alternaAuxilioInvocacao(sessao, invId, acaoId, ligado) {
  if (!acaoId) return sessao;
  const atual = estadoDaInvocacao(sessao, invId);
  const auxilios = { ...atual.auxilios };
  if (ligado) auxilios[acaoId] = true;
  else delete auxilios[acaoId];
  /* Ligar um auxílio de quem está fora de campo TRAZ a invocação ao campo, sem
     cobrar (é o atalho de mesa de antes). Só vale para quem pode voltar: morta,
     quebrada ou desativada não liga nada. */
  const podeVoltar = !ESTADOS_TERMINAIS.has(atual.estado)
    && !["quebrada", "recolhida", "desativada"].includes(atual.estado);
  if (ligado && atual.estado !== "ativa" && !podeVoltar) return sessao;
  return comInvocacao(sessao, invId, ligado && atual.estado !== "ativa"
    ? { auxilios, estado: "ativa" }
    : { auxilios });
}

/** Liga ou desliga o dono numa Aura desta invocação (2026-09-30). O app não tem
    posição: é a mesa que diz que o dono está a 4,5 m. Ver `aurasLigadasDa`. */
export function alternaAuraInvocacao(sessao, invId, caracId, ligado) {
  if (!caracId) return sessao;
  const atual = linhaDaInvocacao(sessao, invId);
  const auras = { ...atual.auras };
  if (ligado) auras[caracId] = true;
  else delete auras[caracId];
  return comInvocacao(sessao, invId, { auras });
}

/** A Bem Treinada em tarefa (ou não). */
export function defineEmTarefa(sessao, invId, emTarefa) {
  return comInvocacao(sessao, invId, { emTarefa: !!emTarefa });
}

/**
 * Liga ou desliga a Forma de Arma ou de Armadura (Ação Simples). ⚠ A invocação
 * NÃO SAI DE CAMPO: "Enquanto em Forma de Arma, ela ainda conta como uma Invocação
 * em Campo e pode ser alvo de ataques" (Adicionais). Só quem está em campo muda
 * de forma.
 */
export function defineFormaInvocacao(sessao, invId, forma) {
  const atual = linhaDaInvocacao(sessao, invId);
  if (atual.estado !== "ativa") return sessao;
  return comInvocacao(sessao, invId, { forma: forma === "arma" || forma === "armadura" ? forma : null });
}

/**
 * O dano que o dono recebe vestindo a Forma de Armadura (2026-09-30): "caso você
 * receba o dano de um ataque sua armadura recebe a metade do dano. Caso receba um
 * ataque crítico, ambos recebem o dano completo". Pura: devolve quanto vai para
 * cada um, e quem aplica é a mesa.
 */
export function divideDanoComArmadura(dano, critico = false) {
  const total = Math.max(0, inteiro(dano, 0));
  if (critico) return { dono: total, armadura: total };
  const armadura = Math.floor(total / 2);
  return { dono: total - armadura, armadura };
}

/**
 * Dano numa invocação. A casca dela come primeiro, igual à do dono, e o que
 * chega a zero segue a regra do TIPO (`transicaoDeQueda`).
 *
 * ⚠ A LISTA NÃO É MEXIDA AQUI (decisão do autor, 2026-09-30): morte permanente é
 * estado, e remover a ficha é ação manual no criador.
 */
export function aplicaDanoInvocacao(sessao, invId, bruto, pvMax, regras = null) {
  const dano = Math.max(0, inteiro(bruto, 0));
  if (!dano) return sessao;
  const max = Math.max(0, inteiro(pvMax, 0));
  const atual = estadoDaInvocacao(sessao, invId);
  if (ESTADOS_TERMINAIS.has(atual.estado)) return sessao;
  const pv = atual.pvAtual ?? max;
  const { fontes, sobrou } = drenaPvTemp(atual.pvTempFontes, dano);
  const restante = pv - sobrou;
  if (restante > 0) return comInvocacao(sessao, invId, { pvTempFontes: fontes, pvAtual: restante });
  const queda = transicaoDeQueda(regras, atual, restante, max, pv <= 0);
  return comInvocacao(sessao, invId, { pvTempFontes: fontes, ...queda });
}

/**
 * A cura que o tipo aceita, pela fonte: "comum" ou "er" (Energia Reversa). A
 * Marionete não se cura de forma nenhuma ("Marionetes não podem ser curadas de
 * nenhuma forma"), e a Maldição não se cura por ER (Mecânicas). Pura, para a tela
 * desenhar o botão travado com o mesmo critério do escritor.
 */
export function curaPermitida(regras, fonte = "comum") {
  const cura = regrasOuPadrao(regras).cura ?? { comum: true, er: true };
  return fonte === "er" ? !!cura.er : !!cura.comum;
}

/** Cura numa invocação. Nunca passa do máximo. O Corpo desativado curado acima
    de 0 volta a funcionar (Mecânicas: "só podendo ser reativado ao ser curado
    acima de 0"). Morte permanente não se cura, e a fonte que o tipo recusa
    (`curaPermitida`) não cura nada. */
export function aplicaCuraInvocacao(sessao, invId, bruto, pvMax, regras = null, fonte = "comum") {
  const cura = Math.max(0, inteiro(bruto, 0));
  if (!cura) return sessao;
  if (!curaPermitida(regras, fonte)) return sessao;
  const max = Math.max(0, inteiro(pvMax, 0));
  const atual = estadoDaInvocacao(sessao, invId);
  if (ESTADOS_TERMINAIS.has(atual.estado)) return sessao;
  const pvAtual = entre((atual.pvAtual ?? max) + cura, -max, max);
  const reativa = atual.estado === "desativada" && pvAtual > 0 && regrasOuPadrao(regras).aZero === "desativada";
  return comInvocacao(sessao, invId, reativa ? { pvAtual, estado: "ativa" } : { pvAtual });
}

/**
 * Escreve o PV ou a Integridade da invocação direto, pelo campo da barra.
 *
 * ⚠ ESCREVER ZERO NO PV FAZ ELA CAIR IGUAL, pela regra do tipo: o campo da barra e
 * os botões de passo são duas portas para o mesmo fato. O que NÃO acontece por
 * aqui é o excedente: um valor absoluto não tem excedente nenhum.
 */
export function defineVitalInvocacao(sessao, invId, qual, valor, max, regras = null) {
  const teto = Math.max(0, inteiro(max, 0));
  const atual = estadoDaInvocacao(sessao, invId);
  if (qual === "alma") {
    // A Marionete é imune a dano na alma, e não tem Integridade para escrever.
    if (regrasOuPadrao(regras).alma === "nenhuma") return sessao;
    return comInvocacao(sessao, invId, { almaAtual: entre(inteiro(valor, 0), 0, teto) });
  }
  if (ESTADOS_TERMINAIS.has(atual.estado)) return sessao;
  const r = regrasOuPadrao(regras);
  const piso = r.aZero === "desativada" ? -teto : 0;
  const pv = entre(inteiro(valor, 0), piso, teto);
  if (pv > 0) {
    const reativa = atual.estado === "desativada";
    return comInvocacao(sessao, invId, reativa ? { pvAtual: pv, estado: "ativa" } : { pvAtual: pv });
  }
  const jaCaida = (atual.pvAtual ?? teto) <= 0;
  return comInvocacao(sessao, invId, transicaoDeQueda(r, atual, pv, teto, jaCaida) ?? { pvAtual: pv });
}

/**
 * O descanso enche as invocações junto do dono.
 *
 * ⚠ O BOTÃO DE DESCANSO É UM SÓ E DEVOLVE TUDO (decisão D3 do autor, 2026-09-23),
 * então ele vale como descanso longo: a volta pela metade some, os exorcismos da
 * Técnica zeram, e quem caiu (dissipada, quebrada, recolhida, desativada) volta
 * a poder entrar, cheia. A Marionete também enche e zera as quedas, como fazia
 * antes desta etapa: o reparo de UMA Marionete por descanso longo do Mecânicas
 * espera decisão (ver docs/a-fazer.md).
 *
 * Quem estava em campo CONTINUA em campo. Morte permanente não volta.
 */
function descansaInvocacoes(invocacoes) {
  const out = {};
  for (const [id, e] of Object.entries(invocacoes || {})) {
    /* A Horda, a Quimera e o Mecha se DESFAZEM no descanso (2026-10-01, Etapa
       9): a cena acabou, e quem estava dentro volta a ser uma invocação comum. */
    if (ehCompostoQueSeDesfaz(id)) {
      out[id] = comBooleanos({ ...e, ...COMPOSTO_DESFEITO, almaAtual: null, bloqueadaAteFimDaCena: false, opcoesDeEntrada: {}, entradasDesdeDescanso: 0 });
      continue;
    }
    const estado = ESTADO_VALIDO.has(e?.estado) ? e.estado : estadoLegado(e);
    const terminal = ESTADOS_TERMINAIS.has(estado);
    out[id] = comBooleanos({
      ...e,
      estado: terminal || estado === "ativa" ? estado : "fora",
      pvAtual: null, almaAtual: null, pvTempFontes: {}, auxilios: {},
      retorno: null, quedas: 0, exorcismos: 0, bloqueadaAteFimDaCena: false,
      auras: {}, forma: null, emTarefa: false,
      opcoesDeEntrada: {}, entradasDesdeDescanso: 0,
      rodadasAtiva: 0, manutencaoPendente: false,
    });
  }
  return out;
}

/* ============================================================ */
/* O TITÃ NA MESA                                                 */
/* ============================================================ */
/**
 * `null` numa parte quer dizer CHEIA (mesma convenção do PV de Invocação, ver
 * `normalizaInvocacoesSessao`). `membros` é aparado para o tamanho de HOJE
 * (`titaMembros`, de `derived.titaColosso.membros`): mudar a contagem no
 * criador não deixa lixo de um membro que já não existe, e um membro NOVO
 * nasce cheio.
 */
function normalizaTitaSessao(bruto, titaMembros) {
  const cabeca = bruto?.cabeca == null ? null : Math.max(0, inteiro(bruto.cabeca, 0));
  const brutos = Array.isArray(bruto?.membros) ? bruto.membros : [];
  const n = Math.max(0, Math.trunc(Number(titaMembros) || 0));
  const membros = Array.from({ length: n }, (_, i) => (
    brutos[i] == null ? null : Math.max(0, inteiro(brutos[i], 0))
  ));
  return { cabeca, membros };
}

/** O estado do Titã, com o padrão de quem nunca foi tocado. */
export function estadoTita(sessao) {
  const t = sessao?.tita;
  return { cabeca: t?.cabeca ?? null, membros: Array.isArray(t?.membros) ? t.membros : [] };
}

function comTita(sessao, partial) {
  return { ...sessao, tita: { ...estadoTita(sessao), ...partial } };
}

/** Dano na CABEÇA. Chegar a 0 é a morte do Titã (regra de mesa, ver a nota do
    painel na Ficha). */
export function aplicaDanoTitaCabeca(sessao, bruto, max) {
  const dano = Math.max(0, inteiro(bruto, 0));
  if (!dano) return sessao;
  const teto = Math.max(0, inteiro(max, 0));
  const atual = estadoTita(sessao).cabeca ?? teto;
  return comTita(sessao, { cabeca: entre(atual - dano, 0, teto) });
}

/** Cura na CABEÇA. Nunca passa do máximo. */
export function aplicaCuraTitaCabeca(sessao, bruto, max) {
  const cura = Math.max(0, inteiro(bruto, 0));
  if (!cura) return sessao;
  const teto = Math.max(0, inteiro(max, 0));
  const atual = estadoTita(sessao).cabeca ?? teto;
  return comTita(sessao, { cabeca: entre(atual + cura, 0, teto) });
}

/** Escreve a vida da CABEÇA direto, pelo campo da barra. */
export function defineVitalTitaCabeca(sessao, valor, max) {
  const teto = Math.max(0, inteiro(max, 0));
  return comTita(sessao, { cabeca: entre(inteiro(valor, 0), 0, teto) });
}

const comMembros = (sessao, i, valor) => {
  const membros = [...estadoTita(sessao).membros];
  membros[i] = valor;
  return comTita(sessao, { membros });
};

/** Dano num MEMBRO. Chegar a 0 desabilita a parte (penalidade de membro
    perdido, de mesa: a barra fica marcada, e a regra fica no painel). */
export function aplicaDanoTitaMembro(sessao, i, bruto, max) {
  const dano = Math.max(0, inteiro(bruto, 0));
  if (!dano || i == null) return sessao;
  const teto = Math.max(0, inteiro(max, 0));
  const atual = estadoTita(sessao).membros[i] ?? teto;
  return comMembros(sessao, i, entre(atual - dano, 0, teto));
}

/**
 * Cura num MEMBRO. "Só pode ser curada caso o inimigo possa regenerar membros
 * com seu custo duplicado": o botão não sabe se a criatura regenera, então a
 * regra é lembrete no painel, e não trava aqui (mesma divisão do resto do
 * sistema: o Motor calcula, a mesa decide a condição narrativa).
 */
export function aplicaCuraTitaMembro(sessao, i, bruto, max) {
  const cura = Math.max(0, inteiro(bruto, 0));
  if (!cura || i == null) return sessao;
  const teto = Math.max(0, inteiro(max, 0));
  const atual = estadoTita(sessao).membros[i] ?? teto;
  return comMembros(sessao, i, entre(atual + cura, 0, teto));
}

/** Escreve a vida de UM MEMBRO direto, pelo campo da barra. */
export function defineVitalTitaMembro(sessao, i, valor, max) {
  if (i == null) return sessao;
  const teto = Math.max(0, inteiro(max, 0));
  return comMembros(sessao, i, entre(inteiro(valor, 0), 0, teto));
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
  /* ⚠ O MÁXIMO QUE SOBE LEVA A CORRENTE JUNTO, pela frase do livro citada no
     `almaMaxVisto` do `sessaoEmBranco`. A subida é SOMADA, e não usada para
     encher: alma ferida continua ferida do mesmo tanto (autor, 2026-09-18). Uma
     Alma em 400 de 500 que ganha +25 vira 425 de 525, e não 525 de 525.

     ⚠ SÓ NO JOGADOR. A Alma da criatura é outra regra e ainda não foi revisada
     pelo autor, então ela segue exatamente como estava. O campo é gravado nos
     dois sistemas, para o dia dessa decisão chegar com o número certo em mão. */
  const visto = Math.max(0, inteiro(sessao.almaMaxVisto, almaMax));
  const ganho = derived?.sistema === "player" ? Math.max(0, almaMax - visto) : 0;
  const hpAtual = entre(sessao.hpAtual, 0, hpMax);
  const peAtual = entre(sessao.peAtual, 0, peMax);
  const almaAtual = entre(sessao.almaAtual + ganho, 0, almaMax);
  /* As invocações apararam pelo mesmo caminho. Sem isto, tirar uma Característica
     de Vida do shikigami deixava o PV corrente ACIMA do máximo e a barra passava
     de 100%. É o mesmo motivo de o dono ser aparado aqui. A Quimera entra junto,
     porque o PV dela desce quando uma das fundidas perde vida no criador. */
  const invocacoes = aparaInvocacoes(sessao.invocacoes, invocacoesDaMesa(derived));
  const tita = apararTita(sessao.tita, derived?.titaColosso);
  // O Preparo cai junto do máximo, e `null` continua cheio: ele acompanha o
  // máximo sozinho.
  const preparoAtual = sessao.preparoAtual == null
    ? null
    : entre(inteiro(sessao.preparoAtual, 0), 0, Math.max(0, derived?.pontosPreparo ?? 0));
  /* A casca da Postura do Céu some quando a fonte some ("sai da postura"), e
     nunca passa do valor da fonte, que é o teto dela (topa, não acumula). */
  const preparoTemp = entre(inteiro(sessao.preparoTemp, 0), 0, Math.max(0, derived?.preparoTemporario ?? 0));
  if (hpAtual === sessao.hpAtual && peAtual === sessao.peAtual && almaAtual === sessao.almaAtual
    && visto === almaMax && invocacoes === sessao.invocacoes && tita === sessao.tita
    && preparoAtual === (sessao.preparoAtual ?? null) && preparoTemp === inteiro(sessao.preparoTemp, 0)) {
    return sessao;
  }
  return {
    ...sessao, hpAtual, peAtual, almaAtual, almaMaxVisto: almaMax, invocacoes, tita, preparoAtual, preparoTemp,
  };
}

/* ============================================================ */
/* PONTOS DE PREPARO (Combatente, Artes do Combate)              */
/* ============================================================ */
/**
 * O Preparo corrente, com `null` lido como cheio.
 *
 * Livro: *"Você recebe uma quantidade de Pontos de Preparo igual ao seu nível de
 * Especialista em Combate + Modificador de Sabedoria"*. O máximo vem do Motor
 * (`derived.pontosPreparo`), e a sessão só guarda o corrente.
 */
export function preparoDe(sessao, max) {
  const teto = Math.max(0, inteiro(max, 0));
  return sessao?.preparoAtual == null ? teto : entre(inteiro(sessao.preparoAtual, 0), 0, teto);
}

/**
 * Gasta (delta negativo) ou recupera (positivo) Pontos de Preparo. Nunca passa
 * do máximo nem desce de zero: *"os quais são usados para realizar artes de
 * combate"*, e não se gasta o que não se tem.
 *
 * As recuperações do livro são todas por clique, porque nascem de um fato de
 * mesa: *"Sempre que eliminar um inimigo, você recupera um Ponto de Preparo;
 * você pode usar sua ação comum para analisar o campo de batalha, recuperando
 * dois Pontos de Preparo."* O descanso enche (ver `descansar`).
 */
export function alteraPreparo(sessao, delta, max) {
  const teto = Math.max(0, inteiro(max, 0));
  const d = inteiro(delta, 0);
  /* O GASTO COME A CASCA PRIMEIRO, a regra de toda casca temporária do sistema
     (PV e PE temporários): ela existe para ser gasta antes. A recuperação vai
     só para o Preparo, porque a casca não se recupera por clique. */
  if (d < 0) {
    const casca = Math.max(0, inteiro(sessao?.preparoTemp, 0));
    const daCasca = Math.min(casca, -d);
    const resto = -d - daCasca;
    return {
      ...sessao,
      preparoTemp: casca - daCasca,
      preparoAtual: entre(preparoDe(sessao, teto) - resto, 0, teto),
    };
  }
  return { ...sessao, preparoAtual: entre(preparoDe(sessao, teto) + d, 0, teto) };
}

/** A casca de Preparo temporário corrente (Postura do Céu). */
export const preparoTempDe = (sessao) => Math.max(0, inteiro(sessao?.preparoTemp, 0));

/**
 * Topa a casca no valor da fonte: *"você recebe 2 pontos de preparo temporários
 * no começo de todo turno"*. TOPA e não acumula (autor, 2026-09-23), a mesma
 * regra do PE temporário de mesma fonte. Sem fonte, a casca vai a zero.
 */
function topaPreparoTemp(sessao, derived) {
  if (!derived) return sessao;
  return { ...sessao, preparoTemp: Math.max(0, inteiro(derived.preparoTemporario, 0)) };
}

/** Escreve o Preparo direto, pelo campo da barra. */
export function definePreparo(sessao, valor, max) {
  const teto = Math.max(0, inteiro(max, 0));
  return { ...sessao, preparoAtual: entre(inteiro(valor, 0), 0, teto) };
}

/** Apara a Cabeça e cada Membro do Titã contra o máximo resolvido de hoje, e
    encolhe/estica o array de membros se a contagem mudou no criador. */
function apararTita(t, titaColosso) {
  if (!titaColosso?.ativo) return t;
  const cabecaMax = Math.max(0, titaColosso.cabecaMax ?? 0);
  const membroMax = Math.max(0, titaColosso.membroMax ?? 0);
  const n = Math.max(0, Math.trunc(Number(titaColosso.membros) || 0));
  const cabeca = t?.cabeca == null ? null : entre(t.cabeca, 0, cabecaMax);
  const membrosAntigos = Array.isArray(t?.membros) ? t.membros : [];
  const membros = Array.from({ length: n }, (_, i) => (
    (membrosAntigos[i] ?? null) == null ? null : entre(membrosAntigos[i], 0, membroMax)
  ));
  const mudouMembros = membros.length !== membrosAntigos.length
    || membros.some((v, i) => v !== membrosAntigos[i]);
  if (cabeca === (t?.cabeca ?? null) && !mudouMembros) return t;
  return { cabeca, membros };
}

/** Apara PV e Integridade de cada invocação contra o máximo resolvido dela. */
function aparaInvocacoes(mapa, lista) {
  if (!mapa || !Array.isArray(lista) || !lista.length) return mapa;
  let mudou = false;
  const out = {};
  for (const [id, e] of Object.entries(mapa)) {
    const r = lista.find((x) => x.id === id);
    // Invocação que sumiu da ficha fica intacta: ver `normalizaInvocacoesSessao`.
    if (!r) { out[id] = e; continue; }
    /* O Corpo desativado desce até −PV máximo (Mecânicas). Os outros tipos param
       em zero, como sempre. */
    const max = Math.max(0, r.pv ?? 0);
    const piso = r.regras?.aZero === "desativada" ? -max : 0;
    const pv = e.pvAtual == null ? null : entre(e.pvAtual, piso, max);
    const alma = e.almaAtual == null ? null : entre(e.almaAtual, 0, Math.max(0, r.almaMax ?? 0));
    if (pv !== e.pvAtual || alma !== e.almaAtual) mudou = true;
    out[id] = { ...e, pvAtual: pv, almaAtual: alma };
  }
  return mudou ? out : mapa;
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

/**
 * Perda de vida: a do Sangramento, no início do turno (2026-09-21).
 *
 * ⚠ NÃO É DANO, e por isso não passa pelo `aplicaDano`: a casca de PV
 * Temporário não protege e a Guarda Inabalável não se quebra. É a leitura de
 * "perda de vida" dos sistemas de onde o Afty veio, e está em docs/a-fazer.md
 * para o autor confirmar.
 */
export function aplicaPerdaDeVida(sessao, bruto) {
  const perda = Math.max(0, inteiro(bruto, 0));
  if (!perda) return sessao;
  return { ...sessao, hpAtual: Math.max(0, sessao.hpAtual - perda) };
}

/** Aplica cura. Nunca passa do máximo, e nunca ressuscita PV temporário. */
export function aplicaCura(sessao, bruto, hpMax) {
  const cura = Math.max(0, inteiro(bruto, 0));
  if (!cura) return sessao;
  return { ...sessao, hpAtual: entre(sessao.hpAtual + cura, 0, Math.max(0, hpMax)) };
}

/* ============================================================ */
/* A ALMA COMO RECURSO (2026-09-18)                              */
/* ============================================================ */
/* ⚠ OS TRÊS VERBOS MORAM AQUI, e não nas telas, porque a barra de Alma existe em
   DUAS: a da Ficha Final e a do Painel de Combatente do Encontro. Cada uma
   escrevia `almaAtual` na mão, e é por isso que o Dano na Alma nunca encostou no
   PV: a regra não tinha um dono, tinha duas cópias.

   ⚠ E ELES PRECISAM DO `derived`, não do máximo solto, porque a regra DIVERGE
   entre os sistemas e a barra é a mesma para os dois:

     jogador   a Alma é uma pilha do tamanho do PV, e o dano desce nas duas
     criatura  a Alma é PORCENTAGEM, e o PV máximo já cai sozinho pelo `almaMult`

   Descontar o PV corrente na criatura cobraria a mesma perda duas vezes, uma no
   multiplicador e outra aqui. */

/**
 * Dano na Alma: no jogador, encolhe a Alma e a Vida juntas.
 *
 * Verbatim do autor (2026-09-18): *"Dano na Alma também é Dano na Vida"*, com o
 * exemplo *"estou com 250 de 500 de HP Máximo. Tomo 100 de Dano na Alma, eu fico
 * com 150 de 400 de HP máximo."* O TETO quem baixa é o `deriveAfty`, que faz o PV
 * máximo do jogador seguir a Alma corrente. O que sobra para a sessão é o PV
 * CORRENTE: sem esta linha o exemplo daria 250 de 400, e não 150.
 *
 * ⚠ O PV TEMPORÁRIO NÃO PROTEGE (autor, 2026-09-18), e é a diferença para o
 * `aplicaDano`. A casca é vida emprestada por fora e a alma encolhe por dentro,
 * então o `pvTempFontes` sai intacto e a Guarda não se quebra com Dano na Alma.
 */
export function aplicaDanoNaAlma(sessao, bruto, derived) {
  const dano = Math.max(0, inteiro(bruto, 0));
  if (!dano) return sessao;
  const almaAtual = Math.max(0, sessao.almaAtual - dano);
  if (derived?.sistema !== "player") return { ...sessao, almaAtual };
  return { ...sessao, almaAtual, hpAtual: Math.max(0, sessao.hpAtual - dano) };
}

/**
 * Cura na Alma: devolve o TETO, e não a Vida corrente (autor, 2026-09-18).
 *
 * Quem está em 150 de 400 e recupera 100 de Alma fica em 150 de 500: o máximo
 * volta e o PV que faltava se cura pelos meios normais. É por isso que ela não é
 * o `aplicaDanoNaAlma` com o sinal trocado, e por isso que ela não precisa saber
 * o sistema: subir a Alma nunca mexeu no PV corrente de ninguém.
 */
export function curaAlma(sessao, bruto, derived) {
  const cura = Math.max(0, inteiro(bruto, 0));
  if (!cura) return sessao;
  const almaMax = Math.max(0, derived?.almaMax ?? 100);
  return { ...sessao, almaAtual: entre(sessao.almaAtual + cura, 0, almaMax) };
}

/**
 * Escreve um valor ABSOLUTO na Alma, roteando pelo verbo certo.
 *
 * ⚠ Existe porque a barra tem DOIS caminhos, o botão de passo e o campo de
 * digitar, e eles têm de concordar: escrever 400 numa Alma de 500 é o mesmo que
 * clicar em -100. Sem isto o campo mexeria só na Alma enquanto o botão mexe nas
 * duas, e o jogador teria como fugir do dano digitando.
 */
export function defineAlma(sessao, valor, derived) {
  const almaMax = Math.max(0, derived?.almaMax ?? 100);
  const alvo = entre(inteiro(valor, 0), 0, almaMax);
  const delta = alvo - sessao.almaAtual;
  if (!delta) return sessao;
  return delta < 0
    ? aplicaDanoNaAlma(sessao, -delta, derived)
    : curaAlma(sessao, delta, derived);
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

/* O GOLPE ESPECIAL na sessão (2026-09-24). O Preciso guarda a RODADA em que foi
   pago, igual ao `chaveUsoEstado`, e a virada de rodada o libera sozinha. A
   troca do Autossuficiente por 6 guarda só que foi usada, e quem a devolve é a
   cena nova (a saída da rodada 0 e o `iniciaCombate`) e o descanso. Os verbos
   estão depois do `marcaUso`. */
const CHAVE_GOLPE_PRECISO = "golpe:preciso:rodada";
const CHAVE_GOLPE_SEIS = "golpe:autossuficiente6";

/** Os usos gastos sem as chaves que o teste manda devolver, ou a mesma sessão. */
function devolveUsos(sessao, devolve) {
  const chaves = Object.keys(sessao?.usos ?? {}).filter(devolve);
  if (!chaves.length) return sessao;
  const usos = { ...sessao.usos };
  for (const k of chaves) delete usos[k];
  return { ...sessao, usos };
}

/**
 * A cena nova devolve a troca por 6 do Autossuficiente ("Uma vez por cena") e,
 * desde 2026-09-28, todo contador de mesa com recarga `cena`, que o derive
 * grava com o prefixo `cena:` na chave (ver `mesa` em afty-derive.js). O nome
 * ficou por ser o de quem nasceu primeiro.
 */
function cenaNovaDoGolpe(sessao) {
  return devolveUsos(sessao, (k) => k === CHAVE_GOLPE_SEIS || k.startsWith("cena:"));
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
  /* Os contadores "uma vez por rodada" voltam na virada (prefixo `rodada:` na
     chave, 2026-09-28). Ver `mesa` em afty-derive.js. */
  const base = {
    ...devolveUsos(sessao, (k) => k.startsWith("rodada:")),
    rodada: sessao.rodada + 1,
    combate: expirarEstadosDaRodada(sessao.combate, derived),
    buffs: sessao.buffs.map(desce).filter(Boolean),
    condicoes: sessao.condicoes.map(desce).filter(Boolean),
  };
  /* ⚠ SAIR DA RODADA 0 É COMEÇAR A CENA, e por isso a casca de `combate` entra
     junto aqui. A Ficha não tem botão de "iniciar combate": o que ela tem é o
     contador de rodada, que o Descansar zera. Sem esta linha, os 4 PE do Treino
     de Controle de Energia 2ª ("quando uma cena de combate iniciar") nunca
     chegariam a quem joga pela Ficha, só a quem joga pela aba de Encontros. */
  const comCena = sessao.rodada === 0
    ? aplicaPeTemporario(cenaNovaDoGolpe(base), derived?.peTemporario?.combate ?? [])
    : base;
  /* ⚠ A GUARDA VOLTA CHEIA AQUI, as duas metades (autor, 2026-08-26). E a
     renovação vem DEPOIS do `desce` das condições: a condição que expirou nesta
     virada já saiu da lista, então a Guarda dela volta agora, e não só na
     rodada seguinte. */
  const comGuarda = renovaGuarda(
    aplicaPeTemporario(comCena, derived?.peTemporario?.rodada ?? []),
    derived,
  );
  const comAdaptacao = avancarAdaptacoesNaRodada(comGuarda, derived, comGuarda.rodada);
  const comArmas = avancaArmasTransformaveis(comAdaptacao, sessao.rodada === 0);
  // A casca de Preparo da Postura do Céu topa no começo de cada rodada.
  const comPreparo = topaPreparoTemp(comArmas, derived);
  /* As invocações (2026-09-30, Etapa 8): sair da rodada 0 é o combate começar
     (a Autonomia de quem já estava em campo, a contagem do Corpo do zero), e as
     outras viradas contam a duração do Corpo. */
  const comInvocacoes = sessao.rodada === 0
    ? iniciaInvocacoesNoCombate(comPreparo, derived)
    : avancaInvocacoesNaRodada(comPreparo, derived);
  return { sessao: avancaTalismaApice(avancaInvencivelSobOSol(comInvocacoes, derived)), expirou };
}

/* O Talismã do Ápice desligado, com o contador zerado. */
const semApice = (combate) => ({ ...combate, [ESTADO_APICE]: null, talismaApiceRodadas: 0 });

/**
 * Fecha a rodada do Talismã do Ápice: "10 rodadas dentro de um combate", e o
 * autor decidiu em 2026-09-14 que ele desliga sozinho. Mesma contagem do
 * Invencível sob o Sol: ligar é a rodada 1, e a virada da décima desliga.
 */
function avancaTalismaApice(sessao) {
  const combate = sessao.combate ?? {};
  if (!combate[ESTADO_APICE]) return sessao;
  const rodadas = Math.max(1, inteiro(combate.talismaApiceRodadas, 1));
  if (!combate.ativo || rodadas >= RODADAS_APICE) return { ...sessao, combate: semApice(combate) };
  return { ...sessao, combate: { ...combate, talismaApiceRodadas: rodadas + 1 } };
}

/** Fecha a rodada do Ápice, entrega a Exaustão e paga a próxima se continuar. */
function avancaInvencivelSobOSol(sessao, derived) {
  const combate = sessao.combate ?? {};
  const exaustao = Math.max(0, inteiro(sessao.exaustao, 0))
    + (combate.invencivelPendenteExaustao ? 1 : 0);
  const encerrar = () => ({
    ...sessao, exaustao,
    combate: { ...combate, invencivelSobOSol: false,
      invencivelRodadas: 0, invencivelPendenteExaustao: false },
  });
  if (!combate.ativo || !combate.invencivelSobOSol
    || inteiro(combate.invencivelRodadas, 0) >= 4
    || Math.max(0, inteiro(sessao.peAtual, 0)) + peTempTotal(sessao) < 4) {
    return combate.invencivelPendenteExaustao || combate.invencivelSobOSol
      ? encerrar() : sessao;
  }
  const pago = gastaPe(sessao, 4);
  const pvTerra = Math.max(0, inteiro(derived?.nd, 0));
  const fonteTerra = "Invencível sob o Sol · Postura da Terra";
  return {
    ...pago, exaustao,
    pvTempFontes: pvTerra > 0
      ? { ...(pago.pvTempFontes ?? {}),
        [fonteTerra]: Math.max(pago.pvTempFontes?.[fonteTerra] ?? 0, pvTerra) }
      : pago.pvTempFontes,
    combate: { ...combate, invencivelSobOSol: true,
      invencivelRodadas: Math.max(1, inteiro(combate.invencivelRodadas, 1)) + 1,
      invencivelPendenteExaustao: true },
  };
}

/**
 * A cena de combate COMEÇOU: entrega as duas cascas de uma vez. A de `combate`
 * vale a cena inteira e a de `rodada` já vale a primeira rodada, senão o Completo
 * do Treino de Controle de Energia só valeria a partir da segunda.
 */
export function iniciaCombate(sessao, derived = null) {
  sessao = cenaNovaDoGolpe(
    avancaArmasTransformaveis(aplicaPatchCombate(sessao, { ativo: true }), true),
  );
  if (!derived) return sessao;
  const comCena = aplicaPeTemporario(sessao, derived.peTemporario?.combate ?? []);
  // A Guarda entra junto: a primeira rodada já é rodada, e sem isto o mestre
  // abriria o combate com o chefe sem casca nenhuma até virar a rodada 2. A casca
  // de Preparo da Postura do Céu também, pelo mesmo motivo.
  return iniciaInvocacoesNoCombate(topaPreparoTemp(
    renovaGuarda(aplicaPeTemporario(comCena, derived.peTemporario?.rodada ?? []), derived),
    derived,
  ), derived);
}

/**
 * Descanso. Zera os usos gastos e os buffs com duração, e devolve os recursos.
 *
 * ⚠ O BOTÃO É UM SÓ E DEVOLVE TUDO, por decisão do autor (a D3, respondida em
 * 2026-09-23 como "Manter um botão só"). Os contadores de usos das habilidades
 * guardam a recarga do livro (curto, longo) só como dado, para o dia em que os
 * dois descansos se separarem.
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
    exaustao: Math.max(0, inteiro(sessao.exaustao, 0))
      + (sessao.combate?.invencivelPendenteExaustao ? 1 : 0),
    combate: expirarEstadosDaRodada(semApice({
      ...(sessao.combate ?? {}), invencivelSobOSol: false,
      invencivelRodadas: 0, invencivelPendenteExaustao: false,
    }), derived, { descanso: true }),
    rodada: 0,
    // A Guarda volta a zero com a rodada: fora de combate não há guarda erguida,
    // e o próximo `iniciaCombate` (ou a saída da rodada 0) a reergue cheia.
    guardaGolpes: 0,
    guardaEncerrada: false,
    usos: {},
    // As invocações enchem junto. Era a pendência que segurava o PV delas fora
    // da sessão: sem descanso, ninguém zerava aqueles números.
    invocacoes: descansaInvocacoes(sessao.invocacoes),
    // A Reserva para Invocação volta com o descanso (2026-09-30).
    reservaInvocacao: { usada: false, modo: null, restantes: 0 },
    // A cena acaba no descanso: a Quimera da cena e os líderes de Horda dissipada.
    quimeraDaCena: null,
    lideresDeHordaDissolvida: [],
    // O Titã enche junto: a regra de membro perdido some com um descanso, do
    // mesmo espírito da Invocação abatida (`descansaInvocacoes` acima).
    tita: { cabeca: null, membros: [] },
    /* O Preparo enche. O livro separa os dois descansos (*"Em um descanso curto,
       você recupera metade do seu máximo, enquanto em um descanso longo os
       recupera por completo"*), e o botão da Ficha é um só e devolve tudo, por
       decisão do autor (2026-09-23, a D3 respondida como "manter um botão").
       A casca da Postura do Céu morre com a cena, como as de PV e PE. */
    preparoAtual: null,
    preparoTemp: 0,
    buffs: sessao.buffs.filter((b) => b.rodadas == null),
    condicoes: sessao.condicoes
      .filter((c) => c.rodadas == null)
      .filter((c) => c.id !== CHAVE_CONDICAO_RITUAL_ESTENDIDO),
    ritualAtual: null,
  };
}

/**
 * O contador de usos das habilidades (`derived.usosHabilidades`, só o
 * Combatente por enquanto). A sessão guarda os GASTOS, e não os restantes, sob a
 * chave `hab:<id>`: subir de nível aumenta o máximo e os usos novos já nascem
 * livres. O `descansar` zera o `usos` inteiro e devolve todos os contadores de
 * uma vez, porque o botão de descanso é um só (a D3, 2026-09-23).
 */
export function usosGastosDe(sessao, chave) {
  return Math.max(0, inteiro(sessao?.usos?.[chave], 0));
}

/** Gasta (`delta` positivo) ou devolve (negativo) usos, sempre entre 0 e o máximo. */
export function marcaUso(sessao, usos, delta) {
  if (!usos?.chave) return sessao;
  const max = Math.max(0, inteiro(usos.max, 0));
  const antes = usosGastosDe(sessao, usos.chave);
  const depois = Math.max(0, Math.min(max, Math.min(max, antes) + inteiro(delta, 0)));
  if (depois === antes) return sessao;
  return { ...sessao, usos: { ...(sessao.usos || {}), [usos.chave]: depois } };
}

/**
 * Marca ou desmarca uma propriedade do Golpe Especial, na casa dela (ver o
 * cabeçalho de afty-golpe-especial.js). As de contagem ficam entre 0 e o máximo.
 */
export function marcaPropriedadeGolpe(sessao, id, valor) {
  const p = PROPRIEDADES_GOLPE.find((x) => x.id === id);
  if (!p) return sessao;
  const vezes = vezesDaPropriedade(p, valor);
  const guardado = p.max ? vezes : vezes > 0;
  if (p.estado) {
    return { ...sessao, combate: { ...(sessao.combate ?? {}), [p.estado]: guardado } };
  }
  const proprias = { ...(sessao.golpeEspecial ?? {}) };
  if (vezes) proprias[p.id] = guardado;
  else delete proprias[p.id];
  return { ...sessao, golpeEspecial: proprias };
}

/** O Preciso já foi pago nesta rodada? Daí em diante ele custa 2. */
export const precisoPagoNaRodada = (sessao) => (
  sessao?.usos?.[CHAVE_GOLPE_PRECISO] === sessao?.rodada
);

/** A troca do Autossuficiente por 6 PE já foi usada nesta cena? */
export const seisDoAutossuficienteUsado = (sessao) => !!sessao?.usos?.[CHAVE_GOLPE_SEIS];

/**
 * O custo do golpe marcado na sessão. `seis` é a escolha da vez: sem o
 * Autossuficiente ela não vale nada, e depois de usada na cena o abate volta a 3.
 */
export function custoDoGolpeDaSessao(sessao, derived, { seis = false } = {}) {
  const auto = !!derived?.golpeEspecial?.autossuficiente;
  const abate = !auto ? 0 : (seis && !seisDoAutossuficienteUsado(sessao) ? 6 : 3);
  return custoDoGolpe(marcasDoGolpe(sessao), { precisoRepetido: precisoPagoNaRodada(sessao), abate });
}

/**
 * Paga o golpe montado, e é o único lugar que cobra:
 *   • o custo sai do PE pelo `gastaPe`, casca primeiro, como todo gasto;
 *   • o Sacrifício cobra os 15 de dano pelo `aplicaDano`: é dano, e não custo,
 *     então a casca de PV come primeiro;
 *   • o Preciso pago grava a rodada, e o próximo da mesma rodada custa 2;
 *   • a troca por 6 do Autossuficiente fica gasta até a cena acabar.
 * As marcas ficam onde estão. Fora de combate, sem golpe montado ou sem PE para
 * pagar, nada muda, e o botão da Ficha já vem desligado nesses casos.
 */
export function pagaGolpeEspecial(sessao, derived, { seis = false } = {}) {
  if (!derived?.golpeEspecial?.disponivel || !sessao?.combate?.ativo) return sessao;
  const custo = custoDoGolpeDaSessao(sessao, derived, { seis });
  if (!custo.montado) return sessao;
  if (Math.max(0, inteiro(sessao.peAtual, 0)) + peTempTotal(sessao) < custo.aPagar) return sessao;
  const marcas = marcasDoGolpe(sessao);
  let proxima = gastaPe(sessao, custo.aPagar);
  if (marcas.sacrificio) {
    proxima = aplicaDano(proxima, PROPRIEDADES_GOLPE.find((p) => p.id === "sacrificio").dano);
  }
  const usos = { ...(proxima.usos || {}) };
  if (marcas.preciso) usos[CHAVE_GOLPE_PRECISO] = proxima.rodada;
  if (seis && derived.golpeEspecial.autossuficiente && !seisDoAutossuficienteUsado(sessao)) {
    usos[CHAVE_GOLPE_SEIS] = true;
  }
  return { ...proxima, usos };
}

const chaveUsoEstado = (id) => `estado:${id}:rodada`;

/** Estados de addon com duração até a próxima rodada também expiram no descanso. */
function expirarEstadosDaRodada(combate, derived, { descanso = false } = {}) {
  const out = { ...combate };
  for (const e of derived?.combate?.estadosExtras ?? []) {
    // `zeraNoDescanso`: os usos do Feitiço vinculado à Habilidade Única, que
    // voltam cheios no descanso (Criação de Equipamentos, fase 4). ⚠ SÓ NO
    // DESCANSO: a virada de rodada também passa por aqui, e zerava a contagem.
    if (e.expiraNaRodada || (descanso && e.zeraNoDescanso)) out[e.id] = e.tipo === "faixa" ? (e.min ?? 0) : false;
  }
  return out;
}

/** Liga ou desliga um efeito condicional de Treinamento nesta sessão. */
export function alteraTreinoAtivo(sessao, id, valor) {
  if (!id) return sessao;
  return {
    ...sessao,
    treinosAtivos: { ...(sessao.treinosAtivos || {}), [id]: !!valor },
  };
}

/**
 * Paga um custo direto em Vida. Custo não é dano e por isso não consome PV
 * temporário. Devolve o valor realmente pago para a ativação nunca somar Vida
 * que a criatura já não possuía.
 */
export function pagaCustoVida(sessao, bruto) {
  const atual = Math.max(0, inteiro(sessao?.hpAtual, 0));
  const pedido = Math.max(0, inteiro(bruto, 0));
  const pago = Math.min(atual, pedido);
  return {
    sessao: pago > 0 ? { ...sessao, hpAtual: atual - pago } : sessao,
    pago,
  };
}

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
  if (estado.id === "invencivelSobOSol") {
    if (ativando) {
      if (!combate.ativo || Math.max(0, inteiro(sessao.peAtual, 0)) + peTempTotal(sessao) < 4) {
        return sessao;
      }
      const pago = gastaPe(sessao, 4);
      return { ...pago, combate: { ...combate, invencivelSobOSol: true,
        invencivelRodadas: 1, invencivelPendenteExaustao: true } };
    }
    return { ...sessao, combate: { ...combate, invencivelSobOSol: false,
      invencivelRodadas: 0 } };
  }
  // O Talismã do Ápice: ligar começa a contar, trocar o atributo com ele ligado
  // mantém a contagem, e desligar zera. Ver `avancaTalismaApice`.
  if (estado.id === ESTADO_APICE) {
    if (!valor) return { ...sessao, combate: semApice(combate) };
    return { ...sessao, combate: { ...combate, [ESTADO_APICE]: valor,
      talismaApiceRodadas: combate[ESTADO_APICE] ? Math.max(1, inteiro(combate.talismaApiceRodadas, 1)) : 1 } };
  }
  if (ativando && estado.umaVezPorRodada && estadoUsadoNestaRodada(sessao, estado.id)) {
    return sessao;
  }
  /* `exclusivoCom`: ligar este desliga os listados (os dois Canalizar, autor
     2026-09-15). Desligar não mexe nos outros. */
  const desligados = ativando && Array.isArray(estado.exclusivoCom)
    ? Object.fromEntries(estado.exclusivoCom.map((id) => [id, false]))
    : {};
  return {
    ...sessao,
    combate: { ...combate, ...desligados, [estado.id]: valor },
    usos: ativando && estado.umaVezPorRodada
      ? { ...(sessao.usos || {}), [chaveUsoEstado(estado.id)]: sessao.rodada }
      : sessao.usos,
  };
}

/** A mudança de combate encerra o Ápice e cobra a Exaustão da rodada aberta. */
export function aplicaPatchCombate(sessao, parcial) {
  const combate = { ...(sessao?.combate ?? {}), ...parcial };
  if (parcial?.ativo !== false) return { ...sessao, combate };
  return {
    ...sessao,
    exaustao: Math.max(0, inteiro(sessao.exaustao, 0))
      + (combate.invencivelPendenteExaustao ? 1 : 0),
    combate: semApice({ ...combate, invencivelSobOSol: false,
      invencivelRodadas: 0, invencivelPendenteExaustao: false }),
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
