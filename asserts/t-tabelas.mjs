import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
const R = new URL("../src/systems/afty/", import.meta.url).href;
await import(R + "afty-derive.js");
const AD = await import(R + "afty-addons.js");
const EQ = await import(R + "afty-equipamentos.js");
const FE = await import(R + "afty-feiticos.js");

let ok = 0; const bad = [];
const t = (n, r, e) => { if (JSON.stringify(r) === JSON.stringify(e)) ok++; else bad.push(`${n}: ${JSON.stringify(r)} != ${JSON.stringify(e)}`); };

const DANO_RAW = { ...EQ.TIPOS_DANO };
const COND_RAW = JSON.parse(JSON.stringify(FE.CONDICOES_CATALOGO));

t("ha familias registradas", AD.familiasDeAddon().length > 0, true);
t("tiposDano registrada", AD.familiasDeAddon().some((f) => f.id === "tiposDano"), true);
t("condicoes registrada", AD.familiasDeAddon().some((f) => f.id === "condicoes"), true);

const PACOTE = {
  id: "mesa-teste", nome: "Mesa", versao: "1.0.0",
  acrescenta: {
    tiposDano: [{ value: "sonico", label: "Sônico" }, { value: "psiquico", label: "Psíquico" }],
    condicoes: [
      { id: "cnd_congelado", nome: "Congelado", forca: "media" },
      { id: "cnd_apagado", nome: "Apagado", forca: "extrema" },
    ],
  },
};
t("pacote de tabela e valido", AD.validarPacote(PACOTE), []);
t("tipo de dano sem label reprova",
  AD.validarPacote({ ...PACOTE, acrescenta: { tiposDano: [{ value: "x" }] } }).length > 0, true);
t("condicao sem forca reprova",
  AD.validarPacote({ ...PACOTE, acrescenta: { condicoes: [{ id: "c", nome: "C" }] } }).length > 0, true);

const r = AD.aplicarAddons([PACOTE]);
t("instalou", r.problemas, []);

/* ---- TIPOS DE DANO ---- */
t("dois tipos novos", Object.keys(EQ.TIPOS_DANO).length, Object.keys(DANO_RAW).length + 2);
t("chave prefixada", EQ.TIPOS_DANO["mesa-teste:sonico"], "Sônico");
t("chave crua NAO existe", EQ.TIPOS_DANO.sonico, undefined);
t("os do raw continuam", EQ.TIPOS_DANO.ct, "Cortante");

/* A arma custom sanea pelo Set das chaves: se ele nao religou, o tipo novo cai. */
const arma = EQ.createArmaCustom ? EQ.createArmaCustom() : null;
if (arma) {
  const saneada = EQ.patchArmaCustomSanear
    ? EQ.patchArmaCustomSanear({ ...arma, danoTipo: "mesa-teste:sonico" })
    : null;
  if (saneada) t("arma aceita o tipo de addon", saneada.danoTipo, "mesa-teste:sonico");
}

/* ---- CONDICOES ---- */
t("uma condicao media a mais", FE.CONDICOES_CATALOGO.media.length, COND_RAW.media.length + 1);
t("uma extrema a mais", FE.CONDICOES_CATALOGO.extrema.length, COND_RAW.extrema.length + 1);
t("o NOME entra limpo, sem namespace", FE.CONDICOES_CATALOGO.media.includes("Congelado"), true);
t("nenhum nome com dois-pontos",
  Object.values(FE.CONDICOES_CATALOGO).flat().some((n) => n.includes(":")), false);
t("as forcas nao tocadas ficam iguais", FE.CONDICOES_CATALOGO.fraca, COND_RAW.fraca);

/* Força inexistente nao quebra e nao inventa grupo. */
AD.aplicarAddons([{ ...PACOTE, acrescenta: { condicoes: [{ id: "c", nome: "X", forca: "epica" }] } }]);
t("forca inexistente nao cria grupo", FE.CONDICOES_CATALOGO.epica, undefined);
t("e nao derruba", Object.keys(FE.CONDICOES_CATALOGO).length, Object.keys(COND_RAW).length);

/* ---- desinstalar volta as duas tabelas ---- */
AD.limparAddons();
t("tipos de dano voltaram", EQ.TIPOS_DANO, DANO_RAW);
t("condicoes voltaram", FE.CONDICOES_CATALOGO, COND_RAW);
t("catalogo de equipamentos valido", EQ.validarCatalogoEquipamentos(), []);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
