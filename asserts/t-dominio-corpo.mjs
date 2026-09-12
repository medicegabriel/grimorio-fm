/**
 * O CORPO DA EXPANSÃO DE DOMÍNIO, em estrutura.
 *
 * Autor, 2026-09-11: *"Ficou muito feio a Expansão de Domínio na Ficha Final. E
 * no Criador de Fichas."* A Ficha e o criador recebiam um parágrafo pronto
 * (`textoDoDominio`, herança da 2.5.2), e o criador o desmontava de volta com
 * uma regex sobre o marcador "●". A área, a duração e o PV saíam duas vezes na
 * tela, e o que é DESTA expansão ficava no fim, depois de cinco efeitos iguais
 * em toda expansão.
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. O CORPO NÃO CARREGA NÚMERO da linha. Área e PV moram nos campos próprios,
 *    e o corpo é só texto. É o que impede a repetição de voltar.
 * 2. OS EFEITOS DESTA EXPANSÃO vêm na ordem da ficha, com título e categoria. O
 *    Efeito Especial sem nome usa a categoria como título, e sem descrição fica
 *    SEM texto (o "(efeito a descrever)" da prosa era enchimento).
 * 3. O ACERTO GARANTIDO entra como efeito próprio quando ligado, com o mesmo
 *    texto que a prosa tinha, e some quando desligado.
 * 4. OS CINCO EFEITOS BASE continuam saindo prontos (decisão do autor,
 *    2026-07-30), mais a regra do domo verbatim. A Sem Barreiras não tem domo e
 *    não ganha o item.
 * 5. OS DOIS HOVERS NOVOS FECHAM COM O NÚMERO: o PV do domo é doze paredes, e o
 *    custo tem uma segunda parcela com o Acerto Garantido.
 * 6. NENHUM "●" sobrou em lugar nenhum da estrutura.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const DOM = await import(R + "afty-dominios.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const JARDIM = "Sempre que você realizar um feitiço, seja auxiliar, curativo ou ofensivo de alvo único, você pode escolher um outro ser dentro da expansão para também receber os efeitos do feitiço.";

/** O resumo de domínios de uma ficha com UMA expansão. */
function dominios({
  versao = "completa", efeitos = [], acertoGarantido, aparencia = "", nd = 15, extras = [],
} = {}) {
  const f = createBlankAfty();
  f.name = "Cobaia";
  f.core = { ...f.core, nd, tipo: "conjurador", patamar: "comum" };
  f.aptidoes = { au: 2, cl: 1, bar: 5, dom: 3, er: 0 };
  f.aptidoesAmaldicoadas = [
    "tecnicas_de_barreira", "expansao_de_dominio_incompleta", "expansao_de_dominio_completa", ...extras,
  ];
  f.dominios = [{
    id: "d1", nome: "Jardim de Avalon", versao, aparencia, efeitos,
    ...(acertoGarantido ? { acertoGarantido } : {}),
  }];
  f.dominioAtivoId = "d1";
  return deriveAfty(f).dominios;
}

const efeitos = [
  { id: "e1", categoria: "especial", nome: "Jardim das Flores Eternas", descricao: JARDIM },
  { id: "e2", categoria: "amp_tecnica", tipo: "dano" },
  { id: "e3", categoria: "especial" },
];
const info = dominios({ efeitos, aparencia: "  Um campo de flores.  " });
const linha = info.lista[0];
const corpo = linha.corpo;

/* ============================================================ */
/* 1. O CORPO NÃO CARREGA NÚMERO DA LINHA                        */
/* ============================================================ */

t("a ficha de teste e uma Completa", linha.versao, "completa");
t("a area nao aparece no corpo", JSON.stringify(corpo).includes(linha.area), false);
t("o PV do domo nao aparece no corpo", JSON.stringify(corpo).includes(String(linha.pvBarreira)), false);
t("o campo texto saiu", "texto" in linha, false);
t("e a funcao da prosa saiu junto", "textoDoDominio" in DOM, false);

/* ============================================================ */
/* 2. OS EFEITOS DESTA EXPANSÃO                                  */
/* ============================================================ */

t("na ordem da ficha", corpo.proprios.map((e) => e.titulo),
  ["Jardim das Flores Eternas", "Aumento de Dano", "Efeito Especial"]);
t("cada um com a sua categoria", corpo.proprios.map((e) => e.categoria),
  ["Efeito Especial", "Amplificação de Técnica", "Efeito Especial"]);
t("o texto do Efeito Especial e o que a ficha escreveu", corpo.proprios[0].texto, JARDIM);
t("o efeito de tabela traz a frase resolvida",
  corpo.proprios[1].texto.startsWith("Todos os seus Feitiços de dano recebem"), true);
/* ⚠ Sem enchimento. A prosa escrevia "(efeito a descrever)", e na lista o
   título sozinho já diz que o efeito existe. */
t("o Especial sem descricao fica sem texto", corpo.proprios[2].texto, "");
t("a execucao e a de toda expansao", corpo.execucao, "Duas Ações Comuns");
t("a aparencia sai aparada", corpo.aparencia, "Um campo de flores.");

/* ============================================================ */
/* 3. O ACERTO GARANTIDO                                         */
/* ============================================================ */

const semAG = linha;
const comAG = dominios({ efeitos, acertoGarantido: { ativo: true, escopo: "o soco" } }).lista[0];
t("sem Acerto Garantido ele nao e efeito", semAG.corpo.proprios.some((e) => e.titulo === "Acerto Garantido"), false);
const ag = comAG.corpo.proprios.at(-1);
t("com ele, e o ultimo efeito proprio", ag.titulo, "Acerto Garantido");
t("o escopo vira a categoria", ag.categoria, "o soco");
t("e o texto e o mesmo que a prosa tinha",
  ag.texto.startsWith("Enquanto dentro do seu domínio, o soco se torna garantido: ele é aplicado no início de cada turno"),
  true);
t("sem escopo, a frase generica",
  dominios({ acertoGarantido: { ativo: true, escopo: "" } }).lista[0].corpo.proprios.at(-1).texto
    .startsWith("Enquanto dentro do seu domínio, você escolhe antecipadamente um efeito"),
  true);

/* ============================================================ */
/* 4. OS EFEITOS BASE, E O DOMO                                  */
/* ============================================================ */

t("os cinco base mais o domo", corpo.base.map((b) => b.titulo),
  [...DOM.DOMINIO_EFEITOS_BASE.map((b) => b.titulo), "Domo"]);
t("o texto de cada base e o do catalogo",
  corpo.base.slice(0, 5).map((b) => b.texto), DOM.DOMINIO_EFEITOS_BASE.map((b) => b.texto));
t("a regra do domo, verbatim da prosa antiga", corpo.base.at(-1).texto,
  "Caso a expansão seja atacada pelo seu interior, ela é resistente a todos os tipos de dano. " +
  "A resistência do interior de domínios não pode ser ignorada.");

const semBarreiras = dominios({
  versao: "sem_barreiras", nd: 20, extras: ["expansao_de_dominio_sem_barreiras"],
}).lista[0];
t("a ficha de Sem Barreiras resolve como tal", semBarreiras.versao, "sem_barreiras");
t("e ela NAO ganha o item do domo, porque tem Totem",
  semBarreiras.corpo.base.map((b) => b.titulo), DOM.DOMINIO_EFEITOS_BASE.map((b) => b.titulo));

/* ============================================================ */
/* 5. OS DOIS HOVERS NOVOS FECHAM COM O NÚMERO                   */
/* ============================================================ */

const partesDomo = info.barreira.partesPvDomo;
t("o hover do domo termina na multiplicacao", partesDomo.at(-1), { label: "× 12 paredes", texto: "× 12" });
t("a parede do hover vezes doze e o PV do domo",
  partesDomo.reduce((soma, p) => soma + (p.valor ?? 0), 0) * DOM.PAREDES_NO_DOMO, linha.pvBarreira);

t("sem Acerto Garantido o custo e uma parcela so", semAG.partesCusto, [{ label: "Expansão Completa", valor: 20 }]);
t("com ele sao duas", comAG.partesCusto,
  [{ label: "Expansão Completa", valor: 20 }, { label: "Acerto Garantido", valor: 5 }]);
t("e as parcelas fecham com o custo",
  [semAG, comAG].map((l) => l.partesCusto.reduce((s, p) => s + p.valor, 0) === l.custo), [true, true]);

/* ============================================================ */
/* 6. NENHUM "●" SOBROU                                          */
/* ============================================================ */

t("o marcador de texto nao existe na estrutura",
  [linha, comAG, semBarreiras].some((l) => JSON.stringify(l.corpo).includes("●")), false);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
