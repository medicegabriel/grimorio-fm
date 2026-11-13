/* Diferença localizada entre os pares de capturas (atual x proposta): decodifica no canvas do Chrome, conta pixels e dá a caixa. */
import { chromium } from "playwright";
import fs from "node:fs";
const DIR = new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1") + "capturas/";
const nav = await chromium.launch({ channel: "chrome" });
const p = await nav.newPage();
const pares = fs.readdirSync(DIR).filter((f) => f.startsWith("regressao-") && f.endsWith("-atual.png"));
const res = [];
for (const a of pares) {
  const b = a.replace("-atual", "-proposta");
  const r = await p.evaluate(async ({ A, B }) => {
    const carrega = (s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = "data:image/png;base64," + s; });
    const [ia, ib] = await Promise.all([carrega(A), carrega(B)]);
    const c = (i) => { const k = document.createElement("canvas"); k.width = i.width; k.height = i.height; const g = k.getContext("2d"); g.drawImage(i, 0, 0); return g.getImageData(0, 0, i.width, i.height); };
    const da = c(ia), db = c(ib); let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, maxd = 0;
    for (let y = 0; y < da.height; y++) for (let x = 0; x < da.width; x++) { const i = (y * da.width + x) * 4; const d = Math.abs(da.data[i] - db.data[i]) + Math.abs(da.data[i + 1] - db.data[i + 1]) + Math.abs(da.data[i + 2] - db.data[i + 2]); if (d > 0) { n++; maxd = Math.max(maxd, d); if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; } }
    return { n, total: da.width * da.height, caixa: [x0, y0, x1, y1], maxd };
  }, { A: fs.readFileSync(DIR + a).toString("base64"), B: fs.readFileSync(DIR + b).toString("base64") });
  res.push({ par: a.replace("-atual.png", ""), ...r });
  console.log(a.replace("regressao-", "").replace("-atual.png", "").padEnd(28), `${r.n} px (${(100 * r.n / r.total).toFixed(2)}%)  caixa ${r.caixa.join(",")}  dif máx ${r.maxd}`);
}
fs.writeFileSync(DIR + "../regressao-diferencas.json", JSON.stringify(res, null, 2));
await nav.close();
