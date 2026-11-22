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
  if (tela.name === "encounters") return `${base}/Encontros`;
  if (tela.name === "encounter" && tela.encounterId) return `${base}/Encontros/${encodeURIComponent(tela.encounterId)}`;
  return base;
}
