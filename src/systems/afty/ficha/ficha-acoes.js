/**
 * ============================================================
 * AS AÇÕES DO TURNO (CL1, 2026-10-29)
 * ============================================================
 * Livro p.300 e 301: cada ficha tem, por turno, uma ação comum, uma bônus, uma de movimento e uma reação,
 * além das livres. A hierarquia deixa converter a de valor maior em uma de menor (comum, bônus, movimento).
 * A ação completa é a comum mais a bônus e não aceita conversão.
 *
 * ⚠ A REAÇÃO NÃO TEM CONTADOR NOVO. Ela já existe em `especializacaoSessao` (`reacoesGastas`, `reacoesExtras`,
 * `acoesComuns`), vale para qualquer ficha e já entende Instintos Aguçados, Reação Rápida e Surto de Ação. Aqui
 * ela é GASTA por `usarEfeitoEspecializacao(..., "reacao")`, e este módulo só acrescenta o que faltava: a regra
 * de que a MESMA reação serve uma vez por rodada, as ações bônus e de movimento, a conversão e as livres.
 * Dois contadores de reação divergiriam no Restringido.
 *
 * ⚠ NADA DISTO É OBRIGATÓRIO PARA QUEM JOGA. Ninguém é barrado por não ter marcado a ação: o verbo só roda
 * quando a tela (ou o `usa`, com `registraAcao`) o chama. O estado mora em `sessao.uso.acoes`
 * (`ficha-uso-estado.js`): as gastas do turno voltam no início do turno da própria ficha.
 *
 * Retorno: `{ sessao, usou, convertida, erro?, codigo? }`. Na recusa a sessão é a MESMA que entrou.
 * ============================================================
 */
import { recursosDeEspecializacao, usarEfeitoEspecializacao } from "./ficha-especializacoes";
import { usoDe, comUso } from "./ficha-uso-estado";
import { exaustaoImpoe } from "../afty-exaustao";

export const TIPOS_DE_ACAO = ["comum", "bonus", "movimento", "reacao", "livre", "completa"];

/** Livro p.318: estas condições tiram as ações e as reações. Nomes comparados sem acento e sem caixa. */
export const CONDICOES_SEM_ACOES = ["Atordoado", "Inconsciente", "Paralisado", "Indefeso"];
/** Livro p.318: "um personagem enjoado não pode converter suas ações dentro da Hierarquia de Ações". */
export const CONDICAO_SEM_CONVERSAO = "Enjoado";

const semAcento = (v) => String(v ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

export function temCondicaoNaSessao(sessao, nome) {
  const alvo = semAcento(nome);
  // A Exaustão impõe Condições sem gravá-las na sessão (Enjoado no Nível 5 tira a conversão de ações), e conta aqui.
  return (sessao?.condicoes ?? []).some((c) => semAcento(typeof c === "string" ? c : c?.nome) === alvo)
    || exaustaoImpoe(sessao?.exaustao, nome);
}

const recusa = (sessao, erro, codigo) => ({ sessao, usou: null, convertida: false, erro, codigo });

/** As ações que ainda restam neste turno. `comum` conta a base e as extras que o Surto de Ação entregou. */
export function acoesDisponiveis(sessao, derived) {
  const u = usoDe(sessao).acoes;
  const e = recursosDeEspecializacao(sessao, derived);
  const extras = Math.max(0, Math.trunc(Number(e.acoesComuns) || 0));
  return {
    comum: Math.max(0, 1 - u.gastas.comum) + extras,
    bonus: Math.max(0, 1 - u.gastas.bonus),
    movimento: Math.max(0, 1 - u.gastas.movimento),
    reacoes: e.reacoes,
    extrasComuns: extras,
  };
}

function gastaComum(sessao, derived) {
  const u = usoDe(sessao).acoes;
  if (u.gastas.comum < 1) return comUso(sessao, (x) => ({ ...x, acoes: { ...x.acoes, gastas: { ...x.acoes.gastas, comum: 1 } } }));
  // A base já foi: a comum extra do Surto de Ação sai do contador que o Surto abriu.
  const depois = usarEfeitoEspecializacao(sessao, derived, "acao_comum");
  return depois === sessao ? null : depois;
}

const gastaNativa = (sessao, tipo) => comUso(sessao, (x) => ({ ...x, acoes: { ...x.acoes, gastas: { ...x.acoes.gastas, [tipo]: 1 } } }));

/**
 * Por que a ação não pode agora, ou `null`. `id` é obrigatório na reação (a mesma reação serve uma vez por
 * rodada, p.300) e na ação livre (idem).
 */
export function bloqueioDeAcao(sessao, derived, tipo, { id = null } = {}) {
  return gastaAcao(sessao, derived, tipo, { id }).erro ?? null;
}

export function gastaAcao(sessao, derived, tipo, { id = null } = {}) {
  if (!TIPOS_DE_ACAO.includes(tipo)) return recusa(sessao, "Tipo de Ação Desconhecido", "acao-desconhecida");
  const barrada = CONDICOES_SEM_ACOES.find((c) => temCondicaoNaSessao(sessao, c));
  if (barrada) return recusa(sessao, `${barrada} Impede Ações`, "condicao-impede");
  /* Nas Portas da Morte o corpo é incapaz de agir (p.313), e morto ainda mais. O Restringido de pé por Mesmo Morto continua
     "realizando seus turnos normalmente" e fica de fora (CL2). */
  if (sessao?.vital?.estado === "morto") return recusa(sessao, "Corpo Morto Não Age", "morto");
  if (sessao?.vital?.estado === "morrendo" && sessao.especializacaoSessao?.modoMorte !== "mesmo_morto") {
    return recusa(sessao, "Morrendo Impede Ações", "morrendo");
  }
  const u = usoDe(sessao).acoes;
  const rodada = Math.max(0, Math.trunc(Number(sessao?.rodada) || 0));
  const podeConverter = !temCondicaoNaSessao(sessao, CONDICAO_SEM_CONVERSAO);

  if (tipo === "livre") {
    if (!id) return recusa(sessao, "Ação Livre Sem Identificação", "acao-sem-id");
    if (u.livres[id] === rodada) return recusa(sessao, "Ação Livre Já Usada Nesta Rodada", "livre-repetida");
    return { sessao: comUso(sessao, (x) => ({ ...x, acoes: { ...x.acoes, livres: { ...x.acoes.livres, [id]: rodada } } })), usou: "livre", convertida: false };
  }

  if (tipo === "reacao") {
    if (!id) return recusa(sessao, "Reação Sem Identificação", "acao-sem-id");
    // A ferida interna tira as reações até o próximo turno (p.314). Acaba em `iniciaTurnoFicha`.
    if (sessao?.vital?.semReacoes) return recusa(sessao, "Ferida Interna Impede Reações", "ferida-interna");
    if (u.reacoes[id] === rodada) return recusa(sessao, "Reação Já Usada Nesta Rodada", "reacao-repetida");
    const depois = usarEfeitoEspecializacao(sessao, derived, "reacao");
    if (depois === sessao) return recusa(sessao, "Sem Reação Disponível", "sem-reacao");
    return { sessao: comUso(depois, (x) => ({ ...x, acoes: { ...x.acoes, reacoes: { ...x.acoes.reacoes, [id]: rodada } } })), usou: "reacao", convertida: false };
  }

  if (tipo === "completa") {
    // Sem conversão: "caso tenha usado alguma delas, você não pode utilizar uma ação completa".
    if (u.gastas.comum > 0 || u.gastas.bonus > 0) return recusa(sessao, "Ação Completa Pede Comum e Bônus Livres", "completa-indisponivel");
    const s = comUso(sessao, (x) => ({ ...x, acoes: { ...x.acoes, gastas: { ...x.acoes.gastas, comum: 1, bonus: 1 } } }));
    return { sessao: s, usou: "completa", convertida: false };
  }

  if (tipo === "comum") {
    const s = gastaComum(sessao, derived);
    return s ? { sessao: s, usou: "comum", convertida: false } : recusa(sessao, "Sem Ação Comum", "sem-acao");
  }

  // Bônus e movimento: a própria primeiro, depois a de valor maior, nesta ordem (p.301).
  if (u.gastas[tipo] < 1) return { sessao: gastaNativa(sessao, tipo), usou: tipo, convertida: false };
  if (!podeConverter) return recusa(sessao, `Sem Ação ${tipo === "bonus" ? "Bônus" : "de Movimento"}`, "sem-acao");
  if (tipo === "movimento" && u.gastas.bonus < 1) return { sessao: gastaNativa(sessao, "bonus"), usou: "bonus", convertida: true };
  const s = gastaComum(sessao, derived);
  return s ? { sessao: s, usou: "comum", convertida: true } : recusa(sessao, `Sem Ação ${tipo === "bonus" ? "Bônus" : "de Movimento"}`, "sem-acao");
}
