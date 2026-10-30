/* DESEMPENHO COM FONTE EXTERNA REGISTRADA (2026-10-19). Uso: BASE=http://localhost:5320 node <este arquivo> [amostra] [g2|classica]
   Sessão semeada com um Feitiço recebido (Defesa +7) e combate ativo. Mede tarefas longas (PerformanceObserver) em:
   1. abrir a Preparação e confirmar logo em seguida, sem esperar;
   2. ativações rápidas em sequência (cliques sem pausa), conferindo que nenhuma ativação se perde (estados ligados na sessão);
   3. na clássica, ligar e desligar estados da aba Buffs em sequência. */
import { abrir } from "../integracao-g2/harness.mjs";
const id = process.argv[2] ?? "minamoto";
const g2 = (process.argv[3] ?? "g2") === "g2";
const reg = { id: "rec_perf", rec: true, tipoFonte: "feitico", origemId: null, origemNome: "Defesa Recebida", aplicadoPor: null, beneficios: [{ canal: "defesa", valor: 7 }], rodadas: null };
/* FONTE=catalogo: duas Auras do Bastião de aliados diferentes (o caminho com derive de base e disputa de exclusivos, dois derives por tradução). */
const cat = (n, v) => ({ id: "rec_cat" + n, rec: true, tipoFonte: "catalogo", origemId: "aptidao:aura_do_bastiao", origemNome: "Aura do Bastião", aplicadoPor: "Aliado " + n, beneficios: [{ canal: "defesa", valor: v }], rodadas: null });
const buffs = process.env.FONTE === "catalogo" ? [cat(1, 2), cat(2, 3), reg] : [reg];
const sessao = { combate: { ativo: true }, rodada: 2, buffs, condicoes: [] };
const { browser, page, erros, ficha } = await abrir({ amostraId: id, viewport: { width: 1440, height: 900 }, sessao, query: g2 ? "?ficha-g2=1" : "" });
const log = (...a) => console.log(...a);
const defesa = async () => Number((await page.locator('[data-afty-stat="defesa"]').first().textContent()).replace(/[^\d-]/g, ""));
const lerSessao = () => page.evaluate((i) => JSON.parse(localStorage.getItem(`fm_ficha_sessao_afty_v1:${i}`)), ficha.id);
await page.evaluate(() => { window.__long = []; new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push(Math.round(e.duration)))).observe({ entryTypes: ["longtask"] }); });
async function medido(nome, fn) {
  await page.evaluate(() => { window.__long.length = 0; });
  const t0 = Date.now();
  await fn();
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const ms = Date.now() - t0;
  await page.waitForTimeout(1500);
  const longas = await page.evaluate(() => window.__long.slice());
  log(`${nome}: pintou em ${ms} ms, tarefas longas ${JSON.stringify(longas)} (soma ${longas.reduce((a, b) => a + b, 0)} ms)`);
}
try {
  await page.waitForTimeout(1500);
  log("Defesa com o Feitiço recebido:", await defesa());
  await page.locator('[data-afty-aba="buffs"]').click();
  await page.waitForTimeout(1500);
  if (g2) {
    const nomes = ["Ataque Concentrado", "Espírito de Luta", "Conhecimento Aplicado"];
    await page.getByRole("button", { name: /Adicionar/ }).first().click();
    await page.getByRole("button", { name: /^Habilidades de Classe/ }).first().click();
    // 1. abrir e confirmar logo, sem pausa
    await page.locator(".e-g2 .e-area").getByText(nomes[0], { exact: true }).first().click();
    await medido("abrir e confirmar sem pausa", async () => {
      await page.locator(".e-g2 .e-area").getByRole("button", { name: "Ativar", exact: true }).last().click();
      await page.getByRole("button", { name: /Confirmar Ativação/ }).first().click();
    });
    // 2. três ativações em sequência, sem pausa entre elas
    const antes = await lerSessao();
    await medido("duas ativações em sequência", async () => {
      for (const n of nomes.slice(1)) {
        const voltar = page.getByRole("button", { name: /^Ativos$/ });
        if (!(await voltar.count())) await page.getByRole("button", { name: /Adicionar/ }).first().click();
        await page.getByRole("button", { name: /^Habilidades de Classe/ }).first().click();
        await page.locator(".e-g2 .e-area").getByText(n, { exact: true }).first().click();
        await page.locator(".e-g2 .e-area").getByRole("button", { name: "Ativar", exact: true }).last().click();
        await page.getByRole("button", { name: /Confirmar Ativação/ }).first().click().catch(() => {});
      }
    });
    const depois = await lerSessao();
    const ligados = (s) => Object.keys(s?.combate ?? {}).filter((k) => s.combate[k] && k !== "ativo").sort();
    log(`estados ligados: ${JSON.stringify(ligados(antes))} -> ${JSON.stringify(ligados(depois))} (esperado os dois novos: espiritoDeLuta e conhecimentoAplicado)`);
    log(`eventos da sessão: ${antes?.operacoes?.eventos?.length ?? 0} -> ${depois?.operacoes?.eventos?.length ?? 0} (as duas são sem custo, não geram evento)`);
    log("Defesa depois das ativações:", await defesa());
  } else {
    const botoes = page.getByRole("button", { name: /^Desligar |^Ligar / });
    log("botões de estado na aba Buffs:", await botoes.count());
    await medido("ligar e desligar em sequência", async () => {
      const lig = page.getByRole("button", { name: /^Ligar /, exact: false });
      const n = Math.min(3, await lig.count());
      for (let i = 0; i < n; i++) await page.getByRole("button", { name: /^Ligar / }).first().click().catch(() => {});
    });
    log("Defesa depois:", await defesa());
  }
} catch (e) { log("FALHA", e.message.split("\n")[0]); }
log("erros", JSON.stringify(erros.slice(0, 3)));
await browser.close();
