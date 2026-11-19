import { useCallback, useSyncExternalStore } from "react";
import { CONSULTA_CELULAR } from "./pwa-config";

const ler = (consulta) => (typeof matchMedia === "function" ? matchMedia(consulta).matches : false);

/**
 * A tela é de celular? Lê a `CONSULTA_CELULAR` (ou outra) pelo `matchMedia` e acompanha
 * o giro da tela e a janela redimensionada. Fora do navegador (asserts) é `false`.
 */
export function useCelular(consulta = CONSULTA_CELULAR) {
  const assinar = useCallback((avisar) => {
    if (typeof matchMedia !== "function") return () => {};
    const mq = matchMedia(consulta);
    mq.addEventListener("change", avisar);
    return () => mq.removeEventListener("change", avisar);
  }, [consulta]);
  return useSyncExternalStore(assinar, () => ler(consulta), () => false);
}
