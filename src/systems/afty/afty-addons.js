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
 * FAZ: **acrescentar** entradas a catálogos que já existem.
 * NÃO FAZ: remendar nem desligar entrada do raw (fase 3), trocar tabela
 * (fase 4), rodar código (fase 5). O autor PEDIU remendo e desligamento, e
 * aprovou adiá-los em 2026-08-20: eles estão adiados, não recusados.
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
];

const PRIMITIVA_IDS = new Set(PRIMITIVAS.map((p) => p.id));

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
    acrescenta: {},
  };
  for (const [familia, lista] of Object.entries(acrescenta)) {
    out.acrescenta[familia] = Array.isArray(lista)
      ? lista.filter((e) => e && typeof e === "object")
      : [];
  }
  return out;
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

  const familias = Object.keys(p.acrescenta);
  if (familias.length === 0) problemas.push("O pacote não acrescenta nada.");

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
    for (const [familia, lista] of Object.entries(p.acrescenta)) {
      const def = FAMILIAS.get(familia);
      if (!def || !lista.length) continue;
      const idsLocais = new Set(lista.map((e) => String(e[def.chave])));
      for (const e of lista) {
        porFamilia.get(familia).push({
          ...prefixarEntrada(clonar(e), p.id, def.chave, def.caminhosDeId, idsLocais),
          addonId: p.id,
          addonNome: p.nome,
        });
      }
    }
  }

  for (const [familia, extras] of porFamilia) {
    FAMILIAS.get(familia).aplicar(extras);
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
    for (const lista of Object.values(p.acrescenta)) {
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
