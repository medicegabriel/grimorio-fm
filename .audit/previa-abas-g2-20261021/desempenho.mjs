/* PRÉVIA DAS TRÊS ABAS: desempenho no build de PRODUÇÃO da prévia, comparado com o G2 sem a prop (as abas de sempre), nas mesmas fichas
   densas. Cada operação: do disparo até dois quadros pintados (performance.now + requestAnimationFrame duplo), três repetições, mediana e
   máximo, e as tarefas longas (PerformanceObserver longtask). Amostra local, não promessa de fluidez universal. */
import fs from "node:fs";
import { BASE, DIR, navegador } from "./lib.mjs";

const ops = {
  "ir a Ações (de Habilidades)": `document.querySelector('[data-afty-aba="habilidades"]').click()|||document.querySelector('[data-afty-aba="acoes"]').click()`,
  "voltar a Ações (de Perícias)": `document.querySelector('[data-afty-aba="pericias"]').click()|||document.querySelector('[data-afty-aba="acoes"]').click()`,
  "ir a Perícias": `document.querySelector('[data-afty-aba="acoes"]').click()|||document.querySelector('[data-afty-aba="pericias"]').click()`,
  "ir a Equipamentos": `document.querySelector('[data-afty-aba="acoes"]').click()|||document.querySelector('[data-afty-aba="equipamentos"]').click()`,
  "abrir o detalhe de um Feitiço": `document.querySelector('[data-afty-aba="acoes"]').click()|||(document.querySelector('[data-m-linha^="feitico:"] .m-linha-nome') ?? document.querySelector('.afty-feitico > summary'))?.click()`,
  "rolar o Acerto do Ataque Básico": `document.querySelector('[data-afty-aba="acoes"]').click()|||(document.querySelector('[data-m-linha="dano:basico"] button.afty-rolavel') ?? document.querySelector('[id="afty-item-dano:basico"] button.afty-rolavel')).click()`,
  "mudar a sessão com Ações aberta (Em Combate)": `document.querySelector('[data-afty-aba="acoes"]').click()|||document.querySelector('button.e-combate').click()`,
};

async function medir(ficha, modo) {
  const ctx = await navegador.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.addInitScript(() => { window.__lt = []; try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push(e.duration))).observe({ type: "longtask", buffered: true }); } catch { /* sem suporte */ } });
  await p.goto(`${BASE}/?ficha=${ficha}&tema=escuro${modo ? `&modo=${modo}` : ""}`, { waitUntil: "domcontentloaded" });
  await p.locator("#afty-ficha").waitFor();
  await p.waitForTimeout(800);
  /* As três abas visitadas antes de medir. */
  for (const id of ["acoes", "pericias", "equipamentos", "acoes"]) { await p.locator(`[data-afty-aba="${id}"]`).click(); await p.waitForTimeout(250); }
  const out = {};
  for (const [nome, par] of Object.entries(ops)) {
    const [prepara, acao] = par.split("|||");
    const tempos = [];
    const tarefas = [];
    for (let i = 0; i < 3; i++) {
      await p.evaluate((js) => { new Function(js)(); }, prepara);
      await p.waitForTimeout(350);
      const r = await p.evaluate(async (js) => {
        window.__lt.length = 0;
        const t0 = performance.now();
        new Function(js)();
        await new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)));
        const ms = performance.now() - t0;
        await new Promise((ok) => setTimeout(ok, 120));
        return { ms, lt: [...window.__lt] };
      }, acao);
      tempos.push(r.ms);
      tarefas.push(...r.lt);
      await p.waitForTimeout(250);
    }
    tempos.sort((a, b) => a - b);
    out[nome] = { mediana: Math.round(tempos[1]), maximo: Math.round(tempos[2]), tarefasLongas: tarefas.length, maiorTarefa: tarefas.length ? Math.round(Math.max(...tarefas)) : 0 };
  }
  out.nosDoDom = await p.evaluate(() => document.querySelectorAll("*").length);
  await ctx.close();
  return out;
}

const resultado = { geradoEm: new Date().toISOString(), base: BASE, fichas: {} };
for (const ficha of ["mesa", "conjurador", "arsenal"]) {
  resultado.fichas[ficha] = { previa: await medir(ficha, null), atual: await medir(ficha, "g2-sem-previa") };
  console.log(`# ${ficha}`);
  for (const nome of Object.keys(ops)) {
    const a = resultado.fichas[ficha].previa[nome];
    const b = resultado.fichas[ficha].atual[nome];
    console.log(`  ${nome.padEnd(48)} prévia ${String(a.mediana).padStart(4)} / ${String(a.maximo).padStart(4)} ms (longas ${a.tarefasLongas}, maior ${a.maiorTarefa})   atual ${String(b.mediana).padStart(4)} / ${String(b.maximo).padStart(4)} ms (longas ${b.tarefasLongas}, maior ${b.maiorTarefa})`);
  }
  console.log(`  nós do DOM com as três abas visitadas: prévia ${resultado.fichas[ficha].previa.nosDoDom}, atual ${resultado.fichas[ficha].atual.nosDoDom}`);
}
fs.writeFileSync(`${DIR}desempenho.json`, JSON.stringify(resultado, null, 2));
await navegador.close();
