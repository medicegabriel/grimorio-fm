/* PRÉVIA ISOLADA DAS TRÊS ABAS DO G2 (2026-10-21): o executor.
   Monta o `AftyFichaG2` REAL (cabeçalho, Efeitos, compacta, consulta, Histórico, temas e CSS do produto) com a prop `previaAbasG2`, que
   o App nunca passa. Dados: as fichas sintéticas de `fichas/fichas.json`. Origem e porta próprias, então o localStorage é desta prévia.
   Diferenças da casca, declaradas: sem Dashboard, rotas e armazenamento do App. O que a Ficha grava na CRIATURA (tema, preferências,
   pacotes, invocações, Espinho) fica em memória e some ao recarregar. A SESSÃO grava no localStorage desta origem, pela própria Ficha.
   Endereço: /?ficha=arsenal&tema=escuro  (ficha: arsenal, conjurador, mesa, tipica, vazia, criatura; tema: escuro, claro, minamoto, css) */
import React, { StrictMode, Suspense, lazy, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import "../../src/index.css";
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
import cssArcane from "../../themes/arcane-g2.css?raw";
import cssAlter from "../../themes/alter-lucielos.css?raw";
/* A ficha REAL do autor (export de 2026-11-08, Arcane de Player), com o retrato e o CSS que vêm nela. */
import exportReal from "./fichas/arcane-real.json";

const fichas = {
  ...dados.fichas,
  arcane: {
    ...dados.fichas.vazia,
    id: "previa-arcane-g2-nivel-1",
    name: "Arcane",
    portraitUrl: "https://safebooru.org//images/1365/730f474487533331e4753bfdd42c631ffd0bded9.png",
    portraitFocus: { x: 50, y: 25 },
    especializacoes: [{ id: "combatente", nivel: 1 }],
    equipamentos: {
      itens: [{ uid: "arcane-katana-demo", tipo: "arma", refId: "arm_katana", qtd: 1, equipado: true }],
    },
  },
};

/* COMPARATIVO DO REDESENHO (2026-11-07): a MESMA ficha, com um retrato local (sem rede) de proporção vertical, para a clássica e o G2 lado a lado.
   "cmp-simples" é a Arcane de nível 1. "cmp-densa" é o Arsenal com mais perícias treinadas, uma Mestre a mais e nomes longos, para expor a densidade. */
const RETRATO = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fd6dc"/><stop offset="1" stop-color="#1c3a52"/></linearGradient></defs><rect width="600" height="900" fill="url(#a)"/><circle cx="300" cy="300" r="120" fill="#f1d7c4"/><path d="M130 900 C130 560 210 470 300 470 C390 470 470 560 470 900Z" fill="#c9524a"/><path d="M170 300 C170 150 430 150 430 300 C400 230 200 230 170 300Z" fill="#162b3a"/></svg>`,
);
const CMP_DENSAS = { acrobacia: "treinado", enganacao: "treinado", investigacao: "treinado", historia: "treinado", medicina: "treinado", ocultismo: "mestre", persuasao: "treinado", intimidacao: "treinado", sobrevivencia: "treinado" };
fichas.real = exportReal.creatures[0];
fichas["cmp-simples"] = { ...fichas.arcane, id: "previa-cmp-simples", name: "Arcane", portraitUrl: RETRATO, portraitFocus: { x: 50, y: 22 } };
fichas["cmp-densa"] = {
  ...dados.fichas.arsenal, id: "previa-cmp-densa", name: "Arsenal Das Constelações Esquecidas", portraitUrl: RETRATO, portraitFocus: { x: 50, y: 22 },
  pericias: { ...dados.fichas.arsenal.pericias, ...CMP_DENSAS },
};
dados.sessoes["previa-cmp-densa"] = dados.sessoes[dados.fichas.arsenal.id];

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
  arcane: { rotulo: "Arcane G2", aparencia: { presetId: "padrao", css: cssArcane, ligado: true } },
  alter: { rotulo: "Alter Lucielos (CSS do repositório)", aparencia: { presetId: "padrao", css: cssAlter, ligado: true } },
  semcss: { rotulo: "Sem o CSS da ficha (tema padrão)", aparencia: { presetId: "padrao", vars: {}, css: "", ligado: false } },
  css: { rotulo: "CSS Personalizado de Teste", aparencia: { presetId: "padrao", css: CSS_TESTE, ligado: true } },
};
const CENAS = [
  { id: "real", resumo: "A ficha real do autor: Arcane de Player com o retrato e o CSS que vêm no export. O tema \"Escuro (Padrão)\" mantém o CSS dela, \"Sem o CSS da ficha\" mostra o tema padrão." },
  { id: "cmp-simples", resumo: "Comparativo do redesenho: Arcane de nível 1 com retrato local. Use modo=classica para a clássica." },
  { id: "cmp-densa", resumo: "Comparativo do redesenho: Arsenal com doze perícias treinadas, duas Mestre e nomes longos." },
  { id: "arcane", resumo: "Arcane de nível 1, ficha de exemplo para avaliar o CSS do G2." },
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
    try { localStorage.removeItem(chaveSessao(fichas[id].id)); } catch { /* sem armazenamento */ }
    location.reload();
  };
  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: "32px 16px", color: "#e2e8f0", font: "15px/1.5 system-ui, sans-serif" }}>
      <h1 style={{ font: "600 26px system-ui", margin: "0 0 4px" }}>Prévia das Abas do G2</h1>
      <p style={{ margin: "0 0 20px", color: "#94a3b8" }}>Ações, Perícias e Equipamentos. Fichas sintéticas, armazenamento só desta prévia.</p>
      {CENAS.map((c) => (
        <section key={c.id} style={{ padding: "14px 16px", margin: "0 0 10px", border: "1px solid #1e293b", borderRadius: 12, background: "#0f172a" }}>
          <h2 style={{ font: "600 18px system-ui", margin: "0 0 4px" }}>{fichas[c.id].name}</h2>
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
  const base = fichas[cena];
  /* A criatura vive em memória: o que a Ficha grava nela (tema, preferências, pacotes) muda aqui e some ao recarregar. */
  const [creature, setCreature] = useState(() => ({ ...base, ...(TEMAS[tema]?.aparencia ? { aparencia: TEMAS[tema].aparencia } : {}) }));
  const grava = useCallback((campo) => (valor) => setCreature((c) => ({ ...c, [campo]: valor })), []);
  const modo = params.get("modo");
  const Componente = modo === "classica" ? AftyFichaClassica : AftyFichaG2;
  return (
    <Componente
      creature={creature}
      previaAbasG2={modo !== "classica" && modo !== "g2-sem-previa"}
      abaInicial={params.get("aba") || "acoes"}
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
const tema = TEMAS[params.get("tema")] ? params.get("tema") : (cena === "arcane" ? "arcane" : "escuro");
if (cena && fichas[cena]) {
  const f = fichas[cena];
  /* A sessão de partida do cenário só entra quando esta origem ainda não tem uma: recarregar continua de onde parou. */
  try {
    const sessaoInicial = dados.sessoes[f.id];
    if (sessaoInicial && !localStorage.getItem(chaveSessao(f.id))) {
      localStorage.setItem(chaveSessao(f.id), JSON.stringify(sessaoInicial));
    }
  } catch { /* sem armazenamento */ }
  aplicarAddons(f.addons ?? []);
  document.title = `${f.name} · Prévia das Abas`;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {cena && fichas[cena] ? <Suspense fallback={null}><Ficha cena={cena} tema={tema} /></Suspense> : <Inicio />}
    <PdfFab />
  </StrictMode>,
);
