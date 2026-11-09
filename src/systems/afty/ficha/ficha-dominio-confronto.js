/**
 * ============================================================
 * CONFRONTO E CONTESTAÇÃO DE DOMÍNIOS ENTRE PARTICIPANTES (CL3, 2026-11-01)
 * ============================================================
 * Livro de Regras p.185 e 186. Os números (bônus de Conflito, DOM, domo, dano da Contestação) e as fases da Expansão
 * (`ativa`, `confronto`, `estendido`, `contestando`) já existiam. O que faltava era o PROCEDIMENTO que liga os dois lados:
 * quem vence, o que cada sessão passa a ser, e a restauração quando um domo cai.
 *
 * ⚠ DA-19 (autor, 2026-10-08): "Confronto entre fichas no Encontro é manual assistido: rolagem, bônus, DOM, fontes e o +2 de
 * Expansão já ativa prontos, a mesa decide o resto". Então NADA aqui roda sozinho. A mesa (ou a tela do Encontro) chama,
 * confirma os fatos que a ficha não enxerga (`presoNaBarreira`, `maosLivres`) e aplica o resultado nas DUAS sessões.
 *
 * ⚠ DUAS SESSÕES, UM PROCEDIMENTO. Cada operação recebe os dois lados (`{ id, nome, sessao, derived }`) e devolve as duas
 * sessões novas. Cada lado tem a sua identidade: o `opId` entra no anel de operações da sessão de CADA UM, e repetir a
 * chamada só aplica o lado que ainda não aplicou. Isso permite curar uma gravação pela metade repetindo a mesma operação.
 * Recusa devolve as duas sessões como entraram.
 *
 * ⚠ SEM VAZAMENTO ENTRE FICHAS. O vínculo guarda só o id e o nome do outro participante, e os números que a Contestação
 * precisa. Nada do catálogo, do derive ou da sessão do outro entra na sessão de um lado.
 *
 * ⚠ AS LEITURAS ADOTADAS ONDE O TEXTO CALA estão marcadas em `avisos` do resultado e nas perguntas da fila:
 *   • Confronto contra Expansão já ativa com DOM DIFERENTE: o texto (p.186) manda Contestação. Adotado: a Contestação vale
 *     para quem tem DOM MENOR ou Incompleta, e quem tem DOM maior vence pela regra geral (p.185, item 2);
 *   • o dano que chega ao domo vindo do usuário vale a metade (resistência do interior, p.185 e 187, que "não pode ser ignorada").
 * ============================================================
 */
import {
  abreExpansao, encerraExpansao, defineFaseDaExpansao, expansaoNaSessao, situacaoDaExpansao, danoNoDomo,
} from "./ficha-sessao";
import { usoDe, comUso, jaAplicada, comOperacao, abreConcentracaoNaSessao } from "./ficha-uso-estado";
import { gastaAcao } from "./ficha-acoes";

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};
const lista = (v) => (Array.isArray(v) ? v : []);

/** Livro p.185: "superar o do oponente por 5 ou mais". */
export const MARGEM_DO_CONFRONTO = 5;
/** Livro p.186: "aquele que já possuir a expansão ativa recebe um bônus de +2". */
export const BONUS_DA_EXPANSAO_ATIVA = 2;
export const MODOS_DE_CONFRONTO = ["reacao", "contraAtiva"];
export const ACAO_DE_CONFRONTO_ID = "dominio-confronto";
export const D10 = 10;

const semIdentidade = (a, b) => ({ ok: false, aplicado: false, desafiante: a, defensor: b, erro: "Sem Identidade da Operação", codigo: "sem-opid" });
const recusa = (a, b, erro, codigo) => ({ ok: false, aplicado: false, desafiante: a, defensor: b, erro, codigo });

/* ============================================================ */
/* O PARTICIPANTE                                                */
/* ============================================================ */
/**
 * O que o procedimento precisa de um participante, lido da sessão e do derive dele. O bônus SAI sem o +2 da Expansão ativa,
 * que o derive embute quando a Expansão está no ar: o +2 depende de quem já estava ativo, e é aplicado aqui, uma vez.
 */
export function participanteDeDominio({ id, nome = "", sessao, derived }) {
  const dom = derived?.dominios ?? {};
  const exp = expansaoNaSessao(sessao);
  const linha = lista(dom.lista).find((l) => l.id === (exp?.id ?? dom.ativoId)) ?? null;
  const partes = lista(dom.conflito?.partes);
  const tem2 = partes.some((p) => p.label === "Expansão Ativa");
  return {
    id, nome,
    dom: inteiro(dom.domNivel),
    bonus: inteiro(dom.conflito?.bonus) - (tem2 ? BONUS_DA_EXPANSAO_ATIVA : 0),
    partes: partes.filter((p) => p.label !== "Expansão Ativa"),
    versao: linha?.versao ?? null,
    expansaoId: linha?.id ?? null,
    aberta: !!exp,
    fase: exp?.fase ?? null,
    temDomo: !!linha?.temDomo,
    pvDomo: exp?.pvDomo ?? null,
    pvDomoMax: exp?.pvDomoMax ?? null,
    contestacao: linha?.contestacao ?? null,
  };
}

/** Rola os dois d10 do teste decisivo. Sem sucesso nem falha crítica (p.185). */
export function rolaConfronto(rng = Math.random) {
  const d = () => 1 + Math.floor(rng() * D10);
  return { desafiante: d(), defensor: d() };
}

/* ============================================================ */
/* RESOLVER O CONFRONTO (puro)                                   */
/* ============================================================ */
const lado = (p, extra = 0) => ({ id: p.id, nome: p.nome, dom: p.dom, bonus: p.bonus + extra, versao: p.versao });

/**
 * Quem vence o Confronto de Domínios (p.185 e 186). Puro. `d10` é `{ desafiante, defensor }` ou ausente.
 *
 *   modo `reacao`      o defensor está ATIVANDO a Expansão e o desafiante reage a ela. Ninguém ganha o +2.
 *   modo `contraAtiva` o defensor JÁ tem a Expansão ativa (ganha +2) e o desafiante expande dentro dela.
 *
 * Devolve `{ ok, resultado, vencedor, perdedor, via, passos, avisos, desafiante, defensor, totais?, necessitaRolagem? }`:
 *   resultado `vitoria`           um lado venceu (`via`: `nivel`, `incompleta` ou `teste`)
 *   resultado `estendido`         o teste não separou os dois por 5 ou mais: Confronto Estendido
 *   resultado `contestacao`       o desafiante não confronta, contesta (p.186)
 *   resultado `pendente-rolagem`  o teste é necessário e falta o d10 de cada lado
 *   resultado `impossivel`        o texto proíbe este confronto
 */
export function resolveConfronto({ desafiante, defensor, modo = "reacao", d10 = null, presoNaBarreira = false } = {}) {
  const passos = [];
  const avisos = [];
  const ld = lado(desafiante ?? {});
  const lf = lado(defensor ?? {}, modo === "contraAtiva" ? BONUS_DA_EXPANSAO_ATIVA : 0);
  const base = { desafiante: ld, defensor: lf, passos, avisos };
  const fim = (resultado, extra = {}) => ({ ok: resultado !== "impossivel", resultado, vencedor: null, perdedor: null, via: null, ...base, ...extra });
  const vence = (quem, via) => fim("vitoria", { vencedor: quem, perdedor: quem === "desafiante" ? "defensor" : "desafiante", via });

  if (!MODOS_DE_CONFRONTO.includes(modo)) return fim("impossivel", { motivo: "Modo de Confronto Desconhecido" });
  if (!desafiante?.versao || !defensor?.versao) return fim("impossivel", { motivo: "Falta a Expansão de Um dos Participantes" });

  const versaoD = desafiante.versao;
  const versaoF = defensor.versao;
  // p.186: "Uma Expansão Completa só pode confrontar uma Expansão Sem Barreiras caso o usuário da sem barreiras fosse preso."
  const par = [versaoD, versaoF];
  if (par.includes("completa") && par.includes("sem_barreiras") && !presoNaBarreira) {
    return fim("impossivel", { motivo: "Completa Só Confronta Sem Barreiras Com o Usuário Preso" });
  }

  // p.186: a Incompleta não confronta, "pois sempre perderia imediatamente".
  if (versaoD === "incompleta" && versaoF === "incompleta") return fim("impossivel", { motivo: "Duas Incompletas Não Se Confrontam" });
  if (versaoD === "incompleta") {
    if (modo === "contraAtiva") {
      passos.push("O desafiante usa a Incompleta contra um domínio ativo: Contestação (p.186)");
      return fim("contestacao");
    }
    return fim("impossivel", { motivo: "A Incompleta Só Contesta" });
  }
  if (versaoF === "incompleta") {
    passos.push("A Expansão Incompleta do defensor não pode ser usada no Confronto e perde imediatamente (p.186)");
    return vence("desafiante", "incompleta");
  }

  const dif = ld.dom - lf.dom;
  let precisaDeTeste = dif === 0;
  if (dif !== 0) {
    const maior = dif > 0 ? "desafiante" : "defensor";
    const desafianteMenor = dif < 0;
    if (modo === "contraAtiva" && desafianteMenor) {
      // p.186, item 2: DOM diferente contra Expansão já ativa vira Contestação para quem expandiu dentro dela.
      passos.push("DOM menor que o da Expansão já ativa: Contestação (p.186)");
      return fim("contestacao");
    }
    if (modo === "contraAtiva") avisos.push("Desafiante com DOM maior contra Expansão ativa: vale a regra geral do nível superior (p.185)");
    const excecao = modo === "reacao" && desafianteMenor && dif === -1 && ld.bonus - lf.bonus >= MARGEM_DO_CONFRONTO;
    if (excecao) {
      passos.push(`DOM menor por 1 e bônus maior por ${ld.bonus - lf.bonus}: o desafiante confronta com um teste (p.185, item 2)`);
      precisaDeTeste = true;
    } else {
      passos.push(`${maior === "desafiante" ? ld.nome : lf.nome} tem DOM ${Math.max(ld.dom, lf.dom)} contra ${Math.min(ld.dom, lf.dom)}: vence imediatamente (p.185, item 2)`);
      return vence(maior, "nivel");
    }
  }

  if (precisaDeTeste) {
    if (!d10) {
      return fim("pendente-rolagem", { necessitaRolagem: true, bonus: { desafiante: ld.bonus, defensor: lf.bonus } });
    }
    const a = inteiro(d10.desafiante, NaN);
    const b = inteiro(d10.defensor, NaN);
    if (!(a >= 1 && a <= D10) || !(b >= 1 && b <= D10)) return fim("impossivel", { motivo: "O d10 de Cada Lado Fica Entre 1 e 10" });
    const totais = { desafiante: a + ld.bonus, defensor: b + lf.bonus };
    const margem = totais.desafiante - totais.defensor;
    passos.push(`1d10 + bônus: ${totais.desafiante} contra ${totais.defensor}`);
    if (margem >= MARGEM_DO_CONFRONTO) return { ...vence("desafiante", "teste"), totais };
    if (margem <= -MARGEM_DO_CONFRONTO) return { ...vence("defensor", "teste"), totais };
    passos.push("Ninguém superou o outro por 5 ou mais: Confronto Estendido");
    return fim("estendido", { totais });
  }
  return fim("impossivel", { motivo: "Confronto Sem Resultado" });
}

/* ============================================================ */
/* O VÍNCULO NA SESSÃO                                           */
/* ============================================================ */
/** O vínculo de Confronto desta sessão, ou `null`. Só vale com a Expansão ainda aberta. */
export function confrontoDe(sessao) {
  const c = sessao?.combate?.dominioConfronto;
  if (!c || typeof c !== "object" || typeof c.id !== "string" || !expansaoNaSessao(sessao)) return null;
  return {
    id: c.id, contra: String(c.contra ?? ""), contraNome: String(c.contraNome ?? ""),
    modo: MODOS_DE_CONFRONTO.includes(c.modo) ? c.modo : "reacao",
    lado: c.lado === "defensor" ? "defensor" : "desafiante", desde: Math.max(0, inteiro(c.desde)),
  };
}

const comVinculo = (sessao, chave, valor) => ({ ...sessao, combate: { ...(sessao.combate ?? {}), [chave]: valor } });
function semVinculo(sessao, chave) {
  if (!(chave in (sessao.combate ?? {}))) return sessao;
  const { [chave]: _x, ...resto } = sessao.combate;
  return { ...sessao, combate: resto };
}
const linhaDe = (derived, sessao) => {
  const exp = expansaoNaSessao(sessao);
  return lista(derived?.dominios?.lista).find((l) => l.id === (exp?.id ?? derived?.dominios?.ativoId)) ?? null;
};

/** Marca a Reação do Confronto: a ação gasta e a Ação Comum perdida no próximo turno (p.185). */
function gastaReacaoDoConfronto(sessao, derived) {
  const r = gastaAcao(sessao, derived, "reacao", { id: ACAO_DE_CONFRONTO_ID });
  if (r.erro) return { erro: r.erro, codigo: r.codigo };
  return { sessao: comUso(r.sessao, (u) => ({ ...u, acoes: { ...u.acoes, semComum: true } })) };
}

/* ============================================================ */
/* INICIAR O CONFRONTO                                           */
/* ============================================================ */
/**
 * ABRE o Confronto entre os dois. O DESAFIANTE expande (paga o PE, e gasta a Reação no modo `reacao`, que lhe tira a Ação
 * Comum do próximo turno, ou a Ação Comum no modo `contraAtiva`). O DEFENSOR precisa estar com a Expansão aberta. As duas
 * passam à fase `confronto`, em que nada da Expansão vale (DA-15), e ganham o vínculo um com o outro.
 */
export function iniciaConfronto({ confrontoId = null, modo = "reacao", desafiante, defensor, opId, rodada = null } = {}) {
  const sd = desafiante?.sessao;
  const sf = defensor?.sessao;
  if (typeof opId !== "string" || !opId) return semIdentidade(sd, sf);
  if (!MODOS_DE_CONFRONTO.includes(modo)) return recusa(sd, sf, "Modo de Confronto Desconhecido", "modo-invalido");
  const doisFeitos = jaAplicada(sd, opId) && jaAplicada(sf, opId);
  if (doisFeitos) return { ok: true, aplicado: false, repetida: true, desafiante: sd, defensor: sf };
  const id = confrontoId || `confronto_${opId}`;
  const r = rodada ?? sd?.rodada ?? 0;

  let novoD = sd;
  if (!jaAplicada(sd, opId)) {
    const linha = linhaDe(desafiante.derived, sd);
    if (!linha) return recusa(sd, sf, "O Desafiante Não Tem Expansão", "sem-expansao");
    if (!expansaoNaSessao(sd)) {
      const s = situacaoDaExpansao(sd, linha);
      if (!s?.podeAbrir) return recusa(sd, sf, s?.motivo ?? "Expansão Indisponível", "expansao-indisponivel");
      novoD = abreExpansao(sd, linha);
    }
    const g = modo === "reacao" ? gastaReacaoDoConfronto(novoD, desafiante.derived) : gastaAcao(novoD, desafiante.derived, "comum", { id: ACAO_DE_CONFRONTO_ID });
    if (g.erro) return recusa(sd, sf, g.erro, g.codigo);
    novoD = g.sessao;
    novoD = defineFaseDaExpansao(novoD, "confronto");
    novoD = comVinculo(novoD, "dominioConfronto", { id, contra: defensor.id, contraNome: defensor.nome ?? "", modo, lado: "desafiante", desde: r });
    novoD = comOperacao(novoD, { id: opId, tipo: "confronto" });
  }
  let novoF = sf;
  if (!jaAplicada(sf, opId)) {
    if (!expansaoNaSessao(sf)) return recusa(sd, sf, "O Defensor Precisa Estar Com a Expansão Aberta", "defensor-sem-expansao");
    novoF = defineFaseDaExpansao(sf, "confronto");
    novoF = comVinculo(novoF, "dominioConfronto", { id, contra: desafiante.id, contraNome: desafiante.nome ?? "", modo, lado: "defensor", desde: r });
    novoF = comOperacao(novoF, { id: opId, tipo: "confronto" });
  }
  return { ok: true, aplicado: true, confrontoId: id, desafiante: novoD, defensor: novoF, evento: { tipo: "confronto-aberto", confrontoId: id, modo } };
}

/* ============================================================ */
/* APLICAR O RESULTADO                                           */
/* ============================================================ */
/**
 * Aplica o resultado do Confronto nas DUAS sessões. `resultado`: `"desafiante"` ou `"defensor"` (quem venceu) ou
 * `"estendido"`.
 *   vitória   o vencedor completa a Expansão (fase `ativa`: o Acerto Garantido e os efeitos valem) e o perdedor tem a dele
 *             cancelada, com a Exaustão de Técnica da versão (motivo `perdeu`);
 *   estendido as duas seguem abertas, sem Acerto Garantido nem efeitos, até uma cair (p.185).
 * Os dois vínculos precisam ser do mesmo confronto.
 */
export function aplicaResultadoDoConfronto({ desafiante, defensor, resultado, opId, rodada = null } = {}) {
  const sd = desafiante?.sessao;
  const sf = defensor?.sessao;
  if (typeof opId !== "string" || !opId) return semIdentidade(sd, sf);
  if (!["desafiante", "defensor", "estendido"].includes(resultado)) return recusa(sd, sf, "Resultado Desconhecido", "resultado-invalido");
  if (jaAplicada(sd, opId) && jaAplicada(sf, opId)) return { ok: true, aplicado: false, repetida: true, desafiante: sd, defensor: sf };
  const cd = confrontoDe(sd);
  const cf = confrontoDe(sf);
  if (!cd || !cf || cd.id !== cf.id) return recusa(sd, sf, "Os Dois Lados Não Estão No Mesmo Confronto", "sem-confronto");

  const aplica = (p, venceu) => {
    if (jaAplicada(p.sessao, opId)) return p.sessao;
    let s = p.sessao;
    if (resultado === "estendido") {
      s = defineFaseDaExpansao(s, "estendido");
    } else if (venceu) {
      s = semVinculo(defineFaseDaExpansao(s, "ativa"), "dominioConfronto");
    } else {
      s = semVinculo(encerraExpansao(s, "perdeu", linhaDe(p.derived, s)), "dominioConfronto");
    }
    return comOperacao(s, { id: opId, tipo: "confronto-resultado" });
  };
  return {
    ok: true, aplicado: true, confrontoId: cd.id,
    desafiante: aplica(desafiante, resultado === "desafiante"),
    defensor: aplica(defensor, resultado === "defensor"),
    evento: { tipo: resultado === "estendido" ? "confronto-estendido" : "confronto-decidido", confrontoId: cd.id, vencedor: resultado === "estendido" ? null : resultado, rodada },
  };
}

/* ============================================================ */
/* O CONFRONTO ESTENDIDO: RESOLVER NO COMBATE (p.185)             */
/* ============================================================ */
/**
 * "Todo dano que você causar ao usuário (desconsiderando Redução de Dano e Resistência) também é direcionado ao domínio,
 * considerando como causado pelo interior, podendo o destruir." Aplica na sessão do USUÁRIO que está num Confronto. O dano
 * que chega ao domo vale a metade, pela resistência do interior que "não pode ser ignorada" (leitura adotada, na fila).
 * Fora do Confronto não faz nada.
 */
export function danoDoUsuarioNoDominio(sessao, dano, { opId } = {}) {
  if (typeof opId !== "string" || !opId) return { sessao, aplicado: false, erro: "Sem Identidade da Operação", codigo: "sem-opid" };
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  if (!confrontoDe(sessao)) return { sessao, aplicado: false, foraDoConfronto: true };
  const aberta = expansaoNaSessao(sessao);
  if (aberta?.pvDomo == null) return { sessao, aplicado: false, semDomo: true };
  const chega = Math.floor(Math.max(0, inteiro(dano)) / 2);
  return { sessao: comOperacao(danoNoDomo(sessao, chega), { id: opId, tipo: "dano-no-dominio" }), aplicado: true, chegouAoDomo: chega };
}

/** "Caso você consiga deixar o usuário oponente inconsciente, o domínio dele é derrubado imediatamente." */
export function derrubaDominioDoInconsciente(participante, { opId } = {}) {
  const { sessao, derived } = participante;
  if (typeof opId !== "string" || !opId) return { sessao, aplicado: false, erro: "Sem Identidade da Operação", codigo: "sem-opid" };
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  if (!confrontoDe(sessao)) return { sessao, aplicado: false, foraDoConfronto: true };
  const s = semVinculo(encerraExpansao(sessao, "perdeu", linhaDe(derived, sessao)), "dominioConfronto");
  return { sessao: comOperacao(s, { id: opId, tipo: "dominio-derrubado" }), aplicado: true };
}

/**
 * RECONCILIA os dois lados de um Confronto depois que algo mudou numa sessão (o domo caiu, a duração acabou, o usuário
 * foi derrubado). Se um lado já não tem Expansão e o outro segue em Confronto ou Estendido, o sobrevivente completa a dele:
 * fase `ativa`, "o acerto garantido dele se torna efetivo imediatamente" (p.185). Vínculo órfão é limpo. Idempotente: sem
 * nada a reconciliar devolve as mesmas sessões.
 */
export function reconciliaConfronto({ a, b } = {}) {
  const sa = a?.sessao;
  const sb = b?.sessao;
  const va = sa?.combate?.dominioConfronto;
  const vb = sb?.combate?.dominioConfronto;
  const abertaA = !!expansaoNaSessao(sa);
  const abertaB = !!expansaoNaSessao(sb);
  // O lado que caiu já teve o vínculo apagado junto com a Expansão (encerraExpansao), então o sobrevivente é achado pelo
  // vínculo DELE, que aponta para o outro participante.
  const restauraA = !!va && va.contra === b?.id && abertaA && !abertaB;
  const restauraB = !!vb && vb.contra === a?.id && abertaB && !abertaA;
  let novoA = sa;
  let novoB = sb;
  if (restauraA) novoA = semVinculo(defineFaseDaExpansao(sa, "ativa"), "dominioConfronto");
  if (restauraB) novoB = semVinculo(defineFaseDaExpansao(sb, "ativa"), "dominioConfronto");
  if (va && !restauraA && !abertaA) novoA = semVinculo(novoA, "dominioConfronto");
  if (vb && !restauraB && !abertaB) novoB = semVinculo(novoB, "dominioConfronto");
  const mudou = novoA !== sa || novoB !== sb;
  return {
    ok: true, aplicado: mudou, a: novoA, b: novoB,
    ...(restauraA ? { restaurou: a?.id } : restauraB ? { restaurou: b?.id } : {}),
  };
}

/* ============================================================ */
/* CONTESTAÇÃO (p.186)                                           */
/* ============================================================ */
export const CONTESTACAO_CONCENTRACAO_PREFIXO = "contestacao:";

/** Se a ficha de `contestador` pode contestar a Expansão de `alvo`, e por que não. Puro. */
export function podeContestar(contestador, alvo) {
  if (!contestador?.versao) return { ok: false, motivo: "O Contestador Não Tem Expansão" };
  if (!["incompleta", "completa"].includes(contestador.versao)) return { ok: false, motivo: "Só a Incompleta e a Completa Contestam" };
  if (!alvo?.aberta) return { ok: false, motivo: "Não Há Domínio Ativo Para Contestar" };
  if (!alvo.temDomo) return { ok: false, motivo: "O Alvo Não Tem Barreira Para Contestar" };
  // p.186: Incompleta contra domínio ativo, ou Completa contra domínio ativo de DOM maior.
  if (contestador.versao === "completa" && !(contestador.dom < alvo.dom)) {
    return { ok: false, motivo: "A Completa Só Contesta Contra DOM Maior" };
  }
  return { ok: true, motivo: null };
}

/** A barreira do domo contestado: fechada, uma pessoa passa (75%), qualquer um passa (50%). */
export function passagemDaBarreira(pv, pvMax) {
  const max = Math.max(0, inteiro(pvMax));
  if (!max) return "fechada";
  const f = Math.max(0, inteiro(pv)) / max;
  if (f <= 0.5) return "qualquer";
  if (f <= 0.75) return "uma-pessoa";
  return "fechada";
}

/** O vínculo de Contestação desta sessão, de um lado ou do outro. */
export function contestacaoDe(sessao) {
  const c = sessao?.combate?.dominioContestando;
  if (!c || typeof c !== "object" || !expansaoNaSessao(sessao)) return null;
  if (c.lado === "alvo") {
    return { lado: "alvo", contestadores: lista(c.contestadores).filter((x) => x && typeof x.id === "string") };
  }
  if (typeof c.id !== "string") return null;
  return {
    lado: "contestador", id: c.id, alvoId: String(c.alvoId ?? ""), alvoNome: String(c.alvoNome ?? ""),
    danoPorRodada: Math.max(0, inteiro(c.danoPorRodada)), versao: c.versao ?? null,
    ultimaRodadaDano: c.ultimaRodadaDano == null ? null : inteiro(c.ultimaRodadaDano), desde: Math.max(0, inteiro(c.desde)),
  };
}

/** As Contestações que desligam o Acerto Garantido de quem foi contestado, para a tela avisar. A área é da mesa. */
export const acertoGarantidoSuprimidoPor = (sessaoAlvo) => {
  const c = contestacaoDe(sessaoAlvo);
  return c?.lado === "alvo" ? c.contestadores : [];
};

/**
 * COMEÇA a Contestação: o contestador expande (Ação Comum, DA-10), entra em Concentração e na fase `contestando`, e o alvo
 * recebe o registro de quem o contesta. `maosLivres` é a confirmação da mesa de que o contestador tem as mãos para manter o
 * símbolo (p.186: duas, ou uma, caso possa). A área é a metade do padrão e o dano é o de `contestacao.danoPorRodada`.
 */
export function iniciaContestacao({ contestacaoId = null, contestador, alvo, maosLivres = false, opId, rodada = null } = {}) {
  const sc = contestador?.sessao;
  const sa = alvo?.sessao;
  if (typeof opId !== "string" || !opId) return semIdentidade(sc, sa);
  if (jaAplicada(sc, opId) && jaAplicada(sa, opId)) return { ok: true, aplicado: false, repetida: true, contestador: sc, alvo: sa };
  const id = contestacaoId || `contestacao_${opId}`;
  const pc = participanteDeDominio({ ...contestador, sessao: sc });
  const pa = participanteDeDominio({ ...alvo, sessao: sa });
  let novoC = sc;
  if (!jaAplicada(sc, opId)) {
    const pode = podeContestar({ ...pc, aberta: !!pc.aberta }, pa);
    if (!pode.ok) return recusa(sc, sa, pode.motivo, "contestacao-invalida");
    if (!maosLivres) return recusa(sc, sa, "Confirme As Mãos Livres Para o Símbolo", "requisito-nao-confirmado");
    if (usoDe(sc).concentracao) return recusa(sc, sa, "Já Concentrado", "concentrado");
    const linha = linhaDe(contestador.derived, sc);
    if (!linha?.contestacao) return recusa(sc, sa, "Esta Versão Não Contesta", "sem-contestacao");
    if (!expansaoNaSessao(sc)) {
      const s = situacaoDaExpansao(sc, linha);
      if (!s?.podeAbrir) return recusa(sc, sa, s?.motivo ?? "Expansão Indisponível", "expansao-indisponivel");
      novoC = abreExpansao(sc, linha);
    }
    const g = gastaAcao(novoC, contestador.derived, "comum", { id: ACAO_DE_CONFRONTO_ID });
    if (g.erro) return recusa(sc, sa, g.erro, g.codigo);
    novoC = defineFaseDaExpansao(g.sessao, "contestando");
    novoC = abreConcentracaoNaSessao(novoC, { id: `${CONTESTACAO_CONCENTRACAO_PREFIXO}${id}`, nome: "Contestação de Domínio" });
    novoC = comVinculo(novoC, "dominioContestando", {
      lado: "contestador", id, alvoId: alvo.id, alvoNome: alvo.nome ?? "", danoPorRodada: linha.contestacao.danoPorRodada,
      versao: linha.versao, ultimaRodadaDano: null, desde: rodada ?? sc?.rodada ?? 0,
    });
    novoC = comOperacao(novoC, { id: opId, tipo: "contestacao" });
  }
  let novoA = sa;
  if (!jaAplicada(sa, opId)) {
    const atual = contestacaoDe(sa);
    const outros = atual?.lado === "alvo" ? atual.contestadores.filter((x) => x.id !== contestador.id) : [];
    novoA = comVinculo(sa, "dominioContestando", {
      lado: "alvo", contestadores: [...outros, { id: contestador.id, nome: contestador.nome ?? "", contestacaoId: id }],
    });
    novoA = comOperacao(novoA, { id: opId, tipo: "contestacao" });
  }
  return { ok: true, aplicado: true, contestacaoId: id, contestador: novoC, alvo: novoA, evento: { tipo: "contestacao-aberta", contestacaoId: id } };
}

/**
 * O COMEÇO DE UMA RODADA: o contestador causa na barreira do alvo o dano da Contestação (DOM × 25 na Incompleta, × 50 na
 * Completa). Conta uma vez por rodada. Devolve a passagem aberta pela vida que restou ao domo. Se o domo cai, a Expansão do
 * alvo se fecha pelo `defineDomo`, e a Contestação segue até a mesa encerrá-la.
 */
export function avancaContestacao({ contestador, alvo, opId, rodada } = {}) {
  const sc = contestador?.sessao;
  const sa = alvo?.sessao;
  if (typeof opId !== "string" || !opId) return { ok: false, aplicado: false, contestador: sc, alvo: sa, erro: "Sem Identidade da Operação", codigo: "sem-opid" };
  if (jaAplicada(sa, opId)) return { ok: true, aplicado: false, repetida: true, contestador: sc, alvo: sa };
  const c = contestacaoDe(sc);
  if (c?.lado !== "contestador") return { ok: false, aplicado: false, contestador: sc, alvo: sa, erro: "Sem Contestação", codigo: "sem-contestacao" };
  const r = inteiro(rodada, sc?.rodada ?? 0);
  if (c.ultimaRodadaDano === r) return { ok: true, aplicado: false, jaContada: true, contestador: sc, alvo: sa };
  const aberta = expansaoNaSessao(sa);
  if (!aberta) {
    return { ok: true, aplicado: false, alvoCaiu: true, contestador: sc, alvo: sa };
  }
  const antes = aberta.pvDomo;
  const depois = danoNoDomo(sa, c.danoPorRodada);
  const novoAlvo = comOperacao(depois, { id: opId, tipo: "contestacao-dano" });
  const novoContestador = comVinculo(sc, "dominioContestando", { ...sc.combate.dominioContestando, ultimaRodadaDano: r });
  const pvDepois = expansaoNaSessao(depois)?.pvDomo ?? 0;
  return {
    ok: true, aplicado: true, contestador: novoContestador, alvo: novoAlvo, dano: c.danoPorRodada,
    pvAntes: antes, pvDepois, passagem: passagemDaBarreira(pvDepois, aberta.pvDomoMax),
    alvoCaiu: !expansaoNaSessao(depois),
    evento: { tipo: "contestacao-dano", dano: c.danoPorRodada, pvDepois },
  };
}

/**
 * ENCERRA a Contestação (a Concentração quebrou, as mãos ficaram ocupadas, a mesa mandou). O contestador fecha a Expansão
 * com a Exaustão de Técnica "como normal" (p.186), a Concentração cai e o registro sai das duas sessões.
 */
export function encerraContestacao({ contestador, alvo, motivo = "encerrada", opId } = {}) {
  const sc = contestador?.sessao;
  const sa = alvo?.sessao;
  if (typeof opId !== "string" || !opId) return semIdentidade(sc, sa);
  if (jaAplicada(sc, opId) && jaAplicada(sa, opId)) return { ok: true, aplicado: false, repetida: true, contestador: sc, alvo: sa };
  const c = contestacaoDe(sc);
  if (c?.lado !== "contestador" && !jaAplicada(sc, opId)) return recusa(sc, sa, "Sem Contestação", "sem-contestacao");
  let novoC = sc;
  if (!jaAplicada(sc, opId)) {
    novoC = semVinculo(encerraExpansao(sc, motivo === "interrompida" ? "interrompida" : "encerrada", linhaDe(contestador.derived, sc)), "dominioContestando");
    const conc = usoDe(novoC).concentracao;
    if (conc?.id?.startsWith(CONTESTACAO_CONCENTRACAO_PREFIXO)) novoC = comUso(novoC, (u) => ({ ...u, concentracao: null, teste: null }));
    novoC = comOperacao(novoC, { id: opId, tipo: "contestacao-fim" });
  }
  let novoA = sa;
  if (!jaAplicada(sa, opId)) {
    const ca = contestacaoDe(sa);
    if (ca?.lado === "alvo") {
      const resto = ca.contestadores.filter((x) => x.id !== contestador.id);
      novoA = resto.length ? comVinculo(sa, "dominioContestando", { lado: "alvo", contestadores: resto }) : semVinculo(sa, "dominioContestando");
    }
    novoA = comOperacao(novoA, { id: opId, tipo: "contestacao-fim" });
  }
  return { ok: true, aplicado: true, contestador: novoC, alvo: novoA, evento: { tipo: "contestacao-encerrada", motivo } };
}

/**
 * A Concentração do contestador caiu (falha de teste, condição)? Então a Contestação acaba (p.186: "Caso sua Concentração se
 * quebre ... a Contestação é encerrada e você recebe Exaustão de Técnica como normal"). Puro: só diz se deve encerrar.
 */
export function contestacaoPerdeuAConcentracao(sessaoContestador) {
  const c = contestacaoDe(sessaoContestador);
  if (c?.lado !== "contestador") return false;
  return usoDe(sessaoContestador).concentracao?.id !== `${CONTESTACAO_CONCENTRACAO_PREFIXO}${c.id}`;
}
