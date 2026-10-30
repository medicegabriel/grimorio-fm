import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const out = '.audit/estilo-repeticao-shots';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = [];
try {
  for (const sistema of ['afty', 'player']) for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, hasTouch: width === 390 });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:5298/${sistema}`, { waitUntil: 'networkidle' });
    await page.evaluate(async sistema => {
      const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
      const { createBlankTecnicaEstilo } = await import('/src/systems/afty/afty-estilo-sombras.js');
      const c = createBlankAfty();
      c.id = 'teste-estilo-repeticao'; c.name = 'Teste Repetição'; c.rulesVersion = sistema;
      c.core.nd = 13; c.core.origem = { id: 'sem_tecnica' };
      c.aptidoes = { dom: 5, au: 3, cl: 3 };
      c.aptidoesAmaldicoadas = ['aura_reforcada', 'cobrir_se'];
      const t = { ...createBlankTecnicaEstilo(), id: 't1', nome: 'Técnica de Teste', exaustao: 20 };
      t.efeitos = ['defesa', 'tr', 'pericia', 'margem', 'deslocamento', 'acerto', 'cd'].flatMap(id => [0, 1].map(i => ({ uid: id + i, efeitoId: id,
        ...(id === 'tr' ? { escolha: { tr: 'reflexos' } } : id === 'pericia' ? { escolha: { pericia: 'percepcao' } } : id === 'acerto' ? { escolha: { ataque: 'corpo' } } : {}),
      })));
      t.aptidoes = ['au_bonus_numerico', 'cl_bonus_numerico'].flatMap(modId => [0, 1].map(i => ({ uid: modId + i, modId, aptidaoId: modId.startsWith('au') ? 'aura_reforcada' : 'cobrir_se' })));
      c.estilosSombra = [t];
      c.combate = { ativo: true, estilo_ativo: true, estilo_tecnica: ['t1'], cobrirSePE: 2 };
      localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c]));
    }, sistema);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByText('Teste Repetição', { exact: true }).click();
    await page.locator('button[title="Editar no criador"]').click();
    await page.getByRole('tab', { name: 'Habilidades', exact: true }).click();
    const defesa = page.getByLabel('Repetição de Aumento de Defesa', { exact: true });
    await defesa.waitFor();
    assert.equal(await defesa.inputValue(), 'aliados');
    const selectors = page.locator('select[aria-label^="Repetição de "]');
    assert.equal(await selectors.count(), 7);
    for (const select of await selectors.all()) await select.selectOption('pessoal');
    await page.getByText('Aumento de Defesa +5', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Adicionar Aumento de Defesa', exact: true }).isDisabled(), true);
    assert.equal(await page.getByRole('button', { name: 'Adicionar Bônus de CD', exact: true }).isDisabled(), true);
    await page.getByLabel('Escolha de Bônus de Acerto', { exact: true }).selectOption('corpo');
    assert.equal(await page.getByRole('button', { name: 'Adicionar Bônus de Acerto', exact: true }).isDisabled(), true);
    assert.equal(await page.getByText('Defesa dos Aliados no Domínio +2', { exact: true }).count(), 0);
    await defesa.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/${sistema}-${width}.png` });
    const horizontal = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(horizontal, false);
    await defesa.selectOption('aliados');
    await page.getByText('Defesa dos Aliados no Domínio +2', { exact: true }).waitFor();
    await defesa.selectOption('pessoal');
    await page.getByText('Aumento de Defesa +5', { exact: true }).waitFor();
    console.log(JSON.stringify({ sistema, width, errors, botoes: (await page.getByRole('button').allTextContents()).slice(0, 8) }));
    await page.getByRole('button', { name: 'Salvar Alterações', exact: true }).click();
    const gravada = await page.evaluate(sistema => JSON.parse(localStorage.getItem(`fm_creatures_${sistema}_v1`))[0], sistema);
    assert.equal(gravada.estilosSombra[0].efeitos.find(e => e.uid === 'defesa1').repeticao, 'pessoal');
    assert.equal(gravada.estilosSombra[0].aptidoes.find(e => e.uid === 'au_bonus_numerico1').repeticao, 'pessoal');
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByText('Teste Repetição', { exact: true }).click();
    await page.locator('button[title="Editar no criador"]').click();
    await page.getByRole('tab', { name: 'Habilidades', exact: true }).click();
    assert.equal(await defesa.inputValue(), 'pessoal');
    assert.deepEqual(errors, []);
    report.push({ sistema, width, seletores: 7, persistencia: true, horizontal, errors });
    await context.close();
  }
} finally {
  writeFileSync('.audit/estilo-repeticao-browser-report.json', JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(JSON.stringify(report, null, 2));
