/* FRENTES C e D: a Exaustão desde zero e a perda de Vida do Sangramento, operadas só pelo G2 (completa e compacta), Chrome real, contexto isolado. */
import { fichas, sessoes, contexto, abre, passo, check, foto, espera, aosAtivos, adicionar, externa, sessao, sessaoCrua, texto, virada, encerra } from "./lib.mjs";

const stats = (p) => p.evaluate(() => Object.fromEntries([...document.querySelectorAll("[data-afty-stat]")].map((e) => [e.getAttribute("data-afty-stat"), e.textContent.replace(/\s+/g, " ").trim().replace(/^[^\d+\-−]*/, "")])));
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const abreCompacta = async (p) => {
  await p.locator('[data-afty-aba="habilidades"]').click();
  if (!(await p.locator("[data-c2]").isVisible().catch(() => false))) await p.locator("button.f-acesso").click();
  await p.locator("[data-c2]").waitFor();
  await espera(p, 300);
};
const exaustaoSessao = async (p, id) => (await sessao(p, id))?.exaustao ?? 0;
const cartaoExaustao = (p) => p.locator('[data-chave-ativo="exaustao"], [data-c2] [data-chave-ativo="exaustao"]');

/* ---------- C: a Exaustão desde zero, na completa ---------- */
{
  passo("C Exaustão desde zero (sangrador, completa)");
  const f = fichas.sangrador;
  const { ctx, p } = await contexto({ lista: [f], largura: 1440, sessoesIniciais: sessoes });
  await abre(p, "player", f.name);
  await aosAtivos(p);
  const acesso = p.locator('[data-acesso-exaustao="completa"]');
  check("C1 o acesso discreto existe nos Ativos", (await acesso.count()) === 1);
  check("C1 sem nível não há cartão vazio nem selo", (await p.locator('[data-chave-ativo="exaustao"]').count()) === 0 && (await p.locator("[data-exaustao-nivel]").count()) === 0);
  const antes = await sessaoCrua(p, f.id);
  await acesso.click(); await espera(p, 300);
  check("C2 o painel abre com nível 0", (await p.locator("[data-painel-exaustao]").count()) === 1 && (await p.locator("[data-exaustao-valor]").getAttribute("data-exaustao-valor")) === "0");
  check("C2 menos e Zerar travados em zero", (await p.locator("[data-exaustao-menos]").isDisabled()) && (await p.locator("[data-exaustao-zerar]").isDisabled()));
  await foto(p, "C-painel-aberto");
  check("C2 abrir o controle não muda o contador nem a sessão", (await exaustaoSessao(p, f.id)) === 0 && (await p.locator('[data-chave-ativo="exaustao"]').count()) === 0 && igual((await sessaoCrua(p, f.id))?.exaustao ?? 0, antes?.exaustao ?? 0));
  await p.locator("[data-exaustao-mais]").click(); await espera(p, 250);
  check("C3 mais 1 cria o nível 1, o selo e o cartão", (await p.locator("[data-exaustao-valor]").getAttribute("data-exaustao-valor")) === "1" && (await texto(p.locator("[data-exaustao-nivel]"))) === "1" && (await p.locator('[data-chave-ativo="exaustao"]').count()) === 1);
  await p.locator("[data-exaustao-mais]").click(); await p.locator("[data-exaustao-mais]").click(); await espera(p, 250);
  check("C3 mais duas vezes dá 3 (inteiro, sem teto de 1 em 1)", (await exaustaoSessao(p, f.id)) === 3);
  await p.locator("[data-exaustao-menos]").click(); await espera(p, 250);
  check("C4 menos 1 dá 2", (await exaustaoSessao(p, f.id)) === 2 && (await texto(p.locator("[data-exaustao-nivel]"))) === "2");
  await foto(p, "C-nivel-2");
  await p.locator("[data-exaustao-zerar]").click(); await espera(p, 300);
  check("C4 Zerar volta a zero e o cartão some", (await exaustaoSessao(p, f.id)) === 0 && (await p.locator('[data-chave-ativo="exaustao"]').count()) === 0 && (await p.locator("[data-exaustao-nivel]").count()) === 0);
  check("C4 em zero o menos fica travado de novo (nunca negativo)", await p.locator("[data-exaustao-menos]").isDisabled());
  /* O cartão e o painel falam do mesmo contador */
  await p.locator("[data-exaustao-mais]").click(); await p.locator("[data-exaustao-mais]").click(); await espera(p, 250);
  await p.keyboard.press("Escape"); await espera(p, 250);
  check("C5 Esc fecha o painel sem mudar o nível", (await p.locator("[data-painel-exaustao]").count()) === 0 && (await exaustaoSessao(p, f.id)) === 2);
  await p.locator('[data-chave-ativo="exaustao"]').click(); await espera(p, 300);
  await p.locator('[aria-label="Exaustão mais 1"]').click(); await espera(p, 300);
  check("C5 o ajuste do cartão soma ao mesmo contador", (await exaustaoSessao(p, f.id)) === 3);
  await p.locator('[data-encerrar="exaustao"]').click(); await espera(p, 400);
  check("C5 Zerar do cartão zera o mesmo contador", (await exaustaoSessao(p, f.id)) === 0 && (await p.locator('[data-chave-ativo="exaustao"]').count()) === 0);
  /* Persistência e igualdade */
  await acesso.click(); await p.locator("[data-exaustao-mais]").click(); await p.locator("[data-exaustao-mais]").click(); await p.locator("[data-exaustao-mais]").click(); await espera(p, 300);
  await sessao(p, f.id);
  const g2 = await stats(p);
  await abre(p, "player", f.name); await aosAtivos(p);
  check("C6 recarregar mantém o nível 3, o selo e o cartão", (await texto(p.locator("[data-exaustao-nivel]"))) === "3" && (await p.locator('[data-chave-ativo="exaustao"]').count()) === 1);
  await abre(p, "player", f.name, false);
  const classica = await stats(p);
  check("C6 os números do G2 e da clássica são iguais com Exaustão 3", igual(g2, classica), { g2, classica });
  await ctx.close();
}

/* ---------- C: a Exaustão na compacta ---------- */
{
  passo("C Exaustão desde zero (sangrador, compacta)");
  const f = fichas.sangrador;
  const { ctx, p } = await contexto({ lista: [f], largura: 1440, sessoesIniciais: sessoes });
  await abre(p, "player", f.name);
  await abreCompacta(p);
  const acesso = p.locator('[data-acesso-exaustao="compacta"]');
  check("C7 o acesso existe na compacta", (await acesso.count()) === 1);
  check("C7 sem nível não há cartão", (await p.locator('[data-c2] [data-chave-ativo="exaustao"]').count()) === 0);
  await acesso.click(); await espera(p, 300);
  check("C7 abrir na compacta não muda o contador", (await exaustaoSessao(p, f.id)) === 0 && (await p.locator("[data-exaustao-valor]").getAttribute("data-exaustao-valor")) === "0");
  await p.locator("[data-exaustao-mais]").click(); await p.locator("[data-exaustao-mais]").click(); await espera(p, 300);
  check("C8 mais na compacta chega a 2 e o cartão aparece", (await exaustaoSessao(p, f.id)) === 2 && (await p.locator('[data-c2] [data-chave-ativo="exaustao"]').count()) === 1);
  await foto(p, "C-compacta");
  await p.locator("[data-exaustao-zerar]").click(); await espera(p, 300);
  check("C8 Zerar na compacta tira o cartão", (await exaustaoSessao(p, f.id)) === 0 && (await p.locator('[data-c2] [data-chave-ativo="exaustao"]').count()) === 0);
  await ctx.close();
}

/* ---------- D: o Sangramento, na completa ---------- */
const FAIXAS = [["cond_1", "2d6", 2, 6], ["cond_2", "3d8", 3, 8], ["cond_3", "4d10", 4, 10], ["cond_4", "6d10", 6, 10]];
{
  passo("D Sangramento (sangrador, completa)");
  const f = fichas.sangrador;
  const { ctx, p } = await contexto({ lista: [f], largura: 1440, sessoesIniciais: sessoes });
  await abre(p, "player", f.name);
  await aosAtivos(p);
  const s0 = await sessao(p, f.id);
  const hp0 = s0.hpAtual; const casca0 = JSON.stringify(s0.pvTempFontes ?? {}); const log0 = (s0.log ?? []).length; const ev0 = (s0.operacoes?.eventos ?? []).length;
  /* Consultar, selecionar e avançar rodada NÃO sangram */
  for (const [id] of FAIXAS) { await p.locator(`[data-chave-ativo="condicao:${id}"]`).click(); await espera(p, 200); }
  await p.locator('[data-chave-ativo="condicao:cond_5"]').click(); await espera(p, 200);
  await virada(p);
  const sConsulta = await sessao(p, f.id);
  check("D1 consultar, selecionar e virar a rodada não perdem Vida", sConsulta.hpAtual === hp0 && (sConsulta.log ?? []).length === log0 && (sConsulta.operacoes?.eventos ?? []).filter((e) => e.tipo === "perda").length === 0, { hp0, hp: sConsulta.hpAtual });
  /* O botão da faixa, com os dados certos */
  for (const [id, rotulo] of FAIXAS) {
    await p.locator(`[data-chave-ativo="condicao:${id}"]`).click(); await espera(p, 250);
    const botao = p.locator(`[data-sangrar="${id}"]`);
    check(`D2 faixa ${rotulo}: o botão existe e diz os dados`, (await botao.count()) === 1 && new RegExp(`Perda de Vida ${rotulo}`).test(await texto(botao)), await texto(botao));
  }
  await p.locator('[data-chave-ativo="condicao:cond_5"]').click(); await espera(p, 250);
  check("D2 uma condição que não sangra não tem o botão", (await p.locator("[data-sangrar]").count()) === 0);
  await foto(p, "D-atordoado");

  /* Um clique, uma rolagem, uma perda direto na Vida */
  await p.locator('[data-chave-ativo="condicao:cond_1"]').click(); await espera(p, 250);
  const antes = await sessao(p, f.id);
  await p.locator('[data-sangrar="cond_1"]').click(); await espera(p, 300);
  const res = p.locator('[data-sangrar="cond_1"] ~ [data-sangramento-resultado], [data-sangramento="cond_1"] [data-sangramento-resultado]');
  const total = Number(await res.first().getAttribute("data-total"));
  const depois = await sessao(p, f.id);
  check("D3 a tela mostra o total e os dados", Number.isFinite(total) && total >= 2 && total <= 12 && /2d6/.test(await texto(res.first())), await texto(res.first()));
  check("D3 a Vida cai exatamente o total rolado", depois.hpAtual === antes.hpAtual - total, { antes: antes.hpAtual, depois: depois.hpAtual, total });
  check("D3 a casca de PV Temporário (8) fica intacta", JSON.stringify(depois.pvTempFontes ?? {}) === casca0 && /"g2-teste":8/.test(JSON.stringify(depois.pvTempFontes ?? {})), depois.pvTempFontes);
  check("D3 a rolagem entra no histórico uma vez, com o mesmo total", (depois.log ?? []).length === antes.log.length + 1 && depois.log[0].total === total, depois.log?.[0]);
  const eventos = (depois.operacoes?.eventos ?? []).filter((e) => e.tipo === "perda");
  check("D3 um evento de perda, com o mesmo valor, na Vida", eventos.length === 1 && eventos[0].valor === total && eventos[0].mudou?.vida === -total, eventos);
  check("D3 um clique é uma aplicação só (nada de segunda perda depois de esperar)", (await sessao(p, f.id)).hpAtual === antes.hpAtual - total);
  await foto(p, "D-sangrou");
  /* O Histórico mostra a perda */
  await p.locator("[data-historico-abrir]").first().click(); await espera(p, 400);
  const itemPerda = p.locator('[data-historico-lista] li[data-tipo="perda"]');
  check("D4 o Histórico da Sessão lista a perda de Vida", (await itemPerda.count()) === 1 && new RegExp(`Vida −${total}`).test(await texto(itemPerda.first())), await texto(itemPerda.first()));
  await p.locator('[data-historico-filtro="vida"]').click().catch(() => {});
  await espera(p, 250);
  await p.keyboard.press("Escape"); await espera(p, 250);

  /* As outras faixas rolam os próprios dados */
  for (const [id, rotulo, dados, faces] of FAIXAS.slice(1)) {
    await p.locator(`[data-chave-ativo="condicao:${id}"]`).click(); await espera(p, 250);
    const a = await sessao(p, f.id);
    await p.locator(`[data-sangrar="${id}"]`).click(); await espera(p, 300);
    const r = p.locator(`[data-sangramento="${id}"] [data-sangramento-resultado]`).first();
    const t = Number(await r.getAttribute("data-total"));
    const d = await sessao(p, f.id);
    check(`D5 faixa ${rotulo}: total entre ${dados} e ${dados * faces} e Vida cai o total`, t >= dados && t <= dados * faces && d.hpAtual === a.hpAtual - t, { t, antes: a.hpAtual, depois: d.hpAtual });
  }
  /* A rodada seguinte não sangra sozinha */
  const sVirada = await sessao(p, f.id);
  await virada(p);
  check("D6 avançar a rodada depois de sangrar não aplica perda nenhuma", (await sessao(p, f.id)).hpAtual === sVirada.hpAtual);
  await ctx.close();
}

/* ---------- D: Vida zerada e a faixa no cadastro manual ---------- */
{
  passo("D Sangramento (Vida baixa e cadastro manual)");
  const f = fichas.sangrador;
  const base = structuredClone(sessoes[f.id]); base.hpAtual = 1;
  const { ctx, p } = await contexto({ lista: [f], largura: 1440, sessoesIniciais: { [f.id]: base } });
  await abre(p, "player", f.name);
  await aosAtivos(p);
  await p.locator('[data-chave-ativo="condicao:cond_4"]').click(); await espera(p, 250);
  await p.locator('[data-sangrar="cond_4"]').click(); await espera(p, 300);
  const s1 = await sessao(p, f.id);
  check("D7 com 1 de Vida a perda para em zero", s1.hpAtual === 0, s1.hpAtual);
  check("D7 a tela diz o que perdeu de verdade", /Perdeu 1 de Vida/.test(await texto(p.locator('[data-sangramento="cond_4"] [data-sangramento-resultado]'))), await texto(p.locator('[data-sangramento="cond_4"] [data-sangramento-resultado]')));
  check("D7 a casca segue intacta", /"g2-teste":8/.test(JSON.stringify(s1.pvTempFontes ?? {})));
  await p.locator('[data-sangrar="cond_4"]').click(); await espera(p, 300);
  check("D7 de novo em zero: sem Vida para perder", /Sem Vida para Perder/.test(await texto(p.locator('[data-sangramento="cond_4"] [data-sangramento-resultado]'))) && (await sessao(p, f.id)).hpAtual === 0);
  /* Cadastro manual com a faixa */
  await adicionar(p); await externa(p);
  await p.locator("[data-abrir-registrar]").click(); await espera(p, 300);
  await p.locator('[data-tipo="condicao"]').click(); await espera(p, 200);
  await p.locator('[data-campo="condicao"]').selectOption("Sangramento"); await espera(p, 250);
  const faixa = p.locator('[data-campo="faixa-sangramento"]');
  check("D8 escolher Sangramento pede a faixa, com os dados na opção", (await faixa.count()) === 1 && /Fraco \(2d6\)/.test(await texto(faixa.locator("option").first())));
  await faixa.selectOption("forte"); await espera(p, 200);
  await p.getByRole("button", { name: "Registrar", exact: true }).click(); await espera(p, 500);
  const sCad = await sessao(p, f.id);
  const nova = (sCad.condicoes ?? []).filter((c) => c.nome === "Sangramento").find((c) => c.sangramento === "forte" && !["cond_1", "cond_2", "cond_3", "cond_4"].includes(c.id));
  check("D8 a condição registrada guarda a faixa escolhida", !!nova, sCad.condicoes);
  await foto(p, "D-cadastro");
  await ctx.close();
}

/* ---------- D: o Sangramento na compacta ---------- */
{
  passo("D Sangramento (sangrador, compacta)");
  const f = fichas.sangrador;
  const { ctx, p } = await contexto({ lista: [f], largura: 1440, sessoesIniciais: sessoes });
  await abre(p, "player", f.name);
  await abreCompacta(p);
  await p.locator('[data-c2] [data-chave-ativo="condicao:cond_2"]').click(); await espera(p, 400);
  const botao = p.locator('[data-c2] [data-sangrar="cond_2"]');
  check("D9 na compacta o botão existe com os dados da faixa", (await botao.count()) === 1 && /3d8/.test(await texto(botao)), await texto(botao));
  const a = await sessao(p, f.id);
  await botao.click(); await espera(p, 300);
  const t = Number(await p.locator('[data-c2] [data-sangramento="cond_2"] [data-sangramento-resultado]').first().getAttribute("data-total"));
  const d = await sessao(p, f.id);
  check("D9 a perda na compacta é a mesma operação (Vida cai o total, casca intacta)", d.hpAtual === a.hpAtual - t && /"g2-teste":8/.test(JSON.stringify(d.pvTempFontes ?? {})), { t, antes: a.hpAtual, depois: d.hpAtual });
  await foto(p, "D-compacta");
  await ctx.close();
}
await encerra();
