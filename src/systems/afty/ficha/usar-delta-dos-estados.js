import { useEffect, useState } from "react";
import { deltaDosEstadosEmPassos } from "./ficha-buffs";
import { avancaFatia } from "./fatias";

/**
 * O DELTA DOS ESTADOS DA ABA BUFFS, SEM TRAVAR O CLIQUE.
 * Era um `useMemo` com `deltaDosEstados`, que roda um derive por estado ligado: com catorze ligados numa ficha grande eram mais de cem milissegundos
 * parados depois de cada clique (no `dev`, segundos). Aqui a MESMA conta roda em fatias de uns 30 ms, entre quadros: o clique pinta primeiro, e o resultado
 * chega logo depois. Enquanto a conta nova não termina vale a anterior (e `null` até a primeira, como sempre, para a faixa mostrar "Calculando").
 * `ativo` falso devolve `null` e não calcula nada, como antes.
 */
export function useDeltaDosEstados(ativo, ficha, combate, opcoes, derived) {
  const [resultado, setResultado] = useState(null);
  useEffect(() => {
    if (!ativo) return undefined;
    let vivo = true;
    let timer = null;
    const job = deltaDosEstadosEmPassos(ficha, combate, opcoes, derived);
    const passo = () => {
      if (!vivo) return;
      const r = avancaFatia(job);
      if (r.done) { setResultado(r.value); return; }
      timer = setTimeout(passo, 0);
    };
    timer = setTimeout(passo, 0);
    return () => { vivo = false; clearTimeout(timer); };
  }, [ativo, ficha, combate, opcoes, derived]);
  return ativo ? resultado : null;
}
