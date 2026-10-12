import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "../src/index.css";
import { deriveAfty } from "../src/systems/afty/afty-derive";
import { createBlankAfty } from "../src/systems/afty/afty-schema";
import { aplicarAddons, feiticosDeAddon, normalizarPacote, validarPacote } from "../src/systems/afty/afty-addons";
import { preparaRolagemCura } from "../src/systems/afty/afty-cura";
import { rolarDano } from "../src/systems/afty/ficha/ficha-rolagem";
import { carregarSessao } from "../src/systems/afty/ficha/ficha-sessao";
import AftyFicha from "../src/systems/afty/ficha/AftyFicha";
import PainelDeCombatente from "../src/systems/afty/encontros/PainelDeCombatente";
import PainelDeRolagens from "../src/systems/afty/ficha/PainelDeRolagens";
import pacote from "../addons/cura-aperfeicoada-feiticos.json";

function App() {
  const [sistema, setSistema] = useState("afty");
  const [encontro, setEncontro] = useState(false);
  const [primeiro, setPrimeiro] = useState(true);
  const [segundo, setSegundo] = useState(true);
  const [habilidade, setHabilidade] = useState(true);
  const c = createBlankAfty();
  Object.assign(c, { id: `qa-cura-feiticos-${sistema}-${primeiro}-${segundo}-${habilidade}`, name: "Conferência dos Feitiços de Cura", rulesVersion: sistema, addons: [pacote] });
  c.core.nd = 20;
  c.especializacoes = [{ id: "suporte", nivel: 20 }];
  c.attributes.sabedoria = 16;
  c.habilidades = habilidade ? ["sup_cura_aperfeicoada"] : [];
  c.aptidoesAmaldicoadas = ["energia_reversa", "cura_amplificada"];
  c.aptidoes.er = 3;
  aplicarAddons(c.addons);
  const modelos = feiticosDeAddon(c, 5);
  c.feiticos = modelos.filter((_, i) => i === 0 ? primeiro : segundo);
  const d = deriveAfty(c);
  const [sessao, setSessao] = useState(() => carregarSessao(c.id, d));
  const [seed, setSeed] = useState(0);
  const trocar = (fn) => { fn(); setSeed((n) => n + 1); setSessao(carregarSessao("qa-cura-feiticos-" + Date.now(), d)); };
  let tentativa = 0;
  const teste = rolarDano(preparaRolagemCura({ tipo: "dano", tom: "cura", rotulo: "Teste: 2, 2, 1, 5", dados: 1, faces: 8 }, d.efeitos), () => ([2, 2, 1, 5][tentativa++] - 0.5) / 8);
  const preparar = () => { let n = 0; Math.random = () => ([2, 2, 5][n++ % 3] - 0.5) / 8; };
  return <>
    <div style={{ padding: 12, display: "flex", flexWrap: "wrap", gap: 12, background: "#ddd", color: "#222" }}>
      <button onClick={() => trocar(() => setSistema(sistema === "afty" ? "player" : "afty"))}>Sistema: {sistema}</button>
      <button onClick={() => trocar(() => setEncontro(!encontro))}>Tela: {encontro ? "Encontro" : "Ficha"}</button>
      <button onClick={() => trocar(() => setPrimeiro(!primeiro))}>Feitiço 1: {primeiro ? "ligado" : "desligado"}</button>
      <button onClick={() => trocar(() => setSegundo(!segundo))}>Feitiço 2: {segundo ? "ligado" : "desligado"}</button>
      <button onClick={() => trocar(() => setHabilidade(!habilidade))}>Habilidade: {habilidade ? "ligada" : "desligada"}</button>
      <button onClick={preparar}>Preparar sequência 2, 2, 5</button>
      <span>Validação JSON: {validarPacote(normalizarPacote(pacote)).length === 0 ? "PASSOU" : "FALHOU"}. Modelos: {modelos.length}. Teste determinístico: {teste.total}.</span>
    </div>
    <div style={{ position: "relative", margin: 12 }}><PainelDeRolagens log={[teste]} modo="normal" aberto={false} onModo={() => {}} onAberto={() => {}} onLimpar={() => {}} /></div>
    {encontro ? <PainelDeCombatente key={seed} combatente={{ id: c.id, nome: c.name, ficha: c, flags: {} }} derived={d} sessao={sessao} onSessao={setSessao} onFlag={() => {}} ativo />
      : <AftyFicha key={seed} creature={c} onVoltar={() => {}} onEditar={() => {}} />}
  </>;
}
createRoot(document.getElementById("root")).render(<App />);
