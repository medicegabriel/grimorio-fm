import React, { useState } from "react";
import { Trash2, Copy, Pencil, Swords, Shield, Bookmark, BookmarkCheck, ChevronDown, ChevronUp } from "lucide-react";
import { SmallButton, Pill } from "../../builder-controls";
import {
  ACTION_TYPE_LABELS,
  normalizeAction,
  deriveFinalPE,
  resolveActionFinalText,
} from "../../fm-action-calc";

// ============================================================
// ACTION ITEM (linha read-only + ações)
// ============================================================
// A edição agora abre o ActionForm completo (via onEdit) em vez de um
// editor inline — uma única experiência de edição, igual à criação.
export default function ActionItem({ action, creatureName, onEdit, onRemove, onDuplicate, onSaveTemplate }) {
  const [expanded, setExpanded] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);
  const norm    = normalizeAction(action);
  const finalPE = deriveFinalPE(norm.cost, norm.condition);
  const desc    = resolveActionFinalText(norm, creatureName);
  const isLong  = !!desc && (desc.length > 160 || desc.includes("\n"));

  const handleSaveTemplate = () => {
    onSaveTemplate(norm);
    setTemplateSaved(true);
    setTimeout(() => setTemplateSaved(false), 1500);
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
        <SmallButton onClick={onEdit} variant="primary" title="Editar ação">
          <Pencil className="w-3 h-3" /> Editar
        </SmallButton>
        <SmallButton onClick={onDuplicate} title="Duplicar">
          <Copy className="w-3 h-3" />
        </SmallButton>
        <SmallButton onClick={handleSaveTemplate} title={templateSaved ? "Modelo salvo!" : "Salvar como modelo"}>
          {templateSaved
            ? <BookmarkCheck className="w-3 h-3 text-emerald-400" />
            : <Bookmark className="w-3 h-3" />
          }
        </SmallButton>
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
