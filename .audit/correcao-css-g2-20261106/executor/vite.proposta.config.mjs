/* PROPOSTA (não é o produto): o mesmo executor, com um plugin que reescreve o CSS do G2 em tempo de build, SEM tocar nos arquivos de src/.
   v2, ESTREITA (a v1, `.e-g2` virando `:where(.e-g2)` em TODA regra, mudou 12 de 32 capturas):
     1. só as regras cujo ELEMENTO-ALVO (o último composto do seletor) carrega uma classe do G2 que divide o elemento com uma classe do contrato
        (pares-g2-contrato.json, medido no DOM vivo) perdem o nível de especificidade do prefixo `.e-g2`. São as regras que o usuário disputa
        quando mira `.afty-card`, `.afty-aba`, `.afty-nome`. As demais ficam como estão.
     2. `--e-display` lê `--afty-fonte-display` (token novo e documentável), com o Bahnschrift como padrão.
   Saída em ./dist-proposta, porta 5342. */
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import postcss from "postcss";
import base from "./vite.config.mjs";

const AQUI = fileURLToPath(new URL(".", import.meta.url));
const BARRA = String.fromCharCode(92);
const pares = JSON.parse(fs.readFileSync(new URL("../pares-g2-contrato.json", import.meta.url), "utf8"));
const ALIADAS = new Set(Object.keys(pares).filter((c) => /^[a-z][a-z0-9-]*$/i.test(c) && c !== "e-g2"));

/* O último composto do seletor: depois do último combinador que não está dentro de [] ou (). */
function ultimoComposto(sel) {
  let prof = 0, corte = 0;
  for (let i = 0; i < sel.length; i++) {
    const c = sel[i];
    if (c === "[" || c === "(") prof++; else if (c === "]" || c === ")") prof--;
    else if (prof === 0 && (c === " " || c === ">" || c === "+" || c === "~")) corte = i + 1;
  }
  return sel.slice(corte);
}
const estatistica = { regras: 0, baixadas: 0 };
const plugin = {
  name: "proposta-g2-where",
  enforce: "pre",
  transform(code, id) {
    const limpo = id.split("?")[0].split(BARRA).join("/");
    if (!/\/(efeitos-g2|abas-g2)\.css$/.test(limpo)) return null;
    const raiz = postcss.parse(code);
    raiz.walkRules((rule) => {
      estatistica.regras++;
      let mudou = false;
      const novos = rule.selectors.map((s) => {
        if (!/^\.e-g2(?![\w-])/.test(s)) return s;
        const alvo = ultimoComposto(s);
        const classes = [...alvo.matchAll(/\.([a-z][a-z0-9-]*)/gi)].map((m) => m[1]);
        if (!classes.some((c) => ALIADAS.has(c))) return s;
        mudou = true;
        return s.replace(/^\.e-g2(?![\w-])/, ":where(.e-g2)");
      });
      if (mudou) { rule.selectors = novos; estatistica.baixadas++; }
    });
    let out = raiz.toString();
    out = out.replace(/--e-display:\s*[^;]+;/, '--e-display: var(--afty-fonte-display, "Bahnschrift", "Segoe UI", system-ui, sans-serif);');
    console.error(`proposta v2: ${limpo.split("/").pop()} regras ${estatistica.regras}, baixadas ${estatistica.baixadas}`);
    return { code: out, map: null };
  },
};
export default { ...base, plugins: [plugin, ...base.plugins], build: { ...base.build, outDir: `${AQUI}dist-proposta` } };
