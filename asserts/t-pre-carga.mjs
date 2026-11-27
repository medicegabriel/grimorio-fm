/* A pré-carga sem executar e a abertura em paralelo (2026-11-26, fila "Carregamento" de docs/a-fazer.md).

   1. As portas (`portas-regras.js`) sobre um grafo de mentira: só imports estáticos e o CSS deles, menos a entrada e as portas
      de antes, sem mapas, e o bloco de dados no `index.html`.
   2. O ajudante (`pre-carga.js`) com um `document` de mentira: cria `<link rel="prefetch">` com o endereço absoluto e o
      `crossorigin`, não repete, pula o que já desceu, e não faz nada com economia de dados, na Sala, sem a lista ou sem `prefetch`.
   3. As duas folhas sem import, e as ligações: o `main.jsx` dispara a tela antes da nuvem, o App pré-carrega a Ficha só com a
      lista na tela, a Central pré-carrega o App, e nenhum dos dois usa `import()` para isso. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const url = (p) => new URL(p, import.meta.url);
const lê = (p) => readFileSync(url(p), "utf8").replace(/\r\n/g, "\n");
const R = await import(url("../src/celular/portas-regras.js").href);

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ---------- 1. as portas ---------- */
const no = (modulo, { entrada = false, imports = [], dinamicos = [], css = [] } = {}) => ({ modulo, entrada, imports, dinamicos, css, arquivos: [] });
const GRAFO = {
  "assets/index-a.js": no("C:\\x\\index.html", { entrada: true, imports: ["assets/react-a.js"], dinamicos: ["assets/App-a.js", "assets/Central-a.js"], css: ["assets/index-a.css"] }),
  "assets/react-a.js": no(null),
  "assets/Central-a.js": no("C:\\x\\src\\home\\CentralDeJogo.jsx", { imports: ["assets/comum-a.js", "assets/react-a.js"] }),
  "assets/comum-a.js": no(null, { css: ["assets/comum-a.css"] }),
  "assets/App-a.js": no("C:\\x\\src\\App.jsx", { imports: ["assets/comum-a.js", "assets/react-a.js", "assets/icone-a.js"], dinamicos: ["assets/Criador-a.js"], css: ["assets/App-a.css", "assets/App-a.js.map"] }),
  "assets/icone-a.js": no(null),
  "assets/Criador-a.js": no("C:\\x\\src\\systems\\afty\\AftyCreatureBuilder.jsx", { imports: ["assets/afty-derive-a.js"] }),
  "assets/AftyFichaG2-a.js": no("C:\\x\\src\\systems\\afty\\ficha\\AftyFichaG2.jsx", { imports: ["assets/afty-derive-a.js", "assets/icone-a.js", "assets/react-a.js"], dinamicos: ["assets/Aba-a.js"], css: ["assets/AftyFichaG2-a.css"] }),
  "assets/afty-derive-a.js": no(null, { imports: ["assets/react-a.js"] }),
  "assets/Aba-a.js": no(null),
};
const P = R.portasDoGrafo(GRAFO);
t("a porta do App: o pedaço, o CSS e os imports estáticos, sem a entrada nem o mapa", P.app,
  ["/assets/App-a.js", "/assets/App-a.css", "/assets/comum-a.js", "/assets/comum-a.css", "/assets/icone-a.js"]);
t("o import() de dentro do App (o criador) não entra", P.app.some((x) => /Criador/.test(x)), false);
t("a porta da Ficha: com o motor, sem o que o App já trouxe nem o import() de dentro", P.ficha,
  ["/assets/AftyFichaG2-a.js", "/assets/AftyFichaG2-a.css", "/assets/afty-derive-a.js"]);
t("porta sem pedaço no build sai vazia", R.portasDoGrafo({ "assets/index-a.js": GRAFO["assets/index-a.js"] }), { app: [], ficha: [] });
t("o caminho do módulo com barra invertida casa", R.pedacoDoModulo(GRAFO, /src\/App\.jsx$/), "assets/App-a.js");
t("as portas e a ordem", R.PORTAS_DE_PRE_CARGA.map((p) => [p.id, p.depoisDe]), [["app", []], ["ficha", ["app"]]]);

const HTML = "<html><head>\n    <title>x</title>\n  </head><body></body></html>";
const comBloco = R.htmlComPortas(HTML, { app: ["/assets/a.js"], ficha: [] });
t("o bloco é dado, antes do </head>", comBloco.includes('<script type="application/json" id="fm-portas">{"app":["/assets/a.js"],"ficha":[]}</script>\n  </head>'), true);
t("um build de novo troca o bloco, não acumula", (R.htmlComPortas(comBloco, { app: [], ficha: [] }).match(/fm-portas/g) ?? []).length, 1);
t("o JSON não fecha o script", R.blocoDasPortas({ app: ["</script>"] }).includes("</script>\"]"), false);

/* ---------- 2. o ajudante ---------- */
function mundo({ portas = { app: ["/assets/a.js", "/assets/b.css"], ficha: ["/assets/f.js"] }, prefetch = true, existentes = [] } = {}) {
  const head = { filhos: [], appendChild(l) { this.filhos.push(l); } };
  const doc = {
    head,
    getElementById: (id) => (id === "fm-portas" && portas ? { textContent: JSON.stringify(portas) } : null),
    createElement: () => ({ relList: { supports: (r) => prefetch && r === "prefetch" } }),
    querySelectorAll: () => existentes.map((href) => ({ href })),
  };
  return { doc, head };
}
const carregar = async () => import(`${url("../src/celular/pre-carga.js").href}?v=${Math.random()}`);
const loc = { href: "https://fichafm.com.br/Jogador", pathname: "/Jogador" };
{
  const C = await carregar();
  const { doc, head } = mundo({ existentes: ["https://fichafm.com.br/assets/b.css"] });
  t("cria os links que faltam", C.preCarregar("app", { doc, nav: {}, loc }), 1);
  t("prefetch com endereço absoluto e crossorigin", head.filhos.map((l) => [l.rel, l.href, l.crossOrigin]),
    [["prefetch", "https://fichafm.com.br/assets/a.js", ""]]);
  t("não pede duas vezes", C.preCarregar("app", { doc, nav: {}, loc }), 0);
  t("a outra porta pede a dela", C.preCarregar("ficha", { doc, nav: {}, loc }), 1);
}
{
  const C = await carregar();
  const { doc } = mundo();
  t("economia de dados não pré-carrega", C.preCarregar("app", { doc, nav: { connection: { saveData: true } }, loc }), 0);
  t("na Sala não pré-carrega", C.preCarregar("app", { doc, nav: {}, loc: { href: "https://fichafm.com.br/Sala/ABC123", pathname: "/Sala/ABC123" } }), 0);
  t("podePreCarregar", [
    C.podePreCarregar({ nav: {}, loc }), C.podePreCarregar({ nav: { connection: { saveData: true } }, loc }),
    C.podePreCarregar({ nav: {}, loc: { pathname: "/sala/nova" } }), C.podePreCarregar({ nav: {}, loc: { pathname: "/Salas" } }),
  ], [true, false, false, true]);
}
{
  const C = await carregar();
  t("navegador sem prefetch não pré-carrega", C.preCarregar("app", { doc: mundo({ prefetch: false }).doc, nav: {}, loc }), 0);
}
{
  const C = await carregar();
  t("sem a lista (o npm run dev) não faz nada", C.preCarregar("app", { doc: mundo({ portas: null }).doc, nav: {}, loc }), 0);
}

/* ---------- 3. as folhas e as ligações ---------- */
const semComentario = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
for (const folha of ["../src/celular/pre-carga.js", "../src/celular/portas-regras.js"]) {
  t(`${folha.replace("../src/", "")} é folha (sem import)`, /^\s*import\s/m.test(semComentario(lê(folha))), false);
}
t("a pré-carga nunca executa (sem import())", /import\(/.test(semComentario(lê("../src/celular/pre-carga.js"))), false);
t("o id do bloco é o mesmo nas duas folhas", lê("../src/celular/pre-carga.js").includes(`const ID_DAS_PORTAS = "${R.ID_DAS_PORTAS}"`), true);

const MAIN = semComentario(lê("../src/main.jsx"));
const disparo = MAIN.indexOf("let telaChegando = sessao ? null : pedirTela()");
t("o main pede só a tela escolhida", MAIN.includes("const pedirTela = central ? pedirCentral : pedirApp"), true);
/* Um `import()` por função: num ternário de dois imports o build junta as dependências das duas telas num preload só, e o `/`
   pré-ligava o App inteiro com o CSS global dele (visto no build de 2026-11-26). */
t("cada tela no seu import, fora de ternário", [
  MAIN.includes("const pedirCentral = () => import('./home/CentralDeJogo.jsx')"),
  MAIN.includes("const pedirApp = () => import('./App.jsx')"),
  /\?\s*import\(|:\s*import\(/.test(MAIN),
], [true, true, false]);
t("sem sessão, antes da primeira espera da nuvem", disparo > 0 && disparo < MAIN.indexOf("await "), true);
t("com sessão, depois do cliente da nuvem e antes das leituras", (() => {
  const cli = MAIN.indexOf("await Promise.race([cliente()");
  const depois = MAIN.indexOf("telaChegando = pedirTela()", cli);
  return cli > disparo && depois > cli && depois < MAIN.indexOf("await receberFichasSeVieram()");
})(), true);
t("a nuvem é pedida antes da tela, e só quando precisa", [
  MAIN.indexOf("import('./nuvem/nuvem-mudanca.js')") > 0 && MAIN.indexOf("import('./nuvem/nuvem-mudanca.js')") < disparo,
  MAIN.includes("const nuvemChegando = comNuvem"),
], [true, true]);
t("a mudança de endereço grava antes da preparação da nuvem", MAIN.indexOf("await receberFichasSeVieram()") < MAIN.indexOf("await prepararNuvem()"), true);
t("a montagem segue depois da nuvem", MAIN.indexOf("createRoot(") > MAIN.indexOf("await prepararNuvem()"), true);
t("a tela montada é a que já desceu", MAIN.includes("const Tela = telaSobDemanda(() => telaChegando)"), true);

const APP = lê("../src/App.jsx");
t("o App pré-carrega a Ficha com a lista na tela", APP.includes('const listaNaTela = view.name === "dashboard" && !rotaSala && !esperaCompendio;'), true);
t("só se alguma ficha abre na Ficha G2", APP.includes("storage.creatures.some((c) => !!sistemaGravado(c))"), true);
t("pelo ajudante", APP.includes('preCarregarQuandoOcioso("ficha")'), true);
t("o App não importa a Ficha G2 nem o motor", /^import .*(AftyFichaG2|afty-derive)/m.test(APP), false);
const CENTRAL = lê("../src/home/CentralDeJogo.jsx");
t("a Central pré-carrega o App pelo ajudante", CENTRAL.includes('useEffect(() => preCarregarQuandoOcioso("app"), []);'), true);
t("e nunca o importa", /import\(\s*["']\.\.\/App/.test(CENTRAL), false);
const VITE = lê("../vite.config.js");
t("o plugin das portas está no vite.config", [VITE.includes("import { pluginDasPortas } from './src/celular/portas-plugin.js'"), VITE.includes("pluginDasPortas(),")], [true, true]);
t("o index.html de origem não leva o bloco (só o build)", lê("../index.html").includes("fm-portas"), false);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
