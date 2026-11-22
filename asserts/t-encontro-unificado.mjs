/* O Encontro Unificado, etapa 3 (2026-11-17): o modelo puro, os motores, as operações, os pedidos, o histórico, o
   Desfazer relativo, as ações em grupo, o redutor novo contra o antigo e as três listas. Ver docs/afty-encontros.md. */
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
const { redutorDeEncontro, derivarCombatente } = await import(E + "usar-encontro-afty.js");
const Mo = await import(E + "motores/index.js");
const { metade } = await import(E + "motores/afty.js");
const M = await import(E + "modelo.js");
const O = await import(E + "operacoes.js");
const { redutorDoEncontro: R, mundoDe, ACOES_DO_REDUTOR } = await import(E + "redutor.js");
const L = await import(E + "listas.js");
const { encontroDeAftyAntigo } = await import(E + "migracao.js");
const Nuvem = await import(new URL("../src/nuvem/nuvem-config.js", import.meta.url).href);
const { _mesclar: mesclar } = await import(new URL("../src/nuvem/nuvem-sync.js", import.meta.url).href);
const { readFileSync, readdirSync } = await import("node:fs");
const { fileURLToPath } = await import("node:url");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

let n = 0;
const gerarId = (p) => `${p}_t${n++}`;
let relogio = 5000;
const agora = () => relogio++;

/* ---------- as fichas ---------- */
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
t("controle: Lia tem 120 de Vida e Alma de pilha", [dLia.hp, dLia.almaMax, dLia.almaPilha], [120, 120, true]);
t("controle: o Ogro Calamidade tem Guarda", dOgro.guarda?.ativa, true);

const MESTRE = { conta: null, papel: "mestre", combatente: null };
const JOGADOR = { conta: null, papel: "jogador", combatente: "c_lia" };
const ESPECTADOR = { conta: null, papel: "espectador" };

/* ============================================================ */
/* 1. A interface e os dois motores                              */
/* ============================================================ */
t("o adaptador do Afty tem a interface inteira", Mo.faltasDoAdaptador(Mo.motorAfty), []);
t("o da 2.5.2 também (a conta inteira, desde a etapa 4)", Mo.faltasDoAdaptador(Mo.motor252), []);
t("os dez verbos do plano estão na interface", ["derivar", "aplicarDano", "aplicarCura", "gastarPe", "alma", "condicao", "iniciaTurno", "encerraTurno", "viraRodada", "resumo"]
  .every((v) => Mo.VERBOS_DO_MOTOR.includes(v)), true);
t("o erro de verbo pendente segue exportado (o Encontro ainda o trata como erro de tela)", [typeof Mo.MotorPendente, new Mo.MotorPendente("x", "v", 9).etapa], ["function", 9]);
t("a criatura da 2.5.2 nasce no Encontro novo, com o estado inicial (etapa 4)", (() => {
  const c = M.criarCriatura({ id: "x", name: "Velha", stats: { hpMax: 40, peMax: 6, guardaInabavalMax: 3, iniciativa: 2 } }, { motor: "252" });
  return [c.motor, c.combatState.hpCurrent, c.combatState.peCurrent, c.combatState.guardaInabavalCurrent, c.iniciativa.mod];
})(), ["252", 40, 6, 3, 2]);
t("o marcador não tem motor", Mo.motorDe(M.criarMarcador({ nome: "Bea" })), null);

/* ============================================================ */
/* 2. O modelo                                                   */
/* ============================================================ */
const cOgro = M.criarCriatura(ogroF, { chave: "fm_creatures_afty_v1", derived: dOgro, id: "c_ogro" });
const cGob = M.criarCriatura(gobF, { chave: "fm_creatures_afty_v1", derived: dGob, id: "c_gob" });
const cLia = M.criarPersonagem(liaF, { chave: "fm_creatures_player_v1", derived: dLia, id: "c_lia" });
const cBea = M.criarMarcador({ nome: "Bea", id: "c_bea" });
t("o personagem entra LIGADO, do lado Jogador, sem visão", [cLia.motor, cLia.tipo, cLia.fichaRef, cLia.flags.lado, cLia.visao, cLia.dono, "sessao" in cLia, "ficha" in cLia],
  ["afty", "personagem", { chave: "fm_creatures_player_v1", id: "lia" }, "jogador", null, { conta: null, papel: "jogador" }, false, false]);
t("a criatura entra cópia, cheia, Oculta e do Mestre", [cOgro.tipo, cOgro.sessao.hpAtual, cOgro.visao, cOgro.dono.papel, cOgro.origem, cOgro.ficha !== ogroF],
  ["criatura", dOgro.hp, "oculta", "mestre", { chave: "fm_creatures_afty_v1", id: "ogro" }, true]);
t("o marcador de jogador aparece pelo nome, o de inimigo nasce Oculto",
  [cBea.visao, M.criarMarcador({ lado: "inimigo" }).visao, cBea.flags], ["nome", "oculta", { abatido: false, foraDaOrdem: false, lado: "jogador" }]);
const norm = M.normalizarCombatente({ ...cGob, flags: { abatido: false, oculto: true, lado: "inimigo" }, visao: "qualquer" });
t("o oculto antigo vira Fora da Ordem, e visão inválida volta ao padrão", [norm.flags.foraDaOrdem, norm.visao, "oculto" in norm.flags], [true, "oculta", false]);
t("criatura sem ficha desce para marcador, com o mesmo nome", (() => { const x = M.normalizarCombatente({ id: "z", tipo: "criatura", nome: "Sumiu" }); return [x.tipo, x.nome, x.motor]; })(), ["marcador", "Sumiu", null]);
t("personagem não tem visão nem lendo", M.normalizarCombatente({ ...cLia, visao: "aberta" }).visao, null);
t("Encontro de outro formato não é saneado aqui", M.normalizarEncontro({ id: "e", combatentes: [] }), null);
t("a mesma ficha ligada duas vezes fica uma", M.normalizarEncontro({ ...M.criarEncontro({ id: "e" }), combatentes: [cLia, { ...cLia, id: "c_lia2" }] }).combatentes.length, 1);
t("só pedido pendente sobrevive à leitura", M.normalizarEncontro({ ...M.criarEncontro({ id: "e" }), pedidos: [{ id: "p1", pedido: { estado: "pendente" } }, { id: "p2", pedido: { estado: "aceito" } }, null] }).pedidos.map((p) => p.id), ["p1"]);
t("pessoa: sem conta decide o papel", [M.mesmaPessoa(MESTRE, { papel: "mestre" }), M.mesmaPessoa(MESTRE, { papel: "jogador" }), M.mesmaPessoa(JOGADOR, cLia.dono)], [true, false, true]);
t("pessoa: com conta decide a conta, e meio a meio é outra pessoa",
  [M.mesmaPessoa({ conta: "a", papel: "mestre" }, { conta: "a", papel: "jogador" }), M.mesmaPessoa({ conta: "a" }, { conta: "b" }), M.mesmaPessoa({ conta: "a", papel: "mestre" }, { conta: null, papel: "mestre" })],
  [true, false, false]);
t("duas cópias da mesma criatura viram #1 e #2, o personagem não", M.renumerarCopias([cGob, { ...cGob, id: "c_gob2" }, cLia]).map((c) => c.nome), ["Goblin #1", "Goblin #2", "Lia"]);

/* O mundo de teste: Ogro 20, Lia 15, Bea 10. */
let mundo = mundoDe(M.criarEncontro({ grupo: "afty", id: "e1", agora: () => 1 }), {}, { lia: liaF });
mundo = R(mundo, { tipo: "ADICIONAR", combatente: cOgro, iniciativa: 20 });
mundo = R(mundo, { tipo: "ADICIONAR", combatente: cLia, sessao: S.sessaoEmBranco(dLia), iniciativa: 15 });
mundo = R(mundo, { tipo: "ADICIONAR", combatente: cBea, iniciativa: 10 });
t("a mesma ficha não entra duas vezes", R(mundo, { tipo: "ADICIONAR", combatente: { ...cLia, id: "outro" } }) === mundo, true);
t("a sessão do ligado mora no mapa, fora do Encontro", [Object.keys(mundo.sessoes), mundo.encontro.combatentes.some((c) => "sessao" in c && c.tipo === "personagem")], [["lia"], false]);
t("o Encontro passa por JSON sem perder nada", M.normalizarEncontro(JSON.parse(JSON.stringify(mundo.encontro))), M.normalizarEncontro(mundo.encontro));
const der = (m) => M.derivarEncontro(m).mapa;
let D = der(mundo);
t("um derivado por combatente, o marcador sem", [D.c_ogro.hp, D.c_lia.hp, D.c_bea], [dOgro.hp, 120, null]);
t("o resumo: Vida, PE, Alma, condições e Efeitos", M.resumoDoCombatente(cLia, { sessoes: mundo.sessoes, derivados: D }),
  { pv: 120, pvMax: 120, pvTemp: 0, pe: dLia.pe, peMax: dLia.pe, peTemp: 0, alma: 120, almaMax: 120, condicoes: [], efeitos: [], caido: false, morto: false });

/* Turno: o marcador joga, Fora da Ordem e Abatido não. */
const ordemDe = (m) => {
  let x = R(m, { tipo: "COMECAR", derivados: der(m) });
  const vez = [x.encontro.ativoId];
  for (let i = 0; i < 3; i++) { x = R(x, { tipo: "PROXIMO_TURNO", derivados: der(x) }); vez.push(x.encontro.ativoId); }
  return [vez, x.encontro.rodada];
};
t("a ordem passa pelo marcador e vira a rodada", ordemDe(mundo), [["c_ogro", "c_lia", "c_bea", "c_ogro"], 2]);
t("Fora da Ordem pula a vez", ordemDe(R(mundo, { tipo: "DEFINIR_FLAG", id: "c_lia", chave: "foraDaOrdem", valor: true }))[0], ["c_ogro", "c_bea", "c_ogro", "c_bea"]);
t("o oculto antigo como chave também é Fora da Ordem", R(mundo, { tipo: "DEFINIR_FLAG", id: "c_bea", chave: "oculto", valor: true }).encontro.combatentes.find((c) => c.id === "c_bea").flags.foraDaOrdem, true);
t("flag desconhecida não entra", R(mundo, { tipo: "DEFINIR_FLAG", id: "c_bea", chave: "qualquer", valor: true }) === mundo, true);
t("a visão não vale no personagem", [R(mundo, { tipo: "DEFINIR_VISAO", id: "c_lia", visao: "aberta" }).encontro.combatentes[1].visao, R(mundo, { tipo: "DEFINIR_VISAO", id: "c_ogro", visao: "barra" }).encontro.combatentes[0].visao], [null, "barra"]);
t("a rolagem chega feita", R(mundo, { tipo: "ROLAR_UMA", id: "c_ogro", rolagem: 15 }).encontro.combatentes[0].iniciativa, { rolagem: 15, mod: cOgro.iniciativa.mod, total: 15 + cOgro.iniciativa.mod, manual: false });
t("Rolar Todas respeita quem digitou", R(mundo, { tipo: "ROLAR_TODAS", rolagens: { c_ogro: 3, c_lia: 4, c_bea: 5 } }).encontro.combatentes.map((c) => c.iniciativa.total), [20, 15, 10]);
t("configuração desconhecida não entra", R(mundo, { tipo: "CONFIGURAR", chave: "qualquer", valor: true }) === mundo, true);
t("o redutor conhece as ações de hoje", ["COMECAR", "PROXIMO_TURNO", "NOVA_RODADA", "ENCERRAR", "REABRIR", "REMOVER", "OPERACAO", "OPERACOES", "LEVANTAR_TODOS"].every((a) => ACOES_DO_REDUTOR.includes(a)), true);

/* O começo mexe na sessão da FICHA do ligado, e o combatente continua só referência. */
const comecado = R(mundo, { tipo: "COMECAR", derivados: D });
t("começar liga o combate na sessão da ficha", [comecado.sessoes.lia.combate?.ativo, comecado.sessoes.lia.rodada], [true, 1]);
t("e o combatente ligado continua sem sessão", comecado.encontro.combatentes.find((c) => c.id === "c_lia") === mundo.encontro.combatentes.find((c) => c.id === "c_lia"), true);
const encerrado = R(R(comecado, { tipo: "PROXIMO_TURNO", derivados: der(comecado) }), { tipo: "ENCERRAR" });
t("encerrar desliga o combate na ficha", [encerrado.encontro.status, encerrado.sessoes.lia.combate?.ativo], ["finalizado", false]);

/* A 2.5.2 no fluxo de turno roda a conta dela (etapa 4, ver t-encontro-252-porte.mjs), e sem o derivado diz o porquê. */
const com252 = R(mundo, { tipo: "ADICIONAR", combatente: M.normalizarCombatente({ id: "c_velha", motor: "252", tipo: "criatura", nome: "Velha", snapshot: { id: "v", name: "Velha", stats: { hpMax: 10 } }, combatState: { hpCurrent: 10 } }) });
t("começar com criatura da 2.5.2 roda o começo da rodada dela", R(com252, { tipo: "COMECAR", derivados: der(com252) }).encontro.status, "ativo");
t("começar sem o derivado dela lança Ficha sem Cálculo, e não pula calado", (() => { try { R(com252, { tipo: "COMECAR", derivados: {} }); return "começou"; } catch (e) { return e.message; } })(), "Ficha sem Cálculo");
t("operar na 2.5.2 sem o derivado vira erro de tela, não exceção", O.operar(com252, { tipo: "dano", alvo: "c_velha", autor: MESTRE, entrada: { valor: 3 } }, { derivados: {} }).erro, "Ficha sem Cálculo");
t("e o derive dela entra no mapa, sem erro", (() => { const r = M.derivarEncontro(com252); return [typeof r.mapa.c_velha, r.erros, r.mapa.c_ogro.hp]; })(), ["object", {}, dOgro.hp]);

/* ============================================================ */
/* 3. O redutor novo contra o antigo (a mesma luta, as mesmas sessões) */
/* ============================================================ */
{
  const v0 = (() => {
    const e = Velho.criarEncontro({ nome: "Velho" });
    const a = Velho.definirIniciativa(Velho.criarCombatente(ogroF, { derived: dOgro }), 20);
    const b = Velho.definirIniciativa(Velho.criarCombatente(gobF, { derived: dGob }), 15);
    const c = Velho.definirIniciativa(Velho.criarCombatente(gobF, { derived: dGob }), 12);
    const j = Velho.definirIniciativa(Velho.criarJogador({ nome: "Bea" }), 10);
    return { ...e, combatentes: Velho.renumerarCopias([a, b, c, j]) };
  })();
  let V = v0;
  let N = mundoDe(encontroDeAftyAntigo(v0, { grupo: "afty" }));
  t("o Encontro antigo lido no formato novo mantém os ids", N.encontro.combatentes.map((c) => [c.id, c.tipo]), v0.combatentes.map((c) => [c.id, c.ficha ? "criatura" : "marcador"]));
  const derivadosV = (e) => Object.fromEntries(e.combatentes.map((c) => [c.id, derivarCombatente(c)]));
  const ogroId = v0.combatentes[0].id;
  const confere = (rotulo) => {
    t(`${rotulo}: vez, rodada e estado`, [N.encontro.ativoId, N.encontro.rodada, N.encontro.status], [V.ativoId, V.rodada, V.status]);
    for (const c of V.combatentes) {
      const x = N.encontro.combatentes.find((y) => y.id === c.id);
      t(`${rotulo}: sessão de ${c.nome}`, x?.sessao ?? null, c.sessao);
    }
    t(`${rotulo}: as mensagens de turno`, N.encontro.log.filter((l) => !l.operacaoId).map((l) => l.mensagem), V.log.map((l) => l.mensagem));
  };
  const passo = (acao) => {
    const d = derivadosV(V);
    V = redutorDeEncontro(V, { ...acao, derivados: d });
    N = R(N, { ...acao, derivados: d });
  };
  passo({ tipo: "COMECAR" });
  confere("começar");
  {
    const d = derivadosV(V);
    const s = V.combatentes[0].sessao;
    V = redutorDeEncontro(V, { tipo: "PATCH_SESSAO", id: ogroId, sessao: S.aparaSessao(S.aplicaDano(S.aparaSessao(s, d[ogroId]), 75, d[ogroId]), d[ogroId]) });
    N = O.operar(N, { tipo: "dano", alvo: ogroId, autor: MESTRE, entrada: { valor: 75 } }, { derivados: d, gerarId, agora }).mundo;
  }
  confere("75 de dano no Ogro (a Guarda come primeiro)");
  for (let i = 1; i <= 5; i++) { passo({ tipo: "PROXIMO_TURNO" }); confere(`turno ${i}`); }
  passo({ tipo: "NOVA_RODADA" });
  confere("rodada forçada");
  passo({ tipo: "REMOVER", id: v0.combatentes[2].id });
  confere("remover o segundo Goblin");
  t("o Goblin que ficou perde o número", N.encontro.combatentes.map((c) => c.nome), V.combatentes.map((c) => c.nome));
  {
    const d = derivadosV(V);
    V = redutorDeEncontro(V, { tipo: "DESCANSAR_TODOS", derivados: d });
    const g = O.acaoEmGrupo(N, { acao: "descansar", alvos: N.encontro.combatentes.map((c) => c.id), autor: MESTRE }, { derivados: d, gerarId, agora });
    N = g.mundo;
    t("Descansar em grupo: o marcador não tem ficha", g.resultados.map((r) => r.erro), [null, null, "Combatente sem Ficha"]);
  }
  confere("Descansar Todos como uma operação por alvo");
  passo({ tipo: "ENCERRAR" });
  confere("encerrar");
}

/* ============================================================ */
/* 4. Operações                                                  */
/* ============================================================ */
const ctx = (m) => ({ derivados: der(m), gerarId, agora });
const hist = (m, id) => O.historicoDe(M.estadoDoCombatente(M.combatenteDe(m.encontro, id), m.sessoes));
const hp = (m, id) => M.estadoDoCombatente(M.combatenteDe(m.encontro, id), m.sessoes).hpAtual;

let r = O.operar(mundo, { tipo: "dano", alvo: "c_lia", autor: MESTRE, entrada: { valor: 20, rolagem: { total: 20, dados: [12, 8] } } }, ctx(mundo));
t("o Mestre tira 20 da Lia", [r.ok, hp(r.mundo, "c_lia")], [true, 100]);
const opDano = r.operacao;
t("a operação tem o formato do banco", Object.keys(opDano), ["id", "versao", "tipo", "autor", "alvo", "entrada", "delta", "quando"]);
t("o delta só toca o que mudou, com antes e depois", opDano.delta, [{ caminho: ["hpAtual"], antes: 120, depois: 100, soma: -20 }]);
t("a rolagem viaja como resultado", opDano.entrada.rolagem, { total: 20, dados: [12, 8] });
t("o que o Mestre fez entra no histórico da Lia", hist(r.mundo, "c_lia").map((e) => [e.id, e.tipo, e.autor.papel]), [[opDano.id, "dano", "mestre"]]);
t("o histórico não é o registro da ficha", r.mundo.sessoes.lia.log, []);
t("o Registro do Encontro ganha a linha, com o id da operação", r.mundo.encontro.log[0], { id: `log_${opDano.id}`, rodada: 1, em: opDano.quando, tipo: "dano", mensagem: "Dano: 20 em Lia.", combatenteId: "c_lia", operacaoId: opDano.id });
t("a mesma operação depois do JSON dá o mesmo mundo", O.aplicarOperacao(mundo, JSON.parse(JSON.stringify(opDano))).mundo, O.aplicarOperacao(mundo, opDano).mundo);
t("aplicar duas vezes: a pré-condição recusa a segunda", (() => { const x = O.aplicarOperacao(r.mundo, opDano); return [x.ok, x.conflitos, x.mundo === r.mundo]; })(), [false, [{ caminho: ["hpAtual"], motivo: "mudou" }], true]);
t("o redutor também recusa calado", R(r.mundo, { tipo: "OPERACAO", operacao: opDano }) === r.mundo, true);
t("o Mestre na criatura dele não enche histórico", hist(O.operar(mundo, { tipo: "dano", alvo: "c_ogro", autor: MESTRE, entrada: { valor: 5 } }, ctx(mundo)).mundo, "c_ogro"), []);
t("fora de combate a criatura não tem casca, e o dano desce a Vida", O.operar(mundo, { tipo: "dano", alvo: "c_ogro", autor: MESTRE, entrada: { valor: 5 } }, ctx(mundo)).operacao.delta, [{ caminho: ["hpAtual"], antes: dOgro.hp, depois: dOgro.hp - 5, soma: -5 }]);
t("nada mudou não vira operação", O.operar(mundo, { tipo: "cura", alvo: "c_lia", autor: MESTRE, entrada: { valor: 5 } }, ctx(mundo)).erro, "Nada Mudou");
t("espectador não opera", O.operar(mundo, { tipo: "dano", alvo: "c_ogro", autor: ESPECTADOR, entrada: { valor: 5 } }, ctx(mundo)).erro, "Sem Permissão");
t("o marcador não tem ficha", O.operar(mundo, { tipo: "dano", alvo: "c_bea", autor: MESTRE, entrada: { valor: 5 } }, ctx(mundo)).erro, "Combatente sem Ficha");
t("Cura sem derivado não chuta o teto", O.operar(r.mundo, { tipo: "cura", alvo: "c_lia", autor: MESTRE, entrada: { valor: 5 } }, { derivados: {} }).erro, "Ficha sem Cálculo");
t("a ligada sem a sessão carregada não opera", O.operar({ ...mundo, sessoes: {} }, { tipo: "dano", alvo: "c_lia", autor: MESTRE, entrada: { valor: 5 } }, ctx(mundo)).erro, "Ficha Ausente");
t("o jogador na própria ficha é direto e não enche histórico", (() => { const x = O.operar(mundo, { tipo: "gastarPe", alvo: "c_lia", autor: JOGADOR, entrada: { valor: 2 } }, ctx(mundo)); return [x.ok, !!x.pendente, hist(x.mundo, "c_lia").length]; })(), [true, false, 0]);

/* A operação genérica: o que a G2 embutida manda pelo `onSessao`. */
const passoG2 = (s) => S.registraRolagem({ ...s, buffs: [...s.buffs, { id: "b1", nome: "Foco", rodadas: 3 }] }, { id: "rol1", rotulo: "Acerto", total: 17 });
r = O.operar(mundo, { tipo: "sessao", alvo: "c_lia", autor: MESTRE, passo: passoG2 }, ctx(mundo));
t("a genérica guarda a diferença estrutural, sem o registro da ficha", r.operacao.delta.map((x) => x.caminho), [["buffs"]]);
t("e a rolagem anotada vai junto como registro", [r.operacao.registros, r.mundo.sessoes.lia.log], [[{ id: "rol1", rotulo: "Acerto", total: 17 }], [{ id: "rol1", rotulo: "Acerto", total: 17 }]]);
t("o histórico guarda a genérica sem o registro", Object.keys(hist(r.mundo, "c_lia")[0]).includes("registros"), false);
t("a genérica sem função não é operação", O.operar(mundo, { tipo: "sessao", alvo: "c_lia", autor: MESTRE }, ctx(mundo)).erro, "Operação Desconhecida");

/* ---------- pedidos ---------- */
r = O.operar(mundo, { tipo: "dano", alvo: "c_ogro", autor: JOGADOR, entrada: { valor: 10, rolagem: { total: 10 } } }, ctx(mundo));
const pedido = r.pedido;
t("jogador na criatura vira pedido pendente, sem delta", [r.ok, r.pendente, pedido.pedido.estado, pedido.delta, r.mundo.encontro.pedidos.length], [true, true, "pendente", [], 1]);
t("o alvo não muda com o pedido", M.estadoDoCombatente(M.combatenteDe(r.mundo.encontro, "c_ogro"), {}) === M.estadoDoCombatente(M.combatenteDe(mundo.encontro, "c_ogro"), {}), true);
t("o pedido vai ao Registro", r.mundo.encontro.log[0].mensagem, "Pedido de Dano (10) em Ogro.");
let comPedido = r.mundo;
t("o jogador não aceita o pedido na criatura do Mestre", O.aceitarPedido(comPedido, pedido.id, JOGADOR, ctx(comPedido)).erro, "Sem Permissão");
/* O Mestre tira 5 antes de aceitar: o delta do pedido é medido no ACEITE. */
const antesDoAceite = O.operar(comPedido, { tipo: "dano", alvo: "c_ogro", autor: MESTRE, entrada: { valor: 5 } }, ctx(comPedido)).mundo;
r = O.aceitarPedido(antesDoAceite, pedido.id, MESTRE, ctx(antesDoAceite));
const guardaAntes = cOgro.sessao.pvTempFontes["Guarda Inabalável"] ?? 0;
t("o Mestre aceita: mede contra o estado da hora", [r.ok, r.operacao.id, r.operacao.delta[0].antes], [true, pedido.id, guardaAntes ? guardaAntes - 5 : dOgro.hp - 5]);
t("o aceite guarda quem aceitou e quando foi pedido", [r.operacao.pedido.estado, r.operacao.pedido.por.papel, r.operacao.pedido.pedidoEm], ["aceito", "mestre", pedido.quando]);
t("o pedido sai da lista e entra no histórico da criatura (o jogador é outra pessoa)", [r.mundo.encontro.pedidos, hist(r.mundo, "c_ogro").map((e) => [e.id, e.autor.papel, e.pedido.estado])], [[], [[pedido.id, "jogador", "aceito"]]]);
t("aceitar de novo não acha o pedido", O.aceitarPedido(r.mundo, pedido.id, MESTRE, ctx(r.mundo)).erro, "Pedido Ausente");
t("pelo redutor, o aceite medido dá o mesmo mundo", R(antesDoAceite, { tipo: "RESOLVER_PEDIDO", pedidoId: pedido.id, operacao: r.operacao }), r.mundo);
const recusa = O.recusarPedido(comPedido, pedido.id, MESTRE, { agora: () => 9 });
t("recusar tira da lista e fica no Registro", [recusa.mundo.encontro.pedidos, recusa.mundo.encontro.log[0].mensagem, recusa.operacao.pedido.estado], [[], "Pedido Recusado: Dano (10) em Ogro.", "recusado"]);
t("o pedido passa por JSON", JSON.parse(JSON.stringify(pedido)), pedido);
const sozinho = R(mundo, { tipo: "CONFIGURAR", chave: "aceitarSozinho", valor: true });
r = O.operar(sozinho, { tipo: "dano", alvo: "c_ogro", autor: JOGADOR, entrada: { valor: 10 } }, ctx(sozinho));
t("Aceitar Sozinho aplica na hora, marcado como aceite automático", [r.ok, !!r.pendente, r.operacao.pedido.estado, r.operacao.pedido.automatico, r.operacao.pedido.por.papel], [true, false, "aceito", true, "sistema"]);
const pSessao = O.operar(mundo, { tipo: "sessao", alvo: "c_ogro", autor: JOGADOR, passo: (s) => ({ ...s, buffs: [{ id: "x", nome: "Marca" }] }) }, ctx(mundo)).pedido;
t("o pedido genérico leva o delta medido", pSessao.delta.map((x) => x.caminho), [["buffs"]]);

/* ============================================================ */
/* 5. Desfazer, relativo nos números                             */
/* ============================================================ */
const MESTRE_DANO = (m, valor, alvo = "c_lia") => O.operar(m, { tipo: "dano", alvo, autor: MESTRE, entrada: { valor } }, ctx(m));
let a1 = MESTRE_DANO(mundo, 30);           // 120 -> 90
let a2 = MESTRE_DANO(a1.mundo, 12);        // 90 -> 78
let a3 = O.operar(a2.mundo, { tipo: "cura", alvo: "c_lia", autor: MESTRE, entrada: { valor: 5 } }, ctx(a2.mundo)); // 78 -> 83
t("controle: 83 de Vida e três entradas", [hp(a3.mundo, "c_lia"), hist(a3.mundo, "c_lia").length], [83, 3]);
r = O.desfazer(a3.mundo, { alvo: "c_lia", operacaoId: a2.operacao.id }, JOGADOR, ctx(a3.mundo));
t("desfazer o dano de 12 com a cura no meio: a Vida volta 12", [r.ok, hp(r.mundo, "c_lia")], [true, 95]);
t("o Desfazer é uma operação nova que aponta a original", [r.operacao.tipo, r.operacao.desfaz, r.operacao.delta], ["desfazer", a2.operacao.id, [{ caminho: ["hpAtual"], antes: 83, depois: 95, soma: 12 }]]);
t("o dono desfez: a original fica marcada e nada novo entra", [hist(r.mundo, "c_lia").length, hist(r.mundo, "c_lia").find((e) => e.id === a2.operacao.id).desfeita], [3, { operacaoId: r.operacao.id, por: { conta: null, papel: "jogador", combatente: "c_lia" }, em: r.operacao.quando }]);
t("desfazer de novo não", O.desfazer(r.mundo, { alvo: "c_lia", operacaoId: a2.operacao.id }, JOGADOR, ctx(r.mundo)).erro, "Já Desfeita");
const passaDoTeto = O.desfazer(r.mundo, { alvo: "c_lia", operacaoId: a1.operacao.id }, JOGADOR, ctx(r.mundo));
t("desfazer os 30 passaria do máximo: não fecha e diz o caminho", [passaDoTeto.ok, passaDoTeto.erro, passaDoTeto.conflitos, passaDoTeto.mundo === r.mundo], [false, "Não Fecha", [{ caminho: ["hpAtual"], motivo: "foraDoLimite" }], true]);
const peloMestre = O.desfazer(a3.mundo, { alvo: "c_lia", operacaoId: a3.operacao.id }, MESTRE, ctx(a3.mundo));
t("o Mestre também desfaz, e o Desfazer dele entra no histórico", [peloMestre.ok, hp(peloMestre.mundo, "c_lia"), hist(peloMestre.mundo, "c_lia")[0].tipo], [true, 78, "desfazer"]);
t("o espectador não desfaz", O.desfazer(a3.mundo, { alvo: "c_lia", operacaoId: a3.operacao.id }, ESPECTADOR, ctx(a3.mundo)).erro, "Sem Permissão");
t("o Desfazer não se desfaz", O.desfazer(peloMestre.mundo, { alvo: "c_lia", operacaoId: peloMestre.operacao.id }, MESTRE, ctx(peloMestre.mundo)).erro, "Não Desfazível");
t("o que não está no histórico não se desfaz", O.desfazer(a3.mundo, { alvo: "c_lia", operacaoId: "nada" }, JOGADOR, ctx(a3.mundo)).erro, "Operação Ausente");

/* O resto só volta se ainda bater. */
const condicao = (m, nome) => O.operar(m, { tipo: "condicao", alvo: "c_lia", autor: MESTRE, entrada: { modo: "adicionar", condicao: { nome, rodadas: 2 } } }, ctx(m));
const c1 = condicao(mundo, "Atordoado");
const c2 = condicao(c1.mundo, "Caído");
r = O.desfazer(c2.mundo, { alvo: "c_lia", operacaoId: c1.operacao.id }, JOGADOR, ctx(c2.mundo));
t("condição com outra mudança depois não volta, e diz qual caminho", [r.ok, r.conflitos], [false, [{ caminho: ["condicoes"], motivo: "mudou" }]]);
r = O.desfazer(c2.mundo, { alvo: "c_lia", operacaoId: c2.operacao.id }, JOGADOR, ctx(c2.mundo));
const r2 = O.desfazer(r.mundo, { alvo: "c_lia", operacaoId: c1.operacao.id }, JOGADOR, ctx(r.mundo));
t("desfazendo na ordem inversa, as duas voltam", [r.ok, r2.ok, r2.mundo.sessoes.lia.condicoes], [true, true, []]);

/* As cascas: voltam pelo delta, até o valor de antes da operação. */
{
  const comEscudo = { ...mundo, sessoes: { lia: { ...mundo.sessoes.lia, pvTempFontes: { Escudo: 10 } } } };
  const h1 = MESTRE_DANO(comEscudo, 6);      // Escudo 10 -> 4
  const h2 = MESTRE_DANO(h1.mundo, 8);       // Escudo 4 -> some, Vida 120 -> 116
  t("controle: a casca some e a Vida desce o resto", [h2.mundo.sessoes.lia.pvTempFontes, h2.mundo.sessoes.lia.hpAtual], [{}, 116]);
  t("a casca que some é AUSENTE no delta", h2.operacao.delta.find((x) => x.caminho[0] === "pvTempFontes").depois, { $ausente: true });
  const u1 = O.desfazer(h2.mundo, { alvo: "c_lia", operacaoId: h1.operacao.id }, JOGADOR, ctx(h2.mundo));
  t("desfazer o primeiro golpe devolve os 6 à casca vazia", [u1.ok, u1.mundo.sessoes.lia.pvTempFontes, u1.mundo.sessoes.lia.hpAtual], [true, { Escudo: 6 }, 116]);
  const reerguida = O.operar(h2.mundo, { tipo: "sessao", alvo: "c_lia", autor: MESTRE, passo: (s) => ({ ...s, pvTempFontes: { Escudo: 10 } }) }, ctx(h2.mundo));
  const u2 = O.desfazer(reerguida.mundo, { alvo: "c_lia", operacaoId: h2.operacao.id }, JOGADOR, ctx(reerguida.mundo));
  t("casca reerguida por cima: o Desfazer avisa em vez de dobrar", [u2.ok, u2.conflitos], [false, [{ caminho: ["pvTempFontes", "Escudo"], motivo: "foraDoLimite" }]]);
}

/* A Alma do jogador: desfazer devolve a Alma, e o teto da Vida volta junto (o derive do estado já desfeito). */
{
  const al = O.operar(mundo, { tipo: "alma", alvo: "c_lia", autor: MESTRE, entrada: { modo: "dano", valor: 40 } }, ctx(mundo));
  t("controle: 40 na Alma tira da Alma e da Vida", [al.mundo.sessoes.lia.almaAtual, al.mundo.sessoes.lia.hpAtual, der(al.mundo).c_lia.hp], [80, 80, 80]);
  const epoca = 0;
  const derivar = (c, s) => Mo.motorAfty.derivar(liaF, s, epoca);
  const sem = O.desfazer(al.mundo, { alvo: "c_lia", operacaoId: al.operacao.id }, JOGADOR, ctx(al.mundo));
  t("sem o derive do estado desfeito, a Vida acima do teto de agora não fecha", [sem.ok, sem.conflitos], [false, [{ caminho: ["hpAtual"], motivo: "foraDoLimite" }]]);
  const com = O.desfazer(al.mundo, { alvo: "c_lia", operacaoId: al.operacao.id }, JOGADOR, { ...ctx(al.mundo), derivar });
  t("com ele, a Alma e a Vida voltam", [com.ok, com.mundo.sessoes.lia.almaAtual, com.mundo.sessoes.lia.hpAtual], [true, 120, 120]);
}

/* Descansar: a Vida e o PE voltam pelo delta, o resto só se bater. */
{
  const ferida = MESTRE_DANO(mundo, 50).mundo;
  const desc = O.operar(ferida, { tipo: "descansar", alvo: "c_lia", autor: MESTRE }, ctx(ferida));
  t("controle: Descansar enche", hp(desc.mundo, "c_lia"), 120);
  const u = O.desfazer(desc.mundo, { alvo: "c_lia", operacaoId: desc.operacao.id }, JOGADOR, ctx(desc.mundo));
  t("desfazer o Descansar devolve a ferida", [u.ok, hp(u.mundo, "c_lia")], [true, 70]);
  t("e o estado desfeito é o de antes do Descansar", O.mesmoValor({ ...u.mundo.sessoes.lia, historico: null }, { ...ferida.sessoes.lia, historico: null }), true);
}

/* O inverso puro, com mapa e caminho por chave. */
t("inverso de caminho que não é número relativo exige igualdade", O.inversoDoDelta([{ caminho: ["exaustao"], antes: 0, depois: 1 }], { exaustao: 2 }, Mo.motorAfty).conflitos, [{ caminho: ["exaustao"], motivo: "mudou" }]);
t("delta e AUSENTE passam por JSON", O.aplicarDelta({ a: 1, m: { x: 2 } }, JSON.parse(JSON.stringify([{ caminho: ["m", "x"], antes: 2, depois: O.AUSENTE }, { caminho: ["b"], antes: O.AUSENTE, depois: 3 }]))).estado, { a: 1, m: {}, b: 3 });
t("a diferença desce um nível nos mapas por chave e ignora o registro", O.diferencaEstrutural({ usos: { a: 1, b: 2 }, log: [1], buffs: [1] }, { usos: { a: 1, b: 3 }, log: [2, 1], buffs: [1, 2] }, Mo.motorAfty),
  [{ caminho: ["usos", "b"], antes: 2, depois: 3, soma: 1 }, { caminho: ["buffs"], antes: [1], depois: [1, 2] }]);
t("chaves em outra ordem são o mesmo valor", O.mesmoValor({ a: 1, b: { c: 2, d: 3 } }, { b: { d: 3, c: 2 }, a: 1 }), true);

/* ============================================================ */
/* 6. Ações em grupo e os verbos que vieram da Mesa do Mestre    */
/* ============================================================ */
{
  const g = O.acaoEmGrupo(mundo, { acao: "danoMetade", valor: 21, alvos: ["c_ogro", "c_lia", "c_bea"], autor: MESTRE }, ctx(mundo));
  t("uma operação por alvo, e quem não tem ficha não impede os outros", g.resultados.map((x) => [x.alvo, x.ok, x.erro]), [["c_ogro", true, null], ["c_lia", true, null], ["c_bea", false, "Combatente sem Ficha"]]);
  t("Dano pela Metade arredonda para baixo", hp(g.mundo, "c_lia"), 110);
  t("todas com o mesmo grupo", hist(g.mundo, "c_lia")[0].grupo, g.grupo);
  t("ação de grupo desconhecida", O.acaoEmGrupo(mundo, { acao: "voar", alvos: ["c_ogro"], autor: MESTRE }).erro, "Operação Desconhecida");
}
{
  const s0 = S.aparaSessao(S.iniciaCombate(S.sessaoEmBranco(dOgro), dOgro), dOgro);
  const ferido = S.gastaPe(S.aplicaDano(s0, 90, dOgro), 20);
  /* Valores congelados em 2026-11-17, quando a Mesa do Mestre saiu (etapa 6b): são o que o `aplicarNaMesa` dava para este mesmo
     Ogro (234 de Vida e 48 de PE) ferido para 204 de Vida e 28 de PE. A comparação viva com a Mesa não existe mais. */
  const casos = [["aplicarDano", 50, 154, 28], ["aplicarDano", 25, 179, 28], ["aplicarCura", 30, 234, 28], ["gastarPe", 7, 204, 21], ["recuperarPe", 9, 204, 37], ["descansar", 0, 234, 48]];
  for (const [verbo, v, hpFinal, peFinal] of casos) {
    const novo = Mo.motorAfty[verbo](ferido, dOgro, v);
    t("o verbo " + verbo + " " + v + " deixa Vida e PE como a Mesa deixava", [novo.hpAtual, novo.peAtual], [hpFinal, peFinal]);
  }
  t("a metade arredonda para baixo e não passa de zero", [metade(7), metade(1), metade(-3), metade("x")], [3, 0, 0, 0]);
}

/* ============================================================ */
/* 7. Duas sessões de uma vez (a conferência do PATCH_SESSOES)   */
/* ============================================================ */
{
  const fn = (sO, dO, sA, dA) => ({ aplicado: true, sessao: S.gastaPe(sO, 2), sessaoAlvo: S.aplicaDano(sA, 3, dA) });
  r = O.operarComAlvo(mundo, { origem: "c_ogro", alvo: "c_lia", autor: MESTRE, fn }, ctx(mundo));
  t("origem e alvo mudam juntos", [r.ok, r.operacoes.length, hp(r.mundo, "c_lia")], [true, 2, 117]);
  const outra = MESTRE_DANO(mundo, 1).mundo;
  const atrasado = O.aplicarOperacoes(outra, r.operacoes);
  t("se um dos dois mudou no meio, nenhum muda", [atrasado.ok, atrasado.mundo === outra], [false, true]);
  t("pelo redutor, o mesmo", R(outra, { tipo: "OPERACOES", operacoes: r.operacoes }) === outra, true);
  t("o jogador não mexe em dois de uma vez sem pedido", O.operarComAlvo(mundo, { origem: "c_lia", alvo: "c_ogro", autor: JOGADOR, fn }, ctx(mundo)).erro, "Sem Permissão");
  const g = O.operarComGrupo(mundo, { origem: "c_ogro", alvos: ["c_lia"], autor: MESTRE, fn: (sO, dO, alvos) => ({ aplicado: true, sessao: S.gastaPe(sO, 1), sessoesAlvo: { [alvos[0].id]: S.aplicaDano(alvos[0].sessao, 4, alvos[0].derived) } }) }, ctx(mundo));
  t("uma origem e vários alvos", [g.ok, hp(g.mundo, "c_lia")], [true, 116]);
}

/* ============================================================ */
/* 8. O histórico na sessão                                      */
/* ============================================================ */
{
  const s = { ...S.sessaoEmBranco(dLia), historico: [{ id: "h1", delta: [] }, { id: "h2", delta: [] }], log: Array.from({ length: 60 }, (_, i) => ({ id: `l${i}` })) };
  const lida = S.normalizaSessao(JSON.parse(JSON.stringify(s)), dLia);
  t("o histórico sobrevive à leitura da sessão, e o registro corta em 50", [lida.historico.length, lida.log.length], [2, 50]);
  t("e ao aparo, ao descanso e à virada", [S.aparaSessao(lida, dLia).historico.length, S.descansar(lida, dLia).historico.length, S.proximaRodada(lida, dLia).sessao.historico.length], [2, 2, 2]);
  const cheio = { ...S.sessaoEmBranco(dLia), historico: Array.from({ length: O.HISTORICO_MAX }, (_, i) => ({ id: `h${i}`, delta: [] })) };
  const x = O.aplicarNoEstado(cheio, opDano, cLia);
  t("o teto é 500 e a mais antiga sai", [O.HISTORICO_MAX, x.estado.historico.length, x.estado.historico[0].id, x.estado.historico.at(-1).id], [500, 500, opDano.id, "h498"]);
  t("o saneamento do histórico descarta o que não é entrada", O.normalizarHistorico([{ id: "a", delta: [] }, { id: "b" }, null, "x"]).map((e) => e.id), ["a"]);
  const passo = O.passoDaOperacao(opDano, cLia);
  t("a operação como passo da loja aplica com a pré-condição", [passo(mundo.sessoes.lia).hpAtual, passo(r.mundo.sessoes.lia) === r.mundo.sessoes.lia], [100, true]);
}
t("virada de turno não entra no histórico", (() => {
  let x = R(MESTRE_DANO(mundo, 10).mundo, { tipo: "COMECAR", derivados: D });
  for (let i = 0; i < 4; i++) x = R(x, { tipo: "PROXIMO_TURNO", derivados: der(x) });
  return O.historicoDe(x.sessoes.lia).length;
})(), 1);

/* ============================================================ */
/* 9. Listas e inventários                            */
/* ============================================================ */
t("as chaves das listas", L.CHAVE_LISTA, {
  site: "afty_encontros_site_v1", afty: "afty_encontros_v1", eradeouro: "afty_encontros_eradeouro_v1",
  eclesiastes: "afty_encontros_eclesiastes_v1",
});
t("a rota escolhe a lista", [null, "player", "afty", "eradeouro", "eclesiastes"].map(L.grupoDaRota), ["site", "site", "afty", "eradeouro", "eclesiastes"]);
t("os inventários de cada lista", L.CHAVES_INVENTARIO, {
  site: ["fm_creatures_v1", "fm_creatures_player_v1"], afty: ["fm_creatures_afty_v1", "fm_creatures_player_v1"], eradeouro: ["fm_creatures_eradeouro_v1"],
  eclesiastes: ["fm_creatures_eclesiastes_v1"],
});
t("todas as listas vão para a nuvem pessoal", Object.values(L.CHAVE_LISTA).every(Nuvem.chaveDaPessoa), true);
t("e não são chaves de fichas", Object.values(L.CHAVE_LISTA).some(Nuvem.ehChaveDeFichas), false);
{
  const lista = (ids) => JSON.stringify(ids.map((id) => ({ id })));
  const m1 = mesclar({ afty_encontros_site_v1: lista(["a"]) }, [], [{ chave: "afty_encontros_site_v1", valor: lista(["b"]) }], null);
  t("a lista do site une por id no primeiro login", JSON.parse(m1.gravar.afty_encontros_site_v1).map((x) => x.id), ["a", "b"]);
}
{
  const arm = new Map();
  const armazem = { getItem: (k) => (arm.has(k) ? arm.get(k) : null), setItem: (k, v) => arm.set(k, String(v)) };
  arm.set("fm_creatures_v1", JSON.stringify([{ id: "v1", name: "Velha" }, { id: "v2", name: "Velha Marcada", rulesVersion: "2.5.2" }, { id: "a1", name: "Intrusa", rulesVersion: "afty" }]));
  arm.set("fm_creatures_player_v1", JSON.stringify([{ id: "p1", name: "Lia", rulesVersion: "player" }, { id: "p2", name: "Sem Marca" }, { id: "a2", name: "Criatura Antiga", rulesVersion: "afty" }, { id: "x", name: "Da 2.5.2", rulesVersion: "2.5.2" }]));
  arm.set("fm_creatures_afty_v1", JSON.stringify([{ id: "a3", name: "Ogro" }, { id: "p3", name: "Personagem Perdido", rulesVersion: "player" }]));
  arm.set("fm_creatures_eradeouro_v1", JSON.stringify([{ id: "g1", name: "Guilda Sem Marca" }, { id: "g2", name: "Herói", rulesVersion: "player", mesa: "eradeouro" }, { id: "g3", name: "Importado", rulesVersion: "player" }]));
  const resumo = (g) => L.inventarioDoGrupo(g, armazem).fichas.map((e) => [e.ficha.id, e.motor, e.tipo, e.ficha.rulesVersion ?? null]);
  t("site: a 2.5.2 do `/` mais os personagens do `/Player`", resumo("site"), [
    ["v1", "252", "criatura", null], ["v2", "252", "criatura", "2.5.2"],
    ["p1", "afty", "personagem", "player"], ["p2", "afty", "personagem", "player"], ["a2", "afty", "criatura", "afty"],
  ]);
  t("site: o que tem marca do Afty no `/` e o da 2.5.2 no `/Player` ficam de fora", L.inventarioDoGrupo("site", armazem).recusadas.map((x) => [x.chave, x.id]), [["fm_creatures_v1", "a1"], ["fm_creatures_player_v1", "x"]]);
  t("afty: as criaturas do `/Afty` mais os personagens do `/Player`", resumo("afty").map((x) => x[0]), ["a3", "p3", "p1", "p2", "a2"]);
  t("Guilda: só a chave da Guilda, sem conferir `mesa`", resumo("eradeouro"), [["g1", "afty", "criatura", "afty"], ["g2", "afty", "personagem", "player"], ["g3", "afty", "personagem", "player"]]);
  t("a leitura é pela chave e não regrava nada", [arm.get("fm_creatures_player_v1").includes('"Sem Marca"}'), arm.size], [true, 4]);
  const um = L.lerInventario("fm_creatures_player_v1", armazem);
  t("o mesmo texto devolve os mesmos objetos (o cache do derive depende disso)", L.lerInventario("fm_creatures_player_v1", armazem) === um, true);
  arm.set("fm_creatures_player_v1", "[]");
  t("texto novo, leitura nova", L.lerInventario("fm_creatures_player_v1", armazem).fichas, []);
  arm.set("fm_creatures_afty_v1", "{quebrado");
  t("JSON quebrado é inventário vazio", L.lerInventario("fm_creatures_afty_v1", armazem).fichas, []);
  t("as chaves da tela antiga não recebem o formato novo nesta etapa", [L.gravarLista("afty", [], armazem).erro, L.gravarLista("eradeouro", [], armazem).erro, arm.has("afty_encontros_v1")], ["Chave com Tela Antiga", "Chave com Tela Antiga", false]);
  t("a do site grava", [L.gravarLista("site", [], armazem).ok, arm.get("afty_encontros_site_v1")], [true, "[]"]);
  t("as fichas ligadas de um Encontro, pelo inventário", L.fichasDoInventario(mundo.encontro, { porId: new Map([["lia", { ficha: liaF }]]) }), { lia: liaF });
}

/* ============================================================ */
/* 10. Carregam sozinhos, como o navegador entra                 */
/* ============================================================ */
{
  const { execFileSync } = await import("node:child_process");
  const shim = "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\\\".\\\")&&!s.endsWith(\\\".js\\\"))return n(s+\\\".js\\\",c);throw e}}";
  for (const arquivo of ["redutor.js", "operacoes.js", "migracao.js", "listas.js", "modelo.js", "motores/index.js", "motores/m252.js", "motores/m252-vital.js", "motores/interface.js"]) {
    const codigo = `import { register } from "node:module";register("${shim}", import.meta.url);await import(${JSON.stringify(E + arquivo)});console.log("ok");`;
    let saida;
    try { saida = execFileSync(process.execPath, ["--input-type=module", "-e", codigo], { encoding: "utf8" }).trim(); } catch (e) { saida = `QUEBROU: ${String(e.stderr ?? e.message).split("\n").find((l) => /Error/.test(l)) ?? "?"}`; }
    t(`encontros/${arquivo} carrega sozinho`, saida, "ok");
  }
  const interfaceTexto = readFileSync(fileURLToPath(E + "motores/interface.js"), "utf8");
  t("a interface é folha", interfaceTexto.split("\n").filter((l) => /^import\s/.test(l.trim())), []);
}

/* ============================================================ */
/* 11. Texto e fronteira                                         */
/* ============================================================ */
{
  const pasta = fileURLToPath(E);
  const novos = ["modelo.js", "operacoes.js", "redutor.js", "listas.js", "migracao.js", ...readdirSync(pasta + "motores").map((f) => `motores/${f}`)];
  t("nenhum travessão nos módulos novos", novos.filter((f) => /\u2014/.test(readFileSync(pasta + f, "utf8"))), []);
  t("só o motor da 2.5.2 importa de src/components (os puros, conferidos no t-encontro-252-porte), e nenhum importa da Mesa do Mestre", novos.filter((f) => !f.startsWith("motores/m252") && /from "[^"]*(components|eradeouro)\//.test(readFileSync(pasta + f, "utf8"))), []);
  const frases = ["Dano: 1 em X.", ...Object.values(O.ROTULO_OPERACAO), ...Object.values(M.VISAO_ROTULO)];
  t("as frases de tela sem ponto e vírgula", frases.filter((f) => f.includes(";")), []);
}

if (bad.length) {
  console.error(`FALHARAM ${bad.length}:\n` + bad.join("\n"));
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
