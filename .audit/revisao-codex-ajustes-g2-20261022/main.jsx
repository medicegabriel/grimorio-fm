/* PRÉVIA ISOLADA DAS TRÊS ABAS DO G2 (2026-10-21): o executor.
   Monta o `AftyFichaG2` REAL (cabeçalho, Efeitos, compacta, consulta, Histórico, temas e CSS do produto) com a prop `previaAbasG2`, que
   o App nunca passa. Dados: as fichas sintéticas de `fichas/fichas.json`. Origem e porta próprias, então o localStorage é desta prévia.
   Diferenças da casca, declaradas: sem Dashboard, rotas e armazenamento do App. O que a Ficha grava na CRIATURA (tema, preferências,
   pacotes, invocações, Espinho) fica em memória e some ao recarregar. A SESSÃO grava no localStorage desta origem, pela própria Ficha.
   Endereço: /?ficha=arsenal&tema=escuro  (ficha: arsenal, conjurador, mesa, tipica, vazia, criatura; tema: escuro, claro, minamoto, css) */
import React, { StrictMode, Suspense, lazy, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import "./estilo-revisao.css";
/* ⚠ O MOTOR PRIMEIRO, e o G2 preguiçoso, na mesma ordem do App: importar a Ficha antes do derive avalia afty-combate.js antes do catálogo
   das Posturas (o ciclo de imports anotado em docs/a-fazer.md) e a página cai. */
import "../../src/systems/afty/afty-derive";
import { aplicarAddons } from "../../src/systems/afty/afty-addons";
const AftyFichaG2 = lazy(() => import("../../src/systems/afty/ficha/AftyFichaG2"));
/* Só para a prova de compatibilidade: a clássica e o G2 sem a prop (as abas de sempre), com os mesmos dados. */
const AftyFichaClassica = lazy(() => import("../../src/systems/afty/ficha/AftyFichaClassica"));
import PdfFab from "../../src/components/PdfFab";
import dados from "./fichas/fichas.json";
import cssMinamoto from "../../themes/minamoto-no-flugel.css?raw";

/* Um CSS personalizado de teste que só mira os ganchos públicos (`.afty-card`, `.afty-linha`, `.afty-valor`, `[data-afty-*]`). */
const CSS_TESTE = `
.afty-card { border-color: #e11d48 !important; }
.afty-linha:hover { outline: 1px dashed #f59e0b; }
.afty-valor { color: #22d3ee !important; }
[data-afty-aba="acoes"][aria-selected="true"] { color: #22d3ee !important; }
`;
const TEMAS = {
  escuro: { rotulo: "Escuro (Padrão)", aparencia: null },
  claro: { rotulo: "Claro (Pergaminho)", aparencia: { presetId: "pergaminho" } },
  minamoto: { rotulo: "Minamoto (CSS do repositório)", aparencia: { presetId: "padrao", css: cssMinamoto, ligado: true } },
  css: { rotulo: "CSS Personalizado de Teste", aparencia: { presetId: "padrao", css: CSS_TESTE, ligado: true } },
};
const CENAS = [
  { id: "arsenal", resumo: "Armas com Recarga 1 e Emperrar, Oscilante, Ampla, Modular e Aparar, Golpe Especial, duas Katanas com encantamentos diferentes, inventário sobrecarregado, perícia personalizada e Ofícios, Rápido com habilidade, equipamento e chave sem destino." },
  { id: "conjurador", resumo: "Feitiços de rolagem única, contínuo (duas rolagens), disparos, sem rolagem, curativo, Técnica Máxima com Custo de Vida, Ritual e Liberação Máxima; Expansões, Parede, Cortina e Conflito; quatro curas (Energia Reversa em PER)." },
  { id: "mesa", resumo: "Os nove condicionais juntos (Bloodfeast, Adaptação, Vislumbre, Olhinhos, Agulha, Refletir Imagem, Azamaru, Golpe, Treino) e seis favoritos: o caso S2 de altura." },
  { id: "tipica", resumo: "Quatro condicionais (Vislumbre, Azamaru, Golpe, Treino) e três favoritos: o caso S1 de altura." },
  { id: "vazia", resumo: "Nível 1, só o Ataque Básico, inventário vazio." },
  { id: "criatura", resumo: "Criatura do Afty (ND 14, Desafio) com Katana e Golpe Especial." },
];
const chaveSessao = (id) => `fm_ficha_sessao_afty_v1:${id}`;
const params = new URLSearchParams(location.search);

function Inicio() {
  const reiniciar = (id) => {
    try { localStorage.removeItem(chaveSessao(dados.fichas[id].id)); } catch { /* sem armazenamento */ }
    location.reload();
  };
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "32px 16px", color: "#e2e8f0", font: "15px/1.5 system-ui, sans-serif" }}>
      <h1 style={{ font: "600 26px system-ui", margin: "0 0 4px" }}>Prévia das Abas do G2</h1>
      <p style={{ margin: "0 0 20px", color: "#94a3b8" }}>Ações, Perícias e Equipamentos. Fichas sintéticas, armazenamento só desta prévia.</p>
      {CENAS.map((c) => (
        <section key={c.id} style={{ padding: "14px 16px", margin: "0 0 10px", border: "1px solid #1e293b", borderRadius: 12, background: "#0f172a" }}>
          <h2 style={{ font: "600 18px system-ui", margin: "0 0 4px" }}>{dados.fichas[c.id].name}</h2>
          <p style={{ margin: "0 0 10px", color: "#94a3b8" }}>{c.resumo}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(TEMAS).map(([t, def]) => (
              <a key={t} href={`?ficha=${c.id}&tema=${t}`} style={{ padding: "6px 12px", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", textDecoration: "none" }}>{def.rotulo}</a>
            ))}
            <button type="button" onClick={() => reiniciar(c.id)} style={{ padding: "6px 12px", border: "1px solid #7f1d1d", borderRadius: 8, background: "none", color: "#fca5a5" }}>Reiniciar Sessão</button>
          </div>
        </section>
      ))}
    </main>
  );
}

function Ficha({ cena, tema }) {
  const base = dados.fichas[cena];
  /* A criatura vive em memória: o que a Ficha grava nela (tema, preferências, pacotes) muda aqui e some ao recarregar. */
  const [creature, setCreature] = useState(() => ({ ...base, ...(TEMAS[tema]?.aparencia ? { aparencia: TEMAS[tema].aparencia } : {}) }));
  const grava = useCallback((campo) => (valor) => setCreature((c) => ({ ...c, [campo]: valor })), []);
  const modo = params.get("modo");
  const Componente = modo === "classica" ? AftyFichaClassica : AftyFichaG2;
  return (
    <Componente
      creature={creature}
      previaAbasG2={modo !== "classica" && modo !== "g2-sem-previa"}
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
const tema = TEMAS[params.get("tema")] ? params.get("tema") : "escuro";
if (cena && dados.fichas[cena]) {
  const f = dados.fichas[cena];
  /* A sessão de partida do cenário só entra quando esta origem ainda não tem uma: recarregar continua de onde parou. */
  try { if (!localStorage.getItem(chaveSessao(f.id))) localStorage.setItem(chaveSessao(f.id), JSON.stringify(dados.sessoes[f.id])); } catch { /* sem armazenamento */ }
  aplicarAddons(f.addons ?? []);
  document.title = `${f.name} · Prévia das Abas`;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {cena && dados.fichas[cena] ? <Suspense fallback={null}><Ficha cena={cena} tema={tema} /></Suspense> : <Inicio />}
    <PdfFab />
  </StrictMode>,
);
