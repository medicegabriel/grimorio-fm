// Livro p.176, 177 e 179. Reutiliza CL1 e a aplicação de Estímulo já existente.
import { aptidaoDeConteudoDisponivel as tem, impedimentoParaAgirConteudo } from "./ficha-conteudo-acesso";
import { armaProximoAtaque } from "./ficha-combate-eventos";
import { usaAptidaoPessoal } from "./ficha-conteudo-combate";
import { reciboProspectivo } from "./ficha-cx3-recibo-prospectivo";
import { usa } from "./ficha-uso";
import { usoDe } from "./ficha-uso-estado";

const GOLPE = "golpe_com_aura";
const recusa = (sessao, erro, extra) => ({ sessao, aplicado: false, erro, ...extra });
const RESISTENCIAS = {
  aura_chamativa: "vontade", aura_macabra: "vontade", aura_lacerante: "fortitude", enganacao_projetada: "astucia",
};

export function armaGolpeComAura(sessao, derived, { aura, consome } = {}, pedido = {}) {
  if (!tem(derived, GOLPE) || !tem(derived, aura) || !Object.hasOwn(RESISTENCIAS, aura)
    || (derived.combate?.concentrarAura ?? []).includes(aura)) return recusa(sessao, "Aura Indisponível para o Golpe");
  if (!["acerto", "declaracao"].includes(consome)) return recusa(sessao, "Falta Confirmar o Consumo do Golpe", { pendente: "consumo" });
  const r = usa(sessao, derived, { id: GOLPE, nome: "Golpe com Aura", acesso: impedimentoParaAgirConteudo, emCombate: true,
    cobranca: "confirmada", custo: { pe: 1 }, duracao: { ate: "cena" }, parametros: [{ id: "aura", tipo: "opcao", opcoes: [aura] }],
  }, { ...pedido, parametros: { aura } });
  if (!r.aplicado) return r;
  const armada = armaProximoAtaque(r.sessao, { id: GOLPE, usoId: GOLPE, nome: "Golpe com Aura",
    elegivel: { qualquer: ["arma", "desarmado"], exceto: ["feitico"] }, consome }, { opId: `${pedido.opId}:carga` });
  return armada.aplicado ? { ...r, sessao: armada.sessao } : recusa(sessao, armada.erro);
}

/** Ler antes do consumo de CL1. O provedor publica o TR após confirmar o acerto. */
export function trDoGolpeComAura(sessao, derived, { recibo, mesa } = {}) {
  const aura = usoDe(sessao).ativos[GOLPE]?.parametros?.aura;
  if (!Object.hasOwn(RESISTENCIAS, aura) || !tem(derived, GOLPE) || !tem(derived, aura)
    || (derived.combate?.concentrarAura ?? []).includes(aura)
    || !reciboProspectivo(recibo, mesa, "ataque") || recibo.acertou !== true
    || !["arma", "desarmado"].includes(recibo.categoria)) return null;
  const au = derived.aptidao?.efetivo?.au ?? 0;
  return { ataqueId: recibo.id, alvoId: mesa.alvoId, aura, cd: derived.cd + au, resistencia: RESISTENCIAS[aura],
    ...(aura === "aura_lacerante" ? { dano: { dados: au, faces: au >= 5 ? 10 : au >= 3 ? 8 : 6,
      fixo: derived.modTecnica, tipoDano: "energetico", momento: "apos", multiplica: false } } : {}) };
}

export function estimulaAcaoConfirmada(sessao, derived, { recibo, mesa, modo, pe } = {}) {
  if (!reciboProspectivo(recibo, mesa, "acao")) return recusa(sessao, "Falta Ação para Estímulo");
  const periciaFisica = ["acrobacia", "atletismo"].includes(recibo.pericia);
  const valida = modo === "teste" ? periciaFisica && ["comum", "oposto"].includes(recibo.teste)
    : modo === "pulo" ? recibo.movimento === "pular"
      : modo === "movimento" ? recibo.acao === "movimento"
        : modo === "empurrao" && periciaFisica && ["empurrar", "desarmar"].includes(recibo.manobra);
  if (!valida) return recusa(sessao, "Ação Incompatível com o Estímulo");
  return usaAptidaoPessoal(sessao, derived, { id: "estimulo_muscular", modo, pe, descontarPE: true },
    { opId: JSON.stringify(["estimulo", recibo.id, modo, mesa.origemId]) });
}
