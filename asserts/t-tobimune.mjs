import { register } from "node:module";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);

const { deriveAfty } = await import("../src/systems/afty/afty-derive.js");
const { createBlankAfty } = await import("../src/systems/afty/afty-schema.js");
const {
  aplicarAddons,
  limparAddons,
  normalizarPacote,
  substituicaoEnergiaReversaPorAddon,
  validarPacote,
} = await import("../src/systems/afty/afty-addons.js");
const { getEquipamento, novaEntradaEquip } = await import("../src/systems/afty/afty-equipamentos.js");
const { orcamentoDaArma } = await import("../src/systems/afty/afty-criacao-armas.js");
const { abasAptidao, trilhasDaCriatura } = await import("../src/systems/afty/afty-aptidoes.js");

const pacote = JSON.parse(readFileSync(new URL("../addons/tobimune.json", import.meta.url), "utf8"));
const APTIDOES_CURA = [
  "mal_regeneracao_corporal",
  "mal_regeneracao_ampliada",
  "mal_regeneracao_maxima",
  "mal_regeneracao_de_membros",
  "mal_fluxo_imparavel",
];

let total = 0;
const igual = (real, esperado) => {
  assert.deepEqual(real, esperado);
  total += 1;
};

igual(validarPacote(pacote), []);
igual(aplicarAddons([pacote]).problemas, []);
igual(normalizarPacote(pacote).substituiEnergiaReversa, {
  tab: "Tobimune",
  aptidoes: APTIDOES_CURA,
});

const arma = getEquipamento("arma", "tobimune:tobimune");
igual(arma.nome, "Tobimune");
igual(arma.custo, 4);
igual(arma.grupo, "espada");
igual(arma.dano, { dado: "1d12 + 1d4", duasMaos: "2d8", tipo: "ct" });
igual(arma.critico, 18);
igual(arma.faFixa, undefined);
igual(arma.faPadrao.grau, "quarto");

const orcamento = orcamentoDaArma(arma, { grauOrdem: 4 });
igual(orcamento.pool.total, 20);
igual(orcamento.gastos, {
  dano: 6,
  margem: 6,
  propriedades: 8,
  especial: 0,
  total: 20,
});
igual(orcamento.sobra, 0);
igual(orcamento.avisos, []);

const ficha = createBlankAfty();
ficha.rulesVersion = "player";
ficha.core.nd = 20;
ficha.addons = [pacote];
const entrada = novaEntradaEquip("arma", arma.id, arma);
ficha.equipamentos.itens = [entrada];

igual(entrada.equipado, true);
igual(substituicaoEnergiaReversaPorAddon(ficha), {
  tab: "Tobimune",
  aptidoes: APTIDOES_CURA,
});
igual(abasAptidao(ficha).map((a) => a.id), [
  "aura",
  "controle_leitura",
  "barreiras",
  "dominio",
  "maldicao",
  "especiais",
]);
igual(abasAptidao(ficha).find((a) => a.id === "maldicao"), {
  id: "maldicao",
  label: "Aptidões de Maldição",
  tab: "Tobimune",
  trilha: null,
  origemId: "maldicao",
  aptidoesPermitidas: APTIDOES_CURA,
});
igual(trilhasDaCriatura(ficha).some((t) => t.key === "er"), false);
igual(deriveAfty(ficha).aptidoesEscolhidas, []);

ficha.aptidoesAmaldicoadas = [...APTIDOES_CURA, "energia_reversa"];
igual(deriveAfty(ficha).aptidoesEscolhidas, APTIDOES_CURA);
igual(deriveAfty({
  ...ficha,
  equipamentos: { itens: [{ ...entrada, equipado: false }] },
}).aptidoesEscolhidas, APTIDOES_CURA);

const semAddon = { ...ficha, addons: [], aptidoesAmaldicoadas: [] };
igual(abasAptidao(semAddon).map((a) => a.id).includes("energia_reversa"), true);
igual(trilhasDaCriatura(semAddon).some((t) => t.key === "er"), true);

limparAddons();
igual(getEquipamento("arma", "tobimune:tobimune"), null);

console.log(`TODOS OS ${total} ASSERTS PASSARAM`);
