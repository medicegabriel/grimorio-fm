import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('.audit/gerais-progressao-shots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = [];
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, isMobile: width === 390, hasTouch: width === 390 });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const name = 'Teste Progressão Gerais ' + width;
    await page.goto('http://127.0.0.1:5173/Afty', { waitUntil: 'networkidle' });
    await page.evaluate(async name => {
      const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
      const c = createBlankAfty();
      c.id = 'teste-gerais-progressao';
      c.name = name;
      c.core.nd = 26;
      c.core.origem = { id: 'inato' };
      c.especializacoes = [{ id: 'conjurador', nivel: 26 }];
      c.habilidadesGerais = [...Array(4).fill('ger_especializacao'), ...Array(4).fill('ger_aptidao')];
      localStorage.setItem('fm_creatures_afty_v1', JSON.stringify([c]));
    }, name);
    await page.reload({ waitUntil: 'networkidle' });
    const edit = async () => {
      await page.getByText(name, { exact: true }).first().click();
      await page.locator('button[title="Editar no criador"]').click();
    };
    const tab = async name => {
      const direct = page.getByRole('tab', { name, exact: true });
      if (await direct.count()) await direct.click();
      else {
        await page.getByRole('tab', { name: 'Outros', exact: true }).click();
        await page.getByRole('menuitem', { name, exact: true }).click();
      }
    };
    const setNivel = async nd => {
      await tab('Informações');
      const input = page.locator('label').filter({ hasText: 'Nível (ND)' }).locator('..').getByRole('spinbutton');
      await input.fill(String(nd));
      await input.press('Enter');
    };
    const budgets = async expected => {
      await tab('Especializações');
      const habilidade = await page.locator('[title="Habilidades escolhidas / permitidas (vêm da Habilidade Geral Especialização)"]').innerText();
      assert.match(habilidade.replace(/\s+/g, ' '), new RegExp('/ ' + expected + '(?: |$)'));
      await tab('Aptidões');
      const aptidao = await page.locator('[title="Aptidões escolhidas / permitidas (progressão e efeitos da ficha)"]').innerText();
      assert.match(aptidao.replace(/\s+/g, ' '), new RegExp('/ ' + expected + '(?: |$)'));
    };
    const grupos = (compras, teto) => ['Especialização', 'Aptidão'].map(name => page.getByRole('group', { name: name + ': faixa ' + compras + ' de ' + teto, exact: true }));
    const comprar = async (compras, teto, n) => {
      await tab('Habilidades');
      for (const group of grupos(compras, teto)) await group.getByRole('button', { name: n + 'ª vez', exact: true }).click();
    };
    await edit();
    await budgets(20);
    await tab('Habilidades');
    for (const group of grupos(4, 4)) assert.equal(await group.getByRole('button', { name: '5ª vez', exact: true }).count(), 0);
    for (const nome of ['Especialização', 'Aptidão']) {
      const row = page.getByRole('button', { name: 'Remover ' + nome, exact: true }).locator('..').locator('..');
      await row.getByRole('button', { expanded: false }).click();
      const text = await row.innerText();
      assert.match(text, /Maestria, arredondada para baixo/);
      assert.match(text, /Maestria do usuário, arredondada para cima/);
      assert.doesNotMatch(text, /Grau Numérico/);
    }
    await setNivel(31);
    await budgets(20);
    await comprar(4, 5, 5);
    await budgets(25);
    await setNivel(35);
    await budgets(25);
    await setNivel(36);
    await budgets(30);
    await setNivel(5);
    await budgets(4);
    await tab('Habilidades');
    for (const group of grupos(2, 2)) assert.equal(await group.count(), 1);
    await setNivel(31);
    await budgets(25);
    await tab('Habilidades');
    for (const group of grupos(5, 5)) assert.equal(await group.count(), 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.getByRole('button', { name: 'Remover Aptidão', exact: true }).locator('..').locator('..').scrollIntoViewIfNeeded();
    await page.screenshot({ path: '.audit/gerais-progressao-shots/afty-' + width + '.png' });
    await page.getByRole('button', { name: 'Salvar Alterações', exact: true }).click();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('fm_creatures_afty_v1')).find(c => c.id === 'teste-gerais-progressao'));
    assert.equal(saved.core.nd, 31);
    for (const id of ['ger_especializacao', 'ger_aptidao']) assert.equal(saved.habilidadesGerais.filter(x => x === id).length, 5);
    await page.reload({ waitUntil: 'networkidle' });
    await edit();
    await budgets(25);
    assert.deepEqual(errors, []);
    report.push({ width, nd26: 20, nd31: 25, nd35: 25, nd36: 30, nd5: 4, persistencia: true, semRolagemHorizontal: true, errors });
    await context.close();
  }
  await writeFile('.audit/gerais-progressao-report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
