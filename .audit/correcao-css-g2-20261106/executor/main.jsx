/* EXECUTOR DA REVISÃO CLAUDE (2026-11-05): monta o `AftyFichaG2` REAL, com `previaAbasG2`, a clássica ou o G2 sem a prévia.
   Derivado do executor da prévia das três abas (.audit/previa-abas-g2-20261021/main.jsx), com três acréscimos para a auditoria de CSS:
     • ?tema=<nome>        escuro, claro, minamoto, alter, teste-important (o CSS da prévia), teste (o mesmo SEM !important), quebrado
     • ?css=<arquivo>      qualquer CSS de ./temas/<arquivo>.css, injetado como `aparencia.css` (preset padrão)
     • ?preset=<id>        preset do app (padrao, pergaminho, sangue, abissal, terminal)
   e `window.__salvos`, a lista do que a Ficha entregou a `onSalvarTema` (prova de que a gravação é chamada).
   Dados: SÓ as fichas sintéticas de ./fichas/fichas.json. A criatura vive em memória (limitação declarada do executor). */
import React, { StrictMode, Suspense, lazy, useCallback, useState } from "react";
import { createRoot } from "react-dom/client";
import "./app.css";
import { deriveAfty } from "../../../src/systems/afty/afty-derive";
import { createBlankInvocacao } from "../../../src/systems/afty/afty-invocacoes";
import { sessaoEmBranco } from "../../../src/systems/afty/ficha/ficha-sessao";
import PainelDeCombatente from "../../../src/systems/afty/encontros/PainelDeCombatente";
import "../../../src/systems/afty/ficha/ficha.css";
import { aplicarAddons } from "../../../src/systems/afty/afty-addons";
const AftyFichaG2 = lazy(() => import("../../../src/systems/afty/ficha/AftyFichaG2"));
const AftyFichaClassica = lazy(() => import("../../../src/systems/afty/ficha/AftyFichaClassica"));
import dados from "../../previa-abas-g2-20261021/fichas/fichas.json";
import cssMinamoto from "../../../themes/minamoto-no-flugel.css?raw";
import cssAlter from "../../../themes/alter-lucielos.css?raw";

const CSS_ARQUIVOS = import.meta.glob("./temas/*.css", { query: "?raw", import: "default", eager: true });
const ORIGINAIS = { minamoto: cssMinamoto, "alter-lucielos": cssAlter };
const css = (nome) => ORIGINAIS[nome] ?? CSS_ARQUIVOS[`./temas/${nome}.css`] ?? "";

const CSS_TESTE_IMPORTANT = `
.afty-card { border-color: #e11d48 !important; }
.afty-linha:hover { outline: 1px dashed #f59e0b; }
.afty-valor { color: #22d3ee !important; }
[data-afty-aba="acoes"][aria-selected="true"] { color: #22d3ee !important; }
`;
/* O MESMO CSS, SEM !important: é o que o prompt do app manda a pessoa escrever (regra 7). */
const CSS_TESTE = CSS_TESTE_IMPORTANT.replace(/ !important/g, "");
/* CSS que se tranca para fora: esconde o painel de Aparência junto de tudo que usa a caixa de busca. */
const CSS_QUEBRADO = `.afty-busca, .afty-busca-fundo { display: none; } .afty-cabecalho { display: none; } main { visibility: hidden; }`;

const TEMAS = {
  escuro: null,
  claro: { presetId: "pergaminho" },
  minamoto: { presetId: "padrao", css: css("minamoto"), ligado: true },
  alter: { presetId: "padrao", css: css("alter-lucielos"), ligado: true },
  "teste-important": { presetId: "padrao", css: CSS_TESTE_IMPORTANT, ligado: true },
  teste: { presetId: "padrao", css: CSS_TESTE, ligado: true },
  quebrado: { presetId: "padrao", css: CSS_QUEBRADO, ligado: true },
};
const params = new URLSearchParams(location.search);
const cena = params.get("ficha");
window.__salvos = [];

function aparenciaInicial() {
  const nomeCss = params.get("css");
  const preset = params.get("preset");
  if (nomeCss) return { presetId: preset || "padrao", css: css(nomeCss), ligado: true };
  if (preset) return { presetId: preset };
  return TEMAS[params.get("tema")] ?? null;
}

const chaveSessao = (id) => `fm_ficha_sessao_afty_v1:${id}`;

function Ficha() {
  const base = { ...dados.fichas[cena], ...(params.has('inv') ? { invocacoes: [
    { ...createBlankInvocacao(), id: 'css-ave', nome: 'Ave Sintética', aparencia: { presetId: 'pergaminho', css: '.afty-inv-titulo { color: #8b0055 }', ligado: true } },
    { ...createBlankInvocacao(), id: 'css-lobo', nome: 'Lobo Sintético' },
  ] } : {}) };
  const ap = aparenciaInicial();
  const [creature, setCreature] = useState(() => ({ ...base, ...(ap ? { aparencia: ap } : {}) }));
  const grava = useCallback((campo) => (valor) => {
    if (campo === "aparencia") window.__salvos.push({ em: Date.now(), valor: JSON.parse(JSON.stringify(valor)) });
    setCreature((c) => ({ ...c, [campo]: valor }));
  }, []);
  const modo = params.get("modo");
  const [sessao, setSessao] = useState(sessaoEmBranco);
  if (modo === 'encontro') return <div className="afty-ficha"><PainelDeCombatente
    combatente={{id:'sintetico',nome:creature.name,ficha:creature,flags:{}}}
    sessao={sessao} derived={deriveAfty(creature)} onSessao={setSessao} onFlag={()=>{}} ativo
  /></div>;
  const Componente = modo === "classica" ? AftyFichaClassica : AftyFichaG2;
  return (
    <Componente
      creature={creature}
      previaAbasG2={modo !== "classica" && modo !== "g2-sem-previa"}
      onVoltar={() => { location.href = location.pathname; }}
      onEditar={() => window.alert("O criador não faz parte deste executor.")}
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

if (cena && dados.fichas[cena]) {
  const f = dados.fichas[cena];
  try { if (!localStorage.getItem(chaveSessao(f.id))) localStorage.setItem(chaveSessao(f.id), JSON.stringify(dados.sessoes[f.id])); } catch { /* sem armazenamento */ }
  aplicarAddons(f.addons ?? []);
  document.title = `${f.name} · Revisão CSS`;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {cena && dados.fichas[cena]
      ? <Suspense fallback={null}><Ficha /></Suspense>
      : <main style={{ padding: 24, color: "#e2e8f0", font: "15px system-ui" }}>Use ?ficha=mesa|tipica|arsenal|conjurador|vazia|criatura</main>}
  </StrictMode>,
);
