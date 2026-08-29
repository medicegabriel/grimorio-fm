/* CONDIÇÕES, 2026-08-28.

   O terreno preparado para os textos que o autor ainda vai mandar.

   As 26 condições existiam desde sempre como NOME dentro de uma lista de força,
   e a aba Buffs desenhava o nome com a CHAVE CRUA da força ao lado, minúscula
   ("media"), sem dizer que aquilo é a segunda de quatro. O autor pediu para ver
   "as condições, seus efeitos, o nível da condição": duas dessas três coisas já
   existiam e estavam mal desenhadas, e a terceira nunca foi escrita.

   ⚠ O `CONDICAO_TEXTOS` NASCE VAZIO, e o assert do fim tranca justamente isso:
   inventar o que faz "Fragilizado" seria número saído do nada. O que este
   arquivo prova é que, quando os textos chegarem, eles chegam CERTOS: um nome
   com acento errado é recusado no validador em vez de a condição aparecer muda.

   ⚠ Prova NÚMERO e ESTRUTURA, e não aparência. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
await import(R + "afty-derive.js");
const { CONDICOES_CATALOGO } = await import(R + "afty-feiticos.js");
const COND = await import(R + "afty-condicoes.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. AS QUATRO FORÇAS SÃO UMA ESCALA                            */
/* ============================================================ */

t("quatro forças, em ordem de gravidade",
  COND.FORCAS_CONDICAO.map((f) => [f.id, f.nivel]),
  [["fraca", 1], ["media", 2], ["forte", 3], ["extrema", 4]]);

/* O nível é o que a tela desenha como degrau, então ele tem de ser dizível: 1 a
   4, sem buraco e sem repetição. */
t("os níveis são 1..4 sem buraco",
  COND.FORCAS_CONDICAO.map((f) => f.nivel).sort((a, b) => a - b), [1, 2, 3, 4]);

/* Toda força do catálogo tem entrada na escala. Uma força escrita no catálogo e
   esquecida aqui deixaria as condições dela sem degrau nenhum na tela. */
t("nenhuma força do catálogo ficou de fora",
  Object.keys(CONDICOES_CATALOGO).filter((f) => !COND.FORCAS_CONDICAO.some((x) => x.id === f)), []);

/* ============================================================ */
/* 2. A FICHA DE UMA CONDIÇÃO                                    */
/* ============================================================ */

t("condição fraca", COND.fichaDaCondicao("Caído"), {
  nome: "Caído", forcaId: "fraca", forcaLabel: "Fraca", nivel: 1,
  resumo: null, descricao: null, doCatalogo: true,
});

t("condição extrema", COND.fichaDaCondicao("Paralisado"), {
  nome: "Paralisado", forcaId: "extrema", forcaLabel: "Extrema", nivel: 4,
  resumo: null, descricao: null, doCatalogo: true,
});

/* ⚠ NOME DESCONHECIDO NÃO SOME NEM QUEBRA. Uma condição gravada na sessão pode
   ter vindo de um Addon desinstalado, e ela continua sendo um rótulo válido em
   cima da criatura: não há linha morta para condição, e isso está anotado no
   `afty-feiticos.js`. A tela mostra o nome sem degrau. */
const orfa = COND.fichaDaCondicao("Congelado");
t("nome de fora do catálogo continua sendo condição", orfa.nome, "Congelado");
t("e não inventa força", [orfa.nivel, orfa.forcaLabel], [0, null]);
t("mas se sabe de fora", orfa.doCatalogo, false);

/* A força GRAVADA na sessão salva o degrau de uma condição que saiu do
   catálogo. É o caminho da condição do Ritual Estendido, que a sessão escreve
   com `forca: "fraca"` à mão. */
t("a força gravada resgata o degrau",
  COND.fichaDaCondicao("Congelado", "forte").nivel, 3);
t("mas o catálogo manda quando os dois existem",
  COND.fichaDaCondicao("Caído", "extrema").nivel, 1);

/* A do Ritual Estendido, que é a única condição que o sistema aplica sozinho,
   resolve certo pelo nome. */
t("a condição do Ritual Estendido resolve",
  COND.fichaDaCondicao("Desprevenido", "fraca").nivel, 1);

/* ============================================================ */
/* 3. O SELETOR, AGRUPADO POR FORÇA                              */
/* ============================================================ */

const grupos = COND.condicoesPorForca();
t("os grupos saem na ordem da escala",
  grupos.map((g) => g.id), ["fraca", "media", "forte", "extrema"]);
t("e somam as 26 do catálogo",
  grupos.reduce((a, g) => a + g.condicoes.length, 0),
  Object.values(CONDICOES_CATALOGO).reduce((a, l) => a + l.length, 0));
t("cada uma já vem com o degrau resolvido",
  grupos.find((g) => g.id === "forte").condicoes.every((c) => c.nivel === 3), true);

/* ============================================================ */
/* 4. O VALIDADOR, QUE É O PONTO DO TERRENO                      */
/* ============================================================ */

t("o catálogo de hoje é válido", COND.validarCatalogoCondicoes(), []);

/* ⚠ ESTE É O ASSERT QUE JUSTIFICA O MÓDULO. Um texto escrito para "Enfeitiçado"
   e gravado como "Enfeiticado" não daria erro nenhum sem o validador: a
   condição apareceria sem texto, calada, e ninguém saberia que o texto foi
   escrito. É a mesma armadilha do requisito `nota`. */
COND.CONDICAO_TEXTOS["Enfeiticado"] = { texto: "sem cedilha" };
t("nome que não casa é recusado",
  COND.validarCatalogoCondicoes(),
  ['CONDICAO_TEXTOS: "Enfeiticado" não existe em CONDICOES_CATALOGO']);
delete COND.CONDICAO_TEXTOS["Enfeiticado"];

/* Entrada sem texto também é erro: ela seria uma linha que abre no vazio. */
COND.CONDICAO_TEXTOS["Cego"] = { resumo: "Não enxerga" };
t("entrada sem texto é recusada",
  COND.validarCatalogoCondicoes(),
  ['CONDICAO_TEXTOS: "Cego" não tem texto']);
delete COND.CONDICAO_TEXTOS["Cego"];

/* E o caminho feliz, que é como vai ficar quando o autor mandar os textos. */
COND.CONDICAO_TEXTOS["Cego"] = { resumo: "Não enxerga", texto: "Você falha em testes que exijam visão." };
t("texto bem escrito passa", COND.validarCatalogoCondicoes(), []);
t("e chega na ficha da condição",
  [COND.fichaDaCondicao("Cego").resumo, COND.fichaDaCondicao("Cego").descricao],
  ["Não enxerga", "Você falha em testes que exijam visão."]);
delete COND.CONDICAO_TEXTOS["Cego"];

/* ============================================================ */
/* 5. O TERRENO ESTÁ VAZIO, E ISSO É DE PROPÓSITO                */
/* ============================================================ */
/* ⚠ Se este assert falhar, alguém escreveu efeito de condição. Não é proibido:
   é o dia em que o autor mandou os textos. Suba o número e siga. */

t("nenhum texto de condição foi inventado",
  Object.keys(COND.CONDICAO_TEXTOS).length, 0);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
