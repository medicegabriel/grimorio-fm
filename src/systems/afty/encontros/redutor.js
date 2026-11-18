/* Os motores entram PRIMEIRO, pela mesma porta do modelo (ver o topo de modelo.js). */
import { motorDe } from "./motores/index";
import {
  MOTOR, TIPO, VISAO_ORDEM, CONFIG_PADRAO, combatenteDe, ehLigado, jogaTurno, proximoTurno, renumerarCopias,
  normalizarDono,
} from "./modelo";
import {
  ENCONTRO_STATUS, LADO, podeTransicionar, entradaDeLog, LOG_TIPOS, LOG_MAX, ordenarPorIniciativa, definirIniciativa,
} from "./afty-encontro";
import { aplicarOperacao, aplicarOperacoes, recusarPedido } from "./operacoes";
import { encerraMobilidadeNoTurnoEmCurso, encerraCortesNoInicioDoTurno } from "../ficha/ficha-conteudo-manobras";
import { encerraProvocacoesDaFonte } from "../ficha/ficha-conteudo-provocar";
import { encerraCurasMedicinaDoTurno } from "../ficha/ficha-conteudo-medicina";
import { encerraCobrirSe } from "../ficha/ficha-conteudo-reacoes";
import { juntarFundamentosPerdidos } from "./fundamento-biblioteca";
import { APLICADOR_PROPRIO } from "../ficha/ficha-uso-estado";

/**
 * ============================================================
 * O REDUTOR DO ENCONTRO UNIFICADO (etapa 3, 2026-11-17)
 * ============================================================
 * Evolui o `redutorDeEncontro` de `usar-encontro-afty.js`, que continua de pé
 * para as telas de hoje até a etapa 6. Três diferenças:
 *
 * 1. O estado é um MUNDO, `{ encontro, sessoes }`: a sessão do personagem ligado
 *    mora fora do Encontro (a da ficha), e o redutor a recebe e a devolve no mapa
 *    `sessoes`, pelo id da ficha. Quem grava o mapa de volta na loja da sessão é
 *    o gancho da etapa 6.
 * 2. O redutor só fala com o ADAPTADOR do motor (`motores/`). A criatura da
 *    2.5.2 passa pelo mesmo fluxo (`motores/m252.js`, etapa 4), com o terceiro
 *    argumento do verbo de turno (`opcoesDe`) e o abate pelo contador de erros.
 * 3. Mudança em combatente chega como OPERAÇÃO já medida (`OPERACAO`,
 *    `OPERACOES`), nunca como estado inteiro. O `PATCH_SESSAO` e o
 *    `PATCH_SESSOES` deram lugar a elas, e a conferência do PATCH_SESSOES
 *    continua: `OPERACOES` aplica tudo ou nada, comparando por valor.
 *
 * O fluxo de turno (começar, passar, virar a rodada, encerrar) repete o de hoje
 * passo a passo, e o `t-encontro-unificado.mjs` roda a mesma luta pelos dois
 * redutores e compara as sessões, com UMA diferença de propósito desde a etapa 5
 * (2026-11-17): a DURAÇÃO. Ver "A DURAÇÃO POR QUEM APLICOU" abaixo.
 *
 * ⚠ Os ajudantes do Afty que encerram efeitos (Cobrir-se, Mobilidade, Medicina,
 * Cortes, Provocar) percorrem `c.sessao` na lista INTEIRA. Para o personagem
 * ligado eles enxergam uma VISTA com a sessão da ficha posta em `sessao`, e o
 * resultado volta para o mapa `sessoes` (ver `vistaDo` e `devolverVista`).
 * ============================================================
 */

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};

const d20 = () => Math.floor(Math.random() * 20) + 1;

/* ============================================================ */
/* A VISTA                                                       */
/* ============================================================ */

/** Cada combatente com o estado à mão: o ligado ganha `sessao` com a sessão da ficha. */
function vistaDo(mundo) {
  return mundo.encontro.combatentes.map((c) => (
    ehLigado(c) ? { ...c, sessao: mundo.sessoes?.[c.fichaRef.id] ?? null } : c
  ));
}

/**
 * Devolve a vista ao mundo: o ligado manda a sessão de volta ao mapa e volta a
 * ser o combatente de antes (a vista só muda sessões). `remover` tira um
 * combatente da lista, mas a sessão dele, se for ligado, volta mesmo assim: ela
 * é a da ficha, e o efeito que acabou acabou para ela também.
 */
function devolverVista(mundo, vista, { remover = null } = {}) {
  const originais = new Map(mundo.encontro.combatentes.map((c) => [c.id, c]));
  let sessoes = mundo.sessoes ?? {};
  const combatentes = [];
  for (const v of vista) {
    if (ehLigado(v)) {
      const atual = sessoes[v.fichaRef.id] ?? null;
      if (v.sessao && v.sessao !== atual) sessoes = { ...sessoes, [v.fichaRef.id]: v.sessao };
      if (v.id !== remover) combatentes.push(originais.get(v.id));
    } else if (v.id !== remover) {
      combatentes.push(v);
    }
  }
  return { ...mundo, sessoes, encontro: { ...mundo.encontro, combatentes } };
}

const estadoNaVista = (v) => (v.motor === MOTOR.M252 ? v.combatState : v.motor === MOTOR.AFTY ? v.sessao : null) ?? null;
const comEstadoNaVista = (v, e) => (v.motor === MOTOR.M252 ? { ...v, combatState: e } : { ...v, sessao: e });

/**
 * O terceiro argumento de todo verbo de turno (etapa 4): `{ abatido, nome, avisar, ... }`. O Afty o ignora. A 2.5.2 o
 * usa para não mexer em quem está Abatido, para dar o nome nas frases e para levar as frases do Registro
 * (`avisar(tipo, mensagem)`) até o Encontro. `entradas` é a lista do Registro que o chamador monta.
 */
function opcoesDe(v, rodada, entradas, extras = {}) {
  return {
    abatido: !!v.flags?.abatido,
    nome: v.nome,
    avisar: entradas ? (tipo, mensagem) => entradas.push(entradaDeLog({ rodada, tipo, combatenteId: v.id, mensagem })) : null,
    ...extras,
  };
}

/** Um verbo do motor num combatente da vista. Sem motor ou sem estado, ele fica como está. */
function verbo(v, nome, d, op = null) {
  const m = motorDe(v);
  const e = estadoNaVista(v);
  if (!m || !e) return v;
  return comEstadoNaVista(v, m[nome](e, d, op));
}

const turnoDe = (vista, id, rodada) => ({
  id, rodada, turno: vista.find((v) => v.id === id)?.sessao?.uso?.acoes?.turno ?? 0,
});

const encerraEfeitosDoTurno = (vista, turno) =>
  encerraCurasMedicinaDoTurno(encerraMobilidadeNoTurnoEmCurso(encerraCobrirSe(vista, turno.id), turno), turno);

const encerraEfeitosDaFonte = (vista, id, motivo) =>
  encerraProvocacoesDaFonte(encerraCortesNoInicioDoTurno(vista, id, motivo), id, motivo);

const comLog = (encontro, entradas) => ({ ...encontro, log: [...entradas, ...(encontro.log ?? [])].slice(0, LOG_MAX) });

const noEncontro = (mundo, fn) => ({ ...mundo, encontro: fn(mundo.encontro) });

const comCombatente = (mundo, id, fn) => noEncontro(mundo, (e) => ({
  ...e, combatentes: e.combatentes.map((c) => (c.id === id ? fn(c) : c)),
}));

/* A virada de rodada de uma vista inteira, com o aviso do que expirou. */
function viraRodadaNaVista(vista, derivados, rodada, entradas, extras = {}) {
  return vista.map((v) => {
    const m = motorDe(v);
    const e = estadoNaVista(v);
    if (!m || !e) return v;
    const { estado, expirou } = m.viraRodada(e, derivados[v.id] ?? null, opcoesDe(v, rodada, entradas, extras));
    for (const item of expirou ?? []) {
      entradas.push(entradaDeLog({
        rodada, tipo: LOG_TIPOS.CONDICAO, combatenteId: v.id, mensagem: `${item.nome} de ${v.nome} chegou ao fim.`,
      }));
    }
    return comEstadoNaVista(v, estado);
  });
}

/* ============================================================ */
/* A DURAÇÃO POR QUEM APLICOU (etapa 5, 2026-11-17)              */
/* ============================================================ */
/*
 * ⚠ REGRA NOVA (autor, 2026-11-17), que revoga "a duração desce para todos na virada da rodada". Só as durações em
 * rodadas (Efeitos, condições, usos, e na criatura da 2.5.2 condições e modificadores) descem, e no FIM DO TURNO DE QUEM
 * APLICOU. A virada faz só o que é por rodada (os motores ligam `descerDuracoes: false`). A tabela do que é cada coisa está
 * em ficha/ficha-sessao.js, acima de `desceDuracoesDe`.
 *
 *   - O fim de cada turno desce, em TODOS os combatentes, as entradas daquele aplicador. Na ficha dele mesmo entram também
 *     as próprias (`"proprio"`) e as de quem não está mais na luta.
 *   - Quem está Abatido ou Fora da Ordem não joga, mas a posição dele na ordem ainda dispara a descida (`pulados`).
 *   - A entrada aplicada no turno de quem aplicou só começa a descer no turno seguinte dele (a marca `aguardaFimDoTurno`,
 *     posta pela operação, ver `comAplicador` em operacoes.js, e pelos próprios verbos de turno, ver `verboDoTurno`).
 *   - Quem sai da luta (`REMOVER`) tem as entradas repassadas para quem as carrega (`repassarAplicador`).
 *   - O Nova Rodada forçado encerra os turnos que faltam: desce a de quem está na vez e a de todos que ainda iam jogar.
 */

/**
 * Um verbo de TURNO (`iniciaTurno`, `encerraTurno`) no próprio combatente. O que o verbo cria (os gatilhos `turn_start` e
 * `turn_end` da 2.5.2 põem condição e modificador) entra no turno dele, então ganha a marca: sem ela, a condição de 1 rodada
 * do `turn_end` sumiria na descida logo em seguida, e a do `turn_start` no fim do mesmo turno.
 */
function verboDoTurno(v, nome, d, op) {
  const m = motorDe(v);
  const antes = estadoNaVista(v);
  const feito = verbo(v, nome, d, op);
  const depois = estadoNaVista(feito);
  if (!m?.marcarAplicador || !antes || !depois || depois === antes) return feito;
  const marcado = m.marcarAplicador(antes, depois, { aplicadorId: APLICADOR_PROPRIO, noTurno: true });
  return marcado === depois ? feito : comEstadoNaVista(feito, marcado);
}

/** A descida do fim do turno de `aplicadorId`, em toda a vista. Combatente sem nada a descer volta o MESMO. */
function desceDoAplicador(vista, aplicadorId, derivados, rodada, entradas) {
  if (!aplicadorId) return vista;
  const presentes = new Set(vista.map((v) => v.id));
  return vista.map((v) => {
    const m = motorDe(v);
    const e = estadoNaVista(v);
    if (!m?.desceDuracoesDe || !e) return v;
    const vale = v.id === aplicadorId
      ? (a) => a === APLICADOR_PROPRIO || a === aplicadorId || !presentes.has(a)
      : (a) => a === aplicadorId;
    const { estado, expirou } = m.desceDuracoesDe(e, derivados[v.id] ?? null, { ...opcoesDe(v, rodada, entradas), vale });
    for (const item of expirou ?? []) {
      entradas.push(entradaDeLog({
        rodada, tipo: LOG_TIPOS.CONDICAO, combatenteId: v.id, mensagem: `${item.nome} de ${v.nome} chegou ao fim.`,
      }));
    }
    return estado === e ? v : comEstadoNaVista(v, estado);
  });
}

/**
 * As posições entre quem encerrou e quem joga agora, na ordem completa: `antes` vêm antes da virada (o fim da ordem) e
 * `depois` depois dela (o começo da ordem seguinte). São os Abatidos e os Fora da Ordem que a busca do próximo pulou.
 */
function puladosNaOrdem(encontro, proximoId, novaRodada) {
  const ordem = ordenarPorIniciativa(encontro.combatentes);
  const atual = ordem.findIndex((c) => c.id === encontro.ativoId);
  if (atual === -1) return { antes: [], depois: [] };
  const alvo = proximoId ? ordem.findIndex((c) => c.id === proximoId) : -1;
  if (!novaRodada) return { antes: ordem.slice(atual + 1, alvo === -1 ? ordem.length : alvo), depois: [] };
  return { antes: ordem.slice(atual + 1), depois: alvo === -1 ? [] : ordem.slice(0, alvo) };
}

/* ============================================================ */
/* OS HANDLERS                                                   */
/* ============================================================ */

/**
 * O contador de erros da 2.5.2 (`missCounter` em 3 ou mais) derruba a criatura sozinha: o motor diz (`abateAutomatico`) e
 * o redutor liga o Abatido, que mora no combatente. Só olha os alvos da operação, como o `UPDATE_COMBAT_STATE` de hoje
 * olhava só o combatente que mudou, e só liga (nunca desliga).
 */
function abatidosPeloContador(mundo, alvos) {
  const ids = new Set((alvos ?? []).filter(Boolean));
  if (!ids.size) return mundo;
  let mudou = false;
  const combatentes = mundo.encontro.combatentes.map((c) => {
    if (!ids.has(c.id) || c.flags.abatido) return c;
    const m = motorDe(c);
    const e = estadoNaVista(c);
    if (!m?.abateAutomatico || !e || !m.abateAutomatico(e)) return c;
    mudou = true;
    return { ...c, flags: { ...c.flags, abatido: true } };
  });
  return mudou ? { ...mundo, encontro: { ...mundo.encontro, combatentes } } : mundo;
}

/** O Registro diz que a ficha foi atualizada, só se o combatente mudou. */
const registrarAtualizacao = (antes, id, depois) => {
  if (depois === antes) return antes;
  const c = combatenteDe(depois.encontro, id);
  const mudou = c && c !== combatenteDe(antes.encontro, id);
  return mudou
    ? noEncontro(depois, (e) => comLog(e, [entradaDeLog({ rodada: e.rodada, tipo: LOG_TIPOS.LIVRE, combatenteId: id, mensagem: `Ficha de ${c.nome} atualizada.` })]))
    : antes;
};

const FLAGS = { abatido: "abatido", foraDaOrdem: "foraDaOrdem", oculto: "foraDaOrdem" };
const LADOS = Object.values(LADO);

const HANDLERS = {
  RENOMEAR: (m, { nome }) => noEncontro(m, (e) => ({ ...e, nome })),

  /* O combatente chega PRONTO (`criarPersonagem`, `criarCriatura`, `criarMarcador`), porque nascer com os recursos
     cheios pede o derivado. A mesma ficha ligada não entra duas vezes. O ligado pode trazer a sessão da ficha. */
  ADICIONAR: (m, { combatente, sessao = null, iniciativa = null }) => {
    if (!combatente?.id || combatenteDe(m.encontro, combatente.id)) return m;
    if (ehLigado(combatente) && m.encontro.combatentes.some((c) => ehLigado(c) && c.fichaRef.id === combatente.fichaRef.id)) return m;
    const pronto = iniciativa != null ? definirIniciativa(combatente, iniciativa) : combatente;
    const comEle = noEncontro(m, (e) => ({ ...e, combatentes: renumerarCopias([...e.combatentes, pronto]) }));
    return ehLigado(pronto) && sessao ? { ...comEle, sessoes: { ...(comEle.sessoes ?? {}), [pronto.fichaRef.id]: sessao } } : comEle;
  },

  REMOVER: (m, { id }) => {
    const e = m.encontro;
    if (!combatenteDe(e, id)) return m;
    let vista = vistaDo(m);
    if (e.ativoId === id) vista = encerraEfeitosDoTurno(vista, turnoDe(vista, id, e.rodada));
    vista = encerraEfeitosDaFonte(vista, id, "fonteRemovida");
    // Etapa 5: o que ele aplicou passa a descer no turno de quem carrega.
    vista = vista.map((v) => {
      const mo = motorDe(v);
      const es = estadoNaVista(v);
      if (v.id === id || !mo?.repassarAplicador || !es) return v;
      const novo = mo.repassarAplicador(es, id);
      return novo === es ? v : comEstadoNaVista(v, novo);
    });
    const sem = devolverVista(m, vista, { remover: id });
    return noEncontro(sem, (x) => ({
      ...x, combatentes: renumerarCopias(x.combatentes), ativoId: e.ativoId === id ? null : e.ativoId,
    }));
  },

  DEFINIR_INICIATIVA: (m, { id, total }) => comCombatente(m, id, (c) => definirIniciativa(c, total)),

  DEFINIR_MOD: (m, { id, mod }) => comCombatente(m, id, (c) => ({ ...c, iniciativa: { ...c.iniciativa, mod: inteiro(mod, 0) } })),

  /* A rolagem chega FEITA (`rolagem`, o d20), como toda rolagem do Encontro novo. Sem ela, rola aqui, como hoje. */
  ROLAR_UMA: (m, { id, rolagem = null }) => comCombatente(m, id, (c) => {
    const r = rolagem != null ? inteiro(rolagem, 0) : d20();
    return { ...c, iniciativa: { ...c.iniciativa, rolagem: r, total: r + c.iniciativa.mod, manual: false } };
  }),

  ROLAR_TODAS: (m, { soVazias = false, rolagens = {} } = {}) => noEncontro(m, (e) => ({
    ...e,
    combatentes: e.combatentes.map((c) => {
      // Quem digitou a iniciativa à mão não é sorteado de novo.
      if (c.iniciativa.manual) return c;
      if (soVazias && c.iniciativa.rolagem > 0) return c;
      const r = rolagens[c.id] != null ? inteiro(rolagens[c.id], 0) : d20();
      return { ...c, iniciativa: { ...c.iniciativa, rolagem: r, total: r + c.iniciativa.mod, manual: false } };
    }),
  })),

  DEFINIR_LADO: (m, { id, lado }) => (LADOS.includes(lado)
    ? comCombatente(m, id, (c) => ({ ...c, flags: { ...c.flags, lado } })) : m),

  /* Só as duas flags de turno. O `oculto` antigo é lido como Fora da Ordem. */
  DEFINIR_FLAG: (m, { id, chave, valor }) => (FLAGS[chave]
    ? comCombatente(m, id, (c) => ({ ...c, flags: { ...c.flags, [FLAGS[chave]]: !!valor } })) : m),

  /* O personagem não tem visão (ver modelo.js). */
  DEFINIR_VISAO: (m, { id, visao }) => (VISAO_ORDEM.includes(visao)
    ? comCombatente(m, id, (c) => (c.tipo === TIPO.PERSONAGEM ? c : { ...c, visao })) : m),

  DEFINIR_DONO: (m, { id, dono }) => comCombatente(m, id, (c) => ({ ...c, dono: normalizarDono(dono, c.tipo) })),

  CONFIGURAR: (m, { chave, valor }) => (Object.hasOwn(CONFIG_PADRAO, chave)
    ? noEncontro(m, (e) => ({ ...e, config: { ...CONFIG_PADRAO, ...(e.config ?? {}), [chave]: !!valor } })) : m),

  /* As operações já medidas (operacoes.js). Com conflito, o mundo fica como estava. */
  OPERACAO: (m, { operacao }) => abatidosPeloContador(aplicarOperacao(m, operacao).mundo, [operacao?.alvo]),
  OPERACOES: (m, { operacoes }) => abatidosPeloContador(aplicarOperacoes(m, operacoes).mundo, (operacoes ?? []).map((o) => o?.alvo)),

  /* O aceite chega MEDIDO (`aceitarPedido` mede contra o estado da hora e devolve a operação). Se a operação não
     aplica, o pedido fica. */
  RESOLVER_PEDIDO: (m, { pedidoId, operacao }) => {
    const sem = noEncontro(m, (e) => ({ ...e, pedidos: (e.pedidos ?? []).filter((p) => p.id !== pedidoId) }));
    const r = aplicarOperacao(sem, operacao);
    return r.ok ? abatidosPeloContador(r.mundo, [operacao?.alvo]) : m;
  },
  RECUSAR_PEDIDO: (m, { pedidoId, por, em }) => {
    const r = recusarPedido(m, pedidoId, por, { agora: () => em ?? Date.now() });
    return r.ok ? r.mundo : m;
  },

  /* A MORTE DO FUNDAMENTO (DA-07) na cópia que o Encontro guarda, como hoje. O personagem ligado grava na ficha
     dele, que é trabalho do gancho (etapa 6). */
  REGISTRAR_FUNDAMENTO_PERDIDO: (m, { id, registro }) => comCombatente(m, id, (c) => {
    if (!c.ficha || ehLigado(c) || typeof registro?.invocacaoId !== "string" || !registro.invocacaoId) return c;
    const antes = c.ficha.fundamentosPerdidos;
    const fundamentosPerdidos = juntarFundamentosPerdidos(antes, [registro]);
    return fundamentosPerdidos === antes ? c : { ...c, ficha: { ...c.ficha, fundamentosPerdidos } };
  }),

  /* O ATUALIZAR DA FICHA (etapa 6b, 2026-11-17), no lugar do `EncounterSyncModal`. A ficha nova vem do inventário da lista e o
     estado da cópia fica. Na 2.5.2 é a conta do `handleSyncConfirm` do `App.jsx` (a ficha vira o `snapshot`, o máximo de Vida
     vira `hpMaxBase` e a Vida atual não passa do novo máximo). No Afty a ficha clonada é refeita, as perdas de Fundamento que a
     cópia já tinha continuam, e a sessão é aparada pelo derivado novo (`derivado`, que a tela calcula). Personagem ligado e
     marcador não têm cópia. */
  ATUALIZAR_FICHA: (m, { id, ficha, derivado = null }) => registrarAtualizacao(m, id, comCombatente(m, id, (c) => {
    if (!ficha || typeof ficha !== "object" || c.tipo !== TIPO.CRIATURA || ehLigado(c)) return c;
    const nova = JSON.parse(JSON.stringify(ficha));
    if (c.motor === MOTOR.M252) {
      const cs = c.combatState ?? {};
      const hpMax = Math.max(0, inteiro(nova.stats?.hpMax, 0));
      const ajustes = nova.combatSettings ?? c.snapshot?.combatSettings;
      return {
        ...c, snapshot: ajustes ? { ...nova, combatSettings: ajustes } : nova,
        combatState: { ...cs, hpMaxBase: hpMax, hpCurrent: Math.min(cs.hpCurrent ?? hpMax, hpMax) },
      };
    }
    const perdidos = juntarFundamentosPerdidos(nova.fundamentosPerdidos, c.ficha?.fundamentosPerdidos);
    const fichaNova = perdidos === nova.fundamentosPerdidos ? nova : { ...nova, fundamentosPerdidos: perdidos };
    const m2 = motorDe(c);
    const sessao = m2 && derivado && c.sessao ? m2.aparar(c.sessao, derivado) : c.sessao;
    return { ...c, ficha: fichaNova, sessao };
  })),

  /* Os Ajustes de Combate da 2.5.2 (Guarda Absorve Primeiro, RD Reduz o Dano) moram no `snapshot.combatSettings` da cópia, como no
     `CombatantPanel` (:1553-1559, `handleSettingsChange`). Só as duas chaves conhecidas, e só na criatura da 2.5.2. */
  AJUSTAR_COMBATE: (m, { id, ajustes }) => comCombatente(m, id, (c) => {
    if (c.motor !== MOTOR.M252 || !c.snapshot || !ajustes || typeof ajustes !== "object") return c;
    const limpos = {};
    for (const k of ["guardaAbsorbsFirst", "rdReducao"]) if (typeof ajustes[k] === "boolean") limpos[k] = ajustes[k];
    if (!Object.keys(limpos).length) return c;
    return { ...c, snapshot: { ...c.snapshot, combatSettings: { ...(c.snapshot.combatSettings ?? {}), ...limpos } } };
  }),

  RESULTADO_FUNDAMENTOS_BIBLIOTECA: (m, { falhas }) => noEncontro(m, (e) => (
    JSON.stringify(e.fundamentosSemGravar ?? []) === JSON.stringify(falhas) ? e : { ...e, fundamentosSemGravar: falhas }
  )),

  COMECAR: (m, { derivados = {} } = {}) => {
    const e = m.encontro;
    if (!podeTransicionar(e.status, ENCONTRO_STATUS.ATIVO)) return m;
    const primeiro = ordenarPorIniciativa(e.combatentes).find(jogaTurno) ?? null;
    const avisos = [];
    // A rodada da sessão de cada um zera junto, e a cena começa aqui (as cascas de PE de `combate` e de `rodada`).
    const vista = encerraEfeitosDaFonte(vistaDo(m), primeiro?.id).map((v) => {
      const d = derivados[v.id] ?? null;
      const comecou = verbo(v, "iniciaCombate", d, opcoesDe(v, 1, avisos));
      return v.id === primeiro?.id ? verboDoTurno(comecou, "iniciaTurno", d, opcoesDe(v, 1, avisos, { comecoDoCombate: true })) : comecou;
    });
    const com = devolverVista(m, vista);
    return noEncontro(com, (x) => comLog({ ...x, status: ENCONTRO_STATUS.ATIVO, rodada: 1, ativoId: primeiro?.id ?? null }, [
      entradaDeLog({ rodada: 1, tipo: LOG_TIPOS.RODADA, mensagem: "Combate iniciado. Rodada 1." }),
      ...avisos,
      ...(primeiro ? [entradaDeLog({ rodada: 1, tipo: LOG_TIPOS.TURNO, mensagem: `Turno de ${primeiro.nome}.`, combatenteId: primeiro.id })] : []),
    ]));
  },

  PROXIMO_TURNO: (m, { derivados = {} } = {}) => {
    const e = m.encontro;
    if (e.status !== ENCONTRO_STATUS.ATIVO) return m;
    const { proximoId, rodada, novaRodada } = proximoTurno(e);
    const entradas = [];
    let vista = vistaDo(m);
    const turno = turnoDe(vista, e.ativoId, e.rodada);
    vista = vista.map((v) => (v.id === e.ativoId ? verboDoTurno(v, "encerraTurno", derivados[v.id] ?? null, opcoesDe(v, e.rodada, entradas)) : v));
    vista = encerraEfeitosDoTurno(vista, turno);
    /* Etapa 5: o fim do turno de quem jogou desce as durações que ele aplicou, e cada posição pulada dispara a dela no
       lugar certo da ordem. A virada não desce duração nenhuma. */
    const pulados = puladosNaOrdem(e, proximoId, novaRodada);
    vista = desceDoAplicador(vista, e.ativoId, derivados, e.rodada, entradas);
    for (const p of pulados.antes) vista = desceDoAplicador(vista, p.id, derivados, e.rodada, entradas);
    if (novaRodada) {
      vista = viraRodadaNaVista(vista, derivados, rodada, entradas);
      entradas.push(entradaDeLog({ rodada, tipo: LOG_TIPOS.RODADA, mensagem: `Rodada ${rodada} iniciada.` }));
    }
    for (const p of pulados.depois) vista = desceDoAplicador(vista, p.id, derivados, rodada, entradas);
    if (proximoId) {
      vista = encerraEfeitosDaFonte(vista, proximoId);
      vista = vista.map((v) => (v.id === proximoId ? verboDoTurno(v, "iniciaTurno", derivados[v.id] ?? null, opcoesDe(v, rodada, entradas)) : v));
      const alvo = vista.find((v) => v.id === proximoId);
      entradas.push(entradaDeLog({ rodada, tipo: LOG_TIPOS.TURNO, combatenteId: proximoId, mensagem: `Turno de ${alvo?.nome ?? "Combatente"}.` }));
    }
    const com = devolverVista(m, vista);
    return noEncontro(com, (x) => comLog({ ...x, rodada, ativoId: proximoId }, entradas));
  },

  NOVA_RODADA: (m, { derivados = {} } = {}) => {
    const e = m.encontro;
    if (e.status !== ENCONTRO_STATUS.ATIVO) return m;
    const rodada = e.rodada + 1;
    const entradas = [];
    let vista = vistaDo(m);
    const turno = turnoDe(vista, e.ativoId, e.rodada);
    vista = encerraCurasMedicinaDoTurno(encerraCobrirSe(vista, turno.id), turno);
    /* Etapa 5 (autor, 2026-11-17, "Encerra os Turnos que Faltam"): o forçado conta como o fim do turno de quem está na vez
       e de todos que ainda iam jogar nesta rodada, na ordem. Quem já jogou não desce de novo. */
    const ordem = ordenarPorIniciativa(e.combatentes);
    const atual = ordem.findIndex((c) => c.id === e.ativoId);
    if (atual !== -1) for (const c of ordem.slice(atual)) vista = desceDoAplicador(vista, c.id, derivados, e.rodada, entradas);
    vista = viraRodadaNaVista(vista, derivados, rodada, entradas, { forcada: true });
    entradas.push(entradaDeLog({ rodada, tipo: LOG_TIPOS.RODADA, mensagem: `Rodada ${rodada} forçada.` }));
    const com = devolverVista(m, vista);
    return noEncontro(com, (x) => comLog({ ...x, rodada }, entradas));
  },

  ENCERRAR: (m) => {
    const e = m.encontro;
    if (!podeTransicionar(e.status, ENCONTRO_STATUS.FINALIZADO)) return m;
    const vista = encerraCobrirSe(vistaDo(m)).map((v) => verbo(v, "encerraCombate", null));
    const com = devolverVista(m, vista);
    return noEncontro(com, (x) => comLog({ ...x, status: ENCONTRO_STATUS.FINALIZADO, ativoId: null }, [
      entradaDeLog({ rodada: e.rodada, tipo: LOG_TIPOS.RODADA, mensagem: "Combate encerrado." }),
    ]));
  },

  REABRIR: (m) => (podeTransicionar(m.encontro.status, ENCONTRO_STATUS.PLANEJANDO)
    ? noEncontro(m, (e) => ({ ...e, status: ENCONTRO_STATUS.PLANEJANDO, ativoId: null })) : m),

  LEVANTAR_TODOS: (m) => noEncontro(m, (e) => ({
    ...e, combatentes: e.combatentes.map((c) => ({ ...c, flags: { ...c.flags, abatido: false } })),
  })),

  REGISTRAR: (m, { tipoLog, mensagem, combatenteId = null }) => noEncontro(m, (e) => comLog(e, [
    entradaDeLog({ rodada: e.rodada, tipo: tipoLog, mensagem, combatenteId }),
  ])),
};

/** As ações que o redutor conhece. */
export const ACOES_DO_REDUTOR = Object.keys(HANDLERS);

/** O mundo de um Encontro: o Encontro, as sessões das fichas ligadas e (para derivar) as fichas delas. */
export const mundoDe = (encontro, sessoes = {}, fichas = {}) => ({ encontro, sessoes, fichas });

/**
 * O redutor: `(mundo, acao) -> mundo`. Ação desconhecida devolve o mundo como
 * estava. Puro, salvo o d20 de quem rola iniciativa sem mandar a rolagem.
 */
export function redutorDoEncontro(mundo, acao) {
  const h = HANDLERS[acao?.tipo];
  return h ? h(mundo, acao) : mundo;
}
