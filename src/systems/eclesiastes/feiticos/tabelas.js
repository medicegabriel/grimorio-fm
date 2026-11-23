/**
 * ============================================================
 * TABELAS DOS FEITIÇOS DE ECLESIASTES (rework por pontos, 2026-11-22)
 * ============================================================
 * Fonte: `docs/eclesiastes-feiticos.md`. Os números são os do texto, e a
 * explicação de cada um mora lá. Leituras adotadas onde o texto cala estão em
 * `docs/a-fazer.md`, seção "Eclesiastes: Feitiços por pontos".
 *
 * ⚠ FOLHA, ZERO IMPORTS (lista `FOLHAS` do `asserts/t-ordem-modulos.mjs`). O
 * criador importa este arquivo pela aba nova, e um import aqui que alcance o
 * ciclo do equipamentos derruba o app em tela branca, como em 2026-09-02.
 * ============================================================
 */

/** Ação Utilizada: ajuste na distribuição, em múltiplos do BT. */
export const ACOES_ECL = Object.freeze([
  { value: "bonus", label: "Ação Bônus", curto: "Bônus", multBt: -1 },
  { value: "comum", label: "Ação Comum", curto: "Comum", multBt: 0 },
  { value: "completa", label: "Ação Completa", curto: "Completa", multBt: 1 },
  { value: "reacao", label: "Reação", curto: "Reação", multBt: 0 },
]);

/** Dificuldade do requisito: pontos adicionais. */
export const REQUISITOS_ECL = Object.freeze([
  { value: "facil", label: "Fácil", pontos: 2 },
  { value: "medio", label: "Médio", pontos: 4 },
  { value: "dificil", label: "Difícil", pontos: 6 },
  { value: "impossivel", label: "Impossível", pontos: 10 },
]);

/** Fadiga e Exaustão causadas ao conjurador: pontos por unidade. */
export const PONTOS_POR_FADIGA = 1;
export const PONTOS_POR_EXAUSTAO = 4;

/** Dado de dano e cura pelo BT. */
export function facesDoDadoEcl(bt) {
  const b = Math.trunc(Number(bt) || 0);
  if (b >= 7) return 12;
  if (b >= 5) return 10;
  return 8;
}

/** Alcance: 9 m por ponto, a partir de Próprio ou Toque. */
export const METROS_POR_PONTO_ALCANCE = 9;
export const ALCANCES_ECL = Object.freeze([
  { value: "proprio", label: "Próprio" },
  { value: "toque", label: "Toque" },
  { value: "distancia", label: "Distância" },
]);

/** Formato de área: dimensão por ponto. A Linha tem faixa principal e adicionais. */
export const FORMATOS_AREA_ECL = Object.freeze([
  { value: "esfera", label: "Esfera", dimensao: "Raio", metros: 3 },
  { value: "cone", label: "Cone", dimensao: "Comprimento", metros: 3 },
  { value: "linha", label: "Linha", dimensao: "Faixa Principal", metros: 4.5 },
]);
export const METROS_FAIXA_ADICIONAL = 9;
export const LARGURA_FAIXA = 1.5;

export const DURACOES_ECL = Object.freeze([
  { value: "imediato", label: "Imediato" },
  { value: "duradouro", label: "Duradouro" },
  { value: "sustentado", label: "Sustentado" },
]);

export const ALVOS_AUX_ECL = Object.freeze([
  { value: "proprio", label: "Próprio" },
  { value: "alvo", label: "Alvo" },
  { value: "area", label: "Área ou Vários" },
]);

/**
 * Tabela de Custos dos Efeitos Auxiliares.
 * `valor`: quanto uma unidade vale (o que a tela mostra). `custo`: pontos por unidade.
 * `teto`: unidades máximas em função do BT. `escolha`: o que se escolhe na criação.
 * `canal`: linha do Motor do Afty (`afty-efeitos.js`). `indisponivel`: o texto ainda
 * não dá o que falta (Grupo Temático não lista os grupos).
 */
const tetoBt = (bt) => bt;
const tetoMetade = (bt) => Math.floor(bt / 2);
const tetoDobro = (bt) => 2 * bt;
export const AUX_EFEITOS_ECL = Object.freeze([
  { value: "acerto", label: "Acerto", valor: 1, unidade: "", custo: 2, teto: tetoBt, canal: "bonusAcerto" },
  { value: "defesa", label: "Defesa", valor: 1, unidade: "", custo: 2, teto: tetoBt, canal: "defesa" },
  { value: "tr", label: "Teste de Resistência", valor: 1, unidade: "", custo: 2, teto: tetoBt, canal: "bonusTR", escolha: "tr" },
  { value: "pericia", label: "Perícia", valor: 1, unidade: "", custo: 1, teto: tetoBt, canal: "bonusPericia", escolha: "pericia" },
  { value: "grupoPericias", label: "Grupo Temático de Perícias", valor: 1, unidade: "", custo: 2, teto: tetoBt, canal: "bonusPericia", indisponivel: "O texto ainda não lista os grupos" },
  { value: "todasPericias", label: "Todas as Perícias", valor: 1, unidade: "", custo: 3, teto: tetoBt, canal: "bonusPericia" },
  { value: "iniciativa", label: "Iniciativa", valor: 1, unidade: "", custo: 2, teto: tetoBt, canal: "iniciativa" },
  { value: "cd", label: "Classe de Dificuldade", valor: 1, unidade: "", custo: 3, teto: tetoBt, canal: "cd" },
  { value: "deslocamento", label: "Deslocamento", valor: 1.5, unidade: "m", custo: 1, teto: tetoBt, canal: "movimento" },
  { value: "alcanceCorpo", label: "Alcance Corpo a Corpo", valor: 1.5, unidade: "m", custo: 1, teto: tetoBt, canal: null },
  { value: "alcanceDistancia", label: "Alcance à Distância", valor: 3, unidade: "m", custo: 1, teto: tetoBt, canal: null },
  { value: "margem", label: "Margem de Crítico", valor: 1, unidade: "", custo: 3, teto: tetoMetade, canal: "margemCritico" },
  { value: "atributo", label: "Atributo", valor: 1, unidade: "", custo: 2, teto: tetoBt, canal: "atributo", escolha: "atributo" },
  { value: "limiteAtributo", label: "Aumento de Limite de Atributo", valor: 1, unidade: "", custo: 2, teto: tetoBt, canal: "limiteAtributo", escolha: "atributo", soBonus: true },
  { value: "atributoLimite", label: "Aumento de Atributo e Limite", valor: 1, unidade: "", custo: 3, teto: tetoBt, canal: "atributo", escolha: "atributo", soBonus: true },
  { value: "rdGeral", label: "RD Geral", valor: 2, unidade: "", custo: 1, teto: tetoBt, canal: "rdGeral", soBonus: true },
  { value: "rdGrupo", label: "RD por Grupo de Dano", valor: 3, unidade: "", custo: 1, teto: tetoBt, canal: "rdTipo", escolha: "grupoDano", soBonus: true },
  { value: "rdTipo", label: "RD por Tipo de Dano", valor: 4, unidade: "", custo: 1, teto: tetoBt, canal: "rdTipo", escolha: "tipoDano", soBonus: true },
  { value: "negacaoRd", label: "Negação de RD", valor: 2, unidade: "", custo: 1, teto: tetoBt, canal: "ignoraRD" },
  { value: "nivelDano", label: "Nível de Dano", valor: 1, unidade: "", custo: 1, teto: tetoDobro, canal: "nivelDano" },
  { value: "danoFixo", label: "Dano Fixo", valor: 3, unidade: "", custo: 2, teto: tetoBt, canal: "danoBonus", soBonus: true },
]);
export const AUX_POR_ID_ECL = Object.freeze(Object.fromEntries(AUX_EFEITOS_ECL.map((e) => [e.value, e])));

/** Custos das Condições. `null` = Em Revisão no texto: indisponível, nunca zero. */
export const CONDICOES_ECL = Object.freeze([
  ["abalado", "Abalado", null], ["agarrado", "Agarrado", 16], ["apavorado", "Apavorado", null],
  ["atordoado", "Atordoado", 34], ["caido", "Caído", 13], ["cego", "Cego", null],
  ["condenado", "Condenado", 6], ["confuso", "Confuso", 8], ["debilitado", "Debilitado", null],
  ["desprevenido", "Desprevenido", 12], ["enfeiticado", "Enfeitiçado", null], ["enjoado", "Enjoado", 4],
  ["enredado", "Enredado", 13], ["esmorecido", "Esmorecido", null], ["fascinado", "Fascinado", 17],
  ["fraco", "Fraco", null], ["frustrado", "Frustrado", null], ["imovel", "Imóvel", 10],
  ["inconsciente", "Inconsciente", 30], ["lento", "Lento", 5], ["ofuscado", "Ofuscado", 6],
  ["paralisado", "Paralisado", 36], ["pasmo", "Pasmo", 16], ["petrificado", "Petrificado", 20],
  ["surdo", "Surdo", 15],
].map(([value, label, custo]) => Object.freeze({ value, label, custo })));
export const CONDICAO_POR_ID_ECL = Object.freeze(Object.fromEntries(CONDICOES_ECL.map((c) => [c.value, c])));

/** Tipos de Feitiço Ativo e as travas de cada um. */
export const TIPOS_FEITICO_ECL = Object.freeze([
  { value: "comum", label: "Comum" },
  { value: "destrutivo", label: "Destrutivo", btMin: 5, ndMin: 12 },
  { value: "cataclismico", label: "Cataclísmico", btMin: 6, ndMin: 18 },
]);
export const TECNICA_MAXIMA_ECL = Object.freeze({ btMin: 5, ndMin: 12 });
export const LIBERACAO_BT_MIN = 4;
export const LIBERACAO_PONTOS_FIXOS = 4;
export const MORTE_DIRETA_ND_MIN = 20;
export const MORTE_DIRETA_CUSTO = 2;

/** Passivos. */
export const PASSIVOS_ECL = Object.freeze([
  { value: "permanente", label: "Permanente" },
  { value: "condicional", label: "Condicional" },
  { value: "semiativo", label: "Semiativo" },
]);
export const USOS_SEMIATIVO = Object.freeze([
  { value: "metade", label: "Metade do BT", ajuste: 0 },
  { value: "um", label: "Um Uso", ajuste: 2 },
  { value: "bt", label: "BT Inteiro", ajuste: -2 },
]);
export const RECARGAS_SEMIATIVO = Object.freeze([
  { value: "cena", label: "Cena", ajuste: 0 },
  { value: "descanso", label: "Descanso Longo", ajuste: 2 },
  { value: "interludio", label: "Interlúdio", ajuste: 4 },
]);

/** Manutenção do Sustentado: 1 PE mais 1 a cada 10 pontos dos efeitos mantidos. */
export const manutencaoSustentado = (pontos) => 1 + Math.floor(Math.max(0, pontos) / 10);
