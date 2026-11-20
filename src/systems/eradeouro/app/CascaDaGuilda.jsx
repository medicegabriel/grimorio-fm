/* ============================================================
   A CASCA DA GUILDA NO CELULAR (app Era de Ouro, etapa E8, 2026-11-20)
   ============================================================
   Só em `/EraDeOuro` e só no celular (a `CONSULTA_CELULAR`, que também pega o telefone deitado). A lista, os Encontros, a Sala e
   o Mais ficam numa barra de baixo, e o conteúdo ganha folga embaixo para o último item não ficar coberto (D-83). Fora da casca
   (o computador, as outras rotas) o App mostra o Dashboard de sempre.
   ============================================================ */
import React from "react";
import BarraInferior from "./BarraInferior";
import "./app-guilda.css";

export default function CascaDaGuilda({ aba, onAba, nuvem, children }) {
  return (
    <div className="fm-casca" data-aba={aba}>
      <div className="fm-casca-conteudo">{children}</div>
      <BarraInferior aba={aba} onAba={onAba} nuvem={nuvem} />
    </div>
  );
}
