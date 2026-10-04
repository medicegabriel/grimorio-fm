import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome', ignoreDefaultArgs: ['--hide-scrollbars'] });
const context = await browser.newContext({ viewport: { width: 390, height: 1000 }, isMobile: true, hasTouch: true });
const page = await context.newPage();
await page.goto('http://127.0.0.1:5173/afty', { waitUntil: 'networkidle' });
await page.evaluate(async () => {
  const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
  const feto = createBlankAfty();
  feto.id = 'lote03-feto'; feto.name = 'Lote 03 Feto'; feto.rulesVersion = 'afty';
  feto.core.nd = 5; feto.core.origem = { id: 'feto_amaldicoado_hibrido', anatomias: ['instinto_sanguinario'] };
  localStorage.setItem('fm_creatures_afty_v1', JSON.stringify([feto]));
});
await page.goto('http://127.0.0.1:5173/afty', { waitUntil: 'networkidle' });
await page.getByText('Lote 03 Feto', { exact: true }).click();
await page.getByRole('tab', { name: 'Ações', exact: true }).waitFor();
const largura = async (tag) => {
  const r = await page.evaluate(() => {
    const W = document.documentElement.clientWidth;
    const largos = [...document.querySelectorAll('body *')].map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.right > W + 1 && r.width > 0)
      .map(({ el, r }) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} right=${Math.round(r.right)} w=${Math.round(r.width)}`);
    return { scroll: document.documentElement.scrollWidth, W, largos: largos.slice(0, 8) };
  });
  console.log(tag, JSON.stringify(r, null, 1));
};
await largura('acoes');
await page.getByRole('tab', { name: 'Buffs', exact: true }).click();
await page.waitForTimeout(500);
await largura('buffs-antes');
await page.getByRole('button', { name: 'Em Combate', exact: true }).first().click();
await page.waitForTimeout(500);
await largura('buffs-em-combate');
await browser.close();
