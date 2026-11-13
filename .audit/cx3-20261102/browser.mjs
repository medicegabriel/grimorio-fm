import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const R = new URL("../../src/systems/afty/", import.meta.url);
const { deriveAfty } = await import(new URL("afty-derive.js", R));
const { createBlankAfty } = await import(new URL("afty-schema.js", R));
const { createBlankFeitico } = await import(new URL("afty-feiticos.js", R));
const { aplicarAddons } = await import(new URL("afty-addons.js", R));
const S = await import(new URL("ficha/ficha-sessao.js", R));
const { rolarTeste, rolarDano } = await import(new URL("ficha/ficha-rolagem.js", R));
const { criarEncontro, criarCombatente } = await import(new URL("encontros/afty-encontro.js", R));
aplicarAddons([]);
function ficha(sistema, id, nd = 20) {
  const c = createBlankAfty(); c.id = id; c.name = id; c.rulesVersion = sistema; c.core.nd = nd;
  c.core.origem = { id: "inato", bonusAtributos: { sabedoria: 2, destreza: 1 } };
  c.attrMethod = "fixos"; c.attributes = { forca: 14, destreza: 12, constituicao: 13, inteligencia: 10, sabedoria: 15, presenca: 8 };
  c.attrNivel.sabedoria = 3; c.especializacoes = [{ id: "combatente", nivel: nd }];
  c.pericias = { medicina: "mestre", feiticaria: "treinado", acrobacia: "treinado" };
  c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao", "ger_aptidao"] : [];
  return c;
}
function sessao(c) { const d = deriveAfty(c); return { ...S.iniciaCombate(S.sessaoEmBranco(d), d), hpAtual: d.hp - 30 }; }
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
const resultados = [];
try {
  for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) {
    const medicina = ficha(sistema, "CX3 Medicina", 8); medicina.talentos = ["tal_adepto_de_medicina", "tal_favorecido_pela_sorte"];
    const canal = ficha(sistema, "CX3 Canalização"); canal.aptidoes = { au: 1, cl: 4, er: 0, dom: 0, bar: 0 };
    canal.aptidoesAmaldicoadas = ["canalizar_em_golpe", "canalizacao_avancada", "canalizacao_maxima"];
    canal.talentos = ["tal_mestre_das_armas"]; canal.talentosConfig.tal_mestre_das_armas = { modo: "grupo", grupo: "pugilato" };
    canal.escolhasTalento = { tal_mestre_das_armas: ["tal_mestre_armas_forca"] };
    const treinos = ficha(sistema, "CX3 Treinos"); treinos.treinamentos = { pericia: [{ alvo: "acrobacia", progresso: 2 }] }; treinos.focosLivres = 2;
    const alvo = ficha(sistema, "CX3 Alvo");
    const reversao = ficha(sistema, "CX3 Reversão"); reversao.aptidoes = { cl: 3, er: 2, au: 0, dom: 0, bar: 0 };
    reversao.aptidoesAmaldicoadas = ["energia_reversa", "reversao_de_tecnica"];
    reversao.feiticos = [{ ...createBlankFeitico(), id: "cx3-ativa", nome: "CX3 Ativa", nivel: 3 },
      { ...createBlankFeitico(), id: "cx3-passiva", nome: "CX3 Passiva", tipo: "passivo", nivel: 3, categoriaPassivo: "defesa" }];
    const fichas = [medicina, canal, treinos, reversao];
    const sessoes = Object.fromEntries(fichas.map((c) => [c.id, sessao(c)]));
    const teste = rolarTeste({ rotulo: "Vontade CX3", bonus: 5 }, () => 0.1);
    sessoes[medicina.id] = S.registraRolagem(sessoes[medicina.id], teste);
    const dc = deriveAfty({ ...canal, combate: sessoes[canal.id].combate });
    const l = dc.dano.entradas.find((l) => l.id === "basico");
    const acerto = rolarTeste({ rotulo: "Desarmado CX3", tipoTeste: "ataque", bonus: l.acerto, margem: l.margemCritico, linhaArma: l }, () => 0.99);
    const dano = rolarDano({ rotulo: "Dano CX3", grupos: l.gruposDano, critico: true, linhaArma: l }, () => 0.5);
    const encontro = criarEncontro({ nome: "CX3 Encontro" });
    encontro.combatentes = [canal, alvo].map((c) => criarCombatente(c, { derived: deriveAfty(c) }));
    encontro.combatentes[0].sessao = S.registraRolagem(S.registraRolagem(sessao(canal), acerto), dano);
    const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
    await ctx.addInitScript(({ sistema, fichas, sessoes, encontro }) => {
      if (localStorage.getItem("cx3-isolado")) return;
      localStorage.setItem("cx3-isolado", "1"); localStorage.setItem(`fm_creatures_${sistema}_v1`, JSON.stringify(fichas));
      localStorage.setItem("afty_encontros_v1", JSON.stringify([encontro]));
      for (const [id, s] of Object.entries(sessoes)) localStorage.setItem(`fm_ficha_sessao_afty_v1:${id}`, JSON.stringify(s));
    }, { sistema, fichas, sessoes, encontro });
    const page = await ctx.newPage(), erros = []; page.on("pageerror", (e) => erros.push(e.message));
    const getSessao = (id) => page.evaluate((id) => JSON.parse(localStorage.getItem(`fm_ficha_sessao_afty_v1:${id}`)), id);
    const abrir = async (nome) => page.getByText(nome, { exact: true }).click();
    const habilidade = async (chave) => {
      await page.getByRole("tab", { name: "Habilidades", exact: true }).click();
      const item = page.locator(`[id="afty-item-${chave}"]`);
      await item.locator("button[aria-expanded]").click(); return item;
    };
    const voltar = () => page.getByRole("button", { name: "Voltar", exact: true }).click();
    await page.goto(`http://127.0.0.1:5193/${sistema}`, { waitUntil: "networkidle" });
    await abrir(medicina.name);
    let item = await habilidade("talento:tal_adepto_de_medicina");
    await item.getByRole("button", { name: "Curar", exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Medicina"))?.usos?.["talento:tal_adepto_de_medicina"] === 1);
    assert.ok((await getSessao(medicina.id)).hpAtual > sessoes[medicina.id].hpAtual);
    item = await habilidade("talento:tal_favorecido_pela_sorte");
    await item.getByRole("combobox", { name: "Rolagem de Sorte" }).selectOption(teste.id);
    await item.getByRole("button", { name: "Gastar Sorte", exact: true }).click();
    await item.getByRole("button", { name: /^Original:/ }).click();
    await page.waitForFunction((id) => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Medicina"))?.log.find((r) => r.id === id)?.sorte?.escolha === "original", teste.id);
    assert.equal((await getSessao(medicina.id)).log.find((r) => r.id === teste.id).sorte.escolha, "original");
    await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-medicina-sorte.png` });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Ficha sem transbordamento");
    await voltar(); await abrir(canal.name); item = await habilidade("aptidao:canalizar_em_golpe");
    await item.getByText("Canalização Máxima", { exact: true }).click();
    await item.getByText("Descontar PE", { exact: true }).click();
    const antes = await getSessao(canal.id);
    await item.getByRole("button", { name: "Armar Próximo Acerto", exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Canalização"))?.uso?.pendencias?.length === 1);
    assert.equal(antes.peAtual - (await getSessao(canal.id)).peAtual, 5);
    await page.reload({ waitUntil: "networkidle" }); await abrir(canal.name); item = await habilidade("aptidao:canalizar_em_golpe");
    assert.equal(await item.getByRole("button", { name: "Canalização Armada", exact: true }).isDisabled(), true);
    await voltar(); await abrir(treinos.name); item = await habilidade("treinamento:pericia:acrobacia:2");
    await item.getByRole("button", { name: "Realizar Teste", exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:CX3 Treinos"))?.usos?.["treino:pericia:acrobacia:vantagem"] === 1);
    assert.equal((await getSessao(treinos.id)).log[0].modo, "vantagem");
    await voltar(); await abrir(reversao.name);
    await page.getByTitle("Editar no criador", { exact: true }).press("Enter");
    await page.getByRole("tab", { name: "Habilidades", exact: true }).click();
    const caixas = page.getByRole("checkbox", { name: "Reversão de Técnica", exact: true });
    await caixas.check();
    if (largura === 390) await page.getByRole("button", { name: /^CX3 Ativa Nível/ }).click();
    await page.getByRole("button", { name: /^CX3 Passiva Nível/ }).click();
    await caixas.check();
    await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-reversao-criador.png` });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Criador sem transbordamento");
    await page.getByRole("button", { name: "Salvar Alterações", exact: true }).press("Enter");
    await page.waitForFunction((sistema) => JSON.parse(localStorage.getItem(`fm_creatures_${sistema}_v1`)).find((c) => c.id === "CX3 Reversão").feiticos.every((f) => f.reversaoTecnica), sistema);
    const gravada = await page.evaluate((sistema) => JSON.parse(localStorage.getItem(`fm_creatures_${sistema}_v1`)).find((c) => c.id === "CX3 Reversão"), sistema);
    const dr = deriveAfty(gravada);
    assert.equal(dr.feiticos.lista.find((f) => f.id === "cx3-ativa").custoPE, 11);
    assert.equal(dr.feiticos.lista.find((f) => f.id === "cx3-passiva").custoPeMaximo, sistema === "player" ? 9 : null);
    await page.reload({ waitUntil: "networkidle" }); await abrir(reversao.name);
    assert.ok(await page.getByText("11 PE", { exact: true }).count(), "Custo com Reversão na Ficha");
    await voltar(); await page.getByRole("button", { name: "Encontros", exact: true }).click(); await abrir("CX3 Encontro");
    await page.getByRole("button", { name: "Rolar Tudo", exact: true }).click(); await page.getByRole("button", { name: "Começar", exact: true }).click();
    if (!(await page.getByRole("combobox", { name: "Ataque a Confirmar" }).count())) {
      if (largura === 390) await page.getByRole("button", { name: "Iniciativa", exact: true }).click();
      for (const candidato of await page.getByText(canal.name, { exact: true }).all()) if (await candidato.isVisible()) { await candidato.click(); break; }
    }
    await page.getByRole("combobox", { name: "Ataque a Confirmar" }).selectOption(acerto.id);
    const ataqueCard = page.getByRole("heading", { name: "Ataque com Alvo", exact: true }).locator("..");
    await ataqueCard.getByRole("combobox", { name: "Alvo do Ataque" }).selectOption(encontro.combatentes[1].id);
    await ataqueCard.getByRole("combobox", { name: "Dano do Ataque" }).selectOption(dano.id);
    await ataqueCard.getByRole("button", { name: "Confirmar Ataque e Aplicar Dano", exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[1].sessao.log.some((r) => r.rotulo === "Ataque Confirmado"));
    await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-debug-encontro.png` });
    const critCard = page.getByRole("heading", { name: "Efeito de Crítico", exact: true }).locator("..");
    await critCard.getByRole("combobox", { name: "Crítico da Arma" }).selectOption(acerto.id);
    await critCard.getByRole("combobox", { name: "Alvo do Crítico" }).selectOption(encontro.combatentes[1].id);
    await critCard.getByText("Acertou", { exact: true }).click();
    await critCard.getByRole("button", { name: "Aplicar Efeito de Crítico", exact: true }).click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[1].sessao.log.some((r) => r.rotulo.startsWith("Crítico de")));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Encontro sem transbordamento");
    await page.screenshot({ path: `.audit/cx3-20261102/${sistema}-${largura}-encontro.png` });
    assert.deepEqual(erros, []);
    resultados.push({ sistema, largura, medicina: true, sorte: true, canalizacao: true, salvamento: true, treino: true, reversao: true, ataqueAlvo: true, criticoAlvo: true, erros });
    console.log(`${sistema} ${largura}: aprovado`); await ctx.close();
  }
} finally { await writeFile(".audit/cx3-20261102/browser-resultados.json", JSON.stringify(resultados, null, 2)); await browser.close(); }
