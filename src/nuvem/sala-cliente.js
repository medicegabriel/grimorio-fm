/* O CLIENTE DE UMA SALA (Encontro Unificado, etapa 7b, 2026-11-18).

   Uma Sala aberta no aparelho: o retrato do que a RLS deixa esta conta ler, o tempo real, quem está online e as
   escritas com conferência de versão. Não sabe nada de React nem do Encontro: o espelho do jogador (sala-espelho.js),
   o do Mestre (sala-encontro.js) e as telas leem daqui.

   ⚠ O QUE A REDE NÃO MANDA. Nenhum DELETE sai do banco (salas.sql, item 8), e quando uma linha deixa de passar pela RLS
   (a criatura ficou Oculta, o colega tirou o compartilhamento, o papel mudou) o assinante não recebe nada. O sinal é a
   `versao` de `sala_estado`: subiu, o cliente RELÊ resumos, fichas, compartilhamentos e membros e TROCA o retrato (não
   mescla), para a linha que sumiu sumir daqui também. Toda (re)inscrição no canal também relê tudo, que é o que cobre
   o buraco de uma queda de conexão.

   ⚠ O CACHE LOCAL usa a chave `sala_cache_v1:<id>`, fora de `fm_` e `afty_`: o nuvem-sync.js intercepta o `setItem` e
   mandaria para a nuvem PESSOAL o que é da Sala (a ficha de outra pessoa, a criatura do Mestre).

   ⚠ A ESCRITA COM VERSÃO. `gravarParte(combatente, parte, transformar)` lê a versão que conhece, aplica `transformar`
   sobre os dados dela e grava com a versão esperada. "Versão Mudou" relê a linha e aplica `transformar` de novo, sobre
   a versão nova. Quem chama passa uma TRANSFORMAÇÃO (a diferença da edição), nunca o estado inteiro, e é isso que faz
   uma mudança simultânea não apagar a outra. As escritas de uma mesma parte vão em fila. */

import * as rede from "./sala-rede";

export const FASE = Object.freeze({
  CONECTANDO: "conectando",
  PRONTA: "pronta",
  SEM_CONEXAO: "semConexao",
  FECHADA: "fechada",
  REMOVIDO: "removido",
  ERRO: "erro",
});

const TABELAS_DO_CANAL = [
  "sala_membros", "sala_estado", "sala_ordem_mestre", "sala_resumos", "sala_fichas",
  "sala_compartilhamentos", "sala_operacoes", "sala_operacoes_publicas",
];
export const CHAVE_CACHE = (salaId) => `sala_cache_v1:${salaId}`;
const TENTATIVAS_DE_VERSAO = 6;
/* Quanto esperar a cada falha de rede numa escrita, antes de desistir (uns 2 minutos no total). */
const ESPERAS_DE_REDE = [1000, 2000, 4000, 8000, 15000, 30000, 60000];

const ehObjeto = (v) => !!v && typeof v === "object" && !Array.isArray(v);

/* Texto estável (chaves em ordem) para dizer se dois dados são o mesmo, venha o objeto de onde vier. */
export function estavel(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v) ?? "null";
  if (Array.isArray(v)) return `[${v.map(estavel).join(",")}]`;
  return `{${Object.keys(v).filter((k) => v[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${estavel(v[k])}`).join(",")}}`;
}

const porChave = (linhas, chave) => Object.fromEntries(linhas.map((l) => [l[chave], l]));
const maiorSeq = (mapa) => Object.keys(mapa ?? {}).reduce((m, k) => Math.max(m, Number(k) || 0), 0);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- o retrato ---------- */

function retratoVazio(salaId) {
  return {
    salaId,
    fase: FASE.CONECTANDO,
    erro: null,
    eu: null,            // { conta, papel, nome }
    sala: null,          // a linha de `salas`, sem o senha_hash
    membros: {},         // conta -> linha
    estado: null,        // a linha de `sala_estado`
    ordem: null,         // a linha de `sala_ordem_mestre` (só Mestre)
    resumos: {},         // combatente -> linha
    fichas: {},          // combatente -> { ficha?: linha, sessao?: linha }
    compartilhamentos: [],
    operacoes: {},       // seq -> linha completa (o que esta conta lê)
    publicas: {},        // seq -> linha pública
    online: [],          // contas no Presence
    recebidasAoVivo: {}, // seq -> true: as completas que chegaram pelo tempo real (o Encontro Finalizado usa)
  };
}

/* ---------- a escrita com versão ---------- */

/**
 * O laço de toda escrita de ficha e sessão, separado do cliente para o assert provar o conflito sem rede de verdade.
 * `transformar(dadosDeAgora | null) -> novos | null` (null ou o mesmo texto: nada a gravar). "Versão Mudou" relê a linha e
 * aplica `transformar` de novo sobre a versão nova. Sem rede, espera e tenta de novo, conferindo antes se a gravação que
 * parecia perdida chegou ao banco (a linha de agora é a nossa): sem isso a mudança relativa entraria duas vezes.
 * Devolve `{ ok, dados, versao, mudou }`.
 */
export async function gravarComVersao({ lerAtual, guardar, esquecer, gravar, lerLinha, conta, rotulo = "", esperar = espera }, transformar) {
  let falhasDeRede = 0;
  const ehNossa = (linha, novos) => !!linha && linha.atualizado_por === conta && estavel(linha.dados) === estavel(novos);
  for (let i = 0; i < TENTATIVAS_DE_VERSAO; i++) {
    const atual = lerAtual();
    const novos = transformar(atual?.dados ?? null);
    if (novos == null || (atual && estavel(novos) === estavel(atual.dados))) {
      return { ok: true, dados: atual?.dados ?? null, versao: atual?.versao ?? 0, mudou: false };
    }
    try {
      const versao = await gravar(novos, atual?.versao ?? 0);
      guardar({ ...(atual ?? {}), dados: novos, versao, atualizado_por: conta });
      return { ok: true, dados: novos, versao, mudou: true };
    } catch (e) {
      if (e?.rede && falhasDeRede < ESPERAS_DE_REDE.length) {
        // Sem rede: a volta não conta como conflito.
        await esperar(ESPERAS_DE_REDE[falhasDeRede++]);
        i -= 1;
        const linha = await lerLinha().catch(() => null);
        if (linha) guardar(linha);
        if (ehNossa(linha, novos)) return { ok: true, dados: linha.dados, versao: linha.versao, mudou: true };
        continue;
      }
      if (e?.codigo !== "Versão Mudou") throw e;
      console.info("[sala] versão mudou, relendo", rotulo);
      const linha = await lerLinha();
      if (ehNossa(linha, novos)) { guardar(linha); return { ok: true, dados: linha.dados, versao: linha.versao, mudou: true }; }
      if (linha) guardar(linha);
      else esquecer();
      await esperar(40 * (i + 1));
    }
  }
  throw new rede.ErroDaSala("Versão Mudou");
}

/* ---------- o cliente ---------- */

/**
 * Abre a Sala `salaId` com a conta logada. `aoFechar` roda uma vez quando a Sala fecha com o cliente aberto (o Encontro
 * Finalizado de quem estava presente).
 */
export function abrirCliente(salaId, { armazem = globalThis.localStorage, aoFechar = null } = {}) {
  let r = retratoVazio(salaId);
  let versaoDaTela = 0;
  const ouvintes = new Set();
  let canal = null;
  let sb = null;
  let fechado = false;
  let relendo = null;
  let releituraPedida = false;
  let tentativasDeCanal = 0;
  let timerCanal = null;
  let avisouFechada = false;
  const filas = new Map();

  function definir(proximo) {
    r = proximo;
    versaoDaTela += 1;
    for (const fn of [...ouvintes]) { try { fn(); } catch { /* tela que quebrou não para as outras */ } }
    gravarCache();
  }
  const mudar = (fn) => definir(fn(r));

  /* O cache guarda o que a tela mostra enquanto a rede não volta. Só leitura: nada sai dele para o banco. */
  let timerCache = null;
  function gravarCache() {
    clearTimeout(timerCache);
    timerCache = setTimeout(() => {
      try {
        const { recebidasAoVivo: _v, ...resto } = r;
        armazem?.setItem(CHAVE_CACHE(salaId), JSON.stringify({ ...resto, fase: undefined, erro: undefined, online: [] }));
      } catch { /* cota cheia: o cache é só conforto */ }
    }, 400);
  }
  function lerCache() {
    try {
      const c = JSON.parse(armazem?.getItem(CHAVE_CACHE(salaId)) ?? "null");
      if (ehObjeto(c) && c.salaId === salaId) r = { ...retratoVazio(salaId), ...c, fase: FASE.CONECTANDO, online: [] };
    } catch { /* cache quebrado: começa do zero */ }
  }

  /* ---------- a leitura inteira ---------- */

  async function relerTudo() {
    if (relendo) { releituraPedida = true; return relendo; }
    relendo = (async () => {
      do {
        releituraPedida = false;
        const leuOrdem = r.eu?.papel === "mestre";
        const [salas, membros, estados, ordens, resumos, fichas, comps, ops, pubs] = await Promise.all([
          rede.lerTabela("salas", salaId),
          rede.lerTabela("sala_membros", salaId),
          rede.lerTabela("sala_estado", salaId),
          leuOrdem ? rede.lerTabela("sala_ordem_mestre", salaId) : Promise.resolve([]),
          rede.lerTabela("sala_resumos", salaId),
          rede.lerTabela("sala_fichas", salaId),
          rede.lerTabela("sala_compartilhamentos", salaId),
          // O registro só cresce: lê só o que passou da última linha conhecida (a linha pública vale pela visão da hora
          // em que foi escrita, e reler o registro inteiro a cada troca de visão custaria até 10 mil linhas por membro).
          rede.lerTabela("sala_operacoes", salaId, { ordem: "seq", filtro: (q) => q.gt("seq", maiorSeq(r.operacoes)) }),
          rede.lerTabela("sala_operacoes_publicas", salaId, { ordem: "seq", filtro: (q) => q.gt("seq", maiorSeq(r.publicas)) }),
        ]);
        const eu = membros.find((m) => m.conta === r.eu?.conta) ?? null;
        const porComb = {};
        for (const f of fichas) (porComb[f.combatente] ??= {})[f.parte] = f;
        const sala = salas[0] ?? null;
        mudar((x) => ({
          ...x,
          sala,
          eu: x.eu ? { ...x.eu, papel: eu?.papel ?? x.eu.papel, removido: !!eu?.removido_em || !eu } : x.eu,
          membros: porChave(membros.filter((m) => !m.removido_em || m.conta === x.eu?.conta), "conta"),
          estado: estados[0] ?? null,
          ordem: ordens[0] ?? null,
          resumos: porChave(resumos, "combatente"),
          fichas: porComb,
          compartilhamentos: comps,
          operacoes: ops.length ? { ...x.operacoes, ...porChave(ops, "seq") } : x.operacoes,
          publicas: pubs.length ? { ...x.publicas, ...porChave(pubs, "seq") } : x.publicas,
        }));
        // Promovido a co-Mestre nesta leitura: a ordem completa passa a ser lida, na próxima volta.
        if (eu?.papel === "mestre" && !leuOrdem) releituraPedida = true;
      } while (releituraPedida);
      atualizarFase();
    })().finally(() => { relendo = null; });
    return relendo;
  }

  function atualizarFase() {
    const fechada = r.sala?.status === "fechada";
    const removido = !!r.eu?.removido;
    let fase = r.fase;
    if (removido) fase = FASE.REMOVIDO;
    else if (fechada) fase = FASE.FECHADA;
    else if (canal && r.fase !== FASE.SEM_CONEXAO) fase = FASE.PRONTA;
    if (fase !== r.fase) mudar((x) => ({ ...x, fase }));
    if (fechada && !avisouFechada) {
      avisouFechada = true;
      try { aoFechar?.(api); } catch (e) { console.warn("[sala] fechamento", e); }
    }
  }

  /* ---------- o tempo real ---------- */

  function aoEvento(tabela, p) {
    const n = p.new;
    if (!ehObjeto(n) || n.sala_id !== salaId) return;
    switch (tabela) {
      case "sala_estado": {
        const antes = r.estado?.versao ?? 0;
        mudar((x) => ({ ...x, estado: n }));
        // A versão subiu: alguma linha pode ter deixado de passar pela RLS. Relê tudo e troca o retrato.
        if (Number(n.versao) > Number(antes)) relerTudo().catch(falhaDeRede);
        else atualizarFase();
        break;
      }
      case "sala_ordem_mestre": mudar((x) => ({ ...x, ordem: n })); break;
      case "sala_membros": {
        mudar((x) => ({ ...x, membros: { ...x.membros, [n.conta]: n } }));
        if (n.conta === r.eu?.conta && n.removido_em) mudar((x) => ({ ...x, eu: { ...x.eu, removido: true } }));
        atualizarFase();
        break;
      }
      case "sala_resumos": mudar((x) => ({ ...x, resumos: { ...x.resumos, [n.combatente]: n } })); break;
      case "sala_fichas": {
        const atual = r.fichas[n.combatente]?.[n.parte];
        // O eco da própria gravação (ou um evento atrasado) não volta a versão.
        if (atual && Number(atual.versao) >= Number(n.versao)) break;
        // Acima de 1 MB o evento chega sem os campos grandes: relê a linha.
        if (!ehObjeto(n.dados)) {
          rede.lerParte(salaId, n.combatente, n.parte).then((linha) => { if (linha) guardarParte(linha); }).catch(falhaDeRede);
          break;
        }
        guardarParte(n);
        break;
      }
      case "sala_compartilhamentos":
        mudar((x) => ({ ...x, compartilhamentos: [...x.compartilhamentos.filter((c) => c.id !== n.id), n] }));
        break;
      case "sala_operacoes":
        mudar((x) => ({ ...x, operacoes: { ...x.operacoes, [n.seq]: n }, recebidasAoVivo: { ...x.recebidasAoVivo, [n.seq]: true } }));
        break;
      case "sala_operacoes_publicas": mudar((x) => ({ ...x, publicas: { ...x.publicas, [n.seq]: n } })); break;
      default: break;
    }
  }

  function guardarParte(linha) {
    mudar((x) => {
      const atual = x.fichas[linha.combatente]?.[linha.parte];
      if (atual && Number(atual.versao) > Number(linha.versao)) return x;
      return { ...x, fichas: { ...x.fichas, [linha.combatente]: { ...(x.fichas[linha.combatente] ?? {}), [linha.parte]: linha } } };
    });
  }

  function falhaDeRede(e) {
    if (fechado) return;
    console.warn("[sala]", e?.codigo ?? e);
    if (e?.rede) mudar((x) => ({ ...x, fase: FASE.SEM_CONEXAO }));
    else if (e?.codigo === "Sala Ausente") mudar((x) => ({ ...x, fase: FASE.REMOVIDO }));
  }

  /* Canal privado `sala:<id>` com as postgres_changes e o Presence juntos: com "Allow public access" desligado todo
     canal é privado, e a política de realtime.messages deixa o membro entrar nele. */
  async function inscrever() {
    if (fechado) return;
    clearTimeout(timerCanal);
    if (canal) { try { await sb.removeChannel(canal); } catch { /* já caiu */ } canal = null; }
    await sb.realtime.setAuth();
    const c = sb.channel(`sala:${salaId}`, { config: { private: true, presence: { key: r.eu.conta } } });
    for (const t of TABELAS_DO_CANAL) {
      c.on("postgres_changes", { event: "*", schema: "public", table: t, filter: `sala_id=eq.${salaId}` }, (p) => aoEvento(t, p));
    }
    c.on("presence", { event: "sync" }, () => {
      const online = Object.keys(c.presenceState()).sort();
      mudar((x) => ({ ...x, online }));
    });
    canal = c;
    c.subscribe(async (status) => {
      if (fechado || canal !== c) return;
      if (status === "SUBSCRIBED") {
        tentativasDeCanal = 0;
        try { await c.track({ conta: r.eu.conta, desde: Date.now() }); } catch { /* Presence é só conforto */ }
        mudar((x) => ({ ...x, fase: x.fase === FASE.SEM_CONEXAO || x.fase === FASE.CONECTANDO ? FASE.PRONTA : x.fase }));
        // O que mudou enquanto o canal estava fora não chega como evento.
        relerTudo().catch(falhaDeRede);
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        mudar((x) => ({ ...x, fase: [FASE.FECHADA, FASE.REMOVIDO].includes(x.fase) ? x.fase : FASE.SEM_CONEXAO }));
        if (status === "CLOSED" && fechado) return;
        // RECONEXÃO: de novo, cada vez mais devagar, até 30 s.
        tentativasDeCanal += 1;
        timerCanal = setTimeout(() => { inscrever().catch(falhaDeRede); }, Math.min(30000, 1000 * 2 ** Math.min(5, tentativasDeCanal)));
      }
    });
  }

  const aoVoltarARede = () => { if (r.fase === FASE.SEM_CONEXAO) inscrever().catch(falhaDeRede); };
  const aoVoltarAVista = () => {
    if (typeof document !== "undefined" && document.visibilityState === "visible" && r.fase === FASE.SEM_CONEXAO) aoVoltarARede();
  };

  async function conectar() {
    lerCache();
    definir(r);
    sb = await rede.cliente();
    if (!sb) throw new rede.ErroDaSala("Nuvem Desligada");
    const { data } = await sb.auth.getSession();
    const user = data?.session?.user;
    if (!user) throw new rede.ErroDaSala("Conta Necessária");
    mudar((x) => ({ ...x, eu: { ...(x.eu ?? {}), conta: user.id } }));
    // O papel vem da linha de membro, que a leitura traz.
    const membros = await rede.lerTabela("sala_membros", salaId);
    const eu = membros.find((m) => m.conta === user.id);
    if (!eu) throw new rede.ErroDaSala("Sala Ausente");
    mudar((x) => ({ ...x, eu: { conta: user.id, papel: eu.papel, nome: eu.nome, removido: !!eu.removido_em } }));
    await relerTudo();
    if (typeof window !== "undefined") {
      window.addEventListener("online", aoVoltarARede);
      document.addEventListener("visibilitychange", aoVoltarAVista);
    }
    if (r.fase !== FASE.FECHADA && r.fase !== FASE.REMOVIDO) await inscrever();
  }

  /* ---------- as escritas ---------- */

  /* Uma fila por chave: duas escritas na mesma parte nunca correm juntas (a segunda leria a versão de antes da primeira). */
  function emFila(chave, fn) {
    const antes = filas.get(chave) ?? Promise.resolve();
    const agora = antes.catch(() => {}).then(fn);
    filas.set(chave, agora);
    agora.finally(() => { if (filas.get(chave) === agora) filas.delete(chave); }).catch(() => {});
    return agora;
  }

  /**
   * Grava a ficha ou a sessão de um combatente. `transformar(dadosDeAgora | null) -> novos | null` (null ou o mesmo
   * texto: nada a gravar). No conflito de versão relê e aplica `transformar` de novo sobre a versão nova. Devolve
   * `{ ok, dados, versao, mudou }`.
   */
  function gravarParte(combatente, parte, transformar) {
    return emFila(`${combatente}|${parte}`, () => gravarComVersao({
      lerAtual: () => r.fichas[combatente]?.[parte] ?? null,
      guardar: (linha) => guardarParte({ sala_id: salaId, combatente, parte, ...linha }),
      esquecer: () => mudar((x) => {
        const f = { ...(x.fichas[combatente] ?? {}) };
        delete f[parte];
        return { ...x, fichas: { ...x.fichas, [combatente]: f } };
      }),
      gravar: (dados, versao) => rede.gravarFicha(salaId, combatente, parte, dados, versao),
      lerLinha: () => rede.lerParte(salaId, combatente, parte),
      conta: r.eu?.conta ?? null,
      rotulo: `${combatente} ${parte}`,
    }, transformar));
  }

  /** Grava uma operação, pedido, rolagem, chat ou evento. O mesmo id duas vezes devolve o que já foi gravado. */
  function registrar(especie, dados, { escondida = false } = {}) {
    // O mesmo id de novo devolve o que já foi gravado, então tentar de novo sem rede é seguro.
    return emFila("registro", async () => {
      for (let k = 0; ; k++) {
        try {
          return await rede.gravarOperacao(salaId, especie, dados, escondida);
        } catch (e) {
          if (!e?.rede || k >= ESPERAS_DE_REDE.length) throw e;
          await espera(ESPERAS_DE_REDE[k]);
        }
      }
    });
  }

  /* Publica o resumo só quando o texto muda (cada chamada é uma escrita e, para todo membro, um evento). */
  const ultimosResumos = new Map();
  function publicarResumo(combatente, resumo) {
    const texto = estavel(resumo);
    if (ultimosResumos.get(combatente) === texto) return Promise.resolve(false);
    ultimosResumos.set(combatente, texto);
    return emFila(`resumo|${combatente}`, () => rede.publicarResumo(salaId, combatente, resumo).then(() => true))
      .catch((e) => { ultimosResumos.delete(combatente); throw e; });
  }

  let ultimoEstado = null;
  function gravarEstado(e) {
    const texto = estavel(e);
    if (texto === ultimoEstado) return Promise.resolve(false);
    ultimoEstado = texto;
    return emFila("estado", () => rede.gravarEstado(salaId, e).then(() => true)).catch((err) => { ultimoEstado = null; throw err; });
  }

  async function fechar() {
    fechado = true;
    clearTimeout(timerCanal);
    clearTimeout(timerCache);
    if (typeof window !== "undefined") {
      window.removeEventListener("online", aoVoltarARede);
      document.removeEventListener("visibilitychange", aoVoltarAVista);
    }
    if (canal && sb) { try { await sb.removeChannel(canal); } catch { /* já caiu */ } }
    canal = null;
    ouvintes.clear();
  }

  const api = {
    salaId,
    ler: () => r,
    versao: () => versaoDaTela,
    ouvir: (fn) => { ouvintes.add(fn); return () => ouvintes.delete(fn); },
    pronto: null,
    relerTudo,
    gravarParte,
    registrar,
    publicarResumo,
    gravarEstado,
    adicionarCombatente: (dados) => rede.adicionarCombatente(salaId, dados),
    removerCombatente: (combatente) => rede.removerCombatente(salaId, combatente),
    definirVisao: (combatente, visao) => rede.definirVisao(salaId, combatente, visao),
    definirDono: (combatente, dono) => rede.definirDono(salaId, combatente, dono),
    compartilhar: (combatente, para, ligado = true) => rede.compartilharFicha(salaId, combatente, para, ligado),
    responderPedido: (pedido, aceitar, operacao = null) => rede.responderPedido(salaId, pedido, aceitar, operacao),
    trancar: (trancada = true) => rede.trancar(salaId, trancada),
    trocarSenha: (senha) => rede.trocarSenha(salaId, senha),
    removerMembro: (conta) => rede.removerMembro(salaId, conta),
    promoverMestre: (conta, ligado = true) => rede.promoverMestre(salaId, conta, ligado),
    fecharSala: async () => { await rede.fecharSala(salaId); await relerTudo(); },
    /** Espera as escritas que estão na fila (o Mestre fecha a Sala só depois de a luta encerrada chegar ao banco). */
    esperarFilas: () => Promise.allSettled([...filas.values()]),
    desligar: fechar,
  };
  api.pronto = conectar().catch((e) => {
    mudar((x) => ({ ...x, fase: e?.codigo === "Sala Ausente" ? FASE.REMOVIDO : FASE.ERRO, erro: e?.codigo ?? String(e) }));
    throw e;
  });
  api.pronto.catch(() => {});
  return api;
}

/* ---------- leituras do retrato, para as telas ---------- */

/** A sessão (ou a ficha) de um combatente no retrato, com a versão. */
export const parteDe = (retrato, combatente, parte) => retrato?.fichas?.[combatente]?.[parte] ?? null;

/** Os combatentes de que esta conta é dona. */
export const meusCombatentes = (retrato) =>
  Object.values(retrato?.resumos ?? {}).filter((x) => x.dono && x.dono === retrato?.eu?.conta);

/** O registro em ordem: as linhas públicas, mais as completas que esta conta lê. */
export const registroEmOrdem = (retrato) => ({
  publicas: Object.values(retrato?.publicas ?? {}).sort((a, b) => a.seq - b.seq),
  completas: Object.values(retrato?.operacoes ?? {}).sort((a, b) => a.seq - b.seq),
});
