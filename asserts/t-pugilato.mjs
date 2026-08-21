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
