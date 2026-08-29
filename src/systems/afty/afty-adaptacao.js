/**
 * CICLOS DE ADAPTAÇÃO DE ADDON
 *
 * O motor oferece o verbo genérico. O pacote escolhe se o usa. O estado mora
 * na sessão, porque giros, narrativas e a adaptação mecânica são fatos da luta.
 */

import { comConcessao } from "./afty-concessao";
import { AFTY_HABILIDADES, getHabilidade } from "./afty-habilidades";
import { HABILIDADE_EFEITOS, ESCOLHA_EFEITOS } from "./afty-efeitos-conteudo";
import { calcularEfeitoAux, custoEfeitoMult } from "./afty-feiticos";
import { pressaoAcerto, rupturaRd } from "./afty-liberacoes";

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};

const uid = () => `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const chaveDe = (pacoteId, cicloId) => `${pacoteId}:${cicloId}`;

const efeitoAcertoPositivo = (efeito) => (
  efeito?.canal === "bonusAcerto"
  && !String(efeito.expr ?? "").trim().startsWith("-")
);

/** Configurações declaradas pelos addons desta criatura. */
export function ciclosDaCriatura(creature) {
  const out = [];
  for (const pacote of Array.isArray(creature?.addons) ? creature.addons : []) {
    if (!Array.isArray(pacote?.permite) || !pacote.permite.includes("adaptacao")) continue;
    for (const ciclo of Array.isArray(pacote?.adaptacoes) ? pacote.adaptacoes : []) {
      if (!ciclo?.id || !ciclo?.nome) continue;
      out.push({
        ...ciclo,
        pacoteId: pacote.id,
        chave: chaveDe(pacote.id, ciclo.id),
        intervalo: Math.max(1, inteiro(ciclo.intervalo, 5)),
      });
    }
  }
  return out;
}

export function normalizaAdaptacoes(bruta) {
  if (!bruta || typeof bruta !== "object" || Array.isArray(bruta)) return {};
  const out = {};
  for (const [chave, valor] of Object.entries(bruta)) {
    if (!valor || typeof valor !== "object") continue;
    out[chave] = {
      giros: Math.max(0, inteiro(valor.giros)),
      primeiraRodada: valor.primeiraRodada == null ? null : Math.max(0, inteiro(valor.primeiraRodada)),
      ultimaRodadaAutomatica: valor.ultimaRodadaAutomatica == null
        ? null
        : Math.max(0, inteiro(valor.ultimaRodadaAutomatica)),
      pendentes: Math.max(0, inteiro(valor.pendentes)),
      narrativas: (Array.isArray(valor.narrativas) ? valor.narrativas : [])
        .filter((n) => n && typeof n === "object")
        .map((n) => ({ id: String(n.id || uid()), texto: String(n.texto ?? ""), giro: Math.max(0, inteiro(n.giro)) })),
      mecanica: valor.mecanica && typeof valor.mecanica === "object" ? { ...valor.mecanica } : null,
      ganhos: (Array.isArray(valor.ganhos) ? valor.ganhos : [])
        .filter((g) => g && typeof g === "object")
        .map((g) => ({ ...g, giro: Math.max(0, inteiro(g.giro)) })),
    };
  }
  return out;
}

const vazio = () => ({
  giros: 0,
  primeiraRodada: null,
  ultimaRodadaAutomatica: null,
  pendentes: 0,
  narrativas: [],
  mecanica: null,
  ganhos: [],
});

function opcoesDeAcerto(habilidade) {
  return (habilidade?.escolha?.opcoes ?? [])
    .filter((opcao) => (ESCOLHA_EFEITOS[opcao.id] ?? []).some(efeitoAcertoPositivo))
    .map((opcao) => opcao.id);
}

export function habilidadesDeAcerto() {
  return AFTY_HABILIDADES
    .map((habilidade, indice) => ({
      habilidade,
      indice,
      opcoes: opcoesDeAcerto(habilidade),
      direta: (HABILIDADE_EFEITOS[habilidade.id] ?? habilidade.efeitos ?? [])
        .some(efeitoAcertoPositivo),
    }))
    .filter((item) => item.direta || item.opcoes.length)
    .sort((a, b) => (a.habilidade.nivel - b.habilidade.nivel) || (a.indice - b.indice));
}

function primeiroPreRequisitoPendente(id, possuidas, visitadas = new Set()) {
  if (visitadas.has(id)) return null;
  visitadas.add(id);
  const habilidade = getHabilidade(id);
  for (const requisito of habilidade?.requisitos ?? []) {
    if (requisito?.tipo !== "habilidade" || !requisito.id || possuidas.has(requisito.id)) continue;
    const anterior = primeiroPreRequisitoPendente(requisito.id, possuidas, visitadas);
    return anterior ?? getHabilidade(requisito.id) ?? null;
  }
  return null;
}

function proximaHabilidade(derived, sessao) {
  const concedidas = (Array.isArray(sessao?.concedido) ? sessao.concedido : [])
    .filter((c) => c?.familia === "habilidades")
    .map((c) => c.id);
  const possuidas = new Set([...(derived?.habilidades?.escolhidas ?? []), ...concedidas]);
  for (const alvo of habilidadesDeAcerto()) {
    if (possuidas.has(alvo.habilidade.id)) continue;
    const requisito = primeiroPreRequisitoPendente(alvo.habilidade.id, possuidas);
    const habilidade = requisito ?? alvo.habilidade;
    return {
      habilidade,
      alvoId: alvo.habilidade.id,
      requisito: !!requisito,
      opcoes: requisito ? opcoesDeAcerto(requisito) : alvo.opcoes,
    };
  }
  return null;
}

function girarUm(sessao, derived, config, { automatico = false, rodada = null } = {}) {
  const adaptacoes = normalizaAdaptacoes(sessao?.adaptacoes);
  const atual = adaptacoes[config.chave] ?? vazio();
  const giro = atual.giros + 1;
  const rodadaAtual = Math.max(0, inteiro(rodada, sessao?.rodada ?? 0));
  let concedido = sessao?.concedido ?? [];
  let ganhos = atual.ganhos;
  let pendentes = atual.pendentes;

  if (giro % config.intervalo === 0) {
    pendentes += 1;
  } else {
    const ganho = proximaHabilidade(derived, sessao);
    if (ganho) {
      concedido = comConcessao(concedido, "habilidades", ganho.habilidade.id, null, ganho.opcoes);
      ganhos = [...ganhos, {
        id: uid(),
        giro,
        habilidadeId: ganho.habilidade.id,
        nome: ganho.habilidade.nome,
        alvoId: ganho.alvoId,
        requisito: ganho.requisito,
        opcoes: ganho.opcoes,
      }];
    } else {
      ganhos = [...ganhos, { id: uid(), giro, esgotado: true }];
    }
  }

  const primeira = atual.primeiraRodada ?? rodadaAtual;
  const proximo = {
    ...atual,
    giros: giro,
    primeiraRodada: primeira,
    ultimaRodadaAutomatica: automatico ? rodadaAtual : (atual.ultimaRodadaAutomatica ?? rodadaAtual),
    pendentes,
    ganhos,
  };
  return { ...sessao, concedido, adaptacoes: { ...adaptacoes, [config.chave]: proximo } };
}

/** Giro acionado pelo botão. O primeiro liga o avanço automático por rodada. */
export function girarAdaptacao(sessao, derived, chave) {
  const config = (derived?.adaptacoes ?? []).find((c) => c.chave === chave);
  return config ? girarUm(sessao, derived, config) : sessao;
}

/** Um giro automático para cada ciclo iniciado quando a rodada avança. */
export function avancarAdaptacoesNaRodada(sessao, derived, rodada) {
  let proxima = sessao;
  for (const config of derived?.adaptacoes ?? []) {
    const estado = normalizaAdaptacoes(proxima.adaptacoes)[config.chave];
    if (!estado || estado.primeiraRodada == null) continue;
    if ((estado.ultimaRodadaAutomatica ?? estado.primeiraRodada) >= rodada) continue;
    proxima = girarUm(proxima, derived, config, { automatico: true, rodada });
  }
  return proxima;
}

const REQUISITOS = [
  { minimo: 4, id: "impossivel", nome: "Impossível", pe: 10 },
  { minimo: 3, id: "dificil", nome: "Difícil", pe: 6 },
  { minimo: 2, id: "medio", nome: "Médio", pe: 4 },
  { minimo: 1, id: "facil", nome: "Fácil", pe: 2 },
  { minimo: 0, id: null, nome: "Sem requisito", pe: 0 },
];

function requisitoDe(narrativas) {
  return REQUISITOS.find((r) => narrativas >= r.minimo);
}

function nivelNegacao(pe) {
  let nivel = null;
  for (let n = 0; n <= 5; n += 1) if (custoEfeitoMult(n) <= pe) nivel = n;
  return nivel;
}

function calcularMecanica(derived, narrativas) {
  const nivel = Math.max(1, inteiro(derived?.feiticos?.nivelMax, 1));
  const requisito = requisitoDe(narrativas);
  const impossivel = narrativas >= 4;
  const acao = impossivel ? "completa" : "bonus";
  const ataque = calcularEfeitoAux({ efeito: "ataque", nivel, duracao: "sustentada", acao }, { nd: derived?.nd });
  let bonusAcerto = Number(ataque.valor) || 0;
  if (narrativas === 0) bonusAcerto = Math.floor(bonusAcerto / 2);

  const nivelRd = narrativas >= 2 ? nivelNegacao(requisito.pe) : null;
  const negacao = nivelRd == null
    ? 0
    : Math.abs(Number(calcularEfeitoAux(
      { efeito: "negacaoRd", nivel: nivelRd, duracao: "sustentada", acao },
      { nd: derived?.nd },
    ).valor) || 0);
  const liberacao = { melhorias: ["pressao_amaldicoada", "ruptura_absoluta"] };

  return {
    em: Date.now(),
    narrativas,
    requisito: requisito.id,
    requisitoNome: requisito.nome,
    peExtra: requisito.pe,
    nivelFeitico: nivel,
    modo: narrativas === 0 ? "passiva" : "ativa",
    acao: impossivel ? "completa" : narrativas === 0 ? "passiva" : "bonus",
    bonusAcerto: bonusAcerto + (impossivel ? pressaoAcerto(liberacao, nivel) : 0),
    ignoraRD: negacao + (impossivel ? rupturaRd(liberacao, nivel) : 0),
    melhorias: impossivel ? ["Ação Completa", "Pressão Amaldiçoada", "Ruptura Absoluta"] : [],
  };
}

export function escolherAdaptacaoNarrativa(sessao, chave, texto) {
  const adaptacoes = normalizaAdaptacoes(sessao?.adaptacoes);
  const atual = adaptacoes[chave];
  if (!atual || atual.pendentes < 1) return sessao;
  const narrativa = { id: uid(), giro: atual.giros, texto: String(texto ?? "").trim() };
  return {
    ...sessao,
    adaptacoes: {
      ...adaptacoes,
      [chave]: { ...atual, pendentes: atual.pendentes - 1, narrativas: [...atual.narrativas, narrativa] },
    },
  };
}

export function escolherAdaptacaoMecanica(sessao, derived, chave) {
  const adaptacoes = normalizaAdaptacoes(sessao?.adaptacoes);
  const atual = adaptacoes[chave];
  if (!atual || atual.pendentes < 1) return sessao;
  return {
    ...sessao,
    adaptacoes: {
      ...adaptacoes,
      [chave]: {
        ...atual,
        pendentes: atual.pendentes - 1,
        mecanica: calcularMecanica(derived, atual.narrativas.length),
      },
    },
  };
}

/** Efeitos calculados e gravados quando a adaptação mecânica foi escolhida. */
export function efeitosDasAdaptacoes(creature, bruta) {
  const configs = new Set(ciclosDaCriatura(creature).map((c) => c.chave));
  const estados = normalizaAdaptacoes(bruta);
  const out = [];
  for (const [chave, estado] of Object.entries(estados)) {
    if (!configs.has(chave) || !estado.mecanica) continue;
    const m = estado.mecanica;
    const exclusivo = m.modo === "passiva" ? "feiticoAuxiliarPassivo" : "feiticoAuxiliarAtivo";
    if (m.bonusAcerto > 0) out.push({
      canal: "bonusAcerto", expr: String(m.bonusAcerto), nome: "Adaptação Mecânica", exclusivo,
    });
    if (m.ignoraRD > 0) out.push({
      canal: "ignoraRD", expr: String(m.ignoraRD), nome: "Adaptação Mecânica", exclusivo,
    });
  }
  return out;
}

/** Dados prontos para as duas telas de jogo. */
export function resumoAdaptacoes(creature, bruta) {
  const estados = normalizaAdaptacoes(bruta);
  return ciclosDaCriatura(creature).map((config) => ({
    ...config,
    estado: estados[config.chave] ?? vazio(),
  }));
}
