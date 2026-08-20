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
 *   • **Vantagem, desvantagem e condições.** Não são número, e não existe
 *     catálogo de condições ainda.
 *   • **Efeito no ALVO.** A ficha só conhece a si, então "-1 na Defesa dele"
 *     não tem onde cair (Tempestade Sufocante, Esquiva Rápida, Deboche).
 *   • **Economia de ação.** Ataque extra, ação bônus, reação, "uma vez por
 *     rodada". A ficha não conta ações.
 *
 * O que JÁ TEM para onde ir, e antes não tinha:
 *
 *   • **Estado de combate.** Empolgação, Brutalidade, PV temporário por abate.
 *     A Simulação de Combate (afty-combate.js) virou variável de DSL, então
 *     `quando` liga e desliga sozinho.
 *   • **Dano.** Uma linha por fonte, com nível de dano, dado adicional e margem
 *     de crítico (afty-pericias.js).
 *   • **Manobras** (Agarrar, Derrubar, Desarmar, Empurrar) e o empurrão.
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
 *
 * ⚠ Toda variável de FAMÍLIA (`esc_*`, `nivel_*`, `prof_*`, `prof_tr_*`,
 * `tem_*`) está sempre declarada no contexto, mesmo valendo zero. Sem isso a
 * expressão inteira cairia no fallback, calada, sempre que citasse uma que a
 * criatura não tem. Ver VOCABULARIO_DSL em afty-derive.js.
 *
 * ------------------------------------------------------------
 * DADO NOMEADO VIRA MÉDIA, DADO GENÉRICO VIRA DADO
 * ------------------------------------------------------------
 * O texto diz de dois jeitos, e eles são canais DIFERENTES:
 *
 *   • "1 dado de dano adicional", "+1d"  → canal `dadosDano`. É um dado da
 *     LINHA, e o tamanho dele acompanha o Patamar (d8 no Comum, d12 na
 *     Calamidade). Lutador Superior, Golpe Especial Atroz, Postura do Sol.
 *   • "1d6 de dano", "2d10", "Xd8"       → canal `danoBonus` com a MÉDIA
 *     arredondada para baixo (1d6 = 3, 2d10 = 11, 1d8 = 4). Usar `dadosDano`
 *     aqui inflaria o dado nos Patamares altos, que é justamente onde o
 *     balanceamento importa. Ataque Furtivo, Quebra Crânio, Foco no Inimigo.
 *
 * As exceções são a REGENERAÇÃO e a CURA, que têm canal próprio para as faces
 * do dado (`regeneracaoFaces`, `curaFaces`) e por isso guardam a rolagem de
 * verdade, e não a média dela.
 * ============================================================
 */

/**
 * Os 12 grupos de arma, repetidos aqui como TEXTO porque este arquivo é dado
 * puro e não importa nada (o catálogo mora em afty-equipamentos.js, em
 * ARMA_GRUPOS). O teste de conteúdo confere que as duas listas batem.
 */
const GRUPOS_ARMA = [
  "faca", "bastao", "espada", "pugilato", "haste", "machado",
  "chicote", "martelo", "arco", "besta", "tiro", "dardo",
];

/**
 * O nível que os Estilos de Combate escalam.
 *
 * O mesmo pool é usado por duas fontes com níveis diferentes: o Repertório do
 * Especialista (Combatente base) conta o nível de Combatente, e o Talento
 * Adepto de Combate diz "considera seu Nível de Personagem para os efeitos".
 * O `max` resolve os dois com uma expressão só, e quem tem os dois fica com o
 * maior. Sem o `tem_`, o Talento não teria como se anunciar.
 */
const NIVEL_ESTILO = "max(esc_combatente, nd * tem_tal_adepto_de_combate)";

/** As 5 trilhas de aptidão, como texto (este arquivo é dado puro). */
const TRILHAS = ["dom", "au", "cl", "bar", "er"];

/**
 * Os Talentos que dizem "aumenta o valor de X à sua escolha", cada um com o seu
 * valor e o seu pool. `[prefixo do id da opção, quanto soma, atributos do pool,
 * sobeLimite]` — o pool tem de bater com o `opcoesDeAtributo` do catálogo, senão
 * sobra chave de efeito que ninguém escolhe (o teste confere os dois lados).
 *
 * O 4º item é o que separa os dois grupos. A maioria sobe só o VALOR, e por isso
 * apara no limite de 20. Dois deles dizem em texto que o LIMITE sobe junto, e
 * ganham o canal `limiteAtributo` no mesmo pacote:
 *   • Incremento de Atributo: "você aumenta o valor e o limite de um atributo à
 *     sua escolha em 2".
 *   • Quebra de Limites: "o limite dos dois atributos escolhidos é aumentado em 2".
 */
const TODOS_ATRIBUTOS = ["forca", "destreza", "constituicao", "inteligencia", "sabedoria", "presenca"];
const FOR_DES = ["forca", "destreza"];
const FOR_CON = ["forca", "constituicao"];
const ESCOLHAS_DE_ATRIBUTO = [
  ["tal_incremento",       2, TODOS_ATRIBUTOS, true],   // Incremento de Atributo
  ["tal_quebra",           2, TODOS_ATRIBUTOS, true],   // Quebra de Limites
  ["tal_tempestade",       1, TODOS_ATRIBUTOS],  // Tempestade de Ideias
  ["tal_mestre_armas",     2, FOR_DES],          // Mestre das Armas
  ["tal_mestre_defensivo", 2, FOR_CON],          // Mestre Defensivo
  ["tal_concussao",        1, FOR_CON],          // Especialista em Concussão
  ["tal_cortes",           1, FOR_DES],          // Especialista em Cortes
  ["tal_perfuracao",       1, FOR_DES],          // Especialista em Perfuração
];
/** Os 4 TRs da Resiliência Melhorada (sem Integridade) com o atributo de cada. */
const RESISTENCIAS_COM_ATRIBUTO = [
  ["reflexos", "destreza"], ["fortitude", "constituicao"],
  ["vontade", "sabedoria"], ["astucia", "inteligencia"],
];

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

  // "Uma vez por rodada, ao realizar um ataque, você pode escolher receber
  // vantagem na jogada de ataque e +5 na rolagem de dano dele."
  // A vantagem não é número. O Desprevenido que vem junto é condição.
  lut_ataque_inconsequente: [
    { canal: "danoBonus", quando: "ataque_inconsequente", expr: "5", duracao: "temporaria" },
  ],

  // "Enquanto estiver desarmado ou empunhando uma arma marcial, você recebe um
  // bônus de +2 em testes para Desarmar, Derrubar ou Empurrar, assim como para
  // resistir a esses efeitos."
  // ⚠ Agarrar NÃO está na lista, e é de propósito: o texto nomeia três.
  lut_complementacao_marcial: [
    { canal: "bonusManobra", alvo: "desarmar", expr: "2" },
    { canal: "bonusManobra", alvo: "derrubar", expr: "2" },
    { canal: "bonusManobra", alvo: "empurrar", expr: "2" },
    { canal: "resistirManobra", alvo: "desarmar", expr: "2" },
    { canal: "resistirManobra", alvo: "derrubar", expr: "2" },
    { canal: "resistirManobra", alvo: "empurrar", expr: "2" },
  ],

  // "Quando acertar uma criatura com um ataque com arma marcial, você recebe
  // +2 em jogadas de ataque e dano desarmados até o começo do seu próximo
  // turno. Nos níveis 5, 10, 15 e 20, o bônus em dano aumenta em +1, enquanto
  // nos níveis 6, 12 e 18 o bônus em jogadas de ataque aumenta em +1."
  // ⚠ O acerto vai no Corpo a Corpo, que é o mais perto de "desarmado" que a
  // ficha tem: não existe jogada de ataque só para desarmado. O DANO mira
  // `basico`, e essa sim É a linha desarmada.
  lut_impacto_misto: [
    { canal: "bonusAcerto", alvo: "corpo", quando: "impacto_misto",
      expr: "2 + (esc_lutador >= 6) + (esc_lutador >= 12) + (esc_lutador >= 18)", duracao: "temporaria" },
    { canal: "danoBonus", alvo: "basico", quando: "impacto_misto",
      expr: "2 + (esc_lutador >= 5) + (esc_lutador >= 10) + (esc_lutador >= 15) + (esc_lutador >= 20)",
      duracao: "temporaria" },
  ],

  // "Quando realizar um teste de resistência de Fortitude ou Reflexos, você
  // pode gastar até 2PE para receber um bônus de +2 para cada PE gasto."
  lut_resistir: [
    { canal: "bonusTR", alvo: "fortitude", quando: "resistir_pe", expr: "2 * resistir_pe", duracao: "temporaria" },
    { canal: "bonusTR", alvo: "reflexos", quando: "resistir_pe", expr: "2 * resistir_pe", duracao: "temporaria" },
  ],

  /* ---- 4° nível ---- */

  // "Enquanto estiver desarmado ou empunhando uma arma marcial, você soma
  // 1 + metade do seu Bônus de Treinamento à sua Defesa."
  lut_defesa_marcial: [
    { canal: "defesa", expr: "1 + piso(maestria / 2)" },
  ],

  // "você recebe +2 em jogadas de ataque corpo a corpo e dano [...] Nos níveis
  // 8, 12, 16 e 20 você pode gastar 2 PE a mais para aumentar o bônus em
  // jogadas de ataque e dano em +1."
  // `brutalidade_pe` é quantos incrementos de 2 PE estão sendo gastos, e o teto
  // por nível já vem aparado do resolveCombate.
  lut_brutalidade: [
    { canal: "bonusAcerto", alvo: "corpo", quando: "brutalidade",
      expr: "2 + brutalidade_pe", duracao: "temporaria" },
    { canal: "danoBonus", quando: "brutalidade",
      expr: "2 + brutalidade_pe", duracao: "temporaria" },
  ],

  // "A cada nível de empolgação que você subir, você recebe +1 em rolagens de
  // dano e, no começo de toda rodada, recebe 4 pontos de vida temporários para
  // cada nível de empolgação acima do primeiro."
  lut_fluxo: [
    { canal: "danoBonus", quando: "empolgacao > 1",
      expr: "empolgacao - 1", duracao: "temporaria" },
    { canal: "pvTemporario", quando: "empolgacao > 1",
      expr: "4 * (empolgacao - 1)", duracao: "temporaria" },
  ],

  // "você pode optar por somar seu Modificador de Força ao invés de Destreza em
  // sua Defesa".
  //
  // ⚠ Era `{ canal: "defesa", expr: "max(0, mod_forca - mod_destreza)" }`, o
  // truque da DIFERENÇA. O número saía certo, mas o detalhamento mentia: o hover
  // mostrava "Destreza +3" e "Músculos Desenvolvidos +2" lado a lado, e lido de
  // cima a baixo aquilo é uma SOMA dos dois atributos. O autor pegou em
  // 2026-08-08. Agora o canal `defesaAtributo` troca a Destreza pela Força na
  // própria fórmula, e a linha da Destreza deixa de existir.
  lut_musculos_desenvolvidos: [
    { canal: "defesaAtributo", alvo: "forca", expr: "1" },
  ],

  // "Ao ver um personagem aliado (Invocações não são consideradas) chegar a 0
  // pontos de vida e cair, você recebe os seguintes benefícios durante uma
  // rodada: seus ataques causam 4 de dano adicional; sua Defesa aumenta em 2;
  // você recebe +2 em TRs de Fortitude e Vontade."
  // "Os benefícios são aplicados apenas contra o inimigo alvo da vingança" é
  // recorte de alvo, e a ficha não tem alvo: na bancada o estado ligado já
  // significa "estou contra o alvo certo".
  lut_furia_da_vinganca: [
    { canal: "danoBonus", quando: "furia_vinganca", expr: "4", duracao: "temporaria" },
    { canal: "defesa", quando: "furia_vinganca", expr: "2", duracao: "temporaria" },
    { canal: "bonusTR", alvo: "fortitude", quando: "furia_vinganca", expr: "2", duracao: "temporaria" },
    { canal: "bonusTR", alvo: "vontade", quando: "furia_vinganca", expr: "2", duracao: "temporaria" },
  ],

  // "Se vencer o combate com a restrição, você recupera uma quantidade de PE
  // igual ao seu nível de personagem; recebe +2 em rolagens de ataque e tem sua
  // margem de crítico reduzida em 1 até o fim da missão atual."
  // Só a RECOMPENSA vira número. As penalidades da restrição são Ferimentos
  // Complexos (p.315), que o sistema não tem, e a recuperação de PE é um evento
  // e não um máximo.
  // ⚠ A recompensa dura "até o fim da missão", ou seja, vale FORA de combate
  // também. Aqui ela mora na bancada mesmo assim, porque é onde os estados
  // ligam, e `ativo: false` zera tudo por definição.
  lut_imprudencia_motivadora: [
    { canal: "bonusAcerto", quando: "imprudencia_motivadora", expr: "2", duracao: "temporaria" },
    { canal: "margemCritico", quando: "imprudencia_motivadora", expr: "1", duracao: "temporaria" },
  ],

  // "Enquanto estiver com menos da metade dos seus pontos de vida máximos,
  // sempre que começar seu turno, você recupera 1d6 + seu modificador de
  // Constituição em pontos de vida. [...] Nos níveis 8, 12, 16 e 20, a cura
  // aumenta em 1d6."
  // Os dados vão inteiros no canal próprio em vez de virar média: é cura por
  // turno, o número que mais pesa no balanceamento de nível alto.
  lut_sobrevivente: [
    { canal: "regeneracaoDados", quando: "machucado",
      expr: "1 + (esc_lutador >= 8) + (esc_lutador >= 12) + (esc_lutador >= 16) + (esc_lutador >= 20)",
      duracao: "temporaria" },
    { canal: "regeneracaoFixa", quando: "machucado", expr: "mod_constituicao", duracao: "temporaria" },
  ],

  // "Você pode, como uma Ação Bônus, realizar uma rolagem do seu dano desarmado
  // e se curar nesse valor. Esta habilidade pode ser usada uma quantidade de
  // vezes igual ao seu bônus de treinamento."
  // A linha ESPELHA o Ataque Básico e por isso não recebe canal de cura nenhum
  // (ver o cabeçalho de afty-cura.js). Só os usos são dela.
  lut_puxar_um_ar: [
    { canal: "curaUsos", alvo: "cura_puxar_um_ar", expr: "maestria" },
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

  // "Enquanto no estado de Brutalidade [...] você aumenta o nível de dano dos
  // seus ataques corpo a corpo em 1, acumulando até um limite igual ao seu
  // bônus de treinamento."
  // ⚠ Sem alvo, então vale para TODAS as linhas de dano. O texto diz "corpo a
  // corpo", e não há como mirar só as linhas corpo a corpo hoje: um Lutador com
  // arma a distância receberia o aumento nela também.
  lut_brutalidade_sanguinaria: [
    { canal: "nivelDano", quando: "brutalidade",
      expr: "brutalidade_pilha", duracao: "temporaria" },
  ],

  // "Você recebe redução de danos contra todos os tipos, menos alma, igual ao
  // seu nível de empolgação atual. Contra danos físicos, a redução de dano é
  // dobrada."
  // A RD Física SOMA com a RD Geral, então o mesmo valor nos dois canais é o
  // que dá o dobro contra físico.
  lut_ignorar_dor: [
    { canal: "rdGeral", quando: "empolgacao > 0", expr: "empolgacao", duracao: "temporaria" },
    { canal: "rdFisico", quando: "empolgacao > 0", expr: "empolgacao", duracao: "temporaria" },
  ],

  // "O dano de seus ataques desarmados aumenta em 2 níveis." A Manobra que ela
  // também concede é procedimento de mesa.
  lut_poder_corporal: [
    { canal: "nivelDano", alvo: "basico", expr: "2" },
  ],

  // "quando Empurrar um inimigo, a distância padrão se torna 4,5 metros ao
  // invés de 1,5 metros." O dano de impacto ao Derrubar é rolagem (2d6 + mod
  // de Força), e não valor de ficha.
  lut_potencia_superior: [
    { canal: "distanciaEmpurrao", expr: "3" },
  ],

  // "Sempre que um inimigo ao qual você causou dano cair ou morrer dentro de 9
  // metros, você recebe 2d6 + nível de personagem + modificador de
  // atributo-chave em PV temporários, os quais acumulam. No nível 8, o valor
  // aumenta para 3d6, no nível 12 aumenta para 4d6, no nível 16 aumenta para
  // 4d8 e no nível 20 aumenta para 4d12."
  // A parcela de dado entra pela MÉDIA, arredondada para baixo: 2d6 = 7, 3d6 =
  // 10, 4d6 = 14, 4d8 = 18, 4d12 = 26. Como cada degrau SUBSTITUI o anterior,
  // a soma de booleanos leva a diferença de um para o outro (+3, +4, +4, +8).
  // ⚠ ASSUMIDO: "atributo-chave" == o Atributo da Técnica da ficha, mesma
  // leitura de lut_brutalidade_aprimorada.
  lut_eliminar_e_continuar: [
    { canal: "pvTemporario", quando: "abates",
      expr: "abates * (7 + 3 * (esc_lutador >= 8) + 4 * (esc_lutador >= 12) + 4 * (esc_lutador >= 16) "
          + "+ 8 * (esc_lutador >= 20) + nd + mod_tecnica)",
      duracao: "temporaria" },
  ],

  // As três manobras que a habilidade libera. Todas exigem estar no nível 5 de
  // empolgação ("Para realizar uma manobra finalizadora, é necessário estar com
  // nível de empolgação 5"), daí o `&&` no `quando`.
  //
  //   • Ataque Circular: "Para cada inimigo que seja um alvo, esta manobra
  //     causa 5 de dano adicional." O aumento de 3 metros no alcance corpo a
  //     corpo não tem canal: alcance de ataque vem da arma.
  //   • Golpe Certeiro: "Sua próxima jogada de ataque automaticamente tem o seu
  //     resultado tratado como 10 acima do resultado original."
  //   • Quebra Crânio: "Seu próximo ataque causa 2d10 de dano adicional. O alvo
  //     desta manobra deve realizar um teste de resistência de Fortitude com CD
  //     aumentada em 5." 2d10 pela média, que é 11 exato.
  lut_manobras_finalizadoras: [
    { canal: "danoBonus", quando: "manobra_finalizadora_circular && empolgacao >= 5",
      expr: "5", duracao: "temporaria" },
    { canal: "bonusAcerto", quando: "manobra_finalizadora_certeiro && empolgacao >= 5",
      expr: "10", duracao: "temporaria" },
    { canal: "danoBonus", quando: "manobra_finalizadora_cranio && empolgacao >= 5",
      expr: "11", duracao: "temporaria" },
    { canal: "cd", quando: "manobra_finalizadora_cranio && empolgacao >= 5",
      expr: "5", duracao: "temporaria" },
  ],

  /* ---- 8° nível ---- */

  // "Enquanto estiver desarmado, sua margem de crítico diminui em 1 e seus
  // ataques ignoram RD igual ao seu bônus de treinamento."
  lut_punhos_letais: [
    { canal: "margemCritico", alvo: "basico", expr: "1" },
    { canal: "ignoraRD", alvo: "basico", expr: "maestria" },
  ],

  // "Ao entrar no estado de brutalidade, você recebe uma quantidade de pontos
  // de vida temporários igual ao seu nível + modificador do atributo para CD de
  // Especialização. O bônus inicial em dano se torna +4 e o aumento no dano por
  // ponto de energia adicional gasto se torna +2."
  // O bônus em dano entra como DELTA por cima da Brutalidade: +2 na entrada
  // (2 → 4) e +1 por incremento (1 → 2). Assim as duas se compõem sem uma
  // precisar saber da outra.
  // ⚠ ASSUMIDO: "atributo para CD de Especialização" == o Atributo da Técnica
  // da ficha, que é o que alimenta a CD.
  lut_brutalidade_aprimorada: [
    { canal: "danoBonus", quando: "brutalidade",
      expr: "2 + brutalidade_pe", duracao: "temporaria" },
    { canal: "pvTemporario", quando: "brutalidade",
      expr: "nd + mod_tecnica", duracao: "temporaria" },
  ],

  // "Uma vez por cena, caso você fosse ter os seus pontos de vida reduzidos a 0,
  // você pode escolher retornar ao nível de empolgação 1 para continuar de pé,
  // curando-se em um valor igual a uma rolagem de dano do seu ataque desarmado."
  // ESPELHA o Ataque Básico, igual ao Puxar um Ar. O preço (voltar à Empolgação
  // 1 e perder um nível máximo) já é o estado `insistenciaUsada` da bancada.
  lut_insistencia: [
    { canal: "curaUsos", alvo: "cura_insistencia", expr: "1" },
  ],

  /* ---- 12° nível ---- */

  // "Seu Deslocamento aumenta em 3 metros."
  lut_seja_agua: [
    { canal: "movimento", expr: "3" },
  ],

  // "Os seus dados de empolgação se tornam 2d4, 2d6, 2d8 e 3d6,
  // respectivamente." Troca a TABELA inteira, então é sinalizador e não soma.
  lut_empolgacao_maxima: [
    { canal: "empolgacaoMaxima", expr: "1" },
  ],

  // "Enquanto estiver empunhando uma Arma Dedicada, você pode gastar 2PE para
  // receber os seguintes bônus por uma rodada: você escolhe aumentar sua Defesa
  // em 3 ou receber +3 em Jogadas de Ataque."
  // É um OU exclusivo, então o estado da bancada é do tipo `opcao` e cada lado
  // lê a sua booleana. A rolagem repetida ao errar é procedimento de mesa.
  lut_armas_absolutas: [
    { canal: "defesa", quando: "armas_absolutas_defesa", expr: "3", duracao: "temporaria" },
    { canal: "bonusAcerto", quando: "armas_absolutas_acerto", expr: "3", duracao: "temporaria" },
  ],

  /* ---- 20° nível (base) ---- */

  // "Seus ataques desarmados causam 1 dado de dano adicional. [...] Além disso,
  // você inicia todo combate com um Nível de Empolgação a mais."
  // O dado é DADO mesmo, não Nível de Dano (autor, 2026-07-27). O ataque de
  // graça por 2 PE fica de fora, que é economia de ação.
  lut_lutador_superior: [
    { canal: "dadosDano", alvo: "basico", expr: "1" },
    { canal: "empolgacaoInicial", expr: "1" },
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
  // ⚠ A RD Física SOMA com a RD Geral, então o canal físico leva só a
  // DIFERENÇA: `nd/4` na geral mais `nd/2 − nd/4` na física dá exatamente
  // `nd/2` contra físico e `nd/4` contra o resto, que é o que o texto pede.
  // (Corrigido em 2026-07-28: antes a física levava `nd/2` cheio, o que dava
  // `3nd/4` contra físico. Ignorar Dor, que diz "dobrada", confirmou a leitura
  // aditiva.)
  lut_corpo_supremo: [
    { canal: "movimento", expr: "3" },
    { canal: "defesa", expr: "4" },
    { canal: "rdGeral", expr: "piso(nd / 4)" },
    { canal: "rdFisico", expr: "piso(nd / 2) - piso(nd / 4)" },
  ],

  /* ================= COMBATENTE ================= */
  /* A especialização é escrita em cima de CLASSES DE ARMA, e não de armas
     nomeadas, então quase tudo aqui usa os escopos de alvo (`cat:arremesso`,
     `grupo:espada`, `prop:pesada`, `arma`). Ver escoposDaArma em afty-efeitos.js.

     `esc_combatente` é o nível de escalonamento da classe, igual ao Lutador. */

  /* ---- Base ---- */

  // "Você recebe uma quantidade de Pontos de Preparo igual ao seu nível de
  // Especialista em Combate + Modificador de Sabedoria."
  // As 5 artes que a habilidade ensina são gasto de ponto: só Execução
  // Silenciosa e Golpe Descendente viram número, e entram pela bancada.
  cmb_artes_do_combate: [
    { canal: "pontosPreparo", expr: "esc_combatente + mod_sabedoria" },
    // "adicionando 1d6 de dano. A cada +2 no Modificador de Sabedoria, o dano
    // aumenta em +1d6." O 1d6 base já vale com Sabedoria 0.
    // O dado é NOMEADO (d6), então entra pela média (3), e não como dado da
    // linha, que muda de tamanho com o Patamar. Ver a regra no topo.
    { canal: "danoBonus", quando: "arte_execucao_silenciosa",
      expr: "3 * (1 + piso(mod_sabedoria / 2))", duracao: "temporaria" },
    // "sua Defesa aumenta em um valor igual a metade do seu Modificador de
    // Sabedoria até o começo do seu próximo turno."
    { canal: "defesa", quando: "arte_golpe_descendente",
      expr: "piso(mod_sabedoria / 2)", duracao: "temporaria" },
  ],

  // Golpe Especial: só as propriedades que viram número. Amplo (alvo a mais),
  // Impactante (empurrão por dano causado), Longo (alcance), Preciso
  // (vantagem), Sanguinário (condição) e Lento (ação) não têm canal.
  // ⚠ O CUSTO em PE de cada propriedade não é somado em lugar nenhum: montar o
  // custo total do ataque especial seria uma calculadora à parte.
  cmb_golpe_especial: [
    // "Atroz. Em um acerto, o ataque causa 1 dado de dano adicional."
    { canal: "dadosDano", quando: "golpe_atroz", expr: "1", duracao: "temporaria" },
    // "Letal. Diminui em 1 a margem de crítico do ataque."
    { canal: "margemCritico", quando: "golpe_letal", expr: "1", duracao: "temporaria" },
    // "Penetrante. Ignora redução a dano em um valor igual a metade do seu
    // nível de personagem."
    { canal: "ignoraRD", quando: "golpe_penetrante", expr: "piso(nd / 2)", duracao: "temporaria" },
    // "Desfocado. O ataque recebe uma penalidade de 4 no acerto (cumulativo até
    // três vezes)."
    { canal: "bonusAcerto", quando: "golpe_desfocado",
      expr: "-4 * golpe_desfocado", duracao: "temporaria" },
  ],

  // "+2 na CD [...] Esse bônus aumenta em 1 nos níveis 8° e 16°." Mesmo texto
  // do Implemento Marcial do Lutador.
  cmb_implemento_marcial: [
    { canal: "cd", expr: "2 + (esc_combatente >= 8) + (esc_combatente >= 16)" },
  ],

  // "todos seus ataques causam um dado de dano adicional, do mesmo tipo da arma
  // manuseada." Sem alvo: vale para todas as linhas. Os 3 PE temporários por
  // Golpe Especial são recurso por uso, não máximo.
  cmb_autossuficiente: [
    { canal: "dadosDano", expr: "1" },
  ],

  /* ---- 2° nível ---- */

  // "Seus ataques com armas de arremesso contam como um nível de dano acima.
  // Além disso, no começo do seu turno, você pode gastar 1PE para fazer com que
  // seus ataques com armas de arremesso ignorem RD igual ao seu bônus de
  // treinamento."
  cmb_arremessos_potentes: [
    { canal: "nivelDano", alvo: "cat:arremesso", expr: "1" },
    { canal: "ignoraRD", alvo: "cat:arremesso", quando: "arremessos_potentes",
      expr: "maestria", duracao: "temporaria" },
  ],

  // "Ao realizar um golpe com um grupo de armas e trocar para outra arma de
  // outro grupo na mesma rodada ou na próxima, você recebe +1d até o fim do seu
  // próximo turno com a arma trocada."
  cmb_arsenal_ciclico: [
    { canal: "dadosDano", quando: "arsenal_ciclico", expr: "1", duracao: "temporaria" },
  ],

  // "Uma quantidade de vezes igual ao seu bônus de treinamento você pode usar
  // sua ação bônus para se curar em um valor igual a 1d10 + o dobro do seu
  // modificador de Constituição + bônus de treinamento, aumentando em um dado a
  // cada 4 níveis."
  // ⚠ ASSUMIDO: "a cada 4 níveis" é o nível de COMBATENTE, como no resto da
  // especialização, que usa `esc_combatente` em toda escada.
  cmb_revigorar: [
    { canal: "curaDados", alvo: "cura_revigorar", expr: "1 + piso(esc_combatente / 4)" },
    { canal: "curaFaces", alvo: "cura_revigorar", expr: "10" },
    { canal: "curaFixa",  alvo: "cura_revigorar", expr: "dobro(mod_constituicao) + maestria" },
    { canal: "curaUsos",  alvo: "cura_revigorar", expr: "maestria" },
  ],

  // "Seu alcance em ataques com armas corpo a corpo aumenta em 1,5 metros e
  // você recebe um bônus de +2 em jogadas de ataque e em testes para evitar ser
  // desarmado." O alcance não tem canal.
  cmb_extensao_do_corpo: [
    { canal: "bonusAcerto", alvo: "corpo", expr: "2" },
    { canal: "resistirManobra", alvo: "desarmar", expr: "2" },
  ],

  // "Sempre que você estiver usando uma arma com a qual você seja treinado o
  // dano dela aumenta em um nível e suas rolagens de dano recebem um bônus
  // de +2."
  // ⚠ ASSUMIDO: vale para toda ARMA (alvo `arma`, que exclui o Ataque Básico).
  // Treino em arma não existe como escolha na ficha, então não há o que checar.
  cmb_golpes_potentes: [
    { canal: "nivelDano", alvo: "arma", expr: "1" },
    { canal: "danoBonus", alvo: "arma", expr: "2" },
  ],

  // "antes da jogada de ataque, você pode escolher aumentar a margem de
  // Emperrar em 2 e, em troca, você causa 1 dado de dano adicional caso acerte."
  // Com Pistoleiro Avançado (8°) vai até 6, "causando 1 dado de dano adicional
  // para cada outros 2 que aumentar", ou seja, 1 dado por 2 de Emperrar.
  // O grupo `tiro` é o das armas de fogo (Pistola, Bazuca...).
  cmb_pistoleiro_iniciado: [
    { canal: "dadosDano", alvo: "grupo:tiro", quando: "pistoleiro_emperrar",
      expr: "piso(pistoleiro_emperrar / 2)", duracao: "temporaria" },
  ],

  // "gastar 1 ponto de energia amaldiçoada para receber +2 na rolagem para
  // acertar. A cada quatro níveis, você pode gastar 1 ponto a mais para
  // aumentar o bônus em +2. Você também pode optar por adicionar esse bônus na
  // rolagem de dano ao invés da de acerto, com um bônus de +4 ao invés de +2."
  cmb_precisao_definitiva: [
    { canal: "bonusAcerto", quando: "precisao_pe && precisao_modo_acerto",
      expr: "2 * precisao_pe", duracao: "temporaria" },
    { canal: "danoBonus", quando: "precisao_pe && precisao_modo_dano",
      expr: "4 * precisao_pe", duracao: "temporaria" },
  ],

  // "Você recebe um bônus de +2 em rolagens de Furtividade." A redução da
  // penalidade por ação chamativa é procedimento de mesa.
  cmb_presenca_suprimida: [
    { canal: "bonusPericia", alvo: "furtividade", expr: "2" },
  ],

  /* ---- 4° nível ---- */

  // "Você passa a somar o aumento base em RD do seu escudo em testes de
  // resistência de Reflexos e Fortitude." `rd_escudo` é só a parcela do escudo,
  // sem o que a Ferramenta Amaldiçoada soma.
  cmb_especialista_em_escudo: [
    { canal: "bonusTR", alvo: "reflexos", expr: "rd_escudo" },
    { canal: "bonusTR", alvo: "fortitude", expr: "rd_escudo" },
  ],

  // "gastar 1PE para receber um bônus de +2 em jogadas de ataque até o fim da
  // cena. Além disso, você ganha PV temporários igual ao seu nível."
  // Espírito Incansável (8°) troca por 2PE: bônus +5 e os PV temporários viram
  // "o seu bônus de ataque". O delta entra na entrada do Incansável.
  cmb_espirito_de_luta: [
    { canal: "bonusAcerto", quando: "espirito_de_luta", expr: "2", duracao: "temporaria" },
    { canal: "pvTemporario", quando: "espirito_de_luta", expr: "nd", duracao: "temporaria" },
  ],

  // "Você passa a somar metade do seu modificador de Sabedoria na sua Defesa,
  // limitado pelo seu nível." O TR de +2 vem da escolha aninhada.
  cmb_guarda_estudada: [
    { canal: "defesa", expr: "min(piso(mod_sabedoria / 2), nd)" },
  ],

  // "Você passa a adicionar também o seu bônus de sabedoria em rolagens de
  // Furtividade."
  cmb_mente_oculta: [
    { canal: "bonusPericia", alvo: "furtividade", expr: "mod_sabedoria" },
  ],

  /* ---- 6° nível ---- */

  // "Você passa a somar metade do modificador do seu atributo chave em sua CD
  // de Especialização." O atributo-chave da ficha é o Atributo da Técnica.
  cmb_aprimoramento_especializado: [
    { canal: "cd", expr: "piso(mod_tecnica / 2)" },
  ],

  // "A margem do seu acerto crítico reduz em um número." Sem alvo: todas as
  // linhas.
  cmb_critico_melhorado: [
    { canal: "margemCritico", expr: "1" },
  ],

  /* ---- 8° nível ---- */

  // "aumentando o bônus em ataques para +5 e fazendo com que os pontos de vida
  // temporários ganhos se tornam o seu bônus de ataque, ao invés do Nível do
  // Personagem, já considerando o bônus da habilidade."
  // Entra como DELTA por cima do Espírito de Luta: +3 no acerto (2 → 5), e os
  // PV temporários trocam `nd` por `acerto`, daí o `- nd`.
  // ⚠ ASSUMIDO: "o seu bônus de ataque" é o bônus da jogada Corpo a Corpo já
  // com os +5 dentro. `acerto` não está no contexto (ver VARS_ADIADAS), então
  // aqui ele é remontado: INT(nd / 1,5) + maestria + mod de Força + 5.
  cmb_espirito_incansavel: [
    { canal: "bonusAcerto", quando: "espirito_incansavel", expr: "3", duracao: "temporaria" },
    { canal: "pvTemporario", quando: "espirito_incansavel",
      expr: "piso(nd / 1.5) + maestria + mod_forca + 5 - nd", duracao: "temporaria" },
  ],

  /* ---- 10° nível ---- */

  /* ---- 12° nível ---- */

  // "sempre que trocar para outra arma de outro grupo durante seu turno, você
  // recebe um bônus de +2 na próxima jogada de ataque que realizar." Reaproveita
  // o mesmo gatilho do Arsenal Cíclico, que é a troca de grupo.
  cmb_ciclagem_absoluta: [
    { canal: "bonusAcerto", quando: "arsenal_ciclico", expr: "2", duracao: "temporaria" },
  ],

  // "sua margem de crítico com armas de fogo aumenta em 1."
  // ⚠ LEITURA: "aumenta" aqui é a FAIXA de crítico aumentando (20 vira 19-20),
  // que é melhora. Todo o resto do sistema escreve melhora como "a margem
  // reduz", então o canal recebe 1 de redução. A confirmar com o autor.
  cmb_mestre_pistoleiro: [
    { canal: "margemCritico", alvo: "grupo:tiro", expr: "1" },
  ],

  /* ---- 16° nível ---- */

  // "A margem do seu acerto crítico reduz em dois números, ao invés de um."
  // SUBSTITUI o Crítico Melhorado (6°), que é pré-requisito, então o que entra
  // aqui é o degrau de 1 para 2.
  cmb_critico_aperfeicoado: [
    { canal: "margemCritico", expr: "1" },
  ],

  /* ================= RESTRINGIDO ================= */
  /* O Restringido não tem energia amaldiçoada: ele chama o recurso de ESTAMINA
     (ou vigor), e quase toda habilidade ativa gasta dela. É a MESMA pilha dos
     outros Tipos, o PE (autor, 2026-07-29), então tudo que mexe nela usa o canal
     `pe`. `esc_restringido` é o nível de escalonamento da classe. */

  /* ---- Base ---- */

  // "Você pode escolher adicionar também seu modificador de Força ou de
  // Constituição na sua Defesa, limitado pelo seu nível." O "ou" é escolha
  // livre e sem custo, então vale o maior (mesmo critério de Int ou Sabedoria).
  // "Você inicia com 4 pontos de estamina, e recebe mais 4 a cada nível."
  // NÃO entra como efeito: 4 × ND é exatamente a base de PE do Tipo Restringido
  // no deriveAfty, e Estamina é o próprio PE. Somar aqui daria a pilha dobrada.
  // A ferramenta de quarto grau e o meio de ver maldições são equipamento, e as
  // Dádivas saem pela escolha aninhada.
  res_restrito_pelos_ceus: [
    { canal: "defesa", expr: "min(max(mod_forca, mod_constituicao), nd)" },
  ],

  // "você pode adicionar 1d8 ao dano dele [...] No nível 3, o dano se torna
  // 2d8, no 6 3d8, no 9 4d8, no 12 5d8, no 15 6d8."
  // ⚠ O dado é NOMEADO (d8), e não "um dado de dano", então entra pela média
  // arredondada para baixo (1d8 = 4) e não pelo dado da linha, que muda com o
  // Patamar. Arremetida Encoberta soma o dela por cima.
  res_ataque_furtivo: [
    { canal: "danoBonus", quando: "ataque_furtivo",
      expr: "4 * (1 + (esc_restringido >= 3) + (esc_restringido >= 6) + (esc_restringido >= 9) "
          + "+ (esc_restringido >= 12) + (esc_restringido >= 15))",
      duracao: "temporaria" },
  ],

  // "Você recebe +1 em todas as perícias. No 10° nível esse bônus se torna +2."
  res_versatilidade: [
    { canal: "bonusPericia", expr: "1 + (esc_restringido >= 10)" },
  ],

  // "+1 em sua Defesa e em rolagens de Reflexos. No nível 9 e no nível 16, esse
  // bônus aumenta em +1. Além disso, a partir do 10° nível, o valor necessário
  // para obter um sucesso crítico nela reduz em um valor igual a metade do seu
  // bônus de treinamento."
  res_esquiva_sobre_humana: [
    { canal: "defesa", expr: "1 + (esc_restringido >= 9) + (esc_restringido >= 16)" },
    { canal: "bonusTR", alvo: "reflexos",
      expr: "1 + (esc_restringido >= 9) + (esc_restringido >= 16)" },
    { canal: "margemCriticoTR", alvo: "reflexos",
      expr: "piso(maestria / 2) * (esc_restringido >= 10)" },
  ],

  // "+2 na CD [...] Esse bônus aumenta em 1 nos níveis 8° e 16°."
  res_implemento_celeste: [
    { canal: "cd", expr: "2 + (esc_restringido >= 8) + (esc_restringido >= 16)" },
  ],

  // "Toda arma que você manejar conta como um nível de dano acima e seu valor
  // de deslocamento aumenta em 3 metros."
  // A vantagem em furtividade contra feiticeiros, o traçado da alma e a imunidade
  // a expansões de domínio não são número.
  // ⚠ FICOU DE FORA: "Se for mestre em uma perícia ou teste de resistência que
  // utilize Força, Destreza ou Constituição você soma seu bônus de treinamento
  // inteiro ao invés de metade dele." Mestre hoje soma `maestria + metade`, e
  // o que o texto pede é `maestria + maestria`. Só valeria onde a ficha marcou
  // Mestre, e isso pede uma entrada por perícia com `quando: prof_X == 2`.
  res_restricao_definitiva: [
    { canal: "nivelDano", alvo: "arma", expr: "1" },
    { canal: "movimento", expr: "3" },
  ],

  // "Você também recebe +5 em rolagens de ataque e soma metade do seu nível de
  // personagem no total de dano."
  // ⚠ A "resistência a todo tipo de dano físico" ficou de fora: o texto não dá
  // valor, então é a palavra-chave Resistência (meio dano) e não Redução de
  // Dano. Não existe canal para isso. A confirmar com o autor.
  res_libertacao_do_destino: [
    { canal: "bonusAcerto", expr: "5" },
    { canal: "danoBonus", expr: "piso(nd / 2)" },
  ],

  /* ---- 2° nível ---- */

  // Mesmo texto do Ataque Inconsequente do Lutador, e mesma linha na bancada.
  res_ataque_inconsequente: [
    { canal: "danoBonus", quando: "ataque_inconsequente", expr: "5", duracao: "temporaria" },
  ],

  // "+3 em testes para Desarmar ou evitar ser desarmado."
  res_apropriar_se: [
    { canal: "bonusManobra", alvo: "desarmar", expr: "3" },
    { canal: "resistirManobra", alvo: "desarmar", expr: "3" },
  ],

  // "Você recebe um bônus de +2 em rolagens de Furtividade."
  res_existencia_imperceptivel: [
    { canal: "bonusPericia", alvo: "furtividade", expr: "2" },
  ],

  // "Caso tenha sucesso em empurrar, ele recebe Xd6 de dano adicional, onde X é
  // igual a metade do seu modificador de Força." 1d6 = 3 de média.
  res_golpe_impactante: [
    { canal: "danoBonus", quando: "golpe_impactante",
      expr: "3 * piso(mod_forca / 2)", duracao: "temporaria" },
  ],

  // "O dano de toda arma que você manejar conta como um nível acima e suas
  // rolagens de dano recebem um bônus igual ao seu bônus de treinamento."
  res_manejo_superior: [
    { canal: "nivelDano", alvo: "arma", expr: "1" },
    { canal: "danoBonus", alvo: "arma", expr: "maestria" },
  ],

  // "você recebe redução de dano a todos os tipos de dano igual a metade do seu
  // nível de personagem, você recebe um bônus igual a 1 + metade do seu bônus
  // de treinamento em testes de resistência de fortitude e reflexos, e você
  // recebe um bônus em percepção igual ao seu bônus de treinamento."
  res_surto_de_adrenalina: [
    { canal: "rdGeral", quando: "surto_adrenalina", expr: "piso(nd / 2)", duracao: "temporaria" },
    { canal: "bonusTR", alvo: "fortitude", quando: "surto_adrenalina",
      expr: "1 + piso(maestria / 2)", duracao: "temporaria" },
    { canal: "bonusTR", alvo: "reflexos", quando: "surto_adrenalina",
      expr: "1 + piso(maestria / 2)", duracao: "temporaria" },
    { canal: "bonusPericia", alvo: "percepcao", quando: "surto_adrenalina",
      expr: "maestria", duracao: "temporaria" },
  ],

  /* ---- 4° nível ---- */

  // "distribuir um bônus de +4 entre as perícias de Atletismo e Acrobacia [...]
  // Ao obter a Restrição Definitiva, o bônus de +4 se torna +8."
  // A faixa da bancada é quanto foi para Atletismo, e o resto vai para Acrobacia.
  res_adrenalina_intensificadora: [
    { canal: "bonusPericia", alvo: "atletismo", quando: "adrenalina_atletismo",
      expr: "adrenalina_atletismo", duracao: "temporaria" },
    { canal: "bonusPericia", alvo: "acrobacia", quando: "surto_adrenalina",
      expr: "4 + 4 * tem_res_restricao_definitiva - adrenalina_atletismo", duracao: "temporaria" },
  ],

  // "gastar 2 pontos de estamina para receber 2 de RD, +1 em testes de
  // resistência e ataques, além de causar +1d6 de dano contra todos os
  // feiticeiros presentes na cena. A cada 5 níveis você pode gastar mais 2
  // pontos para aumentar os bônus."
  // A faixa conta PARES de ponto, e cada par rende a leva inteira. 1d6 = 3.
  res_cacador_de_feiticeiros: [
    { canal: "rdGeral", quando: "cacador_feiticeiros",
      expr: "2 * cacador_feiticeiros", duracao: "temporaria" },
    { canal: "bonusTR", quando: "cacador_feiticeiros",
      expr: "cacador_feiticeiros", duracao: "temporaria" },
    { canal: "bonusAcerto", quando: "cacador_feiticeiros",
      expr: "cacador_feiticeiros", duracao: "temporaria" },
    { canal: "danoBonus", quando: "cacador_feiticeiros",
      expr: "3 * cacador_feiticeiros", duracao: "temporaria" },
  ],

  // "Ao atacar o inimigo que é seu foco você recebe um bônus de +2 para acertar
  // e causa 1d6 de dano a mais, que aumenta para 1d8 no nível 6, 1d10 no 12 e
  // 1d12 no 16, além de receber +5 em testes de Percepção para procurar o
  // inimigo e em sua Atenção contra ele."
  // Os dados são nomeados, então entram pela média: 3, 4, 5, 6. Cada degrau
  // SUBSTITUI o anterior, daí a soma de +1 por degrau.
  res_foco_no_inimigo: [
    { canal: "bonusAcerto", quando: "foco_inimigo", expr: "2", duracao: "temporaria" },
    { canal: "danoBonus", quando: "foco_inimigo",
      expr: "3 + (esc_restringido >= 6) + (esc_restringido >= 12) + (esc_restringido >= 16)",
      duracao: "temporaria" },
    { canal: "bonusPericia", alvo: "percepcao", quando: "foco_inimigo", expr: "5", duracao: "temporaria" },
    { canal: "atencao", quando: "foco_inimigo", expr: "5", duracao: "temporaria" },
  ],

  // "você pode pagar 1 ponto de estamina para adicionar 2d3 ao resultado."
  // 2d3 = 4 de média. Vale em qualquer TR, e só durante o Surto.
  res_resiliencia_pela_adrenalina: [
    { canal: "bonusTR", quando: "surto_adrenalina", expr: "4", duracao: "temporaria" },
  ],

  /* ---- 6° nível ---- */

  // "Você passa a somar metade do modificador do seu atributo chave em sua CD."
  res_aprimoramento_celeste: [
    { canal: "cd", expr: "piso(mod_tecnica / 2)" },
  ],

  // "O bônus em dano ao usar o ataque inconsequente aumenta para +10 e, ao
  // utilizar a habilidade, você recebe 2d6+4 pontos de vida temporária."
  // Delta por cima do Ataque Inconsequente: +5 (5 → 10). 2d6+4 = 11.
  res_ataque_inconsequente_aprimorado: [
    { canal: "danoBonus", quando: "ataque_inconsequente", expr: "5", duracao: "temporaria" },
    { canal: "pvTemporario", quando: "ataque_inconsequente", expr: "11", duracao: "temporaria" },
  ],

  // "Seus pontos de vida máximos aumentam em um valor igual ao seu valor de
  // Constituição" — o VALOR, não o modificador.
  // "se curar em um valor igual a 2d8 + seu modificador de constituição no
  // começo de todo turno seu. No nível 10, você pode pagar 1 ponto adicional
  // para aumentar a cura em 1d8, assim como pode pagar mais 1 no nível 15."
  // A faixa da bancada é quantos pontos estão sendo gastos: 1 ativa (2d8), e
  // cada ponto além soma 1d8.
  res_corpo_de_aco: [
    { canal: "hp", expr: "constituicao" },
    { canal: "regeneracaoDados", quando: "corpo_de_aco",
      expr: "1 + corpo_de_aco", duracao: "temporaria" },
    { canal: "regeneracaoFaces", quando: "corpo_de_aco", expr: "8", duracao: "temporaria" },
    { canal: "regeneracaoFixa", quando: "corpo_de_aco", expr: "mod_constituicao", duracao: "temporaria" },
  ],

  // "sempre que realizar um ataque, ele causa +4 de dano adicional. No 12°
  // nível, esse bônus se torna +8, no 16° nível ele se torna +12."
  res_frenesi: [
    { canal: "danoBonus", quando: "surto_adrenalina",
      expr: "4 + 4 * (esc_restringido >= 12) + 4 * (esc_restringido >= 16)", duracao: "temporaria" },
  ],

  /* ---- 8° nível ---- */

  // "Uma vez por descanso curto ou longo, quando você for chegar a 0 pontos de
  // vida e cair você pode escolher se manter de pé e curar em 3d10 + nível de
  // personagem, aumentando em +1d10 nos níveis 12, 16 e 20."
  // ⚠ "Nível de personagem" aqui é o ND, e não o nível de Restringido: o texto
  // diz personagem com todas as letras, ao contrário das irmãs dele.
  res_ainda_de_pe: [
    { canal: "curaDados", alvo: "cura_ainda_de_pe", expr: "3 + (nd >= 12) + (nd >= 16) + (nd >= 20)" },
    { canal: "curaFaces", alvo: "cura_ainda_de_pe", expr: "10" },
    { canal: "curaFixa",  alvo: "cura_ainda_de_pe", expr: "nd" },
    { canal: "curaUsos",  alvo: "cura_ainda_de_pe", expr: "1" },
  ],

  // "Ao realizar o Ataque Furtivo da rodada, você recebe vantagem no golpe.
  // Caso o acerto dele já tenha sido garantido por qualquer motivo, você recebe
  // +1d no dano do Ataque Furtivo."
  // "+1d" sem tamanho: aqui é dado da LINHA mesmo, e não média.
  res_arremetida_encoberta: [
    { canal: "dadosDano", quando: "furtivo_garantido", expr: "1", duracao: "temporaria" },
  ],

  /* ---- 12° nível ---- */

  // "o seu ataque extra passa a custar 1 PE, você recebe +3 metros de
  // Deslocamento e a sua DEF aumenta em 2."
  res_adrenalina_absoluta: [
    { canal: "movimento", quando: "adrenalina_absoluta", expr: "3", duracao: "temporaria" },
    { canal: "defesa", quando: "adrenalina_absoluta", expr: "2", duracao: "temporaria" },
  ],

  // "Você recebe +4 pontos de estamina máximos." Os dois atributos saem pela
  // escolha aninhada.
  res_pinaculo_fisico: [
    { canal: "pe", expr: "4" },
  ],

  /* ---- 16° nível ---- */

  // "Caso ele seja um acerto garantido, além do efeito normal, a sua margem de
  // crítico é reduzida em 2." A vantagem acumulada não é número.
  res_entre_as_sombras: [
    { canal: "margemCritico", quando: "furtivo_garantido", expr: "2", duracao: "temporaria" },
  ],

  /* ============================================================ */
  /* CONJURADOR (Especialista em Técnicas)                         */
  /* ============================================================ */
  /* ⚠ FRENTE ABERTA, e é ela que explica a proporção baixa aqui: o Conjurador
     é a classe cujos poderes quase todos mexem em FEITIÇO (dano por nível de
     feitiço, custo em PE, nível de acesso, alcance, área, liberações), e o
     motor de Feitiços (afty-feiticos.js) NÃO lê o Motor de Automação. Ele
     recebe os parâmetros da criação de cada feitiço e mais nada.

     A exceção que já funciona é a **CD**: `feiticos.cdBase` É a CD da criatura,
     que já soma o canal `cd`. Então Reforço Amaldiçoado, Feitiços Refinados,
     O Honrado e o Foco de Refino chegam ao feitiço sozinhos.

     Ligar o resto pede passar `efeitos` para o resolveFeitico e abrir canais de
     feitiço (dano, custo, nível de acesso). É extensão de motor, não texto
     solto, e está anotada para o autor decidir. */

  // "Sua CD de Especialização e Amaldiçoada aumenta em +2. No nível 10, esse
  // aumento se torna +3 e no nível 20, se torna +4."
  cnj_reforco_amaldicoado: [
    { canal: "cd", expr: "2 + (esc_conjurador >= 10) + (esc_conjurador >= 20)" },
  ],

  // "Você passa a adicionar seu modificador de Inteligência ou Sabedoria no seu
  // bônus de iniciativa."
  cnj_reacao_rapida: [
    { canal: "iniciativa", expr: "mod_int_ou_sab" },
  ],

  // "Ao obter esta habilidade, você pode imediatamente criar dois novos Feitiços
  // ou três variações de liberação. Você pode pegar essa habilidade repetidas
  // vezes." A variação de liberação não gasta orçamento (o resolve já a isenta),
  // então o que sobra são as duas vagas.
  // ⚠ Vaga EXCLUSIVA de Feitiço: não serve para Habilidade Geral.
  cnj_nova_habilidade: [
    { canal: "vagasFeitico", expr: "2" },
  ],

  // "Seu máximo de energia amaldiçoada aumenta em um valor igual a metade do seu
  // nível de Especialista em Técnicas."
  cnj_energia_inacabavel: [
    { canal: "pe", expr: "piso(esc_conjurador / 2)" },
  ],

  // "Ao obter essa habilidade, você aprende uma Aptidão Amaldiçoada. No nível 12
  // você recebe outra aptidão amaldiçoada."
  cnj_epifania_amaldicoada: [
    { canal: "vagasAptidao", expr: "1 + (esc_conjurador >= 12)" },
  ],

  // "Você passa a somar metade do seu bônus de treinamento no cálculo de CD dos
  // seus Feitiços e Aptidões Amaldiçoadas." Chega ao feitiço pelo `cdBase`.
  cnj_feiticos_refinados: [
    { canal: "cd", expr: "piso(maestria / 2)" },
  ],

  // "Você pode adicionar seu modificador de Inteligência ou de Sabedoria na sua
  // Defesa, limitado pelo seu nível."
  cnj_movimentos_imprevisiveis: [
    { canal: "defesa", expr: "min(mod_int_ou_sab, nd)" },
  ],

  // Potência Concentrada (6°): a ficha liga o estado ao gastar a Ação de
  // Movimento. O próximo Feitiço de Dano de alvo único recebe 5 × o nível do
  // próprio Feitiço, e a Ficha consome o estado na primeira rolagem de dano.
  cnj_potencia_concentrada: [
    {
      canal: "danoBonus", alvo: "feitico:unico",
      expr: "5 * nivel_feitico", quando: "potencia_concentrada", duracao: "temporaria",
    },
  ],

  // "Você recebe um bônus de +2 em rolagens de ataque para Feitiços e aptidões
  // amaldiçoadas. A cada 4 níveis, esse bônus aumenta em +1."
  cnj_olhar_preciso: [
    { canal: "bonusAcerto", alvo: "amaldicoado", expr: "2 + piso(esc_conjurador / 4)" },
  ],

  // "você aumenta um dos seus Níveis de Aptidão em 1. Você pode pegar esta
  // habilidade uma quantidade de vezes igual ao seu bônus de treinamento."
  // ⚠ É ORÇAMENTO (`pontosAptidao`), e não concessão direcionada: o texto diz
  // "um dos seus", ou seja, quem escolhe a trilha é o jogador, na aba Aptidões.
  cnj_elevar_aptidao: [
    { canal: "pontosAptidao", expr: "1" },
  ],

  // "você se torna mestre em 3 perícias nas quais você seja treinado".
  // Subir de Treinado para Mestre custa 1 vaga (Mestre vale 2, Treinado 1), e a
  // habilidade exige que já sejam treinadas, então são 3 vagas.
  cnj_especializacao: [
    { canal: "vagasPericia", expr: "3" },
  ],

  // "Você recebe redução de dano contra todos os tipos, exceto na alma, igual ao
  // seu bônus de treinamento." O recorte "exceto na alma" É a RD Geral: ela vale
  // para todo tipo menos alma, que tem canal próprio (`rdAlma`).
  cnj_revestimento_constante: [
    { canal: "rdGeral", expr: "maestria" },
  ],

  // "Sua atenção aumenta em um valor igual a metade do seu bônus de Inteligência
  // ou Sabedoria, e você adiciona o mesmo bônus a rolagens de Percepção."
  cnj_sentidos_agucados: [
    { canal: "atencao", expr: "piso(mod_int_ou_sab / 2)" },
    { canal: "bonusPericia", alvo: "percepcao", expr: "piso(mod_int_ou_sab / 2)" },
  ],

  // "a CD de todos seus Feitiços e Aptidões Amaldiçoadas aumenta em 5 e você
  // recebe +5 em rolagens de ataque para Feitiços e Aptidões Amaldiçoadas."
  // A metade de custo dos Feitiços 1 a 3 é do lado do feitiço (ver o aviso acima).
  cnj_o_honrado: [
    { canal: "cd", expr: "5" },
    { canal: "bonusAcerto", alvo: "amaldicoado", expr: "5" },
  ],

  /* ============================================================ */
  /* SUPORTE                                                       */
  /* ============================================================ */
  /* ⚠ FRENTE ABERTA, irmã da do Conjurador e pelo mesmo motivo: o Suporte é a
     classe da CURA e do APOIO A ALIADO, e a ficha só conhece a si mesma.
       • CURA não é stat. "2d6 + mod, X vezes por descanso" (Suporte em Combate)
         é um recurso de cena, e as dez habilidades que o melhoram (Medicina
         Infalível, Sobrecura, Cura Avançada em Grupo, Purificação da Alma...)
         não têm onde cair. Um canal de cura pediria primeiro que a cura fosse
         um bloco da ficha, como a Regeneração é.
       • APOIO A ALIADO é efeito no OUTRO. Presença Inspiradora, Guarda
         Sincronizada, Protetor, Inimigo Comum, Contra-Ataque: todos dão número
         a quem não é a criatura da ficha. */

  // "você recebe um bônus de +3 metros em seu movimento". A reação de mover-se
  // na direção de um aliado caído é economia de ação.
  sup_mobilidade_avancada: [
    { canal: "movimento", expr: "3" },
  ],

  // "Você adiciona seu modificador de Presença a Iniciativa." A metade que vai
  // para os aliados é efeito no outro.
  sup_pronto_para_agir: [
    { canal: "iniciativa", expr: "mod_presenca" },
  ],

  // "seu valor de atenção recebe um bônus de +5". Não poder ser surpreendido é
  // condição, e o aliado escolhido é efeito no outro.
  sup_pre_analise: [
    { canal: "atencao", expr: "5" },
  ],

  // "Você recebe espaços de item adicionais no seu inventário, em um valor igual
  // ao seu bônus de treinamento." Sobe o LIMITE de carga, e é por isso que o
  // canal entra antes da conta de sobrecarga.
  sup_otimizacao_de_espaco: [
    { canal: "espacosCarga", expr: "maestria" },
  ],

  // "Você se torna treinado em uma quantidade de perícias igual a metade do seu
  // bônus de treinamento. Você recebe também um bônus de +2 em uma perícia
  // qualquer." O treino é orçamento (a aba Perícias é onde se escolhe); o +2 é
  // escolha aninhada, logo abaixo em ESCOLHA_EFEITOS.
  sup_expandir_repertorio: [
    { canal: "vagasPericia", expr: "piso(maestria / 2)" },
  ],

  /* ---------- SUPORTE: a CURA (2026-08-03) ---------- */

  // "Você pode, como uma ação bônus, curar uma criatura em alcance de toque em
  // um valor igual a 2d6 + seu modificador de Presença ou Sabedoria, uma
  // quantidade de vezes igual ao seu modificador de Presença ou Sabedoria, por
  // descanso curto ou longo. No nível 4, essa cura se torna 2d12, no nível 8, se
  // torna 3d12, no nível 12 se torna 6d8, no nível 16 se torna 6d10."
  //
  // ⚠ O nível é o de SUPORTE, com metade do nível das outras classes junto
  // (autor, 2026-08-03), que é exatamente o que `esc_suporte` significa. As
  // irmãs dela ("seu nível de Suporte", em Medicina Infalível e Sobrecura) já
  // liam esse mesmo número.
  //
  // ⚠ A escada TROCA a rolagem, não soma, e as faces até DESCEM (d12 no 8, d8 no
  // 12). Por isso as faces saem de uma expressão só, com sinal negativo no meio:
  // o canal `curaFaces` vale o MAIOR entre as FONTES, e uma fonte que emitisse
  // 12 e outra 8 deixaria o d12 vencer para sempre.
  //
  //        nível   <4     4      8      12     16
  //        dados    2     2      3      6      6
  //        faces    6    12     12      8     10
  sup_suporte_em_combate: [
    { canal: "curaDados", alvo: "cura_suporte_em_combate",
      expr: "2 + (esc_suporte >= 8) + 3 * (esc_suporte >= 12)" },
    { canal: "curaFaces", alvo: "cura_suporte_em_combate",
      expr: "6 + 6 * (esc_suporte >= 4) - 4 * (esc_suporte >= 12) + 2 * (esc_suporte >= 16)" },
    { canal: "curaFixa", alvo: "cura_suporte_em_combate", expr: "mod_pre_ou_sab" },
    { canal: "curaUsos", alvo: "cura_suporte_em_combate", expr: "mod_pre_ou_sab" },
  ],

  // "você soma o seu bônus de treinamento no total de toda cura que realizar."
  // ⚠ SEM ALVO de propósito: "toda cura" é toda linha do card, e é para isso que
  // o alvo do canal é opcional. A parte de maximizar dados é usos por descanso
  // que a ficha não conta, e fica no texto.
  sup_medicina_infalivel: [
    { canal: "curaFixa", expr: "maestria" },
  ],

  // "sua quantidade de usos da habilidade Suporte em Combate são dobrados e você
  // soma seu modificador de atributo escolhido para CD de especialização em toda
  // cura que realizar."
  // Dobrar é DELTA de mais uma vez o valor base (o mesmo desenho da Cobertura
  // Avançada sobre o Cobrir-se). O Afty tem uma CD só, a Amaldiçoada, então o
  // "atributo escolhido para CD" é o `mod_tecnica`.
  sup_suporte_absoluto: [
    { canal: "curaUsos", alvo: "cura_suporte_em_combate", expr: "mod_pre_ou_sab" },
    { canal: "curaFixa", expr: "mod_tecnica" },
  ],

  // "o seu Bônus de Treinamento é adicionado ao número de usos da sua cura."
  // "A sua cura" é a de Suporte em Combate, que é a habilidade de cura da
  // especialização. A restauração de 50% de Integridade fica de fora: a
  // Integridade da Alma saiu do criador e é sempre máxima.
  sup_purificacao_da_alma: [
    { canal: "curaUsos", alvo: "cura_suporte_em_combate", expr: "maestria" },
  ],

  // "Durante um descanso curto, você pode escolher recuperar 2 pontos de energia
  // a menos para criar uma quantidade de remédios igual a metade do seu bônus de
  // treinamento; em um descanso longo, a quantidade é igual ao seu bônus de
  // treinamento. Um remédio cura em um valor igual a sua cura da habilidade
  // Suporte em Combate."
  // A linha ESPELHA a de Suporte em Combate, então só os usos entram por canal.
  // Vale o descanso longo, que é o número maior e o que a ficha mostra.
  sup_criar_medicina: [
    { canal: "curaUsos", alvo: "cura_criar_medicina", expr: "maestria" },
  ],

  // Invocação Às, uma das três capacidades do companheiro amaldiçoado: "Curar a
  // você em 2d10 + seu modificador de Sabedoria ou Presença. Nos níveis 5, 9, 13
  // e 17, a cura aumenta em +1d10. [...] Você pode utilizar cada um dos efeitos
  // uma vez por descanso curto ou longo."
  // ⚠ É cura que a criatura RECEBE, e por isso vira linha: quem rola é a
  // invocação, mas quem sara é o dono. As outras duas capacidades (dano em área
  // e cegueira) são da invocação e não entram aqui.
  ctr_invocacao_as: [
    { canal: "curaDados", alvo: "cura_invocacao_as",
      expr: "2 + (esc_controlador >= 5) + (esc_controlador >= 9) + (esc_controlador >= 13) + (esc_controlador >= 17)" },
    { canal: "curaFaces", alvo: "cura_invocacao_as", expr: "10" },
    { canal: "curaFixa",  alvo: "cura_invocacao_as", expr: "mod_pre_ou_sab" },
    { canal: "curaUsos",  alvo: "cura_invocacao_as", expr: "1" },
  ],

  // "Você passa a somar seu modificador de presença ou de sabedoria, ao invés de
  // constituição, nos pontos de vida, mas com um limite de +4."
  // A base já soma `nd * mod_constituicao`, então o efeito é a DIFERENÇA, e ela
  // é negativa quando a Constituição é a melhor: o texto manda trocar, não
  // escolher o maior.
  sup_fisico_controlado: [
    { canal: "hp", expr: "nd * (min(mod_pre_ou_sab, 4) - mod_constituicao)" },
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

  /* ---- Manobras de Empolgação (Lutador, base) ----
     `dado_empolgacao` é a MÉDIA do dado do nível atual, arredondada para baixo
     (ver mediaDadoEmpolgacao em afty-combate.js): o Motor trabalha com número e
     a bancada quer o valor esperado.

     Cada manobra tem a sua própria linha na Simulação de Combate, e não uma
     escolha única entre elas, porque o texto diz "cada manobra pode ser
     realizada apenas uma vez por rodada", e não uma por rodada: Ajuste no
     ataque, Trabalho de Pés na ação bônus e Esquiva na reação convivem. */

  // "ao realizar um ataque, você pode adicionar seu dado de empolgação na
  // rolagem de acerto e no dano."
  lut_manobra_ajuste: [
    { canal: "bonusAcerto", quando: "manobra_ajuste", expr: "dado_empolgacao", duracao: "temporaria" },
    { canal: "danoBonus", quando: "manobra_ajuste", expr: "dado_empolgacao", duracao: "temporaria" },
  ],

  // "Você adiciona seu dado de empolgação ao dano desse ataque e o alvo deve
  // fazer uma jogada de ataque corpo a corpo contra o resultado do seu ataque."
  // ⚠ Não é a manobra Desarmar da aba Perícias: esta resolve por jogada de
  // ataque, não por Atletismo ou Acrobacia. Só o dano entra.
  lut_manobra_desarme: [
    { canal: "danoBonus", quando: "manobra_desarme", expr: "dado_empolgacao", duracao: "temporaria" },
  ],

  // "Ao ser acertado por um ataque corpo-a-corpo você pode usar sua reação para
  // diminuir o dano em um valor igual a uma rolagem do seu dado de empolgação +
  // modificador de destreza."
  // ⚠ Entra como RD Geral porque é o canal que subtrai dano, mas é redução de
  // UM golpe, não RD permanente. Vale enquanto o gatilho estiver ligado.
  lut_manobra_esquiva: [
    { canal: "rdGeral", quando: "manobra_esquiva",
      expr: "dado_empolgacao + mod_destreza", duracao: "temporaria" },
  ],

  // "você pode escolher aumentar sua Defesa em um valor igual ao seu dado de
  // empolgação, até o começo do seu próximo turno."
  lut_manobra_trabalho_de_pes: [
    { canal: "defesa", quando: "manobra_trabalho_de_pes", expr: "dado_empolgacao", duracao: "temporaria" },
  ],

  // Comando fica de fora: o ataque é do ALIADO, e a ficha só conhece a si.

  /* ============================================================ */
  /* COMBATENTE                                                    */
  /* ============================================================ */

  // Aptidões de Combate (8°), gêmea das Aptidões de Luta do Lutador.
  cmb_aptidao_aura: [{ canal: "nivelAptidao", alvo: "au", expr: "1" }],
  cmb_aptidao_controle_leitura: [{ canal: "nivelAptidao", alvo: "cl", expr: "1" }],

  /* ---- Estilos de Combate (Repertório do Especialista, base) ----
     Os degraus são sempre os mesmos: "nos níveis 4, 8, 12 e 16".

     ⚠ O MESMO pool é emprestado pelo Talento Adepto de Combate, que diz
     "considera seu Nível de Personagem para os efeitos". Por isso o nível que
     os degraus leem é `NIVEL_ESTILO`, e não `esc_combatente` cru: quem vem pela
     classe usa o nível de Combatente, quem vem pelo Talento usa o ND, e quem
     tem os dois fica com o maior. Uma expressão resolve os três casos. */

  // "Sua Defesa aumenta em 2 e, nos níveis 4, 8, 12 e 16 aumenta em +1."
  cmb_estilo_defensivo: [
    { canal: "defesa",
      expr: `2 + (${NIVEL_ESTILO} >= 4) + (${NIVEL_ESTILO} >= 8) + (${NIVEL_ESTILO} >= 12) + (${NIVEL_ESTILO} >= 16)` },
  ],

  // "+2 em rolagens de dano com elas [armas de arremesso], o qual aumenta em +1
  // nos níveis 4, 8, 12 e 16." Sacar como parte do ataque é economia de ação.
  cmb_estilo_do_arremessador: [
    { canal: "danoBonus", alvo: "cat:arremesso",
      expr: `2 + (${NIVEL_ESTILO} >= 4) + (${NIVEL_ESTILO} >= 8) + (${NIVEL_ESTILO} >= 12) + (${NIVEL_ESTILO} >= 16)` },
  ],

  // "Ao usar uma arma em uma mão e ter a outra livre, você recebe +1 em
  // rolagens de acerto e +2 em rolagens de dano. Nos níveis 4, 8, 12 e 16, o
  // bônus em dano aumenta em +1; nos níveis 8 e 16, o bônus em acerto aumenta
  // em +1." A condição "uma mão livre" é estado, daí o gatilho na bancada.
  cmb_estilo_do_duelista: [
    { canal: "bonusAcerto", quando: "duelando",
      expr: `1 + (${NIVEL_ESTILO} >= 8) + (${NIVEL_ESTILO} >= 16)`, duracao: "temporaria" },
    { canal: "danoBonus", quando: "duelando",
      expr: `2 + (${NIVEL_ESTILO} >= 4) + (${NIVEL_ESTILO} >= 8) + (${NIVEL_ESTILO} >= 12) + (${NIVEL_ESTILO} >= 16)`,
      duracao: "temporaria" },
  ],

  // "+1 em rolagens de acerto e +2 em rolagens de dano com armas a distância."
  // O acerto vai na jogada A Distância e o dano nas linhas de categoria.
  cmb_estilo_distante: [
    { canal: "bonusAcerto", alvo: "distancia",
      expr: `1 + (${NIVEL_ESTILO} >= 8) + (${NIVEL_ESTILO} >= 16)` },
    { canal: "danoBonus", alvo: "cat:distancia",
      expr: `2 + (${NIVEL_ESTILO} >= 4) + (${NIVEL_ESTILO} >= 8) + (${NIVEL_ESTILO} >= 12) + (${NIVEL_ESTILO} >= 16)` },
  ],

  // "Quando rolar um 1 ou 2 em um dado na rolagem de dano com uma arma que
  // esteja usando em duas mãos ou que possua a propriedade pesada, você pode
  // rolar novamente [...] Além disso, você recebe +1 em rolagens de dano com a
  // arma, aumentando em +1 nos níveis 4, 8, 12 e 16."
  // ⚠ A rolagem repetida não é número. O +1 vai nos dois escopos, e uma arma
  // Pesada E de Duas Mãos receberia DUAS VEZES: o texto diz "com a arma", uma
  // vez só, então o efeito mira só `prop:duas_maos` e `prop:pesada` numa
  // expressão que não dobra. Como não dá para escrever "ou" entre dois alvos,
  // ficam as duas linhas e a dobra é aceita como limitação conhecida.
  cmb_estilo_massivo: [
    { canal: "danoBonus", alvo: "prop:duas_maos",
      expr: `1 + (${NIVEL_ESTILO} >= 4) + (${NIVEL_ESTILO} >= 8) + (${NIVEL_ESTILO} >= 12) + (${NIVEL_ESTILO} >= 16)` },
    { canal: "danoBonus", alvo: "prop:pesada",
      expr: `1 + (${NIVEL_ESTILO} >= 4) + (${NIVEL_ESTILO} >= 8) + (${NIVEL_ESTILO} >= 12) + (${NIVEL_ESTILO} >= 16)` },
  ],

  // Estilo Duplo e os dois de reação (Interceptador, Protetor) ficam de fora:
  // o primeiro fala do ataque da SEGUNDA arma, e a ficha tem uma linha por
  // arma e não por mão; os outros dois agem no ataque de outra criatura.

  /* ---- Posturas de Combate (Assumir Postura, 2°) ----
     `em_postura_<id>` é 1 com a postura em QUALQUER slot, porque Mestre da
     Postura (16°) deixa assumir duas ao mesmo tempo. */

  // "todos seus ataques recebem +2 para acertar e causam um dado de dano a
  // mais. Entretanto, sua Defesa diminui em 4."
  cmb_postura_do_sol: [
    { canal: "bonusAcerto", quando: "em_postura_sol", expr: "2", duracao: "temporaria" },
    { canal: "dadosDano", quando: "em_postura_sol", expr: "1", duracao: "temporaria" },
    { canal: "defesa", quando: "em_postura_sol", expr: "-4", duracao: "temporaria" },
  ],

  // "você recebe +3 de Defesa [...] todos seus ataques recebem -4 para acertar
  // e não recebem seu bônus de atributo no dano."
  // ⚠ A PERDA DO ATRIBUTO NO DANO ficou de fora, e é pergunta ao autor: na
  // planilha o atributo entra como `escala × modificador` dentro do total, e
  // não como uma parcela avulsa que dê para subtrair sem reescrever a conta.
  // Andar/Desengajar de graça e a redução por reação são procedimento de mesa.
  cmb_postura_da_lua: [
    { canal: "defesa", quando: "em_postura_lua", expr: "3", duracao: "temporaria" },
    { canal: "bonusAcerto", quando: "em_postura_lua", expr: "-4", duracao: "temporaria" },
  ],

  // "soma seu bônus de treinamento em rolagens de Fortitude e, no começo do seu
  // turno, você recebe pontos de vida temporários igual ao seu nível."
  // "não pode ser movido a força" é imunidade, não bônus.
  cmb_postura_da_terra: [
    { canal: "bonusTR", alvo: "fortitude", quando: "em_postura_terra",
      expr: "maestria", duracao: "temporaria" },
    { canal: "pvTemporario", quando: "em_postura_terra", expr: "nd", duracao: "temporaria" },
  ],

  // "para cada golpe acertado contra o mesmo alvo, você recebe +1 em acerto e
  // ignora 2 de redução de dano, até um máximo igual ao seu bônus de
  // treinamento para o acerto e o dobro dele para a redução de dano."
  // O teto da faixa É a Maestria, então o acerto usa a pilha crua e a RD o
  // dobro dela, o que bate com "o dobro dele".
  cmb_postura_da_devastacao: [
    { canal: "bonusAcerto", quando: "em_postura_devastacao && devastacao_pilha",
      expr: "devastacao_pilha", duracao: "temporaria" },
    { canal: "ignoraRD", quando: "em_postura_devastacao && devastacao_pilha",
      expr: "2 * devastacao_pilha", duracao: "temporaria" },
  ],

  // "o alcance dos seus ataques é dobrado, você recebe 2 pontos de preparo
  // temporários no começo de todo turno e +2 em todas as suas rolagens de
  // perícia." O alcance dobrado não tem canal.
  cmb_postura_do_ceu: [
    { canal: "pontosPreparo", quando: "em_postura_ceu", expr: "2", duracao: "temporaria" },
    { canal: "bonusPericia", quando: "em_postura_ceu", expr: "2", duracao: "temporaria" },
  ],

  // Dragão (dano nos adjacentes), Fortuna (rolar de novo) e Tempestade
  // (derrubar) não produzem número na própria ficha.

  /* ---- Guarda Estudada (4°): "escolher um Teste de Resistência para +2" ---- */
  cmb_guarda_reflexos:    [{ canal: "bonusTR", alvo: "reflexos", expr: "2" }],
  cmb_guarda_fortitude:   [{ canal: "bonusTR", alvo: "fortitude", expr: "2" }],
  cmb_guarda_vontade:     [{ canal: "bonusTR", alvo: "vontade", expr: "2" }],
  cmb_guarda_astucia:     [{ canal: "bonusTR", alvo: "astucia", expr: "2" }],
  cmb_guarda_integridade: [{ canal: "bonusTR", alvo: "integridade", expr: "2" }],

  /* ---- Armas Escolhidas (4°) e Armas Perfeitas (10°) ----
     UMA escolha, DUAS habilidades: "seus ataques com uma arma do grupo
     escolhido em Armas Escolhidas ignoram 10 de RD". Como a opção é a mesma, os
     dois efeitos moram nela, e o de Armas Perfeitas se protege com
     `tem_cmb_armas_perfeitas`, a booleana de "esta habilidade está escolhida".

     • Armas Escolhidas: "seus ataques com armas dele tem o nível de dano
       aumentado em 3."
     • Armas Perfeitas: "ignoram 10 de RD ao tipo de dano dela." */
  ...Object.fromEntries(GRUPOS_ARMA.map((g) => [
    `cmb_grupo_${g}`, [
      { canal: "nivelDano", alvo: `grupo:${g}`, expr: "3" },
      { canal: "ignoraRD", alvo: `grupo:${g}`, quando: "tem_cmb_armas_perfeitas", expr: "10" },
    ],
  ])),

  /* ============================================================ */
  /* RESTRINGIDO                                                   */
  /* ============================================================ */

  /* ---- Dádivas do Céu (Restrito pelos Céus, base) ----
     Cinco das nove dizem "bônus de +2 em testes de perícia ou resistência
     usando <atributo>", e é o que o escopo `atr:` resolve numa linha só. */

  // "+2 em teste usando destreza, 3 metros adicionais de movimento e sempre
  // ignorar terreno difícil." O terreno difícil não é número.
  res_dadiva_agilidade_exima: [
    { canal: "bonusPericia", alvo: "atr:destreza", expr: "2" },
    { canal: "bonusTR", alvo: "atr:destreza", expr: "2" },
    { canal: "movimento", expr: "3" },
  ],

  // "redução de dano contra todo tipo, cujo valor é igual a metade do seu nível
  // de personagem, além de +2 em testes usando constituição."
  res_dadiva_fisico_robusto: [
    { canal: "rdGeral", expr: "piso(nd / 2)" },
    { canal: "bonusPericia", alvo: "atr:constituicao", expr: "2" },
    { canal: "bonusTR", alvo: "atr:constituicao", expr: "2" },
  ],

  // "A distância de todo pulo ou salto aumenta em 3 metros, a distância padrão
  // que você empurra aumenta em 4,5 metros e recebe +2 em testes de perícia
  // usando Força." Salto não tem canal. O texto nomeia só PERÍCIA, então o TR
  // de Força fica de fora (e não existe TR de Força na lista dos cinco).
  res_dadiva_forca_devastadora: [
    { canal: "distanciaEmpurrao", expr: "4.5" },
    { canal: "bonusPericia", alvo: "atr:forca", expr: "2" },
  ],

  // "um bônus de +1 em TRs de Vontade contra efeitos dessas mesmas fontes. No
  // nível 10, o bônus em TRs aumenta em +1 e, no nível 15, passa a contar
  // também para Fortitude e Reflexos."
  // ⚠ A RD contra dano de técnica ou aptidão ficou de fora: não existe canal de
  // RD por FONTE do dano, só por tipo (Geral, Física, Específica).
  // ⚠ E o bônus vale só "contra efeitos dessas fontes", recorte que a ficha não
  // tem: aqui ele entra cheio.
  res_dadiva_indulgente_a_feiticaria: [
    { canal: "bonusTR", alvo: "vontade", expr: "1 + (nd >= 10)" },
    { canal: "bonusTR", alvo: "fortitude", expr: "(1 + (nd >= 10)) * (nd >= 15)" },
    { canal: "bonusTR", alvo: "reflexos", expr: "(1 + (nd >= 10)) * (nd >= 15)" },
  ],

  // "+2 em testes de perícia ou resistência usando inteligência."
  // ⚠ "treinado em duas perícias adicionais e mestre em uma" ficou de fora: é
  // uma escolha DENTRO de uma opção, e o shape só tem um nível de aninhamento.
  res_dadiva_mente_afiada: [
    { canal: "bonusPericia", alvo: "atr:inteligencia", expr: "2" },
    { canal: "bonusTR", alvo: "atr:inteligencia", expr: "2" },
  ],

  /* ---------------- CONJURADOR ---------------- */

  // Energia Focalizada (4°): "Você escolhe uma perícia de Teste de Resistência
  // (Fortitude, Reflexos, Astúcia e Vontade) para ter metade do seu modificador
  // de Sabedoria ou Inteligência somado a rolagens dela."
  // O texto lista os QUATRO e deixa Integridade de fora, então o pool é esse.
  cnj_focalizada_reflexos:  [{ canal: "bonusTR", alvo: "reflexos",  expr: "piso(mod_int_ou_sab / 2)" }],
  cnj_focalizada_fortitude: [{ canal: "bonusTR", alvo: "fortitude", expr: "piso(mod_int_ou_sab / 2)" }],
  cnj_focalizada_vontade:   [{ canal: "bonusTR", alvo: "vontade",   expr: "piso(mod_int_ou_sab / 2)" }],
  cnj_focalizada_astucia:   [{ canal: "bonusTR", alvo: "astucia",   expr: "piso(mod_int_ou_sab / 2)" }],

  // Foco Amaldiçoado (10°), uma entre três.
  // Destruição: "+1 de dano para cada dado rolado" + Maestria no total. O
  // calculador avalia `dados_dano_final` depois de fechar a quantidade real da
  // linha. Em Múltiplos Disparos, a variável representa os dados de CADA
  // disparo, então cada rolagem recebe exatamente o bônus dos dados que rola.
  // ⚠ A metade sobre Aptidão Amaldiçoada segue sem consumidor: as Aptidões
  // ainda não possuem linhas estruturadas de dano na Ficha Final.
  cnj_foco_destruicao: [
    { canal: "danoBonus", alvo: "feitico", expr: "dados_dano_final + maestria" },
  ],
  //
  // Economia: "você passa a somar o seu bônus de treinamento no seu máximo de
  // energia amaldiçoada." A redução de 2 no custo é do lado do feitiço.
  cnj_foco_economia: [
    { canal: "pe", expr: "maestria" },
  ],
  // Refino: "você passa a somar metade do seu bônus de treinamento no cálculo de
  // todas as suas CDs e em jogadas de ataque amaldiçoado."
  // ⚠ A Aptidão OU Feitiço adicional é uma escolha DENTRO de uma opção, e o
  // shape só tem um nível de aninhamento. Ficou de fora, como a Mente Afiada.
  cnj_foco_refino: [
    { canal: "cd", expr: "piso(maestria / 2)" },
    { canal: "bonusAcerto", alvo: "amaldicoado", expr: "piso(maestria / 2)" },
  ],

  /* As sete Mudanças de Fundamento (Domínio dos Fundamentos, 1°) NÃO aparecem
     aqui, e nenhuma delas tem efeito de ficha: as sete são "gaste PE para" —
     aumentar a CD daquele feitiço, dobrar o alcance, duplicar o alvo, ampliar a
     área, rerrolar dados, somar acerto, baixar o custo em ação. É gasto na hora
     do uso, não número na ficha. */

  /* ---------------- SUPORTE ---------------- */

  // Aptidões de Suporte (8°): "você pode aumentar o seu nível de aptidão em
  // Aura, Controle e Leitura ou Energia Reversa em 1. Você pode pegar esta
  // habilidade três vezes, uma para cada aptidão."
  // Concessão DIRECIONADA (o texto nomeia a trilha), então é `nivelAptidao` com
  // alvo, e não orçamento livre como o Elevar Aptidão do Conjurador.
  sup_aptidao_au: [{ canal: "nivelAptidao", alvo: "au", expr: "1" }],
  sup_aptidao_cl: [{ canal: "nivelAptidao", alvo: "cl", expr: "1" }],
  sup_aptidao_er: [{ canal: "nivelAptidao", alvo: "er", expr: "1" }],

  // Aptidões de Controle (8°): "você pode aumentar o seu nível de aptidão em
  // Aura, Controle e Leitura ou Barreira em 1. Você pode pegar esta habilidade
  // três vezes, uma para cada aptidão." A quarta irmã do mesmo padrão, e a
  // última a ser ligada (2026-07-29): o pool dela não existia no catálogo.
  ctr_aptidao_aura: [{ canal: "nivelAptidao", alvo: "au", expr: "1" }],
  ctr_aptidao_controle_leitura: [{ canal: "nivelAptidao", alvo: "cl", expr: "1" }],
  ctr_aptidao_barreira: [{ canal: "nivelAptidao", alvo: "bar", expr: "1" }],

  // Expandir Repertório (2°): "você recebe também um bônus de +2 em uma perícia
  // qualquer". Os ids são gerados do catálogo, do lado do afty-habilidades.js.
  sup_repertorio_acrobacia:        [{ canal: "bonusPericia", alvo: "acrobacia", expr: "2" }],
  sup_repertorio_atletismo:        [{ canal: "bonusPericia", alvo: "atletismo", expr: "2" }],
  sup_repertorio_enganacao:        [{ canal: "bonusPericia", alvo: "enganacao", expr: "2" }],
  sup_repertorio_feiticaria:       [{ canal: "bonusPericia", alvo: "feiticaria", expr: "2" }],
  sup_repertorio_furtividade:      [{ canal: "bonusPericia", alvo: "furtividade", expr: "2" }],
  sup_repertorio_historia:         [{ canal: "bonusPericia", alvo: "historia", expr: "2" }],
  sup_repertorio_intimidacao:      [{ canal: "bonusPericia", alvo: "intimidacao", expr: "2" }],
  sup_repertorio_intuicao:         [{ canal: "bonusPericia", alvo: "intuicao", expr: "2" }],
  sup_repertorio_investigacao:     [{ canal: "bonusPericia", alvo: "investigacao", expr: "2" }],
  sup_repertorio_medicina:         [{ canal: "bonusPericia", alvo: "medicina", expr: "2" }],
  sup_repertorio_ocultismo:        [{ canal: "bonusPericia", alvo: "ocultismo", expr: "2" }],
  sup_repertorio_oficio:           [{ canal: "bonusPericia", alvo: "oficio", expr: "2" }],
  sup_repertorio_percepcao:        [{ canal: "bonusPericia", alvo: "percepcao", expr: "2" }],
  sup_repertorio_performance:      [{ canal: "bonusPericia", alvo: "performance", expr: "2" }],
  sup_repertorio_persuasao:        [{ canal: "bonusPericia", alvo: "persuasao", expr: "2" }],
  sup_repertorio_prestidigitacao:  [{ canal: "bonusPericia", alvo: "prestidigitacao", expr: "2" }],
  sup_repertorio_tecnologia:       [{ canal: "bonusPericia", alvo: "tecnologia", expr: "2" }],

  /* Os cinco Apoios Avançados (2°) NÃO aparecem aqui: todos modificam a ação de
     Apoiar, que acontece SOBRE UM ALIADO (curar, subir a Defesa dele, somar no
     teste dele, atacar por ele, subir a CD contra ele). Nenhum é número da
     própria ficha. */

  // "Sua atenção aumenta em um valor igual a metade do seu nível de personagem
  // e você recebe um bônus de +3 em rolagens de percepção. Você também recebe
  // um bônus de +2 em testes usando sabedoria."
  // ⚠ A Atenção da ficha JÁ é 10 + o bônus de Percepção, então os +3 da perícia
  // sobem a Atenção sozinhos, e o `atencao` daqui é só a metade do nível.
  res_dadiva_percepcao_agucada: [
    { canal: "atencao", expr: "piso(nd / 2)" },
    { canal: "bonusPericia", alvo: "percepcao", expr: "3" },
    { canal: "bonusPericia", alvo: "atr:sabedoria", expr: "2" },
    { canal: "bonusTR", alvo: "atr:sabedoria", expr: "2" },
  ],

  // "+2 em testes de perícia usando Presença." O piso na rolagem não é bônus, e
  // o "mestre em uma perícia de Presença à sua escolha" é escolha dentro de
  // opção, mesmo limite da Mente Afiada.
  res_dadiva_semblante_cativante: [
    { canal: "bonusPericia", alvo: "atr:presenca", expr: "2" },
  ],

  // "Seus pontos de vida máximos aumentam em um valor igual ao seu nível de
  // personagem e, a cada 2 níveis, você recebe 1 ponto de estamina adicional."
  res_dadiva_vigor_infindavel: [
    { canal: "hp", expr: "nd" },
    { canal: "pe", expr: "piso(nd / 2)" },
  ],

  // Reposição Sanguinária recupera estamina por abate: é evento, não máximo.

  /* ---- Pináculo Físico (12°): dois atributos entre três ----
     "+2 [...] No nível 16, o valor de ambos os atributos escolhidos aumentam
     novamente em 2." É VALOR de atributo, então entra pelo canal `atributo`,
     que roda no estágio 1 e propaga para tudo que lê o modificador. */
  ...Object.fromEntries(["forca", "destreza", "constituicao"].map((a) => [
    `res_pinaculo_${a}`, [{ canal: "atributo", alvo: a, expr: "2 + 2 * (esc_restringido >= 16)" }],
  ])),

  /* ---- Força Imparável (8°): dois Testes de Resistência ----
     "Você se torna treinado em um teste de resistência à sua escolha e mestre
     em outro TR no qual já seja treinado." As duas escolhas saem do mesmo pool,
     e o card não sabe qual é qual: a opção decide sozinha olhando a ficha, e
     concede Mestre onde já havia treino e Treinado onde não havia. */
  ...Object.fromEntries(["reflexos", "fortitude", "vontade", "astucia", "integridade"].map((r) => [
    `res_imparavel_${r}`, [{ canal: "proficienciaTR", alvo: r, expr: `1 + (prof_tr_${r} >= 1)` }],
  ])),

  /* ============================================================ */
  /* TALENTOS                                                      */
  /* ============================================================ */

  /* ---- Escolhas de atributo ----
     Oito talentos diferentes dizem "aumenta o valor de X à sua escolha", com
     valores e pools diferentes. O canal é o mesmo `atributo`, que roda no
     estágio 1 e propaga para tudo que lê o modificador.

     ⚠ CORRIGIDO EM 2026-07-29. O comentário antigo aqui dizia que onde o texto
     fala "e o limite também" (Incremento de Atributo, Quebra de Limites) bastava
     somar o VALOR, "porque o canal já passa por cima do limite por atributo".
     Era verdade e era o BUG: o canal `atributo` não respeitava o limite de 20 de
     ninguém. Agora ele respeita, então os dois que sobem o limite emitem as duas
     metades, e os outros seis aparam no 20 como deveriam desde sempre. */
  ...Object.fromEntries(ESCOLHAS_DE_ATRIBUTO.flatMap(([prefixo, valor, pool, sobeLimite]) =>
    pool.map((a) => [`${prefixo}_${a}`, [
      { canal: "atributo", alvo: a, expr: String(valor) },
      ...(sobeLimite ? [{ canal: "limiteAtributo", alvo: a, expr: String(valor) }] : []),
    ]]),
  )),

  /* ---- Escolhas de trilha de aptidão ---- */
  ...Object.fromEntries(TRILHAS.flatMap((t) => [
    [`tal_aptidao_${t}`, [{ canal: "nivelAptidao", alvo: t, expr: "1" }]],
    [`tal_estudo_${t}`,  [{ canal: "nivelAptidao", alvo: t, expr: "1" }]],
  ])),

  /* ---- Resiliência Melhorada: "treinado nele ou, caso já seja treinado, se
     torna mestre. O valor do atributo usado no TR escolhido aumenta em 1."
     A opção decide sozinha entre 1 e 2, igual à Força Imparável. Integridade
     fica de fora do pool por texto. ---- */
  ...Object.fromEntries(RESISTENCIAS_COM_ATRIBUTO.map(([r, atr]) => [
    `tal_resiliencia_${r}`, [
      { canal: "proficienciaTR", alvo: r, expr: `1 + (prof_tr_${r} >= 1)` },
      { canal: "atributo", alvo: atr, expr: "1" },
    ],
  ])),

  /* ---- Físico Aperfeiçoado: uma entre quatro ---- */
  tal_fisico_deslocamento: [{ canal: "movimento", expr: "4.5" }],
  tal_fisico_acrobacia:    [{ canal: "bonusPericia", alvo: "acrobacia", expr: "2" }],
  tal_fisico_atletismo:    [{ canal: "bonusPericia", alvo: "atletismo", expr: "2" }],
  tal_fisico_empurrao:     [{ canal: "distanciaEmpurrao", expr: "3" }],
  // O pulo não tem canal: a ficha não guarda distância de salto.
};

/* ============================================================ */
/* DEMAIS CATÁLOGOS                                              */
/* ============================================================ */
/* Ainda vazios: a passada de conteúdo é por catálogo, e o Lutador foi o
   primeiro. Ver docs/afty-efeitos-criatura.md. */

export const APICE_EFEITOS = {};        // Habilidades Ápice (6)

/* ============================================================ */
/* TALENTOS (51)                                                 */
/* ============================================================ */
/* Talento não pertence a classe nenhuma, então o nível que os degraus leem é o
   ND (`nd`), e nunca `esc_<espec>`. Vários deles têm escolha aninhada, e essa
   metade mora no ESCOLHA_EFEITOS, com prefixo `tal_`. */

export const TALENTO_EFEITOS = {
  /* ---- Gerais ---- */

  // "você recebe um Feitiço adicional. Nos níveis 5, 10, 15 e 20 você recebe
  // mais um Feitiço adicional." Vaga EXCLUSIVA de Feitiço: não serve para
  // Habilidade Geral (mesma regra da Dominância em Técnica).
  tal_afinidade_com_tecnica: [
    { canal: "vagasFeitico", expr: "1 + (nd >= 5) + (nd >= 10) + (nd >= 15) + (nd >= 20)" },
  ],

  // "Você recebe um bônus de +5 em sua Atenção."
  tal_atencao_infalivel: [
    { canal: "atencao", expr: "5" },
  ],

  // "Sempre que atacar com uma arma de arremesso, você recebe um bônus de +2
  // para acertar e +3 no dano."
  // ⚠ O acerto vai na jogada A Distância, que é a mais perto: não existe linha
  // de ataque só de arremesso. O dano mira `cat:arremesso`, essa sim exata.
  tal_tecnicas_de_arremesso: [
    { canal: "bonusAcerto", alvo: "distancia", expr: "2" },
    { canal: "danoBonus", alvo: "cat:arremesso", expr: "3" },
  ],

  // "Você recebe +5 de Iniciativa."
  tal_tecnicas_de_reacao_rapida: [
    { canal: "iniciativa", expr: "5" },
  ],

  // "Caso já seja treinado, você recebe Redução de Dano adicional com o
  // escudo igual a metade do valor base de RD dele". A Especialização conta
  // como uma fonte de treino, e cada Talento de escudo conta como outra.
  tal_mestre_defensivo: [
    { canal: "rdGeral", expr: "piso(rd_escudo / 2) * (fontes_treino_escudo >= 2)" },
  ],

  // "você adiciona o bônus padrão do escudo em TRs de Reflexos." A redução da
  // margem de crítico é por uso e fica na mesa.
  tal_tecnicas_defensivas_de_escudo: [
    { canal: "bonusTR", alvo: "reflexos", expr: "rd_escudo" },
  ],

  // "Caso o alvo seja empurrado com sucesso, ele recebe Xd6 + seu Modificador
  // de Força de dano de impacto, onde X é igual ao seu Modificador de Força."
  // 1d6 = 3. "aumentar a distância em 4,5 metros ou a derrubar" é escolha de
  // uso e não soma no empurrão padrão.
  tal_tecnicas_ofensivas_de_escudo: [
    { canal: "danoBonus", quando: "golpe_escudo",
      expr: "3 * mod_forca + mod_forca", duracao: "temporaria" },
  ],

  // "Enquanto não estiver com nenhum equipamento do grupo Pugilato, você recebe
  // +3 em jogadas de ataque desarmado e o dano de seus golpes desarmados
  // aumenta em 2 níveis."
  // ⚠ A condição "sem Pugilato" NÃO é checada: Manoplas e Faixas são o que dá
  // grau ao Ataque Básico, e a ficha não expõe isso ao DSL. Quem carrega as
  // duas coisas vê os dois bônus.
  tal_adepto_de_briga: [
    { canal: "bonusAcerto", alvo: "corpo", expr: "3" },
    { canal: "nivelDano", alvo: "basico", expr: "2" },
  ],

  /* ---- Com pré-requisito ---- */

  // "Você se torna treinado em Integridade e recebe Redução de Dano contra Dano
  // na Alma igual a 1/4 do seu Nível de Personagem."
  // A RD Geral vale para todo tipo EXCETO alma, então o autor mandou abrir um
  // canal só para esta (2026-07-29): `rdAlma`, que aparece no Preview apenas
  // para quem tem, porque nenhum Tipo nem Patamar concede base.
  tal_alma_inquebravel: [
    { canal: "proficienciaTR", alvo: "integridade", expr: "1" },
    { canal: "rdAlma", expr: "piso(nd / 4)" },
  ],

  // "Sempre que causar Dano de Impacto em um ataque corpo a corpo, ele é
  // aumentado em um nível." O empurrão de 3 metros é por turno e fica na mesa.
  // ⚠ `tipo:im` pega TODA arma de impacto, inclusive a de arremesso: o recorte
  // "corpo a corpo" não dá para somar ao escopo de tipo.
  tal_especialista_em_concussao: [
    { canal: "nivelDano", alvo: "tipo:im", expr: "1" },
  ],
  tal_especialista_em_cortes: [
    { canal: "nivelDano", alvo: "tipo:ct", expr: "1" },
  ],
  tal_especialista_em_perfuracao: [
    { canal: "nivelDano", alvo: "tipo:pf", expr: "1" },
  ],

  // "Toda arma de arremesso que você utilizar tem o seu dano aumentado em um
  // dado; o seu bônus em ataques com armas de arremesso se torna +4 para
  // acertar e +6 no dano."
  // SUBSTITUI os +2/+3 das Técnicas de Arremesso, que é pré-requisito: aqui
  // entra só o degrau (+2 acerto, +3 dano). "um dado" sem tamanho é dado da
  // LINHA. O alcance +6m não tem canal.
  tal_mestre_do_arremesso: [
    { canal: "bonusAcerto", alvo: "distancia", expr: "2" },
    { canal: "danoBonus", alvo: "cat:arremesso", expr: "3" },
    { canal: "dadosDano", alvo: "cat:arremesso", expr: "1" },
  ],

  // "Suas rolagens de ataque com chicotes causam +4 de dano e o alcance aumenta
  // em 1,5 metros." O alcance não tem canal.
  tal_mestre_dos_chicotes: [
    { canal: "danoBonus", alvo: "grupo:chicote", expr: "4" },
  ],

  // "Seus pontos de vida máximos aumentam em um valor igual ao seu nível ao
  // obter esse talento. Sempre que subir de nível e tiver esse talento, você
  // recebe +1 ponto de vida máximo. Além disso, você recebe +2 em testes de
  // Fortitude."
  // Nível ao obter, mais 1 por nível desde então, dá o ND atual: `nd`.
  tal_robustez_aprimorada: [
    { canal: "hp", expr: "nd" },
    { canal: "bonusTR", alvo: "fortitude", expr: "2" },
  ],

  // "Você recebe um bônus de +1 na sua Defesa quando estiver empunhando uma
  // arma em cada mão."
  tal_tecnicas_de_empunhadura_dupla: [
    { canal: "defesa", quando: "duas_armas", expr: "1", duracao: "temporaria" },
  ],

  // "Seu movimento aumenta em 3 metros."
  tal_tecnicas_de_mobilidade: [
    { canal: "movimento", expr: "3" },
  ],

  // "Você recebe um bônus adicional em testes de Furtividade igual ao seu Bônus
  // de Treinamento."
  tal_tecnicas_de_ocultamento: [
    { canal: "bonusPericia", alvo: "furtividade", expr: "maestria" },
  ],

  // "Você recebe um bônus de +2 para testes de resistências contra efeitos de
  // aptidões amaldiçoadas. Nos níveis 8, 12 e 16 o bônus aumenta em +1."
  // O recorte "contra efeitos de aptidões" não existe na ficha, e o autor
  // confirmou (2026-07-29) que o bônus vale para todo TR de forma geral.
  tal_nocao_e_preparacao: [
    { canal: "bonusTR", expr: "2 + (nd >= 8) + (nd >= 12) + (nd >= 16)" },
  ],
};

/* ============================================================ */
/* HABILIDADES LENDÁRIAS (16, das quais 10 ligadas)              */
/* ============================================================ */

export const LENDARIA_EFEITOS = {
  // "o seu valor máximo de Integridade da Alma aumenta em 25."
  len_consciencia_absoluta_da_alma: [{ canal: "almaMax", expr: "25" }],

  // "você recebe 2 habilidades de técnica adicionais."
  // Habilidade de Técnica e Feitiço são a MESMA coisa com nomes diferentes
  // (autor, 2026-07-28), e a vaga que isso concede é EXCLUSIVA de Feitiço: não
  // dá para gastar numa Habilidade Geral, embora as duas dividam o contador.
  len_dominancia_em_tecnica: [{ canal: "vagasFeitico", expr: "2" }],

  // "você recebe 2 aptidões amaldiçoadas a sua escolha."
  len_favorecido_pela_energia: [{ canal: "vagasAptidao", expr: "2" }],

  // "o seu máximo de pontos de energia amaldiçoada ou de vigor aumenta em 6."
  // A escolha entre os dois é de nome, não de mecânica: a ficha tem UM recurso
  // (o PE), que o Restringido chama de vigor ou estamina. Por isso o efeito não
  // depende da opção marcada.
  len_inesgotavel: [{ canal: "pe", expr: "6" }],

  // "você recebe 30 pontos de vida máximos adicionais."
  len_inquebravel: [{ canal: "hp", expr: "30" }],

  // "sua Classe de Armadura aumenta em 5." CA é a Defesa da ficha.
  len_intocavel: [{ canal: "defesa", expr: "5" }],

  // "você recebe +5 em Iniciativa."
  len_preparo_absoluto: [{ canal: "iniciativa", expr: "5" }],

  // "você recebe +10 em Percepção e Atenção."
  // ⚠ A CONFIRMAR: na ficha a Atenção JÁ é 10 + o bônus de Percepção, então os
  // +10 da perícia sobem a Atenção sozinhos. Somando também o +10 direto, a
  // Atenção sobe 20 no total. É a leitura literal do texto (ele nomeia as duas
  // coisas), mas pode ser dupla contagem que o autor não pretendia.
  len_um_com_o_mundo: [
    { canal: "bonusPericia", alvo: "percepcao", expr: "10" },
    { canal: "atencao", expr: "10" },
  ],

  // "recebendo 2 aumentos de nível de aptidão para distribuir, podendo aumentar
  // uma única em dois níveis ou duas aptidões em um nível."
  // ⚠ ORÇAMENTO (`pontosAptidao`), igual ao Elevar Aptidão: as duas divisões que
  // o texto autoriza são as duas maneiras de gastar 2 pontos na aba Aptidões, e
  // por isso não existe escolha aninhada para elas. A outra metade da Lendária
  // (o limite) é direcionada e sai no LENDARIA_EFEITOS_ALVO.
  len_versatilidade_extrema: [{ canal: "pontosAptidao", expr: "2" }],
};

/**
 * Lendárias cujo ALVO vem da escolha aninhada, mesmo esquema do
 * MELHORIA_EFEITOS_ALVO: canal e expressão fixos, destino escolhido na ficha.
 */
export const LENDARIA_EFEITOS_ALVO = {
  // "você aumenta o valor de um atributo em 2, podendo superar o máximo de 30."
  // É a ÚNICA entrada do sistema autorizada a passar do teto duro de 30, e o
  // validador recusa `furaTeto` em qualquer outro id (FURA_TETO_PERMITIDO).
  //
  // ⚠ Sobe o LIMITE junto do valor, os dois em 2 (autor, 2026-07-29). O texto
  // fala só do valor, e por isso a primeira versão só somava valor, mas o autor
  // corrigiu: é a Lendária que "permite ir para 32", e ir para 32 é o LIMITE
  // chegar lá. Num atributo de limite 20 ela faz 22, e num de 30 faz 32.
  //
  // O `furaTeto` vai nas DUAS metades porque ele não é mais "esta parcela fura",
  // é "o teto deste atributo é 32", e o deriveAfty o lê dos dois canais.
  len_aperfeicoamento_de_atributo: [
    { canal: "atributo", expr: "2", furaTeto: true },
    { canal: "limiteAtributo", expr: "2", furaTeto: true },
  ],

  // "você pode aumentar o limite de um Nível de Aptidão para 6."
  // O canal é SOMA, e não "passa a valer 6": é a convenção do `limiteAptidao`
  // desde que ele nasceu (duas fontes na mesma trilha levam o teto a 7). Numa
  // trilha em que nada mais mexeu, +1 sobre o 5 padrão dá exatamente os 6 do
  // texto. ⚠ A CONFIRMAR com o autor se, empilhada com outra fonte de limite,
  // ela deve parar no 6 em vez de somar.
  //
  // Sozinho o limite não dá nível nenhum: quem preenche o 6° é o orçamento, e a
  // trilha só aceita alocação até o limite dela (ver resolveNiveisAptidao).
  len_versatilidade_extrema: [{ canal: "limiteAptidao", expr: "1" }],

  // "você escolhe 3 perícias para se tornar especialista em."
  // ⚠ ASSUMIDO: "especialista" é a faixa de Mestre. É o que o texto dos
  // Interlúdios sugere ("Estudar uma perícia sem maestria... ou tornar-se
  // especialista numa perícia já dominada"), ou seja, o degrau acima do treino.
  len_conhecimento_iluminado: [{ canal: "proficienciaPericia", expr: "2" }],
};

/* ============================================================ */
/* MELHORIAS SUPERIORES (11)                                     */
/* ============================================================ */
/* Todas ligadas (2026-07-27). Quase todas escalam com a Maestria, e não com o
   ND: o autor reescreveu Defesa, CD, Energia e Movimento nessa leva, trocando
   valores fixos ("+3, e +2 na segunda vez") por metade da Maestria.

   ⚠ `vez` é a variável das REPETÍVEIS cujo valor muda por pega. Alma dá 15 na
   primeira e 10 na segunda; Vida dá 20 na primeira e 15 nas outras duas. No
   DSL um booleano é 1 ou 0, então `15 * (vez == 1) + 10 * (vez >= 2)` resolve
   sem precisar de condicional. */

export const MELHORIA_EFEITOS = {
  // "Seu máximo de integridade da alma aumenta em 15. Você pode pegar essa
  // melhoria uma segunda vez, aumentando em mais 10."
  mel_alma: [{ canal: "almaMax", expr: "15 * (vez == 1) + 10 * (vez >= 2)" }],

  // "Seu valor de atenção aumenta em 5."
  mel_atencao: [{ canal: "atencao", expr: "5" }],

  // "Você soma metade do seu bônus de maestria ao total de sua Defesa."
  mel_defesa: [{ canal: "defesa", expr: "piso(maestria / 2)" }],

  // "Você soma metade do seu bônus de maestria ao total de CD de todas suas
  // habilidades de técnica, aptidões amaldiçoadas e habilidades de
  // especialização." A ficha tem uma CD só, que é essa.
  mel_classe_de_dificuldade: [{ canal: "cd", expr: "piso(maestria / 2)" }],

  // "Sempre que causar dano com uma habilidade, aptidão ou ataque, você soma o
  // seu bônus de maestria neste dano." Sem alvo: vale para TODAS as linhas.
  mel_dano: [{ canal: "danoBonus", expr: "maestria" }],

  // "Seu máximo de pontos de energia amaldiçoada aumenta em um valor igual à
  // sua maestria."
  mel_energia: [{ canal: "pe", expr: "maestria" }],

  // "Seu valor de movimento aumenta em um valor igual metade de sua maestria
  // * 1,5m."
  mel_movimento: [{ canal: "movimento", expr: "piso(maestria / 2) * 1.5" }],

  // "Sempre que realizar uma rolagem de ataque, você soma metade do seu bônus
  // de maestria ao total." Sem alvo: vale para as três Jogadas de Ataque.
  mel_precisao: [{ canal: "bonusAcerto", expr: "piso(maestria / 2)" }],

  // "Seu máximo de pontos de vida aumenta em 20. Você pode pegar esta melhoria
  // mais duas vezes, aumentando o máximo em 15 ao invés de 20."
  mel_vida: [{ canal: "hp", expr: "20 * (vez == 1) + 15 * (vez >= 2)" }],
};

/**
 * Melhorias cujo ALVO é escolhido na ficha. O canal e a expressão são fixos, e
 * só o destino vem da escolha aninhada (`altoNivel.escolhas.mapa`). Por isso os
 * efeitos aqui saem SEM `alvo`: quem preenche é o `coletarEfeitosComAlvo`.
 */
export const MELHORIA_EFEITOS_ALVO = {
  // "Uma perícia a sua escolha recebe um bônus adicional igual a metade do seu
  // bônus de maestria."
  mel_pericia: [{ canal: "bonusPericia", expr: "piso(maestria / 2)" }],

  // "Escolha um Teste de Resistência: você recebe um bônus igual a metade do
  // seu bônus de maestria, além de ter a margem necessária para um sucesso
  // crítico reduzida no mesmo valor."
  mel_resistencia: [
    { canal: "bonusTR", expr: "piso(maestria / 2)" },
    { canal: "margemCriticoTR", expr: "piso(maestria / 2)" },
  ],
};

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
  // ⚠ A Aptidão trocou "1 + metade da Maestria" por "1 + Grau" (autor,
  // 2026-08-12), e as duas Gerais deixaram de ser gêmeas. `grau` é o rank do
  // Grau do Feiticeiro (Quarto 1 ... Especial 5), que sai da faixa de ND em
  // `grauFeiticeiro` e já vem no contexto MONTANTE, onde as Gerais rodam.
  //
  // ⚠ É um AUMENTO no meio da escada, e não uma troca neutra: o Grau chega ao 5
  // no ND 17 e a metade da Maestria só no ND 36. Por pega, a diferença é 0 nos
  // ND 1 a 4, +1 nos 5 a 12, +2 nos 13 a 25, +1 nos 26 a 35 e 0 do 36 em diante.
  // No ND 17 são 6 Aptidões por pega, contra as 4 de antes.
  ger_aptidao:        [{ canal: "vagasAptidao",    expr: "1 + grau" }],
  ger_treinamentos:   [{ canal: "focos",           expr: "piso(nd / 2)" }],
};

/* ============================================================ */
/* ORIGENS, CLÃS E ANATOMIAS                                     */
/* ============================================================ */
/**
 * Quinta frente do Motor (2026-07-29). Três mapas irmãos, separados porque as
 * três coisas são escolhidas em lugares diferentes da ficha:
 *
 *   • ORIGEM_EFEITOS   — chaveado pelo id da origem (`core.origem.id`).
 *   • CLA_EFEITOS      — chaveado pelo clã do Herdado (`core.origem.cla`).
 *   • ANATOMIA_EFEITOS — chaveado por Característica de Anatomia (Feto).
 *
 * As ESCOLHAS aninhadas de origem NÃO estão aqui: os ids delas são GERADOS dos
 * catálogos de perícia, ataque e TR, e por isso os efeitos são gerados no mesmo
 * lugar, em afty-origens.js (ORIGEM_ESCOLHA_EFEITOS). Este arquivo continua sem
 * import nenhum, que é a regra dele.
 *
 * ⚠ O QUE NÃO ESTÁ AQUI: o bônus de ATRIBUTO. Ele respeita o LIMITE do atributo
 * (20 por padrão), e o canal `atributo` do Motor só respeita o teto duro de 30.
 * Regras diferentes, caminhos diferentes: quem resolve é o
 * `resolveOrigemAttrBonus` de afty-origens.js.
 *
 * ⚠ Origem roda no estágio 0 (montante), com o contexto REDUZIDO: só `nd`,
 * `maestria`, `grau`, patamar, tipo e os atributos base. Nada de `esc_*`, o que
 * é justo, porque origem não escala com nível de classe.
 */
export const ORIGEM_EFEITOS = {
  /* ================= GÊMEOS ================= */
  /* ⚠ TUDO AQUI É ESCRITO EM DOIS ESTÁGIOS. A Restrição Celestial tem um efeito
     inicial e um efeito depois da MORTE DO IRMÃO, e a variável `irmao_morto`
     (0 ou 1) escolhe qual vale. O padrão da expressão é sempre o mesmo:

         antes * (1 - irmao_morto) + depois * irmao_morto

     ⚠ E TUDO É SEPARADO POR RAMO. O texto tem duas Restrições Celestiais
     diferentes, uma para o Gêmeo Restringido e outra para o Gêmeo Feiticeiro, e
     quem separa é o `tipo_restringido`, que o contexto já dá. Nenhuma escolha
     nova foi criada para isso: o Tipo já diz o que a criatura é.

     ⚠ O QUE NÃO ESTÁ AQUI, e por quê:
       • a proibição de Controlador e de Invocações (é uma TRAVA, e trava não é
         canal: ela vive em afty-especializacoes.js e afty-invocacoes.js);
       • o "1 habilidade de técnica a cada 3 níveis" e o "1 por nível" do
         pós-morte (o contador de Feitiço é ORÇAMENTO, e trocar a cadência dele
         não é somar num canal);
       • a redução dos atributos de CD de técnica (pergunta aberta: no Afty
         QUALQUER atributo pode ser o da Técnica, e o livro fala de um conjunto);
       • a Restrição Definitiva concedida independente do nível (é uma
         Habilidade, e conceder Habilidade tem caminho próprio);
       • o Lutador Superior sem custo de PE (a habilidade base escolhida vira
         efeito em ORIGEM_ESCOLHA_EFEITOS, e o "sem custo" não tem canal porque
         o ataque de graça do Lutador Superior já ficava de fora do Motor: ver
         `lut_lutador_superior`, "economia de ação"). */
  gemeos: [
    // ---------- Bônus em Atributo ----------
    // "Caso um deles seja restringido, ao invés disso, apenas seus atributos
    // físicos são aumentados em 1." Os 2 pontos livres do outro caso são o pool
    // da característica, e não um canal: eles são DISTRIBUÍDOS pelo jogador.
    // ⚠ Cada efeito leva o NOME da característica que o gerou, e não o da
    // origem. Sem isso o hover de fontes mostrava "Gêmeos +1" e "Gêmeos −2" na
    // mesma Força, e não havia como saber qual linha era qual.
    { canal: "atributo", alvo: "forca", expr: "1 * tipo_restringido", nome: "Gêmeos: Bônus em Atributo" },
    { canal: "atributo", alvo: "destreza", expr: "1 * tipo_restringido", nome: "Gêmeos: Bônus em Atributo" },
    { canal: "atributo", alvo: "constituicao", expr: "1 * tipo_restringido", nome: "Gêmeos: Bônus em Atributo" },

    // ---------- Restrição Celestial · Restringido ----------
    // "seus atributos de força e destreza são reduzidos em 2 cada" e, depois da
    // morte, "você aumenta em 2 a sua força e destreza". O segundo CANCELA o
    // primeiro, então o efeito líquido é a redução enquanto o irmão vive.
    { canal: "atributo", alvo: "forca", expr: "-2 * tipo_restringido * (1 - irmao_morto)", nome: "Gêmeos: Restrição Celestial" },
    { canal: "atributo", alvo: "destreza", expr: "-2 * tipo_restringido * (1 - irmao_morto)", nome: "Gêmeos: Restrição Celestial" },
    // "recebe apenas 2 pontos de vigor por nível" e, depois, "+2 pontos de vigor
    // por nível". A base do Restringido é 4 por nível (ver `peBase`), então a
    // redução é de 2 por nível e o pós-morte volta ao normal.
    // ⚠ Vigor É o PE: mesma pilha, outro nome. Ver afty-restringido-sem-energia.
    { canal: "pe", expr: "-2 * nd * tipo_restringido * (1 - irmao_morto)", nome: "Gêmeos: Restrição Celestial" },

    // ---------- Restrição Celestial · Feiticeiros ----------
    // "Você recebe apenas 2 de energia por nível". A base do Tipo é 6 no
    // Conjurador, 5 no Misto e 4 no Combatente, então a redução é a diferença
    // até 2. Depois da morte: "+20 de energia máxima, recebendo também o base de
    // sua especialização +2 de energia por nível" (autor, 2026-08-07: um
    // Conjurador fica com 20 mais 8 por nível).
    {
      canal: "pe",
      expr: "(1 - tipo_restringido) * (1 - irmao_morto) * (-1) * nd * "
        + "(6 * tipo_conjurador + 5 * tipo_misto + 4 * tipo_combatente - 2)",
      nome: "Gêmeos: Restrição Celestial",
    },
    {
      canal: "pe",
      expr: "(1 - tipo_restringido) * irmao_morto * (20 + 2 * nd)",
      nome: "Gêmeos: Restrição Celestial",
    },
    /* "todos os atributos que podem ser usados para sua CD de técnica são
       reduzidos em 2" e, depois da morte, "seus atributos que tinham sido
       reduzidos aumentam em 2". O segundo CANCELA o primeiro, igual ao ramo do
       Restringido, então o efeito líquido é a redução enquanto o irmão vive.

       ⚠ LEITURA DA REGRA (autor, 2026-08-07): é o atributo que a criatura
       ESCOLHEU como o da Técnica, e só ele. No Afty qualquer um dos seis pode
       ser (`AFTY_TECNICA_ATTRS`), então a leitura literal de "todos os que
       podem ser usados" reduziria os seis, o que não é jogável. Os seis efeitos
       abaixo existem porque o canal `atributo` exige `alvo` fixo: a bandeira
       `tecnica_*` zera cinco deles. */
    ...["forca", "destreza", "constituicao", "inteligencia", "sabedoria", "presenca"].map((k) => ({
      canal: "atributo",
      alvo: k,
      expr: `-2 * (1 - tipo_restringido) * (1 - irmao_morto) * tecnica_${k}`,
      nome: "Gêmeos: Restrição Celestial",
    })),

    /* ---------- Ápice Corporal Humano (só depois da morte do irmão) ----------
       ⚠ O LIMITE DE 30 NÃO PRECISA DE EFEITO NENHUM, e isso foi medido: o
       `limTipo` do deriveAfty já dá 30 em Força, Destreza e Constituição a
       TODO Tipo Restringido, e esta característica só existe para o Gêmeo
       Restringido. Um canal `limiteAtributo` aqui somaria +10 sobre 30 e
       morreria no teto do sistema, virando linha morta no hover de fontes.

       O que a característica TRAZ de novo é o pool de alocação (+2 num físico a
       cada 6 níveis), que é declarado no catálogo e só aparece depois do
       interruptor da morte. Ver `apice_corporal_humano` em afty-origens.js. */

    /* ---------- Limite natural de 30 depois da morte ----------
       ⚠ NÃO ESTÁ AQUI, E FOI DE PROPÓSITO. Ele era um canal `limiteAtributo`
       de +10 nos seis, e o canal só existe no ESTÁGIO 1 do deriveAfty. O bônus
       de atributo da ORIGEM é aparado no estágio 0, então o mostrador subia
       para 30 e o bônus da própria origem continuava aparado em 20, com a ficha
       avisando "1 ponto de bônus perdido no limite 30" (relato do autor,
       2026-08-07: *"Pq estou limitado a 22? Se gêmeo levou meu limite para
       30?"*).

       Agora ele mora em `limiteAtributoDaOrigem`, junto do Ápice Corporal
       Humano do Restringido, que é o outro limite de origem do sistema. Limite
       que precisa valer para a ALOCAÇÃO e para o bônus de origem não pode
       chegar depois deles. */

    // ---------- Dupla Empenhada ----------
    // "o bônus de iniciativa de vocês são aplicados como um só". O número do
    // irmão é DIGITADO (`core.origem.iniciativaIrmao`), porque ele mora em outra
    // ficha. Ver a nota no topo da origem, em afty-origens.js.
    { canal: "iniciativa", expr: "iniciativa_irmao", nome: "Gêmeos: Dupla Empenhada" },
  ],

  // ⚠ INATO e DERIVADO foram as duas PRIMEIRAS origens feitas, e ficaram para
  // trás: elas declaravam concessão no shape antigo (`grants`), que só pintava um
  // selo âmbar na UI e não alimentava nada. Refeitas no estilo do Restringido e
  // do Sem Técnica em 2026-07-29, com efeito de verdade.

  // Talento Natural: "Recebe um Talento à escolha no 1° nível. Uma única vez, a
  // partir do 4° nível, pode escolher receber um Talento adicional."
  //
  // ⚠ Vaga EXCLUSIVA de TALENTO (autor, 2026-08-03). Até aqui saía por
  // `vagasHabilidade`, que é a pilha COMUM, então uma característica que o livro
  // escreve como "um Talento" pagava Habilidade de Especialização qualquer, e
  // confundia quem lia o contador. O canal `vagasTalento` é o irmão do
  // `vagasFeitico`: só Talento gasta, e o que sobra não vira nada.
  //
  // Marca Registrada: "Recebe um Feitiço adicional" → vaga EXCLUSIVA de Feitiço
  // (não serve para Habilidade Geral). A redução de 1 PE fica de fora: vale só
  // para aquele feitiço, `custoPE` não tem alvo, e afty-feiticos.js não lê o
  // Motor. Entra na passada dos Feitiços.
  inato: [
    { canal: "vagasTalento", expr: "1 + (nd >= 4)" },
    { canal: "vagasFeitico", expr: "1" },
  ],

  // Energia Antinatural: "Recebe uma Aptidão Amaldiçoada de Aura." Vaga, e não
  // gasto do orçamento: alvo NOMEADO é concessão grátis pela convenção do
  // projeto, e desde que o ND parou de conceder Aptidão Amaldiçoada o orçamento
  // sem a Habilidade Geral é zero, então gastar dele anularia a característica.
  // ⚠ A vaga é genérica: não existe vaga por categoria para prendê-la em Aura.
  //
  // A recuperação de PE (2× Maestria, 1/dia) é recurso de cena, não stat.
  // O Desenvolvimento Inesperado tem caminho próprio, fora do Motor
  // (`core.origem.desenvolvimento`), porque mexe no LIMITE do atributo.
  derivado: [
    { canal: "vagasAptidao", expr: "1" },
  ],

  // "Seu Deslocamento aumenta em 3 metros." O resto do Físico Abençoado é mesa
  // (imunidade a doença, vantagem contra veneno, dados de descanso curto).
  restringido: [
    { canal: "movimento", expr: "3" },
  ],

  // "você se torna treinado em 2 perícias a sua escolha" (Estudos Dedicados).
  // Pool LIVRE vira ORÇAMENTO, não escolha aninhada: a aba Perícias já é onde o
  // treino é escolhido, e lá o Mestre já custa 2 vagas sozinho.
  //
  // "Empenho Implacável", os degraus SEM escolha:
  //   nível 6  → uma Habilidade de Especialização adicional
  //   nível 15 → uma Habilidade de Especialização adicional
  //   nível 19 → uma Habilidade de Especialização E um Talento adicional
  //
  // ⚠ O degrau 19 SEPAROU em 2026-08-03 (autor), quando a vaga exclusiva de
  // Talento nasceu: ele valia 2 vagas comuns, o que deixava as duas metades
  // gastáveis em Habilidade de Especialização. Agora o texto sai ao pé da letra,
  // uma vaga de cada pilha.
  sem_tecnica: [
    { canal: "vagasPericia", expr: "2" },
    { canal: "vagasHabilidade", expr: "(nd >= 6) + (nd >= 15) + (nd >= 19)" },
    { canal: "vagasTalento", expr: "(nd >= 19)" },
  ],

  // Natureza Amaldiçoada: "Você recebe uma aptidão amaldiçoada a sua escolha, e
  // outra no 10° e 15° nível. Além disso, você recebe 1 ponto de energia
  // amaldiçoada adicional por nível."
  //
  // As três aptidões são VAGA, e não gasto de orçamento: alvo NOMEADO é
  // concessão grátis pela convenção do projeto, e desde que o ND parou de
  // conceder Aptidão Amaldiçoada o orçamento sem a Habilidade Geral é zero.
  // Mesma leitura da Energia Antinatural do Derivado.
  //
  // ⚠ O que a Maldição PODE pegar com essas vagas é outro assunto, e já estava
  // resolvido desde 2026-07-16: `abasAptidao` troca a categoria Energia Reversa
  // pela Maldição (as 18 exclusivas), porque uma maldição não usa energia
  // reversa, que é o que a destrói. Bate com o livro: "pode escolher aptidões da
  // lista padrão, exceto pelas aptidões de energia reversa".
  //
  // A Existência Metafísica é mesa inteira, e o "+2 no limite de um atributo a
  // cada 4 níveis" do Bônus em Atributo tem caminho próprio
  // (`core.origem.limites`), fora do Motor, igual ao Desenvolvimento Inesperado.
  maldicao: [
    { canal: "vagasAptidao", expr: "1 + (nd >= 10) + (nd >= 15)" },
    { canal: "pe", expr: "nd" },
  ],
};

export const CLA_EFEITOS = {
  // "Em todo nível par você recebe 1 ponto de energia amaldiçoada adicional.
  // Além disso, você também recebe 1 Feitiço adicional no primeiro nível e mais
  // um nos níveis 5, 10, 15 e 20."
  // ⚠ A vaga de Feitiço é EXCLUSIVA (não serve para Habilidade Geral), que é o
  // que `vagasFeitico` significa desde 2026-07-28.
  cla_gojo: [
    { canal: "pe", expr: "piso(nd / 2)" },
    { canal: "vagasFeitico", expr: "1 + (nd >= 5) + (nd >= 10) + (nd >= 15) + (nd >= 20)" },
  ],

  // O Inumaki não aparece de propósito: Olhos de Cobra e Presas concede AÇÃO a
  // um aliado, e a ficha não conta ações. Chave ausente é como o projeto diz
  // "esta entrada não tem efeito de ficha".

  // "Sempre que subir de nível, sua vida máxima aumenta em 1 ponto adicional. A
  // partir do nível 10, você soma o seu modificador de Constituição ao seu total
  // de vida."
  // ⚠ ASSUMIDO: "sempre que subir de nível" são as SUBIDAS, logo `nd - 1` (quem
  // é nível 1 nunca subiu). É a mesma contagem do hpBase do Combatente,
  // `12 + (nd - 1) * 6`.
  // ⚠ O `nd * mod_constituicao` da base já existe para todo mundo: o do nível 10
  // é um modificador A MAIS, uma vez só, e não por nível.
  cla_kamo: [
    { canal: "hp", expr: "nd - 1" },
    { canal: "hp", expr: "(nd >= 10) * mod_constituicao" },
  ],

  // "Você se torna treinado em 2 perícias quaisquer. Ao invés de receber
  // treinamento em 2 perícias, você pode escolher se tornar especialista em uma."
  // Mesmo caso do Estudos Dedicados. O Foco no Poder é marcação POR FEITIÇO e
  // mora na aba Habilidades.
  cla_zenin: [
    { canal: "vagasPericia", expr: "2" },
  ],
};

/**
 * Características de Anatomia do Feto Amaldiçoado Híbrido. 6 das 15 viram
 * número: o resto é condição, chance de dado, economia de ação ou efeito no
 * alvo, e continua valendo na mesa.
 */
export const ANATOMIA_EFEITOS = {
  // "Você recebe redução de dano contra danos físicos igual ao seu bônus de
  // treinamento." A resistência a um tipo físico no nível 10 é escolha
  // permanente, e não existe canal de RD por tipo físico.
  carapaca_mutante: [
    { canal: "rdFisico", expr: "maestria" },
  ],

  // "Você aumenta sua categoria de tamanho em 1 e recebe 1 ponto de vida
  // adicional por nível."
  // O tamanho passou a ser CANAL em 2026-08-08: era campo livre da ficha, e o
  // autor fechou (*"a Altura só pode ser maleável com Aptidões e poderes que
  // mexam com isso"*). O degrau traz junto a régua de Atletismo e Furtividade.
  desenvolvimento_exagerado: [
    { canal: "tamanho", expr: "1" },
    { canal: "hp", expr: "nd" },
  ],

  // "Você adiciona o seu bônus de treinamento na sua Iniciativa; enquanto em uma
  // cena de combate, você também adiciona seu bônus de treinamento na sua
  // Atenção." A Atenção entra pelo `quando`, que é o que a bancada liga.
  instinto_sanguinario: [
    { canal: "iniciativa", expr: "maestria" },
    { canal: "atencao", quando: "em_combate", expr: "maestria", duracao: "temporaria" },
  ],

  // "Você se torna treinado em Percepção e recebe um bônus de +2 em rolagens com
  // a perícia." Visão no Escuro e ignorar escuridão são sentidos, não número.
  olhos_sombrios: [
    { canal: "proficienciaPericia", alvo: "percepcao", expr: "1" },
    { canal: "bonusPericia", alvo: "percepcao", expr: "2" },
  ],

  // "Seu deslocamento aumenta em 4,5 metros e você passa a ignorar terreno
  // difícil que esteja no solo."
  pernas_extras: [
    { canal: "movimento", expr: "4.5" },
  ],

  // "+2 em testes de prestidigitação e, se tiver pelo menos duas mãos livres,
  // aplica esse bônus em testes de atletismo."
  // ⚠ ASSUMIDO: o recorte "com duas mãos livres" não existe na ficha, então o
  // Atletismo entra CHEIO. Mesmo tratamento da Noção e Preparação.
  bracos_extras: [
    { canal: "bonusPericia", alvo: "prestidigitacao", expr: "2" },
    { canal: "bonusPericia", alvo: "atletismo", expr: "2" },
  ],
};

/* ============================================================ */
/* APTIDÕES AMALDIÇOADAS                                         */
/* ============================================================ */
/**
 * Sexta frente do Motor (2026-07-30). A "passada de efeitos" que o autor adiou
 * em 2026-07-16 até o catálogo fechar. O catálogo fechou, então ela saiu.
 *
 * ⚠ O RENDIMENTO AQUI É BAIXO, e não é por falta de trabalho: as Aptidões
 * Amaldiçoadas são, na esmagadora maioria, ATIVAS e pagas em PE, com efeito
 * sobre INIMIGOS ou ALIADOS, ou expressas em DADOS com face própria. Nenhuma
 * dessas três coisas é número passivo de ficha. Ver o balanço por categoria em
 * `docs/afty-status.md`, que nomeia o bloqueio de cada uma que ficou de fora.
 *
 * As que entraram se dividem em duas famílias:
 *
 *  • PASSIVAS — valem sempre, e são o caso simples.
 *  • DE BANCADA — pagam PE por rodada ou por uso, então valem só com o estado
 *    ligado na Simulação de Combate (`quando` + `duracao: "temporaria"`). É o
 *    mesmo arranjo das habilidades de Lutador e Combatente, e o motivo de a
 *    bancada existir.
 *
 * ⚠ `estimulo_muscular` vale somente em Acrobacia ou Atletismo. O estado da
 * bancada continua único e sem seletor, mas as duas linhas direcionadas impedem
 * que o bônus apareça nas outras perícias (autor, 2026-08-16).
 *
 * ⚠ As duas duplas de melhoria (`cobertura_avancada` sobre `cobrir_se`, e
 * `estimulo_muscular_avancado` sobre `estimulo_muscular`) entram como DELTA por
 * cima da base, e não reescrevendo o valor. Mesmo padrão da Brutalidade
 * Aprimorada: assim as duas se compõem sem uma precisar saber da outra.
 */
export const APTIDAO_EFEITOS = {
  /* ---------- Aura: passivas ---------- */

  // "Você soma metade do seu Nível de Aptidão em Aura em testes de Furtividade."
  // O gasto de 1 PE para receber o nível INTEIRO no lugar da metade é por
  // rolagem, então fica de fora: não é estado, é decisão de uma jogada.
  aura_controlada: [
    { canal: "bonusPericia", alvo: "furtividade", expr: "piso(au / 2)" },
  ],

  // "Sempre que for agarrar um alvo, você adiciona metade do seu Nível de
  // Aptidão em Aura na rolagem de Atletismo, assim como na rolagem para evitar
  // que uma criatura escape."
  // Os dois lados do Agarrar: executar a manobra e segurar quem tenta escapar.
  aura_de_contencao: [
    { canal: "bonusManobra",    alvo: "agarrar", expr: "piso(au / 2)" },
    { canal: "resistirManobra", alvo: "agarrar", expr: "piso(au / 2)" },
  ],

  // "Sua Defesa aumenta em um valor igual a seu Nível de Aptidão em Aura."
  aura_macica: [
    { canal: "defesa", expr: "au" },
  ],

  // "Você recebe redução contra danos físicos, cortes, perfurações e impactos,
  // igual ao dobro do seu Nível de Aptidão em Aura."
  // É a base numérica que Aura Excessiva e Aura Elemental Reforçada citam.
  aura_reforcada: [
    { canal: "rdFisico", expr: "dobro(au)" },
  ],

  /* ---------- Aura: de bancada ---------- */

  // "No começo de toda rodada você pode escolher pagar 2 PE. Caso o faça, você
  // recebe RD contra todos os tipos de dano, exceto na alma, igual ao valor de
  // redução fornecido por Aura Reforçada."
  // "Todos os tipos exceto na alma" é a definição EXATA da RD Geral no Afty (é
  // por isso que o Dano na Alma ganhou canal próprio), então o encaixe é direto.
  // O valor é o de Aura Reforçada, que é dobro(au), e não uma segunda regra.
  aura_excessiva: [
    { canal: "rdGeral", expr: "dobro(au)", quando: "aura_excessiva", duracao: "temporaria" },
  ],

  /* ---------- Controle e Leitura: de bancada ---------- */

  // "Como uma Reação, quando receber dano, você pode gastar uma quantidade de PE
  // igual a 2 + o dobro do seu CL para receber pontos de vida temporários: para
  // cada ponto gasto, você recebe 4 PVs temporários."
  // O teto da faixa (2 + 2·CL) sai do resolveCombate, porque depende da ficha.
  cobrir_se: [
    { canal: "pvTemporario", expr: "4 * cobrir_se_pe", duracao: "temporaria" },
  ],

  // "Ao usar sua Reação para cobrir-se, cada ponto gasto passa a conceder 8
  // pontos de vida temporários." DELTA de +4 por ponto sobre o cobrir_se.
  cobertura_avancada: [
    { canal: "pvTemporario", expr: "4 * cobrir_se_pe", duracao: "temporaria" },
  ],

  // "Caso seja um teste (comum ou oposto), você pode gastar até uma quantidade
  // de PE igual a seu Nível de Aptidão em Controle e Leitura, recebendo um bônus
  // de +1 para cada PE gasto."
  // As duas perícias citadas recebem o mesmo estado, sem seletor: o jogador usa
  // o teste desejado e depois desativa a bancada.
  //
  // "Caso seja uma ação que empurre uma criatura ou arremesse um objeto
  // (Desarmar ou Empurrar), você pode gastar 2 PE para aumentar a distância em
  // um valor igual ao seu Nível de Aptidão em Controle e Leitura multiplicado
  // por 1,5 metros."
  //
  // Os outros dois estímulos (deslocamento de uma ação de movimento, e dobrar a
  // distância de um Pulo) ficam de fora: os dois mexem numa AÇÃO, e não no
  // deslocamento da ficha.
  estimulo_muscular: [
    { canal: "bonusPericia", alvo: "acrobacia", expr: "estimulo_teste", duracao: "temporaria" },
    { canal: "bonusPericia", alvo: "atletismo", expr: "estimulo_teste", duracao: "temporaria" },
    { canal: "distanciaEmpurrao",  expr: "cl * 1.5", quando: "estimulo_empurrao", duracao: "temporaria" },
  ],

  // "Caso gaste para receber bônus em um teste, cada PE gasto passa a somar +2
  // no teste." DELTA de +1 por ponto sobre o estimulo_muscular.
  // "Caso gaste para aprimorar uma ação de empurrar criatura ou arremessar
  // objeto, a distância é aumentada em um valor igual ao seu Nível de Aptidão
  // multiplicado por 3 metros." DELTA de mais cl · 1,5 sobre os cl · 1,5 da base.
  estimulo_muscular_avancado: [
    { canal: "bonusPericia", alvo: "acrobacia", expr: "estimulo_teste", duracao: "temporaria" },
    { canal: "bonusPericia", alvo: "atletismo", expr: "estimulo_teste", duracao: "temporaria" },
    { canal: "distanciaEmpurrao", expr: "cl * 1.5", quando: "estimulo_empurrao", duracao: "temporaria" },
  ],

  /* ---------- Energia Reversa: a CURA e a bancada ---------- */

  // "Sua capacidade básica é se curar: para cada ponto de energia reversa
  // gasto, você se cura em 2d6, somando seu modificador de presença ou
  // sabedoria ao total de cura. Nos níveis 10, 15 e 20, a cura aumenta em 1d6.
  // Você pode gastar um máximo de pontos de energia reversa por vez igual a
  // 1 + metade do seu nível de aptidão."
  //
  // ⚠ A escada de 10/15/20 vale POR PONTO GASTO (autor, 2026-08-03), e não uma
  // vez na rolagem: um ND 20 gastando 3 PER rola 3 × 5d6. Era assunção desde
  // 2026-08-01 e agora é regra confirmada.
  // ⚠ O MODIFICADOR entra UMA vez, no total, e é o MAIOR entre Presença e
  // Sabedoria (decisão C3). Por isso `curaDados` é por ponto e `curaFixa` não.
  //
  // A linha aparece na aba Habilidades. Ela é AÇÃO COMUM, então não vira número
  // de ficha sozinha: quem a traz para a Regeneração é o Fluxo Constante, mais
  // abaixo.
  energia_reversa: [
    { canal: "curaDados",  alvo: "cura_energia_reversa", expr: "2 + (nd >= 10) + (nd >= 15) + (nd >= 20)" },
    { canal: "curaFaces",  alvo: "cura_energia_reversa", expr: "6" },
    { canal: "curaFixa",   alvo: "cura_energia_reversa", expr: "mod_pre_ou_sab" },
    { canal: "curaPontos", alvo: "cura_energia_reversa", expr: "1 + piso(er / 2)" },
  ],

  // "Ao invés de decidir um alvo, você pode optar por realizar a rolagem de cura
  // e dividir o total do resultado entre todas as criaturas dentro de um
  // alcance. A quantidade máxima de pontos que podem ser gastos aumenta em 2."
  // O alcance em metros é da mesa (não há alvo múltiplo na ficha), e o que sobra
  // de número é o teto de pontos. O rótulo "Grupo" da linha sai do catálogo.
  cura_em_grupo: [
    { canal: "curaPontos", alvo: "cura_energia_reversa", expr: "2" },
  ],

  // A cura de Energia Reversa é AÇÃO COMUM, e por isso a aptidão base fica de
  // fora da REGENERAÇÃO. Quem a traz para cá é o Fluxo Constante: "no começo do
  // seu turno, você pode se curar com energia reversa seguindo as mesmas regras
  // da cura básica, porém como uma ação livre". Cura no início do turno É o
  // canal de Regeneração, que já carrega dados, faces e parte fixa.
  //
  // ⚠ As mesmas duas leituras da cura acima valem aqui, e as duas linhas têm de
  // andar juntas: são a MESMA regra em dois lugares (uma por ação, uma por
  // turno). Mexeu numa, confira a outra.
  fluxo_constante: [
    { canal: "regeneracaoDados", expr: "fluxo_per * (2 + (nd >= 10) + (nd >= 15) + (nd >= 20))", duracao: "temporaria" },
    { canal: "regeneracaoFaces",  expr: "6", quando: "fluxo_per", duracao: "temporaria" },
    { canal: "regeneracaoFixa",      expr: "max(mod_presenca, mod_sabedoria)", quando: "fluxo_per", duracao: "temporaria" },
  ],

  // "O dado da cura se torna d8 e você passa a somar o dobro do seu modificador
  // de presença ou sabedoria. A quantidade máxima de pontos que podem ser gastos
  // passa a ser igual a 1 + seu nível de aptidão."
  // O dado vale o MAIOR entre as fontes (é assim que o canal funciona), então o
  // 8 simplesmente vence o 6. O modificador entra como DELTA de mais uma vez,
  // que somado ao da base dá o dobro pedido.
  //
  // ⚠ O teto de PER é DELTA também: `1 + er` menos o `1 + piso(er / 2)` da base
  // dá `teto(er / 2)`. Na REGENERAÇÃO ele não passa por canal nenhum, porque lá
  // ele é o teto da FAIXA da bancada e sai do resolveCombate.
  cura_amplificada: [
    { canal: "curaFaces",  alvo: "cura_energia_reversa", expr: "8" },
    { canal: "curaFixa",   alvo: "cura_energia_reversa", expr: "mod_pre_ou_sab" },
    { canal: "curaPontos", alvo: "cura_energia_reversa", expr: "teto(er / 2)" },
    { canal: "regeneracaoFaces", expr: "8", quando: "fluxo_per", duracao: "temporaria" },
    { canal: "regeneracaoFixa",     expr: "max(mod_presenca, mod_sabedoria)", quando: "fluxo_per", duracao: "temporaria" },
  ],

  /* ---------- Especiais ---------- */

  // Reversão de Técnica: "Ao obter esta aptidão, você recebe um Feitiço
  // adicional, a qual obrigatoriamente deve ser uma reversão."
  // ⚠ Vaga EXCLUSIVA de Feitiço, e não vaga comum (autor, 2026-08-03): quem dá
  // Feitiço adicional dá vaga que não serve para Habilidade Geral. Estava sem
  // efeito nenhum até aqui, então a aptidão concedia o Feitiço só no texto.
  //
  // O "obrigatoriamente uma reversão" e o custo aumentado pelo nível do Feitiço
  // ficam de fora: são regra do Feitiço criado, e afty-feiticos.js não lê o
  // Motor. Entram junto com a passada dos Feitiços.
  reversao_de_tecnica: [
    { canal: "vagasFeitico", expr: "1" },
  ],

  /* ========== APTIDÕES DE MALDIÇÃO (2026-08-01) ========== */
  /* Exclusivas da origem Maldição, que OCUPA o lugar da Energia Reversa: uma
     maldição não usa energia reversa, que é o que a destrói. Por isso o
     sub-grupo "Especiais" abaixo é o espelho da cura de Energia Reversa, com a
     moeda trocada de PER para PE. */

  // "Você pode utilizar tanto força quanto destreza com a sua arma natural."
  //
  // ⚠ A ESCADA DE DADO VIROU NÍVEL DE DANO (autor, 2026-08-08): *"a cada vez que
  // o Dano subir, sobe +1 Nível. Isso vale para ambas e se somam."* Até aqui ela
  // era descartada, pela regra de que o dado listado de arma nenhuma conta
  // (2026-07-27). A regra do dado continua de pé — o que mudou é que o DEGRAU
  // dela não se perde mais: cada subida do texto vale um Nível de Dano no Ataque
  // Básico, que é onde a arma natural bate.
  //
  // 1d8 → 1d10 no 5 → 1d12 no 9 → 2d10 no 13 → 2d12 no 17. Quatro subidas.
  mal_armas_naturais: [
    { canal: "finezaAtaque", alvo: "corpo", expr: "1" },
    { canal: "nivelDano", alvo: "basico", expr: "(nd >= 5) + (nd >= 9) + (nd >= 13) + (nd >= 17)" },
  ],

  // A escada desta é a mesma leitura, e SOMA com a de cima (as duas são tidas
  // juntas: esta exige aquela). Ela começa um degrau acima, porque "o dano de
  // suas armas naturais SE TORNA 1d10" já é uma subida a partir do 1d8, e daí
  // sobe de novo no 5, no 9, no 13 e no 17. Cinco subidas.
  //
  // O `+1 nível de dano nos níveis 8, 12, 16 e 20` é OUTRA frase do texto, e por
  // isso é outra linha: as duas convivem de propósito.
  //
  // ⚠ Cada uma leva `nome` PRÓPRIO: sem isso o hover de fontes mostraria "Armas
  // Naturais Aprimoradas" duas vezes com números diferentes, e não haveria como
  // saber qual linha do texto é qual.
  mal_armas_naturais_aprimoradas: [
    { canal: "nivelDano", alvo: "basico", nome: "Armas Naturais Aprimoradas (escada)",
      expr: "1 + (nd >= 5) + (nd >= 9) + (nd >= 13) + (nd >= 17)" },
    { canal: "nivelDano", alvo: "basico", nome: "Armas Naturais Aprimoradas (bônus)",
      expr: "(nd >= 8) + (nd >= 12) + (nd >= 16) + (nd >= 20)" },
  ],

  // "você aumenta uma categoria de tamanho e passa a receber +1 de vida máxima
  // por nível."
  // O tamanho virou canal em 2026-08-08 (ver `desenvolvimento_exagerado`).
  // ⚠ O SEGUNDO uso (repetível a partir do 10°, até Enorme) continua de fora: o
  // shape de ids únicos não deixa escolher a mesma aptidão duas vezes. Quem
  // pegar as duas vezes na mesa soma o segundo degrau à mão.
  mal_crescimento_corporal: [
    { canal: "tamanho", expr: "1" },
    { canal: "hp", expr: "nd" },
  ],

  // "Você recebe seu bônus de treinamento em sua percepção; além disso, sua
  // atenção passa a ter como base 12 ao invés de 10."
  // ⚠ Os dois efeitos empilham de propósito: Atenção = 10 + bônus de Percepção,
  // então a Maestria na Percepção já sobe a Atenção junto, e o +2 é a troca da
  // BASE por cima disso. É o que o texto diz, em duas frases separadas.
  mal_olhos_adicionais: [
    { canal: "bonusPericia", alvo: "percepcao", expr: "maestria" },
    { canal: "atencao", expr: "2" },
  ],

  // "Você recebe RD a danos físicos igual ao seu bônus de treinamento."
  mal_revestimento: [
    { canal: "rdFisico", expr: "maestria" },
  ],

  // "A RD a danos físicos conferido pela aptidão passam a ser o seu modificador
  // de constituição." É TROCA, não soma, e o Motor não tem canal de substituição:
  // entra como DELTA sobre o Revestimento, que é o mesmo desenho da Cobertura
  // Avançada sobre o Cobrir-se.
  //
  // ⚠ Protegido por `tem_mal_revestimento`, porque o livro NÃO lista o
  // Revestimento como pré-requisito (ver a nota no catálogo) e sem ele o delta
  // daria um número inventado. Sem Revestimento não há RD para trocar, então
  // não há efeito. Foi por esta linha que o `tem_*` passou a cobrir Aptidões.
  mal_revestimento_evoluido: [
    { canal: "rdFisico", expr: "mod_constituicao - maestria", quando: "tem_mal_revestimento" },
  ],

  // "Você recebe seu bônus de treinamento em rolagens de atletismo OU
  // acrobacia." UM ou OUTRO (autor, 2026-08-01), e não os dois nem o maior:
  // a aptidão declara `opcoes` no catálogo e cada valor vira a booleana
  // `opt_mal_superioridade_fisica_<valor>`. As duas linhas convivem porque só
  // uma delas tem o `quando` satisfeito.
  //
  // A vantagem na manobra por 5 PE fica de fora: vantagem não é número.
  mal_superioridade_fisica: [
    { canal: "bonusPericia", alvo: "atletismo", expr: "maestria",
      quando: "opt_mal_superioridade_fisica_atletismo" },
    { canal: "bonusPericia", alvo: "acrobacia", expr: "maestria",
      quando: "opt_mal_superioridade_fisica_acrobacia" },
  ],

  // "Seu máximo de energia amaldiçoada aumenta em um valor igual ao seu bônus
  // de treinamento."
  mal_estoque_ampliado: [
    { canal: "pe", expr: "maestria" },
  ],

  // "Caso não possua, você recebe treinamento em Feitiçaria; caso possua, você
  // se torna mestre em feitiçaria. Além disso, você recebe uma habilidade de
  // técnica adicional, recebendo mais uma no 10° nível."
  //
  // O `prof_feiticaria` é a proficiência ESCOLHIDA na ficha (0, 1 ou 2), então
  // a expressão concede 1 (Treinado) para quem não tem e 2 (Mestre) para quem
  // já tem. Mesmo truque da Força Imparável do Restringido.
  // "Habilidade de técnica" É Feitiço, e a vaga é a EXCLUSIVA (não serve para
  // Habilidade Geral).
  mal_extracao_de_potencial: [
    { canal: "proficienciaPericia", alvo: "feiticaria", expr: "1 + (prof_feiticaria >= 1)" },
    { canal: "vagasFeitico", expr: "1 + (nd >= 10)" },
  ],

  // "No começo de toda rodada você recebe uma quantidade de pontos de vida
  // temporários igual ao seu modificador de Constituição multiplicado pela
  // metade do seu bônus de treinamento."
  // Automática, mas só existe em combate: mesmo desenho da Atenção do Instinto
  // Sanguinário, que também é passiva presa ao `em_combate`.
  mal_protecao_constante: [
    { canal: "pvTemporario", quando: "em_combate",
      expr: "mod_constituicao * piso(maestria / 2)", duracao: "temporaria" },
  ],

  // "Como uma ação comum, você pode gastar até 2 pontos de energia amaldiçoada
  // para se curar; para cada 2 pontos gastos, você se cura em 2d6 + seu
  // modificador de constituição ou presença. Nos níveis 10, 15 e 20, a cura
  // aumenta em 1d6. A quantidade máxima de pontos que podem ser gastos para se
  // curar passa a ser igual ao seu bônus de treinamento por rodada."
  //
  // Espelho exato da cura de Energia Reversa, com a moeda trocada: aqui o bloco
  // custa 2 PE, e não 1 PER. As duas escalas valem POR BLOCO GASTO (autor,
  // 2026-08-03) e o modificador entra UMA vez, no total.
  mal_regeneracao_corporal: [
    { canal: "curaDados",  alvo: "cura_regeneracao_corporal", expr: "2 + (nd >= 10) + (nd >= 15) + (nd >= 20)" },
    { canal: "curaFaces",  alvo: "cura_regeneracao_corporal", expr: "6" },
    { canal: "curaFixa",   alvo: "cura_regeneracao_corporal", expr: "max(mod_constituicao, mod_presenca)" },
    { canal: "curaPontos", alvo: "cura_regeneracao_corporal", expr: "maestria" },
  ],

  // A Regeneração Corporal é AÇÃO COMUM, e por isso a aptidão base não vira
  // número de ficha sozinha. Quem a torna automática é o FLUXO IMPARÁVEL ("no
  // começo do seu turno, como uma ação livre"), e cura no início do turno É o
  // canal de Regeneração. Espelho exato do Fluxo Constante da Energia Reversa,
  // com PE no lugar de PER.
  //
  // ⚠ O modificador entra UMA VEZ, e não por par de pontos: é a leitura que o
  // autor confirmou para a Energia Reversa em 2026-07-30, e a Regeneração
  // Ampliada ("passa a somar o dobro") só faz sentido com ela.
  // ⚠ "constituição OU presença" é o MAIOR dos dois (decisão C3, autor
  // 2026-07-30, que vale para todas as fórmulas com esse "ou").
  mal_fluxo_imparavel: [
    { canal: "regeneracaoDados",
      expr: "piso(regeneracao_pe / 2) * (2 + (nd >= 10) + (nd >= 15) + (nd >= 20))",
      duracao: "temporaria" },
    { canal: "regeneracaoFaces", expr: "6", quando: "regeneracao_pe", duracao: "temporaria" },
    { canal: "regeneracaoFixa", expr: "max(mod_constituicao, mod_presenca)",
      quando: "regeneracao_pe", duracao: "temporaria" },
  ],

  // "O seu dado de cura com a Regeneração Corporal aumenta para d8 e você passa
  // a somar o dobro do seu modificador de constituição ou presença. A quantidade
  // máxima de pontos que podem ser gastos passa a ser igual ao dobro do seu
  // bônus de treinamento por rodada."
  // O dado vale o MAIOR entre as fontes, então o 8 vence o 6; o modificador
  // entra como DELTA de mais uma vez, que somado ao da base dá o dobro. O teto
  // de PE é DELTA de mais uma Maestria, que dobra a da base.
  // ⚠ Na REGENERAÇÃO o teto dobrado não passa por canal: lá ele é o teto da
  // FAIXA da bancada (ver regeneracaoPE no resolveCombate).
  mal_regeneracao_ampliada: [
    { canal: "curaFaces",  alvo: "cura_regeneracao_corporal", expr: "8" },
    { canal: "curaFixa",   alvo: "cura_regeneracao_corporal", expr: "max(mod_constituicao, mod_presenca)" },
    { canal: "curaPontos", alvo: "cura_regeneracao_corporal", expr: "maestria" },
    { canal: "regeneracaoFaces", expr: "8", quando: "regeneracao_pe", duracao: "temporaria" },
    { canal: "regeneracaoFixa", expr: "max(mod_constituicao, mod_presenca)",
      quando: "regeneracao_pe", duracao: "temporaria" },
  ],

  // "O seu dado de cura com a Regeneração Corporal aumenta para d10."
  mal_regeneracao_maxima: [
    { canal: "curaFaces", alvo: "cura_regeneracao_corporal", expr: "10" },
    { canal: "regeneracaoFaces", expr: "10", quando: "regeneracao_pe", duracao: "temporaria" },
  ],
};
