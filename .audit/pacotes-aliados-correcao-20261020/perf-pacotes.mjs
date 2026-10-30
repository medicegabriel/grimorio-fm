/* DESEMPENHO COM PACOTES RECEBIDOS (2026-10-19). Build de produção. Uso: BASE=http://127.0.0.1:5321 node .audit/pacotes-aliados-20261019/perf-pacotes.mjs
   Ficha densa: a amostra Player 30 Volumoso (cópia de teste, id próprio, contexto isolado). Dois cenários na MESMA build:
     base   sem biblioteca e sem instância (a ficha de hoje);
     oito   biblioteca do pacote exportado pelo e2e e OITO opções recebidas ligadas na sessão.
   Medidas dentro da página: do pointerdown à mudança observada no DOM e mais dois quadros, e as tarefas longas (PerformanceObserver) da janela da
   operação mais 1,5 s. Sem pausa artificial entre abrir e confirmar: o clique seguinte vem logo que o elemento existe. */
import fs from "node:fs";
import { chromium } from "playwright";
import { register } from "node:module";
register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}", import.meta.url);
const PA = await import(new URL("../../src/systems/afty/ficha/pacotes-aliados.js", import.meta.url).href);

const DIR = `${process.cwd()}/.audit/pacotes-aliados-correcao-20261020`;
const BASE = process.env.BASE ?? "http://127.0.0.1:5321";
const REPETE = Number(process.env.REPETE ?? 2);
const amostra = JSON.parse(fs.readFileSync("C:/Projetos/Grimorio/prototipos/ficha-final-v2/dados/amostras.json", "utf8")).amostras.find((a) => a.id === "player30").ficha;
const lido = PA.lerArquivoDePacote(fs.readFileSync(`${DIR}/pacote-yuki-rev1.json`, "utf8"));
const biblioteca = PA.gravarNaBiblioteca([], lido.pacote, lido.recusadas, "2026-10-19T22:00:00Z").biblioteca;
const OITO = ["Aura do Bastião", "Aura do Comandante Evoluída", "Escudo Dourado", "Nue · Escudo de Raios", "Nue · Halo", "Nue · Faíscas", "Presença Inspiradora", "Táticas Defensivas"];
const instancias = OITO.map((n, i) => PA.instanciaDaOpcao(biblioteca[0], biblioteca[0].opcoes.find((o) => o.nome === n), { id: `perf${i}` }));
const chaveOp = (nome) => PA.chaveDaOpcaoRecebida(biblioteca[0].chave, biblioteca[0].opcoes.find((o) => o.nome === nome).id);
const out = { geradoEm: new Date().toISOString(), base: BASE, amostra: amostra.name, medidas: [], erros: [] };
const browser = await chromium.launch({ channel: "chrome" });

async function abre(cenario, g2 = true) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  p.setDefaultTimeout(20000);
  p.on("pageerror", (e) => out.erros.push(`${cenario}: ${e.message}`));
  await p.route("**/*", (rt) => { const u = new URL(rt.request().url()); return ["blob:", "data:"].includes(u.protocol) || u.hostname === "127.0.0.1" || u.hostname === "localhost" ? rt.continue() : rt.abort(); });
  const ficha = { ...amostra, id: `perf-pacotes-${cenario}`, ...(cenario === "oito" ? { pacotesRecebidos: biblioteca } : {}) };
  const sessao = { combate: { ativo: true }, rodada: 1, buffs: cenario === "oito" ? instancias : [], condicoes: [] };
  await p.goto(`${BASE}/Player`, { waitUntil: "domcontentloaded" });
  await p.evaluate(([f, s]) => { localStorage.setItem("fm_creatures_player_v1", JSON.stringify([f])); localStorage.setItem(`fm_ficha_sessao_afty_v1:${f.id}`, JSON.stringify(s)); }, [ficha, sessao]);
  await p.goto(`${BASE}/Player${g2 ? "?ficha-g2=1" : ""}`, { waitUntil: "networkidle" });
  await p.getByText(ficha.name, { exact: true }).first().click();
  await p.locator("#afty-ficha").waitFor();
  await p.waitForTimeout(1500);
  await p.evaluate(() => {
    window.__long = [];
    new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push({ ms: Math.round(e.duration), t: e.startTime }))).observe({ entryTypes: ["longtask"] });
  });
  return { ctx, p, ficha };
}
/* Do pointerdown no elemento `gatilho` até `pronto` existir no DOM, mais dois quadros. A espera de 1,5 s depois só junta as tarefas longas. */
async function medir(p, rotulo, cenario, gatilho, pronto) {
  await p.evaluate(({ pronto }) => {
    window.__t0 = null; window.__t1 = null; window.__long.length = 0;
    document.addEventListener("pointerdown", () => { window.__t0 ??= performance.now(); }, { capture: true, once: true });
    const fim = () => requestAnimationFrame(() => requestAnimationFrame(() => { window.__t1 = performance.now(); }));
    if (document.querySelector(pronto)) return;
    const mo = new MutationObserver(() => { if (document.querySelector(pronto)) { mo.disconnect(); fim(); } });
    mo.observe(document.body, { subtree: true, childList: true, attributes: true });
  }, { pronto });
  await p.locator(gatilho).first().click();
  await p.waitForFunction(() => window.__t1 != null, null, { timeout: 15000 });
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => ({ ms: Math.round(window.__t1 - window.__t0), longas: window.__long.filter((x) => x.t >= window.__t0 - 5).map((x) => x.ms) }));
  out.medidas.push({ cenario, rotulo, ...r });
  console.log(`${cenario.padEnd(5)} ${rotulo}: ${r.ms} ms até pintar, tarefas longas ${JSON.stringify(r.longas)}`);
  return r;
}
async function catalogoClasse(p) {
  if (!(await p.locator("[data-catalogo]").count())) await p.locator("[data-adicionar]").first().click();
  await p.locator('[data-cat="especializacao"]').click();
}

for (let i = 0; i < REPETE; i++) {
  for (const cenario of ["base", "oito"]) {
    const { ctx, p, ficha } = await abre(cenario);
    try {
      await p.locator('[data-afty-aba="buffs"]').click();
      await p.waitForTimeout(1200);
      /* 1. Ataque Concentrado: abrir a Preparação e confirmar logo em seguida. */
      await catalogoClasse(p);
      await p.locator('[data-chave-opcao="especializacao:cmb_ataque_concentrado"] .k-acao').click();
      await medir(p, "confirmar Ataque Concentrado", cenario, "button:has-text('Confirmar Ativação')", '[data-chave-ativo="especializacao:cmb_ataque_concentrado"]');
      if (cenario === "oito") {
        /* 2. Ativar uma nona opção recebida. */
        await p.locator("[data-adicionar]").first().click();
        await p.locator("[data-aba-externa]").click();
        await p.locator(`[data-chave-opcao="${chaveOp("Nue · Clareza")}"] .k-item`).click();
        await medir(p, "ativar opção recebida (oito já ligadas)", cenario, `[data-ativar-recebido="${chaveOp("Nue · Clareza")}"]`, `[data-chave-opcao="${chaveOp("Nue · Clareza")}"] [data-tom="ativo"]`);
        /* 3. As duas opções ativáveis que sobram, em sequência, sem pausa. */
        const tres = ["Bênção Tripla", "Inimigo Comum"];
        await p.evaluate(() => { window.__long.length = 0; window.__t0 = performance.now(); });
        for (const n of tres) {
          await p.locator(`[data-chave-opcao="${chaveOp(n)}"] .k-item`).click();
          await p.locator(`[data-ativar-recebido="${chaveOp(n)}"]`).click();
        }
        await p.waitForTimeout(1500);
        const sess = await p.evaluate((id) => JSON.parse(localStorage.getItem(`fm_ficha_sessao_afty_v1:${id}`)), ficha.id);
        const longas = await p.evaluate(() => window.__long.map((x) => x.ms));
        const ligadas = tres.filter((n) => sess.buffs.some((b) => b.origemNome === n)).length;
        out.medidas.push({ cenario, rotulo: "duas ativações recebidas em sequência", ligadas, longas });
        console.log(`${cenario.padEnd(5)} duas ativações em sequência: ${ligadas}/${tres.length} ligadas, tarefas longas ${JSON.stringify(longas)}`);
      }
    } catch (e) { out.erros.push(`${cenario}: ${e.message.split("\n")[0]}`); console.log("FALHA", cenario, e.message.split("\n")[0]); }
    await ctx.close();
  }
  /* 4. A ficha clássica com as oito ligadas: abrir a aba Buffs (a lista e o delta dos estados). */
  for (const cenario of ["base", "oito"]) {
    const { ctx, p } = await abre(cenario, false);
    try {
      await medir(p, "clássica: abrir a aba Buffs", cenario, '[data-afty-aba="buffs"]', '[data-afty-aba="buffs"][aria-selected="true"]');
    } catch (e) { out.erros.push(`classica ${cenario}: ${e.message.split("\n")[0]}`); console.log("FALHA clássica", cenario, e.message.split("\n")[0]); }
    await ctx.close();
  }
}
await browser.close();
fs.writeFileSync(`${DIR}/perf-${new URL(BASE).port}.json`, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ erros: out.erros }));
