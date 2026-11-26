/* O ENCONTRO DO MESTRE LIGADO À SALA (Encontro Unificado, etapa 7b, 2026-11-18).

   O Mestre que abre a Sala segue rodando o Encontro no aparelho dele (a lista de Encontros, o redutor, as telas da 6a), e
   esta ligação conversa com a Sala nos dois sentidos:

   SOBE   o cadastro dos combatentes (pôr, tirar, nome, lado, visão), o estado da luta (status, rodada, Aceitar Sozinho, a
          ordem completa e a vez), a ficha e a sessão de cada criatura e de cada personagem que o Mestre pôs, o resumo
          derivado de todo combatente que ele deriva, e cada operação e evento do Encontro no registro.
   DESCE  os personagens que os jogadores puseram (entram no Encontro ligados à Sala), as sessões deles, e os pedidos.

   ⚠ A SESSÃO DO JOGADOR NUNCA PASSA PELA LOJA DO MESTRE. Ela vem por uma FONTE (`useEncontro`, opção `fonte`) que lê e grava
   em `sala_fichas`, porque a loja gravaria em `fm_ficha_sessao_afty_v1:<id>` e a nuvem pessoal do Mestre levaria a sessão
   de outra pessoa.

   ⚠ O QUE SOBE NA SESSÃO DO JOGADOR É A VERSÃO QUE ELE PODE LER: o id de toda criatura Oculta vira apelido
   (`sessaoParaODono`, sala-oculto.js, decisão do autor "Apelido Opaco"), e a leitura traduz de volta.

   O co-Mestre (decisão do autor, 2026-11-18, "Mexe nas Fichas") lê tudo e mexe nas sessões: a mudança dele numa criatura
   chega aqui como versão nova da linha e entra no Encontro. Turno e iniciativa seguem neste aparelho. */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
/* Os motores entram PRIMEIRO (ver o topo de encontros/modelo.js). */
import { motorDe, MOTORES } from "../systems/afty/encontros/motores/index";
import {
  MOTOR, TIPO, ehLigado, fichaDoCombatente, estadoDoCombatente, combatenteDe, idNovo, campoDoEstado,
} from "../systems/afty/encontros/modelo";
import { ordenarPorIniciativa, ENCONTRO_STATUS } from "../systems/afty/encontros/afty-encontro";
import { reaplicarSobre } from "../systems/afty/encontros/usar-encontro";
import { aplicarRemoto, ler as lerDaLoja } from "../systems/afty/ficha/sessao-loja";
import { deriveAfty } from "../systems/afty/afty-derive";
import { estavel, FASE } from "./sala-cliente";
import { sessaoParaODono, sessaoDoMestre } from "./sala-oculto";
import { sinaisDoJogador, guardarSinais, rolagensNovas, rolagemParaASala, nomesDosMembros } from "./sala-telas";
import { registroParaGuardar, idDoFinalizado, marcarRecebida } from "./sala-fechamento";

export const CHAVE_DA_SALA = "sala";
const ATRASO_SESSAO = 300;

const ehDaSala = (c) => c?.tipo === TIPO.PERSONAGEM && c?.fichaRef?.chave === CHAVE_DA_SALA;
const ocultosDe = (encontro) => (encontro?.combatentes ?? [])
  .filter((c) => c.tipo !== TIPO.PERSONAGEM && c.visao === "oculta").map((c) => c.id);
const idsDe = (encontro) => (encontro?.combatentes ?? []).map((c) => c.id);
const segredoDe = (encontro) => encontro?.sala?.segredo ?? "";

/** O personagem de um jogador, como o Encontro do Mestre o guarda: ligado à Sala pelo id do combatente. */
export function combatenteDaSala(resumo, ficha = null) {
  let mod = 0;
  if (ficha) { try { mod = Math.trunc(Number(deriveAfty(ficha)?.iniciativa) || 0); } catch { mod = 0; } }
  return {
    id: resumo.combatente,
    motor: MOTOR.AFTY,
    tipo: TIPO.PERSONAGEM,
    nome: resumo.nome,
    fichaRef: { chave: CHAVE_DA_SALA, id: resumo.combatente },
    iniciativa: { rolagem: 0, mod, total: 0, manual: false },
    flags: { abatido: false, foraDaOrdem: false, lado: resumo.lado ?? "jogador" },
    visao: null,
    dono: { conta: resumo.dono, papel: "jogador" },
  };
}

/**
 * A sessão que sobe de um combatente do Mestre (criatura, ou personagem que o Mestre pôs). A edição local vai por cima da
 * versão do banco (relativa nos números), e o id de toda Oculta vira apelido (revisão final, 2026-11-18, "Corrigir Agora"): a
 * criatura Aberta é lida inteira por todo membro, e o Aplicado Por de uma Oculta contaria que ela existe. `base` fica na
 * VISTA DO MESTRE (ids de verdade), senão a troca dos apelidos pareceria edição.
 */
export function sessaoQueSobe({ remota, base, local, segredo = "", ids = [], ocultos = [], motor = null }) {
  const vista = remota ? sessaoDoMestre(remota, { segredo, ids }) : null;
  const novo = vista && base && estavel(vista) !== estavel(base) ? reaplicarSobre(vista, base, local, motor ?? undefined) : local;
  return sessaoParaODono(novo, { segredo, ocultos });
}

/**
 * A sessão do personagem de um jogador que sobe pelo Mestre: os passos da ação (um, ou os que desistiram antes e o Tentar de
 * Novo refaz) por cima da versão do banco na vista do Mestre, e a volta com os apelidos.
 */
export function sessaoDoJogadorQueSobe({ remota, passos, segredo = "", ids = [], ocultos = [] }) {
  const vista = remota ? sessaoDoMestre(remota, { segredo, ids }) : null;
  return sessaoParaODono(passos.reduce((s, p) => p(s), vista), { segredo, ocultos });
}

/** A operação como o banco a recebe (JSON puro). O autor é reescrito lá. */
const paraASala = (op) => JSON.parse(JSON.stringify(op));

/* Os eventos do Mestre que o Registro público mostra, da diferença entre dois Encontros. Exportado para o assert. */
export function eventosEntre(antes, depois) {
  const ev = [];
  if (!antes || !depois) return ev;
  if (antes.status !== depois.status) {
    // O Reabrir volta à luta desde o rework (etapa 2, 2026-11-23): do Finalizado para Em Combate é "reabrir", nunca um Começar novo.
    const reabriu = antes.status === ENCONTRO_STATUS.FINALIZADO
      && (depois.status === ENCONTRO_STATUS.ATIVO || depois.status === ENCONTRO_STATUS.PLANEJANDO);
    if (reabriu) ev.push({ evento: "reabrir", ...(depois.status === ENCONTRO_STATUS.ATIVO ? { rodada: depois.rodada } : {}) });
    else if (depois.status === ENCONTRO_STATUS.ATIVO) ev.push({ evento: "comecar", rodada: depois.rodada });
    if (depois.status === ENCONTRO_STATUS.FINALIZADO) ev.push({ evento: "encerrar", rodada: depois.rodada });
  }
  if (depois.status === ENCONTRO_STATUS.ATIVO && antes.status === ENCONTRO_STATUS.ATIVO && depois.rodada !== antes.rodada) {
    ev.push({ evento: "rodada", rodada: depois.rodada });
  }
  if (depois.ativoId && depois.ativoId !== antes.ativoId) ev.push({ evento: "turno", rodada: depois.rodada, combatente: depois.ativoId });
  return ev;
}

/**
 * A ligação. `cliente` é o da Sala (sala-cliente.js), `lista` a lista de Encontros do grupo, `encontroId` o Encontro que
 * a Sala carrega. Devolve `{ sala, fechar }`: `sala` vai para o `EncontroTela` (`fonte`, `autor`, `aoExecutar`, `aoEstado`).
 */
export function useSalaDoEncontro({ cliente, lista, encontroId }) {
  const retrato = useSyncExternalStore(cliente.ouvir, cliente.ler);
  const conta = retrato.eu?.conta ?? null;
  const encontro = useMemo(() => lista.encontros.find((e) => e.id === encontroId) ?? null, [lista.encontros, encontroId]);
  const segredo = encontro?.sala?.segredo ?? "";
  const encontroRef = useRef(encontro);
  const estadoRef = useRef(null);
  const listaRef = useRef(lista);
  useLayoutEffect(() => { encontroRef.current = encontro; listaRef.current = lista; });

  const autor = useMemo(() => ({ conta, papel: "mestre", combatente: null }), [conta]);

  /* ---------- a fonte: as sessões e fichas dos personagens dos jogadores ---------- */

  /* AS ESCRITAS QUE DESISTEM (7c, a-fazer da 7b): depois de todas as tentativas a rede ou o conflito vence e a operação já está
     no Registro, mas a sessão não mudou. A tela mostra o aviso com Tentar de Novo, e some sozinho quando a escrita volta. */
  const [falhas, setFalhas] = useState([]);
  const registrarFalha = useCallback((onde, err) => {
    console.warn(`[sala] ${onde}`, err?.codigo ?? err);
    setFalhas((f) => (f.some((x) => x.onde === onde) ? f : [...f, { onde, codigo: err?.codigo ?? "Falha na Sala", rede: !!err?.rede }]));
  }, []);
  const resolvida = useCallback((onde) => setFalhas((f) => (f.some((x) => x.onde === onde) ? f.filter((x) => x.onde !== onde) : f)), []);
  const emCurso = useRef(new Set());

  const otimistas = useRef(new Map());
  /* A sessão de jogador cuja escrita desistiu: os passos guardados, que o Tentar de Novo aplica por cima da versão de agora. */
  const desistidas = useRef(new Map());
  const traducoes = useRef(new WeakMap());
  const ouvintesLocais = useRef(new Set());
  const avisarLocais = () => { for (const fn of [...ouvintesLocais.current]) fn(); };

  const fichasDaFonte = useMemo(() => {
    const out = {};
    for (const [id, partes] of Object.entries(retrato.fichas ?? {})) {
      const res = retrato.resumos?.[id];
      if (res?.tipo === TIPO.PERSONAGEM && res.dono && partes.ficha?.dados) out[id] = partes.ficha.dados;
    }
    return out;
  }, [retrato.fichas, retrato.resumos]);

  const tem = useCallback((id) => {
    const res = cliente.ler().resumos?.[id];
    return res?.tipo === TIPO.PERSONAGEM && !!res.dono;
  }, [cliente]);

  const lerFonte = useCallback((id) => {
    if (otimistas.current.has(id)) return otimistas.current.get(id);
    const dados = cliente.ler().fichas?.[id]?.sessao?.dados ?? null;
    if (!dados) return null;
    const memo = traducoes.current.get(dados);
    const chaveIds = idsDe(encontroRef.current).join("|");
    if (memo && memo.chaveIds === chaveIds) return memo.valor;
    const valor = sessaoDoMestre(dados, { segredo, ids: idsDe(encontroRef.current) });
    traducoes.current.set(dados, { chaveIds, valor });
    return valor;
  }, [cliente, segredo]);

  const gravarSessaoDoJogador = useCallback((id, passos) => cliente.gravarParte(id, "sessao", (remota) => sessaoDoJogadorQueSobe({
    remota, passos, segredo, ids: idsDe(encontroRef.current), ocultos: ocultosDe(encontroRef.current),
  })).then(() => resolvida("sessão do jogador"))
    .catch((e) => {
      // A ação já está no Registro: o passo fica guardado para o Tentar de Novo, e não se perde calado.
      desistidas.current.set(id, [...(desistidas.current.get(id) ?? []), ...passos]);
      registrarFalha("sessão do jogador", e);
    }), [cliente, segredo, registrarFalha, resolvida]);

  const fonte = useMemo(() => ({
    tem,
    ler: lerFonte,
    fichas: fichasDaFonte,
    ouvir: (fn) => {
      ouvintesLocais.current.add(fn);
      const sair = cliente.ouvir(fn);
      return () => { ouvintesLocais.current.delete(fn); sair(); };
    },
    atualizar: (id, passo, s1) => {
      otimistas.current.set(id, s1);
      avisarLocais();
      gravarSessaoDoJogador(id, [passo]).finally(() => { otimistas.current.delete(id); avisarLocais(); });
    },
  }), [tem, lerFonte, fichasDaFonte, cliente, gravarSessaoDoJogador]);

  /* O que a sincronização lembra de uma rodada para a outra. */
  const pendentes = useRef(new Set());
  const removendo = useRef(new Set());
  const fichasPublicadas = useRef(new Map());
  const bases = useRef(new Map()); // combatente -> { dados, versao, local } da sessão que subiu (ou desceu)
  const timers = useRef(new Map());
  const aceitosSozinhos = useRef(new Set());
  const fechando = useRef(false);
  const iniciados = useRef(new Set());

  /* ---------- o que o Mestre faz vai para o registro ---------- */

  const aoExecutar = useCallback((saida, antes) => {
    const r = cliente.ler();
    const pedidosDaSala = new Set(Object.values(r.operacoes ?? {}).filter((o) => o.especie === "pedido").map((o) => o.operacao_id));
    const ops = [...(saida.operacao ? [saida.operacao] : []), ...(saida.operacoes ?? [])];
    for (const op of ops) {
      const promessa = op.pedido?.estado === "aceito" && pedidosDaSala.has(op.id)
        ? cliente.responderPedido(op.id, true, paraASala(op))
        : cliente.registrar("operacao", paraASala(op));
      promessa.catch((e) => registrarFalha("operação", e));
    }
    // As rolagens que a Ficha anotou (a do Mestre numa criatura, a do Mestre no personagem de um jogador) viram linha do Registro.
    const depoisM = saida.mundo;
    for (const c of depoisM?.encontro?.combatentes ?? []) {
      const antesC = antes.encontro?.combatentes?.find((x) => x.id === c.id);
      if (!antesC || c.tipo === TIPO.MARCADOR) continue;
      for (const rol of rolagensNovas(estadoDoCombatente(antesC, antes.sessoes), estadoDoCombatente(c, depoisM.sessoes))) {
        cliente.registrar("rolagem", { id: `rol:${rol.id}`, combatente: c.id, rolagem: rolagemParaASala(rol) })
          .catch((e) => registrarFalha("rolagem", e));
      }
    }
    const depois = saida.mundo?.encontro;
    // Pedido recusado: saiu da lista sem operação com o id dele.
    const comOp = new Set(ops.map((o) => o.id));
    for (const p of antes.encontro?.pedidos ?? []) {
      if (!pedidosDaSala.has(p.id) || comOp.has(p.id) || (depois?.pedidos ?? []).some((x) => x.id === p.id)) continue;
      cliente.responderPedido(p.id, false).catch((e) => registrarFalha("recusa", e));
    }
    for (const ev of eventosEntre(antes.encontro, depois)) {
      cliente.registrar("sistema", { id: idNovo("ev"), ...ev }).catch((e) => registrarFalha("evento", e));
    }
    // O Mestre tirou o personagem de um jogador do Encontro: sai da Sala também.
    const ficou = new Set((depois?.combatentes ?? []).map((c) => c.id));
    for (const c of antes.encontro?.combatentes ?? []) {
      if (ehDaSala(c) && !ficou.has(c.id)) {
        removendo.current.add(c.id);
        cliente.removerCombatente(c.id).catch((e) => registrarFalha("tirar", e));
      }
    }
  }, [cliente, registrarFalha]);

  /* ---------- a sincronização, a cada mudança do Encontro ou da Sala ---------- */

  const sincronizar = useCallback(() => {
    const r = cliente.ler();
    const e = encontroRef.current;
    const est = estadoRef.current;
    const l = listaRef.current;
    if (!e || r.fase !== FASE.PRONTA || r.eu?.papel !== "mestre" || fechando.current) return;
    const falha = (onde) => (err) => registrarFalha(onde, err);

    /* 1. Os personagens dos jogadores entram (e saem) do Encontro. */
    const noEncontro = new Set(e.combatentes.map((c) => c.id));
    const daSala = Object.values(r.resumos ?? {}).filter((x) => x.tipo === TIPO.PERSONAGEM && x.dono);
    const novos = daSala.filter((x) => !noEncontro.has(x.combatente) && !removendo.current.has(x.combatente));
    const sairam = e.combatentes.filter((c) => ehDaSala(c) && !r.resumos?.[c.id]);
    if (novos.length || sairam.length) {
      const fora = new Set(sairam.map((c) => c.id));
      l.atualizar(e.id, (atual) => ({
        ...atual,
        combatentes: [
          ...atual.combatentes.filter((c) => !fora.has(c.id)),
          ...novos.filter((x) => !atual.combatentes.some((c) => c.id === x.combatente))
            .map((x) => combatenteDaSala(x, r.fichas?.[x.combatente]?.ficha?.dados ?? null)),
        ],
      }));
    }
    for (const id of [...removendo.current]) if (!r.resumos?.[id]) removendo.current.delete(id);

    /* 1b. A sessão do jogador que chega com a luta já começada (ele entrou depois do Começar, ou a sessão dele chegou depois):
       o combate começa nela também, como o Começar faz com quem já estava. Uma vez por combatente e por luta. */
    if (e.status === ENCONTRO_STATUS.ATIVO) {
      for (const c of e.combatentes) {
        if (!ehDaSala(c) || iniciados.current.has(c.id)) continue;
        const s = fonte.ler(c.id);
        if (!s) continue;
        iniciados.current.add(c.id);
        if (s.combate?.ativo) continue;
        const d = est?.derivado?.derivados?.[c.id] ?? null;
        // A rodada da sessão acompanha a da luta (o verbo começa na 1).
        const rodada = Math.max(1, Number(e.rodada) || 1);
        const comecar = (atual) => (atual && !atual.combate?.ativo ? { ...MOTORES[MOTOR.AFTY].iniciaCombate(atual, d), rodada } : atual);
        fonte.atualizar(c.id, comecar, comecar(s));
      }
    } else {
      iniciados.current.clear();
    }

    /* 2. O cadastro dos combatentes do Mestre. */
    for (const c of e.combatentes) {
      if (ehDaSala(c)) {
        const res = r.resumos?.[c.id];
        if (res && res.lado !== c.flags.lado) cliente.adicionarCombatente({ combatente: c.id, tipo: res.tipo, nome: res.nome, lado: c.flags.lado }).catch(falha("lado"));
        continue;
      }
      const res = r.resumos?.[c.id];
      if (!res) {
        if (pendentes.current.has(c.id)) continue;
        pendentes.current.add(c.id);
        cliente.adicionarCombatente({
          combatente: c.id, tipo: c.tipo, nome: c.nome, lado: c.flags.lado, visao: c.tipo === TIPO.PERSONAGEM ? null : c.visao,
        }).catch(falha("pôr")).finally(() => { pendentes.current.delete(c.id); cliente.relerTudo().catch(falha("reler")); });
        continue;
      }
      if (c.tipo !== TIPO.PERSONAGEM && c.visao && res.visao !== c.visao) cliente.definirVisao(c.id, c.visao).catch(falha("visão"));
      if (res.nome !== c.nome || res.lado !== c.flags.lado) {
        cliente.adicionarCombatente({ combatente: c.id, tipo: c.tipo, nome: c.nome, lado: c.flags.lado }).catch(falha("nome"));
      }
    }
    for (const res of Object.values(r.resumos ?? {})) {
      if (noEncontro.has(res.combatente) || res.dono || pendentes.current.has(res.combatente)) continue;
      removendo.current.add(res.combatente);
      cliente.removerCombatente(res.combatente).catch(falha("tirar"));
    }

    /* 3. A ficha e a sessão de cada combatente do Mestre (com o que o co-Mestre mudou descendo). */
    const fichasDoMundo = est?.fichas ?? {};
    const sessoesDoMundo = est?.sessoes ?? {};
    for (const c of e.combatentes) {
      if (ehDaSala(c) || c.tipo === TIPO.MARCADOR || !r.resumos?.[c.id]) continue;
      const ficha = fichaDoCombatente(c, fichasDoMundo);
      if (ficha && fichasPublicadas.current.get(c.id) !== ficha) {
        fichasPublicadas.current.set(c.id, ficha);
        cliente.gravarParte(c.id, "ficha", () => ficha).catch(falha("ficha"));
      }
      const linha = r.fichas?.[c.id]?.sessao ?? null;
      const base = bases.current.get(c.id);
      if (linha && base && Number(linha.versao) > Number(base.versao) && linha.atualizado_por !== conta) {
        // O co-Mestre mexeu: a versão dele entra no Encontro, com os apelidos traduzidos de volta.
        const vista = sessaoDoMestre(linha.dados, { segredo: segredoDe(e), ids: idsDe(e) });
        bases.current.set(c.id, { dados: vista, versao: linha.versao });
        if (ehLigado(c)) aplicarRemoto(c.fichaRef.id, vista);
        else {
          const campo = campoDoEstado(c);
          l.atualizar(e.id, (atual) => ({ ...atual, combatentes: atual.combatentes.map((x) => (x.id === c.id ? { ...x, [campo]: vista } : x)) }));
        }
        continue;
      }
      const local = ehLigado(c) ? (sessoesDoMundo[c.fichaRef.id] ?? lerDaLoja(c.fichaRef.id)) : estadoDoCombatente(c, sessoesDoMundo);
      if (!local || (base && base.local === local)) continue;
      clearTimeout(timers.current.get(c.id));
      timers.current.set(c.id, setTimeout(() => {
        const b = bases.current.get(c.id);
        const agora = encontroRef.current;
        const opcoes = { segredo: segredoDe(agora), ids: idsDe(agora), ocultos: ocultosDe(agora) };
        cliente.gravarParte(c.id, "sessao", (remota) => sessaoQueSobe({ remota, base: b?.dados ?? null, local, motor: motorDe(c), ...opcoes }))
          .then((res) => {
            const vista = res.dados ? sessaoDoMestre(res.dados, opcoes) : res.dados;
            bases.current.set(c.id, { dados: vista, versao: res.versao, local });
            resolvida("sessão");
          })
          .catch(falha("sessão"));
      }, ATRASO_SESSAO));
    }

    /* 4. O resumo de quem o Mestre deriva (o do jogador também: assim o resumo fica em dia com o dono fora). */
    for (const c of e.combatentes) {
      if (c.tipo === TIPO.MARCADOR || !r.resumos?.[c.id]) continue;
      const resumo = est?.derivado?.resumos?.[c.id];
      if (resumo) cliente.publicarResumo(c.id, resumo).catch(falha("resumo"));
    }

    /* 5. O estado da luta e a ordem completa. */
    const naSala = (id) => !!r.resumos?.[id];
    cliente.gravarEstado({
      status: e.status,
      rodada: Math.max(1, Number(e.rodada) || 1),
      config: { aceitarSozinho: !!e.config?.aceitarSozinho },
      ordem: ordenarPorIniciativa(e.combatentes).map((c) => c.id).filter(naSala),
      vez: e.ativoId && naSala(e.ativoId) ? e.ativoId : null,
    }).catch(falha("estado"));

    /* 6. Os pedidos pendentes da Sala viram os pedidos do Encontro. */
    const pendentesDaSala = Object.values(r.operacoes ?? {})
      .filter((o) => o.especie === "pedido" && o.estado_pedido === "pendente" && combatenteDe(e, o.dados?.alvo));
    const idsPendentes = new Set(pendentesDaSala.map((o) => o.operacao_id));
    const faltam = pendentesDaSala.filter((o) => !(e.pedidos ?? []).some((p) => p.id === o.operacao_id));
    const respondidos = (e.pedidos ?? []).filter((p) => !idsPendentes.has(p.id)
      && Object.values(r.operacoes ?? {}).some((o) => o.especie === "pedido" && o.operacao_id === p.id));
    if (faltam.length || respondidos.length) {
      const fora = new Set(respondidos.map((p) => p.id));
      l.atualizar(e.id, (atual) => ({
        ...atual,
        pedidos: [
          ...(atual.pedidos ?? []).filter((p) => !fora.has(p.id)),
          ...faltam.filter((o) => !(atual.pedidos ?? []).some((p) => p.id === o.operacao_id))
            .map((o) => ({ ...o.dados, delta: o.dados.delta ?? [], pedido: { estado: "pendente", em: o.dados.quando ?? Date.parse(o.criado_em) } })),
        ],
      }));
    }
    if (e.config?.aceitarSozinho && est?.acoes) {
      for (const p of e.pedidos ?? []) {
        if (!idsPendentes.has(p.id) || aceitosSozinhos.current.has(p.id)) continue;
        aceitosSozinhos.current.add(p.id);
        est.acoes.aceitar(p.id);
      }
    }

    /* 7. Os sinais dos jogadores (iniciativa e Encerrar Meu Turno, 7c). Cada um age uma vez: o que já foi tratado mora no
       Encontro (`sala.sinais`), e o que está a caminho de ser gravado, na memória, para o próximo ciclo não repetir. */
    if (est?.acoes) {
      const { agir, tratados } = sinaisDoJogador({ operacoes: r.operacoes, resumos: r.resumos, encontro: e });
      const novos = tratados.filter((id) => !emCurso.current.has(id));
      if (novos.length) {
        for (const id of novos) emCurso.current.add(id);
        for (const sinal of agir.filter((x) => novos.includes(x.id))) {
          if (sinal.tipo === "iniciativa") est.acoes.definirIniciativa(sinal.combatente, sinal.total);
          else est.acoes.proximoTurno();
        }
        l.atualizar(e.id, (atual) => ({ ...atual, sala: { ...(atual.sala ?? {}), sinais: guardarSinais(atual.sala?.sinais, novos) } }));
      }
    }
  }, [cliente, conta, fonte, registrarFalha, resolvida]);

  /* O EncontroTela entrega o estado do gancho a cada render, e a Sala avisa a cada evento. */
  const agendado = useRef(null);
  const agendar = useCallback(() => {
    if (agendado.current) return;
    agendado.current = setTimeout(() => { agendado.current = null; sincronizar(); }, 60);
  }, [sincronizar]);
  useEffect(() => cliente.ouvir(agendar), [cliente, agendar]);
  // Zera a referência junto: o StrictMode do dev desmonta e monta de novo, e um timer cancelado que ficasse guardado
  // travaria o `agendar` para sempre.
  useEffect(() => () => {
    clearTimeout(agendado.current);
    agendado.current = null;
    for (const t of timers.current.values()) clearTimeout(t);
    timers.current.clear();
  }, []);

  const aoEstado = useCallback((estado) => { estadoRef.current = estado; agendar(); }, [agendar]);

  /* ---------- fechar ---------- */

  /** Encerra a luta (se ainda está ativa), fecha a Sala e grava o Finalizado na lista do Mestre. */
  const fechar = useCallback(async () => {
    const est = estadoRef.current;
    if (est?.encontro?.status === ENCONTRO_STATUS.ATIVO) est.acoes.encerrar();
    // A luta encerrada (o estado Finalizado e o evento Encerrar) chega ao banco ANTES de a Sala fechar: depois do fechamento
    // o banco recusa toda escrita ("Sala Fechada"), e o Registro de quem estava na Sala ficaria sem o fim.
    await new Promise((ok) => { setTimeout(ok, 150); });
    sincronizar();
    await cliente.esperarFilas();
    fechando.current = true;
    try {
      await cliente.fecharSala();
    } catch (e) {
      fechando.current = false;
      throw e;
    }
    /* Só o Registro (autor, 2026-11-18, "Só o Registro"): a sessão do personagem de um jogador fica com o jogador, e não vai
       para a lista (e a nuvem pessoal) do Mestre. */
    const r = cliente.ler();
    listaRef.current.atualizar(encontroId, (atual) => ({
      ...atual,
      status: ENCONTRO_STATUS.FINALIZADO,
      ativoId: null,
      sala: { ...(atual.sala ?? {}), fechadaEm: r.sala?.fechada_em ?? new Date().toISOString(), membros: nomesDosMembros(r) },
      registroSala: registroParaGuardar(r, { ehMestre: true }),
    }));
    marcarRecebida(r.sala?.id ?? cliente.salaId);
  }, [cliente, encontroId, sincronizar]);

  return {
    sala: { fonte, autor, aoExecutar, aoEstado },
    fechar,
    retrato,
    encontro,
    falhas,
    /** Tenta de novo o que desistiu: a sessão de jogador guardada sobe de novo, e o resto é gravado no próximo ciclo da sincronização. */
    tentarDeNovo: () => {
      setFalhas([]);
      const guardadas = [...desistidas.current];
      desistidas.current.clear();
      cliente.relerTudo().catch(() => {}).finally(() => {
        for (const [id, passos] of guardadas) gravarSessaoDoJogador(id, passos);
      });
      agendar();
    },
  };
}

/* ---------- abrir a Sala a partir de um Encontro ---------- */

/* Um segredo por Sala para os apelidos (sala-oculto.js), só no aparelho do Mestre. */
function segredoNovo() {
  try {
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  }
}

/**
 * Cria a Sala para um Encontro do Mestre e marca o Encontro com ela. `criarSala` é a RPC (sala-rede.js). A tela da 7c
 * chama isto pelo botão Abrir Sala. Devolve `{ salaId, codigo }`.
 */
export async function abrirSalaDoEncontro({ lista, encontroId, senha, criarSala, verSala = null }) {
  const e = lista.encontros.find((x) => x.id === encontroId);
  if (!e) throw new Error("Encontro Ausente");
  // A Sala que o Encontro guarda só é reaproveitada se ainda está aberta (ela pode ter fechado sozinha, parada).
  if (e.sala?.id && !e.sala.fechadaEm && (!verSala || await verSala(e.sala.codigo))) return { salaId: e.sala.id, codigo: e.sala.codigo };
  const nova = await criarSala(lista.grupo, senha, e.nome);
  lista.atualizar(encontroId, (atual) => ({ ...atual, sala: { id: nova.sala_id, codigo: nova.codigo, segredo: segredoNovo() } }));
  return { salaId: nova.sala_id, codigo: nova.codigo };
}

export { idDoFinalizado };
