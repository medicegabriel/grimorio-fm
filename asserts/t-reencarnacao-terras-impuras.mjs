import { register } from "node:module";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

register(
  'data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}',
  import.meta.url,
);

const { aplicarAddons, feiticosDeAddon, validarPacote } = await import("../src/systems/afty/afty-addons.js");
const { calcularFeiticoPersonalizado, resumoFeiticos } = await import("../src/systems/afty/afty-feiticos.js");
const { AFTY_INV_GRAUS } = await import("../src/systems/afty/afty-invocacoes.js");

const texto = readFileSync(
  new URL("../addons/reencarnacao-das-terras-impuras.json", import.meta.url),
  "utf8",
);
const pacote = JSON.parse(texto);

let total = 0;
const igual = (real, esperado) => {
  assert.deepEqual(real, esperado);
  total += 1;
};

igual(validarPacote(pacote), []);
igual(aplicarAddons([pacote]).problemas, []);
igual(texto.includes("\u2014"), false);
igual(pacote.nome, "Reencarnação das Terras Impuras");
igual(pacote.funcionamentos.length, 1);
igual(pacote.feiticos.length, 6);
igual(
  pacote.feiticos.map((feitico) => [feitico.tipo, feitico.nivel, feitico.acaoPersonalizada]),
  Array.from({ length: 6 }, () => ["personalizado", 0, "Ritual Estendido"]),
);
igual(
  AFTY_INV_GRAUS.map((grau) => [grau.label, grau.custoBase]),
  [
    ["Quarto Grau", 2],
    ["Terceiro Grau", 4],
    ["Segundo Grau", 6],
    ["Primeiro Grau", 8],
    ["Grau Especial", 12],
  ],
);

const modelos = feiticosDeAddon({ addons: [pacote] }, 0);
igual(modelos.length, 6);
igual(modelos.every((feitico) => feitico.id.startsWith(`${pacote.id}:`)), true);

const corpo = pacote.feiticos.find((feitico) => feitico.id === "reviver_apenas_o_corpo");
const corpoCalc = calcularFeiticoPersonalizado(corpo);
igual(corpoCalc.custoPE, null);
igual(corpoCalc.custoPETexto, "2/4/6/8/12 PE");

const massa = pacote.feiticos.find((feitico) => feitico.id === "manifestacao_em_massa");
igual(calcularFeiticoPersonalizado(massa).custoPETexto, "Soma dos corpos");

const receptaculo = pacote.feiticos.find((feitico) => feitico.id === "receptaculo_temporario");
igual(receptaculo.comCd, true);
igual(receptaculo.duracaoTexto, "Até o fim da cena");
igual(receptaculo.descricao.includes("perde o controle do corpo para a alma da entidade"), true);

const ficha = { feiticos: [{ ...corpo, id: `${pacote.id}:${corpo.id}` }] };
const resumo = resumoFeiticos(ficha, { cdBase: 17 });
igual(resumo[0].custoPE, null);
igual(resumo[0].custoPETexto, "2/4/6/8/12 PE");

console.log(`TODOS OS ${total} ASSERTS PASSARAM`);
