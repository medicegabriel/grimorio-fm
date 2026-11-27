/* O rework dos Encontros, etapa 2 (2026-11-23): o modelo sem tela. Sem Ficha com Vida, a pilha do Mestre (Desfazer do
   Mestre), Começar Rola as Vazias, o Registro em ordem de tempo, Voltar Turno e Reabrir Volta à Luta. Ver
   docs/afty-encontros.md, seção "Rework visual e de usabilidade". */
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
const A = new URL("../src/systems/afty/", import.meta.url).href;
const E = A + "encontros/";
const { deriveAfty } = await import(A + "afty-derive.js");
const { createBlankAfty } = await import(A + "afty-schema.js");
const S = await import(A + "ficha/ficha-sessao.js");
const Velho = await import(E + "afty-encontro.js");
const Mo = await import(E + "motores/index.js");
const M = await import(E + "modelo.js");
const O = await import(E + "operacoes.js");
const { redutorDoEncontro: R, mundoDe, voltarTurno, podeVoltarTurno, ACOES_DO_REDUTOR } = await import(E + "redutor.js");
const SE = await import(new URL("../src/nuvem/sala-encontro.js", import.meta.url).href);

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

let n = 0;
const gerarId = (p) => `${p}_t${n++}`;
let relogio = 9000;
const agora = () => relogio++;

const comCore = (core, extra) => {
  const f = createBlankAfty();
  return { ...f, ...extra, core: { ...f.core, ...core } };
};
const ogroF = comCore({ nd: 12, tipo: "combatente", patamar: "calamidade", origem: { id: "inato" } }, { id: "ogro", name: "Ogro", rulesVersion: "afty" });
const gobF = comCore({ nd: 3, tipo: "combatente", origem: { id: "inato" } }, { id: "gob", name: "Goblin", rulesVersion: "afty" });
const liaF = comCore({ nd: 19 }, { id: "lia", name: "Lia", rulesVersion: "player", system: "player", especializacoes: [{ id: "combatente", nivel: 19 }] });
const dOgro = deriveAfty(ogroF);
const dGob = deriveAfty(gobF);
const dLia = deriveAfty(liaF);

const MESTRE = { conta: null, papel: "mestre", combatente: null };
const JOGADOR = { conta: null, papel: "jogador", combatente: "c_lia" };
const der = (m) => M.derivarEncontro(m).mapa;
const ctx = (m) => ({ derivados: der(m), gerarId, agora });
const semLog = (s) => { if (!s) return s; const { log: _l, historico: _h, atualizadoEm: _a, ...resto } = s; return resto; };
const estados = (m) => Object.fromEntries(m.encontro.combatentes.map((c) => [c.id, semLog(M.estadoDoCombatente(c, m.sessoes))]));
const mensagens = (log) => log.map((e) => e.mensagem);

/* ============================================================ */
/* 1. A interface: o verbo novo e o adaptador do marcador        */
/* ============================================================ */
t("o Reabrir tem verbo na interface", Mo.VERBOS_DO_MOTOR.includes("retomaCombate"), true);
t("os três adaptadores têm a interface inteira", [Mo.faltasDoAdaptador(Mo.motorAfty), Mo.faltasDoAdaptador(Mo.motor252), Mo.faltasDoAdaptador(Mo.motorMarcador)], [[], [], []]);
t("o retomaCombate do Afty só religa a bancada", Mo.motorAfty.retomaCombate(S.sessaoEmBranco(dGob)).combate.ativo, true);

/* ============================================================ */
/* 2. Sem Ficha com Vida                                         */
/* ============================================================ */
const semVida = M.criarMarcador({ nome: "Bea", id: "c_bea" });
const comVida = M.criarMarcador({ nome: "Guarda", lado: "inimigo", pvMax: 30, id: "c_guarda" });
t("o marcador de sempre segue sem Vida e sem motor", ["vida" in semVida, Mo.motorDe(semVida), M.campoDoEstado(semVida)], [false, null, null]);
t("com Vida máxima ele nasce cheio e com o adaptador mínimo", [comVida.vida, Mo.motorDe(comVida)?.motor, M.campoDoEstado(comVida), comVida.motor], [{ pv: 30, pvMax: 30 }, "marcador", "vida", null]);
t("Vida máxima zero, negativa ou texto não vira Vida", [M.criarMarcador({ pvMax: 0 }).vida, M.criarMarcador({ pvMax: -4 }).vida, M.criarMarcador({ pvMax: "x" }).vida], [undefined, undefined, undefined]);
t("a leitura guarda a Vida e apara o atual no máximo", M.normalizarCombatente({ ...comVida, vida: { pv: 99, pvMax: 30 } }).vida, { pv: 30, pvMax: 30 });
t("a leitura de um marcador sem Vida não inventa uma", "vida" in M.normalizarCombatente(semVida), false);
t("a criatura que perdeu a ficha desce para marcador SEM Vida", "vida" in M.normalizarCombatente({ id: "z", tipo: "criatura", nome: "Sumiu", vida: { pv: 5, pvMax: 9 } }), false);

let mv = mundoDe(M.criarEncontro({ grupo: "site", id: "e_mv", agora: () => 1 }));
mv = R(mv, { tipo: "ADICIONAR", combatente: comVida, iniciativa: 12 });
mv = R(mv, { tipo: "ADICIONAR", combatente: semVida, iniciativa: 8 });
t("o derivado do marcador com Vida é só o teto, o sem Vida segue null", [der(mv).c_guarda, der(mv).c_bea], [{ hp: 30, pe: 0 }, null]);
t("o resumo do marcador com Vida tem o formato de todos", M.resumoDoCombatente(combatenteDe(mv, "c_guarda"), { derivados: der(mv) }),
  { pv: 30, pvMax: 30, pvTemp: 0, pe: 0, peMax: 0, peTemp: 0, alma: 0, almaMax: 0, condicoes: [], efeitos: [], caido: false, morto: false });
t("o sem Vida segue sem resumo", M.resumoDoCombatente(combatenteDe(mv, "c_bea"), { derivados: der(mv) }), null);
function combatenteDe(m, id) { return M.combatenteDe(m.encontro, id); }

let r = O.operar(mv, { tipo: "dano", alvo: "c_guarda", autor: MESTRE, entrada: { valor: 12 } }, ctx(mv));
t("o Dano tira da Vida do marcador, pela operação de sempre", [r.ok, combatenteDe(r.mundo, "c_guarda").vida, r.operacao.delta], [true, { pv: 18, pvMax: 30 }, [{ caminho: ["pv"], antes: 30, depois: 18, soma: -12 }]]);
t("e ganha a linha do Registro", r.mundo.encontro.log[0].mensagem, "Dano: 12 em Guarda.");
const danoNoGuarda = r;
r = O.operar(danoNoGuarda.mundo, { tipo: "dano", alvo: "c_guarda", autor: MESTRE, entrada: { valor: 50 } }, ctx(danoNoGuarda.mundo));
t("a Vida do marcador não passa de zero, e zero é caído", [combatenteDe(r.mundo, "c_guarda").vida.pv, M.resumoDoCombatente(combatenteDe(r.mundo, "c_guarda"), { derivados: der(r.mundo) }).caido], [0, true]);
r = O.operar(danoNoGuarda.mundo, { tipo: "cura", alvo: "c_guarda", autor: MESTRE, entrada: { valor: 99 } }, ctx(danoNoGuarda.mundo));
t("a Cura para no máximo", combatenteDe(r.mundo, "c_guarda").vida.pv, 30);
r = O.operar(danoNoGuarda.mundo, { tipo: "descansar", alvo: "c_guarda", autor: MESTRE, entrada: {} }, ctx(danoNoGuarda.mundo));
t("o Descansar enche", combatenteDe(r.mundo, "c_guarda").vida.pv, 30);
r = O.operar(danoNoGuarda.mundo, { tipo: "gastarPe", alvo: "c_guarda", autor: MESTRE, entrada: { valor: 3 } }, ctx(danoNoGuarda.mundo));
t("o que o marcador não tem (PE) é Nada Mudou", [r.ok, r.erro], [false, "Nada Mudou"]);
r = O.operar(mv, { tipo: "dano", alvo: "c_bea", autor: MESTRE, entrada: { valor: 5 } }, ctx(mv));
t("no marcador sem Vida a operação segue recusada", [r.ok, r.erro], [false, "Combatente sem Ficha"]);
t("o marcador com Vida passa por JSON", M.normalizarEncontro(JSON.parse(JSON.stringify(danoNoGuarda.mundo.encontro))).combatentes.find((c) => c.id === "c_guarda").vida, { pv: 18, pvMax: 30 });

/* ============================================================ */
/* 3. A pilha do Mestre (Desfazer do Mestre)                     */
/* ============================================================ */
let mp = mundoDe(M.criarEncontro({ grupo: "afty", id: "e_mp", agora: () => 1 }), {}, { lia: liaF });
mp = R(mp, { tipo: "ADICIONAR", combatente: M.criarCriatura(ogroF, { chave: "fm_creatures_afty_v1", derived: dOgro, id: "c_ogro" }), iniciativa: 20 });
mp = R(mp, { tipo: "ADICIONAR", combatente: M.criarPersonagem(liaF, { chave: "fm_creatures_player_v1", derived: dLia, id: "c_lia" }), sessao: S.sessaoEmBranco(dLia), iniciativa: 15 });
mp = R(mp, { tipo: "ADICIONAR", combatente: M.criarMarcador({ nome: "Guarda", lado: "inimigo", pvMax: 30, id: "c_guarda" }), iniciativa: 10 });
const hpOgro = (m) => combatenteDe(m, "c_ogro").sessao.hpAtual;
const historicoDe = (m, id) => O.historicoDe(M.estadoDoCombatente(combatenteDe(m, id), m.sessoes));

const d1 = O.operar(mp, { tipo: "dano", alvo: "c_ogro", autor: MESTRE, entrada: { valor: 10 } }, ctx(mp));
t("o Mestre na criatura dele: o histórico dela segue sem a operação (Personagem por Papel)", historicoDe(d1.mundo, "c_ogro").length, 0);
t("e a operação entra na pilha do Mestre, uma vez", O.pilhaDoMestreDe(d1.mundo.encontro).map((e) => [e.id, e.tipo, e.alvo]), [[d1.operacao.id, "dano", "c_ogro"]]);
t("a entrada da pilha não leva os registros", "registros" in O.pilhaDoMestreDe(d1.mundo.encontro)[0], false);
const d2 = O.operar(d1.mundo, { tipo: "dano", alvo: "c_lia", autor: MESTRE, entrada: { valor: 7 } }, ctx(d1.mundo));
t("o Mestre no personagem do jogador: entra no histórico dele e NÃO na pilha (um lugar só)",
  [historicoDe(d2.mundo, "c_lia").map((e) => e.id), O.pilhaDoMestreDe(d2.mundo.encontro).length], [[d2.operacao.id], 1]);
const d3 = O.operar(d2.mundo, { tipo: "dano", alvo: "c_lia", autor: JOGADOR, entrada: { valor: 3 } }, ctx(d2.mundo));
t("o jogador no próprio personagem não entra em nenhum dos dois", [historicoDe(d3.mundo, "c_lia").length, O.pilhaDoMestreDe(d3.mundo.encontro).length], [1, 1]);
const d4 = O.operar(d3.mundo, { tipo: "dano", alvo: "c_guarda", autor: MESTRE, entrada: { valor: 4 } }, ctx(d3.mundo));
t("o marcador com Vida também vai para a pilha", O.pilhaDoMestreDe(d4.mundo.encontro).map((e) => e.alvo), ["c_guarda", "c_ogro"]);

t("a última que o Mestre desfaz é a mais nova, de onde estiver", [O.ultimaDesfazivel(d4.mundo, MESTRE)?.operacaoId, O.ultimaDesfazivel(d3.mundo, MESTRE)?.operacaoId],
  [d4.operacao.id, d2.operacao.id]);
t("a do jogador não aparece para ele (o próprio personagem não guarda)", O.ultimaDesfazivel(d4.mundo, JOGADOR), null);

let u = O.desfazer(d4.mundo, { alvo: "c_ogro", operacaoId: d1.operacao.id }, MESTRE, ctx(d4.mundo));
t("o Mestre desfaz o próprio Dano na criatura", [u.ok, hpOgro(u.mundo), hpOgro(mp)], [true, hpOgro(mp), dOgro.hp]);
t("a entrada da pilha fica marcada, e o Desfazer não entra nela", [!!O.pilhaDoMestreDe(u.mundo.encontro).find((e) => e.id === d1.operacao.id).desfeita, O.pilhaDoMestreDe(u.mundo.encontro).length], [true, 2]);
t("e ganha a linha do Registro", u.mundo.encontro.log[0].mensagem, "Desfazer: Dano em Ogro.");
t("desfazer de novo é Já Desfeita", O.desfazer(u.mundo, { alvo: "c_ogro", operacaoId: d1.operacao.id }, MESTRE, ctx(u.mundo)).erro, "Já Desfeita");
t("a desfeita sai da última desfazível", O.ultimaDesfazivel(u.mundo, MESTRE)?.operacaoId, d4.operacao.id);
u = O.desfazer(d4.mundo, { alvo: "c_lia", operacaoId: d2.operacao.id }, MESTRE, ctx(d4.mundo));
t("o do personagem segue pelo histórico dele, como antes", [u.ok, M.estadoDoCombatente(combatenteDe(u.mundo, "c_lia"), u.mundo.sessoes).hpAtual], [true, dLia.hp - 3]);
t("pela pilha, a entrada de outro alvo não serve", O.desfazer(d4.mundo, { alvo: "c_guarda", operacaoId: d1.operacao.id }, MESTRE, ctx(d4.mundo)).erro, "Operação Ausente");
t("na Sala, outro Mestre não desfaz a pilha de quem fez", (() => {
  const a = { conta: "conta-a", papel: "mestre", combatente: null };
  const b = { conta: "conta-b", papel: "mestre", combatente: null };
  const feito = O.operar(mp, { tipo: "dano", alvo: "c_ogro", autor: a, entrada: { valor: 5 } }, ctx(mp));
  // A criatura é do Mestre sem conta: com conta dos dois lados é outra pessoa, então entra no histórico (a regra de hoje).
  return [historicoDe(feito.mundo, "c_ogro").length, O.pilhaDoMestreDe(feito.mundo.encontro).length, O.ultimaDesfazivel(feito.mundo, b)];
})(), [1, 0, null]);
{
  const curado = O.operar(d1.mundo, { tipo: "cura", alvo: "c_ogro", autor: MESTRE, entrada: { valor: 999 } }, ctx(d1.mundo)).mundo;
  u = O.desfazer(curado, { alvo: "c_ogro", operacaoId: d1.operacao.id }, MESTRE, ctx(curado));
  t("o Desfazer da pilha é o relativo de sempre: acima do máximo não fecha", [hpOgro(curado), u.ok, u.erro, u.conflitos], [dOgro.hp, false, "Não Fecha", [{ caminho: ["hpAtual"], motivo: "foraDoLimite" }]]);
}
{
  let m = mp;
  for (let i = 0; i < 55; i++) m = O.operar(m, { tipo: i % 2 ? "cura" : "dano", alvo: "c_guarda", autor: MESTRE, entrada: { valor: 1 } }, ctx(m)).mundo;
  t("a pilha tem teto", O.pilhaDoMestreDe(m.encontro).length, M.PILHA_DO_MESTRE_MAX);
}
t("a pilha passa por JSON", O.pilhaDoMestreDe(M.normalizarEncontro(JSON.parse(JSON.stringify(d4.mundo.encontro)))).map((e) => e.id), [d4.operacao.id, d1.operacao.id]);
t("o Encontro sem pilha não ganha a chave na leitura", "pilhaDoMestre" in M.normalizarEncontro(mp.encontro), false);
t("a cópia do Encontro sai sem pilha", "pilhaDoMestre" in M.duplicarEncontro(d4.mundo.encontro, { gerarId }), false);

/* ============================================================ */
/* 4. Começar Rola as Vazias                                     */
/* ============================================================ */
let mc = mundoDe(M.criarEncontro({ grupo: "afty", id: "e_mc", agora: () => 1 }));
t("o Encontro vazio segue sem começar", M.validarInicio(mc.encontro), { valido: false, erros: ["Adicione pelo menos um combatente."], semIniciativa: 0 });
mc = R(mc, { tipo: "ADICIONAR", combatente: M.criarCriatura(ogroF, { chave: "fm_creatures_afty_v1", derived: dOgro, id: "c_ogro" }), iniciativa: 5 });
mc = R(mc, { tipo: "ADICIONAR", combatente: M.criarCriatura(gobF, { chave: "fm_creatures_afty_v1", derived: dGob, id: "c_gob" }) });
mc = R(mc, { tipo: "ADICIONAR", combatente: M.criarMarcador({ nome: "Bea", mod: 2, id: "c_bea" }) });
t("a iniciativa vazia não trava mais, e a validação conta as vazias", M.validarInicio(mc.encontro), { valido: true, erros: [], semIniciativa: 2 });
const modGob = combatenteDe(mc, "c_gob").iniciativa.mod;
let rc = R(mc, { tipo: "COMECAR", derivados: der(mc), rolagens: { c_gob: 18, c_bea: 3 } });
t("o Começar rola só as vazias, com a rolagem que veio", ["c_ogro", "c_gob", "c_bea"].map((id) => combatenteDe(rc, id).iniciativa),
  [combatenteDe(mc, "c_ogro").iniciativa, { rolagem: 18, mod: modGob, total: 18 + modGob, manual: false }, { rolagem: 3, mod: 2, total: 5, manual: false }]);
t("e começa pela ordem já com as roladas", [rc.encontro.status, rc.encontro.ativoId], ["ativo", "c_gob"]);
t("o Registro diz quem foi rolado e com quanto, antes do Combate Iniciado", Velho.registroEmOrdem(rc.encontro.log).slice(0, 2).map((e) => e.mensagem),
  [`Iniciativas roladas no começo: Goblin (${18 + modGob}), Bea (5).`, "Combate iniciado. Rodada 1."]);
rc = R(mc, { tipo: "COMECAR", derivados: der(mc) });
t("sem rolagem mandada, o d20 rola aqui (de 1 a 20)", ["c_gob", "c_bea"].map((id) => combatenteDe(rc, id).iniciativa.rolagem).every((v) => v >= 1 && v <= 20), true);
const umaSo = R(R(mc, { tipo: "ROLAR_UMA", id: "c_gob", rolagem: 11 }), { tipo: "COMECAR", derivados: der(mc), rolagens: { c_gob: 2, c_bea: 9 } });
t("quem já rolou não é rolado de novo, e uma só vazia fala no singular",
  [combatenteDe(umaSo, "c_gob").iniciativa.rolagem, Velho.registroEmOrdem(umaSo.encontro.log)[0].mensagem], [11, "Iniciativa rolada no começo: Bea (11)."]);
t("sem vazias, nenhuma linha a mais", Velho.registroEmOrdem(R(R(mc, { tipo: "ROLAR_TODAS", rolagens: { c_gob: 4, c_bea: 4 } }), { tipo: "COMECAR", derivados: der(mc) }).encontro.log)[0].mensagem,
  "Combate iniciado. Rodada 1.");

/* ============================================================ */
/* 5. O Registro em ordem de tempo                               */
/* ============================================================ */
const L = (mensagem, em, lote) => ({ id: mensagem, em, mensagem, ...(lote ? { lote } : {}) });
t("dois lotes no mesmo milissegundo não trocam de lugar", mensagens(Velho.registroEmOrdem([L("B1", 5, "b"), L("B2", 5, "b"), L("A1", 5, "a"), L("A2", 5, "a")])), ["A1", "A2", "B1", "B2"]);
t("e o mais novo primeiro é o inverso inteiro", mensagens(Velho.registroEmOrdem([L("B1", 5, "b"), L("B2", 5, "b"), L("A1", 5, "a"), L("A2", 5, "a")], { maisNovoPrimeiro: true })), ["B2", "B1", "A2", "A1"]);
t("o log de antes, sem lote, separa os lotes pela hora que volta", mensagens(Velho.registroEmOrdem([L("B1", 20), L("A1", 10), L("A2", 15)])), ["A1", "A2", "B1"]);
t("lote novo em cima de log antigo", mensagens(Velho.registroEmOrdem([L("N1", 30, "n"), L("V1", 30), L("V2", 31)])), ["V1", "V2", "N1"]);
t("o que não é linha sai, e log ausente é lista vazia", [mensagens(Velho.registroEmOrdem([null, L("X", 1), 3])), Velho.registroEmOrdem(undefined)], [["X"], []]);
{
  let m = R(mc, { tipo: "COMECAR", derivados: der(mc), rolagens: { c_gob: 18, c_bea: 3 } });
  m = O.operar(m, { tipo: "dano", alvo: "c_ogro", autor: MESTRE, entrada: { valor: 2 } }, ctx(m)).mundo;
  m = R(m, { tipo: "PROXIMO_TURNO", derivados: der(m) });
  m = R(m, { tipo: "ENCERRAR" });
  const emOrdem = mensagens(Velho.registroEmOrdem(m.encontro.log));
  t("a luta inteira em ordem: começa no Combate Iniciado e acaba no Combate Encerrado",
    [emOrdem[1], emOrdem.includes("Dano: 2 em Ogro."), emOrdem[emOrdem.length - 1], m.encontro.log[0].mensagem], ["Combate iniciado. Rodada 1.", true, "Combate encerrado.", "Combate encerrado."]);
  const turnos = emOrdem.map((x, i) => (x.startsWith("Turno de ") ? i : -1)).filter((i) => i >= 0);
  const iDano = emOrdem.indexOf("Dano: 2 em Ogro.");
  t("o Dano fica entre o primeiro turno e a passagem dele", [turnos.length, iDano > turnos[0], iDano < turnos[1]], [2, true, true]);
  t("toda linha nova tem lote", m.encontro.log.every((e) => typeof e.lote === "string" && e.lote), true);
  t("a linha da operação guarda o id dela", m.encontro.log.find((e) => e.mensagem === "Dano: 2 em Ogro.").operacaoId?.startsWith("op_"), true);
}

/* ============================================================ */
/* 6. Voltar Turno                                               */
/* ============================================================ */
let mt = mundoDe(M.criarEncontro({ grupo: "afty", id: "e_mt", agora: () => 1 }), {}, { lia: liaF });
mt = R(mt, { tipo: "ADICIONAR", combatente: M.criarCriatura(ogroF, { chave: "fm_creatures_afty_v1", derived: dOgro, id: "c_ogro" }), iniciativa: 20 });
mt = R(mt, { tipo: "ADICIONAR", combatente: M.criarPersonagem(liaF, { chave: "fm_creatures_player_v1", derived: dLia, id: "c_lia" }), sessao: S.sessaoEmBranco(dLia), iniciativa: 15 });
mt = R(mt, { tipo: "ADICIONAR", combatente: M.criarMarcador({ nome: "Guarda", lado: "inimigo", pvMax: 30, id: "c_guarda" }), iniciativa: 10 });
mt = R(mt, { tipo: "COMECAR", derivados: der(mt) });
t("logo depois do Começar não há o que voltar", [podeVoltarTurno(mt), R(mt, { tipo: "VOLTAR_TURNO" }) === mt], [{ pode: false, erro: "Nada a Voltar" }, true]);
t("o VOLTAR_TURNO é ação do redutor", ACOES_DO_REDUTOR.includes("VOLTAR_TURNO"), true);
const antesDoTurno = mt;
let mt1 = R(mt, { tipo: "PROXIMO_TURNO", derivados: der(mt) });
t("a passagem guarda a virada, e as linhas do turno levam o id dela", [mt1.encontro.ultimaVirada.tipo, mt1.encontro.ultimaVirada.de.ativoId, mt1.encontro.ultimaVirada.para.ativoId, mt1.encontro.log[0].lote === mt1.encontro.ultimaVirada.id],
  ["turno", "c_ogro", "c_lia", true]);
t("o fim do turno mudou o estado de alguém (é isso que volta)", mt1.encontro.ultimaVirada.deltas.length > 0, true);
let v = voltarTurno(mt1);
t("Voltar Turno devolve a Vez, a rodada e o estado de todos", [v.ok, v.mundo.encontro.ativoId, v.mundo.encontro.rodada, estados(v.mundo)], [true, "c_ogro", 1, estados(antesDoTurno)]);
t("e diz no Registro, sem guardar virada para voltar de novo", [v.mundo.encontro.log[0].mensagem, "ultimaVirada" in v.mundo.encontro, podeVoltarTurno(v.mundo).erro], ["Turno voltado para Ogro.", false, "Nada a Voltar"]);
t("o redutor faz o mesmo", R(mt1, { tipo: "VOLTAR_TURNO" }).encontro.ativoId, "c_ogro");
t("a virada passa por JSON e ainda volta", voltarTurno({ ...mt1, encontro: M.normalizarEncontro(JSON.parse(JSON.stringify(mt1.encontro))) }).ok, true);

/* As durações que desceram no fim do turno de quem aplicou voltam. */
{
  let m = mt1; // Vez da Lia, rodada 1. O Ogro põe uma condição de 2 rodadas na Lia fora do turno dele.
  m = O.operar(m, { tipo: "condicao", alvo: "c_lia", autor: MESTRE, entrada: { modo: "adicionar", aplicadorId: "c_ogro", condicao: { nome: "Atordoado", rodadas: 2 } } }, ctx(m)).mundo;
  m = R(m, { tipo: "PROXIMO_TURNO", derivados: der(m) }); // Guarda
  m = R(m, { tipo: "PROXIMO_TURNO", derivados: der(m) }); // Rodada 2, Ogro
  const rodadasDe = (x) => x.sessoes.lia.condicoes.find((c) => (c.nome ?? c) === "Atordoado")?.rodadas;
  const antesDoFimDoOgro = m;
  const depois = R(m, { tipo: "PROXIMO_TURNO", derivados: der(m) }); // fim do turno do Ogro: desce a condição dele
  t("controle: o fim do turno do Ogro desce a condição que ele pôs", [rodadasDe(antesDoFimDoOgro), rodadasDe(depois)], [2, 1]);
  const volta = voltarTurno(depois);
  t("Voltar Turno devolve a duração", [volta.ok, rodadasDe(volta.mundo), volta.mundo.encontro.ativoId], [true, 2, "c_ogro"]);
  const rodada = R(antesDoFimDoOgro, { tipo: "NOVA_RODADA", derivados: der(antesDoFimDoOgro) });
  const voltaRodada = voltarTurno(rodada);
  t("a Nova Rodada forçada também volta, com a rodada de antes", [rodada.encontro.rodada, voltaRodada.ok, voltaRodada.mundo.encontro.rodada, rodadasDe(voltaRodada.mundo), voltaRodada.mundo.encontro.log[0].mensagem],
    [3, true, 2, 2, "Turno voltado para Ogro, Rodada 2."]);
}

/* Quando não volta. */
{
  const caminho = mt1.encontro.ultimaVirada.deltas[0];
  const c = combatenteDe(mt1, caminho.alvo);
  const mexido = M.comEstado(mt1, c.id, O.aplicarDelta(M.estadoDoCombatente(c, mt1.sessoes), [{ caminho: caminho.delta[0].caminho, antes: caminho.delta[0].depois, depois: "outra coisa" }], { conferir: false }).estado);
  const r1 = voltarTurno(mexido);
  t("se alguém mexeu num caminho da virada depois, nada volta", [r1.ok, r1.erro, r1.mundo === mexido, r1.conflitos[0].alvo], [false, "Não Fecha", true, caminho.alvo]);
  t("e o redutor devolve o mesmo mundo", R(mexido, { tipo: "VOLTAR_TURNO" }) === mexido, true);
  const dano = O.operar(mt1, { tipo: "dano", alvo: "c_guarda", autor: MESTRE, entrada: { valor: 5 } }, ctx(mt1));
  t("um Dano em caminho que a virada não tocou não atrapalha", voltarTurno(dano.mundo).ok, true);
  const dois = R(mt1, { tipo: "PROXIMO_TURNO", derivados: der(mt1) });
  const umaVolta = voltarTurno(dois);
  t("um nível só: volta a última, e a de antes não", [umaVolta.ok, umaVolta.mundo.encontro.ativoId, podeVoltarTurno(umaVolta.mundo).erro], [true, "c_lia", "Nada a Voltar"]);
  t("quem tinha a Vez saiu da luta", voltarTurno(R(mt1, { tipo: "REMOVER", id: "c_ogro" })).erro, "Combatente Ausente");
  t("a Vez mudou por outro caminho", voltarTurno({ ...mt1, encontro: { ...mt1.encontro, ativoId: "c_guarda" } }).erro, "Turno Mudou");
  t("o Começar apaga a virada", "ultimaVirada" in R(R(mt1, { tipo: "REABRIR" }), { tipo: "COMECAR", derivados: der(mt1) }).encontro, false);
  t("a cópia do Encontro sai sem virada", "ultimaVirada" in M.duplicarEncontro(mt1.encontro, { gerarId }), false);
}

/* ============================================================ */
/* 7. Reabrir Volta à Luta                                       */
/* ============================================================ */
{
  const passou = R(mt1, { tipo: "PROXIMO_TURNO", derivados: der(mt1) }); // Vez do Guarda, rodada 1
  // Um número que o Encerrar zera e que o retorno exato devolve (os movimentos de servo da rodada).
  const servos = (x) => combatenteDe(x, "c_ogro").sessao.servosMovimentosUsados;
  const naLuta = M.comEstado(passou, "c_ogro", { ...combatenteDe(passou, "c_ogro").sessao, servosMovimentosUsados: 3 });
  const fim = R(naLuta, { tipo: "ENCERRAR" });
  t("controle: o Encerrar desliga a bancada do Afty, zera os servos e tira a Vez",
    [fim.encontro.status, fim.encontro.ativoId, combatenteDe(fim, "c_ogro").sessao.combate?.ativo, servos(fim)], ["finalizado", null, false, 0]);
  t("e guarda a virada do fim", [fim.encontro.ultimaVirada.tipo, fim.encontro.ultimaVirada.de.ativoId], ["encerrar", "c_guarda"]);
  t("Voltar Turno não serve no Finalizado", podeVoltarTurno(fim).erro, "Nada a Voltar");
  const volta = R(fim, { tipo: "REABRIR" });
  t("Reabrir volta à luta na mesma rodada e na mesma Vez", [volta.encontro.status, volta.encontro.rodada, volta.encontro.ativoId], ["ativo", naLuta.encontro.rodada, "c_guarda"]);
  t("e o estado de todos volta ao de antes do Encerrar (o retorno exato)", [estados(volta), servos(volta)], [estados(naLuta), 3]);
  t("o Registro diz", mensagens(Velho.registroEmOrdem(volta.encontro.log, { maisNovoPrimeiro: true })).slice(0, 2), ["Turno de Guarda.", "Combate reaberto. Rodada 1."]);
  t("e não guarda virada", "ultimaVirada" in volta.encontro, false);

  // Alguém mexeu num caminho do Encerrar depois dele: o retorno exato não fecha.
  const semExato = M.comEstado(fim, "c_ogro", { ...combatenteDe(fim, "c_ogro").sessao, servosMovimentosUsados: 1 });
  const reaberto = R(semExato, { tipo: "REABRIR" });
  t("sem o retorno exato, cada motor só religa (o que mudou fica) e a Vez é a de quando encerrou",
    [reaberto.encontro.status, reaberto.encontro.ativoId, combatenteDe(reaberto, "c_ogro").sessao.combate?.ativo, servos(reaberto), reaberto.sessoes.lia.combate?.ativo],
    ["ativo", "c_guarda", true, 1, true]);

  const antigo = { ...fim, encontro: { ...fim.encontro, rodada: 3 } };
  delete antigo.encontro.ultimaVirada;
  const r3 = R(antigo, { tipo: "REABRIR" });
  t("o Finalizado de antes, sem virada, volta na rodada dele com a Vez do primeiro da ordem", [r3.encontro.status, r3.encontro.rodada, r3.encontro.ativoId], ["ativo", 3, "c_ogro"]);
  t("Em Combate, o Reabrir de sempre volta ao Planejamento", [R(naLuta, { tipo: "REABRIR" }).encontro.status, "ultimaVirada" in R(naLuta, { tipo: "REABRIR" }).encontro], ["planejando", false]);

  t("na Sala, o Reabrir que volta à luta publica reabrir, nunca um Começar novo",
    SE.eventosEntre(fim.encontro, volta.encontro).map((e) => e.evento), ["reabrir", "turno"]);
  t("o Reabrir para o Planejamento segue publicando reabrir", SE.eventosEntre(fim.encontro, { ...fim.encontro, status: "planejando" }).map((e) => e.evento), ["reabrir"]);
  t("o Começar segue publicando comecar", SE.eventosEntre(mc.encontro, R(mc, { tipo: "COMECAR", derivados: der(mc) }).encontro)[0].evento, "comecar");
}

/* ============================================================ */
/* 8. As Criaturas Base no inventário do /                       */
/* ============================================================ */
{
  const Li = await import(E + "listas.js");
  // O compêndio de verdade puxa JSON sem atributo de import, que o Node recusa: aqui vão duas criaturas na forma dele.
  const COMPENDIO = [
    { id: "builtin_lobo", name: "Lobo", isBuiltIn: true, stats: { hpMax: 22, peMax: 0, iniciativa: 3 } },
    { id: "builtin_urso", name: "Urso", isBuiltIn: true, stats: { hpMax: 40, peMax: 0, iniciativa: 1 } },
    { id: "builtin_errado", name: "Marcada", isBuiltIn: true, rulesVersion: "afty" },
  ];
  const armazem = new Map([["fm_creatures_v1", JSON.stringify([{ id: "builtin_urso", name: "Urso Editado", stats: { hpMax: 50 } }, { id: "minha", name: "Minha", stats: { hpMax: 9 } }])]]);
  const loja = { getItem: (k) => armazem.get(k) ?? null };
  const inv = Li.inventarioDoGrupo("site", loja);
  const comBase = Li.inventarioComCriaturasBase(inv, COMPENDIO);
  t("as Criaturas Base entram no fim do inventário, como criatura da 2.5.2 marcada base",
    comBase.fichas.filter((e) => e.base).map((e) => [e.chave, e.motor, e.tipo, e.marca, e.ficha.name]),
    [["compendio", "252", "criatura", "2.5.2", "Lobo"], ["compendio", "252", "criatura", "2.5.2", "Urso"]]);
  t("as do inventário do usuário continuam primeiro, e vencem no porId", [comBase.fichas[0].ficha.name, comBase.porId.get("builtin_urso").ficha.name, comBase.porId.get("builtin_lobo").base], ["Urso Editado", "Urso Editado", true]);
  t("a ficha marcada de outro livro não entra como base", comBase.fichas.some((e) => e.ficha.id === "builtin_errado"), false);
  t("sem compêndio (o /Player e as outras rotas) o inventário fica o mesmo", [Li.inventarioComCriaturasBase(inv, null) === inv, Li.inventarioComCriaturasBase(inv, []) === inv], [true, true]);
  t("a mesma entrada dá o mesmo objeto (o cache do derivado é pela identidade)", Li.inventarioComCriaturasBase(inv, COMPENDIO) === comBase, true);
  t("o compêndio não é mexido", COMPENDIO[0], { id: "builtin_lobo", name: "Lobo", isBuiltIn: true, stats: { hpMax: 22, peMax: 0, iniciativa: 3 } });
  const lobo = comBase.fichas.find((e) => e.ficha.id === "builtin_lobo");
  const cLobo = M.criarCriatura(lobo.ficha, { chave: lobo.chave, motor: lobo.motor, id: "c_lobo" });
  t("a Criatura Base entra como CÓPIA da 2.5.2, cheia", [cLobo.motor, cLobo.snapshot !== lobo.ficha, cLobo.combatState.hpCurrent, cLobo.origem], ["252", true, 22, { chave: "compendio", id: "builtin_lobo" }]);
  t("e a cópia sabe que não tem original para editar", [Li.ehCopiaDeCriaturaBase(cLobo), Li.ehCopiaDeCriaturaBase(M.criarCriatura(gobF, { chave: "fm_creatures_afty_v1", derived: dGob }))], [true, false]);
  t("e nunca aparece como desatualizada", Li.fichaNovaDe(cLobo, comBase), null);
}

if (bad.length) {
  console.log(`FALHARAM ${bad.length}:`);
  for (const b of bad) console.log(b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
