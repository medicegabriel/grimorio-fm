/* PRÉVIA DAS TRÊS ABAS: armas, crítico, fontes e Técnica Máxima, por cliques reais, teclado e toque.
   Esperados independentes: o contrato de `preparaRolagemArma` (Acerto recusa o bloqueio, Dano aceita o disparo pendente) e o de
   `usaTecnicaMaxima` (Usar paga e abre recarga, a rolagem do uso pago segue livre). */
import { abre, aba, passo, check, foto, encerra, espera, etapa, sessaoGravada, linha, rolarDe } from "./lib.mjs";

const disabled = (loc) => loc.getAttribute("aria-disabled").then((v) => v === "true");
/* O Playwright não clica em `aria-disabled` (não é `force`): o clique real vai pelo mouse no centro do botão, coberto ou não. */
const cliqueReal = async (p, loc) => { await loc.scrollIntoViewIfNeeded(); const b = await loc.boundingBox(); await p.mouse.click(b.x + b.width / 2, b.y + b.height / 2); };
const logDe = async (p, ficha) => (await sessaoGravada(p, ficha))?.log ?? [];

/* ---------- 1. Arma de capacidade 1 ---------- */
{
  passo("arma de capacidade 1: Acerto, Dano do disparo, recusa e Recarregar fora de combate");
  const { ctx, p } = await abre({ ficha: "arsenal", sorte: 0.5 });
  const besta = linha(p, "dano:armc_besta");
  const acerto = rolarDe(p, "dano:armc_besta", "Acerto");
  const dano = rolarDe(p, "dano:armc_besta", "Dano");
  check("partida: Munição 1/1, Acerto e Dano livres", (await besta.locator("[data-m-municao]").textContent()) === "Munição 1/1" && !(await disabled(acerto)) && !(await disabled(dano)));
  const log0 = (await logDe(p, "arsenal")).length;
  await acerto.click();
  await espera(p, 200);
  check("Acerto gasta a última munição", (await besta.locator("[data-m-municao]").textContent()) === "Munição 0/1");
  check("o Dano do disparo pendente continua livre", !(await disabled(dano)));
  check("o novo Acerto é recusado, com o motivo visível", (await disabled(acerto)) && (await besta.locator(".m-motivo").first().textContent()).includes("Recarregue a Arma"));
  const motivoId = await acerto.getAttribute("aria-describedby");
  check("o motivo está ligado ao botão por aria-describedby", !!motivoId && (await p.locator(`[id="${motivoId}"]`).textContent()).includes("Recarregue a Arma"), motivoId);
  await dano.click();
  await espera(p, 200);
  check("o Dano rola uma vez", (await logDe(p, "arsenal")).length === log0 + 2);
  check("depois do Dano, o Dano também recusa (bloqueio sem pendente)", await disabled(dano));
  const antes = (await logDe(p, "arsenal")).length;
  await cliqueReal(p, acerto);
  await espera(p, 250);
  check("clicar no Acerto recusado não rola", (await logDe(p, "arsenal")).length === antes);
  check("e anuncia o motivo no aviso do G2", ((await p.locator(".m-aviso-flutuante").textContent().catch(() => "")) ?? "").includes("Recarregue a Arma"));
  /* Teclado: o botão recusado continua alcançável por Tab. */
  await besta.locator(".m-linha-nome").focus();
  let chegou = false;
  for (let i = 0; i < 12 && !chegou; i++) { await p.keyboard.press("Tab"); chegou = await acerto.evaluate((el) => el === document.activeElement); }
  check("o Acerto recusado recebe foco pelo Tab", chegou);
  /* Fora de combate, o Recarregar continua valendo. */
  await p.locator("button.e-combate").click();
  await espera(p, 300);
  check("saiu de combate", (await p.locator("button.e-combate").getAttribute("aria-pressed")) !== "true");
  await besta.locator(".m-linha-nome").click();
  await besta.getByRole("button", { name: "Recarregar", exact: true }).click();
  await espera(p, 250);
  check("Recarregar fora de combate devolve a munição", (await besta.locator("[data-m-municao]").textContent()) === "Munição 1/1" && !(await disabled(acerto)));
  await foto(p, "armas-besta-detalhe");
  check("sem erro de página", etapa.erros.length === 0, etapa.erros);
  await ctx.close();
}

/* ---------- 2. Oscilante: Errou trava só o Dano ---------- */
{
  passo("Oscilante: Errou recusa só o Dano, Acertou libera");
  const { ctx, p } = await abre({ ficha: "arsenal", sorte: 0.5 });
  const chave = "dano:armc_oscilante";
  const l = linha(p, chave);
  await rolarDe(p, chave, "Acerto").click();
  await espera(p, 200);
  await l.locator(".m-linha-nome").click();
  await l.getByRole("button", { name: "Errou", exact: true }).click();
  await espera(p, 250);
  check("Errou: o Dano recusa com o motivo", (await disabled(rolarDe(p, chave, "Dano"))) && (await l.locator(".m-motivo").first().textContent()).includes("Errou"));
  check("o Acerto segue livre", !(await disabled(rolarDe(p, chave, "Acerto"))));
  await l.getByRole("button", { name: "Acertou", exact: true }).click();
  await espera(p, 250);
  check("Acertou: o Dano volta", !(await disabled(rolarDe(p, chave, "Dano"))));
  await ctx.close();
}

/* ---------- 3. Emperrar: pífia com o sorteio fixo em 1 ---------- */
{
  passo("Emperrar: a pífia recusa o Dano daquele golpe e o próximo Acerto, até Desemperrar");
  const { ctx, p } = await abre({ ficha: "arsenal", sorte: 0 });
  const chave = "dano:armc_besta";
  const l = linha(p, chave);
  await rolarDe(p, chave, "Acerto").click();
  await espera(p, 250);
  check("Dano do golpe que errou recusado (Errou)", (await disabled(rolarDe(p, chave, "Dano"))) && (await l.locator(".m-motivos").textContent()).includes("Errou"));
  check("próximo Acerto recusado (Arma Emperrada)", (await disabled(rolarDe(p, chave, "Acerto"))) && (await l.locator(".m-motivos").textContent()).includes("Arma Emperrada"));
  await l.locator(".m-linha-nome").click();
  await l.getByRole("button", { name: "Desemperrar", exact: true }).click();
  await l.getByRole("button", { name: "Recarregar", exact: true }).click();
  await espera(p, 250);
  check("Desemperrar e Recarregar devolvem o Acerto", !(await disabled(rolarDe(p, chave, "Acerto"))));
  await ctx.close();
}

/* ---------- 4. Crítico pendente atravessa a troca de aba ---------- */
{
  passo("crítico pendente: Acerto 20, ida aos Efeitos e volta, Dano consome");
  const { ctx, p } = await abre({ ficha: "arsenal", sorte: 0.999 });
  const chave = "dano:armc_modular";
  const l = linha(p, chave);
  await rolarDe(p, chave, "Acerto").click();
  await espera(p, 250);
  check("o Acerto 20 marca Crítico Pendente", (await l.textContent()).includes("Crítico Pendente"));
  await aba(p, "buffs");
  await aba(p, "pericias");
  await aba(p, "acoes");
  check("depois de Efeitos e Perícias, a marca segue", (await l.textContent()).includes("Crítico Pendente"));
  const n = (await logDe(p, "arsenal")).length;
  await rolarDe(p, chave, "Dano").click();
  await espera(p, 250);
  const log = await logDe(p, "arsenal");
  check("o Dano rola no modo Crítico e consome a marca", log.length === n + 1 && !(await l.textContent()).includes("Crítico Pendente"), { rotulo: log[0]?.rotulo, critico: log[0]?.critico, modo: log[0]?.modoDano, formula: log[0]?.formula });
  await ctx.close();
}

/* ---------- 5. Fontes sem rolagem acidental: hover, teclado, toque longo ---------- */
{
  passo("fontes: hover e foco abrem sem rolar, Enter rola");
  const { ctx, p } = await abre({ ficha: "arsenal", sorte: 0.5 });
  const chave = "dano:armc_ampla";
  const acerto = rolarDe(p, chave, "Acerto");
  const n = (await logDe(p, "arsenal")).length;
  await acerto.hover();
  await espera(p, 250);
  check("hover abre as fontes", await p.locator(".afty-fontes-flutuante").isVisible());
  check("hover não rola", (await logDe(p, "arsenal")).length === n);
  await p.mouse.move(5, 5);
  await linha(p, chave).locator(".m-linha-nome").focus();
  let chegou = false;
  for (let i = 0; i < 12 && !chegou; i++) { await p.keyboard.press("Tab"); chegou = await acerto.evaluate((el) => el === document.activeElement); }
  await espera(p, 200);
  check("o foco do teclado abre as fontes", chegou && await p.locator(".afty-fontes-flutuante").isVisible());
  check("foco não rola", (await logDe(p, "arsenal")).length === n);
  await p.keyboard.press("Escape");
  await espera(p, 150);
  check("Esc fecha as fontes sem fechar nada mais", (await p.locator(".afty-fontes-flutuante").count()) === 0);
  await p.keyboard.press("Enter");
  await espera(p, 200);
  check("Enter rola", (await logDe(p, "arsenal")).length === n + 1);
  await ctx.close();
}
{
  passo("fontes no toque: toque longo abre, e o clique que vem junto não rola");
  const { ctx, p } = await abre({ ficha: "arsenal", largura: 390, altura: 844, toque: true, sorte: 0.5 });
  const acerto = rolarDe(p, "dano:armc_ampla", "Acerto");
  await acerto.scrollIntoViewIfNeeded();
  const n = (await logDe(p, "arsenal")).length;
  await acerto.dispatchEvent("pointerdown", { pointerType: "touch", isPrimary: true });
  await espera(p, 650);
  await acerto.dispatchEvent("pointerup", { pointerType: "touch", isPrimary: true });
  await acerto.dispatchEvent("click");
  await espera(p, 250);
  check("o toque longo abriu as fontes", await p.locator(".afty-fontes-flutuante").isVisible());
  check("e não rolou", (await logDe(p, "arsenal")).length === n);
  await acerto.tap();
  await espera(p, 250);
  check("um toque simples rola", (await logDe(p, "arsenal")).length === n + 1);
  await ctx.close();
}

/* ---------- 6. Técnica Máxima: Usar e Rolar separados ---------- */
{
  passo("Técnica Máxima: Usar paga e abre a recarga, o uso pago rola, novo Usar recusa");
  const { ctx, p } = await abre({ ficha: "conjurador", sorte: 0.5 });
  const l = p.locator('[data-m-linha^="feitico:"]').filter({ hasText: "Ruptura Vital" });
  const s0 = await sessaoGravada(p, "conjurador");
  await l.locator(".m-linha-nome").click();
  const usar = l.locator('[data-afty-tecnica-maxima] button').filter({ hasText: /^Usar \d+ PE$/ });
  const custo = Number((await usar.textContent()).match(/\d+/)[0]);
  await usar.click();
  await espera(p, 300);
  const s1 = await sessaoGravada(p, "conjurador");
  check("Usar desconta o custo", s1.peAtual === s0.peAtual - custo, { antes: s0.peAtual, depois: s1.peAtual, custo });
  check("a recarga começou e o Usar mostra o motivo", (await l.locator("[data-m-tm-usar]").textContent()).startsWith("Usar: Recarga"));
  check("o novo Usar está recusado", await usar.isDisabled());
  const rolar = l.locator(".m-linha-topo .m-rolar button.afty-rolavel");
  check("a rolagem do uso pago NÃO está travada pela recarga", !(await disabled(rolar)));
  await rolar.click();
  await espera(p, 300);
  const s2 = await sessaoGravada(p, "conjurador");
  check("rolou uma vez e pagou o Custo de Vida da ativação", s2.log.length === s1.log.length + 1 && s2.hpAtual < s1.hpAtual, { log: [s1.log.length, s2.log.length], hp: [s1.hpAtual, s2.hpAtual] });
  check("a rolagem não desconta PE", s2.peAtual === s1.peAtual);
  /* Sem PE para outro uso: a rolagem continua livre. */
  await p.evaluate((id) => { const k = `fm_ficha_sessao_afty_v1:${id}`; const s = JSON.parse(localStorage.getItem(k)); s.peAtual = 0; localStorage.setItem(k, JSON.stringify(s)); }, "teste-abas-conjurador");
  await p.reload(); await p.locator("#afty-ficha").waitFor(); await espera(p, 500);
  const l2 = p.locator('[data-m-linha^="feitico:"]').filter({ hasText: "Ruptura Vital" });
  check("com 0 PE, a rolagem segue livre", !(await disabled(l2.locator(".m-linha-topo .m-rolar button.afty-rolavel"))));
  await foto(p, "tecnica-maxima-recarga");
  check("sem erro de página", etapa.erros.length === 0, etapa.erros);
  await ctx.close();
}
await encerra("interacao-armas");
