/* PONTO 5 do consultor: os caminhos do EDITOR de Aparência no G2, com Chrome real, cada um com captura.
   E1 abrir e aplicar ao vivo · E2 "Desligado" · E3 reset · E4 Esc e foco · E5 o CSS que mira a caixa de busca prende o editor ·
   E6 salva-vidas (×) · E7 ?semcss=1 · E8 celular 390 · E9 Prompt IA (copiar) · E10 gravação (600 ms) */
import { abre, aba, passo, check, foto, encerra, espera, etapa, saida, CAPTURAS, DIR } from "./lib.mjs";
import fs from "node:fs";

const abrirPainel = async (p) => {
  await p.locator('button[aria-label="Mais opções da ficha"]').click();
  await espera(p, 250);
  await p.getByRole("menuitem", { name: "Aparência" }).click();
  await p.locator(".afty-busca textarea[aria-label='CSS personalizado']").waitFor();
  await espera(p, 250);
};
const cor = (p, sel, prop = "color") => p.evaluate(({ sel, prop }) => { const e = document.querySelector(sel); return e ? getComputedStyle(e)[prop] : null; }, { sel, prop });
const digita = async (p, texto) => { const t = p.locator("textarea[aria-label='CSS personalizado']"); await t.fill(texto); await espera(p, 200); };

/* ---------- E1 abrir e aplicar ao vivo ---------- */
passo("E1 abrir o painel e aplicar CSS ao vivo");
{
  const { ctx, p } = await abre({ ficha: "mesa", query: "tema=escuro" });
  const antes = await cor(p, ".afty-nome");
  await abrirPainel(p);
  await foto(p, "e1-painel-aberto-1440");
  const caixa = await p.locator(".afty-busca").boundingBox();
  etapa.medidas.painel1440 = caixa;
  check("o painel cabe na janela de 900 de altura", caixa.y >= 0 && caixa.y + caixa.height <= 900, caixa);
  await digita(p, ".afty-nome { color: #ff00aa; }");
  const depois = await cor(p, ".afty-nome");
  check("CSS com .afty-nome muda a cor do nome do G2 (o contrato diz que muda)", depois === "rgb(255, 0, 170)", { antes, depois });
  await digita(p, ".e-nome { color: #ff00aa; }");
  const classeG2 = await cor(p, ".afty-nome");
  check("e a classe própria do G2 (.e-nome) também muda, mas não está no contrato", classeG2 === "rgb(255, 0, 170)", classeG2);
  await digita(p, ".afty-card { background: #123456; }");
  const bgCard = await p.evaluate(() => [...document.querySelectorAll(".afty-card")].filter((e) => e.offsetParent).map((e) => getComputedStyle(e).backgroundColor).slice(0, 6));
  check("CSS com .afty-card pinta o fundo das seções do G2", bgCard.length > 0 && bgCard.every((c) => c === "rgb(18, 52, 86)"), bgCard);
  await foto(p, "e1-css-card-aplicado");
  check("sem erro de página", etapa.erros.length === 0, etapa.erros);
  await ctx.close();
}

/* ---------- E2 "Desligado" ---------- */
passo("E2 o que Desligado desliga");
{
  const { ctx, p } = await abre({ ficha: "mesa", query: "preset=sangue&css=minamoto" });
  const fundoPreset = await cor(p, "#afty-ficha", "backgroundColor");
  await abrirPainel(p);
  const antes = { ligado: await p.locator(".afty-busca").getByRole("button", { name: /^Ligado$/ }).count() };
  await p.locator(".afty-busca").getByRole("button", { name: /^Ligado$/ }).click();
  await espera(p, 300);
  const estilos = await p.evaluate(() => [...document.querySelectorAll("#afty-ficha > style")].map((s) => s.textContent.length));
  const fundoDepois = await cor(p, "#afty-ficha", "backgroundColor");
  const tokenFundo = await p.evaluate(() => getComputedStyle(document.getElementById("afty-ficha")).getPropertyValue("--afty-fundo").trim());
  etapa.medidas.desligado = { estilosInjetados: estilos, fundoPreset, fundoDepois, tokenFundo };
  check("Desligado remove só o CSS livre: o bloco de variáveis do preset continua", estilos.length === 1 && tokenFundo === "#0c0405", { estilos, tokenFundo });
  await foto(p, "e2-desligado-preset-fica");
  await ctx.close();
}

/* ---------- E3 reset ---------- */
passo("E3 reset apaga o texto salvo, sem desfazer");
{
  const { ctx, p } = await abre({ ficha: "mesa", query: "css=minamoto&preset=sangue" });
  await abrirPainel(p);
  const antes = (await p.locator("textarea[aria-label='CSS personalizado']").inputValue()).length;
  await p.locator('.afty-busca button[aria-label="Voltar ao tema padrão"]').click();
  await espera(p, 400);
  const depois = (await p.locator("textarea[aria-label='CSS personalizado']").inputValue()).length;
  await espera(p, 900);
  const salvos = await p.evaluate(() => window.__salvos.map((s) => ({ presetId: s.valor.presetId, cssLen: s.valor.css?.length ?? 0, ligado: s.valor.ligado })));
  etapa.medidas.reset = { antes, depois, salvos };
  check("o reset zera o CSS no ato, com um clique e sem confirmação", antes > 1000 && depois === 0, { antes, depois });
  check("e a criatura recebe o tema vazio (a perda chega ao armazenamento)", salvos.length === 1 && salvos[0].cssLen === 0 && salvos[0].presetId === "padrao", salvos);
  const desfazer = await p.getByRole("button", { name: /desfazer/i }).count();
  check("não há como desfazer na tela", desfazer === 0, desfazer);
  await ctx.close();
}

/* ---------- E4 Esc e foco ---------- */
passo("E4 teclado: Esc, Tab, foco ao fechar");
{
  const { ctx, p } = await abre({ ficha: "mesa", query: "tema=escuro" });
  await abrirPainel(p);
  const foco0 = await p.evaluate(() => document.activeElement?.tagName + "." + (document.activeElement?.getAttribute("aria-label") ?? ""));
  await p.keyboard.press("Escape");
  await espera(p, 300);
  const aindaAberto = await p.locator(".afty-busca textarea[aria-label='CSS personalizado']").count();
  check("Esc fecha o painel de Aparência", aindaAberto === 0, { aindaAberto });
  if (aindaAberto) {
    await p.locator('.afty-busca button[aria-label="Fechar"]').click();
    await espera(p, 300);
  }
  const focoDepois = await p.evaluate(() => document.activeElement?.tagName + "." + (document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.className ?? "").toString().slice(0, 40));
  etapa.medidas.foco = { aoAbrir: foco0, aposFechar: focoDepois };
  check("o foco volta ao botão que abriu (Mais opções)", /Mais opções/.test(focoDepois), focoDepois);
  /* o Tab dentro do textarea insere tabulação? */
  await abrirPainel(p);
  await p.locator("textarea[aria-label='CSS personalizado']").focus();
  await p.keyboard.press("Tab");
  const focoTab = await p.evaluate(() => document.activeElement?.tagName + ":" + (document.activeElement?.getAttribute("aria-label") ?? "").slice(0, 30));
  etapa.medidas.tabNoTextarea = focoTab;
  const preso = await p.evaluate(() => { const painel = document.querySelector(".afty-busca"); return painel?.getAttribute("role") + "|" + painel?.getAttribute("aria-modal"); });
  check("o painel declara role=dialog e aria-modal", /dialog\|true/.test(preso), preso);
  await ctx.close();
}

/* ---------- E5 e E6: o CSS que prende o editor e o salva-vidas ---------- */
passo("E5 o CSS que mira a caixa de busca esconde o editor");
{
  const { ctx, p } = await abre({ ficha: "mesa", query: "tema=escuro" });
  await abrirPainel(p);
  await digita(p, ".afty-busca-fundo { display: none; }");
  const visivel = await p.locator(".afty-busca").isVisible();
  check("o contrato lista .afty-busca-fundo/.afty-busca como a busca, e o editor usa as MESMAS classes: mirar a busca esconde o editor", visivel === false, { visivel });
  await foto(p, "e5-editor-escondido-pelo-proprio-css");
  const botao = p.locator('button[aria-label="Desligar o CSS personalizado"]');
  const botaoVisivel = await botao.isVisible();
  check("o salva-vidas × aparece fora da raiz", botaoVisivel, botaoVisivel);
  if (botaoVisivel) {
    const topo = await botao.evaluate((b) => { const r = b.getBoundingClientRect(); const e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return e === b; });
    check("e nenhum CSS escopado cobre o ×", topo, topo);
    await botao.click(); await espera(p, 400);
    const volta = await p.locator(".afty-busca").isVisible();
    check("clicar no × desliga o CSS e o editor reaparece", volta, volta);
    await foto(p, "e6-apos-salva-vidas");
    const ligadoTexto = await p.locator(".afty-busca").getByRole("button", { name: /^(Ligado|Desligado)$/ }).innerText();
    const cssPreservado = await p.locator("textarea[aria-label='CSS personalizado']").inputValue();
    check("o texto do CSS foi preservado (só ficou Desligado)", ligadoTexto === "Desligado" && cssPreservado.includes("display: none"), { ligadoTexto, cssPreservado });
  }
  await ctx.close();
}

passo("E6 CSS que esconde cabeçalho e corpo: recuperação");
{
  const { ctx, p } = await abre({ ficha: "mesa", query: "tema=quebrado" });
  await foto(p, "e6-ficha-quebrada");
  const cab = await p.locator(".afty-cabecalho").first().isVisible();
  const botao = p.locator('button[aria-label="Desligar o CSS personalizado"]');
  check("com a ficha escondida pelo CSS, o × continua visível e clicável", (await botao.isVisible()) && cab === false, { cab });
  await botao.click(); await espera(p, 400);
  check("depois do ×, a ficha volta", await p.locator(".afty-cabecalho").first().isVisible());
  await foto(p, "e6-ficha-recuperada");
  await ctx.close();
}

/* ---------- E7 ?semcss=1 ---------- */
passo("E7 ?semcss=1");
{
  const { ctx, p } = await abre({ ficha: "mesa", query: "tema=quebrado&semcss=1" });
  check("a ficha com CSS quebrado abre inteira em ?semcss=1", await p.locator(".afty-cabecalho").first().isVisible());
  const estilos = await p.evaluate(() => document.querySelectorAll("#afty-ficha > style").length);
  const botao = await p.locator('button[aria-label="Desligar o CSS personalizado"]').count();
  check("nenhum <style> do tema foi injetado e o × não aparece (nada a salvar)", estilos === 0 && botao === 0, { estilos, botao });
  await abrirPainel(p);
  const css = await p.locator("textarea[aria-label='CSS personalizado']").inputValue();
  check("o texto salvo continua no editor (não foi perdido)", css.includes(".afty-cabecalho"), css.slice(0, 60));
  await foto(p, "e7-semcss-editor");
  await ctx.close();
  /* sem o parâmetro, o tema volta */
  const o = await abre({ ficha: "mesa", query: "tema=quebrado" });
  check("sem o parâmetro o CSS volta a valer", (await o.p.locator(".afty-cabecalho").first().isVisible()) === false);
  await o.ctx.close();
}

/* ---------- E8 celular ---------- */
passo("E8 celular 390x844");
{
  const { ctx, p } = await abre({ ficha: "mesa", query: "tema=escuro", largura: 390, altura: 844, toque: true });
  await abrirPainel(p);
  await foto(p, "e8-painel-390");
  const caixa = await p.locator(".afty-busca").boundingBox();
  const estouro = await p.evaluate(() => ({ pagina: document.documentElement.scrollWidth - document.documentElement.clientWidth, painel: (() => { const e = document.querySelector(".afty-busca"); return e.scrollWidth - e.clientWidth; })() }));
  etapa.medidas.painel390 = { caixa, estouro };
  check("o painel cabe na largura de 390", caixa.x >= 0 && caixa.x + caixa.width <= 390 && estouro.painel <= 0 && estouro.pagina <= 0, { caixa, estouro });
  const alturaCampo = await p.locator("textarea[aria-label='CSS personalizado']").evaluate((t) => t.getBoundingClientRect().height);
  etapa.medidas.alturaCampoCss390 = alturaCampo;
  await p.locator(".afty-busca").getByRole("tab", { name: "Seletores" }).click(); await espera(p, 300);
  await foto(p, "e8-seletores-390");
  const cortados = await p.evaluate(() => [...document.querySelectorAll(".afty-busca .truncate")].filter((e) => e.scrollWidth > e.clientWidth + 1).length);
  etapa.medidas.seletoresCortadosNoCelular = cortados;
  check("na lista de Seletores a explicação não é cortada (truncate)", cortados === 0, { cortados });
  await ctx.close();
}

/* ---------- E9 Prompt IA ---------- */
passo("E9 Prompt IA: copiar e conteúdo");
{
  const { ctx, p } = await abre({ ficha: "mesa", query: "tema=escuro" });
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:5341" });
  await abrirPainel(p);
  await p.locator(".afty-busca").getByRole("tab", { name: "Prompt IA" }).click(); await espera(p, 300);
  await p.getByRole("button", { name: /Copiar Prompt/ }).click(); await espera(p, 300);
  const copiado = await p.evaluate(() => navigator.clipboard.readText());
  fs.writeFileSync(`${DIR}prompt-ia-g2.txt`, copiado);
  etapa.medidas.prompt = { caracteres: copiado.length };
  check("Copiar Prompt coloca o texto na área de transferência", copiado.length > 5000, copiado.length);
  check("o botão confirma (Copiado)", await p.getByRole("button", { name: /^Copiado$/ }).count() === 1);
  await foto(p, "e9-prompt");
  await ctx.close();
}

/* ---------- E10 gravação ---------- */
passo("E10 gravação do tema (600 ms) e perda ao sair antes");
{
  const { ctx, p } = await abre({ ficha: "mesa", query: "tema=escuro" });
  await abrirPainel(p);
  await digita(p, ".afty-nome { color: #ff00aa; }");
  const logo = await p.evaluate(() => window.__salvos.length);
  await espera(p, 1000);
  const depois = await p.evaluate(() => window.__salvos.length);
  check("o tema é gravado pela Ficha cerca de 600 ms depois da edição", logo === 0 && depois >= 1, { logo, depois });
  await ctx.close();
}
await encerra("editor-fluxo");
