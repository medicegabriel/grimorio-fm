/* Os Estados da Alma, todos automáticos (Livro p.312, 2026-11-09).

   Danificado (<75%), Instável (<50%) e Crítico (<25%) impõem, cada um: a penalidade nas rolagens, o custo extra de
   energia/estamina, as Condições Exposto e Fragilizado e, no Crítico, a desvantagem. O 0 de Integridade acende o Estado
   Destruído. Vale nos dois regimes da Alma (pilha do livro e porcentagem do Addon). O interruptor "Estados da Alma
   (referência)" saiu: não há o que ligar. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AE = await import(R + "afty-alma-estados.js");
const { prepararRolagemEspecializacao } = await import(R + "ficha/ficha-especializacoes.js");
const { testeDeIntegridade } = await import(R + "ficha/ficha-alma.js");
const { ESTADOS_NATIVOS_EXTRAS } = await import(R + "afty-extras-nativos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. A REGRA, EM FOLHA                                          */
/* ============================================================ */
const chave = (a, m) => AE.chaveDoEstadoDaAlma(a, m);
t("íntegra é Estável", chave(120, 120), "estavel");
t("exatamente 75% segue Estável (leitura adotada)", chave(90, 120), "estavel");
t("abaixo de 75% é Danificado", chave(89, 120), "danificado");
t("exatamente 50% segue Danificado", chave(60, 120), "danificado");
t("abaixo de 50% é Instável", chave(59, 120), "instavel");
t("exatamente 25% segue Instável", chave(30, 120), "instavel");
t("abaixo de 25% é Crítico", chave(29, 120), "critico");
t("1 de Integridade ainda é Crítico", chave(1, 120), "critico");
t("0 de Integridade é Destruído", chave(0, 120), "destruido");
t("sem corrente vale íntegra", chave(null, 120), "estavel");
t("sem total não inventa Estado", chave(10, 0), "estavel");
t("as penalidades do livro", ["estavel", "danificado", "instavel", "critico"].map((k) => AE.ALMA_ESTADOS[k].penalidade), [0, -3, -6, -8]);
t("o custo extra do livro", ["estavel", "danificado", "instavel", "critico"].map((k) => AE.ALMA_ESTADOS[k].custoPE), [0, 2, 3, 5]);
t("as Condições do livro", ["estavel", "danificado", "instavel", "critico"].map((k) => AE.ALMA_ESTADOS[k].condicoes), [[], [], ["Exposto"], ["Exposto", "Fragilizado"]]);
t("só o Crítico tem desvantagem", ["estavel", "danificado", "instavel", "critico"].map((k) => AE.ALMA_ESTADOS[k].desvantagem), [false, false, false, true]);
t("Estável não impõe nada (roda uma passada só)", AE.estadoDaAlmaImpoe("estavel"), false);
t("Danificado impõe", AE.estadoDaAlmaImpoe("danificado"), true);
t("o Destruído não impõe número (a morte é da mesa)", AE.estadoDaAlmaImpoe("destruido"), false);
t("o aviso do Estável é nulo", AE.avisoDoEstadoDaAlma(AE.estadoDaAlma(120, 120)), null);
t("o aviso do Crítico", AE.avisoDoEstadoDaAlma(AE.estadoDaAlma(10, 120)), "Alma Crítica");
t("o id da Condição imposta", AE.entradasDeCondicaoDaAlma("critico").map((c) => c.id), ["alma:Exposto", "alma:Fragilizado"]);
t("o interruptor de referência saiu", ESTADOS_NATIVOS_EXTRAS.some((e) => e.id === "alma_info"), false);

/* ============================================================ */
/* 2. O DERIVE, NO PLAYER (120 PV, a Alma é uma pilha)           */
/* ============================================================ */
const base = createBlankAfty();
const player = {
  ...base, rulesVersion: "player", system: "player",
  core: { ...base.core, nd: 19 },
  especializacoes: [{ id: "combatente", nivel: 19 }],
};
const em = (f, atual) => deriveAfty(f, { almaAtual: atual });
const cheio = em(player, 120);
t("controle: a Alma do Player é o PV", [cheio.almaMax, cheio.almaPilha, cheio.almaEstado.chave], [120, true, "estavel"]);
const pericia = (d, id) => d.testes.pericias.find((p) => p.id === id)?.bonus;
const tr = (d, id) => d.testes.resistencias.find((r) => r.value === id)?.bonus;
const acerto = (d, id) => d.testes.ataques.find((a) => a.id === id)?.bonus;
const detalhes = (d, canal) => d.efeitos.detalhes.filter((e) => e.canal === canal && e.nome?.startsWith("Estado da Alma"));
const condicoes = (d) => (d.condicoes?.lista ?? []).filter((c) => String(c.id).startsWith("alma:")).map((c) => c.nome);

for (const [atual, pen, custo, conds, desv] of [
  [90, 0, 0, [], false],
  [89, -3, 2, [], false],
  [59, -6, 3, ["Exposto"], false],
  [29, -8, 5, ["Exposto", "Fragilizado"], true],
]) {
  const d = em(player, atual);
  const rot = `Player ${atual}/120`;
  t(`${rot}: a Perícia leva ${pen}`, pericia(d, "percepcao") - pericia(cheio, "percepcao"), pen);
  t(`${rot}: o TR leva ${pen}`, tr(d, "reflexos") - tr(cheio, "reflexos"), pen);
  t(`${rot}: o Acerto leva ${pen}`, acerto(d, "amaldicoado") - acerto(cheio, "amaldicoado"), pen);
  t(`${rot}: a Iniciativa leva ${pen}`, d.iniciativa - cheio.iniciativa, pen);
  t(`${rot}: o custo extra é ${custo}`, detalhes(d, "custoPE").map((e) => e.valor), custo ? [-custo] : []);
  t(`${rot}: as Condições impostas`, condicoes(d), conds);
  t(`${rot}: a desvantagem`, d.almaEstado.desvantagem, desv);
}

/* O Exposto da Alma é a Condição de verdade: o mesmo que o catálogo marcado à mão faria, e Fragilizado zera a RD. */
t("Fragilizado da Alma Crítica chega ao derive, com a origem no hover", em(player, 29).condicoes.fragilizado, "Fragilizado (Estado da Alma (Crítico))");
t("só o Crítico fragiliza", [em(player, 59).condicoes.fragilizado, em(player, 89).condicoes.fragilizado], [null, null]);
t("a Defesa não leva a penalidade da Alma", em(player, 59).defesa - em(player, 90).defesa <= 0, true);
t("sem almaAtual a ficha sai Estável (o criador nunca vê o Estado)", deriveAfty(player).almaEstado.chave, "estavel");

/* Dois derives do mesmo estado dão o mesmo resultado (a segunda passada é determinística). */
t("derivar duas vezes dá o mesmo número", em(player, 29).testes.pericias.map((p) => p.bonus), em(player, 29).testes.pericias.map((p) => p.bonus));

/* ============================================================ */
/* 3. A CRIATURA NOVA E A ANTIGA                                  */
/* ============================================================ */
const nova = { ...base, core: { ...base.core, nd: 12 } };
const hpN = deriveAfty(nova).hp;
t("criatura nova: a Alma é o PV", [deriveAfty(nova).almaMax, deriveAfty(nova).almaPilha], [hpN, true]);
t("criatura nova: 25% da Alma é Danificado", em(nova, Math.floor(hpN * 0.7)).almaEstado.chave, "danificado");
t("criatura nova: a Alma ferida também impõe Exposto no Instável", condicoes(em(nova, Math.floor(hpN * 0.4))), ["Exposto"]);
const antiga = { ...nova };
delete antiga.regimeAlma;
t("criatura antiga: a Alma é 100", [deriveAfty(antiga).almaMax, deriveAfty(antiga).almaPilha], [100, false]);
t("criatura antiga: 70 de 100 é Danificado", em(antiga, 70).almaEstado.chave, "danificado");
t("criatura antiga: 20 de 100 é Crítico, com Fragilizado", [em(antiga, 20).almaEstado.chave, condicoes(em(antiga, 20))], ["critico", ["Exposto", "Fragilizado"]]);
t("criatura antiga: 0 de 100 é Destruído", em(antiga, 0).almaEstado.chave, "destruido");

/* ============================================================ */
/* 4. A DESVANTAGEM NA ROLAGEM                                    */
/* ============================================================ */
const sessao = { rodada: 1, hpAtual: 100, uso: { acoes: { turno: 0 } }, combate: {} };
const pedido = { tipo: "teste", rotulo: "Percepção", bonus: 5 };
const modoDe = (d, modo) => prepararRolagemEspecializacao({ ...pedido, ...(modo ? { modo } : {}) }, sessao, d).modo;
t("Alma Estável: o teste segue como veio", modoDe(em(player, 120), null), undefined);
t("Alma Instável: sem desvantagem", modoDe(em(player, 59), null), undefined);
t("Alma Crítica: o teste ganha desvantagem", modoDe(em(player, 29), null), "desvantagem");
t("Alma Crítica: o modo normal vira desvantagem", modoDe(em(player, 29), "normal"), "desvantagem");
t("Alma Crítica: a vantagem escolhida se anula (p.282)", modoDe(em(player, 29), "vantagem"), "normal");
t("Alma Crítica: o dano não ganha desvantagem",
  prepararRolagemEspecializacao({ tipo: "dano", rotulo: "Golpe" }, sessao, em(player, 29)).modo, undefined);
const integ = (d, natural) => testeDeIntegridade(d, { cd: 10, rng: () => (natural - 0.5) / 20 }).rolagem?.modo;
t("o Teste de Integridade da Alma Crítica rola com desvantagem", integ(em(player, 29), 12), "desvantagem");
t("o Teste de Integridade da Alma Estável rola normal", integ(em(player, 120), 12), "normal");

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
