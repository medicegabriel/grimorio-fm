// CX3, frente Aptidões e Treinos (Claude). Livro p.346, Treino de Resistência, Bônus de Treinamento Completo:
// "Uma vez por cena, você ignora a primeira falha em testes de morte."
//
// O núcleo `rolaTesteDeMorte` (ficha-morte.js, CL2) resolve o d20 e as consequências NA MESMA CHAMADA, e o CX3 decidiu
// não desfazer morte por um segundo cálculo. Por isso este cliente decide ANTES de resolver: olha o natural, vê se o
// teste causaria falha, e só então escolhe entre delegar ao núcleo (sem Treino, sem falha ou sem uso restante) e
// resolver sem a primeira falha. Ignorar uma falha só reduz falhas: este caminho nunca estabiliza, mas ainda pode matar (d20 1 com duas falhas já acumuladas).
import { rolarTeste } from "./ficha-rolagem";
import { registraRolagem } from "./ficha-sessao";
import { usa } from "./ficha-uso";
import { jaAplicada, comOperacao } from "./ficha-uso-estado";
import { rolaTesteDeMorte } from "./ficha-morte";
import { vitalEmBranco, estaMorrendo, resolveTesteDeMorte } from "./ficha-vital";

export const ID_IGNORA_FALHA_DE_MORTE = "treino:resistencia:ignora-falha";

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};

/** Quantas falhas um d20 de teste de morte causa (p.313): 1 dá duas, 2 a 9 uma, 10 ou mais nenhuma. */
export const falhasDoNatural = (natural) => (natural <= 1 ? 2 : natural <= 9 ? 1 : 0);

/** O Completo do Treino de Resistência está ativo? As quatro etapas, nos dois sistemas. */
export const temIgnoraFalhaDeMorte = (derived) => inteiro(derived?.conteudoTreinos?.resistencia) >= 4;

/**
 * Rola o teste de morte com a cláusula do Treino. Mesma entrada e mesmo retorno de `rolaTesteDeMorte`, mais
 * `falhaIgnorada: true` quando o Treino consumiu o uso da cena. A decisão é automática (o texto diz "você ignora").
 * Recusa devolve a MESMA sessão.
 */
export function rolaTesteDeMorteComTreino(sessao, derived, entrada = {}, pedido = {}) {
  const opId = pedido?.opId;
  if (typeof opId !== "string" || !opId) return { sessao, aplicado: false, erro: "Sem Identidade da Operação", codigo: "sem-opid" };
  if (jaAplicada(sessao, opId)) return { sessao, aplicado: false, repetida: true };
  const v = sessao.vital ?? vitalEmBranco();
  const rolagem = entrada.natural == null ? rolarTeste({ rotulo: "Teste de Morte", detalhe: "Portas da Morte" }, entrada.rng ?? Math.random) : null;
  const natural = rolagem ? rolagem.natural : inteiro(entrada.natural, 0);
  // Tudo o que o núcleo recusa (fora das Portas, sem teste pendente, d20 inválido) continua sendo recusa do núcleo.
  const delega = () => rolaTesteDeMorte(sessao, derived, { ...entrada, natural, rng: undefined }, pedido);
  if (!temIgnoraFalhaDeMorte(derived) || !estaMorrendo(v) || (!v.testePendente && !entrada.forcar)
    || !(natural >= 1 && natural <= 20) || !falhasDoNatural(natural)) {
    const r = delega();
    // Quando o d20 foi sorteado aqui, o núcleo não o registra (recebeu o natural pronto): o registro fica a cargo deste cliente.
    return r.aplicado && rolagem ? { ...r, sessao: registraRolagem(r.sessao, rolagem) } : r;
  }
  const uso = usa(sessao, derived, { id: ID_IGNORA_FALHA_DE_MORTE, nome: "Treino de Resistência", limite: { por: "cena" } }, { opId: `${opId}:treino` });
  if (!uso.aplicado) {
    const r = delega();
    return r.aplicado && rolagem ? { ...r, sessao: registraRolagem(r.sessao, rolagem) } : r;
  }
  // Ignora UMA falha. O d20 1 causa duas, e a segunda permanece (leitura literal de "a primeira falha", pergunta aberta).
  const restantes = falhasDoNatural(natural) - 1;
  const r = resolveTesteDeMorte(v, restantes ? 5 : 10, sessao.rodada);
  // Sem falhas restantes o teste não vale sucesso nenhum: o 10 do ramo acima só serve de molde e seus sucessos voltam.
  const vital = restantes
    ? { ...r.vital, ultimoTeste: { ...r.vital.ultimoTeste, natural, falhas: restantes, ignoradas: 1 } }
    : { ...v, testePendente: false, ultimoTeste: { natural, falhas: 0, sucessos: 0, rodada: Math.max(0, inteiro(sessao.rodada)), ignoradas: 1 } };
  let s = { ...uso.sessao, vital };
  if (rolagem) s = registraRolagem(s, { ...rolagem, detalhe: "Portas da Morte", fontes: [{ label: "Treino de Resistência", texto: "Ignora a Primeira Falha" }] });
  return {
    sessao: comOperacao(s, { id: opId, tipo: "morte:teste" }), aplicado: true, natural, falhas: restantes, sucessos: 0,
    estabilizou: false, morreu: r.morreu && restantes > 0, estado: vital.estado, falhaIgnorada: true,
  };
}
