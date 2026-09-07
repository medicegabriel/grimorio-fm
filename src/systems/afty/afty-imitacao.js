import { AFTY_HABILIDADES, ESTILOS_DE_COMBATE, POSTURAS_DE_COMBATE } from "./afty-habilidades";

// Estado de mesa, guardado em sessao.combate.imitacao. Nunca compra uma classe.
export function catalogoImitacao(tipo) {
  if (tipo === "estilo") return ESTILOS_DE_COMBATE;
  if (tipo === "postura") return POSTURAS_DE_COMBATE;
  return AFTY_HABILIDADES.filter((h) => ["combatente", "lutador"].includes(h.especializacaoId)
    && h.tipo === "nivel");
}

export function resolveImitacao(creature, habilidades = []) {
  const ids = new Set(habilidades);
  const disponivel = ids.has("res_imitacao");
  const perfeita = ids.has("res_imitacao_perfeita");
  const estado = creature?.combate?.imitacao ?? {};
  const copia = estado.copia;
  const def = copia && catalogoImitacao(copia.tipo).find((h) => h.id === copia.id);
  const permitida = disponivel && def && ["ativa", "passiva", "estilo", "postura"].includes(copia.tipo)
    && (perfeita || !["passiva", "estilo"].includes(copia.tipo));
  return {
    disponivel, perfeita,
    copia: permitida && creature?.combate?.ativo ? { ...copia, nome: def.nome } : null,
    def: permitida ? def : null,
    jaPossui: !!copia && (ids.has(copia.id) || Object.values(creature?.escolhasHabilidade ?? {}).some((lista) => Array.isArray(lista) && lista.includes(copia.id))),
    memorizacao: ids.has("res_tecnicas_de_memorizacao") ? (perfeita ? 2 : 1) : 0,
  };
}

export const valorPosturaImitada = (id) => String(id).replace(/^cmb_postura_d[aeo]s?_/, "").replace(/^cmb_postura_/, "");

// Tanto a cópia vista quanto a aprendida usam a mesma transição. Trocar uma
// postura copiada por outra categoria também encerra a postura anterior.
export function trocarCopiaImitacao(combate, copia) {
  const estado = combate?.imitacao ?? {};
  const posturaAnterior = estado.copia?.tipo === "postura"
    && combate?.postura === valorPosturaImitada(estado.copia.id);
  return {
    imitacao: { ...estado, copia, aviso: null },
    ...(copia?.tipo === "postura" ? { postura: valorPosturaImitada(copia.id) }
      : posturaAnterior ? { postura: "" } : {}),
  };
}

export function cdAprenderImitacao(estado, copia) {
  if (!copia) return null;
  const tentativas = Math.max(0, Number(estado?.tentativas?.[copia.id]) || 0);
  return (["passiva", "estilo"].includes(copia.tipo) ? 40 : 35) - 2 * tentativas;
}

export function tentarAprenderImitacao(estado, resultado, regra) {
  const copia = estado?.copia;
  if (!copia || !Number.isFinite(resultado) || !regra?.disponivel) return estado;
  const aprendidas = Array.isArray(estado.aprendidas) ? estado.aprendidas : [];
  const contagem = {};
  for (const c of [...aprendidas, copia]) contagem[c.tipo] = (contagem[c.tipo] ?? 0) + 1;
  const extras = Object.values(contagem).reduce((n, v) => n + Math.max(0, v - 1), 0);
  const cabe = extras <= regra.memorizacao;
  const sucesso = resultado >= cdAprenderImitacao(estado, copia);
  const jaAprendida = aprendidas.some((c) => c.id === copia.id);
  return { ...estado,
    tentativas: { ...estado.tentativas, [copia.id]: (Number(estado.tentativas?.[copia.id]) || 0) + 1 },
    aprendidas: sucesso && cabe && !jaAprendida ? [...aprendidas, { ...copia }] : aprendidas,
    aviso: sucesso && !cabe && !jaAprendida ? "Limite de habilidades aprendidas" : sucesso ? "Aprendida" : "Falhou",
  };
}

export function concessaoImitada(imitacao) {
  const c = imitacao.copia;
  if (!c) return [];
  const dona = c.tipo === "estilo" ? "cmb_repertorio_do_especialista"
    : c.tipo === "postura" ? "cmb_assumir_postura" : c.id;
  return [{ uid: "imitacao", familia: "habilidades", id: dona,
    escolhas: dona === c.id ? [] : [c.id] }];
}

// O nível do PERSONAGEM vale somente nas expressões da cópia. Não cria
// níveis na classe nem altera os efeitos das habilidades adquiridas nela.
export function efeitoDaImitacao(efeito, imitacao, nd) {
  if (!imitacao.copia || imitacao.jaPossui || efeito.origem !== imitacao.copia.id) return efeito;
  return { ...efeito, duracao: "temporaria", contextoDsl: {
    ...efeito.contextoDsl, esc_combatente: nd, esc_lutador: nd, esc_restringido: nd,
  } };
}
