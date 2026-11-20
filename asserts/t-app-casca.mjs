/* O app de celular, etapa E8 (2026-11-20): a casca da Guilda no celular.

   1. As abas e a troca no histórico (`trocaDeAba`): sair de Fichas empilha, entre as outras substitui, voltar a Fichas volta.
   2. A lista (`fichasDaVista`, `pastasComContagem`, `resumoDaFicha`): a mesma vista do Dashboard, busca sem acento, as Criaturas
      Base de fora, Nível ou ND.
   3. As ligações: a casca só em /EraDeOuro e só no celular, as telas `sala` e `mais` na pilha, a lista de Encontros sem o
      Voltar na casca, o Livro e o convite com a barra, e o texto de tela. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const url = (p) => new URL(p, import.meta.url);
const lê = (p) => readFileSync(url(p), "utf8");
const L = await import(url("../src/systems/eradeouro/app/lista-fichas.js").href);
const P = await import(url("../src/celular/pilha.js").href);

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ---------- 1. as abas ---------- */
t("as quatro abas na ordem", L.ABAS_DA_CASCA.map((a) => a.id), ["fichas", "encontros", "sala", "mais"]);
t("sem nuvem, sem Sala", L.abasDaCasca(false).map((a) => a.id), ["fichas", "encontros", "mais"]);
t("a aba de cada tela", ["dashboard", "encounters", "sala", "mais", "builder", "aftyFicha", "encounter"].map(L.abaDaTela), ["fichas", "encontros", "sala", "mais", null, null, null]);
t("trocar de aba no histórico", [
  L.trocaDeAba("fichas", "encontros"), L.trocaDeAba("encontros", "mais"), L.trocaDeAba("mais", "fichas"), L.trocaDeAba("sala", "sala"),
], ["ir", "substituir", "voltar", "nada"]);
t("a pilha aceita as telas novas", [P.normalizarTela({ name: "sala" })?.name, P.normalizarTela({ name: "mais" })?.name], ["sala", "mais"]);

/* ---------- 2. a lista ---------- */
const fichas = [
  { id: "a", name: "João Kuroe", folderId: null, rulesVersion: "player", core: { nd: 7 } },
  { id: "b", name: "Ogro", folderId: "p1", rulesVersion: "afty", core: { nd: 12 }, portraitUrl: "x.png" },
  { id: "c", name: "Base", isBuiltIn: true },
  { id: "d", name: "Joana", folderId: "p1", rulesVersion: "player", core: {} },
];
const pastas = [{ id: "p1", name: "Vilões" }];
const ids = (l) => l.map((f) => f.id);
t("todas, sem as Criaturas Base", ids(L.fichasDaVista(fichas, { type: "all" })), ["a", "b", "d"]);
t("sem pasta", ids(L.fichasDaVista(fichas, { type: "unfiled" })), ["a"]);
t("uma pasta", ids(L.fichasDaVista(fichas, { type: "folder", folderId: "p1" })), ["b", "d"]);
t("busca sem acento e sem caixa", [ids(L.fichasDaVista(fichas, { type: "all" }, "joao")), ids(L.fichasDaVista(fichas, { type: "all" }, " JO "))], [["a"], ["a", "d"]]);
t("pastas com contagem", L.pastasComContagem(fichas, pastas).map((p) => [p.rotulo, p.n]), [["Todas", 3], ["Sem Pasta", 1], ["Vilões", 2]]);
t("sem pasta nenhuma, só Todas", L.pastasComContagem(fichas, []).map((p) => p.rotulo), ["Todas"]);
t("mesma vista", [L.mesmaVista({ type: "all" }, { type: "all", folderId: null }), L.mesmaVista({ type: "folder", folderId: "p1" }, { type: "folder", folderId: "p2" })], [true, false]);
t("o cartão", [L.resumoDaFicha(fichas[0]), L.resumoDaFicha(fichas[1]).linha, L.resumoDaFicha(fichas[3]).linha, L.resumoDaFicha({}).nome], [
  { nome: "João Kuroe", tipo: "Personagem", linha: "Nível 7", retrato: null, foco: null }, "ND 12", "Personagem", "Sem Nome",
]);
t("tamanhos", [100, 1500 * 1024, 5.5 * 1024 * 1024 * 1024, -1, "x"].map(L.tamanhoLegivel), ["1 KB", "1,5 MB", "5,5 GB", null, null]);

/* ---------- 3. as ligações ---------- */
const APP = lê("../src/App.jsx");
const CSS = lê("../src/systems/eradeouro/app/app-guilda.css");
const LISTA = lê("../src/systems/eradeouro/app/ListaDeFichas.jsx");
const MAIS = lê("../src/systems/eradeouro/app/MaisDaGuilda.jsx");
const ENC = lê("../src/systems/afty/encontros/telas/ListaDeEncontros.jsx");
t("a casca só na Guilda, no celular e fora da Sala", APP.includes("const cascaNoCelular = mesa && celularNaTela && !rotaSala;"), true);
t("fora da casca, sala e mais viram a lista", [APP.includes("sala: () => (cascaNoCelular && nuvemAtiva ? <AbaSala /> : views.dashboard()),"), /mais: \(\) => \(cascaNoCelular \? <MaisDaGuilda/.test(APP)], [true, true]);
t("as telas da casca chegam sob demanda", ["ListaDeFichas", "MaisDaGuilda", "AbaSala"].map((n) => new RegExp(`const ${n} = telaSobDemanda\\(`).test(APP)), [true, true, true]);
t("a lista de Encontros perde o Voltar só na casca", [APP.includes("semVoltar={cascaNoCelular}"), ENC.includes('semVoltar = false }) {')], [true, true]);
t("o Importar do Mais passa pela porta do livro", APP.includes("importar={storage.importMany}"), true);
t("com a barra, o Livro sai e o convite sobe", [CSS.includes('body:has(.fm-barra-inferior) div:has(> button[aria-label$=" documentos"]) { display: none; }'), CSS.includes("body:has(.fm-barra-inferior) .fm-convite")], [true, true]);
t("a barra soma a área segura e o conteúdo ganha folga", [/\.fm-barra-inferior \{[\s\S]*?env\(safe-area-inset-bottom/.test(CSS), /\.fm-casca-conteudo \{ padding-bottom: calc\(var\(--fm-barra-h\)/.test(CSS)], [true, true]);
t("alvos de 44 px e campo de 16", [/\.fm-botao, \.fm-acao, \.fm-icone \{[^}]*min-height: 44px/.test(CSS), /\.fm-busca input \{[^}]*font-size: 16px/.test(CSS)], [true, true]);
t("o Voltar sai da seleção antes da lista", LISTA.includes("useCamadaDeVoltar(selecionando, () => setSelecao(new Set()));"), true);
t("excluir pede confirmação", [LISTA.includes("setApagar([menu])"), LISTA.includes("confirmarApagar")], [true, true]);
t("os Livros abrem no leitor do site", MAIS.includes("<PdfViewerModal"), true);
const textos = [LISTA, MAIS, lê("../src/systems/eradeouro/app/BarraInferior.jsx"), lê("../src/systems/eradeouro/app/AbaSala.jsx"), lê("../src/systems/eradeouro/app/CascaDaGuilda.jsx")];
t("sem travessão", textos.some((s) => new RegExp("\\u2014").test(s)), false);
/* O texto de tela: tudo entre > e < que não é código. Ponto e vírgula fora de comentário e de código é texto de tela. */
const deTela = (s) => [...s.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/>([^<>{}]+)</g)].map((m) => m[1].trim()).filter(Boolean);
t("sem ponto e vírgula no texto de tela", textos.flatMap(deTela).filter((x) => x.includes(";")), []);

if (bad.length) {
  console.log(bad.join("\n"));
  console.log(`\n${bad.length} FALHARAM, ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
