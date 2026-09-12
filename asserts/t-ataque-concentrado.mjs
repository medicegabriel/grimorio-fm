/**
 * ATAQUE CONCENTRADO (Combatente 10°), ligado em 2026-09-12.
 *
 * "Ao utilizar a ação Atacar, você pode gastar PE equivalentes a metade do custo
 *  de Ataque Extra e/ou Surto de Ação, até um limite igual ao máximo de vezes que
 *  poderia usá-los dentro do seu turno. Para cada vez que o fizer, você adiciona
 *  metade dos dados de dano de um ataque (mínimo 1 dado) à rolagem de dano do seu
 *  próximo ataque."
 *
 * As decisões do autor, por pergunta:
 *   • O limite é a sequência do turno: *"Ataque (Cheio) + Ataque Extra
 *     (Concentrado) + Surto de Ação (Concentrado) + Ataque Extra (Concentrado)"*.
 *     Três com Surto de Ação, um sem. Ataque por ação bônus ou livre não conta.
 *   • Metade do Surto (5 PE) é 2, para baixo. A sequência custa 1, 3 e 4 PE.
 *   • Vale nos dois sistemas.
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. O estado: teto, custo e que o `resolveCombate` apara no mesmo teto. Faixa
 *    sem teto lá é aparada em zero calada, e foi exatamente o que aconteceu na
 *    primeira versão desta habilidade.
 * 2. A METADE É DA LINHA: 1 dado vira +1 (mínimo), 2 viram +1, 3 viram +1, e
 *    cada concentração soma a metade do ataque, e não de uma bola que cresce.
 * 3. Vale para arma e Ataque Básico, nos dois sistemas, e não vaza para quem
 *    não tem a habilidade nem para fora de combate.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const C = await import(R + "afty-combate.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const HABS = ["cmb_ataque_extra", "cmb_ataque_concentrado"];
const ficha = (sistema, vezes, { surto = true, arma = "arm_espada_grande", habs = HABS, ativo = true, nivel = 12 } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: nivel, tipo: "combatente", patamar: "comum" };
  f.especializacoes = [{ id: "combatente", nivel }];
  f.habilidades = [...habs, ...(surto ? ["cmb_surto_de_acao"] : [])];
  f.equipamentos = { itens: [{ id: "e0", tipo: "arma", refId: arma, qtd: 1, equipado: true }] };
  f.combate = { ativo, ataqueConcentrado: vezes };
  return f;
};
const linha = (f, id) => deriveAfty(f).dano.entradas.find((e) => e.id === id);
const dadosDe = (f, id) => linha(f, id).dados;

/* ============================================================ */
/* 1. O ESTADO                                                   */
/* ============================================================ */
const estado = C.COMBATE_ESTADOS.find((e) => e.id === "ataqueConcentrado");
t("o estado existe e é faixa", [estado?.tipo, estado?.min, estado?.requerHabilidade], ["faixa", 0, "cmb_ataque_concentrado"]);
t("com Surto de Ação o teto é 3", estado.max(deriveAfty(ficha("player", 0))), 3);
t("sem Surto de Ação o teto é 1", estado.max(deriveAfty(ficha("player", 0, { surto: false }))), 1);
t("o custo segue a sequência do turno", [0, 1, 2, 3].map(estado.custoPE), [0, 1, 3, 4]);
t("o resolveCombate apara no mesmo teto, com Surto", deriveAfty(ficha("player", 9)).combate.ataqueConcentrado, 3);
t("e sem Surto", deriveAfty(ficha("player", 3, { surto: false })).combate.ataqueConcentrado, 1);

/* ============================================================ */
/* 2. A METADE É DA LINHA                                        */
/* ============================================================ */
for (const s of ["player", "afty"]) {
  const base = (arma) => dadosDe(ficha(s, 0, { arma }), arma);
  const com = (arma, vezes) => dadosDe(ficha(s, vezes, { arma }), arma);
  for (const arma of ["arm_espada_grande", "arm_espada_colossal", "arm_bazuca"]) {
    const n = base(arma);
    const meia = Math.max(1, Math.floor(n / 2));
    t(`${s}, ${arma} (${n} dados): cada concentração soma ${meia}`,
      [1, 2, 3].map((v) => com(arma, v) - n), [meia, 2 * meia, 3 * meia]);
  }
}
/* ⚠ OS TRÊS CASOS DE CIMA DÃO METADE 1 (1, 2 e 3 dados), então eles não provam
   a metade de verdade. A Bazuca (3d12) no Combatente 20 ganha +1 dado do
   Autossuficiente e rola 4: aí cada concentração tem de somar 2, e três somam 6
   (e não 2 + 3 + 4, que seria a metade de uma bola que cresce). */
{
  const quatro = (vezes) => dadosDe(ficha("player", vezes, { arma: "arm_bazuca", nivel: 20 }), "arm_bazuca");
  t("jogador, Bazuca no nível 20: a linha rola 4 dados", quatro(0), 4);
  t("jogador, Bazuca no nível 20: cada concentração soma 2, sem crescer",
    [1, 2, 3].map((v) => quatro(v) - quatro(0)), [2, 4, 6]);
}
/* A linha nomeia a fonte no hover. */
t("a parcela aparece com o nome da habilidade",
  linha(ficha("player", 2), "arm_espada_grande").partes.filter((p) => p.label === "Ataque Concentrado").map((p) => p.texto),
  ["+2d12"]);

/* ============================================================ */
/* 3. ONDE VALE, E ONDE NÃO VALE                                 */
/* ============================================================ */
for (const s of ["player", "afty"]) {
  t(`${s}: o Ataque Básico também recebe`,
    dadosDe(ficha(s, 1), "basico") - dadosDe(ficha(s, 0), "basico"), 1);
  t(`${s}: sem a habilidade, a faixa não soma`,
    dadosDe(ficha(s, 3, { habs: ["cmb_ataque_extra"] }), "arm_espada_grande")
      - dadosDe(ficha(s, 0, { habs: ["cmb_ataque_extra"] }), "arm_espada_grande"), 0);
  t(`${s}: fora de combate, nada`,
    dadosDe(ficha(s, 3, { ativo: false }), "arm_espada_grande") - dadosDe(ficha(s, 0), "arm_espada_grande"), 0);
}

/* ============================================================ */
console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
