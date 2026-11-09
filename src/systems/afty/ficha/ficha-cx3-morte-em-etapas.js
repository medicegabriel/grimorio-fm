// Livro p.313 e p.346. O d20 salvo precede as escolhas, a consequência segue CL2.
import { estaMorrendo } from "./ficha-vital";
import { rolaTesteDeMorte } from "./ficha-morte";
import { ID_IGNORA_FALHA_DE_MORTE, rolaTesteDeMorteComTreino, temIgnoraFalhaDeMorte } from "./ficha-conteudo-treino-resistencia";
import { rolarTeste } from "./ficha-rolagem";
import { registraRolagem, usosGastosDe } from "./ficha-sessao";
import { jaAplicada, comOperacao, usoDe } from "./ficha-uso-estado";

const recusa = (sessao, erro, extra) => ({ sessao, aplicado: false, erro, ...extra });
const contexto = (s) => [s.rodada, usoDe(s).acoes.turno, s.vital?.saldo, s.vital?.falhas, s.vital?.sucessos];
const idDoTurno = (s) => JSON.stringify(["morte:rolagem", s.rodada, usoDe(s).acoes.turno]);

export function preparaMorteEmEtapas(sessao, { rng } = {}) {
  if (!estaMorrendo(sessao.vital) || !sessao.vital.testePendente) return recusa(sessao, "Sem Teste de Morte Pendente");
  const id = idDoTurno(sessao);
  if (jaAplicada(sessao, id)) return { sessao, aplicado: false, repetida: true };
  const rolagem = rolarTeste({ rotulo: "Portas da Morte", contextoConteudo: { tipo: "testeMortePendente", id, vital: contexto(sessao) } }, rng);
  return { sessao: comOperacao(registraRolagem(sessao, rolagem), { id, tipo: "morte:rolagem" }), aplicado: true, rolagem };
}

export function concluiMorteEmEtapas(sessao, derived, { rolagemId, d20Um, cenaForaDeCombate, falhaAposSucesso } = {}, pedido = {}) {
  const id = idDoTurno(sessao);
  const rolagem = sessao.log?.find((r) => r.id === rolagemId && r.contextoConteudo?.id === id);
  if (!estaMorrendo(sessao.vital) || !sessao.vital.testePendente || !rolagem || !jaAplicada(sessao, id)
    || rolagem.consequenciasAplicadas || rolagem.sorte?.escolha === null
    || JSON.stringify(rolagem.contextoConteudo.vital) !== JSON.stringify(contexto(sessao))) return recusa(sessao, "Falta Teste de Morte Atual Resolvido");
  const { natural } = rolagem;
  if (!Number.isInteger(natural) || natural < 1 || natural > 20) return recusa(sessao, "Resultado do d20 Inválido");
  let aplicaTreino = natural < 10 && temIgnoraFalhaDeMorte(derived)
    && !usosGastosDe(sessao, `cena:uso:${ID_IGNORA_FALHA_DE_MORTE}`);
  if (aplicaTreino && !sessao.combate?.ativo && cenaForaDeCombate !== "limiteCL1") {
    return recusa(sessao, "Falta Confirmar a Cena do Teste de Morte", { pendente: "cena" });
  }
  if (aplicaTreino && sessao.vital.sucessos > 0) {
    if (typeof falhaAposSucesso !== "boolean") return recusa(sessao, "Falta Confirmar a Primeira Falha", { pendente: "aposSucesso" });
    aplicaTreino = falhaAposSucesso;
  }
  if (aplicaTreino && natural === 1 && d20Um !== "ignoraUma") {
    return recusa(sessao, "Falta Confirmar a Falha Crítica", { pendente: "d20Um" });
  }
  const resolver = aplicaTreino ? rolaTesteDeMorteComTreino : rolaTesteDeMorte;
  const r = resolver(sessao, derived, { natural }, pedido);
  return r.aplicado ? { ...r, sessao: { ...r.sessao, log: r.sessao.log.map((item) => item.id === rolagemId
    ? { ...item, consequenciasAplicadas: true, ...(r.falhaIgnorada ? { falhaIgnorada: true } : {}) } : item) } } : r;
}
