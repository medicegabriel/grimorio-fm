import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Pencil, Check } from "lucide-react";
import { TextInput, TextArea, Select, SmallButton } from "./builder-controls";
import { TEMPLATE_TYPES, templateLabel, updateTemplate, buildTemplateFromEntity } from "./fm-templates";
import { ACTION_TYPE_LABELS, ATTACK_TYPE_OPTIONS, TR_TYPE_OPTIONS, DAMAGE_TYPE_LABELS, normalizeAction, calcAutoRange, resolveActionFinalText, actionRequiredBt } from "./fm-action-calc";
import { getDomainVersionLabel, DOMAIN_VERSIONS } from "./fm-domain-calc";
import ActionForm from "./sections/actions/ActionForm";
import DomainForm from "./sections/actions/DomainForm";
import DomainText from "./sections/actions/DomainText";

// ============================================================
// Opções de edição (rota A — campos textuais/metadados)
// ============================================================
// Espelham as listas de SectionFeatures (Características Personalizadas).
const CARAC_CATEGORIES = [
  { value: "geral",            label: "Geral" },
  { value: "especial",         label: "Especial" },
  { value: "dote_geral",       label: "Dote Geral" },
  { value: "dote_amaldicoado", label: "Dote Amaldiçoado" },
  { value: "aptidao",          label: "Aptidão" },
  { value: "treinamento",      label: "Treinamento" },
  { value: "artimanha",        label: "Artimanha" },
];
const CARAC_TRIGGERS = [
  { value: "passiva",     label: "Passiva" },
  { value: "rodada",      label: "Todo turno" },
  { value: "condicional", label: "Condicional" },
  { value: "acao",        label: "Custa ação" },
];

const RANGE_LABELS = { distancia: "Distância", cac: "Corpo a corpo" };
const PATAMAR_LABELS = { lacaio: "Lacaio", capanga: "Capanga", comum: "Comum", desafio: "Desafio", calamidade: "Calamidade" };

const labelOf = (options, value) => options.find((o) => o.value === value)?.label ?? value ?? "—";

// BT neutro para editar um Modelo de Ação sem criatura. Os números são
// reescalados de verdade ao aplicar numa ficha; aqui é só uma base.
const ACTION_TEMPLATE_BT = 2;

// Normaliza o modelo e preenche Alcance/Área (que o modelo não guarda — são
// derivados da criatura) com os valores automáticos do BT neutro.
function seedActionTemplate(tpl) {
  const norm = normalizeAction(tpl);
  const av = calcAutoRange(norm.attackType, norm.rangeType, ACTION_TEMPLATE_BT);
  return {
    ...norm,
    range: norm.range ?? av.range,
    area:  norm.area  ?? av.area,
    // Modo modelo: alcance/área são snapshots congelados (locked=false evita a
    // re-derivação automática por BT) e o dano é tratado como manual — não há
    // criatura para auto-calcular; tudo é reescalado de novo no apply.
    rangeLocked: false,
    areaLocked:  false,
    damage: { ...norm.damage, damageIsLocked: true },
  };
}

// Só os campos editáveis por tipo (não toca na matemática do dano da Ação).
function buildPatch(type, f) {
  switch (type) {
    case "acao":
      return { name: f.name?.trim() || "", type: f.type, cost: Number(f.cost) || 0, description: f.description ?? "" };
    case "caracteristica":
      return { name: f.name?.trim() || "", category: f.category, trigger: f.trigger, description: f.description ?? "" };
    case "dote":
    case "treinamento":
      return { nome: f.nome?.trim() || "", descricao: f.descricao ?? "" };
    case "aptidao":
      return { nome: f.nome?.trim() || "", categoria: f.categoria?.trim() || "Customizada", descricao: f.descricao ?? "" };
    default:
      return {};
  }
}

// Linha rótulo + valor (modo visualização).
const Row = ({ label, children }) => (
  <div className="flex gap-2 text-sm">
    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold w-28 flex-shrink-0 pt-0.5">{label}</span>
    <span className="text-slate-200 min-w-0 break-words">{children}</span>
  </div>
);

const Badge = ({ children }) => (
  <span className="text-[10px] uppercase tracking-wide text-slate-300 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5">
    {children}
  </span>
);

// ============================================================
// VISUALIZAÇÃO por tipo
// ============================================================
function DetailView({ type, f }) {
  const desc = type === "acao" || type === "caracteristica" ? f.description : f.descricao;
  return (
    <div className="space-y-3">
      {type === "acao" && (() => {
        const d = f.damage;
        const hasDamage = f.attackType !== "suporte" && d && (d.numDice || d.dieSize);
        const modStr = d?.mod > 0 ? `+${d.mod}` : d?.mod < 0 ? `${d.mod}` : "";
        const damageStr = hasDamage
          ? `${d.numDice || 0}d${d.dieSize || 0}${modStr} ${DAMAGE_TYPE_LABELS[d.type] ?? d.type ?? ""}`.trim()
          : null;
        const cond = f.condition;
        const hasCond = cond && cond.tier && cond.tier !== "nenhuma";
        // Texto do ataque por extenso: respeita o Texto Final customizado do
        // modelo (com tokens resolvidos); senão, gera automaticamente.
        const norm = normalizeAction(f);
        const attackText = resolveActionFinalText(norm, "");
        const baseInfo = f.calc?.nd != null && f.calc?.patamar
          ? ` Esse dano foi calculado usando como base uma Criatura ND ${f.calc.nd}, ${PATAMAR_LABELS[f.calc.patamar] ?? f.calc.patamar}.`
          : "";
        const reqBt = actionRequiredBt(norm); // BT mínimo p/ condição/trades intactos
        return (
          <>
            <div className="flex flex-wrap gap-1.5">
              <Badge>{ACTION_TYPE_LABELS[f.type] ?? f.type}</Badge>
              <Badge>{labelOf(ATTACK_TYPE_OPTIONS, f.attackType)}</Badge>
              {String(f.attackType ?? "").startsWith("tr_") && <Badge>TR: {labelOf(TR_TYPE_OPTIONS, f.trType)}</Badge>}
              <Badge>{RANGE_LABELS[f.rangeType] ?? f.rangeType ?? "—"}</Badge>
              {f.cost > 0 && <Badge>{f.cost} PE</Badge>}
              {d?.damageIsLocked && <Badge>Dano manual</Badge>}
              {reqBt > 2 && (
                <span className="text-[10px] uppercase tracking-wide text-amber-300 bg-amber-950/50 border border-amber-800/60 rounded px-1.5 py-0.5">
                  Requer BT +{reqBt}
                </span>
              )}
            </div>
            {damageStr && <Row label="Dano">{damageStr}</Row>}
            {hasCond && <Row label="Condição">{cond.name || cond.tier}</Row>}
            {attackText && (
              <div>
                <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                  Descrição do Ataque
                </span>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/50 border border-slate-800 rounded p-2.5">
                  {attackText}
                </p>
              </div>
            )}
            <p className="text-[11px] text-slate-500 italic">
              Os números de dano e acerto são reescalados para a criatura ao aplicar.{baseInfo}
            </p>
          </>
        );
      })()}
      {type === "expansao" && (
        <DomainText
          text={f.finalText}
          name={f.name}
          versaoLabel={getDomainVersionLabel(f.versao)}
          lore={f.lore}
          size="text-sm"
        />
      )}
      {type === "caracteristica" && (
        <div className="flex flex-wrap gap-1.5">
          <Badge>{labelOf(CARAC_CATEGORIES, f.category)}</Badge>
          <Badge>{labelOf(CARAC_TRIGGERS, f.trigger)}</Badge>
        </div>
      )}
      {type === "aptidao" && f.categoria && (
        <div className="flex flex-wrap gap-1.5"><Badge>{f.categoria}</Badge></div>
      )}
      {type !== "acao" && type !== "expansao" && (desc ? (
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{desc}</p>
      ) : (
        <p className="text-sm text-slate-600 italic">Sem descrição.</p>
      ))}
    </div>
  );
}

// ============================================================
// EDIÇÃO por tipo (rota A)
// ============================================================
function DetailEdit({ type, f, update }) {
  // Ações e Expansões são editadas pelo form completo (Rota B), não chegam aqui.
  if (type === "caracteristica") {
    return (
      <div className="space-y-3">
        <Field label="Nome"><TextInput value={f.name ?? ""} onChange={(v) => update({ name: v })} placeholder="Nome" /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Categoria"><Select value={f.category} onChange={(v) => update({ category: v })} options={CARAC_CATEGORIES} /></Field>
          <Field label="Gatilho"><Select value={f.trigger} onChange={(v) => update({ trigger: v })} options={CARAC_TRIGGERS} /></Field>
        </div>
        <Field label="Descrição"><TextArea value={f.description ?? ""} onChange={(v) => update({ description: v })} rows={4} placeholder="Como funciona..." /></Field>
      </div>
    );
  }
  // dote / treinamento / aptidao
  return (
    <div className="space-y-3">
      <Field label="Nome"><TextInput value={f.nome ?? ""} onChange={(v) => update({ nome: v })} placeholder="Nome" /></Field>
      {type === "aptidao" && (
        <Field label="Categoria"><TextInput value={f.categoria ?? ""} onChange={(v) => update({ categoria: v })} placeholder="Customizada" /></Field>
      )}
      <Field label="Descrição"><TextArea value={f.descricao ?? ""} onChange={(v) => update({ descricao: v })} rows={4} placeholder="Descrição..." /></Field>
    </div>
  );
}

const Field = ({ label, children }) => (
  <label className="block">
    <span className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{label}</span>
    {children}
  </label>
);

// ============================================================
// MODAL
// ============================================================
export default function TemplateDetailModal({ type, tpl, onClose }) {
  // Montado com key={type:id} pelo pai, então o estado inicial já vem do tpl
  // correto — sem necessidade de efeito de sincronização.
  const [mode, setMode] = useState("view");
  const [form, setForm] = useState(() => ({ ...tpl }));

  const update = (p) => setForm((prev) => ({ ...prev, ...p }));
  const save = () => {
    updateTemplate(type, tpl.id, buildPatch(type, form));
    setForm((prev) => ({ ...prev, ...buildPatch(type, prev) }));
    setMode("view");
  };

  // Ações usam o FORM COMPLETO (Rota B) — edita ataque/alcance/dano/condição,
  // não só os metadados. Os demais tipos seguem no editor leve (Rota A).
  const useActionForm = mode === "edit" && type === "acao";

  // Expansões também usam o form completo (DomainForm) — edita efeitos, versão,
  // Acerto Garantido, Modificação Completa e textos. Sem criatura, montamos um
  // contexto sintético a partir do snapshot `calc` (ou neutro p/ modelos antigos).
  const useDomainForm = mode === "edit" && type === "expansao";
  const dCalc = tpl.calc || {};
  const ndForEdit  = dCalc.nd  ?? DOMAIN_VERSIONS[tpl.versao]?.minNd ?? 10;
  const domForEdit = dCalc.dom ?? 5;
  const barForEdit = dCalc.bar ?? 0;
  const btForEdit  = dCalc.bt  ?? 2;
  const domainDraft = {
    name: form.name,
    core: { nd: ndForEdit },
    aptidoes: { dom: domForEdit, bar: barForEdit },
    caracteristicas: [{ key: "expansao_de_dominio" }],
    // Inclui as aptidões p/ os blocos de Acerto Garantido / Modificação Completa
    // ficarem disponíveis na edição do modelo.
    aptidoesEspeciais: [{ key: "acerto_garantido" }, { key: "modificacao_completa" }],
  };
  const domainDerived = { bt: btForEdit };
  const saveDomainForm = (formDomain) => {
    const patch = buildTemplateFromEntity("expansao", formDomain);
    updateTemplate("expansao", tpl.id, patch);
    setForm((prev) => ({ ...prev, ...patch }));
    setMode("view");
  };
  const actionCtx = {
    patamar: null, nd: null, bt: ACTION_TEMPLATE_BT,
    acertoPrincipal: tpl.toHitBase ?? 0, cdBase: tpl.cdBase ?? 0,
    creatureName: "", difficulty: null,
  };
  const saveActionForm = (formAction) => {
    const patch = buildTemplateFromEntity("acao", formAction);
    // Sem criatura, o form carimba calc nulo — preserva a base original do modelo.
    patch.calc = tpl.calc ?? patch.calc ?? null;
    // O modo modelo edita o dano como "manual" (UX); preserva a natureza original
    // (auto reescala no apply; manual mantém os números) para não degradar.
    if (patch.damage) {
      patch.damage = { ...patch.damage, damageIsLocked: tpl.damage?.damageIsLocked ?? false };
    }
    updateTemplate("acao", tpl.id, patch);
    setForm((prev) => ({ ...prev, ...patch }));
    setMode("view");
  };

  const typeLabel = TEMPLATE_TYPES[type]?.label ?? type;
  const savedAt = tpl.savedAt ? new Date(tpl.savedAt) : null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className={`bg-slate-900 border border-slate-800 rounded-lg w-full shadow-2xl flex flex-col max-h-[85vh] ${useActionForm || useDomainForm ? "max-w-2xl" : "max-w-lg"}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-800 flex-shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">{typeLabel}</span>
            <h3 className="text-lg font-bold text-white truncate">{templateLabel(type, form) || "(sem nome)"}</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200 flex-shrink-0"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {useActionForm ? (
            <ActionForm
              context={actionCtx}
              templateMode
              initialAction={seedActionTemplate(form)}
              title="Editar Modelo de Ação"
              submitLabel="Salvar"
              templates={[]}
              onRemoveTemplate={() => {}}
              onAdd={saveActionForm}
              onCancel={() => setMode("view")}
            />
          ) : useDomainForm ? (
            <DomainForm
              templateMode
              draft={domainDraft}
              derived={domainDerived}
              initialAction={form}
              title="Editar Modelo de Expansão"
              submitLabel="Salvar"
              onAdd={saveDomainForm}
              onCancel={() => setMode("view")}
            />
          ) : mode === "view" ? (
            <DetailView type={type} f={form} />
          ) : (
            <DetailEdit type={type} f={form} update={update} />
          )}
        </div>

        {!useActionForm && !useDomainForm && (
          <div className="flex items-center justify-between gap-2 p-4 border-t border-slate-800 flex-shrink-0">
            <span className="text-[11px] text-slate-600">
              {savedAt && !isNaN(savedAt) ? `Salvo em ${savedAt.toLocaleDateString("pt-BR")}` : ""}
            </span>
            {mode === "view" ? (
              <SmallButton onClick={() => setMode("edit")} variant="primary">
                <Pencil className="w-3 h-3" /> Editar
              </SmallButton>
            ) : (
              <div className="flex gap-2">
                <SmallButton onClick={() => { setForm({ ...tpl }); setMode("view"); }}>Cancelar</SmallButton>
                <SmallButton onClick={save} variant="primary"><Check className="w-3 h-3" /> Salvar</SmallButton>
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
