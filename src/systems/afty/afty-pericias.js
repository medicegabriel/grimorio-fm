/**
 * ============================================================
 * PERÍCIAS E TESTES — GRIMÓRIO AFTY
 * ============================================================
 * Conteúdo é DADO (ver roadmap). Transcrição VERBATIM da seção "LISTA DE
 * PERÍCIAS" (tabela Perícia / Atributo Chave / Requer Treinamento? /
 * Complementar) e das descrições individuais, mandadas pelo autor em
 * 2026-07-27.
 *
 * Colunas do livro → campos:
 *   • atributo: chave do Atributo Chave (Força→forca, Presença→presenca, etc.).
 *   • requerTreinamento: a perícia só pode ser usada se a criatura for treinada
 *     nela (coluna "Requer Treinamento?" = Sim).
 *   • complementar: perícia que NÃO entra por padrão no jogo, opcional por
 *     campanha (coluna "Complementar" = Sim). Também é possível remover perícias
 *     padrão (ex.: Tecnologia numa campanha de época), a critério do Mestre.
 *   • descricao / exemplos / nota: os três parágrafos de cada verbete.
 *
 * Ordem = a da tabela do livro (alfabética). Ids estáveis, snake_case sem acento.
 *
 * ⚠ VERBATIM, com os deslizes do livro preservados: "quebrar amarras o
 * segurando" (Atletismo) e "mudar os fatos enquanto contra o que aconteceu"
 * (Enganação). O travessão em Tecnologia também é do original.
 *
 * ============================================================
 * OS TRÊS TIPOS DE TESTE (autor, 2026-07-27)
 * ============================================================
 * Perícias, Jogadas de Ataque e Testes de Resistência compartilham a MESMA
 * forma: `d20 + mod do atributo + metade do nível + bônus de treinamento
 * (se treinado) + outros bônus`. O que este arquivo devolve é a parte fixa
 * (tudo menos o d20). Ver `resolveTestes`.
 *
 * Os Testes de Resistência (os 5 nomeados) moram em AFTY_RESISTENCIAS, em
 * ./afty-schema.js, porque outros sistemas já os liam de lá.
 * ============================================================
 */

import { AFTY_ATTRS, AFTY_RESISTENCIAS } from "./afty-schema";

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

const BY_ID = Object.fromEntries(AFTY_PERICIAS.map((p) => [p.id, p]));
export const getPericia = (id) => BY_ID[id] || null;

/* ============================================================ */
/* PROFICIÊNCIA                                                  */
/* ============================================================ */
/* Duas faixas: Treinado soma o Bônus de Treinamento (== Maestria) cheio,
   Mestre soma ele mais metade. Mora aqui porque vale para os três tipos de
   teste e para as Invocações, que re-exportam daqui. */

export const PROFICIENCIAS = [
  { value: "treinado", label: "Treinado" },
  { value: "mestre",   label: "Mestre" },
];

export const bonusProficiencia = (bt, prof) =>
  prof === "mestre" ? bt + Math.floor(bt / 2) : (prof === "treinado" ? bt : 0);

/** Custo em vagas: Mestre vale 2, Treinado vale 1, destreinado 0. */
export const custoProficiencia = (prof) => (prof === "mestre" ? 2 : prof === "treinado" ? 1 : 0);

/** Vagas gastas por um mapa { [id]: "treinado" | "mestre" }. */
export const usoPericias = (periciasProf = {}) =>
  Object.values(periciasProf || {}).reduce((s, p) => s + custoProficiencia(p), 0);

/** Perícias padrão (as que entram no jogo por default, sem as complementares). */
export const periciasPadrao = () => AFTY_PERICIAS.filter((p) => !p.complementar);
/** Perícias complementares (opcionais por campanha). */
export const periciasComplementares = () => AFTY_PERICIAS.filter((p) => p.complementar);

/**
 * Perícias que uma INVOCAÇÃO pode ser treinada: as comuns (padrão), exceto
 * Ofício (o livro proíbe treinar Invocação em Ofício). Complementares ficam de
 * fora por serem opcionais de campanha.
 */
export const periciasParaInvocacao = () =>
  AFTY_PERICIAS.filter((p) => !p.complementar && p.id !== "oficio");

/* ============================================================ */
/* OS TRÊS TIPOS DE TESTE                                        */
/* ============================================================ */

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

/**
 * Orçamento de treinos (autor, 2026-07-27):
 * `3 + maior modificador entre Inteligência e Sabedoria + rank do Grau + outros`.
 * O rank do Grau do Feiticeiro é 1 no Quarto e vai até 5 no Especial, e sai do
 * ND (ver grauFeiticeiro em ./afty-equipamentos.js). Mestre custa 2 vagas.
 *
 * ⚠ **Perícias E Testes de Resistência gastam deste mesmo caixa** (autor,
 * 2026-07-27). Jogadas de Ataque não.
 */
export function totalPericias({ modInt = 0, modSab = 0, grauRank = 1, bonus = 0 } = {}) {
  return 3 + Math.max(modInt, modSab) + Math.max(0, Math.trunc(grauRank)) + Math.max(0, Math.trunc(bonus));
}

/**
 * Resolve os três tipos de teste da criatura. Os três somam
 * `mod do atributo + uma escala de nível + bônus de treinamento + outros`,
 * e o que sai daqui é essa parte fixa (tudo menos o d20).
 *
 * ⚠ A ESCALA DE NÍVEL NÃO É A MESMA NOS TRÊS (planilha do autor, 2026-07-27):
 *   • **Testes de Resistência** usam a escala por TIPO, a mesma da CD e da
 *     Defesa. Ver `escala` em AFTY_RESISTENCIAS.
 *   • **Jogadas de Ataque** usam `INT(ND/1,5)`, igual para todo Tipo (a mesma
 *     escala fixa da Integridade), mais a Maestria cheia se treinado. Sem
 *     faixa de Mestre: a fórmula do autor só testa "treinado".
 *   • **Perícias** seguem em `metade do ND`, que é a fórmula do JOGADOR no
 *     livro. **PENDENTE:** as outras duas tinham fórmula própria da criatura,
 *     então esta provavelmente também tem. Perguntado, sem resposta ainda.
 *
 * ctx = { nd, bt, mods, tecnicaAttr, grauRank, escalaCD, escalaDefesa, bonusVagas }.
 */
export function resolveTestes(creature, ctx = {}) {
  const nd = Math.max(1, Math.trunc(Number(ctx.nd) || 1));
  const bt = Math.max(0, Math.trunc(Number(ctx.bt) || 0));
  const mods = ctx.mods || {};
  const meioNivel = Math.floor(nd / 2);
  const modDe = (attr) => Math.trunc(Number(mods[attr]) || 0);
  const bonusDe = (attr, prof) => modDe(attr) + meioNivel + bonusProficiencia(bt, prof);

  // Escalas de nível. `cd` e `defesa` vêm prontas do deriveAfty (são as mesmas
  // da CD e da Defesa, não recalculo aqui), e a `fixa` é INT(ND/1,5), usada
  // pela Integridade e por TODAS as Jogadas de Ataque.
  const escalaFixa = Math.floor(nd / 1.5);
  const ESCALA_TR = {
    cd: Math.trunc(Number(ctx.escalaCD) || 0),
    defesa: Math.trunc(Number(ctx.escalaDefesa) || 0),
    fixa: escalaFixa,
  };

  const profBruta = creature?.pericias && typeof creature.pericias === "object" ? creature.pericias : {};
  const valida = (p) => (p === "treinado" || p === "mestre" ? p : null);

  // `requerTreinamento` e `complementar` seguem no catálogo (são a tabela do
  // livro e o filtro das Invocações depende deles), mas NÃO viram marcação na
  // tela: o autor tirou as duas da UI em 2026-07-27. Quem precisa da regra lê
  // a `nota` verbatim dentro da descrição.
  const pericias = AFTY_PERICIAS.map((p) => {
    const prof = valida(profBruta[p.id]);
    return { ...p, prof, bonus: bonusDe(p.atributo, prof) };
  });

  const trBruta = creature?.resistenciasProf && typeof creature.resistenciasProf === "object"
    ? creature.resistenciasProf : {};
  const resistencias = AFTY_RESISTENCIAS.map((r) => {
    const prof = valida(trBruta[r.value]);
    return {
      ...r,
      prof,
      // Escala por Tipo no lugar da metade do nível, ver o cabeçalho da função.
      bonus: modDe(r.atributo) + (ESCALA_TR[r.escala] ?? 0) + bonusProficiencia(bt, prof),
      // Só quem é mestre num TR consegue sucesso crítico nele (superar a CD
      // por 10 ou mais ignora dano e condições).
      critico: prof === "mestre",
    };
  });

  // Ataque = mod do atributo + INT(ND/1,5) + Maestria se treinado. Sem faixa de
  // Mestre: a fórmula do autor só testa "treinado", e é a Maestria cheia.
  const atqBruta = creature?.ataquesProf && typeof creature.ataquesProf === "object" ? creature.ataquesProf : {};
  const fineza = !!creature?.ataqueFineza;
  const ataques = AFTY_ATAQUES.map((a) => {
    const treinado = a.sempreTreinado || !!atqBruta[a.id];
    const attr = a.id === "amaldicoado"
      ? (ctx.tecnicaAttr || "inteligencia")
      : (a.id === "corpo" && fineza ? a.atributoFineza : a.atributo);
    return {
      ...a,
      atributo: attr,
      treinado,
      bonus: modDe(attr) + escalaFixa + (treinado ? bt : 0),
    };
  });

  const total = totalPericias({
    modInt: modDe("inteligencia"),
    modSab: modDe("sabedoria"),
    grauRank: ctx.grauRank ?? 1,
    bonus: ctx.bonusVagas ?? 0,
  });
  // Perícias E Testes de Resistência dividem as mesmas vagas (autor,
  // 2026-07-27). Jogadas de Ataque ficam fora: elas não têm faixa de Mestre e
  // o treino delas é com a arma que a criatura maneja.
  const gastoPericias = pericias.reduce((s, p) => s + custoProficiencia(p.prof), 0);
  const gastoResistencias = resistencias.reduce((s, r) => s + custoProficiencia(r.prof), 0);
  const gastos = gastoPericias + gastoResistencias;

  return {
    pericias,
    resistencias,
    ataques,
    orcamento: {
      total, gastos, pericias: gastoPericias, resistencias: gastoResistencias,
      restante: total - gastos, excedeu: gastos > total,
    },
    // Atenção = 10 + o bônus de Percepção (Percepção passiva).
    atencao: 10 + (pericias.find((p) => p.id === "percepcao")?.bonus ?? 0),
  };
}

/** Validador de conteúdo (mesmo papel de validarCatalogoAptidoes). */
export function validarCatalogoPericias() {
  const erros = [];
  const ids = new Set();
  const nomes = new Set();
  const attrKeys = new Set(AFTY_ATTRS.map((a) => a.key));
  for (const p of AFTY_PERICIAS) {
    if (ids.has(p.id)) erros.push(`id duplicado: ${p.id}`);
    ids.add(p.id);
    if (nomes.has(p.nome)) erros.push(`nome duplicado: ${p.nome}`);
    nomes.add(p.nome);
    if (!p.nome) erros.push(`${p.id}: sem nome`);
    if (!attrKeys.has(p.atributo)) erros.push(`${p.id}: atributo inválido "${p.atributo}"`);
  }
  return erros;
}
