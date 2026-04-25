import React, { useState } from "react";
import { Plus, Trash2, Copy, Swords, Dices } from "lucide-react";
import { FieldLabel, TextInput, TextArea, Select, NumberInput, SmallButton, Pill } from "../builder-controls";
import { getDamage } from "../fm-tables";

const ACTION_TYPES = [
  { value: "comum",      label: "Comum" },
  { value: "bonus",      label: "Bônus" },
  { value: "rapida",     label: "Rápida" },
  { value: "movimento",  label: "Movimento" },
  { value: "reacao",     label: "Reação" },
  { value: "livre",      label: "Livre" },
];

const ATTACK_TYPES = [
  { value: "acerto",        label: "Teste de Acerto" },
  { value: "tr_individual", label: "TR Individual" },
  { value: "tr_area",       label: "TR em Área" },
  { value: "auto",          label: "Automático" },
];

const TR_TYPES = [
  { value: "",          label: "—" },
  { value: "fortitude", label: "Fortitude" },
  { value: "reflexos",  label: "Reflexos" },
  { value: "vontade",   label: "Vontade" },
  { value: "astucia",   label: "Astúcia" },
  { value: "integridade", label: "Integridade" },
];

const DAMAGE_TYPES = [
  "cortante", "perfurante", "impacto", "queimante", "congelante",
  "chocante", "psiquico", "sonoro", "corrosivo", "radiante",
  "necrotico", "energia_amaldicoada",
];

// Extrai { numDice, dieSize, mod } de strings como "12d10+84" ou "3d8-2"
function parseRoll(roll) {
  const m = (roll ?? "").match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!m) return null;
  return { numDice: parseInt(m[1]), dieSize: parseInt(m[2]), mod: parseInt(m[3] ?? "0") };
}

// Se anchorRoll for parseável, trava numDice/dieSize e só ajusta o modificador.
// Caso contrário, calcula livremente usando dieSize.
function averageToRoll(media, anchorRoll, dieSize = 8) {
  const avg = Number(media) || 0;
  if (avg <= 0) return "";

  const anchor = parseRoll(anchorRoll);
  if (anchor) {
    const anchorAvg = anchor.numDice * (anchor.dieSize + 1) / 2 + anchor.mod;
    const newMod = Math.round(anchor.mod + (avg - anchorAvg));
    if (newMod > 0) return `${anchor.numDice}d${anchor.dieSize}+${newMod}`;
    if (newMod < 0) return `${anchor.numDice}d${anchor.dieSize}${newMod}`;
    return `${anchor.numDice}d${anchor.dieSize}`;
  }

  const dieAvg = (dieSize + 1) / 2;
  const numDice = Math.floor(avg / dieAvg);
  if (numDice === 0) return `+${Math.round(avg)}`;
  const mod = Math.round(avg - numDice * dieAvg);
  if (mod > 0) return `${numDice}d${dieSize}+${mod}`;
  if (mod < 0) return `${numDice}d${dieSize}${mod}`;
  return `${numDice}d${dieSize}`;
}

function DiceButtons({ selected, onSelect }) {
  return (
    <div className="flex gap-0.5 mt-1 flex-wrap">
      {[4, 6, 8, 10, 12].map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onSelect(d)}
          className={`px-1.5 py-0.5 text-[10px] border rounded leading-none ${
            selected === d
              ? "bg-purple-700 border-purple-500 text-white"
              : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
          }`}
          title={`Gerar rolagem com d${d}`}
        >
          d{d}
        </button>
      ))}
    </div>
  );
}

export default function SectionActions({ draft, derived, actions }) {
  const [showForm, setShowForm] = useState(false);

  const handleAdd = (newAction) => {
    actions.addAction({
      ...newAction,
      id: `act-${Date.now().toString(36)}`,
    });
    setShowForm(false);
  };

  const { total } = derived.actionsTotal
    ? { total: derived.actionsTotal }
    : { total: { comum: 1, bonus: 0, rapida: 0, movimento: 1, reacao: 1 } };

  return (
    <div className="space-y-3">
      {/* Resumo de ações disponíveis por turno */}
      <div className="bg-slate-950/60 border border-slate-800 rounded px-3 py-2 flex flex-wrap gap-2 text-xs">
        <span className="text-slate-500">Por turno:</span>
        <Pill color="rose">{total.comum} Comum</Pill>
        <Pill color="amber">{total.rapida} Rápida</Pill>
        <Pill color="sky">{total.bonus} Bônus</Pill>
        <Pill color="emerald">{total.movimento} Movimento</Pill>
        <Pill color="purple">{total.reacao} Reação</Pill>
      </div>

      {/* Lista de ações */}
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

      {/* Formulário / Botão de adicionar */}
      {showForm ? (
        <ActionForm
          derived={derived}
          draft={draft}
          onAdd={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <SmallButton onClick={() => setShowForm(true)} variant="primary">
          <Plus className="w-3 h-3" /> Adicionar Ação
        </SmallButton>
      )}
    </div>
  );
}

// ---------- Item de ação (existente) ----------
function ActionItem({ action, onUpdate, onRemove, onDuplicate }) {
  const [expanded, setExpanded] = useState(false);
  const [customRoll, setCustomRoll] = useState(false);
  const [selectedDie, setSelectedDie] = useState(() => parseRoll(action.damage?.roll)?.dieSize ?? 8);

  return (
    <div className="bg-slate-950/40 border border-slate-800 rounded">
      <div className="flex items-center gap-2 p-2">
        <Swords className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 text-left text-sm font-semibold text-white hover:text-purple-300 truncate"
        >
          {action.name || "Ação sem nome"}
        </button>
        <Pill color="slate">{action.type}</Pill>
        {action.cost > 0 && <Pill color="purple">{action.cost} PE</Pill>}
        <SmallButton onClick={onDuplicate} title="Duplicar ação">
          <Copy className="w-3 h-3" />
        </SmallButton>
        <SmallButton onClick={onRemove} variant="danger" title="Remover ação">
          <Trash2 className="w-3 h-3" />
        </SmallButton>
      </div>

      {expanded && (
        <div className="border-t border-slate-800 p-3 space-y-2">
          <TextInput
            value={action.name}
            onChange={(v) => onUpdate({ name: v })}
            placeholder="Nome da ação"
          />
          <TextArea
            value={action.description}
            onChange={(v) => onUpdate({ description: v })}
            rows={2}
            placeholder="Descrição..."
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <FieldLabel>Acerto</FieldLabel>
              <NumberInput value={action.toHit ?? 0} onChange={(v) => onUpdate({ toHit: v })} />
            </div>
            <div>
              <FieldLabel>CD</FieldLabel>
              <NumberInput value={action.cd ?? 0} onChange={(v) => onUpdate({ cd: v })} />
            </div>
            <div>
              <FieldLabel>Dano médio</FieldLabel>
              <NumberInput
                value={action.damage?.average ?? 0}
                onChange={(v) => {
                  const patch = { average: v };
                  if (!customRoll) {
                    // âncora na rolagem atual para travar numDice/dieSize
                    patch.roll = averageToRoll(v, action.damage?.roll, selectedDie);
                  }
                  onUpdate({ damage: { ...action.damage, ...patch } });
                }}
              />
            </div>
            <div>
              <FieldLabel>Rolagem</FieldLabel>
              <TextInput
                value={action.damage?.roll}
                onChange={(v) => {
                  setCustomRoll(true);
                  const parsed = parseRoll(v);
                  if (parsed) setSelectedDie(parsed.dieSize);
                  onUpdate({ damage: { ...action.damage, roll: v } });
                }}
                placeholder="2d8+5"
              />
              <DiceButtons
                selected={selectedDie}
                onSelect={(d) => {
                  setSelectedDie(d);
                  setCustomRoll(false);
                  // força novo dado sem âncora
                  onUpdate({ damage: { ...action.damage, roll: averageToRoll(action.damage?.average, null, d) } });
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Formulário de nova ação ----------
function ActionForm({ derived, draft, onAdd, onCancel }) {
  // Sugestão de dano vindo da tabela
  const suggestedDamage = getDamage(draft.core.patamar, draft.core.nd);

  const [form, setForm] = useState({
    name: "",
    type: "comum",
    attackType: "acerto",
    cost: 0,
    toHit: derived.acertoPrincipal.destreza,
    cd: derived.cdBase,
    trType: "",
    damage: suggestedDamage
      ? { average: suggestedDamage.avg, roll: suggestedDamage.roll, type: "cortante" }
      : { average: 0, roll: "", type: "cortante" },
    range: "1,5m",
    area: "",
    description: "",
  });

  const [rollCustomized, setRollCustomized] = useState(false);
  const [selectedDie, setSelectedDie] = useState(() => parseRoll(suggestedDamage?.roll)?.dieSize ?? 8);
  const anchorRoll = suggestedDamage?.roll ?? null; // âncora fixa da tabela
  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const isTR = form.attackType.startsWith("tr_");

  return (
    <div className="bg-slate-950/70 border border-purple-900/50 rounded p-4 space-y-3">
      <h4 className="text-sm font-bold text-purple-300 flex items-center gap-2">
        <Plus className="w-4 h-4" /> Nova Ação
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <FieldLabel required>Nome</FieldLabel>
          <TextInput value={form.name} onChange={(v) => update({ name: v })} placeholder="Ex: Garra Lacerante" />
        </div>

        <div>
          <FieldLabel>Tipo</FieldLabel>
          <Select value={form.type} onChange={(v) => update({ type: v })} options={ACTION_TYPES} />
        </div>

        <div>
          <FieldLabel>Custo (PE)</FieldLabel>
          <NumberInput value={form.cost} onChange={(v) => update({ cost: v })} min={0} />
        </div>

        <div>
          <FieldLabel>Modo de Ataque</FieldLabel>
          <Select value={form.attackType} onChange={(v) => update({ attackType: v })} options={ATTACK_TYPES} />
        </div>

        {isTR ? (
          <div>
            <FieldLabel>Tipo de TR</FieldLabel>
            <Select value={form.trType} onChange={(v) => update({ trType: v })} options={TR_TYPES} />
          </div>
        ) : (
          <div>
            <FieldLabel>Acerto</FieldLabel>
            <NumberInput value={form.toHit} onChange={(v) => update({ toHit: v })} />
          </div>
        )}

        {isTR && (
          <div>
            <FieldLabel>CD</FieldLabel>
            <NumberInput value={form.cd} onChange={(v) => update({ cd: v })} />
          </div>
        )}

        <div>
          <FieldLabel>Alcance</FieldLabel>
          <TextInput value={form.range} onChange={(v) => update({ range: v })} placeholder="1,5m" />
        </div>

        {form.attackType === "tr_area" && (
          <div>
            <FieldLabel>Área</FieldLabel>
            <TextInput value={form.area} onChange={(v) => update({ area: v })} placeholder="6m" />
          </div>
        )}
      </div>

      {/* Bloco de dano */}
      <div className="bg-slate-900/60 border border-slate-800 rounded p-3 space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Dices className="w-3.5 h-3.5" />
          Dano
          {suggestedDamage && (
            <span className="text-purple-400">
              (sugerido pela tabela: {suggestedDamage.roll})
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <FieldLabel>Médio</FieldLabel>
            <NumberInput
              value={form.damage.average}
              onChange={(v) => {
                const patch = { average: v };
                if (!rollCustomized) {
                  // âncora na sugestão da tabela (trava numDice/dieSize)
                  patch.roll = averageToRoll(v, anchorRoll, selectedDie);
                }
                update({ damage: { ...form.damage, ...patch } });
              }}
            />
          </div>
          <div>
            <FieldLabel>Rolagem</FieldLabel>
            <TextInput
              value={form.damage.roll}
              onChange={(v) => {
                setRollCustomized(true);
                const parsed = parseRoll(v);
                if (parsed) setSelectedDie(parsed.dieSize);
                update({ damage: { ...form.damage, roll: v } });
              }}
              placeholder="2d8+5"
            />
            {parseRoll(anchorRoll) ? (
              <div className="flex gap-0.5 mt-1">
                <span className="px-1.5 py-0.5 text-[10px] bg-slate-900 border border-slate-700 text-slate-400 rounded leading-none">
                  {parseRoll(anchorRoll).numDice}d{parseRoll(anchorRoll).dieSize} travado
                </span>
              </div>
            ) : (
              <DiceButtons
                selected={selectedDie}
                onSelect={(d) => {
                  setSelectedDie(d);
                  setRollCustomized(false);
                  update({ damage: { ...form.damage, roll: averageToRoll(form.damage.average, null, d) } });
                }}
              />
            )}
          </div>
          <div>
            <FieldLabel>Tipo</FieldLabel>
            <Select
              value={form.damage.type}
              onChange={(v) => update({ damage: { ...form.damage, type: v } })}
              options={DAMAGE_TYPES.map((t) => ({ value: t, label: t }))}
            />
          </div>
        </div>
      </div>

      <div>
        <FieldLabel>Descrição</FieldLabel>
        <TextArea
          value={form.description}
          onChange={(v) => update({ description: v })}
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <SmallButton onClick={onCancel}>Cancelar</SmallButton>
        <SmallButton
          onClick={() => onAdd(form)}
          variant="primary"
          disabled={!form.name.trim()}
        >
          <Plus className="w-3 h-3" /> Adicionar
        </SmallButton>
      </div>
    </div>
  );
}
