import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const stark = JSON.parse(fs.readFileSync('addons/stark.json', 'utf8'));
const report = [];
try {
  for (const sistema of ['afty', 'player']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 1100 } });
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const abrir = async () => {
      await page.getByText('Votos e Addons', { exact: true }).click();
      await page.locator('button[title="Editar no criador"]').click();
      await page.getByRole('tab', { name: 'Outros', exact: true }).click();
      await page.getByRole('menuitem', { name: 'Votos', exact: true }).click();
    };
    try {
      await page.goto(`http://127.0.0.1:5305/${sistema}`, { waitUntil: 'networkidle' });
      await page.evaluate(async ({ sistema, stark }) => {
        const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
        const c = createBlankAfty(); c.id = 'votos-addons'; c.name = 'Votos e Addons'; c.rulesVersion = sistema; c.core.nd = 1; c.addons = [stark];
        c.votos.mecanicos = Array.from({ length: 2 }, (_, i) => ({ id: `livre-${i}`, nome: `Voto livre ${i + 1}`, narrativa: '', beneficio: { texto: '', efeitos: [] }, maleficio: { texto: '', efeitos: [] } }));
        localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c]));
      }, { sistema, stark });
      await page.reload({ waitUntil: 'networkidle' }); await abrir();
      const mecanicos = page.getByRole('region', { name: 'Votos Mecânicos' });
      assert.equal(await mecanicos.getByRole('button', { name: /O Covarde/ }).count(), 1);
      assert.equal(await mecanicos.getByRole('button', { name: 'Remover Voto Mecânico 1', exact: true }).count(), 0);
      assert.equal(await mecanicos.getByText('Voto do Addon', { exact: true }).count(), 1);
      assert.equal(await mecanicos.getByText('Automação inativa acima do BT', { exact: true }).count(), 1);
      assert.equal(await mecanicos.getByRole('button', { name: 'Adicionar Voto Mecânico', exact: true }).isDisabled(), true);
      await mecanicos.getByRole('button', { name: 'Remover Voto Mecânico 3', exact: true }).click();
      await mecanicos.getByRole('button', { name: 'Remover Voto Mecânico 2', exact: true }).click();
      const modelo = mecanicos.getByRole('button', { name: /^Usar o Voto/ });
      await modelo.click();
      assert.equal(await page.getByLabel('Nome do Voto', { exact: true }).inputValue(), 'Maldição - Instinto Corrompido');
      assert.equal(await mecanicos.getByRole('button', { name: /^Usar o Voto/ }).count(), 0);
      assert.equal(await mecanicos.getByRole('button', { name: 'Adicionar Voto Mecânico', exact: true }).isDisabled(), true);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.getByRole('button', { name: 'Salvar Alterações', exact: true }).click();
      const salvo = await page.evaluate(sistema => JSON.parse(localStorage.getItem(`fm_creatures_${sistema}_v1`))[0], sistema);
      assert.equal(salvo.votos.mecanicos.length, 2);
      assert.equal(salvo.votos.mecanicos[0].origemAddon, 'stark');
      assert.equal(salvo.votos.mecanicos[1].nome, 'Maldição - Instinto Corrompido');
      assert.deepEqual(errors, []);
      report.push({ sistema, automaticoProtegido: true, excedentePreservado: true, limiteBT: true, modeloDisponivel: true, modeloAbreAoAdicionar: true, modeloSemDuplicacao: true, persistencia: true, errors });
    } catch (error) {
      await page.screenshot({ path: `.audit/votos-ui/falha-addons-${sistema}.png`, fullPage: true }); throw error;
    } finally { await context.close(); }
  }
} finally {
  fs.writeFileSync('.audit/votos-ui/limites-addons-report.json', JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(JSON.stringify(report));
