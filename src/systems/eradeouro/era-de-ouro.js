/**
 * ============================================================
 * ERA DE OURO: a mesa da Guilda
 * ============================================================
 * A rota `/EraDeOuro` abre o MESMO livro do `/Afty` e do `/Player` com um
 * armazenamento só dela. Numa lista só moram os dois tipos de ficha: a criatura
 * (`rulesVersion: "afty"`) e o personagem (`rulesVersion: "player"`). Cada ficha
 * segue sendo de um dos dois sistemas, e quem decide qual é o `rulesVersion`
 * dela, como em qualquer outra rota. Ver src/systems/afty/afty-sistema.js.
 *
 * ⚠ "ERADEOURO" NÃO É UM SISTEMA, e é de propósito. `SISTEMAS` e `rulesVersion`
 * só aceitam "afty" e "player": qualquer outro valor falha em `sistemaGravado`,
 * a porta do importador recusa a ficha, o clique no card não abre a Ficha, e o
 * `normalizaSistema` derivaria todo personagem da Guilda como criatura, calado.
 * A Guilda é uma MESA, e a mesa é um campo à parte na ficha: `mesa`.
 *
 * ⚠ A MESA VEM DA FICHA, E NÃO DA ROTA. É a mesma lei do sistema. A rota só
 * carimba a ficha NOVA (o criador grava `mesa` no nascimento, e não só ao
 * salvar). Daí em diante quem responde é o campo, então uma ficha da Guilda
 * exportada e importada no `/Afty` continua sendo da Guilda.
 *
 * ------------------------------------------------------------
 * AS REGRAS PRÓPRIAS DA GUILDA
 * ------------------------------------------------------------
 * Moram em REGRAS_DA_MESA, uma tabela SEPARADA de `DIVERGENCIAS`. O assert
 * `t-sistema.mjs` exige que as divergências de criatura e personagem sejam
 * exatamente as ligadas, e uma regra da Guilda ali dentro o quebraria sem ser
 * defeito. A tabela nasceu vazia, e desde 2026-11-09 tem as três regras do
 * PERSONAGEM da Guilda (a Carteira embutida, o Grau Especial no 17 e a aba
 * Propriedades) e as três da Guilda inteira (o limite de Acessórios, o teto do
 * Treino de TR e a troca da Maldição no seletor).
 *
 * ------------------------------------------------------------
 * OS PACOTES NATIVOS
 * ------------------------------------------------------------
 * O conteúdo da Guilda que o Motor já sabe dizer (o remendo do Treino de Perícia,
 * o Talento Costas Largas, a Maldição Era de Ouro, as regras de addon) mora em
 * pacotes NATIVOS: toda ficha da Guilda os carrega, sempre em dia com o app, e a
 * aba Addons não os mostra. Ver `NATIVOS_DA_GUILDA_IDS` e `pacotes-nativos.js`.
 *
 * Cada entrada:
 *   id       chave lida por `regraDaMesa`
 *   tipo     "regra" muda NÚMERO, "tela" muda só layout
 *   sistemas os tipos de ficha em que ela vale ("afty", "player"). Sem o campo, os dois
 *   fonte    o texto da regra, verbatim
 *   base     o que vale fora da Guilda
 *   eradeouro  o que vale na Guilda
 *   ativa    se o código JÁ desvia
 *
 * O módulo que passar a desviar lê `regraDaMesa(ficha, id)` e nunca um `if`
 * solto, senão a regra some do mapa. É o mesmo molde de `regraDo`.
 * ============================================================
 */

export const MESA_ERA_DE_OURO = "eradeouro";

/** O namespace do localStorage da rota: `fm_creatures_eradeouro_v1` e as irmãs. */
export const NAMESPACE_ERA_DE_OURO = "eradeouro";

/** Os encontros da Guilda, fora de `afty_encontros_v1`, que o Afty e o Player dividem. */
export const CHAVE_ENCONTROS_ERA_DE_OURO = "afty_encontros_eradeouro_v1";

export const ERA_DE_OURO = {
  id: MESA_ERA_DE_OURO,
  label: "Era de Ouro",
  rota: "/EraDeOuro",
};

/** A rota, sem diferenciar maiúscula de minúscula, como as outras duas. */
export const ehRotaEraDeOuro = (pathname) => /^\/eradeouro\/?$/i.test(pathname ?? "");

/** A mesa da ficha: "eradeouro" ou null. Lê a FICHA, nunca a rota. */
export const mesaDaFicha = (ficha) => (ficha?.mesa === MESA_ERA_DE_OURO ? MESA_ERA_DE_OURO : null);

/** Devolve a ficha carimbada com a mesa. Não muda o `rulesVersion`. */
export const comMesa = (ficha, mesa) => (mesa === MESA_ERA_DE_OURO ? { ...ficha, mesa } : ficha);

/**
 * Os pacotes NATIVOS da Guilda, na ordem em que entram na ficha (autor,
 * 2026-11-09: "todos os Addon que ja sao pre-definidos [...] coloque-os nativos").
 * Valem na ficha da Guilda, criatura ou personagem, e só nela.
 *
 * ⚠ ELES SUBSTITUEM OS ADDONS OFICIAIS do mesmo dia, que nasciam ligados e
 * travados como CÓPIA congelada. Agora quem os põe na ficha é a hidratação
 * (`hidratarFicha`, afty-addons-compostos.js), que refaz a cópia a partir da
 * fonte do app toda vez que a ficha entra: a ficha antiga da Guilda ganha o que
 * falta, e ninguém precisa atualizar nada pela aba Addons, que nem os mostra.
 *
 * ⚠ A FICHA AINDA LEVA A CÓPIA, de propósito: trinta leitores leem
 * `creature.addons` direto, e um pacote que só existisse no derive sumiria deles.
 *
 * ⚠ A CARTEIRA DA GUILDA NÃO ESTÁ AQUI (autor: "Embutir e tirar"). O addon usa a
 * tabela antiga (0 de XP no Nível 3, até o 30), e o personagem da Guilda tem a
 * Carteira embutida, com a tabela dela. Ver `carteiraDaGuilda` mais abaixo.
 */
export const NATIVOS_DA_GUILDA_IDS = [
  "regras-grimorio",
  "cofre-de-feiticos",
  "alma-livre",
  "atencao-so-percepcao",
  "pericias-era-de-ouro",
  "treino-testes-de-resistencia",
  "regras-da-era-de-ouro",
  "maldicao-era-de-ouro",
];

/**
 * "Atenção Só Pela Percepção" mora AQUI, e não em `addons/`: é a regra `atencaoSoPercepcao` do motor
 * (pública), pedida sozinha para a Guilda. Um JSON novo em `addons/` entraria no inventário de revisão e
 * no teste de reconciliação, que pedem a árvore livre. Mesmo molde do `PACOTE_ALMA_DO_AFTY`.
 */
export const PACOTE_ATENCAO_SO_PERCEPCAO = Object.freeze({
  id: "atencao-so-percepcao",
  nome: "Atenção Só Pela Percepção",
  versao: "1.0.0",
  autor: "Afty",
  paraRaw: "afty",
  descricao: "O poder que dá Percepção e Atenção ao mesmo tempo passa a dar só a Percepção. A Atenção da ficha segue vindo da Percepção.",
  resumo: "O bônus de Percepção não soma de novo na Atenção",
  categoria: "regras",
  regrasAfty: Object.freeze({ atencaoSoPercepcao: true }),
});

/**
 * "Perícias da Era de Ouro": cria Guerra (Inteligência) e Nobreza (Inteligência ou Presença). Inline pelo mesmo
 * motivo do pacote acima. O campo `pericias` do pacote é o verbo público do motor. As descrições das duas ainda
 * não foram enviadas, e a ficha mostra só o nome e o atributo.
 */
export const PACOTE_PERICIAS_ERA_DE_OURO = Object.freeze({
  id: "pericias-era-de-ouro",
  nome: "Perícias da Era de Ouro",
  versao: "1.0.0",
  autor: "Afty",
  paraRaw: "afty",
  descricao: "Cria as perícias Guerra e Nobreza. Guerra usa Inteligência. Nobreza usa Inteligência ou Presença, à escolha de quem a treina.",
  resumo: "Cria as perícias Guerra e Nobreza",
  categoria: "regras",
  pericias: Object.freeze([
    Object.freeze({ id: "guerra", nome: "Guerra", atributo: "inteligencia" }),
    Object.freeze({ id: "nobreza", nome: "Nobreza", atributo: "inteligencia", atributos: Object.freeze(["inteligencia", "presenca"]) }),
  ]),
});

/* ============================================================ */
/* OS CLÃS UCHIHA E HYUUGA DO HERDADO (autor, 2026-11-11)          */
/* ============================================================ */
/*
 * "Coloque estas duas origens na origem Herdado como parte dos Clãs Oficiais."
 * Entram pela família `clas` do pacote nativo, a mesma do Herdado do Vaticano: o
 * clã vai para o seletor do Herdado do LIVRO, ao lado de Gojo, Inumaki, Kamo e
 * Zenin, e só na ficha da Guilda (é lá que o pacote existe).
 *
 *   • A Maestria de Clã é a escolha com custo dos clãs do livro: treinado custa 1,
 *     especialista (ou Mestre) custa as 2 vagas. O Uchiha perdeu a Pontaria, que não
 *     é perícia do site (autor: "Só Furtividade e Percepção"). O Hyuuga tem a terceira
 *     saída do texto, abdicar das perícias por metade do BT em todo Acerto.
 *   • O Sharingan e o Byakugan despertam por decisão do mestre (autor: "Desperto +
 *     Interruptor"). A partir do Nível 4 o card do clã abre a opção Desperto, e
 *     marcada ela faz aparecer o interruptor Ativo da bancada de combate, que é quem
 *     liga os números. Os números ficam na OPÇÃO, e não no clã: desmarcar o despertar
 *     desliga tudo, mesmo que o interruptor tenha ficado gravado ligado.
 *   • Tomoes pelo Nível (1 no 4, 2 no 8, 3 no 10), +2 de Defesa e de TR de Reflexos
 *     por tomoe. O requisito de nível de técnica que o texto cita junto não entra.
 *   • Mangekyou, Eterno e Olho Emprestado são texto de mesa (autor: "Texto de Mesa"),
 *     e as Habilidades Oculares ainda não têm catálogo. Ver docs/a-fazer.md.
 *   • O Suspiro das Pétalas não precisa de mecanismo: a Emoção da Pétala Decadente
 *     pede a origem Herdado, e o Hyuuga já é Herdado.
 */
const opcaoDePericia = (prefixo, id, nome, nivel, rotulo) => ({
  id: `${prefixo}_${nivel === 2 ? "ms" : "tr"}_${id}`,
  nome: nivel === 2 ? `${nome} (${rotulo})` : nome,
  descricao: nivel === 2
    ? `Você se torna ${rotulo.toLowerCase()} em ${nome}, no lugar de dois treinamentos.`
    : `Você se torna treinado em ${nome}.`,
  custo: nivel,
  efeitos: [{ canal: "proficienciaPericia", alvo: id, expr: String(nivel), nome: "Maestria de Clã" }],
});
const opcoesDeMaestria = (prefixo, pericias, rotulo) => [
  ...pericias.map(([id, nome]) => opcaoDePericia(prefixo, id, nome, 1, rotulo)),
  ...pericias.map(([id, nome]) => opcaoDePericia(prefixo, id, nome, 2, rotulo)),
];
const BONUS_DE_CLA_LIVRE = { distribuir: 3, maxPorAtributo: 2 };
const TOMOES = "(1 + (nd >= 8) + (nd >= 10))";
const SHARINGAN_ATIVO = "regras_da_era_de_ouro_sharingan_ativo";
const BYAKUGAN_ATIVO = "regras_da_era_de_ouro_byakugan_ativo";

const CLA_UCHIHA = {
  id: "cla_uchiha",
  nome: "Clã Uchiha",
  resumo: "Sharingan",
  caracteristicas: [
    {
      id: "bonus_atributo",
      nome: "Bônus em Atributo",
      descricao: "Um membro do Clã Uchiha recebe 3 pontos de atributo para distribuir livremente, com um limite de 2 em um único atributo.",
      bonus: BONUS_DE_CLA_LIVRE,
    },
    {
      id: "maestria_de_cla",
      nome: "Maestria de Clã",
      descricao: "Você recebe maestria em 2 perícias entre Furtividade ou Percepção. Ao invés de receber maestria em 2 perícias, você pode escolher se tornar especialista em uma.",
      escolhas: [{
        id: "edo_uchiha_maestria",
        label: "Maestria de Clã",
        vagas: 2,
        opcoes: opcoesDeMaestria("edo_uchiha", [["furtividade", "Furtividade"], ["percepcao", "Percepção"]], "Especialista"),
      }],
    },
    {
      id: "heranca_do_odio",
      nome: "Herdeiro do Ódio",
      descricao: "Herdando o poder da linhagem Uchiha, você herda o ódio de seus antepassados junto de seus poderes. A partir do nível de personagem 4, você estará passivo a despertar seu Sharingan.",
    },
    {
      id: "sharingan",
      nome: "Sharingan",
      descricao:
        "Os olhos capazes de ler os movimentos de seus oponentes, o Sharingan é conhecido e temido por todo o mundo, sendo comparados aos Seis Olhos quando se trata de ser um jujutsu ocular poderoso, superando o mesmo em alguns pontos, pois diferente do jujutsu ocular do Clã Gojo, o Sharingan não só aumenta a eficácia de seu usuário enquanto utilizando energia amaldiçoada, mas também melhora seus atributos físicos em um geral, aumentando sua capacidade de desviar de ataques, assim como aumenta a capacidade de desferir ataques.\n\n" +
        "Para despertar seu Sharingan, o membro do Clã Uchiha deve passar por uma situação de extremo estresse ou um trauma muito grande, o qual faz seu sangue borbulhar e traz átona a Maldição do Ódio. O processo do despertar do Sharingan só pode ser iniciado a partir do nível 4, com o seu despertar sendo decidido por seu mestre, pois para despertar o mesmo, um Uchiha deve passar por momentos de grande estresse, como o de uma luta muito difícil, a perda de alguém próximo e diversas outras situações possíveis, porém não sendo um processo alcançado por treino.\n\n" +
        "Ao passar por uma situação de extremo estresse, você desperta seu Sharingan, o qual inicia com 1 tomoe, sendo considerado uma técnica de nível 2, tendo seu custo de ativação como uma ação bônus. Em seu despertar, você não precisa gastar PE e nem ações, por conta de ser seu despertar e você não poder controlar o momento de sua ativação.\n\n" +
        "Para cada tomoe que possuir, sua DEF e seu TR de Reflexos receberão um aumento de +2, mostrando a capacidade reflexiva que o mesmo lhe proporciona. Além disso, enquanto com o Sharingan ativo, seu usuário recebe acesso as Habilidades Oculares, técnicas exclusivas do Sharingan, o qual envolvem de ilusões até o aprimoramento de combate de seu usuário.\n\n" +
        "Seu Sharingan possui uma evolução, chamada de Mangekyou Sharingan, o qual só pode ser atingida ao presenciar a morte de um de seus amados, ou... os matando. O uso prolongado de seu Mangekyou Sharingan pode causar danos irreversíveis ao seu usuário, e para conseguir uma nova luz, um membro do Clã Uchiha deve arrancar os olhos de um outro Uchiha e implantar em si mesmo, que com o tempo, seu corpo irá se acostumar e então seus olhos ficarão completamente recuperados.",
      escolhas: [{
        id: "edo_uchiha_sharingan",
        label: "Sharingan",
        vagas: 1,
        ndMin: 4,
        opcoes: [{
          id: "edo_uchiha_sharingan_desperto",
          nome: "Sharingan Desperto",
          descricao: "Seu Sharingan despertou. Com ele ativo, sua DEF e seu TR de Reflexos recebem +2 para cada tomoe.",
          efeitos: [
            { canal: "defesa", expr: `2 * ${TOMOES}`, quando: SHARINGAN_ATIVO, duracao: "temporaria", nome: "Sharingan" },
            { canal: "bonusTR", alvo: "reflexos", expr: `2 * ${TOMOES}`, quando: SHARINGAN_ATIVO, duracao: "temporaria", nome: "Sharingan" },
          ],
        }],
      }],
    },
    {
      id: "evolucao_maldita",
      nome: "Evolução Maldita",
      mesa: true,
      descricao:
        "A evolução do Sharingan é a principal maldição dos Uchihas, os eventos traumáticos o qual seu usuário precisa passar para o evoluir, aumentam cada vez mais o ódio em seu coração.\n\n" +
        "1 Tomoe: Para receber acesso ao Sharingan, assim como descrito na seção anterior, seu usuário deverá ter nível 4 de personagem e acesso a técnicas de nível 2, sendo esta a forma mais fraca e básica do Sharingan, o qual dá acesso a apenas Habilidades Oculares de até nível 1 para seu usuário, por conta da liberação mínima de seu poder, possuído acesso a 2 habilidades oculares de nível 2.\n\n" +
        "2 Tomoe: Ao nível de personagem 8 e ao possuir acesso a habilidades de técnica de nível 3, seu usuário recebe acesso ao segundo tomoe de seu Sharingan, agora já evoluído e próximo a sua mais forte liberação, liberando acesso as Habilidades Oculares de nível 2 para seu usuário, assim como liberando acesso a uma quantidade de técnicas de nível 3 igual ao seu Nível de Aptidão em Controle e Leitura.\n\n" +
        "3 Tomoe: No nível de personagem 10 e ao possuir acesso a habilidades de técnica de nível 3, você recebe o terceiro tomoe de seu sharingan, fazendo com que seus reflexos estejam mais aprimorados que nunca. Seu usuário recebe acesso a Habilidades Oculares de nível 3, assim como uma quantidade de Habilidades Oculares de Nível 4 igual ao seu bônus de maestria.\n\n" +
        "Ativação: Ativar seu Sharingan é considerado uma ação bônus dentro de um combate, e ação livre em cenas comuns. Para cada tomoe, o custo de ativação do Sharingan aumenta em 2PE, assim como o custo para o manter aumenta em 1PE.",
    },
    {
      id: "olho_emprestado",
      nome: "Olho Emprestado",
      mesa: true,
      descricao:
        "Assim como o ninja que copia, feiticeiros não Uchihas ainda sim podem possuir o Sharingan, porém sendo um processo não natural e muito arriscado, visto que para este processo, o Uchiha precisa abdicar de seu próprio olho.\n\n" +
        "Enquanto com o Sharingan ativo, um Uchiha pode arrancar o próprio olho e assim o oferecer a outro feiticeiro, fazendo com que o mesmo tenha de arrancar o próprio olho e colocar o Sharingan como uma prótese em seu lugar. Sendo este um Sharingan emprestado, por conta disso, seu novo usuário não pode desativa-lo e nem o evoluir, porém caso seu usuário original evolua o mesmo, então aquele que possuir o Sharingan emprestado evoluirá junto, com exceção de possuir o Mangekyou Sharingan Eterno, pois se trata de um processo diferente das comuns evoluções.\n\n" +
        "Um feiticeiro com um Sharingan emprestado não pode o desativa-lo, fazendo com que o mesmo fique ativo a todo o momento, porém, por não ser um Uchiha, seu corpo não é capaz de suportar tal poder a todo o momento, fazendo com que o número máximo de rodadas o qual você pode utilizar de seu Sharingan seja uma quantidade igual ao seu bônus de maestria, o qual ao ultrapassar esta quantidade, você passa a receber 1 ponto de exaustão para cada rodada subsequente.\n\n" +
        "Seu usuário seguirá os mesmos parâmetros do Sharingan comum, como a aquisição de Habilidades Oculares e aumento de CA e em seu TR de Reflexos.",
    },
    {
      id: "mangekyou_sharingan",
      nome: "Mangekyou Sharingan",
      mesa: true,
      descricao:
        "O Sharingan, a lendária técnica ocular do clã Uchiha, é tanto um símbolo de sua força devastadora quanto da maldição que assombra sua linhagem. Porém, nos momentos mais sombrios de desespero e dor, essa habilidade atinge um novo patamar de poder e mistério: o Mangekyou Sharingan.\n\n" +
        "Essa evolução não é fruto de treinamento árduo ou de determinação inabalável, mas do impacto avassalador de um trauma emocional extremo. A perda de um ente querido, uma traição insuportável ou um sacrifício irreparável são os gatilhos que despertam essa forma sombria e poderosa. Cada evento esculpe uma marca indelével na alma do Uchiha, revelando a essência mais profunda (e muitas vezes trágica) de sua linhagem amaldiçoada.\n\n" +
        "O Mangekyou Sharingan é mais do que uma demonstração de poder, é um reflexo da dor que molda o portador. Único para cada Uchiha, ele personifica a individualidade de seu despertar e manifesta habilidades exclusivas que desafiam a lógica e a compreensão. Desde a manipulação do espaço-tempo até o domínio de chamas eternas ou a criação de ilusões inescapáveis, as técnicas do Mangekyou são tão fascinantes quanto aterradoras.\n\n" +
        "Para que o Sharingan evolua para o Mangekyou, o portador deve vivenciar um momento de dor tão profundo que abale sua própria essência. Não é necessariamente a morte de alguém querido que desencadeia essa transformação, mas qualquer trauma intenso o suficiente para transformar permanentemente a personalidade do Uchiha. Em termos de mecânica de jogo, o Mangekyou Sharingan pode ser despertado apenas quando o personagem atinge o nível 12. O momento exato de seu despertar é único e subjetivo, variando de acordo com a narrativa e as experiências do personagem. Por isso, a decisão final sobre o momento e as circunstâncias do despertar deve ser acordada com o Mestre, garantindo que o evento seja uma parte significativa da história do Uchiha e de sua evolução.\n\n" +
        "Despertar da Agonia: Com o despertar de seu Mangekyou Sharingan, o ódio comina pelo amago de sua alma, liberando um poder imenso ao seu corpo, o qual explode em uma fúria imparável. Ao despertar seu Mangekyou Sharingan, o usuário do mesmo recebe acesso as Habilidades Oculares de nível 5, alcançando assim o ápice que o Sharingan pode proporcionar ao seu usuário, tanto em Genjutsus, quanto em habilidades destrutivas.\n\n" +
        "Um Mangekyou Sharingan pode ser idealizado e criado a vontade de um jogador, porém, como base, um Mangekyou e sua Habilidade Especial devem ser decididas pelo jogador juntamente de seu mestre, fazendo assim com que sua habilidade especial retrate perfeitamente o trauma alojado no coração do Uchiha.\n\n" +
        "Primariamente, existem dois tipos de Mangekyou, o Choku Tomoe, e o Supairaru Tomoe, sendo o Choku Tomoe uma manifestação extremamente rara de um Mangekyou Sharingan visto que o Choku Tomoe aumenta as capacidades de combate gerais de seu usuário, amplificando ainda mais os benefícios que o Sharingan comum proporciona ao seu usuário. Já o Supairaru Tomoe é o tipo mais comum de um Mangekyou se manifestar, e sua capacidade se prioriza na utilização das Habilidades Especiais do Mangekyou, se diversificando do Choku Tomoe.",
    },
    {
      id: "mangekyou_sharingan_eterno",
      nome: "Mangekyou Sharingan Eterno",
      mesa: true,
      descricao:
        "Um poder que pouquíssimos Uchihas acabam por alcançar, o Mangekyou Sharingan Eterno é a manifestação mais pura e completa do poder do Mangekyou Sharingan, o qual deixa de causar danos aos olhos de seu usuário, agora podendo ser utilizado sem qualquer restrição, porém com um grande custo emocional ao seu usuário.\n\n" +
        "Para possuir acesso ao Mangekyou Sharingan Eterno é necessário que o usuário do Mangekyou Sharingan transplante em si mesmo um Mangekyou Sharingan de um parente próximo, sendo considerados parentes próximos aqueles que derivam diretamente de sua linhagem sanguínea. Seu usuário precisa arrancar os próprios olhos e no lugar, colocar os olhos de seu parente, que irão se adaptar ao seu corpo, curando assim sua cegueira e alcançando um novo nível no patamar do Sharingan. O processo para se acostumar com os seus novos olhos deve ser definido pela staff, tendo como base um interlúdio ou para personagens com um menor valor de Constituição, dois interlúdios.\n\n" +
        "Vale ressaltar que, para conseguir o Mangekyou Sharingan Eterno, é necessário que no momento da transplantação, seu usuário deve ainda possuir acesso ao seu Mangekyou, caso esteja completamente cego, o processo já não pode mais ser feito, visto que durante o transplante o Mangekyou daquele que estará recebendo os olhos deverá estar ativo. Além disso, não é possível ter apenas 1 Mangekyou Sharingan Eterno, necessitando que seu usuário possua ambos os olhos de seu parente para realizar este transplante de maneira correta.\n\n" +
        "Diferente do Mangekyou Sharingan, para ativar seu Mangekyou Sharingan Eterno o seu usuário não necessita da utilização de uma Habilidade Especial de Mangekyou, podendo o ativar como uma Ação Bônus e gastando 10 PE, pagando 2 PE por turno para manter o mesmo. Os benefícios concedidos pelo Mangekyou Sharingan Eterno ao seu usuário são os mesmo que o Mangekyou Sharingan concede, com a única diferença sendo justamente não ser mais passivo a cegueira do Mangekyou, além de pôr os olhos agora presentes em seu corpo não serem seus, você acaba absorvendo as habilidades daquele olho, fazendo assim com que você possua acesso as Habilidades Especiais de Mangekyou o qual os olhos transplantados concediam a seu antigo usuário, além de manter suas próprias Habilidades Especiais de Mangekyou.\n\n" +
        "Por mais que seja em casos raros, um Uchiha pode sim transplantar olhos que não sejam de parentes próximos para a aquisição de um Mangekyou Sharingan Eterno, porém sendo este um processo de alto risco e muito complexo de se realizar, por conta disso, para realizar este processo o Uchiha necessita de um personagem com a especialização de Suporte ao seu lado, o qual precisará passar em 3 testes de Medicina para que o processo possa ser concluído, necessitando de especialização nesta pericia, e o Uchiha precisará passar em 3 testes de Fortitude para resistir as dores intensas, sendo as CDs dos testes:\n\n" +
        "Teste 1: CD = 15 + nível do Uchiha.\nTeste 2: CD = 20 + nível do Uchiha.\nTeste 3: CD = 20 + nível do Uchiha + bônus de maestria do Uchiha\n\n" +
        "Em uma falha, o processo falha e o olho o qual estava sendo transplantado é danificado, não podendo mais ser utilizado para transplantar.",
    },
  ],
};

const CLA_HYUUGA = {
  id: "cla_hyuuga",
  nome: "Clã Hyuuga",
  caracteristicas: [
    {
      id: "bonus_atributo",
      nome: "Bônus em Atributo",
      descricao: "Um membro do Clã Hyuuga recebe 3 Pontos de Atributo para distribuir livremente, com um limite de 2 em um único Atributo.",
      bonus: BONUS_DE_CLA_LIVRE,
    },
    {
      id: "maestria_de_cla",
      nome: "Maestria de Clã",
      descricao: "Você recebe Treinamento em 2 Perícias entre Percepção ou Medicina. Ao invés de receber Treinamento em 2 Perícias, você pode escolher se tornar Mestre em uma. É possivel abdicar das Perícias para receber metade do Bônus de Treinamento em Todos Acertos.",
      escolhas: [{
        id: "edo_hyuuga_maestria",
        label: "Maestria de Clã",
        vagas: 2,
        opcoes: [
          ...opcoesDeMaestria("edo_hyuuga", [["percepcao", "Percepção"], ["medicina", "Medicina"]], "Mestre"),
          {
            id: "edo_hyuuga_acertos",
            nome: "Metade do BT em Todos os Acertos",
            descricao: "Você abdica das perícias e recebe metade do Bônus de Treinamento em todos os Acertos.",
            custo: 2,
            efeitos: [{ canal: "bonusAcerto", expr: "piso(bt / 2)", nome: "Maestria de Clã" }],
          },
        ],
      }],
    },
    {
      id: "herdeiro_da_visao_divina",
      nome: "Herdeiro da Visão Divina",
      descricao: "Herdeiro do poder do Byakugan, você possui um potencial único para despertar a visão do clã. A partir do Nível 4 de Personagem, você estará apto a despertar seu Byakugan.",
    },
    {
      id: "suspiro_das_petalas",
      nome: "Suspiro das Pétalas",
      descricao: "O Clã Hyuuga detém diversas informações secretas, assim como técnicas exclusivas e encobertas dos outros. Um membro do Clã Hyuuga pode aprender a Aptidão Especial de Domínio, Emoção da Pétala Decadente.",
    },
    {
      id: "byakugan",
      nome: "Byakugan",
      descricao:
        "Os olhos conhecidos como \"Visão Celestial\", o Byakugan é uma das habilidades oculares mais respeitadas e temidas do mundo, reverenciado por sua precisão e versatilidade. Esses olhos lendários concedem a seus portadores uma visão quase divina, permitindo enxergar em 360º ao seu redor (com exceção de um pequeno ponto cego) e ver o fluxo de energia nos corpos vivos, além de detectar presenças escondidas ou invisíveis.\n\n" +
        "O Byakugan é um poder que aprimora significativamente as habilidades de combate, permitindo que seu usuário ataque pontos vitais para enfraquecer ou incapacitar o inimigo. Com ele, membros do Clã Hyuuga podem dominar artes marciais únicas, como o Estilo Punho Gentil, que combina precisão cirúrgica e manipulação de energia para anular as capacidades de seus oponentes.\n\n" +
        "Diferente de outras técnicas oculares, o Byakugan é uma habilidade inata para todos os membros do Clã Hyuuga, mas sua verdadeira potencialidade só pode ser plenamente desbloqueada através de treinamento intenso e uma forte conexão emocional ou espiritual.\n\n" +
        "Para atingir o pleno poder do Byakugan, o membro do clã deve passar por um momento de profunda introspecção ou uma experiência significativa que o conecte com a herança ancestral de sua linhagem.\n\n" +
        "Esse processo pode ser iniciado a partir do Nível 4 e é guiado pelo mestre da campanha. O despertar completo do Byakugan não ocorre apenas pelo treinamento físico ou pelo tempo, mas sim pela necessidade de um evento que desperte a força interior do personagem, como precisar a todo custo vencer uma batalha impossível, um momento de auto compreensão profundo ou precisar proteger alguém importante para o Hyuuga.\n\n" +
        "Ativar o Byakugan é considerado uma Ação Bônus, necessitando pagar 4 PE para sua ativação, e 1 PE para mantê-lo ativo, enquanto com ele ativo, seu usuário recebe:\n" +
        "• Metade de seu Nível em testes de Percepção e Jogadas de Ataque Corpo a Corpo.\n" +
        "• Possui vantagem contra Condição Desprevenido e Desorientado, tendo uma visão de 359,99 graus, com o único ponto cego sendo bem atrás de seu pescoço.\n" +
        "• Se torna Imune a Invisibilidades e a Camuflagens, podendo ver atráves de estruturas e pessoas, compreendendo completamente o fluxo de Energia Amaldiçoada que flue por elas.\n\n" +
        "Porém, ao atingir uma quantidade de Rodadas com seu Byakugan ativo igual a metade de seu Bônus de Treinamento, por conta do grande cansaço que a utilização deste poder ocular gera, seu usuário receberá 1 Ponto de Fadiga, que ao chegar em Pontos de Fadiga igual a metade de seu Bônus de Treinamento, então seu usuário receberá 1 Ponto de Exaustão.\n" +
        "Ao possuir acesso as aptidões de energia reversa \"Regeneração Aprimorada\" e \"Fluxo Constante\", seu usuário poderá gastar PE equivalente a metade do PE necessário para recuperar um membro, assim negando o Ponto de Exaustão que iria receber, necessitando curar novamente para continuar a não receber.",
      escolhas: [{
        id: "edo_hyuuga_byakugan",
        label: "Byakugan",
        vagas: 1,
        ndMin: 4,
        opcoes: [{
          id: "edo_hyuuga_byakugan_desperto",
          nome: "Byakugan Desperto",
          descricao: "Seu Byakugan despertou. Com ele ativo, você soma metade do seu Nível em testes de Percepção e em Jogadas de Ataque Corpo a Corpo.",
          efeitos: [
            { canal: "bonusPericia", alvo: "percepcao", expr: "piso(nd / 2)", quando: BYAKUGAN_ATIVO, duracao: "temporaria", nome: "Byakugan" },
            { canal: "bonusAcerto", alvo: "corpo", expr: "piso(nd / 2)", quando: BYAKUGAN_ATIVO, duracao: "temporaria", nome: "Byakugan" },
          ],
        }],
      }],
    },
  ],
};

/**
 * "Regras da Era de Ouro": o que a Guilda muda no livro e acrescenta a ele, e que o
 * Motor já sabe dizer (autor, 2026-11-09). Inline pelo mesmo motivo dos dois de cima.
 *
 *   • A 4ª etapa do Treino de Perícia troca o sucesso garantido por metade do BT na
 *     perícia escolhida. É REMENDO do livro (`substitui`), e o remendo troca a lista
 *     INTEIRA de etapas: as três primeiras são cópia fiel das de `afty-treinamentos.js`.
 *   • O Talento Costas Largas soma 2 no limite de Acessórios equipados da Guilda. O
 *     número sai do campo `limiteAcessorios` do Talento, e não de um canal do Motor:
 *     o equipamento é o primeiro passo do derive, antes de qualquer efeito.
 */
export const PACOTE_REGRAS_ERA_DE_OURO = Object.freeze({
  id: "regras-da-era-de-ouro",
  nome: "Regras da Era de Ouro",
  versao: "1.1.0",
  autor: "Templas",
  paraRaw: "afty",
  descricao: "A 4ª etapa do Treino de Perícia passa a somar metade do bônus de treinamento nos testes da perícia escolhida, no lugar do sucesso garantido. Acrescenta o Talento Costas Largas, que aumenta em 2 o limite de itens vestidos, e os Clãs Uchiha e Hyuuga ao Herdado, com o Sharingan e o Byakugan.",
  resumo: "Treino de Perícia com metade do BT na 4ª etapa, o Talento Costas Largas e os Clãs Uchiha e Hyuuga",
  categoria: "regras",
  substitui: {
    treinamentos: [
      {
        id: "pericia",
        etapas: [
          { n: 1, focos: 1, requisito: null,
            beneficio: "Escolha uma perícia: você se torna treinado nela. Caso já seja, adicione +1 em testes de perícia usando-a.",
            efeitos: [
              { tipo: "profPericia", valor: 1, semCredito: true },
              { tipo: "pericia", valor: 1, quandoProf: 1 },
            ] },
          { n: 2, focos: 1, requisito: null,
            beneficio: "Duas vezes por descanso, você pode escolher realizar um teste da perícia escolhida para o treinamento com vantagem." },
          { n: 3, focos: 1, requisito: null,
            beneficio: "Você se torna mestre na perícia escolhida. Caso já seja, adicione +2 em testes de perícia usando-a.",
            efeitos: [
              { tipo: "profPericia", valor: 2, semCredito: true },
              { tipo: "pericia", valor: 2, quandoProf: 2 },
            ] },
          { n: 4, focos: 2, requisito: null,
            beneficio: "Você adiciona metade do seu bônus de treinamento em testes da perícia escolhida.",
            efeitos: [
              { canal: "bonusPericia", alvo: "instancia", expr: "piso(bt / 2)" },
            ] },
        ],
      },
    ],
  },
  estadosCombate: [
    { id: "sharingan_ativo", label: "Sharingan Ativo", tipo: "bool", title: "Sharingan", requerEscolha: "edo_uchiha_sharingan_desperto" },
    { id: "byakugan_ativo", label: "Byakugan Ativo", tipo: "bool", title: "Byakugan", requerEscolha: "edo_hyuuga_byakugan_desperto" },
  ],
  acrescenta: {
    clas: [CLA_UCHIHA, CLA_HYUUGA],
    talentos: [
      {
        id: "costas_largas",
        nome: "Costas Largas",
        grupo: "geral",
        descricao: "Seus ombros e costas largas aguentam o peso de mais relíquias do que o corpo comum, sem que a energia de uma atrapalhe a de outra. O seu limite de itens vestidos aumenta em 2.",
        requisitos: [],
        limiteAcessorios: 2,
      },
    ],
  },
});

/** Este pacote é nativo nesta ficha? A aba Addons não mostra o nativo. */
export const addonNativo = (ficha, idAddon) =>
  mesaDaFicha(ficha) !== null && NATIVOS_DA_GUILDA_IDS.includes(idAddon);

/**
 * As regras próprias da Guilda. Ver o cabeçalho para o formato de cada entrada.
 *
 * As três de 2026-11-09 valem só no PERSONAGEM (autor: a tabela de XP e as
 * Missões são "Só Personagem"). A Criatura da Guilda segue com o ND digitado.
 */
export const REGRAS_DA_MESA = [
  {
    id: "carteiraDaGuilda",
    tipo: "regra",
    sistemas: ["player"],
    fonte: "Um sistema similar ao Addon de carteira já embutido seguindo essas tabelas: Sendo inicial lv1 1 e apenas a parte de eventos tendo os valores totalmente personalizados. [...] Nível 1 / 0 de XP / +2 - Grau 4 [...] Nível 20 / 1250 de XP / +6",
    base: "Sem Carteira. Com o addon Carteira da Guilda, 0 de XP é o Nível 3 e a tabela vai até o 30",
    eradeouro: "Carteira embutida: o XP vira o Nível pela tabela da Guilda (0 de XP é o Nível 1, 1250 é o 20), os Focos de Interlúdio viram o orçamento de Focos, e as linhas nascem das Missões e dos Eventos",
    ativa: true,
  },
  {
    id: "grauEspecialNo17",
    tipo: "tela",
    sistemas: ["player"],
    fonte: "Nível 17 / 500 de XP / +6 - Grau Especial",
    base: "Semi-Grau Especial do 17 ao 20",
    eradeouro: "Grau Especial do 17 ao 20, com o mesmo rank e o mesmo conjunto de equipamentos",
    ativa: true,
  },
  {
    id: "abaPropriedades",
    tipo: "tela",
    sistemas: ["player"],
    fonte: "Além deste input adicional também terá, uma aba diferente denominada propriedades que as informações serão denominadas depois",
    base: "Sem a aba",
    eradeouro: "A aba Propriedades, ainda vazia",
    ativa: true,
  },
  /* As três de baixo valem na Guilda INTEIRA, criatura e personagem (autor, 2026-11-09). */
  {
    id: "limiteDeAcessorios",
    tipo: "regra",
    fonte: "Limite de 4 itens: Você pode usar no máximo 4 itens vestidos (como amuletos, anéis, capas, botas, braceletes, etc.) que forneçam bônus numéricos ou mecânicos. [...] Espaços e Empunhadura: Além dos 4 itens vestidos, o personagem pode ter itens empunhados (como armas e escudos) e armadura.",
    base: "Sem limite de Acessórios equipados",
    eradeouro: "No máximo 4 Acessórios equipados, mais o que os Talentos somam (Costas Largas, +2). O criador não equipa além do limite, e o que passar dele numa ficha antiga não vale",
    ativa: true,
  },
  {
    id: "treinoDeTrDuasVezes",
    tipo: "regra",
    fonte: "Treino de TR adicionado com no maximo de 2 vezes feito",
    base: "Uma vez por Teste de Resistência, exceto Integridade (até 4)",
    eradeouro: "No máximo 2 Testes de Resistência no Treino de Testes de Resistência",
    ativa: true,
  },
  {
    id: "maldicaoDaGuilda",
    tipo: "tela",
    fonte: "Adicionar como nativo estas origens substituindo as maldiçoes existentes",
    base: "A Maldição do livro no seletor de Origem",
    eradeouro: "Só a Maldição Era de Ouro no seletor. A ficha que já é Maldição do livro continua sendo",
    ativa: true,
  },
];

const POR_ID = new Map(REGRAS_DA_MESA.map((r) => [r.id, r]));

/* O sistema da ficha pelo `rulesVersion`, com o mesmo padrão do `normalizaSistema`
   (tudo que não é "player" é criatura). ⚠ Cópia, e não import: este módulo é FOLHA,
   e o `afty-addons` e o `afty-derive` o importam. */
const sistemaCru = (ficha) => (String(ficha?.rulesVersion ?? "").toLowerCase() === "player" ? "player" : "afty");

/**
 * Qual ramo vale para esta ficha: "eradeouro" ou "base". Id desconhecido ou
 * regra desligada devolve "base", pelo mesmo motivo de `regraDo`: um id errado
 * não pode derrubar o criador no meio da mesa. Regra de um tipo de ficha só
 * (`sistemas`) devolve "base" no outro.
 */
export const regraDaMesa = (ficha, idRegra) => {
  const r = POR_ID.get(idRegra);
  if (!r || !r.ativa) return "base";
  if (Array.isArray(r.sistemas) && !r.sistemas.includes(sistemaCru(ficha))) return "base";
  return mesaDaFicha(ficha) ?? "base";
};

/* ============================================================ */
/* A CARTEIRA DA GUILDA (autor, 2026-11-09)                       */
/* ============================================================ */
/**
 * A tabela de progressão da Guilda, no formato do `nivelPorXp` (afty-carteira.js).
 *
 * ⚠ SÓ A COLUNA DE XP VIROU DADO, como na Carteira da Guilda antiga. O "+N" da
 * tabela do autor é a Maestria do derive (sobe em 5, 9, 13 e 17) e o Grau é o grau
 * do feiticeiro (Terceiro no 5, Segundo no 9, Primeiro no 13), os dois já batendo
 * linha por linha. O único desvio é o NOME do 17, que é a regra `grauEspecialNo17`.
 * O `t-era-de-ouro.mjs` confere as três colunas contra a tabela escrita à mão.
 *
 * ⚠ ZERO DE XP É O NÍVEL 1 ("Sendo inicial lv1"), e acima de 1250 o nível fica no
 * 20, onde a tabela acaba.
 */
export const PROGRESSAO_ERA_DE_OURO = Object.freeze({
  base: 1,
  linhas: Object.freeze([
    { nivel: 2, xp: 20 }, { nivel: 3, xp: 40 }, { nivel: 4, xp: 60 },
    { nivel: 5, xp: 80 }, { nivel: 6, xp: 100 }, { nivel: 7, xp: 120 }, { nivel: 8, xp: 140 },
    { nivel: 9, xp: 160 }, { nivel: 10, xp: 180 }, { nivel: 11, xp: 200 }, { nivel: 12, xp: 220 },
    { nivel: 13, xp: 240 }, { nivel: 14, xp: 260 }, { nivel: 15, xp: 280 }, { nivel: 16, xp: 300 },
    { nivel: 17, xp: 500 }, { nivel: 18, xp: 700 }, { nivel: 19, xp: 900 }, { nivel: 20, xp: 1250 },
  ].map((l) => Object.freeze(l))),
});

/** O dinheiro da Guilda. */
export const MOEDA_ERA_DE_OURO = "Ichibuban";

/**
 * O Fim de Semana multiplica o XP por 1,5, nas Missões e nos Eventos (autor).
 * ⚠ O XP FICA QUEBRADO, e não vai ao `floor` do resto do Afty (autor, 2026-11-09:
 * a Missão Fácil vira 1,5). A Carteira já soma XP decimal, e o nível só sobe com
 * o ponto inteiro (`nivelPorXp` compara com `>=`).
 */
export const FIM_DE_SEMANA_XP = 1.5;

/* As recompensas por Missão. `focos` são os Focos de Interlúdio: só a Extrema dá. */
export const MISSOES_ERA_DE_OURO = Object.freeze([
  { id: "facil", label: "Fácil", rotulo: "Missão Fácil", xp: 1, dinheiro: 100, focos: 0 },
  { id: "medio", label: "Médio", rotulo: "Missão Média", xp: 3, dinheiro: 200, focos: 0 },
  { id: "dificil", label: "Difícil", rotulo: "Missão Difícil", xp: 5, dinheiro: 350, focos: 0 },
  { id: "extremo", label: "Extremo", rotulo: "Missão Extrema", xp: 10, dinheiro: 800, focos: 1 },
].map((m) => Object.freeze(m)));

/* Os Eventos. Os números são só o ponto de partida: a linha de Evento é editável. */
export const EVENTOS_ERA_DE_OURO = Object.freeze([
  { id: "semanal", label: "Semanal", rotulo: "Evento Semanal", xp: 20, dinheiro: 1500, focos: 2 },
  { id: "lendario", label: "Lendário", rotulo: "Evento Lendário", xp: 200, dinheiro: 4000, focos: 4 },
  { id: "personalizado", label: "Personalizado", rotulo: "Evento Personalizado", xp: 0, dinheiro: 0, focos: 0 },
].map((e) => Object.freeze(e)));

/** Os filtros da lista da Guilda, no formato de `filtraLinhasCarteira`. */
export const FILTROS_DA_GUILDA = Object.freeze([
  Object.freeze({ id: "missao", label: "Missões" }),
  Object.freeze({ id: "evento", label: "Eventos" }),
]);

const CATALOGO_DA_LINHA = { missao: MISSOES_ERA_DE_OURO, evento: EVENTOS_ERA_DE_OURO };

/** A Carteira embutida vale nesta ficha? */
export const carteiraDaGuilda = (ficha) => regraDaMesa(ficha, "carteiraDaGuilda") !== "base";

/** O XP com o Fim de Semana, em duas casas como o resto da Carteira. */
export const xpComFimDeSemana = (xp, fimDeSemana) =>
  (fimDeSemana ? Math.round(Number(xp) * FIM_DE_SEMANA_XP * 100) / 100 : Number(xp));

/** A Missão ou o Evento que preencheu a linha (a marca `guilda` dela), ou null. */
export const itemDaGuilda = (marca) =>
  CATALOGO_DA_LINHA[marca?.tipo]?.find((i) => i.id === marca?.id) ?? null;

/** "Missão Fácil", "Evento Semanal", ou null na linha sem marca. */
export const rotuloDaLinhaDaGuilda = (marca) => itemDaGuilda(marca)?.rotulo ?? null;

/** A linha de Missão é travada na tela, e a de Evento não. */
export const linhaTravada = (marca) => marca?.tipo === "missao" && itemDaGuilda(marca) !== null;

/**
 * Os campos de uma linha nova da Carteira, preenchida por uma Missão ou um Evento.
 * O `id` da linha não vem daqui, e sim do `createBlankEntradaCarteira`.
 *
 * ⚠ OS NÚMEROS FICAM GRAVADOS NA LINHA, e não são relidos da tabela depois. É a
 * regra da Loja de Catarse: mudar a tabela não reescreve a missão que já foi paga.
 */
export function linhaDaGuilda(tipo, id, fimDeSemana = false) {
  const item = itemDaGuilda({ tipo, id });
  if (!item) return null;
  const fds = !!fimDeSemana;
  return {
    nome: "",
    xp: xpComFimDeSemana(item.xp, fds),
    dinheiro: item.dinheiro,
    interludios: item.focos,
    tipo: "",
    guilda: { tipo, id, ...(fds ? { fimDeSemana: true } : {}) },
  };
}

/** O grau com o nome da Guilda. Valor, rank e ordem não mudam, e por isso o equipamento de missão também não. */
export const grauComNomeDaMesa = (ficha, grau) =>
  (grau?.value === "semiEspecial" && regraDaMesa(ficha, "grauEspecialNo17") !== "base"
    ? { ...grau, label: "Grau Especial" }
    : grau);

/* ============================================================ */
/* ITENS, TREINO DE TR E A MALDIÇÃO (autor, 2026-11-09)            */
/* ============================================================ */
/**
 * Os Acessórios equipados que a Guilda permite ANTES do que os Talentos somam
 * (`limiteAcessorios` do Talento, Costas Largas). `null` fora da Guilda: sem limite.
 *
 * ⚠ CONTA O ACESSÓRIO, e só ele. Arma, escudo e uniforme são os "itens empunhados
 * e armadura" que o texto deixa fora, e o item só estético não entra no inventário
 * (autor: "Fora do inventário"). As cópias repetidas contam, porque estão vestidas,
 * mesmo que o bônus delas já não some (livro p.365).
 */
export const LIMITE_DE_ACESSORIOS_DA_GUILDA = 4;
export const limiteBaseDeAcessorios = (ficha) =>
  (regraDaMesa(ficha, "limiteDeAcessorios") !== "base" ? LIMITE_DE_ACESSORIOS_DA_GUILDA : null);

/**
 * O teto de instâncias de uma Linha de Treinamento repetível na Guilda, pelo id que a
 * Linha tem no catálogo (já com o namespace do pacote). `null` quando não há teto.
 */
export const LIMITES_DE_TREINO_DA_GUILDA = Object.freeze({
  "treino-testes-de-resistencia:testes_de_resistencia": 2,
});
export const maxInstanciasDaMesa = (ficha, linhaId) =>
  (regraDaMesa(ficha, "treinoDeTrDuasVezes") !== "base" ? (LIMITES_DE_TREINO_DA_GUILDA[linhaId] ?? null) : null);

/**
 * A Origem do livro que a Guilda tira do seletor: a Maldição dá lugar à Maldição Era
 * de Ouro, que é nativa nela. A ficha que já gravou a Maldição do livro a mantém.
 */
const ORIGENS_TROCADAS_NA_GUILDA = Object.freeze(["maldicao"]);
export const origemForaDoSeletor = (ficha, origemId) =>
  regraDaMesa(ficha, "maldicaoDaGuilda") !== "base" && ORIGENS_TROCADAS_NA_GUILDA.includes(origemId);

/** Os textos da lista de fichas (o Dashboard) na língua da Guilda. */
export function vocabularioDeFichas() {
  const quantos = (n) => `${n} ${n === 1 ? "ficha" : "fichas"}`;
  return {
    todas: "Todas as Fichas",
    contagem: quantos,
    itens: "fichas",
    nova: "Nova Ficha",
    criarNova: "Criar nova ficha",
    criar: "Criar ficha",
    exportarVista: "Exportar fichas da visualização atual",
    exportarTitulo: "Exportar Fichas",
    importarTitulo: "Importar Fichas",
    arquivo: "fichas_exportadas",
    selecionadas: (sel, total) => `${sel} de ${total} selecionada(s)`,
    importadas: (n) => `${quantos(n)} ${n === 1 ? "importada" : "importadas"} com sucesso.`,
    buscar: "Buscar fichas",
    nenhumaBusca: "Nenhuma ficha combina com sua busca.",
    removida: "será removida permanentemente.",
    removidas: (n) => `${quantos(n)} ${n === 1 ? "será removida" : "serão removidas"} permanentemente.`,
  };
}

/** Sanidade da tabela acima, no molde de `validarSistemas`. */
export function validarRegrasDaMesa() {
  const erros = [];
  const vistos = new Set();
  for (const r of REGRAS_DA_MESA) {
    if (!r.id) erros.push("Regra da mesa sem id.");
    else if (vistos.has(r.id)) erros.push(`Regra da mesa duplicada: ${r.id}`);
    else vistos.add(r.id);
    if (r.tipo !== "regra" && r.tipo !== "tela") erros.push(`Regra da mesa ${r.id || "?"} com tipo inválido.`);
    if (!r.fonte) erros.push(`Regra da mesa ${r.id || "?"} sem fonte.`);
    if (r.sistemas !== undefined && (!Array.isArray(r.sistemas) || !r.sistemas.length
      || r.sistemas.some((s) => s !== "afty" && s !== "player"))) {
      erros.push(`Regra da mesa ${r.id || "?"} com sistemas inválidos.`);
    }
  }
  return erros;
}

/** Sanidade das tabelas da Carteira da Guilda: XP subindo, ids únicos e números de verdade. */
export function validarCarteiraDaGuilda() {
  const erros = [];
  let anterior = { nivel: PROGRESSAO_ERA_DE_OURO.base, xp: 0 };
  for (const l of PROGRESSAO_ERA_DE_OURO.linhas) {
    if (l.nivel !== anterior.nivel + 1) erros.push(`Progressão pula do Nível ${anterior.nivel} para o ${l.nivel}.`);
    if (!(l.xp > anterior.xp)) erros.push(`O XP do Nível ${l.nivel} não sobe.`);
    anterior = l;
  }
  for (const [nome, lista] of [["Missão", MISSOES_ERA_DE_OURO], ["Evento", EVENTOS_ERA_DE_OURO]]) {
    const vistos = new Set();
    for (const i of lista) {
      if (!i.id || vistos.has(i.id)) erros.push(`${nome} sem id ou repetida: ${i.id}`);
      vistos.add(i.id);
      if (!i.label || !i.rotulo) erros.push(`${nome} ${i.id} sem rótulo.`);
      for (const campo of ["xp", "dinheiro", "focos"]) {
        if (!Number.isFinite(i[campo]) || i[campo] < 0) erros.push(`${nome} ${i.id} com ${campo} inválido.`);
      }
    }
  }
  return erros;
}
