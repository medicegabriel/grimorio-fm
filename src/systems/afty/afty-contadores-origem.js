/**
 * ============================================================
 * CONTADORES DE ORIGEM — recurso persistente por criatura
 * ============================================================
 * Nasceu do Arauto da Corrupção (2026-09-13): um número manual (+/-) que
 * precisa (1) sobreviver a Descanso e a qualquer reset de sessão, e (2)
 * acionar efeitos por limiar (`quando: "corrupcao >= 60"`) sempre, dentro ou
 * fora de combate.
 *
 * ⚠ POR QUE NÃO É `estadosCombate`: aquele mecanismo mora em `creature.combate`
 * e o `resolveCombate` devolve tudo ZERADO para o cálculo sempre que "Em
 * Combate" está desligado (regra universal da bancada, ver afty-combate.js).
 * Um contador de personagem (não de rodada) precisa do oposto: valor estável,
 * lido sempre. Por isso ele mora direto em `creature.origemContadores`, um
 * campo de TOPO da criatura — mesma prateleira de `creature.invocacoes`, e
 * pelo mesmo motivo: sobrevive a `descansar()` porque aquela função só
 * devolve um novo `sessao`, nunca toca na criatura.
 *
 * A variável do DSL entra em `buildCriaturaDslContext` (afty-efeitos.js) via
 * `base.origemContadoresVars`, computado aqui e passado pelo afty-derive.js —
 * SEMPRE presente no contexto, nunca gated por `combate.ativo`.
 */
import { normalizarVariavel } from "./afty-dsl";

/**
 * Os contadores que os addons instalados declaram, já namespaced e filtrados
 * pela origem atual da criatura (`requerOrigem`). Espelha `estadosCombateDeAddon`
 * em afty-addons.js, só que para este mecanismo à parte.
 */
export function contadoresOrigemDeAddon(creature) {
  const origemId = creature?.core?.origem?.id ?? null;
  const out = [];
  const vistos = new Set();

  for (const pacote of Array.isArray(creature?.addons) ? creature.addons : []) {
    const pacoteId = String(pacote?.id ?? "").trim();
    if (!pacoteId) continue;
    const origensDoPacote = new Set(
      (Array.isArray(pacote?.acrescenta?.origens) ? pacote.acrescenta.origens : [])
        .map((o) => String(o?.id ?? "").trim())
        .filter(Boolean),
    );
    for (const bruto of Array.isArray(pacote?.contadoresOrigem) ? pacote.contadoresOrigem : []) {
      const idLocal = String(bruto?.id ?? "").trim();
      if (!idLocal) continue;
      const id = `${pacoteId}:${idLocal}`;
      if (vistos.has(id)) continue;

      const requerCru = String(bruto?.requerOrigem ?? "").trim();
      // Se o requisito aponta para uma origem do PRÓPRIO pacote, ganha o
      // namespace (caso normal: addon traz a origem e o contador dela juntos).
      // Se não, fica cru — aponta para uma origem do livro.
      const requerOrigem = requerCru
        ? (origensDoPacote.has(requerCru) ? `${pacoteId}:${requerCru}` : requerCru)
        : null;
      if (requerOrigem && origemId !== requerOrigem) continue;

      vistos.add(id);
      const tipo = bruto?.tipo === "bool" ? "bool" : "contador";
      out.push({
        id,
        tipo,
        label: String(bruto?.label ?? idLocal).trim(),
        title: String(bruto?.title ?? "").trim() || null,
        min: tipo === "bool" ? 0 : Math.trunc(Number(bruto?.min) || 0),
        max: tipo === "bool" ? 1 : (bruto?.max == null ? null : Math.trunc(Number(bruto.max))),
        passo: tipo === "bool" ? 1 : Math.max(1, Math.trunc(Number(bruto?.passo) || 1)),
        requerOrigem,
        dono: { id: `addon:${pacoteId}`, label: String(pacote?.nome ?? pacoteId) },
      });
    }
  }
  return out;
}

/** Valor atual de um contador (0 se nunca foi mexido). */
export function valorContadorOrigem(creature, fullId) {
  return Math.max(0, Math.trunc(Number(creature?.origemContadores?.[fullId]) || 0));
}

/** Aplica min/max do catálogo a um valor novo, antes de gravar. */
export function clampContadorOrigem(contador, valor) {
  if (contador?.tipo === "bool") return valor ? 1 : 0;
  const min = contador?.min ?? 0;
  const max = contador?.max;
  let v = Math.trunc(Number(valor) || 0);
  v = Math.max(min, v);
  if (max != null) v = Math.min(max, v);
  return v;
}

/**
 * `{ [variavelDsl]: valor }` de todos os contadores que a criatura enxerga
 * agora — SEMPRE presente, nunca depende de "Em Combate". É isto que entra em
 * `base.origemContadoresVars` no afty-derive.js.
 */
export function origemContadoresDslVars(creature) {
  const out = {};
  for (const c of contadoresOrigemDeAddon(creature)) {
    out[normalizarVariavel(c.id)] = valorContadorOrigem(creature, c.id);
  }
  return out;
}
