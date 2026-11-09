/**
 * ============================================================
 * O ESTADO DO MOTOR DE USO E COMBATE, DENTRO DA SESSÃO (CL1, 2026-10-29)
 * ============================================================
 * ⚠ MÓDULO FOLHA: ZERO IMPORTS, e é isso que lhe permite existir. A sessão
 * (`ficha-sessao.js`) precisa normalizar, avançar na rodada e limpar no descanso
 * este estado, e as operações que o escrevem (`ficha-uso.js`, `ficha-ataque.js`,
 * `ficha-combate-eventos.js`, `ficha-acoes.js`, `ficha-concentracao.js`) importam
 * a sessão. Se o estado morasse numa delas, a sessão importaria quem a importa.
 * O estado mora aqui, é dado puro, e a seta fica de mão única. Está na lista de
 * folhas de `asserts/t-ordem-modulos.mjs`.
 *
 * O guia do contrato é `docs/afty-motor-uso-combate.md`. Este arquivo guarda só a
 * FORMA do que fica salvo e as transições que não precisam de nenhum verbo da
 * sessão.
 *
 * Um campo só, `sessao.uso`, normalizado em `normalizaSessao`:
 *
 *   ops          o anel dos ids de operação já aplicados (`TETO_ANEL_OPS`, do mais
 *                novo ao mais antigo). Quem repete um id recebe "repetida" e nada
 *                muda: é a identidade da operação, independente da tela
 *   ativos       os usos com duração, manutenção ou concentração, por id
 *   pendencias   o que fica armado para o PRÓXIMO ataque elegível
 *   sequencia    quantos ataques este combatente recebeu desde o último turno dele
 *   acoes        as ações do turno (comum, bônus, movimento), as reações e as ações
 *                livres já usadas
 *   concentracao a concentração corrente, no máximo uma (p.320)
 *   teste        o teste de concentração pendente, com a CD já calculada
 *   itens        (CX5) o inventário NA MESA: as unidades consumidas por entrada (`uid`) e os
 *                itens criados por Feitiço. A ficha continua dona do que foi comprado; a
 *                sessão só diz o que já se gastou, e a leitura é `qtd - consumidos`. Campo
 *                ausente lê zero, então sessão e Encontro gravados antes não mudam
 *
 * ⚠ NADA DISTO É FICHA. É estado de mesa, como o resto da sessão, e viaja no
 * Encontro porque o combatente guarda a sessão inteira.
 * ============================================================
 */

export const TETO_ANEL_OPS = 100;
export const TETO_PENDENCIAS = 12;
/** O Buff de Mesa que carrega a penalidade de Defesa da Sequência de Ataques. */
export const SEQUENCIA_BUFF_ID = "cl1:sequencia-de-ataques";
/** Livro p.310: a sequência reduz a Defesa em até 5, e 5 pares são 10 ataques. */
export const SEQUENCIA_TETO_DEFESA = 5;
export const TIPOS_DURACAO = ["rodadas", "cena", "descanso", "fimDoTurno", "inicioDoProximoTurno", "manutencao"];
const EXPIRAS = ["fimDoTurno", "inicioDoProximoTurno", "rodada", "descanso"];
const ACOES_BASE = ["comum", "bonus", "movimento"];

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};
const naoNegativo = (v) => Math.max(0, inteiro(v, 0));
const objeto = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : null);
const texto = (v, padrao = "") => (typeof v === "string" ? v : padrao);
const lista = (v) => (Array.isArray(v) ? v : []);

/* ============================================================ */
/* A FORMA                                                       */
/* ============================================================ */
const acoesEmBranco = () => ({ turno: 0, gastas: { comum: 0, bonus: 0, movimento: 0 }, reacoes: {}, livres: {} });

/* ============================================================ */
/* OS ITENS NA MESA (CX5)                                        */
/* ============================================================ */
export const TETO_ITENS_CRIADOS = 40;
const TIPOS_DE_ENTRADA = ["arma", "uniforme", "escudo", "item", "kit"];

export const itensEmBranco = () => ({ consumidos: {}, criados: [] });

/** `{ chave: n }` só com n inteiro positivo e chave não vazia. */
const mapaDeContagens = (v) => Object.fromEntries(
  Object.entries(objeto(v) ?? {})
    .map(([k, n]) => [k, naoNegativo(n)])
    .filter(([k, n]) => k && n > 0),
);

function normalizaCriado(bruto) {
  if (!objeto(bruto) || typeof bruto.uid !== "string" || !bruto.uid || typeof bruto.refId !== "string" || !bruto.refId) return null;
  return {
    uid: bruto.uid,
    tipo: TIPOS_DE_ENTRADA.includes(bruto.tipo) ? bruto.tipo : "item",
    refId: bruto.refId,
    feitico: texto(bruto.feitico),
    consumivel: !!bruto.consumivel,
    equipado: !!bruto.equipado,
    grauBonus: naoNegativo(bruto.grauBonus),
    desde: naoNegativo(bruto.desde),
  };
}

export function normalizaItens(bruto) {
  const b = objeto(bruto);
  if (!b) return itensEmBranco();
  const vistos = new Set();
  const criados = lista(b.criados).map(normalizaCriado).filter((c) => {
    if (!c || vistos.has(c.uid)) return false;
    vistos.add(c.uid);
    return true;
  }).slice(0, TETO_ITENS_CRIADOS);
  return {
    consumidos: mapaDeContagens(b.consumidos),
    criados,
  };
}

/** O que o descanso faz com os itens na mesa: nada. O consumido NÃO volta e o item criado por Feitiço segue existindo até ser
    desfeito. As cargas de encantamento e a conta de criação por descanso moram em `sessao.usos` (chaves `cargas:<uid>` e
    `criacao:<feitiço>`), que o descanso já zera sozinho. */
export const itensNoDescanso = (itens) => normalizaItens(itens);

export const usoEmBranco = () => ({
  ops: [],
  ativos: {},
  pendencias: [],
  sequencia: { ataques: 0 },
  acoes: acoesEmBranco(),
  concentracao: null,
  teste: null,
  itens: itensEmBranco(),
});

function normalizaEfeitos(bruto) {
  return lista(bruto).flatMap((e) => {
    if (!objeto(e) || typeof e.id !== "string" || !e.id) return [];
    if (e.tipo === "estado") return [{ tipo: "estado", id: e.id, desliga: e.desliga === undefined ? false : e.desliga }];
    if (["buff", "pvTemporario"].includes(e.tipo)) return [{ tipo: e.tipo, id: e.id }];
    return [];
  }).concat(lista(bruto).flatMap((e) => (objeto(e) && e.tipo === "exaustao" && inteiro(e.delta) !== 0
    ? [{ tipo: "exaustao", id: texto(e.id, "exaustao"), delta: inteiro(e.delta) }] : [])));
}

function normalizaAtivo(bruto, chave) {
  if (!objeto(bruto)) return null;
  const id = texto(bruto.id, chave);
  if (!id) return null;
  const d = objeto(bruto.duracao) ?? {};
  const tipo = TIPOS_DURACAO.includes(d.tipo) ? d.tipo : "descanso";
  const m = objeto(bruto.manutencao);
  return {
    id,
    nome: texto(bruto.nome, id),
    origem: typeof bruto.origem === "string" ? bruto.origem : null,
    desde: naoNegativo(bruto.desde),
    duracao: tipo === "rodadas" ? { tipo, restantes: Math.max(1, inteiro(d.restantes, 1)) } : { tipo },
    manutencao: m ? { pe: naoNegativo(m.pe), mantidas: naoNegativo(m.mantidas), devidas: naoNegativo(m.devidas) } : null,
    cobranca: bruto.cobranca === "confirmada" ? "confirmada" : "manual",
    emCombate: !!bruto.emCombate,
    efeitos: normalizaEfeitos(bruto.efeitos),
    concentracao: !!bruto.concentracao,
    parametros: objeto(bruto.parametros) ?? {},
  };
}

function normalizaPendencia(bruto) {
  if (!objeto(bruto) || typeof bruto.id !== "string" || !bruto.id) return null;
  const e = objeto(bruto.elegivel) ?? {};
  return {
    id: bruto.id,
    usoId: typeof bruto.usoId === "string" ? bruto.usoId : null,
    nome: texto(bruto.nome, bruto.id),
    elegivel: {
      qualquer: lista(e.qualquer).filter((x) => typeof x === "string"),
      exceto: lista(e.exceto).filter((x) => typeof x === "string"),
      contraAlvo: typeof e.contraAlvo === "string" ? e.contraAlvo : null,
    },
    consome: bruto.consome === "declaracao" ? "declaracao" : "acerto",
    expira: EXPIRAS.includes(bruto.expira) ? bruto.expira : null,
    estado: typeof bruto.estado === "string" ? bruto.estado : null,
    desde: naoNegativo(bruto.desde),
  };
}

function normalizaAcoes(bruto) {
  const b = objeto(bruto) ?? {};
  const g = objeto(b.gastas) ?? {};
  const mapaDeRodadas = (v) => Object.fromEntries(
    Object.entries(objeto(v) ?? {}).filter(([k, r]) => k && Number.isFinite(Number(r))).map(([k, r]) => [k, naoNegativo(r)]),
  );
  return {
    turno: naoNegativo(b.turno),
    gastas: Object.fromEntries(ACOES_BASE.map((a) => [a, naoNegativo(g[a])])),
    reacoes: mapaDeRodadas(b.reacoes),
    livres: mapaDeRodadas(b.livres),
    // CL3: a reação do Confronto de Domínios tira a Ação Comum do próximo turno (p.185). A chave só existe quando vale.
    ...(b.semComum ? { semComum: true } : {}),
  };
}

function normalizaConcentracao(bruto) {
  if (!objeto(bruto) || typeof bruto.id !== "string" || !bruto.id) return null;
  return {
    id: bruto.id,
    nome: texto(bruto.nome, bruto.id),
    ritualFeiticoId: typeof bruto.ritualFeiticoId === "string" ? bruto.ritualFeiticoId : null,
    desde: naoNegativo(bruto.desde),
  };
}

function normalizaTeste(bruto) {
  if (!objeto(bruto) || !Number.isFinite(Number(bruto.cd))) return null;
  return { cd: Math.max(0, inteiro(bruto.cd)), causa: texto(bruto.causa, "dano"), desde: naoNegativo(bruto.desde) };
}

/** Sanea o que veio do armazenamento, do export ou de um Encontro. Lixo vira o padrão e nunca derruba. */
export function normalizaUso(bruto) {
  const b = objeto(bruto);
  if (!b) return usoEmBranco();
  const ops = lista(b.ops)
    .filter((o) => objeto(o) && typeof o.id === "string" && o.id)
    .slice(0, TETO_ANEL_OPS)
    .map((o) => ({ id: o.id, tipo: texto(o.tipo), rodada: naoNegativo(o.rodada) }));
  const ativos = {};
  for (const [chave, a] of Object.entries(objeto(b.ativos) ?? {})) {
    const n = normalizaAtivo(a, chave);
    if (n) ativos[n.id] = n;
  }
  return {
    ops,
    ativos,
    pendencias: lista(b.pendencias).map(normalizaPendencia).filter(Boolean).slice(0, TETO_PENDENCIAS),
    sequencia: { ataques: naoNegativo(objeto(b.sequencia)?.ataques) },
    acoes: normalizaAcoes(b.acoes),
    concentracao: normalizaConcentracao(b.concentracao),
    teste: normalizaTeste(b.teste),
    itens: normalizaItens(b.itens),
  };
}

/* ============================================================ */
/* LEITURA E ESCRITA                                             */
/* ============================================================ */
export const usoDe = (sessao) => normalizaUso(sessao?.uso);

/** A sessão com o estado de uso trocado pelo que o mutador devolve. */
export const comUso = (sessao, mutador) => ({ ...sessao, uso: mutador(usoDe(sessao)) });

export const jaAplicada = (sessao, opId) => !!opId && usoDe(sessao).ops.some((o) => o.id === opId);

/** Anota uma operação aplicada, no topo do anel. O teto descarta a mais antiga. */
export function comOperacao(sessao, { id, tipo }) {
  return comUso(sessao, (u) => ({
    ...u,
    ops: [{ id, tipo: texto(tipo), rodada: naoNegativo(sessao?.rodada) }, ...u.ops.filter((o) => o.id !== id)].slice(0, TETO_ANEL_OPS),
  }));
}

/* ============================================================ */
/* BUFF DE MESA E ESTADO DE COMBATE: AS DUAS SAÍDAS DE UM EFEITO  */
/* ============================================================ */
/** Acrescenta o Buff de Mesa pelo id. O mesmo id não entra duas vezes. */
export function comBuff(sessao, buff) {
  const buffs = lista(sessao?.buffs);
  if (buffs.some((b) => b?.id === buff.id)) return { ...sessao, buffs: buffs.map((b) => (b?.id === buff.id ? { ...b, ...buff } : b)) };
  return { ...sessao, buffs: [...buffs, buff] };
}

export function semBuff(sessao, id) {
  const buffs = lista(sessao?.buffs);
  return buffs.some((b) => b?.id === id) ? { ...sessao, buffs: buffs.filter((b) => b?.id !== id) } : sessao;
}

function desfazEfeito(sessao, efeito) {
  if (efeito.tipo === "buff") return semBuff(sessao, efeito.id);
  if (efeito.tipo === "pvTemporario") {
    const fontes = { ...sessao.pvTempFontes };
    delete fontes[efeito.id];
    return { ...sessao, pvTempFontes: fontes };
  }
  // CX5: a Exaustão que o uso moveu volta junto com ele (Injeção de Adrenalina devolve, Mistura Profana cobra no fim da cena).
  if (efeito.tipo === "exaustao") return { ...sessao, exaustao: Math.max(0, inteiro(sessao?.exaustao, 0) + efeito.delta) };
  const combate = objeto(sessao?.combate) ?? {};
  if (!(efeito.id in combate)) return sessao;
  return { ...sessao, combate: { ...combate, [efeito.id]: efeito.desliga } };
}

/**
 * Encerra um uso ativo: desfaz os efeitos que ele ligou (o estado volta ao valor de desligado e o Buff
 * de Mesa sai) e o tira da lista. A concentração dele, se era ela, cai junto. Devolve a mesma sessão
 * se o id não existe.
 */
export function encerraAtivoNaSessao(sessao, id, motivo = "encerrado", registro = null) {
  const uso = usoDe(sessao);
  const ativo = uso.ativos[id];
  if (!ativo) return sessao;
  let out = ativo.efeitos.reduce(desfazEfeito, sessao);
  const resto = { ...uso.ativos };
  delete resto[id];
  const concentracao = uso.concentracao?.id === id ? null : uso.concentracao;
  const teste = concentracao ? uso.teste : null;
  out = { ...out, uso: { ...uso, ativos: resto, concentracao, teste } };
  registro?.encerrou?.push({ id: ativo.id, nome: ativo.nome, motivo });
  return out;
}

const idsDoAtivo = (sessao, quais) => Object.values(usoDe(sessao).ativos).filter(quais).map((a) => a.id);

function encerraVarios(sessao, ids, motivo, registro) {
  return ids.reduce((s, id) => encerraAtivoNaSessao(s, id, motivo, registro), sessao);
}

/**
 * ⚠ O USO ATIVO SABE QUANDO FOI DESLIGADO À MÃO. O seletor da aba Buffs liga e desliga o estado por `alteraEstadoCombate`, que
 * não conhece `sessao.uso`. Sem este passo, quem desliga por lá deixava o uso ativo, e cada virada somava uma manutenção
 * devida de algo já desligado. Um uso cujos efeitos (todos) já estão desfeitos, estado no valor `desliga` e Buff de Mesa fora
 * da lista, é encerrado com `motivo: "desligadoAMao"`, o mesmo do Invencível. Uso sem efeito nenhum (só concentração, por
 * exemplo) não tem como ser visto desligado e fica.
 */
const efeitoDesfeito = (sessao, e) => {
  // A Exaustão não tem um interruptor que a mesa possa desligar à mão: o uso só termina pelo prazo.
  if (e.tipo === "exaustao") return false;
  if (e.tipo === "buff") return !lista(sessao?.buffs).some((b) => b?.id === e.id);
  if (e.tipo === "pvTemporario") return !sessao.pvTempFontes?.[e.id];
  const atual = objeto(sessao?.combate)?.[e.id];
  return e.desliga === false || e.desliga === null || e.desliga === 0 ? !atual : atual === e.desliga;
};

export function sincronizaUso(sessao, registro = null) {
  const desfeitos = Object.values(usoDe(sessao).ativos)
    .filter((a) => a.efeitos.length > 0 && a.efeitos.every((e) => efeitoDesfeito(sessao, e)))
    .map((a) => a.id);
  return desfeitos.reduce((s, id) => encerraAtivoNaSessao(s, id, "desligadoAMao", registro), sessao);
}

/* ============================================================ */
/* A SEQUÊNCIA DE ATAQUES (p.310)                                 */
/* ============================================================ */
/**
 * "Para cada 2 ataques realizados na sequência, a Defesa da criatura é reduzida em 1, até 5." A
 * penalidade vai pelo Buff de Mesa de id fixo, que o derive já lê (`buffsSessao`), então não há canal,
 * variável nem edição no cálculo. Quem a tira é o início do turno do alvo ("uma sequência é considerada
 * finalizada quando o turno do alvo chega").
 */
export const penalidadeDaSequencia = (ataques) => Math.min(SEQUENCIA_TETO_DEFESA, Math.floor(naoNegativo(ataques) / 2));

export function comSequencia(sessao, ataques) {
  const n = naoNegativo(ataques);
  const penal = penalidadeDaSequencia(n);
  const uso = { ...usoDe(sessao), sequencia: { ataques: n } };
  const base = { ...sessao, uso };
  if (!penal) return semBuff(base, SEQUENCIA_BUFF_ID);
  return comBuff(base, { id: SEQUENCIA_BUFF_ID, nome: "Sequência de Ataques", canal: "defesa", expr: `-${penal}`, rodadas: null });
}

/* ============================================================ */
/* AS TRANSIÇÕES DE TEMPO                                        */
/* ============================================================ */
/**
 * A virada da rodada. Cada duração em rodadas desce um e o que zera sai (devolvido no `registro.encerrou`
 * para o histórico). Cada manutenção passa a ser DEVIDA: a ficha não debita nem desliga (custo de estado
 * só é exibido, decisão vigente), só marca o que a pessoa ainda precisa descontar.
 */
export function avancaUsoNaRodada(sessao, registro = null) {
  let out = sincronizaUso(sessao, registro);
  for (const a of Object.values(usoDe(sessao).ativos)) {
    if (a.duracao.tipo === "rodadas") {
      if (a.duracao.restantes - 1 <= 0) { out = encerraAtivoNaSessao(out, a.id, "duracao", registro); continue; }
      out = comUso(out, (u) => ({ ...u, ativos: { ...u.ativos, [a.id]: { ...a, duracao: { tipo: "rodadas", restantes: a.duracao.restantes - 1 } } } }));
    } else if (a.duracao.tipo === "manutencao" && a.manutencao && a.manutencao.pe > 0) {
      const devidas = a.manutencao.devidas + 1;
      out = comUso(out, (u) => ({ ...u, ativos: { ...u.ativos, [a.id]: { ...a, manutencao: { ...a.manutencao, devidas } } } }));
      // A chave nasce só quando há manutenção devida: o formato do registro da virada não muda para quem não usa o motor de uso.
      if (registro) registro.manutencaoDevida = [...(registro.manutencaoDevida ?? []), { id: a.id, nome: a.nome, valor: a.manutencao.pe, devidas }];
    }
  }
  const uso = usoDe(out);
  // Pendência "até a rodada virar" cai aqui. As de turno caem nas transições de turno.
  const pendencias = uso.pendencias.filter((p) => p.expira !== "rodada");
  if (pendencias.length !== uso.pendencias.length) out = { ...out, uso: { ...uso, pendencias } };
  return out;
}

/** O início do turno DESTA ficha: as ações voltam, a sequência de ataques recebidos fecha e expira o que era "até o próximo turno". */
export function iniciaTurnoNoUso(sessao, registro = null) {
  const sincronizada = sincronizaUso(sessao, registro);
  let out = encerraVarios(sincronizada, idsDoAtivo(sincronizada, (a) => a.duracao.tipo === "inicioDoProximoTurno"), "inicioDoTurno", registro);
  out = comUso(out, (u) => {
    const { semComum, ...acoes } = u.acoes;
    return {
      ...u,
      acoes: { ...acoes, turno: u.acoes.turno + 1, gastas: { comum: semComum ? 1 : 0, bonus: 0, movimento: 0 } },
      pendencias: u.pendencias.filter((p) => p.expira !== "inicioDoProximoTurno"),
    };
  });
  return comSequencia(out, 0);
}

/** O fim do turno DESTA ficha: expira o que era "até o fim do turno". */
export function encerraTurnoNoUso(sessao, registro = null) {
  const sincronizada = sincronizaUso(sessao, registro);
  const out = encerraVarios(sincronizada, idsDoAtivo(sincronizada, (a) => a.duracao.tipo === "fimDoTurno"), "fimDoTurno", registro);
  const uso = usoDe(out);
  const pendencias = uso.pendencias.filter((p) => p.expira !== "fimDoTurno");
  return pendencias.length === uso.pendencias.length ? out : { ...out, uso: { ...uso, pendencias } };
}

/**
 * O fim do combate leva os usos "até o fim da cena" e os que só valem em combate (`emCombate`, como Armas Absolutas: um estado
 * de uma rodada não pode ficar ligado para a luta seguinte).
 */
export function fechaCombateNoUso(sessao, registro = null) {
  const out = encerraVarios(sessao, idsDoAtivo(sessao, (a) => a.duracao.tipo === "cena" || a.emCombate), "fimDoCombate", registro);
  return comUso(out, (u) => ({ ...u, pendencias: [], teste: null, acoes: { ...u.acoes, gastas: { comum: 0, bonus: 0, movimento: 0 } } }));
}

/** O descanso encerra tudo o que era da cena. O anel de operações fica: o id aplicado continua aplicado. */
export function zeraUsoNoDescanso(sessao) {
  const sem = encerraVarios(sessao, Object.keys(usoDe(sessao).ativos), "descanso", null);
  const uso = usoDe(sem);
  return comSequencia({ ...sem, uso: { ...usoEmBranco(), ops: uso.ops, itens: itensNoDescanso(uso.itens) } }, 0);
}

/* ============================================================ */
/* CONCENTRAÇÃO: O REGISTRO                                      */
/* ============================================================ */
/** O registro puro: a ficha concentra em `id`. Quem recusa um segundo é o verbo (`ficha-concentracao.js`). */
export function abreConcentracaoNaSessao(sessao, { id, nome, ritualFeiticoId = null }) {
  return comUso(sessao, (u) => ({
    ...u,
    concentracao: normalizaConcentracao({ id, nome, ritualFeiticoId, desde: sessao?.rodada }),
    teste: null,
  }));
}

export function fechaConcentracaoNaSessao(sessao) {
  const uso = usoDe(sessao);
  if (!uso.concentracao && !uso.teste) return sessao;
  return { ...sessao, uso: { ...uso, concentracao: null, teste: null } };
}
