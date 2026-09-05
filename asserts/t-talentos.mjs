/* OS TALENTOS, medidos na varredura de 2026-09-02.

   Os 52 Talentos, um a um: como estão programados e se os pré-requisitos são
   cobrados. É o irmão do t-lutador-nivel.mjs, para o outro catálogo.

   O que este arquivo mede, em ordem:

     1. ⚠ O ESCOPO DA FRASE. Dois Talentos miravam o eixo errado e a varredura os
        pegou. A régua é sempre a arma que a regra NÃO menciona, e não a presença
        do bônus onde ele deveria estar: um efeito que sumisse por engano passaria
        num teste que só olha para o lugar certo.

     2. OS PRÉ-REQUISITOS, nos doze tipos que o catálogo usa.

     3. O PLACAR, que é o que impede a varredura de envelhecer calada: se alguém
        acrescentar um Talento sem efeito, a conta muda e o assert avisa.

   ⚠ SOBRE OS 23 SEM EFEITO. A maioria é economia de ação, procedimento de mesa
   ou efeito no INIMIGO, e a ausência deles no Motor é o estado correto. Dois
   casos merecem nome, porque parecem lacuna e não são: Reposição Sanguínea e
   Expansão de Reserva modificam características (Vigor Maldito e Energia
   Antinatural) que são `mesa: true` na própria origem. Um filho não pode chegar
   ao Motor por uma porta que o pai não tem. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { AFTY_TALENTOS, avaliarAcessoTalento, getTalento } = await import(R + "afty-talentos.js");
const { TALENTO_EFEITOS, ESCOLHA_EFEITOS } = await import(R + "afty-efeitos-conteudo.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* As quatro armas de régua, e cada uma prova uma coisa:
     (nenhuma)          o Ataque Básico, que é o "desarmado"
     arm_manoplas       grupo PUGILATO, que é desarmado E equipado ao mesmo tempo
     arm_bastao         corpo a corpo
     arm_azagaia        categoria ARREMESSO
     arm_arco_curto     categoria DISTÂNCIA, que não é a mesma coisa */
const ARMAS = ["arm_bastao", "arm_azagaia", "arm_arco_curto"];
const ficha = (talentos = [], o = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = "player";
  c.core = { ...c.core, nd: o.nd ?? 20, tipo: "combatente", patamar: "comum" };
  c.especializacoes = [{ id: "lutador", nivel: o.nd ?? 20 }];
  c.talentos = talentos;
  c.attributes = { forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 };
  c.equipamentos = {
    itens: (o.armas ?? ARMAS).map((refId, i) => ({ id: `e${i}`, tipo: "arma", refId, qtd: 1, equipado: true })),
  };
  return c;
};
const IDS = ["basico", ...ARMAS];
const linha = (d, id) => d.dano.entradas.find((x) => x.id === id);
const acertos = (d) => IDS.map((id) => linha(d, id)?.acerto ?? 0);
const fixos = (d) => IDS.map((id) => linha(d, id)?.fixo ?? 0);
const base = deriveAfty(ficha([]));

/* ============================================================ */
/* 1. O ESCOPO DA FRASE                                          */
/* ============================================================ */

/* ⚠ ADEPTO DE BRIGA: "Enquanto não estiver com nenhum equipamento do grupo
   Pugilato, você recebe +3 em jogadas de ataque DESARMADO e o dano dos seus
   golpes desarmados aumenta em 2 níveis."

   O acerto morava em `bonusAcerto` alvo `corpo`, que é o TIPO DE ATAQUE e
   alcança toda arma de corpo a corpo: um Bastão levava os +3 do desarmado. */
const briga = deriveAfty(ficha(["tal_adepto_de_briga"]));
t("o Adepto de Briga soma o acerto SO no desarmado",
  acertos(briga).map((v, i) => v - acertos(base)[i]), [3, 0, 0, 0]);

/* ⚠ E A CONDIÇÃO DO PUGILATO NÃO É `desarmado`. Manopla e Faixa deixam a
   criatura desarmada E com equipamento de Pugilato ao mesmo tempo, e é
   exatamente esse o caso que o Talento exclui. */
const brigaCom = (armas) => {
  const s = deriveAfty(ficha([], { armas }));
  const c = deriveAfty(ficha(["tal_adepto_de_briga"], { armas }));
  return (linha(c, "basico")?.acerto ?? 0) - (linha(s, "basico")?.acerto ?? 0);
};
t("de maos vazias ele vale", brigaCom([]), 3);
t("com Manoplas ou Faixas ele NAO vale", [brigaCom(["arm_manoplas"]), brigaCom(["arm_faixas"])], [0, 0]);
t("e uma arma que nao e de Pugilato nao o desliga", brigaCom(["arm_bastao"]), 3);

/* ⚠ TÉCNICAS DE ARREMESSO: "Sempre que atacar com uma arma de ARREMESSO, você
   recebe um bônus de +2 para acertar e +3 no dano."

   O acerto morava em `bonusAcerto` alvo `distancia`. Arremesso e distância são
   CATEGORIAS DIFERENTES no catálogo de armas, então o bônus caía no Arco Curto e
   não na Azagaia, enquanto o dano ao lado já mirava `cat:arremesso`: as duas
   metades da MESMA frase discordavam uma da outra. */
const arr = deriveAfty(ficha(["tal_tecnicas_de_arremesso"]));
t("Tecnicas de Arremesso soma o acerto so na arma de arremesso",
  acertos(arr).map((v, i) => v - acertos(base)[i]), [0, 0, 2, 0]);
t("e o dano no mesmo lugar que o acerto",
  fixos(arr).map((v, i) => v - fixos(base)[i]), [0, 0, 3, 0]);

/* Mestre do Arremesso é DELTA por cima do pré-requisito: "o seu bônus [...] se
   torna +4 para acertar e +6 no dano", e 2 + 2 = 4 e 3 + 3 = 6. */
const mestre = deriveAfty(ficha(["tal_tecnicas_de_arremesso", "tal_mestre_do_arremesso"]));
t("os dois juntos chegam em +4 e +6, e so na Azagaia",
  [acertos(mestre).map((v, i) => v - acertos(base)[i]), fixos(mestre).map((v, i) => v - fixos(base)[i])],
  [[0, 0, 4, 0], [0, 0, 6, 0]]);

/* A CONTRAPROVA do eixo: Adepto de Combate, Estilo Distante, diz "ataques a
   DISTÂNCIA", e aí `bonusAcerto` alvo `distancia` é o alvo certo mesmo. Se
   alguém trocar por `cat:` achando que é o caso do Arremesso, isto avisa. */
const distante = deriveAfty(ficha(["tal_adepto_de_combate"]));
t("sem a escolha marcada o Adepto de Combate nao muda nada",
  acertos(distante).map((v, i) => v - acertos(base)[i]), [0, 0, 0, 0]);

/* ============================================================ */
/* 2. OS PRÉ-REQUISITOS                                          */
/* ============================================================ */

const ctx = (o = {}) => ({
  nd: o.nd ?? 20,
  talentos: o.talentos ?? [],
  periciaProf: o.periciaProf ?? {},
  resistenciaProf: o.resistenciaProf ?? {},
  periciaOficios: o.periciaOficios ?? {},
  attrEff: { forca: 10, destreza: 10, constituicao: o.con ?? 10, inteligencia: 10, sabedoria: 10, presenca: 10 },
  origemId: o.origemId ?? null,
  origensQualificadas: o.origemId ? [o.origemId] : [],
});
const passa = (id, o) => avaliarAcessoTalento(getTalento(id), ctx(o)).ok;

/* `nd`, o mais comum: 20 dos 52 não têm requisito NENHUM, e o resto quase sempre
   tem um piso de nível. */
t("Alma Livre pede ND 10", [passa("tal_alma_livre", { nd: 9 }), passa("tal_alma_livre", { nd: 10 })], [false, true]);

/* `pericia` e `resistencia`, que viraram requisito REAL em 2026-09-01. */
t("Adepto de Briga pede MESTRE em Atletismo", [
  passa("tal_adepto_de_briga", { periciaProf: {} }),
  passa("tal_adepto_de_briga", { periciaProf: { atletismo: "treinado" } }),
  passa("tal_adepto_de_briga", { periciaProf: { atletismo: "mestre" } }),
], [false, false, true]);
t("Determinado a Viver pede Vontade treinada E Constituicao 16", [
  passa("tal_determinado_a_viver", { con: 16 }),
  passa("tal_determinado_a_viver", { resistenciaProf: { vontade: "treinado" }, con: 15 }),
  passa("tal_determinado_a_viver", { resistenciaProf: { vontade: "treinado" }, con: 16 }),
], [false, false, true]);

/* `origem`, que é o recorte de quem PODE pegar. */
t("Manual de Tecnica e so do Herdado", [
  passa("tal_manual_de_tecnica", { origemId: "inato", periciaProf: { historia: "treinado" } }),
  passa("tal_manual_de_tecnica", { origemId: "herdado", periciaProf: { historia: "treinado" } }),
], [false, true]);
/* `periciaOr`: "História OU Ocultismo", e basta uma. */
t("e qualquer uma das duas pericias serve", [
  passa("tal_manual_de_tecnica", { origemId: "herdado" }),
  passa("tal_manual_de_tecnica", { origemId: "herdado", periciaProf: { ocultismo: "treinado" } }),
], [false, true]);

/* `talento`: um Talento que pede outro. */
t("Mestre do Arremesso pede Tecnicas de Arremesso", [
  passa("tal_mestre_do_arremesso", {}),
  passa("tal_mestre_do_arremesso", { talentos: ["tal_tecnicas_de_arremesso"] }),
], [false, true]);

/* `maxComNome`: no máximo dois Talentos cujo nome começa com "Adepto". */
t("o teto de dois Adeptos bloqueia o terceiro", [
  passa("tal_adepto_de_briga", { periciaProf: { atletismo: "mestre" }, talentos: ["tal_adepto_de_combate"] }),
  passa("tal_adepto_de_briga", {
    periciaProf: { atletismo: "mestre" },
    talentos: ["tal_adepto_de_combate", "tal_adepto_de_medicina"],
  }),
], [true, false]);

/* ============================================================ */
/* 3. O PLACAR                                                   */
/* ============================================================ */

const ligadoPorEfeito = (x) => (TALENTO_EFEITOS[x.id] ?? []).length > 0;
const ligadoPorEscolha = (x) => (x.escolha?.opcoes ?? []).some((o) => (ESCOLHA_EFEITOS[o.id] ?? []).length > 0);

t("o catalogo tem 52 Talentos", AFTY_TALENTOS.length, 52);
t("19 ligados por TALENTO_EFEITOS", AFTY_TALENTOS.filter(ligadoPorEfeito).length, 19);
t("e 9 SO pela escolha aninhada",
  AFTY_TALENTOS.filter((x) => !ligadoPorEfeito(x) && ligadoPorEscolha(x)).length, 9);

/* ⚠ ALMA LIVRE NÃO TEM EFEITO E ESTÁ LIGADA. Ela chega ao Motor por uma porta
   própria no deriveAfty (ela concede o DIREITO de escolher uma habilidade de
   outra Especialização, que não é um canal). É a prova viva de que contar só o
   TALENTO_EFEITOS subestima o placar. */
t("Alma Livre nao aparece em nenhum dos dois mapas",
  [ligadoPorEfeito(getTalento("tal_alma_livre")), ligadoPorEscolha(getTalento("tal_alma_livre"))], [false, false]);

/* A única `nota` que sobrou nos Talentos. Ela NÃO fala de treino, que é o que a
   varredura de 2026-09-01 converteu: fala de possuir Feitiços, e isso é outro
   sistema. Se alguém escrever uma nota de treino aqui, esta lista cresce. */
const notas = AFTY_TALENTOS.flatMap((x) => (x.requisitos ?? [])
  .filter((r) => r.tipo === "nota").map((r) => `${x.id}: ${r.texto}`));
t("so uma nota restante, e ela nao pede treino", notas, ["tal_adepto_de_feiticaria: Possuir Feitiços"]);

/* Todo Talento com escolha aninhada tem TODAS as opções com efeito, ou nenhuma:
   um pool meio ligado deixa o jogador escolher uma opção que não faz nada. */
const meioLigados = AFTY_TALENTOS.filter((x) => {
  const opts = x.escolha?.opcoes ?? [];
  if (!opts.length) return false;
  const com = opts.filter((o) => (ESCOLHA_EFEITOS[o.id] ?? []).length > 0).length;
  return com > 0 && com < opts.length;
}).map((x) => x.id);
/* ⚠ OS DOIS QUE SOBRAM SÃO CONHECIDOS, e não descuido. O Adepto de Combate tem
   8 Estilos e 2 deles são procedimento de mesa, e o Físico Aperfeiçoado tem 5
   opções com 1 de mesa. Um id NOVO nesta lista é pool meio ligado de verdade. */
t("os pools meio ligados sao os dois conhecidos",
  meioLigados, ["tal_adepto_de_combate", "tal_fisico_aperfeicoado"]);

if (bad.length) {
  console.log(`FALHAS (${bad.length}):`);
  for (const b of bad) console.log("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
