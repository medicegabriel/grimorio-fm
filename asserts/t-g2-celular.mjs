/* O app de celular, etapa E5 (2026-11-19): a Ficha G2 no telefone.

   1. Os atalhos do painel de um recurso (`atalhosDoRecurso`): -1 -5 -10 +1 +5, com o verbo de cada recurso (Dano e Cura na Vida e na Alma, Gastar e
      Recuperar na Energia, no Preparo e no recurso próprio). O verbo é o mesmo dos botões do painel, então nenhuma regra muda.
   2. "Nada some do cabeçalho parado" (afty-ficha-final.md §19), que até aqui não tinha teste: nenhuma regra de largura de celular do
      `efeitos-g2.css` esconde uma peça do cabeçalho. O que pode sumir é enfeite (o ícone das espadas, a legenda "Rolagem").
   3. As ligações: a barra de rolagens compacta na linha das abas, a folha de baixo do recurso com os atalhos, e a folha que não abre o teclado. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const url = (p) => new URL(p, import.meta.url);
const lê = (p) => readFileSync(url(p), "utf8");
await import(url("../src/systems/afty/afty-derive.js").href);
const L = await import(url("../src/systems/afty/ficha/efeitos/pecas-logica.js").href);

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ---------- 1. os atalhos ---------- */
const MENOS = "−";
t("os cinco atalhos", L.ATALHOS_DO_RECURSO, [-1, -5, -10, 1, 5]);
t("rótulos com o sinal de menos tipográfico", L.atalhosDoRecurso("pv").map((a) => a.rotulo), [`${MENOS}1`, `${MENOS}5`, `${MENOS}10`, "+1", "+5"]);
t("quantidade sempre positiva", L.atalhosDoRecurso("pv").map((a) => a.n), [1, 5, 10, 1, 5]);
t("Vida: Dano e Cura", L.atalhosDoRecurso("pv").map((a) => a.verbo), ["Dano", "Dano", "Dano", "Cura", "Cura"]);
t("Alma: Dano e Cura", L.atalhosDoRecurso("alma").map((a) => a.verbo), ["Dano", "Dano", "Dano", "Cura", "Cura"]);
for (const tipo of ["pe", "preparo", "proprio"]) {
  t(`${tipo}: Gastar e Recuperar`, L.atalhosDoRecurso(tipo).map((a) => a.verbo), ["Gastar", "Gastar", "Gastar", "Recuperar", "Recuperar"]);
}

/* ---------- 2. nada some do cabeçalho ---------- */
const CSS = lê("../src/systems/afty/ficha/efeitos/efeitos-g2.css");
const PECAS_DO_CABECALHO = ["e-moldura", "e-retrato", "e-voltar", "e-ident", "e-nome", "e-linhagem", "e-recursos", "m-medidor", "e-controles", "e-stats", "e-mais", "e-agora", "e-combate", "e-rodada", "e-proxima", "f-acesso", "afty-log", "afty-log-gatilho"];
const ENFEITES = [/\.e-combate > svg/, /\.afty-log-modos::before/, /\.e-agora-rotulo/, /\.afty-log-topo > svg/, /\.e-fina-nome/];
/* Cada bloco @media de largura máxima (o celular), com as regras de dentro. */
const blocos = [];
for (const m of CSS.matchAll(/@media \(max-width: (\d+)px\)[^{]*\{/g)) {
  let i = m.index + m[0].length;
  let fundo = 1;
  const ini = i;
  while (fundo && i < CSS.length) { if (CSS[i] === "{") fundo++; else if (CSS[i] === "}") fundo--; i++; }
  blocos.push({ largura: Number(m[1]), texto: CSS.slice(ini, i - 1) });
}
t("há blocos de celular no CSS", blocos.filter((b) => b.largura <= 720).length > 5, true);
const escondidas = [];
for (const b of blocos.filter((x) => x.largura <= 720)) {
  for (const regra of b.texto.split("}")) {
    if (!/display:\s*none/.test(regra)) continue;
    const seletor = regra.split("{")[0].replace(/\/\*[\s\S]*?\*\//g, "").trim();
    if (ENFEITES.some((re) => re.test(seletor))) continue;
    if (PECAS_DO_CABECALHO.some((c) => new RegExp(`\\.${c}(?![\\w-])`).test(seletor) && !/\.e-layout\[data-painel\]/.test(seletor))) escondidas.push(seletor);
  }
}
t("nenhuma peça do cabeçalho some no celular", escondidas, []);
const e5 = CSS.slice(CSS.indexOf("O CABEÇALHO NO CELULAR (etapa E5"));
t("o bloco da E5 existe", e5.length > 500, true);
t("nome e linhagem numa linha com reticências", [/\.e-nome[^}]*white-space: nowrap[^}]*text-overflow: ellipsis/.test(e5), /\.e-linhagem \{[^}]*white-space: nowrap[^}]*text-overflow: ellipsis/.test(e5)], [true, true]);
t("número do recurso de 22 px", /\.afty-vital-numero \{ font-size: 22px/.test(e5), true);
t("atalhos de 48 px", /\.m-pv-atalho \{[^}]*min-height: 48px/.test(e5), true);
t("o campo da folha tem 16 px (sem zoom no iPhone)", /\.e-folha-vital \.m-campo-num \{ font-size: 16px/.test(e5), true);
t("o botão das rolagens tem 44 px", /\.afty-log-gatilho \{[^}]*min-height: 44px[^}]*min-width: 44px/.test(e5), true);

/* ---------- 3. as ligações ---------- */
const ROL = lê("../src/systems/afty/ficha/PainelDeRolagens.jsx");
const G2 = lê("../src/systems/afty/ficha/AftyFichaG2.jsx");
const CAB = lê("../src/systems/afty/ficha/efeitos/CabecalhoG2.jsx");
const PECAS = lê("../src/systems/afty/ficha/efeitos/pecas.jsx");
const FOLHA = lê("../src/celular/FolhaInferior.jsx");
t("a barra compacta existe e guarda o modo e o histórico", [ROL.includes("if (compacto)"), ROL.includes('className="afty-botao afty-log-gatilho"'), (ROL.match(/<Modos /g) ?? []).length], [true, true, 2]);
t("a Ficha G2 liga a barra compacta pelo celular", [G2.includes("const celular = useCelular();"), G2.includes("compacto={celular}")], [true, true]);
t("a clássica segue com a barra larga", /<PainelDeRolagens[^>]*compacto/.test(lê("../src/systems/afty/ficha/AftyFichaClassica.jsx")), false);
t("no celular o recurso abre na folha de baixo com atalhos", [CAB.includes("{vital && !celular && ("), CAB.includes("<PainelVital tipo={vital.tipo} m={m} onFechar={fechaVital} atalhos />")], [true, true]);
t("a folha vai para dentro da Ficha (o tema vale)", CAB.includes('document.getElementById("afty-ficha")') && CAB.includes('classe="e-g2 e-portal e-folha-vital"'), true);
t("os atalhos usam os verbos do painel", [PECAS.includes("principal(a.n)"), PECAS.includes("volta(a.n)")], [true, true]);
t("a folha foca a si mesma, não o campo (D-88)", [FOLHA.includes("painel.current?.focus({ preventScroll: true })"), /autoFocus/.test(PECAS.slice(PECAS.indexOf("export function PainelVital")))], [true, false]);
/* A parte 2 (2026-11-19): a faixa fina abre a folha, o palco mede pelo cabeçalho recolhido. */
const FINA = lê("../src/systems/afty/ficha/efeitos/FinaG2.jsx");
t("os números da faixa fina são botões que pedem a folha", [FINA.includes("onClick={() => onAbrir(r.tipo)}"), G2.includes("onAbrir={(tipo) => setPedidoVital({ tipo, vez: Date.now() })}"), G2.includes("pedidoVital={pedidoVital}")], [true, true, true]);
t("o cabeçalho atende o pedido só no celular", [CAB.includes("if (pedidoVital !== pedidoVisto) {"), CAB.includes("if (pedidoVital && celular) setVital({ tipo: pedidoVital.tipo, ancora: null });")], [true, true]);
t("os botões da faixa fina têm 44 px", [/\.e-fina\[data-visivel\] \{ height: 44px/.test(e5), /button\.e-fina-rec \{[^}]*min-height: 44px[^}]*min-width: 44px/.test(e5)], [true, true]);
t("o palco do celular mede pelo cabeçalho recolhido", [G2.includes('"--afty-ficha-topo-recolhido"'), /\.e-area \{ height: calc\(100dvh - var\(--afty-ficha-topo-recolhido/.test(e5)], [true, true]);
t("sem travessão nos arquivos da etapa", [ROL, CAB, PECAS, FOLHA, FINA, e5].some((s) => new RegExp("\\u2014").test(s)), false);

if (bad.length) {
  console.log(bad.join("\n"));
  console.log(`\n${bad.length} FALHARAM, ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
