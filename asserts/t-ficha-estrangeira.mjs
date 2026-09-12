/* A FRONTEIRA ENTRE OS DOIS LIVROS.

   Em 2026-09-12 chegou um erro de produção de um usuário do Grimório público:

     TypeError: (e ?? []) is not iterable
       em collectAutomationEntities <- CombatantPanel <- CombatTracker

   A causa é uma ficha do Grimório Afty morando no inventário da 2.5.2. As duas
   gravam um campo `treinamentos`, e ele tem FORMA DIFERENTE em cada livro: na
   2.5.2 é LISTA de instâncias, e aqui é MAPA `{ [linhaId]: progresso }`. O
   `?? []` do coletor da 2.5.2 só cobre nulo, então o mapa passa e o `for...of`
   estoura.

   O que este arquivo mede não é o estouro em si, é a REGRA que impede a ficha
   de chegar lá: `sistemaGravado` responde de que livro a ficha é sem chutar, e
   é ela que o `src/App.jsx` lê para escolher a tela e para barrar o importador.

   ⚠ O ASSERT DO ESTOURO ESTÁ AQUI DE PROPÓSITO, e ele passa quando a ficha do
   Afty QUEBRA o coletor da 2.5.2. Ele não está pedindo que o coletor tolere o
   mapa: tolerar seria trocar um erro barulhento por uma ficha do Afty derivando
   com régua da 2.5.2, calada. Ele existe para que o dia em que alguém unificar
   as duas formas, ou "consertar" o coletor, seja um dia em que este arquivo
   falha e alguém lê o porquê. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const C = new URL("../src/components/", import.meta.url).href;
const { createBlankAfty } = await import(R + "afty-schema.js");
const S = await import(R + "afty-sistema.js");
const { collectAutomationEntities } = await import(C + "fm-automation-entities.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. De que livro é a ficha                                     */
/* ============================================================ */

t("a ficha do Afty se declara", S.sistemaGravado({ rulesVersion: "afty" }), "afty");
t("a do jogador tambem", S.sistemaGravado({ rulesVersion: "player" }), "player");

/* ⚠ AQUI MORA A DIFERENÇA PARA O `sistemaDaFicha`, e ela é o conserto inteiro.
   O `sistemaDaFicha` cai no padrão "afty" para qualquer entrada que não conheça,
   porque quem o chama já sabe que a ficha é daqui. Numa pergunta de FRONTEIRA
   esse padrão é a resposta errada, e errada calada. */
for (const alheia of [{ rulesVersion: "2.5.2" }, {}, null, undefined, { rulesVersion: 7 }]) {
  t(`ficha alheia ${JSON.stringify(alheia)} nao e daqui`, S.sistemaGravado(alheia), null);
  t(`  e o sistemaDaFicha diria que e`, S.sistemaDaFicha(alheia), "afty");
}

/* A lista de ids é UMA só, e vem do catálogo de sistemas. */
t("so responde os ids do catalogo", S.SISTEMA_IDS.map((id) => S.sistemaGravado({ rulesVersion: id })),
  S.SISTEMA_IDS);

/* ============================================================ */
/* 2. Por que a ficha do Afty não pode entrar no motor da 2.5.2  */
/* ============================================================ */

const doAfty = createBlankAfty();
t("o Afty grava treinamentos como MAPA", Array.isArray(doAfty.treinamentos), false);
t("e nasce com o rulesVersion dele", doAfty.rulesVersion, "afty");

const estourou = (ficha) => {
  try { collectAutomationEntities(ficha); return false; } catch { return true; }
};
t("a ficha do Afty QUEBRA o coletor da 2.5.2", estourou(doAfty), true);
t("e a da 2.5.2 passa limpa",
  collectAutomationEntities({ name: "x", rulesVersion: "2.5.2", treinamentos: [] }), []);

/* ⚠ O `?? []` NÃO COBRE O MAPA, e é por isso que o erro era TypeError e não
   lista vazia. Deixado escrito porque a leitura apressada do coletor diz o
   contrário. */
t("nulo o `?? []` cobre", estourou({ treinamentos: null }), false);
t("mapa vazio ele nao cobre", estourou({ treinamentos: {} }), true);

/* ============================================================ */
/* 3. A porta, como o App.jsx a lê                               */
/* ============================================================ */

/* A regra é uma comparação só, e é a mesma nas duas portas (a do importador e
   a da escolha de tela): a ficha pertence ao inventário cujo sistema é o dela.
   Fora do ambiente privado a rota vale `null`, que é o que a 2.5.2 grava. */
const ehDestaRota = (sistemaDaRota) => (ficha) => S.sistemaGravado(ficha) === sistemaDaRota;

const pacote = [
  { name: "Criatura da 2.5.2", rulesVersion: "2.5.2" },
  { name: "Sem campo nenhum" },
  { name: "Criatura do Afty", rulesVersion: "afty" },
  { name: "Personagem", rulesVersion: "player" },
];
const nomes = (rota) => pacote.filter(ehDestaRota(rota)).map((c) => c.name);

t("o Grimorio publico aceita so as dele", nomes(null), ["Criatura da 2.5.2", "Sem campo nenhum"]);
t("o /Afty aceita so a criatura dele", nomes("afty"), ["Criatura do Afty"]);
t("o /Player aceita so o personagem", nomes("player"), ["Personagem"]);

/* E o que sobra é o que o aviso tem de nomear. Recusa sem nome na tela seria o
   defeito calado que a porta existe para não criar. */
t("o publico recusa as duas do outro livro",
  pacote.filter((c) => !ehDestaRota(null)(c)).map((c) => S.getSistema(c.rulesVersion).label),
  ["Grimório Afty", "Ficha de Player"]);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
