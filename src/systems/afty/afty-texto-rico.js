/**
 * ============================================================
 * TEXTO RICO — marcação leve dos campos de texto livre do Afty
 * ============================================================
 * Negrito, itálico, sublinhado e riscado no Funcionamento Básico (autor,
 * 2026-08-07). O texto da técnica é o único lugar do sistema em que o jogador
 * escreve páginas inteiras, e sem formatação um texto longo vira um bloco cinza
 * sem hierarquia nenhuma.
 *
 * ⚠ POR QUE MARCAÇÃO, E NÃO UM EDITOR RICO. Um `contentEditable` guardaria HTML
 * na ficha, e a ficha viaja: ela vai para o localStorage, para o JSON de
 * exportação e para a Ficha Final, que ainda aceita CSS do usuário. HTML gravado
 * seria uma porta de injeção em três lugares de uma vez. Marcação é texto puro,
 * o campo continua sendo `string`, as fichas antigas seguem válidas e nada nunca
 * precisa de `dangerouslySetInnerHTML`: o renderizador devolve NÓS, não HTML.
 *
 * A sintaxe é o subconjunto do Markdown que todo mundo já conhece:
 *
 *     **negrito**      __sublinhado__      # Título
 *     *itálico*        ~~riscado~~         ## Subtítulo
 *
 *     | Grau     | Corvos | Alcance |
 *     | ---      | :----: | ------: |
 *     | Quarto   | 1      | 9m      |
 *
 * E `\*` escapa o marcador quando o texto precisa do caractere literal. Dentro
 * de uma tabela, `\|` guarda a barra literal na célula.
 *
 * ⚠ O ESCOPO DE UM MARCADOR É A LINHA. Um `*` solto no meio de um parágrafo não
 * pode italizar o resto do documento até achar outro asterisco cinco linhas
 * abaixo. Sem par na mesma linha, o marcador é texto literal.
 *
 * ⚠ TÍTULO É DE LINHA INTEIRA, e só vale no COMEÇO dela (autor, 2026-08-07:
 * *"queria poder destacar os Títulos deixando eles em Negrito para me achar"*).
 * Negrito sozinho não cria hierarquia num Funcionamento Básico de várias
 * páginas: ele destaca a frase, mas não separa a seção. O `#` no meio da linha
 * é texto, senão uma anotação de custo ("gasta 3 # de energia") viraria título.
 *
 * ⚠ TABELA EXIGE A LINHA SEPARADORA (`| --- | --- |`) logo abaixo do cabeçalho.
 * É o que separa uma tabela de verdade de uma frase que por acaso tem barras
 * ("Reação | Ação Bônus"). Sem a separadora, as linhas seguem sendo texto.
 * ============================================================
 */

/**
 * Os marcadores, do mais longo para o mais curto. A ORDEM IMPORTA: `**` tem de
 * ser testado antes de `*`, senão o negrito viraria dois itálicos vazios.
 */
export const MARCADORES = [
  { chave: "negrito",     marca: "**", label: "Negrito",     atalho: "B" },
  { chave: "sublinhado",  marca: "__", label: "Sublinhado",  atalho: "U" },
  { chave: "riscado",     marca: "~~", label: "Riscado",     atalho: "S" },
  { chave: "italico",     marca: "*",  label: "Itálico",     atalho: "I" },
];

/** Só as chaves de estilo, para o renderizador saber o que existe. */
export const ESTILOS = MARCADORES.map((m) => m.chave);

/**
 * Os títulos, do mais fundo para o mais raso. A ORDEM IMPORTA pelo mesmo motivo
 * dos marcadores: `## ` tem de ser testado antes de `# `.
 */
export const TITULOS = [
  { nivel: 2, prefixo: "## ", label: "Subtítulo", atalho: "H2" },
  { nivel: 1, prefixo: "# ",  label: "Título",    atalho: "H1" },
];

/** O nível de título de uma linha, e a linha sem o prefixo. */
export function separaTitulo(linha) {
  const t = TITULOS.find((x) => linha.startsWith(x.prefixo));
  return t ? { nivel: t.nivel, resto: linha.slice(t.prefixo.length) } : { nivel: 0, resto: linha };
}

/**
 * A linha tem um marcador de FECHAMENTO para o que abriu em `pos`?
 *
 * É o que separa "abriu um itálico" de "digitou um asterisco". Sem esta busca,
 * uma multiplicação escrita como `3 * 4` comeria o resto da linha em itálico.
 */
function temFechamento(linha, pos, marca) {
  for (let i = pos + marca.length; i < linha.length; i++) {
    if (linha[i] === "\\") { i++; continue; }
    if (linha.startsWith(marca, i)) return true;
  }
  return false;
}

/**
 * Uma linha vira uma lista de TRECHOS `{ texto, negrito, italico, ... }`.
 *
 * Varredura com pilha de estilos ativos: ao encontrar um marcador, fecha o
 * estilo se ele já estava aberto, ou abre se houver par adiante. Trecho vazio
 * não entra na lista, então `**a**` rende um trecho só.
 */
export function parseLinha(linha) {
  const trechos = [];
  const ativos = new Set();
  let buffer = "";

  const fechar = () => {
    if (!buffer) return;
    const t = { texto: buffer };
    for (const e of ativos) t[e] = true;
    trechos.push(t);
    buffer = "";
  };

  let i = 0;
  while (i < linha.length) {
    // Escape: `\*` guarda o asterisco literal e some da saída.
    if (linha[i] === "\\" && i + 1 < linha.length) {
      buffer += linha[i + 1];
      i += 2;
      continue;
    }
    const m = MARCADORES.find((x) => linha.startsWith(x.marca, i));
    if (m) {
      if (ativos.has(m.chave)) {
        fechar();
        ativos.delete(m.chave);
        i += m.marca.length;
        continue;
      }
      if (temFechamento(linha, i, m.marca)) {
        fechar();
        ativos.add(m.chave);
        i += m.marca.length;
        continue;
      }
      // Sem par na linha: é texto, e não marcação.
    }
    buffer += linha[i];
    i += 1;
  }
  fechar();
  return trechos;
}

/* ============================================================ */
/* TABELAS                                                       */
/* ============================================================ */

/** A linha é candidata a linha de tabela? Começar com `|` basta. */
const ehLinhaTabela = (linha) => linha.trim().startsWith("|");

/** A linha separadora, do tipo `| --- | :--: | ---: |`. */
const RE_SEPARADORA = /^\s*\|(\s*:?-{1,}:?\s*\|)+\s*$/;

/**
 * Quebra a linha em células, respeitando `\|`. Não dá para usar `split("|")`:
 * uma célula com barra escapada perderia o resto da linha.
 *
 * A barra da BORDA (a primeira e a última) é opcional, como no Markdown.
 */
function celulasDe(linha) {
  const s = linha.trim();
  const celulas = [];
  let atual = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "\\" && i + 1 < s.length) { atual += s[i] + s[i + 1]; i++; continue; }
    if (s[i] === "|") { celulas.push(atual); atual = ""; continue; }
    atual += s[i];
  }
  celulas.push(atual);
  // A borda vira célula vazia nas pontas: some sem tocar nas do meio, que
  // podem ser vazias de propósito.
  if (celulas.length && celulas[0].trim() === "") celulas.shift();
  if (celulas.length && celulas[celulas.length - 1].trim() === "") celulas.pop();
  return celulas.map((c) => c.trim());
}

/** O alinhamento de cada coluna, lido da linha separadora. */
const alinhamentosDe = (separadora) => celulasDe(separadora).map((c) => {
  const ini = c.startsWith(":");
  const fim = c.endsWith(":");
  if (ini && fim) return "centro";
  if (fim) return "direita";
  return "esquerda";
});

/* ============================================================ */
/* BLOCOS                                                        */
/* ============================================================ */
/**
 * O texto inteiro, uma lista de BLOCOS. Cada bloco tem `tipo`:
 *
 *   "vazio"   — linha em branco do autor, que é parágrafo e não sujeira
 *   "titulo"  — `{ nivel, trechos }`
 *   "texto"   — `{ trechos }`
 *   "tabela"  — `{ cabecalho, linhas, alinhamentos }`, tudo em trechos
 *
 * ⚠ Era uma lista de LINHAS até a tabela existir. Tabela ocupa várias linhas de
 * origem e vira um bloco só, então o modelo teve de subir um nível.
 */
export function parseTextoRico(texto) {
  const linhas = String(texto ?? "").split("\n");
  const blocos = [];
  let i = 0;

  while (i < linhas.length) {
    const linha = linhas[i];

    // Tabela: cabeçalho + separadora obrigatória, e o corpo vai até a primeira
    // linha que não comece com `|`.
    if (ehLinhaTabela(linha) && i + 1 < linhas.length && RE_SEPARADORA.test(linhas[i + 1])) {
      const alinhamentos = alinhamentosDe(linhas[i + 1]);
      const cabecalho = celulasDe(linha).map(parseLinha);
      const corpo = [];
      i += 2;
      while (i < linhas.length && ehLinhaTabela(linhas[i])) {
        corpo.push(celulasDe(linhas[i]).map(parseLinha));
        i += 1;
      }
      blocos.push({ tipo: "tabela", cabecalho, linhas: corpo, alinhamentos });
      continue;
    }

    const { nivel, resto } = separaTitulo(linha);
    const trechos = parseLinha(resto);
    if (nivel) blocos.push({ tipo: "titulo", nivel, trechos });
    else if (trechos.length) blocos.push({ tipo: "texto", trechos });
    else blocos.push({ tipo: "vazio" });
    i += 1;
  }
  return blocos;
}

/** Junta os trechos de uma célula ou linha num texto sem marcação. */
const juntar = (trechos) => trechos.map((t) => t.texto).join("");

/** O texto SEM marcação, para onde só cabe texto puro (resumo, busca, título). */
export const textoPuro = (texto) => parseTextoRico(texto).map((b) => {
  if (b.tipo === "tabela") {
    return [b.cabecalho, ...b.linhas].map((l) => l.map(juntar).join(" | ")).join("\n");
  }
  if (b.tipo === "vazio") return "";
  return juntar(b.trechos);
}).join("\n");

/* ============================================================ */
/* EDIÇÃO                                                        */
/* ============================================================ */

/** O trecho `[ini, fim)` já está envolvido por `marca`? Por dentro ou por fora. */
function jaEnvolvido(texto, ini, fim, marca) {
  const fora = texto.slice(ini - marca.length, ini) === marca
    && texto.slice(fim, fim + marca.length) === marca;
  const dentro = fim - ini >= marca.length * 2
    && texto.startsWith(marca, ini)
    && texto.slice(fim - marca.length, fim) === marca;
  return { fora, dentro };
}

/**
 * Aplica (ou tira) um marcador na seleção. Devolve `{ texto, ini, fim }` com a
 * seleção nova, para o campo devolver o cursor ao lugar certo.
 *
 * Três casos, e o terceiro é o que faz a barra parecer um editor de verdade:
 *   1. já envolvido  → DESFAZ, por dentro ou por fora da seleção
 *   2. seleção vazia → insere o par e põe o cursor no meio
 *   3. o normal      → envolve o que está selecionado
 */
export function alternarMarcador(texto, ini, fim, marca) {
  const s = String(texto ?? "");
  const a = Math.max(0, Math.min(s.length, ini ?? 0));
  const b = Math.max(a, Math.min(s.length, fim ?? a));
  const n = marca.length;
  const { fora, dentro } = jaEnvolvido(s, a, b, marca);

  if (fora) {
    return {
      texto: s.slice(0, a - n) + s.slice(a, b) + s.slice(b + n),
      ini: a - n,
      fim: b - n,
    };
  }
  if (dentro) {
    return {
      texto: s.slice(0, a) + s.slice(a + n, b - n) + s.slice(b),
      ini: a,
      fim: b - n * 2,
    };
  }
  if (a === b) {
    return { texto: s.slice(0, a) + marca + marca + s.slice(a), ini: a + n, fim: a + n };
  }
  return {
    texto: s.slice(0, a) + marca + s.slice(a, b) + marca + s.slice(b),
    ini: a + n,
    fim: b + n,
  };
}

/**
 * Aplica (ou tira) um título na linha onde o cursor está. Devolve
 * `{ texto, ini, fim }`, igual ao `alternarMarcador`.
 *
 * ⚠ Age na LINHA INTEIRA, e não na seleção: título é prefixo, e envolver só a
 * palavra selecionada não faria sentido nenhum. Clicar no mesmo nível DESFAZ, e
 * clicar no outro nível TROCA (nunca empilha `# ## `).
 */
export function alternarTitulo(texto, ini, fim, nivel) {
  const s = String(texto ?? "");
  const a = Math.max(0, Math.min(s.length, ini ?? 0));
  const b = Math.max(a, Math.min(s.length, fim ?? a));
  const inicioLinha = s.lastIndexOf("\n", a - 1) + 1;
  const atual = separaTitulo(s.slice(inicioLinha));
  const alvo = TITULOS.find((t) => t.nivel === nivel);
  if (!alvo) return { texto: s, ini: a, fim: b };

  const prefixoAtual = atual.nivel
    ? TITULOS.find((t) => t.nivel === atual.nivel).prefixo
    : "";
  const prefixoNovo = atual.nivel === nivel ? "" : alvo.prefixo;
  const delta = prefixoNovo.length - prefixoAtual.length;

  return {
    texto: s.slice(0, inicioLinha) + prefixoNovo + s.slice(inicioLinha + prefixoAtual.length),
    // O cursor anda junto com o prefixo, mas nunca para antes do começo da
    // linha: quem clicou com o cursor na coluna 0 continua na coluna 0.
    ini: Math.max(inicioLinha, a + delta),
    fim: Math.max(inicioLinha, b + delta),
  };
}

/** O esqueleto que o botão de tabela insere: cabeçalho, separadora e uma linha. */
export const TABELA_MODELO = [
  "| Coluna | Coluna |",
  "| --- | --- |",
  "|  |  |",
].join("\n");

/**
 * Insere uma tabela em branco no cursor. Devolve `{ texto, ini, fim }` com a
 * PRIMEIRA célula do cabeçalho selecionada, para o autor já sair digitando o
 * nome da coluna em cima dela.
 *
 * ⚠ A tabela precisa começar em linha própria: enfiada no meio de um parágrafo
 * ela não seria reconhecida (o `|` teria texto antes). Por isso a quebra é
 * acrescentada quando o cursor não está no começo de uma linha vazia.
 */
export function inserirTabela(texto, ini, fim) {
  const s = String(texto ?? "");
  const a = Math.max(0, Math.min(s.length, ini ?? 0));
  const b = Math.max(a, Math.min(s.length, fim ?? a));
  const antes = s.slice(0, a);
  const depois = s.slice(b);
  const abre = antes === "" || antes.endsWith("\n") ? "" : "\n";
  const fecha = depois === "" || depois.startsWith("\n") ? "" : "\n";
  const bloco = `${abre}${TABELA_MODELO}${fecha}`;
  // "Coluna" da primeira célula, para a seleção cair em cima dela.
  const alvo = antes.length + abre.length + "| ".length;
  return { texto: antes + bloco + depois, ini: alvo, fim: alvo + "Coluna".length };
}

/** Validador de conteúdo, no padrão dos outros catálogos do Afty. */
export function validarTextoRico() {
  const erros = [];
  const vistos = new Set();
  for (const m of MARCADORES) {
    if (vistos.has(m.chave)) erros.push(`MARCADORES: chave duplicada "${m.chave}".`);
    vistos.add(m.chave);
    if (!m.marca) erros.push(`MARCADORES: "${m.chave}" sem marca.`);
  }
  // ⚠ A ordem é regra, não estilo: um marcador que seja PREFIXO de outro tem de
  // vir depois dele, senão o mais curto casa primeiro e o mais longo nunca casa.
  for (let i = 0; i < MARCADORES.length; i++) {
    for (let j = i + 1; j < MARCADORES.length; j++) {
      if (MARCADORES[j].marca.startsWith(MARCADORES[i].marca)) {
        erros.push(`MARCADORES: "${MARCADORES[j].marca}" começa com "${MARCADORES[i].marca}" e vem depois dele.`);
      }
    }
  }
  // Mesma regra de prefixo entre os títulos ("# " contra "## ").
  for (let i = 0; i < TITULOS.length; i++) {
    for (let j = i + 1; j < TITULOS.length; j++) {
      if (TITULOS[j].prefixo.startsWith(TITULOS[i].prefixo)) {
        erros.push(`TITULOS: "${TITULOS[j].prefixo}" começa com "${TITULOS[i].prefixo}" e vem depois dele.`);
      }
    }
  }
  // O modelo que o botão insere tem de ser reconhecido pelo próprio parser,
  // senão o botão produz texto que não vira tabela.
  const [bloco] = parseTextoRico(TABELA_MODELO);
  if (bloco?.tipo !== "tabela") erros.push("TABELA_MODELO não é reconhecido como tabela pelo parser.");
  else if (bloco.cabecalho.length !== bloco.alinhamentos.length) {
    erros.push("TABELA_MODELO tem cabeçalho e separadora com contagens diferentes.");
  }
  return erros;
}
