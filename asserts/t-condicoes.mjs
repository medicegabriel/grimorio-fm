/* CONDIÇÕES, 2026-08-28.

   O terreno preparado para os textos que o autor ainda vai mandar.

   As 26 condições existiam desde sempre como NOME dentro de uma lista de força,
   e a aba Buffs desenhava o nome com a CHAVE CRUA da força ao lado, minúscula
   ("media"), sem dizer que aquilo é a segunda de quatro. O autor pediu para ver
   "as condições, seus efeitos, o nível da condição": duas dessas três coisas já
   existiam e estavam mal desenhadas, e a terceira nunca foi escrita.

   ⚠ O `CONDICAO_TEXTOS` NASCEU VAZIO e ficou assim até 2026-09-21, quando o
   autor mandou os textos. O que este arquivo prova é que eles chegaram CERTOS:
   um nome com acento errado é recusado no validador em vez de a condição
   aparecer muda, e toda condição tem o texto dela. O que elas fazem no número
   está em `t-condicoes-efeitos.mjs`.

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

const campos = ({ nome, forcaId, forcaLabel, nivel, grupo, doCatalogo, especial }) =>
  ({ nome, forcaId, forcaLabel, nivel, grupo, doCatalogo, especial });
t("condição fraca", campos(COND.fichaDaCondicao("Caído")), {
  nome: "Caído", forcaId: "fraca", forcaLabel: "Fraca", nivel: 1,
  grupo: "Movimento", doCatalogo: true, especial: false,
});
t("e o texto do livro chega com ela",
  COND.fichaDaCondicao("Caído").descricao.startsWith("O personagem sofre -3 em ataques corpo a corpo"), true);

t("condição extrema", campos(COND.fichaDaCondicao("Paralisado")), {
  nome: "Paralisado", forcaId: "extrema", forcaLabel: "Extrema", nivel: 4,
  grupo: "Incapacitação", doCatalogo: true, especial: false,
});

/* As três ESPECIAIS existem na mesa (Cego deixa Surpreso) e NÃO no catálogo de
   níveis: o livro diz que condição fora da lista não pode ser aplicada, então o
   editor de Feitiço não pode oferecê-las. */
t("Surpreso é especial, sem degrau", campos(COND.fichaDaCondicao("Surpreso")), {
  nome: "Surpreso", forcaId: "especial", forcaLabel: "Especial", nivel: 0,
  grupo: "Sensorial", doCatalogo: true, especial: true,
});
t("as especiais não entram no catálogo que o Feitiço lê",
  COND.CONDICOES_ESPECIAIS.filter((n) => Object.values(CONDICOES_CATALOGO).flat().includes(n)), []);

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
/* A Ficha e a bancada pedem as especiais, e elas vêm num grupo no fim. */
const comEspeciais = COND.condicoesPorForca({ especiais: true });
t("com especiais, um quinto grupo no fim",
  comEspeciais.map((g) => g.id), ["fraca", "media", "forte", "extrema", "especial"]);
t("com as três", comEspeciais.at(-1).condicoes.map((c) => c.nome), ["Indefeso", "Invisível", "Surpreso"]);

/* ============================================================ */
/* 4. O VALIDADOR, QUE É O PONTO DO TERRENO                      */
/* ============================================================ */

t("o catálogo de hoje é válido", COND.validarCatalogoCondicoes(), []);

/* ⚠ ESTE É O ASSERT QUE JUSTIFICA O MÓDULO. Um texto escrito para "Enfeitiçado"
   e gravado como "Enfeiticado" não daria erro nenhum sem o validador: a
   condição apareceria sem texto, calada, e ninguém saberia que o texto foi
   escrito. É a mesma armadilha do requisito `nota`. */
const cegoDoLivro = COND.CONDICAO_TEXTOS["Cego"];
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

/* E o resumo opcional chega na ficha da condição quando existe. */
COND.CONDICAO_TEXTOS["Cego"] = { resumo: "Não enxerga", texto: "Você falha em testes que exijam visão." };
t("texto bem escrito passa", COND.validarCatalogoCondicoes(), []);
t("e chega na ficha da condição",
  [COND.fichaDaCondicao("Cego").resumo, COND.fichaDaCondicao("Cego").descricao],
  ["Não enxerga", "Você falha em testes que exijam visão."]);
COND.CONDICAO_TEXTOS["Cego"] = cegoDoLivro;

/* Um efeito que inclui condição inexistente também é recusado: a inclusão
   sumiria calada, e Agarrado deixaria de deixar Desprevenido. */
const agarradoDoLivro = COND.CONDICAO_EFEITOS["Agarrado"];
COND.CONDICAO_EFEITOS["Agarrado"] = { inclui: ["Desprevinido"] };
t("inclusão com nome errado é recusada",
  COND.validarCatalogoCondicoes(),
  ['CONDICAO_EFEITOS: "Agarrado" inclui "Desprevinido", que não existe']);
COND.CONDICAO_EFEITOS["Agarrado"] = agarradoDoLivro;
t("e o catálogo volta a ser válido", COND.validarCatalogoCondicoes(), []);

/* ============================================================ */
/* 5. O LIVRO CHEGOU INTEIRO (2026-09-21)                        */
/* ============================================================ */
/* O terreno ficou vazio de 2026-08-28 a 2026-09-21, esperando o autor. Agora
   toda condição do catálogo e as três especiais têm o texto dele, e nenhuma
   outra: 26 da lista de níveis (Desmembramento incluído) mais as especiais. */
const todos = [...Object.values(CONDICOES_CATALOGO).flat(), ...COND.CONDICOES_ESPECIAIS];
t("toda condição tem o texto do autor", todos.filter((n) => !COND.CONDICAO_TEXTOS[n]?.texto), []);
t("e são 29 textos", Object.keys(COND.CONDICAO_TEXTOS).length, 29);
/* ⚠ Regra de tela do autor: nunca travessão nem ponto e vírgula. O texto do
   livro tinha um de cada (Lento e Sangramento), trocados por vírgula e ponto. */
t("nenhum texto nem resumo tem travessão nem ponto e vírgula",
  Object.entries(COND.CONDICAO_TEXTOS)
    .filter(([, d]) => new RegExp(`[${String.fromCharCode(0x2013, 0x2014)};]`).test(`${d.texto} ${d.resumo ?? ""}`)).map(([n]) => n), []);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
