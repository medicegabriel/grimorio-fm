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
t("a reescrita não cobre /assets", VERCEL.rewrites?.[0]?.source, "/((?!assets/).*)");

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
