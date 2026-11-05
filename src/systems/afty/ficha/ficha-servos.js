import { gastaPe, peTempTotal } from "./ficha-sessao";
import { estadoDominioInato } from "../afty-dominio-inato";

export function preparaCustoServo(desc, sessao) {
  if (!desc || desc.tipo !== "dano") return desc;
  const custo = Math.max(0, Number(desc.custoServo ?? desc.linhaArma?.custoServo) || 0);
  if (!custo) return desc;
  if (custo > Math.max(0, sessao?.peAtual ?? 0) + peTempTotal(sessao)) return null;
  return { ...desc, custoServo: custo };
}
export const pagaCustoServo = (sessao, desc) => desc?.custoServo > 0 ? gastaPe(sessao, desc.custoServo) : sessao;

export function criarDominioInato(sessao, derived) {
  const d = derived?.dominioInato;
  if (!d?.valido || estadoDominioInato(sessao.dominioInato).criado
    || Math.max(0, sessao.peAtual ?? 0) + peTempTotal(sessao) < d.custoPE) return sessao;
  return { ...gastaPe(sessao, d.custoPE), dominioInato: { criado: true, dentro: true, dias: 0, local: d.local } };
}
export function diaDeConcentracao(sessao, derived) {
  const estado = estadoDominioInato(sessao.dominioInato);
  if (!derived?.dominioInato?.valido || !estado.criado) return sessao;
  return { ...sessao, dominioInato: { ...estado, dias: estado.dias + 1 } };
}


export function usarMovimentoDoServo(sessao, derived) {
  const limite = derived?.servosGuerra?.acoesMovimento ?? 0;
  const usados = Math.max(0, Math.floor(Number(sessao.servosMovimentosUsados) || 0));
  if (!sessao.combate?.ativo || usados >= limite) return sessao;
  return { ...sessao, servosMovimentosUsados: usados + 1 };
}
