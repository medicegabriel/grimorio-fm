/**
 * ============================================================
 * FEITIÇOS — GRIMÓRIO AFTY (calculadora de criação)
 * ============================================================
 * Diferente de todo o resto do sistema: Feitiços NÃO são um
 * catálogo de onde se escolhe. O jogador CRIA os dele seguindo o
 * Guia de Criação. Então este arquivo tem duas partes:
 *
 *  1. DADOS DE REFERÊNCIA (tabelas verbatim do livro): custo por
 *     nível, acesso por ND, dano por nível, alcance, área,
 *     condições, sangramento, requisitos.
 *
 *  2. MOTOR de cálculo: dado o que o jogador escolheu para um
 *     Feitiço, computa dano final, alcance, área, custo, CD e
 *     avisos de validação (limites do guia, nível acessível...).
 *
 * O que é fórmula FECHADA e derivável sozinho:
 *   - Orçamento de Feitiços: 2 + 1 por nível par + 1 no ND 10 e no 20.
 *   - Nível máximo acessível pela faixa de ND, antecipado por Adiantar a
 *     Evolução para quem alcança os níveis exigidos de Conjurador.
 *   - Custo padrão por nível, com piso de 1 PE (salvo nível 0).
 *   - CD da técnica: derived.cd (já usa o Atributo Principal da
 *     Técnica = core.tecnicaAttr e a Maestria). A criação só
 *     desloca com cdDelta, limitado a 1 + nível.
 *
 * ⚠ Regras VERBATIM do livro. Números não parafraseados.
 * ⚠ Arredondamento = piso (floor), salvo o texto dizer o contrário.
 *
 * Cobre os FEITIÇOS DE DANO, AUXILIARES, CURATIVOS e ESPECIAIS. O tipo Passivo
 * usa o Motor livre e não possui uma calculadora de valor própria.
 * ============================================================
 */

// grauMeta: fonte da verdade dos graus de Invocação (Shikigami usa o motor de
// Invocações). afty-invocacoes não importa daqui, então não há ciclo.
import { registrarFamilia } from "./afty-addons";
import { grauMeta } from "./afty-invocacoes";
import {
  detalhesDoCanalEscopos, resolverEfeitosDanoFinal, valorCanalEscopos,
} from "./afty-efeitos";
import { bonusRitual, resolveRitual } from "./afty-rituais";
// Liberações Máximas. ⚠ `multArea` chega renomeado: o calculador de Dano já tem
// uma local com esse nome (a do Destrutivo × 1,5 com a da Linha).
import {
  alvosExtras, categoriasDoFeitico, custoLiberacao, estimuloBonus, explosaoDados,
  explosaoValor, LIBERACAO_CATEGORIAS, LIBERACAO_ND_MINIMO, maxMelhorias,
  melhoriasDoFeitico, multAlcance,
  multArea as multAreaLiberacao, nivelTemLiberacao, pressaoAcerto, pressaoCd,
  regrasDaLiberacao, resolveLiberacao, rodadasExtras, rodadasSemUpkeep,
  rupturaRd, sobrecargaDados, vigorCura,
} from "./afty-liberacoes";

// ---------------------------------------------------------------
// NÍVEIS. Feitiços vão do nível 0 ao 5. Técnica Máxima ("max") é um
// degrau acima, presente nas tabelas mas destravado por Aptidão
// (Técnica Máxima), não pela criação comum. Guardado como "max".
// ---------------------------------------------------------------
export const FEITICO_NIVEIS = [0, 1, 2, 3, 4, 5];

export const NIVEL_LABEL = {
  0: "Nível 0",
  1: "Nível 1",
  2: "Nível 2",
  3: "Nível 3",
  4: "Nível 4",
  5: "Nível 5",
  max: "Técnica Máxima",
};

// ---------------------------------------------------------------
// CUSTO EM ENERGIA AMALDIÇOADA por nível do Feitiço (tabela verbatim).
// Todo Feitiço tem custo mínimo de 1 PE, salvo os de nível 0. O piso
// só morde quando uma habilidade externa REDUZ o custo (a criação em
// si não mexe no custo). Técnica Máxima não tem linha própria na
// tabela de custo do Livro Básico.
// ---------------------------------------------------------------
export const FEITICO_CUSTO_PE = { 0: 0, 1: 2, 2: 5, 3: 8, 4: 12, 5: 20 };

// ---------------------------------------------------------------
// ACESSO DE FEITIÇOS por faixa de Nível de Personagem (== ND).
// A tabela é o próprio bônus de treinamento subindo. Para no ND 20
// (nível 5). Acima de 20 mantenho o teto no nível 5 (a tabela do
// livro não vai além). Adiantar a Evolução antecipa os mesmos degraus
// para quem alcançou o 4° nível de Conjurador. Devolve o MAIOR nível
// de Feitiço acessível entre a progressão comum e a antecipada.
// ---------------------------------------------------------------
export function nivelMaxFeitico(nd, nivelConjurador = 0) {
  const n = Math.max(1, nd | 0);
  const nc = Math.max(0, nivelConjurador | 0);
  const comum = n >= 17 ? 5 : n >= 13 ? 4 : n >= 9 ? 3 : n >= 5 ? 2 : 1;
  const adiantado = nc >= 15 ? 5 : nc >= 11 ? 4 : nc >= 7 ? 3 : nc >= 4 ? 2 : 1;
  return Math.max(comum, adiantado);
}

const nivelMaxFeiticoDoContexto = (ctx = {}) =>
  nivelMaxFeitico(ctx.nd, ctx.nivelConjurador);

// ---------------------------------------------------------------
// ORÇAMENTO: na CRIATURA os Feitiços não têm contador próprio.
// Autor, 2026-07-26: Feitiços e Habilidades Gerais gastam o MESMO
// caixa, `contadorHabilidades(maestria, patamar)` em afty-gerais.js
// (dobro da Maestria, +2 Desafio, +4 Calamidade, triplo no Beyond).
// O antigo `totalFeiticos(nd)` (2 + ND/2 + marcos de 10 e 20) foi
// substituído por ele. Variações de Liberação seguem sem contar.
//
// ⚠ NA FICHA DE JOGADOR A PROGRESSÃO DO LIVRO VOLTOU (autor, 2026-08-31),
// em `totalFeiticosJogador` logo abaixo, e com ORÇAMENTO PRÓPRIO. Ver a
// divergência `progressaoDeFeiticos` em afty-sistema.js.
// ---------------------------------------------------------------

/**
 * ORÇAMENTO DE FEITIÇOS DA FICHA DE JOGADOR.
 *
 * Texto VERBATIM do livro (autor, 2026-08-31):
 *
 *   "Todo usuário de energia amaldiçoada começa com uma certa quantidade de
 *    Feitiços: todo personagem usuário de energia amaldiçoada, por padrão,
 *    inicia com dois Feitiços. Um personagem também obtém novos Feitiços
 *    conforme sobe de nível, recebendo um novo Feitiço em todo nível par.
 *    Também se recebe um Feitiço adicional no nível 10 e outra no nível 20."
 *
 * E a Habilidade de Especialização Conjuração Aprimorada (Conjurador, 1° nível),
 * cuja segunda metade estava transcrita em afty-habilidades.js sem ter onde cair:
 *
 *   "Além disso, você passa a receber novos Feitiços em todo nível, ao invés de
 *    apenas nos níveis pares."
 *
 * ⚠ QUEM CONCEDE É O NÍVEL QUE SE SOBE, e não o nível em que se está. O
 * personagem "inicia com dois" no 1° nível e "obtém novos conforme SOBE de
 * nível", então os níveis que concedem são o 2 em diante. Com a regra padrão são
 * os pares dentro dessa faixa (`piso(n / 2)`), e com a Conjuração Aprimorada são
 * todos eles (`n - 1`).
 *
 * ⚠ ASSUNÇÃO ANOTADA: a leitura alternativa é que "todo nível" inclua o 1°, e aí
 * um Conjurador de 1° nível teria TRÊS Feitiços. Ela foi descartada porque
 * contradiz "por padrão, inicia com dois Feitiços" na mesma página. As duas
 * leituras só divergem a partir do 3° nível. Anotada em docs/a-fazer.md.
 *
 * ⚠ Os marcos do 10 e do 20 valem nas DUAS, porque a Conjuração Aprimorada troca
 * só a cadência ("ao invés de apenas nos níveis pares") e não fala dos marcos.
 *
 * Devolve `{ total, partes }`. As `partes` são o hover de fontes, e existem pela
 * regra de que todo número derivado mostra de onde veio.
 */
export function totalFeiticosJogador(nivel, { conjuracaoAprimorada = false } = {}) {
  const n = Math.max(1, Math.trunc(Number(nivel) || 1));
  const porNivel = conjuracaoAprimorada ? n - 1 : Math.floor(n / 2);
  const partes = [
    { label: "Inicial", valor: 2 },
    ...(porNivel
      ? [{ label: conjuracaoAprimorada ? "Por Nível (Conjuração Aprimorada)" : "Níveis Pares", valor: porNivel }]
      : []),
    ...(n >= 10 ? [{ label: "Nível 10", valor: 1 }] : []),
    ...(n >= 20 ? [{ label: "Nível 20", valor: 1 }] : []),
  ];
  return { total: partes.reduce((s, p) => s + p.valor, 0), partes };
}

/** A Habilidade de Especialização que troca a cadência da progressão acima. */
export const CONJURACAO_APRIMORADA_ID = "cnj_conjuracao_aprimorada";

// Custo padrão por nível, com o piso de 1 (salvo nível 0).
export function custoPadrao(nivel) {
  if (nivel === 0) return 0;
  const c = FEITICO_CUSTO_PE[nivel];
  return c == null ? null : Math.max(1, c);
}

/**
 * Feitiço de mesa com regra escrita verbatim.
 *
 * O motor ainda resolve o custo normal e as reduções de Conjurador, mas não
 * tenta converter a regra particular em uma combinação aproximada das tabelas
 * de Dano ou Auxiliar. Os campos estruturados alimentam a Ficha, e a descrição
 * continua sendo a fonte de verdade para a resolução própria da mesa.
 */
export function calcularFeiticoPersonalizado(feitico, ctx = {}) {
  const f = feitico || {};
  const custoPE = custoPadrao(f.nivel);
  return {
    custoPE,
    custoPEBase: custoPE,
    reducoesCustoPE: [],
    avisos: [],
    acao: f.acaoPersonalizada || null,
    alcanceTexto: String(f.alcanceTexto ?? "").trim() || null,
    alvoTexto: String(f.alvoTexto ?? "").trim() || null,
    duracao: String(f.duracaoTexto ?? "").trim() || null,
    resolucaoTexto: String(f.resolucaoTexto ?? "").trim() || null,
    cd: f.comCd === false ? null : (ctx.cdBase ?? null),
  };
}

const DOMINANCIA_EM_FEITICO_ID = "cnj_dominancia_em_feitico";
const MANIPULACAO_PERFEITA_ID = "cnj_manipulacao_perfeita";

function nivelNumericoParaReducao(nivel) {
  return nivel === "max" ? 6 : Math.max(0, Math.trunc(Number(nivel) || 0));
}

/**
 * Aplica as reduções de custo escolhidas para um Feitiço.
 *
 * Dominância em Feitiço é a exceção explícita do livro e arredonda para cima.
 * Manipulação Perfeita reduz o custo-base pela metade, arredondada para baixo.
 * O bônus de treinamento limita somente quantos Feitiços podem ser escolhidos.
 * As duas acumulam, o custo positivo nunca cai abaixo de 1 PE e uma Variação de
 * Liberação usa a seleção e o nível do Feitiço-base apontado por `variacaoDe`.
 */
export function aplicaReducoesCustoFeitico(feitico, calculo, ctx = {}) {
  if (!calculo || calculo.custoPE == null) return calculo;

  const custoBase = calculo.custoPEBase ?? calculo.custoPE;
  const habilidades = Array.isArray(ctx.habilidades) ? ctx.habilidades : [];
  const escolhas = ctx.reducoesCustoFeitico && typeof ctx.reducoesCustoFeitico === "object"
    ? ctx.reducoesCustoFeitico
    : {};
  const lista = Array.isArray(ctx.feiticos) ? ctx.feiticos : [];
  const baseId = feitico?.variacaoDe || feitico?.id || null;
  const feiticoBase = lista.find((item) => item.id === baseId) || feitico || {};
  const reducoes = [];

  if (habilidades.includes(DOMINANCIA_EM_FEITICO_ID) && escolhas.dominancia === baseId) {
    const valor = Math.ceil(nivelNumericoParaReducao(feiticoBase.nivel) / 2);
    if (valor > 0) reducoes.push({ fonte: "Dominância em Feitiço", valor });
  }

  const bonusTreinamento = Math.max(0, Math.trunc(Number(ctx.bonusTreinamento) || 0));
  const escolhidosManipulacao = Array.isArray(escolhas.manipulacao)
    ? [...new Set(escolhas.manipulacao)].slice(0, bonusTreinamento)
    : [];
  if (
    habilidades.includes(MANIPULACAO_PERFEITA_ID)
    && escolhidosManipulacao.includes(baseId)
  ) {
    const custoPelaMetade = Math.floor(custoBase / 2);
    const valor = custoBase - custoPelaMetade;
    if (valor > 0) reducoes.push({ fonte: "Manipulação Perfeita", valor });
  }

  for (const fonte of detalhesDoCanalEscopos(ctx.efeitos, "custoPE")) {
    const valor = Math.max(0, Math.trunc(Number(fonte.valor) || 0));
    if (valor > 0) reducoes.push({ fonte: fonte.nome, valor });
  }

  const reducaoTotal = reducoes.reduce((total, reducao) => total + reducao.valor, 0);
  const custoPE = custoBase > 0 ? Math.max(1, custoBase - reducaoTotal) : custoBase;
  return {
    ...calculo,
    custoPE,
    custoPEBase: custoBase,
    reducoesCustoPE: reducoes,
  };
}

/** Texto das fontes numéricas do custo, usado somente no hover. */
export function tituloCustoFeitico(calculo) {
  if (!calculo || calculo.custoPE == null) return "Custo em PE";
  const linhas = [`Custo base: ${calculo.custoPEBase ?? calculo.custoPE} PE`];
  for (const reducao of calculo.reducoesCustoPE ?? []) {
    linhas.push(`${reducao.fonte}: -${reducao.valor} PE`);
  }
  linhas.push(`Total: ${calculo.custoPE} PE`);
  return linhas.join("\n");
}

// ---------------------------------------------------------------
// TABELAS DE DANO (verbatim). Cada linha = [quantidadeDeDados, tipoDeDado].
// A média impressa no livro é referência (com arredondamentos irregulares
// no próprio livro), então a média exibida é RECALCULADA por piso quando
// os dados mudam. As médias verbatim ficam em MEDIA_VERBATIM para conferência.
// ---------------------------------------------------------------

// Alvo único, teste de RESISTÊNCIA. Suceder anula (nível 0) ou corta pela metade (1+).
export const DANO_UNICO_TR = {
  0: [1, 10], 1: [3, 8], 2: [7, 8], 3: [12, 8], 4: [14, 10], 5: [18, 12], max: [26, 12],
};
// Alvo único, teste de ATAQUE. Acerto = dano total, erro = nada.
export const DANO_UNICO_ATAQUE = {
  0: [1, 10], 1: [4, 8], 2: [8, 8], 3: [14, 8], 4: [16, 10], 5: [20, 12], max: [28, 12],
};
// Alvos múltiplos / área, teste de RESISTÊNCIA. Sucesso corta pela metade.
// Não há linha de nível 0 (área começa no nível 1).
export const DANO_AREA_TR = {
  1: [2, 8], 2: [4, 8], 3: [5, 12], 4: [10, 10], 5: [12, 12], max: [22, 10],
};

// Médias verbatim do livro (conferência do validador).
export const MEDIA_VERBATIM = {
  unico_tr: { 0: 5, 1: 14, 2: 31, 3: 54, 4: 77, 5: 116, max: 169 },
  unico_ataque: { 0: 5, 1: 18, 2: 36, 3: 63, 4: 88, 5: 129, max: 182 },
  area_tr: { 1: 9, 2: 18, 3: 32, 4: 55, 5: 78, max: 120 },
};

// ---------------------------------------------------------------
// ALCANCE (Feitiços com alvo) e ÁREA AFETADA (Feitiços em área), em metros.
// ---------------------------------------------------------------
export const ALCANCE_POR_NIVEL = {
  0: 9, 1: 12, 2: 18, 3: 24, 4: 30, 5: 48, max: 60,
};
// Área base considera esfera/cone/quadrado. Linha usa este valor × 1,5.
// Não há área de nível 0.
export const AREA_POR_NIVEL = {
  1: 4.5, 2: 6, 3: 9, 4: 12, 5: 18, max: 24,
};

// Formas de área (autor): Esfera, Linha e Cone. Linha e Cone contam como
// LINHA para o cálculo de dano (comprimento = área × 1,5 e dados extras).
export const FORMAS_AREA = [
  { value: "esfera", label: "Esfera" },
  { value: "linha",  label: "Linha" },
  { value: "cone",   label: "Cone" },
];
export const formaEhLinha = (forma) => forma === "linha" || forma === "cone";

// A área é SEMPRE múltipla de 1,5m (autor), arredondada PARA BAIXO ao múltiplo
// de 1,5 (o piso padrão do sistema). O epsilon evita erro de ponto flutuante
// engolir um múltiplo exato (ex.: 9/1,5 vindo como 5,9999).
export const arredondaArea = (m) => {
  if (m == null) return null;
  const passos = Math.floor(m / 1.5 + 1e-9);
  return Math.round(passos * 1.5 * 10) / 10;
};

// ---------------------------------------------------------------
// AÇÕES (Conjuração). As tabelas de dano assumem "ação comum".
// - Ação completa: +nível dados.
// - Ação bônus: -(1 + nível) dados.
// - Ritual Estendido: recebe os aumentos de um Feitiço de Ação Completa
//   (+nível dados), conforme regra dos Destrutivos. A seção geral de
//   Conjuração ainda não chegou, então isto pode refinar.
// - Reação: Feitiço de Dano NÃO pode ser reduzido para reação.
// ---------------------------------------------------------------
export const FEITICO_ACOES = [
  { value: "bonus",    label: "Ação Bônus" },
  { value: "comum",    label: "Ação Comum" },
  { value: "completa", label: "Ação Completa" },
  { value: "ritual",   label: "Ritual Estendido" },
];

export function modDadosPorAcao(acao, nivel) {
  switch (acao) {
    case "completa": return nivel;
    case "ritual":   return nivel;      // aumentos de Ação Completa
    case "bonus":    return -(1 + nivel);
    default:         return 0;          // comum
  }
}

// ---------------------------------------------------------------
// REQUISITOS DE FEITIÇO. A dificuldade do requisito devolve bônus.
// Para Feitiços de Dano, o ganho vem em DADOS. (Para Auxiliares com
// Múltiplos Efeitos vem em PE, tratado no motor dos Auxiliares.)
// ---------------------------------------------------------------
export const REQUISITO_DIFICULDADE = [
  { value: "facil",      label: "Fácil",      pe: 2,  dados: 1 },
  { value: "medio",      label: "Médio",      pe: 4,  dados: 2 },
  { value: "dificil",    label: "Difícil",    pe: 6,  dados: 3 },
  { value: "impossivel", label: "Impossível", pe: 10, dados: 5 },
];

// ---------------------------------------------------------------
// CONDIÇÕES.
//  - Redução de dados por força da condição (ao anexar a um Feitiço de dano).
//  - Quais forças cada nível de Feitiço pode aplicar.
//  - Duração padrão por (nível do Feitiço × força da condição), em rodadas.
//  - Catálogo das condições nomeadas por força (as não listadas não podem
//    ser aplicadas de forma alguma).
// ---------------------------------------------------------------
export const CONDICAO_FORCAS = [
  { value: "fraca",   label: "Fraca",   reducao: 1 },
  { value: "media",   label: "Média",   reducao: 3 },
  { value: "forte",   label: "Forte",   reducao: 5 },
  { value: "extrema", label: "Extrema", reducao: 8 },
];
export const CONDICAO_REDUCAO = { fraca: 1, media: 3, forte: 5, extrema: 8 };

// Forças que cada nível de Feitiço pode aplicar (nível 0 não aplica condição).
export const CONDICAO_FORCAS_POR_NIVEL = {
  0: [],
  1: ["fraca"],
  2: ["fraca", "media"],
  3: ["fraca", "media", "forte"],
  4: ["fraca", "media", "forte", "extrema"],
  5: ["fraca", "media", "forte", "extrema"],
  max: ["fraca", "media", "forte", "extrema"],
};

// Duração padrão em rodadas. "cena" = até o alvo passar na CD. "-" = não disponível.
export const CONDICAO_DURACAO = {
  1:   { fraca: 1,      media: null, forte: null, extrema: null },
  2:   { fraca: 2,      media: 1,    forte: null, extrema: null },
  3:   { fraca: 3,      media: 2,    forte: 1,    extrema: null },
  4:   { fraca: 4,      media: 3,    forte: 2,    extrema: 1 },
  5:   { fraca: 5,      media: 4,    forte: 3,    extrema: 1 },
  max: { fraca: "cena", media: 5,    forte: 4,    extrema: 1 },
};

// Catálogo das condições por força (verbatim). Sangramento é variável.
// Desmembramento não é condição, mas é tratado como uma por Feitiços.
export const CONDICOES_CATALOGO = {
  fraca:   ["Abalado", "Caído", "Desorientado", "Desprevenido", "Sangramento", "Sofrendo"],
  media:   ["Agarrado", "Amedrontado", "Condenado", "Confuso", "Enfeitiçado", "Engasgando", "Enjoado", "Enredado", "Envenenado", "Lento", "Surdo"],
  forte:   ["Aterrorizado", "Cego", "Exposto", "Fragilizado", "Imóvel"],
  extrema: ["Atordoado", "Inconsciente", "Paralisado", "Desmembramento"],
};

/* ============================================================ */
/* ADDONS: Condição                                              */
/* ============================================================ */
/* Oitava família (2026-08-20). O autor nomeou "Novas Condições" entre os
   exemplos do que um Addon deve poder fazer.

   ⚠ A CONDIÇÃO É GRAVADA PELO NOME, e não por id: um Feitiço guarda
   `{ nome, forca }`. Então o namespace vale só para o `id` da entrada, que
   existe para o pacote não repetir a si mesmo, e o que entra no catálogo é o
   `nome` LIMPO. Prefixar o nome poria "minha-mesa:Congelado" na tela.

   ⚠ Consequência assumida: **não há linha morta para condição.** Sem id na
   ficha não há como saber que um nome veio de um addon que sumiu, e o Feitiço
   simplesmente continua com o nome escrito. É honesto: a condição é rótulo, e
   rótulo que perde a fonte continua sendo rótulo. */

const CONDICOES_BASE = Object.fromEntries(
  Object.entries(CONDICOES_CATALOGO).map(([forca, lista]) => [forca, [...lista]]),
);

function aplicarExtrasCondicoes(extras = []) {
  for (const [forca, lista] of Object.entries(CONDICOES_BASE)) {
    CONDICOES_CATALOGO[forca] = [...lista];
  }
  for (const e of extras) {
    if (!CONDICOES_CATALOGO[e.forca]) continue;   // força inválida: o validador já reclamou
    CONDICOES_CATALOGO[e.forca].push(e.nome);
  }
}

registrarFamilia("condicoes", {
  rotulo: "Condição",
  chave: "id",
  obrigatorios: ["nome", "forca"],
  aplicar: aplicarExtrasCondicoes,
  // ⚠ NÃO ACEITA REMENDO: cada condição é uma STRING dentro da lista da
  // força, e não uma entrada com campos. Não há campo para trocar.
  remendavel: false,
});

// SANGRAMENTO — condição variável com perda de vida própria por força.
export const SANGRAMENTO = {
  fraco:   [2, 6],   // 2d6
  medio:   [3, 8],   // 3d8
  forte:   [4, 10],  // 4d10
  extremo: [6, 10],  // 6d10
};
// Mapeia a força do sangramento para a força de condição (redução de dados / limite de nível).
export const SANGRAMENTO_FORCA = { fraco: "fraca", medio: "media", forte: "forte", extremo: "extrema" };

// ---------------------------------------------------------------
// SUBTIPOS de Feitiço de Dano (mutuamente exclusivos entre si).
// ---------------------------------------------------------------
export const DANO_SUBTIPOS = [
  { value: "nenhum",       label: "Comum" },
  { value: "destrutivo",   label: "Destrutivo",   nivelMin: 4, area: true },
  { value: "cataclismico", label: "Cataclísmico", nivelMin: 5, area: true },
  { value: "continuo",     label: "Dano Contínuo" },
  { value: "vampirico",    label: "Vampírico" },
  { value: "multiplos",    label: "Múltiplos Disparos" },
];

// ---------------------------------------------------------------
// PROPORÇÃO DE TROCAS. A base do guia (alvo único):
//   +1 dado = +2 de acerto = 6m de alcance = +1 de CD.
// Reduzir um eixo abaixo do padrão libera "unidades" para aumentar
// outro. As condições, ação, subtipo, requisito e linha NÃO entram nesta proporção.
//
// Em Feitiços de ÁREA (autor): cada +1 dado sai de 12m de alcance OU 3m de área
// OU o par 6m de alcance + 1,5m de área, que somam. Alcance e área valem METADE
// do padrão de alvo único, e cada eixo é independente e aditivo.
//
// O modificador de área entra na área BASE (de 1,5m em 1,5m), e SÓ DEPOIS os
// multiplicadores × 1,5 do Destrutivo e da Linha/Cone escalam o resultado:
//   área = arredonda( (base + modificador) × mult Destrutivo × mult Linha ).
// Por isso a taxa de 3m/dado vale para o modificador na base, sem distinção de forma.
// ---------------------------------------------------------------
export const TROCA_UNIDADE = {
  dado: 1, acerto: 2, cd: 1,
  alcanceUnico: 6,   // alvo único: 6m = 1 dado
  alcanceArea: 12,   // área: 12m = 1 dado
  area: 3,           // área (na base): 3m = 1 dado
};

// Metros de alcance/área que valem 1 dado, conforme o tipo de alvo.
export function taxasTroca(alvo) {
  return {
    alcance: alvo === "area" ? TROCA_UNIDADE.alcanceArea : TROCA_UNIDADE.alcanceUnico,
    area: TROCA_UNIDADE.area,
  };
}

// Dados extras por transformar a área em LINHA (não contam para o limite do guia).
export function dadosLinha(nivel) {
  if (nivel <= 0) return 0;
  if (nivel === 1) return 1;
  if (nivel <= 3) return 2;   // nível 2 ou 3
  return 4;                   // nível 4 ou 5 (e Técnica Máxima)
}

// Limites do guia para as trocas (não valem para condições).
export function limitesTroca(nivel) {
  const n = nivel === "max" ? 6 : nivel; // TM tratada como um degrau acima do 5
  return { dados: 1 + n, acerto: 2 * n, cd: 1 + n };
}

// ---------------------------------------------------------------
// Helpers.
// ---------------------------------------------------------------
const mediaDoDado = (tipo) => (tipo + 1) / 2;
export const mediaDano = (qtd, tipo) => Math.floor(qtd * mediaDoDado(tipo));
export const notacaoDano = (qtd, tipo) => `${qtd}d${tipo}`;

/**
 * Conjuração Aprimorada é gratuita para toda criatura ao criar um Feitiço de
 * Dano. O atributo é o da Técnica e o nível de personagem da regra é o ND.
 * Nível 0 não aparece na tabela da habilidade, então não recebe bônus.
 */
export function bonusConjuracaoAprimorada(nivel, ctx = {}) {
  const modTecnica = Math.trunc(Number(ctx.modTecnica) || 0);
  const nd = Math.max(0, Math.trunc(Number(ctx.nd) || 0));
  if (nivel === "max") return 3 * modTecnica + 3 * nd;
  if (nivel === 5) return 2 * modTecnica + 2 * nd;
  if (nivel === 4) return 2 * modTecnica + nd;
  if (nivel === 3) return 2 * modTecnica;
  if (nivel === 1 || nivel === 2) return modTecnica;
  return 0;
}

export function notacaoDanoComBonus(qtd, tipo, bonus = 0, explosiva = false) {
  const base = `${notacaoDano(qtd, tipo)}${explosiva ? "!" : ""}`;
  const fixo = Math.trunc(Number(bonus) || 0);
  if (fixo === 0) return base;
  return `${base}${fixo > 0 ? "+" : ""}${fixo}`;
}

function tabelaDano(alvo, resolucao) {
  if (alvo === "area") return DANO_AREA_TR;               // área só tem tabela de TR
  return resolucao === "ataque" ? DANO_UNICO_ATAQUE : DANO_UNICO_TR;
}

// ---------------------------------------------------------------
// MOTOR — Feitiço de Dano.
//
// feitico: {
//   nivel, resolucao ("tr"|"ataque"), alvo ("unico"|"area"),
//   formaArea, acao, subtipo,
//   trocas: { dados, acerto, alcance, cd, area, empurraoDados, larguraLinhaSteps },
//   condicoes: [{ nome, forca }], sangramento (força ou null),
//   requisito (id ou null), focoCondicao (bool),
//   disparos (múltiplos), continuoModo ("sustentado"|"concentrado"),
//   ignorarResistencias (bool), morteDireta (bool),  // Destrutivo
// }
//
// ctx: { nd, cdBase, maestria, modTecnica }
//
// Devolve { dano, dados, tipoDado, media, alcance, area, custoPE,
//   cd, acertoDelta, saldoTrocas, contInicial, contPorRodada,
//   avisos: [], detalhes: {...} }.
// ---------------------------------------------------------------
export function calcularFeiticoDano(feitico, ctx = {}) {
  const avisos = [];
  const f = feitico || {};
  const nivel = f.nivel ?? 1;
  const nNum = nivel === "max" ? 6 : nivel;              // valor numérico para fórmulas de escala
  const subtipo = f.subtipo || "nenhum";
  const destrutivo = subtipo === "destrutivo";
  const cataclismico = subtipo === "cataclismico";
  const t = f.trocas || {};
  // Liberação Máxima: `null` quando não foi declarada, e aí tudo abaixo soma 0.
  const lib = resolveLiberacao(f, ctx);

  // Destrutivo e Cataclísmico NUNCA são alvo único e SEMPRE são Ritual
  // Estendido (autor). Área é sempre teste de resistência.
  const areaObrigatoria = destrutivo || cataclismico;
  const alvo = areaObrigatoria ? "area" : (f.alvo === "area" ? "area" : "unico");
  const acaoEff = areaObrigatoria ? "ritual" : f.acao;
  // Múltiplos Disparos são SEMPRE jogadas de ataque. Área é sempre teste de resistência.
  const resolucao = subtipo === "multiplos" ? "ataque"
    : alvo === "area" ? "tr"
    : (f.resolucao === "ataque" ? "ataque" : "tr");
  const ritual = resolveRitual({
    nivel,
    acaoBase: acaoEff,
    configuracao: ctx.ritual,
    extraRitualista: !!ctx.ritualistaExtra,
    dispensaTeste: !!ctx.dispensaTesteRitual,
    beneficioGratuito: ctx.beneficiosRitualDominio?.[f.tipo],
  });
  const bonusDoRitual = bonusRitual(ritual, nivel);
  if (ritual.excedeu) {
    avisos.push(`Ritual excede o limite: ${ritual.quantidade} melhorias para ${ritual.limite} vagas.`);
  }

  // Acesso: o nível do Feitiço não pode passar do máximo da faixa de ND.
  if (ctx.nd != null && nivel !== "max" && nivel > nivelMaxFeiticoDoContexto(ctx)) {
    avisos.push(`Nível ${nivel} inacessível: no ND ${ctx.nd} o máximo é ${nivelMaxFeiticoDoContexto(ctx)}.`);
  }

  // Base da tabela.
  const linha = tabelaDano(alvo, resolucao)[nivel];
  if (!linha) {
    avisos.push(alvo === "area"
      ? `Não há dano em área para ${NIVEL_LABEL[nivel]} (área começa no Nível 1).`
      : `Sem linha de dano para ${NIVEL_LABEL[nivel]}.`);
    return { dados: 0, tipoDado: 0, dano: "-", media: 0, avisos };
  }
  let [dados, tipoDado] = linha;
  const habilidades = Array.isArray(ctx.habilidades) ? ctx.habilidades : [];
  const explosiva = habilidades.includes("cnj_explosao_encadeada");
  const escoposDano = ["feitico", `feitico:${f.id}`, `feitico:${alvo}`];

  // 1) Ação (não conta para o limite de trocas).
  dados += modDadosPorAcao(acaoEff, nNum);
  if (f.acao === "bonus" && subtipo === "vampirico") avisos.push("Feitiço Vampírico não pode ser Ação Bônus.");

  // 2) Trocas do guia. No modelo unificado (autor 2026-07-24) o DANO é o
  // RESÍDUO: não há mais slider de "dados de dano". Acerto e CD gastam dado, a
  // redução de alcance/área credita dado, e o dano final sai da conta no fim.
  // Acerto só existe em Feitiço de ataque de alvo único (não em TR, área nem
  // Múltiplos Disparos).
  const acertoAplicavel = resolucao === "ataque" && subtipo !== "multiplos";
  const lim = limitesTroca(nivel);
  const trocaAcerto = acertoAplicavel ? clampAviso(t.acerto | 0, lim.acerto, avisos, "acerto") : 0;

  // CD (autor 2026-07-24). Feitiço de ATAQUE NÃO possui CD, a menos que anexe
  // uma Condição (que exige TR do alvo ao ser acertado). Nesse caso a CD existe,
  // mas só pode ser AUMENTADA, nunca reduzida (reduzir seria dado de graça sobre
  // uma CD que só existe pela condição). Feitiço de Resistência tem CD normal.
  const condicoes = Array.isArray(f.condicoes) ? f.condicoes : [];
  const temCondicao = condicoes.length > 0 || !!f.sangramento;
  const temCD = resolucao !== "ataque" || temCondicao;
  let trocaCd = 0;
  if (temCD) {
    trocaCd = clampAviso(t.cd | 0, lim.cd, avisos, "CD");
    if (resolucao === "ataque" && trocaCd < 0) {
      avisos.push("Feitiço de Ataque só pode aumentar a CD da condição, nunca reduzir.");
      trocaCd = 0;
    }
  } else if ((t.cd | 0) !== 0) {
    avisos.push("Feitiço de Ataque não possui CD (só ao anexar uma Condição).");
  }

  // Alcance/área a partir da base. Feitiços em ÁREA também têm ALCANCE (autor):
  // solta-se a área num ponto dentro do alcance. Os dois entram no saldo.
  const alcanceBase = ALCANCE_POR_NIVEL[nivel] ?? null;
  const areaBase = alvo === "area" ? (AREA_POR_NIVEL[nivel] ?? null) : null;
  // Number() (não | 0): o delta de área tem passo fracionário (1,5m / 4,5m),
  // que o OR bitwise truncaria (-1.5 vira -1).
  // Destrutivo PODE reduzir alcance e área; Cataclísmico NÃO pode (autor).
  const linhaOuCone = formaEhLinha(f.formaArea);
  // Multiplicador de área: Destrutivo × 1,5 E Linha/Cone × 1,5 ACUMULAM (autor),
  // então um Destrutivo em Linha fica × 2,25. Aplicado DEPOIS do modificador,
  // que entra na BASE (de 1,5m em 1,5m). Cataclísmico é o mapa (sem valor).
  const multArea = (destrutivo ? 1.5 : 1) * (linhaOuCone ? 1.5 : 1);
  let alcanceDelta = cataclismico ? 0 : (Number(t.alcance) || 0);   // metros +/-
  // Number() (não | 0): o modificador de área tem passo fracionário (1,5m),
  // que o OR bitwise truncaria.
  let areaDelta = (cataclismico || alvo !== "area") ? 0 : (Number(t.area) || 0);
  // AUMENTO de alcance e área tem teto de (1 + nível), o mesmo padrão dos dados
  // (autor). A redução vai livre até o piso (0 para os dois). O modificador de
  // área é medido na BASE (antes dos × 1,5), então o piso é a área base.
  const taxas = taxasTroca(alvo);
  const maxAumentoUnid = 1 + nNum;
  if (alcanceBase != null && !cataclismico) {
    if (alcanceDelta > maxAumentoUnid * taxas.alcance) {
      avisos.push(`Aumento de alcance passa do limite (+${maxAumentoUnid * taxas.alcance}m).`);
      alcanceDelta = maxAumentoUnid * taxas.alcance;
    }
    alcanceDelta = Math.max(alcanceDelta, -alcanceBase);
  }
  if (areaBase != null && !cataclismico) {
    if (areaDelta > maxAumentoUnid * taxas.area) {
      avisos.push(`Aumento de área passa do limite (+${maxAumentoUnid * taxas.area}m).`);
      areaDelta = maxAumentoUnid * taxas.area;
    }
    areaDelta = Math.max(areaDelta, -areaBase);
  }

  // 3) Empurrão: cada dado gasto vira +6m de empurrão (exige TR, metade se
  // passar). Vira DÉBITO no saldo unificado (não desconta o dano aqui).
  const empurraoDados = Math.max(0, t.empurraoDados | 0);
  const empurraoMetros = empurraoDados * 6;

  // 4) Condições anexadas: cada uma GASTA dado pela força (débito no saldo
  // unificado, aplicado no fim, não aqui).
  // Com "Somente Condição" o Feitiço conta como um NÍVEL ACIMA para a escolha,
  // mas só pode ter UMA condição desse nível superior (e a duração ganha +1
  // rodada, ainda não modelada aqui). O teto de quantidade continua valendo.
  const forcasNormais = CONDICAO_FORCAS_POR_NIVEL[nivel] || [];
  const forcasPermitidas = f.focoCondicao
    ? (CONDICAO_FORCAS_POR_NIVEL[Math.min(nNum + 1, 5)] || [])
    : forcasNormais;
  let reducaoCond = 0;
  const maxCond = nNum; // "quantidade máxima de condições igual ao nível dela"
  if (condicoes.length > maxCond) {
    avisos.push(`Máximo de ${maxCond} condição(ões) no ${NIVEL_LABEL[nivel]}.`);
  }
  for (const c of condicoes) {
    if (!forcasPermitidas.includes(c.forca)) {
      avisos.push(`${NIVEL_LABEL[nivel]} não pode aplicar condição ${c.forca}.`);
    }
    reducaoCond += CONDICAO_REDUCAO[c.forca] || 0;
  }
  // Somente Condição: no máximo UMA condição acima do nível normal do Feitiço.
  if (f.focoCondicao) {
    const superiores = condicoes.filter((c) => !forcasNormais.includes(c.forca));
    if (superiores.length > 1) {
      avisos.push("Somente Condição permite apenas uma condição de nível superior por Feitiço.");
    }
  }
  // Sangramento é uma condição variável (ocupa vaga e reduz dados pela força).
  if (f.sangramento) {
    const forca = SANGRAMENTO_FORCA[f.sangramento];
    reducaoCond += CONDICAO_REDUCAO[forca] || 0;
  }

  // 5) Subtipos.
  let danoContInicial = null;   // notação do golpe principal do contínuo
  let contPorRodada = null;
  // ⚠ A QUANTIDADE de dados do contínuo, e não só a notação: a Ficha rola o
  // dano por rodada, e reler "4d8" de volta de uma string seria desfazer
  // trabalho já feito aqui.
  let contDadosPorRodada = 0;
  let disparosInfo = null;
  const detalhes = {};

  if (subtipo === "destrutivo") {
    if (nNum < 4) avisos.push("Feitiço Destrutivo só pode ser Nível 4 ou superior.");
    dados += nNum;                                  // +nível dados
    if (f.ignorarResistencias) dados -= 4;          // Ignorar Resistências
    if (f.morteDireta) {
      if (!(nivel === 5 || nivel === "max")) avisos.push("Morte Direta só em Nível 5 ou Técnica Máxima.");
      dados -= 2;
    }
    detalhes.destrutivo = { areaMult: 1.5, desvantagemTR: true, terrenoDificil: true };
  } else if (subtipo === "cataclismico") {
    if (!(nivel === 5 || nivel === "max")) avisos.push("Feitiço Cataclísmico só em Nível 5 ou superior.");
    if (!f.requisito || ["facil", "medio"].includes(f.requisito)) {
      avisos.push("Feitiço Cataclísmico exige requisito Difícil ou maior.");
    }
    dados += Math.floor(1.5 * nNum);                // +1,5x nível dados
    detalhes.cataclismico = { areaMapa: true, terrenoDificilRaio: 45, ignoraResistenciaERd: true, perdaVidaUsuario: "1/3 do dano" };
  } else if (subtipo === "continuo") {
    if (nNum < 1) avisos.push("Dano Contínuo é a partir do Nível 1.");
    dados -= nNum;                                  // reduz dados igual ao nível
  } else if (subtipo === "vampirico") {
    dados -= nNum;                                  // reduz dados igual ao nível
    detalhes.vampirico = { cura: "1/3 do dano após RD/Resistência/Imunidade", umaVezPorRodada: true };
  } else if (subtipo === "multiplos") {
    if (resolucao !== "ataque") avisos.push("Múltiplos Disparos são sempre jogadas de ataque.");
    if (alvo === "area") avisos.push("Múltiplos Disparos não podem ser em área.");
  }

  // 6) Requisito: no modelo unificado é CRÉDITO de dado (autor 2026-07-24).
  //    Se não for gasto numa troca, vira dano como todo o resto.
  const req = f.requisito ? REQUISITO_DIFICULDADE.find((r) => r.value === f.requisito) : null;
  const requisitoDados = req ? req.dados : 0;

  // 7) Área final: o modificador entra na BASE e SÓ DEPOIS os × 1,5 escalam:
  //    (base + modificador) × mult Destrutivo × mult Linha, arredondado para
  //    baixo ao múltiplo de 1,5. Linha/Cone ainda dão os dados extras de linha
  //    (que são pool, somam em `dados`). Cataclísmico é o mapa inteiro.
  let areaFinal = null;
  if (alvo === "area") {
    if (cataclismico) {
      areaFinal = null;                       // mapa inteiro
      detalhes.areaMapa = true;
    } else {
      if (linhaOuCone) dados += dadosLinha(nNum);
      // A melhoria Área (Liberação Máxima) dobra o resultado JÁ escalado pelo
      // Destrutivo e pela Linha, porque o texto fala das "dimensões da área de
      // efeito", que é o que se mede na mesa, e não da base antes dos
      // multiplicadores.
      areaFinal = arredondaArea((areaBase + areaDelta) * multArea * multAreaLiberacao(lib));
      // A Expansão de Área (Ritual) soma metros DEPOIS do dobro.
      //
      // ⚠ ASSUNÇÃO de composição entre os dois suplementos (2026-08-10): nenhum
      // dos dois textos fala do outro. Somar antes faria a Liberação dobrar
      // também o bônus do Ritual, e aí os metros impressos na regra do Ritual
      // deixariam de bater com o que aparece na tela. Anotado em a-fazer.md.
      if (bonusDoRitual.expansaoArea > 0) {
        const aumentoPorMelhoria = f.formaArea === "linha" ? 4.5 : 1.5;
        areaFinal = arredondaArea(areaFinal + aumentoPorMelhoria * bonusDoRitual.expansaoArea);
      }
      if (destrutivo) detalhes.areaPropria = true;
    }
  } else if (bonusDoRitual.expansaoArea > 0) {
    avisos.push("Expansão de Área exige um Feitiço em área.");
  }

  // 8) SALDO UNIFICADO (autor 2026-07-24). O dano é o RESÍDUO. `dados` já é o
  //    POOL (tabela + ação + subtipo + linha). Requisito é crédito à parte.
  //    As trocas de CUSTOMIZAÇÃO (CD, acerto ÷ 2, alcance, área) têm efeito
  //    líquido no dano limitado a ±(1+nível) (autor: o teto vale só para a
  //    seção "Customizando Feitiços de Dano"). Condições e Empurrão são efeitos
  //    SEPARADOS, fora desse teto. Taxas (item 9, autor): alvo único 6m/dado,
  //    área 12m alcance e 3m área por dado (6m + 1,5m = meio dado cada).
  const custoAlcance = alcanceBase != null ? alcanceDelta / taxas.alcance : 0;
  const custoArea = (alvo === "area" && areaBase != null) ? areaDelta / taxas.area : 0;
  // Efeito das trocas proporcionais no dano: redução credita, aumento debita.
  let netCustom = -trocaCd - trocaAcerto / 2 - custoAlcance - custoArea;
  if (netCustom > lim.dados) {
    avisos.push(`Aumento de dados por customização passa do teto (+${lim.dados}).`);
    netCustom = lim.dados;                                  // excesso de redução é desperdiçado
  } else if (netCustom < -lim.dados) {
    avisos.push(`Redução de dados por customização passa do teto (−${lim.dados}).`);
  }
  const efeitosSeparados = empurraoDados + (f.focoCondicao ? 0 : reducaoCond);
  dados = Math.floor(dados + requisitoDados + netCustom - efeitosSeparados + 1e-9);

  // 8b) Piso de 1 dado. Se os débitos passam do que o Feitiço tem, acusamos a
  //     falta de verdade (condições e empurrão agora entram nessa conta).
  let faltamDados = 0;
  if (dados < 1) {
    faltamDados = 1 - dados;
    avisos.push(`Faltam ${faltamDados} dado(s): as trocas, condições e empurrão passaram do que o Feitiço tem.`);
    dados = 1;
  }

  // O Motor pode alterar os dados e a parcela fixa de todos os Feitiços ou de
  // um Feitiço específico. O alvo `feitico:<id>` é oferecido pelo editor dos
  // Passivos / Características, enquanto `feitico` cobre todos os de dano.
  const dadosMotor = Math.trunc(valorCanalEscopos(ctx.efeitos, "dadosDano", escoposDano));
  dados = Math.max(1, dados + dadosMotor);
  // Ciclagem Maldita depende de estado da sessão e da identidade DESTA linha,
  // por isso fecha aqui, depois dos dados do Motor. Sem Feitiço anterior não há
  // comparação, e repetir o mesmo id não concede nada.
  const dadosCiclagem = ctx.ultimoFeiticoDanoId
    && ctx.ultimoFeiticoDanoId !== f.id
    && (ctx.habilidades ?? []).includes("cnj_ciclagem_maldita")
    ? Math.floor(Math.max(0, Number(ctx.contextoDsl?.maestria) || 0) / 2)
    : 0;
  const dadosAntesCiclagem = dados;
  // Múltiplos Disparos recebe os dados adicionais na primeira rolagem, depois
  // que o pool comum é dividido. Assim a habilidade acrescenta exatamente a
  // quantidade escrita, sem multiplicá-la pela quantidade de disparos.
  if (subtipo !== "multiplos") dados += dadosCiclagem;
  const bonusMotor = Math.trunc(valorCanalEscopos(ctx.efeitos, "danoBonus", escoposDano));
  const ignoraRD = Math.max(0, Math.trunc(valorCanalEscopos(ctx.efeitos, "ignoraRD", escoposDano)));
  const removeResistencia = valorCanalEscopos(ctx.efeitos, "removeResistencia", escoposDano) > 0;

  // Sobrecarga Energética (Liberação Máxima): "+ Nível do Feitiço + 1" nos
  // dados de dano base. ⚠ Entra AQUI, antes das divisões de Múltiplos Disparos
  // e do Dano Contínuo. Autor, 2026-08-09: "Antes da divisão." Depois delas, a
  // Sobrecarga entregaria o pacote inteiro em CADA disparo.
  const dadosSobrecarga = sobrecargaDados(lib, nNum);
  dados += dadosSobrecarga;

  // Múltiplos Disparos fecha a quantidade de dados de CADA rolagem antes de o
  // Motor avaliar `dados_dano_final`. Usar o montante concentrado daria o bônus
  // inteiro em cada disparo e multiplicaria o dano fixo sem a regra mandar.
  let disparosCalculados = null;
  let dadosDanoFinal = dados;
  if (subtipo === "multiplos") {
    const maxDisparos = nNum + 1;
    const disparos = Math.min(Math.max(1, f.disparos | 0 || 1), maxDisparos);
    if ((f.disparos | 0) > maxDisparos) avisos.push(`Máximo de ${maxDisparos} disparos no ${NIVEL_LABEL[nivel]}.`);
    const porDisparo = Math.max(1, Math.floor(dados / disparos)) + dadosCiclagem;
    disparosCalculados = { disparos, porDisparo };
    dadosDanoFinal = porDisparo;
  }

  const resolveEfeitoDanoFinal = (quantidade) => {
    const efeitos = resolverEfeitosDanoFinal(
      ctx.efeitosLinhaDano,
      ctx.contextoDsl,
      quantidade,
      ctx.efeitos?.aplicado,
      { nivelFeitico: nNum },
    );
    return {
      efeitos,
      dados: Math.max(0, Math.trunc(valorCanalEscopos(efeitos, "dadosDano", escoposDano))),
      bonus: Math.trunc(valorCanalEscopos(efeitos, "danoBonus", escoposDano)),
    };
  };
  // A variável lê a quantidade fechada ANTES do próprio efeito. A passagem é
  // única: 3 dados com `dadosDano = dados_dano_final` recebem +3 e terminam em
  // 6. Em Múltiplos Disparos isso acontece na linha de cada disparo.
  const efeitoDanoFinal = resolveEfeitoDanoFinal(dadosDanoFinal);
  avisos.push(...(efeitoDanoFinal.efeitos.avisos || []));
  if (subtipo === "multiplos") {
    disparosCalculados = {
      ...disparosCalculados,
      porDisparo: disparosCalculados.porDisparo + efeitoDanoFinal.dados,
    };
    dadosDanoFinal = disparosCalculados.porDisparo;
  } else {
    dados += efeitoDanoFinal.dados;
    dadosDanoFinal = dados;
  }

  // Conjuração Aprimorada é um bônus FIXO por alvo. Ele não entra no saldo de
  // customização e não muda a quantidade de dados. Em Múltiplos Disparos o
  // cálculo continua sendo por um alvo: separar os disparos reduz os dados, mas
  // conserva o mesmo bônus na fórmula daquele alvo.
  const bonusConjuracao = bonusConjuracaoAprimorada(nivel, ctx);
  const bonusRitualDano = f.focoCondicao ? 0 : bonusDoRitual.dano;
  if (f.focoCondicao && bonusDoRitual.dano > 0) {
    avisos.push("Aumento de Dano não se aplica a um Feitiço de Somente Condição.");
  }
  const bonusSemRitual = bonusConjuracao + bonusMotor + efeitoDanoFinal.bonus;
  const bonusDano = bonusSemRitual + bonusRitualDano;

  // 9) Múltiplos disparos: divide os dados finais (piso, mín 1) pelo nº de disparos.
  let danoTexto;
  if (subtipo === "multiplos") {
    const { disparos, porDisparo } = disparosCalculados;
    const efeitoConcentrado = resolveEfeitoDanoFinal(dados);
    const dadosConcentrados = dados + efeitoConcentrado.dados;
    const bonusConcentrado = bonusConjuracao + bonusMotor + efeitoConcentrado.bonus;
    disparosInfo = {
      disparos,
      porDisparo,
      concentradoTotal: dadosConcentrados,
      bonusPorDisparo: bonusSemRitual,
      bonusRitualDano,
      porDisparoTexto: notacaoDanoComBonus(porDisparo, tipoDado, bonusSemRitual, explosiva),
      primeiroDisparoTexto: notacaoDanoComBonus(porDisparo, tipoDado, bonusDano, explosiva),
      concentradoTexto: notacaoDanoComBonus(dadosConcentrados, tipoDado, bonusConcentrado + bonusRitualDano, explosiva),
    };
    danoTexto = bonusRitualDano && disparos > 1
      ? `${disparosInfo.primeiroDisparoTexto} + ${disparos - 1}× ${disparosInfo.porDisparoTexto}`
      : `${disparos}× ${disparosInfo.porDisparoTexto}`;
    detalhes.multiplos = disparosInfo;
  } else {
    danoTexto = f.focoCondicao ? "Somente Condição" : notacaoDanoComBonus(dados, tipoDado, bonusDano, explosiva);
  }

  // Dano contínuo: metade dos dados (piso) por rodada.
  if (subtipo === "continuo") {
    danoContInicial = notacaoDanoComBonus(dados, tipoDado, bonusDano, explosiva);
    // Os dados da Ciclagem pertencem ao uso inicial, não ao dano que se repete
    // nas rodadas seguintes. Já o `dadosDano` tardio pertence ao Feitiço e
    // entra antes da metade, igual ao `dadosDano` comum do Motor.
    const dadosContinuos = dadosAntesCiclagem
      + resolveEfeitoDanoFinal(dadosAntesCiclagem).dados;
    const contDados = Math.max(1, Math.floor(dadosContinuos / 2));
    contPorRodada = notacaoDanoComBonus(contDados, tipoDado, 0, explosiva);
    contDadosPorRodada = contDados;
    const continuoConcentrado = f.continuoModo === "concentrado" || bonusDoRitual.converteSustento;
    detalhes.continuo = {
      modo: continuoConcentrado ? "concentrado" : "sustentado",
      custoSustentacao: continuoConcentrado ? 0 : nNum,
      golpe: danoContInicial, porRodada: contPorRodada,
    };
  } else if (bonusDoRitual.converteSustento) {
    avisos.push("Conversão de Sustento exige um Feitiço sustentado.");
  }

  // Alcance final. A Expansão de Limites multiplica o alcance JÁ trocado.
  // ⚠ Toque é 0m, e 0 × qualquer coisa é 0: Toque continua Toque (autor).
  let alcanceFinal = null;
  // ⚠ O multiplicador da Liberação Máxima escala o alcance PRÓPRIO do Feitiço, e
  // os metros do Ritual entram DEPOIS, pela mesma razão da área: os números
  // impressos na regra do Ritual têm que continuar batendo com a tela.
  if (alcanceBase != null) {
    alcanceFinal = (alcanceBase + alcanceDelta) * multAlcance(lib, nNum) + bonusDoRitual.alcance;
  }

  // CD e acerto. Feitiço de Ataque sem condição não tem CD (temCD = false).
  // A Pressão Amaldiçoada (Liberação) e a Potencialização de Dificuldade
  // (Ritual) SOMAM: são bônus de sistemas diferentes no mesmo número.
  //
  // Cada metade da Pressão só entra onde a coisa existe: o acerto só onde há
  // jogada de ataque, a CD só onde há CD. É o que resolve o "(Não dá pra se ter
  // ambos os efeitos de CD e Acerto)" sem escolha nenhuma do jogador, porque um
  // Feitiço nunca é os dois.
  const pressaoNaCd = temCD ? pressaoCd(lib, nNum) : 0;
  const pressaoNoAcerto = resolucao === "ataque" ? pressaoAcerto(lib, nNum) : 0;
  const cd = (temCD && (ctx.cdBase ?? null) != null)
    ? ctx.cdBase + trocaCd + pressaoNaCd + bonusDoRitual.cd
    : null;
  if (!temCD && bonusDoRitual.cd > 0) {
    avisos.push("Potencialização de Dificuldade exige um Feitiço com CD.");
  }
  const acertoDelta = trocaAcerto + pressaoNoAcerto
    + (resolucao === "ataque" ? bonusDoRitual.acerto : 0);
  if (resolucao !== "ataque" && bonusDoRitual.acerto > 0) {
    avisos.push("Aumento de Precisão exige uma rolagem de ataque do Feitiço.");
  }
  if (bonusDoRitual.potencializaEfeito) {
    avisos.push("Potencialização de Efeito exige um benefício numérico de Feitiço Auxiliar.");
  }
  if (bonusDoRitual.alvosProtegidos > 0) {
    if (alvo === "area") detalhes.ajusteAlvos = bonusDoRitual.alvosProtegidos;
    else avisos.push("Ajuste de Alvos exige um Feitiço em área.");
  }

  // Custo em PE (a criação não altera o custo; requisito de dano dá dados, não muda PE).
  // A sustentação do dano contínuo vai em detalhes.continuo.custoSustentacao.
  const custoPE = custoPadrao(nivel === "max" ? 5 : nivel);
  const melhoriasDisponiveis = [
    ...(alvo === "area" ? ["ajusteAlvos"] : []),
    ...(alcanceBase != null ? ["aumentoAlcance"] : []),
    ...(!f.focoCondicao ? ["aumentoDano"] : []),
    ...(resolucao === "ataque" ? ["aumentoPrecisao"] : []),
    ...(subtipo === "continuo" && f.continuoModo !== "concentrado" ? ["conversaoSustento"] : []),
    ...(alvo === "area" ? ["expansaoArea"] : []),
    ...(temCD ? ["potencializacaoDificuldade"] : []),
  ];

  return {
    nivel,
    dados,
    dadosDanoFinal,
    tipoDado,
    dano: danoTexto,
    bonusDano,
    explosiva,
    // ⚠ Os três valores EFETIVOS (2026-08-09). O Destrutivo e o Cataclísmico
    // ignoram o que o jogador marcou: os dois são SEMPRE área, SEMPRE Ritual
    // Estendido e SEMPRE teste de resistência. Sem estes campos a Ficha lia o
    // `f.acao` e o `f.resolucao` crus e imprimia "Ação Comum, Jogada de Ataque"
    // para um Ritual de TR, que é a regra errada na mão do jogador.
    acaoResultante: acaoEff,
    resolucao,
    alvo,
    partesDano: [
      ...(bonusConjuracao ? [{ label: "Conjuração Aprimorada", valor: bonusConjuracao }] : []),
      // Sobrecarga Energética entra no POOL, como o canal `dadosDano` do Motor
      // logo abaixo, e por isso aparece aqui com a mesma cara.
      ...(dadosSobrecarga ? [{ label: "Sobrecarga Energética", texto: `+${dadosSobrecarga}d${tipoDado}` }] : []),
      ...detalhesDoCanalEscopos(ctx.efeitos, "dadosDano", escoposDano, true).map((d) => ({
        label: d.nome,
        texto: `${d.valor >= 0 ? "+" : ""}${d.valor}d${tipoDado}`,
        ...(d.suplantado ? { suplantado: true } : {}),
      })),
      ...detalhesDoCanalEscopos(efeitoDanoFinal.efeitos, "dadosDano", escoposDano, true).map((d) => ({
        label: d.nome,
        texto: `${d.valor >= 0 ? "+" : ""}${d.valor}d${tipoDado}`,
        ...(d.suplantado ? { suplantado: true } : {}),
      })),
      ...(dadosCiclagem ? [{
        label: "Ciclagem Maldita",
        texto: `+${dadosCiclagem}d${tipoDado}`,
      }] : []),
      ...(bonusRitualDano ? [{ label: "Aumento de Dano", valor: bonusRitualDano }] : []),
      ...detalhesDoCanalEscopos(ctx.efeitos, "danoBonus", escoposDano, true).map((d) => ({
        label: d.nome,
        valor: d.valor,
        ...(d.suplantado ? { suplantado: true } : {}),
      })),
      ...detalhesDoCanalEscopos(efeitoDanoFinal.efeitos, "danoBonus", escoposDano, true).map((d) => ({
        label: d.nome,
        valor: d.valor,
        ...(d.suplantado ? { suplantado: true } : {}),
      })),
    ],
    // Somente Condição e Múltiplos Disparos não têm média de dano única.
    media: (subtipo === "multiplos" || f.focoCondicao) ? null : mediaDano(dados, tipoDado) + bonusDano,
    alcance: alcanceFinal,
    area: areaFinal,
    forma: alvo === "area" ? (f.formaArea || null) : null,
    custoPE,
    cd,
    acertoDelta,
    ignoraRD,
    removeResistencia,
    empurraoMetros,
    faltamDados,
    reducaoCondicoes: reducaoCond,
    contInicial: danoContInicial,
    contPorRodada,
    contDadosPorRodada,
    disparos: disparosInfo,
    ritual: { ...ritual, melhoriasDisponiveis },
    bonusRitualDano,
    // ---- Liberação Máxima ----
    // `null` quando não foi declarada. Os campos abaixo são o que ela ACRESCENTA
    // e que não cabia em nenhum campo existente.
    liberacao: lib,
    ignoraRd: rupturaRd(lib, nNum) || null,
    alvosExtras: alvosExtras(lib, nNum) || null,
    // Rodadas somadas às Condições anexadas. Quem monta a linha da condição é o
    // `fichaDoFeitico`, que lê a tabela de duração, então o número viaja daqui.
    rodadasExtras: rodadasExtras(lib, nNum) || null,
    regrasLiberacao: regrasDaLiberacao(lib, f),
    avisos: [...avisos, ...(lib?.avisos ?? [])],
    detalhes,
  };
}

// Clampa um valor de troca a +/- limite, avisando se estourou.
function clampAviso(valor, limite, avisos, rotulo) {
  if (valor > limite) { avisos.push(`Troca de ${rotulo} passa do limite (+${limite}).`); return limite; }
  if (valor < -limite) { avisos.push(`Troca de ${rotulo} passa do limite (-${limite}).`); return -limite; }
  return valor;
}

// Saldo de trocas em unidades. Reduções (valores negativos de alcance/área,
// ou trocas positivas em dados/acerto/CD financiadas) devem se pagar.
// Convenção: aumento gasta unidade (saldo -), redução libera (saldo +).
function saldoTrocas({ alvo, trocaDados, trocaAcerto, trocaCd, alcanceDelta, areaDelta }) {
  const taxas = taxasTroca(alvo);
  let saldo = 0;
  // Dados/acerto/CD: aumento gasta, redução (negativo) devolve.
  saldo -= trocaDados;
  saldo -= trocaAcerto / TROCA_UNIDADE.acerto;
  saldo -= trocaCd;
  // Alcance: reduzir (negativo) devolve unidade; aumentar gasta.
  saldo += -alcanceDelta / taxas.alcance;
  // Área: só em Feitiço de área, e independente do alcance (aditivo).
  if (alvo === "area") saldo += -areaDelta / taxas.area;
  // Arredonda ruído de ponto flutuante.
  return Math.round(saldo * 100) / 100;
}

// ===============================================================
// FEITIÇOS CURATIVOS
// ===============================================================
// Recuperam pontos de vida. Só CURAM de fato se a criatura tiver a
// aptidão Energia Reversa (id "energia_reversa"). Sem ela, o mesmo
// número vira Pontos de Vida Temporários (autor). Nível 0 não cura.
//
// Motor = variante do de Dano: mesma modificação por Ação, mesmas
// trocas de dados/alcance/área com saldo, mesma redução por Condição.
// NÃO há resolução (sem TR/Ataque) nem CD (não há teste do alvo),
// então as trocas de acerto e CD somem.
// ---------------------------------------------------------------

// TABELAS DE CURA (verbatim). [quantidadeDeDados, tipoDeDado].
// Alvo único e Alvos Múltiplos/Área. Não há Nível 0 (não cura).
export const CURA_UNICO = {
  1: [3, 6], 2: [6, 6], 3: [7, 8], 4: [10, 10], 5: [16, 10], max: [24, 10],
};
export const CURA_AREA = {
  1: [2, 6], 2: [4, 6], 3: [4, 10], 4: [7, 10], 5: [12, 10], max: [20, 10],
};
// Médias IMPRESSAS no livro (com erros de cálculo, autor: "quem fez a tabela
// era péssimo de cálculo"). A média exibida é RECALCULADA por piso pelos
// dados. Estas ficam só de conferência (16d10 vem 87 e 20d10 vem 99 no livro).
export const MEDIA_VERBATIM_CURA = {
  unico: { 1: 10, 2: 21, 3: 31, 4: 55, 5: 87, max: 132 },
  area:  { 1: 7,  2: 14, 3: 22, 4: 38, 5: 66, max: 99 },
};

// Ações do Curativo: as mesmas do Dano sem Ritual Estendido (padrão Comum).
export const CURA_ACOES = FEITICO_ACOES.filter((a) => a.value !== "ritual");

// Custo em dados das opções "curar tudo" (autor).
export const CURA_DADOS_TOTAL = 13;

// Ferimentos Complexos = Desmembramentos (autor). Só informativo (tooltip).
export const FERIMENTOS_COMPLEXOS = ["Pernas (2x)", "Braços (2x)", "Olhos (2x)", "Ferida Interna (1x)"];

// Modos de remoção. As duas "todas" são Nível 5, custam 13 dados e se excluem.
export const CURA_REMOCAO = [
  { value: "nenhuma",        label: "Nenhuma" },
  { value: "especificas",    label: "Condições Específicas" },
  { value: "todasCondicoes", label: "Todas as Condições",             nivelMin: 5, custoDados: CURA_DADOS_TOTAL },
  { value: "todosComplexos", label: "Todos os Ferimentos Complexos",  nivelMin: 5, custoDados: CURA_DADOS_TOTAL },
];

function tabelaCura(alvo) {
  return alvo === "area" ? CURA_AREA : CURA_UNICO;
}

// ---------------------------------------------------------------
// MOTOR — Feitiço Curativo.
//
// feitico: {
//   nivel, alvo ("unico"|"area"), formaArea, acao,
//   trocas: { dados, alcance, area },
//   remocao ("nenhuma"|"especificas"|"todasCondicoes"|"todosComplexos"),
//   condicoes: [{ nome, forca }] (só no modo "especificas"),
//   requisito (id ou null),
// }
// ctx: { nd, temEnergiaReversa }
//
// Devolve { nivel, dados, tipoDado, cura, media, ehTemporario, alcance,
//   area, forma, custoPE, saldoTrocas, reducaoCondicoes, remocao,
//   avisos: [], detalhes: {...} }.
// ---------------------------------------------------------------
export function calcularFeiticoCurativo(feitico, ctx = {}) {
  const avisos = [];
  const f = feitico || {};
  const nivel = f.nivel ?? 1;
  const nNum = nivel === "max" ? 6 : nivel;
  const alvo = f.alvo === "area" ? "area" : "unico";
  const acao = f.acao || "comum";
  const t = f.trocas || {};
  const ehTemporario = !ctx.temEnergiaReversa;
  const ritual = resolveRitual({
    nivel,
    acaoBase: acao,
    configuracao: ctx.ritual,
    extraRitualista: !!ctx.ritualistaExtra,
    dispensaTeste: !!ctx.dispensaTesteRitual,
    beneficioGratuito: ctx.beneficiosRitualDominio?.[f.tipo],
  });
  const bonusDoRitual = bonusRitual(ritual, nivel);
  if (ritual.excedeu) {
    avisos.push(`Ritual excede o limite: ${ritual.quantidade} melhorias para ${ritual.limite} vagas.`);
  }
  // Liberação Máxima: `null` quando não foi declarada.
  const lib = resolveLiberacao(f, ctx);

  // Acesso: o nível do Feitiço não pode passar do máximo da faixa de ND.
  if (ctx.nd != null && nivel !== "max" && nivel > nivelMaxFeiticoDoContexto(ctx)) {
    avisos.push(`Nível ${nivel} inacessível: no ND ${ctx.nd} o máximo é ${nivelMaxFeiticoDoContexto(ctx)}.`);
  }

  // Base da tabela. Nível 0 não cura, área começa no Nível 1.
  const linha = tabelaCura(alvo)[nivel];
  if (!linha) {
    avisos.push(nivel === 0
      ? "Nível 0 não pode curar."
      : alvo === "area"
        ? `Não há cura em área para ${NIVEL_LABEL[nivel]} (área começa no Nível 1).`
        : `Sem linha de cura para ${NIVEL_LABEL[nivel]}.`);
    return {
      nivel, dados: 0, tipoDado: 0, cura: "-", media: 0, ehTemporario,
      custoPE: null, saldoTrocas: 0, ritual, avisos, detalhes: {},
    };
  }
  let [dados, tipoDado] = linha;

  // 1) Ação (não conta para o limite de trocas).
  dados += modDadosPorAcao(acao, nNum);

  // 2) Trocas do guia (limitadas). Só dados, alcance e área (sem acerto/CD).
  const lim = limitesTroca(nivel);
  const trocaDados = clampAviso(t.dados | 0, lim.dados, avisos, "dados de cura");
  dados += trocaDados;

  // Alcance/área a partir da base. Área também tem alcance (solta a cura num
  // ponto dentro do alcance), igual ao Dano.
  const alcanceBase = ALCANCE_POR_NIVEL[nivel] ?? null;
  const areaBase = alvo === "area" ? (AREA_POR_NIVEL[nivel] ?? null) : null;
  const linhaOuCone = formaEhLinha(f.formaArea);
  const multArea = linhaOuCone ? 1.5 : 1;
  const taxas = taxasTroca(alvo);
  const maxAumentoUnid = 1 + nNum;
  let alcanceDelta = Number(t.alcance) || 0;
  let areaDelta = alvo === "area" ? (Number(t.area) || 0) : 0;
  if (alcanceBase != null) {
    if (alcanceDelta > maxAumentoUnid * taxas.alcance) {
      avisos.push(`Aumento de alcance passa do limite (+${maxAumentoUnid * taxas.alcance}m).`);
      alcanceDelta = maxAumentoUnid * taxas.alcance;
    }
    alcanceDelta = Math.max(alcanceDelta, -alcanceBase);
  }
  if (areaBase != null) {
    if (areaDelta > maxAumentoUnid * taxas.area) {
      avisos.push(`Aumento de área passa do limite (+${maxAumentoUnid * taxas.area}m).`);
      areaDelta = maxAumentoUnid * taxas.area;
    }
    areaDelta = Math.max(areaDelta, -areaBase);
  }
  const saldo = saldoTrocas({ alvo, trocaDados, trocaAcerto: 0, trocaCd: 0, alcanceDelta, areaDelta });
  if (saldo < 0) avisos.push(`Trocas desbalanceadas: faltam ${-saldo} unidade(s) de troca (1 dado = ${alvo === "area" ? "12m alcance = 3m área" : "6m"}).`);

  // 3) Remoção de Condições / Ferimentos Complexos.
  const modo = f.remocao || "nenhuma";
  const detalhes = {};
  let reducaoCond = 0;
  if (modo === "especificas") {
    const forcasPermitidas = CONDICAO_FORCAS_POR_NIVEL[nivel] || [];
    const condicoes = Array.isArray(f.condicoes) ? f.condicoes : [];
    const maxCond = nNum;
    if (condicoes.length > maxCond) avisos.push(`Máximo de ${maxCond} condição(ões) no ${NIVEL_LABEL[nivel]}.`);
    for (const c of condicoes) {
      if (!forcasPermitidas.includes(c.forca)) avisos.push(`${NIVEL_LABEL[nivel]} não pode remover condição ${c.forca}.`);
      reducaoCond += CONDICAO_REDUCAO[c.forca] || 0;
    }
    dados -= reducaoCond;
    detalhes.removeCondicoes = condicoes.map((c) => c.nome);
  } else if (modo === "todasCondicoes" || modo === "todosComplexos") {
    if (!(nivel === 5 || nivel === "max")) {
      avisos.push(`${modo === "todasCondicoes" ? "Curar Todas as Condições" : "Curar Todos os Ferimentos Complexos"} exige Nível 5.`);
    }
    dados -= CURA_DADOS_TOTAL;
    reducaoCond = CURA_DADOS_TOTAL;
    detalhes.curaTudo = modo === "todasCondicoes"
      ? { condicoes: true, ferimentoComplexo: 1 }
      : { ferimentosComplexos: "todos" };
  }

  // 4) Requisito (dá dados extras de cura, como no Dano).
  if (f.requisito) {
    const req = REQUISITO_DIFICULDADE.find((r) => r.value === f.requisito);
    if (req) dados += req.dados;
  }

  // 5) Área final: o modificador entra na base e SÓ DEPOIS o × 1,5 da
  //    Linha/Cone escala (mesma regra do Dano). Linha/Cone dão dados extras.
  let areaFinal = null;
  if (alvo === "area") {
    if (linhaOuCone) dados += dadosLinha(nNum);
    // Mesma ordem do Feitiço de Dano: a Liberação Máxima dobra a área própria e
    // os metros do Ritual entram depois.
    areaFinal = arredondaArea((areaBase + areaDelta) * multArea * multAreaLiberacao(lib));
    if (bonusDoRitual.expansaoArea > 0) {
      const aumentoPorMelhoria = f.formaArea === "linha" ? 4.5 : 1.5;
      areaFinal = arredondaArea(areaFinal + aumentoPorMelhoria * bonusDoRitual.expansaoArea);
    }
  }

  // 6) Piso de 1 dado.
  if (dados < 1) {
    avisos.push("As reduções passaram do limite: a cura tem piso de 1 dado.");
    dados = 1;
  }

  const alcanceFinal = alcanceBase != null
    ? (alcanceBase + alcanceDelta) * multAlcance(lib, nNum) + bonusDoRitual.alcance
    : null;
  const custoPE = custoPadrao(nivel === "max" ? 5 : nivel);
  // Vigor Absoluto é PARCELA FIXA no total curado, e não dado a mais: "aumente
  // o valor total curado/concedido em 6 por Nível do Feitiço".
  const bonusCura = vigorCura(lib, nNum);
  const notacao = bonusCura
    ? notacaoDanoComBonus(dados, tipoDado, bonusCura, false)
    : notacaoDano(dados, tipoDado);
  if (bonusDoRitual.alvosProtegidos > 0) detalhes.ajusteAlvos = bonusDoRitual.alvosProtegidos;
  const melhoriasDisponiveis = [
    ...(alvo === "area" ? ["ajusteAlvos"] : []),
    ...(alcanceBase != null ? ["aumentoAlcance"] : []),
    ...(alvo === "area" ? ["expansaoArea"] : []),
  ];

  return {
    nivel,
    dados,
    tipoDado,
    cura: notacao,
    notacao,
    bonusCura,
    media: mediaDano(dados, tipoDado) + bonusCura,
    ehTemporario,
    alcance: alcanceFinal,
    area: areaFinal,
    forma: alvo === "area" ? (f.formaArea || null) : null,
    custoPE,
    saldoTrocas: saldo,
    reducaoCondicoes: reducaoCond,
    remocao: modo,
    ritual: { ...ritual, melhoriasDisponiveis },
    // ---- Liberação Máxima ----
    liberacao: lib,
    alvosExtras: alvosExtras(lib, nNum) || null,
    regrasLiberacao: regrasDaLiberacao(lib, f),
    avisos: [...avisos, ...(lib?.avisos ?? [])],
    detalhes,
  };
}

// ===============================================================
// FEITIÇOS ESPECIAIS (variantes de dano: Golpeador e Dano na Alma)
// ===============================================================
// O tipo "especial" reúne subtipos bem diferentes. Estes dois são
// variantes de Dano de ALVO ÚNICO e compartilham o núcleo de saldo
// (condições + trocas de customização + CD + empurrão + requisito),
// sem área nem os subtipos do Dano comum.
// ---------------------------------------------------------------

export const ESPECIAL_SUBTIPOS = [
  { value: "golpeador",     label: "Golpeador" },
  { value: "danoAlma",      label: "Dano na Alma" },
  { value: "itens",         label: "Criação de Itens" },
  { value: "shikigami",     label: "Shikigami" },
  { value: "transformacao", label: "Transformação" },
  { value: "invisibilidade",label: "Invisibilidade" },
];
export const ESPECIAL_IMPLEMENTADO = new Set(["golpeador", "danoAlma", "invisibilidade", "itens", "transformacao", "shikigami"]);

// TABELAS (verbatim). Média recalculada por piso (o livro erra, autor).
// Golpeador: dano ADICIONAL de um ataque. Tem Nível 0.
export const GOLPEADOR = {
  0: [1, 4], 1: [2, 6], 2: [5, 6], 3: [7, 8], 4: [10, 10], 5: [14, 12], max: [18, 12],
};
export const MEDIA_VERBATIM_GOLPEADOR = { 0: 2, 1: 7, 2: 17, 3: 31, 4: 55, 5: 90, max: 116 };
// Dano na Alma: tabela própria (fura tudo). Média nv1 do livro (14) está errada,
// o dado 2d6 dá 7 (autor: seguir os dados).
export const DANO_ALMA = {
  0: [1, 6], 1: [2, 6], 2: [4, 8], 3: [7, 8], 4: [8, 10], 5: [12, 10], max: [16, 12],
};
export const MEDIA_VERBATIM_ALMA = { 0: 3, 1: 14, 2: 18, 3: 32, 4: 44, 5: 66, max: 101 };

// Golpeador: máximo de golpes por nível (Nv3 = 2, +1 por nível acima, TM = 5).
export function maxGolpesGolpeador(nivel) {
  const n = nivel === "max" ? 6 : nivel;
  return n >= 3 ? n - 1 : 1;
}

// ---------------------------------------------------------------
// Núcleo de saldo para variantes de Dano de ALVO ÚNICO sem subtipos.
// Reusa o modelo unificado do Dano: condições + trocas de customização
// (acerto, CD, alcance) sob o teto ±(1+nível) + empurrão + requisito, com
// a regra de CD do Ataque (só com condição, só aumenta). Devolve os dados
// finais e os campos derivados.
// ---------------------------------------------------------------
function saldoUnicoVariante(f, ctx, cfg) {
  const { nivel, nNum, poolBase, resolucao, alcanceBase, permiteAlcance, avisos } = cfg;
  const t = f.trocas || {};
  const lim = limitesTroca(nivel);

  // Acerto (só ataque).
  const trocaAcerto = resolucao === "ataque" ? clampAviso(t.acerto | 0, lim.acerto, avisos, "acerto") : 0;

  // CD: Ataque só tem CD ao anexar Condição, e a CD só aumenta (autor).
  const condicoes = Array.isArray(f.condicoes) ? f.condicoes : [];
  const temCondicao = condicoes.length > 0 || !!f.sangramento;
  const temCD = resolucao !== "ataque" || temCondicao;
  let trocaCd = 0;
  if (temCD) {
    trocaCd = clampAviso(t.cd | 0, lim.cd, avisos, "CD");
    if (resolucao === "ataque" && trocaCd < 0) {
      avisos.push("Feitiço de Ataque só pode aumentar a CD da condição, nunca reduzir.");
      trocaCd = 0;
    }
  } else if ((t.cd | 0) !== 0) {
    avisos.push("Feitiço de Ataque não possui CD (só ao anexar uma Condição).");
  }

  // Alcance (só se a variante permite). Reduz até 0, aumenta até (1+n)×6m.
  const taxas = taxasTroca("unico");
  let alcanceDelta = 0;
  if (permiteAlcance && alcanceBase != null) {
    alcanceDelta = Number(t.alcance) || 0;
    const cap = (1 + nNum) * taxas.alcance;
    if (alcanceDelta > cap) { avisos.push(`Aumento de alcance passa do limite (+${cap}m).`); alcanceDelta = cap; }
    alcanceDelta = Math.max(alcanceDelta, -alcanceBase);
  }

  // Empurrão (débito separado, fora do teto).
  const empurraoDados = Math.max(0, t.empurraoDados | 0);
  const empurraoMetros = empurraoDados * 6;

  // Condições (reduções por força, força por nível, teto de quantidade).
  const forcasPermitidas = CONDICAO_FORCAS_POR_NIVEL[nivel] || [];
  let reducaoCond = 0;
  const maxCond = nNum;
  if (condicoes.length > maxCond) avisos.push(`Máximo de ${maxCond} condição(ões) no ${NIVEL_LABEL[nivel]}.`);
  for (const c of condicoes) {
    if (!forcasPermitidas.includes(c.forca)) avisos.push(`${NIVEL_LABEL[nivel]} não pode aplicar condição ${c.forca}.`);
    reducaoCond += CONDICAO_REDUCAO[c.forca] || 0;
  }
  if (f.sangramento) reducaoCond += CONDICAO_REDUCAO[SANGRAMENTO_FORCA[f.sangramento]] || 0;

  // Requisito (crédito de dado).
  const req = f.requisito ? REQUISITO_DIFICULDADE.find((r) => r.value === f.requisito) : null;
  const requisitoDados = req ? req.dados : 0;

  // Teto de customização ±(1+nível): acerto, CD, alcance. Condições e empurrão fora.
  const custoAlcance = (permiteAlcance && alcanceBase != null) ? alcanceDelta / taxas.alcance : 0;
  let netCustom = -trocaCd - trocaAcerto / 2 - custoAlcance;
  if (netCustom > lim.dados) { avisos.push(`Aumento de dados por customização passa do teto (+${lim.dados}).`); netCustom = lim.dados; }
  else if (netCustom < -lim.dados) { avisos.push(`Redução de dados por customização passa do teto (−${lim.dados}).`); }

  let dados = Math.floor(poolBase + requisitoDados + netCustom - empurraoDados - reducaoCond + 1e-9);
  let faltamDados = 0;
  if (dados < 1) {
    faltamDados = 1 - dados;
    avisos.push(`Faltam ${faltamDados} dado(s): as trocas, condições e empurrão passaram do que o Feitiço tem.`);
    dados = 1;
  }

  const cd = (temCD && (ctx.cdBase ?? null) != null) ? ctx.cdBase + trocaCd : null;
  const alcanceFinal = (permiteAlcance && alcanceBase != null) ? alcanceBase + alcanceDelta : null;
  return { dados, cd, acertoDelta: trocaAcerto, alcanceFinal, reducaoCond, empurraoMetros, faltamDados, temCD };
}

// ---------------------------------------------------------------
// MOTOR — Feitiço Golpeador (dano adicional num ataque).
// ---------------------------------------------------------------
export function calcularFeiticoGolpeador(feitico, ctx = {}) {
  const avisos = [];
  const f = feitico || {};
  const nivel = f.nivel ?? 1;
  const nNum = nivel === "max" ? 6 : nivel;
  if (ctx.nd != null && nivel !== "max" && nivel > nivelMaxFeiticoDoContexto(ctx)) {
    avisos.push(`Nível ${nivel} inacessível: no ND ${ctx.nd} o máximo é ${nivelMaxFeiticoDoContexto(ctx)}.`);
  }
  const linha = GOLPEADOR[nivel];
  if (!linha) {
    avisos.push(`Sem linha de Golpeador para ${NIVEL_LABEL[nivel]}.`);
    return { nivel, dados: 0, tipoDado: 0, dano: "-", media: 0, custoPE: null, avisos, detalhes: {} };
  }
  let [poolBase, tipoDado] = linha;

  // Ação: só Comum ou Completa (autor). Completa dá +nível dados.
  const acao = f.acao === "completa" ? "completa" : "comum";
  poolBase += acao === "completa" ? nNum : 0;

  // Golpeador é sempre Ataque, sem trocas de alcance (o alcance é a fórmula).
  const r = saldoUnicoVariante(f, ctx, {
    nivel, nNum, poolBase, resolucao: "ataque", alcanceBase: null, permiteAlcance: false, avisos,
  });
  let dados = r.dados;

  // Múltiplos golpes (a partir do Nv3). Divide o dano adicional entre golpes.
  const maxGolpes = maxGolpesGolpeador(nivel);
  const golpesPedidos = Math.max(1, f.golpesGolpeador | 0 || 1);
  const golpes = Math.min(golpesPedidos, maxGolpes);
  if (golpesPedidos > maxGolpes) avisos.push(`Máximo de ${maxGolpes} golpe(s) no ${NIVEL_LABEL[nivel]}.`);
  const penalidadePorGolpe = nivel === "max" ? 2 : 3;
  let danoTexto;
  let golpesInfo = null;
  if (golpes > 1) {
    const porGolpe = Math.max(1, Math.floor(dados / golpes));
    golpesInfo = { golpes, porGolpe, penalidadePorGolpe, concentradoTotal: dados };
    danoTexto = `${golpes}× ${notacaoDano(porGolpe, tipoDado)}`;
  } else {
    danoTexto = notacaoDano(dados, tipoDado);
  }

  const custoPE = custoPadrao(nivel === "max" ? 5 : nivel);
  const alcanceTexto = `Movimento Restante + ${String(1.5 * nNum).replace(".", ",")}m`;
  return {
    nivel,
    dados,
    tipoDado,
    dano: danoTexto,
    media: golpes > 1 ? null : mediaDano(dados, tipoDado),
    alcanceTexto,
    custoPE,
    cd: r.cd,
    acertoDelta: r.acertoDelta,
    empurraoMetros: r.empurraoMetros,
    faltamDados: r.faltamDados,
    golpes: golpesInfo,
    avisos,
    detalhes: { aposAtaque: "Dano Após Ataque, não multiplica em crítico. Aplica os efeitos de um golpe desarmado ou de arma." },
  };
}

// ---------------------------------------------------------------
// MOTOR — Feitiço de Dano na Alma.
// ---------------------------------------------------------------
export function calcularFeiticoDanoAlma(feitico, ctx = {}) {
  const avisos = [];
  const f = feitico || {};
  const nivel = f.nivel ?? 1;
  const nNum = nivel === "max" ? 6 : nivel;
  if (ctx.nd != null && nivel !== "max" && nivel > nivelMaxFeiticoDoContexto(ctx)) {
    avisos.push(`Nível ${nivel} inacessível: no ND ${ctx.nd} o máximo é ${nivelMaxFeiticoDoContexto(ctx)}.`);
  }
  const linha = DANO_ALMA[nivel];
  if (!linha) {
    avisos.push(`Sem linha de Dano na Alma para ${NIVEL_LABEL[nivel]}.`);
    return { nivel, dados: 0, tipoDado: 0, dano: "-", media: 0, custoPE: null, avisos, detalhes: {} };
  }
  let [poolBase, tipoDado] = linha;

  const resolucao = f.resolucao === "ataque" ? "ataque" : "tr";
  const acao = f.acao || "comum";           // bonus | comum | completa
  poolBase += modDadosPorAcao(acao, nNum);

  // Alcance base = METADE do alcance de alvo único (piso).
  const alcanceBase = Math.floor((ALCANCE_POR_NIVEL[nivel] ?? 0) / 2);

  const r = saldoUnicoVariante(f, ctx, {
    nivel, nNum, poolBase, resolucao, alcanceBase, permiteAlcance: true, avisos,
  });

  const custoPE = custoPadrao(nivel === "max" ? 5 : nivel);
  return {
    nivel,
    dados: r.dados,
    tipoDado,
    dano: notacaoDano(r.dados, tipoDado),
    media: mediaDano(r.dados, tipoDado),
    resolucao,
    alcance: r.alcanceFinal,
    custoPE,
    cd: r.cd,
    acertoDelta: r.acertoDelta,
    empurraoMetros: r.empurraoMetros,
    faltamDados: r.faltamDados,
    avisos,
    detalhes: {
      furaTudo: "Passa por Vida Temporária, RD e demais efeitos, ferindo a integridade da alma (reduz vida máxima, vida atual e integridade).",
      aumentoExternoMetade: "Todo aumento de dano ou alcance que não venha da criação é cortado pela metade.",
    },
  };
}

// ---------------------------------------------------------------
// MOTOR — Feitiço de Invisibilidade.
// Sem tabela: o nível é escolha narrativa (como a criatura fica invisível).
// Sempre Sustentado + Concentração. Nível 0 só se a Técnica for diretamente
// a invisibilidade. Nível 1 e 2 exigem uma forma de ser anulado.
// ---------------------------------------------------------------
export function calcularFeiticoInvisibilidade(feitico, ctx = {}) {
  const avisos = [];
  const f = feitico || {};
  const nivel = f.nivel ?? 1;
  if (ctx.nd != null && nivel !== "max" && nivel > nivelMaxFeiticoDoContexto(ctx)) {
    avisos.push(`Nível ${nivel} inacessível: no ND ${ctx.nd} o máximo é ${nivelMaxFeiticoDoContexto(ctx)}.`);
  }
  if (nivel === 0 && !f.tecnicaInvisibilidade) {
    avisos.push("Nível 0 só é possível se a Técnica Amaldiçoada for diretamente a capacidade de ficar invisível.");
  }
  const exigeFraqueza = nivel === 1 || nivel === 2;
  const temFraqueza = !!(f.fraquezaInvis && f.fraquezaInvis.trim());
  if (exigeFraqueza && !temFraqueza) {
    avisos.push("Feitiços de Nível 1 e 2 precisam de uma forma de serem anulados.");
  }
  const custoPE = custoPadrao(nivel === "max" ? 5 : nivel);
  return {
    nivel,
    resumo: "Invisível",
    custoPE,
    sustentado: true,
    concentracao: true,
    exigeFraqueza,
    temFraqueza,
    avisos,
    detalhes: { regra: "Sempre Sustentado e usa Concentração. Não pode ser Imediato nem Duradouro." },
  };
}

// ---------------------------------------------------------------
// MOTOR — Feitiço de Criação de Shikigamis.
// O nível do Feitiço dita o GRAU da invocação (e um ajuste de Ações/
// Características no Nível 0 e na Técnica Máxima). A criatura em si é montada
// na aba Invocações: o Feitiço só a REFERENCIA por id, é a autoridade do grau
// (avisa se o grau da invocação escolhida não bater) e calcula o que o nível
// dita: redução permanente de PE (2×nível, com a TM contando como "Nível 6" =
// 12), custo de invocação (= custo do Feitiço) e as notas de regra.
// ---------------------------------------------------------------
export const SHIKIGAMI_TABELA = {
  0:   { grau: "quarto",   ajusteAcoes: -1 },
  1:   { grau: "quarto",   ajusteAcoes: 0 },
  2:   { grau: "terceiro", ajusteAcoes: 0 },
  3:   { grau: "segundo",  ajusteAcoes: 0 },
  4:   { grau: "primeiro", ajusteAcoes: 0 },
  5:   { grau: "especial", ajusteAcoes: 0 },
  max: { grau: "especial", ajusteAcoes: 2 },
};

export function calcularFeiticoShikigami(feitico, ctx = {}) {
  const avisos = [];
  const f = feitico || {};
  const nivel = f.nivel ?? 1;
  if (ctx.nd != null && nivel !== "max" && nivel > nivelMaxFeiticoDoContexto(ctx)) {
    avisos.push(`Nível ${nivel} inacessível: no ND ${ctx.nd} o máximo é ${nivelMaxFeiticoDoContexto(ctx)}.`);
  }
  const linha = SHIKIGAMI_TABELA[nivel] || SHIKIGAMI_TABELA[1];
  const grau = grauMeta(linha.grau);
  const ajusteAcoes = linha.ajusteAcoes;

  // Redução permanente de PE = 2×nível (TM = "Nível 6" = 12) enquanto existir.
  const nivelNum = nivel === "max" ? 6 : nivel;
  const reducaoPE = 2 * nivelNum;

  // Custo de invocação = custo do Feitiço (sobrepõe o custo próprio da invocação).
  const custoPE = custoPadrao(nivel === "max" ? 5 : nivel);

  // Invocação referenciada (montada na aba Invocações). Lista de opções para o
  // seletor, com o grau exigido destacado.
  const lista = Array.isArray(ctx.invocacoes) ? ctx.invocacoes : [];
  const opcoes = lista.map((x) => ({
    id: x.id,
    nome: x.nome || "",
    grau: x.grau,
    grauLabel: grauMeta(x.grau).label,
    confere: x.grau === linha.grau,
  }));
  const ref = f.shikigamiInvocacaoId ? lista.find((x) => x && x.id === f.shikigamiInvocacaoId) : null;
  let refNome = null, refGrau = null, grauConfere = null;
  if (f.shikigamiInvocacaoId && !ref) {
    avisos.push("A invocação referenciada não existe mais. Escolha outra na aba Invocações.");
  } else if (ref) {
    refNome = ref.nome || "";
    refGrau = ref.grau;
    grauConfere = ref.grau === linha.grau;
    if (!grauConfere) {
      avisos.push(`A invocação está em ${grauMeta(ref.grau).label}, mas o Nível ${nivel === "max" ? "TM" : nivel} exige ${grau.label}.`);
    }
  } else {
    avisos.push("Escolha uma invocação na aba Invocações para este Shikigami.");
  }

  const notas = [
    "Invocar usa Ação Comum. Em campo, o shikigami faz uma Ação Complexa ou Simples e uma de Movimento por rodada, sem gastar as próprias ações.",
    "Invocar conta como a ação Conjurar: não recebe Autonomia, mas recebe Manipulação Perfeita (no custo base).",
    "Depois de conjurado não é um Feitiço: sem Explosão Encadeada nem Técnica Potente.",
    "Sem Liberação Máxima e sem Ritual. O grau só sobe subindo o nível do Feitiço.",
  ];
  if (nivel === "max") {
    notas.push("Sendo Técnica Máxima, a recarga só começa a contar depois que o shikigami é dissipado.");
  }

  return {
    nivel,
    resumo: `Shikigami ${grau.label}`,
    grau: linha.grau,
    grauLabel: grau.label,
    ajusteAcoes,
    reducaoPE,
    custoPE,
    acao: "Comum",
    invocacaoId: f.shikigamiInvocacaoId || null,
    refNome,
    refGrau,
    grauConfere,
    opcoes,
    avisos,
    notas,
  };
}

// ---------------------------------------------------------------
// MOTOR — Feitiço de Criação de Itens de Custo.
// Autocontido (os itens criados NÃO entram no limite de custo).
// Base: Nível N cria 1 item de Custo N (N = 1 a 4). No Nível 5, 2 itens de
// Custo 4. Fórmula geral (deriva dos exemplos do livro):
//   quantidade = Nível − Custo + 1, com Custo de 1 a min(Nível, 4).
// Troca de grau: reduz a quantidade (mínimo 1 item), até Nível vezes, e UM
// item recebe +1 de Grau por item sacrificado. Foco (Mai Zenin) cria um
// nível mais cedo (nível efetivo +1).
// ---------------------------------------------------------------
export const ITEM_CUSTO_MAX = 4;   // a tabela vai até Custo 4

export function calcularFeiticoItens(feitico, ctx = {}) {
  const avisos = [];
  const f = feitico || {};
  const nivel = f.nivel ?? 1;
  if (ctx.nd != null && nivel !== "max" && nivel > nivelMaxFeiticoDoContexto(ctx)) {
    avisos.push(`Nível ${nivel} inacessível: no ND ${ctx.nd} o máximo é ${nivelMaxFeiticoDoContexto(ctx)}.`);
  }
  if (nivel === "max" || nivel < 1) {
    avisos.push("Criação de Itens é do Nível 1 ao 5.");
    return { nivel, custo: 0, quantidade: 0, resumo: "-", custoPE: null, avisos, detalhes: {} };
  }
  const foco = !!f.tecnicaFocoItens;
  const nivelEfetivo = nivel + (foco ? 1 : 0);
  const maxCusto = Math.min(nivelEfetivo, ITEM_CUSTO_MAX);
  let custo = Math.max(1, f.itemCusto | 0 || 1);
  if (custo > maxCusto) {
    avisos.push(`No Nível ${nivel}${foco ? ` (foco, efetivo ${nivelEfetivo})` : ""} o Custo máximo é ${maxCusto}.`);
    custo = maxCusto;
  }
  const qtdBase = nivelEfetivo - custo + 1;

  // Troca de grau: reduz quantidade (mínimo 1 item), até Nível vezes.
  const maxReducao = Math.max(0, Math.min(qtdBase - 1, nivel));
  const reducaoPedida = Math.max(0, f.itemGrauTroca | 0);
  const reducao = Math.min(reducaoPedida, maxReducao);
  if (reducaoPedida > maxReducao) {
    avisos.push(`Máximo de ${maxReducao} troca(s) de Grau (mínimo de 1 item, até ${nivel} vez${nivel === 1 ? "" : "es"}).`);
  }
  const quantidade = qtdBase - reducao;
  const grauBonus = reducao;

  const natureza = f.itemNatureza === "permanente" ? "permanente" : "consumivel";
  const custoPE = custoPadrao(nivel);
  const resumo = `${quantidade}× Custo ${custo}${grauBonus > 0 ? ` (+${grauBonus} Grau)` : ""}`;
  return {
    nivel,
    nivelEfetivo,
    foco,
    custo,
    maxCusto,
    qtdBase,
    quantidade,
    grauBonus,
    natureza,
    custoPE,
    resumo,
    avisos,
    detalhes: {
      restricao: natureza === "consumivel"
        ? "Item consumível: só pode ser criado uma vez por descanso longo."
        : `Item permanente (arma, revestimento e afins): pode ser recriado, mas só ${qtdBase} podem existir ao mesmo tempo.`,
      duracao: "Itens criados não entram no limite de custo e duram até serem destruídos ou desfeitos (Ação Livre).",
      acao: "Ação Bônus.",
    },
  };
}

// ---------------------------------------------------------------
// MOTOR — Feitiço de Transformação.
// Concede um CONJUNTO de efeitos auxiliares Duradouros. A tabela dá a
// quantidade e o nível de aux de cada slot (interpretação: "escolha entre N
// efeitos" = RECEBE N efeitos, pelas trocas de quantidade fazerem sentido).
// Usa AUX_TABELAS (coluna Duradoura, com fallback Sustentada).
// ---------------------------------------------------------------
export const TRANSFORMACAO_BASE = {
  1: [0, 0],
  2: [1, 1, 1],
  3: [2, 1, 1],
  4: [2, 2, 2],
  5: [3, 3, 3],
  max: [4, 4, 4],
};
export const TRANSF_DURACOES = [
  { value: "sustentada", label: "Sustentada" },
  { value: "duradoura",  label: "Duradoura" },
  { value: "cena",       label: "Cena de Combate" },
];
export const TRANSF_ACOES = [
  { value: "comum",    label: "Ação Comum" },
  { value: "bonus",    label: "Ação Bônus" },
  { value: "completa", label: "Ação Completa" },
];

// Valor cru de um efeito auxiliar na coluna Duradoura (fallback Sustentada).
export function valorTransfEfeito(efeito, auxNivel) {
  const linha = AUX_TABELAS[efeito]?.[auxNivel];
  if (!linha) return { valor: null, coluna: null };
  if (linha.duradoura != null) return { valor: linha.duradoura, coluna: "duradoura" };
  if (linha.sustentada != null) return { valor: linha.sustentada, coluna: "sustentada" };
  return { valor: null, coluna: null };
}
// Formata o valor cru de um efeito auxiliar (num, metros, dados ou especial).
export function formatValorAuxCru(efeito, valor) {
  if (valor == null) return "-";
  if (typeof valor === "string") return valor;
  const def = AUX_EFEITOS.find((e) => e.value === efeito);
  if (def?.tipoValor === "dados" && Array.isArray(valor)) return notacaoDano(valor[0], valor[1]);
  const sinal = valor > 0 ? "+" : "";
  return `${sinal}${String(valor).replace(".", ",")}${def?.unidade ? ` ${def.unidade}` : ""}`;
}

/**
 * Efeito padrão de um slot: o primeiro do catálogo que TEM valor naquele nível
 * de aux.
 *
 * ⚠ CORRIGIDO em 2026-08-09. Era `AUX_EFEITOS[0]` fixo, que é o Aumento de
 * Defesa, e a Defesa não existe no NÍVEL 0 de aux (nem na coluna Duradoura nem
 * na Sustentada). Como a Transformação de Nível 1 tem os dois slots no nível 0,
 * ela NASCIA com dois avisos sobre uma escolha que o jogador nunca fez, e o
 * triângulo de aviso acendia na Ficha numa ficha recém-criada.
 */
function efeitoPadraoTransf(auxNivel) {
  const achado = AUX_EFEITOS.find((e) => valorTransfEfeito(e.value, auxNivel).valor != null);
  return (achado ?? AUX_EFEITOS[0]).value;
}

export function calcularFeiticoTransformacao(feitico, ctx = {}) {
  const avisos = [];
  const f = feitico || {};
  const nivel = f.nivel ?? 1;
  const nNum = nivel === "max" ? 6 : nivel;
  if (ctx.nd != null && nivel !== "max" && nivel > nivelMaxFeiticoDoContexto(ctx)) {
    avisos.push(`Nível ${nivel} inacessível: no ND ${ctx.nd} o máximo é ${nivelMaxFeiticoDoContexto(ctx)}.`);
  }
  const base = TRANSFORMACAO_BASE[nivel];
  if (!base) {
    avisos.push("Transformação é do Nível 1 ao 5.");
    return { nivel, slots: [], resumo: "-", custoPE: null, avisos, detalhes: {} };
  }

  const acao = ["comum", "bonus", "completa"].includes(f.transfAcao) ? f.transfAcao : "comum";
  const duracao = ["sustentada", "duradoura", "cena"].includes(f.transfDuracao) ? f.transfDuracao : "sustentada";

  let slots = [...base];
  // Ação Bônus: −1 efeito (remove o de menor nível). Completa: +1 efeito de
  // nível inferior (mín 0).
  if (acao === "bonus") {
    if (slots.length > 1) { slots.sort((a, b) => a - b); slots.shift(); }
    else avisos.push("Ação Bônus não pode reduzir abaixo de 1 efeito.");
  } else if (acao === "completa") {
    slots.push(Math.max(0, Math.max(...slots) - 1));
  }
  // Duradoura concede +1 efeito adicional (no menor nível atual).
  if (duracao === "duradoura") slots.push(Math.min(...slots));

  // Troca de nível: −1 efeito por +1 em TODOS os outros, teto = min(nível, 5).
  const nivelCap = Math.min(nNum, 5);
  const trocasPedidas = Math.max(0, f.transfNivelTroca | 0);
  let aplicadas = 0;
  while (aplicadas < trocasPedidas && slots.length > 1 && Math.max(...slots) < nivelCap) {
    slots.sort((a, b) => a - b);
    slots.shift();
    slots = slots.map((l) => l + 1);
    aplicadas += 1;
  }
  if (trocasPedidas > aplicadas) {
    avisos.push(`Só foi possível aplicar ${aplicadas} troca(s) de nível (mínimo de 1 efeito, teto de nível ${nivelCap}).`);
  }
  slots.sort((a, b) => b - a);

  // Resolve os efeitos atribuídos a cada slot (id de aux por slot).
  const atribuidos = Array.isArray(f.transfEfeitos) ? f.transfEfeitos : [];
  const efeitos = slots.map((auxNivel, i) => {
    const efeitoId = atribuidos[i] || efeitoPadraoTransf(auxNivel);
    const def = AUX_EFEITOS.find((e) => e.value === efeitoId) || AUX_EFEITOS[0];
    const { valor, coluna } = valorTransfEfeito(efeitoId, auxNivel);
    const disponivel = valor != null;
    return {
      efeito: efeitoId,
      label: def.label,
      auxNivel,
      valor,
      coluna,
      disponivel,
      texto: disponivel ? formatValorAuxCru(efeitoId, valor) : "-",
    };
  });
  efeitos.forEach((e) => {
    if (!e.disponivel) avisos.push(`${e.label} não tem valor no Nível ${e.auxNivel} de aux.`);
  });

  // Duração, upkeep e exaustão.
  const sustentacaoPE = nNum;                       // custo de sustentação = nível
  const custoVida = duracao === "sustentada" && !!f.transfCustoVida;
  const sustentacaoVida = custoVida ? 5 * sustentacaoPE : 0;  // 5 × sustentação de PV/rodada
  let duracaoRodadas = null;
  let exaustaoFim = 0;
  let notaExaustao = "";
  if (duracao === "duradoura") {
    duracaoRodadas = Math.ceil(nNum / 2);
    exaustaoFim = Math.floor(nNum / 2);
    // ⚠ No Nível 1 a metade do nível arredondada para baixo é ZERO, e a nota
    // saía como "0 de exaustão quando acabar.", que é uma linha de tela
    // avisando que nada acontece. Sem exaustão, sem nota.
    notaExaustao = exaustaoFim > 0 ? `${exaustaoFim} de exaustão quando acabar.` : "";
  } else if (duracao === "cena") {
    exaustaoFim = nivel === "max" ? 5 : Math.max(1, Math.ceil(nNum / 2));
    notaExaustao = nivel === "max"
      ? "5 acúmulos de exaustão no fim do combate."
      : `${exaustaoFim} de exaustão no fim da cena, junto do custo em PE.`;
  } else {
    notaExaustao = "1 de exaustão a cada 2 rodadas consecutivas sustentando (fora a rodada de ativação).";
  }

  const custoPE = custoPadrao(nivel === "max" ? 5 : nivel);
  const resumo = `${efeitos.length} Efeito${efeitos.length === 1 ? "" : "s"}`;
  return {
    nivel,
    acao,
    duracao,
    slots,
    efeitos,
    sustentacaoPE: duracao === "sustentada" && !custoVida ? sustentacaoPE : 0,
    sustentacaoVida,
    custoVida,
    duracaoRodadas,
    exaustaoFim,
    notaExaustao,
    custoPE,
    resumo,
    avisos,
    detalhes: {},
  };
}

/**
 * Overrides que os Feitiços de Criação de Shikigamis impõem às Invocações que
 * referenciam, chaveados pelo id da invocação.
 *
 * ⚠ Existe porque a ligação era de MÃO ÚNICA: `calcularFeiticoShikigami` já
 * calculava o grau exigido, o `ajusteAcoes` (-1 no Nível 0, +2 na Técnica
 * Máxima) e o custo, mostrava tudo no painel do Feitiço, e nada disso chegava
 * na ficha da invocação. O orçamento e o custo dela ignoravam o Feitiço que a
 * criou.
 *
 * O custo do Feitiço SUBSTITUI o custo próprio da invocação (o shikigami é
 * conjurado, não invocado pelo custo do grau), e por isso viaja como
 * `custoFixo` e não como desconto.
 */
export function overridesShikigami(feiticos = [], ctx = {}) {
  const out = {};
  for (const f of Array.isArray(feiticos) ? feiticos : []) {
    if (f?.tipo !== "especial" || f?.especialSubtipo !== "shikigami") continue;
    if (!f?.shikigamiInvocacaoId) continue;
    /* ⚠ AS REDUÇÕES DE CUSTO ENTRAM AQUI TAMBÉM. O card do Feitiço passa pelo
       `aplicaReducoesCustoFeitico` (é o que `linhaDoFeitico` faz) e este caminho
       não passava: com Manipulação Perfeita marcada, o Feitiço mostrava o custo
       pela metade e a ficha da invocação cobrava o cheio. Dois números para a
       mesma coisa, e o próprio texto do Shikigami diz que ele RECEBE Manipulação
       Perfeita. */
    const calc = aplicaReducoesCustoFeitico(f, calcularFeiticoShikigami(f, ctx), ctx);
    const fonte = f.nome?.trim() || "Feitiço de Shikigami";
    /* ⚠ DOIS Feitiços apontando para a MESMA invocação: o último vencia calado,
       e a ficha mostrava o grau e o custo de um deles sem dizer que o outro
       existia. Agora o primeiro manda (é o que a ordem da lista sugere) e a
       disputa vira aviso na invocação, que é onde a ambiguidade morde. */
    const jaTem = out[f.shikigamiInvocacaoId];
    if (jaTem) {
      jaTem.disputa = [...(jaTem.disputa ?? [jaTem.fonte]), fonte];
      continue;
    }
    out[f.shikigamiInvocacaoId] = {
      fonte,
      grauExigido: calc.grau,
      ajusteAcoes: calc.ajusteAcoes,
      custoFixo: calc.custoPE,
      reducaoPE: calc.reducaoPE,
      disputa: null,
    };
  }
  return out;
}

// Despacho do tipo Especial pelo subtipo escolhido.
export function calcularFeiticoEspecial(feitico, ctx = {}) {
  switch (feitico?.especialSubtipo) {
    case "golpeador":     return calcularFeiticoGolpeador(feitico, ctx);
    case "danoAlma":      return calcularFeiticoDanoAlma(feitico, ctx);
    case "invisibilidade":return calcularFeiticoInvisibilidade(feitico, ctx);
    case "itens":         return calcularFeiticoItens(feitico, ctx);
    case "shikigami":     return calcularFeiticoShikigami(feitico, ctx);
    case "transformacao": return calcularFeiticoTransformacao(feitico, ctx);
    default: return null;
  }
}

// ===============================================================
// FEITIÇOS AUXILIARES
// ===============================================================
// Auxiliares dão suporte: aumentam Defesa, concedem RD, bônus em
// rolagens, movimento, dano adicional e afins, com a potência
// dependendo do NÍVEL do Feitiço e da DURAÇÃO escolhida.
//
// Três durações (cada tabela tem uma coluna para cada):
//  - Imediata  : dura 1 golpe / 1 rodada. Maior valor.
//  - Duradoura : dura uma quantidade de rodadas escolhida, <= 1+nível.
//                O valor final é recalculado por rodadas (ver abaixo).
//                O nível que manda nas rodadas é o do FEITIÇO, mesmo em
//                Múltiplos Efeitos, onde os efeitos são de nível menor.
//  - Sustentada: até uma cena, com upkeep por rodada (1 PE nv0-2,
//                2 PE nv3-5). Só um sustentado ativo por vez.
//
// ⚠ Tabelas VERBATIM do livro. "–" (indisponível) = null.
//   Células especiais (Esquiva Garantida, Garantido, Cena, Global,
//   Mapa, Falha Garantida, Sucesso Crítico) ficam como STRING.
//   Dano adicional guarda [qtd, tipoDeDado] como as tabelas de dano.
// ⚠ Técnica Máxima ("max") existe nas tabelas mas NÃO é criável ainda
//   (vem de Aptidão), igual ao Dano.
// ---------------------------------------------------------------

export const AUX_DURACOES = [
  { value: "imediata",   label: "Imediata" },
  { value: "duradoura",  label: "Duradoura" },
  { value: "sustentada", label: "Sustentada" },
];

// Metadados de cada efeito auxiliar. tipoValor: "num" (bônus inteiro),
// "metros" (alcance/movimento), "dados" ([qtd,tipo]). acaoPadrao é a
// ação assumida pela tabela. multiTipo: pode escolher tipos de dano
// extras (reduzindo o valor). combinavel: false marca os danos
// adicionais que não se acumulam entre si.
//
// EVENTO ÚNICO (autor, 2026-07-23). Um Feitiço que se gasta num único evento
// só junta efeitos que resolvem NO MESMO evento, então cada efeito declara:
//  - evento: "ofensivo" (o golpe/teste é seu), "defensivo" (é contra você),
//    "ambos" (uma rolagem serve aos dois lados) ou ausente (o efeito não entra
//    num Feitiço de evento único).
//  - eventoNativo: o efeito JÁ é de uma rolagem só (TR, CD, Rolagem, Prejuízo),
//    então não há o que espremer e ele não ganha bônus por isso. Os demais são
//    de ESTADO (valem a rodada) e ganham o bônus de um golpe.
// Negação de RD fica de fora: depende do teste do inimigo, e o autor não vê
// caso de uma habilidade te buffar e afetar o inimigo ao mesmo tempo.
export const AUX_EFEITOS = [
  { value: "defesa",           label: "Aumento de Defesa",              unidade: "DEF",    tipoValor: "num",    acaoPadrao: "comum", evento: "defensivo" },
  { value: "rd",               label: "Redução de Dano",                unidade: "RD",     tipoValor: "num",    acaoPadrao: "comum",  multiTipo: true, evento: "defensivo" },
  { value: "atributo",         label: "Aumento de Atributo",            unidade: "pontos", tipoValor: "num",    acaoPadrao: "bonus" },
  { value: "tr",               label: "Bônus em Teste de Resistência",  unidade: "",       tipoValor: "num",    acaoPadrao: "bonus", evento: "defensivo", eventoNativo: true },
  { value: "rolagem",          label: "Bônus em Rolagem",               unidade: "",       tipoValor: "num",    acaoPadrao: "bonus", evento: "ambos", eventoNativo: true },
  { value: "movimento",        label: "Aumento de Movimento",           unidade: "m",      tipoValor: "metros", acaoPadrao: "bonus" },
  { value: "danoDurante",      label: "Dano Adicional (Durante Ataque)", unidade: "",      tipoValor: "dados",  acaoPadrao: "bonus", grupoDano: true, evento: "ofensivo" },
  { value: "danoApos",         label: "Dano Adicional (Após Ataque)",   unidade: "",       tipoValor: "dados",  acaoPadrao: "bonus", grupoDano: true, evento: "ofensivo" },
  { value: "danoFixo",         label: "Dano Adicional (Dano Fixo)",     unidade: "",       tipoValor: "num",    acaoPadrao: "bonus", grupoDano: true, evento: "ofensivo" },
  { value: "niveisDano",       label: "Níveis de Dano Adicionais",      unidade: "níveis", tipoValor: "num",    acaoPadrao: "bonus", grupoDano: true, evento: "ofensivo" },
  { value: "margemCritico",    label: "Margem de Crítico Adicional",    unidade: "",       tipoValor: "num",    acaoPadrao: "bonus", evento: "ofensivo" },
  { value: "negacaoRd",        label: "Negação de Redução de Dano",     unidade: "RD",     tipoValor: "num",    acaoPadrao: "comum",  multiTipo: true },
  { value: "cd",               label: "Aumento de Classe de Dificuldade", unidade: "CD",   tipoValor: "num",    acaoPadrao: "bonus", evento: "ofensivo", eventoNativo: true },
  { value: "prejuizoRolagem",  label: "Prejuízo em Rolagem",            unidade: "",       tipoValor: "num",    acaoPadrao: "comum", evento: "ambos", eventoNativo: true },
  { value: "ataque",           label: "Bônus em Testes de Ataque",      unidade: "",       tipoValor: "num",    acaoPadrao: "bonus", evento: "ofensivo" },
  { value: "alcanceCaC",       label: "Bônus em Alcance Corpo a Corpo", unidade: "m",      tipoValor: "metros", acaoPadrao: "bonus" },
  { value: "alcanceDistancia", label: "Bônus em Alcance à Distância",   unidade: "m",      tipoValor: "metros", acaoPadrao: "bonus" },
];

// Tabelas verbatim. Cada nível -> { imediata, duradoura, sustentada }.
// null = "–". String = célula especial. [qtd, tipo] = dano adicional.
export const AUX_TABELAS = {
  defesa: {
    0:   { imediata: 1, duradoura: null, sustentada: null },
    1:   { imediata: 2, duradoura: 1,    sustentada: null },
    2:   { imediata: 4, duradoura: 2,    sustentada: 1 },
    3:   { imediata: 6, duradoura: 4,    sustentada: 2 },
    4:   { imediata: 9, duradoura: 6,    sustentada: 4 },
    5:   { imediata: "Esquiva Garantida",   duradoura: 9,  sustentada: 7 },
    max: { imediata: "2 Esquivas Garantidas", duradoura: 12, sustentada: 10 },
  },
  rd: {
    0:   { imediata: 3,  duradoura: 2,  sustentada: 2 },
    1:   { imediata: 5,  duradoura: 4,  sustentada: 4 },
    2:   { imediata: 10, duradoura: 8,  sustentada: 7 },
    3:   { imediata: 14, duradoura: 11, sustentada: 10 },
    4:   { imediata: 18, duradoura: 14, sustentada: 12 },
    5:   { imediata: 25, duradoura: 20, sustentada: 18 },
    max: { imediata: 35, duradoura: 27, sustentada: 23 },
  },
  atributo: {
    0:   { imediata: null, duradoura: null, sustentada: null },
    1:   { imediata: null, duradoura: null, sustentada: null },
    2:   { imediata: null, duradoura: 6,  sustentada: 4 },
    3:   { imediata: null, duradoura: 8,  sustentada: 6 },
    4:   { imediata: null, duradoura: 10, sustentada: 8 },
    5:   { imediata: null, duradoura: 14, sustentada: 12 },
    max: { imediata: null, duradoura: 18, sustentada: 16 },
  },
  tr: {
    0:   { imediata: 1,  duradoura: null, sustentada: null },
    1:   { imediata: 2,  duradoura: 1,    sustentada: null },
    2:   { imediata: 4,  duradoura: 2,    sustentada: 1 },
    3:   { imediata: 6,  duradoura: 4,    sustentada: 2 },
    4:   { imediata: 9,  duradoura: 6,    sustentada: 4 },
    5:   { imediata: 12, duradoura: 9,    sustentada: 7 },
    max: { imediata: "Sucesso Crítico", duradoura: 12, sustentada: 10 },
  },
  rolagem: {
    0:   { imediata: 1,  duradoura: null, sustentada: null },
    1:   { imediata: 2,  duradoura: 1,    sustentada: null },
    2:   { imediata: 4,  duradoura: 2,    sustentada: 1 },
    3:   { imediata: 6,  duradoura: 4,    sustentada: 2 },
    4:   { imediata: 9,  duradoura: 6,    sustentada: 4 },
    5:   { imediata: 12, duradoura: 9,    sustentada: 7 },
    max: { imediata: "Garantido", duradoura: 12, sustentada: 10 },
  },
  movimento: {
    0:   { imediata: 4.5,  duradoura: 3,    sustentada: 3 },
    1:   { imediata: 6,    duradoura: 4.5,  sustentada: 4.5 },
    2:   { imediata: 9,    duradoura: 7.5,  sustentada: 6 },
    3:   { imediata: 15,   duradoura: 13.5, sustentada: 12 },
    4:   { imediata: 18,   duradoura: 16.5, sustentada: 15 },
    5:   { imediata: 21,   duradoura: 19.5, sustentada: 18 },
    max: { imediata: 27,   duradoura: 24,   sustentada: 21 },
  },
  danoDurante: {
    0:   { imediata: [1, 8],  duradoura: null, sustentada: [1, 6] },
    1:   { imediata: [2, 6],  duradoura: null, sustentada: [1, 10] },
    2:   { imediata: [3, 8],  duradoura: null, sustentada: [2, 8] },
    3:   { imediata: [3, 10], duradoura: null, sustentada: [3, 8] },
    4:   { imediata: [4, 10], duradoura: null, sustentada: [3, 10] },
    5:   { imediata: [5, 12], duradoura: null, sustentada: [4, 12] },
    max: { imediata: [6, 12], duradoura: null, sustentada: [5, 12] },
  },
  danoApos: {
    0:   { imediata: [1, 12], duradoura: null, sustentada: [1, 8] },
    1:   { imediata: [2, 12], duradoura: null, sustentada: [2, 6] },
    2:   { imediata: [3, 12], duradoura: null, sustentada: [2, 12] },
    3:   { imediata: [4, 12], duradoura: null, sustentada: [3, 12] },
    4:   { imediata: [5, 12], duradoura: null, sustentada: [4, 12] },
    5:   { imediata: [7, 12], duradoura: null, sustentada: [5, 12] },
    max: { imediata: [9, 12], duradoura: null, sustentada: [6, 12] },
  },
  danoFixo: {
    0:   { imediata: 6,  duradoura: null, sustentada: 4 },
    1:   { imediata: 12, duradoura: null, sustentada: 8 },
    2:   { imediata: 21, duradoura: null, sustentada: 15 },
    3:   { imediata: 28, duradoura: null, sustentada: 21 },
    4:   { imediata: 35, duradoura: null, sustentada: 28 },
    5:   { imediata: 50, duradoura: null, sustentada: 35 },
    max: { imediata: 62, duradoura: null, sustentada: 42 },
  },
  niveisDano: {
    0:   { imediata: 1,  duradoura: null, sustentada: null },
    1:   { imediata: 2,  duradoura: null, sustentada: 1 },
    2:   { imediata: 4,  duradoura: null, sustentada: 2 },
    3:   { imediata: 6,  duradoura: null, sustentada: 3 },
    4:   { imediata: 8,  duradoura: null, sustentada: 4 },
    5:   { imediata: 12, duradoura: null, sustentada: 6 },
    max: { imediata: 16, duradoura: null, sustentada: 8 },
  },
  margemCritico: {
    0:   { imediata: null, duradoura: null, sustentada: null },
    1:   { imediata: null, duradoura: null, sustentada: null },
    2:   { imediata: 1,    duradoura: null, sustentada: null },
    3:   { imediata: 2,    duradoura: null, sustentada: 1 },
    4:   { imediata: 4,    duradoura: null, sustentada: 2 },
    5:   { imediata: 6,    duradoura: null, sustentada: 3 },
    max: { imediata: 8,    duradoura: null, sustentada: 4 },
  },
  negacaoRd: {
    0:   { imediata: -3,  duradoura: -2,  sustentada: -2 },
    1:   { imediata: -5,  duradoura: -4,  sustentada: -4 },
    2:   { imediata: -10, duradoura: -8,  sustentada: -7 },
    3:   { imediata: -14, duradoura: -11, sustentada: -10 },
    4:   { imediata: -18, duradoura: -14, sustentada: -12 },
    5:   { imediata: -25, duradoura: -20, sustentada: -18 },
    max: { imediata: -35, duradoura: -27, sustentada: -23 },
  },
  cd: {
    0:   { imediata: 1,  duradoura: null, sustentada: null },
    1:   { imediata: 2,  duradoura: 1,    sustentada: null },
    2:   { imediata: 4,  duradoura: 2,    sustentada: 1 },
    3:   { imediata: 6,  duradoura: 4,    sustentada: 2 },
    4:   { imediata: 8,  duradoura: 6,    sustentada: 4 },
    5:   { imediata: 12, duradoura: 9,    sustentada: 7 },
    max: { imediata: "Falha Garantida", duradoura: 12, sustentada: 10 },
  },
  prejuizoRolagem: {
    0:   { imediata: -1,  duradoura: null, sustentada: null },
    1:   { imediata: -2,  duradoura: -1,   sustentada: null },
    2:   { imediata: -4,  duradoura: -2,   sustentada: -1 },
    3:   { imediata: -6,  duradoura: -4,   sustentada: -2 },
    4:   { imediata: -8,  duradoura: -6,   sustentada: -4 },
    5:   { imediata: -12, duradoura: -9,   sustentada: -7 },
    max: { imediata: "Falha Garantida", duradoura: -12, sustentada: -10 },
  },
  ataque: {
    0:   { imediata: 1, duradoura: null, sustentada: null },
    1:   { imediata: 2, duradoura: 1,    sustentada: null },
    2:   { imediata: 4, duradoura: 2,    sustentada: 1 },
    3:   { imediata: 6, duradoura: 4,    sustentada: 2 },
    4:   { imediata: 9, duradoura: 6,    sustentada: 4 },
    5:   { imediata: "Garantido",   duradoura: 9,  sustentada: 6 },
    max: { imediata: "2 Garantidos", duradoura: 12, sustentada: 10 },
  },
  alcanceCaC: {
    0:   { imediata: 3,    duradoura: 1.5,  sustentada: null },
    1:   { imediata: 6,    duradoura: 3,    sustentada: 1.5 },
    2:   { imediata: 9,    duradoura: 4.5,  sustentada: 3 },
    3:   { imediata: 12,   duradoura: 6,    sustentada: 4.5 },
    4:   { imediata: 18,   duradoura: 9,    sustentada: 7.5 },
    5:   { imediata: "Cena",   duradoura: 15,   sustentada: 12 },
    max: { imediata: "Global", duradoura: 19.5, sustentada: 15 },
  },
  alcanceDistancia: {
    0:   { imediata: 6,    duradoura: 3,    sustentada: 1.5 },
    1:   { imediata: 9,    duradoura: 6,    sustentada: 3 },
    2:   { imediata: 12,   duradoura: 9,    sustentada: 6 },
    3:   { imediata: 15,   duradoura: 12,   sustentada: 9 },
    4:   { imediata: 21,   duradoura: 16.5, sustentada: 12 },
    5:   { imediata: "Cena",   duradoura: 21,   sustentada: 15 },
    max: { imediata: "Global", duradoura: "Mapa", sustentada: 18 },
  },
};

// ---------------------------------------------------------------
// CÉLULAS ESPECIAIS QUE VALEM POR UM ATAQUE (Esquiva Garantida, Garantido...).
// Regra do autor: essas só existem quando o Feitiço é marcado como SOMENTE UM
// ATAQUE. Sem a marca, a célula vale o NÚMERO da faixa (o mesmo 12 das outras
// trilhas de bônus de nível 5) e segue as regras normais de aumento e redução
// de Ação. Ex.: Defesa Nível 5 Imediata em Ação Bônus = 12 − ⌊5/2⌋ = 10 de
// Defesa por uma rodada.
// ⚠ Técnica Máxima ("2 Esquivas Garantidas", "2 Garantidos", "Sucesso Crítico",
//   "Falha Garantida") não é criável e o autor ainda não deu o número dela, então
//   essas células seguem só como texto.
// ⚠ "Cena", "Global" e "Mapa" (alcances) NÃO entram aqui: não duram um ataque.
// ---------------------------------------------------------------
export const AUX_ESPECIAL_UM_GOLPE = {
  defesa: { 5: 12 },
  ataque: { 5: 12 },
};

// O CAMINHO INVERSO: células NUMÉRICAS que viram ESPECIAL quando o Feitiço é de
// um único evento. Na Margem de Crítico, o nível 5 garante o crítico em vez de
// dobrar a margem (autor). Sem a marca, a célula segue valendo o número.
export const AUX_ESPECIAL_COM_GOLPE = {
  margemCritico: { 5: "Crítico Garantido", max: "3 Críticos Garantidos" },
};

export function especialComUmGolpe(efeito, nivel, duracao) {
  if (duracao !== "imediata") return null;
  return AUX_ESPECIAL_COM_GOLPE[efeito]?.[nivel] ?? null;
}

// ---------------------------------------------------------------
// BÔNUS DE UM ÚNICO EVENTO. Durar só o próximo ataque/rolagem aumenta o efeito:
// Defesa ×1,5, RD ×2, dados dobrados, e o equivalente de cada um dos outros.
// ⚠ O aumento é da MARCA, não da Ação (autor): a Reação de Defesa e RD continua
//   valendo como evento único (o livro diz "por um golpe"), mas marcar o Feitiço
//   como evento único dá o mesmo aumento em QUALQUER ação.
// ---------------------------------------------------------------
export const AUX_TEM_UM_GOLPE = new Set([
  "defesa", "rd", "ataque", "danoDurante", "danoApos", "danoFixo", "niveisDano", "margemCritico",
]);

// Nestes a Reação já É "por um golpe" pelo texto do livro.
export const AUX_REACAO_EH_EVENTO = new Set(["defesa", "rd"]);

// Nestes o livro troca o bônus de imediata pelo aumento de Ação Comum/Completa,
// então em comum ou completa não há bônus de evento único a receber.
export const AUX_SEM_EVENTO_EM_COMUM = new Set([
  "danoDurante", "danoApos", "danoFixo", "niveisDano", "margemCritico",
]);

// O efeito aplica o bônus de evento único?
export function aplicaUmGolpe(efeito, nivel, duracao, acao, marcado) {
  if (duracao !== "imediata") return false;
  if (acao === "reacao" && AUX_REACAO_EH_EVENTO.has(efeito)) return true;
  if (!marcado) return false;
  if (especialDeUmGolpe(efeito, nivel, duracao)) return true;
  if (!AUX_TEM_UM_GOLPE.has(efeito)) return false;
  return !(AUX_SEM_EVENTO_EM_COMUM.has(efeito) && (acao === "comum" || acao === "completa"));
}

// A UI deve oferecer a marca? Não oferece quando a Ação já implica um golpe
// (Reação de Defesa e RD) nem onde não há bônus a receber.
export function ofereceUmGolpe(efeito, nivel, duracao, acao) {
  if (duracao !== "imediata") return false;
  if (acao === "reacao" && AUX_REACAO_EH_EVENTO.has(efeito)) return false;
  if (especialDeUmGolpe(efeito, nivel, duracao)) return true;
  if (!AUX_TEM_UM_GOLPE.has(efeito)) return false;
  return !(AUX_SEM_EVENTO_EM_COMUM.has(efeito) && (acao === "comum" || acao === "completa"));
}

// Número que a célula especial vale quando o Feitiço NÃO é de um único ataque.
// null quando a célula não tem essa troca (segue valendo só como texto).
export function valorSemUmGolpe(efeito, nivel, duracao) {
  if (duracao !== "imediata") return null;
  return AUX_ESPECIAL_UM_GOLPE[efeito]?.[nivel] ?? null;
}

// A célula é uma especial de UM ATAQUE (texto com número alternativo)? Usado
// pela UI para oferecer "Somente Um Ataque" em Defesa e Ataque de Nível 5.
export function especialDeUmGolpe(efeito, nivel, duracao) {
  return typeof AUX_TABELAS[efeito]?.[nivel]?.[duracao] === "string"
    && valorSemUmGolpe(efeito, nivel, duracao) != null;
}

// O efeito RESULTA numa célula especial (texto e não número)? Especial não é
// número, então não se divide entre alvos: Esquiva Garantida e Teste de Ataque
// Garantido só chegam a múltiplos alvos pela CONCENTRAÇÃO, que soma alvos sem
// dividir o valor (autor).
export function resultaEspecialAux(efeito, nivel, duracao, umGolpe) {
  if (umGolpe && especialComUmGolpe(efeito, nivel, duracao)) return true;
  if (typeof AUX_TABELAS[efeito]?.[nivel]?.[duracao] !== "string") return false;
  return umGolpe ? true : valorSemUmGolpe(efeito, nivel, duracao) == null;
}

// Upkeep de um Feitiço sustentado, por rodada mantida.
export function upkeepSustentar(nivel) {
  const n = nivel === "max" ? 5 : nivel;
  return n <= 2 ? 1 : 2;
}

// Faixa de rodadas válidas para a Duradoura de um dado nível.
// rodadas <= 1 + nível (regra) e rodadas - ⌈nível/2⌉ >= 1 (denominador
// positivo da fórmula). No nível 0 a Duradoura, quando existe, é 1 rodada.
export function faixaRodadasDuradoura(nivel) {
  const n = nivel === "max" ? 6 : nivel;
  const meia = Math.ceil(n / 2);
  return { min: meia + 1, max: n + 1 };
}

// Valor final da Duradoura: VALOR DA TABELA ÷ (rodadas − ⌈nível/2⌉), piso.
export function valorDuradoura(valorTabela, nivel, rodadas) {
  const n = nivel === "max" ? 6 : nivel;
  const meia = Math.ceil(n / 2);
  const denom = rodadas - meia;
  if (denom < 1) return null;              // fora da faixa (÷ <= 0)
  return Math.floor(valorTabela / denom);
}

// ---------------------------------------------------------------
// MOTOR — Feitiço Auxiliar.
//
// calcularEfeitoAux(e, ctx) computa UM efeito. calcularFeiticoAuxiliar
// despacha: efeito único (Fase A/B) OU Múltiplos Efeitos (Fase C), com o
// orçamento de PE = custo do Feitiço + ganhos (requisito, própria, completa).
//
// e (um efeito): { efeito, nivel, duracao ("imediata"|"duradoura"|
//   "sustentada"), acao ("padrao"|"bonus"|"comum"|"completa"|"reacao"),
//   umGolpe, tiposDanoExtra, alvos, propria, concentracao, concUso, rodadas,
//   nivelDuracao (nível que rege as rodadas da Duradoura, default o do efeito) }
// ctx: { nd, cdBase }
//
// calcularEfeitoAux devolve { disponivel, efeito, efeitoLabel, duracao,
//   valor, especial, dado, notacao, unidade, rodadas, alvos, notas, avisos }.
// ---------------------------------------------------------------
const ORDEM_ACAO = { bonus: 0, comum: 1, completa: 2, reacao: 0 };

// Hierarquia de ação (da menor para a maior): Reação < Bônus < Comum < Completa.
// Usada para a Ação resultante de um Feitiço com Múltiplos Efeitos.
export const HIERARQUIA_ACAO = { reacao: 0, bonus: 1, comum: 2, completa: 3 };

// Efeitos cuja tabela DEFINE aumento por Ação Completa (recebem o bônus da
// tabela na completa em vez dos 2×nível PE da regra geral). Ver Fase C.
const COMPLETA_TABELA = new Set(["rolagem", "ataque"]);

// Resolve a ação efetiva de um efeito. A tabela assume acaoPadrao; TR/Ataque
// imediatos usam Reação por padrão. "padrao"/vazio caem no padrão.
export function resolverAcaoAux(efeito, duracao, acaoRaw) {
  const padrao = !acaoRaw || acaoRaw === "padrao";
  if (padrao && (efeito === "tr" || efeito === "ataque") && duracao === "imediata") return "reacao";
  return padrao ? (AUX_EFEITOS.find((m) => m.value === efeito)?.acaoPadrao || "comum") : acaoRaw;
}

// Resolve a COLUNA de valor de um efeito para a duração do Feitiço (Múltiplos
// Efeitos, onde a duração é única). Se o efeito não tem aquela coluna (ex.:
// Atributo não tem Imediata), cai na primeira coluna disponível e marca
// semRounds: o valor é usado CRU e a duração real segue a do Feitiço (ex.: uma
// rodada como Imediata), sem a divisão da Duradoura.
// O fallback é SEMPRE uma DESCIDA: Imediata → Duradoura → Sustentada, nunca o
// contrário (autor). Uma coluna vazia jamais vira vantagem. Sem degrau abaixo
// para descer, o efeito simplesmente NÃO ENTRA naquela duração: uma Sustentada
// que cai em traço é recusada, não sobe para Duradoura nem para Imediata.
const FALLBACK_COLUNA = {
  imediata:   ["duradoura", "sustentada"],
  duradoura:  ["sustentada"],
  sustentada: [],
};

export function resolverColunaAux(efeito, nivel, duracaoSpell) {
  const linha = AUX_TABELAS[efeito]?.[nivel];
  if (linha && linha[duracaoSpell] != null) return { col: duracaoSpell, semRounds: false };
  const alt = linha ? (FALLBACK_COLUNA[duracaoSpell] || []).find((d) => linha[d] != null) : null;
  // Sem coluna abaixo: devolve a própria coluna vazia e o motor recusa o efeito.
  if (!alt) return { col: duracaoSpell, semRounds: false };
  return { col: alt, semRounds: true };
}

// O efeito tem coluna (própria ou por descida) na duração do Feitiço?
export function temColunaAux(efeito, nivel, duracaoSpell) {
  const { col } = resolverColunaAux(efeito, nivel, duracaoSpell);
  return AUX_TABELAS[efeito]?.[nivel]?.[col] != null;
}

// Menor ação que um efeito ACEITA ser conjurado. A maioria só sobe a partir do
// padrão, mas Defesa/RD podem descer (Bônus, ou Reação se imediata) e Negação
// de RD pode ir a Bônus. Isso libera essas variações no seletor.
function acaoMinAux(efeito, duracao) {
  if (efeito === "defesa" || efeito === "rd") return duracao === "imediata" ? "reacao" : "bonus";
  if (efeito === "negacaoRd") return "bonus";
  return resolverAcaoAux(efeito, duracao, "padrao");
}

// Piso SELECIONÁVEL: a maior das menores ações aceitas pelos efeitos (nenhum
// efeito pode descer abaixo disso). Define o menor degrau do seletor.
export function floorAcaoMult(entries, duracaoSpell) {
  let floor = "reacao";
  for (const en of (Array.isArray(entries) ? entries : [])) {
    const a = acaoMinAux(en.efeito, duracaoSpell);
    if (HIERARQUIA_ACAO[a] > HIERARQUIA_ACAO[floor]) floor = a;
  }
  return floor;
}

// Ação PADRÃO do Feitiço: a maior ação NATURAL (padrão) entre os efeitos. É o
// que fica marcado quando acaoMult = "padrao" (ex.: Defesa puxa para Comum).
export function defaultAcaoMult(entries, duracaoSpell) {
  let d = "reacao";
  for (const en of (Array.isArray(entries) ? entries : [])) {
    const a = resolverAcaoAux(en.efeito, duracaoSpell, "padrao");
    if (HIERARQUIA_ACAO[a] > HIERARQUIA_ACAO[d]) d = a;
  }
  return d;
}

// Ação aplicada no Múltiplos Efeitos: a escolha (f.acaoMult) ou o padrão, nunca
// abaixo do piso selecionável.
export function acaoAplicadaMult(feitico, duracaoSpell) {
  const floor = floorAcaoMult(feitico.efeitosMult, duracaoSpell);
  const escolha = (!feitico.acaoMult || feitico.acaoMult === "padrao")
    ? defaultAcaoMult(feitico.efeitosMult, duracaoSpell)
    : feitico.acaoMult;
  return HIERARQUIA_ACAO[escolha] < HIERARQUIA_ACAO[floor] ? floor : escolha;
}

// Uso da Concentração, já resolvido. Com ALCANCE PRÓPRIO o Feitiço não sai da
// própria criatura, então NÃO pode ter múltiplos alvos (autor): a Concentração
// perde a opção de mais alvos e só pode render o efeito extra.
export function usoConcentracaoAux(feitico) {
  const f = feitico || {};
  if (!f.concentracaoAux) return null;
  return f.alcancePropria ? "efeito" : (f.concUsoAux || "alvos");
}

// Múltiplos Efeitos NÃO repete efeito (autor): dois Aumentos de Defesa no mesmo
// Feitiço não existem. Não é aviso, é impossibilidade, então o seletor de um
// slot só oferece o que ainda não está no Feitiço (mais o do próprio slot).
export function efeitosDisponiveisMult(entries, efeitoAtual, umGolpe, ctx = {}) {
  const lista = Array.isArray(entries) ? entries : [];
  const usados = new Set(lista.map((en) => en.efeito));
  usados.delete(efeitoAtual);
  let livres = AUX_EFEITOS.filter((m) => !usados.has(m.value));
  if (umGolpe) {
    // Feitiço de evento único: só efeitos com evento, e do mesmo lado dos irmãos.
    const grupo = grupoEventoAux(lista.filter((en) => en.efeito !== efeitoAtual));
    livres = livres.filter((m) => m.evento && (!grupo || m.evento === "ambos" || m.evento === grupo));
  }
  // Sem coluna na duração do Feitiço (nem por descida), o efeito não entra.
  if (ctx.duracao) livres = livres.filter((m) => temColunaAux(m.value, ctx.nivel ?? 0, ctx.duracao));
  return livres;
}

// Lado do evento que um conjunto de efeitos já fixou. "ambos" (Rolagem,
// Prejuízo) não fixa nada, então uma lista só de coringas devolve null.
export function grupoEventoAux(entries) {
  for (const en of (Array.isArray(entries) ? entries : [])) {
    const ev = AUX_EFEITOS.find((m) => m.value === en.efeito)?.evento;
    if (ev === "ofensivo" || ev === "defensivo") return ev;
  }
  return null;
}

// O conjunto de efeitos aceita virar Feitiço de evento único? Todos precisam ter
// evento e não pode haver ofensivo e defensivo no mesmo Feitiço.
export function podeEventoUnico(entries) {
  const lista = Array.isArray(entries) ? entries : [];
  if (!lista.length) return false;
  const lados = new Set();
  for (const en of lista) {
    const ev = AUX_EFEITOS.find((m) => m.value === en.efeito)?.evento;
    if (!ev) return false;
    if (ev !== "ambos") lados.add(ev);
  }
  return lados.size <= 1;
}

// Efeito que um slot NOVO assume: o primeiro ainda livre. null quando acabaram.
export function primeiroEfeitoLivre(entries) {
  const usados = new Set((Array.isArray(entries) ? entries : []).map((en) => en.efeito));
  return AUX_EFEITOS.find((m) => !usados.has(m.value))?.value ?? null;
}

// Custo de um efeito dentro do orçamento de Múltiplos Efeitos. Nível 0 custa
// 1 PE (o livro força isso para não caber efeito de nível 0 infinito).
export function custoEfeitoMult(nivel) {
  const n = nivel === "max" ? 5 : nivel;
  return n === 0 ? 1 : custoPadrao(n);
}

// Feitiço múltiplo em Ação Completa quando é isso que o efeito de aumento de
// completa exige, ou quando o Feitiço é conjurado em completa por escolha.
export function usaCompletaTabelaMult(feitico) {
  return (Array.isArray(feitico.efeitosMult) ? feitico.efeitosMult : [])
    .some((en) => COMPLETA_TABELA.has(en.efeito));
}

// Orçamento de Múltiplos Efeitos = custo do Feitiço + PE dos ganhos:
//  - requisito (Fácil+2/Médio+4/Difícil+6/Impossível+10),
//  - alcance "própria" (+nível da técnica = nível do Feitiço),
//  - Ação Completa (+2×nível), quando o Feitiço é conjurado em completa e
//    nenhum efeito usa aumento próprio de ação completa (Rolagem/Ataque),
//  - concentração-efeito (custo de um efeito no nível do Feitiço).
export function orcamentoMultiplos(feitico) {
  const f = feitico || {};
  const nivel = f.nivel ?? 1;
  const n = nivel === "max" ? 5 : nivel;
  const req = f.requisito ? REQUISITO_DIFICULDADE.find((r) => r.value === f.requisito) : null;
  const base = custoPadrao(n);
  const peReq = req ? req.pe : 0;
  const pePropria = f.alcancePropria ? n : 0;
  const emCompleta = acaoAplicadaMult(f, f.duracaoMult || "imediata") === "completa";
  const peCompleta = (emCompleta && !usaCompletaTabelaMult(f)) ? 2 * n : 0;
  const peConcentracao = usoConcentracaoAux(f) === "efeito" ? custoEfeitoMult(nivel) : 0;
  return { base, peReq, pePropria, peCompleta, peConcentracao, total: base + peReq + pePropria + peCompleta + peConcentracao };
}

// ---- núcleo: computa UM efeito auxiliar ----
export function calcularEfeitoAux(e, ctx = {}) {
  const avisos = [];
  const notas = [];
  const nivel = e.nivel ?? 1;
  const nNum = nivel === "max" ? 6 : nivel;
  const efeitoKey = e.efeito || "defesa";
  const meta = AUX_EFEITOS.find((m) => m.value === efeitoKey);
  const duracao = e.duracao || "imediata";
  // Duração PEDIDA pelo Feitiço. No Múltiplos Efeitos um dano cai na coluna da
  // Sustentada (não tem Duradoura), mas o Feitiço continua sendo Duradouro, e aí
  // o valor da Sustentada segue as REGRAS da Duradoura: divide por rodadas
  // (autor). No efeito único não há fallback, então é a própria duração.
  const spellDur = e.duracaoSpell || duracao;
  // Divisor da Duradoura, medido pelo nível do FEITIÇO (não do efeito). Devolve
  // { rodadas, nDur, denom } ou null quando a duração pedida não é Duradoura.
  const divisorDuradoura = () => {
    if (spellDur !== "duradoura") return null;
    const nivelDur = e.nivelDuracao ?? nivel;
    const nDur = nivelDur === "max" ? 6 : nivelDur;
    const faixa = faixaRodadasDuradoura(nivelDur);
    const rodadas = Math.min(Math.max(e.rodadas | 0 || faixa.min, faixa.min), faixa.max);
    return { rodadas, nDur, denom: rodadas - Math.ceil(nDur / 2) };
  };
  const out = {
    disponivel: false, efeito: efeitoKey, efeitoLabel: meta?.label || efeitoKey,
    duracao, valor: null, especial: null, dado: null,
    unidade: meta?.unidade || "", rodadas: null, alvos: 1, notas, avisos,
  };
  if (!meta) { avisos.push(`Efeito auxiliar desconhecido: ${efeitoKey}.`); return out; }

  // Acesso: o nível não pode passar do máximo da faixa de ND.
  if (ctx.nd != null && nivel !== "max" && nivel > nivelMaxFeiticoDoContexto(ctx)) {
    avisos.push(`Nível ${nivel} inacessível: no ND ${ctx.nd} o máximo é ${nivelMaxFeiticoDoContexto(ctx)}.`);
  }

  const raw = AUX_TABELAS[efeitoKey]?.[nivel]?.[duracao];
  if (raw == null) {
    avisos.push(`${meta.label} não existe em ${NIVEL_LABEL[nivel]} / ${duracao}.`);
    return out;
  }
  out.disponivel = true;

  // Célula especial (string): passa direto, sem cálculo numérico. As especiais
  // que valem POR UM ATAQUE só aparecem com "Somente Um Ataque" marcado; sem a
  // marca elas viram o número da faixa e caem no cálculo normal (autor).
  // Ação efetiva.
  const acao = resolverAcaoAux(efeitoKey, duracao, e.acao);

  // Evento único: a marca do Feitiço, ou a Reação de Defesa e RD, que o livro
  // já descreve como "por um golpe". Não pode ser Concentrado (autor), e é este
  // flag que a concentração consulta.
  const umGolpe = aplicaUmGolpe(efeitoKey, nivel, duracao, acao, !!e.umGolpe);
  out.umGolpe = umGolpe;

  // Célula numérica que vira ESPECIAL no evento único (Margem de Crítico nv5).
  const especialGolpe = umGolpe ? especialComUmGolpe(efeitoKey, nivel, duracao) : null;
  if (especialGolpe) {
    out.especial = especialGolpe;
    out.alvos = 1;
    aplicarConcentracao(e, out, notas, nNum);
    return out;
  }

  let bruto = raw;
  if (typeof raw === "string") {
    const semGolpe = umGolpe ? null : valorSemUmGolpe(efeitoKey, nivel, duracao);
    if (semGolpe == null) {
      // Especial não é número, então NÃO se divide entre alvos: o seletor de
      // Alvos não vale aqui e múltiplos alvos só saem da Concentração, que soma
      // alvos sem dividir o valor (autor).
      out.especial = raw;
      out.alvos = 1;
      aplicarConcentracao(e, out, notas, nNum);
      return out;
    }
    bruto = semGolpe;
    notas.push(`Sem "um único ataque": ${raw} vale ${semGolpe}.`);
  }

  // ---- valor base pela duração ----
  // Alcance Próprio trava em 1 alvo (o Feitiço não sai da própria criatura).
  const alvosBase = e.propria ? 1 : Math.max(1, e.alvos | 0 || 1);
  // Dano adicional é [qtd, tipo]. Só tem Imediata/Sustentada (Duradoura null).
  if (meta.tipoValor === "dados") {
    let [qtd, tipo] = bruto;
    // Feitiço Duradouro: o dano usa o valor da Sustentada, mas dividido por
    // rodadas como toda Duradoura (autor). Divide a QUANTIDADE de dados, piso,
    // mínimo 1 dado, igual à divisão entre alvos.
    const divD = divisorDuradoura();
    if (divD && divD.denom >= 1) {
      const antes = qtd;
      qtd = Math.max(1, Math.floor(qtd / divD.denom));
      out.rodadas = divD.rodadas;
      notas.push(`Duradoura: ${antes}d${tipo} ÷ (${divD.rodadas} − ⌈${divD.nDur}/2⌉) = ${qtd}d${tipo} por ${divD.rodadas} rodada(s).`);
    }
    if (umGolpe) {
      // "usado para apenas um ataque, recebendo sua quantidade de dados dobrada".
      qtd = qtd * 2;
      notas.push("Um único ataque: dados dobrados.");
    }
    if (acao === "comum" || acao === "completa") {
      // "aumente os dados em uma quantidade igual ao nível dividido por 2".
      qtd += Math.floor(nNum / 2);
      notas.push("Ação comum: +⌊nível/2⌋ dados. Bônus de imediata indisponível.");
    }
    if (alvosBase > 1) { qtd = Math.max(1, Math.floor(qtd / alvosBase)); notas.push(`Dividido entre ${alvosBase} alvos.`); }
    // Explosão Extrema (Liberação Máxima), ponta dos DADOS. Nível e duração são
    // os do FEITIÇO (`e.liberacao` guarda o nível dele), e não os do efeito:
    // num Múltiplos Efeitos a Liberação foi declarada sobre o Feitiço inteiro.
    const dadosExplosao = explosaoDados(e.liberacao, e.liberacao?.nivel, efeitoKey, spellDur);
    if (dadosExplosao) {
      qtd += dadosExplosao;
      notas.push(`Explosão Extrema: +${dadosExplosao} dado(s).`);
    }
    out.dado = [qtd, tipo];
    out.valor = mediaDano(qtd, tipo);
    out.notacao = notacaoDano(qtd, tipo);
    out.alvos = alvosBase;
    aplicarConcentracao(e, out, notas, nNum);
    return out;
  }

  // Efeitos numéricos / métricos.
  let valor = bruto;
  // A divisão da Duradoura vale sempre que o FEITIÇO é Duradouro, medida pelo
  // nível dele (não do efeito): num Múltiplos Efeitos nv5 com efeitos nv4 e nv3,
  // a faixa e o divisor são os do nv5. Um efeito sem coluna Duradoura própria
  // (dano cai na Sustentada) também divide, porque o Feitiço segue Duradouro.
  // No efeito único não há fallback, então é a própria duração do efeito.
  const divN = divisorDuradoura();
  if (divN) {
    // A UI só oferece rodadas dentro da faixa. Um valor fora daqui é sempre
    // resíduo do padrão ou de troca de nível, então corrige em silêncio.
    //
    // ⚠ Passou a CHAMAR `valorDuradoura` em 2026-08-09. A conta estava
    // reescrita aqui, idêntica, e a função exportada era código MORTO (única
    // ocorrência dela em todo o `src/` era a própria declaração). Duas cópias
    // da mesma regra, e mexer na função canônica não mudaria nada.
    const vd = valorDuradoura(bruto, divN.nDur, divN.rodadas);
    valor = vd == null ? valor : vd;
    out.rodadas = divN.rodadas;
    notas.push(`Duradoura: ${bruto} ÷ (${divN.rodadas} − ⌈${divN.nDur}/2⌉) = ${valor} por ${divN.rodadas} rodada(s).`);
    // Efeito de nível baixo numa Duradoura longa some na divisão e ainda cobra
    // os PE dele. O zero não pode passar em silêncio.
    if (bruto !== 0 && valor === 0) {
      avisos.push(`${meta.label} de ${NIVEL_LABEL[nivel]} zera em ${divN.rodadas} rodadas.`);
    }
  }

  // Ajustes específicos de ação/variante por efeito.
  valor = ajusteAcaoAux(efeitoKey, valor, { acao, nivel: nNum, duracao, umGolpe, notas });

  // Tipos de dano extras (RD e Negação de RD): reduzem o valor.
  if (meta.multiTipo) {
    const extras = Math.max(0, e.tiposDanoExtra | 0);
    if (extras > 0) {
      const porTipo = efeitoKey === "negacaoRd" ? 4 : 2;   // Negação -4/tipo, RD -2/tipo
      const ajuste = extras * porTipo;
      // Ambos aproximam o valor de zero (RD é positivo, Negação é negativa).
      valor = valor >= 0 ? Math.max(0, valor - ajuste) : Math.min(0, valor + ajuste);
      notas.push(`+${extras} tipo(s) de dano: -${ajuste} no valor.`);
    }
  }

  // Divisão entre alvos (o bônus se divide). Piso.
  if (alvosBase > 1) {
    const antes = valor;
    const sinal = valor < 0 ? -1 : 1;
    valor = sinal * Math.floor(Math.abs(valor) / alvosBase);
    notas.push(`Dividido entre ${alvosBase} alvos.`);
    // O bônus se dilui a zero entre alvos demais e ainda cobra os PE: avisa.
    if (antes !== 0 && valor === 0) {
      avisos.push(`${meta.label} zera dividido entre ${alvosBase} alvos.`);
    }
  }
  // Liberação Máxima, ponta NUMÉRICA. Os dois Sets são disjuntos, então no
  // máximo um dos dois rende: Estímulo de Saída cuida dos bônus e penalidades,
  // Explosão Extrema cuida de Dano Fixo e Níveis de Dano.
  //
  // ⚠ Entra DEPOIS da divisão entre alvos, de propósito: a melhoria fala do
  // "valor do bônus", que é o número que cada alvo recebe. Dividi-la junto
  // faria a mesma Liberação valer menos em cada alvo quanto mais alvos houver,
  // e o texto não diz isso. ASSUNÇÃO, anotada em docs/a-fazer.md.
  const nLib = e.liberacao?.nivel;
  const bumpLib = estimuloBonus(e.liberacao, nLib, efeitoKey, spellDur)
    + explosaoValor(e.liberacao, nLib, efeitoKey, spellDur);
  if (bumpLib) {
    // `prejuizoRolagem` é guardado NEGATIVO, e "aumentar a penalidade" é
    // afastar de zero. Somar cru transformaria um −6 em −4.
    //
    // ⚠ O sinal sai do valor CRU da tabela (`bruto`), e não do `valor` já
    // processado. Um prejuízo que a divisão por rodadas ou por alvos tenha
    // levado a 0 perdeu o sinal, e somar nele viraria a penalidade em BÔNUS
    // para o inimigo.
    const negativo = bruto < 0;
    valor = negativo ? valor - bumpLib : valor + bumpLib;
    notas.push(`Liberação Máxima: ${negativo ? "−" : "+"}${bumpLib} no valor.`);
  }
  out.alvos = alvosBase;
  out.valor = valor;
  aplicarConcentracao(e, out, notas, nNum);
  return out;
}

// Wrapper de Feitiço: efeito único (Fase A/B) OU Múltiplos Efeitos (Fase C).
export function calcularFeiticoAuxiliar(feitico, ctx = {}) {
  const f = feitico || {};
  const nivel = f.nivel ?? 1;
  const nBase = nivel === "max" ? 5 : nivel;
  // Liberação Máxima do FEITIÇO. Ela desce em cada `e` porque `calcularEfeitoAux`
  // enxerga o efeito e não o Feitiço, e as duas melhorias do Manto que mexem em
  // valor (Estímulo de Saída e Explosão Extrema) são aplicadas lá dentro.
  const lib = resolveLiberacao(f, ctx);
  // Duração Prolongada: rodadas a mais na Duradoura. ⚠ Somadas DEPOIS, sobre o
  // resultado, para furarem o teto de (1 + nível) sem entrar no divisor do
  // valor. Se entrassem no divisor, a melhoria diluiria o bônus (autor).
  const rodadasLib = rodadasExtras(lib, nBase);
  const somarRodadas = (r) => {
    if (rodadasLib && r.rodadas) {
      r.rodadas += rodadasLib;
      r.notas.push(`Duração Prolongada: +${rodadasLib} rodada(s).`);
    }
    return r;
  };

  if (!f.multiplosAtivo) {
    const e = {
      efeito: f.efeitoAux || "defesa", nivel, duracao: f.duracaoAux || "imediata",
      acao: f.acaoAux, umGolpe: f.umGolpe, tiposDanoExtra: f.tiposDanoExtra,
      // Efeito único só tem a concentração de "mais alvos" (o efeito extra exige
      // Múltiplos Efeitos), então força concUso "alvos".
      alvos: f.alvosAux, propria: !!f.alcancePropria,
      concentracao: f.concentracaoAux, concUso: "alvos", rodadas: f.rodadasDur,
      liberacao: lib,
    };
    const r = somarRodadas(calcularEfeitoAux(e, ctx));
    r.multiplos = false;
    r.custoPE = custoPadrao(nBase);
    r.upkeepPE = e.duracao === "sustentada" ? upkeepSustentar(nivel) : 0;
    // ---- Liberação Máxima ----
    r.liberacao = lib;
    r.rodadasSemUpkeep = e.duracao === "sustentada" ? (rodadasSemUpkeep(lib, nBase) || null) : null;
    r.alvosExtras = alvosExtras(lib, nBase) || null;
    r.regrasLiberacao = regrasDaLiberacao(lib, f);
    r.avisos = [...r.avisos, ...(lib?.avisos ?? [])];
    return r;
  }

  // Múltiplos Efeitos. Duração, Ação e Alvos são do FEITIÇO INTEIRO (todos os
  // efeitos seguem): a duração é única (com fallback de coluna), a ação é a
  // maior e a quantidade de alvos é escolhida uma vez só (autor).
  const avisos = [];
  const entries = Array.isArray(f.efeitosMult) ? f.efeitosMult : [];
  const orc = orcamentoMultiplos(f);
  const duracaoSpell = f.duracaoMult || "imediata";
  const propria = !!f.alcancePropria;
  // Evento único é do FEITIÇO INTEIRO (autor): efeito de um golpe só se junta a
  // outro de um golpe, e todos do mesmo lado. Vale só na Imediata.
  const eventoUnico = !!f.umGolpe && duracaoSpell === "imediata";

  // Ação ÚNICA do Feitiço: o piso (a maior ação natural entre os efeitos) ou a
  // escolha do Feitiço (f.acaoMult), o que for maior. Todos seguem ela.
  const acaoAplicada = acaoAplicadaMult(f, duracaoSpell);

  // Efeito que resulta em célula ESPECIAL não se divide entre alvos. Como os
  // Alvos são do Feitiço inteiro, basta um especial para o Feitiço todo travar
  // em 1 alvo: múltiplos alvos só pela Concentração, que soma sem dividir.
  // A marca de evento é a RESOLVIDA (a Reação de Defesa e RD também conta), ou
  // um Feitiço em Reação mostraria um seletor de Alvos que o motor ignora.
  const alvosTravados = entries.some((en) => {
    const { col } = resolverColunaAux(en.efeito, en.nivel, duracaoSpell);
    return resultaEspecialAux(en.efeito, en.nivel, col,
      aplicaUmGolpe(en.efeito, en.nivel, col, acaoAplicada, eventoUnico));
  });
  const alvosSpell = (propria || alvosTravados) ? 1 : Math.max(1, f.alvosMult | 0 || 1);
  const acaoResultante = acaoAplicada;
  const acaoPiso = floorAcaoMult(entries, duracaoSpell);
  const acaoDefault = defaultAcaoMult(entries, duracaoSpell);

  // Múltiplos Efeitos NÃO aceita efeito repetido (autor): dois Aumentos de
  // Defesa no mesmo Feitiço não existem. Não é aviso, é impossibilidade, então
  // quem barra é a UI (o seletor não oferece efeito já usado no Feitiço).
  const efeitos = entries.map((en) => {
    const { col, semRounds } = resolverColunaAux(en.efeito, en.nivel, duracaoSpell);
    const e = {
      efeito: en.efeito, nivel: en.nivel, duracao: col, semRounds,
      acao: acaoAplicada, umGolpe: eventoUnico, tiposDanoExtra: en.tiposDanoExtra,
      alvos: alvosSpell, propria, rodadas: f.rodadasMult, nivelDuracao: nivel,
      duracaoSpell, liberacao: lib,
    };
    const r = somarRodadas(calcularEfeitoAux(e, ctx));
    r.id = en.id;
    r.timing = duracaoSpell;           // duração real do Feitiço (para exibir)
    r.custoMult = custoEfeitoMult(en.nivel);
    if ((en.nivel === "max" ? 5 : en.nivel) > nBase) {
      r.avisos.push(`Efeito de ${NIVEL_LABEL[en.nivel]} acima do Feitiço (${NIVEL_LABEL[nivel]}).`);
    }
    return r;
  });
  const gasto = efeitos.reduce((s, r) => s + (r.custoMult || 0), 0);
  const restante = orc.total - gasto;
  const excedeu = gasto > orc.total;
  if (excedeu) avisos.push(`Múltiplos Efeitos excede o orçamento: ${gasto} PE de ${orc.total}.`);
  if (entries.length < 2) avisos.push("Múltiplos Efeitos pede pelo menos 2 efeitos.");
  if (acaoAplicada === "completa" && usaCompletaTabelaMult(f)) {
    avisos.push("Ação Completa não rende PE porque um efeito já usa o aumento de Ação Completa.");
  }

  // Concentração (nível do Feitiço): +½ nível em alvos OU um efeito extra (este
  // entra no orçamento como peConcentracao, então aqui só a nota dos alvos).
  // Os alvos são do Feitiço inteiro, então o extra também.
  // Um Único Ataque não pode ser Concentrado (autor). A marca é do Feitiço, e
  // vale mesmo para os efeitos NATIVOS de evento (TR, CD, Rolagem, Prejuízo),
  // que não ganham bônus mas continuam sendo de um único evento.
  const notas = [];
  const concExtraAlvos = (usoConcentracaoAux(f) === "alvos" && !eventoUnico) ? Math.floor(nBase / 2) : 0;
  if (concExtraAlvos > 0) notas.push(`Concentração: +${concExtraAlvos} alvo(s) (metade do nível).`);

  return {
    multiplos: true, efeitos, orcamento: orc, gasto, restante, excedeu,
    acaoResultante, acaoPiso, acaoDefault, duracao: duracaoSpell,
    alvos: alvosSpell + concExtraAlvos, propria, alvosTravados,
    umGolpe: eventoUnico, grupoEvento: grupoEventoAux(entries),
    upkeepPE: duracaoSpell === "sustentada" ? upkeepSustentar(nivel) : 0,
    custoPE: custoPadrao(nBase),
    // ---- Liberação Máxima ----
    liberacao: lib,
    rodadasSemUpkeep: duracaoSpell === "sustentada" ? (rodadasSemUpkeep(lib, nBase) || null) : null,
    alvosExtras: alvosExtras(lib, nBase) || null,
    regrasLiberacao: regrasDaLiberacao(lib, f),
    avisos: [...avisos, ...(lib?.avisos ?? [])],
    notas,
  };
}

// Concentração: OU +⌊metade do nível⌋ em alvos, OU um efeito auxiliar
// adicional do mesmo nível (escolha, nunca os dois).
function aplicarConcentracao(e, out, notas, nNum) {
  if (!e.concentracao || e.concUso === "efeito") return;
  if (e.propria) return;                        // Alcance Próprio: 1 alvo, ponto
  if (out.umGolpe) return;                      // Um Único Ataque não concentra
  const extra = Math.floor(nNum / 2);
  if (extra <= 0) return;                       // nível 0/1 não rende alvo extra
  // Alvos extras da concentração recebem o mesmo valor (a divisão do bônus já
  // usou os alvos base), então somam ao total exibido.
  out.alvos = (out.alvos || 1) + extra;
  notas.push(`Concentração: +${extra} alvo(s) (metade do nível).`);
}

// Ajustes de valor por ação/variante, específicos de cada efeito auxiliar.
// Cada bloco cita a regra do livro. stepsAcimaDeBonus = quantos degraus de
// ação acima de "bônus" (bônus 0, comum 1, completa 2).
function ajusteAcaoAux(efeitoKey, valor, { acao, nivel, duracao, umGolpe, notas }) {
  const stepsAcimaBonus = Math.max(0, (ORDEM_ACAO[acao] ?? 0) - ORDEM_ACAO.bonus);
  switch (efeitoKey) {
    case "defesa":
      // Ação bônus: -⌊nível/2⌋. Evento único: ×1,5 (pela marca ou pela Reação).
      // O ajuste de ação entra primeiro, o multiplicador do evento depois.
      if (acao === "bonus") { valor -= Math.floor(nivel / 2); notas.push("Ação bônus: -⌊nível/2⌋ na Defesa."); }
      if (umGolpe) { valor = Math.floor(valor * 1.5); notas.push("Um único evento: Defesa ×1,5."); }
      return valor;
    case "rd":
      // Ação bônus: -nível na RD. Evento único: ×2 (pela marca ou pela Reação).
      if (acao === "bonus") { valor = Math.max(0, valor - nivel); notas.push("Ação bônus: -nível na RD."); }
      if (umGolpe) { valor *= 2; notas.push("Um único evento: RD ×2."); }
      return valor;
    case "tr":
      // Ação comum: +（nível − 1). A Completa dá o MESMO aumento da comum e ainda
      // rende os PE de Ação Completa (autor). Imediata é reação por padrão.
      if (acao === "comum" || acao === "completa") { valor += (nivel - 1); notas.push("Ação comum: +（nível − 1) no bônus."); }
      return valor;
    case "rolagem":
      // Para cada ação acima de bônus: +（nível − 1), mínimo 1.
      if (stepsAcimaBonus > 0) { valor += Math.max(1, nivel - 1) * stepsAcimaBonus; notas.push("Ação acima de bônus: +（nível − 1) por degrau (mín 1)."); }
      return valor;
    case "cd":
      // Ação comum: +（nível − 1) na CD. A Completa dá o MESMO aumento da comum e
      // ainda rende os PE de Ação Completa (autor).
      if (acao === "comum" || acao === "completa") { valor += (nivel - 1); notas.push("Ação comum: +（nível − 1) na CD."); }
      return valor;
    case "ataque":
      // Duradoura/Sustentada em comum/completa: +2 por degrau acima de bônus.
      // Imediata por um golpe: acerto ×1,5 (imediata não sobe de ação).
      if (duracao === "imediata") {
        if (umGolpe) { valor = Math.floor(valor * 1.5); notas.push("Um golpe: acerto ×1,5."); }
      } else if (stepsAcimaBonus > 0) { valor += 2 * stepsAcimaBonus; notas.push("Ação acima de bônus: +2 por degrau."); }
      return valor;
    case "danoFixo":
      // Um ataque: valor dobrado. Ação comum: +nível×2 (sem imediata).
      if (acao === "comum" || acao === "completa") { valor += nivel * 2; notas.push("Ação comum: +nível×2 no dano fixo. Sem bônus de imediata."); }
      else if (umGolpe) { valor *= 2; notas.push("Um ataque: dano fixo dobrado."); }
      return valor;
    case "niveisDano":
      // Um ataque: níveis ×1,5. Ação comum: +nível (sem imediata).
      if (acao === "comum" || acao === "completa") { valor += nivel; notas.push("Ação comum: +nível. Sem bônus de imediata."); }
      else if (umGolpe) { valor = Math.floor(valor * 1.5); notas.push("Um ataque: níveis ×1,5."); }
      return valor;
    case "margemCritico":
      // Um ataque: margem dobrada. Nível 5 e TM não chegam aqui: viram célula
      // especial (Crítico Garantido) antes do cálculo.
      if (umGolpe) { valor *= 2; notas.push("Um ataque: margem dobrada."); }
      return valor;
    case "negacaoRd":
      // Ação bônus: reduz a redução em nível (aproxima de zero).
      if (acao === "bonus") { valor = Math.min(0, valor + nivel); notas.push("Ação bônus: -nível na redução."); }
      return valor;
    default:
      return valor;
  }
}

// ---------------------------------------------------------------
// Fábrica de um Feitiço em branco (entrada nova na ficha). Nasce como
// Feitiço de Dano de Nível 1, alvo único por teste de resistência.
// ---------------------------------------------------------------
let _feiticoSeq = 0;
export function createBlankFeitico() {
  _feiticoSeq += 1;
  return {
    id: `feit_${Date.now().toString(36)}_${_feiticoSeq}`,
    nome: "",
    tipo: "dano",              // dano | nivel0 | auxiliar | curativo | especial | passivo
    nivel: 1,
    conjuracaoTexto: "",       // texto livre da conjuração (a seção geral virá depois)
    descricao: "",             // narrativa do Feitiço
    variacaoDe: null,          // id do Feitiço base, se for Variação de Liberação
    // --- campos de Feitiço de Dano ---
    resolucao: "tr",           // tr | ataque
    alvo: "unico",             // unico | area
    formaArea: "esfera",
    acao: "comum",             // bonus | comum | completa | ritual
    subtipo: "nenhum",         // nenhum | destrutivo | cataclismico | continuo | vampirico | multiplos
    trocas: { dados: 0, acerto: 0, cd: 0, alcance: 0, area: 0, empurraoDados: 0 },
    condicoes: [],             // [{ nome, forca }]
    sangramento: null,         // fraco | medio | forte | extremo
    requisito: null,           // facil | medio | dificil | impossivel
    focoCondicao: false,
    disparos: 2,               // Múltiplos Disparos
    continuoModo: "sustentado",
    ignorarResistencias: false,
    morteDireta: false,
    // --- campos de Feitiço Curativo ---
    remocao: "nenhuma",        // nenhuma | especificas | todasCondicoes | todosComplexos
    // --- campos de Feitiço Especial ---
    especialSubtipo: "golpeador",   // golpeador | danoAlma | itens | shikigami | transformacao | invisibilidade
    golpesGolpeador: 1,             // Golpeador: número de golpes (Nv3+)
    tecnicaInvisibilidade: false,   // Invisibilidade: a Técnica é diretamente invisibilidade (permite Nível 0)
    fraquezaInvis: "",              // Invisibilidade: forma de ser anulado (obrigatória no Nível 1 e 2)
    itemCusto: 1,                   // Itens: tier de Custo do item criado
    itemGrauTroca: 0,               // Itens: quantidade sacrificada para +Grau
    tecnicaFocoItens: false,        // Itens: Técnica focada em criação (cria um nível mais cedo)
    itemNatureza: "consumivel",     // Itens: consumivel | permanente
    itemDescricao: "",              // Itens: especificação dos itens criados
    shikigamiInvocacaoId: null,     // Shikigami: id da Invocação referenciada (aba Invocações)
    transfAcao: "comum",            // Transformação: comum | bonus | completa
    transfDuracao: "sustentada",    // Transformação: sustentada | duradoura | cena
    transfNivelTroca: 0,            // Transformação: trocas de efeito por +nível
    transfCustoVida: false,         // Transformação: troca sustentação de PE por PV
    transfEfeitos: [],              // Transformação: id de aux por slot
    // --- campos de Feitiço Auxiliar ---
    efeitoAux: "defesa",       // ver AUX_EFEITOS
    alvoAuxAtributo: "forca",  // destino do Aumento de Atributo
    alvoAuxTR: "reflexos",     // destino do Bônus em Teste de Resistência
    duracaoAux: "imediata",    // imediata | duradoura | sustentada
    rodadasDur: 1,             // rodadas da Duradoura (dentro da faixa do nível)
    alvosAux: 1,               // alvos afetados (divide o bônus se > 1; 1 se Próprio)
    concentracaoAux: false,
    concUsoAux: "alvos",       // alvos | efeito (escolha da concentração)
    acaoAux: "padrao",         // padrao | bonus | comum | completa | reacao
    umGolpe: false,            // variante imediata de um golpe/ataque
    tiposDanoExtra: 0,         // RD / Negação de RD: tipos de dano extras cobertos
    alcancePropria: false,     // alcance "própria" (gera +nível PE p/ Múltiplos Efeitos)
    // --- Múltiplos Efeitos (Fase C) ---
    multiplosAtivo: false,     // liga o modo Múltiplos Efeitos (lista de efeitos)
    duracaoMult: "imediata",   // duração ÚNICA do Feitiço (todos os efeitos seguem)
    rodadasMult: 1,            // rodadas da Duradoura no modo múltiplo
    acaoMult: "padrao",        // ação ÚNICA do Feitiço (padrao segue o piso dos efeitos)
    alvosMult: 1,              // alvos ÚNICOS do Feitiço (todos os efeitos seguem)
    efeitosMult: [],           // [createBlankAuxEffect()]
    // --- campos de Passivo / Característica ---
    efeitosPassivo: [],        // mesmo formato do Motor do Funcionamento Básico
    // --- campos de Feitiço Personalizado ---
    acaoPersonalizada: "",
    alcanceTexto: "",
    alvoTexto: "",
    duracaoTexto: "",
    resolucaoTexto: "",
    comCd: true,
    rolagens: [],
  };
}

// Fábrica de um efeito auxiliar dentro de Múltiplos Efeitos.
let _auxSeq = 0;
export function createBlankAuxEffect(nivel = 1) {
  _auxSeq += 1;
  return {
    id: `aux_${Date.now().toString(36)}_${_auxSeq}`,
    efeito: "defesa",
    nivel,
    duracao: "imediata",
    alvoAuxAtributo: "forca",
    alvoAuxTR: "reflexos",
    acao: "padrao",
    umGolpe: false,
    tiposDanoExtra: 0,
    alvos: 1,
    rodadas: 1,
  };
}

// ---------------------------------------------------------------
// VALIDADOR de conteúdo (roadmap): confere a coerência das tabelas.
// Não valida Feitiços de ficha (esses são criados livremente).
// ---------------------------------------------------------------
export function validarConteudoFeiticos() {
  const erros = [];
  // Toda linha de dano deve ter [qtd>0, tipo válido].
  const tiposValidos = new Set([4, 6, 8, 10, 12, 20]);
  for (const [nome, tab] of Object.entries({ DANO_UNICO_TR, DANO_UNICO_ATAQUE, DANO_AREA_TR })) {
    for (const [k, v] of Object.entries(tab)) {
      if (!Array.isArray(v) || v.length !== 2) { erros.push(`${nome}[${k}] malformado`); continue; }
      if (!(v[0] > 0)) erros.push(`${nome}[${k}] quantidade inválida`);
      if (!tiposValidos.has(v[1])) erros.push(`${nome}[${k}] tipo de dado inválido: d${v[1]}`);
    }
  }
  // Custo definido para todos os níveis.
  for (const n of FEITICO_NIVEIS) {
    if (FEITICO_CUSTO_PE[n] == null) erros.push(`Custo faltando para o nível ${n}`);
  }
  // Cada força de condição tem redução e catálogo.
  for (const forca of ["fraca", "media", "forte", "extrema"]) {
    if (CONDICAO_REDUCAO[forca] == null) erros.push(`Redução faltando para condição ${forca}`);
    if (!CONDICOES_CATALOGO[forca]?.length) erros.push(`Catálogo vazio para condição ${forca}`);
  }
  return erros;
}

// ---------------------------------------------------------------
// RESUMO da ficha: uma linha pronta por Feitiço criado.
// ---------------------------------------------------------------
/**
 * Texto curto do valor de um Feitiço Auxiliar (cabeçalho, tiles e Preview).
 *
 * ⚠ Morava no AftyCreatureBuilder.jsx e subiu para cá em 2026-08-03, quando o
 * Preview passou a listar os Feitiços: o resumo é computado no motor, e uma
 * cópia do formatador na UI faria os dois lugares divergirem na primeira
 * errata.
 */
export function formatAuxValor(calc) {
  if (!calc) return "-";
  if (calc.multiplos) return `${calc.efeitos.length} Efeito${calc.efeitos.length === 1 ? "" : "s"}`;
  if (!calc.disponivel) return "-";
  if (calc.especial) return calc.especial;
  if (calc.dado) return calc.notacao;
  if (calc.valor == null) return "-";
  const sinal = calc.valor > 0 ? "+" : "";
  const num = String(calc.valor).replace(".", ",");
  return `${sinal}${num}${calc.unidade ? ` ${calc.unidade}` : ""}`;
}

/** O calculador daquele tipo de Feitiço, ou null quando o tipo não computa. */
function calculadorDe(tipo) {
  if (tipo === "dano") return calcularFeiticoDano;
  if (tipo === "auxiliar") return calcularFeiticoAuxiliar;
  if (tipo === "curativo") return calcularFeiticoCurativo;
  if (tipo === "especial") return calcularFeiticoEspecial;
  if (tipo === "personalizado") return calcularFeiticoPersonalizado;
  // "passivo" está no schema desde sempre e nunca foi desenvolvido.
  return null;
}

/**
 * AS ROLAGENS de um Feitiço, estruturadas: `{ rotulo, dados, faces, tom, vezes }`.
 *
 * ⚠ Existe porque o `valor` do resumo é TEXTO PRONTO PARA EXIBIR ("8d6", "3×
 * 4d8", "Somente Condição"), e a Ficha Final precisa rolar. Ler os dados de
 * volta de uma string seria desfazer trabalho que o motor já fez, e quebraria no
 * primeiro formato novo. Os números daqui vêm dos mesmos campos que a notação.
 *
 * É uma LISTA porque um Feitiço pode ter mais de uma rolagem de verdade: o
 * contínuo tem o golpe inicial e o dano por rodada, e os dois são rolados em
 * momentos diferentes da mesma luta.
 *
 * `vezes` é quantas vezes AQUELA rolagem acontece (disparos, golpes). Ela não
 * multiplica os dados: cada disparo é uma rolagem separada, com acerto próprio.
 */
export function rolagensDoFeitico(f, calc) {
  if (!calc || !f) return [];

  if (f.tipo === "personalizado") {
    return (Array.isArray(f.rolagens) ? f.rolagens : [])
      .map((rolagem) => ({
        rotulo: String(rolagem?.rotulo ?? "Rolagem").trim() || "Rolagem",
        dados: Math.trunc(Number(rolagem?.dados) || 0),
        faces: Math.trunc(Number(rolagem?.faces) || 0),
        fixo: Math.trunc(Number(rolagem?.fixo) || 0),
        tom: rolagem?.tom === "cura" ? "cura" : "dano",
        vezes: Math.max(1, Math.trunc(Number(rolagem?.vezes) || 1)),
      }))
      .filter((rolagem) => rolagem.dados > 0 && rolagem.faces > 1);
  }

  // O Auxiliar guarda os dados em `dado` ([qtd, faces]) e não em `dados`,
  // porque lá o dano é um efeito entre muitos e não o valor do Feitiço.
  if (f.tipo === "auxiliar") {
    // Múltiplos Efeitos não tem UMA rolagem: cada efeito é o seu.
    if (calc.multiplos || !Array.isArray(calc.dado)) return [];
    const [qtd, faces] = calc.dado;
    return qtd > 0 && faces > 1 ? [{ rotulo: "Dano", dados: qtd, faces, tom: "dano", vezes: 1 }] : [];
  }

  const faces = Math.trunc(calc.tipoDado) || 0;
  const dados = Math.trunc(calc.dados) || 0;
  if (faces < 2 || dados < 1) return [];

  if (f.tipo === "curativo") {
    return [{
      rotulo: calc.ehTemporario ? "PV Temporário" : "Cura", dados, faces, tom: "cura", vezes: 1,
      // Vigor Absoluto é parcela fixa somada ao total curado. O painel de
      // rolagem já sabe somar `fixo`, é o mesmo campo do dano.
      fixo: calc.bonusCura || 0,
      partes: calc.bonusCura ? [{ label: "Vigor Absoluto", valor: calc.bonusCura }] : [],
    }];
  }

  if (f.tipo === "dano") {
    // ⚠ "Somente Condição" não rola dano nenhum: o Feitiço trocou o dano inteiro
    // pela condição, e oferecer o botão seria mentir sobre o que ele faz.
    if (f.focoCondicao) return [];
    if (calc.disparos) {
      const d = calc.disparos;
      if (d.bonusRitualDano > 0 && d.disparos > 1) {
        const partesSemRitual = (calc.partesDano || []).filter((p) => p.label !== "Aumento de Dano");
        return [
          {
            rotulo: "Primeiro Disparo", dados: d.porDisparo, faces,
            fixo: (d.bonusPorDisparo || 0) + d.bonusRitualDano,
            partes: calc.partesDano || [], tom: "dano", vezes: 1, explosiva: !!calc.explosiva,
          },
          {
            rotulo: "Disparos Restantes", dados: d.porDisparo, faces,
            fixo: d.bonusPorDisparo || 0, partes: partesSemRitual,
            tom: "dano", vezes: d.disparos - 1, explosiva: !!calc.explosiva,
          },
        ];
      }
      return [{
        rotulo: "Disparo", dados: d.porDisparo, faces, fixo: calc.bonusDano || 0,
        partes: calc.partesDano || [], tom: "dano", vezes: d.disparos, explosiva: !!calc.explosiva,
      }];
    }
    if (calc.contDadosPorRodada > 0) {
      return [
        {
          rotulo: "Golpe Inicial", dados, faces, fixo: calc.bonusDano || 0,
          partes: calc.partesDano || [], tom: "dano", vezes: 1, explosiva: !!calc.explosiva,
        },
        { rotulo: "Por Rodada", dados: calc.contDadosPorRodada, faces, fixo: 0, partes: [], tom: "dano", vezes: 1, explosiva: !!calc.explosiva },
      ];
    }
    return [{
      rotulo: "Dano", dados, faces, fixo: calc.bonusDano || 0,
      partes: calc.partesDano || [], tom: "dano", vezes: 1, explosiva: !!calc.explosiva,
    }];
  }

  if (f.tipo === "especial") {
    // Os quatro subtipos sem dano (Invisibilidade, Itens, Transformação e
    // Shikigami) não devolvem `dados`, então já caíram fora lá em cima.
    if (calc.golpes) {
      const g = calc.golpes;
      return [{ rotulo: "Golpe", dados: g.porGolpe, faces, tom: "dano", vezes: g.golpes }];
    }
    return [{ rotulo: "Dano", dados, faces, tom: "dano", vezes: 1 }];
  }

  return [];
}

const ACAO_RESUMO_LABEL = {
  bonus: "Ação Bônus",
  comum: "Ação Comum",
  completa: "Ação Completa",
  ritual: "Ritual Estendido",
  reacao: "Reação",
  livre: "Ação Livre",
};

const DURACAO_RESUMO_LABEL = {
  imediata: "Instantânea",
  duradoura: "Duradoura",
  sustentada: "Sustentada",
  concentrado: "Concentração",
  cena: "Cena",
};

const FORMA_AREA_RESUMO_LABEL = {
  esfera: "Esfera",
  linha: "Linha",
  cone: "Cone",
};

const FORCA_CONDICAO_RESUMO_LABEL = {
  fraca: "Fraca",
  media: "Média",
  forte: "Forte",
  extrema: "Extrema",
};

const numeroResumo = (valor) => String(valor).replace(".", ",");
const metrosResumo = (valor) => `${numeroResumo(valor)} metros`;

function chaveAcaoResumo(valor) {
  const texto = String(valor || "").trim().toLowerCase();
  if (!texto) return null;
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^acao\s+/, "");
}

function acaoResumoFeitico(f, calc) {
  let valor = calc?.ritual?.acaoFinal ?? calc?.acaoResultante ?? calc?.acao ?? null;
  if (!valor && f.tipo === "auxiliar" && !f.multiplosAtivo) {
    valor = resolverAcaoAux(f.efeitoAux || "defesa", f.duracaoAux || "imediata", f.acaoAux);
  }
  if (!valor) valor = f.acao ?? f.transfAcao ?? null;
  if (!valor) return null;
  return ACAO_RESUMO_LABEL[chaveAcaoResumo(valor)] ?? String(valor);
}

function duracaoResumoFeitico(f, calc) {
  const continuo = calc?.detalhes?.continuo;
  if (continuo) return DURACAO_RESUMO_LABEL[continuo.modo] ?? continuo.modo;

  const duracao = calc?.duracao
    ?? (f.tipo === "auxiliar" ? (f.multiplosAtivo ? f.duracaoMult : f.duracaoAux) : null);
  if (duracao === "duradoura") {
    const rodadas = calc?.duracaoRodadas
      ?? calc?.rodadas
      ?? calc?.efeitos?.find((efeito) => efeito?.rodadas != null)?.rodadas
      ?? (f.multiplosAtivo ? f.rodadasMult : f.rodadasDur);
    return rodadas ? `${rodadas} rodada${rodadas === 1 ? "" : "s"}` : "Duradoura";
  }
  if (duracao) return DURACAO_RESUMO_LABEL[duracao] ?? String(duracao);
  if (calc?.sustentado) return "Sustentada";
  if (["dano", "curativo"].includes(f.tipo)) return "Instantânea";
  if (f.tipo === "especial" && ["golpeador", "danoAlma"].includes(f.especialSubtipo)) {
    return "Instantânea";
  }
  return null;
}

function alvoResumoFeitico(f, calc) {
  if (f.tipo === "personalizado") return calc?.alvoTexto ?? null;
  if (["dano", "curativo"].includes(f.tipo)) {
    const emArea = f.alvo === "area" || ["destrutivo", "cataclismico"].includes(f.subtipo);
    return emArea ? "Múltiplos" : "Único";
  }
  if (f.tipo !== "auxiliar") return null;
  if (calc?.propria) return "Próprio";
  const alvos = Math.max(1, Number(calc?.alvos) || 1);
  return `${alvos} criatura${alvos === 1 ? "" : "s"}`;
}

function areaResumoFeitico(calc) {
  if (calc?.detalhes?.areaMapa) return "Mapa inteiro";
  if (calc?.area == null) return null;
  const forma = FORMA_AREA_RESUMO_LABEL[calc.forma] ?? "Área";
  return `${forma} de ${metrosResumo(calc.area)}`;
}

function condicoesResumoFeitico(f, calc) {
  const condicoes = Array.isArray(f.condicoes) ? f.condicoes : [];
  // ⚠ No CURATIVO estas condições são as que ele REMOVE (autor, 2026-08-09), e
  // removida não tem duração: só a força faz sentido ali.
  const aplica = f.tipo !== "curativo";
  const textos = condicoes.map((condicao) => {
    const nome = condicao?.nome || "Condição";
    const forca = FORCA_CONDICAO_RESUMO_LABEL[condicao?.forca];
    if (!aplica) return forca ? `${nome} (${forca})` : nome;
    // A duração da condição APLICADA, com as rodadas que a Duração Prolongada
    // (Liberação Máxima) somou. "cena" não é número e não recebe soma: já dura
    // até o alvo passar na CD.
    const base = CONDICAO_DURACAO[f.nivel]?.[condicao?.forca];
    const rodadas = (typeof base === "number" && calc?.rodadasExtras)
      ? base + calc.rodadasExtras
      : base;
    const dur = rodadas === "cena" ? "cena"
      : typeof rodadas === "number" ? `${rodadas} rodada${rodadas === 1 ? "" : "s"}`
      : null;
    const partes = [forca, dur].filter(Boolean).join(", ");
    return partes ? `${nome} (${partes})` : nome;
  });
  if (f.sangramento) textos.push("Sangramento");
  return textos.length > 0 ? textos.join(", ") : null;
}

/* As linhas que a Liberação Máxima acrescenta. Só existem quando ela foi
   declarada naquele uso, e por isso não entram na lista fixa de propriedades. */
function liberacaoResumoFeitico(calc) {
  const lib = calc?.liberacao;
  if (!lib) return [];
  return [
    /* ⚠ NÃO entram aqui o custo em PE nem a lista de melhorias (2026-08-10). O
       custo já está no cabeçalho do cartão e no resumo do controle, e as
       melhorias já estão acesas nas pastilhas logo abaixo. Repetir os dois em
       forma de propriedade fazia a mesma informação aparecer três vezes na
       mesma tela, e a coluna de propriedades é para o que o Feitiço FAZ.

       O que sobra aqui é justamente o que a Liberação acrescenta e não cabia em
       nenhuma propriedade existente. */
    { id: "ignoraRd", nome: "Ignora RD", valor: calc.ignoraRd ? String(calc.ignoraRd) : null },
    { id: "alvosExtras", nome: "Alvos Extras", valor: calc.alvosExtras ? `+${calc.alvosExtras}` : null },
    { id: "semUpkeep", nome: "Sem Upkeep", valor: calc.rodadasSemUpkeep
      ? `${calc.rodadasSemUpkeep} rodada${calc.rodadasSemUpkeep === 1 ? "" : "s"}`
      : null },
    ...(calc.regrasLiberacao ?? []).map((regra, i) => ({
      id: `liberacaoRegra${i}`, nome: "Regra", valor: regra,
    })),
  ].filter((p) => p.valor != null && p.valor !== "");
}

function propriedadesResumoFeitico(f, calc, valor, valorLabel) {
  // ⚠ Alcance 0 é TOQUE, e não "0 metros" (2026-08-10). O número cru fazia a
  // Ficha imprimir "Alcance: 0 metros" numa mordida corpo-a-corpo, que lê como
  // Feitiço sem alcance nenhum em vez de Feitiço que precisa encostar.
  const alcance = calc?.alcanceTexto
    ?? (calc?.alcance === 0 ? "Toque" : calc?.alcance != null ? metrosResumo(calc.alcance) : null);
  const area = areaResumoFeitico(calc);
  const acerto = Number(calc?.acertoDelta) || 0;
  const propriedades = [
    { id: "conjuracao", nome: "Conjuração", valor: acaoResumoFeitico(f, calc) },
    { id: "alcance", nome: "Alcance", valor: alcance },
    { id: "alvo", nome: "Alvo", valor: alvoResumoFeitico(f, calc) },
    { id: "area", nome: "Área", valor: area },
    { id: "duracao", nome: "Duração", valor: duracaoResumoFeitico(f, calc) },
    // ⚠ A resolução EFETIVA, e não o campo cru (2026-08-09). O Destrutivo e o
    // Cataclísmico são sempre teste de resistência por regra, e o motor os
    // converte mesmo com a ficha marcada como ataque. Lendo `f.resolucao`, a
    // Ficha imprimia "Jogada de Ataque" para um Ritual Estendido de TR.
    { id: "resolucao", nome: "Resolução", valor: (calc?.resolucao ?? f.resolucao) === "ataque"
      ? "Jogada de Ataque"
      : f.tipo === "dano" ? "Teste de Resistência"
      : f.tipo === "personalizado" ? calc?.resolucaoTexto
      : null },
    { id: "cd", nome: "CD", valor: calc?.cd != null ? String(calc.cd) : null },
    { id: "acerto", nome: "Acerto", valor: acerto ? `${acerto > 0 ? "+" : ""}${acerto}` : null },
    { id: "ignoraRD", nome: "Ignora RD", valor: calc?.ignoraRD > 0 ? String(calc.ignoraRD) : null },
    { id: "removeResistencia", nome: "Resistência", valor: calc?.removeResistencia ? "Removida" : null },
    { id: "valor", nome: valorLabel, valor: valor },
    // ⚠ No CURATIVO a lista de condições é o que ele REMOVE, e não o que ele
    // aplica (autor, 2026-08-09). Só o rótulo muda, mas "Condições: Atordoado"
    // numa cura se lê como se ela atordoasse o alvo.
    { id: "condicoes", nome: f.tipo === "curativo" ? "Remove" : "Condições",
      valor: condicoesResumoFeitico(f, calc) },
    { id: "empurrao", nome: "Empurrão", valor: calc?.empurraoMetros > 0
      ? metrosResumo(calc.empurraoMetros)
      : null },
    { id: "alvosProtegidos", nome: "Alvos Protegidos", valor: calc?.detalhes?.ajusteAlvos > 0
      ? String(calc.detalhes.ajusteAlvos)
      : null },
    { id: "sustentacao", nome: "Sustentação", valor: calc?.detalhes?.continuo?.custoSustentacao > 0
      ? `${calc.detalhes.continuo.custoSustentacao} PE`
      : null },
    // ⚠ O upkeep do AUXILIAR e o da TRANSFORMAÇÃO (2026-08-09). O da linha
    // acima é só do Dano Contínuo, e sem estas duas um Auxiliar Sustentado e uma
    // Transformação Sustentada não mostravam o custo por rodada em lugar nenhum
    // da Ficha, embora os dois calculadores já o produzissem.
    { id: "upkeep", nome: "Upkeep", valor: calc?.upkeepPE > 0
      ? `${calc.upkeepPE} PE por rodada`
      : calc?.sustentacaoPE > 0 ? `${calc.sustentacaoPE} PE por rodada`
      : calc?.sustentacaoVida > 0 ? `${calc.sustentacaoVida} PV por rodada`
      : null },
    { id: "exaustao", nome: "Exaustão", valor: calc?.notaExaustao || null },
    /* ⚠ O SHIKIGAMI só mostrava "Shikigami Grau Especial" e mais nada na Ficha
       (2026-08-16). Faltavam as duas coisas que a mesa precisa: QUAL invocação
       ele conjura, que é uma criatura inteira montada noutra aba, e a redução
       PERMANENTE de PE, que o jogador tem de lembrar em toda conta de energia. */
    // `refNome` é "" numa invocação sem nome, e o filtro do fim descartaria a
    // linha inteira. Quem decide se há referência é o id, não o nome.
    { id: "shikigami", nome: "Invocação",
      valor: f.especialSubtipo === "shikigami" && calc?.invocacaoId
        ? (calc.refNome || "Sem Nome")
        : null },
    { id: "shikigamiReducao", nome: "Redução de PE",
      valor: f.especialSubtipo === "shikigami" && calc?.reducaoPE > 0
        ? `${calc.reducaoPE} PE`
        : null },
    ...liberacaoResumoFeitico(calc),
  ];
  return propriedades.filter((propriedade) => propriedade.valor != null && propriedade.valor !== "");
}

/**
 * Uma linha pronta por Feitiço da ficha, para o Preview exibir sem recalcular
 * (mesma convenção do `resumoDominios` em afty-derive.js).
 *
 * ⚠ As VARIAÇÕES de liberação entram na lista, mas marcadas: elas não gastam
 * vaga (`feitico.variacaoDe` é o que o contador da aba já isenta), e escondê-las
 * faria o Preview mostrar menos Feitiços do que a aba Habilidades.
 */
export function resumoFeiticos(creature, ctx = {}) {
  const lista = Array.isArray(creature?.feiticos) ? creature.feiticos : [];
  return lista.map((f) => linhaDoFeitico(f, ctx, creature));
}

/**
 * A mesma linha, de UM Feitiço só, pelo id.
 *
 * ⚠ Existe por causa da Liberação Máxima: ela é escolhida na HORA DA
 * CONJURAÇÃO, e por isso não cabe na lista pré-calculada do `deriveAfty`. A
 * Ficha pede aqui a versão liberada do Feitiço que o jogador acabou de
 * declarar, em vez de recalcular a regra por conta própria.
 */
export function resumoDeUmFeitico(creature, id, ctx = {}) {
  const lista = Array.isArray(creature?.feiticos) ? creature.feiticos : [];
  const f = lista.find((x) => x.id === id);
  return f ? linhaDoFeitico(f, ctx, creature) : null;
}

/**
 * O que o jogador PODE declarar de Liberação Máxima neste Feitiço. `null`
 * quando ele não alcança a mecânica, e aí a Ficha não mostra controle nenhum.
 */
function infoLiberacao(f, ctx) {
  if (!nivelTemLiberacao(f.nivel)) return null;
  if (categoriasDoFeitico(f).length === 0) return null;
  if ((ctx.nd ?? 0) < LIBERACAO_ND_MINIMO) return null;
  const melhorias = melhoriasDoFeitico(f);
  return {
    custoPE: custoLiberacao(f.nivel),
    max: maxMelhorias(ctx.nd ?? 0),
    // Só as categorias que este Feitiço alcança, e só com melhoria dentro.
    categorias: LIBERACAO_CATEGORIAS
      .map((c) => ({ ...c, melhorias: melhorias.filter((m) => m.categoria === c.value && m.disponivel) }))
      .filter((c) => c.melhorias.length > 0),
  };
}

/* O corpo de UMA linha. ⚠ Virou função nomeada em 2026-08-10, quando a
   Conjuração em Ritual e a Liberação Máxima se encontraram: o Ritual precisa da
   lista inteira e a Liberação precisa refazer UM Feitiço com as melhorias
   declaradas na mesa, e as duas têm que sair exatamente do mesmo lugar. */
function linhaDoFeitico(f, ctx, creature) {
  {
    // As reduções de custo olham o repertório INTEIRO da criatura, então a
    // lista desce junto com o Feitiço da vez.
    const lista = Array.isArray(creature?.feiticos) ? creature.feiticos : [];
    const configRitual = ctx.rituais?.[f.id] ?? null;
    const temRitualista = (ctx.habilidades ?? []).includes("cnj_ritualista");
    const ritualAtual = ctx.ritualAtual?.feiticoId === f.id ? ctx.ritualAtual : null;
    const ritualEmOutroFeitico = !!ctx.ritualAtual?.feiticoId && !ritualAtual;
    const ritualistaDoUsoAtual = !!ritualAtual?.usaRitualista;
    const ritualistaExtra = temRitualista && (
      ritualistaDoUsoAtual
      || (
        !!configRitual?.extraRitualista
        && (ctx.usosRitualista ?? 0) < (ctx.limiteRitualista ?? 0)
      )
    );
    const ritualBloqueado = ritualEmOutroFeitico;
    const dispensaTesteRitual = ctx.rituaisSemTeste === true
      || ctx.rituaisSemTeste?.[f.id] === true;
    const calculoBase = calculadorDe(f.tipo)?.(f, {
      ...ctx,
      ritual: configRitual,
      ritualistaExtra,
      dispensaTesteRitual,
    }) ?? null;
    let calc = aplicaReducoesCustoFeitico(f, calculoBase, {
      ...ctx,
      feiticos: lista,
      reducoesCustoFeitico: creature?.reducoesCustoFeitico,
    });
    const reducaoSustentacao = Math.max(0, Math.trunc(Number(ctx.reducaoSustentacao) || 0));
    if (calc && reducaoSustentacao > 0) {
      const reduz = (valor) => (valor > 0 ? Math.max(1, valor - reducaoSustentacao) : valor);
      calc = {
        ...calc,
        upkeepPE: reduz(calc.upkeepPE),
        sustentacaoPE: reduz(calc.sustentacaoPE),
        detalhes: calc.detalhes?.continuo ? {
          ...calc.detalhes,
          continuo: {
            ...calc.detalhes.continuo,
            custoSustentacao: reduz(calc.detalhes.continuo.custoSustentacao),
          },
        } : calc.detalhes,
      };
    }
    const avisos = calc
      ? [...(calc.avisos || []), ...((calc.efeitos || []).flatMap((e) => e.avisos || []))]
      : [];
    const valor = !calc ? null
      : f.tipo === "dano" ? calc.dano
      : f.tipo === "auxiliar" ? formatAuxValor(calc)
      : f.tipo === "curativo" ? calc.cura
      : f.tipo === "especial" ? (calc.dano ?? calc.resumo)
      : null;
    const valorLabel = f.tipo === "dano" ? "Dano"
      : f.tipo === "curativo" ? (calc?.ehTemporario ? "PV Temporário" : "Cura")
      : f.tipo === "especial" && ["golpeador", "danoAlma"].includes(f.especialSubtipo) ? "Dano"
      : "Efeito";
    const rolagens = rolagensDoFeitico(f, calc);
    const etapaRitual = ritualAtual?.etapa ?? null;
    const ritualPronto = etapaRitual === "pronto";
    const ritualResolvido = etapaRitual === "resolvido";
    const consomeEstado = ctx.combate?.potenciaConcentrada
      && (ctx.habilidades ?? []).includes("cnj_potencia_concentrada")
      && f.tipo === "dano"
      && f.alvo === "unico"
      && rolagens.length > 0
      ? "potenciaConcentrada"
      : null;
    return {
      id: f.id,
      nome: f.nome || "",
      tipo: f.tipo,
      nivel: f.nivel,
      nivelLabel: NIVEL_LABEL[f.nivel] ?? String(f.nivel),
      // ⚠ O custo da Liberação Máxima SUBSTITUI o do Feitiço (autor), então ele
      // toma o lugar aqui em vez de virar uma segunda linha. Ver dois números de
      // PE na mesma linha seria pior que ver o certo sozinho. O `custoPEBase`
      // logo abaixo continua sendo o do Feitiço, para as reduções de custo do
      // Ritual seguirem mostrando de onde saíram.
      custoPE: calc?.liberacao?.custoPE ?? calc?.custoPE ?? null,
      custoPEBase: calc?.custoPEBase ?? calc?.custoPE ?? null,
      reducoesCustoPE: calc?.reducoesCustoPE ?? [],
      valor: valor ?? null,
      descricao: f.descricao || "",
      conjuracaoTexto: f.conjuracaoTexto || "",
      // O rótulo do valor muda com o tipo, e o Preview o usa como `title`.
      valorLabel,
      propriedades: calc ? propriedadesResumoFeitico(f, calc, valor, valorLabel) : [],
      variacao: !!f.variacaoDe,
      // O menu de Liberação Máxima deste Feitiço: o que dá para escolher na
      // hora da conjuração. `null` quando ele não alcança a mecânica.
      liberacao: infoLiberacao(f, ctx),
      consomeEstado,
      ritual: calc?.ritual ? {
        ...calc.ritual,
        temRitualista,
        extraRitualista: ritualistaExtra,
        extraRitualistaSolicitado: !!configRitual?.extraRitualista,
        usosRitualista: Math.max(0, ctx.usosRitualista ?? 0),
        limiteRitualista: Math.max(0, ctx.limiteRitualista ?? 0),
        bloqueado: ritualBloqueado,
        etapa: etapaRitual,
        emAndamento: !!ritualAtual,
        configuracaoTravada: !!ritualAtual,
        podeIniciar: !ritualBloqueado && !ritualAtual && !calc.ritual.excedeu,
        podeResolver: ritualPronto && !calc.ritual.excedeu,
        podeRolarFeitico: ritualPronto || ritualResolvido,
        resolvido: ritualResolvido,
      } : null,
      // O que a Ficha rola. Vazio quando não há dado nenhum a rolar, e é o que a
      // linha consulta para decidir se o número é clicável.
      rolagens,
      avisos,
    };
  }
}
