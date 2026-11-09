// Livro p.76. Pilha por alvo vinculada a uma ativação própria no Encontro.
import { jaAplicada } from "./ficha-uso-estado";
import { posturaAtivaConteudo } from "./ficha-conteudo-posturas";

export function ativacaoDevastacao(sessao) {
  const c = sessao?.combate;
  if (!c?.ativo || (c.postura !== "devastacao" && c.postura2 !== "devastacao")) return null;
  const id = sessao.uso?.ativos?.cmb_assumir_postura?.parametros?.operacaoId;
  return typeof id === "string" && id ? id : null;
}

export function devastacaoContra(sessao, derived, ataque, alvoId) {
  const ativacaoId = ativacaoDevastacao(sessao);
  if (!ativacaoId || !alvoId || ataque?.contextoTurno?.devastacao !== ativacaoId || !posturaAtivaConteudo(sessao, derived, "devastacao")) return null;
  const teto = Math.max(0, Math.trunc(derived.maestria));
  const anterior = sessao.log.find((r) => r.devastacao?.ativacaoId === ativacaoId && r.ataqueId
    && jaAplicada(sessao, "ataque-confirmado:" + r.ataqueId));
  const pilha = anterior?.ataque?.alvo?.id === alvoId
    ? Math.min(teto, Math.max(0, Math.trunc(Number(anterior.devastacao.pilha) || 0))) : 0;
  return { ativacaoId, pilha, teto, acerto: pilha, ignoraRD: 2 * pilha };
}
