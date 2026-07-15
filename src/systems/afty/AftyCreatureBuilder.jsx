import React, { useState, useMemo } from "react";
import { Save, ChevronLeft, Wand2, Sparkles, FlaskConical } from "lucide-react";

import { FieldLabel, TextInput, Select, NumberInput, StatField } from "../../components/builder-controls";
import {
  createBlankAfty, AFTY_ATTRS, AFTY_TIPOS, AFTY_PATAMARES, AFTY_QNT_PE,
  AFTY_TECNICA_ATTRS, AFTY_TAMANHOS, AFTY_GRAUS_ITEM,
} from "./afty-schema";
import { AFTY_ORIGENS, getOrigem, origemTemDesenvolvimento } from "./afty-origens";
import {
  ATTR_METODOS, VALORES_FIXOS, valoresFixosOk, rolarAtributos, resumoAtributos,
  desenvolvimentoTotal, desenvolvimentoUsado, POINT_BUY_MIN, POINT_BUY_MAX,
} from "./afty-atributos";
import { deriveAfty } from "./afty-derive";

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
      attrNivel: { ...blank.attrNivel, ...(existingCreature.attrNivel || {}) },
      attrLimite: { ...blank.attrLimite, ...(typeof existingCreature.attrLimite === "object" ? existingCreature.attrLimite : {}) },
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
  const patchNivel = (key, val) =>
    setDraft((d) => ({ ...d, attrNivel: { ...d.attrNivel, [key]: val } }));

  // Aplica a escolha de bônus de origem e DEVOLVE ao pool os pontos de Nível que
  // passariam do limite — a origem tem prioridade sobre o Nível (dentro do limite).
  const setOrigemBonus = (bonusMap) =>
    setDraft((d) => {
      const limites = (d.attrLimite && typeof d.attrLimite === "object") ? d.attrLimite : {};
      const nextNivel = { ...d.attrNivel };
      for (const a of AFTY_ATTRS) {
        const base = d.attributes[a.key] || 0;
        const bonus = bonusMap[a.key] || 0;
        const lim = limites[a.key] ?? 20;
        const maxNivel = Math.max(0, lim - base - bonus);   // base+nível+bonus ≤ limite
        if ((nextNivel[a.key] || 0) > maxNivel) nextNivel[a.key] = maxNivel;
      }
      return {
        ...d,
        core: { ...d.core, origem: { ...d.core.origem, bonusAtributos: bonusMap } },
        attrNivel: nextNivel,
      };
    });

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
          {tab === "identidade" && <TabIdentidade draft={draft} patch={patch} patchCore={patchCore} setOrigemBonus={setOrigemBonus} />}
          {tab === "informacoes" && <TabInformacoes draft={draft} derived={derived} patch={patch} patchCore={patchCore} patchAttr={patchAttr} patchNivel={patchNivel} />}
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
function TabIdentidade({ draft, patch, patchCore, setOrigemBonus }) {
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
          <FieldLabel hint="escolha imutável na criação">Origem</FieldLabel>
          <Select
            value={draft.core.origem?.id}
            onChange={(v) => patchCore({ origem: { id: v } })}
            options={AFTY_ORIGENS}
          />
        </div>
      </div>

      <OrigemInfo draft={draft} setOrigemBonus={setOrigemBonus} />

      <div className="mt-4">
        <FieldLabel hint="URL da imagem (opcional)">Retrato</FieldLabel>
        <TextInput value={draft.portraitUrl} onChange={(v) => patch({ portraitUrl: v })} placeholder="https://..." />
      </div>
    </Card>
  );
}

/* Rótulo de uma concessão de origem (Talento / Feitiço / Aptidão Amaldiçoada). */
function grantLabel(g) {
  switch (g.tipo) {
    case "talento": return `${g.quantidade} Talento${g.ndMin > 1 ? ` (ND ≥ ${g.ndMin})` : ""}`;
    case "feitico": return `${g.quantidade} Feitiço −${g.custoPEReduzido} PE`;
    case "aptidao_amaldicoada": return `${g.quantidade} Aptidão Amaldiçoada${g.categoria ? ` de ${g.categoria}` : ""}`;
    default: return `${g.quantidade} ${g.tipo}`;
  }
}

/* Card da origem selecionada: raridade, resumo, características e — quando a
   origem tem bônus de atributo ESCOLHÍVEL — os seletores +2/+1. */
function OrigemInfo({ draft, setOrigemBonus }) {
  const id = draft.core.origem?.id;
  const origem = getOrigem(id);
  if (!origem) return null;
  const rara = origem.raridade === "rara";
  const fixedBonus = Object.entries(origem.bonusAtributos || {});

  const bonusMap = draft.core.origem?.bonusAtributos || {};
  const attrForPoints = (p) => Object.entries(bonusMap).find(([, v]) => v === p)?.[0] || "";
  const setSlot = (points, attrKey) => {
    const cur = { ...bonusMap };
    for (const k of Object.keys(cur)) if (cur[k] === points) delete cur[k];
    if (attrKey) cur[attrKey] = points;
    setOrigemBonus(cur); // aplica e devolve pontos de Nível que passariam do limite
  };
  const optionsFor = (p) => {
    const usedByOthers = Object.entries(bonusMap).filter(([, v]) => v !== p).map(([k]) => k);
    return AFTY_TECNICA_ATTRS.filter((o) => !usedByOthers.includes(o.value));
  };

  return (
    <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-bold text-white">{origem.nome}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
          rara ? "text-amber-300 border-amber-800 bg-amber-950/40" : "text-slate-400 border-slate-700 bg-slate-800/50"
        }`}>
          {rara ? "Rara" : "Comum"}
        </span>
        {origem.id === "restringido" && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border text-purple-300 border-purple-800 bg-purple-950/40">
            destrava Especialização exclusiva
          </span>
        )}
      </div>

      {origem.resumo && <p className="text-xs text-slate-400 mt-2">{origem.resumo}</p>}

      {/* bônus fixo (origens sem escolha) */}
      {fixedBonus.length > 0 && (
        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Bônus de Atributos</div>
          <div className="flex flex-wrap gap-1.5">
            {fixedBonus.map(([k, v]) => (
              <span key={k} className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-purple-300 border border-slate-700">
                {k} {v >= 0 ? `+${v}` : v}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* características */}
      {origem.caracteristicas.length > 0 && (
        <div className="mt-3 space-y-2.5">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Características de Origem</div>
          {origem.caracteristicas.map((c) => (
            <div key={c.id} className="border-l-2 border-slate-800 pl-2.5">
              <div className="text-xs font-semibold text-slate-200">{c.nome}</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{c.descricao}</p>

              {/* seletor de bônus escolhível */}
              {c.bonus?.escolhaDoJogador && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.bonus.pontos.map((p) => (
                    <div key={p} className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono font-bold text-purple-300 whitespace-nowrap">+{p} em</span>
                      <div className="w-36">
                        <Select value={attrForPoints(p)} onChange={(v) => setSlot(p, v)} options={optionsFor(p)} placeholder="— escolher —" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* concessões (Talento / Feitiço / Aptidão) — seletor virá quando os catálogos existirem */}
              {c.grants && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {c.grants.map((g, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded border border-amber-800/60 text-amber-300/90 bg-amber-950/20">
                      {grantLabel(g)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================ */
/* Aba: Informações (nível, tipo, atributos)                   */
/* ============================================================ */
/* Card de Atributos: método + trackers + controles por método + pool de nível. */
function AttributesCard({ draft, derived, patch, patchCore, patchAttr, patchNivel }) {
  const metodo = draft.attrMethod || "pontos";
  const limites = (draft.attrLimite && typeof draft.attrLimite === "object") ? draft.attrLimite : {};
  const resumo = resumoAtributos(draft);
  const nivelRestante = resumo.nivelTotal - resumo.nivelUsado;
  const somaBase = AFTY_ATTRS.reduce((s, a) => s + (draft.attributes[a.key] || 0), 0);

  // Desenvolvimento Inesperado (Derivado): pool que dá +1 valor e +1 limite.
  const temDesenv = origemTemDesenvolvimento(draft.core.origem?.id);
  const desenv = draft.core.origem?.desenvolvimento || {};
  const desenvTotal = desenvolvimentoTotal(draft.core.nd ?? 1);
  const desenvUsado = desenvolvimentoUsado(desenv);
  const desenvRestante = desenvTotal - desenvUsado;
  const setDesenv = (key, val) => {
    const cur = { ...desenv };
    if (val) cur[key] = val; else delete cur[key];
    patchCore({ origem: { ...draft.core.origem, desenvolvimento: cur } });
  };

  // Valores Fixos SEM travar: todo dropdown mostra os 6 valores. Escolher um
  // que já está em outro atributo TROCA os dois — o array fica sempre válido,
  // sem beco sem saída.
  const fixosOptions = [...VALORES_FIXOS].sort((x, y) => y - x).map((v) => ({ value: String(v), label: String(v) }));
  const setFixo = (key, valStr) => {
    const v = parseInt(valStr, 10);
    const cur = { ...draft.attributes };
    const old = cur[key];
    if (old === v) return;
    const other = AFTY_ATTRS.find((a) => a.key !== key && cur[a.key] === v);
    cur[key] = v;
    if (other) cur[other.key] = old; // troca
    patch({ attributes: cur });
  };
  // Ao entrar em "Valores Fixos", já preenche o array padrão se ainda não for válido.
  const setMetodo = (v) => {
    if (v === "fixos" && !valoresFixosOk(draft.attributes)) {
      const filled = { ...draft.attributes };
      AFTY_ATTRS.forEach((a, i) => { filled[a.key] = VALORES_FIXOS[i]; });
      patch({ attrMethod: v, attributes: filled });
    } else {
      patch({ attrMethod: v });
    }
  };

  return (
    <Card title="Atributos">
      <div className="sm:max-w-xs">
        <FieldLabel hint="limite é por atributo, no card de cada um">Método</FieldLabel>
        <Select value={metodo} onChange={setMetodo} options={ATTR_METODOS} />
      </div>

      {/* trackers */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {metodo === "pontos" && (
          <span className={`text-[11px] font-semibold px-2 py-1 rounded border ${
            resumo.pointBuyGasto > resumo.pointBuyTotal ? "text-red-300 border-red-800 bg-red-950/30" : "text-slate-300 border-slate-700 bg-slate-800/50"
          }`}>
            Compra: {resumo.pointBuyGasto} / {resumo.pointBuyTotal} pts
          </span>
        )}
        {metodo === "fixos" && (
          <span className="text-[11px] font-semibold px-2 py-1 rounded border text-slate-300 border-slate-700 bg-slate-800/50">
            Distribua: 15, 14, 13, 12, 10, 8
          </span>
        )}
        {metodo === "rolagem" && (
          <button
            type="button"
            onClick={() => patch({ attributes: rolarAtributos() })}
            className="text-[11px] font-semibold px-2.5 py-1 rounded border border-purple-700 bg-purple-800/40 text-purple-200 hover:bg-purple-700/50"
          >
            🎲 Rolar 4d6 (todos)
          </button>
        )}
        <span className={`text-[11px] font-semibold px-2 py-1 rounded border ${
          resumo.nivelUsado > resumo.nivelTotal ? "text-red-300 border-red-800 bg-red-950/30" : "text-slate-300 border-slate-700 bg-slate-800/50"
        }`}>
          Pontos de nível: {resumo.nivelUsado} / {resumo.nivelTotal}
        </span>
        {metodo === "rolagem" && (
          <span className="text-[10px] font-mono text-slate-500" title="Soma dos valores base (o array fixo, de referência, soma 72)">
            (soma {somaBase})
          </span>
        )}
      </div>

      {/* avisos */}
      {resumo.warnings.length > 0 && (
        <ul className="mt-3 space-y-1">
          {resumo.warnings.map((w, i) => (
            <li key={i} className="text-[11px] text-amber-400 flex items-start gap-1.5">
              <span aria-hidden="true">⚠</span> {w}
            </li>
          ))}
        </ul>
      )}

      {/* tabela compacta de atributos */}
      <div className="mt-3 border border-slate-800 rounded-lg overflow-hidden">
        {/* cabeçalho (desktop) */}
        <div className="hidden sm:grid grid-cols-[1.4fr_1.1fr_1.1fr_0.8fr_0.6fr] gap-3 px-3 py-2 bg-slate-950 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <span>Atributo</span>
          <span className="text-center">Base</span>
          <span className="text-center">Nível</span>
          <span className="text-center">Efetivo</span>
          <span className="text-center">Limite</span>
        </div>

        {AFTY_ATTRS.map((a) => {
          const base = draft.attributes[a.key];
          const niv = draft.attrNivel?.[a.key] || 0;
          const lim = limites[a.key] ?? 20;           // limite base (teto do pool de nível)
          const effLim = derived.attrLimiteEfetivo[a.key]; // limite efetivo (com Desenvolvimento)
          const efetivo = derived.attrEff[a.key];     // valor EFETIVO (base+nível+desenv+origem)
          const m = derived.mods[a.key];              // modificador EFETIVO
          const bonus = derived.attrBonus[a.key] || 0;
          const dev = derived.attrDesenv[a.key] || 0;
          // Nível reserva espaço pra origem: base + nível + bônus ≤ limite base.
          const nivMax = Math.max(niv, Math.min(niv + nivelRestante, lim - base - bonus));
          const miniLbl = "text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:hidden";
          return (
            <div
              key={a.key}
              className="grid grid-cols-2 sm:grid-cols-[1.4fr_1.1fr_1.1fr_0.8fr_0.6fr] gap-x-3 gap-y-3 items-center px-3 py-3 border-t border-slate-800"
            >
              {/* atributo */}
              <div className="col-span-2 sm:col-span-1 min-w-0">
                <div className="text-[13px] text-slate-300 truncate">
                  <span className="text-white font-bold">{a.abbr}</span> {a.label}
                </div>
                {(bonus > 0 || dev > 0) && (
                  <div className="flex gap-2 mt-0.5">
                    {bonus > 0 && <span className="text-[9px] text-emerald-400">+{bonus} Origem</span>}
                    {dev > 0 && <span className="text-[9px] text-slate-400">+{dev} Desenv</span>}
                  </div>
                )}
              </div>

              {/* base */}
              <div className="flex flex-col gap-1">
                <span className={miniLbl}>Base</span>
                {metodo === "fixos" ? (
                  <Select value={String(base)} onChange={(v) => setFixo(a.key, v)} options={fixosOptions} />
                ) : (
                  <NumberInput
                    value={base}
                    onChange={(v) => patchAttr(a.key, v)}
                    min={metodo === "pontos" ? POINT_BUY_MIN : 0}
                    max={metodo === "pontos" ? POINT_BUY_MAX : 30}
                    aria-label={`${a.label} base`}
                  />
                )}
              </div>

              {/* nível */}
              <div className="flex flex-col gap-1">
                <span className={miniLbl}>Nível</span>
                <NumberInput value={niv} onChange={(v) => patchNivel(a.key, v)} min={0} max={nivMax} aria-label={`${a.label} pontos de nível`} />
              </div>

              {/* efetivo */}
              <div className="flex flex-col gap-0.5 sm:items-center">
                <span className={miniLbl}>Efetivo</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-extrabold text-lg text-white tabular-nums leading-none">{efetivo}</span>
                  <span className="font-mono text-[11px] text-purple-300">{m >= 0 ? `+${m}` : m}</span>
                </div>
              </div>

              {/* limite (efetivo: base + Desenvolvimento) */}
              <div className="flex flex-col gap-0.5 sm:items-center">
                <span className={miniLbl}>Limite</span>
                <span className={`font-mono text-sm tabular-nums ${dev > 0 ? "text-slate-300" : "text-slate-400"}`}>{effLim}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desenvolvimento Inesperado (Derivado) — pool que sobe valor + limite */}
      {temDesenv && (
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="text-[11px] uppercase tracking-wider text-slate-400">
              Desenvolvimento Inesperado
              <span className="normal-case tracking-normal text-slate-500 ml-1.5">· +1 no valor e no limite por ponto</span>
            </div>
            <span className={`text-[11px] font-mono tabular-nums ${desenvUsado > desenvTotal ? "text-red-400" : "text-slate-400"}`}>
              {desenvUsado} / {desenvTotal}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AFTY_ATTRS.map((a) => {
              const d = desenv[a.key] || 0;
              return (
                <div key={a.key} className="flex items-center justify-between gap-2 bg-slate-950/50 border border-slate-800 rounded px-2 py-1.5">
                  <span className="text-[11px] font-bold text-slate-400">{a.abbr}</span>
                  <div className="w-[92px]">
                    <NumberInput value={d} onChange={(v) => setDesenv(a.key, v)} min={0} max={d + desenvRestante} aria-label={`Desenvolvimento em ${a.label}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

function TabInformacoes({ draft, derived, patch, patchCore, patchAttr, patchNivel }) {
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

        {/* orçamento de Aptidão (o de Atributos vive no card abaixo) */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 inline-block">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Níveis de Aptidão</div>
            <div className="text-lg font-mono font-bold text-white">{derived.totalAptidao}</div>
          </div>
        </div>
      </Card>

      <AttributesCard draft={draft} derived={derived} patch={patch} patchCore={patchCore} patchAttr={patchAttr} patchNivel={patchNivel} />

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
