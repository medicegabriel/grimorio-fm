import React from "react";
import { Heart, Zap, Shield, Eye, Target, ShieldAlert, Swords, Activity, Sparkles, RotateCcw, Crosshair, Sword } from "lucide-react";
import { StatField, SmallButton, Select } from "../builder-controls";
import { getModifier } from "../fm-tables";

const ATTR_OPTIONS = [
  { value: "forca",        label: "Força" },
  { value: "destreza",     label: "Destreza" },
  { value: "constituicao", label: "Constituição" },
  { value: "inteligencia", label: "Inteligência" },
  { value: "sabedoria",    label: "Sabedoria" },
  { value: "presenca",     label: "Presença" },
];

const ATTR_DEFS = [
  { key: "forca",        label: "FOR", accent: "text-red-400" },
  { key: "destreza",     label: "DES", accent: "text-emerald-400" },
  { key: "constituicao", label: "CON", accent: "text-amber-400" },
  { key: "inteligencia", label: "INT", accent: "text-blue-400" },
  { key: "sabedoria",    label: "SAB", accent: "text-purple-400" },
  { key: "presenca",     label: "PRE", accent: "text-pink-400" },
];

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
  { key: "acerto",            label: "Acerto",          icon: Sword,       accent: "text-red-400" },
  { key: "cdBase",            label: "CD",              icon: Crosshair,   accent: "text-orange-400" },
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

      {/* Atributos Base */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            Atributos Base
          </h3>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {ATTR_DEFS.map(({ key, label, accent }) => {
            const value = draft.attributes[key] ?? 10;
            const mod = getModifier(value);
            const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
            return (
              <div key={key} className="bg-slate-950/60 border border-slate-800 rounded-md p-2 flex flex-col items-center justify-center text-center">
                <span className={`text-[10px] uppercase tracking-wider font-bold ${accent}`}>{label}</span>
                <span className="text-xl font-bold text-white tabular-nums mt-1">{value}</span>
                <span className="text-xs text-slate-400">{modStr}</span>
              </div>
            );
          })}
        </div>
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

      {/* Seleção de Atributos para Acerto e CD */}
      <div className="bg-slate-950/60 border border-slate-800 rounded p-3 space-y-3">
        <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
          Atributo Base do Acerto e CD
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-semibold flex items-center gap-1">
              <Sword className="w-3 h-3 text-red-400" /> Atributo do Acerto
            </label>
            <Select
              value={draft.attackAttr ?? 'forca'}
              onChange={actions.setAttackAttr}
              options={ATTR_OPTIONS}
            />
            <div className="text-[10px] text-slate-500 mt-1">
              Acerto calculado: <span className="font-mono text-white">+{derived.acertoPrincipal}</span>
            </div>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-semibold flex items-center gap-1">
              <Crosshair className="w-3 h-3 text-orange-400" /> Atributo da CD
            </label>
            <Select
              value={draft.cdAttr ?? 'inteligencia'}
              onChange={actions.setCdAttr}
              options={ATTR_OPTIONS}
            />
            <div className="text-[10px] text-slate-500 mt-1">
              CD calculada: <span className="font-mono text-purple-300">{derived.cdBase}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
