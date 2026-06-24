// fm-automation-entities.js
// ============================================================
// Resolução UNIFICADA das automações de uma criatura (snapshot) — fonte única
// usada pelo tracker (CombatantPanel) E pelo avanço de rodada (single E multi),
// pra que round_start e cia. funcionem igual nos dois modos.
// ============================================================
import { buildCatalogAutomation, collectRoundStartResources } from "./fm-automation";
import { isDomainAction, domainAutomation } from "./fm-domain-calc";
import { getAptidaoByKey } from "./fm-aptidoes";
import { getCaracteristicaByKey } from "./fm-caracteristicas";
import { getDoteByKey } from "./fm-dotes";
import { getTreinamentoByKey } from "./fm-treinamentos";
import { buildDslContext } from "./fm-dsl";

// Automação EFETIVA de uma instância de catálogo: custom usa a do usuário;
// oficial usa a `motorAuto` interna (por key). Oficiais ABERTAS (userAutomatable)
// mesclam a do catálogo com a que o usuário criou na instância.
function resolveCatalogAutomation(instance, getByKey, ctx) {
  if (!instance) return null;
  if (instance.tipo === "custom") return instance.automation ?? null;
  const entry = instance.key ? getByKey?.(instance.key) : null;
  const catalogAuto = buildCatalogAutomation(entry, instance, ctx);
  if (entry?.userAutomatable && (instance.automation?.rules?.length ?? 0) > 0) {
    const rules = [...(catalogAuto?.rules ?? []), ...instance.automation.rules];
    return rules.length ? { enabled: true, rules } : null;
  }
  return catalogAuto;
}

// Lista [{ id, name, automation, __autoGroup }] de TODAS as entidades com
// automação efetiva. __autoGroup = categoria de origem (empilhamento "maior
// vence" por grupo). Expansão de Domínio é sintetizada das tabelas + manual.
export function collectAutomationEntities(snapshot = {}) {
  const ctx = { core: snapshot.core, attributes: snapshot.attributes, aptidoes: snapshot.aptidoes };
  const out = [];

  // Características Personalizadas + features de origem (automation já pronta).
  for (const f of (snapshot.features ?? [])) {
    out.push({ id: f.id, name: f.name, automation: f.automation ?? null, __autoGroup: "caracteristica" });
  }

  // Ações (Expansão de Domínio = sintetizada das tabelas + bloquinhos manuais).
  for (const a of (snapshot.actions?.list ?? [])) {
    let automation = a.automation ?? null;
    if (isDomainAction(a)) {
      const synth = domainAutomation(a, { dom: snapshot.aptidoes?.dom ?? 0, nd: snapshot.core?.nd ?? 0 });
      const rules = [...(synth?.rules ?? []), ...(a.automation?.rules ?? [])];
      automation = rules.length ? { enabled: true, rules } : (a.automation ?? null);
    }
    out.push({ id: a.id, name: a.name, automation, __autoGroup: "acao" });
  }

  const cat = (arr, group, getByKey) => {
    for (const x of (arr ?? [])) {
      out.push({ id: x.id, name: x.nome, automation: resolveCatalogAutomation(x, getByKey, ctx), __autoGroup: group });
    }
  };
  cat(snapshot.aptidoesEspeciais, "aptidao", getAptidaoByKey);
  cat(snapshot.caracteristicas, "caracteristica", getCaracteristicaByKey);
  cat(snapshot.dotes, "dote", getDoteByKey);
  cat(snapshot.treinamentos, "treinamento", getTreinamentoByKey);
  return out;
}

// Drena `amount` do PE temporário (peTempSources), gastando-o ANTES do PE base.
// Reduz as fontes em ordem; remove as zeradas. Retorna o novo mapa de fontes.
// Como o gasto reduz a fonte, o round_start seguinte volta a topá-la (refila).
export function drainPeTemp(sources, amount) {
  const out = { ...(sources || {}) };
  let rem = Math.max(0, Number(amount) || 0);
  for (const k of Object.keys(out)) {
    if (rem <= 0) break;
    const take = Math.min(out[k], rem);
    out[k] -= take; rem -= take;
    if (out[k] <= 0) delete out[k];
  }
  return out;
}

// Aplica os recursos de round_start (Treino de Energia/Potencial Físico = +PE
// temp por rodada, etc.) sobre um combatState. PE temporário é rastreado por
// FONTE (`peTempSources`): a MESMA fonte não acumula — sobe só o maior (aplica
// só a diferença). hp_temp soma em hpCurrent (overflow). Puro. Retorna
// { combatState, peGain }. Usado por single (newRound) e multi (useEncounter).
export function applyRoundStartResources(combatState, snapshot) {
  if (!combatState || !snapshot) return { combatState, peGain: 0 };
  const entities = collectAutomationEntities(snapshot);
  const ctx = buildDslContext(snapshot, combatState);
  const changes = collectRoundStartResources(entities, ctx);
  if (!changes.length) return { combatState, peGain: 0 };

  const next = { ...combatState };
  const peTempSources = { ...(combatState.peTempSources || {}) };
  let peGain = 0;
  for (const ch of changes) {
    const v = Number(ch.value) || 0;
    if (ch.resource === "pe" && ch.op === "add") {
      const src = ch.source || "pe";
      const prev = peTempSources[src] || 0;
      const target = Math.max(prev, v); // mesma fonte: maior vence (não soma)
      const delta = target - prev;
      if (delta > 0) {
        next.peCurrent = Math.max(0, Math.round((next.peCurrent ?? snapshot.stats?.peMax ?? 0) + delta));
        peGain += delta;
      }
      peTempSources[src] = target;
    } else if (ch.resource === "pe") {
      const before = next.peCurrent ?? snapshot.stats?.peMax ?? 0;
      next.peCurrent = Math.max(0, Math.round(ch.op === "set" ? v : before - v));
    } else if (ch.resource === "hp_temp") {
      next.hpCurrent = Math.max(0, Math.round((next.hpCurrent ?? combatState.hpCurrent ?? 0) + v));
    }
  }
  next.peTempSources = peTempSources;
  return { combatState: next, peGain };
}
