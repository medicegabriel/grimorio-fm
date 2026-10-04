/**
 * ============================================================
 * ESPINHO: as Almas, e o que elas compram
 * ============================================================
 * Pedido do autor em 2026-09-30, para um personagem: *"Preciso de um contador
 * de ALMAS. Aonde mostra minhas Almas Totais e Restantes"* e *"Você pode gastar
 * ALMAS para comprar efeitos mecânicos na ficha (que não são Feitiços, logo se
 * acumulam com Feitiços, Equipamentos e todo o restante)"*.
 *
 * ------------------------------------------------------------
 * O QUE ESTE MÓDULO É, E O QUE ELE NÃO É
 * ------------------------------------------------------------
 * Ele é o VERBO: uma loja de catálogo FIXO, em que cada item tem custo, teto de
 * compras e o que ele rende por unidade. O SUBSTANTIVO (quais itens, quanto
 * custam, qual o teto, em que canal rendem) mora no pacote de Addon, no campo
 * `espinho`, e é lido por `espinhoDaFicha` em afty-addons.js. Mudar um preço
 * ou um teto não pede código.
 *
 * É irmão da Loja de Catarse (afty-catarse.js), e a diferença é o catálogo: lá a
 * pessoa escreve cada compra numa linha livre, aqui a lista é do pacote e a
 * compra é um contador por item, com teto.
 *
 * ⚠ É MÓDULO FOLHA, sem nenhum import, pela mesma razão da Catarse: o card entra
 * cedo no `AftyCreatureBuilder` e o `afty-addons` o importa. O que ele precisa
 * saber do mundo (o avaliador da DSL, o inventário) chega por PARÂMETRO. Ver
 * `asserts/t-ordem-modulos.mjs`.
 *
 * ------------------------------------------------------------
 * AS DECISÕES DO AUTOR (2026-09-30)
 * ------------------------------------------------------------
 * 1. As Almas são FICHA, e não sessão, como a Catarse. Almas Totais é um número
 *    digitado, e Restantes = Totais menos as compras menos Outros.
 * 2. A compra abre a VAGA, e a escolha continua na aba de sempre (Talento na aba
 *    de Talentos, Perícia na de Perícias). É a semântica da Catarse, e não a da
 *    Concessão do Mestre.
 * 3. Equipamento: o item é criado no inventário como sempre, e o card MARCA quais
 *    vieram do Espinho. O marcado vira Grau Especial, e o Aprimoramento (um por
 *    item) abre nele uma Habilidade Única a mais, que disputa na família
 *    `habilidadeUnica` como a primeira. Quem aplica isso é o afty-equipamentos.
 * 4. Outros é um contador de Almas gastas por fora, sem efeito nenhum.
 *
 * ⚠ NENHUMA LINHA LEVA `exclusivo`. Acumular com Feitiço, Técnica e Equipamento
 * é a regra que o autor pediu, igual à Catarse.
 *
 * ⚠ PASSAR DO TETO OU DAS ALMAS É AVISO, e não correção. O botão de comprar para
 * no teto, mas o BT pode descer depois, e apagar a compra por conta própria seria
 * escolher pelo jogador. É a regra de todo orçamento do projeto.
 *
 * ⚠ O TETO COM MULTIPLICADOR (Addon Alter) é `floor(expressão × mult)`, com UM
 * piso só, no fim. Decisão minha, anotada em docs/afty-espinho.md: "BT × 1,5" é
 * o texto do autor, e pisar a metade do BT antes de multiplicar tiraria uma
 * compra em todo BT ímpar.
 */

/* ============================================================ */
/* OS TIPOS DE ITEM                                             */
/* ============================================================ */
/**
 * `efeitos`       rende as linhas do Motor declaradas, uma vez por unidade.
 * `talento`       concede um Talento pelo id (e pode trazer efeitos também).
 * `equipamento`   a quantidade é o número de itens MARCADOS no inventário.
 * `aprimoramento` a quantidade é o número de marcados com o Aprimoramento.
 */
export const ESPINHO_TIPOS = ["efeitos", "talento", "equipamento", "aprimoramento"];

/** Os três tipos de inventário que podem virar Ferramenta de Grau Especial. */
export const ESPINHO_TIPOS_ITEM = ["arma", "escudo", "uniforme"];

const inteiro = (v) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : 0;
};
const naoNegativo = (v) => Math.max(0, inteiro(v));

/* ============================================================ */
/* O CATÁLOGO QUE VEM DO PACOTE                                 */
/* ============================================================ */
/**
 * Um item do pacote saneado, ou `null` quando não dá para aproveitar.
 *
 * ⚠ O TIPO SEM DECLARAR é deduzido: com `concedeTalento` é `talento`, sem é
 * `efeitos`. Tipo desconhecido é recusado pelo `validarPacote` na instalação, e
 * aqui (ficha já salva) cai no mesmo palpite, para a ficha sempre abrir.
 */
export function normalizarItemEspinho(bruto) {
  if (!bruto || typeof bruto !== "object") return null;
  const id = String(bruto.id ?? "").trim();
  if (!id) return null;
  const tipo = ESPINHO_TIPOS.includes(bruto.tipo)
    ? bruto.tipo
    : (bruto.concedeTalento ? "talento" : "efeitos");
  const tetoCru = bruto.teto == null ? "" : String(bruto.teto).trim();
  const efeitos = Array.isArray(bruto.efeitos)
    ? bruto.efeitos
      .filter((e) => e && typeof e === "object" && typeof e.canal === "string" && e.canal.trim())
      .map((e) => ({
        canal: e.canal.trim(),
        expr: String(e.expr ?? "1").trim() || "1",
        ...(e.alvo ? { alvo: String(e.alvo) } : {}),
        ...(e.quando ? { quando: String(e.quando) } : {}),
      }))
    : [];
  return {
    id,
    nome: String(bruto.nome ?? "").trim() || id,
    descricao: String(bruto.descricao ?? "").trim(),
    custo: naoNegativo(bruto.custo),
    // `null` é sem teto (o "Ilimitado" do autor).
    teto: tetoCru || null,
    // Os blocos da lista, separados por fenda na tela. Só visual.
    grupo: Math.max(1, inteiro(bruto.grupo) || 1),
    tipo,
    efeitos: tipo === "equipamento" || tipo === "aprimoramento" ? [] : efeitos,
    concedeTalento: tipo === "talento" ? (String(bruto.concedeTalento ?? "").trim() || null) : null,
  };
}

/** A configuração vazia: sem pacote, o Espinho não existe. */
export const ESPINHO_SEM_CONFIG = Object.freeze({ itens: Object.freeze([]), multiplicadorTeto: 1 });

/* ============================================================ */
/* O ESTADO NA FICHA                                            */
/* ============================================================ */
/**
 * `creature.espinho` saneado. Nunca lança: campo sujo vira zero.
 *
 * Forma: { almas, outros, compras: { [itemId]: qtd }, equipamentos: [{ uid,
 * aprimorado }] }. O uid é o da entrada de inventário.
 */
export function estadoDoEspinho(creature) {
  const bruto = creature?.espinho && typeof creature.espinho === "object" ? creature.espinho : {};
  const compras = {};
  if (bruto.compras && typeof bruto.compras === "object" && !Array.isArray(bruto.compras)) {
    for (const [id, q] of Object.entries(bruto.compras)) {
      const n = naoNegativo(q);
      if (n > 0) compras[id] = n;
    }
  }
  const vistos = new Set();
  const equipamentos = [];
  for (const e of Array.isArray(bruto.equipamentos) ? bruto.equipamentos : []) {
    const uid = String(e?.uid ?? "").trim();
    if (!uid || vistos.has(uid)) continue;
    vistos.add(uid);
    equipamentos.push({ uid, aprimorado: e?.aprimorado === true });
  }
  return {
    almas: naoNegativo(bruto.almas),
    outros: naoNegativo(bruto.outros),
    compras,
    equipamentos,
  };
}

/** Uma ficha nova começa assim. */
export const createBlankEspinho = () => ({ almas: 0, outros: 0, compras: {}, equipamentos: [] });

/**
 * Os itens do inventário MARCADOS como do Espinho: `Map(uid → aprimorado)`.
 *
 * ⚠ SÓ COM O ITEM `equipamento` NO PACOTE. Sem ele a marca continua gravada e
 * não muda o grau de nada, que é o "sem o pacote nada emite" do guia. O mesmo
 * vale para o Aprimoramento sem o item `aprimoramento`.
 */
export function marcasDoEspinho(creature, config = ESPINHO_SEM_CONFIG) {
  const itens = Array.isArray(config?.itens) ? config.itens : [];
  const temEquip = itens.some((i) => i.tipo === "equipamento");
  const temAprimora = itens.some((i) => i.tipo === "aprimoramento");
  const out = new Map();
  if (!temEquip) return out;
  for (const e of estadoDoEspinho(creature).equipamentos) {
    out.set(e.uid, temAprimora && e.aprimorado);
  }
  return out;
}

/* ============================================================ */
/* O RESOLVEDOR                                                 */
/* ============================================================ */
/**
 * O extrato do Espinho.
 *
 * `opcoes.config`     a configuração unida dos pacotes (`espinhoDaFicha`).
 * `opcoes.avaliar`    (expr) => número, a DSL no contexto do montante. É por ele
 *                     que `bt` e `nd` chegam ao teto.
 * `opcoes.inventario` [{ uid, nome, tipo }] das entradas que podem ser marcadas,
 *                     para dizer o nome do item e achar o marcado que sumiu.
 */
export function resolveEspinho(creature, opcoes = {}) {
  const config = opcoes.config && Array.isArray(opcoes.config.itens) ? opcoes.config : ESPINHO_SEM_CONFIG;
  const mult = Number.isFinite(Number(config.multiplicadorTeto)) && Number(config.multiplicadorTeto) > 0
    ? Number(config.multiplicadorTeto)
    : 1;
  const avaliar = typeof opcoes.avaliar === "function" ? opcoes.avaliar : (expr) => Number(expr) || 0;
  const inventario = new Map(
    (Array.isArray(opcoes.inventario) ? opcoes.inventario : [])
      .filter((x) => x && x.uid)
      .map((x) => [String(x.uid), x]),
  );
  const estado = estadoDoEspinho(creature);
  const ativo = config.itens.length > 0;

  const itemEquip = config.itens.find((i) => i.tipo === "equipamento") ?? null;
  const itemAprimora = config.itens.find((i) => i.tipo === "aprimoramento") ?? null;

  /* Os marcados, com nome e a marca de morto. ⚠ O MARCADO QUE SUMIU DO
     INVENTÁRIO CONTINUA CUSTANDO: sumir com o gasto devolveria Almas sem ninguém
     pedir. Ele aparece riscado, com o botão de desmarcar. */
  const equipamentos = itemEquip
    ? estado.equipamentos.map((e) => {
      const inv = inventario.get(e.uid);
      return {
        uid: e.uid,
        nome: inv?.nome ?? null,
        tipo: inv?.tipo ?? null,
        aprimorado: !!itemAprimora && e.aprimorado,
        morto: !inv,
      };
    })
    : [];

  const tetoDe = (item) => {
    if (item.teto == null) return null;
    const bruto = Number(avaliar(item.teto));
    return Math.max(0, Math.floor((Number.isFinite(bruto) ? bruto : 0) * mult));
  };

  const itens = config.itens.map((item) => {
    const qtd = item.tipo === "equipamento" ? equipamentos.length
      : item.tipo === "aprimoramento" ? equipamentos.filter((e) => e.aprimorado).length
        : (estado.compras[item.id] ?? 0);
    const teto = tetoDe(item);
    return {
      ...item,
      qtd,
      teto,
      excedeu: teto != null && qtd > teto,
      gasto: qtd * item.custo,
    };
  });

  /* Compra gravada de um item que o pacote não tem mais. Sem o item não há
     preço, então ela não conta no gasto, mas aparece para ser apagada. */
  const idsDoPacote = new Set(config.itens.map((i) => i.id));
  const comprasMortas = ativo
    ? Object.entries(estado.compras)
      .filter(([id]) => !idsDoPacote.has(id))
      .map(([id, qtd]) => ({ id, qtd }))
    : [];

  const gastoItens = itens.reduce((s, i) => s + i.gasto, 0);
  const gastas = gastoItens + estado.outros;

  const efeitos = [];
  const talentosConcedidos = [];
  for (const item of itens) {
    if (item.qtd <= 0) continue;
    for (const e of item.efeitos) {
      efeitos.push({
        canal: e.canal,
        ...(e.alvo ? { alvo: e.alvo } : {}),
        ...(e.quando ? { quando: e.quando } : {}),
        expr: item.qtd === 1 ? e.expr : `(${e.expr}) * ${item.qtd}`,
        origem: "espinho",
        // O nome do ITEM: é o que o jogador procura no hover quando uma vaga a
        // mais aparece na aba de Talentos.
        nome: `Espinho (${item.nome})`,
      });
    }
    if (item.concedeTalento && !talentosConcedidos.includes(item.concedeTalento)) {
      talentosConcedidos.push(item.concedeTalento);
    }
  }

  /* ⚠ O AVISO DAS ALMAS NÃO MORA AQUI, e sim no card, que o monta a partir dos
     números que ele mesmo mostra. Na Ficha Final as Almas Totais e o Outros são
     editados na hora e gravados com atraso, e um aviso vindo daqui ficaria um
     passo atrás do número na tela. O `almas.excedeu` segue valendo para quem lê. */
  const avisos = [];
  for (const i of itens) {
    if (i.excedeu) avisos.push(`${i.nome}: ${i.qtd} de ${i.teto} (excedeu).`);
  }
  const mortos = equipamentos.filter((e) => e.morto).length;
  if (mortos) {
    avisos.push(`${mortos} ${mortos === 1 ? "Equipamento marcado não está" : "Equipamentos marcados não estão"} mais no inventário, e o custo continua contando.`);
  }
  if (comprasMortas.length) {
    avisos.push(`${comprasMortas.length} ${comprasMortas.length === 1 ? "compra de item que" : "compras de itens que"} o Addon não tem mais.`);
  }

  return {
    ativo,
    multiplicadorTeto: mult,
    almas: {
      totais: estado.almas,
      outros: estado.outros,
      gastas,
      restantes: estado.almas - gastas,
      excedeu: gastas > estado.almas,
    },
    itens,
    equipamentos,
    // Os itens do inventário que podem ser marcados, para o "Marcar Item".
    inventario: itemEquip ? [...inventario.values()] : [],
    comprasMortas,
    efeitos,
    talentosConcedidos,
    avisos,
  };
}
