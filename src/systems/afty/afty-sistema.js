/**
 * ============================================================
 * SISTEMA — quem é a ficha, criatura do mestre ou personagem do jogador
 * ============================================================
 * O Grimório Afty e a Ficha de Player são o MESMO livro lido por dois lados.
 * Origens, Especializações, Aptidões, Habilidades, Feitiços, Equipamentos,
 * Interlúdios, o Motor de Automação e a DSL são os mesmos objetos, e é por isso
 * que o `/Player` não é uma cópia de `src/systems/afty/`: ele é a mesma pasta
 * com uma chave de sistema.
 *
 * Decisão do autor em 2026-08-30, ao pedir a rota. A alternativa era duplicar
 * 71 arquivos e 61.515 linhas, mais 36 arquivos de assert, e pagar todo conserto
 * duas vezes. O custo que sobra é o simétrico: mexer aqui mexe nos dois, e é
 * exatamente por isso que existe a lista de DIVERGENCIAS mais abaixo.
 *
 * ------------------------------------------------------------
 * ⚠ A REGRA QUE SEGURA TUDO: O SISTEMA VEM DA FICHA, NÃO DA ROTA
 * ------------------------------------------------------------
 * A rota decide só em que sistema uma ficha NOVA nasce. Daí em diante quem
 * responde "que sistema é este" é o campo `rulesVersion` da própria ficha.
 *
 * Isso não é preciosismo. O autor decidiu (2026-08-30) que os ENCONTROS são
 * COMPARTILHADOS entre as duas rotas, para o mestre pôr personagem e criatura na
 * mesma iniciativa. Um combatente do Afty guarda a ficha inteira e não um id
 * (ver `encontros/afty-encontro.js`), então a mesma tela renderiza fichas dos
 * DOIS sistemas ao mesmo tempo. Uma variável global de sistema, ou um contexto
 * de React preso à rota, daria a resposta errada para metade da lista, e daria
 * calada: os números sairiam plausíveis e trocados.
 *
 * Por isso `deriveAfty(creature)` NÃO ganhou parâmetro de sistema. Ele já
 * recebe a criatura, e a criatura já sabe quem é.
 *
 * ------------------------------------------------------------
 * O QUE DIVERGE, E O QUE NÃO
 * ------------------------------------------------------------
 * O LUGAR de cada divergência que o repositório conhece está tabelado em
 * DIVERGENCIAS, com a citação de onde ela está escrita. Uma entrada `ativa:
 * false` é divergência declarada e ainda não implementada, e os dois lados usam
 * o ramo `afty` enquanto ela estiver assim.
 *
 * ⚠ ESTE CABEÇALHO DIZIA "hoje NADA diverge, /Player é clone exato do /Afty" e
 * envelheceu calado, que é exatamente o defeito que a tabela abaixo existe para
 * evitar. Não escreva aqui um placar que precise de manutenção: quem conta é o
 * assert do clone em `asserts/t-sistema.mjs`, que lista as ligadas a partir da
 * própria tabela e falha no dia em que a lista muda.
 */

/* ============================================================ */
/* OS DOIS SISTEMAS                                              */
/* ============================================================ */

/**
 * ⚠ `id` é também o valor de `rulesVersion` gravado na ficha e o sufixo das
 * chaves de localStorage. Os três eram três strings soltas antes desta data, e
 * juntá-las é o que impede uma ficha de Player nascer com chave de Afty.
 *
 * `artigo` e `substantivo` existem porque a mesma tela fala de "criatura" num
 * lado e de "personagem" no outro, e frase montada com `if` espalhado pela UI
 * envelhece torta.
 */
export const SISTEMAS = {
  afty: {
    id: "afty",
    label: "Grimório Afty",
    substantivo: "criatura",
    substantivoPlural: "criaturas",
    artigo: "a",
    rota: "/Afty",
    selo: "⚗️ Grimório Afty · privado",
    seloTitulo: "Ambiente privado. Grimório Homebrew do Afty, com dados isolados do grimório público.",
  },
  player: {
    id: "player",
    label: "Ficha de Player",
    substantivo: "personagem",
    substantivoPlural: "personagens",
    artigo: "o",
    rota: "/Player",
    selo: "🎲 Ficha de Player · privado",
    seloTitulo: "Ambiente privado. Ficha de Player do Grimório do Afty, com dados isolados do grimório público.",
  },
};

/** O sistema em que uma ficha sem marca nenhuma cai. */
export const SISTEMA_PADRAO = "afty";

export const SISTEMA_IDS = Object.keys(SISTEMAS);

/** Normaliza qualquer entrada suja para um id de sistema conhecido. */
export const normalizaSistema = (valor) =>
  (typeof valor === "string" && SISTEMAS[valor.toLowerCase()]) ? valor.toLowerCase() : SISTEMA_PADRAO;

/**
 * Quem é esta ficha. É a função que o resto do sistema chama, e ela lê a ficha,
 * nunca a rota.
 *
 * ⚠ Ficha da 2.5.2 (`rulesVersion: "2.5.2"`) nunca chega aqui, porque ela abre
 * no builder da 2.5.2 e não neste. Se chegar, cai no padrão em vez de quebrar,
 * que é a mesma escolha que `normalizaSistema` faz com lixo.
 */
export const sistemaDaFicha = (ficha) => normalizaSistema(ficha?.rulesVersion);

/** O registro completo, e não só o id. */
export const getSistema = (valor) => SISTEMAS[normalizaSistema(valor)];

export const ehPlayer = (valor) => normalizaSistema(valor) === "player";

/**
 * Sufixo das chaves de localStorage daquele sistema.
 *
 * ⚠ O Afty devolve `_afty`, que é o pedaço que as chaves já gravadas desde
 * 2026-07-15 usam. Mudar o formato apagaria o grimório de quem já usa, então o
 * Player nasce seguindo o mesmo molde em vez de o molde mudar para os dois.
 */
export const sufixoDeChave = (valor) => `_${normalizaSistema(valor)}`;

/* ============================================================ */
/* DIVERGÊNCIAS CONHECIDAS                                       */
/* ============================================================ */

/**
 * Toda regra que o repositório JÁ SABE que muda entre criatura e jogador.
 *
 * ⚠ Isto é DADO, e não comentário, porque comentário envelhece calado. É o
 * mesmo problema que o requisito `nota` tem (ver `docs/afty-status.md`): a
 * anotação de "quando o sistema X nascer, revisar aqui" nunca avisa ninguém no
 * dia em que X nasce. Hoje X nasceu.
 *
 * Cada entrada carrega a CITAÇÃO de onde a divergência está escrita, porque
 * todas as quatro já estavam no código antes de existir rota de Player, e
 * nenhuma delas foi inventada aqui.
 *
 *   id       chave lida por `regraDo`
 *   tipo     "regra" muda NÚMERO, "tela" muda só layout
 *   onde     arquivo em que a divergência está anotada
 *   fonte    o texto que a declara, verbatim do comentário original
 *   afty     o que vale na ficha de criatura
 *   player   o que vale na ficha de jogador
 *   ativa    se o código JÁ desvia. Falso enquanto o autor não fechar a regra
 *
 * ⚠ `ativa: false` significa que os DOIS lados usam o ramo `afty`. É o que faz
 * o `/Player` ser hoje um clone exato, e é medido por assert.
 */
export const DIVERGENCIAS = [
  {
    /* Guarda Inabalável e Resistência Parcial são mecânica de PATAMAR, e o
       jogador não tem Patamar. Autor, 2026-08-30: "deixam de existir na ficha de
       jogador, sem aparecer nem como zero".

       ⚠ O "nem como zero" é a metade que muda código. As duas já valem 0 fora de
       Calamidade e Beyond, então bastaria o Patamar sumir para o número ficar
       certo. O que o autor pediu é que a LINHA suma: um zero sem dono na tela é
       ruído, e é a mesma regra da quarta célula do Domínio Simples. */
    id: "guardaEresistenciaParcial",
    tipo: "regra",
    onde: "afty-derive.js, blocos Guarda Inabalável e Resistência Parcial",
    fonte: "E Guarda, Resistências Parcial e etc deixam de existir na ficha de jogador, sem aparecer nem como zero. (autor, 2026-08-30)",
    afty: "Guarda e Resistência Parcial por Patamar",
    player: "as duas não existem, e não aparecem nem zeradas",
    ativa: true,
  },
  {
    /* ⚠ ESTA ENTRADA EXISTE PORQUE O CAMPO SÓ TINHA SUMIDO DA TELA. O
       `pvPePorEspecializacao` tirou Tipo e Patamar do formulário em 2026-08-30,
       e o comentário do builder afirmava que "no jogador nada mais os consulta".
       Não era verdade: `core.patamar` continuava sendo lido por DOIS pontos que
       produzem número, sem passar por divergência nenhuma.

         contadorHabilidades(bt, patamar)   o contador da aba Habilidades
         resolveDano(..., { patamar })      o coeficiente e a face do dado

       Medido antes do conserto, num jogador de nível 20: o contador ia de 12
       para 18 só por haver `patamar: "beyond"` gravado no JSON. E o caminho para
       uma ficha assim existe, porque importar um JSON sem `rulesVersion` dentro
       do /Player grava `rulesVersion: "player"` e preserva o `core.patamar` que
       veio junto (useCreatureStorage.js, `c.rulesVersion ?? defaultRulesVersion`).

       ⚠ O CONSERTO É NA DEFINIÇÃO, e não em cada leitor. O `patamar` vira
       "comum" logo onde ele nasce no deriveAfty, então todo leitor presente e
       futuro pega o valor neutro sem precisar lembrar da regra. Guardar leitor
       por leitor é o que produziu este bug: dois dos cinco foram esquecidos.

       ⚠ "comum" e não `null`: ele é o valor NEUTRO das fórmulas (nenhum bônus de
       contador, multiplicador de PV 1, coeficiente de dano 2/1), e um `null`
       quebraria os leitores que indexam tabela por patamar. Quem o autor pediu
       para não aparecer "nem como zero" é a Guarda e a Resistência Parcial, e
       essas duas seguem devolvendo `null` pela divergência delas. */
    id: "patamarDoJogador",
    tipo: "regra",
    onde: "afty-derive.js, a definição de `patamar`",
    fonte: "Não existe PATAMAR para Jogadores, isso é algo exclusivo de criaturas que será removido de Jogador. (autor, 2026-08-31)",
    afty: "Comum, Desafio, Calamidade ou Beyond, escolhido na ficha",
    player: "não existe, e toda fórmula lê o valor neutro",
    ativa: true,
  },
  {
    /* Autor, 2026-08-30: "Começa em 0. E é recebida por Itens, Especializações,
       Aptidões e outras fontes." Ou seja, o jogador não perde a RD: ele perde a
       BASE dela. Os canais `rdGeral`, `rdEspecifico` e o bônus de equipamento
       continuam somando normalmente, e é por isso que esta divergência mexe só
       na base e não no total. */
    /* ⚠ ELA SE MORDERIA NO JOGADOR, e é o que a torna divergência e não gosto.
       A tabela de grau do livro dele CONCEDE encantamentos ("Terceiro: Recebe um
       Encantamento"), então cobrar o grau por usar o que o grau deu tira com uma
       mão o que a outra entregou: um Escudo Pesado de Primeiro Grau, que o livro
       diz dar RD 4 e três encantamentos, ficava com RD 1 ao usar os três.

       Na criatura a regra fica, porque lá ela nasceu como PREÇO, com a
       justificativa escrita de que "encantamento não é recomendado para
       criatura". */
    id: "reducaoDeGrau",
    tipo: "regra",
    onde: "afty-equipamentos.js, resolveFerramenta, o rankCalculo",
    fonte: "A Redução de Grau por Encantamento não funciona igual para Player. Jogador não perde Bônus Numérico ou qualquer bônus por pegar Encantamentos. (autor, 2026-09-01)",
    afty: "cada encantamento comprado desce um degrau do grau de cálculo",
    player: "o grau de cálculo é o grau real, e encantamento não cobra nada",
    ativa: true,
  },
  {
    /* ⚠ O JOGADOR GANHA DANO FIXO PELO GRAU, e é escada própria: o rank, de 1 a
       5. A da criatura é outra (4, 8, 12, 16, 20, em DANO_ADICIONAL_ARMA), e o
       jogador não usava nenhuma das duas até 2026-09-01.

       O ACERTO segue em zero no jogador, e essa metade não mudou: o autor
       nomeou só o Dano Fixo. Ver `danoPorArma`, que é onde o Acerto cai. */
    id: "danoFixoPorGrau",
    tipo: "regra",
    onde: "afty-pericias.js, linhaDeDanoJogador",
    fonte: "Arma de Jogador recebe +1 de Dano Fixo por Grau. Grau Especial = +5 Dano Fixo. Quarto Grau = +1 Dano Fixo. (autor, 2026-09-01)",
    afty: "a tabela DANO_ADICIONAL_ARMA: 4, 8, 12, 16 e 20",
    player: "o rank do grau: 1, 2, 3, 4 e 5",
    ativa: true,
  },
  {
    id: "rdEscudoFisico",
    tipo: "regra",
    onde: "afty-equipamentos.js, o ramo de escudo do resolveEquipamentos, e o pseudo-canal rdEscudo",
    fonte: "1 e 2 no Livro de Jogador é RD Físico. 3. Volte o encantamento Isolante, somente para Jogador. (autor, 2026-08-31)",
    afty: "a RD do escudo, a do grau da Ferramenta e o Reforçado somam na RD Geral",
    player: "as três somam na RD Física, e o encantamento Isolante volta a existir",
    ativa: true,
  },
  {
    /* ⚠ AS TRÊS PARTES SÃO UMA COISA SÓ, e quem prova isso é o Isolante. O texto
       dele diz que "a redução de dano do escudo passa TAMBÉM a ser aplicado a um
       tipo de dano elemental à sua escolha", e foi exatamente por isso que ele
       foi REMOVIDO em 2026-08-01: com a RD do escudo virando Geral, que já cobre
       todo tipo menos alma, ele não tinha o que estender e virou letra morta.

       Pedir o Isolante de volta é, portanto, dizer que a RD do escudo no jogador
       NÃO é Geral. O autor citou nominalmente a tabela de grau e o Reforçado, e a
       RD base do escudo (a coluna 2/2/4/6) vem junto pelo mesmo raciocínio: se
       ela fosse Geral, o Isolante continuaria sem função no jogador e o pedido
       dele não faria sentido.

       Do lado da CRIATURA nada muda: a decisão de 2026-08-01 ("RD Geral, exceto
       Alma") segue valendo lá, e é por isso que isto é divergência e não
       correção. */
    id: "rdBase",
    tipo: "regra",
    onde: "afty-derive.js, blocos RD Geral e RD Específico",
    fonte: "Começa em 0. E é recebida por Itens, Especializações, Aptidões e outras fontes. (autor, 2026-08-30)",
    afty: "base por Tipo, mais equipamento e canais",
    player: "base zero, e todo o valor vem de equipamento, Especialização, Aptidão e canais",
    ativa: true,
  },
  {
    /* O campo Quantidade de PE não existe na ficha de jogador. Ele mexia em duas
       coisas, e as duas mudaram no mesmo dia: o ajuste de PE some com o campo, e
       o +1 Nível de Aptidão saiu dele em AMBOS os sistemas e virou efeito da
       Aptidão Raio Negro. Por isso esta divergência cobre só o ajuste de PE. */
    id: "quantidadeDePE",
    tipo: "regra",
    onde: "afty-derive.js, bloco PE",
    fonte: "Quantidade de PE fica só para criaturas, e só mexe em PE. (autor, 2026-08-30)",
    afty: "ajuste de −ND a +ND conforme a escolha",
    player: "não existe, e o PE fica só na base mais os canais",
    ativa: true,
  },
  {
    /* LIGADA em 2026-08-30, com a tabela do livro em mão. Ela é a MAIOR das
       divergências, e carrega quatro coisas de uma vez:

         PV     base da classe inicial, mais `pvPorNivel` de cada nível
         PE     `pePorNivel` de cada nível, e o Mod. de Técnica UMA ÚNICA VEZ
         Alma   igual ao PV, e o canal `almaMax` soma em pontos e não em porcento
         Patamar  multiplicador de PV vira 1, porque o jogador não tem Patamar

       ⚠ A CLASSE INICIAL É A PRIMEIRA DA LISTA (autor, 2026-08-30, escolhendo
       entre marca explícita e maior nível). Só ela paga o `pvPrimeiro`. Reordenar
       a lista muda o PV, e o autor sabe: foi a opção que ele escolheu, contra
       uma marca própria na ficha.

       ⚠ A Alma entra AQUI e não em divergência própria, porque "Máximo de Alma
       igual ao PV" faz das duas uma conta só. Separá-las daria duas divergências
       que nunca podem estar em estados diferentes. */
    id: "pvPePorEspecializacao",
    tipo: "regra",
    onde: "afty-derive.js, blocos HP, PE e Alma",
    fonte: "PV e PE saem da Especialização. O valor de Integridade da Alma de um personagem é igual ao seu máximo de Pontos de Vida. (autor e livro, 2026-08-30)",
    afty: "base e por nível vêm do Tipo, com multiplicador de Patamar, e a Alma é porcentagem sobre 100",
    player: "base da classe inicial mais o valor por nível de cada classe, e a Alma é uma pilha do tamanho do PV",
    ativa: true,
  },
  {
    /* Os quatro "valores adicionais" do livro do jogador, verbatim:

       "Defesa = 10 + Modificador de Destreza + Metade do seu Nível + Outros Bônus"
       "Iniciativa = Modificador de Destreza + Outros Bônus"
       "todo personagem inicia com 9 metros de Deslocamento de Caminhada"
       CD (de afty-schema.js, texto do livro já no repositório):
         "10 + metade do nível + mod de um atributo + BT + outros"

       ⚠ CADA UM PERDE UMA COISA DIFERENTE, e por isso são uma divergência só e
       não quatro: as quatro fórmulas trocam a escala por Tipo pela metade do
       nível, e o que sobra é a lista do que cada uma deixa cair.

         Defesa        perde a escala por Tipo E a Maestria
         CD            perde a escala por Tipo, e MANTÉM a Maestria (o BT)
         Iniciativa    perde o `metade da Maestria` que a criatura soma
         Deslocamento  perde o `maior(ModFor, ModDes) × 1,5` da criatura

       ⚠ A Atenção NÃO entra: "10 + bônus na perícia Percepção" é o que a
       criatura já faz, então ela é a única dos cinco que não diverge. */
    id: "valoresAdicionais",
    tipo: "regra",
    onde: "afty-derive.js, blocos Defesa, CD, Iniciativa e Movimento",
    fonte: "Defesa = 10 + Modificador de Destreza + Metade do seu Nível + Outros Bônus. Iniciativa = Modificador de Destreza + Outros Bônus. Por padrão, todo personagem inicia com 9 metros de Deslocamento de Caminhada. (livro, 2026-08-30)",
    afty: "escala por Tipo mais Maestria, e o Deslocamento soma o maior modificador físico",
    player: "metade do nível, e o Deslocamento é 9 puro",
    ativa: true,
  },
  {
    /* ⚠ O AFTY É QUE DIVERGE DO LIVRO AQUI, e não o contrário. O cabeçalho de
       `afty-habilidades.js` diz isso desde sempre: "No livro as Bases são de
       graça; no Afty elas são escolhidas, igual às por Nível." A ficha de
       jogador só devolve a regra do livro.

       O mecanismo já existia inteiro: a marca `automatica: true` concede a Base
       ao alcançar o nível na Especialização, sem escolha e sem gastar orçamento,
       e o autor vinha liberando uma a uma desde 2026-08-10. São NOVE hoje. No
       jogador, todas as 37 passam a valer assim, então 28 mudam de
       comportamento.

       ⚠ O orçamento não muda de tamanho, muda de dono: as Bases deixam de comer
       vagas da Habilidade Geral Especialização, e sobra tudo para as por Nível e
       os Talentos, que dividem o mesmo caixa. */
    id: "basesAutomaticas",
    tipo: "regra",
    onde: "afty-habilidades.js, habilidadesConcedidasPelasEspecializacoes",
    fonte: "As Habilidades Base na Ficha de Jogador são recebidas automaticamente ao chegar no Nível da Especialização. (autor, 2026-08-30)",
    afty: "escolhidas e pagas com o orçamento, menos as nove marcadas automáticas",
    player: "as 37 concedidas ao alcançar o nível, sem escolha e sem gastar orçamento",
    ativa: true,
  },
  {
    /* ⚠ NO AFTY O ORÇAMENTO NÃO VEM DO NÍVEL, e no jogador vem. Desde 2026-07-27
       a única fonte de vaga de Habilidade de Especialização é a Habilidade Geral
       Especialização, e sem pegá-la o orçamento é zero em qualquer ND. Na ficha
       de jogador não existe Habilidade Geral nenhuma, então a fonte volta a ser
       o nível, como no livro.

       ⚠ 1 POR NÍVEL A PARTIR DO SEGUNDO DE CADA CLASSE, e o desconto é POR
       CLASSE. Lutador 2 com Conjurador 2 rende 2, e não 3: cada classe perde o
       primeiro nível dela. Foi o exemplo do autor.

       O canal `vagasHabilidade` continua somando por cima nos dois sistemas: ele
       é como outras fontes (Talento Natural, Addons) dão vaga, e nada disso
       depende da Geral. */
    id: "vagasPorNivelDeClasse",
    tipo: "regra",
    onde: "afty-derive.js, vagasHabilidade",
    fonte: "Especialização você recebe 1 por Nível a partir do Segundo Nível da Classe. Se eu fizer Multiclasse, o primeiro Nível da Multiclasse eu não recebo inclusive. (autor, 2026-08-30)",
    afty: "só a Habilidade Geral Especialização dá vaga, e o ND não dá nenhuma",
    player: "1 por nível a partir do segundo de cada Classe",
    ativa: true,
  },
  {
    /* ⚠ NÃO É SÓ A ABA QUE SOME. As cinco Habilidades Gerais concedem coisas
       (vaga de Especialização, vaga de Aptidão, Focos de Treinamento, e o
       destravamento das Melhorias Superiores e das Lendárias), então tirá-las do
       jogador tira tudo isso junto. A vaga de Especialização já tem substituto
       nomeado pelo autor (`vagasPorNivelDeClasse`), e as outras quatro são
       questão aberta anotada em docs/afty-status.md. */
    id: "habilidadesGerais",
    tipo: "regra",
    onde: "AftyCreatureBuilder.jsx (card das Gerais) e afty-derive.js (resolveGerais)",
    fonte: "não existe na Ficha de Jogador a aba \"Habilidades Gerais\" (autor, 2026-08-30)",
    afty: "cinco Gerais, com contador único dividido com os Feitiços",
    player: "não existem, e o contador fica só para os Feitiços",
    ativa: true,
  },
  {
    /* No Afty as duas trilhas de nível 21+ exigem a Habilidade Geral
       correspondente ALÉM do ND. Sem Gerais na ficha de jogador, sobra só o ND,
       que é o que o autor pediu: "libera automaticamente Nível 21 e 22, sem
       precisar do botão para ativar. Seguindo a mesma regra atual."

       ⚠ NÃO PRECISOU DE CÓDIGO NOVO no resolvedor: `avaliarAcessoAltoNivel` já
       trata `destravado` ausente como "os dois abertos". Basta o jogador não
       passar o objeto. O comentário lá dizia isso desde que a trava nasceu. */
    id: "altoNivelSemGeral",
    tipo: "regra",
    onde: "afty-derive.js, chamada de resolveAltoNivel",
    fonte: "Melhoria Superior e Habilidade Lendaria libera automaticamente Nível 21 e 22, sem precisar do botão para ativar. Seguindo a mesma regra atual. (autor, 2026-08-30)",
    afty: "ND 21 e 22 mais a Habilidade Geral correspondente",
    player: "só o ND 21 e 22",
    ativa: true,
  },
  {
    /* ⚠ O ORÇAMENTO DE FOCOS DEIXA DE SER FÓRMULA E VIRA CAMPO. Autor,
       2026-08-30: "para jogador o Número é LIVRE ao invés de uma caixa
       selecionável. É o mestre que decide quando um Personagem de Jogador ganha
       Focos de Interlúdios, e não algo mecânico."

       É a única divergência do sistema em que o jogador tem MENOS automação de
       propósito: o número passa a ser digitado, e nenhuma fórmula o calcula. O
       canal `focos` continua somando por cima, para um Addon ou uma habilidade
       ainda poder conceder Foco. */
    id: "focosLivres",
    tipo: "regra",
    onde: "afty-derive.js, focosTotais",
    fonte: "E Treinamentos, para jogador o Número é LIVRE ao invés de uma caixa selecionavel. (autor, 2026-08-30)",
    afty: "ND mais os canais",
    player: "número digitado na ficha, mais os canais",
    ativa: true,
  },
  {
    /* ⚠ NO JOGADOR OS TRÊS TESTES USAM A MESMA ESCALA, e é a metade do nível.
       Verbatim do livro, uma fórmula por tipo, e as três dizem a mesma coisa:

         "Bônus de Perícia = Modificador do Atributo Chave da Perícia + Metade do
          Nível do Personagem + Bônus de Treinamento (se treinado) + Outros"
         "Ataque Corpo a Corpo = d20 + modificador de Força (ou Destreza, caso
          tenha o traço Fineza) + metade do nível do personagem + bônus de
          treinamento (se treinado) + outros bônus – penalidades"
         "Teste de Resistência de Astúcia = d20 + modificador de Inteligência +
          metade do nível do personagem + bônus de treinamento (se treinado)"

       Na criatura são TRÊS escalas diferentes, e isso é a planilha do autor de
       2026-07-27: o TR usa a escala por Tipo (a mesma da CD e da Defesa), a
       Jogada de Ataque usa `INT(ND/1,5)` para todo Tipo, e só a Perícia já
       usava a metade do nível.

       ⚠ A PERÍCIA JÁ ESTAVA CERTA, e o comentário do `resolveTestes` dizia que
       isso era provisório: "Perícias seguem em metade do ND, que é a fórmula do
       JOGADOR no livro. PENDENTE: as outras duas tinham fórmula própria da
       criatura, então esta provavelmente também tem. Perguntado, sem resposta
       ainda." A resposta chegou pelo outro lado: a Perícia da criatura é que
       pode estar errada, e segue como está até o autor dizer. */
    id: "escalaDosTestes",
    tipo: "regra",
    onde: "afty-pericias.js, resolveTestes",
    fonte: "metade do nível do personagem (livro do jogador, nas três fórmulas: Perícia, Jogada de Ataque e Teste de Resistência)",
    afty: "TR pela escala do Tipo, Ataque por Nível ÷ 1,5, e Perícia por metade do nível",
    player: "os três por metade do nível",
    ativa: true,
  },
  {
    /* ⚠ O LIVRO É EXPLÍCITO, e em caixa alta: "TESTES DE RESISTÊNCIA NÃO PODEM
       SER ESCOLHIDOS DE FORMA LIVRE, SENDO RECEBIDO POR ESPECIALIZAÇÃO,
       TALENTOS E OUTRAS FONTES. TESTES DE RESISTÊNCIAS NÃO SÃO PERICIAS E NÃO
       RECEBEM BÔNUS QUE AFETAM PERICIAS. E não contam para o Limite de Pericias."

       São três regras numa frase, e as três divergem da criatura, onde "Perícias
       E Testes de Resistência gastam deste mesmo caixa" (autor, 2026-07-27). */
    id: "trForaDoOrcamento",
    tipo: "regra",
    onde: "afty-pericias.js, resolveTestes",
    fonte: "TESTES DE RESISTÊNCIA NÃO PODEM SER ESCOLHIDOS DE FORMA LIVRE [...] E não contam para o Limite de Pericias. (livro do jogador)",
    afty: "TR e Perícia gastam o mesmo orçamento, e o TR é escolhido na aba",
    player: "o TR não gasta orçamento e não é escolhido, vem da Especialização e de outras fontes",
    ativa: true,
  },
  {
    /* ⚠ O NÍVEL DO JOGADOR TRAVA EM 30. Autor, 2026-08-30: "Vai até +8 no Nível
       26. E os Leveis são TRAVADOS em 30. Player só vai até 30."

       ⚠ COM ISSO O BÔNUS DE TREINAMENTO NUNCA DIVERGE. A escada da Maestria é a
       mesma nos dois até o 30 (+2, e +1 nos níveis 5, 9, 13, 17, 21 e 26), e os
       dois degraus que existem só na criatura (9 no ND 31 e 10 no ND 36) ficam
       acima do teto do jogador. Não precisou de divergência de Maestria: o teto
       de nível já resolve.

       ⚠ E O PISO É 1, e não 3. O criador de criatura começa em 3, e o livro do
       jogador descreve o primeiro nível de cada Classe ("No primeiro nível seu
       máximo de vida é 12 + Modificador de Constituição"), então nível 1 tem de
       ser escolhível. */
    id: "tetoDeNivel",
    tipo: "regra",
    onde: "afty-derive.js (nd) e AftyCreatureBuilder.jsx (campo Nível)",
    fonte: "E os Leveis são TRAVADOS em 30. Player só vai até 30. (autor, 2026-08-30)",
    afty: "ND de 3 a infinito",
    player: "Nível de 1 a 30",
    ativa: true,
  },
  {
    /* ⚠ SÓ A CLASSE INICIAL DÁ O PACOTE (autor, 2026-08-30, escolhendo entre dar
       o pacote inteiro, só as livres, ou nada). A segunda Classe entra apenas
       pelos níveis dela, sem treinamento inicial nenhum.

       É a mesma régua de "primeira da lista" que o PV usa, e de propósito: duas
       definições de classe inicial na mesma ficha seriam duas coisas para o
       jogador manter em dia.

       ⚠ O ATRIBUTO DEIXOU DE DIVERGIR em 2026-08-31. O jogador escolhia INT ou
       SAB de forma definitiva e a criatura pegava o maior dos dois. O autor
       igualou os dois lados: *"a quantidade de perícias é o maior modificador
       de atributo entre Inteligência ou Sabedoria e não só Inteligência"*. O
       que ainda diverge nesta linha é só o PACOTE, que a criatura não tem. */
    id: "pacoteDaClasseInicial",
    tipo: "regra",
    onde: "afty-especializacoes.js, pacoteInicialDaFicha",
    fonte: "Nada (autor, 2026-08-30, sobre o que a segunda Classe da multiclasse concede de perícias e TR)",
    afty: "orçamento de 3 + maior mod entre INT e SAB + rank do Grau, e o TR gasta dele",
    player: "o pacote da Classe inicial, mais o maior mod entre INT e SAB",
    ativa: true,
  },
  {
    /* ⚠ O TREINO É POR ARMA, e não por tipo de ataque. Autor, 2026-08-30:
       "Lutador tem Treinamento em Armas Simples. Logo, sempre que usando uma
       Arma Simples ele é considerado como Treinado em Jogadas de Ataque
       Corpo-a-Corpo com Armas Simples."

       Na criatura a ficha tem uma marca por TIPO (corpo, distância,
       amaldiçoado), e ela decide sozinha. No jogador a marca some e quem decide
       é a arma manejada contra o que a Classe treina. O Ataque Amaldiçoado
       continua sempre treinado, porque o livro escreve isso na fórmula dele:
       "bônus de treinamento (você é sempre treinado)".

       ⚠ ARMA FORA DO TREINO CONTINUA UTILIZÁVEL (autor): ela perde o Bônus de
       Treinamento e mais nada, que é o que "se treinado" significa na fórmula.
       Nem penalidade, nem bloqueio de equipar. */
    id: "proficienciaPorArma",
    tipo: "regra",
    onde: "afty-pericias.js, resolveTestes e resolveDano",
    fonte: "sempre que usando uma Arma Simples ele é considerado como Treinado em Jogadas de Ataque Corpo-a-Corpo com Armas Simples (autor, 2026-08-30)",
    afty: "uma marca de treinado por tipo de ataque, escolhida na ficha",
    player: "a arma manejada decide, contra as categorias que a Classe treina",
    ativa: true,
  },
  {
    /* ⚠ O CONTADOR ÚNICO NÃO ERA REGRA DO LIVRO, era consequência das
       Habilidades Gerais. Ele nasceu em 2026-07-26 para as Gerais e os Feitiços
       dividirem um caixa só, e ao nascer SUBSTITUIU a progressão por nível que o
       `totalFeiticos(nd)` implementava. Na ficha de jogador não existe Habilidade
       Geral nenhuma (ver `habilidadesGerais`), então o motivo do caixa único
       desapareceu e a progressão do livro volta.

       ⚠ ORÇAMENTO PRÓPRIO, e não uma parcela do contador (autor, 2026-08-31:
       "Volta para a progressão do livro a de Feitiços e Estilos. Que são
       separadas."). O Feitiço do jogador deixa de disputar caixa com qualquer
       outra coisa.

       ⚠ A CONJURAÇÃO APRIMORADA ENTRA NA FÓRMULA. A segunda metade do texto dela
       ("você passa a receber novos Feitiços em todo nível, ao invés de apenas nos
       níveis pares") estava transcrita em afty-habilidades.js desde sempre e não
       tinha onde cair, porque o contador único tinha apagado os níveis pares. Ela
       é `automatica`, então todo Conjurador a tem a partir do 1° nível.

       ⚠ O ESTILO DAS SOMBRAS NÃO ENTRA AQUI. O autor confirmou que ele também
       volta ao livro e que os dois são separados, mas o cálculo dele vem em
       mensagem própria. Até lá o Estilo segue no contador comum, e é por isso
       que esta divergência fala só de Feitiço: uma entrada que prometesse os
       dois estaria mentindo sobre metade. */
    id: "progressaoDeFeiticos",
    tipo: "regra",
    onde: "afty-feiticos.js, totalFeiticosJogador, e afty-derive.js, orcamentoHabilidades",
    fonte: "todo personagem usuário de energia amaldiçoada, por padrão, inicia com dois Feitiços. Um personagem também obtém novos Feitiços conforme sobe de nível, recebendo um novo Feitiço em todo nível par. Também se recebe um Feitiço adicional no nível 10 e outra no nível 20. (livro do jogador, 2026-08-31)",
    afty: "contador único da aba, dividido com as Habilidades Gerais e com o Estilo",
    player: "orçamento próprio: 2 no início, 1 por nível par, e mais 1 no 10 e no 20",
    ativa: true,
  },
  {
    /* ⚠ O GRAU NÃO SOMA DEFESA NO JOGADOR, e essa é a metade que não estava
       escrita em lugar nenhum. A tabela de grau do livro para UNIFORMES tem uma
       coluna só, "Recebe um Encantamento": ela não tem coluna numérica, ao
       contrário da de escudos ("RD FÍSICO") e da de armas ("Bônus de Arma"). O
       "+1 por grau" nasceu com a régua da criatura, em 2026-08-01, e fica lá.

       Ligar só a coluna e esquecer o grau daria um Robusto de Segundo Grau com
       6 + 3 = 9 de Defesa, e o livro dá 6. */
    id: "defesaUniforme",
    tipo: "regra",
    onde: "afty-equipamentos.js, defesaDaArmadura",
    fonte: "Você não modificou os Uniformes. Ainda está fornecendo +3 de Defesa o Robusto. (autor, 2026-08-31) MODIFICAÇÃO DE UNIFORME / BÔNUS NA DEFESA: Revestimento Leve +2, Revestimento Médio +4, Revestimento Robusto +6, Sob Medida +1. (livro do jogador)",
    afty: "custo da modificação, mais 1 por grau da Ferramenta",
    player: "a coluna Bônus na Defesa da tabela do livro, e o grau não soma nada",
    ativa: true,
  },
  {
    id: "inventarioSimplificado",
    tipo: "regra",
    onde: "docs/afty-status.md, sessão de 2026-08-01",
    fonte: "A aba de inventário da CRIATURA é simplificada, por decisão. O que sair da ficha de criatura volta na ficha de jogador, e não está sendo apagado do catálogo, só desligado do motor.",
    afty: "inventário simplificado, com o Dano fora da tabela da arma",
    player: "o inventário inteiro do livro do jogador",
    ativa: false,
  },
  {
    /* ⚠ A PRIMEIRA DIVERGÊNCIA LIGADA, e é de TELA, então o assert do clone
       continua verde: ela não toca número nenhum. Pedido direto do autor em
       2026-08-30, junto das mudanças estruturais. */
    id: "abasIdentidade",
    tipo: "tela",
    onde: "AftyCreatureBuilder.jsx, TABS",
    fonte: "De resto, na ficha de jogador junte a parte de Identidade com Informações em uma só. (autor, 2026-08-30)",
    afty: "duas abas, Identidade e Informações",
    player: "uma aba só, Identidade",
    ativa: true,
  },
  {
    /* ⚠ ESTA ENTRADA SE CHAMAVA `danoAtaqueBasico` E ERA PEQUENA DEMAIS. A fonte
       velha vinha de um comentário de creature-schema.js que falava só do Ataque
       Básico ("dano simplificado na criatura"), e o que o autor pediu em
       2026-08-31 troca o modelo de dano INTEIRO do jogador, arma por arma. O
       nome mudou junto para a tabela não prometer menos do que faz.

       O que sai da conta do jogador, e cada um por uma frase do autor:

         coefND × ND        a fórmula da criatura não vale, "não seja o de Criatura"
         escala × mod       idem, o modificador entra plano no fim
         Controle e Leitura "sai do Jogador"
         dano por Grau      "Grau da Arma não fornece +Acerto ou +Dano"
         Acerto por Grau    a mesma frase, e por isso esta divergência mexe nos DOIS

       O que fica: o dado impresso na tabela de equipamentos, movido pelos Níveis
       de Dano, mais o modificador do atributo e os bônus fixos.

       ⚠ O ENCANTAMENTO CONTINUA VALENDO nos dois sistemas. É o GRAU que deixa de
       dar número no jogador, e não a Ferramenta: "Só fornece os Bônus de
       Encantamentos como Potente que aumenta em 1 Dado e etc". Potente segue
       somando dado, Poderosa segue somando 2, e Precisa segue dando +2 de
       Acerto.

       ⚠ O NÍVEL DE DANO TROCA DE SIGNIFICADO, e é a metade mais sutil. Na
       criatura ele soma 1 no ND, só para dano. No jogador ele é um degrau da
       escada de dados (1d4 > 1d6 > 1d8 > 1d10 > 1d12 > 1d12 + 1d4). É o MESMO
       canal `nivelDano`, com os mesmos 22 emissores, lido por duas réguas. */
    id: "danoPorArma",
    tipo: "regra",
    onde: "afty-pericias.js, resolveDano, e afty-niveis-dano.js",
    fonte: "Preciso que o Dano na ficha de jogador não seja o de Criatura. Eles seguem o DANO DA ARMA, assim como está em equipamentos + Modificador de Atributo fixo no final. (autor, 2026-08-31)",
    afty: "fórmula por Nível e Patamar, e o dado da tabela da arma não entra",
    player: "o dado impresso da arma, movido pelos Níveis de Dano, mais o modificador do atributo",
    ativa: true,
  },
];

const POR_ID = new Map(DIVERGENCIAS.map((d) => [d.id, d]));

/**
 * Qual ramo daquela regra vale para este sistema.
 *
 * Devolve o id do ramo (`"afty"` ou `"player"`), e não o valor da regra: o
 * valor mora no módulo que implementa a fórmula, que é quem sabe calculá-la.
 *
 * ⚠ Divergência desconhecida devolve `"afty"` em vez de quebrar, pela mesma
 * razão que a DSL cai no fallback: um id errado não pode derrubar o criador de
 * fichas inteiro no meio da mesa.
 */
export const regraDo = (sistema, idDivergencia) => {
  const d = POR_ID.get(idDivergencia);
  if (!d || !d.ativa) return "afty";
  return normalizaSistema(sistema);
};

/** Sanidade do catálogo acima. */
export function validarSistemas() {
  const erros = [];
  const vistos = new Set();
  for (const d of DIVERGENCIAS) {
    if (!d.id) erros.push("Divergência sem id.");
    else if (vistos.has(d.id)) erros.push(`Divergência duplicada: ${d.id}`);
    else vistos.add(d.id);
    if (d.tipo !== "regra" && d.tipo !== "tela") {
      erros.push(`Divergência ${d.id || "?"} com tipo que não é "regra" nem "tela".`);
    }
    for (const campo of ["onde", "fonte", "afty", "player"]) {
      if (typeof d[campo] !== "string" || !d[campo].trim()) {
        erros.push(`Divergência ${d.id || "?"} sem ${campo}.`);
      }
    }
    if (typeof d.ativa !== "boolean") {
      erros.push(`Divergência ${d.id || "?"} com \`ativa\` que não é booleano.`);
    }
  }
  for (const id of SISTEMA_IDS) {
    const s = SISTEMAS[id];
    if (s.id !== id) erros.push(`Sistema ${id} com id interno diferente da chave.`);
    for (const campo of ["label", "substantivo", "substantivoPlural", "rota", "selo", "seloTitulo"]) {
      if (typeof s[campo] !== "string" || !s[campo].trim()) erros.push(`Sistema ${id} sem ${campo}.`);
    }
  }
  return erros;
}
