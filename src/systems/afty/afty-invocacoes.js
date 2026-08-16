/**
 * ============================================================
 * INVOCAÇÕES — GRIMÓRIO AFTY (motor, Fatia 1: esqueleto)
 * ============================================================
 * Regras VERBATIM em docs/afty-invocacoes.md (fonte da verdade dos números).
 * Conteúdo é DADO: as tabelas por grau ficam aqui como constantes, os
 * resolvers são puros e o builder só exibe (padrão de Aptidões/Habilidades).
 *
 * A invocação NÃO é isolada: PV, Defesa e Bônus de Teste dela leem valores do
 * DONO. Decisões do autor (2026-07-17, ver o doc):
 *   - "Nível do Usuário" nas fórmulas de PV/Defesa = o ND do dono. PV usa o ND,
 *     Defesa usa maestria(ND) (o Bônus de Treinamento).
 *   - O Bônus de Teste usa Metade do Nível de Controlador (o lado da multiclasse).
 *   - O acesso a graus é travado pelo Nível de Controlador, não pelo ND.
 *   - Corpo Amaldiçoado e Marionete são o MESMO tipo mecânico ("dispositivo"),
 *     a diferença é só narrativa (saborNarrativo).
 *
 * DSL: esta camada monta um contexto de variáveis próprio (buildInvocacaoDslContext)
 * e delega ao evalNumber/evalBoolean de fm-dsl.js, que são agnósticos de variável.
 * NENHUMA edição em src/components/. Namespace próprio da invocação: as vars da
 * INVOCAÇÃO usam nomes diretos (forca, mod_destreza, pv_max, grau...) e as do DONO
 * entram como nd, bt, nivel_controlador.
 *
 * FATIA 1 (este arquivo, esqueleto): tipos, graus, atributos, PV/Defesa,
 * Deslocamento, custo, orçamento de ações/características, contexto de DSL e
 * validador. FATIA 2: Ações e Características com dano/cura/alcance/área/RD pelas
 * tabelas + Ações com Custo. FATIA 3: matemática de Horda.
 * ============================================================
 */

import { evalNumber } from "../../components/fm-dsl";
import { AFTY_TAMANHOS, AFTY_RESISTENCIAS } from "./afty-schema";
import { AFTY_PERICIAS, bonusProficiencia, usoPericias } from "./afty-pericias";
import { TIPOS_DANO } from "./afty-equipamentos";

export const mod = (attr) => Math.floor(((attr ?? 10) - 10) / 2);

/**
 * Tipos de dano que uma RD de Invocação pode cobrir. Os quatro primeiros são o
 * `TIPOS_DANO` das armas (afty-equipamentos.js), que é a única lista de tipos
 * catalogada do Afty. "Outro" abre um campo livre de propósito: o livro deixa o
 * tipo aberto ("qualquer tipo exceto Energia Reversa e Dano na Alma") e o resto
 * da lista nunca foi transcrito. Fechar a lista aqui esconderia tipo que existe.
 */
export const INV_RD_TIPOS = [
  ...Object.entries(TIPOS_DANO).map(([value, label]) => ({ value, label })),
  { value: "outro", label: "Outro" },
];

/** Rótulo do tipo de dano de uma RD, com o texto livre quando for "outro". */
export function rdTipoLabel(tipo, outro = "") {
  if (tipo === "outro") return (outro || "").trim() || "Outro";
  return TIPOS_DANO[tipo] ?? "";
}

/** Chave de comparação de tipo de RD (é o que decide se duas RDs colidem). */
const rdTipoChave = (tipo, outro = "") =>
  tipo === "outro"
    ? `outro:${String(outro || "").trim().toLowerCase()}`
    : String(tipo || "");

const TAMANHO_ORDEM = AFTY_TAMANHOS.map((t) => t.value);

/** Testes de Resistência que uma Invocação pode treinar / um ataque pode exigir:
 *  todos menos Integridade (regra do capítulo de Invocações). */
export const resistenciasTreinaveis = () => AFTY_RESISTENCIAS.filter((r) => r.value !== "integridade");

export const INV_ATTR_KEYS = ["forca", "destreza", "constituicao", "inteligencia", "sabedoria", "presenca"];

/** Tipos mecânicos. Corpo Amaldiçoado e Marionete colapsam em "dispositivo". */
export const AFTY_INV_TIPOS = [
  { value: "shikigami",   label: "Shikigami",   intermediario: "Talismã",     retirada: "dissipar / exorcizar" },
  { value: "dispositivo", label: "Dispositivo", intermediario: "Dispositivo", retirada: "desativar / destruir" },
];

/** Sabores narrativos do tipo "dispositivo" (só rótulo, sem efeito mecânico). */
export const AFTY_INV_SABORES = [
  { value: "corpo_amaldicoado", label: "Corpo Amaldiçoado" },
  { value: "marionete",         label: "Marionete" },
];

const TIPO_BY_VALUE = Object.fromEntries(AFTY_INV_TIPOS.map((t) => [t.value, t]));
const SABOR_BY_VALUE = Object.fromEntries(AFTY_INV_SABORES.map((s) => [s.label, s]));

/** Metadados do tipo mecânico (rótulo, Intermediário, regra de retirada). */
export const tipoInvocacaoMeta = (tipo) => TIPO_BY_VALUE[tipo] || AFTY_INV_TIPOS[0];

/**
 * O nome que a ficha mostra para o tipo: o sabor narrativo quando é dispositivo
 * (Corpo Amaldiçoado ou Marionete são a MESMA coisa mecânica, e o autor decidiu
 * que a diferença é só de rótulo), e o próprio tipo quando é shikigami.
 */
export function tipoInvocacaoLabel(inv) {
  const t = tipoInvocacaoMeta(inv?.tipoMecanico);
  if (t.value !== "dispositivo") return t.label;
  return AFTY_INV_SABORES.find((s) => s.value === inv?.saborNarrativo)?.label ?? t.label;
}

/**
 * Espaços de inventário que os Intermediários ocupam.
 *
 * ⚠ "Todo Intermediário ocupa meio espaço no inventário de um personagem"
 * (capítulo de Invocações). O número é CALCULADO e ainda NÃO entra no
 * `resolveCarga`: ligar isso mexe em Defesa e Movimento de toda ficha que já
 * existe, e a decisão é do autor. Ver docs/a-fazer.md.
 */
export const espacosDeIntermediario = (lista) =>
  (Array.isArray(lista) ? lista.length : 0) * 0.5;

/**
 * Graus. `rank` cresce com o poder (1 = mais fraco), `num` é o número do livro
 * ("Grau 2" = Segundo, usado na Horda). `custoBase` é o custo em PE para invocar.
 * A ordem do array é da mais fraca para a mais forte (ordem de exibição).
 */
export const AFTY_INV_GRAUS = [
  { value: "quarto",   label: "Quarto Grau",   rank: 1, num: 4, custoBase: 2 },
  { value: "terceiro", label: "Terceiro Grau", rank: 2, num: 3, custoBase: 4 },
  { value: "segundo",  label: "Segundo Grau",  rank: 3, num: 2, custoBase: 6 },
  { value: "primeiro", label: "Primeiro Grau", rank: 4, num: 1, custoBase: 8 },
  { value: "especial", label: "Grau Especial", rank: 5, num: 0, custoBase: 12 },
];

const GRAU_BY_VALUE = Object.fromEntries(AFTY_INV_GRAUS.map((g) => [g.value, g]));
export const grauMeta = (grau) => GRAU_BY_VALUE[grau] || AFTY_INV_GRAUS[0];

/**
 * Atributos: base 8, point-buy LINEAR (cada +1 custa 1 ponto, reduzir até 6
 * devolve 1:1). `pontos` = orçamento, `max` = teto por atributo.
 */
export const INV_ATRIBUTOS_POR_GRAU = {
  quarto:   { pontos: 10, max: 16 },
  terceiro: { pontos: 15, max: 20 },
  segundo:  { pontos: 20, max: 24 },
  primeiro: { pontos: 30, max: 26 },
  especial: { pontos: 40, max: 30 },
};
export const INV_ATTR_MIN = 6; // pode reduzir de 8 até 6, devolvendo pontos.

/** Quantidade base de Ações/Características por grau (some com adicionais). */
export const INV_ACOES_CARACT_BASE = {
  quarto: 2, terceiro: 2, segundo: 3, primeiro: 3, especial: 4,
};

/** Perícias treinadas adicionais por grau (além do ganho por INT/SAB). */
export const INV_PERICIAS_ADICIONAIS = {
  quarto: 1, terceiro: 1, segundo: 2, primeiro: 2, especial: 3,
};

/** Limite de Ações com Custo por grau (usado na Fatia 2). */
export const INV_ACOES_COM_CUSTO_MAX = {
  quarto: 1, terceiro: 1, segundo: 2, primeiro: 2, especial: 3,
};

/** Deslocamento padrão de caminhada (metros), antes de características. */
export const INV_DESLOCAMENTO_PADRAO = 9;

// ------------------------------------------------------------
// Acesso a graus pelo Nível de Controlador (tabela CLASSIFICAÇÃO)
// ------------------------------------------------------------
// Nível 1-4: Quarto. 5-8: +Terceiro. 9-12: +Segundo. 13-16: +Primeiro.
// 17+: +Especial. Quem não é Controlador (nível 0) cria via Interlúdio, com o
// grau definido lá, então não é travado por esta tabela: liberamos todos.
export function grausDisponiveis(nivelControlador = 0) {
  if (!nivelControlador || nivelControlador <= 0) return AFTY_INV_GRAUS.map((g) => g.value);
  let rankMax = 1;
  if (nivelControlador >= 17) rankMax = 5;
  else if (nivelControlador >= 13) rankMax = 4;
  else if (nivelControlador >= 9) rankMax = 3;
  else if (nivelControlador >= 5) rankMax = 2;
  return AFTY_INV_GRAUS.filter((g) => g.rank <= rankMax).map((g) => g.value);
}

// ------------------------------------------------------------
// Ficha em branco de uma invocação
// ------------------------------------------------------------
let _uidCounter = 0;
const novoId = (prefixo = "inv") => `${prefixo}_${Date.now().toString(36)}_${(_uidCounter++).toString(36)}`;

/** Tamanhos acessíveis por uma Característica de Tamanho no grau (faixa inteira). */
export function tamanhosNaFaixa(grau) {
  const faixa = INV_CARACT_TAMANHO[grauMeta(grau).value];
  if (!faixa) return [];
  const i = TAMANHO_ORDEM.indexOf(faixa[0]);
  const j = TAMANHO_ORDEM.indexOf(faixa[1]);
  if (i < 0 || j < 0) return [];
  return TAMANHO_ORDEM.slice(i, j + 1);
}

export function createBlankAcao() {
  return {
    id: novoId("acao"),
    nome: "",
    descricao: "",
    classe: "complexa",       // "simples" | "complexa"
    familia: "ataque",        // "ataque" | "auxilio"
    // Ataque
    ataqueTipo: "jogada",     // "jogada" | "tr"
    alvo: "unico",            // "unico" | "multiplos" | "area"
    atributoChave: "forca",
    tipoDano: "",
    corpoACorpo: false,
    formaArea: "",
    trTipo: "reflexos",        // save que o ataque força (exceto Integridade)
    // Auxílio
    auxilioSub: "defesa",     // "cura" | "defesa" | "acerto" | "danoAdicional" | "rd"
    alvoAuxilio: "invocacao", // "invocacao" | "aliados"
    curaAttr: "sabedoria",    // "sabedoria" | "presenca"
    rdTiposExtras: 0,
    // Ação com Custo
    custoPE: 0,
    beneficiosCusto: [],
    // Otimização de Energia (Controlador 2°): UMA ação com custo por invocação
    // fica 1 PE mais barata. É por AÇÃO, e não por invocação, então não entra no
    // registro de marcadores.
    custoOtimizado: false,
    // Escape hatch de DSL
    modificadorExpr: "",
  };
}

export function createBlankCaracteristica() {
  return {
    id: novoId("carac"),
    nome: "",
    descricao: "",
    subtipo: "vida",          // "vida" | "teste" | "rd" | "tamanho" | "livre"
    alvoTeste: "pericia",     // "pericia" | "ataque" | "tr"
    periciaId: "",            // qual perícia, quando alvoTeste === "pericia"
    trTipo: "",               // qual TR, quando alvoTeste === "tr"
    rdTipo: "",               // tipo de dano coberto (INV_RD_TIPOS)
    rdTipoOutro: "",          // texto livre quando rdTipo === "outro"
    rdTiposExtras: 0,
    tamanho: "",
    modificadorExpr: "",
  };
}

/** Clona uma invocação com novos ids (dela e de cada ação/característica). */
export function cloneInvocacao(inv) {
  const c = JSON.parse(JSON.stringify(inv || {}));
  c.id = novoId();
  c.acoes = (c.acoes || []).map((a) => ({ ...a, id: novoId("acao") }));
  c.caracteristicas = (c.caracteristicas || []).map((ch) => ({ ...ch, id: novoId("carac") }));
  return c;
}

export function createBlankInvocacao(grau = "quarto") {
  return {
    id: novoId(),
    nome: "",
    tipoMecanico: "shikigami",
    saborNarrativo: "corpo_amaldicoado", // usado só quando tipoMecanico === "dispositivo"
    grau,
    atributos: { forca: 8, destreza: 8, constituicao: 8, inteligencia: 8, sabedoria: 8, presenca: 8 },
    ataqueTreinado: "corpo",   // "corpo" | "distancia"
    trTreinado: "reflexos",    // save treinado (nomeado, exceto Integridade)
    trMestre: false,           // mestre no save treinado (1,5x BT)
    periciasProf: {},          // { [periciaId]: "treinado" | "mestre" }
    tamanho: "medio",          // só muda por Característica de Tamanho
    marcadores: {},            // { [marcadorId]: true } — ver MARCADORES_INVOCACAO
    marcadorOpcoes: {},        // { [marcadorId]: opcaoValue } — marcador que pede escolha
    acoes: [],                 // Fatia 2
    caracteristicas: [],       // Fatia 2
  };
}

// ------------------------------------------------------------
// Atributos: point-buy linear
// ------------------------------------------------------------
/** Pontos gastos = soma de (valor - 8) por atributo (redução vira negativo). */
export function pontosAtributoUsados(inv) {
  const at = inv?.atributos || {};
  return INV_ATTR_KEYS.reduce((s, k) => s + ((at[k] ?? 8) - 8), 0);
}

// bonusPontos: pontos de atributo extras (ex.: Potencial Superior do Controlador).
// O teto POR atributo não muda, só o orçamento total.
export function resumoAtributosInvocacao(inv, bonusPontos = 0) {
  const g = grauMeta(inv?.grau);
  const tab = INV_ATRIBUTOS_POR_GRAU[g.value] || INV_ATRIBUTOS_POR_GRAU.quarto;
  const at = inv?.atributos || {};
  const total = tab.pontos + (bonusPontos || 0);
  const usados = pontosAtributoUsados(inv);
  const warnings = [];
  if (usados > total) warnings.push(`Atributos: ${usados} de ${total} pontos (excedeu).`);
  for (const k of INV_ATTR_KEYS) {
    const v = at[k] ?? 8;
    if (v < INV_ATTR_MIN) warnings.push(`${k}: ${v} abaixo do mínimo ${INV_ATTR_MIN}.`);
    if (v > tab.max) warnings.push(`${k}: ${v} passa do máximo ${tab.max} do grau.`);
  }
  return { usados, total, max: tab.max, restante: total - usados, warnings };
}

// ------------------------------------------------------------
// PV, Defesa, Deslocamento
// ------------------------------------------------------------
// dono = { nd, bt, nivelControlador }. "Nível do Usuário" = dono.nd (decisão do
// autor). "Metade do Valor de Constituição" usa o VALOR do atributo, não o mod.
export function pvInvocacao(inv, dono = {}) {
  const con = inv?.atributos?.constituicao ?? 8;
  const nd = Math.max(1, dono.nd ?? 1);
  switch (grauMeta(inv?.grau).value) {
    case "terceiro": return 25 + Math.floor(con / 2) + nd;
    case "segundo":  return 40 + con + nd;
    // 1.5x Nível do Usuário, arredondado para baixo (regra do autor, 2026-07-18).
    case "primeiro": return 60 + con + Math.floor(1.5 * nd);
    case "especial": return 80 + con + 2 * nd;
    case "quarto":
    default:         return 10 + Math.floor(con / 2) + nd;
  }
}

export function defesaInvocacao(inv, dono = {}) {
  const base = { quarto: 10, terceiro: 12, segundo: 16, primeiro: 20, especial: 24 };
  const g = grauMeta(inv?.grau).value;
  return (base[g] ?? 10) + mod(inv?.atributos?.destreza ?? 8) + (dono.bt ?? 0);
}

export function deslocamentoInvocacao() {
  // Características que expandem o deslocamento entram na Fatia 2.
  return INV_DESLOCAMENTO_PADRAO;
}

// Bônus de teste = Mod. do Atributo Chave + BT do Usuário (só se treinado) +
// Metade do Nível de Controlador + bônus de Habilidade (ex.: Controle Aprimorado).
// Perícia sem treino não soma o BT.
export function bonusTesteInvocacao(inv, dono = {}, { atributo = "forca", treinado = true } = {}) {
  const modAttr = mod(inv?.atributos?.[atributo] ?? 8);
  const meioControlador = Math.floor((dono.nivelControlador ?? 0) / 2);
  return modAttr + (treinado ? (dono.bt ?? 0) : 0) + meioControlador + (dono.bonusTesteHabilidade ?? 0);
}

// Bônus de proficiência num teste: treinado soma o BT, mestre soma 1,5x o BT
// (BT + metade do BT, arredondando para baixo). Ex.: BT +2 -> mestre +3.
// Proficiência (Treinado / Mestre) e o custo em vagas moram em afty-pericias.js,
// que é o dono da regra e serve os três tipos de teste. Re-exportados aqui
// porque é daqui que a aba de Invocações sempre os importou.
export { bonusProficiencia, usoPericias };

// Perícias comuns treináveis: 1 + metade do melhor mod entre INT e SAB, mais o
// ganho por grau. Não conta Ofício (regra de mesa, não travada aqui).
export function periciasAllowanceInvocacao(inv) {
  const at = inv?.atributos || {};
  const melhor = Math.max(mod(at.inteligencia ?? 8), mod(at.sabedoria ?? 8));
  const base = 1 + Math.floor(melhor / 2);
  const adic = INV_PERICIAS_ADICIONAIS[grauMeta(inv?.grau).value] ?? 0;
  return Math.max(0, base + adic);
}

// ------------------------------------------------------------
// Custo em PE e orçamento de Ações/Características
// ------------------------------------------------------------
// Capacidade = base do grau + adicionais (1 por rank de grau: 4°=1 ... especial=5).
// Habilidades de Controlador ampliam depois (passada de efeitos pendente).
// extra: slots adicionais de Habilidade (Ápice do Controle, Visionário).
export function orcamentoAcoesCaract(inv, extra = 0) {
  const g = grauMeta(inv?.grau);
  const base = INV_ACOES_CARACT_BASE[g.value] ?? 2;
  const maxAdicionais = g.rank; // 4°=1, 3°=2, 2°=3, 1°=4, especial=5
  const usados = (inv?.acoes?.length ?? 0) + (inv?.caracteristicas?.length ?? 0);
  const total = base + maxAdicionais + (extra || 0);
  return { base, maxAdicionais, extra: extra || 0, total, usados, restante: total - usados };
}

// Custo total em PE para invocar = custo base + acréscimos das escolhas:
// Ação Simples ou Característica = +1, Ação Complexa = +2.
// `gratis` = itens que NÃO custam (ex.: Ápice do Controle dá 2 grátis). Abatemos
// os itens mais caros primeiro, que é o que o jogador escolheria.
export function custoInvocacao(inv, gratis = 0) {
  const g = grauMeta(inv?.grau);
  const custos = [];
  for (const a of inv?.acoes || []) custos.push(a?.classe === "complexa" ? 2 : 1);
  for (let i = 0; i < (inv?.caracteristicas?.length ?? 0); i++) custos.push(1);
  custos.sort((a, b) => b - a); // maiores primeiro
  const soma = custos.slice(Math.max(0, gratis)).reduce((s, c) => s + c, 0);
  return g.custoBase + soma;
}

// ============================================================
// FATIA 2 — Ações e Características (tabelas + resolvers)
// ============================================================
// Números VERBATIM do doc. Várias tabelas COMEÇAM no Terceiro Grau (Alvos
// Múltiplos, Área, Cura Múltiplos): Quarto Grau não aparece nelas de propósito.
//
// ESCADA DE NÍVEIS DE DADO: regras como "corpo a corpo aumenta o dano em 3
// níveis", "dano adicional complexo +3 níveis" e o benefício de Ação com Custo
// "+2 níveis por PE" andam nesta escada canônica (regra geral de armas, tabela
// verbatim no doc). Implementada em subirNiveisDano (ver abaixo).

/** Dano por grau (dado base, a distância). Bônus de atributo é 1x, 2x no Especial. */
export const INV_DANO = {
  jogadaUnico: { quarto: "1d12", terceiro: "1d12 + 1d6", segundo: "2d12", primeiro: "2d12 + 1d6", especial: "3d12" },
  trUnico:     { quarto: "1d8",  terceiro: "1d12",        segundo: "1d12 + 1d6", primeiro: "2d12", especial: "2d12 + 1d6" },
  multiplos:   { terceiro: "1d10", segundo: "1d12", primeiro: "1d12 + 1d6", especial: "2d12" },
  area:        { terceiro: "1d8",  segundo: "1d10", primeiro: "1d12", especial: "1d12 + 1d8" },
};

/** Cura por grau (só Ação Complexa). Bônus de atributo 1x, 2x no Especial. */
export const INV_CURA = {
  unico:     { quarto: "1d4", terceiro: "1d8", segundo: "1d12", primeiro: "1d12 + 1d8", especial: "2d12 + 1d6" },
  multiplos: { terceiro: "1d4", segundo: "1d6", primeiro: "1d8", especial: "1d12 + 1d4" },
};

export const INV_ALCANCE = { quarto: 6, terceiro: 9, segundo: 15, primeiro: 21, especial: 30 };      // metros
export const INV_AREA = { terceiro: 3, segundo: 4.5, primeiro: 6, especial: 7.5 };                    // metros
export const INV_BONUS_DEFESA = { quarto: 1, terceiro: 2, segundo: 3, primeiro: 4, especial: 5 };     // Simples; Complexa x1.5
export const INV_BONUS_ACERTO = { quarto: 1, terceiro: 2, segundo: 3, primeiro: 4, especial: 5 };     // Simples; Complexa x1.5
export const INV_DANO_ADICIONAL = { quarto: "1d6", terceiro: "1d10", segundo: "2d6", primeiro: "2d8", especial: "2d12" };
export const INV_RD_ACAO = { quarto: 2, terceiro: 4, segundo: 6, primeiro: 8, especial: 10 };         // Simples; Complexa x1.5; -2 por tipo extra

// Características (passivas).
export const INV_CARACT_VIDA = { quarto: 5, terceiro: 10, segundo: 15, primeiro: 20, especial: 30 };
export const INV_CARACT_TESTE = { quarto: 2, terceiro: 4, segundo: 6, primeiro: 8, especial: 10 };    // Perícia: cheio. Ataque/TR: metade
export const INV_CARACT_RD = { quarto: 2, terceiro: 4, segundo: 6, primeiro: 8, especial: 12 };       // note: Especial 12 (difere do RD de Ação)
export const INV_CARACT_TAMANHO = {
  quarto:   ["medio", "grande"],
  terceiro: ["medio", "grande"],
  segundo:  ["pequeno", "enorme"],
  primeiro: ["pequeno", "enorme"],
  especial: ["minusculo", "colossal"],
};

// Ação com Custo: mínimo 1 PE, máximo 2 por rank de grau (2/4/6/8/10). Benefícios por PE.
export const custoMaxAcao = (grau) => 2 * grauMeta(grau).rank;
export const INV_CUSTO_CONDICAO = { fraca: 2, media: 4, forte: 6 };
export const INV_CUSTO_BENEFICIOS = [
  { id: "alcance",  label: "Aumento de Alcance", porPE: "+6 metros de alcance" },
  { id: "area",     label: "Aumento de Área",    porPE: "+3 metros de área" },
  { id: "danoCura", label: "Aumento de Dano/Cura", porPE: "+2 níveis de dano ou cura" },
  { id: "acertoCd", label: "Bônus em Acerto ou CD", porPE: "+1 na jogada de ataque ou na CD" },
  { id: "condicao", label: "Causar Condição", porPE: "aplica Condição (Fraca 2, Média 4, Forte 6 PE)" },
];

/** Alvos de Ataque disponíveis num grau (Múltiplos/Área começam no Terceiro Grau). */
export function alvosDanoDisponiveis(grau) {
  const g = grauMeta(grau).value;
  return { unico: true, multiplos: INV_DANO.multiplos[g] != null, area: INV_DANO.area[g] != null };
}
/** Cura de alvos múltiplos existe a partir do Terceiro Grau. */
export function curaMultiplosDisponivel(grau) {
  return INV_CURA.multiplos[grauMeta(grau).value] != null;
}

// Multiplicador do bônus de atributo em dano/cura: 2x só no Grau Especial.
const bonusAttrMult = (grau) => (grauMeta(grau).value === "especial" ? 2 : 1);
// Ação Complexa aumenta bônus fixos (Defesa/Acerto/RD) em 1,5x, arredondando
// para BAIXO (regra geral do autor, 2026-07-18: sempre piso salvo o texto dizer
// o contrário). Base ímpar como 1 (Defesa/Acerto de Quarto Grau) segue em 1.
const complexaMult = (base) => Math.floor(base * 1.5);

// Escada canônica de dados. Degraus 0..7 são a base (1, 1d2, 1d3, 1d4, 1d6, 1d8,
// 1d10, 1d12). Acima do d12: kd12, depois +1d4/+1d6/+1d8/+1d10, depois (k+1)d12,
// iniciando o dado adicional no d4 e subindo até o d12, quando vira mais um d12.
const DADO_LADDER_BAIXO = ["1", "1d2", "1d3", "1d4", "1d6", "1d8", "1d10", "1d12"];
const DADO_LADDER_BAIXO_MAX = [1, 2, 3, 4, 6, 8, 10, 12];
const DADO_ADICIONAL = [4, 6, 8, 10]; // dado extra sobe d4 -> d6 -> d8 -> d10 -> (vira +1 d12)

function degrau(i) {
  if (i <= 7) return { str: DADO_LADDER_BAIXO[i], max: DADO_LADDER_BAIXO_MAX[i] };
  const m = i - 7;
  const k = Math.floor(m / 5) + 1;
  const within = m % 5;
  if (within === 0) return { str: `${k}d12`, max: k * 12 };
  const add = DADO_ADICIONAL[within - 1];
  return { str: `${k}d12 + 1d${add}`, max: k * 12 + add };
}

// Máximo de um dado escrito como "AdB + CdD ..." (ou um número solto como "1").
function dadoMax(str) {
  return String(str).split("+").reduce((s, term) => {
    const t = term.trim();
    const m = t.match(/^(\d+)\s*d\s*(\d+)$/i);
    if (m) return s + Number(m[1]) * Number(m[2]);
    const n = Number(t);
    return s + (Number.isFinite(n) ? n : 0);
  }, 0);
}

// Degrau cujo "maior resultado" é o mais próximo de `alvo`. A escada é
// monotônica e distinta, então dá para varrer.
function degrauDoMaximo(alvo) {
  let prev = 0;
  for (let i = 0; i < 300; i++) {
    const cur = degrau(i).max;
    if (cur === alvo) return i;
    if (cur > alvo) {
      if (i === 0) return 0;
      return (cur - alvo) < Math.abs(alvo - degrau(prev).max) ? i : prev;
    }
    prev = i;
  }
  return prev;
}

// Degrau de um dado pela regra do "maior resultado": soma o máximo e acha o
// degrau mais próximo.
function degrauDe(str) {
  return degrauDoMaximo(dadoMax(str));
}

/**
 * O dado da escada cujo maior resultado é `maximo`. É o caminho de volta do
 * canal `ataqueDanoAdicional`, que trafega o MÁXIMO do dado em vez do dado.
 *
 * ⚠ O canal viaja como máximo, e não como um índice de degrau, porque o Motor
 * SOMA os valores de um mesmo canal. Somar índices de degrau daria a escada
 * errada (duas fontes de 1d6 virariam 1d10). Somar máximos é a própria regra de
 * conversão do livro: 6 + 6 = 12 = 1d12, o degrau de mesmo maior resultado.
 */
export function dadoDoMaximo(maximo) {
  const n = Math.max(0, Math.floor(Number(maximo) || 0));
  if (n <= 0) return null;
  return degrau(degrauDoMaximo(n)).str;
}

/**
 * A notação de dano, ESTRUTURADA: `"3d12 + 1d8"` vira
 * `[{ dados: 3, faces: 12 }, { dados: 1, faces: 8 }]`.
 *
 * ⚠ EXISTE PARA A FICHA ROLAR, e é o mesmo remédio do `rolagensDoFeitico`: quem
 * tem o número entrega o número, e ninguém relê notação de volta de uma string.
 *
 * ⚠ E é uma LISTA porque a escada de dano do Afty tem degraus de DOIS dados
 * diferentes (`degrau()` devolve `"2d12 + 1d6"` a partir do oitavo). Um parser
 * ingênuo que quebrasse no "d" leria `"3d12 + 1d8"` como 3 dados de face
 * inválida, e a Invocação rolaria um dano errado sem avisar ninguém. Isso quase
 * chegou à mesa em 2026-08-06.
 *
 * Degrau de dado fixo (`"1"`, o piso da escada) devolve lista vazia: não há dado
 * a rolar ali, e um `{ dados: 1, faces: 1 }` inventado rolaria um d1.
 */
export function dadosDaNotacao(str) {
  const grupos = [];
  for (const m of String(str ?? "").matchAll(/(\d+)\s*d\s*(\d+)/gi)) {
    const dados = Number(m[1]);
    const faces = Number(m[2]);
    if (dados > 0 && faces > 1) grupos.push({ dados, faces });
  }
  return grupos;
}

/** Sobe (ou baixa) N níveis de dano num dado, pela escada canônica. Piso em "1". */
export function subirNiveisDano(dado, n) {
  if (!n) return { dado, niveisPendentes: false };
  const idx = degrauDe(dado);
  return { dado: degrau(Math.max(0, idx + n)).str, base: dado, niveis: n, niveisPendentes: false };
}

/** CD de um ataque por Teste de Resistência: 10 + metade(ND) (mín 1) + mod do atributo. */
export function cdAtaqueInvocacao(inv, dono = {}, atributo = "inteligencia") {
  const nd = Math.max(1, dono.nd ?? 1);
  return 10 + Math.max(1, Math.floor(nd / 2)) + mod(inv?.atributos?.[atributo] ?? 8);
}

/** Contexto de DSL de UMA invocação, para avaliar `modificadorExpr` de efeitos. */
function ctxParaExpr(inv, dono) {
  return buildInvocacaoDslContext(inv, dono);
}

/**
 * Resolve uma Ação: devolve os valores concretos pelas tabelas do grau. `dado`
 * de dano/cura sai como base (a distância), com `niveisPendentes` quando um
 * "+N níveis" (corpo a corpo etc.) se aplica e a escada ainda não existe.
 */
export function resolveAcao(acao, inv, dono = {}) {
  const grau = grauMeta(inv?.grau).value;
  const classe = acao?.classe === "complexa" ? "complexa" : "simples";
  const familia = acao?.familia === "auxilio" ? "auxilio" : "ataque";
  // Ação com Custo é uma escolha do jogador (custoPE > 0 na ficha da ação). Não
  // confundir com o custo obrigatório de 2 PE que a Cura ganha embaixo: aquele
  // é um custo por uso, não a mecânica opcional de Ação com Custo.
  const acaoComCusto = (acao?.custoPE ?? 0) > 0;
  // A `descricao` viaja junto pelo mesmo motivo da Característica: é o texto da
  // ação, e a Ficha não tem outra fonte para ele.
  const out = {
    id: acao?.id, nome: acao?.nome || "", descricao: acao?.descricao || "",
    classe, familia, custoPE: acao?.custoPE ?? 0, acaoComCusto,
  };
  const warnings = [];

  // Benefícios da Ação com Custo, agregados por tipo (cada PE compra o efeito da
  // tabela). Aplicados no dano/cura/alcance/área/acerto abaixo.
  const bens = { alcance: 0, area: 0, danoCura: 0, acertoCd: 0, condicoes: [] };
  let peBeneficios = 0;
  if (acaoComCusto) {
    for (const b of Array.isArray(acao?.beneficiosCusto) ? acao.beneficiosCusto : []) {
      if (b?.tipo === "condicao") {
        peBeneficios += INV_CUSTO_CONDICAO[b.nivel] ?? 0;
        if (b.nivel) bens.condicoes.push(b.nivel);
      } else if (b?.tipo && b.tipo in bens) {
        const pe = Math.max(0, Math.floor(Number(b.pe) || 0));
        bens[b.tipo] += pe;
        peBeneficios += pe;
      }
    }
  }

  let alcanceMetros = null;  // number | "corpo" | null
  let areaMetros = null;     // number | null

  if (familia === "ataque") {
    // Ação de Ataque é sempre Complexa.
    if (classe !== "complexa") warnings.push("Ação de Ataque deve ser Complexa.");
    const alvo = acao?.alvo === "multiplos" || acao?.alvo === "area" ? acao.alvo : "unico";
    const ataqueTipo = acao?.ataqueTipo === "tr" ? "tr" : "jogada";
    out.alvo = alvo; out.ataqueTipo = ataqueTipo;
    out.tipoDano = acao?.tipoDano || "";

    // Tabela de dano por (ataqueTipo, alvo).
    const tabela =
      alvo === "unico" ? (ataqueTipo === "tr" ? INV_DANO.trUnico : INV_DANO.jogadaUnico) :
      alvo === "multiplos" ? INV_DANO.multiplos : INV_DANO.area;
    const base = tabela[grau];
    const atributoChave = acao?.atributoChave || (ataqueTipo === "jogada" ? "forca" : "inteligencia");
    const danoBonus = bonusAttrMult(grau) * mod(inv?.atributos?.[atributoChave] ?? 8);
    if (base == null) {
      // Alvos Múltiplos/Área começam no Terceiro Grau: Quarto Grau não os tem.
      warnings.push(`Grau ${grauMeta(inv?.grau).label} não tem ataque de alvos ${alvo === "area" ? "em área" : "múltiplos"}.`);
      out.dano = { dado: null, bonus: danoBonus, atributoChave, indisponivel: true };
    } else {
      // Corpo a corpo: +3 níveis no dado.
      out.dano = { ...subirNiveisDano(base, acao?.corpoACorpo ? 3 : 0), bonus: danoBonus, atributoChave };
    }

    if (ataqueTipo === "jogada") {
      const treinado = (acao?.corpoACorpo ? "corpo" : "distancia") === inv?.ataqueTreinado;
      out.bonusAtaque = bonusTesteInvocacao(inv, dono, { atributo: atributoChave, treinado });
    } else {
      out.cd = cdAtaqueInvocacao(inv, dono, atributoChave);
      out.trTipo = acao?.trTipo || "reflexos";
      // O rótulo sai resolvido: a Ficha mostra "CD 18 Reflexos", e quem tem o
      // catálogo dos Testes de Resistência é este lado, não a tela.
      out.trTipoLabel = AFTY_RESISTENCIAS.find((r) => r.value === out.trTipo)?.label ?? out.trTipo;
    }

    alcanceMetros = acao?.corpoACorpo ? "corpo" : INV_ALCANCE[grau];
    if (alvo === "area") {
      areaMetros = INV_AREA[grau] ?? null;
      out.formaArea = acao?.formaArea || "";
    }
  } else {
    // Ação de Auxílio. Por padrão os auxílios têm alcance corpo a corpo (o livro
    // exige uma característica para estendê-lo), exceto a Cura, que segue a tabela.
    const sub = ["cura", "defesa", "acerto", "danoAdicional", "rd"].includes(acao?.auxilioSub) ? acao.auxilioSub : "defesa";
    out.auxilioSub = sub;
    out.alvoAuxilio = acao?.alvoAuxilio === "aliados" ? "aliados" : "invocacao";
    alcanceMetros = "corpo";

    if (sub === "cura") {
      const multi = acao?.alvo === "multiplos";
      const base = (multi ? INV_CURA.multiplos : INV_CURA.unico)[grau];
      const curaAttr = acao?.curaAttr === "presenca" ? "presenca" : "sabedoria";
      const curaBonus = bonusAttrMult(grau) * mod(inv?.atributos?.[curaAttr] ?? 8);
      if (base == null) {
        warnings.push(`Grau ${grauMeta(inv?.grau).label} não tem cura de alvos múltiplos.`);
        out.cura = { dado: null, bonus: curaBonus, curaAttr, indisponivel: true };
      } else {
        out.cura = { dado: base, bonus: curaBonus, curaAttr };
      }
      out.custoPE = Math.max(out.custoPE, 2); // recuperar PV custa 2 PE por uso (não é Ação com Custo)
      alcanceMetros = INV_ALCANCE[grau];
    } else if (sub === "defesa") {
      out.valor = classe === "complexa" ? complexaMult(INV_BONUS_DEFESA[grau]) : INV_BONUS_DEFESA[grau];
      out.prejuizoMultiplos = "-1 por uso repetido na rodada (até 0)";
    } else if (sub === "acerto") {
      out.valor = classe === "complexa" ? complexaMult(INV_BONUS_ACERTO[grau]) : INV_BONUS_ACERTO[grau];
      out.prejuizoMultiplos = "-1 por uso repetido na rodada (até 0)";
    } else if (sub === "rd") {
      const tiposExtras = Math.max(0, acao?.rdTiposExtras ?? 0);
      const base = classe === "complexa" ? complexaMult(INV_RD_ACAO[grau]) : INV_RD_ACAO[grau];
      out.valor = Math.max(0, base - 2 * tiposExtras);
      out.tiposExtras = tiposExtras;
      out.prejuizoMultiplos = "-1 por uso repetido na rodada (até 0)";
    } else if (sub === "danoAdicional") {
      // Complexa: +3 níveis.
      out.danoAdicional = subirNiveisDano(INV_DANO_ADICIONAL[grau], classe === "complexa" ? 3 : 0);
      out.prejuizoMultiplos = "-2 níveis por uso repetido na rodada (até 1d4)";
    }
  }

  // Aplica os benefícios da Ação com Custo aos valores já resolvidos.
  if (bens.danoCura > 0) {
    const add = 2 * bens.danoCura;
    if (out.dano?.dado) out.dano = { ...out.dano, dado: subirNiveisDano(out.dano.dado, add).dado };
    if (out.cura?.dado) out.cura = { ...out.cura, dado: subirNiveisDano(out.cura.dado, add).dado };
    if (out.danoAdicional?.dado) out.danoAdicional = { ...out.danoAdicional, dado: subirNiveisDano(out.danoAdicional.dado, add).dado };
  }
  if (bens.acertoCd > 0) {
    if (out.bonusAtaque != null) out.bonusAtaque += bens.acertoCd;
    if (out.cd != null) out.cd += bens.acertoCd;
  }
  if (bens.condicoes.length) out.condicoes = bens.condicoes;

  // Escalonamento vindo de Habilidade do Controlador (Concentrar Poder,
  // Melhorias). Já chega 0 quando o marcador que o condiciona está desligado (o
  // `quando` filtra antes). DANO e CURA são canais separados: Concentrar Poder
  // alimenta os quatro, Agressividade só os dois de dano.
  const danoNivel = dono.danoNivelHabilidade ?? 0;
  const danoBonusHab = dono.danoBonusHabilidade ?? 0;
  if (out.dano?.dado && (danoNivel > 0 || danoBonusHab > 0)) {
    out.dano = { ...out.dano, dado: subirNiveisDano(out.dano.dado, danoNivel).dado, bonus: (out.dano.bonus || 0) + danoBonusHab };
  }
  const curaNivel = dono.curaNivelHabilidade ?? 0;
  const curaBonusHab = dono.curaBonusHabilidade ?? 0;
  if (out.cura?.dado && (curaNivel > 0 || curaBonusHab > 0)) {
    out.cura = { ...out.cura, dado: subirNiveisDano(out.cura.dado, curaNivel).dado, bonus: (out.cura.bonus || 0) + curaBonusHab };
  }

  // Dado extra que todo ataque da invocação carrega (Melhoria Agressividade).
  // Vale para as duas formas de ataque: a Jogada de Ataque e o Teste de
  // Resistência são "ações de ataque" iguais para o texto da Melhoria.
  const extraMax = dono.ataqueDanoAdicionalHabilidade ?? 0;
  if (familia === "ataque" && extraMax > 0) {
    const dado = dadoDoMaximo(extraMax);
    if (dado) out.danoExtraAtaque = { dado, grupos: dadosDaNotacao(dado) };
  }

  // Acerto e CD concedidos por Habilidade (Melhoria Precisão). Entram depois
  // dos benefícios da Ação com Custo, no mesmo lugar em que ela mexe.
  if (out.bonusAtaque != null && dono.acertoHabilidade) out.bonusAtaque += dono.acertoHabilidade;
  if (out.cd != null && dono.cdHabilidade) out.cd += dono.cdHabilidade;

  // Alcance / área finais (base + benefícios por PE).
  if (alcanceMetros === "corpo") {
    out.alcance = bens.alcance > 0 ? `corpo a corpo (+${6 * bens.alcance} m)` : "corpo a corpo";
  } else if (alcanceMetros != null) {
    out.alcance = `${alcanceMetros + 6 * bens.alcance} m`;
  }
  if (areaMetros != null) {
    out.area = `${areaMetros + 3 * bens.area} m${acao?.formaArea === "linha" ? " (linha, dobrada)" : ""}`;
  }

  // Ação com Custo (opt-in do jogador): valida faixa de PE e a soma dos benefícios.
  // O custo obrigatório de 2 PE da Cura NÃO entra aqui, não é uma Ação com Custo.
  if (acaoComCusto) {
    const max = custoMaxAcao(grau);
    const custoUsuario = acao?.custoPE ?? 0;
    if (custoUsuario > max) warnings.push(`Custo ${custoUsuario} PE passa do máximo ${max} do grau.`);
    if (classe !== "complexa") warnings.push("Ação com Custo deve custar ao menos uma Ação Complexa.");
    if (peBeneficios > custoUsuario) warnings.push(`Benefícios usam ${peBeneficios} PE, mais que os ${custoUsuario} PE da ação.`);
    out.beneficiosCusto = Array.isArray(acao?.beneficiosCusto) ? acao.beneficiosCusto : [];
    out.beneficiosPE = peBeneficios;
  }

  /* Otimização de Energia (Controlador 2°): "escolher uma habilidade com custo
     de cada invocação para ter esse custo reduzido em 1PE".

     ⚠ Vale só para AÇÃO COM CUSTO, que é o termo definido do capítulo. Os 2 PE
     obrigatórios da Cura são custo de regra, e não a mecânica opcional, então
     ficam de fora. Está anotado em docs/a-fazer.md como assunção.

     O piso é 1 PE, que é o mínimo que uma Ação com Custo pode gastar. */
  out.custoOtimizado = false;
  if (dono.otimizacaoEnergia && acao?.custoOtimizado) {
    if (acaoComCusto) {
      out.custoOtimizado = true;
      out.custoAntesDaOtimizacao = out.custoPE;
      out.custoPE = Math.max(1, out.custoPE - 1);
    } else {
      warnings.push("Otimização de Energia só vale para uma Ação com Custo.");
    }
  }

  // Escape hatch DSL: um modificador numérico livre no contexto da invocação.
  if (acao?.modificadorExpr) out.modificador = evalNumber(acao.modificadorExpr, ctxParaExpr(inv, dono), 0);

  out.warnings = warnings;
  return out;
}

/** Resolve uma Característica passiva pelas tabelas do grau. */
export function resolveCaracteristica(carac, inv, dono = {}) {
  const grau = grauMeta(inv?.grau).value;
  const sub = ["vida", "teste", "rd", "tamanho", "livre"].includes(carac?.subtipo) ? carac.subtipo : "livre";
  // ⚠ A `descricao` viaja resolvida: é o texto que a pessoa escreveu para dizer
  // o que a Característica faz, e sem ela a Ficha mostrava só o nome, deixando
  // toda Característica "livre" (a que não tem número) sem conteúdo nenhum.
  const out = { id: carac?.id, nome: carac?.nome || "", subtipo: sub, descricao: carac?.descricao || "" };
  const warnings = [];

  if (sub === "vida") {
    out.valor = INV_CARACT_VIDA[grau];
  } else if (sub === "teste") {
    const cheio = INV_CARACT_TESTE[grau];
    const emPericia = carac?.alvoTeste !== "ataque" && carac?.alvoTeste !== "tr";
    // Perícia: bônus cheio. Jogada de Ataque ou TR: metade (e exige gatilho).
    out.valor = emPericia ? cheio : Math.floor(cheio / 2);
    out.alvoTeste = carac?.alvoTeste || "pericia";
    // O livro diz "bônus fixo em um teste ESPECÍFICO", então o alvo viaja
    // resolvido: qual perícia, ou qual Teste de Resistência. Em Jogadas de
    // Ataque vale para todas, com o gatilho que o livro exige.
    if (emPericia) {
      out.periciaId = carac?.periciaId || "";
      if (!out.periciaId) warnings.push("Escolha a perícia deste bônus.");
    } else if (carac?.alvoTeste === "tr") {
      out.trTipo = carac?.trTipo || "";
      out.requerGatilho = true;
      if (!out.trTipo) warnings.push("Escolha o Teste de Resistência deste bônus.");
    } else {
      out.requerGatilho = true;
    }
  } else if (sub === "rd") {
    const tiposExtras = Math.max(0, carac?.rdTiposExtras ?? 0);
    out.valor = Math.max(0, INV_CARACT_RD[grau] - 2 * tiposExtras);
    out.tiposExtras = tiposExtras;
    // A RD da Característica cobre UM tipo de dano, escolhido na criação. O
    // tipo é o que decide se duas Características colidem (o livro proíbe
    // acumular RD ao mesmo tipo), então viaja resolvido.
    out.rdTipo = carac?.rdTipo || "";
    out.rdTipoLabel = rdTipoLabel(carac?.rdTipo, carac?.rdTipoOutro);
    out.rdChave = rdTipoChave(carac?.rdTipo, carac?.rdTipoOutro);
    if (!out.rdTipo) warnings.push("Escolha o tipo de dano desta RD.");
  } else if (sub === "tamanho") {
    out.faixa = tamanhosNaFaixa(grau);
    out.tamanho = carac?.tamanho || "";
    out.tamanhoLabel = AFTY_TAMANHOS.find((t) => t.value === out.tamanho)?.label ?? out.tamanho;
    if (out.tamanho && !out.faixa.includes(out.tamanho)) {
      warnings.push(`Tamanho "${out.tamanho}" fora da faixa do grau.`);
    }
  }

  if (carac?.modificadorExpr) out.modificador = evalNumber(carac.modificadorExpr, ctxParaExpr(inv, dono), 0);

  out.warnings = warnings;
  return out;
}

// ------------------------------------------------------------
// Contexto de DSL (namespace próprio da invocação) + delega a fm-dsl
// ------------------------------------------------------------
/**
 * Um marcador está LIGADO nesta invocação? O registro dos marcadores é conteúdo
 * do Controlador e mora em `afty-habilidades.js`: aqui só se lê o estado.
 *
 * ⚠ Compat: antes do registro existia um marcador só, o booleano `inv.marcada`
 * do Concentrar Poder. Rascunho salvo com o shape velho continua valendo.
 */
export function marcadorLigado(inv, id) {
  const m = inv?.marcadores;
  if (m && typeof m === "object" && id in m) return !!m[id];
  if (id === "concentrar_poder") return !!inv?.marcada;
  return false;
}

/** A opção escolhida de um marcador que tem `opcoes` (ex.: Precisão: acerto ou CD). */
export function marcadorOpcao(inv, id) {
  const p = inv?.marcadorOpcoes;
  return (p && typeof p === "object" ? p[id] : null) || null;
}

// Variáveis `marc_*` do contexto: uma booleana por marcador ligado e, para os
// que têm opção, uma por opção (`marc_<id>_<opcao>`). É assim que um efeito
// como Precisão escolhe entre Acerto e CD sem precisar de canal condicional.
function varsDeMarcador(inv, dono) {
  const out = {};
  for (const m of Array.isArray(dono?.marcadores) ? dono.marcadores : []) {
    if (!m?.id) continue;
    const on = marcadorLigado(inv, m.id) ? 1 : 0;
    out[`marc_${m.id}`] = on;
    for (const o of Array.isArray(m.opcoes) ? m.opcoes : []) {
      out[`marc_${m.id}_${o.value}`] = on && marcadorOpcao(inv, m.id) === o.value ? 1 : 0;
    }
  }
  return out;
}

export function buildInvocacaoDslContext(inv, dono = {}, resolved = {}) {
  const at = inv?.atributos || {};
  const g = grauMeta(inv?.grau);
  return {
    ...varsDeMarcador(inv, dono),
    // Invocação (nomes diretos)
    forca: at.forca ?? 8, destreza: at.destreza ?? 8, constituicao: at.constituicao ?? 8,
    inteligencia: at.inteligencia ?? 8, sabedoria: at.sabedoria ?? 8, presenca: at.presenca ?? 8,
    mod_forca: mod(at.forca), mod_destreza: mod(at.destreza), mod_constituicao: mod(at.constituicao),
    mod_inteligencia: mod(at.inteligencia), mod_sabedoria: mod(at.sabedoria), mod_presenca: mod(at.presenca),
    grau: g.rank, grau_num: g.num,
    pv_max: resolved.pv ?? pvInvocacao(inv, dono),
    defesa: resolved.defesa ?? defesaInvocacao(inv, dono),
    deslocamento: resolved.deslocamento ?? deslocamentoInvocacao(),
    // Alias herdado do tempo em que Concentrar Poder era o único marcador.
    // Prefira `marc_concentrar_poder`, que é o nome do registro.
    marcada: marcadorLigado(inv, "concentrar_poder") ? 1 : 0,
    // Dono
    nd: dono.nd ?? 0, bt: dono.bt ?? 0, nivel_controlador: dono.nivelControlador ?? 0,
  };
}

// ------------------------------------------------------------
// Efeitos de Habilidade (Controlador) sobre a invocação
// ------------------------------------------------------------
// dono.efeitos é uma lista { canal, expr, quando? } vinda das Habilidades de
// Controlador escolhidas (ver afty-habilidades.js). Cada expr é avaliada pelo
// Motor no contexto DESTA invocação (grau, bt, nd, nivel_controlador, marcada...).
// `quando` (opcional) é uma expressão-condição: o efeito só entra se avaliar
// diferente de zero (ex.: "marc_concentrar_poder"). Aplicação canal a canal.
//
// ⚠ DANO e CURA têm canais SEPARADOS desde 2026-08-15. Concentrar Poder diz
// "toda rolagem de dano ou cura" e emite os quatro; Agressividade diz só dano e
// emite os dois de dano. Enquanto era um par só, Agressividade engordava a cura
// de graça.
export const EFEITO_CANAIS = [
  "pv",              // Pontos de Vida máximos
  "defesa",          // Defesa
  "rd",              // Redução de Dano contra TODOS os tipos (a RD por tipo vem de Característica)
  "deslocamento",    // metros de Deslocamento
  "pericias",        // vagas de perícia treinada
  "orcamentoLivre",  // Ações/Características que NÃO entram no custo
  "orcamentoPago",   // Ações/Características que entram no custo normalmente
  "atributoPontos",  // pontos de atributo para distribuir
  "custoReducao",    // abate do custo em PE para invocar
  "bonusTeste",      // todos os testes da invocação
  "bonusTR",         // só os Testes de Resistência
  "acerto",          // só as Jogadas de Ataque das Ações
  "cd",              // só a CD das Ações por Teste de Resistência
  "danoNivel",       // +N níveis na rolagem de DANO
  "danoBonus",       // +N ao total da rolagem de DANO
  "curaNivel",       // +N níveis na rolagem de CURA
  "curaBonus",       // +N ao total da rolagem de CURA
  "ataqueDanoAdicional", // MÁXIMO do dado extra que todo ataque da invocação carrega (ver dadoDoMaximo)
];
const CANAL_VALIDO = new Set(EFEITO_CANAIS);

function efeitosHabilidade(inv, dono) {
  const acc = Object.fromEntries(EFEITO_CANAIS.map((c) => [c, 0]));
  acc.detalhes = []; // { nome (fonte), canal, valor } por efeito aplicado
  // ⚠ Canal que não existe some CALADO se ninguém olhar: o `continue` abaixo
  // descartava o efeito inteiro sem deixar rastro, e um erro de digitação num
  // nome de canal viraria uma habilidade que simplesmente não faz nada. Vira
  // aviso na ficha (resolveInvocacao) em vez de silêncio.
  acc.canaisDesconhecidos = [];
  const efeitos = Array.isArray(dono?.efeitos) ? dono.efeitos : [];
  if (!efeitos.length) return acc;
  const ctx = buildInvocacaoDslContext(inv, dono);
  for (const e of efeitos) {
    if (!e) continue;
    // Contra a lista, não contra as chaves do acumulador: `detalhes` e
    // `canaisDesconhecidos` também são chaves dele e não são canais.
    if (!CANAL_VALIDO.has(e.canal)) {
      acc.canaisDesconhecidos.push({ nome: e.nome || e.origem || "Habilidade", canal: e.canal });
      continue;
    }
    // Condição do efeito: sem `quando`, sempre aplica; com, só se != 0.
    if (e.quando && evalNumber(e.quando, ctx, 0) === 0) continue;
    const valor = evalNumber(e.expr, ctx, 0);
    acc[e.canal] += valor;
    if (valor) acc.detalhes.push({ nome: e.nome || e.origem || "Habilidade", canal: e.canal, valor });
  }
  return acc;
}

// ------------------------------------------------------------
// Agregado das Características passivas
// ------------------------------------------------------------
/**
 * As Características são PASSIVAS e estão "sempre em efeito", então o que elas
 * concedem tem de chegar no stat block. Esta função junta as resolvidas num
 * pacote que o `resolveInvocacao` aplica.
 *
 * ⚠ Até 2026-08-15 elas eram resolvidas e JOGADAS FORA: a Característica de
 * Vida calculava "+15 PV" e o PV da invocação não mudava, a de Tamanho não
 * mexia no tamanho e a de Teste não entrava em teste nenhum. Só o texto do card
 * mostrava o número.
 */
export function agregarCaracteristicas(resolvidas = []) {
  const out = {
    pv: 0,
    tamanho: null,
    rdPorTipo: [],                                   // [{ chave, label, valor }]
    testes: { pericias: {}, resistencias: {}, ataque: 0 },
    warnings: [],
  };
  const rdIndex = new Map();
  const vistosTeste = new Set();
  for (const c of resolvidas) {
    if (c.subtipo === "vida") {
      // Duas Características de Vida não acumulam (o livro proíbe efeitos
      // iguais): vale a maior. O aviso de duplicata sai no resolveInvocacao.
      out.pv = Math.max(out.pv, c.valor ?? 0);
    } else if (c.subtipo === "tamanho") {
      // Mesma regra: a primeira manda, e a duplicata vira aviso.
      if (c.tamanho && !out.tamanho) out.tamanho = c.tamanho;
    } else if (c.subtipo === "rd") {
      if (!c.rdTipo) continue;
      // "É impossível acumular RD ao mesmo tipo": a segunda do mesmo tipo não
      // soma, e o aviso sai no resolveInvocacao.
      if (rdIndex.has(c.rdChave)) {
        out.warnings.push(`Duas Características dão RD contra ${c.rdTipoLabel}: elas não acumulam.`);
        const atual = rdIndex.get(c.rdChave);
        atual.valor = Math.max(atual.valor, c.valor ?? 0);
        continue;
      }
      const linha = { chave: c.rdChave, label: c.rdTipoLabel, valor: c.valor ?? 0 };
      rdIndex.set(c.rdChave, linha);
      out.rdPorTipo.push(linha);
    } else if (c.subtipo === "teste") {
      // Mesmo teste duas vezes é o mesmo efeito, e o livro proíbe: vale a maior.
      // ⚠ `ataque` já nasce 0 no acumulador, então quem decide se é repetição é
      // o conjunto de vistos, e não o valor guardado.
      const v = c.valor ?? 0;
      const guardar = (mapa, chave, marca) => {
        if (vistosTeste.has(marca)) {
          out.warnings.push("Duas Características dão bônus no mesmo teste: elas não acumulam.");
          mapa[chave] = Math.max(mapa[chave] ?? 0, v);
          return;
        }
        vistosTeste.add(marca);
        mapa[chave] = v;
      };
      if (c.alvoTeste === "ataque") guardar(out.testes, "ataque", "ataque");
      else if (c.alvoTeste === "tr") {
        if (c.trTipo) guardar(out.testes.resistencias, c.trTipo, `tr:${c.trTipo}`);
      } else if (c.periciaId) {
        guardar(out.testes.pericias, c.periciaId, `per:${c.periciaId}`);
      }
    }
  }
  return out;
}

// ------------------------------------------------------------
// Testes da invocação (Acerto / TR / Perícias / CD) para o stat block
// ------------------------------------------------------------
// Bônus de teste = mod(atributo) + BT (se treinado) + metade do Nível de
// Controlador + bônus de Habilidade. `dono` deve trazer bonusTesteHabilidade
// (o donoLocal do resolveInvocacao) para incluir Controle Aprimorado etc.
export function resolveTestesInvocacao(inv, dono = {}, caract = null) {
  const at = inv?.atributos || {};
  const bt = dono.bt ?? 0;
  const meio = Math.floor((dono.nivelControlador ?? 0) / 2);
  const hab = dono.bonusTesteHabilidade ?? 0;
  const base = meio + hab; // parte comum a todos os testes da invocação
  const baseTR = base + (dono.bonusTRHabilidade ?? 0); // TRs recebem um bônus extra (Concentrar Poder)
  // Bônus fixos vindos de Característica de Teste (passivas, sempre em efeito).
  const cTes = caract?.testes || { pericias: {}, resistencias: {}, ataque: 0 };

  // Acerto: jogada usa Força OU Destreza (o melhor), com BT no tipo treinado.
  const modFor = mod(at.forca ?? 8);
  const modDes = mod(at.destreza ?? 8);
  const best = modFor >= modDes ? { m: modFor, attr: "forca" } : { m: modDes, attr: "destreza" };
  /* ⚠ O bônus de Característica de Teste em Ataque ou TR NÃO entra no número
     do teste. O livro cobra "um gatilho específico" nos dois casos (só a
     Perícia recebe o bônus por completo, e sem gatilho), então somá-lo ao valor
     plano prometeria um bônus que quase nunca vale. Sai em `comGatilho`, à
     parte, para a ficha mostrar como condicional. */
  const acertoDe = (tipo) => ({
    bonus: best.m + (inv?.ataqueTreinado === tipo ? bt : 0) + base,
    attr: best.attr,
    treinado: inv?.ataqueTreinado === tipo,
    comGatilho: cTes.ataque || 0,
  });

  // Testes de Resistência: os 5 saves. Treinado soma BT, Mestre soma 1,5x BT.
  const trMestre = !!inv?.trMestre;
  const resistencias = AFTY_RESISTENCIAS.map((r) => {
    const treinado = inv?.trTreinado === r.value;
    const p = treinado ? (trMestre ? "mestre" : "treinado") : null;
    return {
      value: r.value, label: r.label, treinado, mestre: treinado && trMestre,
      bonus: mod(at[r.atributo] ?? 8) + bonusProficiencia(bt, p) + baseTR,
      comGatilho: cTes.resistencias[r.value] || 0,
    };
  });

  // Perícias: proficiência por perícia (treinado ou mestre). Uma Característica
  // de Teste pode dar bônus numa perícia em que a invocação NÃO é treinada, e
  // nesse caso a linha existe mesmo assim (o bônus vale, o BT é que não soma).
  const prof = (inv?.periciasProf && typeof inv.periciasProf === "object") ? inv.periciasProf : {};
  const pericias = AFTY_PERICIAS
    .filter((p) => prof[p.id] || cTes.pericias[p.id])
    .map((p) => ({
      id: p.id, nome: p.nome, mestre: prof[p.id] === "mestre", treinado: !!prof[p.id],
      bonus: mod(at[p.atributo] ?? 8) + bonusProficiencia(bt, prof[p.id] || null) + base + (cTes.pericias[p.id] || 0),
    }));

  // CD representativa de um ataque por TR (usa o melhor atributo; cada Ação por
  // TR mostra a sua CD exata pelo atributo chave dela). Não soma bônus de teste.
  const nd = Math.max(1, dono.nd ?? 1);
  const cd = 10 + Math.max(1, Math.floor(nd / 2)) + best.m + (dono.cdHabilidade ?? 0);

  return { acerto: { corpo: acertoDe("corpo"), distancia: acertoDe("distancia") }, cd, resistencias, pericias };
}

// ------------------------------------------------------------
// Resolver principal
// ------------------------------------------------------------
/**
 * As Habilidades de USO que o dono pode gastar NESTA invocação, com o número já
 * fechado. Elas não mudam a ficha dela (dependem de uma decisão no momento do
 * uso), mas têm valor calculável, e sem isso a mesa reabre o livro para saber
 * quanto custa um turno próprio de uma invocação de Segundo Grau.
 */
function opcoesDeUso(inv, dono) {
  const out = [];
  const g = grauMeta(inv?.grau);
  if (dono?.autonomia) {
    // "pagar uma quantidade adicional de PE igual a 2 para cada grau dela
    // (2 para quarto grau, 10 para grau especial)".
    out.push({ id: "autonomia", nome: "Autonomia", valor: `${2 * g.rank} PE` });
  }
  if (dono?.resistenciaSobrecarregada) {
    // "gastar uma quantidade de PE igual a metade do seu bônus de treinamento e,
    // para cada ponto gasto, a invocação tem seus pontos de vida aumentados em 10".
    const pe = Math.floor((dono.bt ?? 0) / 2);
    out.push({ id: "sobrecarga", nome: "Resistência Sobrecarregada", valor: `${pe} PE, +${pe * 10} PV` });
  }
  return out;
}

/**
 * Os marcadores LIGADOS nesta invocação, já com rótulo e a opção escolhida.
 * A Ficha precisa disso para dizer, no card, por que esta invocação é diferente
 * das outras: sem isso o jogador vê um PV maior e nenhuma pista da origem.
 */
function marcadoresDaInvocacao(inv, dono) {
  const out = [];
  for (const m of Array.isArray(dono?.marcadores) ? dono.marcadores : []) {
    if (!marcadorLigado(inv, m.id)) continue;
    const escolha = marcadorOpcao(inv, m.id);
    const opcao = (m.opcoes || []).find((o) => o.value === escolha) || null;
    out.push({ id: m.id, label: m.label, opcao: opcao?.label ?? null, faltaOpcao: !!m.opcoes?.length && !opcao });
  }
  return out;
}

export function resolveInvocacao(inv, dono = {}) {
  const g = grauMeta(inv?.grau);
  const efe = efeitosHabilidade(inv, dono);
  // Efeitos per-invocação que as Ações/Testes precisam ler vão num dono local:
  // bonusTeste (Controle Aprimorado, todos os testes), bonusTR (Concentrar
  // Poder, só TRs) e o escalonamento de dano/cura (Concentrar Poder).
  const donoLocal = { ...dono };
  if (efe.bonusTeste) donoLocal.bonusTesteHabilidade = efe.bonusTeste;
  if (efe.bonusTR) donoLocal.bonusTRHabilidade = efe.bonusTR;
  if (efe.acerto) donoLocal.acertoHabilidade = efe.acerto;
  if (efe.cd) donoLocal.cdHabilidade = efe.cd;
  if (efe.danoNivel) donoLocal.danoNivelHabilidade = efe.danoNivel;
  if (efe.danoBonus) donoLocal.danoBonusHabilidade = efe.danoBonus;
  if (efe.curaNivel) donoLocal.curaNivelHabilidade = efe.curaNivel;
  if (efe.curaBonus) donoLocal.curaBonusHabilidade = efe.curaBonus;
  if (efe.ataqueDanoAdicional) donoLocal.ataqueDanoAdicionalHabilidade = efe.ataqueDanoAdicional;

  // Override de Feitiço de Criação de Shikigamis: quando esta invocação É o
  // shikigami de um Feitiço, o NÍVEL do Feitiço manda no grau, no orçamento e
  // no custo. Ver `overridesShikigami` no fim deste arquivo.
  const ovr = dono.overridesPorInvocacao?.[inv?.id] || null;

  // As Características são passivas e resolvem ANTES dos stats, porque o PV, o
  // tamanho, a RD e os testes leem o que elas concedem.
  const caracteristicas = (inv?.caracteristicas || []).map((c) => resolveCaracteristica(c, inv, dono));
  const caract = agregarCaracteristicas(caracteristicas);

  const atributos = resumoAtributosInvocacao(inv, efe.atributoPontos);
  const pv = pvInvocacao(inv, dono) + efe.pv + caract.pv;
  const defesa = defesaInvocacao(inv, dono) + efe.defesa;
  const deslocamento = deslocamentoInvocacao() + efe.deslocamento;
  // Tamanho: Médio até que uma Característica de Tamanho diga outro.
  const tamanho = caract.tamanho || inv?.tamanho || "medio";
  // RD: a Geral (Melhoria Resistência, "contra todos os tipos") cobre tudo, e
  // cada Característica soma no tipo dela. A linha por tipo mostra o total que
  // vale contra aquele tipo, que é o número que a mesa usa.
  const rd = {
    geral: efe.rd,
    porTipo: caract.rdPorTipo.map((l) => ({ ...l, total: l.valor + efe.rd })),
  };
  // Ápice do Controle (efe.orcamentoLivre) dá slots que NÃO influenciam no custo.
  // Invocações Econômicas abate o custo, com piso em zero.
  const custoBruto = ovr?.custoFixo != null ? ovr.custoFixo : custoInvocacao(inv, efe.orcamentoLivre);
  const custo = Math.max(0, custoBruto - efe.custoReducao);
  const orcamento = orcamentoAcoesCaract(inv, efe.orcamentoLivre + efe.orcamentoPago + (ovr?.ajusteAcoes ?? 0));
  const perProf = (inv?.periciasProf && typeof inv.periciasProf === "object") ? inv.periciasProf : {};
  const pericias = {
    allowance: periciasAllowanceInvocacao(inv) + efe.pericias,
    usadas: usoPericias(perProf), // Mestre gasta 2, Treinado gasta 1
  };
  /* ⚠ A notação sai daqui JÁ ESTRUTURADA, num lugar só. O `resolveAcao` remonta
     o dado em vários pontos (níveis de dano, habilidades da Invocação), e
     estruturar em cada um deles seria quatro cópias da mesma conta. Ver
     `dadosDaNotacao` para o porquê de ser uma LISTA. */
  const comGrupos = (bloco) =>
    (bloco?.dado ? { ...bloco, grupos: dadosDaNotacao(bloco.dado) } : bloco);
  const acoes = (inv?.acoes || []).map((a) => {
    const r = resolveAcao(a, inv, donoLocal);
    return {
      ...r,
      dano: comGrupos(r.dano),
      cura: comGrupos(r.cura),
      danoAdicional: comGrupos(r.danoAdicional),
    };
  });
  const warnings = [...atributos.warnings, ...caract.warnings];
  // Grau ditado pelo Feitiço de Criação de Shikigamis: o nível do Feitiço manda,
  // e a invocação que não bate com ele é um erro de ficha.
  if (ovr?.grauExigido && ovr.grauExigido !== g.value) {
    warnings.push(`${ovr.fonte || "Feitiço de Shikigami"} exige ${grauMeta(ovr.grauExigido).label}.`);
  }
  // Mais de um Feitiço de Shikigami apontando para esta mesma invocação: vale o
  // primeiro, e os outros ficam sem shikigami nenhum.
  if (ovr?.disputa?.length > 1) {
    warnings.push(`${ovr.disputa.length} Feitiços apontam para esta invocação (${ovr.disputa.join(", ")}), e só o primeiro vale.`);
  }
  if (orcamento.usados > orcamento.total) {
    warnings.push(`Ações/Características: ${orcamento.usados} de ${orcamento.total} (excedeu).`);
  }
  // Perícias treinadas: uma Invocação não pode ser treinada em Ofício, e o total
  // segue o limite (1 + metade do melhor mod entre INT/SAB + ganho por grau).
  if ("oficio" in perProf) {
    warnings.push("Invocação não pode ser treinada em Ofício.");
  }
  if (pericias.usadas > pericias.allowance) {
    warnings.push(`Perícias treinadas: ${pericias.usadas} de ${pericias.allowance} (excedeu).`);
  }
  // Efeitos passivos que NÃO acumulam: no máximo uma Característica de Vida e uma
  // de Tamanho (o livro proíbe duas características com o mesmo efeito). RD e
  // Teste podem repetir, desde que em tipos de dano / testes diferentes.
  const porSubtipo = {};
  for (const c of caracteristicas) porSubtipo[c.subtipo] = (porSubtipo[c.subtipo] || 0) + 1;
  if (porSubtipo.vida > 1) warnings.push("Mais de uma Característica de Vida: efeitos iguais não acumulam.");
  if (porSubtipo.tamanho > 1) warnings.push("Mais de uma Característica de Tamanho: escolha só uma.");
  // Limite de Ações com Custo por grau. Só as opt-in do jogador contam: o custo
  // obrigatório de 2 PE da Cura não é uma Ação com Custo.
  const comCusto = acoes.filter((a) => a.acaoComCusto).length;
  if (comCusto > (INV_ACOES_COM_CUSTO_MAX[g.value] ?? 0)) {
    warnings.push(`Ações com Custo: ${comCusto} de ${INV_ACOES_COM_CUSTO_MAX[g.value]} (excedeu).`);
  }
  // Otimização de Energia: "UMA habilidade com custo de CADA invocação".
  const otimizadas = acoes.filter((a) => a.custoOtimizado).length;
  if (otimizadas > 1) {
    warnings.push(`Otimização de Energia: ${otimizadas} ações marcadas, e vale só uma por invocação.`);
  }
  for (const a of acoes) for (const w of a.warnings || []) warnings.push(`${a.nome || "Ação"}: ${w}`);
  for (const c of caracteristicas) for (const w of c.warnings || []) warnings.push(`${c.nome || "Característica"}: ${w}`);
  // Canal de efeito que não existe: erro de catálogo, não de ficha, mas aparece
  // aqui porque é o único lugar que enxerga o efeito aplicado.
  for (const d of efe.canaisDesconhecidos || []) {
    warnings.push(`${d.nome}: canal de efeito desconhecido "${d.canal}".`);
  }

  return {
    id: inv?.id,
    nome: inv?.nome || "",
    grau: g.value,
    grauLabel: g.label,
    tipoMecanico: inv?.tipoMecanico || "shikigami",
    tipoLabel: tipoInvocacaoLabel(inv),
    intermediario: tipoInvocacaoMeta(inv?.tipoMecanico).intermediario,
    retirada: tipoInvocacaoMeta(inv?.tipoMecanico).retirada,
    pv, defesa, deslocamento, custo, tamanho, rd,
    // O rótulo sai resolvido, como o `grauLabel`: quem tem o catálogo de
    // tamanhos é este lado.
    tamanhoLabel: AFTY_TAMANHOS.find((t) => t.value === tamanho)?.label ?? tamanho,
    atributos, orcamento, pericias,
    bonusTesteHabilidade: efe.bonusTeste,
    efeitosHabilidade: efe,
    caract,
    marcadores: marcadoresDaInvocacao(inv, dono),
    opcoesDeUso: opcoesDeUso(inv, dono),
    // O editor precisa saber se a marca de Otimização de Energia sequer existe
    // para esta ficha, e isso vem do dono, não da invocação.
    otimizacaoEnergia: !!dono.otimizacaoEnergia,
    // Crítico Aprimorado desce a margem das jogadas DELA para 19, e a Ficha
    // precisa do número na hora de rolar o acerto.
    margemCritico: dono.margemCritico ?? 20,
    criticoBrutal: !!dono.criticoBrutal,
    shikigami: ovr || null,
    testes: resolveTestesInvocacao(inv, donoLocal, caract),
    acoes, caracteristicas,
    warnings,
  };
}

/**
 * Lista de invocações do dono, resolvida. `dono` traz nd/bt/nivelControlador,
 * os `efeitos` das Habilidades, os `marcadores` disponíveis (com o limite já
 * avaliado) e os `overridesPorInvocacao` dos Feitiços de Shikigami.
 */
export function resolveInvocacoesList(lista, dono = {}) {
  const arr = Array.isArray(lista) ? lista : [];
  const resolvidas = arr.map((inv) => resolveInvocacao(inv, dono));
  // Contagem por marcador: quantas invocações estão marcadas contra o limite
  // daquele marcador. É o que a aba mostra e o que dispara o aviso de excesso.
  const marcadores = (Array.isArray(dono.marcadores) ? dono.marcadores : []).map((m) => {
    const marcadas = arr.filter((inv) => marcadorLigado(inv, m.id)).length;
    const semOpcao = Array.isArray(m.opcoes) && m.opcoes.length
      ? arr.filter((inv) => marcadorLigado(inv, m.id) && !marcadorOpcao(inv, m.id)).length
      : 0;
    return { ...m, marcadas, semOpcao, excedeu: marcadas > (m.limite ?? 0) };
  });
  return {
    lista: resolvidas,
    total: resolvidas.length,
    custoTotal: resolvidas.reduce((s, r) => s + r.custo, 0),
    temWarnings: resolvidas.some((r) => r.warnings.length > 0),
    marcadores,
    espacosIntermediarios: espacosDeIntermediario(arr),
  };
}

/** Normaliza o array de invocações da ficha (tolera ausência). */
export function normalizeInvocacoes(creature) {
  const arr = creature?.invocacoes;
  return Array.isArray(arr) ? arr : [];
}

// ============================================================
// FATIA 3 — Hordas
// ============================================================
// Uma Horda escolhe uma Invocação sua como LÍDER (Primeiro Grau ou inferior, ou
// seja, não Especial) e adiciona MEMBROS de grau estritamente INFERIOR ao líder.
// A maioria dos valores (deslocamento, ações) segue o líder. Custo e PV crescem
// com os membros, e as ações do líder ganham escalonamento pelas notas "Caso
// seja uma Horda" das tabelas. Ver "CRIANDO HORDAS" no doc.

/** Custo adicional em PE por membro, conforme o grau do membro. */
export const INV_HORDA_CUSTO_MEMBRO = { quarto: 1, terceiro: 2, segundo: 3 };

export function createBlankHorda() {
  return { id: novoId("horda"), nome: "", liderId: "", membroIds: [] };
}

/** Invocações que podem LIDERAR (Primeiro Grau ou inferior). */
export function lideresElegiveis(invocacoes = []) {
  return (Array.isArray(invocacoes) ? invocacoes : []).filter((inv) => grauMeta(inv.grau).rank <= 4);
}

/** Invocações que podem ser MEMBRO de um líder (grau estritamente inferior). */
export function membrosElegiveis(invocacoes = [], lider) {
  if (!lider) return [];
  const rl = grauMeta(lider.grau).rank;
  return (Array.isArray(invocacoes) ? invocacoes : []).filter(
    (inv) => inv.id !== lider.id && grauMeta(inv.grau).rank < rl
  );
}

// Sobe N categorias de tamanho a partir de um tamanho (clamp em Colossal).
function subirTamanho(tam, n) {
  const i = TAMANHO_ORDEM.indexOf(tam);
  if (i < 0) return tam;
  return TAMANHO_ORDEM[Math.min(TAMANHO_ORDEM.length - 1, i + n)];
}

// Ajusta o resultado de UMA ação do líder pelo escalonamento da horda.
function ajusteHordaAcao(base, escala) {
  const h = {};
  /* O dado sai com os `grupos` junto, pela mesma razão do `resolveInvocacao`:
     quem tem o número entrega o número, e ninguém relê notação de volta de uma
     string. Ver `dadosDaNotacao`. */
  const comDado = (dado) => ({ dado, grupos: dadosDaNotacao(dado) });
  if (base.familia === "ataque" && base.dano?.dado && escala.danoNiveis > 0) {
    h.dano = subirNiveisDano(base.dano.dado, escala.danoNiveis).dado;
    h.danoGrupos = comDado(h.dano).grupos;
  }
  if (base.auxilioSub === "cura" && base.cura?.dado && escala.curaNiveis > 0) {
    h.cura = subirNiveisDano(base.cura.dado, escala.curaNiveis).dado;
    h.curaGrupos = comDado(h.cura).grupos;
  }
  if (base.auxilioSub === "danoAdicional" && base.danoAdicional?.dado && escala.danoAdicionalNiveis > 0) {
    h.danoAdicional = subirNiveisDano(base.danoAdicional.dado, escala.danoAdicionalNiveis).dado;
    h.danoAdicionalGrupos = comDado(h.danoAdicional).grupos;
  }
  if ((base.auxilioSub === "defesa" || base.auxilioSub === "acerto") && escala.defesaAcertoBonus > 0) {
    h.valor = (base.valor ?? 0) + escala.defesaAcertoBonus;
  }
  if (base.auxilioSub === "rd" && escala.rdBonus > 0) {
    h.valor = (base.valor ?? 0) + escala.rdBonus;
  }
  return Object.keys(h).length ? h : null;
}

/** Resolve uma Horda a partir das fichas de invocação do dono. */
export function resolveHorda(horda, invocacoes = [], dono = {}) {
  const fichas = Array.isArray(invocacoes) ? invocacoes : [];
  const lider = fichas.find((x) => x.id === horda?.liderId) || null;
  const membros = (horda?.membroIds || []).map((id) => fichas.find((x) => x.id === id)).filter(Boolean);
  const warnings = [];
  const out = {
    id: horda?.id, nome: horda?.nome || "", liderId: horda?.liderId || "",
    membros: membros.map((m) => m.id), membrosCount: membros.length, valido: true, warnings,
  };

  if (!lider) { warnings.push("Escolha um líder para a horda."); out.valido = false; return out; }
  const rl = grauMeta(lider.grau).rank;
  if (rl > 4) { warnings.push("O líder deve ser de Primeiro Grau ou inferior."); out.valido = false; }

  const liderRes = resolveInvocacao(lider, dono);
  let pvExtra = 0, custoMembros = 0, danoNiveis = 0, curaNiveis = 0, nGrau2 = 0;
  for (const m of membros) {
    if (grauMeta(m.grau).rank >= rl) {
      warnings.push(`${m.nome || "Membro"} não pode ser de grau igual ou superior ao líder.`);
      out.valido = false;
    }
    const mRes = resolveInvocacao(m, dono);
    pvExtra += Math.floor(mRes.pv / 2);                                   // metade do PV do membro
    // Buchas de Canhão (10°): membro de quarto grau para de cobrar PE extra.
    const grauMembro = grauMeta(m.grau).value;
    const gratis = dono.membroQuartoGrauGratis && grauMembro === "quarto";
    custoMembros += gratis ? 0 : (INV_HORDA_CUSTO_MEMBRO[grauMembro] ?? 0);
    const g2 = grauMeta(m.grau).value === "segundo";
    if (g2) nGrau2 += 1;
    danoNiveis += g2 ? 2 : 1;   // +1 por membro, dobrado para membro de Grau 2
    curaNiveis += g2 ? 2 : 1;
  }
  const n = membros.length;
  const escala = {
    danoNiveis, curaNiveis,
    danoAdicionalNiveis: Math.floor(n / 2),   // +1 nível por 2 membros
    defesaAcertoBonus: Math.floor(nGrau2 / 2), // +1 por 2 membros de Grau 2
    rdBonus: n,                                // +1 por membro
    prejuizoExtra: Math.floor(n / 2),          // +1 uso de prejuízo por 2 membros
    tamanhoCategorias: Math.floor(n / 2),      // +1 categoria por 2 membros
  };

  out.lider = { id: lider.id, nome: lider.nome, grau: lider.grau };
  out.pv = liderRes.pv + pvExtra;
  out.custo = liderRes.custo + custoMembros;
  out.deslocamento = liderRes.deslocamento;
  // ⚠ O tamanho parte do RESOLVIDO do líder, não do `lider.tamanho` cru: quem
  // define o tamanho de uma invocação é a Característica de Tamanho, e ler o
  // campo bruto fazia toda horda subir a partir de Médio.
  out.tamanho = subirTamanho(liderRes.tamanho, escala.tamanhoCategorias);
  out.tamanhoLabel = AFTY_TAMANHOS.find((t) => t.value === out.tamanho)?.label ?? out.tamanho;
  out.escala = escala;
  /* ⚠ As ações vêm do `liderRes`, e NÃO de um `resolveAcao` refeito aqui.
     Refazer perdia tudo que mora no `donoLocal` do líder (Concentrar Poder,
     Agressividade, Precisão) e também os `grupos` estruturados: a mesma ação
     rolava um dano dentro da horda e outro fora dela. */
  out.acoes = (liderRes.acoes || []).map((base) => ({
    nome: base.nome, familia: base.familia, auxilioSub: base.auxilioSub,
    base, horda: ajusteHordaAcao(base, escala),
  }));

  return out;
}

/** Lista de hordas do dono, resolvida. */
export function resolveHordasList(hordas, invocacoes = [], dono = {}) {
  const arr = Array.isArray(hordas) ? hordas : [];
  const lista = arr.map((h) => resolveHorda(h, invocacoes, dono));
  return { lista, total: lista.length, custoTotal: lista.reduce((s, h) => s + (h.custo || 0), 0) };
}

// ------------------------------------------------------------
// Validador de conteúdo (mesmo papel de validarCatalogoAptidoes): confere que
// as tabelas por grau estão completas e consistentes. Não há catálogo de texto
// do livro aqui, o "conteúdo" validado são as tabelas numéricas.
// ------------------------------------------------------------
export function validarCatalogoInvocacoes() {
  const erros = [];
  const graus = AFTY_INV_GRAUS.map((g) => g.value);

  // Ranks e nums únicos e cobrindo 1..5 e 0..4.
  const ranks = AFTY_INV_GRAUS.map((g) => g.rank).sort((a, b) => a - b);
  if (JSON.stringify(ranks) !== JSON.stringify([1, 2, 3, 4, 5])) erros.push("ranks de grau inconsistentes");

  // Toda tabela por grau cobre exatamente os 5 graus.
  const tabelas = {
    INV_ATRIBUTOS_POR_GRAU,
    INV_ACOES_CARACT_BASE,
    INV_PERICIAS_ADICIONAIS,
    INV_ACOES_COM_CUSTO_MAX,
  };
  for (const [nome, tab] of Object.entries(tabelas)) {
    for (const gr of graus) if (!(gr in tab)) erros.push(`${nome}: falta o grau "${gr}"`);
    for (const k of Object.keys(tab)) if (!graus.includes(k)) erros.push(`${nome}: grau extra "${k}"`);
  }

  // Atributos: pontos e max crescentes por rank.
  let prevP = -1, prevM = -1;
  for (const g of AFTY_INV_GRAUS) {
    const t = INV_ATRIBUTOS_POR_GRAU[g.value];
    if (t.pontos <= prevP) erros.push(`INV_ATRIBUTOS_POR_GRAU: pontos não crescem em "${g.value}"`);
    if (t.max < prevM) erros.push(`INV_ATRIBUTOS_POR_GRAU: max regride em "${g.value}"`);
    prevP = t.pontos; prevM = t.max;
  }

  // Tabelas da Fatia 2. Algumas COMEÇAM no Terceiro Grau (sem Quarto).
  const cobre = (nome, tab, esperado) => {
    for (const gr of esperado) if (!(gr in tab)) erros.push(`${nome}: falta o grau "${gr}"`);
    for (const k of Object.keys(tab)) if (!esperado.includes(k)) erros.push(`${nome}: grau extra "${k}"`);
  };
  const cinco = graus;                                   // todos os 5
  const semQuarto = ["terceiro", "segundo", "primeiro", "especial"]; // começa no Terceiro
  cobre("INV_DANO.jogadaUnico", INV_DANO.jogadaUnico, cinco);
  cobre("INV_DANO.trUnico", INV_DANO.trUnico, cinco);
  cobre("INV_DANO.multiplos", INV_DANO.multiplos, semQuarto);
  cobre("INV_DANO.area", INV_DANO.area, semQuarto);
  cobre("INV_CURA.unico", INV_CURA.unico, cinco);
  cobre("INV_CURA.multiplos", INV_CURA.multiplos, semQuarto);
  cobre("INV_ALCANCE", INV_ALCANCE, cinco);
  cobre("INV_AREA", INV_AREA, semQuarto);
  cobre("INV_BONUS_DEFESA", INV_BONUS_DEFESA, cinco);
  cobre("INV_BONUS_ACERTO", INV_BONUS_ACERTO, cinco);
  cobre("INV_DANO_ADICIONAL", INV_DANO_ADICIONAL, cinco);
  cobre("INV_RD_ACAO", INV_RD_ACAO, cinco);
  cobre("INV_CARACT_VIDA", INV_CARACT_VIDA, cinco);
  cobre("INV_CARACT_TESTE", INV_CARACT_TESTE, cinco);
  cobre("INV_CARACT_RD", INV_CARACT_RD, cinco);
  cobre("INV_CARACT_TAMANHO", INV_CARACT_TAMANHO, cinco);

  return erros;
}
