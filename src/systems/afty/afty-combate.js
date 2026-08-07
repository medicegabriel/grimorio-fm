/**
 * ============================================================
 * SIMULAÇÃO DE COMBATE — a bancada de balanceamento
 * ============================================================
 * Motivo (autor, 2026-07-28): criar ficha de nível alto exige passar muito
 * tempo conferindo valores para dosar a mão no balanceamento, e o ideal é
 * fazer isso no próprio criador. Então isto **não é um rastreador de combate**:
 * é um painel de estados que se liga para ver os picos.
 *
 * Como encaixa no que já existe: cada estado vira uma VARIÁVEL DO DSL, e as
 * habilidades que dependem dele já podem usar as duas peças que o Motor tem
 * desde o começo:
 *
 *   • `quando` — a condição que liga e desliga o efeito.
 *   • `duracao: "temporaria"` — marca que não conta para pré-requisito.
 *
 * Nenhum canal novo foi preciso para a condição em si: ela sempre existiu.
 *
 * ⚠ O estado é ENTRADA, não resultado, então fica salvo na ficha como qualquer
 * outra escolha. Isso é de propósito: o cenário montado para balancear tem de
 * sobreviver a fechar e reabrir.
 *
 * ⚠ `ativo: false` zera TUDO. Fora de combate não há empolgação nem
 * brutalidade, e o Preview volta a mostrar a criatura em repouso.
 * ============================================================
 */

import { EMPOLGACAO_DADOS, EMPOLGACAO_NIVEL_MAX, POSTURAS_DE_COMBATE } from "./afty-habilidades";

/**
 * As Posturas viram opções da bancada com id curto (`sol`, `lua`...), porque o
 * id vira nome de variável do DSL: `em_postura_sol` lê melhor do que
 * `em_postura_cmb_postura_do_sol`. O `requerEscolha` amarra cada uma à opção do
 * catálogo, então só aparece a postura que a criatura aprendeu.
 */
const POSTURA_OPCOES = POSTURAS_DE_COMBATE.map((p) => ({
  id: p.id.replace(/^cmb_postura_d[aeo]s?_/, "").replace(/^cmb_postura_/, ""),
  label: p.nome.replace(/^Postura d[aeo]s? /, ""),
  requerEscolha: p.id,
}));

const nivelDeEfeito = (derived, especializacaoId) =>
  derived?.habilidades?.niveisPorEfeito?.[especializacaoId]
  ?? derived?.habilidades?.niveisPorEspec?.[especializacaoId]
  ?? 0;

/**
 * Os estados, com o alcance de cada um. A UI esconde o que a criatura não tem
 * como usar, por dois caminhos:
 *
 *   `requerHabilidade` — a Habilidade de Especialização está escolhida. Aceita
 *                        LISTA quando a mesma habilidade existe em mais de uma
 *                        especialização (Ataque Inconsequente), e aí basta uma.
 *   `requerTalento`    — o Talento está escolhido. Talento não é habilidade
 *                        de especialização e mora em outro catálogo.
 *   `requerAptidao`    — a Aptidão Amaldiçoada está escolhida (2026-07-30).
 *                        Terceiro catálogo, mesma ideia dos dois de cima.
 *   `requerEscolha`    — a OPÇÃO aninhada está escolhida (Manobra de
 *                        Empolgação, Estilo de Combate...). É o irmão do
 *                        ESCOLHA_EFEITOS: quem pegou Empolgação mas escolheu
 *                        outras duas manobras não vê estas linhas.
 *
 *   tipo "bool"   → liga e desliga
 *   tipo "faixa"  → número entre `min` e `max`
 *   tipo "opcao"  → uma de `opcoes`, ou nenhuma. Para o "escolha A ou B" que
 *                   várias habilidades têm (Armas Absolutas, e qual Manobra
 *                   Finalizadora está sendo usada). Uma OPÇÃO também pode ter
 *                   `requerEscolha`, e aí só aparece para quem a escolheu: é o
 *                   caso das Posturas, das quais o Combatente aprende algumas.
 *
 * `max` pode ser função de `derived`, para o teto acompanhar a ficha (as pilhas
 * de Brutalidade Sanguinária param na Maestria).
 *
 * `familia` junta estados que são SLOTS da mesma coisa. Mestre da Postura
 * (Combatente 16°) deixa assumir duas posturas ao mesmo tempo, então há dois
 * estados `postura`, e o efeito precisa de uma booleana que valha para os dois:
 * `em_postura_sol` é 1 se o Sol está em qualquer slot. Sem isso, uma Postura no
 * segundo slot não ligaria nada.
 */
export const COMBATE_ESTADOS = [
  {
    id: "empolgacao",
    label: "Empolgação",
    tipo: "faixa",
    min: 1,
    // Insistência abaixa o teto em 1, então o máximo sai do resolveCombate.
    max: (d) => d?.combate?.empolgacaoMax ?? EMPOLGACAO_NIVEL_MAX,
    requerHabilidade: "lut_empolgacao",
  },
  {
    id: "insistenciaUsada",
    label: "Insistência Usada",
    tipo: "bool",
    requerHabilidade: "lut_insistencia",
  },
  /* ---- Manobras de Empolgação (a escolha aninhada da Empolgação) ---- */
  { id: "manobraAjuste",        label: "Manobra · Ajuste",          tipo: "bool", requerEscolha: "lut_manobra_ajuste" },
  { id: "manobraDesarme",       label: "Manobra · Desarme",         tipo: "bool", requerEscolha: "lut_manobra_desarme" },
  { id: "manobraEsquiva",       label: "Manobra · Esquiva",         tipo: "bool", requerEscolha: "lut_manobra_esquiva" },
  { id: "manobraTrabalhoDePes", label: "Manobra · Trabalho de Pés", tipo: "bool", requerEscolha: "lut_manobra_trabalho_de_pes" },
  {
    id: "manobraFinalizadora",
    label: "Manobra Finalizadora",
    tipo: "opcao",
    opcoes: [
      { id: "circular", label: "Ataque Circular" },
      { id: "certeiro", label: "Golpe Certeiro" },
      { id: "cranio",   label: "Quebra Crânio" },
    ],
    requerHabilidade: "lut_manobras_finalizadoras",
  },
  /* ---- Brutalidade ---- */
  {
    id: "brutalidade",
    label: "Brutalidade",
    tipo: "bool",
    requerHabilidade: "lut_brutalidade",
  },
  {
    id: "brutalidadePE",
    label: "Brutalidade · PE Extra",
    tipo: "faixa",
    min: 0,
    // "Nos níveis 8, 12, 16 e 20 você pode gastar 2 PE a mais": o teto de
    // incrementos é quantos desses degraus o nível de Lutador já passou.
    max: (d) => degrausBrutalidade(d),
    requerHabilidade: "lut_brutalidade",
    requerEstado: "brutalidade",
  },
  {
    id: "brutalidadePilha",
    label: "Brutalidade · Pilhas",
    tipo: "faixa",
    min: 0,
    // "acumulando até um limite igual ao seu bônus de treinamento"
    max: (d) => Math.max(0, d?.maestria ?? 0),
    requerHabilidade: "lut_brutalidade_sanguinaria",
    requerEstado: "brutalidade",
  },
  /* ---- Demais gatilhos ---- */
  {
    id: "ataqueInconsequente",
    label: "Ataque Inconsequente",
    tipo: "bool",
    // A mesma habilidade existe no Lutador e no Restringido, com o mesmo texto:
    // uma linha só na bancada, e quem tem qualquer uma das duas a vê.
    requerHabilidade: ["lut_ataque_inconsequente", "res_ataque_inconsequente"],
  },
  {
    id: "impactoMisto",
    label: "Impacto Misto",
    tipo: "bool",
    requerHabilidade: "lut_impacto_misto",
  },
  {
    id: "resistirPE",
    label: "Resistir · PE Gasto",
    tipo: "faixa",
    min: 0,
    // "você pode gastar até 2PE"
    max: () => 2,
    requerHabilidade: "lut_resistir",
  },
  {
    id: "furiaVinganca",
    label: "Fúria da Vingança",
    tipo: "bool",
    requerHabilidade: "lut_furia_da_vinganca",
  },
  {
    id: "imprudenciaMotivadora",
    label: "Imprudência Motivadora",
    tipo: "bool",
    requerHabilidade: "lut_imprudencia_motivadora",
  },
  {
    id: "machucado",
    label: "Abaixo da Metade dos PV",
    tipo: "bool",
    requerHabilidade: "lut_sobrevivente",
  },
  {
    id: "abates",
    label: "Eliminar e Continuar · Abates",
    tipo: "faixa",
    min: 0,
    // O texto diz "os quais acumulam" e não dá teto. 5 é limite DA BANCADA, só
    // para a linha não virar um contador infinito.
    max: () => 5,
    requerHabilidade: "lut_eliminar_e_continuar",
  },
  {
    id: "armasAbsolutas",
    label: "Armas Absolutas",
    tipo: "opcao",
    opcoes: [
      { id: "defesa", label: "Defesa" },
      { id: "acerto", label: "Acerto" },
    ],
    requerHabilidade: "lut_armas_absolutas",
  },

  /* ============================================================ */
  /* COMBATENTE                                                    */
  /* ============================================================ */

  // As 8 Posturas. Cada uma só aparece para quem a aprendeu (`requerEscolha`),
  // e o segundo slot só existe com Mestre da Postura.
  {
    id: "postura",
    label: "Postura",
    tipo: "opcao",
    familia: "postura",
    opcoes: POSTURA_OPCOES,
    requerHabilidade: "cmb_assumir_postura",
  },
  {
    id: "postura2",
    label: "Postura · Segunda",
    tipo: "opcao",
    familia: "postura",
    opcoes: POSTURA_OPCOES,
    requerHabilidade: "cmb_mestre_da_postura",
  },
  {
    id: "devastacaoPilha",
    label: "Postura da Devastação · Golpes",
    tipo: "faixa",
    min: 0,
    // "até um máximo igual ao seu bônus de treinamento para o acerto"
    max: (d) => Math.max(0, d?.maestria ?? 0),
    requerEscolha: "cmb_postura_da_devastacao",
  },

  // Golpe Especial (Base 4). Só as propriedades que viram número entram: as
  // outras (Amplo, Impactante, Longo, Preciso, Sanguinário, Lento) são alvo,
  // alcance, vantagem ou economia de ação.
  {
    id: "golpeAtroz",
    label: "Golpe Especial · Atroz",
    tipo: "bool",
    requerHabilidade: "cmb_golpe_especial",
  },
  {
    id: "golpeLetal",
    label: "Golpe Especial · Letal",
    tipo: "bool",
    requerHabilidade: "cmb_golpe_especial",
  },
  {
    id: "golpePenetrante",
    label: "Golpe Especial · Penetrante",
    tipo: "bool",
    requerHabilidade: "cmb_golpe_especial",
  },
  {
    id: "golpeDesfocado",
    label: "Golpe Especial · Desfocado",
    tipo: "faixa",
    min: 0,
    // "cumulativo até três vezes"
    max: () => 3,
    requerHabilidade: "cmb_golpe_especial",
  },

  // Artes do Combate (Base 1): as duas que dão número.
  {
    id: "arteExecucaoSilenciosa",
    label: "Arte · Execução Silenciosa",
    tipo: "bool",
    requerHabilidade: "cmb_artes_do_combate",
  },
  {
    id: "arteGolpeDescendente",
    label: "Arte · Golpe Descendente",
    tipo: "bool",
    requerHabilidade: "cmb_artes_do_combate",
  },

  {
    id: "espiritoDeLuta",
    label: "Espírito de Luta",
    tipo: "bool",
    requerHabilidade: "cmb_espirito_de_luta",
  },
  {
    id: "espiritoIncansavel",
    label: "Espírito de Luta · 2 PE",
    tipo: "bool",
    requerHabilidade: "cmb_espirito_incansavel",
    requerEstado: "espiritoDeLuta",
  },
  {
    id: "precisaoPE",
    label: "Precisão Definitiva · PE",
    tipo: "faixa",
    min: 0,
    // "1 PE para +2. A cada quatro níveis, você pode gastar 1 ponto a mais."
    max: (d) => 1 + Math.floor(nivelDeEfeito(d, "combatente") / 4),
    requerHabilidade: "cmb_precisao_definitiva",
  },
  {
    id: "precisaoModo",
    label: "Precisão Definitiva · Onde",
    tipo: "opcao",
    opcoes: [
      { id: "acerto", label: "Acerto" },
      { id: "dano", label: "Dano" },
    ],
    requerHabilidade: "cmb_precisao_definitiva",
  },
  {
    id: "arsenalCiclico",
    label: "Arsenal Cíclico · Trocou de Grupo",
    tipo: "bool",
    requerHabilidade: "cmb_arsenal_ciclico",
  },
  {
    id: "arremessosPotentes",
    label: "Arremessos Potentes · 1 PE",
    tipo: "bool",
    requerHabilidade: "cmb_arremessos_potentes",
  },
  {
    id: "pistoleiroEmperrar",
    label: "Pistoleiro · Emperrar Extra",
    tipo: "faixa",
    min: 0,
    // 2 no Iniciado, até 6 no Avançado ("1 dado adicional para cada outros 2").
    max: (d) => ((d?.habilidades?.escolhidas ?? []).includes("cmb_pistoleiro_avancado") ? 6 : 2),
    requerHabilidade: "cmb_pistoleiro_iniciado",
  },
  {
    id: "duelando",
    label: "Duelando · Uma Arma, Mão Livre",
    tipo: "bool",
    requerEscolha: "cmb_estilo_do_duelista",
  },

  /* ============================================================ */
  /* RESTRINGIDO                                                   */
  /* ============================================================ */

  {
    id: "surtoAdrenalina",
    label: "Surto de Adrenalina",
    tipo: "bool",
    requerHabilidade: "res_surto_de_adrenalina",
  },
  {
    id: "adrenalinaAbsoluta",
    label: "Surto · Absoluto",
    tipo: "bool",
    requerHabilidade: "res_adrenalina_absoluta",
    requerEstado: "surtoAdrenalina",
  },
  {
    id: "adrenalinaAtletismo",
    label: "Surto · Bônus em Atletismo",
    tipo: "faixa",
    min: 0,
    // "distribuir um bônus de +4 entre Atletismo e Acrobacia", +8 com a
    // Restrição Definitiva. O que sobra vai para Acrobacia.
    max: (d) => ((d?.habilidades?.escolhidas ?? []).includes("res_restricao_definitiva") ? 8 : 4),
    requerHabilidade: "res_adrenalina_intensificadora",
    requerEstado: "surtoAdrenalina",
  },
  {
    id: "ataqueFurtivo",
    label: "Ataque Furtivo",
    tipo: "bool",
    requerHabilidade: "res_ataque_furtivo",
  },
  {
    id: "furtivoGarantido",
    label: "Ataque Furtivo · Acerto Garantido",
    tipo: "bool",
    requerHabilidade: "res_arremetida_encoberta",
    requerEstado: "ataqueFurtivo",
  },
  {
    id: "focoInimigo",
    label: "Foco no Inimigo",
    tipo: "bool",
    requerHabilidade: "res_foco_no_inimigo",
  },
  {
    id: "cacadorFeiticeiros",
    label: "Caçador de Feiticeiros · Pares de PE",
    tipo: "faixa",
    min: 0,
    // "A cada 5 níveis você pode gastar mais 2 pontos": 1 par de saída, mais um
    // a cada 5 níveis de Restringido.
    max: (d) => 1 + Math.floor(nivelDeEfeito(d, "restringido") / 5),
    requerHabilidade: "res_cacador_de_feiticeiros",
  },
  {
    id: "golpeImpactante",
    label: "Golpe Impactante",
    tipo: "bool",
    requerHabilidade: "res_golpe_impactante",
  },
  /* ============================================================ */
  /* TALENTOS                                                      */
  /* ============================================================ */

  {
    id: "duasArmas",
    label: "Empunhando Duas Armas",
    tipo: "bool",
    requerTalento: "tal_tecnicas_de_empunhadura_dupla",
  },
  {
    id: "golpeEscudo",
    label: "Empurrão com Escudo",
    tipo: "bool",
    requerTalento: "tal_tecnicas_ofensivas_de_escudo",
  },

  {
    id: "corpoDeAco",
    label: "Corpo de Aço · Cura",
    tipo: "faixa",
    min: 0,
    // 0 = sem gastar. "No nível 10, você pode pagar 1 ponto adicional para
    // aumentar a cura em 1d8", e outro no 15: são os degraus além da ativação.
    max: (d) => {
      const n = nivelDeEfeito(d, "restringido");
      return 1 + (n >= 10 ? 1 : 0) + (n >= 15 ? 1 : 0);
    },
    requerHabilidade: "res_corpo_de_aco",
  },

  /* ---- Aptidões Amaldiçoadas (2026-07-30) ---- */
  {
    // "No começo de toda rodada você pode escolher pagar 2 PE. Caso o faça, você
    // recebe RD contra todos os tipos de dano, exceto na alma."
    id: "auraExcessiva",
    label: "Aura Excessiva",
    tipo: "bool",
    requerAptidao: "aura_excessiva",
  },
  {
    // "gastar uma quantidade de PE igual a 2 + o dobro do seu CL... para cada
    // ponto gasto, você recebe 4 PVs temporários" (8 com Cobertura Avançada).
    id: "cobrirSePE",
    label: "Cobrir-se · PE Gasto",
    tipo: "faixa",
    min: 0,
    max: (d) => 2 + 2 * (d?.aptidao?.efetivo?.cl ?? 0),
    requerAptidao: "cobrir_se",
  },
  {
    // "você pode gastar até uma quantidade de PE igual a seu Nível de Aptidão em
    // Controle e Leitura, recebendo um bônus de +1 para cada PE gasto" (+2 com
    // o Avançado).
    id: "estimuloTeste",
    label: "Estímulo Muscular · PE no Teste",
    tipo: "faixa",
    min: 0,
    max: (d) => d?.aptidao?.efetivo?.cl ?? 0,
    requerAptidao: "estimulo_muscular",
  },
  {
    // "gastar 2 PE para aumentar a distância em um valor igual ao seu Nível de
    // Aptidão em Controle e Leitura multiplicado por 1,5 metros."
    id: "estimuloEmpurrao",
    label: "Estímulo Muscular · Empurrão",
    tipo: "bool",
    requerAptidao: "estimulo_muscular",
  },
  {
    // "Você pode gastar um máximo de pontos de energia reversa por vez igual a
    // 1 + metade do seu nível de aptidão", que a Cura Amplificada sobe para
    // "1 + seu nível de aptidão".
    id: "fluxoPER",
    label: "Fluxo Constante · PER Gasto",
    tipo: "faixa",
    min: 0,
    max: (d) => {
      const er = d?.aptidao?.efetivo?.er ?? 0;
      const ids = d?.aptidoesEscolhidas ?? [];
      return 1 + (ids.includes("cura_amplificada") ? er : Math.floor(er / 2))
        + (ids.includes("cura_em_grupo") ? 2 : 0);
    },
    requerAptidao: "fluxo_constante",
  },
  {
    // A expansão no ar. Vale para a que estiver marcada como ativa na aba
    // Habilidades, porque expandir é uma de cada vez.
    // ⚠ Basta a Incompleta para a linha aparecer: quem tem a Completa tem a
    // Incompleta como pré-requisito, então a checagem de uma cobre as duas.
    id: "dominioAtivo",
    label: "Expansão de Domínio",
    tipo: "bool",
    requerAptidao: "expansao_de_dominio_incompleta",
  },
  {
    // Regeneração Corporal (Maldição) é AÇÃO COMUM, e por isso a aptidão base
    // não vira número de ficha sozinha. Quem a torna automática é o Fluxo
    // Imparável ("no começo do seu turno, como uma ação livre"), e cura no
    // início do turno É o canal de Regeneração. Exatamente o mesmo desenho do
    // fluxoPER da Energia Reversa, com a moeda trocada: aqui é PE.
    //
    // "gastar até 2 pontos... a quantidade máxima passa a ser igual ao seu
    // bônus de treinamento por rodada", que a Ampliada dobra.
    id: "regeneracaoPE",
    label: "Regeneração Corporal · PE Gasto",
    tipo: "faixa",
    min: 0,
    passo: 2,
    max: (d) => {
      const bt = d?.maestria ?? 2;
      const ids = d?.aptidoesEscolhidas ?? [];
      return ids.includes("mal_regeneracao_ampliada") ? 2 * bt : bt;
    },
    requerAptidao: "mal_fluxo_imparavel",
  },
];

/** Quantos incrementos de 2 PE a Brutalidade já liberou, pelo nível de Lutador. */
export function degrausBrutalidade(derived) {
  const n = nivelDeEfeito(derived, "lutador");
  return (n >= 8 ? 1 : 0) + (n >= 12 ? 1 : 0) + (n >= 16 ? 1 : 0) + (n >= 20 ? 1 : 0);
}

const boolDe = (v) => (v ? 1 : 0);
const intDe = (v, min, max) => Math.min(max, Math.max(min, Math.trunc(Number(v) || 0)));

/** `brutalidadePE` → `brutalidade_pe`, que é o vocabulário do DSL. */
export const varDoEstado = (id) => id.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();

/**
 * Média do Dado de Empolgação do nível atual, ARREDONDADA PARA BAIXO.
 *
 * O dado é rolagem e o Motor trabalha com número, então as manobras que somam
 * "seu dado de empolgação" (Ajuste, Desarme, Esquiva, Trabalho de Pés) entram
 * pela média. Para uma bancada de balanceamento é justamente o valor que
 * interessa. A tabela de dados em si continua sendo a de afty-habilidades.
 */
export function mediaDadoEmpolgacao(nivel, aprimorada = false) {
  const tabela = aprimorada ? EMPOLGACAO_DADOS.maxima : EMPOLGACAO_DADOS.base;
  const notacao = tabela[nivel];
  if (!notacao) return 0;                       // o nível 1 não tem dado
  const [qtd, faces] = notacao.split("d").map(Number);
  return Math.floor((qtd * (faces + 1)) / 2);
}

/**
 * Normaliza o estado da ficha. Devolve sempre o objeto inteiro, com `ativo`
 * zerando tudo: é mais simples de raciocinar do que espalhar `if (ativo)` por
 * cada expressão do catálogo.
 *
 * `params` vem do deriveAfty, porque os limites dependem da ficha e este módulo
 * não calcula ficha:
 *   • `brutalidadePE`, `brutalidadePilha` — tetos das duas faixas.
 *   • `empolgacaoMaxima` — a habilidade de 12° que troca a tabela de dados,
 *     necessária para a média sair certa.
 */
/**
 * Estados que não vêm do catálogo, e sim da FICHA. Hoje só as Habilidades Únicas
 * marcadas como ativas (uma por item equipado), mas o formato é o mesmo que as
 * outras fontes ativas do pool exclusivo vão pedir quando existirem: um Feitiço
 * Auxiliar e um Shikigami também são instâncias, e não linhas de catálogo.
 *
 * Só `bool`, de propósito. Instância se liga e se desliga, não tem faixa.
 */
const listaExtras = (params) => (Array.isArray(params?.estadosExtras) ? params.estadosExtras : [])
  .filter((e) => e?.id);

export function resolveCombate(creature, params = {}) {
  const c = (creature?.combate && typeof creature.combate === "object") ? creature.combate : {};
  const ativo = !!c.ativo;
  const extras = listaExtras(params);
  // Insistência (10°): "até que realize um descanso longo, o seu nível máximo
  // de empolgação abaixa em 1". Não passa por canal porque é TETO de um estado,
  // e o estado é montado antes de o Motor rodar. Mesmo caso do brutalidadePE.
  const insistenciaUsada = !!c.insistenciaUsada;
  const empolgacaoMax = EMPOLGACAO_NIVEL_MAX - (insistenciaUsada ? 1 : 0);

  const opcaoDe = (id) => {
    const def = COMBATE_ESTADOS.find((e) => e.id === id);
    const escolhida = c[id];
    return def?.opcoes?.some((o) => o.id === escolhida) ? escolhida : null;
  };

  // Zerado é o padrão de TODO estado, e o que sai fora de combate. Vem do
  // catálogo para um estado novo não escapar da regra por esquecimento.
  const zerado = {
    ...Object.fromEntries(COMBATE_ESTADOS.map((e) => [
      e.id, e.tipo === "bool" ? false : e.tipo === "opcao" ? null : 0,
    ])),
    ...Object.fromEntries(extras.map((e) => [e.id, false])),
  };

  if (!ativo) {
    return {
      ...zerado,
      ativo: false, empolgacaoMax, dadoEmpolgacao: 0, estadosExtras: extras,
    };
  }
  const brutalidade = !!c.brutalidade;
  const empolgacao = intDe(c.empolgacao ?? 1, 1, empolgacaoMax);
  const espiritoDeLuta = !!c.espiritoDeLuta;
  // ⚠ TODA faixa precisa estar aqui. O clamp abaixo usa `tetoFaixa[e.id] ?? 0`,
  // então uma faixa ausente é aparada em ZERO e o estado nunca sai do lugar, sem
  // erro nenhum. O `max` do catálogo é só da UI, e não chega aqui.
  const tetoFaixa = {
    empolgacao: empolgacaoMax,
    brutalidadePE: params.brutalidadePE ?? 0,
    brutalidadePilha: params.brutalidadePilha ?? 0,
    resistirPE: 2,
    abates: 5,
    golpeDesfocado: 3,
    devastacaoPilha: params.devastacaoPilha ?? 0,
    precisaoPE: params.precisaoPE ?? 0,
    pistoleiroEmperrar: params.pistoleiroEmperrar ?? 0,
    adrenalinaAtletismo: params.adrenalinaAtletismo ?? 0,
    cacadorFeiticeiros: params.cacadorFeiticeiros ?? 0,
    corpoDeAco: params.corpoDeAco ?? 0,
    cobrirSePE: params.cobrirSePE ?? 0,
    estimuloTeste: params.estimuloTeste ?? 0,
    fluxoPER: params.fluxoPER ?? 0,
    regeneracaoPE: params.regeneracaoPE ?? 0,
  };
  const out = { ...zerado, ativo: true, empolgacaoMax, estadosExtras: extras };
  for (const e of COMBATE_ESTADOS) {
    if (e.tipo === "bool") out[e.id] = !!c[e.id];
    else if (e.tipo === "opcao") out[e.id] = opcaoDe(e.id);
    else {
      const min = e.min ?? 0;
      const passo = Math.max(1, Math.trunc(Number(e.passo) || 1));
      const valor = intDe(c[e.id], min, Math.max(min, tetoFaixa[e.id] ?? 0));
      out[e.id] = min + Math.floor((valor - min) / passo) * passo;
    }
  }
  for (const e of extras) out[e.id] = !!c[e.id];
  const surto = !!c.surtoAdrenalina;
  return {
    ...out,
    empolgacao,
    insistenciaUsada,
    dadoEmpolgacao: mediaDadoEmpolgacao(empolgacao, !!params.empolgacaoMaxima),
    // Os dois de Brutalidade e o upgrade do Espírito só valem com o dono ligado.
    brutalidadePE: brutalidade ? out.brutalidadePE : 0,
    brutalidadePilha: brutalidade ? out.brutalidadePilha : 0,
    espiritoIncansavel: espiritoDeLuta && !!c.espiritoIncansavel,
    // Os dois do Surto e o do Ataque Furtivo também.
    adrenalinaAbsoluta: surto && !!c.adrenalinaAbsoluta,
    adrenalinaAtletismo: surto ? out.adrenalinaAtletismo : 0,
    furtivoGarantido: !!c.ataqueFurtivo && !!c.furtivoGarantido,
  };
}

/**
 * O estado no vocabulário do DSL. Nomes em minúsculas e com underscore, igual
 * ao resto do contexto (ver buildCriaturaDslContext).
 *
 * Sai do próprio COMBATE_ESTADOS, para não haver estado sem variável. Cada
 * `opcao` rende uma booleana POR OPÇÃO (`armas_absolutas_defesa`), mais a
 * booleana do estado inteiro (`armas_absolutas`, ligada em qualquer opção):
 * assim o `quando` continua legível, sem número mágico.
 */
export function combateDslVars(combate = {}) {
  const out = { em_combate: boolDe(combate.ativo) };
  for (const e of COMBATE_ESTADOS) {
    const nome = varDoEstado(e.id);
    const valor = combate[e.id];
    if (e.tipo === "faixa") {
      out[nome] = Math.max(0, Math.trunc(Number(valor) || 0));
    } else if (e.tipo === "opcao") {
      out[nome] = boolDe(valor);
      for (const o of e.opcoes) {
        out[`${nome}_${o.id}`] = boolDe(valor === o.id);
        // Slots da mesma família acendem uma booleana comum: `em_postura_sol` é
        // 1 com o Sol em QUALQUER slot, e é isso que o conteúdo lê.
        if (e.familia) {
          const comum = `em_${e.familia}_${o.id}`;
          out[comum] = boolDe(out[comum] || valor === o.id);
        }
      }
    } else {
      out[nome] = boolDe(valor);
    }
  }
  // Os estados que vieram da ficha (Habilidade Única ativa, e no futuro Feitiço
  // Auxiliar e Shikigami). Entram DEPOIS do catálogo: se um id colidisse com o
  // de um estado de catálogo, quem manda é o catálogo, que é o vocabulário que o
  // conteúdo escrito à mão usa.
  for (const e of (Array.isArray(combate.estadosExtras) ? combate.estadosExtras : [])) {
    const nome = varDoEstado(e.id);
    if (nome in out) continue;
    out[nome] = boolDe(combate[e.id]);
  }
  // Média do Dado de Empolgação, o que as Manobras somam.
  out.dado_empolgacao = Math.max(0, Math.trunc(Number(combate.dadoEmpolgacao) || 0));
  return out;
}

/** Variáveis que o contexto expõe, para o validador de conteúdo conhecer. */
export const COMBATE_VARS = Object.keys(combateDslVars({}));
