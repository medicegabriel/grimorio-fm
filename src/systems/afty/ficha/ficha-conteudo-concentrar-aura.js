// Livro p.174-177. Acionamento das parcelas passivas identificadas na fonte.
import { getAptidao } from "../afty-aptidoes";
import { usa } from "./ficha-uso";
import { aptidaoDeConteudoDisponivel, impedimentoParaAgirConteudo } from "./ficha-conteudo-acesso";

const ID = "concentrar_aura";
const AURAS_PASSIVAS = [
  "afinidade_ampliada", "aura_chamativa", "aura_controlada", "aura_de_contencao", "aura_do_bastiao",
  "aura_drenadora", "aura_elemental", "aura_elemental_reforcada", "aura_inofensiva", "aura_macabra",
  "aura_macica", "aura_movedica", "aura_reforcada",
];

export function opcoesConcentrarAura(derived) {
  if (!aptidaoDeConteudoDisponivel(derived, ID)) return [];
  return AURAS_PASSIVAS.filter((id) => aptidaoDeConteudoDisponivel(derived, id))
    .map((id) => ({ id, nome: getAptidao(id).nome }));
}

export const limiteConcentrarAura = (derived) => 1 + Math.max(0, Math.trunc(derived.aptidao.efetivo.au));

export function usaConcentrarAura(sessao, derived, entrada = {}, pedido = {}) {
  const recusa = (erro) => ({ sessao, aplicado: false, erro });
  const { auras, emSeuTurno } = entrada;
  const especializacao = sessao.especializacaoSessao;
  if (emSeuTurno !== true || (especializacao?.turnoEncerrado != null && especializacao.turnoEncerrado === especializacao.turno)) {
    return recusa("Concentrar Aura Exige Seu Turno");
  }
  const opcoes = opcoesConcentrarAura(derived);
  if (!Array.isArray(auras) || !auras.length || auras.length > limiteConcentrarAura(derived)
    || new Set(auras).size !== auras.length || !auras.every((id) => opcoes.some((a) => a.id === id))) {
    return recusa("Selecione Aptidões de Aura Passivas Disponíveis");
  }
  return usa(sessao, derived, { id: ID, nome: "Concentrar Aura", emCombate: true,
    acesso: impedimentoParaAgirConteudo, acao: "livre", proibidoCom: ["Atordoado", "Inconsciente", "Paralisado", "Indefeso"],
    duracao: { rodadas: 1 }, efeitos: [{ tipo: "estado", id: "concentrarAura", valor: [...auras], desliga: [] }],
  }, { ...pedido, registraAcao: true });
}
