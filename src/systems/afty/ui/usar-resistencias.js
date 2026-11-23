import { createContext, useContext } from "react";
import { AFTY_RESISTENCIAS } from "../afty-schema";

export const ResistenciasDaFicha = createContext(AFTY_RESISTENCIAS);

export function useOpcoesTR({ incluiIntegridade = true } = {}) {
  return useContext(ResistenciasDaFicha)
    .filter((r) => incluiIntegridade || r.escala !== "fixa")
    .map((r) => ({ value: r.value, label: r.label }));
}
