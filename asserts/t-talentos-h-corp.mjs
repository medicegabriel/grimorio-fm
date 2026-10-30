/* TALENTOS DA H CORP (addon, 2026-10-12).

   Os poderes da Origem H Corp como Talentos Gerais, para qualquer ficha que
   instale `addons/talentos-h-corp.json`, de qualquer Origem:
     • Boulos: +1 em Força, Destreza e Constituição, mais 2 Pontos nos físicos.
       A ficha guarda ids únicos de opção, então "2 no mesmo atributo" não cabe
       em duas escolhas. Virou UMA escolha entre as 6 combinações;
     • Zodíaco: os 12 animais da Origem, com ids próprios (`hct_`). Id de opção
       é cru e global, e o mesmo id ligaria o interruptor dos dois pacotes.

   O motor do Zodíaco (limite de combate e o 32) é o do `t-h-corp.mjs`. */
import { readFileSync } from "node:fs";
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const TAL = await import(R + "afty-talentos.js");
const BUF = await import(R + "ficha/ficha-buffs.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};
const ler = (arq) => JSON.parse(readFileSync(new URL(`../addons/${arq}`, import.meta.url), "utf8"));

/* ============================================================ */
/* 1. O PACOTE                                                   */
/* ============================================================ */
const CRU = ler("talentos-h-corp.json");
const CRU_H = ler("h-corp.json");
t("o pacote valida sem problema nenhum", A.validarPacote(CRU), []);
const P = A.normalizarPacote(CRU);
const H = A.normalizarPacote(CRU_H);
A.aplicarAddons([P, H]);
const BOULOS = "talentos-h-corp:tal_boulos";
const ZODIACO = "talentos-h-corp:tal_zodiaco";
const ESTADO = "talentos-h-corp:zodiaco";
const ESTADO_ORIGEM = "h-corp:zodiaco";
t("os dois Talentos existem, Gerais e sem requisito",
  [BOULOS, ZODIACO].map((id) => { const x = TAL.getTalento(id); return [x?.nome, x?.grupo, x?.requisitos]; }),
  [["Boulos", "geral", []], ["Zodíaco", "geral", []]]);
t("Boulos oferece as 6 combinações dos físicos", TAL.getTalento(BOULOS)?.escolha?.opcoes?.length, 6);

const origemZod = CRU_H.acrescenta.origens[0].caracteristicas.find((c) => c.id === "hcorp_zodiaco").escolhas[0].opcoes;
const talZod = TAL.getTalento(ZODIACO)?.escolha?.opcoes ?? [];
t("os 12 animais da Origem, na mesma ordem e com o mesmo atributo",
  talZod.map((o) => [o.nome, o.efeitos[0].alvo]), origemZod.map((o) => [o.nome, o.efeitos[0].alvo]));
t("nenhum id de opção repete o da Origem",
  talZod.some((o) => origemZod.some((x) => x.id === o.id)), false);
t("todo efeito lê o interruptor DESTE pacote",
  talZod.every((o) => o.efeitos.every((e) => e.quando === "talentos_h_corp_zodiaco" && e.duracao === "temporaria")), true);

/* ============================================================ */
/* 2. A FICHA, NOS DOIS SISTEMAS                                 */
/* ============================================================ */
for (const sistema of ["afty", "player"]) {
  const ficha = ({ forca = 14, talentos = [], escolhas = {}, ligado = false, estado = ESTADO, origem = { id: "inato" } } = {}) => {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.core = { ...c.core, nd: 10, tipo: "conjurador", patamar: "comum", origem };
    c.attrMethod = "fixos";
    c.attributes = { forca, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 };
    c.addons = [P, H];
    c.talentos = talentos;
    c.escolhasTalento = escolhas;
    c.combate = { ativo: ligado, [estado]: ligado };
    return c;
  };
  const tag = (s) => `${sistema}: ${s}`;
  const temInterruptor = (der, id = ESTADO) => BUF.linhasDeEstado(der).some((e) => e.id === id);

  const base = deriveAfty(ficha());
  t(tag("Inato sem os Talentos"), [base.attrEff.forca, base.attrEff.destreza, base.attrEff.constituicao], [14, 10, 10]);

  const b1 = deriveAfty(ficha({ talentos: [BOULOS], escolhas: { [BOULOS]: ["hct_boulos_forca"] } }));
  t(tag("Boulos com Força +2: 17, 11, 11"), [b1.attrEff.forca, b1.attrEff.destreza, b1.attrEff.constituicao], [17, 11, 11]);
  t(tag("o Talento ocupa uma vaga"), b1.talentos.escolhidas.includes(BOULOS), true);
  const b2 = deriveAfty(ficha({ talentos: [BOULOS], escolhas: { [BOULOS]: ["hct_boulos_destreza_constituicao"] } }));
  t(tag("Boulos com Destreza e Constituição: 15, 12, 12"), [b2.attrEff.forca, b2.attrEff.destreza, b2.attrEff.constituicao], [15, 12, 12]);
  const b0 = deriveAfty(ficha({ talentos: [BOULOS] }));
  t(tag("Boulos sem a escolha dá só o +1 fixo"), [b0.attrEff.forca, b0.attrEff.destreza, b0.attrEff.constituicao], [15, 11, 11]);
  t(tag("com a fonte no hover"), b1.efeitos.detalhes.filter((x) => x.canal === "atributo" && x.alvo === "forca").map((x) => x.valor).sort(), [1, 2]);

  const zod = { talentos: [ZODIACO], escolhas: { [ZODIACO]: ["hct_zodiaco_tigre"] } };
  const z0 = deriveAfty(ficha(zod));
  t(tag("o interruptor aparece com o animal escolhido"), temInterruptor(z0), true);
  t(tag("e some sem o animal"), temInterruptor(deriveAfty(ficha({ talentos: [ZODIACO] }))), false);
  t(tag("e sem o Talento"), temInterruptor(base), false);
  t(tag("desligado, nada muda"), z0.attrEff.forca, 14);
  t(tag("Tigre ligado leva a Força a 30"), deriveAfty(ficha({ ...zod, ligado: true })).attrEff.forca, 30);
  const dragao = { talentos: [ZODIACO], escolhas: { [ZODIACO]: ["hct_zodiaco_dragao"] }, ligado: true };
  t(tag("Dragão ligado leva a Presença a 30"), deriveAfty(ficha(dragao)).attrEff.presenca, 30);

  // Os dois Talentos juntos: Força 14 + 1 + 2 = 17, e o Tigre leva a 30.
  const juntos = deriveAfty(ficha({
    talentos: [BOULOS, ZODIACO],
    escolhas: { [BOULOS]: ["hct_boulos_forca"], [ZODIACO]: ["hct_zodiaco_tigre"] },
    ligado: true,
  }));
  t(tag("Boulos e Zodíaco juntos"), juntos.attrEff.forca, 30);

  // Já em 30 pela Lendária não cabe aqui; pelo Restringido sim (Ápice Corporal).
  const r = ficha({ forca: 29, ...zod, ligado: true });
  r.core.tipo = "restringido";
  r.core.origem = { id: "restringido" };
  const rDes = deriveAfty({ ...r, combate: { ativo: false } });
  t(tag("Restringido desligado, Força 30"), rDes.attrEff.forca, 30);
  t(tag("já em 30, o Zodíaco do Talento chega a 32"), deriveAfty(r).attrEff.forca, 32);

  // Ficha da H Corp com o Talento: cada interruptor responde só ao seu animal.
  const hcorp = ficha({
    ...zod,
    origem: { id: "h-corp:h_corp", escolhas: { hcorp_zodiaco_animal: ["hcorp_zodiaco_dragao"] } },
  });
  const dh = deriveAfty(hcorp);
  t(tag("H Corp com o Talento vê os dois interruptores"), [temInterruptor(dh), temInterruptor(dh, ESTADO_ORIGEM)], [true, true]);
  const soTalento = deriveAfty({ ...hcorp, combate: { ativo: true, [ESTADO]: true } });
  t(tag("o do Talento liga só o Tigre"), [soTalento.attrEff.forca, soTalento.attrEff.presenca], [30, dh.attrEff.presenca]);
}

if (bad.length) {
  console.error(bad.join("\n"));
  console.error(`${bad.length} FALHA(S), ${ok} ok`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
