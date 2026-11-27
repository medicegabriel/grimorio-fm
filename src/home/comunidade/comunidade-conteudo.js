const INVENTARIOS = [
  { chave: "fm_creatures_player_v1", rotulo: "Jogador", versao: "player" },
  { chave: "fm_creatures_v1", rotulo: "Criatura", versao: "2.5.2" },
  { chave: "fm_creatures_afty_v1", rotulo: "Afty", versao: "afty" },
  { chave: "fm_creatures_eradeouro_v1", rotulo: "Era de Ouro", versao: "afty" },
  { chave: "fm_creatures_eclesiastes_v1", rotulo: "Eclesiastes", versao: "afty" },
];

export const LIMITE_CSS = 32000;
export const LIMITE_FICHA = 240000;
export const LIMITE_TEXTO = 12000;
export const LIMITE_COMENTARIO = 2000;

export const tamanhoEmBytes = (valor) => new TextEncoder().encode(valor).length;

export function categoriaDaFicha(ficha) {
  if (typeof ficha?.name !== "string" || !ficha.name.trim()) return null;
  if (ficha.rulesVersion === "player") return "jogador";
  if (ficha.rulesVersion === "afty" || ficha.rulesVersion === "2.5.2") return "criatura";
  return null;
}

export function lerFichasDaComunidade(armazem = globalThis.localStorage) {
  return INVENTARIOS.flatMap(({ chave, rotulo, versao }) => {
    try {
      const fichas = JSON.parse(armazem.getItem(chave));
      if (!Array.isArray(fichas)) return [];
      return fichas.flatMap((original) => {
        if (!original?.id || original.isBuiltIn || original.isTemplate) return [];
        const ficha = { ...original, rulesVersion: original.rulesVersion ?? versao };
        const categoria = categoriaDaFicha(ficha);
        return categoria ? [{ id: `${chave}:${ficha.id}`, rotulo, categoria, ficha }] : [];
      });
    } catch {
      return [];
    }
  });
}

export function prepararFicha(ficha, categoria) {
  if (!ficha || categoriaDaFicha(ficha) !== categoria) {
    throw new Error("Escolha uma ficha compatível com o tipo de publicação.");
  }
  const copia = { ...ficha };
  for (const campo of ["id", "folderId", "createdAt", "updatedAt", "isBuiltIn", "isTemplate", "portraitUrl", "portraitFocus"]) {
    delete copia[campo];
  }
  if (tamanhoEmBytes(JSON.stringify(copia)) > LIMITE_FICHA) {
    throw new Error("Esta ficha ultrapassa 240 KB. Reduza o tamanho antes de publicar.");
  }
  return copia;
}

export function dadosDaFicha(ficha, categoria) {
  const edicao = ficha.edicaoDeRegras === "eclesiastes" ? "Eclesiastes" : ({
    player: "Jogador", afty: "Afty", "2.5.2": "2.5.2",
  }[ficha.rulesVersion] ?? "");
  const nivel = ficha.core?.nivel ?? ficha.core?.nd ?? ficha.nivel ?? ficha.level;
  const nd = ficha.core?.nd ?? ficha.nd ?? ficha.challengeRating;
  const marca = categoria === "jogador" ? { Nível: nivel } : { ND: nd };
  return Object.fromEntries(Object.entries({ ...marca, Edição: edicao })
    .filter(([, valor]) => typeof valor === "string" ? Boolean(valor.trim()) : Number.isFinite(valor))
    .map(([rotulo, valor]) => [rotulo, String(valor).slice(0, 50)]));
}

export function nomeDoArquivo(titulo) {
  return titulo.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 75) || "fichafm-comunidade";
}

export function baixarCss(nome, css) {
  const url = URL.createObjectURL(new Blob([css], { type: "text/css;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
