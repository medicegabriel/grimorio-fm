/* INTRÍNSECAS, AURAS E FORMAS (Etapa 6 da atualização de 2026-09-30).

   Fonte: *Adicionais para Invocações*. O que este arquivo garante:
   1. as 25 Intrínsecas e as 6 Auras estão no catálogo, com o texto;
   2. os requisitos travam o efeito e avisam (Montaria, Encantada, Líder de Horda,
      Forma de Armadura só na Marionete, Forma de Arma com o custo do grau e o dono
      treinado, o Traçado da Alma confirmado);
   3. o que vira número ou estado: voo e nado, Alcance Auxiliar, Laceração,
      Corrida Perfurante;
   4. a Aura: só do Segundo Grau em diante, só para o dono que a mesa pôs nela, só
      com a invocação em campo, e duas iguais não acumulam (nem entre invocações);
   5. a mesa: Bem Treinada em tarefa sai da contagem, a Forma não tira de campo, e o
      dano da Forma de Armadura se divide. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const INV = await import(R + "afty-invocacoes.js");
const CAT = await import(R + "afty-invocacoes-caracteristicas.js");
const SES = await import(R + "ficha/ficha-sessao.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const DONO = { nd: 9, bt: 4, nivelControlador: 9 };
const carac = (subtipo, extra = {}) => ({ ...INV.createBlankCaracteristica(), subtipo, nome: extra.nome ?? subtipo, ...extra });
const resolver = (grau, caracs, extraInv = {}, dono = DONO) => INV.resolveInvocacao(
  { ...INV.createBlankInvocacao(grau, extraInv.tipoMecanico ?? "shikigami"), id: "x", caracteristicas: caracs, ...extraInv }, dono,
);
const avisa = (r, trecho) => r.warnings.some((w) => w.includes(trecho));

/* ============================================================ */
/* 1. O CATÁLOGO                                                 */
/* ============================================================ */
const intrinsecas = CAT.CARACTERISTICAS_INVOCACAO.filter((c) => c.categoria === "intrinseca").map((c) => c.id);
t("as 25 Intrinsecas novas mais a Mudanca de Tamanho", intrinsecas.length, 26);
t("as Intrinsecas do Adicionais, na ordem da fonte", intrinsecas.filter((id) => id !== "tamanho"), [
  "inteligente", "bemTreinada", "invocacaoRapida", "polegaresOpositores", "alado", "nadador", "imparavel",
  "montaria", "escalador", "bolaDemolicao", "alcanceAuxiliar", "formaArma", "formaArmadura", "encantada",
  "liderHorda", "pincaPotente", "amorfo", "qualidade", "laceracaoConstante", "presencaIrritante",
  "bioluminescencia", "autotomia", "sentidoCegas", "tracadoAlma", "corridaPerfurante",
]);
t("as seis Auras", CAT.CARACTERISTICAS_INVOCACAO.filter((c) => c.categoria === "aura").map((c) => c.id),
  ["auraAcerto", "auraDefesa", "auraTR", "auraPericia", "auraRD", "auraDano"]);
t("toda entrada tem o texto da fonte", CAT.CARACTERISTICAS_INVOCACAO.every((c) => c.descricao), true);
t("o catalogo e o validador geral fecham", [CAT.validarCatalogoCaracteristicasInvocacao(), INV.validarCatalogoInvocacoes()], [[], []]);

/* ============================================================ */
/* 2. OS REQUISITOS                                              */
/* ============================================================ */
t("Montaria pede tamanho Medio: Pequeno trava",
  avisa(resolver("segundo", [carac("montaria"), carac("tamanho", { tamanho: "pequeno" })]), "Pede tamanho Médio ou maior"), true);
t("e Medio passa", avisa(resolver("segundo", [carac("montaria")]), "Pede tamanho"), false);
t("Encantada pede uma das Formas",
  [avisa(resolver("segundo", [carac("encantada")]), "Pede Forma de Arma ou Forma de Armadura"),
    avisa(resolver("segundo", [carac("encantada"), carac("formaArma", { parametros: { arma: "arm_adaga" } })]), "Pede Forma")],
  [true, false]);
t("Lider de Horda pede Inteligente",
  [avisa(resolver("segundo", [carac("liderHorda")]), "Pede Inteligente"),
    avisa(resolver("segundo", [carac("liderHorda"), carac("inteligente")]), "Pede Inteligente")], [true, false]);
t("Forma de Armadura so na Marionete",
  [avisa(resolver("segundo", [carac("formaArmadura", { parametros: { armadura: "Couraça" } })]), "Só em Marionete"),
    avisa(resolver("segundo", [carac("formaArmadura", { parametros: { armadura: "Couraça" } })], { tipoMecanico: "marionete" }), "Só em")],
  [true, false]);
const armaCara = INV.resolveInvocacao({ ...INV.createBlankInvocacao("quarto"), id: "q",
  caracteristicas: [carac("formaArma", { parametros: { arma: "arm_espada_grande" } })] }, DONO);
t("Forma de Arma: o custo da arma segue o grau (Quarto aceita ate 1)",
  [armaCara.caracteristicas[0].custoMaximo, avisa(armaCara, "e o grau aceita até 1")], [1, true]);
t("e o custo maximo por grau e 1, 2, 3, 4 e 4",
  ["quarto", "terceiro", "segundo", "primeiro", "especial"].map((g) => INV.CUSTO_DE_FORMA_POR_GRAU[g]), [1, 2, 3, 4, 4]);
const donoTreinado = { ...DONO, armasTreinadas: ["arm_adaga"] };
t("Forma de Arma pede o dono treinado na arma",
  [avisa(resolver("segundo", [carac("formaArma", { parametros: { arma: "arm_clava" } })], {}, donoTreinado), "O dono não é treinado em Clava"),
    avisa(resolver("segundo", [carac("formaArma", { parametros: { arma: "arm_adaga" } })], {}, donoTreinado), "não é treinado")],
  [true, false]);
/* Pela ficha inteira: a criatura em branco não tem treino de arma nenhum, e o
   derive entrega a lista ao dono (`armasTreinadas`). */
const semTreino = createBlankAfty();
semTreino.invocacoes = [{ ...INV.createBlankInvocacao("segundo"), id: "fa", caracteristicas: [carac("formaArma", { parametros: { arma: "arm_adaga" } })] }];
t("pela ficha inteira, o dono sem treino de arma trava a Forma de Arma",
  deriveAfty(semTreino).invocacoes.lista[0].warnings.some((w) => w.includes("O dono não é treinado em Adaga")), true);
t("Tracado da Alma pede a confirmacao do dono",
  [avisa(resolver("segundo", [carac("tracadoAlma")]), "Pede o requisito do dono confirmado"),
    avisa(resolver("segundo", [carac("tracadoAlma", { parametros: { donoVeAlma: true } })]), "Pede o requisito")], [true, false]);
t("requisito que falta trava o efeito",
  resolver("segundo", [carac("alado")]).efeitosIntrinsecos.voo === true
  && resolver("segundo", [carac("encantada")]).efeitosIntrinsecos.encantada === undefined, true);
t("duas iguais nao acumulam", avisa(resolver("segundo", [carac("alado"), carac("alado")]), "Duas Características de Alado"), true);

/* ============================================================ */
/* 3. O QUE VIRA NÚMERO                                          */
/* ============================================================ */
const voa = resolver("segundo", [carac("alado"), carac("nadador")]);
t("Alado e Nadador: voo e nado iguais a caminhada", voa.deslocamentos, { caminhada: 9, voo: 9, nado: 9 });
t("sem eles, so a caminhada", resolver("segundo", []).deslocamentos, { caminhada: 9 });
const auxDef = { ...INV.createBlankAcao(), familia: "auxilio", auxilioSub: "defesa", classe: "simples" };
const comAlcance = resolver("segundo", [carac("alcanceAuxiliar")], { acoes: [auxDef] });
const semAlcance = resolver("segundo", [], { acoes: [auxDef] });
t("Alcance Auxiliar tira a reducao (corpo a corpo) e usa a tabela do grau",
  [semAlcance.acoes[0].alcance, comAlcance.acoes[0].alcance], ["corpo a corpo", "15 m"]);
t("Laceracao: grau x 5, minimo 1",
  ["quarto", "especial"].map((g) => resolver(g, [carac("laceracaoConstante")]).caracteristicas[0].valor), [5, 25]);
t("Corrida Perfurante: o teto e o melhor modificador entre Forca e Destreza",
  resolver("segundo", [carac("corridaPerfurante")], { atributos: { forca: 16, destreza: 12, constituicao: 8, inteligencia: 8, sabedoria: 8, presenca: 8 } })
    .caracteristicas[0].valor, 3);

/* ============================================================ */
/* 4. A AURA                                                     */
/* ============================================================ */
t("Aura so do Segundo Grau em diante",
  [avisa(resolver("terceiro", [carac("auraDefesa")]), "Aura só a partir do Segundo Grau"),
    resolver("terceiro", [carac("auraDefesa")]).auras.length], [true, 0]);
t("a escala da Aura: +1, +2 e +3",
  ["segundo", "primeiro", "especial"].map((g) => resolver(g, [carac("auraDefesa")]).auras[0].valor), [1, 2, 3]);
t("Aura com alvo pede a escolha", avisa(resolver("segundo", [carac("auraTR")]), "Escolha o alvo desta Aura"), true);
t("a Aura nao vale na propria invocacao",
  resolver("segundo", [carac("auraDefesa")]).defesa, resolver("segundo", []).defesa);

/* Pela ficha inteira: o dono só recebe com a invocação em campo e a mesa dizendo
   que ele está na aura. */
const criatura = createBlankAfty();
criatura.invocacoes = [
  { ...INV.createBlankInvocacao("segundo"), id: "a", nome: "Lumen", caracteristicas: [
    carac("auraDefesa", { id: "cA", nome: "Halo" }),
    carac("auraTR", { id: "cT", nome: "Vigília", parametros: { tr: "vontade" } }),
  ] },
  { ...INV.createBlankInvocacao("especial"), id: "b", nome: "Sol", caracteristicas: [carac("auraDefesa", { id: "cB", nome: "Coroa" })] },
];
const base = deriveAfty(criatura);
const comSessao = (inv) => deriveAfty(criatura, { invocacoes: inv });
t("sem sessao, a Aura nao vale", base.defesa, comSessao({}).defesa);
t("em campo, mas sem a mesa ligar, nao vale",
  comSessao({ a: { estado: "ativa", emCampo: true } }).defesa, base.defesa);
t("fora de campo, com a mesa ligada, nao vale",
  comSessao({ a: { estado: "guardada", emCampo: false, auras: { cA: true } } }).defesa, base.defesa);
const umaAura = comSessao({ a: { estado: "ativa", emCampo: true, auras: { cA: true } } });
t("em campo e na aura, o dono ganha +1 de Defesa", umaAura.defesa - base.defesa, 1);
const duasAuras = comSessao({
  a: { estado: "ativa", emCampo: true, auras: { cA: true } },
  b: { estado: "ativa", emCampo: true, auras: { cB: true } },
});
t("duas Auras de Defesa de invocacoes diferentes nao acumulam: vale a maior (+3)", duasAuras.defesa - base.defesa, 3);
const auraTR = comSessao({ a: { estado: "ativa", emCampo: true, auras: { cT: true } } });
t("a Aura de TR cai no TR escolhido do dono",
  (auraTR.testes.resistencias.find((r) => (r.id ?? r.value) === "vontade")?.bonus ?? 0)
  - (base.testes.resistencias.find((r) => (r.id ?? r.value) === "vontade")?.bonus ?? 0), 1);
t("e a fonte do hover nomeia a invocacao e a Aura",
  JSON.stringify(umaAura).includes("Lumen · Halo"), true);

/* ============================================================ */
/* 5. A MESA: TAREFA, FORMA E O DANO DA ARMADURA                 */
/* ============================================================ */
const s0 = { invocacoes: { x: { estado: "ativa", emCampo: true } }, peAtual: 0, peTempFontes: {}, rodada: 0 };
t("em campo conta na vaga", SES.estadoDaInvocacao(s0, "x").contaNoCampo, true);
t("a Bem Treinada em tarefa sai da contagem",
  SES.estadoDaInvocacao(SES.defineEmTarefa(s0, "x", true), "x").contaNoCampo, false);
const comForma = SES.defineFormaInvocacao(s0, "x", "arma");
t("a Forma de Arma NAO tira de campo",
  [SES.estadoDaInvocacao(comForma, "x").forma, SES.estadoDaInvocacao(comForma, "x").estado, SES.estadoDaInvocacao(comForma, "x").contaNoCampo],
  ["arma", "ativa", true]);
t("so quem esta em campo muda de forma",
  SES.estadoDaInvocacao(SES.defineFormaInvocacao({ ...s0, invocacoes: { x: { estado: "guardada" } } }, "x", "arma"), "x").forma, null);
t("sair de campo desfaz a Forma e as Auras",
  (({ forma, auras }) => [forma, auras])(SES.estadoDaInvocacao(SES.saiDeCampo(SES.alternaAuraInvocacao(comForma, "x", "c1", true), "x"), "x")),
  [null, {}]);
t("Forma de Armadura: a armadura leva a metade, e o dono o resto",
  SES.divideDanoComArmadura(15, false), { dono: 8, armadura: 7 });
t("no critico, os dois levam o dano inteiro", SES.divideDanoComArmadura(15, true), { dono: 15, armadura: 15 });
const resolvidaForma = INV.resolveInvocacao(
  { ...INV.createBlankInvocacao("segundo"), id: "f", caracteristicas: [carac("formaArma", { parametros: { arma: "arm_adaga" } })] },
  { ...DONO, sessaoInvocacoes: { f: { estado: "ativa", emCampo: true, forma: "arma" } } },
);
t("o resolvido diz a Forma ligada", resolvidaForma.forma, "arma");

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
