/**
 * ============================================================
 * CARACTERÍSTICAS AMALDIÇOADAS — GRIMÓRIO AFTY
 * ============================================================
 * Nasceu em 2026-09-22, junto do addon "Maldição - Era de Ouro". A Origem
 * Maldição tem uma característica ("Anatomia Amaldiçoada", concedida pelo
 * addon) que dá "uma característica amaldiçoada no 1° nível, recebendo outra
 * a cada 5 níveis": um POOL de escolha livre, parecido com Aptidão (nível
 * libera vaga, a entrada em si não custa orçamento), mas SEM trilha nenhuma.
 *
 * ⚠ O CATÁLOGO NASCE VAZIO DE PROPÓSITO. As ~20 entradas do livro são conteúdo
 * do addon "Maldição - Era de Ouro" (`acrescenta.caracteristicasAmaldicoadas`),
 * não do raw: é a mesma divisão de sempre, o VERBO (o mecanismo de vaga por
 * nível, a validação, a tela) mora aqui, o SUBSTANTIVO (as ~20 características)
 * mora no pacote. Mesma forma da família `clas`/`origens` em afty-origens.js.
 *
 * ⚠ REQUISITO REUSA `avaliarRequisitoAptidao` (afty-aptidoes.js): o formato
 * `{ tipo, valor, ... }` é o mesmo, e as Características Amaldiçoadas só usam
 * `nd` (nível) e `nota` (lembrete, não bloqueia) por ora. Nada aqui pede
 * `trilha` nem `aptidao`.
 *
 * ============================================================
 * ALVOS ESCOLHIDOS E INCOMPATIBILIDADE (2026-09-23)
 * ============================================================
 * O autor achou que algumas Características *"não estão modificando
 * corretamente"*, e o motivo era um só: as que pedem uma ESCOLHA (o atributo do
 * Desenvolvimento Físico e do Mental, o tipo de dano da Carapaça Mutante, a
 * perícia do Corpo Especializado) eram checkbox puro. Marcava, e nada mexia,
 * porque não havia onde dizer QUAL atributo, QUAL tipo, QUAL perícia.
 *
 * O desenho copia o `alvos` das Linhas de Treinamento (docs/afty-addons.md,
 * seção 16), para quem escreve addon aprender uma vez só:
 *
 *   • a entrada declara `alvos: [{ id, tipo, label, opcoes? }]`, com `tipo` em
 *     `atributo`, `pericia` ou `tipoDano`, e `opcoes` (lista de ids) para
 *     recortar o que se pode escolher (o Desenvolvimento Físico só aceita
 *     Força, Destreza e Constituição);
 *   • o `efeitos` da entrada mira a escolha com `alvo: "escolha:<id>"`, e o
 *     motor troca isso pela resposta da ficha. Sem resposta o efeito NÃO ENTRA:
 *     um efeito de alvo vazio não é um efeito de alvo qualquer;
 *   • depois do id vale um SUFIXO (`escolha:pericia:d4` vira `percepcao:d4`),
 *     que é o que o canal `dadosPericia` precisa para carregar a perícia e o
 *     dado no mesmo alvo;
 *   • a resposta mora em `creature.caracteristicasAmaldicoadasAlvos`, no mesmo
 *     formato do `treinamentoAlvos`: `{ [caracteristicaId]: { [alvoId]: valor } }`.
 *
 * ⚠ `incompativeisIds` NÃO É `requisitos` do tipo `nota`. O livro escreve
 * *"Não pode ter a característica: Desenvolvimento mental"*, e como `nota` isso
 * era um cadeado roxo com a dica "requisito de sistema ainda não construído",
 * que mentia duas vezes: a regra existia e não travava nada. Agora a entrada
 * declara os ids que brigam com ela e a tela tranca a segunda a ser marcada. Como
 * em `especializacaoIncompativel`, vale NOS DOIS SENTIDOS, e uma ficha que já
 * carrega as duas (importada, ou de antes da trava) continua abrindo e mostra
 * o que está errado em vez de perder a escolha calada.
 *
 * ⚠ ESTE MÓDULO NÃO IMPORTA CATÁLOGO DE ATRIBUTO, PERÍCIA NEM TIPO DE DANO. O de
 * dano mora em afty-equipamentos.js, que está no ciclo (equipamentos, efeitos,
 * combate, habilidades) e que este arquivo ajudaria a fechar, já que o
 * afty-efeitos.js o importa. Quem monta a lista de opções para a tela é o
 * criador, que enxerga tudo; aqui só se confere `opcoes` quando a entrada a
 * declarou.
 */

import { registrarFamilia, remendarLista } from "./afty-addons";
import { avaliarRequisitoAptidao } from "./afty-aptidoes";

export const AFTY_CARACTERISTICAS_AMALDICOADAS = [];

let BY_ID = {};
const CATALOGO_BASE = AFTY_CARACTERISTICAS_AMALDICOADAS.slice();

function aplicarExtras(extras = [], remendos = null) {
  AFTY_CARACTERISTICAS_AMALDICOADAS.splice(
    0, AFTY_CARACTERISTICAS_AMALDICOADAS.length,
    ...remendarLista(CATALOGO_BASE, remendos), ...extras,
  );
  BY_ID = Object.fromEntries(AFTY_CARACTERISTICAS_AMALDICOADAS.map((c) => [c.id, c]));
}

aplicarExtras();

export const getCaracteristicaAmaldicoada = (id) => BY_ID[id] ?? null;

/* ============================================================ */
/* ALVOS ESCOLHIDOS                                              */
/* ============================================================ */

/** O que uma característica pode pedir ao jogador que escolha. */
export const TIPOS_DE_ALVO = Object.freeze(["atributo", "pericia", "tipoDano"]);

/** Como o `alvo` de um efeito aponta para a resposta da ficha. */
export const PREFIXO_ESCOLHA = "escolha:";

/**
 * Os alvos que a entrada declara, já limpos: id, tipo, rótulo e a lista de
 * `opcoes` (ou `null` quando ela não recorta nada). Alvo sem id ou de tipo que
 * não existe some daqui, e é o validador quem reclama dele.
 */
export function alvosDaCaracteristica(entrada) {
  return (Array.isArray(entrada?.alvos) ? entrada.alvos : [])
    .filter((a) => a && typeof a === "object" && String(a.id ?? "").trim() && TIPOS_DE_ALVO.includes(a.tipo))
    .map((a) => {
      const id = String(a.id).trim();
      const opcoes = Array.isArray(a.opcoes)
        ? a.opcoes.map((o) => String(o ?? "").trim()).filter(Boolean)
        : [];
      return { id, tipo: a.tipo, label: String(a.label ?? "").trim() || id, opcoes: opcoes.length ? opcoes : null };
    });
}

/** A resposta vale? Não vazia e, quando a entrada recortou a lista, uma delas. */
function respostaValida(alvo, resposta) {
  const v = String(resposta ?? "").trim();
  if (!v) return null;
  if (alvo.opcoes && !alvo.opcoes.includes(v)) return null;
  return v;
}

/**
 * Os efeitos de UMA característica, com o `alvo: "escolha:<id>"` já trocado pela
 * resposta da ficha.
 *
 * ⚠ SEM RESPOSTA VÁLIDA O EFEITO SAI DA LISTA, e não vira efeito de alvo vazio.
 * Foi o mesmo cuidado do `paraCanal` dos Treinamentos: emitir a linha com o alvo
 * cru mandaria o número para um atributo que não existe, e o painel de fontes
 * passaria a mostrar uma linha morta em vez de mostrar nada.
 */
export function efeitosDaCaracteristica(entrada, respostas = {}) {
  const alvos = alvosDaCaracteristica(entrada);
  const out = [];
  for (const e of Array.isArray(entrada?.efeitos) ? entrada.efeitos : []) {
    if (!e || typeof e !== "object") continue;
    if (typeof e.alvo === "string" && e.alvo.startsWith(PREFIXO_ESCOLHA)) {
      const [idAlvo, ...sufixo] = e.alvo.slice(PREFIXO_ESCOLHA.length).split(":");
      const def = alvos.find((a) => a.id === idAlvo);
      const resposta = def ? respostaValida(def, respostas?.[idAlvo]) : null;
      if (!resposta) continue;
      out.push({ ...e, alvo: [resposta, ...sufixo].join(":") });
      continue;
    }
    out.push({ ...e });
  }
  return out;
}

/**
 * Os efeitos de TODAS as características escolhidas, prontos para o Motor.
 *
 * `respostasPorId` é o `caracteristicasAmaldicoadasAlvos` da ficha. Uma entrada
 * repetida na lista conta uma vez só: característica não se pega duas vezes, e
 * uma ficha importada com o id duplicado não pode somar o bônus em dobro.
 */
export function efeitosDasCaracteristicasAmaldicoadas(ids, respostasPorId = {}) {
  const out = [];
  for (const id of new Set(Array.isArray(ids) ? ids : [])) {
    const entrada = getCaracteristicaAmaldicoada(id);
    if (!entrada) continue;
    for (const e of efeitosDaCaracteristica(entrada, respostasPorId?.[id])) {
      // O `nome` do PRÓPRIO efeito vence o da entrada, como em `coletarEfeitos`.
      out.push({ ...e, origem: id, nome: e.nome ?? (entrada.nome || id), vez: 1 });
    }
  }
  return out;
}

/* ============================================================ */
/* VALIDAÇÃO                                                     */
/* ============================================================ */

function validarCatalogo() {
  const problemas = [];
  const ids = new Set();
  for (const c of AFTY_CARACTERISTICAS_AMALDICOADAS) {
    if (!c?.id) { problemas.push("característica sem id"); continue; }
    if (ids.has(c.id)) problemas.push(`id duplicado: ${c.id}`);
    ids.add(c.id);
    if (!c.nome?.trim()) problemas.push(`${c.id}: sem nome`);
    if (!c.descricao?.trim()) problemas.push(`${c.id}: sem descrição`);
  }

  for (const c of AFTY_CARACTERISTICAS_AMALDICOADAS) {
    if (!c?.id) continue;

    if (c.alvos !== undefined && !Array.isArray(c.alvos)) {
      problemas.push(`${c.id}: "alvos" precisa ser uma lista`);
    }
    const declarados = new Set();
    for (const a of Array.isArray(c.alvos) ? c.alvos : []) {
      const idAlvo = String(a?.id ?? "").trim();
      if (!idAlvo) { problemas.push(`${c.id}: alvo sem id`); continue; }
      if (declarados.has(idAlvo)) problemas.push(`${c.id}: alvo repetido (${idAlvo})`);
      declarados.add(idAlvo);
      if (!TIPOS_DE_ALVO.includes(a.tipo)) {
        problemas.push(`${c.id}: o alvo "${idAlvo}" tem tipo inválido (${a.tipo}). Existem: ${TIPOS_DE_ALVO.join(", ")}`);
      }
      if (a.opcoes !== undefined && (!Array.isArray(a.opcoes) || a.opcoes.length === 0)) {
        problemas.push(`${c.id}: as "opcoes" do alvo "${idAlvo}" precisam ser uma lista com pelo menos um id`);
      }
    }

    if (c.efeitos !== undefined && !Array.isArray(c.efeitos)) {
      problemas.push(`${c.id}: "efeitos" precisa ser uma lista`);
    }
    for (const [i, e] of (Array.isArray(c.efeitos) ? c.efeitos : []).entries()) {
      if (!e || typeof e !== "object") { problemas.push(`${c.id}: o efeito #${i + 1} precisa ser um objeto`); continue; }
      if (typeof e.alvo === "string" && e.alvo.startsWith(PREFIXO_ESCOLHA)) {
        const idAlvo = e.alvo.slice(PREFIXO_ESCOLHA.length).split(":")[0];
        if (!declarados.has(idAlvo)) {
          problemas.push(`${c.id}: o efeito #${i + 1} mira "${e.alvo}", mas a entrada não declara o alvo "${idAlvo}"`);
        }
      }
    }

    if (c.incompativeisIds !== undefined && !Array.isArray(c.incompativeisIds)) {
      problemas.push(`${c.id}: "incompativeisIds" precisa ser uma lista`);
    }
    for (const outro of Array.isArray(c.incompativeisIds) ? c.incompativeisIds : []) {
      if (outro === c.id) problemas.push(`${c.id}: não pode ser incompatível com ela mesma`);
      else if (!BY_ID[outro]) problemas.push(`${c.id}: incompativeisIds cita característica inexistente (${outro})`);
    }
  }
  return problemas;
}

registrarFamilia("caracteristicasAmaldicoadas", {
  rotulo: "Característica Amaldiçoada",
  chave: "id",
  obrigatorios: ["nome", "descricao"],
  /* `incompativeisIds` cita OUTRA característica do mesmo pacote, e sem o prefixo
     ela ficaria crua enquanto a irmã ganha o namespace: a trava nunca casaria. */
  caminhosDeId: ["incompativeisIds[]"],
  aplicar: aplicarExtras,
  basicos: () => CATALOGO_BASE,
  validador: validarCatalogo,
  resolver: (id) => getCaracteristicaAmaldicoada(id),
  idsDaFicha: (c) => (Array.isArray(c?.caracteristicasAmaldicoadas) ? c.caracteristicasAmaldicoadas : []),
});

/* ============================================================ */
/* RESOLUÇÃO                                                     */
/* ============================================================ */

/**
 * As escolhas desta ficha, resolvidas contra o catálogo e a vaga disponível.
 *
 * `vagas` já vem PRONTA (canal `vagasCaracteristicaAmaldicoada`, somado pelo
 * `deriveAfty` como qualquer outro canal): esta função só confere contra o
 * catálogo e monta o que a tela mostra, o mesmo papel de `resolveMarcadoresInvocacao`
 * para as invocações.
 *
 * ⚠ EXCEDER A VAGA AVISA, NÃO TRAVA. Mesma regra do resto do sistema (Ações
 * com Custo, Ações e Características de Invocação): quem cortar depois
 * decide o que sai, e a ficha não perde a escolha calada.
 *
 * ⚠ `catalogo` É A LISTA INTEIRA JÁ AVALIADA, uma linha por entrada, e não o
 * catálogo cru. A tela precisa saber de cada uma se está escolhida, se o
 * requisito ou uma incompatibilidade a trancam e o que falta escolher, e
 * refazer essa conta no JSX faria a tela responder por regra. Já escolhida nunca
 * tranca, pelo mesmo motivo da Aptidão: um requisito que deixou de ser atendido
 * não pode prender a escolha na ficha sem como removê-la.
 */
export function resolveCaracteristicasAmaldicoadas(creature, ctx = {}) {
  const brutas = [...new Set(
    Array.isArray(creature?.caracteristicasAmaldicoadas) ? creature.caracteristicasAmaldicoadas : [],
  )];
  const respostas = creature?.caracteristicasAmaldicoadasAlvos
    && typeof creature.caracteristicasAmaldicoadasAlvos === "object"
    ? creature.caracteristicasAmaldicoadasAlvos
    : {};
  const vagas = Math.max(0, Math.trunc(Number(ctx.vagas) || 0));
  const escolhidas = new Set(brutas);

  const avaliar = (c) => {
    const escolhida = escolhidas.has(c.id);
    const requisitos = (c.requisitos || []).map((r) => avaliarRequisitoAptidao(r, ctx));
    /* A incompatibilidade vira um chip como qualquer requisito, para a tela ter
       UMA lista só de motivos: o cadeado e a dica saem do mesmo lugar. */
    const brigas = (Array.isArray(c.incompativeisIds) ? c.incompativeisIds : [])
      .map((outroId) => ({ outro: BY_ID[outroId], outroId }))
      .filter((b) => b.outro)
      .map((b) => ({
        ok: !escolhidas.has(b.outroId),
        verificavel: true,
        label: `Sem ${b.outro.nome}`,
        titulo: `Incompatível com ${b.outro.nome}`,
      }));
    const todos = [...requisitos, ...brigas];
    const faltando = todos.filter((r) => r.verificavel && !r.ok);
    const alvos = alvosDaCaracteristica(c).map((a) => ({
      ...a,
      valor: respostaValida(a, respostas?.[c.id]?.[a.id]),
    }));
    return {
      id: c.id,
      nome: c.nome,
      descricao: c.descricao,
      encontrada: true,
      escolhida,
      requisitos: todos,
      bloqueada: !escolhida && faltando.length > 0,
      alvos,
      // O que a pessoa ainda tem de escolher. Só conta quem está marcada.
      pendentes: escolhida ? alvos.filter((a) => !a.valor).map((a) => a.label) : [],
      /* Os dois recados do autor da entrada, no molde da característica de
         Origem: `mesa` diz que nada nela vira número (a marca "Mesa"), e
         `parcial` diz QUAL pedaço o Motor não cobre, e some sozinho no dia em
         que o pedaço entra. */
      mesa: !!c.mesa,
      parcial: typeof c.parcial === "string" && c.parcial.trim() ? c.parcial.trim() : null,
    };
  };

  const lista = brutas.map((id) => {
    const c = getCaracteristicaAmaldicoada(id);
    if (!c) {
      return {
        id, nome: id, descricao: "", encontrada: false, escolhida: true,
        requisitos: [], bloqueada: false, alvos: [], pendentes: [], mesa: false, parcial: null,
      };
    }
    return avaliar(c);
  });

  return {
    lista,
    catalogo: AFTY_CARACTERISTICAS_AMALDICOADAS.map(avaliar),
    escolhidas: brutas,
    vagas,
    usadas: lista.length,
    excedeu: lista.length > vagas,
    pendentes: lista.filter((c) => c.pendentes.length > 0),
  };
}
