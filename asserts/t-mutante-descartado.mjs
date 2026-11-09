/* O CORPO AMALDIÇOADO MUTANTE FOI ABANDONADO E EXCLUÍDO DO SITE (autor, 2026-10-30).

   ⚠ SE ESTE ARQUIVO FALHOU PORQUE ALGUÉM RECOLOCOU A ORIGEM: DESISTA DA IDEIA E VÁ
   FAZER OUTRA COISA. Não é pendência, não é lacuna do Livro e não é para reabrir. A
   decisão está em docs/a-fazer.md, em AGENTS.md e no comentário que ficou no lugar da
   entrada, em src/systems/afty/afty-origens.js.

   O que este arquivo prende:
   1. a origem não existe no catálogo nem nas listas do Player e do Afty;
   2. uma ficha antiga que gravou o id removido continua abrindo e derivando, nos dois
      sistemas, igual a uma ficha com origem desconhecida (a entrada era vazia, então
      nenhum número dela mudou);
   3. as três coisas de nome parecido que CONTINUAM VALENDO seguem de pé: os núcleos das
      invocações, a Anatomia Carapaça Mutante e a origem Maldição. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const O = await import(R + "afty-origens.js");
const { ANATOMIAS } = await import(R + "afty-anatomias.js").then((m) => ({ ANATOMIAS: m.AFTY_ANATOMIAS ?? m.ANATOMIAS ?? [] }));

let ok = 0;
const bad = [];
const AVISO = "MUTANTE FOI EXCLUIDO PELO AUTOR (2026-10-30): DESISTA DA IDEIA E VA FAZER OUTRA COISA";
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ID = "corpo_amaldicoado_mutante";
const ficha = (sistema, origem) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum", origem: { id: origem } };
  f.especializacoes = [{ id: "combatente", nivel: 10 }];
  return f;
};

/* 1. fora do catálogo e das listas */
t(`${AVISO}: catálogo`, O.AFTY_ORIGENS_CATALOG.some((o) => o.id === ID), false);
t(`${AVISO}: getOrigem`, O.getOrigem(ID), null);
for (const sistema of ["player", "afty"]) {
  t(`${AVISO}: lista do ${sistema}`, O.origensDoSistema(ficha(sistema, "inato")).some((o) => o.value === ID), false);
  /* Nem pela terceira porta do filtro, a da origem gravada: não há entrada para mostrar. */
  t(`${AVISO}: lista do ${sistema} com o id gravado`, O.origensDoSistema(ficha(sistema, ID)).some((o) => o.value === ID), false);
}

/* 2. ficha antiga com o id removido */
for (const sistema of ["player", "afty"]) {
  let d = null;
  let erro = null;
  try { d = deriveAfty(ficha(sistema, ID)); } catch (e) { erro = String(e?.message ?? e); }
  t(`ficha antiga (${sistema}) deriva sem erro`, erro, null);
  const controle = deriveAfty(ficha(sistema, "origem_que_nao_existe"));
  t(`ficha antiga (${sistema}) deriva igual a uma origem desconhecida`,
    [d?.hp, d?.pe, d?.defesa, d?.almaMax], [controle.hp, controle.pe, controle.defesa, controle.almaMax]);
  t(`ficha antiga (${sistema}) não concede característica`, O.caracteristicasEfetivas(ficha(sistema, ID)).length, 0);
}

/* 3. o que não é o Mutante continua de pé */
t("Anatomia Carapaça Mutante continua no catálogo", ANATOMIAS.some((a) => a.id === "carapaca_mutante"), true);
t("origem Maldição continua no catálogo", O.getOrigem("maldicao")?.id, "maldicao");
const d = deriveAfty(ficha("player", "inato"));
t("núcleos de invocação continuam publicados no derive", typeof d.multiplosNucleos, "object");

if (bad.length) {
  console.log(bad.join("\n"));
  console.log(`\n${bad.length} FALHA(S). ${AVISO}.`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
