import { register } from 'node:module';
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const R = new URL('../../src/systems/afty/', import.meta.url);
const { deriveAfty } = await import(new URL('afty-derive.js', R));
const { createBlankAfty } = await import(new URL('afty-schema.js', R));
const { createBlankFeitico } = await import(new URL('afty-feiticos.js', R));
const { aplicarAddons } = await import(new URL('afty-addons.js', R));
const S = await import(new URL('ficha/ficha-sessao.js', R));
const { criarEncontro, criarCombatente } = await import(new URL('encontros/afty-encontro.js', R));
aplicarAddons([]);
const browser = await chromium.launch({ channel: 'chrome', ignoreDefaultArgs: ['--hide-scrollbars'] });
const resultados = [];
function ficha(sistema, id, origem) {
  const c = createBlankAfty(); c.id = id; c.name = id; c.rulesVersion = sistema;
  c.core = { ...c.core, nd: 15, tipo: 'conjurador', patamar: 'comum', origem };
  c.especializacoes = [{ id: 'conjurador', nivel: 15 }];
  c.attributes = { forca: 10, destreza: 12, constituicao: 14, inteligencia: 16, sabedoria: 14, presenca: 10 };
  c.feiticos = [{ ...createBlankFeitico(), id: `${id}-f1`, nome: 'Feitiço CX2', nivel: 2, tipo: 'dano' }];
  return c;
}
try {
 for (const sistema of ['player', 'afty']) for (const largura of [1440, 390]) {
  const c = ficha(sistema, 'CX2 Anatomias', { id: 'feto_amaldicoado_hibrido', anatomias: ['carapaca_mutante', 'capacidade_voo', 'anatomia_incompreensivel', 'sangue_toxico'] });
  const inato = ficha(sistema, 'CX2 Inato', { id: 'inato' }); inato.talentos = ['tal_familiaridade_com_tecnica'];
  const zenin = ficha(sistema, 'CX2 Zenin', { id: 'herdado', cla: 'cla_zenin' });
  const derivado = ficha(sistema, 'CX2 Derivado', { id: 'derivado' });
  const manual = ficha(sistema, 'CX2 Manual', { id: 'herdado', cla: 'cla_gojo' });
  manual.core.nd = 20; manual.especializacoes[0].nivel = 20; manual.talentos = ['tal_manual_de_tecnica']; manual.pericias = { historia: 'treinado' };
  manual.feiticos[0].nivel = 3; manual.feiticos[0].manualTecnica = { acessoCriacao: 2, aprendido: false };
  const alvo = ficha(sistema, 'CX2 Alvo', { id: 'inato' });
  const encontro = criarEncontro({ nome: 'CX2 Encontro' });
  encontro.combatentes = [c, alvo].map((x) => criarCombatente(x, { derived: deriveAfty(x) }));
  const context = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  const fichas = [c, inato, zenin, derivado, manual];
  const sessoes = Object.fromEntries(fichas.map((f) => {
    const d = deriveAfty(f), s = S.sessaoEmBranco(d);
    return [f.id, { ...s, peAtual: 1, hpAtual: Math.max(1, d.hp - 30), combate: { ativo: true } }];
  }));
  await context.addInitScript(({ fichas, sistema, encontro, sessoes }) => {
    if (!localStorage.getItem('cx2-seeded')) {
      localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify(fichas));
      localStorage.setItem('afty_encontros_v1', JSON.stringify([encontro])); localStorage.setItem('cx2-seeded', '1');
      for (const [id, s] of Object.entries(sessoes)) localStorage.setItem(`fm_ficha_sessao_afty_v1:${id}`, JSON.stringify(s));
    }
  }, { fichas, sistema, encontro, sessoes });
  const page = await context.newPage();
  const erros = []; page.on('pageerror', (e) => erros.push(e.message));
  await page.goto(`http://127.0.0.1:5192/${sistema}`, { waitUntil: 'networkidle' });
  const abrir = async (nome) => { await page.getByText(nome, { exact: true }).click(); };
  const editar = async (aba) => { await page.getByTitle('Editar no criador', { exact: true }).press('Enter'); await page.getByRole('tab', { name: aba, exact: true }).click(); };
  const salvar = async () => { await page.getByRole('button', { name: 'Salvar Alterações', exact: true }).press('Enter'); };
  const voltar = async () => {
    const botao = page.getByRole('button', { name: 'Voltar', exact: true });
    if (await botao.count()) await botao.press('Enter');
    else assert.ok(await page.getByText('CX2 Inato', { exact: true }).count(), 'Salvar já retornou à biblioteca');
  };
  const fichaSalva = async (id) => page.evaluate(({ sistema, id }) => JSON.parse(localStorage.getItem(`fm_creatures_${sistema}_v1`)).find(c => c.id === id), { sistema, id });
  await abrir(c.name); await editar('Identidade');
  await page.getByRole('combobox', { name: 'Resistência de Carapaça Mutante' }).selectOption('ct');
  assert.equal(await page.getByRole('combobox', { name: 'Resistência de Carapaça Mutante' }).isDisabled(), true);
  await salvar(); assert.equal((await fichaSalva(c.id)).core.origem.anatomiasConfig.carapaca_mutante.tipoDano, 'ct');
  await page.reload({ waitUntil: 'networkidle' }); await abrir(c.name);
  await page.getByRole('button', { name: 'Voar (1 PE)', exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('fm_ficha_sessao_afty_v1:CX2 Anatomias'))?.uso?.ativos?.anatomia_voo);
  await page.getByRole('region', { name: 'Recursos de Origem' }).getByRole('button', { name: 'Curar', exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('fm_ficha_sessao_afty_v1:CX2 Anatomias'))?.usos?.['origem:vigor_maldito'] === 1);
  await page.getByRole('spinbutton', { name: 'Energia Reversa Recebida' }).fill('11');
  await page.getByRole('button', { name: 'Receber Cura Reversa' }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('fm_ficha_sessao_afty_v1:CX2 Anatomias'))?.log?.[0]?.total === 5);
  await page.screenshot({ path: `.audit/cx2-20261101/${sistema}-${largura}-voo.png` });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Ficha sem rolagem horizontal');
  await voltar(); await abrir(inato.name); await editar('Habilidades');
  await page.getByRole('combobox', { name: 'Marca Registrada', exact: true }).selectOption('inicial');
  await salvar(); assert.equal((await fichaSalva(inato.id)).feiticos[0].marcaRegistrada, 'inicial');
  await voltar(); await abrir(zenin.name); await editar('Habilidades');
  await page.getByRole('combobox', { name: 'Feitiço Focado', exact: true }).selectOption('dano');
  await page.getByRole('combobox', { name: 'Feitiço Focado', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `.audit/cx2-20261101/${sistema}-${largura}-zenin.png` });
  await salvar(); assert.equal((await fichaSalva(zenin.id)).feiticos[0].focoZenin, 'dano');
  await voltar(); await abrir(derivado.name); await editar('Identidade');
  await page.getByRole('combobox', { name: 'Aptidão de Aura de Energia Antinatural' }).selectOption('afinidade_ampliada');
  await salvar(); assert.equal((await fichaSalva(derivado.id)).core.origem.aptidaoAura, 'afinidade_ampliada');
  await abrir(derivado.name);
  await page.getByRole('button', { name: 'Recuperar (Ação Bônus)', exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('fm_ficha_sessao_afty_v1:CX2 Derivado'))?.usos?.['manual:origem:energia_antinatural'] === 1);
  await page.getByRole('button', { name: 'Novo Dia', exact: true }).click();
  await page.waitForFunction(() => !JSON.parse(localStorage.getItem('fm_ficha_sessao_afty_v1:CX2 Derivado'))?.usos?.['manual:origem:energia_antinatural']);
  await voltar(); await abrir(manual.name); await editar('Habilidades');
  await page.getByRole('button', { name: 'Aprender Feitiço do Manual', exact: true }).click();
  await salvar(); assert.equal((await fichaSalva(manual.id)).feiticos[0].manualTecnica.aprendido, true);
  await voltar(); await page.getByRole('button', { name: 'Encontros', exact: true }).click();
  await page.getByText('CX2 Encontro', { exact: true }).click();
  await page.getByRole('button', { name: 'Rolar Tudo', exact: true }).click();
  await page.getByRole('button', { name: 'Começar', exact: true }).click();
  if (!(await page.getByRole('button', { name: 'Voar (1 PE)', exact: true }).count())) {
    if (largura === 390) await page.getByRole('button', { name: 'Iniciativa', exact: true }).click();
    const candidatos = await page.getByText(c.name, { exact: true }).all();
    for (const candidato of candidatos) if (await candidato.isVisible()) { await candidato.click(); break; }
  }
  await page.getByText('Dano Recebido', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Alvo da Origem' }).selectOption(encontro.combatentes[1].id);
  await page.getByRole('spinbutton', { name: 'Dano Recebido da Origem' }).fill('20');
  await page.getByText('Ataque Corpo a Corpo', { exact: true }).click();
  await page.getByRole('button', { name: 'Aplicar Dano', exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('afty_encontros_v1'))[0].combatentes[1].sessao.log.some(r => r.rotulo === 'Sangue Tóxico'));
  const enc = await page.evaluate(() => JSON.parse(localStorage.getItem('afty_encontros_v1'))[0]);
  assert.equal(enc.combatentes[1].sessao.log[0].total, 2);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Encontro sem rolagem horizontal');
  await page.screenshot({ path: `.audit/cx2-20261101/${sistema}-${largura}-encontro.png` });
  assert.deepEqual(erros, []);
  resultados.push({ sistema, largura, carapaca: true, voo: true, marca: true, zenin: true, aura: true, retornoSalvo: true, erros });
  await context.close();
 }
} finally { await writeFile('.audit/cx2-20261101/browser-resultados.json', JSON.stringify(resultados, null, 2)); await browser.close(); }
