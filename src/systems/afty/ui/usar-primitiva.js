import { createContext, useContext } from "react";

import { SEM_PRIMITIVAS } from "../afty-addons";

/**
 * ============================================================
 * QUEM ENXERGA AS PRIMITIVAS DE ADDON
 * ============================================================
 * As primitivas da fase 0 vivem no MOTOR sempre, e aparecem na TELA só de quem
 * instalou um addon que as pediu (campo `permite` do pacote). A fonte é
 * `derived.primitivas`, que sai da propria criatura.
 *
 * ⚠ POR QUE CONTEXTO, E NÃO PROP. Dois dos três consumidores são folhas fundas
 * do criador (`CanalPicker` e `VariavelPicker`), num arquivo de 12 mil linhas.
 * Passar prop até lá significaria mexer na assinatura de meia dúzia de
 * componentes que não têm nada a ver com Addons, e cada um deles viraria um
 * lugar a mais para alguém esquecer de repassar. É o caso que contexto resolve:
 * um fato AMBIENTE sobre a criatura aberta.
 *
 * ⚠ O provedor é POR CRIATURA, e não um só no topo do app. No Encontro cada
 * painel de combatente monta o seu, senão um combatente com addon emprestaria a
 * tela dele para o combatente ao lado, que é a mesma armadilha do mundo unido.
 *
 * Quem não põe provedor nenhum enxerga zero primitivas, e esse padrão é de
 * propósito: esquecer o provedor ESCONDE coisa, e nunca mostra coisa a mais.
 *
 * O componente provedor mora em `PrimitivasDeAddon.jsx`, ao lado. Estão
 * separados porque a regra de fast refresh do eslint proíbe um arquivo exportar
 * componente e função ao mesmo tempo.
 * ============================================================
 */

export const CtxPrimitivas = createContext(SEM_PRIMITIVAS);

/** Esta criatura enxerga esta primitiva? */
export function usePrimitiva(id) {
  return useContext(CtxPrimitivas).includes(id);
}
