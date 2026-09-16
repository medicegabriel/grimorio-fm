/**
 * O TETO DE PER DA ENERGIA REVERSA (autor, 2026-09-16).
 *
 * Pedido: *"O site era para permitir gastar 9 Pontos de Energia Reversa, porém
 * só posso 8."* A conta dele era 1 + Nível (6), Cura em Grupo (+2) e o Treino de
 * Energia Reversa (+1). A 1ª etapa do treino existia só no texto.
 *
 * O defeito tinha uma causa atrás da outra: o teto estava escrito em TRÊS
 * lugares (os efeitos de `curaPontos` na linha de Cura, o `fluxoPER` do derive e
 * o `max` da faixa na bancada), e nenhum dos três sabia do treino. Agora os três
 * leem os mesmos efeitos, e o `tetoPERDaCura` é o número de todos.
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. A etapa do treino emite o efeito.
 * 2. O número, nos dois sistemas: base, Cura Amplificada, Cura em Grupo e treino.
 * 3. As TRÊS leituras batem entre si, que é o que impede a conta de se separar
 *    de novo: a linha de Cura, a faixa da bancada e o teto que apara a sessão.
 * 4. A Regeneração do Fluxo Constante usa o PER aparado, e não o pedido.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { COMBATE_ESTADOS } = await import(R + "afty-combate.js");
const { getTreinamento } = await import(R + "afty-treinamentos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. A ETAPA                                                    */
/* ============================================================ */
const etapa1 = getTreinamento("energia_reversa")?.etapas?.[0];
t("a 1ª etapa do Treino de Energia Reversa emite o teto",
  etapa1?.efeitos, [{ canal: "curaPontos", alvo: "cura_energia_reversa", expr: "1" }]);

/* ============================================================ */
/* 2 e 3. O NÚMERO E AS TRÊS LEITURAS                            */
/* ============================================================ */
const faixa = COMBATE_ESTADOS.find((e) => e.id === "fluxoPER");

const ficha = (sistema, { er = 5, amplificada = false, grupo = false, treino = 0, sessao = null } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 20 };
  f.aptidoes = { ...f.aptidoes, er };
  f.aptidoesAmaldicoadas = [
    "energia_reversa", "fluxo_constante",
    ...(amplificada ? ["cura_amplificada"] : []),
    ...(grupo ? ["cura_em_grupo"] : []),
  ];
  f.treinamentos = { ...(f.treinamentos ?? {}), ...(treino ? { energia_reversa: treino } : {}) };
  if (sessao != null) f.combate = { ...(f.combate ?? {}), ativo: true, fluxoPER: sessao };
  return f;
};

const leituras = (f) => {
  const d = deriveAfty(f);
  const linha = (d.cura?.linhas ?? []).find((l) => l.id === "cura_energia_reversa");
  return { d, teto: d.tetoPERDaCura, linha: linha?.unidade?.pontos, faixa: faixa.max(d) };
};

for (const s of ["player", "afty"]) {
  /* O Nível de Aptidão efetivo muda com a 2ª etapa do treino, então a conta
     esperada lê o `er` que o derive resolveu, e não o alocado. */
  const casos = [
    [{}, (er) => 1 + Math.floor(er / 2)],
    [{ amplificada: true }, (er) => 1 + er],
    [{ amplificada: true, grupo: true }, (er) => 1 + er + 2],
    [{ amplificada: true, grupo: true, treino: 1 }, (er) => 1 + er + 2 + 1],
    [{ amplificada: true, grupo: true, treino: 4 }, (er) => 1 + er + 2 + 1],
    [{ grupo: true, treino: 1, er: 3 }, (er) => 1 + Math.floor(er / 2) + 2 + 1],
  ];
  for (const [opcoes, conta] of casos) {
    const rotulo = `${s} ${JSON.stringify(opcoes)}`;
    const { d, teto, linha, faixa: max } = leituras(ficha(s, opcoes));
    const esperado = conta(d.aptidao.efetivo.er);
    t(`${rotulo}: o teto`, teto, esperado);
    t(`${rotulo}: a linha de Cura lê o mesmo teto`, linha, teto);
    t(`${rotulo}: a faixa do Fluxo Constante lê o mesmo teto`, max, teto);
  }

  /* O caso do pedido: Nível 5 (4 alocados mais a 2ª etapa), Cura Amplificada,
     Cura em Grupo e o treino. Dá 9. */
  t(`${s}: o caso do autor dá 9`,
    leituras(ficha(s, { er: 4, amplificada: true, grupo: true, treino: 4 })).teto, 9);

  /* ============================================================ */
  /* 4. A SESSÃO E A REGENERAÇÃO                                   */
  /* ============================================================ */
  const pedido = leituras(ficha(s, { er: 4, amplificada: true, grupo: true, treino: 4, sessao: 99 })).d;
  t(`${s}: a sessão pedindo 99 PER para no teto`, pedido.combate.fluxoPER, 9);
  /* ND 20 rola 5 dados por PER, então 9 PER são 45d8. */
  t(`${s}: a Regeneração usa o PER aparado`, `${pedido.regeneracao.dados}${pedido.regeneracao.dado}`, "45d8");
}

/* ============================================================ */
if (bad.length) {
  console.log(`FALHAS (${bad.length}):`);
  for (const b of bad) console.log("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
