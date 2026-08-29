import { useMemo, useCallback } from "react";

import { deriveAfty } from "../afty-derive";
import { aplicarAddons, unirAddons, epocaAddons } from "../afty-addons";
import {
  aparaSessao, proximaRodada, descansar, sessaoEmBranco, iniciaCombate, entradaDaGuarda,
} from "../ficha/ficha-sessao";
import {
  ENCONTRO_STATUS, LADO, criarCombatente, criarJogador, renumerarCopias,
  ordenarPorIniciativa, rolarTodasIniciativas, definirIniciativa, rolarIniciativa,
  proximoTurno, validarInicio, podeTransicionar, entradaDeLog, LOG_TIPOS, LOG_MAX,
} from "./afty-encontro";

/**
 * ============================================================
 * UM ENCONTRO EM ANDAMENTO
 * ============================================================
 * Redutor puro (dicionário de handlers) mais autossalvamento pelo gerenciador,
 * na mesma arquitetura do `useEncounter` da 2.5.2.
 *
 * ⚠ O QUE NÃO VEIO JUNTO, e por quê: a 2.5.2 dispara `applyTriggeredEffects` e
 * `applyRoundStartResources` a cada `turn_start` / `round_end`, que é o motor de
 * automação DELA. O Afty tem outro (`afty-efeitos.js`), e nele um efeito de
 * rodada já é resolvido pelo `quando` a cada `deriveAfty` — não existe pilha de
 * gatilhos para disparar. Copiar aqueles ganchos criaria um segundo motor
 * fantasma. O que a virada de rodada faz no Afty é o que a Ficha já faz:
 * `proximaRodada`, que desce a duração de buffs e condições.
 *
 * ⚠ O `deriveAfty` roda UMA VEZ POR COMBATENTE COM FICHA, dentro de um `useMemo`
 * amarrado ao encontro. Um encontro de oito criaturas de ND alto custa uns 14ms,
 * e o alternativa (derivar dentro de cada linha da lista) recalcularia tudo a
 * cada tecla digitada num campo de PV.
 * ============================================================
 */

/* Deriva um combatente do jeito que a Ficha Final deriva: a bancada de combate e
   os buffs da SESSÃO entram, e a Alma corrente multiplica o PV.
   Jogador (sem ficha) devolve `null`, e todo consumidor trata esse caso. */
const derivarCombatente = (c) => {
  if (!c.ficha || !c.sessao) return null;
  try {
    /* ⚠ OS ADDONS NÃO SÃO APLICADOS AQUI. Quem os aplica é o memo `derivados`,
       UMA vez para o encontro inteiro, com a UNIÃO de todas as fichas. Ver o
       comentário lá: aplicar por combatente deixava o mundo com o addon do
       ÚLTIMO derivado depois do laço, e qualquer leitura de catálogo no render
       (um `getHabilidade` no painel) via um mundo arbitrário. */
    return deriveAfty(
      { ...c.ficha, combate: c.sessao.combate, buffsSessao: c.sessao.buffs },
      {
        almaAtual: c.sessao.almaAtual,
        concedido: c.sessao.concedido,
        adaptacoes: c.sessao.adaptacoes,
        // A Guarda Inabalável corrente, igual à Ficha: o bônus dela soma na
        // Defesa e nos cinco TRs desta mesma derivação.
        guarda: entradaDaGuarda(c.sessao),
      },
    );
  } catch {
    // Ficha de uma versão antiga que o derive não engole. O encontro continua
    // rodando com aquele combatente sem números, em vez de a tela toda cair.
    return null;
  }
};

/**
 * O mesmo derive, memorizado.
 *
 * ⚠ Sem isto, TODO combatente era re-derivado a cada patch (2026-08-10), porque
 * qualquer alteração devolve um objeto de encontro novo e o `useMemo` lá embaixo
 * depende dele inteiro. Uma tecla no campo de PV, um clique de +/-, uma rolagem
 * registrada ou uma entrada de log custavam os ~14ms por criatura VEZES N.
 *
 * A chave é o objeto `ficha`, que entra CLONADO uma vez em `criarCombatente` e
 * nunca mais muda de identidade (os patches fazem `{ ...c, sessao }`). Dois
 * combatentes da mesma criatura têm fichas clonadas separadas, e a cópia de um
 * encontro também, então não há colisão.
 *
 * ⚠ WeakMap de MÓDULO, e não `useRef`: ref lido durante o render é proibido
 * pelas regras do React (e o eslint pega). Como isto é cache de função PURA,
 * viver fora do componente é correto, e o WeakMap deixa o combatente removido
 * ser coletado sozinho, sem precisar de limpeza.
 */
const CACHE_DERIVE = new WeakMap();

const derivarComCache = (c, epoca) => {
  if (!c.ficha || !c.sessao) return null;
  const anterior = CACHE_DERIVE.get(c.ficha);
  // As três da sessão são exatamente o que o `derivarCombatente` lê. Mudou uma,
  // deriva de novo. Não mudou nenhuma, o número é o mesmo por definição.
  //
  // ⚠ A ÉPOCA DOS ADDONS entra na chave junto (2026-08-20). Hoje ela quase nunca
  // muda o número, porque addon só ACRESCENTA e todo id é prefixado, então uma
  // união maior não mexe em quem já estava. Mas essa é uma invariante da FASE 1,
  // e a fase 3 (remendar e desligar o raw) a quebra: lá, um addon que entra no
  // encontro pode mudar o número de quem já estava. Deixar a época fora da chave
  // hoje seria plantar um bug para aquele dia, e o custo é zero.
  if (anterior
    && anterior.combate === c.sessao.combate
    && anterior.buffs === c.sessao.buffs
    && anterior.alma === c.sessao.almaAtual
    && anterior.concedido === c.sessao.concedido
    && anterior.adaptacoes === c.sessao.adaptacoes
    && anterior.epoca === epoca) {
    return anterior.derived;
  }
  const derived = derivarCombatente(c);
  CACHE_DERIVE.set(c.ficha, {
    combate: c.sessao.combate,
    buffs: c.sessao.buffs,
    alma: c.sessao.almaAtual,
    /* ⚠ O CONCEDIDO ENTRA NA CHAVE, senão conceder no meio da luta não mudaria
       número nenhum: o cache devolveria o derivado de antes da concessão. Igual
       aos outros três, a comparação é por IDENTIDADE, e os escritores da sessão
       sempre devolvem lista nova. */
    concedido: c.sessao.concedido,
    adaptacoes: c.sessao.adaptacoes,
    epoca,
    derived,
  });
  return derived;
};

const comLog = (state, entradas) => ({
  ...state,
  log: [...entradas, ...state.log].slice(0, LOG_MAX),
});

const HANDLERS = {
  RENOMEAR: (s, { nome }) => ({ ...s, nome }),

  ADICIONAR: (s, { creature, derived, lado, iniciativa }) => {
    const novo = criarCombatente(creature, { lado: lado ?? LADO.INIMIGO, derived });
    // Reforço no meio da luta chega com a iniciativa já definida: sem isso ele
    // entraria com 0 e só jogaria na rodada seguinte.
    const pronto = iniciativa != null ? definirIniciativa(novo, iniciativa) : novo;
    return { ...s, combatentes: renumerarCopias([...s.combatentes, pronto]) };
  },

  ADICIONAR_JOGADOR: (s, { nome, mod, iniciativa }) => {
    const pc = criarJogador({ nome, mod });
    const pronto = iniciativa != null ? definirIniciativa(pc, iniciativa) : pc;
    return { ...s, combatentes: [...s.combatentes, pronto] };
  },

  REMOVER: (s, { id }) => ({
    ...s,
    combatentes: renumerarCopias(s.combatentes.filter((c) => c.id !== id)),
    ativoId: s.ativoId === id ? null : s.ativoId,
  }),

  DEFINIR_INICIATIVA: (s, { id, total }) => ({
    ...s,
    combatentes: s.combatentes.map((c) => (c.id === id ? definirIniciativa(c, total) : c)),
  }),

  DEFINIR_MOD: (s, { id, mod }) => ({
    ...s,
    combatentes: s.combatentes.map((c) => (
      c.id === id ? { ...c, iniciativa: { ...c.iniciativa, mod } } : c
    )),
  }),

  ROLAR_UMA: (s, { id }) => ({
    ...s,
    combatentes: s.combatentes.map((c) => {
      if (c.id !== id) return c;
      const { rolagem, total } = rolarIniciativa(c.iniciativa.mod);
      return { ...c, iniciativa: { ...c.iniciativa, rolagem, total, manual: false } };
    }),
  }),

  ROLAR_TODAS: (s, { soVazias }) => ({
    ...s,
    combatentes: rolarTodasIniciativas(s.combatentes, { soVazias }),
  }),

  DEFINIR_LADO: (s, { id, lado }) => ({
    ...s,
    combatentes: s.combatentes.map((c) => (
      c.id === id ? { ...c, flags: { ...c.flags, lado } } : c
    )),
  }),

  DEFINIR_FLAG: (s, { id, chave, valor }) => ({
    ...s,
    combatentes: s.combatentes.map((c) => (
      c.id === id ? { ...c, flags: { ...c.flags, [chave]: valor } } : c
    )),
  }),

  /* A sessão chega JÁ APARADA por quem chamou (a tela tem o `derived` daquele
     combatente na mão). Aparar de novo aqui exigiria derivar dentro do redutor,
     e redutor que deriva vira redutor caro. */
  PATCH_SESSAO: (s, { id, sessao }) => ({
    ...s,
    combatentes: s.combatentes.map((c) => (c.id === id ? { ...c, sessao } : c)),
  }),

  COMECAR: (s, { derivados = {} } = {}) => {
    if (!podeTransicionar(s.status, ENCONTRO_STATUS.ATIVO)) return s;
    const primeiro = ordenarPorIniciativa(s.combatentes)
      .find((c) => !c.flags.abatido && !c.flags.oculto) ?? null;
    return comLog({
      ...s,
      status: ENCONTRO_STATUS.ATIVO,
      rodada: 1,
      ativoId: primeiro?.id ?? null,
      // A rodada da sessão de cada um zera junto: ela contava a luta anterior.
      // ⚠ E a CENA começa aqui, então a casca de PE entra junto: o `iniciaCombate`
      // entrega a do gatilho `combate` (4 PE do Treino de Controle de Energia 2ª)
      // e já a da primeira rodada, senão o Completo só valeria da segunda em diante.
      combatentes: s.combatentes.map((c) => (
        c.sessao
          ? { ...c, sessao: iniciaCombate({ ...c.sessao, rodada: 1 }, derivados[c.id] ?? null) }
          : c
      )),
    }, [
      entradaDeLog({ rodada: 1, tipo: LOG_TIPOS.RODADA, mensagem: "Combate iniciado. Rodada 1." }),
      ...(primeiro
        ? [entradaDeLog({ rodada: 1, tipo: LOG_TIPOS.TURNO, mensagem: `Turno de ${primeiro.nome}.`, combatenteId: primeiro.id })]
        : []),
    ]);
  },

  PROXIMO_TURNO: (s, { derivados = {} } = {}) => {
    if (s.status !== ENCONTRO_STATUS.ATIVO) return s;
    const { proximoId, rodada, novaRodada } = proximoTurno(s);
    const entradas = [];
    let combatentes = s.combatentes;

    if (novaRodada) {
      // ⚠ A duração desce para TODOS na virada, e não no turno de cada um. É o
      // que a Ficha Final já faz em `proximaRodada`, e as duas telas precisam
      // contar as mesmas rodadas: um buff de 3 rodadas não pode durar mais na
      // mesa do mestre do que na ficha do jogador.
      combatentes = combatentes.map((c) => {
        if (!c.sessao) return c;
        // ⚠ O `derived` entra para a casca de PE do gatilho `rodada` voltar ao
        // teto. Sem ele o Completo do Treino de Controle de Energia valeria na
        // Ficha e não valeria na mesa do mestre, e as duas telas têm de contar
        // a mesma rodada.
        const { sessao, expirou } = proximaRodada(c.sessao, derivados[c.id] ?? null);
        for (const item of expirou) {
          entradas.push(entradaDeLog({
            rodada, tipo: LOG_TIPOS.CONDICAO, combatenteId: c.id,
            mensagem: `${item.nome} de ${c.nome} chegou ao fim.`,
          }));
        }
        return { ...c, sessao };
      });
      entradas.push(entradaDeLog({ rodada, tipo: LOG_TIPOS.RODADA, mensagem: `Rodada ${rodada} iniciada.` }));
    }

    if (proximoId) {
      const alvo = combatentes.find((c) => c.id === proximoId);
      entradas.push(entradaDeLog({
        rodada, tipo: LOG_TIPOS.TURNO, combatenteId: proximoId,
        mensagem: `Turno de ${alvo?.nome ?? "—"}.`,
      }));
    }
    return comLog({ ...s, combatentes, rodada, ativoId: proximoId }, entradas);
  },

  NOVA_RODADA: (s, { derivados = {} } = {}) => {
    if (s.status !== ENCONTRO_STATUS.ATIVO) return s;
    const rodada = s.rodada + 1;
    const entradas = [];
    const combatentes = s.combatentes.map((c) => {
      if (!c.sessao) return c;
      const { sessao, expirou } = proximaRodada(c.sessao, derivados[c.id] ?? null);
      for (const item of expirou) {
        entradas.push(entradaDeLog({
          rodada, tipo: LOG_TIPOS.CONDICAO, combatenteId: c.id,
          mensagem: `${item.nome} de ${c.nome} chegou ao fim.`,
        }));
      }
      return { ...c, sessao };
    });
    entradas.push(entradaDeLog({ rodada, tipo: LOG_TIPOS.RODADA, mensagem: `Rodada ${rodada} forçada.` }));
    return comLog({ ...s, combatentes, rodada }, entradas);
  },

  ENCERRAR: (s) => {
    if (!podeTransicionar(s.status, ENCONTRO_STATUS.FINALIZADO)) return s;
    return comLog(
      { ...s, status: ENCONTRO_STATUS.FINALIZADO, ativoId: null },
      [entradaDeLog({ rodada: s.rodada, tipo: LOG_TIPOS.RODADA, mensagem: "Combate encerrado." })],
    );
  },

  REABRIR: (s) => (
    podeTransicionar(s.status, ENCONTRO_STATUS.PLANEJANDO)
      ? { ...s, status: ENCONTRO_STATUS.PLANEJANDO, ativoId: null }
      : s
  ),

  /* Descanso de TODOS: recursos cheios e durações limpas. É o botão que prepara
     o encontro para rodar de novo sem duplicá-lo. */
  // ⚠ Combatente SEM derivados fica de fora (2026-08-09). `descansar` precisa do
  // máximo para reencher, e com `derived` null ele devolve `Math.max(0, null ?? 0)`,
  // ou seja, ZERA o PV e o PE. Uma ficha que o `derivarCombatente` não conseguiu
  // calcular já mostra "não pôde ser calculada" no painel, e o Descansar Todos
  // passava por cima disso apagando os recursos dela, sem desfazer.
  DESCANSAR_TODOS: (s, { derivados }) => ({
    ...s,
    combatentes: s.combatentes.map((c) => (
      (c.sessao && derivados[c.id]) ? { ...c, sessao: descansar(c.sessao, derivados[c.id]) } : c
    )),
  }),

  LEVANTAR_TODOS: (s) => ({
    ...s,
    combatentes: s.combatentes.map((c) => ({ ...c, flags: { ...c.flags, abatido: false } })),
  }),

  REGISTRAR: (s, { tipoLog, mensagem, combatenteId }) => comLog(s, [
    entradaDeLog({ rodada: s.rodada, tipo: tipoLog, mensagem, combatenteId }),
  ]),
};

/* Exportado para os testes de fumaça poderem rodar uma luta inteira sem React:
   a ordem dos turnos e a expiração por rodada são a parte que mais dói errada, e
   testá-las pela tela seria testar o React junto. */
export const redutorDeEncontro = (state, acao) => {
  const h = HANDLERS[acao.tipo];
  if (!h) return state;
  return h(state, acao);
};

export default function useEncontroAfty(encontroId, gerenciador) {
  const encontro = useMemo(
    () => gerenciador.encontros.find((e) => e.id === encontroId) ?? null,
    [gerenciador.encontros, encontroId],
  );

  const despachar = useCallback((acao) => {
    gerenciador.atualizar(encontroId, (prev) => redutorDeEncontro(prev, acao));
  }, [gerenciador, encontroId]);

  /* Um `deriveAfty` por combatente com ficha, e o mapa vale para a lista de
     iniciativa (PV máximo na barra), para o painel e para o resumo final.

     ⚠ CACHE POR COMBATENTE (2026-08-10). O memo depende do encontro INTEIRO,
     porque qualquer patch devolve um encontro novo, e antes disso ele re-derivava
     TODOS os combatentes a cada tecla no campo de PV, a cada clique de +/-, a
     cada rolagem e a cada entrada de log. Os ~14ms por criatura, vezes N, por
     tecla.

     O cache guarda as QUATRO coisas que o `derivarCombatente` realmente lê
     (`ficha`, `sessao.combate`, `sessao.buffs`, `sessao.almaAtual`) e compara por
     REFERÊNCIA. Nada mais do combatente entra na conta, então mexer em vida, log
     ou iniciativa reaproveita o derive de antes.

     Efeito colateral bom: o `derived` conserva a IDENTIDADE quando nada relevante
     muda, e com isso o memo de `deltaDosEstados` no PainelDeCombatente para de
     ser invalidado à toa, que era mais um `deriveAfty` por estado ligado. */
  const { mapa: derivados, divergencias: addonDivergencias } = useMemo(() => {
    /* ⚠ A UNIÃO DOS ADDONS DE TODOS OS COMBATENTES, aplicada UMA vez antes do
       laço. É o desenho da seção 3 do docs/afty-addons.md, e o autor mandou
       permitir encontro misto (2026-08-19): *"pode ser mudança mínima em uma
       única criatura"*.

       A união é segura nesta fase porque o addon só ACRESCENTA e todo id nasce
       prefixado, então dois pacotes nunca disputam a mesma entrada.

       Aplicar por COMBATENTE, que era como estava, tinha dois defeitos: o mundo
       ficava com o addon do último derivado depois do laço (e qualquer leitura
       de catálogo no render via um mundo arbitrário), e o custo era o catálogo
       inteiro reescrito N vezes em vez de uma. */
    const { pacotes, divergencias } = unirAddons(
      (encontro?.combatentes ?? []).map((c) => c.ficha).filter(Boolean),
    );
    aplicarAddons(pacotes);
    const epoca = epocaAddons();

    const mapa = {};
    for (const c of encontro?.combatentes ?? []) mapa[c.id] = derivarComCache(c, epoca);
    return { mapa, divergencias };
  }, [encontro]);

  const acoes = useMemo(() => ({
    renomear: (nome) => despachar({ tipo: "RENOMEAR", nome }),
    adicionar: (creature, opcoes = {}) => despachar({
      tipo: "ADICIONAR", creature,
      // O derive de ENTRADA roda aqui, uma vez, só para a sessão nascer cheia.
      derived: (() => { try { return deriveAfty(creature); } catch { return null; } })(),
      ...opcoes,
    }),
    adicionarJogador: (nome, mod = 0, iniciativa = null) =>
      despachar({ tipo: "ADICIONAR_JOGADOR", nome, mod, iniciativa }),
    remover: (id) => despachar({ tipo: "REMOVER", id }),
    definirIniciativa: (id, total) => despachar({ tipo: "DEFINIR_INICIATIVA", id, total }),
    definirMod: (id, mod) => despachar({ tipo: "DEFINIR_MOD", id, mod }),
    rolarUma: (id) => despachar({ tipo: "ROLAR_UMA", id }),
    rolarTodas: (soVazias = false) => despachar({ tipo: "ROLAR_TODAS", soVazias }),
    definirLado: (id, lado) => despachar({ tipo: "DEFINIR_LADO", id, lado }),
    definirFlag: (id, chave, valor) => despachar({ tipo: "DEFINIR_FLAG", id, chave, valor }),
    comecar: () => despachar({ tipo: "COMECAR", derivados }),
    proximoTurno: () => despachar({ tipo: "PROXIMO_TURNO", derivados }),
    novaRodada: () => despachar({ tipo: "NOVA_RODADA", derivados }),
    encerrar: () => despachar({ tipo: "ENCERRAR" }),
    reabrir: () => despachar({ tipo: "REABRIR" }),
    levantarTodos: () => despachar({ tipo: "LEVANTAR_TODOS" }),
    descansarTodos: () => despachar({ tipo: "DESCANSAR_TODOS", derivados }),
    registrar: (tipoLog, mensagem, combatenteId = null) =>
      despachar({ tipo: "REGISTRAR", tipoLog, mensagem, combatenteId }),
    /* Escrita da sessão de um combatente. O `fn` recebe a sessão APARADA e o
       resultado é aparado de novo, exatamente como o `atualiza` da Ficha. */
    patchSessao: (id, fn) => {
      const alvo = encontro?.combatentes.find((c) => c.id === id);
      if (!alvo?.sessao) return;
      const d = derivados[id] ?? null;
      const antes = aparaSessao(alvo.sessao, d);
      despachar({ tipo: "PATCH_SESSAO", id, sessao: aparaSessao(fn(antes), d) });
    },
  }), [despachar, encontro, derivados]);

  const derivado = useMemo(() => {
    if (!encontro) return null;
    const ordem = ordenarPorIniciativa(encontro.combatentes);
    return {
      ordem,
      elegiveis: ordem.filter((c) => !c.flags.abatido && !c.flags.oculto),
      ativo: encontro.combatentes.find((c) => c.id === encontro.ativoId) ?? null,
      validacao: validarInicio(encontro),
      total: encontro.combatentes.length,
      abatidos: encontro.combatentes.filter((c) => c.flags.abatido).length,
      derivados,
      /* Mesmo pacote de addon em duas fichas com versões DIFERENTES. Vale a
         primeira e a divergência é relatada, porque escolher sozinho qual versão
         vence mudaria números de uma ficha que o dono não abriu. Lista vazia é o
         caso normal. */
      addonDivergencias,
    };
  }, [encontro, derivados, addonDivergencias]);

  return { encontro, derivado, acoes };
}

export { derivarCombatente, sessaoEmBranco };
