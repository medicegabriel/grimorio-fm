/* O DESTAQUE DA BUSCA NAS ABAS DA PRÉVIA (2026-10-21). Rola até a linha para onde a busca global navegou, DE NOVO a cada busca (`seq`),
   mesmo que seja o mesmo item, e o CSS esmaece o realce (`data-afty-alvo`). ⚠ Ao centro, e não ao topo: o cabeçalho grudado cobriria a
   linha. Arquivo próprio porque hook não é componente (Fast Refresh). */
import { useEffect, useRef } from "react";

export function useDestaqueG2(alvo, seq) {
  const ref = useRef(null);
  useEffect(() => {
    if (alvo && seq) ref.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [alvo, seq]);
  return ref;
}
