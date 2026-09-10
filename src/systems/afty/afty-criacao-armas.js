/**
 * ============================================================
 * CRIAÇÃO DE ARMAS — a métrica de Pontos de Criação
 * ============================================================
 * O padrão de criação de armas escrito pelo autor ("eu, O Espectro") e entregue
 * em 2026-09-09. Ele existe porque o livro tem uma TABELA de armas e nenhuma
 * régua para inventar a linha seguinte: dado, margem de crítico, propriedades e
 * custo são números escolhidos a olho.
 *
 * Aqui está o VERBO. O `permite: ["criacaoArmas"]` do pacote
 * `addons/criacao-de-armas.json` é quem diz quem ENXERGA a bancada, e a razão
 * está em docs/afty-addons.md: em 2026-08-20 a Concessão do Mestre vazou para a
 * tela de todo mundo porque o verbo foi ao motor e ninguém disse quem o vê.
 *
 * ------------------------------------------------------------
 * ⚠ ESTE MÓDULO É FOLHA, E NÃO IMPORTA NADA
 * ------------------------------------------------------------
 * Ele é lido pelo editor de arma custom, que mora no `AftyCreatureBuilder.jsx`,
 * e também pelo `afty-equipamentos.js` (o saneamento do bloco `criacao`). Um
 * import daqui para o equipamentos fecharia o ciclo que deixou o app em tela
 * branca em 2026-09-02. O preço é que as tabelas do livro que a métrica precisa
 * (a escada de dados, a faixa de crítico, o teto de custo e os tipos físicos)
 * aparecem aqui como ESPELHO, e `asserts/t-criacao-armas.mjs` compara cada uma
 * com a original. Uma divergência futura cai no assert, e não numa ficha.
 *
 * ------------------------------------------------------------
 * ⚠ A MÉTRICA NÃO MOVE NÚMERO NENHUM DA FICHA
 * ------------------------------------------------------------
 * Ela LÊ a arma que já está gravada e devolve o extrato de PC dela. Nada aqui
 * escreve dano, acerto, defesa ou orçamento: quem excede um limite recebe
 * AVISO, e o número continua o que a pessoa gravou. É a convenção de todo
 * orçamento do projeto, e é o que faz este addon ser `permite` e não `libera`.
 *
 * A única exceção é declarada e mora na TELA, não aqui: numa arma marcada como
 * de técnica o campo Custo vira mostrador e passa a seguir o grau do usuário
 * (decisão do autor, 2026-09-09). Ver `custoDeTecnica` e o editor.
 *
 * ------------------------------------------------------------
 * AS DECISÕES DO AUTOR (2026-09-09)
 * ------------------------------------------------------------
 * | Pergunta                                   | Resposta                       |
 * |---|---|
 * | "Tática" é a classe Complexa do livro?     | **Sim.** Mesmo campo, outro nome |
 * | O custo da arma de técnica sai do grau?    | **Sim**, e o campo vira mostrador |
 * | A margem desce abaixo de 18?               | **Não**, 18 é o piso            |
 * | O efeito da propriedade Estabilidade?      | **Fica de fora por ora**        |
 * ============================================================
 */

import { nivelDoDado as degrauDaEscada, ESCADA_DANO } from "./afty-niveis-dano";

/* ============================================================ */
/* AS DUAS CLASSIFICAÇÕES                                       */
/* ============================================================ */
/*
 * Verbatim: *"Armas Simples: 8 PC [...] Limites: Máximo de 6 PC em Propriedades
 * e 4 PC em Dano, com seu custo máximo sendo 2."* e *"Armas Táticas: 12 PC
 * [...] Limites: Máximo de 8 PC em Propriedades e 6 PC em Dano, com seu custo
 * máximo sendo 3."*
 *
 * ⚠ O `value` É O CAMPO `classe` DO LIVRO, e não um campo novo. O autor
 * confirmou em 2026-09-09 que a Tática é a Complexa que o catálogo já tem, e a
 * própria métrica escreve as duas palavras como sinônimas: a Fatal e a Mortal
 * dizem *"Só pode ser colocado em armas complexas"* e o padrão não lista
 * classificação com esse nome. Um campo novo criaria uma arma que é Complexa
 * para a proficiência do Lutador e Tática para a criação, e as duas leituras
 * divergiriam na primeira arma editada.
 *
 * O rótulo é o da métrica, e só aparece na bancada.
 */
export const CLASSIFICACOES_ARMA = [
  { value: "simples",  label: "Simples", pc: 8,  limiteProp: 6, limiteDano: 4, custoMax: 2 },
  { value: "complexa", label: "Tática",  pc: 12, limiteProp: 8, limiteDano: 6, custoMax: 3 },
];

export const classificacaoDaArma = (classe) =>
  CLASSIFICACOES_ARMA.find((c) => c.value === classe) ?? CLASSIFICACOES_ARMA[0];

/* ============================================================ */
/* ESPELHOS DO LIVRO                                            */
/* ============================================================ */
/* Cada um destes é uma cópia declarada de algo que mora no
   `afty-equipamentos.js`, e cada um tem assert comparando os dois. Ver a nota
   de folha no topo. */

/*
 * ⚠ A ESCADA DE DADOS NÃO É ESPELHO, e esta é a correção de 2026-09-09.
 *
 * A primeira versão deste arquivo copiava o `ARMA_DADOS` (a lista de seis que o
 * editor oferece) e cobrava o ÍNDICE dela. Estava errado, e o autor achou pela
 * porta certa: *"Para que serve a Opção Dano? Sendo que o Dano fica limitado a
 * 2d6 independente"*.
 *
 * "Subir 1 nível" é o **Nível de Dano** do livro, que é mecânica transcrita e
 * mora em `afty-niveis-dano.js`. Nela o degrau é o RESULTADO MÁXIMO, então
 * `1d12` e `2d6` são o MESMO nível (a tabela impressa escreve a célula como
 * *"1d12 ou 2d6"*), e o índice da lista de seis cobrava 6 por um e 5 pelo outro.
 *
 * Duas provas de que os limites do padrão foram escritos nesta escada:
 *   • Simples, limite 4 = `1d10`, que é a maior arma simples do livro.
 *   • Tática, limite 6 = máximo 16 = `2d8`, que é a Espada Colossal, a maior
 *     arma corpo a corpo do livro. Ela fecha EXATAMENTE no limite.
 */
export const DADO_INICIAL = "1d4";

/** Espelho de `ARMA_CRITICOS`. 20 é o natural, 18 é a faixa mais larga do livro. */
export const CRITICO_BASE = 20;
export const CRITICO_PISO = 18;

/** Espelho do teto de `CUSTOS`. */
export const CUSTO_TETO = 4;

/** Espelho da categoria Físicos de `CATEGORIAS_DANO`, para a Modular. */
export const TIPOS_FISICOS = ["ct", "im", "pf"];

/* ============================================================ */
/* O PREÇO DE CADA PROPRIEDADE                                  */
/* ============================================================ */
/*
 * Verbatim, uma linha por propriedade da métrica. As quatro que não estão aqui
 * têm razão nomeada logo abaixo, e há assert cobrando que toda propriedade do
 * livro caia numa das duas listas: uma propriedade nova que ninguém precificar
 * apareceria na bancada custando zero, calada.
 *
 * ⚠ DUAS MÃOS TEM PREÇO NEGATIVO, e ela é o único caso. Verbatim: *"Duas mãos:
 * -1PC | Sim, esta propriedade retira PC gastos, pois são uma Restrição que a
 * arma impõe no seu portador."* "Retira PC gastos" é o que a põe no BOLSO das
 * Propriedades e não no bolo geral: ela abre espaço debaixo do limite de 6 ou 8,
 * e não fora dele.
 */
export const PC_PROPRIEDADE = {
  alcance: 1,
  ampla: 3,
  aparar: 2,
  apunhaladora: 1,
  arremessavel: 1,
  duas_maos: -1,
  dupla: 1,
  energica: 2,
  estendida: 2,
  fatal: 1,
  fineza: 1,
  leve: 1,
  marcial: 1,
  modular: 1,
  mortal: 1,
  oscilante: 1,
  versatil: 1,
};

/*
 * As duas que não têm preço: elas RENDEM PC, por conta própria. Ver
 * `creditoDeAtributoExigido`.
 *
 * ⚠ A CONTA DAS DUAS É A MESMA, e por isso é uma função só. O autor foi direto
 * ao acrescentar a Estabilidade em 2026-09-09: *"Estabilidade é a mesma coisa
 * que Pesada, só que para Destreza"*. Escrever duas contas iguais é o caminho
 * conhecido para elas divergirem no primeiro conserto.
 */
export const PROPRIEDADES_DE_CREDITO = ["pesada", "estabilidade"];

/*
 * A ÚNICA diferença entre as duas: *"para cada PC extra, aumente em 1 o espaço
 * gasto da arma"* está na Pesada e não está na Estabilidade. O espaço que a
 * Pesada cobra também sai do crédito de espaços, senão o mesmo espaço seria pago
 * duas vezes.
 */
export const CREDITO_COBRA_ESPACO = { pesada: true, estabilidade: false };

/** O atributo que cada uma exige, para o rótulo do extrato e do aviso. */
export const CREDITO_ATRIBUTO = { pesada: "Força", estabilidade: "Destreza" };

/** A Especial é avaliada pela mesa, e o número dela é digitado na bancada. */
export const PROPRIEDADES_AVALIADAS = ["especial"];

/*
 * Emperrar e Recarga são de arma de fogo, e a métrica as deixa de fora por
 * escrito: *"Não farei para armas de fogo porque ainda não é necessário"*. Elas
 * continuam existindo no livro e continuam marcáveis na arma. O que a bancada
 * faz é AVISAR que estão fora do padrão, em vez de fingir um preço.
 */
export const PROPRIEDADES_FORA_DO_PADRAO = ["emperrar", "recarga"];

/* ============================================================ */
/* AS CONTAS DE UMA LINHA SÓ                                    */
/* ============================================================ */

const inteiro = (v) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : 0;
};

const entre = (v, min, max) => Math.min(max, Math.max(min, v));

/* O degrau de `1d4` na escada do livro, que é o PC 1. Os degraus abaixo dele
   (`1`, `1d2`, `1d3`) existem só na DESCIDA por efeito de inimigo, e nenhuma
   arma nasce neles. */
const DEGRAU_BASE = degrauDaEscada(DADO_INICIAL);

/**
 * O PC que um dado custa, que é a posição dele na escada do livro.
 *
 * Verbatim: *"Para cada 1 PC o dado de dano da arma subirá em 1 nível,
 * começando sem dano igual a faixas até chegar no limite máximo permitido pela
 * classificação da arma."*
 *
 * Zero é "sem dano", que é onde as Faixas ficam. 1d4 custa 1, 1d12 custa 5, e
 * `2d6` custa os mesmos 5, porque é o mesmo nível escrito de outra forma.
 */
export const pcDoDado = (dado) => {
  const degrau = degrauDaEscada(dado);
  if (degrau == null) return 0;
  return Math.max(0, degrau - DEGRAU_BASE + 1);
};

/** O dado que um número de PC compra, para a tela oferecer o que cabe. */
export const dadoDePc = (pc) => ESCADA_DANO[Math.max(0, DEGRAU_BASE + Math.trunc(pc) - 1)]?.texto ?? null;

/**
 * Quantos níveis o dado está ABAIXO de 1d12, que é o que alarga a margem.
 * O 2d6 está no MESMO degrau do 1d12, e devolve zero.
 */
export const niveisAbaixoDe1d12 = (dado) => {
  const n = pcDoDado(dado);
  if (n <= 0) return 0;
  return Math.max(0, pcDoDado("1d12") - n);
};

/**
 * O custo de uma arma de técnica, pelo grau de quem a usa.
 *
 * Verbatim: *"Para cada vez que o usuário subir de grau, o custo de sua arma
 * irá subir em 1. Começando com custo 1 no grau 4 e terminando em custo 4 no
 * grau 1."*
 *
 * `ordem` é a do `AFTY_GRAUS_CRIATURA`: Quarto Grau é 1 e Primeiro Grau é 4.
 *
 * ⚠ ACIMA DO PRIMEIRO GRAU O CUSTO PARA EM 4, e não continua subindo. O padrão
 * termina a escada ali, e 4 é o teto de custo de todo item do sistema. Os
 * quatro degraus Especiais da criatura ficam com o mesmo custo do Primeiro.
 */
export const custoDeTecnica = (ordemDoGrau) => entre(inteiro(ordemDoGrau) || 1, 1, CUSTO_TETO);

/**
 * Quantas reduções de margem a arma pode comprar.
 *
 * Verbatim: *"Para cada 3 PC gastos em Margem se reduzirá em um o valor
 * necessário para um crítico na arma. Com o limite igual a metade do custo da
 * arma + 1 para cada dois níveis de dado menores que 1d12."*
 *
 * ⚠ O PISO DE 18 APARA O RESULTADO (autor, 2026-09-09). A conta chega a 4 numa
 * arma de custo 4 com dado 1d4, e o sistema guarda 20, 19 e 18 e nada mais. O
 * que passar disso não é comprável, e a bancada avisa em vez de aceitar.
 */
export const PC_POR_MARGEM = 3;

export const limiteDeMargem = (custo, dado) => entre(
  Math.floor(entre(inteiro(custo), 0, CUSTO_TETO) / 2) + Math.floor(niveisAbaixoDe1d12(dado) / 2),
  0,
  CRITICO_BASE - CRITICO_PISO,
);

/**
 * O PC que a Pesada e a Estabilidade RENDEM.
 *
 * Verbatim da Pesada: *"A cada 4 atributos acima de 10 necessários em Força para
 * se utilizar esta arma se recebe 1 PC extra para gastar na arma. Com um limite
 * igual ao custo da arma - 1. No entanto, para cada PC extra, aumente em 1 o
 * espaço gasto da arma."*
 *
 * Verbatim da Estabilidade: *"A cada 4 atributos acima de 10 necessários em
 * Destreza para se utilizar esta arma se recebe 1 PC extra para gastar na arma.
 * Com um limite igual ao custo da arma - 1."*
 *
 * 14 rende 1, 18 rende 2, e o custo apara. Numa arma de custo 1 o limite é ZERO,
 * e nenhuma das duas rende nada.
 */
export const creditoDeAtributoExigido = (valorExigido, custo) => entre(
  Math.floor((inteiro(valorExigido) - 10) / 4),
  0,
  Math.max(0, inteiro(custo) - 1),
);

/**
 * O PC que os espaços rendem.
 *
 * Verbatim: *"Para cada 1 de Espaço, acima de 1, que a arma gaste que não seja
 * pela propriedade pesada, se recebe 1 PC extra. Limitado pelo custo da arma e
 * narrativa."*
 *
 * Os espaços que a Pesada cobrou saem da conta antes, senão o mesmo espaço
 * seria pago duas vezes. "E narrativa" é da mesa, e não do criador de fichas.
 */
export const creditoDeEspaco = (espacos, espacosDePesada, custo) => entre(
  inteiro(espacos) - 1 - inteiro(espacosDePesada),
  0,
  Math.max(0, inteiro(custo)),
);

/**
 * O PC de uma propriedade de alcance, pelo alcance CURTO gravado na arma.
 *
 * Verbatim da Alcance: *"para cada ponto desta propriedade a arma ganha 12 de
 * alcance em seu acerto e o dobro disso em seu alcance máximo"*, e da
 * Arremessável: *"a arma ganha 6 de alcance em seu acerto e o triplo disso em
 * seu alcance máximo"*.
 *
 * ⚠ O PC SAI DO ALCANCE GRAVADO, e não o contrário. A arma é a fonte, e a
 * bancada é a leitura dela: é o mesmo desenho do resto do extrato, e é o que
 * deixa a arma continuar editável pelos campos que já existiam. Um alcance que
 * não caia no degrau arredonda para CIMA, porque meio degrau comprado é degrau.
 */
export const pcDeAlcance = (par, metrosPorPonto) => {
  const curto = Array.isArray(par) ? Number(par[0]) : Number(par);
  if (!Number.isFinite(curto) || curto <= 0) return 0;
  return Math.ceil(curto / metrosPorPonto);
};

export const METROS_ALCANCE = 12;
export const METROS_ARREMESSAVEL = 6;

/* ============================================================ */
/* O BLOCO `criacao` DA ARMA                                    */
/* ============================================================ */
/*
 * O que a métrica precisa saber e a arma do livro não guarda. Mora na própria
 * arma custom (`creature.armasCustom[].criacao`), e é saneado junto com ela.
 *
 * ⚠ ELE SÓ NASCE QUANDO ALGUÉM MEXE NA BANCADA. Uma arma criada sem o addon não
 * ganha o campo, e desinstalar o addon não apaga o campo de quem já mexeu: é a
 * mesma regra da Carteira, que continua calculando o extrato sem o pacote
 * instalado, porque uma ficha que perdeu o addon não pode devolver zero e deixar
 * a pessoa achar que o trabalho dela sumiu.
 */
export const BONUS_DESTINOS = ["propriedades", "dano"];

export const createBlankCriacao = () => ({
  tecnica: false,
  especialPc: 0,
  especialTexto: "",
  bonus2: "propriedades",
  bonus4: "propriedades",
});

/** O bloco saneado, ou `null` quando a arma não tem bancada nenhuma. */
export function saneiaCriacaoDeArma(bruta) {
  if (!bruta || typeof bruta !== "object") return null;
  const destino = (v) => (BONUS_DESTINOS.includes(v) ? v : "propriedades");
  return {
    tecnica: bruta.tecnica === true,
    // O teto é o PC de uma Tática de técnica no Primeiro Grau (12 + 8 + 4), e
    // existe só para um campo digitado à mão não virar número sem fim.
    especialPc: entre(inteiro(bruta.especialPc), 0, 24),
    especialTexto: String(bruta.especialTexto ?? ""),
    bonus2: destino(bruta.bonus2),
    bonus4: destino(bruta.bonus4),
  };
}

/* Os nomes que a métrica usa nas linhas do extrato. Ficam aqui e não vêm do
   catálogo pela regra de folha do topo, e o assert compara os dois. */
const ROTULOS = {
  alcance: "Alcance",
  ampla: "Ampla",
  aparar: "Aparar",
  apunhaladora: "Apunhaladora",
  arremessavel: "Arremessável",
  duas_maos: "Duas Mãos",
  dupla: "Dupla",
  emperrar: "Emperrar",
  energica: "Enérgica",
  especial: "Especial",
  estabilidade: "Estabilidade",
  estendida: "Estendida",
  fatal: "Fatal",
  fineza: "Fineza",
  leve: "Leve",
  marcial: "Marcial",
  modular: "Modular",
  mortal: "Mortal",
  oscilante: "Oscilante",
  pesada: "Pesada",
  recarga: "Recarga",
  versatil: "Versátil",
};

export { ROTULOS as ROTULOS_PROPRIEDADE };

/* ============================================================ */
/* O EXTRATO                                                    */
/* ============================================================ */
/**
 * O extrato de Pontos de Criação de UMA arma.
 *
 * `arma` é a arma custom já saneada (a que `armasCustomDaFicha` devolve).
 * `grauOrdem` é o `ordem` do grau da criatura, e só é lido quando a arma é de
 * técnica. `tiposFisicos` entra por opção para a Modular continuar certa quando
 * um Addon acrescentar um tipo físico novo, que o espelho daqui não conhece.
 *
 * Devolve o bolso de cada grupo, os limites, as linhas do extrato e os avisos.
 * Ele NUNCA corrige a arma: excedeu, avisa.
 */
export function orcamentoDaArma(arma, opcoes = {}) {
  const a = arma && typeof arma === "object" ? arma : {};
  const props = a.props && typeof a.props === "object" ? a.props : {};
  const criacao = saneiaCriacaoDeArma(a.criacao) ?? createBlankCriacao();
  const grauOrdem = inteiro(opcoes.grauOrdem) || 1;
  const fisicos = Array.isArray(opcoes.tiposFisicos) && opcoes.tiposFisicos.length
    ? opcoes.tiposFisicos
    : TIPOS_FISICOS;

  const classificacao = classificacaoDaArma(a.classe);
  const tecnica = criacao.tecnica === true;
  const custo = tecnica ? custoDeTecnica(grauOrdem) : entre(inteiro(a.custo) || 1, 1, CUSTO_TETO);
  // "Assim como Receberá o dobro de PC e limites provindas deste custo."
  const dobra = tecnica ? 2 : 1;

  const linhas = [];
  const avisos = [];
  const avisar = (id, texto) => avisos.push({ id, texto });
  const linha = (id, rotulo, grupo, pc) => { if (pc !== 0) linhas.push({ id, rotulo, grupo, pc }); };

  /* ---------- o que a arma RENDE ---------- */
  /* A Pesada e a Estabilidade, pela mesma conta. `exigido` é o atributo que a
     arma pede, e `null` quer dizer que a propriedade não está marcada. */
  const exigido = {};
  const credito = {};
  for (const id of PROPRIEDADES_DE_CREDITO) {
    exigido[id] = props[id] != null && props[id] !== false ? inteiro(props[id]) : null;
    credito[id] = exigido[id] == null ? 0 : creditoDeAtributoExigido(exigido[id], custo);
  }
  /* ⚠ SÓ A PESADA COBRA ESPAÇO, e é o único ponto em que as duas divergem. */
  const espacosDePesada = PROPRIEDADES_DE_CREDITO
    .reduce((soma, id) => soma + (CREDITO_COBRA_ESPACO[id] ? credito[id] : 0), 0);
  const creditoEspaco = creditoDeEspaco(a.espacos, espacosDePesada, custo);
  const pcDoCusto = custo * dobra;
  const poolTotal = classificacao.pc + pcDoCusto + creditoEspaco;

  /* ---------- Dano ---------- */
  const gastoDano = pcDoDado(a.dano?.dado);
  linha("dano", `Dado ${a.dano?.dado ?? ""}`.trim(), "dano", gastoDano);

  /* ---------- Margem de crítico ---------- */
  const reducoes = Math.max(0, CRITICO_BASE - (inteiro(a.critico) || CRITICO_BASE));
  const gastoMargem = reducoes * PC_POR_MARGEM;
  const limiteMargem = limiteDeMargem(custo, a.dano?.dado);
  linha("margem", `Margem ${inteiro(a.critico) || CRITICO_BASE}`, "margem", gastoMargem);

  /* ---------- Propriedades ---------- */
  /* ⚠ A ORDEM É A DA MÉTRICA, e não a da arma. `Object.entries(props)` devolve a
     ordem em que a pessoa clicou, e o extrato mudaria de ordem sozinho a cada
     edição. A lista de preços está escrita em ordem alfabética, e é ela que
     manda aqui. */
  let gastoPropriedades = 0;
  const ligada = (id) => props[id] != null && props[id] !== false;
  /* Tudo que a arma tem e a métrica não precifica. Pega a Emperrar e a Recarga,
     que são de arma de fogo, e também qualquer propriedade que um Addon
     acrescente: sem esta varredura ela entraria na bancada custando zero. */
  const foraDoPadrao = Object.keys(props).filter((id) => ligada(id)
    && PC_PROPRIEDADE[id] == null
    && !PROPRIEDADES_DE_CREDITO.includes(id)
    && !PROPRIEDADES_AVALIADAS.includes(id));

  for (const id of [...Object.keys(PC_PROPRIEDADE), ...PROPRIEDADES_DE_CREDITO]) {
    const valor = props[id];
    if (!ligada(id)) continue;
    if (PROPRIEDADES_DE_CREDITO.includes(id)) {
      gastoPropriedades -= credito[id];
      linha(id, `${ROTULOS[id]} ${exigido[id]}`, "propriedades", -credito[id]);
      continue;
    }
    let pc = PC_PROPRIEDADE[id];
    if (pc == null) continue;
    let rotulo = id;
    if (id === "alcance") {
      pc = pcDeAlcance(valor, METROS_ALCANCE);
      rotulo = `Alcance ${Array.isArray(valor) ? valor[0] : valor}m`;
    } else if (id === "arremessavel") {
      pc = pcDeAlcance(valor, METROS_ARREMESSAVEL);
      rotulo = `Arremessável ${Array.isArray(valor) ? valor[0] : valor}m`;
    } else if (id === "fatal" || id === "mortal") {
      // "1 PC dá mortal d8 e 2 PC dá mortal d12."
      pc = valor === "1d12" ? 2 : 1;
      rotulo = `${id === "fatal" ? "Fatal" : "Mortal"} ${valor}`;
    } else {
      rotulo = ROTULOS[id] ?? id;
    }
    gastoPropriedades += pc;
    linha(id, rotulo, "propriedades", pc);
  }

  /* ---------- Especial ---------- */
  const gastoEspecial = props.especial ? criacao.especialPc : 0;
  linha("especial", "Especial", "especial", gastoEspecial);

  /* ---------- limites e sobra ---------- */
  const bonus = { propriedades: 0, dano: 0 };
  if (custo >= 2) bonus[criacao.bonus2] += dobra;
  if (custo >= 4) bonus[criacao.bonus4] += dobra;
  const limites = {
    dano: classificacao.limiteDano + bonus.dano,
    propriedades: classificacao.limiteProp + bonus.propriedades,
    margem: limiteMargem,
    custoMax: classificacao.custoMax,
  };
  const gastoTotal = gastoDano + gastoMargem + gastoPropriedades + gastoEspecial;
  const sobra = poolTotal - gastoTotal;

  /* ---------- avisos ---------- */
  if (sobra < 0) avisar("pc", `Gasto de ${gastoTotal} PC acima dos ${poolTotal} disponíveis`);
  if (gastoDano > limites.dano) avisar("dano", `Dano gasta ${gastoDano} PC e o limite é ${limites.dano}`);
  if (gastoPropriedades > limites.propriedades) {
    avisar("propriedades", `Propriedades gastam ${gastoPropriedades} PC e o limite é ${limites.propriedades}`);
  }
  if (reducoes > limiteMargem) {
    avisar("margem", limiteMargem === 0
      ? `Margem ${inteiro(a.critico)} sem limite para reduzir`
      : `Margem reduzida ${reducoes} vezes e o limite é ${limiteMargem}`);
  }
  if (!tecnica && custo > classificacao.custoMax) {
    avisar("custo", `Custo ${custo} acima do máximo ${classificacao.custoMax} da arma ${classificacao.label}`);
  }
  for (const id of ["fatal", "mortal"]) {
    if (props[id] == null || props[id] === false) continue;
    const nome = id === "fatal" ? "Fatal" : "Mortal";
    if (a.classe !== "complexa") avisar(`${id}Classe`, `${nome} só entra em arma Tática`);
    if (props[id] !== "1d8" && props[id] !== "1d12") avisar(`${id}Dado`, `${nome} aceita 1d8 por 1 PC e 1d12 por 2 PC`);
  }
  if (props.alcance != null && props.alcance !== false) {
    const pc = pcDeAlcance(props.alcance, METROS_ALCANCE);
    if (a.categoria !== "arremesso") avisar("alcanceCategoria", "Alcance só entra em arma de arremesso");
    if (pc > custo) avisar("alcancePc", `Alcance gasta ${pc} PC e o limite é o custo ${custo}`);
  }
  if (props.arremessavel != null && props.arremessavel !== false) {
    const pc = pcDeAlcance(props.arremessavel, METROS_ARREMESSAVEL);
    if (pc > custo) avisar("arremessavelPc", `Arremessável gasta ${pc} PC e o limite é o custo ${custo}`);
  }
  for (const id of PROPRIEDADES_DE_CREDITO) {
    if (exigido[id] == null) continue;
    const nome = ROTULOS[id];
    const bruto = Math.max(0, Math.floor((exigido[id] - 10) / 4));
    if (bruto > credito[id]) {
      avisar(`${id}Limite`, credito[id] === 0
        ? `${nome} não rende PC em arma de custo ${custo}`
        : `${nome} rende no máximo ${credito[id]} PC em arma de custo ${custo}`);
    }
  }
  /* O espaço é cobrança da Pesada, e por isso o aviso é dela e não do laço. */
  if (espacosDePesada > 0 && inteiro(a.espacos) < 1 + espacosDePesada) {
    avisar("pesadaEspacos", `Pesada pede ${1 + espacosDePesada} espaços e a arma tem ${inteiro(a.espacos)}`);
  }
  const espacoBruto = Math.max(0, inteiro(a.espacos) - 1 - espacosDePesada);
  if (espacoBruto > creditoEspaco) {
    avisar("espacoLimite", `Espaços rendem no máximo ${creditoEspaco} PC em arma de custo ${custo}`);
  }
  if (props.modular != null && props.modular !== false && !fisicos.includes(props.modular)) {
    avisar("modular", "Modular adiciona opção de dano físico");
  }
  if (props.especial && criacao.especialPc <= 0) {
    avisar("especial", "Especial ainda sem avaliação de PC");
  }
  for (const id of foraDoPadrao) {
    avisar(`fora_${id}`, `${ROTULOS[id] ?? id} não tem preço no padrão de criação`);
  }

  return {
    classificacao,
    tecnica,
    custo,
    pool: { base: classificacao.pc, custo: pcDoCusto, espaco: creditoEspaco, total: poolTotal },
    gastos: {
      dano: gastoDano,
      margem: gastoMargem,
      propriedades: gastoPropriedades,
      especial: gastoEspecial,
      total: gastoTotal,
    },
    limites,
    bonus,
    sobra,
    linhas,
    avisos,
  };
}
