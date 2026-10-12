import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('.audit/terceira-classe-shots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', ignoreDefaultArgs: ['--hide-scrollbars'] });
const report = [];
try {
  for (const largura of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
    const page = await ctx.newPage();
    page.setDefaultTimeout(15000);
    const erros = [];
    page.on('pageerror', e => erros.push(e.message));
    await page.goto('http://127.0.0.1:5173/Afty', { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
      const f = createBlankAfty();
      f.id = 'teste-terceira-classe'; f.name = 'Teste Terceira Classe'; f.rulesVersion = 'afty';
      f.core.nd = 30; f.core.origem = { id: 'inato' };
      f.especializacoes = [{ id: 'lutador', nivel: 17 }, { id: 'combatente', nivel: 13 }];
      localStorage.setItem('fm_creatures_afty_v1', JSON.stringify([f]));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByText('Teste Terceira Classe', { exact: true }).first().click();
    await page.locator('button[title="Editar no criador"]').click();
    const abrirClasses = () => page.getByRole('tab', { name: 'Especializações', exact: true }).click();
    const grupo = page.getByRole('group', { name: 'Especializações', exact: true });
    const ativo = () => grupo.locator('button[aria-pressed="true"]');
    const mudarNivel = async (n) => {
      await page.getByRole('tab', { name: 'Informações', exact: true }).click();
      const campo = page.locator('label').filter({ hasText: 'Nível (ND)' }).locator('..').getByRole('spinbutton');
      await campo.fill(String(n)); await campo.press('Enter');
      await abrirClasses();
    };
    await abrirClasses();
    assert.equal(await ativo().count(), 2);
    assert.equal(await grupo.getByRole('button', { name: 'Conjurador', exact: true }).isDisabled(), true);
    await mudarNivel(31);
    assert.equal(await grupo.getByRole('button', { name: 'Conjurador', exact: true }).isEnabled(), true);
    await grupo.getByRole('button', { name: 'Conjurador', exact: true }).click();
    assert.equal(await ativo().count(), 3);
    assert.equal(await grupo.getByRole('button', { name: 'Suporte', exact: true }).isDisabled(), true);
    const divisao = await grupo.innerText();
    await grupo.getByRole('button', { name: 'Aumentar nível em Conjurador', exact: true }).click();
    await grupo.getByRole('button', { name: 'Diminuir nível em Conjurador', exact: true }).click();
    assert.equal(await grupo.innerText(), divisao);
    await mudarNivel(30);
    assert.equal(await ativo().count(), 2);
    await mudarNivel(31);
    assert.equal(await ativo().count(), 3);
    assert.equal(await grupo.innerText(), divisao);
    await page.getByRole('tab', { name: 'Identidade', exact: true }).click();
    const seletor = page.locator('select').filter({ has: page.locator('option[value="herdado"]') });
    await seletor.selectOption('herdado');
    await abrirClasses();
    assert.equal(await ativo().count(), 3);
    await grupo.scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: '.audit/terceira-classe-shots/afty-' + largura + '-nd31.png' });
    assert.deepEqual(erros, []);
    report.push({ largura, nd30: 2, nd31: 3, quartaBloqueada: true, ajustes: true, divisaoRestaurada: true, origemPreservada: true, erros });
    await ctx.close();
  }
  await writeFile('.audit/terceira-classe-report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
