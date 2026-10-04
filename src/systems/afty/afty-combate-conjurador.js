import {
  calcularFeiticoAuxiliar, calcularFeiticoTransformacao, defaultAcaoMult, resolverAcaoAux,
} from "./afty-feiticos";

/**
 * ============================================================
 * TÉCNICAS DE COMBATE: SÃO DUAS HABILIDADES, NÃO UMA
 * ============================================================
 * ⚠ CORRIGIDO EM 2026-09-02, e a falha era total: a habilidade do CONTROLADOR
 * existia no catálogo desde sempre e NÃO FAZIA NADA. O resolvedor conhecia só o
 * id do Conjurador, então pegar `ctr_tecnicas_de_combate` num Controlador dava
 * exatamente o mesmo resultado de não pegar nada (medido: `ativa: false`,
 * `armas: []`). O seletor de armas nem aparecia na tela, porque o `extra` do
 * card comparava com o id do Conjurador. E junto morria a `ctr_combate_em_alcateia`
 * (6°), que exige esta como pré-requisito: um galho inteiro inalcançável.
 *
 * ⚠ E O ATRIBUTO NÃO É O MESMO. O texto de cada uma manda um par diferente:
 *
 *   Conjurador  "utilizar Inteligência ou Sabedoria nas jogadas de ataque e dano"
 *   Controlador "utilizar Presença ou Sabedoria nas jogadas de ataque e dano"
 *   Suporte     "utilizar Presença ou Sabedoria nas jogadas de ataque e dano"
 *
 * Quem tem as duas (multiclasse) soma os pares, e é por isso que a lista sai
 * calculada em vez de constante: cravar três atributos daria Inteligência a um
 * Controlador puro, e cravar dois daria Presença a um Conjurador puro.
 *
 * ⚠ O SUPORTE ENTROU EM 2026-09-29, e pelo mesmo buraco do Controlador: a
 * `sup_tecnicas_de_combate` estava no catálogo, no nível certo e com o texto
 * certo, e não ligava em nada. Registrar o id aqui é tudo que ela precisava,
 * porque o resolvedor, o seletor de armas e a troca de atributo por arma já
 * eram genéricos.
 *
 * ⚠ E ENTROU COM O PAR ERRADO (corrigido em 2026-10-02). Foi registrada com
 * Inteligência ou Sabedoria, que é o texto do Conjurador, e o livro dá ao
 * Suporte Presença ou Sabedoria (Livro de Regras, p. 105, o mesmo texto do
 * catálogo). O sintoma, relatado pelo autor: a Inteligência gravada pela do
 * Conjurador continuava valendo depois de trocar para a do Suporte, porque
 * cabia no par errado e não caía no primeiro do texto.
 */
export const TECNICAS_COMBATE_ID = "cnj_tecnicas_de_combate";
export const TECNICAS_COMBATE_ID_CTR = "ctr_tecnicas_de_combate";
export const TECNICAS_COMBATE_ID_SUP = "sup_tecnicas_de_combate";
export const TECNICAS_COMBATE_IDS = [
  TECNICAS_COMBATE_ID, TECNICAS_COMBATE_ID_CTR, TECNICAS_COMBATE_ID_SUP,
];

/* O par de atributos que CADA habilidade libera, na ordem do texto. */
const TECNICAS_ATRIBUTOS = {
  [TECNICAS_COMBATE_ID]: ["inteligencia", "sabedoria"],
  [TECNICAS_COMBATE_ID_CTR]: ["presenca", "sabedoria"],
  [TECNICAS_COMBATE_ID_SUP]: ["presenca", "sabedoria"],
};

/* Os atributos que um conjunto de Técnicas de Combate libera, somados sem
   repetir. Ordem estável: a do texto de cada habilidade, na ordem em que elas
   aparecem em TECNICAS_COMBATE_IDS. O card de uma habilidade que não foi
   escolhida pede só o par dela por aqui, para a tela não montar a lista de novo. */
export function atributosDasTecnicas(ids = []) {
  const permitidos = [];
  for (const id of TECNICAS_COMBATE_IDS) {
    if (!lista(ids).includes(id)) continue;
    for (const attr of TECNICAS_ATRIBUTOS[id]) {
      if (!permitidos.includes(attr)) permitidos.push(attr);
    }
  }
  return permitidos;
}
export const COMBATE_AMALDICOADO_ID = "cnj_combate_amaldicoado";
export const IMBUIR_TECNICA_ID = "cnj_imbuir_com_tecnica";
export const ESGRIMISTA_JUJUTSU_ID = "cnj_esgrimista_jujutsu";
/* ⚠ SUSTENTAR NÃO É SÓ DO CONJURADOR. O Suporte tem as duas com o MESMO texto,
   palavra por palavra (livro, Conjurador nas linhas 2846 e 2891, Suporte nas
   3561 e 3615), e até 2026-09-29 só os ids do Conjurador eram consultados: um
   Suporte de nível 8 ficava com uma vaga em vez de duas, e no 16 com uma em vez
   de três, sem aviso nenhum na tela. As duas habilidades existiam no catálogo e
   não ligavam em coisa alguma.

   A lista é por DEGRAU, e não por especialização, e é isso que impede o
   acúmulo indevido: quem tem as duas versões numa multiclasse continua no teto
   do degrau (3), porque a conta escolhe o degrau e não soma as fontes. */
export const SUSTENTACAO_AVANCADA_IDS = ["cnj_sustentacao_avancada", "sup_sustentacao_avancada"];
export const SUSTENTACAO_MESTRE_IDS = ["cnj_sustentacao_mestre", "sup_sustentacao_mestre"];

const ESTADO_COMBATE = "combateAmaldicoado";
const ESTADO_ESGRIMISTA = "esgrimistaJujutsu";
const ESTADO_IMBUIR = "imbuirTecnica";

const lista = (v) => (Array.isArray(v) ? v : []);
const tem = (habilidades, id) => lista(habilidades).includes(id);
/* Qualquer uma da lista serve: o mesmo degrau chega por mais de uma
   especialização, e ter as duas não sobe o teto. */
const temAlguma = (habilidades, ids) => ids.some((id) => tem(habilidades, id));

export function resolveTecnicasCombate(creature, armasCatalogo = [], habilidades = []) {
  const fontes = TECNICAS_COMBATE_IDS.filter((id) => tem(habilidades, id));
  const ativa = fontes.length > 0;
  const validas = new Set(lista(armasCatalogo).map((a) => a?.id).filter(Boolean));
  const brutas = lista(creature?.tecnicasCombate?.armas);
  const armas = [];
  for (const id of brutas) {
    if (!validas.has(id) || armas.includes(id)) continue;
    armas.push(id);
    if (armas.length === 2) break;
  }
  const permitidos = atributosDasTecnicas(fontes);
  const escolhido = creature?.tecnicasCombate?.atributo;
  return {
    ativa,
    fontes,
    armas: ativa ? armas : [],
    /* ⚠ A LISTA SAI DAQUI, e a tela NÃO a monta de novo. Ela depende de quais
       habilidades a ficha tem, e um segundo lugar montando o mesmo par
       divergiria na primeira errata, que é a lição do `fontes.jsx`. */
    atributosOk: permitidos,
    /* Guardado fora da lista permitida cai no primeiro do texto: é o caso de
       quem tinha a do Conjurador com Inteligência e trocou para a do Suporte ou
       a do Controlador. */
    atributo: permitidos.includes(escolhido) ? escolhido : (permitidos[0] ?? "inteligencia"),
    max: 2,
  };
}

export function feiticoPodeSerImbuido(feitico) {
  if (feitico?.tipo !== "dano") return false;
  if (feitico?.alvo === "area") return false;
  if (!["nenhum", "vampirico"].includes(feitico?.subtipo ?? "nenhum")) return false;
  return ["bonus", "comum"].includes(feitico?.acao ?? "comum");
}

function acaoPadraoAuxiliar(feitico) {
  if (feitico?.tipo !== "auxiliar") return null;
  if (feitico.multiplosAtivo) {
    return defaultAcaoMult(feitico.efeitosMult, feitico.duracaoMult || "imediata");
  }
  return resolverAcaoAux(
    feitico.efeitoAux || "defesa",
    feitico.duracaoAux || "imediata",
    "padrao",
  );
}

const auxiliarBonus = (f) => f?.tipo === "auxiliar" && acaoPadraoAuxiliar(f) === "bonus";
const auxiliarSustentado = (f) => f?.tipo === "auxiliar"
  && (f.multiplosAtivo ? f.duracaoMult : f.duracaoAux) === "sustentada";

/* A Transformação concede "efeitos auxiliares", e por isso liga pelos mesmos
   caminhos do Auxiliar. A duração que ela não reconhece cai em Sustentada, que é
   o padrão do `calcularFeiticoTransformacao`, e a leitura aqui segue a mesma. */
const ehTransformacao = (f) => f?.tipo === "especial" && f?.especialSubtipo === "transformacao";
const transformacaoSustentada = (f) => ehTransformacao(f) && !["duradoura", "cena"].includes(f.transfDuracao);

/* ============================================================
   O INTERRUPTOR POR FEITIÇO (2026-09-10)
   ============================================================
   Autor, com o retorno dos jogadores: o Feitiço Auxiliar "não está aparecendo"
   na aba Buffs, e a Transformação "nunca apareceu". Não era regressão: desde o
   commit que criou a ativação (18/08) só dois caminhos existiam, a Sustentação
   (só o Sustentado) e o Esgrimista Jujutsu (só o de ação bônus). O Imediato e o
   Duradouro, que são os buffs comuns, e a Transformação não tinham onde ligar.

   Decisão do autor: "Interruptor por Feitiço". Cada Auxiliar Imediato ou
   Duradouro, e cada Transformação Duradoura ou de Cena, vira um estado de
   liga e desliga. O Sustentado continua preso às vagas de Sustentação.

   ⚠ O DONO põe estes estados numa sub-aba própria da aba Buffs. Sem dono eles
   caem no balde, e quem tem estado de habilidade abre a aba em outra sub-aba e
   não os vê, que era a outra metade do "não está aparecendo".

   ⚠ A SUB-ABA É "TÉCNICA" desde 2026-09-17, e era "Feitiços". O autor definiu a
   divisão da aba por PAPEL e não por catálogo: *"Técnica, se refere a
   transformações, habilidades auxiliares coisas que se ativa"*. O Auxiliar
   ligado e a Transformação são exatamente isso, e ficavam numa sub-aba ao lado
   do Estilo e do Domínio, que fazem a mesma coisa. O id acompanha o rótulo
   porque ele não é gravado em ficha nenhuma. */
const DONO_FEITICOS = { id: "tecnica", label: "Técnica" };
const ESTADO_LIGADO = "feiticoLigado_";
export const estadoLigadoDoFeitico = (id) => `${ESTADO_LIGADO}${id}`;

/* ⚠ OS ESPAÇOS DE ATRIBUTO E TR DA TRANSFORMAÇÃO FICAM FORA DO NÚMERO. O
   Auxiliar escolhe o alvo (`alvoAuxAtributo`, `alvoAuxTR`), e o editor da
   Transformação escolhe só o EFEITO de cada espaço. O tradutor cairia sozinho em
   Força e Reflexos, e isso seria inventar regra. Anotado em docs/a-fazer.md. */
const TRANSF_SEM_ALVO = new Set(["atributo", "tr"]);

/**
 * O que um Feitiço entrega quando ligado, EFEITO POR EFEITO, no formato que o
 * `efeitosDeAuxiliarResolvido` lê. O Auxiliar devolve o efeito dele (ou a lista
 * do Múltiplos Efeitos), e a Transformação devolve os espaços dela.
 */
function efeitosDoFeiticoLigado(f, ctx = {}) {
  if (ehTransformacao(f)) {
    const calc = calcularFeiticoTransformacao(f, ctx);
    const subs = (calc.efeitos || []).map((e) => ({
      efeito: e.efeito,
      disponivel: !!e.disponivel && !TRANSF_SEM_ALVO.has(e.efeito),
      // A tabela guarda número, dado `[quantidade, faces]` ou texto especial.
      valor: typeof e.valor === "number" ? e.valor : null,
      dado: Array.isArray(e.valor) ? e.valor : null,
      especial: typeof e.valor === "string" ? e.valor : null,
    }));
    return { calc, subs, configDe: () => f };
  }
  const calc = calcularFeiticoAuxiliar(f, ctx);
  return {
    calc,
    subs: calc.multiplos ? calc.efeitos : [calc],
    configDe: (sub) => (calc.multiplos ? lista(f.efeitosMult).find((e) => e.id === sub.id) : f),
  };
}

/* ⚠ "ESCONDER E ANOTAR" (autor, 2026-09-10). Um Feitiço cujo efeito não existe
   naquele nível e duração (Aumento de Defesa no Nível 1 Sustentado, por exemplo)
   aparecia para escolher, entrava como ativo e não mudava número nenhum. Quem
   não tem nenhum efeito utilizável some da escolha. O criador já avisa o erro
   no card do Feitiço. */
const feiticoUtilizavel = (f, ctx) => efeitosDoFeiticoLigado(f, ctx).subs.some((s) => s?.disponivel);

/* ============================================================ */
/* FEITIÇOS PERMUTATIVOS NA FICHA                                */
/* ============================================================ */
/**
 * As trocas de um Feitiço ligável, uma por efeito que de fato perde algo. Saem
 * do MESMO cálculo que o tradutor lê, então a trava e o número não discordam.
 * Regras e decisões em docs/afty-feiticos-permutativos.md.
 */
export function trocasDoFeitico(f, ctx = {}) {
  if (f?.tipo !== "auxiliar") return [];
  return efeitosDoFeiticoLigado(f, ctx).subs
    .map((s) => (s?.disponivel && s.permuta?.reducao > 0 && s.permuta?.ganho > 0 ? s.permuta : null))
    .filter(Boolean);
}

// Quanto da margem de uma arma ainda pode ser perdido: o crítico dela abaixo de 20.
const margemAPerder = (entrada) => 20 - (Number(entrada?.margemCritico) || 20);

/**
 * "O Feitiço não pode ser usado" (texto), lido do derive. Devolve o motivo, ou
 * null quando pode.
 *
 * ⚠ TRAVA AO LIGAR (autor, 2026-10-02). Desligado, a conta PREVÊ o desconto da
 * troca sobre o número de agora. Ligado, o número já traz o desconto, e o motivo
 * vira aviso: o Feitiço segue ligado quando o número caiu depois, por uma
 * condição.
 *   Defesa  não fica abaixo da base (10 + o atributo da Defesa)
 *   RD      a RD Geral não fica abaixo de zero ("RD Geral a perder")
 *   Margem  alguma arma tem margem a perder, porque a troca vale só nelas
 */
export function travaDaPermuta(trocas, derived, { ligado = false, feiticoId = null } = {}) {
  for (const p of lista(trocas)) {
    if (p.perde === "defesa") {
      const defesa = Number(derived?.defesa);
      const base = Number(derived?.defesaBase);
      if (Number.isFinite(defesa) && Number.isFinite(base) && (ligado ? defesa : defesa - p.reducao) < base) {
        return "Defesa Abaixo da Base";
      }
    }
    if (p.perde === "rd") {
      const rd = Number(derived?.rdGeral);
      if (Number.isFinite(rd) && (ligado ? rd : rd - p.reducao) < 0) return "Sem RD Geral a Perder";
    }
    if (p.perde === "margem") {
      const entradas = lista(derived?.dano?.entradas);
      const serve = ligado
        ? entradas.some((e) => lista(e.permutasMargem).some((m) => m.feiticoId === feiticoId))
        : entradas.some((e) => margemAPerder(e) >= p.reducao);
      if (!serve) return "Sem Margem a Perder";
    }
  }
  return null;
}

/* O controle que liga o Feitiço pergunta à trava, no padrão do `max(derived)` que
   a `LinhaEstado` já lê. Feitiço sem troca não ganha a função. */
const comTrava = (f, ctx, alvo) => {
  const trocas = trocasDoFeitico(f, ctx);
  return trocas.length
    ? { ...alvo, bloqueio: (derived, ligado) => travaDaPermuta(trocas, derived, { ligado, feiticoId: f.id }) }
    : alvo;
};

export function estadosCombateConjurador({ habilidades, tecnicas, armas = [], feiticos = [], nd } = {}) {
  const estados = [];
  const utilizavel = (f) => feiticoUtilizavel(f, { nd, habilidades });
  const opcaoDoFeitico = (f) => comTrava(f, { nd, habilidades }, { id: f.id, label: f.nome || "Feitiço Sem Nome" });
  const armasTecnicas = new Set(tecnicas?.armas ?? []);
  const opcoesArma = lista(armas)
    .filter((a) => armasTecnicas.has(a.id))
    .map((a) => ({ id: a.id, label: a.nome }));
  if (tem(habilidades, COMBATE_AMALDICOADO_ID) && opcoesArma.length > 0) {
    estados.push({
      id: ESTADO_COMBATE,
      label: "Combate Amaldiçoado",
      tipo: "opcao",
      opcoes: opcoesArma,
      custoPE: 2,
    });
  }

  const opcoesAuxBonus = lista(feiticos)
    .filter((f) => auxiliarBonus(f) && utilizavel(f))
    .map(opcaoDoFeitico);
  if (tem(habilidades, ESGRIMISTA_JUJUTSU_ID) && opcoesAuxBonus.length > 0) {
    estados.push({
      id: ESTADO_ESGRIMISTA,
      label: "Esgrimista Jujutsu",
      tipo: "opcao",
      opcoes: opcoesAuxBonus,
      requerEstado: ESTADO_COMBATE,
    });
  }

  // A Transformação Sustentada disputa as mesmas vagas: sustentar é sustentar.
  const opcoesSustentadas = lista(feiticos)
    .filter((f) => (auxiliarSustentado(f) || transformacaoSustentada(f)) && utilizavel(f))
    .map(opcaoDoFeitico);
  const maxSustentados = temAlguma(habilidades, SUSTENTACAO_MESTRE_IDS)
    ? 3
    : temAlguma(habilidades, SUSTENTACAO_AVANCADA_IDS) ? 2 : 1;
  if (opcoesSustentadas.length > 0) {
    for (let i = 1; i <= maxSustentados; i += 1) {
      estados.push({
        id: `sustentacaoFeitico${i}`,
        label: `Sustentação ${i}`,
        tipo: "opcao",
        opcoes: opcoesSustentadas,
        dono: DONO_FEITICOS,
      });
    }
  }

  // O interruptor por Feitiço: o que não é Sustentado, e por isso não tem vaga.
  for (const f of lista(feiticos)) {
    const ligavel = (f?.tipo === "auxiliar" && !auxiliarSustentado(f))
      || (ehTransformacao(f) && !transformacaoSustentada(f));
    if (!ligavel || !f.id || !utilizavel(f)) continue;
    estados.push(comTrava(f, { nd, habilidades }, {
      id: estadoLigadoDoFeitico(f.id),
      label: f.nome || "Feitiço Sem Nome",
      tipo: "bool",
      feiticoId: f.id,
      dono: DONO_FEITICOS,
    }));
  }
  return estados;
}

export function efeitosCombateAmaldicoado(tecnicas, combate, habilidades = [], bt = 0) {
  if (!tem(habilidades, COMBATE_AMALDICOADO_ID)) return [];
  const efeitos = lista(tecnicas?.armas).map((id) => ({
    canal: "danoBonus",
    alvo: id,
    expr: String(Math.max(0, Math.trunc(Number(bt) || 0))),
    origem: COMBATE_AMALDICOADO_ID,
    nome: "Combate Amaldiçoado",
  }));
  if (combate?.ativo && lista(tecnicas?.armas).includes(combate?.[ESTADO_COMBATE])) {
    efeitos.push({
      canal: "nivelDano",
      alvo: combate[ESTADO_COMBATE],
      expr: "1",
      origem: COMBATE_AMALDICOADO_ID,
      nome: "Combate Amaldiçoado",
      duracao: "temporaria",
    });
  }
  return efeitos;
}

function idsAuxiliaresAtivos(combate, estados, feiticos) {
  if (!combate?.ativo) return [];
  const validos = new Set(lista(feiticos).map((f) => f.id));
  const ids = [];
  for (const estado of estados) {
    // O interruptor por Feitiço: ligado é o próprio Feitiço, sem escolha.
    if (estado.feiticoId) {
      if (combate[estado.id] && validos.has(estado.feiticoId) && !ids.includes(estado.feiticoId)) {
        ids.push(estado.feiticoId);
      }
      continue;
    }
    if (estado.id !== ESTADO_ESGRIMISTA && !estado.id.startsWith("sustentacaoFeitico")) continue;
    if (estado.requerEstado && !combate[estado.requerEstado]) continue;
    const id = combate[estado.id];
    if (validos.has(id) && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

function efeitoNumerico(canal, valor, nome, alvo = null, extra = null) {
  if (!Number.isFinite(Number(valor)) || Number(valor) === 0) return [];
  return [{
    canal,
    expr: String(Number(valor)),
    ...(alvo ? { alvo } : {}),
    ...(extra || {}),
    origem: `feiticoAuxiliar:${nome}`,
    nome,
    exclusivo: "feiticoAuxiliarPassivo",
    duracao: "temporaria",
  }];
}

/**
 * O Aumento de Atributo, uma linha por atributo da divisão.
 *
 * ⚠ DUAS METADES POR ATRIBUTO, e não uma (autor, 2026-09-07): *"Feitiços de
 * Atributo ativos TRANSPASSAM o limite de 20, podendo chegar até o de 30. Logo
 * se eu tenho 18 de Força e faço um Feitiço que me fornece +12 de Força, eu fico
 * com 30 de Força."*
 *
 * O canal `atributo` sozinho APARA no limite de 20, que é a regra desde o
 * conserto de 2026-07-29, e o `18 + 12` parava em 20. Quem sobe o teto é o
 * `limiteAtributo`, e as duas andam juntas em toda regra que diz "o valor e o
 * limite" (é o mesmo par do Incremento de Atributo e da Quebra de Limites).
 *
 * ⚠ SEM `furaTeto`. Ele levaria a 32, e o texto do autor para no 30, que é
 * exatamente onde o `limiteAtributo` sozinho já para.
 *
 * ⚠ UMA LINHA POR ATRIBUTO, porque o pool exclusivo disputa por `(canal, alvo)`.
 * Somar tudo num alvo só faria a divisão sumir, e dois Feitiços em atributos
 * diferentes brigarem entre si por engano.
 */
function efeitosDeAtributo(sub, config, nome) {
  const partes = Array.isArray(sub?.atributos) && sub.atributos.length
    ? sub.atributos
    : [{ attr: config?.alvoAuxAtributo || "forca", pontos: Number(sub?.valor) || 0 }];
  return partes.flatMap((p) => [
    ...efeitoNumerico("atributo", p.pontos, nome, p.attr),
    ...efeitoNumerico("limiteAtributo", p.pontos, nome, p.attr),
  ]);
}

/**
 * A linha da troca de um Permutativo, SEM `exclusivo` (autor, 2026-10-02):
 * "Permutativo sempre soma", com bônus e com penalidade, e nunca disputa o pool
 * de Feitiços. O nome leva "(Permuta)" para o hover separar o preço do bônus.
 */
function efeitoDaPermuta(canal, valor, nome, alvo = null) {
  if (!Number.isFinite(Number(valor)) || Number(valor) === 0) return [];
  return [{
    canal,
    expr: String(Number(valor)),
    ...(alvo ? { alvo } : {}),
    origem: `feiticoAuxiliar:${nome}`,
    nome: `${nome} (Permuta)`,
    duracao: "temporaria",
  }];
}

/* O ganho no canal do efeito e o prejuízo no canal do aspecto perdido. O Bônus em
   Ataque que perde Margem não vai por canal: ele vale só nas armas com margem a
   perder (autor), então viaja por linha, como os dados do Auxiliar, e quem o
   aplica é o `resolveDano`. */
function trocaDoAuxiliar(sub, config, nome) {
  const p = sub?.permuta;
  if (!(p?.ganho > 0) || !(p?.reducao > 0)) return { efeitos: [], margem: [] };
  switch (sub.efeito) {
    case "rolagem": return {
      efeitos: [
        ...efeitoDaPermuta("bonusPericia", p.ganho, nome, config?.alvoAuxPericia),
        ...efeitoDaPermuta("bonusPericia", -p.reducao, nome, p.pericia),
      ],
      margem: [],
    };
    case "rd": return {
      efeitos: [...efeitoDaPermuta("rdGeral", p.ganho, nome), ...efeitoDaPermuta("defesa", -p.reducao, nome)],
      margem: [],
    };
    case "defesa": return {
      efeitos: [...efeitoDaPermuta("defesa", p.ganho, nome), ...efeitoDaPermuta("rdGeral", -p.reducao, nome)],
      margem: [],
    };
    case "margemCritico": return {
      efeitos: [...efeitoDaPermuta("margemCritico", p.ganho, nome), ...efeitoDaPermuta("bonusAcerto", -p.reducao, nome)],
      margem: [],
    };
    case "ataque": return {
      efeitos: [],
      margem: [{ nome: `${nome} (Permuta)`, margem: p.reducao, acerto: p.ganho }],
    };
    default: return { efeitos: [], margem: [] };
  }
}

/* ⚠ A TABELA E A TROCA SAEM SEPARADAS. O `valor` do cálculo já traz o ganho do
   Permutativo, e só a parte da tabela (`valorSemPermuta`) disputa o pool. */
function efeitosDeAuxiliarResolvido(sub, config, nome) {
  if (!sub?.disponivel || sub.especial) return { efeitos: [], dados: [], margem: [] };
  const troca = trocaDoAuxiliar(sub, config, nome);
  const valor = Number(sub.permuta?.ganho > 0 ? sub.valorSemPermuta : sub.valor) || 0;
  const tabela = efeitosDaTabelaDoAuxiliar(sub, config, nome, valor);
  return { efeitos: [...tabela.efeitos, ...troca.efeitos], dados: tabela.dados, margem: troca.margem };
}

function efeitosDaTabelaDoAuxiliar(sub, config, nome, valor) {
  const resistencia = config?.alvoAuxTR || "reflexos";
  switch (sub.efeito) {
    case "defesa": return { efeitos: efeitoNumerico("defesa", valor, nome), dados: [] };
    case "rd": return { efeitos: efeitoNumerico("rdGeral", valor, nome), dados: [] };
    case "atributo": return { efeitos: efeitosDeAtributo(sub, config, nome), dados: [] };
    case "tr": return { efeitos: efeitoNumerico("bonusTR", valor, nome, resistencia), dados: [] };
    /* Numa perícia só quando o Feitiço a escolhe (2026-10-02, pela Permuta de
       Perícia). Sem perícia segue Toda Rolagem: perícia, TR e ataque. */
    case "rolagem": return {
      efeitos: config?.alvoAuxPericia
        ? efeitoNumerico("bonusPericia", valor, nome, config.alvoAuxPericia)
        : [
          ...efeitoNumerico("bonusPericia", valor, nome),
          ...efeitoNumerico("bonusTR", valor, nome),
          ...efeitoNumerico("bonusAcerto", valor, nome),
        ],
      dados: [],
    };
    case "movimento": return { efeitos: efeitoNumerico("movimento", valor, nome), dados: [] };
    case "alcanceCaC": return {
      efeitos: efeitoNumerico("alcanceArma", valor, nome, "cat:corpo|basico"), dados: [],
    };
    case "alcanceDistancia": return {
      efeitos: efeitoNumerico("alcanceArma", valor, nome, "cat:distancia|cat:arremesso"), dados: [],
    };
    case "danoDurante":
    case "danoApos": return {
      efeitos: [],
      dados: Array.isArray(sub.dado) ? [{
        nome,
        dados: sub.dado[0],
        faces: sub.dado[1],
        momento: sub.efeito === "danoApos" ? "apos" : "durante",
        multiplica: sub.efeito !== "danoApos",
      }] : [],
    };
    case "danoFixo": return { efeitos: efeitoNumerico("danoBonus", valor, nome), dados: [] };
    case "niveisDano": return { efeitos: efeitoNumerico("nivelDano", valor, nome), dados: [] };
    case "margemCritico": return { efeitos: efeitoNumerico("margemCritico", valor, nome), dados: [] };
    case "negacaoRd": return { efeitos: efeitoNumerico("ignoraRD", Math.abs(valor), nome), dados: [] };
    case "cd": return { efeitos: efeitoNumerico("cd", valor, nome), dados: [] };
    case "prejuizoRolagem": return {
      efeitos: [
        ...efeitoNumerico("bonusPericia", valor, nome),
        ...efeitoNumerico("bonusTR", valor, nome),
        ...efeitoNumerico("bonusAcerto", valor, nome),
      ],
      dados: [],
    };
    case "ataque": return { efeitos: efeitoNumerico("bonusAcerto", valor, nome), dados: [] };
    default: return { efeitos: [], dados: [] };
  }
}

export function resolveAuxiliaresAtivos(creature, combate, estados, ctx = {}) {
  const feiticos = lista(creature?.feiticos);
  const ids = idsAuxiliaresAtivos(combate, estados, feiticos);
  const efeitos = [];
  const dados = [];
  const ativos = [];
  // A troca do Bônus em Ataque que perde Margem, que o `resolveDano` aplica arma a
  // arma. O id do Feitiço vai junto para a trava saber se ele pegou em alguma.
  const permutasDeMargem = [];
  for (const id of ids) {
    const f = feiticos.find((x) => x.id === id);
    if (!f) continue;
    // Auxiliar ou Transformação: o resolvedor devolve os efeitos no mesmo formato.
    const { calc, subs, configDe } = efeitosDoFeiticoLigado(f, ctx);
    const nome = f.nome || "Feitiço Sem Nome";
    for (const sub of subs) {
      const resolvido = efeitosDeAuxiliarResolvido(sub, configDe(sub), nome);
      efeitos.push(...resolvido.efeitos);
      dados.push(...resolvido.dados);
      for (const m of lista(resolvido.margem)) permutasDeMargem.push({ ...m, feiticoId: id });
    }
    // O Auxiliar chama a sustentação de `upkeepPE`, e a Transformação de `sustentacaoPE`.
    const upkeep = calc.upkeepPE ?? calc.sustentacaoPE ?? 0;
    ativos.push({
      id,
      nome,
      custoPE: calc.custoPE ?? null,
      sustentacaoPE: upkeep > 0
        ? Math.max(1, upkeep - (temAlguma(ctx.habilidades, SUSTENTACAO_MESTRE_IDS) ? 1 : 0))
        : 0,
    });
  }
  return { ativos, efeitos, dados, permutasDeMargem };
}

export function aplicarImbuicaoNoDano(dano, creature, combate, habilidades, feiticosResumo) {
  if (!tem(habilidades, IMBUIR_TECNICA_ID) || !combate?.ativo) return dano;
  const armaId = combate?.[ESTADO_COMBATE];
  if (!armaId) return dano;
  const brutos = lista(creature?.feiticos).filter(feiticoPodeSerImbuido);
  const resumos = new Map(lista(feiticosResumo).map((f) => [f.id, f]));
  const opcoes = brutos
    .map((f) => resumos.get(f.id))
    .filter(Boolean)
    .map((f) => ({ id: f.id, label: f.nome || "Feitiço Sem Nome" }));
  if (opcoes.length === 0) return dano;
  const imbuirId = creature?.combate?.[ESTADO_IMBUIR];
  const escolhidoId = opcoes.some((o) => o.id === imbuirId)
    ? imbuirId
    : null;
  const escolhido = escolhidoId ? resumos.get(escolhidoId) : null;
  return {
    ...dano,
    entradas: lista(dano?.entradas).map((entrada) => (entrada.id === armaId ? {
      ...entrada,
      imbuir: {
        estadoId: ESTADO_IMBUIR,
        opcoes,
        escolhido,
        custoAdicional: 2,
      },
    } : entrada)),
  };
}

export function dadosAuxiliaresNaLinha(entrada, dados = []) {
  if (!entrada || lista(dados).length === 0) return entrada;
  return { ...entrada, danoAuxiliar: lista(dados) };
}
