import { abrir } from "./harness.mjs";
const { browser, page } = await abrir({ amostraId: "minamoto", viewport: { width: 1280, height: 800 } });
try {
  await page.getByRole("button", { name: /Fora de Combate/ }).click();
  await page.locator('[data-afty-aba="buffs"]').click();
  await page.getByRole("button", { name: /Adicionar/ }).first().click();
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => {
    const el = [...document.querySelectorAll(".e-area *")].find((e) => e.children.length === 0 && e.textContent.trim() === "Adicionar");
    const cs = getComputedStyle(el);
    const cadeia = [];
    for (let n = el; n && n !== document.body; n = n.parentElement) cadeia.push(`${n.tagName.toLowerCase()}.${(n.className || "").toString().split(" ").join(".")}`);
    return { cls: el.className, cor: cs.color, e_t1: cs.getPropertyValue("--e-t1"), afty_texto: cs.getPropertyValue("--afty-texto"), cadeia: cadeia.slice(0, 8) };
  });
  console.log(JSON.stringify(r, null, 1));
} finally { await browser.close(); }
