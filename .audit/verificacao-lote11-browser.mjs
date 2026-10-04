import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:5273';
await mkdir('.audit/verificacao-lote11-shots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', ignoreDefaultArgs: ['--hide-scrollbars'] });
const report = [];
try {
  for (const rota of ['afty', 'player']) for (const largura of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
    const page = await ctx.newPage(); page.setDefaultTimeout(12000);
    const erros = [];
    page.on('pageerror', e => erros.push(e.message));
    page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
    await page.goto(`${base}/${rota}`, { waitUntil: 'networkidle' });
    const esperado = await page.evaluate(async sistema => {
      const { deriveAfty } = await import('/src/systems/afty/afty-derive.js');
      const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
      const I = await import('/src/systems/afty/afty-invocacoes.js');
      const S = await import('/src/systems/afty/ficha/ficha-sessao.js');
      const E = await import('/src/systems/afty/encontros/afty-encontro.js');
      const { aplicarAddons } = await import('/src/systems/afty/afty-addons.js');
      aplicarAddons([]);
      const criar = (system, name) => {
        const c = createBlankAfty(); c.id = 'lote11-dono'; c.name = name; c.rulesVersion = system;
        c.core.nd = 10; c.core.nivel = 10; c.especializacoes = [{ id: 'controlador', nivel: 10 }];
        c.core.tecnicaEfeitos = [{ canal: 'defesa', expr: '2' }];
        c.feiticos = [{ id: 'raio', tipo: 'dano', nome: 'Raio', nivel: 1, alvo: 'unico', acao: 'comum' }];
        c.invocacoes = [{ ...I.createBlankInvocacao('quarto', 'tecnica'), id: 'F', nome: 'Divino', fundamento: true }];
        return c;
      };
      const c = criar(sistema, 'Lote 11 Original');
      const outroSistema = sistema === 'afty' ? 'player' : 'afty';
      const outra = criar(outroSistema, 'Lote 11 Outro');
      const d = deriveAfty(c, { invocacoes: { F: { estado: 'ativa' } } });
      const enc = E.criarEncontro({ nome: 'Lote 11 Encontro' }); enc.id = 'lote11-encontro'; enc.status = 'ativo'; enc.rodada = 1;
      enc.combatentes = [{ ...E.criarCombatente(c, { derived: d }), id: 'cmb1', sessao: { ...S.sessaoEmBranco(d), rodada: 1,
        combate: { ativo: true }, invocacoes: { F: { estado: 'ativa', pvAtual: null, exorcismos: 1 } } } }];
      enc.ativoId = 'cmb1';
      const q = createBlankAfty(); q.id = 'lote11-quimera'; q.name = 'Lote 11 Quimera'; q.rulesVersion = sistema;
      q.core.nd = 10; q.core.nivel = 10; q.especializacoes = [{ id: 'controlador', nivel: 10 }];
      q.habilidades = ['ctr_invocacoes_resistentes', 'ctr_visionario'];
      q.invocacoes = ['P', 'S'].map(id => ({ ...I.createBlankInvocacao('terceiro', 'shikigami'), id, nome: id }));
      q.invocacoes[0].acoes = [{ ...I.createBlankAcao(), id: 'garra', nome: 'Garra' }, { ...I.createBlankAcao(), id: 'rugido', nome: 'Rugido da Vaga Concedida' }];
      q.quimeras = [{ ...I.createBlankQuimera(), id: 'Q', nome: 'Agito', principalId: 'P', fundidasIds: ['S'] }];
      const dq = deriveAfty(q);
      q.campoRemovido = 'Antigo';
      const removida = { ...criar(sistema, 'Lote 11 Removida'), id: 'lote11-removida' };
      localStorage.setItem('fm_creatures_' + sistema + '_v1', JSON.stringify([c, q, removida]));
      localStorage.setItem('fm_creatures_' + outroSistema + '_v1', JSON.stringify([outra]));
      localStorage.setItem('afty_encontros_v1', JSON.stringify([enc]));
      return { pvFundamento: d.invocacoes.lista[0].pv, pvQuimera: dq.quimeras.lista[0].pv,
        partesQuimera: dq.quimeras.lista[0].resolvida.fontes.pv, outroSistema };
    }, rota);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Encontros', exact: true }).first().click();
    await page.locator('.afty-encontro-card').filter({ hasText: 'Lote 11 Encontro' }).getByRole('button', { name: 'Retomar', exact: true }).click();
    await page.getByRole('tab', { name: 'Invocações', exact: true }).click();
    await page.locator('.afty-inv-cartao').filter({ hasText: 'Divino' }).locator('.afty-inv-cartao-corpo').click();
    await page.evaluate(({ sistema, bloquear }) => {
      const key = 'fm_creatures_' + sistema + '_v1';
      const list = JSON.parse(localStorage.getItem(key));
      const c = list.find(c => c.id === 'lote11-dono');
      c.name = 'Lote 11 Edição Posterior'; c.core.nd = 11; c.core.nivel = 11;
      c.core.tecnicaNome = 'Técnica Editada Depois'; c.campoFuturo = { preservado: true };
      const q = list.find(c => c.id === 'lote11-quimera');
      q.campoPosterior = { preservado: 'Outra Ficha' }; delete q.campoRemovido;
      const nova = { ...q, id: 'lote11-nova', name: 'Lote 11 Nova', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-02-01T00:00:00.000Z' };
      localStorage.setItem(key, JSON.stringify([...list.filter(c => c.id !== 'lote11-removida'), nova]));
      if (bloquear) {
        window.__lote11Original = Storage.prototype.setItem;
        Storage.prototype.setItem = function(k, v) {
          if (k === key) throw new DOMException('Sem espaço', 'QuotaExceededError');
          return window.__lote11Original.call(this, k, v);
        };
      }
    }, { sistema: rota, bloquear: largura === 390 });
    const vida = page.locator('.afty-inv-ficha [data-afty-vital="pv"] input');
    await vida.fill('-' + esperado.pvFundamento * 3); await vida.press('Enter');
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('afty_encontros_v1'))[0].combatentes[0].ficha.fundamentosPerdidos.length === 1);
    if (largura === 390) {
      const aviso = page.getByRole('status').filter({ hasText: 'Perda do Fundamento Pendente na Biblioteca' });
      await aviso.waitFor(); assert.equal(await aviso.locator('svg').count(), 1);
      assert.equal(await page.evaluate(s => JSON.parse(localStorage.getItem('fm_creatures_' + s + '_v1'))[0].fundamentosPerdidos.length, rota), 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await aviso.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `.audit/verificacao-lote11-shots/${rota}-${largura}-falha-real.png` });
      await page.evaluate(() => { Storage.prototype.setItem = window.__lote11Original; delete window.__lote11Original; });
      await aviso.getByRole('button', { name: 'Tentar Novamente', exact: true }).click();
      await aviso.waitFor({ state: 'hidden' });
    }
    await page.waitForFunction(s => JSON.parse(localStorage.getItem('fm_creatures_' + s + '_v1'))[0].fundamentosPerdidos.length === 1, rota);
    await page.waitForTimeout(350);
    const biblioteca = await page.evaluate(s => JSON.parse(localStorage.getItem('fm_creatures_' + s + '_v1')), rota);
    assert.deepEqual(biblioteca.map(c => c.id), ['lote11-dono', 'lote11-quimera', 'lote11-nova']);
    assert.deepEqual(biblioteca[1].campoPosterior, { preservado: 'Outra Ficha' });
    assert.equal('campoRemovido' in biblioteca[1], false);
    assert.equal(biblioteca[2].createdAt, '2026-01-01T00:00:00.000Z');
    assert.equal(biblioteca[2].updatedAt, '2026-02-01T00:00:00.000Z');
    const salvo = await page.evaluate(s => ({ propria: JSON.parse(localStorage.getItem('fm_creatures_' + s + '_v1'))[0],
      outra: JSON.parse(localStorage.getItem('fm_creatures_' + (s === 'afty' ? 'player' : 'afty') + '_v1'))[0],
      encontro: JSON.parse(localStorage.getItem('afty_encontros_v1'))[0] }), rota);
    assert.equal(salvo.propria.name, 'Lote 11 Edição Posterior');
    assert.equal(salvo.propria.core.nd, 11); assert.equal(salvo.propria.core.tecnicaNome, 'Técnica Editada Depois');
    assert.deepEqual(salvo.propria.campoFuturo, { preservado: true });
    assert.deepEqual(salvo.outra.fundamentosPerdidos, []);
    assert.equal(salvo.encontro.combatentes[0].sessao.invocacoes.F.estado, 'morta');
    assert.deepEqual(salvo.encontro.fundamentosSemGravar ?? [], []);
    await page.screenshot({ path: `.audit/verificacao-lote11-shots/${rota}-${largura}-morte-encontro.png` });
    // A biblioteca deve mostrar a perda na mesma aba, sem reload.
    await page.getByRole('button', { name: 'Sair', exact: true }).click();
    await page.getByRole('button', { name: 'Grimório', exact: true }).click();
    await page.getByText('Lote 11 Edição Posterior', { exact: true }).click();
    await page.getByRole('tab', { name: 'Invocações', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Técnica Inata Indisponível: Fundamento Perdido' }).waitFor();
    await page.screenshot({ path: `.audit/verificacao-lote11-shots/${rota}-${largura}-perda-biblioteca.png` });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.getByRole('button', { name: 'Voltar', exact: true }).click();
    await page.getByText('Lote 11 Quimera', { exact: true }).click();
    await page.getByRole('tab', { name: 'Invocações', exact: true }).click();
    await page.locator('.afty-inv-cartao').filter({ hasText: 'Agito' }).locator('.afty-inv-cartao-corpo').click();
    const max = page.locator('.afty-inv-ficha [data-afty-vital="pv"] button.afty-vital-max');
    assert.equal((await max.innerText()).trim(), '/ ' + esperado.pvQuimera);
    if (largura === 390) await max.tap(); else await max.hover();
    await page.locator('.afty-fonte-rotulo:visible').getByText('Invocações Resistentes', { exact: true }).waitFor();
    const hoverFicha = await page.locator('.afty-fonte-rotulo:visible').filter({ hasText: 'Invocações Resistentes' }).innerText();
    await page.screenshot({ path: `.audit/verificacao-lote11-shots/${rota}-${largura}-quimera-fontes-ficha.png` });
    if (largura === 390) await page.mouse.click(5, 5); else await page.mouse.move(0, 0);
    await page.getByText('Rugido da Vaga Concedida', { exact: true }).waitFor();
    await page.locator('button[title="Editar no criador"]').click();
    await page.getByRole('tab', { name: 'Invocações', exact: true }).click();
    await page.locator('button[aria-expanded="false"]').filter({ hasText: 'Agito' }).click();
    const nome = page.getByPlaceholder('Nome da quimera');
    const card = nome.locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');
    const pvCard = card.locator('button[title="Pontos de Vida da Quimera"]');
    if (largura === 390) await pvCard.tap(); else await pvCard.hover();
    await page.locator('.afty-fonte-rotulo:visible').getByText('Invocações Resistentes', { exact: true }).waitFor();
    const hoverCriador = await page.locator('.afty-fonte-rotulo:visible').filter({ hasText: 'Invocações Resistentes' }).innerText();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `.audit/verificacao-lote11-shots/${rota}-${largura}-quimera-fontes-criador.png` });
    assert.deepEqual(erros, []);
    report.push({ rota, largura, pvFundamento: esperado.pvFundamento, pvQuimera: esperado.pvQuimera,
      partesQuimera: esperado.partesQuimera, perdaNaMesmaAba: true, edicoesPosterioresPreservadas: true, outraFichaInclusaoExclusaoPreservadas: true,
      bibliotecaCorreta: true, falhaENovaTentativa: largura === 390, visionarioManual: true, hoverFicha, hoverCriador, erros });
    console.log(`PASSOU ${rota} ${largura}`); await ctx.close();
  }
} finally {
  await browser.close(); await writeFile('.audit/verificacao-lote11-browser-resultados.json', JSON.stringify(report, null, 2));
}
