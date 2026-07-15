import React, { useState, useMemo } from "react";
import { Save, ChevronLeft, Wand2, Sparkles, FlaskConical } from "lucide-react";

import { FieldLabel, TextInput, Select, NumberInput, StatField } from "../../components/builder-controls";
import {
  createBlankAfty, AFTY_ATTRS, AFTY_TIPOS, AFTY_PATAMARES, AFTY_QNT_PE,
  AFTY_TECNICA_ATTRS, AFTY_TAMANHOS, AFTY_ORIGENS, AFTY_GRAUS_ITEM,
} from "./afty-schema";
import { deriveAfty, mod } from "./afty-derive";

/**
 * ============================================================
 * AftyCreatureBuilder — criador de criatura do Grimório Afty
 * ============================================================
 * Sistema PRÓPRIO (não é a 2.5.2). Mesma casca visual do app,
 * dividido em ABAS. Guarda só escolhas; os stats são derivados
 * por fórmula (deriveAfty), com coeficientes editáveis por ficha
 * na aba Cálculos.
 *
 * Estado desta base:
 *   • Reais: Identidade, Informações, Cálculos
 *   • Stubs: Habilidades, Especializações, Aptidões, Inventário,
 *            Treinamentos (próximos incrementos)
 * ============================================================
 */

const TABS = [
  { id: "identidade",    label: "Identidade" },
  { id: "informacoes",   label: "Informações" },
  { id: "habilidades",   label: "Habilidades" },
  { id: "especializacoes", label: "Especializações" },
  { id: "aptidoes",      label: "Aptidões" },
  { id: "inventario",    label: "Inventário" },
  { id: "treinamentos",  label: "Treinamentos" },
  { id: "calculos",      label: "Cálculos", afty: true },
];

const STUBS = {
  habilidades: "Ações & Características (padrão do jogador). Edição detalhada nos próximos incrementos.",
  especializacoes: "Escolha de Especializações + multiclasse. Habilidades Lendárias e Melhorias Superiores (21+) virão depois.",
  aptidoes: "Níveis de Aptidão e Aptidões Amaldiçoadas.",
  inventario: "Itens, equipar, espaços e consumíveis.",
  treinamentos: "Treinos do Afty (estrutura diferente da 2.5.2).",
};

export default function AftyCreatureBuilder({ existingCreature, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => {
    if (!existingCreature) return createBlankAfty();
    // Merge defensivo: os defaults do Afty preenchem lacunas de fichas
    // antigas/parciais sem descartar o que já existe (id, nome, etc.).
    const blank = createBlankAfty();
    return {
      ...blank,
      ...existingCreature,
      core: { ...blank.core, ...(existingCreature.core || {}) },
      attributes: { ...blank.attributes, ...(existingCreature.attributes || {}) },
      formulaOverrides: { ...(existingCreature.formulaOverrides || {}) },
    };
  });
  const [tab, setTab] = useState("informacoes");

  const derived = useMemo(() => deriveAfty(draft), [draft]);
  const isEditing = !!existingCreature?.id;

  // ---------- patches imutáveis ----------
  const patch = (partial) => setDraft((d) => ({ ...d, ...partial }));
  const patchCore = (partial) => setDraft((d) => ({ ...d, core: { ...d.core, ...partial } }));
  const patchAttr = (key, val) =>
    setDraft((d) => ({ ...d, attributes: { ...d.attributes, [key]: val } }));

  // Aba Cálculos: sobrescreve o VALOR FINAL de um stat (padrão StatField).
  const setStatOverride = (key, val) =>
    setDraft((d) => {
      const next = { ...(d.statOverrides || {}) };
      if (val == null) delete next[key];
      else next[key] = val;
      return { ...d, statOverrides: next };
    });

  const handleSave = () => {
    const creature = {
      ...draft,
      system: "afty",
      rulesVersion: "afty",
      // snapshot dos derivados para telas compartilhadas (dashboard/combate).
      // core.nd já é o campo do Afty — o Dashboard lê core.nd direto.
      stats: {
        hpMax: derived.hp,
        peMax: derived.pe,
        defesa: derived.defesa,
        cd: derived.cd,
      },
      combatState: {
        ...draft.combatState,
        hpCurrent: derived.hp,
        peCurrent: derived.pe,
        almaCurrent: draft.alma?.atual ?? 100,
      },
    };
    onSave(creature);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/30 text-white">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur border-b border-purple-900/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="flex items-center gap-2 min-w-0 order-last basis-full sm:order-none sm:basis-0 sm:flex-1">
            <Wand2 className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">
                {isEditing ? "Editar Criatura" : "Nova Criatura"} · Afty
              </h1>
              <p className="text-xs text-slate-500 truncate">
                {draft.name ? `"${draft.name}"` : "Ficha em branco"}
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-bold transition-colors bg-purple-700 hover:bg-purple-600 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 flex-shrink-0"
          >
            <Save className="w-4 h-4" />
            {isEditing ? "Salvar Alterações" : "Criar Ficha"}
          </button>
        </div>

        {/* Tab strip */}
        <div className="bg-slate-950/40 border-t border-slate-800/70">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto py-2 no-scrollbar" role="tablist" aria-label="Seções">
              {TABS.map((t) => {
                const on = t.id === tab;
                return (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={on}
                    onClick={() => setTab(t.id)}
                    className={`whitespace-nowrap px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                      on ? "bg-purple-700 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    {t.label}
                    {t.afty && (
                      <span className={`text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                        on ? "bg-white/20 text-white" : "bg-purple-500/25 text-purple-300"
                      }`}>Afty</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* ===== GRID ===== */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* preview: no topo no mobile, à direita no desktop */}
        <aside className="order-first lg:order-last lg:col-span-1">
          <div className="lg:sticky lg:top-[104px]">
            <AftyPreview draft={draft} derived={derived} />
          </div>
        </aside>

        {/* formulário (aba ativa) */}
        <div className="lg:col-span-2 space-y-4">
          {tab === "identidade" && <TabIdentidade draft={draft} patch={patch} patchCore={patchCore} />}
          {tab === "informacoes" && <TabInformacoes draft={draft} derived={derived} patch={patch} patchCore={patchCore} patchAttr={patchAttr} />}
          {tab === "calculos" && <TabCalculos derived={derived} setStatOverride={setStatOverride} />}
          {STUBS[tab] && <StubCard title={TABS.find((t) => t.id === tab)?.label} text={STUBS[tab]} />}
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* Cartão / cabeçalho de seção — mesmo visual do builder 2.5.2  */
/* ============================================================ */
function Card({ title, children }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function StubCard({ title, text }) {
  return (
    <Card title={title}>
      <div className="text-center py-8 border border-dashed border-slate-700 rounded-lg text-sm text-slate-400">
        {text}
        <div className="mt-2 inline-block text-[10px] font-bold uppercase tracking-wide text-amber-400 border border-amber-800/60 rounded px-2 py-0.5">
          próximo incremento
        </div>
      </div>
    </Card>
  );
}

/* ============================================================ */
/* Aba: Identidade                                              */
/* ============================================================ */
function TabIdentidade({ draft, patch, patchCore }) {
  return (
    <Card title="Identidade">
      <div>
        <FieldLabel required>Nome</FieldLabel>
        <TextInput value={draft.name} onChange={(v) => patch({ name: v })} placeholder="Nome da criatura" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div>
          <FieldLabel hint="afeta deslocamento e alcance">Tamanho</FieldLabel>
          <Select value={draft.core.tamanho} onChange={(v) => patchCore({ tamanho: v })} options={AFTY_TAMANHOS} />
        </div>
        <div>
          <FieldLabel>Origem</FieldLabel>
          <Select
            value={draft.core.origem?.type}
            onChange={(v) => patchCore({ origem: { ...draft.core.origem, type: v } })}
            options={AFTY_ORIGENS}
          />
        </div>
      </div>
      <div className="mt-4">
        <FieldLabel hint="URL da imagem (opcional)">Retrato</FieldLabel>
        <TextInput value={draft.portraitUrl} onChange={(v) => patch({ portraitUrl: v })} placeholder="https://..." />
      </div>
    </Card>
  );
}

/* ============================================================ */
/* Aba: Informações (nível, tipo, atributos)                   */
/* ============================================================ */
function TabInformacoes({ draft, derived, patch, patchCore, patchAttr }) {
  return (
    <>
      <Card title="Valores Básicos">
        <p className="text-xs text-slate-400 mb-4">
          <span className="text-slate-200 font-semibold">Tipo</span> dirige os coeficientes;{" "}
          <span className="text-slate-200 font-semibold">Patamar</span> multiplica HP e escala Resistência/Atributos.
          ND sem teto (1 → ∞).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel hint="Nível de Desafio · 1 → ∞" required>Nível (ND)</FieldLabel>
            <NumberInput value={draft.core.nd} onChange={(v) => patchCore({ nd: v })} min={1} />
          </div>
          <div>
            <FieldLabel hint="dirige os coeficientes" required>Tipo</FieldLabel>
            <Select value={draft.core.tipo} onChange={(v) => patchCore({ tipo: v })} options={AFTY_TIPOS} />
          </div>
          <div>
            <FieldLabel required>Patamar</FieldLabel>
            <Select value={draft.core.patamar} onChange={(v) => patchCore({ patamar: v })} options={AFTY_PATAMARES} />
          </div>
          <div>
            <FieldLabel hint="Muito Pouca … Muito Grande">Quantidade de PE</FieldLabel>
            <Select value={draft.qntPE} onChange={(v) => patch({ qntPE: v })} options={AFTY_QNT_PE} />
          </div>
          <div>
            <FieldLabel hint="multiplica o HP (100 = normal)">Integridade da Alma</FieldLabel>
            <NumberInput value={draft.alma.atual} onChange={(v) => patch({ alma: { ...draft.alma, atual: v } })} min={0} />
          </div>
          <div>
            <FieldLabel hint="atributo de CD / RD específico">Atributo da Técnica</FieldLabel>
            <Select value={draft.core.tecnicaAttr} onChange={(v) => patchCore({ tecnicaAttr: v })} options={AFTY_TECNICA_ATTRS} />
          </div>
          <div>
            <FieldLabel hint="calculado (= Treinamento)">Maestria</FieldLabel>
            <div className="h-9 bg-slate-950/60 border border-slate-800 rounded px-3 flex items-center text-sm font-mono text-purple-300">
              +{derived.maestria}
            </div>
          </div>
        </div>

        {/* orçamentos derivados */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Pontos de Atributo</div>
            <div className="text-lg font-mono font-bold text-white">{derived.totalAtributos}</div>
          </div>
          <div className="bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Níveis de Aptidão</div>
            <div className="text-lg font-mono font-bold text-white">{derived.totalAptidao}</div>
          </div>
        </div>
      </Card>

      <Card title="Atributos">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AFTY_ATTRS.map((a) => {
            const val = draft.attributes[a.key];
            const m = mod(val);
            const isTecnica = draft.core.tecnicaAttr === a.key;
            return (
              <div key={a.key} className={`bg-slate-950/50 border rounded-lg p-2.5 ${isTecnica ? "border-purple-700/60" : "border-slate-800"}`}>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400">
                    <span className="text-white font-bold">{a.abbr}</span> {a.label}
                    {isTecnica && <span className="ml-1.5 text-[9px] text-purple-300 normal-case">técnica</span>}
                  </span>
                  <span className="text-xs font-mono text-purple-300">{m >= 0 ? `+${m}` : m}</span>
                </div>
                <NumberInput value={val} onChange={(v) => patchAttr(a.key, v)} min={1} aria-label={a.label} />
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Grau de Item Equipado">
        <p className="text-xs text-slate-400 mb-3">
          Temporário — virá da aba Inventário. O grau entra em Defesa e RD.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel hint="bônus de Defesa">Grau (Defesa)</FieldLabel>
            <Select value={draft.inventario.defesaGrau} onChange={(v) => patch({ inventario: { ...draft.inventario, defesaGrau: v } })} options={AFTY_GRAUS_ITEM} />
          </div>
          <div>
            <FieldLabel hint="bônus de RD">Grau (RD)</FieldLabel>
            <Select value={draft.inventario.rdGrau} onChange={(v) => patch({ inventario: { ...draft.inventario, rdGrau: v } })} options={AFTY_GRAUS_ITEM} />
          </div>
        </div>
      </Card>
    </>
  );
}

/* ============================================================ */
/* Aba: Cálculos (fórmulas editáveis — a superpotência Afty)   */
/* ============================================================ */
const CALC_ROWS = [
  { key: "hp",           label: "Pontos de Vida" },
  { key: "pe",           label: "Energia (PE)" },
  { key: "defesa",       label: "Defesa / CA" },
  { key: "cd",           label: "CD" },
  { key: "rdGeral",      label: "RD Geral" },
  { key: "rdEspecifico", label: "RD Específico" },
  { key: "movimento",    label: "Movimento (m)" },
  { key: "resParcial",   label: "Resistência Parcial" },
  { key: "atencao",      label: "Atenção" },
];

function TabCalculos({ derived, setStatOverride }) {
  return (
    <Card title="Cálculos">
      <div className="flex gap-2.5 bg-purple-950/30 border border-purple-800 rounded-lg p-3 mb-4 text-xs text-purple-200">
        <FlaskConical className="w-4 h-4 flex-shrink-0 text-purple-400 mt-0.5" />
        <span>
          Valores calculados pelas fórmulas do Afty. Clique no cadeado para sobrescrever manualmente
          qualquer um. <span className="text-purple-300/70">Edição por fórmula (coeficientes) vem depois.</span>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {CALC_ROWS.map((row) => (
          <StatField
            key={row.key}
            label={row.label}
            calculatedValue={derived.calc[row.key]}
            overrideValue={derived.isOverridden(row.key) ? derived[row.key] : null}
            onOverride={(v) => setStatOverride(row.key, v)}
          />
        ))}
      </div>

      <p className="text-[11px] text-slate-500 mt-4">
        Contribuições de <span className="text-amber-400/80">Treinamento</span> e a <span className="text-amber-400/80">Guarda</span> ainda não entram nestes valores (em desenvolvimento).
      </p>
    </Card>
  );
}

/* ============================================================ */
/* Preview lateral (prévia em tempo real)                       */
/* ============================================================ */
function AftyPreview({ draft, derived }) {
  const tipoLabel = AFTY_TIPOS.find((t) => t.value === draft.core.tipo)?.label ?? draft.core.tipo;
  const patamarLabel = AFTY_PATAMARES.find((p) => p.value === draft.core.patamar)?.label ?? draft.core.patamar;
  const stats = [
    { k: "Vida", v: derived.hp, accent: "text-purple-300" },
    { k: "Energia", v: derived.pe, accent: "text-sky-400" },
    { k: "Defesa", v: derived.defesa },
    { k: "CD", v: derived.cd },
    { k: "RD Geral", v: derived.rdGeral },
    { k: "RD Espec.", v: derived.rdEspecifico },
    { k: "Movimento", v: `${derived.movimento}m` },
    { k: "Res. Parcial", v: derived.resParcial },
    { k: "Maestria", v: `+${derived.maestria}` },
  ];
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <h3 className="text-xs font-bold text-white">Preview</h3>
      </div>
      <div className="p-4">
        <div className="text-base font-bold text-white truncate">{draft.name || "Sem nome"}</div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-950/60 text-purple-300 border border-purple-800">
            {tipoLabel}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {patamarLabel}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            ND {derived.nd}
          </span>
          {derived.almaMult !== 1 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-950/50 text-rose-300 border border-rose-800">
              Alma {Math.round(derived.almaMult * 100)}%
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {stats.map((s) => (
            <div key={s.k} className="bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">{s.k}</div>
              <div className={`font-mono font-bold text-lg tabular-nums ${s.accent || "text-white"}`}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
