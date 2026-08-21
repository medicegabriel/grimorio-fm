/**
 * ============================================================
 * SESSÃO DE JOGO — o estado que só existe com a ficha aberta na mesa
 * ============================================================
 * ⚠ A SESSÃO NÃO MORA NA FICHA. O `createBlankAfty` diz, na primeira linha, o
 * que a ficha é: "só ESCOLHAS, os stats são derivados". PV corrente não é
 * escolha, é runtime.
 *
 * O motivo prático é maior que o filosófico: o criador tem rascunho automático
 * que RESTAURA SOZINHO e um Salvar que grava a ficha inteira. Com a sessão
 * dentro da criatura, abrir o criador com um rascunho de ontem e salvar
 * **apagaria o PV da luta de agora**, calado. Em chave própria, a classe inteira
 * de bug deixa de existir, e de quebra o export da criatura não carrega PV de
 * meio combate.
 *
 * ⚠ O `combatState` do `createBlankAfty` é herança da 2.5.2 e nunca foi lido
 * pelo Afty. Isto o substitui. Ver a pergunta D2 em docs/afty-ficha-final.md.
 *
 * ⚠ O `combate` daqui é IRMÃO e não o mesmo do `creature.combate`. O da ficha é
 * a BANCADA DE BALANCEAMENTO do criador (o autor liga Brutalidade para ver o
 * pico ao montar uma criatura), e o daqui é o que está ligado na mesa AGORA. Se
 * os dois escrevessem no mesmo campo, toda sessão de jogo destruiria o cenário
 * de balanceamento. A Ficha deriva com `{ ...creature, combate: sessao.combate }`.
 * ============================================================
 */

import { normalizaConcedido, comConcessao, semConcessao } from "../afty-concessao";

const CHAVE_BASE = "fm_ficha_sessao_afty_v1";
const LOG_MAX = 50;

const chaveDe = (id) => `${CHAVE_BASE}:${id || "sem-id"}`;

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};

const entre = (v, min, max) => Math.min(max, Math.max(min, v));

/**
 * Sessão nova: recursos cheios. `derived` entra para os máximos, e sem ele a
 * sessão nasce zerada em vez de quebrar (a Ficha sempre passa).
 */
export function sessaoEmBranco(derived = null) {
  return {
    hpAtual: derived?.hp ?? 0,
    peAtual: derived?.pe ?? 0,
    pvTempAtual: 0,
    almaAtual: derived?.almaMax ?? 100,
    rodada: 0,
    combate: {},
    condicoes: [],
    buffs: [],
    // O que o mestre CONCEDEU nesta sessão (Addons 8.3). Estado de sessão e
    // nunca ficha, por decisão do autor (2026-08-20): vale para tudo, não gasta
    // vaga nenhuma e morre junto com a sessão. Ver `afty-concessao.js`.
    concedido: [],
    usos: {},
    ultimoFeiticoDanoId: null,
    rituais: {},
    ritualAtual: null,
    favoritos: [],
    log: [],
    atualizadoEm: null,
  };
}

/**
 * Sanea o que veio do armazenamento. Chave ausente, JSON corrompido e
 * `localStorage` indisponível (modo privado, cota estourada) viram sessão nova,
 * em silêncio: nada disso pode derrubar a Ficha.
 */
export function normalizaSessao(bruta, derived = null) {
  const base = sessaoEmBranco(derived);
  if (!bruta || typeof bruta !== "object") return base;
  const lista = (v) => (Array.isArray(v) ? v : []);
  return {
    ...base,
    ...bruta,
    hpAtual: inteiro(bruta.hpAtual, base.hpAtual),
    peAtual: inteiro(bruta.peAtual, base.peAtual),
    pvTempAtual: Math.max(0, inteiro(bruta.pvTempAtual, 0)),
    almaAtual: Math.max(0, inteiro(bruta.almaAtual, base.almaAtual)),
    rodada: Math.max(0, inteiro(bruta.rodada, 0)),
    combate: bruta.combate && typeof bruta.combate === "object" ? bruta.combate : {},
    usos: bruta.usos && typeof bruta.usos === "object" ? bruta.usos : {},
    ultimoFeiticoDanoId: typeof bruta.ultimoFeiticoDanoId === "string"
      ? bruta.ultimoFeiticoDanoId
      : null,
    rituais: bruta.rituais && typeof bruta.rituais === "object" ? bruta.rituais : {},
    ritualAtual: normalizaRitualAtual(bruta.ritualAtual),
    condicoes: lista(bruta.condicoes),
    buffs: lista(bruta.buffs),
    // ⚠ Passa pelo normalizador PRÓPRIO, e não pelo `lista` genérico: ele é
    // quem descarta família desconhecida e devolve o uid a quem perdeu o dele.
    // Id órfão SOBREVIVE de propósito, e vira linha morta na tela.
    concedido: normalizaConcedido(bruta.concedido),
    favoritos: lista(bruta.favoritos),
    log: lista(bruta.log).slice(0, LOG_MAX),
  };
}

export function carregarSessao(id, derived = null) {
  try {
    const cru = localStorage.getItem(chaveDe(id));
    if (!cru) return sessaoEmBranco(derived);
    return normalizaSessao(JSON.parse(cru), derived);
  } catch {
    return sessaoEmBranco(derived);
  }
}

export function salvarSessao(id, sessao) {
  try {
    localStorage.setItem(chaveDe(id), JSON.stringify({ ...sessao, atualizadoEm: Date.now() }));
    return true;
  } catch {
    // Cota estourada ou armazenamento bloqueado. A Ficha continua funcionando
    // na memória, e o que se perde é a sobrevivência ao recarregar.
    return false;
  }
}

export function limparSessao(id) {
  try {
    localStorage.removeItem(chaveDe(id));
  } catch { /* nada a fazer, e nada a quebrar */ }
}

/**
 * Apara os correntes nos máximos DA VEZ.
 *
 * ⚠ Existe por causa de duas coisas que mexem no teto sem passar por aqui: o
 * criador (uma Melhoria de Alma nova sobe o PV máximo) e a própria Alma, que
 * MULTIPLICA o PV. Uma criatura que perde Alma tem o PV máximo caindo junto, e
 * sem o clamp o corrente ficaria acima do máximo, calado.
 *
 * O PV temporário NÃO é aparado: ele é casca por fora do máximo, por definição.
 */
export function aparaSessao(sessao, derived) {
  const hpMax = Math.max(0, derived?.hp ?? 0);
  const peMax = Math.max(0, derived?.pe ?? 0);
  const almaMax = Math.max(0, derived?.almaMax ?? 100);
  const hpAtual = entre(sessao.hpAtual, 0, hpMax);
  const peAtual = entre(sessao.peAtual, 0, peMax);
  const almaAtual = entre(sessao.almaAtual, 0, almaMax);
  if (hpAtual === sessao.hpAtual && peAtual === sessao.peAtual && almaAtual === sessao.almaAtual) {
    return sessao;
  }
  return { ...sessao, hpAtual, peAtual, almaAtual };
}

/* ============================================================ */
/* CONCESSÃO DO MESTRE (Addons 8.3)                              */
/* ============================================================ */
/* O mestre dá alguma coisa à criatura no meio da luta, e ela passa a valer na
   hora, já calculada. As duas funções são escritoras como as outras daqui:
   recebem a sessão, devolvem outra, e nunca tocam na ficha. */

/** Concede uma entrada de catálogo. Devolve sessão nova. */
export function concedeNaSessao(sessao, familia, id, alvo = null) {
  const concedido = comConcessao(sessao.concedido, familia, id, alvo);
  if (concedido.length === (sessao.concedido?.length ?? 0)) return sessao;
  return { ...sessao, concedido };
}

/** Tira UMA pega concedida, pelo uid. */
export function removeConcessao(sessao, uid) {
  const concedido = semConcessao(sessao.concedido, uid);
  if (concedido.length === (sessao.concedido?.length ?? 0)) return sessao;
  return { ...sessao, concedido };
}

/**
 * Aplica dano.
 *
 * ⚠ A RD NÃO é abatida aqui, de propósito (decisão a confirmar, D9 em
 * docs/afty-ficha-final.md). O Afty tem RD Geral, Específica, Física e a da
 * Alma, e qual delas vale depende do TIPO do dano que chegou, que a Ficha não
 * tem como saber. Abater a errada é pior que não abater nenhuma, então o número
 * entra cru e as RDs ficam à vista no cabeçalho.
 *
 * O PV TEMPORÁRIO come primeiro, e o que sobra desce no PV. É a regra da casca:
 * ela existe para ser gasta antes da vida.
 */
export function aplicaDano(sessao, bruto) {
  const dano = Math.max(0, inteiro(bruto, 0));
  if (!dano) return sessao;
  const doTemp = Math.min(sessao.pvTempAtual, dano);
  return {
    ...sessao,
    pvTempAtual: sessao.pvTempAtual - doTemp,
    hpAtual: Math.max(0, sessao.hpAtual - (dano - doTemp)),
  };
}

/** Aplica cura. Nunca passa do máximo, e nunca ressuscita PV temporário. */
export function aplicaCura(sessao, bruto, hpMax) {
  const cura = Math.max(0, inteiro(bruto, 0));
  if (!cura) return sessao;
  return { ...sessao, hpAtual: entre(sessao.hpAtual + cura, 0, Math.max(0, hpMax)) };
}

/**
 * Fecha a rodada: o contador sobe e toda duração desce um.
 * O que zerou SAI, e volta na lista `expirou` para a Ficha poder avisar (buff
 * que some sem aviso é buff que o jogador continua contando na cabeça).
 */
export function proximaRodada(sessao) {
  const expirou = [];
  const desce = (item) => {
    if (item.rodadas == null) return item;              // sem duração, fica
    const restam = item.rodadas - 1;
    if (restam <= 0) { expirou.push(item); return null; }
    return { ...item, rodadas: restam };
  };
  return {
    sessao: {
      ...sessao,
      rodada: sessao.rodada + 1,
      buffs: sessao.buffs.map(desce).filter(Boolean),
      condicoes: sessao.condicoes.map(desce).filter(Boolean),
    },
    expirou,
  };
}

/**
 * Descanso. Zera os usos gastos e os buffs com duração, e devolve os recursos.
 *
 * ⚠ O que cada tipo de descanso devolve no Afty é PERGUNTA ABERTA (D3). Até o
 * autor responder, o botão é um só e devolve tudo, que é o comportamento que
 * não engana: um descanso que devolvesse metade sem regra escrita seria número
 * inventado.
 *
 * ⚠ SEM `derived` a sessão volta INTACTA (2026-08-09). O `?? 0` abaixo fazia um
 * descanso sem os derivados ZERAR o PV e o PE em vez de reenchê-los, que é o
 * oposto do que o botão promete e não tem desfazer. Quem chama sem derivados é
 * quem não conseguiu calcular a ficha, e nesse caso não mexer é a única resposta
 * honesta: não dá para reencher até um máximo que ninguém sabe qual é.
 */
export function descansar(sessao, derived) {
  if (!derived) return sessao;
  return {
    ...sessao,
    hpAtual: Math.max(0, derived?.hp ?? 0),
    peAtual: Math.max(0, derived?.pe ?? 0),
    pvTempAtual: 0,
    rodada: 0,
    usos: {},
    buffs: sessao.buffs.filter((b) => b.rodadas == null),
    condicoes: sessao.condicoes
      .filter((c) => c.rodadas == null)
      .filter((c) => c.id !== CHAVE_CONDICAO_RITUAL_ESTENDIDO),
    ritualAtual: null,
  };
}

const chaveUsoEstado = (id) => `estado:${id}:rodada`;

/** Um estado limitado já foi ativado na rodada atual? */
export function estadoUsadoNestaRodada(sessao, id) {
  return sessao?.usos?.[chaveUsoEstado(id)] === sessao?.rodada;
}

/**
 * Altera um estado catalogado e registra a ativação dos que só podem ser usados
 * uma vez por rodada. Desligar continua permitido, mas não libera uma segunda
 * ativação na mesma rodada.
 */
export function alteraEstadoCombate(sessao, estado, valor) {
  if (!estado?.id) return sessao;
  const combate = sessao?.combate && typeof sessao.combate === "object" ? sessao.combate : {};
  const ativando = !!valor && !combate[estado.id];
  if (ativando && estado.umaVezPorRodada && estadoUsadoNestaRodada(sessao, estado.id)) {
    return sessao;
  }
  return {
    ...sessao,
    combate: { ...combate, [estado.id]: valor },
    usos: ativando && estado.umaVezPorRodada
      ? { ...(sessao.usos || {}), [chaveUsoEstado(estado.id)]: sessao.rodada }
      : sessao.usos,
  };
}

/** Consome um estado de próximo uso sem apagar o registro da rodada. */
export function consomeEstadoCombate(sessao, id) {
  if (!id || !sessao?.combate?.[id]) return sessao;
  return { ...sessao, combate: { ...sessao.combate, [id]: false } };
}

/** Guarda o Feitiço de dano cuja primeira rolagem foi usada por último. */
export function registraFeiticoDano(sessao, id) {
  if (!id || sessao?.ultimoFeiticoDanoId === id) return sessao;
  return { ...sessao, ultimoFeiticoDanoId: id };
}

/** Atualiza a preparação de Ritual de um Feitiço sem tocar nas outras linhas. */
export function configuraRitual(sessao, feiticoId, proxima) {
  if (!feiticoId) return sessao;
  const rituais = sessao?.rituais && typeof sessao.rituais === "object" ? sessao.rituais : {};
  const atual = rituais[feiticoId] && typeof rituais[feiticoId] === "object"
    ? rituais[feiticoId]
    : {};
  const valor = typeof proxima === "function" ? proxima(atual) : proxima;
  if (!valor || typeof valor !== "object") return sessao;
  return { ...sessao, rituais: { ...rituais, [feiticoId]: valor } };
}

const CHAVE_USO_RITUALISTA = "cnj_ritualista";
const CHAVE_CONDICAO_RITUAL_ESTENDIDO = "ritual:desprevenido";

const ETAPAS_RITUAL = new Set(["pronto", "falhou", "preparando", "resolvido"]);

function normalizaRitualAtual(valor) {
  if (!valor || typeof valor !== "object" || typeof valor.feiticoId !== "string") return null;
  const etapa = valor.etapa === "adiado" ? "pronto" : valor.etapa;
  if (!ETAPAS_RITUAL.has(etapa)) return null;
  return {
    feiticoId: valor.feiticoId,
    tipo: valor.tipo === "estendido" ? "estendido" : "comum",
    etapa,
    usaRitualista: !!valor.usaRitualista,
  };
}

export function ritualEmAndamento(sessao) {
  return normalizaRitualAtual(sessao?.ritualAtual);
}

export function usosRitualista(sessao) {
  return Math.max(0, inteiro(sessao?.usos?.[CHAVE_USO_RITUALISTA], 0));
}

/** Consome uma aplicação da melhoria adicional de Ritualista. */
export function consomeRitualista(sessao) {
  return {
    ...sessao,
    usos: { ...(sessao.usos || {}), [CHAVE_USO_RITUALISTA]: usosRitualista(sessao) + 1 },
  };
}

const comRitualistaConsumido = (sessao, usaRitualista) => (
  usaRitualista ? consomeRitualista(sessao) : sessao
);

const removeCondicaoRitualEstendido = (sessao) => ({
  ...sessao,
  condicoes: (sessao.condicoes ?? []).filter((c) => c.id !== CHAVE_CONDICAO_RITUAL_ESTENDIDO),
});

const desarmaRitualistaDoFeitico = (sessao, feiticoId) => configuraRitual(
  sessao,
  feiticoId,
  (ritual) => ({ ...ritual, extraRitualista: false }),
);

/** Registra o resultado do teste do Ritual comum. */
export function iniciaRitualComum(sessao, feiticoId, sucesso, usaRitualista = false) {
  if (!feiticoId || ritualEmAndamento(sessao)) return sessao;
  const consumido = comRitualistaConsumido(sessao, usaRitualista);
  return {
    ...consumido,
    ritualAtual: {
      feiticoId,
      tipo: "comum",
      etapa: sucesso ? "pronto" : "falhou",
      usaRitualista: !!usaRitualista,
    },
  };
}

/** Inicia um Ritual comum cuja fonte dispensa o teste de Prestidigitação. */
export function iniciaRitualSemTeste(sessao, feiticoId, usaRitualista = false) {
  return iniciaRitualComum(sessao, feiticoId, true, usaRitualista);
}

/** Começa o primeiro turno do Ritual Estendido e aplica Desprevenido. */
export function iniciaRitualEstendido(sessao, feiticoId, usaRitualista = false) {
  if (!feiticoId || ritualEmAndamento(sessao)) return sessao;
  const consumido = comRitualistaConsumido(sessao, usaRitualista);
  const semMarcadorAnterior = (consumido.condicoes ?? [])
    .filter((c) => c.id !== CHAVE_CONDICAO_RITUAL_ESTENDIDO);
  return {
    ...consumido,
    condicoes: [
      ...semMarcadorAnterior,
      {
        id: CHAVE_CONDICAO_RITUAL_ESTENDIDO,
        nome: "Desprevenido",
        forca: "fraca",
        rodadas: null,
      },
    ],
    ritualAtual: {
      feiticoId,
      tipo: "estendido",
      etapa: "preparando",
      usaRitualista: !!usaRitualista,
    },
  };
}

/** O botão conclui a preparação estendida ou a continuação escolhida após a falha. */
export function concluiPreparacaoRitual(sessao, feiticoId) {
  const atual = ritualEmAndamento(sessao);
  if (!atual || atual.feiticoId !== feiticoId) return sessao;
  if (!["falhou", "preparando"].includes(atual.etapa)) return sessao;
  return {
    ...sessao,
    ritualAtual: {
      ...atual,
      etapa: "pronto",
    },
  };
}

/** Cancela ou interrompe o Ritual sem devolver Ritualista já gasto. */
export function cancelaRitual(sessao, feiticoId) {
  const atual = ritualEmAndamento(sessao);
  if (!atual || atual.feiticoId !== feiticoId) return sessao;
  const limpo = removeCondicaoRitualEstendido({ ...sessao, ritualAtual: null });
  return atual.usaRitualista ? desarmaRitualistaDoFeitico(limpo, feiticoId) : limpo;
}

/** O Feitiço pode ser resolvido agora, depois do teste ou da preparação. */
export function ritualProntoParaResolver(sessao, feiticoId) {
  const atual = ritualEmAndamento(sessao);
  return !!atual && atual.feiticoId === feiticoId && atual.etapa === "pronto";
}

/** Marca o Feitiço como resolvido e conserva o estado até o botão Encerrar. */
export function finalizaRitual(sessao, feiticoId) {
  const atual = ritualEmAndamento(sessao);
  if (!atual || atual.feiticoId !== feiticoId || !ritualProntoParaResolver(sessao, feiticoId)) {
    return sessao;
  }
  return removeCondicaoRitualEstendido({
    ...sessao,
    ritualAtual: { ...atual, etapa: "resolvido" },
  });
}

/** Encerra o Ritual resolvido e libera o botão para outro uso. */
export function encerraRitual(sessao, feiticoId) {
  const atual = ritualEmAndamento(sessao);
  if (!atual || atual.feiticoId !== feiticoId || atual.etapa !== "resolvido") return sessao;
  const limpo = { ...sessao, ritualAtual: null };
  return atual.usaRitualista ? desarmaRitualistaDoFeitico(limpo, feiticoId) : limpo;
}

/**
 * Desliga o Ritual daquele Feitiço e libera imediatamente outro uso.
 * As melhorias permanecem salvas para uma ativação futura. Ritualista já
 * consumido não é devolvido, seguindo o mesmo caminho de Cancelar e Encerrar.
 */
export function desativaRitual(sessao, feiticoId) {
  if (!feiticoId) return sessao;
  const atual = ritualEmAndamento(sessao);
  let proxima = sessao;
  if (atual?.feiticoId === feiticoId) {
    proxima = atual.etapa === "resolvido"
      ? encerraRitual(sessao, feiticoId)
      : cancelaRitual(sessao, feiticoId);
  }
  return configuraRitual(proxima, feiticoId, (ritual) => ({ ...ritual, ativo: false }));
}

/** Empilha uma rolagem no log, com teto. O mais novo fica em cima. */
export function registraRolagem(sessao, rolagem) {
  return { ...sessao, log: [rolagem, ...sessao.log].slice(0, LOG_MAX) };
}

export { LOG_MAX };
