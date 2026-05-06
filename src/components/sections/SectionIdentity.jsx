import React, { useState, useEffect } from "react";
import { Image as ImageIcon, X, Check } from "lucide-react";
import { FieldLabel, TextInput, TextArea } from "../builder-controls";

export default function SectionIdentity({ draft, actions }) {
  return (
    <div className="space-y-4">
      <div>
        <FieldLabel required>Nome da Criatura</FieldLabel>
        <TextInput
          value={draft.name}
          onChange={actions.setName}
          placeholder="Ex: Maldição da Varíola"
        />
      </div>

      <PortraitField
        value={draft.portraitUrl}
        onChange={actions.setPortrait}
      />

      <div>
        <FieldLabel hint="Visível apenas para o narrador">
          Notas do Narrador
        </FieldLabel>
        <TextArea
          value={draft.narratorNotes}
          onChange={actions.setNotes}
          rows={3}
          placeholder="Descrição narrativa, táticas, hooks de história..."
        />
      </div>
    </div>
  );
}

function PortraitField({ value, onChange }) {
  const [draftUrl, setDraftUrl] = useState(value || "");
  const [imageError, setImageError] = useState(false);

  // Sincroniza rascunho quando o pai carrega uma ficha existente
  useEffect(() => {
    setDraftUrl(value || "");
    setImageError(false);
  }, [value]);

  const handleInsert = () => {
    setImageError(false);
    onChange(draftUrl.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInsert();
    }
  };

  const handleRemove = () => {
    setDraftUrl("");
    setImageError(false);
    onChange("");
  };

  return (
    <div>
      <FieldLabel hint="URL remota ou data URL">
        Retrato da Criatura
      </FieldLabel>

      <div className="flex gap-3">
        {/* Wrapper 80x80 — SEMPRE renderizado para não perturbar o ResizeObserver */}
        <div className="relative flex-shrink-0 w-20 h-20 rounded-md border-2 border-slate-700 overflow-hidden bg-slate-900 flex items-center justify-center">
          {!value || imageError ? (
            <ImageIcon className="w-8 h-8 text-slate-600" />
          ) : (
            <img
              src={value}
              alt="Retrato da criatura"
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              referrerPolicy="no-referrer"
            />
          )}
        </div>

        {/* Controles */}
        <div className="flex-1">
          {/* Input com botão de confirmar embutido */}
          <div className="relative flex-1">
            <TextInput
              value={draftUrl}
              onChange={setDraftUrl}
              onKeyDown={handleKeyDown}
              placeholder="https://exemplo.com/retrato.jpg"
              style={{ paddingRight: "2.25rem" }}
            />
            <button
              type="button"
              onClick={handleInsert}
              title="Carregar imagem"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-purple-400 transition-colors"
            >
              <Check size={16} />
            </button>
          </div>

          {/* Linha inferior: dica à esquerda, Remover à direita */}
          <div className="flex justify-between items-start mt-1">
            <span className="text-xs text-slate-500">
              Pressione Enter ou clique no ícone para carregar
            </span>
            {value && (
              <button
                type="button"
                onClick={handleRemove}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors shrink-0 ml-2"
              >
                <X size={12} /> Remover
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
