import React, { useState, useEffect } from "react";
import {
  Heart, Zap, Shield, Eye, Target, ShieldAlert, Sparkles, Star, GraduationCap, Crosshair, Sword,
} from "lucide-react";
import { PATAMAR_LABELS, getModifier } from "../fm-tables";

const ATTR_PREVIEW = [
  { key: "forca",        label: "FOR", accent: "text-red-400" },
  { key: "destreza",     label: "DES", accent: "text-emerald-400" },
  { key: "constituicao", label: "CON", accent: "text-amber-400" },
  { key: "inteligencia", label: "INT", accent: "text-blue-400" },
  { key: "sabedoria",    label: "SAB", accent: "text-purple-400" },
  { key: "presenca",     label: "PRE", accent: "text-pink-400" },
];

/**
 * LivePreview v2 — Retrato no topo + perícias dominadas no rodapé.
 * Segue o padrão visual dark/fantasia sombria do restante do app.
 */

const PATAMAR_COLORS = {
  lacaio:     "border-slate-600",
  capanga:    "border-zinc-500",
  comum:      "border-sky-600",
  desafio:    "border-amber-600",
  calamidade: "border-rose-600",
};

// Cor do glow atrás do retrato (hex direto — mais portável que classes gradient-radial)
const PATAMAR_GLOW_HEX = {
  lacaio:     "rgba(148, 163, 184, 0.2)",  // slate-400
  capanga:    "rgba(161, 161, 170, 0.2)",  // zinc-400
  comum:      "rgba(14, 165, 233, 0.3)",   // sky-500
  desafio:    "rgba(245, 158, 11, 0.3)",   // amber-500
  calamidade: "rgba(225, 29, 72, 0.4)",    // rose-600
};

export default function LivePreview({ draft, derived }) {
  const { stats, saves, bt, skillDerivations = {} } = derived;
  const accentBorder = PATAMAR_COLORS[draft.core.patamar] || PATAMAR_COLORS.comum;

  // Perícias dominadas ordenadas por mod (exibição inline tipo statblock)
  const masteredSkills = [...draft.skills]
    .filter((s) => s.mastered && s.name?.trim())
    .sort((a, b) => {
      const modA = skillDerivations[a.id]?.finalMod ?? 0;
      const modB = skillDerivations[b.id]?.finalMod ?? 0;
      return modB - modA;
    })
    .map((s) => ({
      id: s.id,
      name: s.name,
      mod: skillDerivations[s.id]?.finalMod ?? 0,
    }));

  return (
    <div className={`bg-slate-900/80 border border-l-4 ${accentBorder} rounded-lg overflow-hidden space-y-3`}>
      {/* ---------- Portrait no topo (se houver) ---------- */}
      <PortraitHeader draft={draft} />

      <div className="px-4 pt-4 pb-4 space-y-3">
        <div className="flex items-center gap-2 -mt-1">
          <Eye className="w-3.5 h-3.5 text-purple-400" />
          <h3 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            Preview em tempo real
          </h3>
        </div>

        {/* Header — sempre visível mesmo sem portrait */}
        {!draft.portraitUrl && (
          <div>
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="text-[9px] font-bold uppercase tracking-wider text-purple-300 bg-purple-950/60 border border-purple-800 rounded px-1.5 py-0.5">
                {PATAMAR_LABELS[draft.core.patamar]}
              </span>
              <span className="text-[10px] text-slate-500">ND {draft.core.nd}</span>
              <span className="text-[10px] text-slate-600">•</span>
              <span className="text-[10px] text-slate-500">BT +{bt}</span>
              <span className="text-[10px] text-slate-600">•</span>
              <span className="text-[10px] font-bold text-purple-300 bg-purple-950/50 border border-purple-800 rounded px-1.5 py-0.5">
                CD {derived.cdBase}
              </span>
            </div>
            <h4 className="font-bold text-white text-base truncate">
              {draft.name || "Sem nome"}
            </h4>
          </div>
        )}

        {/* Vitais */}
        <div className="grid grid-cols-3 gap-1.5">
          <MiniStat icon={Heart}  label="HP"     value={stats.hpMax}  accent="text-rose-400" />
          <MiniStat icon={Zap}    label="PE"     value={stats.peMax}  accent="text-purple-400" />
          <MiniStat icon={Shield} label="Defesa" value={stats.defesa} accent="text-sky-400" />
        </div>

        {/* Secundários */}
        <div className="grid grid-cols-3 gap-1.5">
          <MiniStat icon={Eye}         label="Atenção"  value={stats.atencao}          accent="text-amber-400" />
          <MiniStat icon={Target}      label="Iniciat." value={`+${stats.iniciativa}`} accent="text-emerald-400" />
          <MiniStat icon={ShieldAlert} label="Guarda"   value={stats.guardaInabavalMax} accent="text-sky-300" />
          <MiniStat icon={Crosshair}   label="CD"       value={derived.cdBase}          accent="text-orange-400" />
          <MiniStat icon={Sword}       label="Acerto"   value={`+${derived.acertoPrincipal}`} accent="text-red-400" />
        </div>

        {/* TR */}
        <div>
          <h5 className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold">
            Testes de Resistência
          </h5>
          <div className="grid grid-cols-4 gap-1">
            {["astucia", "fortitude", "reflexos", "vontade"].map((k) => (
              <div key={k} className="bg-slate-950/60 rounded px-1.5 py-1 text-center">
                <div className="text-[9px] text-slate-500 uppercase truncate">{k.slice(0, 3)}</div>
                <div className="text-xs font-mono text-white">+{saves[k]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Atributos Base */}
        <div>
          <h5 className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold">
            Atributos Base
          </h5>
          <div className="grid grid-cols-6 gap-1">
            {ATTR_PREVIEW.map(({ key, label, accent }) => {
              const value = draft.attributes[key] ?? 10;
              const mod = getModifier(value);
              const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
              return (
                <div key={key} className="bg-slate-950/60 border border-slate-800 rounded px-1 py-1.5 flex flex-col items-center justify-center text-center">
                  <span className={`text-[9px] font-bold ${accent}`}>{label}</span>
                  <span className="text-xs font-bold text-white tabular-nums">{value}</span>
                  <span className="text-[9px] text-slate-400">{modStr}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RD e Ignorar RD */}
        {(stats.rdGeral > 0 || stats.ignorarRd > 0) && (
          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800">
            {stats.rdGeral > 0 && (
              <MiniStat icon={Shield} label="RD Geral" value={stats.rdGeral} accent="text-slate-400" />
            )}
            {stats.ignorarRd > 0 && (
              <MiniStat icon={Sparkles} label="Ignorar RD" value={stats.ignorarRd} accent="text-red-400" />
            )}
          </div>
        )}

        {/* Imunidades a Condições */}
        {(draft.defenses?.condicoesImunes ?? []).length > 0 && (
          <div className="pt-2 border-t border-slate-800">
            <p className="text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-amber-400/80 uppercase tracking-widest text-[10px]">Imune a Condições: </span>
              <span className="capitalize">{(draft.defenses.condicoesImunes).join(', ')}.</span>
            </p>
          </div>
        )}

        {/* Perícias de Destaque — estilo statblock inline */}
        {masteredSkills.length > 0 && (
          <div className="pt-2 border-t border-slate-800">
            <h5 className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400" />
              Perícias de Destaque
              <span className="text-amber-500/70">
                • {masteredSkills.length} dominada{masteredSkills.length > 1 ? "s" : ""}
              </span>
            </h5>
            <p className="text-xs text-slate-300 leading-relaxed">
              {masteredSkills.map((sk, i) => (
                <span key={sk.id}>
                  {sk.name}{" "}
                  <span className="text-amber-400 font-medium">
                    {sk.mod >= 0 ? `+${sk.mod}` : sk.mod}
                  </span>
                  {i < masteredSkills.length - 1 ? ", " : "."}
                </span>
              ))}
            </p>
          </div>
        )}

        {/* Resumo compacto — apenas nomes, sem descrições */}
        <CompactList
          label="Aptidões Amaldiçoadas"
          icon={<Sparkles className="w-3 h-3 text-purple-400" />}
          names={(draft.aptidoesEspeciais || []).map((a) => a.nome)}
          accent="text-purple-300"
        />
        <CompactList
          label="Dotes Gerais"
          icon={<Star className="w-3 h-3 text-amber-400" />}
          names={(draft.dotes || []).map((d) => d.nome)}
          accent="text-amber-300"
        />
        <CompactList
          label="Treinamentos"
          icon={<GraduationCap className="w-3 h-3 text-emerald-400" />}
          names={(draft.treinamentos || []).map((t) => t.nome)}
          accent="text-emerald-300"
        />
        <ActionsList actions={draft.actions?.list || []} />
        <CompactList
          label="Características"
          icon={<Sparkles className="w-3 h-3 text-fuchsia-400" />}
          names={(draft.features || []).map((f) => f.name).filter(Boolean)}
          accent="text-fuchsia-300"
        />
      </div>
    </div>
  );
}

// ---------- Header com retrato ----------
/**
 * Quando há portrait URL válida, renderiza um banner com a imagem,
 * glow sutil na cor do patamar e overlay gradient com o nome.
 * Quando não há (ou erro de load), render nulo — o LivePreview cai
 * no header textual padrão.
 */
function PortraitHeader({ draft }) {
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    setStatus(draft.portraitUrl ? "loading" : "idle");
  }, [draft.portraitUrl]);

  // Sem URL ou com erro — não renderiza o banner
  if (!draft.portraitUrl || status === "error") return null;

  const glowColor = PATAMAR_GLOW_HEX[draft.core.patamar] || PATAMAR_GLOW_HEX.comum;

  return (
    <div className="relative">
      {/* Glow radial por trás (CSS inline para garantir compat com Tailwind v4) */}
      <div
        className="absolute inset-0 blur-xl opacity-60 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`,
        }}
      />

      <div className="relative h-40 overflow-hidden">
        {/* Imagem */}
        <img
          src={draft.portraitUrl}
          alt={draft.name || "Retrato"}
          className="w-full h-full object-cover"
          onLoad={() => setStatus("ok")}
          onError={() => setStatus("error")}
          referrerPolicy="no-referrer"
        />

        {/* Gradient overlay para legibilidade do texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

        {/* Texto sobreposto no rodapé */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="text-[9px] font-bold uppercase tracking-wider text-white bg-black/60 backdrop-blur border border-white/20 rounded px-1.5 py-0.5">
              {PATAMAR_LABELS[draft.core.patamar]}
            </span>
            <span className="text-[10px] text-white/80 bg-black/40 backdrop-blur px-1.5 py-0.5 rounded">
              ND {draft.core.nd}
            </span>
          </div>
          <h4 className="font-bold text-white text-base truncate drop-shadow-lg">
            {draft.name || "Sem nome"}
          </h4>
        </div>
      </div>
    </div>
  );
}

function ActionsList({ actions }) {
  const names = actions.map((a) => a.name).filter(Boolean);
  if (!names.length) return null;
  return (
    <div className="pt-2 border-t border-slate-800">
      <h5 className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold flex items-center gap-1">
        <Target className="w-3 h-3 text-rose-400" /> Ações
      </h5>
      <p className="text-xs leading-relaxed text-rose-300">
        {names.join(", ")}.
      </p>
    </div>
  );
}

function CompactList({ label, icon, names, accent }) {
  if (!names.length) return null;
  return (
    <div className="pt-2 border-t border-slate-800">
      <h5 className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold flex items-center gap-1">
        {icon} {label}
      </h5>
      <p className={`text-xs leading-relaxed ${accent}`}>
        {names.join(", ")}.
      </p>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded px-2 py-1.5">
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className={`w-2.5 h-2.5 ${accent}`} />
        <span className="text-[9px] text-slate-500 uppercase truncate">{label}</span>
      </div>
      <div className="text-sm font-bold text-white tabular-nums">{value}</div>
    </div>
  );
}
