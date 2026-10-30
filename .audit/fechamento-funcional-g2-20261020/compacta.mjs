/* O painel compacto (aba Habilidades, botão Efeitos): Imitação, Concedido e Buff de Mesa pelo Adicionar dele. Exaustão e Sangramento na compacta estão em
   exaustao-sangramento.mjs. Chrome real, contexto isolado, cliques sem `force`. */
import { fichas, sessoes, contexto, abre, passo, check, foto, espera, emCombate, sessao, texto, estouro, encerra } from "./lib.mjs";

const LARGURAS = (process.env.LARGURAS ?? "1024,1440").split(",").map(Number);
const abreCompacta = async (p) => {
  await p.locator('[data-afty-aba="habilidades"]').click();
  if (!(await p.locator("[data-c2]").isVisible().catch(() => false))) await p.locator("button.f-acesso").click();
  await p.locator("[data-c2]").waitFor();
  await espera(p, 300);
};
const adicionarC2 = async (p) => { await p.locator("[data-adicionar-c2]").click(); await p.locator("[data-catalogo]").waitFor(); await espera(p, 300); };
const campo = (p, nome) => p.locator(`[data-campo="${nome}"]`);

for (const W of LARGURAS) {
  passo(`Compacta ${W}`);
  /* Imitação */
  {
    const f = fichas.ima;
    const { ctx, p } = await contexto({ lista: [f], largura: W, sessoesIniciais: sessoes });
    await abre(p, "player", f.name);
    await emCombate(p);
    await abreCompacta(p);
    await adicionarC2(p);
    check(`C-imitacao a aba existe no Adicionar da compacta (${W})`, (await p.locator("[data-aba-imitacao]").count()) === 1);
    await p.locator("[data-aba-imitacao]").click(); await espera(p, 300);
    const e0 = await estouro(p); check(`C-imitacao sem estouro (${W})`, e0.pagina <= 0 && e0.culpados.length === 0, e0);
    await p.locator('[data-chave-copia="cmb_postura_do_sol"] .k-item').click(); await espera(p, 250);
    check(`C-imitacao selecionar não copia (${W})`, ((await sessao(p, f.id))?.combate?.imitacao?.copia ?? null) === null);
    await foto(p, `C2-imitacao-${W}`);
    await p.locator("[data-confirmar-copia]").click(); await espera(p, 500);
    check(`C-imitacao Confirmar copia na compacta (${W})`, ((await sessao(p, f.id))?.combate?.imitacao?.copia?.id ?? null) === "cmb_postura_do_sol" && (await texto(p.locator("[data-nome-copia]"))) === "Postura do Sol");
    await p.locator("[data-encerrar-copia]").click(); await espera(p, 400);
    check(`C-imitacao Encerrar na compacta (${W})`, ((await sessao(p, f.id))?.combate?.imitacao?.copia ?? null) === null);
    await ctx.close();
  }
  /* Concedido e Buff de Mesa */
  {
    const f = fichas.mestre;
    const { ctx, p } = await contexto({ lista: [f], largura: W, sessoesIniciais: sessoes });
    await abre(p, "player", f.name);
    await abreCompacta(p);
    await adicionarC2(p);
    await p.locator("[data-aba-externa]").click(); await espera(p, 300);
    await p.locator("[data-abrir-buff-mesa]").click(); await espera(p, 300);
    const e1 = await estouro(p); check(`C-buff sem estouro (${W})`, e1.pagina <= 0 && e1.culpados.length === 0, e1);
    await campo(p, "buff-nome").fill("Na Compacta"); await campo(p, "buff-expr").fill("2");
    await p.locator("[data-criar-buff]").click(); await espera(p, 500);
    const b = ((await sessao(p, f.id))?.buffs ?? []).filter((x) => x.nome === "Na Compacta");
    check(`C-buff criar pela compacta grava um buff (${W})`, b.length === 1 && b[0].expr === "2" && b[0].canal === "defesa", b);
    await foto(p, `C2-buff-${W}`);
    await p.locator("[data-abrir-concedido]").click(); await espera(p, 300);
    const e2 = await estouro(p); check(`C-concedido sem estouro (${W})`, e2.pagina <= 0 && e2.culpados.length === 0, e2);
    await campo(p, "concedido-familia").selectOption("habilidades");
    await p.locator("[data-busca-concedido]").fill("Defesa Marcial"); await espera(p, 400);
    await p.locator('[data-chave-concessao="lut_defesa_marcial"] button').click(); await espera(p, 500);
    check(`C-concedido conceder pela compacta grava na sessão (${W})`, ((await sessao(p, f.id))?.concedido ?? []).some((c) => c.id === "lut_defesa_marcial"));
    await foto(p, `C2-concedido-${W}`);
    await p.locator(`[data-concedido] [data-remover-concessao]`).last().click(); await espera(p, 400);
    check(`C-concedido remover pela compacta (${W})`, !((await sessao(p, f.id))?.concedido ?? []).some((c) => c.id === "lut_defesa_marcial"));
    /* O Buff aparece na lista da compacta e se encerra por lá */
    await p.locator("[data-voltar-ativos]").click().catch(() => {}); await espera(p, 400);
    const cartao = p.locator('[data-c2] [data-chave-ativo^="buff:"]');
    check(`C-buff o cartão aparece na lista da compacta (${W})`, (await cartao.count()) === 1);
    await cartao.first().click(); await espera(p, 400);
    await p.locator("[data-c2] [data-encerrar-c2]").first().click(); await espera(p, 500);
    check(`C-buff Encerrar pela compacta tira só o buff de mesa (${W})`, !((await sessao(p, f.id))?.buffs ?? []).some((x) => x.nome === "Na Compacta"));
    await ctx.close();
  }
}
await encerra();
