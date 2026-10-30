import { abrir } from '../integracao-g2/harness.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const pasta = new URL('./', import.meta.url);
const resultados = [];
for (const id of ['megumi', 'minamoto', 'player30']) {
  const { browser, page, erros, ficha, sistema } = await abrir({ amostraId: id, preCondicao: f => { f.portraitUrl = null; } });
  try {
    page.setDefaultTimeout(30000);
    const falhasRede = [];
    page.on("requestfailed", r => falhasRede.push({url:r.url(),erro:r.failure()?.errorText}));
    page.on("response", r => { if(r.status()>=400) falhasRede.push({url:r.url(),status:r.status()}); });
    await page.waitForTimeout(800);
    assert.equal(await page.locator('#afty-ficha .e-g2').count(), 0);
    assert.equal(await page.locator('link[href*="efeitos-g2.css"], style[data-vite-dev-id*="efeitos-g2.css"]').count(), 0);
    const sessaoKey = `fm_ficha_sessao_afty_v1:${ficha.id}`;
    const ler = () => page.evaluate(k => JSON.parse(localStorage.getItem(k)), sessaoKey);
    if (!(await ler())) { await page.getByRole("button", {name: "Próxima rodada", exact: true}).click(); await page.waitForTimeout(800); }
    const antes = await ler();
    assert.ok(antes && Number.isFinite(antes.hpAtual));
    for (const aba of ['habilidades', 'pericias', 'equipamentos', 'invocacoes', 'buffs', 'acoes']) {
      await page.locator(`[data-afty-aba="${aba}"]`).click();
      await page.waitForTimeout(180);
      assert.equal(await page.locator(`[data-afty-aba="${aba}"]`).getAttribute('aria-selected'), 'true');
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await page.screenshot({ path: new URL(`${id}-classica.png`, pasta).pathname.replace(/^\/([A-Z]:)/, '$1') });
    await page.getByRole('button', {name: 'Próxima rodada', exact: true}).click();
    await page.waitForTimeout(800);
    const depois = await ler();
    assert.equal(depois.rodada, antes.rodada + 1);
    await page.reload({waitUntil:'networkidle'});
    await page.getByText(ficha.name, { exact: true }).first().click();
    await page.waitForTimeout(800);
    const recarregada = await ler();
    assert.equal(recarregada.rodada, depois.rodada);
    assert.equal(recarregada.hpAtual, depois.hpAtual);
    assert.equal(recarregada.peAtual, depois.peAtual);
    await page.goto(`${process.env.BASE}/${sistema}?ficha-g2=1`, {waitUntil:'networkidle'});
    await page.getByText(ficha.name, { exact: true }).first().click();
    await page.waitForSelector('#afty-ficha .e-g2');
    await page.waitForTimeout(800);
    const previa = await ler();
    assert.equal(previa.hpAtual, depois.hpAtual);
    assert.equal(previa.peAtual, depois.peAtual);
    assert.equal(previa.rodada, depois.rodada);
    await page.goto(`${process.env.BASE}/${sistema}`, {waitUntil:'networkidle'});
    await page.getByText(ficha.name, { exact: true }).first().click();
    await page.waitForTimeout(800);
    assert.equal(await page.locator('#afty-ficha .e-g2').count(), 0);
    const final = await ler();
    assert.equal(final.hpAtual, depois.hpAtual);
    assert.equal(final.peAtual, depois.peAtual);
    assert.equal(final.rodada, depois.rodada);
    assert.deepEqual(erros.filter(e => e.startsWith('pageerror:')), []);
    resultados.push({id, sistema, abas:6, rodadaPersistida:final.rodada, recursosPreservados:true, previaG2:true, cssG2AusenteNaClassica:true, erros, falhasRede});
    console.log(id, "aprovado");
  } finally { await browser.close(); }
}
fs.writeFileSync(new URL('navegador.json',pasta),JSON.stringify(resultados,null,2));
console.log(JSON.stringify(resultados,null,2));




