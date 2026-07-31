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
// afty-aptidoes só importa afty-origens, que já é dependência daqui: sem ciclo.
import { getAptidao } from "./afty-aptidoes";
import {
  HABILIDADE_EFEITOS, ESCOLHA_EFEITOS, TALENTO_EFEITOS,
  MELHORIA_EFEITOS, MELHORIA_EFEITOS_ALVO, LENDARIA_EFEITOS, LENDARIA_EFEITOS_ALVO,
  APICE_EFEITOS, GERAL_EFEITOS,
  // Os três de origem entram no ESCOPO LOCAL (o `export ... from` mais abaixo
  // só reexporta, não declara), porque o coletarEfeitosOrigem daqui os usa.
  ORIGEM_EFEITOS, CLA_EFEITOS, ANATOMIA_EFEITOS,
  // Aptidão entra no escopo local pelo mesmo motivo: o coletor mora aqui.
  APTIDAO_EFEITOS,
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
  { id: "pe",            label: "PE",                    nota: "pilha ÚNICA: Ponto de Energia e Ponto de Estamina (o nome do Restringido) são o mesmo recurso" },
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
  { id: "atributo",      label: "Atributo",              alvo: "atributo", aceitaFuraTeto: true, nota: "o valor é aparado no LIMITE do atributo (20 padrão). Quem sobe o limite usa o canal limiteAtributo, e as duas coisas andam juntas nas regras que dizem \"o valor e o limite\"" },
  { id: "limiteAtributo", label: "Limite de Atributo",   alvo: "atributo", aceitaFuraTeto: true, nota: "sobe o teto daquele atributo por cima do 20 padrão, até o máximo de 30 (32 com furaTeto). Não soma valor: quem soma é o canal atributo" },
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
  { id: "nivelAptidao",  label: "Nível de Aptidão",      alvo: "trilha", nota: "com alvo é concessão direcionada e grátis. Apara no teto da trilha (5 por padrão). Quem sobe o teto é o canal Limite de Aptidão" },
  { id: "limiteAptidao", label: "Limite de Aptidão",     alvo: "trilha", nota: "sobe o teto daquela trilha por cima do 5 padrão. Não concede nível: quem concede é o canal Nível de Aptidão, e as regras que quebram o teto emitem os dois juntos" },

  // Orçamentos
  { id: "vagasPericia",   label: "Vagas de Treino" },
  { id: "vagasHabilidade", label: "Vagas de Habilidade" },
  { id: "vagasFeitico",   label: "Vagas de Feitiço",     nota: "vaga EXCLUSIVA de Feitiço (= Habilidade de Técnica). Não serve para Habilidade Geral (autor, 2026-07-28)" },
  // "Vagas de" no rótulo para o canal cair junto dos irmãos numa busca por
  // "vaga". O que ele dá é QUANTAS Aptidões Amaldiçoadas a criatura pode ter.
  { id: "vagasAptidao",   label: "Vagas de Aptidão",     nota: "quantas Aptidões Amaldiçoadas a criatura pode ter. Sem fonte nenhuma o orçamento é ZERO: o ND não concede" },
  // ⚠ O nome "Pontos de Aptidão" foi TROCADO em 2026-07-29: o autor perguntou o
  // que era, e a pergunta em si já era a resposta. "Ponto de Aptidão" não existe
  // no sistema (o que existe é NÍVEL de aptidão), e o rótulo velho parecia um
  // recurso gastável, tipo PE. O que este canal faz é dar ORÇAMENTO de nível,
  // gasto na trilha que o jogador quiser. É o par livre do `nivelAptidao`, que
  // nomeia a trilha e é concessão direta.
  { id: "pontosAptidao",  label: "Nível de Aptidão (à escolha)", nota: "orçamento LIVRE de níveis: cada ponto sobe 1 nível na trilha que o jogador quiser. O irmão direcionado é o canal Nível de Aptidão, que nomeia a trilha" },
  { id: "focos",          label: "Focos de Interlúdio" },
  { id: "pontosPreparo",  label: "Pontos de Preparo",    nota: "recurso do Combatente (Artes do Combate). Zero sem a habilidade, então o Preview só mostra quem tem" },
  { id: "espacosCarga",   label: "Espaços de Item",      nota: "sobe o LIMITE de carga, não o usado. Entra antes da conta de sobrecarga" },

  // Feitiços
  { id: "custoPE",        label: "Custo em PE",          nota: "redução de custo, o piso de 1 PE continua valendo" },
];

const CANAL_BY_ID = Object.fromEntries(EFEITO_CANAIS.map((c) => [c.id, c]));
export const getCanal = (id) => CANAL_BY_ID[id] ?? null;

/* ============================================================ */
/* GRUPO EXCLUSIVO — as fontes que NÃO acumulam entre si         */
/* ============================================================ */
/**
 * Cinco fontes de bônus numérico que o autor fechou num POOL ÚNICO
 * (2026-07-30), por balanceamento. Palavras dele:
 *
 *   "Essas 5 fontes de bônus numéricos e etc, não acumulam entre si, sempre
 *    ficando com o maior valor. Por exemplo, se o Efeito Único da minha arma me
 *    fornece +8 de Acerto, meu Feitiço Passivo me fornece +4 e um Shikigami está
 *    me fornecendo +5, eu só fico com o +8 de Acerto da arma. Caso eu perca a
 *    arma ou ela seja desativada de alguma forma, eu fico somente com o +5 do
 *    Shikigami."
 *
 * As três decisões que fecham o modelo (autor, 2026-07-30):
 *
 *  1. A disputa é POR STAT, não por fonte. Arma com +8 Acerto e +2 Defesa contra
 *     Shikigami com +5 Acerto e +6 Defesa rende +8 de Acerto E +6 de Defesa: as
 *     fontes se misturam, cada canal decide o seu vencedor sozinho.
 *  2. Vale DENTRO da família também. Dois Shikigami, ou dois Feitiços Auxiliares
 *     ativos, não somam entre si. Por isso o pool é PLANO: a família serve para a
 *     UI dizer de onde veio o número, e não para agrupar a disputa.
 *  3. Pega TODO bônus numérico que essas fontes produzem (Acerto, Defesa, CD, RD,
 *     Dano, Movimento, Atributo, PV e PE máximos), canal por canal.
 *
 * Tudo que NÃO é uma destas cinco (habilidade, talento, origem, treino,
 * encantamento, grau de item) segue somando normal, e soma POR CIMA do vencedor.
 *
 * ⚠ A disputa é por `(canal, alvo)`, e um efeito SEM alvo não briga com um
 * direcionado do mesmo canal. Hoje isso não vaza, porque as cinco fontes só
 * direcionam no canal `atributo` (onde todas nomeiam o atributo) e são globais em
 * todo o resto. Se um dia uma delas der "+N de Acerto só com espadas", esta conta
 * precisa passar a comparar o global contra cada alvo.
 *
 * `modo` diz onde a fonte fica ligada (autor, 2026-07-30): passiva entra na ficha
 * em repouso, ativa só na bancada de Simulação de Combate. A Habilidade Única é
 * "ambos" porque depende do item, então quem decide é o efeito, não a família.
 */
export const FAMILIAS_EXCLUSIVAS = [
  { id: "habilidadeUnica",         label: "Habilidade Única",            modo: "ambos" },
  { id: "feiticoAuxiliarPassivo",  label: "Feitiço Auxiliar Passivo",    modo: "passiva" },
  { id: "shikigamiCaracteristica", label: "Característica de Shikigami", modo: "passiva" },
  { id: "feiticoAuxiliarAtivo",    label: "Feitiço Auxiliar Ativo",      modo: "ativa" },
  { id: "shikigamiAcao",           label: "Ação Ativa de Shikigami",     modo: "ativa" },
];

const FAMILIA_EXCLUSIVA_BY_ID = Object.fromEntries(FAMILIAS_EXCLUSIVAS.map((f) => [f.id, f]));
export const getFamiliaExclusiva = (id) => FAMILIA_EXCLUSIVA_BY_ID[id] ?? null;

/**
 * A chave da disputa. Um canal sem alvo usa `*`, e não briga com os alvos dele.
 *
 * O SINAL entra na chave porque bônus e penalidade disputam separado (autor,
 * 2026-07-30): "Penalidade você pode sempre deixar a PIOR. Como por exemplo
 * entre -14 e -8. Ficaria o -14." Então o positivo fica com o MAIOR, o negativo
 * fica com o MENOR, e os dois vencedores somam. Um canal com +8 e -14 resulta
 * em -6: o melhor bônus e a pior penalidade valem ao mesmo tempo, e é só entre
 * iguais que a disputa acontece.
 */
export const chaveExclusiva = (canal, alvo, valor = 1) =>
  `${canal}|${alvo ?? "*"}|${valor < 0 ? "-" : "+"}`;

/**
 * Os canais agrupados por assunto, para o `<optgroup>` do editor de efeitos.
 * Espelha o `MODIFIER_TARGET_GROUPS` da 2.5.2, que resolve o mesmo problema:
 * uma lista chapada de 47 itens é impossível de varrer com o olho.
 *
 * ⚠ DERIVADO da lista, não uma segunda cópia dela. Aqui embaixo ficam só os
 * IDS por grupo, e o `EFEITO_CANAL_GRUPOS` resolve os objetos. Canal que não
 * apareça em grupo nenhum cai automaticamente em "Outros", então adicionar canal
 * novo nunca o faz desaparecer do editor por esquecimento (o teste de catálogo
 * confere que "Outros" está vazio).
 */
const GRUPOS_DE_CANAL = [
  ["Vitalidade e Recursos", [
    "hp", "pvTemporario", "pe", "almaMax",
    "regeneracao", "dadosRegeneracao", "regeneracaoDado", "pontosPreparo", "custoPE",
  ]],
  ["Defesa", ["defesa", "rdGeral", "rdEspecifico", "rdFisico", "rdAlma", "resParcial"]],
  ["Ataque e Dano", [
    "cd", "bonusAcerto", "danoBonus", "nivelDano", "dadosDano",
    "margemCritico", "ignoraRD", "propMarcial", "finezaAtaque",
  ]],
  // Atributo, limite e nível de trilha: o que a criatura É, em número próprio.
  // `nivelAptidao` entra aqui, e não num grupo de Aptidões, porque ele é
  // concessão DIRETA de nível (a regra nomeia a trilha). O orçamento livre é
  // outro canal e está em Orçamentos.
  ["Atributos e Aptidões", ["atributo", "limiteAtributo", "nivelAptidao", "limiteAptidao"]],
  ["Perícias e Resistências", [
    "bonusPericia", "proficienciaPericia", "bonusTR", "proficienciaTR", "margemCriticoTR",
  ]],
  ["Manobras", ["bonusManobra", "resistirManobra", "distanciaEmpurrao"]],
  ["Movimento e Percepção", ["movimento", "iniciativa", "atencao"]],
  // Tudo que é "quantos X você pode ter". ⚠ `espacosCarga` estava em Movimento
  // (2026-07-29) porque sobrecarga derruba o deslocamento. Era consequência, não
  // categoria, e o autor pegou: o canal sobe o LIMITE de espaços de item, então
  // ele é orçamento, irmão das vagas. `pontosAptidao` veio junto pelo mesmo
  // motivo, ele é orçamento de nível de aptidão.
  ["Orçamentos", [
    "vagasPericia", "vagasHabilidade", "vagasFeitico", "vagasAptidao",
    "pontosAptidao", "focos", "espacosCarga",
  ]],
  ["Empolgação", ["empolgacaoMaxima", "empolgacaoInicial"]],
];

export const EFEITO_CANAL_GRUPOS = (() => {
  const usados = new Set();
  const grupos = GRUPOS_DE_CANAL.map(([label, ids]) => {
    const itens = [];
    for (const id of ids) {
      const c = CANAL_BY_ID[id];
      if (!c || usados.has(id)) continue;   // id inexistente ou repetido: ignora
      usados.add(id);
      itens.push(c);
    }
    return { label, itens };
  }).filter((g) => g.itens.length);
  const sobrando = EFEITO_CANAIS.filter((c) => !usados.has(c.id));
  if (sobrando.length) grupos.push({ label: "Outros", itens: sobrando });
  return grupos;
})();

/** Canais que ficaram fora dos grupos nomeados. Vazio = catálogo em ordem. */
export const canaisSemGrupo = () =>
  (EFEITO_CANAL_GRUPOS.find((g) => g.label === "Outros")?.itens ?? []).map((c) => c.id);

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
  APICE_EFEITOS, GERAL_EFEITOS, APTIDAO_EFEITOS,
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

/**
 * Efeitos do FUNCIONAMENTO BÁSICO da técnica, escritos pelo jogador na ficha
 * (`core.tecnicaEfeitos`).
 *
 * ⚠ É a ÚNICA fonte do sistema em que o efeito é ESCRITO e não escolhido de um
 * catálogo, e é por definição: a técnica amaldiçoada é única no mundo, então
 * nenhuma lista pode cobri-la. O jogador tem o DSL inteiro à disposição, os 47
 * canais, alvo, `quando` e `duracao`.
 *
 * Sai daqui como qualquer outra fonte (`{ canal, expr, origem, nome }`), então os
 * filtros de estágio do deriveAfty roteiam pelo canal sozinhos: um efeito de
 * `atributo` cai no estágio 1, um de `nivelAptidao` no pré-contexto, o resto no 2.
 *
 * Entrada inválida é DESCARTADA em silêncio de propósito: a validação e a
 * mensagem de erro são da UI, que mostra a expressão quebrada em vermelho na
 * hora de escrever. O motor não é o lugar de reclamar de digitação.
 */
export function efeitosDaTecnica(creature) {
  const lista = creature?.core?.tecnicaEfeitos;
  if (!Array.isArray(lista)) return [];
  const out = [];
  for (const e of lista) {
    if (!e?.canal || !CANAL_BY_ID[e.canal]) continue;
    const expr = String(e.expr ?? "").trim();
    if (!expr) continue;
    const ef = { canal: e.canal, expr, origem: "tecnica", nome: "Técnica" };
    if (e.alvo) ef.alvo = e.alvo;
    if (e.quando) ef.quando = String(e.quando).trim();
    if (e.duracao === "temporaria") ef.duracao = "temporaria";
    out.push(ef);
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
    ...coletarEfeitosDeEscolha(habilidades?.escolhas?.mapa, catalogos?.opcoes, catalogos?.habilidades),
    ...coletarEfeitos(talentos?.escolhidas, TALENTO_EFEITOS, catalogos?.talentos),
    // Talento também tem escolha aninhada (o atributo do Incremento, a trilha
    // da Aptidão Desenvolvida), e cai no mesmo ESCOLHA_EFEITOS.
    ...coletarEfeitosDeEscolha(talentos?.escolhas?.mapa, catalogos?.opcoes, catalogos?.talentos),
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
export function coletarEfeitosDeEscolha(mapa, nomesPorOpcao = {}, catalogoPai = null) {
  const nomeDoPai = typeof catalogoPai === "function"
    ? (id) => catalogoPai(id)?.nome
    : (id) => catalogoPai?.[id]?.nome;
  const out = [];
  for (const [paiId, opcoes] of Object.entries(mapa || {})) {
    // ⚠ O nome da fonte é "Pai (Opção)", e não só a opção (2026-07-29). Uma
    // escolha de atributo se chama "Destreza", então o hover do atributo Destreza
    // mostrava a linha "Destreza +4", que não diz de onde vem nada. Com o pai
    // vira "Pináculo Físico (Destreza)". Sem catálogo de pai, volta ao antigo.
    const pai = catalogoPai ? nomeDoPai(paiId) : null;
    for (const opcaoId of Array.isArray(opcoes) ? opcoes : []) {
      const opcao = nomesPorOpcao[opcaoId] || opcaoId;
      for (const e of ESCOLHA_EFEITOS[opcaoId] || []) {
        out.push({ ...e, origem: opcaoId, nome: pai ? `${pai} (${opcao})` : opcao });
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

/**
 * Efeitos das Aptidões Amaldiçoadas escolhidas.
 *
 * ⚠ `semEnergia` zera tudo. O Restringido não tem energia amaldiçoada, então
 * não tem Aptidão nenhuma: o orçamento dele já é zero, mas uma ficha que trocou
 * de origem depois de escolher aptidões ainda carrega a lista, e sem esta trava
 * ela continuaria valendo calada.
 */
export function coletarEfeitosAptidao(creature, semEnergia = false) {
  if (semEnergia) return [];
  const ids = Array.isArray(creature?.aptidoesAmaldicoadas) ? creature.aptidoesAmaldicoadas : [];
  return coletarEfeitos(ids, APTIDAO_EFEITOS, (id) => getAptidao(id));
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
 *   • exclusivos — os do pool que NÃO acumula (ver FAMILIAS_EXCLUSIVAS). Saem
 *     avaliados mas AINDA NÃO somados: quem decide o vencedor de cada canal é o
 *     `resolverExclusivos`, que precisa ver a lista inteira de uma vez.
 */
export function aplicarEfeitos(efeitos, ctx = {}) {
  const porCanal = {};
  const porAlvo = {};
  const furaTetoPor = {};
  const detalhes = [];
  const avisos = [];
  const exclusivos = [];

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

    // Pool exclusivo: sai da soma e vai para a disputa. O `detalhes` também
    // espera, porque só depois de conhecer o vencedor dá para dizer quem entrou
    // e quem foi suplantado.
    if (e.exclusivo) {
      if (!FAMILIA_EXCLUSIVA_BY_ID[e.exclusivo]) {
        avisos.push(`Família exclusiva desconhecida "${e.exclusivo}" em ${e.nome || e.origem || "efeito"}.`);
      }
      exclusivos.push({
        canal: e.canal, alvo, valor, exclusivo: e.exclusivo,
        origem: e.origem || null, nome: e.nome || e.origem || "Efeito",
      });
      continue;
    }

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

  return { porCanal, porAlvo, furaTeto: furaTetoPor, detalhes, avisos, exclusivos };
}

/**
 * Fecha a disputa do pool exclusivo e devolve o resultado com os vencedores JÁ
 * somados em `porCanal` / `porAlvo`. Depois disto o resto do motor não precisa
 * saber que a regra existe: `valorCanal`, `valorCanalEscopos` e `detalhesDoCanal`
 * seguem funcionando iguais.
 *
 * `jaAplicado` é o mapa `{ [chaveExclusiva]: valor que já entrou }` de uma
 * chamada anterior, e existe por causa do canal `atributo`, que é o único que o
 * deriveAfty resolve em DOIS estágios (permanente e temporário). Sem ele, um
 * Feitiço Auxiliar temporário de +4 de Força somaria por cima de uma Habilidade
 * Única permanente de +6, e o total daria 10 em vez dos 6 que a regra manda. Com
 * ele, o segundo estágio só acrescenta o que passa do que já valia.
 *
 * Todo efeito do pool entra em `detalhes`, inclusive quem perdeu, marcado com
 * `suplantado: true`. É o que deixa o hover de fontes mostrar por que o +5 do
 * Shikigami sumiu da conta, em vez de ele simplesmente não aparecer.
 */
export function resolverExclusivos(res, jaAplicado = {}) {
  const porAlvo = {};
  for (const [c, alvos] of Object.entries(res?.porAlvo || {})) porAlvo[c] = { ...alvos };
  const out = {
    porCanal: { ...(res?.porCanal || {}) },
    porAlvo,
    furaTeto: { ...(res?.furaTeto || {}) },
    detalhes: [...(res?.detalhes || [])],
    avisos: [...(res?.avisos || [])],
    exclusivos: [],
  };
  const aplicado = { ...jaAplicado };
  const lista = res?.exclusivos ?? [];
  if (!lista.length) return { ...out, aplicado };

  // Um grupo por (canal, alvo, sinal): a disputa é por STAT, então cada canal
  // escolhe o seu vencedor sem olhar o que os outros canais fizeram, e o bônus
  // não briga com a penalidade.
  const grupos = new Map();
  for (const e of lista) {
    const k = chaveExclusiva(e.canal, e.alvo, e.valor);
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(e);
  }

  for (const [k, itens] of grupos) {
    // Bônus fica com o MAIOR, penalidade fica com a PIOR (a mais negativa).
    const negativo = k.endsWith("|-");
    const melhor = (a, b) => ((negativo ? b.valor < a.valor : b.valor > a.valor) ? b : a);
    const vencedor = itens.reduce(melhor);
    const delta = vencedor.valor - (aplicado[k] || 0);
    // O `delta` também respeita o sinal: numa penalidade só entra o que PIORA o
    // que um estágio anterior já tinha aplicado. Sem isto, um -8 depois de um
    // -14 somaria +6 e apagaria parte da penalidade.
    const entra = negativo ? delta < 0 : delta > 0;
    if (entra) {
      if (vencedor.alvo) {
        if (!out.porAlvo[vencedor.canal]) out.porAlvo[vencedor.canal] = {};
        out.porAlvo[vencedor.canal][vencedor.alvo] = (out.porAlvo[vencedor.canal][vencedor.alvo] || 0) + delta;
      } else {
        out.porCanal[vencedor.canal] = (out.porCanal[vencedor.canal] || 0) + delta;
      }
      aplicado[k] = vencedor.valor;
    }
    for (const e of itens) {
      out.detalhes.push({
        canal: e.canal, alvo: e.alvo, valor: e.valor,
        origem: e.origem, nome: e.nome, furaTeto: false,
        exclusivo: e.exclusivo,
        // Perdeu para um irmão, ou empatou com o que um estágio anterior já
        // tinha aplicado. Nos dois casos o número não entrou nesta conta.
        suplantado: e !== vencedor || !entra,
      });
    }
  }
  return { ...out, aplicado };
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
 * `limiteAtributo` entrou em 2026-07-29 pelo motivo mais direto de todos: ele É
 * o teto contra o qual o estágio 1 apara o canal `atributo`. Se ele saísse junto
 * do resto, a aparagem aconteceria contra o limite velho e a regra que diz "o
 * valor E o limite aumentam" (Incremento de Atributo, Quebra de Limites) perderia
 * metade do efeito.
 *
 * `limiteAptidao` entrou junto do `nivelAptidao` e pela mesma razão que o
 * `limiteAtributo`: ele é o teto contra o qual a concessão de trilha apara.
 *
 * ⚠ Rodam com o contexto reduzido (sem os níveis de aptidão), então a
 * expressão de um efeito destes tem de ser constante ou depender só de ND,
 * Maestria e atributo base. Na prática são todas "1".
 */
export const CANAIS_PRE_CONTEXTO = ["nivelAptidao", "limiteAptidao", "empolgacaoMaxima", "limiteAtributo"];
export const ehPreContexto = (e) => CANAIS_PRE_CONTEXTO.includes(e?.canal);

/**
 * A ÚNICA entrada do sistema autorizada a passar do teto de 30 de atributo
 * (autor, 2026-07-27): "Não é para furar além de 30 de nenhuma forma. Com
 * exceção da Habilidade Lendária que te permite, nada no sistema além dela
 * permite passar." O validador recusa `furaTeto` em qualquer outro id.
 *
 * ⚠ Passar do 30 não é passar do infinito (autor, 2026-07-29): o Aperfeiçoamento
 * leva ao ATRIBUTO 32, e nada leva além. Quem apara é o `ATTR_LIMITE_ABSOLUTO`
 * de afty-atributos.js.
 */
export const FURA_TETO_PERMITIDO = ["len_aperfeicoamento_de_atributo"];

/** Duração de um efeito. Sem `duracao` declarada, é permanente. */
export const ehTemporario = (e) => e?.duracao === "temporaria";
export const ehPermanente = (e) => !ehTemporario(e);

/** Os estágios, na ordem em que o deriveAfty aplica. */
export const ehAtributoPermanente = (e) => CANAIS_ESTAGIO_1.includes(e?.canal) && ehPermanente(e);
export const ehAtributoTemporario = (e) => CANAIS_ESTAGIO_1.includes(e?.canal) && ehTemporario(e);
export const ehEstagio2 = (e) => !CANAIS_ESTAGIO_1.includes(e?.canal) && !ehPreContexto(e);

/**
 * Soma resultados de `aplicarEfeitos` (os dois estágios) num só.
 *
 * ⚠ Os `exclusivos` são CONCATENADOS, nunca somados: a disputa do maior valor só
 * pode ser fechada quando a lista inteira estiver junta, e quem fecha é o
 * `resolverExclusivos`. Mesclar um resultado já resolvido é seguro, porque ele
 * volta de lá com a lista vazia e os vencedores já em `porCanal` / `porAlvo`.
 */
export function mesclarEfeitos(...resultados) {
  const out = { porCanal: {}, porAlvo: {}, furaTeto: {}, detalhes: [], avisos: [], exclusivos: [] };
  for (const r of resultados) {
    out.exclusivos.push(...(r?.exclusivos || []));
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

/**
 * O perdedor do pool exclusivo fica em `detalhes` para o hover poder mostrá-lo,
 * mas ele NÃO entrou em `porCanal`. Por isso os dois leitores abaixo o escondem
 * por padrão: quem só quer exibir a fonte pede `incluirSuplantados`, e quem SOMA
 * o que leu (as faces do dado de regeneração, os dados de dano) fica protegido
 * de contar um número que a regra já descartou.
 */
const contaNoTotal = (d, incluirSuplantados) => incluirSuplantados || !d.suplantado;

/** Irmão do `detalhesDoCanal` para vários alvos, sem repetir o mesmo efeito. */
export function detalhesDoCanalEscopos(res, canal, escopos = [], incluirSuplantados = false) {
  const alvo = new Set(escopos);
  return (res?.detalhes || []).filter(
    (d) => d.canal === canal && (d.alvo == null || alvo.has(d.alvo)) && contaNoTotal(d, incluirSuplantados),
  );
}

/**
 * Os efeitos que caíram num canal (e opcionalmente num alvo), um por FONTE.
 * É o que alimenta o hover que mostra de onde vem cada parcela de um valor.
 * Inclui os sem alvo, que valem para todos os alvos daquele canal.
 */
export function detalhesDoCanal(res, canal, alvo = null, incluirSuplantados = false) {
  return (res?.detalhes || []).filter(
    (d) => d.canal === canal && (d.alvo == null || d.alvo === alvo) && contaNoTotal(d, incluirSuplantados),
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
      // Família errada faria o efeito cair no pool sem disputar com ninguém, o
      // que é pior que não marcar nada: ele sairia da soma e não voltaria.
      if (e.exclusivo && !FAMILIA_EXCLUSIVA_BY_ID[e.exclusivo]) {
        problemas.push(`${nomeDoMapa}: ${id} marca a família exclusiva "${e.exclusivo}", que não existe`);
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
