/* PONTO 2 do consultor: o CSS do usuário ALCANÇA o G2 sem !important?
   O prompt do app (regra 7) manda não usar !important e diz que o CSS "vence a folha do app sem ele". O CSS de teste da prévia usa
   !important em quase tudo, então não prova isso. Aqui o MESMO CSS (`tema=teste`) vai sem !important, e comparo o computado com o
   que o G2 pinta sem tema nenhum.
   Também percorre TODAS as abas do G2 e monta o inventário de seletores do contrato contra o DOM VIVO (PONTO 4). */
import { abre, aba, abas, passo, check, foto, encerra, espera, etapa, saida } from "./lib.mjs";
import fs from "node:fs";

const medir = (p, sel, props) => p.evaluate(({ sel, props }) => {
  const els = [...document.querySelectorAll(sel)].filter((e) => e.offsetParent !== null || getComputedStyle(e).position === "fixed");
  return { n: els.length, valores: els.slice(0, 40).map((e) => Object.fromEntries(props.map((k) => [k, getComputedStyle(e)[k]]))) };
}, { sel, props });

const distintos = (m, k) => [...new Set(m.valores.map((v) => v[k]))];

/* ---- A. o mesmo CSS, com e sem !important, em cada superfície do G2 ---- */
const SUPERFICIES = [
  { id: "card (.afty-card)", sel: ".afty-card", k: "borderTopColor", esperado: "rgb(225, 29, 72)" },
  { id: "valor (.afty-valor)", sel: ".afty-valor", k: "color", esperado: "rgb(34, 211, 238)" },
  { id: "aba ativa", sel: '[data-afty-aba="acoes"][aria-selected="true"]', k: "color", esperado: "rgb(34, 211, 238)" },
  { id: "numero da Mesa (.m-rolar-num)", sel: ".m-rolar-num", k: "color", esperado: "rgb(34, 211, 238)" },
  { id: "secao de Acoes (.m-secao)", sel: "[data-m-secao]", k: "borderTopColor", esperado: "rgb(225, 29, 72)" },
];
const resultados = {};
for (const tema of ["escuro", "teste-important", "teste"]) {
  passo(`alcance, tema ${tema}`);
  const { ctx, p } = await abre({ ficha: "mesa", query: `tema=${tema}` });
  await aba(p, "acoes");
  resultados[tema] = {};
  for (const s of SUPERFICIES) {
    const m = await medir(p, s.sel, [s.k]);
    resultados[tema][s.id] = { n: m.n, valores: distintos(m, s.k) };
  }
  await foto(p, `alcance-${tema}-acoes${process.env.SUF ?? ""}`);
  check("sem erro de página", etapa.erros.length === 0, etapa.erros);
  await ctx.close();
}
passo("alcance, comparação");
for (const s of SUPERFICIES) {
  const base = resultados.escuro[s.id], imp = resultados["teste-important"][s.id], sem = resultados.teste[s.id];
  etapa.medidas[s.id] = { padrao: base.valores, comImportant: imp.valores, semImportant: sem.valores, n: base.n };
  if (base.n === 0) { check(`${s.id}: existe na aba Ações`, false, "nenhum elemento"); continue; }
  check(`${s.id}: o CSS SEM !important altera o computado`, sem.valores.includes(s.esperado), { padrao: base.valores, sem: sem.valores });
}
fs.writeFileSync(new URL("./alcance-do-css.resultados" + (process.env.SUF ?? "") + ".json", import.meta.url), JSON.stringify(resultados, null, 2));

/* ---- B. inventário do contrato contra o DOM vivo, por aba, em três apresentações ---- */
const texto = fs.readFileSync(new URL("./analise-estatica.json", import.meta.url), "utf8");
const est = JSON.parse(texto);
const src = fs.readFileSync(new URL("../../src/systems/afty/ficha/ficha-tema.js", import.meta.url), "utf8");
const bloco = (nome) => src.slice(src.indexOf(`export const ${nome}`), src.indexOf("];", src.indexOf(`export const ${nome}`)));
const seletores = [...bloco("CONTRATO_DE_CLASSES").matchAll(/seletor: "((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].replace(/\\"/g, '"'));
const attrs = [...bloco("ATRIBUTOS_DOC").matchAll(/seletor: "((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].replace(/\\"/g, '"')).map((s) => s.replace(/=\\?"[^"]*"/, ""));

const inventario = {};
async function varre(rotulo, query, ficha) {
  const { ctx, p } = await abre({ ficha, query });
  const lista = await abas(p);
  const porAba = {};
  for (const a of lista) {
    await aba(p, a);
    porAba[a] = await p.evaluate(({ seletores, attrs }) => Object.fromEntries([...seletores, ...attrs].map((s) => { try { return [s, document.querySelectorAll(s).length]; } catch { return [s, -1]; } })), { seletores, attrs });
  }
  /* o que existe de verdade, na soma das abas */
  const soma = {};
  for (const a of lista) for (const [s, n] of Object.entries(porAba[a])) soma[s] = Math.max(soma[s] ?? 0, n);
  const alem = await p.evaluate(() => {
    const e = [...document.querySelectorAll("#afty-ficha *")];
    const cls = new Set(); for (const el of e) for (const c of el.classList) if (/^(e|m|f)-/.test(c)) cls.add(c);
    return { eMf: cls.size };
  });
  inventario[rotulo] = { abas: lista, ausentes: Object.entries(soma).filter(([, n]) => n === 0).map(([s]) => s), presentes: Object.entries(soma).filter(([, n]) => n > 0).length, total: Object.keys(soma).length, classesEMF: alem.eMf, porAba };
  await ctx.close();
}
passo("inventário do contrato no DOM vivo");
await varre("G2 com as três abas novas (mesa)", "tema=escuro", "mesa");
await varre("G2 sem a prévia (mesa)", "tema=escuro&modo=g2-sem-previa", "mesa");
await varre("clássica (mesa)", "tema=escuro&modo=classica", "mesa");
for (const [k, v] of Object.entries(inventario)) {
  etapa.medidas[k] = { abas: v.abas, presentes: v.presentes, total: v.total, ausentes: v.ausentes, classesEMF: v.classesEMF };
  console.log(`  ${k}: ${v.presentes}/${v.total} do contrato aparecem, abas ${v.abas.join(",")}, ${v.classesEMF} classes e-/m-/f-`);
}
fs.writeFileSync(new URL("./inventario-contrato-dom" + (process.env.SUF ?? "") + ".json", import.meta.url), JSON.stringify(inventario, null, 2));
await encerra("alcance-do-css" + (process.env.SUF ?? ""));
