// Primitiva de arma com transformação e reserva de ilusões. Conteúdo no addon.
const inteiro = (v) => Math.max(0, Math.trunc(Number(v) || 0));
export const chaveForma = (id) => `forma:${id}`;
export function estadoForma(combate, id) {
  const s = combate?.[chaveForma(id)] ?? {};
  return { reunida: !!s.reunida, clones: inteiro(s.clones), reserva: inteiro(s.reserva),
    residuo: inteiro(s.residuo), usos: inteiro(s.usos), dividida: s.dividida ?? -1 };
}
export function formaDaArma(def, creature) {
  if (!def?.formas?.reunida || !creature) return def;
  if (def.addonId && !creature.addons?.some((p) => p.id === def.addonId)) return def;
  const ativa = estadoForma(creature.combate, def.id).reunida;
  return ativa ? { ...def, ...def.formas.reunida, id: def.id } : def;
}
export function armasTransformaveis(creature, catalogo, bt) {
  return (creature?.equipamentos?.itens ?? []).filter((e) => e.tipo === "arma" && e.equipado)
    .flatMap((e) => {
      const def = catalogo.find((a) => a.id === e.refId);
      if (!def?.formas?.reunida || !def?.ilusoes) return [];
      if (def.addonId && !creature.addons?.some((p) => p.id === def.addonId)) return [];
      return [{ id: def.id, nome: def.nome, titulo: def.titulo, descricao: def.descricao, bt,
        ...estadoForma(creature.combate, def.id) }];
    }).filter((e, i, a) => a.findIndex((x) => x.id === e.id) === i);
}
export function efeitosArmasTransformaveis(armas) {
  return armas.flatMap((a) => !a.reunida ? [] : [
    { canal: "defesa", expr: String(2 * a.clones) },
    { canal: "bonusTR", alvo: "reflexos", expr: String(2 * a.clones) },
    { canal: "dadosDano", alvo: a.id, expr: String(Math.floor(a.reserva / 2)) },
    { canal: "ignoraTodaRD", alvo: a.id, expr: "1" },
    { canal: "ignoraImunidade", alvo: a.id, expr: "1" },
    { canal: "removeResistencia", alvo: a.id, expr: "1" },
  ].map((e) => ({ ...e, origem: a.id, nome: a.nome, fonte: "item" })));
}
export function alteraArmaTransformavel(sessao, arma, evento, pagarPe) {
  const atual = estadoForma(sessao.combate, arma.id);
  const proximo = { ...atual };
  let custo = 0;
  if (evento === "reunir") {
    if (atual.reunida || atual.dividida === sessao.rodada) return sessao;
    custo = atual.usos ? inteiro(arma.bt) : 0;
    const temporario = Object.values(sessao.peTempFontes ?? {}).reduce((n, v) => n + inteiro(v), 0);
    if (inteiro(sessao.peAtual) + temporario < custo) return sessao;
    Object.assign(proximo, { reunida: true, clones: inteiro(arma.bt), usos: atual.usos + 1 });
  } else if (evento === "dividir") {
    if (!atual.reunida) return sessao;
    Object.assign(proximo, { reunida: false, dividida: sessao.rodada });
  } else if (evento === "acerto") {
    if (!atual.reunida) return sessao;
    proximo.reserva = atual.reserva % 2;
    proximo.residuo = proximo.reserva;
  } else if (["golpe", "todos", "livre"].includes(evento)) {
    if (!atual.reunida) return sessao;
    const n = evento === "todos" ? atual.clones : Math.min(1, atual.clones);
    proximo.clones -= n;
    proximo.reserva += n;
  } else return sessao;
  return { ...(custo ? pagarPe(sessao, custo) : sessao),
    combate: { ...sessao.combate, [chaveForma(arma.id)]: proximo } };
}
export function avancaArmasTransformaveis(sessao, reiniciar = false) {
  const combate = { ...sessao.combate };
  for (const k of Object.keys(combate).filter((x) => x.startsWith("forma:"))) {
    if (reiniciar) delete combate[k];
    else {
      const s = combate[k];
      combate[k] = { ...s, reserva: Math.max(0, inteiro(s.reserva) - inteiro(s.residuo)), residuo: 0 };
    }
  }
  return { ...sessao, combate };
}
