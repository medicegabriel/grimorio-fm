import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
const destino = 'C:/Projetos/Grimorio/_backup-sync/2026-10-12';
const pacotes = ['olhinhos-lu', 'stark', 'talentos-iniciais'].map(id => JSON.parse(readFileSync(`addons/${id}.json`, 'utf8')));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = [];
try {
  for (const sistema of ['afty', 'player']) for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, hasTouch: width === 390 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:5297/${sistema}`, { waitUntil: 'networkidle' });
    await page.evaluate(async ({ sistema, pacotes }) => {
      const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
      const c = createBlankAfty();
      Object.assign(c, { id: 'teste-sync-github', name: 'Teste Integração GitHub', rulesVersion: sistema, addons: pacotes, ataqueBasicoId: 'amaldicoado', attrMethod: 'fixos' });
      c.core.nd = 13;
      c.attributes = { forca: 14, destreza: 14, constituicao: 14, inteligencia: 18, sabedoria: 14, presenca: 14 };
      c.especializacoes = [{ id: 'conjurador', nivel: 13 }];
      c.aptidoes = { dom: 3, bar: 3, au: 1, cl: 3, er: 0 };
      c.aptidoesAmaldicoadas = ['tecnicas_de_barreira', 'expansao_de_dominio_incompleta', 'expansao_de_dominio_completa'];
      c.dominios = [{ id: 'd1', nome: 'Domínio de Integração', versao: 'completa', efeitos: [] }];
      localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c]));
    }, { sistema, pacotes });
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByText('Teste Integração GitHub', { exact: true }).click();
    await page.locator('button[title="Editar no criador"]').waitFor();
    await page.screenshot({ path: `${destino}/ficha-${sistema}-${width}.png` });
    await page.locator('button[title="Editar no criador"]').click();
    await page.getByRole('tab', { name: 'Habilidades', exact: true }).click();
    await page.waitForTimeout(400);
    if (!await page.getByText('Domínio de Integração', { exact: true }).count()) throw Error('Expansão ausente no criador');
    await page.screenshot({ path: `${destino}/criador-${sistema}-${width}.png` });
    const horizontal = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    report.push({ sistema, width, errors, horizontal, dominio: await page.getByText('Domínio de Integração', { exact: true }).count() });
    if (errors.length || horizontal) throw Error(JSON.stringify(report.at(-1)));
    await context.close();
  }
} finally {
  writeFileSync(`${destino}/browser.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(JSON.stringify(report, null, 2));
