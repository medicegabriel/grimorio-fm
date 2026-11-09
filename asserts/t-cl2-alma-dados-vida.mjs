/* A ALMA E OS DADOS DE VIDA (CL2, 2026-10-30), nos DOIS sistemas.

   ALMA (Livro p.311): o teste de Integridade vem ANTES do Dano na Alma, e a cura da Alma exige requisito de QUEM CURA.
   DADOS DE VIDA (p.20, 46, 335): a pilha por Especialização, o gasto com o modificador de Constituição, o limite dos Remédios,
   o dobro do Elixir da Vida e a recuperação.

   ⚠ O que NÃO muda e este arquivo vigia: o PV continua FIXO (a pilha só alimenta a cura), e `defineAlma`, `curaAlma` e
   `aplicaDanoNaAlma` seguem sendo o ajuste da barra, sem teste nem requisito. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const SE = await import(R + "ficha/ficha-sessao.js");
const AL = await import(R + "ficha/ficha-alma.js");
const DV = await import(R + "ficha/ficha-dados-vida.js");
const M = await import(R + "ficha/ficha-morte.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};
let contador = 0;
const op = () => ({ opId: `cl2-av-${++contador}` });

const ficha = (sistema, { classes = [{ id: "combatente", nivel: 10 }], con = 10, er = 0, integridade = null, treinamentos = null, origem = "inato" } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  // A criatura deste arquivo é a ANTIGA (Alma em porcentagem, com o Addon já ligado). A nova segue o livro, como o jogador.
  if (sistema === "afty") delete f.regimeAlma;
  const nivel = classes.reduce((n, c) => n + c.nivel, 0);
  f.core = { ...f.core, nd: nivel, tipo: "misto", patamar: "comum", origem: { id: origem } };
  f.especializacoes = classes;
  f.attributes = { ...f.attributes, constituicao: con };
  f.aptidoes = { ...f.aptidoes, er };
  if (integridade) f.resistenciasProf = { integridade };
  if (treinamentos) f.treinamentos = treinamentos;
  return f;
};
const com = (s, hp) => ({ ...s, hpAtual: hp });
const meio = () => 0.5;

for (const sistema of ["player", "afty"]) {
  const tag = (nome) => `${sistema}: ${nome}`;
  const f = ficha(sistema);
  const d = deriveAfty(f);
  const base = SE.sessaoEmBranco(d);
  const tr = d.testes.resistencias.find((x) => x.value === "integridade");

  /* ---------------------------------------------------------- A. O teste de Integridade */
  {
    const a = AL.testeDeIntegridade(d, { cd: tr.bonus + 12, natural: 12 });
    t(tag("12 natural na CD exata passa, sem crítico"), [a.ok, a.tr.resultado, a.tr.sucessoCritico, a.total, a.cd], [true, "sucesso", false, tr.bonus + 12, tr.bonus + 12]);
    t(tag("abaixo da CD falha"), AL.testeDeIntegridade(d, { cd: tr.bonus + 13, natural: 12 }).tr.resultado, "falha");
    t(tag("20 natural que passa é sucesso crítico"), AL.testeDeIntegridade(d, { cd: 10, natural: 20 }).tr, { resultado: "sucesso", sucessoCritico: true });
    t(tag("20 natural que NÃO passa a CD não é crítico (só o ataque garante)"), AL.testeDeIntegridade(d, { cd: 999, natural: 20 }).tr, { resultado: "falha", sucessoCritico: false });
    t(tag("sem CD é recusado"), AL.testeDeIntegridade(d, { natural: 12 }).codigo, "sem-cd");
    t(tag("d20 inválido é recusado"), AL.testeDeIntegridade(d, { cd: 10, natural: 0 }).codigo, "natural-invalido");
    t(tag("sem o teste na ficha é recusado"), AL.testeDeIntegridade({ testes: { resistencias: [] } }, { cd: 10, natural: 10 }).codigo, "sem-integridade");
    const rolado = AL.testeDeIntegridade(d, { cd: 10, rng: () => 0.99 });
    t(tag("sem natural o d20 sai do rng"), [rolado.natural, rolado.tr.sucessoCritico], [20, true]);
  }

  /* ---------------------------------------------------------- B. Dano na Alma com o teste antes */
  {
    const s0 = com(base, 30);
    const almaAntes = s0.almaAtual;
    const falha = AL.danoNaAlma(s0, d, { total: 20, cd: 99, natural: 1 }, op());
    t(tag("falhar o teste leva o dano inteiro"), [falha.aplicado, falha.sessao.almaAtual, falha.integridade.resultado], [true, almaAntes - 20, "falha"]);
    const passa = AL.danoNaAlma(s0, d, { total: 20, cd: 1, natural: 10 }, op());
    t(tag("passar o teste leva a metade"), passa.sessao.almaAtual, almaAntes - 10);
    const critico = AL.danoNaAlma(s0, d, { total: 20, cd: 1, natural: 20 }, op());
    t(tag("sucesso crítico anula o dano"), [critico.sessao.almaAtual, critico.integridade.sucessoCritico], [almaAntes, true]);
    const dado = AL.danoNaAlma(s0, d, { total: 20, tr: { resultado: "sucesso", sucessoCritico: false } }, op());
    t(tag("um resultado já rolado dispensa a CD"), [dado.aplicado, dado.sessao.almaAtual, dado.integridade], [true, almaAntes - 10, { resultado: "sucesso", sucessoCritico: false }]);
    t(tag("sem CD nem resultado é recusado e devolve a mesma sessão"), (({ sessao, codigo }) => [sessao === s0, codigo])(AL.danoNaAlma(s0, d, { total: 20 }, op())), [true, "sem-cd"]);
    t(tag("sem opId é recusado"), AL.danoNaAlma(s0, d, { total: 20, cd: 1, natural: 10 }, {}).codigo, "sem-opid");
    const fixa = { opId: "alma-fixa" };
    const uma = AL.danoNaAlma(s0, d, { total: 20, cd: 1, natural: 10 }, fixa);
    t(tag("repetir o opId não aplica o dano de novo"), (({ repetida, aplicado }) => [repetida, aplicado])(AL.danoNaAlma(uma.sessao, d, { total: 20, cd: 1, natural: 10 }, fixa)), [true, false]);
    const rolada = AL.danoNaAlma(s0, d, { total: 20, cd: 1, rng: meio }, op());
    t(tag("o teste rolado entra no log"), rolada.sessao.log[0]?.rotulo, "Integridade");
    t(tag("o PV temporário não protege a alma"), AL.danoNaAlma({ ...s0, pvTempFontes: { Casca: 50 } }, d, { total: 20, cd: 99, natural: 1 }, op()).sessao.pvTempFontes, { Casca: 50 });
    if (sistema === "player") {
      t(tag("no Player a Vida desce junto da Alma"), falha.sessao.hpAtual, 10);
      const cai = AL.danoNaAlma(com(base, 20), d, { total: 30, cd: 99, natural: 1 }, op());
      t(tag("Dano na Alma que zera a Vida é perda de vida e leva às Portas da Morte"), [cai.sessao.hpAtual, cai.sessao.vital.estado, cai.sessao.vital.saldo, cai.sessao.vital.falhas], [0, "morrendo", 10, 0]);
    } else {
      t(tag("na Criatura a Alma é porcentagem e a Vida corrente não desce aqui"), falha.sessao.hpAtual, 30);
    }
    /* O ajuste da barra NÃO foi restringido */
    t(tag("defineAlma segue ajustando sem teste nem requisito"), SE.defineAlma(base, 5, d).almaAtual, 5);
    t(tag("curaAlma segue sem requisito"), SE.curaAlma({ ...base, almaAtual: 5 }, 10, d).almaAtual, Math.min(d.almaMax, 15));
  }

  /* ---------------------------------------------------------- C. Cura da Alma: o requisito é de quem cura */
  {
    const ferido = { ...com(base, 30), almaAtual: Math.max(0, d.almaMax - 40) };
    const curadorBom = deriveAfty(ficha(sistema, { er: 4, integridade: "treinado" }));
    const sem = (c, extra = {}) => AL.curaDeAlma(ferido, d, { bruto: 20, curador: c, enxergaTracado: true, ...extra }, op());
    t(tag("sem treino em Integridade não cura"), sem(deriveAfty(ficha(sistema, { er: 4 }))).erro, "Exige Treino em Integridade");
    t(tag("Energia Reversa 3 não cura"), sem(deriveAfty(ficha(sistema, { er: 3, integridade: "treinado" }))).erro, "Exige Energia Reversa Nível 4");
    t(tag("sem enxergar o traçado não cura (treino é só o requisito)"), sem(curadorBom, { enxergaTracado: false }).erro, "Exige Compreender o Traçado da Alma");
    t(tag("sem curador não cura"), AL.curaDeAlma(ferido, d, { bruto: 20, enxergaTracado: true }, op()).codigo, "curador-inelegivel");
    const boa = sem(curadorBom);
    t(tag("elegível, a cura é REDUZIDA À METADE"), [boa.aplicado, boa.metade, boa.curado, boa.sessao.almaAtual], [true, 10, 10, ferido.almaAtual + 10]);
    t(tag("a metade arredonda para baixo"), sem(curadorBom, { bruto: 21 }).metade, 10);
    t(tag("cura de 1 vira zero e é recusada"), sem(curadorBom, { bruto: 1 }).codigo, "sem-cura");
    t(tag("só devolve o teto: a Vida corrente não sobe"), boa.sessao.hpAtual, 30);
    t(tag("corpo morto não recebe cura de Alma"), AL.curaDeAlma(SE.aplicaDano(com(base, 1), 9999, d), d, { bruto: 20, curador: curadorBom, enxergaTracado: true }, op()).codigo, "morto");
    const quase = { ...base, hpAtual: d.hp, almaAtual: d.almaMax - 10 };
    t(tag("Vida e Alma no máximo depois da cura liberam o ferimento permanente"), AL.curaDeAlma(quase, d, { bruto: 20, curador: curadorBom, enxergaTracado: true }, op()).ferimentoPermanenteLiberado, true);
    t(tag("com a Alma ainda ferida não libera"), boa.ferimentoPermanenteLiberado, false);
  }

  /* ---------------------------------------------------------- D. Recuperação da Alma por descanso (SEM ligação) */
  {
    const perdida = { ...base, almaAtual: d.almaMax - 40 };
    t(tag("recupera metade do que falta (piso)"), AL.recuperaAlmaPorDescanso(perdida, d).almaAtual, d.almaMax - 20);
    t(tag("alma íntegra não muda"), AL.recuperaAlmaPorDescanso(base, d), base);
    t(tag("o botão de descanso continua sem mexer na Alma"), SE.descansar(perdida, d).almaAtual, perdida.almaAtual);
  }

  /* ---------------------------------------------------------- E. Dados de Vida: a pilha */
  {
    const fm = ficha(sistema, { classes: [{ id: "lutador", nivel: 6 }, { id: "suporte", nivel: 4 }], con: 14 });
    const dm = deriveAfty(fm);
    const sm = SE.sessaoEmBranco(dm);
    const pilha = DV.pilhaDeDadosDeVida(dm);
    t(tag("a pilha é uma entrada por Especialização, com o dado dela"), pilha.map((c) => [c.id, c.faces, c.total, c.restantes]), [["lutador", 10, 6, 6], ["suporte", 8, 4, 4]]);
    t(tag("o modificador de Constituição vem do derive"), DV.modConParaDadosDeVida(dm), 2);
    t(tag("o Restringido tem 1d12"), DV.pilhaDeDadosDeVida(deriveAfty(ficha(sistema, { classes: [{ id: "restringido", nivel: 3 }], origem: "restringido" }))).map((c) => [c.faces, c.total]), [[12, 3]]);
    t(tag("o Especialista em Combate tem 1d10 (o exemplo da p.20)"), DV.pilhaDeDadosDeVida(deriveAfty(ficha(sistema, { classes: [{ id: "combatente", nivel: 2 }] }))).map((c) => [c.faces, c.total]), [[10, 2]]);
    t(tag("ficha sem Especialização não tem pilha"), DV.pilhaDeDadosDeVida({ especializacoes: { escolhidas: [] } }), []);
    t(tag("o PV continua fixo: a pilha não mexe no máximo"), dm.hp, deriveAfty(fm).hp);

    /* gasto */
    const ferido = com(sm, 10);
    const g = DV.gastaDadosDeVida(ferido, dm, { classeId: "lutador", quantidade: 2, rng: meio }, op());
    t(tag("2d10 com rng 0,5 = 12, mais 2 de Constituição por dado"), [g.aplicado, g.cura, g.modCon, g.sessao.hpAtual], [true, 12 + 4, 2, 26]);
    t(tag("o gasto fica na sessão"), [g.sessao.dadosVida.gastos, g.restantes], [{ lutador: 2 }, 8]);
    t(tag("a rolagem entra no log"), g.sessao.log[0]?.rotulo, "Dados de Vida");
    const g2 = DV.gastaDadosDeVida(g.sessao, dm, { classeId: "suporte", quantidade: 1, rng: meio }, op());
    t(tag("o d8 do Suporte: 5 + 2"), [g2.cura, g2.sessao.dadosVida.gastos], [7, { lutador: 2, suporte: 1 }]);
    t(tag("passar dos dados restantes é recusado"), DV.gastaDadosDeVida(g.sessao, dm, { classeId: "lutador", quantidade: 5 }, op()).codigo, "sem-dados");
    t(tag("especialização sem dados é recusada"), DV.gastaDadosDeVida(ferido, dm, { classeId: "combatente", quantidade: 1 }, op()).codigo, "classe-desconhecida");
    t(tag("quantidade zero é recusada"), DV.gastaDadosDeVida(ferido, dm, { classeId: "lutador", quantidade: 0 }, op()).codigo, "quantidade-invalida");
    t(tag("o limite do Remédio recusa passar de 4 dados"), DV.gastaDadosDeVida(ferido, dm, { classeId: "lutador", quantidade: 5, limite: 4 }, op()).codigo, "limite");
    t(tag("e aceita 4"), DV.gastaDadosDeVida(ferido, dm, { classeId: "lutador", quantidade: 4, limite: 4, rng: meio }, op()).aplicado, true);
    const elixir = DV.gastaDadosDeVida(ferido, dm, { todos: true, multiplicadorCon: 2, rng: meio }, op());
    t(tag("o Elixir usa todos os dados e soma o DOBRO da Constituição em cada um"), [elixir.cura, elixir.sessao.dadosVida.gastos, elixir.restantes], [6 * 6 + 4 * 5 + 10 * 4, { lutador: 6, suporte: 4 }, 0]);
    t(tag("sem dados restantes o Elixir é recusado"), DV.gastaDadosDeVida(elixir.sessao, dm, { todos: true }, op()).codigo, "sem-dados");
    t(tag("a cura nunca passa do máximo"), DV.gastaDadosDeVida(com(sm, dm.hp - 3), dm, { classeId: "lutador", quantidade: 6, rng: meio }, op()).sessao.hpAtual, dm.hp);
    t(tag("sem opId é recusado"), DV.gastaDadosDeVida(ferido, dm, { classeId: "lutador", quantidade: 1 }, {}).codigo, "sem-opid");
    const fixo = { opId: "dv-fixo" };
    const unico = DV.gastaDadosDeVida(ferido, dm, { classeId: "lutador", quantidade: 1, rng: meio }, fixo);
    t(tag("repetir o opId não gasta de novo"), (({ repetida, aplicado }) => [repetida, aplicado])(DV.gastaDadosDeVida(unico.sessao, dm, { classeId: "lutador", quantidade: 1, rng: meio }, fixo)), [true, false]);
    const conNeg = deriveAfty(ficha(sistema, { classes: [{ id: "lutador", nivel: 2 }], con: 6 }));
    const semVida = DV.gastaDadosDeVida(com(SE.sessaoEmBranco(conNeg), 5), conNeg, { classeId: "lutador", quantidade: 1, rng: () => 0 }, op());
    t(tag("Constituição negativa nunca tira vida: o gasto cura no mínimo zero"), [semVida.cura, semVida.sessao.hpAtual, semVida.sessao.dadosVida.gastos], [0, 5, { lutador: 1 }]);

    /* vida e morte */
    const caido = SE.aplicaDano(com(sm, 10), 10, dm);
    t(tag("nas Portas da Morte não gasta dados"), DV.gastaDadosDeVida(caido, dm, { classeId: "lutador", quantidade: 1 }, op()).codigo, "morrendo");
    t(tag("morto não gasta dados"), DV.gastaDadosDeVida(SE.aplicaDano(com(sm, 1), 9999, dm), dm, { classeId: "lutador", quantidade: 1 }, op()).codigo, "morto");
    const estab = SE.aplicaCura(SE.aplicaDano(com(sm, 10), 13, dm), 3, dm.hp);
    t(tag("estabilizado gasta e sobe o PV"), DV.gastaDadosDeVida(estab, dm, { classeId: "lutador", quantidade: 1, rng: meio }, op()).sessao.hpAtual, 8);

    /* extras do Treino de Resistência */
    const tr2 = DV.pilhaDeDadosDeVida(dm, { treinamentos: { resistencia: 2 } });
    t(tag("Treino de Resistência 2 soma 2 dados do maior tamanho"), tr2.filter((c) => c.id === DV.ID_DADOS_DO_TREINO_DE_RESISTENCIA).map((c) => [c.faces, c.total]), [[10, 2]]);
    t(tag("Treino de Resistência 1 não soma"), DV.pilhaDeDadosDeVida(dm, { treinamentos: { resistencia: 1 } }).length, 2);
    t(tag("sem Especialização nenhuma o extra também não existe"), DV.pilhaDeDadosDeVida({ especializacoes: { escolhidas: [] } }, { treinamentos: { resistencia: 4 } }), []);
    const comExtra = DV.gastaDadosDeVida(ferido, dm, { classeId: DV.ID_DADOS_DO_TREINO_DE_RESISTENCIA, quantidade: 2, treinamentos: { resistencia: 2 }, rng: meio }, op());
    t(tag("e o extra é gastável"), [comExtra.aplicado, comExtra.cura], [true, 12 + 4]);

    /* salvamento e descanso */
    t(tag("o gasto sobrevive ao salvamento"), SE.normalizaSessao(JSON.parse(JSON.stringify(g.sessao)), dm).dadosVida, { gastos: { lutador: 2 } });
    t(tag("sessão antiga abre sem dado gasto"), SE.normalizaSessao({ hpAtual: 5 }, dm).dadosVida, { gastos: {} });
    t(tag("gasto corrompido é descartado"), SE.normalizaDadosVida({ gastos: { a: -3, b: "x", c: 2.9, "": 4 } }), { gastos: { c: 2 } });
    t(tag("o botão de descanso devolve todos os dados"), SE.descansar(g2.sessao, dm).dadosVida, { gastos: {} });
    const rec = DV.recuperaDadosDeVida(g2.sessao, {}, op());
    t(tag("recuperar sem argumento devolve tudo"), [rec.aplicado, rec.devolvidos, rec.sessao.dadosVida], [true, 3, { gastos: {} }]);
    const parcial = DV.recuperaDadosDeVida(g2.sessao, { quantidade: 1 }, op());
    t(tag("recuperar uma quantidade devolve a dos mais gastos"), parcial.sessao.dadosVida, { gastos: { lutador: 1, suporte: 1 } });
    t(tag("recuperar de uma especialização só"), DV.recuperaDadosDeVida(g2.sessao, { classeId: "suporte", quantidade: 5 }, op()).sessao.dadosVida, { gastos: { lutador: 2 } });
    t(tag("sem dado gasto não há o que recuperar"), DV.recuperaDadosDeVida(sm, {}, op()).codigo, "nada-a-recuperar");
    t(tag("a leitura para a tela resume a pilha"), (({ total, restantes }) => [total, restantes])(DV.resumoDadosDeVida(g.sessao, dm)), [10, 8]);
  }
}

if (bad.length) {
  console.log(bad.join("\n"));
  console.log(`\n${bad.length} FALHA(S), ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
