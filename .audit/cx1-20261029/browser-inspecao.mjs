import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome', ignoreDefaultArgs: ['--hide-scrollbars'] });
try {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  await page.goto('http://127.0.0.1:5187/player', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    const { deriveAfty } = await import('/src/systems/afty/afty-derive.js');
    const { createBlankAfty } = await import('/src/systems/afty/afty-schema.js');
    const { aplicarAddons } = await import('/src/systems/afty/afty-addons.js');
    aplicarAddons([]);
    const c = createBlankAfty();
    c.id = 'cx1-browser'; c.name = 'CX1 Isolada'; c.rulesVersion = 'player';
    c.core.nd = 15; c.core.origem = { id: 'feto_amaldicoado_hibrido', anatomias: ['arma_natural', 'articulacoes_extensas', 'corpo_especializado', 'bracos_extras'] };
    c.especializacoes = [{ id: 'lutador', nivel: 15 }];
    c.attributes = { forca: 14, destreza: 14, constituicao: 14, inteligencia: 12, sabedoria: 12, presenca: 10 };
    c.equipamentos.itens = [{ uid: 'cx1-bastao', tipo: 'arma', refId: 'arm_bastao', qtd: 1, equipado: true }];
    deriveAfty(c);
    localStorage.setItem('fm_creatures_player_v1', JSON.stringify([c]));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText('CX1 Isolada', { exact: true }).click();
  console.log((await page.locator('body').innerText()).slice(0, 3500));
  console.log(await page.locator('button').evaluateAll(es => es.map(e => ({ text:e.innerText, title:e.title, aria:e.getAttribute('aria-label') })).filter(x => /dit|ol|qui|rig|Salv/.test(x.text+x.title+x.aria))));
  await page.screenshot({ path: '.audit/cx1-20261029/ficha-inicial.png' });
  await page.getByTitle('Editar no criador', { exact: true }).press('Enter', { noWaitAfter: true });
  await page.waitForTimeout(2500);
  console.log('CRIADOR', (await page.locator('body').innerText()).slice(0, 2100));
  console.log('BOTOES', await page.locator('button').allTextContents());
} finally { await browser.close(); }
