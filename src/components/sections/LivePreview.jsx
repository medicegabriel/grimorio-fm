import React, { useState } from "react";
import {
  Heart, Zap, Shield, Eye, Target, ShieldAlert, Sparkles, Star, GraduationCap, Crosshair, Sword, Flame, Shapes, Footprints, Maximize2,
} from "lucide-react";
import { PATAMAR_LABELS, getModifier } from "../fm-tables";
import { getCaracteristicaByKey, isAutomatedCaracteristica } from "../fm-caracteristicas";

// Formata um número com sinal explícito (+N / -N), evitando o "+-1".
const fmtSigned = (n) => (Number(n) >= 0 ? `+${n}` : `${n}`);

// Rótulos PT dos tamanhos (chaves de TAMANHO_INFO em fm-tables).
const TAMANHO_LABELS = {
  minusculo: "Minúsculo",
  pequeno: "Pequeno",
  medio: "Médio",
  grande: "Grande",
  enorme: "Enorme",
  colossal: "Colossal",
};

// Blocos de defesa a dano exibidos no preview (label + cor).
const DEFENSE_PREVIEW = [
  { key: "resistencias", label: "Resistências", accent: "text-sky-300" },
  { key: "imunidades", label: "Imunidades", accent: "text-emerald-300" },
  { key: "vulnerabilidades", label: "Vulnerabilidades", accent: "text-rose-300" },
];

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

const CRIT_DEFAULT = 20;
const SAVE_LABELS_PREVIEW = {
  astucia: "Ast",
  fortitude: "For",
  reflexos: "Ref",
  vontade: "Von",
  integridade: "Int",
  ataque: "Atq",
};

export default function LivePreview({ draft, derived }) {
  const { stats, saves, bt, skillDerivations = {}, critMargins } = derived;
  const accentBorder = PATAMAR_COLORS[draft.core.patamar] || PATAMAR_COLORS.comum;
  const critEntries = critMargins
    ? Object.entries(critMargins).filter(([, v]) => v !== CRIT_DEFAULT)
    : [];

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

        {/* Combate */}
        <div className="grid grid-cols-3 gap-1.5">
          <MiniStat icon={Sword}     label="Acerto"   value={fmtSigned(derived.acertoPrincipal)} accent="text-red-400" />
          <MiniStat icon={Crosshair} label="CD"       value={derived.cdBase}          accent="text-orange-400" />
          <MiniStat icon={Target}    label="Iniciat." value={fmtSigned(stats.iniciativa)} accent="text-emerald-400" />
        </div>

        {/* Sentidos & Movimento */}
        <div className="grid grid-cols-3 gap-1.5">
          <MiniStat icon={Eye}         label="Atenção"  value={stats.atencao}            accent="text-amber-400" />
          <MiniStat icon={ShieldAlert} label="Guarda"   value={stats.guardaInabavalMax}  accent="text-sky-300" />
          <MiniStat icon={Footprints}  label="Desloc."  value={`${stats.deslocamento}m`} accent="text-teal-300" />
        </div>

        {/* Tamanho & Espaço */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <Maximize2 className="w-2.5 h-2.5 text-slate-500" />
          <span className="text-slate-500 uppercase tracking-wider">Tamanho</span>
          <span className="text-slate-300 font-semibold">
            {TAMANHO_LABELS[draft.core.size] || "Médio"}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-500">Espaço {stats.espaco}m</span>
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
          {critEntries.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px]">
              <span className="inline-flex items-center gap-0.5 text-amber-400/80 uppercase tracking-wider font-bold">
                <Flame className="w-2.5 h-2.5" /> Crit
              </span>
              {critEntries.map(([k, v]) => (
                <span key={k} className="text-amber-200 font-mono">
                  <span className="text-amber-400/70">{SAVE_LABELS_PREVIEW[k] || k}</span> {v}+
                </span>
              ))}
            </div>
          )}
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

        {/* Reduções & Resistências (só os que forem > 0) */}
        {(() => {
          const items = [
            { key: "rdGeral",               icon: Shield,      label: "RD Geral",       accent: "text-slate-400" },
            { key: "rdIrredutivel",         icon: Shield,      label: "RD Irredut.",    accent: "text-slate-400" },
            { key: "ignorarRd",             icon: Sword,       label: "Ignorar RD",     accent: "text-red-400" },
            { key: "vidaTempPorAtaque",     icon: Heart,       label: "Vida Tmp/Atq",   accent: "text-rose-300" },
            { key: "resistenciaParcialMax", icon: Sparkles,    label: "Resist. Parc.",  accent: "text-purple-300" },
            { key: "resistenciaTotalMax",   icon: Sparkles,    label: "Resist. Total",  accent: "text-amber-300" },
          ].filter(({ key }) => (stats[key] ?? 0) > 0);
          if (items.length === 0) return null;
          return (
            <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-slate-800">
              {items.map(({ key, icon, label, accent }) => (
                <MiniStat key={key} icon={icon} label={label} value={stats[key]} accent={accent} />
              ))}
            </div>
          );
        })()}

        {/* Defesas a Dano (resistências / imunidades / vulnerabilidades) */}
        {DEFENSE_PREVIEW.some(({ key }) => (draft.defenses?.[key] ?? []).length > 0) && (
          <div className="pt-2 border-t border-slate-800 space-y-0.5">
            {DEFENSE_PREVIEW.map(({ key, label, accent }) => {
              const list = draft.defenses?.[key] ?? [];
              if (list.length === 0) return null;
              return (
                <p key={key} className="text-xs text-slate-300 leading-relaxed">
                  <span className={`font-bold uppercase tracking-widest text-[10px] ${accent}`}>{label}: </span>
                  <span className="capitalize">
                    {list.map((it) => it.tipo).join(", ")}.
                  </span>
                </p>
              );
            })}
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
          label="Características"
          icon={<Shapes className="w-3 h-3 text-cyan-400" />}
          names={(draft.caracteristicas || []).map((c) => {
            const cat = c.key ? getCaracteristicaByKey(c.key) : null;
            return isAutomatedCaracteristica(cat) ? `${c.nome} ⚡` : c.nome;
          })}
          accent="text-cyan-300"
        />
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
          label="Características Personalizadas"
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
  // Guardamos a URL que falhou (em vez de um booleano) pra que o erro fique
  // atrelado àquela URL específica: se o usuário troca a imagem, o banner
  // volta a renderizar sozinho — sem precisar de useEffect pra resetar.
  const [erroredUrl, setErroredUrl] = useState(null);

  // Sem URL ou com erro nesta URL — não renderiza o banner
  if (!draft.portraitUrl || erroredUrl === draft.portraitUrl) return null;

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
          style={{
            objectPosition: `${draft.portraitFocus?.x ?? 50}% ${draft.portraitFocus?.y ?? 50}%`,
          }}
          onError={() => setErroredUrl(draft.portraitUrl)}
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
