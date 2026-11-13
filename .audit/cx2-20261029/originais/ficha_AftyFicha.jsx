import React, { lazy, Suspense } from "react";
import AftyFichaClassica from "./AftyFichaClassica";

// O rework permanece isolado até concluir a integração e a revisão do autor.
// O import dinâmico também evita carregar o CSS do G2 na ficha de uso diário.
const AftyFichaG2 = lazy(() => import("./AftyFichaG2"));

export default function AftyFicha(props) {
  const previaG2 = typeof location !== "undefined"
    && new URLSearchParams(location.search).get("ficha-g2") === "1";

  if (!previaG2) return <AftyFichaClassica {...props} />;

  return (
    <Suspense fallback={null}>
      <AftyFichaG2 {...props} />
    </Suspense>
  );
}
