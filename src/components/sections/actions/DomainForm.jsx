import React, { useState } from "react";
import { Sparkles, Plus, Trash2, Lock, Unlock, ChevronDown, ChevronUp, BookOpen, X } from "lucide-react";
import { FieldLabel, TextInput, TextArea, Select, SmallButton, Pill } from "../../builder-controls";
import DomainText from "./DomainText";
import { useTemplates } from "../../useTemplates";
import {
  BLANK_DOMAIN,
  normalizeDomain,
  newEffect,
  getMaxEffects,
  getDomainVersion,
  getAvailableVersions,
  getDomainVersionLabel,
  getDomainCost,
  getDomainDuration,
  getEffectiveDistance,
  getEffectiveBarrierHp,
  getDomainSizeHpDelta,
  DOMAIN_SIZE_MIN,
  DOMAIN_SIZE_MAX,
  DOMAIN_SIZE_DEFAULT,
  usedEffectSlots,
  DOMAIN_BASE_EFFECTS,
  DOMAIN_EFFECTS,
  DOMAIN_CATEGORY_OPTIONS,
  getTypeOptions,
  isFreeformCategory,
  effectValueText,
  getEffectLabel,
  generateDomainText,
} from "../../fm-domain-calc";
import { hasAcertoGarantido, hasModificacaoCompleta } from "../../fm-aptidoes";

// ============================================================
// DOMAIN FORM — Criação de Expansão de Domínio (aba de Ações)
// ============================================================
// Tipo de ação próprio, separado do ActionForm (que é todo orientado a
// dano/TR/conversões). Só renderiza quando a ficha tem a Característica
// Especial "Expansão de Domínio" — o gating fica no SectionActions.
//
// Os valores dos efeitos saem das tabelas do guia indexadas pelo Nível de
// Aptidão em Domínio (DOM) cru. Ao salvar, o texto resolvido é congelado em
// `finalText` (snapshot), coerente com o resto das ações.
export default function DomainForm({
  draft, derived, onAdd, onCancel, initialAction = null,
  title = "Nova Expansão de Domínio", submitLabel = "Adicionar",
  templateMode = false,
}) {
  const dom = Number(draft?.aptidoes?.dom) || 0;
  const bar = Number(draft?.aptidoes?.bar) || 0;
  const nd = Number(draft?.core?.nd) || 0;
  const bt = Number(derived?.bt) || 2;
  const maxEffects = getMaxEffects(dom);
  const availableVersions = getAvailableVersions(nd);

  const agUnlocked = hasAcertoGarantido(draft?.aptidoesEspeciais);
  const mcUnlocked = hasModificacaoCompleta(draft?.aptidoesEspeciais);

  // Modelos de Expansão salvos (Biblioteca) — para aplicar/replicar.
  const { templates, removeTemplate } = useTemplates("expansao");
  const [showTemplates, setShowTemplates] = useState(false);

  const [form, setForm] = useState(() =>
    initialAction ? normalizeDomain(initialAction) : { ...BLANK_DOMAIN }
  );
  // Versão escolhida: a do form (se ainda disponível no ND) ou a derivada.
  const versao = (form.versao && availableVersions.some((v) => v.value === form.versao))
    ? form.versao
    : getDomainVersion(nd);

  // Texto Final manual (igual Ações): travado = automático; destravado = manual.
  const [manualLocked, setManualLocked] = useState(() => !initialAction?.finalTextManual?.trim());
  const [manualText, setManualText] = useState(() => initialAction?.finalTextManual ?? "");

  // Efeitos recolhidos (por id) — sempre começam TODOS recolhidos.
  const [collapsed, setCollapsed] = useState(
    () => new Set((initialAction ? normalizeDomain(initialAction).effects : []).map((e) => e.id))
  );
  const toggleCollapsed = (id) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const used = usedEffectSlots(form.effects);
  const remaining = maxEffects - used;
  const agActive = agUnlocked && form.acertoGarantido.ativo;
  const cost = getDomainCost(versao, agActive);
  const dist = getEffectiveDistance(form, { nd, bt, hasMC: mcUnlocked });
  const dur = getDomainDuration(dom, versao);
  const barrierHp = versao ? getEffectiveBarrierHp(form, { bar, nd }) : null;
  const barrierLabel = versao === "sem_barreiras" ? "Vida do Totem" : "Vida da Barreira";

  const addEffect = () => {
    if (remaining < 1) return;
    const eff = newEffect();
    update({ effects: [...form.effects, eff] });
    // Nasce recolhido — dá espaço para o próximo.
    setCollapsed((prev) => new Set(prev).add(eff.id));
  };
  const updateEffect = (id, patch) =>
    update({
      effects: form.effects.map((e) => {
        if (e.id !== id) return e;
        const next = { ...e, ...patch };
        // Ao trocar de categoria, reseta o tipo para o primeiro válido.
        if ("category" in patch) {
          next.type = isFreeformCategory(patch.category)
            ? ""
            : Object.keys(DOMAIN_EFFECTS[patch.category].types)[0];
        }
        return next;
      }),
    });
  const removeEffect = (id) => update({ effects: form.effects.filter((e) => e.id !== id) });

  const updateAG = (patch) => update({ acertoGarantido: { ...form.acertoGarantido, ...patch } });
  const updateMC = (patch) => update({ modificacaoCompleta: { ...form.modificacaoCompleta, ...patch } });

  const finalText = generateDomainText({ ...form, versao }, { dom, nd, bt, bar, hasMC: mcUnlocked });
  // Prévia resolvida do texto manual (mesmo render do automático).
  const manualPreview = !manualLocked ? manualText : "";

  const toggleManual = () => {
    if (manualLocked) {
      setManualText(finalText); // semeia o editor com o texto automático atual
      setManualLocked(false);
    } else {
      setManualLocked(true);
    }
  };

  const applyTemplate = (tpl) => {
    const loaded = normalizeDomain(tpl);
    setForm(loaded);
    setCollapsed(new Set(loaded.effects.map((e) => e.id)));
    setManualText(tpl.finalTextManual ?? "");
    setManualLocked(!tpl.finalTextManual?.trim());
    setShowTemplates(false);
  };

  const canSubmit = form.name.trim() && versao;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onAdd({
      ...form,
      kind: "expansao_dominio",
      type: "comum",
      versao,
      cost,
      finalText,
      finalTextManual: manualLocked ? "" : manualText,
      // Snapshot do contexto p/ reabrir a edição na Biblioteca com os valores
      // certos (reresolvido na criatura ao aplicar).
      calc: { dom, nd, bt, bar },
    });
  };

  return (
    <div className="bg-slate-950/70 border border-rose-900/50 rounded p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> {title}
        </h4>
        {!templateMode && templates.length > 0 && (
          <button
            type="button"
            onClick={() => setShowTemplates((s) => !s)}
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors focus:outline-none ${
              showTemplates ? "bg-amber-900/40 text-amber-300 border border-amber-800/60"
                : "text-slate-400 hover:text-amber-300 hover:bg-slate-800"
            }`}
          >
            <BookOpen className="w-3 h-3" /> Modelos ({templates.length})
          </button>
        )}
      </div>

      {showTemplates && (
        <div className="bg-slate-950 border border-slate-700 rounded overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Modelos de Expansão</span>
            <button type="button" onClick={() => setShowTemplates(false)} className="text-slate-600 hover:text-slate-300"><X className="w-3 h-3" /></button>
          </div>
          <div className="overflow-y-auto max-h-44 divide-y divide-slate-800/60">
            {templates.map((tpl) => (
              <div key={tpl.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-800/60 group">
                <button type="button" onClick={() => applyTemplate(tpl)} className="flex-1 min-w-0 text-left">
                  <span className="text-sm text-slate-200 truncate block group-hover:text-white">{tpl.name || "(sem nome)"}</span>
                </button>
                {tpl.versao && <Pill color="rose">{getDomainVersionLabel(tpl.versao)}</Pill>}
                <button type="button" onClick={() => removeTemplate(tpl.id)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0" title="Remover modelo"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cabeçalho: versão + limite + duração/distância/custo */}
      <div className="bg-slate-900/60 border border-slate-800 rounded p-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500">Versão:</span>
          {versao ? (
            <div className="max-w-[200px]">
              <Select value={versao} onChange={(v) => update({ versao: v })} options={availableVersions} />
            </div>
          ) : (
            <span className="text-red-400 font-semibold">indisponível (requer ND 8+)</span>
          )}
          <span className="text-slate-600">·</span>
          <span className="text-slate-500">Nível de Domínio:</span>
          <span className="text-rose-200 font-mono font-semibold">{dom}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] font-mono">
          <span className="text-slate-500">Execução: <span className="text-slate-300">Duas Ações Comuns</span></span>
          <span className="text-slate-500">Custo: <span className="text-purple-300">{cost} PE</span>{agActive && <span className="text-slate-600"> (+5 Acerto Garantido)</span>}</span>
          <span className="text-slate-500">Duração: <span className="text-slate-300">{dur} rodada{dur !== 1 ? "s" : ""}</span></span>
          <span className="text-slate-500">
            Distância: <span className="text-slate-300">{dist}</span>
            {versao === "sem_barreiras" && mcUnlocked && <span className="text-fuchsia-300/80"> (dobrada por Modif. Completa)</span>}
          </span>
          {barrierHp != null && (
            <span className="text-slate-500">{barrierLabel}: <span className="text-slate-300">{barrierHp}</span></span>
          )}
        </div>
        <div className="text-[11px] text-slate-400">
          Efeitos de Expansão: <span className="font-mono text-white">{used}/{maxEffects}</span>
          {versao === "incompleta" && (
            <span className="text-amber-400/90 ml-2">Incompleta: efeitos limitados ao nível de aptidão 3.</span>
          )}
        </div>
        {/* Efeitos base automáticos (apenas referência — não automatizados) */}
        <details className="text-[11px] text-slate-400">
          <summary className="cursor-pointer text-slate-500 hover:text-slate-300 select-none">
            Efeitos base da abertura (sempre aplicados)
          </summary>
          <ul className="mt-1.5 space-y-1 list-disc list-inside marker:text-rose-500/70">
            {DOMAIN_BASE_EFFECTS.map((b, i) => (
              <li key={i} className="leading-snug pl-1">{b}</li>
            ))}
          </ul>
        </details>
      </div>

      {/* Nome + Descrição (lore) */}
      <div>
        <FieldLabel required>Nome da Expansão</FieldLabel>
        <TextInput value={form.name} onChange={(v) => update({ name: v })} placeholder="Ex: Santuário Malevolente" />
      </div>
      <div>
        <FieldLabel hint="aparece no topo, sob o título">Descrição</FieldLabel>
        <TextArea
          value={form.lore}
          onChange={(v) => update({ lore: v })}
          rows={2}
          placeholder="Ex: Puro Amor Mútuo é a expansão de domínio de Yuta Okkotsu, usuário da técnica Cópia..."
        />
      </div>

      {/* Efeitos de Expansão */}
      <div className="bg-slate-900/60 border border-slate-800 rounded p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Efeitos de Expansão</div>
          <SmallButton
            onClick={addEffect}
            variant="primary"
            disabled={remaining < 1}
            title={remaining < 1 ? "Limite de efeitos atingido para este Nível de Domínio" : "Adicionar efeito"}
          >
            <Plus className="w-3 h-3" /> Adicionar Efeito
          </SmallButton>
        </div>

        {form.effects.length === 0 && (
          <p className="text-xs text-slate-600 italic">Nenhum efeito de expansão adicionado.</p>
        )}

        {form.effects.map((eff) => {
          const cat = DOMAIN_EFFECTS[eff.category];
          const typeDef = cat?.types?.[eff.type];
          const freeform = isFreeformCategory(eff.category);
          const value = effectValueText(eff, dom, versao);
          // Habilita Fortalecer só se já está ligado ou há folga de 1 efeito.
          const canReinforce = eff.fortalecido || remaining >= 1;
          const isCollapsed = collapsed.has(eff.id);
          const summary = eff.nome?.trim() || getEffectLabel(eff);
          return (
            <div key={eff.id} className="bg-slate-950/50 border border-slate-800 rounded">
              {/* Cabeçalho retrátil */}
              <div className="flex items-center gap-2 p-2">
                <button
                  type="button"
                  onClick={() => toggleCollapsed(eff.id)}
                  className="flex-1 flex items-center gap-1.5 text-left min-w-0 text-slate-300 hover:text-white"
                  title={isCollapsed ? "Expandir" : "Recolher"}
                >
                  {isCollapsed ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" /> : <ChevronUp className="w-3.5 h-3.5 flex-shrink-0" />}
                  <span className="text-xs font-semibold truncate">{summary}</span>
                  {eff.fortalecido && <span className="text-[9px] text-rose-300 font-bold flex-shrink-0">×1,5</span>}
                  {isCollapsed && value && <span className="text-[10px] text-slate-500 font-mono truncate">· {value}</span>}
                </button>
                <button
                  type="button"
                  onClick={() => removeEffect(eff.id)}
                  className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Remover efeito"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {!isCollapsed && (
              <div className="px-2.5 pb-2.5 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <FieldLabel>Categoria</FieldLabel>
                  <Select
                    value={eff.category}
                    onChange={(v) => updateEffect(eff.id, { category: v })}
                    options={DOMAIN_CATEGORY_OPTIONS}
                  />
                </div>
                {!freeform && (
                  <div>
                    <FieldLabel>Tipo</FieldLabel>
                    <Select
                      value={eff.type}
                      onChange={(v) => updateEffect(eff.id, { type: v })}
                      options={getTypeOptions(eff.category)}
                    />
                  </div>
                )}
              </div>

              <div>
                <FieldLabel hint="opcional: aparece como título do efeito">Nome do Efeito</FieldLabel>
                <TextInput
                  value={eff.nome}
                  onChange={(v) => updateEffect(eff.id, { nome: v })}
                  placeholder={freeform ? "Ex: Cemitério das Espadas" : `Padrão: ${typeDef?.label ?? ""}`}
                />
              </div>

              {/* Valor resolvido (tabela × DOM) */}
              {!freeform && (
                <div className="text-[11px] text-slate-400">
                  Valor (DOM {dom}): <span className="text-rose-200 font-semibold">{value}</span>
                </div>
              )}
              {typeDef?.hint && <p className="text-[10px] text-slate-500 leading-snug">{typeDef.hint}</p>}

              <div>
                <FieldLabel hint={freeform ? "descreva a mecânica" : "opcional: substitui a frase padrão"}>
                  {freeform ? "Descrição do Efeito Especial" : "Descrição (opcional)"}
                </FieldLabel>
                <TextArea
                  value={eff.descricao}
                  onChange={(v) => updateEffect(eff.id, { descricao: v })}
                  rows={freeform ? 3 : 2}
                  placeholder={freeform
                    ? "Mecânica única feita entre Jogador e Narrador..."
                    : "Deixe em branco para usar a frase padrão, ou escreva a sua (ex: restrito aos Feitiços 'Clivar' e 'Desmantelar')."}
                />
              </div>

              {!freeform && (
                <label className={`flex items-center gap-2 text-[11px] cursor-pointer ${canReinforce ? "text-slate-300" : "text-slate-600 cursor-not-allowed"}`}>
                  <input
                    type="checkbox"
                    checked={!!eff.fortalecido}
                    disabled={!canReinforce}
                    onChange={(e) => updateEffect(eff.id, { fortalecido: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-600 text-rose-600 focus:ring-rose-500 disabled:opacity-40"
                  />
                  Fortalecer (×1,5 no efeito; custa 2 efeitos)
                </label>
              )}
              </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Acerto Garantido — só com a aptidão (não conta no limite) */}
      {agUnlocked && (
        <div className="bg-rose-950/20 border border-rose-900/50 rounded p-3 space-y-2">
          <label className="flex items-center gap-2 text-xs font-bold text-rose-300 cursor-pointer">
            <input
              type="checkbox"
              checked={!!form.acertoGarantido.ativo}
              onChange={(e) => updateAG({ ativo: e.target.checked })}
              className="rounded bg-slate-950 border-slate-600 text-rose-600 focus:ring-rose-500"
            />
            <Sparkles className="w-3.5 h-3.5" /> Acerto Garantido
            <span className="text-[10px] text-slate-500 font-normal">(efeito extra, +5 PE, não conta no limite)</span>
          </label>
          {form.acertoGarantido.ativo && (
            <div className="pl-1">
              <FieldLabel hint="ex: qualquer técnica copiada; a condição Paralisia...">O que é garantido</FieldLabel>
              <TextInput
                value={form.acertoGarantido.escopo}
                onChange={(v) => updateAG({ escopo: v })}
                placeholder="Defina o efeito/grupo garantido (deixe em branco para texto genérico)..."
              />
            </div>
          )}
        </div>
      )}

      {/* Modificação Completa — só com a aptidão E só na Expansão Completa.
          (Na Incompleta não modifica nada; na Sem Barreiras só dobra a
          distância, o que já é automático no cabeçalho.) */}
      {mcUnlocked && versao === "completa" && (
        <div className="bg-slate-900/60 border border-slate-800 rounded p-3 space-y-2.5">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" /> Modificação Completa
          </div>

          <div>
            <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.modificacaoCompleta.inversaoResistencia}
                onChange={(e) => updateMC({ inversaoResistencia: e.target.checked })}
                className="rounded bg-slate-950 border-slate-600 text-fuchsia-600 focus:ring-fuchsia-500"
              />
              Inversão de Resistência
            </label>
            <p className="text-[10px] text-slate-500 leading-snug mt-1 pl-6">
              Por padrão, atacada pelo interior a expansão é resistente a todo tipo de dano (resistência interna não pode ser ignorada). A Inversão move essa resistência do interior para o exterior.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.modificacaoCompleta.mudancaTamanho}
                onChange={(e) => updateMC({ mudancaTamanho: e.target.checked })}
                className="rounded bg-slate-950 border-slate-600 text-fuchsia-600 focus:ring-fuchsia-500"
              />
              Mudança de Tamanho
            </label>
            {form.modificacaoCompleta.mudancaTamanho && (() => {
              const tam = Number(form.modificacaoCompleta.tamanho) || DOMAIN_SIZE_DEFAULT;
              const delta = getDomainSizeHpDelta(tam);
              const setTam = (v) => updateMC({ tamanho: Math.min(DOMAIN_SIZE_MAX, Math.max(DOMAIN_SIZE_MIN, v)) });
              const stepBtn = "w-6 h-6 flex items-center justify-center rounded border border-slate-600 text-white text-sm font-bold hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed";
              return (
                <div className="mt-2 pl-6 flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-slate-400">Área:</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setTam(tam - 1.5)} disabled={tam <= DOMAIN_SIZE_MIN} className={stepBtn}>−</button>
                    <span className="w-14 text-center text-xs font-mono text-fuchsia-200">{Number.isInteger(tam) ? tam : tam.toString().replace(".", ",")} m</span>
                    <button type="button" onClick={() => setTam(tam + 1.5)} disabled={tam >= DOMAIN_SIZE_MAX} className={stepBtn}>+</button>
                  </div>
                  <span className={`text-[11px] font-semibold ${delta > 0 ? "text-emerald-300" : delta < 0 ? "text-red-300" : "text-slate-500"}`}>
                    {delta > 0 ? "+" : ""}{delta} PV {delta === 0 ? "(padrão)" : "de barreira"}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Texto Final — automático (gerado) ou manual (editável) */}
      <div className="bg-slate-900/60 border border-slate-700 rounded p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            <Lock className="w-3 h-3" /> Texto Final
          </div>
          <button
            type="button"
            onClick={toggleManual}
            title={manualLocked ? "Editar manualmente" : "Voltar ao texto automático"}
            style={{
              borderColor: manualLocked ? "rgb(71 85 105)" : "rgb(217 119 6 / 0.6)",
              color:       manualLocked ? "rgb(100 116 139)" : "rgb(251 191 36)",
              background:  manualLocked ? "transparent" : "rgb(120 53 15 / 0.2)",
            }}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] transition-colors"
          >
            {manualLocked ? <><Lock className="w-3 h-3" /> Auto</> : <><Unlock className="w-3 h-3" /> Manual</>}
          </button>
        </div>

        {manualLocked ? (
          <DomainText text={finalText} name={form.name} versaoLabel={getDomainVersionLabel(versao)} lore={form.lore} />
        ) : (
          <div className="space-y-2">
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              rows={10}
              className="w-full bg-slate-950 border border-amber-700/60 rounded px-2.5 py-2 text-[11px] text-slate-300 leading-relaxed resize-y focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
            />
            <div className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5">
              <div className="text-[9px] uppercase tracking-widest text-slate-600 font-bold mb-0.5">Prévia</div>
              <DomainText text={manualPreview} name={form.name} versaoLabel={getDomainVersionLabel(versao)} lore={form.lore} />
            </div>
            <p className="text-[10px] text-amber-500/70 italic">
              Mantenha as linhas iniciadas em “●” para os efeitos continuarem destacados. Feche o cadeado para voltar ao automático.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <SmallButton onClick={onCancel}>Cancelar</SmallButton>
        <SmallButton onClick={handleSubmit} variant="primary" disabled={!canSubmit}>
          <Plus className="w-3 h-3" /> {submitLabel}
        </SmallButton>
      </div>
    </div>
  );
}
