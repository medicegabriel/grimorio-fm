/**
 * ============================================================
 * RECURSOS DE PACOTE: FEITIÇOS VINCULADOS E CONTADORES DE SESSÃO
 * ============================================================
 * Nasceu com o Golem de Sangue 1.1.0 (2026-10-15), a Maldição Carmesim da Briar.
 * Dois verbos, os dois genéricos e só de dado no pacote:
 *
 *   `feiticosVinculados`  o pacote pede que a ficha aponte UM Feitiço dela
 *                         ("Feitiço do Frenesi"). O pacote não conhece o id, que
 *                         nasce na ficha, e por isso cita o vínculo: a variável
 *                         `<pacote>_<id>_ligado` (1 com o Feitiço no ar em
 *                         combate) e o alvo `vinculo:<id>` dos canais de Feitiço.
 *   `contadoresSessao`    números de MESA que mudam em jogo (Pontos de Sangue,
 *                         Sangue Guardado, Fome), com ações simples que mexem
 *                         no PV. Moram na sessão, e não na criatura: são o
 *                         irmão dos `contadoresOrigem`, que moram na ficha e só se
 *                         mexem no criador.
 *
 * Só importa a DSL (folha). Quem aplica as ações na sessão é ficha-sessao.js.
 * ============================================================
 */
import { normalizarVariavel } from "./afty-dsl";

const lista = (v) => (Array.isArray(v) ? v : []);
const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};

/* ============================================================ */
/* FEITIÇOS VINCULADOS                                           */
/* ============================================================ */

/** Os tipos de Feitiço que um vínculo aceita. */
export const TIPOS_VINCULO = ["transformacao", "auxiliar", "dano", "curativo", "especial", "qualquer"];

/** O Feitiço serve ao vínculo? A Transformação é o Especial de subtipo próprio. */
export function feiticoServeAoVinculo(feitico, tipo = "qualquer") {
  if (!feitico || typeof feitico !== "object") return false;
  if (tipo === "qualquer") return true;
  if (tipo === "transformacao") return feitico.tipo === "especial" && feitico.especialSubtipo === "transformacao";
  return feitico.tipo === tipo;
}

/**
 * Os vínculos que os pacotes desta ficha declaram, com o Feitiço que a ficha
 * apontou (`creature.feiticosVinculados[<pacote>:<id>]`). Apontar um Feitiço que
 * sumiu ou que não é do tipo pedido vale como não apontar: o vínculo fica vazio,
 * e a escolha gravada não é apagada.
 */
export function feiticosVinculadosDeAddon(creature) {
  const out = [];
  const escolhas = creature?.feiticosVinculados && typeof creature.feiticosVinculados === "object"
    ? creature.feiticosVinculados : {};
  for (const pacote of lista(creature?.addons)) {
    const pacoteId = String(pacote?.id ?? "").trim();
    if (!pacoteId) continue;
    for (const bruto of lista(pacote?.feiticosVinculados)) {
      const local = String(bruto?.id ?? "").trim();
      if (!local) continue;
      const id = `${pacoteId}:${local}`;
      const tipo = TIPOS_VINCULO.includes(bruto?.tipo) ? bruto.tipo : "qualquer";
      const feitico = lista(creature?.feiticos)
        .find((f) => f?.id && f.id === escolhas[id] && feiticoServeAoVinculo(f, tipo)) ?? null;
      out.push({
        id, local, tipo,
        label: String(bruto?.label ?? local).trim() || local,
        feiticoId: feitico?.id ?? null,
        feiticoNome: feitico ? (feitico.nome || "Feitiço Sem Nome") : null,
        variavel: `${normalizarVariavel(id)}_ligado`,
      });
    }
  }
  return out;
}

/**
 * O Feitiço está no ar? Pelo interruptor por Feitiço (`feiticoLigado_<id>`, o
 * Duradouro e o de Cena) ou numa vaga de Sustentação (`sustentacaoFeitico<n>`),
 * e só "Em Combate", que é a regra de todo estado de bancada.
 */
export function feiticoLigadoNoCombate(combate, feiticoId) {
  if (!combate?.ativo || !feiticoId) return false;
  if (combate[`feiticoLigado_${feiticoId}`]) return true;
  return Object.keys(combate).some((k) => /^sustentacaoFeitico\d+$/.test(k) && combate[k] === feiticoId);
}

/** `{ [variavel]: 0 | 1 }` de todos os vínculos, para o contexto da DSL. */
export function variaveisDosVinculos(vinculos, combate) {
  return Object.fromEntries(lista(vinculos).map((v) => [v.variavel, feiticoLigadoNoCombate(combate, v.feiticoId) ? 1 : 0]));
}

/**
 * O id do Feitiço que um alvo aponta: o próprio id, ou `vinculo:<id>` (com ou
 * sem o pacote na frente). `null` quando o vínculo está vazio.
 */
export function feiticoDoAlvo(alvo, vinculos) {
  const texto = String(alvo ?? "").trim();
  if (!texto.startsWith("vinculo:")) return texto || null;
  const ref = texto.slice("vinculo:".length);
  const v = lista(vinculos).find((x) => x.id === ref) ?? lista(vinculos).find((x) => x.local === ref);
  return v?.feiticoId ?? null;
}

/**
 * Os bônus por Feitiço que os canais `nivelFeitico` e `rodadasFeitico` dão, a
 * partir das linhas já avaliadas (`detalhes` do Motor). Sem alvo vale para todo
 * Feitiço (chave `*`). Cada parcela leva o nome da fonte, para o hover.
 */
export function bonusPorFeitico(detalhes, vinculos) {
  const out = {};
  const soma = (fid, campo, valor, nome) => {
    const b = (out[fid] ??= { nivel: 0, rodadas: 0, partes: [] });
    b[campo] += valor;
    b.partes.push({ campo, label: nome, valor });
  };
  for (const d of lista(detalhes)) {
    const campo = d?.canal === "nivelFeitico" ? "nivel" : d?.canal === "rodadasFeitico" ? "rodadas" : null;
    if (!campo || d.suplantado) continue;
    const valor = inteiro(d.valor, 0);
    if (!valor) continue;
    const temAlvo = String(d.alvo ?? "").trim() !== "";
    const fid = temAlvo ? feiticoDoAlvo(d.alvo, vinculos) : "*";
    if (fid) soma(fid, campo, valor, d.nome || "Efeito");
  }
  return out;
}

/** O bônus de UM Feitiço: o dele mais o que vale para todos. */
export function bonusDoFeitico(bonus, feiticoId) {
  const todos = bonus?.["*"];
  const proprio = feiticoId ? bonus?.[feiticoId] : null;
  if (!todos && !proprio) return null;
  return {
    nivel: (todos?.nivel ?? 0) + (proprio?.nivel ?? 0),
    rodadas: (todos?.rodadas ?? 0) + (proprio?.rodadas ?? 0),
    partes: [...(todos?.partes ?? []), ...(proprio?.partes ?? [])],
  };
}

/* ============================================================ */
/* CONTADORES DE SESSÃO                                          */
/* ============================================================ */

/**
 * Os contadores de sessão que os pacotes desta ficha declaram, já com o id do
 * pacote na frente (inclusive nos `outros` das ações, que citam um irmão).
 *
 * Uma ação é um conjunto fechado de verbos, todos opcionais:
 *   delta          soma no próprio contador
 *   pv             soma no PV atual (negativo paga, positivo cura até o máximo)
 *   pvPeloValor    cura o valor atual do contador
 *   pvPercentual   lista de porcentagens: o PV atual vira essa parte do máximo,
 *                  escolhida pelo valor do contador (o primeiro é o do mínimo)
 *   outros         { <id do irmão>: delta }
 *   zera           o contador volta ao mínimo depois do resto
 */
export function contadoresSessaoDeAddon(creature) {
  const out = [];
  for (const pacote of lista(creature?.addons)) {
    const pacoteId = String(pacote?.id ?? "").trim();
    if (!pacoteId) continue;
    const brutos = lista(pacote?.contadoresSessao);
    const locais = new Set(brutos.map((c) => String(c?.id ?? "").trim()).filter(Boolean));
    for (const bruto of brutos) {
      const local = String(bruto?.id ?? "").trim();
      if (!local) continue;
      const min = inteiro(bruto.min, 0);
      const max = bruto.max == null ? null : Math.max(min, inteiro(bruto.max, min));
      const inicio = Math.min(max ?? Infinity, Math.max(min, inteiro(bruto.inicio, min)));
      out.push({
        id: `${pacoteId}:${local}`,
        local,
        label: String(bruto.label ?? local).trim() || local,
        title: String(bruto.title ?? "").trim() || null,
        min, max, inicio,
        zeraNoDescanso: bruto.zeraNoDescanso === true,
        acoes: lista(bruto.acoes).filter((a) => a && String(a.id ?? "").trim()).map((a) => ({
          id: String(a.id).trim(),
          label: String(a.label ?? a.id).trim(),
          title: String(a.title ?? "").trim() || null,
          delta: inteiro(a.delta, 0),
          pv: inteiro(a.pv, 0),
          pvPeloValor: a.pvPeloValor === true,
          pvPercentual: Array.isArray(a.pvPercentual) ? a.pvPercentual.map((p) => Math.max(0, Number(p) || 0)) : null,
          outros: Object.fromEntries(Object.entries(a.outros && typeof a.outros === "object" ? a.outros : {})
            .filter(([alvo]) => locais.has(alvo))
            .map(([alvo, d]) => [`${pacoteId}:${alvo}`, inteiro(d, 0)])),
          zera: a.zera === true,
        })),
      });
    }
  }
  return out;
}

/** O valor atual de um contador na sessão, aparado na faixa dele. */
export function valorContadorSessao(sessao, contador) {
  const cru = sessao?.contadoresSessao?.[contador.id];
  const v = cru == null ? contador.inicio : inteiro(cru, contador.inicio);
  return Math.min(contador.max ?? Infinity, Math.max(contador.min, v));
}

/** O mapa saneado da sessão: só número inteiro. */
export function normalizaContadoresSessao(bruto) {
  if (!bruto || typeof bruto !== "object") return {};
  return Object.fromEntries(Object.entries(bruto)
    .filter(([, v]) => Number.isFinite(Number(v)))
    .map(([k, v]) => [k, Math.trunc(Number(v))]));
}
