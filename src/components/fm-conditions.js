// fm-conditions.js
// ============================================================
// EFEITOS MECÂNICOS DAS CONDIÇÕES (#1)
// ============================================================
// Camada PURA. Cada condição declara a parte NUMÉRICA dos seus efeitos como
// modificadores (que o runtime de fm-modifiers aplica ao vivo quando a condição
// está ativa) e a parte COMPORTAMENTAL como `notes` (texto exibido ao GM, não
// automatizável: perde-ação, falha-automática, comportamento aleatório, etc.).
//
// Alvos numéricos suportados (resolvidos em resolveLiveStats):
//   acerto · defesa · iniciativa · deslocamento · rdGeral · rdIrredutivel
//   resistencias (todas as TRs) · pericias (todas) · skill:<nome> (uma perícia)
//   saves específicos (reflexos/fortitude/...) — chaves de MODIFIER_SAVES
// Ops: add (±) · set (=) · mul (×, p/ "metade" = 0.5).
// Chaves = nomes normalizados de CONDITIONS (fm-tables).
// ============================================================

import { newModifier } from "./fm-modifiers";

// Sangramento é leveled (Fraco → Extremo); todos os níveis compartilham a nota.
const SANGRAMENTO_NOTE = ["Perde vida no início do turno e faz TR de Fortitude no fim (sucesso encerra). CD e perda de vida dependem do causador."];

// Efeitos por condição. `mods` = parte automatizada; `notes` = parte só-texto.
// Referências entre condições ("fica desprevenido/lento/...") foram ACHATADAS
// nos números para não depender de resolução em cascata.
export const CONDITION_EFFECTS = {
  // ---- Mentais ----
  abalado: { mods: [{ stat: "acerto", op: "add", value: -1 }, { stat: "pericias", op: "add", value: -1 }] },
  amedrontado: {
    mods: [{ stat: "acerto", op: "add", value: -3 }, { stat: "pericias", op: "add", value: -3 }],
    notes: ["Não acumula com Abalado (é uma evolução direta dela)."],
  },
  aterrorizado: { notes: ["Não pode se aproximar voluntariamente de quem infligiu a condição."] },
  confuso: { notes: ["−4 em Fortitude e Atletismo para se manter de pé.", "Movimento aleatório: a cada 1,5m role 1d4 (1d6 se puder subir/descer) e mova 3m na direção sorteada."] },
  enfeiticado: { notes: ["−2 em todos os testes realizados contra quem o enfeitiçou."] },

  // ---- Físicas ----
  condenado: { notes: ["Custo em PE de TODAS as habilidades aumentado em 1."] },
  engasgando: { notes: ["Fica mudo e precisa segurar o ar."] },
  enjoado: { notes: ["Não pode converter ações dentro da Hierarquia de Ações."] },
  envenenado: {
    mods: [{ stat: "acerto", op: "add", value: -2 }, { stat: "resistencias", op: "add", value: -2 }, { stat: "pericias", op: "add", value: -2 }],
  },
  "sangramento fraco":   { notes: SANGRAMENTO_NOTE },
  "sangramento medio":   { notes: SANGRAMENTO_NOTE },
  "sangramento forte":   { notes: SANGRAMENTO_NOTE },
  "sangramento extremo": { notes: SANGRAMENTO_NOTE },
  sofrendo: {
    mods: [{ stat: "deslocamento", op: "add", value: -3 }],
    notes: ["−5 em testes de concentração e em Prestidigitação para realizar rituais."],
  },

  // ---- Movimento ----
  agarrado: {
    mods: [{ stat: "defesa", op: "add", value: -3 }, { stat: "reflexos", op: "add", value: -3 }, { stat: "deslocamento", op: "set", value: 0 }],
    notes: ["Desprevenido e imóvel. Acompanha quem o agarra se este se mover. Ataques à distância contra o agarrão têm 50% de errar o alvo."],
  },
  caido: {
    mods: [{ stat: "deslocamento", op: "set", value: 4.5 }],
    notes: ["−3 em ataques corpo a corpo. −3 de Defesa contra corpo a corpo, +3 contra ataques à distância. Só se move rastejando (4,5m) ou gasta movimento para levantar."],
  },
  enredado: {
    mods: [{ stat: "deslocamento", op: "mul", value: 0.5 }, { stat: "defesa", op: "add", value: -2 }, { stat: "acerto", op: "add", value: -2 }],
  },
  imovel: {
    mods: [{ stat: "deslocamento", op: "set", value: 0 }],
    notes: ["Não pode Andar, Esgueirar, Levantar nem Pular; pode Sacar e usar ações que gastam movimento sem deslocar. Não recebe Deslocamento de nenhuma fonte."],
  },
  lento: { mods: [{ stat: "deslocamento", op: "mul", value: 0.5 }] },

  // ---- Sensoriais ----
  cego: {
    mods: [
      { stat: "defesa", op: "add", value: -3 }, { stat: "reflexos", op: "add", value: -3 }, // Surpreso → Desprevenido
      { stat: "deslocamento", op: "mul", value: 0.5 }, // Lento
      { stat: "skill:percepcao", op: "add", value: -5 },
    ],
    notes: ["Surpreso e Lento. Falha em qualquer teste de visão. Seus alvos têm Camuflagem Total (50% de chance de desviar)."],
  },
  desorientado: { notes: ["Não pode usar reações contra a próxima ação ofensiva/ataque de oportunidade. Encerra após esse efeito."] },
  desprevenido: {
    mods: [{ stat: "defesa", op: "add", value: -3 }, { stat: "reflexos", op: "add", value: -3 }],
    notes: ["Desprevenido contra inimigos que não possa ver mas saiba estarem por perto."],
  },
  invisivel: {
    mods: [{ stat: "skill:furtividade", op: "add", value: 10 }],
    notes: ["Não pode ser visto. Pode usar Esconder como ação livre ao receber a condição. Vantagem na Iniciativa se invisível na rolagem."],
  },
  surdo: {
    mods: [{ stat: "iniciativa", op: "add", value: -5 }],
    notes: ["Falha em qualquer teste de audição. Em combate, a Iniciativa atual também cai −5 (reordena os turnos)."],
  },
  surpreso: {
    mods: [{ stat: "defesa", op: "add", value: -3 }, { stat: "reflexos", op: "add", value: -3 }],
    notes: ["Desprevenido e não pode reagir contra a criatura que o surpreendeu."],
  },

  // ---- Incapacitação ----
  atordoado: {
    mods: [{ stat: "defesa", op: "add", value: -3 }, { stat: "reflexos", op: "add", value: -3 }],
    notes: ["Desprevenido. Não pode realizar ações nem reações."],
  },
  inconsciente: {
    mods: [{ stat: "deslocamento", op: "set", value: 0 }],
    notes: ["Não age e fica caído; larga o que segura e não fala. Falha automática em Reflexos. Todo ataque contra ela acerta e é crítico. Acorda ao tomar dano ou com uma ação para chacoalhar."],
  },
  paralisado: {
    mods: [{ stat: "defesa", op: "add", value: -10 }, { stat: "deslocamento", op: "set", value: 0 }],
    notes: ["Só pode realizar ações puramente mentais. Falha automática em Reflexos. Acertos corpo a corpo contra ele são críticos."],
  },

  // ---- Vulnerabilidade ----
  exposto: {
    mods: [{ stat: "defesa", op: "add", value: -4 }],
    notes: ["Ataques contra você recebem +4 (refletido na Defesa) e, ao acertar, causam dano adicional igual ao nível do atacante em cada rolagem."],
  },
  fragilizado: {
    mods: [{ stat: "rdGeral", op: "set", value: 0 }],
    notes: ["RD Geral reduzida a zero e resistências anuladas (imunidades não; a RD Irredutível permanece, por ser irredutível). Não pode aumentar a RD nem se tornar resistente enquanto durar."],
  },
};

const norm = (s) => (s ?? "").toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Constrói os modificadores das condições ATIVAS (por nome). Amedrontado
// suprime Abalado (evolução direta — não acumulam). Cada modificador carrega
// source.condition para a UI distinguir a origem.
export function collectConditionModifiers(activeNames = []) {
  const set = new Set(activeNames.map(norm).filter(Boolean));
  if (set.has("amedrontado")) set.delete("abalado");
  const out = [];
  for (const key of set) {
    const def = CONDITION_EFFECTS[key];
    if (!def?.mods?.length) continue;
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    for (let i = 0; i < def.mods.length; i++) {
      const m = def.mods[i];
      out.push(newModifier({
        id: `cond_${key}_${i}`,
        name: label,
        stat: m.stat,
        op: m.op,
        value: m.value,
        duration: { kind: "manual" },
        source: { condition: key },
      }));
    }
  }
  return out;
}

// True se a condição tem algum efeito catalogado (numérico ou nota).
export const hasConditionEffect = (name) => {
  const def = CONDITION_EFFECTS[norm(name)];
  return !!def && ((def.mods?.length ?? 0) > 0 || (def.notes?.length ?? 0) > 0);
};

// Resumo curto da parte NUMÉRICA de uma condição (para o chip no tracker).
// Ex.: "Acerto −1 · Perícias −1". "" quando não há mods numéricos.
const STAT_SHORT = {
  acerto: "Acerto", defesa: "Defesa", iniciativa: "Iniciativa", deslocamento: "Desloc.",
  rdGeral: "RD", rdIrredutivel: "RD Irred.", pericias: "Perícias", resistencias: "TRs",
  reflexos: "TR Reflexos", fortitude: "TR Fortitude", vontade: "TR Vontade",
  astucia: "TR Astúcia", integridade: "TR Integridade",
};
const statShort = (stat) => stat?.startsWith("skill:")
  ? stat.slice(6).charAt(0).toUpperCase() + stat.slice(7)
  : (STAT_SHORT[stat] ?? stat);

export function summarizeConditionMods(name) {
  const def = CONDITION_EFFECTS[norm(name)];
  if (!def?.mods?.length) return "";
  return def.mods.map((m) => {
    const t = statShort(m.stat);
    if (m.op === "set") return `${t} = ${m.value}`;
    if (m.op === "mul") return `${t} ×${m.value}`;
    return `${t} ${m.value >= 0 ? "+" : ""}${m.value}`;
  }).join(" · ");
}

export function conditionNotes(name) {
  return CONDITION_EFFECTS[norm(name)]?.notes ?? [];
}
