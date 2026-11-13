/* O auditor do CSS livre do painel de Aparência (`auditaCss`, ficha-tema.js): cada regra acusa o que deve e deixa passar o que é permitido. */
import { register } from "node:module";
register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(!/\\.[a-z]+$/.test(s)&&s.startsWith('.'))return n(s+'.js',c);throw e}}", import.meta.url);

await import("../src/systems/afty/afty-derive.js");
const { auditaCss } = await import("../src/systems/afty/ficha/ficha-tema.js");

let n = 0;
const t = (nome, real, esperado) => {
  n += 1;
  if (JSON.stringify(real) !== JSON.stringify(esperado)) { console.error(`FALHOU ${nome}\n  real:     ${JSON.stringify(real)}\n  esperado: ${JSON.stringify(esperado)}`); process.exitCode = 1; }
};
const qtd = (css) => auditaCss(css).length;
const tem = (css, trecho) => auditaCss(css).some((x) => x.includes(trecho));

t("vazio não acusa nada", auditaCss(""), []);
t("tema limpo não acusa nada", auditaCss(".afty-card { border-color: #f0f; }\n.afty-efeito { background: #123; }"), []);
t("!important", tem(".afty-card { color: red !important; }", "!important"), true);
t("@import é removido antes, mas avisa", tem("@import url(x.css);\n.afty-card { color: red; }", "@import"), true);
t("@font-face", tem("@font-face { font-family: X; src: url(a.woff2); }", "@font-face"), true);
t("data URI", tem(".afty-card { background: url(data:image/png;base64,AAAA); }", "data URI"), true);
t("url externa de imagem é permitida", qtd(".afty-cabecalho { background-image: url(https://x.com/a.png); }"), 0);
t("position no cabeçalho", tem(".afty-cabecalho { position: relative; }", "position"), true);
t("background-position NÃO é position", qtd(".afty-cabecalho { background-position: center; }"), 0);
t("overflow no card", tem(".afty-card { overflow: hidden; }", "overflow"), true);
t("overflow-x NÃO é overflow", qtd(".afty-card { overflow-x: auto; }"), 0);
t("z-index na linha", tem(".afty-linha { z-index: 3; }", "z-index"), true);
t("transform na raiz", tem(":scope#afty-ficha { transform: scale(1); }", "raiz"), true);
t("transform fora da raiz passa", qtd(".afty-botao { transform: scale(1); }"), 0);
t("background na barra", tem(".afty-vital-barra { background: red; }", "barra"), true);
t("seletor dentro de @scope", tem("@scope (#afty-ficha) { .afty-card { overflow: hidden; } }", "overflow"), true);

console.log(`TODOS OS ${n} ASSERTS PASSARAM`);
