/* ============================================================
   A LISTA DE FICHAS DA GUILDA NO CELULAR (app Era de Ouro, etapa E8, 2026-11-20)
   ============================================================
   A regra pura da lista do celular, sem React e sem import, para o assert carregar. A tela é `ListaDeFichas.jsx`.

   A vista é a MESMA do Dashboard (`useDashboardView`: todas, sem pasta ou uma pasta), guardada pelo App, então trocar de aparelho
   ou de largura não perde a pasta escolhida. A busca ignora caixa e acento ("joao" acha "João").
   ============================================================ */

/** As abas da barra de baixo e a tela do App de cada uma. A Sala só existe com a nuvem ligada. */
export const ABAS_DA_CASCA = [
  { id: "fichas", tela: "dashboard", rotulo: "Fichas" },
  { id: "encontros", tela: "encounters", rotulo: "Encontros" },
  { id: "sala", tela: "sala", rotulo: "Sala", soComNuvem: true },
  { id: "mais", tela: "mais", rotulo: "Mais" },
];

export const abasDaCasca = (nuvem) => ABAS_DA_CASCA.filter((a) => nuvem || !a.soComNuvem);

/** A aba de uma tela do App, ou `null` (o criador, a Ficha e a luta não têm barra de baixo). */
export const abaDaTela = (nomeDaTela) => ABAS_DA_CASCA.find((a) => a.tela === nomeDaTela)?.id ?? null;

/**
 * Como trocar de aba no histórico: saindo de Fichas, empilha (o Voltar volta para Fichas); entre as outras, substitui (o Voltar
 * de qualquer aba cai em Fichas, e não percorre as abas visitadas); para Fichas, volta.
 */
export function trocaDeAba(de, para) {
  if (de === para) return "nada";
  if (para === "fichas") return "voltar";
  return de === "fichas" ? "ir" : "substituir";
}

const semAcento = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** As fichas da vista, na ordem da lista, filtradas pela busca. As Criaturas Base (`isBuiltIn`) não entram na Guilda. */
export function fichasDaVista(fichas = [], vista = { type: "all" }, busca = "") {
  const termo = semAcento(busca);
  return fichas.filter((f) => {
    if (!f || f.isBuiltIn) return false;
    if (vista?.type === "unfiled" && f.folderId) return false;
    if (vista?.type === "folder" && f.folderId !== vista.folderId) return false;
    return !termo || semAcento(f.name).includes(termo);
  });
}

/** As escolhas de pasta com a contagem de cada uma: Todas, Sem Pasta (só se houver pasta) e as pastas na ordem delas. */
export function pastasComContagem(fichas = [], pastas = []) {
  const proprias = fichas.filter((f) => f && !f.isBuiltIn);
  const conta = (id) => proprias.filter((f) => f.folderId === id).length;
  if (!pastas.length) return [{ vista: { type: "all", folderId: null }, rotulo: "Todas", n: proprias.length }];
  return [
    { vista: { type: "all", folderId: null }, rotulo: "Todas", n: proprias.length },
    { vista: { type: "unfiled", folderId: null }, rotulo: "Sem Pasta", n: proprias.filter((f) => !f.folderId).length },
    ...pastas.map((p) => ({ vista: { type: "folder", folderId: p.id }, rotulo: p.name, n: conta(p.id) })),
  ];
}

export const mesmaVista = (a, b) => (a?.type ?? "all") === (b?.type ?? "all") && (a?.type !== "folder" || a?.folderId === b?.folderId);

/** O que o cartão mostra: nome, a linha de baixo (Nível do personagem, ND e tipo da criatura) e o retrato. */
export function resumoDaFicha(f) {
  const personagem = f?.rulesVersion === "player";
  const nd = f?.core?.nd;
  return {
    nome: f?.name || "Sem Nome",
    tipo: personagem ? "Personagem" : "Criatura",
    linha: nd == null || nd === "" ? (personagem ? "Personagem" : "Criatura") : `${personagem ? "Nível" : "ND"} ${nd}`,
    retrato: f?.portraitUrl || null,
    foco: f?.portraitFocus ?? null,
  };
}

/** O tamanho de um arquivo ou do espaço usado, em KB, MB ou GB com vírgula. */
export function tamanhoLegivel(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return null;
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1).replace(".", ",")} GB`;
}
