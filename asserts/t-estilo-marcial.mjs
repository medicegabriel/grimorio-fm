/* ESTILO MARCIAL: a liberacao `feiticosRestritos`, e o addon do autor que a usa.

   Pedido do autor em 2026-09-07: "Addon para liberar a aba de Feiticos para
   Restringido, porem somente Passivas e Personalizado".

   ⚠ E A PRIMEIRA LIBERACAO QUE ABRE E ESTREITA AO MESMO TEMPO. As quatro
   anteriores so abriam (o Estilo fora do Sem Tecnica, o Sem Tecnica em
   Verdadeiras Origens, a qualificacao e a Maldicao). Esta monta um card que a
   origem nao tinha e, no mesmo movimento, corta quatro dos seis tipos de
   Feitico. Por isso o bloco 3 mede as duas metades separadas: quem enxerga o
   card e o que os chips oferecem sao perguntas diferentes. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
import { readFileSync } from "node:fs";

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { createBlankFeitico } = await import(R + "afty-feiticos.js");
const AD = await import(R + "afty-addons.js");
const FE = await import(R + "afty-feiticos.js");

const PACOTE = JSON.parse(
  readFileSync(new URL("../addons/estilo-marcial.json", import.meta.url), "utf8"),
);

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. O PACOTE                                                   */
/* ============================================================ */

t("o pacote do autor passa", AD.validarPacote(PACOTE), []);
t("ele e SO-liberacao", Object.keys(PACOTE).includes("acrescenta"), false);
t("e a liberacao e uma so", PACOTE.libera, ["feiticosRestritos"]);

/* ⚠ A LIBERACAO PRECISA ESTAR REGISTRADA, senao o pacote instala e nao faz
   nada. Sao 11 desde 2026-09-08, quando as duas da Carteira da Guilda
   (`carteiraFocos` e `carteiraNivel`) entraram depois desta. */
t("existem 11 liberacoes hoje", AD.LIBERACOES.length, 11);
t("feiticosRestritos esta registrada",
  AD.LIBERACOES.some((l) => l.id === "feiticosRestritos"), true);
t("id inventado parecido e REPROVADO",
  AD.validarPacote({ id: "pp", nome: "P", libera: ["feiticosRestrito"] }).length, 1);

/* ============================================================ */
/* 2. `liberacoesDaCriatura`                                     */
/* ============================================================ */

t("criatura sem addon nao libera", AD.liberacoesDaCriatura(createBlankAfty()), []);
t("com o addon libera",
  AD.liberacoesDaCriatura({ addons: [PACOTE] }), ["feiticosRestritos"]);

/* ============================================================ */
/* 3. O PORTAO EM SI: QUEM ENXERGA, E O QUE ELE PODE CRIAR       */
/* ============================================================ */

/* 3a. Quem CONJURA por conta propria. */
t("Herdado conjura", FE.origemConjura("herdado"), true);
t("Restringido nao conjura", FE.origemConjura("restringido"), false);
t("Sem Tecnica nao conjura", FE.origemConjura("sem_tecnica"), false);
t("origem nula nao quebra e conjura", FE.origemConjura(null), true);

/* 3b. Os TIPOS. */
t("quem conjura tem os seis",
  FE.tiposFeiticoPermitidos("herdado"),
  ["dano", "auxiliar", "curativo", "especial", "passivo", "personalizado"]);
t("Restringido sem addon nao tem nenhum", FE.tiposFeiticoPermitidos("restringido"), []);
t("Restringido COM addon tem dois",
  FE.tiposFeiticoPermitidos("restringido", true), ["passivo", "personalizado"]);
t("Sem Tecnica COM addon tem os mesmos dois",
  FE.tiposFeiticoPermitidos("sem_tecnica", true), ["passivo", "personalizado"]);

/* ⚠ A LIBERACAO NAO ALARGA QUEM JA TINHA. Um Herdado com o addon instalado
   continua com os seis: ela abre porta fechada, e nao estreita porta aberta. */
t("liberar nao tira tipo de quem conjura",
  FE.tiposFeiticoPermitidos("herdado", true),
  ["dano", "auxiliar", "curativo", "especial", "passivo", "personalizado"]);

/* ⚠ OS QUATRO QUE FICAM DE FORA sao nomeados, e nao "o resto": se um tipo novo
   nascer no vocabulario, este assert obriga a decidir de que lado ele fica. */
t("dano fora", FE.TIPOS_FEITICO_LIBERADOS.includes("dano"), false);
t("auxiliar fora", FE.TIPOS_FEITICO_LIBERADOS.includes("auxiliar"), false);
t("curativo fora", FE.TIPOS_FEITICO_LIBERADOS.includes("curativo"), false);
t("especial fora", FE.TIPOS_FEITICO_LIBERADOS.includes("especial"), false);

/* 3c. Quem enxerga o CARD. */
t("quem conjura ve", FE.mostraCardFeiticos("herdado"), true);
t("Restringido sem nada nao ve", FE.mostraCardFeiticos("restringido"), false);
t("Restringido liberado ve", FE.mostraCardFeiticos("restringido", { liberado: true }), true);

/* ⚠ A TERCEIRA PORTA: ficha que JA TEM Feitico gravado ve o card mesmo sem
   acesso nenhum. Sem ela, desinstalar o addon (ou trocar de origem) deixaria a
   linha morta presa na ficha, gastando o contador de habilidades e sem tela
   para remover. E a mesma porta do `filtraForaDoJogador`. */
t("Restringido COM feitico gravado ve, mesmo sem addon",
  FE.mostraCardFeiticos("restringido", { temFeiticos: true }), true);
t("e sem feitico nenhum nao ve",
  FE.mostraCardFeiticos("restringido", { liberado: false, temFeiticos: false }), false);

/* 3d. Os CHIPS de uma linha concreta. */
t("chips da linha permitida sao os dois",
  FE.tiposFeiticoDaLinha(["passivo", "personalizado"], "passivo"), ["passivo", "personalizado"]);
/* ⚠ O tipo que a linha JA TEM entra mesmo proibido, senao o chip aceso sumiria
   e o editor mostraria um Dano sem nada dizendo que ele e um. */
t("o tipo gravado entra mesmo proibido",
  FE.tiposFeiticoDaLinha(["passivo", "personalizado"], "dano"), ["dano", "passivo", "personalizado"]);
t("e a ordem e sempre a do vocabulario",
  FE.tiposFeiticoDaLinha(["personalizado", "passivo"], "curativo"),
  ["curativo", "passivo", "personalizado"]);
/* ⚠ LISTA VAZIA E RESPOSTA, e nao falta de dado: a ficha que entrou pela
   terceira porta ve SO o tipo que ela gravou, e nao os seis. O card dela existe
   para ler e remover, e o botao de criar some. Cair no "todos" aqui daria
   Feitico de graca a quem nao tem acesso nenhum. */
t("sem tipo permitido, so o gravado aparece",
  FE.tiposFeiticoDaLinha([], "dano"), ["dano"]);

/* ============================================================ */
/* 4. PONTA A PONTA, PELO deriveAfty                             */
/* ============================================================ */

const criatura = (addons, { nd = 12, origem = "restringido", feiticos = [] } = {}) => {
  const c = createBlankAfty();
  c.core.nd = nd;
  c.core.tipo = "combatente";
  c.core.origem = { id: origem };
  c.especializacoes = [{ id: "restringido", nivel: nd }];
  c.feiticos = feiticos;
  c.addons = addons;
  return c;
};

AD.limparAddons();
AD.aplicarAddons([PACOTE]);

const semAddon = deriveAfty(criatura([]));
const comAddon = deriveAfty(criatura([PACOTE]));

t("sem o addon o card NAO e montado", semAddon.feiticos.mostraCard, false);
t("e nao ha tipo nenhum", semAddon.feiticos.tiposPermitidos, []);
t("com o addon o card E montado", comAddon.feiticos.mostraCard, true);
t("e os tipos sao os dois", comAddon.feiticos.tiposPermitidos, ["passivo", "personalizado"]);
t("o derivado reporta a liberacao", comAddon.liberacoes, ["feiticosRestritos"]);
t("criatura raw nao reporta nada", semAddon.liberacoes, []);

/* O Conjurador comum continua exatamente como estava, com e sem o addon no
   mundo: e o que prova que a liberacao nao vazou para quem nao a carrega. */
const herdado = deriveAfty(criatura([], { origem: "herdado" }));
t("Herdado sem addon ve o card", herdado.feiticos.mostraCard, true);
t("e continua com os seis tipos", herdado.feiticos.tiposPermitidos.length, 6);

/* ⚠ ABRIR A ABA NAO DA VAGA DE GRACA. O Feitico do Restringido gasta o mesmo
   contador unico de habilidades que o resto da aba, e o addon nao encosta nele. */
t("o contador nao muda com o addon",
  comAddon.orcamentoHabilidades.total, semAddon.orcamentoHabilidades.total);

/* ⚠ E NAO MUDA STAT NENHUM. A liberacao muda REGRA (o que a criatura PODE ter),
   e nao numero: o PV, a Defesa e o PE de um Restringido sao os mesmos dos dois
   lados enquanto ele nao criar Feitico. */
t("PV igual", comAddon.pv, semAddon.pv);
t("Defesa igual", comAddon.defesa, semAddon.defesa);
t("PE igual", comAddon.pe, semAddon.pe);

/* ⚠ A TERCEIRA PORTA, MEDIDA PELO deriveAfty. Um Restringido com Feitico
   gravado e o addon FORA continua vendo o card, para poder remover a linha. */
const gravado = { ...createBlankFeitico(), tipo: "passivo", nome: "Corpo Marcial" };
t("feitico gravado sem addon ainda mostra o card",
  deriveAfty(criatura([], { feiticos: [gravado] })).feiticos.mostraCard, true);
t("mas os tipos continuam fechados",
  deriveAfty(criatura([], { feiticos: [gravado] })).feiticos.tiposPermitidos, []);
/* E ele CONTA no contador, com ou sem addon: e por isso que a tela para remover
   precisa existir. */
t("e ele gasta o contador mesmo assim",
  deriveAfty(criatura([], { feiticos: [gravado] })).feiticos.gastos, 1);

/* ============================================================ */
/* 5. OS DOIS TIPOS FUNCIONAM DE VERDADE                         */
/* ============================================================ */
/* ⚠ ABRIR A ABA NAO E A TAREFA INTEIRA, e e a licao que o card de Concessao
   deixou: falta sempre provar que o que a tela abriu CHEGA na ficha. */

/* O PASSIVO escreve no Motor, e o numero muda. */
const passivo = {
  ...createBlankFeitico(),
  tipo: "passivo",
  nome: "Corpo Marcial",
  efeitosPassivo: [{ canal: "rdGeral", expr: "3" }],
};
const comPassivo = deriveAfty(criatura([PACOTE], { feiticos: [passivo] }));
t("o Passivo do Restringido soma RD", comPassivo.rdGeral, comAddon.rdGeral + 3);
t("e ele gasta uma vaga do contador unico",
  comPassivo.orcamentoHabilidades.gastosNoComum,
  comAddon.orcamentoHabilidades.gastosNoComum + 1);

/* O PERSONALIZADO usa o custo padrao do Nivel de Feitico. */
const proprio = { ...createBlankFeitico(), tipo: "personalizado", nome: "Golpe Escrito", nivel: 2 };
const comProprio = deriveAfty(criatura([PACOTE], { feiticos: [proprio] }));
t("o Personalizado entra na lista", comProprio.feiticos.lista.length, 1);
t("e cobra o custo padrao do nivel", comProprio.feiticos.lista[0].custoPE, 5);

AD.limparAddons();
t("mundo limpo no fim", AD.addonsAtivos().length, 0);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
