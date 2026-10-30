/* FRENTE A: a Imitação operada inteira pelo G2 (Adicionar > Imitação), Chrome real, contexto isolado, cliques sem `force`. */
import { fichas, sessoes, contexto, abre, passo, check, foto, espera, adicionar, emCombate, sessao, texto, encerra } from "./lib.mjs";

/* O número de cada valor do cabeçalho, sem o rótulo (a clássica escreve "Movimento" onde o G2 escreve "Mov."). */
const stats = (p) => p.evaluate(() => Object.fromEntries([...document.querySelectorAll("[data-afty-stat]")].map((e) => [e.getAttribute("data-afty-stat"), e.textContent.replace(/\s+/g, " ").trim().replace(/^[^\d+\-−]*/, "")])));
const imitacaoSessao = async (p, id) => (await sessao(p, id))?.combate?.imitacao ?? null;
const meterPE = (p) => texto(p.locator('.e-recursos .m-medidor[data-recurso="pe"]'));
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const abreImitacao = async (p) => { await adicionar(p); await p.locator("[data-aba-imitacao]").click(); await espera(p, 300); };
const linha = (p, id) => p.locator(`[data-chave-copia="${id}"] .k-item`).first();
const tipo = async (p, t) => { await p.locator(`[data-tipo-copia="${t}"]`).click(); await espera(p, 250); };
const resultado = async (p, v) => { const c = p.locator("[data-resultado-percepcao]"); await c.fill(String(v)); await p.locator("[data-tentar-aprender]").click(); await espera(p, 400); };

/* ---------- A.1 a A.11: a Imitação comum ---------- */
{
  passo("A Imitação comum (ima)");
  const f = fichas.ima;
  const { ctx, p } = await contexto({ lista: [f], largura: 1440, sessoesIniciais: sessoes });
  await abre(p, "player", f.name);
  await abreImitacao(p);
  check("A1 aba visível e título", (await p.locator("[data-aba-imitacao]").count()) === 1 && /Imitação/.test(await texto(p.locator("h2.x-titulo"))));
  check("A1 tipos da comum (3 + Aprendidas)", (await p.locator("[data-tipo-copia]").count()) === 4, await p.locator("[data-tipo-copia]").evaluateAll((l) => l.map((e) => e.getAttribute("data-tipo-copia"))));
  /* Fora de combate */
  check("A2 sem cópia e pede Em Combate", (await p.locator("[data-sem-copia]").count()) === 1 && /Pede Em Combate/.test(await texto(p.locator("[data-imitacao] .im-atual"))));
  await linha(p, "cmb_postura_do_sol").click(); await espera(p, 200);
  check("A2 selecionar abre só o detalhe", (await p.locator('[data-detalhe-imitacao="cmb_postura_do_sol"]').count()) === 1);
  check("A2 confirmar bloqueado fora de combate", await p.locator("[data-confirmar-copia]").isDisabled());
  check("A2 o bloqueio diz o motivo", /Pede Em Combate/.test(await texto(p.locator("[data-bloqueio-copia]"))));
  check("A2 nada gravou na cópia", (await imitacaoSessao(p, f.id))?.copia == null);
  await foto(p, "A-fora-de-combate");
  await p.locator("[data-cancelar-copia]").click(); await espera(p, 200);
  check("A2 cancelar fecha o detalhe", (await p.locator("[data-detalhe-imitacao]").count()) === 0);

  /* Em combate: selecionar não troca, confirmar troca */
  await emCombate(p);
  const peAntes = await meterPE(p);
  await linha(p, "cmb_postura_do_sol").click(); await espera(p, 200);
  check("A3 selecionar em combate NÃO troca a cópia", (await imitacaoSessao(p, f.id))?.copia == null && (await p.locator("[data-copia-atual]").getAttribute("data-copia-atual")) === "");
  check("A3 confirmar liberado", !(await p.locator("[data-confirmar-copia]").isDisabled()));
  await foto(p, "A-detalhe-da-postura");
  await p.locator("[data-confirmar-copia]").click(); await espera(p, 500);
  const s1 = await imitacaoSessao(p, f.id);
  check("A3 confirmar troca a cópia (sessão)", s1?.copia?.id === "cmb_postura_do_sol" && s1?.copia?.tipo === "postura", s1?.copia);
  check("A3 a tela mostra o nome e a origem", (await texto(p.locator("[data-nome-copia]"))) === "Postura do Sol" && /Vista no Combate/.test(await texto(p.locator("[data-origem-copia]"))));
  check("A3 a cópia sai da lista de candidatas (o motor já a conta como possuída)", (await p.locator('[data-chave-copia="cmb_postura_do_sol"]').count()) === 0);
  check("A3 sem cobrança de PE", (await meterPE(p)) === peAntes, { antes: peAntes, depois: await meterPE(p) });
  await foto(p, "A-copiando-sol");

  /* Cancelar mantém tudo igual */
  const antesCancelar = (await sessao(p, f.id)).combate;
  await linha(p, "cmb_postura_da_lua").click(); await espera(p, 200);
  await p.locator("[data-cancelar-copia]").click(); await espera(p, 200);
  const depoisCancelar = (await sessao(p, f.id)).combate;
  check("A4 cancelar deixa a sessão igual", igual(antesCancelar, depoisCancelar));
  check("A4 a cópia segue a mesma", (await texto(p.locator("[data-nome-copia]"))) === "Postura do Sol");

  /* Trocar por outra confirma de novo */
  await linha(p, "cmb_postura_da_lua").click(); await espera(p, 200);
  await p.locator("[data-confirmar-copia]").click(); await espera(p, 500);
  check("A5 trocar substitui a cópia", (await imitacaoSessao(p, f.id))?.copia?.id === "cmb_postura_da_lua" && (await texto(p.locator("[data-nome-copia]"))) === "Postura da Lua");
  check("A5 a anterior volta para a lista e a nova sai", (await p.locator('[data-chave-copia="cmb_postura_do_sol"]').count()) === 1 && (await p.locator('[data-chave-copia="cmb_postura_da_lua"]').count()) === 0);

  /* Habilidade ativa pede a confirmação do tipo */
  await tipo(p, "ativa");
  await p.locator("[data-busca-copia]").fill("Aparar Ataque"); await espera(p, 300);
  check("A6 a busca filtra", (await p.locator('[data-chave-copia="lut_aparar_ataque"]').count()) === 1 && (await p.locator("[data-chave-copia]").count()) < 10);
  await linha(p, "lut_aparar_ataque").click(); await espera(p, 200);
  check("A6 ativa pede a confirmação (caixa) e bloqueia", (await p.locator("[data-elegivel]").count()) === 1 && (await p.locator("[data-confirmar-copia]").isDisabled()));
  await p.locator("[data-elegivel]").check(); await espera(p, 200);
  check("A6 marcada a confirmação, libera", !(await p.locator("[data-confirmar-copia]").isDisabled()));
  await p.locator("[data-confirmar-copia]").click(); await espera(p, 500);
  const s6 = await imitacaoSessao(p, f.id);
  check("A6 a ativa vira a cópia", s6?.copia?.id === "lut_aparar_ataque" && s6?.copia?.tipo === "ativa", s6?.copia);
  check("A6 o detalhe fecha ao confirmar", (await p.locator("[data-detalhe-imitacao]").count()) === 0);

  /* Aprender */
  check("A7 CD inicial 35", /CD 35/.test(await texto(p.locator("[data-cd-copia]"))));
  check("A7 sem número o botão fica travado", await p.locator("[data-tentar-aprender]").isDisabled());
  await resultado(p, 10);
  check("A7 resultado baixo falha e baixa a CD em 2", /Falhou/.test(await texto(p.locator("[data-aviso-imitacao]"))) && /CD 33/.test(await texto(p.locator("[data-cd-copia]"))));
  check("A7 falha não aprende", ((await imitacaoSessao(p, f.id))?.aprendidas ?? []).length === 0);
  await resultado(p, 99);
  const s7 = await imitacaoSessao(p, f.id);
  check("A7 resultado alto aprende", /Aprendida/.test(await texto(p.locator("[data-aviso-imitacao]"))) && (s7?.aprendidas ?? []).some((a) => a.id === "lut_aparar_ataque"), s7?.aprendidas);
  check("A7 o contador de Aprendidas sobe", /1/.test(await texto(p.locator('[data-tipo-copia="aprendidas"] small'))));
  await foto(p, "A-aprendida");

  /* Encerrar, reutilizar, esquecer */
  await p.locator("[data-encerrar-copia]").click(); await espera(p, 400);
  check("A8 encerrar tira a cópia e guarda a aprendida", (await p.locator("[data-sem-copia]").count()) === 1 && ((await imitacaoSessao(p, f.id))?.aprendidas ?? []).length === 1 && (await imitacaoSessao(p, f.id))?.copia == null);
  await tipo(p, "aprendidas");
  await linha(p, "lut_aparar_ataque").click(); await espera(p, 200);
  check("A8 a aprendida abre com Esquecer e sem pedir confirmação de tipo", (await p.locator("[data-esquecer-copia]").count()) === 1 && (await p.locator("[data-elegivel]").count()) === 0 && !(await p.locator("[data-confirmar-copia]").isDisabled()));
  await p.locator("[data-confirmar-copia]").click(); await espera(p, 500);
  check("A8 reutilizar copia a aprendida sem novo teste", (await texto(p.locator("[data-nome-copia]"))) === "Aparar Ataque" && /Aprendida/.test(await texto(p.locator("[data-origem-copia]"))));

  /* Persistência: a Ficha grava por debounce, e a leitura espera ela assentar antes de recarregar. */
  await sessao(p, f.id);
  await abre(p, "player", f.name); await abreImitacao(p);
  check("A9 depois de recarregar a cópia continua", (await texto(p.locator("[data-nome-copia]"))) === "Aparar Ataque", await texto(p.locator("[data-imitacao] .im-atual")));
  /* Esquecer */
  await tipo(p, "aprendidas");
  await linha(p, "lut_aparar_ataque").click(); await espera(p, 200);
  await p.locator("[data-esquecer-copia]").click(); await espera(p, 500);
  check("A10 esquecer tira só a aprendida", ((await imitacaoSessao(p, f.id))?.aprendidas ?? []).length === 0 && (await p.locator("[data-detalhe-imitacao]").count()) === 0);

  /* Igualdade com a clássica: os números do G2 e da clássica, sobre a mesma sessão */
  const g2 = await stats(p);
  await abre(p, "player", f.name, false);
  const classica = await stats(p);
  check("A11 os números do G2 e da clássica são iguais", igual(g2, classica), { g2, classica });
  await ctx.close();
}

/* ---------- A.12: as escolhas da cópia ---------- */
{
  passo("A Escolhas da cópia (ima)");
  const f = fichas.ima;
  const { ctx, p } = await contexto({ lista: [f], largura: 1440, sessoesIniciais: sessoes });
  await abre(p, "player", f.name);
  await emCombate(p);
  await abreImitacao(p);
  await tipo(p, "ativa");
  await p.locator("[data-busca-copia]").fill("Corpo Supremo"); await espera(p, 300);
  await linha(p, "lut_corpo_supremo").click(); await espera(p, 200);
  await p.locator("[data-elegivel]").check();
  await p.locator("[data-confirmar-copia]").click(); await espera(p, 500);
  const botoes = p.locator("[data-escolha-copia]");
  const n = await botoes.count();
  const limite = Number((/de (\d+)/.exec(await texto(p.locator("[data-escolhas-limite]"))) ?? [])[1]);
  check("A12 as escolhas da cópia aparecem", n > 1 && limite >= 1, { n, limite });
  let marcadas = 0;
  for (let i = 0; i < Math.min(n, limite + 2); i++) { await botoes.nth(i).click(); await espera(p, 120); marcadas = await p.locator('[data-escolha-copia][aria-pressed="true"]').count(); }
  check("A12 as escolhas respeitam o limite do motor", marcadas === limite, { marcadas, limite });
  const sessaoEsc = await imitacaoSessao(p, f.id);
  check("A12 a sessão guarda no máximo o limite", (sessaoEsc?.copia?.escolhas ?? []).length === limite, sessaoEsc?.copia);
  const primeira = botoes.nth(0);
  if ((await primeira.getAttribute("aria-pressed")) === "true") { await primeira.click(); await espera(p, 200); }
  check("A12 desligar uma libera a vaga", (await p.locator('[data-escolha-copia][aria-pressed="true"]').count()) === limite - 1);
  await foto(p, "A-escolhas");
  await ctx.close();
}

/* ---------- A.13: a Imitação Perfeita ---------- */
{
  passo("A Imitação Perfeita (perfeita)");
  const f = fichas.perfeita;
  const { ctx, p } = await contexto({ lista: [f], largura: 1440, sessoesIniciais: sessoes });
  await abre(p, "player", f.name);
  await emCombate(p);
  await abreImitacao(p);
  check("A13 título da Perfeita", /Imitação Perfeita/.test(await texto(p.locator("h2.x-titulo"))));
  check("A13 cinco tipos mais Aprendidas", (await p.locator("[data-tipo-copia]").count()) === 6, await p.locator("[data-tipo-copia]").evaluateAll((l) => l.map((e) => e.getAttribute("data-tipo-copia"))));
  await tipo(p, "estilo");
  const primeiroEstilo = await p.locator("[data-chave-copia]").first().getAttribute("data-chave-copia");
  await linha(p, primeiroEstilo).click(); await espera(p, 200);
  check("A13 estilo não pede a confirmação de tipo", (await p.locator("[data-elegivel]").count()) === 0 && !(await p.locator("[data-confirmar-copia]").isDisabled()));
  await p.locator("[data-confirmar-copia]").click(); await espera(p, 500);
  check("A13 CD do estilo é 40", /CD 40/.test(await texto(p.locator("[data-cd-copia]"))), await texto(p.locator("[data-cd-copia]")));
  await resultado(p, 99);
  check("A13 aprende o estilo", ((await imitacaoSessao(p, f.id))?.aprendidas ?? []).length === 1);
  await tipo(p, "passiva");
  await p.locator("[data-busca-copia]").fill("Aparar Ataque"); await espera(p, 300);
  await linha(p, "lut_aparar_ataque").click(); await espera(p, 200);
  check("A13 passiva pede a confirmação do tipo", (await p.locator("[data-elegivel]").count()) === 1 && (await p.locator("[data-confirmar-copia]").isDisabled()));
  await p.locator("[data-elegivel]").check();
  await p.locator("[data-confirmar-copia]").click(); await espera(p, 500);
  check("A13 CD da passiva é 40", /CD 40/.test(await texto(p.locator("[data-cd-copia]"))));
  await resultado(p, 99);
  const sp = await imitacaoSessao(p, f.id);
  check("A13 a memorização cabe mais de uma aprendida (tipos diferentes)", (sp?.aprendidas ?? []).length === 2, sp?.aprendidas?.map((a) => a.id));
  await foto(p, "A-perfeita");
  await ctx.close();
}

/* ---------- A.14: quem não tem Imitação não vê a aba ---------- */
{
  passo("A Sem Imitação (mestre)");
  const f = fichas.mestre;
  const { ctx, p } = await contexto({ lista: [f], largura: 1440, sessoesIniciais: sessoes });
  await abre(p, "player", f.name);
  await adicionar(p);
  check("A14 a aba some para quem não imita", (await p.locator("[data-aba-imitacao]").count()) === 0);
  await ctx.close();
}
await encerra();
