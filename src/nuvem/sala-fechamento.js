/* O FECHAMENTO DA SALA NA LISTA DE CADA UM (Encontro Unificado, etapa 7b, 2026-11-18).

   Quando a Sala fecha, cada aparelho grava o Encontro Finalizado na PRÓPRIA lista de Encontros (a do grupo da Sala), com
   o Registro que recebeu. O Registro sai das linhas PÚBLICAS mais as completas que o aparelho recebeu ao vivo ou que a
   própria conta escreveu, e nunca de uma releitura do registro completo no fechamento: a leitura completa segue a visão
   e os compartilhamentos de AGORA, e uma criatura que virou Aberta no fim abriria o que ela fez quando estava Oculta
   (modelo de ameaça de salas.sql, "O que o banco não consegue esconder").

   O AUSENTE NO FECHAMENTO. No próximo login (`recuperarSalasFechadas`), o aparelho procura as Salas fechadas de que a
   conta é membro (`minhas_salas`), e para cada uma que ainda não está na lista: põe a sessão final de cada personagem dele
   na loja da sessão (a ficha recebe tudo o que o Mestre fez) e grava o Encontro Finalizado com o Registro público. O id
   do Finalizado é estável (`sala_<id da Sala>`), então outro aparelho da mesma conta, ou um que estava presente, não
   duplica (a nuvem pessoal une as listas pelo id).

   Escrita de tela aqui (as frases do Registro) segue as regras do site: sem ponto e vírgula, sem travessão. */

/* Os motores entram PRIMEIRO (ver o topo de encontros/modelo.js). */
import "../systems/afty/encontros/motores/index";
import { CHAVE_LISTA, lerListaCrua, gravarLista, inventarioDoGrupo } from "../systems/afty/encontros/listas";
import { VERSAO_ENCONTRO } from "../systems/afty/encontros/modelo";
import { aplicarRemoto } from "../systems/afty/ficha/sessao-loja";
import { chaveDaSessao } from "../systems/afty/ficha/ficha-sessao";
import * as rede from "./sala-rede";
import { fichaIdDoCombatente } from "./sala-oculto";
import { fraseDaPublica, TIPO_LOG } from "./sala-frases";

export const idDoFinalizado = (salaId) => `sala_${salaId}`;

/* AS SALAS JÁ RECEBIDAS: sem isto, o Finalizado que a pessoa apagou da lista voltaria no login seguinte, enquanto a Sala
   fechada fica guardada no banco (14 dias). Lista de `{ id }` com prefixo `afty_`: vai para a nuvem pessoal, e a
   mesclagem une pelo id (o mesmo desenho do registro da migração do site). */
export const CHAVE_SALAS_RECEBIDAS = "afty_salas_recebidas_v1";

export function salasRecebidas(armazem = globalThis.localStorage) {
  try {
    const v = JSON.parse(armazem?.getItem(CHAVE_SALAS_RECEBIDAS) ?? "[]");
    return new Set((Array.isArray(v) ? v : []).map((x) => x?.id).filter(Boolean));
  } catch { return new Set(); }
}

export function marcarRecebida(salaId, armazem = globalThis.localStorage) {
  if (!salaId) return;
  const ja = salasRecebidas(armazem);
  if (ja.has(salaId)) return;
  try {
    const v = JSON.parse(armazem?.getItem(CHAVE_SALAS_RECEBIDAS) ?? "[]");
    const lista = Array.isArray(v) ? v.filter((x) => x?.id) : [];
    armazem.setItem(CHAVE_SALAS_RECEBIDAS, JSON.stringify([...lista, { id: salaId, em: Date.now() }]));
  } catch { /* cota cheia: a recuperação tenta de novo no próximo login */ }
}

const ehObjeto = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const porSeq = (a, b) => Number(a.seq) - Number(b.seq);
const quando = (t) => { const n = Date.parse(t ?? ""); return Number.isFinite(n) ? n : Date.now(); };

/* A operação completa guardada no Finalizado, sem o delta nem os registros da Ficha (o tamanho cabe na lista pessoal). */
const completaGuardada = (o) => {
  const d = ehObjeto(o.dados) ? o.dados : {};
  const { delta: _d, registros: _r, ...resto } = d;
  // O autor (conta), o papel, a marca de escondida e o elo com a linha pública ficam: a tela do Registro Final precisa deles para
  // dizer quem fez, mostrar a rolagem escondida só no Mestre e não repetir a mesma ação.
  return {
    seq: o.seq, especie: o.especie, estado_pedido: o.estado_pedido ?? null, criado_em: o.criado_em, dados: resto,
    autor: o.autor ?? null, papel: o.papel ?? null, escondida: !!o.escondida, publica_id: o.publica_id ?? null,
  };
};
const publicaGuardada = (p) => ({ id: p.id ?? null, seq: p.seq, especie: p.especie, estado_pedido: p.estado_pedido ?? null, criado_em: p.criado_em, publica: p.publica });

/**
 * O Registro que esta conta guarda: as linhas públicas, mais as completas que chegaram ao vivo (`recebidasAoVivo`) ou que
 * ela escreveu. O Mestre guarda todas as completas (ele lê tudo desde o começo).
 */
export function registroParaGuardar(retrato, { ehMestre = false } = {}) {
  const conta = retrato?.eu?.conta ?? null;
  const vivas = retrato?.recebidasAoVivo ?? {};
  const completas = Object.values(retrato?.operacoes ?? {})
    .filter((o) => ehMestre || vivas[o.seq] || (conta && o.autor === conta))
    .sort(porSeq).map(completaGuardada);
  const publicas = Object.values(retrato?.publicas ?? {}).sort(porSeq).map(publicaGuardada);
  return { publicas, completas };
}

/* ---------- as frases do Registro público ---------- */

/* As frases moraram aqui até a etapa 7c e foram para a FOLHA `sala-frases.js` (a tela da Sala não puxa o motor). */
export { fraseDaPublica };

/** As entradas do `log` do Encontro, da mais nova para a mais antiga, como o Encontro guarda. */
export function logDoRegistro(registro, nomes = {}, rodadaFinal = 1) {
  let rodada = 1;
  const saida = [];
  for (const p of registro.publicas ?? []) {
    if (p.especie === "sistema" && p.publica?.rodada) rodada = Number(p.publica.rodada) || rodada;
    saida.push({
      id: `log_sala_${p.seq}`,
      rodada: Math.min(rodada, rodadaFinal) || rodada,
      em: quando(p.criado_em),
      tipo: p.especie === "sistema" ? (p.publica?.evento === "turno" ? "turno" : "rodada") : (TIPO_LOG[p.publica?.tipo] ?? "livre"),
      mensagem: fraseDaPublica(p, nomes),
      combatenteId: p.publica?.alvo?.id ?? p.publica?.combatente?.id ?? null,
    });
  }
  return saida.reverse().slice(0, 200);
}

/**
 * O Encontro Finalizado de quem NÃO é o Mestre que criou: os personagens dele ligados às fichas do aparelho (com a sessão
 * final para consulta), os outros combatentes que ele via como marcadores, e o Registro que ele recebeu.
 * `meus`: `[{ combatente, fichaId, chave, sessao }]`.
 */
export function finalizadoDoMembro({ retrato, grupo, meus = [], registro, agora = Date.now() }) {
  const sala = retrato.sala ?? {};
  const nomes = Object.fromEntries(Object.values(retrato.membros ?? {}).map((m) => [m.conta, m.nome]));
  const meusIds = new Set(meus.map((m) => m.combatente));
  const resumos = Object.values(retrato.resumos ?? {}).sort((a, b) => (a.posicao ?? 999) - (b.posicao ?? 999));
  const combatentes = [
    ...meus.map((m) => ({
      id: m.combatente,
      motor: "afty",
      tipo: "personagem",
      nome: retrato.resumos?.[m.combatente]?.nome ?? "Personagem",
      fichaRef: { chave: m.chave ?? null, id: m.fichaId },
      iniciativa: { rolagem: 0, mod: 0, total: 0, manual: false },
      flags: { abatido: false, foraDaOrdem: false, lado: retrato.resumos?.[m.combatente]?.lado ?? "jogador" },
      visao: null,
      dono: { conta: retrato.eu?.conta ?? null, papel: "jogador" },
      ...(ehObjeto(m.sessao) ? { sessaoFinal: m.sessao } : {}),
    })),
    ...resumos.filter((x) => !meusIds.has(x.combatente)).map((x) => ({
      id: x.combatente,
      motor: null,
      tipo: "marcador",
      nome: x.nome,
      iniciativa: { rolagem: 0, mod: 0, total: 0, manual: false },
      flags: { abatido: false, foraDaOrdem: false, lado: x.lado },
      visao: x.tipo === "personagem" ? "aberta" : x.visao,
      dono: { conta: x.dono ?? null, papel: x.tipo === "personagem" ? "jogador" : "mestre" },
    })),
  ];
  const rodada = Math.max(1, Number(retrato.estado?.rodada) || 1);
  return {
    id: idDoFinalizado(sala.id ?? retrato.salaId),
    versao: VERSAO_ENCONTRO,
    grupo,
    nome: sala.nome || "Encontro",
    pastaId: null,
    criadoEm: quando(sala.criada_em),
    atualizadoEm: agora,
    status: "finalizado",
    rodada,
    ativoId: null,
    combatentes,
    log: logDoRegistro(registro, nomes, rodada),
    pedidos: [],
    config: { aceitarSozinho: false },
    sala: {
      id: sala.id ?? retrato.salaId, codigo: sala.codigo ?? null, papel: retrato.eu?.papel ?? null, fechadaEm: sala.fechada_em ?? null,
      membros: nomes,
    },
    registroSala: registro,
  };
}

/* ---------- gravar na lista ---------- */

/** Já existe na lista do grupo: o Finalizado deste membro, ou o Encontro do Mestre que abriu a Sala. */
export function jaNaLista(grupo, salaId, armazem = globalThis.localStorage) {
  const lista = lerListaCrua(CHAVE_LISTA[grupo], armazem) ?? [];
  return lista.find((e) => e?.id === idDoFinalizado(salaId) || e?.sala?.id === salaId) ?? null;
}

/**
 * Grava (ou troca) um Encontro na lista do grupo. `importar` é o da lista montada na tela, quando é do mesmo grupo: sem
 * ele, a lista montada regravaria a versão de antes por cima.
 */
export function gravarNaLista(grupo, encontro, { armazem = globalThis.localStorage, importar = null } = {}) {
  if (importar) { importar(encontro); return { ok: true }; }
  const lista = lerListaCrua(CHAVE_LISTA[grupo], armazem);
  if (lista === null) return { ok: false, erro: "Lista Ilegível" };
  const sem = lista.filter((e) => e?.id !== encontro.id);
  return gravarLista(grupo, [encontro, ...sem], armazem, { telaAntigaDesligada: true });
}

/* ---------- o aparelho de quem estava na Sala ---------- */

/** As fichas deste aparelho que são personagens desta conta na Sala, com a sessão de agora da Sala. */
export function meusNaSala(retrato, grupo, armazem = globalThis.localStorage) {
  const inv = inventarioDoGrupo(grupo, armazem);
  const ids = inv.fichas.map((e) => String(e.ficha.id));
  const out = [];
  for (const res of Object.values(retrato.resumos ?? {})) {
    if (res.tipo !== "personagem" || !res.dono || res.dono !== retrato.eu?.conta) continue;
    const fichaId = fichaIdDoCombatente(res.combatente, ids) ?? retrato.fichas?.[res.combatente]?.ficha?.dados?.id ?? null;
    if (!fichaId || !inv.porId.has(String(fichaId))) continue;
    out.push({
      combatente: res.combatente,
      fichaId: String(fichaId),
      chave: inv.porId.get(String(fichaId)).chave,
      sessao: retrato.fichas?.[res.combatente]?.sessao?.dados ?? null,
      sessaoEm: Date.parse(retrato.fichas?.[res.combatente]?.sessao?.atualizado_em ?? "") || null,
    });
  }
  return out;
}

/* MAIS NOVA VENCE (revisão final, 2026-11-18): a sessão final da Sala só entra na Ficha se é mais nova que a sessão gravada
   no aparelho. O jogador que usou a Ficha sozinho depois do fechamento não perde o que fez, e a da Sala fica no Finalizado
   (`sessaoFinal`) para consulta. A régua é a mais tarde entre a última gravação da sessão na Sala e o fechamento, as duas do
   relógio do banco: o espelho grava a sessão no aparelho durante a Sala, e só o que o jogador fez DEPOIS conta como mais novo.
   Sem data da Sala, ou sem sessão gravada no aparelho, a da Sala entra, como antes. */
export function salaMaisNova(m, armazem = globalThis.localStorage, fechadaEm = null) {
  const regua = Math.max(m?.sessaoEm || 0, Date.parse(fechadaEm ?? "") || 0);
  if (!regua) return true;
  let local = null;
  try { local = JSON.parse(armazem?.getItem(chaveDaSessao(m.fichaId)) ?? "null"); } catch { local = null; }
  const em = Number(local?.atualizadoEm);
  return !Number.isFinite(em) || em <= regua;
}

/**
 * O fechamento visto por um membro que não é o Mestre que criou: a sessão final de cada personagem dele vai para a loja e
 * o Finalizado para a lista. Idempotente pelo id.
 */
export function gravarFinalizadoDoMembro(retrato, grupo, { armazem = globalThis.localStorage, importar = null, registro = null } = {}) {
  const meus = meusNaSala(retrato, grupo, armazem);
  for (const m of meus) if (m.sessao && salaMaisNova(m, armazem, retrato.sala?.fechada_em)) aplicarRemoto(m.fichaId, m.sessao);
  const enc = finalizadoDoMembro({ retrato, grupo, meus, registro: registro ?? registroParaGuardar(retrato) });
  const r = gravarNaLista(grupo, enc, { armazem, importar });
  if (r.ok) marcarRecebida(enc.sala.id, armazem);
  return { ...r, encontro: enc, personagens: meus.length };
}

/* ---------- o ausente, no próximo login ---------- */

let recuperando = null;

/**
 * Procura as Salas fechadas desta conta que ainda não estão na lista e grava o que falta. `importarPorGrupo[grupo]` é o
 * `importar` da lista montada na tela, quando houver. Roda uma vez por página. Devolve `[{ salaId, grupo, personagens }]`.
 */
export function recuperarSalasFechadas({ armazem = globalThis.localStorage, importarPorGrupo = {} } = {}) {
  recuperando ??= (async () => {
    const sb = await rede.cliente();
    if (!sb) return [];
    const { data } = await sb.auth.getSession();
    const conta = data?.session?.user?.id;
    if (!conta) return [];
    const feitas = [];
    const recebidas = salasRecebidas(armazem);
    for (const s of await rede.minhasSalas()) {
      if (s.status !== "fechada" || !CHAVE_LISTA[s.grupo] || recebidas.has(s.sala_id)) continue;
      const existente = jaNaLista(s.grupo, s.sala_id, armazem);
      if (existente && (existente.id === idDoFinalizado(s.sala_id) || existente.registroSala)) { marcarRecebida(s.sala_id, armazem); continue; }
      try {
        const [salas, membros, estados, resumos, fichas, publicas, operacoes] = await Promise.all([
          rede.lerTabela("salas", s.sala_id),
          rede.lerTabela("sala_membros", s.sala_id),
          rede.lerTabela("sala_estado", s.sala_id),
          rede.lerTabela("sala_resumos", s.sala_id),
          rede.lerTabela("sala_fichas", s.sala_id, { filtro: (q) => q.eq("parte", "sessao") }),
          rede.lerTabela("sala_operacoes_publicas", s.sala_id, { ordem: "seq" }),
          // Só as que a própria conta escreveu: as outras completas seguiriam a visão de agora.
          rede.lerTabela("sala_operacoes", s.sala_id, { filtro: (q) => q.eq("autor", conta), ordem: "seq" }),
        ]);
        const porComb = {};
        for (const f of fichas) (porComb[f.combatente] ??= {})[f.parte] = f;
        const retrato = {
          salaId: s.sala_id,
          eu: { conta, papel: s.papel },
          sala: salas[0] ?? { id: s.sala_id, codigo: s.codigo, nome: s.nome, criada_em: s.criada_em, fechada_em: s.fechada_em },
          membros: Object.fromEntries(membros.map((m) => [m.conta, m])),
          estado: estados[0] ?? null,
          resumos: Object.fromEntries(resumos.map((r) => [r.combatente, r])),
          fichas: porComb,
          publicas: Object.fromEntries(publicas.map((p) => [p.seq, p])),
          operacoes: Object.fromEntries(operacoes.map((o) => [o.seq, o])),
          recebidasAoVivo: {},
        };
        const registro = registroParaGuardar(retrato);
        if (existente?.sala?.id === s.sala_id) {
          // O Mestre que criou e não estava no fechamento (a Sala fechou sozinha, parada): o Encontro dele vira Finalizado.
          gravarNaLista(s.grupo, { ...existente, status: "finalizado", ativoId: null, registroSala: registro,
            sala: { ...existente.sala, fechadaEm: s.fechada_em ?? null }, atualizadoEm: Date.now() },
          { armazem, importar: importarPorGrupo[s.grupo] ?? null });
          marcarRecebida(s.sala_id, armazem);
          feitas.push({ salaId: s.sala_id, grupo: s.grupo, personagens: 0 });
          continue;
        }
        const r = gravarFinalizadoDoMembro(retrato, s.grupo, { armazem, importar: importarPorGrupo[s.grupo] ?? null, registro });
        if (r.ok) feitas.push({ salaId: s.sala_id, grupo: s.grupo, personagens: r.personagens });
      } catch (e) {
        console.warn("[sala] recuperação", s.sala_id, e?.codigo ?? e);
      }
    }
    return feitas;
  })().catch((e) => { console.warn("[sala] recuperação", e?.codigo ?? e); recuperando = null; return []; });
  return recuperando;
}
