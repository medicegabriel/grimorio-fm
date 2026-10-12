import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('.audit/gerais-aptidao-restaurada-shots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = [];
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, isMobile: width === 390, hasTouch: width === 390 });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const name = 'Teste Aptidão Restaurada ' + width;
    await page.goto('http://127.0.0.1:5173/Afty', { waitUntil: 'networkidle' });
    await page.evaluate(async name => {
      const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
      const c = createBlankAfty();
      c.id = 'teste-aptidao-restaurada';
      c.name = name;
      c.core.nd = 31;
      c.core.origem = { id: 'inato' };
      c.especializacoes = [{ id: 'conjurador', nivel: 31 }];
      c.habilidadesGerais = [...Array(5).fill('ger_especializacao'), ...Array(5).fill('ger_aptidao')];
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
    const budgets = async (esp, apt) => {
      await tab('Especializações');
      const habilidade = await page.locator('[title="Habilidades escolhidas / permitidas (vêm da Habilidade Geral Especialização)"]').innerText();
      assert.match(habilidade.replace(/\s+/g, ' '), new RegExp('/ ' + esp + '(?: |$)'));
      await tab('Aptidões');
      const aptidao = await page.locator('[title="Aptidões escolhidas / permitidas (progressão e efeitos da ficha)"]').innerText();
      assert.match(aptidao.replace(/\s+/g, ' '), new RegExp('/ ' + apt + '(?: |$)'));
    };
    const group = (nome, n) => page.getByRole('group', { name: nome + ': faixa ' + n + ' de ' + n, exact: true });
    await edit();
    for (const [nd, esp, apt, tetoEsp, tetoApt] of [
      [26, 20, 24, 4, 4], [31, 25, 24, 5, 4], [35, 25, 24, 5, 4],
      [36, 30, 30, 5, 5], [13, 9, 10, 3, 2], [21, 16, 18, 4, 3], [5, 4, 3, 2, 1],
    ]) {
      await setNivel(nd);
      await budgets(esp, apt);
      await tab('Habilidades');
      assert.equal(await group('Especialização', tetoEsp).count(), 1);
      if (tetoApt > 1) assert.equal(await group('Aptidão', tetoApt).count(), 1);
      else assert.equal(await page.getByRole('group', { name: /^Aptidão: faixa/ }).count(), 0);
      if (nd === 31 || nd === 35) {
        assert.equal(await group('Aptidão', 4).getByRole('button', { name: '5ª vez', exact: true }).count(), 0);
      }
      if (nd === 36) {
        await group('Aptidão', 5).getByRole('button', { name: '5ª vez', exact: true }).click();
        await budgets(30, 24);
        await tab('Habilidades');
        await page.getByRole('group', { name: 'Aptidão: faixa 4 de 5', exact: true }).getByRole('button', { name: '5ª vez', exact: true }).click();
        await budgets(30, 30);
      }
    }
    await setNivel(31);
    await budgets(25, 24);
    await tab('Habilidades');
    for (const nome of ['Especialização', 'Aptidão']) {
      const row = page.getByRole('button', { name: 'Remover ' + nome, exact: true }).locator('..').locator('..');
      await row.getByRole('button', { expanded: false }).click();
      const text = await row.innerText();
      if (nome === 'Aptidão') {
        assert.match(text, /1 \+ Grau Numérico/);
        assert.match(text, /Maestria do usuário, arredondada para baixo/);
        assert.doesNotMatch(text, /arredondada para cima/);
      } else {
        assert.match(text, /Maestria, arredondada para baixo/);
        assert.match(text, /Maestria do usuário, arredondada para cima/);
      }
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.getByRole('button', { name: 'Remover Aptidão', exact: true }).locator('..').locator('..').scrollIntoViewIfNeeded();
    await page.screenshot({ path: '.audit/gerais-aptidao-restaurada-shots/afty-' + width + '.png' });
    await page.getByRole('button', { name: 'Salvar Alterações', exact: true }).click();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('fm_creatures_afty_v1')).find(c => c.id === 'teste-aptidao-restaurada'));
    assert.equal(saved.core.nd, 31);
    for (const id of ['ger_especializacao', 'ger_aptidao']) assert.equal(saved.habilidadesGerais.filter(x => x === id).length, 5);
    await page.reload({ waitUntil: 'networkidle' });
    await edit();
    await budgets(25, 24);
    assert.deepEqual(errors, []);
    report.push({ width, especializacao: [20, 25, 30], aptidoes: [24, 24, 30], limitesIndependentes: true, quintaAptidaoPreservada: true, persistencia: true, semRolagemHorizontal: true, errors });
    await context.close();
  }
  await writeFile('.audit/gerais-aptidao-restaurada-report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
