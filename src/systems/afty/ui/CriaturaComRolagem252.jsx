import React from "react";

import CombatTracker from "../../../components/CombatTracker";
import BandejaDeRolagens252 from "./BandejaDeRolagens252";
import { useRolagens252 } from "./usar-rolagens-252";

/**
 * A ficha da Criatura do `/` com rolagem (2026-11-23, feedback do lançamento).
 *
 * É a tela `tracker` do `App.jsx`, carregada sob demanda no lugar do `CombatTracker` puro. Ela passa o `onRolar` (a
 * exceção de Forma 1 no `CombatTracker` e no `CombatantPanel`, registrada no AGENTS.md, seção 6) e desenha a bandeja
 * com o resultado. Sem esta casca, a ficha da 2.5.2 segue exatamente como era: nenhum botão de rolar aparece.
 */
export default function CriaturaComRolagem252(props) {
  const { rolagens, modo, setModo, rolar, limpar } = useRolagens252();
  return (
    <>
      <CombatTracker {...props} onRolar={rolar} />
      <BandejaDeRolagens252 rolagens={rolagens} modo={modo} onModo={setModo} onLimpar={limpar} />
    </>
  );
}
