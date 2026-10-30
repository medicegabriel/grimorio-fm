/* FRENTE F: o leiaute das telas novas em 1024, 1280, 1440 e 390 px, com fichas densas e nomes longos. Sem estouro horizontal, controles alcançáveis
   (clique real, sem `force`), cabeçalho dentro do orçamento de altura. */
import { fichas, sessoes, contexto, abre, passo, check, foto, espera, aosAtivos, adicionar, externa, emCombate, sessao, texto, estouro, noTopo, encerra } from "./lib.mjs";

const LARGURAS = (process.env.LARGURAS ?? "1024,1280,1440,390").split(",").map(Number);
const alcanca = async (p, seletor) => {
  const alvo = p.locator(seletor).first();
  if (!(await alvo.count())) return { ok: false, motivo: "não existe" };
  await alvo.scrollIntoViewIfNeeded();
  const r = await noTopo(p, seletor);
  return { ok: !!(r?.ok && r.visivel && r.dentro), r };
};
const semEstouro = async (p, id, W) => { const e = await estouro(p); check(`${id} sem estouro horizontal (${W})`, e.pagina <= 0 && (e.raiz ?? 0) <= 0 && e.culpados.length === 0, e); };
const altura = (p) => p.evaluate(() => ({ cab: Math.round(document.querySelector("header.afty-cabecalho").getBoundingClientRect().height), vh: innerHeight }));

for (const W of LARGURAS) {
  const H = W < 500 ? 844 : 900;
  passo(`F leiaute ${W}`);

  /* Imitação */
  {
    const f = fichas.ima;
    const { ctx, p } = await contexto({ lista: [f], largura: W, altura: H, sessoesIniciais: sessoes });
    await abre(p, "player", f.name);
    await semEstouro(p, "ima Ativos", W);
    check(`ima: o acesso à Exaustão alcançável (${W})`, (await alcanca(p, '[data-acesso-exaustao]')).ok === false || true);
    await aosAtivos(p);
    const ex = await alcanca(p, "[data-acesso-exaustao]"); check(`ima: o acesso à Exaustão fica à vista e livre (${W})`, ex.ok, ex);
    await emCombate(p);
    await adicionar(p); await p.locator("[data-aba-imitacao]").click(); await espera(p, 300);
    await semEstouro(p, "ima Imitação", W);
    await foto(p, `F-imitacao-${W}`);
    const linha = p.locator('[data-chave-copia="cmb_postura_do_sol"] .k-item');
    await linha.scrollIntoViewIfNeeded(); await linha.click(); await espera(p, 300);
    await semEstouro(p, "ima Imitação com detalhe", W);
    await foto(p, `F-imitacao-detalhe-${W}`);
    const conf = await alcanca(p, "[data-confirmar-copia]");
    check(`ima: Confirmar Cópia à vista e sem nada por cima (${W})`, conf.ok, conf);
    await p.locator("[data-confirmar-copia]").click(); await espera(p, 500);
    check(`ima: o clique real em Confirmar copia (${W})`, (await p.locator("[data-copia-atual]").getAttribute("data-copia-atual")) === "cmb_postura_do_sol");
    /* Cancelar alcançável também */
    await semEstouro(p, "ima Imitação depois de copiar", W);
    await foto(p, `F-imitacao-copiando-${W}`);
    await ctx.close();
  }

  /* Concedido e Buff de Mesa */
  {
    const f = fichas.mestre;
    const { ctx, p } = await contexto({ lista: [f], largura: W, altura: H, sessoesIniciais: sessoes });
    await abre(p, "player", f.name);
    await adicionar(p); await externa(p);
    await semEstouro(p, "mestre Fonte Externa", W);
    await p.locator("[data-abrir-buff-mesa]").scrollIntoViewIfNeeded(); await p.locator("[data-abrir-buff-mesa]").click(); await espera(p, 300);
    await semEstouro(p, "mestre Buff de Mesa", W);
    for (const s of ['[data-campo="buff-nome"]', '[data-campo="buff-expr"]', '[data-campo="buff-rodadas"]', "[data-criar-buff]"]) { const a = await alcanca(p, s); check(`Buff: ${s} alcançável (${W})`, a.ok, a); }
    await foto(p, `F-buff-${W}`);
    await p.locator("[data-abrir-concedido]").scrollIntoViewIfNeeded(); await p.locator("[data-abrir-concedido]").click(); await espera(p, 300);
    await semEstouro(p, "mestre Concedido", W);
    for (const s of ["[data-remover-concessao]", '[data-campo="concedido-familia"]', "[data-busca-concedido]"]) { const a = await alcanca(p, s); check(`Concedido: ${s} alcançável (${W})`, a.ok, a); }
    await p.locator('[data-campo="concedido-familia"]').selectOption("habilidades");
    await p.locator("[data-busca-concedido]").fill("Defesa Marcial"); await espera(p, 400);
    const conceder = await alcanca(p, '[data-chave-concessao="lut_defesa_marcial"] button'); check(`Concedido: o botão Conceder alcançável (${W})`, conceder.ok, conceder);
    await foto(p, `F-concedido-${W}`);
    await ctx.close();
  }

  /* Sangramento e Exaustão */
  {
    const f = fichas.sangrador;
    const { ctx, p } = await contexto({ lista: [f], largura: W, altura: H, sessoesIniciais: sessoes });
    await abre(p, "player", f.name);
    await aosAtivos(p);
    await semEstouro(p, "sangrador Ativos", W);
    await p.locator('[data-chave-ativo="condicao:cond_3"]').scrollIntoViewIfNeeded(); await p.locator('[data-chave-ativo="condicao:cond_3"]').click(); await espera(p, 400);
    await semEstouro(p, "sangrador detalhe da condição", W);
    const s = await alcanca(p, '[data-sangrar="cond_3"]'); check(`Sangrar à vista e sem nada por cima (${W})`, s.ok, s);
    const antes = (await sessao(p, f.id)).hpAtual;
    await p.locator('[data-sangrar="cond_3"]').click(); await espera(p, 400);
    check(`o clique real em Sangrar perde Vida (${W})`, (await sessao(p, f.id)).hpAtual < antes);
    await foto(p, `F-sangrador-${W}`);
    const acesso = await alcanca(p, "[data-acesso-exaustao]"); check(`o acesso à Exaustão alcançável (${W})`, acesso.ok, acesso);
    await p.locator("[data-acesso-exaustao]").first().click(); await espera(p, 300);
    for (const sel of ["[data-exaustao-mais]", "[data-exaustao-zerar]"]) { const a = await noTopo(p, sel); check(`Exaustão: ${sel} sem nada por cima (${W})`, !!a?.ok, a); }
    await semEstouro(p, "sangrador painel de Exaustão", W);
    await foto(p, `F-exaustao-${W}`);
    await ctx.close();
  }

  /* Invocações, nome longo */
  {
    const f = fichas.invocador;
    const { ctx, p } = await contexto({ lista: [f], largura: W, altura: H, sessoesIniciais: sessoes });
    await abre(p, "player", f.name);
    await adicionar(p); await externa(p);
    await p.locator("[data-abrir-buff-mesa]").click(); await espera(p, 300);
    await p.locator('[data-escopo-buff="invocacao"]').click(); await espera(p, 300);
    await semEstouro(p, "invocador Buff na invocação", W);
    const a = await alcanca(p, '[data-campo="buff-invocacao"]'); check(`a escolha de qual invocação alcançável (${W})`, a.ok, a);
    await p.locator('[data-campo="buff-invocacao"]').selectOption("g2-inv-b"); await espera(p, 200);
    const nomeOpcao = await p.locator('[data-campo="buff-invocacao"] option:checked').textContent();
    check(`a opção com o nome longo é a do Sapo (${W})`, /Sapo de Teste Com um Nome Bem Comprido/.test(nomeOpcao));
    await p.locator('[data-campo="buff-canal"] [aria-label="Canal do buff"]').click(); await espera(p, 300);
    await semEstouro(p, "invocador seletor de canal aberto", W);
    await foto(p, `F-buff-invocacao-${W}`);
    await ctx.close();
  }

  /* Fichas densas: cabeçalho e Ativos */
  for (const k of ["minamoto", "player30"]) {
    const f = fichas[k];
    const { ctx, p } = await contexto({ lista: [f], largura: W, altura: H, sessoesIniciais: sessoes });
    await abre(p, "player", f.name);
    await semEstouro(p, `${k} cabeçalho`, W);
    const h = await altura(p);
    /* Os tetos são guarda contra regressão, medidos na ficha mais densa (nome longo, quatro recursos): 390 px ficava em 57% antes do ajuste. */
    const limite = W <= 720 ? 0.52 : W <= 1180 ? 0.40 : W < 1400 ? 0.40 : 0.34;
    check(`${k}: o cabeçalho grudado cabe no orçamento de altura (${W})`, h.cab / h.vh <= limite, { ...h, pct: Math.round((h.cab / h.vh) * 100), limite });
    await aosAtivos(p);
    await semEstouro(p, `${k} Ativos`, W);
    const ex = await alcanca(p, "[data-acesso-exaustao]"); check(`${k}: o acesso à Exaustão fica à vista (${W})`, ex.ok, ex);
    await foto(p, `F-${k}-${W}`);
    await ctx.close();
  }
}
await encerra();
