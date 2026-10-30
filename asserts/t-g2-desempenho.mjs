/* O CUSTO DE UMA INTERAÇÃO NA FICHA: MESMA CONTA, MENOS TRAVADA (2026-10-19).

   O autor relatou travadas de cerca de dois segundos a cada efeito ligado (no G2, e em menor escala na ficha clássica). A medida mostrou onde o tempo ia:
   o derive é o custo da interação (14 derives num único "Confirmar Ativação": a ficha, a prova e a confirmação da operação, a prévia, o saldo, as quatro
   viradas da Linha do Tempo...), e dois blocos faziam um derive por efeito ligado DENTRO do render (as consequências do G2 e o delta dos estados da aba Buffs).
   As correções não mudam nenhuma conta, e este arquivo prova isso:
     1. o derive é guardado por (ficha, combate, buffs, opções): conta repetida volta a mesma, conta diferente é outra, e o resultado é o do \`deriveAfty\` puro;
     2. o saldo do Agora e o delta dos estados, que passaram a usar o derive guardado, dão o MESMO resultado dos módulos originais (\`saldoDoAgora\`,
        \`deltaDosEstados\`);
     3. o delta e as consequências viraram GERADORES (fatiados entre quadros): o resultado final é idêntico ao de rodar tudo de uma vez, na ordem que for, e
        cada passo devolve o controle (é o que impede a tarefa longa). */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const S = await import(R + "ficha/ficha-sessao.js");
const B = await import(R + "ficha/ficha-buffs.js");
const { opcoesDeriveDaSessao } = await import(R + "ficha/ficha-opcoes-derive.js");
const P = await import(R + "ficha/efeitos/ponte.js");
const D = await import(R + "ficha/efeitos/efeitos-dados.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ficha = createBlankAfty();
ficha.rulesVersion = "player";
ficha.core = { ...ficha.core, nd: 30, tipo: "combatente", patamar: "comum" };
ficha.especializacoes = [{ id: "combatente", nivel: 20 }, { id: "conjurador", nivel: 10 }];
ficha.habilidades = ["cmb_assumir_postura", "cmb_espirito_de_luta", "cmb_conhecimento_aplicado", "cmb_ataque_concentrado", "cmb_preparacao_rapida", "cmb_mestre_da_postura", "cmb_golpe_especial"];
ficha.escolhasHabilidade = { cmb_assumir_postura: ["cmb_postura_do_sol"] };
const derivado = (combate, buffs = []) => deriveAfty({ ...ficha, combate, buffsSessao: buffs }, {});
const d0 = derivado({ ativo: true });
const base = { ...S.sessaoEmBranco(d0), combate: { ativo: true, espiritoDeLuta: true, golpeAtroz: true, arteExecucaoSilenciosa: true, ataqueConcentrado: 2 }, rodada: 2 };
const opcoesDe = (s) => ({ ...opcoesDeriveDaSessao(s), buffs: s.buffs });

/* ---------- 1. o derive guardado ---------- */
const a = P.derivar(ficha, base);
const b = P.derivar(ficha, { ...base, rodada: 9 });
t("a mesma conta devolve a mesma conta (a rodada não entra no derive)", a === b, true);
t("o resultado é o do derive puro", JSON.stringify(a), JSON.stringify(deriveAfty({ ...ficha, combate: base.combate, buffsSessao: base.buffs }, opcoesDeriveDaSessao(base))));
const c = P.derivar(ficha, { ...base, combate: { ...base.combate, golpeAtroz: false } });
t("combate diferente é outra conta", [c === a, JSON.stringify(c) === JSON.stringify(a)], [false, false]);
const vida = P.derivar(ficha, { ...base, hpAtual: 3 });
t("a Vida atual é opção do derive e entra na chave", JSON.stringify(vida) === JSON.stringify(deriveAfty({ ...ficha, combate: base.combate, buffsSessao: [] }, opcoesDeriveDaSessao({ ...base, hpAtual: 3 }))), true);
t("outra ficha (outra identidade) tem a guarda dela", P.derivar({ ...ficha }, base) === a, false);
for (let i = 0; i < 40; i++) P.derivar(ficha, { ...base, hpAtual: 100 + i });
t("a guarda tem teto, e a conta antiga continua certa quando refeita", JSON.stringify(P.derivar(ficha, base)), JSON.stringify(a));

/* ---------- 2. o saldo e o delta, pelo derive guardado ---------- */
const comCondicao = { ...base, condicoes: [{ id: "c1", nome: "Envenenado" }] };
const dAgora = P.derivar(ficha, comCondicao);
t("o saldo do Agora é o de `saldoDoAgora`", JSON.stringify(P.saldo(ficha, comCondicao, dAgora)), JSON.stringify(B.saldoDoAgora(ficha, comCondicao.combate, opcoesDe(comCondicao), dAgora)));
t("sem nada ligado o saldo é vazio, como em `saldoDoAgora`", [P.saldo(ficha, S.sessaoEmBranco(d0), d0), B.saldoDoAgora(ficha, {}, opcoesDe(S.sessaoEmBranco(d0)), d0)], [[], []]);
const estados = B.linhasDeEstado(dAgora);
const delta = P.deltaDeEstados(ficha, comCondicao, dAgora, estados);
/* A referência é a conta ANTIGA da camada dos Efeitos, escrita aqui sem guarda: um derive puro por estado ligado, comparado pelo `compararSaldo` (chips com chave e
   valor, os que o Agora e as marcas leem). `deltaDosEstados` da aba Buffs compara por outro caminho (`comparar`, chips só de texto) e tem o assert dele abaixo. */
const referencia = {};
for (const e of estados) {
  if (!B.estaLigado(e, comCondicao.combate[e.id])) continue;
  const sem = deriveAfty({ ...ficha, combate: { ...comCondicao.combate, [e.id]: B.padraoDe(e) }, buffsSessao: comCondicao.buffs }, opcoesDeriveDaSessao(comCondicao));
  const chips = B.compararSaldo(dAgora, sem);
  if (chips.length) referencia[e.id] = chips;
}
t("o delta dos estados da camada dos Efeitos é o da conta antiga (derive puro por estado)", JSON.stringify(delta), JSON.stringify(referencia));
const original = B.deltaDosEstados(ficha, comCondicao.combate, opcoesDe(comCondicao), dAgora);
t("o cenário tem ao menos três estados com efeito (o teste prova alguma coisa)", Object.keys(original).length >= 3, true);
t("o delta da aba Buffs mexe nos mesmos estados", Object.keys(original), Object.keys(delta));
t("fora de combate o delta é vazio nos dois", [P.deltaDeEstados(ficha, { ...base, combate: { ativo: false } }, dAgora, estados), B.deltaDosEstados(ficha, { ativo: false }, opcoesDe(base), dAgora)], [{}, {}]);

/* ---------- 3. os geradores ---------- */
const ligados = estados.filter((e) => B.estaLigado(e, comCondicao.combate[e.id]));
const passosDoDelta = [];
const it = B.deltaDosEstadosEmPassos(ficha, comCondicao.combate, opcoesDe(comCondicao), dAgora);
let r = it.next();
while (!r.done) { passosDoDelta.push(Object.keys(r.value).length); r = it.next(); }
t("o delta devolve o controle depois de cada estado ligado", passosDoDelta.length, ligados.length);
t("o resultado final do gerador é o do original", JSON.stringify(r.value), JSON.stringify(original));
t("os passos só crescem (o parcial é um prefixo do final)", passosDoDelta.every((n, i) => i === 0 || n >= passosDoDelta[i - 1]), true);

const sessaoPara = comCondicao;
t("o gerador de consequências existe e a versão de uma vez só continua exportada", [typeof D.consequenciasEmPassos, typeof D.consequencias], ["function", "function"]);
/* Ativos mínimos (os que o gerenciador monta de um grupo): o importante é que a ordem de cálculo não muda o resultado. */
const fake = (chave, nome, id) => ({ chave, nome, tipo: "grupo", grupo: { chave, nome, estados: [{ id }] } });
const lista = ligados.slice(0, 4).map((e) => fake(`g:${e.id}`, e.label, e.id));
if (lista.length >= 2) {
  const todos = D.consequencias(ficha, sessaoPara, dAgora, lista);
  const jaTem = new Map([[lista[0].chave, []]]);
  const itC = D.consequenciasEmPassos(ficha, sessaoPara, dAgora, lista, jaTem);
  let passos = 0;
  let rc = itC.next();
  while (!rc.done) { passos++; rc = itC.next(); }
  t("as consequências devolvem o controle a cada derive", passos >= lista.length - 1, true);
  t("a ordem de cálculo (o que já tem resposta fica para depois) não muda o resultado", JSON.stringify([...rc.value.porAtivo.entries()].sort()), JSON.stringify([...todos.porAtivo.entries()].sort()));
  t("nem o que está coberto por outro", JSON.stringify([...rc.value.cobertos.entries()].sort()), JSON.stringify([...todos.cobertos.entries()].sort()));
  t("o resultado marca que terminou", rc.value.pronto, true);
}

/* ---------- 4. a projeção da Linha do Tempo ---------- */
const L = await import(R + "ficha/efeitos/g2-linha-do-tempo.js");
const todas = L.projetarViradas(ficha, comCondicao, dAgora);
const itL = L.projetarViradasEmPassos(ficha, comCondicao, dAgora);
const tamanhos = [];
let rl = itL.next();
while (!rl.done) { tamanhos.push(rl.value.length); rl = itL.next(); }
t("a projeção devolve o controle a cada virada (um derive cada)", tamanhos.length, L.COLUNAS);
t("o resultado final do gerador é o de rodar tudo de uma vez", JSON.stringify(rl.value), JSON.stringify(todas));
t("os passos só crescem", tamanhos.every((n, i) => i === 0 || n > tamanhos[i - 1]), true);

/* Com uma Fonte de Catálogo a conta tem dois derives, e o de base ganha um passo só dele. O resultado não muda. */
const cat = (n, v) => ({ id: "rec_cat" + n, rec: true, tipoFonte: "catalogo", origemId: "aptidao:aura_do_bastiao", origemNome: "Aura do Bastião", aplicadoPor: "Aliado " + n, beneficios: [{ canal: "defesa", valor: v }], rodadas: null });
const comCat = { ...base, buffs: [cat(1, 2), cat(2, 3)] };
const dCat = P.derivar(ficha, comCat);
const todasCat = L.projetarViradas(ficha, comCat, dCat);
const itCat = L.projetarViradasEmPassos(ficha, comCat, dCat);
let passosCat = 0;
let rcat = itCat.next();
while (!rcat.done) { passosCat++; rcat = itCat.next(); }
t("com Fonte de Catálogo a projeção tem um passo a mais por virada (o derive de base)", passosCat, L.COLUNAS * 2);
t("e o resultado é o mesmo de rodar tudo de uma vez", JSON.stringify(rcat.value), JSON.stringify(todasCat));
const listaCat = ligados.slice(0, 3).map((e) => fake(`g:${e.id}`, e.label, e.id));
const umaVez = D.consequencias(ficha, comCat, dCat, listaCat);
const itCons = D.consequenciasEmPassos(ficha, comCat, dCat, listaCat);
let rcons = itCons.next();
while (!rcons.done) rcons = itCons.next();
t("as consequências com Fonte de Catálogo dão o mesmo em passos", JSON.stringify([...rcons.value.porAtivo.entries()].sort()), JSON.stringify([...umaVez.porAtivo.entries()].sort()));

/* ---------- 5. o corte das fatias ---------- */
const { avancaFatia } = await import(R + "ficha/fatias.js");
const gasta = (ms) => { const t0 = performance.now(); while (performance.now() - t0 < ms); };
function* passos(n, ms) { for (let i = 0; i < n; i++) { gasta(ms); yield i; } return "fim"; }
const j1 = passos(6, 20);
const f1 = avancaFatia(j1, 30);
t("sempre roda ao menos um passo, e um passo de 20 ms não leva outro para dentro de 30 ms", [f1.done, f1.value], [false, 0]);
const j2 = passos(10, 8);
let n2 = 0;
for (let r = avancaFatia(j2, 30); ; r = avancaFatia(j2, 30)) { n2++; if (r.done) break; }
t("passos curtos se juntam e o job termina com o mesmo resultado", n2 < 10 && n2 > 1, true);
const j3 = passos(3, 1);
t("um job curto termina numa fatia só", [avancaFatia(j3, 30).done], [true]);
let maior = 0;
const j4 = passos(8, 15);
for (let r = null; !r?.done;) { const t0 = performance.now(); r = avancaFatia(j4, 30); maior = Math.max(maior, performance.now() - t0); }
t("nenhuma fatia passa de um passo e meio mesmo com passos de 15 ms", maior < 45, true);

console.log(bad.length ? `FALHAS (${bad.length}):\n${bad.join("\n")}` : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
