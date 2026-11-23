/**
 * O FORMATO SALVO DO FEITIÇO DE ECLESIASTES (2026-11-23)
 *
 * Mora em `creature.feiticosEcl`, separado de `creature.feiticos` (o modelo por
 * Nível, que continua guardando as Técnicas Marciais). Nenhum calculador antigo
 * enxerga este formato, e este motor não enxerga o antigo.
 *
 * ⚠ AS COMPRAS SÃO QUANTIDADES, NUNCA PONTOS: número de dados, pontos de
 * alcance, pontos de cada dimensão, unidades de cada efeito, rodadas. O custo é
 * recalculado do BT a cada derive, então subir de nível reorganiza o orçamento
 * sozinho e o estouro aparece como "Faltam N Pontos" em vez de sumir calado.
 *
 * ⚠ FOLHA, ZERO IMPORTS (lista `FOLHAS` do `asserts/t-ordem-modulos.mjs`).
 */

let sequencia = 0;
export const novoIdEcl = (prefixo = "fecl") => `${prefixo}_${Date.now().toString(36)}_${(sequencia++).toString(36)}`;

const inteiro = (v, min = 0, max = Infinity) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
};
const texto = (v) => (typeof v === "string" ? v : "");
const bool = (v) => v === true;
const umDe = (v, opcoes, padrao) => (opcoes.includes(v) ? v : padrao);
const lista = (v) => (Array.isArray(v) ? v : []);

const DURACOES = ["imediato", "duradouro", "sustentado"];

export function criarAuxiliarEcl(efeito = "defesa") {
  return {
    id: novoIdEcl("aux"), efeito, sentido: "bonus", unidades: 1, alvo: "proprio", escolha: "",
    duracao: "imediato", ativado: false, condicional: false,
    permuta: { contrapartidas: [] },
  };
}

export function criarCondicaoEcl(condicao = "lento") {
  return { id: novoIdEcl("cond"), condicao, alvo: "alvo", duracao: "imediato", ajusteRemocao: 0, notaRemocao: "" };
}

export function criarRequisitoEcl() {
  return { id: novoIdEcl("req"), texto: "", dificuldade: "facil" };
}

export function criarFeiticoEcl(extra = {}) {
  return normalizarFeiticoEcl({ id: novoIdEcl(), ...extra });
}

function normalizarAuxiliar(a) {
  const permuta = a?.permuta ?? {};
  return {
    id: texto(a?.id) || novoIdEcl("aux"),
    efeito: texto(a?.efeito) || "defesa",
    sentido: umDe(a?.sentido, ["bonus", "debuff"], "bonus"),
    unidades: inteiro(a?.unidades, 0, 99),
    alvo: umDe(a?.alvo, ["proprio", "alvo", "area"], "proprio"),
    escolha: texto(a?.escolha),
    duracao: umDe(a?.duracao, DURACOES, "imediato"),
    ativado: bool(a?.ativado),
    condicional: bool(a?.condicional),
    permuta: {
      contrapartidas: lista(permuta.contrapartidas).map((c) => ({
        id: texto(c?.id) || novoIdEcl("ctp"),
        efeito: texto(c?.efeito) || "deslocamento",
        unidades: inteiro(c?.unidades, 0, 99),
        escolha: texto(c?.escolha),
      })),
    },
  };
}

function normalizarCondicao(c) {
  return {
    id: texto(c?.id) || novoIdEcl("cond"),
    condicao: texto(c?.condicao) || "lento",
    alvo: umDe(c?.alvo, ["alvo", "area"], "alvo"),
    duracao: umDe(c?.duracao, DURACOES, "imediato"),
    ajusteRemocao: inteiro(c?.ajusteRemocao, 0, 999),
    notaRemocao: texto(c?.notaRemocao),
  };
}

function normalizarRequisitos(v) {
  return lista(v).map((r) => ({
    id: texto(r?.id) || novoIdEcl("req"),
    texto: texto(r?.texto),
    dificuldade: umDe(r?.dificuldade, ["facil", "medio", "dificil", "impossivel"], "facil"),
  }));
}

export function normalizarFeiticoEcl(f = {}) {
  const alcance = f.alcance ?? {};
  const area = f.area ?? {};
  const mult = f.multiplos ?? {};
  const dano = f.dano ?? {};
  const cura = f.cura ?? {};
  const dur = f.duracao ?? {};
  const lib = f.liberacao ?? {};
  const pas = f.passivo ?? {};
  return {
    id: texto(f.id) || novoIdEcl(),
    nome: texto(f.nome),
    natureza: umDe(f.natureza, ["ativo", "passivo"], "ativo"),
    tipo: umDe(f.tipo, ["comum", "destrutivo", "cataclismico"], "comum"),
    tecnicaMaxima: bool(f.tecnicaMaxima),
    nd: inteiro(f.nd ?? 1, 1, 999),
    acao: umDe(f.acao, ["bonus", "comum", "completa", "reacao"], "comum"),
    requisitos: normalizarRequisitos(f.requisitos),
    fadiga: inteiro(f.fadiga, 0, 99),
    exaustao: inteiro(f.exaustao, 0, 99),
    alcance: {
      modo: umDe(alcance.modo, ["proprio", "toque", "distancia"], "toque"),
      pontos: inteiro(alcance.pontos, 0, 99),
    },
    area: {
      ativa: bool(area.ativa),
      formato: umDe(area.formato, ["esfera", "cone", "linha"], "esfera"),
      pontos: inteiro(area.pontos, 0, 99),
      faixas: lista(area.faixas).map((x) => ({ id: texto(x?.id) || novoIdEcl("fx"), metros: Math.max(0, Number(x?.metros) || 0) })),
      auxEmArea: bool(area.auxEmArea),
      zona: bool(area.zona),
    },
    multiplos: {
      ativo: bool(mult.ativo),
      alvos: inteiro(mult.alvos, 0, 99),
      disparos: inteiro(mult.disparos, 0, 99),
      areas: inteiro(mult.areas, 0, 99),
    },
    dano: {
      dados: inteiro(dano.dados, 0, 999),
      tipo: texto(dano.tipo),
      resolucao: umDe(dano.resolucao, ["tr", "ataque"], "tr"),
      tr: texto(dano.tr) || "reflexos",
      continuo: bool(dano.continuo),
      duracaoContinuo: umDe(dano.duracaoContinuo, ["duradouro", "sustentado"], "duradouro"),
      trEncerra: texto(dano.trEncerra),
      vampirico: bool(dano.vampirico),
      ignorarResistencias: bool(dano.ignorarResistencias),
      morteDireta: bool(dano.morteDireta),
    },
    cura: {
      dados: inteiro(cura.dados, 0, 999),
      continuo: bool(cura.continuo),
      duracaoContinuo: umDe(cura.duracaoContinuo, ["duradouro", "sustentado"], "duradouro"),
    },
    auxiliares: lista(f.auxiliares).map(normalizarAuxiliar),
    condicoes: lista(f.condicoes).map(normalizarCondicao),
    duracao: {
      rodadas: inteiro(dur.rodadas ?? 1, 1, 999),
      concentracaoDuradoura: bool(dur.concentracaoDuradoura),
      concentracaoSustentada: bool(dur.concentracaoSustentada),
    },
    liberacao: normalizarLiberacao(lib),
    passivo: {
      modo: umDe(pas.modo, ["permanente", "condicional", "semiativo"], "permanente"),
      aprimoramentos: inteiro(pas.aprimoramentos, 0, 99),
      gatilho: texto(pas.gatilho),
      usos: umDe(pas.usos, ["metade", "um", "bt"], "metade"),
      recarga: umDe(pas.recarga, ["cena", "descanso", "interludio"], "cena"),
      fadiga: inteiro(pas.fadiga, 0, 99),
      exaustao: inteiro(pas.exaustao, 0, 99),
      requisitos: normalizarRequisitos(pas.requisitos),
    },
    descricao: texto(f.descricao),
  };
}

/* ============================================================
   A CAMADA DA LIBERAÇÃO MÁXIMA (autor, 2026-11-23)
   ============================================================
   A Liberação compra QUALQUER coisa da tabela, nova ou não ("Pode Tudo"), paga
   pelos ⌊ND/2⌋ + 4 pontos dela. Ela guarda só o que SOMA ao Feitiço base:
     números   são o EXTRA (dados, pontos de alcance e de área, alvos, unidades
               de cada efeito do base, rodadas)
     chaves    só LIGAM (Área, Distância, Múltiplos, Vampírico, Concentração)
     novos     efeitos e Condições que só existem na Liberação
     escolhas  de Dano e Cura (tipo, resolução, Contínuo) valem só quando o base
               não tem Dano ou Cura
   Guardar o extra, e não o Feitiço liberado inteiro, faz o base mandar: mexer
   no base sobe o piso da Liberação junto, e a Liberação nunca fica abaixo dele.
   `aplicarLiberacaoEcl` monta o Feitiço liberado e `diferencaLiberacaoEcl` faz
   o caminho de volta (a tela edita o Feitiço liberado e grava a diferença).
   ============================================================ */

function normalizarLiberacao(lib = {}) {
  const al = lib.alcance ?? {};
  const ar = lib.area ?? {};
  const mu = lib.multiplos ?? {};
  const da = lib.dano ?? {};
  const cu = lib.cura ?? {};
  const du = lib.duracao ?? {};
  // Formato antigo da entrega 1 (dados, curaDados, alcancePontos, areaPontos soltos).
  const antigo = typeof lib.dados === "number" || typeof lib.curaDados === "number"
    || typeof lib.alcancePontos === "number" || typeof lib.areaPontos === "number";
  return {
    alcance: { distancia: bool(al.distancia), pontos: inteiro(antigo ? lib.alcancePontos : al.pontos, 0, 99) },
    area: {
      ativa: bool(ar.ativa),
      formato: umDe(ar.formato, ["esfera", "cone", "linha"], ""),
      pontos: inteiro(antigo ? lib.areaPontos : ar.pontos, 0, 99),
      faixas: lista(ar.faixas).map((x) => ({ id: texto(x?.id) || novoIdEcl("fx"), metros: Math.max(0, Number(x?.metros) || 0) })),
    },
    multiplos: {
      ativo: bool(mu.ativo),
      alvos: inteiro(mu.alvos, 0, 99),
      disparos: inteiro(mu.disparos, 0, 99),
      areas: inteiro(mu.areas, 0, 99),
    },
    dano: {
      dados: inteiro(antigo ? lib.dados : da.dados, 0, 999),
      tipo: texto(da.tipo),
      resolucao: umDe(da.resolucao, ["tr", "ataque"], ""),
      tr: texto(da.tr),
      continuo: bool(da.continuo),
      duracaoContinuo: umDe(da.duracaoContinuo, ["duradouro", "sustentado"], ""),
      vampirico: bool(da.vampirico),
      ignorarResistencias: bool(da.ignorarResistencias),
      morteDireta: bool(da.morteDireta),
    },
    cura: {
      dados: inteiro(antigo ? lib.curaDados : cu.dados, 0, 999),
      continuo: bool(cu.continuo),
      duracaoContinuo: umDe(cu.duracaoContinuo, ["duradouro", "sustentado"], ""),
    },
    auxiliares: Object.fromEntries(Object.entries(lib.auxiliares ?? {})
      .map(([id, u]) => [id, inteiro(u, 0, 99)]).filter(([, u]) => u > 0)),
    auxiliaresNovos: lista(lib.auxiliaresNovos).map(normalizarAuxiliar),
    condicoesNovas: lista(lib.condicoesNovas).map(normalizarCondicao),
    duracao: {
      rodadas: inteiro(du.rodadas, 0, 999),
      concentracaoDuradoura: bool(du.concentracaoDuradoura),
      concentracaoSustentada: bool(du.concentracaoSustentada),
    },
  };
}

/** A camada tem alguma compra? */
export function liberacaoTemCompraEcl(lib) {
  if (!lib) return false;
  return !!(lib.alcance.distancia || lib.alcance.pontos || lib.area.ativa || lib.area.pontos || lib.area.faixas.length
    || lib.multiplos.ativo || lib.multiplos.alvos || lib.multiplos.disparos || lib.multiplos.areas
    || lib.dano.dados || lib.dano.vampirico || lib.dano.ignorarResistencias || lib.dano.morteDireta || lib.cura.dados
    || Object.keys(lib.auxiliares).length || lib.auxiliaresNovos.length || lib.condicoesNovas.length
    || lib.duracao.rodadas || lib.duracao.concentracaoDuradoura || lib.duracao.concentracaoSustentada);
}

/** O Feitiço como ele sai em Liberação Máxima (base + camada), sem camada própria. */
export function aplicarLiberacaoEcl(fCru) {
  const f = normalizarFeiticoEcl(fCru);
  const lib = f.liberacao;
  const semDano = f.dano.dados === 0;
  const semCura = f.cura.dados === 0;
  const areaBase = f.area.ativa || f.tipo === "destrutivo";
  return normalizarFeiticoEcl({
    ...f,
    alcance: {
      modo: lib.alcance.distancia ? "distancia" : f.alcance.modo,
      pontos: f.alcance.pontos + lib.alcance.pontos,
    },
    area: {
      ...f.area,
      ativa: f.area.ativa || lib.area.ativa,
      formato: !areaBase && lib.area.formato ? lib.area.formato : f.area.formato,
      pontos: f.area.pontos + lib.area.pontos,
      faixas: [...f.area.faixas, ...lib.area.faixas],
    },
    multiplos: {
      ativo: f.multiplos.ativo || lib.multiplos.ativo,
      alvos: f.multiplos.alvos + lib.multiplos.alvos,
      disparos: f.multiplos.disparos + lib.multiplos.disparos,
      areas: f.multiplos.areas + lib.multiplos.areas,
    },
    dano: {
      ...f.dano,
      dados: f.dano.dados + lib.dano.dados,
      ...(semDano ? {
        tipo: lib.dano.tipo || f.dano.tipo,
        resolucao: lib.dano.resolucao || f.dano.resolucao,
        tr: lib.dano.tr || f.dano.tr,
        continuo: lib.dano.continuo,
        duracaoContinuo: lib.dano.duracaoContinuo || f.dano.duracaoContinuo,
      } : {}),
      vampirico: f.dano.vampirico || lib.dano.vampirico,
      ignorarResistencias: f.dano.ignorarResistencias || lib.dano.ignorarResistencias,
      morteDireta: f.dano.morteDireta || lib.dano.morteDireta,
    },
    cura: {
      dados: f.cura.dados + lib.cura.dados,
      continuo: semCura ? lib.cura.continuo : f.cura.continuo,
      duracaoContinuo: semCura ? (lib.cura.duracaoContinuo || f.cura.duracaoContinuo) : f.cura.duracaoContinuo,
    },
    auxiliares: [
      ...f.auxiliares.map((a) => ({ ...a, unidades: a.unidades + (lib.auxiliares[a.id] ?? 0) })),
      ...lib.auxiliaresNovos,
    ],
    condicoes: [...f.condicoes, ...lib.condicoesNovas],
    duracao: {
      rodadas: f.duracao.rodadas + lib.duracao.rodadas,
      concentracaoDuradoura: f.duracao.concentracaoDuradoura || lib.duracao.concentracaoDuradoura,
      concentracaoSustentada: f.duracao.concentracaoSustentada || lib.duracao.concentracaoSustentada,
    },
    liberacao: {},
  });
}

/** Caminho de volta: dado o base e o Feitiço liberado editado, a camada. O que
 *  ficaria abaixo do base (ou desligaria uma chave dele) volta ao piso, calado. */
export function diferencaLiberacaoEcl(baseCru, liberadoCru) {
  const f = normalizarFeiticoEcl(baseCru);
  const L = normalizarFeiticoEcl(liberadoCru);
  const extra = (a, b) => Math.max(0, a - b);
  const semDano = f.dano.dados === 0;
  const semCura = f.cura.dados === 0;
  const areaBase = f.area.ativa || f.tipo === "destrutivo";
  const idsBase = new Set(f.auxiliares.map((a) => a.id));
  const idsCondBase = new Set(f.condicoes.map((c) => c.id));
  const idsFaixaBase = new Set(f.area.faixas.map((x) => x.id));
  return normalizarLiberacao({
    alcance: {
      distancia: f.alcance.modo !== "distancia" && L.alcance.modo === "distancia",
      pontos: extra(L.alcance.pontos, f.alcance.pontos),
    },
    area: {
      ativa: !f.area.ativa && L.area.ativa,
      formato: areaBase ? "" : L.area.formato,
      pontos: extra(L.area.pontos, f.area.pontos),
      faixas: L.area.faixas.filter((x) => !idsFaixaBase.has(x.id)),
    },
    multiplos: {
      ativo: !f.multiplos.ativo && L.multiplos.ativo,
      alvos: extra(L.multiplos.alvos, f.multiplos.alvos),
      disparos: extra(L.multiplos.disparos, f.multiplos.disparos),
      areas: extra(L.multiplos.areas, f.multiplos.areas),
    },
    dano: {
      dados: extra(L.dano.dados, f.dano.dados),
      ...(semDano ? {
        tipo: L.dano.tipo, resolucao: L.dano.resolucao, tr: L.dano.tr,
        continuo: L.dano.continuo, duracaoContinuo: L.dano.duracaoContinuo,
      } : {}),
      vampirico: !f.dano.vampirico && L.dano.vampirico,
      ignorarResistencias: !f.dano.ignorarResistencias && L.dano.ignorarResistencias,
      morteDireta: !f.dano.morteDireta && L.dano.morteDireta,
    },
    cura: {
      dados: extra(L.cura.dados, f.cura.dados),
      ...(semCura ? { continuo: L.cura.continuo, duracaoContinuo: L.cura.duracaoContinuo } : {}),
    },
    auxiliares: Object.fromEntries(f.auxiliares.map((a) => {
      const l = L.auxiliares.find((x) => x.id === a.id);
      return [a.id, l ? extra(l.unidades, a.unidades) : 0];
    })),
    auxiliaresNovos: L.auxiliares.filter((a) => !idsBase.has(a.id)),
    condicoesNovas: L.condicoes.filter((c) => !idsCondBase.has(c.id)),
    duracao: {
      rodadas: extra(L.duracao.rodadas, f.duracao.rodadas),
      concentracaoDuradoura: !f.duracao.concentracaoDuradoura && L.duracao.concentracaoDuradoura,
      concentracaoSustentada: !f.duracao.concentracaoSustentada && L.duracao.concentracaoSustentada,
    },
  });
}

export const feiticosEclDaFicha = (creature) => lista(creature?.feiticosEcl);
