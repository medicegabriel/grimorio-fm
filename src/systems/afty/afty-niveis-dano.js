/**
 * ============================================================
 * NÍVEIS DE DANO — a escada de dados das armas
 * ============================================================
 * Mecânica da FICHA DE JOGADOR (autor, 2026-08-31). Na criatura o dano é uma
 * fórmula fechada (`linhaDeDano` em afty-pericias.js) e o dado da tabela da arma
 * não entra, então nada disto vale lá. Ver a divergência `danoPorArma` em
 * afty-sistema.js.
 *
 * Texto VERBATIM do livro:
 *
 *   "Os Níveis de Dano fazem parte de uma mecânica adicional das armas, a qual
 *    permite a melhoria delas, extraindo mais do potencial destrutivo que
 *    oferecem. Certas habilidades e propriedades podem aumentar o nível de dano
 *    de uma arma, seguindo a tabela presente nesta seção.
 *    Por exemplo, uma espada curta tem 1d6 de dano então, caso seu dano seja
 *    aumentado em um nível, ela passará a causar 1d8 de dano.
 *    Também existem certas habilidades, normalmente de inimigos, que podem
 *    diminuir o nível de dano de uma arma, com o intuito de reduzir o potencial
 *    de dano do atacante. Por exemplo, uma espada curta tem 1d6 de dano então,
 *    caso seu dano seja reduzido em um nível, ela passará a causar 1d4 de dano.
 *    Se os dados de uma arma não se encaixarem dentro dos níveis de dano some
 *    seu resultado máximo e tente achar o resultado mais próximo possível dentro
 *    dos níveis de dano e converta o dano da arma para este nível. Por exemplo,
 *    se uma arma causar, por base, 6d6 de dano e tiver seu dano aumentado em 1
 *    nível ela passaria a causar 3d12+1d4 de dano.
 *    Caso, de alguma maneira, um personagem consiga aumentar os níveis de dano
 *    além do apresentado na tabela (+3 níveis), o dano da arma continua sendo
 *    aumentado para cada nível excedente, mantendo a mesma lógica de aumento
 *    (1d4 > 1d6 > 1d8 > 1d10 > 1d12 > 1d12 + 1d4).
 *    Se isto acontecer com dados adicionais, como em 1d12 + 1d6, aumente o dado
 *    adicional — neste caso, se tornaria 1d12 + 1d8 — até o d12 e, ao passar
 *    dele, adiciona-se mais um dado, iniciando no d4. No caso da redução de
 *    níveis de dano, ao ultrapassar -2 níveis, continue o reduzindo normalmente
 *    até chegar em 1 de dano.
 *    Habilidades e efeitos que concedam um dado de dano adicional consideram o
 *    maior dado do nível. Então, ao receber +1 dado com uma arma que causa
 *    1d12 + 1d6, você receberia 1d12 de dano adicional."
 *
 * ------------------------------------------------------------
 * ⚠ A ESCADA É UMA SÓ, E A SÉTIMA LINHA DA TABELA ESTÁ ERRADA
 * ------------------------------------------------------------
 * A tabela impressa tem sete linhas, e as seis primeiras são a MESMA sequência
 * lida a partir de pontos diferentes. Isto foi conferido gerando as seis a
 * partir da escada abaixo: saem idênticas, célula por célula.
 *
 * A sétima (`1d10 | 2d6 | 2d8 | 2d10 | 2d12 | 2d12+1d4`) não segue: ela anda de
 * 4 em 4 de resultado máximo enquanto a escada anda de 2 em 2, e daria 2d10
 * (máx 20) onde a escada dá 1d12+1d6 (máx 18). **O autor confirmou em 2026-08-31
 * que essa linha está errada**, então ela não existe aqui. Uma Espada Colossal
 * (2d8) com +1 Nível vira `1d12 + 1d6`, e não `2d10`.
 *
 * As células com "ou" (`1d8 ou 2d4`, `1d12 ou 2d6`) são o mesmo nível escrito de
 * duas formas, e caem sozinhas pela regra do resultado máximo: 2d4 e 1d8 valem 8,
 * 2d6 e 1d12 valem 12.
 *
 * ------------------------------------------------------------
 * ⚠ O DADO IMPRESSO É PRESERVADO ENQUANTO NÃO HÁ DEGRAU
 * ------------------------------------------------------------
 * `moverNivel("2d8", 0)` devolve `2d8`, e não `1d12 + 1d4`. A conversão pelo
 * resultado máximo existe no livro para PODER andar na escada, e não para
 * reescrever a tabela de equipamentos: a aba de Equipamentos mostra o dado
 * impresso, e a linha de dano tem de mostrar o mesmo enquanto nada o moveu.
 */

/* ============================================================ */
/* A ESCADA                                                      */
/* ============================================================ */

/** Faces de um dado, na ordem em que a escada as percorre. */
const FACES = [4, 6, 8, 10, 12];

/** Quantos degraus a escada gera acima do 1d3. Sobra folga de sobra: o maior
    Nível de Dano que o conteúdo emite hoje é 5, e o teto aqui passa de 3d12. */
const DEGRAUS_ACIMA = 40;

/** Uma expressão de dano: dados mais um fixo. O `fixo` só existe no degrau 0. */
const expr = (dados, fixo = 0) => ({ dados, fixo });

/**
 * A escada canônica, do menor dano possível para cima. Cada degrau traz o texto,
 * os dados e o resultado máximo, que é a chave de conversão do livro.
 *
 * ⚠ Os três primeiros degraus são o pé da tabela (`1`, `1d2`, `1d3`) e não
 * seguem a regra de geração, porque d2 e d3 não estão em FACES: eles só existem
 * na descida. O livro fecha a descida em "1 de dano", que é o degrau 0.
 */
export const ESCADA_DANO = (() => {
  const fora = [
    { texto: "1", ...expr([], 1), max: 1 },
    { texto: "1d2", ...expr([{ qtd: 1, faces: 2 }]), max: 2 },
    { texto: "1d3", ...expr([{ qtd: 1, faces: 3 }]), max: 3 },
  ];
  let cheios = 0;
  for (let passo = 0; passo < DEGRAUS_ACIMA; passo++) {
    const i = passo % FACES.length;
    if (i === FACES.length - 1) {
      /* O dado adicional chegou ao d12: "ao passar dele, adiciona-se mais um
         dado". Um `1d12 + 1d12` é escrito como `2d12`, que é a mesma rolagem. */
      cheios += 1;
      fora.push({
        texto: `${cheios}d12`,
        ...expr([{ qtd: cheios, faces: 12 }]),
        max: cheios * 12,
      });
    } else {
      const f = FACES[i];
      fora.push({
        texto: cheios ? `${cheios}d12 + 1d${f}` : `1d${f}`,
        ...expr(cheios
          ? [{ qtd: cheios, faces: 12 }, { qtd: 1, faces: f }]
          : [{ qtd: 1, faces: f }]),
        max: cheios * 12 + f,
      });
    }
  }
  return fora;
})();

const POR_TEXTO = new Map(ESCADA_DANO.map((d, i) => [d.texto, i]));

/* ============================================================ */
/* LEITURA E CONVERSÃO                                           */
/* ============================================================ */

/**
 * Interpreta uma expressão de dano escrita como texto. Aceita o formato da
 * tabela de equipamentos (`2d6`), o da escada (`1d12 + 1d4`) e o fixo (`1`).
 * Devolve `null` no que não entender, para quem chama poder cair no padrão em
 * vez de propagar um NaN.
 */
export function lerDado(texto) {
  if (typeof texto !== "string") return null;
  const limpo = texto.trim().toLowerCase().replace(/\s+/g, "");
  if (!limpo) return null;
  const dados = [];
  let fixo = 0;
  for (const pedaco of limpo.split("+")) {
    const comDado = /^(\d*)d(\d+)$/.exec(pedaco);
    if (comDado) {
      const qtd = comDado[1] === "" ? 1 : Number(comDado[1]);
      const faces = Number(comDado[2]);
      if (!qtd || !faces) return null;
      dados.push({ qtd, faces });
      continue;
    }
    if (/^\d+$/.test(pedaco)) { fixo += Number(pedaco); continue; }
    return null;
  }
  return dados.length || fixo ? { dados, fixo } : null;
}

/** Resultado máximo de uma expressão, que é a chave de conversão do livro. */
export const maximoDe = (d) =>
  (d?.dados ?? []).reduce((s, x) => s + x.qtd * x.faces, 0) + (d?.fixo ?? 0);

/** Texto de uma expressão, no formato da escada. */
export const textoDe = (d) => {
  const partes = (d?.dados ?? []).map((x) => `${x.qtd}d${x.faces}`);
  if (d?.fixo) partes.push(String(d.fixo));
  return partes.join(" + ") || "0";
};

/**
 * Em que degrau da escada um dano está.
 *
 * Casa primeiro pelo TEXTO, que é o caminho de toda arma que já é um degrau. O
 * que não casa converte pelo resultado máximo, que é o que o livro manda: "some
 * seu resultado máximo e tente achar o resultado mais próximo possível dentro
 * dos níveis de dano".
 *
 * ⚠ EMPATE SOBE. Um máximo exatamente entre dois degraus (nenhum caso hoje, mas
 * a escada abre de 2 em 2 e uma arma custom pode cair no meio) fica no de baixo,
 * porque `<` na comparação preserva o primeiro encontrado. Ficou assim de
 * propósito: converter para BAIXO nunca cria dano que a arma não tinha.
 */
export function nivelDoDado(dado) {
  const d = typeof dado === "string" ? lerDado(dado) : dado;
  if (!d) return null;
  const exato = POR_TEXTO.get(textoDe(d));
  if (exato != null) return exato;
  const alvo = maximoDe(d);
  let melhor = 0;
  for (let i = 1; i < ESCADA_DANO.length; i++) {
    if (Math.abs(ESCADA_DANO[i].max - alvo) < Math.abs(ESCADA_DANO[melhor].max - alvo)) melhor = i;
  }
  return melhor;
}

/**
 * Move um dano N degraus na escada e devolve o degrau resultante.
 *
 * ⚠ COM `n` ZERO O DADO IMPRESSO É DEVOLVIDO COMO ESTÁ, sem passar pela escada.
 * É o que faz a Espada Colossal continuar sendo `2d8` na linha de dano enquanto
 * nada a moveu, batendo com o que a aba de Equipamentos mostra.
 *
 * O piso é o degrau 0 ("1 de dano", como o livro fecha a descida) e o teto é o
 * fim da escada gerada.
 */
export function moverNivel(dado, n = 0) {
  const d = typeof dado === "string" ? lerDado(dado) : dado;
  if (!d) return null;
  const passos = Math.trunc(Number(n) || 0);
  if (!passos) return { ...d, texto: textoDe(d), max: maximoDe(d) };
  const i = nivelDoDado(d);
  if (i == null) return { ...d, texto: textoDe(d), max: maximoDe(d) };
  const alvo = ESCADA_DANO[Math.max(0, Math.min(ESCADA_DANO.length - 1, i + passos))];
  return { dados: alvo.dados, fixo: alvo.fixo, texto: alvo.texto, max: alvo.max };
}

/**
 * O MAIOR dado de uma expressão, que é o que um dado de dano adicional vale.
 *
 * Verbatim: "Habilidades e efeitos que concedam um dado de dano adicional
 * consideram o maior dado do nível. Então, ao receber +1 dado com uma arma que
 * causa 1d12 + 1d6, você receberia 1d12 de dano adicional."
 */
export const maiorDadoDe = (d) =>
  (d?.dados ?? []).reduce((maior, x) => Math.max(maior, x.faces), 0);

/* ============================================================ */
/* O GOLPE DESARMADO                                             */
/* ============================================================ */

/**
 * O dado do Ataque Básico da ficha de jogador (autor, 2026-08-31): *"Golpe
 * Desarmado segue o cálculo de Lutador ou Arma Natural. Se não haver nenhum dos
 * dois, é 1d3 + Mod. Força ou Mod. Dex."*
 *
 * ⚠ AS ESCADAS DESTAS TRÊS SÃO DADO, E VÊM DO TEXTO DELAS. Não são degraus da
 * escada canônica, e não podiam ser: `2d8` para `2d12` no Corpo Treinado é um
 * salto de quatro degraus, e `1d12` para `2d10` nas Armas Naturais é de três. As
 * três progressões são irregulares porque foram escritas à mão no livro, então
 * ficam transcritas aqui em vez de calculadas.
 *
 * ⚠ ISTO É O QUE O `nivelDano` DELAS APROXIMAVA NA CRIATURA. Lá o dado da arma
 * não existe, então a única forma de a escada valer alguma coisa era virar
 * degrau de ND (ver `afty-escada-dado-nivel-dano`). No jogador o dado existe, e o
 * texto ganha. Por isso as linhas de escada delas são DESCONTADAS no jogador,
 * pela lista `ESCADAS_DESARMADO_NO_MOTOR` logo abaixo.
 */
export const DESARMADO_PADRAO = "1d3";

export const DESARMADO_FONTES = [
  {
    id: "lut_corpo_treinado",
    nome: "Corpo Treinado",
    /* "O dano dos seus ataques desarmados se torna 1d8. Nos níveis 5, 9, 13 e 17
       seu dano desarmado aumenta para 1d10, 1d12, 2d8 e 2d12, respectivamente."
       ⚠ O nível é o de LUTADOR, e não o do personagem: é uma Base de classe, e a
       multiclasse tem nível próprio por classe. */
    escala: "lutador",
    degraus: [
      { nivel: 1, dado: "1d8" },
      { nivel: 5, dado: "1d10" },
      { nivel: 9, dado: "1d12" },
      { nivel: 13, dado: "2d8" },
      { nivel: 17, dado: "2d12" },
    ],
  },
  {
    id: "mal_armas_naturais",
    nome: "Armas Naturais",
    /* "causa 1d8 de dano [...] No nível 5 o dano aumenta para 1d10; no nível 9
       aumenta para 1d12; no nível 13 aumenta para 2d10 e no nível 17, aumenta
       para 2d12." O nível aqui é o do personagem. */
    escala: "nivel",
    degraus: [
      { nivel: 1, dado: "1d8" },
      { nivel: 5, dado: "1d10" },
      { nivel: 9, dado: "1d12" },
      { nivel: 13, dado: "2d10" },
      { nivel: 17, dado: "2d12" },
    ],
  },
  {
    id: "mal_armas_naturais_aprimoradas",
    nome: "Armas Naturais Aprimoradas",
    /* "O dano de suas armas naturais se torna 1d10. No nível 5 o dano aumenta
       para 1d12; no nível 9 aumenta para 2d10; no nível 13 aumenta para 2d12 e
       no nível 17, aumenta para 3d10."
       ⚠ O "+1 nível de dano nos níveis 8, 12, 16 e 20" é OUTRA frase, e continua
       vindo pelo canal `nivelDano`: ela move a escada, e não a define. */
    escala: "nivel",
    degraus: [
      { nivel: 1, dado: "1d10" },
      { nivel: 5, dado: "1d12" },
      { nivel: 9, dado: "2d10" },
      { nivel: 13, dado: "2d12" },
      { nivel: 17, dado: "3d10" },
    ],
  },
];

/**
 * As linhas de `nivelDano` que existem só para a criatura, porque no jogador a
 * escada delas é o DADO BASE e contá-las de novo somaria o mesmo ganho duas
 * vezes.
 *
 * ⚠ Casa por `origem` MAIS `nome`, e não só por origem: as Armas Naturais
 * Aprimoradas emitem duas linhas, e só a da escada sai. A outra é o "+1 nível de
 * dano nos níveis 8, 12, 16 e 20", que é ganho de verdade e fica.
 *
 * ⚠ Há assert medindo que as três continuam existindo com estes nomes exatos. Se
 * alguém renomear uma linha no catálogo, o assert falha alto, em vez de o
 * desconto sumir calado e o desarmado do jogador engordar sozinho.
 */
export const ESCADAS_DESARMADO_NO_MOTOR = [
  { origem: "lut_corpo_treinado", nome: "Corpo Treinado (escada)" },
  { origem: "mal_armas_naturais", nome: "Armas Naturais (escada)" },
  { origem: "mal_armas_naturais_aprimoradas", nome: "Armas Naturais Aprimoradas (escada)" },
];

/**
 * O dado do golpe desarmado de um personagem, e de onde ele veio.
 *
 * ⚠ VALE O MAIOR, e não a soma: as três fontes descrevem o MESMO golpe
 * ("o dano dos seus ataques desarmados se torna X"), então empilhá-las somaria
 * três descrições da mesma coisa. As Aprimoradas dizem "o dano de suas armas
 * naturais SE TORNA 1d10", que é substituição escrita no texto.
 *
 * ctx = { nivel, nivelLutador, tem: (id) => boolean }
 */
export function dadoDesarmado(ctx = {}) {
  const nivel = Math.max(1, Math.trunc(Number(ctx.nivel) || 1));
  const nivelLutador = Math.max(0, Math.trunc(Number(ctx.nivelLutador) || 0));
  const tem = typeof ctx.tem === "function" ? ctx.tem : () => false;
  let melhor = { dado: DESARMADO_PADRAO, fonte: null, max: maximoDe(lerDado(DESARMADO_PADRAO)) };
  for (const f of DESARMADO_FONTES) {
    if (!tem(f.id)) continue;
    const escalaValor = f.escala === "lutador" ? nivelLutador : nivel;
    let dado = null;
    for (const d of f.degraus) if (escalaValor >= d.nivel) dado = d.dado;
    if (!dado) continue;
    const max = maximoDe(lerDado(dado));
    if (max > melhor.max) melhor = { dado, fonte: f.nome, max };
  }
  return melhor;
}

/* ============================================================ */
/* VALIDADOR                                                     */
/* ============================================================ */

/**
 * Sanidade da escada. Roda junto dos outros validadores de catálogo.
 */
export function validarNiveisDano() {
  const erros = [];
  for (let i = 1; i < ESCADA_DANO.length; i++) {
    if (ESCADA_DANO[i].max <= ESCADA_DANO[i - 1].max) {
      erros.push(`Escada de dano não cresce no degrau ${i} (${ESCADA_DANO[i].texto}).`);
    }
  }
  for (const d of ESCADA_DANO) {
    if (maximoDe(d) !== d.max) erros.push(`Degrau ${d.texto} com máximo que não bate com os dados.`);
    if (textoDe(d) !== d.texto) erros.push(`Degrau ${d.texto} com texto que não bate com os dados.`);
  }
  const ids = new Set();
  for (const f of DESARMADO_FONTES) {
    if (ids.has(f.id)) erros.push(`Fonte de desarmado duplicada: ${f.id}`);
    ids.add(f.id);
    if (f.escala !== "nivel" && f.escala !== "lutador") {
      erros.push(`Fonte de desarmado ${f.id} com escala desconhecida.`);
    }
    let anterior = -1;
    for (const d of f.degraus) {
      if (d.nivel <= anterior) erros.push(`Fonte ${f.id} com degraus fora de ordem.`);
      anterior = d.nivel;
      if (!lerDado(d.dado)) erros.push(`Fonte ${f.id} com dado ilegível: ${d.dado}`);
    }
  }
  return erros;
}
