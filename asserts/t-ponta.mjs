import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* A criatura base: Lutador ND 12. O Funcionamento Básico é o ÚNICO lugar onde o
   jogador escreve expressão hoje, então é por ele que o `contar()` se prova de
   ponta a ponta, passando pelo motor de verdade. */
const criatura = (habilidades, expr) => {
  const c = createBlankAfty();
  c.core.nd = 12;
  c.core.tipo = "combatente";
  c.especializacoes = [{ id: "lutador", nivel: 12 }];
  c.habilidades = habilidades;
  if (expr) c.core.tecnicaEfeitos = [{ canal: "rdGeral", expr }];
  return c;
};

const EXPR = '2 + contar("lutador") - 1';   // o caso do autor, verbatim na forma

const rdBase = deriveAfty(criatura([], null)).rdGeral;
const rd0 = deriveAfty(criatura([], EXPR)).rdGeral;
const rd1 = deriveAfty(criatura(["lut_corpo_treinado"], EXPR)).rdGeral;
const rd2 = deriveAfty(criatura(["lut_corpo_treinado", "lut_reflexo_evasivo"], EXPR)).rdGeral;
const rd3 = deriveAfty(criatura(["lut_corpo_treinado", "lut_reflexo_evasivo", "lut_implemento_marcial"], EXPR)).rdGeral;

/* ⚠ Reflexo Evasivo dá RD por conta própria (metade do nível de Lutador), então
   a comparação tem de ser contra a MESMA ficha sem a expressão, e não contra a
   ficha vazia. O delta é o que o `contar()` acrescentou.

   ⚠ A EMPOLGAÇÃO ENTRA NA CONTA sem ninguém escolher (base automática do
   Lutador desde 2026-08-20), porque a concedida vai para `escolhidas` e é dali
   que saem as marcas. Por isso a contagem começa em 1 e não em 0. */
const delta = (habs) =>
  deriveAfty(criatura(habs, EXPR)).rdGeral - deriveAfty(criatura(habs, null)).rdGeral;

t("so a Empolgacao concedida: 2 + 1 - 1", delta([]), 2);
t("uma habilidade: 2 + 2 - 1", delta(["lut_corpo_treinado"]), 3);
t("duas habilidades: 2 + 3 - 1", delta(["lut_corpo_treinado", "lut_reflexo_evasivo"]), 4);
t("tres habilidades: 2 + 4 - 1",
  delta(["lut_corpo_treinado", "lut_reflexo_evasivo", "lut_implemento_marcial"]), 5);

/* E a prova de que é a concedida mesmo: sem Lutador nenhum, a conta zera. */
const semLutador = () => {
  const c = criatura([], EXPR);
  c.especializacoes = [{ id: "restringido", nivel: 12 }];
  return c;
};
const semLutadorCru = () => {
  const c = semLutador();
  c.core.tecnicaEfeitos = [];
  return c;
};
t("sem Lutador: 2 + 0 - 1",
  deriveAfty(semLutador()).rdGeral - deriveAfty(semLutadorCru()).rdGeral, 1);

t("a RD realmente subiu no total", rd2 > rd0, true);
t("expressao sem contar continua valendo", deriveAfty(criatura([], "5")).rdGeral - rdBase, 5);

/* Contando por FAMÍLIA em vez de especialização. */
const deltaFam = (habs) =>
  deriveAfty(criatura(habs, 'contar("habilidade")')).rdGeral
  - deriveAfty(criatura(habs, null)).rdGeral;
t("familia habilidade conta as duas mais a concedida",
  deltaFam(["lut_corpo_treinado", "lut_reflexo_evasivo"]), 3);

/* Marca que ninguém tem: zero, e o resto da expressão continua valendo. */
t("marca inexistente nao quebra a expressao",
  deriveAfty(criatura(["lut_corpo_treinado"], '7 + contar("nao_existe")')).rdGeral
  - deriveAfty(criatura(["lut_corpo_treinado"], null)).rdGeral, 7);

/* Erro de expressão continua caindo no fallback sem derrubar o derive. */
t("expressao quebrada nao derruba",
  typeof deriveAfty(criatura(["lut_corpo_treinado"], 'contar("a" + 2)')).rdGeral, "number");
t("texto solto nao derruba",
  typeof deriveAfty(criatura(["lut_corpo_treinado"], '"abc"')).rdGeral, "number");

/* Ficha suja não derruba o derive (garantia de sempre). */
for (const lixo of [null, undefined, {}, { core: null }, { habilidades: "nao-e-lista" }]) {
  try { deriveAfty(lixo); ok++; } catch (e) { bad.push(`ficha suja ${JSON.stringify(lixo)}: ${e.message}`); }
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
