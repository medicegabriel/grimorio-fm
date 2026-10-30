/* Ascendendo Além dos Céus, a continuação do Regras Grimorio (2026-10-12). */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { validarPacote, normalizarPacote } = await import(R + "afty-addons.js");
const { createBlankAfty, mesclaFichaAfty } = await import(R + "afty-schema.js");
const { deriveAfty } = await import(R + "afty-derive.js");
const { resumoAtributos } = await import(R + "afty-atributos.js");
const { renovaGuarda, sofreGolpeNaGuarda, entradaDaGuarda } = await import(R + "ficha/ficha-sessao.js");

const ler = (nome) => JSON.parse(readFileSync(new URL(`../addons/${nome}.json`, import.meta.url), "utf8"));
const ASC = ler("ascendendo-alem-dos-ceus");
const REGRAS = ler("regras-grimorio");
const comGuarda = { ...ASC, regrasAfty: { ...ASC.regrasAfty, guardaComoCalamidade: true } };

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

t("Addon é válido", validarPacote(ASC), []);
t("Addon com a Guarda ligada é válido", validarPacote(comGuarda), []);
t("normalizador preserva o interruptor desligado",
  normalizarPacote(ASC).regrasAfty.guardaComoCalamidade, false);
t("interruptor que não é booleano é recusado",
  validarPacote({ ...ASC, regrasAfty: { guardaComoCalamidade: "sim" } }).length > 0, true);

const ficha = (sistema, addons, nd = 20) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd, tipo: "conjurador", patamar: "comum", origem: { id: "inato" } };
  f.especializacoes = [{ id: "conjurador", nivel: nd }];
  f.aptidoes = { au: 1, cl: 0, er: 0, dom: 3, bar: 3 };
  f.aptidoesAmaldicoadas = ["tecnicas_de_barreira", "expansao_de_dominio_incompleta", "expansao_de_dominio_completa"];
  f.dominios = [{ id: "d1", nome: "Teste", versao: "completa", efeitos: [] }];
  f.addons = addons;
  return mesclaFichaAfty(f);
};

for (const sistema of ["player", "afty"]) {
  const nada = deriveAfty(ficha(sistema, []));
  const regras = deriveAfty(ficha(sistema, [REGRAS]));
  const ambos = deriveAfty(ficha(sistema, [REGRAS, ASC]));
  const bt = nada.maestria;

  /* PV: 2x vira 3x, e a Integridade fica no valor anterior. */
  t(`${sistema}: com o Regras Grimorio o PV vai a 3x`, ambos.hp, Math.round(nada.hp * 3));
  t(`${sistema}: o PV de 3x é metade a mais que o de 2x`, ambos.hp, Math.round(regras.hp * 1.5));
  t(`${sistema}: a Integridade não sobe`, ambos.almaMax, nada.almaMax);
  t(`${sistema}: o multiplicador exposto é 3`, ambos.regrasAfty.multiplicadorPvFinal, 3);
  t(`${sistema}: o hover do PV mostra o Addon`,
    ambos.partes.hp.some((p) => p.label === "Ascendendo Além dos Céus" && p.texto === "×1.5"
      || p.label === "Ascendendo Além dos Céus" && p.texto === "×1,5"), true);

  /* Área: 7,5 m × BT somados ao raio da Expansão. */
  const area = (d) => d.dominios.lista[0].area;
  t(`${sistema}: sem o Addon a Completa tem 9 metros`, area(nada), "9 metros");
  const metros = 9 + 7.5 * bt;
  t(`${sistema}: a Expansão ganha 7,5 m × BT`,
    area(ambos), `${String(metros).replace(".", ",")} metros`);

  /* Pontos de Atributo: 1 a cada 4 níveis, no mesmo pool livre. */
  t(`${sistema}: ND 20 dá 5 Pontos de Atributo a mais`, ambos.pontosAtributoExtra - nada.pontosAtributoExtra, 5);
  t(`${sistema}: ND 7 dá 1`,
    deriveAfty(ficha(sistema, [ASC], 7)).pontosAtributoExtra - deriveAfty(ficha(sistema, [], 7)).pontosAtributoExtra, 1);
}

/* Os pontos chegam ao orçamento da aba de Atributos do jogador. */
{
  const f = ficha("player", [REGRAS, ASC]);
  const d = deriveAfty(f);
  const sem = resumoAtributos(ficha("player", [REGRAS]), null, null, deriveAfty(ficha("player", [REGRAS])).pontosAtributoExtra);
  const com = resumoAtributos(f, null, null, d.pontosAtributoExtra);
  t("player: o pool de nível cresce 5", com.nivelTotal - sem.nivelTotal, 5);
}

/* Guarda Alta: só com o interruptor, e com os números de Calamidade. */
{
  const desligada = deriveAfty(ficha("player", [REGRAS, ASC]));
  t("player: interruptor desligado deixa a Guarda nula", desligada.guarda, null);
  const fichaG = ficha("player", [REGRAS, comGuarda]);
  const ligada = deriveAfty(fichaG);
  t("player: Guarda ligada", ligada.guarda?.ativa, true);
  t("player: bônus de Calamidade", ligada.guarda.bonusMax, 5);
  t("player: Vida de Calamidade, 5 × ND", ligada.guarda.vidaMax, 100);
  t("player: a fonte cita o Addon",
    ligada.partes.guardaBonus[0].label, "Ascendendo Além dos Céus (Calamidade)");

  /* No ar pela sessão: rodada nova, depois um golpe. */
  let sessao = renovaGuarda({}, ligada);
  const noAr = deriveAfty(fichaG, { guarda: entradaDaGuarda(sessao) });
  t("player: Guarda no ar soma +5 na Defesa", noAr.defesa - ligada.defesa, 5);
  sessao = sofreGolpeNaGuarda(sessao, ligada);
  t("player: um golpe tira 2", deriveAfty(fichaG, { guarda: entradaDaGuarda(sessao) }).guarda.bonus, 3);

  /* Na criatura o interruptor não muda o Patamar dela. */
  t("afty: criatura Comum segue sem Guarda",
    deriveAfty(ficha("afty", [REGRAS, comGuarda])).guarda.ativa, false);
}

/* Regra de mesa com `acumula` soma com outra, em vez de disputar o pool
   exclusivo dos Funcionamentos Básicos. */
{
  const MORADOR = ler("morador-da-cidade");
  const sem = deriveAfty(ficha("player", [REGRAS])).pontosAtributoExtra;
  const juntos = deriveAfty(ficha("player", [REGRAS, MORADOR, ASC])).pontosAtributoExtra;
  t("player: Morador da Cidade e Ascendendo somam", juntos - sem, 2 + 5);
  const semAcumula = (p) => ({ ...p, funcionamentos: p.funcionamentos.map(({ acumula, ...f }) => f) });
  t("sem acumula os dois disputam o pool",
    deriveAfty(ficha("player", [REGRAS, semAcumula(MORADOR), semAcumula(ASC)])).pontosAtributoExtra - sem, 5);
  t("acumula que não é booleano é recusado",
    validarPacote({ ...ASC, funcionamentos: [{ ...ASC.funcionamentos[0], acumula: "sim" }] }).length > 0, true);
}

/* Sem o Addon, nada muda. */
t("player: sem o Addon a Guarda segue nula", deriveAfty(ficha("player", [REGRAS])).guarda, null);

console.log(bad.length ? `FALHAS (${bad.length}):\n${bad.join("\n")}` : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
