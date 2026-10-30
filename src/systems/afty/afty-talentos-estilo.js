// As variantes são dados dos addons. A ficha guarda somente suas escolhas.
export function habilidadesDasOpcoesTalento(talentos, getTalento) {
  const ids = [];
  for (const [talentoId, escolhidas] of Object.entries(talentos?.escolhas?.mapa ?? {})) {
    const opcoes = getTalento(talentoId)?.escolha?.opcoes ?? [];
    for (const id of escolhidas) {
      const habilidadeId = opcoes.find((o) => o.id === id)?.habilidadeId;
      if (habilidadeId && !ids.includes(habilidadeId)) ids.push(habilidadeId);
    }
  }
  return ids;
}

export function inovacoesDasOpcoesTalento(talentos, habilidades, getTalento, expandeHerdadas) {
  const porOrigem = {};
  for (const [talentoId, escolhidas] of Object.entries(talentos?.escolhas?.mapa ?? {})) {
    const talento = getTalento(talentoId);
    for (const id of escolhidas) {
      const opcao = talento?.escolha?.opcoes?.find((o) => o.id === id);
      if (!opcao?.trocaAtributo || !opcao.requerHabilidade) continue;
      for (const habilidadeId of habilidades?.efetivas ?? []) {
        if (!expandeHerdadas([habilidadeId]).includes(opcao.requerHabilidade)) continue;
        (porOrigem[habilidadeId] ??= []).push({
          ...opcao.trocaAtributo, nome: `${talento.nome} (${opcao.nome})`,
        });
      }
    }
  }
  return porOrigem;
}

// Troca identificadores inteiros da DSL, preservando textos como contar("forca").
export function inovarEfeitoDeHabilidade(efeito, inovacoes = []) {
  let atual = efeito;
  for (const { de, para, nome } of inovacoes) {
    if (de === para) continue;
    const trocar = (texto) => typeof texto !== "string" ? texto : texto.replace(
      /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b[a-zA-Z_][a-zA-Z0-9_]*\b/g,
      (token) => token === de ? para : token === `mod_${de}` ? `mod_${para}` : token,
    );
    const expr = trocar(atual.expr);
    const quando = trocar(atual.quando);
    if (expr !== atual.expr || quando !== atual.quando) {
      atual = { ...atual, expr, ...(quando != null ? { quando } : {}), nome: `${atual.nome} (${nome})` };
    }
  }
  return atual;
}
