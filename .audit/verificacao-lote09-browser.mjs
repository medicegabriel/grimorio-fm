import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:5273';
await mkdir('.audit/verificacao-lote09-shots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', ignoreDefaultArgs: ['--hide-scrollbars'] });
const relatorio = [];
try {
  for (const rota of ['afty', 'player']) for (const largura of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
    const page = await context.newPage();
    const erros = [];
    page.on('pageerror', e => erros.push(e.message));
    page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
    await page.goto(`${base}/${rota}`, { waitUntil: 'networkidle' });
    const esperado = await page.evaluate(async sistema => {
      const { deriveAfty } = await import('/src/systems/afty/afty-derive.js');
      const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
      const I = await import('/src/systems/afty/afty-invocacoes.js');
      const SES = await import('/src/systems/afty/ficha/ficha-sessao.js');
      const { aplicarAddons } = await import('/src/systems/afty/afty-addons.js');
      aplicarAddons([]);
      const { aplicarAddons: verificarAplicarAddons } = await import('/src/systems/afty/afty-addons.js'); verificarAplicarAddons([]); const c = createBlankAfty();
      c.id = 'lote09-fundamento'; c.name = 'Lote 09 Fundamento'; c.rulesVersion = sistema;
      c.core.nd = 10; c.core.nivel = 10;
      c.especializacoes = [{ id: 'controlador', nivel: 10 }];
      c.habilidades = ['ctr_treinamento_em_controle'];
      c.core.tecnicaEfeitos = [{ canal: 'defesa', expr: '2' }];
      c.feiticos = [
        { id: 'passiva', tipo: 'passivo', nome: 'Corpo Rígido', nivel: 1, efeitosPassivo: [{ canal: 'rdGeral', expr: '3' }] },
        { id: 'raio', tipo: 'dano', nome: 'Raio', nivel: 1, alvo: 'unico', acao: 'comum' },
      ];
      c.invocacoes = [{ ...I.createBlankInvocacao('quarto', 'tecnica'), id: 'F', nome: 'Divino', fundamento: true }];
      const fora = deriveAfty(c, { invocacoes: {} });
      const campo = deriveAfty(c, { invocacoes: { F: { estado: 'ativa' } } });
      const s = SES.sessaoEmBranco(fora);
      localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c]));
      localStorage.setItem('fm_ficha_sessao_afty_v1:' + c.id, JSON.stringify(s));
      return { fora: { defesa: fora.defesa, rd: fora.rdGeral, pe: fora.pe }, campo: { defesa: campo.defesa, rd: campo.rdGeral, pe: campo.pe } };
    }, rota);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByText('Lote 09 Fundamento', { exact: true }).click();
    const tab = nome => page.getByRole('tab', { name: nome, exact: true });
    const stat = id => page.locator(`[data-afty-stat="${id}"]`).locator('.afty-stat-valor');
    const leStats = async () => ({
      defesa: (await page.locator('[data-afty-stat="defesa"]').first().innerText()).replace(/\s+/g, ' '),
      rd: (await page.locator('[data-afty-stat="rd-geral"]').first().innerText()).replace(/\s+/g, ' '),
      pe: await page.locator('[data-afty-vital="pe"] .afty-vital-max').first().innerText(),
    });
    await tab('Ações').click();
    const raio = page.locator('details.afty-feitico').filter({ has: page.getByText('Raio', { exact: true }) });
    await raio.locator('summary').first().click();
    assert.equal(await raio.locator('.afty-rolavel').count(), 0);
    assert.equal(await raio.getByText('Ritual', { exact: true }).count(), 0);
    assert.equal(await page.getByText('Fundamento Fora de Campo', { exact: true }).count(), 1);
    const fora = await leStats();
    await page.screenshot({ path: `.audit/verificacao-lote09-shots/${rota}-${largura}-feiticos-bloqueados.png` });
    await tab('Invocações').click();
    await page.getByRole('status').filter({ hasText: 'Técnica Inata Indisponível' }).waitFor();
    assert.equal(await page.getByRole('status').filter({ hasText: 'Técnica Inata Indisponível' }).locator('svg').count(), 1);
    await page.screenshot({ path: `.audit/verificacao-lote09-shots/${rota}-${largura}-fora.png` });
    await page.locator('.afty-inv-cartao').filter({ hasText: 'Divino' }).locator('.afty-inv-campo').click();
    await page.getByRole('button', { name: 'Em Campo', exact: true }).waitFor();
    assert.equal(await page.getByRole('status').filter({ hasText: 'Técnica Inata Indisponível' }).count(), 0);
    const campo = await leStats();
    assert.ok(campo.defesa.endsWith(String(esperado.campo.defesa)));
    assert.ok(fora.defesa.endsWith(String(esperado.fora.defesa)));
    assert.equal(campo.pe, '/ ' + esperado.campo.pe);
    assert.equal(fora.pe, '/ ' + esperado.fora.pe);
    await tab('Ações').click();
    assert.equal(await raio.locator('.afty-rolavel').count() > 0, true);
    assert.equal(await raio.getByText('Ritual', { exact: true }).count(), 1);
    assert.equal(await page.getByText('Fundamento Fora de Campo', { exact: true }).count(), 0);
    const defesa = page.locator('[data-afty-stat="defesa"] button');
    await defesa.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    if (largura === 390) await defesa.tap(); else await defesa.hover();
    await page.locator('.afty-fonte-rotulo').getByText('Técnica', { exact: true }).waitFor();
    await page.screenshot({ path: `.audit/verificacao-lote09-shots/${rota}-${largura}-em-campo-fontes.png` });
    if (largura === 390) await page.mouse.click(5, 5); else await page.mouse.move(0, 0);
    await tab('Invocações').click();
    await page.getByRole('button', { name: 'Em Campo', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Técnica Inata Indisponível' }).waitFor();
    const voltou = await leStats();
    assert.deepEqual(voltou, fora);
    const dim = await page.evaluate(() => ({ viewport: innerWidth, largura: document.documentElement.scrollWidth }));
    assert.ok(dim.largura <= largura, `${rota} ${largura}: largura ${dim.largura}`);
    assert.deepEqual(erros, []);
    relatorio.push({ rota, largura, esperado, fora, campo, voltou, dim, erros });
    await context.close();
  }
} finally {
  await browser.close();
  await writeFile('.audit/verificacao-lote09-browser-resultados.json', JSON.stringify(relatorio, null, 2));
}
console.log(JSON.stringify(relatorio, null, 2));


