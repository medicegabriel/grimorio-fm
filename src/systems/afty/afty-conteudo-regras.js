// Livro p.308. FOLHA: conteúdo e concessões, sem outro resolvedor de combate.
export const CRITICOS_DE_GRUPO = {
  arco: { condicao: "Imóvel", superficie: true },
  bastao: { deslocamento: 3 },
  besta: { sangramento: 8 },
  chicote: { tr: "reflexos", condicao: "Caído" },
  dardo: { sangramento: 6 },
  espada: { sangramento: 8 },
  faca: { sangramento: 6 },
  haste: { deslocamento: 3 },
  machado: { secundario: true },
  martelo: { tr: "fortitude", condicao: "Caído" },
  pugilato: { tr: "fortitude", condicao: "Desorientado", rodadas: 1 },
  tiro: { tr: "fortitude", condicao: "Lento", rodadas: 1 },
};

export function criticoConcedido(creature, habilidades, linha, { bt = 2, cd = 10 } = {}) {
  const grupo = linha.grupo ?? (linha.fonte === "basico" ? "pugilato" : null);
  const regra = CRITICOS_DE_GRUPO[grupo];
  if (!regra) return null;
  const fontes = [];
  const mestre = creature?.talentosConfig?.tal_mestre_das_armas;
  if (creature?.talentos?.includes("tal_mestre_das_armas") && mestre?.modo === "grupo" && mestre.grupo === grupo) fontes.push("Mestre das Armas");
  const escolhas = habilidades?.escolhas?.mapa ?? {};
  for (const [pai, ids] of Object.entries(escolhas)) {
    if (!(habilidades?.efetivas ?? []).includes(pai)) continue;
    if ((ids ?? []).some((id) => id.replace(/^.*__/, "") === `cmb_favorito_${grupo}`)) fontes.push("Grupo Favorito");
  }
  const manejo = creature?.treinamentos?.manejo_arma;
  if (Array.isArray(manejo) && manejo.some((t) => t.alvo === linha.id && t.progresso >= 3)) fontes.push("Treino de Manejo de Arma");
  if (grupo === "pugilato" && Number(creature?.treinamentos?.luta) >= 4) fontes.push("Treino de Luta");
  if (!fontes.length) return null;
  return { ...regra, grupo, fontes: [...new Set(fontes)], cd,
    ...(regra.sangramento ? { dados: Math.max(1, Math.floor(bt / 2)), faces: regra.sangramento } : {}) };
}
