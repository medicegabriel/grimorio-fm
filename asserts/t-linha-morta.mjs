import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const AD = await import(R + "afty-addons.js");
const { createBlankAfty } = await import(R + "afty-schema.js");

let ok = 0; const bad = [];
const t = (n, r, e) => { if (JSON.stringify(r) === JSON.stringify(e)) ok++; else bad.push(`${n}: ${JSON.stringify(r)} != ${JSON.stringify(e)}`); };

const UMA = { id: "ciclo_de_adaptacao", nome: "Ciclo de Adaptação", especializacaoId: "lutador",
  tipo: "base", nivel: 1, descricao: "Adapta-se.", requisitos: [] };
const PACOTE = { id: "minha-mesa", nome: "Regras da Mesa", versao: "1.0.0",
  acrescenta: { habilidades: [UMA] } };

const ficha = (habs, addons) => {
  const c = createBlankAfty();
  c.core.nd = 12; c.core.tipo = "combatente";
  c.especializacoes = [{ id: "lutador", nivel: 12 }];
  c.habilidades = habs; c.addons = addons;
  return c;
};

/* 1. Tudo certo: addon ligado e entrada existe. */
AD.aplicarAddons([PACOTE]);
t("sem problema quando tudo resolve",
  deriveAfty(ficha(["minha-mesa:ciclo_de_adaptacao"], [PACOTE])).addonProblemas, []);
t("id do raw nunca vira problema",
  deriveAfty(ficha(["lut_corpo_treinado"], [PACOTE])).addonProblemas, []);
t("ficha sem addon nenhum", deriveAfty(ficha([], [])).addonProblemas, []);

/* 2. A ficha cita um addon que NÃO está ligado nela. */
AD.limparAddons();
const orfa = deriveAfty(ficha(["minha-mesa:ciclo_de_adaptacao"], []));
t("um problema", orfa.addonProblemas.length, 1);
t("nomeia o pacote", orfa.addonProblemas[0].pacoteId, "minha-mesa");
t("nomeia a entrada", orfa.addonProblemas[0].idCru, "ciclo_de_adaptacao");
t("diz a familia", orfa.addonProblemas[0].rotulo, "Habilidade de Especialização");
t("tem motivo legivel", orfa.addonProblemas[0].motivo.includes("não está ligado"), true);
t("tem saida", orfa.addonProblemas[0].saida.includes("aba Addons"), true);
t("A FICHA ABRE MESMO ASSIM", typeof orfa.hp, "number");

/* 3. O addon está na ficha mas a entrada sumiu da versão nova. */
const SEM_A_ENTRADA = { ...PACOTE, versao: "2.0.0", acrescenta: { habilidades: [{ ...UMA, id: "outra_coisa" }] } };
AD.aplicarAddons([SEM_A_ENTRADA]);
const sumiu = deriveAfty(ficha(["minha-mesa:ciclo_de_adaptacao"], [SEM_A_ENTRADA]));
t("entrada removida vira problema", sumiu.addonProblemas.length, 1);
t("e o motivo e outro", sumiu.addonProblemas[0].motivo.includes("não declara mais"), true);
t("a ficha continua abrindo", typeof sumiu.hp, "number");

/* 4. Vários problemas de uma vez. */
AD.limparAddons();
const varios = deriveAfty(ficha(["minha-mesa:a", "minha-mesa:b", "lut_corpo_treinado"], []));
t("dois problemas, e o raw fora deles", varios.addonProblemas.length, 2);

/* 5. Ficha suja. */
for (const lixo of [null, undefined, {}, { habilidades: "nao-e-lista" }]) {
  try { deriveAfty(lixo); ok++; } catch (e) { bad.push(`ficha suja: ${e.message}`); }
}
t("problemasDeAddon com lixo", AD.problemasDeAddon(null), []);

AD.limparAddons();
console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
