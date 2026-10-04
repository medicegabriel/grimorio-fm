import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('.audit/lote05-shots', { recursive: true });
const PORTA = process.env.PORTA || '5191';
const browser = await chromium.launch({ channel: 'chrome', ignoreDefaultArgs: ['--hide-scrollbars'] });
const relatorio = [];
try {
  for (const rota of ['afty', 'player']) for (const largura of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
    const page = await context.newPage();
    const erros = [];
    page.on('pageerror', (e) => erros.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
    await page.goto(`http://127.0.0.1:${PORTA}/${rota}`, { waitUntil: 'networkidle' });
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
    const lido = {};
    for (const [nome, cd, rotulo] of [['Corpo Bio', 'CD 25', 'Criação de Itens · Farmacêutico (Custo 3)'], ['Corpo Boneco', 'CD 30', 'Criação de Itens · Alfaiate (Custo 3)']]) {
      await page.locator('.afty-inv-cartao-corpo').filter({ hasText: nome }).first().click();
      await page.waitForTimeout(1000);
      const linha = page.locator('.afty-linha').filter({ has: page.getByText('Reparo', { exact: true }) });
      await linha.first().waitFor();
      const texto = (await linha.first().innerText()).replace(/\s+/g, ' ');
      const botao = linha.first().getByRole('button', { name: cd, exact: true });
      assert.equal(await botao.count(), 1, `${rota} ${largura} ${nome}: ${cd} como botão de hover`);
      /* Rolar FECHA o painel flutuante: rola antes, sem animação, e só então abre. */
      await botao.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.waitForTimeout(500);
      if (largura === 390) await botao.tap(); else await botao.hover();
      await page.locator('.afty-fonte-rotulo').getByText(rotulo, { exact: true }).waitFor();
      const { painel, total, caixa } = await page.evaluate(() => {
        const limpa = (s) => s.replace(/\s+/g, ' ').trim();
        const linhas = [...document.querySelectorAll('.afty-fonte-linha')];
        let p = linhas[0]; while (p && getComputedStyle(p).position !== 'fixed') p = p.parentElement;
        const r = (p || linhas[0]).getBoundingClientRect();
        return {
          painel: linhas.map((l) => limpa(l.textContent)),
          total: [...document.querySelectorAll('.afty-fonte-total')].map((l) => limpa(l.textContent)),
          caixa: { esquerda: Math.round(r.left), direita: Math.round(r.right) },
        };
      });
      assert.ok(caixa.esquerda >= 0 && caixa.direita <= largura, `${rota} ${largura} ${nome}: painel dentro da tela ${JSON.stringify(caixa)}`);
      await page.screenshot({ path: `.audit/lote05-shots/${rota}-${largura}-${nome.replace(/\s+/g, '-').toLowerCase()}.png` });
      if (largura === 390) await page.mouse.click(5, 5); else await page.mouse.move(0, 0);
      lido[nome] = { linha: texto, painel, total, caixa };
    }
    const dim = await page.evaluate(() => ({ viewport: innerWidth, largura: document.documentElement.scrollWidth }));
    assert.ok(dim.largura <= largura, `${rota} ${largura}: sem rolagem horizontal (${dim.largura})`);
    relatorio.push({ rota, largura, lido, dim, erros });
    await context.close();
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(relatorio, null, 1));
