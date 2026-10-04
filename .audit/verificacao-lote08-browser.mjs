/* Lote 08: as portas entre os livros, medidas no app de verdade.
   Uso: PORTA=5180 node .audit/verificacao-lote08-browser.mjs */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const PORTA = process.env.PORTA || '5173';
const BASE = `http://127.0.0.1:${PORTA}`;
await mkdir('.audit/verificacao-lote08-shots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', ignoreDefaultArgs: ['--hide-scrollbars'] });
const relatorio = {};

/* O pacote: uma ficha de cada livro, uma da 2.5.2 sem marca de livro, e uma
   sem nome do PRÓPRIO livro da rota (o problema 2 pelo caminho real). */
const montarPacote = async (page, rota) => page.evaluate(async (rota) => {
  const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
  const e3 = (await import('/src/data/enciclopedia-digital-0.3.json')).default;
  const e2 = (await import('/src/data/enciclopedia-digital-0.2.json')).default;
  const semId = (c) => { const { id, ...resto } = c; return resto; };
  const da252 = { ...semId(e3.creatures[0]), name: 'Lote 08 Da 2.5.2' };
  const semMarca = { ...semId(e2.creatures[0]), name: 'Lote 08 Sem Marca' };
  const criatura = { ...createBlankAfty(), name: 'Lote 08 Criatura', rulesVersion: 'afty' };
  const personagem = { ...createBlankAfty(), name: 'Lote 08 Personagem', rulesVersion: 'player' };
  const semNome = rota === ''
    ? { ...semId(e3.creatures[1]), name: '' }
    : { ...createBlankAfty(), name: '', rulesVersion: rota };
  return JSON.stringify({ version: '2.0', creatures: [da252, semMarca, criatura, personagem, semNome], folders: [] });
}, rota);

const chaveDaRota = (rota) => (rota ? `fm_creatures_${rota}_v1` : 'fm_creatures_v1');

for (const rota of ['', 'afty', 'player']) for (const largura of [1440, 390]) {
  const nome = `${rota || 'raiz'}-${largura}`;
  const context = await browser.newContext({ viewport: { width: largura, height: 900 }, isMobile: largura === 390, hasTouch: largura === 390 });
  const page = await context.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  await page.goto(`${BASE}/${rota}`, { waitUntil: 'networkidle' });
  const r = { erros };
  relatorio[nome] = r;

  /* 1. IMPORT REAL, pelo modal do Dashboard. */
  const pacote = await montarPacote(page, rota);
  await page.locator('button[title="Importar"]').click();
  await page.getByPlaceholder('Cole aqui o JSON').fill(pacote);
  await page.locator('div[role="dialog"] button', { hasText: /^\s*Importar\s*$/ }).last().click();
  const aviso = page.getByRole('dialog', { name: 'Fichas de Outro Grimório' });
  r.avisoApareceu = await aviso.isVisible().catch(() => false);
  if (r.avisoApareceu) {
    r.recusadas = await aviso.locator('li').allInnerTexts();
    r.avisoTexto = (await aviso.innerText()).replace(/\s+/g, ' ');
    await page.screenshot({ path: `.audit/verificacao-lote08-shots/${nome}-recusa.png` });
    r.avisoLarguraOk = await page.evaluate((l) => document.documentElement.scrollWidth <= l, largura);
    await aviso.getByRole('button', { name: 'Entendi' }).click();
  }
  /* O modal de import da 2.5.2 segue aberto com a mensagem de sucesso dele. */
  const modalImport = page.locator('div[role="dialog"]').filter({ has: page.getByPlaceholder('Cole aqui o JSON') });
  if (await modalImport.count()) {
    r.mensagemDoImport = (await modalImport.innerText()).split('\n').filter((l) => /importad|inválid|Formato/i.test(l));
    await modalImport.locator('button[aria-label="Fechar"]').click();
  }
  r.inventario = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '[]').map((c) => `${c.name} [${c.rulesVersion}]`), chaveDaRota(rota));

  /* 2. AS CRIATURAS BASE na barra lateral. No telefone ela mora na gaveta. */
  if (largura === 390) {
    const gaveta = page.locator('button[aria-label="Abrir menu de pastas"]');
    if (await gaveta.count()) await gaveta.first().click();
  }
  r.criaturasBase = await page.getByText('Criaturas Base', { exact: false }).count();
  await page.screenshot({ path: `.audit/verificacao-lote08-shots/${nome}-lista.png` });
  await context.close();
}

/* 3. A PORTA DE USO no privado: uma ficha da 2.5.2 que JÁ morava no /Afty
   (plantada direto no storage, como faria um import antigo). */
for (const rota of ['afty', 'player']) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto(`${BASE}/${rota}`, { waitUntil: 'networkidle' });
  await page.evaluate(async ({ k, rota }) => {
    const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
    const e3 = (await import('/src/data/enciclopedia-digital-0.3.json')).default;
    const legado = { ...e3.creatures[0], id: 'lote08-legado', name: 'Lote 08 Legado', folderId: null, isBuiltIn: false };
    const daRota = { ...createBlankAfty(), id: 'lote08-darota', name: 'Lote 08 Da Rota', rulesVersion: rota };
    localStorage.setItem(k, JSON.stringify([legado, daRota]));
  }, { k: chaveDaRota(rota), rota });
  await page.reload({ waitUntil: 'networkidle' });
  const r = { erros };
  relatorio[`uso-${rota}`] = r;

  await page.getByText('Lote 08 Legado', { exact: true }).click();
  await page.waitForTimeout(600);
  r.legadoAbreNoPainel252 = await page.locator('button[aria-label="Voltar ao Dashboard"]').count() > 0;
  r.legadoAbreNaFichaAfty = await page.getByRole('tab', { name: 'Ações', exact: true }).count() > 0;
  await page.screenshot({ path: `.audit/verificacao-lote08-shots/uso-${rota}-legado.png` });
  await page.goto(`${BASE}/${rota}`, { waitUntil: 'networkidle' });
  await page.getByText('Lote 08 Da Rota', { exact: true }).click();
  await page.getByRole('tab', { name: 'Ações', exact: true }).waitFor({ timeout: 8000 }).catch(() => {});
  r.daRotaAbreNaFichaAfty = await page.getByRole('tab', { name: 'Ações', exact: true }).count() > 0;

  /* 4. A BIBLIOTECA DE MODELOS: quem ela oferece para aplicar. */
  await page.goto(`${BASE}/${rota}`, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const { saveTemplateFromEntity } = await import('/src/components/fm-templates.js');
    const e3 = (await import('/src/data/enciclopedia-digital-0.3.json')).default;
    const acao = (e3.creatures.find((c) => (c.actions ?? []).length)?.actions ?? [])[0];
    saveTemplateFromEntity('acao', { ...acao, name: 'Modelo Lote 08' });
  });
  await page.locator('button[title="Biblioteca de Modelos"]').click();
  await page.getByText('Modelo Lote 08', { exact: false }).first().waitFor({ timeout: 8000 });
  await page.locator('button[title="Selecionar em massa"]').click();
  await page.locator('button[aria-label="Selecionar"]').first().click();
  await page.getByRole('button', { name: /Aplicar em fichas/ }).click();
  await page.waitForTimeout(500);
  const modal = page.locator('div[role="dialog"]').last();
  const texto = (await modal.innerText().catch(() => '')).replace(/\s+/g, ' ');
  r.modelosOferecemLegado = texto.includes('Lote 08 Legado');
  r.modelosOferecemDaRota = texto.includes('Lote 08 Da Rota');
  await page.screenshot({ path: `.audit/verificacao-lote08-shots/uso-${rota}-modelos.png` });
  await context.close();
}

await browser.close();
await writeFile('.audit/verificacao-lote08-resultado.json', JSON.stringify(relatorio, null, 2));
console.log(JSON.stringify(relatorio, null, 2));
