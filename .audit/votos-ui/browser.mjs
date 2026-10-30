import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = [];
const base = 'http://127.0.0.1:5305';
const voto = (id, nome) => ({ id, nome, narrativa: 'Um acordo firmado durante a jornada.', beneficio: { texto: 'Proteção enquanto o acordo for cumprido.', efeitos: [{ canal: 'defesa', expr: '2', quando: 'bt > 0', duracao: 'temporaria' }] }, maleficio: { texto: 'Uma restrição para honrar o compromisso.', efeitos: [] } });

async function abrirCriador(page, nome = 'Revisão de Votos') {
  await page.getByText(nome, { exact: true }).click();
  await page.locator('button[title="Editar no criador"]').click();
  await page.getByRole('tab', { name: 'Outros', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Votos', exact: true }).click();
}

async function semOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Sem rolagem horizontal');
}

try {
  for (const sistema of ['afty', 'player']) {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 1100 } });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      try {
        await page.goto(`${base}/${sistema}`, { waitUntil: 'networkidle' });
        await page.evaluate(async ({ sistema, votos }) => {
          const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
          const c = createBlankAfty();
          c.id = 'revisao-votos'; c.name = 'Revisão de Votos'; c.rulesVersion = sistema; c.core.nd = 20;
          c.votos = { mecanicos: votos, contratuais: [{ id: 'contrato-1', texto: 'Acordo com os aliados para proteger a vila.' }] };
          localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c]));
        }, { sistema, votos: [voto('voto-1', 'Vigília Silenciosa'), voto('voto-2', 'Promessa de Retorno')] });
        await page.reload({ waitUntil: 'networkidle' });
        await abrirCriador(page);
        const mecanicos = page.getByRole('region', { name: 'Votos Mecânicos' });
        const contratuais = page.getByRole('region', { name: 'Votos Contratuais' });
        const primeiro = mecanicos.getByRole('button', { name: /Vigília Silenciosa/ });
        assert.equal(await primeiro.getAttribute('aria-expanded'), 'false');
        await primeiro.click();
        await page.getByLabel('Nome do Voto', { exact: true }).fill('Vigília do Guardião');
        await page.getByLabel('Narrativa do Voto', { exact: true }).fill('Um compromisso com a proteção da vila.');
        await page.getByLabel('Benefício', { exact: true }).fill('Recebe proteção enquanto guarda a vila.');
        await page.getByLabel('Malefício', { exact: true }).fill('Não pode abandonar sua vigília.');
        const beneficio = page.getByLabel('Benefício', { exact: true });
        const maleficio = page.getByLabel('Malefício', { exact: true });
        const b = await beneficio.boundingBox(); const m = await maleficio.boundingBox();
        assert.equal(width === 1440 ? Math.abs(b.y - m.y) < 2 : m.y > b.y, true, 'Colunas responsivas');
        const resumoBeneficio = page.locator('summary[title="Automação do Benefício, opcional"]');
        assert.equal(await resumoBeneficio.locator('..').getAttribute('open'), null);
        assert.match(await resumoBeneficio.innerText(), /1 efeito/);
        await semOverflow(page);
        await page.screenshot({ path: `.audit/votos-ui/${sistema}-${width}.png`, fullPage: true });
        await page.getByRole('heading', { name: 'Votos', exact: true }).locator('..').locator('..').screenshot({ path: `.audit/votos-ui/aba-${sistema}-${width}.png` });
        const alturaEditor = await page.locator('#editor-voto-1').evaluate(el => el.getBoundingClientRect().height);

        await resumoBeneficio.click();
        const motorBeneficio = resumoBeneficio.locator('..');
        await motorBeneficio.getByRole('button', { name: 'Adicionar efeito', exact: true }).click();
        await motorBeneficio.getByPlaceholder('2 + piso(bt / 2)').nth(1).fill('3');
        await motorBeneficio.getByPlaceholder('sempre').nth(1).fill('nd >= 5');
        await motorBeneficio.getByLabel('Duração', { exact: true }).nth(1).selectOption('temporaria');
        await motorBeneficio.getByRole('button', { name: 'Canal', exact: true }).nth(1).click();
        await semOverflow(page);
        await page.keyboard.press('Escape');
        await semOverflow(page);
        await resumoBeneficio.click();
        await mecanicos.getByRole('button', { name: /Promessa de Retorno/ }).click();
        assert.equal(await page.locator('#editor-voto-1').isVisible(), false);
        await mecanicos.getByRole('button', { name: /Vigília do Guardião/ }).click();
        assert.equal(await page.getByLabel('Narrativa do Voto', { exact: true }).inputValue(), 'Um compromisso com a proteção da vila.');
        assert.equal(await resumoBeneficio.locator('..').getAttribute('open'), null);
        await mecanicos.getByRole('button', { name: 'Adicionar Voto Mecânico', exact: true }).click();
        await page.getByLabel('Nome do Voto', { exact: true }).fill('Novo voto de teste');
        await mecanicos.getByRole('button', { name: 'Remover Voto Mecânico 3', exact: true }).click();
        assert.equal(await mecanicos.getByRole('button', { name: /Novo voto de teste/ }).count(), 0);
        await contratuais.getByRole('button', { name: 'Adicionar Voto Contratual', exact: true }).click();
        await page.getByLabel('Acordo e condições', { exact: true }).fill('Novo acordo para a viagem.');
        await contratuais.getByRole('button', { name: /Novo acordo para a viagem/ }).focus();
        await page.keyboard.press('Enter');
        assert.equal(await page.getByLabel('Acordo e condições', { exact: true }).count(), 0);
        await page.keyboard.press('Enter');
        assert.equal(await page.getByLabel('Acordo e condições', { exact: true }).inputValue(), 'Novo acordo para a viagem.');
        await contratuais.getByRole('button', { name: 'Remover Voto Contratual 1', exact: true }).click();
        await page.getByRole('button', { name: 'Salvar Alterações', exact: true }).click();
        const salvo = await page.evaluate(sistema => JSON.parse(localStorage.getItem(`fm_creatures_${sistema}_v1`))[0], sistema);
        assert.equal(salvo.votos.mecanicos.length, 2);
        assert.equal(salvo.votos.mecanicos[0].nome, 'Vigília do Guardião');
        assert.equal(salvo.votos.mecanicos[0].beneficio.texto, 'Recebe proteção enquanto guarda a vila.');
        assert.equal(salvo.votos.mecanicos[0].maleficio.texto, 'Não pode abandonar sua vigília.');
        assert.deepEqual(salvo.votos.mecanicos[0].beneficio.efeitos[0], { canal: 'defesa', expr: '2', quando: 'bt > 0', duracao: 'temporaria' });
        assert.equal(salvo.votos.mecanicos[0].beneficio.efeitos.length, 2);
        assert.deepEqual(salvo.votos.mecanicos[0].beneficio.efeitos[1], { canal: 'defesa', expr: '3', quando: 'nd >= 5', duracao: 'temporaria' });
        assert.equal(salvo.votos.contratuais.length, 1);
        assert.equal(salvo.votos.contratuais[0].texto, 'Novo acordo para a viagem.');
        await page.reload({ waitUntil: 'networkidle' });
        await abrirCriador(page);
        await page.getByRole('region', { name: 'Votos Mecânicos' }).getByRole('button', { name: /Vigília do Guardião/ }).click();
        assert.equal(await page.getByLabel('Malefício', { exact: true }).inputValue(), 'Não pode abandonar sua vigília.');
        await semOverflow(page);
        assert.deepEqual(errors, []);
        report.push({ sistema, width, alturaEditor, colunas: width === 1440 ? 2 : 1, edicao: true, inclusaoRemocao: true, teclado: true, persistencia: true, errors });
      } catch (error) {
        await page.screenshot({ path: `.audit/votos-ui/falha-${sistema}-${width}.png`, fullPage: true });
        throw error;
      } finally {
        await context.close();
      }
    }
  }
} finally {
  fs.writeFileSync('.audit/votos-ui/browser-report.json', JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(JSON.stringify(report));
