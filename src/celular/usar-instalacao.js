import { useCallback, useEffect, useState } from "react";
import { gravarConvite, lerConvite, plataformaDe } from "./convite";

/* A página já roda como app instalado (Android, ou a tela inicial do iPhone)? */
export const estaInstalado = () => typeof window !== "undefined" && (
  window.matchMedia?.("(display-mode: standalone)").matches
  || window.navigator?.standalone === true
  || window.__fmInstalado === true
);

/**
 * A instalação do app neste aparelho (etapa E4). O pedido do Chrome é guardado pelo script do `index.html` em
 * `window.__fmPedidoInstalar`, porque ele chega uma vez só, às vezes antes do React montar.
 * Devolve `{ temPedido, instalado, plataforma, instalar }`. `instalar()` abre a janela do Chrome e devolve "accepted",
 * "dismissed" ou null.
 */
export function useInstalacao() {
  const [temPedido, setTemPedido] = useState(() => typeof window !== "undefined" && !!window.__fmPedidoInstalar);
  const [instalado, setInstalado] = useState(estaInstalado);

  useEffect(() => {
    const aoInstalavel = () => setTemPedido(!!window.__fmPedidoInstalar);
    const aoInstalado = () => {
      setInstalado(true);
      setTemPedido(false);
      gravarConvite({ ...lerConvite(), instaladoEm: Date.now() });
    };
    window.addEventListener("fm:instalavel", aoInstalavel);
    window.addEventListener("fm:instalado", aoInstalado);
    return () => {
      window.removeEventListener("fm:instalavel", aoInstalavel);
      window.removeEventListener("fm:instalado", aoInstalado);
    };
  }, []);

  const instalar = useCallback(async () => {
    const pedido = window.__fmPedidoInstalar;
    if (!pedido) return null;
    // O pedido vale uma vez só: depois do prompt o Chrome não o reaproveita.
    window.__fmPedidoInstalar = null;
    setTemPedido(false);
    try {
      await pedido.prompt();
      const escolha = await pedido.userChoice;
      return escolha?.outcome ?? null;
    } catch {
      return null;
    }
  }, []);

  const plataforma = typeof navigator !== "undefined" ? plataformaDe(navigator.userAgent, navigator.maxTouchPoints) : "outro";
  return { temPedido, instalado, plataforma, instalar };
}
