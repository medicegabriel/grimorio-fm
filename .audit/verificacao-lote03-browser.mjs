import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const PORTA = process.env.PORTA || '5173';
await mkdir('.audit/verificacao-lote03-shots', { recursive: true });
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
      const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
      const { aplicarAddons } = await import('/src/systems/afty/afty-addons.js');
      const flugel = await (await fetch('/addons/flugel.json')).json();
      aplicarAddons([flugel]);
      const feto = createBlankAfty();
      feto.id = 'lote03-feto'; feto.name = 'Lote 03 Feto'; feto.rulesVersion = sistema;
      feto.core.nd = 5; feto.core.origem = { id: 'feto_amaldicoado_hibrido', anatomias: ['instinto_sanguinario'] };
      const res = createBlankAfty();
      res.id = 'lote03-restringido'; res.name = 'Lote 03 Restringido'; res.rulesVersion = sistema;
      res.core = { ...res.core, nd: 8, tipo: 'restringido', origem: { id: 'restringido' } };
      res.especializacoes = [{ id: 'restringido', nivel: 8 }];
      res.habilidades = ['res_forca_imparavel'];
      res.escolhasHabilidade = { res_forca_imparavel: ['res_imparavel_fortitude', 'res_imparavel_vontade'] };
      const ak = createBlankAfty();
      ak.id = 'lote03-akutame'; ak.name = 'Lote 03 Akutame'; ak.rulesVersion = sistema;
      ak.core.nd = 5; ak.core.origem = { id: 'herdado', cla: 'flugel:cla_akutame', escolhas: { akutame_mestre: ['akutame_mestre_atletismo'] } };
      ak.addons = [flugel];
      localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([feto, res, ak]));
    }, rota);
    const abrir = async (nome) => {
      await page.goto(`http://127.0.0.1:${PORTA}/${rota}`, { waitUntil: 'networkidle' });
      await page.getByText(nome, { exact: true }).click();
      await page.getByRole('tab', { name: 'Ações', exact: true }).waitFor();
    };
    const stat = (id) => page.locator(`[data-afty-stat="${id}"] .afty-stat-valor`).first();
    const fontes = async (alvo, nomes, arquivo) => {
      await alvo.scrollIntoViewIfNeeded();
      if (largura === 390) await alvo.tap(); else await alvo.hover();
      for (const nome of nomes) await page.locator('.afty-fonte-rotulo').getByText(nome, { exact: true }).first().waitFor();
      const painel = await page.locator('.afty-fonte-linha').allTextContents();
      await page.screenshot({ path: `.audit/verificacao-lote03-shots/${rota}-${largura}-${arquivo}.png` });
      if (largura === 390) await alvo.tap(); else await page.mouse.move(0, 0);
      return painel;
    };
    const semRolagem = async () => {
      const d = await page.evaluate(() => document.documentElement.scrollWidth);
      assert.ok(d <= largura, `${rota} ${largura}: rolagem horizontal (${d})`);
    };

    /* 1. Instinto Sanguinário: Atenção fora e dentro de combate. */
    await abrir('Lote 03 Feto');
    const atencaoFora = (await stat('atencao').innerText()).trim();
    await page.getByRole('tab', { name: 'Buffs', exact: true }).click();
    const botao = page.getByRole('button', { name: 'Em Combate', exact: true }).first();
    await botao.click();
    await page.waitForFunction(() => document.querySelector('[data-afty-stat="atencao"] .afty-stat-valor')?.textContent.trim() === '15');
    const atencaoDentro = (await stat('atencao').innerText()).trim();
    assert.equal(atencaoFora, '12', `${rota} ${largura}: Atenção fora`);
    assert.equal(atencaoDentro, '15', `${rota} ${largura}: Atenção em combate`);
    const painelAtencao = await fontes(stat('atencao'), ['Instinto Sanguinário'], 'atencao-em-combate');
    /* A aba Buffs transborda em 390 por conta da linha "Refeições Consumidas",
       até numa ficha vazia, e não é deste lote: a largura é medida na Ações. */
    await page.getByRole('tab', { name: 'Ações', exact: true }).click();
    await semRolagem();

    /* 2. Força Imparável na Fortitude: Mestre no jogador, Treinado na criatura. */
    await abrir('Lote 03 Restringido');
    await page.getByRole('tab', { name: 'Perícias', exact: true }).click();
    const forti = page.locator('[id="afty-item-tr:fortitude"]');
    await forti.waitFor();
    const destacada = await forti.getAttribute('data-afty-destacada');
    assert.equal(destacada, rota === 'player' ? 'sim' : 'nao', `${rota} ${largura}: Fortitude`);
    await forti.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `.audit/verificacao-lote03-shots/${rota}-${largura}-fortitude.png` });
    const linhaForti = (await forti.innerText()).replace(/\s+/g, ' ').trim();
    await semRolagem();

    /* 3. Clã Akutame com BT 3: Defesa inteira, parcela 1. */
    await abrir('Lote 03 Akutame');
    const defesa = (await stat('defesa').innerText()).trim();
    assert.equal(defesa, rota === 'player' ? '13' : '18', `${rota} ${largura}: Defesa Akutame`);
    const painelDefesa = await fontes(stat('defesa'), ['Clã Akutame'], 'defesa-akutame');
    assert.ok(painelDefesa.some((l) => /Clã Akutame\s*\+?1$/.test(l.replace(/\s+/g, ' ').trim())), `${rota} ${largura}: parcela do Akutame ${JSON.stringify(painelDefesa)}`);
    await semRolagem();

    relatorio.push({ rota, largura, atencaoFora, atencaoDentro, painelAtencao, linhaForti, defesa, painelDefesa, erros });
    await context.close();
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(relatorio, null, 1));
