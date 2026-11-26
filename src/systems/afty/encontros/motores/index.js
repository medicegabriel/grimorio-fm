import { motorAfty } from "./afty";
import { motor252 } from "./m252";
import { motorMarcador } from "./marcador";

/**
 * O adaptador de um combatente, pelo `motor` gravado nele. O marcador (só nome e
 * iniciativa) não tem motor e devolve null: todo chamador trata esse caso, e
 * nenhum verbo roda nele. O marcador COM Vida (rework, etapa 2, 2026-11-23) é a
 * exceção: ele fala com o adaptador mínimo de `marcador.js`, que só mexe na Vida.
 *
 * ⚠ O MOTOR É DADO DO COMBATENTE, e não da lista nem da rota. Ele nasce na entrada
 * pela chave do inventário e pelo `sistemaGravado` da ficha (ver listas.js), e
 * nunca é deduzido de novo depois. O marcador continua com `motor: null` gravado:
 * quem decide é a `vida`.
 */
export const MOTORES = { afty: motorAfty, 252: motor252 };

export function motorDe(combatente) {
  if (!combatente) return null;
  if (combatente.tipo === "marcador") return combatente.vida ? motorMarcador : null;
  return MOTORES[combatente.motor] ?? null;
}

export { motorAfty, motor252, motorMarcador };
export { normalizarVidaDoMarcador } from "./marcador";
export { VERBOS_DO_MOTOR, DADOS_DO_MOTOR, MotorPendente, faltasDoAdaptador } from "./interface";
