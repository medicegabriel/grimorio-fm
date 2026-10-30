/**
 * A posição de leitura (rolagem) das listas da aba Efeitos e de Habilidades, na MEMÓRIA da página. É estado de TELA: nada disto é
 * gravado, e sair do estudo o perde. Cada lista guarda a sua posição por chave (a mesa, a aba e o efeito), e é o que faz Adicionar,
 * Expandir e a consulta voltarem à leitura de onde saíram.
 */
import { useLayoutEffect } from "react";

const ROLAGENS = new Map();
export const mapaDe = (id) => {
  if (!ROLAGENS.has(id)) ROLAGENS.set(id, new Map());
  return ROLAGENS.get(id);
};

/** Guarda e devolve a posição de rolagem de `ref` por `chave`. */
export function useRolagemPorChave(ref, chave, mapa) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    el.scrollTop = mapa.get(chave) ?? 0;
    const guarda = () => mapa.set(chave, el.scrollTop);
    el.addEventListener("scroll", guarda, { passive: true });
    return () => el.removeEventListener("scroll", guarda);
  }, [ref, chave, mapa]);
}
