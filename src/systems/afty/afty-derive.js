/**
 * ============================================================
 * MOTOR DE CÁLCULO — GRIMÓRIO AFTY (fórmulas reais)
 * ============================================================
 * Fórmulas confirmadas pelo autor (transcrição em
 * docs/afty-formulas-base.md). Cálculo por MATEMÁTICA, ND 1→∞.
 *
 * Eixos da criatura: ND (Nível de Desafio) + Patamar + Tipo.
 *   • Tipo dirige os coeficientes de HP/PE/CD/Defesa/RD.
 *   • Patamar multiplica HP e escala Resistência/Atributos.
 *   • Alma (Integridade da Alma, 0–100+) multiplica o HP.
 *
 * ADIADO (marcado TODO, conforme o autor):
 *   • Contribuições de TREINAMENTO em todos os stats.
 *   • GUARDA (depende do contador de ataques consecutivos, CU9).
 *   • Perícias → Atenção usa Percepção = 0 por ora.
 *   • Grau de item vem do Inventário (ainda não construído):
 *     lido de creature.inventario.{defesaGrau,rdGrau}, default 0.
 * ============================================================
 */

import { resolveOrigemAttrBonus, resolveDesenvolvimento } from "./afty-origens";

export const mod = (attr) => Math.floor(((attr ?? 10) - 10) / 2);

// Maestria == Treinamento (mesmo valor), por faixa de ND.
export const maestria = (nd) => {
  if (nd >= 26) return 8;
  if (nd >= 21) return 7;
  if (nd >= 17) return 6;
  if (nd >= 13) return 5;
  if (nd >= 9) return 4;
  if (nd >= 5) return 3;
  return 2;
};

// Grau de item equipado → bônus (Defesa e RD têm tabelas diferentes).
export const GRAU_DEFESA = {
  sem_grau: 0, quarto: 1, terceiro: 2, segundo: 3, primeiro: 4, zero: 5, especial: 6,
};
export const GRAU_RD = {
  sem_grau: 0, quarto: 1, terceiro: 2, segundo: 3, primeiro: 4, zero: 5, especial: 10,
};

// Stats que a aba Cálculos permite sobrescrever (valor final, padrão StatField).
export const OVERRIDABLE = ["hp", "pe", "defesa", "cd", "rdGeral", "rdEspecifico", "movimento", "resParcial", "atencao"];

const INT = (x) => Math.floor(x); // INT() da planilha (ND > 0 → floor)

export function deriveAfty(creature) {
  const core = creature?.core ?? {};
  const a = creature?.attributes ?? {};
  const ov = creature?.statOverrides ?? {};
  const inv = creature?.inventario ?? {};

  const tipo = core.tipo || "combatente";
  const patamar = core.patamar || "comum";
  const nd = Math.max(1, core.nd ?? 1);
  const almaAtual = creature?.alma?.atual ?? 100;
  const almaMult = almaAtual / 100;
  const qntPE = creature?.qntPE || "normal";

  const attrBonus = resolveOrigemAttrBonus(creature);
  const nivelAlloc = creature?.attrNivel ?? {};
  const desenv = resolveDesenvolvimento(creature);

  // Limite EFETIVO por atributo = limite base (20 / poderes) + Desenvolvimento, teto 30.
  const limBase = (creature?.attrLimite && typeof creature.attrLimite === "object") ? creature.attrLimite : {};
  const limiteEfOf = (key) => Math.min((limBase[key] ?? 20) + (desenv[key] || 0), 30);

  // Atributo EFETIVO = base + nível + Desenvolvimento + bônus de origem.
  // Atributos de ORIGEM NÃO passam o limite (salvo os que digam explicitamente — TODO).
  // base+nível+Desenvolvimento já cabem no limite por construção (o Desenvolvimento
  // eleva valor E limite juntos); o bônus de origem é limitado ao limite efetivo.
  const eff = (key) =>
    Math.min((a[key] ?? 10) + (nivelAlloc[key] || 0) + (desenv[key] || 0) + (attrBonus[key] || 0), limiteEfOf(key));

  // Modificadores (sobre o efetivo)
  const modFor = mod(eff("forca"));
  const modDes = mod(eff("destreza"));
  const modCon = mod(eff("constituicao"));
  const modInt = mod(eff("inteligencia"));
  const modSab = mod(eff("sabedoria"));
  const modPre = mod(eff("presenca"));
  const modByAttr = { forca: modFor, destreza: modDes, constituicao: modCon, inteligencia: modInt, sabedoria: modSab, presenca: modPre };
  const attrEff = {
    forca: eff("forca"), destreza: eff("destreza"), constituicao: eff("constituicao"),
    inteligencia: eff("inteligencia"), sabedoria: eff("sabedoria"), presenca: eff("presenca"),
  };
  const attrLimiteEfetivo = {
    forca: limiteEfOf("forca"), destreza: limiteEfOf("destreza"), constituicao: limiteEfOf("constituicao"),
    inteligencia: limiteEfOf("inteligencia"), sabedoria: limiteEfOf("sabedoria"), presenca: limiteEfOf("presenca"),
  };

  // Mod. Técnica = modificador do atributo escolhido para a Técnica/CD
  const tecnicaAttr = core.tecnicaAttr || "inteligencia";
  const modTecnica = modByAttr[tecnicaAttr] ?? 0;

  const maxForDex = Math.max(modFor, modDes);                       // Z8:Z9
  const maxAllMods = Math.max(modFor, modDes, modCon, modInt, modSab, modPre); // Z8:Z13
  const bt = maestria(nd);                                          // Maestria == Treinamento

  // ---------- HP (Treino de Resistência ADIADO) ----------
  const hpBase =
    tipo === "combatente" ? 12 + (nd - 1) * 6 :
    tipo === "restringido" ? 12 * nd :
    /* misto | conjurador */ 10 + (nd - 1) * 5;
  const hpPatamarMult = patamar === "calamidade" ? 1.5 : patamar === "maldicao" ? 2 : 1;
  const hp = Math.round(almaMult * ((hpBase + nd * modCon /* +treinoRes TODO */) * 2) * hpPatamarMult);

  // ---------- PE (Treinos ADIADOS) ----------
  const peBase =
    tipo === "conjurador" ? 6 * nd :
    tipo === "misto" ? 5 * nd :
    /* combatente | restringido */ 4 * nd;
  const peQnt =
    qntPE === "muito_pouca" ? -nd :
    qntPE === "pouca" ? -Math.floor(nd / 2) :
    qntPE === "grande" ? Math.floor(nd / 2) :
    qntPE === "muito_grande" ? nd : 0;
  const pe = peBase + peQnt + modTecnica; // +treinos TODO

  // ---------- Resistência Parcial ----------
  const resThresh = (nd >= 15 ? 1 : 0) + (nd >= 20 ? 1 : 0) + (nd >= 25 ? 1 : 0) + (nd >= 30 ? 1 : 0);
  const resParcial =
    patamar === "calamidade" ? 2 + resThresh :
    patamar === "maldicao" ? 4 + resThresh : 0;

  // ---------- Movimento (Treinos ADIADOS) ----------
  const movimento = 9 + maxForDex * 1.5; // +treinos TODO

  // ---------- RD Geral (+ grau de item) ----------
  const rdGeralBase =
    tipo === "conjurador" ? (nd >= 10 ? Math.floor(nd / 2) : 0) :
    tipo === "misto" ? (nd >= 10 ? nd : Math.floor(nd / 2)) :
    /* combatente | restringido */ (nd >= 10 ? maxAllMods : 0) + nd;
  const rdGeral = rdGeralBase + (GRAU_RD[inv.rdGrau] ?? 0);

  // ---------- RD Específico ----------
  const rdEspecifico =
    tipo === "conjurador" ? modTecnica :
    tipo === "misto" ? (nd >= 10 ? 2 * modTecnica : modTecnica) : 0;

  // ---------- CD ----------
  const cdTipo =
    tipo === "conjurador" ? INT(nd / 1.25) :
    tipo === "misto" ? INT(nd / 1.5) :
    /* combatente | restringido */ INT(nd / 1.75);
  const cd = 10 + cdTipo + (modTecnica + bt);

  // ---------- Atenção (Percepção ADIADA → 0) ----------
  const atencao = 10 + 0;

  // ---------- Defesa / CA (+ grau de item; Treino de Luta ADIADO) ----------
  const defTipo =
    tipo === "conjurador" ? INT(nd / 1.75) :
    tipo === "misto" ? INT(nd / 1.5) :
    /* combatente | restringido */ INT(nd / 1.25);
  const defesa = 10 + defTipo + modDes + bt + (GRAU_DEFESA[inv.defesaGrau] ?? 0);

  // ---------- Orçamentos (budgets do builder) ----------
  const aptidaoThresholds = [[2,1],[4,1],[6,1],[8,1],[10,2],[12,1],[14,1],[16,1],[18,1],[20,2]];
  const totalAptidao =
    aptidaoThresholds.reduce((s, [t, v]) => s + (nd >= t ? v : 0), 0) +
    (qntPE === "muito_grande" ? 1 : 0); // +treinos TODO

  // (Pontos de atributo agora vêm do método + pool de nível — ver afty-atributos.js.)

  // ---------- overrides de valor final (aba Cálculos) ----------
  const calc = { hp, pe, defesa, cd, rdGeral, rdEspecifico, movimento, resParcial, atencao };
  const stats = {};
  for (const k of OVERRIDABLE) stats[k] = ov[k] != null ? ov[k] : calc[k];
  const isOverridden = (k) => ov[k] != null;

  return {
    ...stats,
    // metadados / valores não sobrescrevíveis
    calc,                 // valores calculados (antes do override)
    isOverridden,
    maestria: bt,
    almaMult,
    modTecnica,
    tecnicaAttr,
    totalAptidao,
    nd, tipo, patamar,
    mods: { forca: modFor, destreza: modDes, constituicao: modCon, inteligencia: modInt, sabedoria: modSab, presenca: modPre },
    attrEff,              // valor EFETIVO por atributo (base+nível+desenv+origem, teto 30)
    attrLimiteEfetivo,    // limite por atributo (base + Desenvolvimento, teto 30)
    attrDesenv: desenv,   // pontos de Desenvolvimento Inesperado por atributo
    attrBonus,            // bônus de atributo da origem (efetivo)
    guarda: null,         // TODO: depende do contador de ataques consecutivos
  };
}
