// CX3, frente Aptidões e Treinos (Claude). Livro p.175, Absorção Elemental.
// "Sempre que você receber dano elemental, você pode usar sua reação para absorver parte dele e
// guardar. Isso não reduz o dano, mas, na próxima vez em que você realizar um ataque você pode
// adicionar Xd6 de dano do mesmo tipo. [...] Esta habilidade não é cumulativa."
//
// Este cliente só ARMA a carga. O dano recebido já foi aplicado por `aplicaDanoRecebido` (a
// reação não o reduz) e o dado extra entra no golpe pelo grupo de `grupoDanoAbsorcaoElemental`,
// ligado em `aplicarAptidoesNoDano` (patch descrito na entrega). A pendência é consumida pelo
// `registraAtaqueRealizado` do CL1, com `consome: "declaracao"`, ou seja, QUALQUER ataque a gasta,
// errando ou acertando: a p.175 não abre a exceção que a p.178 abre para Canalizar em Golpe.
import { tiposDeDanoDaCategoria } from "../afty-equipamentos";
import { ESTADO_ABSORCAO_ELEMENTAL, ID_ABSORCAO_ELEMENTAL, dadosAbsorcaoElemental, grupoDanoAbsorcaoElemental } from "../afty-conteudo-auras";
import { usa } from "./ficha-uso";
import { usoDe, jaAplicada, comOperacao } from "./ficha-uso-estado";
import { armaProximoAtaque } from "./ficha-combate-eventos";
import { aptidaoDeConteudoDisponivel, impedimentoParaAgirConteudo } from "./ficha-conteudo-acesso";

const recusa = (sessao, erro) => ({ sessao, aplicado: false, erro });

/** Os tipos da categoria Elementais do catálogo da ficha, inclusive os de Addon. */
export const tiposElementais = () => tiposDeDanoDaCategoria("elemental");

/** O estado de combate que guarda o tipo da carga. Mesmo formato do Golpe com Aura. */
export const estadoAbsorcaoElemental = () => ({
  id: ESTADO_ABSORCAO_ELEMENTAL, label: "Absorção Elemental", tipo: "opcao",
  opcoes: tiposElementais().map((t) => ({ id: t.id, label: t.label })),
});

/** A carga guardada agora, ou null. Lê o estado e a pendência juntos. */
export function cargaDeAbsorcao(sessao) {
  const tipo = sessao?.combate?.[ESTADO_ABSORCAO_ELEMENTAL];
  const armada = usoDe(sessao).pendencias.some((p) => p.id === ID_ABSORCAO_ELEMENTAL);
  return armada && typeof tipo === "string" && tipo ? { tipo } : null;
}

/**
 * Os recibos de dano elemental que o alvo REALMENTE recebeu, lidos do registro "Ataque Confirmado"
 * do CL1 na sessão de quem recebeu. O registro existe nas duas sessões (atacante e alvo), por isso
 * o `meuId` filtra: só vale o ataque cujo alvo declarado é quem reage.
 */
export function recibosElementais(sessao, meuId) {
  if (!meuId) return [];
  const elementais = new Set(tiposElementais().map((t) => t.id));
  const saida = [];
  for (const r of sessao?.log ?? []) {
    // Reação responde ao gatilho: só vale o dano recebido nesta rodada.
    if (r?.rotulo !== "Ataque Confirmado" || r.ataque?.alvo?.id !== meuId || !r.ataqueId || r.rodada !== sessao.rodada) continue;
    for (const c of r.calculos ?? []) {
      if (elementais.has(c.tipoDano) && Number(c.final) > 0) saida.push({ ataqueId: r.ataqueId, tipoDano: c.tipoDano, final: Number(c.final) });
    }
  }
  return saida;
}

/**
 * Absorve. `entrada`: `{ ataqueId, tipoDano, meuId, descontarPE? }`, o recibo escolhido entre os de
 * `recibosElementais`. Gasta a Reação (sem PE, o texto não cobra energia) e arma a carga.
 * Recusas devolvem a MESMA sessão, sem reação gasta.
 */
export function absorveElemental(sessao, derived, entrada = {}, pedido = {}) {
  if (typeof pedido.opId !== "string" || !pedido.opId) return recusa(sessao, "Sem Identidade da Operação");
  if (jaAplicada(sessao, pedido.opId)) return { sessao, aplicado: false, repetida: true };
  if (!aptidaoDeConteudoDisponivel(derived, ID_ABSORCAO_ELEMENTAL)) return recusa(sessao, "Absorção Elemental Indisponível");
  const au = derived.aptidao?.efetivo?.au ?? 0;
  if (dadosAbsorcaoElemental(au) < 1) return recusa(sessao, "Nível de Aptidão em Aura 0: Sem Dados");
  const recibo = recibosElementais(sessao, entrada.meuId).find((r) => r.ataqueId === entrada.ataqueId && r.tipoDano === entrada.tipoDano);
  if (!recibo) return recusa(sessao, "Falta Dano Elemental Recebido");
  const eventoId = `absorcao:${recibo.ataqueId}:${recibo.tipoDano}`;
  if (jaAplicada(sessao, eventoId)) return recusa(sessao, "Este Dano Já Foi Absorvido");
  // Não cumulativa: a carga guardada impede nova absorção. A checagem vem ANTES do uso,
  // para a recusa não gastar a Reação. O que acontece com uma segunda absorção é pergunta aberta.
  if (usoDe(sessao).pendencias.some((p) => p.id === ID_ABSORCAO_ELEMENTAL)) return recusa(sessao, "Já Existe uma Carga Guardada");
  const estado = estadoAbsorcaoElemental();
  const uso = usa(sessao, derived, {
    id: ID_ABSORCAO_ELEMENTAL, nome: "Absorção Elemental", emCombate: true,
    acesso: impedimentoParaAgirConteudo, acao: "reacao", cobranca: entrada.descontarPE ? "confirmada" : "manual",
    proibidoCom: ["Atordoado", "Inconsciente", "Paralisado", "Indefeso"],
    // O uso ativo é o que faz o CL1 desligar o estado no fim do combate e no descanso (e ao consumir, pelo usoId da pendência).
    duracao: { ate: "descanso" },
    efeitos: [{ tipo: "estado", id: ESTADO_ABSORCAO_ELEMENTAL, estado, valor: recibo.tipoDano, desliga: false }],
  }, { ...pedido, registraAcao: true });
  if (!uso.aplicado) return uso;
  const armado = armaProximoAtaque(uso.sessao, {
    id: ID_ABSORCAO_ELEMENTAL, usoId: ID_ABSORCAO_ELEMENTAL, nome: "Absorção Elemental", estado: ESTADO_ABSORCAO_ELEMENTAL,
    // Feitiço fica de fora até o autor responder (D3): o grupo de dano só entra nas linhas de arma e desarmado,
    // e gastar a carga num Feitiço sem somar o dado seria perder a carga calado.
    elegivel: { exceto: ["feitico"] }, consome: "declaracao",
  }, { opId: `${pedido.opId}:carga` });
  if (!armado.aplicado) return recusa(sessao, armado.erro ?? "Carga Não Armada");
  return { ...uso, sessao: comOperacao(armado.sessao, { id: eventoId, tipo: "absorcao" }), carga: { tipo: recibo.tipoDano }, recibo };
}

/** O grupo de dano que a carga acrescenta ao próximo ataque, ou null. Puro. */
export function grupoDeAbsorcaoPendente(sessao, derived) {
  const carga = cargaDeAbsorcao(sessao);
  if (!carga || !aptidaoDeConteudoDisponivel(derived, ID_ABSORCAO_ELEMENTAL)) return null;
  if (!tiposElementais().some((t) => t.id === carga.tipo)) return null;
  return grupoDanoAbsorcaoElemental({ au: derived.aptidao?.efetivo?.au, tipo: carga.tipo });
}
