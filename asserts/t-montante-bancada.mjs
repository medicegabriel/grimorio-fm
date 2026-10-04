/* O MONTANTE NÃO TEM BANCADA (2026-10-03).

   Livro, Anatomia do Feto Amaldiçoado: "Você adiciona o seu bônus de
   treinamento na sua Iniciativa; enquanto em uma cena de combate, você também
   adiciona seu bônus de treinamento na sua Atenção."

   O efeito de origem roda no MONTANTE do `deriveAfty`, com o contexto reduzido,
   antes de a Simulação de Combate existir. Ali `em_combate` vale zero, e a linha
   `{ canal: "atencao", quando: "em_combate" }` caía calada com "Em Combate"
   ligado ou não. Medido em 2026-09-29 num Feto de ND 5: a Iniciativa ganhava o
   +3 e a Atenção ficava igual.

   Decisões do autor: vale para os dois sistemas, e para o montante INTEIRO (não
   só origem, clã e Anatomia): o que lê a bancada no `quando` ou na `expr` desce
   ao estágio principal, e o resto fica. Canal lido cedo (vaga, Aptidão, os do
   pré-contexto) fica no montante em qualquer caso.

   O que este arquivo mede: o Feto nos dois sistemas (Atenção, Iniciativa, hover,
   uma linha só), a regra da separação caso a caso, e um Voto Mecânico, que é
   texto livre do montante. O caso da Kitsune mora em t-yna. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty, maestria } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const EF = await import(R + "afty-efeitos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ficha = ({ sistema = "afty", nd = 5, anatomias = [], emCombate = false, votos = null } = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core.nd = nd;
  c.core.origem = { id: "feto_amaldicoado_hibrido", ...(anatomias.length ? { anatomias } : {}) };
  if (emCombate) c.combate = { ...c.combate, ativo: true };
  if (votos) c.votos = votos;
  return deriveAfty(c);
};

/* ============================================================ */
/* 1. O INSTINTO SANGUINÁRIO NOS DOIS SISTEMAS                   */
/* ============================================================ */
for (const sistema of ["afty", "player"]) {
  const S = `[${sistema}]`;
  const bt = maestria(5);
  const sem = ficha({ sistema });
  const semCombate = ficha({ sistema, emCombate: true });
  const fora = ficha({ sistema, anatomias: ["instinto_sanguinario"] });
  const dentro = ficha({ sistema, anatomias: ["instinto_sanguinario"], emCombate: true });

  t(`${S} fora de combate a Atenção não muda`, fora.atencao - sem.atencao, 0);
  t(`${S} em combate a Atenção sobe o BT`, dentro.atencao - semCombate.atencao, bt);
  t(`${S} a Iniciativa ganha o BT fora de combate`, fora.iniciativa - sem.iniciativa, bt);
  t(`${S} e em combate continua o mesmo BT, sem dobrar`, dentro.iniciativa - semCombate.iniciativa, bt);
  t(`${S} o hover da Atenção mostra a parcela com o nome da Anatomia`,
    dentro.partes.atencao.filter((p) => p.label === "Instinto Sanguinário").map((p) => p.valor), [bt]);
  t(`${S} e fora de combate a parcela não aparece`,
    fora.partes.atencao.some((p) => p.label === "Instinto Sanguinário"), false);
  t(`${S} as parcelas da Atenção somam o total`,
    dentro.partes.atencao.reduce((s, p) => s + (Number(p.valor) || 0), 0), dentro.atencao);
  /* Desceu ao estágio principal e saiu do montante: UMA linha, e não duas. */
  t(`${S} uma linha só de cada canal no detalhe`,
    ["atencao", "iniciativa"].map((canal) => dentro.efeitos.detalhes
      .filter((d) => d.canal === canal && d.nome === "Instinto Sanguinário").length),
    [1, 1]);
  t(`${S} a linha da Atenção segue temporária (a aba Buffs lista)`,
    dentro.efeitos.detalhes.filter((d) => d.canal === "atencao" && d.nome === "Instinto Sanguinário").map((d) => d.duracao),
    ["temporaria"]);
}

/* ============================================================ */
/* 2. A REGRA DA SEPARAÇÃO                                       */
/* ============================================================ */
/* O contexto reduzido de verdade é o do montante. Aqui ele é montado do mesmo
   jeito, sem `combate`: o catálogo da bancada fica declarado a zero e os estados
   que nascem da ficha nem existem. */
const ctxReduzido = EF.buildCriaturaDslContext({ nd: 5, bt: 3 });
const lado = (e) => (EF.separarEfeitosDeBancada([e], ctxReduzido).bancada.length ? "bancada" : "montante");
const casos = [
  ["quando em_combate desce", { canal: "atencao", quando: "em_combate", expr: "maestria" }, "bancada"],
  ["sem bancada fica", { canal: "iniciativa", expr: "maestria" }, "montante"],
  ["a expr que lê a bancada também desce", { canal: "danoBonus", expr: "2 * em_combate" }, "bancada"],
  ["a palavra `nao` não esconde a variável", { canal: "defesa", quando: "nao em_combate", expr: "1" }, "bancada"],
  ["o nome é normalizado como no tokenizer", { canal: "defesa", quando: "EM_COMBATE", expr: "1" }, "bancada"],
  ["estado que o contexto reduzido não conhece desce (estado de Addon)",
    { canal: "defesa", quando: "meu_pacote_estado_ligado", expr: "1" }, "bancada"],
  ["texto entre aspas não é variável", { canal: "defesa", expr: "contar(\"em_combate\")" }, "montante"],
  ["nome de função não é variável", { canal: "defesa", expr: "piso(bt / 2)" }, "montante"],
  ["variável do próprio efeito (`contextoDsl`) não desce", { canal: "defesa", expr: "x", contextoDsl: { x: 2 } }, "montante"],
  ["canal de vaga fica mesmo lendo a bancada", { canal: "vagasTalento", quando: "em_combate", expr: "1" }, "montante"],
  ["e os do pré-contexto também", { canal: "limiteAtributo", alvo: "forca", quando: "em_combate", expr: "1" }, "montante"],
];
for (const [nome, efeito, esperado] of casos) t(`separação: ${nome}`, lado(efeito), esperado);
t("separação: cada efeito vai para UMA lista, na ordem",
  (() => {
    const lista = casos.map(([, e]) => e);
    const { montante, bancada } = EF.separarEfeitosDeBancada(lista, ctxReduzido);
    return [montante.length + bancada.length, lista.filter((e) => montante.includes(e)).length === montante.length];
  })(),
  [casos.length, true]);
t("separação: lista inválida vira duas vazias", EF.separarEfeitosDeBancada(null, ctxReduzido), { montante: [], bancada: [] });

/* ============================================================ */
/* 3. TEXTO LIVRE DO MONTANTE: UM VOTO MECÂNICO                  */
/* ============================================================ */
/* Votos entram no montante (a quantidade ativa é o BT). Um Benefício escrito
   "em combate" caía calado pelo mesmo motivo do Instinto. */
const voto = (efeito) => ({
  contratuais: [],
  mecanicos: [{
    id: "v1", nome: "Fúria", narrativa: "",
    beneficio: { texto: "", efeitos: [efeito] },
    maleficio: { texto: "", efeitos: [] },
  }],
});
for (const sistema of ["afty", "player"]) {
  const S = `[${sistema}]`;
  const emCombate = voto({ canal: "defesa", expr: "2", quando: "em_combate" });
  t(`${S} Voto "em combate": fora de combate não soma`,
    ficha({ sistema, votos: emCombate }).defesa - ficha({ sistema }).defesa, 0);
  t(`${S} Voto "em combate": em combate soma`,
    ficha({ sistema, votos: emCombate, emCombate: true }).defesa - ficha({ sistema, emCombate: true }).defesa, 2);
  t(`${S} Voto sem condição continua somando sempre`,
    ficha({ sistema, votos: voto({ canal: "defesa", expr: "2" }) }).defesa - ficha({ sistema }).defesa, 2);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
