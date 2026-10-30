import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1500 } });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:5305/Afty', { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
      const c = createBlankAfty(); c.id = 'votos-previa'; c.name = 'Prévia de Votos'; c.core.nd = 20;
      const mecanico = (id, nome, efeitos = []) => ({ id, nome, narrativa: 'Um compromisso com a proteção da vila.', beneficio: { texto: 'Recebe proteção enquanto guarda a vila.', efeitos }, maleficio: { texto: 'Não pode abandonar sua vigília.', efeitos: [] } });
      c.votos = { mecanicos: [mecanico('previa-1', 'Vigília do Guardião', [{ canal: 'defesa', expr: '2' }]), mecanico('previa-2', 'Promessa de Retorno')], contratuais: [{ id: 'contrato-previa', texto: 'Acordo com os aliados para proteger a vila.' }] };
      localStorage.setItem('fm_creatures_afty_v1', JSON.stringify([c]));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByText('Prévia de Votos', { exact: true }).click();
    await page.locator('button[title="Editar no criador"]').click();
    await page.getByRole('tab', { name: 'Outros', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Votos', exact: true }).click();
    await page.getByRole('region', { name: 'Votos Mecânicos' }).getByRole('button', { name: /Vigília do Guardião/ }).click();
    const card = page.getByRole('heading', { name: 'Votos', exact: true }).locator('..').locator('..');
    await card.evaluate(el => {
      const header = document.querySelector('header');
      window.scrollTo(0, scrollY + el.getBoundingClientRect().top - header.getBoundingClientRect().height - 16);
    });
    await page.mouse.move(width - 10, 1450);
    await card.screenshot({ path: `.audit/votos-ui/resultado-${width}.png`, animations: 'disabled' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await context.close();
  }
} finally { await browser.close(); }
console.log('Capturas finais em 1440 e 390 px.');
