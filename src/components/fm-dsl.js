// fm-dsl.js
// ============================================================
// MOTOR DE AUTOMAÇÃO — Fase 3: DSL (linguagem de expressões segura)
// ============================================================
// Avaliador PURO de expressões, em português, SEM eval/Function (seguro).
// Usado para: valor de um efeito (ex.: "metade(hp_max)"), pré-requisito de
// uma regra ("dom >= 3"), e — futuramente — durações condicionais.
//
// Gramática (precedência, do menor pro maior):
//   ou  →  e  →  comparações (< > <= >= == !=)  →  + -  →  * / %  →  unário (- nao)  →  primário
// Primário: número | variável | funcao(args) | (expr)
// Palavras-chave: e (&&), ou (||), nao (!), verdadeiro (1), falso (0).
// Booleanos são números (1/0). Identificadores são normalizados (minúsculas,
// sem acento) — então "Constituição" e "constituicao" são a mesma variável.
// ============================================================

// ------------------------------------------------------------
// FUNÇÕES disponíveis
// ------------------------------------------------------------
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

const normalizeWord = (w) =>
  w.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// ------------------------------------------------------------
// TOKENIZER
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// PARSER (descida recursiva)
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// AVALIAÇÃO
// ------------------------------------------------------------
function evaluate(ast, ctx) {
  switch (ast.n) {
    case "num": return ast.v;
    case "var": {
      if (!(ast.name in ctx)) throw new Error(`Variável desconhecida: ${ast.name}`);
      return Number(ctx[ast.name]) || 0;
    }
    case "call": {
      const f = FUNCS[ast.name];
      if (!f) throw new Error(`Função desconhecida: ${ast.name}`);
      return Number(f(...ast.args.map((a) => evaluate(a, ctx)))) || 0;
    }
    case "un": {
      const v = evaluate(ast.e, ctx);
      return ast.op === "-" ? -v : (v ? 0 : 1);
    }
    case "bin": {
      const l = evaluate(ast.l, ctx);
      const r = evaluate(ast.r, ctx);
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

// ------------------------------------------------------------
// API PÚBLICA
// ------------------------------------------------------------
export function evalNumber(src, ctx, fallback = 0) {
  try { return evaluate(parse(tokenize(src)), ctx ?? {}); }
  catch { return fallback; }
}

export function evalBoolean(src, ctx, fallback = false) {
  try { return evaluate(parse(tokenize(src)), ctx ?? {}) ? true : false; }
  catch { return fallback; }
}

// Validação para o editor (sem precisar de um contexto real). Checa sintaxe,
// funções conhecidas e — se `knownVars` for passado — variáveis conhecidas.
export function validateExpression(src, knownVars = null) {
  if (!src || !String(src).trim()) return { ok: true };
  let ast;
  try { ast = parse(tokenize(src)); }
  catch (e) { return { ok: false, error: e.message }; }

  const vars = new Set();
  const funcs = new Set();
  (function walk(n) {
    if (!n) return;
    if (n.n === "var") vars.add(n.name);
    else if (n.n === "call") { funcs.add(n.name); n.args.forEach(walk); }
    else if (n.n === "bin") { walk(n.l); walk(n.r); }
    else if (n.n === "un") walk(n.e);
  })(ast);

  for (const f of funcs) if (!(f in FUNCS)) return { ok: false, error: `Função desconhecida: ${f}()` };
  if (knownVars) for (const v of vars) if (!knownVars.has(v)) return { ok: false, error: `Variável desconhecida: ${v}` };
  return { ok: true };
}

// ------------------------------------------------------------
// CONTEXTO — variáveis disponíveis a partir do snapshot + combatState
// As expressões leem os valores BASE (snapshot.stats) + recursos atuais, pra
// evitar laço (um efeito que modifica Defesa não lê a Defesa já modificada).
// ------------------------------------------------------------
export function buildDslContext(snapshot = {}, combatState = {}) {
  const st = snapshot.stats || {};
  const at = snapshot.attributes || {};
  const co = snapshot.core || {};
  const ap = snapshot.aptidoes || {};
  const mod = (v) => Math.floor(((v ?? 10) - 10) / 2);
  const hpMax = combatState.hpMaxBase ?? st.hpMax ?? 0;

  const ctx = {
    // Atributos
    forca: at.forca ?? 10, destreza: at.destreza ?? 10, constituicao: at.constituicao ?? 10,
    inteligencia: at.inteligencia ?? 10, sabedoria: at.sabedoria ?? 10, presenca: at.presenca ?? 10,
    mod_forca: mod(at.forca), mod_destreza: mod(at.destreza), mod_constituicao: mod(at.constituicao),
    mod_inteligencia: mod(at.inteligencia), mod_sabedoria: mod(at.sabedoria), mod_presenca: mod(at.presenca),
    // Núcleo
    nd: co.nd ?? 0, bt: co.bonusTreinamento ?? 0,
    dom: ap.dom ?? 0, au: ap.au ?? 0, cl: ap.cl ?? 0, bar: ap.bar ?? 0, er: ap.er ?? 0,
    // Stats base
    defesa: st.defesa ?? 0, acerto: st.acerto ?? 0, cd: st.cdBase ?? 0,
    atencao: st.atencao ?? 0, iniciativa: st.iniciativa ?? 0, deslocamento: st.deslocamento ?? 0,
    rd_geral: st.rdGeral ?? 0, rd_irredutivel: st.rdIrredutivel ?? 0,
    guarda_max: st.guardaInabavalMax ?? 0, hp_max: hpMax, pe_max: st.peMax ?? 0,
    // Recursos atuais (combate)
    hp_atual: combatState.hpCurrent ?? hpMax,
    pe_atual: combatState.peCurrent ?? (st.peMax ?? 0),
    guarda_atual: combatState.guardaInabavalCurrent ?? 0,
    alma_atual: combatState.almaAtual ?? hpMax,
    // PV temporário = excedente do PV acima do máximo (modelo de overflow).
    hp_temp: Math.max(0, (combatState.hpCurrent ?? hpMax) - hpMax),
    // Dano sofrido por último (p/ reações on_damaged, ex.: "metade(dano)").
    dano: combatState.lastDamage ?? 0,
  };
  ctx.hp_pct = ctx.hp_max > 0 ? (ctx.hp_atual / ctx.hp_max) * 100 : 0;
  ctx.pe_pct = ctx.pe_max > 0 ? (ctx.pe_atual / ctx.pe_max) * 100 : 0;
  return ctx;
}

export const DSL_VARIABLE_NAMES = new Set(Object.keys(buildDslContext()));

// Contexto da DSL a partir do rascunho do Builder (sem snapshot/combate). Usa
// os stats já derivados (`derived.stats`) e injeta o BT no núcleo. Serve para a
// prévia ao vivo dos valores de expressão durante a criação da ficha.
export function buildDraftDslContext(draft = {}, derived = {}) {
  return buildDslContext(
    {
      core: { ...(draft.core || {}), bonusTreinamento: derived.bt ?? draft.core?.bonusTreinamento ?? 0 },
      attributes: draft.attributes || {},
      aptidoes: draft.aptidoes || {},
      stats: derived.stats || {},
    },
    {}
  );
}

// ------------------------------------------------------------
// CATÁLOGOS PARA A DOCUMENTAÇÃO (fonte única — doc no app e .md derivam daqui)
// ------------------------------------------------------------
export const DSL_VARIABLE_GROUPS = [
  {
    label: "Atributos",
    items: [
      ["forca, destreza, constituicao, inteligencia, sabedoria, presenca", "Valor do atributo (ex.: 18)."],
      ["mod_forca, mod_destreza, ...", "Modificador do atributo (ex.: +4)."],
    ],
  },
  {
    label: "Núcleo",
    items: [
      ["nd", "Nível de Desafio."],
      ["bt", "Bônus de Treinamento."],
      ["dom, au, cl, bar, er", "Níveis de aptidão (Domínio, Aura, Controle/Leitura, Barreira, Energia Reversa)."],
    ],
  },
  {
    label: "Stats de combate (base)",
    items: [
      ["defesa, acerto, cd", "Defesa, Acerto e CD."],
      ["atencao, iniciativa, deslocamento", "Atenção, Iniciativa e Deslocamento."],
      ["rd_geral, rd_irredutivel", "Redução de Dano."],
      ["guarda_max, hp_max, pe_max", "Guarda Inabalável, PV e PE máximos."],
    ],
  },
  {
    label: "Recursos atuais (combate)",
    items: [
      ["hp_atual, pe_atual", "PV e PE atuais."],
      ["guarda_atual, alma_atual, hp_temp", "Guarda atual, Alma atual e PV temporário."],
      ["dano", "Dano sofrido por último (para reações ao sofrer dano)."],
      ["hp_pct, pe_pct", "Percentual de PV/PE atual (0–100)."],
    ],
  },
];

export const DSL_FUNCTIONS = [
  ["metade(x)", "Metade de x."],
  ["dobro(x)", "Dobro de x."],
  ["teto(x)", "Arredonda pra cima."],
  ["piso(x)", "Arredonda pra baixo."],
  ["arredonda(x)", "Arredonda ao inteiro mais próximo."],
  ["abs(x)", "Valor absoluto."],
  ["min(a, b, ...)", "Menor valor."],
  ["max(a, b, ...)", "Maior valor."],
];

export const DSL_OPERATORS = [
  ["+  -  *  /  %", "Aritmética."],
  ["<  >  <=  >=  ==  !=", "Comparações (resultam em verdadeiro/falso)."],
  ["e   ou   nao", "Lógicos (também aceitam &&, ||, !)."],
  ["verdadeiro / falso", "Constantes booleanas (1 / 0)."],
];

export const DSL_EXAMPLES = [
  ["metade(nd)", "Metade do ND — bom pra escalar um buff."],
  ["bt + 2", "Bônus de Treinamento mais 2."],
  ["dom >= 3", "Pré-requisito: Domínio nível 3 ou mais."],
  ["hp_atual < metade(hp_max)", "Verdadeiro quando estiver com menos da metade da vida."],
  ["max(mod_presenca, 1)", "O modificador de Presença, no mínimo 1."],
  ["dom >= 3 e pe_atual >= 10", "Combina dois pré-requisitos."],
];

// ------------------------------------------------------------
// GERADORES — referência em markdown + prompt pra IA
// ------------------------------------------------------------
export function dslReferenceMarkdown() {
  const lines = [];
  lines.push("# DSL de Automação — Grimório");
  lines.push("");
  lines.push("Linguagem de expressões para programar habilidades (buffs/efeitos). Em português, sem código de verdade — só expressões matemáticas e lógicas. Uma expressão sempre resulta num **número** (booleanos são 1/0).");
  lines.push("");
  lines.push("## Variáveis");
  for (const g of DSL_VARIABLE_GROUPS) {
    lines.push("");
    lines.push(`### ${g.label}`);
    for (const [name, desc] of g.items) lines.push(`- \`${name}\` — ${desc}`);
  }
  lines.push("");
  lines.push("## Funções");
  for (const [sig, desc] of DSL_FUNCTIONS) lines.push(`- \`${sig}\` — ${desc}`);
  lines.push("");
  lines.push("## Operadores");
  for (const [sym, desc] of DSL_OPERATORS) lines.push(`- \`${sym}\` — ${desc}`);
  lines.push("");
  lines.push("## Exemplos");
  for (const [expr, desc] of DSL_EXAMPLES) lines.push(`- \`${expr}\` — ${desc}`);
  lines.push("");
  return lines.join("\n");
}

export function dslLlmPrompt() {
  return [
    "Você vai me ajudar a escrever UMA expressão para a DSL de automação do app de RPG \"Grimório\".",
    "Regras da linguagem:",
    "- A expressão resulta sempre num número (booleanos são 1/0).",
    "- Não use aspas, nem nomes de variáveis fora da lista abaixo, nem funções fora da lista.",
    "- Responda APENAS com a expressão final, sem explicação.",
    "",
    dslReferenceMarkdown(),
    "",
    "Minha habilidade faz o seguinte (descreva aqui o que você quer):",
    "<<DESCREVA AQUI>>",
  ].join("\n");
}
