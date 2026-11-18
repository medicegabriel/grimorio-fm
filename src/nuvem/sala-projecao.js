/* O que cada um vê na Sala online (Encontro Unificado, etapa 7a, 2026-11-17).
   FOLHA, zero imports: o cliente da Sala (etapa 7b) e as telas (7c) importam
   daqui sem puxar o motor nem o ciclo de módulos do Afty.

   ⚠ REGRA ESCRITA DUAS VEZES. Quem manda é o BANCO: as funções do esquema
   sala_interno em supabase/salas.sql cortam o resumo, a versão pública da
   operação e a ordem do jogador a partir da visão gravada lá, e o cliente nunca
   manda um corte pronto. Este arquivo é o espelho, campo por campo, para a tela
   do Mestre mostrar o que o jogador vê e para os asserts. Mudou um, muda o
   outro: o asserts/t-sala-projecao.mjs confere as constantes dos dois e roda os
   casos de asserts/sala-projecao-casos.json, os mesmos que provam o SQL.

   Os níveis de um combatente no Registro público: 0 Oculta (ou ausente), 1 Só
   Nome, 2 Barra de Vida, 3 Aberta. O personagem conta como Aberta, porque o
   colega lê o resumo dele sempre (plano: "Ver colegas"). Uma operação com
   QUALQUER envolvido no nível 0 não existe para o jogador. O que se diz do alvo
   vai até o nível do alvo. Decisões do autor em 2026-11-17: Barra de Vida em
   cinco faixas, em Só Nome e Barra só o valor rolado de Dano e Cura, e a
   rolagem escondida não aparece. */

export const VISAO = Object.freeze({ OCULTA: "oculta", NOME: "nome", BARRA: "barra", ABERTA: "aberta" });
export const NIVEL = Object.freeze({ OCULTA: 0, NOME: 1, BARRA: 2, ABERTA: 3 });

/* As cinco faixas da Barra de Vida, com os cortes de 50% e 25% da barra curta
   do Encontro. `FAIXA_FRACAO` é quanto a barra desenha cheia. */
export const FAIXA = Object.freeze({
  INTEIRA: "inteira",
  ACIMA_DA_METADE: "acima_da_metade",
  ATE_A_METADE: "ate_a_metade",
  ATE_UM_QUARTO: "ate_um_quarto",
  CAIDA: "caida",
});
export const FAIXA_ROTULO = Object.freeze({
  inteira: "Inteira",
  acima_da_metade: "Acima da Metade",
  ate_a_metade: "Até a Metade",
  ate_um_quarto: "Até um Quarto",
  caida: "Caída",
});
export const FAIXA_FRACAO = Object.freeze({
  inteira: 1, acima_da_metade: 0.75, ate_a_metade: 0.5, ate_um_quarto: 0.25, caida: 0,
});

export const ESPECIES = Object.freeze(["operacao", "pedido", "rolagem", "chat", "sistema"]);
export const TIPOS_DE_OPERACAO = Object.freeze([
  "dano", "danoMetade", "cura", "gastarPe", "recuperarPe", "descansar", "alma", "condicao", "sessao", "desfazer",
]);
/** O valor rolado que aparece em toda visão (autor: "Dano e Cura Rolados"). */
export const VALOR_EM_TODA_VISAO = Object.freeze(["dano", "danoMetade", "cura"]);
/** O valor que só aparece com o alvo Aberto (ou personagem). */
export const VALOR_SO_ABERTA = Object.freeze(["gastarPe", "recuperarPe", "alma"]);
export const EVENTOS_DO_SISTEMA = Object.freeze(["comecar", "turno", "rodada", "encerrar", "reabrir", "entrou", "saiu"]);
export const TIPOS_DE_ROLAGEM = Object.freeze(["teste", "dano", "info"]);
export const MODOS_DA_ALMA = Object.freeze(["dano", "cura", "definir"]);
export const MODOS_DA_CONDICAO = Object.freeze(["adicionar", "remover", "definir"]);
/** Onde mora a Vida no estado de cada motor (`hpAtual` no Afty, `hpCurrent` na 2.5.2). */
export const CAMINHOS_DA_VIDA = Object.freeze(["hpAtual", "hpCurrent"]);
export const LIMITE = Object.freeze({
  inteiro: 1000000000, itens: 40, nome: 80, chat: 1000, rotulo: 120, formula: 200, dados: 100, d20: 4, evento: 20,
});

const ehObjeto = (v) => !!v && typeof v === "object" && !Array.isArray(v);

/* Corta em n caracteres contando como o Postgres (por ponto de código, e não
   pela metade de um emoji). */
const corte = (s, n) => Array.from(s).slice(0, n).join("");

/** Número do JSON: só número de verdade, truncado e preso entre -1e9 e 1e9. O resto vira 0. */
export function inteiroDoJson(v) {
  if (typeof v !== "number" || !Number.isFinite(v)) return 0;
  return Math.max(-LIMITE.inteiro, Math.min(LIMITE.inteiro, Math.trunc(v))) || 0;
}

/** Texto do JSON, cortado. O que não é texto vira "". */
export const textoDoJson = (v, tamanho) => (typeof v === "string" ? corte(v, tamanho) : "");

/** Lista de textos não vazios, os primeiros `itens`, cada um cortado. */
export function textosDoJson(v, itens, tamanho) {
  if (!Array.isArray(v)) return [];
  return v.filter((s) => typeof s === "string" && s !== "").slice(0, itens).map((s) => corte(s, tamanho));
}

/** Lista de números, os primeiros `itens`, cada um pelo `inteiroDoJson`. */
export function inteirosDoJson(v, itens) {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "number" && Number.isFinite(x)).slice(0, itens).map(inteiroDoJson);
}

/** Nomes de condição: texto, ou objeto com `nome`. Um item solto vira lista de um. */
export function nomesDoJson(v, itens, tamanho) {
  const lista = Array.isArray(v) ? v : typeof v === "string" || ehObjeto(v) ? [v] : [];
  return lista
    .map((x) => (typeof x === "string" ? x : ehObjeto(x) && typeof x.nome === "string" ? x.nome : ""))
    .filter((s) => s !== "")
    .slice(0, itens)
    .map((s) => corte(s, tamanho));
}

/**
 * O resumo completo que o dono publica (a forma do `resumo` dos motores), só com
 * os campos conhecidos. A Vida pode ser negativa (o saldo do Vital CL2).
 */
export function resumoSaneado(r) {
  const o = ehObjeto(r) ? r : {};
  const n = (v) => Math.max(0, inteiroDoJson(v));
  return {
    pv: inteiroDoJson(o.pv),
    pvMax: n(o.pvMax),
    pvTemp: n(o.pvTemp),
    pe: n(o.pe),
    peMax: n(o.peMax),
    peTemp: n(o.peTemp),
    alma: n(o.alma),
    almaMax: n(o.almaMax),
    condicoes: textosDoJson(o.condicoes, LIMITE.itens, LIMITE.nome),
    efeitos: textosDoJson(o.efeitos, LIMITE.itens, LIMITE.nome),
    caido: o.caido === true,
    morto: o.morto === true,
  };
}

/** A faixa da Barra de Vida. Conta inteira, sem fração. Sem máximo, sem faixa (null). */
export function faixaDeVida(pv, max) {
  if (max == null || max <= 0) return null;
  if (pv <= 0) return FAIXA.CAIDA;
  if (pv * 4 <= max) return FAIXA.ATE_UM_QUARTO;
  if (pv * 2 <= max) return FAIXA.ATE_A_METADE;
  if (pv < max) return FAIXA.ACIMA_DA_METADE;
  return FAIXA.INTEIRA;
}

/**
 * O resumo que o jogador lê de um combatente, a partir do COMPLETO já saneado.
 * Personagem e Aberta: o completo. Barra: só a faixa. Só Nome, Oculta e
 * marcador: nada. Sem completo publicado: nada.
 */
export function resumoPorVisao(completo, { tipo, visao } = {}) {
  if (completo == null || tipo === "marcador") return {};
  if (tipo === "personagem" || visao === VISAO.ABERTA) return completo;
  if (visao === VISAO.BARRA) return { faixa: faixaDeVida(inteiroDoJson(completo.pv), inteiroDoJson(completo.pvMax)) };
  return {};
}

/** O nível de um combatente (`{ tipo, visao }`, ou null quando não está na Sala). */
export function nivelDoCombatente(c) {
  if (!c) return NIVEL.OCULTA;
  if (c.tipo === "personagem" || c.visao === VISAO.ABERTA) return NIVEL.ABERTA;
  if (c.visao === VISAO.BARRA) return NIVEL.BARRA;
  if (c.visao === VISAO.NOME) return NIVEL.NOME;
  return NIVEL.OCULTA;
}

const textoOuNull = (v) => (typeof v === "string" ? v : null);

/** Os envolvidos, sem repetir, na ordem: alvo, combatente do autor, quem aplicou. Na rolagem e no evento, o combatente. */
export function envolvidosDe(especie, dados) {
  const d = ehObjeto(dados) ? dados : {};
  let lista = [];
  if (especie === "operacao" || especie === "pedido") {
    const aplicador = textoOuNull(ehObjeto(d.entrada) ? d.entrada.aplicadorId : null);
    lista = [
      textoOuNull(d.alvo),
      textoOuNull(ehObjeto(d.autor) ? d.autor.combatente : null),
      aplicador === "proprio" ? null : aplicador,
    ];
  } else if (especie === "rolagem" || especie === "sistema") {
    lista = [textoOuNull(d.combatente)];
  }
  const vistos = [];
  for (const c of lista) if (c && !vistos.includes(c)) vistos.push(c);
  return vistos;
}

const ehCaminhoDaVida = (c) => Array.isArray(c) && c.length === 1 && CAMINHOS_DA_VIDA.includes(c[0]);

/**
 * A VERSÃO PÚBLICA de um registro da Sala, ou null quando ele não pode ser visto.
 *
 * `registro`: `{ especie, dados, escondida }`, com `dados.autor` já como o
 * servidor grava (`{ conta, papel, combatente? }`).
 * `contexto.combatente(id)`: `{ tipo, visao, nome, completo }` do combatente na
 * Sala naquela hora (`completo` saneado, ou null), ou null se ele não está lá.
 * `contexto.publicaDe(id)`: o id público da operação desfeita, ou null.
 * `contexto.responde`: o id público do pedido que esta operação aceita, ou null.
 */
export function versaoPublica({ especie, dados, escondida = false } = {}, { combatente = () => null, publicaDe = () => null, responde = null } = {}) {
  if (escondida) return null;
  const d = ehObjeto(dados) ? dados : {};
  let min = NIVEL.ABERTA;
  for (const id of envolvidosDe(especie, d)) min = Math.min(min, nivelDoCombatente(combatente(id)));
  if (min === NIVEL.OCULTA) return null;

  const ref = (id) => ({ id, nome: combatente(id)?.nome ?? null });
  const autorBruto = ehObjeto(d.autor) ? d.autor : {};
  const autor = { conta: autorBruto.conta ?? null, papel: autorBruto.papel ?? null };
  if ((especie === "operacao" || especie === "pedido") && typeof autorBruto.combatente === "string") {
    autor.combatente = ref(autorBruto.combatente);
  }
  const saida = { especie, autor };

  if (especie === "chat") return { ...saida, texto: textoDoJson(d.texto, LIMITE.chat) };

  if (especie === "sistema") {
    saida.evento = textoDoJson(d.evento, LIMITE.evento);
    if (typeof d.rodada === "number") saida.rodada = inteiroDoJson(d.rodada);
    if (typeof d.combatente === "string") saida.combatente = ref(d.combatente);
    return saida;
  }

  if (especie === "rolagem") {
    const r = ehObjeto(d.rolagem) ? d.rolagem : {};
    if (typeof d.combatente === "string") saida.combatente = ref(d.combatente);
    saida.tipo = TIPOS_DE_ROLAGEM.includes(r.tipo) ? r.tipo : null;
    saida.total = inteiroDoJson(r.total);
    // Só de quem está Aberto (ou de personagem, ou sem combatente): o detalhe conta a ficha de quem rolou.
    if (min >= NIVEL.ABERTA) {
      Object.assign(saida, {
        rotulo: textoDoJson(r.rotulo, LIMITE.rotulo),
        formula: textoDoJson(r.formula, LIMITE.formula),
        natural: inteiroDoJson(r.natural),
        d20: inteirosDoJson(r.d20, LIMITE.d20),
        dados: inteirosDoJson(r.dados, LIMITE.dados),
        critico: r.critico === true,
      });
    }
    return saida;
  }

  // Operação e pedido. O que se diz do ALVO vai até o nível dele.
  const alvo = textoOuNull(d.alvo);
  const cAlvo = combatente(alvo);
  const nivel = nivelDoCombatente(cAlvo);
  const tipo = textoOuNull(d.tipo);
  const entrada = ehObjeto(d.entrada) ? d.entrada : {};
  saida.tipo = tipo;
  saida.alvo = ref(alvo);

  if (typeof entrada.valor === "number"
    && (VALOR_EM_TODA_VISAO.includes(tipo) || (nivel >= NIVEL.ABERTA && VALOR_SO_ABERTA.includes(tipo)))) {
    saida.valor = Math.max(0, inteiroDoJson(entrada.valor));
  }
  if (nivel >= NIVEL.ABERTA && tipo === "alma") {
    saida.modo = MODOS_DA_ALMA.includes(entrada.modo) ? entrada.modo : "dano";
  }
  if (nivel >= NIVEL.ABERTA && tipo === "condicao") {
    saida.modo = MODOS_DA_CONDICAO.includes(entrada.modo) ? entrada.modo : "definir";
    saida.condicoes = nomesDoJson(saida.modo === "definir" ? entrada.condicoes : entrada.condicao, LIMITE.itens, LIMITE.nome);
  }
  if (tipo === "desfazer") {
    saida.tipoDesfeito = TIPOS_DE_OPERACAO.includes(entrada.tipoDesfeito) && entrada.tipoDesfeito !== "desfazer"
      ? entrada.tipoDesfeito : null;
    saida.desfaz = publicaDe(d.desfaz) ?? null;
  }

  // A Vida do alvo: em Barra a faixa antes e depois, em Aberta os números.
  const mudanca = (Array.isArray(d.delta) ? d.delta : []).find((m) => ehObjeto(m) && ehCaminhoDaVida(m.caminho));
  if (mudanca && typeof mudanca.antes === "number" && typeof mudanca.depois === "number") {
    if (nivel >= NIVEL.ABERTA) {
      saida.vida = { antes: inteiroDoJson(mudanca.antes), depois: inteiroDoJson(mudanca.depois) };
    } else if (nivel === NIVEL.BARRA) {
      const max = cAlvo?.completo == null ? null : inteiroDoJson(cAlvo.completo.pvMax);
      saida.vida = { antes: faixaDeVida(inteiroDoJson(mudanca.antes), max), depois: faixaDeVida(inteiroDoJson(mudanca.depois), max) };
    }
  }
  if (responde) saida.responde = responde;
  return saida;
}

const visivel = (c) => !!c && (c.tipo === "personagem" || (typeof c.visao === "string" && c.visao !== VISAO.OCULTA));

/**
 * A ordem vista pelo jogador: os visíveis na ordem do Mestre (a primeira vez que
 * o id aparece), com a posição contada SÓ entre eles (sem buraco que revele um
 * Oculto), e `naVez` só se quem joga é visível. Na vez de um Oculto, ninguém.
 *
 * `combatentes`: `[{ combatente, tipo, visao }]`.
 */
export function ordemVistaPeloJogador(ordem = [], vez = null, combatentes = []) {
  const porId = new Map(combatentes.map((c) => [c.combatente, c]));
  const vistos = new Set();
  const saida = [];
  for (const id of ordem) {
    if (vistos.has(id)) continue;
    vistos.add(id);
    if (!visivel(porId.get(id))) continue;
    saida.push({ combatente: id, posicao: saida.length + 1, naVez: id === vez });
  }
  return saida;
}
