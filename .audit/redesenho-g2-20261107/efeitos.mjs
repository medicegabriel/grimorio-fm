/* Efeitos depois do cabeçalho novo: aba aberta, compacta aberta, detalhe de um ativo. Uso: node efeitos.mjs <saida> */
import { chromium } from "playwright";
const saida = process.argv[2];
const b = await chromium.launch({ channel: "chrome" });
async function abre(w, h, ficha, aba) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 600, isMobile: w < 600 });
  const p = await ctx.newPage();
  const erros = [];
  p.on("pageerror", (e) => erros.push(e.message));
  await p.goto(`http://127.0.0.1:5331/?ficha=${ficha}&tema=escuro&aba=${aba}`);
  await p.locator("#afty-ficha").waitFor(); await p.waitForTimeout(700);
  return { p, erros };
}
for (const [w, h] of [[1440, 900], [1280, 800], [390, 844]]) {
  const { p, erros } = await abre(w, h, "mesa", "buffs");
  // Adiciona um efeito pelo catálogo, se o botão existir
  const add = p.getByRole("button", { name: /Adicionar/ }).first();
  if (await add.count()) { await add.click(); await p.waitForTimeout(500); }
  await p.screenshot({ path: `${saida}/efeitos-adicionar-${w}.png` });
  await p.keyboard.press("Escape");
  await p.waitForTimeout(300);
  console.log(w, "erros", erros.length, erros.slice(0, 2));
  await p.close();
}
await b.close();
