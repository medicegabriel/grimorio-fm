import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const fase = process.argv[2] ?? "antes";
const pasta = fileURLToPath(new URL("./verificacao-lote02-shots/", import.meta.url));
await mkdir(pasta, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
const relatorio = [];
try {
  for (const rota of ["afty", "player"]) {
    for (const largura of [390]) {
      const context = await browser.newContext({ viewport: { width: largura, height: 900 }, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      const erros = [];
      page.on("pageerror", (e) => erros.push(e.message));
      await page.goto(`${process.env.LOTE02_URL ?? "http://127.0.0.1:5273"}/${rota}`, { waitUntil: "networkidle" });
      await page.getByTitle(rota === "afty" ? "Criar nova criatura" : "Criar novo personagem", { exact: true }).click();
      await page.locator("header h1").waitFor();
      await page.screenshot({ path: `${pasta}/${fase}-${rota}-${largura}-identidade.png` });
      const cabecalho = await page.locator("header").evaluate((el) => {
        const rect = (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, largura: r.width, altura: r.height }; };
        const titulo = el.querySelector("h1");
        const css = getComputedStyle(titulo);
        return {
          ...rect(el), voltar: rect([...el.querySelectorAll("button")].find((b) => b.textContent.includes("Voltar"))),
          titulo: rect(titulo), estilo: Object.fromEntries(["fontFamily", "fontSize", "fontWeight", "color", "letterSpacing", "marginTop", "marginBottom", "lineHeight"].map((k) => [k, css[k]])),
        };
      });
      const abas = (await page.getByRole("tab").allTextContents()).filter((nome) => nome !== "Outros");
      const medidas = [];
      for (const nome of abas) {
        await page.getByRole("tab", { name: nome, exact: true }).click();
        await page.waitForTimeout(120);
        medidas.push(await page.evaluate((aba) => ({ aba, largura: document.documentElement.scrollWidth, viewport: innerWidth }), nome));
        if (nome.includes("Habilidades")) {
          await page.screenshot({ path: `${pasta}/${fase}-${rota}-${largura}-habilidades.png` });
          const perfil = page.locator("h2").filter({ hasText: "Perfil Amaldiçoado" }).locator("..");
          await perfil.screenshot({ path: `${pasta}/${fase}-${rota}-${largura}-perfil.png` });
          medidas.at(-1).perfil = await perfil.evaluate((el) => {
            const rect = (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, largura: r.width, altura: r.height }; };
            return { cabecalho: rect(el), titulo: rect(el.querySelector("h2")), seletor: rect(el.querySelector("select")) };
          });
        }
      }
      const outros = page.getByRole("tab", { name: "Outros", exact: true });
      if (await outros.count()) {
        await outros.click();
        const menuAbas = await page.getByRole("menuitem").allTextContents();
        for (const nome of menuAbas) {
          await outros.click();
          await page.getByRole("menuitem", { name: nome, exact: true }).click();
          await page.waitForTimeout(120);
          medidas.push(await page.evaluate((aba) => ({ aba, largura: document.documentElement.scrollWidth, viewport: innerWidth }), nome));
        }
      }
      const linha = { fase, rota, largura, cabecalho, abas: medidas, erros };
      relatorio.push(linha);
      console.log(JSON.stringify(linha));
      await context.close();
    }
  }
  await writeFile(new URL(`./verificacao-lote02-layout-${fase}.json`, import.meta.url), JSON.stringify(relatorio, null, 2));
} finally {
  await browser.close();
}
