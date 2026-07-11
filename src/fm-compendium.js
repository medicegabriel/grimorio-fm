// fm-compendium.js
// Compêndio de criaturas pré-prontas. Built-ins vivem aqui, nunca
// entram no storage. Quando o mestre edita/abre, App.jsx clona
// silenciosamente via storage.cloneFromBuiltIn().
//
// IDs determinísticos (prefix "builtin_") pra evitar colisão com ids gerados.
// Valores já derivados — mesmo schema que buildCreature() produziria.
// Dano das ações segue o modelo "média → split" (~45% dado / 55% fixo).

import enciclopedia from "./data/enciclopedia-digital-0.1.json";
import enciclopedia2 from "./data/enciclopedia-digital-0.2.json";

// Built-ins escritos à mão. Atualmente vazio — todas as criaturas vêm da
// Enciclopédia (JSON exportado do próprio app), transformada em built-in
// mais abaixo.
const HANDCRAFTED = [
];

// ============================================================
// ENCICLOPÉDIA — criaturas importadas (src/data/enciclopedia-*.json)
// ============================================================
// Cada criatura vira built-in: id determinístico (builtin_<slug do nome>),
// isBuiltIn:true, folderId:null. Slug estável a partir do nome (nomes únicos);
// em caso de colisão, sufixa um contador.
const slugify = (s) =>
  (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const ENCICLOPEDIA = (() => {
  const seen = new Set(HANDCRAFTED.map((c) => c.id));
  const creatures = [
    ...(enciclopedia.creatures ?? []),
    ...(enciclopedia2.creatures ?? []),
  ];
  return creatures.map((c) => {
    const base = `builtin_${slugify(c.name) || "criatura"}`;
    let id = base;
    let n = 2;
    while (seen.has(id)) id = `${base}_${n++}`;
    seen.add(id);
    return { ...c, id, isBuiltIn: true, folderId: null };
  });
})();

export const COMPENDIUM = [...HANDCRAFTED, ...ENCICLOPEDIA];

// Helper para busca por id (útil no App.jsx)
export const getCompendiumById = (id) =>
  COMPENDIUM.find((c) => c.id === id) ?? null;

// Helper para checar se um id é de built-in
export const isBuiltInId = (id) =>
  typeof id === "string" && id.startsWith("builtin_");
