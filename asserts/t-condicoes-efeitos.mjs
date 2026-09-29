/* CONDIÇÕES QUE MEXEM NO NÚMERO, 2026-09-21.

   O autor mandou os textos e pediu: *"considere os efeitos númericos delas de
   maneira automatica e conte as rodadas que faltam para acabar na Ficha
   Final"*. E logo depois, em caixa alta: *"CONDIÇÕES NÃO SE ACUMULAM OS
   EFEITOS. LOGO PARALISADO (-10 DE DEFESA) E DESPREVINIDO (-3 DE DEFESA) FICA
   COMO -10 DE DEFESA E NÃO COMO -13"*.

   Este arquivo prova, nos DOIS sistemas (criatura e jogador):
     1. o exemplo do autor, número a número e no hover;
     2. que a disputa é por NÚMERO EXATO (Cego -5 em Percepção ganha do -2 de
        Envenenado só na Percepção, e as outras perícias ficam em -2);
     3. que condição SOMA com o que não é condição (buff de +2 com Paralisado
        dá -8);
     4. as inclusões (Agarrado deixa Desprevenido e Imóvel, e conta uma vez);
     5. movimento, RD zerada, falha automática e custo em PE;
     6. que sem condição NADA muda, e que a bancada não vaza para a sessão;
     7. as rodadas na sessão da Ficha e a perda de vida do Sangramento.

   ⚠ Prova NÚMERO e ESTRUTURA, e não aparência. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty, OVERRIDABLE } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const EF = await import(R + "afty-efeitos.js");
const { aplicaReducoesCustoFeitico, partesCustoFeitico } = await import(R + "afty-feiticos.js");
const COND = await import(R + "afty-condicoes.js");
const S = await import(R + "ficha/ficha-sessao.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* Uma ficha com corpo: atributos fora de 10, classe somando o nível e RD, TR e
   imunidade vindas do Motor livre da técnica, para o Fragilizado ter o que
   zerar. Patamar Comum de propósito, para a Guarda não entrar na Defesa. */
const corpo = (sistema, extra = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.name = "Cobaia";
  f.core = {
    ...f.core, nd: 12, tipo: "misto", patamar: "comum", tecnicaAttr: "presenca",
    tecnicaEfeitos: [
      { canal: "rdGeral", expr: "5" },
      { canal: "rdAlma", expr: "3" },
      { canal: "rdFisico", expr: "2" },
      { canal: "rdTipo", alvo: "acido", expr: "4" },
      { canal: "resistenciaDano", alvo: "psiquico", expr: "1" },
      { canal: "imunidadeDano", alvo: "queimante", expr: "1" },
    ],
  };
  f.especializacoes = [{ id: "combatente", nivel: 12 }];
  f.attributes = { forca: 16, destreza: 18, constituicao: 15, inteligencia: 12, sabedoria: 14, presenca: 17 };
  return Object.assign(f, extra);
};
const C = (nome, extra = {}) => ({ id: `c_${nome}`, nome, ...extra });

const pericia = (d, id) => d.testes.pericias.find((p) => p.id === id);
const tr = (d, id) => d.testes.resistencias.find((r) => r.value === id);
const ataque = (d, id) => d.testes.ataques.find((a) => a.id === id);
const manobra = (d, id) => d.testes.manobras.find((m) => m.id === id);
const hover = (partes, label) => (partes ?? []).filter((p) => p.label === label)
  .map((p) => ({ valor: p.valor, suplantado: !!p.suplantado }));
const somaDoHover = (partes) => (partes ?? []).filter((p) => !p.suplantado && typeof p.valor === "number")
  .reduce((s, p) => s + p.valor, 0);
const metadeNoQuadrado = (m) => Math.floor(m / 2 / 1.5 + 1e-9) * 1.5;

for (const sistema of ["afty", "player"]) {
  const tag = (s) => `[${sistema}] ${s}`;
  const derivar = (condicoes, extra) => deriveAfty(corpo(sistema, extra), { condicoes });
  const d0 = derivar([]);

  /* ============================================================ */
  /* 1. O EXEMPLO DO AUTOR                                         */
  /* ============================================================ */
  const dP = derivar([C("Paralisado"), C("Desprevenido")]);
  t(tag("Paralisado e Desprevenido: -10 de Defesa, e não -13"), dP.defesa - d0.defesa, -10);
  t(tag("no hover, o -10 vale"), hover(dP.partes.defesa, "Paralisado"), [{ valor: -10, suplantado: false }]);
  t(tag("e o -3 aparece riscado"), hover(dP.partes.defesa, "Desprevenido"), [{ valor: -3, suplantado: true }]);
  t(tag("as parcelas fecham no total"), somaDoHover(dP.partes.defesa), dP.defesa);
  /* O Desprevenido perdeu a Defesa, e não Reflexos: lá ele é o único. */
  t(tag("Reflexos leva o -3 do Desprevenido"), tr(dP, "reflexos").bonus - tr(d0, "reflexos").bonus, -3);
  t(tag("e a Fortitude não mexe"), tr(dP, "fortitude").bonus, tr(d0, "fortitude").bonus);
  t(tag("Paralisado marca a falha automática em Reflexos"), tr(dP, "reflexos").falhaAutomatica, ["Paralisado"]);
  t(tag("e só em Reflexos"), tr(dP, "vontade").falhaAutomatica, undefined);

  const dD = derivar([C("Desprevenido")]);
  t(tag("sozinho, o Desprevenido dá -3 de Defesa"), dD.defesa - d0.defesa, -3);

  /* ============================================================ */
  /* 2. A DISPUTA É POR NÚMERO EXATO                               */
  /* ============================================================ */
  const dEC = derivar([C("Envenenado"), C("Cego")]);
  t(tag("Cego e Envenenado: Percepção -5, e não -7"), pericia(dEC, "percepcao").bonus - pericia(d0, "percepcao").bonus, -5);
  t(tag("e as outras perícias ficam no -2 do Envenenado"), pericia(dEC, "atletismo").bonus - pericia(d0, "atletismo").bonus, -2);
  t(tag("a Atenção sai da Percepção e leva o -5 junto"), dEC.atencao - d0.atencao, -5);
  t(tag("o hover da Percepção risca o -2"),
    hover(pericia(dEC, "percepcao").partes, "Envenenado"), [{ valor: -2, suplantado: true }]);
  /* Cego deixa Surpreso, que deixa Desprevenido: -3 em Reflexos ganha do -2. */
  t(tag("Reflexos -3 pelo Desprevenido que o Cego inclui"), tr(dEC, "reflexos").bonus - tr(d0, "reflexos").bonus, -3);
  t(tag("e a Fortitude no -2 do Envenenado"), tr(dEC, "fortitude").bonus - tr(d0, "fortitude").bonus, -2);
  t(tag("o Desprevenido incluído diz de quem veio"),
    hover(dEC.partes.defesa, "Desprevenido (Cego)"), [{ valor: -3, suplantado: false }]);
  t(tag("ataque corpo a corpo -2"), ataque(dEC, "corpo").bonus - ataque(d0, "corpo").bonus, -2);

  const dEnC = derivar([C("Enredado"), C("Caído")]);
  t(tag("o exemplo do livro: Enredado e Caído dão -3 na Defesa, não -5"), dEnC.defesa - d0.defesa, -3);
  t(tag("corpo a corpo -3 do Caído"), ataque(dEnC, "corpo").bonus - ataque(d0, "corpo").bonus, -3);
  t(tag("a distância -2 do Enredado"), ataque(dEnC, "distancia").bonus - ataque(d0, "distancia").bonus, -2);

  const dAA = derivar([C("Abalado"), C("Amedrontado")]);
  t(tag("Amedrontado é evolução do Abalado: -3, e não -4"), ataque(dAA, "corpo").bonus - ataque(d0, "corpo").bonus, -3);
  t(tag("nas perícias também"), pericia(dAA, "furtividade").bonus - pericia(d0, "furtividade").bonus, -3);

  /* Bônus e penalidade disputam separado: o +10 do Invisível e o -2 do
     Envenenado valem juntos. */
  const dIE = derivar([C("Invisível"), C("Envenenado")]);
  t(tag("Invisível +10 e Envenenado -2 em Furtividade dão +8"),
    pericia(dIE, "furtividade").bonus - pericia(d0, "furtividade").bonus, 8);

  /* A Concentração é um TR de Fortitude, e já leva o -2 do Envenenado pela base. */
  const dSE = derivar([C("Sofrendo"), C("Envenenado")]);
  t(tag("Sofrendo e Envenenado: Concentração -5, e não -7"),
    manobra(dSE, "concentracao").executar - manobra(d0, "concentracao").executar, -5);
  const dS = derivar([C("Sofrendo")]);
  t(tag("sozinho, o Sofrendo dá -5 na Concentração"),
    manobra(dS, "concentracao").executar - manobra(d0, "concentracao").executar, -5);

  t(tag("Surdo: Iniciativa -5"), derivar([C("Surdo")]).iniciativa - d0.iniciativa, -5);

  /* ============================================================ */
  /* 3. CONDIÇÃO SOMA COM O QUE NÃO É CONDIÇÃO                     */
  /* ============================================================ */
  const buff = [{ canal: "defesa", expr: "2", nome: "Buff de Mesa" }];
  const dBuff = derivar([], { buffsSessao: buff });
  const dBuffP = derivar([C("Paralisado")], { buffsSessao: buff });
  t(tag("o buff de +2 soma com o Paralisado: -8"), dBuffP.defesa - d0.defesa, -8);
  t(tag("e o buff sozinho dá +2"), dBuff.defesa - d0.defesa, 2);

  /* ============================================================ */
  /* 4. INCLUSÕES                                                  */
  /* ============================================================ */
  const dAg = derivar([C("Agarrado")]);
  t(tag("Agarrado deixa Desprevenido: -3 de Defesa"), dAg.defesa - d0.defesa, -3);
  t(tag("e Imóvel: movimento zero"), dAg.movimento, 0);
  const dAgD = derivar([C("Agarrado"), C("Desprevenido")]);
  t(tag("marcado à mão e incluído conta uma vez"), dAgD.defesa - d0.defesa, -3);
  t(tag("e o hover diz o nome direto"), hover(dAgD.partes.defesa, "Desprevenido"), [{ valor: -3, suplantado: false }]);
  t(tag("sem linha repetida"), hover(dAgD.partes.defesa, "Desprevenido (Agarrado)"), []);
  t(tag("Inconsciente fica Caído: -3 de Defesa e falha em Reflexos"),
    (() => { const d = derivar([C("Inconsciente")]); return [d.defesa - d0.defesa, tr(d, "reflexos").falhaAutomatica]; })(),
    [-3, ["Inconsciente"]]);

  /* ============================================================ */
  /* 5. MOVIMENTO, RD E CUSTO                                      */
  /* ============================================================ */
  const base = d0.movimento;
  t(tag("Lento: metade, para baixo no quadrado de 1,5m"), derivar([C("Lento")]).movimento, metadeNoQuadrado(base));
  t(tag("Lento e Enredado são a mesma metade, e não um quarto"),
    derivar([C("Lento"), C("Enredado")]).movimento, metadeNoQuadrado(base));
  t(tag("Sofrendo: -3m"), derivar([C("Sofrendo")]).movimento, Math.max(0, base - 3));
  t(tag("Caído: até 4,5m"), derivar([C("Caído")]).movimento, Math.min(base, 4.5));
  t(tag("Imóvel zera por cima de tudo"), derivar([C("Imóvel"), C("Lento")]).movimento, 0);
  const dLS = derivar([C("Lento"), C("Sofrendo")]);
  t(tag("vale o MENOR resultado entre as regras"), dLS.movimento,
    Math.min(metadeNoQuadrado(base), Math.max(0, base - 3)));
  t(tag("e o hover do movimento fecha"), somaDoHover(dLS.partes.movimento), dLS.movimento);

  const dF = derivar([C("Fragilizado")]);
  t(tag("a ficha crua tem RD para zerar"), [d0.rdGeral > 0, d0.rdAlma > 0, d0.rdFisico > 0], [true, true, true]);
  t(tag("Fragilizado zera a RD Geral, a da Alma e a Física"), [dF.rdGeral, dF.rdAlma, dF.rdFisico, dF.rdEspecifico], [0, 0, 0, 0]);
  t(tag("e o hover da RD Geral fecha em zero"), somaDoHover(dF.partes.rdGeral), 0);
  t(tag("a RD por tipo também vai a zero"), dF.defesasDano.porTipo.acido.rd, 0);
  t(tag("a Resistência é anulada"), dF.defesasDano.porTipo.psiquico.estados, []);
  t(tag("e a Imunidade fica"), dF.defesasDano.porTipo.queimante.estados, ["imune"]);
  t(tag("sem o Fragilizado, a Resistência estava lá"), d0.defesasDano.porTipo.psiquico.estados, ["resistente"]);

  /* ============================================================ */
  /* 6. SEM CONDIÇÃO NADA MUDA, E A BANCADA NÃO VAZA               */
  /* ============================================================ */
  const semOpcao = deriveAfty(corpo(sistema));
  t(tag("lista vazia é a ficha de sempre"),
    OVERRIDABLE.map((k) => d0[k]), OVERRIDABLE.map((k) => semOpcao[k]));
  t(tag("e nenhum efeito de condição no Motor"),
    (d0.efeitos.detalhes ?? []).filter((x) => String(x.origem ?? "").startsWith("condicao:")).length, 0);
  /* O criador guarda a bancada em `combate.condicoes`. */
  const bancada = corpo(sistema, { combate: { condicoes: [C("Paralisado")] } });
  t(tag("a bancada vale no criador"), deriveAfty(bancada).defesa - d0.defesa, -10);
  /* A Ficha manda a lista da sessão, e ela vence a da bancada, mesmo vazia. */
  t(tag("a lista da sessão vence a bancada, mesmo vazia"), deriveAfty(bancada, { condicoes: [] }).defesa, d0.defesa);
  /* A do Ritual Estendido é escrita pela sessão com id próprio. */
  t(tag("a condição do Ritual Estendido também mexe na Defesa"),
    derivar([{ id: "ritual:desprevenido", nome: "Desprevenido", forca: "fraca", rodadas: null }]).defesa - d0.defesa, -3);

  /* O que a tela desenha. */
  const linhas = dP.condicoes.lista;
  t(tag("uma linha por condição marcada"), linhas.map((l) => l.nome), ["Paralisado", "Desprevenido"]);
  t(tag("a linha do Desprevenido risca a Defesa e mantém Reflexos"),
    linhas[1].efeitos.map((x) => [x.rotulo, x.texto, x.suplantado]),
    [["Defesa", "-3", true], ["Reflexos", "-3", false]]);
}

/* ============================================================ */
/* 7. CONDENADO: +1 NO CUSTO, DEPOIS DO PISO                     */
/* ============================================================ */
const agregado = (...detalhes) => ({ detalhes });
const condenado = { canal: "custoPE", valor: -1, nome: "Condenado" };
t("custoEmPe: +1 no custo", EF.custoEmPe(4, agregado(condenado)).valor, 5);
/* ⚠ Depois do piso: 3 com redução 5 fica em 1, e o Condenado leva a 2. */
t("custoEmPe: o piso não come o aumento",
  EF.custoEmPe(3, agregado({ canal: "custoPE", valor: 5, nome: "Redução" }, condenado)).valor, 2);
t("custoEmPe: o que não custa continua não custando", EF.custoEmPe(0, agregado(condenado)).valor, 0);

const feitico = aplicaReducoesCustoFeitico({ id: "f" }, { custoPE: 3 }, {
  efeitos: agregado({ canal: "custoPE", valor: 5, nome: "Redução" }, condenado),
});
t("Feitiço: 3 com redução 5 e Condenado custa 2", feitico.custoPE, 2);
t("e o hover fecha no custo, com o piso antes do aumento",
  partesCustoFeitico(feitico).map((p) => [p.label, p.valor]),
  [["Custo Base", 3], ["Redução", -5], ["Custo Mínimo", 3], ["Condenado", 1]]);

/* De ponta a ponta: o Domínio Simples é o gasto que sai do passe pós-aptidão, e
   o Condenado tem de chegar lá também. */
const conjurador = () => {
  const f = createBlankAfty();
  f.core.nd = 20;
  f.core.tipo = "conjurador";
  f.core.origem = { id: "herdado" };
  f.especializacoes = [{ id: "combatente", nivel: 10 }];
  f.aptidoes = { au: 0, cl: 0, bar: 0, dom: 3, er: 0 };
  f.aptidoesEscolhidas = ["dominio_simples"];
  return f;
};
const semCondenado = deriveAfty(conjurador(), { condicoes: [] });
const comCondenado = deriveAfty(conjurador(), { condicoes: [C("Condenado")] });
t("o Domínio Simples tem custo para subir", semCondenado.dominioSimples.custoErguer > 0, true);
t("Condenado: erguer o Domínio Simples custa 1 a mais",
  comCondenado.dominioSimples.custoErguer - semCondenado.dominioSimples.custoErguer, 1);

/* ============================================================ */
/* 8. A SESSÃO: RODADAS E PERDA DE VIDA                          */
/* ============================================================ */
const sessao = {
  ...S.sessaoEmBranco(null),
  hpAtual: 50,
  pvTempFontes: { "PV Temporário": 10 },
  condicoes: [
    { id: "a", nome: "Envenenado", forca: "media", rodadas: 2 },
    { id: "b", nome: "Cego", forca: "forte", rodadas: 1 },
    { id: "c", nome: "Sangramento", forca: "media", rodadas: null, sangramento: "medio" },
  ],
};
const r1 = S.proximaRodada(sessao, null);
t("a virada desce as rodadas", r1.sessao.condicoes.map((c) => [c.nome, c.rodadas]),
  [["Envenenado", 1], ["Sangramento", null]]);
t("e o que zerou sai, avisado", r1.expirou.map((c) => c.nome), ["Cego"]);
const r2 = S.proximaRodada(r1.sessao, null);
t("na virada seguinte o Envenenado acaba", r2.sessao.condicoes.map((c) => c.nome), ["Sangramento"]);

/* ⚠ Perda de vida não é dano: a casca de PV não protege. */
const sangrou = S.aplicaPerdaDeVida(sessao, 12);
t("a perda de vida desce o PV", sangrou.hpAtual, 38);
t("e não come o PV Temporário", sangrou.pvTempFontes, { "PV Temporário": 10 });
t("perda zero não mexe", S.aplicaPerdaDeVida(sessao, 0), sessao);

/* A faixa do Sangramento vira a força e o dado da linha. */
const [sang] = COND.resolveCondicoes([sessao.condicoes[2]]).ativas;
t("Sangramento Médio: força Média e 3d8",
  [sang.forcaId, sang.sangramento.dados, sang.sangramento.faces, sang.efeitos[0].texto], ["media", 3, 8, "3d8"]);

/* ============================================================ */
/* 9. O CATÁLOGO: o que a condição faz, sem ficha (2026-09-22)   */
/* ============================================================ */
/* O autor: "Deixar como uma lista não fala nada sobre nenhuma das condições".
   O catálogo mostra o número e o resumo de cada uma antes de escolher. */
const agarrado = COND.descreveCondicao("Agarrado");
t("o catálogo diz o que o Agarrado faz, pelas incluídas",
  agarrado.efeitos.map((e) => `${e.rotulo} ${e.texto}`), ["Defesa -3", "Reflexos -3", "Movimento 0m"]);
t("e diz uma vez de onde veio", COND.listaComE(agarrado.inclui), "Desprevenido e Imóvel");
t("o Cego inclui em cadeia", COND.descreveCondicao("Cego").inclui, ["Surpreso", "Desprevenido", "Lento"]);
t("condição sem número tem resumo", COND.descreveCondicao("Aterrorizado").resumo !== null, true);
t("toda condição diz alguma coisa no catálogo",
  COND.condicoesPorForca({ especiais: true }).flatMap((g) => g.condicoes)
    .filter((c) => { const d = COND.descreveCondicao(c.nome); return !d.efeitos.length && !d.resumo; })
    .map((c) => c.nome), []);

/* ============================================================ */
/* 10. O SALDO DA FAIXA "AGORA" (2026-09-22)                     */
/* ============================================================ */
/* Tudo que a aba liga, contra a ficha sem nada: uma resposta só para "onde estão
   os meus números", no lugar de vinte linhas para somar de cabeça. */
const FB = await import(R + "ficha/ficha-buffs.js");
for (const sistema of ["afty", "player"]) {
  const tag = (s) => `[${sistema}] saldo: ${s}`;
  const ficha = corpo(sistema);
  const saldo = (condicoes, buffs = []) => {
    const opcoes = { condicoes, buffs };
    const atual = deriveAfty({ ...ficha, combate: {}, buffsSessao: buffs }, { condicoes });
    return FB.saldoDoAgora(ficha, {}, opcoes, atual);
  };
  const marca = (lista, rotulo) => lista.filter((m) => m.rotulo === rotulo).map((m) => m.texto);
  t(tag("nada ligado, saldo vazio"), saldo([]), []);
  const s1 = saldo([C("Paralisado"), C("Envenenado")], [{ canal: "defesa", expr: "2", nome: "Buff" }]);
  t(tag("a Defesa é o líquido: -10 do Paralisado e +2 do buff"), marca(s1, "Defesa"), ["−8"]);
  t(tag("as perícias viram UMA marca"), marca(s1, "Perícias"), ["−2"]);
  t(tag("a falha automática aparece"), marca(s1, "Reflexos").includes("Falha"), true);
  const s2 = saldo([C("Envenenado"), C("Cego")]);
  t(tag("a exceção sai ao lado do grupo"), [marca(s2, "Perícias"), marca(s2, "Percepção")], [["−2"], ["−5"]]);
  t(tag("a Defesa diz onde ficou"),
    s1.find((m) => m.rotulo === "Defesa").final,
    String(deriveAfty({ ...ficha, buffsSessao: [{ canal: "defesa", expr: "2", nome: "Buff" }] }, { condicoes: [C("Paralisado"), C("Envenenado")] }).defesa));
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
