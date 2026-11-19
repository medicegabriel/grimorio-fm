/**
 * Edge invisível falando pelo protocolo de depuração (CDP), sem dependência nova.
 *
 * Existe porque o Playwright não está nesta máquina e o projeto evita biblioteca nova
 * (S-24). O Edge vem com o Windows, e o Node 24 já traz `fetch` e `WebSocket`, que é
 * tudo o que o protocolo pede. Serve ao `medir.mjs` e ao `gerar-icones.mjs`.
 *
 * O perfil do Edge é temporário e apagado no `fechar()`: nada do navegador da pessoa
 * é lido nem gravado.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CAMINHOS_DO_EDGE = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
];

const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));

async function portaDoPerfil(perfil, limiteMs = 15000) {
  const arquivo = join(perfil, "DevToolsActivePort");
  const fim = Date.now() + limiteMs;
  while (Date.now() < fim) {
    if (existsSync(arquivo)) {
      try {
        const porta = Number(readFileSync(arquivo, "utf8").split("\n")[0]);
        if (porta > 0) return porta;
      } catch {
        /* EBUSY: o Edge ainda está escrevendo o arquivo (o Windows trava). Tenta de novo. */
      }
    }
    await espera(100);
  }
  throw new Error("O Edge não abriu a porta de depuração a tempo.");
}

/** Uma conexão CDP com uma aba: `enviar(metodo, params)` e `aoEvento(metodo, fn)`. */
function conectar(urlWs) {
  return new Promise((ok, falha) => {
    const ws = new WebSocket(urlWs);
    let id = 0;
    const pendentes = new Map();
    const ouvintes = new Map();
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pendentes.has(msg.id)) {
        const { resolver, rejeitar, metodo } = pendentes.get(msg.id);
        pendentes.delete(msg.id);
        if (msg.error) rejeitar(new Error(`${metodo}: ${msg.error.message}`));
        else resolver(msg.result);
      } else if (msg.method) {
        for (const fn of ouvintes.get(msg.method) ?? []) fn(msg.params);
      }
    });
    ws.addEventListener("error", () => falha(new Error("Falha na conexão CDP.")));
    ws.addEventListener("open", () => ok({
      enviar: (metodo, params = {}) => new Promise((resolver, rejeitar) => {
        id += 1;
        pendentes.set(id, { resolver, rejeitar, metodo });
        ws.send(JSON.stringify({ id, method: metodo, params }));
      }),
      aoEvento: (metodo, fn) => {
        if (!ouvintes.has(metodo)) ouvintes.set(metodo, []);
        ouvintes.get(metodo).push(fn);
      },
      fechar: () => ws.close(),
    }));
  });
}

/**
 * Abre o Edge invisível. Devolve `novaAba()` (uma aba nova, com a conexão CDP dela) e
 * `fechar()`, que mata o processo e apaga o perfil temporário.
 */
export async function abrirEdge({ caminho } = {}) {
  const exe = caminho ?? CAMINHOS_DO_EDGE.find((p) => existsSync(p));
  if (!exe) throw new Error("Nem Edge nem Chrome encontrados.");
  const perfil = mkdtempSync(join(tmpdir(), "fm-cdp-"));
  const processo = spawn(exe, [
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${perfil}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--disable-sync",
    "--hide-scrollbars",
    "--mute-audio",
    "about:blank",
  ], { stdio: "ignore" });
  const porta = await portaDoPerfil(perfil);
  const base = `http://127.0.0.1:${porta}`;

  return {
    async novaAba() {
      const r = await fetch(`${base}/json/new?about:blank`, { method: "PUT" });
      const alvo = await r.json();
      const aba = await conectar(alvo.webSocketDebuggerUrl);
      aba.id = alvo.id;
      aba.fecharAba = async () => {
        aba.fechar();
        await fetch(`${base}/json/close/${alvo.id}`).catch(() => {});
      };
      return aba;
    },
    async fechar() {
      processo.kill();
      await espera(800);
      try { rmSync(perfil, { recursive: true, force: true }); } catch { /* o Windows às vezes segura o perfil por um instante */ }
    },
  };
}

/** Navega e espera o `load` (com teto), mais um respiro para o React desenhar. */
export async function navegar(aba, url, { respiroMs = 1500, limiteMs = 30000 } = {}) {
  const carregou = new Promise((ok) => aba.aoEvento("Page.loadEventFired", ok));
  await aba.enviar("Page.navigate", { url });
  await Promise.race([carregou, espera(limiteMs)]);
  await espera(respiroMs);
}

/** Roda uma expressão na página e devolve o valor (com `await` liberado). */
export async function avaliar(aba, expressao) {
  const r = await aba.enviar("Runtime.evaluate", {
    expression: expressao, awaitPromise: true, returnByValue: true,
  });
  if (r.exceptionDetails) {
    throw new Error(`Erro na página: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
  }
  return r.result.value;
}

export { espera };
