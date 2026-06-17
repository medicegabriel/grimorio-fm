import React, { useState } from "react";
import { Trash2, Copy, Pencil, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { SmallButton, Pill } from "../../builder-controls";
import DomainText from "./DomainText";
import { SaveTemplateButton } from "../../TemplateControls";
import { hasModificacaoCompleta } from "../../fm-aptidoes";
import {
  generateDomainText,
  getDomainVersion,
  getDomainVersionLabel,
  getDomainCost,
} from "../../fm-domain-calc";

// ============================================================
// DOMAIN ITEM — card read-only de uma Expansão de Domínio
// ============================================================
// Regenera o texto AO VIVO a partir do DOM/ND/BT atuais da ficha (em vez do
// snapshot `finalText`), então sempre reflete o estado corrente.
export default function DomainItem({ action, draft, derived, onEdit, onRemove, onDuplicate }) {
  const [expanded, setExpanded] = useState(false);
  const dom = Number(draft?.aptidoes?.dom) || 0;
  const bar = Number(draft?.aptidoes?.bar) || 0;
  const nd = Number(draft?.core?.nd) || 0;
  const bt = Number(derived?.bt) || 2;
  const versao = action.versao || getDomainVersion(nd);
  const mcUnlocked = hasModificacaoCompleta(draft?.aptidoesEspeciais);
  const agActive = !!action.acertoGarantido?.ativo;
  const cost = getDomainCost(versao, agActive);
  // Texto manual (congelado) tem prioridade; senão regenera ao vivo.
  const desc = action.finalTextManual?.trim() || generateDomainText(action, { dom, nd, bt, bar, hasMC: mcUnlocked });

  return (
    <div className="bg-slate-950/40 border border-rose-900/40 rounded">
      <div className="flex items-center gap-2 p-2">
        <Sparkles className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 text-left text-sm font-semibold text-white hover:text-rose-300 min-w-0"
          title={expanded ? "Recolher" : "Expandir"}
        >
          <span className="truncate block">{action.name || "Expansão sem nome"}</span>
        </button>
        {versao && <Pill color="rose">{getDomainVersionLabel(versao)}</Pill>}
        <Pill color="slate">Duas Ações Comuns</Pill>
        {cost > 0 && <Pill color="purple">{cost} PE</Pill>}
        <SmallButton onClick={onEdit} variant="primary" title="Editar expansão">
          <Pencil className="w-3 h-3" /> Editar
        </SmallButton>
        <SmallButton onClick={onDuplicate} title="Duplicar">
          <Copy className="w-3 h-3" />
        </SmallButton>
        <SaveTemplateButton type="expansao" entity={action} />
        <SmallButton onClick={onRemove} variant="danger" title="Remover">
          <Trash2 className="w-3 h-3" />
        </SmallButton>
      </div>

      <div className="px-3 pb-2">
        {expanded ? (
          <DomainText text={desc} lore={action.lore} header={false} size="text-xs" />
        ) : (
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
            {action.lore?.trim() || desc.split("\n\n")[0]}
          </p>
        )}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 inline-flex items-center gap-0.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors focus:outline-none rounded"
        >
          {expanded
            ? <><ChevronUp className="w-3 h-3" /> Recolher</>
            : <><ChevronDown className="w-3 h-3" /> Ler mais</>}
        </button>
      </div>
    </div>
  );
}
