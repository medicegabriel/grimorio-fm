/* As Novidades que aparecem abertas na página inicial (2026-11-27). Entram no pacote da Central, então ficam só as duas
   versões mais novas: ao publicar uma versão, ponha-a no topo daqui e passe a mais antiga para o topo de
   `notas-anteriores.js`. Publicar só mudança confirmada, escrita para quem usa o site. `data` em AAAA-MM-DD, da mais
   nova para a mais antiga. */
export const NOVIDADES_RECENTES = [
  {
    versao: "0.14",
    titulo: "Novidades na Página Inicial",
    notas: [
      { data: "2026-11-27", texto: "Agora você acompanha na página inicial o que mudou e o que foi corrigido no site, com a data de cada atualização.", onde: { rotulo: "Novidades", href: "#novidades" } },
    ],
  },
  {
    versao: "0.13.1",
    titulo: "Carregamento Mais Rápido",
    notas: [
      { data: "2026-11-26", texto: "As telas abrem mais rápido, mostram o formato da página enquanto carregam e permitem tentar de novo se algo falhar." },
    ],
  },
];
