/* As Bases que a Especialização concede sozinha (`automatica: true`).
   Nasceu com as duas de 2026-08-20 (Artes do Combate no Combatente 1 e
   Empolgação no Lutador 1), e cobre as nove que existem hoje. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const {
  AFTY_HABILIDADES,
  getHabilidade,
  habilidadesConcedidasPelasEspecializacoes,
} = await import(R + "afty-habilidades.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const criatura = (especializacoes, habilidades = []) => {
  const c = createBlankAfty();
  c.core.nd = 1;
  c.core.tipo = "combatente";
  c.especializacoes = especializacoes;
  c.habilidades = habilidades;
  return c;
};

/* ============================================================ */
/* 1. O CATÁLOGO                                                 */
/* ============================================================ */

t("Artes do Combate e automatica", getHabilidade("cmb_artes_do_combate")?.automatica, true);
t("Empolgacao e automatica", getHabilidade("lut_empolgacao")?.automatica, true);
t("as duas sao de nivel 1", [
  getHabilidade("cmb_artes_do_combate")?.nivel,
  getHabilidade("lut_empolgacao")?.nivel,
], [1, 1]);

/* ⚠ O comentário do topo do afty-habilidades.js lista as automáticas UMA a UMA.
   Se este número mudar sem a lista mudar junto, o comentário mentiu. */
t("sao nove automaticas", AFTY_HABILIDADES.filter((h) => h.automatica).length, 9);

/* ============================================================ */
/* 2. QUEM RECEBE, E QUEM NÃO                                    */
/* ============================================================ */

t("Combatente 1 recebe Artes do Combate",
  habilidadesConcedidasPelasEspecializacoes([{ id: "combatente", nivel: 1 }]),
  ["cmb_artes_do_combate"]);
t("Lutador 1 recebe Empolgacao",
  habilidadesConcedidasPelasEspecializacoes([{ id: "lutador", nivel: 1 }]),
  ["lut_empolgacao"]);
t("Combatente NAO recebe a do Lutador",
  habilidadesConcedidasPelasEspecializacoes([{ id: "combatente", nivel: 1 }])
    .includes("lut_empolgacao"), false);
t("nivel 0 nao recebe nada",
  habilidadesConcedidasPelasEspecializacoes([{ id: "combatente", nivel: 0 }]), []);
t("sem especializacao nenhuma",
  habilidadesConcedidasPelasEspecializacoes([]), []);
t("especializacao alheia nao recebe",
  habilidadesConcedidasPelasEspecializacoes([{ id: "restringido", nivel: 20 }]), []);

/* Multiclasse: as duas chegam, cada uma pela sua especialização. */
t("Combatente 1 / Lutador 1 recebe as duas",
  habilidadesConcedidasPelasEspecializacoes([
    { id: "combatente", nivel: 1 }, { id: "lutador", nivel: 1 },
  ]),
  ["lut_empolgacao", "cmb_artes_do_combate"]);

/* ============================================================ */
/* 3. DE GRAÇA (o orçamento não sente)                           */
/* ============================================================ */

const dCmb = deriveAfty(criatura([{ id: "combatente", nivel: 1 }]));
const dLut = deriveAfty(criatura([{ id: "lutador", nivel: 1 }]));
/* Restringido não tem Base automática nenhuma, então ele é a régua do "zero". */
const dSem = deriveAfty(criatura([{ id: "restringido", nivel: 1 }]));

t("a concedida entra nas escolhidas", dCmb.habilidades.escolhidas, ["cmb_artes_do_combate"]);
t("e aparece como concedida", dCmb.habilidades.concedidas, ["cmb_artes_do_combate"]);
t("mas nao entra nas selecionadas", dCmb.habilidades.selecionadas, []);
t("Empolgacao idem", dLut.habilidades.escolhidas, ["lut_empolgacao"]);

t("Combatente gasta o mesmo que quem nao recebe nada",
  [dCmb.habilidades.gastos, dCmb.habilidades.restante, dCmb.habilidades.excedeu],
  [dSem.habilidades.gastos, dSem.habilidades.restante, dSem.habilidades.excedeu]);
t("Lutador idem",
  [dLut.habilidades.gastos, dLut.habilidades.restante, dLut.habilidades.excedeu],
  [dSem.habilidades.gastos, dSem.habilidades.restante, dSem.habilidades.excedeu]);
t("gasto zero sem escolher nada", dCmb.habilidades.gastos, 0);

/* Habilidade escolhida DE VERDADE continua cobrando. */
const dPaga = deriveAfty(criatura([{ id: "lutador", nivel: 2 }], ["lut_reflexo_evasivo"]));
t("a comprada continua gastando", dPaga.habilidades.gastos, 1);
t("e a concedida vem junto sem cobrar",
  dPaga.habilidades.escolhidas.includes("lut_empolgacao"), true);

/* ============================================================ */
/* 4. FICHA ANTIGA NÃO COBRA DUAS VEZES                          */
/* ============================================================ */

const dAntiga = deriveAfty(criatura([{ id: "combatente", nivel: 1 }], ["cmb_artes_do_combate"]));
t("quem ja tinha gravado continua com ela",
  dAntiga.habilidades.escolhidas, ["cmb_artes_do_combate"]);
t("sem duplicata",
  dAntiga.habilidades.escolhidas.filter((id) => id === "cmb_artes_do_combate").length, 1);
t("e sem gastar vaga", dAntiga.habilidades.gastos, 0);

/* ============================================================ */
/* 5. O NÚMERO CHEGA NO OUTRO LADO                               */
/* ============================================================ */

/* Artes do Combate é a única fonte de Pontos de Preparo: nível de Combatente
   mais o modificador de Sabedoria, e zero para quem não tem a habilidade. */
t("Pontos de Preparo sem escolher nada", dCmb.pontosPreparo, 1);
t("Lutador nao tem Pontos de Preparo", dLut.pontosPreparo, 0);
t("Restringido tambem nao", dSem.pontosPreparo, 0);

t("o quadro de Empolgacao liga sozinho", dLut.empolgacao?.ativa, true);
t("e nao liga para quem nao e Lutador", dCmb.empolgacao?.ativa, false);

/* ============================================================ */
/* 6. A ESCOLHA ANINHADA SOBREVIVE À CONCESSÃO                   */
/* ============================================================ */

/* A Empolgação concede DUAS Manobras no nível 1. Conceder a habilidade não
   pode engolir a escolha dela, que continua sendo do jogador. */
t("duas Manobras no nivel 1", dLut.habilidades.escolhas.porHab.lut_empolgacao?.allowance, 2);
t("nenhuma escolhida ainda", dLut.habilidades.escolhas.mapa.lut_empolgacao, []);

const cManobras = criatura([{ id: "lutador", nivel: 1 }]);
cManobras.escolhasHabilidade = { lut_empolgacao: ["lut_manobra_ajuste", "lut_manobra_comando"] };
const dManobras = deriveAfty(cManobras);
t("as duas Manobras entram",
  dManobras.habilidades.escolhas.mapa.lut_empolgacao,
  ["lut_manobra_ajuste", "lut_manobra_comando"]);
t("e nao gastam vaga nenhuma", dManobras.habilidades.gastos, 0);
t("nem vaga extra", dManobras.habilidades.escolhas.vagasExtras, 0);
t("Manobra fora do pool cai fora",
  deriveAfty(Object.assign(criatura([{ id: "lutador", nivel: 1 }]), {
    escolhasHabilidade: { lut_empolgacao: ["nao_existe"] },
  })).habilidades.escolhas.mapa.lut_empolgacao, []);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
