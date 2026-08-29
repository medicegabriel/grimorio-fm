/* ALINHAMENTO DE NÚMERO AO LADO DE TEXTO, 2026-08-28.

   O autor: "o número está torto em relação ao texto. Isso é um problema geral de
   todas as partes da ficha inclusive, que já tentei resolver algumas vezes."

   Ele já tinha achado a causa sozinho, em 2026-08-26, na tira da Guarda, e
   escrito o diagnóstico certo no `t-guarda.mjs`: caixas de alturas diferentes
   centradas não põem as bases no mesmo lugar, e número se lê pela base. O que
   faltou foi o conserto virar REGRA em vez de ficar preso àquela classe. Dois
   dias depois ele voltou na contagem das sub-abas ("Combatente 10").

   Este arquivo é a regra travada. Ele lê o `ficha.css` como TEXTO e recusa

     1. um container que mistura as duas fontes e ainda alinha por `center`;
     2. o sumiço da metade de baixo da regra (quem não tem base de verdade
        precisa voltar ao centro por `align-self`), sem a qual aplicar `baseline`
        PIORA a fileira em vez de melhorar.

   ⚠ Prova CSS ESCRITO, e não pixel. Render não se testa aqui, e é por isso que
   a lista de containers é escrita à mão: ela é a decisão, e mudá-la tem de doer
   o suficiente para alguém reler o bloco "NÚMERO AO LADO DE TEXTO". */
import { readFileSync } from "node:fs";

const CSS = readFileSync(new URL("../src/systems/afty/ficha/ficha.css", import.meta.url), "utf8");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/** O corpo de uma regra, do seletor até a primeira chave de fechamento. */
const corpoDe = (seletor) => {
  const i = CSS.indexOf(`\n${seletor} {`);
  if (i < 0) return null;
  const abre = CSS.indexOf("{", i);
  return CSS.slice(abre, CSS.indexOf("}", abre));
};

/* ============================================================ */
/* 1. OS CONTAINERS QUE MISTURAM AS DUAS FONTES                  */
/* ============================================================ */
/* Cada um destes põe, na mesma fileira, um filho na `--afty-fonte` e outro na
   `--afty-fonte-num`. São eles que o olho pega tortos. */

const MISTURAM = [
  [".afty-guarda",              "a tira da Guarda (o achado original, 2026-08-26)"],
  [".afty-subaba",              "o nome da divisão e a contagem dela"],
  [".afty-feitico-topo",        "o nome do Feitiço e o nível com o custo"],
  [".afty-feitico-propriedade", "o rótulo da propriedade e o valor"],
  [".afty-estado-delta",        "as marcas de delta na linha de estado"],
  [".afty-base",                "a regra em si, para quem a aplicar por classe"],
];

for (const [seletor, oque] of MISTURAM) {
  const corpo = corpoDe(seletor);
  t(`${seletor} existe (${oque})`, corpo != null, true);
  t(`${seletor} alinha pela base`, !!corpo?.includes("align-items: baseline"), true);
  /* Ter as duas seria pior que ter a errada: a última do bloco venceria, e
     ninguém lendo o arquivo saberia qual. */
  t(`${seletor} não alinha pelo centro`, !!corpo?.includes("align-items: center"), false);
}

/* ============================================================ */
/* 2. A METADE DE BAIXO DA REGRA                                 */
/* ============================================================ */
/* ⚠ SEM ELA, `baseline` PIORA A FILEIRA. Um filho com `overflow` diferente de
   `visible` (todo `truncate`), um ícone e um botão só de ícone não entregam base
   de texto: o navegador sintetiza a base na borda de baixo, e o filho sobe
   inteiro. É a explicação mais provável para as tentativas anteriores do autor
   terem sido desfeitas. */

t("a regra devolve os filhos-caixa ao centro",
  CSS.includes(".afty-base > svg") && CSS.includes("align-self: center"), true);
t("e tem a porta de saída à mão",
  CSS.includes('.afty-base > [data-afty-alinha="centro"]'), true);
t("o ícone e a pílula do topo do Feitiço voltam ao centro",
  CSS.includes(".afty-feitico-topo > svg") && CSS.includes(".afty-feitico-topo > .afty-chip"), true);
t("o ícone da sub-aba volta ao centro", CSS.includes(".afty-subaba > svg"), true);
/* O rótulo do vital é `truncate`, então é o caso 1 da armadilha. */
t("o rótulo aparado do vital sai da base",
  !!corpoDe(".afty-vital-rotulo")?.includes("align-self: center"), true);

/* ============================================================ */
/* 3. O BLOCO QUE EXPLICA CONTINUA LÁ                            */
/* ============================================================ */
/* Regra sem o porquê volta a ser desfeita, que é a história inteira deste
   arquivo. O bloco nomeia a causa, a armadilha e este assert. */

t("o bloco da regra está no arquivo", CSS.includes("NÚMERO AO LADO DE TEXTO"), true);
t("ele nomeia a armadilha do overflow", /overflow/.test(CSS.slice(
  CSS.indexOf("NÚMERO AO LADO DE TEXTO"),
  CSS.indexOf(".afty-base { align-items: baseline; }"),
)), true);
t("e aponta para este assert", CSS.includes("t-alinhamento.mjs"), true);

/* ============================================================ */
/* 4. A CAUSA RAIZ, PARA NÃO SE PERDER                           */
/* ============================================================ */
/* A Ficha só tem este problema porque número e texto vêm de fontes diferentes, e
   a dos números é um botão do Painel de Aparência. Se um dia as duas virarem a
   mesma, o `center` volta a ser inofensivo e este arquivo pode sair inteiro. */

t("número e texto ainda são fontes diferentes",
  CSS.includes("--afty-fonte-num: ui-monospace") && CSS.includes("--afty-fonte: ui-sans-serif"), true);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
