/* A DURAÇÃO NO FIM DO TURNO DE QUEM APLICOU (Encontro Unificado, etapa 5, 2026-11-17).

   Regra nova do autor, que REVOGA "a duração desce para todos na virada da rodada": no Encontro, só as durações em rodadas
   (Efeitos, condições, usos, e na criatura da 2.5.2 condições e modificadores) descem, no FIM DO TURNO DE QUEM APLICOU. O que é
   por rodada (Guarda, cascas, contadores, Expansão, recargas, invocações) segue na virada. Decisões do mesmo dia:
     - quem aplicou mora em `aplicadorId` ("Campo Novo aplicadorId": o `aplicadoPor` dos recebidos segue sendo o NOME);
     - a entrada aplicada no turno de quem aplicou só começa a descer no turno seguinte dele ("Não, Começa no Próximo");
     - o Nova Rodada forçado encerra os turnos que faltam ("Encerra os Turnos que Faltam");
     - o Pacote para Aliados conta como do receptor até a Fase 2 ("Do Receptor, até a Fase 2");
     - Exaustão de Técnica, Invencível sob o Sol e Talismã do Ápice são duração ("Duração");
     - os usos próprios com rodadas são duração ("Duração");
     - sem combatente autor (o Mestre pelo painel), a entrada é do alvo, salvo escolha ("Do Alvo, Salvo Escolha").

   Prova, nesta ordem:
     1. a Ficha sozinha igual a hoje (Encerrar Meu Turno desce tudo, de todos os aplicadores, e o botão mudou de nome);
     2. as peças puras (`desceDuracoesDe`, `marcaAplicador`, `repassaAplicador`, a virada sem duração);
     3. o fim do turno do aplicador, pelo redutor, com personagem ligado, criatura do Afty e criatura da 2.5.2;
     4. o aplicador pulado (Abatido e Fora da Ordem);
     5. o aplicador removido;
     6. o Nova Rodada forçado;
     7. o que o próprio turno cria (os gatilhos turn_start e turn_end da 2.5.2) ganha a marca do turno. */
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
const U = await import(A + "ficha/ficha-uso-estado.js");
const M = await import(E + "modelo.js");
const O = await import(E + "operacoes.js");
const Mo = await import(E + "motores/index.js");
const V = await import(E + "motores/m252-vital.js");
const { redutorDoEncontro: R, mundoDe } = await import(E + "redutor.js");
const { readFileSync } = await import("node:fs");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};
let n = 0;
const gerarId = (p) => `${p}_t${n++}`;
let relogio = 7000;
const agora = () => relogio++;

/* ---------- as fichas ---------- */
const comCore = (core, extra) => {
  const f = createBlankAfty();
  return { ...f, ...extra, core: { ...f.core, ...core } };
};
const ogroF = comCore({ nd: 12, tipo: "combatente", origem: { id: "inato" } }, { id: "ogro", name: "Ogro", rulesVersion: "afty" });
const liaF = comCore({ nd: 19 }, { id: "lia", name: "Lia", rulesVersion: "player", system: "player", especializacoes: [{ id: "combatente", nivel: 19 }] });
const velhaF = {
  id: "velha252", name: "Velha", core: { nd: 5, bonusTreinamento: 4, patamar: "comum" },
  attributes: { forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 },
  stats: { hpMax: 100, peMax: 20, guardaInabavalMax: 10, rdGeral: 5, defesa: 15, iniciativa: 3 }, saves: {}, features: [],
};
const dOgro = deriveAfty(ogroF);
const dLia = deriveAfty(liaF);

const MESTRE = { conta: null, papel: "mestre", combatente: null };
const PELO = (id) => ({ conta: null, papel: "mestre", combatente: id });

/* ============================================================ */
/* 1. A Ficha sozinha igual a hoje                               */
/* ============================================================ */
const rica = () => S.normalizaSessao({
  ...S.sessaoEmBranco(dLia),
  rodada: 2,
  peAtual: 30,
  combate: { ativo: true, invencivelSobOSol: true, invencivelRodadas: 1, talismaApice: true, talismaApiceRodadas: 3 },
  exaustaoTecnica: { restantes: 2, total: 2, fonte: "Expansão" },
  buffs: [
    { id: "b1", nome: "Um", canal: "defesa", expr: "2", rodadas: 1 },
    { id: "b2", nome: "Dois", canal: "defesa", expr: "1", rodadas: 2, aplicadorId: "c_outro" },
    { id: "b3", nome: "Sem", canal: "defesa", expr: "1", rodadas: null },
    { id: "b4", nome: "Marcado", canal: "defesa", expr: "1", rodadas: 3, aplicadorId: "c_x", aguardaFimDoTurno: true },
    { id: "r1", rec: true, origemNome: "Pacote", aplicadoPor: "Yuki", rodadas: null,
      beneficios: [{ canal: "defesa", valor: 2, rodadas: 1 }, { canal: "dano", valor: 1, rodadas: 3 }, { canal: "cd", valor: 1 }] },
  ],
  condicoes: [{ id: "c1", nome: "Desprevenido", rodadas: 1 }, { id: "c2", nome: "Cego", rodadas: 3, aplicadorId: "c_gob" }, "Caído"],
  uso: { ativos: {
    u1: { id: "u1", nome: "Uso Dois", duracao: { tipo: "rodadas", restantes: 2 } },
    u2: { id: "u2", nome: "Uso Um", duracao: { tipo: "rodadas", restantes: 1 }, aplicadorId: "c_outro" },
    u3: { id: "u3", nome: "Manter", duracao: { tipo: "manutencao" }, manutencao: { pe: 2, mantidas: 0, devidas: 0 } },
  } },
  aguardaFimDoTurno: ["invencivelSobOSol"],
}, dLia);
const s0 = rica();
const f1 = S.proximaRodada(s0, dLia);
const ativosF = U.usoDe(f1.sessao).ativos;
t("Ficha: o aplicadorId sobrevive à leitura do uso (a normalização não o apaga)", U.usoDe(s0).ativos.u2.aplicadorId, "c_outro");
t("Ficha: Encerrar Meu Turno desce TODOS os buffs, de todos os aplicadores, e a marca some na descida",
  f1.sessao.buffs.map((b) => [b.id, b.rodadas, b.aplicadorId ?? null, !!b.aguardaFimDoTurno]),
  [["b2", 1, "c_outro", false], ["b3", null, null, false], ["b4", 2, "c_x", false], ["r1", null, null, false]]);
t("Ficha: o prazo por benefício desce como sempre (o de 1 sai, o de 3 vira 2, o sem prazo fica)",
  f1.sessao.buffs.find((b) => b.id === "r1").beneficios.map((b) => b.rodadas ?? null), [2, null]);
t("Ficha: as condições descem todas, a do Goblin também", f1.sessao.condicoes, [{ id: "c2", nome: "Cego", rodadas: 2, aplicadorId: "c_gob" }, "Caído"]);
t("Ficha: o aviso do que acabou é o de sempre", f1.expirou.map((e) => e.nome), ["Um", "Pacote (Defesa)", "Desprevenido"]);
t("Ficha: os usos em rodadas descem todos e a manutenção fica devida", [Object.keys(ativosF), ativosF.u1.duracao.restantes, ativosF.u3.manutencao.devidas],
  [["u1", "u3"], 1, 1]);
t("Ficha: a Exaustão de Técnica desce, o Invencível cobra 4 PE e conta, o Talismã conta, e a marca da sessão some",
  [f1.sessao.exaustaoTecnica?.restantes, f1.sessao.peAtual, f1.sessao.combate.invencivelRodadas, f1.sessao.combate.talismaApiceRodadas, "aguardaFimDoTurno" in f1.sessao],
  [1, 26, 2, 4, false]);
const semMarca = (x) => JSON.parse(JSON.stringify(x, (k, v) => (k === "aguardaFimDoTurno" ? undefined : v)));
t("Ficha: sem as marcas (que não existem em dado de hoje), o resultado é o mesmo com ou sem aplicadorId nas entradas",
  JSON.stringify(semMarca(S.proximaRodada(s0, dLia).sessao.condicoes.map((c) => (typeof c === "string" ? c : c.rodadas)))),
  JSON.stringify(semMarca(S.proximaRodada({ ...s0, condicoes: s0.condicoes.map((c) => (typeof c === "string" ? c : { id: c.id, nome: c.nome, rodadas: c.rodadas })) }, dLia).sessao.condicoes.map((c) => (typeof c === "string" ? c : c.rodadas)))));
const g2 = readFileSync(new URL("../src/systems/afty/ficha/efeitos/CabecalhoG2.jsx", import.meta.url), "utf8");
const classica = readFileSync(new URL("../src/systems/afty/ficha/AftyFichaClassica.jsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/systems/afty/ficha/ficha.css", import.meta.url), "utf8");
t("o botão se chama Encerrar Meu Turno na G2 e na clássica, e chama a mesma proximaRodada",
  [g2.includes('aria-label="Encerrar Meu Turno" title="Encerrar Meu Turno"'), /proximaRodada\(s, derived\)\.sessao\)\}\s*title="Encerrar Meu Turno"\s*aria-label="Encerrar Meu Turno"/.test(classica),
    g2.includes("Próxima rodada"), classica.includes('"Próxima rodada"')],
  [true, true, false, false]);
t("o cabeçalho compacto da clássica segue mostrando o botão (o seletor do CSS acompanha o nome)", [css.includes('[aria-label="Encerrar Meu Turno"]'), css.includes('[aria-label="Próxima rodada"]')], [true, false]);

/* ============================================================ */
/* 2. As peças puras                                             */
/* ============================================================ */
t("o aplicador ausente lê como proprio, string também", [U.aplicadorDe({ id: "x" }), U.aplicadorDe("Caído"), U.aplicadorDe(null), U.aplicadorDe({ aplicadorId: "c_a" })], ["proprio", "proprio", "proprio", "c_a"]);
t("descer de quem não aplicou nada devolve a MESMA sessão", S.desceDuracoesDe(s0, "c_ninguem", { derived: dLia }).sessao === s0, true);
const so = S.desceDuracoesDe(s0, "c_outro", { derived: dLia });
t("descer do c_outro: só o buff e o uso dele descem", [so.sessao.buffs.map((b) => [b.id, b.rodadas]), Object.keys(U.usoDe(so.sessao).ativos), so.sessao.condicoes.length, so.sessao.peAtual],
  [[["b1", 1], ["b2", 1], ["b3", null], ["b4", 3], ["r1", null]], ["u1", "u3"], 3, 30]);
const sx = S.desceDuracoesDe(s0, "c_x", { derived: dLia });
t("a entrada com a marca do turno só perde a marca", sx.sessao.buffs.find((b) => b.id === "b4"), { id: "b4", nome: "Marcado", canal: "defesa", expr: "1", rodadas: 3, aplicadorId: "c_x" });
const sp = S.desceDuracoesDe(s0, "proprio", { derived: dLia });
t("descer as próprias: as sem aplicador descem, o Invencível marcado só perde a marca, a Exaustão e o Talismã andam",
  [sp.sessao.buffs.map((b) => b.id), sp.sessao.condicoes.map((c) => (typeof c === "string" ? c : c.id)), sp.expirou.map((e) => e.nome),
    sp.sessao.exaustaoTecnica?.restantes, sp.sessao.combate.invencivelRodadas, sp.sessao.peAtual, sp.sessao.combate.talismaApiceRodadas, sp.sessao.aguardaFimDoTurno ?? null, Object.keys(U.usoDe(sp.sessao).ativos)],
  [["b2", "b3", "b4", "r1"], ["c2", "Caído"], ["Um", "Pacote (Defesa)", "Desprevenido"], 1, 1, 30, 4, null, ["u1", "u2", "u3"]]);
const sp2 = S.desceDuracoesDe(sp.sessao, "proprio", { derived: dLia });
t("o fim do turno seguinte já cobra o Invencível (4 PE) e conta a rodada", [sp2.sessao.peAtual, sp2.sessao.combate.invencivelRodadas, sp2.registro.pagou.map((p) => p.id)], [26, 2, ["invencivelSobOSol"]]);
const vir = S.proximaRodada(s0, dLia, { preservarTurnoArmas: true, descerDuracoes: false });
t("a virada do Encontro não desce duração nenhuma e não cobra o Invencível",
  [vir.sessao.buffs.length, vir.sessao.condicoes.length, vir.expirou.length, vir.sessao.exaustaoTecnica?.restantes, vir.sessao.peAtual, vir.sessao.combate.invencivelRodadas, vir.sessao.combate.talismaApiceRodadas, Object.keys(U.usoDe(vir.sessao).ativos)],
  [5, 3, 0, 2, 30, 1, 3, ["u1", "u2", "u3"]]);
t("e segue fazendo o que é por rodada: a rodada sobe e a manutenção fica devida", [vir.sessao.rodada, U.usoDe(vir.sessao).ativos.u3.manutencao.devidas], [3, 1]);
t("a Expansão segue na virada (por rodada)", (() => {
  const s = { ...s0, combate: { ...s0.combate, dominioAtivo: "x", dominioFase: "aberta", dominioRodadas: 3 } };
  return S.proximaRodada(s, dLia, { preservarTurnoArmas: true, descerDuracoes: false }).sessao.combate.dominioRodadas;
})(), 2);

const antes = S.normalizaSessao({ ...S.sessaoEmBranco(dOgro), buffs: [{ id: "velho", rodadas: 2 }], condicoes: [{ id: "cv", nome: "Lento", rodadas: 1 }] }, dOgro);
const depois = { ...antes, buffs: [...antes.buffs, { id: "novo", rodadas: 2 }, { id: "sem", rodadas: null }], condicoes: [...antes.condicoes, { id: "cn", nome: "Cego", rodadas: 1 }, "Caído"] };
const mDe = S.marcaAplicador(antes, depois, { aplicadorId: "c_lia", noTurno: false });
t("marcaAplicador: só a entrada com rodadas que NASCEU ganha o aplicador", [mDe.buffs.map((b) => b.aplicadorId ?? null), mDe.condicoes.map((c) => (typeof c === "string" ? c : c.aplicadorId ?? null))],
  [[null, "c_lia", null], [null, "c_lia", "Caído"]]);
const mNo = S.marcaAplicador(antes, depois, { aplicadorId: "proprio", noTurno: true });
t("marcaAplicador própria no turno: só a marca, sem aplicadorId", [mNo.buffs[1], mNo.condicoes[1]], [{ id: "novo", rodadas: 2, aguardaFimDoTurno: true }, { id: "cn", nome: "Cego", rodadas: 1, aguardaFimDoTurno: true }]);
t("marcaAplicador própria fora do turno não muda nada (o MESMO objeto)", S.marcaAplicador(antes, depois, { aplicadorId: "proprio", noTurno: false }) === depois, true);
t("marcaAplicador: ligar o Invencível no turno marca a sessão", S.marcaAplicador(antes, { ...antes, combate: { ativo: true, invencivelSobOSol: true } }, { noTurno: true }).aguardaFimDoTurno, ["invencivelSobOSol"]);
t("marcaAplicador: o uso novo em rodadas ganha a marca e sobrevive à leitura", (() => {
  const d2 = { ...antes, uso: { ...U.usoDe(antes), ativos: { p: { id: "p", nome: "Postura", duracao: { tipo: "rodadas", restantes: 10 } } } } };
  const m = S.marcaAplicador(antes, d2, { noTurno: true });
  return [U.usoDe(m).ativos.p.aguardaFimDoTurno, U.usoDe(S.normalizaSessao(JSON.parse(JSON.stringify(m)), dOgro)).ativos.p.aguardaFimDoTurno];
})(), [true, true]);
const rep = S.repassaAplicador({ ...antes, condicoes: [{ id: "a", rodadas: 2, aplicadorId: "c_sai", aguardaFimDoTurno: true }, { id: "b", rodadas: 2, aplicadorId: "c_fica" }] }, "c_sai");
t("repassaAplicador: o que o que saiu aplicou vira da própria ficha, sem a marca", rep.condicoes, [{ id: "a", rodadas: 2 }, { id: "b", rodadas: 2, aplicadorId: "c_fica" }]);
t("repassaAplicador sem nada dele devolve a MESMA sessão", S.repassaAplicador(antes, "c_sai") === antes, true);
t("os três verbos novos estão nos dois motores", [Mo.faltasDoAdaptador(Mo.motorAfty), Mo.faltasDoAdaptador(Mo.motor252), ["desceDuracoesDe", "marcarAplicador", "repassarAplicador"].every((v) => Mo.VERBOS_DO_MOTOR.includes(v))], [[], [], true]);

/* ============================================================ */
/* O mundo: Ogro 20, Lia 15 (ligada), Velha 10 (2.5.2), Bea 5    */
/* ============================================================ */
const der = (m) => M.derivarEncontro(m).mapa;
const ctx = (m) => ({ derivados: der(m), gerarId, agora });
const montar = ({ flags = {}, velha = velhaF } = {}) => {
  let m = mundoDe(M.criarEncontro({ grupo: "site", id: "e5", agora: () => 1 }), {}, { lia: liaF });
  m = R(m, { tipo: "ADICIONAR", combatente: M.criarCriatura(ogroF, { chave: "fm_creatures_afty_v1", derived: dOgro, id: "c_ogro" }), iniciativa: 20 });
  m = R(m, { tipo: "ADICIONAR", combatente: M.criarPersonagem(liaF, { chave: "fm_creatures_player_v1", derived: dLia, id: "c_lia" }), sessao: S.sessaoEmBranco(dLia), iniciativa: 15 });
  m = R(m, { tipo: "ADICIONAR", combatente: M.criarCriatura(velha, { chave: "fm_creatures_v1", motor: "252", id: "c_velha" }), iniciativa: 10 });
  m = R(m, { tipo: "ADICIONAR", combatente: M.criarMarcador({ nome: "Bea", id: "c_bea" }), iniciativa: 5 });
  for (const [id, f] of Object.entries(flags)) for (const [chave, valor] of Object.entries(f)) m = R(m, { tipo: "DEFINIR_FLAG", id, chave, valor });
  return m;
};
const opera = (m, intencao) => {
  const r = O.operar(m, intencao, ctx(m));
  if (!r.ok) throw new Error(`operação recusada: ${JSON.stringify(r.erro ?? r.conflitos)}`);
  return r.mundo;
};
const condAfty = (m, alvo, autor, condicao, extra = {}) => opera(m, { tipo: "condicao", alvo, autor, entrada: { modo: "adicionar", condicao, ...extra } });
const cond252 = (m, autor, condicao, extra = {}) => opera(m, { tipo: "condicao", alvo: "c_velha", autor, entrada: { modo: "adicionar", condicao, ...extra } });
const passa = (m) => R(m, { tipo: "PROXIMO_TURNO", derivados: der(m) });
const comeca = (m) => R(m, { tipo: "COMECAR", derivados: der(m) });
const cs = (m, id) => m.encontro.combatentes.find((c) => c.id === id);
const condLia = (m) => m.sessoes.lia.condicoes.map((c) => [c.id, c.rodadas, c.aplicadorId ?? null, !!c.aguardaFimDoTurno]);
const condOgro = (m) => cs(m, "c_ogro").sessao.condicoes.map((c) => [c.id, c.rodadas, c.aplicadorId ?? null, !!c.aguardaFimDoTurno]);
const buffsOgro = (m) => cs(m, "c_ogro").sessao.buffs.map((b) => [b.id, b.rodadas, !!b.aguardaFimDoTurno]);
const velha = (m) => {
  const c = cs(m, "c_velha").combatState;
  return [c.activeConditions.map((x) => [x.id, x.duracao, x.aplicadorId ?? null, !!x.aguardaFimDoTurno]), c.activeModifiers.map((x) => [x.id, x.duration.rounds, x.aplicadorId ?? null])];
};
const logs = (m) => m.encontro.log.map((l) => l.mensagem);

/* ============================================================ */
/* 3. O fim do turno do aplicador                                */
/* ============================================================ */
let m = comeca(montar());
t("controle: a ordem começa no Ogro", [m.encontro.ativoId, m.encontro.rodada], ["c_ogro", 1]);
// No turno do Ogro: ele põe Cego (1 rodada) na Lia e Abalado (1) na Velha. E o Mestre, sem combatente, põe um buff de 1 no próprio Ogro.
m = condAfty(m, "c_lia", PELO("c_ogro"), { id: "cego", nome: "Cego", rodadas: 1 });
m = cond252(m, PELO("c_ogro"), { id: "abalado", name: "abalado", duracao: 1 });
m = opera(m, { tipo: "sessao", alvo: "c_ogro", autor: MESTRE, passo: (s) => ({ ...s, buffs: [...s.buffs, { id: "bOgro", nome: "Fúria", canal: "defesa", expr: "1", rodadas: 1 }] }) });
// Ainda no turno do Ogro, o Mestre escolhe a Lia como quem aplicou um Lento de 2 rodadas no Ogro (fora do turno dela: sem marca).
m = condAfty(m, "c_ogro", MESTRE, { id: "lento", nome: "Lento", rodadas: 2 }, { aplicadorId: "c_lia" });
t("a operação carimba quem aplicou e a marca do turno (personagem ligado)", condLia(m), [["cego", 1, "c_ogro", true]]);
t("na criatura da 2.5.2 também", velha(m)[0], [["abalado", 1, "c_ogro", true]]);
t("sem combatente autor, a entrada é do próprio alvo, e marcada porque é o turno dele", buffsOgro(m), [["bOgro", 1, true]]);
t("o aplicador escolhido na tela vence, e fora do turno dele não há marca", condOgro(m), [["lento", 2, "c_lia", false]]);

m = passa(m); // fim do turno do Ogro, r1
t("o fim do turno em que foi aplicado só tira a marca (1 rodada não acaba antes de alguém jogar com ela)",
  [condLia(m), velha(m)[0], buffsOgro(m), condOgro(m)], [[["cego", 1, "c_ogro", false]], [["abalado", 1, "c_ogro", false]], [["bOgro", 1, false]], [["lento", 2, "c_lia", false]]]);
// No turno da Lia, o Mestre põe na Velha um modificador próprio dela, de 1 rodada (fora do turno da Velha).
m = opera(m, { tipo: "sessao", alvo: "c_velha", autor: MESTRE, passo: (c) => ({ ...c, activeModifiers: [...(c.activeModifiers ?? []), { id: "modV", name: "Pele", stat: "defesa", op: "add", value: 1, stack: "sum", duration: { kind: "rounds", rounds: 1 }, enabled: true }] }) });
m = passa(m); // fim do turno da Lia, r1
t("o fim do turno da Lia desce o que ela aplicou (Lento 2 vira 1), e não mexe no do Ogro", [condOgro(m), condLia(m)], [[["lento", 1, "c_lia", false]], [["cego", 1, "c_ogro", false]]]);
m = passa(m); // fim do turno da Velha, r1
t("o fim do turno da Velha desce o modificador próprio dela (1 acaba), e o Abalado do Ogro fica", velha(m), [[["abalado", 1, "c_ogro", false]], []]);
m = passa(m); // fim do turno da Bea, r1: vira a rodada
t("a virada não desce duração nenhuma", [m.encontro.rodada, m.encontro.ativoId, condLia(m), velha(m)[0], buffsOgro(m), condOgro(m)],
  [2, "c_ogro", [["cego", 1, "c_ogro", false]], [["abalado", 1, "c_ogro", false]], [["bOgro", 1, false]], [["lento", 1, "c_lia", false]]]);
m = passa(m); // fim do turno do Ogro, r2
t("o fim do turno seguinte do Ogro acaba o que ele aplicou: na Lia, na Velha e nele mesmo", [condLia(m), velha(m)[0], buffsOgro(m), condOgro(m)], [[], [], [], [["lento", 1, "c_lia", false]]]);
t("o Registro avisa cada uma, a da 2.5.2 com a frase dela", ["Cego de Lia chegou ao fim.", "A condição [abalado] de Velha chegou ao fim e foi removida.", "Fúria de Ogro chegou ao fim."].map((f) => logs(m).includes(f)), [true, true, true]);
m = passa(m); // fim do turno da Lia, r2
t("e o Lento acaba no fim do turno da Lia", condOgro(m), []);

/* ============================================================ */
/* 4. O aplicador pulado                                         */
/* ============================================================ */
{
  // O Ogro aplica antes da luta (sem marca) e cai. A Velha aplica e fica Fora da Ordem.
  let p = montar();
  p = condAfty(p, "c_lia", PELO("c_ogro"), { id: "cego", nome: "Cego", rodadas: 2 });
  p = condAfty(p, "c_lia", PELO("c_velha"), { id: "surdo", nome: "Surdo", rodadas: 1 });
  p = R(p, { tipo: "DEFINIR_FLAG", id: "c_ogro", chave: "abatido", valor: true });
  p = R(p, { tipo: "DEFINIR_FLAG", id: "c_velha", chave: "foraDaOrdem", valor: true });
  p = comeca(p);
  t("pulado: o primeiro a jogar é a Lia", p.encontro.ativoId, "c_lia");
  p = passa(p); // fim da Lia: a posição da Velha (pulada) vem logo depois e dispara a descida dela
  t("Fora da Ordem: a posição da Velha dispara a descida do que ela aplicou", [p.encontro.ativoId, condLia(p)], ["c_bea", [["cego", 2, "c_ogro", false]]]);
  p = passa(p); // fim da Bea: vira, e a posição do Ogro (Abatido, primeiro da ordem) dispara depois da virada
  t("Abatido: a posição do Ogro, depois da virada, desce o que ele aplicou", [p.encontro.rodada, p.encontro.ativoId, condLia(p)], [2, "c_lia", [["cego", 1, "c_ogro", false]]]);
  const i = p.encontro.log.findIndex((l) => l.mensagem === "Rodada 2 iniciada.");
  t("controle: a virada vem antes da vez da Lia no Registro", i >= 0, true);
}

/* ============================================================ */
/* 5. O aplicador removido                                       */
/* ============================================================ */
{
  let r = montar();
  r = condAfty(r, "c_lia", PELO("c_ogro"), { id: "cego", nome: "Cego", rodadas: 2 });
  r = cond252(r, PELO("c_ogro"), { id: "abalado", name: "abalado", duracao: 2 });
  r = R(r, { tipo: "REMOVER", id: "c_ogro" });
  t("removido: as entradas dele passam a ser de quem carrega", [condLia(r), velha(r)[0]], [[["cego", 2, null, false]], [["abalado", 2, null, false]]]);
  r = comeca(r);
  r = passa(r); // fim da Lia
  t("e descem no fim do turno de quem carrega", [condLia(r), velha(r)[0]], [[["cego", 1, null, false]], [["abalado", 2, null, false]]]);
  r = passa(r); // fim da Velha
  t("a da criatura da 2.5.2 também", velha(r)[0], [["abalado", 1, null, false]]);
  // Aplicador que nunca esteve no Encontro (a sessão da ficha ligada veio de outra luta): desce no turno de quem carrega.
  let f = montar();
  f = { ...f, sessoes: { ...f.sessoes, lia: { ...f.sessoes.lia, condicoes: [{ id: "velho", nome: "Lento", rodadas: 2, aplicadorId: "c_de_outra_luta" }] } } };
  f = passa(comeca(R(f, { tipo: "DEFINIR_FLAG", id: "c_ogro", chave: "abatido", valor: true })));
  t("o aplicador ausente conta como da ficha que carrega", condLia(f), [["velho", 1, "c_de_outra_luta", false]]);
}

/* ============================================================ */
/* 6. O Nova Rodada forçado                                      */
/* ============================================================ */
{
  let q = montar();
  q = condAfty(q, "c_ogro", PELO("c_lia"), { id: "deLia", nome: "Cego", rodadas: 1 });
  q = condAfty(q, "c_ogro", PELO("c_velha"), { id: "deVelha", nome: "Surdo", rodadas: 1 });
  q = condAfty(q, "c_lia", PELO("c_ogro"), { id: "deOgro", nome: "Lento", rodadas: 1 });
  q = passa(comeca(q)); // a vez é da Lia (o Ogro já jogou)
  t("controle: a vez é da Lia, e o fim do turno do Ogro já desceu o dele", [q.encontro.ativoId, condLia(q)], ["c_lia", []]);
  q = condAfty(q, "c_lia", PELO("c_ogro"), { id: "deOgro2", nome: "Lento", rodadas: 1 });
  q = R(q, { tipo: "NOVA_RODADA", derivados: der(q) });
  t("o forçado encerra os turnos que faltam: o que a Lia e a Velha aplicaram acaba, o do Ogro (que já jogou) fica",
    [q.encontro.rodada, q.encontro.ativoId, condOgro(q), condLia(q)], [2, "c_lia", [], [["deOgro2", 1, "c_ogro", false]]]);
}

/* ============================================================ */
/* 7. O que o próprio turno cria                                 */
/* ============================================================ */
{
  // A Velha tem uma Aura: o começo do turno dela põe Abalado (1 rodada) nela mesma, e o fim põe Caído (1 rodada).
  const regra = (id, nome, gatilho, efeitos) => ({ id, name: nome, enabled: true, trigger: { type: gatilho }, activation: "toggle", cost: { pe: 0, acao: "" }, requires: "", effects: efeitos });
  const poe = (id, condition) => ({ id, type: "condition", op: "apply", condition, duration: { kind: "rounds", rounds: 1 } });
  const velhaAura = { ...velhaF, features: [{ id: "aura", name: "Aura", automation: { enabled: true, rules: [regra("r1", "Começo", "turn_start", [poe("e1", "abalado")]), regra("r2", "Fim", "turn_end", [poe("e2", "caido")])] } }] };
  let g = comeca(montar({ velha: velhaAura }));
  g = passa(passa(g)); // fim do Ogro e da Lia: começa o turno da Velha
  const conds = (x) => cs(x, "c_velha").combatState.activeConditions.map((c) => [c.name, c.duracao, !!c.aguardaFimDoTurno]);
  t("o gatilho do começo do turno põe a condição já com a marca do turno", [g.encontro.ativoId, conds(g)], ["c_velha", [["abalado", 1, true]]]);
  const daRodada1 = () => cs(g, "c_velha").combatState.activeConditions.map((c) => c.id);
  g = passa(g); // fim do turno da Velha: o gatilho do fim põe Caído, e a descida dela só tira as marcas
  const ids1 = daRodada1();
  t("o fim do turno não acaba o que o próprio turno criou (a de 1 rodada não some na mesma ação)", conds(g), [["abalado", 1, false], ["caido", 1, false]]);
  g = passa(passa(passa(passa(g)))); // Bea, virada, Ogro, Lia, e o fim do turno seguinte da Velha
  t("as da rodada anterior acabam no fim do turno seguinte dela", ids1.filter((id) => cs(g, "c_velha").combatState.activeConditions.some((c) => c.id === id)), []);
}

/* ============================================================ */
/* 8. O Desfazer ignora a marca do turno (autor, "Ignorar a Marca") */
/* ============================================================ */
{
  let u = comeca(montar());
  const aplica = (m, id, nome) => O.operar(m, { tipo: "condicao", alvo: "c_lia", autor: PELO("c_ogro"), entrada: { modo: "adicionar", condicao: { id, nome, rodadas: 2 } } }, ctx(m));
  const r1 = aplica(u, "cego", "Cego");
  const r2 = aplica(r1.mundo, "lento", "Lento");
  u = passa(r2.mundo); // o fim do turno do Ogro tira a marca das duas, e nada mais muda
  t("controle: o fim do turno só tirou as marcas", condLia(u), [["cego", 2, "c_ogro", false], ["lento", 2, "c_ogro", false]]);
  const d2 = O.desfazer(u, { alvo: "c_lia", operacaoId: r2.operacao.id }, MESTRE, ctx(u));
  t("depois do fim do turno de quem aplicou, o Desfazer ainda fecha (a marca não conta)", [d2.ok, d2.erro ?? null], [true, null]);
  t("e a primeira aplicação volta SEM a marca que já tinha perdido (não pula mais um fim de turno)", condLia(d2.mundo), [["cego", 2, "c_ogro", false]]);
  const d1 = O.desfazer(d2.mundo, { alvo: "c_lia", operacaoId: r1.operacao.id }, MESTRE, ctx(d2.mundo));
  t("a primeira também se desfaz", [d1.ok, condLia(d1.mundo)], [true, []]);
  // A rodada que DESCE ainda fecha o Desfazer, como fechava na virada antes da etapa 5.
  let w = passa(passa(passa(passa(u)))); // Lia, Velha, Bea (virada), e o fim do turno seguinte do Ogro: 2 vira 1
  t("controle: a rodada desceu", condLia(w), [["cego", 1, "c_ogro", false], ["lento", 1, "c_ogro", false]]);
  const d3 = O.desfazer(w, { alvo: "c_lia", operacaoId: r2.operacao.id }, MESTRE, ctx(w));
  t("depois que a rodada desce, o Desfazer não fecha (a regra de sempre)", [d3.ok, d3.erro, d3.conflitos], [false, "Não Fecha", [{ caminho: ["condicoes"], motivo: "mudou" }]]);
  t("semMarcasConsumidas: casa por id na lista e pela chave no objeto, e mantém a marca que ainda vale",
    O.semMarcasConsumidas({ a: [{ id: 1, aguardaFimDoTurno: true }, { id: 2, aguardaFimDoTurno: true }, { id: 3, aguardaFimDoTurno: true }] }, { a: [{ id: 1 }, { id: 2, aguardaFimDoTurno: true }] }),
    { a: [{ id: 1 }, { id: 2, aguardaFimDoTurno: true }, { id: 3, aguardaFimDoTurno: true }] });
}

if (bad.length) {
  console.log(bad.join("\n"));
  console.log(`\n${bad.length} FALHA(S), ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
