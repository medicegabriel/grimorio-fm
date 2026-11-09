/* O NÍVEL DE EXAUSTÃO FAZ ALGUMA COISA, 2026-11-09 (Livro de Regras 2.5.2, p.324).

   O autor pediu as PENALIDADES dos Níveis 1 a 5, o TETO de 6 e as CONDIÇÕES automáticas. O resto da página
   (morte no 6, descanso longo, gatilhos de dia, desmaio) é do mestre e não entra no site.

   Este arquivo prova, nos DOIS sistemas (criatura e jogador):
     1. a regra pura (afty-exaustao.js): condições cumulativas, perda de PV máximo e o desmaio no lugar da perda;
     2. o derive: -N em Defesa, CD, Ataque, TR, Perícia, Iniciativa e Teste de Morte, -1,5 m por Nível, e o Dano NÃO muda;
     3. as Condições impostas pelo Nível, que não acumulam com as marcadas à mão e dizem de onde vêm no hover;
     4. a perda de PV máximo nos Níveis 3 e 5, e o PV corrente aparado pela sessão;
     5. as duas falhas de morte ao cair com Nível 4 ou mais;
     6. o teto de 6 na sessão, a Guarda que as Condições impostas derrubam e o Enjoado que tira a conversão de ações.

   ⚠ Prova NÚMERO e ESTRUTURA, e não aparência. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const X = await import(R + "afty-exaustao.js");
const S = await import(R + "ficha/ficha-sessao.js");
const V = await import(R + "ficha/ficha-vital.js");
const A = await import(R + "ficha/ficha-acoes.js");
const { opcoesDeriveDaSessao } = await import(R + "ficha/ficha-opcoes-derive.js");
const L = await import(R + "ficha/efeitos/exaustao-logica.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. A REGRA PURA                                               */
/* ============================================================ */
t("teto de 6", X.EXAUSTAO_MAXIMA, 6);
t("limita: lixo vira 0", [X.limitaExaustao(undefined), X.limitaExaustao("x"), X.limitaExaustao(-3)], [0, 0, 0]);
t("limita: passa de 6 volta a 6", [X.limitaExaustao(7), X.limitaExaustao(99), X.limitaExaustao(3.9)], [6, 6, 3]);
t("sem Nível, sem Condição", X.condicoesDaExaustao(0).length + X.condicoesDaExaustao(1).length, 0);
t("Nível 2: Desprevenido", X.condicoesDaExaustao(2).map((c) => c.nome), ["Desprevenido"]);
t("Nível 3 soma o Exposto", X.condicoesDaExaustao(3).map((c) => c.nome), ["Desprevenido", "Exposto"]);
t("Nível 4 soma Condenado e Desorientado", X.condicoesDaExaustao(4).map((c) => c.nome),
  ["Desprevenido", "Exposto", "Condenado", "Desorientado"]);
t("Nível 5 soma o Enjoado", X.condicoesDaExaustao(5).map((c) => c.nome),
  ["Desprevenido", "Exposto", "Condenado", "Desorientado", "Enjoado"]);
t("Nível 6 segue a conta do 5", X.condicoesDaExaustao(6).length, 5);
t("impoe: sem acento e sem caixa", [X.exaustaoImpoe(5, "enjoado"), X.exaustaoImpoe(4, "Enjoado")], [true, false]);
t("os ids das impostas têm o prefixo", X.entradasDeCondicaoDaExaustao(2)[0].id, "exaustao:Desprevenido");
t("e dizem o Nível de onde vieram", X.entradasDeCondicaoDaExaustao(4).map((c) => c.via),
  ["Exaustão 2", "Exaustão 3", "Exaustão 4", "Exaustão 4"]);

t("PV: Nível 2 não perde", X.perdaDePvDaExaustao(2, 400).perda, 0);
t("PV: Nível 3 perde 1/4 quando é maior que 20", X.perdaDePvDaExaustao(3, 400).perda, 100);
t("PV: Nível 3 perde 20 quando 1/4 é menor", X.perdaDePvDaExaustao(3, 60).perda, 20);
t("PV: 1/4 arredonda para baixo", X.perdaDePvDaExaustao(4, 85).perda, 21);
t("PV: Nível 5 perde metade quando passa de 50", X.perdaDePvDaExaustao(5, 400).perda, 200);
t("PV: Nível 5 perde 50 quando metade é menor", X.perdaDePvDaExaustao(5, 90).perda, 50);
t("PV: Nível 5 SUBSTITUI a perda do 3, e não soma", X.perdaDePvDaExaustao(5, 400).perda === 300, false);
t("PV: perda que zeraria a vida vira desmaio", X.perdaDePvDaExaustao(3, 20), { perda: 0, desmaia: true, regra: "20 ou 1/4" });
t("PV: o desmaio do 5 com 50 de vida", X.perdaDePvDaExaustao(5, 50).desmaia, true);
t("PV: 21 de vida aguenta os 20 do Nível 3", X.perdaDePvDaExaustao(3, 21), { perda: 20, desmaia: false, regra: "20 ou 1/4" });
t("falhas ao cair: só do Nível 4", [3, 4, 5, 6].map(X.falhasAoCairPorExaustao), [0, 2, 2, 2]);
t("sem Nível, sem linha no Motor", X.efeitosDaExaustao(0), []);
t("Nível 3: -3 e -4,5 m", X.efeitosDaExaustao(3).filter((e) => e.canal === "defesa" || e.canal === "movimento").map((e) => e.expr), ["-3", "-4.5"]);
t("nenhuma linha do Motor é de Dano", X.efeitosDaExaustao(6).some((e) => /dano/i.test(e.canal)), false);
t("nenhuma linha de Manobra geral (já vem de Perícia e TR)", X.efeitosDaExaustao(6).filter((e) => e.canal === "bonusManobra").map((e) => e.alvo), ["morte"]);

/* ============================================================ */
/* 2. O DERIVE, NOS DOIS SISTEMAS                                */
/* ============================================================ */
const corpo = (sistema) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.name = "Cobaia";
  f.core = { ...f.core, nd: 12, tipo: "misto", patamar: "comum", tecnicaAttr: "presenca" };
  f.especializacoes = [{ id: "combatente", nivel: 12 }];
  f.attributes = { forca: 16, destreza: 18, constituicao: 15, inteligencia: 12, sabedoria: 14, presenca: 17 };
  return f;
};
/* O dano é o texto e o total de cada linha: o ACERTO da linha leva o -N e fica de fora de propósito. */
const danoDe = (d) => d.dano.entradas.map((e) => [e.id, e.texto, e.total]);
const pericia = (d, id) => d.testes.pericias.find((p) => p.id === id);
const tr = (d, id) => d.testes.resistencias.find((r) => r.value === id);
const ataque = (d, id) => d.testes.ataques.find((a) => a.id === id);
const manobra = (d, id) => d.testes.manobras.find((m) => m.id === id);
const hover = (partes, label) => (partes ?? []).filter((p) => p.label === label)
  .map((p) => ({ valor: p.valor, suplantado: !!p.suplantado }));
const somaDoHover = (partes) => (partes ?? []).filter((p) => !p.suplantado && typeof p.valor === "number")
  .reduce((s, p) => s + p.valor, 0);

for (const sistema of ["afty", "player"]) {
  const tag = (s) => `[${sistema}] ${s}`;
  const derivar = (exaustao, extra = {}) => deriveAfty(corpo(sistema), { exaustao, ...extra });
  const d0 = derivar(0);
  const dSem = deriveAfty(corpo(sistema));
  t(tag("sem a opção, o derive é o mesmo do Nível zero"), JSON.stringify(dSem.defesa) + dSem.hp + dSem.cd, JSON.stringify(d0.defesa) + d0.hp + d0.cd);
  t(tag("Nível zero: nada imposto"), d0.exaustao, { nivel: 0, condicoes: [], perdaPv: 0, desmaia: false, falhasAoCair: 0 });
  t(tag("e nenhuma Condição na lista"), d0.condicoes.lista.length, 0);

  /* ---- Nível 1: só os -1 e os -1,5 m ---- */
  const d1 = derivar(1);
  t(tag("N1: Defesa -1"), d1.defesa - d0.defesa, -1);
  t(tag("N1: CD -1"), d1.cd - d0.cd, -1);
  t(tag("N1: Iniciativa -1"), d1.iniciativa - d0.iniciativa, -1);
  t(tag("N1: ataque corpo a corpo -1"), ataque(d1, "corpo").bonus - ataque(d0, "corpo").bonus, -1);
  t(tag("N1: ataque à distância -1"), ataque(d1, "distancia").bonus - ataque(d0, "distancia").bonus, -1);
  t(tag("N1: toda perícia -1"), d1.testes.pericias.every((p) => p.bonus - pericia(d0, p.id).bonus === -1), true);
  t(tag("N1: todo TR -1"), d1.testes.resistencias.every((r) => r.bonus - tr(d0, r.value).bonus === -1), true);
  t(tag("N1: a Concentração leva -1 UMA vez (vem do TR de Fortitude)"),
    manobra(d1, "concentracao").executar - manobra(d0, "concentracao").executar, -1);
  t(tag("N1: Agarrar leva -1 UMA vez (vem do Atletismo)"),
    manobra(d1, "agarrar").executar - manobra(d0, "agarrar").executar, -1);
  t(tag("N1: o Teste de Morte, que é d20 puro, leva -1"),
    manobra(d1, "morte").executar - manobra(d0, "morte").executar, -1);
  t(tag("N1: Movimento -1,5 m"), d1.movimento - d0.movimento, -1.5);
  t(tag("N1: o PV não muda"), d1.hp, d0.hp);
  t(tag("N1: nenhuma Condição"), d1.condicoes.lista.length, 0);
  t(tag("N1: o Dano não muda"), danoDe(d1), danoDe(d0));
  t(tag("N1: o hover da Defesa diz Exaustão 1"), hover(d1.partes.defesa, "Exaustão 1"), [{ valor: -1, suplantado: false }]);
  t(tag("N1: as parcelas da Defesa fecham no total"), somaDoHover(d1.partes.defesa), d1.defesa);
  t(tag("N1: o hover do Movimento diz Exaustão 1"), hover(d1.partes.movimento, "Exaustão 1"), [{ valor: -1.5, suplantado: false }]);

  /* ---- o negativo cresce -1 por Nível ---- */
  for (const n of [2, 3, 4, 5, 6]) {
    const d = derivar(n);
    t(tag(`N${n}: Iniciativa -${n}`), d.iniciativa - d0.iniciativa, -n);
    t(tag(`N${n}: CD -${n}`), d.cd - d0.cd, -n);
    t(tag(`N${n}: Movimento -${1.5 * n} m`), d.movimento - d0.movimento, -1.5 * n);
    t(tag(`N${n}: Ataque -${n}`), ataque(d, "corpo").bonus - ataque(d0, "corpo").bonus, -n);
    t(tag(`N${n}: Perícia -${n}`), pericia(d, "atletismo").bonus - pericia(d0, "atletismo").bonus, -n);
    t(tag(`N${n}: o Dano não muda`), danoDe(d), danoDe(d0));
  }

  /* ---- Nível 2: Desprevenido (-3 de Defesa e de Reflexos) ---- */
  const d2 = derivar(2);
  t(tag("N2: Defesa -2 da Exaustão e -3 do Desprevenido"), d2.defesa - d0.defesa, -5);
  t(tag("N2: Reflexos -2 e -3"), tr(d2, "reflexos").bonus - tr(d0, "reflexos").bonus, -5);
  t(tag("N2: a Fortitude só leva o -2"), tr(d2, "fortitude").bonus - tr(d0, "fortitude").bonus, -2);
  t(tag("N2: a lista tem o Desprevenido"), d2.condicoes.lista.map((c) => c.nome), ["Desprevenido"]);
  t(tag("N2: a imposta diz o id e o Nível de onde vem"), [d2.condicoes.lista[0].id, d2.condicoes.lista[0].via], ["exaustao:Desprevenido", "Exaustão 2"]);
  t(tag("N2: o hover da Defesa nomeia a fonte"), hover(d2.partes.defesa, "Desprevenido (Exaustão 2)"), [{ valor: -3, suplantado: false }]);
  t(tag("N2: as parcelas da Defesa fecham no total"), somaDoHover(d2.partes.defesa), d2.defesa);
  t(tag("N2: exaustao no derive"), d2.exaustao.condicoes.map((c) => c.nome), ["Desprevenido"]);

  /* ---- a Condição imposta NÃO acumula com a marcada à mão ---- */
  const dMao = deriveAfty(corpo(sistema), { exaustao: 2, condicoes: [{ id: "c_p", nome: "Paralisado" }] });
  t(tag("Paralisado (-10) e o Desprevenido imposto: -10, e não -13 (mais -2 da Exaustão)"), dMao.defesa - d0.defesa, -12);
  t(tag("o Desprevenido imposto aparece riscado"), hover(dMao.partes.defesa, "Desprevenido (Exaustão 2)"), [{ valor: -3, suplantado: true }]);
  const dMarcada = deriveAfty(corpo(sistema), { exaustao: 2, condicoes: [{ id: "c_d", nome: "Desprevenido" }] });
  t(tag("Desprevenido marcado à mão e imposto contam UMA vez"), dMarcada.defesa - d0.defesa, -5);
  t(tag("e o hover leva o nome da marcada"), hover(dMarcada.partes.defesa, "Desprevenido"), [{ valor: -3, suplantado: false }]);

  /* ---- Nível 3: Exposto e a perda de PV máximo ---- */
  const d3 = derivar(3);
  const perda3 = Math.max(20, Math.floor(d0.hp / 4));
  t(tag("N3: perde 20 ou 1/4 do PV máximo"), d3.hp, d0.hp - perda3);
  t(tag("N3: o derive diz quanto perdeu"), d3.exaustao.perdaPv, perda3);
  t(tag("N3: o hover do PV fecha a conta"), hover(d3.partes.hp, "Exaustão 3"), [{ valor: -perda3, suplantado: false }]);
  t(tag("N3: as parcelas do PV fecham no total"), somaDoHover(d3.partes.hp), d3.hp);
  t(tag("N3: Desprevenido e Exposto"), d3.condicoes.lista.map((c) => c.nome), ["Desprevenido", "Exposto"]);

  /* ---- Nível 4: Condenado (+1 de PE) e Desorientado ---- */
  const d4 = derivar(4);
  t(tag("N4: a perda segue a do 3"), d4.hp, d0.hp - perda3);
  t(tag("N4: as quatro Condições"), d4.condicoes.lista.map((c) => c.nome), ["Desprevenido", "Exposto", "Condenado", "Desorientado"]);
  t(tag("N4: duas falhas ao cair"), d4.exaustao.falhasAoCair, 2);
  t(tag("N3: nenhuma falha ao cair"), d3.exaustao.falhasAoCair, 0);

  /* ---- Nível 5: Enjoado e a perda maior no lugar da menor ---- */
  const d5 = derivar(5);
  const perda5 = Math.max(50, Math.floor(d0.hp / 2));
  t(tag("N5: perde 50 ou metade, no lugar da perda do 3"), d5.hp, d0.hp - perda5);
  t(tag("N5: as cinco Condições"), d5.condicoes.lista.map((c) => c.nome),
    ["Desprevenido", "Exposto", "Condenado", "Desorientado", "Enjoado"]);
  const d6 = derivar(6);
  t(tag("N6: segue a conta do 5, sem morte"), [d6.hp, d6.condicoes.lista.length, d6.exaustao.desmaia], [d0.hp - perda5, 5, false]);
  t(tag("N7 (fora do teto) vale como 6"), derivar(7).defesa, d6.defesa);

  /* ---- o desmaio: a perda zeraria a vida, então não se aplica ---- */
  const fraco = corpo(sistema);
  fraco.statOverrides = { ...(fraco.statOverrides ?? {}) };
  const dFraco = deriveAfty({ ...fraco, core: { ...fraco.core, nd: 1 }, especializacoes: [] }, { exaustao: 5 });
  const dFraco0 = deriveAfty({ ...fraco, core: { ...fraco.core, nd: 1 }, especializacoes: [] });
  t(tag("vida pequena: o Nível 5 desmaia em vez de perder"), [dFraco.exaustao.desmaia, dFraco.hp, dFraco.exaustao.perdaPv], [true, dFraco0.hp, 0]);

  /* ---- o movimento não passa de zero ---- */
  t(tag("o Movimento nunca fica negativo"), derivar(6, { condicoes: [] }).movimento >= 0, true);

  /* ---- Condenado do Nível 4 sobe o custo em PE ---- */
  t(tag("N4: o Condenado entra no canal de custo"), d4.condicoes.lista.find((c) => c.nome === "Condenado").efeitos.some((e) => e.rotulo === "Custo em PE"), true);
}

/* ============================================================ */
/* 3. A SESSÃO                                                   */
/* ============================================================ */
const base = deriveAfty(corpo("afty"));
const sessao = (extra = {}) => ({ ...S.sessaoEmBranco(base), ...extra });

t("normaliza: passa de 6 volta a 6", S.normalizaSessao({ exaustao: 9 }, base).exaustao, 6);
t("normaliza: lixo vira 0", S.normalizaSessao({ exaustao: "x" }, base).exaustao, 0);
t("aparaSessao segura o teto", S.aparaSessao(sessao({ exaustao: 9 }), base).exaustao, 6);
t("aparaSessao não mexe no que está dentro do teto (mesma sessão)", (() => { const s = sessao({ exaustao: 3 }); return S.aparaSessao(s, base) === s; })(), true);
t("a lógica do contador: mais 1 no 6 fica em 6", L.maisExaustao({ exaustao: 6 }, 1).exaustao, 6);
t("a lógica do contador: define 9 vira 6", L.comExaustao({ exaustao: 0 }, 9).exaustao, 6);
t("a lógica do contador: menos 1 no 0 fica em 0", L.maisExaustao({ exaustao: 0 }, -1).exaustao, 0);
t("o Invencível pendente soma e para no 6", (() => {
  const s = sessao({ exaustao: 6, combate: { ativo: true, invencivelSobOSol: true, invencivelRodadas: 1, invencivelPendenteExaustao: true }, peAtual: 20 });
  return S.proximaRodada(s, base).sessao.exaustao;
})(), 6);

/* as opções do derive levam o Nível */
t("opcoesDeriveDaSessao leva a Exaustão", opcoesDeriveDaSessao(sessao({ exaustao: 4 })).exaustao, 4);

/* Enjoado tira a conversão de ações, sem estar na lista da sessão */
t("Nível 4 não impede a conversão", A.temCondicaoNaSessao(sessao({ exaustao: 4 }), A.CONDICAO_SEM_CONVERSAO), false);
t("Nível 5 impõe o Enjoado", A.temCondicaoNaSessao(sessao({ exaustao: 5 }), A.CONDICAO_SEM_CONVERSAO), true);
t("sem Exaustão, sem Condição", A.temCondicaoNaSessao(sessao(), "Desprevenido"), false);
t("Nível 2 impõe o Desprevenido", A.temCondicaoNaSessao(sessao({ exaustao: 2 }), "Desprevenido"), true);

/* A Guarda cai com Desprevenido, Exposto e Desorientado */
t("a Guarda não cai no Nível 1", S.condicaoQueQuebraGuarda(sessao({ exaustao: 1 })), null);
t("a Guarda cai no Nível 2 (Desprevenido)", S.condicaoQueQuebraGuarda(sessao({ exaustao: 2 })), "Desprevenido");

/* ============================================================ */
/* 4. AS DUAS FALHAS AO CAIR                                     */
/* ============================================================ */
const cai = (falhasAoCair, falhasAntes = 0) => V.registraDano({ ...V.vitalEmBranco(), falhas: falhasAntes },
  { hpAntes: 10, hpDepois: 0, sobrou: 3, dano: 13, hpMax: 100, falhasAoCair });
t("cair sem Exaustão 4: nenhuma falha", cai(0).vital.falhas, 0);
t("cair com Exaustão 4: duas falhas", cai(2).vital.falhas, 2);
t("e o corpo cai nas Portas da Morte", cai(2).vital.estado, "morrendo");
t("quem já traz uma falha vai a duas, e não a três", cai(2, 1).vital.falhas, 2);
t("quem já traz duas fica em duas", cai(2, 2).vital.falhas, 2);
t("segue vivo com duas falhas (a morte é no terceiro)", cai(2).morreu, false);
t("pela sessão: a queda com Nível 4 grava duas falhas", (() => {
  const r = S.aplicaDano(sessao({ exaustao: 4, hpAtual: 5 }), 20, base);
  return [r.vital?.estado, r.vital?.falhas];
})(), ["morrendo", 2]);
t("pela sessão: a queda com Nível 3 não grava falha", (() => {
  const r = S.aplicaDano(sessao({ exaustao: 3, hpAtual: 5 }), 20, base);
  return [r.vital?.estado, r.vital?.falhas];
})(), ["morrendo", 0]);
t("pela sessão: o dano seguinte, já nas Portas, soma a falha por dano (3 mata)", (() => {
  const a = S.aplicaDano(sessao({ exaustao: 4, hpAtual: 5 }), 20, base, { ataqueId: "a1" });
  const b = S.aplicaDano(a, 10, base, { ataqueId: "a2" });
  return [b.vital?.falhas, b.vital?.estado];
})(), [3, "morto"]);

if (bad.length) {
  console.error(bad.join("\n"));
  console.error(`\n${bad.length} FALHARAM, ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
