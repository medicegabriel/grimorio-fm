/* ============================================================
   G2 · REGISTRAR USO: O PLANO (E2, 2026-10-15)
   ============================================================
   O que registrar um uso vai fazer, lido do MOTOR, antes e de novo ao clicar.
   Nada aqui escreve na sessão. A operação é `registraUso` (modelo.jsx).
     USOS      o contador que o motor já tem (`derived.usosHabilidades`: o
               máximo, a recarga e a chave na sessão). A sessão guarda os
               GASTOS. Sem contador no motor (Ataque Extra), não há uso a gastar.
     CUSTO     o PE do estudo (`custoPE`, em exemplos.js), SEMPRE à mão: quem
               desconta é o jogador, e a ficha não cobra.
     BLOQUEIOS "Faltam N PE", "Sem Usos Restantes" e, no Surto de Ação, "Já Usado
               Nesta Rodada" (a rodada que o próprio verbo do motor anotou).
   ============================================================ */
import { Sessao } from "./ponte";
import { energiaDisponivel } from "./mesa-verbos";

const inteiro = (v) => Math.max(0, Math.trunc(Number(v) || 0));

export function planoDoUso({ o, m }) {
  const itemId = o.item?.id ?? null;
  const u = itemId ? m.derived.usosHabilidades?.[itemId] ?? null : null;
  const gastos = u ? Sessao.usosGastosDe(m.sessao, u.chave) : null;
  const custoPE = inteiro(o.exemplo?.custoPE);
  const disponivel = energiaDisponivel(m.sessao);
  const bloqueios = [];
  if (custoPE > disponivel) bloqueios.push(`Faltam ${custoPE - disponivel} PE`);
  if (u && gastos >= u.max) bloqueios.push("Sem Usos Restantes");
  if (u && itemId === "cmb_surto_de_acao" && m.sessao.especializacaoSessao?.surtoAcaoRodada === m.sessao.rodada) bloqueios.push("Já Usado Nesta Rodada");
  return {
    itemId, custoPE, bloqueios,
    usos: u ? { max: u.max, gastos, restam: Math.max(0, u.max - gastos), recarga: u.recarga } : null,
  };
}
