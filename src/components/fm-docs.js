// fm-docs.js
// ============================================================
// Fonte única dos PDFs do sistema exibidos pelo FAB (PdfFab).
// ============================================================
// Cada item vira um botão no grupo flutuante e abre o PdfViewerModal.
//   { id, label, file }
//     id    — chave estável (React key)
//     label — texto do botão e título do modal
//     file  — caminho servido pelo Vite (arquivos ficam em public/docs/,
//             então "/docs/arquivo.pdf" resolve para public/docs/arquivo.pdf)
//
// Nomes de arquivo mantidos legíveis (com espaços/acentos); o PdfViewerModal
// aplica encodeURI ao montar a URL, então caracteres especiais funcionam.
// ============================================================

export const PDF_DOCS = [
  {
    id: "grimorio-maldicoes",
    label: "Grimório das Maldições",
    file: "/docs/F&M 2.5.2 - Grimório das Maldições.pdf",
  },
  {
    id: "livro-de-regras",
    label: "Livro de Regras",
    file: "/docs/F&M 2.5.2 - Livro de Regras.pdf",
  },
];
