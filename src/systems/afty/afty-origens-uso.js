// Livro p.30 a 36, 145, 169 e 170. Dados de conteúdo, sem estado paralelo.
export function resumoUsoOrigens({ caracteristicas = [], anatomias = [], talentos = [], nd = 1, bt = 2, modCon = 0, cd = 10, feto = false } = {}) {
  const caracteristica = (id) => caracteristicas.find((c) => c.id === id || c.id === `vo_${id}`);
  const usos = (id, max, manual = false) => ({ max, recarga: manual ? "manual" : "longo",
    chave: `${manual ? "manual:" : ""}origem:${caracteristica(id)?.id ?? id}` });
  const quantidadeVigor = 1 + [4, 8, 12].filter((n) => nd >= n).length;
  const reposicao = talentos.includes("tal_reposicao_sanguinea") && nd >= 6;
  const reserva = talentos.includes("tal_expansao_de_reserva") && nd >= 8;
  const vigor = caracteristica("vigor_maldito");
  const energia = caracteristica("energia_antinatural");
  const resiliencia = caracteristica("resiliencia_imediata");
  const inumaki = caracteristica("olhos_de_cobra_e_presas");
  return {
    anatomias,
    heranca: !!caracteristica("heranca_maldita"),
    bonusVeneno: feto ? 2 : 0,
    vantagemVeneno: !!caracteristica("fisico_abencoado"),
    imuneDoencas: !!caracteristica("fisico_abencoado"),
    vigor: vigor ? { id: vigor.id, nome: vigor.nome, texto: vigor.descricao,
      cura: Math.max(0, 5 * quantidadeVigor + modCon + (reposicao ? 5 : 0)),
      partes: [{ label: "Vigor Maldito", valor: 5 * quantidadeVigor }, { label: "Constituição", valor: modCon },
        ...(reposicao ? [{ label: "Reposição Sanguínea", valor: 5 }] : [])],
      usos: usos("vigor_maldito", quantidadeVigor), reacao: reposicao } : null,
    energia: energia ? { id: energia.id, nome: energia.nome, texto: energia.descricao, pe: 2 * bt,
      partes: [{ label: "Energia Antinatural", valor: 2 * bt }],
      partesTemporario: reserva ? [{ label: "Expansão de Reserva", valor: Math.floor(bt / 2) }] : [],
      temporario: reserva ? Math.floor(bt / 2) : 0, acao: reserva ? "livre" : "bonus",
      usos: usos("energia_antinatural", 1, !reserva), reserva } : null,
    resiliencia: resiliencia ? { id: resiliencia.id, nome: resiliencia.nome, texto: resiliencia.descricao,
      reducao: Math.max(1, Math.floor(nd / 2)) * 5, usos: usos("resiliencia_imediata", bt) } : null,
    inumaki: inumaki ? { id: inumaki.id, nome: inumaki.nome, texto: inumaki.descricao,
      usos: usos("olhos_de_cobra_e_presas", bt) } : null,
    alma: anatomias.includes("alma_maldita") ? {
      anula: nd >= 15, usos: { max: 2 + [6, 12, 18].filter((n) => nd >= n).length,
        recarga: "manual", chave: "manual:anatomia:alma_maldita" },
    } : null,
    chanceIncompreensivel: anatomias.includes("anatomia_incompreensivel") ? (nd >= 15 ? 2 : 1) : 0,
    sangueToxico: anatomias.includes("sangue_toxico") ? Math.max(0, modCon) : 0,
    presenca: anatomias.includes("presenca_nefasta") ? { cd } : null,
    visaoNoEscuro: anatomias.includes("olhos_sombrios"),
    ignoraEscuridao: anatomias.includes("olhos_sombrios") && nd >= 12,
    ignoraTerrenoSolo: anatomias.includes("pernas_extras"),
  };
}
