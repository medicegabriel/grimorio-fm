import assert from "node:assert/strict";
import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const { textoDosDados, formulaModoDano, comFormulasDeDano } = await import("../src/systems/afty/afty-dano.js");
const { rolarDano } = await import("../src/systems/afty/ficha/ficha-rolagem.js");
let ok = 0;
const t = (nome, real, esperado) => { assert.deepEqual(real, esperado, nome); ok++; };
const grupo = (dados, faces = 12, extra = {}) => ({ dados, faces, ...extra });
for (const [quantidade, esperado] of [
  [0, ""], [99, "99d12"], [100, "100d12"], [101, "100d12 + 1d12"],
  [110, "100d12 + 10d12"], [200, "100d12 + 100d12"], [201, "100d12 + 100d12 + 1d12"],
]) t(`fronteira ${quantidade}`, textoDosDados([grupo(quantidade)]), esperado);
t("soma fontes antes de dividir e conserva faces", textoDosDados([
  grupo(70), grupo(40), grupo(105, 8),
]), "100d12 + 10d12 + 100d8 + 5d8");
const grupos = [grupo(55, 12, { fixo: 7 }), grupo(110, 6, { momento: "apos", fixo: 3 })];
t("crítico divide depois de dobrar e conserva o fixo", formulaModoDano(grupos, "critico"),
  "100d12 + 10d12 + 100d6 + 10d6 + 10");
t("Raio Negro mantém blocos critáveis dentro do parêntese", formulaModoDano(grupos, "raio_negro"),
  "(100d12 + 10d12)/2*3 + 100d6 + 10d6 + 10");
const linha = comFormulasDeDano({ gruposDano: [grupo(110)] });
t("fórmula e hover concordam", [linha.formulaNormal, linha.hoverDano.total],
  ["100d12 + 10d12", "100d12 + 10d12"]);
for (const [modoDano, total, quantidade] of [["normal", 175, 165], ["critico", 230, 220], ["raio_negro", 285, 220]]) {
  const r = rolarDano({ grupos, modoDano }, () => 0);
  t(`rolagem ${modoDano} conserva todos os dados e o dano`, [r.dados.length, r.total, r.formula],
    [quantidade, total, formulaModoDano(grupos, modoDano)]);
}
const explosiva = rolarDano({ dados: 110, faces: 12, explosiva: true }, () => 0);
t("explosiva marca todos os blocos", explosiva.formula, "100d12! + 10d12!");
const personalizada = rolarDano({ dados: 55, faces: 10, blocos: 2, critico: true }, () => 0);
t("rolagem simples compõe blocos e crítico", [personalizada.formula, personalizada.dados.length],
  ["100d10 + 100d10 + 20d10", 220]);
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
