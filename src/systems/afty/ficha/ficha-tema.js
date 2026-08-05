/**
 * ============================================================
 * TEMA DA FICHA — presets, formulário e CSS personalizado
 * ============================================================
 * O pedido do autor: cada pessoa formata a aparência da própria ficha, com cor,
 * imagem e gif, e quem sabe CSS escreve CSS.
 *
 * Isto só é possível porque a Ficha é pintada por VARIÁVEL (ver `ficha.css`) e
 * não por classe de cor do Tailwind. Um tema é, literalmente, um mapa de
 * `--afty-*`, e um preset é um mapa pronto.
 *
 * Quatro camadas, da mais fácil para a mais livre:
 *   1. PRESET      um clique
 *   2. FORMULÁRIO  seletor de cor por token nomeado
 *   3. IMAGEM      url de fundo, com opacidade e encaixe
 *   4. CSS LIVRE   texto injetado num `<style>` dentro da raiz da Ficha
 *
 * ⚠ ONDE O TEMA MORA: chave própria no armazenamento, e NÃO dentro da criatura.
 * Mesmo motivo da sessão: o criador tem rascunho automático e um Salvar que
 * grava a ficha inteira, e um rascunho de ontem apagaria o tema de hoje, calado.
 * O preço é que o tema não viaja no export da criatura. Ver a pergunta D8 em
 * `docs/afty-ficha-final.md`.
 * ============================================================
 */

const CHAVE_BASE = "fm_ficha_tema_afty_v1";
const CHAVE_GLOBAL = `${CHAVE_BASE}:global`;
const chaveDe = (id) => `${CHAVE_BASE}:${id || "sem-id"}`;

/** Teto do CSS livre. Acima disto o editor avisa, e não impede. */
export const CSS_MAX = 64 * 1024;

/* ============================================================ */
/* TODOS os tokens, com o valor padrão                          */
/* ============================================================ */

/**
 * A lista completa das variáveis que a Ficha usa, com o valor de partida e o
 * que cada uma pinta.
 *
 * ⚠ FONTE ÚNICA. Daqui saem três coisas que antes eram três cópias: a cor
 * inicial do seletor do formulário, o preset Padrão e o prompt para a IA. Um
 * assert lê o `ficha.css` e reprova se qualquer valor divergir, então esta lista
 * não tem como envelhecer em silêncio.
 */
export const TOKENS_DOC = [
  { id: "--afty-fundo", valor: "#060910", oque: "fundo da página" },
  { id: "--afty-fundo-brilho", valor: "radial-gradient(120% 60% at 50% -10%, #7e22ce33, transparent 70%)", oque: "brilho por cima do fundo (aceita gradiente ou none)" },
  { id: "--afty-card", valor: "#0f172a", oque: "fundo dos cartões e do cabeçalho" },
  { id: "--afty-poco", valor: "#020617", oque: "fundo das linhas e dos campos, mais escuro que o cartão" },
  { id: "--afty-borda", valor: "#1e293b", oque: "borda padrão" },
  { id: "--afty-borda-forte", valor: "#334155", oque: "borda de botão e de chip" },
  { id: "--afty-texto", valor: "#f1f5f9", oque: "texto principal e números" },
  { id: "--afty-texto-suave", valor: "#94a3b8", oque: "rótulos e texto de regra" },
  { id: "--afty-texto-fraco", valor: "#64748b", oque: "texto secundário, o mais apagado" },
  { id: "--afty-destaque", valor: "#a855f7", oque: "a cor da marca: aba ativa, foco, realce" },
  { id: "--afty-destaque-texto", valor: "#d8b4fe", oque: "texto sobre o destaque" },
  { id: "--afty-destaque-fundo", valor: "#581c8766", oque: "fundo do destaque (com transparência)" },
  { id: "--afty-pv", valor: "#f43f5e", oque: "a barra e o número de Vida" },
  { id: "--afty-pe", valor: "#38bdf8", oque: "a barra e o número de Energia" },
  { id: "--afty-pvtemp", valor: "#fbbf24", oque: "o pedaço de PV temporário na barra de Vida" },
  { id: "--afty-alma", valor: "#e879f9", oque: "a barra e o número de Alma" },
  { id: "--afty-cura", valor: "#34d399", oque: "os números de cura" },
  { id: "--afty-aviso", valor: "#fbbf24", oque: "avisos e o triângulo de alerta" },
  { id: "--afty-veu", valor: "rgb(0 0 0 / 0.55)", oque: "o véu atrás da busca e deste painel" },
  { id: "--afty-raio", valor: "12px", oque: "arredondamento dos cartões" },
  { id: "--afty-raio-peq", valor: "8px", oque: "arredondamento das linhas e botões" },
  { id: "--afty-sombra", valor: "0 2px 10px rgb(0 0 0 / 0.45)", oque: "sombra dos cartões" },
  { id: "--afty-fonte", valor: "ui-sans-serif, system-ui, \"Segoe UI\", Roboto, sans-serif", oque: "fonte de tudo" },
  { id: "--afty-fonte-titulo", valor: "var(--afty-fonte)", oque: "fonte do nome da criatura e dos títulos" },
  { id: "--afty-fonte-num", valor: "ui-monospace, Consolas, monospace", oque: "fonte dos números" },
  { id: "--afty-imagem", valor: "none", oque: "imagem de fundo, como url(\"...\")" },
  { id: "--afty-imagem-opacidade", valor: "0.25", oque: "opacidade da imagem de fundo, de 0 a 1" },
  { id: "--afty-imagem-encaixe", valor: "cover", oque: "background-size da imagem" },
  { id: "--afty-imagem-posicao", valor: "center", oque: "background-position da imagem" },
];

const PADRAO = Object.fromEntries(TOKENS_DOC.map((t) => [t.id, t.valor]));

/* ============================================================ */
/* Os tokens que o formulário mostra                            */
/* ============================================================ */

/**
 * ⚠ É um RECORTE, e não a lista inteira do `ficha.css`. São 24 variáveis lá, e
 * um formulário com 24 seletores de cor não é personalização, é planilha. As que
 * ficaram de fora continuam alcançáveis pelo CSS livre, que é o lugar delas.
 */
export const GRUPOS_DE_TOKEN = [
  {
    id: "superficie",
    label: "Superfícies",
    tokens: [
      { id: "--afty-fundo", label: "Fundo" },
      { id: "--afty-card", label: "Cartão" },
      { id: "--afty-poco", label: "Poço" },
      { id: "--afty-borda", label: "Borda" },
    ],
  },
  {
    id: "texto",
    label: "Texto e Destaque",
    tokens: [
      { id: "--afty-texto", label: "Texto" },
      { id: "--afty-texto-suave", label: "Texto Suave" },
      { id: "--afty-destaque", label: "Destaque" },
      { id: "--afty-destaque-texto", label: "Destaque Claro" },
    ],
  },
  {
    id: "recursos",
    label: "Recursos",
    tokens: [
      { id: "--afty-pv", label: "Vida" },
      { id: "--afty-pe", label: "Energia" },
      { id: "--afty-alma", label: "Alma" },
      { id: "--afty-cura", label: "Cura" },
      { id: "--afty-aviso", label: "Aviso" },
    ],
  },
];

export const TOKENS_DE_COR = GRUPOS_DE_TOKEN.flatMap((g) => g.tokens.map((t) => t.id));

export const FONTES = [
  { id: "ui-sans-serif, system-ui, \"Segoe UI\", Roboto, sans-serif", label: "Do Sistema" },
  { id: "Georgia, \"Times New Roman\", serif", label: "Serifada" },
  { id: "ui-monospace, Consolas, monospace", label: "Monoespaçada" },
  { id: "\"Trebuchet MS\", \"Segoe UI\", sans-serif", label: "Estreita" },
];

export const ENCAIXES = [
  { id: "cover", label: "Preencher" },
  { id: "contain", label: "Caber" },
  { id: "auto", label: "Tamanho Real" },
];

/* ============================================================ */
/* Presets                                                       */
/* ============================================================ */

/**
 * ⚠ O preset PADRÃO não tem valores escritos à mão: ele é o recorte do
 * `TOKENS_DOC` com os tokens que o formulário mostra. Era cópia até
 * 2026-08-05, e cópia de 13 cores é divergência esperando acontecer.
 */
export const PRESETS = [
  {
    id: "padrao",
    nome: "Padrão",
    vars: Object.fromEntries(TOKENS_DE_COR.map((t) => [t, PADRAO[t]])),
  },
  {
    id: "pergaminho",
    nome: "Pergaminho",
    vars: {
      "--afty-fundo": "#efe6d3",
      "--afty-fundo-brilho": "radial-gradient(120% 60% at 50% -10%, #c9a97a55, transparent 70%)",
      "--afty-card": "#f8f2e4",
      "--afty-poco": "#e7dbc2",
      "--afty-borda": "#d5c4a1",
      "--afty-borda-forte": "#b8a179",
      "--afty-texto": "#2b2116",
      "--afty-texto-suave": "#6b5a44",
      "--afty-texto-fraco": "#93816a",
      "--afty-destaque": "#8b5a2b",
      "--afty-destaque-texto": "#5d3a17",
      "--afty-destaque-fundo": "#d8bf9a66",
      "--afty-pv": "#a52a2a",
      "--afty-pe": "#2f6f8f",
      "--afty-alma": "#7b4397",
      "--afty-cura": "#3f7d3f",
      "--afty-aviso": "#a86b00",
      "--afty-veu": "rgb(60 45 25 / 0.45)",
      "--afty-sombra": "0 2px 10px rgb(90 70 40 / 0.18)",
      "--afty-fonte": "Georgia, \"Times New Roman\", serif",
    },
  },
  {
    id: "sangue",
    nome: "Sangue",
    vars: {
      "--afty-fundo": "#0c0405",
      "--afty-fundo-brilho": "radial-gradient(120% 60% at 50% -10%, #7f1d1d55, transparent 70%)",
      "--afty-card": "#1a0a0d",
      "--afty-poco": "#0a0304",
      "--afty-borda": "#3b1418",
      "--afty-borda-forte": "#5c1f26",
      "--afty-texto": "#f7e9ea",
      "--afty-texto-suave": "#c9a0a4",
      "--afty-texto-fraco": "#8a6367",
      "--afty-destaque": "#dc2626",
      "--afty-destaque-texto": "#fca5a5",
      "--afty-destaque-fundo": "#7f1d1d66",
      "--afty-pv": "#ef4444",
      "--afty-pe": "#f59e0b",
      "--afty-alma": "#f472b6",
      "--afty-cura": "#84cc16",
    },
  },
  {
    id: "abissal",
    nome: "Abissal",
    vars: {
      "--afty-fundo": "#03080f",
      "--afty-fundo-brilho": "radial-gradient(120% 60% at 50% -10%, #0e749055, transparent 70%)",
      "--afty-card": "#0a1524",
      "--afty-poco": "#020610",
      "--afty-borda": "#14293f",
      "--afty-borda-forte": "#1f4260",
      "--afty-texto": "#e2f1ff",
      "--afty-texto-suave": "#8fb3cc",
      "--afty-texto-fraco": "#5b7d96",
      "--afty-destaque": "#22d3ee",
      "--afty-destaque-texto": "#a5f3fc",
      "--afty-destaque-fundo": "#0e749066",
      "--afty-pv": "#fb7185",
      "--afty-pe": "#38bdf8",
      "--afty-alma": "#c084fc",
      "--afty-cura": "#2dd4bf",
    },
  },
  {
    id: "terminal",
    nome: "Terminal",
    vars: {
      "--afty-fundo": "#050805",
      "--afty-fundo-brilho": "none",
      "--afty-card": "#0a120a",
      "--afty-poco": "#030603",
      "--afty-borda": "#14301a",
      "--afty-borda-forte": "#1f4a28",
      "--afty-texto": "#ccffcc",
      "--afty-texto-suave": "#7fbf8a",
      "--afty-texto-fraco": "#4f7a57",
      "--afty-destaque": "#22c55e",
      "--afty-destaque-texto": "#86efac",
      "--afty-destaque-fundo": "#14532d66",
      "--afty-pv": "#ff5555",
      "--afty-pe": "#ffd166",
      "--afty-alma": "#d3a4ff",
      "--afty-cura": "#22c55e",
      "--afty-raio": "4px",
      "--afty-raio-peq": "3px",
      "--afty-fonte": "ui-monospace, Consolas, monospace",
    },
  },
];

export const getPreset = (id) => PRESETS.find((p) => p.id === id) ?? PRESETS[0];

/**
 * A cor que o seletor mostra: o que o formulário mudou, senão o que o preset
 * diz, senão o padrão. A cadeia é a mesma que o `cssDasVars` escreve, então o
 * seletor nunca mostra uma cor diferente da que está na tela.
 */
export function corEfetiva(tema, token) {
  const t = normalizaTema(tema);
  return t.vars[token] ?? getPreset(t.presetId).vars[token] ?? PRESETS[0].vars[token] ?? "#000000";
}

/* ============================================================ */
/* O tema                                                        */
/* ============================================================ */

export function temaEmBranco() {
  return {
    presetId: "padrao",
    vars: {},                 // o que o formulário mudou, POR CIMA do preset
    fonte: null,
    raio: null,
    imagem: { url: "", opacidade: 0.25, encaixe: "cover", posicao: "center" },
    css: "",
    ligado: true,
  };
}

export function normalizaTema(bruto) {
  const base = temaEmBranco();
  if (!bruto || typeof bruto !== "object") return base;
  const img = bruto.imagem && typeof bruto.imagem === "object" ? bruto.imagem : {};
  return {
    ...base,
    ...bruto,
    presetId: getPreset(bruto.presetId).id,
    vars: bruto.vars && typeof bruto.vars === "object" ? bruto.vars : {},
    css: typeof bruto.css === "string" ? bruto.css : "",
    ligado: bruto.ligado !== false,
    imagem: {
      ...base.imagem,
      ...img,
      url: typeof img.url === "string" ? img.url : "",
      opacidade: Math.min(1, Math.max(0, Number(img.opacidade ?? base.imagem.opacidade) || 0)),
    },
  };
}

/**
 * O tema de uma ficha, na ordem: o que está GRAVADO NA CRIATURA, o que sobrou
 * na chave local (fichas temadas antes de 2026-08-05) e o padrão global.
 *
 * ⚠ O TEMA MORA NA CRIATURA desde 2026-08-05, a pedido do autor: *"quero mandar
 * minha ficha bonitinha para os outros"*. Ele viaja no export e no import de
 * graça, porque os dois copiam a criatura inteira. O risco que me fez começar
 * pela chave separada (o Salvar do criador apagar o tema) não existe: o
 * `update` do armazenamento faz MERGE, então um save que não conhece o campo
 * `aparencia` preserva o que já estava lá.
 */
export function carregarTema(creature, id) {
  if (creature?.aparencia) return normalizaTema(creature.aparencia);
  try {
    const proprio = localStorage.getItem(chaveDe(id));
    if (proprio) return normalizaTema(JSON.parse(proprio));
    const global = localStorage.getItem(CHAVE_GLOBAL);
    if (global) return normalizaTema(JSON.parse(global));
  } catch { /* modo privado, cota, JSON corrompido: cai no padrão */ }
  return temaEmBranco();
}

export function salvarTema(id, tema) {
  try {
    localStorage.setItem(chaveDe(id), JSON.stringify(tema));
    return true;
  } catch { return false; }
}

/** "Quero todas as minhas fichas assim." */
export function salvarTemaGlobal(tema) {
  try {
    localStorage.setItem(CHAVE_GLOBAL, JSON.stringify(tema));
    return true;
  } catch { return false; }
}

export function limparTema(id) {
  try { localStorage.removeItem(chaveDe(id)); } catch { /* nada a quebrar */ }
}

/* ============================================================ */
/* Do tema para o CSS                                            */
/* ============================================================ */

/**
 * A url da imagem, saneada. Tira o que quebraria a declaração e permitiria sair
 * do `url(...)` para escrever CSS por fora. Não é defesa contra atacante (o app
 * é local e sem backend), é defesa contra url colada com aspas no meio.
 */
const urlSegura = (u) => String(u ?? "").trim().replace(/["'()\\;{}\s]/g, "");

/** As variáveis do tema, como um bloco de CSS. Preset primeiro, formulário por cima. */
export function cssDasVars(tema) {
  const t = normalizaTema(tema);
  const linhas = [];
  const põe = (k, v) => { if (v) linhas.push(`  ${k}: ${v};`); };

  for (const [k, v] of Object.entries(getPreset(t.presetId).vars)) põe(k, v);
  for (const [k, v] of Object.entries(t.vars)) põe(k, v);
  põe("--afty-fonte", t.fonte);
  põe("--afty-raio", t.raio);

  const url = urlSegura(t.imagem.url);
  if (url) {
    põe("--afty-imagem", `url("${url}")`);
    põe("--afty-imagem-opacidade", String(t.imagem.opacidade));
    põe("--afty-imagem-encaixe", t.imagem.encaixe === "auto" ? "auto" : t.imagem.encaixe);
    põe("--afty-imagem-posicao", t.imagem.posicao || "center");
  }

  if (!linhas.length) return "";
  return `#afty-ficha {\n${linhas.join("\n")}\n}`;
}

/**
 * `@scope` isola o CSS do usuário na subárvore da Ficha. Chegou no Chrome, no
 * Safari e no Firefox em 2024. ⚠ Sem ele o CSS VAZA para a página inteira, e o
 * editor avisa em vez de fingir isolamento.
 */
export function escopoSuportado() {
  return typeof window !== "undefined" && typeof window.CSSScopeRule !== "undefined";
}

/**
 * Sanea o CSS livre. Duas remoções, e só duas:
 *
 *   • `@import` é a única regra que busca arquivo remoto por conta própria, e
 *     ninguém precisa dela para pintar uma ficha.
 *   • `</style` fecha o elemento e sai para o HTML.
 *
 * O resto passa. Isto NÃO é uma caixa de areia: quem escreve CSS na própria
 * ficha pode se atrapalhar sozinho, e é para isso que existem o interruptor de
 * desligar e o `?semcss=1`.
 */
export function saneiaCss(css) {
  return String(css ?? "")
    .replace(/@import[^;]*;?/gi, "")
    .replace(/<\/style/gi, "");
}

/** O bloco final, já escopado quando o navegador sabe escopar. */
export function cssDoUsuario(tema) {
  const t = normalizaTema(tema);
  if (!t.ligado) return "";
  const limpo = saneiaCss(t.css).trim();
  if (!limpo) return "";
  return escopoSuportado() ? `@scope (#afty-ficha) {\n${limpo}\n}` : limpo;
}

/** O tema mexeu em alguma coisa? Decide se o bote salva-vidas aparece. */
export const temCssLivre = (tema) => !!saneiaCss(tema?.css).trim();

/**
 * O PROMPT PARA A IA.
 *
 * Motivo (autor, 2026-08-05): quem quer a ficha bonita nem sempre sabe CSS, mas
 * hoje qualquer pessoa tem um Claude ou um ChatGPT à mão. O que falta a essa IA
 * é o CONTEXTO: ela não sabe que existe uma ficha do Afty, nem quais variáveis e
 * classes ela pode mirar, e sem isso chuta seletor e escreve CSS que não pega em
 * nada.
 *
 * Este texto entrega o contexto inteiro, e sai da MESMA fonte que a Ficha usa
 * (`TOKENS_DOC` e `CONTRATO_DE_CLASSES`), então ele nunca descreve uma variável
 * que deixou de existir.
 */
export function promptParaIA(tema) {
  const t = normalizaTema(tema);
  const atual = saneiaCss(t.css).trim();
  const tokens = TOKENS_DOC.map((x) => `  ${x.id}: ${x.valor};   /* ${x.oque} */`).join("\n");
  const classes = CONTRATO_DE_CLASSES.map((c) => `- \`${c.seletor}\` ${c.oque}`).join("\n");

  return `Você vai escrever CSS para personalizar uma ficha de RPG.

## O contexto

É a ficha de personagem do "Grimório do Afty", um sistema de RPG próprio. A página já existe e está
pronta: você NÃO escreve HTML nem JavaScript, só o CSS que muda a aparência dela.

O CSS que você escrever é injetado dentro de \`@scope (#afty-ficha) { ... }\`, então ele afeta só a
ficha e nada mais do site. Escreva os seletores normalmente, SEM repetir \`#afty-ficha\` na frente.

A ficha tem: um cabeçalho fixo no topo (nome, marcas, três barras de recurso e uma fileira de
defesas), uma barra de abas, e o corpo que troca por aba (Ações, Habilidades, Perícias). No canto
inferior direito fica um painel de rolagem de dados.

## O jeito CERTO de mudar cor

Quase tudo na ficha é pintado por VARIÁVEL CSS. Trocar a variável repinta de uma vez tudo que a usa.
Prefira SEMPRE isto a mirar classe por classe:

\`\`\`css
#afty-ficha {
${tokens}
}
\`\`\`

## Os seletores disponíveis

Estes nomes são um contrato e não mudam. Qualquer outra classe que você veja inspecionando a página
(as do Tailwind, por exemplo) pode sumir na próxima atualização, então não mire nelas.

${classes}

Atributos úteis: \`[data-afty-vital="pv"|"pe"|"alma"]\`, \`[data-afty-stat="defesa"|"cd"|"rd-geral"|...]\`,
\`[data-afty-aba="acoes"|"habilidades"|"pericias"]\`, \`[data-afty-tom="destaque"|"aviso"|"dano"|"cura"]\`,
\`[data-afty-nivel="baixo"|"critico"]\` (nas barras, quando o recurso está baixo).

## Regras

1. Responda SÓ com o CSS, sem explicação em volta e sem cerca de markdown.
2. \`@import\` é removido automaticamente, então fonte externa não funciona. Use as famílias que já
   estão no sistema do usuário.
3. Imagem e gif entram por URL pública: \`background-image: url("https://...")\`. Não use data URI,
   que estoura o armazenamento do navegador.
4. Não esconda a ficha inteira, e não mexa em \`position\` do cabeçalho: ele é fixo de propósito.
5. Cuide do CONTRASTE. Se escurecer o fundo, clareie \`--afty-texto\` e \`--afty-texto-suave\` junto.
6. Não use \`!important\`: este CSS já entra por último e vence tudo.
7. Mantenha o resultado abaixo de 64 KB.

## O que eu quero

(Descreva aqui o visual que você quer. Por exemplo: "um tema de vitral gótico, roxo e dourado, com
bordas grossas e fonte serifada".)

## O CSS que já está na minha ficha

${atual ? `\`\`\`css\n${atual}\n\`\`\`` : "(nenhum, estou começando do zero)"}
`;
}

/**
 * As classes que o CSS do usuário pode mirar. É um CONTRATO: estes nomes não
 * mudam. Classe do Tailwind não é API, e quem mirar nela assume o risco.
 */
export const CONTRATO_DE_CLASSES = [
  { seletor: "#afty-ficha", oque: "a raiz" },
  { seletor: ".afty-cabecalho", oque: "a faixa fixa do topo" },
  { seletor: ".afty-nome", oque: "o nome da criatura" },
  { seletor: ".afty-chip", oque: "as marcas (Tipo, Patamar, ND)" },
  { seletor: ".afty-vital", oque: "a caixa de um recurso" },
  { seletor: "[data-afty-vital=\"pv\"]", oque: "a de Vida (pe, alma)" },
  { seletor: ".afty-vital-numero", oque: "o número grande" },
  { seletor: ".afty-vital-barra", oque: "o preenchimento da barra" },
  { seletor: ".afty-stat", oque: "cada defesa do cabeçalho" },
  { seletor: "[data-afty-stat]", oque: "uma defesa nomeada" },
  { seletor: ".afty-abas / .afty-aba", oque: "a navegação" },
  { seletor: ".afty-card", oque: "um cartão do corpo" },
  { seletor: ".afty-linha", oque: "uma linha de lista" },
  { seletor: ".afty-valor", oque: "todo número derivado" },
  { seletor: ".afty-texto", oque: "o texto do livro" },
  { seletor: ".afty-fontes-raiz", oque: "o painel de fontes" },
  { seletor: ".afty-log", oque: "o painel de rolagens" },
];
