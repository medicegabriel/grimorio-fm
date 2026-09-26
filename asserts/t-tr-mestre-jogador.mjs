/* O TESTE DE RESISTÊNCIA MESTRE VOLTA NO JOGADOR (2026-09-23).

   Livro, nas cinco classes: "No nível 9, você recebe a habilidade Teste de
   Resistência Mestre: Você se torna treinado em um segundo teste de
   resistência e mestre no concedido pela sua especialização." No Restringido:
   "Você se torna mestre nos dois Testes de Resistência conferidos por sua
   Especialização."

   Decisões do autor na revisão do Especialista em Combate:
     1. A habilidade continua FORA da criatura (removida em 2026-07-27) e volta
        só no jogador (divergência `trMestreDoJogador`).
     2. A ficha REGISTRA a escolha do TR da Classe ("um entre Fortitude ou
        Reflexos"), e esse TR chega treinado pela Classe, como o Restringido.
     3. O Mestre é só da Classe INICIAL, a única que concede TR.

   O que este arquivo mede: o dado nas seis classes, a escolha do TR da Classe,
   o degrau do 8 para o 9, o segundo TR, o Restringido, a multiclasse, a
   criatura intocada e a convivência com a marcação à mão. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const E = await import(R + "afty-especializacoes.js");
const S = await import(R + "afty-sistema.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ficha = (esp, o = {}) => {
  const { sistema = "player", tr, segundo, prof = {} } = o;
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  const nd = esp.reduce((s, e) => s + e.nivel, 0);
  f.core = { ...f.core, nd, tipo: "misto", patamar: "comum" };
  f.especializacoes = esp;
  // A Especialização Restringido só existe com a Origem Restringido.
  if (esp[0]?.id === "restringido") f.core.origem = { ...f.core.origem, id: "restringido" };
  f.attributes = { forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 };
  if (tr) f.trDaClasse = tr;
  if (segundo) f.trSegundo = segundo;
  f.resistenciasProf = prof;
  return deriveAfty(f);
};
const faixas = (d) => Object.fromEntries(d.testes.resistencias.map((r) => [r.value, r.prof ?? null]));
const soQuem = (d) => Object.fromEntries(Object.entries(faixas(d)).filter(([, v]) => v));
const cmb = (nivel) => [{ id: "combatente", nivel }];

/* ============================================================ */
/* 1. O DADO NAS SEIS CLASSES                                    */
/* ============================================================ */
t("a divergencia existe e separa os dois ramos",
  [S.regraDo("afty", "trMestreDoJogador"), S.regraDo("player", "trMestreDoJogador")], ["afty", "player"]);
t("as seis classes trazem o Mestre no nivel 9",
  E.AFTY_ESPECIALIZACOES.map((e) => [e.id, e.caracteristicas?.resistencias?.mestre?.nivel ?? null]),
  E.AFTY_ESPECIALIZACOES.map((e) => [e.id, 9]));
t("so o Restringido nao tem segundo TR",
  E.AFTY_ESPECIALIZACOES.filter((e) => e.caracteristicas?.resistencias?.mestre?.segundo === false).map((e) => e.id),
  ["restringido"]);
t("o validador aceita o campo", E.validarCaracteristicasDeClasse(), []);

/* ============================================================ */
/* 2. O TR DA CLASSE PASSA A SER ESCOLHIDO E GRAVADO             */
/* ============================================================ */
{
  const sem = ficha(cmb(8));
  t("sem escolha, o Combatente fica sem TR e a escolha fica pendente",
    [soQuem(sem), sem.testes.trDaClasse.escolhaPendente, sem.testes.trDaClasse.entre],
    [{}, true, ["fortitude", "reflexos"]]);
  const com = ficha(cmb(8), { tr: ["fortitude"] });
  const forti = com.testes.resistencias.find((r) => r.value === "fortitude");
  t("escolhida, a Fortitude chega treinada pela Classe, sem marcar",
    [forti.prof, forti.profEscolhida, forti.concedida, com.testes.trDaClasse.escolhaPendente],
    ["treinado", null, true, false]);
  t("um TR fora da lista da Classe nao e aceito como o dela",
    soQuem(ficha(cmb(8), { tr: ["vontade"] })), {});
  t("escolha de um so: o segundo id e ignorado",
    ficha(cmb(8), { tr: ["fortitude", "reflexos"] }).testes.trDaClasse.escolhidos, ["fortitude"]);
}

/* ============================================================ */
/* 3. O DEGRAU DO 8 PARA O 9, E O SEGUNDO TR                     */
/* ============================================================ */
{
  t("no 8 ainda e treinado e nao pede segundo", [
    soQuem(ficha(cmb(8), { tr: ["reflexos"] })),
    ficha(cmb(8), { tr: ["reflexos"] }).testes.trDaClasse.segundoPermitido,
  ], [{ reflexos: "treinado" }, false]);
  const nove = ficha(cmb(9), { tr: ["reflexos"] });
  t("no 9 o TR da Classe vira Mestre", soQuem(nove), { reflexos: "mestre" });
  /* Sem o TR da Classe o segundo nem é pedido: antes dele não dá para saber
     qual dos dois da lista o segundo pode ser. */
  const noveSem = ficha(cmb(9), { segundo: "vontade" });
  t("no 9 sem o TR da Classe o segundo espera", [
    noveSem.testes.trDaClasse.segundoPermitido, noveSem.testes.trDaClasse.segundoPendente, soQuem(noveSem),
  ], [false, false, {}]);
  t("e o segundo TR e pedido, entre os outros quatro", [
    nove.testes.trDaClasse.segundoPendente, nove.testes.trDaClasse.opcoesSegundo,
  ], [true, ["fortitude", "vontade", "astucia", "integridade"]]);
  const comSegundo = ficha(cmb(9), { tr: ["reflexos"], segundo: "vontade" });
  t("o segundo escolhido chega treinado", soQuem(comSegundo), { reflexos: "mestre", vontade: "treinado" });
  t("e o segundo nao pode ser o da Classe",
    [soQuem(ficha(cmb(9), { tr: ["reflexos"], segundo: "reflexos" })),
      ficha(cmb(9), { tr: ["reflexos"], segundo: "reflexos" }).testes.trDaClasse.segundoPendente],
    [{ reflexos: "mestre" }, true]);
  /* Mestre soma o Bônus de Treinamento e meio: no 9 o BT é 4, então +2 sobre o
     treinado. E a linha ganha o Sucesso Crítico. */
  const r8 = ficha(cmb(8), { tr: ["reflexos"] }).testes.resistencias.find((r) => r.value === "reflexos");
  const r9 = nove.testes.resistencias.find((r) => r.value === "reflexos");
  const escala = (n) => Math.floor(n / 2);
  t("o Mestre soma meio BT a mais e liga o Sucesso Critico", [
    (r9.bonus - escala(9)) - (r8.bonus - escala(8)) - (4 - 3), r9.critico, r8.critico,
  ], [2, true, false]);
  t("a outra classe da lista tambem funciona (Conjurador, Vontade)",
    soQuem(ficha([{ id: "conjurador", nivel: 9 }], { tr: ["vontade"], segundo: "fortitude" })),
    { fortitude: "treinado", vontade: "mestre" });
}

/* ============================================================ */
/* 4. O RESTRINGIDO                                              */
/* ============================================================ */
{
  const r8 = ficha([{ id: "restringido", nivel: 8 }]);
  const r9 = ficha([{ id: "restringido", nivel: 9 }]);
  t("Restringido 8: os dois treinados, sem escolha", [soQuem(r8), r8.testes.trDaClasse.precisaEscolher],
    [{ reflexos: "treinado", fortitude: "treinado" }, false]);
  t("Restringido 9: mestre nos dois, e sem segundo TR", [soQuem(r9), r9.testes.trDaClasse.segundoPermitido],
    [{ reflexos: "mestre", fortitude: "mestre" }, false]);
}

/* ============================================================ */
/* 5. SÓ A CLASSE INICIAL                                        */
/* ============================================================ */
t("Lutador 5 inicial com Combatente 9: nada de Mestre",
  soQuem(ficha([{ id: "lutador", nivel: 5 }, { id: "combatente", nivel: 9 }], { tr: ["fortitude"] })),
  { fortitude: "treinado" });
t("Combatente 9 inicial com Lutador 5: Mestre",
  soQuem(ficha([{ id: "combatente", nivel: 9 }, { id: "lutador", nivel: 5 }], { tr: ["fortitude"] })),
  { fortitude: "mestre" });

/* ============================================================ */
/* 6. A CRIATURA NÃO SENTE, E A MARCAÇÃO À MÃO CONVIVE           */
/* ============================================================ */
{
  const criatura = ficha(cmb(9), { sistema: "afty", tr: ["fortitude"], segundo: "vontade" });
  t("na criatura nada muda, mesmo com os campos gravados",
    [soQuem(criatura), criatura.testes.trDaClasse], [{}, null]);
  /* Marcar à mão continua possível, e vale a maior das faixas. */
  const mao = ficha(cmb(9), { tr: ["fortitude"], prof: { fortitude: "treinado" } });
  const f = mao.testes.resistencias.find((r) => r.value === "fortitude");
  t("marcado treinado a mao, no 9 sobe para Mestre concedido",
    [f.prof, f.profEscolhida, f.concedida], ["mestre", "treinado", true]);
}

/* ============================================================ */
/* 7. A MARCAÇÃO À MÃO SEM FONTE VIRA AVISO (2026-09-24)         */
/* ============================================================ */
/* Decisão do autor: "Avisar em âmbar". A marcação continua possível, e o TR que
   ela sobe acima do que a Classe e o Motor dão sai com `semFonte`. */
{
  const semFonte = (d) => d.testes.resistencias.filter((r) => r.semFonte).map((r) => r.value);
  t("Vontade marcada a mao no Combatente 8 nao tem fonte",
    semFonte(ficha(cmb(8), { tr: ["fortitude"], prof: { vontade: "treinado" } })), ["vontade"]);
  t("marcar o TR que a Classe ja da nao acusa nada",
    semFonte(ficha(cmb(8), { tr: ["fortitude"], prof: { fortitude: "treinado" } })), []);
  t("Mestre a mao no TR da Classe antes do 9 passa da fonte",
    semFonte(ficha(cmb(8), { tr: ["fortitude"], prof: { fortitude: "mestre" } })), ["fortitude"]);
  t("e no 9 o Teste de Resistencia Mestre ja da o Mestre",
    semFonte(ficha(cmb(9), { tr: ["fortitude"], prof: { fortitude: "mestre" } })), []);
  t("o segundo TR do 9 tambem e fonte",
    semFonte(ficha(cmb(9), { tr: ["fortitude"], segundo: "vontade", prof: { vontade: "treinado" } })), []);
  t("sem marcacao a mao nao ha aviso", semFonte(ficha(cmb(9), { tr: ["fortitude"], segundo: "vontade" })), []);
  /* O Motor também é fonte: a Alma Inquebrável dá Integridade treinada. */
  {
    const f = createBlankAfty();
    f.rulesVersion = "player";
    f.core = { ...f.core, nd: 8, tipo: "misto", patamar: "comum" };
    f.especializacoes = cmb(8);
    f.trDaClasse = ["fortitude"];
    f.talentos = ["tal_alma_inquebravel"];
    f.resistenciasProf = { integridade: "treinado" };
    const d = deriveAfty(f);
    t("o Talento que da o TR tambem e fonte",
      [d.talentos.escolhidas.includes("tal_alma_inquebravel"), semFonte(d)], [true, []]);
  }
  t("na criatura o TR e escolha da aba e nunca acusa",
    semFonte(ficha(cmb(8), { sistema: "afty", prof: { vontade: "mestre", astucia: "treinado" } })), []);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
