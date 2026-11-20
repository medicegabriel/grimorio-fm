/* ============================================================
   AS REGRAS DO SERVICE WORKER DO APP ERA DE OURO (etapa E9, 2026-11-20)
   ============================================================
   Puras e sem import. Servem a três lugares: o plugin do `vite.config.js` monta a lista de pré-carga com `listaDePrecache`, o
   worker (`sw-modelo.js`) recebe o `destinoDoPedido` copiado pelo texto da função (por isso ela não pode usar nada de fora dela),
   e o `asserts/t-app-sw.mjs` testa as duas.

   O que entra na pré-carga: a página do app (`/EraDeOuro`, que a Vercel serve com o `index.html`), os pedaços que a Guilda
   alcança a partir da entrada, o CSS e os arquivos deles, o manifesto, os ícones e a Privacidade. O que NUNCA entra: os pedaços
   só da 2.5.2 (o compêndio de 4,5 MB, o criador e o painel de combate de lá, os Modelos), a página da Sala (só com rede), a Ficha
   clássica (saída de emergência), os mapas de código e os PDFs dos Livros.
   ============================================================ */

/** Os módulos cujos pedaços sob demanda a Guilda nunca abre. Casam com o caminho do módulo de fachada do pedaço. */
export const FORA_DO_APP = [
  /src\/components\/CombatTracker\.jsx$/,
  /src\/components\/CreatureBuilder\.jsx$/,
  /src\/components\/TemplateLibrary\.jsx$/,
  /src\/fm-compendium\.js$/,
  /src\/nuvem\/SalaPagina\.jsx$/,
  /src\/systems\/afty\/ficha\/AftyFichaClassica\.jsx$/,
];

/** Os arquivos de `public/` que o app usa. A página entra pelo endereço do app, e não por `/index.html` (a Vercel reescreve). */
export const PUBLICOS_DO_APP = [
  "/EraDeOuro",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/era-de-ouro.svg",
  "/icons/era-de-ouro-180.png",
  "/icons/era-de-ouro-192.png",
  "/icons/era-de-ouro-512.png",
  "/icons/era-de-ouro-mascara-192.png",
  "/icons/era-de-ouro-mascara-512.png",
  "/privacidade.html",
];

/**
 * A lista de pré-carga, a partir do grafo do build: `{ [arquivo]: { modulo, entrada, imports, dinamicos, css, arquivos } }`, com
 * os nomes de arquivo relativos a `dist/` ("assets/index-abc.js"). Anda da entrada pelos imports e pelos imports sob demanda,
 * menos os de `FORA_DO_APP`. Devolve caminhos absolutos, sem repetição, os públicos primeiro.
 */
export function listaDePrecache(grafo = {}, { fora = FORA_DO_APP, publicos = PUBLICOS_DO_APP } = {}) {
  const vistos = new Set();
  const saida = new Set(publicos);
  const proibido = (arquivo) => /\.map$/.test(arquivo) || /^docs\//.test(arquivo);
  const andar = (arquivo) => {
    if (!arquivo || vistos.has(arquivo)) return;
    vistos.add(arquivo);
    const no = grafo[arquivo];
    if (!no) return;
    if (!proibido(arquivo)) saida.add(`/${arquivo}`);
    for (const x of [...(no.css ?? []), ...(no.arquivos ?? [])]) if (!proibido(x)) saida.add(`/${x}`);
    for (const x of no.imports ?? []) andar(x);
    for (const x of no.dinamicos ?? []) {
      const alvo = grafo[x];
      if (alvo && fora.some((re) => re.test(String(alvo.modulo ?? "").replace(/\\/g, "/")))) continue;
      andar(x);
    }
  };
  for (const [arquivo, no] of Object.entries(grafo)) if (no.entrada) andar(arquivo);
  return [...saida];
}

/**
 * O que o worker faz com um pedido: "ignorar" (vai direto para a rede, o worker não toca), "navegacao" (rede primeiro, com prazo, e
 * a página guardada se a rede falhar) ou "arquivo" (o guardado primeiro, e a rede guarda o que faltar).
 *
 * ⚠ AUTOCONTIDA: o plugin copia o TEXTO desta função para dentro do `sw.js`. Nada de fora dela pode ser usado aqui.
 */
export function destinoDoPedido({ metodo, url, origem, modo }) {
  if (metodo !== "GET") return "ignorar";
  let u;
  try { u = new URL(url); } catch { return "ignorar"; }
  if (u.origin !== origem) return "ignorar";
  const p = u.pathname;
  if (p === "/sw.js" || p.startsWith("/_vercel/") || p.startsWith("/docs/")) return "ignorar";
  if (modo === "navigate") return "navegacao";
  if (p.startsWith("/assets/") || p.startsWith("/icons/")) return "arquivo";
  if (p === "/manifest.webmanifest" || p === "/favicon.svg" || p === "/privacidade.html") return "arquivo";
  return "ignorar";
}

/** O nome do cache de uma versão, e se um nome é de cache do app (para limpar os velhos sem tocar em outro cache do site). */
export const nomeDoCache = (versao) => `ouro-${versao}`;
export const ehCacheDoApp = (nome) => /^ouro-/.test(String(nome));

/** O registro só vale em produção, nos hosts do app (nunca no endereço antigo da Vercel) e na rota da Guilda. */
export function podeRegistrar({ producao, hostname, pathname, ligado = true }) {
  if (!ligado || !producao) return false;
  const host = ["fichafm.com.br", "www.fichafm.com.br", "localhost", "127.0.0.1"].includes(hostname);
  return host && /^\/eradeouro\/?$/i.test(String(pathname ?? ""));
}
