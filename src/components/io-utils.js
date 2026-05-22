// ============================================================
// io-utils — import/export de criaturas (arquivo e texto)
// ============================================================
// Funções puras (buildExportPayload / serializeExport / parseImportText)
// servem tanto o fluxo de arquivo quanto o de copiar/colar.
// ============================================================

// Monta o envelope de exportação (formato bundle v2).
export const buildExportPayload = (creatures, folders = []) => ({
  version: "2.0",
  exportedAt: new Date().toISOString(),
  system: "Feiticeiros & Maldições 2.5",
  count: creatures.length,
  creatures,
  folders,
});

// Serializa o envelope como JSON identado — pronto pra copiar ou baixar.
export const serializeExport = (creatures, folders = []) =>
  JSON.stringify(buildExportPayload(creatures, folders), null, 2);

const defaultExportName = (creatures) =>
  creatures.length === 1
    ? `${creatures[0].name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.json`
    : `grimorio-${creatures.length}-criaturas.json`;

export const exportCreaturesToFile = (creatures, filename, folders = []) => {
  const blob = new Blob([serializeExport(creatures, folders)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename || defaultExportName(creatures);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Faz parse + validação de um texto JSON de import (puro — sem FileReader).
// Aceita array puro (v1) ou envelope { creatures, folders } (v2).
// Lança Error com mensagem amigável em caso de falha.
export const parseImportText = (text) => {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("JSON inválido — verifique o texto colado.");
  }

  // Detecta se é array puro (v1) ou formato envelopado (v2)
  const isArray = Array.isArray(parsed);
  const creaturesData = isArray ? parsed : parsed?.creatures;

  if (!Array.isArray(creaturesData)) {
    throw new Error("Formato inválido: criaturas não encontradas.");
  }

  const valid = creaturesData.map((c) => {
    if (!c || !c.name || typeof c.name !== "string") {
      throw new Error(`Criatura inválida: ${JSON.stringify(c)}`);
    }
    const hasBuiltInId = typeof c.id === "string" && c.id.includes("builtin_");
    const safeId = !c.id || hasBuiltInId
      ? `imported_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`
      : c.id;
    return {
      ...c,
      id: safeId,
      isBuiltIn: false,
      folderId: null,
    };
  });

  const rawFolders = Array.isArray(parsed?.folders) ? parsed.folders : [];

  return {
    creatures: valid,
    folders: rawFolders,
    meta: isArray
      ? { format: "array-v1", importedAt: new Date().toISOString(), count: valid.length }
      : {
          format: "bundle-v2",
          system: parsed.system || "Desconhecido",
          exportedAt: parsed.exportedAt,
          count: valid.length,
        },
  };
};

export const importFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        resolve(parseImportText(event.target.result));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo."));
    reader.readAsText(file);
  });
};
