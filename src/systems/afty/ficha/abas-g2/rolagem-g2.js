/* ============================================================
   A ROLAGEM SEM SORTEIO: a mesma etapa para OFERECER e para EXECUTAR
   ============================================================
   Prévia das três abas do G2 (2026-10-21). O `rolar` da Ficha G2 fazia, antes de sortear, quatro passos: a Especialização (Ainda de Pé,
   Agarrar, Precisão Forçada), o Custo de Vida da ativação, as propriedades da arma e a rerrolagem de cura. Qualquer um deles podia recusar,
   e a recusa era um `null` mudo. Aqui está a MESMA sequência, sem sorteio e sem tocar na sessão: o `rolar` passa por ela, e os botões
   perguntam a ela se a operação está disponível agora. Disponibilidade e execução não divergem porque são o mesmo caminho.

   Nenhuma regra nova: quem recusa continua sendo `prepararRolagemEspecializacao`, `preparaAtivacaoComCustoVida`, `preparaRolagemArma` e
   `preparaRolagemCura`. O que esta folha acrescenta é DIZER qual delas recusou, para a tela mostrar o motivo.
   ============================================================ */
import { prepararRolagemEspecializacao } from "../ficha-especializacoes";
import { preparaAtivacaoComCustoVida } from "../../afty-feiticos";
import { preparaRolagemCura } from "../../afty-cura";
import { preparaRolagemArma } from "../../afty-propriedades-armas";

/**
 * A preparação inteira, na ordem do `rolar`.
 * Devolve `{ ok: true, desc, pronta, custoVida }`: `desc` é o pedido depois da Especialização (o que o registro lê: consumo de estado,
 * Feitiço de dano, Ritual), `pronta` é o que se sorteia. Ou `{ ok: false, etapa }`, com a etapa que recusou.
 */
export function prepararRolagem(pedido, { sessao, derived, modo = "normal" }) {
  const desc = prepararRolagemEspecializacao({ ...pedido, modo: pedido.modo ?? modo }, sessao, derived);
  if (!desc) return { ok: false, etapa: "especializacao" };
  const ativacao = preparaAtivacaoComCustoVida(desc, sessao.hpAtual);
  const custoVida = ativacao.custo;
  if (custoVida.config && !custoVida.disponivel) return { ok: false, etapa: "vida", custoVida };
  const armada = preparaRolagemArma(ativacao.desc, modo);
  if (!armada) return { ok: false, etapa: "arma" };
  const pronta = preparaRolagemCura(armada, derived.efeitos);
  if (!pronta) return { ok: false, etapa: "cura" };
  return { ok: true, desc, pronta, custoVida };
}

/* Os dois bloqueios da arma, com as palavras da tela (Title Case). O texto cru vem de `aplicarPropriedadesNoDano`. */
const BLOQUEIO_DA_ARMA = { "Arma emperrada": "Arma Emperrada", "Recarregue a arma": "Recarregue a Arma" };

/** O motivo da recusa, lido dos MESMOS campos que a etapa recusante leu. Disponível: `null`. */
export function motivoDaRecusa(prova, pedido) {
  if (!prova || prova.ok) return null;
  if (prova.etapa === "vida") return "Vida Insuficiente";
  if (prova.etapa === "arma") {
    const info = pedido.linhaArma?.armaPropriedades;
    /* O Dano recusa o golpe que ERROU (o pendente marcado como erro) antes de olhar a munição: o Acerto que gastou a última munição
       continua com o Dano dele. */
    if (pedido.tipo === "dano" && info?.estado?.pendente?.errou) return "Errou";
    if (info?.bloqueio) return BLOQUEIO_DA_ARMA[info.bloqueio] ?? info.bloqueio;
  }
  return "Indisponível Agora";
}

/* A etapa do Ritual que a linha mostra, com as palavras dos controles de Ritual (`ControlesRitual`). */
export function etapaDoRitual(ritual) {
  if (!ritual?.ativo) return null;
  if (ritual.podeResolver) return "Pronto";
  if (ritual.etapa === "falhou") return "Falha";
  if (ritual.etapa === "preparando") return "Preparando";
  if (ritual.etapa === "resolvido") return "Resolvido";
  if (ritual.bloqueado) return "Indisponível";
  return "Não Iniciado";
}

/**
 * As travas que a linha do Feitiço já aplicava antes de rolar (`AbaAcoes`, `LinhaFeitico`), com o motivo. Só as de hoje: Técnica Inata
 * bloqueada (vem da BASE, porque a versão liberada é refeita sem ela), Técnica Máxima inválida, Ritual fora de Pronto e, na primeira
 * rolagem, Custo de Vida indisponível. ⚠ A RECARGA E O PE DA TÉCNICA MÁXIMA NÃO ESTÃO AQUI: eles decidem o Usar, e não a rolagem do uso
 * já pago.
 */
export function travaDoFeitico(f, base, indice) {
  if (base.bloqueado) return base.bloqueado;
  if (f.tecnicaMaxima?.valida === false) return "Técnica Máxima Inválida";
  if (f.ritual?.ativo && !f.ritual?.podeRolarFeitico) return `Ritual ${etapaDoRitual(f.ritual)}`;
  if (indice === 0 && f.custoVidaAtivacao && !f.custoVidaDisponivel) return "Vida Insuficiente";
  return null;
}
