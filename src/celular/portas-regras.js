/* ============================================================
   AS PORTAS DE PRÉ-CARGA (2026-11-26, fila "Carregamento")
   ============================================================
   Puras e sem import. O plugin do `vite.config.js` (`portas-plugin.js`) monta as listas com `portasDoGrafo` e grava no
   `index.html` do build, e o `asserts/t-pre-carga.mjs` testa sobre um grafo de mentira.

   Uma PORTA é a lista de arquivos que uma tela sob demanda pede para abrir: o pedaço dela e o que ele importa de forma estática
   (JS e CSS), menos o que já chegou antes dela. Quem pré-carrega é `pre-carga.js`, com `<link rel="prefetch">`: baixa e não
   executa. Os nomes saem do build, nunca escritos à mão.

   - `app`: o `App.jsx`, menos a entrada. A Central (`/`) pré-carrega, porque os atalhos dela recarregam a página.
   - `ficha`: a Ficha G2, com o motor (`afty-derive`) e os pedaços dela, menos a entrada e o `app`. A lista de fichas pré-carrega.

   ⚠ Só os imports ESTÁTICOS entram. Os `import()` de dentro da tela são outras telas, e baixá-los seria pré-carregar o que a
   pessoa talvez nunca abra.
   ============================================================ */

/** O módulo de cada porta (o caminho do módulo de fachada do pedaço), e as portas que já chegaram antes dela. */
export const PORTAS_DE_PRE_CARGA = [
  { id: "app", modulo: /src\/App\.jsx$/, depoisDe: [] },
  { id: "ficha", modulo: /src\/systems\/afty\/ficha\/AftyFichaG2\.jsx$/, depoisDe: ["app"] },
];

/** O id do bloco de dados no `index.html`. */
export const ID_DAS_PORTAS = "fm-portas";

const normal = (m) => String(m ?? "").replace(/\\/g, "/");
const proibido = (arquivo) => /\.map$/.test(arquivo);

/**
 * O fecho estático de um pedaço, na ordem em que aparece: o próprio, o CSS dele e, recursivamente, os imports estáticos.
 * `grafo` é o de `grafoDoBundle` (`sw-plugin.js`): `{ [arquivo]: { modulo, entrada, imports, dinamicos, css, arquivos } }`.
 */
export function fechoEstatico(grafo, arquivo) {
  const saida = new Set();
  const vistos = new Set();
  const andar = (a) => {
    if (!a || vistos.has(a)) return;
    vistos.add(a);
    const no = grafo[a];
    if (!no) return;
    if (!proibido(a)) saida.add(a);
    for (const c of no.css ?? []) if (!proibido(c)) saida.add(c);
    for (const i of no.imports ?? []) andar(i);
  };
  andar(arquivo);
  return saida;
}

/** O pedaço cujo módulo de fachada casa com `re`, ou null. */
export function pedacoDoModulo(grafo, re) {
  return Object.keys(grafo).find((a) => re.test(normal(grafo[a]?.modulo))) ?? null;
}

/**
 * As listas de cada porta, com caminhos absolutos ("/assets/App-abc.js"). Porta sem pedaço no build sai vazia (o plugin avisa).
 * A entrada (todo pedaço `entrada`) sai de todas, e cada porta tira também o fecho das que vêm antes dela (`depoisDe`).
 */
export function portasDoGrafo(grafo = {}, portas = PORTAS_DE_PRE_CARGA) {
  const naEntrada = new Set();
  for (const [a, no] of Object.entries(grafo)) if (no.entrada) for (const x of fechoEstatico(grafo, a)) naEntrada.add(x);
  const fechos = {};
  const saida = {};
  for (const porta of portas) {
    const pedaco = pedacoDoModulo(grafo, porta.modulo);
    fechos[porta.id] = pedaco ? fechoEstatico(grafo, pedaco) : new Set();
    const antes = new Set(naEntrada);
    for (const id of porta.depoisDe ?? []) for (const x of fechos[id] ?? []) antes.add(x);
    saida[porta.id] = [...fechos[porta.id]].filter((x) => !antes.has(x)).map((x) => `/${x}`);
  }
  return saida;
}

/** O bloco que vai no `<head>`: dados, nunca código, para não depender de script inline. */
export function blocoDasPortas(portas) {
  const json = JSON.stringify(portas).replace(/</g, "\\u003c");
  return `<script type="application/json" id="${ID_DAS_PORTAS}">${json}</script>`;
}

/** O `index.html` com o bloco antes do `</head>`, trocando um bloco anterior se houver. */
export function htmlComPortas(html, portas) {
  const bloco = blocoDasPortas(portas);
  const anterior = new RegExp(`<script type="application/json" id="${ID_DAS_PORTAS}">[\\s\\S]*?</script>`);
  if (anterior.test(html)) return html.replace(anterior, () => bloco);
  return html.replace("</head>", () => `  ${bloco}\n  </head>`);
}
