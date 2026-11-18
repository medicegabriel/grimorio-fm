/* Os motores entram PRIMEIRO, pela mesma porta do modelo (ver o topo de modelo.js). */
import { motorDe } from "./motores/index";
import { metade } from "./motores/afty";
import {
  TIPO, PAPEL, combatenteDe, estadoDoCombatente, comEstado, ehDono, normalizarAutor, idNovo,
} from "./modelo";
import { LOG_TIPOS, LOG_MAX, ENCONTRO_STATUS } from "./afty-encontro";
import { LOG_MAX as LOG_MAX_SESSAO } from "../ficha/ficha-sessao";
import { APLICADOR_PROPRIO } from "../ficha/ficha-uso-estado";

/**
 * ============================================================
 * TODA MUDANÇA É UMA OPERAÇÃO (Encontro Unificado, etapa 3, 2026-11-17)
 * ============================================================
 * Uma operação é JSON puro, do jeito que a Sala grava no banco (etapa 7a) e que a
 * automação da Fase 2 vai pedir:
 *
 *   { id, versao, tipo, autor { conta, papel, combatente }, alvo, entrada,
 *     delta: [{ caminho, antes, depois, soma? }], quando,
 *     grupo?, registros?, pedido? { estado, por?, em? }, desfaz? }
 *
 *   tipo       dano, danoMetade, cura, gastarPe, recuperarPe, descansar, alma,
 *              condicao (os verbos tipados), sessao (a genérica) ou desfazer
 *   entrada    a INTENÇÃO, com a rolagem já feita: `{ valor, rolagem?, modo? }`.
 *              A rolagem viaja como resultado e nunca é rolada de novo.
 *   delta      a diferença ESTRUTURAL que a operação faz no estado do alvo, só
 *              nos caminhos tocados. Cada mudança traz o `antes` e o `depois`
 *              daquele caminho (o plano os chamava de antes e depois da
 *              operação, e eles moram aqui dentro porque uma mudança sem o valor
 *              de antes não se desfaz). Chave que some é `AUSENTE`, porque o JSON
 *              apaga `undefined`.
 *   registros  as entradas novas do registro próprio do estado (a rolagem que a
 *              Ficha anotou), que acompanham a operação e não se desfazem.
 *
 * O DUAS FASES. `prepararOperacao` roda FORA do redutor, onde o derivado existe:
 * ele chama o verbo do motor uma vez e mede o delta. `aplicarOperacao` roda no
 * redutor e é um remendo puro, com pré-condição: cada caminho precisa estar com o
 * `antes` da operação, senão nada é aplicado. É a conferência do PATCH_SESSOES,
 * agora por VALOR e não por referência, para valer depois do JSON e entre
 * aparelhos.
 *
 * O PEDIDO. Jogador mexendo no que não é dele gera um pedido pendente (a
 * intenção, sem delta), que o dono do alvo ou o Mestre aceita. O delta é medido
 * no ACEITE, contra o estado daquela hora. Com Aceitar Sozinho ligado no
 * Encontro, o pedido nasce aceito.
 *
 * O HISTÓRICO. O que OUTRA pessoa fez num combatente fica em `historico` no
 * estado dele (teto de 500, a mais antiga sai, autor 2026-11-17), separado do
 * `log` da Ficha (teto de 50). Sem Sala, quem decide "outra pessoa" é o papel:
 * o personagem é do jogador e a criatura é do Mestre ("Personagem por Papel").
 * Virada de turno e de rodada nunca entram.
 *
 * O DESFAZER é uma operação nova (`desfaz: id`), nunca uma remoção: o registro
 * da Sala é só de acréscimo. Ele é RELATIVO NOS NÚMEROS (autor, 2026-11-17):
 * Vida, PE, Alma e as cascas voltam pelo delta mesmo com mudança no meio, desde
 * que caibam entre 0 e o máximo. O resto só volta se ainda estiver como a
 * operação deixou, e qualquer caminho que não fecha cancela o Desfazer inteiro,
 * com aviso de qual foi.
 *
 * Guia completo: docs/afty-encontros.md.
 * ============================================================
 */

export const VERSAO_OPERACAO = 1;
export const HISTORICO_MAX = 500;

export const TIPO_OPERACAO = {
  DANO: "dano",
  DANO_METADE: "danoMetade",
  CURA: "cura",
  GASTAR_PE: "gastarPe",
  RECUPERAR_PE: "recuperarPe",
  DESCANSAR: "descansar",
  ALMA: "alma",
  CONDICAO: "condicao",
  SESSAO: "sessao",
  DESFAZER: "desfazer",
};
const T = TIPO_OPERACAO;

export const ROTULO_OPERACAO = {
  dano: "Dano",
  danoMetade: "Dano pela Metade",
  cura: "Cura",
  gastarPe: "Gastar PE",
  recuperarPe: "Recuperar PE",
  descansar: "Descansar",
  alma: "Alma",
  condicao: "Condições",
  sessao: "Mudança na Ficha",
  desfazer: "Desfazer",
};

const TIPADAS = [T.DANO, T.DANO_METADE, T.CURA, T.GASTAR_PE, T.RECUPERAR_PE, T.DESCANSAR, T.ALMA, T.CONDICAO];

/** As ações em grupo, as seis que vieram da Mesa do Mestre. Cada uma vira UMA operação por alvo. */
export const ACOES_DE_GRUPO = [T.DANO, T.DANO_METADE, T.CURA, T.GASTAR_PE, T.RECUPERAR_PE, T.DESCANSAR];

/* Verbo que, sem o derivado, faria a coisa errada calado: a Cura e o Recuperar PE não têm teto, o Descansar não
   tem até onde encher e a Alma do jogador desceria como a da criatura. */
const PRECISA_DERIVADO = new Set([T.CURA, T.RECUPERAR_PE, T.DESCANSAR, T.ALMA]);

export const ESTADO_PEDIDO = { PENDENTE: "pendente", ACEITO: "aceito", RECUSADO: "recusado" };

/** Quem aceita sozinho um pedido quando o Encontro liga Aceitar Sozinho. */
export const AUTOR_SISTEMA = Object.freeze({ conta: null, papel: PAPEL.SISTEMA, combatente: null });

/* ============================================================ */
/* VALORES, CAMINHOS E A DIFERENÇA ESTRUTURAL                    */
/* ============================================================ */

/** A marca de "esta chave não existe". Sobrevive ao JSON, ao contrário de `undefined`. */
export const AUSENTE = Object.freeze({ $ausente: true });

const ehObjeto = (v) => !!v && typeof v === "object" && !Array.isArray(v);
export const ehAusente = (v) => ehObjeto(v) && v.$ausente === true && Object.keys(v).length === 1;

/* Texto estável (chaves em ordem) para comparar por valor: duas sessões iguais montadas por caminhos diferentes têm as
   chaves em ordem diferente, e o `JSON.stringify` cru as daria como diferentes. */
function estavel(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return `[${v.map(estavel).join(",")}]`;
  return `{${Object.keys(v).filter((k) => v[k] !== undefined).sort()
    .map((k) => `${JSON.stringify(k)}:${estavel(v[k])}`).join(",")}}`;
}

/** Os dois valores são o mesmo, por valor (com `AUSENTE` igual a `AUSENTE`). */
export const mesmoValor = (a, b) => a === b || estavel(a) === estavel(b);

/* ============================================================ */
/* A MARCA DO TURNO NÃO TRAVA A CONFERÊNCIA (etapa 5)            */
/* ============================================================ */
/*
 * A marca `aguardaFimDoTurno` (ver ficha-uso-estado.js) sai sozinha no fim do turno de quem aplicou. Se a conferência a
 * levasse em conta, a operação deixaria de se desfazer logo depois desse fim de turno, sem nada de jogo ter mudado (autor,
 * 2026-11-17, "Ignorar a Marca"). Só a marca é ignorada: a rodada que DESCE ainda fecha o Desfazer, como fechava na virada.
 */
const MARCA_DO_TURNO = "aguardaFimDoTurno";

function estavelSemMarca(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return `[${v.map(estavelSemMarca).join(",")}]`;
  return `{${Object.keys(v).filter((k) => v[k] !== undefined && k !== MARCA_DO_TURNO).sort()
    .map((k) => `${JSON.stringify(k)}:${estavelSemMarca(v[k])}`).join(",")}}`;
}

/** A conferência de um caminho: igual por valor sem olhar a marca do turno. O próprio caminho da marca nunca conflita. */
const confereCaminho = (caminho, atual, esperado) => caminho[caminho.length - 1] === MARCA_DO_TURNO
  || atual === esperado || estavelSemMarca(atual) === estavelSemMarca(esperado);

/**
 * O valor que o Desfazer devolve, com a marca do turno tirada de toda entrada que JÁ a perdeu no estado de agora (casadas
 * pelo `id` nas listas e pela chave nos objetos). Sem isto, desfazer a segunda de duas aplicações do mesmo turno devolveria a
 * primeira com a marca, e ela pularia mais um fim de turno.
 */
export function semMarcasConsumidas(restaurado, atual) {
  if (Array.isArray(restaurado)) {
    const porId = new Map((Array.isArray(atual) ? atual : []).filter((x) => ehObjeto(x) && x.id != null).map((x) => [x.id, x]));
    return restaurado.map((x) => (ehObjeto(x) && x.id != null && porId.has(x.id) ? semMarcasConsumidas(x, porId.get(x.id)) : x));
  }
  if (!ehObjeto(restaurado) || !ehObjeto(atual) || ehAusente(restaurado)) return restaurado;
  const out = {};
  for (const [k, v] of Object.entries(restaurado)) {
    if (k === MARCA_DO_TURNO && v === true && !atual[MARCA_DO_TURNO]) continue;
    out[k] = Object.hasOwn(atual, k) ? semMarcasConsumidas(v, atual[k]) : v;
  }
  return out;
}

/** O valor num caminho, ou `AUSENTE`. */
export function valorEm(obj, caminho) {
  let o = obj;
  for (const k of caminho) {
    if (!ehObjeto(o) || !Object.hasOwn(o, k) || o[k] === undefined) return AUSENTE;
    o = o[k];
  }
  return o;
}

/** O objeto com o valor posto no caminho (sem mexer no original). `AUSENTE` apaga a chave. */
function comValor(obj, caminho, valor) {
  const [k, ...resto] = caminho;
  const base = ehObjeto(obj) ? obj : {};
  if (!resto.length) {
    if (!ehAusente(valor)) return { ...base, [k]: valor };
    if (!Object.hasOwn(base, k)) return base;
    const { [k]: _fora, ...sem } = base;
    return sem;
  }
  return { ...base, [k]: comValor(base[k], resto, valor) };
}

const mudanca = (caminho, antes, depois) => ({
  caminho,
  antes,
  depois,
  ...(typeof antes === "number" && typeof depois === "number" ? { soma: depois - antes } : {}),
});

/**
 * A diferença estrutural entre dois estados, só nos caminhos que mudaram.
 *
 * `regras` vem do motor: `ignorados` nunca entram (o registro próprio, o
 * histórico, o carimbo de gravação), e em `porChave` o diff desce um nível (as
 * cascas por fonte, os usos por habilidade). Listas e o resto são comparados
 * INTEIROS: um diff por índice de lista quebra no Desfazer assim que outro item
 * entra ou sai.
 *
 * A ordem das mudanças é a das chaves do estado NOVO (depois as que só existiam
 * antes): aplicar o delta devolve o objeto com as chaves na ordem que o verbo
 * deixou, e o texto gravado não muda à toa.
 */
const chavesEmOrdem = (antes, depois) => [...new Set([...Object.keys(depois ?? {}), ...Object.keys(antes ?? {})])];

export function diferencaEstrutural(antes, depois, regras = {}) {
  const porChave = new Set(regras.porChave ?? []);
  const ignorados = new Set(regras.ignorados ?? []);
  const delta = [];
  for (const k of chavesEmOrdem(antes, depois)) {
    if (ignorados.has(k)) continue;
    const a = valorEm(antes, [k]);
    const d = valorEm(depois, [k]);
    if (mesmoValor(a, d)) continue;
    if (porChave.has(k) && ehObjeto(a) && !ehAusente(a) && ehObjeto(d) && !ehAusente(d)) {
      for (const s of chavesEmOrdem(a, d)) {
        const sa = valorEm(a, [s]);
        const sd = valorEm(d, [s]);
        if (!mesmoValor(sa, sd)) delta.push(mudanca([k, s], sa, sd));
      }
    } else {
      delta.push(mudanca([k], a, d));
    }
  }
  return delta;
}

/**
 * Aplica um delta num estado. Com `conferir` (o padrão), cada caminho precisa
 * estar com o `antes`, e qualquer um que não esteja devolve o estado como estava
 * e a lista de conflitos. Nunca aplica pela metade.
 */
export function aplicarDelta(estado, delta, { conferir = true } = {}) {
  if (conferir) {
    const conflitos = delta
      .filter((m) => !confereCaminho(m.caminho, valorEm(estado, m.caminho), m.antes))
      .map((m) => ({ caminho: m.caminho, motivo: "mudou" }));
    if (conflitos.length) return { estado, conflitos };
  }
  let out = estado;
  for (const m of delta) out = comValor(out, m.caminho, m.depois);
  return { estado: out, conflitos: [] };
}

/* As entradas que o verbo pôs no registro próprio. A Ficha anota a rolagem no `log`, sempre no COMEÇO. A 2.5.2 anota no
   `combatLog` pelo FIM e corta com `slice(-50)`: o motor diz isso em `registroNoFim` (etapa 4). */
function novasEntradas(antes, depois, noFim = false) {
  if (!Array.isArray(depois) || !depois.length) return [];
  const a = Array.isArray(antes) ? antes : [];
  if (!a.length) return depois.slice();
  if (noFim) {
    const ultima = a[a.length - 1];
    let i = depois.lastIndexOf(ultima);
    if (i === -1) for (let j = depois.length - 1; j >= 0; j--) if (mesmoValor(depois[j], ultima)) { i = j; break; }
    return i >= 0 ? depois.slice(i + 1) : [];
  }
  let i = depois.indexOf(a[0]);
  if (i === -1) i = depois.findIndex((e) => mesmoValor(e, a[0]));
  return i > 0 ? depois.slice(0, i) : [];
}

const comRegistros = (estado, registros, motor) => {
  const atuais = Array.isArray(estado[motor.campoDoRegistro]) ? estado[motor.campoDoRegistro] : [];
  return {
    ...estado,
    [motor.campoDoRegistro]: motor.registroNoFim
      ? [...atuais, ...registros].slice(-LOG_MAX_SESSAO)
      : [...registros, ...atuais].slice(0, LOG_MAX_SESSAO),
  };
};

/* ============================================================ */
/* HISTÓRICO                                                     */
/* ============================================================ */

/** O histórico de um estado, da entrada mais nova para a mais antiga. */
export const historicoDe = (estado) => (Array.isArray(estado?.historico) ? estado.historico : []);

/** Sanea o histórico lido do armazenamento: só entradas com id, no teto. */
export const normalizarHistorico = (lista) => (Array.isArray(lista) ? lista : [])
  .filter((e) => ehObjeto(e) && typeof e.id === "string" && e.id && Array.isArray(e.delta))
  .slice(0, HISTORICO_MAX);

/** Entra no histórico do alvo o que OUTRA pessoa fez. O marcador não tem estado. */
export const entraNoHistorico = (op, combatente) =>
  !!combatente && combatente.tipo !== TIPO.MARCADOR && !ehDono(op?.autor, combatente);

const entradaDoHistorico = (op) => {
  const { registros: _registros, ...resto } = op;
  return resto;
};

const comHistorico = (estado, entrada) => ({
  ...estado,
  historico: [entrada, ...historicoDe(estado)].slice(0, HISTORICO_MAX),
});

const marcarDesfeita = (estado, id, marca) => {
  const lista = historicoDe(estado);
  if (!lista.some((e) => e.id === id)) return estado;
  return { ...estado, historico: lista.map((e) => (e.id === id ? { ...e, desfeita: marca } : e)) };
};

/* ============================================================ */
/* A OPERAÇÃO                                                    */
/* ============================================================ */

const inteiroPositivo = (v) => Math.max(0, Math.trunc(Number(v) || 0));

/* A entrada viaja no JSON: o que não é dado (uma função) fica de fora. */
const entradaSerializavel = (entrada) => (ehObjeto(entrada) ? JSON.parse(JSON.stringify(entrada)) : {});

function montarOperacao({ id, tipo, autor, alvo, entrada, delta, quando, grupo, registros, pedido, desfaz }) {
  return {
    id,
    versao: VERSAO_OPERACAO,
    tipo,
    autor: normalizarAutor(autor),
    alvo,
    entrada: entradaSerializavel(entrada),
    delta,
    quando,
    ...(grupo ? { grupo } : {}),
    ...(registros?.length ? { registros } : {}),
    ...(pedido ? { pedido } : {}),
    ...(desfaz ? { desfaz } : {}),
  };
}

function aplicarVerbo(motor, tipo, base, d, entrada) {
  const v = entrada.valor;
  switch (tipo) {
    case T.DANO: return motor.aplicarDano(base, d, v, { ataqueId: entrada.ataqueId ?? null });
    case T.DANO_METADE: return motor.aplicarDano(base, d, metade(v));
    case T.CURA: return motor.aplicarCura(base, d, v, { externa: !!entrada.externa });
    case T.GASTAR_PE: return motor.gastarPe(base, d, v);
    case T.RECUPERAR_PE: return motor.recuperarPe(base, d, v);
    case T.DESCANSAR: return motor.descansar(base, d, { marioneteId: entrada.marioneteId ?? null });
    case T.ALMA: return motor.alma(base, d, { modo: entrada.modo, valor: v });
    case T.CONDICAO: return motor.condicao(base, d, { modo: entrada.modo, condicao: entrada.condicao, condicoes: entrada.condicoes });
    default: return base;
  }
}

/**
 * QUEM APLICOU (etapa 5, 2026-11-17). A duração em rodadas desce no fim do turno de quem a aplicou, e a operação é o
 * único ponto por onde um combatente põe Efeito, condição ou uso em outro: aqui as entradas com rodadas que NASCERAM no alvo
 * ganham o `aplicadorId` (quando quem aplicou não é o próprio alvo) e a marca do turno (quando entraram no turno de quem
 * aplicou, que só começa a descer no turno seguinte dele). Quem aplicou é `entrada.aplicadorId` (a tela escolhe), senão o
 * `autor.combatente`, senão o próprio alvo (o Mestre sem combatente, autor: "Do Alvo, Salvo Escolha").
 */
function comAplicador(mundo, c, antes, depois, aplicadorId) {
  const m = motorDe(c);
  if (typeof m?.marcarAplicador !== "function") return depois;
  const deFora = typeof aplicadorId === "string" && !!aplicadorId && aplicadorId !== c.id && aplicadorId !== APLICADOR_PROPRIO;
  const quem = deFora ? aplicadorId : c.id;
  const e = mundo?.encontro;
  const noTurno = e?.status === ENCONTRO_STATUS.ATIVO && !!e.ativoId && e.ativoId === quem;
  return m.marcarAplicador(antes, depois, { aplicadorId: deFora ? aplicadorId : APLICADOR_PROPRIO, noTurno });
}

/* O motor que ainda não tem um verbo vira erro de tela, e não exceção solta. */
const comMotor = (fn) => {
  try { return fn(); } catch (e) {
    if (e?.name === "MotorPendente") return { erro: e.message, motorPendente: true };
    throw e;
  }
};

/**
 * Mede uma operação: roda o verbo do motor no estado ATUAL do alvo e devolve a
 * operação com o delta. Roda FORA do redutor, porque precisa do derivado.
 *
 * `intencao`: `{ tipo, alvo, autor, entrada, grupo?, id?, quando? }`. Na
 * operação genérica (`tipo: "sessao"`), `passo` é a função que a Ficha G2
 * embutida manda pelo `onSessao`.
 *
 * `ctx`: `{ derivados, gerarId, agora }`. Devolve `{ operacao }` ou `{ erro }`.
 * Mudança nenhuma não vira operação (`erro: "Nada Mudou"`).
 */
export function prepararOperacao(mundo, intencao, ctx = {}) {
  const { derivados = {}, gerarId = idNovo, agora = Date.now } = ctx;
  const tipo = intencao?.tipo;
  if (!TIPADAS.includes(tipo) && tipo !== T.SESSAO) return { erro: "Operação Desconhecida" };
  const c = combatenteDe(mundo?.encontro, intencao.alvo);
  if (!c) return { erro: "Combatente Ausente" };
  const motor = motorDe(c);
  if (!motor) return { erro: "Combatente sem Ficha" };
  const estado = estadoDoCombatente(c, mundo.sessoes);
  if (!estado) return { erro: "Ficha Ausente" };
  const d = derivados[c.id] ?? null;
  if ((PRECISA_DERIVADO.has(tipo) || motor.sempreDerivado) && !d) return { erro: "Ficha sem Cálculo" };
  const entrada = ehObjeto(intencao.entrada) ? intencao.entrada : {};
  if (tipo === T.SESSAO && typeof intencao.passo !== "function") return { erro: "Operação Desconhecida" };
  return comMotor(() => {
    const base = motor.aparar(estado, d);
    const aparado = motor.aparar(tipo === T.SESSAO ? intencao.passo(base) : aplicarVerbo(motor, tipo, base, d, entrada), d);
    const depois = comAplicador(mundo, c, estado, aparado, entrada.aplicadorId ?? normalizarAutor(intencao.autor).combatente ?? null);
    const delta = diferencaEstrutural(estado, depois, motor);
    if (!delta.length) return { erro: "Nada Mudou", semMudanca: true };
    return {
      operacao: montarOperacao({
        id: intencao.id ?? gerarId("op"),
        tipo,
        autor: intencao.autor,
        alvo: c.id,
        entrada,
        delta,
        quando: intencao.quando ?? agora(),
        grupo: intencao.grupo,
        registros: novasEntradas(estado[motor.campoDoRegistro], depois[motor.campoDoRegistro], motor.registroNoFim),
      }),
    };
  });
}

/**
 * O que a operação faz no estado de UM combatente: o delta (com a pré-condição),
 * os registros, a marca de desfeita e a entrada no histórico. É o mesmo passo que
 * a loja da sessão vai reaplicar sobre a versão de outra aba (ver `passoDaOperacao`).
 */
export function aplicarNoEstado(estado, op, combatente, motor = motorDe(combatente)) {
  const r = aplicarDelta(estado, op.delta ?? []);
  if (r.conflitos.length) return r;
  let out = r.estado;
  if (op.registros?.length) out = comRegistros(out, op.registros, motor);
  if (op.tipo === T.DESFAZER && op.desfaz) {
    out = marcarDesfeita(out, op.desfaz, { operacaoId: op.id, por: op.autor, em: op.quando });
  }
  if (entraNoHistorico(op, combatente)) out = comHistorico(out, entradaDoHistorico(op));
  return { estado: out, conflitos: [] };
}

/**
 * A operação como função de sessão, para a loja (`sessao-loja.atualizar`). Se a
 * versão de outra aba não bate com a pré-condição, a sessão volta como estava e
 * `aoConflito` é chamado com a lista.
 */
export const passoDaOperacao = (op, combatente, aoConflito = null) => (estado) => {
  const r = aplicarNoEstado(estado, op, combatente);
  if (r.conflitos.length) { aoConflito?.(r.conflitos); return estado; }
  return r.estado;
};

/* ============================================================ */
/* O REGISTRO DO ENCONTRO                                        */
/* ============================================================ */

const TIPO_DE_LOG = {
  dano: LOG_TIPOS.DANO, danoMetade: LOG_TIPOS.DANO, alma: LOG_TIPOS.DANO,
  cura: LOG_TIPOS.CURA, condicao: LOG_TIPOS.CONDICAO,
};

/** A frase do Registro para uma operação. Sem ponto e vírgula e sem travessão, porque vai para a tela. */
export function mensagemDaOperacao(op, combatente) {
  const nome = combatente?.nome ?? "Combatente";
  const v = inteiroPositivo(op?.entrada?.valor);
  switch (op?.tipo) {
    case T.DANO: return `Dano: ${v} em ${nome}.`;
    case T.DANO_METADE: return `Dano pela Metade: ${metade(v)} em ${nome}.`;
    case T.CURA: return `Cura: ${v} em ${nome}.`;
    case T.GASTAR_PE: return `Gastar PE: ${v} em ${nome}.`;
    case T.RECUPERAR_PE: return `Recuperar PE: ${v} em ${nome}.`;
    case T.DESCANSAR: return `Descansar: ${nome}.`;
    case T.ALMA:
      if (op.entrada?.modo === "cura") return `Cura na Alma: ${v} em ${nome}.`;
      if (op.entrada?.modo === "definir") return `Alma Definida: ${v} em ${nome}.`;
      return `Dano na Alma: ${v} em ${nome}.`;
    case T.CONDICAO: return `Condições: ${nome}.`;
    case T.DESFAZER: return `Desfazer: ${ROTULO_OPERACAO[op.entrada?.tipoDesfeito] ?? "Operação"} em ${nome}.`;
    default: return `Mudança na Ficha: ${nome}.`;
  }
}

const mensagemDoPedido = (op, combatente, estado) => {
  const nome = combatente?.nome ?? "Combatente";
  const rotulo = ROTULO_OPERACAO[op.tipo] ?? "Operação";
  const v = op.entrada?.valor != null ? ` (${inteiroPositivo(op.entrada.valor)})` : "";
  if (estado === ESTADO_PEDIDO.RECUSADO) return `Pedido Recusado: ${rotulo}${v} em ${nome}.`;
  return `Pedido de ${rotulo}${v} em ${nome}.`;
};

const comLog = (encontro, entradas) => ({
  ...encontro,
  log: [...entradas, ...(encontro.log ?? [])].slice(0, LOG_MAX),
});

/* O id e a hora da entrada saem da própria operação: a mesma operação aplicada em dois aparelhos dá a mesma entrada. */
const entradaDaOperacao = (op, combatente, encontro, mensagem = mensagemDaOperacao(op, combatente)) => ({
  id: `log_${op.id}`,
  rodada: encontro.rodada,
  em: op.quando,
  tipo: TIPO_DE_LOG[op.tipo] ?? LOG_TIPOS.LIVRE,
  mensagem,
  combatenteId: combatente?.id ?? null,
  operacaoId: op.id,
  ...(op.pedido ? { pedido: op.pedido.estado } : {}),
});

/* ============================================================ */
/* APLICAR                                                       */
/* ============================================================ */

/**
 * Aplica uma operação já medida no mundo. Remendo puro, sem derivado: é o que o
 * redutor chama. Devolve `{ mundo, ok, conflitos }`, e com conflito o mundo volta
 * intacto.
 */
export function aplicarOperacao(mundo, op) {
  const c = combatenteDe(mundo?.encontro, op?.alvo);
  if (!c) return { mundo, ok: false, conflitos: [{ caminho: [], motivo: "combatenteAusente" }] };
  const motor = motorDe(c);
  const estado = estadoDoCombatente(c, mundo.sessoes);
  if (!motor || !estado) return { mundo, ok: false, conflitos: [{ caminho: [], motivo: "fichaAusente" }] };
  const r = aplicarNoEstado(estado, op, c, motor);
  if (r.conflitos.length) return { mundo, ok: false, conflitos: r.conflitos };
  const com = comEstado(mundo, c.id, r.estado);
  return { mundo: { ...com, encontro: comLog(com.encontro, [entradaDaOperacao(op, c, com.encontro)]) }, ok: true, conflitos: [] };
}

/**
 * Várias operações de uma vez, TUDO OU NADA: é a conferência do PATCH_SESSOES
 * (a origem e o alvo de uma habilidade mudam juntos, ou nenhum muda).
 */
export function aplicarOperacoes(mundo, ops = []) {
  let m = mundo;
  for (const op of ops) {
    const r = aplicarOperacao(m, op);
    if (!r.ok) return { mundo, ok: false, conflitos: r.conflitos, falhou: op?.id ?? null };
    m = r.mundo;
  }
  return { mundo: m, ok: true, conflitos: [] };
}

/* ============================================================ */
/* AUTORIDADE E PEDIDOS                                          */
/* ============================================================ */

/**
 * Como uma mudança chega ao alvo: "direta" (o Mestre, ou o dono do alvo),
 * "pedido" (jogador no que não é dele) ou "recusada" (espectador).
 */
export function autoridade(autor, combatente) {
  const a = normalizarAutor(autor);
  if (a.papel === PAPEL.ESPECTADOR) return "recusada";
  if (a.papel === PAPEL.MESTRE || ehDono(a, combatente)) return "direta";
  return "pedido";
}

/** Quem responde um pedido, e quem desfaz uma entrada do histórico: o dono do alvo ou o Mestre. */
export const podeResponder = (quem, combatente) =>
  normalizarAutor(quem).papel === PAPEL.MESTRE || ehDono(quem, combatente);

export const pedidosDe = (encontro) => (Array.isArray(encontro?.pedidos) ? encontro.pedidos : []);

/** O mundo com um pedido pendente a mais, anotado no Registro. */
export function registrarPedido(mundo, pedido) {
  const c = combatenteDe(mundo.encontro, pedido.alvo);
  const encontro = { ...mundo.encontro, pedidos: [...pedidosDe(mundo.encontro), pedido] };
  return {
    ...mundo,
    encontro: comLog(encontro, [entradaDaOperacao(pedido, c, encontro, mensagemDoPedido(pedido, c))]),
  };
}

const semPedido = (mundo, id) => ({
  ...mundo,
  encontro: { ...mundo.encontro, pedidos: pedidosDe(mundo.encontro).filter((p) => p.id !== id) },
});

/* O pedido guarda a INTENÇÃO, e o delta é medido no aceite. A genérica não tem intenção que se meça de novo (a
   função da Ficha não viaja), então ela leva o delta já medido e o aceite só confere a pré-condição. */
function novoPedido(mundo, intencao, ctx) {
  const { gerarId = idNovo, agora = Date.now } = ctx;
  const c = combatenteDe(mundo.encontro, intencao.alvo);
  if (!motorDe(c)) return { erro: "Combatente sem Ficha" };
  const quando = intencao.quando ?? agora();
  if (intencao.tipo === T.SESSAO) {
    const prep = prepararOperacao(mundo, { ...intencao, quando }, ctx);
    if (prep.erro) return prep;
    return { pedido: { ...prep.operacao, pedido: { estado: ESTADO_PEDIDO.PENDENTE, em: quando } } };
  }
  if (!TIPADAS.includes(intencao.tipo)) return { erro: "Operação Desconhecida" };
  return {
    pedido: montarOperacao({
      id: intencao.id ?? gerarId("op"),
      tipo: intencao.tipo,
      autor: intencao.autor,
      alvo: c.id,
      entrada: intencao.entrada,
      delta: [],
      quando,
      grupo: intencao.grupo,
      pedido: { estado: ESTADO_PEDIDO.PENDENTE, em: quando },
    }),
  };
}

/**
 * A entrada de toda mudança num combatente. Decide a autoridade, mede e aplica,
 * ou registra o pedido. Devolve `{ mundo, ok, operacao?, pedido?, pendente?,
 * conflitos?, erro? }`.
 */
export function operar(mundo, intencao, ctx = {}) {
  const c = combatenteDe(mundo?.encontro, intencao?.alvo);
  if (!c) return { mundo, ok: false, erro: "Combatente Ausente" };
  const via = autoridade(intencao.autor, c);
  if (via === "recusada") return { mundo, ok: false, erro: "Sem Permissão" };
  if (via === "pedido" && !mundo.encontro.config?.aceitarSozinho) {
    const p = novoPedido(mundo, intencao, ctx);
    if (p.erro) return { mundo, ok: false, erro: p.erro };
    return { mundo: registrarPedido(mundo, p.pedido), ok: true, pendente: true, pedido: p.pedido };
  }
  const prep = prepararOperacao(mundo, intencao, ctx);
  if (prep.erro) return { mundo, ok: false, erro: prep.erro, ...(prep.semMudanca ? { semMudanca: true } : {}) };
  const op = via === "pedido"
    ? { ...prep.operacao, pedido: { estado: ESTADO_PEDIDO.ACEITO, por: AUTOR_SISTEMA, em: prep.operacao.quando, automatico: true } }
    : prep.operacao;
  return { ...aplicarOperacao(mundo, op), operacao: op };
}

/**
 * Aceita um pedido: mede contra o estado de AGORA e aplica. A operação guarda o
 * id e a hora do pedido, e o `pedido` diz quem aceitou e quando. Com conflito
 * (a genérica cujo alvo mudou), o pedido continua pendente.
 */
export function aceitarPedido(mundo, pedidoId, quem, ctx = {}) {
  const { agora = Date.now } = ctx;
  const p = pedidosDe(mundo?.encontro).find((x) => x.id === pedidoId);
  if (!p) return { mundo, ok: false, erro: "Pedido Ausente" };
  const c = combatenteDe(mundo.encontro, p.alvo);
  if (!c) return { mundo, ok: false, erro: "Combatente Ausente" };
  if (!podeResponder(quem, c)) return { mundo, ok: false, erro: "Sem Permissão" };
  let op;
  if (p.tipo === T.SESSAO) {
    op = p;
  } else {
    const prep = prepararOperacao(mundo, { ...p, id: p.id, quando: p.quando }, ctx);
    if (prep.erro) return { mundo, ok: false, erro: prep.erro };
    op = prep.operacao;
  }
  op = { ...op, pedido: { estado: ESTADO_PEDIDO.ACEITO, por: normalizarAutor(quem), em: agora(), pedidoEm: p.pedido?.em ?? p.quando } };
  const r = aplicarOperacao(semPedido(mundo, p.id), op);
  if (!r.ok) return { mundo, ok: false, conflitos: r.conflitos };
  return { ...r, operacao: op };
}

/** Recusa um pedido. Ele sai da lista e fica no Registro. */
export function recusarPedido(mundo, pedidoId, quem, ctx = {}) {
  const { agora = Date.now } = ctx;
  const p = pedidosDe(mundo?.encontro).find((x) => x.id === pedidoId);
  if (!p) return { mundo, ok: false, erro: "Pedido Ausente" };
  const c = combatenteDe(mundo.encontro, p.alvo);
  if (c && !podeResponder(quem, c)) return { mundo, ok: false, erro: "Sem Permissão" };
  const op = { ...p, pedido: { estado: ESTADO_PEDIDO.RECUSADO, por: normalizarAutor(quem), em: agora(), pedidoEm: p.pedido?.em ?? p.quando } };
  const sem = semPedido(mundo, p.id);
  const entrada = { ...entradaDaOperacao(op, c, sem.encontro, mensagemDoPedido(op, c, ESTADO_PEDIDO.RECUSADO)), id: `log_${op.id}_recusa`, em: op.pedido.em };
  return { mundo: { ...sem, encontro: comLog(sem.encontro, [entrada]) }, ok: true, operacao: op };
}

/* ============================================================ */
/* DESFAZER                                                      */
/* ============================================================ */

const casaCaminho = (padrao, caminho) =>
  padrao.length === caminho.length && padrao.every((k, i) => k === "*" || k === caminho[i]);

/**
 * O inverso de um delta, RELATIVO NOS NÚMEROS (autor, 2026-11-17).
 *
 * Caminho relativo do motor (Vida, PE, Alma, cada casca por fonte): volta pela
 * diferença da operação, a partir do valor de AGORA. Cabe se fica entre 0 e o
 * teto. O teto da Vida, do PE e da Alma é o do derivado do estado já desfeito
 * (`derivar`, quando vem, senão o derivado de agora): desfazer Dano na Alma do
 * jogador devolve a Alma e com ela o máximo de Vida. O teto de uma casca que
 * volta é o valor que ela tinha antes da operação: se ela já foi reerguida por
 * cima (a Guarda da rodada nova), o Desfazer avisa em vez de dobrá-la.
 *
 * Qualquer outro caminho só volta se ainda estiver como a operação o deixou.
 *
 * Devolve `{ delta, conflitos }`. Com um conflito que seja, o delta vem vazio.
 */
export function inversoDoDelta(delta, estado, motor, { derivado = null, derivar = null } = {}) {
  const relativo = (caminho) => (motor.relativos ?? []).some((p) => casaCaminho(p, caminho));
  const itens = [];
  const conflitos = [];
  for (const m of delta ?? []) {
    // O que o motor diz que o Desfazer não confere nem devolve (na 2.5.2, o `lastDamage`, que só alimenta as reações).
    if ((motor.soltosNoDesfazer ?? []).some((p) => casaCaminho(p, m.caminho))) continue;
    const atual = valorEm(estado, m.caminho);
    if (!relativo(m.caminho)) {
      // Etapa 5: a marca do turno não conta, e o que volta herda dela o estado de agora (ver `semMarcasConsumidas`).
      if (!confereCaminho(m.caminho, atual, m.depois)) { conflitos.push({ caminho: m.caminho, motivo: "mudou" }); continue; }
      itens.push({ item: mudanca(m.caminho, atual, semMarcasConsumidas(m.antes, atual)) });
      continue;
    }
    const casca = m.caminho.length > 1;
    const num = (v) => (ehAusente(v) ? (casca ? 0 : null) : (typeof v === "number" && Number.isFinite(v) ? v : null));
    const a = num(m.antes);
    const dp = num(m.depois);
    const at = num(atual);
    if (a == null || dp == null || at == null) { conflitos.push({ caminho: m.caminho, motivo: "mudou" }); continue; }
    const alvo = at + (a - dp);
    const depois = casca && alvo === 0 ? AUSENTE : alvo;
    itens.push({ relativo: true, casca, caminho: m.caminho, at, alvo, tetoCasca: a, antes: a, item: mudanca(m.caminho, atual, depois) });
  }
  if (conflitos.length) return { delta: [], conflitos };

  const inverso = itens.map((x) => x.item);
  const tentativo = aplicarDelta(estado, inverso, { conferir: false }).estado;
  const sobe = itens.some((x) => x.relativo && !x.casca && x.alvo > x.at);
  const dCheck = sobe ? (derivar ? derivar(tentativo) : derivado) : derivado;
  for (const x of itens) {
    if (!x.relativo) continue;
    if (x.alvo < 0) { conflitos.push({ caminho: x.caminho, motivo: "foraDoLimite" }); continue; }
    if (x.alvo <= x.at) continue;
    if (x.casca) {
      if (x.alvo > x.tetoCasca) conflitos.push({ caminho: x.caminho, motivo: "foraDoLimite" });
      continue;
    }
    // O quarto argumento é o valor de ANTES da operação: na 2.5.2 o que passa do máximo é PV e PE temporário.
    const teto = motor.limite(x.caminho, tentativo, dCheck, { antes: x.antes });
    if (teto == null) conflitos.push({ caminho: x.caminho, motivo: "semCalculo" });
    else if (x.alvo > teto) conflitos.push({ caminho: x.caminho, motivo: "foraDoLimite" });
  }
  return conflitos.length ? { delta: [], conflitos } : { delta: inverso, conflitos: [] };
}

/**
 * Mede o Desfazer de uma entrada do histórico do alvo. Quem desfaz é o dono do
 * alvo ou o Mestre. `ctx.derivar(combatente, estado)`, quando vem, deriva o
 * estado já desfeito para o teto da Vida (ver `inversoDoDelta`).
 *
 * Devolve `{ operacao }` ou `{ erro, conflitos? }` (com `erro: "Não Fecha"` e os
 * caminhos que não fecharam, para o aviso dizer qual foi).
 */
export function prepararDesfazer(mundo, { alvo, operacaoId } = {}, autor, ctx = {}) {
  const { derivados = {}, gerarId = idNovo, agora = Date.now, derivar = null } = ctx;
  const c = combatenteDe(mundo?.encontro, alvo);
  if (!c) return { erro: "Combatente Ausente" };
  const motor = motorDe(c);
  const estado = estadoDoCombatente(c, mundo.sessoes);
  if (!motor || !estado) return { erro: "Ficha Ausente" };
  if (!podeResponder(autor, c)) return { erro: "Sem Permissão" };
  const original = historicoDe(estado).find((e) => e.id === operacaoId);
  if (!original) return { erro: "Operação Ausente" };
  if (original.desfeita) return { erro: "Já Desfeita" };
  if (original.tipo === T.DESFAZER) return { erro: "Não Desfazível" };
  const inv = inversoDoDelta(original.delta, estado, motor, {
    derivado: derivados[c.id] ?? null,
    derivar: derivar ? (s) => derivar(c, s) : null,
  });
  if (inv.conflitos.length) return { erro: "Não Fecha", conflitos: inv.conflitos };
  return {
    operacao: montarOperacao({
      id: gerarId("op"),
      tipo: T.DESFAZER,
      autor,
      alvo: c.id,
      entrada: { tipoDesfeito: original.tipo },
      delta: inv.delta,
      quando: agora(),
      desfaz: original.id,
    }),
  };
}

/** Mede e aplica o Desfazer. Devolve `{ mundo, ok, operacao?, erro?, conflitos? }`. */
export function desfazer(mundo, alvoEOperacao, autor, ctx = {}) {
  const prep = prepararDesfazer(mundo, alvoEOperacao, autor, ctx);
  if (prep.erro) return { mundo, ok: false, erro: prep.erro, conflitos: prep.conflitos ?? [] };
  return { ...aplicarOperacao(mundo, prep.operacao), operacao: prep.operacao };
}

/* ============================================================ */
/* AÇÕES EM GRUPO                                                */
/* ============================================================ */

/**
 * Dano, Dano pela Metade, Cura, Gastar PE, Recuperar PE ou Descansar em vários
 * alvos: UMA operação por alvo, com o mesmo `grupo`. Um alvo que falha (sem
 * ficha, sem cálculo, nada mudou) não impede os outros. Devolve `{ mundo, grupo,
 * resultados: [{ alvo, ok, pendente, erro, operacaoId }] }`.
 */
export function acaoEmGrupo(mundo, { acao, valor = 0, alvos = [], autor, entrada = {} } = {}, ctx = {}) {
  if (!ACOES_DE_GRUPO.includes(acao)) return { mundo, grupo: null, resultados: [], erro: "Operação Desconhecida" };
  const grupo = (ctx.gerarId ?? idNovo)("grp");
  let m = mundo;
  const resultados = [];
  // As operações e os pedidos medidos, para quem grava o registro fora do Encontro (a Sala, etapa 7b).
  const operacoes = [];
  const pedidos = [];
  for (const alvo of alvos) {
    const r = operar(m, { tipo: acao, alvo, autor, entrada: { ...entrada, valor }, grupo }, ctx);
    m = r.mundo;
    if (r.ok && r.operacao) operacoes.push(r.operacao);
    if (r.ok && r.pedido) pedidos.push(r.pedido);
    resultados.push({
      alvo,
      ok: !!r.ok,
      pendente: !!r.pendente,
      erro: r.erro ?? null,
      operacaoId: r.operacao?.id ?? r.pedido?.id ?? null,
    });
  }
  return { mundo: m, grupo, resultados, operacoes, pedidos };
}

/* ============================================================ */
/* DUAS SESSÕES DE UMA VEZ (o PATCH_SESSOES de hoje)             */
/* ============================================================ */

/* A operação genérica de UM combatente a partir de duas versões do estado dele. */
function operacaoDeSessao(c, antes, depoisBruto, autor, ctx, grupo, { mundo = null, aplicadorId = null } = {}) {
  const { gerarId = idNovo, agora = Date.now } = ctx;
  const motor = motorDe(c);
  // Etapa 5: o que a origem pôs no alvo leva o id da origem (ver `comAplicador`).
  const depois = mundo ? comAplicador(mundo, c, antes, depoisBruto, aplicadorId) : depoisBruto;
  const delta = diferencaEstrutural(antes, depois, motor);
  if (!delta.length) return null;
  return montarOperacao({
    id: gerarId("op"), tipo: T.SESSAO, autor, alvo: c.id, entrada: {}, delta, quando: agora(), grupo,
    registros: novasEntradas(antes[motor.campoDoRegistro], depois[motor.campoDoRegistro], motor.registroNoFim),
  });
}

const turnoEmCursoDe = (mundo) => {
  const e = mundo.encontro;
  const c = e.status === ENCONTRO_STATUS.ATIVO ? combatenteDe(e, e.ativoId) : null;
  if (!c) return null;
  return { id: c.id, rodada: e.rodada, turno: estadoDoCombatente(c, mundo.sessoes)?.uso?.acoes?.turno ?? 0 };
};

/**
 * Uma habilidade que muda a origem E o alvo (o `operarComAlvo` do Encontro de
 * hoje). `fn(sessaoOrigem, derivadoOrigem, sessaoAlvo, derivadoAlvo, { origemId,
 * turnoEmCurso })` devolve `{ aplicado, sessao, sessaoAlvo }`. As duas mudanças
 * viram duas operações aplicadas juntas, tudo ou nada.
 *
 * ⚠ Só com autoridade direta nos dois. O pedido de uma mudança em dois
 * combatentes é desenho da Sala (etapa 7b).
 */
export function operarComAlvo(mundo, { origem, alvo, autor, fn } = {}, ctx = {}) {
  const { derivados = {} } = ctx;
  const cO = combatenteDe(mundo?.encontro, origem);
  const cA = combatenteDe(mundo?.encontro, alvo);
  if (!cO || !cA || origem === alvo || cO.motor !== "afty" || cA.motor !== "afty") return { mundo, ok: false, erro: "Alvo Indisponível" };
  const sO = estadoDoCombatente(cO, mundo.sessoes);
  const sA = estadoDoCombatente(cA, mundo.sessoes);
  if (!sO || !sA) return { mundo, ok: false, erro: "Alvo Indisponível" };
  if (autoridade(autor, cO) !== "direta" || autoridade(autor, cA) !== "direta") return { mundo, ok: false, erro: "Sem Permissão" };
  const r = fn(sO, derivados[origem], sA, derivados[alvo], { origemId: origem, turnoEmCurso: turnoEmCursoDe(mundo) });
  if (!r?.aplicado) return { mundo, ok: false, resultado: r };
  const mO = motorDe(cO);
  const grupo = (ctx.gerarId ?? idNovo)("grp");
  const ops = [
    operacaoDeSessao(cO, sO, mO.aparar(r.sessao, derivados[origem]), autor, ctx, grupo, { mundo, aplicadorId: origem }),
    operacaoDeSessao(cA, sA, mO.aparar(r.sessaoAlvo, derivados[alvo]), autor, ctx, grupo, { mundo, aplicadorId: origem }),
  ].filter(Boolean);
  return { ...aplicarOperacoes(mundo, ops), operacoes: ops, resultado: r };
}

/**
 * O mesmo para uma origem e vários alvos (o `operarComGrupo` de hoje). `fn(sessaoOrigem,
 * derivadoOrigem, [{ id, sessao, derived }])` devolve `{ aplicado, sessao, sessoesAlvo }`.
 */
export function operarComGrupo(mundo, { origem, alvos = [], autor, fn } = {}, ctx = {}) {
  const { derivados = {} } = ctx;
  const cO = combatenteDe(mundo?.encontro, origem);
  const cs = alvos.map((id) => combatenteDe(mundo?.encontro, id));
  const sO = cO && estadoDoCombatente(cO, mundo.sessoes);
  const lista = cs.map((c) => (c ? { id: c.id, c, sessao: estadoDoCombatente(c, mundo.sessoes), derived: derivados[c.id] } : null));
  if (!cO || cO.motor !== "afty" || !sO || !derivados[origem]
    || lista.some((a) => !a || a.c.motor !== "afty" || !a.sessao || !a.derived)) {
    return { mundo, ok: false, erro: "Destinatários Indisponíveis" };
  }
  if ([cO, ...cs].some((c) => autoridade(autor, c) !== "direta")) return { mundo, ok: false, erro: "Sem Permissão" };
  const r = fn(sO, derivados[origem], lista.map(({ id, sessao, derived }) => ({ id, sessao, derived })));
  if (!r?.aplicado) return { mundo, ok: false, resultado: r };
  const m = motorDe(cO);
  const grupo = (ctx.gerarId ?? idNovo)("grp");
  const ops = [
    ...lista.map((a) => (r.sessoesAlvo?.[a.id]
      ? operacaoDeSessao(a.c, a.sessao, m.aparar(r.sessoesAlvo[a.id], a.derived), autor, ctx, grupo, { mundo, aplicadorId: origem }) : null)),
    operacaoDeSessao(cO, sO, m.aparar(r.sessao, derivados[origem]), autor, ctx, grupo, { mundo, aplicadorId: origem }),
  ].filter(Boolean);
  return { ...aplicarOperacoes(mundo, ops), operacoes: ops, resultado: r };
}
