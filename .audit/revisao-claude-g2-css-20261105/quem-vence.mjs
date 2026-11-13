/* Por que o CSS do usuário (sem !important) perde? Pergunta ao Chrome (CDP, CSS.getMatchedStylesForNode) qual regra define a
   propriedade em cada elemento, com a folha de origem e o seletor. Roda com o tema `teste` (o CSS da prévia SEM !important). */
import { abre, aba, passo, check, encerra, etapa } from "./lib.mjs";
import fs from "node:fs";

const ALVOS = [
  { id: "card", sel: ".afty-card", prop: "border-top-color", aba: "acoes" },
  { id: "aba ativa", sel: '[data-afty-aba="acoes"][aria-selected="true"]', prop: "color", aba: "acoes" },
  { id: "numero da Mesa", sel: ".m-rolar-num", prop: "color", aba: "acoes" },
  { id: "secao de Acoes", sel: "[data-m-secao]", prop: "border-top-color", aba: "acoes" },
  { id: "valor", sel: ".afty-valor", prop: "color", aba: "acoes" },
  { id: "card de Perícias", sel: ".afty-card", prop: "border-top-color", aba: "pericias" },
  { id: "linha de Perícias", sel: ".afty-linha", prop: "border-top-color", aba: "pericias" },
];
const saida = [];
passo("quem vence");
const { ctx, p } = await abre({ ficha: "mesa", query: "tema=teste" });
const cdp = await ctx.newCDPSession(p);
await cdp.send("DOM.enable"); await cdp.send("CSS.enable");
const folhas = new Map();
cdp.on("CSS.styleSheetAdded", (e) => folhas.set(e.header.styleSheetId, e.header));
await p.reload(); await p.locator("#afty-ficha").waitFor(); await p.waitForTimeout(800);
const { root } = await cdp.send("DOM.getDocument", { depth: 0 });

for (const alvo of ALVOS) {
  await aba(p, alvo.aba);
  const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector: alvo.sel });
  if (!nodeId) { saida.push({ ...alvo, achou: false }); continue; }
  const m = await cdp.send("CSS.getMatchedStylesForNode", { nodeId });
  const regras = [];
  m.matchedCSSRules.forEach((r, ordem) => {
    const props = r.rule.style.cssProperties.filter((c) => c.name === alvo.prop || c.name.startsWith(alvo.prop.replace(/-top-color$/, "")) || c.name === "border-color" || c.name === "border");
    if (!props.length) return;
    const h = folhas.get(r.rule.styleSheetId);
    const camada = r.rule.layers?.map((l) => l.text).join(">") || "(sem camada)";
    const escopo = r.rule.scopes?.map((s) => s.text).join(" ") || "";
    regras.push({ ordem, seletor: r.rule.selectorList.text, camada, escopo, origem: r.rule.origin, folha: h ? (h.sourceURL?.split("/").pop() || (h.isInline ? "<style inline>" : "?")) : "?", decl: props.map((c) => `${c.name}:${c.value}${c.important ? " !important" : ""}`).join("; ").slice(0, 120) });
  });
  /* a última da lista com camada "(sem camada)" costuma ser a vencedora, mas a cascata real é por especificidade: o Chrome devolve em ordem de cascata crescente */
  saida.push({ ...alvo, achou: true, regras });
}
fs.writeFileSync(new URL("./quem-vence.json", import.meta.url), JSON.stringify(saida, null, 2));
for (const s of saida) {
  console.log(`\n== ${s.id} (${s.sel}) ${s.prop}`);
  for (const r of (s.regras ?? [])) console.log(`   [${r.ordem}] ${r.folha} ${r.camada} ${r.escopo ? "@scope " + r.escopo : ""} :: ${r.seletor.slice(0, 80)} => ${r.decl}`);
}
await ctx.close();
await encerra("quem-vence-resumo");
