/* O criador do Player e o da criatura, aba Perícias: a lista Jogadas de Ataque some no Player e fica na criatura.
   Uso: node criador.mjs [base]  (o app com o dev server, por exemplo http://localhost:5340) */
import { chromium } from "playwright";
const BASE = process.argv[2] ?? "http://localhost:5340";
const SAIDA = new URL("./depois/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const b = await chromium.launch({ channel: "chrome" });
let falhas = 0;
const check = (id, ok, d) => { if (!ok) falhas++; console.log(ok ? "ok    " : "FALHOU", id, ok ? "" : JSON.stringify(d)?.slice(0, 200)); };
for (const [rota, nome, esperado] of [["Player", "player", false], ["Afty", "criatura", true]]) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const erros = [];
  p.on("pageerror", (e) => erros.push(e.message));
  await p.goto(`${BASE}/${rota}`);
  await p.waitForTimeout(1500);
  const novo = p.getByRole("button", { name: /Nov[ao]/ }).first();
  await novo.click();
  await p.waitForTimeout(1200);
  await p.getByRole("button", { name: /^Perícias/ }).first().click().catch(async () => { await p.getByText("Perícias", { exact: true }).first().click(); });
  await p.waitForTimeout(800);
  const temCard = (await p.getByText("Jogadas de Ataque", { exact: true }).count()) > 0;
  const temTr = (await p.getByText("Testes de Resistência", { exact: true }).count()) > 0;
  check(`${nome}: aba Perícias aberta (Testes de Resistência presente)`, temTr);
  check(`${nome}: Jogadas de Ataque ${esperado ? "presente" : "ausente"}`, temCard === esperado, { temCard });
  await p.screenshot({ path: `${SAIDA}criador-${nome}-pericias.png` });
  check(`${nome}: sem erro de página`, erros.length === 0, erros);
  await ctx.close();
}
await b.close();
console.log(falhas ? `${falhas} falhas` : "tudo ok");
