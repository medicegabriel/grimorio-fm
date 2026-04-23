import React from "react";
import { Zap, Lock, Unlock, Info } from "lucide-react";

/**
 * Componentes de input reutilizáveis — padrão visual unificado.
 * Todos são "controlled" e repassam valor via onChange.
 */

// ---------- Label + hint ----------
export const FieldLabel = ({ children, hint, required }) => (
  <label className="block mb-1">
    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </span>
    {hint && <span className="text-[10px] text-slate-500 ml-2 normal-case">{hint}</span>}
  </label>
);

// ---------- Input de texto ----------
export const TextInput = ({ value, onChange, placeholder, ...rest }) => (
  <input
    type="text"
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full h-9 bg-slate-950 border border-slate-700 rounded px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
    {...rest}
  />
);

// ---------- Textarea ----------
export const TextArea = ({ value, onChange, rows = 3, placeholder, ...rest }) => (
  <textarea
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
    rows={rows}
    placeholder={placeholder}
    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-y transition-colors"
    {...rest}
  />
);

// ---------- Número com stepper ----------
export const NumberInput = ({ value, onChange, min, max, step = 1 }) => (
  <div className="flex items-center">
    <button
      onClick={() => onChange(Math.max(min ?? -Infinity, (value ?? 0) - step))}
      className="w-9 h-9 rounded-l bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold focus:outline-none focus:z-10 focus:ring-1 focus:ring-purple-500"
      type="button"
      aria-label="Diminuir"
    >
      −
    </button>
    <input
      type="number"
      value={value ?? ""}
      onChange={(e) => {
        const n = parseInt(e.target.value, 10);
        onChange(Number.isFinite(n) ? n : 0);
      }}
      min={min}
      max={max}
      className="w-full h-9 bg-slate-950 border-y border-slate-700 px-2 text-center text-sm text-white font-mono focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:z-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
    <button
      onClick={() => onChange(Math.min(max ?? Infinity, (value ?? 0) + step))}
      className="w-9 h-9 rounded-r bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold focus:outline-none focus:z-10 focus:ring-1 focus:ring-purple-500"
      type="button"
      aria-label="Aumentar"
    >
      +
    </button>
  </div>
);

// ---------- Select ----------
export const Select = ({ value, onChange, options, placeholder }) => (
  <select
    value={value ?? ""}
    onChange={(e) => onChange(e.target.value)}
    className="w-full h-9 bg-slate-950 border border-slate-700 rounded px-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

// ---------- Stat Field com override ----------
/**
 * Campo para stats calculados que podem ser sobrescritos.
 * Mostra o valor calculado como default; ao clicar no cadeado,
 * permite edição manual. Um indicador visual mostra quando está overridden.
 */
export const StatField = ({
  label, icon: Icon, calculatedValue, overrideValue, onOverride, accent = "text-slate-300",
}) => {
  const isOverridden = overrideValue != null;
  const displayValue = isOverridden ? overrideValue : calculatedValue;

  const toggleOverride = () => {
    if (isOverridden) {
      onOverride(null); // volta ao calculado
    } else {
      onOverride(calculatedValue); // inicia override com valor atual
    }
  };

  return (
    <div className={`bg-slate-950/60 border rounded p-2.5 transition-colors ${
      isOverridden ? "border-amber-700/60 bg-amber-950/10" : "border-slate-800"
    }`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          {Icon && <Icon className={`w-3 h-3 flex-shrink-0 ${accent}`} />}
          <span className="text-[10px] uppercase tracking-wider text-slate-500 truncate">{label}</span>
        </div>
        <button
          onClick={toggleOverride}
          className={`p-0.5 rounded hover:bg-slate-800 transition-colors ${
            isOverridden ? "text-amber-400" : "text-slate-600 hover:text-slate-300"
          }`}
          title={isOverridden ? "Restaurar valor calculado" : "Sobrescrever manualmente"}
          type="button"
        >
          {isOverridden ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
        </button>
      </div>

      {isOverridden ? (
        <input
          type="number"
          value={overrideValue ?? ""}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            onOverride(Number.isFinite(n) ? n : 0);
          }}
          className="w-full bg-transparent border-b border-amber-700 text-lg font-bold text-white tabular-nums focus:outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          autoFocus
        />
      ) : (
        <div className="text-lg font-bold text-white tabular-nums">{displayValue}</div>
      )}

      {isOverridden && (
        <div className="text-[10px] text-amber-500/70 mt-0.5">
          Calc: {calculatedValue}
        </div>
      )}
    </div>
  );
};

// ---------- Badge/Pill ----------
export const Pill = ({ children, color = "slate", onRemove }) => {
  const colors = {
    slate: "bg-slate-800 text-slate-300 border-slate-700",
    purple: "bg-purple-950/60 text-purple-300 border-purple-800",
    rose: "bg-rose-950/60 text-rose-300 border-rose-800",
    emerald: "bg-emerald-950/60 text-emerald-300 border-emerald-800",
    amber: "bg-amber-950/60 text-amber-300 border-amber-800",
    sky: "bg-sky-950/60 text-sky-300 border-sky-800",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs ${colors[color] || colors.slate}`}>
      {children}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 opacity-60 hover:opacity-100" type="button" aria-label="Remover">
          ×
        </button>
      )}
    </span>
  );
};

// ---------- Botão pequeno ----------
export const SmallButton = ({ children, onClick, variant = "default", type = "button", disabled, title }) => {
  const variants = {
    default: "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700",
    primary: "bg-purple-800 hover:bg-purple-700 text-white border-purple-700",
    danger: "bg-red-900/60 hover:bg-red-800 text-red-200 border-red-800",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white border-transparent",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-purple-500 ${variants[variant]}`}
    >
      {children}
    </button>
  );
};
