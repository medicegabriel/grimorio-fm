/**
 * ============================================================
 * VOTOS DE RESTRIÇÃO: O CICLO DE VIDA (CL3, 2026-11-01)
 * ============================================================
 * Livro de Regras p.350 a 358. As regras (pesos, legalidade, contas) moram em `ficha-votos-regras.js`. Aqui moram as
 * OPERAÇÕES: realizar, quebrar, desfazer, vencer o prazo, fechar o combate, chegar o interlúdio, aceitar um contrato.
 *
 * ⚠ O ESTADO É DA FICHA, NÃO DA SESSÃO. O Voto vive em `creature.votos`, viaja no export e sobrevive ao descanso.
 * Toda operação recebe o objeto `votos` (de preferência `votosDaFicha(creature)`, que já traz os Votos automáticos de
 * Addon) e devolve `{ votos, aplicado, ... }`. Quem chama grava `creature.votos = resultado.votos`. A sessão entra só
 * quando a operação gasta uma ação (`registraAcao` com `sessao` e `derived`), e então volta também em `sessao`.
 *
 * ⚠ RECUSA NÃO MUDA NADA: `votos` volta o MESMO objeto, com `erro`, `codigo` e a lista `recusas`.
 *
 * ⚠ IDENTIDADE DA OPERAÇÃO. `opId` é obrigatório nas operações que escrevem, como no contrato de uso do CL1. Ele fica
 * no `historico` do próprio Voto, e repetir o id devolve `repetida` sem aplicar de novo. O histórico guarda os últimos
 * 50 eventos, então a identidade vale pela janela deles.
 *
 * ⚠ A MESA INFORMA, A FICHA NÃO DECIDE. A consequência de quebrar um Voto Contratual (p.356) e o custo de desfazer um
 * Voto Próprio Temporário (p.351) não têm número no livro. Entram como TEXTO escrito pela mesa e nunca são aplicados.
 * Romper um Voto Próprio Permanente não está escrito em lugar nenhum: a operação recusa, e a pergunta está na fila.
 *
 * ⚠ SEM EVENTO DE INTERLÚDIO NO SITE. "Até o seu próximo interlúdio" (p.351) é uma transição que a MESA aciona
 * (`votosNoInterludio`), nunca o botão de descanso.
 * ============================================================
 */
import { createBlankVotoContratual, createBlankVotoMecanico } from "../afty-votos";
import {
  ACAO_DO_VOTO, HISTORICO_MAX, balancoDaCongenita, votoTipado, validaVoto,
} from "./ficha-votos-regras";
import { gastaAcao } from "./ficha-acoes";

const lista = (v) => (Array.isArray(v) ? v : []);
const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};

const semIdentidade = (votos) => ({ votos, aplicado: false, erro: "Sem Identidade da Operação", codigo: "sem-opid" });
const recusa = (votos, erro, codigo, recusas = null) => ({ votos, aplicado: false, erro, codigo, ...(recusas ? { recusas } : {}) });

/* ============================================================ */
/* LEITURA                                                       */
/* ============================================================ */
/** O Voto daquele id, nas duas listas, com a lista onde mora. */
export function acharVoto(votos, id) {
  const m = lista(votos?.mecanicos).findIndex((v) => v?.id === id);
  if (m >= 0) return { lista: "mecanicos", indice: m, voto: votos.mecanicos[m], contratual: false };
  const c = lista(votos?.contratuais).findIndex((v) => v?.id === id);
  if (c >= 0) return { lista: "contratuais", indice: c, voto: votos.contratuais[c], contratual: true };
  return null;
}

const substitui = (votos, achado, voto) => ({
  ...votos,
  [achado.lista]: lista(votos[achado.lista]).map((v, i) => (i === achado.indice ? voto : v)),
});

const jaTemOperacao = (voto, opId) => !!opId && lista(voto?.historico).some((h) => h.opId === opId);

/** Acrescenta um evento ao histórico do Voto, no fim, dentro do teto. */
function comEvento(voto, evento, { opId = null, rodada = null, nota = "" } = {}) {
  const entrada = {
    evento,
    ...(opId ? { opId } : {}),
    ...(rodada != null ? { rodada: Math.max(0, inteiro(rodada)) } : {}),
    ...(nota ? { nota: String(nota).slice(0, 400) } : {}),
  };
  return { ...voto, historico: [...lista(voto.historico), entrada].slice(-HISTORICO_MAX) };
}

/** Quantos Votos Mecânicos valem agora. O Voto livre (sem tipo ou sem estado) conta, como sempre contou. */
export function votosVigentes(votos) {
  return lista(votos?.mecanicos).filter((v) => (votoTipado(v) ? !v.estado || v.estado === "vigente" || v.estado === "quebrado" : true)).length;
}

/** A ação que realiza o Voto, ou `null` (a Restrição Congênita é feita na criação). */
export function acaoDoVoto(voto, contratual = false) {
  if (contratual) return ACAO_DO_VOTO.contratual;
  return ACAO_DO_VOTO[voto?.tipo] ?? null;
}

/* ============================================================ */
/* CRIAÇÃO                                                       */
/* ============================================================ */
/**
 * Um Voto Mecânico tipado, ainda só PROPOSTO (não emite efeito). `campos` traz o que a pessoa escolheu:
 * `tipo`, `permanencia`, `nome`, `narrativa`, `beneficio` e `maleficio` (`{ texto, efeitos, peso, envolve }`), `duracao`,
 * `aptidoes`, `antecipaAptidao`, `congenita`.
 */
export function novoVotoTipado(campos = {}) {
  const base = createBlankVotoMecanico();
  const lado = (l) => ({ ...base.beneficio, ...(l ?? {}), efeitos: lista(l?.efeitos) });
  return {
    ...base,
    ...(typeof campos.nome === "string" ? { nome: campos.nome } : {}),
    ...(typeof campos.narrativa === "string" ? { narrativa: campos.narrativa } : {}),
    beneficio: lado(campos.beneficio),
    maleficio: lado(campos.maleficio),
    tipo: campos.tipo,
    ...(campos.permanencia ? { permanencia: campos.permanencia } : {}),
    ...(campos.beneficioDuracao ? { beneficioDuracao: campos.beneficioDuracao } : {}),
    ...(campos.duracao ? { duracao: campos.duracao } : {}),
    ...(campos.antecipaAptidao ? { antecipaAptidao: true } : {}),
    ...(lista(campos.aptidoes).length ? { aptidoes: campos.aptidoes } : {}),
    ...(lista(campos.feiticos).length ? { feiticos: campos.feiticos } : {}),
    ...(campos.congenita ? { congenita: campos.congenita } : {}),
    estado: "proposto",
  };
}

/** Um Voto Contratual PROPOSTO. "Votos Contratuais não possuem pesos" (p.356): as condições são dos participantes. */
export function novoContrato({ texto = "", permanencia = "temporario", participantes = [] } = {}) {
  return {
    ...createBlankVotoContratual(),
    texto,
    permanencia,
    participantes: participantes.map((nome) => (typeof nome === "string" ? { nome, aceitou: false, capaz: false } : nome)),
    estado: "proposto",
  };
}

/** Põe o Voto na lista. Recusa o id repetido. */
export function adicionaVoto(votos, voto) {
  if (!voto || typeof voto.id !== "string" || !voto.id) return recusa(votos, "Voto Sem Identificação", "voto-sem-id");
  if (acharVoto(votos, voto.id)) return recusa(votos, "Voto Já Existe", "voto-repetido");
  const contratual = voto.tipo == null && typeof voto.texto === "string" && !voto.beneficio && !voto.maleficio;
  const chave = contratual ? "contratuais" : "mecanicos";
  return { votos: { ...votos, [chave]: [...lista(votos?.[chave]), voto] }, aplicado: true, voto };
}

/* ============================================================ */
/* REALIZAR                                                      */
/* ============================================================ */
/**
 * Confere se o Voto pode ser realizado agora. Puro. `ctx`: `{ aptidoes, bt, criacao, metodoAtributos }`.
 * Devolve `{ ok, erros, acao }`, onde `acao` é o tipo de ação que a realização gasta.
 */
export function avaliaRealizacao(votos, id, ctx = {}) {
  const achado = acharVoto(votos, id);
  if (!achado) return { ok: false, erros: [{ codigo: "voto-inexistente", motivo: "Voto Inexistente" }], acao: null };
  const { voto, contratual } = achado;
  const acao = acaoDoVoto(voto, contratual);
  if (voto.estado && voto.estado !== "proposto") {
    return { ok: false, erros: [{ codigo: "nao-proposto", motivo: "O Voto Já Foi Realizado" }], acao };
  }
  if (contratual) return avaliaContrato(voto, acao);
  if (!votoTipado(voto)) return { ok: false, erros: [{ codigo: "voto-livre", motivo: "Voto Livre Não Tem Ciclo de Vida" }], acao };
  const r = validaVoto(voto, { ...ctx, vigentes: ctx.vigentes ?? votosVigentes(votos) });
  return { ok: r.ok, erros: r.erros, acao };
}

function avaliaContrato(voto, acao) {
  const erros = [];
  const gente = lista(voto.participantes);
  // p.356: feito entre "duas ou mais pessoas", aceito por todos, e todas as partes capazes de cumprir.
  if (gente.length < 2) erros.push({ codigo: "contrato-participantes", motivo: "O Contrato Pede Duas ou Mais Pessoas" });
  if (gente.some((p) => !p.aceitou)) erros.push({ codigo: "contrato-nao-aceito", motivo: "Todos os Participantes Precisam Aceitar" });
  if (gente.some((p) => !p.capaz)) erros.push({ codigo: "contrato-incapaz", motivo: "Todas as Partes Precisam Ser Capazes de Cumprir" });
  if (!String(voto.texto ?? "").trim()) erros.push({ codigo: "contrato-sem-condicoes", motivo: "As Condições Precisam Estar Escritas" });
  return { ok: erros.length === 0, erros, acao };
}

/**
 * REALIZA o Voto: valida, gasta a ação se `registraAcao` (com `sessao` e `derived`) e passa a `vigente`.
 * Próprio é ação bônus, Emergencial é reação, Contratual é ação comum. A Restrição Congênita não gasta ação.
 */
export function realizaVoto(votos, id, { opId, rodada = null, ctx = {}, sessao = null, derived = null, registraAcao = false } = {}) {
  if (typeof opId !== "string" || !opId) return semIdentidade(votos);
  const achado = acharVoto(votos, id);
  if (!achado) return recusa(votos, "Voto Inexistente", "voto-inexistente");
  if (jaTemOperacao(achado.voto, opId)) return { votos, aplicado: false, repetida: true };
  // CX3, p.168: com a ficha derivada, a lista acessível dela prevalece sobre a declaração do chamador.
  const contexto = derived ? { ...ctx, talentos: (derived.talentos?.escolhidas ?? [])
    .filter((id) => !derived.talentos.inacessiveis?.includes(id)) } : ctx;
  const av = avaliaRealizacao(votos, id, contexto);
  if (!av.ok) return recusa(votos, av.erros[0].motivo, av.erros[0].codigo, av.erros);
  let novaSessao = sessao;
  if (registraAcao && av.acao) {
    if (!sessao) return recusa(votos, "Falta a Sessão Para Gastar a Ação", "sem-sessao");
    const g = gastaAcao(sessao, derived, av.acao, { id: `voto:${id}` });
    if (g.erro) return recusa(votos, g.erro, g.codigo);
    novaSessao = g.sessao;
  }
  const { voto } = achado;
  const rodadas = achado.contratual ? 0 : inteiro(voto.duracao?.rodadas, 0);
  const pronto = comEvento({
    ...voto,
    estado: "vigente",
    ...(rodadas > 0 ? { rodadasRestantes: rodadas } : {}),
  }, "realizado", { opId, rodada });
  return {
    votos: substitui(votos, achado, pronto),
    aplicado: true,
    voto: pronto,
    acao: av.acao,
    ...(novaSessao ? { sessao: novaSessao } : {}),
    evento: { tipo: "voto-realizado", nome: voto.nome || voto.texto || "Voto", id },
  };
}

/** A Restrição Congênita é declarada na criação do personagem (p.357) e fica vigente para sempre. */
export function declaraCongenita(votos, id, { opId, rodada = null, ctx = {} } = {}) {
  const achado = acharVoto(votos, id);
  if (!achado || achado.voto.tipo !== "congenita") return recusa(votos, "Não É Uma Restrição Congênita", "nao-congenita");
  return realizaVoto(votos, id, { opId, rodada, ctx: { ...ctx, criacao: ctx.criacao === true } });
}

/* ============================================================ */
/* QUEBRAR E DESFAZER                                            */
/* ============================================================ */
/**
 * QUEBRA o Voto.
 *
 * Próprio ou Emergencial TEMPORÁRIO (p.351): o malefício sai e o benefício não vem, durante o combate em que quebrou.
 * Depois do combate o malefício volta até o próximo interlúdio. Se o Voto tinha duração, o malefício vale "não
 * importando a duração dele" até o interlúdio (leitura do "ao invés disso", em pergunta). Fora de combate vale direto.
 *
 * Contratual (p.356): vira `quebrado` e a consequência é o texto que a MESA escreve em `consequencia`. A ficha não
 * aplica nada, nem mesmo o exemplo do livro.
 *
 * Permanente: o livro não diz o que é romper um (p.351 só diz que não se desfaz). Recusa, e a pergunta fica na fila.
 */
export function quebraVoto(votos, id, { opId, rodada = null, emCombate = false, quem = "", consequencia = "" } = {}) {
  if (typeof opId !== "string" || !opId) return semIdentidade(votos);
  const achado = acharVoto(votos, id);
  if (!achado) return recusa(votos, "Voto Inexistente", "voto-inexistente");
  const { voto, contratual } = achado;
  if (jaTemOperacao(voto, opId)) return { votos, aplicado: false, repetida: true };
  if (voto.estado !== "vigente") return recusa(votos, "Só Se Quebra Um Voto Vigente", "nao-vigente");
  let quebrado;
  if (contratual) {
    quebrado = {
      ...voto,
      estado: "quebrado",
      ruptura: { quem: String(quem).slice(0, 80), consequencia: String(consequencia).slice(0, 1000), rodada: Math.max(0, inteiro(rodada)) },
    };
  } else {
    if (voto.tipo === "congenita") return recusa(votos, "A Restrição Congênita Não Se Quebra", "congenita-nao-quebra");
    if (voto.permanencia === "permanente") {
      return recusa(votos, "O Livro Não Define Romper Um Voto Permanente", "ruptura-permanente-indefinida");
    }
    const comPrazo = !!voto.duracao;
    const maleficioAte = emCombate && !comPrazo ? "fimDoCombate" : "interludio";
    const { rodadasRestantes: _r, ...resto } = voto;
    quebrado = { ...resto, estado: "quebrado", maleficioAte };
  }
  const final = comEvento(quebrado, "quebrado", { opId, rodada, nota: contratual ? consequencia : "" });
  return {
    votos: substitui(votos, achado, final),
    aplicado: true,
    voto: final,
    evento: { tipo: "voto-quebrado", nome: voto.nome || voto.texto || "Voto", id, contratual },
  };
}

/**
 * DESFAZ um Voto Próprio ou Emergencial Temporário: "pode ser desfeito a qualquer momento, porém com um custo" (p.351).
 * O custo não tem número no livro, então `custo` é texto da mesa, guardado no histórico e nunca cobrado. Permanente não
 * se desfaz.
 */
export function desfazVoto(votos, id, { opId, rodada = null, custo = "" } = {}) {
  if (typeof opId !== "string" || !opId) return semIdentidade(votos);
  const achado = acharVoto(votos, id);
  if (!achado) return recusa(votos, "Voto Inexistente", "voto-inexistente");
  const { voto, contratual } = achado;
  if (jaTemOperacao(voto, opId)) return { votos, aplicado: false, repetida: true };
  if (contratual) return recusa(votos, "Contrato Se Cumpre Ou Se Quebra", "contrato-nao-desfaz");
  if (voto.tipo === "congenita" || voto.permanencia === "permanente") {
    return recusa(votos, "Voto Permanente Não Pode Ser Desfeito", "permanente-nao-desfaz");
  }
  if (voto.estado !== "vigente") return recusa(votos, "Só Se Desfaz Um Voto Vigente", "nao-vigente");
  const { rodadasRestantes: _r, ...resto } = voto;
  const final = comEvento({ ...resto, estado: "desfeito" }, "desfeito", { opId, rodada, nota: custo });
  return { votos: substitui(votos, achado, final), aplicado: true, voto: final, evento: { tipo: "voto-desfeito", id } };
}

/** Um Contrato temporário chegou ao fim cumprido. */
export function cumpreContrato(votos, id, { opId, rodada = null } = {}) {
  if (typeof opId !== "string" || !opId) return semIdentidade(votos);
  const achado = acharVoto(votos, id);
  if (!achado || !achado.contratual) return recusa(votos, "Não É Um Contrato", "nao-contrato");
  if (jaTemOperacao(achado.voto, opId)) return { votos, aplicado: false, repetida: true };
  if (achado.voto.estado !== "vigente") return recusa(votos, "Só Se Cumpre Um Contrato Vigente", "nao-vigente");
  const final = comEvento({ ...achado.voto, estado: "encerrado" }, "cumprido", { opId, rodada });
  return { votos: substitui(votos, achado, final), aplicado: true, voto: final, evento: { tipo: "contrato-cumprido", id } };
}

/* ============================================================ */
/* CONTRATO: ACEITE                                              */
/* ============================================================ */
/**
 * Um participante responde ao Contrato. "Caso um dos participantes não concorde com as condições, o voto não é
 * realizado" (p.356): quem recusa fica registrado e o Contrato não pode ser realizado até que os que ainda concordam
 * decidam o que fazer sem ele (`retiraParticipante`).
 */
export function respondeContrato(votos, id, nome, { aceita, capaz = true, opId, rodada = null } = {}) {
  if (typeof opId !== "string" || !opId) return semIdentidade(votos);
  const achado = acharVoto(votos, id);
  if (!achado || !achado.contratual) return recusa(votos, "Não É Um Contrato", "nao-contrato");
  const { voto } = achado;
  if (jaTemOperacao(voto, opId)) return { votos, aplicado: false, repetida: true };
  if (voto.estado !== "proposto") return recusa(votos, "O Contrato Já Foi Realizado", "nao-proposto");
  const i = lista(voto.participantes).findIndex((p) => p.nome === nome);
  if (i < 0) return recusa(votos, "Participante Inexistente", "participante-inexistente");
  const participantes = voto.participantes.map((p, k) => (k === i ? { ...p, aceitou: aceita === true, capaz: capaz === true } : p));
  const final = comEvento({ ...voto, participantes }, aceita === true ? "aceito" : "recusado", { opId, rodada, nota: nome });
  return { votos: substitui(votos, achado, final), aplicado: true, voto: final };
}

/** Tira um participante que recusou, para os que concordam seguirem sem ele. */
export function retiraParticipante(votos, id, nome, { opId, rodada = null } = {}) {
  if (typeof opId !== "string" || !opId) return semIdentidade(votos);
  const achado = acharVoto(votos, id);
  if (!achado || !achado.contratual) return recusa(votos, "Não É Um Contrato", "nao-contrato");
  const { voto } = achado;
  if (jaTemOperacao(voto, opId)) return { votos, aplicado: false, repetida: true };
  if (voto.estado !== "proposto") return recusa(votos, "O Contrato Já Foi Realizado", "nao-proposto");
  if (!lista(voto.participantes).some((p) => p.nome === nome)) return recusa(votos, "Participante Inexistente", "participante-inexistente");
  const final = comEvento({ ...voto, participantes: voto.participantes.filter((p) => p.nome !== nome) }, "nota", { opId, rodada, nota: `Saiu: ${nome}` });
  return { votos: substitui(votos, achado, final), aplicado: true, voto: final };
}

/* ============================================================ */
/* TEMPO: RODADA, FIM DO COMBATE, INTERLÚDIO                     */
/* ============================================================ */
/**
 * A rodada virou: desce o prazo dos Votos com duração em rodadas. Quem chega a zero se encerra (p.351, "podem até
 * mesmo ter uma duração"). `rodada` é o número da rodada que COMEÇOU, e conta uma vez só por rodada.
 */
export function avancaVotosNaRodada(votos, { rodada } = {}) {
  const r = inteiro(rodada, NaN);
  if (!Number.isFinite(r)) return { votos, aplicado: false };
  let mudou = false;
  const mecanicos = lista(votos?.mecanicos).map((v) => {
    if (!votoTipado(v) || v.estado !== "vigente" || !(inteiro(v.rodadasRestantes, 0) > 0) || v.rodadaContada === r) return v;
    mudou = true;
    const restantes = v.rodadasRestantes - 1;
    if (restantes <= 0) {
      const { rodadasRestantes: _x, ...resto } = v;
      return comEvento({ ...resto, estado: "encerrado", rodadaContada: r }, "prazo", { rodada: r });
    }
    return { ...v, rodadasRestantes: restantes, rodadaContada: r };
  });
  return mudou ? { votos: { ...votos, mecanicos }, aplicado: true } : { votos, aplicado: false };
}

/**
 * O combate acabou. O Voto "até o fim da cena" se encerra, e o Voto quebrado no combate passa a dar o malefício até o
 * próximo interlúdio (p.351).
 */
export function votosAoFimDoCombate(votos, { rodada = null } = {}) {
  let mudou = false;
  const mecanicos = lista(votos?.mecanicos).map((v) => {
    if (!votoTipado(v)) return v;
    if (v.estado === "quebrado" && v.maleficioAte === "fimDoCombate") {
      mudou = true;
      return comEvento({ ...v, maleficioAte: "interludio" }, "fimDoCombate", { rodada });
    }
    if (v.estado === "vigente" && v.duracao?.ate === "cena") {
      mudou = true;
      return comEvento({ ...v, estado: "encerrado" }, "encerrado", { rodada, nota: "Fim da cena" });
    }
    return v;
  });
  return mudou ? { votos: { ...votos, mecanicos }, aplicado: true } : { votos, aplicado: false };
}

/** Chegou o interlúdio, acionado pela mesa: o malefício dos Votos quebrados acaba. */
export function votosNoInterludio(votos, { rodada = null } = {}) {
  let mudou = false;
  const mecanicos = lista(votos?.mecanicos).map((v) => {
    if (!votoTipado(v) || v.estado !== "quebrado") return v;
    mudou = true;
    const { maleficioAte: _m, ...resto } = v;
    return comEvento({ ...resto, estado: "encerrado" }, "interludio", { rodada });
  });
  return mudou ? { votos: { ...votos, mecanicos }, aplicado: true } : { votos, aplicado: false };
}

/* ============================================================ */
/* RESUMO PARA A TELA                                            */
/* ============================================================ */
/**
 * O que a tela precisa de um Voto: o rótulo, o estado, o que vale agora, o balanço de pontos da Congênita e se o
 * Contrato espera resposta. Puro.
 */
export function resumoDoVoto(votos, id, ctx = {}) {
  const achado = acharVoto(votos, id);
  if (!achado) return null;
  const { voto, contratual } = achado;
  const av = voto.estado === "proposto" || !voto.estado ? avaliaRealizacao(votos, id, ctx) : null;
  return {
    id,
    contratual,
    estado: voto.estado ?? null,
    acao: acaoDoVoto(voto, contratual),
    pode: av ? av.ok : null,
    recusas: av ? av.erros : [],
    balanco: voto.tipo === "congenita" ? balancoDaCongenita(voto.congenita) : null,
    ruptura: voto.ruptura ?? null,
    maleficioAte: voto.maleficioAte ?? null,
    rodadasRestantes: voto.rodadasRestantes ?? null,
  };
}
