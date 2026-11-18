import { sistemaGravado } from "../afty-sistema";

/**
 * ============================================================
 * AS TRÊS LISTAS DE ENCONTROS E OS INVENTÁRIOS (etapa 3, 2026-11-17)
 * ============================================================
 * Decisão do autor: três listas separadas.
 *
 *   site       `/` e `/Player`, a MESMA lista: criaturas da 2.5.2 do `/` mais
 *              personagens do `/Player`. Chave nova `afty_encontros_site_v1`.
 *   afty       `/Afty`: criaturas do `/Afty` mais personagens do `/Player`.
 *              Segue em `afty_encontros_v1`.
 *   eradeouro  `/EraDeOuro`: só as fichas da Guilda. Segue em
 *              `afty_encontros_eradeouro_v1`.
 *
 * O prefixo `afty_` faz as três irem para a nuvem pessoal (`chaveDaPessoa`).
 *
 * ⚠ A FRONTEIRA DE CADA LISTA É A CHAVE DO INVENTÁRIO de onde a ficha veio, e
 * não o `mesa` da ficha: o import da Guilda não carimba `mesa`, e conferir o
 * campo recusaria ficha importada. Dentro da chave, o motor sai do
 * `sistemaGravado` (nunca do `sistemaDaFicha`, que cai no padrão calado).
 *
 * ⚠ O INVENTÁRIO É LIDO DIRETO DA CHAVE, nunca pelo `useCreatureStorage`, que
 * carimba `rulesVersion` e regrava. A ficha sem `rulesVersion` recebe o sistema
 * da chave só NA MEMÓRIA, como o gancho faria na leitura.
 * ============================================================
 */

export const CHAVE_LISTA = {
  site: "afty_encontros_site_v1",
  afty: "afty_encontros_v1",
  eradeouro: "afty_encontros_eradeouro_v1",
};

export const CHAVES_INVENTARIO = {
  site: ["fm_creatures_v1", "fm_creatures_player_v1"],
  afty: ["fm_creatures_afty_v1", "fm_creatures_player_v1"],
  eradeouro: ["fm_creatures_eradeouro_v1"],
};

/* O sistema em que cai a ficha SEM marca, chave por chave. É o `defaultRulesVersion` que o `App.jsx` passa ao
   `useCreatureStorage` de cada rota. A do `/` é a 2.5.2 (null). */
const SISTEMA_DA_CHAVE = {
  fm_creatures_v1: null,
  fm_creatures_player_v1: "player",
  fm_creatures_afty_v1: "afty",
  fm_creatures_eradeouro_v1: "afty",
};

/* ⚠ AS TELAS DE HOJE AINDA SÃO DONAS destas duas chaves (o `normalizarEncontro` antigo leria um personagem ligado
   como marcador, sem ficha e sem sessão). O formato novo só é gravado nelas quando a etapa 6 trocar as telas. */
export const CHAVES_COM_TELA_ANTIGA = new Set([CHAVE_LISTA.afty, CHAVE_LISTA.eradeouro]);

/** A lista de uma rota: `null` e `"player"` são o site padrão. */
export const grupoDaRota = (rotaId) => (rotaId === "afty" ? "afty" : rotaId === "eradeouro" ? "eradeouro" : "site");

const ehObjeto = (v) => !!v && typeof v === "object" && !Array.isArray(v);

/**
 * Como uma ficha entra no Encontro, pela chave de onde ela veio: `{ motor, tipo,
 * marca }`, ou null quando ela não é daquela lista.
 *
 *   fm_creatures_v1   só a ficha da 2.5.2 (sem marca do Afty), criatura do motor 252
 *   as outras         só ficha com marca do Afty ou do Player. A de Player é
 *                     personagem e entra ligada, a do Afty é criatura e entra cópia.
 */
export function classificarNaChave(ficha, chave) {
  if (!ehObjeto(ficha) || typeof ficha.id !== "string" || !ficha.id) return null;
  if (!Object.hasOwn(SISTEMA_DA_CHAVE, chave)) return null;
  const marca = ficha.rulesVersion == null ? SISTEMA_DA_CHAVE[chave] : sistemaGravado(ficha);
  if (chave === "fm_creatures_v1") return marca === null ? { motor: "252", tipo: "criatura", marca: "2.5.2" } : null;
  if (!marca) return null;
  return { motor: "afty", tipo: marca === "player" ? "personagem" : "criatura", marca };
}

/* Memória por chave e pelo TEXTO gravado: o mesmo texto devolve os mesmos objetos, e é isso que deixa o cache do
   derive (pela identidade da ficha) funcionar com a ficha ligada. */
const MEMO = new Map();

/**
 * O inventário de UMA chave: `{ chave, fichas: [{ chave, motor, tipo, marca,
 * ficha }], recusadas: [{ id, nome, rulesVersion }] }`. Chave ausente, JSON
 * quebrado ou armazenamento bloqueado viram inventário vazio.
 */
export function lerInventario(chave, armazem = globalThis.localStorage) {
  let texto = null;
  try { texto = armazem?.getItem(chave) ?? null; } catch { texto = null; }
  const memo = MEMO.get(chave);
  if (memo && memo.armazem === armazem && memo.texto === texto) return memo.saida;
  let lista = [];
  try { lista = texto ? JSON.parse(texto) : []; } catch { lista = []; }
  const saida = { chave, fichas: [], recusadas: [] };
  for (const f of Array.isArray(lista) ? lista : []) {
    const cl = classificarNaChave(f, chave);
    if (!cl) {
      if (ehObjeto(f)) saida.recusadas.push({ id: f.id ?? null, nome: f.name ?? null, rulesVersion: f.rulesVersion ?? null });
      continue;
    }
    const ficha = f.rulesVersion == null && cl.marca !== "2.5.2" ? { ...f, rulesVersion: cl.marca } : f;
    saida.fichas.push({ chave, ...cl, ficha });
  }
  MEMO.set(chave, { armazem, texto, saida });
  return saida;
}

/**
 * O inventário de uma LISTA: as fichas das chaves do grupo, na ordem das chaves,
 * mais `porId` (o primeiro de cada id vence).
 */
export function inventarioDoGrupo(grupo, armazem = globalThis.localStorage) {
  const fichas = [];
  const recusadas = [];
  const porId = new Map();
  for (const chave of CHAVES_INVENTARIO[grupo] ?? []) {
    const inv = lerInventario(chave, armazem);
    for (const e of inv.fichas) {
      fichas.push(e);
      if (!porId.has(e.ficha.id)) porId.set(e.ficha.id, e);
    }
    for (const r of inv.recusadas) recusadas.push({ chave, ...r });
  }
  return { grupo, fichas, recusadas, porId };
}

/** As fichas ligadas de um mundo, pelo id, a partir do inventário (o `fichas` de `derivarEncontro`). */
export function fichasDoInventario(encontro, inventario) {
  const out = {};
  for (const c of encontro?.combatentes ?? []) {
    if (c.tipo !== "personagem" || !c.fichaRef?.id) continue;
    const e = inventario?.porId?.get(c.fichaRef.id);
    if (e) out[c.fichaRef.id] = e.ficha;
  }
  return out;
}

/**
 * A ficha NOVA de uma criatura copiada, ou null quando a cópia está em dia (etapa 6b, 2026-11-17). Procura no inventário pela
 * chave e pelo id de origem do combatente. Está desatualizada quando o carimbo da última edição (`updatedAt`) ou o tamanho do
 * `editLog` mudou. Sem carimbo nos dois lados não dá para saber, e ela conta como em dia. Personagem ligado, marcador e
 * criatura sem origem nunca têm ficha nova.
 */
export function fichaNovaDe(combatente, inventario) {
  const c = combatente;
  if (!c || c.tipo !== "criatura" || !c.motor) return null;
  const id = c.origem?.id ?? c.criaturaId;
  if (!id) return null;
  const doGrupo = (inventario?.fichas ?? []).filter((e) => e.ficha?.id === id && e.motor === c.motor);
  const entrada = doGrupo.find((e) => !c.origem?.chave || e.chave === c.origem.chave) ?? null;
  if (!entrada) return null;
  const copia = c.motor === "252" ? c.snapshot : c.ficha;
  const nova = entrada.ficha;
  if (!copia || !nova) return null;
  const mudou = (nova.updatedAt ?? "") !== (copia.updatedAt ?? "") || (nova.editLog?.length ?? 0) !== (copia.editLog?.length ?? 0);
  return mudou ? nova : null;
}

/** A lista CRUA de uma chave de Encontros, sem saneamento. `null` quando o texto gravado não é uma lista legível. */
export function lerListaCrua(chave, armazem = globalThis.localStorage) {
  let texto = null;
  try { texto = armazem?.getItem(chave) ?? null; } catch { return null; }
  if (!texto) return [];
  try {
    const v = JSON.parse(texto);
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

/**
 * Grava a lista de uma rota. ⚠ Recusa as duas chaves que as telas de hoje ainda
 * leem, até a etapa 6 passar `telaAntigaDesligada`. Cota estourada devolve
 * `{ ok: false }` sem gravar nada.
 */
export function gravarLista(grupo, lista, armazem = globalThis.localStorage, { telaAntigaDesligada = false } = {}) {
  const chave = CHAVE_LISTA[grupo];
  if (!chave) return { ok: false, erro: "Lista Desconhecida" };
  if (CHAVES_COM_TELA_ANTIGA.has(chave) && !telaAntigaDesligada) return { ok: false, erro: "Chave com Tela Antiga" };
  try {
    armazem.setItem(chave, JSON.stringify(lista));
    return { ok: true };
  } catch {
    return { ok: false, erro: "Sem Espaço" };
  }
}
