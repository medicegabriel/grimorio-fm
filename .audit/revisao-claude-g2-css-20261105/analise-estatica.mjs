/* Revisão G2 + CSS Personalizado (2026-11-05): análise ESTÁTICA do contrato de classes contra o código.
   Só leitura. Lê ficha-tema.js como texto (sem importar), varre o JSX e o CSS do G2 e da clássica.
   Saída: analise-estatica.json */
import fs from "node:fs";
import path from "node:path";

const RAIZ = new URL("../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const FICHA = `${RAIZ}src/systems/afty/ficha/`;
const ler = (p) => fs.readFileSync(p, "utf8");
const lista = (dir, ext) => {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...lista(p, ext));
    else if (ext.some((x) => e.name.endsWith(x))) out.push(p);
  }
  return out;
};

/* ---- 1. o contrato, tirado do texto de ficha-tema.js ---- */
const tema = ler(`${FICHA}ficha-tema.js`);
const bloco = (nome) => tema.slice(tema.indexOf(`export const ${nome}`), tema.indexOf("];", tema.indexOf(`export const ${nome}`)));
const contrato = [...bloco("CONTRATO_DE_CLASSES").matchAll(/seletor: "((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].replace(/\\"/g, '"'));
const atributos = [...bloco("ATRIBUTOS_DOC").matchAll(/seletor: "((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].replace(/\\"/g, '"'));
const tokens = [...bloco("TOKENS_DOC").matchAll(/id: "(--afty-[a-z-]+)", valor: "((?:[^"\\]|\\.)*)"/g)].map((m) => [m[1], m[2].replace(/\\"/g, '"')]);

/* ---- 2. o código ---- */
const arquivos = lista(FICHA, [".jsx", ".js", ".css"]);
const g2Jsx = arquivos.filter((f) => /(abas-g2|efeitos)[\\/]/.test(f) && /\.(jsx|js)$/.test(f));
const g2Css = arquivos.filter((f) => /(abas-g2|efeitos)[\\/].*\.css$/.test(f));
const classicaJsx = arquivos.filter((f) => /\.(jsx|js)$/.test(f) && !/(abas-g2|efeitos)[\\/]/.test(f));
const juntar = (fs_) => fs_.map(ler).join("\n");
const txtG2 = juntar(g2Jsx), txtG2Css = juntar(g2Css), txtClass = juntar(classicaJsx);
const txtFichaCss = ler(`${FICHA}ficha.css`);

/* ---- 3. cada classe do contrato: aparece no JSX do G2? na clássica? ---- */
const classeDe = (s) => (s.match(/^\.([a-z0-9-]+)$/i) || [])[1];
const presenca = contrato.map((s) => {
  const c = classeDe(s);
  if (!c) return { seletor: s, g2: null, classica: null, nota: "não é classe simples" };
  const re = new RegExp(`(?<![A-Za-z0-9_-])${c}(?![A-Za-z0-9_-])`);
  return { seletor: s, g2Jsx: re.test(txtG2), classicaJsx: re.test(txtClass), g2Css: re.test(txtG2Css) };
});
const soNaClassica = presenca.filter((p) => p.g2Jsx === false && p.classicaJsx === true).map((p) => p.seletor);
const nuncaUsada = presenca.filter((p) => p.g2Jsx === false && p.classicaJsx === false).map((p) => p.seletor);

/* ---- 4. atributos do contrato ---- */
const presAttr = atributos.map((s) => {
  const nome = (s.match(/\[(data-[a-z-]+)/) || [])[1];
  return { seletor: s, nome, g2Jsx: nome ? txtG2.includes(nome) : null, classicaJsx: nome ? txtClass.includes(nome) : null };
});

/* ---- 5. classes que o G2 USA e o contrato NÃO conhece ---- */
const contratoClasses = new Set(contrato.map(classeDe).filter(Boolean));
const usadasG2 = new Map();
for (const f of g2Jsx) {
  const t = ler(f);
  for (const m of t.matchAll(/className=(?:"([^"]+)"|\{`([^`]+)`\}|\{"([^"]+)"\})/g)) {
    for (const c of (m[1] || m[2] || m[3]).split(/\s+/)) {
      if (!/^[a-z][a-z0-9-]*$/i.test(c)) continue;
      usadasG2.set(c, (usadasG2.get(c) ?? 0) + 1);
    }
  }
}
const familia = (c) => (c.match(/^(e|m|f|afty)-/) || [, "outra"])[1] + "-";
const prefixos = { "e-": [], "m-": [], "f-": [], "afty-": [], "outra-": [] };
for (const [c, n] of usadasG2) if (!contratoClasses.has(c)) prefixos[familia(c)].push([c, n]);
const resumoPref = Object.fromEntries(Object.entries(prefixos).map(([k, v]) => [k, v.length]));
const aftyForaDoContrato = prefixos["afty-"].map(([c]) => c);

/* ---- 6. cores fixas e !important ---- */
const semComentario = (css) => css.replace(/\/\*[\s\S]*?\*\//g, "");
const conta = (css) => {
  const c = semComentario(css);
  const decl = c.match(/[a-z-]+\s*:\s*[^;{}]+;?/gi) ?? [];
  const hex = (c.match(/#[0-9a-f]{3,8}\b/gi) ?? []).length;
  const rgba = (c.match(/\brgba?\(/gi) ?? []).length;
  const hsl = (c.match(/\bhsla?\(/gi) ?? []).length;
  const imp = (c.match(/!important/g) ?? []).length;
  const comVar = (c.match(/var\(--afty-/g) ?? []).length;
  const redefAfty = [...c.matchAll(/(^|[;{\s])(--afty-[a-z-]+)\s*:/g)].map((m) => m[2]);
  const tokensProprios = [...new Set([...c.matchAll(/(^|[;{\s])(--(?:e|m|f|g2|ef)-[a-z0-9-]+)\s*:/g)].map((m) => m[2]))];
  return { declaracoes: decl.length, hex, rgba, hsl, corFixaTotal: hex + rgba + hsl, important: imp, usosDeVarAfty: comVar, redefinicoesDeTokenAfty: redefAfty.length, redefinidos: [...new Set(redefAfty)], tokensProprios: tokensProprios.length };
};
const porArquivo = {};
for (const f of [...g2Css, `${FICHA}ficha.css`]) porArquivo[path.relative(FICHA, f).replace(/\\/g, "/")] = conta(ler(f));

/* ---- 7. TOKENS_DOC contra ficha.css: valor padrão confere? ---- */
const raizFicha = txtFichaCss.match(/\.afty-ficha\s*\{([\s\S]*?)\n\}/);
const divergentes = [];
if (raizFicha) {
  for (const [id, valor] of tokens) {
    const m = raizFicha[1].match(new RegExp(`${id}\\s*:\\s*([^;]+);`));
    if (!m) divergentes.push({ id, motivo: "ausente na raiz do ficha.css", doc: valor });
    else if (m[1].trim().replace(/\s+/g, " ") !== valor.replace(/\s+/g, " ")) divergentes.push({ id, doc: valor, css: m[1].trim() });
  }
} else divergentes.push({ motivo: "bloco .afty-ficha não localizado" });
const tokensUsadosNaoDocumentados = [...new Set([...(txtFichaCss + txtG2Css).matchAll(/var\((--afty-[a-z-]+)/g)].map((m) => m[1]))].filter((t) => !tokens.some(([id]) => id === t));

/* ---- 8. portais: o que flutua para fora de #afty-ficha ---- */
const portais = [];
for (const f of arquivos.filter((x) => /\.(jsx|js)$/.test(x))) {
  const t = ler(f);
  for (const m of t.matchAll(/createPortal\([\s\S]{0,400}?\)/g)) portais.push({ arquivo: path.relative(FICHA, f).replace(/\\/g, "/"), alvo: (m[0].match(/,\s*([A-Za-z_.()"' #-]+)\)$/) || [, "?"])[1].trim() });
}
const portaisUi = [];
const ui = `${RAIZ}src/systems/afty/ui/`;
for (const f of lista(ui, [".jsx", ".js"])) {
  const t = ler(f);
  if (/createPortal/.test(t)) portaisUi.push({ arquivo: path.relative(RAIZ, f).replace(/\\/g, "/"), usos: (t.match(/createPortal/g) ?? []).length, alvo: [...t.matchAll(/createPortal\([\s\S]{0,300}?,\s*([^)]+)\)/g)].map((m) => m[1].trim().slice(0, 60)) });
}

/* ---- 9. cabeçalhos de aba do G2 contra data-afty-aba do contrato ---- */
const tabsG2 = (ler(`${FICHA}AftyFichaG2.jsx`).match(/const TABS = \[[\s\S]*?\];/) || [""])[0];
const tabsClassica = (ler(`${FICHA}AftyFichaClassica.jsx`).match(/const TABS = \[[\s\S]*?\];/) || [""])[0];

const out = {
  contrato: { classesESeletores: contrato.length, atributos: atributos.length, tokens: tokens.length },
  contratoNoG2: { soNaClassica, nuncaUsadaEmLugarNenhum: nuncaUsada, nSoNaClassica: soNaClassica.length },
  atributosPresenca: presAttr,
  classesDoG2ForaDoContrato: resumoPref,
  amostraClassesE: prefixos["e-"].sort((a, b) => b[1] - a[1]).slice(0, 25),
  amostraClassesM: prefixos["m-"].sort((a, b) => b[1] - a[1]).slice(0, 25),
  aftyUsadasNoG2ForaDoContrato: aftyForaDoContrato,
  cores: porArquivo,
  tokensDoc: { total: tokens.length, divergentesDoFichaCss: divergentes, usadosNaoDocumentados: tokensUsadosNaoDocumentados },
  portaisFicha: portais,
  portaisUi,
  tabsG2: tabsG2.replace(/\s+/g, " "),
  tabsClassica: tabsClassica.replace(/\s+/g, " "),
};
fs.writeFileSync(new URL("./analise-estatica.json", import.meta.url), JSON.stringify(out, null, 2));
console.log(JSON.stringify({ contrato: out.contrato, soNaClassica: out.contratoNoG2.nSoNaClassica, nunca: nuncaUsada, classesForaDoContrato: resumoPref, afty_fora: aftyForaDoContrato, cores: porArquivo, tokens: out.tokensDoc, portais: portais.length, portaisUi }, null, 2));
