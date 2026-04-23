export const exportCreaturesToFile = (creatures, filename, folders = []) => {
  const payload = {
    version: "2.0",
    exportedAt: new Date().toISOString(),
    system: "Feiticeiros & Maldições 2.5",
    count: creatures.length,
    creatures,
    folders,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  const defaultName =
    creatures.length === 1
      ? `${creatures[0].name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.json`
      : `grimorio-${creatures.length}-criaturas.json`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename || defaultName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const parsed = JSON.parse(text);

        // Detecta se é array puro (v1) ou formato envelopado (v2)
        const isArray = Array.isArray(parsed);
        const creaturesData = isArray ? parsed : parsed.creatures;

        if (!Array.isArray(creaturesData)) {
          throw new Error("Formato inválido: criaturas não encontradas.");
        }

        const valid = creaturesData.map((c) => {
          if (!c.name || typeof c.name !== "string") {
            throw new Error(`Criatura inválida: ${JSON.stringify(c)}`);
          }
          return {
            ...c,
            id: c.id || `migrated-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          };
        });

        const rawFolders = Array.isArray(parsed?.folders) ? parsed.folders : [];

        resolve({
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
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error("Falha ao ler o arquivo."));
    };

    reader.readAsText(file);
  });
};