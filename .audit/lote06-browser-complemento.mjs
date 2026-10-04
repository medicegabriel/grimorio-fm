import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('.audit/lote06-shots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', ignoreDefaultArgs: ['--hide-scrollbars'] });
const relatorio = [];
try {
  for (const rota of ['afty', 'player']) for (const largura of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
    const page = await context.newPage();
    const erros = [];
    page.on('pageerror', e => erros.push(e.message));
    page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
    await page.goto(`http://localhost:5186/${rota}`, { waitUntil: 'networkidle' });
    const esperado = await page.evaluate(async sistema => {
      const { deriveAfty } = await import('/src/systems/afty/afty-derive.js');
      const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
      const { aplicarAddons } = await import('/src/systems/afty/afty-addons.js');
      aplicarAddons([]);
      const f = createBlankAfty();
      f.id = 'lote06-suporte'; f.name = 'Lote 06 Suporte'; f.rulesVersion = sistema;
      f.core.nd = 20; f.core.nivel = 20; f.core.tecnicaAttr = 'inteligencia';
      f.especializacoes = [{ id: 'suporte', nivel: 20 }];
      f.habilidades = ['sup_suporte_em_combate', 'sup_suporte_absoluto'];
      f.attrMethod = 'fixos';
      f.attributes = { forca: 10, destreza: 10, constituicao: 10, inteligencia: 20, presenca: 18, sabedoria: 14 };
      const d = deriveAfty(f);
      const cura = d.cura.linhas.find(l => l.id === 'cura_suporte_em_combate');
      const fichas = [f];
      if (sistema === 'player') for (const nivel of [1, 30]) {
        const c = createBlankAfty();
        c.id = `lote06-conjurador-${nivel}`; c.name = `Lote 06 Conjurador ${nivel}`; c.rulesVersion = sistema;
        c.core.nd = nivel; c.core.nivel = nivel; c.core.tipo = 'conjurador';
        c.especializacoes = [{ id: 'conjurador', nivel }];
        fichas.push(c);
      }
      localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify(fichas));
      return { modTecnica: d.modTecnica, cura: cura.texto, fonte: cura.partesFixas.filter(p => p.label === 'Suporte Absoluto').map(p => p.valor) };
    }, rota);
    assert.equal(esperado.modTecnica, 5); assert.deepEqual(esperado.fonte, [4]);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByText('Lote 06 Suporte', { exact: true }).click();
    const linha = page.locator('[id="afty-item-cura:cura_suporte_em_combate"]');
    const valor = linha.getByRole('button', { name: esperado.cura, exact: true });
    await valor.scrollIntoViewIfNeeded();
    if (largura === 390) {
      const caixa = await valor.boundingBox();
      const toque = await context.newCDPSession(page);
      await toque.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: caixa.x + caixa.width / 2, y: caixa.y + caixa.height / 2 }] });
      await page.waitForTimeout(700);
      await toque.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await toque.detach();
    } else await valor.hover();
    const fonte = page.locator('.afty-fonte-linha').filter({ hasText: 'Suporte Absoluto' });
    try { await fonte.waitFor({ timeout: 5000 }); } catch (e) { await page.screenshot({ path: `.audit/lote06-shots/${rota}-${largura}-suporte-falha.png`, fullPage: true }); console.log(JSON.stringify({ rota, largura, linha: await linha.innerText(), painels: await page.locator('.afty-fonte-linha').allTextContents() })); throw e; }
    assert.equal(await fonte.count(), 1); assert.ok((await fonte.innerText()).includes('+4'));
    const painel = await page.locator('.afty-fonte-linha').allTextContents();
    await page.screenshot({ path: `.audit/lote06-shots/${rota}-${largura}-suporte.png` });
    if (largura === 390) await page.touchscreen.tap(5, 5); else await page.mouse.move(0, 0);
    const dimensoes = await page.evaluate(() => ({ viewport: innerWidth, largura: document.documentElement.scrollWidth }));
    assert.ok(dimensoes.largura <= largura);
    const progressao = [];
    if (rota === 'player') for (const [nivel, total] of [[1, 2], [30, 33]]) {
      await page.goto('http://localhost:5186/player', { waitUntil: 'networkidle' });
      await page.getByText(`Lote 06 Conjurador ${nivel}`, { exact: true }).click();
      await page.locator('button[title="Editar no criador"]').click();
      await page.getByRole('tab', { name: 'Habilidades', exact: true }).click();
      const contador = page.locator('[title="Feitiços recebidos por nível"]');
      await contador.waitFor();
      const texto = await contador.innerText();
      assert.ok(texto.includes(`0 / ${total}`), `${nivel}: ${texto}`);
      await contador.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `.audit/lote06-shots/player-${largura}-conjurador-${nivel}.png` });
      progressao.push({ nivel, total, texto });
    }
    assert.deepEqual(erros, []);
    const resultado = { rota, largura, esperado, painel, dimensoes, progressao, erros };
    relatorio.push(resultado); console.log(JSON.stringify(resultado));
    await context.close();
  }
  await writeFile('.audit/lote06-browser-complemento-resultados.json', JSON.stringify(relatorio, null, 2));
} finally { await browser.close(); }
