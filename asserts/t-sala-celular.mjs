/* O app de celular, etapa E7 (2026-11-20): a Sala no celular.

   1. Entrar pelo código ou pelo link colado (`codigoDoTexto`, em `sala-ui-dados.js`).
   2. O pedido de editar pela Sala (`src/celular/editar-pela-sala.js`): vale uma vez, vence em dois minutos, e só volta para um
      endereço de Sala deste site (um pedido adulterado não manda ninguém para fora).
   3. O link da Sala aberto direto no app (`src/celular/inicio-da-sala.js`): a entrada de início na Guilda, com uma janela de
      mentira.
   4. As ligações e o CSS do celular. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const url = (p) => new URL(p, import.meta.url);
const lê = (p) => readFileSync(url(p), "utf8");
const D = await import(url("../src/nuvem/sala-ui/sala-ui-dados.js").href);
const E = await import(url("../src/celular/editar-pela-sala.js").href);
const I = await import(url("../src/celular/inicio-da-sala.js").href);

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ---------- 1. o código ---------- */
t("o código puro, em qualquer caixa", ["K7QX2M", "k7qx2m", " k7q x2m ", "K7Q-X2M"].map(D.codigoDoTexto), ["K7QX2M", "K7QX2M", "K7QX2M", "K7QX2M"]);
t("o link inteiro, com ou sem https e com query", [
  "https://fichafm.com.br/Sala/K7QX2M",
  "fichafm.com.br/sala/k7qx2m?x=1",
  "olha a sala: https://www.fichafm.com.br/Sala/K7QX2M/ vem logo",
].map(D.codigoDoTexto), ["K7QX2M", "K7QX2M", "K7QX2M"]);
t("fora do alfabeto (I, L, O, 0, 1) ou do tamanho, nada", ["K7QX2", "K7QX2MM", "KOQX2M", "K1QX2M", "", null, "Sala Nova", "https://fichafm.com.br/Sala/Nova"].map(D.codigoDoTexto), [null, null, null, null, null, null, null, null]);

/* ---------- 2. o pedido de editar ---------- */
const memoria = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
};
const AGORA = 1_800_000_000_000;
{
  const a = memoria();
  t("grava o pedido", E.pedirEdicao({ id: 42, volta: "/Sala/K7QX2M" }, a, AGORA), true);
  t("lê o pedido", E.lerPedidoDeEdicao(a, AGORA + 1000), { id: "42", volta: "/Sala/K7QX2M" });
  t("vale uma vez", E.lerPedidoDeEdicao(a, AGORA + 2000), null);
}
{
  const a = memoria();
  E.pedirEdicao({ id: "x", volta: "/Sala/K7QX2M" }, a, AGORA);
  t("vence em dois minutos", E.lerPedidoDeEdicao(a, AGORA + E.VALIDADE_MS + 1), null);
  t("o prazo é de dois minutos", E.VALIDADE_MS, 120000);
}
t("só volta para uma Sala deste site", ["https://mal.example/Sala/K7QX2M", "//mal.example", "/EraDeOuro", "/Sala/../EraDeOuro", "javascript:alert(1)"]
  .map((volta) => E.pedirEdicao({ id: "x", volta }, memoria(), AGORA)), [false, false, false, false, false]);
{
  const a = memoria();
  a.setItem(E.CHAVE_EDITAR, JSON.stringify({ id: "x", volta: "https://mal.example/Sala/K7QX2M", em: AGORA }));
  t("um pedido adulterado não vale", E.lerPedidoDeEdicao(a, AGORA), null);
  a.setItem(E.CHAVE_EDITAR, "{quebrado");
  t("JSON quebrado não derruba", E.lerPedidoDeEdicao(a, AGORA), null);
  t("sem armazém, nada", [E.pedirEdicao({ id: "x", volta: "/Sala/K7QX2M" }, null), E.lerPedidoDeEdicao(null)], [false, null]);
}

/* ---------- 3. o início na Guilda ---------- */
t("precisa só no app, com a Sala como primeira página", [
  I.precisaDeInicio({ instalado: true, tamanhoDoHistorico: 1, estado: null }),
  I.precisaDeInicio({ instalado: false, tamanhoDoHistorico: 1, estado: null }),
  I.precisaDeInicio({ instalado: true, tamanhoDoHistorico: 3, estado: null }),
  I.precisaDeInicio({ instalado: true, tamanhoDoHistorico: 1, estado: { fmInicioDaSala: true } }),
], [true, false, false, false]);
{
  const ouvintes = {};
  const chamadas = [];
  const janela = {
    history: { length: 1, state: null, replaceState: (e, _, u) => chamadas.push(["replace", e, u]), pushState: (e, _, u) => chamadas.push(["push", e, u]) },
    location: { pathname: "/Sala/K7QX2M", search: "?x=1", replace: (u) => chamadas.push(["sair", u]) },
    addEventListener: (tipo, f) => { ouvintes[tipo] = f; },
    removeEventListener: (tipo) => { delete ouvintes[tipo]; },
  };
  const desligar = I.ligarInicioNaGuilda(janela, { instalado: true });
  t("nada muda antes do toque", chamadas, []);
  ouvintes.pointerdown();
  t("no toque, a Guilda embaixo e a Sala por cima", chamadas, [["replace", { fmInicioDaSala: true }, "/EraDeOuro"], ["push", null, "/Sala/K7QX2M?x=1"]]);
  t("e só uma vez", "pointerdown" in ouvintes, false);
  ouvintes.popstate({ state: { fmInicioDaSala: true } });
  t("o Voltar abre a Guilda", chamadas.at(-1), ["sair", "/EraDeOuro"]);
  desligar();
  t("desligar tira as escutas", Object.keys(ouvintes), []);
}
t("fora do app não liga nada", (() => { let n = 0; I.ligarInicioNaGuilda({ history: { length: 1, state: null }, addEventListener: () => { n++; } }, { instalado: false }); return n; })(), 0);

/* ---------- 4. as ligações e o CSS ---------- */
const APP = lê("../src/App.jsx");
const JOG = lê("../src/nuvem/sala-ui/TelaDoJogador.jsx");
const BOT = lê("../src/nuvem/sala-ui/EntrarPorCodigo.jsx");
const CSS = lê("../src/nuvem/sala-ui/sala-ui.css");
t("o botão Sala só na Guilda e só com a nuvem", APP.includes("{mesa && nuvemAtiva && <BotaoEntrarNaSala />}"), true);
t("o pedido é lido na abertura e o criador abre sem empilhar", [APP.includes("const pedido = lerPedidoDeEdicao();"), APP.includes('substituir({ name: "builder", creatureId: ficha.id });')], [true, true]);
t("Salvar e Cancelar voltam para a Sala", [APP.includes("onCancel={sairDoCriador}"), /storage\.create\(stamped\);\s*\}\s*sairDoCriador\(\);/.test(APP)], [true, true]);
t("a volta sobe a nuvem com prazo de 3 s", APP.includes("Promise.race([subir, new Promise((r) => setTimeout(r, 3000))])"), true);
t("o link no app ganha o início na Guilda", APP.includes("ligarInicioNaGuilda(window, { instalado: estaInstalado() })"), true);
t("na Sala, o Editar troca de página no celular e no app", [JOG.includes("(celular || estaInstalado()) && pedirEdicao({ id, volta: location.pathname })"), JOG.includes('window.open(rotaDoGrupo(grupo), "_blank", "noopener")')], [true, true]);
t("o campo do código tem 16 px e o botão 44", [BOT.includes("text-base"), (BOT.match(/h-11/g) ?? []).length], [true, 2]);
t("o painel ocupa a tela no celular", /\.sl-corpo\[data-painel="aberto"\] \.sl-painel \{ inset: var\(--ec-faixa-h, 0px\) 0 0 0; width: 100%/.test(CSS), true);
t("os botões do painel e do chat com 44 px", [/\.sl-abas \.ec-aba-mini \{ min-height: 44px; min-width: 44px/.test(CSS), CSS.includes(".sl-painel-topo .afty-passo, .sl-chat .ec-icone { min-height: 44px; min-width: 44px")], [true, true]);
t("os campos com 16 px só no iPhone", /@supports \(-webkit-touch-callout: none\)[\s\S]*:is\(\.sl-pagina, \.sl-jogador\)[\s\S]*font-size: 16px/.test(CSS), true);
t("a lista do jogador não estica os cartões", CSS.includes("display: grid; gap: 12px; align-content: start; }"), true);
t("sem travessão", [BOT, lê("../src/celular/editar-pela-sala.js"), lê("../src/celular/inicio-da-sala.js")].some((s) => new RegExp("\\u2014").test(s)), false);

if (bad.length) {
  console.log(bad.join("\n"));
  console.log(`\n${bad.length} FALHARAM, ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
