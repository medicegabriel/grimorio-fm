/**
 * ============================================================
 * MOTOR DE AUTOMAÇÃO — lado da CRIATURA
 * ============================================================
 * Aplica na PRÓPRIA ficha os efeitos que vêm das Habilidades de Especialização,
 * Talentos, Melhorias Superiores, Lendárias, Ápices e Treinamentos.
 *
 * É o irmão do canal Controlador → Invocação (`CONTROLADOR_EFEITOS_INVOCACAO`
 * em afty-habilidades.js + `efeitosHabilidade` em afty-invocacoes.js), com as
 * mesmas três garantias: canal desconhecido é ignorado sem quebrar, erro de
 * expressão cai no fallback, e todo efeito aplicado entra em `detalhes` para a
 * UI mostrar de onde veio o número.
 *
 * DIRETRIZ DO AUTOR (2026-07-27): **usar o Motor SEMPRE**, mesmo quando o efeito
 * não couber ainda. O que não cabe vira EXTENSÃO do motor (canal novo, variável
 * nova, tipo de efeito novo), não um texto solto que a UI só exibe. A ideia é
 * que o motor fique robusto para o autor escrever habilidades próprias depois.
 *
 * ⚠ `src/components/fm-dsl.js` é do grimório 2.5.2 e é SOMENTE-LEITURA. Por
 * isso: variável nova é livre (o contexto é montado aqui, e `evalNumber` é
 * agnóstico de variável), tipo de efeito novo é livre (vive neste arquivo), mas
 * FUNÇÃO ou OPERADOR novo do DSL exigiria editar a 2.5.2, e aí é preciso parar
 * e perguntar ao autor.
 *
 * ------------------------------------------------------------
 * FORMA DE UM EFEITO
 * ------------------------------------------------------------
 *   { canal, expr, quando?, alvo?, duracao? }
 *
 *   • canal   — para onde o número vai (ver EFEITO_CANAIS).
 *   • expr    — expressão DSL, sempre resulta num número.
 *   • quando  — condição opcional em DSL. Sem ela o efeito sempre entra, com
 *               ela só entra se avaliar diferente de zero.
 *   • alvo    — só nos canais que pedem destino (atributo, perícia, TR, ataque,
 *               trilha). ALVO AUSENTE num canal com destino = vale para TODOS
 *               ("+2 em todas as perícias").
 *   • duracao — "permanente" (padrão) ou "temporaria". Só o PERMANENTE conta
 *               para pré-requisito (autor, 2026-07-27): "Se o Modificador de
 *               Força for temporário, não! Se for permanente, sim!". Os dois
 *               contam para os stats, porque a ficha mostra o estado atual.
 *
 * A coleta carimba `origem` (o id da habilidade) e `nome` (para a UI).
 *
 * ------------------------------------------------------------
 * ORDEM DE APLICAÇÃO: TRÊS ESTÁGIOS (autor, 2026-07-27)
 * ------------------------------------------------------------
 * O efeito de ATRIBUTO entra PRIMEIRO, e todo o resto lê o atributo já somado.
 * Palavras do autor:
 *
 *   "Tenho força 14. Recebo +6 de Força fico com Força 20.
 *    Depois eu recebo +5 de Defesa (Mod. Força)"
 *
 * Ou seja, os +5 saem da Força 20, não da 14. E o atributo se divide em dois,
 * porque só o permanente conta para pré-requisito:
 *
 *   "Se o Modificador de Força for temporário, não!
 *    Se for permanente, sim!"
 *
 * Daí os três estágios, com o contexto remontado entre eles:
 *
 *   1a. `atributo` com `duracao: "permanente"` (o padrão), lendo o BASE.
 *       → produz o atributo que os PRÉ-REQUISITOS enxergam.
 *   1b. `atributo` com `duracao: "temporaria"`, lendo o permanente.
 *       → produz o atributo FINAL, o que a ficha mostra.
 *   2.  Todos os outros canais, lendo o atributo final.
 *
 * Os resultados são somados com `mesclarEfeitos`.
 *
 * ⚠ DIVERGE do que `docs/automacao-dsl.md` diz ("as expressões leem os valores
 * base, sem os próprios buffs"). Aquele texto espelha o fm-dsl da 2.5.2 e vale
 * para o motor de invocação; o Afty do lado da criatura funciona assim porque o
 * autor confirmou que é assim que a regra funciona no sistema dele.
 *
 * ⚠ O que ainda lê o BASE: as expressões DENTRO do estágio 1a, então um efeito
 * de atributo permanente não vê o irmão do mesmo estágio (evita o laço A→B→A).
 *
 * ⚠ ASSUMIDO, a confirmar: efeito temporário fica SEMPRE ligado na ficha. Ligar
 * e desligar depende de um estado de combate que ainda não existe.
 * ============================================================
 */

import { evalNumber } from "../../components/fm-dsl";

/* ============================================================ */
/* CANAIS                                                        */
/* ============================================================ */
/* `alvo` diz que o canal precisa nomear um destino, e qual é o vocabulário
   dele. `furaTeto` marca o canal de atributo, que tem um teto duro de 30 no
   deriveAfty e algumas Lendárias dizem explicitamente que o passam. */

export const EFEITO_CANAIS = [
  // Stats de combate
  { id: "hp",            label: "PV",                    nota: "entra ANTES do multiplicador de Integridade da Alma (autor, 2026-07-27)" },
  { id: "pe",            label: "PE" },
  { id: "defesa",        label: "Defesa" },
  { id: "cd",            label: "CD" },
  { id: "rdGeral",       label: "RD Geral" },
  { id: "rdEspecifico",  label: "RD Específica" },
  { id: "rdFisico",      label: "RD Física" },
  { id: "movimento",     label: "Movimento",             nota: "em metros, aceita 1,5" },
  { id: "atencao",       label: "Atenção" },
  { id: "resParcial",    label: "Resistência Parcial" },
  { id: "almaMax",       label: "Integridade da Alma" },

  // Com destino
  { id: "atributo",      label: "Atributo",              alvo: "atributo", aceitaFuraTeto: true },
  { id: "bonusPericia",  label: "Perícia",               alvo: "pericia" },
  { id: "bonusTR",       label: "Teste de Resistência",  alvo: "tr" },
  { id: "bonusAcerto",   label: "Acerto",                alvo: "ataque" },
  { id: "nivelAptidao",  label: "Nível de Aptidão",      alvo: "trilha", nota: "com alvo é concessão direcionada e grátis" },

  // Orçamentos
  { id: "vagasPericia",   label: "Vagas de Treino" },
  { id: "vagasHabilidade", label: "Vagas de Habilidade" },
  { id: "vagasAptidao",   label: "Aptidões Amaldiçoadas" },
  { id: "pontosAptidao",  label: "Pontos de Aptidão",    nota: "orçamento LIVRE, gasto onde o jogador quiser" },
  { id: "focos",          label: "Focos de Interlúdio" },

  // Feitiços
  { id: "custoPE",        label: "Custo em PE",          nota: "redução de custo, o piso de 1 PE continua valendo" },
];

const CANAL_BY_ID = Object.fromEntries(EFEITO_CANAIS.map((c) => [c.id, c]));
export const getCanal = (id) => CANAL_BY_ID[id] ?? null;

/* ============================================================ */
/* CONTEXTO DE VARIÁVEIS                                         */
/* ============================================================ */

/**
 * Namespace da criatura para o DSL. Recebe os valores BASE já calculados pelo
 * deriveAfty e devolve o objeto plano que `evalNumber` consome.
 *
 * ⚠ Além das variáveis de `docs/automacao-dsl.md` (que espelha só o fm-dsl da
 * 2.5.2), o Afty adiciona aqui: `patamar_*`, `tipo_*`, `grau`, `maestria`,
 * `mod_int_ou_sab` e o nível por especialização (real e de escalonamento). Toda
 * variável nova do sistema entra NESTE arquivo, nunca na 2.5.2.
 *
 * ⚠ O QUE NÃO ESTÁ AQUI: os stats derivados (`hp_max`, `defesa`, `cd`,
 * `atencao`, `rd_geral`, `deslocamento`) e os recursos de combate. Motivo: os
 * efeitos são aplicados ANTES de os stats serem calculados, senão um efeito de
 * atributo não conseguiria propagar para HP e Defesa. Ler stat aqui exigiria
 * uma SEGUNDA passada (calcular tudo, montar contexto, aplicar, recalcular), e
 * nenhuma habilidade do catálogo precisou disso ainda. Quando precisar, é essa
 * a extensão a fazer, e `VARS_ADIADAS` + `validarMapaEfeitos` avisam antes de
 * a expressão virar zero calado.
 */

/** Variáveis que o contexto da criatura ainda NÃO expõe (ver acima). */
export const VARS_ADIADAS = [
  "hp_max", "pe_max", "defesa", "cd", "atencao", "rd_geral", "rd_irredutivel",
  "deslocamento", "iniciativa", "acerto", "guarda_max", "guarda_atual",
  "hp_atual", "pe_atual", "hp_temp", "hp_pct", "pe_pct",
];
export function buildCriaturaDslContext(base = {}) {
  const at = base.attrEff || {};
  const md = base.mods || {};
  const apt = base.aptidao || {};
  const nivelEspec = base.nivelEspec || {};          // { [espId]: { real, escalonamento } }

  const ctx = {
    // Núcleo
    nd: base.nd ?? 1,
    bt: base.bt ?? 0,
    maestria: base.bt ?? 0,                          // alias, o texto do livro usa os dois nomes
    grau: base.grauRank ?? 1,                        // Quarto 1 ... Especial 5
    alma_atual: base.almaAtual ?? 100,

    // Atributos (valor e modificador)
    forca: at.forca ?? 10, destreza: at.destreza ?? 10, constituicao: at.constituicao ?? 10,
    inteligencia: at.inteligencia ?? 10, sabedoria: at.sabedoria ?? 10, presenca: at.presenca ?? 10,
    mod_forca: md.forca ?? 0, mod_destreza: md.destreza ?? 0, mod_constituicao: md.constituicao ?? 0,
    mod_inteligencia: md.inteligencia ?? 0, mod_sabedoria: md.sabedoria ?? 0, mod_presenca: md.presenca ?? 0,
    mod_tecnica: base.modTecnica ?? 0,

    // "Modificador de Int OU Sab": o autor decidiu (2026-07-27) que é sempre o
    // MAIOR dos dois, não uma escolha gravada na ficha. Fecha o item C3.
    mod_int_ou_sab: Math.max(md.inteligencia ?? 0, md.sabedoria ?? 0),
    mod_pre_ou_sab: Math.max(md.presenca ?? 0, md.sabedoria ?? 0),

    // Níveis de aptidão por trilha (efetivo = alocado + concedido)
    dom: apt.dom ?? 0, au: apt.au ?? 0, cl: apt.cl ?? 0, bar: apt.bar ?? 0, er: apt.er ?? 0,

  };

  // Patamar e Tipo como booleanos nomeados: `patamar_calamidade`, `tipo_conjurador`.
  for (const p of ["comum", "desafio", "calamidade", "beyond"]) ctx[`patamar_${p}`] = base.patamar === p ? 1 : 0;
  for (const t of ["combatente", "misto", "conjurador", "restringido"]) ctx[`tipo_${t}`] = base.tipo === t ? 1 : 0;

  // Nível por especialização. `nivel_lutador` é o REAL (o que trava
  // pré-requisito) e `esc_lutador` é o de ESCALONAMENTO (real + metade da
  // outra classe), que é o que os efeitos que escalam devem usar.
  for (const [espId, n] of Object.entries(nivelEspec)) {
    ctx[`nivel_${espId}`] = n?.real ?? 0;
    ctx[`esc_${espId}`] = n?.escalonamento ?? n?.real ?? 0;
  }

  return ctx;
}

/* ============================================================ */
/* CATÁLOGOS DE EFEITO (conteúdo)                                */
/* ============================================================ */
/* Um mapa por catálogo, no mesmo shape do CONTROLADOR_EFEITOS_INVOCACAO:
   `{ [idDaEntrada]: [{ canal, expr, quando?, alvo?, furaTeto? }] }`.

   ⚠ TODOS VAZIOS na Fase 0, de propósito. A infraestrutura vem primeiro e a
   passada de conteúdo (451 entradas) é a Fase 2/3 de
   docs/afty-efeitos-criatura.md, com triagem balde a balde junto do autor.

   Ficam AQUI e não em cada catálogo para o vocabulário de canal ter um dono só
   e o validador cobrir os cinco de uma vez. */

export const HABILIDADE_EFEITOS = {};   // Habilidades de Especialização (367)
export const TALENTO_EFEITOS = {};      // Talentos (51)
export const MELHORIA_EFEITOS = {};     // Melhorias Superiores (11, repetíveis)
export const LENDARIA_EFEITOS = {};     // Habilidades Lendárias (16)
export const APICE_EFEITOS = {};        // Habilidades Ápice (6)

/**
 * Habilidades Gerais. **NÃO está vazio**: foi a primeira fonte real de conteúdo
 * a entrar no Motor (2026-07-27), absorvendo o `ganhos` que o `resolveGerais`
 * calculava por fora. Todas repetíveis, então o `vezes` multiplica.
 *
 * Melhoria Superior e Habilidade Lendária não aparecem aqui de propósito: elas
 * só DESTRAVAM as trilhas de alto nível e não concedem valor nenhum.
 */
export const GERAL_EFEITOS = {
  ger_especializacao: [{ canal: "vagasHabilidade", expr: "1 + piso(maestria / 2)" }],
  ger_aptidao:        [{ canal: "vagasAptidao",    expr: "1 + piso(maestria / 2)" }],
  ger_treinamentos:   [{ canal: "focos",           expr: "piso(nd / 2)" }],
};

/**
 * Os campos "+ OUTROS" que a ficha tem para o Mestre somar à mão. Entram pelo
 * Motor como qualquer outra fonte, para o detalhamento da UI não ter buraco.
 */
export function efeitosManuaisDaFicha(creature) {
  const campos = [
    ["periciasBonus", "vagasPericia"],
    ["focosBonus", "focos"],
  ];
  const out = [];
  for (const [campo, canal] of campos) {
    const v = Math.trunc(Number(creature?.[campo]) || 0);
    if (v) out.push({ canal, expr: String(v), origem: campo, nome: "Outros" });
  }
  return out;
}

/* ============================================================ */
/* COLETA                                                        */
/* ============================================================ */

/**
 * Junta os efeitos das entradas escolhidas, carimbando origem e nome.
 * `mapa` = { [id]: [efeito, ...] }, `catalogo` = { [id]: { nome } }.
 * `vezesPorId` (opcional) multiplica a entrada para itens repetíveis.
 */
export function coletarEfeitos(ids, mapa, catalogo = {}, vezesPorId = null) {
  const out = [];
  for (const id of Array.isArray(ids) ? ids : []) {
    const efs = mapa?.[id];
    if (!efs) continue;
    const vezes = vezesPorId ? Math.max(1, vezesPorId[id] ?? 1) : 1;
    for (let v = 1; v <= vezes; v++) {
      for (const e of efs) out.push({ ...e, origem: id, nome: catalogo[id]?.nome || id, vez: v });
    }
  }
  return out;
}

/**
 * Junta os efeitos de TUDO que a criatura escolheu, na ordem dos catálogos.
 * Recebe os resolves já prontos do deriveAfty (nada de ler a ficha crua aqui).
 *
 * Melhorias Superiores são repetíveis, então entram `vezes` vezes: uma Melhoria
 * de Vida pega duas vezes soma duas vezes.
 */
export function coletarEfeitosCriatura({ habilidades, talentos, altoNivel } = {}) {
  const vezesMel = Object.fromEntries(
    (altoNivel?.melhorias?.escolhidas || []).map((m) => [m.id, m.vezes]),
  );
  const apiceId = altoNivel?.apiceId ? [altoNivel.apiceId] : [];
  return [
    ...coletarEfeitos(habilidades?.escolhidas, HABILIDADE_EFEITOS),
    ...coletarEfeitos(talentos?.escolhidas, TALENTO_EFEITOS),
    ...coletarEfeitos(Object.keys(vezesMel), MELHORIA_EFEITOS, {}, vezesMel),
    ...coletarEfeitos(altoNivel?.lendarias?.escolhidas, LENDARIA_EFEITOS),
    ...coletarEfeitos(apiceId, APICE_EFEITOS),
  ];
}

/**
 * Fontes que ficam A MONTANTE do contexto principal: elas concedem atributo,
 * nível de aptidão e vagas de orçamento, e essas coisas são lidas antes de os
 * stats existirem. Rodam no estágio 0 do deriveAfty.
 *
 * `gerais` é o resolve de Habilidades Gerais, e `catalogoGerais` só serve para
 * o nome que aparece no detalhamento.
 */
export function coletarEfeitosMontante(creature, gerais, catalogoGerais = {}) {
  const vezes = Object.fromEntries((gerais?.escolhidas || []).map((g) => [g.id, g.vezes]));
  return [
    ...coletarEfeitos(Object.keys(vezes), GERAL_EFEITOS, catalogoGerais, vezes),
    ...efeitosManuaisDaFicha(creature),
  ];
}

/* ============================================================ */
/* APLICAÇÃO                                                     */
/* ============================================================ */

/**
 * Avalia e soma os efeitos, canal a canal.
 *
 * Devolve:
 *   • porCanal — { [canal]: número }, os efeitos SEM alvo (nos canais com
 *     destino, valem para todos os alvos).
 *   • porAlvo  — { [canal]: { [alvo]: número } }, os direcionados.
 *   • detalhes — um item por efeito aplicado, para a UI mostrar a origem.
 *   • avisos   — canal inexistente, alvo em canal que não aceita, etc.
 */
export function aplicarEfeitos(efeitos, ctx = {}) {
  const porCanal = {};
  const porAlvo = {};
  const furaTetoPor = {};
  const detalhes = [];
  const avisos = [];

  for (const e of Array.isArray(efeitos) ? efeitos : []) {
    const canal = CANAL_BY_ID[e?.canal];
    if (!canal) {
      if (e?.canal) avisos.push(`Canal inexistente "${e.canal}" em ${e.nome || e.origem || "efeito"}.`);
      continue;   // ignora sem quebrar
    }
    if (e.alvo && !canal.alvo) {
      avisos.push(`Canal "${e.canal}" não aceita alvo (veio "${e.alvo}").`);
    }
    // Condição: sem `quando`, sempre aplica.
    if (e.quando && evalNumber(e.quando, ctx, 0) === 0) continue;

    const valor = evalNumber(e.expr, ctx, 0);
    if (!valor) continue;

    const alvo = canal.alvo ? (e.alvo || null) : null;
    if (alvo) {
      if (!porAlvo[e.canal]) porAlvo[e.canal] = {};
      porAlvo[e.canal][alvo] = (porAlvo[e.canal][alvo] || 0) + valor;
    } else {
      porCanal[e.canal] = (porCanal[e.canal] || 0) + valor;
    }
    // `furaTeto` é do EFEITO, não do canal: só as poucas que dizem em texto
    // ("podendo superar o máximo de 30", Aperfeiçoamento de Atributo) passam.
    const furaTeto = !!e.furaTeto && !!canal.aceitaFuraTeto;
    if (furaTeto) furaTetoPor[alvo || "todos"] = true;
    detalhes.push({
      canal: e.canal, alvo, valor,
      origem: e.origem || null, nome: e.nome || e.origem || "Efeito",
      furaTeto,
    });
  }

  return { porCanal, porAlvo, furaTeto: furaTetoPor, detalhes, avisos };
}

/** O alvo recebeu algum efeito autorizado a passar do teto duro de 30? */
export const furaTetoEm = (res, alvo) =>
  !!(res?.furaTeto?.[alvo] || res?.furaTeto?.todos);

/**
 * Canais resolvidos ANTES de todos os outros. Hoje só o de atributo: o autor
 * confirmou (2026-07-27) que um efeito que soma atributo entra antes, e os
 * efeitos seguintes já leem o modificador novo.
 */
export const CANAIS_ESTAGIO_1 = ["atributo"];

/**
 * A ÚNICA entrada do sistema autorizada a passar do teto de 30 de atributo
 * (autor, 2026-07-27): "Não é para furar além de 30 de nenhuma forma. Com
 * exceção da Habilidade Lendária que te permite, nada no sistema além dela
 * permite passar." O validador recusa `furaTeto` em qualquer outro id.
 */
export const FURA_TETO_PERMITIDO = ["len_aperfeicoamento_de_atributo"];

/** Duração de um efeito. Sem `duracao` declarada, é permanente. */
export const ehTemporario = (e) => e?.duracao === "temporaria";
export const ehPermanente = (e) => !ehTemporario(e);

/** Os três estágios, na ordem em que o deriveAfty aplica. */
export const ehAtributoPermanente = (e) => CANAIS_ESTAGIO_1.includes(e?.canal) && ehPermanente(e);
export const ehAtributoTemporario = (e) => CANAIS_ESTAGIO_1.includes(e?.canal) && ehTemporario(e);
export const ehEstagio2 = (e) => !CANAIS_ESTAGIO_1.includes(e?.canal);

/** Soma resultados de `aplicarEfeitos` (os dois estágios) num só. */
export function mesclarEfeitos(...resultados) {
  const out = { porCanal: {}, porAlvo: {}, furaTeto: {}, detalhes: [], avisos: [] };
  for (const r of resultados) {
    for (const [c, v] of Object.entries(r?.porCanal || {})) {
      out.porCanal[c] = (out.porCanal[c] || 0) + v;
    }
    for (const [c, alvos] of Object.entries(r?.porAlvo || {})) {
      out.porAlvo[c] = { ...(out.porAlvo[c] || {}) };
      for (const [a, v] of Object.entries(alvos)) out.porAlvo[c][a] = (out.porAlvo[c][a] || 0) + v;
    }
    Object.assign(out.furaTeto, r?.furaTeto || {});
    out.detalhes.push(...(r?.detalhes || []));
    out.avisos.push(...(r?.avisos || []));
  }
  return out;
}

/**
 * Valor de um canal para um alvo: o que vale para TODOS mais o direcionado.
 * Em canal sem destino, `alvo` é ignorado.
 */
export function valorCanal(res, canal, alvo = null) {
  const geral = res?.porCanal?.[canal] || 0;
  if (!alvo) return geral;
  return geral + (res?.porAlvo?.[canal]?.[alvo] || 0);
}

/** Todos os alvos tocados num canal, para a UI iterar sem varrer o catálogo. */
export const alvosDoCanal = (res, canal) => Object.keys(res?.porAlvo?.[canal] || {});

/* ============================================================ */
/* VALIDADOR                                                     */
/* ============================================================ */

/**
 * Confere um mapa de efeitos contra o catálogo de canais. Rodar a cada leva de
 * conteúdo: erro de canal só apareceria em runtime, e calado.
 */
export function validarMapaEfeitos(mapa, nomeDoMapa = "efeitos") {
  const problemas = [];
  for (const [id, efs] of Object.entries(mapa || {})) {
    if (!Array.isArray(efs) || !efs.length) {
      problemas.push(`${nomeDoMapa}: ${id} sem efeitos`);
      continue;
    }
    for (const e of efs) {
      const canal = CANAL_BY_ID[e?.canal];
      if (!canal) { problemas.push(`${nomeDoMapa}: ${id} usa canal inexistente "${e?.canal}"`); continue; }
      if (!e.expr) problemas.push(`${nomeDoMapa}: ${id} sem expr no canal ${e.canal}`);
      if (e.alvo && !canal.alvo) problemas.push(`${nomeDoMapa}: ${id} passa alvo num canal sem destino (${e.canal})`);
      if (e.furaTeto && !canal.aceitaFuraTeto) {
        problemas.push(`${nomeDoMapa}: ${id} marca furaTeto num canal que não aceita (${e.canal})`);
      }
      if (e.furaTeto && !FURA_TETO_PERMITIDO.includes(id)) {
        problemas.push(`${nomeDoMapa}: ${id} marca furaTeto, e só ${FURA_TETO_PERMITIDO.join(", ")} pode passar de 30`);
      }
      if (e.duracao && e.duracao !== "permanente" && e.duracao !== "temporaria") {
        problemas.push(`${nomeDoMapa}: ${id} tem duracao inválida "${e.duracao}"`);
      }
      // Variável adiada vira ZERO calado dentro da expressão, então é erro de
      // conteúdo, não de runtime. Pegar aqui.
      for (const v of VARS_ADIADAS) {
        const re = new RegExp(`\\b${v}\\b`);
        if (re.test(e.expr || "") || re.test(e.quando || "")) {
          problemas.push(`${nomeDoMapa}: ${id} usa "${v}", que o contexto da criatura ainda não expõe`);
        }
      }
    }
  }
  return problemas;
}
