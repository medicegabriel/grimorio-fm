/**
 * ============================================================
 * LOJA DE CATARSE — a moeda da mesa, e o que ela compra
 * ============================================================
 * Pedido do autor em 2026-09-04: *"Preciso de um Addon chamado 'Loja de
 * Catarse', com a opção de Anotar coisas como TEXTO c/ Motor de Automação que
 * se ACUMULA com Técnicas e etc."*, e *"vc vai ganhando Catarses (Pontos de
 * Inspiração) e pode gastar eles para comprar Talentos Adicionais, Habilidades
 * de Especialização, Habilidades Lendarias, Melhorias Superiores e etc"*.
 *
 * ------------------------------------------------------------
 * O QUE ESTE MÓDULO É, E O QUE ELE NÃO É
 * ------------------------------------------------------------
 * Ele é o VERBO. O SUBSTANTIVO (quanto custa cada coisa, o que a loja vende)
 * mora no pacote de Addon, e é por isso que mudar um preço não pede código. É a
 * mesma divisão do resto do sistema de Addons, escrita em docs/afty-addons.md.
 *
 * ⚠ É MÓDULO FOLHA, sem nenhum import, e isso não é estilo. O painel da Loja
 * entra cedo no `AftyCreatureBuilder`, e foi exatamente esse caminho que deixou
 * o app em tela branca em 2026-09-02 com a aba de Defesas: o
 * `afty-equipamentos` e o `afty-habilidades` têm um ciclo antigo entre si, que
 * só não estoura porque o segundo sempre entra primeiro. Um catálogo importado
 * pela aba nova inverte a ordem. O que este módulo precisa saber sobre o mundo
 * chega por PARÂMETRO. Ver `asserts/t-ordem-modulos.mjs`.
 *
 * ------------------------------------------------------------
 * AS TRÊS DECISÕES DO AUTOR (2026-09-04)
 * ------------------------------------------------------------
 * 1. **Catarse é FICHA, e não sessão.** O saldo e as compras ficam gravados na
 *    criatura, como nível e talento. É o contrário da Concessão do Mestre
 *    (`afty-concessao.js`), que morre com a sessão de propósito: aquilo é ganho
 *    de combate, e isto é compra de ficha, que você leva para a próxima mesa.
 *
 * 2. **A compra COBRA requisito.** Ela abre a VAGA, e a escolha continua na aba
 *    de sempre, com ND, pré-requisito e cadeia valendo. Comprar uma Lendária no
 *    ND 5 dá a vaga e não dá a Lendária, porque o ND 22 continua de pé.
 *
 *    ⚠ Isto é o OPOSTO da Concessão, e a diferença é deliberada. A Concessão
 *    existe para dar o que a criatura não alcançaria comprando (o Ciclo de
 *    Adaptação do Mahoraga), então ela passa por cima. A Loja é uma segunda
 *    carteira para o mesmo mercado, não um atalho para fora das regras. Ter os
 *    dois caminhos com semânticas OPOSTAS é o ponto, e não um descuido.
 *
 * 3. **O texto livre é uma COMPRA, com preço.** Ele existe porque a Loja vende
 *    coisa que não tem entrada de catálogo, e aí o que a pessoa compra é a
 *    regra escrita mais o efeito no Motor.
 *
 * ------------------------------------------------------------
 * ⚠ O TEXTO LIVRE ACUMULA, E É A RAZÃO DE ELE EXISTIR
 * ------------------------------------------------------------
 * O sistema já tem duas fontes de efeito ESCRITO em vez de escolhido: o
 * Funcionamento Básico e o Passivo criado pelo jogador. **As duas carregam
 * `exclusivo`**, ou seja, não somam com Feitiço, Shikigami, Técnica Marcial nem
 * Estilo da Sombra: elas disputam o maior valor por canal dentro do pool.
 *
 * O autor pediu o contrário, com todas as letras: *"que se ACUMULA com Técnicas
 * e etc"*. Por isso a linha da Loja sai SEM `exclusivo`, e soma por cima de
 * tudo como uma Habilidade ou um Talento somam.
 *
 * ⚠ Não dê `exclusivo` a esta linha "por consistência" com as outras duas. A
 * falta dele É a regra, e há assert prendendo.
 */

/* ============================================================ */
/* AS FAMÍLIAS QUE A LOJA VENDE                                  */
/* ============================================================ */
/**
 * Cada família diz em que CANAL a compra vira vaga. O canal é o mesmo que o
 * resto do sistema já usa, então uma vaga comprada e uma vaga vinda de
 * Habilidade são indistinguíveis rio abaixo, que é o que se quer: não pode
 * existir um segundo caminho para a mesma regra.
 *
 * ⚠ `texto` NÃO TEM CANAL, e o `null` é explícito. Ela não abre vaga nenhuma:
 * o que ela entrega é o efeito escrito, direto. Chave ausente daria `undefined`
 * com o mesmo efeito por acidente, que é o defeito que o `INV_CARACT_TR_PROF`
 * documenta em afty-invocacoes.js.
 */
export const CATARSE_FAMILIAS = [
  {
    id: "talentos",
    label: "Talento",
    canal: "vagasTalento",
    nota: "Vaga EXCLUSIVA de Talento. Não serve para Habilidade de Especialização.",
  },
  {
    id: "habilidades",
    label: "Habilidade de Especialização",
    canal: "vagasHabilidade",
    /* ⚠ ESTE CANAL TEM BUG ABERTO, e ele é anterior à Loja. O `contadorComum`
       que o criador mostra NÃO soma `vagasHabilidade` (ver a entrada "BUG:
       `vagasHabilidade` não chega no orçamento que a tela mostra" em
       docs/a-fazer.md, de 2026-08-20). Enquanto ele estiver assim, comprar esta
       família promete uma vaga que a tela não mostra.

       A entrada fica aqui, e não escondida, porque o defeito é do canal e não
       da Loja: consertar lá conserta aqui de graça. O `resolveCatarse` marca a
       linha com `canalComPendencia` para a tela poder avisar. */
    canalComPendencia: "o contador da aba Habilidades ainda não soma este canal",
  },
  {
    id: "melhoriasSuperiores",
    label: "Melhoria Superior",
    canal: "vagasMelhoria",
    nota: "Só rende acima do ND 21, que é onde o Alto Nível existe.",
  },
  {
    id: "lendarias",
    label: "Habilidade Lendária",
    canal: "vagasLendaria",
    nota: "Só rende acima do ND 22, que é onde o Alto Nível existe.",
  },
  {
    id: "aptidoes",
    label: "Aptidão Amaldiçoada",
    canal: "vagasAptidao",
  },
  {
    id: "pericias",
    label: "Treino de Perícia",
    canal: "vagasPericia",
  },
  {
    id: "feiticos",
    label: "Feitiço",
    canal: "vagasFeitico",
    nota: "Vaga de Feitiço, Estilo das Sombras ou Habilidade Marcial.",
  },
  {
    id: "texto",
    label: "Anotação com Motor",
    canal: null,
    nota: "O que não tem entrada de catálogo: a regra escrita mais o efeito, e ela ACUMULA.",
  },
];

const FAMILIA_BY_ID = new Map(CATARSE_FAMILIAS.map((f) => [f.id, f]));

/** O registro daquela família, ou null. Nunca lança: id sujo vira linha morta. */
export const getCatarseFamilia = (id) => FAMILIA_BY_ID.get(String(id ?? "")) ?? null;

/** Uma compra em branco, para a tela criar linha nova. */
export function createBlankCompraCatarse(familia = "talentos") {
  return {
    id: `cat_${Math.random().toString(36).slice(2, 10)}`,
    familia: FAMILIA_BY_ID.has(familia) ? familia : "talentos",
    nome: "",
    custo: 0,
    // Só a família `texto` usa os dois de baixo.
    texto: "",
    efeitos: [],
  };
}

/* ============================================================ */
/* SANEAMENTO                                                    */
/* ============================================================ */
const inteiro = (v) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : 0;
};

/**
 * Uma compra saneada, ou `null` quando ela não dá para aproveitar.
 *
 * ⚠ CUSTO NEGATIVO É RECUSADO, e não apenas aparado em zero. Um custo negativo
 * seria uma compra que DÁ Catarse, e aí o saldo vira uma máquina de fazer
 * moeda a partir de uma linha de lista. Quem dá Catarse é o campo de ganho, que
 * tem dono e aparece na tela.
 */
export function normalizaCompraCatarse(bruta) {
  if (!bruta || typeof bruta !== "object") return null;
  const familia = getCatarseFamilia(bruta.familia);
  if (!familia) return null;
  const custo = Math.max(0, inteiro(bruta.custo));
  const efeitos = Array.isArray(bruta.efeitos)
    ? bruta.efeitos
      .filter((e) => e && typeof e === "object" && typeof e.canal === "string" && e.canal)
      .map((e) => ({
        canal: e.canal,
        expr: String(e.expr ?? ""),
        ...(e.alvo ? { alvo: String(e.alvo) } : {}),
        ...(e.quando ? { quando: String(e.quando) } : {}),
      }))
    : [];
  return {
    id: String(bruta.id ?? "") || `cat_${Math.random().toString(36).slice(2, 10)}`,
    familia: familia.id,
    nome: String(bruta.nome ?? ""),
    custo,
    texto: String(bruta.texto ?? ""),
    efeitos: familia.id === "texto" ? efeitos : [],
  };
}

/* ============================================================ */
/* O RESOLVEDOR                                                  */
/* ============================================================ */
/**
 * Lê `creature.catarse` e devolve o extrato da Loja.
 *
 * `opcoes.precos` é o preço-base por família, vindo do ADDON. Ele NÃO decide o
 * custo de uma compra já feita (esse fica gravado na linha, para uma mudança de
 * tabela não reescrever o passado do personagem): ele serve para a tela sugerir
 * o preço ao criar a linha, e para a Loja saber o que está à venda.
 *
 * ⚠ SALDO NEGATIVO É AVISO, e não correção. Gastar mais do que tem é um erro do
 * jogador, e apagar a compra mais cara por conta própria seria escolher por ele.
 * É a mesma regra dos outros orçamentos do projeto: reporta, não remove.
 */
export function resolveCatarse(creature, opcoes = {}) {
  const bruto = creature?.catarse;
  const ganho = Math.max(0, inteiro(bruto?.saldo));
  const brutas = Array.isArray(bruto?.compras) ? bruto.compras : [];

  const compras = [];
  const mortas = [];
  for (const b of brutas) {
    const c = normalizaCompraCatarse(b);
    /* Linha que aponta para família desconhecida NÃO some: ela vira linha morta
       e continua ocupando o gasto dela. É a mesma escolha do resto do projeto
       (a concessão de um addon que saiu do ar aparece riscada), e a razão é a
       mesma: sumir com o gasto devolveria Catarse ao jogador sem ninguém pedir. */
    if (!c) {
      mortas.push({ ...(b && typeof b === "object" ? b : {}), morta: true });
      continue;
    }
    compras.push(c);
  }

  const gasto = compras.reduce((s, c) => s + c.custo, 0)
    + mortas.reduce((s, c) => s + Math.max(0, inteiro(c?.custo)), 0);

  /* As vagas, agrupadas por canal. Uma compra de família com canal vira `+1`
     naquele canal, e não `+custo`: o preço é quanto ela CUSTA, e não quanto ela
     rende. Confundir os dois faria um Talento caro valer por vários. */
  const porCanal = {};
  for (const c of compras) {
    const f = getCatarseFamilia(c.familia);
    if (!f?.canal) continue;
    porCanal[f.canal] = (porCanal[f.canal] ?? 0) + 1;
  }

  /* Os efeitos que entram no Motor. Duas origens diferentes num só lugar:
     as VAGAS (uma linha por canal, com o total) e o TEXTO LIVRE (as linhas que
     a pessoa escreveu).

     ⚠ NENHUMA LEVA `exclusivo`. Ver o cabeçalho: acumular é a regra que o autor
     pediu, e o assert prende a ausência. */
  const efeitos = [];
  for (const [canal, n] of Object.entries(porCanal)) {
    efeitos.push({
      canal,
      expr: String(n),
      origem: "catarse",
      nome: "Loja de Catarse",
    });
  }
  for (const c of compras) {
    if (c.familia !== "texto") continue;
    for (const e of c.efeitos) {
      efeitos.push({
        ...e,
        origem: "catarse",
        // O nome da COMPRA, e não "Loja de Catarse": é o que o jogador escreveu,
        // e é o que ele procura no hover de fontes quando o número não bate.
        nome: c.nome || "Loja de Catarse",
      });
    }
  }

  const avisos = [];
  if (gasto > ganho) {
    avisos.push(`Catarses gastas: ${gasto} de ${ganho} (excedeu).`);
  }
  if (mortas.length) {
    avisos.push(`${mortas.length} compra(s) sem família conhecida, e o gasto delas continua contando.`);
  }
  for (const c of compras) {
    const f = getCatarseFamilia(c.familia);
    if (f?.canalComPendencia) {
      avisos.push(`${f.label}: ${f.canalComPendencia}.`);
      break; // uma vez, e não uma por compra
    }
  }

  return {
    ganho,
    gasto,
    restante: ganho - gasto,
    excedeu: gasto > ganho,
    compras,
    mortas,
    porCanal,
    efeitos,
    avisos,
    precos: opcoes.precos ?? {},
  };
}

/* ============================================================ */
/* VALIDADOR                                                     */
/* ============================================================ */
/** Roda no console em dev, no mesmo padrão dos outros catálogos do Afty. */
export function validarCatalogoCatarse() {
  const erros = [];
  const vistos = new Set();
  for (const f of CATARSE_FAMILIAS) {
    if (!f.id) erros.push(`família sem id (${f.label ?? "?"}).`);
    if (vistos.has(f.id)) erros.push(`id duplicado "${f.id}".`);
    vistos.add(f.id);
    if (!f.label) erros.push(`"${f.id}" sem rótulo.`);
    /* ⚠ O `canal` tem de ser declarado, mesmo quando é `null`. Chave ausente
       viraria `undefined` e passaria pelo mesmo `if (!f.canal)` por acidente,
       sem ninguém ter decidido nada. */
    if (!("canal" in f)) erros.push(`"${f.id}" não declara canal (use null se ela não abre vaga).`);
  }
  return erros;
}
