/* ============================================================
   PRÉ-CARGA SEM EXECUTAR (2026-11-26, fila "Carregamento")
   ============================================================
   Baixa no ocioso os arquivos de uma porta (`portas-regras.js`) com `<link rel="prefetch">`, que guarda no cache do navegador
   e NÃO executa. Duas portas: a Central pré-carrega o `app` (os atalhos dela recarregam a página) e a lista de fichas
   pré-carrega a `ficha` (a Ficha G2 e o motor só desciam no toque do card).

   ⚠ NUNCA `import()` NO OCIOSO. Avaliar o motor custa cerca de 450 ms de CPU no celular e atrasaria um toque, e um `import()` do
   App na Central penduraria nela o CSS global do App (o Vite liga o CSS do pedaço junto do import).

   ⚠ FOLHA, sem import: entra no grafo da Central e no do App sem mudar a ordem de avaliação de nada.

   Fica de fora quem pede economia de dados (`navigator.connection.saveData`), a rota da Sala e navegador sem `prefetch` (o
   Safari). No `npm run dev` não há lista no `index.html`, e nada acontece.

   O `href` do link é o endereço ABSOLUTO de propósito: o ajudante de preload do Vite pula a dependência JS quando acha um
   `link[href="/assets/..."]` com o mesmo texto, e um toque antes de a pré-carga terminar perderia o `modulepreload` paralelo.
   ============================================================ */

const ID_DAS_PORTAS = "fm-portas"; // o mesmo de `portas-regras.js` (que não entra aqui, para esta folha seguir sem import)

let portasLidas;
const jaPedidos = new Set();

/** As listas gravadas pelo build, ou null (dev, ou HTML sem o bloco). Lidas uma vez. */
export function lerPortas(doc = globalThis.document) {
  if (portasLidas !== undefined) return portasLidas;
  try {
    const texto = doc?.getElementById?.(ID_DAS_PORTAS)?.textContent;
    portasLidas = texto ? JSON.parse(texto) : null;
  } catch {
    portasLidas = null;
  }
  return portasLidas;
}

/** Se esta visita pode pré-carregar: sem economia de dados e fora da Sala. */
export function podePreCarregar({ nav = globalThis.navigator, loc = globalThis.location } = {}) {
  if (nav?.connection?.saveData) return false;
  if (/^\/sala(\/|$)/i.test(String(loc?.pathname ?? ""))) return false;
  return true;
}

/** Cria os links de pré-carga de uma porta agora. Pula o que já foi pedido ou baixado. Devolve quantos criou. */
export function preCarregar(id, { doc = globalThis.document, nav = globalThis.navigator, loc = globalThis.location } = {}) {
  const lista = lerPortas(doc)?.[id];
  if (!Array.isArray(lista) || !lista.length || !podePreCarregar({ nav, loc }) || !doc?.head) return 0;
  if (!doc.createElement("link").relList?.supports?.("prefetch")) return 0;
  const base = loc?.href ?? "http://localhost/";
  const baixados = new Set();
  try {
    for (const r of globalThis.performance?.getEntriesByType?.("resource") ?? []) baixados.add(r.name);
    for (const l of doc.querySelectorAll("link[href], script[src]")) baixados.add(l.href || l.src);
  } catch { /* sem a lista: pede tudo, o cache responde o que já tiver */ }
  let criados = 0;
  for (const caminho of lista) {
    const href = new URL(caminho, base).href;
    if (jaPedidos.has(href) || baixados.has(href)) continue;
    jaPedidos.add(href);
    const link = doc.createElement("link");
    link.rel = "prefetch";
    // O mesmo modo do pedido de verdade (o Vite pede módulo e CSS com `crossorigin`), para o cache servir sem baixar de novo.
    link.crossOrigin = "";
    link.href = href;
    doc.head.appendChild(link);
    criados++;
  }
  return criados;
}

/** Pré-carrega a porta quando o navegador ficar ocioso, no máximo em `prazo` ms. Devolve o cancelar (serve de limpeza de efeito). */
export function preCarregarQuandoOcioso(id, { prazo = 2000 } = {}) {
  if (!podePreCarregar() || !lerPortas()?.[id]?.length) return () => {};
  const rodar = () => { preCarregar(id); };
  if (typeof requestIdleCallback === "function") {
    const h = requestIdleCallback(rodar, { timeout: prazo });
    return () => cancelIdleCallback(h);
  }
  const h = setTimeout(rodar, prazo);
  return () => clearTimeout(h);
}
