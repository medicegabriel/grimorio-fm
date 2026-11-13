/* ============================================================
   G2 · FAIXA FINA DO CABEÇALHO NO CELULAR (2026-11-09)
   ============================================================
   No telefone a placa sai de vista ao rolar (o `top` negativo do cabeçalho) e os recursos iam junto. A faixa fina fica logo
   abaixo das abas e da barra de rolagens com o nome e os números de Vida, Energia ou Preparo e Alma, para saber como está a
   ficha sem rolar de volta.

   ⚠ NÃO MEXE NO LEIAUTE. Ela é `position: absolute` abaixo do cabeçalho e cobre uma tira do conteúdo, então aparecer e sumir não
   muda a altura de nada (um cabeçalho que cresce ao rolar empurra o conteúdo e oscila, ver a memória de estado de leiaute). Só o
   que ela MOSTRA depende da rolagem, com histerese: entra depois que a placa saiu por inteiro e só sai quando a placa volta.
   ============================================================ */
import React, { useEffect, useRef, useState } from "react";
import { recursos } from "./pecas-logica";

const ENTRA = 12;
const SAI = -8;

export default function FinaG2({ m }) {
  const raiz = useRef(null);
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const cab = raiz.current?.closest("header");
    if (!cab) return undefined;
    const aoRolar = () => {
      const recolhido = parseFloat(getComputedStyle(cab).getPropertyValue("--afty-cabecalho-recolhido")) || 0;
      const sobra = window.scrollY - recolhido;
      setVisivel((v) => (v ? sobra > SAI : sobra > ENTRA));
    };
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);
  /* OS MESMOS RECURSOS DO CABEÇALHO (revisão de 2026-11-10): eram só os três primeiros, e a ficha com Energia perdia o Preparo, que o
     cabeçalho mostra. Os quatro cabem a 390 px com o nome encurtado, e abaixo de 380 px o nome sai para os números não transbordarem (CSS). */
  const lista = recursos(m).filter((r) => r.tipo !== "pvtemp");
  return (
    <div ref={raiz} className="e-fina" data-visivel={visivel ? "sim" : undefined} data-n={lista.length} aria-hidden={visivel ? undefined : "true"}>
      <span className="e-fina-nome">{m.ficha.name || "Sem nome"}</span>
      {lista.map((r) => (
        <span key={r.tipo} className="e-fina-rec" data-tipo={r.tipo}>
          <small>{r.rotulo}</small><b>{r.atual}</b>
        </span>
      ))}
    </div>
  );
}
