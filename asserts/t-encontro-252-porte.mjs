/* O Encontro Unificado, etapa 4 (2026-11-17): o porte da conta da 2.5.2 (`encontros/motores/m252.js` e `m252-vital.js`).
   Os valores de ouro foram ESCRITOS A MÃO a partir da leitura do `CombatantPanel.jsx`, do `EncounterTracker.jsx` e do
   `useEncounter.js` (cada caso diz a conta), e nunca colados da saída do módulo. A equivalência é contra as funções
   puras que a 2.5.2 exporta (`fm-encounter.js`, `fm-modifiers.js`, `fm-automation-entities.js`), nos mesmos casos.
   Ver docs/afty-encontros.md. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
};
const SRC = new URL("../src/", import.meta.url).href;
const A = SRC + "systems/afty/";
const E = A + "encontros/";
const { deriveAfty } = await import(A + "afty-derive.js");
const { createBlankAfty } = await import(A + "afty-schema.js");
const S = await import(A + "ficha/ficha-sessao.js");
const Mo = await import(E + "motores/index.js");
const V = await import(E + "motores/m252-vital.js");
const M = await import(E + "modelo.js");
const O = await import(E + "operacoes.js");
const { redutorDoEncontro: R, mundoDe } = await import(E + "redutor.js");
const FE = await import(SRC + "fm-encounter.js");
const FM = await import(SRC + "components/fm-modifiers.js");
const AE = await import(SRC + "components/fm-automation-entities.js");
const FC = await import(SRC + "components/fm-conditions.js");
const { readFileSync } = await import("node:fs");
const { fileURLToPath } = await import("node:url");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

const m252 = Mo.motor252;
const MENOS = String.fromCharCode(0x2212); // o sinal de menos das frases do painel
const TRAVESSAO = String.fromCharCode(0x2014);

/* ============================================================ */
/* As fichas e os estados                                        */
/* ============================================================ */
const STATS = {
  hpMax: 100, peMax: 20, guardaInabavalMax: 10, rdGeral: 5, rdIrredutivel: 2,
  resistenciaParcialMax: 2, resistenciaTotalMax: 1, defesa: 15, iniciativa: 3,
};
const regra = (id, nome, gatilho, efeitos, { activation = "toggle", pe = 0, requires = "" } = {}) => ({
  id, name: nome, enabled: true, trigger: { type: gatilho }, activation, cost: { pe, acao: "" }, requires, effects: efeitos,
});
const efeitoRecurso = (id, resource, op, value) => ({ id, type: "resource", resource, op, value, valueExpr: "" });
const efeitoStat = (id, stat, value, rodadas = 3) => ({ id, type: "modify_stat", stat, op: "add", value, valueExpr: "", stack: "sum", duration: { kind: "rounds", rounds: rodadas } });
const efeitoCondicao = (id, condition, rodadas = 2) => ({ id, type: "condition", op: "apply", condition, duration: { kind: "rounds", rounds: rodadas } });
const entidade = (id, name, regras) => ({ id, name, automation: { enabled: true, rules: regras } });
const ficha = (extra = {}) => ({
  id: "gob252", name: "Goblin", core: { nd: 5, bonusTreinamento: 4, patamar: "comum" },
  attributes: { forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 },
  stats: { ...STATS }, saves: {}, features: [], ...extra,
});
const estado = (snap, sobre = {}) => ({ ...V.estadoInicial(snap), ...sobre });
const deriv = (snap, cs) => m252.derivar(snap, cs);
/* Guarda desligada: o dano vai direto na Vida, para os casos de RD ficarem puros. */
const SEM_GUARDA = { guardaAbsorbsFirst: false, rdReducao: true };

const AMB = { agora: () => 1000, aleatorio: () => 0.5, dataIso: () => "2026-11-17T00:00:00.000Z" };

const comRelogioFixo = (fn) => {
  const agora = Date.now;
  const sorteio = Math.random;
  let i = 0;
  Date.now = () => 42;
  Math.random = () => ++i / 1000;
  try { return fn(); } finally { Date.now = agora; Math.random = sorteio; }
};
const semCarimbos = (x) => JSON.parse(JSON.stringify(x, (k, v) => (k === "appliedAt" || k === "timestamp" ? undefined : v)));

/* ============================================================ */
/* 1. A interface                                                */
/* ============================================================ */
t("o adaptador da 2.5.2 tem a interface inteira", Mo.faltasDoAdaptador(m252), []);
t("e nenhum verbo ficou sem corpo", Object.keys(m252).filter((k) => Mo.VERBOS_DO_MOTOR.includes(k) && typeof m252[k] !== "function"), []);
t("o registro dele cresce pelo fim, e todo verbo de número exige o derivado", [m252.registroNoFim, m252.sempreDerivado], [true, true]);
t("os dados do diff seguem o createInitialCombatState", [m252.campoDoEstado, m252.campoDoRegistro, m252.porChave, m252.relativos, m252.soltosNoDesfazer, m252.ignorados],
  ["combatState", "combatLog", ["peTempSources"], [["hpCurrent"], ["peCurrent"], ["almaAtual"], ["guardaInabavalCurrent"], ["peTempSources", "*"]], [["lastDamage"]], ["combatLog", "historico"]]);
t("o derivado ausente lança Ficha sem Cálculo, e não pula calado", (() => { try { m252.aplicarDano(estado(ficha()), null, 5); return "sem erro"; } catch (e) { return e.message; } })(), "Ficha sem Cálculo");
t("aparar e normalizar são identidade (a Vida acima do máximo é PV temporário)", (() => {
  const cs = estado(ficha(), { hpCurrent: 130, peCurrent: 27 });
  return [m252.aparar(cs, deriv(ficha(), cs)) === cs, m252.normalizarEstado(cs) === cs];
})(), [true, true]);
t("o estado inicial segue createInitialCombatState dos stats", m252.estadoInicial(ficha()), FE.createInitialCombatState(STATS));
t("e respeita o combatState que a ficha já traz, como o createCombatant", (() => {
  const snap = ficha({ combatState: { hpCurrent: 37, hpMaxBase: 100, peCurrent: 5 } });
  const e = m252.estadoInicial(snap);
  return [e.hpCurrent, e.peCurrent, e !== snap.combatState];
})(), [37, 5, true]);

/* ============================================================ */
/* 2. RD, Guarda Inabalável e Vida (setVital)                    */
/* ============================================================ */
const snapA = ficha();
const snapSG = ficha({ combatSettings: SEM_GUARDA });
let cs = estado(snapA);
let d = deriv(snapA, cs);
t("controle: Vida 100, PE 20, Guarda 10, Alma 100", [cs.hpCurrent, cs.peCurrent, cs.guardaInabavalCurrent, cs.almaAtual], [100, 20, 10, 100]);
// Dano 20, RD 5: 15. A Guarda (10) absorve 10, sobram 5 na Vida.
let r = m252.aplicarDano(cs, d, 20);
t("dano 20: RD 5 corta para 15, a Guarda absorve 10, a Vida perde 5", [r.hpCurrent, r.guardaInabavalCurrent, r.lastDamage], [95, 0, 15]);
// Guarda 10, dano 25: 20 depois da RD, 10 na Guarda, 10 na Vida.
r = m252.aplicarDano(cs, d, 25);
t("dano 25: Guarda 10 e Vida 90", [r.hpCurrent, r.guardaInabavalCurrent], [90, 0]);
// Guarda 10, dano 8: 3 depois da RD, a Guarda fica com 7.
r = m252.aplicarDano(cs, d, 8);
t("dano 8: só a Guarda sofre (10 para 7), a Vida fica", [r.hpCurrent, r.guardaInabavalCurrent, r.lastDamage], [100, 7, 3]);
// Dano menor que a RD não causa nada.
r = m252.aplicarDano(cs, d, 4);
t("dano 4 abaixo da RD 5: nada cai e o último dano é 0", [r.hpCurrent, r.guardaInabavalCurrent, r.lastDamage], [100, 10, 0]);
// Guarda desligada nos Ajustes: o dano vai direto na Vida.
const csSG = estado(snapSG);
r = m252.aplicarDano(csSG, deriv(snapSG, csSG), 20);
t("Guarda desligada: dano 20 vira 15 na Vida e a Guarda fica", [r.hpCurrent, r.guardaInabavalCurrent], [85, 10]);
// combatSettings presente mas sem guardaAbsorbsFirst: o valor é undefined, e a Guarda NÃO absorve.
const snapParcial = ficha({ combatSettings: { rdReducao: true } });
const csParc = estado(snapParcial);
r = m252.aplicarDano(csParc, deriv(snapParcial, csParc), 20);
t("combatSettings sem guardaAbsorbsFirst: a Guarda não absorve", [r.hpCurrent, r.guardaInabavalCurrent], [85, 10]);
// RD desligada: dano cheio.
const snapSemRd = ficha({ combatSettings: { guardaAbsorbsFirst: false, rdReducao: false } });
const csSemRd = estado(snapSemRd);
r = m252.aplicarDano(csSemRd, deriv(snapSemRd, csSemRd), 20);
t("rdReducao desligada: dano 20 inteiro", r.hpCurrent, 80);
// Ignorar RD: ativo zera a Geral (sobra a Irredutível 2): dano 20 vira 18.
r = m252.aplicarDano(V.emIgnorarRdAtivo(csSG, true), deriv(snapSG, V.emIgnorarRdAtivo(csSG, true)), 20);
t("Ignorar RD ativo: sobra só a Irredutível, dano 18", r.hpCurrent, 82);
// Ignorar parcial 1: RD = min(5, max(2, 5-1)) = 4, dano 16. Ignorar 3: max(2, 2) = 2, dano 18. Ignorar 9: piso 2.
const comIgnorar = (v) => { const x = V.emIgnorarRdValor(csSG, v); return m252.aplicarDano(x, deriv(snapSG, x), 20).hpCurrent; };
t("Ignorar RD parcial: 1 dá 84, 3 dá 82, 9 também 82 (a Irredutível é o piso)", [comIgnorar(1), comIgnorar(3), comIgnorar(9)], [84, 82, 82]);
t("o valor de Ignorar RD não fica negativo", V.emIgnorarRdValor(csSG, -3).ignorarRdValor, 0);
// Irredutível acima da Geral: a RD nunca passa da Geral.
const snapIrr = ficha({ stats: { ...STATS, rdGeral: 3, rdIrredutivel: 8 }, combatSettings: SEM_GUARDA });
const csIrr = estado(snapIrr);
t("a RD nunca passa da Geral (Geral 3, Irredutível 8: RD 3)", m252.aplicarDano(csIrr, deriv(snapIrr, csIrr), 20).hpCurrent, 83);
// RD AO VIVO: a Alma em 20% dá Fragilizado, que zera a RD Geral. Dano 20 inteiro, e não 15.
const csAlma20 = estado(snapSG, { almaAtual: 20, hpCurrent: 20 });
const dAlma20 = deriv(snapSG, csAlma20);
t("o derivado é AO VIVO: Alma 20 zera a RD Geral por Fragilizado", [dAlma20.stats.rdGeral, snapSG.stats.rdGeral, dAlma20.stats.defesa], [0, 5, 11]);
t("e o dano usa essa RD: 20 inteiro, e a Vida vai a 0", m252.aplicarDano(csAlma20, dAlma20, 20).hpCurrent, 0);

/* PV temporário: o excedente da Vida acima do máximo. */
const csPvT = estado(snapSG, { hpCurrent: 115, guardaInabavalCurrent: 0 });
const dPvT = deriv(snapSG, csPvT);
t("PV temporário: dano 20 (RD 5, 15) consome o excedente primeiro", m252.aplicarDano(csPvT, dPvT, 20).hpCurrent, 100);
t("a cura normal NÃO restaura nem reduz o PV temporário (115 fica 115)", m252.aplicarCura(csPvT, dPvT, 10).hpCurrent, 115);
t("a cura capa no máximo: 70 mais 50 dá 100", m252.aplicarCura(estado(snapSG, { hpCurrent: 70 }), dPvT, 50).hpCurrent, 100);
t("a cura não reduz o excedente: 130 mais 5 fica 130", m252.aplicarCura(estado(snapSG, { hpCurrent: 130 }), dPvT, 5).hpCurrent, 130);
// Cura limitada pela Alma: Alma 60 deixa 60 de máximo.
const csAlma60 = estado(snapSG, { almaAtual: 60, hpCurrent: 40 });
t("a cura é limitada pela Alma (Alma 60: máximo 60)", m252.aplicarCura(csAlma60, deriv(snapSG, csAlma60), 100).hpCurrent, 60);
/* Guarda como barra (CombatantPanel :1620-1633). */
t("a barra da Guarda: v menor que 0 passa para a Vida", (() => { const x = V.emVital(cs, d, "guarda", -4); return [x.guardaInabavalCurrent, x.hpCurrent]; })(), [0, 96]);
t("a barra da Guarda: v capa no máximo 10", V.emVital(cs, d, "guarda", 99).guardaInabavalCurrent, 10);

/* ============================================================ */
/* 3. PE e o PE temporário por fonte                             */
/* ============================================================ */
const csPe = estado(snapA, { peCurrent: 24, peTempSources: { "Treino de Energia": 4 } });
const dPe = deriv(snapA, csPe);
// Gasto de 6: PE 24 para 18, e o PE temporário (4) é drenado primeiro: a fonte zera e some.
r = m252.gastarPe(csPe, dPe, 6);
t("gastar 6 PE: 24 para 18, a fonte de 4 zera e some", [r.peCurrent, r.peTempSources], [18, {}]);
// Gasto de 2: a fonte fica com 2.
r = m252.gastarPe(csPe, dPe, 2);
t("gastar 2 PE: 22, a fonte fica com 2", [r.peCurrent, r.peTempSources], [22, { "Treino de Energia": 2 }]);
t("gastar mais que o PE vai a 0 e nunca abaixo", m252.gastarPe(estado(snapA, { peCurrent: 5 }), dPe, 9).peCurrent, 0);
t("duas fontes são drenadas em ordem", AE.drainPeTemp({ a: 3, b: 5 }, 4), { b: 4 });
t("recuperar PE capa no máximo: 15 mais 10 dá 20", m252.recuperarPe(estado(snapA, { peCurrent: 15 }), dPe, 10).peCurrent, 20);
t("recuperar PE não reduz o excedente: 24 mais 3 fica 24", m252.recuperarPe(csPe, dPe, 3).peCurrent, 24);
/* O começo da rodada: a MESMA fonte não soma, só topa no maior (applyRoundStartResources). */
const entTreino = entidade("f_te", "Treino de Energia", [regra("rT", "Treino", "round_start", [efeitoRecurso("e1", "pe", "add", 4)])]);
const entPot = entidade("f_pf", "Potencial Físico", [regra("rP", "Potencial", "round_start", [efeitoRecurso("e1", "pe", "add", 6)])]);
const snapTreino = ficha({ features: [entTreino] });
const avisos = [];
const op = (extra = {}) => ({ abatido: false, nome: "Goblin", avisar: (tipo, mensagem) => avisos.push([tipo, mensagem]), ...extra });
let c1 = m252.iniciaCombate(estado(snapTreino), deriv(snapTreino, estado(snapTreino)), op());
t("começar: o Treino de Energia dá 4 de PE temporário (20 para 24), por fonte", [c1.peCurrent, c1.peTempSources], [24, { "Treino de Energia": 4 }]);
t("e a frase do Registro avisa o ganho", avisos.splice(0), [["livre", "Goblin: +4 PE (início da rodada)"]]);
let c2 = m252.viraRodada(c1, deriv(snapTreino, c1), op()).estado;
t("a virada seguinte NÃO soma a mesma fonte (24 fica 24)", [c2.peCurrent, c2.peTempSources, avisos.splice(0)], [24, { "Treino de Energia": 4 }, []]);
const snapDuas = ficha({ features: [entTreino, entPot] });
let c3 = m252.iniciaCombate(estado(snapDuas), deriv(snapDuas, estado(snapDuas)), op());
t("duas fontes diferentes somam (20 mais 4 mais 6 dá 30)", [c3.peCurrent, c3.peTempSources], [30, { "Treino de Energia": 4, "Potencial Físico": 6 }]);
avisos.splice(0);
// A fonte que sobe: Treino passa de 4 para 6 depois que o PE temporário foi gasto até 1.
const entTreino6 = entidade("f_te", "Treino de Energia", [regra("rT", "Treino", "round_start", [efeitoRecurso("e1", "pe", "add", 6)])]);
const snapT6 = ficha({ features: [entTreino6] });
const cT = estado(snapT6, { peCurrent: 21, peTempSources: { "Treino de Energia": 1 } });
const rT = m252.viraRodada(cT, deriv(snapT6, cT), op()).estado;
t("a fonte topa no maior e aplica só a diferença (1 para 6: mais 5)", [rT.peCurrent, rT.peTempSources], [26, { "Treino de Energia": 6 }]);
avisos.splice(0);

/* ============================================================ */
/* 4. Alma                                                       */
/* ============================================================ */
const dB = deriv(snapA, cs);
// Dano na Alma 30: Alma 70 (Danificado), Vida 100 menos 30 dá 70, e o teto da Alma é 70.
r = m252.alma(cs, dB, { modo: "dano", valor: 30 });
t("dano na Alma 30: a Alma e a Vida vão a 70, ignorando a Guarda", [r.almaAtual, r.hpCurrent, r.guardaInabavalCurrent], [70, 70, 10]);
t("a Alma 70 é Danificado (pct 70, entre 50 e 75)", V.estadoDaAlma(r, 100).estadoKey, "danificado");
// Dano na Alma 90: Alma 10, Vida 100 menos 90 dá 10.
t("dano na Alma 90: Alma 10 e Vida 10 (Crítico)", (() => { const x = m252.alma(cs, dB, { modo: "dano", valor: 90 }); return [x.almaAtual, x.hpCurrent, V.estadoDaAlma(x, 100).estadoKey]; })(), [10, 10, "critico"]);
// Alma a 0: desativa e a Vida nunca passa do teto 0.
t("a Alma destruída desativa a criatura", (() => { const x = m252.alma(cs, dB, { modo: "dano", valor: 100 }); return [x.almaAtual, x.hpCurrent, x.isActive]; })(), [0, 0, false]);
t("o dano na Alma não passa de 0", m252.alma(cs, dB, { modo: "dano", valor: 400 }).almaAtual, 0);
// Cura na Alma: 70 mais 20 dá 90, e a Vida passa a ter teto 90.
const csA70 = { ...cs, almaAtual: 70, hpCurrent: 100 };
r = m252.alma(csA70, deriv(snapA, csA70), { modo: "cura", valor: 20 });
t("cura na Alma: 90, e a Vida 100 é aparada em 90 (a Alma ainda esmaga)", [r.almaAtual, r.hpCurrent], [90, 90]);
t("cura na Alma não passa do máximo base", m252.alma(csA70, deriv(snapA, csA70), { modo: "cura", valor: 500 }).almaAtual, 100);
// Alma cheia NÃO clampa o PV temporário (hpMaxAtual === hpMaxBase).
const csPvAlma = estado(snapA, { hpCurrent: 115 });
t("Alma cheia preserva o PV temporário (115 fica 115 ao definir a Alma em 100)", m252.alma(csPvAlma, deriv(snapA, csPvAlma), { modo: "definir", valor: 100 }).hpCurrent, 115);
// Definir a Alma para cima de uma Alma crítica.
t("definir a Alma é pelo valor, limitado ao máximo base", [m252.alma(csA70, deriv(snapA, csA70), { modo: "definir", valor: 40 }).almaAtual, m252.alma(csA70, deriv(snapA, csA70), { modo: "definir", valor: 400 }).almaAtual], [40, 100]);
// Estados da Alma: custo e penalidade (EncounterTracker usa o mesmo computeAlmaStatus).
t("os estados da Alma: 100 Estável, 60 Danificado... 80 Estável", [100, 80, 60, 40, 20, 0].map((a) => FE.computeAlmaStatus(a, 100).estadoKey), ["estavel", "estavel", "danificado", "instavel", "critico", "destruido"]);
t("a penalidade da Alma entra nos testes AO VIVO (Instável: menos 6 em acerto)", (() => {
  const snap = ficha({ stats: { ...STATS, acerto: 10 } });
  const c = estado(snap, { almaAtual: 40 });
  return deriv(snap, c).stats.acerto;
})(), 4);

/* ============================================================ */
/* 5. Condições e modificadores                                  */
/* ============================================================ */
t("as condições nascem como no ConditionManager (nível da tabela, duração 1)", V.novaCondicao({ nome: "abalado" }, AMB),
  { id: "cond_1000_i", name: "abalado", level: "fraca", duracao: 1, appliedAt: "2026-11-17T00:00:00.000Z" });
t("Caído e Sangramento não têm duração, e o nível vem da tabela", [V.novaCondicao({ nome: "caido" }, AMB).duracao, V.novaCondicao({ nome: "sangramento forte" }, AMB), V.novaCondicao({ nome: "cego" }, AMB).level],
  [null, { id: "cond_1000_i", name: "sangramento forte", level: "forte", duracao: null, appliedAt: "2026-11-17T00:00:00.000Z" }, "forte"]);
t("nome vazio não é condição", V.novaCondicao({ nome: "  " }, AMB), null);
let cc = m252.condicao(cs, dB, { modo: "adicionar", condicao: "lento" });
t("adicionar pelo nome entra na lista", cc.activeConditions.map((x) => [x.name, x.level, x.duracao]), [["lento", "media", 1]]);
t("a mesma condição, por nome sem acento e sem caixa, não duplica", m252.condicao(cc, dB, { modo: "adicionar", condicao: "LENTO" }) === cc, true);
t("a condição do Estado da Alma também não se duplica à mão (Alma 20: Exposto)", (() => {
  const c = estado(snapA, { almaAtual: 20, hpCurrent: 20 });
  return m252.condicao(c, deriv(snapA, c), { modo: "adicionar", condicao: "exposto" }) === c;
})(), true);
t("remover por id e por nome", [m252.condicao(cc, dB, { modo: "remover", condicao: cc.activeConditions[0].id }).activeConditions, m252.condicao(cc, dB, { modo: "remover", condicao: "Lento" }).activeConditions], [[], []]);
t("definir troca a lista inteira", m252.condicao(cc, dB, { modo: "definir", condicoes: [{ id: "x", name: "cego", level: "forte", duracao: 2 }] }).activeConditions.map((x) => x.name), ["cego"]);
t("a condição mexe nos números AO VIVO (Atordoado: Defesa menos 3)", (() => {
  const c = m252.condicao(cs, dB, { modo: "adicionar", condicao: "atordoado" });
  return deriv(snapA, c).stats.defesa;
})(), 12);
t("o resumo mostra as condições da lista e as da Alma, sem repetir", m252.resumo(estado(snapA, { almaAtual: 20, hpCurrent: 20, activeConditions: [{ id: "a", name: "Exposto" }, { id: "b", name: "lento" }] }), deriv(snapA, estado(snapA, { almaAtual: 20, hpCurrent: 20 }))).condicoes,
  ["Exposto", "lento", "Fragilizado"]);
/* O modificador manual (ModifierManager :742-754). */
t("o modificador manual: soma zero não entra, e rodadas viram duração", [V.novoModificadorManual({ valor: 0 }), (() => { const m = V.novoModificadorManual({ nome: "Bênção", stat: "defesa", valor: 2, duracao: "rounds", rodadas: 3 }); return [m.name, m.stat, m.value, m.duration]; })()],
  [null, ["Bênção", "defesa", 2, { kind: "rounds", rounds: 3 }]]);
const modDef = V.novoModificadorManual({ nome: "Bênção", stat: "defesa", valor: 2, duracao: "rounds", rodadas: 3 });
const csMod = V.emModificadorAdicionado(cs, modDef);
t("o modificador entra nos stats AO VIVO (Defesa 15 para 17) e sai pelo id", [deriv(snapA, csMod).stats.defesa, deriv(snapA, V.emModificadorRemovido(csMod, modDef.id)).stats.defesa], [17, 15]);

/* ============================================================ */
/* 6. Resistência Parcial e Total, Suscetível, Desafiando a Morte, contador de erros */
/* ============================================================ */
t("Resistência Parcial e Total: usados", [V.emResistenciaParcial(cs, 1).resistenciaParcialUsed, V.emResistenciaTotal(cs, 1).resistenciaTotalUsed], [1, 1]);
t("os botões do contador: gastar capa no máximo, recuperar não passa de 0", [V.contadorGastar(0, 2), V.contadorGastar(2, 2), V.contadorGastar(1, 1), V.contadorRecuperar(2), V.contadorRecuperar(0)], [1, 2, 1, 1, 0]);
t("o estado inicial traz os dois contadores zerados", [cs.resistenciaParcialUsed, cs.resistenciaTotalUsed], [0, 0]);
t("o Suscetível à Finalização liga e desliga", [V.emSuscetivel(cs, true).susceptivelFinalizacao, V.emSuscetivel(V.emSuscetivel(cs, true), false).susceptivelFinalizacao], [true, false]);
// Desafiando a Morte: Vida 0 ou menos e não abatido. CD 25 mais 1 a cada 50 abaixo de 0 (EncounterTracker :645-647).
t("Desafiando a Morte: Vida 0 é CD 25, menos 120 é CD 27 (25 mais 2), menos 49 é 25, menos 50 é 26",
  [0, -120, -49, -50].map((h) => V.desafiandoAMorte({ hpCurrent: h }).cd), [25, 27, 25, 26]);
t("Desafiando a Morte só com Vida 0 ou menos e fora do Abatido", [1, 0].map((h) => V.desafiandoAMorte({ hpCurrent: h }).ativo).concat(V.desafiandoAMorte({ hpCurrent: -5 }, { abatido: true }).ativo), [false, true, false]);
t("Desafiando a Morte carrega o Suscetível", V.desafiandoAMorte({ hpCurrent: -5, susceptivelFinalizacao: true }), { ativo: true, cd: 25, suscetivel: true });
t("o resumo marca caído com a Vida em 0 e morto com a Alma destruída", (() => {
  const c0 = estado(snapA, { hpCurrent: 0 });
  const cm = estado(snapA, { almaAtual: 0, hpCurrent: 0 });
  return [m252.resumo(c0, deriv(snapA, c0)).caido, m252.resumo(c0, deriv(snapA, c0)).morto, m252.resumo(cm, deriv(snapA, cm)).morto];
})(), [true, false, true]);
t("o contador de erros: 3 abate, 2 não (DEFEAT_CHECKS)", [V.abatidoAutomatico({ missCounter: 2 }), V.abatidoAutomatico({ missCounter: 3 }), V.abatidoAutomatico({}), V.abatidoAutomatico({ missCounter: 7 })], [false, true, false, true]);

/* ============================================================ */
/* 7. activateRule                                               */
/* ============================================================ */
const ruFuria = regra("rA", "Fúria", "activated", [efeitoStat("e1", "defesa", 2, 3), efeitoRecurso("e2", "hp_temp", "add", 10), efeitoCondicao("e3", "abalado", 2)], { pe: 3 });
const entFuria = entidade("f1", "Berserker", [ruFuria]);
const snapF = ficha({ features: [entFuria] });
const csF = estado(snapF);
const dF = deriv(snapF, csF);
let at = V.ativarRegra(csF, dF, ruFuria, "Berserker", "caracteristica", { combatenteId: "c1", ambiente: AMB });
t("ativar: custa 3 PE, põe o modificador, soma 10 de PV temporário e aplica Abalado por 2",
  [at.estado.peCurrent, at.estado.hpCurrent, at.estado.activeModifiers.map((m) => [m.id, m.name, m.stat, m.value, m.duration, m.source.ruleId, m.group]), at.estado.activeConditions.map((c) => [c.name, c.level, c.duracao, c.source])],
  [17, 110, [["rA__e1", "Berserker", "defesa", 2, { kind: "rounds", rounds: 3 }, "rA", "caracteristica"]], [["abalado", "fraca", 2, { ruleId: "rA" }]]]);
t("a frase do Registro e o aviso (sem travessão, com dois-pontos)", [at.estado.combatLog.map((l) => l.message), at.feedback],
  [[`Berserker: ativou Fúria: Defesa +2 por 3 rodada(s), PV Temporário +10, Aplica Abalado por 2 rodada(s) (${MENOS}3 PE)`], { kind: "on", text: `Fúria: Defesa +2 por 3 rodada(s), PV Temporário +10, Aplica Abalado por 2 rodada(s) (${MENOS}3 PE)` }]);
t("o Registro leva o id do combatente e a rodada 0, como o painel", [at.estado.combatLog[0].combatantId, at.estado.combatLog[0].round, at.estado.combatLog[0].type], ["c1", 0, "custom"]);
t("o modificador ativado muda os números AO VIVO (Defesa 15 para 17)", deriv(snapF, at.estado).stats.defesa, 17);
let off = V.ativarRegra(at.estado, deriv(snapF, at.estado), ruFuria, "Berserker", "caracteristica", { ambiente: AMB });
t("ligar de novo (toggle) desativa, não devolve o PE e anota", [off.estado.activeModifiers, off.estado.peCurrent, off.estado.combatLog.map((l) => l.message), off.feedback],
  [[], 17, [`Berserker: ativou Fúria: Defesa +2 por 3 rodada(s), PV Temporário +10, Aplica Abalado por 2 rodada(s) (${MENOS}3 PE)`, "Berserker: desativou Fúria"], { kind: "off", text: "Desativou Fúria" }]);
const baixo = estado(snapF, { peCurrent: 2 });
let bloq = V.ativarRegra(baixo, deriv(snapF, baixo), ruFuria, "Berserker", null, { ambiente: AMB });
t("PE insuficiente bloqueia, devolve o mesmo estado e explica", [bloq.estado === baixo, bloq.feedback], [true, { kind: "block", text: "PE insuficiente para Fúria (precisa de 3)" }]);
const ruReq = { ...ruFuria, id: "rR", requires: "nd > 10" };
const bloqReq = V.ativarRegra(csF, dF, ruReq, "Berserker", null, { ambiente: AMB });
t("o pré-requisito (DSL) bloqueia, e libera quando vale", [bloqReq.feedback, V.ativarRegra(csF, dF, { ...ruReq, requires: "nd > 3" }, "Berserker", null, { ambiente: AMB }).feedback.kind], [{ kind: "block", text: "Pré-requisito não atendido: Fúria" }, "on"]);
const csTemp = estado(snapF, { peCurrent: 24, peTempSources: { "Treino de Energia": 4 } });
t("o custo sai do PE temporário primeiro (4 de fonte, custo 3: a fonte fica com 1)", (() => { const x = V.ativarRegra(csTemp, deriv(snapF, csTemp), ruFuria, "B", null, { ambiente: AMB }).estado; return [x.peCurrent, x.peTempSources]; })(), [21, { "Treino de Energia": 1 }]);
// Uso único: ids únicos por uso, pode repetir, e a frase diz "usou".
const ruOnce = regra("rO", "Golpe Pesado", "activated", [efeitoStat("e1", "acerto", 2, 1)], { activation: "once", pe: 1 });
const snapO = ficha({ features: [entidade("f2", "Técnica", [ruOnce])] });
const o1 = V.ativarRegra(estado(snapO), deriv(snapO, estado(snapO)), ruOnce, "Técnica", null, { ambiente: AMB });
const o2 = V.ativarRegra(o1.estado, deriv(snapO, o1.estado), ruOnce, "Técnica", null, { ambiente: AMB });
t("uso único: cada uso tem id próprio e os dois ficam (podem repetir)", [o2.estado.activeModifiers.length, new Set(o2.estado.activeModifiers.map((m) => m.id)).size, o2.estado.activeModifiers[0].id], [2, 1, "rO__e1__rsi"]);
t("e a frase diz usou, com o custo", o1.estado.combatLog[0].message, `Técnica: usou Golpe Pesado: Acerto +2 por 1 rodada(s) (${MENOS}1 PE)`);
t("o log da regra fica nos últimos 50", (() => { let x = estado(snapO, { peCurrent: 20 }); const dd = deriv(snapO, x); const ru = { ...ruOnce, cost: { pe: 0, acao: "" } }; for (let i = 0; i < 60; i++) x = V.ativarRegra(x, dd, ru, "T", null, { ambiente: AMB }).estado; return x.combatLog.length; })(), 50);
// Efeitos de recurso: subtract, set, guarda (com teto) e hp que respeita o máximo.
const ruRec = regra("rR2", "Choque", "activated", [efeitoRecurso("e1", "hp", "subtract", 30), efeitoRecurso("e2", "pe", "set", 7), efeitoRecurso("e3", "guarda", "add", 50)], { activation: "once" });
const snapRec = ficha({ features: [entidade("f3", "Choque", [ruRec])] });
const rr = V.ativarRegra(estado(snapRec), deriv(snapRec, estado(snapRec)), ruRec, "Choque", null, { ambiente: AMB }).estado;
t("recursos instantâneos: Vida menos 30, PE definido em 7, Guarda capada em 10", [rr.hpCurrent, rr.peCurrent, rr.guardaInabavalCurrent], [70, 7, 10]);
t("Vida nunca passa do máximo na regra (hp add 50 em 90 dá 100), e PV temporário passa", (() => {
  const ru = regra("rH", "Cura", "activated", [efeitoRecurso("e1", "hp", "add", 50)], { activation: "once" });
  const ru2 = regra("rH2", "Escudo", "activated", [efeitoRecurso("e1", "hp_temp", "add", 50)], { activation: "once" });
  const sn = ficha({ features: [entidade("f4", "Cura", [ru, ru2])] });
  const c0 = estado(sn, { hpCurrent: 90 });
  return [V.ativarRegra(c0, deriv(sn, c0), ru, "C", null, { ambiente: AMB }).estado.hpCurrent, V.ativarRegra(c0, deriv(sn, c0), ru2, "C", null, { ambiente: AMB }).estado.hpCurrent];
})(), [100, 140]);
t("regra de remover condição tira a condição", (() => {
  const ru = regra("rX", "Cura Mental", "activated", [{ id: "e1", type: "condition", op: "remove", condition: "abalado" }], { activation: "once" });
  const sn = ficha({ features: [entidade("f5", "Cura Mental", [ru])] });
  const c0 = estado(sn, { activeConditions: [{ id: "q", name: "abalado" }, { id: "w", name: "lento" }] });
  return V.ativarRegra(c0, deriv(sn, c0), ru, "C", null, { ambiente: AMB }).estado.activeConditions.map((c) => c.name);
})(), ["lento"]);

/* ============================================================ */
/* 8. Gatilhos de começo de rodada e disparados                  */
/* ============================================================ */
const gatilhos = entidade("fg", "Aura", [
  regra("rg1", "Fim de Turno", "turn_end", [efeitoRecurso("e1", "hp", "subtract", 5)]),
  regra("rg2", "Começo de Turno", "turn_start", [efeitoRecurso("e1", "pe", "subtract", 2)]),
  regra("rg3", "Fim de Rodada", "round_end", [efeitoRecurso("e1", "hp", "add", 3)]),
  regra("rg4", "Começo de Rodada", "round_start", [efeitoCondicao("e1", "abalado", 2)]),
]);
const snapG = ficha({ features: [gatilhos] });
const csG = estado(snapG, { hpCurrent: 90 });
const dG = deriv(snapG, csG);
avisos.splice(0);
// turn_end: Vida 90 menos 5.
t("fim do turno dispara o gatilho (Vida 90 para 85) e avisa sem travessão", [m252.encerraTurno(csG, dG, op()).hpCurrent, avisos.splice(0)],
  [85, [["livre", `Aura: Fim de Turno: PV ${MENOS}5 (só ativada)`]]]);
// turn_start: PE 20 menos 2.
t("começo do turno dispara o gatilho (PE 20 para 18)", [m252.iniciaTurno(csG, dG, op()).peCurrent, avisos.splice(0).length], [18, 1]);
// Virada: round_end (+3: 93), Guarda 10, lastDamage 0, round_start com Abalado por 2.
const vr = m252.viraRodada({ ...csG, guardaInabavalCurrent: 3, lastDamage: 12 }, dG, op());
t("a virada: round_end soma 3 de Vida, a Guarda volta a 10, o último dano zera e Abalado entra por 2",
  [vr.estado.hpCurrent, vr.estado.guardaInabavalCurrent, vr.estado.lastDamage, vr.estado.activeConditions.map((c) => [c.name, c.duracao, c.source])],
  [93, 10, 0, [["abalado", 2, { ruleId: "rg4" }]]]);
t("e avisa o fim e o começo da rodada, em ordem", avisos.splice(0).map((a) => a[1]),
  [`Aura: Fim de Rodada: PV ${MENOS}3 (só ativada)`.replace(`PV ${MENOS}3`, "PV +3"), `Aura: Começo de Rodada: Aplica Abalado por 2 rodada(s) (só ativada)`]);
// Gatilho disparado: a mesma regra como ativação (sem custo) dá o mesmo recurso.
const ruIgual = (gat, extra) => regra("rI", "Ajuste", gat, [efeitoRecurso("e1", "hp", "subtract", 5), efeitoRecurso("e2", "pe", "subtract", 2), efeitoRecurso("e3", "guarda", "subtract", 4)], extra);
const snapI = ficha({ features: [entidade("fi", "Ajuste", [ruIgual("turn_end")])] });
const csI = estado(snapI);
const viaGatilho = m252.encerraTurno(csI, deriv(snapI, csI), op());
const ruAtivada = ruIgual("activated", { activation: "once" });
const snapI2 = ficha({ features: [entidade("fi", "Ajuste", [ruAtivada])] });
const viaAtivacao = V.ativarRegra(estado(snapI2), deriv(snapI2, estado(snapI2)), ruAtivada, "Ajuste", null, { ambiente: AMB }).estado;
t("a mesma regra como gatilho e como ativação dá a mesma Vida, PE e Guarda (95, 18, 6)",
  [[viaGatilho.hpCurrent, viaGatilho.peCurrent, viaGatilho.guardaInabavalCurrent], [viaAtivacao.hpCurrent, viaAtivacao.peCurrent, viaAtivacao.guardaInabavalCurrent]], [[95, 18, 6], [95, 18, 6]]);
avisos.splice(0);
// O abatido não recebe nada em nenhuma das linhas.
const ab = { abatido: true, nome: "Goblin", avisar: () => avisos.push("x") };
const csAb = { ...csG, guardaInabavalCurrent: 2, activeModifiers: [{ id: "m", stat: "defesa", op: "add", value: 1, duration: { kind: "rounds", rounds: 2 } }] };
t("o abatido não renova a Guarda, não tica modificador e não dispara gatilho",
  [m252.viraRodada(csAb, dG, ab).estado === csAb, m252.iniciaCombate(csAb, dG, ab) === csAb, m252.iniciaTurno(csAb, dG, ab) === csAb, m252.encerraTurno(csAb, dG, ab) === csAb, avisos.length], [true, true, true, true, 0]);
t("o Nova Rodada forçado: só a Guarda e os modificadores, sem PE, sem gatilho e sem zerar o último dano", (() => {
  const c = { ...csG, guardaInabavalCurrent: 2, lastDamage: 9, peCurrent: 20 };
  const x = m252.viraRodada(c, dG, op({ forcada: true })).estado;
  return [x.guardaInabavalCurrent, x.lastDamage, x.hpCurrent, x.peCurrent, x.activeConditions.length];
})(), [10, 9, 90, 20, 0]);
avisos.splice(0);
/* ⚠ REGRA MUDOU EM 2026-11-17 (Encontro Unificado, etapa 5, autor: "Duração no fim do turno de quem aplicou, nas rotas
   todas"). Até aqui os modificadores desciam na virada e as condições no começo do turno de quem as tem, como no
   useEncounter.js. Agora as duas descem no FIM DO TURNO DE QUEM APLICOU (`desceDuracoesDe`, `op.vale`), e a virada e o começo
   do turno não mexem em duração. A virada e o começo do turno continuam iguais à 2.5.2 no resto. O caso completo (quem
   aplicou, pulado, removido) está em t-duracao-turno.mjs. */
const csD = estado(ficha(), {
  activeModifiers: [
    { id: "m1", name: "A", stat: "defesa", op: "add", value: 1, duration: { kind: "rounds", rounds: 2 } },
    { id: "m2", name: "B", stat: "defesa", op: "add", value: 1, duration: { kind: "rounds", rounds: 1 } },
    { id: "m3", name: "C", stat: "defesa", op: "add", value: 1, duration: { kind: "manual" } },
  ],
  activeConditions: [{ id: "c1", name: "abalado", duracao: 2 }, { id: "c2", name: "caido", duracao: null }],
});
const dD = deriv(ficha(), csD);
const vD = m252.viraRodada(csD, dD, op()).estado;
// Regra de 2026-11-17: a virada não desce mais os modificadores (era "2 vira 1, 1 expira, manual fica").
t("a virada não mexe em duração nenhuma (modificadores e condições ficam)", [vD.activeModifiers.map((m) => [m.id, m.duration]), vD.activeConditions.map((c) => [c.name, c.duracao])],
  [[["m1", { kind: "rounds", rounds: 2 }], ["m2", { kind: "rounds", rounds: 1 }], ["m3", { kind: "manual" }]], [["abalado", 2], ["caido", null]]]);
// Regra de 2026-11-17: o começo do turno não tica mais a condição (era "2 vira 1").
const t1 = m252.iniciaTurno(csD, dD, op());
t("o começo do turno não mexe na condição", t1.activeConditions.map((c) => [c.name, c.duracao]), [["abalado", 2], ["caido", null]]);
t("e não tica os modificadores", t1.activeModifiers.length, 3);
avisos.splice(0);
// O fim do turno de quem aplicou (entradas sem `aplicadorId` são da própria criatura): condições e modificadores descem juntos.
const proprias = (a) => a === "proprio";
const f1 = m252.desceDuracoesDe(csD, dD, op({ vale: proprias })).estado;
t("o fim do turno de quem aplicou desce a condição (2 vira 1) e os modificadores (2 vira 1, 1 expira, manual fica)",
  [f1.activeConditions.map((c) => [c.name, c.duracao]), f1.activeModifiers.map((m) => [m.id, m.duration])],
  [[["abalado", 1], ["caido", null]], [["m1", { kind: "rounds", rounds: 1 }], ["m3", { kind: "manual" }]]]);
const f2 = m252.desceDuracoesDe(f1, dD, op({ vale: proprias })).estado;
t("no fim do turno seguinte a condição expira, sai e AVISA com a frase da 2.5.2", [f2.activeConditions.map((c) => c.name), avisos.splice(0)], [["caido"], [["condicao", "A condição [abalado] de Goblin chegou ao fim e foi removida."]]]);
t("o fim do turno de OUTRO aplicador não mexe nas entradas desta criatura (o MESMO estado)", m252.desceDuracoesDe(csD, dD, op({ vale: (a) => a === "outro" })).estado === csD, true);
t("o abatido não recebe nada, como em toda a 2.5.2", m252.desceDuracoesDe(csD, dD, op({ vale: proprias, abatido: true })).estado === csD, true);
t("no começo do combate o turno do primeiro não tica condição", m252.iniciaTurno(csD, dD, op({ comecoDoCombate: true })).activeConditions.map((c) => c.duracao), [2, null]);
t("encerrar o combate não mexe na criatura (END_COMBAT só muda o status)", m252.encerraCombate(csD) === csD, true);

/* ============================================================ */
/* 9. Descansar é o Reset                                        */
/* ============================================================ */
t("Descansar é o Reset do painel: tudo volta ao estado inicial, condições e modificadores somem", (() => {
  const c = { ...csD, hpCurrent: 12, peCurrent: 1, guardaInabavalCurrent: 0, almaAtual: 40, missCounter: 2, combatLog: [{ id: "l" }] };
  return semCarimbos(m252.descansar(c, dD));
})(), semCarimbos(FE.createInitialCombatState(STATS)));

/* ============================================================ */
/* 10. Equivalência contra as funções puras da 2.5.2             */
/* ============================================================ */
{
  const mixed = ficha({
    features: [entTreino, gatilhos, entidade("fp", "Passiva", [regra("rp", "Casca", "passive", [efeitoStat("e1", "rdGeral", 3, 1)])])],
  });
  const base = estado(mixed, {
    hpCurrent: 80, guardaInabavalCurrent: 4, lastDamage: 17,
    activeModifiers: [{ id: "m1", name: "A", stat: "defesa", op: "add", value: 1, duration: { kind: "rounds", rounds: 2 } }, { id: "m2", name: "B", stat: "iniciativa", op: "add", value: 1, duration: { kind: "rounds", rounds: 1 } }],
    activeConditions: [{ id: "c1", name: "abalado", duracao: 2 }, { id: "c2", name: "caido", duracao: null }],
  });
  const comb = { id: "c1", displayName: "Goblin", snapshot: mixed, combatState: base, flags: { isDefeated: false, isHidden: false } };
  const dd = deriv(mixed, base);

  /* A virada, como o NEXT_TURN de useEncounter.js:183-205 faz por combatente.
     ⚠ REGRA MUDOU EM 2026-11-17 (etapa 5): a virada do Encontro novo não desce mais os modificadores (eles descem no fim
     do turno de quem aplicou). A referência continua sendo a sequência da 2.5.2, aplicada sobre os modificadores com UMA
     rodada a mais (`maisUma`): o tick da 2.5.2 os devolve exatamente ao valor de antes, e o resto da virada fica provado igual. */
  const maisUma = (c) => ({ ...c, combatState: { ...c.combatState, activeModifiers: c.combatState.activeModifiers.map((m) => (m.duration?.kind === "rounds" ? { ...m, duration: { ...m.duration, rounds: m.duration.rounds + 1 } } : m)) } });
  const refVirada = (c) => {
    const fim = AE.applyTriggeredEffects(c.combatState, c.snapshot, "round_end", {}).combatState;
    const base0 = FE.applyNewRoundToAll([{ ...c, combatState: fim }], { tickConditions: false })[0];
    const { combatState } = AE.applyRoundStartResources({ ...base0.combatState, lastDamage: 0 }, c.snapshot);
    return AE.applyTriggeredEffects(combatState, c.snapshot, "round_start", { resources: false, conditions: true }).combatState;
  };
  t("a virada é a mesma sequência do NEXT_TURN, sobre o estado de uma criatura cheia de coisa",
    semCarimbos(comRelogioFixo(() => m252.viraRodada(base, dd, op()).estado)), semCarimbos(comRelogioFixo(() => refVirada(maisUma(comb)))));
  // O começo do combate, como o START_COMBAT de useEncounter.js:127-140.
  const refComeco = (c) => {
    const base0 = FE.applyNewRoundToAll([c], { tickConditions: false })[0];
    const { combatState } = AE.applyRoundStartResources({ ...base0.combatState, lastDamage: 0 }, c.snapshot);
    return AE.applyTriggeredEffects(combatState, c.snapshot, "round_start", { resources: false, conditions: true }).combatState;
  };
  // Regra de 2026-11-17: o começo do combate também não desce os modificadores (mesmo `maisUma` da virada).
  t("o começo do combate é a mesma sequência do START_COMBAT, sem descer duração", semCarimbos(comRelogioFixo(() => m252.iniciaCombate(base, dd, op()))), semCarimbos(comRelogioFixo(() => refComeco(maisUma(comb)))));
  /* O turno que entra (useEncounter.js:212-228). ⚠ REGRA MUDOU EM 2026-11-17 (etapa 5): era o gatilho MAIS o tick de
     condições. O tick saiu (as condições descem no fim do turno de quem aplicou), e fica só o gatilho. */
  const refTurno = (c) => AE.applyTriggeredEffects(c.combatState, c.snapshot, "turn_start", {}).combatState;
  t("o turno que entra é só o turn_start", semCarimbos(comRelogioFixo(() => m252.iniciaTurno(base, dd, op()))), semCarimbos(comRelogioFixo(() => refTurno(comb))));
  t("o turno que sai é o turn_end", semCarimbos(comRelogioFixo(() => m252.encerraTurno(base, dd, op()))), semCarimbos(comRelogioFixo(() => AE.applyTriggeredEffects(base, mixed, "turn_end", {}).combatState)));
  /* A divisão da duração. ⚠ REGRA MUDOU EM 2026-11-17 (etapa 5): `descerDuracoes252` deixou de ter `quando` (virada para os
     modificadores, começo do turno para as condições) e desce as DUAS juntas, para o aplicador que `vale` aceita. Um passo
     dela, com tudo aceito, vale o mesmo que os dois ticks da 2.5.2 juntos, e a Guarda sozinha é o applyNewRoundEffects. */
  t("renovar a Guarda é o applyNewRoundEffects sem tick de condições (modificadores com uma rodada a mais)",
    V.renovarGuarda(base, mixed), FE.applyNewRoundEffects(maisUma(comb), { tickConditions: false }).combatState);
  t("um passo da descida é o tickCombatantConditions mais o tickModifiersRound",
    V.descerDuracoes252(base, { nome: "Goblin" }).estado, { ...FE.tickCombatantConditions(comb).combatant.combatState, activeModifiers: FM.tickModifiersRound(base.activeModifiers) });
  t("os modificadores descem como o tickModifiersRound", V.descerDuracoes252(base).estado.activeModifiers, FM.tickModifiersRound(base.activeModifiers));
  // O derivado AO VIVO: o painel soma passivos, condições e a Alma antes do resolveLiveStats.
  const passivos = [{ id: "rp__e1", name: "Passiva", stat: "rdGeral", op: "add", value: 3, stack: "sum", group: "caracteristica", duration: { kind: "manual" }, source: { name: "Passiva", entityId: "fp", kind: "passive", group: "caracteristica", ruleId: "rp" }, payload: null, enabled: true }];
  const refVivo = FM.resolveLiveStats(mixed, { ...base, activeModifiers: [...passivos, ...FC.collectConditionModifiers(["abalado", "caido"]), ...base.activeModifiers] });
  t("o derivado AO VIVO é o resolveLiveStats com passivos e condições (RD 5 mais 3, Defesa mais 1, Deslocamento 4,5)", [dd.stats.rdGeral, dd.stats.defesa, dd.stats.deslocamento, dd.stats.rdGeral === refVivo.stats.rdGeral, dd.stats.defesa === refVivo.stats.defesa, dd.stats.deslocamento === refVivo.stats.deslocamento], [8, 16, 4.5, true, true, true]);
  t("o dano usa a RD AO VIVO: 20 com RD 8 (e Guarda 4) dá 12 depois da RD, 8 na Vida", (() => { const x = m252.aplicarDano(base, dd, 20); return [x.hpCurrent, x.guardaInabavalCurrent]; })(), [72, 0]);
  t("o Reset é o createInitialCombatState dos stats base", semCarimbos(m252.descansar(base, dd)), semCarimbos(FE.createInitialCombatState(mixed.stats)));
  t("a Alma segue o computeAlmaStatus nos cinco estados", [100, 76, 75, 51, 50, 26, 25, 1, 0].map((a) => V.estadoDaAlma({ almaAtual: a }, 100).estadoKey === FE.computeAlmaStatus(a, 100).estadoKey), Array(9).fill(true));
  t("o abate pelo contador é o isAutoDefeated", [0, 1, 2, 3, 4].map((n) => V.abatidoAutomatico({ missCounter: n }) === FE.isAutoDefeated({ combatState: { missCounter: n } })), Array(5).fill(true));
}

/* ============================================================ */
/* 11. Pelo Encontro: operações, Desfazer, registro, contador    */
/* ============================================================ */
const MESTRE = { conta: null, papel: "mestre", combatente: null };
const JOGADOR = { conta: null, papel: "jogador", combatente: "c_lia" };
let nId = 0;
const gerarId = (p) => `${p}_t${nId++}`;
let relogio = 7000;
const agora = () => relogio++;
const ctx = (m) => ({ derivados: M.derivarEncontro(m).mapa, gerarId, agora });

function mundoComGob(snap = snapSG, sobre = {}) {
  const c = M.criarCriatura(snap, { chave: "fm_creatures_v1", motor: "252", id: "c_g" });
  const e0 = M.criarEncontro({ grupo: "site", id: "e252", agora: () => 1 });
  return mundoDe({ ...e0, combatentes: [{ ...c, combatState: { ...c.combatState, ...sobre } }] }, {}, {});
}
function dG0() { return deriv(snapSG, estado(snapSG)); }

t("a criatura da 2.5.2 agora nasce no Encontro, com o estado inicial e Oculta", (() => {
  const c = M.criarCriatura(snapSG, { chave: "fm_creatures_v1", motor: "252", id: "c_g" });
  return [c.motor, c.tipo, c.visao, c.combatState.hpCurrent, c.iniciativa.mod, c.origem, c.snapshot !== snapSG];
})(), ["252", "criatura", "oculta", 100, 3, { chave: "fm_creatures_v1", id: "gob252" }, true]);
t("o derive dela entra no mapa do Encontro, sem erro", (() => { const r = M.derivarEncontro(mundoComGob()); return [Object.keys(r.erros), r.mapa.c_g.stats.rdGeral]; })(), [[], 5]);
t("o resumo pelo modelo", M.resumoDoCombatente(mundoComGob().encontro.combatentes[0], { sessoes: {}, derivados: M.derivarEncontro(mundoComGob()).mapa }),
  { pv: 100, pvMax: 100, pvTemp: 0, pe: 20, peMax: 20, peTemp: 0, alma: 100, almaMax: 100, condicoes: [], efeitos: [], caido: false, morto: false });
t("o resumo SEM derivado não lança: degrada, com máximos 0 e as condições da lista", (() => {
  const mm = mundoComGob(snapSG, { hpCurrent: 40, activeConditions: [{ id: "a", name: "lento" }] });
  const r = M.resumoDoCombatente(mm.encontro.combatentes[0], { sessoes: {}, derivados: { c_g: null } });
  return [r.pv, r.pvMax, r.pvTemp, r.peMax, r.alma, r.condicoes, r.caido];
})(), [40, 0, 0, 0, 100, ["lento"], false]);
/* Operação tipada: o delta é estrutural, com Vida e Guarda. Dano 30, RD 5, Guarda desligada: Vida 75. */
let g = mundoComGob();
let o = O.operar(g, { tipo: "dano", alvo: "c_g", autor: MESTRE, entrada: { valor: 30 } }, ctx(g));
t("dano pela operação: Vida 75 e o último dano 25, no delta", [o.ok, o.mundo.encontro.combatentes[0].combatState.hpCurrent, o.operacao.delta.map((x) => [x.caminho.join("."), x.antes, x.depois])],
  [true, 75, [["hpCurrent", 100, 75], ["lastDamage", 0, 25]]]);
t("o Mestre na criatura não entra no histórico dela", (o.mundo.encontro.combatentes[0].combatState.historico ?? []).length, 0);
t("o Registro do Encontro anota o dano", o.mundo.encontro.log[0].mensagem, "Dano: 30 em Goblin.");
t("sem derivado a operação diz Ficha sem Cálculo, até o dano", O.operar(g, { tipo: "dano", alvo: "c_g", autor: MESTRE, entrada: { valor: 30 } }, { derivados: {}, gerarId, agora }).erro, "Ficha sem Cálculo");
t("gastar PE pela operação, com a fonte drenada", (() => {
  const g2 = mundoComGob(snapSG, { peCurrent: 24, peTempSources: { X: 4 } });
  const x = O.operar(g2, { tipo: "gastarPe", alvo: "c_g", autor: MESTRE, entrada: { valor: 6 } }, ctx(g2));
  return [x.ok, x.operacao.delta.map((y) => [y.caminho.join("."), y.antes, y.depois])];
})(), [true, [["peCurrent", 24, 18], ["peTempSources.X", 4, { $ausente: true }]]]);
t("dano pela metade: 31 vira 15 (para baixo), menos a RD 5 são 10, Vida 90", (() => { const x = O.operar(g, { tipo: "danoMetade", alvo: "c_g", autor: MESTRE, entrada: { valor: 31 } }, ctx(g)); return x.mundo.encontro.combatentes[0].combatState.hpCurrent; })(), 90);
t("Descansar pela operação volta tudo ao inicial", (() => {
  const g2 = mundoComGob(snapSG, { hpCurrent: 12, peCurrent: 1 });
  const x = O.operar(g2, { tipo: "descansar", alvo: "c_g", autor: MESTRE, entrada: {} }, ctx(g2));
  const cst = x.mundo.encontro.combatentes[0].combatState;
  return [x.ok, cst.hpCurrent, cst.peCurrent, cst.guardaInabavalCurrent];
})(), [true, 100, 20, 10]);
t("Dano na Alma e Condição pela operação", (() => {
  let x = O.operar(g, { tipo: "alma", alvo: "c_g", autor: MESTRE, entrada: { modo: "dano", valor: 30 } }, ctx(g)).mundo;
  x = O.operar(x, { tipo: "condicao", alvo: "c_g", autor: MESTRE, entrada: { modo: "adicionar", condicao: "lento" } }, ctx(x)).mundo;
  const cst = x.encontro.combatentes[0].combatState;
  return [cst.almaAtual, cst.hpCurrent, cst.activeConditions.map((c) => c.name)];
})(), [70, 70, ["lento"]]);

/* Duas ativações de regra em seguida pela operação: o registro cresce pelo fim e não perde a segunda. */
{
  const ru = regra("rO2", "Golpe Pesado", "activated", [efeitoStat("e1", "acerto", 2, 1)], { activation: "once" });
  const sn = ficha({ features: [entidade("f2", "Técnica", [ru])], combatSettings: SEM_GUARDA });
  let m = mundoComGob(sn);
  const passoDe = (dd) => (s) => V.ativarRegra(s, dd, ru, "Técnica", null, { ambiente: AMB }).estado;
  const ativa = (mm) => O.operar(mm, { tipo: "sessao", alvo: "c_g", autor: MESTRE, passo: passoDe(ctx(mm).derivados.c_g) }, ctx(mm));
  const a1 = ativa(m);
  const a2 = ativa(a1.mundo);
  const log = a2.mundo.encontro.combatentes[0].combatState.combatLog;
  t("duas ativações seguidas: cada operação carrega UM registro e o combatLog fica com os dois, em ordem", [a1.operacao.registros.length, a2.operacao.registros.length, log.length, [log[0].id === a1.operacao.registros[0].id, log[1].id === a2.operacao.registros[0].id], log[0].id !== log[1].id], [1, 1, 2, [true, true], true]);
  t("e a segunda ativação tem o modificador novo no delta", a2.operacao.delta.map((x) => x.caminho.join(".")).includes("activeModifiers"), true);
  // Com o log cheio (50), o slice(-50) tira o mais velho e a nova entrada continua achada.
  let cheio = mundoComGob(sn, { combatLog: Array.from({ length: 50 }, (_, i) => ({ id: `l${i}`, message: `m${i}` })) });
  const a3 = ativa(cheio);
  t("com o log cheio, a nova entrada é achada pelo fim (não pelo começo)", [a3.operacao.registros.length, a3.mundo.encontro.combatentes[0].combatState.combatLog.length, a3.mundo.encontro.combatentes[0].combatState.combatLog[49].id === a3.operacao.registros[0].id], [1, 50, true]);
}

/* Pedido do jogador, histórico e Desfazer com PV temporário. */
{
  let m = mundoComGob(snapSG, { hpCurrent: 120 });
  m = R(m, { tipo: "ADICIONAR", combatente: M.criarMarcador({ nome: "Lia", id: "c_lia" }), iniciativa: 5 });
  let x = O.operar(m, { tipo: "dano", alvo: "c_g", autor: JOGADOR, entrada: { valor: 30 } }, ctx(m));
  t("o jogador na criatura da 2.5.2 também vira pedido", [x.pendente, x.pedido.pedido.estado], [true, "pendente"]);
  const aceito = O.aceitarPedido(x.mundo, x.pedido.id, MESTRE, ctx(x.mundo));
  t("o Mestre aceita: 120 menos (30 menos RD 5) é 95", [aceito.ok, aceito.mundo.encontro.combatentes[0].combatState.hpCurrent], [true, 95]);
  t("o pedido do jogador entra no histórico da criatura", O.historicoDe(aceito.mundo.encontro.combatentes[0].combatState).map((h) => [h.id, h.autor.papel]), [[x.pedido.id, "jogador"]]);
  const outro = O.operar(aceito.mundo, { tipo: "dano", alvo: "c_g", autor: MESTRE, entrada: { valor: 10 } }, ctx(aceito.mundo));
  t("controle: o Mestre tira mais 5 (RD 5): 90", outro.mundo.encontro.combatentes[0].combatState.hpCurrent, 90);
  const des = O.desfazer(outro.mundo, { alvo: "c_g", operacaoId: x.pedido.id }, MESTRE, ctx(outro.mundo));
  t("desfazer relativo devolve 25 em cima do 90: 115, que passa do máximo 100 mas não do que a Vida tinha antes (120)", [des.ok, des.mundo?.encontro.combatentes[0].combatState.hpCurrent], [true, 115]);
  // Com uma cura no meio que não deixa o resultado voltar ao valor de antes, o teto é o máximo.
  const m2 = mundoComGob(snapSG, { hpCurrent: 100 });
  const d1 = O.operar(m2, { tipo: "dano", alvo: "c_g", autor: JOGADOR, entrada: { valor: 30 } }, { ...ctx(m2), derivados: ctx(m2).derivados });
  const ac = O.aceitarPedido(d1.mundo, d1.pedido.id, MESTRE, ctx(d1.mundo));
  const cura = O.operar(ac.mundo, { tipo: "cura", alvo: "c_g", autor: MESTRE, entrada: { valor: 10 } }, ctx(ac.mundo));
  const naoFecha = O.desfazer(cura.mundo, { alvo: "c_g", operacaoId: d1.pedido.id }, MESTRE, ctx(cura.mundo));
  t("com uma cura no meio, desfazer passaria do máximo (75 mais 10 mais 25 é 110): não fecha", [naoFecha.ok, naoFecha.erro, naoFecha.conflitos], [false, "Não Fecha", [{ caminho: ["hpCurrent"], motivo: "foraDoLimite" }]]);
}

/* Desfazer com a Guarda: a Guarda volta pelo delta (relativa, teto o que tinha antes), e o último dano fica solto. */
{
  const m = mundoComGob(ficha(), {});
  const x = O.operar(m, { tipo: "dano", alvo: "c_g", autor: JOGADOR, entrada: { valor: 30 } }, ctx(m));
  const ac = O.aceitarPedido(x.mundo, x.pedido.id, MESTRE, ctx(x.mundo));
  const cst = (mm) => mm.encontro.combatentes[0].combatState;
  t("controle: dano 30 (RD 5, 25): a Guarda 10 absorve 10, a Vida 85, o último dano 25", [cst(ac.mundo).hpCurrent, cst(ac.mundo).guardaInabavalCurrent, cst(ac.mundo).lastDamage], [85, 0, 25]);
  const mais = O.operar(ac.mundo, { tipo: "dano", alvo: "c_g", autor: MESTRE, entrada: { valor: 10 } }, ctx(ac.mundo));
  t("controle: mais 10 (RD 5, 5): Vida 80 e o último dano 5", [cst(mais.mundo).hpCurrent, cst(mais.mundo).lastDamage], [80, 5]);
  const des = O.desfazer(mais.mundo, { alvo: "c_g", operacaoId: x.pedido.id }, MESTRE, ctx(mais.mundo));
  t("desfazer com dano no meio: Vida 95 e Guarda 10, e o último dano não trava nem volta (fica 5)", [des.ok, cst(des.mundo).hpCurrent, cst(des.mundo).guardaInabavalCurrent, cst(des.mundo).lastDamage], [true, 95, 10, 5]);
}

/* O contador de erros pelo redutor: ligar o Abatido depois de uma operação, só ligar, só no alvo. */
{
  const m = mundoComGob();
  const via = (n, mm = m) => {
    const x = O.operar(mm, { tipo: "sessao", alvo: "c_g", autor: MESTRE, passo: (s) => ({ ...s, missCounter: n }) }, ctx(mm));
    return R(mm, { tipo: "OPERACAO", operacao: x.operacao });
  };
  t("o contador em 2 não abate, em 3 abate", [via(2).encontro.combatentes[0].flags.abatido, via(3).encontro.combatentes[0].flags.abatido], [false, true]);
  const abatido = via(3);
  const baixa = O.operar(abatido, { tipo: "sessao", alvo: "c_g", autor: MESTRE, passo: (s) => ({ ...s, missCounter: 0 }) }, ctx(abatido));
  t("zerar o contador depois NÃO levanta a criatura (só liga, como o UPDATE_COMBAT_STATE)", R(abatido, { tipo: "OPERACAO", operacao: baixa.operacao }).encontro.combatentes[0].flags.abatido, true);
  t("pelo OPERACOES também", (() => { const x = O.operar(m, { tipo: "sessao", alvo: "c_g", autor: MESTRE, passo: (s) => ({ ...s, missCounter: 5 }) }, ctx(m)); return R(m, { tipo: "OPERACOES", operacoes: [x.operacao] }).encontro.combatentes[0].flags.abatido; })(), true);
}

/* ============================================================ */
/* 12. Uma luta mista inteira pelo redutor                       */
/* ============================================================ */
{
  const ogroF = (() => { const f = createBlankAfty(); return { ...f, id: "ogro", name: "Ogro", rulesVersion: "afty", core: { ...f.core, nd: 12, tipo: "combatente", patamar: "calamidade", origem: { id: "inato" } } }; })();
  const liaF = (() => { const f = createBlankAfty(); return { ...f, id: "lia", name: "Lia", rulesVersion: "player", system: "player", especializacoes: [{ id: "combatente", nivel: 19 }], core: { ...f.core, nd: 19 } }; })();
  const dOgro = deriveAfty(ogroF);
  const dLia = deriveAfty(liaF);
  const snap = ficha({ features: [entTreino], combatSettings: SEM_GUARDA });
  const cGob = M.criarCriatura(snap, { chave: "fm_creatures_v1", motor: "252", id: "c_gob" });
  const cOgro = M.criarCriatura(ogroF, { chave: "fm_creatures_afty_v1", derived: dOgro, id: "c_ogro" });
  const cLia = M.criarPersonagem(liaF, { chave: "fm_creatures_player_v1", derived: dLia, id: "c_lia" });
  const cBea = M.criarMarcador({ nome: "Bea", id: "c_bea" });
  let w = mundoDe(M.criarEncontro({ grupo: "site", id: "eM", agora: () => 1 }), {}, { lia: liaF });
  w = R(w, { tipo: "ADICIONAR", combatente: cGob, iniciativa: 25 });
  w = R(w, { tipo: "ADICIONAR", combatente: cOgro, iniciativa: 20 });
  w = R(w, { tipo: "ADICIONAR", combatente: cLia, sessao: S.sessaoEmBranco(dLia), iniciativa: 15 });
  w = R(w, { tipo: "ADICIONAR", combatente: cBea, iniciativa: 10 });
  // Uma condição de 2 rodadas na criatura da 2.5.2 e um abatido (Ogro fora da conta de PE).
  w = O.operar(w, { tipo: "condicao", alvo: "c_gob", autor: MESTRE, entrada: { modo: "adicionar", condicao: "abalado" } }, ctx(w)).mundo;
  w = R(w, { tipo: "OPERACAO", operacao: O.operar(w, { tipo: "sessao", alvo: "c_gob", autor: MESTRE, passo: (s) => ({ ...s, activeConditions: s.activeConditions.map((c) => ({ ...c, duracao: 2 })) }) }, ctx(w)).operacao });
  const gobDe = (m) => m.encontro.combatentes.find((c) => c.id === "c_gob").combatState;
  const D = (m) => M.derivarEncontro(m).mapa;
  w = R(w, { tipo: "COMECAR", derivados: D(w) });
  t("começar: a criatura da 2.5.2 ganha 4 de PE temporário e a vez é dela (25)", [gobDe(w).peCurrent, gobDe(w).peTempSources, w.encontro.ativoId], [24, { "Treino de Energia": 4 }, "c_gob"]);
  t("o Registro do Encontro leva a frase do ganho de PE, com o combatente", w.encontro.log.some((l) => l.mensagem === "Goblin: +4 PE (início da rodada)" && l.combatenteId === "c_gob" && l.tipo === "livre"), true);
  t("no começo do combate a condição não tica (continua 2)", gobDe(w).activeConditions.map((c) => c.duracao), [2]);
  t("os outros motores seguem juntos: Lia ligada começou o combate", [w.sessoes.lia.combate?.ativo, w.sessoes.lia.rodada], [true, 1]);
  const vez = [w.encontro.ativoId];
  const passar = (n) => { for (let i = 0; i < n; i++) { w = R(w, { tipo: "PROXIMO_TURNO", derivados: D(w) }); vez.push(w.encontro.ativoId); } };
  passar(3);
  t("a ordem passa pelos quatro motores", vez, ["c_gob", "c_ogro", "c_lia", "c_bea"]);
  passar(1);
  t("virou a rodada 2 e a vez voltou à criatura da 2.5.2", [w.encontro.rodada, w.encontro.ativoId], [2, "c_gob"]);
  t("a mesma fonte de PE temporário não soma na virada (24 fica 24)", [gobDe(w).peCurrent, gobDe(w).peTempSources], [24, { "Treino de Energia": 4 }]);
  t("a condição ticou no começo do turno dela (2 vira 1)", gobDe(w).activeConditions.map((c) => c.duracao), [1]);
  passar(4);
  t("na rodada 3 a condição expira e o Registro avisa (o aviso de condição)", [gobDe(w).activeConditions, w.encontro.log.some((l) => l.mensagem === "A condição [abalado] de Goblin chegou ao fim e foi removida." && l.tipo === "condicao")], [[], true]);
  const antes = gobDe(w);
  const forcada = R(w, { tipo: "NOVA_RODADA", derivados: D(w) });
  t("Nova Rodada forçado: sem PE novo e a rodada sobe", [gobDe(forcada).peCurrent, forcada.encontro.rodada], [antes.peCurrent, w.encontro.rodada + 1]);
  const abatidoG = R(w, { tipo: "DEFINIR_FLAG", id: "c_gob", chave: "abatido", valor: true });
  const gastaGuarda = { ...abatidoG, encontro: { ...abatidoG.encontro, combatentes: abatidoG.encontro.combatentes.map((c) => (c.id === "c_gob" ? { ...c, combatState: { ...c.combatState, guardaInabavalCurrent: 1 } } : c)) } };
  const viraAbatido = R(gastaGuarda, { tipo: "NOVA_RODADA", derivados: D(gastaGuarda) });
  t("o abatido não renova a Guarda na virada", gobDe(viraAbatido).guardaInabavalCurrent, 1);
  const fim = R(w, { tipo: "ENCERRAR" });
  t("encerrar não mexe na criatura da 2.5.2", [fim.encontro.status, gobDe(fim) === gobDe(w)], ["finalizado", true]);
  t("o Encontro todo passa por JSON e volta igual", M.normalizarEncontro(JSON.parse(JSON.stringify(fim.encontro))), M.normalizarEncontro(fim.encontro));
}

/* ============================================================ */
/* 13. O que a fonte ainda diz, e o texto dos arquivos           */
/* ============================================================ */
{
  const lerFonte = (rel) => readFileSync(fileURLToPath(SRC + rel), "utf8").split("\n");
  const painel = lerFonte("components/CombatantPanel.jsx");
  const tracker = lerFonte("components/EncounterTracker.jsx");
  const hook = lerFonte("useEncounter.js");
  const enc = lerFonte("fm-encounter.js");
  const linha = (arq, n) => (arq[n - 1] ?? "").trim();
  t("as linhas citadas ainda dizem o que o cabeçalho de m252-vital.js cita (CombatantPanel)",
    [[1570, "const handlers = useMemo(() => ({"], [1571, "setVital: (kind, v) => {"], [1650, "setAlma: (v) => {"], [1672, "setIgnorarRdAtivo:"], [1689, "activateRule: (rule, entityName, group = null) => {"], [1785, "setSusceptivel:"], [1821, "resetCombat: () => {"], [1562, "// ===== Desafiando a Morte ====="], [331, "const normCond ="], [382, "const handleAdd = useCallback(() => {"], [742, "const handleAdd = useCallback(() => {"], [1368, "const dslContext = useMemo("]]
      .map(([n, txt]) => linha(painel, n).startsWith(txt)), Array(12).fill(true));
  t("e no EncounterTracker, no useEncounter e no fm-encounter",
    [linha(tracker, 645).startsWith("const deathCD = inDeathChallenge"), linha(hook, 116).startsWith("START_COMBAT:"), linha(hook, 162).startsWith("NEXT_TURN:"), linha(hook, 241).startsWith("NEW_ROUND:"), linha(enc, 281).startsWith("export const applyNewRoundEffects"), linha(enc, 314).startsWith("export const tickCombatantConditions")],
    Array(6).fill(true));
  const pasta = fileURLToPath(E + "motores/");
  for (const arq of ["m252.js", "m252-vital.js"]) {
    const texto = readFileSync(pasta + arq, "utf8");
    t(`${arq}: nenhum travessão`, texto.includes(TRAVESSAO), false);
  }
  const vital = readFileSync(pasta + "m252-vital.js", "utf8");
  t("m252-vital.js diz de onde veio cada trecho (arquivo e linhas) e que é cópia fiel", ["CombatantPanel.jsx:1571-1649", "CombatantPanel.jsx:1650-1671", "CombatantPanel.jsx:1684-1784", "EncounterTracker.jsx:642-648", "useEncounter.js:116-140", "COPIA FIEL"].map((s) => vital.includes(s)), Array(6).fill(true));
  const imports = (arq) => readFileSync(pasta + arq, "utf8").split("\n").filter((l) => /from "/.test(l)).map((l) => l.match(/from "([^"]+)"/)[1]);
  /* Regra de 2026-11-17 (etapa 5): entrou o `ficha-uso-estado`, FOLHA do Afty com quem aplicou cada duração (`aplicadorDe`).
     Da 2.5.2 continuam só os puros e exportados. */
  t("os imports da 2.5.2 são só os puros e exportados (nenhum componente de tela)", imports("m252-vital.js").sort(), [
    "../../../../components/fm-automation", "../../../../components/fm-automation-entities", "../../../../components/fm-conditions",
    "../../../../components/fm-dsl", "../../../../components/fm-modifiers", "../../../../components/fm-tables", "../../../../fm-encounter",
    "../../ficha/ficha-uso-estado",
  ]);
  t("m252.js só importa a interface e o m252-vital", imports("m252.js").sort(), ["./interface", "./m252-vital"]);
  const frases = [at.feedback.text, ...at.estado.combatLog.map((l) => l.message), off.feedback.text, bloq.feedback.text];
  t("as frases de tela sem ponto e vírgula e sem travessão", frases.filter((f) => f.includes(";") || f.includes(TRAVESSAO)), []);
  t("semTravessao troca o separador por dois-pontos e o isolado por hífen", [V.semTravessao(`A ${TRAVESSAO} B`), V.semTravessao(`Imune a: ${TRAVESSAO}`)], ["A: B", "Imune a: -"]);
}

if (bad.length) {
  console.log(bad.join("\n"));
  console.log(`\n${bad.length} FALHA(S), ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
