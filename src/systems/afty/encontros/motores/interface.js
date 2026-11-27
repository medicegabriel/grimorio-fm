/**
 * ============================================================
 * A INTERFACE DO ADAPTADOR POR MOTOR (Encontro Unificado, etapa 3, 2026-11-17)
 * ============================================================
 * O Encontro novo junta combatentes de dois motores: o do Afty (`ficha` mais
 * `sessao`, a conta de `ficha/ficha-sessao.js`) e o da 2.5.2 (`snapshot` mais
 * `combatState`). O redutor e as operações NUNCA falam com um motor direto: eles
 * pedem o adaptador do combatente (`motores/index.js`) e chamam os verbos daqui.
 *
 * Todo verbo recebe o ESTADO primeiro e o derivado depois, e devolve o estado
 * novo. Os verbos de turno (`iniciaCombate`, `iniciaTurno`, `encerraTurno`, `viraRodada`) recebem
 * ainda um terceiro argumento, `op`: `{ abatido, nome, avisar, forcada, comecoDoCombate }` (o redutor o monta
 * em `opcoesDe`, e o Afty o ignora). `limite` recebe `{ antes }` como quarto argumento. O estado é a sessão do Afty ou o `combatState` da 2.5.2. Quem guarda o
 * estado (o combatente, ou a sessão da própria ficha) é assunto do modelo, e não
 * do motor.
 *
 * A lista do plano tem dez verbos. Os outros oito entraram porque o redutor e as
 * ações em grupo precisam deles (estado inicial, aparo, Recuperar PE, Descansar,
 * começo e fim do combate, e o limite do Desfazer relativo). A etapa 5 acrescentou
 * os três da duração por quem aplicou. Ver docs/afty-encontros.md.
 *
 * FOLHA: zero imports. Os dois adaptadores e o índice importam daqui.
 * ============================================================
 */

export const VERBOS_DO_MOTOR = [
  // (ficha ou snapshot, derivado) -> estado novo, com os recursos cheios.
  "estadoInicial",
  // (estado bruto, derivado) -> estado saneado na leitura.
  "normalizarEstado",
  // (ficha, estado, época dos addons) -> derivado ou null.
  "derivar",
  // (estado, derivado) -> estado com os correntes aparados nos máximos.
  "aparar",
  // (estado, derivado, valor, opções) -> estado.
  "aplicarDano",
  "aplicarCura",
  "gastarPe",
  "recuperarPe",
  "descansar",
  // (estado, derivado, { modo, valor }) -> estado. Modo "dano", "cura" ou "definir".
  "alma",
  // (estado, derivado, { modo, condicao, condicoes }) -> estado. Modo "definir", "adicionar" ou "remover".
  "condicao",
  // (estado, derivado) -> estado.
  "iniciaCombate",
  "encerraCombate",
  /* O Reabrir de um Encontro Finalizado (rework, etapa 2, 2026-11-23) quando o retorno exato do Encerrar não fecha (alguém mexeu
     depois): religa o combate sem a cena nova do `iniciaCombate` (a rodada e as cascas ficam como estão). */
  "retomaCombate",
  "iniciaTurno",
  "encerraTurno",
  // (estado, derivado) -> { estado, expirou: [{ nome }] }. Só o que é POR RODADA: as durações não descem aqui (etapa 5).
  "viraRodada",
  /* Os três da duração por quem aplicou (etapa 5, 2026-11-17). Ver ficha-sessao.js, acima de `desceDuracoesDe`.
     (estado, derivado, { vale, ...op }) -> { estado, expirou }: desce as durações cujo aplicador `vale(aplicadorId)` aceita.
     Sem nada a descer, `estado` é o MESMO objeto. */
  "desceDuracoesDe",
  // (antes, depois, { aplicadorId, noTurno }) -> depois com quem aplicou carimbado nas entradas com rodadas que nasceram.
  "marcarAplicador",
  // (estado, deId) -> estado com o que `deId` aplicou passado para a própria ficha (quem saiu da luta).
  "repassarAplicador",
  // (estado, derivado) -> { pv, pvMax, pvTemp, pe, peMax, peTemp, alma, almaMax, condicoes, efeitos, caido, morto }.
  "resumo",
  // (caminho, estado, derivado) -> o teto daquele número para o Desfazer relativo, ou null.
  "limite",
];

/* O que cada adaptador declara como DADO, além dos verbos:
     motor              "afty" ou "252"
     campoDoEstado      onde o estado mora no combatente-instância ("sessao" ou "combatState")
     campoDoRegistro    a lista de entradas próprias do estado (rolagens, mensagens), que o diff ignora
     porChave           chaves de primeiro nível cujo valor é um mapa comparado entrada por entrada
     relativos          caminhos que o Desfazer volta pelo delta ("*" casa qualquer chave do mapa)
     ignorados          chaves que nunca entram numa operação
   Dados OPCIONAIS (a 2.5.2 os usa, etapa 4, e `faltasDoAdaptador` não os exige):
     registroNoFim      o registro próprio cresce pelo fim (`combatLog`, com `slice(-50)`) e não pelo começo
     sempreDerivado     todo verbo de número precisa do derivado, e a operação devolve "Ficha sem Cálculo" sem ele
     abateAutomatico    (estado) -> boolean: o contador de erros chegou a 3, e o redutor liga o Abatido
     soltosNoDesfazer   caminhos que o Desfazer não confere nem devolve (`lastDamage`) */
export const DADOS_DO_MOTOR = ["motor", "campoDoEstado", "campoDoRegistro", "porChave", "relativos", "ignorados"];

/**
 * O erro de um verbo que o motor ainda não tem. Carrega o motor, o verbo e a
 * etapa do plano em que ele chega, para a tela (e o assert) dizerem o porquê.
 */
export class MotorPendente extends Error {
  constructor(motor, verbo, etapa) {
    super(`Motor ${motor}: o verbo "${verbo}" ainda não existe. Ele chega na etapa ${etapa} do Encontro Unificado.`);
    this.name = "MotorPendente";
    this.motor = motor;
    this.verbo = verbo;
    this.etapa = etapa;
  }
}

/** O que falta num adaptador: verbos que não são função e dados ausentes. Lista vazia é o certo. */
export function faltasDoAdaptador(adaptador) {
  const faltas = [];
  for (const v of VERBOS_DO_MOTOR) {
    if (typeof adaptador?.[v] !== "function") faltas.push(`verbo ${v}`);
  }
  for (const d of DADOS_DO_MOTOR) {
    if (adaptador?.[d] == null) faltas.push(`dado ${d}`);
  }
  return faltas;
}
