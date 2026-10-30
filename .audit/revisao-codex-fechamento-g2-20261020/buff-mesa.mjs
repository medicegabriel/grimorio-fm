/* FRENTE E: o buff de mesa manual criado e encerrado pelo G2 (Adicionar > Fonte Externa > Buff de Mesa), Chrome real, contexto isolado. */
import { fichas, sessoes, contexto, abre, passo, check, foto, espera, aosAtivos, adicionar, externa, sessao, fichaGravada, texto, virada, encerra } from "./lib.mjs";

const stats = (p) => p.evaluate(() => Object.fromEntries([...document.querySelectorAll("#afty-ficha .e-stat[data-afty-stat], #afty-ficha .afty-stat[data-afty-stat]")].map((e) => [e.getAttribute("data-afty-stat"), e.textContent.replace(/\s+/g, " ").trim().replace(/^[^\d+\-−]*/, "").replace(/^[◆\s]+/, "")])).valueOf());
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const abreBuff = async (p) => { await adicionar(p); await externa(p); await p.locator("[data-abrir-buff-mesa]").click(); await espera(p, 300); };
const campo = (p, nome) => p.locator(`[data-campo="${nome}"]`);
const preenche = async (p, { nome, expr, rodadas }) => {
  if (nome !== undefined) await campo(p, "buff-nome").fill(nome);
  if (expr !== undefined) await campo(p, "buff-expr").fill(expr);
  if (rodadas !== undefined) await campo(p, "buff-rodadas").fill(String(rodadas));
};
const canal = async (p, termo) => {
  await campo(p, "buff-canal").locator('[aria-label="Canal do buff"]').click(); await espera(p, 200);
  await p.locator(".afty-canal-busca input").fill(termo); await espera(p, 200);
  await p.locator(".afty-canal-lista button").first().click(); await espera(p, 250);
};
const criar = async (p) => { await p.locator("[data-criar-buff]").click(); await espera(p, 400); };
const buffs = async (p, id) => (await sessao(p, id))?.buffs ?? [];
const porNome = (lista, nome) => lista.filter((b) => b.nome === nome);
const defesaInv = async (p, nome) => {
  await p.locator('[data-afty-aba="invocacoes"]').click(); await espera(p, 400);
  await p.locator("#afty-painel button", { hasText: new RegExp(`^${nome}`) }).first().click(); await espera(p, 400);
  return Number(((await texto(p.locator('#afty-painel [data-afty-stat="defesa"]'))).match(/\d+/) ?? [])[0]);
};

/* ---------- E.1 a E.10: a criatura (invocador, /Player) ---------- */
{
  passo("E Buff de Mesa na criatura (invocador)");
  const f = fichas.invocador;
  const { ctx, p } = await contexto({ lista: [f], largura: 1440, sessoesIniciais: sessoes });
  await abre(p, "player", f.name);
  const inicial = await buffs(p, f.id);
  const pacote0 = JSON.stringify(inicial.find((b) => b.id === "g2-inst1"));
  const statsIni = await stats(p);
  await abreBuff(p);
  check("E1 o formulário abre pela Fonte Externa", (await p.locator("[data-buff-mesa]").count()) === 1);
  check("E1 com invocações, o formulário oferece onde cai", (await p.locator("[data-escopo-buff]").count()) === 2);

  /* Rascunho: só vira buff quando o jogador cria */
  await preenche(p, { nome: "Foco Total", expr: "+2" });
  await p.locator("[data-abrir-registrar]").click(); await espera(p, 250);
  await p.locator("[data-abrir-buff-mesa]").click(); await espera(p, 250);
  check("E2 trocar de tela do trilho não perde o rascunho", (await campo(p, "buff-nome").inputValue()) === "Foco Total" && (await campo(p, "buff-expr").inputValue()) === "+2");
  check("E2 o rascunho não criou nada na sessão", igual((await buffs(p, f.id)).map((b) => b.id), inicial.map((b) => b.id)));

  /* Recusas sem gravar */
  await preenche(p, { expr: "" });
  await criar(p);
  check("E3 expressão vazia é recusada com o motivo", /Falta o Valor ou a Expressão/.test(await texto(p.locator("[data-erro-buff]"))) && igual((await buffs(p, f.id)).map((b) => b.id), inicial.map((b) => b.id)));
  await preenche(p, { expr: "+++" });
  await criar(p);
  check("E3 expressão inválida é recusada", /Expressão Inválida/.test(await texto(p.locator("[data-erro-buff]"))) && igual((await buffs(p, f.id)).map((b) => b.id), inicial.map((b) => b.id)));
  check("E3 recusar não apaga o que foi digitado", (await campo(p, "buff-nome").inputValue()) === "Foco Total");
  await foto(p, "E-erro");

  /* Corrigir e criar: Defesa +2 */
  await preenche(p, { expr: "+2" });
  await criar(p);
  check("E4 corrigido, o buff é criado e a tela avisa", (await p.locator("[data-buff-criado]").count()) === 1 && /Foco Total/.test(await texto(p.locator("[data-buff-criado]"))));
  const s4 = await buffs(p, f.id);
  const foco = porNome(s4, "Foco Total")[0];
  check("E4 o registro guarda nome, canal, a expressão sem o + inicial e sem contador", !!foco && foco.canal === "defesa" && foco.expr === "2" && foco.rodadas == null, foco);
  check("E4 o formulário esvazia depois de criar", (await campo(p, "buff-nome").inputValue()) === "" && (await campo(p, "buff-expr").inputValue()) === "");
  check("E4 a Defesa sobe 2", (await stats(p)).defesa !== undefined && Number((await stats(p)).defesa) === Number(statsIni.defesa) + 2, { ini: statsIni.defesa, agora: (await stats(p)).defesa });
  check("E4 o resto de sessao.buffs fica como estava (pacote intacto)", JSON.stringify(s4.find((b) => b.id === "g2-inst1")) === pacote0);

  /* Canal escolhido, rodadas, clique duplo */
  await preenche(p, { nome: "Relâmpago", expr: "+3", rodadas: 2 });
  await canal(p, "Iniciativa");
  check("E5 o seletor mostra o canal escolhido", /Iniciativa/.test(await texto(campo(p, "buff-canal"))), await texto(campo(p, "buff-canal")));
  await p.locator("[data-criar-buff]").dblclick(); await espera(p, 500);
  const s5 = await buffs(p, f.id);
  check("E5 clique duplo cria um buff só", porNome(s5, "Relâmpago").length === 1, porNome(s5, "Relâmpago"));
  const rel = porNome(s5, "Relâmpago")[0];
  check("E5 canal e rodadas gravados", rel?.canal === "iniciativa" && rel?.rodadas === 2 && rel?.expr === "3", rel);
  const stats5 = await stats(p);
  check("E5 a Iniciativa sobe 3", Number(stats5.iniciativa) === Number(statsIni.iniciativa) + 3, { ini: statsIni.iniciativa, agora: stats5.iniciativa });
  await foto(p, "E-criado");

  /* Igualdade com a clássica */
  await sessao(p, f.id);
  await abre(p, "player", f.name, false);
  const classica = await stats(p);
  check("E6 os números do G2 e da clássica são iguais", igual(stats5.defesa, classica.defesa) && igual(stats5.iniciativa, classica.iniciativa), { g2: stats5, classica });
  await abre(p, "player", f.name);

  /* Rodadas e vencimento */
  await virada(p);
  const v1 = porNome(await buffs(p, f.id), "Relâmpago")[0];
  check("E7 a virada desconta uma rodada", v1?.rodadas === 1, v1);
  await virada(p);
  const s7 = await buffs(p, f.id);
  check("E7 na segunda virada o buff vence e sai", porNome(s7, "Relâmpago").length === 0);
  check("E7 a Iniciativa volta", Number((await stats(p)).iniciativa) === Number(statsIni.iniciativa));
  check("E7 o buff sem contador continua depois das viradas", porNome(s7, "Foco Total").length === 1);
  check("E7 o pacote segue intacto depois das viradas", JSON.stringify(s7.find((b) => b.id === "g2-inst1")) === pacote0);

  /* Encerrar pelos Ativos */
  await aosAtivos(p);
  await p.locator(`[data-chave-ativo="buff:${foco.id}"]`).click(); await espera(p, 300);
  await p.locator(`[data-encerrar="buff:${foco.id}"]`).click(); await espera(p, 500);
  const s8 = await buffs(p, f.id);
  check("E8 Encerrar tira só o buff de mesa", porNome(s8, "Foco Total").length === 0 && JSON.stringify(s8.find((b) => b.id === "g2-inst1")) === pacote0 && s8.length === inicial.length);
  check("E8 a Defesa volta ao início", Number((await stats(p)).defesa) === Number(statsIni.defesa));

  /* Persistência */
  await abreBuff(p);
  await preenche(p, { nome: "Fica", expr: "+1" });
  await criar(p);
  await sessao(p, f.id);
  await abre(p, "player", f.name); await aosAtivos(p);
  check("E9 recarregar mantém o buff e o número", porNome(await buffs(p, f.id), "Fica").length === 1 && Number((await stats(p)).defesa) === Number(statsIni.defesa) + 1);
  const fichaDepois = await fichaGravada(p, "player", f.id);
  check("E9 nada disso tocou a ficha gravada", igual(fichaDepois.invocacoes.map((i) => i.id), f.invocacoes.map((i) => i.id)));
  await ctx.close();
}

/* ---------- E.11 a E.14: o buff nas invocações ---------- */
{
  passo("E Buff de Mesa nas invocações (invocador)");
  const f = fichas.invocador;
  const { ctx, p } = await contexto({ lista: [f], largura: 1440, sessoesIniciais: sessoes });
  await abre(p, "player", f.name);
  const nue0 = await defesaInv(p, "Nue");
  const sapo0 = await defesaInv(p, "Sapo");
  await abreBuff(p);
  await p.locator('[data-escopo-buff="invocacao"]').click(); await espera(p, 250);
  check("E10 na invocação aparece a escolha de qual", (await campo(p, "buff-invocacao").count()) === 1 && (await campo(p, "buff-invocacao").locator("option").count()) === 3);
  check("E10 o seletor de canal usa o catálogo da invocação", /Defesa/.test(await texto(campo(p, "buff-canal"))));
  await foto(p, "E-invocacao");
  await preenche(p, { nome: "Casco", expr: "+1" });
  await criar(p);
  const casco = porNome(await buffs(p, f.id), "Casco")[0];
  check("E11 todas: guarda o escopo e nenhuma mira", casco?.escopo === "invocacao" && !casco?.invocacaoAlvo, casco);
  const nue1 = await defesaInv(p, "Nue"); const sapo1 = await defesaInv(p, "Sapo");
  check("E11 todas: as duas invocações sobem 1", nue1 === nue0 + 1 && sapo1 === sapo0 + 1, { nue0, nue1, sapo0, sapo1 });
  /* Específico */
  await abreBuff(p);
  await p.locator('[data-escopo-buff="invocacao"]').click(); await espera(p, 250);
  await campo(p, "buff-invocacao").selectOption("g2-inv-a"); await espera(p, 200);
  await preenche(p, { nome: "Só Nue", expr: "+2", rodadas: 3 });
  await criar(p);
  const soNue = porNome(await buffs(p, f.id), "Só Nue")[0];
  check("E12 específico: guarda a mira e as rodadas", soNue?.invocacaoAlvo === "g2-inv-a" && soNue?.rodadas === 3, soNue);
  const nue2 = await defesaInv(p, "Nue"); const sapo2 = await defesaInv(p, "Sapo");
  check("E12 específico: só a Nue sobe mais 2", nue2 === nue1 + 2 && sapo2 === sapo1, { nue1, nue2, sapo1, sapo2 });
  /* Trocar o escopo recomeça o canal e a mira */
  await abreBuff(p);
  await p.locator('[data-escopo-buff="invocacao"]').click(); await campo(p, "buff-invocacao").selectOption("g2-inv-a");
  await p.locator('[data-escopo-buff="criatura"]').click(); await espera(p, 250);
  check("E13 voltar para a criatura esconde a mira", (await campo(p, "buff-invocacao").count()) === 0);
  await p.locator('[data-escopo-buff="invocacao"]').click(); await espera(p, 250);
  check("E13 trocar de escopo zera a mira", (await campo(p, "buff-invocacao").inputValue()) === "");
  /* Encerrar o de mira */
  await aosAtivos(p);
  await p.locator(`[data-chave-ativo="buff:${soNue.id}"]`).click(); await espera(p, 300);
  await p.locator(`[data-encerrar="buff:${soNue.id}"]`).click(); await espera(p, 500);
  check("E14 encerrar o de mira devolve só a Nue", (await defesaInv(p, "Nue")) === nue1 && porNome(await buffs(p, f.id), "Casco").length === 1);
  const pacote = (await buffs(p, f.id)).find((b) => b.id === "g2-inst1");
  check("E14 o pacote segue intacto", JSON.stringify(pacote) === JSON.stringify(sessoes[f.id].buffs[0]));
  await ctx.close();
}

/* ---------- E.15: a criatura do /Afty ---------- */
{
  passo("E Buff de Mesa no /Afty (cria)");
  const f = fichas.cria;
  const { ctx, p } = await contexto({ lista: [f], rota: "Afty", largura: 1440, sessoesIniciais: sessoes });
  await abre(p, "afty", f.name);
  const ini = await stats(p);
  await abreBuff(p);
  await preenche(p, { nome: "Auxílio", expr: "+4" });
  await canal(p, "Iniciativa");
  await criar(p);
  const s = await buffs(p, f.id);
  check("E15 /Afty: o buff é criado", porNome(s, "Auxílio").length === 1 && porNome(s, "Auxílio")[0].canal === "iniciativa");
  const g2 = await stats(p);
  check("E15 /Afty: a Iniciativa sobe 4", Number(g2.iniciativa) === Number(ini.iniciativa) + 4, { ini: ini.iniciativa, g2: g2.iniciativa });
  await sessao(p, f.id);
  await abre(p, "afty", f.name, false);
  const classica = await stats(p);
  check("E15 /Afty: o número do G2 é o da clássica", igual(g2.iniciativa, classica.iniciativa) && igual(g2.defesa, classica.defesa), { g2, classica });
  await ctx.close();
}
await encerra();
