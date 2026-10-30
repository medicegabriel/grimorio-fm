import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = [];
async function conferir(page, gatilho, nomes, toque = false) {
  if (toque) await gatilho.tap(); else await gatilho.hover();
  const painel = page.locator('.afty-fontes-flutuante');
  await painel.waitFor({ state: 'visible' });
  const texto = await painel.innerText();
  for (const nome of nomes) {
    if (!texto.includes(nome)) await page.screenshot({ path: '.audit/critico-fontes-falha.png' });
    assert.ok(texto.includes(nome), texto);
  }
  const r = await painel.boundingBox();
  const viewport = page.viewportSize();
  assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.width <= viewport.width + 1 && r.y + r.height <= viewport.height + 1, JSON.stringify(r));
  if (toque) await page.touchscreen.tap(1, 1); else await page.mouse.move(1, 1);
  await painel.waitFor({ state: 'hidden' });
}
try {
  for (const sistema of ['afty', 'player']) for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 1400 : 1000 }, hasTouch: width === 390 });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const erros = [];
    page.on('pageerror', e => erros.push(e.message));
    await page.goto('http://127.0.0.1:5301/' + sistema, { waitUntil: 'networkidle' });
    await page.evaluate(async sistema => {
      const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
      const { novaEntradaEquip } = await import('/src/systems/afty/afty-equipamentos.js');
      const c = createBlankAfty();
      c.id = 'teste-critico-fontes'; c.name = 'Teste de Fontes do Crítico'; c.rulesVersion = sistema;
      c.core.nd = 20; c.especializacoes = [{ id: 'combatente', nivel: 20 }];
      c.habilidades = ['cmb_critico_melhorado', 'cmb_critico_aperfeicoado'];
      c.equipamentos.itens = [novaEntradaEquip('arma', 'arm_espada_curta')];
      c.equipamentos.itens[0].equipado = true;
      c.core.tecnicaEfeitos = [{ canal: 'margemCriticoTR', alvo: 'reflexos', expr: '2' }];
      localStorage.setItem('fm_creatures_' + sistema + '_v1', JSON.stringify([c]));
    }, sistema);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByText('Teste de Fontes do Crítico', { exact: true }).click();
    await conferir(page, page.getByRole('button', { name: 'Crít. 18', exact: true }), ['Margem Base', 'Crítico Melhorado', 'Crítico Aperfeiçoado', '18'], width === 390);
    await conferir(page, page.getByRole('button', { name: 'Crít. 17', exact: true }), ['Margem da Arma', 'Crítico Melhorado', 'Crítico Aperfeiçoado', '17'], width === 390);
    if (width === 1440) {
      await page.getByRole('tab', { name: 'Perícias', exact: true }).click();
      const reflexos = page.locator('.afty-linha').filter({ has: page.locator('span[title="Reflexos"]') });
      await conferir(page, reflexos.getByRole('button', { name: '(18)', exact: true }), ['Margem Base', 'Técnica', '18']);
    }
    await page.locator('button[title="Editar no criador"]').click();
    await page.getByRole('tab', { name: 'Habilidades', exact: true }).click();
    await conferir(page, page.getByRole('button', { name: 'Crít. 18', exact: true }), ['Margem Base', 'Crítico Melhorado', 'Crítico Aperfeiçoado', '18'], width === 390);
    await conferir(page, page.getByRole('button', { name: 'Crít. 17', exact: true }), ['Margem da Arma', 'Crítico Melhorado', 'Crítico Aperfeiçoado', '17'], width === 390);
    await page.getByRole('button', { name: 'Crít. 17', exact: true }).scrollIntoViewIfNeeded();
    if (width === 390) await page.getByRole('button', { name: 'Crít. 17', exact: true }).tap();
    else await page.getByRole('button', { name: 'Crít. 17', exact: true }).hover();
    await page.screenshot({ path: '.audit/critico-fontes-' + sistema + '-' + width + '.png' });
    assert.deepEqual(erros, []);
    report.push({ sistema, width, fichaAtaques: true, fichaTR: width === 1440, criadorAtaques: true, painelDentroDaTela: true, erros });
    await context.close();
  }
} finally {
  fs.writeFileSync('.audit/critico-fontes-browser-report.json', JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(JSON.stringify(report));
