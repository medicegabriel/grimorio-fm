/**
 * ============================================================
 * ATAQUE COM ALVO DECLARADO, RESULTADO CONFIRMADO, CRÍTICO, DESASTRE E TR (CL1, 2026-10-29)
 * ============================================================
 * Puro e sem imports: o ataque é uma CONTA sobre o que a mesa informa (a Defesa do alvo, a cobertura, o d10 da
 * camuflagem) e sobre a rolagem que a ficha já fez (`rolarTeste` com `tipoTeste: "ataque"`, do CX1). Não há mapa, e a
 * ficha não adivinha posição nem visibilidade (Livro p.294 a 297 ficam com a mesa).
 *
 * As regras, com a página:
 *   • acerto: o resultado da jogada igual ou superior à Defesa (p.279);
 *   • 20 natural acerta sempre e é crítico. A margem de crítico reduzida habilita o crítico, mas o ACERTO garantido
 *     "é apenas no 20" (p.307): o crítico de margem menor ainda exige acertar pela Defesa;
 *   • 1 natural erra sempre (desastre), e "pode-se realizar um ataque contra ela como uma reação" (p.307);
 *   • camuflagem leve: o atacante rola 1d10 junto, e 1 ou 2 erra; total: 1 a 5 erra, "independentemente do
 *     resultado do teste de ataque" (p.294), então derruba até o 20 natural;
 *   • cobertura meia +2 e 3/4 +4 na Defesa, a maior só (não acumulam, p.294); total impede o ataque direto;
 *   • flanco: a Defesa do flanqueado cai 2 (p.295).
 *
 * ⚠ O NÚMERO DO ALVO CHEGA PRONTO. A Defesa do alvo é a do `derived` DELE (com condições, Guarda e a penalidade da
 * Sequência de Ataques já dentro). A cobertura e o flanco são posição e vão por parâmetro, com o valor do livro.
 *
 * Retorno de `resolveAtaque`: `{ ok, acertou, critico, desastre, motivo, defesa, ajustes, oportunidades, pendente? }`.
 * `acertou: null` quer dizer "falta informação" e `pendente` diz qual (a Defesa, o d10). Na recusa, `ok: false` e `erro`.
 * ============================================================
 */

export const CATEGORIAS_DE_ATAQUE = ["corpo", "distancia", "amaldicoado"];
export const COBERTURA = { meia: 2, tres_quartos: 4 };
export const PERCENTUAL_DE_CAMUFLAGEM = { leve: 2, total: 5 };
export const FLANCO = 2;

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};
const tem = (v) => v !== undefined && v !== null && v !== "" && Number.isFinite(Number(v));

/** O resultado de um ataque contra um alvo declarado. Ver o cabeçalho para as regras. */
export function resolveAtaque({
  rolagem, alvo = {}, categoria = null, margem = null, camuflagemD10 = null, informado = null, criticoSeAcertar = false, ajusteDefesa = 0,
  atacante = null,
}) {
  if (!rolagem || !tem(rolagem.natural) || !tem(rolagem.total)) return { ok: false, erro: "Falta a Rolagem do Ataque", codigo: "sem-rolagem" };
  if (categoria && !CATEGORIAS_DE_ATAQUE.includes(categoria)) return { ok: false, erro: "Categoria de Ataque Desconhecida", codigo: "categoria-desconhecida" };
  if (alvo.cobertura === "total") return { ok: false, erro: "Cobertura Total Impede o Ataque", codigo: "cobertura-total" };
  if (alvo.camuflagem && !PERCENTUAL_DE_CAMUFLAGEM[alvo.camuflagem]) return { ok: false, erro: "Camuflagem Desconhecida", codigo: "camuflagem-desconhecida" };
  if (alvo.cobertura && !COBERTURA[alvo.cobertura]) return { ok: false, erro: "Cobertura Desconhecida", codigo: "cobertura-desconhecida" };

  const natural = inteiro(rolagem.natural);
  const total = inteiro(rolagem.total);
  const limiteCritico = Math.max(2, inteiro(margem ?? rolagem.margem, 20));
  const ajustes = [];
  let defesa = tem(alvo.defesa) ? inteiro(alvo.defesa) : null;
  if (defesa != null) {
    if (alvo.cobertura) { ajustes.push({ id: `cobertura:${alvo.cobertura}`, valor: COBERTURA[alvo.cobertura] }); defesa += COBERTURA[alvo.cobertura]; }
    if (alvo.flanqueado) { ajustes.push({ id: "flanco", valor: -FLANCO }); defesa -= FLANCO; }
    if (inteiro(ajusteDefesa)) { ajustes.push({ id: "mesa", valor: inteiro(ajusteDefesa) }); defesa += inteiro(ajusteDefesa); }
  }

  const desastre = natural === 1;
  const oportunidades = desastre ? [{ tipo: "ataque-de-reacao", contra: atacante?.id ?? null, nome: atacante?.nome ?? null }] : [];
  const fecha = (acertou, motivo, extra = {}) => {
    const critico = acertou === true && (natural >= limiteCritico || criticoSeAcertar === true);
    return { ok: true, acertou, critico, desastre, motivo, defesa, ajustes, oportunidades, categoria, ...extra };
  };

  // A camuflagem derruba até o 20 natural: o d10 vem da mesa, junto do d20.
  if (alvo.camuflagem) {
    if (!tem(camuflagemD10)) return fecha(null, "camuflagem", { pendente: "camuflagem" });
    if (inteiro(camuflagemD10) <= PERCENTUAL_DE_CAMUFLAGEM[alvo.camuflagem]) return fecha(false, "camuflagem");
  }

  let calculado;
  let motivo;
  if (natural === 20) { calculado = true; motivo = "natural20"; }
  else if (natural === 1) { calculado = false; motivo = "natural1"; }
  else if (defesa != null) { calculado = total >= defesa; motivo = "defesa"; }
  else { calculado = null; motivo = "defesa"; }

  if (informado === "acerto" || informado === "erro") {
    const dito = informado === "acerto";
    if (calculado != null && calculado !== dito) return { ok: false, erro: "Resultado Informado Contradiz a Rolagem", codigo: "informado-contradiz" };
    return fecha(dito, calculado == null ? "informado" : motivo);
  }
  if (calculado == null) return fecha(null, motivo, { pendente: "defesa" });
  return fecha(calculado, motivo);
}

/**
 * O TR do alvo contra a CD do efeito: `rolagem` é o `rolarTeste` do alvo (ou `{ total, critico }` informado). Devolve
 * `{ resultado: "sucesso"|"falha", sucessoCritico, falhaCritica, total, cd }`. O crítico do TR é o do d20 do alvo
 * (p.311: "anulando em um sucesso crítico" no TR de Integridade). Quem sabe o que o sucesso faz (metade, anula) é o
 * efeito, e `aplicaTR` traduz isso em multiplicador.
 */
export function resolveTR({ cd, rolagem }) {
  if (!tem(cd)) return { ok: false, erro: "Falta a CD do Efeito", codigo: "sem-cd" };
  if (!rolagem || !tem(rolagem.total)) return { ok: false, erro: "Falta a Rolagem do TR", codigo: "sem-rolagem" };
  const total = inteiro(rolagem.total);
  const sucesso = total >= inteiro(cd);
  return {
    ok: true, resultado: sucesso ? "sucesso" : "falha", sucessoCritico: sucesso && rolagem.critico === true,
    falhaCritica: !sucesso && rolagem.pifia === true, total, cd: inteiro(cd),
  };
}

/** O que o efeito faz com o resultado do TR: `"metade"` e `"anula"` mexem no dano, `"nenhum"` não. */
export const EFEITOS_DE_TR = ["metade", "anula", "nenhum"];

/** O melhor de duas rolagens do mesmo d20 (rerrolagem que fica com o melhor, como em Armas Absolutas). Empate fica com a primeira. */
export function melhorRolagem(a, b) {
  if (!b) return { escolhida: a, descartada: null };
  return inteiro(b.total) > inteiro(a.total) ? { escolhida: b, descartada: a } : { escolhida: a, descartada: b };
}
