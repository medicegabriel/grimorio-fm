/* O Encontro Unificado, etapa 3 (2026-11-17): a migração dos Encontros antigos. A 2.5.2 e o personagem do Afty de
   antes vão para a lista do site padrão com id estável, migrar duas vezes não duplica, o Encontro apagado não volta,
   cota estourada não grava nada e nenhuma chave antiga é apagada ou regravada. Ver docs/afty-encontros.md. */
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
await import(A + "afty-derive.js");
const { LADO } = await import(E + "afty-encontro.js");
const M = await import(E + "modelo.js");
const L = await import(E + "listas.js");
const G = await import(E + "migracao.js");
const Nuvem = await import(new URL("../src/nuvem/nuvem-config.js", import.meta.url).href);
const { _mesclar: mesclar } = await import(new URL("../src/nuvem/nuvem-sync.js", import.meta.url).href);
const { readFileSync } = await import("node:fs");
const { fileURLToPath } = await import("node:url");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

/* Um armazenamento que anota o que foi escrito e apagado, e falha nas chaves pedidas. */
function criarArmazem(inicial = {}, { falhaEm = null, leituraBloqueada = false } = {}) {
  const dados = new Map(Object.entries(inicial));
  const escritas = [];
  const apagadas = [];
  return {
    dados, escritas, apagadas,
    getItem: (k) => {
      if (leituraBloqueada) throw new Error("bloqueado");
      return dados.has(k) ? dados.get(k) : null;
    },
    setItem: (k, v) => {
      if (falhaEm === "tudo" || falhaEm?.has?.(k)) throw new Error("QuotaExceededError");
      escritas.push(k);
      dados.set(k, String(v));
    },
    removeItem: (k) => { apagadas.push(k); dados.delete(k); },
  };
}

let relogio = 9000;
const agora = () => relogio++;
const ler = (arm, k) => JSON.parse(arm.dados.get(k));
const SITE = L.CHAVE_LISTA.site;
const REG = G.CHAVE_REGISTRO_MIGRACAO_SITE;

/* ---------- as chaves antigas ---------- */
const lobo = { id: "lobo", name: "Lobo", stats: { hp: 30 } };
const lia = { id: "lia", name: "Lia", rulesVersion: "player" };
const ogro = { id: "ogro", name: "Ogro", rulesVersion: "afty" };
const heroi = { id: "heroi", name: "Herói", rulesVersion: "player", mesa: "eradeouro" };

const e252 = {
  id: "e1", name: "Emboscada", folderId: "p1", createdAt: 100, updatedAt: 200,
  status: "active", round: 3, activeCombatantId: "k2",
  combatants: [
    { id: "k1", creatureId: "lobo", displayName: "Lobo 1", snapshot: lobo, initiative: { roll: 12, modifier: 3, total: 15, isManual: false }, combatState: { hpCurrent: 25, peCurrent: 4 }, flags: { isDefeated: false, isHidden: true, side: "enemy" } },
    { id: "k2", creatureId: null, displayName: "Ana", snapshot: null, initiative: { roll: 0, modifier: 0, total: 18, isManual: true }, combatState: null, flags: { side: "pc" } },
    { id: "k3", creatureId: "x1", displayName: "Intrusa", snapshot: { id: "x1", name: "Intrusa", rulesVersion: "afty" }, flags: { side: "enemy" } },
    { id: "k4", creatureId: "lobo", snapshot: lobo, combatState: { hpCurrent: 0 }, flags: { isDefeated: true, side: "ally" } },
  ],
  log: [
    { id: "l1", round: 3, timestamp: 150, type: "damage", message: "Lobo 1 sofreu 5", combatantId: "k1" },
    { id: "l0", round: 1, timestamp: 110, type: "custom", message: "Começou", combatantId: null },
  ],
};
const e252b = { id: "e9", name: "Fechado", status: "finished", round: 7, combatants: [], log: [] };

const aftyA = {
  id: "a1", nome: "Treino", status: "planejando", rodada: 1, ativoId: null, criadoEm: 250, atualizadoEm: 300, log: [],
  combatentes: [
    { id: "c1", nome: "Lia", criaturaId: "lia", ficha: lia, sessao: { hpAtual: 40 }, iniciativa: { rolagem: 9, mod: 2, total: 11, manual: false }, flags: { abatido: false, oculto: false, lado: "jogador" } },
    { id: "c2", nome: "Lia (2)", criaturaId: "lia", ficha: lia, sessao: { hpAtual: 10 }, flags: { lado: "jogador" } },
    { id: "c3", nome: "Bruno", criaturaId: "bruno", ficha: { id: "bruno", name: "Bruno", rulesVersion: "player" }, sessao: { hpAtual: 7 } },
    { id: "c4", nome: "Porta", flags: { oculto: true, lado: "inimigo" } },
  ],
};
const aftyB = {
  id: "a2", nome: "Ogros", log: [],
  combatentes: [
    { id: "o1", nome: "Ogro", criaturaId: "ogro", ficha: ogro, sessao: {} },
    { id: "c5", nome: "Lia", criaturaId: "lia", ficha: lia, sessao: {} },
  ],
};
const aftyC = { id: "a3", nome: "Só Marcadores", log: [], combatentes: [{ id: "m1", nome: "Ana" }] };
const guilda = {
  id: "g1", nome: "Guilda", log: [],
  combatentes: [
    { id: "h1", nome: "Herói", criaturaId: "heroi", ficha: heroi, sessao: { hpAtual: 5 } },
    { id: "h2", nome: "Lia", criaturaId: "lia", ficha: lia, sessao: {} },
  ],
};

const ANTIGAS = {
  fm_encounters_v1: JSON.stringify([e252, e252b]),
  afty_encontros_v1: JSON.stringify([aftyA, aftyB, aftyC]),
  afty_encontros_eradeouro_v1: JSON.stringify([guilda]),
  fm_creatures_v1: JSON.stringify([lobo]),
  fm_creatures_player_v1: JSON.stringify([lia]),
  fm_creatures_afty_v1: JSON.stringify([ogro]),
  fm_creatures_eradeouro_v1: JSON.stringify([heroi]),
};
const intocadas = (arm) => Object.entries(ANTIGAS).every(([k, v]) => arm.dados.get(k) === v);

/* ============================================================ */
/* 1. A 2.5.2 no formato novo                                    */
/* ============================================================ */
{
  const { encontro: e, recusados } = G.encontroDe252(e252);
  t("id estável do site e a origem", [e.id, e.origem, e.grupo, e.versao], ["site252_e1", { chave: "fm_encounters_v1", id: "e1" }, "site", 2]);
  t("nome, pasta, datas, estado, rodada e vez", [e.nome, e.pastaId, e.criadoEm, e.atualizadoEm, e.status, e.rodada, e.ativoId], ["Emboscada", "p1", 100, 200, "ativo", 3, "k2"]);
  t("os combatentes mantêm o id, e a ficha do Afty fica de fora", e.combatentes.map((c) => c.id), ["k1", "k2", "k4"]);
  t("e é listada como recusada", recusados, [{ id: "k3", nome: "Intrusa", motivo: "fichaDoAfty" }]);
  const [k1, k2, k4] = e.combatentes;
  t("a criatura é do motor 252, nasce Oculta, e o isHidden vira Fora da Ordem",
    [k1.motor, k1.tipo, k1.visao, k1.flags, k1.dono.papel], ["252", "criatura", "oculta", { abatido: false, foraDaOrdem: true, lado: LADO.INIMIGO }, "mestre"]);
  t("a iniciativa da 2.5.2 no formato novo", k1.iniciativa, { rolagem: 12, mod: 3, total: 15, manual: false });
  t("snapshot e combatState passam sem transformação", [k1.snapshot, k1.combatState, k1.criaturaId, k1.origem], [lobo, { hpCurrent: 25, peCurrent: 4 }, "lobo", { chave: "fm_creatures_v1", id: "lobo" }]);
  t("sem nome de exibição, o nome sai da ficha", k4.nome, "Lobo");
  t("abatido e aliado chegam", k4.flags, { abatido: true, foraDaOrdem: false, lado: LADO.ALIADO });
  t("o jogador sem ficha vira marcador do lado dos jogadores", [k2.tipo, k2.motor, k2.flags.lado, k2.visao, k2.iniciativa.manual, k2.iniciativa.total], ["marcador", null, LADO.JOGADOR, "nome", true, 18]);
  t("o registro vem junto, na mesma ordem", e.log, [
    { id: "l1", rodada: 3, em: 150, tipo: "dano", mensagem: "Lobo 1 sofreu 5", combatenteId: "k1" },
    { id: "l0", rodada: 1, em: 110, tipo: "livre", mensagem: "Começou", combatenteId: null },
  ]);
  t("sem pedidos e com a configuração padrão", [e.pedidos, e.config], [[], { aceitarSozinho: false }]);
  t("finalizado e rodada", [G.encontroDe252(e252b).encontro.status, G.encontroDe252(e252b).encontro.rodada], ["finalizado", 7]);
  t("o formato novo passa pelo saneamento sem mudar", M.normalizarEncontro(JSON.parse(JSON.stringify(e))), e);
  t("lixo não vira Encontro", [G.encontroDe252(null), G.encontroDe252({ id: "" }), G.combatenteDe252({ snapshot: lobo })], [null, null, null]);
}

/* ============================================================ */
/* 2. O Afty de antes no formato novo                            */
/* ============================================================ */
{
  const inv = L.inventarioDoGrupo("site", criarArmazem(ANTIGAS));
  t("só o Encontro de personagem e marcador vai para o site", [aftyA, aftyB, aftyC].map(G.soPersonagemEMarcador), [true, false, false]);
  const e = G.encontroDeAftyAntigo(aftyA, { inventario: inv, grupo: "site", id: G.idMigrado("afty_encontros_v1", "a1"), origem: { chave: "afty_encontros_v1", id: "a1" } });
  t("id estável, origem e grupo", [e.id, e.origem, e.grupo, e.versao], ["siteafty_a1", { chave: "afty_encontros_v1", id: "a1" }, "site", 2]);
  t("os combatentes mantêm o id", e.combatentes.map((c) => c.id), ["c1", "c2", "c3", "c4"]);
  const [c1, c2, c3, c4] = e.combatentes;
  t("a ficha que está no inventário liga (Ligar e Guardar a Cópia)", [c1.tipo, c1.motor, c1.fichaRef, "ficha" in c1, "sessao" in c1], ["personagem", "afty", { chave: "fm_creatures_player_v1", id: "lia" }, false, false]);
  t("e a sessão da cópia fica guardada para consulta", c1.copiaAntiga, { sessao: { hpAtual: 40 }, nome: "Lia", guardadaEm: 300 });
  t("o personagem não tem visão", c1.visao, null);
  t("a iniciativa antiga chega", c1.iniciativa, { rolagem: 9, mod: 2, total: 11, manual: false });
  t("a mesma ficha duas vezes: só a primeira liga", [c2.tipo, !!c2.fichaRef, c2.ficha?.id, c2.sessao?.hpAtual], ["personagem", false, "lia", 10]);
  t("sem a ficha no inventário, continua cópia", [c3.tipo, !!c3.fichaRef, c3.ficha?.id, c3.origem, c3.sessao?.hpAtual], ["personagem", false, "bruno", null, 7]);
  t("o oculto antigo vira Fora da Ordem", [c4.tipo, c4.flags], ["marcador", { abatido: false, foraDaOrdem: true, lado: LADO.INIMIGO }]);
  t("o marcador de inimigo nasce Oculto", c4.visao, "oculta");
  t("ler o formato novo de novo não muda nada", G.encontroDeAftyAntigo(JSON.parse(JSON.stringify(e)), { inventario: inv, grupo: "site" }), e);
  t("a ficha ligada aparece no mundo pelo inventário", Object.keys(L.fichasDoInventario(e, inv)), ["lia"]);
}

/* ============================================================ */
/* 3. A cópia para o site: uma vez, duas vezes                   */
/* ============================================================ */
{
  const arm = criarArmazem(ANTIGAS);
  const r1 = G.executarMigracaoDoSite(arm, { agora });
  t("a primeira rodada copia os três", [r1.ok, r1.adicionados, r1.pulados], [true, 3, []]);
  t("e lista a ficha recusada com a origem", r1.recusados, [{ origem: "fm_encounters_v1:e1", id: "k3", nome: "Intrusa", motivo: "fichaDoAfty" }]);
  t("a lista do site tem os ids estáveis", ler(arm, SITE).map((e) => e.id), ["site252_e1", "site252_e9", "siteafty_a1"]);
  t("o registro guarda cada origem", ler(arm, REG).map((r) => [r.id, r.destino]), [
    ["fm_encounters_v1:e1", "site252_e1"], ["fm_encounters_v1:e9", "site252_e9"], ["afty_encontros_v1:a1", "siteafty_a1"],
  ]);
  t("só a lista do site e o registro foram escritos, a lista primeiro", arm.escritas, [SITE, REG]);
  t("nenhuma chave antiga foi apagada ou regravada", [intocadas(arm), arm.apagadas], [true, []]);

  const lista1 = arm.dados.get(SITE);
  const reg1 = arm.dados.get(REG);
  const r2 = G.executarMigracaoDoSite(arm, { agora });
  t("a segunda rodada não acrescenta nada", [r2.ok, r2.adicionados, r2.recusados], [true, 0, []]);
  t("e pula as três origens", r2.pulados, ["fm_encounters_v1:e1", "fm_encounters_v1:e9", "afty_encontros_v1:a1"]);
  t("lista e registro ficam idênticos, byte a byte", [arm.dados.get(SITE) === lista1, arm.dados.get(REG) === reg1], [true, true]);
  t("e a segunda rodada não escreveu nada", arm.escritas, [SITE, REG]);
  t("migrar duas vezes não duplica", new Set(ler(arm, SITE).map((e) => e.id)).size, ler(arm, SITE).length);

  // A pessoa mexeu na cópia: a próxima rodada não sobrescreve.
  const editada = ler(arm, SITE).map((e) => (e.id === "site252_e1" ? { ...e, nome: "Editado", rodada: 9 } : e));
  arm.dados.set(SITE, JSON.stringify(editada));
  G.executarMigracaoDoSite(arm, { agora });
  const e1 = ler(arm, SITE).find((e) => e.id === "site252_e1");
  t("a edição sobrevive a outra rodada", [e1.nome, e1.rodada], ["Editado", 9]);

  // A pessoa apagou um Encontro migrado: o registro não deixa voltar.
  arm.dados.set(SITE, JSON.stringify(ler(arm, SITE).filter((e) => e.id !== "site252_e9")));
  const r3 = G.executarMigracaoDoSite(arm, { agora });
  t("o Encontro migrado apagado não volta", [r3.adicionados, ler(arm, SITE).map((e) => e.id)], [0, ["site252_e1", "siteafty_a1"]]);

  // Um Encontro antigo novo (a tela de hoje ainda grava a chave antiga até a etapa 6) entra sozinho, uma vez.
  const antigos = JSON.parse(arm.dados.get("fm_encounters_v1"));
  arm.dados.set("fm_encounters_v1", JSON.stringify([...antigos, { id: "e2", name: "Depois", combatants: [], log: [] }]));
  const r4 = G.executarMigracaoDoSite(arm, { agora });
  const r5 = G.executarMigracaoDoSite(arm, { agora });
  t("o Encontro antigo novo entra na rodada seguinte, e só uma vez", [r4.adicionados, r5.adicionados, ler(arm, SITE).map((e) => e.id)], [1, 0, ["site252_e1", "siteafty_a1", "site252_e2"]]);
  t("o registro não repete origem", new Set(ler(arm, REG).map((r) => r.id)).size, ler(arm, REG).length);
  t("o que a migração gravou é o formato novo saneado", ler(arm, SITE).every((e) => JSON.stringify(M.normalizarEncontro(e)) === JSON.stringify(e)), true);
  t("lida pela rota, a lista do site sai igual", G.lerListaDeEncontros("site", { armazem: arm }), ler(arm, SITE));
}

/* ============================================================ */
/* 4. Registro perdido, cota, lista ilegível                     */
/* ============================================================ */
{
  // O registro se perdeu e a lista tem as cópias: refaz o registro, sem duplicar.
  const arm = criarArmazem(ANTIGAS);
  G.executarMigracaoDoSite(arm, { agora });
  const lista = arm.dados.get(SITE);
  arm.dados.delete(REG);
  const r = G.executarMigracaoDoSite(arm, { agora });
  t("sem o registro, a cópia achada pelo id só é registrada", [r.adicionados, arm.dados.get(SITE) === lista, ler(arm, REG).map((x) => x.id)], [0, true, ["fm_encounters_v1:e1", "fm_encounters_v1:e9", "afty_encontros_v1:a1"]]);
}
{
  const arm = criarArmazem(ANTIGAS, { falhaEm: "tudo" });
  const r = G.executarMigracaoDoSite(arm, { agora });
  t("cota estourada não grava nada", [r.ok, r.erro, r.adicionados, arm.dados.has(SITE), arm.dados.has(REG), intocadas(arm)], [false, "Sem Espaço", 0, false, false, true]);
}
{
  // A lista coube e o registro não: a próxima rodada acha as cópias pelo id.
  const arm = criarArmazem(ANTIGAS, { falhaEm: new Set([REG]) });
  const r = G.executarMigracaoDoSite(arm, { agora });
  t("registro sem espaço: a lista fica, e avisa", [r.ok, r.registroGravado, r.adicionados, arm.dados.has(REG)], [true, false, 3, false]);
  const arm2 = criarArmazem(Object.fromEntries(arm.dados));
  const r2 = G.executarMigracaoDoSite(arm2, { agora });
  t("e a rodada seguinte não duplica, só registra", [r2.adicionados, ler(arm2, SITE).length, ler(arm2, REG).length], [0, 3, 3]);
}
for (const texto of ["{quebrado", "{}", "\"texto\""]) {
  const arm = criarArmazem({ ...ANTIGAS, [SITE]: texto });
  const r = G.executarMigracaoDoSite(arm, { agora });
  t(`lista do site ilegível (${texto}) não é sobrescrita`, [r.ok, r.erro, arm.dados.get(SITE), arm.escritas], [false, "Lista do Site Ilegível", texto, []]);
}
{
  const arm = criarArmazem(ANTIGAS, { leituraBloqueada: true });
  const r = G.executarMigracaoDoSite(arm, { agora });
  t("armazenamento bloqueado não grava", [r.ok, arm.escritas], [false, []]);
}
{
  // Chave antiga ilegível: aquela fonte não entra, a outra entra, e o texto antigo fica.
  const arm = criarArmazem({ ...ANTIGAS, fm_encounters_v1: "xx" });
  const r = G.executarMigracaoDoSite(arm, { agora });
  t("fonte ilegível é pulada, a outra migra", [r.ok, ler(arm, SITE).map((e) => e.id), arm.dados.get("fm_encounters_v1")], [true, ["siteafty_a1"], "xx"]);
}
{
  const arm = criarArmazem({});
  const r = G.executarMigracaoDoSite(arm, { agora });
  t("sem nada antigo, nada é gravado", [r.ok, r.adicionados, arm.escritas], [true, 0, []]);
}

/* ============================================================ */
/* 5. O /Afty e a Guilda leem na memória, sem gravar             */
/* ============================================================ */
{
  const arm = criarArmazem(ANTIGAS);
  const afty = G.lerListaDeEncontros("afty", { armazem: arm });
  t("o /Afty lê os três Encontros antigos no formato novo", afty.map((e) => [e.id, e.versao, e.grupo]), [["a1", 2, "afty"], ["a2", 2, "afty"], ["a3", 2, "afty"]]);
  const [o1, c5] = afty[1].combatentes;
  t("a criatura do /Afty é cópia com origem no inventário", [o1.tipo, o1.motor, o1.visao, o1.origem, o1.ficha.id], ["criatura", "afty", "oculta", { chave: "fm_creatures_afty_v1", id: "ogro" }, "ogro"]);
  t("o personagem do /Player liga também no /Afty", c5.fichaRef, { chave: "fm_creatures_player_v1", id: "lia" });
  const ed = G.lerListaDeEncontros("eradeouro", { armazem: arm });
  t("a Guilda liga só com o inventário dela", ed[0].combatentes.map((c) => [c.id, c.fichaRef?.chave ?? null, c.ficha?.id ?? null]), [["h1", "fm_creatures_eradeouro_v1", null], ["h2", null, "lia"]]);
  t("ler na memória não escreve nem apaga nada", [arm.escritas, arm.apagadas, intocadas(arm)], [[], [], true]);
  t("a chave antiga continua no formato antigo", JSON.parse(arm.dados.get("afty_encontros_v1"))[0].versao, undefined);
  t("lista ilegível na rota é null, nunca vazia", G.lerListaDeEncontros("afty", { armazem: criarArmazem({ afty_encontros_v1: "{x" }) }), null);
  t("lista ausente é vazia", G.lerListaDeEncontros("afty", { armazem: criarArmazem({}) }), []);
}

/* ============================================================ */
/* 6. Dois aparelhos e a nuvem                                   */
/* ============================================================ */
{
  const a = criarArmazem(ANTIGAS);
  const b = criarArmazem(ANTIGAS);
  G.executarMigracaoDoSite(a, { agora });
  G.executarMigracaoDoSite(b, { agora });
  t("dois aparelhos com os mesmos antigos dão a mesma lista, byte a byte", a.dados.get(SITE) === b.dados.get(SITE), true);
  const m0 = mesclar({ [SITE]: a.dados.get(SITE) }, [], [{ chave: SITE, valor: b.dados.get(SITE) }], null);
  t("e a nuvem não tem o que juntar", m0.gravar[SITE], undefined);
  // O segundo aparelho tinha um Encontro antigo a mais: as listas diferem e a nuvem une pelo id.
  const c = criarArmazem({ ...ANTIGAS, fm_encounters_v1: JSON.stringify([e252, e252b, { id: "e5", name: "Só Lá", combatants: [], log: [] }]) });
  G.executarMigracaoDoSite(c, { agora });
  const m = mesclar({ [SITE]: a.dados.get(SITE), [REG]: a.dados.get(REG) }, [], [{ chave: SITE, valor: c.dados.get(SITE) }, { chave: REG, valor: c.dados.get(REG) }], null);
  t("a nuvem junta as duas listas sem duplicar", JSON.parse(m.gravar[SITE]).map((e) => e.id), ["site252_e1", "site252_e9", "siteafty_a1", "site252_e5"]);
  t("e junta os registros pelo id", JSON.parse(m.gravar[REG]).map((r) => r.id), ["fm_encounters_v1:e1", "fm_encounters_v1:e9", "afty_encontros_v1:a1", "fm_encounters_v1:e5"]);
  t("o registro vai para a nuvem pessoal e não é chave de fichas", [Nuvem.chaveDaPessoa(REG), Nuvem.ehChaveDeFichas(REG)], [true, false]);
  t("as chaves de origem também seguem na nuvem", ["fm_encounters_v1", "afty_encontros_v1"].map(Nuvem.chaveDaPessoa), [true, true]);
}

/* ============================================================ */
/* 7. O texto do arquivo                                         */
/* ============================================================ */
{
  const fonte = readFileSync(fileURLToPath(E + "migracao.js"), "utf8");
  t("sem travessão U+2014 na migração", fonte.includes("\u2014"), false);
  t("a migração não chama removeItem", /removeItem/.test(fonte), false);
  t("a migração só grava a lista do site e o registro", [...fonte.matchAll(/setItem\(([^,]+),/g)].map((x) => x[1]), ["CHAVE_LISTA.site", "CHAVE_REGISTRO_MIGRACAO_SITE"]);
}

if (bad.length) {
  console.error(`${bad.length} FALHA(S):\n` + bad.join("\n"));
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
