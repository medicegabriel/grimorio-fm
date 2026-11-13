import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const R = new URL("../../src/systems/afty/", import.meta.url);
const { deriveAfty } = await import(new URL("afty-derive.js", R));
const { createBlankAfty } = await import(new URL("afty-schema.js", R));
const { aplicarAddons } = await import(new URL("afty-addons.js", R));
const S = await import(new URL("ficha/ficha-sessao.js", R));
const { rolarTeste, rolarDano } = await import(new URL("ficha/ficha-rolagem.js", R));
const { criarEncontro, criarCombatente } = await import(new URL("encontros/afty-encontro.js", R));
aplicarAddons([]);
function ficha(sistema, id) {
 const c = createBlankAfty(); c.id = id; c.name = id; c.rulesVersion = sistema; c.core.nd = 20;
 c.core.origem = { id: "inato", bonusAtributos: { destreza: 2, forca: 1 } }; c.attrNivel.destreza = 3;
 c.attrMethod = "fixos"; c.attributes = { forca: 14, destreza: 15, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
 c.especializacoes = [{ id: "combatente", nivel: 20 }]; c.pericias = { acrobacia: "treinado", feiticaria: "treinado" };
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : []; return c;
}
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] }), resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) {
  const acro = ficha(sistema, "CX3 Acrobacia"); acro.talentos = ["tal_movimentos_acrobaticos"];
  const chicote = ficha(sistema, "CX3 Chicote"); chicote.talentos = ["tal_mestre_dos_chicotes"]; chicote.equipamentos.itens = [{ uid: "arma", tipo: "arma", refId: "arm_chicote", qtd: 1, equipado: true }];
  const conc = ficha(sistema, "CX3 Concussão"); conc.talentos = ["tal_especialista_em_concussao"];
  const alvo = ficha(sistema, "CX3 Alvo");
  const suporte = ficha(sistema, "CX3 Suporte"); suporte.especializacoes = [{ id: "suporte", nivel: 20 }]; suporte.habilidades = ["sup_conceder_outra_chance", "sup_intervencao", "sup_versatilidade", "sup_mobilidade_avancada"];
  const analista = ficha(sistema, "CX3 Analista"); analista.especializacoes = [{ id: "suporte", nivel: 20 }]; analista.habilidades = ["sup_analise_profunda"]; analista.pericias.percepcao = "mestre";
  const vitima = ficha(sistema, "CX3 Aliado Ferido"), perigo = ficha(sistema, "CX3 Perigo");
  const d = deriveAfty(acro), sa = S.defineCondicoes(S.iniciaCombate(S.sessaoEmBranco(d), d), [{ id: "queda-ui", nome: "Caído" }]);
  const encontro = criarEncontro({ nome: "CX3 Manobras" });
  encontro.combatentes = [chicote, conc, alvo, suporte, analista, vitima, perigo].map((c) => criarCombatente(c, { derived: deriveAfty(c) }));
  encontro.combatentes[5].sessao.hpAtual = 1;
  const perigoD = deriveAfty(perigo), perigoLinha = perigoD.dano.entradas.find((l) => l.id === "basico");
  const perigoAtaque = rolarTeste({ rotulo: "Ataque do Perigo", bonus: perigoLinha.acerto, margem: perigoLinha.margemCritico, tipoTeste: "ataque", linhaArma: perigoLinha }, () => 0.999);
  const perigoDano = rolarDano({ rotulo: perigoLinha.nome, grupos: perigoLinha.gruposDano, critico: true, linhaArma: perigoLinha }, () => 0.2);
  encontro.combatentes[6].sessao = S.registraRolagem(S.registraRolagem(encontro.combatentes[6].sessao, perigoAtaque), perigoDano);
  const falha = rolarTeste({ rotulo: "Fortitude", bonus: deriveAfty(alvo).testes.resistencias.find((t) => t.value === "fortitude").bonus, cd: 99 }, () => 0);
  encontro.combatentes[2].sessao = S.defineCondicoes(S.registraRolagem(encontro.combatentes[2].sessao, falha), [{ id: "cego-ui", nome: "Cego", rodadas: 3 }, { id: "veneno-ui", nome: "Envenenado", rodadas: 2 }]);
  const ataques = {};
  for (const [i, c] of [chicote, conc].entries()) {
   const d = deriveAfty(c), linha = d.dano.entradas.find((l) => l.id === (i === 0 ? "arm_chicote" : "basico"));
   const ataque = rolarTeste({ rotulo: c.name, bonus: linha.acerto, margem: linha.margemCritico, tipoTeste: "ataque", linhaArma: linha }, () => 0.999);
   const dano = rolarDano({ rotulo: c.name, grupos: linha.gruposDano, critico: true, linhaArma: linha }, () => 0.5);
   ataques[c.id] = { ataque, dano }; encontro.combatentes[i].sessao = S.registraRolagem(S.registraRolagem(S.iniciaCombate(S.sessaoEmBranco(d), d), ataque), dano);
  }
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema, acro, sa, encontro }) => {
   if (localStorage.getItem("cx3-manobra-ui")) return; localStorage.setItem("cx3-manobra-ui", "1");
   localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify([acro])); localStorage.setItem(`fm_ficha_sessao_afty_v1:${acro.id}`, JSON.stringify(sa));
   localStorage.setItem("afty_encontros_v1", JSON.stringify([encontro]));
  }, { sistema, acro, sa, encontro });
  const page = await ctx.newPage(), erros = []; page.on("pageerror", (e) => erros.push(e.message));
  const conferir = async (nome, el) => { await el.scrollIntoViewIfNeeded(); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-${nome}.png` }); };
  const item = async (id) => { await page.getByRole("tab", { name: "Habilidades", exact: true }).click(); const el = page.locator(`[id="afty-item-talento:${id}"]`); await el.locator("button[aria-expanded]").click(); return el; };
  await page.goto(`http://127.0.0.1:5193/${sistema}`, { waitUntil: "networkidle" }); await page.getByText(acro.name, { exact: true }).click();
  let el = await item("tal_movimentos_acrobaticos"); await el.getByRole("spinbutton", { name: "Dificuldade para Levantar" }).fill("1"); await el.getByRole("button", { name: "Testar para Levantar" }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Acrobacia")).uso?.ativos?.tal_movimentos_acrobaticos);
  let salva = await page.evaluate(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Acrobacia"))); assert.equal(salva.condicoes.length, 0); await conferir("acrobacia", el);
  await page.reload({ waitUntil: "networkidle" }); await page.getByText(acro.name, { exact: true }).click(); salva = await page.evaluate(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Acrobacia"))); assert.equal(salva.uso.ativos.tal_movimentos_acrobaticos.duracao.restantes, 1);
  await page.getByRole("button", { name: "Voltar", exact: true }).click(); await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(encontro.nome, { exact: true }).click();
  await page.getByRole("button", { name: "Rolar Tudo", exact: true }).click(); await page.getByRole("button", { name: "Começar", exact: true }).click();
  for (const [c, talento] of [[chicote, "tal_mestre_dos_chicotes"], [conc, "tal_especialista_em_concussao"]]) {
   if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click();
   for (const candidato of await page.getByText(c.name, { exact: true }).all()) if (await candidato.isVisible()) { await candidato.click(); break; }
   await page.getByRole("tab", { name: "Ações", exact: true }).click(); const { ataque, dano } = ataques[c.id];
   await page.getByRole("combobox", { name: "Ataque a Confirmar" }).selectOption(ataque.id); await page.getByRole("combobox", { name: "Alvo do Ataque" }).selectOption(encontro.combatentes[2].id);
   await page.getByRole("combobox", { name: "Dano do Ataque" }).selectOption(dano.id); await page.getByRole("button", { name: "Confirmar Ataque e Aplicar Dano" }).click();
   await page.waitForFunction((id) => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes.find((x) => x.ficha.id === id).sessao.log.some((r) => r.rotulo === "Ataque Confirmado"), c.id);
   el = await item(talento); await el.getByRole("combobox", { name: "Acerto para Deslocar" }).selectOption(ataque.id); await el.getByRole("combobox", { name: "Alvo do Deslocamento" }).selectOption(encontro.combatentes[2].id);
   if (c === conc) await el.getByText("Espaço Desocupado", { exact: true }).click(); await el.getByRole("button", { name: c === conc ? "Mover Alvo" : "Puxar Alvo", exact: true }).click();
   await page.waitForFunction(({ id, talento }) => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes.find((x) => x.ficha.id === id).sessao.usos[`turno:uso:${talento}`] === 1, { id: c.id, talento });
   await conferir(c === conc ? "concussao" : "chicote", el);
  }
  const gravado = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.ok(gravado.combatentes[2].sessao.log.some((r) => r.rotulo === "Especialista em Concussão" && r.deslocamento === 3));
  if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click();
  for (const candidato of await page.getByText(suporte.name, { exact: true }).all()) if (await candidato.isVisible()) { await candidato.click(); break; }
  await page.getByRole("tab", { name: "Habilidades", exact: true }).click();
  el = page.locator('[id="afty-item-especializacao:sup_conceder_outra_chance"]'); await el.locator("button[aria-expanded]").click();
  await el.getByRole("combobox", { name: "Aliado da Rerrolagem" }).selectOption(encontro.combatentes[2].id);
  await el.getByRole("combobox", { name: "Teste para Rerrolagem de Classe" }).selectOption(falha.id);
  await el.getByText("Consequências Ainda Não Aplicadas", { exact: true }).click(); await el.getByText("Aliado Visível a Até 6m", { exact: true }).click(); await el.getByText("Descontar PE", { exact: true }).click();
  await el.getByRole("button", { name: "Repetir Teste de Classe", exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[3].sessao.usos["hab:sup_conceder_outra_chance"] === 1);
  const final = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]);
  assert.equal(final.combatentes[3].sessao.peAtual, gravado.combatentes[3].sessao.peAtual - 3); assert.deepEqual(final.combatentes[3].sessao.uso.acoes.gastas, gravado.combatentes[3].sessao.uso.acoes.gastas);
  assert.equal(final.combatentes[2].sessao.log.find((r) => r.id === falha.id).rerrolagensClasse[0].fonte, "Conceder Outra Chance"); await conferir("outra-chance", el);
  el = page.locator('[id="afty-item-especializacao:sup_intervencao"]'); await el.getByRole("button", { name: "Intervenção", exact: true }).click();
  await el.getByRole("combobox", { name: "Aliado da Intervenção" }).selectOption(encontro.combatentes[2].id);
  await el.getByRole("combobox", { name: "Condição da Intervenção" }).selectOption("cego-ui");
  await el.getByText("Aliado em Alcance de Toque", { exact: true }).click(); await el.getByText("Descontar PE", { exact: true }).click();
  await el.getByRole("button", { name: "Encerrar Condição", exact: true }).click();
  await page.waitForFunction(() => !JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[2].sessao.condicoes.some((c) => c.id === "cego-ui"));
  const aposIntervencao = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]);
  assert.equal(aposIntervencao.combatentes[3].sessao.peAtual, final.combatentes[3].sessao.peAtual - 9); assert.equal(aposIntervencao.combatentes[3].sessao.uso.acoes.gastas.comum, 1);
  assert.deepEqual(aposIntervencao.combatentes[2].sessao.condicoes.map((c) => c.id), ["veneno-ui"]); await conferir("intervencao", el);
  el = page.locator('[id="afty-item-especializacao:sup_versatilidade"]'); await el.getByRole("button", { name: "Versatilidade", exact: true }).click();
  await el.getByRole("combobox", { name: "Teste do Benefício" }).selectOption("atletismo"); await el.getByText("Descontar PE", { exact: true }).click();
  await el.getByRole("button", { name: "Realizar Teste", exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[3].sessao.usos["hab:sup_versatilidade"] === 1);
  const aposVersa = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]);
  assert.equal(aposVersa.combatentes[3].sessao.peAtual, aposIntervencao.combatentes[3].sessao.peAtual - 1); assert.deepEqual(aposVersa.combatentes[3].sessao.uso.acoes, aposIntervencao.combatentes[3].sessao.uso.acoes);
  assert.equal(aposVersa.combatentes[3].sessao.log[0].periciaId, "atletismo"); assert.equal(aposVersa.combatentes[3].sessao.log[0].fontes.at(-1).label, "Versatilidade");
  await page.reload({ waitUntil: "networkidle" }); const relida = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]);
  assert.deepEqual(relida.combatentes[2].sessao.condicoes, aposIntervencao.combatentes[2].sessao.condicoes); assert.equal(relida.combatentes[3].sessao.peAtual, aposVersa.combatentes[3].sessao.peAtual);
  await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(encontro.nome, { exact: true }).click();
  if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click();
  for (const candidato of await page.getByText(analista.name, { exact: true }).all()) if (await candidato.isVisible()) { await candidato.click(); break; }
  await page.getByRole("tab", { name: "Habilidades", exact: true }).click(); el = page.locator('[id="afty-item-especializacao:sup_analise_profunda"]'); await el.getByRole("button", { name: "Análise Profunda", exact: true }).click();
  await el.getByRole("combobox", { name: "Alvo da Análise Profunda" }).selectOption(encontro.combatentes[2].id); await el.getByText("Descontar PE", { exact: true }).click();
  await page.evaluate(() => { globalThis.cx3Random = Math.random; Math.random = () => 0.999; });
  try { await el.getByRole("button", { name: "Analisar", exact: true }).click(); } finally { await page.evaluate(() => { Math.random = globalThis.cx3Random; delete globalThis.cx3Random; }); }
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[4].sessao.log.some((r) => r.contextoConteudo?.tipo === "analiseProfunda"));
  const antesConclusao = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.ok(!antesConclusao.combatentes[4].sessao.log.some((r) => r.quantidade != null));
  assert.equal(antesConclusao.combatentes[4].sessao.peAtual, relida.combatentes[4].sessao.peAtual - 1); assert.equal(antesConclusao.combatentes[4].sessao.uso.acoes.gastas.comum, 1);
  await el.getByRole("button", { name: "Concluir Análise", exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[4].sessao.log.some((r) => r.quantidade === 2)); await conferir("analise-profunda", el);
  await page.reload({ waitUntil: "networkidle" }); const aposAnalise = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.equal(aposAnalise.combatentes[4].sessao.log[0].quantidade, 2);
  await page.getByRole("button", { name: "Encontros", exact: true }).click(); await page.getByText(encontro.nome, { exact: true }).click();
  if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click();
  for (const candidato of await page.getByText(perigo.name, { exact: true }).all()) if (await candidato.isVisible()) { await candidato.click(); break; }
  await page.getByRole("tab", { name: "Ações", exact: true }).click(); await page.getByRole("combobox", { name: "Ataque a Confirmar" }).selectOption(perigoAtaque.id);
  await page.getByRole("combobox", { name: "Alvo do Ataque" }).selectOption(encontro.combatentes[5].id); await page.getByRole("combobox", { name: "Dano do Ataque" }).selectOption(perigoDano.id);
  await page.getByRole("button", { name: "Confirmar Ataque e Aplicar Dano", exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[5].sessao.log.some((r) => r.abateu));
  const antesReacao = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]), queda = antesReacao.combatentes[5].sessao.log.find((r) => r.abateu);
  if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click();
  for (const candidato of await page.getByText(suporte.name, { exact: true }).all()) if (await candidato.isVisible()) { await candidato.click(); break; }
  await page.getByRole("tab", { name: "Habilidades", exact: true }).click(); el = page.locator('[id="afty-item-especializacao:sup_mobilidade_avancada"]'); await el.getByRole("button", { name: "Mobilidade Avançada", exact: true }).click();
  await el.getByRole("combobox", { name: "Aliado da Mobilidade Avançada" }).selectOption(encontro.combatentes[5].id); await el.getByRole("combobox", { name: "Queda do Aliado" }).selectOption(queda.id);
  await el.getByText("Em Direção ao Aliado", { exact: true }).click(); await el.getByRole("button", { name: "Usar Reação de Movimento", exact: true }).click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[3].sessao.especializacaoSessao.reacoesGastas === 1);
  const aposReacao = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.equal(aposReacao.combatentes[3].sessao.log[0].distancia, deriveAfty(suporte).movimento / 2);
  assert.equal(aposReacao.combatentes[3].sessao.peAtual, antesReacao.combatentes[3].sessao.peAtual); assert.equal(aposReacao.combatentes[5].sessao.vital.estado, "morrendo"); await conferir("mobilidade-avancada", el);
  await page.reload({ waitUntil: "networkidle" }); const aposReload = await page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]); assert.equal(aposReload.combatentes[3].sessao.especializacaoSessao.reacoesGastas, 1);
  assert.deepEqual(erros, []); resultados.push({ sistema, largura, acrobacia: true, chicote: true, concussao: true, outraChance: true, intervencao: true, versatilidade: true, analiseProfunda: true, mobilidadeAvancada: true, persistencia: true, erros }); console.log(`${sistema} ${largura}: aprovado`); await ctx.close();
 }
} finally { await writeFile(".audit/cx3-20261102/browser-manobras-resultados.json", JSON.stringify(resultados, null, 2)); await browser.close(); }
