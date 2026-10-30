import { AFTY_HABILIDADES, ESTILOS_DE_COMBATE, POSTURAS_DE_COMBATE, MANOBRAS_DE_EMPOLGACAO, getHabilidade, resolveEscolhasHabilidade } from "./afty-habilidades";

export function definicaoImitada(copia) {
  if (!copia?.id) return null;
  const def = catalogoImitacao(copia.tipo).find((h) => h.id === copia.id);
  if (!def) return null;
  if (def.id === "cmb_mestre_da_postura") return { ...def, escolha: {
    id: "posturas_imitadas", label: "Posturas", niveis: [0, 0], opcoes: POSTURAS_DE_COMBATE,
  } };
  const escolha = def.escolha ?? getHabilidade(def.concedeEscolha?.habilidade)?.escolha;
  if (escolha) {
    const niveis = def.escolha ? escolha.niveis : def.concedeEscolha.niveis;
    const primeiro = Math.min(...(niveis ?? [0]));
    return { ...def, escolha: { ...escolha,
      niveis: (niveis ?? [0]).map((n) => n === primeiro ? 0 : n),
    } };
  }
  return getHabilidade(def.id) ?? { ...def, especializacaoId: copia.tipo === "manobra" ? "lutador" : "combatente", nivel: 0 };
}

// Estado de mesa, guardado em sessao.combate.imitacao. Nunca compra uma classe.
export function catalogoImitacao(tipo) {
  if (tipo === "estilo") return ESTILOS_DE_COMBATE;
  if (tipo === "postura") return POSTURAS_DE_COMBATE;
  if (tipo === "manobra") return MANOBRAS_DE_EMPOLGACAO;
  return AFTY_HABILIDADES.filter((h) => ["combatente", "lutador"].includes(h.especializacaoId)
    && h.tipo === "nivel");
}

export function idsPossuidosNaImitacao(derived, aprendidas = []) {
  return new Set([
    ...(derived?.habilidades?.efetivas ?? []), ...(derived?.habilidades?.canonicas ?? []),
    ...Object.values(derived?.habilidades?.escolhas?.mapa ?? {}).flat(),
    ...Object.values(derived?.talentos?.escolhas?.mapa ?? {}).flat(),
    ...aprendidas.map((c) => c.id),
  ]);
}

export function resolveImitacao(creature, habilidades = [], { nd = 1, bt = 0, copiaParaConfigurar = null } = {}) {
  const ids = new Set(habilidades);
  const disponivel = ids.has("res_imitacao");
  const perfeita = ids.has("res_imitacao_perfeita");
  const estado = creature?.combate?.imitacao ?? {};
  const configurar = (c) => ({ ...c, escolhas: c.escolhas ?? creature?.escolhasHabilidade?.[c.id] ?? [] });
  const aprendidas = (Array.isArray(estado.aprendidas) ? estado.aprendidas : (Array.isArray(creature?.imitacaoAprendidas) ? creature.imitacaoAprendidas : []))
    .filter((c) => definicaoImitada(c)).map(configurar);
  const copia = estado.copia && { ...estado.copia,
    escolhas: estado.copia.escolhas ?? aprendidas.find((c) => c.id === estado.copia.id)?.escolhas
      ?? creature?.escolhasHabilidade?.[estado.copia.id] ?? [],
  };
  const def = copia && definicaoImitada(copia);
  const permitida = disponivel && def && ["ativa", "passiva", "estilo", "postura", "manobra"].includes(copia.tipo)
    && (perfeita || !["passiva", "estilo"].includes(copia.tipo));
  const configuraveis = [...new Map([...aprendidas, ...(copiaParaConfigurar ? [{ ...copiaParaConfigurar, escolhas: creature?.escolhasHabilidade?.[copiaParaConfigurar.id] ?? copiaParaConfigurar.escolhas ?? [] }] : []),
    ...(permitida && copia ? [configurar(copia)] : [])].map((c) => [c.id, c])).values()];
  const definicoes = configuraveis.map(definicaoImitada).filter(Boolean);
  const escolhasPorHabilidade = Object.fromEntries(definicoes.filter((h) => h.escolha).map((h) => [h.id, h.escolha]));
  const escolhas = resolveEscolhasHabilidade({ escolhidasIds: definicoes.map((h) => h.id),
    nivelPorHabilidade: Object.fromEntries(definicoes.map((h) => [h.id, nd])), bt,
    escolhasHabilidade: Object.fromEntries(configuraveis.map((c) => [c.id, c.escolhas ?? []])), escolhasPorHabilidade });
  return {
    disponivel, perfeita,
    aprendidas, configuraveis: disponivel ? configuraveis : [], definicoes, escolhas, escolhasPorHabilidade,
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
    imitacao: { ...estado, copia, esperandoTurno: !!copia, aviso: null },
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
  for (const c of [...aprendidas, copia]) {
    const grupo = c.tipo === "manobra" ? "postura" : c.tipo;
    contagem[grupo] = (contagem[grupo] ?? 0) + 1;
  }
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
    : c.tipo === "manobra" ? "lut_empolgacao"
    : c.tipo === "postura" ? "cmb_assumir_postura" : c.id;
  return [{ uid: "imitacao", familia: "habilidades", id: dona,
    escolhas: dona === c.id ? (c.escolhas ?? []) : [c.id] }];
}

// O nível do PERSONAGEM vale somente nas expressões da cópia. Não cria
// níveis na classe nem altera os efeitos das habilidades adquiridas nela.
export function efeitoDaImitacao(efeito, imitacao, nd) {
  if (!imitacao.copia || imitacao.jaPossui || (efeito.origem !== imitacao.copia.id
    && !(imitacao.copia.escolhas ?? []).includes(efeito.origem))) return efeito;
  return { ...efeito, duracao: "temporaria", contextoDsl: {
    ...efeito.contextoDsl, esc_combatente: nd, esc_lutador: nd, esc_restringido: nd,
  } };
}
