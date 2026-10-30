/* FRENTE B: o Concedido pelo Mestre operado pelo G2 (Adicionar > Fonte Externa > Concedido pelo Mestre), Chrome real, contexto isolado. */
import { fichas, sessoes, contexto, abre, passo, check, foto, espera, adicionar, externa, sessao, fichaGravada, texto, encerra } from "./lib.mjs";

const stats = (p) => p.evaluate(() => Object.fromEntries([...document.querySelectorAll("[data-afty-stat]")].map((e) => [e.getAttribute("data-afty-stat"), e.textContent.replace(/\s+/g, " ").trim().replace(/^[^\d+\-−]*/, "")])));
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const abreConcedido = async (p) => { await adicionar(p); await externa(p); await p.locator("[data-abrir-concedido]").click(); await espera(p, 300); };
const concedidos = async (p, id) => (await sessao(p, id))?.concedido ?? [];
const familia = async (p, v) => { await p.locator('[data-campo="concedido-familia"]').selectOption(v); await espera(p, 250); };
const busca = async (p, v) => { await p.locator("[data-busca-concedido]").fill(v); await espera(p, 350); };

/* ---------- B.1 a B.9: o mestre (addon da concessão) ---------- */
{
  passo("B Concedido pelo Mestre (mestre, /Player)");
  const f = fichas.mestre;
  const { ctx, p } = await contexto({ lista: [f], largura: 1440, sessoesIniciais: sessoes });
  await abre(p, "player", f.name);
  const fichaAntes = await fichaGravada(p, "player", f.id);
  await adicionar(p); await externa(p);
  const entrada = p.locator("[data-abrir-concedido]");
  check("B1 o acesso existe no trilho da Fonte Externa, com a contagem", (await entrada.count()) === 1 && /3/.test(await texto(entrada)), await texto(entrada));
  await entrada.click(); await espera(p, 300);
  check("B2 lista as três concessões existentes", (await p.locator("[data-concedido]").count()) === 3);
  check("B2 a que perdeu o addon vem marcada", (await p.locator("[data-concedido][data-morta] [data-sem-addon]").count()) === 1 && /1 Concessão Sem Addon/.test(await texto(p.locator("[data-concedido-mestre]"))));
  await foto(p, "B-lista");

  /* Remover a existente e a morta */
  await p.locator('[data-concedido]:not([data-morta]) [data-remover-concessao]').first().click(); await espera(p, 400);
  check("B3 remover tira só a pega escolhida", (await p.locator("[data-concedido]").count()) === 2 && (await concedidos(p, f.id)).length === 2);
  await p.locator("[data-concedido][data-morta] [data-remover-concessao]").click(); await espera(p, 400);
  check("B4 remover a que perdeu o addon limpa o aviso", (await p.locator("[data-concedido]").count()) === 1 && (await p.locator("[data-sem-addon]").count()) === 0);

  /* Conceder */
  await familia(p, "habilidades");
  await busca(p, "Defesa Marcial");
  check("B5 a busca por família acha a entrada", (await p.locator('[data-chave-concessao="lut_defesa_marcial"]').count()) === 1);
  const statsAntes = await stats(p);
  await p.locator('[data-chave-concessao="lut_defesa_marcial"] button').click(); await espera(p, 400);
  const s5 = await concedidos(p, f.id);
  check("B5 conceder grava na sessão", s5.some((c) => c.familia === "habilidades" && c.id === "lut_defesa_marcial"), s5);
  check("B5 o aviso diz o que foi concedido", /Defesa Marcial/.test(await texto(p.locator("[data-aviso-concedido]"))));
  check("B5 a linha vira Concedido e perde o botão (não repetível)", (await p.locator('[data-chave-concessao="lut_defesa_marcial"] button').count()) === 0 && /Concedido/.test(await texto(p.locator('[data-chave-concessao="lut_defesa_marcial"]'))));
  check("B5 entra em Concedidos Agora", (await p.locator("[data-concedido]").count()) === 2);
  const statsComConcessao = await stats(p);
  check("B5 a Defesa sobe de 18 para 21 com a Defesa Marcial concedida", statsAntes.defesa === "18" && statsComConcessao.defesa === "21", { antes: statsAntes.defesa, depois: statsComConcessao.defesa });
  const fichaDepois = await fichaGravada(p, "player", f.id);
  check("B6 a ficha não muda (é estado de sessão)", igual(fichaAntes.habilidades, fichaDepois.habilidades) && igual(fichaAntes.talentos, fichaDepois.talentos) && igual(fichaAntes.addons, fichaDepois.addons));
  /* Repetível: duas pegas do mesmo id */
  await familia(p, "gerais");
  await busca(p, "");
  const primeira = p.locator("[data-chave-concessao]").first();
  const idGeral = await primeira.getAttribute("data-chave-concessao");
  await primeira.locator("button").click(); await espera(p, 300);
  await p.locator(`[data-chave-concessao="${idGeral}"] button`).click(); await espera(p, 400);
  const geral = (await concedidos(p, f.id)).filter((c) => c.familia === "gerais" && c.id === idGeral);
  check("B7 família repetível aceita a mesma duas vezes, com pegas distintas", geral.length === 2 && geral[0].uid !== geral[1].uid, geral);
  await p.locator(`[data-concedido] [data-remover-concessao="${geral[0].uid}"]`).click(); await espera(p, 400);
  const geral2 = (await concedidos(p, f.id)).filter((c) => c.familia === "gerais" && c.id === idGeral);
  check("B7 remover uma das duas deixa a outra", geral2.length === 1 && geral2[0].uid === geral[1].uid);
  /* Talento */
  await familia(p, "talentos");
  await busca(p, "Adepto");
  const talento = p.locator("[data-chave-concessao]").first();
  const idTalento = await talento.getAttribute("data-chave-concessao");
  await talento.locator("button").click(); await espera(p, 400);
  check("B8 conceder Talento", (await concedidos(p, f.id)).some((c) => c.familia === "talentos" && c.id === idTalento));
  await foto(p, "B-concedido");

  /* Persistência e igualdade com a clássica */
  await sessao(p, f.id);
  await abre(p, "player", f.name); await abreConcedido(p);
  check("B9 depois de recarregar as concessões continuam", (await p.locator("[data-concedido]").count()) === (await concedidos(p, f.id)).length && (await p.locator("[data-concedido]").count()) >= 3, await concedidos(p, f.id));
  const g2 = await stats(p);
  await abre(p, "player", f.name, false);
  const classica = await stats(p);
  check("B9 os números do G2 e da clássica são iguais", igual(g2, classica), { g2, classica });
  check("B9 a Defesa concedida sobrevive ao recarregar", g2.defesa === "21", { g2: g2.defesa });
  /* Remover a concessão devolve o número */
  await abre(p, "player", f.name); await abreConcedido(p);
  const uidDefesa = (await concedidos(p, f.id)).find((c) => c.id === "lut_defesa_marcial")?.uid;
  await p.locator(`[data-remover-concessao="${uidDefesa}"]`).click(); await espera(p, 500);
  check("B9 remover devolve a Defesa a 18", (await stats(p)).defesa === "18", await stats(p));
  await ctx.close();
}

/* ---------- B.10: sem o addon não há acesso ---------- */
{
  passo("B Sem a concessão (ima) e /Afty (cria)");
  const f = fichas.ima;
  const { ctx, p } = await contexto({ lista: [f], largura: 1440, sessoesIniciais: sessoes });
  await abre(p, "player", f.name);
  await adicionar(p); await externa(p);
  check("B10 sem o addon e sem concessão o acesso não existe", (await p.locator("[data-abrir-concedido]").count()) === 0);
  await ctx.close();
  /* A criatura do /Afty com o addon da concessão */
  const c = fichas.cria;
  const r = await contexto({ lista: [c], rota: "Afty", largura: 1440, sessoesIniciais: sessoes });
  await abre(r.p, "afty", c.name);
  await adicionar(r.p); await externa(r.p);
  check("B11 /Afty: o acesso existe com o addon da concessão", (await r.p.locator("[data-abrir-concedido]").count()) === 1);
  await r.p.locator("[data-abrir-concedido]").click(); await espera(r.p, 300);
  await familia(r.p, "habilidades"); await busca(r.p, "Defesa Marcial");
  await r.p.locator('[data-chave-concessao="lut_defesa_marcial"] button').click(); await espera(r.p, 400);
  check("B11 /Afty: conceder grava na sessão", ((await concedidos(r.p, c.id)) ?? []).some((x) => x.id === "lut_defesa_marcial"), await concedidos(r.p, c.id));
  await foto(r.p, "B-afty");
  await r.ctx.close();
}
await encerra();
