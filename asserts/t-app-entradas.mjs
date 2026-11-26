/* As portas de entrada do motor depois das telas sob demanda (app de celular, etapa E3, 2026-11-19).

   Até a E3 o navegador entrava no motor pelo criador do Afty, importado na abertura do App.jsx. Com as telas pesadas sob
   demanda, a primeira porta passou a ser a lista de Encontros (`usar-lista-encontros`, depois `modelo` e `motores`), e um
   import a menos muda a ordem em que os módulos do ciclo são avaliados. Foi assim que o app caiu em tela branca em
   2026-09-02 sem nenhum assert ver, porque todos entram por `afty-derive.js`.

   Este arquivo importa cada porta SOZINHA, em processo próprio, do jeito que o navegador a encontra primeiro, e reprova se
   algum módulo do ciclo for lido antes de existir. Confere também as telas sob demanda do App e o compêndio só no `/`.
   A prova de verdade continua sendo abrir cada tela a frio no navegador (CLAUDE.md). */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};
const lê = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

const SHIM = "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}";
const PORTAS = [
  "../src/systems/afty/encontros/usar-lista-encontros.js",
  "../src/systems/afty/encontros/modelo.js",
  "../src/systems/afty/encontros/motores/index.js",
  "../src/systems/afty/encontros/listas.js",
  "../src/nuvem/sala-fechamento.js",
  "../src/celular/usar-compendio.js",
];
for (const porta of PORTAS) {
  const url = new URL(porta, import.meta.url).href;
  const codigo = `import { register } from "node:module";
register(${JSON.stringify(SHIM)}, ${JSON.stringify(import.meta.url)});
await import(${JSON.stringify(url)});
console.log("PORTA OK");`;
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", codigo], { encoding: "utf8", timeout: 120000 });
  const saida = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  const erro = saida.split("\n").find((l) => /Error|before initialization|is not defined|is not a function/.test(l)) ?? "";
  t(`a porta ${porta.replace("../src/", "")} abre sozinha`, r.status === 0 && saida.includes("PORTA OK") ? "ok" : erro.trim() || `saída ${r.status}`, "ok");
}

/* As telas sob demanda do App e da Ficha. */
const APP = lê("../src/App.jsx");
for (const tela of ["CombatTracker", "CreatureBuilder", "AftyCreatureBuilder", "TemplateLibrary", "ListaDeEncontros", "EncontroTela"]) {
  t(`${tela} é sob demanda`, new RegExp(`const ${tela} = telaSobDemanda\\(`).test(APP), true);
  t(`${tela} não é import de abertura`, new RegExp(`^import ${tela} from`, "m").test(APP), false);
}
t("o compêndio não é import de abertura", /from "\.\/fm-compendium"/.test(APP), false);
t("o compêndio só no /", APP.includes("const precisaCompendio = rotaId === null && !rotaSala;"), true);
t("o fechamento da Sala é sob demanda", /^import \{ recuperarSalasFechadas \}/m.test(APP), false);
t("as telas esperam com o Carregando", APP.includes("<React.Suspense fallback={<Carregando />}>"), true);
const FICHA = lê("../src/systems/afty/ficha/AftyFicha.jsx");
t("a Ficha clássica é sob demanda", FICHA.includes('telaSobDemanda(() => import("./AftyFichaClassica"))'), true);
t("e não é import de abertura", /^import AftyFichaClassica/m.test(FICHA), false);

/* A cópia do teste de id do compêndio, para quem não o baixou. */
t("o id do compêndio se reconhece igual nas duas",
  [lê("../src/fm-compendium.js").includes('id.startsWith("builtin_")'), lê("../src/celular/usar-compendio.js").includes('id.startsWith("builtin_")')],
  [true, true]);

/* O pedaço que sumiu num deploy vira "Nova Versão", e o servidor responde 404 de verdade. */
t("sob demanda tem rede para o pedaço que não chega", lê("../src/celular/sob-demanda.js").includes("catch(() => ({ default: TelaNovaVersao }))"), true);
const VERCEL = JSON.parse(lê("../vercel.json"));
t("os arquivos com hash ficam em cache longo",
  VERCEL.headers?.find((h) => h.source === "/assets/(.*)")?.headers?.[0]?.value, "public, max-age=31536000, immutable");
const rewrite = new RegExp(`^${VERCEL.rewrites[0].source}$`);
t("a reescrita cobre a tela e preserva assets e API",
  ["/Jogador/balanceamento", "/assets/chunk.js", "/api/balanceamento/relatorio"].map((path) => rewrite.test(path)),
  [true, false, false]);

/* 2026-11-20: o ficha.css entra na abertura. Sob demanda ele chegava DEPOIS do CSS do Encontro na Sala, e
   `.afty-ficha { min-height: 100dvh }` vencia a faixa da luta (mesma especificidade, ganha a ordem). */
t("o ficha.css entra pela Ficha da abertura", lê("../src/systems/afty/ficha/AftyFicha.jsx").includes('import "./ficha.css";'), true);
t("e a Ficha entra no App por import direto", /^import AftyFicha from "\.\/systems\/afty\/ficha\/AftyFicha";/m.test(lê("../src/App.jsx")), true);

/* ---------- Etapa E10 (2026-11-20): o motor fora da abertura ----------
   A lista de Encontros chega por uma ponte sob demanda. O grafo estático do bootstrap e das duas telas de entrada não pode alcançar
   o motor: se alcançar, ele volta inteiro (cerca de 1,5 MB) para o pacote de abertura de toda rota. */
const { existsSync, statSync } = await import("node:fs");
const { fileURLToPath } = await import("node:url");
const path = await import("node:path");
const resolver = (de, s) => {
  if (!s.startsWith(".")) return null;
  const b = path.resolve(path.dirname(de), s);
  return [b, `${b}.js`, `${b}.jsx`].find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
};
const raizSrc = fileURLToPath(new URL("../src/", import.meta.url));
const MAIN = lê("../src/main.jsx");
t("Central de Jogo e Grimório são entradas separadas", [
  MAIN.includes("import('./home/CentralDeJogo.jsx')"), MAIN.includes("import('./App.jsx')"),
], [true, true]);
const alcancados = new Set(["main.jsx", "App.jsx", "home/CentralDeJogo.jsx"].map((f) => path.join(raizSrc, f)));
for (const f of alcancados) {
  if (!/\.jsx?$/.test(f)) continue;
  const texto = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  for (const m of texto.matchAll(/^\s*(?:import|export)\s[^;]*?from\s*["']([^"']+)["']|^\s*import\s*["']([^"']+)["']/gm)) {
    const r = resolver(f, m[1] ?? m[2]);
    if (r) alcancados.add(r);
  }
}
const relDoSrc = (x) => path.relative(raizSrc, x).split(path.sep).join("/");
const naAbertura = [...alcancados].map(relDoSrc);
t("a abertura não alcança o motor", naAbertura.filter((x) => /afty-derive|afty-habilidades|encontros\/modelo|encontros\/motores|ficha\/ficha-sessao|usar-lista-encontros/.test(x)), []);
t("a abertura chega à ponte só sob demanda", [naAbertura.includes("celular/usar-lista-adiada.js"), naAbertura.includes("systems/afty/encontros/PonteDaLista.jsx")], [true, false]);
const ADIADA = lê("../src/celular/usar-lista-adiada.js");
t("a ponte é import sob demanda", ADIADA.includes('React.lazy(() => import("../systems/afty/encontros/PonteDaLista"))'), true);
const { listaDeEspera } = await import(new URL("../src/celular/usar-lista-adiada.js", import.meta.url).href);
const GANCHO = lê("../src/systems/afty/encontros/usar-lista-encontros.js").replace(/\r\n/g, "\n");
// O `return { ... }` do fim do gancho, com as chaves que ele entrega ao App.
const doGancho = GANCHO.slice(GANCHO.lastIndexOf("  return {\n") + 11, GANCHO.lastIndexOf("\n  };"))
  .split(/,/).map((x) => x.replace(/:[\s\S]*$/, "").trim()).filter(Boolean).sort();
t("a lista de espera tem as mesmas chaves do gancho, mais o pronto", Object.keys(listaDeEspera("eradeouro")).filter((k) => k !== "pronto").sort(), doGancho);
t("a lista de espera não grava nada", [listaDeEspera("x").pronto, listaDeEspera("x").criar(), listaDeEspera("x").encontros], [false, null, []]);
t("as telas de Encontro esperam a lista", [APP.includes("if (!listaPronta) return <Carregando />;"), APP.includes("encounters: () => (!listaPronta ? <Carregando /> :")], [true, true]);
t("o fechamento da Sala espera a lista de verdade", APP.includes("if (rotaSala || !listaPronta) return undefined;"), true);
t("um Encontro guardado no histórico reabre antes de a lista chegar", APP.includes('if (t.name === "encounter") return !listaEncontros.pronto ||'), true);

/* ---------- 2026-11-21: POR QUAL MÓDULO CADA PORTA SOB DEMANDA ENTRA NO CICLO ----------
   Desde a E10 a abertura não alcança o motor, então a primeira tela sob demanda que o navegador baixa decide por onde o ciclo
   do motor (CLAUDE.md, "Ordem de módulos") é avaliado. A Ficha G2 entrava pelo `afty-habilidades` (por ui/armas-transformaveis,
   ficha-sessao e afty-concessao), o corpo do `afty-combate` rodava antes do dele, e no `npm run dev` a Ficha e depois o criador
   caíam com "Cannot access 'POSTURAS_DE_COMBATE' before initialization". O build passava porque o Rolldown junta tudo num pedaço.

   As PORTAS acima são `.js` e carregam no Node. As telas são `.jsx`, então aqui o caminho é em duas partes: o grafo estático acha,
   para cada `import()` do `src/`, o PRIMEIRO módulo do ciclo que a avaliação (busca em profundidade, na ordem dos imports)
   alcança, e cada um desses módulos de entrada carrega sozinho num processo limpo. É o mesmo que o navegador faz, porque o que vem
   antes do ciclo no caminho termina de avaliar inteiro e não muda a ordem lá dentro. */
const fs = await import("node:fs");
const todosDoSrc = [];
const varrer = (dir) => {
  for (const nome of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, nome.name);
    if (nome.isDirectory()) varrer(p);
    else if (/\.jsx?$/.test(nome.name)) todosDoSrc.push(p);
  }
};
varrer(raizSrc);
const textoSemComentario = (f) => readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
const estaticos = new Map(todosDoSrc.map((f) => [f, [...textoSemComentario(f).matchAll(
  /^\s*(?:import|export)\s[^;]*?from\s*["']([^"']+)["']|^\s*import\s*["']([^"']+)["']/gm,
)].map((m) => resolver(f, m[1] ?? m[2])).filter(Boolean)]));
const portasSobDemanda = new Set(todosDoSrc.flatMap((f) => [...textoSemComentario(f).matchAll(/import\(\s*["'](\.[^"']+)["']\s*\)/g)]
  .map((m) => resolver(f, m[1])).filter(Boolean)));
// O ciclo é o componente forte do `afty-habilidades`: quem ele alcança e que o alcança de volta.
const alcanca = (de) => {
  const vistos = new Set([de]);
  for (const f of vistos) for (const d of estaticos.get(f) ?? []) vistos.add(d);
  return vistos;
};
const HABILIDADES = path.join(raizSrc, "systems", "afty", "afty-habilidades.js");
const doCiclo = new Set([...alcanca(HABILIDADES)].filter((f) => alcanca(f).has(HABILIDADES)));
const entradaNoCiclo = (porta) => {
  const vistos = new Set();
  const visita = (f) => {
    if (doCiclo.has(f)) return f;
    if (vistos.has(f)) return null;
    vistos.add(f);
    for (const d of estaticos.get(f) ?? []) { const achou = visita(d); if (achou) return achou; }
    return null;
  };
  return visita(porta);
};
const entradas = new Map();
for (const porta of portasSobDemanda) {
  const e = entradaNoCiclo(porta);
  if (e) entradas.set(relDoSrc(e), [...(entradas.get(relDoSrc(e)) ?? []), relDoSrc(porta)]);
}
t("o ciclo do motor foi achado no grafo", ["afty-habilidades", "afty-equipamentos", "afty-efeitos", "afty-combate"]
  .every((m) => doCiclo.has(path.join(raizSrc, "systems", "afty", `${m}.js`))), true);
t("o criador e a Ficha G2 são portas que entram no ciclo",
  [...entradas.values()].flat().filter((p) => /AftyCreatureBuilder\.jsx$|ficha\/AftyFichaG2\.jsx$/.test(p)).sort(),
  ["systems/afty/AftyCreatureBuilder.jsx", "systems/afty/ficha/AftyFichaG2.jsx"]);
for (const [entrada, portas] of entradas) {
  const codigo = `import { register } from "node:module";
register(${JSON.stringify(SHIM)}, ${JSON.stringify(import.meta.url)});
await import(${JSON.stringify(new URL(`../src/${entrada}`, import.meta.url).href)});
console.log("PORTA OK");`;
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", codigo], { encoding: "utf8", timeout: 120000 });
  const saida = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  const erro = saida.split("\n").find((l) => /Error|before initialization|is not defined|is not a function/.test(l)) ?? "";
  t(`o ciclo abre por ${entrada} (porta de ${portas.length > 2 ? `${portas.slice(0, 2).join(", ")} e mais ${portas.length - 2}` : portas.join(", ")})`,
    r.status === 0 && saida.includes("PORTA OK") ? "ok" : erro.trim() || `saída ${r.status}`, "ok");
}
console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
