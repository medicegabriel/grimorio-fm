import React from "react";
import { useState } from "react";
import { Bookmark, BookmarkCheck, BookOpen, X, Plus } from "lucide-react";
import { SmallButton } from "./builder-controls";
import { useTemplates } from "./useTemplates";
import { buildEntityFromTemplate, templateLabel, templateDescription, entityHasTemplate } from "./fm-templates";

// Botão "Salvar como modelo" (bookmark) reutilizável.
// A bandeirinha fica ativa (verde) sempre que já existe um modelo equivalente
// salvo — não só por alguns instantes. Se já está salvo, clicar é no-op.
export function SaveTemplateButton({ type, entity, title = "Salvar como modelo" }) {
  const { templates, saveTemplate } = useTemplates(type);
  const alreadySaved = entityHasTemplate(type, entity, templates);
  const handle = () => {
    if (alreadySaved) return;
    saveTemplate(entity);
  };
  return (
    <SmallButton onClick={handle} title={alreadySaved ? "Já salvo como modelo" : title}>
      {alreadySaved
        ? <BookmarkCheck className="w-3 h-3 text-emerald-400" />
        : <Bookmark className="w-3 h-3" />}
    </SmallButton>
  );
}

// Painel inline de "Modelos (N)" para usar DENTRO de um form de criação
// (Dotes/Treinos/Aptidões). Não usa posicionamento absoluto — abre logo
// abaixo do botão, então nunca corta a tela. `onPick(tpl)` recebe o MODELO
// cru para preencher os campos do formulário (igual a Ações/Características).
export function TemplateInlinePicker({ type, onPick }) {
  const { templates, removeTemplate } = useTemplates(type);
  const [open, setOpen] = useState(false);
  if (templates.length === 0) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors focus:outline-none ${
          open
            ? "bg-amber-900/40 text-amber-300 border border-amber-800/60"
            : "text-slate-400 hover:text-amber-300 hover:bg-slate-800 border border-transparent"
        }`}
      >
        <BookOpen className="w-3 h-3" />
        Modelos ({templates.length})
      </button>

      {open && (
        <div className="mt-2 bg-slate-950 border border-slate-700 rounded overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              Modelos Salvos
            </span>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-600 hover:text-slate-300">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-44 divide-y divide-slate-800/60">
            {templates.map((tpl) => (
              <div key={tpl.id} className="flex items-start gap-2 px-3 py-2 hover:bg-slate-800/60 group">
                <button
                  type="button"
                  onClick={() => { onPick(tpl); setOpen(false); }}
                  className="flex-1 min-w-0 text-left"
                >
                  <span className="text-sm text-slate-200 truncate block group-hover:text-white">
                    {templateLabel(type, tpl)}
                  </span>
                  {templateDescription(tpl) && (
                    <span className="text-[11px] text-slate-500 line-clamp-2 block">
                      {templateDescription(tpl)}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => removeTemplate(tpl.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                  title="Remover modelo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Botão "Modelos (N)" + painel para aplicar/remover modelos do tipo.
// `onApply` recebe a entidade pronta (buildEntityFromTemplate) para o
// chamador despachar o actions.addX. `disabled` desativa o "Adicionar".
export function TemplatePickerButton({ type, onApply, disabled = false }) {
  const { templates, removeTemplate } = useTemplates(type);
  const [open, setOpen] = useState(false);
  if (templates.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors focus:outline-none ${
          open
            ? "bg-amber-900/40 text-amber-300 border border-amber-800/60"
            : "text-slate-400 hover:text-amber-300 hover:bg-slate-800 border border-transparent"
        }`}
      >
        <BookOpen className="w-3 h-3" />
        Modelos ({templates.length})
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-1 w-72 bg-slate-950 border border-slate-700 rounded shadow-2xl overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              Modelos Salvos
            </span>
            <button type="button" onClick={() => setOpen(false)} className="text-slate-600 hover:text-slate-300">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-56 divide-y divide-slate-800/60">
            {templates.map((tpl) => (
              <div key={tpl.id} className="flex items-start gap-2 px-3 py-2 hover:bg-slate-800/60 group">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-200 truncate">{templateLabel(type, tpl)}</div>
                  {templateDescription(tpl) && (
                    <div className="text-[11px] text-slate-500 line-clamp-2">{templateDescription(tpl)}</div>
                  )}
                </div>
                <SmallButton
                  onClick={() => {
                    if (disabled) return;
                    onApply(buildEntityFromTemplate(type, tpl));
                    setOpen(false);
                  }}
                  variant="primary"
                  disabled={disabled}
                  title={disabled ? "Sem vagas disponíveis" : "Adicionar à ficha"}
                >
                  <Plus className="w-3 h-3" />
                </SmallButton>
                <button
                  type="button"
                  onClick={() => removeTemplate(tpl.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0 mt-1"
                  title="Remover modelo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
