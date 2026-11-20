/* O app de celular, etapa E9 (2026-11-20): o service worker (sem internet depois de uma visita).

   1. O destino de cada pedido (`destinoDoPedido`): o que o worker ignora, o que é navegação e o que é arquivo guardado.
   2. A lista de pré-carga (`listaDePrecache`) sobre um grafo de mentira: anda pelos imports, pula os pedaços fora do app, leva o
      CSS e os arquivos, e nunca mapas nem PDFs.
   3. O texto do worker (`textoDoWorker`): as marcas trocadas e um JavaScript que compila. O worker de desligamento.
   4. Quem pode registrar (`podeRegistrar`), os caches do app, e as ligações (vercel.json, vite.config, App, registro). */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const url = (p) => new URL(p, import.meta.url);
const lê = (p) => readFileSync(url(p), "utf8");
const R = await import(url("../src/celular/sw-regras.js").href);
const P = await import(url("../src/celular/sw-plugin.js").href);

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ---------- 1. o destino ---------- */
const O = "https://fichafm.com.br";
const d = (url, extra = {}) => R.destinoDoPedido({ metodo: "GET", url, origem: O, modo: "cors", ...extra });
t("navegação na Guilda", d(`${O}/EraDeOuro`, { modo: "navigate" }), "navegacao");
t("arquivos do app", [d(`${O}/assets/index-a1.js`), d(`${O}/assets/ficha-b2.css`), d(`${O}/icons/era-de-ouro-192.png`), d(`${O}/manifest.webmanifest`), d(`${O}/privacidade.html`)],
  ["arquivo", "arquivo", "arquivo", "arquivo", "arquivo"]);
t("o que passa direto", [
  d(`${O}/assets/x.js`, { metodo: "POST" }),
  d("https://abc.supabase.co/rest/v1/fichas"),
  d(`${O}/_vercel/insights/script.js`),
  d(`${O}/sw.js`),
  d(`${O}/docs/F&M%202.5.2%20-%20Livro%20de%20Regras.pdf`),
  d(`${O}/docs/livro.pdf`, { modo: "navigate" }),
  d(`${O}/api/qualquer`),
  d("isto não é url"),
], ["ignorar", "ignorar", "ignorar", "ignorar", "ignorar", "ignorar", "ignorar", "ignorar"]);
t("a regra é autocontida (o worker leva o texto dela)", (() => { const f = new Function(`return (${R.destinoDoPedido.toString()})`)(); return f({ metodo: "GET", url: `${O}/assets/a.js`, origem: O, modo: "cors" }); })(), "arquivo");

/* ---------- 2. a pré-carga ---------- */
const grafo = {
  "assets/index.js": { modulo: "/r/index.html", entrada: true, imports: ["assets/react.js"], dinamicos: ["assets/G2.js", "assets/Compendio.js", "assets/Sala.js", "assets/Criador252.js"], css: ["assets/index.css"], arquivos: ["assets/fonte.woff2"] },
  "assets/react.js": { modulo: "/r/node_modules/react/index.js", imports: [], dinamicos: [] },
  "assets/G2.js": { modulo: "/r/src/systems/afty/ficha/AftyFichaG2.jsx", imports: ["assets/react.js", "assets/pecas.js"], dinamicos: [], css: ["assets/G2.css"] },
  "assets/pecas.js": { modulo: null, imports: [], dinamicos: ["assets/Classica.js"] },
  "assets/Classica.js": { modulo: "C:\\r\\src\\systems\\afty\\ficha\\AftyFichaClassica.jsx", imports: [], dinamicos: [] },
  "assets/Compendio.js": { modulo: "/r/src/fm-compendium.js", imports: ["assets/enorme.js"], dinamicos: [] },
  "assets/enorme.js": { modulo: null, imports: [], dinamicos: [] },
  "assets/Sala.js": { modulo: "/r/src/nuvem/SalaPagina.jsx", imports: [], dinamicos: [] },
  "assets/Criador252.js": { modulo: "/r/src/components/CreatureBuilder.jsx", imports: [], dinamicos: [] },
  "assets/solto.js": { modulo: null, imports: [], dinamicos: [] },
  "assets/index.js.map": { modulo: null, entrada: true, imports: [], dinamicos: [] },
};
const lista = R.listaDePrecache(grafo);
t("os públicos primeiro, com a página do app", lista.slice(0, R.PUBLICOS_DO_APP.length), R.PUBLICOS_DO_APP);
t("o que a Guilda alcança, com CSS e arquivos", lista.slice(R.PUBLICOS_DO_APP.length), [
  "/assets/index.js", "/assets/index.css", "/assets/fonte.woff2", "/assets/react.js", "/assets/G2.js", "/assets/G2.css", "/assets/pecas.js",
]);
t("nunca a 2.5.2, a Sala, a clássica, mapas ou PDFs", lista.filter((x) => /Compendio|enorme|Sala|Criador252|Classica|solto|\.map$|docs\//.test(x)), []);
t("sem repetição", lista.length, new Set(lista).size);
t("a página do app é o endereço, e não /index.html", [lista.includes("/EraDeOuro"), lista.includes("/index.html")], [true, false]);

/* ---------- 3. o texto do worker ---------- */
const modelo = lê("../src/celular/sw-modelo.js");
const texto = P.textoDoWorker({ modelo, versao: "abc1234", precache: ["/EraDeOuro", "/assets/a.js"] });
t("as marcas trocadas", [texto.includes('const VERSAO = "abc1234";'), texto.includes('const PRECACHE = ["/EraDeOuro","/assets/a.js"];'), texto.includes("function destinoDoPedido"), /__VERSAO__|__PRECACHE__|__DESTINO__/.test(texto)], [true, true, true, false]);
t("o worker compila", (() => { try { new Function(texto); return true; } catch (e) { return String(e); } })(), true);
t("só se ativa a pedido (o toque em Atualizar ou a página da mesma versão)", [(modelo.match(/skipWaiting\(\)/g) ?? []).length, /if \(tipo === "ativar"\) self\.skipWaiting\(\);/.test(modelo)], [1, true]);
t("rede primeiro na navegação, com 3 s", [modelo.includes("const ESPERA_DA_REDE_MS = 3000;"), /async function navegar[\s\S]*fetch\(pedido\)[\s\S]*caches\.match\(PAGINA/.test(modelo)], [true, true]);
t("o guardado casa mesmo com o Vary: Origin", modelo.includes("cache.match(pedido, { ignoreVary: true })"), true);
t("só apaga caches do app", modelo.includes('nomes.filter((n) => /^ouro-/.test(n) && n !== CACHE)'), true);
t("o desligamento apaga os caches do app e sai", [P.SW_DESLIGADO.includes("self.registration.unregister()"), P.SW_DESLIGADO.includes("/^ouro-/"), P.SW_DESLIGADO.includes('versao: "desligado"')], [true, true, true]);
t("o desligamento compila", (() => { try { new Function(P.SW_DESLIGADO); return true; } catch (e) { return String(e); } })(), true);
/* Nunca o cabeçalho Clear-Site-Data (apagaria as fichas do localStorage). O comentário que proíbe ele pode citar o nome. */
const semComentario = (x) => x.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
t("nunca Clear-Site-Data", [
  JSON.parse(lê("../vercel.json")).headers.some((h) => h.headers.some((x) => /clear-site-data/i.test(x.key))),
  [lê("../src/celular/sw-plugin.js"), modelo].some((x) => /clear-site-data/i.test(semComentario(x))),
], [false, false]);

/* ---------- 4. registro e ligações ---------- */
const pode = (o) => R.podeRegistrar({ producao: true, hostname: "fichafm.com.br", pathname: "/EraDeOuro", ...o });
t("quem registra", [
  pode({}), pode({ hostname: "www.fichafm.com.br", pathname: "/eradeouro/" }), pode({ hostname: "localhost" }),
  pode({ producao: false }), pode({ hostname: "grimorio-fm.vercel.app" }), pode({ pathname: "/Player" }), pode({ pathname: "/Sala/K7QX2M" }), pode({ ligado: false }),
], [true, true, true, false, false, false, false, false]);
t("os caches do app", [R.nomeDoCache("abc"), R.ehCacheDoApp("ouro-abc"), R.ehCacheDoApp("outro-cache")], ["ouro-abc", true, false]);

const VERCEL = JSON.parse(lê("../vercel.json"));
t("o /sw.js nunca fica guardado", VERCEL.headers.find((h) => h.source === "/sw.js")?.headers?.[0]?.value, "no-cache, no-store, must-revalidate");
const VITE = lê("../vite.config.js");
t("o plugin no build, com o desligamento por variável", [VITE.includes("pluginDoServiceWorker({ versao: VERSAO, desligado: process.env.VITE_SW_DESLIGADO === '1' })"), VITE.includes("process.env.VITE_FM_VERSAO = VERSAO")], [true, true]);
t("o plugin grava depois do bundle (sem os pedaços só de CSS)", [lê("../src/celular/sw-plugin.js").includes("writeBundle(opcoes, bundle)"), lê("../src/celular/sw-plugin.js").includes('apply: "build"')], [true, true]);
const APP = lê("../src/App.jsx");
t("o App registra só onde pode, e desliga com SW_LIGADO", [APP.includes("podeRegistrar({ producao: import.meta.env.PROD, hostname: location.hostname, pathname: location.pathname })"), APP.includes("if (!SW_LIGADO) { desligarServiceWorker(); return undefined; }")], [true, true]);
t("o Atualizar sobe a nuvem com prazo antes de trocar", APP.includes("antes: () => Promise.race([nuvemAtiva ? enviarNuvem() : null, new Promise((r) => setTimeout(r, 3000))])"), true);
const REG = lê("../src/celular/registrar-sw.js");
t("o registro: escopo da Guilda, sem cache do arquivo, e sem aviso para worker mudo", [REG.includes('register("/sw.js", { scope: "/EraDeOuro", updateViaCache: "none" })'), REG.includes('if (!dele || dele === "desligado") return;'), REG.includes("if (dele === versao) worker.postMessage({ tipo: \"ativar\" });")], [true, true, true]);
t("o aviso não recarrega sozinho", /location\.reload\(\)/.test(lê("../src/celular/AvisoNovaVersao.jsx")), false);
t("sem travessão", [lê("../src/celular/sw-regras.js"), modelo, lê("../src/celular/sw-plugin.js"), REG, lê("../src/celular/AvisoNovaVersao.jsx")].some((s) => new RegExp("\\u2014").test(s)), false);

if (bad.length) {
  console.log(bad.join("\n"));
  console.log(`\n${bad.length} FALHARAM, ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
