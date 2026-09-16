/* ============================================================ */
/* CRIAÇÃO DE EQUIPAMENTOS (Addon), FASE 2: ARMAS                */
/* ============================================================ */
/*
 * A seção "Armas" do guia Criação de Equipamentos e Itens 2.5.2, com a de
 * alcance e a de Propriedades Especiais. O guia está copiado sem mudança em
 * `docs/afty-criacao-equipamentos-fonte.md`, e o guia do sistema em
 * `docs/afty-criacao-equipamentos.md`. A fase 1 mora em
 * `afty-criacao-equipamentos.js`.
 *
 * ⚠ A CONTA DECIDE O DADO (autor, 2026-09-14: "Calculado, vira mostrador"). A
 * arma guarda o Custo, a Classe, as propriedades, o crítico e a RECEITA
 * (`arma.niveis`), e o dado sai daqui na leitura. Sem receita a arma segue sendo
 * a arma criada de sempre, com dado digitado.
 *
 * ⚠ E A RECEITA NÃO DEPENDE DO ADDON (autor, mesma data: "Continua com o dado da
 * conta"). Arma criada já existia sem Addon, então o Addon só abre a bancada. É
 * por isso que esta fase é `permite` (primitiva `armasPorNivel`) e a fase 1 é
 * `libera`: aqui instalar o pacote não muda número nenhum, quem muda é a receita.
 *
 * ⚠ NÃO É FOLHA. Importa a escada de Níveis de Dano, que é folha, do mesmo jeito
 * que o `afty-criacao-armas.js`. Um import de volta para o `afty-equipamentos`
 * fecharia o ciclo.
 */

import { moverNivel, nivelDoDado } from "./afty-niveis-dano";

/* ------------------------------------------------------------ */
/* O TEXTO DO GUIA (verbatim, sem a marcação do documento)        */
/* ------------------------------------------------------------ */

export const TEXTO_ARMAS =
  "Ao criar uma Arma, você definirá seu custo, a qual define seu Dano base, seu tipo de Dano, o qual deve ser Físico e pode adicionar propriedades a ela, reduzindo seu nível de dano baseado na tabela abaixo. Ao adicionar as propriedades Duas Mãos, Pesada[x] e Recarga, a Arma recebe +1 nível de dano apenas para a adição de propriedades, não podendo ter seu dano acima do já definido pelo seu custo.";

/** As oito Observações da seção Armas, na ordem do guia. */
export const OBSERVACOES_ARMAS = {
  critico: "Você pode reduzir a margem de crítico em 1 reduzindo 1 Nível de Dano, até no máximo 18. É impossível reduzir abaixo disso.",
  finezaPesada: "Uma Arma não pode ter a propriedade Fineza e Pesada ao mesmo tempo.",
  custoAnterior: "Você pode subir o Custo de uma Arma sem alterar seu dado de dano, utilizando o do custo anterior. Ao fazer isso você garante +2 níveis de dano a Arma para apenas o gasto de propriedades.",
  desarmado: "Ao criar uma Arma que utilize seu Dano DesArmado, a Arma é considerada como se tivesse uma quantidade de Níveis de Dano igual a 1.5x seu custo (Mínimo 1) para cálculos de propriedade",
  recargaUm: "Ao escolher Recarga [1], o Ataque da Arma ganha uma área de 3m em volta de seu alvo como uma Propriedade Especial, causando dano a todos que tiverem uma defesa menor que a Jogada de Ataque realizada. Você pode por um adicional no qual você deve carregar Munições de Custo 1, as quais pesam 1, para aumentar a área em +4,5m. Além disso, a Recarga [1] sempre é Ação Completa.",
  especialRecarga: "Ao adicionar a Propriedade Especial em uma Arma que possui a Propriedade Recarga, a ação necessária para recarregar aumenta de Ação Bônus para Comum.",
  especialExistente: "Não é possível adicionar as Propriedades Especiais já existentes (como a de Manopla) nas Armas criadas.",
  complexa: "Uma Arma Complexa recebe +1 Nível de Dano a Arma para apenas o gasto de Propriedades.",
};

export const TEXTO_ALCANCE =
  "Para o alcance das Armas, por padrão, uma Arma corpo a corpo sempre terá 1,5m a menos que ela possua a propriedade Estendida.";

export const TEXTO_ARMA_DE_FOGO = "Armas de Fogo, como pistolas, sempre devem receber as propriedades: Emperrar e Recarga[X]";

export const TEXTO_PROPRIEDADES_ESPECIAIS = {
  abertura: "Além das listadas no livro, que devem seguir a mesma base das Armas apresentadas, você pode criar Propriedades especiais personalizadas a Armas junto ao Narrador",
  bonus: "Se for um Valor Numérico, você pode adicionar um bônus de até no máximo +2 em alguma rolagem que não seja Jogadas de Ataque.",
  treino: "Treinamentos também podem ser adicionados, garantindo treinamento em 2 perícias ou em   1 Teste de Resistência. Esse efeito não pode conceder Mestre em Perícia ou Ofício.",
  cenario: "Propriedades podem interagir com o cenário de várias formas. Como, por exemplo, aplicar Terreno Difícil no quadrado do alvo atingido, mas não devem, de forma alguma, aplicar condições. Lembre-se sempre de conversar com seu Narrador.",
};

/* ------------------------------------------------------------ */
/* AS TABELAS                                                    */
/* ------------------------------------------------------------ */

/** "Todas as Armas criadas possuem o seu dano inicial igual". O Peso fica só
    como referência: o autor decidiu em 2026-09-14 que os espaços continuam livres. */
export const TABELA_ARMA = [
  { custo: 1, dano: "1d12", critico: 20, peso: 1 },
  { custo: 2, dano: "2d10", critico: 20, peso: 2 },
  { custo: 3, dano: "2d12", critico: 20, peso: 3 },
  { custo: 4, dano: "3d10", critico: 20, peso: 4 },
];

/**
 * A tabela de propriedades, com o sinal do guia: negativo é Nível de Dano
 * perdido, positivo é Nível ganho "apenas para a adição de propriedades".
 * As três de faixa (Fatal, Mortal, Pesada e Recarga) têm função própria abaixo.
 */
export const NIVEIS_PROPRIEDADE = {
  ampla: -1,
  aparar: -1,
  apunhaladora: -1,
  fineza: 0,
  duas_maos: 1,
  dupla: -2,
  energica: -1,
  estendida: -1,
  especial: 0,
  versatil: -1,
  leve: 0,
  marcial: -1,
  modular: -1,
  oscilante: -1,
};

/* ⚠ SEM PREÇO NA TABELA, E DE GRAÇA (autor, 2026-09-14). As três aparecem nas
   armas do livro e não na tabela do guia. */
export const PROPRIEDADES_GRATIS = ["arremessavel", "alcance", "emperrar"];

/* ⚠ FORA DO GUIA. A Estabilidade chegou com a Criação de Armas (Pontos de
   Criação), que não liga junto com esta. A bancada não a oferece, e uma arma que
   já a tenha gravada recebe aviso em vez de preço inventado. */
export const PROPRIEDADES_FORA_DO_GUIA = ["estabilidade"];

/* "Mortal (d8) -1 Nível por passo" e o mesmo na Fatal. O autor, 2026-09-14:
   "d8 (1) > d10 (2) > d12 (3) e por ai vai. Não tem d4 e d6". */
export const PASSO_DADO_PROPRIEDADE = { "1d8": 1, "1d10": 2, "1d12": 3 };
export const DADOS_PROPRIEDADE = Object.keys(PASSO_DADO_PROPRIEDADE);

/* Pesada [12 a 14] +1 e [16 a 20] +2. O autor, 2026-09-14: "Não existe pesada
   abaixo de 12. E não permita o Pesada 15." */
export const PESADA_VALORES = [12, 13, 14, 16, 17, 18, 19, 20];
export const creditoDaPesada = (x) => (x >= 16 && x <= 20 ? 2 : x >= 12 && x <= 14 ? 1 : 0);

/* Recarga [13 ou mais] +1, [12 ou menos] +2, [7 ou menos] +3 e [1] +3. As faixas
   se sobrepõem, e o autor decidiu em 2026-09-14 que vale só a mais estreita. */
export const creditoDaRecarga = (x) => {
  const n = Math.trunc(Number(x));
  if (!Number.isFinite(n) || n < 1) return 0;
  if (n === 1) return 3;
  if (n <= 7) return 3;
  if (n <= 12) return 2;
  return 1;
};

export const CRITICO_MINIMO = 18;
export const CREDITO_COMPLEXA = 1;
export const CREDITO_CUSTO_ANTERIOR = 2;
/** "1.5x seu custo (Mínimo 1)", arredondado para baixo como todo o sistema. */
export const niveisDoDesarmado = (custo) => Math.max(1, Math.floor(1.5 * custo));

/* O grupo que o guia chama de Armas de Fogo. É o "Tiro" da ficha, onde moram a
   Pistola, os rifles, a Escopeta, a Metralhadora e a Bazuca. */
export const GRUPO_ARMA_DE_FOGO = "tiro";

/* ------------------------------------------------------------ */
/* ALCANCE                                                       */
/* ------------------------------------------------------------ */
/* As duas tabelas do guia, verbatim, com `null` onde o guia escreve "-". Linhas
   são o Custo, colunas são o Grau: 4°, 3°, 2°, 1° e Especial.

   Decisões do autor em 2026-09-14:
   • A coluna é o grau da FERRAMENTA, e arma sem Ferramenta usa o 4° Grau.
   • O "-" repete o maior alcance, porque a tabela anda na diagonal e o "-" é
     onde ela passaria do topo.
   • A tabela sai da Classe: De Arremesso e A Distância Simples usam a 1, e A
     Distância Complexa usa a 2. Bate com o livro: Arco Curto, Besta Leve e
     Pistola são Simples, Arco Longo, Besta Pesada e os rifles são Complexas. */
export const GRAUS_ALCANCE = ["quarto", "terceiro", "segundo", "primeiro", "especial"];

export const TABELAS_ALCANCE = {
  1: {
    nome: "Arcos curto, Pistola, Besta (Geral) e Arremesso (Geral)",
    linhas: [
      [[9, 18], [18, 21], [21, 27], [27, 36], [36, 48]],
      [[18, 21], [21, 27], [27, 36], [36, 48], null],
      [[21, 27], [27, 36], [36, 48], null, null],
      [[27, 36], [36, 48], null, null, null],
    ],
  },
  2: {
    nome: "Arco Longo, Armas de fogo(Menos Pistolas) e Besta Pesada",
    linhas: [
      [[18, 30], [30, 60], [60, 90], [90, 120], [120, 240]],
      [[30, 60], [60, 90], [90, 120], [120, 240], null],
      [[60, 90], [90, 120], [120, 240], null, null],
      [[90, 120], [120, 240], null, null, null],
    ],
  },
};

/** Qual das duas tabelas vale para a arma, ou `null` na corpo a corpo. */
export function tabelaDeAlcance(arma) {
  if (arma?.categoria === "arremesso") return 1;
  if (arma?.categoria === "distancia") return arma.classe === "complexa" ? 2 : 1;
  return null;
}

/** O alcance [curto, longo] de cada grau, ou `null` na corpo a corpo. */
export function alcancePorGrau(arma) {
  const t = tabelaDeAlcance(arma);
  if (!t) return null;
  const custo = Math.min(4, Math.max(1, Math.trunc(Number(arma.custo)) || 1));
  const linha = TABELAS_ALCANCE[t].linhas[custo - 1];
  const maior = [...linha].reverse().find(Boolean);
  return Object.fromEntries(GRAUS_ALCANCE.map((g, i) => [g, [...(linha[i] ?? maior)]]));
}

/* ------------------------------------------------------------ */
/* A RECEITA NA ARMA                                             */
/* ------------------------------------------------------------ */
/* `arma.niveis = { custoAnterior, desarmado, especiais: [...] }`. Todo o resto
   (Custo, Classe, Categoria, Grupo, tipo de dano, crítico e propriedades) já era
   campo da arma criada, e a conta os LÊ.

   Os efeitos da Propriedade Especial personalizada, quantos a pessoa quiser
   (autor, 2026-09-14), cada um de um destes formatos:
     { tipo: "bonus", rolagem: "pericia" | "tr" | "iniciativa" | "dano", alvo, valor }
     { tipo: "treinoPericias", alvos: [a, b] }
     { tipo: "treinoTR", alvo }
     { tipo: "cenario", texto } */

export const ROLAGENS_BONUS = [
  { value: "pericia", label: "Perícia" },
  { value: "tr", label: "Teste de Resistência" },
  { value: "iniciativa", label: "Iniciativa" },
  { value: "dano", label: "Dano" },
];
export const TIPOS_ESPECIAL = [
  { value: "bonus", label: "Bônus" },
  { value: "treinoPericias", label: "Treino em Perícias" },
  { value: "treinoTR", label: "Treino em Resistência" },
  { value: "cenario", label: "Cenário" },
];
export const BONUS_ESPECIAL_MAXIMO = 2;

const texto = (v) => (typeof v === "string" ? v : "");

function saneiaEspecial(b) {
  if (!b || typeof b !== "object") return null;
  if (b.tipo === "bonus") {
    const rolagem = ROLAGENS_BONUS.some((r) => r.value === b.rolagem) ? b.rolagem : "pericia";
    const valor = Math.min(BONUS_ESPECIAL_MAXIMO, Math.max(1, Math.trunc(Number(b.valor)) || BONUS_ESPECIAL_MAXIMO));
    return { tipo: "bonus", rolagem, alvo: texto(b.alvo), valor };
  }
  if (b.tipo === "treinoPericias") {
    const alvos = (Array.isArray(b.alvos) ? b.alvos : []).slice(0, 2).map(texto);
    while (alvos.length < 2) alvos.push("");
    return { tipo: "treinoPericias", alvos };
  }
  if (b.tipo === "treinoTR") return { tipo: "treinoTR", alvo: texto(b.alvo) };
  if (b.tipo === "cenario") return { tipo: "cenario", texto: texto(b.texto) };
  return null;
}

/** A receita saneada, ou `null` quando a arma não usa a conta do guia. */
export function saneiaReceitaNiveis(bruta) {
  if (!bruta || typeof bruta !== "object" || Array.isArray(bruta)) return null;
  return {
    custoAnterior: !!bruta.custoAnterior,
    desarmado: !!bruta.desarmado,
    especiais: (Array.isArray(bruta.especiais) ? bruta.especiais : []).map(saneiaEspecial).filter(Boolean),
  };
}

/** Uma receita nova: tudo desligado e nenhum efeito especial. */
export const novaReceitaNiveis = () => ({ custoAnterior: false, desarmado: false, especiais: [] });

/**
 * As linhas do Motor que a Propriedade Especial personalizada emite enquanto a
 * arma está equipada. Só existe com a propriedade Especial marcada. Efeito sem
 * alvo não vira linha, porque ele é o seletor que a pessoa acabou de abrir.
 *
 * ⚠ O treino é faixa 1 (Treinado) e nunca 2: "Esse efeito não pode conceder
 * Mestre em Perícia ou Ofício". O canal nunca rebaixa o que a ficha já escolheu.
 */
export function efeitosDaEspecial(arma) {
  const receita = saneiaReceitaNiveis(arma?.niveis);
  if (!receita || !arma?.props?.especial) return [];
  const out = [];
  for (const e of receita.especiais) {
    if (e.tipo === "bonus") {
      if (e.rolagem === "iniciativa") out.push({ canal: "iniciativa", expr: String(e.valor) });
      else if (e.rolagem === "dano") out.push({ canal: "danoBonus", alvo: arma.id, expr: String(e.valor) });
      else if (e.alvo) out.push({ canal: e.rolagem === "tr" ? "bonusTR" : "bonusPericia", alvo: e.alvo, expr: String(e.valor) });
    } else if (e.tipo === "treinoPericias") {
      for (const alvo of new Set(e.alvos.filter(Boolean))) out.push({ canal: "proficienciaPericia", alvo, expr: "1" });
    } else if (e.tipo === "treinoTR" && e.alvo) {
      out.push({ canal: "proficienciaTR", alvo: e.alvo, expr: "1" });
    }
  }
  return out;
}

/* ------------------------------------------------------------ */
/* A CONTA                                                       */
/* ------------------------------------------------------------ */

const dadoDoCusto = (custo) => TABELA_ARMA.find((l) => l.custo === custo)?.dano ?? TABELA_ARMA[0].dano;
const ROTULOS = {
  ampla: "Ampla", aparar: "Aparar", apunhaladora: "Apunhaladora", duas_maos: "Duas Mãos", dupla: "Dupla",
  energica: "Energética", estendida: "Estendida", versatil: "Versátil", marcial: "Marcial", modular: "Modular",
  oscilante: "Oscilante", fatal: "Fatal", mortal: "Mortal", pesada: "Pesada", recarga: "Recarga",
};

/**
 * A conta de uma arma criada pelo guia. `arma` é a arma com os campos dela
 * (Custo, Classe, Categoria, Grupo, dano, crítico, props) e a receita em
 * `niveis`. `tiposFisicos` é a lista viva de tipos físicos, porque um Addon
 * pode acrescentar um.
 *
 * Devolve o dado de uma mão e o de duas, o alcance por grau, as linhas de cada
 * propriedade com o sinal do guia, e os avisos. ⚠ A CONTA NÃO CORRIGE a arma:
 * ela avisa o que está fora do guia, e o dado nunca desce abaixo do degrau "1"
 * da escada.
 */
export function contaDaArmaPorNivel(arma, { tiposFisicos = ["ct", "im", "pf"] } = {}) {
  const receita = saneiaReceitaNiveis(arma?.niveis) ?? novaReceitaNiveis();
  const props = arma?.props ?? {};
  const custo = Math.min(4, Math.max(1, Math.trunc(Number(arma?.custo)) || 1));
  const avisos = [];
  const aviso = (id, t) => avisos.push({ id, texto: t });
  const linhas = [];
  const linha = (id, rotulo, niveis) => { if (niveis) linhas.push({ id, rotulo, niveis }); };

  const desarmado = receita.desarmado;
  const custoAnterior = !desarmado && receita.custoAnterior && custo > 1;
  if (receita.custoAnterior && custo === 1 && !desarmado) aviso("custoAnteriorC1", "O Custo 1 não tem Custo anterior");
  const custoUsado = custoAnterior ? custo - 1 : custo;
  const dadoBase = dadoDoCusto(custoUsado);
  const nivelBase = desarmado ? niveisDoDesarmado(custo) : nivelDoDado(dadoBase);

  // Propriedades, na ordem do catálogo que a arma trouxer.
  for (const [id, valor] of Object.entries(props)) {
    if (valor == null || valor === false) continue;
    if (id in NIVEIS_PROPRIEDADE) linha(id, ROTULOS[id] ?? id, NIVEIS_PROPRIEDADE[id]);
    else if (id === "fatal" || id === "mortal") {
      const passo = PASSO_DADO_PROPRIEDADE[valor];
      if (!passo) aviso(`${id}Dado`, `${ROTULOS[id]} ${valor} não existe no guia`);
      linha(id, `${ROTULOS[id]} ${valor}`, -(passo ?? 1));
    } else if (id === "pesada") {
      const credito = creditoDaPesada(Number(valor));
      if (!credito) aviso("pesadaValor", `Pesada ${valor} não existe no guia`);
      linha(id, `Pesada ${valor}`, credito);
    } else if (id === "recarga") {
      linha(id, `Recarga ${valor}`, creditoDaRecarga(valor));
    } else if (PROPRIEDADES_FORA_DO_GUIA.includes(id)) {
      aviso(`${id}Fora`, `${id === "estabilidade" ? "Estabilidade" : id} não está no guia`);
    }
  }

  const reducoesCritico = Math.max(0, 20 - (Math.trunc(Number(arma?.critico)) || 20));
  if (reducoesCritico) linha("critico", `Crítico ${20 - reducoesCritico}`, -reducoesCritico);
  if ((Math.trunc(Number(arma?.critico)) || 20) < CRITICO_MINIMO) aviso("criticoMinimo", "A margem de crítico não desce abaixo de 18");
  if (arma?.classe === "complexa") linha("complexa", "Complexa", CREDITO_COMPLEXA);
  if (custoAnterior) linha("custoAnterior", "Dado do Custo Anterior", CREDITO_CUSTO_ANTERIOR);

  const gasto = linhas.filter((l) => l.niveis < 0).reduce((s, l) => s - l.niveis, 0);
  const credito = linhas.filter((l) => l.niveis > 0).reduce((s, l) => s + l.niveis, 0);
  const reducao = Math.max(0, gasto - credito);

  if (props.fineza && props.pesada != null) aviso("finezaPesada", "Fineza e Pesada não ficam juntas");
  if (arma?.grupo === GRUPO_ARMA_DE_FOGO) {
    if (!props.emperrar) aviso("fogoEmperrar", "Arma de Fogo pede Emperrar");
    if (props.recarga == null) aviso("fogoRecarga", "Arma de Fogo pede Recarga");
  }
  if (!desarmado && arma?.dano?.tipo && !tiposFisicos.includes(arma.dano.tipo)) {
    aviso("tipoFisico", "O dano da arma criada é Físico");
  }

  let dado = null;
  let duasMaos = null;
  if (desarmado) {
    if (reducao > nivelBase) aviso("desarmadoExcedido", `Propriedades acima dos ${nivelBase} Níveis do Dano Desarmado`);
  } else {
    if (reducao > nivelBase) aviso("dadoExcedido", "Propriedades abaixo do menor dado");
    // Sem redução o dado é o IMPRESSO da tabela (o 3d10 continua 3d10). Com
    // redução ele anda na escada do livro.
    dado = reducao ? moverNivel(dadoBase, -Math.min(reducao, nivelBase)).texto : dadoBase;
    if (props.versatil) duasMaos = moverNivel(dado, 1).texto;
  }

  return {
    custo,
    custoUsado,
    dadoBase: desarmado ? null : dadoBase,
    nivelBase,
    desarmado,
    linhas,
    gasto,
    credito,
    reducao,
    dado,
    duasMaos,
    alcance: alcancePorGrau(arma),
    avisos,
  };
}
