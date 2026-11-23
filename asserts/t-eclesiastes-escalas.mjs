import assert from "node:assert/strict";
import { register } from "node:module";

register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const base = new URL("../src/systems/afty/", import.meta.url);
const { deriveAfty } = await import(new URL("afty-derive.js", base));
const { createBlankAfty } = await import(new URL("afty-schema.js", base));
const { createBlankFeitico } = await import(new URL("afty-feiticos.js", base));
const { cdDoTreinoEspecial, AFTY_TREINOS_ESPECIAIS } = await import(new URL("afty-treinos-especiais.js", base));
const { prepararFichaEclesiastes } = await import("../src/systems/eclesiastes/regras.js");

let total = 0;
function confere(real, esperado, mensagem) {
  assert.deepEqual(real, esperado, mensagem);
  total++;
}

function ficha(rulesVersion, tipo, nd = 11) {
  const c = createBlankAfty();
  c.rulesVersion = rulesVersion;
  Object.assign(c.core, { tipo, nd, origem: { id: "inato" } });
  c.attributes = { forca: 16, destreza: 14, constituicao: 12, inteligencia: 12, sabedoria: 16, presenca: 12 };
  c.feiticos = [{ ...createBlankFeitico(), tipo: "dano", nivel: 1, resolucao: "tr" }];
  // Eclesiastes descarta o Feitiço por Nível e lê o por pontos (2026-11-23). A CD
  // dos dois sai da mesma CD de Feitiçaria, que é o que este arquivo mede.
  c.feiticosEcl = [{ id: "ecl_cd", nome: "Teste de CD", nd: 1, dano: { dados: 1, resolucao: "tr" } }];
  return c;
}

for (const [sistema, tipo, defesa, cd, ataque] of [
  ["player", "misto", 5, 5, 5],
  ["afty", "combatente", 8, 6, 7],
  ["afty", "misto", 7, 7, 7],
  ["afty", "conjurador", 6, 8, 7],
  ["afty", "restringido", 8, 6, 7],
]) {
  const c = ficha(sistema, tipo);
  const original = deriveAfty(c);
  const atual = deriveAfty(prepararFichaEclesiastes(c));
  const esperadosTR = [defesa, defesa, cd, cd, ataque];
  const rotulo = `${sistema} ${tipo}`;

  confere(atual.defesa, original.defesa - defesa, `Defesa de ${rotulo}`);
  confere(atual.cd, original.cd - cd, `CD de ${rotulo}`);
  confere(atual.maestria, original.maestria, `Maestria de ${rotulo}`);
  confere(atual.atencao, original.atencao - 5, `Atenção de ${rotulo}`);
  confere(atual.contextoDsl.escala_ataque, 0, `DSL de ${rotulo}`);
  confere(atual.testes.ataques.map((a) => a.bonus), original.testes.ataques.map((a) => a.bonus - ataque), `Acerto de ${rotulo}`);
  const trsAtuais = atual.testes.resistencias.map((r) => [r.value, r.bonus]);
  confere(trsAtuais, original.testes.resistencias
    .flatMap((r, i) => r.value === "astucia" ? [] : [[r.value, r.bonus - esperadosTR[i]]]), `TRs de ${rotulo}`);
  confere(trsAtuais.map(([id]) => id), ["reflexos", "fortitude", "vontade", "integridade"], `TRs disponíveis para ${rotulo}`);
  confere(atual.testes.pericias.map((p) => p.bonus), original.testes.pericias.map((p) => p.bonus - 5), `Perícias de ${rotulo}`);
  confere(atual.testes.manobras.find((m) => m.id === "concentracao").executar,
    original.testes.manobras.find((m) => m.id === "concentracao").executar - defesa, `Concentração de ${rotulo}`);
  confere(atual.testes.manobras.find((m) => m.id === "agarrar").resistir,
    original.testes.manobras.find((m) => m.id === "agarrar").resistir - 5, `Resistir a Agarrar de ${rotulo}`);

  const fontes = [
    ...atual.partes.defesa,
    ...atual.partes.cd,
    ...["ataques", "resistencias", "pericias"].flatMap((grupo) => atual.testes[grupo].flatMap((linha) => linha.partes)),
  ];
  confere(fontes.some((p) => /Metade do (Nível|ND)|Nível ÷/.test(p.label)), false, `Fontes de ${rotulo}`);
  if (tipo !== "restringido") {
    const cdDoFeitico = (d) => Number(d.feiticos.lista.find((l) => l.propriedades?.some((p) => p.id === "cd"))
      ?.propriedades.find((p) => p.id === "cd")?.valor);
    confere(cdDoFeitico(atual), cdDoFeitico(original) - cd, `CD do feitiço de ${rotulo}`);
  }
}

for (const [patamar, totalDano, formula, formulaAfty] of [
  ["comum", 14, "4d6", "4d8 + 9"],
  ["desafio", 27, "4d8 + 9", "4d10 + 21"],
  ["calamidade", 43, "4d10 + 21", "4d12 + 28"],
  ["beyond", 48, "4d12 + 22", "4d12 + 33"],
]) {
  const c = ficha("afty", "combatente");
  c.core.patamar = patamar;
  c.aptidoes = { cl: 2 };
  const basico = (f) => deriveAfty(f).dano.entradas.find(({ id }) => id === "basico");
  const linha = basico(prepararFichaEclesiastes(c));

  confere(linha.total, totalDano, `Dano total em Eclesiastes ${patamar}`);
  confere(linha.formulaNormal, formula, `Rolagem em Eclesiastes ${patamar}`);
  confere(linha.partes.some((p) => p.label.startsWith("Controle e Leitura")), patamar !== "comum", `CL no hover ${patamar}`);
  confere(basico(c).formulaNormal, formulaAfty, `Rolagem Afty ${patamar}`);
}

const conjurador = prepararFichaEclesiastes(ficha("afty", "conjurador", 20));
conjurador.aptidoes = { dom: 5, bar: 3 };
conjurador.aptidoesAmaldicoadas = [
  "tecnicas_de_barreira", "expansao_de_dominio_incompleta", "expansao_de_dominio_completa",
];
conjurador.dominios = [{ id: "dominio", nome: "Teste", versao: "completa", efeitos: [] }];
conjurador.treinamentos = { barreiras: 1, dominios: 1 };

const { dominios, rdGeral, pe } = deriveAfty(conjurador);
confere(dominios.conflito.bonus, 6, "Conflito de Domínio com o nível de Domínio e o treino");
confere(dominios.conflito.partes.some((p) => /Metade/.test(p.label)), false, "Fontes do Conflito de Domínio");
confere(dominios.barreira.pvParede, 15, "Parede com o bônus de treino");
confere(dominios.barreira.partesPvParede.some((p) => /metade/.test(p.label)), false, "Fontes do PV da parede");
confere(dominios.barreira.pvCortina, 45, "PV da Cortina");
confere(dominios.lista[0].pvBarreira, 180, "PV do domo");
confere(rdGeral, 0, "RD de Conjurador de ND 20");
confere(deriveAfty(prepararFichaEclesiastes(ficha("afty", "misto", 9))).rdGeral, 0, "RD de Misto de ND 9");
confere(deriveAfty(prepararFichaEclesiastes(ficha("afty", "misto", 10))).rdGeral, 10, "RD de Misto de ND 10");
for (const [qntPE, ajuste] of [["pouca", 0], ["grande", 0], ["muito_pouca", -20], ["muito_grande", 20]]) {
  confere(deriveAfty({ ...conjurador, qntPE }).pe, pe + ajuste, `Quantidade de PE ${qntPE}`);
}
const comParedesResistentes = {
  ...conjurador, aptidoesAmaldicoadas: [...conjurador.aptidoesAmaldicoadas, "paredes_resistentes"],
};
confere(deriveAfty(comParedesResistentes).dominios.barreira.pvParede, 80, "Paredes Resistentes usa ND inteiro");

const jogador = ficha("player", "misto");
for (const treino of AFTY_TREINOS_ESPECIAIS) {
  confere(cdDoTreinoEspecial(treino, jogador), 17, `CD do treino comum ${treino.id}`);
  confere(cdDoTreinoEspecial(treino, prepararFichaEclesiastes(jogador)), 12, `CD do treino em Eclesiastes ${treino.id}`);
}

console.log(`TODOS OS ${total} ASSERTS PASSARAM`);
