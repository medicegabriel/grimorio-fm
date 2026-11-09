/**
 * ============================================================
 * VOTOS DE RESTRIÇÃO: AS REGRAS DO LIVRO (CL3, 2026-11-01)
 * ============================================================
 * FOLHA: zero imports. Livro de Regras p.350 a 358. Aqui só mora o que o texto diz, em dado e em função pura:
 * os pesos, os tipos, o que cada tipo pode envolver, a legalidade e as contas da Restrição Congênita.
 *
 * ⚠ O PESO É DECLARADO, E NÃO CALCULADO. O livro entrega exemplos e diz que o Narrador decide o que é cada peso
 * (p.352, 354, 355). A ficha não classifica um efeito como Leve ou Pesado: ela confere que a COMBINAÇÃO declarada
 * respeita o texto (temporário até Pesado, permanente a partir de Médio, emergencial um peso acima, e assim por
 * diante). A justiça da troca é da mesa.
 *
 * ⚠ VOTO SEM `tipo` É O VOTO LIVRE DE ANTES (Mecânico escrito à mão, `pacto` legado, `votoAutomatico` de Addon).
 * Ele não passa por nenhuma regra daqui e emite exatamente como emitia. Mexer nisso apagaria texto e efeito de
 * ficha salva.
 *
 * ⚠ VOTO DE ADDON É EXCEÇÃO DECLARADA (`origemAddon`). O pacote que o traz já respondeu pela regra dele (a Prisão
 * da Besta é uma Restrição Congênita escrita pelo autor do pacote), então a validação não o recusa.
 *
 * ⚠ TEXTO DE TELA: Title Case, sem travessão e sem ponto e vírgula. O `motivo` de cada recusa aparece na interface.
 * ============================================================
 */

/* ============================================================ */
/* VOCABULÁRIO                                                   */
/* ============================================================ */
export const TIPOS_DE_VOTO = ["proprio", "emergencial", "congenita"];
export const ROTULO_TIPO_DE_VOTO = {
  proprio: "Voto Próprio", emergencial: "Voto Emergencial", congenita: "Restrição Congênita", contratual: "Voto Contratual",
};
export const PERMANENCIAS = ["temporario", "permanente"];
export const ROTULO_PERMANENCIA = { temporario: "Temporário", permanente: "Permanente" };

/** Os quatro pesos, do menor ao maior (p.352 a 354). "Votos Próprios se limitam em até Extremo" (p.355). */
export const PESOS = ["leve", "medio", "pesado", "extremo"];
export const ROTULO_PESO = { leve: "Leve", medio: "Médio", pesado: "Pesado", extremo: "Extremo" };
export const indiceDoPeso = (peso) => PESOS.indexOf(peso);

/** O que um lado do Voto pode envolver. Uma lista fechada: o que o livro cita, e nada além. */
export const ENVOLVE = [
  "aptidao", "feitico", "pe", "conhecimento", "simples",
  "atributo", "defesa", "rd", "resistencia", "pericia", "movimento", "atencao", "iniciativa", "pv",
];
export const ROTULO_ENVOLVE = {
  aptidao: "Aptidão", feitico: "Feitiço", pe: "Pontos de Energia", conhecimento: "Conhecimento", simples: "Efeito Simples",
  atributo: "Atributo", defesa: "Defesa", rd: "Redução de Dano", resistencia: "Resistência", pericia: "Perícia",
  movimento: "Movimento", atencao: "Atenção", iniciativa: "Iniciativa", pv: "Pontos de Vida",
};
/** p.351: "Elas podem APENAS envolver: Aptidões Amaldiçoadas, Feitiços e seus Pontos de Energia." */
export const ENVOLVE_DO_PROPRIO = ["aptidao", "feitico", "pe"];
/** p.351: a exceção vale para malefícios, "nunca Benefícios": conhecimento (grupo de armas) e coisas simples. */
export const ENVOLVE_A_MAIS_NO_MALEFICIO = ["conhecimento", "simples"];

/** p.357: o que uma Restrição Congênita pode trocar. Os Pontos de Energia ficam de fora de propósito. */
export const DOMINIOS_DA_CONGENITA = [
  "atributo", "defesa", "rd", "resistencia", "pericia", "feiticos", "nivelAptidao", "aptidao", "movimento",
  "atencao", "iniciativa", "pv",
];
export const ROTULO_DOMINIO_DA_CONGENITA = {
  atributo: "Valores de Atributo", defesa: "Defesa", rd: "Redução de Dano", resistencia: "Resistências e Vulnerabilidades",
  pericia: "Perícias e Treinamentos", feiticos: "Quantidade de Feitiços", nivelAptidao: "Níveis de Aptidão",
  aptidao: "Quantidade de Aptidões", movimento: "Movimento", atencao: "Atenção", iniciativa: "Iniciativa", pv: "Pontos de Vida",
};
export const FAMILIAS_DE_DANO = ["elemental", "fisico"];

/* Os números que o livro escreve (p.358). Nada aqui é invenção. */
export const ATRIBUTO_BASE_DA_CONGENITA = 8;
export const ATRIBUTO_LIMITE_MINIMO = 2;
export const PONTOS_POR_PV_REDUZIDO = 2;
export const PONTOS_POR_PV_AUMENTADO = 4;

export const ESTADOS_DE_VOTO = ["proposto", "vigente", "quebrado", "desfeito", "encerrado"];
export const ROTULO_ESTADO_DE_VOTO = {
  proposto: "Proposto", vigente: "Vigente", quebrado: "Quebrado", desfeito: "Desfeito", encerrado: "Encerrado",
};
export const MALEFICIO_ATE = ["fimDoCombate", "interludio"];

/** O tipo de ação que realiza o Voto (p.351, 356). A Restrição Congênita não é feita em jogo. */
export const ACAO_DO_VOTO = { proprio: "bonus", emergencial: "reacao", contratual: "comum", congenita: null };

/* ============================================================ */
/* LEITURA                                                       */
/* ============================================================ */
const lista = (v) => (Array.isArray(v) ? v : []);
const inteiro = (v, padrao = 0) => {
  const n = Math.trunc(Number(v));
  return Number.isFinite(n) ? n : padrao;
};

/** O Voto tem tipo? Sem tipo é o Voto livre de antes e nenhuma regra daqui o alcança. */
export const votoTipado = (voto) => TIPOS_DE_VOTO.includes(voto?.tipo);
export const votoDeAddon = (voto) => typeof voto?.origemAddon === "string" && !!voto.origemAddon;

/** O tipo mostrado, com a permanência: "Voto Próprio Temporário", "Restrição Congênita". */
export function rotuloDoVoto(voto) {
  if (!votoTipado(voto)) return "Voto";
  const base = ROTULO_TIPO_DE_VOTO[voto.tipo];
  if (voto.tipo === "congenita") return base;
  return voto.permanencia ? `${base} ${ROTULO_PERMANENCIA[voto.permanencia] ?? ""}`.trim() : base;
}

/**
 * O que vale AGORA de cada lado do Voto. É o portão de `efeitosDeVotos`.
 *
 *   sem tipo ou sem estado    os dois lados, como sempre foi
 *   vigente                   os dois
 *   quebrado, no combate      nenhum: o malefício sai e o benefício não vem (p.351)
 *   quebrado, malefício até o interlúdio   só o malefício (p.351)
 *   proposto, desfeito, encerrado          nenhum
 */
export function votoEmVigor(voto) {
  if (!votoTipado(voto) || !voto.estado) return { beneficio: true, maleficio: true };
  if (voto.estado === "vigente") return { beneficio: true, maleficio: true };
  if (voto.estado === "quebrado" && voto.maleficioAte === "interludio") return { beneficio: false, maleficio: true };
  return { beneficio: false, maleficio: false };
}

/* ============================================================ */
/* VALIDAÇÃO                                                     */
/* ============================================================ */
const erro = (codigo, motivo) => ({ codigo, motivo });

const possui = (aptidoes, id) => (aptidoes instanceof Set ? aptidoes.has(id) : lista(aptidoes).includes(id));

/** Cada lado do Voto, com os pesos e o que ele envolve, já lidos. */
function ladosDo(voto) {
  return [
    { chave: "beneficio", lado: voto.beneficio ?? {}, rotulo: "Benefício" },
    { chave: "maleficio", lado: voto.maleficio ?? {}, rotulo: "Malefício" },
  ];
}

/**
 * Confere um Voto Próprio ou Emergencial contra p.351 a 356.
 * `ctx`: `{ aptidoes, talentos }` (ids acessíveis), `{ vigentes, bt }` (quantos Votos já valem e o limite).
 */
function validaProprio(voto, ctx, erros) {
  const permanente = voto.permanencia === "permanente";
  if (!PERMANENCIAS.includes(voto.permanencia)) {
    erros.push(erro("permanencia", "Declare Se o Voto é Temporário ou Permanente"));
    return;
  }
  const lados = ladosDo(voto);
  for (const { chave, lado, rotulo } of lados) {
    const peso = lado.peso;
    if (indiceDoPeso(peso) < 0) {
      erros.push(erro(`peso-${chave}`, `Declare o Peso do ${rotulo}`));
      continue;
    }
    // p.355: temporário não passa de Pesado, permanente não fica abaixo de Médio.
    if (!permanente && peso === "extremo") {
      erros.push(erro(`temporario-extremo-${chave}`, "Voto Temporário Não Pode Ter Peso Extremo"));
    }
    if (permanente && peso === "leve") {
      erros.push(erro(`permanente-leve-${chave}`, "Voto Permanente Não Pode Ter Peso Leve"));
    }
  }
  // p.355: "O tipo de Voto sempre será considerado baseado no malefício. É impossível existir um Benefício
  // Permanente e um Malefício Temporário."
  if (!permanente && voto.beneficioDuracao === "permanente") {
    erros.push(erro("beneficio-permanente-malefico-temporario", "Benefício Permanente Exige Malefício Permanente"));
  }
  if (!permanente && voto.antecipaAptidao) {
    // p.353: usar uma Aptidão mais cedo "sempre será permanente".
    erros.push(erro("antecipa-so-permanente", "Antecipar Uma Aptidão Só Vale em Voto Permanente"));
  }
  for (const { chave, lado, rotulo } of lados) {
    const envolve = lista(lado.envolve);
    // p.352: Peso Leve não envolve Aptidões.
    if (lado.peso === "leve" && envolve.includes("aptidao")) {
      erros.push(erro(`leve-sem-aptidao-${chave}`, `Peso Leve No ${rotulo} Não Envolve Aptidões`));
    }
    // p.351: os Votos Próprios envolvem só Aptidões, Feitiços e PE. O malefício ainda pode ser conhecimento ou simples.
    const permitidos = chave === "maleficio" ? [...ENVOLVE_DO_PROPRIO, ...ENVOLVE_A_MAIS_NO_MALEFICIO] : ENVOLVE_DO_PROPRIO;
    const fora = envolve.filter((e) => !permitidos.includes(e));
    if (fora.length) {
      erros.push(erro(`escopo-${chave}`, `O ${rotulo} Envolve Algo Que o Voto Próprio Não Permite`));
    }
  }
  // p.355: aptidão envolvida precisa existir na ficha. Antecipar a Aptidão é a exceção: o Voto a concede.
  if (!voto.antecipaAptidao) {
    const faltando = lista(voto.aptidoes).filter((id) => !possui(ctx.aptidoes, id));
    if (faltando.length) erros.push(erro("aptidao-nao-possuida", "O Voto Envolve Uma Aptidão Que a Ficha Não Tem"));
  }
  // p.356, exceção de Voto Malevolente na p.168. As demais regras continuam iguais.
  if (voto.tipo === "emergencial" && !possui(ctx.talentos, "tal_voto_malevolente")) {
    const b = indiceDoPeso(voto.beneficio?.peso);
    const m = indiceDoPeso(voto.maleficio?.peso);
    if (b >= 0 && m >= 0 && m !== b + 1) {
      erros.push(erro("emergencial-um-peso-acima", "No Voto Emergencial o Malefício Pesa Um Nível a Mais Que o Benefício"));
    }
  }
}

/** O que cada atributo limitado rende: a base é 8 e o limite mínimo é 2 (p.357). */
export function pontosDoLimite(limite) {
  const l = inteiro(limite, NaN);
  if (!Number.isFinite(l) || l < ATRIBUTO_LIMITE_MINIMO || l > ATRIBUTO_BASE_DA_CONGENITA) return 0;
  return ATRIBUTO_BASE_DA_CONGENITA - l;
}

/**
 * A conta de pontos de atributo de uma Restrição Congênita (p.357 e 358).
 *   ganhos    Σ (8 menos o limite) dos atributos limitados, mais 2 por PV por nível reduzido
 *   gastos    Σ dos pontos recebidos por atributo, mais 4 por PV por nível aumentado
 *   saldo     ganhos menos gastos. Zero ou mais é válido, e o que sobra a mesa decide
 */
export function balancoDaCongenita(congenita) {
  const c = congenita ?? {};
  const limitados = lista(c.atributos);
  let ganhos = limitados.reduce((n, a) => n + pontosDoLimite(a?.limite), 0);
  const pv = inteiro(c.pvPorNivel, 0);
  if (pv < 0) ganhos += -pv * PONTOS_POR_PV_REDUZIDO;
  let gastos = Object.values(c.destinos ?? {}).reduce((n, v) => n + Math.max(0, inteiro(v, 0)), 0);
  if (pv > 0) gastos += pv * PONTOS_POR_PV_AUMENTADO;
  return { ganhos, gastos, saldo: ganhos - gastos };
}

/** Confere uma Restrição Congênita contra p.357 e 358. `ctx`: `{ criacao, metodoAtributos }`. */
function validaCongenita(voto, ctx, erros) {
  if (!ctx.criacao) erros.push(erro("congenita-so-na-criacao", "A Restrição Congênita Só Se Faz Na Criação do Personagem"));
  const c = voto.congenita ?? {};
  const trocas = lista(c.trocas);
  for (const t of trocas) {
    for (const ponta of [t?.perde, t?.ganha]) {
      if (ponta === "pe") {
        erros.push(erro("congenita-pe", "Os Pontos de Energia Não Podem Ser Afetados"));
      } else if (!DOMINIOS_DA_CONGENITA.includes(ponta)) {
        erros.push(erro("congenita-dominio", "A Troca Envolve Algo Que a Restrição Congênita Não Permite"));
      }
    }
    // p.358: "Defesa e Redução de Dano não andam de mãos dadas ... você não pode reduzir um para aumentar o outro."
    const par = [t?.perde, t?.ganha];
    if (par.includes("defesa") && par.includes("rd")) {
      erros.push(erro("congenita-defesa-rd", "Defesa e Redução de Dano Não Se Trocam"));
    }
  }
  for (const r of lista(c.resistencias)) {
    // p.357: resistência obriga uma vulnerabilidade da mesma família.
    if (!FAMILIAS_DE_DANO.includes(r?.familia) || !r?.vulnerabilidade) {
      erros.push(erro("congenita-resistencia-vulnerabilidade", "Uma Resistência Exige Vulnerabilidade da Mesma Família de Dano"));
    }
  }
  const atributos = lista(c.atributos);
  for (const a of atributos) {
    if (inteiro(a?.limite, NaN) < ATRIBUTO_LIMITE_MINIMO || inteiro(a?.limite, NaN) > ATRIBUTO_BASE_DA_CONGENITA) {
      erros.push(erro("congenita-limite", "O Limite do Atributo Fica Entre 2 e 8"));
    }
  }
  const mexeEmAtributo = atributos.length > 0
    || Object.values(c.destinos ?? {}).some((v) => inteiro(v, 0) > 0)
    || trocas.some((t) => t?.perde === "atributo" || t?.ganha === "atributo")
    || inteiro(c.pvPorNivel, 0) !== 0;
  // p.358: "Efeitos que modifiquem atributos devem obrigar o usuário do voto a usar o método de Valores Fixos".
  if (mexeEmAtributo && ctx.metodoAtributos && ctx.metodoAtributos !== "valoresFixos") {
    erros.push(erro("congenita-valores-fixos", "Mexer em Atributos Obriga o Método de Valores Fixos"));
  }
  if (balancoDaCongenita(c).saldo < 0) {
    erros.push(erro("congenita-pontos", "Os Pontos de Atributo Recebidos Passam do Que a Restrição Rende"));
  }
  // p.358: "A quantidade de Feitiços recebidos pode ser diminuída, mas é necessário pelo menos cortar a quantidade pela metade."
  const f = c.feiticos;
  if (f && inteiro(f.cortados, 0) > 0 && inteiro(f.cortados, 0) * 2 < inteiro(f.total, 0)) {
    erros.push(erro("congenita-feiticos-metade", "Para Receber Benefício Corte Pelo Menos Metade dos Feitiços"));
  }
}

/**
 * Confere o Voto contra o livro. Devolve `{ ok, legado, excecao, erros, avisos }`.
 * Voto livre (sem `tipo`) e Voto de Addon passam sem erro: o primeiro é o formato de antes, o segundo é exceção
 * declarada pelo pacote.
 */
export function validaVoto(voto, ctx = {}) {
  const erros = [];
  const avisos = [];
  if (votoDeAddon(voto)) return { ok: true, legado: false, excecao: true, erros, avisos };
  if (!votoTipado(voto)) return { ok: true, legado: true, excecao: false, erros, avisos };
  if (voto.tipo === "congenita") validaCongenita(voto, ctx, erros);
  else validaProprio(voto, ctx, erros);
  // p.350: a quantidade de Votos é igual ao Bônus de Treinamento.
  if (Number.isFinite(Number(ctx.bt)) && inteiro(ctx.vigentes, 0) >= inteiro(ctx.bt, 0) && voto.estado !== "vigente") {
    erros.push(erro("limite-bt", "A Ficha Já Tem Votos Em Número Igual ao Bônus de Treinamento"));
  }
  return { ok: erros.length === 0, legado: false, excecao: false, erros, avisos };
}

/* ============================================================ */
/* LEITURA DO QUE FICA SALVO                                     */
/* ============================================================ */
export const HISTORICO_MAX = 50;
export const EVENTOS_DE_VOTO = [
  "proposto", "realizado", "aceito", "recusado", "quebrado", "desfeito", "encerrado", "cumprido",
  "fimDoCombate", "interludio", "prazo", "nota",
];

const texto = (v, max = 400) => (typeof v === "string" ? v.slice(0, max) : "");
const objeto = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : null);
const idsDe = (v) => lista(v).filter((x) => typeof x === "string" && x).slice(0, 40);

function historicoLido(v) {
  return lista(v)
    .filter((h) => objeto(h) && EVENTOS_DE_VOTO.includes(h.evento))
    .slice(-HISTORICO_MAX)
    .map((h) => ({
      evento: h.evento,
      ...(typeof h.opId === "string" && h.opId ? { opId: h.opId } : {}),
      ...(Number.isFinite(Number(h.rodada)) ? { rodada: Math.max(0, inteiro(h.rodada)) } : {}),
      ...(typeof h.nota === "string" && h.nota ? { nota: texto(h.nota) } : {}),
    }));
}

function duracaoLida(d) {
  const o = objeto(d);
  if (!o) return null;
  if (o.ate === "cena") return { ate: "cena" };
  const rodadas = inteiro(o.rodadas, 0);
  return rodadas > 0 ? { rodadas } : null;
}

function congenitaLida(c) {
  const o = objeto(c);
  if (!o) return null;
  const atributos = lista(o.atributos)
    .filter((a) => objeto(a) && typeof a.atributo === "string" && a.atributo)
    .map((a) => ({ atributo: a.atributo, limite: inteiro(a.limite, ATRIBUTO_BASE_DA_CONGENITA) }));
  const destinos = {};
  for (const [k, v] of Object.entries(objeto(o.destinos) ?? {})) if (k && inteiro(v, 0) > 0) destinos[k] = inteiro(v, 0);
  const trocas = lista(o.trocas)
    .filter((t) => objeto(t) && typeof t.perde === "string" && typeof t.ganha === "string")
    .map((t) => ({ perde: t.perde, ganha: t.ganha }));
  const resistencias = lista(o.resistencias)
    .filter((r) => objeto(r) && typeof r.tipo === "string")
    .map((r) => ({
      tipo: r.tipo,
      ...(FAMILIAS_DE_DANO.includes(r.familia) ? { familia: r.familia } : {}),
      ...(typeof r.vulnerabilidade === "string" && r.vulnerabilidade ? { vulnerabilidade: r.vulnerabilidade } : {}),
    }));
  const f = objeto(o.feiticos);
  return {
    atributos, destinos, trocas, resistencias,
    pvPorNivel: inteiro(o.pvPorNivel, 0),
    ...(f ? { feiticos: { total: Math.max(0, inteiro(f.total, 0)), cortados: Math.max(0, inteiro(f.cortados, 0)) } } : {}),
  };
}

/** O que um lado do Voto guarda além do texto e dos efeitos: o peso declarado e o que ele envolve. */
export function camposDoLado(lado) {
  const envolve = lista(lado?.envolve).filter((e) => ENVOLVE.includes(e));
  return {
    ...(PESOS.includes(lado?.peso) ? { peso: lado.peso } : {}),
    ...(envolve.length ? { envolve: [...new Set(envolve)] } : {}),
  };
}

/**
 * Os campos de Voto tipado de um Mecânico, lidos do armazenamento. SÓ ENTRAM OS QUE EXISTEM: o Voto livre de antes
 * volta sem chave nova, byte a byte. Lixo vira ausência e nunca derruba.
 */
export function camposTipadosDoMecanico(voto) {
  if (!votoTipado(voto)) return {};
  const duracao = duracaoLida(voto.duracao);
  const congenita = voto.tipo === "congenita" ? congenitaLida(voto.congenita) : null;
  return {
    tipo: voto.tipo,
    ...(PERMANENCIAS.includes(voto.permanencia) ? { permanencia: voto.permanencia } : {}),
    ...(voto.beneficioDuracao === "permanente" || voto.beneficioDuracao === "temporario" ? { beneficioDuracao: voto.beneficioDuracao } : {}),
    ...(duracao ? { duracao } : {}),
    ...(voto.antecipaAptidao ? { antecipaAptidao: true } : {}),
    ...(idsDe(voto.aptidoes).length ? { aptidoes: idsDe(voto.aptidoes) } : {}),
    ...(idsDe(voto.feiticos).length ? { feiticos: idsDe(voto.feiticos) } : {}),
    ...(ESTADOS_DE_VOTO.includes(voto.estado) ? { estado: voto.estado } : {}),
    ...(MALEFICIO_ATE.includes(voto.maleficioAte) ? { maleficioAte: voto.maleficioAte } : {}),
    ...(inteiro(voto.rodadasRestantes, 0) > 0 ? { rodadasRestantes: inteiro(voto.rodadasRestantes, 0) } : {}),
    ...(Number.isFinite(Number(voto.rodadaContada)) ? { rodadaContada: Math.max(0, inteiro(voto.rodadaContada)) } : {}),
    ...(congenita ? { congenita } : {}),
    ...(lista(voto.historico).length ? { historico: historicoLido(voto.historico) } : {}),
  };
}

/**
 * Os campos de um Voto Contratual além do texto. "Votos Contratuais não possuem pesos" (p.356): as condições são dos
 * participantes. A consequência de quebrar é "definida pelo Narrador" (p.356), então é TEXTO que a mesa escreve e a
 * ficha nunca interpreta.
 */
export function camposDoContratual(voto) {
  const participantes = lista(voto?.participantes)
    .filter((p) => objeto(p) && typeof p.nome === "string" && p.nome.trim())
    .slice(0, 12)
    .map((p) => ({
      nome: texto(p.nome, 80),
      ...(typeof p.id === "string" && p.id ? { id: p.id } : {}),
      aceitou: p.aceitou === true,
      capaz: p.capaz === true,
    }));
  const r = objeto(voto?.ruptura);
  return {
    ...(PERMANENCIAS.includes(voto?.permanencia) ? { permanencia: voto.permanencia } : {}),
    ...(participantes.length ? { participantes } : {}),
    ...(ESTADOS_DE_VOTO.includes(voto?.estado) ? { estado: voto.estado } : {}),
    ...(r ? { ruptura: { quem: texto(r.quem, 80), consequencia: texto(r.consequencia, 1000), rodada: Math.max(0, inteiro(r.rodada, 0)) } } : {}),
    ...(lista(voto?.historico).length ? { historico: historicoLido(voto.historico) } : {}),
  };
}
