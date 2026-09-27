/* O ADDON `treino-testes-de-resistencia` E AS QUATRO PEÇAS QUE ELE PEDIU AO
   MOTOR (2026-09-26).

   O autor mandou o texto de um Treinamento novo, repetível uma vez por TR (menos
   Integridade), e escolheu ensinar ao motor o que faltava em vez de aproximar:

     1. `alvoTipo: "tr"`, o seletor de Teste de Resistência numa linha repetível.
     2. O requisito `atributoDoAlvo`: "12 ou mais no atributo do TR".
     3. `soAlvos` num efeito de Treinamento: o Completo muda conforme o TR
        (margem em Astúcia e Vontade, +2 em Fortitude e Reflexos).
     4. O canal `proficienciaTRCasoJa`: "Você se torna treinado. Caso já fosse
        treinado, recebe +1", contando o TR que vem da Classe.

   Este arquivo prende as quatro, o pacote de ponta a ponta nos dois sistemas,
   a marcação à mão que não compra o +1 no jogador e o orçamento da criatura. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const TR = await import(R + "afty-treinamentos.js");
const EF = await import(R + "afty-efeitos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* O PACOTE                                                      */
/* ============================================================ */
const bruto = JSON.parse(readFileSync(new URL("../addons/treino-testes-de-resistencia.json", import.meta.url), "utf8"));
const pacote = AD.normalizarPacote(bruto);
t("o pacote valida sem problema nenhum", AD.validarPacote(pacote), []);
t("autoria e sistema-alvo", [bruto.autor, bruto.paraRaw], ["Templas", "afty"]);
AD.aplicarAddons([pacote]);
const ID = "treino-testes-de-resistencia:testes_de_resistencia";
const linha = TR.getTreinamento(ID);
t("a linha entra, repetível e com alvo de TR", [!!linha, linha?.repetivel, linha?.alvoTipo], [true, true, "tr"]);
t("o canal novo existe e tem alvo de TR",
  EF.EFEITO_CANAIS.find((c) => c.id === "proficienciaTRCasoJa")?.alvo, "tr");

/* ============================================================ */
/* 1 E 2. O ALVO DE TR E O ATRIBUTO DO ALVO                      */
/* ============================================================ */
t("o rótulo do alvo é o nome do TR", TR.rotuloAlvo(linha, "astucia"), "Astúcia");
t("o atributo do alvo sai do TR", ["fortitude", "reflexos", "vontade", "astucia"].map((a) => TR.atributoDoAlvo(linha, a)),
  ["constituicao", "destreza", "sabedoria", "inteligencia"]);
t("e do Treino de Atributo e de Perícia, que já existiam", [
  TR.atributoDoAlvo({ alvoTipo: "atributo" }, "forca"), TR.atributoDoAlvo({ alvoTipo: "pericia" }, "furtividade"),
  TR.atributoDoAlvo({ alvoTipo: "arma" }, "arm_espada_curta"),
], ["forca", "destreza", null]);
{
  const req = { tipo: "atributoDoAlvo", valor: 12 };
  const com = (attr, valor) => TR.avaliarRequisito(req, { attrEff: { [attr]: valor }, atributoDoAlvo: attr });
  t("o requisito confere o atributo do TR escolhido e diz qual é", [
    [com("constituicao", 14).ok, com("constituicao", 14).label],
    [com("constituicao", 11).ok, com("constituicao", 11).label],
  ], [[true, "Constituição 12"], [false, "Constituição 12"]]);
  const previa = TR.avaliarRequisito(req, { attrEff: {} });
  t("sem alvo (a prévia) ele só exibe", [previa.ok, previa.verificavel, previa.label], [true, false, "Atributo do Alvo 12"]);
}
t("a 2ª e a 4ª etapa pedem Nível e atributo do alvo",
  [2, 4].map((n) => TR.requisitosDaEtapa(linha.etapas[n - 1].requisito).map((r) => [r.tipo, r.valor])),
  [[["nd", 13], ["atributoDoAlvo", 12]], [["nd", 22], ["atributoDoAlvo", 16]]]);

/* ============================================================ */
/* 3 E 4. A FICHA DE JOGADOR                                     */
/* ============================================================ */
/* Combatente com a Fortitude como TR da Classe: treinado até o nível 8, e
   Mestre a partir do 9 pelo Teste de Resistência Mestre. É o caso que o texto
   chama de "Caso já fosse treinado", e o que o Treino de Perícia não cobria
   porque o `prof_tr_*` só lê a marcação à mão. */
const ficha = (nivel, instancias, o = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = o.sistema ?? "player";
  f.core = { ...f.core, nd: nivel, tipo: "misto", patamar: "comum" };
  f.especializacoes = [{ id: "combatente", nivel }];
  f.attributes = { forca: 10, destreza: 12, constituicao: 14, inteligencia: 10, sabedoria: 12, presenca: 10 };
  f.trDaClasse = ["fortitude"];
  if (o.prof) f.resistenciasProf = o.prof;
  f.treinamentos = instancias ? { [ID]: instancias } : {};
  f.addons = [pacote];
  return deriveAfty(f);
};
const tr = (d, id) => d.testes.resistencias.find((r) => r.value === id);
const doTreino = (r) => r.partes.filter((p) => p.label === "Treino de Testes de Resistência (Fortitude)"
  || p.label.startsWith("Treino de Testes de Resistência")).map((p) => p.valor);
const inst = (alvo, progresso) => [{ alvo, progresso }];

for (const [nivel, faixaDaClasse] of [[8, "treinado"], [13, "mestre"]]) {
  const base = tr(ficha(nivel, null), "fortitude");
  t(`nível ${nivel}: a Classe dá Fortitude ${faixaDaClasse}`, base.prof, faixaDaClasse);
  const e1 = tr(ficha(nivel, inst("fortitude", 1)), "fortitude");
  t(`nível ${nivel}: 1ª etapa na Fortitude já treinada vira +1`, [e1.prof, e1.bonus - base.bonus, doTreino(e1)],
    [faixaDaClasse, 1, [1]]);
}
{
  /* No 8 a Fortitude é Treinada: a 2ª etapa CONCEDE o Mestre (não era mestre),
     e o +1 da 1ª continua. No 13 ela já é Mestre pela Classe: a 2ª vira +2. */
  const b8 = tr(ficha(8, null), "fortitude");
  const e8 = tr(ficha(8, inst("fortitude", 2)), "fortitude");
  const mestre8 = tr(ficha(8, null, { prof: { fortitude: "mestre" } }), "fortitude");
  t("nível 8: 2ª etapa concede o Mestre e o +1 fica", [e8.prof, e8.bonus, doTreino(e8)], ["mestre", mestre8.bonus + 1, [1]]);
  const b13 = tr(ficha(13, null), "fortitude");
  const e13 = tr(ficha(13, inst("fortitude", 2)), "fortitude");
  t("nível 13: já Mestre pela Classe, a 2ª vira +2", [e13.prof, e13.bonus - b13.bonus, doTreino(e13)], ["mestre", 3, [1, 2]]);
  t("o Completo em Fortitude dá +2 e não mexe na margem", [
    tr(ficha(13, inst("fortitude", 4)), "fortitude").bonus - e13.bonus,
    tr(ficha(13, inst("fortitude", 4)), "fortitude").margemCritico,
  ], [2, 20]);
  t("nada disto mexe na Fortitude sem o treino nem nos outros TR", [
    tr(ficha(8, inst("fortitude", 4)), "vontade").bonus, b8.prof,
  ], [tr(ficha(8, null), "vontade").bonus, "treinado"]);
}
{
  /* Vontade não vem da Classe: a 1ª concede o Treinado, a 2ª o Mestre, e o
     Completo reduz a margem em 2 sem somar os +2 de Fortitude e Reflexos. */
  const nada = tr(ficha(13, null), "vontade");
  const e1 = tr(ficha(13, inst("vontade", 1)), "vontade");
  const e4 = tr(ficha(13, inst("vontade", 4)), "vontade");
  t("Vontade sem fonte: a 1ª concede o Treinado, sem número a mais",
    [nada.prof, e1.prof, e1.concedida, doTreino(e1)], [null, "treinado", true, []]);
  t("Vontade no Completo: Mestre e margem 18, sem +2",
    [e4.prof, e4.margemCritico, doTreino(e4)], ["mestre", 18, []]);
  const ast = tr(ficha(13, inst("astucia", 4)), "astucia");
  const ref = tr(ficha(13, inst("reflexos", 4)), "reflexos");
  const refSem = tr(ficha(13, inst("reflexos", 2)), "reflexos");
  t("Astúcia no Completo reduz a margem, e Reflexos soma +2 sem reduzir", [
    ast.margemCritico, ref.margemCritico, ref.bonus - refSem.bonus,
  ], [18, 20, 2]);
  t("duas instâncias convivem, uma por TR", [
    tr(ficha(13, [{ alvo: "vontade", progresso: 1 }, { alvo: "astucia", progresso: 1 }]), "vontade").prof,
    tr(ficha(13, [{ alvo: "vontade", progresso: 1 }, { alvo: "astucia", progresso: 1 }]), "astucia").prof,
  ], ["treinado", "treinado"]);
}
{
  /* ⚠ NO JOGADOR A MARCAÇÃO À MÃO NÃO COMPRA O +1. Ela não é fonte ("TR NÃO
     PODE SER ESCOLHIDO DE FORMA LIVRE"), então o treino continua concedendo o
     Treinado em vez de virar número. E marcar o que o treino já dá não acusa. */
  const maoT = tr(ficha(13, inst("vontade", 1), { prof: { vontade: "treinado" } }), "vontade");
  t("jogador: Vontade marcada à mão com a 1ª etapa não ganha +1 nem aviso",
    [maoT.prof, doTreino(maoT), maoT.semFonte], ["treinado", [], false]);
  const maoM = tr(ficha(13, inst("vontade", 1), { prof: { vontade: "mestre" } }), "vontade");
  t("jogador: Mestre à mão acima do treino continua acusado", [maoM.prof, maoM.semFonte], ["mestre", true]);
}

/* ============================================================ */
/* A CRIATURA                                                    */
/* ============================================================ */
/* Na criatura o TR é escolhido na aba e gasta vaga. Marcar à mão por cima do
   treino COMPRA o "caso já seja", como no Treino de Perícia: a marca é paga
   inteira e o treino vira +1. Sem marca, o treino concede e não custa nada. */
{
  const sem = ficha(13, inst("vontade", 1), { sistema: "afty" });
  const com = ficha(13, inst("vontade", 1), { sistema: "afty", prof: { vontade: "treinado" } });
  const soMarca = ficha(13, null, { sistema: "afty", prof: { vontade: "treinado" } });
  t("criatura: o treino concede o Treinado e não gasta vaga",
    [tr(sem, "vontade").prof, sem.testes.orcamento.resistencias], ["treinado", 0]);
  t("criatura: com a marca paga, o treino vira +1 e a vaga continua paga", [
    tr(com, "vontade").bonus - tr(soMarca, "vontade").bonus, com.testes.orcamento.resistencias,
  ], [1, soMarca.testes.orcamento.resistencias]);
  t("criatura: sem aviso de TR sem fonte, que é só do jogador", tr(com, "vontade").semFonte, false);
}

/* ============================================================ */
/* A LINHA MORTA DA LINHA REPETÍVEL                              */
/* ============================================================ */
/* ⚠ Até 2026-09-26 a linha REPETÍVEL de um addon que sumiu não era acusada: o
   `idsDaFicha` lia `Number(lista)`, que é NaN. A ficha perdia o treino calada. */
{
  const f = createBlankAfty();
  f.rulesVersion = "player";
  f.core = { ...f.core, nd: 8 };
  f.treinamentos = { [ID]: inst("vontade", 2) };
  AD.aplicarAddons([]);
  const problemas = deriveAfty(f).addonProblemas ?? [];
  t("sem o addon, a linha repetível vira linha morta com o id dela",
    problemas.map((p) => [p.familia, p.id]), [["treinamentos", ID]]);
  AD.aplicarAddons([pacote]);
  t("com o addon de volta, nenhum problema", (deriveAfty({ ...f, addons: [pacote] }).addonProblemas ?? []).length, 0);
}

/* ============================================================ */
/* 3. `soAlvos` FORA DO ADDON                                    */
/* ============================================================ */
/* Linha sem `soAlvos` continua valendo para todo alvo: o Treino de Atributo do
   livro soma no atributo escolhido, qualquer que seja. */
{
  const f = createBlankAfty();
  f.rulesVersion = "afty";
  f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum" };
  f.attributes = { forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 };
  f.treinamentos = { atributo: [{ alvo: "presenca", progresso: 2 }] };
  t("o Treino de Atributo do livro segue somando no alvo", deriveAfty(f).atributos?.presenca ?? deriveAfty(f).attrEff?.presenca, 12);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
