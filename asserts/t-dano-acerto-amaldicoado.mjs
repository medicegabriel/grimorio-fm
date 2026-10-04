/* O dano da arma que acerta pelo Ataque Amaldiçoado (autor, 2026-10-02):
   "Isso é somente na Ficha de Criatura. Quando uma arma usa o Acerto
   Amaldiçoado, ela também usa o Atributo de Técnica para o Dano."

   É a divergência `danoDoAcertoAmaldicoado` (afty-sistema.js). Na criatura o
   dano segue o atributo do acerto, e no jogador segue o atributo da arma. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* Força 12 e Presença 18: os dois modificadores diferem (+1 e +4), então a
   troca muda o número, e não só o rótulo. */
const ficha = ({ sistema = "afty", ataqueId, tecnicaAttr = "presenca", extra } = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core.nd = 10;
  c.core.tecnicaAttr = tecnicaAttr;
  c.attributes = { forca: 12, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 14, presenca: 18 };
  c.equipamentos = {
    itens: [{ id: "e0", tipo: "arma", refId: "arm_adaga", qtd: 1, equipado: true, ...(ataqueId ? { ataqueId } : {}) }],
  };
  if (extra) extra(c);
  return deriveAfty(c);
};
const adaga = (d) => (d.dano?.entradas ?? []).find((e) => e.fonte === "arma");
const parteDoAtributo = (linha) => (linha?.partes ?? []).find((p) => /×/.test(p.label) && !/Nível/.test(p.label));

/* ============================================================ */
/* 1. NA CRIATURA, O AMALDIÇOADO LEVA A TÉCNICA AO DANO          */
/* ============================================================ */
const amal = adaga(ficha({ ataqueId: "amaldicoado" }));
t("a adaga no Acerto Amaldiçoado acerta pelo Amaldiçoado", amal?.acertoAtaque, "Amaldiçoado");
t("e o dano usa o Atributo de Técnica", amal?.atributo, "presenca");
t("com o modificador dele no número", parteDoAtributo(amal), {
  label: "Presença × 1", valor: 4, categoria: "total",
});
/* O acerto e o dano lêem o MESMO atributo: um dono só para a escolha. */
t("o acerto da mesma linha usa o mesmo atributo",
  amal?.partesAcerto?.[0]?.label, "Presença");
t("trocar o Atributo de Técnica troca o dano junto",
  adaga(ficha({ ataqueId: "amaldicoado", tecnicaAttr: "sabedoria" }))?.atributo, "sabedoria");

/* ============================================================ */
/* 2. SÓ O AMALDIÇOADO: O ATAQUE FÍSICO NÃO MUDA                 */
/* ============================================================ */
const fisico = adaga(ficha());
t("a mesma adaga no ataque físico segue com Força no dano", fisico?.atributo, "forca");
t("e acerta pelo Corpo a Corpo", fisico?.acertoAtaque, "Corpo a Corpo");

/* ============================================================ */
/* 3. NO JOGADOR NADA MUDA                                       */
/* ============================================================ */
const jogador = adaga(ficha({ sistema: "player", ataqueId: "amaldicoado" }));
t("no jogador o Amaldiçoado ainda acerta pela Técnica",
  jogador?.partesAcerto?.[0]?.label, "Presença");
t("mas o dano segue o atributo da arma", jogador?.atributo, "forca");

/* ============================================================ */
/* 4. AS TÉCNICAS DE COMBATE VÊM ANTES                           */
/* ============================================================ */
/* As Técnicas já trocam o acerto por cima do Ataque Amaldiçoado, e o dano segue
   a mesma ordem, para os dois lados da linha usarem o mesmo atributo. */
const comTecnicas = adaga(ficha({
  ataqueId: "amaldicoado",
  extra: (c) => {
    c.core.nivel = 8;
    c.especializacoes = [{ id: "conjurador", nivel: 8 }];
    c.habilidades = ["cnj_tecnicas_de_combate"];
    c.tecnicasCombate = { armas: ["arm_adaga"], atributo: "inteligencia" };
  },
}));
t("arma das Técnicas de Combate no Amaldiçoado usa o atributo das Técnicas no dano",
  comTecnicas?.atributo, "inteligencia");
t("e no acerto", comTecnicas?.partesAcerto?.[0]?.label, "Inteligência");

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
