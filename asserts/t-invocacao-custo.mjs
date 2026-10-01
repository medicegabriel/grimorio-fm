/* O CUSTO E O ORÇAMENTO EM PARTES (Etapa 4 da atualização de 2026-09-30).

   1. O custo sai em partes: o base do grau (ou ZERO pelo tipo: Marionete, Corpo
      e Maldição não têm custo base de ativação, decisão do autor), os itens além
      da cota, as reduções, e o "Piso em Zero" quando a redução passa do custo. A
      soma das partes fecha com o número em TODA combinação.
   2. O orçamento separa a cota gratuita, o que se compra com PE e o que uma
      Habilidade concede.
   3. E-11: a Quimera do addon soma o custo que o CARTÃO de cada fundida mostra,
      e não o custo cru do DSL (que esquecia as reduções). */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
await import(R + "afty-derive.js");
const INV = await import(R + "afty-invocacoes.js");
const HAB = await import(R + "afty-habilidades.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};
const soma = (partes) => (partes || []).reduce((s, p) => s + (Number(p.valor) || 0), 0);

const CINCO = ["shikigami", "tecnica", "maldicao", "marionete", "corpo"];
const GRAUS = ["quarto", "terceiro", "segundo", "primeiro", "especial"];
const acao = (classe) => ({ ...INV.createBlankAcao(), classe, familia: "auxilio", auxilioSub: "defesa" });

/* O dono, com as Habilidades pedidas. */
const donoCom = (ids = []) => {
  const ctxDono = { nd: 9, bt: 4, nivel_controlador: 9 };
  return {
    nd: 9, bt: 4, nivelControlador: 9,
    efeitos: HAB.efeitosInvocacaoControlador(ids, {}),
    marcadores: HAB.resolveMarcadoresInvocacao({ escolhidasIds: ids, ctxDono }),
  };
};

const montar = (tipo, grau, { simples = 0, complexas = 0, caract = 0, marcadores = {} } = {}) => ({
  ...INV.createBlankInvocacao(grau, tipo),
  id: `${tipo}-${grau}`,
  acoes: [...Array(simples)].map(() => acao("simples")).concat([...Array(complexas)].map(() => acao("complexa"))),
  caracteristicas: [...Array(caract)].map(() => INV.createBlankCaracteristica()),
  marcadores,
});

/* ============================================================ */
/* 1. A SOMA FECHA EM TODA COMBINAÇÃO                            */
/* ============================================================ */
const DONOS = {
  semNada: donoCom([]),
  apice: donoCom(["ctr_apice_do_controle"]),
  economicas: donoCom(["ctr_invocacoes_economicas"]),
  visionario: donoCom(["ctr_visionario"]),
};
let combinacoes = 0;
let fecham = 0;
let semNegativo = 0;
for (const tipo of CINCO) {
  for (const grau of GRAUS) {
    for (const itens of [{}, { simples: 3 }, { complexas: 3, caract: 2 }, { simples: 2, complexas: 4, caract: 3 }]) {
      for (const [nomeDono, dono] of Object.entries(DONOS)) {
        const marcadores = nomeDono === "economicas" ? { invocacoes_economicas: true } : {};
        const r = INV.resolveInvocacao(montar(tipo, grau, { ...itens, marcadores }), dono);
        combinacoes++;
        if (soma(r.fontes.custo) === r.custo) fecham++;
        if (r.custo >= 0) semNegativo++;
      }
    }
  }
}
t(`as partes do custo fecham com o numero nas ${combinacoes} combinacoes`, fecham, combinacoes);
t("e o custo nunca fica negativo", semNegativo, combinacoes);

/* ============================================================ */
/* 2. O CUSTO BASE PELO TIPO                                     */
/* ============================================================ */
const r0 = (tipo, grau = "segundo", itens = {}, dono = DONOS.semNada) => INV.resolveInvocacao(montar(tipo, grau, itens), dono);
t("sem itens: Shikigami e Tecnica pagam o base do grau, os outros nada",
  CINCO.map((x) => r0(x).custo), [6, 6, 0, 0, 0]);
t("a primeira parcela diz de onde veio",
  CINCO.map((x) => r0(x).fontes.custo[0]),
  [{ label: "Segundo Grau (Base)", valor: 6 }, { label: "Segundo Grau (Base)", valor: 6 },
    { label: "Maldição (Sem Custo Base)", valor: 0 }, { label: "Marionete (Sem Custo Base)", valor: 0 },
    { label: "Corpo Amaldiçoado (Sem Custo Base)", valor: 0 }]);
t("o base de cada grau no Shikigami", GRAUS.map((g) => r0("shikigami", g).custo), [2, 4, 6, 8, 12]);
t("e zero em todos os graus da Marionete", GRAUS.map((g) => r0("marionete", g).custo), [0, 0, 0, 0, 0]);

/* Os itens além da cota (Segundo Grau: cota de 3). 2 Simples e 4 Complexas:
   ordenados 2,2,2,2,1,1. A cota leva os 3 maiores (2,2,2), e pagam 2+1+1 = 4. */
const comItens = r0("marionete", "segundo", { simples: 2, complexas: 4 });
t("os itens alem da cota continuam custando na Marionete", comItens.custo, 4);
t("e viram a parcela de extras",
  comItens.fontes.custo, [{ label: "Marionete (Sem Custo Base)", valor: 0 }, { label: "Ações e Características Extras", valor: 4 }]);
t("no Shikigami o mesmo, mais o base", r0("shikigami", "segundo", { simples: 2, complexas: 4 }).custo, 10);
t("o detalhe do custo bate com o resolvido",
  INV.detalheCustoInvocacao(montar("shikigami", "segundo", { simples: 2, complexas: 4 })),
  { base: 6, baseLabel: "Segundo Grau (Base)", itens: 4, nItens: 3, poupadoGratis: 0, total: 10 });

/* A redução maior que o custo: a parcela de piso fecha a soma. */
const eco = r0("marionete", "quarto", { marcadores: { invocacoes_economicas: true } }, DONOS.economicas);
t("Economicas numa Marionete sem custo nao deixa negativo", eco.custo, 0);
t("e o piso aparece como parcela, fechando a soma",
  [eco.fontes.custo.some((p) => p.label === "Piso em Zero" && p.valor === 2), soma(eco.fontes.custo)], [true, 0]);
t("a variavel custo do DSL tambem le o base do tipo",
  CINCO.map((x) => INV.buildInvocacaoDslContext(montar(x, "quarto"), {}).custo), [2, 2, 0, 0, 0]);

/* ============================================================ */
/* 3. O ORÇAMENTO SEPARADO                                       */
/* ============================================================ */
const orcA = r0("shikigami", "segundo", { simples: 1, complexas: 1, caract: 2 }, DONOS.apice).orcamento;
t("a cota gratuita, o maximo de compradas, as pagas e a concedida pelo Apice",
  [orcA.partes.gratuitas, orcA.partes.compradas, orcA.partes.concedidasGratis.map((p) => p.valor)],
  [3, { max: 3, pagas: 0 }, [2]]);
t("o uso por Simples, Complexas e Caracteristicas", orcA.uso, { simples: 1, complexas: 1, caracteristicas: 2 });
const orcV = r0("shikigami", "segundo", {}, DONOS.visionario).orcamento;
t("o Visionario entra como vaga PAGA, e nao gratis",
  [orcV.partes.concedidasPagas.map((p) => p.valor), orcV.partes.concedidasGratis], [[2], []]);
t("o total continua o mesmo numero de antes (base + adicionais + concedidas)",
  [orcA.total, orcV.total], [3 + 3 + 2, 3 + 3 + 2]);

/* ============================================================ */
/* 4. E-11: A QUIMERA DO ADDON SOMA O CUSTO DO CARTÃO            */
/* ============================================================ */
const fichas = [
  { ...montar("shikigami", "quarto", { marcadores: { invocacoes_economicas: true } }), id: "a", nome: "Cervo" },
  { ...montar("shikigami", "quarto"), id: "b", nome: "Tigre" },
];
const donoEco = DONOS.economicas;
const cartoes = INV.resolveInvocacoesList(fichas, donoEco).lista;
t("o cartao da fundida com Economicas custa 0, e o outro 2", cartoes.map((c) => c.custo), [0, 2]);
const q = INV.resolveQuimera({ id: "q", principalId: "a", fundidasIds: ["b"], nivel: 2 }, fichas, donoEco);
t("a Quimera custa a soma dos cartoes (E-11)", q.custo, 2);
t("e o hover da Quimera lista o custo de cada cartao",
  q.resolvida.fontes.custo, [{ label: "Cervo", valor: 0 }, { label: "Tigre", valor: 2 }]);
/* ⚠ O CASO QUE O CÓDIGO ANTERIOR ERRAVA: a redução na fundida que NÃO é a
   principal. A cópia sintética herda as marcas da principal, então quando a
   marca estava nela a conta antiga fechava por coincidência. Com a marca na
   outra, os cartões somam 2 e a Quimera saía por 4 (conferido contra o código
   anterior com `git archive`). */
const fichas2 = [
  { ...montar("shikigami", "quarto"), id: "a", nome: "Cervo" },
  { ...montar("shikigami", "quarto", { marcadores: { invocacoes_economicas: true } }), id: "b", nome: "Tigre" },
];
const q2 = INV.resolveQuimera({ id: "q2", principalId: "a", fundidasIds: ["b"], nivel: 2 }, fichas2, donoEco);
t("com a reducao na fundida que nao e a principal, a Quimera custa a soma dos cartoes (2, e nao 4)",
  [INV.resolveInvocacoesList(fichas2, donoEco).lista.map((c) => c.custo), q2.custo], [[2, 0], 2]);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
