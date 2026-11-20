import { useEffect, useState } from "react";

/* O COMPÊNDIO DA 2.5.2 SOB DEMANDA (etapa E3, 2026-11-19). As cinco enciclopédias são 4,5 MB de JSON, e iam no pacote de
   abertura de TODA rota, inclusive a Guilda e o /Player no celular, que nunca as mostram (as Criaturas Base são só do `/`).
   Agora só o `/` as baixa, uma vez por página. */

let promessa = null;
let carregado = null;

export function carregarCompendio() {
  if (!promessa) {
    promessa = import("../fm-compendium").then((m) => {
      carregado = m;
      return m;
    });
  }
  return promessa;
}

/** O módulo do compêndio quando `ligado` (a rota `/`), ou `null` enquanto ele não chega e fora dela. */
export function useCompendio(ligado) {
  const [modulo, setModulo] = useState(() => (ligado ? carregado : null));
  useEffect(() => {
    if (!ligado || modulo) return undefined;
    let vivo = true;
    carregarCompendio().then((m) => { if (vivo) setModulo(m); }).catch(() => {});
    return () => { vivo = false; };
  }, [ligado, modulo]);
  return ligado ? modulo : null;
}

/* Cópia do `isBuiltInId` de fm-compendium.js, para quem não baixou o compêndio saber que um id é de lá. O
   asserts/t-app-entradas.mjs confere as duas. */
export const ehIdDoCompendio = (id) => typeof id === "string" && id.startsWith("builtin_");
