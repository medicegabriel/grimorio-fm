// CX3, frente Aptidões e Treinos (Claude). Livro de Regras 2.5.2.
// Números PUROS das quatro Aptidões que dependem de janela de reação ou de recibo de Domínio:
//   Punho Divergente (p.181), Emoção da Pétala Decadente (p.181), Revestimento de Domínio (p.182),
//   Anular Técnica (p.182) e a seção "Aplicação de Anti-Domínios" (p.246).
// Este arquivo NÃO liga nada à sessão: a janela (antes do dano ou do efeito) e o recibo de Feitiço ou de
// Expansão são do Encontro. Quando esses contratos existirem, os clientes só chamam estas contas.
// FOLHA: zero imports (ver "Ordem de módulos" no CLAUDE.md).

const inteiro = (v) => Math.trunc(Number(v) || 0);
const naoNeg = (v) => Math.max(0, inteiro(v));

/* ============================================================ */
/* PUNHO DIVERGENTE, p.181                                       */
/* ============================================================ */
export const ATRIBUTOS_FISICOS = ["forca", "destreza", "constituicao"];

/**
 * "Escolher causar apenas metade do dano, e guardar a outra metade para ser causada no turno seguinte."
 * Metade para baixo (regra geral do Afty), e a parte guardada é o RESTO do total, para o dano não se perder.
 * Total ímpar: o Livro não diz qual das duas leva o ponto sobrando (pergunta aberta).
 */
export function metadesDoPunhoDivergente(total) {
  const t = naoNeg(total);
  const imediato = Math.floor(t / 2);
  return { imediato, guardado: t - imediato };
}

/** "Para cada 5 pontos de dano na primeira metade do dano, a CD aumenta em 1." */
export const bonusCdPunhoDivergente = (imediato) => Math.floor(naoNeg(imediato) / 5);

/**
 * A CD do Fortitude do alvo. A CD Amaldiçoada (p.172: 10 + metade do nível + Mod do atributo + BT + outros) usa aqui o
 * "maior atributo físico" no lugar do atributo da Técnica: parte-se da CD de Aptidão do derive, tira-se o Mod da
 * Técnica que já estava dentro dela e põe-se o do maior físico. Mais o bônus da primeira metade.
 *   cd           derived.cd (CD de Aptidão)
 *   modTecnica   derived.modTecnica
 *   mods         derived.mods
 */
export function cdPunhoDivergente({ cd, modTecnica = 0, mods = {}, imediato = 0 } = {}) {
  const maiorFisico = Math.max(...ATRIBUTOS_FISICOS.map((a) => inteiro(mods[a])));
  const base = inteiro(cd) - inteiro(modTecnica) + maiorFisico;
  const bonus = bonusCdPunhoDivergente(imediato);
  return { cd: base + bonus, base, bonus, maiorFisico };
}

/** A segunda metade "será causada como se o inimigo tivesse vulnerabilidade", só quando o alvo FALHA no Fortitude. */
export const segundaMetadeComVulnerabilidade = (falhouNoTr) => falhouNoTr === true;

/* ============================================================ */
/* ANULAR TÉCNICA, p.182                                         */
/* ============================================================ */
export const ID_ANULAR_TECNICA = "anular_tecnica";

/** "uma quantidade de vezes igual ao Nível de Aptidão em Domínio, por descanso longo". */
export const usosAnularTecnica = (dom) => naoNeg(dom);

/** "só pode tentar anular um Feitiço que seja de um nível que você tem ou teria acesso a". */
export const podeAnularNivel = (nivelDoFeitico, nivelMaximoDeFeitico) => {
  const n = inteiro(nivelDoFeitico);
  return n >= 1 && n <= inteiro(nivelMaximoDeFeitico);
};

/** "Você gasta uma quantidade de energia amaldiçoada igual à que foi usada para conjurar a habilidade." */
export const custoAnularTecnica = (energiaUsadaNaConjuracao) => naoNeg(energiaUsadaNaConjuracao);

/**
 * "realiza um teste Feitiçaria contra a Feitiçaria de quem usou o Feitiço". O Livro não diz quem vence o empate:
 * devolve "empate" e deixa a mesa decidir (pergunta aberta).
 */
export function disputaAnularTecnica(meuTotal, totalDoConjurador) {
  const a = Number(meuTotal), b = Number(totalDoConjurador);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return a > b ? "anula" : a < b ? "falha" : "empate";
}

/* ============================================================ */
/* REVESTIMENTO DE DOMÍNIO, p.182 e p.246                        */
/* ============================================================ */
export const ID_REVESTIMENTO_DE_DOMINIO = "revestimento_de_dominio";

/** "gastar 5 PE e uma Ação Bônus, ou reação ao ser alvo dos efeitos de um Feitiço, para ativar". */
export const ATIVAR_REVESTIMENTO = { pe: 5, acoes: ["bonus", "reacao"] };

/**
 * "você pode gastar 5 PE para sustentar o efeito no início dos seus turnos" e, na p.246, "Para cada rodada depois da
 * primeira, aumente o custo para sustentar o Revestimento de Domínio em 2. Este aumento gradual é permanente
 * enquanto a expansão durar, se normalizando quando a expansão ativa é desfeita."
 * `rodadaDaExpansao` é a rodada contada da primeira em que a expansão está ativa (1, 2, 3...). A leitura adotada é a
 * literal: a sustentação do início da 2ª rodada já é uma rodada depois da primeira (5 + 2 = 7). Se a leitura certa
 * for 5 na 2ª rodada, a pergunta está registrada na entrega e a conta muda aqui.
 */
export const custoSustentarRevestimento = (rodadaDaExpansao) => 5 + 2 * Math.max(0, inteiro(rodadaDaExpansao) - 1);

/** "você reduz o dano de efeitos de técnicas ofensivas que te afetarem em um valor igual ao seu nível de personagem." */
export const reducaoDeDanoDoRevestimento = (nivelDePersonagem) => naoNeg(nivelDePersonagem);

/** Aplica a redução (sem ficar abaixo de zero). "Essa redução não pode ser ignorada": nenhum parâmetro a desliga. */
export const danoAposRevestimento = (dano, nivelDePersonagem) => Math.max(0, naoNeg(dano) - reducaoDeDanoDoRevestimento(nivelDePersonagem));

/**
 * "Caso a Técnica seja de um nível menor ou igual a metade do Nível de DOM, arredondado para cima, ela é
 * completamente anulada." Aqui o arredondamento é PARA CIMA por texto expresso, exceção à regra geral.
 */
export const nivelMaximoAnuladoPeloRevestimento = (nivelDom) => Math.ceil(naoNeg(nivelDom) / 2);
export const revestimentoAnulaTecnica = (nivelDaTecnica, nivelDom) => {
  const n = inteiro(nivelDaTecnica);
  return n >= 1 && n <= nivelMaximoAnuladoPeloRevestimento(nivelDom);
};

/** "com o funcionamento básico sendo considerado como um Feitiço de primeiro nível." */
export const NIVEL_DO_FUNCIONAMENTO_BASICO = 1;

/* ============================================================ */
/* EMOÇÃO DA PÉTALA DECADENTE, p.181                             */
/* ============================================================ */
export const ID_PETALA_DECADENTE = "emocao_da_petala_decadente";

/** "gastar uma quantidade de pontos de energia igual ao nível de DOM da criatura que expandiu o domínio". */
export const custoDeAnularAcertoGarantido = (domDoExpansor) => naoNeg(domDoExpansor);

/** "como uma ação livre, você pode gastar 5PE para realizar um ataque corpo a corpo com sucesso garantido". */
export const PETALA_CONTRA_ATAQUE = { pe: 5, acao: "livre" };

/* ============================================================ */
/* LIMITE DE ANTI-DOMÍNIOS, p.246                                */
/* ============================================================ */
/** O Livro diz "mais de dois" e dá como exemplo proibido Revestimento + Pétala: texto contraditório, sem conta. */
export const LIMITE_ANTIDOMINIOS_TEXTO = 2;
