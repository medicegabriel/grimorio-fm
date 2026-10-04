import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
const linhas = [];
try {
  for (const rota of ["afty", "player"]) {
    // Contexto descartável, sem perfil persistente nem dados do Chrome do autor.
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const erros = [];
    page.on("pageerror", (e) => erros.push(e.message));
    await page.goto(`http://127.0.0.1:5273/${rota}`, { waitUntil: "networkidle" });
    console.log("Dados no contexto temporário:", await page.evaluate(() => Object.keys(localStorage)));
    await page.evaluate(async (sistema) => {
      await import("/src/systems/afty/afty-derive.js");
      const { createBlankAfty } = await import("/src/systems/afty/afty-schema.js");
      const { createBlankInvocacao, createBlankAcao, createBlankCaracteristica } = await import("/src/systems/afty/afty-invocacoes.js");
      const eq = await import("/src/systems/afty/afty-equipamentos.js");
      const { aplicarAddons: verificarAplicarAddons } = await import('/src/systems/afty/afty-addons.js'); verificarAplicarAddons([]); const f = createBlankAfty();
      Object.assign(f, { id: "lote02-ui", name: "Lote 02", rulesVersion: sistema });
      const arma = eq.catalogoDoTipo("arma")[0];
      f.equipamentos.itens = [{ ...eq.novaEntradaEquip("arma", arma.id, arma), equipado: true, fa: { grau: "especial", encantamentos: [], habilidadeUnica: "Teste", habilidadeEfeitos: [{ canal: "defesa", expr: "1" }] } }];
      const inv = createBlankInvocacao("quarto");
      inv.nome = "Invocação do Lote 02";
      inv.atributos.forca = 18;
      inv.acoes = [{ ...createBlankAcao(), nome: "Ação do Lote 02", modificadorExpr: "1" }];
      inv.caracteristicas = [{ ...createBlankCaracteristica(), nome: "Característica do Lote 02", subtipo: "vida", modificadorExpr: "1" }];
      f.invocacoes = [inv];
      f.core.tecnicaEfeitos = [{ canal: "defesa", expr: "1", quando: "sempre" }];
      const chave = `fm_creatures_${sistema}_v1`;
      const anteriores = JSON.parse(localStorage.getItem(chave) || "[]");
      // Acrescenta o caso de teste e preserva todos os registros anteriores.
      localStorage.setItem(chave, JSON.stringify([...anteriores, f]));
    }, rota);
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Menu de ações", exact: true }).last().click();
    await page.getByRole("button", { name: "Editar", exact: true }).click();
    await page.locator("header h1").waitFor();
    const testar = async (campo, valida, nome) => {
      await campo.fill("forca_errada + 1");
      await page.waitForTimeout(200);
      assert.match(await campo.getAttribute("class"), /border-red-600/);
      const erro = (await page.locator("body").innerText()).split("\n").filter((linha) => linha.includes("forca_errada")).join("\n");
      assert.match(erro, /forca_errada/);
      await campo.screenshot({ path: `.audit/verificacao-lote02-shots/${rota}-${nome}-invalida.png` });
      await campo.fill(valida);
      await page.waitForTimeout(200);
      assert.doesNotMatch(await campo.getAttribute("class"), /border-red-600/);
      const resultado = await campo.locator("../..").innerText();
      assert.doesNotMatch(resultado, /forca_errada/);
      await campo.locator("../..").screenshot({ path: `.audit/verificacao-lote02-shots/${rota}-${nome}-valida.png` });
      linhas.push({ rota, campo: nome, invalida: "forca_errada + 1", erro, valida, resultado });
    };
    await page.getByRole("tab", { name: "Equipamentos", exact: true }).click();
    await page.getByTitle("Editar Ferramenta Amaldiçoada", { exact: true }).click();
    await testar(page.getByRole("textbox", { name: "Expressão", exact: true }), "grau + piso(bt / 2)", "habilidade-unica");
    await page.getByRole("tab", { name: "Habilidades", exact: true }).click();
    await testar(page.getByRole("textbox", { name: "Condição", exact: true }).first(), "sempre", "quando-tecnica");
    await page.getByRole("tab", { name: "Invocações", exact: true }).click();
    await page.getByRole("tab", { name: /^Ações/ }).click();
    await page.getByRole("button", { name: /^Ação do Lote 02/ }).click();
    await testar(page.getByRole("textbox", { name: "Modificador da DSL", exact: true }), "grau + mod_forca + nd + bt + tipo_shikigami_puro + sempre + nunca", "acao-invocacao");
    await page.getByRole("tab", { name: /^Caract\./ }).click();
    await page.getByRole("button", { name: /^Característica do Lote 02/ }).click();
    await testar(page.getByRole("textbox", { name: "Modificador da DSL", exact: true }), "grau + mod_forca + nd + bt + tipo_shikigami_puro + sempre + nunca", "caracteristica-invocacao");
    assert.deepEqual(erros, []);
    await context.close();
  }
  console.log(JSON.stringify(linhas, null, 2));
  await writeFile(".audit/verificacao-lote02-formulas.json", JSON.stringify(linhas, null, 2));
} finally {
  await browser.close();
}
