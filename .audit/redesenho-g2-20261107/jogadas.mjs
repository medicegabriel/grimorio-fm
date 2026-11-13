/* Ficha Final: a lista Jogadas de Ataque some no Player (G2 e clássica) e fica na criatura. Uso: node jogadas.mjs [base] */
import { chromium } from "playwright";
const BASE = process.argv[2] ?? "http://127.0.0.1:5330";
const b = await chromium.launch({ channel: "chrome" });
let falhas = 0;
const check = (id, ok, d) => { if (!ok) falhas++; console.log(ok ? "ok    " : "FALHOU", id, ok ? "" : JSON.stringify(d)?.slice(0, 200)); };
for (const [ficha, sistema, esperado] of [["cmp-densa", "player", false], ["criatura", "criatura", true]]) {
  for (const modo of ["g2", "classica"]) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    const erros = [];
    p.on("pageerror", (e) => erros.push(e.message));
    await p.goto(`${BASE}/?ficha=${ficha}&tema=escuro&aba=pericias${modo === "classica" ? "&modo=classica" : ""}`);
    await p.locator("#afty-ficha").waitFor();
    if (modo === "classica") await p.locator('[data-afty-aba="pericias"]').click();
    await p.waitForTimeout(700);
    const n = await p.locator('[data-m-linha^="ataque:"], [id^="afty-item-ataque:"]').count();
    check(`${sistema} ${modo}: linhas de ataque ${esperado ? "presentes" : "ausentes"}`, (n > 0) === esperado, { n });
    const titulo = await p.getByText(/^Jogadas de Ataque$/i).count();
    check(`${sistema} ${modo}: título Jogadas de Ataque ${esperado ? "presente" : "ausente"}`, (titulo > 0) === esperado, { titulo });
    check(`${sistema} ${modo}: Resistências e Perícias intactas`, (await p.locator('[data-m-linha^="tr:"], [id^="afty-item-tr:"]').count()) >= 5 && (await p.locator('[data-m-linha^="pericia:"], [id^="afty-item-pericia:"]').count()) >= 10);
    check(`${sistema} ${modo}: sem erro de página`, erros.length === 0, erros);
    await ctx.close();
  }
}
await b.close();
console.log(falhas ? `${falhas} falhas` : "tudo ok");
