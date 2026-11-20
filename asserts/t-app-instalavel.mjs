/* O app de celular, etapa E4 (2026-11-19): o app Era de Ouro se instala pelo site.

   1. O manifesto: nome, início e escopo, cor, e os ícones existem com o tamanho declarado (lido do cabeçalho do PNG).
   2. O segundo script do `index.html` roda com `window`, `document` e `location` de mentira: o manifesto entra só em
      /EraDeOuro e só nos hosts do app (nunca no endereço antigo da Vercel), e o pedido do Chrome é guardado em toda rota.
   3. As regras do convite (`src/celular/convite.js`): quem vê, o "Agora Não" de 14 dias, o iPhone desligado, e o
      registro do aparelho fora da nuvem. */
import { register } from "node:module";
import { existsSync, readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const url = (p) => new URL(p, import.meta.url);
const lê = (p) => readFileSync(url(p), "utf8");
const C = await import(url("../src/celular/convite.js").href);
const CFG = await import(url("../src/celular/pwa-config.js").href);
const NUVEM = await import(url("../src/nuvem/nuvem-config.js").href);

const TRAVESSAO = new RegExp("\u2014");
let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ---------- 1. o manifesto ---------- */
const M = JSON.parse(lê("../public/manifest.webmanifest"));
t("identidade", [M.id, M.start_url, M.scope], ["/EraDeOuro", "/EraDeOuro", "/"]);
t("nome", [M.name, M.short_name], ["Era de Ouro", "Era de Ouro"]);
t("tela cheia", M.display, "standalone");
t("cores", [M.theme_color, M.background_color], ["#060910", "#060910"]);
const png = (src) => {
  const b = readFileSync(url(`../public${src}`));
  return `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`;
};
for (const i of M.icons) {
  t(`ícone existe ${i.src}`, existsSync(url(`../public${i.src}`)), true);
  if (i.type === "image/png") t(`tamanho de ${i.src}`, png(i.src), i.sizes);
}
const tem = (tam, prop) => M.icons.some((i) => i.sizes === tam && i.purpose === prop);
t("192 e 512, normal e mascarável", [tem("192x192", "any"), tem("512x512", "any"), tem("192x192", "maskable"), tem("512x512", "maskable")], [true, true, true, true]);
t("ícone da Apple de 180", png("/icons/era-de-ouro-180.png"), "180x180");
const VERCEL = JSON.parse(lê("../vercel.json"));
t("o manifesto sai com o tipo certo",
  VERCEL.headers.some((h) => h.source === "/manifest.webmanifest" && h.headers.some((x) => x.value === "application/manifest+json")), true);

/* ---------- 2. o script do index.html ---------- */
const HTML = lê("../index.html");
const scripts = [...HTML.matchAll(/<script>\s*([\s\S]*?)<\/script>/g)].map((m) => m[1]);
t("o título continua no primeiro script (t-app-rotas lê o primeiro)", scripts[0]?.includes("document.title"), true);
const script = scripts.find((s) => s.includes("beforeinstallprompt")) ?? "";
const rodar = (hostname, pathname) => {
  const ouvintes = {};
  const disparados = [];
  const head = [];
  const icone = { href: "/favicon.svg" };
  const tela = { content: "width=device-width, initial-scale=1.0" };
  const atributos = {};
  const window = {
    addEventListener: (nome, f) => { ouvintes[nome] = f; },
    dispatchEvent: (e) => disparados.push(e.type),
  };
  const document = {
    head: { appendChild: (el) => head.push(el) },
    createElement: (tag) => ({ tag }),
    querySelector: (sel) => (sel === 'link[rel="icon"]' ? icone : sel === 'meta[name="viewport"]' ? tela : null),
    documentElement: { setAttribute: (k, v) => { atributos[k] = v; } },
  };
  globalThis.Event ??= class { constructor(type) { this.type = type; } };
  new Function("window", "document", "location", script)(window, document, { hostname, pathname });
  return { ouvintes, disparados, head, icone, window, tela, atributos };
};
const manifestoEm = (host, rota) => rodar(host, rota).head.some((el) => el.rel === "manifest");
t("manifesto na Guilda dos hosts do app",
  [["fichafm.com.br", "/EraDeOuro"], ["www.fichafm.com.br", "/eradeouro/"], ["localhost", "/EraDeOuro"], ["127.0.0.1", "/ERADEOURO"]].map(([h, r]) => manifestoEm(h, r)),
  [true, true, true, true]);
t("nenhum manifesto fora da Guilda",
  ["/", "/Player", "/Afty", "/Sala/ABC123", "/EraDeOuro/x"].map((r) => manifestoEm("fichafm.com.br", r)), [false, false, false, false, false]);
t("nenhum manifesto no endereço antigo", manifestoEm("grimorio-fm.vercel.app", "/EraDeOuro"), false);
const naGuilda = rodar("fichafm.com.br", "/EraDeOuro");
t("o que a Guilda ganha", naGuilda.head.map((el) => el.rel ?? el.name), [
  "manifest", "apple-touch-icon", "apple-mobile-web-app-title", "mobile-web-app-capable",
  "apple-mobile-web-app-capable", "apple-mobile-web-app-status-bar-style",
]);
t("o nome no iPhone", naGuilda.head.find((el) => el.name === "apple-mobile-web-app-title")?.content, "Era de Ouro");
t("o favicon vira o selo", naGuilda.icone.href, "/icons/era-de-ouro.svg");
t("fora da Guilda o favicon fica", rodar("fichafm.com.br", "/").icone.href, "/favicon.svg");
/* Etapa E5: a página até a borda e o teclado encolhendo a página, só na Guilda. */
t("o viewport do app na Guilda", naGuilda.tela.content.split(", ").slice(2), ["viewport-fit=cover", "interactive-widget=resizes-content"]);
t("a marca do app na raiz", "data-fm-app" in naGuilda.atributos, true);
t("fora da Guilda o viewport fica", [rodar("fichafm.com.br", "/Player").tela.content, "data-fm-app" in rodar("fichafm.com.br", "/Player").atributos], ["width=device-width, initial-scale=1.0", false]);
t("as laterais recuam pela área segura no app", /:root\[data-fm-app\] body \{[^}]*safe-area-inset-left[^}]*safe-area-inset-right/.test(lê("../src/celular/celular.css")), true);

for (const rota of ["/", "/EraDeOuro"]) {
  const r = rodar("grimorio-fm.vercel.app", rota);
  t(`o pedido é ouvido em ${rota}, em qualquer host`, [typeof r.ouvintes.beforeinstallprompt, typeof r.ouvintes.appinstalled], ["function", "function"]);
}
{
  const r = rodar("fichafm.com.br", "/EraDeOuro");
  let impedido = false;
  const pedido = { preventDefault: () => { impedido = true; } };
  r.ouvintes.beforeinstallprompt(pedido);
  t("o pedido é guardado e a mini barra do Chrome não aparece", [r.window.__fmPedidoInstalar === pedido, impedido], [true, true]);
  r.ouvintes.appinstalled();
  t("instalar limpa o pedido e avisa", [r.window.__fmPedidoInstalar, r.window.__fmInstalado, r.disparados], [null, true, ["fm:instalavel", "fm:instalado"]]);
}
t("os scripts não têm travessão", scripts.some((s) => TRAVESSAO.test(s)), false);

/* ---------- 3. o convite ---------- */
const DIA = 24 * 60 * 60 * 1000;
const agora = 1_800_000_000_000;
const base = { noLugar: true, celular: true, instalado: false, convite: null, agora, plataforma: "android", temPedido: true, iosLiberado: false };
const vez = (o) => C.conviteDaVez({ ...base, ...o });
t("Android com pedido", vez({}), "android");
t("sem pedido do Chrome, nada", vez({ temPedido: false }), null);
t("fora da lista, nada", vez({ noLugar: false }), null);
t("no computador, nada", vez({ celular: false }), null);
t("dentro do app, nada", vez({ instalado: true }), null);
t("já instalou, nada", vez({ convite: { instaladoEm: agora - DIA } }), null);
t("dispensou há 13 dias, nada", vez({ convite: { dispensadoEm: agora - 13 * DIA } }), null);
t("dispensou há 14 dias, volta", vez({ convite: { dispensadoEm: agora - 14 * DIA } }), "android");
t("o prazo é de 14 dias", C.DIAS_DISPENSADO, 14);
t("iPhone desligado", vez({ plataforma: "ios", temPedido: false }), null);
t("iPhone liberado", vez({ plataforma: "ios", temPedido: false, iosLiberado: true }), "ios");
t("o iPhone segue desligado no código (Android primeiro)", CFG.IOS_LIBERADO, false);
t("outro aparelho sem pedido", vez({ plataforma: "outro", temPedido: false }), null);

t("plataformas", [
  C.plataformaDe("Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/131", 5),
  C.plataformaDe("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari", 5),
  C.plataformaDe("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari", 5),
  C.plataformaDe("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari", 0),
  C.plataformaDe("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131", 0),
  C.plataformaDe(),
], ["android", "ios", "ios", "outro", "outro", "outro"]);

t("normalizador: lixo vira vazio", [null, "x", 3, [], { dispensadoEm: "ontem", instaladoEm: -5 }].map(C.normalizarConvite),
  Array(5).fill({ versao: 1, dispensadoEm: null, instaladoEm: null }));
t("normalizador: guarda o que vale", C.normalizarConvite({ dispensadoEm: 10, instaladoEm: 20, extra: 1 }), { versao: 1, dispensadoEm: 10, instaladoEm: 20 });

const memoria = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m };
};
{
  const a = memoria();
  t("ler sem nada", C.lerConvite(a), { versao: 1, dispensadoEm: null, instaladoEm: null });
  t("gravar", C.gravarConvite({ dispensadoEm: 99 }, a), true);
  t("ler o gravado", C.lerConvite(a), { versao: 1, dispensadoEm: 99, instaladoEm: null });
  a.m.set(C.CHAVE_CONVITE, "{quebrado");
  t("JSON quebrado não derruba", C.lerConvite(a), { versao: 1, dispensadoEm: null, instaladoEm: null });
  const cheio = { getItem: () => null, setItem: () => { throw new Error("cheio"); } };
  t("armazém cheio não derruba", C.gravarConvite({ dispensadoEm: 1 }, cheio), false);
}
t("a chave fica no aparelho, fora da nuvem", NUVEM.ehChaveDoAparelho(C.CHAVE_CONVITE), true);

/* ---------- 4. as telas ---------- */
const TELA = lê("../src/celular/ConviteInstalar.jsx");
const APP = lê("../src/App.jsx");
const CONTA = lê("../src/nuvem/PainelDaConta.jsx");
t("textos do convite", ["Instalar o App Era de Ouro", "Agora Não", ">Instalar<", "Como Instalar"].map((s) => TELA.includes(s) || TELA.includes(s.replace(/[<>]/g, ""))), [true, true, true, true]);
t("aviso do iPhone usa o ícone, nunca o caractere", [TELA.includes("<AlertTriangle"), new RegExp("\u26A0").test(TELA)], [true, false]);
t("o App só convida na Guilda, fora da Sala, na lista", APP.includes('{mesa && !rotaSala && <ConviteInstalar ativo={view.name === "dashboard"} />}'), true);
t("a Conta oferece Instalar o App", CONTA.includes("Instalar o App"), true);
t("sem travessão nas telas", [TELA, CONTA].some((s) => TRAVESSAO.test(s)), false);
t("sem ponto e vírgula nos textos da tela", /;/.test(TELA.match(/return \(([\s\S]*)\);\s*}\s*$/)?.[1].replace(/\{[^{}]*\}/g, "") ?? ""), false);

if (bad.length) {
  console.log(bad.join("\n"));
  console.log(`\n${bad.length} FALHARAM, ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
