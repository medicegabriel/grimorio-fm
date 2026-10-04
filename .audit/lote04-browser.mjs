import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir('.audit/lote04-shots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', ignoreDefaultArgs: ['--hide-scrollbars'] });
const relatorio = [];
try {
 for (const rota of ['afty', 'player']) for (const largura of [1440, 390]) {
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
  const acao = async () => { await page.getByRole('tab', { name: 'Ações', exact: true }).click(); await page.evaluate(() => window.scrollTo(0, 0)); };
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
  await conferir('basico', '3m');
  const articulacoes = await fontes('basico', '3m', ['Articulações Extensas'], 'articulacoes');
  await buffs();
  for (const nome of ['Auxiliar Corpo', 'Auxiliar Distância']) {
   const row = page.locator('.afty-estado-linha').filter({ has: page.getByText(nome, { exact: true }) });
   await row.getByRole('button', { name: 'Inativa', exact: true }).press('Enter');
  }
  await acao();
  await conferir('basico', '7,5m'); await conferir('arm_espada_curta', '7,5m');
  await conferir('arm_arco_longo', '39m / 69m'); await conferir('arm_azagaia', '21m / 33m');
  const corpo = await fontes('basico', '7,5m', ['Auxiliar Corpo', 'Articulações Extensas'], 'auxiliar-corpo');
  const distancia = await fontes('arm_arco_longo', '39m / 69m', ['Auxiliar Distância'], 'auxiliar-distancia');
  await buffs();
  await page.getByRole('textbox', { name: 'Filtrar os estados', exact: true }).fill('Manobra Finalizadora');
  await page.getByRole('button', { name: 'Ataque Circular', exact: true }).click();
  await acao();
  await conferir('basico', '10,5m'); await conferir('arm_espada_curta', '10,5m');
  await conferir('arm_arco_longo', '39m / 69m');
  const circular = await fontes('basico', '10,5m', ['Auxiliar Corpo', 'Articulações Extensas', 'Manobras Finalizadoras'], 'circular');
  const dimensoes = await page.evaluate(() => ({ viewport: innerWidth, largura: document.documentElement.scrollWidth, corpo: document.body.scrollWidth }));
  assert.ok(dimensoes.largura <= largura, 'Sem rolagem horizontal');
  await buffs();
  await page.getByRole('textbox', { name: 'Filtrar os estados', exact: true }).fill('Manobra Finalizadora');
  await page.getByRole('button', { name: 'Ataque Circular', exact: true }).click();
  await acao(); await conferir('basico', '7,5m');
  await buffs();
  await page.getByRole('textbox', { name: 'Filtrar os estados', exact: true }).fill('Auxiliar');
  for (const nome of ['Auxiliar Corpo', 'Auxiliar Distância']) {
   const row = page.locator('.afty-estado-linha').filter({ has: page.getByText(nome, { exact: true }) });
   await row.getByRole('button', { name: 'Ativa', exact: true }).press('Enter');
  }
  await acao(); await conferir('basico', '3m'); await conferir('arm_arco_longo', '30m / 60m');
  await page.getByRole('tab', { name: 'Habilidades', exact: true }).click();
  await page.getByText('Articulações Extensas', { exact: true }).click();
  await page.getByText(/Suas juntas são mais longas/).waitFor();
  await page.screenshot({ path: `.audit/lote04-shots/${rota}-${largura}-caracteristica.png`, fullPage: true });
  assert.deepEqual(erros, []);
  const resultado = { rota, largura, articulacoes, corpo, distancia, circular, dimensoes, erros };
  relatorio.push(resultado);
  console.log(JSON.stringify(resultado));
  await context.close();
 }
 await writeFile('.audit/lote04-browser-resultados.json', JSON.stringify(relatorio, null, 2));
} finally { await browser.close(); }

