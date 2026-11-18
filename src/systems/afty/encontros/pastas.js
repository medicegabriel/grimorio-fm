/**
 * ============================================================
 * AS PASTAS DOS ENCONTROS (etapa 6a, 2026-11-17)
 * ============================================================
 * Decisão do autor ("Pastas Próprias"): cada lista de Encontros tem a própria
 * lista de pastas, numa chave `afty_` (vai para a nuvem pessoal junto com a
 * lista). Criar, renomear e apagar pasta de Encontro não mexe nas pastas de
 * criatura de rota nenhuma.
 *
 * ⚠ OS ENCONTROS MIGRADOS TRAZEM O ID DE UMA PASTA DE CRIATURA: o da 2.5.2 vem
 * do `/` (`fm_folders_v1`), o do `/Player` de antes vem das pastas do `/Player`,
 * e os do `/Afty` e da Guilda das pastas dessas rotas. Na abertura, a pasta que
 * um Encontro cita e que a lista ainda não tem é COPIADA com o mesmo id e o
 * mesmo nome, uma vez. Pasta citada que não existe em lugar nenhum fica de fora,
 * e o Encontro aparece em Sem Pasta.
 *
 * Nada aqui lê o `useCreatureStorage`: as pastas de criatura são lidas direto da
 * chave, sem regravar.
 * ============================================================
 */

export const CHAVE_PASTAS = {
  site: "afty_encontros_site_pastas_v1",
  afty: "afty_encontros_pastas_v1",
  eradeouro: "afty_encontros_eradeouro_pastas_v1",
};

/* De onde vêm as pastas citadas pelos Encontros de antes de cada lista. */
export const PASTAS_DE_ORIGEM = {
  site: ["fm_folders_v1", "fm_folders_player_v1"],
  afty: ["fm_folders_afty_v1", "fm_folders_player_v1"],
  eradeouro: ["fm_folders_eradeouro_v1"],
};

const ehObjeto = (v) => !!v && typeof v === "object" && !Array.isArray(v);

/** Uma pasta saneada: `{ id, name }`, ou null. */
export function normalizarPasta(p) {
  if (!ehObjeto(p) || typeof p.id !== "string" || !p.id) return null;
  const name = typeof p.name === "string" && p.name.trim() ? p.name.trim() : "Pasta";
  return { id: p.id, name };
}

/** A lista crua de uma chave de pastas: lista, `[]` sem chave, `null` quando o texto não é lista legível. */
export function lerPastasCru(chave, armazem = globalThis.localStorage) {
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

/** As pastas de uma lista de Encontros. `null` quando a chave está ilegível (ninguém grava por cima). */
export function lerPastas(grupo, armazem = globalThis.localStorage) {
  const cru = lerPastasCru(CHAVE_PASTAS[grupo], armazem);
  if (cru === null) return null;
  const vistos = new Set();
  const out = [];
  for (const p of cru) {
    const n = normalizarPasta(p);
    if (!n || vistos.has(n.id)) continue;
    vistos.add(n.id);
    out.push(n);
  }
  return out;
}

/**
 * As pastas que faltam: as que algum Encontro cita, que a lista não tem e que
 * existem numa das chaves de origem do grupo. Puro. Devolve a lista nova, ou a
 * MESMA lista quando não falta nada.
 */
export function comPastasCitadas(grupo, pastas, encontros, armazem = globalThis.localStorage) {
  const tem = new Set(pastas.map((p) => p.id));
  const citadas = new Set();
  for (const e of encontros ?? []) {
    const id = e?.pastaId;
    if (id != null && !tem.has(String(id))) citadas.add(String(id));
  }
  if (!citadas.size) return pastas;
  const achadas = [];
  for (const chave of PASTAS_DE_ORIGEM[grupo] ?? []) {
    for (const p of lerPastasCru(chave, armazem) ?? []) {
      const n = normalizarPasta(p ? { ...p, id: p.id != null ? String(p.id) : p.id } : p);
      if (n && citadas.has(n.id)) { achadas.push(n); citadas.delete(n.id); }
    }
  }
  return achadas.length ? [...pastas, ...achadas] : pastas;
}

/** Grava as pastas. Cota estourada devolve `{ ok: false }`. */
export function gravarPastas(grupo, pastas, armazem = globalThis.localStorage) {
  const chave = CHAVE_PASTAS[grupo];
  if (!chave) return { ok: false, erro: "Lista Desconhecida" };
  try {
    armazem.setItem(chave, JSON.stringify(pastas));
    return { ok: true };
  } catch {
    return { ok: false, erro: "Sem Espaço" };
  }
}
