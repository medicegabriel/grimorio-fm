// fm-suporte.js
// ============================================================
// Padrões de criação de Ações de Suporte (Grimório das Maldições, pg. 28).
// ============================================================
// Duas tabelas por BT (Ofensivo/Bônus e Defensivo), a lista de reações
// desbloqueadas por Treinamento e as regras de PE. Fonte única consumida
// pelo SuporteStandardsPanel (referência + botão "Aplicar valores do BT").
// ============================================================

// Ofensivo / Bônus — ação bônus que aumenta status (custa PE por BT).
//   custoPE  — custo já cravado pelo BT
//   danoFixo — bônus de dano fixo concedido (string: "ND-1", "ND", "+5"...)
//   acerto/cd — bônus concedidos
//   alcance/area — em metros (a tabela de Suporte é MENOR que o alcance
//                  automático de ataques comuns)
//   vantagem — custo extra em PE para conceder Vantagem
export const SUPORTE_OFENSIVO = {
  2: { custoPE: 1, danoFixo: "ND-1", acerto: 1, cd: 1, alcance: 3,   area: 1.5, vantagem: 3 },
  3: { custoPE: 2, danoFixo: "ND",   acerto: 2, cd: 2, alcance: 4.5, area: 3,   vantagem: 5 },
  4: { custoPE: 3, danoFixo: "+5",   acerto: 3, cd: 3, alcance: 6,   area: 3,   vantagem: 8 },
  5: { custoPE: 4, danoFixo: "+9",   acerto: 4, cd: 4, alcance: 7.5, area: 4.5, vantagem: 8 },
  6: { custoPE: 5, danoFixo: "+10",  acerto: 5, cd: 5, alcance: 9,   area: 4.5, vantagem: 8 },
};

// Defensivo — ação bônus (dura a rodada) ou reação (dura 1 turno) para
// resistir mais aos ataques.
export const SUPORTE_DEFENSIVO = {
  2: { custoPE: 1, tr: 1, defesa: 1, pericias: 1, vantagem: 3 },
  3: { custoPE: 2, tr: 2, defesa: 2, pericias: 2, vantagem: 5 },
  4: { custoPE: 3, tr: 3, defesa: 3, pericias: 3, vantagem: 8 },
  5: { custoPE: 4, tr: 4, defesa: 4, pericias: 4, vantagem: 8 },
  6: { custoPE: 5, tr: 5, defesa: 5, pericias: 5, vantagem: 8 },
};

// Reações desbloqueadas conforme o Treinamento sobe. Custo de PE = o próprio BT.
export const SUPORTE_REACOES = [
  { bt: 2, texto: "Evitar 1 ataque de oportunidade." },
  { bt: 3, texto: "Desengajar." },
  { bt: 4, texto: "TR de reflexo contra o acerto; se passar, reduz o dano à metade." },
  { bt: 5, texto: "Reduzir o dano à metade (1× por rodada)." },
  { bt: 6, texto: "Uma esquiva garantida (1× por rodada)." },
];

// Regras gerais de PE / alternativas sem PE.
export const SUPORTE_REGRAS = [
  "O custo de PE já é pré-definido pelo BT (ex.: BT +6 gasta 5 PE nas ações bônus e reações).",
  "Ação bônus: o bônus dura a rodada toda. Reação: dura apenas 1 turno.",
  "Sem PE (bônus): o narrador perde a ação bônus padrão e aplica os bônus via ação rápida (×1) no turno.",
  "Sem PE (reação): use uma ação rápida no lugar. O narrador perde a ação rápida E a reação. Indisponível se a ação rápida já foi gasta.",
  "Unificar 2 ações comuns não concede bônus de dano nem de outras fontes.",
];

export const SUPORTE_MODES = [
  { value: "ofensivo",  label: "Ofensivo / Bônus" },
  { value: "defensivo", label: "Defensivo" },
];

// Clampa o BT em 2..6 (faixa das tabelas).
export const clampSuporteBt = (bt) => Math.min(6, Math.max(2, bt ?? 2));

// Linha da tabela para um modo + BT.
export function getSuporteRow(mode, bt) {
  const table = mode === "defensivo" ? SUPORTE_DEFENSIVO : SUPORTE_OFENSIVO;
  return table[clampSuporteBt(bt)];
}

// Formata metros no padrão do app ("6 Metros", "1,5 Metros").
export const fmtMetros = (n) => `${String(n).replace(".", ",")} Metros`;

// Resolve o "Dano Fixo" da tabela (que pode ser "ND", "ND-1" ou "+N") para um
// número, usando o ND da criatura. Retorna null se não der pra resolver.
export function resolveDanoFixo(danoFixo, nd) {
  const s = String(danoFixo).trim();
  const num = /^\+?(\d+)$/.exec(s);
  if (num) return Number(num[1]);
  if (s === "ND") return nd ?? 0;
  if (s === "ND-1") return (nd ?? 0) - 1;
  return null;
}

// Benefícios individuais de um modo/BT. Uma ação de Suporte escolhe UM deles
// (pagando o custo em PE cravado pelo BT). Cada item vira um chip clicável.
// `auto` descreve o efeito de automação gerado ao clicar (null = sem regra,
// só descrição): { kind: "stat", stat, value } ou { kind: "dmg", danoFixo }.
export function getSuporteBenefits(mode, bt) {
  const row = getSuporteRow(mode, bt);
  if (mode === "defensivo") {
    return [
      { key: "tr",       label: `TR +${row.tr}`,              efeito: `TR +${row.tr} (especificar)`, auto: null },
      { key: "defesa",   label: `Defesa +${row.defesa}`,     efeito: `Defesa +${row.defesa}`,       auto: { kind: "stat", stat: "defesa", value: row.defesa } },
      { key: "pericias", label: `Perícias +${row.pericias}`, efeito: `Perícias +${row.pericias}`,   auto: { kind: "stat", stat: "pericias", value: row.pericias } },
    ];
  }
  return [
    { key: "danoFixo", label: `Dano Fixo ${row.danoFixo}`,         efeito: `Dano Fixo ${row.danoFixo}`,          auto: { kind: "dmg", danoFixo: row.danoFixo } },
    { key: "acerto",   label: `Acerto +${row.acerto}`,            efeito: `Acerto +${row.acerto}`,              auto: { kind: "stat", stat: "acerto", value: row.acerto } },
    { key: "cd",       label: `CD +${row.cd}`,                    efeito: `CD +${row.cd}`,                      auto: { kind: "stat", stat: "cdBase", value: row.cd } },
    { key: "alcance",  label: `Alcance ${fmtMetros(row.alcance)}`, efeito: `Alcance de ${fmtMetros(row.alcance)}`, auto: { kind: "range", range: row.alcance } },
    { key: "area",     label: `Área ${fmtMetros(row.area)}`,      efeito: `Área de ${fmtMetros(row.area)}`,      auto: { kind: "range", area: row.area } },
  ];
}

// Linha de descrição inserida ao aplicar UM benefício do padrão do BT.
export function suporteBenefitDescricao(mode, bt, benefit) {
  const row = getSuporteRow(mode, bt);
  const b = clampSuporteBt(bt);
  if (mode === "defensivo") {
    return `Padrão de Suporte (BT +${b}): gasta ${row.custoPE} PE e concede ${benefit.efeito} a rodada toda (ação bônus) ou 1 turno (reação).`;
  }
  return `Padrão de Suporte (BT +${b}): gasta ${row.custoPE} PE (ação bônus) e concede ${benefit.efeito} pela rodada.`;
}
