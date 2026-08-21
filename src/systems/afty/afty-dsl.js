/**
 * ============================================================
 * DSL DO AFTY — o avaliador de expressões, do lado do Afty
 * ============================================================
 * ⚠ ISTO É UMA CÓPIA de `src/components/fm-dsl.js` (grimório 2.5.2), feita em
 * 2026-08-20 com autorização expressa do autor.
 *
 * O motivo está registrado desde 2026-07-27 no cabeçalho do `afty-efeitos.js`:
 * variável nova é livre (o contexto é montado do lado do Afty) e tipo de efeito
 * novo é livre, mas **FUNÇÃO ou OPERADOR novo do DSL exigiria editar a 2.5.2**,
 * que é somente-leitura. Perguntei ao autor ao desenhar os Addons e ele liberou
 * a cópia. Daqui para frente a linguagem cresce deste lado.
 *
 * O QUE VEIO IGUAL do fm-dsl.js: o tokenizer, o parser de descida recursiva, o
 * avaliador, as 8 funções puras e as três saídas (`evalNumber`, `evalBoolean`,
 * `validateExpression`). Expressão que funcionava na 2.5.2 funciona aqui.
 *
 * O QUE É NOVO daqui:
 *   • LITERAL DE TEXTO ("adaptacao"), que o fm-dsl não tem. Só vale como
 *     argumento direto de função, e o validador reprova em qualquer outro lugar.
 *   • FUNÇÕES DE CONTEXTO (`FUNCS_CTX`), que recebem o contexto além dos
 *     argumentos. A primeira é `contar(tag)`.
 *
 * ⚠ O que NÃO veio: `buildDslContext`, que monta o contexto da 2.5.2. O Afty
 * tem o próprio (`buildCriaturaDslContext`, em `afty-efeitos.js`), com cerca de
 * 660 variáveis contra as poucas dezenas de lá.
 *
 * ⚠ A 2.5.2 SEGUE INTACTA e continua usando o `fm-dsl.js` dela. As duas cópias
 * divergem de propósito a partir de hoje: melhoria daqui NÃO volta para lá.
 * ============================================================
 */

/* ============================================================ */
/* FUNÇÕES PURAS (idênticas às do fm-dsl.js)                     */
/* ============================================================ */

const FUNCS = {
  metade: (a) => a / 2,
  dobro: (a) => a * 2,
  teto: Math.ceil,
  piso: Math.floor,
  arredonda: Math.round,
  abs: Math.abs,
  min: (...a) => Math.min(...a),
  max: (...a) => Math.max(...a),
};

/* ============================================================ */
/* FUNÇÕES DE CONTEXTO (novas, do Afty)                          */
/* ============================================================ */
/**
 * Recebem `(ctx, ...args)`. Existem porque `contar` não é função de matemática:
 * ela pergunta à FICHA quantas coisas com aquela marca a criatura tem, e isso
 * não cabe numa variável, que teria de ser uma por marca existente.
 *
 * ⚠ A chave `#marcas` do contexto é ilegível pelo tokenizer de propósito: o
 * identificador do DSL nunca começa com `#`, então nenhuma expressão consegue
 * ler o mapa cru, e o `vocabularioDsl` a ignora pelo mesmo sinal.
 */
const normalizeWord = (w) =>
  String(w).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * A mesma normalização dos identificadores, exposta para quem MONTA o mapa de
 * marcas. Tem de ser a mesma função dos dois lados, senão `contar("Adaptação")`
 * procuraria uma chave que o outro lado gravou de outro jeito.
 */
export const normalizarMarca = (m) => normalizeWord(String(m ?? "").trim());

export const CHAVE_MARCAS = "#marcas";

const FUNCS_CTX = {
  /** Quantas entradas da ficha carregam a marca. Sem a marca, zero. */
  contar: (ctx, marca) => {
    const mapa = ctx?.[CHAVE_MARCAS];
    if (!mapa) return 0;
    return mapa[normalizarMarca(marca)] ?? 0;
  },
};

/** Quais funções aceitam texto, e em qual posição. O validador usa isto. */
const ARGS_DE_TEXTO = { contar: [0] };

/* ============================================================ */
/* TOKENIZER                                                     */
/* ============================================================ */

const OPS2 = [">=", "<=", "==", "!=", "&&", "||"];

function tokenize(src) {
  const tokens = [];
  const s = String(src ?? "");
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === " " || c === "\t" || c === "\n" || c === "\r") { i++; continue; }

    // número (aceita ponto decimal)
    if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(s[i + 1] || ""))) {
      let j = i + 1;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      tokens.push({ t: "num", v: parseFloat(s.slice(i, j)) });
      i = j; continue;
    }

    // NOVO no Afty: literal de texto, entre aspas duplas ou simples. Sem escape
    // por dentro: uma marca é um nome curto, e barra invertida só traria bug.
    if (c === '"' || c === "'") {
      const fecha = s.indexOf(c, i + 1);
      if (fecha === -1) throw new Error("Texto sem aspas de fechamento");
      tokens.push({ t: "str", v: s.slice(i + 1, fecha) });
      i = fecha + 1; continue;
    }

    // identificador / palavra-chave (aceita acentos e _)
    if (/[a-zA-Z_À-ſ]/.test(c)) {
      let j = i + 1;
      while (j < s.length && /[a-zA-Z0-9_À-ſ]/.test(s[j])) j++;
      const norm = normalizeWord(s.slice(i, j));
      if (norm === "e") tokens.push({ t: "op", v: "&&" });
      else if (norm === "ou") tokens.push({ t: "op", v: "||" });
      else if (norm === "nao") tokens.push({ t: "op", v: "!" });
      else if (norm === "verdadeiro") tokens.push({ t: "num", v: 1 });
      else if (norm === "falso") tokens.push({ t: "num", v: 0 });
      else tokens.push({ t: "ident", v: norm });
      i = j; continue;
    }

    const two = s.slice(i, i + 2);
    if (OPS2.includes(two)) { tokens.push({ t: "op", v: two }); i += 2; continue; }
    if ("+-*/%<>!".includes(c)) { tokens.push({ t: "op", v: c }); i++; continue; }
    if (c === "(") { tokens.push({ t: "lp" }); i++; continue; }
    if (c === ")") { tokens.push({ t: "rp" }); i++; continue; }
    if (c === ",") { tokens.push({ t: "comma" }); i++; continue; }

    throw new Error(`Caractere inválido: "${c}"`);
  }
  tokens.push({ t: "end" });
  return tokens;
}

/* ============================================================ */
/* PARSER (descida recursiva)                                    */
/* ============================================================ */

function parse(tokens) {
  let p = 0;
  const peek = () => tokens[p];
  const next = () => tokens[p++];
  const expect = (t) => {
    if (tokens[p].t !== t) throw new Error("Sintaxe inválida");
    return tokens[p++];
  };
  const isOp = (...vs) => peek().t === "op" && vs.includes(peek().v);

  const parseOr = () => {
    let l = parseAnd();
    while (isOp("||")) { next(); l = { n: "bin", op: "||", l, r: parseAnd() }; }
    return l;
  };
  const parseAnd = () => {
    let l = parseCmp();
    while (isOp("&&")) { next(); l = { n: "bin", op: "&&", l, r: parseCmp() }; }
    return l;
  };
  const parseCmp = () => {
    let l = parseAdd();
    while (isOp("<", ">", "<=", ">=", "==", "!=")) { const op = next().v; l = { n: "bin", op, l, r: parseAdd() }; }
    return l;
  };
  const parseAdd = () => {
    let l = parseMul();
    while (isOp("+", "-")) { const op = next().v; l = { n: "bin", op, l, r: parseMul() }; }
    return l;
  };
  const parseMul = () => {
    let l = parseUnary();
    while (isOp("*", "/", "%")) { const op = next().v; l = { n: "bin", op, l, r: parseUnary() }; }
    return l;
  };
  const parseUnary = () => {
    if (isOp("-", "!")) { const op = next().v; return { n: "un", op, e: parseUnary() }; }
    return parsePrimary();
  };
  const parsePrimary = () => {
    const tk = peek();
    if (tk.t === "num") { next(); return { n: "num", v: tk.v }; }
    if (tk.t === "str") { next(); return { n: "str", v: tk.v }; }
    if (tk.t === "lp") { next(); const e = parseOr(); expect("rp"); return e; }
    if (tk.t === "ident") {
      next();
      if (peek().t === "lp") {
        next();
        const args = [];
        if (peek().t !== "rp") {
          args.push(parseOr());
          while (peek().t === "comma") { next(); args.push(parseOr()); }
        }
        expect("rp");
        return { n: "call", name: tk.v, args };
      }
      return { n: "var", name: tk.v };
    }
    throw new Error("Expressão incompleta");
  };

  const ast = parseOr();
  if (peek().t !== "end") throw new Error("Sobrou conteúdo na expressão");
  return ast;
}

/* ============================================================ */
/* AVALIAÇÃO                                                     */
/* ============================================================ */

/* Texto só vale como argumento de função de contexto. Em qualquer outro lugar é
   ERRO, e erro cai no fallback, que é a garantia do motor desde sempre.
   Deixar `2 + "abc"` valer 2 (com o texto virando zero calado) esconderia o
   engano de quem escreveu, e o validador já reprova a mesma expressão no editor.
   O fm-dsl não precisava disto porque lá tudo era número. */
const num = (v) => {
  if (typeof v === "string") throw new Error("Texto não entra em conta");
  return Number(v) || 0;
};

function evaluate(ast, ctx) {
  switch (ast.n) {
    case "num": return ast.v;
    case "str": return ast.v;
    case "var": {
      if (!(ast.name in ctx)) throw new Error(`Variável desconhecida: ${ast.name}`);
      return Number(ctx[ast.name]) || 0;
    }
    case "call": {
      const args = ast.args.map((a) => evaluate(a, ctx));
      const fc = FUNCS_CTX[ast.name];
      if (fc) return Number(fc(ctx, ...args)) || 0;
      const f = FUNCS[ast.name];
      if (!f) throw new Error(`Função desconhecida: ${ast.name}`);
      return Number(f(...args.map(num))) || 0;
    }
    case "un": {
      const v = num(evaluate(ast.e, ctx));
      return ast.op === "-" ? -v : (v ? 0 : 1);
    }
    case "bin": {
      const l = num(evaluate(ast.l, ctx));
      const r = num(evaluate(ast.r, ctx));
      switch (ast.op) {
        case "+": return l + r;
        case "-": return l - r;
        case "*": return l * r;
        case "/": return r === 0 ? 0 : l / r;
        case "%": return r === 0 ? 0 : l % r;
        case "<": return l < r ? 1 : 0;
        case ">": return l > r ? 1 : 0;
        case "<=": return l <= r ? 1 : 0;
        case ">=": return l >= r ? 1 : 0;
        case "==": return l === r ? 1 : 0;
        case "!=": return l !== r ? 1 : 0;
        case "&&": return l && r ? 1 : 0;
        case "||": return l || r ? 1 : 0;
        default: throw new Error(`Operador inválido: ${ast.op}`);
      }
    }
    default: throw new Error("Nó inválido");
  }
}

/* ============================================================ */
/* API PÚBLICA                                                   */
/* ============================================================ */

export function evalNumber(src, ctx, fallback = 0) {
  try {
    const v = evaluate(parse(tokenize(src)), ctx ?? {});
    // Expressão que termina em texto não é número: cai no fallback em vez de
    // devolver string para quem espera somar.
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
  } catch { return fallback; }
}

export function evalBoolean(src, ctx, fallback = false) {
  try { return num(evaluate(parse(tokenize(src)), ctx ?? {})) ? true : false; }
  catch { return fallback; }
}

/**
 * Validação para o editor, sem precisar de contexto real. Checa sintaxe,
 * funções conhecidas, texto no lugar certo e, com `knownVars`, as variáveis.
 */
export function validateExpression(src, knownVars = null) {
  if (!src || !String(src).trim()) return { ok: true };
  let ast;
  try { ast = parse(tokenize(src)); }
  catch (e) { return { ok: false, error: e.message }; }

  const vars = new Set();
  const funcs = new Set();
  let textoForaDeLugar = false;

  // `emArgumento` diz se o nó é argumento direto de uma função que aceita texto
  // naquela posição. Fora daí, texto é erro: "adaptacao + 2" não quer dizer nada
  // e cair calado no fallback esconderia o engano de quem escreveu.
  (function walk(n, emArgumento) {
    if (!n) return;
    if (n.n === "str") { if (!emArgumento) textoForaDeLugar = true; return; }
    if (n.n === "var") { vars.add(n.name); return; }
    if (n.n === "call") {
      funcs.add(n.name);
      const posicoes = ARGS_DE_TEXTO[n.name] ?? [];
      n.args.forEach((a, i) => walk(a, posicoes.includes(i)));
      return;
    }
    if (n.n === "bin") { walk(n.l, false); walk(n.r, false); return; }
    if (n.n === "un") walk(n.e, false);
  })(ast, false);

  for (const f of funcs) {
    if (!(f in FUNCS) && !(f in FUNCS_CTX)) return { ok: false, error: `Função desconhecida: ${f}()` };
  }
  if (textoForaDeLugar) return { ok: false, error: "Texto entre aspas só vale como argumento de contar()" };
  if (knownVars) for (const v of vars) if (!knownVars.has(v)) return { ok: false, error: `Variável desconhecida: ${v}` };
  return { ok: true };
}

/** Os nomes de função que o editor conhece, para a referência da UI. */
export const NOMES_DE_FUNCAO = [...Object.keys(FUNCS), ...Object.keys(FUNCS_CTX)];
