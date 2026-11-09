/**
 * ============================================================
 * BARREIRAS, CORTINAS E CESTA OCA DE VIME (CL3, 2026-11-01)
 * ============================================================
 * Livro de Regras p.188 e 189. O estado mora em `sessao.barreiras` (`ficha-barreiras-estado.js`) e, para a Cesta, em
 * `sessao.uso` (um uso ativo com concentração). O PV, a RD e o máximo vêm PRONTOS do derive
 * (`derived.dominios.barreira`), e aqui só se gasta, se ergue, se fere e se destrói.
 *
 * ⚠ CONSOME O CONTRATO DE USO DO CL1 (`usa`). O custo em PE segue a política dele: `manual` por padrão, que confere que
 * há Energia e devolve `custo.pe.naoDescontado` ("PE Não Descontado") sem debitar. `cobranca: "confirmada"` no pedido
 * debita. A ação (comum, bônus, reação) é registrada quando o pedido traz `registraAcao`.
 *
 * ⚠ TODA OPERAÇÃO QUE ESCREVE PEDE `opId`. Repetir o id devolve `repetida` e a MESMA sessão. Recusa devolve a MESMA
 * sessão, com `erro`, `codigo` e `recusas`.
 *
 * ⚠ O QUE O LIVRO NÃO DIZ, A FICHA NÃO INVENTA.
 *   • duração de parede e de cortina: não há (ficam até serem destruídas, retiradas ou o descanso);
 *   • RD da cortina: o livro só dá PV a ela, então vale zero;
 *   • a ação de criar a cortina: não está escrita, então nenhuma é registrada;
 *   • o custo da cortina: "1 ponto de energia para cada 9 metros que a área dela irá cobrir". Leitura adotada: cada
 *     bloco de 9 m, ainda que incompleto, custa 1 (mínimo 1). Pergunta na fila.
 *   • quem é atingido pelo Acerto Garantido: a ficha não sabe onde ninguém está. A mesa informa.
 * ============================================================
 */
import { usa } from "./ficha-uso";
import { usoDe, comUso, jaAplicada, comOperacao, encerraAtivoNaSessao } from "./ficha-uso-estado";
import { barreirasDe, comBarreiras, TETO_PAREDES, TETO_CORTINAS, TETO_CONDICOES } from "./ficha-barreiras-estado";

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};
const lista = (v) => (Array.isArray(v) ? v : []);

const semIdentidade = (sessao) => ({ sessao, aplicado: false, erro: "Sem Identidade da Operação", codigo: "sem-opid" });
const recusa = (sessao, erro, codigo) => ({ sessao, aplicado: false, erro, codigo, recusas: [{ codigo, motivo: erro }] });
const aptidoesDe = (derived) => lista(derived?.aptidoesEscolhidas);
const rodadaDe = (sessao) => Math.max(0, inteiro(sessao?.rodada));

export const USO_PAREDES = "barreira:paredes";
export const USO_MANIPULAR = "barreira:manipular";
export const USO_CORTINA = "barreira:cortina";
export const USO_CESTA = "cesta_oca_de_vime";
/** Livro p.188: a Cesta custa 3 PE. */
export const CUSTO_DA_CESTA = 3;
/** Livro p.188: "uma cortina ... 1 ponto de energia para cada 9 metros". */
export const METROS_POR_PE_DA_CORTINA = 9;

/** O custo da Cortina para uma área em metros. Cada bloco de 9 m, ainda que incompleto, custa 1, e o mínimo é 1. */
export const custoDaCortina = (area) => {
  const a = Number(area);
  if (!Number.isFinite(a) || a <= 0) return 0;
  return Math.max(1, Math.ceil(a / METROS_POR_PE_DA_CORTINA));
};

/** A Durabilidade da Cesta: o Nível de Aptidão em Barreira mais 1 (p.188). */
export const durabilidadeDaCesta = (derived) => Math.max(0, inteiro(derived?.dominios?.barNivel)) + 1;

/* ============================================================ */
/* PAREDES                                                       */
/* ============================================================ */
/** Por que as paredes não podem ser erguidas agora, ou `null`. Puro. */
export function bloqueioDeParedes(sessao, derived) {
  const b = derived?.dominios?.barreira;
  if (!b?.tem) return "Falta Técnicas de Barreira";
  if (barreirasDe(sessao).paredes.length >= TETO_PAREDES) return "Paredes Demais em Campo";
  return null;
}

/** O descritor de uso das paredes: 1 PE por parede, até o máximo de uma vez. Barreira Rápida troca a ação comum pela bônus. */
export function descritorDasParedes(derived) {
  const b = derived?.dominios?.barreira ?? {};
  const rapida = aptidoesDe(derived).includes("barreira_rapida");
  return {
    id: USO_PAREDES,
    nome: "Técnicas de Barreira",
    origem: "tecnicas_de_barreira",
    acesso: () => (b.tem ? true : "Falta Técnicas de Barreira"),
    parametros: [{ id: "quantidade", tipo: "faixa", min: 1, max: Math.max(1, inteiro(b.maxParedes, 6)), rotulo: "Quantidade de Paredes" }],
    custo: { pe: (v) => v.quantidade },
    acao: rapida ? "bonus" : "comum",
  };
}

/**
 * ERGUE paredes: `usa` confere acesso, quantidade (de 1 até o máximo de uma vez), Energia e ação, e as paredes entram
 * com o PV e a RD que o derive calculou. "Não é possível empilhar várias barreiras" (p.189): a posição é da mesa.
 */
export function erguerParedes(sessao, derived, { quantidade, opId, registraAcao = false, cobranca = "manual" } = {}) {
  const bloqueio = bloqueioDeParedes(sessao, derived);
  if (typeof opId === "string" && opId && !jaAplicada(sessao, opId) && bloqueio) return recusa(sessao, bloqueio, "barreira-indisponivel");
  const d = { ...descritorDasParedes(derived), cobranca };
  const r = usa(sessao, derived, d, { opId, registraAcao, parametros: { quantidade } });
  if (!r.aplicado) return r;
  const b = derived.dominios.barreira;
  const n = inteiro(quantidade);
  const novas = Array.from({ length: n }, (_, i) => ({
    id: `parede_${opId}_${i + 1}`, pv: b.pvParede, pvMax: b.pvParede, rd: b.rdParede, desde: rodadaDe(sessao),
  }));
  const s = comBarreiras(r.sessao, (x) => ({ ...x, paredes: [...x.paredes, ...novas].slice(0, TETO_PAREDES) }));
  return { ...r, sessao: s, paredes: novas.map((p) => p.id), evento: { ...r.evento, tipo: "parede-erguida", quantidade: n } };
}

/** "Você pode as manipular e mover usando outra ação comum" (p.188): a ação, sem custo. A posição é da mesa. */
export function manipularBarreiras(sessao, derived, { opId, registraAcao = false } = {}) {
  const b = derived?.dominios?.barreira;
  if (!b?.tem) return typeof opId === "string" && opId ? recusa(sessao, "Falta Técnicas de Barreira", "barreira-indisponivel") : semIdentidade(sessao);
  const d = { id: USO_MANIPULAR, nome: "Manipular Barreiras", acao: aptidoesDe(derived).includes("barreira_rapida") ? "bonus" : "comum" };
  return usa(sessao, derived, d, { opId, registraAcao });
}

/* ============================================================ */
/* CORTINAS                                                      */
/* ============================================================ */
export function descritorDaCortina(derived, area) {
  const b = derived?.dominios?.barreira ?? {};
  return {
    id: USO_CORTINA,
    nome: "Cortina",
    origem: "cortina",
    acesso: () => (b.temCortina && b.tem ? true : "Falta a Aptidão Cortina"),
    custo: { pe: custoDaCortina(area) },
  };
}

/**
 * CRIA uma Cortina de `area` metros. PV: três paredes. RD: zero (o livro não a dá). `condicoes` são textos da mesa
 * ("prender não feiticeiros", p.189) e nunca viram número. Não há custo para mantê-la.
 */
export function criarCortina(sessao, derived, { area, nome = "", condicoes = [], opId, registraAcao = false, cobranca = "manual" } = {}) {
  if (typeof opId !== "string" || !opId) return semIdentidade(sessao);
  if (!(Number(area) > 0)) return recusa(sessao, "Informe a Área da Cortina", "area-invalida");
  if (barreirasDe(sessao).cortinas.length >= TETO_CORTINAS) return recusa(sessao, "Cortinas Demais em Campo", "barreira-indisponivel");
  const r = usa(sessao, derived, { ...descritorDaCortina(derived, area), cobranca }, { opId, registraAcao });
  if (!r.aplicado) return r;
  const b = derived.dominios.barreira;
  const nova = {
    id: `cortina_${opId}`, nome: String(nome).slice(0, 80), area: Number(area), pv: b.pvCortina, pvMax: b.pvCortina, rd: 0,
    condicoes: lista(condicoes).filter((c) => typeof c === "string" && c.trim()).slice(0, TETO_CONDICOES), desde: rodadaDe(sessao),
  };
  const s = comBarreiras(r.sessao, (x) => ({ ...x, cortinas: [...x.cortinas, nova] }));
  return { ...r, sessao: s, cortinaId: nova.id, evento: { ...r.evento, tipo: "cortina-criada", area: nova.area } };
}

/* ============================================================ */
/* DANO E DESTRUIÇÃO                                             */
/* ============================================================ */
const COLECAO = { parede: "paredes", cortina: "cortinas" };

/** A parede ou cortina daquele id, ou `null`. */
export function achaBarreira(sessao, id) {
  const b = barreirasDe(sessao);
  for (const [tipo, chave] of Object.entries(COLECAO)) {
    const e = b[chave].find((x) => x.id === id);
    if (e) return { tipo, chave, barreira: e };
  }
  return null;
}

/**
 * A parede ou cortina RECEBE dano. A RD dela abate (mínimo zero) e o PV desce. A zero ela é destruída e sai da lista.
 * `dano` é o valor que a mesa informou depois de decidir o que a atinge (p.189: "pode ser quebrada normalmente"). A ficha
 * não aplica Resistência nem Vulnerabilidade a parede, porque o livro não as dá.
 */
export function danoNaBarreira(sessao, id, dano, { opId } = {}) {
  if (typeof opId !== "string" || !opId) return semIdentidade(sessao);
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  const achado = achaBarreira(sessao, id);
  if (!achado) return recusa(sessao, "Barreira Inexistente", "barreira-inexistente");
  const bruto = Math.max(0, inteiro(dano));
  const liquido = Math.max(0, bruto - achado.barreira.rd);
  const pv = Math.max(0, achado.barreira.pv - liquido);
  const destruida = pv === 0;
  const s = comBarreiras(sessao, (x) => ({
    ...x,
    [achado.chave]: destruida ? x[achado.chave].filter((e) => e.id !== id) : x[achado.chave].map((e) => (e.id === id ? { ...e, pv } : e)),
  }));
  return {
    sessao: comOperacao(s, { id: opId, tipo: "dano-barreira" }), aplicado: true, liquido, pv, destruida, tipo: achado.tipo,
    evento: { tipo: destruida ? "barreira-destruida" : "barreira-ferida", id, liquido, pv },
  };
}

/** Retira a parede ou a cortina à mão (desfeita pela mesa, fora da cena). */
export function removeBarreira(sessao, id, { opId } = {}) {
  if (typeof opId !== "string" || !opId) return semIdentidade(sessao);
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  const achado = achaBarreira(sessao, id);
  if (!achado) return recusa(sessao, "Barreira Inexistente", "barreira-inexistente");
  const s = comBarreiras(sessao, (x) => ({ ...x, [achado.chave]: x[achado.chave].filter((e) => e.id !== id) }));
  return { sessao: comOperacao(s, { id: opId, tipo: "remove-barreira" }), aplicado: true, tipo: achado.tipo };
}

/* ============================================================ */
/* CESTA OCA DE VIME                                             */
/* ============================================================ */
/**
 * O descritor da Cesta. `como`: `"bonus"` (Ação Bônus) ou `"reacao"` (a uma Expansão de Domínio, que a mesa CONFIRMA em
 * `contraExpansao`). Gasta 3 PE, usa Concentração e tem Durabilidade igual ao Nível de BAR mais 1 (p.188). A Durabilidade
 * e o selo ficam nos parâmetros do uso ativo, e o teste de concentração falho (CL1) desce 1 de Durabilidade em vez de
 * derrubar a Cesta. Dura até o fim da cena (o fim do combate a derruba), ou até quebrar.
 */
export function descritorDaCesta(derived, { como = "bonus" } = {}) {
  const dur = durabilidadeDaCesta(derived);
  const tem = aptidoesDe(derived).includes(USO_CESTA);
  return {
    id: USO_CESTA,
    nome: "Cesta Oca de Vime",
    origem: USO_CESTA,
    acesso: () => (tem ? true : "Falta a Cesta Oca de Vime"),
    acao: como === "reacao" ? "reacao" : "bonus",
    custo: { pe: CUSTO_DA_CESTA },
    concentracao: true,
    duracao: { ate: "cena" },
    parametros: [
      { id: "durabilidade", tipo: "faixa", min: dur, max: dur, padrao: dur, rotulo: "Durabilidade" },
      { id: "selo", tipo: "bool", padrao: false },
      ...(como === "reacao" ? [{ id: "contraExpansao", tipo: "bool", exige: true, rotulo: "Em Resposta a Uma Expansão de Domínio" }] : []),
    ],
  };
}

/** Ativa a Cesta. Devolve o resultado do `usa`: a Cesta fica em `sessao.uso.ativos.cesta_oca_de_vime`. */
export function usarCesta(sessao, derived, { como = "bonus", contraExpansao = false, opId, registraAcao = false, cobranca = "manual", encerraAnterior = false } = {}) {
  const d = { ...descritorDaCesta(derived, { como }), cobranca };
  return usa(sessao, derived, d, { opId, registraAcao, encerraAnterior, parametros: { contraExpansao } });
}

/** A Cesta de agora: `{ ativa, durabilidade, selo, maos }`. Puro. */
export function estadoDaCesta(sessao) {
  const a = usoDe(sessao).ativos[USO_CESTA];
  if (!a) return { ativa: false, durabilidade: 0, selo: false, maos: 0 };
  return { ativa: true, durabilidade: inteiro(a.parametros?.durabilidade), selo: !!a.parametros?.selo, maos: a.parametros?.selo ? 2 : 0 };
}

/** Enquanto a Cesta estiver ativa, o Acerto Garantido de uma Expansão não afeta o portador (p.188). */
export const cestaProtegeDoAcertoGarantido = (sessao) => estadoDaCesta(sessao).ativa;

/** As mãos que o selo da Cesta ocupa: nenhuma, ou as duas. Quem confere "mãos livres" consulta isto. */
export const maosOcupadasPelaCesta = (sessao) => estadoDaCesta(sessao).maos;

/**
 * O INÍCIO DO TURNO de quem tem a Cesta (p.188):
 *   • `mantemSelo`: mantém o selo, ocupando as duas mãos. A Durabilidade não cai por nada além da falha de concentração;
 *   • sem o selo, se `acertoGarantido` (a mesa informa que o portador DEVERIA ter sido atingido), perde 1 de Durabilidade.
 * Chegando a zero a Cesta quebre, o uso se encerra e `recebeAcertoGarantido` avisa que o portador "recebe o efeito do
 * Acerto Garantido instantaneamente". A ficha não aplica esse efeito: é da mesa.
 * Sem Cesta ativa nada acontece e nada falha.
 */
export function iniciaTurnoDaCesta(sessao, { acertoGarantido = false, mantemSelo = false, opId } = {}) {
  if (typeof opId !== "string" || !opId) return semIdentidade(sessao);
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  const a = usoDe(sessao).ativos[USO_CESTA];
  if (!a) return { sessao, aplicado: false, semCesta: true };
  const selo = !!mantemSelo;
  const perde = !selo && !!acertoGarantido;
  const restante = perde ? Math.max(0, inteiro(a.parametros?.durabilidade) - 1) : inteiro(a.parametros?.durabilidade);
  if (restante <= 0) {
    const s = comOperacao(encerraAtivoNaSessao(sessao, USO_CESTA, "quebrou"), { id: opId, tipo: "cesta" });
    return { sessao: s, aplicado: true, quebrou: true, recebeAcertoGarantido: true, durabilidade: 0, selo: false, evento: { tipo: "cesta-quebrada", id: USO_CESTA } };
  }
  const s = comOperacao(comUso(sessao, (u) => ({
    ...u, ativos: { ...u.ativos, [USO_CESTA]: { ...a, parametros: { ...a.parametros, durabilidade: restante, selo } } },
  })), { id: opId, tipo: "cesta" });
  return { sessao: s, aplicado: true, quebrou: false, durabilidade: restante, selo, perdeu: perde, evento: { tipo: "cesta-turno", id: USO_CESTA, durabilidade: restante, selo } };
}
