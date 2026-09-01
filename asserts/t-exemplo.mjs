import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const AD = await import(R + "afty-addons.js");
const H = await import(R + "afty-habilidades.js");
const EQ = await import(R + "afty-equipamentos.js");
const FE = await import(R + "afty-feiticos.js");
const { createBlankAfty } = await import(R + "afty-schema.js");

let ok = 0; const bad = [];
const t = (n, r, e) => { if (JSON.stringify(r) === JSON.stringify(e)) ok++; else bad.push(`${n}: ${JSON.stringify(r)} != ${JSON.stringify(e)}`); };

const P = JSON.parse(readFileSync(new URL("./exemplo-addon.json", import.meta.url), "utf8"));

t("o exemplo do doc e um pacote VALIDO", AD.validarPacote(P), []);
const r = AD.aplicarAddons([P]);
t("instala sem problema", r.problemas, []);

const ficha = (habs, attrs) => {
  const c = createBlankAfty();
  c.core.nd = 12; c.core.tipo = "combatente";
  c.especializacoes = [{ id: "lutador", nivel: 12 }];
  c.habilidades = habs;
  c.attributes = { ...c.attributes, forca: 18, destreza: 10, constituicao: 12,
    inteligencia: 10, sabedoria: 10, presenca: 10, ...attrs };
  c.addons = [P];
  return c;
};
const ID = (x) => `mesa-do-afty:${x}`;

/* 1. contar() escalando de verdade, uma habilidade por vez. */
const rd = (habs) => deriveAfty(ficha(habs)).rdGeral;
const base = rd([]);
t("uma de Eco: 2 + 1 - 1", rd([ID("eco_persistente")]) - base, 2);
t("duas de Eco: 2 + 2 - 1", rd([ID("eco_persistente"), ID("eco_do_impacto")]) - base, 3);
t("tres de Eco: 2 + 3 - 1",
  rd([ID("eco_persistente"), ID("eco_do_impacto"), ID("eco_da_carne")]) - base, 4);

/* 2. o hpAtributo do Eco da Carne, com Forca 18 (mod +4) contra Con 12 (mod +1). */
const semCarne = deriveAfty(ficha([ID("eco_persistente")]));
const comCarne = deriveAfty(ficha([ID("eco_persistente"), ID("eco_da_carne")]));
t("Eco da Carne troca o atributo do PV", comCarne.hp - semCarne.hp, 12 * (4 - 1));
t("e o hover diz qual atributo entrou",
  comCarne.partes.hp.some((l) => String(l.label).includes("no lugar da Constituição")), true);

/* 3. o movimento do Eco do Impacto. */
const semImp = deriveAfty(ficha([ID("eco_persistente")]));
const comImp = deriveAfty(ficha([ID("eco_persistente"), ID("eco_do_impacto")]));
t("Eco do Impacto soma 1,5 de movimento", comImp.movimento - semImp.movimento, 1.5);

/* 4. o requisito entre irmaos do proprio pacote foi prefixado. */
t("requisito aponta para o irmao prefixado",
  H.getHabilidade(ID("eco_do_impacto")).requisitos[0].id, ID("eco_persistente"));

/* 5. tabela: tipo de dano e condicao. */
t("o tipo de dano entrou", EQ.TIPOS_DANO[ID("ressonante")], "Ressonante");
/* ⚠ ERA "Sônico" ATÉ 2026-08-31, e virou letra morta no dia em que a tabela
   passou a ter os quinze tipos do livro: Sônico é um deles. O exemplo ensinava
   a acrescentar um tipo que já existia. `categoria` é o campo novo, e o que ele
   prova é que o tipo do addon aparece na lista de uma categoria DO LIVRO. */
t("e entrou na categoria que declarou",
  EQ.tiposDeDanoDaCategoria("elemental").some((x) => x.id === ID("ressonante")), true);
t("a condicao entrou com nome LIMPO",
  FE.CONDICOES_CATALOGO.media.includes("Ensurdecido pelo Eco"), true);

/* 6. a ficha inteira nao quebra nada. */
const cheia = deriveAfty(ficha([ID("eco_persistente"), ID("eco_do_impacto"), ID("eco_da_carne")]));
t("derive completo", typeof cheia.hp, "number");
t("sem linha morta", cheia.addonProblemas, []);
t("catalogos validos", [H.validarCatalogoHabilidades(), EQ.validarCatalogoEquipamentos()], [[], []]);

AD.limparAddons();
console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
