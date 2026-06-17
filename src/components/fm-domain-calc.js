// ============================================================
// fm-domain-calc.js — Criação de Expansão de Domínio
// ============================================================
// Construtor de Expansões de Domínio para a aba de Ações. É um tipo de ação
// próprio (`kind: "expansao_dominio"`), separado do pipeline de dano/TR das
// ações comuns. Esta camada é AUTOSSUFICIENTE (não importa fm-action-calc)
// para que fm-action-calc possa importar daqui sem ciclo de dependência.
//
// Nesta primeira fase a expansão é SÓ TEXTO DESCRITIVO — nenhum efeito é
// automatizado na ficha/tracker. Os valores dos efeitos saem das tabelas do
// guia, indexadas pelo Nível de Aptidão em Domínio (DOM, 1–5). A regra do +2
// da abertura NÃO toca o DOM (vai para o Confronto de Domínio, já derivado em
// fm-derive/fm-treinamentos), então os limites e tabelas leem o DOM cru.

// ------------------------------------------------------------
// Versão da expansão (derivada do ND, igual fm-caracteristicas)
// ------------------------------------------------------------
export const DOMAIN_VERSIONS = {
  incompleta:    { key: "incompleta",    label: "Incompleta",    minNd: 8  },
  completa:      { key: "completa",      label: "Completa",      minNd: 10 },
  sem_barreiras: { key: "sem_barreiras", label: "Sem Barreiras", minNd: 20 },
};

/** Versão disponível pelo ND (ou null se ainda não destravou — abaixo de ND 8). */
export function getDomainVersion(nd = 0) {
  const n = Number(nd) || 0;
  if (n >= 20) return "sem_barreiras";
  if (n >= 10) return "completa";
  if (n >= 8)  return "incompleta";
  return null;
}

export const getDomainVersionLabel = (versao) => DOMAIN_VERSIONS[versao]?.label ?? "";

// Versões que o ND permite escolher (todas com minNd <= ND). Um personagem de
// ND alto pode optar por uma versão inferior (ex.: Completa p/ prender com
// barreiras, ou Incompleta p/ gastar menos energia).
export function getAvailableVersions(nd = 0) {
  const n = Number(nd) || 0;
  return Object.values(DOMAIN_VERSIONS)
    .filter((v) => n >= v.minNd)
    .map((v) => ({ value: v.key, label: v.label }));
}

// Versão efetiva: a escolhida no domínio (se válida) ou a derivada do ND.
export const resolveVersao = (domain, nd) => domain?.versao || getDomainVersion(nd);

// ------------------------------------------------------------
// Custo em PE (por versão; +5 com Acerto Garantido)
// ------------------------------------------------------------
export const DOMAIN_BASE_COST = { incompleta: 15, completa: 20, sem_barreiras: 20 };
export const ACERTO_GARANTIDO_COST = 5;

export function getDomainCost(versao, hasAcertoGarantido = false) {
  return (DOMAIN_BASE_COST[versao] ?? 0) + (hasAcertoGarantido ? ACERTO_GARANTIDO_COST : 0);
}

// ------------------------------------------------------------
// Duração e Distância (rodadas / metros)
// ------------------------------------------------------------
// Duração: Incompleta = 1 + DOM; Completa e Sem Barreiras = 3 + DOM.
export function getDomainDuration(dom = 0, versao) {
  const d = Math.max(0, Number(dom) || 0);
  return (versao === "incompleta" ? 1 : 3) + d;
}

const fmtNum = (n) => (Number.isInteger(n) ? `${n}` : n.toFixed(1).replace(".", ","));
const fmtMeters = (n) => `${fmtNum(n)} metros`;

// Distância: Incompleta = 4,5m × BT; Completa = 9m; Sem Barreiras = 9m × BT.
// Modificação Completa dobra a distância da Sem Barreiras.
export function getDomainDistance(versao, bt = 2, mcDoublesArea = false) {
  const b = Math.max(1, Number(bt) || 1);
  if (versao === "incompleta") return fmtMeters(4.5 * b);
  if (versao === "completa") return "9 metros";
  if (versao === "sem_barreiras") return fmtMeters(9 * b * (mcDoublesArea ? 2 : 1));
  return "";
}

// ------------------------------------------------------------
// Vida da barreira (domo)
// ------------------------------------------------------------
// O domo tem PV igual ao DOBRO do total das seis paredes da aptidão "Técnicas
// de Barreira" (cada parede = 15 + Nível de Aptidão em Barreira × ½ ND). Logo:
// 2 × 6 × (15 + BAR × floor(ND/2)) = 12 × (15 + BAR × floor(ND/2)).
// Aplica-se a todas as versões: na Sem Barreiras o PV pertence ao Totem
// central da expansão (mesmo cálculo).
export function getDomainBarrierHp(bar = 0, nd = 0) {
  const b = Number(bar) || 0;
  const n = Number(nd) || 0;
  const wallHp = 15 + b * Math.floor(n / 2);
  return 12 * wallHp;
}

// Mudança de Tamanho (Modificação Completa, só na Completa): a cada 1,5m que
// ENCOLHE, +20 PV na barreira; a cada 1,5m que EXPANDE, -20 PV. Área padrão
// 9m; mín. 3m, máx. 27m (triplo). Resultado positivo = bônus de PV.
export const DOMAIN_SIZE_DEFAULT = 9;
export const DOMAIN_SIZE_MIN = 3;
export const DOMAIN_SIZE_MAX = 27;

export function getDomainSizeHpDelta(tamanho = DOMAIN_SIZE_DEFAULT) {
  const t = Number(tamanho) || DOMAIN_SIZE_DEFAULT;
  return ((DOMAIN_SIZE_DEFAULT - t) / 1.5) * 20;
}

// Opções de tamanho (3m..27m em passos de 1,5m) para o <select>.
export function getDomainSizeOptions() {
  const opts = [];
  for (let i = 0; i <= (DOMAIN_SIZE_MAX - DOMAIN_SIZE_MIN) / 1.5; i++) {
    const m = DOMAIN_SIZE_MIN + i * 1.5;
    const delta = getDomainSizeHpDelta(m);
    const tag = m === DOMAIN_SIZE_DEFAULT ? "padrão" : `${delta > 0 ? "+" : ""}${delta} PV`;
    opts.push({ value: String(m), label: `${fmtNum(m)} m (${tag})` });
  }
  return opts;
}

// PV efetivo da barreira/Totem considerando a Mudança de Tamanho (Completa).
export function getEffectiveBarrierHp(domain, { bar = 0, nd = 0 } = {}) {
  let hp = getDomainBarrierHp(bar, nd);
  const mc = domain?.modificacaoCompleta;
  if (resolveVersao(domain, nd) === "completa" && mc?.mudancaTamanho) {
    hp += getDomainSizeHpDelta(mc.tamanho);
  }
  return hp;
}

// Distância efetiva: a Mudança de Tamanho (Completa) redefine a área da
// expansão para o tamanho escolhido; senão usa o padrão da versão.
export function getEffectiveDistance(domain, { nd = 0, bt = 2, hasMC = false } = {}) {
  const versao = resolveVersao(domain, nd);
  const mc = domain?.modificacaoCompleta;
  if (versao === "completa" && mc?.mudancaTamanho) {
    return fmtMeters(Number(mc.tamanho) || DOMAIN_SIZE_DEFAULT);
  }
  return getDomainDistance(versao, bt, hasMC && versao === "sem_barreiras");
}

// ------------------------------------------------------------
// Limite de efeitos por Nível de Aptidão em Domínio
// ------------------------------------------------------------
// DOM 1–2 → 1 efeito · DOM 3–4 → 2 · DOM 5 → 3. Acerto Garantido é extra e
// NÃO conta para o limite (ver hasAcertoGarantido em fm-aptidoes).
export function getMaxEffects(dom = 0) {
  const d = Number(dom) || 0;
  if (d >= 5) return 3;
  if (d >= 3) return 2;
  if (d >= 1) return 1;
  return 0;
}

// O DOM efetivo usado para olhar as tabelas. Uma expansão Incompleta não pode
// receber benefícios acima do nível de aptidão 3 (guia de criação).
export function effectiveDom(dom = 0, versao) {
  const d = Math.max(0, Math.min(5, Number(dom) || 0));
  if (versao === "incompleta") return Math.min(d, 3);
  return d;
}

// Fortalecer custa 2 efeitos (em vez de 1) e aplica metade do efeito como
// bônus — i.e., multiplica as grandezas por 1,5.
export const effectSlotCost = (effect) => (effect?.fortalecido ? 2 : 1);
export const usedEffectSlots = (effects = []) =>
  effects.reduce((n, e) => n + effectSlotCost(e), 0);

const R = (n, fortalecido) => (fortalecido ? Math.round(n * 1.5) : n);
const plural = (n, sing, plur) => (n === 1 ? sing : plur);

// ============================================================
// TABELAS DE EFEITOS (valores por DOM 1..5)
// ============================================================
// Cada tipo define `resolve(idx, fortalecido)` → { value, sentence }:
//  • value    — grandeza curta (mostrada como dica no formulário)
//  • sentence — frase completa usada no Texto Final (idêntica ao guia)
// idx = effectiveDom - 1 (0..4). Fortalecer escala as grandezas por 1,5.
export const DOMAIN_EFFECTS = {
  amp_tecnica: {
    label: "Amplificação de Técnica",
    accent: "text-rose-300",
    desc: "Amplifica diretamente a sua técnica amaldiçoada dentro da expansão.",
    types: {
      dano: {
        label: "Aumento de Dano",
        hint: "Aplica-se aos Feitiços de dano usados dentro da expansão.",
        resolve: (i, f) => {
          const dados = R([1, 2, 3, 4, 5][i], f);
          const fixo = R([5, 5, 10, 10, 15][i], f);
          const value = `+${dados} ${plural(dados, "dado", "dados")} de dano e +${fixo} de dano fixo`;
          return { value, sentence: `Todos os seus Feitiços de dano recebem ${value}.` };
        },
      },
      cd: {
        label: "Aumento de CD",
        hint: "Aumenta a CD para resistir de todos os seus Feitiços.",
        resolve: (i, f) => {
          const n = R([2, 4, 6, 8, 10][i], f);
          return { value: `+${n} de CD`, sentence: `Todos os seus Feitiços têm a CD para resistir aumentada em ${n}.` };
        },
      },
      negacao_rd: {
        label: "Negação de Redução de Dano",
        hint: "Seus Feitiços passam a ignorar parte da RD do alvo.",
        resolve: (i, f) => {
          const rd = R([3, 6, 10, 12, 15][i], f);
          const resist = i >= 3;
          const value = `${resist ? "resistentes perdem a resistência; " : ""}-${rd} RD`;
          return {
            value,
            sentence: `Seus Feitiços ignoram ${rd} de RD dos alvos${resist ? "; inimigos resistentes perdem a resistência" : ""}.`,
          };
        },
      },
    },
  },
  amp_corporal: {
    label: "Amplificação Corporal",
    accent: "text-amber-300",
    desc: "Afeta diretamente o usuário, deixando-o mais forte.",
    types: {
      dano: {
        label: "Aumento de Dano",
        hint: "Aplica-se aos ataques armados e desarmados na expansão.",
        resolve: (i, f) => {
          const niveis = R([2, 4, 6, 8, 10][i], f);
          const fixo = R([5, 5, 10, 10, 15][i], f);
          const value = `+${niveis} níveis de dano e +${fixo} de dano fixo`;
          return { value, sentence: `Todos os seus ataques armados e desarmados recebem ${value}.` };
        },
      },
      atributo: {
        label: "Aumento de Atributo",
        hint: "Escolha dois atributos físicos distintos (até o limite de 30).",
        resolve: (i, f) => {
          const n = R([2, 4, 6, 8, 10][i], f);
          const value = `+${n} em dois atributos físicos distintos`;
          return { value, sentence: `Você recebe ${value} (até o limite de 30).` };
        },
      },
      rd: {
        label: "Redução de Dano",
        hint: "Escolha os tipos de dano protegidos.",
        resolve: (i, f) => {
          const rd = R([3, 6, 9, 12, 15][i], f);
          const tipos = [3, 3, 4, 4, 5][i];
          const value = `+${rd} de RD contra ${tipos} tipos de dano`;
          return { value, sentence: `Você recebe ${value} (escolhidos na criação).` };
        },
      },
      defesa: {
        label: "Defesa",
        hint: "Aplicada diretamente no personagem enquanto a expansão durar.",
        resolve: (i, f) => {
          const n = R([3, 5, 7, 9, 12][i], f);
          return { value: `+${n} de DEF`, sentence: `Você recebe +${n} de DEF enquanto a expansão durar.` };
        },
      },
      negacao_rd: {
        label: "Negação de Redução de Dano (golpes)",
        hint: "Seus golpes (e não a técnica) passam a negar RD do alvo.",
        resolve: (i, f) => {
          const rd = R([3, 6, 10, 12, 15][i], f);
          const resist = i >= 3;
          const value = `${resist ? "resistentes perdem a resistência; " : ""}-${rd} RD`;
          return {
            value,
            sentence: `Seus golpes ignoram ${rd} de RD dos alvos${resist ? "; inimigos resistentes perdem a resistência" : ""}.`,
          };
        },
      },
    },
  },
  ambiental: {
    label: "Efeito Ambiental",
    accent: "text-emerald-300",
    desc: "Efeito passivo e constante dentro do ambiente da expansão.",
    types: {
      dano: {
        label: "Dano Ambiental",
        hint: "Escolha o tipo de dano imbuído na área.",
        resolve: (i, f) => {
          const n = R([1, 2, 2, 2, 3][i], f);
          const d = [10, 8, 10, 12, 10][i];
          const fixo = R([10, 15, 20, 25, 35][i], f);
          const value = `${n}d${d} + ${fixo}`;
          return {
            value,
            sentence: `Todas as criaturas hostis dentro do domínio recebem ${value} de dano (tipo a escolher) a cada rodada.`,
          };
        },
      },
      condicoes: {
        label: "Condições",
        hint: "TR no começo de cada turno; condições duram 1 rodada. Não pode ser adicionada mais de uma vez.",
        resolve: (i, f) => {
          const dados = R([2, 4, 6, 8, 12][i], f);
          const tiers = [
            "fracas",
            "fracas ou médias",
            "fracas, médias ou fortes",
            "fracas, médias ou fortes",
            "fracas, médias ou fortes",
          ][i];
          const value = `condições ${tiers} (${dados} dados)`;
          return {
            value,
            sentence: `Toda criatura hostil faz um TR no começo do turno; em uma falha recebe uma condição (${tiers}). ${dados} dados para distribuir (condições duram 1 rodada).`,
          };
        },
      },
      lentidao: {
        label: "Lentidão",
        hint: "Reduz a velocidade de toda criatura hostil (0 = imobilizada). Sempre em múltiplos de 1,5m.",
        resolve: (i, f) => {
          // Fortalecer = ×1,5; os valores-base são múltiplos de 1,5, então o
          // resultado também é — sem arredondar para inteiro (≠ demais efeitos).
          const m = [3, 6, 9, 12, 18][i] * (f ? 1.5 : 1);
          return {
            value: `reduz ${fmtNum(m)}m`,
            sentence: `Toda criatura hostil no domínio tem o movimento reduzido em ${fmtNum(m)}m (se chegar a 0, fica incapaz de se mover).`,
          };
        },
      },
    },
  },
  especial: {
    label: "Efeito Especial",
    accent: "text-fuchsia-300",
    desc: "Mecânica única definida entre Jogador e Narrador. Não usa tabela — descreva o efeito livremente.",
    types: {},
    freeform: true,
  },
};

// Efeitos base aplicados automaticamente ao abrir QUALQUER expansão (só texto;
// referência no formulário, não entram no Texto Final padronizado).
export const DOMAIN_BASE_EFFECTS = [
  "+2 em todos os níveis de aptidão, exceto Barreira e Domínio (pode passar do limite; exige ter ao menos Nível 1 na aptidão).",
  "+2 em testes de Confronto de Domínio.",
  "Seu movimento dobra dentro da própria expansão.",
  "Reduz o custo dos seus Feitiços dentro da expansão em um valor igual ao Nível de DOM.",
  "Todos os seus Feitiços recebem um benefício de ritual (escolhido por categoria: Dano, Especiais, Auxiliares e Cura).",
];

// ------------------------------------------------------------
// Catálogo plano para os <select> da UI
// ------------------------------------------------------------
export const DOMAIN_CATEGORY_OPTIONS = Object.entries(DOMAIN_EFFECTS).map(
  ([value, cat]) => ({ value, label: cat.label })
);

export const getTypeOptions = (category) => {
  const cat = DOMAIN_EFFECTS[category];
  if (!cat || cat.freeform) return [];
  return Object.entries(cat.types).map(([value, t]) => ({ value, label: t.label }));
};

export const isFreeformCategory = (category) => !!DOMAIN_EFFECTS[category]?.freeform;

// ------------------------------------------------------------
// Resolução de um efeito
// ------------------------------------------------------------
function effectTypeDef(effect) {
  return DOMAIN_EFFECTS[effect?.category]?.types?.[effect?.type] ?? null;
}

/** Grandeza curta do efeito (dica no formulário). "" para Efeito Especial. */
export function effectValueText(effect, dom, versao) {
  if (!effect || isFreeformCategory(effect.category)) return "";
  const t = effectTypeDef(effect);
  if (!t) return "";
  const idx = Math.max(0, effectiveDom(dom, versao) - 1);
  return t.resolve(idx, !!effect.fortalecido).value;
}

export function getEffectLabel(effect) {
  const cat = DOMAIN_EFFECTS[effect?.category];
  if (!cat) return "Efeito";
  if (cat.freeform) return cat.label;
  const t = cat.types?.[effect?.type];
  return t ? `${cat.label}: ${t.label}` : cat.label;
}

// Linha "● Categoria: Nome. Frase." de um efeito para o Texto Final.
function effectFinalLine(effect, dom, versao) {
  const cat = DOMAIN_EFFECTS[effect?.category];
  if (!cat) return "";
  const nome = effect.nome?.trim();
  if (cat.freeform) {
    const corpo = effect.descricao?.trim() || "(efeito a descrever)";
    return `● ${cat.label}: ${nome || "Efeito Especial"}. ${corpo}`;
  }
  const t = cat.types?.[effect.type];
  if (!t) return "";
  const idx = Math.max(0, effectiveDom(dom, versao) - 1);
  const { sentence } = t.resolve(idx, !!effect.fortalecido);
  const corpo = effect.descricao?.trim() || sentence;
  return `● ${cat.label}: ${nome || t.label}. ${corpo}`;
}

function acertoGarantidoLine(ag) {
  const escopo = ag.escopo?.trim();
  const titulo = escopo ? `Acerto Garantido: ${escopo}` : "Acerto Garantido";
  const alvo = escopo
    ? `Enquanto dentro do seu domínio, ${escopo} se torna garantido`
    : "Enquanto dentro do seu domínio, você escolhe antecipadamente um efeito (uma técnica, ataque ou condição) para se tornar garantido";
  return (
    `● ${titulo}. ${alvo}: ele é aplicado no início de cada turno contra todos os alvos legíveis ` +
    `dentro do alcance, uma vez por rodada para cada um. Jogadas de ataque sempre acertam e ` +
    `Testes de Resistência sempre falham, e qualquer condição causada por ele dura 1 rodada.`
  );
}

// ============================================================
// MODELO DE DADOS
// ============================================================
let _eid = 0;
export const newEffect = (category = "amp_tecnica") => ({
  id: `eff-${Date.now().toString(36)}-${_eid++}`,
  category,
  type: isFreeformCategory(category) ? "" : Object.keys(DOMAIN_EFFECTS[category].types)[0],
  nome: "",
  descricao: "",
  fortalecido: false,
});

export const BLANK_DOMAIN = {
  kind: "expansao_dominio",
  name: "",
  type: "comum", // abre custando 2 Ações Comuns (rótulo fixo, não editável)
  versao: "",        // versão escolhida (incompleta/completa/sem_barreiras); "" = derivar do ND
  cost: 0,
  lore: "",          // descrição/contexto exibida no topo (sob o título)
  effects: [],
  acertoGarantido: { ativo: false, escopo: "" },
  modificacaoCompleta: { inversaoResistencia: false, mudancaTamanho: false, tamanho: DOMAIN_SIZE_DEFAULT },
  description: "",   // aparência do domínio (entra no parágrafo de abertura)
};

export function normalizeDomain(action = {}) {
  return {
    ...BLANK_DOMAIN,
    ...action,
    kind: "expansao_dominio",
    type: "comum",
    effects: Array.isArray(action.effects)
      ? action.effects.map((e) => ({ ...newEffect(e.category), ...e }))
      : [],
    acertoGarantido: { ...BLANK_DOMAIN.acertoGarantido, ...(action.acertoGarantido ?? {}) },
    modificacaoCompleta: { ...BLANK_DOMAIN.modificacaoCompleta, ...(action.modificacaoCompleta ?? {}) },
  };
}

export const isDomainAction = (action) => action?.kind === "expansao_dominio";

// ============================================================
// GERAÇÃO DE TEXTO DESCRITIVO
// ============================================================
// Texto Final no formato padronizado do guia: parágrafo de abertura com
// distância/duração, flavor opcional, e a lista "●" de efeitos (Amplificações,
// Ambientais, Especiais, Acerto Garantido, Modificação Completa). Congelado
// como snapshot (`finalText`) ao salvar; o builder regenera ao vivo.
export function generateDomainText(domain, { dom = 0, nd = 0, bt = 2, bar = 0, hasMC = false } = {}) {
  const d = normalizeDomain(domain);
  const versao = resolveVersao(d, nd);
  const dur = getDomainDuration(dom, versao);
  const dist = getEffectiveDistance(d, { nd, bt, hasMC });

  // Cada item de `paras` vira um parágrafo, separado por linha em branco —
  // assim o texto respira e os efeitos ficam legíveis (e o renderizador
  // DomainText pode destacar os títulos "● Categoria: Nome.").
  const paras = [];

  paras.push(
    `Sua expansão cria um espaço próprio que ocupa uma área esférica de ${dist}, ` +
      `a qual dura uma quantidade de rodadas igual a ${dur}.`
  );

  if (versao) {
    const hp = getEffectiveBarrierHp(d, { bar, nd });
    if (versao === "sem_barreiras") {
      paras.push(`O Totem no centro da expansão possui ${hp} pontos de vida.`);
    } else {
      const lado = versao === "completa" && d.modificacaoCompleta?.inversaoResistencia ? "exterior" : "interior";
      paras.push(
        `A barreira (domo) do domínio possui ${hp} pontos de vida. ` +
          `Caso a expansão seja atacada pelo seu ${lado}, ela é resistente a todos os tipos de dano. ` +
          `A resistência do interior de domínios não pode ser ignorada.`
      );
    }
  }

  const effectLines = d.effects.map((e) => effectFinalLine(e, dom, versao));
  if (d.acertoGarantido?.ativo) effectLines.push(acertoGarantidoLine(d.acertoGarantido));

  if (effectLines.length) {
    paras.push("Ela pode possuir os seguintes efeitos:");
    paras.push(...effectLines);
  }

  // A Modificação Completa NÃO entra como efeito no Texto Final — seu impacto
  // já está refletido no PV/lado da barreira e na distância (acima).
  return paras.join("\n\n");
}
