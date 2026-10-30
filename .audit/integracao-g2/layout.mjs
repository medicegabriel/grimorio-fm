import { abrir } from "./harness.mjs";
import fs from "node:fs";
const pasta = "C:/Projetos/Grimorio/grimorio-tracker/.audit/integracao-g2/capturas";
const id = process.argv[2] ?? "minamoto";
const tamanhos = [[1024, 720], [1280, 800], [1440, 900], [390, 844]];
const out = [];
for (const [w, h] of tamanhos) {
  const { browser, page, erros } = await abrir({ amostraId: id, viewport: { width: w, height: h }, hasTouch: w < 500 });
  try {
    await page.waitForTimeout(500);
    const linha = { w, h };
    for (const aba of ["acoes", "habilidades", "buffs", "pericias"]) {
      await page.locator(`[data-afty-aba="${aba}"]`).click();
      await page.waitForTimeout(450);
      const m = await page.evaluate(() => {
        const cab = document.querySelector("header.afty-cabecalho");
        const area = document.querySelector(".e-area");
        return {
          overflowX: document.documentElement.scrollWidth - window.innerWidth,
          cabecalho: Math.round(cab.getBoundingClientRect().height),
          estagio: area ? Math.round(area.getBoundingClientRect().height) : null,
          estagioBase: area ? Math.round(area.getBoundingClientRect().bottom) : null,
        };
      });
      linha[aba] = m;
      if (aba !== "pericias") await page.screenshot({ path: `${pasta}/${id}-${w}x${h}-${aba}.png` });
    }
    // painel aberto em Ações
    await page.locator('[data-afty-aba="acoes"]').click();
    await page.getByRole("button", { name: /^Efeitos/ }).first().click().catch(() => {});
    await page.waitForTimeout(400);
    linha.painel = await page.evaluate(() => ({ overflowX: document.documentElement.scrollWidth - window.innerWidth, aberto: !!document.querySelector(".g-painel") }));
    await page.screenshot({ path: `${pasta}/${id}-${w}x${h}-painel.png` });
    linha.erros = erros.length;
    out.push(linha);
  } finally { await browser.close(); }
}
fs.writeFileSync(`${pasta}/layout-${id}.json`, JSON.stringify(out, null, 1));
for (const l of out) console.log(JSON.stringify(l));
