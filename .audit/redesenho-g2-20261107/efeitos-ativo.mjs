/* Efeitos com um efeito ATIVO de verdade, depois do cabeçalho novo: ativa Ataque Concentrado, abre o detalhe (Agora, Ajustar, Termina) na aba cheia
   e na compacta, em 1440, 1280 e 390. Uso: node efeitos-ativo.mjs [base] */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:5330";
const SAIDA = new URL("./depois/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const b = await chromium.launch({ channel: "chrome" });
let falhas = 0;
const check = (id, ok, d) => { if (!ok) falhas++; console.log(ok ? "ok    " : "FALHOU", id, ok ? "" : JSON.stringify(d)?.slice(0, 200)); };

for (const [w, h] of [[1440, 900], [1280, 800], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 600, isMobile: w < 600 });
  const p = await ctx.newPage();
  const erros = [];
  p.on("pageerror", (e) => erros.push(e.message));
  await p.goto(`${BASE}/?ficha=cmp-densa&tema=escuro&aba=buffs`);
  await p.locator("#afty-ficha").waitFor();
  await p.waitForTimeout(700);
  /* Ativa Ataque Concentrado pelo catálogo de Efeitos: Adicionar, o item, Ativar, Confirmar. */
  await p.getByRole("button", { name: /Adicionar/ }).first().click();
  await p.waitForTimeout(400);
  await p.locator("main").getByText("Ataque Concentrado").first().click();
  await p.waitForTimeout(400);
  await p.locator("main").getByRole("button", { name: "Ativar", exact: true }).last().click();
  await p.waitForTimeout(500);
  const confirmar = p.locator("main").getByRole("button", { name: /Confirmar/ }).first();
  check(`botão Confirmar existe ${w}`, (await confirmar.count()) > 0);
  if (await confirmar.count()) { await confirmar.click(); await p.waitForTimeout(700); }
  const itens = await p.locator("main").getByText("Ataque Concentrado").count();
  check(`o efeito aparece em Ativos ${w}`, itens > 0, { itens });
  await p.screenshot({ path: `${SAIDA}efeitos-ativo-lista-${w}.png` });
  /* Abre o ativo. */
  const cartao = p.locator("main button.g2-cartao").first();
  /* O cartão abre e fecha o detalhe: se estiver fechado, abre. */
  if ((await cartao.getAttribute("aria-expanded")) !== "true") { await cartao.click(); await p.waitForTimeout(500); }
  const temDetalhe = await p.locator(".d-exp, .x-colunas").count();
  await p.screenshot({ path: `${SAIDA}efeitos-ativo-detalhe-${w}.png` });
  const rotulos = await p.locator(".x-colunas").first().innerText().catch(() => "");
  check(`detalhe do ativo tem Agora, Ajustar e Termina ${w}`, /Agora/.test(rotulos) && /Ajustar/.test(rotulos) && /Termina/.test(rotulos), { itens, temDetalhe, rotulos: rotulos.slice(0, 120) });
  check(`sem estouro horizontal ${w}`, (await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) <= 0);
  /* Compacta aberta: o ativo aparece no painel ao lado. */
  await p.locator('[data-afty-aba="pericias"]').click();
  await p.locator(".f-acesso").click();
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${SAIDA}efeitos-ativo-compacta-${w}.png` });
  check(`sem erro de página ${w}`, erros.length === 0, erros);
  await ctx.close();
}
await b.close();
console.log(falhas ? `${falhas} falhas` : "tudo ok");
