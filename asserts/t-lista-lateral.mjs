/**
 * A LISTA LATERAL DE FEITIÇOS E INVOCAÇÕES (autor, 2026-09-16).
 *
 * Pedido: *"A aba de Feitiços está MUITO dificil navegar entre os Feitiços
 * quando possuimos muitos."* Decisões por pergunta: lista lateral, busca por
 * nome, filtro por Tipo, agrupar por Tipo e ordenar, nas duas abas e nos dois
 * sistemas.
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. O módulo é FOLHA.
 * 2. A busca ignora acento e maiúscula.
 * 3. O filtro por Tipo, e o filtro vazio mostra tudo.
 * 4. As três ordens, com o empate na ordem de criação.
 * 5. Os grupos na ordem dos Tipos, sem grupo vazio, e o Tipo desconhecido no fim.
 * 6. Os Tipos presentes e o vizinho das setas.
 */
import { readFileSync } from "node:fs";

const L = await import(new URL("../src/systems/afty/afty-lista-lateral.js", import.meta.url).href);

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const TIPOS = [
  { value: "dano", label: "Dano" },
  { value: "auxiliar", label: "Auxiliar" },
  { value: "passivo", label: "Passivo" },
];
const ITENS = [
  { id: "a", nome: "Benção da Carga", tipo: "passivo", nivel: 5 },
  { id: "b", nome: "Rajada", tipo: "dano", nivel: 3 },
  { id: "c", nome: "Sequência de Golpes", tipo: "dano", nivel: 5 },
  { id: "d", nome: "Aura", tipo: "auxiliar", nivel: 1 },
  { id: "e", nome: "Bênção do Combate", tipo: "passivo", nivel: 5 },
  { id: "f", nome: "Antigo", tipo: "dispositivo", nivel: 2 },
];
const ids = (r) => r.grupos.flatMap((g) => g.itens.map((i) => i.id));

/* ============================================================ */
/* 1. MÓDULO FOLHA                                               */
/* ============================================================ */
const fonte = readFileSync(new URL("../src/systems/afty/afty-lista-lateral.js", import.meta.url), "utf8");
t("o módulo não importa nada", /^\s*import\s/m.test(fonte), false);

/* ============================================================ */
/* 2. A BUSCA                                                    */
/* ============================================================ */
t("sem acento acha com acento", ids(L.organizarLista(ITENS, { termo: "bencao" })), ["a", "e"]);
t("com acento acha sem acento", ids(L.organizarLista([{ id: "x", nome: "Bencao" }], { termo: "Bênção" })), ["x"]);
t("maiúscula não importa", ids(L.organizarLista(ITENS, { termo: "RAJ" })), ["b"]);
t("espaço nas pontas não importa", ids(L.organizarLista(ITENS, { termo: "  golpes " })), ["c"]);
t("busca vazia mostra tudo", L.organizarLista(ITENS, { termo: "   " }).visiveis, 6);
t("nada encontrado não tem grupo", L.organizarLista(ITENS, { termo: "zzz", agrupar: true }).grupos, []);
t("e conta zero visíveis de seis", [L.organizarLista(ITENS, { termo: "zzz" }).visiveis, L.organizarLista(ITENS, { termo: "zzz" }).total], [0, 6]);

/* ============================================================ */
/* 3. O FILTRO POR TIPO                                          */
/* ============================================================ */
t("um Tipo", ids(L.organizarLista(ITENS, { tiposAtivos: ["dano"] })), ["b", "c"]);
t("dois Tipos somam", ids(L.organizarLista(ITENS, { tiposAtivos: ["dano", "auxiliar"] })), ["b", "c", "d"]);
t("filtro vazio mostra tudo", L.organizarLista(ITENS, { tiposAtivos: [] }).visiveis, 6);
t("busca e Tipo juntos", ids(L.organizarLista(ITENS, { termo: "b", tiposAtivos: ["passivo"] })), ["a", "e"]);

/* ============================================================ */
/* 4. AS ORDENS                                                  */
/* ============================================================ */
t("criação é a ordem da ficha", ids(L.organizarLista(ITENS)), ["a", "b", "c", "d", "e", "f"]);
// "Benção da Carga" vem antes de "Bênção do Combate": "da" antes de "do", com o acento ignorado.
t("nome, sem acento na comparação", ids(L.organizarLista(ITENS, { ordem: "nome" })), ["f", "d", "a", "e", "b", "c"]);
t("nível crescente, e o empate vai pelo nome", ids(L.organizarLista(ITENS, { ordem: "nivel" })), ["d", "f", "b", "a", "e", "c"]);
t("ordem desconhecida cai na criação", ids(L.organizarLista(ITENS, { ordem: "xyz" })), ["a", "b", "c", "d", "e", "f"]);
const gemeos = [{ id: "1", nome: "Mesmo", nivel: 1 }, { id: "2", nome: "mesmo", nivel: 1 }, { id: "3", nome: "Mesmo", nivel: 1 }];
t("nome e nível iguais ficam na ordem de criação", ids(L.organizarLista(gemeos, { ordem: "nivel" })), ["1", "2", "3"]);
t("a lista original não é tocada", ITENS.map((i) => i.id).join(""), "abcdef");

/* ============================================================ */
/* 5. OS GRUPOS                                                  */
/* ============================================================ */
const agrupada = L.organizarLista(ITENS, { agrupar: true, tipos: TIPOS });
t("os grupos seguem a ordem dos Tipos, e o desconhecido fecha", agrupada.grupos.map((g) => g.tipo), ["dano", "auxiliar", "passivo", "dispositivo"]);
t("o rótulo vem do Tipo", agrupada.grupos.map((g) => g.rotulo), ["Dano", "Auxiliar", "Passivo", "dispositivo"]);
t("cada grupo com os seus", agrupada.grupos.map((g) => g.itens.length), [2, 1, 2, 1]);
t("Tipo sem item não vira grupo",
  L.organizarLista(ITENS, { agrupar: true, tipos: TIPOS, tiposAtivos: ["dano"] }).grupos.map((g) => g.tipo), ["dano"]);
t("dentro do grupo vale a ordem escolhida",
  L.organizarLista(ITENS, { agrupar: true, tipos: TIPOS, ordem: "nome" }).grupos[2].itens.map((i) => i.id), ["a", "e"]);
t("sem agrupar é um grupo sem rótulo", L.organizarLista(ITENS).grupos.map((g) => [g.tipo, g.rotulo]), [[null, null]]);

/* ============================================================ */
/* 6. OS TIPOS PRESENTES E AS SETAS                              */
/* ============================================================ */
t("só os Tipos que a lista tem, com a contagem",
  L.tiposPresentes(ITENS.slice(0, 3), TIPOS).map((p) => [p.value, p.quantidade]), [["dano", 2], ["passivo", 1]]);
const g = agrupada.grupos;
t("seta para baixo anda na ordem VISÍVEL", L.vizinhoNaLista(g, "c", 1), "d");
t("e atravessa o grupo", L.vizinhoNaLista(g, "d", 1), "a");
t("para no último", L.vizinhoNaLista(g, "f", 1), "f");
t("para no primeiro", L.vizinhoNaLista(g, "b", -1), "b");
t("selecionado filtrado: para baixo vai ao primeiro", L.vizinhoNaLista(g, "zzz", 1), "b");
t("e para cima vai ao último", L.vizinhoNaLista(g, "zzz", -1), "f");
t("lista vazia não tem vizinho", L.vizinhoNaLista([], "a", 1), null);

/* ============================================================ */
if (bad.length) {
  console.log(`FALHAS (${bad.length}):`);
  for (const b of bad) console.log("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
