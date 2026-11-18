import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

/* Os motores entram PRIMEIRO: o do Afty puxa o `afty-derive.js` antes de tudo (ver o topo de modelo.js). */
import { motorDe, MOTORES } from "./motores/index";
import { deriveAfty } from "../afty-derive";
import { aplicarAddons, unirAddons, epocaAddons } from "../afty-addons";
import {
  MOTOR, TIPO, PAPEL, ehLigado, fichaDoCombatente, estadoDoCombatente, comEstado,
  criarPersonagem, criarCriatura, criarMarcador, resumoDoCombatente, validarInicio, jogaTurno, combatenteDe,
} from "./modelo";
import { redutorDoEncontro, mundoDe } from "./redutor";
import {
  operar, acaoEmGrupo, desfazer, aceitarPedido, diferencaEstrutural, aplicarDelta, historicoDe, valorEm,
} from "./operacoes";
import { inventarioDoGrupo, fichasDoInventario, fichaNovaDe, CHAVES_INVENTARIO } from "./listas";
import { ordenarPorIniciativa, LADO } from "./afty-encontro";
import { ler as lerDaLoja, ouvir as ouvirDaLoja, atualizar as atualizarNaLoja } from "../ficha/sessao-loja";
import { sincronizarFundamentosNaBiblioteca } from "./fundamento-biblioteca";

/**
 * ============================================================
 * UM ENCONTRO DO MODELO UNIFICADO NA TELA (etapa 6a, 2026-11-17)
 * ============================================================
 * Monta o MUNDO (`{ encontro, sessoes, fichas }`, ver modelo.js) a partir de três
 * fontes e devolve as ações da tela:
 *
 *   encontro  a lista da rota (`usar-lista-encontros.js`)
 *   sessoes   a sessão de cada personagem LIGADO, pela loja da sessão
 *             (`ficha/sessao-loja.js`): a mesma que a Ficha do jogador lê
 *   fichas    a ficha de cada personagem ligado, do inventário da lista
 *
 * ⚠ TODA ESCRITA SAI DO ESTADO DE AGORA. A ação roda dentro do `atualizar` da
 * lista, que entrega o Encontro de agora, e as sessões são lidas da loja na mesma
 * hora. Dois cliques no mesmo quadro não se apagam.
 *
 * ⚠ A SESSÃO DO PERSONAGEM VOLTA PELA LOJA, NUNCA PELO `salvarSessao`. Cada sessão
 * que a ação mudou vai por `atualizar(id, passo)`, e o passo, se a loja tiver uma
 * versão mais nova (outra aba, a Ficha do jogador), reaplica a DIFERENÇA da ação
 * sobre ela em vez de gravar por cima.
 *
 * ⚠ O REDUTOR PODE LANÇAR ("Ficha sem Cálculo", na criatura da 2.5.2 que não
 * derivou). A ação que lança não muda nada e vira um aviso na tela.
 *
 * Sem Sala, quem opera é o Mestre do aparelho (`AUTOR_LOCAL`). O histórico do
 * personagem guarda o que o Mestre fez nele (autor, "Personagem por Papel").
 * ============================================================
 */

export const AUTOR_LOCAL = Object.freeze({ conta: null, papel: PAPEL.MESTRE, combatente: null });

/* ---------- o derive, com cache ---------- */

/* A 2.5.2 não tem cache próprio (`derivarVivo` refaz modificadores e `resolveLiveStats`). A chave é o `combatState`,
   que todo verbo devolve novo, mais o `snapshot`. WeakMap de módulo pelo mesmo motivo do `derivarComCache` do Afty. */
const CACHE_252 = new WeakMap();
function derivar252(snapshot, combatState) {
  const anterior = CACHE_252.get(combatState);
  if (anterior && anterior.snapshot === snapshot) return anterior.d;
  const d = MOTORES[MOTOR.M252].derivar(snapshot, combatState);
  CACHE_252.set(combatState, { snapshot, d });
  return d;
}

/** Um derivado por combatente, como o `derivarEncontro` do modelo, com o cache da 2.5.2 e o erro de cada um. */
export function derivarMundo({ encontro, sessoes = {}, fichas = {} }) {
  const combatentes = encontro?.combatentes ?? [];
  const doAfty = combatentes.filter((c) => c.motor === MOTOR.AFTY).map((c) => fichaDoCombatente(c, fichas)).filter(Boolean);
  const { pacotes, divergencias } = unirAddons(doAfty);
  aplicarAddons(pacotes);
  const epoca = epocaAddons();
  const mapa = {};
  const erros = {};
  for (const c of combatentes) {
    const m = motorDe(c);
    if (!m) { mapa[c.id] = null; continue; }
    const ficha = fichaDoCombatente(c, fichas);
    const estado = estadoDoCombatente(c, sessoes);
    try {
      /* A ficha da 2.5.2 sem stats (ou sem PV máximo) deriva tudo em zero, calada: a Vida inteira viraria "temporária". Melhor o
         aviso de que ela não tem cálculo. */
      if (c.motor === MOTOR.M252 && !(Number(ficha?.stats?.hpMax) > 0)) throw new Error("Ficha sem Cálculo");
      mapa[c.id] = c.motor === MOTOR.M252 ? derivar252(ficha, estado) : m.derivar(ficha, estado, epoca);
      if (!mapa[c.id]) erros[c.id] = ficha ? "Ficha sem Cálculo" : "Ficha Ausente";
    } catch (e) {
      mapa[c.id] = null;
      erros[c.id] = e?.message ?? String(e);
    }
  }
  return { mapa, divergencias, erros, epoca };
}

/* ---------- a escrita da sessão do personagem ---------- */

const motorAfty = MOTORES[MOTOR.AFTY];
const porId = (lista) => new Map((Array.isArray(lista) ? lista : []).map((x) => [x?.id ?? x, x]));

/**
 * A ação levou a sessão de `s0` a `s1`. Se a loja ainda tem `s0`, entra `s1`. Se tem outra versão (gravada por fora
 * no meio), a DIFERENÇA da ação é aplicada sobre ela, com as entradas novas do histórico e do registro, que o delta
 * não carrega.
 */
export function reaplicarSobre(atual, s0, s1, motor = motorAfty) {
  if (atual === s0 || !atual) return s1;
  /* RELATIVO NOS NÚMEROS (a regra do Desfazer, autor 2026-11-17): Vida, PE, Alma e as cascas por fonte levam a SOMA da ação
     por cima do valor de agora. Sem isto, o Mestre tirando 5 de Vida e o jogador tirando 1 ao mesmo tempo dava -1, e o
     dano do Mestre sumia (etapa 7b, a Sala). O resto vai pelo valor, como antes. */
  const relativo = (c) => (motor.relativos ?? []).some((p) => p.length === c.length && p.every((k, i) => k === "*" || k === c[i]));
  const delta = diferencaEstrutural(s0, s1, motor).map((m) => {
    if (typeof m.soma !== "number" || !relativo(m.caminho)) return m;
    const agora = valorEm(atual, m.caminho);
    return typeof agora === "number" ? { ...m, depois: agora + m.soma } : m;
  });
  let out = aplicarDelta(atual, delta, { conferir: false }).estado;
  for (const campo of ["historico", "log"]) {
    const antes = porId(s0?.[campo]);
    const novas = (s1?.[campo] ?? []).filter((x) => !antes.has(x?.id ?? x));
    if (novas.length) {
      const ja = porId(out?.[campo]);
      out = { ...out, [campo]: [...novas.filter((x) => !ja.has(x?.id ?? x)), ...(out?.[campo] ?? [])] };
    }
  }
  return out;
}

/* A sessão que é da FONTE (o personagem de um jogador na Sala, etapa 7b) volta para ela, e nunca para a loja: a loja
   grava em `fm_ficha_sessao_afty_v1:<id>`, que iria para a nuvem pessoal do Mestre. */
function gravarSessoes(antes, depois, fonte = null) {
  for (const [id, s1] of Object.entries(depois.sessoes ?? {})) {
    const s0 = antes.sessoes?.[id] ?? null;
    if (s1 === s0 || !s1) continue;
    const passo = (atual) => reaplicarSobre(atual, s0, s1);
    if (fonte?.tem(id)) fonte.atualizar(id, passo, s1);
    else atualizarNaLoja(id, passo);
  }
}

/* ---------- o gancho ---------- */

const vazio = Object.freeze({});

/**
 * `fonte` (a Sala, etapa 7b, `src/nuvem/sala-encontro.js`): o personagem de um jogador na Sala é ligado a uma ficha que não
 * está no aparelho do Mestre. `fonte.tem(id)` diz quais `fichaRef.id` são dela, `fonte.ler(id)` dá a sessão, `fonte.fichas`
 * as fichas, `fonte.ouvir(fn)` avisa, e `fonte.atualizar(id, passo, s1)` grava a diferença da ação. `aoExecutar(saida,
 * antes)` recebe cada ação que mudou o mundo (o registro da Sala).
 */
export default function useEncontro(encontroId, lista, {
  armazem = globalThis.localStorage, autor = AUTOR_LOCAL, onAtualizarBiblioteca = null, namespaceDaBiblioteca = null,
  fonte = null, aoExecutar = null,
} = {}) {
  const fonteRef = useRef(fonte);
  const aoExecutarRef = useRef(aoExecutar);
  useLayoutEffect(() => { fonteRef.current = fonte; aoExecutarRef.current = aoExecutar; });
  const grupo = lista.grupo;
  const encontro = useMemo(() => lista.encontros.find((e) => e.id === encontroId) ?? null, [lista.encontros, encontroId]);

  /* O inventário da lista, relido quando outra aba grava uma das chaves dele. A leitura é memorizada pelo texto
     (`lerInventario`), então a mesma ficha devolve o mesmo objeto e o cache do derive vale. */
  const [versaoInventario, setVersaoInventario] = useState(0);
  useEffect(() => {
    const chaves = new Set(CHAVES_INVENTARIO[grupo] ?? []);
    const aoMudar = (e) => { if (e.key == null || chaves.has(e.key)) setVersaoInventario((v) => v + 1); };
    window.addEventListener("storage", aoMudar);
    return () => window.removeEventListener("storage", aoMudar);
  }, [grupo]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const inventario = useMemo(() => inventarioDoGrupo(grupo, armazem), [grupo, armazem, versaoInventario]);
  const fichasDaFonte = fonte?.fichas ?? null;
  const fichas = useMemo(() => {
    const locais = fichasDoInventario(encontro, inventario);
    return fichasDaFonte ? { ...locais, ...fichasDaFonte } : locais;
  }, [encontro, inventario, fichasDaFonte]);
  const fichasRef = useRef(fichas);
  useEffect(() => { fichasRef.current = fichas; }, [fichas]);
  const inventarioRef = useRef(inventario);
  useEffect(() => { inventarioRef.current = inventario; }, [inventario]);

  /* As sessões dos ligados, numa assinatura só. A fotografia é o MESMO objeto enquanto nenhuma sessão mudar, que é o
     que o `useSyncExternalStore` exige. */
  const ids = useMemo(() => (encontro?.combatentes ?? []).filter(ehLigado).map((c) => c.fichaRef.id), [encontro]);
  const chaveIds = ids.join("|");
  const comFonte = !!fonte;
  const loja = useMemo(() => {
    const lista = chaveIds ? chaveIds.split("|") : [];
    const memo = { ultimo: null };
    const derivadoInicial = (id) => () => {
      const f = fichasRef.current?.[id];
      try { return f ? deriveAfty(f) : null; } catch { return null; }
    };
    const daFonte = (id) => !!fonteRef.current?.tem(id);
    return {
      assinar: (fn) => {
        const saidas = lista.filter((id) => !daFonte(id)).map((id) => ouvirDaLoja(id, fn));
        if (comFonte && fonteRef.current) saidas.push(fonteRef.current.ouvir(fn));
        return () => saidas.forEach((s) => s());
      },
      foto: () => {
        const valores = lista.map((id) => (daFonte(id) ? fonteRef.current.ler(id) : lerDaLoja(id, derivadoInicial(id))));
        const u = memo.ultimo;
        if (u && u.valores.length === valores.length && u.valores.every((v, i) => v === valores[i])) return u.obj;
        const obj = lista.length ? Object.fromEntries(lista.map((id, i) => [id, valores[i]])) : vazio;
        memo.ultimo = { valores, obj };
        return obj;
      },
    };
  }, [chaveIds, comFonte]);
  const sessoes = useSyncExternalStore(loja.assinar, loja.foto);

  const mundo = useMemo(() => (encontro ? mundoDe(encontro, sessoes, fichas) : null), [encontro, sessoes, fichas]);
  const calculo = useMemo(() => (mundo ? derivarMundo(mundo) : { mapa: {}, divergencias: [], erros: {}, epoca: 0 }), [mundo]);
  const derivados = calculo.mapa;

  const [aviso, setAviso] = useState(null);
  const limparAviso = useCallback(() => setAviso(null), []);

  /* O contexto das operações: os derivados de agora e o derive do estado já desfeito, para o teto do Desfazer. */
  const ctxDe = useCallback((m) => {
    const d = derivarMundo(m);
    return {
      derivados: d.mapa,
      derivar: (c, estado) => {
        const ficha = fichaDoCombatente(c, m.fichas);
        const mo = motorDe(c);
        if (!mo || !ficha || !estado) return null;
        try { return c.motor === MOTOR.M252 ? derivar252(ficha, estado) : mo.derivar(ficha, estado, d.epoca); } catch { return null; }
      },
    };
  }, []);

  /**
   * O núcleo: `fn(mundo de agora) -> { mundo, ...resultado }`. Grava o Encontro na lista e as sessões na loja, e
   * devolve o resultado. Exceção vira aviso, sem mudar nada.
   */
  const executar = useCallback((fn) => {
    let antes = null;
    let saida = null;
    lista.atualizar(encontroId, (eAtual) => {
      const sessoesAgora = {};
      const f = fonteRef.current;
      for (const c of eAtual.combatentes) {
        if (!ehLigado(c)) continue;
        sessoesAgora[c.fichaRef.id] = f?.tem(c.fichaRef.id) ? f.ler(c.fichaRef.id) : lerDaLoja(c.fichaRef.id);
      }
      antes = mundoDe(eAtual, sessoesAgora, fichasRef.current ?? {});
      try {
        saida = fn(antes) ?? { mundo: antes };
      } catch (e) {
        saida = { mundo: antes, ok: false, erro: e?.message ?? String(e), lancou: true };
      }
      return saida.mundo?.encontro ?? eAtual;
    });
    if (!saida) return { ok: false, erro: "Encontro Indisponível" };
    if (antes && saida.mundo && saida.mundo !== antes) {
      gravarSessoes(antes, saida.mundo, fonteRef.current);
      try { aoExecutarRef.current?.(saida, antes); } catch (e) { console.warn("[encontro] aoExecutar", e); }
    }
    if (saida.lancou) setAviso({ texto: saida.erro });
    return saida;
  }, [lista, encontroId]);

  const despachar = useCallback((acao) => executar((m) => {
    const precisa = ["COMECAR", "PROXIMO_TURNO", "NOVA_RODADA"].includes(acao.tipo);
    const comDerivados = precisa ? { ...acao, derivados: derivarMundo(m).mapa } : acao;
    return { mundo: redutorDoEncontro(m, comDerivados), ok: true };
  }), [executar]);

  /* Uma operação. "Nada Mudou" com o registro mexido (uma rolagem) ainda grava o registro: a rolagem não é operação,
     mas não pode sumir. */
  const operarIntencao = useCallback((intencao) => executar((m) => {
    const r = operar(m, { autor, ...intencao }, ctxDe(m));
    if (r.ok || !r.semMudanca || intencao.tipo !== "sessao") return r;
    const c = combatenteDe(m.encontro, intencao.alvo);
    const estado = estadoDoCombatente(c, m.sessoes);
    const proximo = estado ? intencao.passo(estado) : null;
    if (!proximo || proximo === estado) return r;
    return { mundo: comEstado(m, c.id, proximo), ok: true, soRegistro: true };
  }), [executar, ctxDe, autor]);

  const acoes = useMemo(() => {
    const novoCombatente = (entrada, { lado } = {}) => {
      const { ficha, chave, motor, tipo } = entrada;
      let derived = null;
      if (motor === MOTOR.AFTY) { try { derived = deriveAfty(ficha); } catch { derived = null; } }
      if (tipo === TIPO.PERSONAGEM) {
        const c = criarPersonagem(ficha, { chave, derived, lado: lado ?? LADO.JOGADOR });
        return { combatente: c, sessao: lerDaLoja(String(ficha.id), () => derived) };
      }
      return { combatente: criarCriatura(ficha, { chave, motor, derived, lado: lado ?? LADO.INIMIGO }) };
    };
    return {
      despachar,
      renomear: (nome) => despachar({ tipo: "RENOMEAR", nome }),
      /* Uma ficha do inventário, `quantidade` vezes (criatura). O personagem entra uma vez só. */
      adicionarFicha: (entrada, { quantidade = 1, lado, iniciativa = null } = {}) => executar((m) => {
        let mm = m;
        const n = entrada.tipo === TIPO.PERSONAGEM ? 1 : Math.max(1, Math.min(20, Math.trunc(Number(quantidade) || 1)));
        for (let i = 0; i < n; i += 1) mm = redutorDoEncontro(mm, { tipo: "ADICIONAR", ...novoCombatente(entrada, { lado }), iniciativa });
        return { mundo: mm, ok: true };
      }),
      adicionarMarcador: ({ nome, mod = 0, lado = LADO.JOGADOR, iniciativa = null }) =>
        despachar({ tipo: "ADICIONAR", combatente: criarMarcador({ nome, mod, lado }), iniciativa }),
      remover: (id) => despachar({ tipo: "REMOVER", id }),
      ajustarCombate: (id, ajustes) => despachar({ tipo: "AJUSTAR_COMBATE", id, ajustes }),
      /* O Atualizar da Ficha (6b): traz a ficha do inventário para a cópia, no estado de agora. */
      atualizarFicha: (id) => executar((m) => {
        const c = combatenteDe(m.encontro, id);
        const nova = fichaNovaDe(c, inventarioRef.current);
        if (!nova) return { mundo: m, ok: false, erro: "Ficha em Dia" };
        let derivado = null;
        if (c.motor === MOTOR.AFTY) { try { derivado = deriveAfty(nova); } catch { derivado = null; } }
        return { mundo: redutorDoEncontro(m, { tipo: "ATUALIZAR_FICHA", id, ficha: nova, derivado }), ok: true };
      }),
      definirIniciativa: (id, total) => despachar({ tipo: "DEFINIR_INICIATIVA", id, total }),
      definirMod: (id, mod) => despachar({ tipo: "DEFINIR_MOD", id, mod }),
      rolarUma: (id) => despachar({ tipo: "ROLAR_UMA", id, rolagem: Math.floor(Math.random() * 20) + 1 }),
      rolarTodas: (soVazias = false) => despachar({ tipo: "ROLAR_TODAS", soVazias }),
      definirLado: (id, lado) => despachar({ tipo: "DEFINIR_LADO", id, lado }),
      definirFlag: (id, chave, valor) => despachar({ tipo: "DEFINIR_FLAG", id, chave, valor }),
      definirVisao: (id, visao) => despachar({ tipo: "DEFINIR_VISAO", id, visao }),
      definirVisaoDeTodas: (visao) => executar((m) => {
        let mm = m;
        for (const c of m.encontro.combatentes) if (c.tipo !== TIPO.PERSONAGEM) mm = redutorDoEncontro(mm, { tipo: "DEFINIR_VISAO", id: c.id, visao });
        return { mundo: mm, ok: true };
      }),
      configurar: (chave, valor) => despachar({ tipo: "CONFIGURAR", chave, valor }),
      comecar: () => despachar({ tipo: "COMECAR" }),
      proximoTurno: () => despachar({ tipo: "PROXIMO_TURNO" }),
      novaRodada: () => despachar({ tipo: "NOVA_RODADA" }),
      encerrar: () => despachar({ tipo: "ENCERRAR" }),
      reabrir: () => despachar({ tipo: "REABRIR" }),
      levantarTodos: () => despachar({ tipo: "LEVANTAR_TODOS" }),
      operar: operarIntencao,
      dano: (alvo, valor, entrada = {}) => operarIntencao({ tipo: "dano", alvo, entrada: { ...entrada, valor } }),
      cura: (alvo, valor, entrada = {}) => operarIntencao({ tipo: "cura", alvo, entrada: { ...entrada, valor } }),
      /* A mudança que a Ficha G2 embutida (ou o painel da 2.5.2) manda: `passo(estado) -> estado`. */
      sessao: (alvo, passo, entrada = {}) => operarIntencao({ tipo: "sessao", alvo, passo, entrada }),
      emGrupo: (acao, valor, alvos) => executar((m) => acaoEmGrupo(m, { acao, valor, alvos, autor }, ctxDe(m))),
      desfazer: (alvo, operacaoId) => executar((m) => desfazer(m, { alvo, operacaoId }, autor, ctxDe(m))),
      aceitar: (pedidoId) => executar((m) => aceitarPedido(m, pedidoId, autor, ctxDe(m))),
      recusar: (pedidoId) => despachar({ tipo: "RECUSAR_PEDIDO", pedidoId, por: autor, em: Date.now() }),
    };
  }, [despachar, executar, operarIntencao, ctxDe, autor]);

  /* A MORTE DO FUNDAMENTO (DA-07), trazida do gancho de antes (`usar-encontro-afty.js`): o derivado diz o que registrar,
     a cópia do Encontro grava (`REGISTRAR_FUNDAMENTO_PERDIDO`, só na criatura copiada) e a biblioteca de origem recebe a
     perda. O personagem ligado grava na própria ficha pela Ficha dele, não por aqui. */
  /* Pelo TEXTO, e não pela identidade: o derivado muda a cada ação, e a mesma perda não pode ser despachada de novo a cada render. */
  const fundamentosAGravar = JSON.stringify(Object.entries(derivados)
    .filter(([, d]) => d?.tecnicaInata?.aRegistrar)
    .map(([id, d]) => [id, d.tecnicaInata.aRegistrar]));
  useEffect(() => {
    for (const [id, r] of JSON.parse(fundamentosAGravar)) despachar({ tipo: "REGISTRAR_FUNDAMENTO_PERDIDO", id, registro: { ...r, em: new Date().toISOString() } });
  }, [fundamentosAGravar, despachar]);
  const perdasDaBiblioteca = JSON.stringify((encontro?.combatentes ?? [])
    .filter((c) => !ehLigado(c) && c.ficha?.fundamentosPerdidos?.length)
    .map((c) => ({
      criaturaId: c.criaturaId, nome: c.nome,
      ficha: { id: c.ficha.id, name: c.ficha.name, rulesVersion: c.ficha.rulesVersion, fundamentosPerdidos: c.ficha.fundamentosPerdidos },
    })));
  const falhasDaBiblioteca = JSON.stringify(encontro?.fundamentosSemGravar ?? []);
  useEffect(() => {
    if (perdasDaBiblioteca === "[]") return;
    const r = sincronizarFundamentosNaBiblioteca(JSON.parse(perdasDaBiblioteca), undefined, namespaceDaBiblioteca);
    const bibliotecas = new Map(r.gravadas.map(({ sistema, namespace, biblioteca }) => [namespace ?? sistema, biblioteca]));
    for (const [sistema, biblioteca] of bibliotecas) onAtualizarBiblioteca?.(sistema, biblioteca);
    if (JSON.stringify(r.falhas) !== falhasDaBiblioteca) despachar({ tipo: "RESULTADO_FUNDAMENTOS_BIBLIOTECA", falhas: r.falhas });
  }, [perdasDaBiblioteca, falhasDaBiblioteca, onAtualizarBiblioteca, namespaceDaBiblioteca, despachar]);

  const derivado = useMemo(() => {
    if (!encontro || !mundo) return null;
    const ordem = ordenarPorIniciativa(encontro.combatentes);
    const resumos = {};
    for (const c of encontro.combatentes) {
      try { resumos[c.id] = resumoDoCombatente(c, { sessoes, derivados }); } catch { resumos[c.id] = null; }
    }
    const historico = [];
    for (const c of encontro.combatentes) {
      for (const op of historicoDe(estadoDoCombatente(c, sessoes))) historico.push({ ...op, combatente: c });
    }
    historico.sort((a, b) => (b.quando ?? 0) - (a.quando ?? 0));
    const desatualizados = {};
    for (const c of encontro.combatentes) if (fichaNovaDe(c, inventario)) desatualizados[c.id] = true;
    return {
      ordem,
      desatualizados,
      elegiveis: ordem.filter(jogaTurno),
      ativo: combatenteDe(encontro, encontro.ativoId),
      validacao: validarInicio(encontro),
      total: encontro.combatentes.length,
      abatidos: encontro.combatentes.filter((c) => c.flags.abatido).length,
      derivados,
      erros: calculo.erros,
      divergencias: calculo.divergencias,
      resumos,
      historico,
      pedidos: encontro.pedidos ?? [],
    };
  }, [encontro, mundo, sessoes, derivados, calculo, inventario]);

  return { encontro, mundo, sessoes, fichas, inventario, derivado, acoes, aviso, limparAviso };
}
