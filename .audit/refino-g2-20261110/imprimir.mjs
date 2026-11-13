import { monta } from "./base.mjs";
for (const tema of ["escuro", "arcane", "minamoto"]) {
  const { p, saida, fim } = await monta({ tamanho: "1200x900", ficha: "mesa", aba: "acoes", tema, prefixo: "imp" });
  await p.emulateMedia({ media: "print" });
  await p.waitForTimeout(300);
  const r = await p.evaluate(() => { const f = document.querySelector("#afty-ficha"); const cs = getComputedStyle(f); return { fundo: cs.getPropertyValue("--afty-fundo").trim(), texto: cs.getPropertyValue("--afty-texto").trim(), card: cs.getPropertyValue("--afty-card").trim(), bg: cs.backgroundColor, corTexto: cs.color }; });
  // O navegador devolve a variável como foi escrita (#fff ou #ffffff): normalizar antes de comparar.
  const hex = (v) => { const s = v.toLowerCase(); return /^#[0-9a-f]{3}$/.test(s) ? "#" + [...s.slice(1)].map((c) => c + c).join("") : s; };
  const claro = hex(r.fundo) === "#ffffff" && hex(r.texto) === "#0f172a";
  console.log(tema, claro ? "OK imprime claro" : "FALHA imprime escuro", JSON.stringify(r));
  await fim();
}
