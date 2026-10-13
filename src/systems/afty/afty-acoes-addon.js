// Ações declaradas pelo pacote. Números seguem os canais do Motor.
// Estado de sessão fica em combate e não modifica o catálogo nem a ficha base.
const lista = (v) => Array.isArray(v) ? v : [];
const inteiro = (v) => Math.max(0, Math.trunc(Number(v) || 0));

export function acoesDoAddon(creature) {
  if (!["afty", "player"].includes(creature?.rulesVersion)) return [];
  return lista(creature.addons).flatMap((p) => lista(p.acoesMotor).map((a) => {
    const estado = `acaoAddon:${p.id}:${a.id}`;
    const valor = creature.combate?.ativo
      ? Math.min(inteiro(creature.combate?.[estado]), a.tipo === "contador" ? inteiro(a.max) : 1) : 0;
    return { ...a, estado, valor, nome: a.nome || a.id };
  }));
}

export function efeitosDasAcoesAddon(creature) {
  return acoesDoAddon(creature).flatMap((a) => {
    if (a.tipo !== "passivo" && !a.valor) return [];
    return lista(a.efeitos).map((e) => ({
      ...e, expr: String(e.expr).replace(/\bcargas\b/g, String(a.valor)),
      origem: a.estado, nome: a.nome,
    }));
  });
}

export function dadosDasAcoesAddon(creature, entrada) {
  const ativas = acoesDoAddon(creature).filter((a) => a.valor && a.tipo === "disparo"
    && a.armaId === entrada.id);
  return {
    ...entrada,
    consomeAcoesAddon: ativas.map((a) => a.estado),
    danoAuxiliar: [...lista(entrada.danoAuxiliar), ...ativas.flatMap((a) => lista(a.dados).map((d) => ({
      ...d, nome: `${a.nome} (${d.momento})`, multiplica: d.momento !== "apos",
    })))],
  };
}

export function definirAcaoAddon(sessao, acao, valor) {
  const n = Math.min(inteiro(valor), acao.tipo === "contador" ? inteiro(acao.max) : 1);
  return { ...sessao, combate: { ...sessao.combate, [acao.estado]: n } };
}

export function consumirAcoesAddon(sessao, estados) {
  const combate = { ...sessao.combate };
  for (const id of lista(estados)) if (String(id).startsWith("acaoAddon:")) combate[id] = 0;
  return { ...sessao, combate };
}

export function encerrarAcoesAddon(sessao) {
  return consumirAcoesAddon(sessao, Object.keys(sessao.combate ?? {}));
}
