import { VERBOS_DO_MOTOR } from "./interface";
import * as V from "./m252-vital";

/**
 * ============================================================
 * O MOTOR DA 2.5.2 NO ENCONTRO (Encontro Unificado, etapa 4, 2026-11-17)
 * ============================================================
 * A criatura da 2.5.2 entra no Encontro novo com `snapshot` e `combatState`, a forma de
 * `src/fm-encounter.js`. Cada verbo do adaptador é a conta que o Encontro da 2.5.2 já faz
 * hoje: o que é puro e exportado lá é importado como está, e o que mora dentro dos handlers
 * do `CombatantPanel.jsx` foi COPIADO para `motores/m252-vital.js`, com a origem anotada.
 * Nada aqui melhora nem corrige a conta.
 *
 * O DERIVADO da 2.5.2 é o objeto de `derivarVivo` (stats AO VIVO, `snapshot`, `combatSettings`,
 * Estado da Alma), e não a ficha derivada do Afty. Os verbos de número lançam "Ficha sem Cálculo"
 * sem ele (`sempreDerivado` faz o Encontro devolver esse erro de tela antes de chegar aqui).
 *
 * O PV temporário é o excedente de `hpCurrent` acima do máximo, e o PE temporário é o excedente de
 * `peCurrent` mais o mapa `peTempSources` (a casca por fonte, que a virada renova). Por isso o
 * `aparar` NÃO apara: aparar a Vida no máximo apagaria o PV temporário.
 *
 * A DURAÇÃO (etapa 5, 2026-11-17): condições e modificadores descem no fim do turno de quem os aplicou
 * (`desceDuracoesDe`), e não mais no começo do turno de quem tem a condição nem na virada. Diverge da 2.5.2 de
 * propósito (autor: "nas rotas todas"), e o `CombatTracker` da ficha única no `/` não muda.
 *
 * Os turnos recebem `op` (terceiro argumento): `{ abatido, nome, avisar, forcada, comecoDoCombate }`.
 * `avisar(tipo, mensagem)` leva ao Registro do Encontro as frases que o `useEncounter.js` escrevia
 * (PE ganho no começo da rodada, os gatilhos e "A condição [X] de Y chegou ao fim e foi removida").
 *
 * Dados próprios, fora da interface:
 *   registroNoFim    o `combatLog` cresce pelo FIM (a 2.5.2 faz `slice(-50)`), ao contrário do `log` do Afty
 *   sempreDerivado   todo verbo de número precisa do derivado
 *   abateAutomatico  o contador de erros chegou a 3 (o redutor liga o Abatido)
 *   soltosNoDesfazer caminhos que o Desfazer não confere nem devolve (`lastDamage`, que só alimenta as reações)
 * Os extras que não são verbos da interface (ativar regra, Ignorar RD, Resistência, Suscetível, a Guarda)
 * saem por `motores/m252-vital.js` e viajam como operação `sessao`.
 * ============================================================
 */

const nomesUnicos = (lista) => [...new Set(lista.filter(Boolean))];

export const motor252 = {
  motor: "252",
  campoDoEstado: "combatState",
  campoDoRegistro: "combatLog",
  registroNoFim: true,
  sempreDerivado: true,
  porChave: ["peTempSources"],
  relativos: [["hpCurrent"], ["peCurrent"], ["almaAtual"], ["guardaInabavalCurrent"], ["peTempSources", "*"]],
  soltosNoDesfazer: [["lastDamage"]],
  ignorados: ["combatLog", "historico"],

  estadoInicial: (snapshot) => V.estadoInicial(snapshot),
  normalizarEstado: (bruto) => bruto,
  derivar: (snapshot, combatState) => V.derivarVivo(snapshot, combatState),
  // Identidade de propósito: a Vida acima do máximo é PV temporário, e o PE também.
  aparar: (combatState) => combatState,

  aplicarDano: (cs, d, valor) => V.emVital(cs, d, "hp", cs.hpCurrent - Math.max(0, Math.trunc(Number(valor) || 0))),
  aplicarCura: (cs, d, valor) => V.emVital(cs, d, "hp", cs.hpCurrent + Math.max(0, Math.trunc(Number(valor) || 0))),
  gastarPe: (cs, d, valor) => V.emVital(cs, d, "pe", (cs.peCurrent ?? 0) - Math.max(0, Math.trunc(Number(valor) || 0))),
  recuperarPe: (cs, d, valor) => V.emVital(cs, d, "pe", (cs.peCurrent ?? 0) + Math.max(0, Math.trunc(Number(valor) || 0))),
  // O Reset de Combate do painel (autor, 2026-11-17, "Igual ao Reset").
  descansar: (_cs, d) => V.emReset(d),

  alma: (cs, d, { modo = "dano", valor = 0 } = {}) => {
    const v = Math.max(0, Math.trunc(Number(valor) || 0));
    const hpMaxBase = cs.hpMaxBase ?? d?.stats?.hpMax ?? 0;
    const antes = cs.almaAtual ?? hpMaxBase;
    if (modo === "cura") return V.emAlma(cs, d, antes + v);
    if (modo === "definir") return V.emAlma(cs, d, Math.trunc(Number(valor) || 0));
    return V.emAlma(cs, d, antes - v);
  },

  condicao: (cs, d, { modo = "definir", condicao = null, condicoes = [] } = {}) => {
    if (modo === "adicionar") {
      const c = typeof condicao === "string"
        ? V.novaCondicao({ nome: condicao })
        : (condicao?.id && condicao?.name ? condicao : V.novaCondicao({ nome: condicao?.name ?? condicao?.nome, nivel: condicao?.level, duracao: condicao?.duracao }));
      if (!c || V.condicaoJaAtiva(cs, d, c.name)) return cs;
      return V.emCondicaoAdicionada(cs, c);
    }
    if (modo === "remover") {
      const alvo = typeof condicao === "string" ? { id: condicao, name: condicao } : (condicao ?? {});
      const lista = cs.activeConditions ?? [];
      const porId = lista.find((x) => alvo.id != null && x.id === alvo.id);
      const achada = porId ?? lista.find((x) => V.normCond(x.name) === V.normCond(alvo.name ?? alvo.nome));
      return achada ? V.emCondicaoRemovida(cs, achada.id) : cs;
    }
    return { ...cs, activeConditions: Array.isArray(condicoes) ? condicoes : [] };
  },

  iniciaCombate: (cs, d, op) => V.turnoIniciaCombate(cs, d, op),
  // O Encontro da 2.5.2 não mexe nos combatentes ao encerrar (END_COMBAT só muda o status).
  encerraCombate: (cs) => cs,
  // O Reabrir sem o retorno exato (rework, etapa 2): nada a religar, porque o encerrar não mexeu.
  retomaCombate: (cs) => cs,
  iniciaTurno: (cs, d, op) => V.turnoIniciaTurno(cs, d, op),
  encerraTurno: (cs, d, op) => V.turnoEncerraTurno(cs, d, op),
  viraRodada: (cs, d, op) => V.turnoViraRodada(cs, d, op),
  /* Etapa 5: condições e modificadores descem no fim do turno de quem aplicou (`op.vale`). Não precisa do derivado. As frases
     do Registro saem por `op.avisar`, como as da virada, e por isso `expirou` volta vazio. */
  desceDuracoesDe: (cs, _d, op) => ({ estado: V.turnoDesceDuracoes(cs, null, op), expirou: [] }),
  marcarAplicador: (antes, depois, opcoes = {}) => V.marcarAplicador252(antes, depois, opcoes),
  repassarAplicador: (cs, deId) => V.repassarAplicador252(cs, deId),

  /* O que a linha da iniciativa e o colega mostram. O PV temporário e o PE temporário são o excedente das barras
     do painel (CombatantPanel.jsx:1958-1971): a barra de Vida usa o máximo limitado pela Alma. */
  resumo: (cs, d) => {
    // Só leitura: sem o derivado ele DEGRADA (máximos 0 e só os nomes das condições da lista), como o do Afty, e não lança. O
    // `derivarEncontro` deixa `null` a criatura que não derivou para ela não derrubar as outras, e a linha dela precisa mostrar algo.
    const vivo = d?.snapshot && d?.stats ? d : null;
    const hpMaxBase = vivo?.hpMaxBase ?? 0;
    const pvMax = vivo ? Math.max(0, vivo.almaEstado.hpMaxAtual) : 0;
    const peMax = vivo ? Math.max(0, Math.trunc(Number(vivo.stats.peMax) || 0)) : 0;
    const hp = Math.trunc(Number(cs.hpCurrent) || 0);
    const pe = Math.trunc(Number(cs.peCurrent) || 0);
    return {
      pv: vivo ? Math.min(hp, pvMax) : hp,
      pvMax,
      pvTemp: vivo ? Math.max(0, hp - pvMax) : 0,
      pe: vivo ? Math.min(pe, peMax) : pe,
      peMax,
      peTemp: vivo ? Math.max(0, pe - peMax) : 0,
      alma: Math.max(0, Math.trunc(Number(cs.almaAtual ?? hpMaxBase) || 0)),
      almaMax: Math.max(0, Math.trunc(Number(hpMaxBase) || 0)),
      condicoes: nomesUnicos([...(cs.activeConditions ?? []).map((c) => c?.name), ...(vivo?.almaEstado.condicoes ?? [])]),
      efeitos: nomesUnicos((cs.activeModifiers ?? []).filter((m) => m && m.enabled !== false).map((m) => m.name)),
      caido: pvMax > 0 && hp <= 0,
      morto: !!vivo && vivo.almaEstado.estadoKey === "destruido" && hpMaxBase > 0,
    };
  },

  /* O teto de cada número relativo do Desfazer. A Vida e o PE nunca ficam abaixo do valor que tinham antes da
     operação (`antes`): o que passa do máximo é PV e PE temporário, que o Desfazer pode devolver. */
  limite: (caminho, cs, d, { antes = null } = {}) => {
    if (!d?.stats || caminho.length !== 1) return null;
    const piso = Number.isFinite(antes) ? antes : 0;
    const base = d.hpMaxBase ?? 0;
    if (caminho[0] === "hpCurrent") return Math.max(V.estadoDaAlma(cs, base).hpMaxAtual, piso);
    if (caminho[0] === "peCurrent") return Math.max(Math.trunc(Number(d.stats.peMax) || 0), piso);
    if (caminho[0] === "almaAtual") return Math.max(0, base);
    if (caminho[0] === "guardaInabavalCurrent") return Math.max(Math.trunc(Number(d.stats.guardaInabavalMax) || 0), piso);
    return null;
  },

  abateAutomatico: (cs) => V.abatidoAutomatico(cs),
};

// Os verbos da interface ficam todos preenchidos. O assert confere, pela lista, que nenhum foi esquecido.
export const VERBOS_SEM_CORPO = VERBOS_DO_MOTOR.filter((v) => typeof motor252[v] !== "function");
