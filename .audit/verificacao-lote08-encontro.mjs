/* Lote 08: a lista de quem pode entrar num Encontro do Afty, por motor.
   Uso: PORTA=5180 node .audit/verificacao-lote08-encontro.mjs */
import { chromium } from 'playwright';
const PORTA = process.env.PORTA || '5173';
const BASE = `http://127.0.0.1:${PORTA}`;
const browser = await chromium.launch({ channel: 'chrome', ignoreDefaultArgs: ['--hide-scrollbars'] });
const relatorio = {};
for (const rota of ['afty', 'player']) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto(`${BASE}/${rota}`, { waitUntil: 'networkidle' });
  await page.evaluate(async (rota) => {
    const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
    const e3 = (await import('/src/data/enciclopedia-digital-0.3.json')).default;
    const legado = { ...e3.creatures[0], id: 'lote08-legado', name: 'Lote 08 Legado', folderId: null, isBuiltIn: false };
    const daRota = { ...createBlankAfty(), id: 'lote08-darota', name: 'Lote 08 Da Rota', rulesVersion: rota };
    /* Uma criatura que entrou no /Player antes de 2026-10-03: continua podendo lutar. */
    const outroLado = { ...createBlankAfty(), id: 'lote08-outro', name: 'Lote 08 Outro Lado', rulesVersion: rota === 'afty' ? 'player' : 'afty' };
    localStorage.setItem(`fm_creatures_${rota}_v1`, JSON.stringify([legado, daRota, outroLado]));
  }, rota);
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Encontros' }).first().click();
  await page.getByRole('button', { name: /Novo Encontro/ }).first().click();
  await page.waitForTimeout(800);
  const conta = (n) => page.locator(`button[aria-label="Adicionar ${n}"]`).count();
  relatorio[rota] = {
    erros,
    legado: await conta('Lote 08 Legado'),
    daRota: await conta('Lote 08 Da Rota'),
    outroLado: await conta('Lote 08 Outro Lado'),
  };
  await page.screenshot({ path: `.audit/verificacao-lote08-shots/encontro-${rota}.png` });
  await context.close();
}
await browser.close();
console.log(JSON.stringify(relatorio, null, 2));
