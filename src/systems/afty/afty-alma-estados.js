/**
 * ============================================================
 * ESTADOS DA ALMA: o que cada Estado faz (Livro de Regras 2.5.2, p.312)
 * ============================================================
 * O Estado sai da fração da Integridade CORRENTE sobre o total. O total é o máximo de PV íntegro na Alma de pilha
 * (livro, p.311) e o máximo de 100 mais os bônus na Alma de porcentagem (addon `almaComoAfty`). Este módulo é a REGRA:
 * dado o par, devolve o Estado, as penalidades, o custo extra, as Condições impostas e a desvantagem. É FOLHA, com
 * zero imports, porque o derive e as telas leem daqui.
 *
 * Os quatro Estados, verbatim do livro:
 *   Estável    acima de 75% do total. Nenhum prejuízo.
 *   Danificado abaixo de 75%. -3 em todos os testes e rolagens, custo de energia/estamina de todas as habilidades +2.
 *   Instável   abaixo de 50%. -6, custo +3 e Exposto enquanto não sair do Estado.
 *   Crítico    abaixo de 25%. -8 e desvantagem, custo +5, Exposto e Fragilizado enquanto não sair do Estado.
 *   Destruído  0 de Integridade: "um personagem com 0 de Integridade está morto".
 *
 * ⚠ LEITURAS ADOTADAS, a confirmar com o autor (docs/a-fazer.md):
 *   • EXATAMENTE em 75%, 50% ou 25% o Estado é o de cima. O livro diz "acima de 75%" para o Estável e "abaixo de 75%"
 *     para o Danificado, e a fronteira fica sem dono. Esta é a leitura que o site já usava.
 *   • "Todos seus testes e rolagens" é Ataque, Resistência, Perícia, Iniciativa e Teste de Morte, a mesma leitura da
 *     Exaustão. O DANO, a Defesa e a CD não entram (não são rolagem de teste).
 *   • O 0 de Integridade só ACENDE o Estado Destruído. A morte é da mesa, como o Nível 6 da Exaustão.
 *   • A desvantagem do Crítico é aplicada na rolagem pelo roteador de d20 da Ficha, e a regra de dois d20 do Motor
 *     (vantagem e desvantagem se anulam) vale como em qualquer outra fonte.
 * ============================================================
 */

export const ALMA_ESTADOS = {
  estavel:    { chave: "estavel",    label: "Estável", aviso: null,    penalidade: 0,  custoPE: 0, condicoes: [],                      desvantagem: false },
  danificado: { chave: "danificado", label: "Danificado", aviso: "Alma Danificada", penalidade: -3, custoPE: 2, condicoes: [],                      desvantagem: false },
  instavel:   { chave: "instavel",   label: "Instável", aviso: "Alma Instável",   penalidade: -6, custoPE: 3, condicoes: ["Exposto"],             desvantagem: false },
  critico:    { chave: "critico",    label: "Crítico", aviso: "Alma Crítica",    penalidade: -8, custoPE: 5, condicoes: ["Exposto", "Fragilizado"], desvantagem: true },
  destruido:  { chave: "destruido",  label: "Destruído", aviso: "Alma Destruída",  penalidade: 0,  custoPE: 0, condicoes: [],                      desvantagem: false },
};

/** O prefixo do id das Condições que o Estado da Alma impõe. Elas NÃO moram na sessão. */
export const PREFIXO_CONDICAO_ALMA = "alma:";
export const ehCondicaoDeAlma = (id) => String(id ?? "").startsWith(PREFIXO_CONDICAO_ALMA);

/** A chave do Estado para uma Integridade corrente e um total. `atual` ausente vale o total (alma íntegra). */
export function chaveDoEstadoDaAlma(atual, total) {
  const max = Number(total);
  if (!Number.isFinite(max) || max <= 0) return "estavel";
  const corrente = atual == null ? max : Math.max(0, Number(atual) || 0);
  if (corrente <= 0) return "destruido";
  const fracao = corrente / max;
  return fracao < 0.25 ? "critico" : fracao < 0.5 ? "instavel" : fracao < 0.75 ? "danificado" : "estavel";
}

/** O Estado completo, com a fração em porcentagem. */
export function estadoDaAlma(atual, total) {
  const max = Number(total);
  const chave = chaveDoEstadoDaAlma(atual, total);
  const corrente = atual == null ? max : Math.max(0, Number(atual) || 0);
  const pct = Number.isFinite(max) && max > 0 ? (corrente / max) * 100 : 100;
  return { ...ALMA_ESTADOS[chave], pct };
}

/** A chave é de um Estado que mexe em número ou em Condição (e portanto pede a segunda passada do derive)? */
export const estadoDaAlmaImpoe = (chave) => !!ALMA_ESTADOS[chave] && (
  ALMA_ESTADOS[chave].penalidade !== 0 || ALMA_ESTADOS[chave].custoPE !== 0 || ALMA_ESTADOS[chave].condicoes.length > 0
);

/** As Condições que o Estado impõe, no formato da sessão, prontas para o `resolveCondicoes`. `via` vira o sufixo do hover. */
export const entradasDeCondicaoDaAlma = (chave) => (ALMA_ESTADOS[chave]?.condicoes ?? [])
  .map((nome) => ({ id: `${PREFIXO_CONDICAO_ALMA}${nome}`, nome, rodadas: null, via: `Estado da Alma (${ALMA_ESTADOS[chave].label})` }));

/**
 * As penalidades e o custo, como linhas do Motor. `origem` é a do recurso de Buff `alma_estados_automatico`.
 * O custo extra usa o canal `custoPE` com valor NEGATIVO, que é como o Motor aumenta o custo (Condenado), e vale
 * para todo gasto de energia/estamina que a ficha calcula.
 */
export function efeitosDoEstadoDaAlma(chave) {
  const estado = ALMA_ESTADOS[chave];
  if (!estado || (!estado.penalidade && !estado.custoPE)) return [];
  const comum = { origem: "buff:alma_estados_automatico", nome: `Estado da Alma (${estado.label})`, duracao: "temporaria" };
  const pen = String(estado.penalidade);
  return [
    { canal: "bonusPericia", expr: pen },
    { canal: "bonusTR", expr: pen },
    { canal: "bonusAcerto", expr: pen },
    { canal: "bonusManobra", alvo: "morte", expr: pen },
    { canal: "iniciativa", expr: pen },
    { canal: "custoPE", expr: String(-estado.custoPE) },
  ].map((e) => ({ ...comum, ...e }));
}

/** A linha de aviso do Estado para a barra de Alma: só resultado, sem explicação. `null` no Estado Estável. */
export const avisoDoEstadoDaAlma = (estado) => estado?.aviso ?? null;
