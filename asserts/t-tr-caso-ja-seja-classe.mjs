/* O "CASO JÁ SEJA" DO TR ENXERGA A CLASSE NO JOGADOR (2026-10-03).

   Livro, Força Imparável (Restringido 8°): "Você se torna treinado em um teste
   de resistência à sua escolha e mestre em outro TR no qual já seja treinado."
   Talento Resiliência Melhorada: "você se torna treinado nele ou, caso já seja
   treinado, se torna mestre."

   As duas decidem por `1 + (prof_tr_<tr> >= 1)`, e o `prof_tr_*` só lia a
   MARCAÇÃO À MÃO. No jogador o TR vem do pacote da Classe, que não é marcação:
   o Restringido 8 que escolhia a Força Imparável na Fortitude (treinada pela
   Classe) continuava Treinado. Decisão do autor: Mestre nas duas, e o
   `prof_tr_*` do jogador passa a contar a faixa da Classe, valendo a maior
   entre ela e a marcação. A criatura não muda, porque lá o TR é marcado na aba.

   O que este arquivo mede: o jogador nas duas entradas (e no segundo TR do
   Mestre de Classe), o controle fora da Classe, o hover, o orçamento que não
   se mexe, e a criatura intocada. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { detalhesDoCanal } = await import(R + "afty-efeitos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ficha = (esp, o = {}) => {
  const { sistema = "player", tr, segundo, prof = {}, imparavel, resiliencia } = o;
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  const nd = esp.reduce((s, e) => s + e.nivel, 0);
  f.core = { ...f.core, nd, tipo: "misto", patamar: "comum" };
  f.especializacoes = esp;
  // A Especialização Restringido só existe com a Origem Restringido.
  if (esp[0]?.id === "restringido") f.core.origem = { ...f.core.origem, id: "restringido" };
  f.attributes = { forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 };
  if (tr) f.trDaClasse = tr;
  if (segundo) f.trSegundo = segundo;
  f.resistenciasProf = prof;
  if (imparavel) {
    f.habilidades = ["res_forca_imparavel"];
    f.escolhasHabilidade = { res_forca_imparavel: imparavel.map((r) => `res_imparavel_${r}`) };
  }
  if (resiliencia) {
    f.talentos = ["tal_resiliencia_melhorada"];
    f.escolhasTalento = { tal_resiliencia_melhorada: [`tal_resiliencia_${resiliencia}`] };
  }
  return deriveAfty(f);
};
const soQuem = (d) => Object.fromEntries(d.testes.resistencias.filter((r) => r.prof).map((r) => [r.value, r.prof]));
const linha = (d, tr) => d.testes.resistencias.find((r) => r.value === tr);
const res8 = [{ id: "restringido", nivel: 8 }];
const cmb = (nivel) => [{ id: "combatente", nivel }];

/* ============================================================ */
/* 1. FORÇA IMPARÁVEL NO JOGADOR                                 */
/* ============================================================ */
{
  const sem = ficha(res8);
  t("Restringido 8 sem a habilidade: os dois da Classe treinados",
    soQuem(sem), { reflexos: "treinado", fortitude: "treinado" });

  const d = ficha(res8, { imparavel: ["fortitude", "vontade"] });
  t("a habilidade está na ficha", d.habilidades.efetivas.includes("res_forca_imparavel"), true);
  t("Fortitude da Classe vira Mestre, Vontade nova fica Treinada",
    soQuem(d), { reflexos: "treinado", fortitude: "mestre", vontade: "treinado" });
  const forti = linha(d, "fortitude");
  t("a Fortitude é concedida, e não marcada",
    [forti.prof, forti.profEscolhida, forti.concedida, forti.critico], ["mestre", null, true, true]);
  t("o Mestre soma meio BT a mais no teste (BT 3, +1 sobre o Treinado)",
    forti.bonus - linha(sem, "fortitude").bonus, 1);
  t("o hover da Fortitude mostra a parcela de Mestre",
    forti.partes.some((p) => p.label === "Maestria (Mestre)"), true);
  t("o detalhe do Motor leva o nome da habilidade e a faixa 2",
    detalhesDoCanal(d.efeitos, "proficienciaTR", "fortitude").map((x) => [x.nome, x.valor, x.semCredito]),
    [["Força Imparável (Fortitude)", 2, true]]);

  t("nos dois TR da Classe, os dois viram Mestre",
    soQuem(ficha(res8, { imparavel: ["fortitude", "reflexos"] })), { reflexos: "mestre", fortitude: "mestre" });
  t("fora da Classe nada vira Mestre",
    soQuem(ficha(res8, { imparavel: ["vontade", "astucia"] })),
    { reflexos: "treinado", fortitude: "treinado", vontade: "treinado", astucia: "treinado" });
}

/* ============================================================ */
/* 2. RESILIÊNCIA MELHORADA NO JOGADOR                           */
/* ============================================================ */
{
  const d = ficha(cmb(8), { tr: ["fortitude"], resiliencia: "fortitude" });
  t("o Talento está na ficha", d.talentos.escolhidas.includes("tal_resiliencia_melhorada"), true);
  t("Combatente 8 com Fortitude pela Classe: o Talento dá Mestre", soQuem(d), { fortitude: "mestre" });
  t("e o atributo do TR sobe 1 do mesmo jeito", d.attrEff.constituicao, 11);
  t("com Reflexos pela Classe, a Fortitude do Talento fica Treinada",
    soQuem(ficha(cmb(8), { tr: ["reflexos"], resiliencia: "fortitude" })), { reflexos: "treinado", fortitude: "treinado" });
  t("sem escolher o TR da Classe, o Talento dá só Treinado",
    soQuem(ficha(cmb(8), { resiliencia: "fortitude" })), { fortitude: "treinado" });
  /* O segundo TR do Teste de Resistência Mestre (nível 9) também é "já
     treinado": ele mora nas mesmas faixas da Classe. */
  t("no 9, o segundo TR da Classe também conta",
    soQuem(ficha(cmb(9), { tr: ["reflexos"], segundo: "vontade", resiliencia: "vontade" })),
    { reflexos: "mestre", vontade: "mestre" });
}

/* ============================================================ */
/* 3. O ORÇAMENTO NÃO SE MEXE                                    */
/* ============================================================ */
/* A faixa da Classe não sai de efeito nenhum, então o "Caso já seja" continua
   sem enxergar a si mesmo, e as duas entradas seguem `semCredito`. No jogador o
   TR nem entra no orçamento. */
t("jogador: o orçamento é o mesmo com e sem a Força Imparável",
  ficha(res8, { imparavel: ["fortitude", "vontade"] }).testes.orcamento.gastos,
  ficha(res8).testes.orcamento.gastos);

/* ============================================================ */
/* 4. A CRIATURA NÃO SENTE                                       */
/* ============================================================ */
{
  const criatura = (o) => ficha(res8, { sistema: "afty", ...o });
  t("criatura sem marcação: a Força Imparável dá Treinado nos dois",
    soQuem(criatura({ imparavel: ["fortitude", "vontade"] })), { fortitude: "treinado", vontade: "treinado" });
  t("criatura com a Fortitude marcada: Mestre, como antes",
    soQuem(criatura({ imparavel: ["fortitude", "vontade"], prof: { fortitude: "treinado" } })),
    { fortitude: "mestre", vontade: "treinado" });
  t("criatura com os campos da Classe gravados: eles não contam",
    soQuem(criatura({ imparavel: ["fortitude"], tr: ["fortitude"] })), { fortitude: "treinado" });
  /* `semCredito`: na criatura o TR gasta vaga, e o Mestre que nasce da marcação
     paga continua cobrando a marcação inteira. */
  t("criatura: o gasto de TR é o da marcação, com ou sem a habilidade",
    criatura({ imparavel: ["fortitude", "vontade"], prof: { fortitude: "treinado" } }).testes.orcamento.resistencias,
    criatura({ prof: { fortitude: "treinado" } }).testes.orcamento.resistencias);
  t("Resiliência na criatura sem marcação: Treinado",
    soQuem(ficha(cmb(8), { sistema: "afty", resiliencia: "fortitude" })), { fortitude: "treinado" });
  t("Resiliência na criatura com a marcação: Mestre",
    soQuem(ficha(cmb(8), { sistema: "afty", resiliencia: "fortitude", prof: { fortitude: "treinado" } })),
    { fortitude: "mestre" });
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
