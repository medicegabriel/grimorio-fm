/* QUIMERA, A FUSÃO DE INVOCAÇÕES EM UM CARD PRÓPRIO (2026-09-20).

   Pedido do autor: a Quimera deixa de ser Talento e vira uma seção ao lado das
   Hordas, na aba de Invocações, liberada pela primitiva `quimera` do addon.

   O motor é NATIVO (`resolveQuimera`, afty-invocacoes.js) e reaproveita o
   mecanismo de fontes da Quimera das Dez Sombras: uma invocação sintética com um
   marcador de fontes interno. A ficha de invocação da principal e das fundidas
   nunca é alterada. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const INV = await import(R + "afty-invocacoes.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. O ADDON E A PRIMITIVA                                      */
/* ============================================================ */
const pacote = AD.normalizarPacote(JSON.parse(readFileSync(new URL("../addons/quimera.json", import.meta.url), "utf8")));
t("o pacote valida sem problema nenhum", AD.validarPacote(pacote), []);
t("o pacote so abre a tela: permite a primitiva quimera", pacote.permite, ["quimera"]);
t("e nao traz Talento nem marcador (ja nao e pego como talento)",
  [pacote.acrescenta?.talentos?.length ?? 0, pacote.acrescenta?.marcadores?.length ?? 0], [0, 0]);
t("a primitiva existe no catalogo", AD.PRIMITIVAS.some((p) => p.id === "quimera"), true);
t("o texto do livro chega na descricao do pacote",
  pacote.descricao.includes("soma do PV de cada fundida menos 10")
    && pacote.descricao.includes("FIXO no maior valor"), true);
AD.aplicarAddons([pacote]);

/* ============================================================ */
/* 2. A FICHA                                                    */
/* ============================================================ */
const FONTES = [
  ["Cervo Circular", "segundo", 16, 16, 16], ["Tigre Funebre", "segundo", 20, 12, 18],
  ["Grande Serpente", "terceiro", 18, 12, 16], ["Nue", "terceiro", 14, 18, 14],
];
const mkFonte = ([nome, grau, f, d, c], i) => {
  const inv = INV.createBlankInvocacao(grau);
  inv.id = `f${i}`; inv.nome = nome; inv.tipoMecanico = "shikigami";
  inv.atributos = { forca: f, destreza: d, constituicao: c, inteligencia: 10, sabedoria: 10, presenca: 10 };
  inv.acoes = [1, 2, 3].map((k) => ({ ...INV.createBlankAcao(), id: `f${i}a${k}`, nome: `A${k}` }));
  inv.periciasProf = i === 0 ? { atletismo: "treinado", furtividade: "treinado" }
    : i === 1 ? { atletismo: "mestre" } : {};
  return inv;
};
const ficha = ({ n = 4, nivel = 4, principal = "f0", fundidas, ajusteF0 = null, comAddon = true } = {}) => {
  const c = createBlankAfty();
  c.core = { ...c.core, nd: 20, tipo: "conjurador", patamar: "comum" };
  c.especializacoes = [{ id: "controlador", nivel: 20 }];
  c.addons = comAddon ? [pacote] : [];
  c.invocacoes = FONTES.map(mkFonte);
  if (ajusteF0) c.invocacoes[0].atributos = { ...c.invocacoes[0].atributos, ...ajusteF0 };
  const resto = fundidas ?? FONTES.map((_, i) => `f${i}`).filter((id) => id !== principal).slice(0, Math.max(0, n - 1));
  c.quimeras = n > 0 ? [{ id: "q1", nome: "Agito", principalId: principal, fundidasIds: resto, nivel }] : [];
  return c;
};
const dQ = (o) => deriveAfty(ficha(o));
const qDe = (o) => dQ(o).quimeras.lista[0];
const soloF0 = deriveAfty(ficha({ n: 0 })).invocacoes.lista.find((x) => x.id === "f0");
const pvFontes = deriveAfty(ficha({ n: 0 })).invocacoes.lista.map((x) => x.pv);
const custoFontes = deriveAfty(ficha({ n: 0 })).invocacoes.lista.map((x) => x.custo);
const soma = (v, n) => v.slice(0, n).reduce((a, b) => a + b, 0);

t("a ficha nasce sem quimeras", createBlankAfty().quimeras, []);
t("sem quimera nenhuma a lista sai vazia", dQ({ n: 0 }).quimeras, { lista: [], total: 0, custoTotal: 0 });

/* ============================================================ */
/* 3. PV, CUSTO E O TETO                                         */
/* ============================================================ */
t("as fontes tem PV diferentes, porque os graus diferem", new Set(pvFontes).size >= 2, true);
t("PV = soma do PV de cada fundida menos 10 (2, 3 e 4 fundidas)",
  [2, 3, 4].map((n) => qDe({ n }).pv), [2, 3, 4].map((n) => soma(pvFontes, n) - 10));
t("nao e a soma dos dois maiores, como nas Dez Sombras",
  qDe({ n: 4 }).pv !== [...pvFontes].sort((a, b) => b - a).slice(0, 2).reduce((a, b) => a + b, 0), true);
t("Custo = soma do custo de todas as fundidas",
  [2, 3, 4].map((n) => qDe({ n }).custo), [2, 3, 4].map((n) => soma(custoFontes, n)));
t("o total de fundidas conta a principal", [2, 3, 4].map((n) => qDe({ n }).total), [2, 3, 4]);
t("o custo total da lista soma as quimeras", dQ({ n: 3 }).quimeras.custoTotal, soma(custoFontes, 3));

t("Nivel 2 aceita 2 fundidas", qDe({ n: 2, nivel: 2 }).warnings, []);
const acima = qDe({ n: 4, nivel: 2 });
t("Nivel 2 com 4 marcadas avisa e usa so 2 no total",
  [acima.warnings.length, acima.total, acima.limite], [1, 2, 2]);
t("e o PV respeita o teto", acima.pv, soma(pvFontes, 2) - 10);
t("Nivel invalido cai em 2", qDe({ n: 2, nivel: 9 }).nivel, 2);

/* ============================================================ */
/* 4. VALIDAÇÃO                                                  */
/* ============================================================ */
const vazia = ficha({ n: 2 });
vazia.quimeras = [{ id: "q1", nome: "", principalId: "", fundidasIds: [], nivel: 2 }];
t("sem principal avisa e nao resolve",
  (({ valido, resolvida, warnings }) => [valido, resolvida, warnings.length])(deriveAfty(vazia).quimeras.lista[0]),
  [false, null, 1]);
t("so a principal, sem fundida, avisa",
  qDe({ n: 2, fundidas: [] }).valido, false);
t("fundida repetida ou que nao existe e ignorada",
  qDe({ n: 2, fundidas: ["f1", "f1", "fantasma", "f0"] }).fundidasIds, ["f1"]);

/* ============================================================ */
/* 5. BÔNUS +1 POR FUNDIDA ALÉM DA PRIMEIRA                      */
/* ============================================================ */
const efe = (n) => qDe({ n }).resolvida.efeitosHabilidade;
for (const canal of ["cd", "defesa", "danoNivel", "orcamentoLivre", "bonusTeste"]) {
  t(`+1 em ${canal} por fundida alem da primeira`,
    [1, 2, 3, 4].map((n) => (n === 1 ? (soloF0.efeitosHabilidade[canal] ?? 0) : efe(n)[canal] ?? 0)
      - (soloF0.efeitosHabilidade[canal] ?? 0)), [0, 1, 2, 3]);
}

/* ============================================================ */
/* 6. TREINOS                                                    */
/* ============================================================ */
const profDe = (o) => Object.fromEntries((qDe(o).resolvida.testes?.pericias ?? [])
  .map((p) => [p.id, p.mestre ? "mestre" : "treinado"]));
t("une as pericias treinadas de todas as fundidas",
  [profDe({ n: 2 }).atletismo, profDe({ n: 2 }).furtividade], ["mestre", "treinado"]);
t("a maior faixa ganha: a principal treinada e a fundida mestre",
  profDe({ n: 2 }).atletismo, "mestre");

/* ============================================================ */
/* 7. ATRIBUTOS FIXOS NO MAIOR VALOR                             */
/* ============================================================ */
const attr = (o) => qDe(o).resolvida.atributos.valores;
const maiores = (n) => Object.fromEntries(
  ["forca", "destreza", "constituicao"].map((k, i) => [k, Math.max(...FONTES.slice(0, n).map((f) => f[2 + i]))]));
const tres = (a) => ({ forca: a.forca, destreza: a.destreza, constituicao: a.constituicao });
t("cada atributo e o maior entre as fundidas (2, 3 e 4)",
  [2, 3, 4].map((n) => tres(attr({ n }))), [2, 3, 4].map(maiores));
t("a principal conta como fundida: ficha alta dela vence",
  attr({ n: 2, ajusteF0: { forca: 30 } }).forca, 30);
t("e ficha baixa dela perde para a fundida",
  attr({ n: 2, ajusteF0: { forca: 8 } }).forca, 20);
t("trocar a principal nao muda o maximo do grupo",
  tres(attr({ n: 4, principal: "f3" })), maiores(4));

/* ============================================================ */
/* 8. NADA VAZA                                                  */
/* ============================================================ */
const lista = dQ({ n: 4 }).invocacoes.lista;
t("as invocacoes da ficha ficam intactas",
  lista.map((x) => [x.id, x.pv, x.custo]), deriveAfty(ficha({ n: 0 })).invocacoes.lista.map((x) => [x.id, x.pv, x.custo]));
t("a lista de invocacoes nao ganha a Quimera", lista.length, 4);
t("os marcadores da ficha nao ganham o interno", dQ({ n: 4 }).invocacoes.marcadores.length, 0);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
