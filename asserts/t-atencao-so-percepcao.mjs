/* A regra de Addon `atencaoSoPercepcao`: a fonte que dá Percepção E Atenção dá só a Percepção.
   A Atenção já é 10 + o bônus de Percepção, então no livro o mesmo poder sobe a Atenção duas vezes.
   Prende: o verbo valida e normaliza, a linha de Atenção da fonte dupla some, a Percepção fica, e a
   fonte que dá só Atenção passa intacta. */
import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const RG = await import(R + "afty-regras-addon.js");
const { atencaoSoPelaPercepcao } = await import(R + "afty-efeitos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(nome + ": " + JSON.stringify(real) + " != " + JSON.stringify(esperado));
};

const PACOTE = AD.normalizarPacote({ id: "so-percepcao", nome: "Só Percepção", versao: "1.0.0", autor: "t", regrasAfty: { atencaoSoPercepcao: true } });
t("o pacote valida", AD.validarPacote(PACOTE), []);
t("o verbo sobrevive ao normalizador", RG.normalizarRegrasAfty(PACOTE.regrasAfty), { atencaoSoPercepcao: true });
t("valor que não é booleano reprova", RG.validarRegrasAfty({ atencaoSoPercepcao: "sim" }, "x"), ['x: "atencaoSoPercepcao" precisa ser verdadeiro ou falso.']);
t("a união acende o verbo", [RG.regrasAftyDaCriatura({ addons: [PACOTE] }).atencaoSoPercepcao, RG.regrasAftyDaCriatura({ addons: [] }).atencaoSoPercepcao], [true, false]);

/* O filtro puro. */
const lista = [
  { canal: "atencao", expr: "5", origem: "a" }, { canal: "bonusPericia", alvo: "percepcao", expr: "3", origem: "a" },
  { canal: "atencao", expr: "5", origem: "b" },
  { canal: "bonusPericia", alvo: "furtividade", expr: "3", origem: "c" }, { canal: "atencao", expr: "2", origem: "c" },
];
t("o filtro tira a Atenção só de quem também dá Percepção",
  atencaoSoPelaPercepcao(lista).map((e) => e.origem + ":" + e.canal), ["a:bonusPericia", "b:atencao", "c:bonusPericia", "c:atencao"]);

/* A ficha: Sentidos Aguçados do Conjurador (Atenção e Percepção pelo mesmo bônus) e Atenção Infalível (+5 Atenção). */
const ficha = (addon, extra = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = "player";
  f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum" };
  f.attributes = { forca: 12, destreza: 12, constituicao: 14, inteligencia: 18, sabedoria: 12, presenca: 10 };
  f.addons = addon ? [PACOTE] : [];
  Object.assign(f, extra);
  AD.aplicarAddons(f.addons);
  return deriveAfty(f);
};
const dupla = { especializacoes: [{ id: "conjurador", nivel: 10 }], habilidades: ["cnj_sentidos_agucados"] };
const sem = ficha(false, dupla), com = ficha(true, dupla);
t("sem o addon os Sentidos Aguçados sobem a Atenção duas vezes", [sem.calc.atencao - sem.testes.atencao, com.calc.atencao - com.testes.atencao], [2, 0]);
t("com o addon a Percepção não muda", com.testes.atencao, sem.testes.atencao);
const soAtencao = { talentos: ["tal_atencao_infalivel"] };
t("a fonte que dá só Atenção passa intacta", ficha(true, soAtencao).calc.atencao, ficha(false, soAtencao).calc.atencao);

if (bad.length) { console.log(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
