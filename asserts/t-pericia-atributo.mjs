/**
 * O ATRIBUTO DE UMA PERÍCIA, TROCADO À MÃO — 2026-09-05
 *
 * ============================================================
 * POR QUE ISTO EXISTE
 * ============================================================
 * Pedido do autor: *"coloque a opção de mudar os Atributos da Perícia de forma
 * manual, muita gente precisa disso por N fontes diferentes como Treinos
 * Próprios e etc, que o sistema não comporta sem Addon e eu não vou fazer addon
 * pra todo mundo"*.
 *
 * ⚠ A FRASE DELE DESCREVE O ESTADO EXATO DO CÓDIGO. O gancho `atributosPericia`
 * existia desde antes, e os DOIS produtores dele (`trocaAtributoPericia` numa
 * característica de origem e num Treinamento) só têm entrada no **addon
 * Flugel**. No sistema cru, nada trocava o atributo de nada: a máquina estava
 * de pé e sem ninguém dentro.
 *
 * O caminho manual é o terceiro produtor, e o primeiro que não pede addon.
 *
 * ============================================================
 * A ORDEM, QUE É O QUE ESTE ARQUIVO PRENDE
 * ============================================================
 *   1. o catálogo do livro   2. origem   3. Treinamento   4. a troca MANUAL
 *
 * O manual vence os três porque é o único que alguém digitou. A seção 3 mede
 * isso contra o Flugel de verdade, e não contra um duble: se a ordem do spread
 * no `deriveAfty` for invertida algum dia, é aquele bloco que fica vermelho.
 */
import { readFileSync } from "node:fs";
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty, mesclaFichaAfty } = await import(R + "afty-schema.js");
const P = await import(R + "afty-pericias.js");
const A = await import(R + "afty-addons.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* Força 18 (+4) e Inteligência 16 (+3), para a troca MUDAR o número e não só o
   rótulo. Um teste em que os dois atributos empatam passaria com a troca
   desligada. */
const ficha = (sistema, manual, extra = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd: 12, tipo: "combatente", patamar: "comum" };
  c.attributes = { forca: 18, destreza: 12, constituicao: 14, inteligencia: 16, sabedoria: 8, presenca: 10 };
  c.especializacoes = [{ id: "combatente", nivel: 12 }];
  if (manual) c.periciaAtributoManual = manual;
  return { ...c, ...extra };
};
const feiticaria = (sistema, manual, extra) =>
  deriveAfty(ficha(sistema, manual, extra)).testes.pericias.find((p) => p.id === "feiticaria");

/* ============================================================ */
/* 1. O PADRÃO DO LIVRO, E A TROCA                               */
/* ============================================================ */

for (const sistema of ["afty", "player"]) {
  const padrao = feiticaria(sistema, null);
  t(`${sistema}: Feitiçaria nasce Inteligência`, padrao.atributo, "inteligencia");
  t(`${sistema}: e diz qual é o padrão dela`, padrao.atributoPadrao, "inteligencia");

  const trocada = feiticaria(sistema, { feiticaria: "forca" });
  t(`${sistema}: a troca manual vale`, trocada.atributo, "forca");
  /* ⚠ O PADRÃO NÃO MUDA COM A TROCA. É ele que a aba compara para saber se
     aquela linha fugiu do livro, e para saber que escolher o padrão de volta
     deve APAGAR a entrada em vez de gravá-la. */
  t(`${sistema}: e o padrão continua sendo o do livro`, trocada.atributoPadrao, "inteligencia");
  /* ⚠ E O NÚMERO ANDA JUNTO. Trocar o rótulo e deixar o bônus no atributo velho
     seria número certo com detalhamento errado, ao contrário. */
  t(`${sistema}: o bônus segue o atributo novo`, trocada.bonus - padrao.bonus, 1);
  t(`${sistema}: e o hover nomeia o atributo novo`, trocada.partes[0], { label: "Força", valor: 4 });
}

/* ============================================================ */
/* 2. O QUE A TROCA ARRASTA JUNTO                                */
/* ============================================================ */
/* O atributo de uma perícia não decide só o modificador. Ele decide também o
   ESCOPO `atr:` dos canais do Motor e a penalidade de armadura, que vale só em
   perícia de Destreza. As duas coisas seguem a troca de graça, porque leem a
   mesma variável, e este bloco existe para que continuem seguindo. */

const comEscudo = (manual) => ficha("afty", manual, {
  equipamentos: { itens: [{ uid: "e1", refId: "esc_pesado", tipo: "escudo", qtd: 1, equipado: true }] },
});
const acrobacia = (manual) =>
  deriveAfty(comEscudo(manual)).testes.pericias.find((p) => p.id === "acrobacia");

/* Acrobacia é Destreza, e o Escudo Pesado dá -4 em perícia de Destreza. */
t("com escudo, Acrobacia leva a penalidade",
  acrobacia(null).partes.some((x) => x.label === "Armadura e Escudo"), true);
/* ⚠ TIRAR A PERÍCIA DA DESTREZA TIRA A PENALIDADE, e isso é o que a regra
   escreve (*"testes de perícia que utilizam Destreza"*), não um efeito
   colateral. Fica medido para que a decisão seja consciente se alguém quiser o
   contrário. */
t("trocada para Força, a penalidade some",
  acrobacia({ acrobacia: "forca" }).partes.some((x) => x.label === "Armadura e Escudo"), false);

/* ============================================================ */
/* 3. A PRECEDÊNCIA, MEDIDA CONTRA O FLUGEL DE VERDADE           */
/* ============================================================ */
/* O Treino de Atributo Não Congênito, do pacote Flugel, é hoje o único
   Treinamento do repositório que troca o atributo de uma perícia. Ele é o
   vizinho de baixo do manual na ordem de precedência, então é contra ele que a
   ordem tem de ser medida. */

const FLUGEL = JSON.parse(readFileSync(new URL("../addons/flugel.json", import.meta.url), "utf8"));
t("o pacote Flugel continua válido", A.validarPacote(FLUGEL), []);
A.aplicarAddons([A.normalizarPacote(FLUGEL)]);

const TREINO = "flugel:treino_atributo_nao_congenito";
const comTreino = (manual) => {
  const base = ficha("afty", manual, {
    addons: [FLUGEL],
    treinamentos: { [TREINO]: 1 },
    treinamentoAlvos: { [TREINO]: { pericia: "feiticaria", atributo: "sabedoria" } },
  });
  return deriveAfty(base).testes.pericias.find((p) => p.id === "feiticaria");
};

t("o Treinamento sozinho troca para Sabedoria", comTreino(null).atributo, "sabedoria");
/* ⚠ O TESTE QUE IMPORTA. Com os dois na ficha, vence o manual. */
t("com os dois, o MANUAL vence", comTreino({ feiticaria: "forca" }).atributo, "forca");
t("e o número é o do manual", comTreino({ feiticaria: "forca" }).partes[0].label, "Força");
A.limparAddons();

/* ============================================================ */
/* 4. O SANEAMENTO                                               */
/* ============================================================ */

t("atributo que não existe é descartado",
  feiticaria("afty", { feiticaria: "banana" }).atributo, "inteligencia");
t("lista no lugar do objeto não derruba nada",
  feiticaria("afty", ["forca"]).atributo, "inteligencia");
t("string no lugar do objeto também não",
  feiticaria("afty", "forca").atributo, "inteligencia");

/* ⚠ ID DE PERÍCIA DESCONHECIDO PASSA, e é de propósito: perícia personalizada
   tem id gerado e um Addon pode trazer perícia nova. Guardar a escolha de uma
   linha que hoje não está na ficha é o que faz desligar e religar um Addon não
   apagar a escolha de ninguém. Mesma decisão do `periciaOficios`. */
t("id desconhecido sobrevive ao saneamento",
  P.atributosDePericiaManuais({ periciaAtributoManual: { pericia_de_addon: "forca" } }),
  { pericia_de_addon: "forca" });
t("mas o atributo dele ainda é conferido",
  P.atributosDePericiaManuais({ periciaAtributoManual: { pericia_de_addon: "xis" } }), {});
t("ficha sem o campo devolve mapa vazio", P.atributosDePericiaManuais({}), {});
t("ficha nula também", P.atributosDePericiaManuais(null), {});

/* O schema garante o objeto, para o derive nunca receber outra coisa. */
t("mescla põe o mapa mesmo sem o campo", mesclaFichaAfty({}).periciaAtributoManual, {});
t("mescla rejeita lista", mesclaFichaAfty({ periciaAtributoManual: ["x"] }).periciaAtributoManual, {});
t("e passa o objeto inteiro",
  mesclaFichaAfty({ periciaAtributoManual: { feiticaria: "forca" } }).periciaAtributoManual,
  { feiticaria: "forca" });

/* ============================================================ */
/* 5. PERÍCIA PERSONALIZADA                                      */
/* ============================================================ */
/* Ela não tem linha no livro, então o PADRÃO dela é o atributo gravado na
   própria definição. A troca manual funciona igual, e é por isso que o
   `<select>` que existia no modo de edição pôde sair: eram duas maneiras de
   escolher a mesma coisa. */

const CUSTOM = "custom_teste";
const comCustom = (manual) => deriveAfty(ficha("afty", manual, {
  periciasPersonalizadas: [{ id: CUSTOM, nome: "Cozinhar", atributo: "sabedoria" }],
  periciasOrdem: [CUSTOM],
})).testes.pericias.find((p) => p.id === CUSTOM);

t("a personalizada nasce com o atributo da definição", comCustom(null).atributo, "sabedoria");
t("e o padrão dela é esse mesmo", comCustom(null).atributoPadrao, "sabedoria");
t("a troca manual vale nela também", comCustom({ [CUSTOM]: "forca" }).atributo, "forca");
t("sem mexer no padrão", comCustom({ [CUSTOM]: "forca" }).atributoPadrao, "sabedoria");

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
