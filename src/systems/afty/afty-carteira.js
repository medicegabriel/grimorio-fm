/**
 * ============================================================
 * CARTEIRA — o livro-caixa das sessões da Guilda
 * ============================================================
 * Pedido do autor em 2026-09-08: *"Preciso de o Addon de uma aba chamada
 * 'Carteira' [...] Ela serve para anotar o XP, Interludios e Dinheiro recebido
 * em Sessões da Guilda"*, com a planilha de Google Sheets dele em anexo como
 * modelo (duas tabelas, "Entrada de Recursos" e "Controle de Transações", com
 * uma coluna de totais entre as duas).
 *
 * ------------------------------------------------------------
 * O QUE ESTE MÓDULO É, E O QUE ELE NÃO É
 * ------------------------------------------------------------
 * Ele é o VERBO: somar um livro-caixa e devolver o extrato. O SUBSTANTIVO (as
 * linhas, quanto cada sessão rendeu) mora na ficha, e quem abre a aba é o
 * Addon. É a mesma divisão do resto do sistema de Addons, escrita em
 * docs/afty-addons.md.
 *
 * ⚠ É MÓDULO FOLHA, sem nenhum import, e isso não é estilo. A aba entra cedo no
 * `AftyCreatureBuilder`, e foi exatamente esse caminho que deixou o app em tela
 * branca em 2026-09-02 com a aba de Defesas. Ver `asserts/t-ordem-modulos.mjs`
 * e o mesmo aviso no topo de `afty-catarse.js`.
 *
 * ------------------------------------------------------------
 * AS TRÊS DECISÕES DO AUTOR (2026-09-08)
 * ------------------------------------------------------------
 * 1. **Duas listas, e não uma.** As Entradas são o que ENTRA (Nome, XP, $,
 *    Interlúdios, Tipo) e os Gastos são o que SAI. Sem a segunda lista o
 *    "Dinheiro Atual" seria sempre igual ao Total, porque nada nunca sairia, e
 *    a planilha do autor tem as duas tabelas lado a lado.
 *
 * 2. **Os Interlúdios da Carteira VIRAM o orçamento de Focos.** Isso muda
 *    número, então não basta o `permite`: pede também a liberação
 *    `carteiraFocos`. Ver `focosTotais` no `afty-derive.js`, e a nota de
 *    `LIBERACOES` em `afty-addons.js` sobre a diferença entre os dois campos.
 *
 * 3. **Os totais ficam grudados no topo da aba**, e não numa segunda aba: eles
 *    são o número que a pessoa consulta a cada linha que lança. É a mesma
 *    escolha da faixa da Loja de Catarse e da barra de resultado da Invocação.
 *
 * ------------------------------------------------------------
 * ⚠ O DINHEIRO E O XP SÃO DECIMAIS, E O INTERLÚDIO É INTEIRO
 * ------------------------------------------------------------
 * A planilha do autor tem `$ 1.050,00` e `10,5` de XP, então cortar para
 * inteiro perderia metade das linhas dele. Os dois somam em ponto flutuante e o
 * TOTAL é arredondado em duas casas (centavos), senão `0.1 + 0.2` chegaria à
 * tela como `0.30000000000000004`.
 *
 * ⚠ O arredondamento aqui é o de CENTAVO, e não o `floor` do resto do Afty. A
 * regra do floor vale para fórmula de sistema (metade de nível, bônus por
 * patamar), e não para somar dinheiro que a pessoa digitou: `floor` num extrato
 * comeria os centavos de cada total.
 *
 * ------------------------------------------------------------
 * ⚠ ENTRADA ACEITA NEGATIVO, GASTO NÃO
 * ------------------------------------------------------------
 * A Entrada é onde a correção cabe ("o mestre tirou 2 Interlúdios lançados a
 * mais"), e para XP e Interlúdio ela é o ÚNICO lugar: não existe lista de gasto
 * de XP. Já um Gasto negativo seria uma entrada de dinheiro, e a lista de
 * Entradas está logo acima, então ele é aparado em zero.
 *
 * É a mesma razão do custo negativo recusado em `afty-catarse.js`: valor que
 * anda para o lado errado numa lista vira uma segunda porta calada para a
 * regra, e o projeto só aceita uma porta por regra.
 * ============================================================
 */

/* ============================================================ */
/* OS TIPOS DE SESSÃO                                            */
/* ============================================================ */
/**
 * O que a sessão FOI. A lista é do autor, e a entrada neutra existe porque a
 * planilha dele mostra um traço em quase metade das linhas: a Lojinha de PA, o
 * salário, os membros novos, o que não é sessão nenhuma.
 *
 * ⚠ "BÔNUS EXTERNOS" SAIU em 2026-09-08, e no mesmo dia entraram Domingo,
 * Transferência e Staff. A ficha que já tiver `externo` gravado NÃO perde nada:
 * a linha continua na lista com os números dela, o tipo cai no neutro, o valor
 * antigo fica em `tipoCru` para a tela mostrar no `title`, e o extrato avisa.
 * É o mesmo caminho de qualquer tipo desconhecido, e é a razão de ele existir.
 *
 * ⚠ O TIPO NÃO ENTRA EM CONTA NENHUMA. Ele é etiqueta, e os três números da
 * linha valem igual em qualquer tipo. Por isso uma linha com tipo desconhecido
 * NÃO vira linha morta (o que a Loja de Catarse faz com família desconhecida):
 * lá a família decide o canal, e aqui não decide nada.
 */
export const CARTEIRA_TIPOS = [
  { id: "", label: "Sem Tipo" },
  { id: "jogada", label: "Jogada" },
  { id: "mestrado", label: "Mestrado" },
  { id: "domingo", label: "Domingo" },
  { id: "transferencia", label: "Transferência" },
  { id: "staff", label: "Staff" },
  { id: "outros", label: "Outros" },
];

/**
 * O que o gasto FOI. Os dois primeiros são os da planilha do autor (Compra e
 * Transação), e o terceiro é a saída para o que não é nenhum dos dois.
 */
export const CARTEIRA_GASTO_TIPOS = [
  { id: "", label: "Sem Tipo" },
  { id: "compra", label: "Compra" },
  { id: "transacao", label: "Transação" },
  { id: "outros", label: "Outros" },
];

const TIPO_IDS = new Set(CARTEIRA_TIPOS.map((t) => t.id));
const GASTO_TIPO_IDS = new Set(CARTEIRA_GASTO_TIPOS.map((t) => t.id));

/** O rótulo daquele tipo de sessão, ou o próprio id quando ele é desconhecido. */
export const rotuloTipoCarteira = (id) =>
  CARTEIRA_TIPOS.find((t) => t.id === id)?.label ?? String(id ?? "");

/** O rótulo daquele tipo de gasto, ou o próprio id quando ele é desconhecido. */
export const rotuloGastoCarteira = (id) =>
  CARTEIRA_GASTO_TIPOS.find((t) => t.id === id)?.label ?? String(id ?? "");

/* ============================================================ */
/* LINHAS EM BRANCO                                              */
/* ============================================================ */
const novoId = (prefixo) => `${prefixo}_${Math.random().toString(36).slice(2, 10)}`;

/** Uma sessão em branco, para a tela criar linha nova. */
export function createBlankEntradaCarteira() {
  return { id: novoId("car"), nome: "", xp: 0, dinheiro: 0, interludios: 0, tipo: "" };
}

/** Um gasto em branco, para a tela criar linha nova. */
export function createBlankGastoCarteira() {
  return { id: novoId("gas"), nome: "", fonte: "", tipo: "", valor: 0 };
}

/* ============================================================ */
/* SANEAMENTO                                                    */
/* ============================================================ */
/**
 * Número da tela virando número de verdade, com a VÍRGULA do teclado
 * brasileiro valendo como decimal.
 *
 * ⚠ OS CAMPOS DE XP E DINHEIRO SÃO `type="text"`, e este parser é a razão. Um
 * `input[type=number]` entrega string VAZIA quando o que está escrito nele não
 * casa com o formato que o navegador espera, e a vírgula cai exatamente nesse
 * caso em boa parte das combinações de navegador e idioma: a pessoa digita
 * "10,5" e o campo devolve "", ou seja, o valor some enquanto se digita. Com
 * texto, o rascunho guarda o que foi digitado e quem interpreta é aqui.
 *
 * A regra de leitura, quando vem string:
 *
 *   • tem vírgula  -> a vírgula é o decimal e os pontos são milhar
 *                     ("1.050,00" vira 1050)
 *   • não tem      -> o ponto é o decimal, como em JS ("1.5" vira 1.5)
 *
 * ⚠ RESTA UM CASO AMBÍGUO, e ele fica assumido: "1.050" sem vírgula nenhuma é
 * lido como 1,05. Não há como distinguir milhar de decimal aí sem adivinhar, e
 * adivinhar erraria o outro lado. Quem escreve mil e cinquenta digita "1050" ou
 * "1.050,00", e os dois caem certos.
 *
 * ⚠ O CAMPO VAZIO VALE ZERO, e não NaN, senão apagar o campo para trocar o
 * número deixaria a linha inteira sem total no meio da digitação.
 *
 * ⚠ E QUEM SANEIA É O RESOLVEDOR, e nunca o caminho de edição. Cortar o número
 * a cada tecla come o estado intermediário que digitar é, e foi o defeito que
 * tirou o Motor da aba de Catarse do ar em 2026-09-04. Ver `patchCarteira` no
 * `AftyCreatureBuilder`.
 */
const numero = (v) => {
  if (typeof v === "string") {
    const limpo = v.includes(",")
      ? v.replace(/\./g, "").replace(",", ".")
      : v;
    const n = Number(limpo.trim());
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const inteiro = (v) => {
  const n = Math.trunc(numero(v));
  return Number.isFinite(n) ? n : 0;
};

/** Duas casas, para o total de dinheiro não virar dízima de ponto flutuante. */
const centavos = (v) => Math.round(numero(v) * 100) / 100;

/**
 * Uma sessão saneada, ou `null` quando a linha não é nem objeto.
 *
 * ⚠ LINHA SEM NOME NÃO É DESCARTADA. Ela nasce assim: o botão cria a linha
 * vazia e a pessoa digita o nome depois. Descartá-la aqui a faria sumir da tela
 * antes da primeira tecla, que é o mesmo defeito do parágrafo acima.
 */
export function normalizaEntradaCarteira(bruta) {
  if (!bruta || typeof bruta !== "object") return null;
  const tipoCru = String(bruta.tipo ?? "");
  return {
    id: String(bruta.id ?? "") || novoId("car"),
    nome: String(bruta.nome ?? ""),
    xp: centavos(bruta.xp),
    dinheiro: centavos(bruta.dinheiro),
    interludios: inteiro(bruta.interludios),
    tipo: TIPO_IDS.has(tipoCru) ? tipoCru : "",
    /* O que estava gravado, quando o tipo não é mais um dos conhecidos. A tela
       o mostra no `title` da linha, e os números dela seguem valendo. */
    ...(TIPO_IDS.has(tipoCru) ? {} : { tipoCru }),
  };
}

/** Um gasto saneado, ou `null` quando a linha não é nem objeto. */
export function normalizaGastoCarteira(bruto) {
  if (!bruto || typeof bruto !== "object") return null;
  const tipoCru = String(bruto.tipo ?? "");
  return {
    id: String(bruto.id ?? "") || novoId("gas"),
    nome: String(bruto.nome ?? ""),
    fonte: String(bruto.fonte ?? ""),
    tipo: GASTO_TIPO_IDS.has(tipoCru) ? tipoCru : "",
    // Ver o cabeçalho: gasto negativo é entrada, e a lista de entradas existe.
    valor: Math.max(0, centavos(bruto.valor)),
    ...(GASTO_TIPO_IDS.has(tipoCru) ? {} : { tipoCru }),
  };
}

/* ============================================================ */
/* A TABELA DE PROGRESSÃO                                        */
/* ============================================================ */
/**
 * Quanto de XP cada nível pede. Tabela do autor (2026-09-08), do 4 ao 30.
 *
 * ⚠ ZERO DE XP É O NÍVEL 3, e não o 1. Autor, no mesmo dia: *"Quando estamos
 * usando esse Addon. Sempre começamos com 0 de XP no Nível 3"*. É o piso da
 * tabela, e por coincidência feliz é o mesmo piso que o campo de Nível da ficha
 * de criatura já usava.
 *
 * ⚠ AS OUTRAS DUAS COLUNAS DA TABELA DELE NÃO ESTÃO AQUI, e a ausência é a
 * decisão. O "+N" é a `maestria(nd)` do afty-derive.js e o Grau é o
 * `AFTY_GRAUS_CRIATURA` do afty-equipamentos.js: os dois existem desde antes
 * deste addon, e os dois batem com o que ele mandou, linha por linha (Nível 5
 * vira Terceiro Grau, 9 Segundo, 13 Primeiro, 17 Semi-Grau Especial, e a
 * Maestria sobe em 5, 9, 13, 17, 21 e 26).
 *
 * Copiá-las para cá criaria uma SEGUNDA tabela para a mesma regra, e aí uma
 * errata teria dois donos. Esta tabela responde uma pergunta que o sistema não
 * sabia responder ("que nível este XP compra") e para aí.
 *
 * ⚠ ACIMA DE 600 O NÍVEL PARA EM 30, porque a tabela para. Isso encontra o teto
 * de nível da Ficha de Jogador, que também é 30 desde 2026-08-30.
 */
export const CARTEIRA_NIVEL_BASE = 3;

export const CARTEIRA_XP_POR_NIVEL = [
  { nivel: 4, xp: 10 },
  { nivel: 5, xp: 15 },
  { nivel: 6, xp: 20 },
  { nivel: 7, xp: 30 },
  { nivel: 8, xp: 40 },
  { nivel: 9, xp: 50 },
  { nivel: 10, xp: 60 },
  { nivel: 11, xp: 75 },
  { nivel: 12, xp: 90 },
  { nivel: 13, xp: 110 },
  { nivel: 14, xp: 125 },
  { nivel: 15, xp: 140 },
  { nivel: 16, xp: 160 },
  { nivel: 17, xp: 180 },
  { nivel: 18, xp: 200 },
  { nivel: 19, xp: 220 },
  { nivel: 20, xp: 240 },
  { nivel: 21, xp: 270 },
  { nivel: 22, xp: 300 },
  { nivel: 23, xp: 330 },
  { nivel: 24, xp: 360 },
  { nivel: 25, xp: 390 },
  { nivel: 26, xp: 430 },
  { nivel: 27, xp: 470 },
  { nivel: 28, xp: 510 },
  { nivel: 29, xp: 550 },
  { nivel: 30, xp: 600 },
];

/**
 * O nível que aquele XP compra.
 *
 * ⚠ A COMPARAÇÃO É `>=`, ou seja, o XP da linha JÁ dá o nível dela: 10 de XP é
 * nível 4, e não "quase". É como toda tabela de progressão de RPG se lê, e o
 * contrário faria o jogador ficar um degrau atrás do que a tabela do autor diz.
 *
 * ⚠ XP QUEBRADO NÃO ARREDONDA PARA CIMA. Com 9,5 o nível é 3: meio ponto de XP
 * não é o ponto que falta. O `>=` já garante isso, e está escrito porque a
 * Carteira aceita decimal e alguém vai perguntar.
 */
export function nivelPorXp(xp) {
  const total = numero(xp);
  let nivel = CARTEIRA_NIVEL_BASE;
  for (const linha of CARTEIRA_XP_POR_NIVEL) {
    if (total < linha.xp) break;
    nivel = linha.nivel;
  }
  return nivel;
}

/**
 * O nível que o XP anotado NESTA ficha compra.
 *
 * ⚠ ELA NÃO PERGUNTA SE A LIBERAÇÃO ESTÁ LIGADA, e não pode: este módulo é
 * FOLHA e não importa o `afty-addons`. Quem junta as duas perguntas é o
 * `nivelDaFicha`, lá. Aqui a resposta é sempre "que nível este XP compraria".
 */
export const nivelDaCarteira = (creature) => nivelPorXp(resolveCarteira(creature).xpTotal);

/** A próxima linha da tabela, ou `null` no fim dela. Serve o `title` da tela. */
export function proximoNivelCarteira(xp) {
  const total = numero(xp);
  const linha = CARTEIRA_XP_POR_NIVEL.find((l) => total < l.xp);
  return linha ? { nivel: linha.nivel, xp: linha.xp, falta: centavos(linha.xp - total) } : null;
}

/* ============================================================ */
/* ORDEM E FILTRO                                                */
/* ============================================================ */
/**
 * Move uma linha para a posição de outra, e devolve a lista nova.
 *
 * ⚠ ELA É POR ID, e não por índice, e isso é o que faz o arrastar continuar
 * certo COM FILTRO LIGADO. Com a lista filtrada, o índice do que está na tela
 * não é o índice da ficha, e mover "do 2 para o 5" acertaria outra linha. Por
 * id, "põe A onde B está" é a mesma frase nas duas listas, e as linhas
 * escondidas guardam a posição relativa delas.
 *
 * ⚠ Espelha o `reordenarPericia` do builder de propósito, inclusive no
 * `+ (de <= para ? 1 : 0)`: descendo, a linha entra DEPOIS do alvo, e subindo,
 * ANTES. É o que todo sortable faz, e divergir disso faria a linha parar um
 * degrau longe de onde o dedo soltou.
 */
export function moverNaCarteira(lista, id, alvoId) {
  const atual = Array.isArray(lista) ? lista : [];
  if (!id || !alvoId || id === alvoId) return atual;
  const de = atual.findIndex((l) => l?.id === id);
  if (de < 0) return atual;
  const movida = atual[de];
  const next = [...atual];
  next.splice(de, 1);
  const para = next.findIndex((l) => l?.id === alvoId);
  if (para < 0) return atual;
  next.splice(para + (de <= para ? 1 : 0), 0, movida);
  return next;
}

/* Busca SEM acento dos dois lados. Sem isto, digitar "sessao" não acha
   "Sessão", e ninguém digita acento numa caixa de busca. Mesma função do
   `semAcento` do builder, copiada porque este módulo é FOLHA. */
const semAcento = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * As linhas que passam pelo filtro da aba.
 *
 * ⚠ O FILTRO É SÓ DE TELA, e não encosta em total nenhum. Os cinco números da
 * faixa continuam somando a ficha INTEIRA, porque eles respondem "quanto eu
 * tenho" e não "quanto aparece agora". Um total que mudasse junto com o filtro
 * seria a forma mais fácil de alguém ler o saldo errado.
 *
 * ⚠ E O TIPO NEUTRO CASA COM O QUE A TELA MOSTRA. Uma linha com tipo
 * desconhecido aparece no `<select>` como "Sem Tipo", então filtrar por "Sem
 * Tipo" tem de trazê-la também: filtrar pelo valor CRU deixaria de fora
 * exatamente a linha que a pessoa está procurando arrumar.
 */
export function filtraLinhasCarteira(lista, { tipo = "todos", termo = "", tipos = CARTEIRA_TIPOS } = {}) {
  const conhecidos = new Set(tipos.map((t) => t.id));
  const busca = semAcento(termo).trim();
  return (Array.isArray(lista) ? lista : []).filter((linha) => {
    if (tipo !== "todos") {
      const cru = String(linha?.tipo ?? "");
      if ((conhecidos.has(cru) ? cru : "") !== tipo) return false;
    }
    if (!busca) return true;
    return semAcento(`${linha?.nome ?? ""} ${linha?.fonte ?? ""}`).includes(busca);
  });
}

/* ============================================================ */
/* O RESOLVEDOR                                                  */
/* ============================================================ */
/**
 * Lê `creature.carteira` e devolve o extrato: os cinco números da coluna do
 * meio da planilha do autor, com as duas listas saneadas.
 *
 * `opcoes.alimentaFocos` e `opcoes.alimentaNivel` são as duas liberações já
 * resolvidas pelo `deriveAfty`. Elas não mudam conta nenhuma AQUI: viajam no
 * extrato só para a tela poder dizer de onde o orçamento de Focos e o Nível
 * estão vindo, e para os dois campos saberem que deixaram de ser digitáveis.
 *
 * ⚠ O `nivel` É CALCULADO SEMPRE, com liberação ou sem. Ele é uma leitura do
 * XP, e não uma decisão: a tabela responde "que nível este XP compra" mesmo
 * quando ninguém está usando a resposta. Quem decide se ela vale é o derive.
 *
 * ⚠ SALDO NEGATIVO É AVISO, e não correção. Gastar mais do que se tem é um erro
 * de anotação do jogador, e apagar o gasto mais caro por conta própria seria
 * escolher por ele. É a mesma regra de todo orçamento do projeto: reporta, não
 * remove.
 */
export function resolveCarteira(creature, opcoes = {}) {
  const bruto = creature?.carteira;
  const brutasEntradas = Array.isArray(bruto?.entradas) ? bruto.entradas : [];
  const brutosGastos = Array.isArray(bruto?.gastos) ? bruto.gastos : [];

  const entradas = [];
  for (const b of brutasEntradas) {
    const e = normalizaEntradaCarteira(b);
    if (e) entradas.push(e);
  }
  const gastos = [];
  for (const b of brutosGastos) {
    const g = normalizaGastoCarteira(b);
    if (g) gastos.push(g);
  }

  const xpTotal = centavos(entradas.reduce((s, e) => s + e.xp, 0));
  const interludios = entradas.reduce((s, e) => s + e.interludios, 0);
  const ganho = centavos(entradas.reduce((s, e) => s + e.dinheiro, 0));
  const retirado = centavos(gastos.reduce((s, g) => s + g.valor, 0));
  const atual = centavos(ganho - retirado);

  const avisos = [];
  if (atual < 0) {
    avisos.push("O dinheiro atual está negativo: os gastos passaram do que entrou.");
  }
  const tiposPerdidos = entradas.filter((e) => e.tipoCru).length
    + gastos.filter((g) => g.tipoCru).length;
  if (tiposPerdidos) {
    avisos.push(`${tiposPerdidos} linha(s) com tipo desconhecido, e os números delas continuam valendo.`);
  }

  return {
    entradas,
    gastos,
    xpTotal,
    interludios,
    ganho,
    retirado,
    atual,
    nivel: nivelPorXp(xpTotal),
    proximo: proximoNivelCarteira(xpTotal),
    avisos,
    alimentaFocos: !!opcoes.alimentaFocos,
    alimentaNivel: !!opcoes.alimentaNivel,
  };
}

/* ============================================================ */
/* VALIDADOR                                                     */
/* ============================================================ */
/** Roda no console em dev, no mesmo padrão dos outros catálogos do Afty. */
export function validarCatalogoCarteira() {
  const erros = [];
  for (const [nome, lista] of [["sessão", CARTEIRA_TIPOS], ["gasto", CARTEIRA_GASTO_TIPOS]]) {
    const vistos = new Set();
    for (const t of lista) {
      if (typeof t.id !== "string") erros.push(`tipo de ${nome} sem id de texto.`);
      if (vistos.has(t.id)) erros.push(`tipo de ${nome} com id duplicado ("${t.id}").`);
      vistos.add(t.id);
      if (!t.label) erros.push(`tipo de ${nome} "${t.id}" sem rótulo.`);
    }
    /* ⚠ O ID VAZIO TEM DE EXISTIR nas duas listas: ele é o padrão da linha nova
       e o destino de todo tipo desconhecido. Sem ele o `normaliza` mandaria a
       linha para um id que o `<select>` não tem, e o campo apareceria em branco
       sem nenhuma opção marcada. */
    if (!vistos.has("")) erros.push(`a lista de tipos de ${nome} não tem a entrada neutra (id vazio).`);
  }
  return erros;
}
