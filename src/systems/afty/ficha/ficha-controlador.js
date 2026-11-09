/**
 * ============================================================
 * CONTROLADOR NA MESA: FRENESI E PROTEGER INVOCAÇÃO (CX6, 2026-11-06)
 * ============================================================
 * Livro p.97 (Proteger Invocação e Frenesi da Invocação, 2° nível) e p.99 (Proteção Avançada de Invocação, 6°). Operações puras sobre
 * a sessão do dono, no contrato do CL1: `opId` obrigatório, recusa com motivo devolvendo a MESMA sessão, `repetida` quando o id já foi
 * aplicado. O que cada uma faz:
 *
 *   ativaFrenesi          "Uma vez por rodada, quando uma invocação realizar uma ação de ataque, você pode fazer com que ela realize essa ação
 *                         duas vezes [...] Mas, por uma rodada, ataques contra ela terão vantagem e ela terá a sua Defesa reduzida em 5 e -5
 *                         em testes de resistência." A ficha grava o Frenesi na linha da invocação (`frenesi`), e o cálculo da invocação
 *                         tira 5 da Defesa e dos TRs. A virada da rodada o apaga. A segunda execução da ação e a vantagem do atacante são
 *                         da mesa (a ficha não tem o ataque contra ela).
 *   protegeInvocacao      "gastar sua reação para reduzir o dano que ela receberá em um valor igual a Xd6 + seu modificador de Presença ou
 *                         Sabedoria. X é igual ao seu bônus de treinamento." Com a Proteção Avançada o dado é d8, e a reação pode sair como
 *                         Ação Livre por 2 PE. Devolve o valor da redução, e quem a aplica no dano da invocação é a mesa (`aplicaDanoInvocacao`).
 *   danoPeloSacrificio    A outra metade: "mover-se até ficar adjacente a ela e receber esse dano por ela". Com a Proteção Avançada o dono
 *                         "receberá apenas metade do dano total". Função pura, o dano é informado.
 *
 * ⚠ DUAS LEITURAS ABERTAS (fila de 2026-09-02, ambas na leitura conservadora): o modificador é ESCOLHA da pessoa entre Presença e
 * Sabedoria (a operação recusa sem a escolha, em vez de adivinhar o maior), e o d8 SUBSTITUI o d6 ("aumentado para").
 *
 * Vale para criatura e personagem sem divergência. Sem tela: o ponto de ligação está em `docs/revisao-livro-regras/entregas/CX6.md`.
 */
import { jaAplicada, comOperacao } from "./ficha-uso-estado";
import { gastaAcao } from "./ficha-acoes";
import { estadoDaInvocacao, defineFrenesiInvocacao, gastaPe, peTempTotal } from "./ficha-sessao";
import { rolarDados } from "./ficha-rolagem";

const inteiro = (v) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : 0;
};

export const CHAVE_USO_FRENESI = "rodada:frenesi";
export const ID_REACAO_PROTEGER = "proteger_invocacao";
export const ATRIBUTOS_DE_PROTEGER = ["presenca", "sabedoria"];

const recusa = (sessao, erro, codigo) => ({ aplicado: false, repetida: false, sessao, erro, codigo });
const repetida = (sessao) => ({ aplicado: false, repetida: true, sessao });
const semOpId = (sessao, opId) => (typeof opId === "string" && opId ? null : recusa(sessao, "Sem Identidade da Operação", "sem-opid"));

/** Liga o Frenesi da Invocação nesta invocação. Uma vez por rodada, só em campo, só para quem tem a Habilidade. */
export function ativaFrenesi(sessao, derived, invId, { opId } = {}) {
  const sem = semOpId(sessao, opId);
  if (sem) return sem;
  if (jaAplicada(sessao, opId)) return repetida(sessao);
  if (!derived?.invocacoes?.controle?.frenesi) return recusa(sessao, "Sem Frenesi da Invocação", "sem-habilidade");
  if (!invId || estadoDaInvocacao(sessao, invId).estado !== "ativa") return recusa(sessao, "Invocação Fora de Campo", "fora-de-campo");
  if (inteiro(sessao?.usos?.[CHAVE_USO_FRENESI]) >= 1) return recusa(sessao, "Frenesi Já Usado Nesta Rodada", "uma-por-rodada");
  const ligada = defineFrenesiInvocacao(sessao, invId, true);
  const usos = { ...(ligada.usos ?? {}), [CHAVE_USO_FRENESI]: 1 };
  return { aplicado: true, repetida: false, sessao: comOperacao({ ...ligada, usos }, { id: opId, tipo: "frenesi" }) };
}

/**
 * A reação de Proteger Invocação, no modo de reduzir o dano. `atributo` é "presenca" ou "sabedoria" e a modificação vem do `derived`.
 * `livre: true` usa a Ação Livre por 2 PE da Proteção Avançada, `rng` entra para o teste. Devolve `{ reducao, dados, mod, faces }`.
 */
export function protegeInvocacao(sessao, derived, { opId, atributo, livre = false, rng = Math.random } = {}) {
  const sem = semOpId(sessao, opId);
  if (sem) return sem;
  if (jaAplicada(sessao, opId)) return repetida(sessao);
  const c = derived?.invocacoes?.controle;
  if (!c?.protegerInvocacao) return recusa(sessao, "Sem Proteger Invocação", "sem-habilidade");
  if (!ATRIBUTOS_DE_PROTEGER.includes(atributo)) return recusa(sessao, "Escolha Presença ou Sabedoria", "sem-atributo");
  if (livre && !c.protecaoAvancada) return recusa(sessao, "Ação Livre Pede a Proteção Avançada", "livre-sem-avancada");
  const x = Math.max(0, inteiro(derived?.maestria ?? derived?.bt));
  const mod = inteiro(atributo === "presenca" ? derived?.mods?.presenca ?? derived?.modByAttr?.presenca : derived?.mods?.sabedoria ?? derived?.modByAttr?.sabedoria);
  const faces = c.protecaoAvancada ? 8 : 6;

  let s = sessao;
  if (livre) {
    const disponivel = Math.max(0, inteiro(s?.peAtual)) + peTempTotal(s);
    if (disponivel < 2) return recusa(sessao, "PE Insuficiente", "pe-insuficiente");
    const acao = gastaAcao(s, derived, "livre", { id: ID_REACAO_PROTEGER });
    if (acao.erro) return recusa(sessao, acao.erro, acao.codigo);
    s = gastaPe(acao.sessao, 2);
  } else {
    const acao = gastaAcao(s, derived, "reacao", { id: ID_REACAO_PROTEGER });
    if (acao.erro) return recusa(sessao, acao.erro, acao.codigo);
    s = acao.sessao;
  }
  const dados = rolarDados(x, faces, rng);
  const reducao = Math.max(0, dados.reduce((t, d) => t + d, 0) + mod);
  return { aplicado: true, repetida: false, sessao: comOperacao(s, { id: opId, tipo: "protegerInvocacao" }), reducao, dados, mod, faces, atributo };
}

/** O dano que o dono recebe ao tomar o golpe no lugar da invocação: inteiro, ou a metade (arredondada para baixo) com a Proteção Avançada. */
export function danoPeloSacrificio(derived, danoTotal) {
  const dano = Math.max(0, inteiro(danoTotal));
  return derived?.invocacoes?.controle?.protecaoAvancada ? Math.floor(dano / 2) : dano;
}

/** Só para a tela saber se a rodada já gastou o Frenesi. */
export const frenesiGastoNaRodada = (sessao) => inteiro(sessao?.usos?.[CHAVE_USO_FRENESI]) >= 1;
