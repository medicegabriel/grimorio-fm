import { abrir } from "./harness.mjs";
process.env.BASE = "http://127.0.0.1:5311";
const { browser, page, erros } = await abrir({ amostraId: process.argv[2] ?? "minamoto", viewport: { width: 1280, height: 800 } });
const log = (...a) => console.log(...a);
const quadros = (n = 2) => page.evaluate((k) => new Promise((r) => { const t0 = performance.now(); let i = 0; const f = () => { if (++i >= k) r(performance.now() - t0); else requestAnimationFrame(f); }; requestAnimationFrame(f); }), n);
async function mede(nome, fn, vezes = 5) {
  const ts = [];
  for (let i = 0; i < vezes; i++) { const t0 = Date.now(); await fn(); await quadros(2); ts.push(Date.now() - t0); }
  ts.sort((a, b) => a - b);
  log(`${nome}: mediana ${ts[Math.floor(ts.length / 2)]} ms (min ${ts[0]}, max ${ts.at(-1)})`);
}
try {
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: /Fora de Combate/ }).click();
  await mede("alternar abas (Ações/Habilidades/Efeitos/Perícias)", async () => { for (const a of ["acoes", "habilidades", "buffs", "pericias"]) await page.locator(`[data-afty-aba="${a}"]`).click(); }, 4);
  await page.locator('[data-afty-aba="acoes"]').click();
  await mede("dano de 1 na Vida pelo painel", async () => {
    await page.locator('.m-medidor[data-recurso="pv"]').click();
    await page.locator(".m-painel-vital input").fill("1");
    await page.getByRole("button", { name: "Dano", exact: true }).click();
    await page.keyboard.press("Escape");
  }, 6);
  await page.locator('[data-afty-aba="buffs"]').click();
  await mede("Próxima Rodada pelo cabeçalho", async () => { await page.getByRole("button", { name: /Próxima rodada/i }).first().click(); }, 6);
  await mede("abrir e fechar a consulta de uma habilidade", async () => {
    await page.locator('[data-afty-aba="habilidades"]').click();
    await page.locator(".e-linha-corpo").first().click();
    await page.keyboard.press("Escape");
  }, 5);
  log("erros", JSON.stringify(erros.slice(0, 3)));
} finally { await browser.close(); }
