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
      f.id = 'lote06-encantamentos'; f.name = 'Lote 06 Encantamentos'; f.rulesVersion = sistema;
      f.core.nd = 10; f.core.nivel = 10; f.core.tipo = 'combatente';
      f.especializacoes = [{ id: 'combatente', nivel: 10 }];
      f.attrMethod = 'fixos';
      f.attributes = { forca: 14, destreza: 14, constituicao: 10, inteligencia: 16, sabedoria: 10, presenca: 10 };
      f.equipamentos = { itens: ['arm_espada_curta', 'arm_adaga'].map((refId, i) => ({ uid: `arma${i}`, id: `arma${i}`, tipo: 'arma', refId, qtd: 1, equipado: true, fa: { grau: 'primeiro', encantamentos: [] } })) };
      const sem = deriveAfty(f);
      f.equipamentos.itens.forEach(i => i.fa.encantamentos = ['enc_arma_canalizadora', 'enc_arma_otimizada']);
      const d = deriveAfty(f);
      localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([f]));
      return { cd: d.cd, iniciativa: d.iniciativa, cdDelta: d.cd - sem.cd, iniciativaDelta: d.iniciativa - sem.iniciativa };
    }, rota);
    assert.equal(esperado.cdDelta, 2);
    assert.equal(esperado.iniciativaDelta, 2);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByText('Lote 06 Encantamentos', { exact: true }).click();
    await page.getByRole('tab', { name: 'Ações', exact: true }).waitFor();
    const fontes = {};
    for (const [stat, nome] of [['cd', 'Canalizadora'], ['iniciativa', 'Otimizada']]) {
      const alvo = page.locator(`[data-afty-stat="${stat}"] .afty-stat-valor`).first();
      assert.equal((await alvo.innerText()).trim().replace('+', ''), String(esperado[stat]), `${rota} ${largura}: ${stat}`);
      await alvo.scrollIntoViewIfNeeded();
      if (largura === 390) await alvo.tap(); else await alvo.hover();
      const linha = page.locator('.afty-fonte-linha').filter({ hasText: `(${nome})` });
      await linha.waitFor();
      assert.equal(await linha.count(), 1);
      fontes[stat] = await linha.innerText();
      await page.screenshot({ path: `.audit/lote06-shots/${rota}-${largura}-${stat}.png` });
      if (largura === 390) await alvo.tap(); else await page.mouse.move(0, 0);
    }
    await page.getByRole('tab', { name: 'Ações', exact: true }).click();
    const dimensoes = await page.evaluate(() => ({ viewport: innerWidth, largura: document.documentElement.scrollWidth }));
    assert.ok(dimensoes.largura <= largura, `Sem rolagem horizontal: ${JSON.stringify(dimensoes)}`);
    assert.deepEqual(erros, []);
    const resultado = { rota, largura, esperado, fontes, dimensoes, erros };
    relatorio.push(resultado); console.log(JSON.stringify(resultado));
    await context.close();
  }
  await writeFile('.audit/lote06-browser-resultados.json', JSON.stringify(relatorio, null, 2));
} finally { await browser.close(); }
