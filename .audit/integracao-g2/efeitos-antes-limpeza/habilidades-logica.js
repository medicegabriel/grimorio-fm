/* Regras de leitura da aba Habilidades (funções puras), separadas de HabilidadesG2.jsx para o Fast Refresh. */

import { nomeDoControle } from "./pecas-logica";
/* Um controle é CURTO quando cabe na linha: interruptor, passo, ou até
   três opções. O resto mora só na consulta. */
const FALA_DE_PE = /gast\w*\s+(?:\d+\s*)?(?:PE|pontos? de energia)|gastar\s+uma\s+quantidade\s+de\s+(?:PE|pontos? de energia)|\d+\s?PE\b/i;
const COBRADO_PELA_SESSAO = new Set(["invencivelSobOSol"]);

export function ehCurto(c) {
  if (c.partes) return c.partes.length <= 3;
  const e = c.estados[0];
  if (e.tipo === "bool" || e.tipo === "faixa") return true;
  return (e.opcoesVisiveis ?? e.opcoes ?? []).length <= 3;
}

export function naoDescontaPE(c, item) {
  if (c.estados.some((s) => COBRADO_PELA_SESSAO.has(s.id))) return false;
  return c.estados.some((s) => s.custoPE != null) || /\bPE\b/.test(c.rotulo ?? "") || FALA_DE_PE.test(String(item?.texto ?? ""));
}

/* O nome do controle sem repetir o nome do item ("Cobrir-se · PE Gasto" vira
   "PE Gasto") nem a opção que o botão já mostra ("Duelando · Uma Arma, Mão
   Livre" vira "Duelando"). */
export function rotuloCurto(c, item) {
  const nome = nomeDoControle(c);
  if (nome === item?.nome) return null;
  const prefixo = `${item?.nome} · `;
  const sem = nome.startsWith(prefixo) ? nome.slice(prefixo.length) : nome;
  const i = sem.lastIndexOf(" · ");
  if (i > 0) {
    const fim = sem.slice(i + 3);
    const botoes = [...(c.partes ?? []), ...(c.estados[0]?.opcoesVisiveis ?? c.estados[0]?.opcoes ?? []).map((o) => o.label)];
    if (botoes.includes(fim)) return sem.slice(0, i);
  }
  return sem;
}
