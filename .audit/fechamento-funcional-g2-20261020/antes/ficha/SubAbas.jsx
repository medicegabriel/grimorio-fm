import React from "react";

/**
 * A tira de sub-abas, com a contagem em cada uma.
 *
 * Nasceu dentro do `GrupoComSubAbas` e saiu de lá em 2026-08-28, quando a aba
 * Buffs precisou da mesma tira: ela divide os estados por Especialização, mas
 * as linhas dela não são `ItemDeFicha`, e o `GrupoComSubAbas` só sabe desenhar
 * aquele. Duas cópias da mesma tira divergiriam na primeira errata de estilo.
 *
 * ⚠ QUEM DECIDE A ATIVA É O PAI. Este componente não guarda estado nenhum: o
 * `GrupoComSubAbas` concerta a escolha dele quando a busca global navega para
 * outra divisão, e a aba Buffs concerta a dela quando o filtro esvazia a
 * divisão aberta. São duas regras diferentes, e nenhuma das duas é de desenho.
 */
export default function SubAbas({ subs, ativa, onAtiva, rotulo }) {
  if (!subs?.length) return null;
  return (
    <div className="afty-subabas" role="tablist" aria-label={rotulo}>
      {subs.map((s) => (
        <button
          key={s.id}
          type="button"
          role="tab"
          aria-selected={s.id === ativa}
          data-afty-subaba={s.id}
          className="afty-subaba"
          onClick={() => onAtiva(s.id)}
        >
          {s.label}
          <span className="afty-subaba-conta">{s.quantos}</span>
        </button>
      ))}
    </div>
  );
}
