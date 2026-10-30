import { chromium } from "playwright";
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await (await b.newContext()).newPage();
p.on("response", (r) => { if (r.status() >= 400) console.log(r.status(), r.url()); });
await p.goto("http://127.0.0.1:5311/afty", { waitUntil: "networkidle" });
await b.close();
