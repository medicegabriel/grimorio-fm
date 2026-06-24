import { chromium } from "playwright";
const out = new URL("./shots/", import.meta.url).pathname.replace(/^\//, "");
import fs from "fs";
fs.mkdirSync(out, { recursive: true });
let browser;
try { browser = await chromium.launch({ channel: "chrome" }); }
catch { browser = await chromium.launch(); }
const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const errs = [];
page.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errs.push("CONSOLE.ERR: " + m.text()); });
await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const title = await page.title();
const bodyLen = (await page.innerText("body")).trim().length;
await page.screenshot({ path: `${out}/smoke.png` });
console.log("title:", title, "| body chars:", bodyLen);
console.log(errs.length ? errs.join("\n") : "no runtime errors");
await browser.close();
