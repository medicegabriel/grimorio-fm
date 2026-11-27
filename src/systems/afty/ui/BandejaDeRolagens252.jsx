import React from "react";
import { Dices, Trash2 } from "lucide-react";

import { MODOS, textoDaRolagem } from "../ficha/ficha-rolagem";

/**
 * ============================================================
 * A BANDEJA DE ROLAGENS DA CRIATURA DA 2.5.2 (2026-11-23)
 * ============================================================
 * Mostra o que o `onRolar` da ficha da 2.5.2 rolou (ver `rolagem-252.js`). Serve a dois lugares:
 *   flutuante  a ficha da Criatura do `/` (`CombatTracker`), presa no canto de baixo à esquerda, porque o da direita é
 *              do botão dos Livros (`PdfFab`, `z-[120]`). Ela só aparece depois da primeira rolagem.
 *   embutida   o painel da criatura da 2.5.2 no Encontro (`PainelCriatura252`), dentro da seção de Ações.
 *
 * ⚠ AS CORES SÃO `--afty-*` COM RESERVA. No Encontro a bandeja vive dentro do tema da Ficha. Na página da 2.5.2 essas
 * variáveis não existem, e a reserva é a paleta de ardósia e roxo da própria página.
 *
 * O modo (Desvantagem, Normal, Vantagem) é pegajoso, como no `PainelDeRolagens` da Ficha do Afty.
 * ============================================================
 */

/* O estado (a lista, o modo e o `rolar`) mora em `usar-rolagens-252.js`. */

const cor = {
  fundo: "var(--afty-card, rgb(15 23 42 / 0.96))",
  borda: "var(--afty-borda, rgb(88 28 135 / 0.6))",
  texto: "var(--afty-texto, #f1f5f9)",
  suave: "var(--afty-texto-suave, #94a3b8)",
  destaque: "var(--afty-destaque, #c4b5fd)",
  critico: "var(--afty-aviso, #fbbf24)",
  pifia: "var(--afty-pv, #fb7185)",
};

function Marca({ r }) {
  if (r.tipo !== "teste") return null;
  if (r.critico) return <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: cor.critico }}>Crítico</span>;
  if (r.pifia) return <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: cor.pifia }}>Falha Crítica</span>;
  return null;
}

export default function BandejaDeRolagens252({ rolagens, modo, onModo, onLimpar, variante = "flutuante" }) {
  if (variante === "flutuante" && rolagens.length === 0) return null;
  const [ultima, ...antes] = rolagens;
  const flutuante = variante === "flutuante";
  return (
    <aside
      aria-label="Rolagens de dados"
      className={flutuante ? "fixed bottom-4 left-4 z-[110] w-[min(20rem,calc(100vw-6rem))] rounded-lg shadow-2xl" : "rounded-md"}
      style={{ background: cor.fundo, border: `1px solid ${cor.borda}`, color: cor.texto }}
    >
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: ultima ? `1px solid ${cor.borda}` : undefined }}>
        <Dices className="w-4 h-4 flex-shrink-0" style={{ color: cor.destaque }} aria-hidden="true" />
        <span className="text-[11px] font-bold uppercase tracking-widest flex-1" style={{ color: cor.suave }}>Rolagens</span>
        <div className="inline-flex overflow-hidden rounded" role="group" aria-label="Modo do d20" style={{ border: `1px solid ${cor.borda}` }}>
          {MODOS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onModo(m.id)}
              aria-pressed={modo === m.id}
              title={m.label}
              className="px-1.5 py-0.5 text-[10px] font-bold uppercase cursor-pointer"
              style={{ background: modo === m.id ? cor.borda : "transparent", color: modo === m.id ? cor.texto : cor.suave }}
            >
              {m.label.slice(0, 3)}
            </button>
          ))}
        </div>
        {ultima && (
          <button type="button" onClick={onLimpar} className="p-1 rounded cursor-pointer" style={{ color: cor.suave }} title="Limpar as Rolagens" aria-label="Limpar as Rolagens">
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
      {ultima && (
        <div className="px-3 py-2" aria-live="polite">
          <div className="flex items-baseline gap-2">
            <span className="text-[12px] font-semibold truncate flex-1" title={ultima.rotulo}>{ultima.rotulo}</span>
            <Marca r={ultima} />
          </div>
          <div className="flex items-baseline gap-2">
            <b className="text-2xl tabular-nums" style={{ color: cor.destaque }}>{ultima.total}</b>
            <span className="font-mono text-[12px] tabular-nums" style={{ color: cor.suave }}>{textoDaRolagem(ultima)}</span>
            <span className="font-mono text-[11px] ml-auto" style={{ color: cor.suave }}>{ultima.formula}</span>
          </div>
          {ultima.tipo === "dano" && ultima.dados?.length > 1 && (
            <div className="font-mono text-[11px] tabular-nums truncate" style={{ color: cor.suave }} title={ultima.dados.join(", ")}>[{ultima.dados.join(", ")}]</div>
          )}
        </div>
      )}
      {antes.length > 0 && (
        <ul className="m-0! p-0 list-none max-h-40 overflow-y-auto" style={{ borderTop: `1px solid ${cor.borda}` }}>
          {antes.map((r) => (
            <li key={r.id} className="flex items-baseline gap-2 px-3 py-1 text-[11px]">
              <span className="truncate flex-1" style={{ color: cor.suave }} title={r.rotulo}>{r.rotulo}</span>
              <Marca r={r} />
              <b className="tabular-nums">{r.total}</b>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
