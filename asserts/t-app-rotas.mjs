/* O app de celular, etapa E1 (2026-11-19): o título de cada rota e a rota de cada grupo da Sala.

   1. O `index.html` põe o título da rota ANTES do React, por um script inline. As expressões dele precisam casar com as do
      `App.jsx` e do `era-de-ouro.js` (é a rota que decide o grimório), então este arquivo roda o script com um `location`
      e um `document` de mentira e confere as duas fontes como texto.
   2. A Sala volta para a rota do grupo dela e o Editar abre a mesma rota (`rotaDoGrupo`). Até aqui era sempre `/Player`, e a
      ficha de um jogador da Guilda não existe lá. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const lê = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const D = await import(new URL("../src/nuvem/sala-ui/sala-ui-dados.js", import.meta.url).href);
const { caminhoDe, lerCaminho } = await import("../src/systems/afty/encontros/rota-encontros.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ---------- 1. o título por rota ---------- */
const HTML = lê("../index.html");
const script = HTML.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1] ?? "";
const tituloEm = (pathname) => {
  const document = { title: "Grimório F&M" };
  new Function("location", "document", script)({ pathname }, document);
  return document.title;
};
t("o título padrão saiu do Vite", /<title>Grimório F&amp;M<\/title>/.test(HTML), true);
t("a cor de tema é o fundo do site", HTML.includes('<meta name="theme-color" content="#060910" />'), true);
t("raiz", tituloEm("/"), "Grimório F&M");
t("Era de Ouro", ["/EraDeOuro", "/eradeouro/", "/ERADEOURO"].map(tituloEm), ["Era de Ouro", "Era de Ouro", "Era de Ouro"]);
t("Jogador", ["/Player", "/player/", "/Jogador/Encontros"].map(tituloEm), Array(3).fill("Ficha de Jogador"));
t("Afty", ["/Afty", "/afty/"].map(tituloEm), ["Grimório Afty", "Grimório Afty"]);
t("Eclesiastes", ["/Eclesiastes", "/eclesiastes/Encontros/uma-luta"].map(tituloEm), ["Eclesiastes", "Eclesiastes"]);
t("Sala", ["/Sala/ABC123", "/sala/nova"].map(tituloEm), ["Sala", "Sala"]);
t("Comunidade", ["/Comunidade", "/comunidade/"].map(tituloEm), Array(2).fill("Comunidade | fichafm"));
t("rota desconhecida fica no padrão", ["/foo", "/EraDeOuro/x"].map(tituloEm), ["Grimório F&M", "Grimório F&M"]);

const APP = lê("../src/App.jsx");
t("a rota é lida do prefixo", ["/Afty", "/Player", "/Jogador", "/EraDeOuro", "/Eclesiastes", "/", "/Criatura"].map((p) => lerCaminho(p)?.rota),
  ["afty", "player", "player", "eradeouro", "eclesiastes", null, null]);
t("o link antigo tem caminho canônico", caminhoDe(lerCaminho("/Player/Encontros").rota, lerCaminho("/Player/Encontros").tela), "/Jogador/Encontros");
t("o encontro de Eclesiastes preserva o ID", lerCaminho("/Eclesiastes/Encontros/A%2FB").tela,
  { name: "encounter", creatureId: null, encounterId: "A/B" });
t("a URL codifica o ID", caminhoDe("eclesiastes", { name: "encounter", encounterId: "A/B" }), "/Eclesiastes/Encontros/A%2FB");
t("Sala e caminho desconhecido ficam fora das bibliotecas", ["/Sala/ABC123", "/EraDeOuro/x"].map(lerCaminho), [null, null]);
t("o script não tem travessão", new RegExp("\\u2014").test(script), false);

/* ---------- o esqueleto de abertura (2026-11-26) ----------
   O segundo script do index.html escolhe o desenho antes do primeiro quadro. Ele lê o history.state.fm por conta própria,
   porque roda antes de qualquer módulo, e por isso é conferido aqui contra os dois módulos que o App usa: o `lerEntrada` de
   pilha.js e o `lerCaminho` de rota-encontros.js. Se um mudar e o script não acompanhar, este arquivo reprova. */
const PILHA = await import(new URL("../src/celular/pilha.js", import.meta.url).href);
const { CONSULTA_CELULAR, PILHA_LIGADA } = await import(new URL("../src/celular/pwa-config.js", import.meta.url).href);
const esqueleto = [...HTML.matchAll(/<script>\s*([\s\S]*?)<\/script>/g)].map((x) => x[1]).filter((x) => x.includes('"data-fm-"'));
t("há um script do esqueleto, e ele não é o do título", [esqueleto.length, esqueleto[0] !== script], [1, true]);
const consultas = [];
const marcasEm = (pathname, { state = null, celular = false, hostname = "fichafm.com.br" } = {}) => {
  const atributos = {};
  const document = { documentElement: { setAttribute: (k, v) => { atributos[k.replace("data-fm-", "")] = v; } } };
  const window = { matchMedia: (q) => { consultas.push(q); return { matches: celular }; } };
  new Function("location", "document", "window", "history", esqueleto[0] ?? "")({ pathname, hostname }, document, window, { state });
  return atributos;
};
const LISTA_PUBLICA = (rota, alto) => ({ rota, esq: "lista", paleta: "central", barra: "publica", atual: rota, ...(alto ? { card: "alto" } : {}) });
const LISTA_PRIVADA = (rota, alto) => ({ rota, esq: "lista", paleta: "privada", ...(alto ? { card: "alto" } : {}) });
const NEUTRO = (rota) => ({ rota, esq: "neutro" });
const NEUTRO_ENCONTROS = (rota) => ({ rota, esq: "neutro", paleta: "central", barra: "publica", atual: "encontros" });
const CENTRAL = (atual) => ({ esq: "neutro", paleta: "central", barra: "central", atual });
t("as listas públicas", ["/Jogador", "/player/", "/Criatura"].map((p) => marcasEm(p)),
  [LISTA_PUBLICA("jogador"), LISTA_PUBLICA("jogador"), LISTA_PUBLICA("criatura", true)]);
t("as listas privadas, sem barra do site", ["/Afty", "/Eclesiastes", "/EraDeOuro"].map((p) => marcasEm(p)),
  [LISTA_PRIVADA("grimorio", true), LISTA_PRIVADA("eclesiastes"), LISTA_PRIVADA("guilda")]);
t("a Central e a Comunidade têm a barra", ["/", "/Comunidade", "/comunidade/"].map((p) => marcasEm(p)),
  [CENTRAL("inicio"), CENTRAL("comunidade"), CENTRAL("comunidade")]);
t("o / do endereço antigo é a lista de Criatura", marcasEm("/", { hostname: "grimorio-fm.vercel.app" }), LISTA_PUBLICA("criatura", true));
t("a Sala fica sem esqueleto", ["/Sala/ABC123", "/sala/nova"].map((p) => marcasEm(p)), [{}, {}]);
t("a Guilda no celular fica sem esqueleto", ["/EraDeOuro", "/eradeouro/Encontros"].map((p) => marcasEm(p, { celular: true })), [{}, {}]);
t("no celular as outras rotas seguem com ele", marcasEm("/Jogador", { celular: true }), LISTA_PUBLICA("jogador"));
t("a consulta de celular é a do app", [...new Set(consultas)], [CONSULTA_CELULAR]);
t("os Encontros ficam neutros, com a barra só no site público",
  ["/Jogador/Encontros", "/Encontros/abc", "/Afty/Encontros"].map((p) => marcasEm(p)),
  [NEUTRO_ENCONTROS("jogador"), NEUTRO_ENCONTROS("criatura"), NEUTRO("grimorio")]);
t("caminho fora das bibliotecas fica neutro", ["/Jogador/balanceamento", "/foo"].map((p) => marcasEm(p)), [{ esq: "neutro" }, { esq: "neutro" }]);

const gravado = (tela, extra = {}) => ({ ...PILHA.estadoDaEntrada({ n: 1, tela }), ...extra });
const bruto = (fm) => ({ fm });
t("a Ficha reaberta pela pilha é neutra e sem a barra", marcasEm("/Jogador", { state: gravado({ name: "aftyFicha", creatureId: "x" }) }), NEUTRO("jogador"));
t("a lista gravada num caminho de Encontros vale mais que o caminho",
  marcasEm("/Jogador/Encontros", { state: gravado({ name: "dashboard" }) }), LISTA_PUBLICA("jogador"));
t("as abas da casca viram a lista só na Guilda", [
  marcasEm("/EraDeOuro", { state: gravado({ name: "mais" }) }),
  marcasEm("/Jogador", { state: gravado({ name: "mais" }) }),
], [LISTA_PRIVADA("guilda"), NEUTRO("jogador")]);

/* A leitura do history.state, estado por estado, contra o `lerEntrada` de verdade. */
const TELAS_DA_PILHA = [...lê("../src/celular/pilha.js").match(/const TELAS = new Set\(\[([^\]]*)\]\)/)[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
const TELAS_DO_HTML = [...(esqueleto[0]?.match(/var TELAS = \[([^\]]*)\]/)?.[1] ?? "").matchAll(/"([^"]+)"/g)].map((x) => x[1]);
t("a lista de telas do index.html é a da pilha", [...TELAS_DO_HTML].sort(), [...TELAS_DA_PILHA].sort());
t("a pilha está ligada (desligada, o App não lê o histórico: tire a leitura do index.html)", PILHA_LIGADA, true);
const ESTADOS = [
  null, undefined, 0, "fm", [], {}, { fm: null }, bruto(1), bruto({}), bruto({ v: PILHA.VERSAO_PILHA }),
  bruto({ v: PILHA.VERSAO_PILHA, tela: null }), bruto({ v: PILHA.VERSAO_PILHA, tela: "aftyFicha" }),
  bruto({ v: PILHA.VERSAO_PILHA, tela: {} }), bruto({ v: PILHA.VERSAO_PILHA, tela: { name: "outra" } }),
  bruto({ v: PILHA.VERSAO_PILHA, tela: { name: 3 } }), bruto({ v: PILHA.VERSAO_PILHA + 1, tela: { name: "aftyFicha" } }),
  bruto({ v: String(PILHA.VERSAO_PILHA), tela: { name: "aftyFicha" } }), bruto({ tela: { name: "aftyFicha" } }),
  { outro: true, ...gravado({ name: "builder" }) },
  PILHA.estadoDaEntrada({ n: 2, tela: { name: "aftyFicha", creatureId: "x" }, camada: "folha" }),
  ...TELAS_DA_PILHA.map((name) => gravado({ name, creatureId: "x", encounterId: "y" })),
];
const classeDaTela = (nome) => (nome === "dashboard" ? "lista" : nome === "encounters" || nome === "encounter" ? "encontros" : "outra");
const classeDasMarcas = (m) => (m.esq === "lista" ? "lista" : m.atual === "encontros" ? "encontros" : "outra");
for (const [caminho, doCaminho] of [["/Jogador", "dashboard"], ["/Jogador/Encontros", "encounters"], ["/Jogador/Encontros/y", "encounter"]]) {
  t(`o history.state é lido como o lerEntrada em ${caminho}`,
    ESTADOS.map((state) => classeDasMarcas(marcasEm(caminho, { state }))),
    ESTADOS.map((state) => classeDaTela(PILHA.lerEntrada(state)?.tela?.name ?? doCaminho)));
}
/* E o caminho sozinho, como o `lerCaminho`. */
const CAMINHOS = ["/Criatura", "/criatura/", "/Jogador", "/Player", "/Afty", "/Eclesiastes", "/EraDeOuro", "/Encontros", "/Criatura/Encontros",
  "/Afty/Encontros/a%2Fb", "/Jogador/Encontros/", "/Jogadores", "/Jogador/outra", "/Criatura/Encontros/a/b"];
t("o caminho é lido como o lerCaminho",
  CAMINHOS.map((p) => !!marcasEm(p).rota), CAMINHOS.map((p) => !!lerCaminho(p)));
t("a rota é a mesma",
  CAMINHOS.filter((p) => lerCaminho(p)).map((p) => marcasEm(p).rota),
  CAMINHOS.filter((p) => lerCaminho(p)).map((p) => ({ player: "jogador", afty: "grimorio", eclesiastes: "eclesiastes", eradeouro: "guilda" })[lerCaminho(p).rota] ?? "criatura"));
t("o script do esqueleto não tem travessão", new RegExp("\\u2014").test(esqueleto[0] ?? ""), false);

/* ---------- 2. a rota de cada grupo da Sala ---------- */
t("rota de cada grupo", ["site", "afty", "eradeouro", "eclesiastes"].map(D.rotaDoGrupo), ["/Jogador", "/Jogador", "/EraDeOuro", "/Eclesiastes"]);
t("grupo desconhecido cai em /Jogador", [undefined, null, "outro"].map(D.rotaDoGrupo), ["/Jogador", "/Jogador", "/Jogador"]);
t("a rota espelha o armazém (mesmo grupo, mesma lista)",
  Object.keys(D.ROTA_DO_GRUPO).sort(), Object.keys(D.ARMAZEM_DO_GRUPO).sort());
t("a Guilda edita onde guarda", D.ARMAZEM_DO_GRUPO.eradeouro.namespace === "eradeouro" && D.rotaDoGrupo("eradeouro") === "/EraDeOuro", true);

const JOGADOR = lê("../src/nuvem/sala-ui/TelaDoJogador.jsx");
const PAGINA = lê("../src/nuvem/SalaPagina.jsx");
t("o Editar abre a rota do grupo", JOGADOR.includes("window.open(rotaDoGrupo(grupo)"), true);
t("o Editar não abre mais /Player fixo", JOGADOR.includes('window.open("/Player"'), false);
t("a Sala passa o grupo ao Voltar", PAGINA.includes("onVoltar?.(grupoDaSala)"), true);
// Desde o rework dos Encontros (etapa 1) a Sala volta primeiro para onde foi aberta, e a rota do grupo é o padrão sem origem.
t("o App volta pela rota do grupo", APP.includes("location.assign(lerOrigemDaSala(codigoDaSala) ?? rotaDoGrupo(grupo))"), true);
t("o App não volta mais a /Player fixo", APP.includes('location.assign("/Player")'), false);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
