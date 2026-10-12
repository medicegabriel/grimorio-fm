
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
await mkdir(".audit/implemento-marcial-shots", { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const report = [];
try {
  for (const sistema of ["player", "afty"]) {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 }, isMobile: width === 390, hasTouch: width === 390,
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto("http://localhost:5173/" + (sistema === "player" ? "Player" : "Afty"), { waitUntil: "networkidle" });
      const expected = await page.evaluate(async (sistema) => {
        const { deriveAfty } = await import("/src/systems/afty/afty-derive.js");
        const { createBlankAfty } = await import("/src/systems/afty/afty-schema.js");
        const { aplicarAddons } = await import("/src/systems/afty/afty-addons.js");
        aplicarAddons([]);
        const f = createBlankAfty();
        Object.assign(f, { id: "teste-implemento-marcial", name: "Teste Implemento Marcial", rulesVersion: sistema, attrMethod: "fixos" });
        f.core = { ...f.core, nd: 30, tipo: "combatente", patamar: "comum" };
        f.especializacoes = [{ id: "combatente", nivel: 16 }, { id: "lutador", nivel: 14 }];
        f.attributes = { forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 };
        f.habilidades = sistema === "afty" ? ["cmb_implemento_marcial", "lut_implemento_marcial"] : [];
        const d = deriveAfty(f);
        localStorage.setItem("fm_creatures_" + sistema + "_v1", JSON.stringify([f]));
        return d.cd;
      }, sistema);
      await page.reload({ waitUntil: "networkidle" });
      await page.getByText("Teste Implemento Marcial", { exact: true }).click();
      const cd = page.locator('[data-afty-stat="cd"] button');
      assert.equal(await cd.innerText(), String(expected));
      if (width === 390) await cd.click(); else await cd.hover();
      const labels = page.locator(".afty-fonte-rotulo").filter({ hasText: /^Implemento Marcial$/ });
      await labels.first().waitFor({ state: "visible" });
      assert.equal(await labels.count(), 2);
      assert.equal(await labels.evaluateAll((ls) => ls.filter((e) => !e.classList.contains("line-through")).length), 1);
      assert.equal(await labels.evaluateAll((ls) => ls.filter((e) => e.classList.contains("line-through")).length), 1);
      assert.deepEqual(await labels.locator("..").locator(".afty-fonte-valor").allTextContents(), ["+4", "+4"]);
      assert.match(await page.locator(".afty-fonte-total").innerText(), new RegExp(String(expected) + "$"));
      await page.screenshot({ path: ".audit/implemento-marcial-shots/" + sistema + "-" + width + ".png" });
      assert.deepEqual(errors, []);
      report.push({ sistema, width, cd: expected, implementoAplicado: 4, copiaDescartada: true, errors });
      await context.close();
    }
  }
} finally {
  await browser.close();
  await writeFile(".audit/implemento-marcial-report.json", JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report));
