/**
 * ============================================================
 * VISLUMBRE CELESTE — a Condição Corporal dos Seis Olhos
 * ============================================================
 * Conteúdo do autor, entregue em 2026-09-09. Plano e decisões em
 * `docs/afty-vislumbre-celeste.md`.
 *
 * ⚠ A FRASE QUE DECIDE A FORMA é do autor: *"É uma Condição Corporal, logo se
 * soma os efeitos com Feitiços e etc."* Isso não é texto, é motor: os bônus
 * daqui entram pelos canais que ACUMULAM, e o Vislumbre fica de fora do pool
 * exclusivo das cinco fontes que disputam o maior valor. Um Feitiço que dê +2 em
 * Percepção soma com ele em vez de competir.
 *
 * ⚠ ELE É DE GRAÇA (autor, 2026-09-09): *"É ganho de graça, sem precisar de
 * Origem, Talento, Aptidão nem nada"*. Por isso não há entrada de catálogo e não
 * há vaga gasta: quem instala o pacote TEM os olhos, e o `permite:
 * ["vislumbreCeleste"]` é o portão. É a mesma forma da Carteira e da Loja de
 * Catarse, e a razão é a mesma: o que ele acrescenta não é ENTRADA nova.
 *
 * ⚠ ESTE MÓDULO É FOLHA, e não importa nada. Ele é lido pelo `afty-derive.js` e
 * pelo card da aba Habilidades, e o preço da folha é receber o `cl` e os estados
 * já resolvidos, em vez de ir buscá-los.
 *
 * ------------------------------------------------------------
 * A ESCADA É O `cl`
 * ------------------------------------------------------------
 * Tudo escala com o Nível de Aptidão em Controle e Leitura, que já é variável do
 * DSL e já é o que as Aptidões de Controle e Leitura leem. Coberto vale metade,
 * descoberto vale inteiro, e é essa a única diferença entre os dois blocos.
 * ============================================================
 */

/* ============================================================ */
/* OS DOIS ESTADOS                                              */
/* ============================================================ */
/*
 * ⚠ OS IDS SÃO DO MÓDULO, e não do pacote. Um estado declarado no JSON leva o
 * namespace do addon no id (`vislumbre-celeste:descoberto`), e a variável de DSL
 * seguiria o nome que a MESA deu ao arquivo. Como as expressões daqui citam o
 * estado, elas quebrariam no dia em que alguém renomeasse o pacote. Aqui os dois
 * ids são fixos, e as expressões podem confiar neles.
 */
export const ESTADO_DESCOBERTO = "vislumbreDescoberto";
export const ESTADO_FADIGA = "vislumbreFadiga";

/** As variáveis que as expressões deste módulo leem. */
export const VAR_DESCOBERTO = "vislumbre_descoberto";
export const VAR_FADIGA = "vislumbre_fadiga";

/**
 * *"Ao acumular 4 pontos de fadiga, você sofre imediatamente 1 Nível de Exaustão
 * e seus Pontos de Fadiga são zerados, reiniciando a contagem."*
 */
export const FADIGA_MAXIMA = 4;

/* ============================================================ */
/* OS DOIS BLOCOS                                               */
/* ============================================================ */
/**
 * A única diferença entre coberto e descoberto é o MULTIPLICADOR. O texto
 * escreve os dois blocos por extenso, e eles saem iguais nesta tabela:
 *
 *   coberto     PE = metade do CL   perícia = +1 por CL   visão = 9m  + 4,5m por CL
 *   descoberto  PE = CL inteiro     perícia = +2 por CL   visão = 18m + 9m   por CL
 */
export const VISLUMBRE_BLOCOS = {
  coberto: {
    id: "coberto",
    rotulo: "Olhos Cobertos",
    processamento: "Processamento Eficiente",
    visaoNome: "Visão Penetrante",
    analiseNome: "Análise de Energia",
    visaoBase: 9,
    visaoPorNivel: 4.5,
    periciaPorNivel: 1,
    // "reduzirá o valor gasto igual à metade de seu Nível de Aptidão de CL"
    pePorNivel: 0.5,
  },
  descoberto: {
    id: "descoberto",
    rotulo: "Olhos Descobertos",
    processamento: "Processamento Máximo",
    visaoNome: "Visão Absoluta",
    analiseNome: "Análise de Combate",
    visaoBase: 18,
    visaoPorNivel: 9,
    periciaPorNivel: 2,
    // "reduzirá o valor gasto igual á seu Nível de Aptidão de CL"
    pePorNivel: 1,
  },
};

/** As perícias que os dois blocos melhoram. */
export const VISLUMBRE_PERICIAS = ["percepcao", "feiticaria"];

/* ============================================================ */
/* O TEXTO, VERBATIM                                            */
/* ============================================================ */
/* O card mostra o que o autor escreveu, e nada além. */
export const VISLUMBRE_TEXTOS = {
  resumo:
    "Uma verdadeira bênção concedida àqueles destinados ao pináculo da feitiçaria, o Seis Olhos é "
    + "um jujutsu ocular extremamente raro herdado no Clã Gojo. Ele se manifesta como um par de "
    + "olhos azuis vibrantes que processam a energia amaldiçoada com detalhes impossíveis, "
    + "concedendo ao usuário uma percepção sobre-humana e uma manipulação de energia perfeitamente "
    + "eficiente",
  coberto: [
    ["Processamento Eficiente",
      "Sempre que gastar PE, você reduzirá o valor gasto igual à metade de seu Nível de Aptidão de "
      + "CL. (Mínimo 1 PE)"],
    ["Visão Penetrante",
      "Você recebe percepção às cegas com alcance padrão de 9m. Para cada nível de CL, você recebe "
      + "+4,5m de alcance de visão. Além de um bônus de +1 em Percepção e Feitiçaria, para cada "
      + "nível de CL."],
    ["Análise de Energia",
      "Você pode utilizar a ação \"Ler Energia\" como uma Ação de Movimento."],
  ],
  descoberto: [
    ["Processamento Máximo",
      "Sempre que gastar PE, você reduzirá o valor gasto igual á seu Nível de Aptidão de CL. "
      + "(Mínimo 1 PE)"],
    ["Visão Absoluta",
      "Você recebe percepção às cegas com alcance padrão de 18m. Para cada nível de CL, você recebe "
      + "+9m de alcance de visão. Além de um bônus de +2 em Percepção e Feitiçaria, para cada nível "
      + "de CL"],
    ["Análise de Combate",
      "Você pode utilizar as ações \"Ler Técnica\" ou \"Ler Intenções\" como uma Ação Livre uma vez "
      + "na rodada."],
  ],
  sobrecarga: [
    ["Fadiga Mental",
      "No final de cada um dos seus turnos em que seus olhos estiverem descobertos, você recebe 1 "
      + "Ponto de Fadiga."],
    ["Limite de Fadiga",
      "Ao acumular 4 pontos de fadiga, você sofre imediatamente 1 Nível de Exaustão e seus Pontos "
      + "de Fadiga são zerados, reiniciando a contagem."],
    ["Mitigação",
      "A fadiga gerada pelos Seis Olhos podem ser curados, com energia reversa, gastando 1 Ponto de "
      + "energia reversa para cada ponto de fadiga."],
  ],
  compreensao:
    "Além de todos os benefícios e a fadiga, os Seis Olhos permitem ao usuário que sua compreensão "
    + "se desenvolva mais rápido que o comum: Você recebe 1 Nvl de Aptidão adicional, recebendo +1 "
    + "nos Níveis 5, 15 e 25.",
  lerTecnica:
    "Ler Técnica. Como uma ação bônus, você foca a sua percepção em ler a energia amaldiçoada de um "
    + "usuário de energia, desvendando-a. Você realiza um teste de Feitiçaria ou Percepção (CD 20 + "
    + "5 para cada grau acima do 4) caso suceda, você descobre o funcionamento básico e conceitos "
    + "da sua técnica, além de qualquer propriedade da sua aura.",
  impossivel:
    "Além de todos os benefícios e a fadiga, os Seis Olhos permitem ao usuário fazer um Feitiço c/ "
    + "Pré-Requisito Impossível que só pode ser utilizado enquanto os olhos estiverem descobertos, "
    + "como o Infinito de Satoru Gojo.",
};

/* ============================================================ */
/* AS CONTAS                                                    */
/* ============================================================ */

const inteiro = (v) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : 0;
};

/**
 * A CD da ação Ler Técnica: *"CD 20 + 5 para cada grau acima do 4"*.
 *
 * `ordem` é a do `AFTY_GRAUS_CRIATURA`, em que o Quarto Grau é 1. Um Quarto Grau
 * dá 20, um Terceiro dá 25, e assim por diante.
 */
export const cdLerTecnica = (ordemDoGrau) => 20 + 5 * Math.max(0, inteiro(ordemDoGrau) - 1);

/**
 * Quantos Níveis de Aptidão a Compreensão do Jujutsu concede.
 *
 * Verbatim: *"Você recebe 1 Nvl de Aptidão adicional, recebendo +1 nos Níveis 5,
 * 15 e 25."* O autor confirmou a leitura em 2026-09-09: são QUATRO, um já na
 * criação e mais um em cada marco.
 */
export const MARCOS_COMPREENSAO = [5, 15, 25];

export const compreensaoDoJujutsu = (nd) =>
  1 + MARCOS_COMPREENSAO.filter((marco) => inteiro(nd) >= marco).length;

/** A expressão equivalente, para o efeito viajar pelo Motor e aparecer no hover. */
export const EXPR_COMPREENSAO = `1 + ${MARCOS_COMPREENSAO.map((m) => `(nd >= ${m})`).join(" + ")}`;

/**
 * O alcance da percepção às cegas, em metros.
 *
 * ⚠ O 4,5 NÃO É ARREDONDADO. A regra do piso do Afty vale para fórmula de
 * sistema (metade de nível, bônus por patamar), e não para distância: o próprio
 * livro mede em 1,5m, 4,5m e 7,5m. Um floor aqui transformaria 13,5m em 13m.
 */
export const alcanceDaVisao = (bloco, cl) => bloco.visaoBase + bloco.visaoPorNivel * Math.max(0, inteiro(cl));

/** A redução de PE daquele bloco, sempre para baixo. */
export const reducaoDePe = (bloco, cl) => Math.floor(Math.max(0, inteiro(cl)) * bloco.pePorNivel);

/* ============================================================ */
/* OS ESTADOS QUE A CRIATURA GANHA                              */
/* ============================================================ */
/**
 * ⚠ "Olhos Descobertos" NÃO leva `foraCombate`, e isso é decisão. Um extra com
 * `foraCombate: true` nasce LIGADO quando a bancada está desligada, e aqui o
 * estado de repouso é o coberto: o texto trata descobrir como uma Ação Livre que
 * se toma, e a Fadiga só corre com eles descobertos.
 */
export function estadosDoVislumbre({ tem = false } = {}) {
  if (!tem) return [];
  return [
    {
      id: ESTADO_DESCOBERTO,
      label: "Olhos Descobertos",
      tipo: "bool",
      title: "Ação Livre. Troca os benefícios cobertos pelos descobertos, e começa a gerar Fadiga",
    },
    {
      id: ESTADO_FADIGA,
      label: "Fadiga Mental",
      tipo: "faixa",
      min: 0,
      max: FADIGA_MAXIMA,
      passo: 1,
      title: "1 ponto no fim de cada turno com os olhos descobertos. Ao encher, vira 1 Nível de Exaustão",
    },
  ];
}

/* ============================================================ */
/* OS EFEITOS                                                   */
/* ============================================================ */
/**
 * Os olhos estão descobertos AGORA?
 *
 * ⚠ LÊ A CRIATURA CRUA, e é a mesma fonte que o `resolveCombate` lê, com o mesmo
 * portão do `ativo`: bancada desligada quer dizer olhos cobertos, que é o estado
 * de repouso. A Ficha Final funde a sessão em `creature.combate` antes de
 * derivar, então lá o valor é o da mesa.
 */
export const olhosDescobertos = (creature) => !!creature?.combate?.[ESTADO_DESCOBERTO];

/**
 * Os Pontos de Fadiga acumulados, da mesma fonte.
 *
 * ⚠ OS DOIS IGNORAM O `ativo` DA BANCADA, e isso é decisão de 2026-09-09. Todo
 * outro estado é zerado fora de combate, porque todo outro estado É de combate.
 * Este não: uma Condição Corporal não liga e desliga com a iniciativa, e os
 * olhos cobertos ou descobertos mudam a visão e o custo de PE fora da luta
 * também.
 *
 * Sem isso o painel da Ficha teria DUAS VERDADES: o botão aceso pelo valor
 * gravado e os números mostrando o bloco coberto, porque o `resolveCombate`
 * devolve tudo zerado com a bancada desligada.
 */
export const fadigaAtual = (creature) =>
  Math.max(0, Math.min(FADIGA_MAXIMA, Math.trunc(Number(creature?.combate?.[ESTADO_FADIGA]) || 0)));

/**
 * Acumula (ou devolve) Ponto de Fadiga na SESSÃO, e converte ao encher.
 *
 * Verbatim: *"Ao acumular 4 pontos de fadiga, você sofre imediatamente 1 Nível
 * de Exaustão e seus Pontos de Fadiga são zerados, reiniciando a contagem."*
 *
 * ⚠ "IMEDIATAMENTE" É AUTOMÁTICO, e não um botão de confirmar. O quarto ponto
 * nunca fica na tela: ele vira Exaustão e a contagem recomeça no zero, que é o
 * que o texto manda. O contador de Exaustão fica ao lado no mesmo painel, então
 * a conversão se vê acontecer.
 */
export function acumulaFadiga(sessao, delta = 1) {
  const s = sessao && typeof sessao === "object" ? sessao : {};
  const combate = s.combate && typeof s.combate === "object" ? s.combate : {};
  const atual = Math.max(0, Math.trunc(Number(combate[ESTADO_FADIGA]) || 0));
  const bruto = atual + Math.trunc(Number(delta) || 0);
  if (bruto >= FADIGA_MAXIMA) {
    return {
      ...s,
      exaustao: Math.max(0, Math.trunc(Number(s.exaustao) || 0)) + 1,
      combate: { ...combate, [ESTADO_FADIGA]: 0 },
    };
  }
  return { ...s, combate: { ...combate, [ESTADO_FADIGA]: Math.max(0, bruto) } };
}

/** Descobre ou cobre os olhos, na sessão. */
export function alternaOlhos(sessao, descoberto) {
  const s = sessao && typeof sessao === "object" ? sessao : {};
  const combate = s.combate && typeof s.combate === "object" ? s.combate : {};
  return { ...s, combate: { ...combate, [ESTADO_DESCOBERTO]: !!descoberto } };
}

/**
 * O bloco que está de pé, e só ele.
 *
 * ⚠ UM BLOCO POR VEZ, E NÃO OS DOIS COM `quando`. A primeira versão emitia os
 * dois e deixava o `quando` decidir, e isso não funciona: o canal `custoPE` é
 * lido no passe PÓS-APTIDÃO, que roda ANTES de a bancada de combate existir, e
 * lá a variável do estado ainda não nasceu. Os dois blocos caíam calados, e o
 * custo do Domínio Simples não mudava.
 *
 * Emitir só o bloco ativo resolve os dois lados: o efeito vale em qualquer passe
 * e *"substituindo-os pelos seguintes"* deixa de depender de uma condição que o
 * contexto pode não conhecer. O que decide é o `descoberto`, que vem da ficha.
 *
 * ⚠ A REDUÇÃO DE PE NÃO TEM ALVO, de propósito: *"Sempre que gastar PE"* é o
 * gasto inteiro, e o canal `custoPE` sem alvo vale para os cinco gastos que a
 * ficha calcula. Ver `CUSTOS_PE` em afty-efeitos.js.
 */
export function efeitosDoVislumbre({ tem = false, descoberto = false } = {}) {
  if (!tem) return [];
  const out = [];
  const b = descoberto ? VISLUMBRE_BLOCOS.descoberto : VISLUMBRE_BLOCOS.coberto;
  /* ⚠ O NOME É SÓ "Olhos Cobertos" ou "Olhos Descobertos" (autor, 2026-09-09).
     Ele era `Vislumbre Celeste: Olhos Descobertos · Visão Absoluta`, e numa
     linha de hover que já é estreita aquilo empurrava o número para fora e
     repetia três vezes o que a pessoa já sabe. A fonte precisa dizer QUEM deu o
     bônus, e quem deu é o estado dos olhos. */
  const nome = b.rotulo;
  // "Sempre que gastar PE, você reduzirá o valor gasto"
  out.push({
    canal: "custoPE",
    expr: b.pePorNivel === 1 ? "cl" : "piso(cl / 2)",
    nome,
    origem: "vislumbre_celeste",
    duracao: "temporaria",
  });
  // "um bônus de +1 em Percepção e Feitiçaria, para cada nível de CL"
  for (const pericia of VISLUMBRE_PERICIAS) {
    out.push({
      canal: "bonusPericia",
      alvo: pericia,
      expr: b.periciaPorNivel === 1 ? "cl" : `cl * ${b.periciaPorNivel}`,
      nome,
      origem: "vislumbre_celeste",
      duracao: "temporaria",
    });
  }
  /* A Compreensão do Jujutsu vale SEMPRE: ela não é benefício de olho coberto
     nem descoberto, é o que o texto chama de "além de todos os benefícios". */
  out.push({
    canal: "pontosAptidao",
    expr: EXPR_COMPREENSAO,
    nome: "Compreensão do Jujutsu",
    origem: "vislumbre_celeste",
  });
  return out;
}

/* ============================================================ */
/* O RESUMO PARA A TELA                                         */
/* ============================================================ */
/**
 * Tudo que o card precisa, já resolvido. A UI não recalcula nada.
 *
 * `cl` é o Nível de Aptidão em Controle e Leitura EFETIVO, `descoberto` e
 * `fadiga` vêm da bancada ou da sessão, e `grauOrdem` é a do grau da criatura,
 * para a CD da Ler Técnica.
 */
export function resolveVislumbre({
  tem = false, cl = 0, descoberto = false, fadiga = 0, grauOrdem = 1, nd = 1,
} = {}) {
  const nivel = Math.max(0, inteiro(cl));
  const bloco = descoberto ? VISLUMBRE_BLOCOS.descoberto : VISLUMBRE_BLOCOS.coberto;
  const pontos = Math.max(0, Math.min(FADIGA_MAXIMA, inteiro(fadiga)));
  return {
    tem: !!tem,
    cl: nivel,
    descoberto: !!descoberto,
    bloco,
    reducaoPe: reducaoDePe(bloco, nivel),
    visao: alcanceDaVisao(bloco, nivel),
    pericia: bloco.periciaPorNivel * nivel,
    fadiga: pontos,
    /* ⚠ "Ao acumular 4 pontos" é o gatilho, e a ficha AVISA em vez de agir
       sozinha: quem zera e cobra a Exaustão é o botão, na sessão. Um contador
       que se esvazia sozinho no meio da leitura esconde o que aconteceu. */
    fadigaCheia: pontos >= FADIGA_MAXIMA,
    cdLerTecnica: cdLerTecnica(grauOrdem),
    compreensao: compreensaoDoJujutsu(nd),
  };
}
