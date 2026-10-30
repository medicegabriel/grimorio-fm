/* TÉCNICAS MARCIAIS NO G2 (2026-10-27): o executor. Monta o `AftyFichaG2` REAL com a prop `previaAbasG2` (que o App nunca passa), com as
   fichas sintéticas de `fichas/fichas.json`. Endereço: /?ficha=jogador  ou  /?ficha=criatura  (&modo=classica para a ficha de sempre). */
import React, { StrictMode, Suspense, lazy, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import "../../src/index.css";
import "../../src/systems/afty/afty-derive";
import { aplicarAddons } from "../../src/systems/afty/afty-addons";
const AftyFichaG2 = lazy(() => import("../../src/systems/afty/ficha/AftyFichaG2"));
const AftyFichaClassica = lazy(() => import("../../src/systems/afty/ficha/AftyFichaClassica"));
import dados from "./fichas/fichas.json";

const chaveSessao = (id) => `fm_ficha_sessao_afty_v1:${id}`;
const params = new URLSearchParams(location.search);

function Ficha({ cena }) {
  const [creature, setCreature] = useState(() => dados.fichas[cena]);
  const grava = useCallback((campo) => (valor) => setCreature((c) => ({ ...c, [campo]: valor })), []);
  const modo = params.get("modo");
  const Componente = modo === "classica" ? AftyFichaClassica : AftyFichaG2;
  return (
    <Componente
      creature={creature}
      previaAbasG2={modo !== "classica"}
      onVoltar={() => { location.href = location.pathname; }}
      onEditar={() => window.alert("O criador não faz parte desta prévia.")}
      onSalvarTema={grava("aparencia")}
      onSalvarInvocacoes={grava("invocacoes")}
      onSalvarEspinho={grava("espinho")}
      onSalvarFundamentosPerdidos={grava("fundamentosPerdidos")}
      onSalvarPreferencias={grava("preferenciasFicha")}
      onSalvarPacotesAliados={grava("pacotesAliados")}
      onSalvarRecebidos={grava("pacotesRecebidos")}
    />
  );
}

const cena = params.get("ficha");
if (cena && dados.fichas[cena]) {
  const f = dados.fichas[cena];
  try { if (!localStorage.getItem(chaveSessao(f.id))) localStorage.setItem(chaveSessao(f.id), JSON.stringify(dados.sessoes[f.id])); } catch { /* sem armazenamento */ }
  aplicarAddons(f.addons ?? []);
  document.title = `${f.name} · Técnicas Marciais`;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {cena && dados.fichas[cena] ? <Suspense fallback={null}><Ficha cena={cena} /></Suspense> : <main style={{ color: "#e2e8f0", padding: 24 }}>Use ?ficha=jogador ou ?ficha=criatura</main>}
  </StrictMode>,
);
