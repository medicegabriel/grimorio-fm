/* TREINO "O ESPÍRITO INDOMÁVEL DO SER HUMANO" (addon, 2026-10-09).

   Linha de Treinamento exclusiva do Não-Feiticeiro, lida de
   `addons/espirito-indomavel.json` junto do `addons/nao-feiticeiro.json` 1.1.0.
   Prende os dois verbos que ela pediu, genéricos:
     • `concedeTalentos` numa etapa de treino: "Recebe o talento Determinado a
       Viver, ainda tendo que cumprir os pré-requisitos". Entra sem vaga, e o
       pré-requisito é o de sempre: com Constituição abaixo de 16 o Talento sai
       marcado inacessível, sem ser tirado;
     • `requerTreinoCompleto` numa escolha de origem: a Artimanha a mais só abre
       com o treino completo. */
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
const T = await import(R + "afty-treinamentos.js");
const O = await import(R + "afty-origens.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. OS PACOTES                                                 */
/* ============================================================ */
const ler = (n) => JSON.parse(readFileSync(new URL(`../addons/${n}.json`, import.meta.url), "utf8"));
const NF = ler("nao-feiticeiro");
const EI = ler("espirito-indomavel");
t("o treino valida", A.validarPacote(EI), []);
t("o Não-Feiticeiro 1.1.0 valida", [A.validarPacote(NF), NF.versao], [[], "1.1.0"]);
t("autor e sistema-alvo do treino", [EI.autor, EI.paraRaw], ["Templas", "afty"]);
const pNF = A.normalizarPacote(NF);
const pEI = A.normalizarPacote(EI);
A.aplicarAddons([pNF, pEI]);
const LINHA = "espirito-indomavel:espirito_indomavel";
const ORIGEM = "nao-feiticeiro:nao_feiticeiro";
const linha = T.getTreinamento(LINHA);
t("a linha existe, com o namespace", linha?.nome, "O Espírito Indomável do Ser Humano");
t("os focos das quatro etapas", linha?.etapas?.map((e) => e.focos), [1, 1, 2, 3]);
t("o id da origem de outro pacote não ganha prefixo de novo", linha?.soDaOrigem, [ORIGEM]);
t("só o Não-Feiticeiro alcança a linha",
  [T.treinamentosDaOrigem(ORIGEM).some((l) => l.id === LINHA), T.treinamentosDaOrigem("inato").some((l) => l.id === LINHA)],
  [true, false]);
const escolhaTreino = O.getOrigem(ORIGEM)?.caracteristicas?.find((c) => c.id === "nf_artimanhas")
  ?.escolhas?.find((e) => e.id === "nf_artimanha_treino");
t("a escolha da Artimanha a mais espera o treino", [escolhaTreino?.requerTreinoCompleto, escolhaTreino?.opcoes?.length], [LINHA, 7]);

/* ============================================================ */
/* 2. A FICHA, ETAPA A ETAPA, NOS DOIS SISTEMAS                  */
/* ============================================================ */
for (const sistema of ["player", "afty"]) {
  const ficha = (prog, { origem = ORIGEM, con = 10 } = {}) => {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.core = { ...c.core, nd: 10, tipo: "combatente", patamar: "comum", origem: { id: origem, escolhas: { nf_artimanha_treino: ["nf_at_mente_astuta"] } } };
    c.especializacoes = [{ id: "lutador", nivel: 10 }];
    c.attrMethod = "fixos";
    c.attributes = { forca: 10, destreza: 10, constituicao: con, inteligencia: 10, sabedoria: 10, presenca: 10 };
    c.addons = [pNF, pEI];
    c.treinamentos = prog ? { [LINHA]: prog } : {};
    return c;
  };
  const tag = (s) => `${sistema}: ${s}`;
  const d = [0, 1, 2, 3, 4].map((p) => deriveAfty(ficha(p)));
  const vontade = (x) => x.testes.resistencias.find((r) => (r.id ?? r.value) === "vontade")?.prof ?? null;
  const corpo = (x) => x.testes.ataques.find((a) => a.id === "corpo")?.bonus;
  const temTalento = (x) => x.talentos.escolhidas.includes("tal_determinado_a_viver");

  t(tag("etapa 1: +4 de vida máxima"), d[1].hp - d[0].hp, 4);
  t(tag("etapa 2: treinado em Vontade"), [vontade(d[1]), vontade(d[2])], [null, "treinado"]);
  t(tag("etapa 3: +3 nos acertos corpo a corpo"), corpo(d[3]) - corpo(d[2]), 3);
  t(tag("e não na distância"),
    d[3].testes.ataques.find((a) => a.id === "distancia")?.bonus - d[2].testes.ataques.find((a) => a.id === "distancia")?.bonus, 0);
  t(tag("etapa 4: o Determinado a Viver chega"), [temTalento(d[3]), temTalento(d[4])], [false, true]);
  t(tag("sem gastar vaga de Talento"), d[4].talentos.gastos, d[3].talentos.gastos);
  t(tag("com Constituição 10 ele fica inacessível"), (d[4].talentos.inacessiveis ?? []).includes("tal_determinado_a_viver"), true);
  const con16 = deriveAfty(ficha(4, { con: 16 }));
  t(tag("com Constituição 16 ele vale"), (con16.talentos.inacessiveis ?? []).includes("tal_determinado_a_viver"), false);
  t(tag("a Artimanha a mais só abre com o treino completo"),
    [!!d[3].origem.porEscolha.nf_artimanha_treino, !!d[4].origem.porEscolha.nf_artimanha_treino], [false, true]);
  t(tag("e a escolha dela vale"), d[4].origem.mapa.nf_artimanha_treino, ["nf_at_mente_astuta"]);

  // Em outra origem, o treino gravado não rende nada.
  const inato = deriveAfty(ficha(4, { origem: "inato" }));
  const inatoSem = deriveAfty(ficha(0, { origem: "inato" }));
  t(tag("no Inato o treino gravado não rende"), [inato.hp - inatoSem.hp, temTalento(inato)], [0, false]);
}

A.limparAddons();
console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
