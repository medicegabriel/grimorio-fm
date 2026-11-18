import { sistemaGravado } from "../afty-sistema";
import { VERSAO_ENCONTRO, CONFIG_PADRAO, normalizarCombatente, normalizarEncontro } from "./modelo";
import { LADO } from "./afty-encontro";
import { CHAVE_LISTA, inventarioDoGrupo, lerListaCrua } from "./listas";

/**
 * ============================================================
 * A MIGRAÇÃO DOS ENCONTROS ANTIGOS (etapa 3, 2026-11-17)
 * ============================================================
 * Decisão do autor: os Encontros antigos convertem sozinhos na primeira
 * abertura, e a chave antiga fica INTOCADA. Nada aqui apaga ou regrava
 * `fm_encounters_v1`, `afty_encontros_v1` ou `afty_encontros_eradeouro_v1`.
 *
 * Duas coisas diferentes moram aqui:
 *
 * 1. A LEITURA do formato antigo, na memória (`encontroDeAftyAntigo`,
 *    `lerListaDeEncontros`). O `/Afty` e a Guilda continuam na chave de sempre,
 *    e o Encontro antigo vira o novo ao ser lido.
 * 2. A CÓPIA para a lista nova do site padrão (`executarMigracaoDoSite`), a
 *    única que grava, e só em `afty_encontros_site_v1` e no registro dela:
 *      - todo Encontro de `fm_encounters_v1` (o `/` de antes);
 *      - todo Encontro de `afty_encontros_v1` que só tem personagem e marcador,
 *        para quem os criou no `/Player` antes do cadeado (o `/Afty` e o
 *        `/Player` dividiam aquela lista).
 *
 * ⚠ IDEMPOTENTE, COM ID ESTÁVEL. O id da cópia sai do id de origem
 * (`site252_<id>`, `siteafty_<id>`) e os combatentes mantêm o id que tinham:
 * migrar duas vezes, ou em dois aparelhos que a nuvem junta por id, não duplica.
 * A segunda rodada pula o que já existe e NÃO sobrescreve o que a pessoa mudou.
 * E o registro (`afty_encontros_site_migracao_v1`, lista de `{ id }` para a
 * nuvem juntar por id) guarda cada origem já copiada: o Encontro migrado que a
 * pessoa apagou não volta.
 *
 * ⚠ O PERSONAGEM QUE ERA CÓPIA (autor, 2026-11-17, "Ligar e Guardar a Cópia"):
 * vira ligado à ficha se ela ainda existe no inventário da lista, e a sessão que
 * a cópia tinha no Encontro fica em `copiaAntiga`, só para consulta. Sem a ficha,
 * continua cópia. Se a mesma ficha aparecia duas vezes, só a primeira liga.
 *
 * Puro, salvo `executarMigracaoDoSite`, que recebe o armazenamento.
 * ============================================================
 */

export const CHAVE_ENCONTROS_252 = "fm_encounters_v1";
export const CHAVE_ENCONTROS_AFTY = CHAVE_LISTA.afty;
export const CHAVE_REGISTRO_MIGRACAO_SITE = "afty_encontros_site_migracao_v1";

const PREFIXO = { [CHAVE_ENCONTROS_252]: "site252_", [CHAVE_ENCONTROS_AFTY]: "siteafty_" };

/** O id estável da cópia no site padrão. */
export const idMigrado = (chave, id) => `${PREFIXO[chave]}${id}`;

/** A origem como texto, o `id` de uma linha do registro. */
export const origemDaMigracao = (chave, id) => `${chave}:${id}`;

const ehObjeto = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};
const numeroOuNull = (v) => (Number.isFinite(Number(v)) && v != null ? Number(v) : null);
const LADOS = Object.values(LADO);

/* ============================================================ */
/* A 2.5.2 (`fm_encounters_v1`)                                  */
/* ============================================================ */

const STATUS_252 = { planning: "planejando", active: "ativo", finished: "finalizado" };
const LADO_252 = { enemy: LADO.INIMIGO, pc: LADO.JOGADOR, ally: LADO.ALIADO };
const LOG_252 = { damage: "dano", heal: "cura", condition: "condicao", turn: "turno", round: "rodada", custom: "livre" };

/**
 * Um combatente da 2.5.2 no formato novo. O `snapshot` e o `combatState` passam
 * SEM transformação (a conta é do motor da 2.5.2, etapa 4). O jogador sem ficha
 * (`snapshot: null`) vira marcador, o `isHidden` vira Fora da Ordem, e a criatura
 * migrada nasce Oculta.
 *
 * ⚠ Ficha com marca do Afty dentro de um Encontro da 2.5.2 (o erro de produção de
 * 2026-09-12, antes da porta) é RECUSADA: ela não é criatura da 2.5.2, e a lista
 * do site não a derivaria certo. O Encontro de origem continua com ela.
 */
export function combatenteDe252(c) {
  if (!ehObjeto(c) || typeof c.id !== "string" || !c.id) return null;
  const temFicha = ehObjeto(c.snapshot);
  const lado = LADO_252[c.flags?.side] ?? (temFicha ? LADO.INIMIGO : LADO.JOGADOR);
  const comum = {
    id: c.id,
    nome: c.displayName || c.snapshot?.name || (temFicha ? "Combatente" : "Jogador"),
    iniciativa: {
      rolagem: inteiro(c.initiative?.roll), mod: inteiro(c.initiative?.modifier),
      total: inteiro(c.initiative?.total), manual: !!c.initiative?.isManual,
    },
    flags: { abatido: !!c.flags?.isDefeated, foraDaOrdem: !!c.flags?.isHidden, lado },
  };
  if (!temFicha) return normalizarCombatente({ ...comum, tipo: "marcador" });
  if (sistemaGravado(c.snapshot)) return { recusado: { id: c.id, nome: comum.nome, motivo: "fichaDoAfty" } };
  const criaturaId = c.creatureId ?? c.snapshot.id ?? null;
  return normalizarCombatente({
    ...comum,
    motor: "252",
    tipo: "criatura",
    criaturaId,
    origem: { chave: "fm_creatures_v1", id: criaturaId },
    snapshot: c.snapshot,
    combatState: c.combatState ?? null,
  });
}

/** Um Encontro de `fm_encounters_v1` no formato novo, com o id estável da lista do site. `{ encontro, recusados }`. */
export function encontroDe252(bruto) {
  if (!ehObjeto(bruto) || typeof bruto.id !== "string" || !bruto.id) return null;
  const combatentes = [];
  const recusados = [];
  for (const c of Array.isArray(bruto.combatants) ? bruto.combatants : []) {
    const n = combatenteDe252(c);
    if (!n) continue;
    if (n.recusado) recusados.push(n.recusado);
    else combatentes.push(n);
  }
  const encontro = normalizarEncontro({
    versao: VERSAO_ENCONTRO,
    id: idMigrado(CHAVE_ENCONTROS_252, bruto.id),
    grupo: "site",
    origem: { chave: CHAVE_ENCONTROS_252, id: bruto.id },
    nome: bruto.name || "Encontro",
    pastaId: bruto.folderId ?? null,
    criadoEm: numeroOuNull(bruto.createdAt),
    atualizadoEm: numeroOuNull(bruto.updatedAt),
    status: STATUS_252[bruto.status] ?? "planejando",
    rodada: bruto.round,
    ativoId: bruto.activeCombatantId ?? null,
    combatentes,
    log: (Array.isArray(bruto.log) ? bruto.log : []).filter(ehObjeto).map((l) => ({
      id: l.id ?? null, rodada: inteiro(l.round, 1), em: numeroOuNull(l.timestamp),
      tipo: LOG_252[l.type] ?? "livre", mensagem: String(l.message ?? ""), combatenteId: l.combatantId ?? null,
    })),
    pedidos: [],
    config: { ...CONFIG_PADRAO },
  });
  return { encontro, recusados };
}

/* ============================================================ */
/* O AFTY DE ANTES (`afty_encontros_v1`, `afty_encontros_eradeouro_v1`) */
/* ============================================================ */

/**
 * Um combatente do Encontro do Afty de antes (`ficha` mais `sessao`, `oculto`) no
 * formato novo. `ligados` é o conjunto das fichas já ligadas neste Encontro, para
 * a segunda cópia da mesma ficha continuar cópia.
 */
export function combatenteDeAftyAntigo(c, { inventario = null, ligados = new Set(), guardadaEm = null } = {}) {
  if (!ehObjeto(c) || typeof c.id !== "string" || !c.id) return null;
  // Já está no formato novo (lido duas vezes, ou gravado pela etapa 6).
  if (c.tipo && Object.hasOwn(c, "motor")) return normalizarCombatente(c);
  const temFicha = ehObjeto(c.ficha);
  const marca = temFicha ? sistemaGravado(c.ficha) : null;
  const ladoPadrao = !temFicha || marca === "player" ? LADO.JOGADOR : LADO.INIMIGO;
  const comum = {
    id: c.id,
    nome: c.nome || (temFicha ? c.ficha.name : null) || "Combatente",
    iniciativa: c.iniciativa,
    flags: {
      abatido: !!c.flags?.abatido,
      foraDaOrdem: !!(c.flags?.foraDaOrdem ?? c.flags?.oculto),
      lado: LADOS.includes(c.flags?.lado) ? c.flags.lado : ladoPadrao,
    },
  };
  if (!temFicha) return normalizarCombatente({ ...comum, tipo: "marcador" });
  const fichaId = c.criaturaId ?? c.ficha.id ?? null;
  const naLista = fichaId ? inventario?.porId?.get(fichaId) ?? null : null;
  if (marca === "player") {
    if (naLista?.tipo === "personagem" && !ligados.has(naLista.ficha.id)) {
      ligados.add(naLista.ficha.id);
      return normalizarCombatente({
        ...comum,
        motor: "afty",
        tipo: "personagem",
        fichaRef: { chave: naLista.chave, id: naLista.ficha.id },
        copiaAntiga: { sessao: c.sessao ?? null, nome: comum.nome, guardadaEm },
      });
    }
    return normalizarCombatente({
      ...comum, motor: "afty", tipo: "personagem", criaturaId: fichaId,
      origem: naLista ? { chave: naLista.chave, id: fichaId } : null, ficha: c.ficha, sessao: c.sessao,
    });
  }
  return normalizarCombatente({
    ...comum, motor: "afty", tipo: "criatura", criaturaId: fichaId,
    origem: naLista ? { chave: naLista.chave, id: fichaId } : null, ficha: c.ficha, sessao: c.sessao,
  });
}

/**
 * Um Encontro do Afty de antes no formato novo. Já no formato novo, só saneia.
 * `id` e `origem` existem para a cópia no site padrão.
 */
export function encontroDeAftyAntigo(bruto, { inventario = null, grupo = null, id = null, origem = null } = {}) {
  if (!ehObjeto(bruto) || typeof bruto.id !== "string" || !bruto.id) return null;
  if (bruto.versao === VERSAO_ENCONTRO) {
    const n = normalizarEncontro(bruto);
    return n && (id || origem) ? { ...n, id: id ?? n.id, ...(origem ? { origem } : {}), grupo: grupo ?? n.grupo } : n;
  }
  const ligados = new Set();
  const guardadaEm = numeroOuNull(bruto.atualizadoEm);
  const combatentes = (Array.isArray(bruto.combatentes) ? bruto.combatentes : [])
    .map((c) => combatenteDeAftyAntigo(c, { inventario, ligados, guardadaEm }))
    .filter(Boolean);
  return normalizarEncontro({
    ...bruto,
    versao: VERSAO_ENCONTRO,
    id: id ?? bruto.id,
    grupo,
    ...(origem ? { origem } : {}),
    combatentes,
    pedidos: [],
    config: { ...CONFIG_PADRAO },
  });
}

/** O Encontro antigo que só tem personagem e marcador, com pelo menos um personagem. É o que ia do `/Player`. */
export function soPersonagemEMarcador(bruto) {
  const lista = Array.isArray(bruto?.combatentes) ? bruto.combatentes : [];
  const fichas = lista.filter((c) => ehObjeto(c?.ficha));
  return fichas.length > 0 && fichas.every((c) => sistemaGravado(c.ficha) === "player");
}

/**
 * A lista de Encontros de uma rota, no formato novo, NA MEMÓRIA. O `/Afty` e a
 * Guilda leem o formato antigo e o convertem aqui, sem gravar. `null` quando a
 * chave tem texto que não é lista (nunca vira lista vazia, para ninguém gravar
 * por cima).
 */
export function lerListaDeEncontros(grupo, { armazem = globalThis.localStorage, inventario = null } = {}) {
  const bruta = lerListaCrua(CHAVE_LISTA[grupo], armazem);
  if (bruta === null) return null;
  const inv = inventario ?? inventarioDoGrupo(grupo, armazem);
  return bruta.map((e) => encontroDeAftyAntigo(e, { inventario: inv, grupo })).filter(Boolean);
}

/* ============================================================ */
/* A CÓPIA PARA O SITE PADRÃO                                    */
/* ============================================================ */

/**
 * O plano da migração, sem gravar nada: `{ novos, registros, pulados,
 * recusados }`. Pula a origem já registrada e a cópia cujo id já está na lista
 * (e então só registra a origem, para a próxima rodada nem olhar).
 */
export function planejarMigracaoDoSite({
  listaSite = [], encontros252 = [], encontrosAfty = [], registro = [], inventario = null, agora = Date.now,
} = {}) {
  const ids = new Set(listaSite.map((e) => e?.id).filter(Boolean));
  const feitos = new Set((Array.isArray(registro) ? registro : []).map((r) => r?.id).filter(Boolean));
  const novos = [];
  const registros = [];
  const pulados = [];
  const recusados = [];
  const marcar = (chave, idOrigem, destino) => {
    const id = origemDaMigracao(chave, idOrigem);
    feitos.add(id);
    registros.push({ id, destino, em: agora() });
  };
  const fontes = [
    [CHAVE_ENCONTROS_252, encontros252, (e) => encontroDe252(e)],
    [CHAVE_ENCONTROS_AFTY, encontrosAfty.filter(soPersonagemEMarcador), (e, destino) => ({
      encontro: encontroDeAftyAntigo(e, { inventario, grupo: "site", id: destino, origem: { chave: CHAVE_ENCONTROS_AFTY, id: e.id } }),
      recusados: [],
    })],
  ];
  for (const [chave, lista, converter] of fontes) {
    for (const e of Array.isArray(lista) ? lista : []) {
      if (!ehObjeto(e) || typeof e.id !== "string" || !e.id) continue;
      const origem = origemDaMigracao(chave, e.id);
      const destino = idMigrado(chave, e.id);
      if (feitos.has(origem)) { pulados.push(origem); continue; }
      if (ids.has(destino)) { pulados.push(origem); marcar(chave, e.id, destino); continue; }
      const r = converter(e, destino);
      if (!r?.encontro) continue;
      novos.push(r.encontro);
      ids.add(destino);
      for (const x of r.recusados) recusados.push({ origem, ...x });
      marcar(chave, e.id, destino);
    }
  }
  return { novos, registros, pulados, recusados };
}

/**
 * Roda a migração do site padrão no armazenamento. Grava SÓ a lista do site e o
 * registro, nunca as chaves de origem.
 *
 * ⚠ Uma escrita por chave, e a lista primeiro: cota estourada na lista não grava
 * nada (nem o registro), e a próxima abertura tenta de novo. Lista do site com
 * texto ilegível não é sobrescrita.
 *
 * Devolve `{ ok, adicionados, pulados, recusados, erro? }`.
 */
export function executarMigracaoDoSite(armazem = globalThis.localStorage, { agora = Date.now } = {}) {
  const listaSite = lerListaCrua(CHAVE_LISTA.site, armazem);
  if (listaSite === null) return { ok: false, erro: "Lista do Site Ilegível", adicionados: 0, pulados: [], recusados: [] };
  const registro = lerListaCrua(CHAVE_REGISTRO_MIGRACAO_SITE, armazem) ?? [];
  const plano = planejarMigracaoDoSite({
    listaSite,
    encontros252: lerListaCrua(CHAVE_ENCONTROS_252, armazem) ?? [],
    encontrosAfty: lerListaCrua(CHAVE_ENCONTROS_AFTY, armazem) ?? [],
    registro,
    inventario: inventarioDoGrupo("site", armazem),
    agora,
  });
  const base = { adicionados: plano.novos.length, pulados: plano.pulados, recusados: plano.recusados };
  if (!plano.novos.length && !plano.registros.length) return { ok: true, ...base };
  if (plano.novos.length) {
    try {
      armazem.setItem(CHAVE_LISTA.site, JSON.stringify([...listaSite, ...plano.novos]));
    } catch {
      return { ok: false, erro: "Sem Espaço", adicionados: 0, pulados: plano.pulados, recusados: [] };
    }
  }
  try {
    armazem.setItem(CHAVE_REGISTRO_MIGRACAO_SITE, JSON.stringify([...registro, ...plano.registros]));
  } catch {
    // A lista já tem as cópias, e a próxima rodada as acha pelo id e só registra.
    return { ok: true, ...base, registroGravado: false };
  }
  return { ok: true, ...base };
}
