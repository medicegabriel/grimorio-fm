import React, { useMemo } from "react";

import { SEM_PRIMITIVAS } from "../afty-addons";
import { CtxPrimitivas } from "./usar-primitiva";

/** Provedor de `usePrimitiva`. A explicação inteira está em `usar-primitiva.js`. */
export default function PrimitivasDeAddon({ primitivas, children }) {
  /* A lista é recriada a cada `deriveAfty`, e o `SEM_PRIMITIVAS` é congelado e
     compartilhado. Memorizar pelo CONTEÚDO evita que o caso comum (nenhuma
     primitiva) invalide todo consumidor a cada render. */
  const chave = Array.isArray(primitivas) ? primitivas.join(" ") : "";
  const valor = useMemo(() => (chave ? chave.split(" ") : SEM_PRIMITIVAS), [chave]);
  return <CtxPrimitivas.Provider value={valor}>{children}</CtxPrimitivas.Provider>;
}
