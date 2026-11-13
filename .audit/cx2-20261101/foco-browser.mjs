import { register } from 'node:module';
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const R = new URL('../../src/systems/afty/', import.meta.url);
const { deriveAfty } = await import(new URL('afty-derive.js', R));
const { createBlankAfty } = await import(new URL('afty-schema.js', R));
const F = await import(new URL('afty-feiticos.js', R));
const { aplicarAddons } = await import(new URL('afty-addons.js', R));
const { criarEncontro, criarCombatente } = await import(new URL('encontros/afty-encontro.js', R));
aplicarAddons([]);
const browser = await chromium.launch({ channel: 'chrome', ignoreDefaultArgs: ['--hide-scrollbars'] });
const resultados = [];
function ficha(sistema, nome, campos) {
  const c = createBlankAfty(); c.id = nome; c.name = nome; c.rulesVersion = sistema;
  c.core = { ...c.core, nd: 15, tipo: 'conjurador', patamar: 'comum', origem: { id: 'herdado', cla: 'cla_zenin' } };
  c.especializacoes = [{ id: 'conjurador', nivel: 15 }];
  c.attributes = { forca: 10, destreza: 12, constituicao: 14, inteligencia: 16, sabedoria: 14, presenca: 10 };
  c.feiticos = [{ ...F.createBlankFeitico(), id: `${nome}-f`, nome: `Feitiço ${nome}`, ...campos }];
  return c;
}
try {
 for (const sistema of ['player', 'afty']) for (const largura of [1440, 390]) {
  const fichas = [
    ficha(sistema, 'Disparos', { tipo: 'dano', subtipo: 'multiplos', nivel: 2, disparos: 3, resolucao: 'ataque' }),
    ficha(sistema, 'Golpes', { tipo: 'especial', especialSubtipo: 'golpeador', nivel: 3, golpesGolpeador: 2 }),
    ficha(sistema, 'Efeitos', { tipo: 'auxiliar', nivel: 3, multiplosAtivo: true, duracaoMult: 'sustentada',
      efeitosMult: [{ ...F.createBlankAuxEffect(1), id: 'durante', efeito: 'danoDurante' }, { ...F.createBlankAuxEffect(1), id: 'apos', efeito: 'danoApos' }] }),
    ficha(sistema, 'Alma', { tipo: 'especial', especialSubtipo: 'danoAlma', nivel: 1 }),
  ];
  const context = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await context.addInitScript(({ fichas, sistema }) => {
    if (!localStorage.getItem('foco-seeded')) {
      localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify(fichas));
      localStorage.setItem('foco-seeded', '1');
    }
  }, { fichas, sistema });
  const page = await context.newPage();
  const erros = []; page.on('pageerror', (e) => erros.push(e.message));
  await page.goto(`http://127.0.0.1:5192/${sistema}`, { waitUntil: 'networkidle' });
  const salva = async (id) => page.evaluate(({ sistema, id }) => JSON.parse(localStorage.getItem(`fm_creatures_${sistema}_v1`)).find(c => c.id === id), { sistema, id });
  for (const [indice, destino] of ['disparo:2', 'golpe:2', 'efeito:apos', null].entries()) {
    const c = fichas[indice];
    await page.getByText(c.name, { exact: true }).click();
    await page.getByTitle('Editar no criador', { exact: true }).press('Enter');
    await page.getByRole('tab', { name: 'Habilidades', exact: true }).click();
    await page.getByRole('combobox', { name: 'Feitiço Focado', exact: true }).selectOption('dano');
    if (destino) {
      await page.getByRole('combobox', { name: 'Destino de Foco no Poder', exact: true }).selectOption(destino);
      assert.equal(await page.getByText('Escolha o Destino de Foco no Poder', { exact: true }).count(), 0);
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Criador sem transbordamento');
    await page.getByRole('button', { name: 'Salvar Alterações', exact: true }).press('Enter');
    await page.reload({ waitUntil: 'networkidle' });
    const guardada = await salva(c.id);
    assert.equal(guardada.feiticos[0].focoZenin, 'dano');
    if (destino) assert.equal(guardada.feiticos[0].focoZeninDestino, destino);
    const d = deriveAfty(guardada).feiticos.lista[0];
    const r = destino ? d.rolagens[1] : d.rolagens[0];
    await page.getByText(c.name, { exact: true }).click();
    await page.getByText(c.feiticos[0].nome, { exact: true }).click();
    await page.getByTitle(r.rotulo, { exact: true }).click();
    await page.waitForFunction((id) => JSON.parse(localStorage.getItem(`fm_ficha_sessao_afty_v1:${id}`))?.log?.length > 0, c.id);
    const log = await page.evaluate((id) => JSON.parse(localStorage.getItem(`fm_ficha_sessao_afty_v1:${id}`)).log[0], c.id);
    assert.equal(log.dados.length, r.dados);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Ficha sem transbordamento');
    if (indice === 0) await page.screenshot({ path: `.audit/cx2-20261101/${sistema}-${largura}-foco-escolhido.png` });
    if (indice === 3) {
      await page.getByTitle('Editar no criador', { exact: true }).press('Enter');
      await page.getByRole('tab', { name: 'Habilidades', exact: true }).click();
      await page.getByRole('combobox', { name: 'Feitiço Focado', exact: true }).selectOption('alcance');
      await page.getByRole('button', { name: 'Salvar Alterações', exact: true }).press('Enter');
      const a = deriveAfty(await salva(c.id)).feiticos.lista[0];
      assert.equal(a.propriedades.find(p => p.id === 'alcance').valor, '12 metros');
    } else await page.getByRole('button', { name: 'Voltar', exact: true }).press('Enter');
  }
  const disparosSalvos = await salva('Disparos');
  const encontro = criarEncontro({ nome: 'Encontro Foco' });
  encontro.combatentes = [criarCombatente(disparosSalvos, { derived: deriveAfty(disparosSalvos) })];
  await page.evaluate((encontro) => localStorage.setItem('afty_encontros_v1', JSON.stringify([encontro])), encontro);
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Encontros', exact: true }).click();
  await page.getByText('Encontro Foco', { exact: true }).click();
  await page.getByRole('button', { name: 'Rolar Tudo', exact: true }).click();
  await page.getByRole('button', { name: 'Começar', exact: true }).click();
  await page.getByText('Feitiço Disparos', { exact: true }).click();
  await page.getByTitle('Disparo 2', { exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('afty_encontros_v1'))[0].combatentes[0].sessao.log.length > 0);
  const logEncontro = await page.evaluate(() => JSON.parse(localStorage.getItem('afty_encontros_v1'))[0].combatentes[0].sessao.log[0]);
  assert.equal(logEncontro.dados.length, deriveAfty(disparosSalvos).feiticos.lista[0].rolagens[1].dados);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Encontro sem transbordamento');
  assert.deepEqual(erros, []);
  resultados.push({ sistema, largura, escolhasSalvas: 3, rolagensConferidas: 4, almaIntegral: true, encontro: true, erros });
  await context.close();
 }
} finally {
 await writeFile('.audit/cx2-20261101/foco-browser-resultados.json', JSON.stringify(resultados, null, 2));
 await browser.close();
}
