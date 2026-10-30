/**
 * ============================================================
 * AS OPÇÕES DO DERIVE QUE VÊM DA SESSÃO, NUM LUGAR SÓ
 * ============================================================
 * ⚠ ELAS TÊM VÁRIOS LEITORES: a ficha da tela, cada derive de comparação que o
 * `deltaDosEstados` e o `saldoDoAgora` rodam, a Linha do Tempo e os efeitos
 * recebidos da aba Efeitos. Uma lista escrita em dois lugares foi um bug real e
 * caro de enxergar (2026-08-28): o delta derivava sem `guarda`, sem `concedido` e
 * sem os três de Ritual, e a diferença entre as duas LISTAS DE OPÇÃO era
 * creditada ao estado que estava sendo medido. Numa criatura Calamidade toda
 * linha ligada exibia "Defesa +5", que é a Guarda Inabalável.
 *
 * Esta função é a lista. O `AftyFicha.jsx` a usa para o `derived`, e a camada
 * dos Efeitos (`efeitos/ponte.js`) a usa para todo derive de comparação. Nenhum
 * dos dois mantém uma lista própria, e um campo novo de sessão que o derive lê
 * entra AQUI e vale para todos.
 *
 * Puro: só lê a sessão. Sem React, e FOLHA em relação ao derive (não importa
 * `afty-derive.js`), então não mexe na ordem de módulos.
 * ============================================================
 */
import { entradaDaGuarda, ritualEmAndamento, usosRitualista } from "./ficha-sessao";

export function opcoesDeriveDaSessao(sessao) {
  return {
    propriedadesArmas: sessao.propriedadesArmas,
    ataqueBasicoId: sessao.ataqueBasicoId,
    bloodfeast: sessao.bloodfeast,
    vidaAtual: sessao.hpAtual,
    almaAtual: sessao.almaAtual,
    ultimoFeiticoDanoId: sessao.ultimoFeiticoDanoId,
    rituais: sessao.rituais,
    usosRitualista: usosRitualista(sessao),
    ritualAtual: ritualEmAndamento(sessao),
    /* O que o mestre concedeu no meio da luta (Addons 8.3). Entra pelo `opcoes`, e
       não pela criatura mesclada, porque não é escolha de ficha: é ganho de
       combate, de graça, e morre com a sessão. */
    concedido: sessao.concedido,
    /* O Ciclo de Adaptação também é estado de mesa. */
    adaptacoes: sessao.adaptacoes,
    dharma: sessao.dharma,
    treinosAtivos: sessao.treinosAtivos,
    /* A Guarda Inabalável CORRENTE: o bônus soma na Defesa e nos cinco TRs, e
       resolver a Guarda fora do derive obrigaria a derivar duas vezes. */
    guarda: entradaDaGuarda(sessao),
    /* O estado de mesa das invocações: um Shikigami em campo pode estar dando
       Defesa, Acerto ou RD ao dono, e isso é número do derive. */
    invocacoes: sessao.invocacoes,
    /* As condições da sessão mexem em Defesa, TR, perícia, acerto, movimento e RD. */
    condicoes: sessao.condicoes,
    /* A Exaustão de Técnica (DA-16, 2026-10-08) é trava de derive. */
    exaustaoTecnica: sessao.exaustaoTecnica,
  };
}
