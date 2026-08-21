import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/", import.meta.url).href;
const A = await import(R + "systems/afty/afty-dsl.js");
const F = await import(R + "components/fm-dsl.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ---- 1. PARIDADE com o fm-dsl da 2.5.2 ---- */
const ctx = { nd: 12, bt: 5, mod_forca: 3, dom: 2, hp_atual: 10, hp_max: 40 };
const paridade = [
  "metade(nd)", "bt + 2", "dom >= 3", "hp_atual < metade(hp_max)", "max(mod_forca, 1)",
  "dom >= 3 e nd >= 10", "nao (dom >= 3)", "-nd", "piso(nd/1.75)", "teto(nd/5)",
  "nd % 5", "(nd + bt) * 2", "verdadeiro", "falso", "nd != 12", "1/0", "nd/0",
  "abs(0 - nd)", "arredonda(nd/7)", "dobro(bt)", "min(nd, bt, 3)",
  "nd >= 10 ou dom >= 9", "!(nd == 12)", "nd <= 12 e nd > 11",
];
for (const e of paridade) t(`paridade ${e}`, A.evalNumber(e, ctx), F.evalNumber(e, ctx));
t("paridade var desconhecida", A.evalNumber("xyz", ctx, -1), F.evalNumber("xyz", ctx, -1));
t("paridade sintaxe ruim", A.evalNumber("nd +", ctx, -1), F.evalNumber("nd +", ctx, -1));
t("paridade caractere invalido", A.evalNumber("nd @ 2", ctx, -1), F.evalNumber("nd @ 2", ctx, -1));
t("paridade acento", A.evalNumber("Constituicao", { constituicao: 14 }), F.evalNumber("Constituicao", { constituicao: 14 }));
t("paridade evalBoolean", A.evalBoolean("dom >= 3", ctx), F.evalBoolean("dom >= 3", ctx));
t("paridade validate ok", A.validateExpression("metade(nd)"), F.validateExpression("metade(nd)"));
t("paridade validate func", A.validateExpression("xpto(nd)"), F.validateExpression("xpto(nd)"));
t("paridade validate vazio", A.validateExpression(""), F.validateExpression(""));
t("paridade knownVars", A.validateExpression("nd + zzz", new Set(["nd"])), F.validateExpression("nd + zzz", new Set(["nd"])));

/* ---- 2. contar() e o literal de texto ---- */
const M = A.CHAVE_MARCAS;
const marcas = { ...ctx, [M]: { adaptacao: 3, postura: 1 } };
t("contar existente", A.evalNumber('contar("adaptacao")', marcas), 3);
t("contar aspas simples", A.evalNumber("contar('adaptacao')", marcas), 3);
t("contar inexistente", A.evalNumber('contar("nada")', marcas), 0);
t("contar sem mapa nenhum", A.evalNumber('contar("adaptacao")', ctx), 0);
t("contar normaliza acento e caixa", A.evalNumber('contar("ADAPTAÇÃO")', { [M]: { adaptacao: 2 } }), 2);
t("O CASO DO AUTOR: 2 + contar - 1", A.evalNumber('2 + contar("adaptacao") - 1', marcas), 4);
t("contar em conta", A.evalNumber('contar("postura") * 3 + nd', marcas), 15);
t("contar em condicao", A.evalNumber('contar("adaptacao") >= 3', marcas), 1);
t("contar dentro de funcao pura", A.evalNumber('metade(contar("adaptacao"))', marcas), 1.5);
t("contar sem argumento", A.evalNumber("contar()", marcas), 0);
t("marca vazia", A.evalNumber('contar("")', marcas), 0);

/* ---- 3. texto fora de lugar ---- */
t("texto solto reprova", A.validateExpression('"abc"').ok, false);
t("texto em soma reprova", A.validateExpression('2 + "abc"').ok, false);
t("texto em funcao pura reprova", A.validateExpression('metade("abc")').ok, false);
t("texto no 2o arg de contar reprova", A.validateExpression('contar("a", "b")').ok, false);
t("contar aprova", A.validateExpression('contar("abc")').ok, true);
t("contar aninhado aprova", A.validateExpression('2 + contar("abc") * bt').ok, true);
t("aspas sem fechar reprova", A.validateExpression('contar("abc').ok, false);
t("texto em conta cai no fallback", A.evalNumber('2 + "abc"', ctx, -1), -1);
t("texto em funcao pura cai no fallback", A.evalNumber('metade("abc")', ctx, -1), -1);
t("mapa de marcas nao e legivel como variavel", A.evalNumber("marcas", marcas, -1), -1);

/* ---- 4. o fm-dsl NAO entende nada disso (prova de que a copia era necessaria) ---- */
t("2.5.2 nao tem contar", F.validateExpression('contar("x")').ok, false);
t("2.5.2 nao tem aspas", F.evalNumber('contar("x")', marcas, -1), -1);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
