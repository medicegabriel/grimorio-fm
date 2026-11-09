/**
 * ============================================================
 * EVENTOS DE ATAQUE, CONSUMO NO PRÓXIMO ATAQUE ELEGÍVEL E SEQUÊNCIA DE ATAQUES (CL1, 2026-10-29)
 * ============================================================
 * Dois lados de um ataque, cada um na sessão do seu dono:
 *
 *   `registraAtaqueRealizado`  na sessão de QUEM ATACOU. Gera os eventos do ataque (ataque, acerto ou erro, crítico,
 *                              desastre) e CONSOME o que estava armado para "o próximo ataque elegível".
 *   `registraAtaqueRecebido`   na sessão de QUEM FOI ATACADO. Conta o ataque na Sequência de Ataques (p.310): a cada 2
 *                              ataques recebidos a Defesa cai 1, até 5, e a sequência fecha quando o turno do alvo chega.
 *
 * Os eventos de turno e rodada já existem como transições (`iniciaTurnoFicha`, `encerraTurnoFicha`,
 * `proximaRodada`) e mexem no mesmo estado (`ficha-uso-estado.js`): ações voltam, a sequência fecha, o que expirava
 * "até o próximo turno" cai. O abate (PV a zero) sai de `aplicaDanoRecebido` (`abateu`). Quem escuta eventos para ligar
 * conteúdo (Renovação pelo Sangue, Eliminar e Continuar) lê as listas `eventos` destes retornos, sem sessão nova.
 *
 * ⚠ ARMAR NÃO É COBRAR. `armaProximoAtaque` só registra o que fica pendente e até quando. O custo do que foi armado
 * (Canalizar em Golpe gasta PE ao armar) é do contrato de uso (`ficha-uso.js`), com a política de cobrança dele.
 *
 * ⚠ ERRAR NÃO CONSOME o que pede acerto: "errar um ataque não consome esse uso" (Canalizar em Golpe, p.178). Cada
 * pendência declara `consome: "acerto"` (padrão, só um acerto a consome) ou `"declaracao"` (qualquer ataque
 * elegível a consome). A elegibilidade é por categoria: `qualquer` (alguma das categorias do ataque), `exceto` (nenhuma
 * delas) e `contraAlvo` (só contra aquele alvo, como Mirar). Uma pendência com `expira` cai no momento dito.
 *
 * ⚠ A SEQUÊNCIA CONTA ATAQUES REALIZADOS, acertando ou errando (leitura literal de "para cada 2 ataques realizados
 * na sequência", p.310). A penalidade vai por um Buff de Mesa de id fixo que o derive já lê, então a Defesa do
 * alvo no `derived` dele já a traz, e não há canal nem variável nova no cálculo.
 * ============================================================
 */
import { consomeEstadoCombate } from "./ficha-sessao";
import {
  usoDe, comUso, jaAplicada, comOperacao, comSequencia, encerraAtivoNaSessao, penalidadeDaSequencia, TETO_PENDENCIAS,
} from "./ficha-uso-estado";

export const EVENTOS_DE_COMBATE = ["ataque", "acerto", "erro", "critico", "desastre", "abate", "dano", "turnoInicio", "turnoFim", "rodada"];

const semIdentidade = (sessao) => ({ sessao, aplicado: false, erro: "Sem Identidade da Operação", codigo: "sem-opid" });
const lista = (v) => (Array.isArray(v) ? v : []);

/** As categorias do ataque, de `categorias` ou de `categoria`. Ex.: `["arma", "corpo"]`, `["desarmado", "corpo"]`, `["feitico"]`. */
const categoriasDe = (ataque) => [...lista(ataque?.categorias), ...(typeof ataque?.categoria === "string" ? [ataque.categoria] : [])];

/** A pendência vale para ESTE ataque? Puro. */
export function pendenciaServe(p, ataque) {
  const cats = categoriasDe(ataque);
  const { qualquer, exceto, contraAlvo } = p.elegivel;
  if (qualquer.length && !cats.some((c) => qualquer.includes(c))) return false;
  if (cats.some((c) => exceto.includes(c))) return false;
  if (contraAlvo && (ataque?.alvo?.id ?? null) !== contraAlvo) return false;
  return true;
}

/** As pendências que um ataque assim consumiria, para a tela avisar antes de rolar. Puro. */
export const elegiveisParaAtaque = (sessao, ataque) => usoDe(sessao).pendencias.filter((p) => pendenciaServe(p, ataque));

/**
 * Deixa algo armado para o próximo ataque elegível.
 *   p  { id, usoId?, nome, elegivel: { qualquer?, exceto?, contraAlvo? }, consome?: "acerto"|"declaracao",
 *        expira?: "fimDoTurno"|"inicioDoProximoTurno"|"rodada"|"descanso", estado? }
 * `usoId` liga ao uso ativo que o originou (consumir o encerra e desfaz os efeitos dele) e `estado` é a chave de `combate`
 * que o consumo desliga. Recusa o id repetido e passar do teto.
 */
export function armaProximoAtaque(sessao, p, { opId } = {}) {
  if (typeof opId !== "string" || !opId) return semIdentidade(sessao);
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  if (!p || typeof p.id !== "string" || !p.id) return { sessao, aplicado: false, erro: "Pendência Sem Identificação", codigo: "pendencia-sem-id" };
  const uso = usoDe(sessao);
  if (uso.pendencias.some((x) => x.id === p.id)) return { sessao, aplicado: false, erro: "Já Armado", codigo: "ja-armado" };
  if (uso.pendencias.length >= TETO_PENDENCIAS) return { sessao, aplicado: false, erro: "Pendências Demais", codigo: "pendencias-demais" };
  const nova = { ...p, elegivel: { qualquer: [], exceto: [], contraAlvo: null, ...(p.elegivel ?? {}) }, desde: Math.max(0, Math.trunc(Number(sessao?.rodada) || 0)) };
  const s = comOperacao(comUso(sessao, (u) => ({ ...u, pendencias: [...u.pendencias, nova] })), { id: opId, tipo: "arma" });
  return { sessao: s, aplicado: true, evento: { tipo: "arma", nome: p.nome ?? p.id, pendenciaId: p.id } };
}

/** Os eventos de um ataque resolvido (`resolveAtaque`), na ordem em que acontecem. */
export function eventosDoAtaque(ataque) {
  const eventos = [{ tipo: "ataque" }];
  if (ataque?.acertou === true) eventos.push({ tipo: "acerto" });
  else if (ataque?.acertou === false) eventos.push({ tipo: "erro" });
  if (ataque?.critico) eventos.push({ tipo: "critico" });
  if (ataque?.desastre) eventos.push({ tipo: "desastre" });
  return eventos;
}

/**
 * O ataque foi feito, na sessão de quem atacou. Consome as pendências elegíveis (a de `acerto` só se acertou) e desliga o
 * que elas ligaram. `ataque` é o resultado de `resolveAtaque` mais `categorias` e `alvo: { id }`.
 * Retorno: `{ sessao, aplicado, eventos, consumidas }`. Repetir o `opId` devolve `repetida`.
 */
export function registraAtaqueRealizado(sessao, derived, ataque, { opId } = {}) {
  if (typeof opId !== "string" || !opId) return semIdentidade(sessao);
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  let s = sessao;
  const consumidas = [];
  for (const p of usoDe(sessao).pendencias) {
    if (!pendenciaServe(p, ataque)) continue;
    if (p.consome === "acerto" && ataque?.acertou !== true) continue;
    consumidas.push(p.id);
    if (p.usoId) s = encerraAtivoNaSessao(s, p.usoId, "consumido");
    if (p.estado) s = consomeEstadoCombate(s, p.estado);
  }
  if (consumidas.length) s = comUso(s, (u) => ({ ...u, pendencias: u.pendencias.filter((p) => !consumidas.includes(p.id)) }));
  s = comOperacao(s, { id: opId, tipo: "ataque-feito" });
  return { sessao: s, aplicado: true, eventos: eventosDoAtaque(ataque), consumidas };
}

/**
 * O ataque foi recebido, na sessão do alvo. Conta na Sequência de Ataques e atualiza a penalidade de Defesa.
 * Retorno: `{ sessao, aplicado, sequencia: { ataques, penalidade }, eventos }`.
 */
export function registraAtaqueRecebido(sessao, derived, ataque, { opId } = {}) {
  if (typeof opId !== "string" || !opId) return semIdentidade(sessao);
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  const ataques = usoDe(sessao).sequencia.ataques + 1;
  const s = comOperacao(comSequencia(sessao, ataques), { id: opId, tipo: "ataque-recebido" });
  return { sessao: s, aplicado: true, sequencia: { ataques, penalidade: penalidadeDaSequencia(ataques) }, eventos: eventosDoAtaque(ataque).map((e) => ({ ...e, recebido: true })) };
}

/** Quantos ataques a sequência de agora soma e quanto vale em Defesa, para a tela. */
export function sequenciaDe(sessao) {
  const ataques = usoDe(sessao).sequencia.ataques;
  return { ataques, penalidade: penalidadeDaSequencia(ataques) };
}
