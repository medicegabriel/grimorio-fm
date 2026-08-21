import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const AD = await import(R + "afty-addons.js");
const OR = await import(R + "afty-origens.js");
const AN = await import(R + "afty-alto-nivel.js");
const { createBlankAfty } = await import(R + "afty-schema.js");

let ok = 0; const bad = [];
const t = (n, r, e) => { if (JSON.stringify(r) === JSON.stringify(e)) ok++; else bad.push(`${n}: ${JSON.stringify(r)} != ${JSON.stringify(e)}`); };

const RAW = {
  origensCat: OR.AFTY_ORIGENS_CATALOG.length,
  origensSel: OR.AFTY_ORIGENS.length,
  mel: AN.MELHORIAS_SUPERIORES.length,
  len: AN.HABILIDADES_LENDARIAS.length,
  api: AN.HABILIDADES_APICE.length,
};
t("o seletor de origem espelha o catalogo", RAW.origensSel, RAW.origensCat);

const P = {
  id: "mesa-alta", nome: "Mesa Alta", versao: "1.0.0",
  acrescenta: {
    origens: [{ id: "org_nova", nome: "Origem Nova", resumo: "x", descricao: "y" }],
    melhoriasSuperiores: [{ id: "mel_nova", nome: "Melhoria Nova", descricao: "x", maxVezes: 3 }],
    lendarias: [{ id: "len_nova", nome: "Lendária Nova", descricao: "x" }],
    apices: [{ id: "api_nova", nome: "Ápice Nova", descricao: "x" }],
  },
};
t("pacote valido", AD.validarPacote(P), []);
t("Melhoria sem maxVezes e recusada ANTES de instalar",
  AD.validarPacote({ ...P, acrescenta: {
    melhoriasSuperiores: [{ id: "m", nome: "M", descricao: "x" }] } }).length > 0, true);
t("instala", AD.aplicarAddons([P]).problemas, []);

/* ORIGENS: as duas estruturas derivadas religaram. */
t("catalogo de origem cresceu", OR.AFTY_ORIGENS_CATALOG.length, RAW.origensCat + 1);
t("o SELETOR cresceu junto", OR.AFTY_ORIGENS.length, RAW.origensSel + 1);
t("o seletor tem o rotulo certo",
  OR.AFTY_ORIGENS.find((o) => o.value === "mesa-alta:org_nova")?.label, "Origem Nova");
t("getOrigem resolve", !!OR.getOrigem("mesa-alta:org_nova"), true);
t("origens valido", OR.validarCatalogoOrigens(), []);

/* ALTO NIVEL: as tres. */
t("melhorias cresceu", AN.MELHORIAS_SUPERIORES.length, RAW.mel + 1);
t("lendarias cresceu", AN.HABILIDADES_LENDARIAS.length, RAW.len + 1);
t("apices cresceu", AN.HABILIDADES_APICE.length, RAW.api + 1);
t("getMelhoriaSuperior resolve", !!AN.getMelhoriaSuperior("mesa-alta:mel_nova"), true);
t("getHabilidadeLendaria resolve", !!AN.getHabilidadeLendaria("mesa-alta:len_nova"), true);
t("getHabilidadeApice resolve", !!AN.getHabilidadeApice("mesa-alta:api_nova"), true);
t("alto nivel valido", AN.validarCatalogoAltoNivel(), []);

/* A ficha usa a origem de addon. */
const c = createBlankAfty();
c.core.nd = 25; c.core.tipo = "combatente";
c.core.origem = { id: "mesa-alta:org_nova" };
c.addons = [P];
const d = deriveAfty(c);
t("derive com origem de addon", typeof d.hp, "number");
t("sem linha morta", d.addonProblemas, []);

/* Sem o addon, a origem vira linha morta e a ficha ABRE. */
AD.limparAddons();
const orfa = deriveAfty({ ...c, addons: [] });
t("origem orfa vira linha morta", orfa.addonProblemas.some((p) => p.familia === "origens"), true);
t("e a ficha abre", typeof orfa.hp, "number");

/* Desinstalar devolve tudo. */
t("origens voltou", OR.AFTY_ORIGENS_CATALOG.length, RAW.origensCat);
t("seletor voltou", OR.AFTY_ORIGENS.length, RAW.origensSel);
t("melhorias voltou", AN.MELHORIAS_SUPERIORES.length, RAW.mel);
t("lendarias voltou", AN.HABILIDADES_LENDARIAS.length, RAW.len);
t("apices voltou", AN.HABILIDADES_APICE.length, RAW.api);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
