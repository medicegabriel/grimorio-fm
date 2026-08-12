/**
 * ============================================================
 * LIBERAÇÕES MÁXIMAS — GRIMÓRIO AFTY
 * ============================================================
 * Suplemento "O Ápice da Liberação" (autor, 2026-08-09).
 *
 * A Liberação Máxima NÃO é um Feitiço novo nem um objeto guardado na ficha.
 * Ela é um MODO DE SAÍDA: na hora da conjuração o feiticeiro escolhe duas
 * melhorias (três a partir do ND 16) e paga um custo em PE que SUBSTITUI o
 * custo normal do Feitiço.
 *
 * ⚠ Por isso não há campo novo em `createBlankFeitico`. A escolha viaja em
 * `ctx.liberacao` e os calculadores de `afty-feiticos.js` a consultam. Guardar
 * as melhorias no Feitiço seria a versão de "Saída Rígida" do suplemento, que o
 * autor descartou: *"é a versão COM a habilidade. Você pode usar com as
 * melhorias escolhidas na hora."*
 *
 * ⚠ AS TRÊS REGRAS ABAIXO SÃO DE TODA LIBERAÇÃO MÁXIMA (autor, 2026-08-09).
 * Elas eram da habilidade "Liberações Expandidas", que foi REMOVIDA do catálogo
 * de Conjurador na mesma data. Não existe habilidade destravando nada aqui.
 * Texto VERBATIM:
 *
 *   Saída Adaptável: Você não possui mais melhorias fixas. Ao declarar uma
 *   Liberação Máxima no momento da conjuração, você pode escolher as duas
 *   melhorias que melhor atendem à sua necessidade estratégica imediata.
 *
 *   Sincronia de Nível 16 (2ª Aquisição): O limite de sua saída se expande
 *   drasticamente. Ao realizar uma Liberação Máxima, você pode escolher 3
 *   melhorias em vez de apenas duas.
 *
 *   Versatilidade: Agora você não tem mais um único feitiço de Liberação
 *   Máxima, mas sim qualquer feitiço pode ser uma. O usuário ainda segue o
 *   limite de poder utilizar apenas uma por Cena de Combate ou Descaso, a
 *   decisão do Mestre.
 *
 * ⚠ Este arquivo NÃO importa nada. `afty-feiticos.js` importa daqui, e um
 * import de volta fecharia ciclo. Toda leitura de Feitiço aqui é de campo cru.
 *
 * ⚠ Arredondamento: piso, salvo o texto dizer "para cima" (Estímulo de Saída,
 * Expansão de Limites e Alvos Adicionais dizem, e só esses três).
 *
 * Quem aplica é o calculador do tipo, no ponto certo do pipeline. Aqui moram
 * só os NÚMEROS e a decisão de quem pode pegar o quê, para uma mudança de
 * regra não ter que ser caçada em três arquivos.
 * ============================================================
 */

// ---------------------------------------------------------------
// ACESSO. "Um feiticeiro recebe uma Liberação Máxima no Nível 9."
//
// ⚠ O 9 é CONSTANTE, e não derivado de quando o Nível 3 destrava. Parecem a
// mesma coisa (`nivelMaxFeitico(9)` é 3), mas o autor avisou que uma habilidade
// base de Conjurador dá acesso a Feitiços de Nível 3 já no nível 7. Derivar o
// acesso do nível de Feitiço daria Liberação Máxima dois níveis cedo para o
// Conjurador.
// ---------------------------------------------------------------
export const LIBERACAO_ND_MINIMO = 9;

// A terceira melhoria, pela Sincronia de Nível 16. ⚠ Só o ND manda: a
// habilidade que antes destravava isso não existe mais (autor, 2026-08-09).
export const LIBERACAO_ND_TRES = 16;

// ---------------------------------------------------------------
// CUSTO. É o CUSTO EM PE DO PRÓXIMO NÍVEL DE FEITIÇO, e ele SUBSTITUI o custo
// do Feitiço (autor).
//
// ⚠ O "+2 de Custo de Estabilização" do suplemento foi REMOVIDO pelo autor em
// 2026-08-09. A tabela era 14 / 22 / 24 e passou a ser 12 / 20 / 25.
//
// Com o +2 fora, a regra virou fórmula limpa e a tabela deixou de ter número
// solto. Conferindo contra `FEITICO_CUSTO_PE` (= { 3: 8, 4: 12, 5: 20 }):
//
//   Nível 3 → 12, que é o custo do Nível 4
//   Nível 4 → 20, que é o custo do Nível 5
//   Nível 5 → 25, que é o custo da TÉCNICA MÁXIMA
//
// O 25 do Nível 5 é o que fecha o raciocínio: o "próximo nível" depois do 5 é a
// Técnica Máxima, e ela custa 25 PE pelo texto da aptidão homônima em
// `afty-aptidoes.js` (*"Uma Técnica Máxima custa 25 PE"*). Antes disso o 24 não
// saía de lugar nenhum.
//
// ⚠ Mesmo assim a TABELA continua sendo a fonte, e não a conta: derivar de
// `FEITICO_CUSTO_PE[n + 1]` amarraria este arquivo à tabela de custo dos
// Feitiços e quebraria calado no dia em que uma das duas mudasse sozinha.
//
// Níveis 1 e 2 não têm Liberação Máxima ("Removemos Nv 1-2").
// ---------------------------------------------------------------
export const LIBERACAO_CUSTO_PE = { 3: 12, 4: 20, 5: 25 };

// ---------------------------------------------------------------
// CATEGORIAS. Feitiço de dano escolhe na Doutrina, Auxiliar e Curativo no
// Manto, e as Leis Universais servem a todos. Misturar é permitido, e pegar as
// duas nas Leis Universais também (autor).
// ---------------------------------------------------------------
export const LIBERACAO_CATEGORIAS = [
  { value: "destruicao", label: "Doutrina da Destruição" },
  { value: "protecao",   label: "Manto da Proteção" },
  { value: "universais", label: "Leis Universais" },
];

// Tipos de Feitiço que podem virar Liberação Máxima, e em que categoria eles
// compram. ⚠ Especiais e Passivos ficaram de fora por decisão do autor
// ("deixamos para depois. Com calma"), e não por falta de lugar. Ver
// docs/a-fazer.md.
const CATEGORIA_POR_TIPO = {
  dano:     ["destruicao", "universais"],
  auxiliar: ["protecao", "universais"],
  curativo: ["protecao", "universais"],
};

// ---------------------------------------------------------------
// AS 12 MELHORIAS. `descricao` é VERBATIM do suplemento.
// ---------------------------------------------------------------
export const LIBERACAO_MELHORIAS = [
  // ---- Doutrina da Destruição (ofensivo) ----
  {
    id: "sobrecarga_energetica",
    nome: "Sobrecarga Energética",
    categoria: "destruicao",
    descricao: "O feitiço recebe um aumento nos dados de dano base igual ao Nível do Feitiço + 1.",
  },
  {
    id: "ruptura_absoluta",
    nome: "Ruptura Absoluta",
    categoria: "destruicao",
    descricao: "O ataque ignora uma quantidade de Redução de Dano (RD) do alvo igual a 3x o Nível do Feitiço.",
  },
  {
    id: "pressao_amaldicoada",
    nome: "Pressão Amaldiçoada",
    categoria: "destruicao",
    descricao: "O bônus de acerto aumenta em 2x o Nível do Feitiço e a CD para resistir à técnica aumenta em Nível do Feitiço + 1.",
  },
  {
    id: "resiliencia_energetica",
    nome: "Resiliência Energética",
    categoria: "destruicao",
    descricao: "Caso o alvo possua Vantagem em testes de resistência contra este feitiço, ele a perde imediatamente, virando Desvantagem. Caso seja usado em um feitiço de acerto, o portador perde qualquer Desvantagem que tenha e recebe Vantagem (Não dá pra se ter ambos os efeitos de CD e Acerto).",
  },

  // ---- Manto da Proteção (auxiliar e curativo) ----
  {
    id: "vigor_absoluto",
    nome: "Vigor Absoluto",
    categoria: "protecao",
    descricao: "Se o feitiço recupera PV ou fornece PV Temporários, aumente o valor total curado/concedido em 6 por Nível do Feitiço.",
  },
  {
    id: "estimulo_de_saida",
    nome: "Estímulo de Saída",
    categoria: "protecao",
    descricao: "Para feitiços que concedem bônus ou penalidades numéricas (Defesa, Acerto, Perícia, CD, Testes de Resistência), o valor do bônus/penalidade aumenta em metade do nível do feitiço (arredondado para cima), no caso de feitiços Duradouros ou Sustentados, para Imediatos o valor é igual ao do Nível do feitiço.",
  },
  {
    id: "explosao_extrema",
    nome: "Explosão Extrema",
    categoria: "protecao",
    descricao: "Para feitiços que concedem Dados de Dano o valor é aumentado em metade do nível (arredondado para baixo) em dados, para Sustentados e Duradouros, já para imediatas é o dobro do valor citado anteriormente. No caso de feitiços de Dano Fixo e Níveis de Dano, o valor aumenta em uma quantidade igual ao nível dividido por 2 (arredondado para baixo) e por fim multiplicado por 4, imediatas usam o dobro desse valor.",
  },
  {
    id: "eficiencia_de_sustentacao",
    nome: "Eficiência de Sustentação",
    categoria: "protecao",
    descricao: "Caso o feitiço possua a característica Sustentado, ele não consome PE para ser mantido por um número de rodadas igual a metade do nível do feitiço (arredondado para baixo).",
  },

  // ---- Leis Universais (gerais) ----
  {
    id: "expansao_de_limites",
    nome: "Expansão de Limites",
    categoria: "universais",
    descricao: "Alcance é Multiplicado por metade do nível do feitiço (arredondado para cima).",
  },
  {
    id: "area",
    nome: "Área",
    categoria: "universais",
    descricao: "O raio ou as dimensões da área de efeito (cubo, cone, linha) são dobrados. Linhas ganham o dobro de sua Largura também.",
  },
  {
    id: "alvos_adicionais",
    nome: "Alvos Adicionais",
    categoria: "universais",
    descricao: "O feitiço pode atingir um número de alvos extras igual a metade do nível do feitiço (arredondado para cima).",
    nota: "Não pode ser usado em feitiços de múltiplos alvos por padrão.",
  },
  {
    id: "duracao_prolongada",
    nome: "Duração Prolongada",
    categoria: "universais",
    descricao: "Se o feitiço tiver uma duração definida que não seja sustentada, sua duração total é aumentada em uma quantidade de rodadas igual a metade do nível do feitiço (arredondado para baixo).",
    nota: "Isso vale para feitiços duradouros e condições.",
  },
];

export const MELHORIA_POR_ID = Object.fromEntries(LIBERACAO_MELHORIAS.map((m) => [m.id, m]));

// ---------------------------------------------------------------
// EFEITOS AUXILIARES que o Estímulo de Saída alcança.
//
// ⚠ O Set cobre só os cinco NOMES escritos no texto da melhoria (Defesa,
// Acerto, Perícia, CD, Testes de Resistência), mapeados para os ids do Afty.
// "Perícia" virou as duas pontas de rolagem, porque a melhoria diz "bônus ou
// PENALIDADES numéricas". Autor: *"Faça somente os que estão escritos e anote.
// Vou verificar um a um depois."* Os 7 de fora estão em docs/a-fazer.md.
//
// Os quatro do grupo de dano (danoDurante, danoApos, danoFixo, niveisDano)
// nunca entram aqui: quem cuida deles é a Explosão Extrema.
// ---------------------------------------------------------------
export const ESTIMULO_EFEITOS = new Set([
  "defesa",           // "Defesa"
  "ataque",           // "Acerto"
  "rolagem",          // "Perícia" (bônus)
  "prejuizoRolagem",  // "Perícia" (penalidade)
  "cd",               // "CD"
  "tr",               // "Testes de Resistência"
]);

// Efeitos que a Explosão Extrema paga em DADOS, e os que ela paga em VALOR.
export const EXPLOSAO_EFEITOS_DADOS = new Set(["danoDurante", "danoApos"]);
export const EXPLOSAO_EFEITOS_VALOR = new Set(["danoFixo", "niveisDano"]);

// ---------------------------------------------------------------
// Consultas de acesso.
// ---------------------------------------------------------------
const piso = (x) => Math.floor(x);
const teto = (x) => Math.ceil(x);

/** O nível do Feitiço tem linha na tabela de custo? (Nível 3, 4 ou 5). */
export function nivelTemLiberacao(nivel) {
  return Object.prototype.hasOwnProperty.call(LIBERACAO_CUSTO_PE, nivel);
}

/** Custo em PE da Liberação, que SUBSTITUI o custo do Feitiço. */
export function custoLiberacao(nivel) {
  return LIBERACAO_CUSTO_PE[nivel] ?? null;
}

/** Categorias em que este Feitiço pode comprar melhoria. Vazio = não pode. */
export function categoriasDoFeitico(f) {
  return CATEGORIA_POR_TIPO[f?.tipo] ?? [];
}

/**
 * Quantas melhorias cabem: duas, e três a partir do ND 16.
 *
 * ⚠ Só o ND. A Sincronia de Nível 16 era texto da habilidade Liberações
 * Expandidas, e o autor mandou remover a habilidade e aplicar a regra a toda
 * Liberação Máxima (2026-08-09).
 */
export function maxMelhorias(nd) {
  return nd >= LIBERACAO_ND_TRES ? 3 : 2;
}

/**
 * Duração do Feitiço, do ponto de vista das melhorias do Manto. Só o Auxiliar
 * tem duração escolhida. ⚠ Curativo e Dano não têm, e caem em `null`: as
 * melhorias que dependem de duração (Estímulo, Explosão, Eficiência) só valem
 * para o Auxiliar mesmo.
 */
export function duracaoDoFeitico(f) {
  if (f?.tipo !== "auxiliar") return null;
  return (f.multiplosAtivo ? f.duracaoMult : f.duracaoAux) || "imediata";
}

// Subtipos de Dano que são área POR REGRA, com o campo `alvo` da ficha dizendo
// o que quiser. O calculador force isso em `areaObrigatoria`.
const SUBTIPO_SEMPRE_AREA = new Set(["destrutivo", "cataclismico"]);

/**
 * O Feitiço tem área?
 *
 * ⚠ Não basta ler `f.alvo` (2026-08-09). O Destrutivo e o Cataclísmico são
 * SEMPRE em área, e o calculador os converte mesmo com a ficha marcada como
 * alvo único. Lendo o campo cru, a melhoria Área avisava "o Feitiço não tem
 * área" enquanto a área realmente dobrava de 18m para 36m, e o Alvos Adicionais
 * era oferecido num Feitiço que já pega todo mundo dentro da área.
 */
export function temArea(f) {
  if (!f) return false;
  if (f.tipo === "dano") return f.alvo === "area" || SUBTIPO_SEMPRE_AREA.has(f.subtipo);
  if (f.tipo === "curativo") return f.alvo === "area";
  return false;
}

/**
 * O Feitiço já atinge vários alvos por padrão? É o que barra Alvos Adicionais.
 * Área e Múltiplos Disparos são do desenho do Feitiço, e o Auxiliar de mais de
 * um alvo já pagou por isso dividindo o bônus.
 */
export function ehMultiAlvo(f) {
  if (!f) return false;
  if (f.tipo === "dano") return temArea(f) || f.subtipo === "multiplos";
  if (f.tipo === "curativo") return temArea(f);
  if (f.tipo === "auxiliar") {
    const alvos = f.multiplosAtivo ? f.alvosMult : f.alvosAux;
    return (alvos | 0) > 1;
  }
  return false;
}

/**
 * A lista de melhorias que ESTE Feitiço pode pegar, cada uma com `disponivel` e
 * o motivo quando não.
 *
 * ⚠ Só barra o que o texto barra: a categoria errada e a nota dos Alvos
 * Adicionais. Uma melhoria que simplesmente não encontra o que mexer (Área num
 * Feitiço de alvo único) continua escolhível e rende zero, e quem acusa é o
 * aviso de `resolveLiberacao`. Barrar por conta própria seria inventar regra.
 */
export function melhoriasDoFeitico(f) {
  const categorias = categoriasDoFeitico(f);
  const multiAlvo = ehMultiAlvo(f);
  return LIBERACAO_MELHORIAS.map((m) => {
    if (!categorias.includes(m.categoria)) {
      return { ...m, disponivel: false, motivo: "Categoria fora do tipo do Feitiço." };
    }
    if (m.id === "alvos_adicionais" && multiAlvo) {
      return { ...m, disponivel: false, motivo: "O Feitiço já atinge múltiplos alvos." };
    }
    return { ...m, disponivel: true, motivo: null };
  });
}

/**
 * Normaliza a escolha do jogador contra o Feitiço e o ND. Devolve `null` quando
 * a Liberação não se aplica de jeito nenhum (nada escolhido, ou Feitiço de
 * nível ou tipo fora), e aí os calculadores seguem como se ela não existisse.
 *
 * ⚠ ND baixo NÃO devolve `null`: ele avisa e segue calculando, que é a
 * convenção do resto do sistema (nível de Feitiço inacessível também avisa e
 * mostra o número). Quem esconde o controle da tela é o `infoLiberacao`.
 *
 * ctx: { nd, liberacao: { melhorias: [id] } }
 */
export function resolveLiberacao(f, ctx = {}) {
  const pedido = ctx.liberacao;
  if (!pedido || !f) return null;

  const escolhidas = Array.isArray(pedido.melhorias) ? pedido.melhorias : [];
  if (escolhidas.length === 0) return null;

  const nivel = f.nivel;
  const avisos = [];

  if (!nivelTemLiberacao(nivel)) return null;
  if (categoriasDoFeitico(f).length === 0) return null;

  const nd = ctx.nd;
  if (nd != null && nd < LIBERACAO_ND_MINIMO) {
    avisos.push(`Liberação Máxima só a partir do ND ${LIBERACAO_ND_MINIMO}.`);
  }

  // Sem repetição: "efeitos não podem ser repetidos".
  const vistos = new Set();
  const disponiveis = melhoriasDoFeitico(f);
  const validas = [];
  for (const id of escolhidas) {
    const m = disponiveis.find((x) => x.id === id);
    if (!m) { avisos.push(`Melhoria desconhecida: ${id}.`); continue; }
    if (vistos.has(id)) { avisos.push(`${m.nome} escolhida duas vezes.`); continue; }
    vistos.add(id);
    if (!m.disponivel) { avisos.push(`${m.nome}: ${m.motivo}`); continue; }
    validas.push(id);
  }

  const max = maxMelhorias(nd ?? 0);
  if (validas.length > max) {
    avisos.push(`No máximo ${max} melhorias por Liberação Máxima.`);
    validas.length = max;
  }

  const lib = {
    ativa: true,
    melhorias: validas,
    nivel,
    custoPE: custoLiberacao(nivel),
    max,
    avisos,
  };

  // Melhoria escolhida que não encontra o que mexer. Não é erro de regra, é
  // PE gasto à toa, e o autor pediu resultado e aviso.
  for (const id of validas) {
    const motivo = melhoriaSemEfeito(id, f);
    if (motivo) avisos.push(`${MELHORIA_POR_ID[id].nome}: ${motivo}`);
  }

  return lib;
}

/** Os ids de efeito auxiliar que este Feitiço carrega (vazio fora do Auxiliar). */
export function efeitosAuxDoFeitico(f) {
  if (f?.tipo !== "auxiliar") return [];
  if (f.multiplosAtivo) {
    return (Array.isArray(f.efeitosMult) ? f.efeitosMult : []).map((e) => e.efeito).filter(Boolean);
  }
  return [f.efeitoAux || "defesa"];
}

/**
 * Por que uma melhoria escolhida não vai render nada neste Feitiço.
 *
 * ⚠ Isto NÃO barra a escolha, só avisa. A regra não proíbe pegar Área num
 * Feitiço sem área, ela só não tem o que dobrar, e o resultado é PE gasto à
 * toa. Barrar seria inventar regra, e ficar calado esconderia o desperdício.
 *
 * Nos níveis 3, 4 e 5 nenhum dos multiplicadores zera (⌈n/2⌉ é 2, 2, 3 e
 * ⌊n/2⌋ é 1, 2, 2), então não há caso de "a conta deu zero": o que sobra é
 * sempre o Feitiço não ter aquilo em que mexer.
 */
function melhoriaSemEfeito(id, f) {
  const dur = duracaoDoFeitico(f);
  const efeitosAux = efeitosAuxDoFeitico(f);
  switch (id) {
    case "area":
      // ⚠ O Cataclísmico é área e mesmo assim não rende: a área dele é o MAPA
      // INTEIRO, sem metragem, e dobrar o mapa não significa nada.
      if (f.tipo === "dano" && f.subtipo === "cataclismico") {
        return "a área do Cataclísmico é o mapa inteiro.";
      }
      return temArea(f) ? null : "o Feitiço não tem área.";
    case "expansao_de_limites":
      // O Auxiliar nunca calculou alcance: ele só distingue "própria" de não
      // própria. Não há metro nenhum para multiplicar.
      return f.tipo === "auxiliar" ? "o Auxiliar não tem alcance calculado." : null;
    case "duracao_prolongada":
      if (f.tipo === "auxiliar") {
        return dur === "duradoura" ? null : "só Duradouro tem rodadas a prolongar.";
      }
      // ⚠ No Curativo a lista de condições é o que ele REMOVE, e não o que ele
      // aplica (autor, 2026-08-09). Condição removida não tem duração, então
      // não há o que prolongar, por mais condições que estejam anexadas.
      if (f.tipo === "curativo") return "no Curativo a condição é removida, não aplicada.";
      // O Dano não tem duração própria: o que se prolonga são as Condições que
      // ele APLICA. Sem condição, não há o que prolongar.
      return (Array.isArray(f.condicoes) && f.condicoes.length) || f.sangramento
        ? null
        : "o Feitiço não tem condição nem duração a prolongar.";
    case "eficiencia_de_sustentacao":
      return dur === "sustentada" ? null : "o Feitiço não é Sustentado.";
    case "vigor_absoluto":
      // Só o Curativo recupera PV. Nenhum efeito auxiliar do Afty concede PV
      // Temporário hoje, então a outra metade do texto não tem alvo.
      return f.tipo === "curativo" ? null : "só Feitiço Curativo recupera PV.";
    case "estimulo_de_saida":
      return efeitosAux.some((e) => ESTIMULO_EFEITOS.has(e))
        ? null
        : "nenhum efeito do Feitiço concede bônus ou penalidade numérica.";
    case "explosao_extrema":
      return efeitosAux.some((e) => EXPLOSAO_EFEITOS_DADOS.has(e) || EXPLOSAO_EFEITOS_VALOR.has(e))
        ? null
        : "nenhum efeito do Feitiço concede dano.";
    case "alvos_adicionais":
      // O bloqueio de múltiplos alvos já saiu como indisponível em
      // `melhoriasDoFeitico`, então chegar aqui significa que rende.
      return null;
    case "pressao_amaldicoada":
      // O acerto só existe em Feitiço de ataque, e a CD só em Feitiço de TR ou
      // com condição anexada. Um dos dois sempre pega, então nunca zera.
      return null;
    default:
      return null;
  }
}

/** A melhoria está ligada nesta Liberação? */
export function temMelhoria(lib, id) {
  return !!lib && Array.isArray(lib.melhorias) && lib.melhorias.includes(id);
}

// ---------------------------------------------------------------
// OS NÚMEROS. Cada função devolve 0 (ou o neutro) quando a melhoria não está
// ligada, então o calculador soma sem `if`.
//
// `n` é sempre o nível NUMÉRICO do Feitiço. A Técnica Máxima não chega aqui:
// `nivelTemLiberacao` já a rejeitou.
// ---------------------------------------------------------------

/** Sobrecarga Energética: "+ Nível do Feitiço + 1" em dados de dano base. */
export function sobrecargaDados(lib, n) {
  return temMelhoria(lib, "sobrecarga_energetica") ? n + 1 : 0;
}

/** Ruptura Absoluta: ignora "3x o Nível do Feitiço" de RD. */
export function rupturaRd(lib, n) {
  return temMelhoria(lib, "ruptura_absoluta") ? 3 * n : 0;
}

/** Pressão Amaldiçoada: acerto "+2x o Nível do Feitiço". */
export function pressaoAcerto(lib, n) {
  return temMelhoria(lib, "pressao_amaldicoada") ? 2 * n : 0;
}

/** Pressão Amaldiçoada: CD "+ Nível do Feitiço + 1". */
export function pressaoCd(lib, n) {
  return temMelhoria(lib, "pressao_amaldicoada") ? n + 1 : 0;
}

/** Vigor Absoluto: "+6 por Nível do Feitiço" no total curado. */
export function vigorCura(lib, n) {
  return temMelhoria(lib, "vigor_absoluto") ? 6 * n : 0;
}

/**
 * Estímulo de Saída: metade do nível para CIMA em Duradouro e Sustentado, o
 * nível inteiro em Imediato. Só nos efeitos de `ESTIMULO_EFEITOS`.
 *
 * ⚠ Devolve MAGNITUDE, sempre positiva. Quem aplica cuida do sinal, porque
 * `prejuizoRolagem` é guardado negativo e "aumentar a penalidade" é afastar de
 * zero, não somar.
 */
export function estimuloBonus(lib, n, efeito, duracao) {
  if (!temMelhoria(lib, "estimulo_de_saida")) return 0;
  if (!ESTIMULO_EFEITOS.has(efeito)) return 0;
  return duracao === "imediata" ? n : teto(n / 2);
}

/**
 * Explosão Extrema, ponta dos DADOS: metade do nível para baixo, dobrada em
 * Imediato.
 */
export function explosaoDados(lib, n, efeito, duracao) {
  if (!temMelhoria(lib, "explosao_extrema")) return 0;
  if (!EXPLOSAO_EFEITOS_DADOS.has(efeito)) return 0;
  const base = piso(n / 2);
  return duracao === "imediata" ? base * 2 : base;
}

/**
 * Explosão Extrema, ponta do VALOR (Dano Fixo e Níveis de Dano): metade do
 * nível para baixo, vezes 4, dobrada em Imediato.
 *
 * ⚠ Sim, dá +4 níveis de dano num Feitiço de Nível 3 e +16 num Nível 5
 * imediato. Confirmado pelo autor em 2026-08-09, perguntado justamente por ser
 * uma ordem de grandeza acima das outras melhorias.
 */
export function explosaoValor(lib, n, efeito, duracao) {
  if (!temMelhoria(lib, "explosao_extrema")) return 0;
  if (!EXPLOSAO_EFEITOS_VALOR.has(efeito)) return 0;
  const base = piso(n / 2) * 4;
  return duracao === "imediata" ? base * 2 : base;
}

/** Eficiência de Sustentação: rodadas sem pagar upkeep. */
export function rodadasSemUpkeep(lib, n) {
  return temMelhoria(lib, "eficiencia_de_sustentacao") ? piso(n / 2) : 0;
}

/**
 * Expansão de Limites: alcance "Multiplicado por metade do nível do feitiço
 * (arredondado para cima)". Devolve 1 quando não está ligada.
 *
 * ⚠ Alcance de Toque é 0 metros, e 0 × qualquer coisa é 0. Confirmado pelo
 * autor: Toque continua Toque.
 */
export function multAlcance(lib, n) {
  return temMelhoria(lib, "expansao_de_limites") ? teto(n / 2) : 1;
}

/**
 * Área: "as dimensões da área de efeito são dobrados".
 *
 * ⚠ Só o COMPRIMENTO dobra. A segunda metade da regra ("Linhas ganham o dobro
 * de sua Largura também") não tem onde cair, porque o Afty guarda a área como
 * um número só e nunca modelou largura de linha. Está em docs/a-fazer.md, e o
 * autor confirmou que vai precisar dela.
 */
export function multArea(lib) {
  return temMelhoria(lib, "area") ? 2 : 1;
}

/** Alvos Adicionais: "metade do nível do feitiço (arredondado para cima)". */
export function alvosExtras(lib, n) {
  return temMelhoria(lib, "alvos_adicionais") ? teto(n / 2) : 0;
}

/**
 * Duração Prolongada: "+ metade do nível (arredondado para baixo)" em rodadas.
 * Vale para Duradouros e para as Condições anexadas.
 *
 * ⚠ As rodadas extras FURAM o teto da Duradoura (1 + nível) e NÃO entram no
 * divisor do valor. Confirmado pelo autor: se entrassem, a melhoria diluiria o
 * bônus e a Duração Prolongada pioraria o Feitiço.
 */
export function rodadasExtras(lib, n) {
  return temMelhoria(lib, "duracao_prolongada") ? piso(n / 2) : 0;
}

// ---------------------------------------------------------------
// REGRAS SEM NÚMERO. Resiliência Energética não vira valor nenhum: ela troca
// vantagem por desvantagem na mesa. Vira linha de ficha, e a tela decide como
// mostrar.
// ---------------------------------------------------------------
export function regrasDaLiberacao(lib, f) {
  if (!lib) return [];
  const regras = [];
  if (temMelhoria(lib, "resiliencia_energetica")) {
    regras.push(f?.resolucao === "ataque"
      ? "Perde qualquer Desvantagem e recebe Vantagem na jogada de ataque."
      : "O alvo perde Vantagem no teste de resistência e passa a ter Desvantagem.");
  }
  return regras;
}

// ---------------------------------------------------------------
// VALIDADOR de conteúdo (roadmap), no padrão dos outros catálogos.
// ---------------------------------------------------------------
export function validarCatalogoLiberacoes() {
  const erros = [];
  const ids = new Set();
  const categorias = new Set(LIBERACAO_CATEGORIAS.map((c) => c.value));
  for (const m of LIBERACAO_MELHORIAS) {
    if (ids.has(m.id)) erros.push(`Melhoria duplicada: ${m.id}`);
    ids.add(m.id);
    if (!m.nome) erros.push(`${m.id} sem nome`);
    if (!m.descricao) erros.push(`${m.id} sem descrição`);
    if (!categorias.has(m.categoria)) erros.push(`${m.id} com categoria inválida: ${m.categoria}`);
  }
  // Todo tipo que pode ter Liberação precisa de pelo menos uma melhoria própria
  // além das Leis Universais, ou o jogador escolheria só das gerais.
  for (const [tipo, cats] of Object.entries(CATEGORIA_POR_TIPO)) {
    const proprias = cats.filter((c) => c !== "universais");
    if (proprias.length === 0) erros.push(`Tipo ${tipo} sem categoria própria`);
    for (const c of proprias) {
      if (!LIBERACAO_MELHORIAS.some((m) => m.categoria === c)) {
        erros.push(`Categoria ${c} (tipo ${tipo}) sem nenhuma melhoria`);
      }
    }
  }
  // Custo: só os níveis 3, 4 e 5, e todos positivos.
  for (const [nivel, custo] of Object.entries(LIBERACAO_CUSTO_PE)) {
    if (!["3", "4", "5"].includes(nivel)) erros.push(`Custo de nível inesperado: ${nivel}`);
    if (!(custo > 0)) erros.push(`Custo inválido no nível ${nivel}: ${custo}`);
  }
  return erros;
}
