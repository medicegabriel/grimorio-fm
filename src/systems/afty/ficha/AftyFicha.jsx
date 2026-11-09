import React, { lazy, Suspense } from "react";
import AftyFichaClassica from "./AftyFichaClassica";

// A Ficha Final G2 é a ficha padrão (2026-11-09). A clássica continua no código e abre
// com `?ficha-g2=0` na rota, como saída de emergência.
// O import dinâmico evita carregar o CSS do G2 quando a clássica é pedida.
const AftyFichaG2 = lazy(() => import("./AftyFichaG2"));

export default function AftyFicha(props) {
  const usaClassica = typeof location !== "undefined"
    && new URLSearchParams(location.search).get("ficha-g2") === "0";

  if (usaClassica) return <AftyFichaClassica {...props} />;

  return (
    <Suspense fallback={null}>
      <AftyFichaG2 {...props} />
    </Suspense>
  );
}
