import { CONDICOES_CATALOGO } from "./afty-feiticos";

/**
 * ============================================================
 * CONDIÇÕES — a força, e o lugar reservado para o texto
 * ============================================================
 * As 26 condições existem no Afty desde sempre como NOME dentro de uma lista de
 * força, em `CONDICOES_CATALOGO`. Isso bastava enquanto elas eram só marcador:
 * um Feitiço guarda `{ nome, forca }` e a Ficha desenhava o nome com a chave da
 * força ao lado, crua e em minúscula ("media").
 *
 * O autor pediu em 2026-08-28 para ver, na aba Buffs, "as condições, seus
 * efeitos, o nível da condição". Duas dessas três coisas já existiam e estavam
 * mal desenhadas. A terceira, o EFEITO, nunca foi escrita em lugar nenhum.
 *
 * ⚠ ESTE MÓDULO É O TERRENO PREPARADO, E NÃO A REGRA. O `CONDICAO_TEXTOS` nasce
 * VAZIO de propósito: inventar o que faz "Fragilizado" seria número saído do
 * nada, que é exatamente o que o aviso da aba sempre recusou a fazer. Quando o
 * autor mandar os textos, eles entram naquele objeto e mais nada precisa mudar:
 * a tela já sabe abrir a linha, e o validador já reclama de nome que não existe.
 *
 * ⚠ NENHUMA MECÂNICA AQUI. Uma condição continua sem efeito modelado, e quem
 * precisar de número segue criando um buff ad-hoc, que é onde ele fica visível e
 * rastreável. Ver a pergunta D6 em docs/afty-ficha-final.md.
 *
 * ⚠ Leitura LAZY do catálogo, como em todo módulo que consulta um catálogo
 * remendável: um Addon pode acrescentar condição (família `condicoes`), e um
 * mapa montado no topo congelaria o estado anterior à instalação.
 * ============================================================
 */

/**
 * As quatro forças, em ordem. O `nivel` é o que a tela mostra como degrau: a
 * chave crua ("media") é de código, e o jogador lê "Média" e vê que ela é a
 * segunda de quatro.
 *
 * ⚠ A ORDEM É A DA GRAVIDADE, e é ela que ordena a lista aplicada: com três
 * condições em cima da criatura, a que mais dói tem de estar no topo.
 */
export const FORCAS_CONDICAO = [
  { id: "fraca",   label: "Fraca",   nivel: 1 },
  { id: "media",   label: "Média",   nivel: 2 },
  { id: "forte",   label: "Forte",   nivel: 3 },
  { id: "extrema", label: "Extrema", nivel: 4 },
];

const FORCA_POR_ID = Object.fromEntries(FORCAS_CONDICAO.map((f) => [f.id, f]));

/**
 * O QUE CADA CONDIÇÃO FAZ, chaveado pelo NOME exato do catálogo.
 *
 * ⚠ VAZIO ATÉ O AUTOR MANDAR. Cada entrada é `{ texto, resumo? }`:
 *
 *     "Cego": {
 *       resumo: "Não enxerga",                    // uma linha, aparece fechada
 *       texto: "Você falha automaticamente em…",  // o parágrafo do livro
 *     },
 *
 * O `resumo` é opcional e serve para a linha fechada dizer alguma coisa sem
 * abrir. Sem ele, a linha fechada mostra só o nome e a força, que é o que ela
 * mostra hoje.
 *
 * ⚠ NOME COM ACENTO E CAIXA EXATOS, iguais aos de `CONDICOES_CATALOGO`. O
 * `validarCatalogoCondicoes` recusa qualquer chave que não case, justamente
 * porque uma chave errada não daria erro nenhum: a condição só apareceria sem
 * texto, calada, e ninguém saberia que o texto foi escrito. É a mesma armadilha
 * do requisito `nota` anotada em docs/afty-status.md.
 */
export const CONDICAO_TEXTOS = {};

/** Toda condição do catálogo, achatada, com a força de cada uma. */
function todasAsCondicoes() {
  const out = [];
  for (const f of FORCAS_CONDICAO) {
    for (const nome of CONDICOES_CATALOGO[f.id] ?? []) out.push({ nome, forca: f });
  }
  return out;
}

/**
 * A ficha de uma condição pelo NOME: força, degrau e texto, se houver.
 *
 * Devolve algo mesmo para nome desconhecido, e isso não é descuido: uma condição
 * gravada na sessão pode ter vindo de um Addon que foi desinstalado, e nesse
 * caso ela continua sendo um rótulo válido em cima da criatura. Ver a nota de
 * "não há linha morta para condição" em `afty-feiticos.js`.
 */
export function fichaDaCondicao(nome, forcaId = null) {
  const achada = todasAsCondicoes().find((c) => c.nome === nome);
  const forca = achada?.forca ?? FORCA_POR_ID[forcaId] ?? null;
  const texto = CONDICAO_TEXTOS[nome] ?? null;
  return {
    nome,
    forcaId: forca?.id ?? null,
    forcaLabel: forca?.label ?? null,
    nivel: forca?.nivel ?? 0,
    resumo: texto?.resumo ?? null,
    descricao: texto?.texto ?? null,
    // Do catálogo, ou de um Addon que sumiu. A tela não muda por isso, mas o
    // seletor não pode oferecer o que não existe mais.
    doCatalogo: !!achada,
  };
}

/** As condições agrupadas por força, para o seletor mostrar o degrau de cada uma. */
export function condicoesPorForca() {
  return FORCAS_CONDICAO.map((f) => ({
    ...f,
    condicoes: (CONDICOES_CATALOGO[f.id] ?? []).map((nome) => fichaDaCondicao(nome)),
  })).filter((g) => g.condicoes.length > 0);
}

/**
 * Validador de conteúdo, no mesmo papel de `validarCatalogoAptidoes`.
 *
 * A única coisa que ele tem para conferir hoje é o casamento das chaves do
 * `CONDICAO_TEXTOS` com os nomes do catálogo, e é justamente a que vai errar:
 * um texto escrito para "Enfeitiçado" e gravado como "Enfeiticado" não daria
 * erro nenhum, a condição só apareceria sem texto.
 */
export function validarCatalogoCondicoes() {
  const erros = [];
  const nomes = new Set(todasAsCondicoes().map((c) => c.nome));

  for (const [nome, def] of Object.entries(CONDICAO_TEXTOS)) {
    if (!nomes.has(nome)) {
      erros.push(`CONDICAO_TEXTOS: "${nome}" não existe em CONDICOES_CATALOGO`);
      continue;
    }
    if (!def?.texto) erros.push(`CONDICAO_TEXTOS: "${nome}" não tem texto`);
  }

  // Nome repetido em duas forças: a condição apareceria duas vezes no seletor e
  // a força dela dependeria da ordem de leitura.
  const vistos = new Set();
  for (const c of todasAsCondicoes()) {
    if (vistos.has(c.nome)) erros.push(`CONDICOES_CATALOGO: "${c.nome}" aparece em mais de uma força`);
    vistos.add(c.nome);
  }
  return erros;
}
