import { useCallback, useState } from "react";

import { rolarPedido252 } from "./rolagem-252";

const LIMITE = 12;

/**
 * O estado das rolagens da criatura da 2.5.2 (2026-11-23): a lista (a mais nova primeiro), o modo do d20 e o `rolar`,
 * que vai como `onRolar` para a ficha. Ver `rolagem-252.js` e `BandejaDeRolagens252.jsx`.
 */
export function useRolagens252() {
  const [rolagens, setRolagens] = useState([]);
  const [modo, setModo] = useState("normal");
  const rolar = useCallback((pedido) => {
    const r = rolarPedido252(pedido, { modo });
    if (r) setRolagens((lista) => [r, ...lista].slice(0, LIMITE));
  }, [modo]);
  const limpar = useCallback(() => setRolagens([]), []);
  return { rolagens, modo, setModo, rolar, limpar };
}
