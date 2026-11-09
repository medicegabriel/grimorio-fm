// Livro p.175. A reação escreve só a carga e devolve ao provedor a mesma instância de dano.
import { dadosAbsorcaoElemental, ESTADO_ABSORCAO_ELEMENTAL, ID_ABSORCAO_ELEMENTAL as ID } from "../afty-conteudo-auras";
import { estadoAbsorcaoElemental, tiposElementais } from "./ficha-conteudo-absorcao-elemental";
import { aptidaoDeConteudoDisponivel, impedimentoParaAgirConteudo } from "./ficha-conteudo-acesso";
import { armaProximoAtaque } from "./ficha-combate-eventos";
import { reciboProspectivo } from "./ficha-cx3-recibo-prospectivo";
import { avaliaUso, usa } from "./ficha-uso";
import { comOperacao, jaAplicada, usoDe } from "./ficha-uso-estado";

function descricao(tipoDano) {
  return {
    id: ID, nome: "Absorção Elemental", acao: "reacao", emCombate: true,
    acesso: impedimentoParaAgirConteudo, duracao: { ate: "descanso" },
    efeitos: [{ tipo: "estado", id: ESTADO_ABSORCAO_ELEMENTAL, estado: estadoAbsorcaoElemental(), valor: tipoDano, desliga: false }],
  };
}

export function tiposParaAbsorcaoProspectiva(sessao, derived, recibo, mesa, pedido = {}) {
  if (!reciboProspectivo(recibo, mesa, "dano") || !aptidaoDeConteudoDisponivel(derived, ID)
    || !Array.isArray(recibo.danos)
    || !dadosAbsorcaoElemental(derived.aptidao?.efetivo?.au)
    || (derived.combate?.concentrarAura ?? []).includes(ID)
    || usoDe(sessao).pendencias.some((p) => p.id === ID) || jaAplicada(sessao, marca(recibo, mesa))) return [];
  const elementais = new Set(tiposElementais().map((t) => t.id));
  return [...new Set(recibo.danos.filter((d) => d?.modo === "dano" && d.calculo?.final > 0 && elementais.has(d.tipo))
    .map((d) => d.tipo))].filter((tipo) => avaliaUso(sessao, derived, descricao(tipo), { ...pedido, registraAcao: true }).ok);
}

const marca = (recibo, mesa) => JSON.stringify([ID, recibo.id, mesa.alvoId]);

export function absorveAntesDoDano(sessao, derived, { recibo, mesa, tipoDano } = {}, pedido = {}) {
  const recusa = (erro) => ({ sessao, aplicado: false, erro });
  if (!tiposParaAbsorcaoProspectiva(sessao, derived, recibo, mesa, pedido).includes(tipoDano)) {
    return recusa("Absorção Elemental Indisponível para Este Dano");
  }
  const uso = usa(sessao, derived, descricao(tipoDano), { ...pedido, registraAcao: true });
  if (!uso.aplicado) return uso;
  const carga = armaProximoAtaque(uso.sessao, {
    id: ID, usoId: ID, nome: "Absorção Elemental", estado: ESTADO_ABSORCAO_ELEMENTAL,
    elegivel: { qualquer: ["arma", "desarmado"], exceto: ["feitico"] }, consome: "declaracao",
  }, { opId: `${pedido.opId}:carga` });
  if (!carga.aplicado) return recusa(carga.erro);
  return { ...uso, sessao: comOperacao(carga.sessao, { id: marca(recibo, mesa), tipo: "absorcao" }), recibo };
}
