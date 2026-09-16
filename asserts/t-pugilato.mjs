/* O grupo PUGILATO e o Ataque Básico.
   Faixas, Manoplas e Soco Inglês não viram linha de ataque: elas SÃO o Ataque
   Básico. Este arquivo prende as regras dessa passagem, mais os quatro
   consertos de 2026-08-20 (efeito de item chegando, hover repartido, Fineza do
   item, e o item que define o golpe ser UM só). */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { ARMAS } = await import(R + "afty-equipamentos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* Força 8 e Destreza 18: o suficiente para a Fineza mudar o número, e não só o
   rótulo. Sem ela o dano usa Força, com ela usa Destreza. */
const cria = (itens = [], habilidades = []) => {
  const c = createBlankAfty();
  c.core.nd = 10;
  c.core.tipo = "combatente";
  c.core.patamar = "comum";
  c.especializacoes = [{ id: "lutador", nivel: 10 }];
  c.habilidades = habilidades;
  c.attrMethod = "fixos";
  c.attributes = {
    forca: 8, destreza: 18, constituicao: 10,
    inteligencia: 10, sabedoria: 10, presenca: 10,
  };
  c.equipamentos = { itens };
  return c;
};
let seq = 0;
const it = (refId, ferramenta = null, extra = {}) => {
  seq += 1;
  return {
    uid: `eq${seq}`, tipo: "arma", refId, qtd: 1, equipado: true,
    ...(ferramenta ? { fa: ferramenta } : {}), ...extra,
  };
};
const fa = (grau, encantamentos = []) => ({ grau, encantamentos });
const linhas = (c) => deriveAfty(c).dano.entradas;
const basico = (c) => linhas(c).find((e) => e.id === "basico");
const nu = basico(cria());

/* ============================================================ */
/* 1. O CATÁLOGO                                                 */
/* ============================================================ */

t("tres armas de pugilato",
  ARMAS.filter((a) => a.grupo === "pugilato").map((a) => a.id),
  ["arm_faixas", "arm_manoplas", "arm_soco_ingles"]);
t("Faixas usam o dano desarmado",
  ARMAS.find((a) => a.id === "arm_faixas")?.dano, { desarmado: true });
t("e nao tem margem de critico propria",
  ARMAS.find((a) => a.id === "arm_faixas")?.critico, null);

/* ============================================================ */
/* 2. NÃO VIRA LINHA, E SÓ CONTA EQUIPADA E COM FERRAMENTA       */
/* ============================================================ */

t("sem item nenhum ha uma linha so", linhas(cria()).map((e) => e.id), ["basico"]);
t("Faixas nao acrescentam linha",
  linhas(cria([it("arm_faixas", fa("primeiro"))])).map((e) => e.id), ["basico"]);
t("arma de verdade acrescenta",
  linhas(cria([it("arm_espada_curta")])).map((e) => e.id), ["basico", "arm_espada_curta"]);

const semFerramenta = basico(cria([it("arm_faixas")]));
t("Faixas sem Ferramenta nao mudam o dano", semFerramenta.total, nu.total);
t("nem o acerto", semFerramenta.acerto, nu.acerto);

const naMochila = basico(cria([it("arm_faixas", fa("primeiro"), { equipado: false })]));
t("Faixas guardadas nao valem dano", naMochila.total, nu.total);
t("nem acerto", naMochila.acerto, nu.acerto);

/* ============================================================ */
/* 3. O GRAU É A RÉGUA                                           */
/* ============================================================ */

/* Acerto +1 por degrau, dano pela DANO_ADICIONAL_ARMA (4, 8, 12, 16, 20). */
const degrau = (grau) => {
  const b = basico(cria([it("arm_faixas", fa(grau))]));
  return [b.acerto - nu.acerto, b.total - nu.total];
};
t("Quarto Grau", degrau("quarto"), [1, 4]);
t("Terceiro Grau", degrau("terceiro"), [2, 8]);
t("Segundo Grau", degrau("segundo"), [3, 12]);
t("Primeiro Grau", degrau("primeiro"), [4, 16]);
t("Grau Especial", degrau("especial"), [5, 20]);

/* Duas de pugilato equipadas: vale a MAIOR, e não a soma. */
const duas = basico(cria([
  it("arm_faixas", fa("quarto")),
  it("arm_manoplas", fa("primeiro")),
]));
t("duas de pugilato: vale a maior", [duas.acerto - nu.acerto, duas.total - nu.total], [4, 16]);
t("e o grau e o da maior", duas.grauArma, "primeiro");

/* Item sem Ferramenta entra na disputa com rank 0 e perde de quem tem grau. */
t("item sem Ferramenta nao rouba o lugar",
  basico(cria([it("arm_manoplas"), it("arm_faixas", fa("segundo"))])).grauArma, "segundo");

/* ============================================================ */
/* 4. EFEITO DE ENCANTAMENTO CHEGA NO GOLPE (conserto 1)         */
/* ============================================================ */

/* Potente ("mais um dado de dano") é `alvoItem`: o efeito é gravado com o alvo
   do ITEM, e até 2026-08-20 ninguém escutava esse alvo na linha básica. O
   encantamento desce um degrau, e é por isso que o dano fica em 12 e não 16
   enquanto o dado aparece. */
const potente = basico(cria([it("arm_faixas", fa("primeiro", ["enc_arma_potente"]))]));
t("Potente da o dado extra", potente.dados, nu.dados + 1);
t("e o grau desce um degrau", potente.total - nu.total, 12);
t("o grau de calculo virou Segundo", potente.grauArma, "segundo");

/* A arma comum continua igual: é a régua de que o conserto não inventou nada.
   ⚠ A comparação é a MESMA espada com e sem o encantamento. Contra o golpe
   básico não valeria: a Espada Curta tem Fineza e usa Destreza, então ela já
   começa com mais dados. */
const espadaDe = (encantamentos) => linhas(cria([it("arm_espada_curta", fa("primeiro", encantamentos))]))
  .find((e) => e.id === "arm_espada_curta");
t("a arma comum tambem ganha o dado",
  espadaDe(["enc_arma_potente"]).dados, espadaDe([]).dados + 1);
t("e o basico dela nao muda",
  basico(cria([it("arm_espada_curta", fa("primeiro", ["enc_arma_potente"]))])).total, nu.total);

/* Poderosa (+2 de dano) pede Cruel (+3) junto, então são DOIS encantamentos e
   dois degraus: o +16 do Primeiro vira +8, mais os 5 dos dois encantamentos. */
t("Poderosa soma no dano do golpe",
  basico(cria([it("arm_faixas", fa("primeiro", ["enc_arma_cruel", "enc_arma_poderosa"]))])).total
  - nu.total, 13);

/* ============================================================ */
/* 5. O HOVER REPARTE O ACERTO (conserto 2)                      */
/* ============================================================ */

const rotulo = (linha, label) => linha.partesAcerto.find((p) => p.label === label)?.valor ?? null;
const precisa = basico(cria([it("arm_faixas", fa("primeiro", ["enc_arma_precisa"]))]));
const soGrau = basico(cria([it("arm_faixas", fa("primeiro"))]));
t("Precisa soma 2 no acerto, e o grau desce 1", precisa.acerto - nu.acerto, 5);
t("o grau aparece sozinho", rotulo(precisa, "Grau da Ferramenta"), 3);
t("e o encantamento com o nome dele", rotulo(precisa, "Precisa"), 2);
t("sem encantamento nao ha linha de Precisa", rotulo(soGrau, "Precisa"), null);
t("e o grau leva o total", rotulo(soGrau, "Grau da Ferramenta"), 4);

/* ⚠ NO JOGADOR O GRAU NÃO DÁ ACERTO, MAS O PRECISA DÁ (autor, 2026-08-31: "Grau
   da Arma não fornece +Acerto ou +Dano para Jogador. Só fornece os Bônus de
   Encantamentos"). Até 2026-09-12 o zero levava o encantamento junto: o total
   ficava igual ao da arma sem Precisa, e o hover mostrava "Grau da Ferramenta
   −2" ao lado de "Precisa +2". O autor achou pelo hover. */
const doJogador = (itens) => {
  const c = cria(itens);
  c.rulesVersion = "player";
  return c;
};
for (const [nome, ref, pega] of [
  ["Faixas", "arm_faixas", basico],
  ["Espada Curta", "arm_espada_curta", (c) => linhas(c).find((e) => e.id !== "basico")],
]) {
  const semEnc = pega(doJogador([it(ref, fa("primeiro"))]));
  const comPrecisa = pega(doJogador([it(ref, fa("primeiro", ["enc_arma_precisa"]))]));
  t(`jogador, ${nome}: o Precisa soma 2 no Acerto`, comPrecisa.acerto - semEnc.acerto, 2);
  t(`jogador, ${nome}: e aparece com o nome dele`, rotulo(comPrecisa, "Precisa"), 2);
  t(`jogador, ${nome}: sem linha de grau, nem negativa`, rotulo(comPrecisa, "Grau da Ferramenta"), null);
  t(`jogador, ${nome}: sem encantamento, o grau não dá Acerto`, rotulo(semEnc, "Grau da Ferramenta"), null);
  t(`jogador, ${nome}: e as parcelas somam o total`,
    comPrecisa.partesAcerto.reduce((s, p) => s + (p.valor ?? 0), 0), comPrecisa.acerto);
}

/* ============================================================ */
/* 6. FINEZA DO ITEM (conserto 4)                                */
/* ============================================================ */

t("Faixas nao tem Fineza, o golpe usa Forca", soGrau.atributo, "forca");
t("Soco Ingles tem, e o golpe usa Destreza",
  basico(cria([it("arm_soco_ingles", fa("primeiro"))])).atributo, "destreza");
t("e o dano sobe junto",
  basico(cria([it("arm_soco_ingles", fa("primeiro"))])).total > soGrau.total, true);
t("Corpo Treinado continua abrindo a Fineza sem item",
  basico(cria([], ["lut_corpo_treinado"])).atributo, "destreza");

/* ⚠ UM item define o golpe: com as Faixas de grau maior no punho, a Fineza do
   Soco Inglês que veio junto não vale. */
t("a Fineza vem do item que definiu o golpe",
  basico(cria([it("arm_faixas", fa("primeiro")), it("arm_soco_ingles")])).atributo, "forca");

/* O crítico do item que define o golpe também deve chegar ao Ataque Básico.
   Destruidora é encantamento das Faixas, enquanto Fatal e Mortal são
   propriedades possíveis das armas de pugilato criadas pelo jogador. */
const destruidora = basico(doJogador([it("arm_faixas", fa("especial", ["enc_arma_destruidora"]))]));
t("Destruidora das Faixas cria dado apenas no critico",
  destruidora.gruposDano.filter((g) => g.nome === "Destruidora")
    .map((g) => [g.dados, g.faces, g.apenasCritico]),
  [[1, destruidora.gruposDano[0].faces, true]]);
/* O dado de crítico DOBRA no próprio crítico (autor, 2026-09-15): 1 dado vira 2.
   A fórmula soma as faces iguais num termo só, então o que se mede é a
   DIFERENÇA na contagem daquele dado, e não um termo `2dN` solto. */
const contaDoDado = (formula, faces) =>
  Number((new RegExp(`(\\d+)d${faces}(?!\\d)`).exec(formula) ?? [0, 0])[1]);
const semDestruidora = basico(doJogador([it("arm_faixas", fa("especial"))]));
t("Destruidora das Faixas soma dois dados na formula critica",
  contaDoDado(destruidora.formulaCritico, destruidora.gruposDano[0].faces)
  - contaDoDado(semDestruidora.formulaCritico, semDestruidora.gruposDano[0].faces), 2);
t("Faixas guardadas nao concedem Destruidora",
  basico(doJogador([it("arm_faixas", fa("especial", ["enc_arma_destruidora"]),
    { equipado: false })])).gruposDano.some((g) => g.nome === "Destruidora"), false);
const faixasDef = ARMAS.find((a) => a.id === "arm_faixas");
const propsFaixas = faixasDef.props;
try {
  // O editor de arma própria guarda o tamanho como 1dN.
  faixasDef.props = { ...propsFaixas, fatal: "1d12", mortal: "1d10" };
  const pugilistaInicial = doJogador([it("arm_faixas")]);
  pugilistaInicial.core.nd = 1;
  pugilistaInicial.especializacoes = [{ id: "lutador", nivel: 1 }];
  const criticoPugilato = basico(pugilistaInicial);
  t("Fatal da arma de pugilato troca o dado do basico no critico",
    criticoPugilato.gruposDano[0].facesCritico, 12);
  t("Mortal da arma de pugilato soma dado ao basico no critico",
    criticoPugilato.gruposDano.filter((g) => g.nome === "Mortal")
      .map((g) => [g.faces, g.apenasCritico]), [[10, true]]);
} finally {
  faixasDef.props = propsFaixas;
}

const rapieira = (c) => linhas(c).find((e) => e.id === "arm_rapieira");
const mortal = rapieira(doJogador([it("arm_rapieira")]));
t("Mortal acrescenta dado critico do tamanho listado",
  mortal.gruposDano.filter((g) => g.nome === "Mortal")
    .map((g) => [g.dados, g.faces, g.apenasCritico]), [[1, 10, true]]);
t("Mortal nao aparece na formula normal", mortal.formulaNormal.includes("1d10"), false);
t("Mortal aparece na formula critica, dobrado", mortal.formulaCritico.includes("2d10"), true);

const katana = (c) => linhas(c).find((e) => e.id === "arm_katana");
const fatal = katana(doJogador([it("arm_katana")]));
t("Fatal troca o dado principal no critico quando maior",
  fatal.gruposDano[0].facesCritico, 10);
const katanaDef = ARMAS.find((a) => a.id === "arm_katana");
const fatalOriginal = katanaDef.props.fatal;
try {
  katanaDef.props.fatal = "1d12";
  t("Fatal aceita tamanho 1dN da criacao de armas",
    katana(doJogador([it("arm_katana")])).gruposDano[0].facesCritico, 12);
  katanaDef.props.fatal = `1d${fatal.gruposDano[0].faces}`;
  const igual = katana(doJogador([it("arm_katana")]));
  t("Fatal nao soma dado quando igual ao dado da arma",
    igual.gruposDano.some((g) => g.nome === "Fatal"), false);
  katanaDef.props.fatal = "1d4";
  const menor = katana(doJogador([it("arm_katana")]));
  t("Fatal acrescenta dado listado quando arma passa do tamanho",
    menor.gruposDano.filter((g) => g.nome === "Fatal")
      .map((g) => [g.dados, g.faces, g.apenasCritico]), [[1, 4, true]]);
} finally {
  katanaDef.props.fatal = fatalOriginal;
}

/* ============================================================ */
/* 7. O QUE NÃO MUDOU                                            */
/* ============================================================ */

t("a margem de critico do basico e 20", soGrau.margemCritico, 20);
t("o basico rola sempre Corpo a Corpo",
  basico(cria([it("arm_faixas", fa("primeiro"), { ataqueId: "amaldicoado" })])).acertoAtaque,
  "Corpo a Corpo");
t("ficha suja nao derruba o derive",
  typeof deriveAfty({ equipamentos: { itens: "nao-e-lista" } }), "object");

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
