/**
 * ============================================================
 * CONTEÚDO DO MOTOR DE AUTOMAÇÃO — o que cada entrada FAZ na ficha
 * ============================================================
 * Um mapa por catálogo, `{ [id]: [{ canal, expr, quando?, alvo?, duracao? }] }`.
 * O vocabulário de canal e o validador vivem em ./afty-efeitos.js, que
 * reexporta tudo daqui. Este arquivo é DADO, igual aos outros catálogos: sem
 * import, sem lógica.
 *
 * ------------------------------------------------------------
 * O QUE ENTRA AQUI
 * ------------------------------------------------------------
 * Só o que vira NÚMERO NA FICHA (ou faixa de treino, ou nível de trilha). O
 * resto do texto da habilidade continua valendo na mesa e segue visível na UI,
 * mas não tem para onde ir no motor:
 *
 *   • **Estado de combate.** Nível de Empolgação, Brutalidade, PV temporários
 *     por abate. A ficha não tem estado de combate, então nada disso resolve
 *     num valor fixo. (Ignorar Dor, Fluxo, Eliminar e Continuar...)
 *   • **Dano.** Nível de dado de dano, dano adicional, margem de crítico. Não
 *     existe sistema de dano nem de armas.
 *   • **Reação, ação bônus e "uma vez por rodada".** É procedimento de mesa.
 *   • **Vantagem, desvantagem e condições.** Não são número.
 *   • **Manobras** (Agarrar, Derrubar, Empurrar) e testes opostos.
 *
 * ------------------------------------------------------------
 * QUAL NÍVEL USAR NA EXPRESSÃO
 * ------------------------------------------------------------
 *   • `nd`             — "seu nível de personagem".
 *   • `esc_<espec>`    — "seu nível de Lutador" e qualquer degrau por nível
 *                        DENTRO de uma habilidade de especialização. É o nível
 *                        de ESCALONAMENTO (real + metade da outra classe), que
 *                        é o que o autor definiu para efeito que escala.
 *   • `nivel_<espec>`  — nível REAL. Só para pré-requisito, não para efeito.
 *   • `maestria`       — "bônus de treinamento".
 *
 * ⚠ Degrau por nível vira soma de comparações: `2 + (esc_lutador >= 8)` dá 2
 * antes do 8° e 3 a partir dele, porque no DSL um booleano é 1 ou 0.
 * ============================================================
 */

/* ============================================================ */
/* HABILIDADES DE ESPECIALIZAÇÃO                                 */
/* ============================================================ */

export const HABILIDADE_EFEITOS = {
  /* ================= LUTADOR ================= */

  /* ---- Base ---- */

  // "Você pode escolher usar tanto Força quanto Destreza nos seus ataques
  // desarmados e ataques com armas marciais." É a mesma permissão que o traço
  // Fineza dá, então liga o Fineza no ataque Corpo a Corpo em vez de inventar
  // um segundo caminho. Sendo escolha do jogador e sem custo, vale o maior dos
  // dois modificadores (mesmo critério que o autor deu para Int ou Sabedoria).
  //
  // ⚠ O dano NÃO é "1d8 que sobe nos níveis 5, 9, 13 e 17". O autor corrigiu
  // (2026-07-27): a habilidade dá 1 NÍVEL DE DANO, e mais 1 em cada um desses
  // níveis, chegando a 5. Cada Nível de Dano soma 1 no ND, só para dano.
  lut_corpo_treinado: [
    { canal: "finezaAtaque", alvo: "corpo", expr: "1" },
    { canal: "nivelDano", alvo: "basico",
      expr: "1 + (esc_lutador >= 5) + (esc_lutador >= 9) + (esc_lutador >= 13) + (esc_lutador >= 17)" },
  ],

  // "redução de dano a todo tipo, exceto alma, igual a metade do seu nível de
  // Lutador". A RD Geral da ficha é justamente a que vale para todo tipo.
  lut_reflexo_evasivo: [
    { canal: "rdGeral", expr: "piso(esc_lutador / 2)" },
  ],

  // "+2 na CD de suas Habilidades de Especialização, Feitiços e Aptidões
  // Amaldiçoadas. Esse bônus aumenta em 1 nos níveis 8° e 16° de Lutador."
  lut_implemento_marcial: [
    { canal: "cd", expr: "2 + (esc_lutador >= 8) + (esc_lutador >= 16)" },
  ],

  // "+2 em jogadas de ataque desarmadas ou com armas marciais e +1 em rolagens
  // de Fortitude e de dano. Nos níveis 8, 12, 16 e 20 o bônus em jogadas de
  // ataque aumenta em +1, enquanto nos níveis 9, 13 e 17 o bônus em Fortitude
  // e dano aumenta em +1."
  lut_gosto_pela_luta: [
    { canal: "bonusAcerto", alvo: "corpo",
      expr: "2 + (esc_lutador >= 8) + (esc_lutador >= 12) + (esc_lutador >= 16) + (esc_lutador >= 20)" },
    { canal: "bonusTR", alvo: "fortitude",
      expr: "1 + (esc_lutador >= 9) + (esc_lutador >= 13) + (esc_lutador >= 17)" },
    { canal: "danoBonus",
      expr: "1 + (esc_lutador >= 9) + (esc_lutador >= 13) + (esc_lutador >= 17)" },
  ],

  /* ---- 2° nível ---- */

  // "Todo ataque desarmado que você realizar causa dano adicional igual ao seu
  // bônus de treinamento e você soma metade do seu bônus de treinamento em
  // jogadas de ataque desarmados."
  lut_caminho_da_mao_vazia: [
    { canal: "bonusAcerto", alvo: "corpo", expr: "piso(maestria / 2)" },
    { canal: "danoBonus", expr: "maestria" },
  ],

  /* ---- 4° nível ---- */

  // "Enquanto estiver desarmado ou empunhando uma arma marcial, você soma
  // 1 + metade do seu Bônus de Treinamento à sua Defesa."
  lut_defesa_marcial: [
    { canal: "defesa", expr: "1 + piso(maestria / 2)" },
  ],

  // "você pode optar por somar seu Modificador de Força ao invés de Destreza em
  // sua Defesa". A Defesa já soma Destreza, então o efeito é a DIFERENÇA, e
  // nunca negativa: quem tem Força pior simplesmente não opta.
  lut_musculos_desenvolvidos: [
    { canal: "defesa", expr: "max(0, mod_forca - mod_destreza)" },
  ],

  /* ---- 6° nível ---- */

  // "Você passa a somar metade do seu Bônus de Treinamento em sua CD de
  // Especialização."
  lut_aprimoramento_marcial: [
    { canal: "cd", expr: "piso(maestria / 2)" },
  ],

  // "adiciona metade do seu Modificador de Constituição na sua Defesa e recebe
  // pontos de vida adicionais igual ao seu nível de Lutador."
  lut_corpo_calejado: [
    { canal: "defesa", expr: "piso(mod_constituicao / 2)" },
    { canal: "hp", expr: "esc_lutador" },
  ],

  // "O dano de seus ataques desarmados aumenta em 2 níveis." A Manobra que ela
  // também concede é procedimento de mesa.
  lut_poder_corporal: [
    { canal: "nivelDano", alvo: "basico", expr: "2" },
  ],

  /* ---- 12° nível ---- */

  // "Seu Deslocamento aumenta em 3 metros."
  lut_seja_agua: [
    { canal: "movimento", expr: "3" },
  ],

  /* ---- 16° nível ---- */

  // "mais 3 metros de movimento adicionais, +4 na sua Defesa e redução de dano
  // igual a metade do seu nível de personagem contra dano cortante, perfurante
  // e de impacto, além de mais um tipo à sua escolha, exceto alma. Contra os
  // outros tipos de dano não escolhidos, a redução de dano é igual a 1/4 do
  // seu nível."
  // Cortante, perfurante e impacto são os três tipos FÍSICOS, daí a RD Física.
  // O "mais um tipo à sua escolha" não tem onde ser escolhido: não existe
  // catálogo de tipos de dano.
  lut_corpo_supremo: [
    { canal: "movimento", expr: "3" },
    { canal: "defesa", expr: "4" },
    { canal: "rdFisico", expr: "piso(nd / 2)" },
    { canal: "rdGeral", expr: "piso(nd / 4)" },
  ],
};

/* ============================================================ */
/* ESCOLHAS ANINHADAS                                            */
/* ============================================================ */
/* Efeito de uma OPÇÃO escolhida dentro de uma habilidade (Estilo de Combate,
   Manobra de Empolgação, a trilha de Aptidões de Luta). A chave é o id da
   OPÇÃO, não o da habilidade dona: quem pegou a habilidade mas escolheu outra
   opção não recebe nada.

   Coletado a partir de `habilidades.escolhas.mapa`, que já sai pronto do
   resolveEscolhasHabilidade. */

export const ESCOLHA_EFEITOS = {
  // Aptidões de Luta (Lutador 8°): "você pode aumentar o seu nível de aptidão
  // em Aura ou Controle e Leitura em 1. Você pode pegar esta habilidade duas
  // vezes, uma para cada aptidão."
  lut_aptidao_aura: [{ canal: "nivelAptidao", alvo: "au", expr: "1" }],
  lut_aptidao_controle_leitura: [{ canal: "nivelAptidao", alvo: "cl", expr: "1" }],
};

/* ============================================================ */
/* DEMAIS CATÁLOGOS                                              */
/* ============================================================ */
/* Ainda vazios: a passada de conteúdo é por catálogo, e o Lutador foi o
   primeiro. Ver docs/afty-efeitos-criatura.md. */

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
