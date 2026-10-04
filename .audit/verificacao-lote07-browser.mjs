import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('.audit/verificacao-lote07-shots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', ignoreDefaultArgs: ['--hide-scrollbars'] });
const relatorio = [];
try {
  for (const rota of ['afty', 'player']) for (const largura of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
    const page = await context.newPage();
    const erros = [];
    page.on('pageerror', e => erros.push(e.message));
    page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
    await page.goto(`http://127.0.0.1:5273/${rota}`, { waitUntil: 'networkidle' });
    const esperado = await page.evaluate(async sistema => {
      const { deriveAfty } = await import('/src/systems/afty/afty-derive.js');
      const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
      const I = await import('/src/systems/afty/afty-invocacoes.js');
      const SES = await import('/src/systems/afty/ficha/ficha-sessao.js');
      const { aplicarAddons } = await import('/src/systems/afty/afty-addons.js');
      aplicarAddons([]);
      const { aplicarAddons: verificarAplicarAddons } = await import('/src/systems/afty/afty-addons.js'); verificarAplicarAddons([]); const c = createBlankAfty();
      c.id = 'lote07-mesa'; c.name = 'Lote 07 Invocações'; c.rulesVersion = sistema;
      c.core.nd = 10; c.core.nivel = 10;
      c.especializacoes = [{ id: 'controlador', nivel: 10 }];
      c.habilidades = ['ctr_treinamento_em_controle', 'ctr_apogeu', 'ctr_hoste_amaldicoada'];
      c.escolhasHabilidade = { ctr_apogeu: ['ctr_controle_disperso'] };
      const inv = (id, grau, tipo = 'shikigami', extra = {}) => ({ ...I.createBlankInvocacao(grau, tipo), id, nome: id, ...extra });
      const grande = { ...I.createBlankCaracteristica(), id: 'grande', subtipo: 'tamanho', tamanho: 'grande' };
      c.invocacoes = [inv('L1', 'segundo'), inv('L2', 'segundo'), ...['A1','B1','A2','B2'].map(id => inv(id, 'quarto')),
        inv('Alfa', 'terceiro', 'marionete', { caracteristicas: [grande] }), inv('Beta', 'quarto', 'marionete', { caracteristicas: [grande] })];
      c.hordas = [
        { ...I.createBlankHorda(), id: 'a', nome: 'Hoste Azul', liderId: 'L1', membroIds: ['A1','B1'], hoste: true, parId: 'b' },
        { ...I.createBlankHorda(), id: 'b', nome: 'Hoste Vermelha', liderId: 'L2', membroIds: ['A2','B2'], hoste: true, parId: 'a' },
      ];
      const d = deriveAfty(c, { invocacoes: {} });
      const s = SES.sessaoEmBranco(d);
      localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c]));
      localStorage.setItem('fm_ficha_sessao_afty_v1:' + c.id, JSON.stringify(s));
      return { pvHorda: d.hordas.lista[0].pv, pvAlfa: d.invocacoes.lista.find(i => i.id === 'Alfa').pv, limiteCampo: d.invocacoes.controle.limiteCampo, limiteHordas: d.invocacoes.controle.limiteHordas };
    }, rota);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByText('Lote 07 Invocações', { exact: true }).click();
    await page.getByRole('tab', { name: 'Invocações', exact: true }).click();
    const campo = page.locator('.afty-chip').filter({ hasText: /^Em Campo \d+ \/ / });
    const hordas = page.locator('.afty-chip').filter({ hasText: /^Hordas \d+ \/ / });
    const leContagem = async (nCampo, nHordas) => {
      await page.getByText(`Em Campo ${nCampo} / ${esperado.limiteCampo}`, { exact: true }).waitFor();
      assert.equal(await campo.innerText(), `Em Campo ${nCampo} / ${esperado.limiteCampo}`);
      assert.equal(await hordas.innerText(), `Hordas ${nHordas} / ${esperado.limiteHordas}`);
      return [await campo.innerText(), await hordas.innerText()];
    };
    const horda = nome => page.locator('.afty-linha').filter({ has: page.getByText(nome, { exact: true }) });
    const estados = [];
    estados.push(await leContagem(0, 0));
    await horda('Hoste Azul').getByRole('button', { name: / PE$/ }).click();
    estados.push(await leContagem(1, 1));
    await horda('Hoste Vermelha').getByRole('button', { name: / PE$/ }).click();
    estados.push(await leContagem(1, 1));
    await page.screenshot({ path: `.audit/verificacao-lote07-shots/${rota}-${largura}-hoste.png` });
    const azul = horda('Hoste Azul');
    const vidaH = azul.getByRole('textbox', { name: 'Vida da Horda atual' });
    await vidaH.fill('-5'); await vidaH.press('Enter');
    await vidaH.fill('-' + (esperado.pvHorda - 5 - Math.floor(esperado.pvHorda / 2))); await vidaH.press('Enter');
    await azul.locator('[title="Saiu da Horda"]').waitFor();
    assert.equal(await azul.locator('[title="Pontos de Vida da horda"]').innerText(), `PV ${esperado.pvHorda}`);
    assert.equal(await vidaH.inputValue(), String(Math.floor(esperado.pvHorda / 2)));
    await vidaH.fill('-1'); await vidaH.press('Enter');
    assert.equal(await azul.locator('[title="Saiu da Horda"]').count(), 1);
    await page.screenshot({ path: `.audit/verificacao-lote07-shots/${rota}-${largura}-horda-metade.png` });
    await vidaH.fill('-' + esperado.pvHorda); await vidaH.press('Enter');
    estados.push(await leContagem(1, 1));
    assert.equal(await azul.getByRole('textbox', { name: 'Vida da Horda atual' }).count(), 0);
    await horda('Hoste Vermelha').getByRole('button', { name: 'Em Campo', exact: true }).click();
    estados.push(await leContagem(0, 0));
    /* Monta as Marionetes feridas pela sessão, preservando a ficha de teste. */
    await page.evaluate(async () => {
      const chave = 'fm_ficha_sessao_afty_v1:lote07-mesa';
      const s = JSON.parse(localStorage.getItem(chave));
      s.invocacoes.Alfa = { estado: 'ativa', pvAtual: 3 };
      s.invocacoes.Beta = { estado: 'ativa', pvAtual: 7 };
      localStorage.setItem(chave, JSON.stringify(s));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByText('Lote 07 Invocações', { exact: true }).click();
    await page.getByRole('tab', { name: 'Invocações', exact: true }).click();
    await page.getByRole('button', { name: 'Formar Mecha: Alfa e Beta', exact: true }).click();
    await page.locator('.afty-inv-cartao-corpo').filter({ hasText: 'Mecha' }).click();
    const vidaM = page.getByRole('tabpanel', { name: 'Invocações' }).getByRole('textbox', { name: 'Vida atual', exact: true });
    assert.equal(await vidaM.inputValue(), '3');
    await page.waitForTimeout(800);
    const mecha = await page.evaluate(() => JSON.parse(localStorage.getItem('fm_ficha_sessao_afty_v1:lote07-mesa')).invocacoes.mecha);
    assert.deepEqual([mecha.maiorId, mecha.menorId, mecha.pvAtual, mecha.pvTempFontes['Mecha · Marionete Menor']], ['Alfa', 'Beta', 3, 7]);
    await page.screenshot({ path: `.audit/verificacao-lote07-shots/${rota}-${largura}-mecha.png` });
    await vidaM.fill('-10'); await vidaM.press('Enter');
    await page.waitForTimeout(800);
    const queda = await page.evaluate(() => {
      const inv = JSON.parse(localStorage.getItem('fm_ficha_sessao_afty_v1:lote07-mesa')).invocacoes;
      return [inv.Alfa.estado, inv.Beta.estado, inv.mecha.estado];
    });
    assert.deepEqual(queda, ['quebrada', 'quebrada', 'fora']);
    const dim = await page.evaluate(() => ({ viewport: innerWidth, largura: document.documentElement.scrollWidth }));
    assert.ok(dim.largura <= largura, `${rota} ${largura}: largura ${dim.largura}`);
    assert.deepEqual(erros, []);
    relatorio.push({ rota, largura, esperado, estados, mecha: { maior: mecha.maiorId, atual: mecha.pvAtual, casca: mecha.pvTempFontes }, queda, dim, erros });
    await context.close();
  }
} finally { await browser.close(); await writeFile('.audit/verificacao-lote07-browser-resultados.json', JSON.stringify(relatorio, null, 2)); }
console.log(JSON.stringify(relatorio, null, 2));
