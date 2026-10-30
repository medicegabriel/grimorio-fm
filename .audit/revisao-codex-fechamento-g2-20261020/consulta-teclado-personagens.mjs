/* O que o prompt pede além das cinco rotinas: a consulta modal que cobre o catálogo (fechar e voltar ao rascunho), o teclado, a troca de personagem e o
   histórico. Chrome real, contexto isolado, cliques sem `force`. */
import { fichas, sessoes, contexto, abre, passo, check, foto, espera, aosAtivos, adicionar, externa, emCombate, sessao, texto, virada, encerra } from "./lib.mjs";

const campo = (p, nome) => p.locator(`[data-campo="${nome}"]`);
const buffs = async (p, id) => (await sessao(p, id))?.buffs ?? [];
const voltarParaLista = async (p) => { await p.getByRole("button", { name: "Voltar", exact: true }).first().click(); await p.locator("[data-ficha-lista], .fm-lista, body").first().waitFor(); await espera(p, 400); };
const abreConsultaDaFicha = async (p) => {
  await p.locator('.m-seg-op', { hasText: "Da Ficha" }).first().click(); await espera(p, 300);
  await p.locator('[data-cat="especializacao"]').click(); await espera(p, 300);
  await p.locator(".k-fila .k-item").first().click(); await espera(p, 300);
  await p.locator("[data-regra-opcao]").first().click(); await espera(p, 500);
};

/* ---------- G.1: a consulta modal sobre o rascunho da Imitação ---------- */
{
  passo("G Consulta sobre o rascunho da Imitação (ima)");
  const f = fichas.ima;
  const { ctx, p } = await contexto({ lista: [f], largura: 1440, sessoesIniciais: sessoes });
  await abre(p, "player", f.name);
  await emCombate(p);
  await adicionar(p); await p.locator("[data-aba-imitacao]").click(); await espera(p, 300);
  await p.locator('[data-chave-copia="cmb_postura_da_lua"] .k-item').click(); await espera(p, 200);
  await abreConsultaDaFicha(p);
  check("G1 a consulta abre cobrindo o catálogo", (await p.locator("#afty-ficha .e-consulta").count()) === 1);
  await foto(p, "G-consulta");
  await p.locator('[aria-label="Fechar a consulta e voltar à lista"]').click(); await espera(p, 400);
  check("G1 fechar a consulta volta ao catálogo", (await p.locator("#afty-ficha .e-consulta").count()) === 0 && (await p.locator("[data-catalogo]").count()) === 1);
  await p.locator("[data-aba-imitacao]").click(); await espera(p, 300);
  check("G1 o candidato aberto continua selecionado (rascunho)", (await p.locator('[data-detalhe-imitacao="cmb_postura_da_lua"]').count()) === 1);
  await p.locator("[data-confirmar-copia]").click(); await espera(p, 500);
  check("G1 Confirmar depois da consulta recebe o ponteiro e copia", (await p.locator("[data-copia-atual]").getAttribute("data-copia-atual")) === "cmb_postura_da_lua");
  await ctx.close();
}

/* ---------- G.2: a consulta modal sobre o rascunho do Buff de Mesa ---------- */
{
  passo("G Consulta sobre o rascunho do Buff de Mesa (mestre)");
  const f = fichas.mestre;
  const { ctx, p } = await contexto({ lista: [f], largura: 1440, sessoesIniciais: sessoes });
  await abre(p, "player", f.name);
  await adicionar(p); await externa(p);
  await p.locator("[data-abrir-buff-mesa]").click(); await espera(p, 300);
  await campo(p, "buff-nome").fill("Rascunho"); await campo(p, "buff-expr").fill("3"); await campo(p, "buff-rodadas").fill("4");
  await abreConsultaDaFicha(p);
  check("G2 a consulta abre", (await p.locator("#afty-ficha .e-consulta").count()) === 1);
  await p.keyboard.press("Escape"); await espera(p, 400);
  check("G2 Esc fecha só a consulta, e o catálogo continua", (await p.locator("#afty-ficha .e-consulta").count()) === 0 && (await p.locator("[data-catalogo]").count()) === 1);
  await externa(p);
  await p.locator("[data-abrir-buff-mesa]").click(); await espera(p, 300);
  check("G2 o rascunho do buff sobreviveu à consulta", (await campo(p, "buff-nome").inputValue()) === "Rascunho" && (await campo(p, "buff-expr").inputValue()) === "3" && (await campo(p, "buff-rodadas").inputValue()) === "4");
  check("G2 nada foi criado enquanto era rascunho", !(await buffs(p, f.id)).some((b) => b.nome === "Rascunho"));
  /* Esc fecha o catálogo e o rascunho continua guardado na tela */
  await p.locator("#afty-ficha input[data-campo='buff-nome']").press("Escape"); await espera(p, 400);
  check("G2 Esc no formulário fecha o catálogo", (await p.locator("[data-catalogo]").count()) === 0);
  await adicionar(p); await externa(p); await p.locator("[data-abrir-buff-mesa]").click(); await espera(p, 300);
  check("G2 reabrir o catálogo reencontra o rascunho", (await campo(p, "buff-nome").inputValue()) === "Rascunho");
  /* Enter cria */
  await campo(p, "buff-expr").press("Enter"); await espera(p, 500);
  const criado = (await buffs(p, f.id)).filter((b) => b.nome === "Rascunho");
  check("G2 Enter no campo cria o buff, uma vez", criado.length === 1 && criado[0].rodadas === 4 && criado[0].expr === "3", criado);
  await ctx.close();
}

/* ---------- G.3: o teclado na Imitação ---------- */
{
  passo("G Teclado na Imitação (ima)");
  const f = fichas.ima;
  const { ctx, p } = await contexto({ lista: [f], largura: 1440, sessoesIniciais: sessoes });
  await abre(p, "player", f.name);
  await emCombate(p);
  await adicionar(p); await p.locator("[data-aba-imitacao]").click(); await espera(p, 300);
  const row = p.locator('[data-chave-copia="cmb_postura_do_sol"] .k-item');
  await row.focus(); await p.keyboard.press("Enter"); await espera(p, 250);
  check("G3 Enter na linha abre o detalhe sem copiar", (await p.locator('[data-detalhe-imitacao="cmb_postura_do_sol"]').count()) === 1 && (await p.locator("[data-copia-atual]").getAttribute("data-copia-atual")) === "");
  await p.keyboard.press("Escape"); await espera(p, 250);
  check("G3 Esc fecha o detalhe e deixa o catálogo", (await p.locator("[data-detalhe-imitacao]").count()) === 0 && (await p.locator("[data-imitacao]").count()) === 1);
  await row.focus(); await p.keyboard.press("Enter"); await espera(p, 250);
  const conf = p.locator("[data-confirmar-copia]");
  await conf.focus(); await p.keyboard.press("Enter"); await espera(p, 500);
  check("G3 Enter no Confirmar copia", (await p.locator("[data-copia-atual]").getAttribute("data-copia-atual")) === "cmb_postura_do_sol");
  /* Aprender por teclado: o Enter no campo */
  await p.locator("[data-resultado-percepcao]").fill("10"); await p.keyboard.press("Enter"); await espera(p, 400);
  check("G3 Enter no resultado tenta aprender (falha e baixa a CD)", /Falhou/.test(await texto(p.locator("[data-aviso-imitacao]"))) && /CD 33/.test(await texto(p.locator("[data-cd-copia]"))));
  await p.keyboard.press("Escape"); await espera(p, 300);
  check("G3 Esc sem detalhe fecha o catálogo", (await p.locator("[data-catalogo]").count()) === 0);
  await ctx.close();
}

/* ---------- G.4: trocar de personagem: cada sessão no seu lugar ---------- */
{
  passo("G Troca de personagem (invocador, sangrador, ima)");
  const lista = [fichas.invocador, fichas.sangrador, fichas.ima];
  const { ctx, p } = await contexto({ lista, largura: 1440, sessoesIniciais: sessoes });
  /* Invocador: um buff de mesa e mais um nível de Exaustão (já tem 3) */
  await abre(p, "player", fichas.invocador.name);
  await adicionar(p); await externa(p); await p.locator("[data-abrir-buff-mesa]").click(); await espera(p, 300);
  await campo(p, "buff-nome").fill("Só do Invocador"); await campo(p, "buff-expr").fill("1");
  await p.locator("[data-criar-buff]").click(); await espera(p, 400);
  await aosAtivos(p);
  await p.locator('[data-acesso-exaustao="completa"]').click(); await p.locator("[data-exaustao-mais]").click(); await espera(p, 400);
  await p.keyboard.press("Escape");
  await sessao(p, fichas.invocador.id);
  /* Sangrador: abrir sem herdar nada */
  await abre(p, "player", fichas.sangrador.name);
  await aosAtivos(p);
  check("G4 o outro personagem não herda o buff nem a Exaustão", (await p.locator('[data-chave-ativo^="buff:"]').count()) === 0 && (await p.locator("[data-exaustao-nivel]").count()) === 0 && !(await buffs(p, fichas.sangrador.id)).some((b) => b.nome === "Só do Invocador"));
  await p.locator('[data-acesso-exaustao="completa"]').click(); await p.locator("[data-exaustao-mais]").click(); await espera(p, 300);
  await p.keyboard.press("Escape");
  const exSangrador = (await sessao(p, fichas.sangrador.id)).exaustao;
  /* Imitação do terceiro */
  await abre(p, "player", fichas.ima.name);
  await emCombate(p);
  await adicionar(p); await p.locator("[data-aba-imitacao]").click(); await espera(p, 300);
  await p.locator('[data-chave-copia="cmb_postura_do_sol"] .k-item').click(); await p.locator("[data-confirmar-copia]").click(); await espera(p, 500);
  await sessao(p, fichas.ima.id);
  /* Voltar a cada um: o que era de cada um continua */
  await abre(p, "player", fichas.invocador.name); await aosAtivos(p);
  check("G4 o invocador mantém o buff e a Exaustão 4", (await buffs(p, fichas.invocador.id)).some((b) => b.nome === "Só do Invocador") && (await p.locator("[data-exaustao-nivel]").textContent()).trim() === "4");
  await abre(p, "player", fichas.sangrador.name); await aosAtivos(p);
  check("G4 o sangrador mantém só a própria Exaustão", (await sessao(p, fichas.sangrador.id)).exaustao === exSangrador && exSangrador === 1);
  await abre(p, "player", fichas.ima.name);
  await adicionar(p); await p.locator("[data-aba-imitacao]").click(); await espera(p, 300);
  check("G4 a cópia da Imitação continua só na ficha dela", (await p.locator("[data-copia-atual]").getAttribute("data-copia-atual")) === "cmb_postura_do_sol");
  await abre(p, "player", fichas.invocador.name); await adicionar(p);
  check("G4 o invocador não tem a aba Imitação nem a cópia dela", (await p.locator("[data-aba-imitacao]").count()) === 0);
  await ctx.close();
}
await encerra();
