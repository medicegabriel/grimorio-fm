/**
 * O ATRIBUTO DO TESTE DE RESISTÊNCIA E DA JOGADA DE ATAQUE, TROCADO À MÃO — 2026-10-02
 *
 * Pedido do autor: *"Assim como em Pericias, faça que Testes de Resistência e
 * Testes de Ataque eu possa clicar no atributo e mudar ele"*. Nos dois sistemas.
 *
 * Campos `trAtributoManual` e `ataqueAtributoManual`, irmãos do
 * `periciaAtributoManual` (ver t-pericia-atributo.mjs). O que este arquivo
 * prende e que a perícia não tem:
 *
 *   • A TROCA DO ATAQUE VALE NO DANO (autor, "Acerto e Dano"), como o canal
 *     `ataqueAtributo` da Restrição Intelectual.
 *   • O PADRÃO DO ATAQUE é o que a linha daria sem a troca, e não o do livro: a
 *     Fineza já entra nele. Comparado com o livro, escolher Força num Corpo a
 *     Corpo com Fineza seria tomado por volta ao padrão e apagado.
 *   • ID DESCONHECIDO CAI no saneamento, porque as linhas de TR e ataque são fixas.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty, mesclaFichaAfty } = await import(R + "afty-schema.js");
const P = await import(R + "afty-pericias.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* Força +4, Inteligência +3, Constituição +2, Destreza +1: todo par que o
   arquivo troca tem modificadores diferentes, para a troca mexer no NÚMERO e não
   só no rótulo. */
const ATRIBUTOS = { forca: 18, destreza: 12, constituicao: 14, inteligencia: 16, sabedoria: 8, presenca: 10 };
const ficha = (sistema, extra = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd: 12, tipo: "combatente", patamar: "comum" };
  c.attributes = { ...ATRIBUTOS };
  c.especializacoes = [{ id: "combatente", nivel: 12 }];
  c.equipamentos = { itens: [
    { uid: "a1", tipo: "arma", refId: "arm_machado", qtd: 1, equipado: true },
    { uid: "a2", tipo: "arma", refId: "arm_arco_curto", qtd: 1, equipado: true },
  ] };
  return { ...c, ...extra };
};
const tr = (d, id) => d.testes.resistencias.find((r) => r.value === id);
const atq = (d, id) => d.testes.ataques.find((a) => a.id === id);
const linha = (d, id) => d.dano.entradas.find((e) => e.id === id);

for (const sistema of ["afty", "player"]) {
  /* ============================================================ */
  /* 1. TESTE DE RESISTÊNCIA                                       */
  /* ============================================================ */
  const base = deriveAfty(ficha(sistema));
  const trocado = deriveAfty(ficha(sistema, { trAtributoManual: { fortitude: "forca" } }));

  t(`${sistema}: Fortitude nasce Constituição`, tr(base, "fortitude").atributo, "constituicao");
  t(`${sistema}: e diz qual é o padrão`, tr(base, "fortitude").atributoPadrao, "constituicao");
  t(`${sistema}: a troca vale`, tr(trocado, "fortitude").atributo, "forca");
  t(`${sistema}: o padrão não muda com a troca`, tr(trocado, "fortitude").atributoPadrao, "constituicao");
  t(`${sistema}: o bônus segue o atributo novo`, tr(trocado, "fortitude").bonus - tr(base, "fortitude").bonus, 2);
  t(`${sistema}: e o hover nomeia o atributo novo`, tr(trocado, "fortitude").partes[0], { label: "Força", valor: 4 });
  t(`${sistema}: os outros TRs não se mexem`, tr(trocado, "reflexos").bonus, tr(base, "reflexos").bonus);
  /* A Concentração sai da Fortitude, e lê o número já trocado. */
  const conc = (d) => d.testes.manobras.find((m) => m.id === "concentracao").executar;
  t(`${sistema}: a Concentração segue a Fortitude`, conc(trocado) - conc(base), 2);

  /* ============================================================ */
  /* 2. JOGADA DE ATAQUE, NO ACERTO E NO DANO                      */
  /* ============================================================ */
  const atqTrocado = deriveAfty(ficha(sistema, { ataqueAtributoManual: { corpo: "inteligencia" } }));

  t(`${sistema}: Corpo a Corpo nasce Força`, atq(base, "corpo").atributo, "forca");
  t(`${sistema}: a troca vale no ataque`, atq(atqTrocado, "corpo").atributo, "inteligencia");
  t(`${sistema}: o padrão segue Força`, atq(atqTrocado, "corpo").atributoPadrao, "forca");
  t(`${sistema}: o acerto perde 1`, atq(atqTrocado, "corpo").bonus - atq(base, "corpo").bonus, -1);
  t(`${sistema}: e o hover diz Inteligência`, atq(atqTrocado, "corpo").partes[0].label, "Inteligência");

  /* ⚠ ACERTO E DANO (autor, 2026-10-02). O Ataque Básico e a arma corpo a
     corpo levam o atributo novo nos dois lados da linha. */
  for (const id of ["basico", "arm_machado"]) {
    t(`${sistema}: ${id} acerta com o atributo novo`,
      linha(atqTrocado, id).acerto - linha(base, id).acerto, -1);
    t(`${sistema}: ${id} causa dano com o atributo novo`, linha(atqTrocado, id).atributo, "inteligencia");
  }
  /* A Distância não foi trocada, e o arco não pode ter sentido nada. */
  t(`${sistema}: o arco segue em Destreza no dano`, linha(atqTrocado, "arm_arco_curto").atributo, "destreza");
  t(`${sistema}: e no acerto`, linha(atqTrocado, "arm_arco_curto").acerto, linha(base, "arm_arco_curto").acerto);

  /* O Amaldiçoado parte do Atributo de Técnica, e troca igual. */
  t(`${sistema}: Amaldiçoado nasce no Atributo de Técnica`, atq(base, "amaldicoado").atributoPadrao, "inteligencia");
  const amald = deriveAfty(ficha(sistema, { ataqueAtributoManual: { amaldicoado: "forca" } }));
  t(`${sistema}: e troca à mão`, atq(amald, "amaldicoado").atributo, "forca");
  t(`${sistema}: com o número junto`, atq(amald, "amaldicoado").bonus - atq(base, "amaldicoado").bonus, 1);

  /* ============================================================ */
  /* 3. O PADRÃO DO ATAQUE CONTA A FINEZA                          */
  /* ============================================================ */
  /* Destreza maior que Força, e Fineza marcada: o Corpo a Corpo já é Destreza
     sem troca nenhuma. É ESSE o padrão que a aba compara, senão escolher Força
     apagaria a entrada e a linha seguiria em Destreza. */
  const agil = (manual) => deriveAfty(ficha(sistema, {
    attributes: { ...ATRIBUTOS, forca: 12, destreza: 18 },
    ataqueFineza: true,
    ...(manual ? { ataqueAtributoManual: manual } : {}),
  }));
  t(`${sistema}: com Fineza, o padrão é Destreza`, atq(agil(null), "corpo").atributoPadrao, "destreza");
  t(`${sistema}: e a Força escolhida vence a Fineza`, atq(agil({ corpo: "forca" }), "corpo").atributo, "forca");
  t(`${sistema}: também no dano do básico`, linha(agil({ corpo: "forca" }), "basico").atributo, "forca");
}

/* ============================================================ */
/* 4. O SANEAMENTO                                               */
/* ============================================================ */

t("atributo que não existe é descartado",
  P.atributosDeTRManuais({ trAtributoManual: { fortitude: "banana" } }), {});
/* ⚠ Ao contrário da perícia, id desconhecido CAI: TR e ataque não têm linha
   personalizada nem de Addon. */
t("id de TR desconhecido cai",
  P.atributosDeTRManuais({ trAtributoManual: { sorte: "forca", vontade: "presenca" } }), { vontade: "presenca" });
t("id de ataque desconhecido cai",
  P.atributosDeAtaqueManuais({ ataqueAtributoManual: { arremesso: "forca", distancia: "sabedoria" } }),
  { distancia: "sabedoria" });
t("lista no lugar do objeto devolve vazio", P.atributosDeAtaqueManuais({ ataqueAtributoManual: ["forca"] }), {});
t("ficha nula também", P.atributosDeTRManuais(null), {});
t("o derive não cai com lixo",
  tr(deriveAfty(ficha("afty", { trAtributoManual: "forca" })), "fortitude").atributo, "constituicao");

t("ficha em branco nasce com os dois mapas",
  [createBlankAfty().trAtributoManual, createBlankAfty().ataqueAtributoManual], [{}, {}]);
t("mescla põe os mapas mesmo sem o campo",
  [mesclaFichaAfty({}).trAtributoManual, mesclaFichaAfty({}).ataqueAtributoManual], [{}, {}]);
t("mescla rejeita lista", mesclaFichaAfty({ trAtributoManual: ["x"] }).trAtributoManual, {});
t("e passa o objeto inteiro",
  mesclaFichaAfty({ ataqueAtributoManual: { corpo: "destreza" } }).ataqueAtributoManual, { corpo: "destreza" });

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
