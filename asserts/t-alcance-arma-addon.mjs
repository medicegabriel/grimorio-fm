import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { aplicarAddons, limparAddons, validarPacote } = await import(R + "afty-addons.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { alcanceDaArma, getEquipamento, novaEntradaEquip } = await import(R + "afty-equipamentos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

const PACOTE = {
  id: "arma-progressiva",
  nome: "Arma Progressiva",
  versao: "1.0.0",
  paraRaw: "afty",
  acrescenta: {
    armas: [{
      id: "arma_teste",
      nome: "Arma de Teste",
      classe: "complexa",
      categoria: "distancia",
      dano: { dado: "2d8", tipo: "pf" },
      critico: 19,
      espacos: 2,
      custo: 3,
      grupo: "tiro",
      props: { alcance: [45], duas_maos: true },
      alcancePorTreino: {
        2: [30, 60],
        3: [60, 120],
        4: [120, 240],
        5: [240, 360],
      },
      equipadoPadrao: true,
    }],
  },
};

t("pacote com alcance por Treino é válido", validarPacote(PACOTE), []);
t("instala sem problema", aplicarAddons([PACOTE]).problemas, []);

const def = getEquipamento("arma", "arma-progressiva:arma_teste");
t("abaixo do primeiro degrau conserva o alcance base", alcanceDaArma(def, 1)?.texto, "45m");
t("Treino 2 usa o primeiro degrau", alcanceDaArma(def, 2)?.texto, "30m / 60m");
t("Treino 4 usa o degrau exato", alcanceDaArma(def, 4)?.texto, "120m / 240m");
t("acima da tabela conserva o último degrau", alcanceDaArma(def, 7)?.texto, "240m / 360m");

const fichaNoNd = (nd) => {
  const ficha = createBlankAfty();
  ficha.core.nd = nd;
  ficha.addons = [PACOTE];
  ficha.equipamentos.itens = [novaEntradaEquip("arma", def.id, def)];
  return ficha;
};
const alcanceDerivado = (nd) => deriveAfty(fichaNoNd(nd)).dano.entradas
  .find((e) => e.id === "arma-progressiva:arma_teste")?.alcance?.texto;

t("ND 1 deriva Treino 2 na linha da arma", alcanceDerivado(1), "30m / 60m");
t("ND 5 deriva Treino 3 na linha da arma", alcanceDerivado(5), "60m / 120m");
t("ND 9 deriva Treino 4 na linha da arma", alcanceDerivado(9), "120m / 240m");
t("ND 13 deriva Treino 5 na linha da arma", alcanceDerivado(13), "240m / 360m");
t("ND 24 mantém o teto declarado", alcanceDerivado(24), "240m / 360m");

limparAddons();

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
