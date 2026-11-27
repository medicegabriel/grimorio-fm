/* Os motores entram PRIMEIRO: o do Afty puxa o `afty-derive.js` antes de tudo, a porta que resolve o ciclo de
   módulos na ordem que funciona (ver asserts/t-ordem-modulos.mjs). */
import { motorDe, MOTORES, normalizarVidaDoMarcador } from "./motores/index";
import {
  LADO, ENCONTRO_STATUS, STATUS_ORDEM, ordenarPorIniciativa, LOG_MAX,
} from "./afty-encontro";
import { aplicarAddons, unirAddons, epocaAddons } from "../afty-addons";

/**
 * ============================================================
 * O ENCONTRO UNIFICADO: O MODELO PURO (etapa 3, 2026-11-17)
 * ============================================================
 * Um Encontro só para os dois livros e as três listas (site padrão, /Afty e
 * /EraDeOuro). Cada combatente diz QUAL motor o calcula e O QUE ele é:
 *
 *   motor "afty", tipo "personagem"   REFERÊNCIA à ficha (`fichaRef { chave, id }`).
 *                                      A sessão é a da própria ficha, fora do Encontro.
 *   motor "afty", tipo "criatura"     instância: `ficha` clonada mais `sessao` própria.
 *   motor "252",  tipo "criatura"     instância: `snapshot` mais `combatState` (a forma da 2.5.2).
 *   tipo "marcador"                   só nome e iniciativa, sem motor.
 *
 * O personagem que entrou como CÓPIA num Encontro antigo e cuja ficha não existe
 * mais no inventário continua cópia (`ficha` mais `sessao`, sem `fichaRef`). É o
 * único caso de personagem-instância, e só a migração o cria.
 *
 * Campos comuns: `id`, `motor`, `tipo`, `nome`, `iniciativa`, `flags { abatido,
 * foraDaOrdem, lado }`, `visao` e `dono`. O `oculto` antigo (pula o turno) virou
 * `foraDaOrdem`, para não confundir com a visão Oculta (uma palavra por coisa).
 *
 * ⚠ A SESSÃO DO PERSONAGEM NÃO MORA NO ENCONTRO. Por isso as funções puras daqui
 * e de operacoes.js recebem e devolvem um MUNDO: `{ encontro, sessoes, fichas }`,
 * em que `sessoes` e `fichas` são mapas pelo id da ficha ligada, que quem chama
 * carrega (a loja da sessão e o inventário). Nada aqui lê o localStorage.
 *
 * Guia completo: docs/afty-encontros.md.
 * ============================================================
 */

export const VERSAO_ENCONTRO = 2;

export const MOTOR = { AFTY: "afty", M252: "252" };
export const TIPO = { PERSONAGEM: "personagem", CRIATURA: "criatura", MARCADOR: "marcador" };
const TIPOS = Object.values(TIPO);

/* O que os outros veem de uma criatura (e de um marcador). O personagem não tem
   visão: o colega vê o resumo dele sempre, e a ficha inteira só pelo
   compartilhamento da Sala (etapa 7). Por isso `visao` é null no personagem. */
export const VISAO = { OCULTA: "oculta", NOME: "nome", BARRA: "barra", ABERTA: "aberta" };
export const VISAO_ORDEM = [VISAO.OCULTA, VISAO.NOME, VISAO.BARRA, VISAO.ABERTA];
export const VISAO_ROTULO = { oculta: "Oculta", nome: "Só Nome", barra: "Barra de Vida", aberta: "Aberta" };

/* Quem fez uma mudança e de quem é um combatente. Sem Sala ninguém tem conta, e
   quem decide "outra pessoa" é o PAPEL (autor, 2026-11-17, "Personagem por
   Papel"): o personagem é do jogador e a criatura é do Mestre, mesmo com uma
   pessoa só no aparelho. */
export const PAPEL = { MESTRE: "mestre", JOGADOR: "jogador", ESPECTADOR: "espectador", SISTEMA: "sistema" };
const PAPEIS = Object.values(PAPEL);

export const GRUPO = { SITE: "site", AFTY: "afty", ERA_DE_OURO: "eradeouro", ECLESIASTES: "eclesiastes" };
const GRUPOS = Object.values(GRUPO);

export const CONFIG_PADRAO = Object.freeze({ aceitarSozinho: false });

/* ============================================================ */
/* UTILIDADES                                                    */
/* ============================================================ */

let contador = 0;
/** Id novo com prefixo. Quem precisa de id estável (asserts, migração) injeta o próprio `gerarId`. */
export const idNovo = (prefixo) =>
  `${prefixo}_${Date.now().toString(36)}_${(contador++).toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export const clonar = (o) =>
  (typeof structuredClone === "function" ? structuredClone(o) : JSON.parse(JSON.stringify(o)));

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};

const ehObjeto = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const textoOuNull = (v) => (typeof v === "string" && v ? v : null);

/* ============================================================ */
/* DONO, AUTOR E VISÃO                                           */
/* ============================================================ */

export const donoPadrao = (tipo) => ({
  conta: null,
  papel: tipo === TIPO.PERSONAGEM ? PAPEL.JOGADOR : PAPEL.MESTRE,
});

export function normalizarDono(bruto, tipo) {
  const padrao = donoPadrao(tipo);
  if (!ehObjeto(bruto)) return padrao;
  return {
    conta: textoOuNull(bruto.conta),
    papel: [PAPEL.MESTRE, PAPEL.JOGADOR].includes(bruto.papel) ? bruto.papel : padrao.papel,
  };
}

/** O autor de uma operação. Papel desconhecido vira espectador, que não opera nada. */
export function normalizarAutor(bruto) {
  return {
    conta: textoOuNull(bruto?.conta),
    papel: PAPEIS.includes(bruto?.papel) ? bruto.papel : PAPEL.ESPECTADOR,
    combatente: textoOuNull(bruto?.combatente),
  };
}

/**
 * Autor e dono são a MESMA pessoa? Com conta dos dois lados, a conta decide. Sem
 * conta dos dois lados (o Encontro local), o papel decide. Um lado com conta e o
 * outro sem é sempre outra pessoa (o Mestre da Sala mexendo na ficha que ele pôs
 * por um jogador sem conta).
 */
export function mesmaPessoa(autor, dono) {
  const a = textoOuNull(autor?.conta);
  const d = textoOuNull(dono?.conta);
  if (a && d) return a === d;
  if (!a && !d) return !!autor?.papel && autor.papel === dono?.papel;
  return false;
}

export const ehDono = (autor, combatente) => mesmaPessoa(autor, combatente?.dono);

/** A visão com que um combatente nasce. A criatura nova nasce Oculta (decisão do autor). */
export function visaoPadrao(tipo, lado) {
  if (tipo === TIPO.PERSONAGEM) return null;
  if (tipo === TIPO.CRIATURA) return VISAO.OCULTA;
  // O marcador costuma ser o jogador sem ficha. O marcador de inimigo segue a criatura.
  return lado === LADO.INIMIGO ? VISAO.OCULTA : VISAO.NOME;
}

const normalizarVisao = (v, tipo, lado) => (
  tipo === TIPO.PERSONAGEM ? null : VISAO_ORDEM.includes(v) ? v : visaoPadrao(tipo, lado)
);

/* ============================================================ */
/* COMBATENTES                                                   */
/* ============================================================ */

const iniciativaDe = (mod = 0) => ({ rolagem: 0, mod: inteiro(mod, 0), total: 0, manual: false });

const normalizarIniciativa = (i) => ({
  rolagem: inteiro(i?.rolagem, 0),
  mod: inteiro(i?.mod, 0),
  total: inteiro(i?.total, 0),
  manual: !!i?.manual,
});

const flagsDe = (lado) => ({ abatido: false, foraDaOrdem: false, lado });

/**
 * O personagem, LIGADO à ficha dele. A sessão é a de `fm_ficha_sessao_afty_v1:<id>`
 * (a mesma da Ficha), e o combatente guarda só a referência. Entra do lado Jogador.
 */
export function criarPersonagem(ficha, { chave = null, lado = LADO.JOGADOR, derived = null, dono, id, gerarId = idNovo } = {}) {
  return {
    id: id ?? gerarId("cmb"),
    motor: MOTOR.AFTY,
    tipo: TIPO.PERSONAGEM,
    nome: ficha?.name || "Personagem",
    fichaRef: { chave: textoOuNull(chave), id: String(ficha?.id ?? "") },
    iniciativa: iniciativaDe(derived?.iniciativa),
    flags: flagsDe(lado),
    visao: null,
    dono: normalizarDono(dono, TIPO.PERSONAGEM),
  };
}

/**
 * A criatura, como CÓPIA (Goblin 1, 2, 3). A ficha entra clonada pelo mesmo
 * motivo de sempre: subir o ND amanhã não muda a luta de ontem no meio.
 *
 * `derived` é opcional e só serve para o estado nascer com os recursos cheios.
 * Na 2.5.2 o estado inicial é o do motor dela (`motores/m252.js`), e ele respeita o
 * `combatState` que a ficha já traz, como o `createCombatant` de hoje.
 */
export function criarCriatura(ficha, {
  chave = null, motor = MOTOR.AFTY, lado = LADO.INIMIGO, derived = null, dono, id, gerarId = idNovo,
} = {}) {
  const adaptador = MOTORES[motor];
  const copia = clonar(ficha);
  const base = {
    id: id ?? gerarId("cmb"),
    motor: adaptador.motor,
    tipo: TIPO.CRIATURA,
    nome: copia?.name || "Combatente",
    criaturaId: textoOuNull(copia?.id),
    origem: chave ? { chave, id: textoOuNull(copia?.id) } : null,
    iniciativa: iniciativaDe(motor === MOTOR.M252 ? copia?.stats?.iniciativa : derived?.iniciativa),
    flags: flagsDe(lado),
    visao: visaoPadrao(TIPO.CRIATURA, lado),
    dono: normalizarDono(dono, TIPO.CRIATURA),
  };
  return motor === MOTOR.M252
    ? { ...base, snapshot: copia, combatState: adaptador.estadoInicial(copia, derived) }
    : { ...base, ficha: copia, sessao: adaptador.estadoInicial(copia, derived) };
}

/**
 * O marcador: só nome e iniciativa, com o cabeçalho de todo combatente (Abatido, Fora da Ordem). Com `pvMax` (rework,
 * etapa 2, "Sem Ficha com Vida") ele nasce com a Vida cheia em `vida`, e o adaptador de `motores/marcador.js` cuida dela.
 */
export function criarMarcador({ nome, mod = 0, lado = LADO.JOGADOR, pvMax = null, dono, id, gerarId = idNovo } = {}) {
  const vida = normalizarVidaDoMarcador({ pvMax });
  return {
    id: id ?? gerarId("cmb"),
    motor: null,
    tipo: TIPO.MARCADOR,
    nome: nome || "Jogador",
    iniciativa: iniciativaDe(mod),
    flags: flagsDe(lado),
    visao: visaoPadrao(TIPO.MARCADOR, lado),
    dono: normalizarDono(dono, TIPO.MARCADOR),
    ...(vida ? { vida } : {}),
  };
}

export const ehLigado = (c) => c?.tipo === TIPO.PERSONAGEM && !!c?.fichaRef?.id;

/** Onde o estado de um combatente mora: "externo" (sessão da ficha), o campo da instância, ou null. */
export function campoDoEstado(c) {
  if (!c) return null;
  if (c.tipo === TIPO.MARCADOR) return c.vida ? "vida" : null;
  if (ehLigado(c)) return "externo";
  return motorDe(c)?.campoDoEstado ?? null;
}

/** O estado de um combatente no mundo: a sessão da ficha ligada, a do combatente, ou o `combatState`. */
export function estadoDoCombatente(c, sessoes = {}) {
  const campo = campoDoEstado(c);
  if (!campo) return null;
  if (campo === "externo") return sessoes?.[c.fichaRef.id] ?? null;
  return c[campo] ?? null;
}

/** A ficha de um combatente: a do inventário (ligado), a cópia, ou o `snapshot`. */
export function fichaDoCombatente(c, fichas = {}) {
  if (!c || c.tipo === TIPO.MARCADOR) return null;
  if (ehLigado(c)) return fichas?.[c.fichaRef.id] ?? null;
  return c.motor === MOTOR.M252 ? c.snapshot ?? null : c.ficha ?? null;
}

export const combatenteDe = (encontro, id) => encontro?.combatentes?.find((c) => c.id === id) ?? null;

/** O mundo com o estado novo de UM combatente, no lugar dele (fora ou dentro do Encontro). */
export function comEstado(mundo, id, estado) {
  const c = combatenteDe(mundo.encontro, id);
  const campo = campoDoEstado(c);
  if (!campo) return mundo;
  if (campo === "externo") return { ...mundo, sessoes: { ...(mundo.sessoes ?? {}), [c.fichaRef.id]: estado } };
  return {
    ...mundo,
    encontro: {
      ...mundo.encontro,
      combatentes: mundo.encontro.combatentes.map((x) => (x.id === id ? { ...x, [campo]: estado } : x)),
    },
  };
}

const LADOS = Object.values(LADO);

/**
 * Sanea um combatente do formato NOVO. O formato antigo (Encontro do Afty de
 * antes e o da 2.5.2) passa por `migracao.js`, que devolve este formato.
 *
 * ⚠ Combatente que perdeu o que o define (criatura sem ficha, personagem sem
 * referência nem cópia) DESCE para marcador, com o mesmo nome e a mesma
 * iniciativa, em vez de sumir da ordem.
 */
export function normalizarCombatente(bruto) {
  if (!ehObjeto(bruto) || typeof bruto.id !== "string" || !bruto.id) return null;
  let tipo = TIPOS.includes(bruto.tipo) ? bruto.tipo : TIPO.MARCADOR;
  const ladoPadrao = tipo === TIPO.PERSONAGEM ? LADO.JOGADOR : LADO.INIMIGO;
  const lado = LADOS.includes(bruto.flags?.lado) ? bruto.flags.lado : ladoPadrao;
  const flags = {
    abatido: !!bruto.flags?.abatido,
    // A migração lê o `oculto` antigo como Fora da Ordem.
    foraDaOrdem: !!(bruto.flags?.foraDaOrdem ?? bruto.flags?.oculto),
    lado,
  };
  const motor = bruto.motor === MOTOR.M252 ? MOTOR.M252 : MOTOR.AFTY;
  const ref = ehObjeto(bruto.fichaRef) && textoOuNull(bruto.fichaRef.id)
    ? { chave: textoOuNull(bruto.fichaRef.chave), id: bruto.fichaRef.id } : null;
  const temFicha = ehObjeto(bruto.ficha);
  const temSnapshot = ehObjeto(bruto.snapshot);
  if (tipo === TIPO.PERSONAGEM && !ref && !temFicha) tipo = TIPO.MARCADOR;
  if (tipo === TIPO.CRIATURA && !(motor === MOTOR.M252 ? temSnapshot : temFicha)) tipo = TIPO.MARCADOR;

  const base = {
    id: bruto.id,
    motor: tipo === TIPO.MARCADOR ? null : motor,
    tipo,
    nome: bruto.nome || "Combatente",
    iniciativa: normalizarIniciativa(bruto.iniciativa),
    flags,
    visao: normalizarVisao(bruto.visao, tipo, lado),
    dono: normalizarDono(bruto.dono, tipo),
  };
  if (tipo === TIPO.MARCADOR) {
    // Só o marcador gravado como marcador guarda a Vida. O que DESCEU para marcador (perdeu a ficha) não ganha uma.
    const vida = bruto.tipo === TIPO.MARCADOR ? normalizarVidaDoMarcador(bruto.vida) : null;
    return vida ? { ...base, vida } : base;
  }
  const origem = ehObjeto(bruto.origem) ? { chave: textoOuNull(bruto.origem.chave), id: textoOuNull(bruto.origem.id) } : null;
  if (tipo === TIPO.PERSONAGEM && ref) {
    return {
      ...base,
      motor: MOTOR.AFTY,
      fichaRef: ref,
      // A sessão que a cópia tinha no Encontro antigo, guardada só para consulta (autor, 2026-11-17).
      ...(ehObjeto(bruto.copiaAntiga) ? { copiaAntiga: bruto.copiaAntiga } : {}),
      // O personagem de um jogador na Sala (etapa 7b): a sessão de quando a Sala fechou, só para consulta no Encontro Finalizado.
      ...(ehObjeto(bruto.sessaoFinal) ? { sessaoFinal: bruto.sessaoFinal } : {}),
    };
  }
  if (motor === MOTOR.M252) {
    return {
      ...base,
      criaturaId: textoOuNull(bruto.criaturaId),
      origem,
      snapshot: bruto.snapshot,
      // A forma do `combatState` é da 2.5.2 e é do motor dela (`motores/m252.js`, etapa 4): ele passa como está.
      combatState: ehObjeto(bruto.combatState) ? MOTORES[MOTOR.M252].normalizarEstado(bruto.combatState) : null,
    };
  }
  return {
    ...base,
    motor: MOTOR.AFTY,
    criaturaId: textoOuNull(bruto.criaturaId),
    origem,
    ficha: bruto.ficha,
    sessao: MOTORES.afty.normalizarEstado(bruto.sessao),
  };
}

/* ============================================================ */
/* ENCONTRO                                                      */
/* ============================================================ */

export function criarEncontro({ nome = "Novo Encontro", pastaId = null, grupo = null, id, gerarId = idNovo, agora = Date.now } = {}) {
  const t = agora();
  return {
    id: id ?? gerarId("enc"),
    versao: VERSAO_ENCONTRO,
    grupo: GRUPOS.includes(grupo) ? grupo : null,
    nome,
    pastaId,
    criadoEm: t,
    atualizadoEm: t,
    status: ENCONTRO_STATUS.PLANEJANDO,
    rodada: 1,
    ativoId: null,
    combatentes: [],
    log: [],
    pedidos: [],
    config: { ...CONFIG_PADRAO },
  };
}

/* ---------- o que o rework (etapa 2, 2026-11-23) guarda no Encontro ---------- */

/**
 * A PILHA DO MESTRE ("Desfazer do Mestre"): as operações do Mestre que não entraram no histórico de ninguém (a criatura dele, o
 * marcador com Vida), da mais nova para a mais antiga, com o teto. É o par do histórico Personagem por Papel, que segue igual:
 * cada operação mora num lugar só, e por isso se desfaz uma vez só. Mora no Encontro, que a Sala não publica.
 */
export const PILHA_DO_MESTRE_MAX = 50;

export const normalizarPilhaDoMestre = (lista) => (Array.isArray(lista) ? lista : [])
  .filter((e) => ehObjeto(e) && typeof e.id === "string" && e.id && typeof e.alvo === "string" && Array.isArray(e.delta))
  .slice(0, PILHA_DO_MESTRE_MAX);

/** A ÚLTIMA VIRADA (Voltar Turno, e o Reabrir exato): o que a passagem de turno, a Nova Rodada ou o Encerrar mudou. */
export const TIPO_DE_VIRADA = { TURNO: "turno", RODADA: "rodada", ENCERRAR: "encerrar" };
const TIPOS_DE_VIRADA = Object.values(TIPO_DE_VIRADA);

const momentoDa = (m) => ({
  status: STATUS_ORDEM.includes(m?.status) ? m.status : ENCONTRO_STATUS.ATIVO,
  ativoId: textoOuNull(m?.ativoId),
  rodada: Math.max(1, inteiro(m?.rodada, 1)),
});

export function normalizarVirada(v) {
  if (!ehObjeto(v) || !textoOuNull(v.id) || !TIPOS_DE_VIRADA.includes(v.tipo) || !ehObjeto(v.de) || !ehObjeto(v.para)) return null;
  return {
    id: v.id,
    tipo: v.tipo,
    de: momentoDa(v.de),
    para: momentoDa(v.para),
    deltas: (Array.isArray(v.deltas) ? v.deltas : [])
      .filter((x) => ehObjeto(x) && textoOuNull(x.alvo) && Array.isArray(x.delta) && x.delta.length)
      .map((x) => ({ alvo: x.alvo, delta: x.delta })),
    quando: inteiro(v.quando, 0),
  };
}

/** Sanea um Encontro do formato novo (`versao: 2`). Outro formato devolve null: quem lê o antigo é `migracao.js`. */
export function normalizarEncontro(entrada) {
  if (!ehObjeto(entrada) || entrada.versao !== VERSAO_ENCONTRO) return null;
  // Os campos do rework só ficam gravados quando têm o que guardar (o Encontro de antes não ganha chave vazia).
  const { pilhaDoMestre: pilhaBruta, ultimaVirada: viradaBruta, ...bruto } = entrada;
  const pilha = normalizarPilhaDoMestre(pilhaBruta);
  const virada = normalizarVirada(viradaBruta);
  const vistos = new Set();
  const refs = new Set();
  const combatentes = [];
  for (const c of Array.isArray(bruto.combatentes) ? bruto.combatentes : []) {
    const n = normalizarCombatente(c);
    if (!n || vistos.has(n.id)) continue;
    // A mesma ficha ligada duas vezes teria uma sessão só para dois combatentes.
    if (ehLigado(n) && refs.has(n.fichaRef.id)) continue;
    vistos.add(n.id);
    if (ehLigado(n)) refs.add(n.fichaRef.id);
    combatentes.push(n);
  }
  return {
    ...bruto,
    versao: VERSAO_ENCONTRO,
    grupo: GRUPOS.includes(bruto.grupo) ? bruto.grupo : null,
    nome: bruto.nome || "Encontro",
    pastaId: bruto.pastaId ?? null,
    status: STATUS_ORDEM.includes(bruto.status) ? bruto.status : ENCONTRO_STATUS.PLANEJANDO,
    rodada: Math.max(1, inteiro(bruto.rodada, 1)),
    ativoId: combatentes.some((c) => c.id === bruto.ativoId) ? bruto.ativoId : null,
    combatentes,
    log: (Array.isArray(bruto.log) ? bruto.log : []).slice(0, LOG_MAX),
    pedidos: (Array.isArray(bruto.pedidos) ? bruto.pedidos : [])
      .filter((p) => ehObjeto(p) && typeof p.id === "string" && p.pedido?.estado === "pendente"),
    config: { ...CONFIG_PADRAO, ...(ehObjeto(bruto.config) ? { aceitarSozinho: !!bruto.config.aceitarSozinho } : {}) },
    ...(pilha.length ? { pilhaDoMestre: pilha } : {}),
    ...(virada ? { ultimaVirada: virada } : {}),
  };
}

/**
 * Duplica para rodar de novo. A sessão das instâncias vem inteira (mesma decisão
 * do Encontro de hoje, 2026-08-09: ramificar uma luta em andamento). O personagem
 * ligado não tem o que copiar: a sessão é da ficha.
 */
export function duplicarEncontro(encontro, { gerarId = idNovo, agora = Date.now } = {}) {
  // A pilha do Mestre e a última virada são da luta de origem, e os ids dela não existem na cópia.
  const { pilhaDoMestre: _pilha, ultimaVirada: _virada, ...clone } = clonar(encontro);
  const t = agora();
  return {
    ...clone,
    id: gerarId("enc"),
    nome: `${clone.nome} (cópia)`,
    criadoEm: t,
    atualizadoEm: t,
    status: ENCONTRO_STATUS.PLANEJANDO,
    rodada: 1,
    ativoId: null,
    log: [],
    pedidos: [],
    combatentes: clone.combatentes.map((c) => ({
      ...c,
      id: gerarId("cmb"),
      iniciativa: { rolagem: 0, mod: c.iniciativa.mod, total: 0, manual: false },
    })),
  };
}

/** Sem iniciativa: nunca rolou e ninguém digitou. É o que o Começar rola sozinho (ver `COMECAR` em redutor.js). */
export const semIniciativa = (c) => c.iniciativa.rolagem === 0 && !c.iniciativa.manual;

/**
 * O que falta para começar. A iniciativa vazia não trava mais (rework, etapa 2, "Começar Rola as Vazias"): o Começar rola as
 * vazias, e `semIniciativa` diz quantas são, para a tela contar.
 */
export function validarInicio(encontro) {
  const erros = [];
  if (encontro.combatentes.length === 0) erros.push("Adicione pelo menos um combatente.");
  return { valido: erros.length === 0, erros, semIniciativa: encontro.combatentes.filter(semIniciativa).length };
}

/* ============================================================ */
/* TURNOS                                                        */
/* ============================================================ */

/** Joga turno quem não está Abatido nem Fora da Ordem. O marcador também, agora. */
export const jogaTurno = (c) => !c.flags.abatido && !c.flags.foraDaOrdem;

/**
 * Quem joga agora: `{ proximoId, rodada, novaRodada }`. A mesma busca do Encontro
 * de hoje, pela ordem COMPLETA, para quem caiu na própria vez não fazer o turno
 * voltar ao começo.
 */
export function proximoTurno(encontro) {
  const ordem = ordenarPorIniciativa(encontro.combatentes);
  const elegiveis = ordem.filter(jogaTurno);
  if (elegiveis.length === 0) return { proximoId: null, rodada: encontro.rodada, novaRodada: false };
  const atual = ordem.findIndex((c) => c.id === encontro.ativoId);
  if (atual === -1) return { proximoId: elegiveis[0].id, rodada: encontro.rodada, novaRodada: false };
  for (let i = atual + 1; i < ordem.length; i += 1) {
    if (jogaTurno(ordem[i])) return { proximoId: ordem[i].id, rodada: encontro.rodada, novaRodada: false };
  }
  return { proximoId: elegiveis[0].id, rodada: encontro.rodada + 1, novaRodada: true };
}

/**
 * "Goblin #1", "Goblin #2" para as cópias da mesma criatura. Personagem e
 * marcador ficam de fora: o personagem é único por ficha.
 */
export function renumerarCopias(combatentes) {
  const grupos = new Map();
  for (const c of combatentes) {
    if (c.tipo !== TIPO.CRIATURA) continue;
    const chave = `${c.motor}:${c.origem?.id ?? c.criaturaId ?? c.id}`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(c);
  }
  const nomes = {};
  for (const grupo of grupos.values()) {
    const base = (grupo[0].ficha ?? grupo[0].snapshot)?.name ?? "Combatente";
    if (grupo.length <= 1) { nomes[grupo[0].id] = base; continue; }
    grupo.forEach((c, i) => { nomes[c.id] = `${base} #${i + 1}`; });
  }
  return combatentes.map((c) => (nomes[c.id] != null ? { ...c, nome: nomes[c.id] } : c));
}

/* ============================================================ */
/* DERIVAR E RESUMIR                                             */
/* ============================================================ */

/**
 * Um derivado por combatente, como o memo do Encontro de hoje: a UNIÃO dos addons
 * de todas as fichas do Afty é aplicada uma vez antes do laço, e cada derive usa o
 * cache por ficha (`derivarComCache`).
 *
 * ⚠ O CACHE É PELA IDENTIDADE DA FICHA. A ficha ligada vem do inventário, e quem
 * monta o `fichas` precisa reaproveitar o mesmo objeto entre renderizações (ver
 * `lerInventario` em listas.js, que memoriza pelo texto gravado).
 *
 * O motor que lança não derruba os outros: o combatente fica sem número e o erro vai em `erros`.
 */
export function derivarEncontro({ encontro, sessoes = {}, fichas = {} } = {}) {
  const combatentes = encontro?.combatentes ?? [];
  const doAfty = combatentes.filter((c) => c.motor === MOTOR.AFTY)
    .map((c) => fichaDoCombatente(c, fichas)).filter(Boolean);
  const { pacotes, divergencias } = unirAddons(doAfty);
  aplicarAddons(pacotes);
  const epoca = epocaAddons();
  const mapa = {};
  const erros = {};
  for (const c of combatentes) {
    const m = motorDe(c);
    if (!m) { mapa[c.id] = null; continue; }
    try {
      mapa[c.id] = m.derivar(fichaDoCombatente(c, fichas), estadoDoCombatente(c, sessoes), epoca);
    } catch (e) {
      mapa[c.id] = null;
      erros[c.id] = e?.message ?? String(e);
    }
  }
  return { mapa, divergencias, erros };
}

/** O resumo de um combatente (Vida, PE, Alma, condições, Efeitos). O marcador não tem número. */
export function resumoDoCombatente(c, { sessoes = {}, derivados = {} } = {}) {
  const m = motorDe(c);
  const estado = estadoDoCombatente(c, sessoes);
  if (!m || !estado) return null;
  return m.resumo(estado, derivados[c.id] ?? null);
}
