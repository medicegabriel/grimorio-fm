/**
 * ============================================================
 * O ENDEREÇO DAS BIBLIOTECAS E DOS ENCONTROS
 * ============================================================
 * FOLHA: zero imports. O `App.jsx` lê daqui a rota e a tela do caminho, e a pilha
 * de telas (`src/celular/usar-pilha-de-telas.js`, etapa E2 do app) grava o
 * caminho de cada tela pelo `caminhoDe`.
 *
 *   /Criatura              Grimório 2.5.2
 *   /Jogador               fichas de personagem
 *   /Afty, /EraDeOuro e /Eclesiastes são entradas por link direto.
 *   Cada prefixo aceita /Encontros e /Encontros/<id>.
 *   /Encontros e /Player continuam aceitos como endereços antigos.
 *   A Central de Jogo em / é aberta pelo main.jsx.
 *
 * O caminho da Sala (`/Sala/<código>`) não passa por aqui: `lerCaminho` devolve
 * null para ele, como para qualquer caminho fora do Grimório.
 *
 * Do rework dos Encontros (etapa 1, 2026-11-18) ficam aqui também a volta da
 * Sala para onde ela foi aberta e a chave de aparelho do visual novo.
 * ============================================================
 */

const PREFIXO = {
  afty: "/Afty",
  player: "/Jogador",
  eradeouro: "/EraDeOuro",
  eclesiastes: "/Eclesiastes",
};

const CAMINHO = /^(?:\/(criatura|jogador|player|afty|eradeouro|eclesiastes))?(\/encontros(?:\/([^/?#]+))?)?\/?$/i;

function decodificar(id) {
  try { return decodeURIComponent(id); } catch { return id; }
}

/** Identifica a biblioteca e a tela a partir do caminho, incluindo os links antigos. */
export function lerCaminho(pathname) {
  const m = CAMINHO.exec(pathname);
  if (!m) return null;
  const prefixo = m[1]?.toLowerCase();
  const rota = prefixo === "jogador" ? "player" : prefixo === "criatura" ? null : prefixo ?? null;
  const encounterId = m[3] ? decodificar(m[3]) : null;
  const name = encounterId ? "encounter" : m[2] ? "encounters" : "dashboard";
  return { rota, tela: { name, creatureId: null, encounterId } };
}

export function caminhoDe(rota, tela) {
  const base = PREFIXO[rota] ?? "/Criatura";
  if (tela?.name === "encounters") return `${base}/Encontros`;
  if (tela?.name === "encounter" && tela.encounterId) return `${base}/Encontros/${encodeURIComponent(tela.encounterId)}`;
  return base;
}

/* ---------- a volta da Sala (rework, etapa 1) ---------- */

const CHAVE_ORIGEM = "sala_origem_v1";

/**
 * Antes de ir para `/Sala/<código>`, guarda de onde a pessoa saiu (na aba, pelo
 * `sessionStorage`, que sobrevive à recarga da mesma aba). Só caminho das
 * rotas é guardado, já na forma canônica, nunca endereço de fora.
 */
export function guardarOrigemDaSala(codigo, caminho) {
  const lido = lerCaminho(caminho);
  if (!codigo || !lido) return;
  const canonico = caminho === "/" ? "/" : caminhoDe(lido.rota, lido.tela);
  try { sessionStorage.setItem(CHAVE_ORIGEM, JSON.stringify({ codigo: String(codigo).toUpperCase(), caminho: canonico })); } catch { /* sem armazenamento: a volta usa o padrão */ }
}

/** O caminho guardado para esta Sala, ou null (quem entrou por um link não tem origem). */
export function lerOrigemDaSala(codigo) {
  try {
    const salvo = JSON.parse(sessionStorage.getItem(CHAVE_ORIGEM) || "null");
    if (!salvo || String(salvo.codigo) !== String(codigo || "").toUpperCase()) return null;
    if (salvo.caminho === "/") return "/";
    const lido = lerCaminho(salvo.caminho);
    return lido ? caminhoDe(lido.rota, lido.tela) : null;
  } catch {
    return null;
  }
}

/* ---------- a chave de aparelho do visual novo (rework, etapas 3 a 7) ---------- */

/**
 * As etapas 3 a 7 do rework (o visual do Dashboard na moldura dos Encontros) ficam
 * atrás desta chave até a etapa 8. Com `localStorage.dev_moldura_encontros = "site"`
 * o `<html>` ganha `data-moldura-encontros="site"`, e o CSS da moldura nova só vale
 * debaixo desse atributo. Sem a chave, nada muda para quem usa o site.
 */
export const CHAVE_MOLDURA = "dev_moldura_encontros";

export function ligarMolduraDoAparelho() {
  if (typeof document === "undefined") return;
  try {
    if (localStorage.getItem(CHAVE_MOLDURA) === "site") document.documentElement.dataset.molduraEncontros = "site";
  } catch { /* sem armazenamento: fica a moldura de hoje */ }
}
