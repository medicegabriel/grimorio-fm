import React, { Suspense } from "react";
import { telaSobDemanda } from "../../../celular/sob-demanda";
/* ⚠ O `ficha.css` ENTRA NA ABERTURA, e não com a Ficha sob demanda (2026-11-20). Até a etapa E3 ele vinha pela Clássica, que era
   import direto, e por isso estava sempre ANTES do CSS do Encontro e da Sala. Com as duas Fichas sob demanda ele passou a chegar
   depois do `pecas-encontro.css` na Sala, e `.afty-ficha { min-height: 100dvh; position: relative }` venceu
   `.ec-faixa-raiz { position: sticky; min-height: 0 }`: a faixa da luta do jogador ocupava a tela inteira e deixava de grudar.
   Mesma especificidade, então quem manda é a ordem, e a ordem certa é a de antes. O `t-app-entradas.mjs` confere. */
import "./ficha.css";

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
