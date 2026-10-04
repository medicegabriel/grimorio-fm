/* OS TIPOS DE INVOCAÇÃO COMO DADO (Etapa 2 da atualização de 2026-09-30).

   Decisão do autor: os tipos separados do *Mecânicas para Invocações 2.5.2*
   passam a existir mecanicamente. Marionete, Corpo Amaldiçoado, Maldição Domada,
   Shikigami, e o Shikigami de Técnica como subtipo do Shikigami. As regras de
   cada um são uma linha de `REGRAS_POR_TIPO` (afty-invocacoes-tipos.js), lida por
   `regrasDoTipo`.

   O que este arquivo garante:
   1. a matriz de tipos do projeto, célula a célula;
   2. a herança do subtipo (a Técnica herda o que não reescreve);
   3. os sinais de DSL específicos, e o `tipo_shikigami` LEGACY com o sentido de sempre;
   4. o tipo antigo "dispositivo" lido como Shikigami, sem conversão, com aviso;
   5. os números do Shikigami e da Técnica IGUAIS aos de antes da etapa (tabela
      tirada do código anterior por `git archive`, e não escrita de cabeça). */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const INV = await import(R + "afty-invocacoes.js");
const TIPOS = await import(R + "afty-invocacoes-tipos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const CINCO = ["shikigami", "tecnica", "maldicao", "marionete", "corpo"];
const regra = (campo) => CINCO.map((v) => TIPOS.regrasDoTipoValor(v)[campo]);

/* ============================================================ */
/* 1. A TABELA E O CATÁLOGO                                      */
/* ============================================================ */
t("a tabela de regras fecha sem erro", TIPOS.validarRegrasPorTipo(), []);
t("o validador do catalogo de invocacoes continua zerado", INV.validarCatalogoInvocacoes(), []);
t("o catalogo de tipos tem os cinco, na ordem da tela",
  INV.AFTY_INV_TIPOS.map((x) => x.value), CINCO);
t("os rotulos de tela confirmados pelo autor em 2026-10-03",
  INV.AFTY_INV_TIPOS.map((x) => x.label),
  ["Shikigami", "Shikigami de Técnica", "Maldição", "Marionete", "Corpo Amaldiçoado"]);
t("os rotulos curtos do filtro da lista",
  INV.AFTY_INV_TIPOS.map((x) => x.curto), ["Shikigami", "Técnica", "Maldição", "Marionete", "Corpo"]);

/* ============================================================ */
/* 2. A MATRIZ (ordem: Shikigami, Técnica, Maldição, Marionete, Corpo) */
/* ============================================================ */
t("familia (a Tecnica e da familia do Shikigami)", regra("familia"),
  ["shikigami", "shikigami", "maldicao", "marionete", "corpo"]);
t("verbo: so o Shikigami e a Tecnica sao invocados, o resto e ativado", regra("verbo"),
  ["invocar", "invocar", "ativar", "ativar", "ativar"]);
t("pode ser dissipada", regra("dissipavel"), [true, true, false, false, false]);
t("pode ser guardada em talisma", regra("talisma"), [true, false, false, false, false]);
t("pode ser curada", regra("cura").map((c) => c.comum), [true, true, true, false, true]);
t("pode receber Energia Reversa", regra("cura").map((c) => c.er), [true, true, false, false, true]);
t("alma", regra("alma"), ["pv", "pv", "pv", "nenhuma", "nucleo"]);
t("custo base", regra("custoBase"), ["grau", "grau", 0, 0, 0]);
t("grau fixo so na Maldicao", regra("grauFixo"), [false, false, true, false, false]);
t("Visionario nao vale na Maldicao", regra("visionario"), [true, true, false, true, true]);
t("todos podem compor Horda (os compostos sao barrados na Horda)", regra("horda"), [true, true, true, true, true]);
t("Autonomia: Tecnica nao usa, Maldicao paga no inicio do combate", regra("autonomia"),
  ["entrada", false, "inicioCombate", "entrada", "entrada"]);
t("estado a 0 PV", regra("aZero"), ["dissipada", "dissipada", "exorcizada", "quebrada", "desativada"]);
t("estado da morte permanente", regra("terminal"), ["exorcizada", "morta", "exorcizada", "destruida", "destruida"]);
t("Aptidao como Caracteristica so na Maldicao", regra("aptidoes"), [false, false, true, false, false]);
t("imunidade", regra("imunidade"), ["nenhuma", "passivaDeTecnica", "propria", "nenhuma", "nenhuma"]);
t("excedente fica fora de combate", regra("excedenteForaDeCombate"), [false, false, true, true, true]);
t("turno proprio so na Tecnica", regra("turnoProprio"), [false, true, false, false, false]);
t("Intermediario", regra("intermediario"), ["Talismã", null, null, "Ela Mesma", "Ele Mesmo"]);
t("base e piso de atributo", [regra("atributoBase"), regra("atributoMin")],
  [[8, 10, 8, 8, 8], [6, 8, 6, 6, 6]]);
t("nivel REAL de Controlador para o Grau Especial", regra("especialNivelReal"), [null, null, null, 17, 17]);

/* A herança do subtipo: o que a Técnica não reescreve vem do Shikigami. */
const tec = TIPOS.regrasDoTipoValor("tecnica");
const shi = TIPOS.regrasDoTipoValor("shikigami");
t("a Tecnica herda o que nao reescreve",
  [tec.verbo, tec.dissipavel, tec.cura, tec.alma, tec.custoBase, tec.aZero],
  [shi.verbo, shi.dissipavel, shi.cura, shi.alma, shi.custoBase, shi.aZero]);
t("a Tecnica sabe de quem herda", [tec.herda, shi.herda ?? null], ["shikigami", null]);

/* ============================================================ */
/* 3. VALOR DESCONHECIDO E O "DISPOSITIVO" (sem conversão)        */
/* ============================================================ */
const reg = (tipoMecanico) => INV.regrasDoTipo({ tipoMecanico }).value;
t("tipo ausente, vazio ou inventado cai no Shikigami",
  [reg(undefined), reg(""), reg("xyz")], ["shikigami", "shikigami", "shikigami"]);
t("o dispositivo e lido como Shikigami (nao vira Marionete nem Corpo sozinho)",
  [reg("dispositivo"), INV.tipoMecanicoDaInvocacao({ tipoMecanico: "dispositivo" })], ["shikigami", "shikigami"]);
t("so o dispositivo e marcado como tipo legado",
  ["dispositivo", "shikigami", "marionete", undefined].map((x) => INV.tipoLegadoDispositivo({ tipoMecanico: x })),
  [true, false, false, false]);

const resolvida = (tipoMecanico, extra = {}) => {
  const inv = INV.createBlankInvocacao("quarto", tipoMecanico === "dispositivo" ? "shikigami" : tipoMecanico);
  inv.id = "x"; inv.tipoMecanico = tipoMecanico;
  Object.assign(inv, extra);
  return INV.resolveInvocacao(inv, { nd: 1, bt: 2, nivelControlador: 1 });
};
/* E-10: o resolvido devolvia o valor CRU, e a ficha com "dispositivo" chegava à
   tela com esse tipo enquanto o rótulo dizia "Invocação". */
t("o resolvido devolve o tipo normalizado (E-10)", resolvida("dispositivo").tipoMecanico, "shikigami");
t("e o rotulo bate com ele", resolvida("dispositivo").tipoLabel, "Shikigami");
t("a ficha com dispositivo ganha o aviso de tipo antigo",
  resolvida("dispositivo").warnings.includes("Tipo antigo Dispositivo lido como Invocação."), true);
t("e nenhum dos cinco tipos atuais ganha esse aviso",
  CINCO.map((x) => resolvida(x).warnings.some((w) => w.startsWith("Tipo antigo"))), [false, false, false, false, false]);
t("o resolvido traz familia e regras", [resolvida("tecnica").familia, resolvida("corpo").regras.aZero],
  ["shikigami", "desativada"]);

/* ============================================================ */
/* 4. OS SINAIS DE DSL                                           */
/* ============================================================ */
const vars = (tipo) => INV.buildInvocacaoDslContext({ ...INV.createBlankInvocacao("quarto", tipo), tipoMecanico: tipo }, {});
const sinais = ["tipo_shikigami_puro", "tipo_tecnica", "tipo_maldicao", "tipo_marionete", "tipo_corpo"];
t("cada tipo liga exatamente o seu sinal",
  CINCO.map((x) => sinais.map((s) => vars(x)[s])),
  [[1, 0, 0, 0, 0], [0, 1, 0, 0, 0], [0, 0, 1, 0, 0], [0, 0, 0, 1, 0], [0, 0, 0, 0, 1]]);
t("tipo_shikigami LEGACY: Shikigami e Maldicao, como sempre, e desligado nos tipos novos",
  CINCO.map((x) => vars(x).tipo_shikigami), [1, 0, 1, 0, 0]);
t("o dispositivo liga o sinal do Shikigami puro", vars("dispositivo").tipo_shikigami_puro, 1);

/* ============================================================ */
/* 5. FICHA EM BRANCO, ATRIBUTOS E INTERMEDIÁRIO                 */
/* ============================================================ */
t("a ficha em branco nasce com a base do tipo",
  CINCO.map((x) => INV.createBlankInvocacao("quarto", x).atributos.forca), [8, 10, 8, 8, 8]);
t("o piso de atributo segue o tipo",
  CINCO.map((x) => INV.atributoMinInvocacao({ tipoMecanico: x })), [6, 8, 6, 6, 6]);
t("o resumo de atributos de uma Marionete em branco nao gasta ponto",
  resolvida("marionete").atributos.usados, 0);
t("o espaco de Intermediario conta Shikigami, Marionete e Corpo (a Maldicao saiu)",
  INV.espacosDeIntermediario(CINCO.map((x) => ({ tipoMecanico: x }))), 1.5);
t("o dispositivo segue ocupando meio espaco, como o Shikigami",
  INV.espacosDeIntermediario([{ tipoMecanico: "dispositivo" }]), 0.5);

/* ============================================================ */
/* 6. NÚMEROS DE ANTES: Shikigami, Técnica e o antigo Dispositivo */
/* ============================================================ */
/* Tirados do código ANTERIOR à etapa (git archive HEAD), com CON 14, DES 14 e o
   resto em branco: [PV, Defesa, Custo, Orçamento, Acerto Corpo, CD]. */
const ANTES = {
  "shikigami|quarto|1": [18, 14, 2, 3, 4, 13], "shikigami|quarto|9": [26, 16, 2, 3, 10, 16],
  "shikigami|terceiro|1": [33, 16, 4, 4, 4, 13], "shikigami|terceiro|9": [41, 18, 4, 4, 10, 16],
  "shikigami|segundo|1": [55, 20, 6, 6, 4, 13], "shikigami|segundo|9": [63, 22, 6, 6, 10, 16],
  "shikigami|primeiro|1": [75, 24, 8, 7, 4, 13], "shikigami|primeiro|9": [87, 26, 8, 7, 10, 16],
  "shikigami|especial|1": [96, 28, 12, 9, 4, 13], "shikigami|especial|9": [112, 30, 12, 9, 10, 16],
  "tecnica|quarto|1": [28, 14, 2, 3, 5, 13], "tecnica|quarto|9": [36, 16, 2, 3, 11, 16],
  "tecnica|terceiro|1": [48, 16, 4, 4, 6, 13], "tecnica|terceiro|9": [56, 18, 4, 4, 12, 16],
  "tecnica|segundo|1": [75, 20, 6, 6, 7, 13], "tecnica|segundo|9": [83, 22, 6, 6, 13, 16],
  "tecnica|primeiro|1": [100, 24, 8, 7, 8, 13], "tecnica|primeiro|9": [112, 26, 8, 7, 14, 16],
  "tecnica|especial|1": [126, 28, 12, 9, 9, 13], "tecnica|especial|9": [142, 30, 12, 9, 15, 16],
};
for (const [chave, esperado] of Object.entries(ANTES)) {
  const [tipo, grau, nd] = chave.split("|");
  for (const tipoLido of tipo === "shikigami" ? ["shikigami", "dispositivo"] : [tipo]) {
    const inv = INV.createBlankInvocacao(grau, tipo);
    inv.id = "x"; inv.tipoMecanico = tipoLido;
    inv.atributos.constituicao = 14; inv.atributos.destreza = 14;
    const n = Number(nd);
    const r = INV.resolveInvocacao(inv, { nd: n, bt: n >= 9 ? 4 : 2, nivelControlador: n });
    t(`${tipoLido} ${grau} ND ${nd} igual ao de antes`,
      [r.pv, r.defesa, r.custo, r.orcamento.total, r.testes.acerto.corpo.bonus, r.testes.cd], esperado);
  }
}

/* ============================================================ */
/* 7. PELA FICHA INTEIRA (deriveAfty)                            */
/* ============================================================ */
const c = createBlankAfty();
c.invocacoes = CINCO.map((x, i) => ({ ...INV.createBlankInvocacao("quarto", x), id: `i${i}`, nome: x }));
const d = deriveAfty(c);
t("o derive resolve os cinco tipos", d.invocacoes.lista.map((r) => r.tipoMecanico), CINCO);
t("e conta o espaco de Intermediario pelas regras", d.invocacoes.espacosIntermediarios, 1.5);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
