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
    usos: {},
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
    condicoes: lista(bruta.condicoes),
    buffs: lista(bruta.buffs),
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
 */
export function descansar(sessao, derived) {
  return {
    ...sessao,
    hpAtual: Math.max(0, derived?.hp ?? 0),
    peAtual: Math.max(0, derived?.pe ?? 0),
    pvTempAtual: 0,
    rodada: 0,
    usos: {},
    buffs: sessao.buffs.filter((b) => b.rodadas == null),
    condicoes: sessao.condicoes.filter((c) => c.rodadas == null),
  };
}

/** Empilha uma rolagem no log, com teto. O mais novo fica em cima. */
export function registraRolagem(sessao, rolagem) {
  return { ...sessao, log: [rolagem, ...sessao.log].slice(0, LOG_MAX) };
}

export { LOG_MAX };
