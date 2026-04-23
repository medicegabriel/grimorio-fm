import React, { useState, useEffect } from "react";
import { Image as ImageIcon, X, AlertCircle } from "lucide-react";
import { FieldLabel, TextInput, TextArea, SmallButton } from "../builder-controls";

/**
 * SectionIdentity v2 — agora com campo de Portrait URL.
 * Aceita URLs remotas (https://...) e data URLs (data:image/...).
 */

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

/**
 * Campo de retrato com preview inline e tratamento de erro.
 * Estados possíveis (via dicionário, sem if/else complexo):
 *   - empty: sem URL
 *   - loading: URL preenchida, imagem ainda carregando
 *   - ok: imagem carregou
 *   - error: falha ao carregar
 */
function PortraitField({ value, onChange }) {
  const [loadStatus, setLoadStatus] = useState("empty");

  // Reset status sempre que a URL muda
  useEffect(() => {
    setLoadStatus(value ? "loading" : "empty");
  }, [value]);

  // Dicionário de estilos do status — evita ramificações no JSX
  const statusConfig = {
    empty: {
      borderColor: "border-slate-800",
      bgColor: "bg-slate-950/40",
    },
    loading: {
      borderColor: "border-slate-700",
      bgColor: "bg-slate-950/60",
    },
    ok: {
      borderColor: "border-purple-800/60",
      bgColor: "bg-slate-950/80",
    },
    error: {
      borderColor: "border-red-900",
      bgColor: "bg-red-950/20",
    },
  };
  const cfg = statusConfig[loadStatus];

  return (
    <div>
      <FieldLabel hint="URL remota ou data URL">
        Retrato da Criatura
      </FieldLabel>

      <div className="flex gap-3">
        {/* Preview */}
        <div
          className={`relative flex-shrink-0 w-20 h-20 rounded-md border-2 overflow-hidden transition-colors ${cfg.borderColor} ${cfg.bgColor}`}
        >
          {value ? (
            <>
              <img
                src={value}
                alt="Retrato da criatura"
                className="w-full h-full object-cover"
                onLoad={() => setLoadStatus("ok")}
                onError={() => setLoadStatus("error")}
                // garante que a imagem não vaze nem bloqueie (quebra silenciosa)
                referrerPolicy="no-referrer"
              />
              {loadStatus === "error" && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-950/80">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-700">
              <ImageIcon className="w-7 h-7" />
            </div>
          )}
        </div>

        {/* Input + controle */}
        <div className="flex-1 space-y-2">
          <TextInput
            value={value}
            onChange={onChange}
            placeholder="https://exemplo.com/retrato.jpg"
          />
          <div className="flex items-center gap-2">
            {value && (
              <SmallButton onClick={() => onChange("")} variant="danger">
                <X className="w-3 h-3" /> Remover
              </SmallButton>
            )}
            <span
              className={`text-[10px] ${
                loadStatus === "error"
                  ? "text-red-400"
                  : loadStatus === "ok"
                  ? "text-emerald-400"
                  : "text-slate-500"
              }`}
            >
              {loadStatus === "error" && "Falha ao carregar imagem"}
              {loadStatus === "ok" && "Imagem carregada"}
              {loadStatus === "loading" && "Carregando..."}
              {loadStatus === "empty" && "Cole uma URL para ver o preview"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
