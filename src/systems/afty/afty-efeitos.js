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
import { combateDslVars, COMBATE_VARS } from "./afty-combate";
// afty-origens.js só importa folhas de propósito, então a seta aponta para cá:
// é este arquivo que junta os efeitos de origem, não aquele. Ver coletarEfeitosOrigem.
import {
  getOrigem, getCla, resolveEscolhasOrigem, ORIGEM_ESCOLHA_EFEITOS, OPCAO_ORIGEM_NOME,
} from "./afty-origens";
import { getAnatomia } from "./afty-anatomias";
import {
  HABILIDADE_EFEITOS, ESCOLHA_EFEITOS, TALENTO_EFEITOS,
  MELHORIA_EFEITOS, MELHORIA_EFEITOS_ALVO, LENDARIA_EFEITOS, LENDARIA_EFEITOS_ALVO,
  APICE_EFEITOS, GERAL_EFEITOS,
  // Os três de origem entram no ESCOPO LOCAL (o `export ... from` mais abaixo
  // só reexporta, não declara), porque o coletarEfeitosOrigem daqui os usa.
  ORIGEM_EFEITOS, CLA_EFEITOS, ANATOMIA_EFEITOS,
} from "./afty-efeitos-conteudo";

/* ============================================================ */
/* CANAIS                                                        */
/* ============================================================ */
/* `alvo` diz que o canal precisa nomear um destino, e qual é o vocabulário
   dele. `furaTeto` marca o canal de atributo, que tem um teto duro de 30 no
   deriveAfty e algumas Lendárias dizem explicitamente que o passam. */

export const EFEITO_CANAIS = [
  // Stats de combate
  { id: "hp",            label: "PV",                    nota: "entra ANTES do multiplicador de Integridade da Alma (autor, 2026-07-27)" },
  { id: "pvTemporario",  label: "PV Temporário",         nota: "não é PV máximo: é a casca que some no fim do efeito. Quase sempre vem da simulação de combate" },
  { id: "pe",            label: "PE" },
  { id: "defesa",        label: "Defesa" },
  { id: "cd",            label: "CD" },
  { id: "rdGeral",       label: "RD Geral" },
  { id: "rdEspecifico",  label: "RD Específica" },
  { id: "rdFisico",      label: "RD Física" },
  { id: "rdAlma",        label: "RD a Alma",             nota: "a RD Geral vale para todo tipo EXCETO alma, então o Dano na Alma tem canal próprio. Entra antes do teste de Integridade (autor, 2026-07-29)" },
  { id: "movimento",     label: "Movimento",             nota: "em metros, aceita 1,5" },
  { id: "atencao",       label: "Atenção" },
  { id: "iniciativa",    label: "Iniciativa" },
  { id: "regeneracao",   label: "Regeneração",           nota: "cura no INÍCIO do turno, parte fixa. Irmão do dadosRegeneracao" },
  { id: "dadosRegeneracao", label: "Dados de Regeneração", nota: "quantos dados de cura no início do turno" },
  { id: "regeneracaoDado",  label: "Dado da Regeneração",  nota: "faces do dado de regeneração (6, 8...). Vale o MAIOR entre as fontes: duas regenerações de dados diferentes viram uma só, aproximada" },
  { id: "resParcial",    label: "Resistência Parcial" },
  { id: "almaMax",       label: "Integridade da Alma" },
  { id: "empolgacaoMaxima",  label: "Empolgação Máxima",  nota: "sinalizador: troca a tabela de dados de Empolgação inteira, não soma" },
  { id: "empolgacaoInicial", label: "Empolgação Inicial", nota: "quantos níveis acima do 1 o combate começa" },

  // Com destino
  { id: "atributo",      label: "Atributo",              alvo: "atributo", aceitaFuraTeto: true },
  { id: "bonusPericia",  label: "Perícia",               alvo: "pericia", nota: "aceita `atr:destreza` para atingir toda perícia daquele atributo (Dádivas do Céu)" },
  { id: "proficienciaPericia", label: "Treino em Perícia", alvo: "pericia", nota: "1 = Treinado, 2 = Mestre. Concede a faixa, não soma número, e nunca REBAIXA o que a ficha já escolheu" },
  { id: "bonusTR",       label: "Teste de Resistência",  alvo: "tr", nota: "aceita `atr:constituicao` para atingir todo TR daquele atributo" },
  { id: "margemCriticoTR", label: "Crítico em Resistência", alvo: "tr", nota: "quanto a margem DIMINUI, com piso de 2. Irmão do margemCritico do ataque" },
  { id: "proficienciaTR", label: "Treino em Resistência", alvo: "tr", nota: "irmão de proficienciaPericia, mesmas regras (1 Treinado, 2 Mestre, nunca rebaixa)" },
  { id: "bonusAcerto",   label: "Acerto",                alvo: "ataque" },
  { id: "bonusManobra",  label: "Manobra",               alvo: "manobra", nota: "Agarrar, Derrubar, Desarmar e Empurrar. Sem alvo vale para as quatro" },
  { id: "resistirManobra", label: "Resistir a Manobra",  alvo: "manobra" },
  { id: "distanciaEmpurrao", label: "Empurrão",          nota: "em metros, por cima do 1,5 padrão" },
  { id: "danoBonus",     label: "Dano",                  alvo: "fonteDano", nota: "soma no Dano TOTAL da linha, e daí escorre para o dano fixo. Alvo `basico` ou o id da arma, e sem alvo vale para todas" },
  { id: "nivelDano",     label: "Nível de Dano",         alvo: "fonteDano", nota: "cada nível soma 1 no ND, e SÓ no cálculo de dano (autor, 2026-07-27)" },
  { id: "dadosDano",     label: "Dados de Dano",         alvo: "fonteDano", nota: "dado ADICIONAL, somado depois do dano fixo. Não confundir com nivelDano" },
  { id: "margemCritico", label: "Margem de Crítico",     alvo: "fonteDano", nota: "quanto a margem DIMINUI, com piso de 2" },
  { id: "ignoraRD",      label: "Ignora RD",             alvo: "fonteDano" },
  { id: "propMarcial",   label: "Marcial",               alvo: "fonteDano", nota: "concede a propriedade Marcial à arma, que é o gatilho de vários poderes de Lutador" },
  { id: "finezaAtaque",  label: "Fineza",                alvo: "ataque", nota: "libera o atributo alternativo do ataque (Destreza no Corpo a Corpo). Vale o maior dos dois" },
  { id: "nivelAptidao",  label: "Nível de Aptidão",      alvo: "trilha", nota: "com alvo é concessão direcionada e grátis" },

  // Orçamentos
  { id: "vagasPericia",   label: "Vagas de Treino" },
  { id: "vagasHabilidade", label: "Vagas de Habilidade" },
  { id: "vagasFeitico",   label: "Vagas de Feitiço",     nota: "vaga EXCLUSIVA de Feitiço (= Habilidade de Técnica). Não serve para Habilidade Geral (autor, 2026-07-28)" },
  { id: "vagasAptidao",   label: "Aptidões Amaldiçoadas" },
  { id: "pontosAptidao",  label: "Pontos de Aptidão",    nota: "orçamento LIVRE, gasto onde o jogador quiser" },
  { id: "focos",          label: "Focos de Interlúdio" },
  { id: "pontosPreparo",  label: "Pontos de Preparo",    nota: "recurso do Combatente (Artes do Combate). Zero sem a habilidade, então o Preview só mostra quem tem" },
  { id: "estamina",       label: "Pontos de Estamina",   nota: "recurso do Restringido, que não tem energia amaldiçoada. Mesma regra: zero sem a habilidade" },
  { id: "espacosCarga",   label: "Espaços de Item",      nota: "sobe o LIMITE de carga, não o usado. Entra antes da conta de sobrecarga" },

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
    // Qual repetição está sendo avaliada, para as entradas repetíveis cujo
    // valor muda por pega ("aumenta em 20. Você pode pegar mais duas vezes,
    // aumentando em 15 ao invés de 20"). O `aplicarEfeitos` sobrescreve com o
    // `vez` do efeito; 1 é o default de quem não repete.
    vez: 1,
    grau: base.grauRank ?? 1,                        // Quarto 1 ... Especial 5
    alma_atual: base.almaAtual ?? 100,
    // RD base do escudo equipado, SEM a parcela da Ferramenta Amaldiçoada. É o
    // "aumento base em RD do seu escudo" do Especialista em Escudo. Único valor
    // de equipamento no contexto, e entra porque o equipamento é resolvido antes
    // dos efeitos (ao contrário dos stats, que vêm depois: ver VARS_ADIADAS).
    rd_escudo: base.rdEscudoBase ?? 0,

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

    // Simulação de combate: `em_combate`, `empolgacao`, `brutalidade`... É o que
    // as habilidades com `quando` leem para ligar e desligar. Ver afty-combate.js.
    ...combateDslVars(base.combate),
  };

  /* ⚠ TODA variável de família tem de estar SEMPRE declarada, mesmo que zero.
     O `evalNumber` da 2.5.2 não trata identificador desconhecido: a expressão
     INTEIRA cai no fallback, calada. Então `2 + (esc_combatente >= 8)` numa
     criatura sem Combatente não daria 2, daria 0. `base.vocabulario` traz as
     listas completas dos catálogos (o deriveAfty é quem as tem) e elas entram
     antes dos valores de verdade, que sobrescrevem por cima. */
  const voc = base.vocabulario || {};
  for (const id of voc.pericias || []) ctx[`prof_${id}`] = 0;
  for (const id of voc.resistencias || []) ctx[`prof_tr_${id}`] = 0;
  for (const id of voc.habilidades || []) ctx[`tem_${id}`] = 0;
  for (const id of voc.especializacoes || []) {
    ctx[`nivel_${id}`] = 0;
    ctx[`esc_${id}`] = 0;
  }

  // Proficiência ESCOLHIDA NA FICHA por perícia: `prof_furtividade` = 0, 1
  // (Treinado) ou 2 (Mestre). Existe para o "Caso já seja" do Treino de
  // Perícia ("você se torna treinado nela. Caso já seja, adicione +1"). É a
  // escolha do jogador, e NÃO inclui o que o próprio efeito concede, senão a
  // condição enxergaria a si mesma e sempre daria o bônus.
  const profFicha = base.periciasProf || {};
  for (const [id, p] of Object.entries(profFicha)) {
    ctx[`prof_${id}`] = p === "mestre" ? 2 : p === "treinado" ? 1 : 0;
  }
  // O mesmo para Teste de Resistência, com prefixo próprio para não colidir com
  // uma perícia homônima. Existe para a Força Imparável (Restringido 8°), que
  // concede "treinado em um TR e mestre em outro NO QUAL JÁ SEJA TREINADO": a
  // opção olha o que a ficha marcou e decide entre conceder 1 ou 2.
  for (const [id, p] of Object.entries(base.resistenciasProf || {})) {
    ctx[`prof_tr_${id}`] = p === "mestre" ? 2 : p === "treinado" ? 1 : 0;
  }

  // "Esta habilidade está escolhida?", como booleana: `tem_cmb_armas_perfeitas`.
  // Existe para o caso de DUAS habilidades dividirem a mesma escolha aninhada:
  // Armas Escolhidas (4°) e Armas Perfeitas (10°) miram o mesmo grupo de arma,
  // então os dois efeitos moram na opção e o da segunda se protege com isto.
  // ⚠ É a habilidade ESCOLHIDA, não a acessível: quem não pegou não recebe.
  for (const id of base.habilidadesEscolhidas || []) ctx[`tem_${id}`] = 1;

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
/* O conteúdo mora em ./afty-efeitos-conteudo.js e é REEXPORTADO daqui: o
   vocabulário de canal e o validador continuam com um dono só, e o arquivo do
   motor continua sendo motor. Quem consome importa daqui, como sempre. */

export {
  HABILIDADE_EFEITOS, ESCOLHA_EFEITOS, TALENTO_EFEITOS,
  MELHORIA_EFEITOS, MELHORIA_EFEITOS_ALVO, LENDARIA_EFEITOS, LENDARIA_EFEITOS_ALVO,
  APICE_EFEITOS, GERAL_EFEITOS,
  ORIGEM_EFEITOS, CLA_EFEITOS, ANATOMIA_EFEITOS,
} from "./afty-efeitos-conteudo";

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
 * `mapa` = { [id]: [efeito, ...] }. `catalogo` serve só para o NOME que a UI
 * mostra como fonte, e aceita as duas formas: o mapa `{ [id]: { nome } }` ou o
 * getter do catálogo (`getHabilidade`, `getTalento`...), que é o que os
 * catálogos grandes exportam. `vezesPorId` multiplica os repetíveis.
 */
export function coletarEfeitos(ids, mapa, catalogo = {}, vezesPorId = null) {
  const nomeDe = typeof catalogo === "function"
    ? (id) => catalogo(id)?.nome
    : (id) => catalogo?.[id]?.nome;
  const out = [];
  for (const id of Array.isArray(ids) ? ids : []) {
    const efs = mapa?.[id];
    if (!efs) continue;
    const vezes = vezesPorId ? Math.max(1, vezesPorId[id] ?? 1) : 1;
    for (let v = 1; v <= vezes; v++) {
      for (const e of efs) out.push({ ...e, origem: id, nome: nomeDe(id) || id, vez: v });
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
/**
 * Escolhas aninhadas cujas OPÇÕES são habilidades de verdade, e não opções
 * próprias. Roubo de Habilidade (Restringido 2°) tem por pool as 127 habilidades
 * de nível de Combatente e Lutador: o id da opção É o id da habilidade, então o
 * efeito dela sai do HABILIDADE_EFEITOS e não do ESCOLHA_EFEITOS.
 */
export const ESCOLHAS_DE_HABILIDADE = ["res_roubo_de_habilidade"];

export function coletarEfeitosCriatura({ habilidades, talentos, altoNivel, catalogos } = {}) {
  const vezesMel = Object.fromEntries(
    (altoNivel?.melhorias?.escolhidas || []).map((m) => [m.id, m.vezes]),
  );
  const apiceId = altoNivel?.apiceId ? [altoNivel.apiceId] : [];
  const roubadas = ESCOLHAS_DE_HABILIDADE.flatMap((id) => habilidades?.escolhas?.mapa?.[id] || []);
  return [
    ...coletarEfeitos(habilidades?.escolhidas, HABILIDADE_EFEITOS, catalogos?.habilidades),
    ...coletarEfeitos(roubadas, HABILIDADE_EFEITOS, catalogos?.habilidades),
    ...coletarEfeitosDeEscolha(habilidades?.escolhas?.mapa, catalogos?.opcoes),
    ...coletarEfeitos(talentos?.escolhidas, TALENTO_EFEITOS, catalogos?.talentos),
    // Talento também tem escolha aninhada (o atributo do Incremento, a trilha
    // da Aptidão Desenvolvida), e cai no mesmo ESCOLHA_EFEITOS.
    ...coletarEfeitosDeEscolha(talentos?.escolhas?.mapa, catalogos?.opcoes),
    ...coletarEfeitos(Object.keys(vezesMel), MELHORIA_EFEITOS, catalogos?.altoNivel, vezesMel),
    ...coletarEfeitosComAlvo(
      Object.keys(vezesMel), altoNivel?.escolhas?.mapa, MELHORIA_EFEITOS_ALVO,
      catalogos?.altoNivel, vezesMel,
    ),
    ...coletarEfeitos(altoNivel?.lendarias?.escolhidas, LENDARIA_EFEITOS, catalogos?.altoNivel),
    ...coletarEfeitosComAlvo(
      altoNivel?.lendarias?.escolhidas, altoNivel?.escolhas?.mapa, LENDARIA_EFEITOS_ALVO,
      catalogos?.altoNivel,
    ),
    ...coletarEfeitos(apiceId, APICE_EFEITOS, catalogos?.altoNivel),
  ];
}

/**
 * Efeitos cujo ALVO vem de uma escolha aninhada, e não do catálogo.
 *
 * É o caso da Melhoria de Perícia ("uma perícia a sua escolha") e da Melhoria
 * de Resistência ("escolha um Teste de Resistência"): o canal e a expressão são
 * fixos, e só o destino é escolhido. Por isso `mapaEfeitos` traz os efeitos SEM
 * alvo, e `mapaAlvos` (`{ [id]: [alvoId] }`) diz para onde cada um vai.
 *
 * Difere do `coletarEfeitosDeEscolha`, onde é a OPÇÃO que carrega o efeito.
 */
export function coletarEfeitosComAlvo(ids, mapaAlvos, mapaEfeitos, catalogo = {}, vezesPorId = null) {
  const nomeDe = typeof catalogo === "function"
    ? (id) => catalogo(id)?.nome
    : (id) => catalogo?.[id]?.nome;
  const out = [];
  for (const id of Array.isArray(ids) ? ids : []) {
    const efs = mapaEfeitos?.[id];
    if (!efs) continue;
    const vezes = vezesPorId ? Math.max(1, vezesPorId[id] ?? 1) : 1;
    for (const alvo of mapaAlvos?.[id] || []) {
      for (let v = 1; v <= vezes; v++) {
        for (const e of efs) out.push({ ...e, alvo, origem: id, nome: nomeDe(id) || id, vez: v });
      }
    }
  }
  return out;
}

/**
 * Efeitos das OPÇÕES escolhidas dentro de uma habilidade (Estilo de Combate,
 * Manobra de Empolgação, a trilha de Aptidões de Luta).
 *
 * `mapa` é o `habilidades.escolhas.mapa` do resolveHabilidades:
 * `{ [habId]: [opcaoId] }`. A chave do efeito é a OPÇÃO, então quem pegou a
 * habilidade e escolheu outra coisa não recebe nada.
 *
 * O `nome` sai do catálogo de opções, e é o que aparece no hover de fontes.
 */
export function coletarEfeitosDeEscolha(mapa, nomesPorOpcao = {}) {
  const out = [];
  for (const opcoes of Object.values(mapa || {})) {
    for (const opcaoId of Array.isArray(opcoes) ? opcoes : []) {
      for (const e of ESCOLHA_EFEITOS[opcaoId] || []) {
        out.push({ ...e, origem: opcaoId, nome: nomesPorOpcao[opcaoId] || opcaoId });
      }
    }
  }
  return out;
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

/**
 * Todos os efeitos que a ORIGEM produz: os dela, os do clã, os das Anatomias
 * escolhidas e os das escolhas aninhadas.
 *
 * ⚠ Mora AQUI, e não em afty-origens.js, por ordem de inicialização: aquele
 * arquivo só pode importar módulos folha (meio mundo lê `getOrigem` dele, e um
 * import pesado lá fecharia ciclo com o motor). A seta aponta para cá.
 *
 * ⚠ Entra no estágio 0 (MONTANTE) do deriveAfty, junto dos Treinamentos e das
 * Habilidades Gerais, porque origem concede VAGA (de habilidade, de perícia, de
 * feitiço, de aptidão) e vaga é lida antes de os stats existirem. O `efMontante`
 * é mesclado inteiro no agregado final, então os canais comuns (`hp`, `pe`,
 * `movimento`) também chegam.
 */
export function coletarEfeitosOrigem(creature, escolhas = null) {
  const origemId = creature?.core?.origem?.id;
  if (!origemId) return [];
  const claId = creature?.core?.origem?.cla;
  const anatomias = getOrigem(origemId)?.caracteristicas?.some((c) => c.poolAnatomia)
    ? (creature?.core?.origem?.anatomias || [])
    : [];
  const mapa = escolhas?.mapa || resolveEscolhasOrigem(creature, creature?.core?.nd ?? 1).mapa;
  const opcoesEscolhidas = Object.values(mapa).flat();
  const nomeOrigem = { [origemId]: { nome: getOrigem(origemId)?.nome } };
  const nomeCla = claId ? { [claId]: { nome: getCla(claId)?.nome } } : {};
  return [
    ...coletarEfeitos([origemId], ORIGEM_EFEITOS, nomeOrigem),
    ...coletarEfeitos(claId ? [claId] : [], CLA_EFEITOS, nomeCla),
    ...coletarEfeitos(anatomias, ANATOMIA_EFEITOS, (id) => getAnatomia(id)),
    ...coletarEfeitos(opcoesEscolhidas, ORIGEM_ESCOLHA_EFEITOS, (id) => ({ nome: OPCAO_ORIGEM_NOME[id] })),
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
    // `vez` é do EFEITO, não do contexto: uma entrada repetível é coletada
    // várias vezes, e cada cópia precisa saber qual pega ela é.
    const ctxE = e.vez != null && e.vez !== ctx.vez ? { ...ctx, vez: e.vez } : ctx;
    // Condição: sem `quando`, sempre aplica.
    if (e.quando && evalNumber(e.quando, ctxE, 0) === 0) continue;

    const valor = evalNumber(e.expr, ctxE, 0);
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
 * Canais que ALIMENTAM o contexto principal, e por isso saem antes dele.
 *
 * `nivelAptidao` é variável do DSL (`dom`, `au`, `cl`, `bar`, `er`): se ele
 * fosse resolvido junto do resto, uma habilidade que concede nível de trilha
 * (Aptidões de Luta, Aptidões de Combate) chegaria tarde demais, depois de o
 * contexto já estar montado. Vale aqui a mesma regra do estágio de atributo:
 * DENTRO deste estágio um efeito não enxerga o irmão, o que evita o laço.
 *
 * `empolgacaoMaxima` entrou pelo mesmo motivo: ele troca a TABELA de dados de
 * Empolgação, e a média do dado (`dado_empolgacao`) é o que as Manobras de
 * Empolgação somam. Sem sair antes, a média seria calculada com a tabela velha.
 *
 * ⚠ Rodam com o contexto reduzido (sem os níveis de aptidão), então a
 * expressão de um efeito destes tem de ser constante ou depender só de ND,
 * Maestria e atributo base. Na prática são todas "1".
 */
export const CANAIS_PRE_CONTEXTO = ["nivelAptidao", "empolgacaoMaxima"];
export const ehPreContexto = (e) => CANAIS_PRE_CONTEXTO.includes(e?.canal);

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

/** Os estágios, na ordem em que o deriveAfty aplica. */
export const ehAtributoPermanente = (e) => CANAIS_ESTAGIO_1.includes(e?.canal) && ehPermanente(e);
export const ehAtributoTemporario = (e) => CANAIS_ESTAGIO_1.includes(e?.canal) && ehTemporario(e);
export const ehEstagio2 = (e) => !CANAIS_ESTAGIO_1.includes(e?.canal) && !ehPreContexto(e);

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

/* ------------------------------------------------------------ */
/* ESCOPO DE ARMA                                                */
/* ------------------------------------------------------------ */
/**
 * Uma linha de dano responde a VÁRIOS alvos ao mesmo tempo, e não a um só. Uma
 * Katana atende pelo próprio id, por ser arma, pela categoria (`cat:corpo`), pelo
 * grupo (`grupo:espada`) e por cada propriedade (`prop:duas_maos`).
 *
 * O Combatente é quem forçou isto: a especialização inteira é escrita em cima de
 * classes de arma ("ataques com armas de arremesso", "armas do grupo escolhido",
 * "arma que possua a propriedade pesada"), e mirar pelo id de cada arma não daria
 * conta. O Lutador não precisou porque fala de desarmado e de armas dedicadas,
 * que já são alvos concretos.
 *
 * Vocabulário dos prefixos, para o conteúdo não inventar:
 *   `arma`         — qualquer linha vinda de arma (exclui o Ataque Básico)
 *   `cat:<id>`     — corpo, distancia, arremesso
 *   `grupo:<id>`   — espada, arco, tiro... (ver ARMA_GRUPOS)
 *   `prop:<id>`    — duas_maos, pesada, estendida... (ver ARMA_PROPRIEDADES)
 *   `tipo:<id>`    — ct, im, pf, queimante (ver TIPOS_DANO). Os Especialistas
 *                    em Cortes, Concussão e Perfuração (Talentos) miram assim
 *
 * O mesmo mecanismo serve PERÍCIA e TR pelo atributo, `atr:<id>`: as Dádivas do
 * Céu do Restringido dizem "bônus em teste de perícia ou resistência usando
 * destreza", e listar as perícias uma a uma no conteúdo seria lista à mão que
 * envelhece. Ver `escoposDe` em resolveTestes.
 */
export const ESCOPO_PREFIXOS = ["cat:", "grupo:", "prop:", "atr:", "tipo:"];

/** Os alvos a que uma linha de dano responde. Sem arma, é só o Ataque Básico. */
export function escoposDaArma(arma) {
  if (!arma) return ["basico"];
  return [
    arma.id, "arma",
    ...(arma.categoria ? [`cat:${arma.categoria}`] : []),
    ...(arma.grupo ? [`grupo:${arma.grupo}`] : []),
    ...(arma.tipoDano ? [`tipo:${arma.tipoDano}`] : []),
    ...(arma.propriedades ?? []).map((p) => `prop:${p.id}`),
  ];
}

/**
 * Como `valorCanal`, mas para uma fonte que responde a vários alvos. O valor
 * SEM alvo (que vale para todos) entra uma vez só, e os direcionados somam.
 */
export function valorCanalEscopos(res, canal, escopos = []) {
  const dir = res?.porAlvo?.[canal] || {};
  return escopos.reduce((s, e) => s + (dir[e] || 0), res?.porCanal?.[canal] || 0);
}

/** Irmão do `detalhesDoCanal` para vários alvos, sem repetir o mesmo efeito. */
export function detalhesDoCanalEscopos(res, canal, escopos = []) {
  const alvo = new Set(escopos);
  return (res?.detalhes || []).filter(
    (d) => d.canal === canal && (d.alvo == null || alvo.has(d.alvo)),
  );
}

/**
 * Os efeitos que caíram num canal (e opcionalmente num alvo), um por FONTE.
 * É o que alimenta o hover que mostra de onde vem cada parcela de um valor.
 * Inclui os sem alvo, que valem para todos os alvos daquele canal.
 */
export function detalhesDoCanal(res, canal, alvo = null) {
  return (res?.detalhes || []).filter(
    (d) => d.canal === canal && (d.alvo == null || d.alvo === alvo),
  );
}

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
      // Estado de combate escrito errado também vira ZERO calado, e aí a
      // habilidade simplesmente nunca liga. O risco mora nos nomes DERIVADOS
      // das opções (`armas_absolutas_defesa`), que ninguém escreve à mão duas
      // vezes igual: qualquer identificador que comece por um estado conhecido
      // tem de ser um estado conhecido inteiro.
      for (const texto of [e.expr, e.quando]) {
        for (const ident of String(texto || "").match(/\b[a-z][a-z0-9_]*\b/g) || []) {
          if (COMBATE_VARS.includes(ident)) continue;
          if (COMBATE_VARS.some((v) => ident.startsWith(`${v}_`))) {
            problemas.push(`${nomeDoMapa}: ${id} usa "${ident}", que não é um estado de combate`);
          }
        }
      }
    }
  }
  return problemas;
}
