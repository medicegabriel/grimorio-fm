/* O QUE O JOGADOR FAZ NA SALA (Encontro Unificado, etapa 7c, 2026-11-18).

   As escritas da tela do jogador por cima do cliente da Sala (sala-cliente.js) e do motor do Encontro: pedir Dano e Cura em
   colega ou criatura, aceitar e recusar os pedidos que chegam num personagem dele, Desfazer uma mudança que outra pessoa fez
   nele, e os avisos ao aparelho do Mestre (iniciativa e Encerrar Meu Turno, ver `sala-telas.js`).

   ⚠ O JOGADOR SÓ DERIVA O QUE É DELE. A criatura que ele não pode ler nunca passa por aqui: o pedido leva a intenção (tipo e
   valor, sem delta) e quem mede é o dono do alvo, no aceite.

   ⚠ ACEITAR É O BANCO PRIMEIRO. `responder_pedido` é a conferência final (o Mestre pode ter aceitado na mesma hora, ou o
   Aceitar Sozinho estar ligado): se ele recusa, a Vida do personagem não muda. Só depois de ele aceitar a operação medida vai
   para a sessão do aparelho, e de lá o espelho a sobe. */

/* Os motores entram PRIMEIRO (ver o topo de encontros/modelo.js). */
import { MOTORES } from "../systems/afty/encontros/motores/index";
import { MOTOR, idNovo, criarEncontro } from "../systems/afty/encontros/modelo";
import { aceitarPedido, desfazer as desfazerOperacao, ESTADO_PEDIDO } from "../systems/afty/encontros/operacoes";
import { reaplicarSobre } from "../systems/afty/encontros/usar-encontro";
import { atualizar as atualizarNaLoja } from "../systems/afty/ficha/sessao-loja";
import { deriveAfty } from "../systems/afty/afty-derive";
import { unirAddons, aplicarAddons, epocaAddons } from "../systems/afty/afty-addons";
import { combatenteDaSala } from "./sala-encontro";
import { pedidoDoJogador, sinalDeIniciativa, sinalDeFimDeTurno, rolarFormula } from "./sala-telas";

const motorAfty = MOTORES[MOTOR.AFTY];

/** A operação como o banco a recebe (JSON puro). O autor é reescrito lá. */
const paraASala = (op) => JSON.parse(JSON.stringify(op));

/* ---------- o mundo de um personagem meu ---------- */

function derivadoDe(ficha, sessao) {
  const { pacotes } = unirAddons([ficha]);
  aplicarAddons(pacotes);
  return motorAfty.derivar(ficha, sessao, epocaAddons());
}

/**
 * O Encontro de um combatente só, com o personagem dele ligado à sessão do aparelho: o bastante para o motor medir um pedido
 * e um Desfazer. A sessão e a ficha moram sob o id do combatente, como no Encontro do Mestre (`combatenteDaSala`).
 */
export function mundoDoMeuPersonagem({ resumo, ficha, sessao, pedidos = [], rodada = 1 }) {
  const c = combatenteDaSala(resumo, ficha);
  const encontro = { ...criarEncontro({ nome: "Sala", grupo: null }), rodada, combatentes: [c], pedidos };
  const d = derivadoDe(ficha, sessao);
  return {
    mundo: { encontro, sessoes: { [c.id]: sessao }, fichas: { [c.id]: ficha } },
    combatente: c,
    ctx: {
      derivados: { [c.id]: d },
      derivar: (_c, estado) => { try { return derivadoDe(ficha, estado); } catch { return null; } },
    },
  };
}

/** Aplica a sessão nova na loja do aparelho (o espelho a sobe), sobre a versão de agora e sem apagar nada que chegou no meio. */
function aplicarNaLoja(fichaId, antes, depois) {
  atualizarNaLoja(String(fichaId), (atual) => reaplicarSobre(atual, antes, depois));
}

/* ---------- pedir ---------- */

/** O jogador pede Dano ou Cura num colega ou numa criatura. Vira uma linha de pedido no Registro, e o dono do alvo responde. */
export async function pedirNoAlvo(cliente, { meuCombatente, alvo, tipo, valor }) {
  const conta = cliente.ler().eu?.conta ?? null;
  const pedido = pedidoDoJogador({ id: idNovo("op"), autor: { conta, combatente: meuCombatente }, alvo, tipo, valor });
  await cliente.registrar("pedido", pedido);
  return pedido;
}

/* ---------- responder o pedido de outra pessoa num personagem meu ---------- */

/** O pedido de `pedidosDoJogador().recebidos` como o Encontro o guarda (a intenção, pendente). */
const pedidoNoEncontro = (p) => ({
  ...p.dados, id: p.id, delta: p.dados.delta ?? [], pedido: { estado: ESTADO_PEDIDO.PENDENTE, em: p.dados.quando ?? Date.parse(p.criadoEm) },
});

/**
 * Aceita no aparelho de quem recebeu. `meu`: `{ resumo, ficha, sessao }` do personagem alvo. Mede a operação contra a sessão
 * de agora, pergunta ao banco e só então aplica. Devolve `{ ok, erro?, conflitos?, operacao? }`.
 */
export async function aceitarPedidoRecebido(cliente, { pedido, meu }) {
  const conta = cliente.ler().eu?.conta ?? null;
  const w = mundoDoMeuPersonagem({ ...meu, pedidos: [pedidoNoEncontro(pedido)], rodada: cliente.ler().estado?.rodada ?? 1 });
  const r = aceitarPedido(w.mundo, pedido.id, { conta, papel: "jogador", combatente: null }, w.ctx);
  if (!r.ok) return { ok: false, erro: r.erro ?? "Não Fecha", conflitos: r.conflitos ?? [] };
  try {
    await cliente.responderPedido(pedido.id, true, paraASala(r.operacao));
  } catch (e) {
    return { ok: false, erro: e?.codigo ?? "Falha na Sala" };
  }
  aplicarNaLoja(meu.ficha.id, meu.sessao, r.mundo.sessoes[w.combatente.id]);
  return { ok: true, operacao: r.operacao };
}

export async function recusarPedidoRecebido(cliente, { pedido }) {
  try {
    await cliente.responderPedido(pedido.id, false);
    return { ok: true };
  } catch (e) {
    return { ok: false, erro: e?.codigo ?? "Falha na Sala" };
  }
}

/* ---------- Desfazer ---------- */

/**
 * Desfaz no aparelho de quem sofreu a mudança uma entrada do Histórico da própria Ficha: a regra relativa nos números e o
 * motivo de cada caminho que não fecha são os do Encontro (`operacoes.js`). A operação `desfazer` vai para o Registro.
 */
export async function desfazerNoMeuPersonagem(cliente, { meu, operacaoId }) {
  const conta = cliente.ler().eu?.conta ?? null;
  const w = mundoDoMeuPersonagem({ ...meu, rodada: cliente.ler().estado?.rodada ?? 1 });
  const r = desfazerOperacao(w.mundo, { alvo: w.combatente.id, operacaoId }, { conta, papel: "jogador", combatente: null }, w.ctx);
  if (!r.ok) return { ok: false, erro: r.erro ?? "Não Fecha", conflitos: r.conflitos ?? [] };
  aplicarNaLoja(meu.ficha.id, meu.sessao, r.mundo.sessoes[w.combatente.id]);
  try {
    await cliente.registrar("operacao", paraASala(r.operacao));
  } catch (e) {
    return { ok: true, operacao: r.operacao, aviso: e?.codigo ?? "Falha na Sala" };
  }
  return { ok: true, operacao: r.operacao };
}

/* ---------- os avisos ao Mestre ---------- */

/** O d20 mais o modificador de iniciativa da Ficha. */
export function rolarIniciativaDe(ficha) {
  let mod = 0;
  try { mod = Math.trunc(Number(deriveAfty(ficha)?.iniciativa) || 0); } catch { mod = 0; }
  const r = rolarFormula(`d20${mod >= 0 ? "+" : "-"}${Math.abs(mod)}`, { rotulo: "Iniciativa" });
  return { total: r.rolagem.total, natural: r.rolagem.natural, mod };
}

/** A iniciativa de um personagem meu: rolada (d20 mais o modificador da Ficha) ou o valor escrito pela pessoa. */
export async function enviarIniciativa(cliente, { combatente, ficha, total = null }) {
  let sinal;
  if (total == null) {
    const r = rolarIniciativaDe(ficha);
    sinal = sinalDeIniciativa({ combatente, total: r.total, mod: r.mod, natural: r.natural });
  } else {
    sinal = sinalDeIniciativa({ combatente, total });
  }
  await cliente.registrar("rolagem", sinal);
  return sinal;
}

export async function enviarFimDeTurno(cliente, { combatente, rodada }) {
  const sinal = sinalDeFimDeTurno({ combatente, rodada });
  await cliente.registrar("rolagem", sinal);
  return sinal;
}

export async function enviarChat(cliente, texto) {
  const limpo = String(texto ?? "").trim().slice(0, 1000);
  if (!limpo) return null;
  const dados = { id: idNovo("ch"), texto: limpo };
  await cliente.registrar("chat", dados);
  return dados;
}

/** O Mestre rola de fórmula e o resultado só ele lê. */
export async function rolarEscondido(cliente, texto) {
  const r = rolarFormula(texto, { rotulo: "Rolagem Escondida" });
  if (!r.ok) return r;
  await cliente.registrar("rolagem", { id: idNovo("rol"), rolagem: r.rolagem }, { escondida: true });
  return r;
}

