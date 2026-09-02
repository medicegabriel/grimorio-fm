/**
 * ============================================================
 * ADDONS DO AFTY — o registro
 * ============================================================
 * A camada em que cada mesa ACRESCENTA conteúdo próprio ao Afty sem abrir o
 * GitHub. O desenho inteiro, com as 7 decisões do autor datadas, está em
 * `docs/afty-addons.md`. Aqui mora a fase 1, e só ela.
 *
 * ------------------------------------------------------------
 * AS DUAS FRASES QUE SEGURAM O SISTEMA
 * ------------------------------------------------------------
 * 1. **Um addon pode tudo que o Motor já sabe dizer, e nada além.** Falta de
 *    canal ou de função vira trabalho no MOTOR, e o addon passa a usar.
 * 2. **Addon nunca ganha verbo escondido.** Verbo (mecanismo genérico) entra no
 *    motor, substantivo (o conteúdo da mesa) fica aqui.
 *
 * ⚠ ADDON É DADO, NUNCA JavaScript. Sem backend, um addon viaja como arquivo
 * entre pessoas, e código de terceiro rodando na aba alcança o `localStorage`
 * inteiro: todas as criaturas, todos os encontros, todos os temas. O que um
 * addon escreve de "lógica" é DSL (`afty-dsl.js`), que só faz aritmética e cai
 * no fallback quando erra.
 *
 * ------------------------------------------------------------
 * O QUE ESTA FASE FAZ, E O QUE ELA NÃO FAZ
 * ------------------------------------------------------------
 * FAZ: **acrescentar** entradas a catálogos que já existem, e **remendar** uma
 * entrada do livro trocando campos dela (`substitui`, ver `remendarLista`).
 * NÃO FAZ: desligar entrada do raw, trocar tabela (fase 4), rodar código
 * (fase 5). O autor pediu as duas metades da fase 3 em 2026-08-20 e aprovou
 * adiá-las; o REMENDO entrou em 2026-08-22, quando ele mandou um Addon que
 * reescreve Domínio Simples e dois Talentos de Origem. Desligar continua fora.
 *
 * Acrescentar é a metade segura, e por um motivo estrutural: como todo id nasce
 * com o namespace do pacote, a UNIÃO dos addons de todas as criaturas
 * carregadas nunca colide, e criatura que não usa um id simplesmente não o
 * referencia. Por isso o encontro misto (decisão 3 do autor) sai de graça aqui,
 * e só fica caro na fase 3.
 *
 * ------------------------------------------------------------
 * COMO O MUNDO É RECONSTRUÍDO
 * ------------------------------------------------------------
 * Os catálogos do Afty são `export const` lidos em dezenas de lugares. Em vez
 * de trocar cada ponto de leitura por uma função, o registro **reescreve o
 * array no lugar** e manda a família religar os índices dela.
 *
 * Isso é estado mutável de módulo, e a escolha é consciente. O que ela compra:
 *
 *   • zero mudança nos ~60 pontos que hoje leem os catálogos.
 *   • os 13 `validarCatalogo*` passam a validar o conteúdo de addon DE GRAÇA,
 *     porque eles leem o mesmo array. O portão de aceitação já estava escrito.
 *
 * O que ela cobra: quem memoriza em cima de catálogo precisa da ÉPOCA
 * (`epocaAddons()`) na dependência, senão não recalcula. O `useMemo` do builder
 * é o caso conhecido.
 * ============================================================
 */

import { normalizarMarca } from "./afty-dsl";
// Sem risco de ciclo: `afty-sistema.js` não importa nada.
import { sistemaDaFicha, regraDo } from "./afty-sistema";

/* ============================================================ */
/* O REGISTRO DE FAMÍLIAS                                        */
/* ============================================================ */
/**
 * É isto que sustenta a promessa de "generalista" do autor: abrir uma família
 * nova ao addon é **uma linha aqui**, e não um caso especial espalhado.
 *
 * Cada família declara:
 *   • `rotulo`      nome na tela e nas mensagens de erro.
 *   • `chave`       o campo que identifica a entrada (`id` na maioria,
 *                   `value` nas tabelas curtas como Tipo de Dano).
 *   • `obrigatorios` campos sem os quais a entrada não entra.
 *   • `aplicar`     a função da família que reescreve o catálogo e religa os
 *                   índices internos dela. Só ela conhece as estruturas
 *                   derivadas do próprio módulo.
 *   • `validador`   o `validarCatalogo*` da família, para rodar DEPOIS de
 *                   acrescentar e reprovar o que quebrou.
 *   • `caminhosDeId` onde, dentro da entrada, existem referências a outros ids
 *                   que precisam ganhar o mesmo prefixo. Ver `prefixarEntrada`.
 *
 * ⚠ Começa com UMA família ligada de propósito (2026-08-20). O caminho inteiro
 * (pacote, namespace, validação, religação, época) fica provado numa família
 * antes de as outras doze entrarem, e assim um erro de desenho custa uma
 * família e não treze.
 */
const FAMILIAS = new Map();

/**
 * Liga uma família ao registro. Chamado pelo próprio módulo da família, para o
 * conhecimento das estruturas internas dela não vazar para cá.
 */
export function registrarFamilia(id, def) {
  FAMILIAS.set(id, {
    id,
    rotulo: def.rotulo ?? id,
    chave: def.chave ?? "id",
    obrigatorios: def.obrigatorios ?? ["nome"],
    caminhosDeId: def.caminhosDeId ?? [],
    aplicar: def.aplicar,
    validador: def.validador ?? null,
    // As duas de baixo servem à LINHA MORTA (ver `problemasDeAddon`): uma diz
    // como achar a entrada pelo id, a outra diz onde a ficha guarda os ids
    // daquela família.
    resolver: def.resolver ?? null,
    idsDaFicha: def.idsDaFicha ?? null,
    // A lista RAW da família, sem addon nenhum. Só o REMENDO usa: ele aponta
    // para id do livro, e é aqui que se confere se aquele id existe mesmo. Não
    // dá para perguntar ao `resolver`, que enxerga o mundo já com addons e
    // deixaria um pacote remendar a entrada de outro sem querer.
    basicos: def.basicos ?? null,
    // Família cujo catálogo não é lista de entradas com campos (Tipo de Dano é
    // um mapa, Condição é uma string). Nelas não existe "trocar um campo".
    remendavel: def.remendavel !== false,
  });
}

/** As famílias abertas a addon, para a UI listar e para o validador conferir. */
export const familiasDeAddon = () =>
  [...FAMILIAS.values()].map((f) => ({ id: f.id, rotulo: f.rotulo }));

/* ============================================================ */
/* NAMESPACE                                                     */
/* ============================================================ */
/**
 * Todo id que um addon cria nasce prefixado com o id do pacote, e o autor do
 * addon **escreve sem o prefixo**. Duas coisas saem disso:
 *
 *   • colisão com o raw fica impossível para sempre.
 *   • um id órfão numa ficha de terceiro é LEGÍVEL: dá para dizer de que addon
 *     ele veio em vez de ele virar um buraco sem nome.
 *
 * O separador é `:`, que nenhum id do raw usa (eles são `lut_`, `cmb_`, `tal_`).
 */
export const SEPARADOR = ":";

export const comPrefixo = (pacoteId, id) => `${pacoteId}${SEPARADOR}${id}`;

/** Parte um id de addon. Id do raw devolve `{ pacoteId: null, id }`. */
export function partirId(id) {
  const s = String(id ?? "");
  const i = s.indexOf(SEPARADOR);
  return i === -1 ? { pacoteId: null, id: s } : { pacoteId: s.slice(0, i), id: s.slice(i + 1) };
}

export const ehIdDeAddon = (id) => partirId(id).pacoteId !== null;

/**
 * Prefixa o id próprio da entrada e as referências que a família declarou em
 * `caminhosDeId`.
 *
 * ⚠ REFERÊNCIA RESOLVE LOCAL PRIMEIRO, RAW DEPOIS. Um `requisito` apontando
 * para `ciclo_de_adaptacao` acha o do próprio addon, e um apontando para
 * `lut_corpo_treinado` acha o raw. A regra é: se o id citado existe DENTRO do
 * pacote, ele ganha o prefixo; senão fica como está e vai procurar no raw.
 *
 * ⚠ Caminho que a família NÃO declarou fica intocado, e portanto aponta para o
 * raw. É o padrão certo, porque a esmagadora maioria das referências de um
 * addon mira conteúdo do livro. Quando aparecer um caminho novo, declarar aqui
 * é preferível a adivinhar a forma inteira da entrada.
 */
function prefixarEntrada(entrada, pacoteId, chave, caminhosDeId, idsLocais) {
  const out = { ...entrada, [chave]: comPrefixo(pacoteId, entrada[chave]) };
  const local = (v) => (idsLocais.has(String(v)) ? comPrefixo(pacoteId, v) : v);

  for (const caminho of caminhosDeId) {
    // "requisitos[].id" e "concedeEscolha.habilidade" são as duas formas.
    const [cabeca, ...resto] = caminho.split(".");
    if (cabeca.endsWith("[]")) {
      const campo = cabeca.slice(0, -2);
      if (!Array.isArray(out[campo])) continue;
      const sub = resto.join(".");
      out[campo] = out[campo].map((item) =>
        item && sub && item[sub] !== undefined ? { ...item, [sub]: local(item[sub]) } : item,
      );
    } else if (resto.length === 0) {
      if (out[cabeca] !== undefined) out[cabeca] = local(out[cabeca]);
    } else if (out[cabeca] && typeof out[cabeca] === "object") {
      const sub = resto.join(".");
      if (out[cabeca][sub] !== undefined) {
        out[cabeca] = { ...out[cabeca], [sub]: local(out[cabeca][sub]) };
      }
    }
  }
  return out;
}

/* ============================================================ */
/* REMENDO (fase 3, a metade que o autor pediu em 2026-08-22)    */
/* ============================================================ */
/**
 * Um remendo TROCA CAMPOS de uma entrada que já existe no livro, sem criar
 * entrada nova. É o que o `acrescenta` não sabe fazer: dois Talentos com o
 * mesmo nome na lista não é remendo, é confusão.
 *
 * ⚠ A SUBSTITUIÇÃO É POR CAMPO E É RASA. `{ descricao }` troca a descrição e
 * deixa `requisitos` como estavam; `{ requisitos: [...] }` troca a lista
 * INTEIRA, e não mistura item a item. Mesclar fundo pareceria mais gentil e
 * seria imprevisível: ninguém consegue adivinhar o que sai de duas listas
 * casadas por índice, e apagar um requisito viraria impossível.
 *
 * ⚠ O ID É INTOCÁVEL. Ele é a âncora do remendo e a chave de tudo que já está
 * gravado nas fichas. Trocar o id seria apagar a entrada e criar outra, que é
 * exatamente o que o `acrescenta` faz e o remendo não.
 *
 * ⚠ O PREÇO, NOMEADO NO PLANO E NÃO RESOLVIDO POR ESTA FUNÇÃO: um remendo
 * aponta para id do raw, e o dia em que o livro renomear aquele id o remendo
 * de terceiro apodrece. O que existe contra isso é o portão de instalação
 * (`validarPacote` confere o id contra a lista RAW da família, e recusa o
 * pacote inteiro) e a revalidação a cada `aplicarAddons`. Não é manutenção
 * zero, e o plano já dizia que não seria.
 *
 * `remendos` é um Map(id -> patch). Devolve lista NOVA, com as entradas não
 * remendadas passando por referência.
 */
export function remendarLista(base, remendos, chave = "id") {
  if (!remendos || remendos.size === 0) return base;
  return base.map((entrada) => {
    const patch = remendos.get(String(entrada?.[chave]));
    if (!patch) return entrada;
    return {
      ...entrada,
      ...patch.campos,
      [chave]: entrada[chave],
      // De quem veio o remendo, para a tela poder dizer que aquela linha não é
      // mais a do livro. Lista porque dois pacotes podem tocar a mesma entrada.
      remendadoPor: [...(entrada.remendadoPor ?? []), ...patch.por],
    };
  });
}

/* ============================================================ */
/* O PACOTE                                                      */
/* ============================================================ */

/** Teto do pacote. Mesmo espírito do `CSS_MAX` do tema: avisa, não bloqueia. */
export const PACOTE_MAX = 256 * 1024;

/**
 * Cópia FUNDA de uma entrada, na entrada do catálogo.
 *
 * ⚠ SEM ISTO O CATÁLOGO E A FICHA SALVA DIVIDEM OBJETO. O pacote que está em
 * `creature.addons` é o mesmo que alimenta o mundo, e o `{ ...entrada }` do
 * `prefixarEntrada` é raso: `escolha`, `requisitos` e afins continuavam sendo a
 * MESMA referência dos dois lados. Como o sistema MUTA entrada de catálogo em
 * pelo menos um lugar (`dona.escolha.opcoes = HABILIDADES_ROUBAVEIS`, em
 * afty-habilidades.js), uma mutação do catálogo vazava para dentro da criatura
 * gravada. Achado em 2026-08-20, na revisão da fase 1.
 *
 * Volta e meia por JSON, e não por `structuredClone`, de propósito: o pacote É
 * JSON (veio de um `JSON.parse` do campo de colar), e a ida e volta ainda tira
 * de brinde qualquer coisa que não seja serializável e que tenha entrado por
 * um caminho torto.
 */
const clonar = (e) => {
  try { return JSON.parse(JSON.stringify(e)); } catch { return { ...e }; }
};

/** Id de pacote: minúsculas, número e hífen. É ele que vira o namespace. */
const ID_PACOTE_OK = /^[a-z0-9][a-z0-9-]{1,39}$/;
/** Id de entrada: o vocabulário dos ids do raw, sem o separador. */
const ID_ENTRADA_OK = /^[a-z0-9][a-z0-9_]{0,63}$/;

/**
 * Saneia um pacote cru (o que veio do JSON colado) numa forma previsível.
 * NÃO valida: quem reprova é o `validarPacote`. Aqui só se garante que os
 * campos existem com o tipo certo, para o validador poder falar de conteúdo em
 * vez de morrer num `undefined`.
 */
/* ============================================================ */
/* PRIMITIVAS DA FASE 0                                          */
/* ============================================================ */
/**
 * As primitivas que o MOTOR ganhou para atender casos de Addon. Elas vivem no
 * motor sempre (é o VERBO, e verbo é do motor), mas **só aparecem na tela de
 * quem instalou um addon que as PEDIU**, pelo campo `permite` do pacote.
 *
 * ⚠ ISTO NASCEU DE UM ERRO MEU, e vale escrito para não repetir. Ao fechar a
 * 8.3 eu construí o verbo, marquei a primitiva como pronta e parei ali. O
 * resultado foi que o card "Concedido pelo Mestre" apareceu na tela de jogo de
 * TODO MUNDO, com zero addons instalados, listando o catálogo raw inteiro. O
 * autor viu no deploy e apontou (2026-08-20): *"deveria ser algo próprio de
 * Addon"*. As outras duas primitivas tinham vazado igual, mais baixinho: o
 * `contar()` no seletor de variáveis e o `hpAtributo` no seletor de canais.
 *
 * A lição, que vale para a fase 3 e para a 8.4: **acrescentar o verbo ao motor
 * não é a tarefa inteira**. Falta sempre dizer quem enxerga o verbo, e o padrão
 * do projeto é que quem enxerga é quem pediu.
 */
export const PRIMITIVAS = [
  {
    id: "concessao",
    rotulo: "Concessão do Mestre",
    nota: "O mestre acrescenta Habilidade, Talento, Treino e afins na criatura no meio da luta",
  },
  {
    id: "contar",
    rotulo: "Marcas e contar()",
    nota: "A função contar(\"marca\") do DSL, e o grupo Marcas no seletor de variáveis",
  },
  {
    id: "hpAtributo",
    rotulo: "Atributo do PV",
    nota: "O canal que TROCA a Constituição no cálculo do PV",
  },
  {
    id: "adaptacao",
    rotulo: "Ciclo de Adaptação",
    nota: "Progressão de sessão com giro manual, avanço por rodada e marcos configuráveis",
  },
];

const PRIMITIVA_IDS = new Set(PRIMITIVAS.map((p) => p.id));

/* ============================================================ */
/* LIBERAÇÕES                                                    */
/* ============================================================ */
/**
 * O que ter o addon DESTRAVA para a criatura que o carrega.
 *
 * ⚠ NÃO CONFUNDIR COM `permite`, e a diferença é a razão de existirem dois
 * campos em vez de um:
 *
 *   • `permite` é TELA. Ele decide quem ENXERGA uma primitiva que o motor já
 *     tem, e por definição não muda número nenhum (há assert medindo isso).
 *   • `libera` é REGRA. Ele muda o que a criatura PODE ter, e portanto muda
 *     número.
 *
 * Misturar os dois faria o `permite` às vezes mexer na ficha e às vezes não, o
 * que quebra a única coisa que ele promete.
 *
 * ⚠ A liberação é lida DIRETO DA CRIATURA, e não por canal do Motor. Isso é de
 * propósito: ela é uma pergunta estrutural ("esta criatura pode ter Estilo?")
 * que precisa ser respondida antes de quase tudo, e um canal só ficaria pronto
 * no meio da derivação. Ver `liberacoesDaCriatura`.
 */
export const LIBERACOES = [
  {
    id: "estiloSombras",
    rotulo: "Estilo das Sombras",
    nota: "Destrava o Novo Estilo da Sombra fora do Sem Técnica, inclusive para quem tem Feitiços",
  },
  {
    id: "gemeosSemTecnica",
    rotulo: "Sem Técnica em Verdadeiras Origens",
    nota: "O Gêmeo pode copiar Estudos Dedicados ou Empenho Implacável, que o texto proíbe",
  },
  {
    id: "qualificaSemTecnica",
    rotulo: "Qualifica Como Sem Técnica",
    nota: "A criatura conta como Origem Sem Técnica para pré-requisito de Talento e de Linha de Treinamento",
  },
  {
    id: "gemeosMaldicao",
    rotulo: "Maldição em Verdadeiras Origens",
    nota: "O Gêmeo pode copiar da Maldição, e copiar passa a fazer a criatura seguir as regras de estrutura dela",
  },
  /* As quatro entradas que saíram da Ficha de Jogador em 2026-09-01. O id segue
     o molde do `liberacaoSoPorAddon`, e cada uma é NOMEADA: quem quer só o
     Gêmeos de volta não reabre as outras três de brinde. Na ficha de criatura
     nenhuma delas saiu, então a liberação não faz nada lá. */
  {
    id: "soPorAddon:gemeos",
    rotulo: "Origem Gêmeos no Jogador",
    nota: "Devolve a origem Gêmeos à lista de origens da Ficha de Jogador",
  },
  {
    id: "soPorAddon:atributo",
    rotulo: "Treino de Atributo no Jogador",
    nota: "Devolve a Linha de Treinamento Treino de Atributo à lista de Interlúdios da Ficha de Jogador",
  },
  {
    id: "soPorAddon:cnj_agilidade_no_campo_de_batalha",
    rotulo: "Agilidade no Campo de Batalha no Jogador",
    nota: "Devolve a Habilidade [2.0] Agilidade no Campo de Batalha à lista do Conjurador na Ficha de Jogador",
  },
  {
    id: "soPorAddon:tal_alma_livre",
    rotulo: "Talento Alma Livre no Jogador",
    nota: "Devolve o Talento Alma Livre à lista de Talentos da Ficha de Jogador",
  },
];

const LIBERACAO_IDS = new Set(LIBERACOES.map((l) => l.id));

/** Nenhuma liberação. Congelado, para virar valor padrão sem alocar. */
export const SEM_LIBERACOES = Object.freeze([]);

/**
 * O que os addons DESTA criatura destravam.
 *
 * ⚠ Sai da criatura, e não do mundo aplicado, pela mesma razão do
 * `primitivasDaCriatura`: num Encontro misto o mundo é a UNIÃO de todos, e um
 * combatente sem o addon não pode herdar a regra de quem tem.
 */
export function liberacoesDaCriatura(creature) {
  const lista = Array.isArray(creature?.addons) ? creature.addons : [];
  const out = new Set();
  for (const pacote of lista) {
    for (const id of Array.isArray(pacote?.libera) ? pacote.libera : []) {
      if (LIBERACAO_IDS.has(id)) out.add(id);
    }
  }
  return out.size ? [...out] : SEM_LIBERACOES;
}

/* ============================================================ */
/* CONTEÚDO SÓ POR ADDON                                         */
/* ============================================================ */
/**
 * Entradas do livro que NÃO existem na Ficha de Jogador, e que uma mesa devolve
 * instalando um Addon. O autor pediu quatro em sequência em 2026-09-01.
 *
 * A entrada do catálogo se marca com `foraDoJogador: true`, e a divergência
 * `conteudoSoPorAddon` decide se a marca vale. É UM mecanismo para as quatro
 * porque a regra é a mesma: o que muda de uma para outra é só qual entrada.
 *
 * ⚠ NENHUMA VIROU ADDON DE VERDADE, e a razão é medida no Gêmeos: ele tem NOVE
 * ganchos no motor presos ao id CRU `"gemeos"`. Id de addon nasce com o
 * namespace do pacote, então viraria `pacote:gemeos` e os nove quebrariam
 * calados. Tirar da LISTA resolve o pedido sem tocar em id nenhum.
 *
 * ⚠ A LIBERAÇÃO É POR ID, e não uma chave geral. Uma mesa que queira só o Gêmeos
 * de volta não deve reabrir as outras três de brinde.
 */
export const liberacaoSoPorAddon = (id) => `soPorAddon:${id}`;

/**
 * Uma lista de catálogo, sem o que este sistema não tem.
 *
 * Três portas deixam a entrada marcada passar, e a terceira é a que protege
 * ficha salva:
 *
 *   1. o sistema é criatura, onde ela nunca saiu.
 *   2. um Addon desta criatura declara a liberação daquele id.
 *   3. ⚠ A FICHA JÁ TEM A ENTRADA (decisão do autor). Sem esta porta a lista
 *      abriria sem a opção gravada, e a próxima edição trocaria a escolha do
 *      personagem por acidente. Tirar da lista é fechar a PORTA, e não confiscar
 *      o que já passou por ela.
 *
 * `jaNaFicha` é o conjunto de ids que a ficha já escolheu naquela família. Quem
 * chama sabe onde eles moram, e por isso ele vem de fora.
 */
export function filtraForaDoJogador(lista, creature, jaNaFicha = null, chave = "id") {
  if (!Array.isArray(lista) || !lista.length) return lista;
  // Sai cedo quando não há nada marcado: é o caso de quase toda lista, e assim o
  // filtro não custa nem uma leitura de divergência.
  if (!lista.some((e) => e?.foraDoJogador)) return lista;
  if (regraDo(sistemaDaFicha(creature), "conteudoSoPorAddon") !== "player") return lista;
  const liberadas = liberacoesDaCriatura(creature);
  const tem = jaNaFicha instanceof Set ? jaNaFicha : new Set(jaNaFicha || []);
  return lista.filter((e) => !e?.foraDoJogador
    || liberadas.includes(liberacaoSoPorAddon(e?.[chave]))
    || tem.has(e?.[chave]));
}

/** Nenhuma primitiva. Congelado, para virar valor padrão sem alocar. */
export const SEM_PRIMITIVAS = Object.freeze([]);

/**
 * As primitivas que os addons DESTA criatura pedem.
 *
 * ⚠ Sai da criatura, e não do mundo aplicado: num Encontro misto o mundo é a
 * UNIÃO de todos, e um combatente sem addon nenhum não pode herdar a tela de
 * quem tem. É a mesma razão de a marca de "não raw" sair da ficha.
 */
export function primitivasDaCriatura(creature) {
  const lista = Array.isArray(creature?.addons) ? creature.addons : [];
  const out = new Set();
  for (const pacote of lista) {
    for (const id of Array.isArray(pacote?.permite) ? pacote.permite : []) {
      if (PRIMITIVA_IDS.has(id)) out.add(id);
    }
  }
  return out.size ? [...out] : SEM_PRIMITIVAS;
}

export function normalizarPacote(cru) {
  const p = cru && typeof cru === "object" ? cru : {};
  const acrescenta = p.acrescenta && typeof p.acrescenta === "object" ? p.acrescenta : {};
  const substitui = p.substitui && typeof p.substitui === "object" ? p.substitui : {};
  const out = {
    id: String(p.id ?? "").trim().toLowerCase(),
    nome: String(p.nome ?? "").trim(),
    versao: String(p.versao ?? "").trim() || "1.0.0",
    autor: String(p.autor ?? "").trim(),
    descricao: String(p.descricao ?? "").trim(),
    paraRaw: String(p.paraRaw ?? "afty").trim(),
    /* As primitivas que este pacote quer VER na tela. Só isto: o motor já as
       tem, e o campo diz quem as enxerga. Ver `PRIMITIVAS`. */
    permite: Array.isArray(p.permite)
      ? [...new Set(p.permite.filter((x) => typeof x === "string").map((x) => x.trim()))]
      : [],
    /* O que ter este pacote DESTRAVA na criatura. Ao contrário do `permite`,
       isto muda regra e portanto muda número. Ver `LIBERACOES`. */
    libera: Array.isArray(p.libera)
      ? [...new Set(p.libera.filter((x) => typeof x === "string").map((x) => x.trim()))]
      : [],
    adaptacoes: Array.isArray(p.adaptacoes)
      ? p.adaptacoes.filter((x) => x && typeof x === "object").map(clonar)
      : [],
    /* Funcionamentos Básicos próprios do pacote. Eles não entram no catálogo
       global: saem direto da cópia congelada em `creature.addons`, para uma
       criatura nunca herdar o Funcionamento de outra no mesmo encontro. */
    funcionamentos: Array.isArray(p.funcionamentos)
      ? p.funcionamentos.filter((x) => x && typeof x === "object").map(clonar)
      : [],
    /* Modelos de Feitiço próprios do pacote. Diferente de conteúdo de catálogo,
       eles não entram automaticamente na ficha nem gastam vaga enquanto forem
       só modelos. A pessoa escolhe um modelo já liberado e recebe uma cópia. */
    feiticos: Array.isArray(p.feiticos)
      ? p.feiticos.filter((x) => x && typeof x === "object").map(clonar)
      : [],
    acrescenta: {},
    /* O que este pacote REESCREVE de entradas que já existem no livro. Ver
       `remendarLista`. */
    substitui: {},
  };
  for (const [familia, lista] of Object.entries(acrescenta)) {
    out.acrescenta[familia] = Array.isArray(lista)
      ? lista.filter((e) => e && typeof e === "object")
      : [];
  }
  for (const [familia, lista] of Object.entries(substitui)) {
    out.substitui[familia] = Array.isArray(lista)
      ? lista.filter((e) => e && typeof e === "object")
      : [];
  }
  return out;
}

/**
 * Modelos de Feitiço liberados para esta criatura.
 *
 * O addon é uma biblioteca privada, não uma concessão de vagas. Por isso a
 * lista respeita o maior Nível de Feitiço acessível e devolve cópias para o
 * criador. Só depois de escolher um modelo ele entra em `creature.feiticos` e
 * passa a contar no orçamento normal da ficha.
 */
export function feiticosDeAddon(creature, nivelMax = 5) {
  const teto = nivelMax === "max" ? 6 : Math.max(0, Math.trunc(Number(nivelMax) || 0));
  const modelos = [];
  const vistos = new Set();
  for (const pacote of Array.isArray(creature?.addons) ? creature.addons : []) {
    const pacoteId = String(pacote?.id ?? "").trim();
    if (!pacoteId) continue;
    for (const feitico of Array.isArray(pacote?.feiticos) ? pacote.feiticos : []) {
      const idLocal = String(feitico?.id ?? "").trim();
      const nome = String(feitico?.nome ?? "").trim();
      const nivel = feitico?.nivel === "max" ? 6 : Math.trunc(Number(feitico?.nivel));
      if (!idLocal || !nome || !Number.isFinite(nivel) || nivel > teto) continue;
      const id = `${pacoteId}${SEPARADOR}${idLocal}`;
      if (vistos.has(id)) continue;
      vistos.add(id);
      modelos.push({
        ...clonar(feitico),
        id,
        nome,
        deAddon: true,
        addonId: pacoteId,
        addonNome: String(pacote?.nome ?? pacoteId),
        addonModeloId: idLocal,
        addonVersao: String(pacote?.versao ?? ""),
      });
    }
  }
  return modelos;
}

/**
 * Reprova o que não pode entrar. Devolve `[]` quando o pacote está bom.
 *
 * ⚠ NINGUÉM INSTALA ADDON QUEBRADO (decisão 4 do autor), mas ficha já salva
 * SEMPRE abre. São dois portões diferentes: aqui é o da instalação, e ele é
 * duro. O da ficha é a linha morta e marcada, que não impede nada.
 */
export function validarPacote(cru, { idsEmUso = new Set() } = {}) {
  const p = normalizarPacote(cru);
  const problemas = [];

  if (!p.id) problemas.push("O pacote precisa de um id.");
  else if (!ID_PACOTE_OK.test(p.id)) {
    problemas.push(`id do pacote inválido: "${p.id}". Use minúsculas, números e hífen, de 2 a 40 caracteres.`);
  } else if (idsEmUso.has(p.id)) {
    problemas.push(`Já existe um addon instalado com o id "${p.id}".`);
  }
  if (!p.nome) problemas.push("O pacote precisa de um nome.");
  if (p.paraRaw !== "afty") problemas.push(`Este pacote é para "${p.paraRaw}", e não para o Afty.`);

  for (const id of p.permite) {
    if (!PRIMITIVA_IDS.has(id)) {
      problemas.push(
        `Primitiva desconhecida em "permite": "${id}". Existem hoje: ${PRIMITIVAS.map((x) => x.id).join(", ")}.`,
      );
    }
  }
  for (const id of p.libera) {
    if (!LIBERACAO_IDS.has(id)) {
      problemas.push(
        `Liberação desconhecida em "libera": "${id}". Existem hoje: ${LIBERACOES.map((x) => x.id).join(", ")}.`,
      );
    }
  }
  const ciclosVistos = new Set();
  if (p.adaptacoes.length > 0 && !p.permite.includes("adaptacao")) {
    problemas.push('Pacote com "adaptacoes" precisa incluir "adaptacao" em "permite".');
  }
  for (const [i, ciclo] of p.adaptacoes.entries()) {
    const onde = `Adaptação #${i + 1}`;
    const id = String(ciclo.id ?? "").trim();
    if (!id || !ID_ENTRADA_OK.test(id)) problemas.push(`${onde}: id inválido.`);
    else if (ciclosVistos.has(id)) problemas.push(`${onde}: id repetido ("${id}").`);
    ciclosVistos.add(id);
    if (!String(ciclo.nome ?? "").trim()) problemas.push(`${onde}: falta o campo "nome".`);
    if (ciclo.ganho !== "habilidades_bonus_acerto") problemas.push(`${onde}: ganho desconhecido.`);
    if (ciclo.mecanica !== "auxiliar_acerto_progressivo") problemas.push(`${onde}: mecânica desconhecida.`);
    if (Math.trunc(Number(ciclo.intervalo)) < 1) problemas.push(`${onde}: intervalo inválido.`);
  }

  const funcionamentosVistos = new Set();
  for (const [i, funcionamento] of p.funcionamentos.entries()) {
    const onde = `Funcionamento Básico #${i + 1}`;
    const id = String(funcionamento.id ?? "").trim();
    const efeitos = funcionamento.efeitos;
    if (!id || !ID_ENTRADA_OK.test(id)) problemas.push(`${onde}: id inválido.`);
    else if (funcionamentosVistos.has(id)) problemas.push(`${onde}: id repetido ("${id}").`);
    funcionamentosVistos.add(id);
    if (!String(funcionamento.nome ?? "").trim()) problemas.push(`${onde}: falta o campo "nome".`);
    if (efeitos !== undefined && !Array.isArray(efeitos)) {
      problemas.push(`${onde}: "efeitos" precisa ser uma lista.`);
      continue;
    }
    if (!String(funcionamento.descricao ?? "").trim() && !(efeitos?.length > 0)) {
      problemas.push(`${onde}: precisa ter "descricao" ou "efeitos".`);
    }
    for (const [j, efeito] of (efeitos ?? []).entries()) {
      if (!efeito || typeof efeito !== "object") {
        problemas.push(`${onde}, efeito #${j + 1}: precisa ser um objeto.`);
        continue;
      }
      if (!String(efeito.canal ?? "").trim()) problemas.push(`${onde}, efeito #${j + 1}: falta o campo "canal".`);
      if (!String(efeito.expr ?? "").trim()) problemas.push(`${onde}, efeito #${j + 1}: falta o campo "expr".`);
    }
  }

  const feiticosVistos = new Set();
  const tiposFeitico = new Set(["dano", "auxiliar", "curativo", "especial", "passivo", "personalizado"]);
  for (const [i, feitico] of p.feiticos.entries()) {
    const onde = `Feitiço #${i + 1}`;
    const id = String(feitico.id ?? "").trim();
    const nivel = feitico.nivel;
    if (!id || !ID_ENTRADA_OK.test(id)) problemas.push(`${onde}: id inválido.`);
    else if (feiticosVistos.has(id)) problemas.push(`${onde}: id repetido ("${id}").`);
    feiticosVistos.add(id);
    if (!String(feitico.nome ?? "").trim()) problemas.push(`${onde}: falta o campo "nome".`);
    if (![0, 1, 2, 3, 4, 5, "max"].includes(nivel)) problemas.push(`${onde}: nível inválido.`);
    if (!tiposFeitico.has(feitico.tipo)) problemas.push(`${onde}: tipo inválido.`);
    if (!String(feitico.descricao ?? "").trim()) problemas.push(`${onde}: falta o campo "descricao".`);
    if (feitico.rolagens !== undefined && !Array.isArray(feitico.rolagens)) {
      problemas.push(`${onde}: "rolagens" precisa ser uma lista.`);
    }
    for (const [j, rolagem] of (Array.isArray(feitico.rolagens) ? feitico.rolagens : []).entries()) {
      if (!rolagem || typeof rolagem !== "object") {
        problemas.push(`${onde}, rolagem #${j + 1}: precisa ser um objeto.`);
        continue;
      }
      if (Math.trunc(Number(rolagem.dados)) < 1 || Math.trunc(Number(rolagem.faces)) < 2) {
        problemas.push(`${onde}, rolagem #${j + 1}: dados inválidos.`);
      }
    }
  }

  const familias = Object.keys(p.acrescenta);
  /* ⚠ ACRESCENTAR DEIXOU DE SER OBRIGATÓRIO em 2026-08-21. Um pacote que só
     DESTRAVA (`libera`) ou só MOSTRA (`permite`) é legítimo e não traz conteúdo
     nenhum: o caso que abriu isto é o addon que solta o Estilo das Sombras fora
     do Sem Técnica, que não acrescenta uma linha de catálogo. O que continua
     reprovado é o pacote que não faz NADA das três coisas. */
  const familiasRemendadas = Object.keys(p.substitui).filter((f) => p.substitui[f].length);
  if (
    familias.length === 0
    && familiasRemendadas.length === 0
    && p.permite.length === 0
    && p.libera.length === 0
    && p.adaptacoes.length === 0
    && p.funcionamentos.length === 0
    && p.feiticos.length === 0
  ) {
    problemas.push("O pacote não acrescenta, não substitui, não libera, não permite e não traz Funcionamento Básico ou Feitiço.");
  }

  const vistos = new Set();
  for (const familia of familias) {
    const def = FAMILIAS.get(familia);
    if (!def) {
      problemas.push(
        `Família desconhecida: "${familia}". Abertas hoje: ${familiasDeAddon().map((f) => f.id).join(", ") || "nenhuma"}.`,
      );
      continue;
    }
    const lista = p.acrescenta[familia];
    if (lista.length === 0) continue;

    for (const [i, e] of lista.entries()) {
      const onde = `${def.rotulo} #${i + 1}`;
      const id = String(e[def.chave] ?? "").trim();
      if (!id) { problemas.push(`${onde}: falta o campo "${def.chave}".`); continue; }
      if (!ID_ENTRADA_OK.test(id)) {
        problemas.push(`${onde}: id inválido ("${id}"). Use minúsculas, números e sublinhado, e não use "${SEPARADOR}".`);
      }
      const marca = `${familia}/${id}`;
      if (vistos.has(marca)) problemas.push(`${onde}: id repetido dentro do pacote ("${id}").`);
      vistos.add(marca);

      for (const campo of def.obrigatorios) {
        if (e[campo] === undefined || e[campo] === null || e[campo] === "") {
          problemas.push(`${onde} ("${id}"): falta o campo "${campo}".`);
        }
      }
      if (e.tags !== undefined && !Array.isArray(e.tags)) {
        problemas.push(`${onde} ("${id}"): "tags" precisa ser uma lista.`);
      }
    }
  }

  /* O portão do REMENDO. Mais duro que o do acréscimo, e de propósito: um
     acréscimo que ninguém referencia é inofensivo, e um remendo que erra o alvo
     é uma regra que a pessoa acha que trocou e não trocou. */
  const remendados = new Set();
  for (const familia of Object.keys(p.substitui)) {
    const def = FAMILIAS.get(familia);
    if (!def) {
      problemas.push(
        `Família desconhecida em "substitui": "${familia}". Abertas hoje: ${familiasDeAddon().map((f) => f.id).join(", ") || "nenhuma"}.`,
      );
      continue;
    }
    if (!def.remendavel) {
      problemas.push(`${def.rotulo} não aceita remendo: o catálogo dela não é feito de entradas com campos.`);
      continue;
    }
    const idsRaw = def.basicos ? new Set(def.basicos().map((e) => String(e[def.chave]))) : null;
    for (const [i, e] of p.substitui[familia].entries()) {
      const onde = `Remendo de ${def.rotulo} #${i + 1}`;
      const id = String(e[def.chave] ?? "").trim();
      if (!id) { problemas.push(`${onde}: falta o campo "${def.chave}", que diz o que remendar.`); continue; }
      const marca = `${familia}/${id}`;
      if (remendados.has(marca)) problemas.push(`${onde}: "${id}" remendado duas vezes no mesmo pacote.`);
      remendados.add(marca);
      if (ehIdDeAddon(id)) {
        problemas.push(`${onde}: "${id}" é id de addon. Um remendo aponta para entrada do livro.`);
        continue;
      }
      if (idsRaw && !idsRaw.has(id)) {
        problemas.push(`${onde}: o livro não tem ${def.rotulo.toLowerCase()} "${id}".`);
        continue;
      }
      const campos = Object.keys(e).filter((k) => k !== def.chave);
      if (campos.length === 0) problemas.push(`${onde} ("${id}"): o remendo não troca campo nenhum.`);
      for (const campo of def.obrigatorios) {
        if (campo in e && (e[campo] === undefined || e[campo] === null || e[campo] === "")) {
          problemas.push(`${onde} ("${id}"): "${campo}" é obrigatório e o remendo o esvazia.`);
        }
      }
    }
  }

  const tamanho = JSON.stringify(p).length;
  if (tamanho > PACOTE_MAX) {
    problemas.push(
      `O pacote tem ${Math.round(tamanho / 1024)}KB, acima do teto de ${PACOTE_MAX / 1024}KB.`,
    );
  }
  return problemas;
}

/* ============================================================ */
/* O MUNDO                                                       */
/* ============================================================ */

let pacotesAtivos = [];
let epoca = 0;

/**
 * Contador que sobe a cada troca do conjunto de addons.
 *
 * ⚠ QUEM MEMORIZA EM CIMA DE CATÁLOGO PRECISA DISTO NA DEPENDÊNCIA. O
 * `useMemo(() => deriveAfty(draft), [draft])` do builder não recalcularia ao
 * instalar um addon, porque o `draft` não mudou: o catálogo é que mudou por
 * baixo. É a armadilha nomeada na seção 3 do `docs/afty-addons.md`.
 */
export const epocaAddons = () => epoca;

/** Os pacotes no ar agora, na ordem em que foram aplicados. */
export const addonsAtivos = () => pacotesAtivos.map((p) => ({
  id: p.id, nome: p.nome, versao: p.versao, autor: p.autor, descricao: p.descricao,
}));

/** O pacote que declarou um id, ou null. Serve para a ficha nomear a origem. */
export function pacoteDoId(id) {
  const { pacoteId } = partirId(id);
  if (!pacoteId) return null;
  return pacotesAtivos.find((p) => p.id === pacoteId) ?? null;
}

/**
 * Reconstrói o mundo: catálogo raw mais os acréscimos de todos os pacotes.
 *
 * É SEMPRE do zero, e nunca incremental. Aplicar A e depois B tem de dar
 * exatamente o mesmo resultado que aplicar [A, B] de uma vez, senão desinstalar
 * um addon deixaria restos. Cada família recebe a lista inteira dela e reescreve
 * o próprio catálogo.
 *
 * Devolve `{ aplicados, problemas }`. Pacote com problema é RECUSADO INTEIRO, e
 * não pela metade: meio addon é pior que nenhum, porque o que falta vira número
 * errado sem sintoma.
 */
export function aplicarAddons(pacotes = []) {
  const limpos = [];
  const problemas = [];
  const idsEmUso = new Set();

  for (const cru of Array.isArray(pacotes) ? pacotes : []) {
    const p = normalizarPacote(cru);
    const ruins = validarPacote(p, { idsEmUso });
    if (ruins.length) { problemas.push({ pacote: p.id || "(sem id)", problemas: ruins }); continue; }
    idsEmUso.add(p.id);
    limpos.push(p);
  }

  // Junta por família, já prefixado, e entrega tudo de uma vez a cada uma.
  const porFamilia = new Map([...FAMILIAS.keys()].map((f) => [f, []]));
  for (const p of limpos) {
    /* ⚠ OS IDS LOCAIS SÃO DO PACOTE INTEIRO, e não da família (2026-08-31).
       Eram por família até a Estrela dos Zenin, e ali o furo apareceu: o
       marcador dela cita o CLÃ dela por `requerId`, os dois vêm no mesmo JSON, e
       como a busca só olhava a própria lista a referência ficava CRUA enquanto o
       clã ganhava o namespace. O marcador então apontava para um id que não
       existia e simplesmente nunca aparecia, calado.

       Um pacote é uma unidade: citar um irmão é citar um irmão, esteja ele na
       mesma família ou não. Referência que não acha irmão nenhum continua crua e
       vai procurar no raw, que segue sendo o caso comum. */
    const idsLocais = new Set();
    for (const [familia, lista] of Object.entries(p.acrescenta)) {
      const def = FAMILIAS.get(familia);
      if (!def) continue;
      for (const e of lista) idsLocais.add(String(e[def.chave]));
    }
    for (const [familia, lista] of Object.entries(p.acrescenta)) {
      const def = FAMILIAS.get(familia);
      if (!def || !lista.length) continue;
      for (const e of lista) {
        porFamilia.get(familia).push({
          ...prefixarEntrada(clonar(e), p.id, def.chave, def.caminhosDeId, idsLocais),
          addonId: p.id,
          addonNome: p.nome,
        });
      }
    }
  }

  // Os REMENDOS, juntados na mesma passada. Um Map por família, chaveado pelo
  // id do raw. Dois pacotes tocando a mesma entrada é permitido e a ORDEM
  // decide: o último instalado escreve por cima, e os dois ficam anotados em
  // `remendadoPor` para a tela poder mostrar quem venceu.
  const remendosPorFamilia = new Map([...FAMILIAS.keys()].map((f) => [f, new Map()]));
  for (const p of limpos) {
    for (const [familia, lista] of Object.entries(p.substitui)) {
      const def = FAMILIAS.get(familia);
      if (!def || !lista.length) continue;
      const mapa = remendosPorFamilia.get(familia);
      for (const e of lista) {
        const id = String(e[def.chave]);
        const { [def.chave]: _ignora, ...campos } = clonar(e);
        const antigo = mapa.get(id);
        mapa.set(id, {
          campos: { ...(antigo?.campos ?? {}), ...campos },
          por: [...(antigo?.por ?? []), { id: p.id, nome: p.nome }],
        });
      }
    }
  }

  for (const [familia, extras] of porFamilia) {
    FAMILIAS.get(familia).aplicar(extras, remendosPorFamilia.get(familia));
  }

  pacotesAtivos = limpos;
  epoca += 1;

  // Os validadores do raw agora enxergam o conteúdo de addon, porque leem o
  // mesmo array. Se algum reprovar, o problema é do addon, e a fase 1 apenas o
  // RELATA: desfazer aqui deixaria o mundo pela metade, e a ficha tem a linha
  // morta e marcada para isso.
  for (const def of FAMILIAS.values()) {
    if (!def.validador) continue;
    const ruins = def.validador();
    if (ruins?.length) problemas.push({ pacote: `(validador de ${def.rotulo})`, problemas: ruins });
  }

  return { aplicados: addonsAtivos(), problemas };
}

/** Volta ao raw puro. */
export const limparAddons = () => aplicarAddons([]);

/* ============================================================ */
/* OS ADDONS DA CRIATURA                                         */
/* ============================================================ */
/**
 * ⚠ O ADDON MORA DENTRO DA CRIATURA, e é cópia congelada, não referência.
 *
 * É a mesma decisão que o autor já tomou para o tema da Ficha em 2026-08-05
 * (*"quero mandar minha ficha bonitinha para os outros"*): exportar a ficha
 * exporta as regras dela, ninguém recebe ficha quebrada, e não existe servidor
 * de registro, URL nem fetch.
 *
 * A biblioteca (`fm_addons_afty_v1`) é a outra morada, e serve para instalar,
 * editar e ATUALIZAR. Quem manda no cálculo é a cópia embutida, e é por isso que
 * o addon mudar não mexe sozinho nas fichas antigas: a ficha avisa que existe
 * versão nova, e atualizar é um botão.
 */
export function addonsDaCriatura(creature) {
  const lista = creature?.addons;
  return Array.isArray(lista) ? lista.map(normalizarPacote) : [];
}

/**
 * A união dos addons de VÁRIAS criaturas, para o Encontro misto (decisão 3 do
 * autor: *"nem sempre é mudança geral de sistema, pode ser mudança mínima em uma
 * única criatura"*).
 *
 * A união é segura porque nesta fase o addon só ACRESCENTA e todo id é
 * prefixado: dois pacotes nunca disputam a mesma entrada. Quando o mesmo pacote
 * aparecer em duas fichas com versões diferentes, vale a PRIMEIRA e a divergência
 * é relatada, porque escolher sozinho qual versão vence mudaria números de uma
 * ficha que o dono não abriu.
 */
export function unirAddons(criaturas = []) {
  const porId = new Map();
  const divergencias = [];
  for (const c of criaturas) {
    for (const p of addonsDaCriatura(c)) {
      const antigo = porId.get(p.id);
      if (!antigo) { porId.set(p.id, p); continue; }
      if (antigo.versao !== p.versao) {
        divergencias.push({ id: p.id, nome: p.nome, versoes: [antigo.versao, p.versao] });
      }
    }
  }
  return { pacotes: [...porId.values()], divergencias };
}

/* ============================================================ */
/* LINHA MORTA E MARCADA                                         */
/* ============================================================ */
/**
 * O que a criatura CITA e o mundo não tem.
 *
 * ⚠ DECISÃO 4 DO AUTOR (2026-08-20), com as palavras dele: *"Linha Morta e
 * Marcada, se possível com algum indicativo para descobrir o problema."*
 *
 * São DOIS portões diferentes, e confundi-los é o erro clássico:
 *
 *   • INSTALAR um addon é portão DURO. `validarPacote` reprova, e addon
 *     quebrado não entra (ver `afty-addons-biblioteca.js`).
 *   • ABRIR uma ficha NUNCA falha. A entrada aparece marcada, não soma nada, e
 *     diz o que houve. Recusar a abrir puniria a pessoa por um problema que ela
 *     talvez nem tenha causado, e a ficha pode ter vindo de outra mesa.
 *
 * Cada problema carrega de onde veio, o que falhou e o que fazer, porque o
 * pedido foi explicitamente que desse para DESCOBRIR o problema, e não só saber
 * que existe um.
 */
export function problemasDeAddon(creature) {
  const naFicha = new Set(addonsDaCriatura(creature).map((p) => p.id));
  const ativos = new Set(pacotesAtivos.map((p) => p.id));
  const out = [];

  for (const def of FAMILIAS.values()) {
    if (!def.idsDaFicha || !def.resolver) continue;
    for (const id of def.idsDaFicha(creature) ?? []) {
      const { pacoteId, id: idCru } = partirId(id);
      if (!pacoteId) continue;          // id do raw: não é assunto de addon
      if (def.resolver(id)) continue;   // resolveu, está tudo certo

      const motivo = !naFicha.has(pacoteId)
        ? `A ficha usa "${idCru}", do addon "${pacoteId}", que não está ligado nesta criatura.`
        : !ativos.has(pacoteId)
          ? `O addon "${pacoteId}" está na ficha mas não pôde ser carregado.`
          : `O addon "${pacoteId}" não declara mais "${idCru}". Ele pode ter sido renomeado ou removido numa versão nova.`;

      out.push({
        familia: def.id,
        rotulo: def.rotulo,
        id,
        pacoteId,
        idCru,
        motivo,
        // O que resolve, para o aviso não terminar num beco.
        saida: naFicha.has(pacoteId)
          ? "Volte à versão antiga do addon, ou tire esta entrada da criatura."
          : "Ligue esse addon na aba Addons, ou tire esta entrada da criatura.",
      });
    }
  }
  return out;
}

/* ============================================================ */
/* MARCAS DECLARADAS                                             */
/* ============================================================ */
/**
 * Todas as marcas escritas pelos addons no ar, para a UI oferecer no editor de
 * expressão em vez de a pessoa ter de lembrar de cor. É o mesmo espírito do
 * seletor `{ }` do vocabulário: o que existe se descobre, não se decora.
 */
export function marcasDeclaradas() {
  const out = new Map();
  for (const p of pacotesAtivos) {
    for (const lista of [...Object.values(p.acrescenta), ...Object.values(p.substitui)]) {
      for (const e of lista) {
        for (const t of Array.isArray(e.tags) ? e.tags : []) {
          const k = normalizarMarca(t);
          if (k) out.set(k, (out.get(k) ?? 0) + 1);
        }
      }
    }
  }
  return [...out.entries()].map(([marca, quantas]) => ({ marca, quantas }));
}
