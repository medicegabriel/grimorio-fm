/* QUEM ENXERGA AS PRIMITIVAS DE ADDON.
   Nasceu de um bug de verdade: o card "Concedido pelo Mestre" apareceu na tela
   de jogo de todo mundo, com zero addons instalados, e o `contar()` e o
   `hpAtributo` tinham vazado do mesmo jeito nos seletores. O autor viu no deploy
   em 2026-08-20 e apontou. Estes asserts existem para isso não voltar calado. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const { vocabularioDsl, DSL_FUNCOES } = await import(R + "afty-dsl-vocabulario.js");
const { EFEITO_CANAL_GRUPOS } = await import(R + "afty-efeitos.js");
const { AFTY_HABILIDADES } = await import(R + "afty-habilidades.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. A TABELA E O CAMPO `permite`                               */
/* ============================================================ */

/* ⚠ A LISTA É FECHADA de propósito: primitiva nova cai aqui e obriga quem a
   acrescentou a dizer que enxerga o quê. A `catarse` entrou em 2026-09-04, com
   a Loja de Catarse. */
t("sao 5 primitivas", AD.PRIMITIVAS.length, 5);
t("ids esperados", AD.PRIMITIVAS.map((p) => p.id).sort(), ["adaptacao", "catarse", "concessao", "contar", "hpAtributo"]);
t("toda primitiva tem rotulo", AD.PRIMITIVAS.every((p) => !!p.rotulo), true);
t("SEM_PRIMITIVAS e vazio", AD.SEM_PRIMITIVAS, []);

const base = { id: "p", nome: "P", acrescenta: { habilidades: [] } };
t("pacote sem permite vira lista vazia", AD.normalizarPacote(base).permite, []);
t("permite lixo vira vazio", AD.normalizarPacote({ ...base, permite: "concessao" }).permite, []);
t("permite passa o que e string",
  AD.normalizarPacote({ ...base, permite: ["concessao", 3, null] }).permite, ["concessao"]);
t("permite nao repete",
  AD.normalizarPacote({ ...base, permite: ["contar", "contar"] }).permite, ["contar"]);

/* O validador reprova id desconhecido: erro de digitação no pacote não pode
   virar primitiva que simplesmente não liga, sem ninguém dizer por quê. */
const comHab = {
  id: "teste-prim",
  nome: "Teste",
  acrescenta: {
    habilidades: [{
      id: "x", nome: "X", descricao: "d", especializacaoId: "lutador", tipo: "passiva", nivel: 1,
    }],
  },
};
t("permite valido nao gera problema",
  AD.validarPacote({ ...comHab, permite: ["concessao"] }).length, 0);
const probs = AD.validarPacote({ ...comHab, permite: ["concesao"] });
t("permite com erro de digitacao e REPROVADO", probs.length, 1);
t("e a mensagem diz o que existe", probs[0].includes("concessao"), true);

/* ============================================================ */
/* 2. `primitivasDaCriatura`                                     */
/* ============================================================ */

const crua = createBlankAfty();
crua.core.nd = 20;
crua.core.tipo = "combatente";
t("criatura sem addon nao ve nada", AD.primitivasDaCriatura(crua), []);
t("criatura nula nao quebra", AD.primitivasDaCriatura(null), []);
t("addon sem permite nao ve nada",
  AD.primitivasDaCriatura({ addons: [{ id: "a" }] }), []);
t("addon com permite ve",
  AD.primitivasDaCriatura({ addons: [{ id: "a", permite: ["concessao"] }] }), ["concessao"]);
t("dois addons somam",
  AD.primitivasDaCriatura({
    addons: [{ permite: ["concessao"] }, { permite: ["contar"] }],
  }).sort(), ["concessao", "contar"]);
t("o mesmo em dois addons nao duplica",
  AD.primitivasDaCriatura({ addons: [{ permite: ["contar"] }, { permite: ["contar"] }] }), ["contar"]);
t("id inventado no permite e ignorado",
  AD.primitivasDaCriatura({ addons: [{ permite: ["voar"] }] }), []);

/* ============================================================ */
/* 3. O DERIVADO CARREGA A LISTA                                 */
/* ============================================================ */

t("derived de criatura raw", deriveAfty(crua).primitivas, []);
const comPerm = { ...crua, addons: [{ id: "a", nome: "A", permite: ["concessao", "contar"] }] };
t("derived de criatura com addon", deriveAfty(comPerm).primitivas.sort(), ["concessao", "contar"]);

/* ⚠ A PRIMITIVA NÃO MUDA NÚMERO NENHUM. Ela é só quem enxerga a tela: o motor
   tem o verbo com ou sem ela, e um addon que "permite" sem acrescentar nada não
   pode alterar a ficha. */
const d1 = deriveAfty(crua);
const d2 = deriveAfty(comPerm);
for (const k of ["hp", "pe", "defesa", "cd", "rdGeral", "movimento", "iniciativa"]) {
  t(`permitir nao mexe em ${k}`, d2[k], d1[k]);
}

/* E a concessão CONTINUA valendo mesmo sem a primitiva permitida: o portão é de
   TELA, e nunca de motor. Uma sessão gravada não pode perder efeito porque o
   addon mudou de opinião sobre mostrar o botão. */
const hab = AFTY_HABILIDADES.find((h) => h.especializacaoId);
t("concessao vale sem a primitiva permitida",
  deriveAfty(crua, { concedido: [{ familia: "habilidades", id: hab.id }] })
    .habilidades.escolhidas.includes(hab.id), true);

/* ============================================================ */
/* 4. O GRUPO MARCAS SÓ APARECE PARA QUEM PEDIU                  */
/* ============================================================ */
/* Este é o vazamento de verdade: as marcas automáticas saem da família e da
   especialização de cada entrada, então uma criatura RAW com uma habilidade de
   Lutador JÁ tinha `contar("lutador")` no seletor. */

const comHabilidade = createBlankAfty();
comHabilidade.core.nd = 20;
comHabilidade.core.tipo = "combatente";
comHabilidade.especializacoes = [{ id: "lutador", nivel: 5 }];
comHabilidade.habilidades = [AFTY_HABILIDADES.find((h) => h.especializacaoId === "lutador").id];
const ctx = deriveAfty(comHabilidade).contextoDsl;

const grupoMarcas = (opcoes) => vocabularioDsl(ctx, [], opcoes).find((g) => g.id === "marcas");

t("a criatura TEM marcas no contexto", Object.keys(ctx["#marcas"] ?? {}).length > 0, true);
t("sem a primitiva, o grupo Marcas NAO aparece", grupoMarcas({}), undefined);
t("sem opcoes nenhuma tambem nao", vocabularioDsl(ctx).find((g) => g.id === "marcas"), undefined);
t("com a primitiva, aparece", !!grupoMarcas({ contar: true }), true);
t("e traz as marcas de verdade", grupoMarcas({ contar: true }).itens.length > 0, true);
t("escritas como chamada pronta",
  grupoMarcas({ contar: true }).itens.every((i) => i.nome.startsWith('contar("')), true);

/* ⚠ O RESTO DO VOCABULÁRIO NÃO PODE TER MUDADO. O portão fecha um grupo, e não
   pode levar junto nenhuma das ~663 variáveis do raw. */
const semMarcas = vocabularioDsl(ctx, [], {});
const comMarcas = vocabularioDsl(ctx, [], { contar: true });
t("o portao tira EXATAMENTE um grupo", comMarcas.length - semMarcas.length, 1);
t("e os outros grupos sao os mesmos",
  semMarcas.map((g) => g.id), comMarcas.filter((g) => g.id !== "marcas").map((g) => g.id));
const conta = (gs) => gs.reduce((n, g) => n + g.itens.length, 0);
t("nenhuma variavel do raw sumiu",
  conta(semMarcas), conta(comMarcas) - comMarcas.find((g) => g.id === "marcas").itens.length);

/* ============================================================ */
/* 5. O `contar()` NA LISTA DE FUNÇÕES                           */
/* ============================================================ */
/* A tela amarra a função à presença do grupo Marcas, então basta garantir que a
   função existe para ser filtrada e que ela é a ÚNICA de addon. */

t("contar esta em DSL_FUNCOES", DSL_FUNCOES.some((f) => f.nome.startsWith("contar")), true);
t("e e a unica funcao de addon",
  DSL_FUNCOES.filter((f) => f.nome.startsWith("contar")).length, 1);

/* ============================================================ */
/* 6. O CANAL `hpAtributo`                                       */
/* ============================================================ */
/* A tela filtra por id, então o assert prende o id e o fato de ele estar num
   grupo do seletor. Se alguém renomear o canal, o filtro da tela vira letra
   morta em silêncio, e é isso que este bloco pega. */

const todosCanais = EFEITO_CANAL_GRUPOS.flatMap((g) => g.itens.map((c) => c.id));
t("hpAtributo esta no seletor", todosCanais.includes("hpAtributo"), true);
t("e aparece uma vez so", todosCanais.filter((c) => c === "hpAtributo").length, 1);
t("o id bate com o da tabela de primitivas",
  AD.PRIMITIVAS.some((p) => p.id === "hpAtributo"), true);

/* Simula o filtro das duas telas, para provar que ele tira um e só um. */
const filtrado = EFEITO_CANAL_GRUPOS
  .map((g) => ({ ...g, itens: g.itens.filter((c) => c.id !== "hpAtributo") }))
  .filter((g) => g.itens.length);
t("o filtro tira exatamente um canal",
  filtrado.reduce((n, g) => n + g.itens.length, 0), todosCanais.length - 1);
t("e nao esvazia nenhum grupo", filtrado.length, EFEITO_CANAL_GRUPOS.length);

/* ============================================================ */
/* 7. PONTA A PONTA: UM PACOTE QUE PEDE                          */
/* ============================================================ */

AD.limparAddons();
const PACOTE = {
  id: "mesa-do-afty",
  nome: "Mesa do Afty",
  versao: "1.0.0",
  permite: ["concessao", "contar", "hpAtributo"],
  acrescenta: {
    habilidades: [{
      id: "adaptacao",
      nome: "Ciclo de Adaptacao",
      descricao: "Habilidade de mesa.",
      especializacaoId: "lutador",
      tipo: "passiva",
      nivel: 1,
      tags: ["adaptacao"],
      efeitos: [{ canal: "rdGeral", expr: 'contar("adaptacao")' }],
    }],
  },
};
t("o pacote passa no validador", AD.validarPacote(PACOTE).length, 0);
AD.aplicarAddons([PACOTE]);

const daMesa = createBlankAfty();
daMesa.core.nd = 20;
daMesa.core.tipo = "combatente";
daMesa.addons = [PACOTE];
const dMesa = deriveAfty(daMesa);
t("a criatura da mesa ve as tres", dMesa.primitivas.sort(), ["concessao", "contar", "hpAtributo"]);

/* E a criatura RAW ao lado, no mesmo mundo, continua sem ver nada. É o caso do
   Encontro misto, e a razão de a lista sair da FICHA e não do mundo unido. */
const vizinha = createBlankAfty();
vizinha.core.nd = 20;
t("a vizinha raw, no MESMO mundo, nao ve nada", deriveAfty(vizinha).primitivas, []);

AD.limparAddons();
t("mundo limpo no fim", AD.addonsAtivos().length, 0);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
