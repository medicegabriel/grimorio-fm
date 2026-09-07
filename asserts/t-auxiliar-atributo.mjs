/* AUMENTO DE ATRIBUTO: o pool de pontos, a divisão entre atributos e o
   transpasse do limite de 20.

   As quatro regras que o autor mandou em 2026-09-07, verbatim:

     1. *"Feitiço Auxiliar de Atributo pode ser pego mais de uma vez. E você pode
        selecionar Multiplos Atributos."*
     2. *"você poderia ter Dois Feitiços Sustentados de Atributo. Precisando
        pagar o Custo de Cada 1. Ou um Feitiço de Multiplos Efeitos em Atributo,
        pegando duas vezes atributos como efeito."*
     3. *"você pode pegar um Feitiço de Atributo que por exemplo fornece +12
        Pontos de Atributo e dividir ele em 6 em um atributo e 6 em outro."*
     4. *"Feitiços de Atributo ativos TRANSPASSAM o limite de 20, podendo chegar
        até o de 30. Logo se eu tenho 18 de Força e faço um Feitiço que me
        fornece +12 de Força. Eu fico com 30 de Força."*

   E a que atravessa as quatro: *"é sempre para ATRIBUTOS DIFERENTES. Se você
   colocar um Feitiço de Atributo em FORÇA, o outro efeito de Multiplos Efeitos
   ou Divisão entre os atributos NÃO PODE SER FORÇA. Pq Força com Força NÃO
   SOMA, só fica o MAIOR."*

   Este arquivo também tranca os três defeitos numéricos achados na auditoria da
   mesma data (blocos 6 a 8). */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const F = await import(R + "afty-feiticos.js");
const CC = await import(R + "afty-combate-conjurador.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const aux = (extra = {}) => ({
  ...F.createBlankFeitico(),
  id: "f1", nome: "Reforco", tipo: "auxiliar",
  nivel: 5, efeitoAux: "atributo", duracaoAux: "sustentada",
  ...extra,
});
const calcular = (f) => F.calcularFeiticoAuxiliar(f, { nd: 25 });

/* ============================================================ */
/* 1. O POOL, E A DIVISÃO                                        */
/* ============================================================ */

/* O +12 do autor É o Nível 5 sustentado, e é ele que o exemplo dele usa. */
t("nv5 sustentado entrega 12 pontos", calcular(aux()).valor, 12);
t("e custa 20 PE", calcular(aux()).custoPE, 20);
t("com 2 PE por rodada", calcular(aux()).upkeepPE, 2);

/* Um atributo só: leva o pool inteiro, sem ninguém digitar número nenhum. É a
   ficha anterior a 2026-09-07, que só tem `alvoAuxAtributo`. */
t("ficha antiga: tudo no atributo escolhido",
  calcular(aux({ alvoAuxAtributo: "forca" })).atributos, [{ attr: "forca", pontos: 12 }]);
t("e sem sobra", calcular(aux({ alvoAuxAtributo: "forca" })).atributosSobra, 0);

/* A divisão 6 e 6 do exemplo do autor. */
const dividido = calcular(aux({
  atributosAux: [{ attr: "constituicao", pontos: 6 }, { attr: "forca", pontos: 6 }],
}));
t("divide 12 em 6 e 6",
  dividido.atributos, [{ attr: "constituicao", pontos: 6, pedido: 6 }, { attr: "forca", pontos: 6, pedido: 6 }]);
t("sem sobrar ponto", dividido.atributosSobra, 0);
t("e sem aviso", dividido.avisos, []);

/* Dividir em três também vale, e o que sobra é DITO. */
const tres = calcular(aux({
  atributosAux: [{ attr: "forca", pontos: 5 }, { attr: "destreza", pontos: 4 }, { attr: "presenca", pontos: 1 }],
}));
t("divide em tres", tres.atributos.map((p) => p.pontos), [5, 4, 1]);
t("e avisa a sobra", tres.avisos, ["2 ponto(s) de atributo sem destino."]);

/* Pedir mais do que o pool: apara e avisa, nunca redistribui sozinho. */
const demais = calcular(aux({
  atributosAux: [{ attr: "forca", pontos: 10 }, { attr: "destreza", pontos: 10 }],
}));
t("apara no pool", demais.atributos.map((p) => p.pontos), [10, 2]);
t("e avisa o excesso", demais.avisos[0], "A divisão pede 20 ponto(s) e o Feitiço entrega 12.");

/* ⚠ ATRIBUTOS DIFERENTES, dentro da própria divisão. */
const repetido = calcular(aux({
  atributosAux: [{ attr: "forca", pontos: 6 }, { attr: "forca", pontos: 6 }],
}));
/* ⚠ A SEGUNDA CAI, e os pontos dela NÃO migram para a primeira. Fundir as duas
   em 12 seria o motor decidindo o que o jogador quis dizer, e o que a regra diz
   é que o segundo aumento não vale: o resultado é 6 em Força e 6 pontos
   perdidos, com as DUAS coisas avisadas. */
t("Força duas vezes na divisão vira uma", repetido.atributos, [{ attr: "forca", pontos: 6, pedido: 6 }]);
t("e é avisado",
  repetido.avisos.some((a) => a.includes("Força aparece duas vezes")), true);
t("com os pontos perdidos tambem avisados",
  repetido.avisos.some((a) => a.includes("6 ponto(s) de atributo sem destino")), true);

/* O pool acompanha o Feitiço: dividido entre 2 alvos, cada alvo recebe 6. */
t("dividido entre 2 alvos, o pool cai pela metade",
  calcular(aux({ alvosAux: 2 })).valor, 6);

/* ============================================================ */
/* 2. REPETIR O EFEITO NO MÚLTIPLOS EFEITOS                      */
/* ============================================================ */
/* A trava geral continua: dois Aumentos de Defesa não existem. A exceção é o
   Atributo, porque ele não é o mesmo efeito duas vezes. */

const jaTem = (efeito) => F.efeitosDisponiveisMult(
  [{ efeito, nivel: 2 }], null, false, { nivel: 2, duracao: "duradoura" },
).map((m) => m.value);

t("Aumento de Defesa nao repete", jaTem("defesa").includes("defesa"), false);
t("Redução de Dano nao repete", jaTem("rd").includes("rd"), false);
t("Aumento de Atributo REPETE", jaTem("atributo").includes("atributo"), true);

/* ============================================================ */
/* 3. A TRAVA ATRAVESSA OS EFEITOS DO MESMO FEITIÇO              */
/* ============================================================ */

const mult = (a, b) => aux({
  multiplosAtivo: true, duracaoMult: "duradoura", rodadasMult: 4,
  efeitosMult: [
    { id: "e1", efeito: "atributo", nivel: 4, ...a },
    { id: "e2", efeito: "atributo", nivel: 4, ...b },
  ],
});

t("dois Atributos em atributos diferentes",
  F.atributosDoAuxiliar(mult({ alvoAuxAtributo: "forca" }, { alvoAuxAtributo: "constituicao" })),
  ["forca", "constituicao"]);
t("e nada repetido",
  F.atributosRepetidos(mult({ alvoAuxAtributo: "forca" }, { alvoAuxAtributo: "constituicao" })), []);
t("dois no MESMO atributo sao pegos",
  F.atributosRepetidos(mult({ alvoAuxAtributo: "forca" }, { alvoAuxAtributo: "forca" })), ["forca"]);
/* ⚠ E a divisão de um efeito briga com o alvo do OUTRO efeito, que é o caso
   exato que o autor nomeou. */
t("a divisao de um briga com o alvo do outro",
  F.atributosRepetidos(mult(
    { atributosAux: [{ attr: "forca", pontos: 4 }, { attr: "destreza", pontos: 4 }] },
    { alvoAuxAtributo: "forca" },
  )), ["forca"]);
t("o Feitiço avisa",
  calcular(mult({ alvoAuxAtributo: "forca" }, { alvoAuxAtributo: "forca" }))
    .avisos.some((a) => a.includes("mais de uma vez neste Feitiço")), true);
t("e nao avisa quando sao diferentes",
  calcular(mult({ alvoAuxAtributo: "forca" }, { alvoAuxAtributo: "constituicao" }))
    .avisos.some((a) => a.includes("mais de uma vez")), false);

/* ============================================================ */
/* 4. O QUE CHEGA NO MOTOR                                       */
/* ============================================================ */
/* ⚠ DUAS LINHAS POR ATRIBUTO. O canal `atributo` sozinho apara no limite de 20,
   e quem levanta o teto é o `limiteAtributo`. É o mesmo par do Incremento de
   Atributo e da Quebra de Limites. */

const estadosDe = (f) => CC.estadosCombateConjurador({
  habilidades: [], tecnicas: {}, armas: [], feiticos: [f],
});
const efeitosDe = (f, combate) => CC.resolveAuxiliaresAtivos(
  { feiticos: [f] }, combate, estadosDe(f), { nd: 25, habilidades: [] },
).efeitos;

const um = efeitosDe(aux({ alvoAuxAtributo: "forca" }), { ativo: true, sustentacaoFeitico1: "f1" });
t("emite duas linhas", um.map((e) => e.canal), ["atributo", "limiteAtributo"]);
t("as duas no mesmo atributo", um.map((e) => e.alvo), ["forca", "forca"]);
t("com o mesmo valor", um.map((e) => e.expr), ["12", "12"]);
t("no pool exclusivo", um.every((e) => e.exclusivo === "feiticoAuxiliarPassivo"), true);
t("e temporarias", um.every((e) => e.duracao === "temporaria"), true);
/* ⚠ SEM `furaTeto`: ele levaria a 32, e a regra do autor para no 30. */
t("nenhuma fura o teto do sistema", um.some((e) => e.furaTeto), false);

const split = efeitosDe(
  aux({ atributosAux: [{ attr: "constituicao", pontos: 6 }, { attr: "forca", pontos: 6 }] }),
  { ativo: true, sustentacaoFeitico1: "f1" },
);
t("a divisao vira quatro linhas", split.length, 4);
t("uma dupla por atributo",
  split.map((e) => `${e.canal}:${e.alvo}:${e.expr}`),
  ["atributo:constituicao:6", "limiteAtributo:constituicao:6",
   "atributo:forca:6", "limiteAtributo:forca:6"]);

/* Sem o Feitiço no ar, nada sai. */
t("desligado nao emite nada", efeitosDe(aux(), { ativo: false }), []);

/* ============================================================ */
/* 5. O 18 + 12 = 30 DO AUTOR                                    */
/* ============================================================ */

const ficha = (feiticos, combate) => {
  const c = createBlankAfty();
  c.core.origem = { id: "herdado" };
  c.core.nd = 20;
  c.core.tipo = "conjurador";
  c.especializacoes = [{ id: "conjurador", nivel: 20 }];
  c.attributes = { forca: 18, destreza: 10, constituicao: 14, inteligencia: 16, sabedoria: 10, presenca: 10 };
  c.feiticos = feiticos;
  if (combate) c.combate = combate;
  return c;
};

const repouso = deriveAfty(ficha([aux({ alvoAuxAtributo: "forca" })]));
t("em repouso a Força e 18", repouso.attrEff.forca, 18);
t("e o limite e 20", repouso.attrLimiteEfetivo.forca, 20);

const noAr = deriveAfty(ficha(
  [aux({ alvoAuxAtributo: "forca" })],
  { ativo: true, sustentacaoFeitico1: "f1" },
));
t("com o Feitiço no ar, 18 + 12 = 30", noAr.attrEff.forca, 30);
/* ⚠ O limite PERMANENTE não muda: o que o Feitiço levanta é o teto DESTE
   estágio, e ele cai junto com o Feitiço. */
t("o limite permanente segue 20", noAr.attrLimiteEfetivo.forca, 20);
t("e o teto aplicado diz 30", noAr.attrTetoAplicado.forca, 30);
t("o hover nao acusa perda", noAr.partesAtributo.forca.some((p) => /Perdido no limite/.test(p.label)), false);

/* ⚠ O TETO DO SISTEMA CONTINUA SENDO A ÚLTIMA PALAVRA. Uma Técnica Máxima
   duradoura no mínimo de rodadas entrega 18, e 18 + 18 pararia em 36. */
const enorme = deriveAfty(ficha(
  [aux({ nivel: "max", duracaoAux: "duradoura", rodadasDur: 4, alvoAuxAtributo: "forca" })],
  { ativo: true, sustentacaoFeitico1: "f1" },
));
t("Técnica Máxima duradoura nao passa de 30", enorme.attrEff.forca <= 30, true);

/* Dois Feitiços sustentados em atributos DIFERENTES valem os dois. */
const doisF = [
  aux({ id: "f1", nome: "A", alvoAuxAtributo: "forca" }),
  aux({ id: "f2", nome: "B", alvoAuxAtributo: "constituicao" }),
];
const dois = deriveAfty(ficha(doisF, {
  ativo: true, sustentacaoFeitico1: "f1", sustentacaoFeitico2: "f2",
}));
/* ⚠ O SEGUNDO SÓ ENTRA COM SUSTENTAÇÃO AVANÇADA. Sem ela existe uma vaga de
   sustentação só, e o `sustentacaoFeitico2` não é nem oferecido. Este assert
   mede a vaga, e não o número: é o que impede alguém de ler "dois sustentados"
   como "sem limite de sustentados". */
t("sem Sustentação Avançada ha UMA vaga",
  (dois.combate.estadosExtras || []).filter((e) => e.id.startsWith("sustentacaoFeitico")).length, 1);
t("entao so o primeiro sobe a Força", dois.attrEff.forca, 30);
t("e a Constituição fica intacta", dois.attrEff.constituicao, 14);

/* ============================================================ */
/* 6. O PISO NÃO QUEBRA MAIS A GRADE DE 1,5m                     */
/* ============================================================ */
/* Os piores casos eram os de divisor 1, onde NADA deveria mudar. */

const metros = (efeito, nivel, rodadas) => F.calcularFeiticoAuxiliar(
  { tipo: "auxiliar", nivel, efeitoAux: efeito, duracaoAux: "duradoura", rodadasDur: rodadas },
  { nd: 25 },
).valor;

t("Alcance CaC nv0 1rod continua 1,5m", metros("alcanceCaC", 0, 1), 1.5);
t("Movimento nv1 2rod continua 4,5m", metros("movimento", 1, 2), 4.5);
t("Movimento nv5 4rod continua 19,5m", metros("movimento", 5, 4), 19.5);
/* E onde o divisor morde, ele para na grade e não no inteiro. */
t("Movimento nv4 4rod: 16,5 ÷ 2 = 8,25 -> 7,5m", metros("movimento", 4, 4), 7.5);
t("Alcance CaC nv2 3rod: 4,5 ÷ 2 = 2,25 -> 1,5m", metros("alcanceCaC", 2, 3), 1.5);
/* ⚠ A Duradoura de Movimento nv1 empatava com a Sustentada por causa do piso, e
   chegou a ficar ABAIXO dela. Era o único par do sistema em que a duração mais
   curta valia menos. */
t("e a Duradoura nao fica abaixo da Sustentada",
  metros("movimento", 1, 2) >= F.AUX_TABELAS.movimento[1].sustentada, true);

/* Bônus numérico continua aparando no INTEIRO, com passo 1. */
t("Defesa nv5 6rod: 9 ÷ 3 = 3", F.calcularFeiticoAuxiliar(
  { tipo: "auxiliar", nivel: 5, efeitoAux: "defesa", duracaoAux: "duradoura", rodadasDur: 6 }, { nd: 25 },
).valor, 3);
t("valorDuradoura sem passo continua inteira", F.valorDuradoura(14, 5, 5), 7);
t("e com passo 1,5 anda na grade", F.valorDuradoura(16.5, 4, 4, 1.5), 7.5);

/* ============================================================ */
/* 7. TÉCNICA MÁXIMA CUSTA 25, IGUAL AOS OUTROS TIPOS            */
/* ============================================================ */
/* O Auxiliar colapsava "max" em 5 para ler a tabela e usava o MESMO 5 no custo,
   então cobrava 20 por uma Técnica Máxima que a tabela precifica em 25. */

t("a tabela de custo tem o max", F.FEITICO_CUSTO_PE.max, 25);
t("Auxiliar nv5 custa 20", calcular(aux({ nivel: 5 })).custoPE, 20);
t("Auxiliar Técnica Máxima custa 25", calcular(aux({ nivel: "max" })).custoPE, 25);
t("e no Múltiplos Efeitos tambem",
  F.orcamentoMultiplos({ nivel: "max", multiplosAtivo: true, efeitosMult: [] }).base, 25);
t("Dano Técnica Máxima segue 25",
  F.calcularFeiticoDano({ tipo: "dano", nivel: "max", alvo: "unico", acao: "comum" }, { nd: 25 }).custoPE, 25);

/* ============================================================ */
/* 8. AS TABELAS CONTINUAM ÍNTEGRAS                              */
/* ============================================================ */
/* A auditoria de 2026-09-07 varreu as 17 × 7 × 3 e não achou erro de
   transcrição. Isto tranca as quatro propriedades que ela mediu. */

const NIVEIS = [0, 1, 2, 3, 4, 5, "max"];
const COLUNAS = ["imediata", "duradoura", "sustentada"];
const numDe = (v) => (typeof v === "number" ? v : Array.isArray(v) ? v[0] * (v[1] + 1) / 2 : null);

const buracos = [];
const naoMonotonicos = [];
const colunaInvertida = [];
for (const e of F.AUX_EFEITOS) {
  for (const c of COLUNAS) {
    let viu = false;
    let ant = null;
    for (const n of NIVEIS) {
      const cru = F.AUX_TABELAS[e.value]?.[n]?.[c];
      if (cru != null) viu = true; else if (viu) buracos.push(`${e.value}/${c}/${n}`);
      const v = numDe(cru);
      if (v == null) continue;
      if (ant != null && Math.abs(v) < Math.abs(ant)) naoMonotonicos.push(`${e.value}/${c}/${n}`);
      ant = v;
    }
  }
  for (const n of NIVEIS) {
    const l = F.AUX_TABELAS[e.value]?.[n];
    if (!l) continue;
    const [i, d, s] = [numDe(l.imediata), numDe(l.duradoura), numDe(l.sustentada)];
    if (i != null && d != null && Math.abs(d) > Math.abs(i)) colunaInvertida.push(`${e.value}/${n}/dur>ime`);
    if (d != null && s != null && Math.abs(s) > Math.abs(d)) colunaInvertida.push(`${e.value}/${n}/sus>dur`);
  }
}
t("nenhum buraco no meio de coluna", buracos, []);
t("nenhum valor cai ao subir de nivel", naoMonotonicos, []);
t("nenhuma coluna mais longa vale mais", colunaInvertida, []);

/* Todo metro da tabela anda na grade de 1,5m. */
const foraDaGrade = [];
for (const e of F.AUX_EFEITOS.filter((m) => m.tipoValor === "metros")) {
  for (const n of NIVEIS) {
    for (const c of COLUNAS) {
      const v = F.AUX_TABELAS[e.value]?.[n]?.[c];
      if (typeof v !== "number") continue;
      if (Math.abs((v / 1.5) - Math.round(v / 1.5)) > 1e-9) foraDaGrade.push(`${e.value}/${n}/${c}`);
    }
  }
}
t("todo metro da tabela esta na grade", foraDaGrade, []);
t("sao 17 efeitos auxiliares", F.AUX_EFEITOS.length, 17);

/* ============================================================ */

if (bad.length) {
  console.error(`FALHAS (${bad.length}):`);
  for (const b of bad) console.error("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
