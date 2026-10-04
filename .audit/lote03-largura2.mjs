import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome', ignoreDefaultArgs: ['--hide-scrollbars'] });
const context = await browser.newContext({ viewport: { width: 390, height: 1000 }, isMobile: true, hasTouch: true });
const page = await context.newPage();
await page.goto('http://127.0.0.1:5173/afty', { waitUntil: 'networkidle' });
await page.evaluate(async () => {
  const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
  const c = createBlankAfty(); c.id = 'x'; c.name = 'Ficha Vazia'; c.rulesVersion = 'afty';
  localStorage.setItem('fm_creatures_afty_v1', JSON.stringify([c]));
});
await page.goto('http://127.0.0.1:5173/afty', { waitUntil: 'networkidle' });
await page.getByText('Ficha Vazia', { exact: true }).click();
await page.getByRole('tab', { name: 'Buffs', exact: true }).click();
await page.waitForTimeout(600);
const r = await page.evaluate(() => {
  const W = document.documentElement.clientWidth;
  const ctl = [...document.querySelectorAll('.afty-estado-controle')].filter((el) => el.getBoundingClientRect().right > W + 1);
  return {
    scroll: document.documentElement.scrollWidth,
    estados: ctl.map((el) => (el.closest('.afty-estado-linha')?.innerText || el.parentElement?.innerText || '').replace(/\s+/g, ' ').slice(0, 120)),
    log: !!document.querySelector('aside.afty-log'),
    logPos: getComputedStyle(document.querySelector('aside.afty-log') || document.body).position,
  };
});
console.log(JSON.stringify(r, null, 1));
await page.screenshot({ path: '.audit/lote03-shots/afty-390-buffs-vazia.png', fullPage: false });
await browser.close();
