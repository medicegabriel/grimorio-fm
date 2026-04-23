import React from "react";
import { Heart, Zap, Shield, Eye, Target, ShieldAlert, Swords, Activity, Sparkles, RotateCcw } from "lucide-react";
import { StatField, SmallButton } from "../builder-controls";

/**
 * Exibe todos os valores calculados e permite overrides.
 * Cada StatField é independente: cadeado toggle para editar.
 */

const STAT_DEFINITIONS = [
  { key: "hpMax",             label: "HP Máx.",         icon: Heart,       accent: "text-rose-400" },
  { key: "peMax",             label: "PE Máx.",         icon: Zap,         accent: "text-purple-400" },
  { key: "defesa",            label: "Defesa",          icon: Shield,      accent: "text-sky-400" },
  { key: "atencao",           label: "Atenção",         icon: Eye,         accent: "text-amber-400" },
  { key: "iniciativa",        label: "Iniciativa",      icon: Target,      accent: "text-emerald-400" },
  { key: "deslocamento",      label: "Deslocamento (m)", icon: Activity,   accent: "text-slate-300" },
  { key: "guardaInabavalMax", label: "Guarda Inabal.",  icon: ShieldAlert, accent: "text-sky-300" },
  { key: "rdGeral",           label: "RD Geral",        icon: Shield,      accent: "text-slate-400" },
  { key: "rdIrredutivel",     label: "RD Irredutível",  icon: Shield,      accent: "text-slate-400" },
  { key: "ignorarRd",         label: "Ignorar RD",      icon: Swords,      accent: "text-red-400" },
  { key: "vidaTempPorAtaque", label: "Vida Temp/Ataque", icon: Heart,      accent: "text-rose-300" },
  { key: "resistenciaParcialMax", label: "Resist. Parcial", icon: Sparkles, accent: "text-purple-300" },
  { key: "resistenciaTotalMax",   label: "Resist. Total",   icon: Sparkles, accent: "text-amber-300" },
];

const SAVE_DEFINITIONS = [
  { key: "astucia",     label: "Astúcia" },
  { key: "fortitude",   label: "Fortitude" },
  { key: "reflexos",    label: "Reflexos" },
  { key: "vontade",     label: "Vontade" },
  { key: "integridade", label: "Integridade" },
];

export default function SectionDerivedStats({ draft, derived, actions }) {
  const hasAnyOverride =
    Object.keys(draft.overrides.stats || {}).length > 0 ||
    Object.keys(draft.overrides.saves || {}).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Clique no <span className="text-amber-400">cadeado</span> para editar um valor manualmente.
        </p>
        {hasAnyOverride && (
          <SmallButton onClick={actions.clearOverrides} variant="ghost">
            <RotateCcw className="w-3 h-3" /> Restaurar todos
          </SmallButton>
        )}
      </div>

      {/* Stats principais */}
      <div>
        <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">
          Estatísticas de Combate
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {STAT_DEFINITIONS.map(({ key, label, icon, accent }) => (
            <StatField
              key={key}
              label={label}
              icon={icon}
              accent={accent}
              calculatedValue={derived.calculated[key]}
              overrideValue={draft.overrides.stats?.[key] ?? null}
              onOverride={(v) => actions.setStatOverride(key, v)}
            />
          ))}
        </div>
      </div>

      {/* Testes de Resistência */}
      <div>
        <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">
          Testes de Resistência
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {SAVE_DEFINITIONS.map(({ key, label }) => (
            <StatField
              key={key}
              label={label}
              calculatedValue={derived.saves[key]}
              overrideValue={draft.overrides.saves?.[key] ?? null}
              onOverride={(v) => actions.setSaveOverride(key, v)}
            />
          ))}
        </div>
      </div>

      {/* Referência rápida */}
      <div className="bg-slate-950/60 border border-slate-800 rounded p-3 text-xs text-slate-400 space-y-1">
        <div className="flex justify-between">
          <span>CD Base (melhor mental):</span>
          <span className="font-mono text-purple-300">{derived.cdBase}</span>
        </div>
        <div className="flex justify-between">
          <span>Acerto principal (FOR):</span>
          <span className="font-mono">+{derived.acertoPrincipal.forca}</span>
        </div>
        <div className="flex justify-between">
          <span>Acerto principal (DES):</span>
          <span className="font-mono">+{derived.acertoPrincipal.destreza}</span>
        </div>
      </div>
    </div>
  );
}
