import React, { useState, useEffect, useRef, useCallback } from "react";
import { Image as ImageIcon, X, Check, RotateCcw } from "lucide-react";
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
        focus={draft.portraitFocus}
        onChange={actions.setPortrait}
        onFocusChange={actions.setPortraitFocus}
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

function PortraitField({ value, focus, onChange, onFocusChange }) {
  const [draftUrl, setDraftUrl] = useState(value || "");
  const [imageError, setImageError] = useState(false);

  const safeFocus = {
    x: Number.isFinite(focus?.x) ? focus.x : 50,
    y: Number.isFinite(focus?.y) ? focus.y : 50,
  };
  const isCentered = safeFocus.x === 50 && safeFocus.y === 50;
  const hasImage = Boolean(value) && !imageError;

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

  const handleResetFocus = () => {
    onFocusChange?.({ x: 50, y: 50 });
  };

  return (
    <div>
      <FieldLabel hint="URL remota ou data URL">
        Retrato da Criatura
      </FieldLabel>

      <div className="flex gap-3">
        {/* Wrapper 80x80 — SEMPRE renderizado para não perturbar o ResizeObserver */}
        <PortraitFocusPicker
          src={hasImage ? value : null}
          focus={safeFocus}
          onFocusChange={onFocusChange}
          onError={() => setImageError(true)}
        />

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

          {/* Linha inferior: dica à esquerda, ações à direita */}
          <div className="flex justify-between items-start mt-1 gap-2">
            <span className="text-xs text-slate-500">
              {hasImage
                ? "Arraste o ponto na miniatura para escolher o foco da imagem"
                : "Pressione Enter ou clique no ícone para carregar"}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {hasImage && !isCentered && (
                <button
                  type="button"
                  onClick={handleResetFocus}
                  title="Recentralizar foco"
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-purple-300 transition-colors"
                >
                  <RotateCcw size={12} /> Centro
                </button>
              )}
              {value && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  <X size={12} /> Remover
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Miniatura 80×80 com ponto focal arrastável ----------
function PortraitFocusPicker({ src, focus, onFocusChange, onError }) {
  const containerRef = useRef(null);
  const draggingRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const updateFromPointer = useCallback(
    (clientX, clientY) => {
      const el = containerRef.current;
      if (!el || !onFocusChange) return;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      onFocusChange({
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      });
    },
    [onFocusChange]
  );

  const handlePointerDown = (e) => {
    if (!src) return;
    e.preventDefault();
    draggingRef.current = true;
    setIsDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e) => {
    if (!draggingRef.current) return;
    updateFromPointer(e.clientX, e.clientY);
  };

  const stopDragging = (e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      // ignora se já foi liberado
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      className={`relative flex-shrink-0 w-20 h-20 rounded-md border-2 border-slate-700 overflow-hidden bg-slate-900 flex items-center justify-center select-none ${
        src ? "cursor-crosshair touch-none" : ""
      }`}
      title={src ? "Arraste para definir o foco da imagem" : undefined}
    >
      {!src ? (
        <ImageIcon className="w-8 h-8 text-slate-600" />
      ) : (
        <>
          <img
            src={src}
            alt="Retrato da criatura"
            className="w-full h-full object-cover pointer-events-none"
            style={{ objectPosition: `${focus.x}% ${focus.y}%` }}
            onError={onError}
            referrerPolicy="no-referrer"
            draggable={false}
          />
          {/* Crosshair: ponto focal */}
          <span
            aria-hidden="true"
            className="absolute w-3 h-3 rounded-full border-2 border-white bg-purple-500 shadow-md pointer-events-none transition-transform"
            style={{
              left: `${focus.x}%`,
              top: `${focus.y}%`,
              transform: `translate(-50%, -50%) scale(${isDragging ? 1.3 : 1})`,
            }}
          />
        </>
      )}
    </div>
  );
}
