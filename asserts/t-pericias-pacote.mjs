/**
 * O PACOTE DA CLASSE CONCEDE, E O ORÇAMENTO MOSTRA AS FONTES — 2026-08-30
 *
 * Dois pedidos do autor no mesmo dia:
 *   1. o hover do contador de perícias abre as fontes do total,
 *   2. os TR e as perícias que a Especialização JÁ DECIDIU chegam concedidos.
 *
 * O que este arquivo prende é o par que sempre anda junto: a concessão só está
 * certa se o TOTAL cair na mesma medida, senão a ficha treina uma perícia a mais
 * de graça. E a soma das parcelas do hover tem de bater com o número, nas duas
 * fórmulas.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const E = await import(R + "afty-especializacoes.js");
const { totalPericias } = await import(R + "afty-pericias.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ATTRS = { forca: 12, destreza: 12, constituicao: 12, inteligencia: 16, sabedoria: 10, presenca: 10 };
const ficha = (sistema, classe, extra = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum" };
  f.attributes = { ...ATTRS };
  f.especializacoes = classe ? [{ id: classe, nivel: 10 }] : [];
  /* ⚠ A TRAVA TIPO ↔ ORIGEM É BIDIRECIONAL desde 2026-08-03: sem a Origem
     Restringido, a Especialização Restringido é RECUSADA e a ficha fica sem
     Classe nenhuma, o que faria estes asserts medirem uma ficha vazia. */
  if (classe === "restringido") f.core.origem = { id: "restringido" };
  if (sistema === "player") f.periciaAtributo = "inteligencia";
  return deriveAfty({ ...f, ...extra });
};

/* ============================================================ */
/* 1. O QUE A CLASSE JÁ DECIDIU CHEGA CONCEDIDO                  */
/* ============================================================ */

const restr = ficha("player", "restringido").testes;
const linha = (lista, id, chave = "id") => lista.find((x) => x[chave] === id);

/* ⚠ O RESTRINGIDO É O ÚNICO SEM ESCOLHA NENHUMA: o livro dá "Testes de
   Resistência de Fortitude e Reflexos" com "e", e "uma perícia de Ofício", que é
   uma lista de um caminho só. Os três chegam prontos. */
for (const tr of ["fortitude", "reflexos"]) {
  const r = linha(restr.resistencias, tr, "value");
  t(`o Restringido recebe ${tr} sem marcar`, [r.prof, r.profEscolhida, r.concedida], ["treinado", null, true]);
}
/* ⚠ MAS A PERÍCIA NÃO CHEGA MARCADA (autor, 2026-08-31): *"Não era para FORÇAR
   as perícias já que tem escolhas e coisa do gênero. Só colocar no contador como
   estava antes, porém com o número correto."*

   O pacote decide QUANTAS e o jogador decide QUAIS. Mesmo a parte que o livro
   nomeia tem escolha dentro: qual Ofício (Ferreiro, Farmacêutico) e qual faixa.
   O TR é o contrário, e por isso ele segue concedido: o livro escreve em caixa
   alta que ele "NÃO PODE SER ESCOLHIDO DE FORMA LIVRE". */
const oficio = linha(restr.pericias, "oficio");
t("mas o Ofício NAO chega marcado", [oficio.prof, oficio.profEscolhida, oficio.concedida], [null, null, false]);
t("e nenhuma pericia chega marcada", restr.pericias.every((p) => p.prof === null), true);

/* Os outros TR não vêm de graça. */
t("Vontade, Astúcia e Integridade seguem em branco",
  ["vontade", "astucia", "integridade"].map((id) => linha(restr.resistencias, id, "value").prof),
  [null, null, null]);

/* ⚠ ESCOLHA DE VERDADE CONTINUA EM ABERTO. O Lutador escolhe "um TR entre
   Fortitude ou Reflexos" e "uma perícia de Ofício, Atletismo ou Acrobacia": duas
   listas com mais de um caminho, e nenhuma delas é decidida pela Classe. */
const lut = ficha("player", "lutador").testes;
t("o Lutador nao recebe TR nenhum de graca",
  lut.resistencias.every((r) => r.prof === null), true);
t("nem pericia nenhuma", lut.pericias.every((p) => p.prof === null), true);

/* ⚠ E A CRIATURA NÃO TEM PACOTE. O mesmo Restringido no Grimório do Afty não
   recebe nada: `pacoteInicial` só existe no jogador. */
const restrAfty = ficha("afty", "restringido").testes;
t("a criatura Restringido nao recebe os TR",
  ["fortitude", "reflexos"].map((id) => linha(restrAfty.resistencias, id, "value").prof), [null, null]);
t("nem o Ofício", linha(restrAfty.pericias, "oficio").prof, null);

/* ============================================================ */
/* 2. O TOTAL CAI NA MESMA MEDIDA                                */
/* ============================================================ */

/* ⚠ O TOTAL É O QUE A CLASSE TREINA, e nada sai dele (revisto em 2026-08-31).
   Ele descontava a perícia concedida até então, e o Combatente mostrava 5 onde o
   livro dá 6. Com a concessão de perícia fora, não há mais o que descontar: o
   pacote só diz o NÚMERO. */
const pacoteRestr = E.pacoteInicialDaFicha([{ id: "restringido", nivel: 10 }]);
t("o pacote de pericia nao concede nada", pacoteRestr.periciasAutomaticas, undefined);
t("e os dois TR automaticos seguem", pacoteRestr.trAutomaticos, ["fortitude", "reflexos"]);
t("as vagas do Restringido sao as cinco do livro", E.vagasDoPacote(pacoteRestr), 5);
t("o total soma o atributo escolhido", restr.orcamento.total, 5 + 3);

const pacoteLut = E.pacoteInicialDaFicha([{ id: "lutador", nivel: 10 }]);
t("o Lutador nao concede TR nenhum", pacoteLut.trAutomaticos, []);
t("e as vagas dele sao as cinco do livro", E.vagasDoPacote(pacoteLut), 5);

/* Ponta a ponta: o Restringido treina CINCO perícias, e as cinco são dele para
   marcar. Uma delas tem de ser Ofício pela regra do livro, e a ficha não força
   isso: ela conta. */
const restrCheio = ficha("player", "restringido", {
  pericias: {
    oficio: "treinado", atletismo: "treinado", furtividade: "treinado",
    intuicao: "treinado", percepcao: "treinado",
  },
}).testes;
t("as cinco vagas fecham o orcamento",
  [restrCheio.orcamento.gastos, restrCheio.orcamento.total, restrCheio.orcamento.excedeu], [5, 8, false]);
t("e ele esta treinado em cinco pericias",
  restrCheio.pericias.filter((p) => p.prof).length, 5);
/* E a sexta estoura, que é o que impede a Classe de dar mais do que promete. */
const restrSeis = ficha("player", "restringido", {
  pericias: {
    oficio: "treinado", atletismo: "treinado", furtividade: "treinado",
    intuicao: "treinado", percepcao: "treinado", acrobacia: "treinado",
  },
  attributes: { forca: 12, destreza: 12, constituicao: 12, inteligencia: 10, sabedoria: 10, presenca: 10 },
}).testes;
t("a sexta estoura num Restringido sem modificador",
  [restrSeis.orcamento.gastos, restrSeis.orcamento.total, restrSeis.orcamento.excedeu], [6, 5, true]);

/* ⚠ E O TR CONCEDIDO NÃO GASTA NADA, no jogador nem no papel: o livro tira os
   Testes de Resistência do Limite de Perícias. */
t("os dois TR concedidos nao entram no gasto", restr.orcamento.gastos, 0);
t("e o gasto de TR calculado tambem fica em zero, porque nao foram MARCADOS",
  restr.orcamento.resistencias, 0);

/* ============================================================ */
/* 3. AS FONTES DO CONTADOR                                      */
/* ============================================================ */

const soma = (partes) => partes.reduce((acc, x) => acc + (Number(x.valor) || 0), 0);
const rotulos = (partes) => partes.map((x) => x.label);

/* ⚠ O TOTAL É A SOMA DAS PARCELAS, sempre. Número certo com detalhamento errado
   é bug, e é o caso que este assert existe para pegar. */
for (const [nome, o] of [
  ["Restringido jogador", restr.orcamento],
  ["Lutador jogador", lut.orcamento],
  ["Restringido criatura", restrAfty.orcamento],
  ["criatura sem Classe", ficha("afty", null).testes.orcamento],
]) {
  t(`${nome}: as parcelas somam o total`, soma(o.partes), o.total);
  t(`${nome}: nenhuma parcela sem nome`, o.partes.every((x) => !!x.label), true);
}

/* O jogador mostra o pacote pelo NOME da Classe e o atributo que entrou. */
t("o hover do jogador nomeia a Classe e o atributo",
  rotulos(restr.orcamento.partes), ["Restringido (Pacote)", "Inteligência"]);

/* ⚠ O ATRIBUTO É O MAIOR ENTRE INT E SAB, e não uma escolha (autor,
   2026-08-31: "a quantidade de perícias é o maior modificador de atributo
   entre Inteligência ou Sabedoria e não só Inteligência"). Esta ficha tem
   Inteligência 16 e Sabedoria 10, então a parcela é a Inteligência. */
const porSab = ficha("player", "restringido", { periciaAtributo: "sabedoria" }).testes.orcamento;
t("o campo parado NAO troca mais a parcela",
  rotulos(porSab.partes), ["Restringido (Pacote)", "Inteligência"]);
t("nem derruba o total", porSab.total, restr.orcamento.total);

/* E com a Sabedoria na frente é ela que entra, sem ninguem escolher nada. */
const sabMaior = ficha("player", "restringido", {
  attributes: { forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 18, presenca: 10 },
}).testes.orcamento;
t("a Sabedoria maior entra sozinha", rotulos(sabMaior.partes), ["Restringido (Pacote)", "Sabedoria"]);
t("e vale o modificador dela", soma(sabMaior.partes), sabMaior.total);

/* A criatura mostra as três parcelas da fórmula dela. */
t("o hover da criatura nomeia base, atributo e Grau",
  rotulos(restrAfty.orcamento.partes), ["Base", "Inteligência", "Grau do Feiticeiro"]);

/* ⚠ E AS DUAS FÓRMULAS ORIGINAIS CONTINUAM VALENDO. O total passou a sair das
   parcelas, então é aqui que se confere que ninguém mudou de valor no caminho. */
t("a criatura segue em 3 + maior mod + rank do Grau",
  restrAfty.orcamento.total, totalPericias({ modInt: 3, modSab: 0, grauRank: 3 }));
t("e o jogador em pacote + atributo escolhido",
  restr.orcamento.total, E.totalPericiasDoJogador(pacoteRestr, 3));

/* Uma fonte do Motor entra com o nome dela.
   ⚠ Com o Lutador, e não com o Restringido: `extra` sobrescreve o `core` inteiro,
   e a Origem que a trava bidirecional exige iria junto. */
const comCanal = ficha("player", "lutador", {
  core: { nd: 10, tipo: "misto", patamar: "comum", tecnicaEfeitos: [{ canal: "vagasPericia", expr: "2" }] },
}).testes.orcamento;
t("o canal vagasPericia vira parcela", comCanal.total, lut.orcamento.total + 2);
t("as parcelas seguem somando o total", soma(comCanal.partes), comCanal.total);
t("e a fonte nova tem nome proprio", comCanal.partes.length, lut.orcamento.partes.length + 1);
t("e nao e uma linha generica", comCanal.partes[comCanal.partes.length - 1].label !== "Outros", true);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
