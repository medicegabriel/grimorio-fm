/* O ADDON `tr-no-limite-de-pericias` (2026-10-25).

   Pedido do autor: *"Que faz com que TRs sejam considerados no Contador de
   Pericias e possam ser Treinados assim como Pericia normal. Ainda deixando os
   poderes e habilidades que concedem TR funcionando normalmente. Aumentando o
   contador de Pericia nesse caso."* E a resposta à pergunta de desenho: o TR
   concedido entra como vaga GASTA e o TOTAL sobe na mesma medida.

   O pacote é só `regrasAfty.trNoLimiteDePericias`. Este arquivo prende:

     1. O pacote valida, e o verbo sobrevive ao normalizador e à união.
     2. Sem o addon o jogador segue o livro: TR fora do caixa, "Sem Fonte".
     3. ⚠ Com o addon o que SOBRA para escolher é o mesmo de antes do concedido:
        o total sobe o que os gastos sobem. É a metade "aumentando o contador".
     4. O TR escolhido gasta 1 (Treinado) ou 2 (Mestre), e deixa de ser acusado.
     5. ⚠ Marcar à mão o que uma fonte já dá NÃO gasta: nem o pacote da Classe,
        nem o Motor (Talento).
     6. O hover do total fecha: as parcelas somam o número.
     7. Nenhum bônus de TR muda, o addon só mexe no contador.
     8. A criatura já tinha o TR no caixa, e o addon só mostra o concedido. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const RG = await import(R + "afty-regras-addon.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. O PACOTE                                                   */
/* ============================================================ */
const bruto = JSON.parse(readFileSync(new URL("../addons/tr-no-limite-de-pericias.json", import.meta.url), "utf8"));
const PACOTE = AD.normalizarPacote(bruto);
t("o pacote valida sem problema nenhum", AD.validarPacote(PACOTE), []);
t("e só traz o verbo, sem acrescentar nem remendar",
  Object.keys(bruto).filter((k) => ["acrescenta", "substitui", "libera", "permite", "funcionamentos"].includes(k)), []);
t("o verbo sobrevive ao normalizador", RG.normalizarRegrasAfty(PACOTE.regrasAfty), { trNoLimiteDePericias: true });
t("texto de tela sem travessão nem ponto e vírgula",
  new RegExp(`[${String.fromCharCode(0x2014)};]`).test(bruto.descricao + bruto.nome), false);
t("valor que não é booleano reprova",
  RG.validarRegrasAfty({ trNoLimiteDePericias: "sim" }, "x"), ['x: "trNoLimiteDePericias" precisa ser verdadeiro ou falso.']);
t("chave com erro de digitação reprova", RG.validarRegrasAfty({ trNoLimiteDePericia: true }, "x").length, 1);
t("a união das regras acende o verbo",
  [RG.regrasAftyDaCriatura({ addons: [PACOTE] }).trNoLimiteDePericias, RG.regrasAftyDaCriatura({ addons: [] }).trNoLimiteDePericias],
  [true, false]);

/* ============================================================ */
/* A FICHA DE PROVA                                              */
/* ============================================================ */
/* Um Restringido, que recebe Fortitude e Reflexos da Classe e não tem escolha
   nenhuma dentro do pacote. Constituição 14 abre o Alma Inquebrável. */
const ficha = ({ sistema = "player", addon = false, nd = 10, classe = "restringido", tr = {}, pericias = {}, talentos = [] } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd, tipo: "misto", patamar: "comum" };
  f.attributes = { forca: 12, destreza: 12, constituicao: 14, inteligencia: 16, sabedoria: 10, presenca: 10 };
  f.especializacoes = classe ? [{ id: classe, nivel: nd }] : [];
  if (classe === "restringido") f.core.origem = { id: "restringido" };
  f.resistenciasProf = tr;
  f.pericias = pericias;
  f.talentos = talentos;
  f.addons = addon ? [PACOTE] : [];
  AD.aplicarAddons(f.addons);
  return f;
};
const testes = (f) => deriveAfty(f).testes;
const linha = (lista, id, chave = "value") => lista.find((x) => x[chave] === id);
const soma = (partes) => partes.reduce((s, x) => s + (Number(x.valor) || 0), 0);

/* ============================================================ */
/* 2. SEM O ADDON O JOGADOR SEGUE O LIVRO                        */
/* ============================================================ */
{
  const base = testes(ficha());
  t("sem o addon o TR do jogador está fora do caixa", base.orcamento.trNoOrcamento, false);
  t("e o orçamento não conhece o concedido", "resistenciasConcedidas" in base.orcamento, false);
  const marcado = testes(ficha({ tr: { vontade: "treinado" } }));
  t("marcar Vontade à mão não gasta nada", marcado.orcamento.gastos, base.orcamento.gastos);
  t("e é acusado como Sem Fonte", linha(marcado.resistencias, "vontade").semFonte, true);
}

/* ============================================================ */
/* 3. O CONCEDIDO ENTRA E O TOTAL SOBE JUNTO                     */
/* ============================================================ */
for (const sistema of ["player", "afty"]) {
  const sem = testes(ficha({ sistema }));
  const com = testes(ficha({ sistema, addon: true }));
  t(`${sistema}: com o addon o TR entra no caixa`, com.orcamento.trNoOrcamento, true);
  const concedido = com.orcamento.resistenciasConcedidas;
  if (sistema === "player") {
    /* Restringido no nível 10: Fortitude e Reflexos chegam Mestre (2 cada). */
    t("player: Fortitude e Reflexos mestre pela Classe", ["fortitude", "reflexos"].map((id) => linha(com.resistencias, id).prof), ["mestre", "mestre"]);
    t("player: o concedido vale 2 + 2", concedido, 4);
    t("player: o total sobe o concedido", com.orcamento.total - sem.orcamento.total, 4);
    t("player: os gastos sobem o concedido", com.orcamento.gastos - sem.orcamento.gastos, 4);
  } else {
    /* ⚠ A criatura não tem Classe que dê TR: o concedido é zero e nada muda. */
    t("afty: sem fonte de TR o concedido é zero", concedido, 0);
    t("afty: total e gastos ficam como estavam", [com.orcamento.total, com.orcamento.gastos], [sem.orcamento.total, sem.orcamento.gastos]);
  }
  /* A metade que o autor pediu: o que sobra para escolher não muda. */
  t(`${sistema}: o restante é o mesmo de antes do concedido`, com.orcamento.restante, sem.orcamento.restante);
  /* ⚠ E o hover fecha com o número (a lei de "total é a soma das parcelas"). */
  t(`${sistema}: as parcelas somam o total`, soma(com.orcamento.partes), com.orcamento.total);
  t(`${sistema}: a parcela do concedido só existe quando há concedido`,
    com.orcamento.partes.some((p) => p.label === "Testes de Resistência Concedidos"), concedido > 0);
}

/* Nível mais baixo da Classe: Treinado, e o concedido cai para 1 + 1. */
{
  const sem = testes(ficha({ nd: 5 }));
  const com = testes(ficha({ nd: 5, addon: true }));
  t("player nível 5: Fortitude e Reflexos treinado", ["fortitude", "reflexos"].map((id) => linha(com.resistencias, id).prof), ["treinado", "treinado"]);
  t("player nível 5: o concedido vale 1 + 1", com.orcamento.resistenciasConcedidas, 2);
  t("player nível 5: o restante não muda", com.orcamento.restante, sem.orcamento.restante);
}

/* ============================================================ */
/* 4. O TR ESCOLHIDO GASTA COMO UMA PERÍCIA                      */
/* ============================================================ */
for (const sistema of ["player", "afty"]) {
  const base = testes(ficha({ sistema, addon: true }));
  const treinado = testes(ficha({ sistema, addon: true, tr: { vontade: "treinado" } }));
  const mestre = testes(ficha({ sistema, addon: true, tr: { vontade: "mestre" } }));
  t(`${sistema}: Vontade treinada gasta 1`, treinado.orcamento.restante, base.orcamento.restante - 1);
  t(`${sistema}: Vontade mestre gasta 2`, mestre.orcamento.restante, base.orcamento.restante - 2);
  t(`${sistema}: a escolha não é acusada`, linha(treinado.resistencias, "vontade").semFonte, false);
  t(`${sistema}: a faixa escolhida fica gravada`, linha(treinado.resistencias, "vontade").profEscolhida, "treinado");
  t(`${sistema}: e não é concedida`, linha(treinado.resistencias, "vontade").concedida, false);
  /* TR e perícia dividem o mesmo caixa. */
  const pericia = testes(ficha({ sistema, addon: true, pericias: { acrobacia: "treinado" } }));
  const ambos = testes(ficha({ sistema, addon: true, tr: { vontade: "treinado" }, pericias: { acrobacia: "treinado" } }));
  t(`${sistema}: perícia e TR gastam do mesmo caixa`, base.orcamento.restante - ambos.orcamento.restante, 2);
  t(`${sistema}: e a perícia sozinha gasta 1`, base.orcamento.restante - pericia.orcamento.restante, 1);
}

/* Estourar o caixa acende o aviso do contador. */
{
  const base = testes(ficha({ addon: true }));
  const tudo = testes(ficha({ addon: true, tr: { vontade: "mestre", astucia: "mestre", integridade: "mestre" },
    pericias: Object.fromEntries(["acrobacia", "atletismo", "furtividade", "percepcao"].map((id) => [id, "mestre"])) }));
  t("o contador acusa excesso", [base.orcamento.excedeu, tudo.orcamento.excedeu], [false, true]);
}

/* ============================================================ */
/* 5. MARCAR O QUE UMA FONTE JÁ DÁ NÃO GASTA                     */
/* ============================================================ */
{
  /* Pacote da Classe: Fortitude já chega Mestre, e marcar por cima é de graça. */
  const base = testes(ficha({ addon: true }));
  const porCima = testes(ficha({ addon: true, tr: { fortitude: "mestre" } }));
  t("Classe: marcar o Mestre que a Classe dá não gasta", porCima.orcamento.restante, base.orcamento.restante);
  t("Classe: a linha continua concedida", linha(porCima.resistencias, "fortitude").concedida, false);
}
{
  /* Treinado pela Classe e Mestre marcado: paga só o degrau de cima. */
  const base = testes(ficha({ nd: 5, addon: true }));
  const sobe = testes(ficha({ nd: 5, addon: true, tr: { fortitude: "mestre" } }));
  t("Classe: Treinado dado e Mestre marcado paga só 1", base.orcamento.restante - sobe.orcamento.restante, 1);
  t("Classe: a faixa resolvida vira Mestre", linha(sobe.resistencias, "fortitude").prof, "mestre");
}
{
  /* Motor: o Talento Alma Inquebrável dá Integridade treinada. */
  const sem = testes(ficha({ addon: true }));
  const tal = testes(ficha({ addon: true, talentos: ["tal_alma_inquebravel"] }));
  t("Motor: o Talento treina Integridade", linha(tal.resistencias, "integridade").prof, "treinado");
  t("Motor: e é concedida", linha(tal.resistencias, "integridade").concedida, true);
  t("Motor: o concedido sobe 1 no total e nos gastos",
    [tal.orcamento.total - sem.orcamento.total, tal.orcamento.gastos - sem.orcamento.gastos], [1, 1]);
  t("Motor: e o restante não muda", tal.orcamento.restante, sem.orcamento.restante);
  const porCima = testes(ficha({ addon: true, talentos: ["tal_alma_inquebravel"], tr: { integridade: "treinado" } }));
  t("Motor: marcar o que o Talento dá não gasta", porCima.orcamento.restante, tal.orcamento.restante);
  const sobe = testes(ficha({ addon: true, talentos: ["tal_alma_inquebravel"], tr: { integridade: "mestre" } }));
  t("Motor: Mestre por cima do Treinado dado paga só 1", tal.orcamento.restante - sobe.orcamento.restante, 1);
  /* Sem o addon o Talento segue treinando, só que fora do caixa. */
  const livro = testes(ficha({ talentos: ["tal_alma_inquebravel"] }));
  t("o Talento funciona do mesmo jeito sem o addon", linha(livro.resistencias, "integridade").prof, "treinado");
  t("e sem o addon não entra no contador", "resistenciasConcedidas" in livro.orcamento, false);
}

/* ============================================================ */
/* 7. O ADDON SÓ MEXE NO CONTADOR                                */
/* ============================================================ */
for (const sistema of ["player", "afty"]) {
  const a = testes(ficha({ sistema, talentos: ["tal_alma_inquebravel"], tr: { vontade: "treinado" } }));
  const b = testes(ficha({ sistema, addon: true, talentos: ["tal_alma_inquebravel"], tr: { vontade: "treinado" } }));
  t(`${sistema}: nenhum bônus de TR muda`, b.resistencias.map((r) => [r.value, r.bonus, r.prof]), a.resistencias.map((r) => [r.value, r.bonus, r.prof]));
  t(`${sistema}: nenhum bônus de perícia muda`, b.pericias.map((p) => p.bonus), a.pericias.map((p) => p.bonus));
}

AD.aplicarAddons([]);

console.log(bad.length ? bad.join("\n") : "");
if (bad.length) {
  console.log(`${bad.length} FALHARAM, ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
