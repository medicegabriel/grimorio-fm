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
 *   - Nível máximo acessível pela faixa de ND (bônus de treinamento).
 *   - Custo padrão por nível, com piso de 1 PE (salvo nível 0).
 *   - CD da técnica: derived.cd (já usa o Atributo Principal da
 *     Técnica = core.tecnicaAttr e a Maestria). A criação só
 *     desloca com cdDelta, limitado a 1 + nível.
 *
 * ⚠ Regras VERBATIM do livro. Números não parafraseados.
 * ⚠ Arredondamento = piso (floor), salvo o texto dizer o contrário.
 *
 * Este passo cobre os FEITIÇOS DE DANO. Auxiliares, Curativos,
 * Especiais e Passivos entram nos próximos incrementos.
 * ============================================================
 */

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
// livro não vai além). Devolve o MAIOR nível de Feitiço acessível.
// ---------------------------------------------------------------
export function nivelMaxFeitico(nd) {
  const n = Math.max(1, nd | 0);
  if (n >= 17) return 5;
  if (n >= 13) return 4;
  if (n >= 9) return 3;
  if (n >= 5) return 2;
  return 1;
}

// ---------------------------------------------------------------
// ORÇAMENTO de Feitiços (quantos a criatura pode ter).
// "inicia com dois Feitiços" + "um novo Feitiço em todo nível par"
// + "um Feitiço adicional no nível 10 e outro no nível 20".
// Variações de Liberação NÃO contam para este máximo.
// ND 20 → 2 + 10 + 1 + 1 = 14.
// ⚠ Acima de 20 os níveis pares seguem dando +1 (a tabela de acesso
//   para, o ganho de Feitiços não é limitado por ela). Confirmar.
// ---------------------------------------------------------------
export function totalFeiticos(nd) {
  const n = Math.max(1, nd | 0);
  return 2 + Math.floor(n / 2) + (n >= 10 ? 1 : 0) + (n >= 20 ? 1 : 0);
}

// Custo padrão por nível, com o piso de 1 (salvo nível 0).
export function custoPadrao(nivel) {
  if (nivel === 0) return 0;
  const c = FEITICO_CUSTO_PE[nivel];
  return c == null ? null : Math.max(1, c);
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

// A área é SEMPRE múltipla de 1,5m (autor). Arredonda para o múltiplo mais próximo.
export const arredondaArea = (m) => (m == null ? null : Math.round(m / 1.5) * 1.5);

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
// (9m em linha/cone) OU o par 6m de alcance + 1,5m de área, que somam. Ou seja,
// no alvo em área alcance e área valem METADE do padrão de alvo único, e cada
// eixo é independente e aditivo.
// ---------------------------------------------------------------
export const TROCA_UNIDADE = {
  dado: 1, acerto: 2, cd: 1,
  alcanceUnico: 6,   // alvo único: 6m = 1 dado
  alcanceArea: 12,   // área: 12m = 1 dado
  area: 3,           // área normal: 3m = 1 dado
  areaLinha: 9,      // linha/cone: 9m = 1 dado
};

// Metros de alcance/área que valem 1 dado, conforme o tipo de alvo e a forma.
export function taxasTroca(alvo, forma) {
  return {
    alcance: alvo === "area" ? TROCA_UNIDADE.alcanceArea : TROCA_UNIDADE.alcanceUnico,
    area: formaEhLinha(forma) ? TROCA_UNIDADE.areaLinha : TROCA_UNIDADE.area,
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

  // Destrutivo e Cataclísmico NUNCA são alvo único e SEMPRE são Ritual
  // Estendido (autor). Área é sempre teste de resistência.
  const areaObrigatoria = destrutivo || cataclismico;
  const alvo = areaObrigatoria ? "area" : (f.alvo === "area" ? "area" : "unico");
  const acaoEff = areaObrigatoria ? "ritual" : f.acao;
  // Múltiplos Disparos são SEMPRE jogadas de ataque. Área é sempre teste de resistência.
  const resolucao = subtipo === "multiplos" ? "ataque"
    : alvo === "area" ? "tr"
    : (f.resolucao === "ataque" ? "ataque" : "tr");

  // Acesso: o nível do Feitiço não pode passar do máximo da faixa de ND.
  if (ctx.nd != null && nivel !== "max" && nivel > nivelMaxFeitico(ctx.nd)) {
    avisos.push(`Nível ${nivel} inacessível: no ND ${ctx.nd} o máximo é ${nivelMaxFeitico(ctx.nd)}.`);
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

  // 1) Ação (não conta para o limite de trocas).
  dados += modDadosPorAcao(acaoEff, nNum);
  if (f.acao === "bonus" && subtipo === "vampirico") avisos.push("Feitiço Vampírico não pode ser Ação Bônus.");

  // 2) Trocas do guia (limitadas). Estas SIM contam no saldo.
  // Acerto só existe em Feitiço de ataque de alvo único (não em TR, área nem
  // Múltiplos Disparos). Fora disso um valor residual não conta no saldo.
  const acertoAplicavel = resolucao === "ataque" && subtipo !== "multiplos";
  const lim = limitesTroca(nivel);
  const trocaDados = clampAviso(t.dados | 0, lim.dados, avisos, "dados de dano");
  const trocaAcerto = acertoAplicavel ? clampAviso(t.acerto | 0, lim.acerto, avisos, "acerto") : 0;
  const trocaCd = clampAviso(t.cd | 0, lim.cd, avisos, "CD");
  dados += trocaDados;

  // Alcance/área a partir da base. Feitiços em ÁREA também têm ALCANCE (autor):
  // solta-se a área num ponto dentro do alcance. Os dois entram no saldo.
  const alcanceBase = ALCANCE_POR_NIVEL[nivel] ?? null;
  const areaBase = alvo === "area" ? (AREA_POR_NIVEL[nivel] ?? null) : null;
  // Number() (não | 0): o delta de área tem passo fracionário (1,5m / 4,5m),
  // que o OR bitwise truncaria (-1.5 vira -1).
  // Destrutivo PODE reduzir alcance e área; Cataclísmico NÃO pode (autor).
  const linhaOuCone = formaEhLinha(f.formaArea);
  // Área "própria" antes das trocas: Destrutivo e Linha/Cone são base × 1,5;
  // esfera comum é a base; Cataclísmico é o mapa (sem valor de metros).
  const areaBaseEfetiva = (alvo === "area" && !cataclismico)
    ? ((destrutivo || linhaOuCone) ? areaBase * 1.5 : areaBase)
    : null;
  let alcanceDelta = cataclismico ? 0 : (Number(t.alcance) || 0);   // metros +/-
  let areaDelta = (cataclismico || alvo !== "area") ? 0 : (Number(t.area) || 0);
  // AUMENTO de alcance e área tem teto de (1 + nível), o mesmo padrão dos dados
  // (autor). A redução vai livre até o piso (0 para os dois).
  const taxas = taxasTroca(alvo, f.formaArea);
  const maxAumentoUnid = 1 + nNum;
  if (alcanceBase != null && !cataclismico) {
    if (alcanceDelta > maxAumentoUnid * taxas.alcance) {
      avisos.push(`Aumento de alcance passa do limite (+${maxAumentoUnid * taxas.alcance}m).`);
      alcanceDelta = maxAumentoUnid * taxas.alcance;
    }
    alcanceDelta = Math.max(alcanceDelta, -alcanceBase);
  }
  if (areaBaseEfetiva != null) {
    if (areaDelta > maxAumentoUnid * taxas.area) {
      avisos.push(`Aumento de área passa do limite (+${maxAumentoUnid * taxas.area}m).`);
      areaDelta = maxAumentoUnid * taxas.area;
    }
    areaDelta = Math.max(areaDelta, -areaBaseEfetiva);
  }

  // Saldo de trocas em UNIDADES (1 = 1 dado). Reduções liberam, aumentos gastam.
  const saldo = saldoTrocas({ alvo, forma: f.formaArea, trocaDados, trocaAcerto, trocaCd, alcanceDelta, areaDelta });
  if (saldo < 0) avisos.push(`Trocas desbalanceadas: faltam ${-saldo} unidade(s) de troca (1 dado = 2 acerto = 6m = 1 CD).`);

  // 3) Empurrão: cada dado gasto vira +6m de empurrão (exige TR, metade se passar).
  const empurraoDados = Math.max(0, t.empurraoDados | 0);
  dados -= empurraoDados;
  const empurraoMetros = empurraoDados * 6;

  // 4) Condições anexadas: cada uma reduz dados pela força. (Fora do limite do guia.)
  // Com "Somente Condição" o Feitiço conta como um NÍVEL ACIMA para a escolha,
  // mas só pode ter UMA condição desse nível superior (e a duração ganha +1
  // rodada, ainda não modelada aqui). O teto de quantidade continua valendo.
  const forcasNormais = CONDICAO_FORCAS_POR_NIVEL[nivel] || [];
  const forcasPermitidas = f.focoCondicao
    ? (CONDICAO_FORCAS_POR_NIVEL[Math.min(nNum + 1, 5)] || [])
    : forcasNormais;
  const condicoes = Array.isArray(f.condicoes) ? f.condicoes : [];
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
  if (!f.focoCondicao) dados -= reducaoCond;

  // 5) Subtipos.
  let danoContInicial = null;   // notação do golpe principal do contínuo
  let contPorRodada = null;
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

  // 6) Requisito (Feitiços de Dano ganham DADOS).
  if (f.requisito) {
    const req = REQUISITO_DIFICULDADE.find((r) => r.value === f.requisito);
    if (req) dados += req.dados;
  }

  // 7) Área final. Sempre múltipla de 1,5m. Linha e Cone contam como LINHA
  //    (comprimento = área × 1,5 e dados extras). Destrutivo tem área própria
  //    (base × 1,5) mas PODE ser reduzida pelas trocas. Cataclísmico é o mapa.
  let areaFinal = null;
  if (alvo === "area") {
    if (cataclismico) {
      areaFinal = null;                       // mapa inteiro
      detalhes.areaMapa = true;
    } else {
      if (linhaOuCone) dados += dadosLinha(nNum);
      areaFinal = arredondaArea(areaBaseEfetiva + areaDelta);
      if (destrutivo) detalhes.areaPropria = true;
    }
  }

  // 8) Piso de 1 dado. Se as reduções passariam disso, o guia trava em 1 dado
  //    e avisamos (a criação estourou o que o Feitiço tinha de dado para gastar).
  if (dados < 1) {
    avisos.push("As reduções passaram do limite: o dano tem piso de 1 dado.");
    dados = 1;
  }

  // 9) Múltiplos disparos: divide os dados finais (piso, mín 1) pelo nº de disparos.
  let danoTexto;
  if (subtipo === "multiplos") {
    const maxDisparos = nNum + 1;
    let disparos = Math.min(Math.max(1, f.disparos | 0 || 1), maxDisparos);
    if ((f.disparos | 0) > maxDisparos) avisos.push(`Máximo de ${maxDisparos} disparos no ${NIVEL_LABEL[nivel]}.`);
    const porDisparo = Math.max(1, Math.floor(dados / disparos));
    disparosInfo = { disparos, porDisparo, concentradoTotal: dados };
    danoTexto = `${disparos}× ${notacaoDano(porDisparo, tipoDado)}`;
    detalhes.multiplos = disparosInfo;
  } else {
    danoTexto = f.focoCondicao ? "Somente Condição" : notacaoDano(dados, tipoDado);
  }

  // Dano contínuo: metade dos dados (piso) por rodada.
  if (subtipo === "continuo") {
    danoContInicial = notacaoDano(dados, tipoDado);
    const contDados = Math.max(1, Math.floor(dados / 2));
    contPorRodada = notacaoDano(contDados, tipoDado);
    detalhes.continuo = {
      modo: f.continuoModo === "concentrado" ? "concentrado" : "sustentado",
      custoSustentacao: f.continuoModo === "concentrado" ? 0 : nNum,
      golpe: danoContInicial, porRodada: contPorRodada,
    };
  }

  // Alcance final.
  let alcanceFinal = null;
  if (alcanceBase != null) alcanceFinal = alcanceBase + alcanceDelta;

  // CD e acerto.
  const cd = (ctx.cdBase ?? null) != null ? ctx.cdBase + trocaCd : null;
  const acertoDelta = trocaAcerto;

  // Custo em PE (a criação não altera o custo; requisito de dano dá dados, não muda PE).
  // A sustentação do dano contínuo vai em detalhes.continuo.custoSustentacao.
  const custoPE = custoPadrao(nivel === "max" ? 5 : nivel);

  return {
    nivel,
    dados,
    tipoDado,
    dano: danoTexto,
    media: subtipo === "multiplos" ? null : mediaDano(dados, tipoDado),
    alcance: alcanceFinal,
    area: areaFinal,
    forma: alvo === "area" ? (f.formaArea || null) : null,
    custoPE,
    cd,
    acertoDelta,
    empurraoMetros,
    saldoTrocas: saldo,
    reducaoCondicoes: reducaoCond,
    contInicial: danoContInicial,
    contPorRodada,
    disparos: disparosInfo,
    avisos,
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
function saldoTrocas({ alvo, forma, trocaDados, trocaAcerto, trocaCd, alcanceDelta, areaDelta }) {
  const taxas = taxasTroca(alvo, forma);
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
