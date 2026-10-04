import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
await mkdir('.audit/lote04-shots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', ignoreDefaultArgs: ['--hide-scrollbars'] });
try {
 const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
 const page = await context.newPage();
 const erros = [];
 page.on('pageerror', e => erros.push(e.message));
 await page.goto('http://127.0.0.1:5184/afty', { waitUntil: 'networkidle' });
 await page.evaluate(async () => {
  const { deriveAfty } = await import('/src/systems/afty/afty-derive.js');
  const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
  const { aplicarAddons } = await import('/src/systems/afty/afty-addons.js');
  const { sessaoEmBranco } = await import('/src/systems/afty/ficha/ficha-sessao.js');
  const pacote = await (await fetch('/addons/maldicao-era-de-ouro.json')).json();
  aplicarAddons([pacote]);
  const c = createBlankAfty();
  c.id = 'lote04-alcance'; c.name = 'Lote 04 Alcance'; c.rulesVersion = 'afty';
  c.core.nd = 20; c.core.origem = { id: 'maldicao-era-de-ouro:maldicao_era_de_ouro' };
  c.especializacoes = [{ id: 'lutador', nivel: 20 }];
  c.habilidades = ['lut_manobras_finalizadoras'];
  c.addons = [pacote];
  c.caracteristicasAmaldicoadas = ['maldicao-era-de-ouro:ca_articulacoes_extensas'];
  c.equipamentos.itens = ['arm_espada_curta', 'arm_arco_longo', 'arm_azagaia'].map((refId, i) => ({ id: `arma${i}`, tipo: 'arma', refId, equipado: true, qtd: 1 }));
  c.feiticos = [{ id: 'aux_corpo', nome: 'Auxiliar Corpo', tipo: 'auxiliar', nivel: 2, efeitoAux: 'alcanceCaC', duracaoAux: 'duradoura' }, { id: 'aux_distancia', nome: 'Auxiliar Distância', tipo: 'auxiliar', nivel: 2, efeitoAux: 'alcanceDistancia', duracaoAux: 'duradoura' }];
  const s = sessaoEmBranco(deriveAfty(c)); s.combate = { ativo: true, empolgacao: 5 };
  localStorage.setItem('fm_creatures_afty_v1', JSON.stringify([c]));
  localStorage.setItem('fm_ficha_sessao_afty_v1:' + c.id, JSON.stringify(s));
 });
 await page.reload({ waitUntil: 'networkidle' });
 await page.getByText('Lote 04 Alcance', { exact: true }).click();
 await page.getByRole('tab', { name: 'Ações', exact: true }).waitFor();
 console.log('AÇÕES', (await page.locator('body').innerText()).slice(0, 3000));
 await page.getByRole('tab', { name: 'Buffs', exact: true }).click();
 await page.getByRole('button', { name: /^Estados/ }).click();
 console.log('BUFFS', (await page.locator('body').innerText()).slice(-6500));
 console.log('CONTROLES', await page.locator('button,select,input').evaluateAll(es => es.map(e => ({tag:e.tagName, text:e.innerText, title:e.title, aria:e.getAttribute('aria-label'), value:e.value, type:e.type})).filter(x=>x.text?.includes('Auxiliar')||x.text?.includes('Finalizadora')||x.tag!=='BUTTON')));
 console.log('ERROS', erros);
 await page.screenshot({ path: '.audit/lote04-shots/inspecao-buffs.png', fullPage: true });
} finally { await browser.close(); }

