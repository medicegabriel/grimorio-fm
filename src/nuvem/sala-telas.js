/* A LÓGICA PURA DAS TELAS DA SALA (Encontro Unificado, etapa 7c, 2026-11-18).
   FOLHA: só importa folhas (`sala-projecao.js` e `sala-frases.js`, as duas sem import), nunca o motor do Afty.

   O que mora aqui: a faixa da luta do jogador montada dos resumos que a RLS deixa ele ler, os colegas e as criaturas
   que ele vê, o Registro (linhas públicas e completas numa lista só), os pedidos do jogador, os sinais que o jogador manda
   ao aparelho do Mestre (iniciativa e Encerrar Meu Turno) e a rolagem de fórmula do Mestre.

   ⚠ O JOGADOR NÃO TEM NÚMERO DE INICIATIVA. `sala_resumos` só guarda a posição (`posicao`) e quem está na vez (`na_vez`),
   e a ordem completa é do Mestre (`sala_ordem_mestre`). A faixa mostra a posição, nunca um número inventado.

   ⚠ OS SINAIS VIAJAM COMO LINHA DE ROLAGEM (autor, 2026-11-18, "Linha de Rolagem"). O banco confere que o jogador é dono do
   combatente que rola, e o aparelho do Mestre age uma vez por linha: só na vez certa, na rodada certa e na iniciativa ainda
   aberta. Quem já foi tratado fica em `encontro.sala.sinais` (guardado no Encontro, e não na memória, porque um aparelho
   sem cache reler a Sala desde o começo e repetiria todo Encerrar Meu Turno antigo). */

import { FAIXA_FRACAO, FAIXA_ROTULO } from "./sala-projecao";
import { fraseDaPublica, fraseDaCompleta } from "./sala-frases";

const arr = (o) => Object.values(o ?? {});
const ehObjeto = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const inteiro = (v) => Math.trunc(Number(v) || 0);

export const ROTULO_PAPEL = { mestre: "Mestre", jogador: "Jogador", espectador: "Espectador" };
export const VERSAO_PEDIDO = 1;
export const SINAIS_GUARDADOS = 200;

/* ---------- nomes ---------- */

export const nomesDosMembros = (retrato) =>
  Object.fromEntries(arr(retrato?.membros).map((m) => [m.conta, m.nome || "Participante"]));
export const nomesDosCombatentes = (retrato) =>
  Object.fromEntries(arr(retrato?.resumos).map((r) => [r.combatente, r.nome]));

/** Os combatentes de que esta conta é dona. */
export const idsMeus = (retrato) => new Set(arr(retrato?.resumos)
  .filter((r) => r.dono && r.dono === retrato?.eu?.conta).map((r) => r.combatente));

/* ---------- a barra de Vida pelo nível de visão ---------- */

/**
 * O que a barra pode mostrar de um resumo: `{ atual, max, temp }` com os números (personagem e Aberta), `{ faixa, rotulo,
 * fracao }` (Barra de Vida, a Vida em cinco faixas) ou null (Só Nome e Oculta, que não chegam nem aqui).
 */
export function barraDoResumo(resumo) {
  const p = ehObjeto(resumo?.publico) ? resumo.publico : {};
  if (Number(p.pvMax) > 0) return { atual: inteiro(p.pv), max: inteiro(p.pvMax), temp: Math.max(0, inteiro(p.pvTemp)) };
  if (p.faixa && FAIXA_ROTULO[p.faixa]) return { faixa: p.faixa, rotulo: FAIXA_ROTULO[p.faixa], fracao: FAIXA_FRACAO[p.faixa] };
  return null;
}

/* ---------- a faixa da luta ---------- */

/**
 * Os dados da `FaixaDaLuta` de quem está na Sala: a rodada, de quem é a vez e a ordem que esta conta pode ler. A criatura
 * Oculta não tem posição e não entra. Na vez dela nenhum resumo visível está `na_vez`: a faixa diz só que não é a vez
 * de quem olha.
 */
export function faixaDoJogador(retrato) {
  const minhas = idsMeus(retrato);
  const resumos = arr(retrato?.resumos);
  const ordem = resumos.filter((r) => r.posicao != null)
    .sort((a, b) => Number(a.posicao) - Number(b.posicao))
    .map((r) => ({
      id: r.combatente,
      nome: r.nome,
      posicao: Number(r.posicao),
      tipo: minhas.has(r.combatente) ? "minha" : r.tipo === "personagem" ? "colega" : "criatura",
      barra: barraDoResumo(r),
    }));
  const vez = resumos.find((r) => r.na_vez && r.posicao != null) ?? null;
  return {
    rodada: Math.max(1, inteiro(retrato?.estado?.rodada) || 1),
    ativa: retrato?.estado?.status === "ativo",
    vezId: vez?.combatente ?? null,
    minhas: [...minhas],
    ordem,
  };
}

/* ---------- colegas e criaturas ---------- */

const valorDoResumo = (r) => {
  const p = ehObjeto(r?.publico) ? r.publico : {};
  return {
    pv: inteiro(p.pv), pvMax: inteiro(p.pvMax), pvTemp: Math.max(0, inteiro(p.pvTemp)),
    pe: inteiro(p.pe), peMax: inteiro(p.peMax), peTemp: Math.max(0, inteiro(p.peTemp)),
    alma: inteiro(p.alma), almaMax: inteiro(p.almaMax),
    condicoes: Array.isArray(p.condicoes) ? p.condicoes : [], efeitos: Array.isArray(p.efeitos) ? p.efeitos : [],
    caido: p.caido === true, morto: p.morto === true,
    temNumeros: Number(p.pvMax) > 0,
  };
};

/**
 * Os personagens dos outros jogadores, em resumo (Vida, PE, Alma, condições e Efeitos), com quem é o dono, se está online e
 * se a Ficha dele foi compartilhada com esta conta (`compartilhada`: a Ficha inteira pode ser aberta, só leitura).
 */
export function colegasDaSala(retrato) {
  const minhas = idsMeus(retrato);
  const nomes = nomesDosMembros(retrato);
  const online = new Set(retrato?.online ?? []);
  const eu = retrato?.eu?.conta;
  const comigo = new Set(arr(retrato?.compartilhamentos).filter((c) => c.para === eu).map((c) => c.combatente));
  return arr(retrato?.resumos)
    .filter((r) => r.tipo === "personagem" && !minhas.has(r.combatente))
    .sort((a, b) => (Number(a.posicao) || 1e9) - (Number(b.posicao) || 1e9) || String(a.nome).localeCompare(String(b.nome), "pt-BR"))
    .map((r) => ({
      id: r.combatente, nome: r.nome, lado: r.lado, dono: r.dono, donoNome: nomes[r.dono] ?? null,
      online: !!r.dono && online.has(r.dono), compartilhada: comigo.has(r.combatente),
      naVez: !!r.na_vez, resumo: valorDoResumo(r),
    }));
}

/** As criaturas que esta conta enxerga, pelo nível que o Mestre deu a cada uma (a Oculta nem chega). */
export function criaturasDaSala(retrato) {
  return arr(retrato?.resumos)
    .filter((r) => r.tipo !== "personagem" && r.tipo !== "marcador" && r.visao && r.visao !== "oculta")
    .sort((a, b) => (Number(a.posicao) || 1e9) - (Number(b.posicao) || 1e9) || String(a.nome).localeCompare(String(b.nome), "pt-BR"))
    .map((r) => ({
      id: r.combatente, nome: r.nome, lado: r.lado, visao: r.visao, naVez: !!r.na_vez,
      barra: barraDoResumo(r), resumo: r.visao === "aberta" ? valorDoResumo(r) : null,
    }));
}

/** Quem pode ser alvo de um pedido do jogador: os colegas e as criaturas que ele enxerga. */
export const alvosDePedido = (retrato) => [
  ...colegasDaSala(retrato).map((c) => ({ id: c.id, nome: c.nome, tipo: "colega" })),
  ...criaturasDaSala(retrato).map((c) => ({ id: c.id, nome: c.nome, tipo: "criatura" })),
];

/* ---------- o Registro ---------- */

const ICONE_DA_LINHA = { dano: "dano", danoMetade: "dano", alma: "dano", cura: "cura" };

/**
 * O Registro desta conta, da mais antiga para a mais nova: as linhas completas que ela lê e as públicas que não têm
 * completa por trás. A mesma ação não aparece duas vezes (a completa leva o `publica_id` da pública). `tipo` é o que a
 * tela usa para o ícone: chat, rolagem, escondida, pedido, dano, cura, turno, rodada ou livre.
 */
export function linhasDoRegistro(retrato) {
  const membros = nomesDosMembros(retrato);
  const combatentes = nomesDosCombatentes(retrato);
  const completas = arr(retrato?.operacoes);
  const comPublica = new Set(completas.map((o) => o.publica_id).filter(Boolean));
  const linhas = [];
  for (const o of completas) {
    const d = ehObjeto(o.dados) ? o.dados : {};
    const sub = o.especie === "operacao" || o.especie === "pedido" ? d.tipo : o.especie === "sistema" ? d.evento : null;
    linhas.push({
      chave: `c${o.seq}`, quando: o.criado_em, especie: o.especie, estado: o.estado_pedido ?? null,
      tipo: o.escondida ? "escondida" : o.especie === "operacao" ? ICONE_DA_LINHA[sub] ?? "livre"
        : o.especie === "sistema" ? (sub === "turno" ? "turno" : "rodada") : o.especie,
      conta: o.autor ?? null, autor: nomeDoAutor(d.autor?.combatente ? combatentes[d.autor.combatente] : null, membros[o.autor], o.papel),
      texto: fraseDaCompleta(o, { combatentes }, membros), escondida: !!o.escondida, ordem: Number(o.seq) || 0, de: "completa",
    });
  }
  for (const p of arr(retrato?.publicas)) {
    if (comPublica.has(p.id)) continue;
    const pub = ehObjeto(p.publica) ? p.publica : {};
    const sub = pub.tipo ?? pub.evento ?? null;
    linhas.push({
      chave: `p${p.seq}`, quando: p.criado_em, especie: p.especie, estado: p.estado_pedido ?? null,
      tipo: p.especie === "operacao" ? ICONE_DA_LINHA[sub] ?? "livre" : p.especie === "sistema" ? (sub === "turno" ? "turno" : "rodada") : p.especie,
      conta: pub.autor?.conta ?? null, autor: nomeDoAutor(pub.autor?.combatente?.nome, membros[pub.autor?.conta], pub.autor?.papel),
      texto: fraseDaPublica(p, membros), escondida: false, ordem: Number(p.seq) || 0, de: "publica",
    });
  }
  return linhas.sort((a, b) => String(a.quando).localeCompare(String(b.quando)) || a.ordem - b.ordem);
}

function nomeDoAutor(combatente, membro, papel) {
  if (papel === "mestre") return membro ? `${membro} (Mestre)` : "Mestre";
  return combatente ?? membro ?? (papel === "sistema" ? "Aceite Automático" : "Alguém");
}

/* ---------- os pedidos ---------- */

/**
 * Os pedidos que esta conta vê: os que ela fez (`feitos`) e os pendentes em personagens dela feitos por outra pessoa
 * (`recebidos`, que ela aceita ou recusa). O Mestre lê todos, e a tela dele é a do Encontro.
 */
export function pedidosDoJogador(retrato) {
  const eu = retrato?.eu?.conta;
  const meus = idsMeus(retrato);
  const nomes = nomesDosCombatentes(retrato);
  const membros = nomesDosMembros(retrato);
  const linha = (o) => {
    const d = ehObjeto(o.dados) ? o.dados : {};
    return {
      id: o.operacao_id, seq: o.seq, estado: o.estado_pedido, tipo: d.tipo, valor: d.entrada?.valor ?? null,
      alvo: d.alvo, alvoNome: nomes[d.alvo] ?? "Combatente", autorConta: o.autor, autorNome: membros[o.autor] ?? "Alguém",
      autorCombatente: d.autor?.combatente ?? null, criadoEm: o.criado_em, dados: d,
    };
  };
  const pedidos = arr(retrato?.operacoes).filter((o) => o.especie === "pedido").map(linha);
  const porRecente = (a, b) => b.seq - a.seq;
  return {
    feitos: pedidos.filter((p) => p.autorConta === eu).sort(porRecente),
    recebidos: pedidos.filter((p) => p.autorConta !== eu && p.estado === "pendente" && meus.has(p.alvo)).sort(porRecente),
  };
}

/**
 * O pedido do jogador como o banco o recebe (a forma de uma operação com a intenção e sem delta, que o dono do alvo mede
 * no aceite). O `pedido` sai do corpo: o banco guarda o estado na própria coluna.
 */
export function pedidoDoJogador({ id, autor, alvo, tipo, valor, quando = Date.now() }) {
  return {
    id,
    versao: VERSAO_PEDIDO,
    tipo,
    autor: { conta: autor?.conta ?? null, papel: "jogador", combatente: autor?.combatente ?? null },
    alvo,
    entrada: { valor: Math.max(0, inteiro(valor)) },
    delta: [],
    quando,
  };
}

/* ---------- a rolagem de fórmula ---------- */

const FORMULA = /^\s*(\d{0,3})\s*d\s*(\d{1,4})\s*(?:([+-])\s*(\d{1,6}))?\s*$/i;

/**
 * "d20+5" ou "3d8-2". Devolve `{ ok, rolagem }` na forma que a linha de rolagem do banco aceita (tipo, rótulo, fórmula,
 * total, natural, d20, dados). Um d20 é teste, o resto é dano. `rng` devolve [0, 1), como o `Math.random`.
 */
export function rolarFormula(texto, { rotulo = "Rolagem", rng = Math.random } = {}) {
  const m = FORMULA.exec(String(texto ?? ""));
  if (!m) return { ok: false, erro: "Fórmula Inválida" };
  const qtd = m[1] === "" ? 1 : Number(m[1]);
  const faces = Number(m[2]);
  const fixo = m[4] ? Number(m[4]) * (m[3] === "-" ? -1 : 1) : 0;
  if (qtd < 1 || qtd > 100 || faces < 2 || faces > 1000) return { ok: false, erro: "Fórmula Inválida" };
  const dados = Array.from({ length: qtd }, () => 1 + Math.floor(rng() * faces));
  const soma = dados.reduce((a, b) => a + b, 0);
  const d20 = faces === 20 && qtd === 1;
  const formula = `${qtd === 1 ? "" : qtd}d${faces}${fixo ? `${fixo > 0 ? "+" : "-"}${Math.abs(fixo)}` : ""}`;
  return {
    ok: true,
    rolagem: {
      tipo: d20 ? "teste" : "dano", rotulo, formula, total: soma + fixo,
      ...(d20 ? { natural: dados[0], d20: dados, critico: dados[0] === 20 } : { dados }),
    },
  };
}

/* ---------- os sinais do jogador para o aparelho do Mestre ---------- */

const idSeguro = (s) => String(s ?? "").replace(/[^A-Za-z0-9_.:-]/g, "_").slice(0, 60);

/** A iniciativa que o jogador rolou (ou escreveu) para um personagem dele. */
export function sinalDeIniciativa({ combatente, total, mod = 0, natural = null, quando = Date.now() }) {
  const t = inteiro(total);
  return {
    id: `ini:${idSeguro(combatente)}:${quando.toString(36)}`,
    combatente,
    iniciativa: { total: t },
    rolagem: {
      tipo: "teste", rotulo: "Iniciativa", total: t,
      formula: natural != null ? `d20${mod >= 0 ? "+" : "-"}${Math.abs(inteiro(mod))}` : "",
      ...(natural != null ? { natural: inteiro(natural), d20: [inteiro(natural)] } : {}),
    },
  };
}

/** O Encerrar Meu Turno. Leva a rodada em que foi dado, e só vale nela. */
export function sinalDeFimDeTurno({ combatente, rodada, quando = Date.now() }) {
  return {
    id: `fim:${idSeguro(combatente)}:${inteiro(rodada)}:${quando.toString(36)}`,
    combatente,
    fimDeTurno: { rodada: inteiro(rodada) },
    rolagem: { tipo: "info", rotulo: "Encerrar Meu Turno", total: 0 },
  };
}

/**
 * O que o aparelho do Mestre faz com as linhas de sinal que ainda não tratou. `operacoes` é o retrato da Sala, `encontro`
 * o do Mestre (com `sala.sinais`). Devolve `{ agir: [{ id, tipo, combatente, ... }], tratados }`: `agir` são os que valem
 * agora, `tratados` os ids de todos os sinais que não devem voltar a ser olhados (valham ou não).
 *
 * Regras: o combatente é do autor da linha (confere o dono no resumo, o banco já confere o combatente da rolagem);
 * iniciativa só enquanto o Encontro planeja ou enquanto o combatente ainda não tem iniciativa; Encerrar Meu Turno só de
 * quem está na vez e na mesma rodada.
 */
export function sinaisDoJogador({ operacoes, resumos, encontro }) {
  const feitos = new Set(encontro?.sala?.sinais ?? []);
  const agir = [];
  const tratados = [];
  const ordenadas = arr(operacoes).filter((o) => o.especie === "rolagem" && ehObjeto(o.dados) && !o.escondida)
    .sort((a, b) => Number(a.seq) - Number(b.seq));
  for (const o of ordenadas) {
    const d = o.dados;
    const id = typeof d.id === "string" ? d.id : null;
    const ehSinal = ehObjeto(d.iniciativa) || ehObjeto(d.fimDeTurno);
    if (!id || !ehSinal || feitos.has(id)) continue;
    const comb = d.combatente;
    const res = resumos?.[comb];
    const c = encontro?.combatentes?.find((x) => x.id === comb);
    // O personagem que o jogador acabou de pôr ainda não está no Encontro do Mestre (a sincronização o traz no mesmo ciclo): o
    // sinal espera, e não é dado como tratado, senão a iniciativa dele se perderia.
    if (!res || !c) continue;
    tratados.push(id);
    if (!res.dono || res.dono !== o.autor) continue;
    if (ehObjeto(d.iniciativa)) {
      const semIniciativa = c.iniciativa?.rolagem === 0 && !c.iniciativa?.manual;
      if (encontro.status === "planejando" || semIniciativa) agir.push({ id, tipo: "iniciativa", combatente: comb, total: inteiro(d.iniciativa.total) });
    } else if (ehObjeto(d.fimDeTurno)) {
      if (encontro.status === "ativo" && encontro.ativoId === comb && inteiro(encontro.rodada) === inteiro(d.fimDeTurno.rodada)) {
        agir.push({ id, tipo: "fimDeTurno", combatente: comb });
      }
    }
  }
  return { agir, tratados };
}

/** Os ids tratados para guardar no Encontro: os de antes mais os novos, os mais recentes ficam. */
export const guardarSinais = (antes, novos) => [...(antes ?? []), ...novos].slice(-SINAIS_GUARDADOS);

/* ---------- as rolagens novas de uma sessão ---------- */

/**
 * As entradas do `log` de uma sessão que a outra não tinha, da mais antiga para a mais nova. É o que o jogador (e o Mestre)
 * rolou de novo, para virar linha do Registro.
 */
export function rolagensNovas(antes, depois) {
  const ja = new Set((antes?.log ?? []).map((r) => r?.id).filter(Boolean));
  return (depois?.log ?? []).filter((r) => r && r.id && !ja.has(r.id)).reverse();
}

/** A rolagem da Ficha na forma que a linha de rolagem do banco aceita (campos de `ficha-rolagem.js`). */
export function rolagemParaASala(r) {
  const tipo = ["teste", "dano", "info"].includes(r?.tipo) ? r.tipo : "info";
  return {
    tipo,
    rotulo: typeof r?.rotulo === "string" ? r.rotulo.slice(0, 120) : "",
    formula: typeof r?.formula === "string" ? r.formula.slice(0, 200) : "",
    total: inteiro(r?.total),
    ...(Number.isFinite(Number(r?.natural)) && r?.natural != null ? { natural: inteiro(r.natural) } : {}),
    ...(Array.isArray(r?.d20) ? { d20: r.d20.filter((x) => Number.isFinite(Number(x))).slice(0, 4).map(inteiro) } : {}),
    ...(Array.isArray(r?.dados) ? { dados: r.dados.filter((x) => Number.isFinite(Number(x))).slice(0, 100).map(inteiro) } : {}),
    critico: r?.critico === true,
  };
}

/**
 * O Registro de um Encontro Finalizado que veio de uma Sala (`registroSala`), na mesma forma do Registro ao vivo, ou null se
 * o Encontro não tem. Os nomes dos membros ficam em `sala.membros` e os dos combatentes no próprio Encontro.
 */
export function linhasDoFinalizado(encontro) {
  const reg = encontro?.registroSala;
  if (!ehObjeto(reg)) return null;
  const membros = ehObjeto(encontro.sala?.membros) ? encontro.sala.membros : {};
  return linhasDoRegistro({
    membros: Object.fromEntries(Object.entries(membros).map(([conta, nome]) => [conta, { conta, nome }])),
    resumos: Object.fromEntries((encontro.combatentes ?? []).map((c) => [c.id, { combatente: c.id, nome: c.nome }])),
    operacoes: Object.fromEntries((reg.completas ?? []).map((o) => [o.seq, o])),
    publicas: Object.fromEntries((reg.publicas ?? []).map((q) => [q.seq, q])),
  });
}
