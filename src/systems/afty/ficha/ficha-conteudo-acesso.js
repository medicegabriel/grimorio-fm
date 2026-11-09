// O derive já avaliou no catálogo e nos atributos permanentes desta ficha.

export function aptidaoDeConteudoDisponivel(derived, id) {
  return derived.aptidao?.disponiveisConteudo?.includes(id) ?? false;
}

/** Clientes sem ação base também respeitam a incapacidade vital de CL2. */
export function impedimentoParaAgirConteudo(sessao) {
  if (sessao.vital?.estado === "morto") return "Corpo Morto Não Age";
  if (sessao.vital?.estado === "morrendo" && sessao.especializacaoSessao?.modoMorte !== "mesmo_morto") return "Morrendo Impede Ações";
  return null;
}

/** A proteção de Mobilidade é contra um participante específico. */
export function bloqueioDeOportunidadeConteudo(sessaoAlvo, atacanteId) {
  if (Object.values(sessaoAlvo?.uso?.ativos ?? {}).some((a) => ["lut_acao_agil", "res_acao_agil", "cmb_postura_da_lua"].includes(a.origem?.replace(/^.*__/, ""))
    && a.parametros?.comando === "desengajar")) return "Desengajar Impede esta Oportunidade";
  const ativas = Object.values(sessaoAlvo?.uso?.ativos ?? {}).filter((a) => a.origem === "tal_tecnicas_de_mobilidade");
  if (!ativas.length) return null;
  if (!atacanteId) return "Falta a Identidade do Atacante";
  return ativas.some((a) => a.id === `tal_tecnicas_de_mobilidade:${atacanteId}`) ? "Técnicas de Mobilidade Impede esta Oportunidade" : null;
}

// Esses clientes nativos rolam e já resolvem a consequência na mesma chamada.
// Rerrolar o histórico não desfaz nem recalcula Vida, Alma ou concentração.
export function testeComConsequencias(rolagem) {
  return !!rolagem?.consequenciasAplicadas || ["Teste de Morte", "Ferida Interna", "Concentração", "Rejeitar a Morte", "Mesmo Morto"].includes(rolagem?.rotulo)
    || rolagem?.detalhe === "Dano na Alma";
}
