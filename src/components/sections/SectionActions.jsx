import React, { useState } from "react";
import { Plus, Trash2, Copy, Swords, Info, AlertTriangle } from "lucide-react";
import { FieldLabel, TextInput, TextArea, Select, NumberInput, SmallButton, Pill } from "../builder-controls";
import { getDamage } from "../fm-tables";

// ============================================================
// CONSTANTES
// ============================================================
const ACTION_TYPE_OPTIONS = [
  { value: "comum",     label: "Ação Comum" },
  { value: "bonus",     label: "Ação Bônus" },
  { value: "rapida",    label: "Ação Rápida" },
  { value: "reacao",    label: "Reação" },
  { value: "movimento", label: "Movimento" },
  { value: "livre",     label: "Livre" },
];

export const ACTION_TYPE_LABELS = {
  comum: "Ação Comum", bonus: "Ação Bônus", rapida: "Ação Rápida",
  reacao: "Reação", movimento: "Movimento", livre: "Livre",
};

const ATTACK_TYPE_OPTIONS = [
  { value: "acerto",        label: "Teste de Acerto (dano total)" },
  { value: "tr_individual", label: "TR Individual (dano -1 ND)" },
  { value: "tr_area",       label: "TR em Área (dano ÷2)" },
  { value: "suporte",       label: "Suporte / Defesa (sem dano)" },
];

const TR_TYPE_OPTIONS = [
  { value: "fortitude",   label: "Fortitude" },
  { value: "reflexos",    label: "Reflexos" },
  { value: "vontade",     label: "Vontade" },
  { value: "astucia",     label: "Astúcia" },
  { value: "integridade", label: "Integridade" },
];

const TR_TYPE_LABELS = {
  fortitude: "Fortitude", reflexos: "Reflexos", vontade: "Vontade",
  astucia: "Astúcia", integridade: "Integridade",
};

const DAMAGE_TYPE_OPTIONS = [
  { value: "cortante",            label: "Cortante" },
  { value: "perfurante",          label: "Perfurante" },
  { value: "impacto",             label: "Impacto" },
  { value: "queimante",           label: "Queimante" },
  { value: "congelante",          label: "Congelante" },
  { value: "chocante",            label: "Chocante" },
  { value: "psiquico",            label: "Psíquico" },
  { value: "sonoro",              label: "Sonoro" },
  { value: "corrosivo",           label: "Corrosivo" },
  { value: "radiante",            label: "Radiante" },
  { value: "necrotico",           label: "Necrótico" },
  { value: "energia_amaldicoada", label: "Energia Amaldiçoada" },
];

const DAMAGE_TYPE_LABELS = {
  cortante: "Cortante", perfurante: "Perfurante", impacto: "Impacto",
  queimante: "Queimante", congelante: "Congelante", chocante: "Chocante",
  psiquico: "Psíquico", sonoro: "Sonoro", corrosivo: "Corrosivo",
  radiante: "Radiante", necrotico: "Necrótico", energia_amaldicoada: "Energia Amaldiçoada",
};

const CONDITION_TIER_OPTIONS = [
  { value: "nenhuma", label: "Nenhuma" },
  { value: "fraca",   label: "Fraca (2 PE ou -1 ND)" },
  { value: "media",   label: "Média (5 PE ou -2 ND)" },
  { value: "forte",   label: "Forte (8 PE ou -3 ND)" },
  { value: "extrema", label: "Extrema (10 PE ou -4 ND)" },
];

const CONDITION_TIER_LABELS = {
  fraca: "Fraca", media: "Média", forte: "Forte", extrema: "Extrema",
};

const CONDITION_PE_COST = { fraca: 2, media: 5, forte: 8, extrema: 10 };
const CONDITION_ND_COST = { fraca: 1, media: 2, forte: 3, extrema: 4 };

const CONDITION_PAYMENT_OPTIONS = [
  { value: "pe", label: "Pagar com PE" },
  { value: "nd", label: "Reduzir ND do Dano" },
];

const CONDITION_NAMES = [
  "Abalado", "Amedrontado", "Apavorado", "Atordoado", "Caído",
  "Cego", "Confuso", "Desprevenido", "Doente", "Em Chamas",
  "Enfeitiçado", "Envenenado", "Exausto", "Fascinado", "Fraco",
  "Imóvel", "Inconsciente", "Lento", "Paralisado", "Sangrando",
  "Surdo", "Vulnerável",
];

const CONDITION_NAME_OPTIONS = [
  { value: "", label: "— Selecione —" },
  ...CONDITION_NAMES.map((n) => ({ value: n, label: n })),
  { value: "outro", label: "Outro / Customizado" },
];

const DIE_SIZES = [4, 6, 8, 10, 12, 20];

// ============================================================
// HELPERS DE ROLAGEM
// ============================================================
const rollStr = (numDice, dieSize, mod) => {
  if (!numDice || !dieSize) return mod ? (mod > 0 ? `+${mod}` : `${mod}`) : "";
  const base = `${numDice}d${dieSize}`;
  if (!mod) return base;
  return mod > 0 ? `${base}+${mod}` : `${base}${mod}`;
};

const rollAverage = (numDice, dieSize, mod) => {
  if (!numDice || !dieSize) return mod || 0;
  return Math.round(numDice * (dieSize + 1) / 2 + (mod || 0));
};

const parseRollFromStr = (roll) => {
  const m = (roll ?? "").match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!m) return null;
  return { numDice: parseInt(m[1]), dieSize: parseInt(m[2]), mod: parseInt(m[3] ?? "0") };
};

// ============================================================
// ESTADO DERIVADO (puro — sem React)
// ============================================================

// Dado o damage e isNarrativePhysical, retorna o número de dados efetivo.
const deriveFinalDice = (dmg) => {
  const base = dmg?.numDice ?? 0;
  return dmg?.isNarrativePhysical ? Math.max(0, base - 2) : base;
};

// Retorna o custo de PE da condição (0 se payment !== 'pe' ou sem condição).
const deriveCondPE = (condition) => {
  if (!condition) return 0;
  if (condition.tier === "nenhuma" || !condition.tier) return 0;
  if (condition.payment !== "pe") return 0;
  return CONDITION_PE_COST[condition.tier] ?? 0;
};

// PE total = custo base + custo da condição.
const deriveFinalPE = (baseCost, condition) =>
  (baseCost ?? 0) + deriveCondPE(condition);

// Normaliza uma ação antiga para o modelo novo.
function normalizeAction(action) {
  const dmg = action.damage ?? {};
  let { numDice, dieSize, mod } = dmg;
  if (numDice == null && dmg.roll) {
    const p = parseRollFromStr(dmg.roll);
    if (p) { numDice = p.numDice; dieSize = p.dieSize; mod = p.mod; }
  }
  const existingName = action.condition?.name ?? "";
  const nameKey = action.condition?.nameKey ??
    (CONDITION_NAMES.includes(existingName) ? existingName : existingName ? "outro" : "");
  return {
    condition: { tier: "nenhuma", name: "", nameKey: "", payment: "pe" },
    ...action,
    damage: {
      type: "cortante",
      isNarrativePhysical: false,
      ...dmg,
      numDice: numDice ?? 0,
      dieSize: dieSize ?? 8,
      mod: mod ?? 0,
    },
    condition: {
      tier: "nenhuma",
      payment: "pe",
      nameKey,
      name: nameKey === "outro" ? existingName : nameKey,
      ...(action.condition ?? {}),
      nameKey,
    },
  };
}

// ============================================================
// humanizeAction — exportada, consumida por CombatantPanel e LivePreview
// Usa estado derivado internamente para refletir a matemática resolvida.
// ============================================================
export function humanizeAction(action) {
  if (!action?.name) return "";
  const parts = [];
  const typeLabel = ACTION_TYPE_LABELS[action.type] || action.type || "Ação";

  parts.push(`${action.name} (${typeLabel}).`);

  if (action.description?.trim()) parts.push(action.description.trim());

  const dmg = action.damage;
  // Dados finais já com desconto físico
  const finalDice = deriveFinalDice(dmg);
  const dieSize = dmg?.dieSize ?? 8;
  const mod = dmg?.mod ?? 0;
  // Usa rollStr derivado; fallback para roll armazenado (dados antigos sem numDice)
  const computedRoll = rollStr(finalDice, dieSize, mod);
  const roll = computedRoll || dmg?.roll || "";

  const hasDamage = action.attackType !== "suporte" && roll;
  const dmgTypeLabel = DAMAGE_TYPE_LABELS[dmg?.type] || dmg?.type || "";
  const dmgStr = hasDamage ? `${roll} de dano ${dmgTypeLabel}` : null;

  if (action.attackType === "acerto") {
    const hitPart   = action.toHit != null ? ` Acerto +${action.toHit}.` : "";
    const rangePart = action.range ? ` Alcance ${action.range}.` : "";
    if (hasDamage) parts.push(`${hitPart}${rangePart} Causa ${dmgStr}.`);
    else if (hitPart || rangePart) parts.push(`${hitPart}${rangePart}`);
  } else if (action.attackType === "tr_individual") {
    const tr = TR_TYPE_LABELS[action.trType] || action.trType || "TR";
    const rangePart = action.range ? ` a ${action.range}` : "";
    if (hasDamage)
      parts.push(`Criatura${rangePart} realiza TR de ${tr} (CD ${action.cd}). Em uma falha, recebe ${dmgStr} (sucesso reduz em 1 ND).`);
    else
      parts.push(`Criatura${rangePart} realiza TR de ${tr} (CD ${action.cd}).`);
  } else if (action.attackType === "tr_area") {
    const tr = TR_TYPE_LABELS[action.trType] || action.trType || "TR";
    const rangePart = action.range ? ` a ${action.range}` : "";
    const areaPart  = action.area  ? `, área de ${action.area}` : "";
    if (hasDamage)
      parts.push(`Criatura${rangePart}${areaPart} realiza TR de ${tr} (CD ${action.cd}). Em uma falha, recebe ${dmgStr} (sucesso reduz à metade).`);
    else
      parts.push(`Criatura${rangePart}${areaPart} realiza TR de ${tr} (CD ${action.cd}).`);
  }

  const cond = action.condition;
  if (cond?.tier && cond.tier !== "nenhuma") {
    const tierLabel = CONDITION_TIER_LABELS[cond.tier] || cond.tier;
    const condName = cond.name?.trim() ? `[${cond.name}]` : `[condição ${tierLabel}]`;
    if (cond.payment === "nd") {
      const ndCost = CONDITION_ND_COST[cond.tier] ?? "?";
      parts.push(`Aplica a condição ${condName} (${tierLabel} — -${ndCost} ND).`);
    } else {
      parts.push(`Aplica a condição ${condName} (${tierLabel}).`);
    }
  }

  // PE total já inclui custo da condição
  const finalPE = deriveFinalPE(action.cost, cond);
  if (finalPE > 0) parts.push(`Custo: ${finalPE} PE.`);

  return parts.filter(Boolean).join(" ");
}

// ============================================================
// SECTION ACTIONS
// ============================================================
export default function SectionActions({ draft, derived, actions }) {
  const [showForm, setShowForm] = useState(false);

  const handleAdd = (newAction) => {
    actions.addAction({ ...newAction, id: `act-${Date.now().toString(36)}` });
    setShowForm(false);
  };

  const total = derived.actionsTotal ?? { comum: 1, bonus: 0, rapida: 0, movimento: 1, reacao: 1 };

  return (
    <div className="space-y-3">
      <div className="bg-slate-950/60 border border-slate-800 rounded px-3 py-2 flex flex-wrap gap-2 text-xs">
        <span className="text-slate-500">Por turno:</span>
        <Pill color="rose">{total.comum} Comum</Pill>
        <Pill color="amber">{total.rapida} Rápida</Pill>
        <Pill color="sky">{total.bonus} Bônus</Pill>
        <Pill color="emerald">{total.movimento} Movimento</Pill>
        <Pill color="purple">{total.reacao} Reação</Pill>
      </div>

      <div className="space-y-2">
        {draft.actions.list.length === 0 && (
          <div className="text-center py-6 text-slate-600 text-sm italic border border-dashed border-slate-800 rounded">
            Nenhuma ação cadastrada
          </div>
        )}
        {draft.actions.list.map((action) => (
          <ActionItem
            key={action.id}
            action={action}
            onUpdate={(patch) => actions.updateAction(action.id, patch)}
            onRemove={() => actions.removeAction(action.id)}
            onDuplicate={() => actions.duplicateAction(action.id)}
          />
        ))}
      </div>

      {showForm ? (
        <ActionForm derived={derived} draft={draft} onAdd={handleAdd} onCancel={() => setShowForm(false)} />
      ) : (
        <SmallButton onClick={() => setShowForm(true)} variant="primary">
          <Plus className="w-3 h-3" /> Adicionar Ação
        </SmallButton>
      )}
    </div>
  );
}

// ============================================================
// ACTION ITEM
// ============================================================
function ActionItem({ action, onUpdate, onRemove, onDuplicate }) {
  const [expanded, setExpanded] = useState(false);
  const norm = normalizeAction(action);
  const finalPE = deriveFinalPE(norm.cost, norm.condition);

  const updateDamage = (patch) => {
    const dmg = { ...norm.damage, ...patch };
    // Armazena roll baseado nos dados base (humanizeAction deriva o final)
    dmg.roll    = rollStr(dmg.numDice, dmg.dieSize, dmg.mod);
    dmg.average = rollAverage(deriveFinalDice(dmg), dmg.dieSize, dmg.mod);
    onUpdate({ damage: dmg });
  };

  const updateCond = (patch) =>
    onUpdate({ condition: { ...norm.condition, ...patch } });

  return (
    <div className="bg-slate-950/40 border border-slate-800 rounded">
      <div className="flex items-center gap-2 p-2">
        <Swords className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 text-left text-sm font-semibold text-white hover:text-purple-300 min-w-0"
        >
          <span className="truncate block">{action.name || "Ação sem nome"}</span>
        </button>
        <Pill color="slate">{ACTION_TYPE_LABELS[action.type] || action.type}</Pill>
        {finalPE > 0 && <Pill color="purple">{finalPE} PE</Pill>}
        <SmallButton onClick={onDuplicate} title="Duplicar">
          <Copy className="w-3 h-3" />
        </SmallButton>
        <SmallButton onClick={onRemove} variant="danger" title="Remover">
          <Trash2 className="w-3 h-3" />
        </SmallButton>
      </div>

      {!expanded && (
        <div className="px-3 pb-2">
          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
            {humanizeAction(norm)}
          </p>
        </div>
      )}

      {expanded && (
        <div className="border-t border-slate-800 p-3 space-y-3">
          <ActionFormFields
            form={norm}
            update={onUpdate}
            updateDamage={updateDamage}
            updateCond={updateCond}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// ACTION FORM (nova ação)
// ============================================================
function ActionForm({ derived, draft, onAdd, onCancel }) {
  const [form, setForm] = useState(() => {
    const suggested = getDamage(draft?.core?.patamar, draft?.core?.nd);
    const parsed = parseRollFromStr(suggested?.roll);
    return {
      name: "",
      type: "comum",
      attackType: "acerto",
      toHit: derived?.acertoPrincipal?.destreza ?? 0,
      cd: derived?.cdBase ?? 0,
      trType: "fortitude",
      range: "1,5m",
      area: "",
      damage: {
        numDice: parsed?.numDice ?? 0,
        dieSize: parsed?.dieSize ?? 8,
        mod: parsed?.mod ?? 0,
        type: "cortante",
        isNarrativePhysical: false,
        roll: suggested?.roll ?? "",
        average: suggested?.avg ?? 0,
      },
      condition: { tier: "nenhuma", name: "", nameKey: "", payment: "pe" },
      cost: 0,
      description: "",
    };
  });

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const updateDamage = (patch) =>
    setForm((prev) => {
      const dmg = { ...prev.damage, ...patch };
      dmg.roll    = rollStr(dmg.numDice, dmg.dieSize, dmg.mod);
      dmg.average = rollAverage(deriveFinalDice(dmg), dmg.dieSize, dmg.mod);
      return { ...prev, damage: dmg };
    });

  const updateCond = (patch) =>
    setForm((prev) => ({ ...prev, condition: { ...prev.condition, ...patch } }));

  return (
    <div className="bg-slate-950/70 border border-purple-900/50 rounded p-4 space-y-3">
      <h4 className="text-sm font-bold text-purple-300 flex items-center gap-2">
        <Plus className="w-4 h-4" /> Nova Ação
      </h4>

      <ActionFormFields form={form} update={update} updateDamage={updateDamage} updateCond={updateCond} />

      {form.name?.trim() && (
        <div className="bg-slate-900/60 border border-slate-700 rounded p-3">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 font-bold">Preview</div>
          <p className="text-xs text-slate-300 leading-relaxed">{humanizeAction(form)}</p>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <SmallButton onClick={onCancel}>Cancelar</SmallButton>
        <SmallButton onClick={() => onAdd(form)} variant="primary" disabled={!form.name.trim()}>
          <Plus className="w-3 h-3" /> Adicionar
        </SmallButton>
      </div>
    </div>
  );
}

// ============================================================
// FORM FIELDS — compartilhado entre ActionItem e ActionForm
// ============================================================
function ActionFormFields({ form, update, updateDamage, updateCond }) {
  const isTR      = form.attackType?.startsWith("tr_");
  const isAcerto  = form.attackType === "acerto";
  const hasDamage = form.attackType !== "suporte";
  const hasCond   = form.condition?.tier && form.condition.tier !== "nenhuma";

  // Estado derivado — calculado aqui para exibição
  const baseDice  = form.damage?.numDice ?? 0;
  const isPhysical = form.damage?.isNarrativePhysical ?? false;
  const finalDice = isPhysical ? Math.max(0, baseDice - 2) : baseDice;
  const dieSize   = form.damage?.dieSize ?? 8;
  const mod       = form.damage?.mod ?? 0;

  const condPE  = deriveCondPE(form.condition);
  const finalPE = deriveFinalPE(form.cost, form.condition);
  const isCondND = hasCond && form.condition?.payment === "nd";

  const handleCondNameKey = (key) => {
    if (key === "outro") {
      updateCond({ nameKey: "outro", name: "" });
    } else {
      updateCond({ nameKey: key, name: key });
    }
  };

  return (
    <div className="space-y-3">
      {/* Nome + Tipo de execução */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <FieldLabel required>Nome da Ação</FieldLabel>
          <TextInput value={form.name} onChange={(v) => update({ name: v })} placeholder="Ex: Garra Lacerante" />
        </div>
        <div>
          <FieldLabel>Tipo de Execução</FieldLabel>
          <Select value={form.type} onChange={(v) => update({ type: v })} options={ACTION_TYPE_OPTIONS} />
        </div>
      </div>

      {/* Tipo de ataque + custo com total derivado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <FieldLabel>Tipo de Ataque / Efeito</FieldLabel>
          <Select value={form.attackType} onChange={(v) => update({ attackType: v })} options={ATTACK_TYPE_OPTIONS} />
        </div>
        <div>
          <FieldLabel hint={condPE > 0 ? `+${condPE} da condição` : undefined}>
            Custo Base em PE
          </FieldLabel>
          <NumberInput value={form.cost} onChange={(v) => update({ cost: v })} min={0} />
          {condPE > 0 && (
            <div className="mt-1 text-xs flex items-center gap-1">
              <span className="text-purple-300 font-semibold">Total: {finalPE} PE</span>
              <span className="text-slate-500">({form.cost} base + {condPE} condição)</span>
            </div>
          )}
        </div>
      </div>

      {/* TR ou Acerto */}
      {isTR && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Tipo de TR</FieldLabel>
            <Select value={form.trType} onChange={(v) => update({ trType: v })} options={TR_TYPE_OPTIONS} />
          </div>
          <div>
            <FieldLabel>CD</FieldLabel>
            <NumberInput value={form.cd} onChange={(v) => update({ cd: v })} min={0} />
          </div>
        </div>
      )}
      {isAcerto && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Bônus de Acerto</FieldLabel>
            <NumberInput value={form.toHit} onChange={(v) => update({ toHit: v })} />
          </div>
          <div />
        </div>
      )}

      {/* Alcance e Área */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel hint="Ex: 1,5m / 18m">Alcance</FieldLabel>
          <TextInput value={form.range} onChange={(v) => update({ range: v })} placeholder="1,5m" />
        </div>
        <div>
          <FieldLabel hint="Ex: 6m / 9m">Área</FieldLabel>
          <TextInput value={form.area} onChange={(v) => update({ area: v })} placeholder="—" />
        </div>
      </div>

      {/* Dano base */}
      {hasDamage && (
        <div className="bg-slate-900/60 border border-slate-800 rounded p-3 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dano Base</div>
          <div className="grid grid-cols-4 gap-2">
            <div>
              <FieldLabel>Nº Dados</FieldLabel>
              <NumberInput value={baseDice} onChange={(v) => updateDamage({ numDice: v })} min={0} />
            </div>
            <div>
              <FieldLabel>Dado</FieldLabel>
              <select
                value={dieSize}
                onChange={(e) => updateDamage({ dieSize: parseInt(e.target.value) })}
                className="w-full h-9 bg-slate-950 border border-slate-700 rounded px-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              >
                {DIE_SIZES.map((d) => <option key={d} value={d}>d{d}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Fixo</FieldLabel>
              <NumberInput value={mod} onChange={(v) => updateDamage({ mod: v })} />
            </div>
            <div>
              <FieldLabel>Tipo</FieldLabel>
              <Select
                value={form.damage?.type ?? "cortante"}
                onChange={(v) => updateDamage({ type: v })}
                options={DAMAGE_TYPE_OPTIONS}
              />
            </div>
          </div>

          {/* Preview com dados derivados */}
          {(baseDice > 0 || mod !== 0) && (
            <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
              {isPhysical && baseDice !== finalDice ? (
                <>
                  <span>
                    Base:{" "}
                    <span className="font-mono line-through text-slate-600">
                      {rollStr(baseDice, dieSize, mod)}
                    </span>
                  </span>
                  <span className="text-amber-400">→</span>
                  <span>
                    Final:{" "}
                    <span className="font-mono text-white font-bold">
                      {rollStr(finalDice, dieSize, mod)}
                    </span>
                    <span className="ml-1 text-amber-400 text-[10px]">(-2 dados)</span>
                  </span>
                </>
              ) : (
                <span>
                  Rolagem:{" "}
                  <span className="font-mono text-white">{rollStr(finalDice, dieSize, mod)}</span>
                </span>
              )}
              <span className="text-slate-500">
                (méd. {rollAverage(finalDice, dieSize, mod)})
              </span>
            </div>
          )}

          {/* Checkbox Ataque Físico Narrativo */}
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isPhysical}
              onChange={(e) => updateDamage({ isNarrativePhysical: e.target.checked })}
              className="w-4 h-4 accent-purple-600 cursor-pointer rounded"
            />
            <span>Ataque Físico Narrativo (Soco/Chute)</span>
            <span className="text-slate-600">— subtrai 2 dados automaticamente</span>
          </label>
        </div>
      )}

      {/* Condição */}
      <div className="bg-slate-900/60 border border-slate-800 rounded p-3 space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Condição (Opcional)</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel>Força da Condição</FieldLabel>
            <Select
              value={form.condition?.tier ?? "nenhuma"}
              onChange={(v) => updateCond({ tier: v })}
              options={CONDITION_TIER_OPTIONS}
            />
          </div>
          {hasCond && (
            <div>
              <FieldLabel>Método de Custo</FieldLabel>
              <Select
                value={form.condition?.payment ?? "pe"}
                onChange={(v) => updateCond({ payment: v })}
                options={CONDITION_PAYMENT_OPTIONS}
              />
            </div>
          )}
        </div>

        {/* Select de condição + input customizado */}
        {hasCond && (
          <div className="space-y-2">
            <div>
              <FieldLabel>Nome da Condição</FieldLabel>
              <select
                value={form.condition?.nameKey ?? ""}
                onChange={(e) => handleCondNameKey(e.target.value)}
                className="w-full h-9 bg-slate-950 border border-slate-700 rounded px-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              >
                {CONDITION_NAME_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {form.condition?.nameKey === "outro" && (
              <div>
                <FieldLabel hint="campo livre">Nome Customizado</FieldLabel>
                <TextInput
                  value={form.condition?.name ?? ""}
                  onChange={(v) => updateCond({ name: v })}
                  placeholder="Descreva a condição..."
                />
              </div>
            )}
          </div>
        )}

        {/* Banner de aviso para redução de ND */}
        {isCondND && (
          <div className="bg-amber-950/30 border border-amber-700/50 rounded p-2.5 flex items-start gap-2 mt-1">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300 leading-relaxed">
              <strong>Atenção:</strong> Você selecionou a redução de ND. Lembre-se de ajustar os dados e o dano
              fixo baseando-se em{" "}
              <strong>{CONDITION_ND_COST[form.condition.tier] ?? "?"} ND(s)</strong> abaixo do ND atual da
              criatura, conforme a tabela.
            </p>
          </div>
        )}
      </div>

      {/* Descrição extra */}
      <div>
        <FieldLabel hint="narração livre do efeito">Descrição Extra</FieldLabel>
        <TextArea
          value={form.description}
          onChange={(v) => update({ description: v })}
          rows={2}
          placeholder="Ex: Conjura uma bola de fogo na palma da mão..."
        />
      </div>

      <RulesReference attackType={form.attackType} conditionTier={form.condition?.tier} />
    </div>
  );
}

// ============================================================
// REFERÊNCIA DE REGRAS
// ============================================================
function RulesReference({ attackType, conditionTier }) {
  const tips = [];

  if (attackType === "tr_individual")
    tips.push("TR Individual: falha = dano completo, sucesso = dano -1 ND.");
  else if (attackType === "tr_area")
    tips.push("TR em Área: falha = dano completo, sucesso = metade do dano.");

  if (conditionTier && conditionTier !== "nenhuma") {
    const pe = CONDITION_PE_COST[conditionTier];
    const nd = CONDITION_ND_COST[conditionTier];
    tips.push(
      `Condição ${CONDITION_TIER_LABELS[conditionTier]}: pagar ${pe} PE ou reduzir ${nd} ND do dano.`
    );
  }

  if (!tips.length) return null;

  return (
    <div className="bg-blue-950/30 border border-blue-900/40 rounded p-2.5 space-y-1">
      {tips.map((tip, i) => (
        <div key={i} className="flex items-start gap-2 text-[11px] text-blue-300">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-400" />
          {tip}
        </div>
      ))}
    </div>
  );
}
