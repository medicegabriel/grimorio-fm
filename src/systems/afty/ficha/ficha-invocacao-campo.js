/* CX6: A CONTA DA AÇÃO INVOCAR (Livro p.256 e p.302).
 *
 * "Por padrão, ela permite trazer duas Invocações ao combate" e "Por padrão, você pode invocar duas invocações por ação". O Controlador
 * muda o número (`invocarPorAcao`, do `resolveControleInvocacoes`). A ficha NÃO bloqueia (autor, 2026-11-06, "Só avisar"): o roster do
 * Controlador é de referência desde 2026-08-15, e quem passa do número vê o aviso âmbar na Aba de Invocações.
 *
 * FOLHA, zero imports: a Aba de Invocações a importa, e ela não pode puxar a sessão para dentro de um componente de tela.
 *
 * As entradas da rodada saem da `ultimaEntrada` de cada linha da sessão (`{ via, rodada, custo }`, gravada por `entraEmCampo`). Conta quem
 * entrou na rodada ATUAL, no combate. Fora dele (rodada 0) não existe "por ação" para medir, e a entrada do início do combate
 * (`inicioCombate`, a Autonomia paga) não é uma ação Invocar.
 */

const inteiro = (v) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : 0;
};

/** Quantas linhas entraram em campo na rodada `rodada` por uma ação Invocar. `linhas` é qualquer lista de linhas da sessão. */
export function contaEntradasNaRodada(linhas, rodada) {
  const r = inteiro(rodada);
  if (r <= 0) return 0;
  return (Array.isArray(linhas) ? linhas : []).filter((l) => {
    const e = l?.ultimaEntrada;
    return e && inteiro(e.rodada) === r && e.via !== "inicioCombate" && l.estado === "ativa";
  }).length;
}

/**
 * O resumo para a tela e para o teste: quantas entraram, quantas a ação traz e se passou.
 * `acoesNecessarias` diz quantas ações Invocar essas entradas pedem, o que a mesa confere contra as ações do turno.
 */
export function resumoDasEntradas(linhas, rodada, porAcao) {
  const entradas = contaEntradasNaRodada(linhas, rodada);
  const por = Math.max(1, inteiro(porAcao) || 1);
  return { entradas, porAcao: por, excede: entradas > por, acoesNecessarias: entradas ? Math.ceil(entradas / por) : 0 };
}
