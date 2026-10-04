import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('.audit/lote04-shots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', ignoreDefaultArgs: ['--hide-scrollbars'] });
const relatorio = [];
try {
 for (const rota of ['afty']) for (const largura of [390]) {
  const context = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  const page = await context.newPage();
  const erros = [];
  page.on('pageerror', e => erros.push(e.message));
  page.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await page.goto(`http://127.0.0.1:5184/${rota}`, { waitUntil: 'networkidle' });
  await page.evaluate(async sistema => {
   const { deriveAfty } = await import('/src/systems/afty/afty-derive.js');
   const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
   const { aplicarAddons } = await import('/src/systems/afty/afty-addons.js');
   const { sessaoEmBranco } = await import('/src/systems/afty/ficha/ficha-sessao.js');
   const pacote = await (await fetch('/addons/maldicao-era-de-ouro.json')).json();
   aplicarAddons([pacote]);
   const c = createBlankAfty();
   c.id = 'lote04-alcance'; c.name = 'Lote 04 Alcance'; c.rulesVersion = sistema;
   c.core.nd = 20; c.core.origem = { id: 'maldicao-era-de-ouro:maldicao_era_de_ouro' };
   c.especializacoes = [{ id: 'lutador', nivel: 20 }];
   c.habilidades = ['lut_manobras_finalizadoras'];
   c.addons = [pacote];
   c.caracteristicasAmaldicoadas = ['maldicao-era-de-ouro:ca_articulacoes_extensas'];
   c.equipamentos.itens = ['arm_espada_curta', 'arm_arco_longo', 'arm_azagaia'].map((refId, i) => ({ id: `arma${i}`, tipo: 'arma', refId, equipado: true, qtd: 1 }));
   c.feiticos = [{ id: 'aux_corpo', nome: 'Auxiliar Corpo', tipo: 'auxiliar', nivel: 2, efeitoAux: 'alcanceCaC', duracaoAux: 'duradoura' }, { id: 'aux_distancia', nome: 'Auxiliar Distância', tipo: 'auxiliar', nivel: 2, efeitoAux: 'alcanceDistancia', duracaoAux: 'duradoura' }];
   const s = sessaoEmBranco(deriveAfty(c)); s.combate = { ativo: true, empolgacao: 5 };
   localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([c]));
   localStorage.setItem('fm_ficha_sessao_afty_v1:' + c.id, JSON.stringify(s));
  }, rota);
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText('Lote 04 Alcance', { exact: true }).click();
  const acao = () => page.getByRole('tab', { name: 'Ações', exact: true }).click();
  const linha = id => page.locator(`[id="afty-item-dano:${id}"]`);
  const conferir = async (id, texto) => assert.equal(await linha(id).getByRole('button', { name: texto, exact: true }).count(), 1, `${rota} ${largura} ${id}: ${texto}`);
  const fontes = async (id, texto, nomes, nomeArquivo) => {
   const botao = linha(id).getByRole('button', { name: texto, exact: true });
   if (largura === 390) await botao.tap(); else await botao.hover();
   for (const nome of nomes) await page.locator('.afty-fonte-rotulo').getByText(nome, { exact: true }).waitFor();
   const painel = await page.locator('.afty-fonte-linha').allTextContents();
   await page.screenshot({ path: `.audit/lote04-shots/${rota}-${largura}-${nomeArquivo}.png` });
   if (largura === 390) await botao.tap(); else await page.mouse.move(0, 0);
   return painel;
  };
  const buffs = async () => {
   await page.getByRole('tab', { name: 'Buffs', exact: true }).click();
   if (!await page.getByRole('textbox', { name: 'Filtrar os estados', exact: true }).isVisible()) await page.getByRole('button', { name: /^Estados/ }).click();
  };
  await acao();
  const b = linha('basico').getByRole('button', { name: '3m', exact: true });
  await page.evaluate(() => { window.eventosAlcance = []; for (const tipo of ['pointerdown', 'focusin', 'click']) document.addEventListener(tipo, e => { if (e.target.textContent === '3m') window.eventosAlcance.push({ tipo, expandido: e.target.getAttribute('aria-expanded'), focusVisible: e.target.matches(':focus-visible'), hover: matchMedia('(hover: hover)').matches }); }, true); });
  await b.tap();
  console.log('APÓS TOQUE', await b.getAttribute('aria-expanded'), await page.evaluate(() => window.eventosAlcance), await page.locator('.afty-fontes-flutuante').count());
  await b.tap();
  console.log('APÓS SEGUNDO TOQUE', await b.getAttribute('aria-expanded'), await page.locator('.afty-fontes-flutuante').allTextContents());
  await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
  console.log('APÓS FOCO DE TECLADO', await b.getAttribute('aria-expanded'), await page.locator('.afty-fontes-flutuante').allTextContents());
  await page.screenshot({ path: '.audit/lote04-shots/toque-inspecao.png' });
  await context.close();
 }
 await writeFile('.audit/lote04-browser-resultados.json', JSON.stringify(relatorio, null, 2));
} finally { await browser.close(); }

