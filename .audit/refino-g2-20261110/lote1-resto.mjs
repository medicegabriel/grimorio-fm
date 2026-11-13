import { monta } from "./base.mjs";
{
  const { p, foto, saida, fim } = await monta({ tamanho: "1440x900", ficha: "mesa", aba: "acoes", prefixo: "L1b" });
  const ok = (nome, cond, extra = "") => { saida[`${cond ? "OK   " : "FALHA"} ${nome}`] = extra; };
  const secoes = await p.locator("#afty-ficha [data-m-secao]").evaluateAll((els) => els.map((e) => e.dataset.mSecao));
  ok("Pular é a última seção de Ações", secoes.at(-1) === "pular" && secoes[0] !== "pular", secoes.join(","));
  saida.indice = await p.locator(".m-indice-item").allTextContents();
  await foto("01-acoes-topo");
  await p.locator(".m-indice-item", { hasText: "Pular" }).click(); await p.waitForTimeout(900);
  const topoPular = await p.locator('[data-m-secao="pular"]').evaluate((e) => Math.round(e.getBoundingClientRect().top));
  ok("índice salta ao Pular", topoPular > 0 && topoPular < 900, `top ${topoPular}`);
  await foto("02-acoes-pular");
  // Leitor de Habilidades
  await p.locator('[data-afty-aba="habilidades"]').click(); await p.waitForTimeout(400);
  const area = p.locator("#afty-ficha .e-area");
  const consultas = () => p.locator(".afty-consulta").count();
  const titulo = () => p.locator(".afty-consulta .e-consulta-titulo").textContent().catch(() => null);
  await area.getByText("Assumir Postura", { exact: true }).first().click(); await p.waitForTimeout(350);
  ok("abre uma consulta", (await consultas()) === 1 && (await titulo()) === "Assumir Postura", await titulo());
  await area.getByText("Repertório do Especialista", { exact: true }).first().click(); await p.waitForTimeout(350);
  ok("outra habilidade troca o conteúdo, sem abas", (await titulo()) === "Repertório do Especialista" && (await p.locator(".e-consulta-aba").count()) === 0, await titulo());
  await foto("03-leitor-um");
  await area.getByText("Repertório do Especialista", { exact: true }).first().click(); await p.waitForTimeout(350);
  ok("reclique fecha", (await consultas()) === 0);
  await fim();
}
{
  // Confirmar com Preparação fica no catálogo (ficha com PE)
  const { p, foto, saida, fim } = await monta({ tamanho: "1440x900", ficha: "arsenal", aba: "buffs", prefixo: "L1b" });
  const ok = (nome, cond, extra = "") => { saida[`${cond ? "OK   " : "FALHA"} ${nome}`] = extra; };
  const area = p.locator("#afty-ficha .e-area");
  const fila = (nome) => area.locator(`.k-fila:has(.k-texto:text-is("${nome}"))`).first();
  saida.favoritos = await area.locator("[data-favoritos-ativos] .k-fila").evaluateAll((els) => els.map((e) => `${e.querySelector(".k-texto").textContent} [${e.dataset.acao ?? "sem"}]`));
  await p.getByRole("button", { name: "Adicionar" }).first().click(); await p.waitForTimeout(300);
  await area.getByRole("button", { name: /Todo o Cat/ }).click(); await p.waitForTimeout(300);
  await fila("Ataque Concentrado").locator(".k-acao").click(); await p.waitForTimeout(400);
  const conf = area.locator("[data-confirmar]");
  saida.confirmarHabilitado = await conf.isEnabled();
  if (await conf.isEnabled()) {
    await conf.click(); await p.waitForTimeout(700);
    ok("confirmar Preparação FICA no catálogo", (await area.locator("[data-catalogo]").count()) === 1);
    ok("linha vira Ativo", (await fila("Ataque Concentrado").getAttribute("data-acao")) === "ativo");
    saida.painel = (await area.locator(".k-detalhe").innerText()).replace(/\n+/g, " | ").slice(0, 300);
    await foto("04-preparo-confirmado-no-catalogo");
    await area.locator("[data-voltar-ativos]").click(); await p.waitForTimeout(400);
    ok("cartão existe nos Ativos", (await area.locator(".g2-cartao").count()) === 1);
    // encerrar e reativar pelo favorito: volta aos Ativos
    await area.locator(".g2-cartao").first().click(); await p.waitForTimeout(300);
    await area.locator("[data-encerrar]").first().click(); await p.waitForTimeout(500);
    const fav = area.locator('[data-favoritos-ativos] .k-fila:has(.k-texto:text-is("Ataque Concentrado")) .k-acao');
    if (await fav.count()) {
      await fav.click(); await p.waitForTimeout(400);
      await area.locator("[data-confirmar]").click(); await p.waitForTimeout(700);
      ok("Preparação aberta pelo favorito VOLTA aos Ativos", (await area.locator("[data-catalogo]").count()) === 0 && (await area.locator(".g2-cartao").count()) === 1);
      await foto("05-favorito-voltou");
    } else saida.semFavoritoConcentrado = true;
  }
  await fim();
}
