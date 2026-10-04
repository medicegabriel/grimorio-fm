import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons, limparAddons } = await import(R + "afty-addons.js");
const INV = await import(R + "afty-invocacoes.js");
const EQ = await import(R + "afty-equipamentos.js");
const { vocabularioDsl, vocabularioInvocacao } = await import(R + "afty-dsl-vocabulario.js");
const { validateExpression, evalNumber } = await import(R + "afty-dsl.js");
let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};
const nomesDe = (grupos) => new Set(grupos.flatMap((g) => g.itens.map((i) => i.nome)).filter((n) => !n.includes("(")));

// O seletor e o validador precisam reconhecer as variáveis do contexto avaliado.
for (const sistema of ["afty", "player"]) {
  const ficha = createBlankAfty();
  ficha.rulesVersion = sistema;
  const arma = EQ.catalogoDoTipo("arma")[0];
  ficha.equipamentos.itens = [{
    ...EQ.novaEntradaEquip("arma", arma.id, arma), equipado: true,
    fa: { grau: "especial", encantamentos: [], habilidadeUnica: "Teste", habilidadeEfeitos: [{ canal: "defesa", expr: "grau + piso(bt / 2)" }] },
  }];
  aplicarAddons(ficha.addons ?? []);
  const d = deriveAfty(ficha);
  const conhecidas = nomesDe(vocabularioDsl(d.contextoDsl, d.combate.estadosExtras));
  t(`${sistema}: nome errado reprova na criatura`, validateExpression("forca_errada + 1", conhecidas).ok, false);
  t(`${sistema}: fórmula da criatura aprova`, validateExpression("mod_forca + piso(bt / 2)", conhecidas).ok, true);
  t(`${sistema}: condição correta aprova`, validateExpression("sempre e nd >= 3", conhecidas).ok, true);
  t(`${sistema}: condição com nome errado reprova`, validateExpression("semrpe e nd >= 3", conhecidas).ok, false);
  const item = d.equip.entradas[0].fa.habilidadeEfeitos[0];
  const ctxItem = { ...d.contextoDsl, ...item.contextoDsl };
  const nomesItem = nomesDe(vocabularioDsl(ctxItem, d.combate.estadosExtras));
  t(`${sistema}: grau da ferramenta aprova`, validateExpression(item.expr, nomesItem).ok, true);
  t(`${sistema}: grau é o da ferramenta Especial`, ctxItem.grau, 5);
  t(`${sistema}: nome errado reprova na Habilidade Única`, validateExpression("forca_errada + 1", nomesItem).ok, false);
  t(`${sistema}: prévia da Habilidade Única usa seu contexto`, item.valor, evalNumber(item.expr, ctxItem, -999));
  const inv = INV.createBlankInvocacao("quarto", "shikigami");
  inv.atributos.forca = 18;
  const ctxInv = INV.buildInvocacaoDslContext(inv, { nd: d.nd, bt: d.bt });
  const nomesInv = nomesDe(vocabularioInvocacao(ctxInv));
  const exprInv = "grau + mod_forca + nd + bt + tipo_shikigami_puro + sempre + nunca";
  t(`${sistema}: nome errado reprova na invocação`, validateExpression("forca_errada + 1", nomesInv).ok, false);
  t(`${sistema}: fórmula do namespace da invocação aprova`, validateExpression(exprInv, nomesInv).ok, true);
  t(`${sistema}: atributo é o da invocação`, evalNumber("mod_forca", ctxInv, -999), 4);
  t(`${sistema}: variável exclusiva da criatura reprova na invocação`, validateExpression("em_combate + 1", nomesInv).ok, false);
  t(`${sistema}: todas as variáveis expostas da invocação são válidas`, [...nomesInv].filter((nome) => !validateExpression(nome, nomesInv).ok), []);
}
limparAddons();
console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
