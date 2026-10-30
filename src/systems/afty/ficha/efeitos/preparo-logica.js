/* Regras de leitura da Preparação (funções puras), separadas de PreparoG2.jsx para o Fast Refresh. */

import { maxDe } from "./efeitos-dados";
import { custoDe, preparoDe, rotuloDaFaixa } from "./g2-dados";
export const inteiro = (v) => Math.max(0, Math.trunc(Number(v) || 0));

/** O que a ficha diz deste controle: o estado, o rótulo, o teto e o custo de cada passo. */
export function faixaDoPiloto(gr, derived) {
  const c = gr.controles[0];
  const e = c.estados[0];
  const max = inteiro(maxDe(e, derived));
  const passos = Array.from({ length: max }, (_, i) => i + 1);
  return { c, e, max, passos, rotulo: rotuloDaFaixa(e, gr), custo: (v) => inteiro(custoDe(e, v)) };
}

/** Sem nada a ajustar: ligar sem mais nada, ou uma opção só (Golpe com Aura com uma aura). O filho que é uma ESCOLHA ao
 *  utilizar (o Espírito Incansável, `escolhaNoUso`) não é ajuste do efeito ativo: a escolha se faz na Preparação. */
export const semAjuste = (o) => {
  const gr = o.grupo;
  const escolha = preparoDe(o)?.escolhaNoUso;
  const filhos = gr.filhos.filter((f) => f.id !== escolha);
  return gr.controles.length === 1 && gr.controles[0].estados.length === 1 && !filhos.length
    && (gr.controles[0].estados[0].tipo === "bool"
      || (gr.controles[0].estados[0].tipo === "opcao" && (gr.controles[0].estados[0].opcoesVisiveis ?? gr.controles[0].estados[0].opcoes ?? []).length <= 1));
};
