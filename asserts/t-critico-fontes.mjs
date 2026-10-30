import assert from "node:assert/strict";
import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { resolveDano } = await import(R + "afty-pericias.js");
const { aplicarEfeitos, resolverExclusivos } = await import(R + "afty-efeitos.js");
let n = 0;
const igual = (a, b) => { assert.deepEqual(a, b); n++; };
const soma = (p) => p.filter((x) => !x.suplantado).reduce((s, x) => s + x.valor, 0);
const efeito = (nome, expr, alvo) => ({ canal: "margemCritico", nome, expr, alvo });

for (const sistema of ["afty", "player"]) {
  const creature = createBlankAfty();
  creature.rulesVersion = sistema;
  creature.core.nd = 20;
  creature.especializacoes = [{ id: "combatente", nivel: 20 }];
  creature.habilidades = ["cmb_critico_melhorado", "cmb_critico_aperfeicoado"];
  const derivado = deriveAfty(creature);
  const basico = derivado.dano.entradas[0];
  igual(basico.margemCritico, 18);
  igual(basico.partesMargemCritico.map((p) => [p.label, p.valor]), [
    ["Margem Base", 20], ["Crítico Melhorado", -1], ["Crítico Aperfeiçoado", -1],
  ]);
  igual(soma(basico.partesMargemCritico), basico.margemCritico);

  const montar = (efeitos, extra = {}) => resolveDano(creature, {
    sistema, efeitos, armas: [{ id: "espada", nome: "Espada", critico: 19, dadoArma: "1d6", grupo: "espada", propriedades: [] }],
    ...extra,
  }).entradas;
  const escopadas = montar(aplicarEfeitos([
    efeito("Geral", "1"), efeito("Só Espada", "2", "espada"), efeito("Só Básico", "3", "basico"),
    { ...efeito("Inativo", "9"), quando: "0" },
  ]));
  igual(escopadas.map((e) => e.margemCritico), [16, 16]);
  igual(escopadas[0].partesMargemCritico.map((p) => p.label), ["Margem Base", "Geral", "Só Básico"]);
  igual(escopadas[1].partesMargemCritico.map((p) => p.label), ["Margem da Arma", "Geral", "Só Espada"]);
  igual(escopadas.map((e) => soma(e.partesMargemCritico)), [16, 16]);

  const limitada = montar(aplicarEfeitos([efeito("Redução", "30")]))[0];
  igual(limitada.margemCritico, 2);
  igual(limitada.partesMargemCritico.at(-1), { label: "Margem Mínima", valor: 12 });
  igual(soma(limitada.partesMargemCritico), 2);
  const fracao = montar(aplicarEfeitos([efeito("Fração", "1.5")]))[0];
  igual(soma(fracao.partesMargemCritico), fracao.margemCritico);
  igual(fracao.partesMargemCritico.at(-1), { label: "Arredondamento", valor: 0.5 });

  const exclusiva = montar(resolverExclusivos(aplicarEfeitos([
    { ...efeito("Maior", "3"), grupoNaoAcumula: "critico" },
    { ...efeito("Menor", "1"), grupoNaoAcumula: "critico" },
  ])))[0];
  igual(exclusiva.margemCritico, 17);
  igual(exclusiva.partesMargemCritico.find((p) => p.label === "Menor").suplantado, true);
  igual(soma(exclusiva.partesMargemCritico), 17);

  const permutada = montar(aplicarEfeitos([efeito("Redução", "4")]), {
    ataques: [{ id: "corpo", nome: "Corpo a Corpo", atributo: "forca", bonus: 10, partes: [] }],
    permutasDeMargem: [{ nome: "Permuta", margem: 2, acerto: 3 }, { nome: "Não Cabe", margem: 3, acerto: 5 }],
  })[0];
  igual(permutada.partesMargemCritico.at(-1), { label: "Permuta", valor: 2 });
  igual(soma(permutada.partesMargemCritico), 18);
  igual(permutada.partesMargemCritico.some((p) => p.label === "Não Cabe"), false);

  creature.core.tecnicaEfeitos = [{ canal: "margemCriticoTR", alvo: "reflexos", expr: "2" }];
  const trs = deriveAfty(creature).testes.resistencias;
  const reflexos = trs.find((r) => r.value === "reflexos");
  igual(reflexos.margemCritico, 18);
  igual(soma(reflexos.partesMargemCritico), 18);
  igual(reflexos.partesMargemCritico[1].valor, -2);
  igual(trs.find((r) => r.value === "fortitude").partesMargemCritico, [{ label: "Margem Base", valor: 20, texto: "20" }]);
}
console.log(`TODOS OS ${n} ASSERTS PASSARAM`);
