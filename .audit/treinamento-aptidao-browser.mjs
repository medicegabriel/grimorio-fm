import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

await mkdir('.audit/treinamento-aptidao-shots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const report = [];
try {
  for (const sistema of ['player', 'afty']) {
    for (const largura of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      const route = sistema === 'player' ? 'Player' : 'Afty';
      const name = 'Teste Treinamento Aptidão ' + sistema;
      const storageKey = 'fm_creatures_' + sistema + '_v1';
      await page.goto('http://127.0.0.1:5173/' + route, { waitUntil: 'networkidle' });
      await page.evaluate(async ({ sistema, name, storageKey }) => {
        const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
        const f = createBlankAfty();
        f.id = 'teste-treinamento-aptidao';
        f.name = name;
        f.rulesVersion = sistema;
        f.core.nd = 9;
        f.core.origem = { id: 'inato' };
        f.especializacoes = [{ id: 'conjurador', nivel: 9 }];
        localStorage.setItem(storageKey, JSON.stringify([f]));
      }, { sistema, name, storageKey });
      await page.reload({ waitUntil: 'networkidle' });
      const edit = async () => {
        await page.getByText(name, { exact: true }).first().click();
        await page.locator('button[title="Editar no criador"]').click();
      };
      const aba = async (name) => {
        const direct = page.getByRole('tab', { name, exact: true });
        if (await direct.count()) await direct.click();
        else {
          await page.getByRole('tab', { name: 'Outros', exact: true }).click();
          await page.getByRole('menuitem', { name, exact: true }).click();
        }
      };
      const row = () => page.getByRole('button', { name: /^Treinamento para Aptidão Vaga/ }).locator('..').locator('..');
      const contador = (name) => row().locator('span').filter({ has: page.locator('span', { hasText: new RegExp('^' + name + '$') }) }).filter({ has: page.getByRole('button', { name: 'Aumentar', exact: true }) }).last();
      const verificarLimite = async (n) => {
        await aba('Aptidões');
        const text = await page.locator('[title="Aptidões escolhidas / permitidas (progressão e efeitos da ficha)"]').innerText();
        assert.match(text.replace(/\s+/g, ' '), new RegExp('0 / ' + n + '(?: |$)'));
        await aba('Interlúdios');
      };
      await edit();
      await aba('Interlúdios');
      await page.getByRole('button', { name: 'Escolher Treinamento para Aptidão', exact: true }).click();
      if (sistema === 'player') {
        assert.match(await row().innerText(), /CD 16/);
        await verificarLimite(8);
        await contador('Interlúdios').getByRole('button', { name: 'Aumentar', exact: true }).click();
        await row().getByRole('button', { name: '2 Sucessos', exact: true }).click();
        await contador('Ganhos').getByRole('button', { name: 'Aumentar', exact: true }).click();
        assert.equal(await contador('Ganhos').getByRole('button', { name: 'Aumentar', exact: true }).isDisabled(), true);
        await verificarLimite(9);
      } else {
        assert.match(await row().innerText(), /1 Foco/);
        await verificarLimite(1);
      }
      await row().getByRole('button', { name: /^Treinamento para Aptidão Vaga/ }).click();
      assert.match(await row().innerText(), /cujos requisitos sejam atendidos/);
      await row().scrollIntoViewIfNeeded();
      const horizontal = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(horizontal, false);
      await page.screenshot({ path: '.audit/treinamento-aptidao-shots/' + sistema + '-' + largura + '-n9.png' });
      await aba(sistema === 'player' ? 'Identidade' : 'Informações');
      const nivel = page.locator('label').filter({ hasText: sistema === 'player' ? /^Nível/ : 'Nível (ND)' }).locator('..').getByRole('spinbutton');
      await nivel.fill('10');
      await nivel.press('Enter');
      await aba('Interlúdios');
      if (sistema === 'player') {
        assert.match(await row().innerText(), /CD 17/);
        await contador('Ganhos').getByRole('button', { name: 'Aumentar', exact: true }).click();
        assert.equal(await contador('Ganhos').getByRole('button', { name: 'Aumentar', exact: true }).isDisabled(), true);
        await verificarLimite(11);
      } else {
        await row().getByRole('button', { name: '2ª vez', exact: true }).click();
        await verificarLimite(2);
      }
      await page.getByRole('button', { name: 'Salvar Alterações', exact: true }).click();
      const saved = await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)).find(f => f.id === 'teste-treinamento-aptidao'), storageKey);
      assert.equal(saved.treinosEspeciais.filter(t => t.id === 'tes_aptidao').length, 2);
      if (sistema === 'player') assert.deepEqual(saved.treinoEspecialProgresso.tes_aptidao, { interludios: 2, sucessos: 2 });
      await page.reload({ waitUntil: 'networkidle' });
      await edit();
      await aba('Interlúdios');
      await verificarLimite(sistema === 'player' ? 11 : 2);
      assert.deepEqual(errors, []);
      report.push({ sistema, largura, limiteN9: sistema === 'player' ? 9 : 1, limiteN10: sistema === 'player' ? 11 : 2, tentativasSemGanho: sistema === 'player', persistencia: true, semRolagemHorizontal: true, errors });
      await context.close();
    }
  }
  await writeFile('.audit/treinamento-aptidao-report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} catch (error) {
  console.error(error);
  for (const context of browser.contexts()) for (const page of context.pages()) {
    console.error((await page.locator('body').innerText()).slice(-12000));
    await page.screenshot({ path: '.audit/treinamento-aptidao-shots/falha.png' });
  }
  process.exitCode = 1;
} finally { await browser.close(); }

