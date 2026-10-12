import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5173';
const routes = [
  { path: '/', ns: '', all: 'Todas as Criaturas' },
  { path: '/Afty', ns: '_afty', all: 'Todas as Criaturas' },
  { path: '/Player', ns: '_player', all: 'Todos os Personagens' },
];
const browser = await chromium.launch({ channel: 'chrome' });
const report = [];
await mkdir('.audit/ultima-pasta-shots', { recursive: true });
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, isMobile: width === 390, hasTouch: width === 390 });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    const builtinName = await page.evaluate(async () => {
      const { COMPENDIUM } = await import('/src/fm-compendium.js');
      const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
      for (const sistema of ['', 'afty', 'player']) {
        const suffix = sistema ? '_' + sistema : '';
        const folders = [{ id: 'fld_pasta-a' + suffix, name: 'Pasta A' }, { id: 'fld_pasta-b' + suffix, name: 'Pasta B' }];
        const creatures = ['A', 'B', 'Solta'].map((label, i) => {
          const creature = sistema ? createBlankAfty() : structuredClone(COMPENDIUM[0]);
          return { ...creature, id: 'ficha-' + i + suffix, name: 'Ficha ' + label, rulesVersion: sistema || '2.5.2', isBuiltIn: false, folderId: folders[i]?.id ?? null };
        });
        localStorage.setItem('fm_folders' + suffix + '_v1', JSON.stringify(folders));
        localStorage.setItem('fm_creatures' + suffix + '_v1', JSON.stringify(creatures));
      }
      return COMPENDIUM[0].name;
    });
    const select = async name => {
      if (width === 390) await page.getByRole('button', { name: 'Abrir menu de pastas', exact: true }).click();
      await page.getByRole('button').filter({ has: page.getByText(name, { exact: true }) }).click();
    };
    const heading = name => page.getByRole('heading', { name, exact: true }).waitFor({ state: 'visible' });
    const returnFrom = async (name, route) => {
      await page.getByText(name, { exact: true }).first().click();
      await page.getByRole('button', { name: route.ns ? 'Voltar' : 'Voltar ao Dashboard', exact: true }).click();
    };
    const persisted = route => page.evaluate(ns => JSON.parse(localStorage.getItem('fm_dashboard_view' + ns + '_v1')), route.ns);
    for (const route of routes) {
      await page.goto(base + route.path, { waitUntil: 'domcontentloaded' });
      await heading(route.all);
      await select('Pasta A');
      await heading('Pasta A');
      await returnFrom('Ficha A', route);
      await heading('Pasta A');
      assert.equal(await page.getByText('Ficha B', { exact: true }).count(), 0);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await heading('Pasta A');
      await select('Pasta B');
      await returnFrom('Ficha B', route);
      await heading('Pasta B');
      if (route.ns) {
        await page.getByText('Ficha B', { exact: true }).first().click();
        await page.locator('button[title="Editar no criador"]').click();
        await page.getByRole('button', { name: 'Voltar', exact: true }).click();
        await heading('Pasta B');
      }
      await select('Sem Pasta');
      await returnFrom('Ficha Solta', route);
      await heading('Sem Pasta');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await heading('Sem Pasta');
      await select('Todas');
      await returnFrom('Ficha A', route);
      await heading(route.all);
      if (!route.ns) {
        await select('Criaturas Base');
        await returnFrom(builtinName, route);
        await heading('Criaturas Base do Sistema');
        await page.reload({ waitUntil: 'domcontentloaded' });
        await heading('Criaturas Base do Sistema');
      }
      const last = route.ns === '_afty' ? 'B' : 'A';
      await select('Pasta ' + last);
      await heading('Pasta ' + last);
      assert.deepEqual(await persisted(route), { type: 'folder', folderId: 'fld_pasta-' + last.toLowerCase() + route.ns });
      await page.screenshot({ path: '.audit/ultima-pasta-shots/' + (route.ns || 'publico') + '-' + width + '.png' });
      report.push({ width, route: route.path, returnFromSheet: true, reload: true, switchFolder: true, unfiled: true, all: true, editor: !!route.ns, builtins: !route.ns });
    }
    for (const route of routes) {
      await page.goto(base + route.path, { waitUntil: 'domcontentloaded' });
      await heading(route.ns === '_afty' ? 'Pasta B' : 'Pasta A');
    }
    for (const raw of ['{', 'null', '[]', '{"type":"invalido"}', '{"type":"folder","folderId":"fld_apagada"}', '{"type":"builtins"}']) {
      await page.evaluate(value => localStorage.setItem('fm_dashboard_view_player_v1', value), raw);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await heading('Todos os Personagens');
      assert.deepEqual(await persisted(routes[2]), { type: 'all', folderId: null });
    }
    await select('Pasta B');
    await page.evaluate(() => localStorage.setItem('fm_folders_player_v1', JSON.stringify([{ id: 'fld_pasta-a_player', name: 'Pasta A' }])));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await heading('Todos os Personagens');
    assert.deepEqual(await persisted(routes[2]), { type: 'all', folderId: null });

    await page.evaluate(() => {
      const get = Storage.prototype.getItem;
      const set = Storage.prototype.setItem;
      Storage.prototype.getItem = function(key) { if (key.startsWith('fm_dashboard_view')) throw new Error('Storage indisponível no teste'); return get.call(this, key); };
      Storage.prototype.setItem = function(key, value) { if (key.startsWith('fm_dashboard_view')) throw new Error('Storage indisponível no teste'); return set.call(this, key, value); };
    });
    await select('Pasta A');
    await returnFrom('Ficha A', routes[2]);
    await heading('Pasta A');
    assert.deepEqual(errors, []);
    report.push({ width, isolatedRoutes: true, invalidSavedViews: 6, deletedFolder: true, unavailableStorage: true, errors });
    await context.close();
  }
  await writeFile('.audit/ultima-pasta-report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
