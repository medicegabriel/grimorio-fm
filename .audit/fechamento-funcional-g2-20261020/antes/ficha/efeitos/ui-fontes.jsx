/* A lista de fontes de um número, com as MESMAS linhas do painel da Ficha (`LinhasDeFonte`: seção, texto, suplantado, total). Quem a
   abre é o gesto da peça (hover, foco, toque longo), e o contêiner flutuante é o `Flutuante` de `pecas.jsx`. */
import React from "react";
import { LinhasDeFonte } from "../../ui/fontes";

export function ListaDeFontes({ partes, total, titulo }) {
  const lista = (Array.isArray(partes) ? partes : []).filter(Boolean);
  return (
    <div className="afty-fontes-lista">
      {titulo && <div className="afty-fontes-titulo">{titulo}</div>}
      {lista.length === 0 ? <div className="afty-fontes-vazio">Sem Fontes Registradas</div> : <LinhasDeFonte partes={lista} total={total} />}
    </div>
  );
}
