import { motorAfty } from "./afty";
import { motor252 } from "./m252";

/**
 * O adaptador de um combatente, pelo `motor` gravado nele. O marcador (só nome e
 * iniciativa) não tem motor e devolve null: todo chamador trata esse caso, e
 * nenhum verbo roda nele.
 *
 * ⚠ O MOTOR É DADO DO COMBATENTE, e não da lista nem da rota. Ele nasce na entrada
 * pela chave do inventário e pelo `sistemaGravado` da ficha (ver listas.js), e
 * nunca é deduzido de novo depois.
 */
export const MOTORES = { afty: motorAfty, 252: motor252 };

export function motorDe(combatente) {
  if (!combatente || combatente.tipo === "marcador") return null;
  return MOTORES[combatente.motor] ?? null;
}

export { motorAfty, motor252 };
export { VERBOS_DO_MOTOR, DADOS_DO_MOTOR, MotorPendente, faltasDoAdaptador } from "./interface";
