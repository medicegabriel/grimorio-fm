/* Corrupção visual da ficha (V8): o pacote declara `corrupcao: { marca, maximo,
   pele }` e o derive devolve `derived.corrupcao` com a fração, o marco e a pele.

   Pacote NEUTRO escrito aqui dentro, de propósito: este arquivo é público.

   O que fica preso:
   • sem pacote que a declare, `ativo` é falso e nada é montado;
   • a contagem é a MESMA do `contar()` (uma conta só), e a fração sobe de 0 a 1
     e para no máximo;
   • os marcos caem nos cortes de 1, 4, 7, 10, 13, 17 e 21, e o 7 só com a
     corrupção cheia;
   • a corrupção sai da FICHA, e nunca do mundo unido (o vizinho sem pacote não
     herda);
   • a instalação recusa marca vazia, máximo ruim e pele que não existe;
   • é só apresentação: nenhum número da ficha muda por causa dela. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const C = await import(R + "afty-corrupcao.js");

let ok = 0;
const falhas = [];
const t = (nome, real, esperado) => {
  const a = JSON.stringify(real);
  const b = JSON.stringify(esperado);
  if (a === b) ok += 1;
  else falhas.push(`${nome}\n     esperado ${b}\n     veio     ${a}`);
};

/* ============================================================ */
/* 1. A RÉGUA, EM UNIDADE                                        */
/* ============================================================ */
t("marcos do máximo padrão, de 0 a 22", Array.from({ length: 23 }, (_, n) => C.marcoDaCorrupcao(n)),
  [0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7]);
t("o marco 7 só com a corrupção cheia", [C.marcoDaCorrupcao(20), C.marcoDaCorrupcao(21)], [6, 7]);
t("máximo menor: os cortes escalam (10 de 10 é tomada)", [C.marcoDaCorrupcao(5, 10), C.marcoDaCorrupcao(10, 10), C.marcoDaCorrupcao(11, 10)], [4, 7, 7]);
t("sem configuração, inativa e zerada", C.resolveCorrupcao(null, { x: 5 }),
  { ativo: false, contagem: 0, maximo: 21, nivel: 0, marco: 0, pele: null });
t("fração para no máximo", C.resolveCorrupcao({ marca: "x", maximo: 4 }, { x: 9 }).nivel, 1);
t("pele desconhecida cai na padrão", C.resolveCorrupcao({ marca: "x", pele: "inexistente" }, { x: 1 }).pele, "rubra");
t("máximo inválido cai em 21", C.resolveCorrupcao({ marca: "x", maximo: "abc" }, { x: 21 }).maximo, 21);

/* ============================================================ */
/* 2. O PACOTE                                                   */
/* ============================================================ */
const talentos = Array.from({ length: 24 }, (_, i) => ({
  id: `m${i + 1}`, nome: `Marcado ${i + 1}`, grupo: "geral", descricao: "Marca.", tags: ["item_corrupto"],
}));
const PACOTE = {
  id: "corrupcao-teste",
  nome: "Corrupção de Teste",
  versao: "1.0.0",
  autor: "teste",
  paraRaw: "afty",
  descricao: "Pacote neutro dos asserts de corrupção visual.",
  resumo: "Corrupção visual",
  categoria: "ferramentas",
  corrupcao: { marca: "item_corrupto", maximo: 21, pele: "rubra" },
  acrescenta: { talentos },
};
t("o pacote valida", A.validarPacote(PACOTE), []);
const pacote = A.normalizarPacote(PACOTE);
t("o campo sobrevive à normalização (campo novo some calado se faltar lá)", pacote.corrupcao,
  { marca: "item_corrupto", maximo: 21, pele: "rubra" });

const invalido = (cfg) => A.validarPacote({ ...PACOTE, corrupcao: cfg });
t("recusa marca vazia", invalido({ marca: " ", maximo: 21 }).length > 0, true);
t("recusa máximo zero", invalido({ marca: "x", maximo: 0 }).length > 0, true);
t("recusa máximo fracionado", invalido({ marca: "x", maximo: 2.5 }).length > 0, true);
t("recusa pele que não existe", invalido({ marca: "x", pele: "azul" }).length > 0, true);
t("aceita só a marca (máximo e pele são opcionais)", invalido({ marca: "x" }), []);
t("pacote só com corrupção não é recusado por 'vazio'",
  A.validarPacote({ id: "so-corrupcao", nome: "Só", versao: "1.0.0", autor: "t", paraRaw: "afty", descricao: "d", resumo: "r", categoria: "ferramentas", corrupcao: { marca: "x" } }), []);

A.aplicarAddons([pacote]);

const ficha = ({ sistema = "afty", n = 0, addons = [pacote] } = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd: 5, tipo: "conjurador", patamar: "comum" };
  c.core.origem = { id: "inato" };
  c.addons = addons;
  c.talentos = talentos.slice(0, n).map((x) => `corrupcao-teste:${x.id}`);
  return c;
};

/* ============================================================ */
/* 3. A FICHA                                                    */
/* ============================================================ */
for (const sistema of ["afty", "player"]) {
  const S = `[${sistema}]`;
  const cor = (n) => deriveAfty(ficha({ sistema, n })).corrupcao;
  t(`${S} 0 marcas: ativa, fração 0, marco 0`, [cor(0).ativo, cor(0).nivel, cor(0).marco], [true, 0, 0]);
  t(`${S} 1 marca: marco 1`, [cor(1).contagem, cor(1).marco], [1, 1]);
  t(`${S} 6 marcas: fração 0,286, marco 2`, [cor(6).nivel, cor(6).marco], [0.286, 2]);
  t(`${S} 10 marcas: marco 4`, cor(10).marco, 4);
  t(`${S} 21 marcas: fração 1, marco 7, pele rubra`, [cor(21).nivel, cor(21).marco, cor(21).pele], [1, 7, "rubra"]);
  t(`${S} 24 marcas: passa do máximo e fica em 1`, [cor(24).contagem, cor(24).nivel, cor(24).marco], [24, 1, 7]);
}

t("sem o pacote na ficha, inativa", deriveAfty(ficha({ n: 0, addons: [] })).corrupcao.ativo, false);
t("a corrupção é da FICHA: com o pacote aplicado ao mundo, a ficha sem ele não herda",
  deriveAfty(ficha({ n: 12, addons: [] })).corrupcao.ativo, false);

/* É só apresentação: nenhum número muda. */
const comPacote = deriveAfty(ficha({ n: 21 }));
const mesmoSemCampo = deriveAfty({ ...ficha({ n: 21 }), addons: [A.normalizarPacote({ ...PACOTE, corrupcao: undefined })] });
t("os números principais não dependem da corrupção",
  [comPacote.hp, comPacote.pe, comPacote.defesa, comPacote.cd], [mesmoSemCampo.hp, mesmoSemCampo.pe, mesmoSemCampo.defesa, mesmoSemCampo.cd]);

A.aplicarAddons([]);

if (falhas.length) {
  console.log(`${falhas.length} FALHA(S) de ${ok + falhas.length}:\n`);
  for (const f of falhas) console.log(` x ${f}\n`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
