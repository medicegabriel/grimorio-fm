/**
 * ============================================================
 * OS ITENS NA MESA (CX5, 2026-11-06)
 * ============================================================
 * Usar, gastar e criar item. O catálogo e a descrição de cada item continuam em
 * `afty-equipamentos.js`, a tabela do que cada um FAZ ao ser usado está em
 * `afty-itens-uso.js`, e o estado fica em `sessao.uso.itens` (`ficha-uso-estado.js`).
 * Este módulo é só a operação, e cada efeito é delegado a um verbo que já existia:
 * cura (`aplicaCura`), Dados de Vida (`gastaDadosDeVida`, o contrato que CL2 deixou para
 * os Remédios e o Elixir), Buff de Mesa e duração (`usa`, de CL1), próximo ataque
 * (`armaProximoAtaque`) e paredes (`ficha-barreiras-estado.js`, de CL3).
 *
 * ------------------------------------------------------------
 * COMO A FICHA E A SESSÃO SE DIVIDEM
 * ------------------------------------------------------------
 * A ficha (`creature.equipamentos.itens`) guarda o que foi COMPRADO ou criado, com `qtd`.
 * A sessão guarda o que já se GASTOU: `sessao.uso.itens.consumidos[uid]`. A quantidade que
 * resta é `qtd - consumidos`, e o campo ausente lê zero, então ficha, sessão e Encontro
 * gravados antes continuam como estavam. A Ficha nunca escreve na criatura.
 *
 * Quem deriva uma ficha de jogo passa antes por `fichaComItensDaSessao(ficha, sessao)`:
 * ela abate o consumido e anexa o que um Feitiço criou. Por isso Carga, PV máximo e RD do
 * item continuam saindo do `resolveEquipamentos` sem uma linha nova no derive.
 *
 * ------------------------------------------------------------
 * IDENTIDADE E ATOMICIDADE
 * ------------------------------------------------------------
 * Toda operação que escreve exige `pedido.opId`, uma por clique. Repetir o id devolve
 * `repetida: true` e a MESMA sessão: a unidade não é gasta duas vezes e o efeito não é
 * aplicado duas vezes. Qualquer recusa devolve a sessão de antes, sem unidade gasta.
 * Os verbos delegados recebem ids derivados (`<opId>:dv`, `<opId>:arma`) para não colidir
 * no anel de operações.
 *
 * ⚠ DUAS CÓPIAS DO MESMO ITEM NÃO SOMAM (p.365). O uso ativo leva o id do ITEM
 * (`item:<id do catálogo>`), e não o da entrada: o segundo Mix, Óleo ou Mistura Profana
 * enquanto o primeiro vale recusa `Já Ativo` e a unidade fica no inventário.
 *
 * ⚠ PE E ESTAMINA SÃO O MESMO RECURSO (autor, 2026-07-29). A Pérola e o Mix sobem o `peAtual`
 * até o máximo, e a casca de PE temporário não entra na conta.
 *
 * ⚠ O PV TEMPORÁRIO do Símbolo de Vida Absoluta entra pela fonte do item (a mesma fonte
 * topa, não soma). O teto de metade do máximo e a substituição entre fontes (p.366) são de
 * CX4, que não tem entrega: quando chegar, este é um cliente dele.
 * ============================================================
 */
import { aplicaCura, aparaSessao } from "./ficha-sessao";
import { usa, avaliaUso } from "./ficha-uso";
import { usoDe, comUso, jaAplicada, encerraAtivoNaSessao } from "./ficha-uso-estado";
import { gastaDadosDeVida } from "./ficha-dados-vida";
import { comBarreiras, TETO_PAREDES } from "./ficha-barreiras-estado";
import { armaProximoAtaque } from "./ficha-combate-eventos";
import { getEquipamento } from "../afty-equipamentos";
import { USO_DE_ITEM, cdDoVeneno } from "../afty-itens-uso";

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};
const lista = (v) => (Array.isArray(v) ? v : []);

const recusa = (sessao, erro, codigo, extra = {}) => ({ sessao, aplicado: false, erro, codigo, ...extra });
const semIdentidade = (sessao) => recusa(sessao, "Sem Identidade da Operação", "sem-opid");

/** O estado de itens da sessão (nunca nulo). */
export const itensDaSessao = (sessao) => usoDe(sessao).itens;

/* ============================================================ */
/* QUANTIDADE E ADAPTADOR                                        */
/* ============================================================ */
const entradasDaFicha = (ficha) => lista(ficha?.equipamentos?.itens).filter((e) => e && typeof e === "object");

/** Quantas unidades da entrada ainda existem na mesa. Item criado por Feitiço vale 1 enquanto existir. */
export function unidadesRestantes(ficha, sessao, uid) {
  const itens = itensDaSessao(sessao);
  if (itens.criados.some((c) => c.uid === uid)) return 1;
  const entrada = entradasDaFicha(ficha).find((e) => e.uid === uid);
  if (!entrada) return 0;
  return Math.max(0, inteiro(entrada.qtd, 1) - (itens.consumidos[uid] ?? 0));
}

/**
 * A ficha que a mesa enxerga: a quantidade já abatida do que foi consumido e os itens criados por Feitiço anexados.
 * Sem nada gasto nem criado devolve a PRÓPRIA ficha (mesma identidade), então um `useMemo` não recalcula à toa.
 * O adaptador não grava nada: é função pura de ficha e sessão.
 */
export function fichaComItensDaSessao(ficha, sessao) {
  const itens = itensDaSessao(sessao);
  const consumiu = Object.keys(itens.consumidos).length > 0;
  if (!consumiu && !itens.criados.length) return ficha;
  const base = entradasDaFicha(ficha)
    .map((e) => {
      const gasto = itens.consumidos[e.uid] ?? 0;
      return gasto > 0 ? { ...e, qtd: inteiro(e.qtd, 1) - gasto } : e;
    })
    .filter((e) => inteiro(e.qtd, 1) > 0);
  const criados = itens.criados.map((c) => ({
    uid: c.uid, tipo: c.tipo, refId: c.refId, qtd: 1, equipado: c.equipado,
    criadoPorFeitico: c.feitico || true,
    ...(c.grauBonus > 0 ? { fa: { grau: GRAU_POR_BONUS[Math.min(c.grauBonus, 5)] } } : {}),
  }));
  return { ...ficha, equipamentos: { ...(ficha?.equipamentos ?? {}), itens: [...base, ...criados] } };
}

/** O grau de equipamento que +N de Grau do Feitiço de Criação concede, na ordem da tabela de graus (p.154). */
const GRAU_POR_BONUS = { 1: "quarto", 2: "terceiro", 3: "segundo", 4: "primeiro", 5: "especial" };

/* ============================================================ */
/* ACHAR O ITEM                                                  */
/* ============================================================ */
function acheiItem(ficha, sessao, uid) {
  const itens = itensDaSessao(sessao);
  const criado = itens.criados.find((c) => c.uid === uid);
  const entrada = criado
    ? { uid: criado.uid, tipo: criado.tipo, refId: criado.refId, qtd: 1, equipado: criado.equipado }
    : entradasDaFicha(ficha).find((e) => e.uid === uid);
  if (!entrada) return null;
  const def = getEquipamento(entrada.tipo, entrada.refId, ficha);
  if (!def) return null;
  return { entrada, def, criado: criado ?? null };
}

/* ============================================================ */
/* USAR O ITEM                                                   */
/* ============================================================ */
const acaoDoUso = (uso, pedido) => {
  if (!Array.isArray(uso.acao)) return uso.acao ?? null;
  return uso.acao.includes(pedido?.acao) ? pedido.acao : uso.acao[0];
};

const descritorDoItem = (def, entrada, uso, pedido, valores = {}) => ({
  id: `item:${def.id}`,
  nome: def.nome,
  origem: `item:${entrada.uid}`,
  ...(uso.parametros ? { parametros: uso.parametros } : {}),
  ...(acaoDoUso(uso, pedido) ? { acao: acaoDoUso(uso, pedido) } : {}),
  ...(uso.diario ? { usos: { chave: `item:${entrada.uid}:dia`, max: 1 } } : {}),
  ...(uso.duracao ? { duracao: uso.duracao } : {}),
  ...(uso.aplicaEmArma?.ate && !uso.duracao ? { duracao: { ate: uso.aplicaEmArma.ate === "acerto" ? "cena" : uso.aplicaEmArma.ate } } : {}),
  cobranca: "manual",
  efeitos: lista(uso.buffs).map((b) => ({
    tipo: "buff", canal: b.canal, expr: b.expr, nome: b.nome ?? def.nome,
    ...(b.alvo ? { alvo: typeof b.alvo === "string" ? b.alvo : `${b.alvo.prefixo ?? ""}${valores[b.alvo.parametro]}` } : {}),
  })),
});

const condicaoEhVeneno = (c) => (typeof c === "string" ? c : c?.nome) === "Envenenado";

/**
 * Usa UM item do inventário: confere acesso, ação e unidade, aplica o efeito delegando ao verbo certo, registra a duração e
 * baixa a unidade, tudo numa operação só e sob um `opId`.
 *
 *   pedido { uid, opId, acao?, registraAcao?, rng?, parametros?: {...} }
 *     parametros por item: Remédio `{ classeId, quantidade }`, Injeção Estimulante `{ atributo }`, Antídoto `{ custoDoVeneno? }`,
 *     Óleo e Veneno `{ armas: [uid, ...] }`.
 *
 * Retorno: `{ sessao, aplicado, repetida?, erro?, codigo?, resultado?, restantes?, ativoId?, custo? }`. `resultado` leva o que
 * mudou (pe, cura, dadosDeVida, pvTemporario, paredes, antidoto, exaustao, armas, veneno e os `lembretes` da regra que a ficha
 * não resolve), para a tela mostrar sem recalcular.
 */
export function usaItem(ficha, sessao, derived, pedido = {}) {
  const opId = pedido?.opId;
  if (typeof opId !== "string" || !opId) return semIdentidade(sessao);
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };

  const achado = acheiItem(ficha, sessao, pedido.uid);
  if (!achado) return recusa(sessao, "Item Não Encontrado", "item-ausente");
  const { entrada, def, criado } = achado;
  const uso = USO_DE_ITEM[def.id];
  if (!uso) return recusa(sessao, "Item Sem Uso", "sem-uso");
  if (uso.especial) return recusa(sessao, "Uso Próprio do Item", "uso-proprio");
  if (uso.exigeEquipado && !entrada.equipado) return recusa(sessao, "Item Guardado", "item-guardado");
  const consome = uso.consome !== false;
  if (consome && unidadesRestantes(ficha, sessao, entrada.uid) < 1) return recusa(sessao, "Sem Unidades", "sem-unidades");

  const parametros = pedido.parametros ?? {};
  // Item de prazo manual: o buff fica até a mesa tirá-lo, e enquanto estiver lá a segunda cópia não soma (p.365).
  if (uso.manual && lista(sessao.buffs).some((b) => String(b?.id).startsWith(`item:${def.id}:`))) return recusa(sessao, "Já Ativo", "ja-ativo");
  const d0 = descritorDoItem(def, entrada, uso, pedido);
  const pedidoUso = { opId, registraAcao: !!pedido.registraAcao, parametros, ...(pedido.esperado ? { esperado: pedido.esperado } : {}) };
  const av = avaliaUso(sessao, derived, d0, pedidoUso);
  if (!av.ok) return recusa(sessao, av.motivo, av.recusas[0].codigo, { recusas: av.recusas });
  const d = descritorDoItem(def, entrada, uso, pedido, av.valores);

  let s = sessao;
  const resultado = {};
  const hpMax = Math.max(0, inteiro(derived?.hp));
  const peMax = Math.max(0, inteiro(derived?.pe));

  if (uso.pe) {
    const antes = Math.max(0, inteiro(s.peAtual));
    const depois = Math.min(Math.max(antes, peMax), antes + uso.pe);
    s = { ...s, peAtual: depois };
    resultado.pe = { pedido: uso.pe, ganho: depois - antes, ...(uso.recurso ? { recurso: uso.recurso } : {}) };
  }

  if (uso.cura) {
    const antes = s.hpAtual;
    const cura = uso.cura.total ? hpMax : inteiro(uso.cura.fixo);
    s = aplicaCura(s, cura, hpMax);
    resultado.cura = { pedido: cura, hpAntes: antes, hpDepois: s.hpAtual };
  }

  if (uso.pvTemporario) {
    const valor = Math.max(0, inteiro(uso.pvTemporario.porNivel) * Math.max(0, inteiro(derived?.nd)));
    const fonte = `item:${def.id}`;
    s = { ...s, pvTempFontes: { ...(s.pvTempFontes ?? {}), [fonte]: Math.max(inteiro(s.pvTempFontes?.[fonte]), valor) } };
    resultado.pvTemporario = { fonte, valor };
  }

  if (uso.dadosDeVida) {
    const base = uso.dadosDeVida.todos
      ? { todos: true, multiplicadorCon: uso.dadosDeVida.multiplicadorCon }
      : { classeId: parametros.classeId, quantidade: parametros.quantidade, limite: uso.dadosDeVida.limite };
    const r = gastaDadosDeVida(s, derived, {
      ...base, treinamentos: ficha?.treinamentos ?? null, ...(pedido.rng ? { rng: pedido.rng } : {}),
    }, { opId: `${opId}:dv` });
    if (!r.aplicado) return recusa(sessao, r.erro ?? "Dados de Vida Recusados", r.codigo ?? "dados-de-vida", { recusas: r.recusas });
    s = r.sessao;
    resultado.dadosDeVida = { cura: r.cura, dados: r.dados, restantes: r.restantes };
  }

  if (uso.antidoto) {
    const custoDoVeneno = parametros.custoDoVeneno == null ? null : inteiro(parametros.custoDoVeneno);
    if (custoDoVeneno != null && custoDoVeneno > uso.antidoto.custo) {
      return recusa(sessao, "Veneno Acima do Antídoto", "veneno-forte", { detalhe: { custoDoVeneno, custoDoAntidoto: uso.antidoto.custo } });
    }
    const condicoes = lista(s.condicoes);
    const todosVenenos = Object.values(usoDe(s).ativos).filter((a) => String(a.id).startsWith("veneno:"));
    const venenos = todosVenenos.filter((a) => inteiro(a.parametros?.custo) <= uso.antidoto.custo);
    // O Envenenado posto por um veneno de custo MAIOR que o do antídoto não sai (Maldito põe Envenenado até no sucesso do TR).
    const protegidas = new Set(todosVenenos.filter((a) => inteiro(a.parametros?.custo) > uso.antidoto.custo).flatMap((a) => lista(a.parametros?.condicoes)));
    const temCondicao = condicoes.some(condicaoEhVeneno) && !protegidas.has("Envenenado");
    if (!temCondicao && !venenos.length && custoDoVeneno == null) {
      return todosVenenos.length > venenos.length
        ? recusa(sessao, "Veneno Acima do Antídoto", "veneno-forte", { detalhe: { custoDoAntidoto: uso.antidoto.custo } })
        : recusa(sessao, "Nada a Curar", "nada-a-curar");
    }
    // O veneno encerrado leva embora as condições que ele pôs (Lento, Exposto), além do Envenenado. Nunca a que um veneno MAIOR também pôs.
    const nomeDe = (c) => (typeof c === "string" ? c : c?.nome);
    const removiveis = new Set([...(temCondicao ? ["Envenenado"] : []), ...venenos.flatMap((v) => lista(v.parametros?.condicoes))]
      .filter((nome) => !protegidas.has(nome)));
    s = { ...s, condicoes: condicoes.filter((c) => !removiveis.has(nomeDe(c))) };
    for (const v of venenos) s = encerraAtivoNaSessao(s, v.id, "antidoto");
    resultado.antidoto = { removeuEnvenenado: temCondicao, venenosEncerrados: venenos.map((v) => v.id) };
  }

  if (uso.paredes) {
    const barreiras = lista(s.barreiras?.paredes);
    const n = uso.paredes.quantidade;
    if (barreiras.length + n > TETO_PAREDES) return recusa(sessao, "Paredes Demais em Campo", "paredes-demais");
    const rodada = Math.max(0, inteiro(s.rodada));
    const novas = Array.from({ length: n }, (_, i) => ({
      id: `parede_${opId}_${i + 1}`, pv: uso.paredes.pv, pvMax: uso.paredes.pv, rd: 0, desde: rodada,
    }));
    s = comBarreiras(s, (x) => ({ ...x, paredes: [...x.paredes, ...novas] }));
    resultado.paredes = { ids: novas.map((p) => p.id), pv: uso.paredes.pv };
  }

  if (uso.mantemConcentracao) {
    if (!usoDe(s).teste) return recusa(sessao, "Sem Teste Pendente", "sem-teste");
    s = comUso(s, (u) => ({ ...u, teste: null }));
    resultado.concentracao = { mantida: true };
  }

  let armasEscolhidas = [];
  if (uso.aplicaEmArma) {
    armasEscolhidas = [...new Set(lista(parametros.armas))];
    if (!armasEscolhidas.length) return recusa(sessao, "Escolha a Arma", "arma-falta");
    if (armasEscolhidas.length > uso.aplicaEmArma.max) return recusa(sessao, `No Máximo ${uso.aplicaEmArma.max} Arma${uso.aplicaEmArma.max > 1 ? "s" : ""}`, "armas-demais");
    const armas = entradasDaFicha(ficha).filter((e) => e.tipo === "arma");
    if (armasEscolhidas.some((u) => !armas.some((a) => a.uid === u))) return recusa(sessao, "Arma Não Encontrada", "arma-ausente");
  }

  let exaustaoDelta = 0;
  if (uso.exaustao?.reduz) {
    const atual = Math.max(0, inteiro(s.exaustao));
    const tira = Math.min(atual, uso.exaustao.reduz);
    if (tira > 0) {
      s = { ...s, exaustao: atual - tira };
      exaustaoDelta += tira;
    }
    resultado.exaustao = { reduzida: tira, devolvidaNoFimDaCena: tira };
  }
  if (uso.exaustao?.aoFim) {
    exaustaoDelta += uso.exaustao.aoFim;
    resultado.exaustao = { ...(resultado.exaustao ?? {}), cobradaNoFimDaCena: uso.exaustao.aoFim };
  }

  const r = usa(s, derived, d, pedidoUso);
  if (!r.aplicado) return recusa(sessao, r.erro ?? "Uso Recusado", r.codigo ?? "uso", { recusas: r.recusas, custo: r.custo });
  s = r.sessao;
  // Sem uso ativo (prazo manual), o buff nasce com o id do ITEM, que é o que a guarda acima procura.
  if (uso.manual) {
    let n = 0;
    s = { ...s, buffs: lista(s.buffs).map((b) => (String(b?.id).startsWith(`uso:${opId}:`) ? { ...b, id: `item:${def.id}:${(n += 1)}` } : b)) };
  }

  // O que o contrato de uso não conhece, anotado no uso ativo: a Exaustão que volta e as armas cobertas.
  const ativoId = d.id;
  if (r.ativoId && (exaustaoDelta || armasEscolhidas.length || uso.veneno)) {
    s = comUso(s, (u) => {
      const ativo = u.ativos[ativoId];
      if (!ativo) return u;
      const veneno = uso.veneno ? { custo: uso.veneno.custo, cd: uso.veneno.cd } : {};
      return {
        ...u,
        ativos: {
          ...u.ativos,
          [ativoId]: {
            ...ativo,
            efeitos: exaustaoDelta ? [...ativo.efeitos, { tipo: "exaustao", id: "exaustao", delta: exaustaoDelta }] : ativo.efeitos,
            parametros: { ...ativo.parametros, ...(armasEscolhidas.length ? { armas: armasEscolhidas } : {}), ...(uso.aplicaEmArma?.traco ? { traco: uso.aplicaEmArma.traco } : {}), ...veneno },
          },
        },
      };
    });
  }
  if (exaustaoDelta && !r.ativoId) {
    // Sem prazo para devolver, a Exaustão que a regra cobra no fim da cena não tem como ser anotada. Isto não acontece com os dados atuais.
    return recusa(sessao, "Item Sem Prazo", "sem-prazo");
  }

  if (uso.aplicaEmArma) {
    resultado.armas = { uids: armasEscolhidas, ...(uso.aplicaEmArma.traco ? { traco: uso.aplicaEmArma.traco } : {}), ate: uso.aplicaEmArma.ate };
    if (uso.veneno) {
      const armar = armaProximoAtaque(s, {
        id: `veneno:${def.id}`, usoId: ativoId, nome: def.nome,
        elegivel: { qualquer: armasEscolhidas.map((u) => `arma:${u}`) }, consome: "acerto",
      }, { opId: `${opId}:arma` });
      if (!armar.aplicado) return recusa(sessao, armar.erro ?? "Veneno Não Armado", armar.codigo ?? "veneno-nao-armado");
      s = armar.sessao;
      resultado.veneno = { ...uso.veneno, id: def.id, nome: def.nome };
    }
  }

  if (lista(uso.lembretes).length) resultado.lembretes = [...uso.lembretes];

  if (consome) s = baixaUnidade(s, entrada.uid, criado);
  if (derived) s = aparaSessao(s, derived);
  return {
    sessao: s, aplicado: true, resultado, ativoId: r.ativoId ?? null, custo: r.custo, ...(r.acao ? { acao: r.acao } : {}),
    restantes: consome ? unidadesRestantes(ficha, s, entrada.uid) : null,
    evento: { tipo: "item", nome: def.nome, itemId: def.id },
  };
}

/** Tira UMA unidade: o consumido soma na sessão, e o item criado por Feitiço simplesmente deixa de existir. */
function baixaUnidade(sessao, uid, criado) {
  return comUso(sessao, (u) => {
    if (criado) return { ...u, itens: { ...u.itens, criados: u.itens.criados.filter((c) => c.uid !== uid) } };
    return { ...u, itens: { ...u.itens, consumidos: { ...u.itens.consumidos, [uid]: (u.itens.consumidos[uid] ?? 0) + 1 } } };
  });
}

/**
 * Por que o item não pode ser usado AGORA, ou `null`. Puro, para desabilitar o botão sem tentar a operação.
 * Cobre unidade, uso próprio e as recusas do contrato de uso (já ativo, ação, uso diário).
 */
export function bloqueioDeItem(ficha, sessao, derived, pedido = {}) {
  const achado = acheiItem(ficha, sessao, pedido.uid);
  if (!achado) return "Item Não Encontrado";
  const uso = USO_DE_ITEM[achado.def.id];
  if (!uso) return "Item Sem Uso";
  if (uso.especial) return "Uso Próprio do Item";
  if (uso.exigeEquipado && !achado.entrada.equipado) return "Item Guardado";
  if (uso.consome !== false && unidadesRestantes(ficha, sessao, achado.entrada.uid) < 1) return "Sem Unidades";
  const d = descritorDoItem(achado.def, achado.entrada, uso, pedido, pedido.parametros ?? {});
  return avaliaUso(sessao, derived, d, { opId: pedido.opId ?? "bloqueio", registraAcao: !!pedido.registraAcao, parametros: pedido.parametros ?? {} }).motivo;
}

/** O que as armas cobertas por óleo ou veneno têm agora: `{ [uidDaArma]: [traço] }`, para o cálculo de dano ler. */
export function tracosTemporariosDasArmas(sessao) {
  const out = {};
  for (const a of Object.values(usoDe(sessao).ativos)) {
    if (!String(a.origem ?? "").startsWith("item:")) continue;
    const traco = a.parametros?.traco;
    if (!traco) continue;
    for (const uid of lista(a.parametros?.armas)) out[uid] = [...(out[uid] ?? []), traco];
  }
  return out;
}

export { cdDoVeneno };
