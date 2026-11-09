/**
 * ============================================================
 * ARMAS IMPROVISADAS E DANO DE FONTES EXTERNAS (CX5, 2026-11-06)
 * ============================================================
 * Livro p.325 (Armas Improvisadas) e p.326 (Dano de Fontes Externas). As duas tabelas do Livro e as contas que o texto manda fazer,
 * como dado puro e funções puras. Nada daqui entra no derive nem nos seletores.
 *
 * ⚠ ARMA IMPROVISADA NÃO ENTRA NO SELETOR DA TÉCNICA MARCIAL. A decisão do autor (docs/afty-tecnicas-marciais.md, item 17) é que o
 * seletor oferece o Ataque Básico e as armas equipadas, e este módulo não a toca. A arma improvisada é uma AÇÃO de mesa que usa o
 * "bônus para jogadas de ataque corpo a corpo" da ficha, e a tela que a oferecer lê as funções daqui.
 *
 * ⚠ MÓDULO FOLHA, ZERO IMPORTS.
 *
 * O que o texto diz, e onde cada coisa está:
 *   - *"Por padrão, você é capaz de pegar e manusear um objeto de tamanho Pequeno ou menor"* (`TAMANHO_MAXIMO_PADRAO`);
 *   - o dano depende do tamanho, o tipo de dano varia com o objeto (a mesa escolhe) e *"Você soma o seu modificador de Força ao
 *     total de dano causado"* (`danoDaArmaImprovisada`);
 *   - o valor de Força necessário para manejar vem da mesma tabela (`forcaNecessaria`). O livro não diz o que acontece abaixo
 *     dele, então a função só informa (`abaixoDaForca`) e a mesa decide;
 *   - *"o Narrador pode definir que ele cause o dano de uma categoria de tamanho inferior ou superior"* (`ajuste`);
 *   - *"Sempre que você atacar com uma arma improvisada, ela recebe uma quantidade de dano igual ao dano que você causou com ela"*
 *     (`danoNaArma`); quando quebra é "Destruindo Objetos" (p.326 da regra de objetos), que não está transcrito aqui;
 *   - a tabela de Fontes Externas é referência do Narrador: dano e exemplo.
 * ============================================================
 */

export const ARMAS_IMPROVISADAS = Object.freeze([
  { id: "minuscula", nome: "Minúscula", dano: { dados: 1, faces: 4 }, forca: 4, exemplo: "Um lápis" },
  { id: "pequena", nome: "Pequena", dano: { dados: 1, faces: 6 }, forca: 8, exemplo: "Cadeira" },
  { id: "media", nome: "Média", dano: { dados: 1, faces: 10 }, forca: 14, exemplo: "Armário" },
  { id: "grande", nome: "Grande", dano: { dados: 3, faces: 8 }, forca: 20, exemplo: "Carro" },
  { id: "enorme", nome: "Enorme", dano: { dados: 4, faces: 12 }, forca: 26, exemplo: "Ônibus" },
]);

/** p.325: o que se pega e maneja por padrão. */
export const TAMANHO_MAXIMO_PADRAO = "pequena";

/** p.326: referência de dano de fontes externas. O Narrador escolhe o tipo de dano. */
export const FONTES_EXTERNAS = Object.freeze([
  { dano: { dados: 1, faces: 10 }, exemplo: "Atingido por um objeto de peso considerável (prateleira ou armário de madeira)" },
  { dano: { dados: 2, faces: 10 }, exemplo: "Atingido por um objeto pesado (armário de metal)" },
  { dano: { dados: 4, faces: 10 }, exemplo: "Atingido por um objeto extremamente pesado (um carro)" },
  { dano: { dados: 10, faces: 10 }, exemplo: "Atingido por um objeto enorme e pesado (uma grande pedra, um deslizamento) ou amassado por duas paredes" },
  { dano: { dados: 20, faces: 10 }, exemplo: "Atingido por um objeto de tamanho colossal (um prédio colapsando) ou sendo submerso em lava" },
]);

const texto = ({ dados, faces }) => `${dados}d${faces}`;

export const armaImprovisada = (id) => ARMAS_IMPROVISADAS.find((a) => a.id === id) ?? null;

/** O tamanho depois do ajuste do Narrador: -1 desce uma categoria, +1 sobe uma, preso às pontas da tabela. */
export function tamanhoAjustado(id, ajuste = 0) {
  const i = ARMAS_IMPROVISADAS.findIndex((a) => a.id === id);
  if (i < 0) return null;
  const j = Math.min(ARMAS_IMPROVISADAS.length - 1, Math.max(0, i + Math.trunc(Number(ajuste) || 0)));
  return ARMAS_IMPROVISADAS[j];
}

/**
 * O dano de um ataque com arma improvisada.
 *   { tamanho, modForca, forca?, ajuste? }
 * Devolve `{ tamanho, dados, faces, fixo, texto, forcaNecessaria, abaixoDaForca, acimaDoPadrao }`. O modificador de Força soma ao
 * total (p.325), inclusive negativo. `acimaDoPadrao` avisa que o objeto passa do tamanho que se maneja por padrão.
 */
export function danoDaArmaImprovisada({ tamanho, modForca = 0, forca = null, ajuste = 0 } = {}) {
  const a = tamanhoAjustado(tamanho, ajuste);
  if (!a) return null;
  const fixo = Math.trunc(Number(modForca)) || 0;
  const padrao = ARMAS_IMPROVISADAS.findIndex((x) => x.id === TAMANHO_MAXIMO_PADRAO);
  return {
    tamanho: a.id, nome: a.nome, dados: a.dano.dados, faces: a.dano.faces, fixo,
    texto: `${texto(a.dano)}${fixo > 0 ? ` + ${fixo}` : fixo < 0 ? ` - ${-fixo}` : ""}`,
    forcaNecessaria: a.forca,
    abaixoDaForca: forca != null && Math.trunc(Number(forca)) < a.forca,
    acimaDoPadrao: ARMAS_IMPROVISADAS.findIndex((x) => x.id === a.id) > padrao,
  };
}

/** A arma improvisada recebe dano igual ao que você causou com ela. */
export const danoNaArma = (danoCausado) => Math.max(0, Math.trunc(Number(danoCausado)) || 0);
