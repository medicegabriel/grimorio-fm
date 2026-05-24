import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import { FieldLabel, Select, NumberInput } from "../builder-controls";
import { PATAMAR_ND_RANGE, PATAMAR_LABELS, DIFFICULTY_LABELS } from "../fm-tables";

// Dicionários de opções — centralizados aqui
const GRAU_OPTIONS = [
  { value: "4", label: "4º Grau" },
  { value: "3", label: "3º Grau" },
  { value: "2", label: "2º Grau" },
  { value: "1", label: "1º Grau" },
  { value: "especial", label: "Grau Especial" },
];

const SIZE_OPTIONS = [
  { value: "minusculo", label: "Minúsculo" },
  { value: "pequeno", label: "Pequeno" },
  { value: "medio", label: "Médio" },
  { value: "grande", label: "Grande" },
  { value: "enorme", label: "Enorme" },
  { value: "colossal", label: "Colossal" },
];

const ORIGIN_TYPES = [
  { value: "maldicao", label: "Espírito Amaldiçoado" },
  { value: "feiticeiro", label: "Feiticeiro Jujutsu" },
  { value: "usuario_maldicao", label: "Usuário de Maldição" },
  { value: "nao_feiticeiro", label: "Não-Feiticeiro" },
  { value: "restringido", label: "Restrito Celeste" },
  { value: "corpo_amaldicoado", label: "Corpo Amaldiçoado" },
];

const MALDICAO_SUBTYPES = [
  { value: "comum", label: "Comum" },
  { value: "medo", label: "De Medo" },
  { value: "vingativo", label: "Vingativo" },
  { value: "vingativo_imaginario", label: "Vingativo Imaginário" },
  { value: "enfermo", label: "Enfermo" },
];

const RESTRINGIDO_SUBTYPES = [
  { value: "", label: "Restrito Celeste (Restringido)" },
  { value: "corpo_por_energia", label: "Restrição de Corpo por Energia" },
];

// Subtype default ao escolher cada origem (null = sem subtype).
const DEFAULT_SUBTYPE = {
  maldicao: "comum",
};

export default function SectionCore({ draft, derived, actions }) {
  const { core } = draft;
  const ndRange = PATAMAR_ND_RANGE[core.patamar] || { min: 1, max: 20 };

  // Confirmação ao trocar origem perdendo artimanhas (regra do livro).
  const [pendingOrigin, setPendingOrigin] = useState(null);
  const artimanhasCount = (draft.artimanhas || []).length;

  // Recorta ND no range quando o patamar muda
  const handlePatamarChange = (newPatamar) => {
    const newRange = PATAMAR_ND_RANGE[newPatamar];
    const clampedND = Math.max(newRange.min, Math.min(newRange.max, core.nd));
    actions.patchCore({ patamar: newPatamar, nd: clampedND });
  };

  const handleOriginChange = (newType) => {
    const leavingNaoFeit =
      core.origin.type === "nao_feiticeiro" &&
      newType !== "nao_feiticeiro" &&
      artimanhasCount > 0;

    if (leavingNaoFeit) {
      setPendingOrigin(newType);
      return;
    }
    actions.patchOrigin({
      type: newType,
      subtype: DEFAULT_SUBTYPE[newType] ?? null,
    });
  };

  const confirmOriginChange = () => {
    const newType = pendingOrigin;
    setPendingOrigin(null);
    actions.clearArtimanhas();
    actions.patchOrigin({
      type: newType,
      subtype: DEFAULT_SUBTYPE[newType] ?? null,
    });
  };

  const showMaldicaoSubtype = core.origin.type === "maldicao";
  const showRestringidoSubtype = core.origin.type === "restringido";

  const patamarOptions = useMemo(
    () => Object.keys(PATAMAR_LABELS).map((k) => ({ value: k, label: PATAMAR_LABELS[k] })),
    []
  );

  const difficultyOptions = useMemo(
    () => Object.keys(DIFFICULTY_LABELS).map((k) => ({ value: k, label: DIFFICULTY_LABELS[k] })),
    []
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel required>Patamar</FieldLabel>
          <Select value={core.patamar} onChange={handlePatamarChange} options={patamarOptions} />
        </div>

        <div>
          <FieldLabel hint={`${ndRange.min}–${ndRange.max}`} required>
            Nível de Desafio (ND)
          </FieldLabel>
          <NumberInput
            value={core.nd}
            onChange={(v) => actions.patchCore({ nd: Math.max(ndRange.min, Math.min(ndRange.max, v)) })}
            min={ndRange.min}
            max={ndRange.max}
          />
        </div>

        <div>
          <FieldLabel>Grau</FieldLabel>
          <Select
            value={core.grau}
            onChange={(v) => actions.patchCore({ grau: v })}
            options={GRAU_OPTIONS}
          />
        </div>

        <div>
          <FieldLabel hint="Afeta Acerto, Defesa, CD e TR">Dificuldade</FieldLabel>
          <Select
            value={core.difficulty}
            onChange={(v) => actions.patchCore({ difficulty: v })}
            options={difficultyOptions}
          />
        </div>

        <div>
          <FieldLabel hint="Afeta deslocamento e alcance CaC">Tamanho</FieldLabel>
          <Select
            value={core.size}
            onChange={(v) => actions.patchCore({ size: v })}
            options={SIZE_OPTIONS}
          />
        </div>

        <div>
          <FieldLabel hint="Calculado automaticamente">Bônus de Treinamento</FieldLabel>
          <div className="h-9 bg-slate-950/60 border border-slate-800 rounded px-3 flex items-center text-sm font-mono text-purple-300">
            +{derived.bt}
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Origem</FieldLabel>
            <Select
              value={core.origin.type}
              onChange={handleOriginChange}
              options={ORIGIN_TYPES}
            />
          </div>

          {showMaldicaoSubtype && (
            <div>
              <FieldLabel>Tipo de Maldição</FieldLabel>
              <Select
                value={core.origin.subtype}
                onChange={(v) => actions.patchOrigin({ subtype: v })}
                options={MALDICAO_SUBTYPES}
              />
            </div>
          )}

          {showRestringidoSubtype && (
            <div>
              <FieldLabel>Restrição</FieldLabel>
              <Select
                value={core.origin.subtype ?? ""}
                onChange={(v) => actions.patchOrigin({ subtype: v || null })}
                options={RESTRINGIDO_SUBTYPES}
              />
            </div>
          )}
        </div>

        {showMaldicaoSubtype && core.patamar !== "lacaio" && (
          <label className="flex items-center gap-2 mt-3 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={core.origin.hasAumentoEnergia}
              onChange={(e) => actions.patchOrigin({ hasAumentoEnergia: e.target.checked })}
              className="rounded bg-slate-950 border-slate-600 text-purple-600 focus:ring-purple-500"
            />
            Possui Aumento de Energia (+PE igual ao ND)
          </label>
        )}

        {core.origin.type === "corpo_amaldicoado" && (
          <label className="flex items-center gap-2 mt-3 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={!!core.origin.hasEstoqueAdicional}
              onChange={(e) => actions.patchOrigin({ hasEstoqueAdicional: e.target.checked })}
              className="rounded bg-slate-950 border-slate-600 text-purple-600 focus:ring-purple-500"
            />
            Possui Estoque Adicional (+PE igual ao ND)
          </label>
        )}
      </div>

      {/* Modal de confirmação — trocar origem apaga artimanhas */}
      {pendingOrigin && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          onClick={() => setPendingOrigin(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="artim-confirm-title"
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 p-5 pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-full border border-amber-800/60 bg-amber-950/60 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 id="artim-confirm-title" className="text-base font-bold text-white">
                  Trocar de origem?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Esta ficha tem {artimanhasCount} artimanha(s). Ao mudar de origem, todas as artimanhas serão removidas (regra do livro: ao deixar de ser Não-Feiticeiro, perde as artimanhas).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPendingOrigin(null)}
                className="text-slate-500 hover:text-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-slate-600 flex-shrink-0"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 p-4">
              <button
                type="button"
                onClick={() => setPendingOrigin(null)}
                className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                Manter origem
              </button>
              <button
                type="button"
                onClick={confirmOriginChange}
                className="px-4 py-2 rounded bg-amber-700 hover:bg-amber-600 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                Trocar e apagar artimanhas
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
