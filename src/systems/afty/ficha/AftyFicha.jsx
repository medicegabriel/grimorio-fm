import React, { Suspense } from "react";
import { telaSobDemanda } from "../../../celular/sob-demanda";

// A Ficha Final G2 é a ficha padrão (2026-11-09). A clássica continua no código e abre
// com `?ficha-g2=0` na rota, como saída de emergência.
// O import dinâmico evita carregar o CSS do G2 quando a clássica é pedida.
// ⚠ A clássica também é sob demanda desde 2026-11-19 (etapa E3 do app de celular): ela ia no pacote de abertura de toda
// rota sem que ninguém a abrisse. As duas usam `telaSobDemanda`, que mostra "Nova Versão" se o pedaço sumiu num deploy.
const AftyFichaG2 = telaSobDemanda(() => import("./AftyFichaG2"));
const AftyFichaClassica = telaSobDemanda(() => import("./AftyFichaClassica"));

export default function AftyFicha(props) {
  const usaClassica = typeof location !== "undefined"
    && new URLSearchParams(location.search).get("ficha-g2") === "0";

  return (
    <Suspense fallback={null}>
      {usaClassica ? <AftyFichaClassica {...props} /> : <AftyFichaG2 {...props} />}
    </Suspense>
  );
}
