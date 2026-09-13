/**
 * HABILIDADE DE ESPECIALIZAÇÃO REPETÍVEL — 2026-08-31
 *
 * Relato do autor: *"Elevar Aptidão não está podendo ser pega múltiplas
 * vezes."* O texto dela diz "Você pode pegar esta habilidade uma quantidade de
 * vezes igual ao seu bônus de treinamento", e a ficha guardava ids ÚNICOS: a
 * segunda pega era impossível de representar.
 *
 * O que este arquivo prende são os TRÊS lados que têm de andar juntos, porque
 * qualquer um sozinho deixa a repetição meio quebrada e calada:
 *
 *   1. a CONTA de vezes, aparada no teto por LEITURA (baixar o ND devolve a
 *      pega excedente em vez de apagá-la da ficha),
 *   2. a VAGA: cada pega além da primeira custa uma, igual ao Talento,
 *   3. o EFEITO, multiplicado. Foi exatamente aqui que o Talento repetível
 *      furou em agosto: a 2ª pega aparecia na conta de vagas e não rendia nada.
 *
 * ⚠ E a quarta: `escolhidas` continua SEM repetição. Ela responde "a criatura
 * tem esta habilidade?" e é lida por `includes(id)` em meio mundo do motor.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const H = await import(R + "afty-habilidades.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ficha = (habs, nd = 20, sistema = "player") => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd, tipo: "misto" };
  f.attributes = { forca: 10, destreza: 12, constituicao: 14, inteligencia: 15, sabedoria: 10, presenca: 10 };
  f.especializacoes = [{ id: "conjurador", nivel: nd }];
  f.habilidades = habs;
  return deriveAfty(f);
};

/* ============================================================ */
/* 1. O TETO SAI DO TEXTO, E É EXPRESSÃO                         */
/* ============================================================ */
/* "uma quantidade de vezes igual ao seu bônus de treinamento": um número fixo
   no catálogo não sabe dizer isso. A Maestria vale 4 no ND 10 e 6 no ND 20. */
t("teto no ND 10 é a Maestria de lá", H.maxVezesHabilidade("cnj_elevar_aptidao", { nd: 10, maestria: 4 }), 4);
t("teto no ND 20 é a Maestria de lá", H.maxVezesHabilidade("cnj_elevar_aptidao", { nd: 20, maestria: 6 }), 6);
t("quem não declara nada vale 1", H.maxVezesHabilidade("cnj_especializacao", { nd: 20, maestria: 6 }), 1);
/* "repetidas vezes", sem número: um teto grande seria um teto inventado. */
t("a Nova Habilidade não tem teto", H.maxVezesHabilidade("cnj_nova_habilidade", { nd: 20, maestria: 6 }), Infinity);
t("id inexistente vale 0", H.maxVezesHabilidade("nao_existe", {}), 0);

/* ============================================================ */
/* 2. A CONTA, E O APARO DE LEITURA                              */
/* ============================================================ */
const uma = ficha(["cnj_elevar_aptidao"]);
const tres = ficha(Array(3).fill("cnj_elevar_aptidao"));
const demais = ficha(Array(9).fill("cnj_elevar_aptidao"));

t("uma pega conta uma", uma.habilidades.vezes.cnj_elevar_aptidao, 1);
t("três pegas contam três", tres.habilidades.vezes.cnj_elevar_aptidao, 3);
t("nove pegas param na Maestria", demais.habilidades.vezes.cnj_elevar_aptidao, 6);

/* ⚠ O APARO É DE LEITURA. Um Conjurador 20 que baixa para 8 tem Maestria 3:
   as pegas 4, 5 e 6 somem da conta e CONTINUAM na ficha, então voltar ao 20 as
   traz de volta. Apagá-las seria destruir escolha por causa de uma mudança de
   nível que o jogador pode desfazer no clique seguinte. */
const baixou = ficha(Array(6).fill("cnj_elevar_aptidao"), 8);
t("baixar o nível apara a leitura", baixou.habilidades.vezes.cnj_elevar_aptidao, 3);

/* ============================================================ */
/* 3. A LISTA DE ESCOLHIDAS NÃO REPETE                           */
/* ============================================================ */
/* Ela responde "a criatura tem?", e meio motor a lê com `includes(id)`. Se a
   repetição entrasse aqui, todo pré-requisito e toda tela contariam a mesma
   habilidade N vezes. */
t("escolhidas traz o id UMA vez",
  tres.habilidades.escolhidas.filter((id) => id === "cnj_elevar_aptidao").length, 1);
t("e selecionadas também",
  tres.habilidades.selecionadas.filter((id) => id === "cnj_elevar_aptidao").length, 1);

/* ============================================================ */
/* 4. CADA PEGA CUSTA UMA VAGA                                   */
/* ============================================================ */
const zero = ficha([]);
t("uma pega gasta uma vaga", uma.habilidades.gastos - zero.habilidades.gastos, 1);
t("três pegas gastam três", tres.habilidades.gastos - zero.habilidades.gastos, 3);
t("e o excedente não cobra", demais.habilidades.gastos - zero.habilidades.gastos, 6);

/* ============================================================ */
/* 5. O EFEITO MULTIPLICA — o lado que o Talento furou em agosto */
/* ============================================================ */
/* "você aumenta um dos seus Níveis de Aptidão em 1", pelo canal `pontosAptidao`
   (orçamento livre: quem escolhe a trilha é o jogador, na aba Aptidões). */
t("uma pega dá um nível de aptidão", uma.totalAptidao - zero.totalAptidao, 1);
t("três pegas dão três", tres.totalAptidao - zero.totalAptidao, 3);
t("e o excedente não rende", demais.totalAptidao - zero.totalAptidao, 6);
t("o hover do Player discrimina os marcos de Nível",
  zero.partes.totalAptidao.map((p) => [p.label, p.valor]),
  [["Nível 2", 1], ["Nível 4", 1], ["Nível 6", 1], ["Nível 8", 1], ["Nível 10", 2],
    ["Nível 12", 1], ["Nível 14", 1], ["Nível 16", 1], ["Nível 18", 1], ["Nível 20", 2]]);
t("o hover identifica os três pontos da habilidade",
  tres.partes.totalAptidao.filter((p) => !p.label.startsWith("Nível "))
    .reduce((soma, p) => soma + p.valor, 0), 3);
t("as fontes fecham com o total exibido",
  [zero, uma, tres, demais].map((d) =>
    d.partes.totalAptidao.filter((p) => !p.suplantado)
      .reduce((soma, p) => soma + p.valor, 0) === d.totalAptidao),
  [true, true, true, true]);
const alem20 = ficha([], 24, "afty");
t("o Afty mostra cada marco depois do ND 20",
  alem20.partes.totalAptidao.filter((p) => p.label.startsWith("ND "))
    .slice(-2).map((p) => [p.label, p.valor]),
  [["ND 22", 1], ["ND 24", 1]]);
t("o total do Afty também fecha depois do ND 20",
  alem20.partes.totalAptidao.reduce((soma, p) => soma + p.valor, 0),
  alem20.totalAptidao);
const jogador24 = ficha([], 24);
t("o Player para nos pontos do Nível 20",
  jogador24.partes.totalAptidao.filter((p) => p.label.startsWith("Nível "))
    .slice(-2).map((p) => [p.label, p.valor]),
  [["Nível 18", 1], ["Nível 20", 2]]);
t("o Player não recebe ponto pelo Nível 22 ou 24",
  jogador24.totalAptidao - ficha([], 20).totalAptidao, 0);
t("as fontes do Player fecham com o total",
  jogador24.partes.totalAptidao.reduce((soma, p) => soma + p.valor, 0),
  jogador24.totalAptidao);
for (const nivel of [22, 24, 26, 28, 30]) {
  const porNivel = ficha([], nivel).partes.totalAptidao
    .filter((p) => p.label.startsWith("Nível "));
  t(`o Player no Nível ${nivel} conserva só os 12 pontos por nível até o 20`,
    porNivel.reduce((soma, p) => soma + p.valor, 0), 12);
  t(`o último marco do Player no Nível ${nivel} é o 20`,
    porNivel.at(-1)?.label, "Nível 20");
}
const afty30 = ficha([], 30, "afty");
t("o Afty mantém os marcos até o ND 30",
  afty30.partes.totalAptidao.filter((p) => p.label.startsWith("ND "))
    .reduce((soma, p) => soma + p.valor, 0), 17);
/* A vaga e o efeito andam juntos: uma pega que cobra e não rende (ou o
   contrário) é o bug de agosto voltando por outra porta. */
t("vaga e efeito medem o mesmo",
  [1, 2, 3, 4, 5, 6, 7].map((n) => {
    const d = ficha(Array(n).fill("cnj_elevar_aptidao"));
    return (d.habilidades.gastos - zero.habilidades.gastos) === (d.totalAptidao - zero.totalAptidao);
  }),
  [true, true, true, true, true, true, true]);

/* A Nova Habilidade sem teto: 5 pegas rendem 10 vagas de Feitiço (2 cada). */
const nova = (n) => ficha(Array(n).fill("cnj_nova_habilidade"));
t("a Nova Habilidade repete sem teto", nova(5).habilidades.vezes.cnj_nova_habilidade, 5);
t("e cada pega rende as duas vagas de Feitiço",
  nova(5).orcamentoHabilidades.exclusivasFeitico - nova(0).orcamentoHabilidades.exclusivasFeitico, 10);

/* ============================================================ */
/* 6. AS DUAS REPETIÇÕES NÃO CONVIVEM                            */
/* ============================================================ */
/* `maxVezes` é "pegue de novo e ganhe a mesma coisa"; `escolha.repetivel` é
   "pegue de novo, para outro alvo". Juntas, a ficha cobraria duas vagas pela
   mesma pega. O validador do catálogo recusa. */
t("nenhuma entrada declara as duas",
  H.AFTY_HABILIDADES.filter((h) => (h.maxVezes || h.maxVezesExpr) && h.escolha?.repetivel).map((h) => h.id), []);
t("catálogo de habilidades válido", H.validarCatalogoHabilidades(), []);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
