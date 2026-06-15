import React, { useState } from "react";
import { Trash2, Copy, Pencil, Swords, Shield, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { SmallButton, Pill } from "../../builder-controls";
import { SaveTemplateButton } from "../../TemplateControls";
import {
  ACTION_TYPE_LABELS,
  normalizeAction,
  deriveFinalPE,
  resolveActionFinalText,
  hasActionTokens,
  tokenizeCreatureName,
} from "../../fm-action-calc";

// ============================================================
// ACTION ITEM (linha read-only + ações)
// ============================================================
// A edição agora abre o ActionForm completo (via onEdit) em vez de um
// editor inline — uma única experiência de edição, igual à criação.
export default function ActionItem({ action, creatureName, onEdit, onRemove, onDuplicate }) {
  const [expanded, setExpanded] = useState(false);
  const norm    = normalizeAction(action);
  const finalPE = deriveFinalPE(norm.cost, norm.condition);
  const desc    = resolveActionFinalText(norm, creatureName);
  const isLong  = !!desc && (desc.length > 160 || desc.includes("\n"));
  // Texto com tokens resolve ao vivo → nunca está "desatualizado".
  const showStale = action.finalTextStale && !hasActionTokens(norm.finalTextManual);
  // Ao salvar como Modelo, o nome da criatura vira {{criatura}} (texto genérico).
  const templateEntity = {
    ...norm,
    finalTextManual: tokenizeCreatureName(norm.finalTextManual, creatureName),
  };

  return (
    <div className="bg-slate-950/40 border border-slate-800 rounded">
      <div className="flex items-center gap-2 p-2">
        {action.attackType === "suporte"
          ? <Shield className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          : <Swords className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
        }
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 text-left text-sm font-semibold text-white hover:text-purple-300 min-w-0"
          title={isLong ? (expanded ? "Recolher" : "Expandir") : undefined}
        >
          <span className="truncate block">{action.name || "Ação sem nome"}</span>
        </button>
        <Pill color="slate">{ACTION_TYPE_LABELS[action.type] || action.type}</Pill>
        {finalPE > 0 && <Pill color="purple">{finalPE} PE</Pill>}
        {showStale && (
          <span
            title="O ND mudou e esta ação tem um Texto Final manual — os números no texto podem estar desatualizados. Edite a ação para revisar."
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-amber-700/60 bg-amber-950/50 text-amber-300 text-[10px] font-semibold uppercase tracking-wide flex-shrink-0"
          >
            <AlertTriangle className="w-3 h-3" /> Texto desatualizado
          </span>
        )}
        <SmallButton onClick={onEdit} variant="primary" title="Editar ação">
          <Pencil className="w-3 h-3" /> Editar
        </SmallButton>
        <SmallButton onClick={onDuplicate} title="Duplicar">
          <Copy className="w-3 h-3" />
        </SmallButton>
        <SaveTemplateButton type="acao" entity={templateEntity} />
        <SmallButton onClick={onRemove} variant="danger" title="Remover">
          <Trash2 className="w-3 h-3" />
        </SmallButton>
      </div>

      <div className="px-3 pb-2">
        <p className={`text-xs text-slate-400 leading-relaxed whitespace-pre-wrap ${expanded ? "" : "line-clamp-3"}`}>
          {desc}
        </p>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors focus:outline-none focus:ring-1 focus:ring-purple-500/40 rounded"
          >
            {expanded
              ? <><ChevronUp className="w-3 h-3" /> Recolher</>
              : <><ChevronDown className="w-3 h-3" /> Ler mais</>
            }
          </button>
        )}
      </div>
    </div>
  );
}
