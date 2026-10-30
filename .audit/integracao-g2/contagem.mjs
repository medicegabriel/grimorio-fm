import { abrir } from "./harness.mjs";
const id = process.argv[2] ?? "minamoto";
const g2 = process.argv[3] === "g2";
const { browser, page } = await abrir({ amostraId: id, viewport: { width: 1440, height: 900 }, query: g2 ? "?ficha-g2=1" : "" });
const cdp = await page.context().newCDPSession(page);
const log = (...a) => console.log(...a);
async function contar(nome, fn) {
  await cdp.send("Profiler.enable");
  await cdp.send("Profiler.startPreciseCoverage", { callCount: true, detailed: false });
  const t0 = Date.now();
  await fn();
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const ms = Date.now() - t0;
  const { result } = await cdp.send("Profiler.takePreciseCoverage");
  await cdp.send("Profiler.stopPreciseCoverage");
  const alvos = ["deriveAfty", "prepararCalculo", "derivar", "deltaDeEstados", "deltaDosEstados", "saldoDoAgora", "montarRepertorio", "conteudoDaFicha", "montarGrupos", "montarAtivos", "detalhesDoAtivo", "simularGrupos", "aparaSessao", "salvarSessao", "linhasDeEstado", "consequencias", "montarOpcoes", "disputasDosAtivos", "mesclaFichaAfty", "equipamentosDaFicha", "alvosDeBusca"];
  const cont = {};
  for (const s of result) for (const f of s.functions) if (alvos.includes(f.functionName)) { const c = f.ranges[0].count; cont[f.functionName] = (cont[f.functionName] ?? 0) + c; }
  log(`${nome}: ${ms} ms | chamadas ${JSON.stringify(cont)}`);
}
try {
  await page.waitForTimeout(1500);
  await page.getByRole("button", { name: /Fora de Combate/ }).click().catch(() => {});
  await page.locator('[data-afty-aba="buffs"]').click();
  await page.waitForTimeout(800);
  if (g2) {
    await page.getByRole("button", { name: /Adicionar/ }).first().click();
    await page.getByRole("button", { name: /^Habilidades de Classe/ }).first().click();
    await page.locator(".e-g2 .e-area").getByText("Ataque Concentrado", { exact: true }).first().click();
    await contar("abrir preparação", () => page.locator(".e-g2 .e-area").getByRole("button", { name: "Ativar", exact: true }).last().click());
    await contar("confirmar ativação", () => page.getByRole("button", { name: /Confirmar Ativação/ }).click());
    await page.waitForTimeout(500);
    await contar("próxima rodada", () => page.getByRole("button", { name: /Próxima rodada/i }).first().click());
  } else {
    // classica: liga o primeiro estado da lista de Estados
    const alvo = page.locator('[data-afty-aba="buffs"]');
    const botoes = page.getByRole("button", { name: /Ligar/ });
    log("botões Ligar:", await botoes.count());
    await contar("ligar um estado", () => botoes.first().click());
    await contar("próxima rodada", () => page.getByRole("button", { name: /Próxima rodada/i }).first().click());
  }
} catch (e) { log("FALHA:", e.message.split("\n")[0]); } finally { await browser.close(); }
