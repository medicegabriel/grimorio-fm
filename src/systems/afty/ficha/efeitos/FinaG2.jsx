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

/* `onAbrir(tipo)` (etapa E5 do app, 2026-11-19): cada número vira um botão de 44 px que abre a mesma folha do recurso do cabeçalho,
   para dar Dano ou Cura sem rolar de volta até a placa. */
export default function FinaG2({ m, onAbrir = null }) {
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
  /* ⚠ A FAIXA TAMBÉM É `.afty-cabecalho` (autor, 2026-11-19: "Seguir o Cabeçalho"). Ela é o pedaço do cabeçalho que fica à vista ao rolar, e o
     tema pinta o cabeçalho por essa classe. Sem ela, num tema de cabeçalho colorido e página clara, a faixa pintava o fundo da página com o texto
     do cabeçalho, claro sobre claro. `.afty-faixa-fina` é o nome de contrato SÓ dela, como `.afty-placa` é o da placa.
     Pelo mesmo motivo cada recurso leva as classes do recurso da placa (`.afty-vital`, `data-afty-vital`, rótulo e número): o tema que pinta a Vida
     da placa pinta a da faixa, e um número vermelho não fica sobre um cabeçalho azul sem a pastilha que o tema deu a ele. */
  return (
    <div ref={raiz} className="e-fina afty-cabecalho afty-faixa-fina" data-visivel={visivel ? "sim" : undefined} data-n={lista.length} aria-hidden={visivel ? undefined : "true"}>
      <span className="e-fina-nome">{m.ficha.name || "Sem nome"}</span>
      {lista.map((r) => (onAbrir ? (
        <button key={r.tipo} type="button" className="e-fina-rec afty-vital" data-tipo={r.tipo} data-afty-vital={r.tipo} onClick={() => onAbrir(r.tipo)}
          aria-label={`${r.rotulo}: ${r.atual} de ${r.max}. Abrir painel`}>
          <small className="afty-vital-rotulo">{r.rotulo}</small><b className="afty-vital-numero">{r.atual}</b>
        </button>
      ) : (
        <span key={r.tipo} className="e-fina-rec afty-vital" data-tipo={r.tipo} data-afty-vital={r.tipo}>
          <small className="afty-vital-rotulo">{r.rotulo}</small><b className="afty-vital-numero">{r.atual}</b>
        </span>
      )))}
    </div>
  );
}
