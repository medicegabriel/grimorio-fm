import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:5201';
const browser = await chromium.launch({ channel: 'chrome', ignoreDefaultArgs: ['--hide-scrollbars'] });
const report = [];
try {
  for (const rota of ['afty', 'player']) for (const largura of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 } });
    const page = await ctx.newPage(); page.setDefaultTimeout(12000);
    const erros = []; page.on('pageerror', e => erros.push(e.message));
    page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
    await page.goto(`${base}/${rota}`, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      const { deriveAfty } = await import('/src/systems/afty/afty-derive.js');
      const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
      const I = await import('/src/systems/afty/afty-invocacoes.js');
      const S = await import('/src/systems/afty/ficha/ficha-sessao.js');
      const E = await import('/src/systems/afty/encontros/afty-encontro.js');
      const { aplicarAddons } = await import('/src/systems/afty/afty-addons.js'); aplicarAddons([]);
      const enc = E.criarEncontro({ nome: 'Lote 11 Misto' }); enc.id = 'lote11-misto'; enc.status = 'ativo'; enc.rodada = 1; enc.combatentes = [];
      for (const sistema of ['afty', 'player']) {
        const c = createBlankAfty(); c.id = 'id-igual'; c.name = 'Cópia Antiga ' + sistema; c.rulesVersion = sistema;
        c.core.nd = 10; c.core.nivel = 10; c.especializacoes = [{ id: 'controlador', nivel: 10 }];
        c.invocacoes = [{ ...I.createBlankInvocacao('quarto', 'tecnica'), id: 'F', nome: 'Fundamento ' + sistema, fundamento: true }];
        const d = deriveAfty(c);
        const cmb = E.criarCombatente(c, { derived: d }); cmb.id = 'cmb-' + sistema;
        cmb.sessao = { ...S.sessaoEmBranco(d), rodada: 1, combate: { ativo: true }, invocacoes: { F: { estado: 'morta', exorcismos: 2, pvAtual: 0 } } };
        enc.combatentes.push(cmb);
        const atual = { ...c, name: 'Atual ' + sistema, core: { ...c.core, nd: 17, nivel: 17 }, preservado: sistema };
        localStorage.setItem('fm_creatures_' + sistema + '_v1', JSON.stringify([atual]));
      }
      enc.ativoId = 'cmb-afty'; localStorage.setItem('afty_encontros_v1', JSON.stringify([enc]));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Encontros', exact: true }).first().click();
    await page.locator('.afty-encontro-card').filter({ hasText: 'Lote 11 Misto' }).getByRole('button', { name: 'Retomar', exact: true }).click();
    await page.waitForFunction(() => ['afty', 'player'].every(s => JSON.parse(localStorage.getItem('fm_creatures_' + s + '_v1'))[0].fundamentosPerdidos.length === 1));
    const fichas = await page.evaluate(() => ['afty', 'player'].map(s => JSON.parse(localStorage.getItem('fm_creatures_' + s + '_v1'))[0]));
    assert.deepEqual(fichas.map(c => [c.rulesVersion, c.name, c.core.nd, c.preservado, c.fundamentosPerdidos[0].nome]),
      [['afty', 'Atual afty', 17, 'afty', 'Fundamento afty'], ['player', 'Atual player', 17, 'player', 'Fundamento player']]);
    assert.equal(await page.getByRole('status').filter({ hasText: 'Perda do Fundamento Pendente na Biblioteca' }).count(), 0);
    await page.evaluate(() => {
      window.__lote11Contador = 0; window.__lote11SetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k, v) {
        if (k.startsWith('fm_creatures_') && k.endsWith('_v1')) window.__lote11Contador++;
        return window.__lote11SetItem.call(this, k, v);
      };
    });
    await page.getByRole('button', { name: 'Nova Rodada', exact: true }).click();
    await page.getByRole('button', { name: 'Nova Rodada', exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('afty_encontros_v1'))[0].rodada === 3);
    await page.waitForTimeout(300);
    const regravacoes = await page.evaluate(() => window.__lote11Contador); assert.equal(regravacoes, 0);
    await page.evaluate(() => { Storage.prototype.setItem = window.__lote11SetItem; delete window.__lote11SetItem; });
    await page.screenshot({ path: `.audit/lote11-shots/${rota}-${largura}-misto.png` });
    const outra = rota === 'afty' ? 'player' : 'afty';
    await page.goto(`${base}/${outra}`, { waitUntil: 'networkidle' });
    await page.getByText('Atual ' + outra, { exact: true }).click();
    await page.getByRole('tab', { name: 'Invocações', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Técnica Inata Indisponível: Fundamento Perdido' }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `.audit/lote11-shots/${rota}-${largura}-biblioteca-outra-rota.png` });
    assert.deepEqual(erros, []);
    report.push({ rota, largura, idsIguaisIsolados: true, perdasNosDoisSistemas: true,
      outraBibliotecaAbertaComPerda: true, edicaoPosteriorPreservada: true, regravacoesAoMudarRodada: regravacoes, erros });
    console.log(`PASSOU misto ${rota} ${largura}`); await ctx.close();
  }
} finally { await browser.close(); await writeFile('.audit/lote11-misto-resultados.json', JSON.stringify(report, null, 2)); }
