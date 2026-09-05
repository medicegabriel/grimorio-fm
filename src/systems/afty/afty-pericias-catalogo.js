/**
 * ============================================================
 * CATÁLOGOS CRUS DE PERÍCIA E ATAQUE
 * ============================================================
 * Só as DUAS listas, sem resolver nada. Existe como módulo FOLHA (zero
 * imports) porque afty-origens.js precisa delas para GERAR as opções das
 * escolhas de origem, e isso acontece no momento em que o módulo carrega.
 *
 * ⚠ Sem esta separação haveria ciclo: afty-pericias.js importa afty-efeitos.js,
 * que puxa combate → habilidades → especializações → origens, e origens voltaria
 * a afty-pericias.js ainda meio inicializado. O sintoma era um
 * "Cannot access AFTY_PERICIAS before initialization" que só aparecia quando
 * afty-pericias.js era o primeiro módulo do processo.
 *
 * Quem consome continua importando de ./afty-pericias.js, que reexporta as
 * duas: este arquivo é detalhe interno.
 * ============================================================
 */

export const AFTY_PERICIAS = [
  {
    id: "acrobacia", nome: "Acrobacia", atributo: "destreza",
    descricao:
      "Acrobacia representa sua capacidade de realizar tarefas que exigem agilidade e equilíbrio, " +
      "como manobras acrobáticas, escapar de agarrões e se manter em equilíbrio enquanto andando " +
      "por superfícies precárias.",
    exemplos:
      "espremer-se por através de espaços pequenos, soltar-se de cordas de maneira ágil e cair de " +
      "maneira adequada durante uma queda livre.",
  },
  {
    id: "atletismo", nome: "Atletismo", atributo: "forca",
    descricao:
      "Atletismo serve para representar as capacidades físicas que exigem força e resistência, " +
      "englobando proezas físicas como escalar, pular, empurrar, agarrar e outras aplicações de potência.",
    exemplos:
      "escalar superfícies inclinadas ou verticais, nadar por correntes de água, quebrar amarras o " +
      "segurando e forçar uma porta com seu corpo.",
  },
  {
    id: "direcao", nome: "Direção", atributo: "sabedoria", complementar: true,
    descricao:
      "Direção é a habilidade de conduzir veículos de maneira apropriada, conseguir dirigir ou pilotar " +
      "sem riscos, realizar manobras e manter altas velocidades de maneira segura.",
    exemplos:
      "perseguir um veículo, saltar por uma rampa com uma moto e recuperar o controle de um carro " +
      "desgovernado.",
  },
  {
    id: "enganacao", nome: "Enganação", atributo: "presenca",
    descricao:
      "Enganação indica a capacidade de passar mentiras de maneira convincente, alterar fatos enquanto " +
      "mantém as mudanças acreditáveis, omitir fatos específicos e manipular a verdade.",
    exemplos:
      "fingir não ser culpado por algo que fez, mudar os fatos enquanto contra o que aconteceu em uma " +
      "situação e fazer com que uma pessoa ou multidão acreditem que outra pessoa foi responsável por " +
      "uma situação ter acontecido.",
  },
  {
    id: "feiticaria", nome: "Feitiçaria", atributo: "inteligencia", requerTreinamento: true,
    descricao:
      "Feitiçaria engloba o conhecimento sobre as técnicas de Jujutsu em si, incluindo o quanto se sabe " +
      "sobre as técnicas, energia amaldiçoada ou figuras respeitadas nesse âmbito, assim como certas " +
      "aplicações básicas da energia.",
    exemplos:
      "analisar e entender as habilidades de um feiticeiro, aplicar sua técnica de maneira improvisada, " +
      "detectar presenças amaldiçoadas junto da sua intensidade e reconhecer feiticeiros de um clã.",
    nota: "De maneira geral, esta perícia só pode ser utilizada caso seja Treinado.",
  },
  {
    id: "furtividade", nome: "Furtividade", atributo: "destreza",
    descricao:
      "Furtividade é a capacidade de se esconder, mover-se de maneira discreta e passar sem deixar nem " +
      "rastros nem sinais de sua presença. Existem vários usos desta perícia que envolvem o movimento e " +
      "posicionamento, tendo uma seção própria a isso na página 297.",
    exemplos:
      "esconder-se em algum lugar, como um armário ou caixa, caminhar por um lugar sem deixar rastros " +
      "claros e se rastejar por um armazém lotado de inimigos.",
  },
  {
    id: "historia", nome: "História", atributo: "inteligencia",
    descricao:
      "História é usada para se recordar do passado e história do mundo, lembrando-se de eventos " +
      "históricos, figuras históricas, guerras e tudo mais que poderia ter se perdido no tempo, vivendo " +
      "apenas em registros e memórias.",
    exemplos:
      "se lembrar de quem foi uma pessoa específica em tempos antigos, recordar-se de um evento " +
      "específico ou reconhecer um idioma e o compreender.",
  },
  {
    id: "intimidacao", nome: "Intimidação", atributo: "presenca",
    descricao:
      "Intimidação mede a capacidade de impor sua presença contra alguém de maneira mais hostil, " +
      "ameaçando-a ou sendo hostil e violento, assim conseguindo o que deseja através do medo.",
    exemplos:
      "assustar alguém com um grito, tentar abalar a determinação de alguém e coagir uma pessoa a fazer " +
      "o que você deseja com ameaças.",
  },
  {
    id: "intuicao", nome: "Intuição", atributo: "sabedoria",
    descricao:
      "Intuição representa a capacidade de pressentir e compreender os arredores de maneira intuitiva, " +
      "percebendo intenções e desbancando mentiras.",
    exemplos:
      "perceber mentiras contadas a você, ter pressentimentos sobre a índole de uma pessoa, saber se há " +
      "algo anormal em uma situação e tentar prever movimentos de alguém.",
  },
  {
    id: "investigacao", nome: "Investigação", atributo: "inteligencia",
    descricao:
      "Investigação representa a sua capacidade de procurar por pistas e deduzir o significado delas, " +
      "assimilando fatos e estabelecendo conexões para achar um objeto oculto ou conhecimento de alguma " +
      "fonte antiga.",
    exemplos:
      "interrogar alguém para retirar informações, examinar um lugar em busca de algo e chegar até " +
      "respostas em um lugar movimentado onde elas estão entre a multidão.",
  },
  {
    id: "medicina", nome: "Medicina", atributo: "sabedoria", requerTreinamento: true,
    descricao:
      "Medicina define o conhecimento e a capacidade de realizar cuidados médicos, tratar feridas e " +
      "cuidar de quem estiver machucado.",
    exemplos:
      "tratar uma pessoa para ela se recuperar melhor, tratar uma doença ou veneno, realizar uma " +
      "autópsia e evitar que uma ferida infeccione ou pior.",
    nota:
      "De maneira geral, esta perícia só pode ser utilizada caso seja Treinado, exceto para primeiros " +
      "socorros (p.314).",
  },
  {
    id: "ocultismo", nome: "Ocultismo", atributo: "sabedoria",
    descricao:
      "Ocultismo engloba uma área específica e complexa do conhecimento, indicando sua capacidade de " +
      "reconhecer, identificar e se recordar sobre o oculto: eventos, criaturas e lendas sombrias.",
    exemplos:
      "reconhecer uma maldição originária de uma história, saber sobre uma lenda urbana e decifrar " +
      "escrituras sobre um tabu ou tema obscuro.",
  },
  {
    id: "oficio", nome: "Ofício", atributo: "inteligencia", requerTreinamento: true, subcategoria: true,
    descricao:
      "Ofício mede a capacidade e maestria na utilização de ferramentas específicas, criando itens, " +
      "realizando manutenções, reconhecendo as técnicas utilizadas para criar algo envolvendo o ofício e " +
      "outros. Esta perícia possui diversas categorias, como Ofício (Ferreiro) ou Ofício (Farmacêutico).",
    exemplos:
      "fabricar itens envolvendo o ofício específico, identificar itens raros ou exóticos e reparar " +
      "objetos danificados.",
    nota:
      "De maneira geral, esta perícia só pode ser utilizada caso seja Treinado e, ao se tornar treinado " +
      "em Ofício, você deve escolher uma subcategoria.",
  },
  {
    id: "percepcao", nome: "Percepção", atributo: "sabedoria",
    descricao:
      "Percepção é usada para tentar perceber, ouvir ou detectar a presença de algo ou alguém, " +
      "observando os arredores com atenção e sentidos afiados.",
    exemplos:
      "observar em busca de coisas discretas ou escondidas, escutar sons ou barulhos sutis e tentar " +
      "encontrar uma presença oculta.",
  },
  {
    id: "performance", nome: "Performance", atributo: "presenca",
    descricao:
      "Performance determina a capacidade de cativar as pessoas através de algum meio de arte ou " +
      "entretenimento, como a dança, atuação, música e tudo mais que se engloba.",
    exemplos:
      "agradar uma plateia com sua música, conseguir o interesse de pessoas com dança e atuar um papel " +
      "em uma apresentação.",
  },
  {
    id: "persuasao", nome: "Persuasão", atributo: "presenca",
    descricao:
      "Persuasão representa a capacidade de influenciar ou negociar com indivíduos ou multidões com sua " +
      "lábia, agradando e cativando as pessoas, assim como lidando com discussões e se portando de " +
      "maneira apropriada em situações diplomáticas.",
    exemplos:
      "conseguir permissão formal para adentrar em um lugar, convencer alguém a realizar um favor e " +
      "negociar para conseguir um preço menor em algo.",
  },
  {
    id: "prestidigitacao", nome: "Prestidigitação", atributo: "destreza", requerTreinamento: true,
    descricao:
      "Prestidigitação define a sua agilidade manual, utilizando das mãos com precisão e leveza para " +
      "arrombar fechaduras ou manusear objetos.",
    exemplos:
      "abrir uma fechadura com gazuas, pegar ou implantar um objeto em outra pessoa discretamente, " +
      "ocultar um objeto em si mesmo e sabotar algo.",
    nota: "De maneira geral, esta perícia só pode ser utilizada caso seja Treinado.",
  },
  {
    id: "sobrevivencia", nome: "Sobrevivência", atributo: "sabedoria", complementar: true,
    descricao:
      "Sobrevivência mede seus conhecimentos e capacidades em ambientes selvagens, identificando animais, " +
      "orientando-se, rastreando ou encontrando um abrigo e recursos necessários.",
    exemplos:
      "seguir os rastros naturais de alguma pessoa, guiar-se através de uma floresta e encontrar " +
      "alimentos ou água caso esteja perdido no meio de um ambiente selvagem.",
  },
  {
    id: "tecnologia", nome: "Tecnologia", atributo: "inteligencia",
    descricao:
      "Tecnologia mede a sua capacidade de entender e utilizar as mais diferentes tecnologias — " +
      "instrumentos, métodos e técnicas para resolver problemas — e a habilidade de manipular " +
      "dispositivos, analógicos ou digitais, e invadir ou reconfigurar sistemas.",
    exemplos:
      "hackear um computador, influenciar nos dispositivos de uma fábrica e realizar engenharia reversa " +
      "em alguma máquina.",
  },
  {
    id: "teologia", nome: "Teologia", atributo: "inteligencia", complementar: true,
    descricao:
      "Teologia envolve a capacidade de se recordar sobre figuras de religiões, crenças, filosofias, " +
      "ritos e as práticas pertencentes a cada uma.",
    exemplos:
      "entender e decifrar escritas religiosas, saber o que significa uma imagem ou símbolo e " +
      "identificar um rito sendo feito ou os vestígios dele.",
  },
];

/** Jogadas de Ataque (autor, 2026-07-27). Amaldiçoado é SEMPRE treinado. */
export const AFTY_ATAQUES = [
  {
    id: "corpo", nome: "Corpo a Corpo", atributo: "forca", atributoFineza: "destreza",
    descricao:
      "As jogadas de ataque corpo a corpo usam, por padrão, Força como modificador de atributo. Caso " +
      "esteja manejando uma arma com o traço Fineza, você pode escolher usar Destreza no lugar de Força.",
  },
  {
    id: "distancia", nome: "A Distância", atributo: "destreza",
    descricao: "As jogadas de ataque a distância usam, por padrão, Destreza como modificador de atributo.",
  },
  {
    id: "amaldicoado", nome: "Amaldiçoado", atributo: null, sempreTreinado: true,
    descricao:
      "As jogadas de ataque amaldiçoadas usam um modificador de atributo definido com base no personagem " +
      "e seu foco no uso do jujutsu. Você é sempre treinado.",
  },
];

/* ============================================================ */
/* REQUISITO DE TREINO (perícia e Teste de Resistência)          */
/* ============================================================ */
/**
 * ⚠ UM AVALIADOR SÓ PARA OS TRÊS CATÁLOGOS. Habilidades, Talentos e Aptidões
 * têm cada um o seu `avaliarRequisito*`, e os três repetem `atributo`, `origem`
 * e `aptidao` por conta própria. Aqui isso pararia de escalar: são SEIS formas
 * de pedir treino, e três cópias delas envelheceriam em ritmos diferentes.
 * Quem chama faz `const r = avaliarRequisitoDeTreino(req, ctx); if (r) return r;`
 * e segue para os tipos próprios dele.
 *
 * ⚠ O CAMINHO INVERSO JÁ EXISTIA, e é o motivo desta função. As Aptidões
 * converteram os `nota` delas em requisito real em 2026-07-30, com o `pericia`
 * escrito à mão dentro do `afty-aptidoes.js`, e as Habilidades e os Talentos
 * ficaram para trás por dois meses. Em 2026-09-01 o autor mandou fechar os
 * outros dois (*"fazer os Requisitos serem REALMENTE necessários"*), e a segunda
 * cópia teria virado a terceira.
 *
 * Lê a proficiência **resolvida** (`ctx.periciaProf`, `ctx.resistenciaProf`), e
 * não a escolhida na ficha: o Motor concede faixa, e quem ganhou Mestre em
 * Furtividade de uma habilidade atende ao requisito sem ter gasto vaga.
 *
 * ⚠ FALTA DE CONTEXTO NÃO É FALTA DE TREINO. Sem o mapa correspondente o
 * requisito cai para NÃO VERIFICÁVEL (exibe e não bloqueia), pela mesma razão do
 * `aptidao` dos Talentos: uma tela que esqueceu de passar o contexto não pode
 * trancar a ficha do jogador.
 */
const RANK_PROF = { treinado: 1, mestre: 2 };
/** Nomes dos atributos, para o rótulo do `periciaAtributo`. */
const ATRIBUTO_NOME = {
  forca: "Força", destreza: "Destreza", constituicao: "Constituição",
  inteligencia: "Inteligência", sabedoria: "Sabedoria", presenca: "Presença",
};
/* O Ofício do livro e os repetidos (`oficio__2`, `oficio__3`...).
   ⚠ MORA AQUI, e não no afty-pericias.js, porque este arquivo é FOLHA e o
   requisito de treino precisa dele: Habilidades, Talentos e Aptidões leem daqui,
   e importar o afty-pericias.js em qualquer um dos três seria ciclo. O
   afty-pericias.js reexporta, então nenhum import existente mudou. */
const OFICIO_ID_CAT = "oficio";
const OFICIO_EXTRA_CAT = /^oficio__(\d+)$/;
/** Este id é um Ofício (o do livro ou um dos repetidos)? */
export const ehPericiaOficio = (id) =>
  id === OFICIO_ID_CAT || OFICIO_EXTRA_CAT.test(String(id ?? ""));
const rankDe = (prof) => RANK_PROF[prof] ?? 0;
const rotuloFaixa = (nivel) => (nivel === "mestre" ? "Mestre" : "Treinado");

export const PERICIA_NOME = Object.fromEntries(AFTY_PERICIAS.map((p) => [p.id, p.nome]));

/** Os TRs, repetidos aqui como texto porque este arquivo é folha e não importa nada.
    O catálogo mora em `AFTY_RESISTENCIAS`, no afty-schema.js, e há assert conferindo
    que as duas listas batem. */
export const RESISTENCIA_NOME = {
  reflexos: "Reflexos", fortitude: "Fortitude", vontade: "Vontade",
  astucia: "Astúcia", integridade: "Integridade",
};

/** Ids de Ofício da ficha, incluindo os extras (`oficio__2`, `oficio__3`...). */
const idsDeOficio = (mapa) => Object.keys(mapa ?? {}).filter((id) => ehPericiaOficio(id));

/** Normaliza um nome de Ofício para comparar: sem acento, sem caixa, sem sobra. */
const chaveDeOficio = (s) => String(s ?? "")
  .normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

export function avaliarRequisitoDeTreino(requisito, ctx = {}) {
  const nivel = requisito?.nivel === "mestre" ? "mestre" : "treinado";
  const alvo = rankDe(nivel);
  const prof = ctx.periciaProf;
  const semMapa = (label) => ({ ok: true, verificavel: false, label });

  if (requisito?.tipo === "pericia") {
    const nome = PERICIA_NOME[requisito.pericia] || requisito.pericia;
    const label = `${rotuloFaixa(nivel)} em ${nome}`;
    if (!prof) return semMapa(label);
    return { ok: rankDe(prof[requisito.pericia]) >= alvo, verificavel: true, label };
  }

  /* "Treinamento em História ou Ocultismo" (Manual de Técnica). Basta UMA. */
  if (requisito?.tipo === "periciaOr") {
    const ids = Array.isArray(requisito.pericias) ? requisito.pericias : [];
    const label = `${rotuloFaixa(nivel)} em ${ids.map((p) => PERICIA_NOME[p] || p).join(" ou ")}`;
    if (!prof) return semMapa(label);
    return { ok: ids.some((p) => rankDe(prof[p]) >= alvo), verificavel: true, label };
  }

  /* "Treinado em alguma perícia de Presença" (Discurso Motivador). O pool sai do
     próprio catálogo pelo atributo, e não de uma lista escrita à mão. */
  if (requisito?.tipo === "periciaAtributo") {
    const nomeAttr = ATRIBUTO_NOME[requisito.attr] || requisito.attr;
    const label = `${rotuloFaixa(nivel)} em alguma perícia de ${nomeAttr}`;
    if (!prof) return semMapa(label);
    const pool = AFTY_PERICIAS.filter((p) => p.atributo === requisito.attr).map((p) => p.id);
    return { ok: pool.some((p) => rankDe(prof[p]) >= alvo), verificavel: true, label };
  }

  /* "Treinado em dois Ofícios" (Mestre da Criação). Conta as VAGAS de Ofício
     treinadas, e não os nomes: a ficha pode ter várias vagas, e é a faixa de
     cada uma que responde. */
  if (requisito?.tipo === "oficios") {
    const quantos = Math.max(1, Math.trunc(Number(requisito.quantidade) || 1));
    const label = `${rotuloFaixa(nivel)} em ${quantos} ${quantos === 1 ? "Ofício" : "Ofícios"}`;
    if (!prof) return semMapa(label);
    const treinados = idsDeOficio(prof).filter((id) => rankDe(prof[id]) >= alvo).length;
    return { ok: treinados >= quantos, verificavel: true, label };
  }

  /* "Treinado em Ferramentas de Médico" (Criar Medicina). Um Ofício NOMEADO, e o
     nome é texto livre que o jogador digita, então a comparação é normalizada.
     ⚠ Renomear o Ofício na ficha derruba o requisito, e é o comportamento certo:
     o livro pede aquele ofício, e o card diz qual. */
  if (requisito?.tipo === "oficio") {
    const label = `${rotuloFaixa(nivel)} em ${requisito.nome}`;
    if (!prof || !ctx.periciaOficios) return semMapa(label);
    const procurado = chaveDeOficio(requisito.nome);
    const ok = idsDeOficio(prof).some((id) => rankDe(prof[id]) >= alvo
      && (ctx.periciaOficios[id] ?? []).some((n) => chaveDeOficio(n) === procurado));
    return { ok, verificavel: true, label };
  }

  if (requisito?.tipo === "resistencia") {
    const nome = RESISTENCIA_NOME[requisito.resistencia] || requisito.resistencia;
    const label = `${rotuloFaixa(nivel)} em ${nome}`;
    if (!ctx.resistenciaProf) return semMapa(label);
    return { ok: rankDe(ctx.resistenciaProf[requisito.resistencia]) >= alvo, verificavel: true, label };
  }

  return null;
}

/**
 * Conferência de um requisito de treino: o id existe no catálogo?
 * Devolve string de erro ou `null`. Os três validadores de catálogo chamam.
 */
export function conferirRequisitoDeTreino(r) {
  if (r?.tipo === "pericia" && !PERICIA_NOME[r.pericia]) return `perícia inexistente "${r.pericia}"`;
  if (r?.tipo === "periciaOr") {
    const ruim = (r.pericias ?? []).find((p) => !PERICIA_NOME[p]);
    if (ruim) return `perícia inexistente "${ruim}"`;
    if ((r.pericias ?? []).length < 2) return "periciaOr precisa de duas perícias ou mais";
  }
  if (r?.tipo === "periciaAtributo" && !ATRIBUTO_NOME[r.attr]) return `atributo inexistente "${r.attr}"`;
  if (r?.tipo === "resistencia" && !RESISTENCIA_NOME[r.resistencia]) {
    return `Teste de Resistência inexistente "${r.resistencia}"`;
  }
  if (r?.tipo === "oficio" && !String(r.nome ?? "").trim()) return "requisito de Ofício sem nome";
  return null;
}
