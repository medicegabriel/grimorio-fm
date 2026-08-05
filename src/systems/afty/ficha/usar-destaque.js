import { useEffect, useRef } from "react";

/**
 * Rola até a linha para onde a BUSCA GLOBAL navegou.
 *
 * ⚠ `block: "center"` e não `"start"`: o cabeçalho da Ficha é fixo e ocupa o
 * topo da tela, então alinhar pelo começo esconderia justo a linha procurada
 * atrás dele.
 *
 * Mora num módulo próprio porque três lugares precisam do mesmo gesto (o item
 * de habilidade, a linha de ação e a linha de teste), e um hook não pode ser
 * chamado dentro de um `map`: quem usa isto é sempre um componente de LINHA.
 */
export function useDestaque(destacado) {
  const ref = useRef(null);
  useEffect(() => {
    if (destacado) ref.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [destacado]);
  return ref;
}
