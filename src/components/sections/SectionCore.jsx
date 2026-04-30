import React, { useMemo } from "react";
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

export default function SectionCore({ draft, derived, actions }) {
  const { core } = draft;
  const ndRange = PATAMAR_ND_RANGE[core.patamar] || { min: 1, max: 20 };

  // Recorta ND no range quando o patamar muda
  const handlePatamarChange = (newPatamar) => {
    const newRange = PATAMAR_ND_RANGE[newPatamar];
    const clampedND = Math.max(newRange.min, Math.min(newRange.max, core.nd));
    actions.patchCore({ patamar: newPatamar, nd: clampedND });
  };

  const showMaldicaoSubtype = core.origin.type === "maldicao";

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
              onChange={(v) => actions.patchOrigin({ type: v, subtype: v === "maldicao" ? "comum" : null })}
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
      </div>
    </div>
  );
}
