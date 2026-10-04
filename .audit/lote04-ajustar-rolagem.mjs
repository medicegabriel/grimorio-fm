import { readFileSync, writeFileSync } from 'node:fs';
const arquivo = '.audit/lote04-browser.mjs';
let texto = readFileSync(arquivo, 'utf8');
texto = texto.replace("const acao = () => page.getByRole('tab', { name: 'Ações', exact: true }).click();", "const acao = async () => { await page.getByRole('tab', { name: 'Ações', exact: true }).click(); await page.evaluate(() => window.scrollTo(0, 0)); };");
writeFileSync(arquivo, texto, 'utf8');
const inspecao = '.audit/lote04-toque-inspecao.mjs';
let toque = readFileSync(inspecao, 'utf8');
toque = toque.replace("  await page.screenshot({ path: '.audit/lote04-shots/toque-inspecao.png' });", "  await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');\n  console.log('APÓS FOCO DE TECLADO', await b.getAttribute('aria-expanded'), await page.locator('.afty-fontes-flutuante').allTextContents());\n  await page.screenshot({ path: '.audit/lote04-shots/toque-inspecao.png' });");
writeFileSync(inspecao, toque, 'utf8');
