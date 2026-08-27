import React, { useState } from "react";
import { NumeroComFontes } from "./fontes";

/**
 * ============================================================
 * VITAL — a barra de um recurso corrente (PV, PE, Alma)
 * ============================================================
 * Extraído em 2026-08-26, quando o autor mandou o PE Temporário aparecer "na
 * Ficha Final e no Combat Tracker". As duas telas tinham uma CÓPIA cada uma, e
 * elas já haviam divergido: o conserto da casca sobreposta entrou só na da
 * Ficha, e o painel de Encontros ficou com a versão antiga, em que a faixa
 * temporária sumia com a barra cheia.
 *
 * É a mesma história do `fontes.jsx`, extraído em 2026-08-05 pelo mesmo motivo.
 * Duas cópias de um componente de tela divergem na primeira errata, e a errata
 * já tinha acontecido antes de alguém notar.
 *
 * ⚠ A DIFERENÇA entre as duas telas é UMA e ela é deliberada: no painel de
 * Encontros a coluna é estreita e o máximo não abre hover de fontes. Aqui isso é
 * o `partes` opcional, e não um segundo componente.
 * ============================================================
 */

/**
 * `temp` é a CASCA: PV ou PE temporário, gasto antes do recurso normal.
 *
 * ⚠ ELA SOBREPÕE A BARRA, e não fica ao lado. Ao lado ela dividia os 100% do
 * trilho com o recurso, e o caso em que ela mais importa é justamente aquele em
 * que ela SUMIA: com o recurso cheio sobram 0% e a faixa não aparecia. Ganhar
 * casca com o recurso cheio é o normal, não a exceção. Pintar por cima é o que o
 * autor pediu ("usar a mesma barra e ir sobrescrevendo ela com outra cor") e é
 * como a 2.5.2 desenha a dela.
 *
 * ⚠ A COR da casca segue o VITAL. O `--afty-pvtemp` é âmbar, que contrasta com o
 * vermelho do PV, e sobre o azul do PE viraria uma terceira cor sem parentesco.
 */
export function Vital({
  tipo, icone: Icone, rotulo, atual, max,
  temp = 0, rotuloTemp = "PV Temporário",
  partes = null, onSet, onDelta,
}) {
  const [rascunho, setRascunho] = useState(null);
  const teto = Math.max(1, max);
  const pctVida = Math.min(100, (Math.max(0, atual) / teto) * 100);
  const pctTemp = Math.min(100, (Math.max(0, temp) / teto) * 100);
  // Duas faixas, como na 2.5.2: âmbar abaixo da metade e vermelho abaixo de um
  // quarto. ⚠ O PULSO é só do vermelho: metade do PV é comum no meio da luta, e
  // uma barra piscando o tempo todo deixa de ser aviso e vira ruído.
  const pct = max > 0 ? (atual / max) * 100 : 100;
  const nivel = pct <= 25 ? "critico" : pct <= 50 ? "baixo" : "normal";

  // ⚠ Campo VAZIO não vale zero: limpar para redigitar e sair sem terminar
  // zeraria o PV do jogador no meio da luta. Vazio e lixo devolvem o que estava.
  // `+5` e `-3` são delta, e o número seco é valor absoluto.
  const confirma = (texto) => {
    const cru = String(texto).trim();
    setRascunho(null);
    if (!cru) return;
    const n = Math.trunc(Number(cru.replace(",", ".")));
    if (!Number.isFinite(n)) return;
    if (/^[+-]/.test(cru)) onDelta(n); else onSet(n);
  };

  return (
    <div className="afty-vital" data-afty-vital={tipo} data-afty-nivel={nivel}>
      <div className="flex items-center gap-2">
        <Icone className="afty-vital-icone" aria-hidden="true" />
        <span className="afty-vital-rotulo flex-1 min-w-0 truncate">{rotulo}</span>
        <input
          type="text"
          inputMode="numeric"
          className="afty-vital-numero"
          value={rascunho ?? String(atual)}
          onChange={(e) => setRascunho(e.target.value)}
          onBlur={(e) => confirma(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          aria-label={`${rotulo} atual`}
        />
        {partes
          ? (
            <NumeroComFontes
              valor={`/ ${max}`}
              partes={partes}
              total={max}
              formatar={false}
              className="afty-vital-max"
              ancora="direita"
              titulo={`${rotulo} máximo`}
            />
          )
          : <span className="afty-vital-max">/ {max}</span>}
        {temp > 0 && <span className="afty-vital-temp" title={rotuloTemp}>+{temp}</span>}
        <span className="flex items-center gap-0.5 flex-shrink-0">
          <button type="button" className="afty-passo" onClick={() => onDelta(-1)} aria-label={`${rotulo} menos 1`}>−</button>
          <button type="button" className="afty-passo" onClick={() => onDelta(1)} aria-label={`${rotulo} mais 1`}>+</button>
        </span>
      </div>
      <div className="afty-vital-trilho mt-2 flex">
        <span className="afty-vital-barra" style={{ width: `${pctVida}%` }} />
        {pctTemp > 0 && (
          <span
            className="afty-vital-barra afty-vital-casca"
            style={{
              width: `${pctTemp}%`,
              "--afty-vital-cor": tipo === "pe" ? "var(--afty-petemp)" : "var(--afty-pvtemp)",
            }}
          />
        )}
      </div>
    </div>
  );
}
