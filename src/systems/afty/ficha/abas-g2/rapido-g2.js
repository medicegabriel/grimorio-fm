/* O RÁPIDO DA PRÉVIA DAS ABAS DO G2 (2026-10-21): os favoritos resolvidos nas DUAS listas, habilidades (`conteudoDaFicha`) e inventário
   (`equipamentosDaFicha`). A estrela do inventário sempre gravou `equipamento:<uid>` em `sessao.favoritos`, e nada a mostrava. Ordem de quem
   fixou, primeiro destino que casar, chave sem destino ignorada na LEITURA e nunca apagada da sessão. Folha pura. A clássica não usa isto. */
export function itensDoRapidoG2(favoritos, itens, equipamentos) {
  const porChave = new Map();
  for (const i of [...(equipamentos ?? []), ...(itens ?? [])]) porChave.set(i.chave, i);
  return (Array.isArray(favoritos) ? favoritos : []).map((c) => porChave.get(c)).filter(Boolean);
}
