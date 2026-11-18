/* O Encontro Unificado, etapa 6b (2026-11-17): o Atualizar da Ficha por combatente, no lugar do `EncounterSyncModal` do `/`,
   e o que o painel da criatura da 2.5.2 ganhou (Habilidades Ativáveis, Reações, Ajustes de Combate, RD no Próximo Dano).
   A conta do Atualizar é a do `handleSyncConfirm` que estava no `App.jsx` (a ficha vira o snapshot, o máximo de Vida vira
   `hpMaxBase` e a Vida atual não passa do novo máximo). Cobre `fichaNovaDe` (listas.js), as ações `ATUALIZAR_FICHA` e
   `AJUSTAR_COMBATE` do redutor e os ajudantes novos de `motores/m252-vital.js`. */
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
const Mo = await import(E + "motores/index.js");
const M = await import(E + "modelo.js");
const L = await import(E + "listas.js");
const { redutorDoEncontro: R, ACOES_DO_REDUTOR } = await import(E + "redutor.js");
const V = await import(E + "motores/m252-vital.js");
const { readFileSync } = await import("node:fs");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

/* ---------- as fichas ---------- */
const ficha252 = (hpMax, updatedAt, extra = {}) => ({
  id: "gob252", name: "Goblin", updatedAt, editLog: [updatedAt],
  core: { nd: 5, bonusTreinamento: 4, patamar: "comum" },
  attributes: { forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 },
  stats: { hpMax, peMax: 20, defesa: 15, iniciativa: 3 }, saves: {}, features: [], ...extra,
});
const aftyF = (nd, updatedAt, extra = {}) => {
  const f = createBlankAfty();
  return { ...f, id: "ogro", name: "Ogro", rulesVersion: "afty", updatedAt, editLog: [updatedAt], core: { ...f.core, nd, tipo: "combatente", patamar: "calamidade", origem: { id: "inato" } }, ...extra };
};
const inventario = (...entradas) => ({ fichas: entradas, recusadas: [], porId: new Map(entradas.map((e) => [e.ficha.id, e])) });
const entrada = (chave, motor, ficha) => ({ chave, motor, tipo: "criatura", marca: motor === "252" ? "2.5.2" : "afty", ficha });

/* ---------- um Encontro com as duas criaturas ---------- */
const velha252 = ficha252(100, "2026-11-01T00:00:00.000Z");
const velhaAfty = aftyF(12, "2026-11-01T00:00:00.000Z");
const dVelha = deriveAfty(velhaAfty);
const c252 = M.criarCriatura(velha252, { chave: "fm_creatures_v1", motor: "252", id: "c_gob" });
const cAfty = M.criarCriatura(velhaAfty, { chave: "fm_creatures_afty_v1", motor: "afty", derived: dVelha, id: "c_ogro" });
const base = { encontro: { id: "e1", nome: "Teste", status: "planejando", rodada: 0, ativoId: null, log: [], combatentes: [c252, cAfty], pedidos: [] }, sessoes: {}, fichas: {} };

/* ============================================================ */
/* fichaNovaDe                                                   */
/* ============================================================ */
const inv0 = inventario(entrada("fm_creatures_v1", "252", velha252), entrada("fm_creatures_afty_v1", "afty", velhaAfty));
t("cópia em dia: nada a atualizar", [L.fichaNovaDe(c252, inv0), L.fichaNovaDe(cAfty, inv0)], [null, null]);

const nova252 = ficha252(60, "2026-11-10T00:00:00.000Z", { editLog: ["2026-11-01T00:00:00.000Z", "2026-11-10T00:00:00.000Z"] });
const novaAfty = aftyF(15, "2026-11-10T00:00:00.000Z", { editLog: ["2026-11-01T00:00:00.000Z", "2026-11-10T00:00:00.000Z"] });
const inv1 = inventario(entrada("fm_creatures_v1", "252", nova252), entrada("fm_creatures_afty_v1", "afty", novaAfty));
t("a edição muda o carimbo: a ficha nova aparece", [L.fichaNovaDe(c252, inv1) === nova252, L.fichaNovaDe(cAfty, inv1) === novaAfty], [true, true]);
t("a ficha de outra chave não vale", L.fichaNovaDe(c252, inventario(entrada("fm_creatures_afty_v1", "afty", { ...nova252, rulesVersion: "afty" }))), null);
t("ficha apagada do inventário: nada a trazer", L.fichaNovaDe(c252, inventario()), null);
t("marcador e personagem ligado nunca têm ficha nova", [L.fichaNovaDe(M.criarMarcador({ nome: "Jogador" }), inv1), L.fichaNovaDe({ tipo: "personagem", fichaRef: { id: "ogro" } }, inv1)], [null, null]);
const semCarimbo = ficha252(100, undefined);
delete semCarimbo.updatedAt; delete semCarimbo.editLog;
const cSem = M.criarCriatura(semCarimbo, { chave: "fm_creatures_v1", motor: "252", id: "c_sem" });
t("sem carimbo nos dois lados conta como em dia", L.fichaNovaDe(cSem, inventario(entrada("fm_creatures_v1", "252", { ...semCarimbo, stats: { ...semCarimbo.stats, hpMax: 5 } }))), null);

/* ============================================================ */
/* ATUALIZAR_FICHA na criatura da 2.5.2                          */
/* ============================================================ */
t("a ação existe no redutor", ACOES_DO_REDUTOR.includes("ATUALIZAR_FICHA"), true);
{
  const ferido = { ...base, encontro: { ...base.encontro, combatentes: [{ ...c252, combatState: { ...c252.combatState, hpCurrent: 90 } }, cAfty] } };
  const m1 = R(ferido, { tipo: "ATUALIZAR_FICHA", id: "c_gob", ficha: nova252 });
  const c = m1.encontro.combatentes[0];
  t("a ficha vira o snapshot e a Vida máxima vira hpMaxBase", [c.snapshot.stats.hpMax, c.combatState.hpMaxBase], [60, 60]);
  t("a Vida atual não passa do novo máximo (a conta do modal)", c.combatState.hpCurrent, 60);
  t("o resto do estado e o nome ficam", [c.nome, c.combatState.peCurrent, c.id], ["Goblin", ferido.encontro.combatentes[0].combatState.peCurrent, "c_gob"]);
  t("o snapshot é uma cópia, não a ficha do inventário", c.snapshot === nova252, false);
  t("o Registro diz que a ficha foi atualizada", m1.encontro.log[0]?.mensagem, "Ficha de Goblin atualizada.");
  t("a outra criatura não mudou", m1.encontro.combatentes[1] === cAfty, true);

  const aumenta = R(ferido, { tipo: "ATUALIZAR_FICHA", id: "c_gob", ficha: ficha252(150, "2026-11-12T00:00:00.000Z") });
  t("máximo maior: a Vida atual fica onde estava", [aumenta.encontro.combatentes[0].combatState.hpMaxBase, aumenta.encontro.combatentes[0].combatState.hpCurrent], [150, 90]);
  t("depois de atualizar, a cópia está em dia", L.fichaNovaDe(c, inventario(entrada("fm_creatures_v1", "252", nova252))), null);
  t("ficha vazia não muda nada", R(ferido, { tipo: "ATUALIZAR_FICHA", id: "c_gob", ficha: null }) === ferido, true);
  t("id desconhecido não muda nada", R(ferido, { tipo: "ATUALIZAR_FICHA", id: "nada", ficha: nova252 }).encontro.combatentes[0] === ferido.encontro.combatentes[0], true);
}

/* ============================================================ */
/* ATUALIZAR_FICHA na cópia do Afty                              */
/* ============================================================ */
{
  const dNova = deriveAfty(novaAfty);
  const m1 = R(base, { tipo: "ATUALIZAR_FICHA", id: "c_ogro", ficha: novaAfty, derivado: dNova });
  const c = m1.encontro.combatentes[1];
  t("a ficha clonada é refeita", [c.ficha.core.nd, c.ficha === novaAfty], [15, false]);
  t("a sessão é aparada pelo derivado novo: a Vida atual cabe no máximo novo", [c.sessao.hpAtual <= dNova.hp, c.sessao.hpAtual > 0], [true, true]);
  t("sem derivado a sessão fica como estava", R(base, { tipo: "ATUALIZAR_FICHA", id: "c_ogro", ficha: novaAfty }).encontro.combatentes[1].sessao === cAfty.sessao, true);
  t("o nome e o id ficam", [c.nome, c.id, c.origem], ["Ogro", "c_ogro", { chave: "fm_creatures_afty_v1", id: "ogro" }]);
  const perda = { invocacaoId: "inv1", nome: "Fundamento" };
  const comPerda = { ...base, encontro: { ...base.encontro, combatentes: [c252, { ...cAfty, ficha: { ...cAfty.ficha, fundamentosPerdidos: [perda] } }] } };
  const m2 = R(comPerda, { tipo: "ATUALIZAR_FICHA", id: "c_ogro", ficha: novaAfty, derivado: dNova });
  t("a perda de Fundamento que a cópia já tinha continua", m2.encontro.combatentes[1].ficha.fundamentosPerdidos, [perda]);
}

/* ============================================================ */
/* Personagem ligado e marcador não têm cópia                    */
/* ============================================================ */
{
  const lia = aftyF(19, "2026-11-01T00:00:00.000Z", { id: "lia", name: "Lia", rulesVersion: "player", system: "player" });
  const ligado = M.criarPersonagem(lia, { chave: "fm_creatures_player_v1", derived: deriveAfty(lia), id: "c_lia" });
  const marc = M.criarMarcador({ nome: "Bea", id: "c_bea" });
  const mundo = { ...base, encontro: { ...base.encontro, combatentes: [ligado, marc] }, sessoes: { lia: S.sessaoEmBranco(deriveAfty(lia)) } };
  t("o personagem ligado não é tocado", R(mundo, { tipo: "ATUALIZAR_FICHA", id: "c_lia", ficha: lia }) === mundo || R(mundo, { tipo: "ATUALIZAR_FICHA", id: "c_lia", ficha: lia }).encontro.combatentes[0] === ligado, true);
  t("o marcador não é tocado", R(mundo, { tipo: "ATUALIZAR_FICHA", id: "c_bea", ficha: lia }).encontro.combatentes[1] === marc, true);
}

/* ============================================================ */
/* AJUSTAR_COMBATE                                               */
/* ============================================================ */
{
  t("a ação existe no redutor", ACOES_DO_REDUTOR.includes("AJUSTAR_COMBATE"), true);
  const m1 = R(base, { tipo: "AJUSTAR_COMBATE", id: "c_gob", ajustes: { guardaAbsorbsFirst: false } });
  t("grava a chave no snapshot e deriva com ela", [m1.encontro.combatentes[0].snapshot.combatSettings, Mo.motor252.derivar(m1.encontro.combatentes[0].snapshot, m1.encontro.combatentes[0].combatState).combatSettings],
    [{ guardaAbsorbsFirst: false }, { guardaAbsorbsFirst: false }]);
  const m2 = R(m1, { tipo: "AJUSTAR_COMBATE", id: "c_gob", ajustes: { rdReducao: false, lixo: true } });
  t("junta com o que já havia e ignora chave desconhecida", m2.encontro.combatentes[0].snapshot.combatSettings, { guardaAbsorbsFirst: false, rdReducao: false });
  t("valor que não é booleano não muda nada", R(m2, { tipo: "AJUSTAR_COMBATE", id: "c_gob", ajustes: { rdReducao: "sim" } }) === m2 || R(m2, { tipo: "AJUSTAR_COMBATE", id: "c_gob", ajustes: { rdReducao: "sim" } }).encontro.combatentes[0] === m2.encontro.combatentes[0], true);
  t("a cópia do Afty não tem ajuste de 2.5.2", R(base, { tipo: "AJUSTAR_COMBATE", id: "c_ogro", ajustes: { rdReducao: false } }).encontro.combatentes[1] === cAfty, true);
  const a = R(m1, { tipo: "ATUALIZAR_FICHA", id: "c_gob", ficha: nova252 });
  t("atualizar a ficha mantém o ajuste feito no Encontro", a.encontro.combatentes[0].snapshot.combatSettings, { guardaAbsorbsFirst: false });
}

/* ============================================================ */
/* Os ajudantes do painel da 2.5.2                               */
/* ============================================================ */
{
  /* RD no próximo dano (CombatantPanel.jsx:1286-1289): Geral 20, Irredutível 15. */
  const s = { rdGeral: 20, rdIrredutivel: 15 };
  t("RD no próximo dano: sem ignorar, a Geral", V.rdNoProximoDano(s, {}), 20);
  t("ignorando uma parte: a Geral menos a parte, sem cair abaixo da Irredutível", [V.rdNoProximoDano(s, { ignorarRdValor: 3 }), V.rdNoProximoDano(s, { ignorarRdValor: 9 })], [17, 15]);
  t("Ignorar RD ligado: só a Irredutível", V.rdNoProximoDano(s, { ignorarRdAtivo: true, ignorarRdValor: 3 }), 15);

  const regraToggle = { id: "r1", name: "Fúria", activation: "toggle", cost: { pe: 5 }, requires: "", effects: [{ id: "e1", type: "modify_stat", stat: "defesa", op: "add", value: 2, valueExpr: "", stack: "sum", duration: { kind: "manual" } }] };
  const regraUso = { id: "r2", name: "Golpe", activation: "once", cost: { pe: 0 }, requires: "", effects: [] };
  const cs0 = { peCurrent: 3, activeModifiers: [] };
  t("sem PE a regra fica bloqueada, com o motivo", (({ bloqueada, motivo, rotulo }) => ({ bloqueada, motivo, rotulo }))(V.estadoDaRegra(regraToggle, cs0, {})),
    { bloqueada: true, motivo: "PE insuficiente (precisa de 5)", rotulo: "Ativar" });
  t("com PE, liberada", V.estadoDaRegra(regraToggle, { ...cs0, peCurrent: 5 }, {}).bloqueada, false);
  const ligada = { peCurrent: 0, activeModifiers: [{ id: "m1", source: { ruleId: "r1" } }] };
  t("ligada: Desativar, e nunca bloqueada (desligar não custa PE)", (({ ativa, bloqueada, rotulo }) => ({ ativa, bloqueada, rotulo }))(V.estadoDaRegra(regraToggle, ligada, {})), { ativa: true, bloqueada: false, rotulo: "Desativar" });
  t("regra sem efeito sustentado é Usar, e não liga", (({ ativa, rotulo }) => ({ ativa, rotulo }))(V.estadoDaRegra(regraUso, { peCurrent: 0, activeModifiers: [{ source: { ruleId: "r2" } }] }, {})), { ativa: false, rotulo: "Usar" });

  /* Uma criatura real da 2.5.2 (o compêndio): Jogo tem Guarda, Resistência Parcial e Total, regras ativáveis e uma reação. */
  const jogo = ["0.1", "0.2", "0.3", "0.4", "0.5"].flatMap((v) => JSON.parse(readFileSync(new URL("../src/data/enciclopedia-digital-" + v + ".json", import.meta.url), "utf8")).creatures ?? []).find((c) => c.name === "Jogo");
  const cs = V.estadoInicial(jogo);
  const d = Mo.motor252.derivar(jogo, cs);
  const x = V.extrasDoPainel(d, cs);
  t("Jogo: duas habilidades ativáveis e uma reação", [x.ativaveis.reduce((n, e) => n + e.regras.length, 0), x.reacoes.length], [2, 1]);
  t("o rótulo de um alvo de modificador vem do livro", [V.rotuloDoAlvo("defesa"), V.rotuloDoAlvo("rdGeral")], ["Defesa", "RD Geral"]);
  const regra = x.ativaveis.flatMap((e) => e.regras).find((r) => (r.cost?.pe ?? 0) > 0 && (r.activation ?? "toggle") === "toggle");
  const entidade = x.ativaveis.find((e) => e.regras.includes(regra));
  const r = V.ativarRegra(cs, d, regra, entidade.nome, entidade.grupo, { combatenteId: "c1", ambiente: { agora: () => 1000, aleatorio: () => 0.5, dataIso: () => "2026-11-17T00:00:00.000Z" } });
  t("ativar gasta o PE, liga a regra e o retorno diz o que fez", [r.estado.peCurrent, r.estado.activeModifiers.some((m) => m.source?.ruleId === regra.id), r.feedback.kind], [cs.peCurrent - regra.cost.pe, true, "on"]);
  t("com a regra ligada o botão vira Desativar", V.estadoDaRegra(regra, r.estado, x.contexto).rotulo, "Desativar");
  const sem = V.ativarRegra({ ...cs, peCurrent: 0 }, d, regra, entidade.nome, entidade.grupo);
  t("sem PE o uso é recusado e o estado não muda", [sem.feedback.kind, sem.estado.peCurrent, sem.estado.activeModifiers.length], ["block", 0, 0]);
}

/* ============================================================ */
/* O App deixou de abrir o modal e de reescrever fm_encounters_v1 */
/* ============================================================ */
{
  const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
  t("o App não importa mais o EncounterSyncModal", /EncounterSyncModal["']/.test(app), false);
  t("o App não usa mais o gerenciador de Encontros de antes", /useEncounterManager/.test(app), false);
  t("o App não passa mais onGoToMestre", /onGoToMestre=/.test(app), false);
}

if (bad.length) {
  console.error(bad.join("\n"));
  console.error(`\n${bad.length} FALHARAM, ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
