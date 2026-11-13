import { chromium } from "playwright";
const nav = await chromium.launch({ channel: "chrome" });
for (const [rotulo, base] of [["atual 5341", "http://127.0.0.1:5341"], ["proposta 5342", "http://127.0.0.1:5342"]]) {
  const p = await nav.newPage();
  await p.goto(`${base}/?ficha=mesa&tema=escuro`, { waitUntil: "domcontentloaded" }); await p.locator("#afty-ficha").waitFor(); await p.waitForTimeout(500);
  const ordem = await p.evaluate(() => [...document.querySelectorAll("link[rel=stylesheet], style")].map((e) => e.tagName === "LINK" ? e.getAttribute("href").split("/").pop() : "<style " + e.textContent.length + ">"));
  console.log(rotulo, JSON.stringify(ordem));
  await p.close();
}
await nav.close();
