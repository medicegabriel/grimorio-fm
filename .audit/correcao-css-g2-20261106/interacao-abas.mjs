/* PRÉVIA DAS TRÊS ABAS: isolamento das abas mantidas montadas, retenção, CampoDomo, Liberação com contexto atual, favoritos, busca global
   e o Golpe pela Preparação dos Efeitos (2A). Cliques reais, teclado, sessão lida do armazenamento da prévia. */
import { abre, aba, passo, check, foto, encerra, espera, etapa, sessaoGravada, linha, rolarDe, dados } from "./lib.mjs";

const semCarimbo = (s) => JSON.stringify({ ...s, atualizadoEm: 0 });
const busca = async (p, termo, alvo) => {
  await p.keyboard.press("Control+k");
  await p.locator(".afty-busca input").fill(termo);
  await espera(p, 200);
  await p.locator(".afty-busca-item").filter({ hasText: alvo }).first().click();
  await espera(p, 600);
};

/* ---------- 1. Isolamento com as três abas já visitadas ---------- */
{
  passo("isolamento: flutuante, foco, Tab, seletores e contexto atual com as três abas visitadas");
  const { ctx, p } = await abre({ ficha: "arsenal", sorte: 0.5 });
  for (const id of ["pericias", "equipamentos", "acoes", "pericias"]) await aba(p, id);
  check("as três abas ficam montadas", (await p.locator("[data-aba-g2]").count()) === 3);
  /* Flutuante aberto na aba que vai se esconder, troca pela tecla 1. */
  await p.locator('[data-m-linha="pericia:atletismo"] button.afty-rolavel').hover();
  await espera(p, 250);
  check("as fontes abriram em Perícias", await p.locator(".afty-fontes-flutuante").isVisible());
  const daPericia = await p.locator(".afty-fontes-flutuante").textContent();
  /* O cursor fica parado onde estava: depois da troca, o Chrome pode abrir o hover de quem ficou sob ele NA ABA VISÍVEL. O que não pode
     sobrar é o painel da perícia, que agora está numa aba oculta. */
  await p.keyboard.press("1");
  await espera(p, 300);
  const sobrou = await p.locator(".afty-fontes-flutuante").allTextContents();
  check("trocar de aba pelo teclado fecha o flutuante da aba escondida", !sobrou.includes(daPericia), { daPericia, sobrou });
  await p.mouse.move(2, 400);
  await espera(p, 200);
  const ocultas = await p.evaluate(() => [...document.querySelectorAll("[data-aba-g2][hidden]")].map((el) => ({
    nome: el.dataset.abaG2, inert: el.inert,
    alvos: el.querySelectorAll('[data-rolavel], [data-lista], [data-chave-ativo], [data-chave], [role="dialog"], [role="tooltip"], [aria-modal="true"], .m-flutuante, .e-consulta').length,
  })));
  check("as duas abas ocultas estão `inert` e não oferecem seletores lidos pela raiz", ocultas.length === 2 && ocultas.every((o) => o.inert && o.alvos === 0), ocultas);
  let fugiu = null;
  await p.locator("#afty-aba-acoes").focus();
  for (let i = 0; i < 80 && !fugiu; i++) {
    await p.keyboard.press("Tab");
    fugiu = await p.evaluate(() => (document.activeElement?.closest("[data-oculta]") ? document.activeElement.outerHTML.slice(0, 80) : null));
  }
  check("80 Tabs: o foco nunca entra numa aba oculta", !fugiu, fugiu);
  /* O foco dentro da aba que se esconde vai para o botão da aba de destino. */
  await aba(p, "pericias");
  await p.locator('[data-m-aba="pericias"] [role="radio"]').filter({ hasText: "Treinadas" }).focus();
  await p.keyboard.press("1");
  await espera(p, 300);
  check("o foco que estava na aba escondida foi para o botão da aba de destino", await p.evaluate(() => document.activeElement?.id === "afty-aba-acoes"));
  /* Contexto atual na volta: sair de combate e escolher Vantagem em Perícias, depois voltar a Ações. */
  await aba(p, "pericias");
  await p.locator("button.e-combate").click();
  await p.locator('.afty-log-modo[data-afty-modo="vantagem"]').click();
  await espera(p, 300);
  await aba(p, "acoes");
  check("a célula do Golpe lê o combate de agora", (await p.locator('[data-m-celula="golpe"]').textContent()).includes("Fora de Combate"));
  check("o Dano espelha o d20 de agora", (await p.locator("[data-m-d20]").textContent()).includes("Vantagem"));
  const antes = (await sessaoGravada(p, "arsenal")).log.length;
  await rolarDe(p, "dano:armc_modular", "Acerto").click();
  const depois = await sessaoGravada(p, "arsenal");
  check("o callback de agora rola com o modo de agora", depois.log.length === antes + 1 && depois.log[0].modo === "vantagem", { modo: depois.log[0]?.modo });
  check("sem erro de página", etapa.erros.length === 0, etapa.erros);
  await ctx.close();
}

/* ---------- 2. Retenção de tela, Esc e sessão intacta ---------- */
{
  passo("retenção: filtros, seleção e detalhe sobrevivem à troca de aba, Esc fecha só o detalhe, sessão intacta");
  const { ctx, p } = await abre({ ficha: "arsenal", sorte: 0.5 });
  await aba(p, "equipamentos");
  await p.locator('[data-m-linha="equipamento:abas-katana-defensora"] .m-item-corpo').click();
  await aba(p, "pericias");
  await p.locator('[data-m-aba="pericias"] [role="radio"]').filter({ hasText: "Treinadas" }).click();
  await p.locator('[data-m-aba="pericias"] input[type="search"]').fill("i");
  await espera(p, 400);
  const s0 = await sessaoGravada(p, "arsenal");
  await aba(p, "acoes");
  const dano = linha(p, "dano:armc_ampla");
  await dano.locator(".m-linha-nome").click();
  check("o detalhe abriu", (await dano.locator(".m-linha-nome").getAttribute("aria-expanded")) === "true");
  await dano.locator(".m-detalhe input").first().focus();
  await p.keyboard.press("Escape");
  await espera(p, 250);
  check("Esc fecha o detalhe e devolve o foco ao nome da linha", (await dano.locator(".m-linha-nome").getAttribute("aria-expanded")) === "false" && await dano.locator(".m-linha-nome").evaluate((el) => el === document.activeElement));
  await aba(p, "pericias");
  check("Perícias manteve o filtro e a busca", (await p.locator('[data-m-aba="pericias"] [role="radio"][aria-checked="true"]').textContent()).startsWith("Treinadas") && (await p.locator('[data-m-aba="pericias"] input[type="search"]').inputValue()) === "i");
  await aba(p, "equipamentos");
  check("Equipamentos manteve a seleção", (await p.locator('[data-m-linha="equipamento:abas-katana-defensora"]').getAttribute("data-selecionado")) === "sim");
  const s1 = await sessaoGravada(p, "arsenal");
  check("ir e voltar sem agir não mudou a sessão", semCarimbo(s0) === semCarimbo(s1));
  await p.reload(); await p.locator("#afty-ficha").waitFor(); await espera(p, 400);
  await aba(p, "pericias");
  check("recarregar descarta o filtro (Todas, busca vazia)", (await p.locator('[data-m-aba="pericias"] [role="radio"][aria-checked="true"]').textContent()).startsWith("Todas") && (await p.locator('[data-m-aba="pericias"] input[type="search"]').inputValue()) === "");
  await ctx.close();
}

/* ---------- 3. Rascunho de painel reaproveitado (Bloodfeast) ---------- */
{
  passo("rascunho do painel: o contador local do Bloodfeast sobrevive a fechar o corpo e a trocar de aba");
  const { ctx, p } = await abre({ ficha: "mesa" });
  const celula = p.locator('[data-m-celula="bloodfeast"] .m-celula-nome');
  await celula.click();
  const campo = p.locator('[id="m-corpo-bloodfeast"] input[aria-label="Ações"]');
  await campo.fill("3");
  await celula.click();
  check("fechar o corpo esconde o painel", !(await campo.isVisible()));
  await aba(p, "pericias");
  await aba(p, "acoes");
  await celula.click();
  check("o contador continua 3", (await campo.inputValue()) === "3");
  await foto(p, "mesa-bloodfeast-corpo");
  await p.reload(); await p.locator("#afty-ficha").waitFor(); await espera(p, 400);
  await p.locator('[data-m-celula="bloodfeast"] .m-celula-nome').click();
  check("recarregar descarta o rascunho", (await p.locator('[id="m-corpo-bloodfeast"] input[aria-label="Ações"]').inputValue()) === "1");
  await ctx.close();
}

/* ---------- 4. CampoDomo confirma no blur, inclusive trocando de aba ---------- */
{
  passo("CampoDomo: a edição pendente confirma no blur ao trocar de aba");
  const { ctx, p } = await abre({ ficha: "conjurador" });
  const exp = p.locator('[data-m-linha^="dominio:"]').filter({ hasText: "Jardim" });
  await exp.getByRole("button", { name: /^Abrir \d+ PE$/ }).click();
  await espera(p, 300);
  const domo = exp.locator('input[aria-label="PV do domo"]');
  await domo.fill("123");
  await p.locator('[data-afty-aba="pericias"]').click();
  const s = await sessaoGravada(p, "conjurador");
  check("trocar de aba confirmou o domo pelo blur", s.combate.dominioPvDomo === 123, s.combate.dominioPvDomo);
  await aba(p, "acoes");
  check("o campo mostra o valor confirmado", (await domo.inputValue()) === "123");
  await ctx.close();
}

/* ---------- 5. Liberação: seleção retida, resultado do contexto de agora ---------- */
{
  passo("Liberação: a seleção fica, o Feitiço exibido acompanha Ritual e derive");
  const { ctx, p } = await abre({ ficha: "conjurador" });
  const l = p.locator('[data-m-linha^="feitico:"]').filter({ hasText: "Lança de Gelo" });
  const formula = () => l.locator(".m-linha-topo .m-rolar-num").textContent();
  const f0 = await formula();
  await l.locator(".m-linha-nome").click();
  await l.locator('[data-m-bloco="liberacao"] .m-opcao').first().click();
  await espera(p, 250);
  const f1 = await formula();
  check("escolher a melhoria marca a linha", (await l.textContent()).includes("Liberação 1/"), { f0, f1 });
  await aba(p, "buffs");
  await aba(p, "acoes");
  check("a seleção sobrevive à ida aos Efeitos", (await l.textContent()).includes("Liberação 1/") && (await formula()) === f1);
  await l.locator("details summary").filter({ hasText: "Ritual" }).click();
  await l.getByRole("button", { name: "Ativar", exact: true }).click();
  await l.getByRole("button", { name: "Adicionar Aumento de Dano" }).click();
  await espera(p, 300);
  const f2 = await formula();
  check("o Ritual muda o derive e a linha liberada acompanha (seleção mantida)", f2 !== f1 && (await l.textContent()).includes("Liberação 1/"), { f1, f2 });
  check("com o Ritual ativo e não iniciado, a rolagem da linha recusa com o motivo", (await l.locator(".m-linha-topo button.afty-rolavel").getAttribute("aria-disabled")) === "true" && (await l.locator(".m-motivos").textContent()).includes("Ritual"));
  await foto(p, "liberacao-ritual");
  await ctx.close();
}

/* ---------- 6. Favoritos no Rápido (só no G2) ---------- */
{
  passo("favoritos: o Rápido mostra habilidade e equipamento, na ordem salva, sem apagar a chave sem destino");
  const { ctx, p } = await abre({ ficha: "arsenal" });
  const nomes = () => p.locator('[data-m-secao="rapido"] .e-grupo-lista > *').allTextContents();
  const n0 = await nomes();
  check("três favoritos com destino, na ordem salva", n0.length === 3 && n0[0].includes("Ataque Concentrado") && n0[1].includes("Katana") && n0[2].includes("Assumir Postura"), n0.map((x) => x.slice(0, 30)));
  await aba(p, "equipamentos");
  await p.locator('[data-m-linha="equipamento:abas-katana-defensora"] .e-estrela').click();
  await aba(p, "acoes");
  const n1 = await nomes();
  const s = await sessaoGravada(p, "arsenal");
  check("fixar a segunda Katana a põe no fim do Rápido", n1.length === 4 && n1[3].includes("Katana"));
  check("a chave sem destino continua salva", s.favoritos.includes("chave:que-nao-existe") && s.favoritos.at(-1) === "equipamento:abas-katana-defensora", s.favoritos);
  await p.locator('[data-m-secao="rapido"] .m-item .e-estrela').last().click();
  await espera(p, 300);
  check("tirar pela estrela do Rápido remove só ela", (await nomes()).length === 3 && !(await sessaoGravada(p, "arsenal")).favoritos.includes("equipamento:abas-katana-defensora"));
  await ctx.close();
}

/* ---------- 7. Busca global ---------- */
{
  passo("busca global: chega à linha, revela, abre, limpa o filtro que esconderia e não rola dado");
  const { ctx, p } = await abre({ ficha: "conjurador" });
  await aba(p, "pericias");
  await p.locator('[data-m-aba="pericias"] [role="radio"]').filter({ hasText: "Mestre" }).click();
  const n0 = (await sessaoGravada(p, "conjurador")).log.length;
  await aba(p, "acoes");
  await busca(p, "acrobacia", "Acrobacia");
  check("foi para Perícias e limpou o filtro Mestre", (await p.locator('[data-afty-aba="pericias"]').getAttribute("aria-selected")) === "true" && (await p.locator('[data-m-aba="pericias"] [role="radio"][aria-checked="true"]').textContent()).startsWith("Todas"));
  check("a linha está à vista e realçada", (await p.locator('[data-m-linha="pericia:acrobacia"]').getAttribute("data-afty-alvo")) === "sim" && await p.locator('[data-m-linha="pericia:acrobacia"]').isVisible());
  await busca(p, "jardim", "Jardim");
  const exp = p.locator('[data-m-linha^="dominio:"]').filter({ hasText: "Jardim" });
  check("Expansão (destino novo da prévia): Ações com o detalhe aberto", (await exp.locator(".m-linha-nome").getAttribute("aria-expanded")) === "true");
  await busca(p, "forca", "Força");
  check("Atributo (destino novo da prévia): Perícias com a célula realçada", (await p.locator('[id="afty-item-atributo:forca"]').getAttribute("data-afty-alvo")) === "sim");
  await busca(p, "lanca gelo", "Lança de Gelo");
  check("Feitiço: abre o detalhe", (await p.locator('[data-m-linha^="feitico:"]').filter({ hasText: "Lança de Gelo" }).locator(".m-linha-nome").getAttribute("aria-expanded")) === "true");
  check("nenhuma busca rolou dado", (await sessaoGravada(p, "conjurador")).log.length === n0);
  await ctx.close();
}
{
  passo("busca global no inventário: seleciona o item certo entre duas Katanas");
  const { ctx, p } = await abre({ ficha: "arsenal" });
  await aba(p, "equipamentos");
  await p.locator('[data-m-aba="equipamentos"] input[type="search"]').fill("revestimento");
  await busca(p, "defensora", "Katana");
  const sel = await p.locator('[data-m-aba="equipamentos"] [data-selecionado="sim"]').getAttribute("data-m-linha");
  check("a Katana com Defensora ficou selecionada e o filtro saiu", sel === "equipamento:abas-katana-defensora" && (await p.locator('[data-m-aba="equipamentos"] input[type="search"]').inputValue()) === "", sel);
  check("o detalhe lateral mostra o encantamento dela", (await p.locator(".m-inventario-detalhe").textContent()).includes("Defensora"));
  await foto(p, "equipamentos-detalhe-katana");
  await ctx.close();
}

/* ---------- 8. Golpe pela Preparação dos Efeitos (2A) ---------- */
{
  passo("Golpe: primeiro uso, clique duplo, Montar Outro com as mesmas marcas, Voltar, Sacrifício e estorno só do PE");
  const { ctx, p } = await abre({ ficha: "arsenal" });
  const celula = p.locator('[data-m-celula="golpe"]');
  const pe = async () => (await sessaoGravada(p, "arsenal")).peAtual;
  const pv = async () => (await sessaoGravada(p, "arsenal")).hpAtual;
  await celula.getByRole("button", { name: "Montar Golpe" }).click();
  await espera(p, 400);
  const prep = p.locator("[data-preparo-golpe]");
  check("Montar Golpe abre a Preparação no painel, sem gravar", await prep.isVisible());
  /* Marcas com custo de verdade depois de qualquer abatimento (Atroz 1, Letal 2, Penetrante 2, Amplo 2). */
  for (const id of ["atroz", "letal", "penetrante", "amplo"]) await prep.locator(`[data-golpe="${id}"]`).click();
  const custo = Number(await prep.locator("[data-custo-golpe]").getAttribute("data-custo-golpe"));
  check("o golpe montado tem custo a pagar", custo > 0, custo);
  const pe0 = await pe();
  await prep.locator("[data-confirmar]").dblclick();
  await espera(p, 500);
  const pe1 = await pe();
  check("clique duplo no Confirmar cobra uma vez", pe1 === pe0 - custo, { pe0, pe1, custo });
  check("a célula diz as marcas e vira Abrir Golpe", (await celula.textContent()).includes("Atroz") && await celula.getByRole("button", { name: "Abrir Golpe" }).isVisible());
  await celula.getByRole("button", { name: "Abrir Golpe" }).click();
  await espera(p, 400);
  await p.locator("[data-montar-outro-abrir]").first().click();
  await p.locator("[data-voltar-preparo]").first().click();
  await espera(p, 300);
  check("Voltar não cobra nada", (await pe()) === pe1);
  await p.locator("[data-montar-outro-abrir]").first().click();
  const custo2 = Number(await p.locator("[data-custo-golpe]").first().getAttribute("data-custo-golpe"));
  await p.locator("[data-confirmar]").first().click();
  await espera(p, 500);
  const pe2 = await pe();
  check("Montar Outro com as mesmas marcas é um golpe novo, custo inteiro", custo2 === custo && pe2 === pe1 - custo2, { pe1, pe2, custo2 });
  await p.locator("[data-montar-outro-abrir]").first().click();
  await p.locator('[data-golpe="sacrificio"]').first().click();
  const custo3 = Number(await p.locator("[data-custo-golpe]").first().getAttribute("data-custo-golpe"));
  const pv0 = await pv();
  await p.locator("[data-confirmar]").first().click();
  await espera(p, 500);
  const pe3 = await pe();
  const pv1 = await pv();
  check("Sacrifício: paga o PE e sofre 15 de dano", custo3 > 0 && pe3 === pe2 - custo3 && pv1 === pv0 - 15, { pe2, pe3, custo3, pv0, pv1 });
  await p.getByRole("button", { name: "Mais opções da ficha" }).click();
  await p.locator("[data-menu-historico]").click();
  await espera(p, 400);
  await foto(p, "golpe-historico-aberto");
  etapa.medidas.historico = await p.locator("[data-estornar]").allTextContents();
  console.log("  estornos:", JSON.stringify(etapa.medidas.historico));
  await p.locator("[data-estornar]").filter({ hasText: "Estornar PE" }).first().click();
  await espera(p, 500);
  const s = await sessaoGravada(p, "arsenal");
  check("o estorno devolve só o PE do último golpe: Vida e marcas ficam", s.peAtual === pe3 + custo3 && s.hpAtual === pv1 && (await celula.textContent()).includes("Atroz"), { pe: s.peAtual, hp: s.hpAtual });
  await foto(p, "golpe-historico");
  check("sem erro de página", etapa.erros.length === 0, etapa.erros);
  await ctx.close();
}

/* ---------- 9. Golpe recusado: PE curto e fora de combate ---------- */
{
  passo("Golpe recusado: Faltam N PE e Pede Em Combate, Confirmar desligado, nada cobrado");
  const semente = dados.sessoes[dados.fichas.arsenal.id];
  const { ctx, p } = await abre({ ficha: "arsenal", sessao: { ...semente, peAtual: 1 } });
  const celula = p.locator('[data-m-celula="golpe"]');
  const antes = await sessaoGravada(p, "arsenal");
  check("partida: Em Combate com 1 PE", antes.peAtual === 1 && (await p.locator("button.e-combate").getAttribute("aria-pressed")) === "true", { pe: antes.peAtual });
  await celula.getByRole("button", { name: "Montar Golpe" }).click();
  await espera(p, 400);
  const prep = p.locator("[data-preparo-golpe]");
  for (const id of ["atroz", "letal", "penetrante", "amplo"]) await prep.locator(`[data-golpe="${id}"]`).click();
  const custo = Number(await prep.locator("[data-custo-golpe]").getAttribute("data-custo-golpe"));
  const avisos = await prep.locator("[data-bloqueio]").allTextContents();
  check("o bloqueio diz quanto falta", custo > 1 && avisos.some((t) => t.includes(`Faltam ${custo - 1} PE`)), { custo, avisos });
  check("Confirmar desligado", await prep.locator("[data-confirmar]").isDisabled());
  await foto(p, "golpe-recusado-pe");
  await p.locator("button.e-combate").click();
  await espera(p, 400);
  const avisos2 = await prep.locator("[data-bloqueio]").allTextContents();
  check("fora de combate o bloqueio diz Pede Em Combate", avisos2.some((t) => t.includes("Pede Em Combate")), avisos2);
  check("a célula diz Fora de Combate", (await celula.textContent()).includes("Fora de Combate"));
  const depois = await sessaoGravada(p, "arsenal");
  check("nada cobrado e nenhuma marca aplicada", depois.peAtual === 1 && (depois.log?.length ?? 0) === (antes.log?.length ?? 0) && !(await celula.textContent()).includes("Atroz"), { pe: depois.peAtual });
  check("sem erro de página", etapa.erros.length === 0, etapa.erros);
  await ctx.close();
}
await encerra("interacao-abas");
