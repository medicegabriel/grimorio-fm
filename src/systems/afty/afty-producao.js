/**
 * ============================================================
 * PRODUÇÃO DE INTERLÚDIO: ITENS, INVOCAÇÕES E ADAPTAÇÃO (CX5, 2026-11-06)
 * ============================================================
 * Livro p.336 e 337 (Criação de Itens, Criação de Invocações e Adaptação), p.142 e 143 (limites dos kits), p.167
 * (Mestre da Criação). Cada Foco gasto num destes é uma PRODUÇÃO: um registro na ficha (`creature.producoes`) com as
 * tentativas, o que cada uma rendeu e o que já foi entregue.
 *
 * ------------------------------------------------------------
 * O CADERNO DE FORJA CONTINUA SENDO ANOTAÇÃO
 * ------------------------------------------------------------
 * O autor decidiu em 2026-09-11 que o Caderno de Forja (`afty-forja.js`) é SÓ anotação, sem conferir kit, Ofício, CD nem
 * limite. Isso vale e não muda. A produção deste módulo é o PROCEDIMENTO do livro, ao lado do caderno, para quem quiser o
 * teste conferido e o produto entregue no inventário. Quem usa os dois soma os Focos dos dois (integração do orçamento).
 *
 * ------------------------------------------------------------
 * O QUE A FICHA CONFERE E O QUE FICA COM A MESA
 * ------------------------------------------------------------
 * A ficha confere: treino no Ofício, quantidade de testes, CD pela tabela, custo máximo pelo nível, limites de acessório e
 * uniforme, acesso ao grau da Invocação, vestígios e a troca por vantagem. O TESTE em si é a pessoa quem faz: a tentativa
 * recebe o `resultado` (o total do d20 mais o bônus do Ofício), seja da rolagem do app, seja da mesa. Vantagem é registrada
 * e entra na tentativa seguinte do mesmo Ofício, para a tela rolar com vantagem.
 *
 * ------------------------------------------------------------
 * ENTREGA SEM DUPLICAR
 * ------------------------------------------------------------
 * O produto entra no inventário (ou nas Invocações) com um `uid` DETERMINÍSTICO (`prod_<produção>_<tentativa>`). Entregar
 * duas vezes, ou reabrir a ficha e entregar de novo, não cria outra cópia: a entrega pula o que já existe e a tentativa
 * entregue fica marcada. Todas as operações são funções puras de ficha para ficha: a tela grava o resultado uma vez.
 *
 * ⚠ Este módulo NÃO é folha: lê o catálogo de equipamentos, as Invocações e as Habilidades. Nenhum módulo do ciclo do derive o
 * importa, e ele só deve ser importado por telas e por `ficha/`.
 * ============================================================
 */
import {
  KITS_FERRAMENTAS, getEquipamento, catalogoDoTipo, custoDoEquipamento, custoMaximoCriacao, novaEntradaEquip,
} from "./afty-equipamentos";
import { createBlankInvocacao, grausDisponiveis, AFTY_INV_GRAUS } from "./afty-invocacoes";
import { getHabilidade } from "./afty-habilidades";

const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};
const lista = (v) => (Array.isArray(v) ? v : []);
const objeto = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : null);
const semAcento = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLocaleLowerCase("pt-BR");

const PREFIXO = "prod_";
export const TIPOS_DE_PRODUCAO = ["itens", "invocacoes", "adaptacao"];

/* ============================================================ */
/* AS TABELAS DO LIVRO                                           */
/* ============================================================ */
/** p.336: a CD por Custo 1 a 4. Alquimia, Canalizador e Ferreiro; Entalhador e Farmacêutico; Alfaiate. */
export const CD_POR_CUSTO = Object.freeze({
  kit_alquimia: [15, 20, 25, 30],
  kit_canalizador: [15, 20, 25, 30],
  kit_ferreiro: [15, 20, 25, 30],
  kit_entalhador: [15, 20, 25, 35],
  kit_farmaceutico: [15, 20, 25, 35],
  kit_alfaiate: [15, 20, 30, 40],
});

/** p.337: a CD por grau da Invocação. */
export const CD_POR_GRAU_DA_INVOCACAO = Object.freeze({ quarto: 15, terceiro: 20, segundo: 30, primeiro: 40, especial: 50 });

/** O Ofício de cada via de Invocação (p.337): Talismã por Entalhador, Marionete por Canalizador. */
export const VIAS_DE_INVOCACAO = Object.freeze({
  talisma: { oficio: "Entalhador", tipoMecanico: "shikigami", rotulo: "Talismã" },
  marionete: { oficio: "Canalizador", tipoMecanico: "marionete", rotulo: "Marionete" },
});

/** Os kits que criam itens neste foco. O Cozinheiro tem mecânica própria (refeições) e não entra na tabela de custo. */
export const OFICIOS_DE_CRIACAO = Object.freeze(KITS_FERRAMENTAS
  .filter((k) => CD_POR_CUSTO[k.id])
  .map((k) => ({ kit: k.id, oficio: k.oficio, cria: k.cria.filter((c) => c !== "ferramenta_amaldicoada"), cds: CD_POR_CUSTO[k.id] })));

const oficioDoKit = (nome) => OFICIOS_DE_CRIACAO.find((o) => semAcento(o.oficio) === semAcento(nome)) ?? null;

/** p.143: quantos acessórios o Alfaiate cria por interlúdio (1 do nível 1 ao 9, 2 a partir do 10) e quantos uniformes (1). */
export const limiteDeAcessorios = (nd) => (inteiro(nd) >= 10 ? 2 : 1);
export const LIMITE_DE_UNIFORMES = 1;

/** p.336: *"uma quantidade de testes de perícia igual a 1 + seu Bônus de Treinamento"*, e o Mestre da Criação soma 2 por foco (p.167). */
export const BONUS_DO_MESTRE_DA_CRIACAO = 2;
export const TALENTO_MESTRE_DA_CRIACAO = "tal_mestre_da_criacao";

/* ============================================================ */
/* O CONTEXTO DA FICHA                                           */
/* ============================================================ */
/**
 * O que a produção precisa saber da ficha derivada: BT, nível, Ofícios treinados (inclusive os concedidos por Talento), o nível de
 * Controlador e se a ficha tem o Mestre da Criação. Puro, só lê.
 */
export function contextoDeProducao(creature, derived) {
  const oficiosTreinados = new Set();
  for (const p of lista(derived?.testes?.pericias)) {
    if (!p?.prof || !lista(p.oficios).length) continue;
    for (const nome of p.oficios) oficiosTreinados.add(semAcento(nome));
  }
  const nivelControlador = lista(creature?.especializacoes)
    .filter((e) => e?.id === "controlador").reduce((n, e) => n + Math.max(0, inteiro(e.nivel)), 0);
  return {
    bt: Math.max(0, inteiro(derived?.contextoDsl?.bt)),
    nd: Math.max(1, inteiro(derived?.nd, 1)),
    oficiosTreinados,
    nivelControlador,
    mestreDaCriacao: lista(creature?.talentos).includes(TALENTO_MESTRE_DA_CRIACAO),
  };
}

/** Quantos testes UMA produção de itens ou de invocações permite. */
export function testesPermitidos(producao, ctx) {
  const focos = Math.max(1, inteiro(producao?.focos, 1));
  const porFoco = 1 + Math.max(0, inteiro(ctx?.bt)) + (producao?.tipo === "itens" && ctx?.mestreDaCriacao ? BONUS_DO_MESTRE_DA_CRIACAO : 0);
  return focos * porFoco;
}

/* ============================================================ */
/* A FORMA SALVA                                                 */
/* ============================================================ */
let seq = 0;
const carimbo = () => { seq += 1; return `${Date.now().toString(36)}_${seq}`; };

export function novaProducao(tipo = "itens", patch = {}) {
  return { id: `${PREFIXO}${carimbo()}`, tipo: TIPOS_DE_PRODUCAO.includes(tipo) ? tipo : "itens", focos: 1, interludio: null, tentativas: [], ...patch };
}

function saneiaTentativa(b, tipo) {
  if (!objeto(b) || typeof b.id !== "string" || !b.id) return null;
  const base = { id: b.id, entregue: !!b.entregue };
  if (tipo === "itens") {
    const ref = objeto(b.itemRef) && typeof b.itemRef.refId === "string" && typeof b.itemRef.tipo === "string"
      ? { tipo: b.itemRef.tipo, refId: b.itemRef.refId } : null;
    return {
      ...base, oficio: String(b.oficio ?? ""), resultado: b.resultado == null ? null : inteiro(b.resultado), cd: b.cd == null ? null : inteiro(b.cd),
      itemRef: ref, troca: b.troca === "vantagem" ? "vantagem" : null, vantagem: !!b.vantagem, trocaUsada: !!b.trocaUsada,
    };
  }
  if (tipo === "invocacoes") {
    return {
      ...base, via: VIAS_DE_INVOCACAO[b.via] ? b.via : "talisma", grau: AFTY_INV_GRAUS.some((g) => g.value === b.grau) ? b.grau : "quarto",
      resultado: b.resultado == null ? null : inteiro(b.resultado), cd: b.cd == null ? null : inteiro(b.cd),
      vestigiosUsados: Math.max(0, inteiro(b.vestigiosUsados)), vantagem: !!b.vantagem, guardouVestigio: !!b.guardouVestigio,
      sucesso: !!b.sucesso, nome: String(b.nome ?? ""),
    };
  }
  return null;
}

function saneiaTroca(b) {
  if (!objeto(b) || typeof b.id !== "string" || typeof b.de !== "string" || typeof b.para !== "string") return null;
  return { id: b.id, de: b.de, para: b.para };
}

export function saneiaProducao(bruta) {
  if (!objeto(bruta) || typeof bruta.id !== "string" || !bruta.id.startsWith(PREFIXO)) return null;
  const tipo = TIPOS_DE_PRODUCAO.includes(bruta.tipo) ? bruta.tipo : null;
  if (!tipo) return null;
  const vistos = new Set();
  const tentativas = lista(bruta.tentativas).map((t) => saneiaTentativa(t, tipo)).filter((t) => {
    if (!t || vistos.has(t.id)) return false;
    vistos.add(t.id);
    return true;
  });
  const vistasTrocas = new Set();
  return {
    id: bruta.id, tipo, focos: Math.max(1, inteiro(bruta.focos, 1)), interludio: typeof bruta.interludio === "string" && bruta.interludio ? bruta.interludio : null,
    tentativas,
    ...(tipo === "adaptacao" ? {
      trocas: lista(bruta.trocas).map(saneiaTroca).filter((t) => { if (!t || vistasTrocas.has(t.id)) return false; vistasTrocas.add(t.id); return true; }),
    } : {}),
  };
}

/** As produções da ficha, saneadas e sem id repetido. */
export function producoesDaFicha(creature) {
  const vistos = new Set();
  const out = [];
  for (const b of lista(creature?.producoes)) {
    const p = saneiaProducao(b);
    if (!p || vistos.has(p.id)) continue;
    vistos.add(p.id);
    out.push(p);
  }
  return out;
}

/** Os Focos gastos em produção. Irmão de `focosDeForja`, `focosGastos` das Linhas e `focosDeTreinosEspeciais`: as quatro somas entram no MESMO orçamento. */
export const focosDeProducoes = (creature) => producoesDaFicha(creature).reduce((n, p) => n + p.focos, 0);

/**
 * Os vestígios guardados das Invocações que falharam (p.337), UM ESTOQUE POR VIA (decisão do autor, 2026-11-06): o vestígio de Talismã só
 * ajuda Talismã, e o de Marionete só ajuda Marionete. Sem `via` devolve `{ talisma, marionete }`, com `via` devolve o número.
 */
export function vestigiosDaFicha(creature, via = null) {
  const bruto = objeto(creature?.vestigios) ?? {};
  const estoque = Object.fromEntries(Object.keys(VIAS_DE_INVOCACAO).map((v) => [v, Math.max(0, inteiro(bruto[v]))]));
  return via ? estoque[via] ?? 0 : estoque;
}

const comProducoes = (creature, producoes) => ({ ...creature, producoes });
const recusa = (creature, erro, codigo, extra = {}) => ({ creature, aplicado: false, erro, codigo, ...extra });
const achaProducao = (creature, id) => producoesDaFicha(creature).find((p) => p.id === id) ?? null;

function trocaProducao(creature, producao) {
  const brutas = lista(creature?.producoes);
  const existe = brutas.some((p) => p?.id === producao.id);
  return comProducoes(creature, existe ? brutas.map((p) => (p?.id === producao.id ? producao : p)) : [...brutas, producao]);
}

/* ============================================================ */
/* INICIAR A PRODUÇÃO                                            */
/* ============================================================ */
/**
 * Abre uma produção gastando Focos. `id` determina a identidade: repetir o mesmo id devolve `repetida` e a mesma ficha, então o clique
 * duplo e o reenvio depois de salvar não gastam outro Foco.
 */
export function iniciaProducao(creature, { id, tipo, focos = 1, interludio = null } = {}) {
  if (typeof id !== "string" || !id.startsWith(PREFIXO)) return recusa(creature, "Sem Identidade da Produção", "sem-id");
  if (!TIPOS_DE_PRODUCAO.includes(tipo)) return recusa(creature, "Tipo de Produção Desconhecido", "tipo");
  if (lista(creature?.producoes).some((p) => p?.id === id)) return { creature, aplicado: false, repetida: true };
  const producao = novaProducao(tipo, { id, focos: Math.max(1, inteiro(focos, 1)), interludio: interludio || null });
  return { creature: trocaProducao(creature, producao), aplicado: true, producao };
}

/* ============================================================ */
/* CRIAÇÃO DE ITENS                                              */
/* ============================================================ */
/** O custo e o tipo do item contra o kit: o catálogo do Ofício. */
function avaliaItem(creature, ctx, kit, itemRef) {
  const def = getEquipamento(itemRef.tipo, itemRef.refId, creature);
  if (!def || def.evento) return { erro: "Item Não Encontrado", codigo: "item-ausente" };
  const tipoDoKit = itemRef.tipo === "item" ? def.categoria : itemRef.tipo;
  if (!kit.cria.includes(tipoDoKit)) return { erro: `${kit.oficio} Não Cria Este Item`, codigo: "kit" };
  if (itemRef.tipo === "uniforme" && def.inicial) return { erro: "Uniforme Comum Já Vem com a Ficha", codigo: "uniforme-comum" };
  const custo = custoDoEquipamento(itemRef.tipo, def);
  if (custo < 1 || custo > 4) return { erro: "Custo Fora da Tabela", codigo: "custo" };
  if (custo > custoMaximoCriacao(ctx.nd)) return { erro: `Nível ${ctx.nd} Cria Itens de Custo ${custoMaximoCriacao(ctx.nd)} no Máximo`, codigo: "nivel", detalhe: { custo } };
  return { def, custo, tipoDoKit };
}

/** Quantos produtos de cada grupo as produções do MESMO interlúdio já têm, para os limites do Alfaiate. */
function jaProduzidos(creature, producao, excetoTentativaId = null) {
  const doInterludio = producoesDaFicha(creature).filter((p) => p.tipo === "itens"
    && (p.id === producao.id || (producao.interludio && p.interludio === producao.interludio)));
  const contagem = { acessorios: 0, uniformes: 0 };
  for (const p of doInterludio) {
    for (const t of p.tentativas) {
      if (!t.itemRef || t.id === excetoTentativaId) continue;
      if (t.itemRef.tipo === "uniforme") contagem.uniformes += 1;
      if (t.itemRef.tipo === "item" && getEquipamento("item", t.itemRef.refId, creature)?.categoria === "acessorio") contagem.acessorios += 1;
    }
  }
  return contagem;
}

/**
 * Registra UMA tentativa de Criação de Itens.
 *
 *   dados { producaoId, id, oficio, resultado, itemRef?: { tipo, refId }, troca?: "vantagem" }
 *
 *   - sem `itemRef` e sem `troca`: o teste falhou ou a pessoa não quis criar, a tentativa gasta um dos testes e não rende nada
 *   - `itemRef`: precisa caber no kit do Ofício, no nível, na CD da tabela, e nos limites do Alfaiate
 *   - `troca: "vantagem"`: *"deixar de criar um item com um teste e, em troca, receber vantagem na próxima rolagem do mesmo Ofício"*.
 *     Não rende item e dispensa o `resultado`. A próxima tentativa do mesmo Ofício nasce com `vantagem: true`
 *
 * Retorno: `{ creature, aplicado, repetida?, erro?, codigo?, tentativa?, restantes? }`. Recusa devolve a MESMA ficha.
 */
export function registraTentativaDeItem(creature, ctx, dados = {}) {
  const producao = achaProducao(creature, dados.producaoId);
  if (!producao || producao.tipo !== "itens") return recusa(creature, "Produção de Itens Não Encontrada", "producao-ausente");
  if (typeof dados.id !== "string" || !dados.id) return recusa(creature, "Tentativa Sem Identificação", "sem-id");
  if (producao.tentativas.some((t) => t.id === dados.id)) return { creature, aplicado: false, repetida: true };
  const permitidos = testesPermitidos(producao, ctx);
  if (producao.tentativas.length >= permitidos) return recusa(creature, `Só ${permitidos} Testes por Foco`, "testes-demais", { detalhe: { permitidos } });

  const kit = oficioDoKit(dados.oficio);
  if (!kit) return recusa(creature, "Ofício Não Cria Itens", "oficio");
  if (!ctx.oficiosTreinados.has(semAcento(kit.oficio))) return recusa(creature, `Falta Treino em ${kit.oficio}`, "sem-treino");

  // A vantagem que uma troca anterior deixou para o mesmo Ofício.
  const pendente = producao.tentativas.find((t) => t.troca === "vantagem" && !t.trocaUsada && semAcento(t.oficio) === semAcento(kit.oficio));
  const vantagem = !!pendente;
  const marcaTroca = (p) => (pendente ? { ...p, tentativas: p.tentativas.map((t) => (t.id === pendente.id ? { ...t, trocaUsada: true } : t)) } : p);

  if (dados.troca === "vantagem") {
    const tentativa = { id: dados.id, oficio: kit.oficio, resultado: null, cd: null, itemRef: null, troca: "vantagem", vantagem, trocaUsada: false, entregue: false };
    const proxima = marcaTroca({ ...producao, tentativas: [...producao.tentativas, tentativa] });
    return { creature: trocaProducao(creature, proxima), aplicado: true, tentativa, restantes: permitidos - proxima.tentativas.length };
  }

  const resultado = Number.isFinite(Number(dados.resultado)) ? inteiro(dados.resultado) : null;
  if (resultado == null) return recusa(creature, "Informe o Resultado do Teste", "sem-resultado");
  let cd = null;
  if (dados.itemRef) {
    const a = avaliaItem(creature, ctx, kit, dados.itemRef);
    if (a.erro) return recusa(creature, a.erro, a.codigo, a.detalhe ? { detalhe: a.detalhe } : {});
    cd = kit.cds[a.custo - 1];
    if (resultado < cd) return recusa(creature, `Resultado Abaixo da CD ${cd}`, "abaixo-da-cd", { detalhe: { cd, resultado } });
    if (a.tipoDoKit === "acessorio" || dados.itemRef.tipo === "uniforme") {
      const ja = jaProduzidos(creature, producao);
      if (a.tipoDoKit === "acessorio" && ja.acessorios >= limiteDeAcessorios(ctx.nd)) {
        return recusa(creature, `${kit.oficio} Cria ${limiteDeAcessorios(ctx.nd)} Acessório${limiteDeAcessorios(ctx.nd) > 1 ? "s" : ""} por Interlúdio`, "limite-acessorio");
      }
      if (dados.itemRef.tipo === "uniforme" && ja.uniformes >= LIMITE_DE_UNIFORMES) return recusa(creature, "Um Uniforme com Revestimento por Interlúdio", "limite-uniforme");
    }
  }
  const tentativa = {
    id: dados.id, oficio: kit.oficio, resultado, cd, itemRef: dados.itemRef ? { tipo: dados.itemRef.tipo, refId: dados.itemRef.refId } : null,
    troca: null, vantagem, trocaUsada: false, entregue: false,
  };
  const proxima = marcaTroca({ ...producao, tentativas: [...producao.tentativas, tentativa] });
  return { creature: trocaProducao(creature, proxima), aplicado: true, tentativa, restantes: permitidos - proxima.tentativas.length };
}

/* ============================================================ */
/* CRIAÇÃO DE INVOCAÇÕES                                         */
/* ============================================================ */
/**
 * Registra UMA tentativa de Criação de Invocações (p.337).
 *
 *   dados { producaoId, id, via: "talisma"|"marionete", grau, resultado, vestigios?: n, guardarVestigio?: bool, nome? }
 *
 *   - via talismã usa Ofício (Entalhador), via marionete usa Ofício (Canalizador), e é preciso ser treinado
 *   - o grau precisa estar ao alcance (tabela de Nível de Controlador, p.259) e o resultado, somado dos vestígios, alcançar a CD
 *   - *"ao utilizar um vestígio, você recebe vantagem no próximo teste de Ofício; vestígios além do primeiro podem ser
 *     utilizados, concedendo +2 para cada outro"*: `vestigios: n` gasta n do estoque DA VIA, marca a vantagem e soma 2 por
 *     vestígio além do primeiro ao `resultado`
 *   - sem alcançar a CD, `guardarVestigio: true` guarda o vestígio da Invocação que se tentava criar
 *
 * Retorno: `{ creature, aplicado, repetida?, erro?, codigo?, tentativa?, vestigios?, restantes? }`.
 */
export function registraTentativaDeInvocacao(creature, ctx, dados = {}) {
  const producao = achaProducao(creature, dados.producaoId);
  if (!producao || producao.tipo !== "invocacoes") return recusa(creature, "Produção de Invocações Não Encontrada", "producao-ausente");
  if (typeof dados.id !== "string" || !dados.id) return recusa(creature, "Tentativa Sem Identificação", "sem-id");
  if (producao.tentativas.some((t) => t.id === dados.id)) return { creature, aplicado: false, repetida: true };
  const permitidos = testesPermitidos(producao, ctx);
  if (producao.tentativas.length >= permitidos) return recusa(creature, `Só ${permitidos} Testes por Foco`, "testes-demais", { detalhe: { permitidos } });

  const via = VIAS_DE_INVOCACAO[dados.via];
  if (!via) return recusa(creature, "Escolha Talismã ou Marionete", "via");
  if (!ctx.oficiosTreinados.has(semAcento(via.oficio))) return recusa(creature, `Falta Treino em ${via.oficio}`, "sem-treino");
  const cdGrau = CD_POR_GRAU_DA_INVOCACAO[dados.grau];
  if (!cdGrau) return recusa(creature, "Grau Desconhecido", "grau");
  if (!grausDisponiveis(ctx.nivelControlador).includes(dados.grau)) return recusa(creature, "Sem Acesso a Este Grau", "acesso");
  const resultado = Number.isFinite(Number(dados.resultado)) ? inteiro(dados.resultado) : null;
  if (resultado == null) return recusa(creature, "Informe o Resultado do Teste", "sem-resultado");

  const estoque = vestigiosDaFicha(creature, dados.via);
  const usados = Math.max(0, inteiro(dados.vestigios));
  if (usados > estoque) return recusa(creature, "Vestígios Insuficientes", "vestigios", { detalhe: { estoque, pedidos: usados } });
  const efetivo = resultado + 2 * Math.max(0, usados - 1);
  const sucesso = efetivo >= cdGrau;
  if (dados.guardarVestigio && sucesso) return recusa(creature, "Só Guarda Vestígio Quem Não Alcançou a CD", "vestigio-de-sucesso");

  const tentativa = {
    id: dados.id, via: dados.via, grau: dados.grau, resultado: efetivo, cd: cdGrau, vestigiosUsados: usados, vantagem: usados >= 1,
    guardouVestigio: !!dados.guardarVestigio, sucesso, nome: String(dados.nome ?? ""), entregue: false,
  };
  const proxima = { ...producao, tentativas: [...producao.tentativas, tentativa] };
  const vestigios = { ...vestigiosDaFicha(creature), [dados.via]: estoque - usados + (dados.guardarVestigio ? 1 : 0) };
  return {
    creature: { ...trocaProducao(creature, proxima), vestigios }, aplicado: true, tentativa, vestigios: vestigios[dados.via], restantes: permitidos - proxima.tentativas.length,
  };
}

/* ============================================================ */
/* ADAPTAÇÃO                                                     */
/* ============================================================ */
/** p.336: *"uma quantidade igual a metade do nível do personagem"*, por foco. A divisão arredonda para baixo (p.365). */
export const trocasDeAdaptacao = (nd, focos = 1) => Math.floor(Math.max(0, inteiro(nd)) / 2) * Math.max(1, inteiro(focos, 1));

/**
 * Registra UMA troca de Habilidade de Especialização (Adaptação, p.336) e a aplica na ficha: a Habilidade `de` sai da lista e a `para` entra
 * na MESMA posição. A nova precisa ser da mesma Especialização, e a ficha não pode já tê-la. As escolhas aninhadas da antiga saem
 * com ela. O requisito da nova Habilidade segue sendo conferido pela tela de Habilidades, que mostra o que falta.
 *
 *   dados { producaoId, id, de, para }
 */
export function registraTrocaDeAdaptacao(creature, ctx, dados = {}) {
  const producao = achaProducao(creature, dados.producaoId);
  if (!producao || producao.tipo !== "adaptacao") return recusa(creature, "Adaptação Não Encontrada", "producao-ausente");
  if (typeof dados.id !== "string" || !dados.id) return recusa(creature, "Troca Sem Identificação", "sem-id");
  if ((producao.trocas ?? []).some((t) => t.id === dados.id)) return { creature, aplicado: false, repetida: true };
  const permitidas = trocasDeAdaptacao(ctx.nd, producao.focos);
  if ((producao.trocas ?? []).length >= permitidas) return recusa(creature, `Só ${permitidas} Trocas`, "trocas-demais", { detalhe: { permitidas } });

  const velha = getHabilidade(dados.de);
  const nova = getHabilidade(dados.para);
  if (!velha || !nova) return recusa(creature, "Habilidade Não Encontrada", "habilidade-ausente");
  if (dados.de === dados.para) return recusa(creature, "Escolha Outra Habilidade", "mesma");
  if (!velha.especializacaoId || velha.especializacaoId !== nova.especializacaoId) {
    return recusa(creature, "Só Troca Por Habilidade da Mesma Especialização", "especializacao");
  }
  const atuais = lista(creature?.habilidades);
  if (!atuais.includes(dados.de)) return recusa(creature, "A Ficha Não Tem a Habilidade", "sem-a-habilidade");
  if (atuais.includes(dados.para)) return recusa(creature, "A Ficha Já Tem Esta Habilidade", "ja-tem");

  const habilidades = atuais.map((id) => (id === dados.de ? dados.para : id));
  const escolhas = { ...(objeto(creature?.escolhasHabilidade) ?? {}) };
  delete escolhas[dados.de];
  const proxima = { ...producao, trocas: [...(producao.trocas ?? []), { id: dados.id, de: dados.de, para: dados.para }] };
  const base = trocaProducao(creature, proxima);
  return {
    creature: { ...base, habilidades, ...(Object.keys(escolhas).length || creature?.escolhasHabilidade ? { escolhasHabilidade: escolhas } : {}) },
    aplicado: true, de: velha.nome ?? dados.de, para: nova.nome ?? dados.para, restantes: permitidas - proxima.trocas.length,
  };
}

/* ============================================================ */
/* ENTREGAR O PRODUTO                                            */
/* ============================================================ */
export const uidDoProduto = (producaoId, tentativaId) => `${producaoId}_${tentativaId}`;

/**
 * Entrega o que a produção rendeu e ainda não foi entregue: os itens vão para `equipamentos.itens` e as Invocações para `invocacoes`.
 * É idempotente por construção: o `uid` do produto é determinístico, quem já existe na ficha não é criado de novo e a tentativa fica
 * marcada como entregue. Entregar duas vezes, ou depois de reabrir a ficha, dá o mesmo resultado.
 *
 * Retorno: `{ creature, aplicado, entregues: [uid], jaEntregues: [uid] }`. Sem nada a entregar, `aplicado: false` e a mesma ficha.
 */
export function entregaProducao(creature, producaoId) {
  const producao = achaProducao(creature, producaoId);
  if (!producao) return recusa(creature, "Produção Não Encontrada", "producao-ausente");
  const entregues = [];
  const jaEntregues = [];
  let itens = lista(creature?.equipamentos?.itens);
  let invocacoes = lista(creature?.invocacoes);
  const tentativas = producao.tentativas.map((t) => {
    if (producao.tipo === "itens" && t.itemRef) {
      const uid = uidDoProduto(producao.id, t.id);
      if (itens.some((e) => e?.uid === uid)) { jaEntregues.push(uid); return { ...t, entregue: true }; }
      if (t.entregue) return t;
      const def = getEquipamento(t.itemRef.tipo, t.itemRef.refId, creature);
      itens = [...itens, { ...novaEntradaEquip(t.itemRef.tipo, t.itemRef.refId, def), uid, origemProducao: producao.id }];
      entregues.push(uid);
      return { ...t, entregue: true };
    }
    if (producao.tipo === "invocacoes" && t.sucesso) {
      const uid = uidDoProduto(producao.id, t.id);
      if (invocacoes.some((i) => i?.id === uid)) { jaEntregues.push(uid); return { ...t, entregue: true }; }
      if (t.entregue) return t;
      const via = VIAS_DE_INVOCACAO[t.via];
      const grauNome = AFTY_INV_GRAUS.find((g) => g.value === t.grau)?.label ?? t.grau;
      invocacoes = [...invocacoes, { ...createBlankInvocacao(t.grau, via.tipoMecanico), id: uid, nome: t.nome || `${via.rotulo} de ${grauNome}`, origemProducao: producao.id }];
      entregues.push(uid);
      return { ...t, entregue: true };
    }
    return t;
  });
  if (!entregues.length && tentativas.every((t, i) => t.entregue === producao.tentativas[i].entregue)) return recusa(creature, "Nada a Entregar", "nada-a-entregar", { jaEntregues });
  const base = trocaProducao(creature, { ...producao, tentativas });
  return {
    creature: {
      ...base,
      ...(producao.tipo === "itens" ? { equipamentos: { ...(creature?.equipamentos ?? {}), itens } } : {}),
      ...(producao.tipo === "invocacoes" ? { invocacoes } : {}),
    },
    aplicado: entregues.length > 0, entregues, jaEntregues,
  };
}

/** O resumo para a tela: testes usados, restantes, o que já rendeu e o que falta entregar. */
export function resumoDaProducao(producao, ctx) {
  const permitidos = producao.tipo === "adaptacao" ? trocasDeAdaptacao(ctx.nd, producao.focos) : testesPermitidos(producao, ctx);
  const feitos = producao.tipo === "adaptacao" ? (producao.trocas ?? []).length : producao.tentativas.length;
  const rendeu = producao.tentativas.filter((t) => (producao.tipo === "itens" ? !!t.itemRef : t.sucesso));
  return { permitidos, feitos, restantes: Math.max(0, permitidos - feitos), rendeu: rendeu.length, aEntregar: rendeu.filter((t) => !t.entregue).length };
}

/** Os itens que o Ofício pode criar neste nível, para a tela oferecer. */
export function itensCriaveis(creature, ctx, oficio) {
  const kit = oficioDoKit(oficio);
  if (!kit) return [];
  const tetoDeCusto = custoMaximoCriacao(ctx.nd);
  const fontes = [
    ...kit.cria.filter((c) => c === "arma" || c === "escudo" || c === "uniforme").map((c) => ({ tipo: c })),
    ...(kit.cria.some((c) => !["arma", "escudo", "uniforme"].includes(c)) ? [{ tipo: "item" }] : []),
  ];
  const out = [];
  for (const { tipo } of fontes) {
    for (const def of catalogoDoTipo(tipo, creature)) {
      const a = avaliaItem(creature, ctx, kit, { tipo, refId: def.id });
      if (!a.erro && a.custo <= tetoDeCusto) out.push({ tipo, refId: def.id, nome: def.nome, custo: a.custo, cd: kit.cds[a.custo - 1] });
    }
  }
  return out;
}

