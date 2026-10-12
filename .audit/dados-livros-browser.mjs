import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5198';
const output = '.audit/dados-livros-shots';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const report = [];
try {
  for (const route of ['Afty', 'Player']) {
    for (const [width, height] of [[320, 568], [390, 900], [640, 900], [640, 360], [641, 900], [1024, 900], [1440, 900]]) {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: width <= 640 });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base + '/' + route);
      await page.evaluate(async system => {
        const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
        const { rolarTeste } = await import('/src/systems/afty/ficha/ficha-rolagem.js');
        const creature = { ...createBlankAfty(), id: 'layout-dados-livros', name: 'Teste de layout', rulesVersion: system };
        localStorage.setItem('fm_creatures_' + system + '_v1', JSON.stringify([creature]));
        const log = Array.from({ length: 20 }, () => rolarTeste({ rotulo: 'Teste de Força', bonus: 4 }, () => 0.55));
        localStorage.setItem('fm_ficha_sessao_afty_v1:layout-dados-livros', JSON.stringify({ log }));
      }, route.toLowerCase());
      await page.reload();
      await page.getByText('Teste de layout', { exact: true }).first().click();
      await page.locator('.afty-log').waitFor();
      for (const historyOpen of [false, true]) {
        if (historyOpen) await page.getByRole('button', { name: 'Abrir o histórico', exact: true }).click();
        for (const booksOpen of [false, true]) {
          if (booksOpen) await page.getByRole('button', { name: 'Abrir documentos', exact: true }).click();
          const geometry = await page.evaluate(() => {
            const log = document.querySelector('.afty-log').getBoundingClientRect();
            const book = document.querySelector('button[aria-label="Abrir documentos"], button[aria-label="Fechar documentos"]').parentElement.getBoundingClientRect();
            const overlap = log.left < book.right && log.right > book.left && log.top < book.bottom && log.bottom > book.top;
            return { overlap, gap: log.right <= book.left ? book.left - log.right : book.top - log.bottom,
              log: { x: log.x, y: log.y, width: log.width, height: log.height },
              book: { x: book.x, y: book.y, width: book.width, height: book.height },
              horizontalScroll: document.documentElement.scrollWidth > innerWidth,
              historyVisible: document.querySelectorAll('.afty-rolagem').length,
            };
          });
          assert.equal(geometry.overlap, false, JSON.stringify({ route, width, historyOpen, booksOpen, geometry }));
          assert.ok(geometry.gap >= 20, JSON.stringify({ route, width, geometry }));
          assert.equal(geometry.horizontalScroll, false);
          assert.ok(geometry.log.y >= 0);
          assert.equal(geometry.historyVisible, historyOpen ? 20 : 1);
          report.push({ route, width, height, historyOpen, booksOpen, ...geometry });
          if ([390, 1440].includes(width)) await page.screenshot({ path: `${output}/${route}-${width}-${historyOpen ? 'historico' : 'ultima'}-${booksOpen ? 'livros' : 'fechado'}.png` });
          if (booksOpen) await page.getByRole('button', { name: 'Fechar documentos', exact: true }).click();
        }
      }
      await page.getByRole('button', { name: 'Abrir documentos', exact: true }).click();
      await page.getByRole('button', { name: 'Livro de Regras', exact: true }).click();
      await page.getByRole('button', { name: 'Abrir documentos', exact: true }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Fechar documentos', exact: true }).count(), 0);
      assert.deepEqual(errors, []);
      console.log('PASS', route, width);
      await context.close();
    }
  }
} finally {
  await browser.close();
  await writeFile('.audit/dados-livros-report.json', JSON.stringify(report, null, 2));
}
