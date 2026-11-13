import { monta } from "./base.mjs";
const tamanho = process.argv[2] ?? "1440x900";
const { p, foto, saida, fim } = await monta({ tamanho, ficha: "mesa", prefixo: "L1" });
const area = p.locator("#afty-ficha .e-area");
const ok = (nome, cond, extra = "") => { saida[`${cond ? "OK   " : "FALHA"} ${nome}`] = extra; };
const fila = (nome) => area.locator(`.k-fila:has(.k-texto:text-is("${nome}"))`).first();
const catalogoAberto = () => area.locator("[data-catalogo]").count().then((n) => n > 0);
const nCartoes = () => area.locator(".g2-cartao").count();

// Favoritos na tela dos Ativos, vazia
const favs = area.locator("[data-favoritos-ativos] .k-fila");
ok("favoritos na tela vazia", (await favs.count()) === 5, `${await favs.count()} linhas`);
saida.ordemFavoritos = await favs.evaluateAll((els) => els.map((e) => `${e.querySelector(".k-texto").textContent} [${e.dataset.acao ?? "sem"}]`));
await foto("01-vazio-com-favoritos");

// Catálogo: blocos
await p.getByRole("button", { name: "Adicionar" }).first().click(); await p.waitForTimeout(300);
await area.getByRole("button", { name: /Todo o Cat/ }).click(); await p.waitForTimeout(300);
saida.blocos = await area.locator(".k-bloco").evaluateAll((els) => els.map((e) => e.textContent));
const ordem = await area.locator(".k-lista .k-fila").evaluateAll((els) => els.map((e) => e.dataset.acao ?? "sem"));
const primeiroSem = ordem.indexOf("sem");
ok("ativáveis antes das demais", primeiroSem > 0 && !ordem.slice(primeiroSem).some((x) => x !== "sem"), ordem.join(","));
await foto("02-catalogo-blocos");

// Ativar direto pela linha
await fila("Olhos fechados").locator(".k-acao").click(); await p.waitForTimeout(500);
ok("linha liga direto e fica no catálogo", (await catalogoAberto()) && (await fila("Olhos fechados").getAttribute("data-acao")) === "ativo");
ok("painel do ativo tem Encerrar", (await area.locator("[data-ativo-no-catalogo] [data-encerrar]").count()) === 1);
saida.painelAtivo = (await area.locator(".k-detalhe").innerText()).replace(/\n+/g, " | ").slice(0, 300);
await foto("03-ativou-direto");
await fila("Reforço Corporal").locator(".k-acao").click(); await p.waitForTimeout(500);
saida.painelReforco = (await area.locator(".k-detalhe").innerText()).replace(/\n+/g, " | ").slice(0, 400);
await foto("04-reforco-ativo-no-catalogo");
// Encerrar pelo catálogo
await area.locator("[data-ativo-no-catalogo] [data-encerrar]").click(); await p.waitForTimeout(500);
ok("encerrar pelo catálogo devolve o Ativar", (await fila("Reforço Corporal").getAttribute("data-acao")) === "ativar");

// Sem ação: regra no painel, sem a frase
await fila("Assumir Postura").locator(".k-item").click(); await p.waitForTimeout(400);
const texto = await area.locator(".k-detalhe").innerText();
ok("frase 'Siga a Regra Completa' sumiu", !/Siga a Regra Completa/.test(texto));
ok("regra no painel", (await area.locator("[data-regra-no-painel]").count()) === 1, texto.replace(/\n+/g, " | ").slice(0, 260));
ok("operação do item no painel (Postura)", (await area.locator("[data-operacao-opcao]").count()) === 1);
await foto("05-assumir-postura");

// Com Preparação: Golpe Especial, motivo do botão apagado e ficar no catálogo
await fila("Golpe Especial").locator(".k-acao").click(); await p.waitForTimeout(400);
ok("motivo do Confirmar apagado", (await area.locator("[data-motivo]").count()) === 1, await area.locator("[data-motivo]").first().textContent().catch(() => ""));
await foto("06-golpe-motivo");
await area.getByRole("button", { name: /^Preciso/ }).click(); await p.waitForTimeout(200);
const conf = area.locator("[data-confirmar]");
saida.golpeConfirmarHabilitado = await conf.isEnabled();
saida.golpeBloqueios = await area.locator("[data-bloqueio]").allTextContents();
if (await conf.isEnabled()) {
  await conf.click(); await p.waitForTimeout(600);
  ok("confirmar Preparação fica no catálogo", await catalogoAberto());
  await foto("07-golpe-confirmado");
}

// Voltar aos Ativos
await area.locator("[data-voltar-ativos]").click(); await p.waitForTimeout(400);
ok("cartão do que foi ligado", (await nCartoes()) >= 1, `${await nCartoes()} cartões`);
await foto("08-ativos-com-favoritos");
await foto("08-ativos-inteira", { fullPage: true });
// Detalhe sem colunas vazias
await area.locator(".g2-cartao").first().click(); await p.waitForTimeout(400);
saida.colunasVisiveis = await area.locator(".x-colunas > .x-col").evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== "none").map((e) => e.dataset.col));
await foto("09-detalhe");
await area.locator(".g2-cartao").first().click(); await p.waitForTimeout(200);

// Favorito direto e favorito com Preparação (volta aos Ativos)
const antes = await nCartoes();
const favDireto = area.locator('[data-favoritos-ativos] .k-fila[data-acao="ativar"]');
saida.favoritosAtivaveis = await favDireto.evaluateAll((els) => els.map((e) => e.querySelector(".k-texto").textContent));
await area.locator('[data-favoritos-ativos] .k-fila:has(.k-texto:text-is("Ataque Concentrado")) .k-acao').click(); await p.waitForTimeout(500);
ok("favorito com Preparação abre o catálogo nela", (await catalogoAberto()) && (await area.locator(".g2-preparo").count()) === 1);
saida.concentradoBloqueios = await area.locator("[data-bloqueio]").allTextContents();
await foto("10-favorito-preparo");
saida.cartoesAntes = antes;
await fim();
