/* ============================================================ */
/* CRIAÇÃO DE EQUIPAMENTOS (Addon), FASE 3: ITENS DE CUSTO        */
/* ============================================================ */
/*
 * A seção "Criação de Itens de Custo" do guia Criação de Equipamentos e Itens
 * 2.5.2, copiado sem mudança em `docs/afty-criacao-equipamentos-fonte.md`. O guia
 * do sistema é `docs/afty-criacao-equipamentos.md`, e as perguntas com as
 * respostas estão em `docs/afty-criacao-equipamentos-decisoes.md`.
 *
 * As decisões do autor, todas de 2026-09-14:
 *   • Cada item escolhe PASSIVO ou ATIVO. O Passivo vale enquanto equipado e
 *     soma no número da ficha. O Ativo aparece pronto e a mesa aplica.
 *   • Só o Ativo escolhe a forma: Arremessável, Área ou Totem/Selo.
 *   • "Acerto (Especificar)" e o Dano do Passivo miram um tipo de ataque. A CD
 *     vale na CD única da ficha.
 *   • FICAM FORA desta fase, e o autor pediu que fique escrito que não foram
 *     implementados: Cura (espera os Dados de Cura por descanso), Condição,
 *     Curar Condição, Tipo de Percepção, Brinco Comunicador, Reduzir Exaustão, e
 *     os bônus de Alcance e de Área.
 *   • ENTRAM: Maximizar Atributo (o Talismã do Ápice, ver
 *     `afty-talisma-apice.js`) e Mudar Tipo de Dano, este como texto.
 *
 * ⚠ MÓDULO FOLHA, sem import nenhum. O `afty-equipamentos.js` o chama dentro do
 * `catalogoDoTipo`, e um import de volta fecharia um ciclo.
 */

/* ------------------------------------------------------------ */
/* O TEXTO DO GUIA (verbatim, sem a marcação do documento)        */
/* ------------------------------------------------------------ */

export const TEXTO_ITENS_CUSTO = {
  abertura: "Ao criar um Item de Custo, você pode apenas aplicar um dos efeitos das tabelas baseadas em seu custo",
  forma: "Aplicar condições em um item de Custo conta como a adição de um Efeito. Ao adicionar um efeito, você deve escolher se ele é arremessável (Tem alcance) ou tem Área.",
  fortitude: "Caso o Item force um Teste de Resistência, ele sempre será de Fortitude.",
  exaustao: "Itens que reduzem Exaustão apenas a reduzem durante a cena. Ao final dela a Exaustão retorna ao usuário.",
  narrativo: "Itens de Custo podem ser narrativos e habilitar outros tipos de efeitos, contanto que sejam efeitos básicos, como mudar para um tipo Elemental (como os óleos) ou outros efeitos discutidos com o Narrador. Itens de Custo 2 podem mudar o dano para Tipos Biológicos e   Custo 3 e 4 podem mudar o dano para Tipos Etéreos que não sejam Dano na Alma ou Energia Reversa",
  cura: "Efeitos de Cura não podem ser aplicados em área e só são aplicados uma única vez.",
};

/** Os tópicos de forma de cada Custo, na grafia do guia (o Custo 1 escreve "Item"). */
export const TOPICOS_FORMA = {
  1: {
    arremessavel: "Caso seja um Item arremessável ele tem alcance de 6m.",
    area: "Se houver área para afetar ele possui uma área de 4,5m.",
    totem: "Caso seja um totem ou selo, ele tem 10 de PV, 10 de defesa e concede bônus em uma área de 4,5m.",
  },
  2: {
    arremessavel: "Caso seja um item arremessável ele tem alcance de 9m.",
    area: "Se houver área para afetar ele possui uma área de 6m.",
    totem: "Caso seja um totem ou selo, ele tem 20 de PV, 15 de defesa e concede bônus em uma área de 6m.",
  },
  3: {
    arremessavel: "Caso seja um item arremessável ele tem alcance de 12m.",
    area: "Se houver área para afetar ele possui uma área de 9m.",
    totem: "Caso seja um totem ou selo, ele tem 30 de PV, 20 de defesa e concede bônus em uma área de 7,5m.",
  },
  4: {
    arremessavel: "Caso seja um item arremessável ele tem alcance de 18m.",
    area: "Se houver área para afetar ele possui uma área de 12m.",
    totem: "Caso seja um totem ou selo, ele tem 40 de PV, 25 de defesa e concede bônus em uma área de 9m.",
  },
};

export const TEXTO_MAXIMIZAR = "No custo 4 itens ativos podem maximizar um atributo por 10m ou 10 rodadas.";

/* ------------------------------------------------------------ */
/* AS TABELAS                                                    */
/* ------------------------------------------------------------ */

export const CUSTOS_ITEM = [1, 2, 3, 4];
export const MODOS_ITEM = [
  { value: "passivo", label: "Passivo" },
  { value: "ativo", label: "Ativo" },
];

/**
 * As quatro tabelas de Custo do guia, uma linha por tipo de bônus, com o valor
 * de cada Custo. `null` é onde o guia escreve "-", e o efeito não existe naquele
 * Custo. Metros ficam em número.
 *
 * `implementado: false` é o que ficou FORA desta fase por decisão do autor, e a
 * linha fica aqui porque ela é o texto do guia e a fila de amanhã.
 *
 * `alvo` diz o que a pessoa escolhe: "ataque", "pericia", "tr", "oficio",
 * "atributo", ou uma lista de perícias (`pericias`) no Treinamento e no Mestre.
 */
export const TABELA_ITENS_CUSTO = [
  { id: "acerto", label: "Acerto (Especificar)", valores: [1, 2, 3, 4], sinal: true, alvo: "ataque", implementado: true },
  { id: "cd", label: "CD (Especificar)", valores: [1, 2, 3, 4], sinal: true, implementado: true },
  { id: "pericia", label: "Perícia (Especificar)", valores: [1, 2, 3, 4], sinal: true, alvo: "pericia", implementado: true },
  { id: "dano", label: "Dano", valores: [2, 4, 6, 8], sinal: true, alvo: "ataque", implementado: true },
  { id: "alcance", label: "Alcance", valores: [6, 9, 12, 15], metros: true, implementado: false },
  { id: "pe", label: "PE (Energia ou Estamina)", valores: [3, 6, 10, 15], sinal: true, implementado: true },
  { id: "pvMaximo", label: "PV Máximo", valores: [5, 10, 20, 25], sinal: true, implementado: true },
  { id: "tipoPercepcao", label: "Tipo de Percepção", valores: [null, "1 Tipo", "1 Tipo", "1 Tipo"], implementado: false },
  { id: "curarCondicao", label: "Curar Condição", valores: ["Fraca", "Fraca e Média", "Fraca, Média e Forte", "Fraca, Média e Forte"], implementado: false },
  { id: "deslocamento", label: "Deslocamento", valores: [1.5, 3, 4.5, 6], metros: true, implementado: true },
  { id: "atributo", label: "Atributo", valores: [null, null, 2, 2], sinal: true, alvo: "atributo", implementado: true },
  { id: "treinamento", label: "Treinamento (Perícia)", valores: [null, 1, 2, 4], alvo: "pericias", implementado: true },
  { id: "mestre", label: "Mestre (Perícia)", valores: [null, null, 1, 2], alvo: "pericias", implementado: true },
  { id: "area", label: "Área", valores: [1.5, 3, 4.5, 6], metros: true, implementado: false },
  { id: "tr", label: "TR (Especificar)", valores: [1, 2, 3, 4], sinal: true, alvo: "tr", implementado: true },
  { id: "oficio", label: "Ofício (Especificar)", valores: [2, 2, 3, 4], sinal: true, alvo: "oficio", implementado: true },
  { id: "brinco", label: "Brinco Comunicador", valores: [30, 60, 90, 120], metros: true, implementado: false },
  { id: "reduzirExaustao", label: "Reduzir Exaustão", valores: [null, 1, 2, 3], implementado: false },
];

/* Os dois efeitos que não são linha de tabela. Os dois só existem no item Ativo. */
export const EFEITOS_EXTRAS = [
  /* "No custo 4 itens ativos podem maximizar um atributo por 10m ou 10 rodadas."
     É o Talismã do Ápice do livro, e liga o estado dele na aba Buffs. */
  { id: "maximizarAtributo", label: "Maximizar Atributo", custoMinimo: 4, soAtivo: true, implementado: true },
  /* O efeito narrativo: "mudar para um tipo Elemental (como os óleos)", e os
     Custos 2, 3 e 4 alcançando mais categorias. Fica como texto. */
  { id: "mudarTipoDano", label: "Mudar Tipo de Dano", custoMinimo: 1, soAtivo: true, alvo: "tipoDano", implementado: true },
];

/* As categorias de dano que "Mudar Tipo de Dano" alcança em cada Custo. O guia
   diz Elemental para os itens em geral, e Biológicos no Custo 2 e Etéreos no 3 e
   no 4. A leitura é CUMULATIVA: o Custo 2 também muda para Elemental. */
export const CATEGORIAS_MUDAR_DANO = {
  1: ["elemental"],
  2: ["elemental", "biologico"],
  3: ["elemental", "biologico", "etereo"],
  4: ["elemental", "biologico", "etereo"],
};
export const TIPOS_FORA_DO_MUDAR_DANO = ["alma", "energia_reversa"];

/** As formas do item Ativo, com os números de cada Custo. */
export const FORMAS_ATIVO = [
  { value: "arremessavel", label: "Arremessável" },
  { value: "area", label: "Área" },
  { value: "totem", label: "Totem ou Selo" },
];
export const ALCANCE_ARREMESSAVEL = { 1: 6, 2: 9, 3: 12, 4: 18 };
export const AREA_DO_ITEM = { 1: 4.5, 2: 6, 3: 9, 4: 12 };
export const TOTEM = {
  1: { pv: 10, defesa: 10, area: 4.5 },
  2: { pv: 20, defesa: 15, area: 6 },
  3: { pv: 30, defesa: 20, area: 7.5 },
  4: { pv: 40, defesa: 25, area: 9 },
};

/** Os tipos de ataque que "Especificar" oferece. O assert compara com `AFTY_ATAQUES`. */
export const ATAQUES_ITEM = [
  { value: "corpo", label: "Corpo a Corpo" },
  { value: "distancia", label: "A Distância" },
  { value: "amaldicoado", label: "Amaldiçoado" },
];

/* ------------------------------------------------------------ */
/* AS CONTAS                                                     */
/* ------------------------------------------------------------ */

export const custoDoItem = (v) => {
  const n = Math.trunc(Number(v));
  return CUSTOS_ITEM.includes(n) ? n : 1;
};

const LINHA_POR_ID = Object.fromEntries(TABELA_ITENS_CUSTO.map((l) => [l.id, l]));
const EXTRA_POR_ID = Object.fromEntries(EFEITOS_EXTRAS.map((l) => [l.id, l]));

/** O valor da tabela de um efeito num Custo, ou `null` onde o guia escreve "-". */
export const valorDoEfeito = (id, custo) => LINHA_POR_ID[id]?.valores?.[custoDoItem(custo) - 1] ?? null;

/**
 * Os efeitos que um item pode escolher, no Custo e no modo dele. Fica fora o que
 * não foi implementado e o que o guia marca com "-" naquele Custo.
 */
export function efeitosOferecidos(custo, modo) {
  const c = custoDoItem(custo);
  const daTabela = TABELA_ITENS_CUSTO
    .filter((l) => l.implementado && l.valores[c - 1] != null)
    .map((l) => ({ value: l.id, label: l.label }));
  const extras = EFEITOS_EXTRAS
    .filter((e) => e.implementado && c >= e.custoMinimo && (!e.soAtivo || modo === "ativo"))
    .map((e) => ({ value: e.id, label: e.label }));
  return [...daTabela, ...extras];
}

/** Quantas perícias o Treinamento ou o Mestre escolhem naquele Custo. */
export const quantasPericias = (id, custo) => (LINHA_POR_ID[id]?.alvo === "pericias" ? (valorDoEfeito(id, custo) ?? 0) : 0);

/* ------------------------------------------------------------ */
/* NA FICHA                                                      */
/* ------------------------------------------------------------ */
/* `creature.itensCustoCriados = [{ id: "itcc_...", nome, categoria, custo, modo,
   forma, efeito, alvo, alvos, tipoDano }]`. O número sai da tabela na leitura. */

export const PREFIXO_ITEM_CUSTO = "itcc_";
const CATEGORIAS_OK = ["acessorio", "espiritual", "farmaco", "mistura", "talisma"];

let seq = 0;
/** Um Item de Custo novo: Acessório Passivo de Custo 1, sem efeito escolhido. */
export const novoItemCusto = (patch = {}) => {
  seq += 1;
  return {
    id: `${PREFIXO_ITEM_CUSTO}${Date.now().toString(36)}_${seq}`,
    nome: "", categoria: "acessorio", custo: 1, modo: "passivo", forma: "arremessavel",
    efeito: "", alvo: "", alvos: [], tipoDano: "",
    ...patch,
  };
};

const texto = (v) => (typeof v === "string" ? v : "");

/** O item saneado: tudo que a ficha grava, com o que não existe no Custo e no modo tirado. */
export function saneiaItemCusto(bruto) {
  if (!bruto || typeof bruto !== "object") return null;
  if (typeof bruto.id !== "string" || !bruto.id.startsWith(PREFIXO_ITEM_CUSTO)) return null;
  const custo = custoDoItem(bruto.custo);
  const modo = bruto.modo === "ativo" ? "ativo" : "passivo";
  const oferecidos = efeitosOferecidos(custo, modo).map((e) => e.value);
  const efeito = oferecidos.includes(bruto.efeito) ? bruto.efeito : "";
  const n = quantasPericias(efeito, custo);
  const alvos = (Array.isArray(bruto.alvos) ? bruto.alvos : []).map(texto).slice(0, n);
  while (alvos.length < n) alvos.push("");
  return {
    id: bruto.id,
    nome: texto(bruto.nome),
    categoria: CATEGORIAS_OK.includes(bruto.categoria) ? bruto.categoria : "acessorio",
    custo,
    modo,
    forma: modo === "ativo" && FORMAS_ATIVO.some((f) => f.value === bruto.forma) ? bruto.forma : (modo === "ativo" ? "arremessavel" : null),
    efeito,
    alvo: texto(bruto.alvo),
    alvos,
    tipoDano: texto(bruto.tipoDano),
  };
}

/**
 * As linhas do Motor de um item PASSIVO. O item Ativo não emite nada: ele é de
 * uso, e a mesa aplica. PV Máximo e Atributo saem pelos campos que os itens do
 * livro já usam (`hpMax` e `atributo`), para entrarem no mesmo ponto da conta:
 * o PV de item antes da Alma, e o atributo de item podendo passar o limite até 30.
 */
export function efeitoDoItemCusto(item) {
  if (!item || item.modo !== "passivo" || !item.efeito) return null;
  const v = valorDoEfeito(item.efeito, item.custo);
  if (v == null) return null;
  const motor = [];
  const out = { aplicado: true };
  switch (item.efeito) {
    case "acerto": if (item.alvo) motor.push({ canal: "bonusAcerto", alvo: item.alvo, expr: String(v) }); break;
    case "cd": motor.push({ canal: "cd", expr: String(v) }); break;
    case "pericia":
    case "oficio": if (item.alvo) motor.push({ canal: "bonusPericia", alvo: item.alvo, expr: String(v) }); break;
    case "tr": if (item.alvo) motor.push({ canal: "bonusTR", alvo: item.alvo, expr: String(v) }); break;
    case "dano": if (item.alvo) motor.push({ canal: "danoBonus", alvo: `atq:${item.alvo}`, expr: String(v) }); break;
    case "pe": motor.push({ canal: "pe", expr: String(v) }); break;
    case "deslocamento": motor.push({ canal: "movimento", expr: String(v) }); break;
    case "treinamento":
    case "mestre":
      for (const alvo of new Set(item.alvos.filter(Boolean))) {
        motor.push({ canal: "proficienciaPericia", alvo, expr: item.efeito === "mestre" ? "2" : "1" });
      }
      break;
    case "pvMaximo": out.hpMax = v; break;
    case "atributo": if (item.alvo) out.atributo = { [item.alvo]: v }; break;
    default: return null;
  }
  if (motor.length) out.motor = motor;
  return motor.length || out.hpMax || out.atributo ? out : null;
}

const fmtMetros = (m) => `${String(m).replace(".", ",")}m`;

/** O que a forma do item Ativo dá, em números prontos. */
export function formaDoItemCusto(item) {
  if (!item || item.modo !== "ativo") return null;
  if (item.forma === "area") return { forma: "area", area: AREA_DO_ITEM[item.custo] };
  if (item.forma === "totem") return { forma: "totem", ...TOTEM[item.custo] };
  return { forma: "arremessavel", alcance: ALCANCE_ARREMESSAVEL[item.custo] };
}

/**
 * O resumo curto do item, que vira a descrição dele no catálogo e na Ficha
 * Final: forma, efeito e valor, sem frase. `rotulos` traz os nomes vivos de
 * perícia, TR, atributo e tipo de dano, que este módulo não conhece.
 */
export function resumoDoItemCusto(item, rotulos = {}) {
  if (!item) return "";
  const nome = (mapa, id) => (id ? (rotulos[mapa]?.[id] ?? id) : "");
  const partes = [];
  const f = formaDoItemCusto(item);
  if (f?.forma === "arremessavel") partes.push(`Arremessável, alcance ${fmtMetros(f.alcance)}`);
  if (f?.forma === "area") partes.push(`Área de ${fmtMetros(f.area)}`);
  if (f?.forma === "totem") partes.push(`Totem ou Selo, ${f.pv} PV, Defesa ${f.defesa}, área de ${fmtMetros(f.area)}`);
  const linha = LINHA_POR_ID[item.efeito];
  const v = valorDoEfeito(item.efeito, item.custo);
  if (linha && v != null) {
    // No Treinamento e no Mestre o número da tabela é QUANTAS perícias, e elas já
    // aparecem nomeadas, então ele não vira valor.
    const valor = linha.alvo === "pericias" ? "" : linha.metros ? fmtMetros(v) : linha.sinal ? `+${v}` : String(v);
    const alvo = linha.alvo === "pericias"
      ? item.alvos.filter(Boolean).map((a) => nome("pericia", a)).join(" e ")
      : nome(linha.alvo, item.alvo);
    const rot = linha.label.replace(" (Especificar)", "").replace(" (Perícia)", "");
    partes.push(`${rot}${alvo ? ` (${alvo})` : ""}${valor ? ` ${valor}` : ""}`);
  } else if (item.efeito === "maximizarAtributo") {
    partes.push("Maximizar Atributo por 10 rodadas");
  } else if (item.efeito === "mudarTipoDano") {
    partes.push(`Mudar Tipo de Dano${item.tipoDano ? ` para ${nome("tipoDano", item.tipoDano)}` : ""}`);
  }
  return partes.join(". ");
}

/** O item no formato de uma entrada de `ITENS_ESPECIAIS`, ou `null`. */
export function itemCustoParaCatalogo(bruto, rotulos = {}) {
  const item = saneiaItemCusto(bruto);
  if (!item) return null;
  const efeito = efeitoDoItemCusto(item);
  return {
    id: item.id,
    nome: item.nome.trim() || "Item sem Nome",
    categoria: item.categoria,
    custo: item.custo,
    descricao: resumoDoItemCusto(item, rotulos),
    ...(efeito ? { efeito } : {}),
    itemCusto: item,
    maximizaAtributo: item.modo === "ativo" && item.efeito === "maximizarAtributo",
    criado: "itemCusto",
    custom: true,
  };
}
