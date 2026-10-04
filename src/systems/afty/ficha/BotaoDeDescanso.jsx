import React, { useId, useRef, useState } from "react";
import { Moon } from "lucide-react";
import { marionetesParaReparo } from "./ficha-sessao";

/** A escolha de um reparo por dono, na Ficha e nos descansos do Encontro. */
export default function BotaoDeDescanso({ sessao, derived, onDescansar, rotulo = null, combatentes = null }) {
  const dialogo = useRef(null);
  const tituloId = useId();
  const [escolhas, setEscolhas] = useState({});
  const grupos = (combatentes ?? [{ id: "ficha", sessao, derived }])
    .filter((c) => c.sessao && c.derived)
    .map((c) => ({ ...c, marionetes: marionetesParaReparo(c.sessao, c.derived) }))
    .filter((c) => c.marionetes.length > 0);
  const completas = grupos.every((c) => c.marionetes.some((inv) => inv.id === escolhas[c.id]));
  const abrir = () => {
    if (!grupos.length) { onDescansar(combatentes ? {} : null); return; }
    setEscolhas({});
    dialogo.current.showModal();
  };
  const confirmar = (e) => {
    e.preventDefault();
    if (!completas) return;
    dialogo.current.close();
    onDescansar(combatentes ? escolhas : escolhas.ficha);
  };
  return (
    <>
      <button type="button" className="afty-botao" onClick={abrir}
        title="Descanso: devolve os recursos e zera a rodada" aria-label={rotulo || "Descanso"}>
        <Moon className="w-4 h-4" />
        {rotulo}
      </button>
      <dialog ref={dialogo} aria-labelledby={tituloId} className="afty-card p-4"
        style={{ width: "min(28rem, calc(100vw - 2rem))", maxHeight: "calc(100dvh - 2rem)", overflowY: "auto", margin: "auto", color: "var(--afty-texto)" }}>
        <form onSubmit={confirmar} className="space-y-4">
          <h2 id={tituloId} className="afty-card-titulo text-sm! m-0!">Descanso</h2>
          {grupos.map((c, indice) => (
            <label key={c.id} className="block space-y-2">
              <span className="afty-rotulo block">{combatentes ? `Marionete de ${c.nome}` : "Marionete a Reparar"}</span>
              <select value={escolhas[c.id] || ""}
                onChange={(e) => setEscolhas((atual) => ({ ...atual, [c.id]: e.target.value }))}
                className="afty-campo w-full p-2" autoFocus={indice === 0}
                style={{ background: "var(--afty-poco)", border: "1px solid var(--afty-borda)", borderRadius: "var(--afty-raio-peq)" }}>
                <option value="" disabled>Selecionar Marionete</option>
                {c.marionetes.map((inv) => <option key={inv.id} value={inv.id}>{inv.nome || "Marionete Sem Nome"}</option>)}
              </select>
            </label>
          ))}
          <div className="flex justify-end gap-2 flex-wrap">
            <button type="button" className="afty-botao" onClick={() => dialogo.current.close()}>Cancelar</button>
            <button type="submit" className="afty-botao" disabled={!completas}>Descansar</button>
          </div>
        </form>
      </dialog>
    </>
  );
}
