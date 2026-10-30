import { register } from "node:module";
import { chromium } from "playwright";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");

// A biblioteca desta máquina com todos os Addons do repositório (menos o embutido)
const arquivos = (await readdir("addons")).filter((f) => f.endsWith(".json"));
const biblioteca = [];
for (const f of arquivos) {
  const cru = JSON.parse(await readFile("addons/" + f, "utf8"));
  if (cru.id === "guerra-de-feiticeiros") continue;
  // Cópias ANTIGAS, como as da biblioteca real do autor: sem resumo e sem categoria
  const copia = AD.normalizarPacote(cru);
  copia.resumo = ""; copia.categoria = "";
  biblioteca.push(copia);
}
await mkdir(".audit/addons-lista-shots", { recursive: true });

const ficha = createBlankAfty();
ficha.rulesVersion = "player"; ficha.core.nd = 20; ficha.name = "Teste Lista de Addons";
const caminho = ".audit/addons-lista-ficha.json";
await writeFile(caminho, JSON.stringify({ version: "2.0", system: "Feiticeiros e Maldições", creatures: [ficha] }));

const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
const relatorio = [];
try {
  for (const largura of [1440, 390]) {
    const mobile = largura === 390;
    const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: mobile, hasTouch: mobile });
    await ctx.addInitScript((lib) => { try { localStorage.setItem("fm_addons_afty_v1", JSON.stringify(lib)); } catch { /* sem armazenamento */ } }, biblioteca);
    const page = await ctx.newPage(); page.setDefaultTimeout(15000);
    const erros = []; page.on("pageerror", (e) => erros.push(e.message));
    await page.goto("http://localhost:5173/Player", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Importar", exact: true }).click();
    await page.locator("input[type=file]").setInputFiles(caminho);
    await page.getByText(ficha.name, { exact: true }).first().waitFor();
    await page.getByRole("dialog").getByRole("button", { name: "Fechar", exact: true }).last().click();
    await page.getByText(ficha.name, { exact: true }).first().click();
    await page.locator('button[title="Editar no criador"]').click();
    await page.getByRole("tab", { name: "Outros", exact: true }).click();
    await page.getByRole("menuitem", { name: "Addons", exact: true }).click();

    // No celular a lista fica atrás de um botão que mostra o escolhido
    const abrirLista = async () => {
      if (!mobile) return;
      const botao = page.locator("button[aria-expanded]").filter({ hasText: /\d+$/ }).first();
      if (await botao.getAttribute("aria-expanded") === "false") await botao.click();
    };
    await abrirLista();

    const busca = page.getByLabel("Buscar Addon");
    const linhas = () => page.locator("button[aria-pressed][title]").filter({ has: page.locator("span.truncate") });
    const total = await linhas().count();
    assert.equal(total, 88, "a lista mostra os 88 pacotes, o embutido e os 87 da biblioteca");
    assert.equal(await page.getByText(/^0 ligados de 88$/).count(), 1, "o cabeçalho conta ligados de total");

    // A linha mostra só o nome e a versão: nenhuma descrição, nem a derivada, nem cortada
    const textos = await linhas().allInnerTexts();
    assert.equal(textos.some((x) => x.includes("Dobra o PV final") || x.includes("…")), false, "a linha não traz descrição");
    const alturas = await linhas().evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
    assert.equal(Math.max(...alturas) < 44, true, "cada linha cabe em uma linha de texto (" + Math.max(...alturas) + "px)");

    // Busca pelo conteúdo: o nome de uma entrada que o pacote acrescenta
    await busca.fill("zodiaco");
    const achadosZodiaco = await linhas().allInnerTexts();
    assert.equal(achadosZodiaco.some((x) => x.includes("H Corp")), true, "buscar por Zodíaco acha o H Corp");
    assert.equal(achadosZodiaco.length < 8, true, "a busca estreita a lista");
    // Busca por uma palavra que só a descrição tem
    await busca.fill("voo de");
    assert.equal((await linhas().allInnerTexts()).some((x) => x.includes("Herdeiro Celeste")), true, "buscar pela descrição");
    await busca.fill("");

    // O detalhe de uma cópia antiga: a descrição aparece UMA vez, em parágrafos, sob o rótulo Descrição
    await abrirLista();
    await busca.fill("regras grimorio");
    await page.locator('button[title="Regras Grimorio"]').first().click();
    assert.equal(await page.getByRole("heading", { name: "Descrição", exact: true }).count(), 1, "a seção Descrição");
    assert.equal(await page.getByText("Dobra o PV final sem dobrar a Integridade da Alma.").count(), 1, "a primeira frase aparece uma vez, sem resumo repetido");
    // Uma descrição longa vem recortada, com o botão para abrir
    await abrirLista();
    await busca.fill("maldição era de ouro");
    await page.locator('button[title="Maldição - Era de Ouro"]').first().click();
    assert.equal(await page.getByRole("button", { name: "Ver a Descrição Completa", exact: true }).count(), 1, "descrição longa vem recortada");
    const paragrafos = await page.locator("section p").count();
    assert.equal(paragrafos >= 2, true, "a descrição longa se divide em parágrafos (" + paragrafos + ")");
    await page.screenshot({ path: `.audit/addons-lista-shots/descricao-${largura}.png`, fullPage: true });
    await page.getByRole("button", { name: "Ver a Descrição Completa", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "Ver Menos", exact: true }).count(), 1, "abre inteira e dá para fechar");
    await abrirLista();
    await busca.fill("");

    // Filtro por categoria: o chip tem o título completo
    await abrirLista();
    await page.locator('button[title^="Origens e Clãs"]').click();
    const origens = await linhas().allInnerTexts();
    assert.equal(origens.length > 10 && origens.length < 40, true, "o filtro de categoria separa as origens");
    assert.equal(origens.some((x) => x.includes("Guerra de Feiticeiros")), false);
    await page.locator('button[title^="Origens e Clãs"]').click();

    // Liga o Guerra: ele sobe para o grupo Ligados Nesta Ficha
    await abrirLista();
    await busca.fill("guerra de feiti");
    await linhas().first().click();
    await page.getByRole("button", { name: /^Desligado Neste Personagem/ }).click();
    await abrirLista();
    await busca.fill("");
    assert.equal(await page.getByText(/^1 ligado de 88$/).count(), 1, "agora há 1 ligado");
    await abrirLista();
    const primeiro = (await linhas().allInnerTexts())[0];
    assert.equal(primeiro.includes("Guerra de Feiticeiros"), true, "o ligado vem primeiro");
    assert.equal(await page.getByText("Ligados Neste Personagem", { exact: true }).count() >= 1, true, "o grupo de ligados tem cabeçalho");
    assert.equal(await page.getByLabel("Progressão Épica", { exact: false }).count(), 1, "os ajustes aparecem no detalhe");

    // Filtro Ligados
    await page.locator('button[title="Ligados Neste Personagem"]').click();
    assert.equal((await linhas().allInnerTexts()).length, 1, "o filtro Ligados mostra só o ligado");
    await page.locator('button[title="Ligados Neste Personagem"]').click();

    // O detalhe mostra o que o pacote muda
    assert.equal(await page.getByText("PV Final ×2").count() >= 1, true, "o detalhe lista as regras");
    assert.equal(await page.getByText("Atualiza Sozinho").count() >= 1, true);

    await page.screenshot({ path: `.audit/addons-lista-shots/aba-${largura}.png`, fullPage: true });
    assert.deepEqual(erros, []);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "sem barra horizontal");
    relatorio.push({ largura, itens: total, busca: true, categoria: true, ligar: true, destaque: true, erros });
    await ctx.close();
  }
  await writeFile(".audit/addons-lista-report.json", JSON.stringify(relatorio, null, 2));
  console.log(JSON.stringify(relatorio));
} finally {
  await browser.close();
}
