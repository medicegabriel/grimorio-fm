import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome', ignoreDefaultArgs: ['--hide-scrollbars'] });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
const erros = [];
page.on('pageerror', (e) => erros.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') erros.push(m.type() + ': ' + m.text().slice(0, 200)); });
await page.goto('http://127.0.0.1:5191/afty', { waitUntil: 'networkidle' });
const rota='afty';
    await page.evaluate(async (sistema) => {
      const { deriveAfty } = await import('/src/systems/afty/afty-derive.js');
      const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
      const { createBlankInvocacao } = await import('/src/systems/afty/afty-invocacoes.js');
      const { sessaoEmBranco } = await import('/src/systems/afty/ficha/ficha-sessao.js');
      const c = createBlankAfty();
      c.id = 'lote05-reparo'; c.name = 'Lote 05 Reparo'; c.rulesVersion = sistema;
      c.core.nd = 20; c.core.nivel = 20;
      c.especializacoes = [{ id: 'controlador', nivel: 20 }];
      const corpo = (id, nome, natureza) => ({ ...createBlankInvocacao('segundo', 'corpo'), id, nome, natureza });
      c.invocacoes = [corpo('bio', 'Corpo Bio', 'biologico'), corpo('boneco', 'Corpo Boneco', 'boneco')];
      const s = sessaoEmBranco(deriveAfty(c));
      localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c]));
      localStorage.setItem('fm_ficha_sessao_afty_v1:' + c.id, JSON.stringify(s));
    }, rota);
await page.reload({ waitUntil: 'networkidle' });
await page.getByText('Lote 05 Reparo', { exact: true }).click();
await page.getByRole('tab', { name: 'Invocações', exact: true }).click();
await page.locator('.afty-inv-cartao-corpo').filter({ hasText: 'Corpo Bio' }).first().click();
await page.waitForTimeout(1500);
const amostras = [];
for (let i = 0; i < 10; i++) {
  amostras.push(await page.evaluate(() => {
    const ls = [...document.querySelectorAll('.afty-linha')].filter((l) => l.textContent.includes('Reparo'));
    return ls.map((l) => { const r = l.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.left), l.isConnected, l.innerText.replace(/\s+/g, ' ')]; });
  }));
  await page.waitForTimeout(100);
}
console.log(JSON.stringify(amostras.slice(0, 3)), new Set(amostras.map((a) => JSON.stringify(a))).size);
await page.screenshot({ path: '.audit/lote05-shots/diag.png', fullPage: false });
console.log(erros.slice(0, 10));
await browser.close();
