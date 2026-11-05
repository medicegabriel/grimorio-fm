// Verificação local com perfil descartável, sem usar o armazenamento do navegador da mesa.
import { createServer } from "node:http";
import { readFile, mkdtemp } from "node:fs/promises";
import { spawn } from "node:child_process";
import { register } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith('.')&&!s.endsWith('.js'))return n(s+'.js',c);throw e}}", import.meta.url);
await import("../src/systems/afty/afty-derive.js");
const { createBlankAfty } = await import("../src/systems/afty/afty-schema.js");
const pacote = JSON.parse(await readFile(new URL("../addons/servos-da-guerra.json", import.meta.url)));
const ficha = { ...createBlankAfty(), name: "Servo de Teste", id: "teste-de-servo", addons: [pacote],
  servosGuerra: { classe: "Saber" }, rulesVersion: "afty" };
async function testar() {
  const aguardar = async (busca) => {
    for (let i = 0; i < 100; i++) {
      const el = busca();
      if (el) return el;
      await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error("Elemento ausente: " + String(busca) + " | " + document.body.innerText.slice(-450));
  };
  const texto = (seletor, nome) => [...document.querySelectorAll(seletor)].find((el) => el.textContent.trim() === nome);
  try {
    (await aguardar(() => texto("span,h2,h3,p,div", "Servo de Teste"))).click();
    (await aguardar(() => texto('button,[role="tab"]', "Ações"))).click();
    await aguardar(() => texto("div", "Servo: Saber"));
    (await aguardar(() => document.querySelector('button[title="Editar no criador"]'))).click();
    (await aguardar(() => texto('[role="tab"],button', "Outros"))).click();
    (await aguardar(() => texto('[role="menuitem"],button', "Addons"))).click();
    const classe = await aguardar(() => [...document.querySelectorAll("select")].find((el) => el.querySelector('option[value="Caster"]') || [...el.options].some((o) => o.text === "Caster")));
    if (!document.querySelector('input[aria-label="Saber: Força"]')) throw new Error("Distribuição do Saber ausente");
    classe.value = "Caster";
    classe.dispatchEvent(new Event("change", { bubbles: true }));
    (await aguardar(() => texto("button", "Adicionar Restrição"))).click();
    await aguardar(() => document.querySelector('select[aria-label="Benefício da Restrição"]'));
    await fetch("/resultado", { method: "POST", body: "OK: ficha final e classes Saber e Caster no criador" });
  } catch (e) { await fetch("/resultado", { method: "POST", body: String(e) }); }
}
const pasta = resolve("dist");
let concluir;
const resultado = new Promise((r) => { concluir = r; });
const server = createServer(async (req, res) => {
  try {
    if (req.url === "/resultado" && req.method === "POST") {
      let corpo = "";
      for await (const parte of req) corpo += parte;
      res.end("ok"); concluir(corpo); return;
    }
    if (req.url === "/Afty") {
      const pagina = await readFile(join(pasta, "index.html"), "utf8");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(pagina.replace("<head>", "<head><script>localStorage.setItem('fm_creatures_afty_v1'," +
        JSON.stringify(JSON.stringify([ficha])) + ");window.addEventListener('load'," + testar.toString() + ");</script>"));
      return;
    }
    const path = resolve(pasta, "." + new URL(req.url, "http://localhost").pathname);
    if (!path.startsWith(pasta + sep)) { res.writeHead(403).end(); return; }
    res.setHeader("Content-Type", path.endsWith(".js") ? "application/javascript" : path.endsWith(".css") ? "text/css" : "application/octet-stream");
    res.end(await readFile(path));
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const profile = await mkdtemp(join(tmpdir(), "afty-servos-"));
const chrome = spawn(process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", [
  "--headless=new", "--disable-gpu", "--disable-background-networking", "--no-first-run",
  "--user-data-dir=" + profile, "http://127.0.0.1:" + server.address().port + "/Afty",
], { windowsHide: true, stdio: "ignore" });
const timer = setTimeout(() => concluir("Tempo de verificação excedido"), 45000);
try {
  const valor = await resultado;
  console.log(valor);
  if (!valor.startsWith("OK:")) process.exitCode = 1;
} finally { clearTimeout(timer); chrome.kill(); server.closeAllConnections(); server.close(); }
