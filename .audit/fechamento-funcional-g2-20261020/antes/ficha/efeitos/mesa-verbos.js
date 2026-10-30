/**
 * ============================================================
 * VERBOS DE MESA DA ABA EFEITOS
 * ============================================================
 * Nasceram no protótipo v2 (`mesa.js`), e aqui operam sobre a SESSÃO da Ficha, vista como uma "mesa" por `sessao-g2.js`
 * (`daSessao`/`paraSessao`). Cada verbo recebe a mesa e devolve outra. Quem mexe na SESSÃO é sempre um verbo puro do motor
 * (`ficha-sessao.js`): dano, cura, casca, Alma, gasto de PE, estado, rodada. O que é da camada dos Efeitos, e só dela, é:
 *
 *   1. o EVENTO do histórico, com horário real (`ts`) e a rodada em que aconteceu;
 *   2. o DESFAZER DELIMITADO de um gasto de PE (o "Estornar PE"): devolve só o que o gasto tirou;
 *   3. a ATIVAÇÃO: o registro do gasto que o estorno consulta (`ativacoes`).
 *
 * Nada disto é regra nova. Onde a regra não existe (sustentação, reposição, duração, desfazer de estado), o verbo NÃO decide:
 * registra o limite.
 * ============================================================
 */
import * as Sessao from "../ficha-sessao";
import { uid } from "./util";

export const MAX_EVENTOS = 80;

const apara = (s, derived) => Sessao.aparaSessao(s, derived);
const comSessao = (mesa, s, derived) => ({ ...mesa, sessao: apara(s, derived) });

/** Um evento novo no topo do histórico, com o horário REAL dele (`ts`). Evento sem `ts` é legado, e o histórico nunca inventa o horário. */
export const comEvento = (mesa, ev) => ({
  ...mesa,
  eventos: [{ id: uid(), ts: Date.now(), rodada: mesa.sessao.rodada, ...ev }, ...mesa.eventos].slice(0, MAX_EVENTOS),
});

export const energiaDisponivel = (s) => Math.max(0, s.peAtual) + Sessao.peTempTotal(s);

/* O que um gasto tirou de onde: da casca, por fonte, e da reserva. */
function quemPagou(antes, depois) {
  return Sessao.divisaoDoPagamento(antes, depois);
}
const somaCasca = (casca) => Object.values(casca ?? {}).reduce((a, b) => a + b, 0);

/* ---------------- dano, cura e Alma ---------------- */
/** Dano ou cura na Vida (ou na Alma), pelos verbos do motor da Ficha: o dano come a casca antes da Vida, e na Alma desce a Vida do jogador junto.
 *  Devolve também `mudou` (Vida, casca e Alma), que o indicador do recurso mostra por um instante. */
export function danoOuCura(mesa, { valor, tipo, naAlma }, derived) {
  const n = Math.max(0, Math.trunc(Number(valor) || 0));
  if (!n) return { mesa };
  const antes = mesa.sessao;
  let depois;
  if (naAlma) depois = tipo === "dano" ? Sessao.aplicaDanoNaAlma(antes, n, derived) : Sessao.curaAlma(antes, n, derived);
  else depois = tipo === "dano" ? Sessao.aplicaDano(antes, n, derived) : Sessao.aplicaCura(antes, n, derived.hp);
  const m = comSessao(mesa, depois, derived);
  const d = m.sessao;
  const mudou = {
    vida: d.hpAtual - antes.hpAtual,
    casca: Sessao.pvTempTotal(d) - Sessao.pvTempTotal(antes),
    alma: d.almaAtual - antes.almaAtual,
  };
  return { mesa: comEvento(m, { tipo, valor: n, naAlma: !!naAlma, mudou }), mudou };
}

/* ---------------- Feitiço usado pelo catálogo ---------------- */
/** Usar um Feitiço pelo catálogo: cobra o PE dele (a casca primeiro) e registra a ativação, que o Estornar PE devolve. A Vida que o Feitiço
 *  paga ao ser rolado continua sendo cobrada na rolagem da aba Ações, como sempre foi. */
export function usarFeitico(mesa, f, derived) {
  const custo = Math.max(0, Math.trunc(Number(f.custoPE) || 0));
  const antes = mesa.sessao;
  if (energiaDisponivel(antes) < custo) return { mesa, erro: `Faltam ${custo - energiaDisponivel(antes)} PE` };
  const depois = custo > 0 ? Sessao.gastaPe(antes, custo) : antes;
  const pago = quemPagou(antes, depois);
  const id = uid();
  const ativacao = { id, tipo: "feitico", fonteChave: `feitico:${f.id}`, nome: f.nome, custo, pago, rodada: antes.rodada, desfeita: false, criadaEm: Date.now() };
  let m = comSessao(mesa, depois, derived);
  m = { ...m, ativacoes: { ...m.ativacoes, [id]: ativacao } };
  m = comEvento(m, { tipo: "ativacao", ativacaoId: id, nome: f.nome, custo, pago });
  return { mesa: m, ativacaoId: id };
}

/* ---------------- gasto manual de Energia ---------------- */
export function gastoManual(mesa, valor, motivo, derived) {
  const quanto = Math.max(0, Math.trunc(Number(valor) || 0));
  if (!quanto) return { mesa };
  const antes = mesa.sessao;
  if (energiaDisponivel(antes) < quanto) return { mesa, erro: `Faltam ${quanto - energiaDisponivel(antes)} PE` };
  const depois = Sessao.gastaPe(antes, quanto);
  const pago = quemPagou(antes, depois);
  const id = uid();
  const ativacao = { id, tipo: "gasto", nome: motivo || "Gasto de Energia", custo: quanto, pago, rodada: antes.rodada, desfeita: false, criadaEm: Date.now() };
  let m = comSessao(mesa, depois, derived);
  m = { ...m, ativacoes: { ...m.ativacoes, [id]: ativacao } };
  return { mesa: comEvento(m, { tipo: "gasto", ativacaoId: id, nome: ativacao.nome, custo: quanto, pago }) };
}

/* ============================================================
   DESFAZER DELIMITADO (ESTORNAR PE)
   ============================================================
   Só o GASTO de PE de um gasto manual ou de uma ativação. Devolve o que aquele evento tirou, como evento novo, sem restaurar cópia
   de sessão:
   - dano, cura e rolagens de depois ficam como estão, e o estado, os usos, o PV Temporário e as concessões também;
   - a reserva volta, até o máximo de agora;
   - a casca só volta na MESMA rodada. Virada a rodada, a fonte foi renovada ou encerrada pelo motor, e o que saiu dela NÃO vira PE
     permanente;
   - desfazer duas vezes não faz nada.
   Ativação de estado (a cobrança que o motor faz ao ligar o Invencível sob o Sol) não se desfaz aqui: o motor liga rodada e Exaustão a
   ela, e reverter isso seria regra nova. */
export function podeDesfazer(mesa, ativacaoId) {
  const at = mesa.ativacoes[ativacaoId];
  if (!at) return { ok: false, motivo: "Evento não encontrado" };
  if (at.desfeita) return { ok: false, motivo: "Já desfeito" };
  if (at.tipo === "estado") return { ok: false, motivo: "Desfazer de estado não está definido" };
  return { ok: true };
}

export function desfazer(mesa, ativacaoId, derived) {
  const at = mesa.ativacoes[ativacaoId];
  const pode = podeDesfazer(mesa, ativacaoId);
  if (!pode.ok) return { mesa, erro: pode.motivo };
  const s = mesa.sessao;
  const mesmaRodada = at.rodada === s.rodada;
  const peMax = Math.max(0, derived?.pe ?? 0);
  const reservaVolta = Math.min(at.pago.reserva, Math.max(0, peMax - s.peAtual));
  const fontes = { ...(s.peTempFontes ?? {}) };
  const cascaVolta = {};
  if (mesmaRodada) {
    for (const [nome, v] of Object.entries(at.pago.casca ?? {})) {
      fontes[nome] = (fontes[nome] ?? 0) + v;
      cascaVolta[nome] = v;
    }
  }
  const nova = { ...s, peAtual: s.peAtual + reservaVolta, peTempFontes: fontes };
  const limites = [];
  if (reservaVolta < at.pago.reserva) limites.push(`${at.pago.reserva - reservaVolta} PE não voltaram: a Energia já está no máximo`);
  if (!mesmaRodada && somaCasca(at.pago.casca) > 0) {
    limites.push(`${somaCasca(at.pago.casca)} PE Temporário não voltaram: a rodada virou e a fonte foi renovada ou encerrada`);
  }
  let m = comSessao(mesa, nova, derived);
  m = { ...m, ativacoes: { ...m.ativacoes, [ativacaoId]: { ...at, desfeita: true, devolvido: { reserva: reservaVolta, casca: cascaVolta }, limites } } };
  return {
    mesa: comEvento(m, { tipo: "desfazer", ativacaoId, nome: at.nome, devolvido: reservaVolta + somaCasca(cascaVolta), limites }),
  };
}

/* ---------------- estados ---------------- */
/** Um estado pelo verbo do motor (`alteraEstadoCombate`). A cobrança que o MOTOR já faz (o Invencível sob o Sol) é registrada como
 *  ativação de estado, e não desfazível. */
export function alterarEstado(mesa, estado, valor, derived) {
  const antes = mesa.sessao;
  const depois = Sessao.alteraEstadoCombate(antes, estado, valor, derived);
  if (depois === antes) return { mesa, recusado: true };
  let m = comSessao(mesa, depois, derived);
  const pago = quemPagou(antes, depois);
  const gasto = pago.reserva + somaCasca(pago.casca);
  if (gasto > 0) {
    const id = uid();
    m = { ...m, ativacoes: { ...m.ativacoes, [id]: { id, tipo: "estado", nome: estado.label, custo: gasto, pago, rodada: antes.rodada, desfeita: false, criadaEm: Date.now() } } };
    m = comEvento(m, { tipo: "ativacao", ativacaoId: id, nome: estado.label, custo: gasto, pago, estado: true });
  }
  return { mesa: m, recusado: false };
}

/* ---------------- rodada ---------------- */
/**
 * A virada de rodada REAL (`Sessao.proximaRodada`) e a nota dela, lida do REGISTRO que o próprio verbo grava no ponto em que cada
 * coisa acontece. A nota NUNCA estima o gasto pela diferença líquida dos saldos: renovar 4 PE de casca e pagar 4 de manutenção deixa
 * saldo zero e o histórico diria "nada cobrado".
 *   cobrado   `[{ nome, valor, casca, reserva }]`  o que a virada pagou, e de onde saiu
 *   renovou   `[{ chave, de, para }]`              a casca que a virada entregou
 *   casca     o total que a virada entregou
 *   encerrou  `[{ id, nome, motivo }]`             o que a virada desligou
 *   exaustao  a Exaustão que a virada entregou
 */
function notaDaVirada({ registro, expirou, antes, depois }) {
  const pagou = registro?.pagou ?? [];
  return {
    rodada: depois.rodada,
    expirou: expirou.map((x) => ({ nome: x.nome, tipo: x.canal ? "Buff de Mesa" : "Condição" })),
    cobrado: pagou.map((p) => ({ nome: p.nome, valor: p.valor, casca: somaCasca(p.casca), reserva: p.reserva ?? 0 })),
    renovou: (registro?.renovou ?? []).map((r) => ({ chave: r.chave, de: r.de, para: r.para })),
    casca: (registro?.renovou ?? []).reduce((n, r) => n + Math.max(0, r.para - r.de), 0),
    encerrou: registro?.encerrou ?? [],
    exaustao: Math.max(0, (registro?.exaustaoGanha ?? 0) || (depois.exaustao ?? 0) - (antes.exaustao ?? 0)),
  };
}

export function avancarRodada(mesa, derived, opcoes = {}) {
  const antes = mesa.sessao;
  const { sessao: depois, expirou, registro } = Sessao.proximaRodada(antes, derived, opcoes);
  const m = comSessao(mesa, depois, derived);
  const nota = notaDaVirada({ registro, expirou, antes, depois: m.sessao });
  return { mesa: comEvento(m, { tipo: "rodada", nota }), nota };
}
