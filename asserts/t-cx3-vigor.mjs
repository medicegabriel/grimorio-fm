import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { usaIncitarVigor, dadosVidaDoConteudo } = await import(R + "ficha/ficha-conteudo-uso.js");
const { gastaDadosDeVida } = await import(R + "ficha/ficha-dados-vida.js");
let ok = 0, seq = 0;
const bad = [], t = (n, a, b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : bad.push(`${n}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
const p = () => ({ opId: `cx3-vigor-${++seq}`, registraAcao: true });
function ficha(sistema, id) {
  const c = createBlankAfty(); c.id = id; c.name = id; c.rulesVersion = sistema; c.core.nd = 20;
  c.attrMethod = "fixos"; c.attributes = { forca: 14, destreza: 12, constituicao: 13, inteligencia: 10, sabedoria: 15, presenca: 8 };
  c.core.origem = { id: "inato", bonusAtributos: { forca: 2, sabedoria: 1 } };
  c.especializacoes = [{ id: "suporte", nivel: 20 }]; c.habilidades = ["sup_incitar_vigor"]; c.pericias = { medicina: "treinado", feiticaria: "treinado" };
  c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : []; return c;
}
aplicarAddons([]);
for (const sistema of ["player", "afty"]) {
  const c = ficha(sistema, "suporte"), alvoC = ficha(sistema, "alvo");
  alvoC.especializacoes = [{ id: "lutador", nivel: 12 }, { id: "suporte", nivel: 8 }]; alvoC.habilidades = []; alvoC.treinamentos = { resistencia: 2 }; alvoC.focosLivres = 2;
  const d = deriveAfty(c), da = deriveAfty(alvoC);
  const s = S.iniciaCombate(S.sessaoEmBranco(d), d), sa = { ...S.iniciaCombate(S.sessaoEmBranco(da), da), hpAtual: 1 };
  const entrada = { classeId: "lutador", quantidade: 2, emToque: true, descontarPE: true, alvoId: "alvo", rng: () => 0.999 };
  t(`${sistema} habilidade e orçamento válidos`, [d.habilidades.inacessiveis, d.habilidades.excedeu, da.habilidades.inacessiveis, da.habilidades.excedeu], [[], false, [], false]);
  t(`${sistema} duas pilhas e dados extras nativos`, dadosVidaDoConteudo(sa, da).pilha.map((l) => [l.id, l.total, l.faces]), [["lutador", 12, 10], ["suporte", 8, 8], ["treino:resistencia", 2, 10]]);
  const pedido = p(), r = usaIncitarVigor(s, d, entrada, pedido, { sessao: sa, derived: da });
  if (!r.aplicado) throw new Error(`${sistema}: ${r.erro}`);
  t(`${sistema} bônus e dados pertencem ao alvo`, [r.cura, r.sessaoAlvo.hpAtual, r.sessaoAlvo.dadosVida.gastos], [22, 23, { lutador: 2 }]);
  t(`${sistema} custo/ação pertencem ao suporte`, [s.peAtual - r.sessao.peAtual, r.sessao.uso.acoes.gastas.bonus, r.sessao.dadosVida.gastos], [3, 1, {}]);
  t(`${sistema} não gasta ação nem PE do destinatário`, [r.sessaoAlvo.uso.acoes, r.sessaoAlvo.peAtual], [sa.uso.acoes, sa.peAtual]);
  t(`${sistema} fonte de dado leva nome da classe`, r.sessao.log[0].fontes[1], { label: "Lutador", texto: "2d10" });
  t(`${sistema} alvo conserva rolagem real`, r.sessaoAlvo.log.find((l) => l.rotulo === "Dados de Vida").total, 22);
  t(`${sistema} repetir operação não duplica custo ou dados`, usaIncitarVigor(r.sessao, d, entrada, pedido, { sessao: r.sessaoAlvo, derived: da }).repetida, true);
  const lida = S.normalizaSessao(JSON.parse(JSON.stringify(r.sessao)), d), alvoLido = S.normalizaSessao(JSON.parse(JSON.stringify(r.sessaoAlvo)), da);
  t(`${sistema} usos, dados e PV persistem`, [lida.peAtual, lida.uso.acoes, alvoLido.hpAtual, alvoLido.dadosVida], [r.sessao.peAtual, r.sessao.uso.acoes, 23, r.sessaoAlvo.dadosVida]);
  const si = { ...s, hpAtual: 1 }, propria = usaIncitarVigor(si, d, { ...entrada, classeId: "suporte", alvoId: null }, p());
  t(`${sistema} pode curar a própria ficha`, [propria.aplicado, propria.cura, propria.sessao.hpAtual, propria.sessao.dadosVida.gastos], [true, 18, 19, { suporte: 2 }]);
  t(`${sistema} própria ficha conserva custo e ação`, [si.peAtual - propria.sessao.peAtual, propria.sessao.uso.acoes.gastas.bonus], [3, 1]);
  const extra = usaIncitarVigor(s, d, { ...entrada, classeId: "treino:resistencia" }, p(), { sessao: sa, derived: da });
  t(`${sistema} dados extras do treino gastam a pilha real`, [extra.aplicado, extra.sessaoAlvo.dadosVida.gastos], [true, { "treino:resistencia": 2 }]);
  const semTreino = deriveAfty({ ...alvoC, treinamentos: {} });
  t(`${sistema} retirar treino retira pilha extra`, usaIncitarVigor(s, d, { ...entrada, classeId: "treino:resistencia" }, p(), { sessao: sa, derived: semTreino }).sessao === s, true);
  for (const [nome, alterada] of [["sem toque", { emToque: false }], ["classe errada", { classeId: "reserva" }], ["fração", { quantidade: 1.5 }], ["zero", { quantidade: 0 }], ["acima do saldo", { quantidade: 99 }]]) {
    const recusada = usaIncitarVigor(s, d, { ...entrada, ...alterada }, p(), { sessao: sa, derived: da });
    t(`${sistema} ${nome} não cobra nem altera o suporte`, [recusada.aplicado, recusada.sessao === s], [false, true]);
  }
  const pobre = { ...s, peAtual: 2 };
  t(`${sistema} PE insuficiente não gasta os dados do alvo`, usaIncitarVigor(pobre, d, entrada, p(), { sessao: sa, derived: da }).sessao === pobre, true);
  const manual = usaIncitarVigor(s, d, { ...entrada, descontarPE: false }, p(), { sessao: sa, derived: da });
  t(`${sistema} política manual informa o custo`, [manual.aplicado, manual.sessao.peAtual, manual.custo.pe.naoDescontado], [true, s.peAtual, 3]);
  const semHab = deriveAfty({ ...c, habilidades: [] });
  t(`${sistema} exige a habilidade atual`, usaIncitarVigor(s, semHab, entrada, p(), { sessao: sa, derived: da }).sessao === s, true);
  const baixo = deriveAfty({ ...c, core: { ...c.core, nd: 4 }, especializacoes: [{ id: "suporte", nivel: 4 }] });
  t(`${sistema} habilidade inacessível não funciona`, usaIncitarVigor(s, baixo, entrada, p(), { sessao: sa, derived: da }).sessao === s, true);
  for (const estado of ["morrendo", "morto"]) {
    const indisponivel = { ...sa, hpAtual: 0, vital: { ...sa.vital, estado } };
    t(`${sistema} ${estado} não gasta dados nem cobra suporte`, usaIncitarVigor(s, d, entrada, p(), { sessao: indisponivel, derived: da }).sessao === s, true);
  }
  const cheia = usaIncitarVigor(s, d, entrada, p(), { sessao: { ...sa, hpAtual: da.hp - 1 }, derived: da });
  t(`${sistema} cura respeita teto, consumindo dados escolhidos`, [cheia.sessaoAlvo.hpAtual, cheia.sessaoAlvo.dadosVida.gastos], [da.hp, { lutador: 2 }]);
  const tudoGasto = gastaDadosDeVida(sa, da, { todos: true, treinamentos: alvoC.treinamentos, rng: () => 0 }, p()).sessao;
  t(`${sistema} pilha esgotada não cobra suporte`, usaIncitarVigor(s, d, entrada, p(), { sessao: tudoGasto, derived: da }).sessao === s, true);
  const descanso = S.descansar(tudoGasto, da);
  t(`${sistema} descanso único devolve os dados`, usaIncitarVigor(s, d, entrada, p(), { sessao: descanso, derived: da }).aplicado, true);
  const impedida = S.defineCondicoes(s, [{ id: "paralisado", nome: "Paralisado" }]);
  t(`${sistema} suporte impedido não cura o destinatário`, usaIncitarVigor(impedida, d, entrada, p(), { sessao: sa, derived: da }).sessao === impedida, true);
}
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
