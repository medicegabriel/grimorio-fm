import { register } from 'node:module';
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const R = new URL('../../src/systems/afty/', import.meta.url).href;
const { deriveAfty } = await import(R + 'afty-derive.js');
const { createBlankAfty } = await import(R + 'afty-schema.js');
const { createBlankFeitico } = await import(R + 'afty-feiticos.js');
const { aplicarAddons } = await import(R + 'afty-addons.js');
aplicarAddons([]);
const browser = await chromium.launch({ channel: 'chrome', ignoreDefaultArgs: ['--hide-scrollbars'] });
const resultados = [];
try {
 for (const sistema of ['player', 'afty']) {
  const c = createBlankAfty();
  c.id = 'cx1-passiva'; c.name = 'CX1 Passiva Salva'; c.rulesVersion = sistema;
  c.core.nd = 20; c.core.origem = { id: 'inato' }; c.especializacoes = [{ id: 'conjurador', nivel: 20 }];
  c.feiticos = [{ ...createBlankFeitico(), nome: 'Defesa CX1', tipo: 'passivo', nivel: 5, categoriaPassivo: 'defesa', efeitosPassivo: [{ canal: 'defesa', expr: '4' }] }];
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(({ c, sistema }) => { if (!localStorage.getItem('cx1-seeded')) {
   localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c])); localStorage.setItem('cx1-seeded', '1');
  } }, { c, sistema });
  const page = await context.newPage();
  const erros = []; page.on('pageerror', e => erros.push(e.message));
  await page.goto(`http://127.0.0.1:5188/${sistema}`, { waitUntil: 'networkidle' });
  await page.getByText(c.name, { exact: true }).click();
  await page.getByTitle('Editar no criador', { exact: true }).press('Enter');
  await page.getByRole('tab', { name: 'Habilidades', exact: true }).click();
  console.log('HABILIDADES', sistema, (await page.locator('body').innerText()).slice(-2400));
  if (!await page.getByRole('button', { name: 'Usar este valor', exact: true }).count()) await page.getByText('Defesa CX1', { exact: true }).click();
  const valor = page.getByText('Valor calculado', { exact: true }).locator('..');
  assert.match(await valor.innerText(), /\+3 DEF/);
  const antes = await page.evaluate(sistema => JSON.parse(localStorage.getItem(`fm_creatures_${sistema}_v1`))[0].feiticos[0].efeitosPassivo, sistema);
  assert.equal(antes[0].expr, '4');
  await page.getByRole('button', { name: 'Usar este valor', exact: true }).press('Enter');
  await valor.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `.audit/cx1-20261029/${sistema}-passiva.png` });
  await page.getByRole('button', { name: 'Salvar Alterações', exact: true }).press('Enter');
  const depois = await page.evaluate(sistema => JSON.parse(localStorage.getItem(`fm_creatures_${sistema}_v1`))[0], sistema);
  assert.deepEqual(depois.feiticos[0].efeitosPassivo, [{ canal: 'defesa', expr: '3' }]);
  assert.equal(deriveAfty(c).defesa - deriveAfty(depois).defesa, 1);
  assert.deepEqual(erros, []);
  resultados.push({ sistema, antigoPreservado: true, calculadora: 3, efeitoSalvo: 3, erros });
  await context.close();
 }
} finally { await writeFile('.audit/cx1-20261029/browser-passivas-resultados.json', JSON.stringify(resultados, null, 2)); await browser.close(); }
