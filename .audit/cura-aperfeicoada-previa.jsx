import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "../src/index.css";
import { deriveAfty } from "../src/systems/afty/afty-derive";
import AftyFicha from "../src/systems/afty/ficha/AftyFicha";
import PainelDeCombatente from "../src/systems/afty/encontros/PainelDeCombatente";
import { createBlankAfty } from "../src/systems/afty/afty-schema";
import { aplicarAddons } from "../src/systems/afty/afty-addons";
import { carregarSessao } from "../src/systems/afty/ficha/ficha-sessao";
import vaticano from "../addons/herdado-vaticano.json";

function ficha(sistema, comHabilidade) {
  const c = createBlankAfty();
  Object.assign(c, { id: `qa-cura-aperfeicoada-${sistema}-${comHabilidade}`, name: "Conferência de Cura Aperfeiçoada", rulesVersion: sistema });
  c.core.nd = 8;
  c.core.origem = { id: "herdado", cla: "herdado-vaticano:cla_vaticano" };
  c.attributes.sabedoria = 16;
  c.especializacoes = [{ id: "suporte", nivel: 8 }];
  c.habilidades = comHabilidade ? ["sup_cura_aperfeicoada"] : [];
  c.addons = [vaticano];
  c.talentos = ["herdado-vaticano:tal_cura_perfeita"];
  c.aptidoesAmaldicoadas = ["energia_reversa"];
  c.aptidoes.er = 2;
  return c;
}
function App() {
  const [sistema, setSistema] = useState("player");
  const [encontro, setEncontro] = useState(false);
  const [comHabilidade, setHabilidade] = useState(true);
  const c = ficha(sistema, comHabilidade);
  aplicarAddons(c.addons);
  const d = deriveAfty(c);
  const [sessao, setSessao] = useState(() => carregarSessao(c.id, d));
  const [seed, setSeed] = useState(0);
  const trocar = (fn) => { fn(); setSeed((s) => s + 1); setSessao(carregarSessao("qa-cura-encontro-" + Date.now(), d)); };
  const rng = () => { let n = 0; Math.random = () => ((n++ % 6 < 3 ? 2 : 1) - 0.5) / 12; };
  return <>
    <div style={{ padding: 12, display: "flex", gap: 12, background: "#ddd" }}>
      <button onClick={() => trocar(() => setSistema(sistema === "player" ? "afty" : "player"))}>Trocar sistema ({sistema})</button>
      <button onClick={() => trocar(() => setEncontro(!encontro))}>Trocar tela ({encontro ? "Encontro" : "Ficha"})</button>
      <button onClick={() => trocar(() => setHabilidade(!comHabilidade))}>Habilidade {comHabilidade ? "ligada" : "desligada"}</button>
      <button onClick={rng}>Preparar dados 2 depois 1</button>
    </div>
    {encontro ? <PainelDeCombatente key={seed} combatente={{ id: c.id, nome: c.name, ficha: c, flags: {} }} derived={d} sessao={sessao} onSessao={setSessao} onFlag={() => {}} ativo />
      : <AftyFicha key={seed} creature={c} onVoltar={() => {}} onEditar={() => {}} />}
  </>;
}
createRoot(document.getElementById("root")).render(<App />);
