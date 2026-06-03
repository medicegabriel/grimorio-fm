import React from "react";
import { Heart, Zap, Shield, Eye, Target, ShieldAlert, Swords, Activity, Sparkles, RotateCcw, Crosshair, Sword, Flame, Dices } from "lucide-react";
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

const CRIT_DEFAULT = 20;
const SAVE_LABELS = {
  astucia: "Astúcia",
  fortitude: "Fortitude",
  reflexos: "Reflexos",
  vontade: "Vontade",
  integridade: "Integridade",
};

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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 auto-rows-fr">
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
          {/* Confronto de Domínio: derivado puro (1d10 + N), sem override.
              Compartilha o visual dos StatFields mas mostra a fórmula. */}
          <StatReadonly
            label="Conf. Domínio"
            icon={Dices}
            accent="text-rose-400"
            value={derived.confrontoDominio?.formula ?? "—"}
            tooltip={
              derived.confrontoDominio
                ? `½ ND ${derived.confrontoDominio.meiaND} + DOM ${derived.confrontoDominio.dom}` +
                  (derived.confrontoDominio.treinoBonus > 0
                    ? ` + Treino ${derived.confrontoDominio.treinoBonus}`
                    : "")
                : ""
            }
          />
        </div>
      </div>

      {/* Testes de Resistência */}
      <div>
        <h3 className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">
          Testes de Resistência
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 items-stretch">
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

        {/* Margens críticas — aparece apenas quando algum TR/Ataque ≠ 20.
            Reflete os efeitos de treinamentos como Agilidade/Inteligência/
            Resistência/Vontade, e fica preparado pra crítico de ataque vindo
            de poderes futuros. */}
        <CritMarginsRow critMargins={derived.critMargins} />
      </div>

      {/* Seleção de Atributos para Acerto e CD - bloco original abaixo */}
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

// ---------- Stat só-leitura (sem override) ----------
// Mesma silhueta visual de um StatField não-overridden, mas sem o cadeado.
// Usado pra valores derivados que não fazem sentido sobrescrever — ex.:
// Confronto de Domínio, que é uma fórmula (1d10 + N).
function StatReadonly({ label, icon: Icon, accent = "text-slate-300", value, tooltip }) {
  return (
    <div
      className="bg-slate-950/60 border border-slate-800 rounded p-2.5 transition-colors h-full flex flex-col justify-between"
      title={tooltip || undefined}
    >
      <div className="flex items-center gap-1.5 min-w-0 mb-1">
        {Icon && <Icon className={`w-3 h-3 flex-shrink-0 ${accent}`} />}
        <span className="text-[10px] uppercase tracking-wider text-slate-400 truncate">{label}</span>
      </div>
      <div className="text-lg font-bold text-white tabular-nums">{value}</div>
    </div>
  );
}

// ---------- Margens críticas (TR + ataque) ----------
// Mostra apenas saves/ataque cuja margem ≠ 20. Ex.: Treino de Agilidade
// reduz Reflexos para 18 → exibe "Reflexos 18+". Ataque ainda fica em 20
// por default (não há poder que mexa nele no MVP); aparecerá quando
// algum efeito futuro reduzir a margem.
function CritMarginsRow({ critMargins }) {
  if (!critMargins) return null;
  const entries = Object.entries(critMargins).filter(([, v]) => v !== CRIT_DEFAULT);
  if (entries.length === 0) return null;

  return (
    <div className="mt-2 bg-amber-950/20 border border-amber-900/50 rounded p-2">
      <h4 className="text-[10px] uppercase tracking-widest text-amber-400 font-bold mb-1 flex items-center gap-1">
        <Flame className="w-3 h-3" /> Margem de Crítico
      </h4>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {entries.map(([key, value]) => {
          const label = key === "ataque" ? "Ataque" : (SAVE_LABELS[key] || key);
          return (
            <span
              key={key}
              className="text-[10px] text-amber-200 font-mono"
              title={`Crítica automática em ${value} ou mais (padrão: 20)`}
            >
              <span className="text-amber-400/80">{label}:</span> {value}+
            </span>
          );
        })}
      </div>
    </div>
  );
}
