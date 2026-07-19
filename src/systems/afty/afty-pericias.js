/**
 * ============================================================
 * CATÁLOGO DE PERÍCIAS — GRIMÓRIO AFTY
 * ============================================================
 * Conteúdo é DADO (ver roadmap). Transcrição VERBATIM da seção "LISTA DE
 * PERÍCIAS" (tabela Perícia / Atributo Chave / Requer Treinamento? /
 * Complementar). As DESCRIÇÕES individuais de cada perícia ainda NÃO foram
 * enviadas pelo autor: quando chegarem, entram no campo `descricao`.
 *
 * Colunas do livro → campos:
 *   • atributo: chave do Atributo Chave (Força→forca, Presença→presenca, etc.).
 *   • requerTreinamento: a perícia só pode ser usada se a criatura for treinada
 *     nela (coluna "Requer Treinamento?" = Sim).
 *   • complementar: perícia que NÃO entra por padrão no jogo, opcional por
 *     campanha (coluna "Complementar" = Sim). Também é possível remover perícias
 *     padrão (ex.: Tecnologia numa campanha de época), a critério do Mestre.
 *
 * Ordem = a da tabela do livro (alfabética). Ids estáveis, snake_case sem acento.
 * ============================================================
 */

import { AFTY_ATTRS } from "./afty-schema";

export const AFTY_PERICIAS = [
  { id: "acrobacia",      nome: "Acrobacia",      atributo: "destreza" },
  { id: "atletismo",      nome: "Atletismo",      atributo: "forca" },
  { id: "direcao",        nome: "Direção",        atributo: "sabedoria",    complementar: true },
  { id: "enganacao",      nome: "Enganação",      atributo: "presenca" },
  { id: "feiticaria",     nome: "Feitiçaria",     atributo: "inteligencia", requerTreinamento: true },
  { id: "furtividade",    nome: "Furtividade",    atributo: "destreza" },
  { id: "historia",       nome: "História",       atributo: "inteligencia" },
  { id: "intimidacao",    nome: "Intimidação",    atributo: "presenca" },
  { id: "intuicao",       nome: "Intuição",       atributo: "sabedoria" },
  { id: "investigacao",   nome: "Investigação",   atributo: "inteligencia" },
  { id: "medicina",       nome: "Medicina",       atributo: "sabedoria",    requerTreinamento: true },
  { id: "ocultismo",      nome: "Ocultismo",      atributo: "sabedoria" },
  { id: "oficio",         nome: "Ofício",         atributo: "inteligencia", requerTreinamento: true },
  { id: "percepcao",      nome: "Percepção",      atributo: "sabedoria" },
  { id: "performance",    nome: "Performance",    atributo: "presenca" },
  { id: "persuasao",      nome: "Persuasão",      atributo: "presenca" },
  { id: "prestidigitacao", nome: "Prestidigitação", atributo: "destreza",   requerTreinamento: true },
  { id: "sobrevivencia",  nome: "Sobrevivência",  atributo: "sabedoria",    complementar: true },
  { id: "tecnologia",     nome: "Tecnologia",     atributo: "inteligencia" },
  { id: "teologia",       nome: "Teologia",       atributo: "inteligencia", complementar: true },
];

const BY_ID = Object.fromEntries(AFTY_PERICIAS.map((p) => [p.id, p]));
export const getPericia = (id) => BY_ID[id] || null;

/** Perícias padrão (as que entram no jogo por default, sem as complementares). */
export const periciasPadrao = () => AFTY_PERICIAS.filter((p) => !p.complementar);
/** Perícias complementares (opcionais por campanha). */
export const periciasComplementares = () => AFTY_PERICIAS.filter((p) => p.complementar);

/**
 * Perícias que uma INVOCAÇÃO pode ser treinada: as comuns (padrão), exceto
 * Ofício (o livro proíbe treinar Invocação em Ofício). Complementares ficam de
 * fora por serem opcionais de campanha.
 */
export const periciasParaInvocacao = () =>
  AFTY_PERICIAS.filter((p) => !p.complementar && p.id !== "oficio");

/** Validador de conteúdo (mesmo papel de validarCatalogoAptidoes). */
export function validarCatalogoPericias() {
  const erros = [];
  const ids = new Set();
  const nomes = new Set();
  const attrKeys = new Set(AFTY_ATTRS.map((a) => a.key));
  for (const p of AFTY_PERICIAS) {
    if (ids.has(p.id)) erros.push(`id duplicado: ${p.id}`);
    ids.add(p.id);
    if (nomes.has(p.nome)) erros.push(`nome duplicado: ${p.nome}`);
    nomes.add(p.nome);
    if (!p.nome) erros.push(`${p.id}: sem nome`);
    if (!attrKeys.has(p.atributo)) erros.push(`${p.id}: atributo inválido "${p.atributo}"`);
  }
  return erros;
}
