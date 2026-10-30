import { register } from "node:module";
import { chromium } from "playwright";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");

const antigo = async (id) => AD.normalizarPacote(JSON.parse(await readFile(`addons/${id}.json`, "utf8")));
await mkdir(".audit/guerra-shots", { recursive: true });

// Ficha de Player com pacotes antigos: 3 que o Guerra cobre por inteiro e 2 que cobre em parte
const player = createBlankAfty();
player.rulesVersion = "player"; player.core.nd = 20; player.name = "Teste Guerra Player";
const tal = await antigo("talentos-iniciais"); tal.regrasAfty = { talentosIniciais: 3 };
player.addons = [await antigo("regras-grimorio"), await antigo("player-progressao-epica"), await antigo("ascendendo-alem-dos-ceus"), tal, await antigo("alma-do-afty")];
const caminhoPlayer = ".audit/guerra-player.json";
await writeFile(caminhoPlayer, JSON.stringify({ version: "2.0", system: "Feiticeiros e Maldições", creatures: [player] }));

// Ficha de criatura limpa
const criatura = createBlankAfty();
criatura.rulesVersion = "afty"; criatura.core.nd = 20; criatura.name = "Teste Guerra Criatura";
const caminhoCriatura = ".audit/guerra-criatura.json";
await writeFile(caminhoCriatura, JSON.stringify({ version: "2.0", system: "Feiticeiros e Maldições", creatures: [criatura] }));

const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
const relatorio = [];

async function abrirAddons(page, rota, caminho, nome) {
  await page.goto("http://localhost:5173" + rota, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Importar", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles(caminho);
  await page.getByText(nome, { exact: true }).first().waitFor();
  await page.getByRole("dialog").getByRole("button", { name: "Fechar", exact: true }).last().click();
  await page.getByText(nome, { exact: true }).first().click();
  await page.locator('button[title="Editar no criador"]').click();
  await page.getByRole("tab", { name: "Outros", exact: true }).click();
  await page.getByRole("menuitem", { name: "Addons", exact: true }).click();
}
// No celular a lista fica atrás de um botão que mostra o escolhido
async function escolher(page, mobile, nome) {
  if (mobile) {
    const botao = page.locator("button[aria-expanded]").filter({ hasText: /\d+$/ }).first();
    if (await botao.getAttribute("aria-expanded") === "false") await botao.click();
  }
  await page.locator(`button[title="${nome}"]`).first().click();
}
const guardada = (page, chave) => page.evaluate((k) => JSON.parse(localStorage.getItem(k))[0], chave);

try {
  for (const largura of [1440, 390]) {
    const mobile = largura === 390;
    /* ---------- Player: ligar o Guerra numa ficha com pacotes antigos ---------- */
    {
      const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: mobile, hasTouch: mobile });
      const page = await ctx.newPage(); page.setDefaultTimeout(15000);
      const erros = []; page.on("pageerror", (e) => erros.push(e.message));
      await abrirAddons(page, "/Player", caminhoPlayer, player.name);
      // a ficha só com pacotes antigos NÃO muda ao abrir: o Guerra espera alguém ligar
      assert.equal(await page.getByText(/^5 ligados de 6$/).count(), 1, "os 5 pacotes antigos seguem ligados");
      assert.equal(await page.getByText("continua ligado").count(), 0, "sem aviso antes de ligar o Guerra");
      await escolher(page, mobile, "Guerra de Feiticeiros");
      await page.getByRole("button", { name: /^Desligado Neste Personagem/ }).click();
      // quem liga o Guerra desliga o que ele cobre por inteiro; os 2 parciais ficam
      assert.equal(await page.getByText(/^3 ligados de 3$/).count(), 1, "Guerra mais os 2 parciais");
      assert.equal(await page.getByText(/Regras Grimorio continua ligado/).count(), 1, "aviso do Regras Grimorio");
      assert.equal(await page.getByText(/Progressão Épica continua ligado/).count(), 1, "aviso da Progressão Épica");
      assert.equal(await page.getByLabel("Progressão Épica", { exact: false }).isChecked(), true, "a Épica veio ligada do Ascendendo");
      assert.equal(await page.getByLabel("Talentos Iniciais").inputValue(), "3", "os 3 Talentos vieram do pacote antigo");
      await page.screenshot({ path: `.audit/guerra-shots/player-ligado-${largura}.png`, fullPage: true });
      await page.getByLabel("Progressão Épica", { exact: false }).uncheck();
      await page.getByRole("button", { name: "Salvar Alterações", exact: true }).click();
      const salvo = await guardada(page, "fm_creatures_player_v1");
      assert.deepEqual(salvo.addons.map((p) => p.id), ["regras-grimorio", "player-progressao-epica", "guerra-de-feiticeiros"]);
      assert.equal(salvo.addonAjustes["guerra-de-feiticeiros"].progressaoEpica, false);
      assert.equal(salvo.addonAjustes["guerra-de-feiticeiros"].talentosIniciais, 3);
      assert.equal(salvo.addons[2].regrasAfty.multiplicadorPvFinal, 2);
      assert.equal(Object.hasOwn(salvo.addons[2], "ajustes"), false);
      assert.deepEqual(erros, []);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "sem barra horizontal");
      relatorio.push({ largura, sistema: "player", esperouSerLigado: true, ligouEDesligouOsAntigos: true, parciaisComAviso: true, epicaDesligada: true, erros });
      await ctx.close();
    }
    /* ---------- Criatura: ligar do zero ---------- */
    {
      const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: mobile, hasTouch: mobile });
      const page = await ctx.newPage(); page.setDefaultTimeout(15000);
      const erros = []; page.on("pageerror", (e) => erros.push(e.message));
      await abrirAddons(page, "/Afty", caminhoCriatura, criatura.name);
      await escolher(page, mobile, "Guerra de Feiticeiros");
      await page.getByRole("button", { name: /^Desligado Nesta Criatura/ }).click();
      assert.equal(await page.getByLabel("Talentos Iniciais").inputValue(), "1");
      assert.equal(await page.getByLabel("Progressão Épica", { exact: false }).count(), 0, "a criatura não tem a Épica");
      await page.getByLabel("Talentos Iniciais").fill("2");
      await page.getByLabel("Talentos Iniciais").press("Tab");
      await page.screenshot({ path: `.audit/guerra-shots/criatura-${largura}.png`, fullPage: true });
      await page.getByRole("button", { name: "Salvar Alterações", exact: true }).click();
      const salvo = await guardada(page, "fm_creatures_afty_v1");
      assert.deepEqual(salvo.addons.map((p) => p.id), ["guerra-de-feiticeiros"]);
      assert.deepEqual(Object.keys(salvo.addons[0].regrasAfty).sort(), ["talentosIniciais", "trNoLimiteDePericias"]);
      assert.equal(salvo.addons[0].regrasAfty.talentosIniciais, 2);
      assert.equal(Object.keys(salvo.addons[0].substitui ?? {}).length, 0, "a criatura não carrega remendos");
      assert.deepEqual(erros, []);
      relatorio.push({ largura, sistema: "afty", ligouDoZero: true, semEpica: true, talentos: 2, erros });

      /* ---------- Atualização sozinha: versão velha gravada, reabre ---------- */
      const velha = await page.evaluate(() => {
        const lista = JSON.parse(localStorage.getItem("fm_creatures_afty_v1"));
        lista[0].addons[0].versao = "0.0.1";
        lista[0].addons[0].composicao.chave = "0.0.1|afty|talentosIniciais=2";
        lista[0].addons[0].regrasAfty.trNoLimiteDePericias = false;
        localStorage.setItem("fm_creatures_afty_v1", JSON.stringify(lista));
        return lista[0].addons[0].versao;
      });
      assert.equal(velha, "0.0.1");
      await page.goto("http://localhost:5173/Afty", { waitUntil: "networkidle" });
      await page.getByText(criatura.name, { exact: true }).first().click();
      await page.locator('button[title="Editar no criador"]').click();
      await page.getByRole("tab", { name: "Outros", exact: true }).click();
      await page.getByRole("menuitem", { name: "Addons", exact: true }).click();
      assert.equal(await page.getByLabel("Talentos Iniciais").inputValue(), "2", "a escolha da ficha sobreviveu à atualização");
      await page.getByRole("button", { name: "Salvar Alterações", exact: true }).click();
      const atual = await guardada(page, "fm_creatures_afty_v1");
      assert.equal(atual.addons[0].versao, "1.0.0");
      assert.equal(atual.addons[0].regrasAfty.trNoLimiteDePericias, true);
      assert.equal(atual.addons[0].regrasAfty.talentosIniciais, 2);
      relatorio.push({ largura, sistema: "afty", atualizouSozinha: true, escolhaPreservada: true });
      await ctx.close();
    }
  }
  await writeFile(".audit/guerra-report.json", JSON.stringify(relatorio, null, 2));
  console.log(JSON.stringify(relatorio));
} finally {
  await browser.close();
}
