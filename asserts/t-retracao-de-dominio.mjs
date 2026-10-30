import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty, mesclaFichaAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { opcoesDeriveDaSessao } = await import(R + "ficha/ficha-opcoes-derive.js");
const { linhasDeEstado, deltaDosEstados } = await import(R + "ficha/ficha-buffs.js");
const { alterarEstado } = await import(R + "ficha/efeitos/mesa-verbos.js");
const { daSessao, paraSessao } = await import(R + "ficha/efeitos/sessao-g2.js");
const { avaliarRequisitoAptidao, getAptidao } = await import(R + "afty-aptidoes.js");
const ler = (nome) => JSON.parse(readFileSync(new URL(`../addons/${nome}.json`, import.meta.url), "utf8"));
const pacote = ler("retracao-de-dominio");
const ID = "retracao-de-dominio:retracao_de_dominio";
const ESTADO = "retracao-de-dominio:retracao_ativa";
let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};
const fixture = (sistema, { dom = 3, escolhida = true, addons = [pacote], fixos = true } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 20, tipo: "conjurador", patamar: "comum" };
  f.especializacoes = [{ id: "conjurador", nivel: 20 }];
  f.aptidoes = { au: 0, cl: 0, bar: 0, er: 0, dom };
  f.aptidoesAmaldicoadas = escolhida ? [ID] : [];
  f.addons = addons;
  f.combate = { ativo: true };
  if (fixos) f.statOverrides = { hp: 200, pe: 100 };
  return f;
};
const derivar = (f, s = null) => {
  A.aplicarAddons(f.addons);
  return deriveAfty(s ? { ...f, combate: s.combate, buffsSessao: s.buffs } : f, s ? opcoesDeriveDaSessao(s) : {});
};
const estado = (d) => linhasDeEstado(d).find((e) => e.id === ESTADO);
const valores = (s) => [s.hpAtual, s.peAtual];
const maximos = (d) => [d.hp, d.pe];

t("pacote válido", A.validarPacote(pacote), []);
t("normalização mantém a ampliação", A.normalizarPacote(pacote).estadosCombate[0].ampliaRecursos, { hp: 20, pe: 20 });
t("instalação válida", A.aplicarAddons([pacote]).problemas, []);
t("Aptidão de Domínio", getAptidao(ID)?.categoria, "dominio");
const req = getAptidao(ID).requisitos[0];
t("requisito é Dom 3", req, { tipo: "trilha", trilha: "dom", valor: 3 });
t("Dom 2 não satisfaz", avaliarRequisitoAptidao(req, { niveis: { dom: 2 } }).ok, false);
t("Dom 3 satisfaz", avaliarRequisitoAptidao(req, { niveis: { dom: 3 } }).ok, true);
for (const ampliaRecursos of [{ hp: -20 }, { pe: "20" }, {}, [], { hp: Infinity }, { alma: 20 }, null]) {
  if (ampliaRecursos === null) continue;
  t(`percentual inválido ${JSON.stringify(ampliaRecursos)}`, A.validarPacote({
    ...pacote, estadosCombate: [{ ...pacote.estadosCombate[0], ampliaRecursos }],
  }).some((p) => p.includes("ampliaRecursos")), true);
}
t("condição inválida é recusada", A.validarPacote({
  ...pacote, estadosCombate: [{ ...pacote.estadosCombate[0], quando: "dom >=" }],
}).some((p) => p.includes("quando")), true);

for (const sistema of ["player", "afty"]) {
  const f = fixture(sistema);
  const d = derivar(f);
  t(`${sistema}: desativada não concede bônus`, maximos(d), [200, 100]);
  const e = estado(d);
  t(`${sistema}: controle com namespace e dono`, [e.id, e.requerAptidao, e.tipo], [ESTADO, ID, "bool"]);
  let s = { ...S.sessaoEmBranco(d), combate: { ativo: true }, hpAtual: 130, peAtual: 35 };
  const original = structuredClone(s);
  const ligada = S.alteraEstadoCombate(s, e, true, d);
  t(`${sistema}: soma somente a diferença aos atuais feridos`, valores(ligada), [170, 55]);
  t(`${sistema}: entrada preservada`, s, original);
  const noClique = S.aparaSessao(ligada, d);
  t(`${sistema}: clamp com derive antigo conserva ganho`, valores(noClique), [170, 55]);
  const ativo = derivar(f, noClique);
  t(`${sistema}: máximos com 20%`, maximos(ativo), [240, 120]);
  t(`${sistema}: não altera Integridade da Alma`, ativo.almaMax, d.almaMax);
  t(`${sistema}: fonte de PV`, ativo.partes.hp.find((p) => p.label === "Retração de Domínio")?.valor, 40);
  t(`${sistema}: fonte de PE`, ativo.partes.pe.find((p) => p.label === "Retração de Domínio")?.valor, 20);
  t(`${sistema}: não concede movimento ou níveis de Expansão`,
    [ativo.movimento, ativo.aptidao.efetivo], [d.movimento, d.aptidao.efetivo]);
  t(`${sistema}: novo clique ligado é inerte`, S.alteraEstadoCombate(noClique, e, true, ativo), noClique);
  t(`${sistema}: renderizações não repetem ganho`, valores(S.aparaSessao(S.aparaSessao(noClique, ativo), ativo)), [170, 55]);
  const salva = S.normalizaSessao(JSON.parse(JSON.stringify(noClique)), ativo);
  t(`${sistema}: recarga mantém valores`, valores(S.aparaSessao(salva, derivar(f, salva))), [170, 55]);
  const cheia = S.aparaSessao(S.alteraEstadoCombate({ ...s, hpAtual: 200, peAtual: 100 }, e, true, d), d);
  t(`${sistema}: exemplo exato completo`, [...maximos(derivar(f, cheia)), ...valores(cheia)], [240, 120, 240, 120]);
  const gastos = { ...cheia, hpAtual: 180, peAtual: 90 };
  const desligada = S.alteraEstadoCombate(gastos, e, false, ativo);
  t(`${sistema}: desligar conserva atuais que cabem`, valores(desligada), [180, 90]);
  t(`${sistema}: desligar devolve máximos`, maximos(derivar(f, desligada)), [200, 100]);
  t(`${sistema}: desligar a cheia apara nos máximos normais`, valores(S.alteraEstadoCombate(cheia, e, false, ativo)), [200, 100]);
  t(`${sistema}: desligar não reduz de novo por renderizar`, valores(S.aparaSessao(desligada, ativo)), [180, 90]);
  const semCombate = S.aplicaPatchCombate(cheia, { ativo: false });
  t(`${sistema}: fim do combate retira o bônus`, [...maximos(derivar(f, semCombate)), ...valores(S.aparaSessao(semCombate, ativo))], [200, 100, 200, 100]);
  t(`${sistema}: combate seguinte exige ativação manual`, maximos(derivar(f, S.aplicaPatchCombate(semCombate, { ativo: true }))), [200, 100]);
  t(`${sistema}: não ativa fora do combate`, S.alteraEstadoCombate({ ...s, combate: {} }, e, true, d).combate[ESTADO] ?? false, false);
  const proxima = S.proximaRodada(noClique, ativo).sessao;
  t(`${sistema}: próxima rodada não renova diferença`, valores(proxima), [170, 55]);
  const descanso = S.aparaSessao(S.descansar(cheia, ativo), ativo);
  t(`${sistema}: descanso encerra e enche recursos normais`, [...maximos(derivar(f, descanso)), ...valores(descanso)], [200, 100, 200, 100]);
  const g2 = paraSessao(alterarEstado(daSessao(s), e, true, d).mesa);
  t(`${sistema}: operação real G2 conserva ganho`, valores(S.aparaSessao(g2, d)), [170, 55]);
  const limitada = { ...e, umaVezPorRodada: true, exclusivoCom: ["outro"] };
  const uma = S.alteraEstadoCombate({ ...s, combate: { ...s.combate, outro: true } }, limitada, true, d);
  t(`${sistema}: ampliação respeita exclusivos`, uma.combate.outro, false);
  const semUma = S.alteraEstadoCombate(uma, limitada, false, ativo);
  t(`${sistema}: limite por rodada impede reativação`, S.alteraEstadoCombate(semUma, limitada, true, d), semUma);
  const chips = deltaDosEstados({ ...f }, noClique.combate, { ...opcoesDeriveDaSessao(noClique), buffs: noClique.buffs }, ativo)[ESTADO];
  t(`${sistema}: mostra delta de PV e PE`, chips.filter((c) => ["PV", "PE"].includes(c.rotulo)).map((c) => c.texto), ["+40", "+20"]);

  for (const [nome, outra] of [
    ["sem Aptidão", fixture(sistema, { escolhida: false })],
    ["Dom 2", fixture(sistema, { dom: 2 })],
    ["addon removido", fixture(sistema, { addons: [] })],
  ]) {
    outra.combate[ESTADO] = true;
    const sem = derivar(outra);
    t(`${sistema}: ${nome} não concede bônus`, maximos(sem), [200, 100]);
    t(`${sistema}: ${nome} sem controle`, !!estado(sem), false);
    t(`${sistema}: ${nome} bloqueia ativação por descritor antigo`,
      S.alteraEstadoCombate(s, e, true, sem), s);
  }

  const real = fixture(sistema, { fixos: false, addons: [ler("vida-dobrada-passivas-gratis"), ler("regras-grimorio"), pacote] });
  const realD = derivar(real);
  const realS = S.alteraEstadoCombate({ ...S.sessaoEmBranco(realD), combate: { ativo: true } }, estado(realD), true, realD);
  const realAtivo = derivar(real, realS);
  t(`${sistema}: multiplica máximos finais com outros addons`, maximos(realAtivo),
    [realD.hp + Math.floor(realD.hp * 0.2), realD.pe + Math.floor(realD.pe * 0.2)]);
  t(`${sistema}: sem overrides a atual acompanha os máximos`, valores(S.aparaSessao(realS, realD)), maximos(realAtivo));
  t(`${sistema}: export da ficha conserva pacote`, mesclaFichaAfty(JSON.parse(JSON.stringify(f))).addons[0].id, pacote.id);
}

t("frações arredondam para baixo sem erro decimal", A.ampliarMaximosRecursos(
  { hp: 203, pe: 101 }, [{ id: "x", label: "X", ampliaRecursos: { hp: 20, pe: 20 } }], { ativo: true, x: true },
).hp, 243);
t("PE negativo não gera ganho negativo", A.ampliarMaximosRecursos(
  { hp: 0, pe: -5 }, [{ id: "x", ampliaRecursos: { hp: 20, pe: 20 } }], { ativo: true, x: true },
).pe, -5);
A.limparAddons();
console.log(bad.length ? `FALHAS (${bad.length}):\n${bad.join("\n")}` : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
