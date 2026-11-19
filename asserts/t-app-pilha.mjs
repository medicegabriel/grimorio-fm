/* O Voltar do aparelho (app de celular, etapa E2, 2026-11-19): a pilha de telas no histórico do navegador.

   1. A lógica pura de src/celular/pilha.js, rodada sobre um histórico de mentira que empilha, troca e volta como o do
      navegador: Ficha, criador, Encontro, painéis por cima e o criador da 2.5.2 que nunca é empilhado.
   2. As ligações, lidas como texto: o App não troca mais de tela por `setView`, e cada painel que abre por toque é camada. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const P = await import(new URL("../src/celular/pilha.js", import.meta.url).href);
const C = await import(new URL("../src/celular/pwa-config.js", import.meta.url).href);
const lê = (p) => readFileSync(new URL(p, import.meta.url), "utf8");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ---------- um histórico de mentira ---------- */
function historico() {
  const pilha = [{ state: null }];
  let i = 0;
  const h = {
    get state() { return pilha[i].state; },
    pushState(state) { pilha.splice(i + 1); pilha.push({ state }); i += 1; },
    replaceState(state) { pilha[i] = { state }; },
    back() { if (i > 0) i -= 1; },
    get tamanho() { return pilha.length; },
    get indice() { return i; },
  };
  return h;
}
const aplicar = (h, plano) => {
  if (plano.metodo === "push") h.pushState(plano.estado);
  else if (plano.metodo === "replace") h.replaceState(plano.estado);
  else if (plano.metodo === "back") h.back();
};
const telaDe = (h) => P.lerEntrada(h.state)?.tela?.name ?? null;

/* ---------- 1. a lógica pura ---------- */
t("a pilha está ligada", C.PILHA_LIGADA, true);
t("tela lixo vira null", [P.normalizarTela(null), P.normalizarTela({ name: "outra" }), P.normalizarTela("x")], [null, null, null]);
t("tela boa só com os campos do App",
  P.normalizarTela({ name: "aftyFicha", creatureId: "c1", extra: 1 }), { name: "aftyFicha", creatureId: "c1", encounterId: null });
t("sistemaNovo vai junto quando existe",
  P.normalizarTela({ name: "builder", sistemaNovo: "player" }), { name: "builder", creatureId: null, encounterId: null, sistemaNovo: "player" });
t("estado de outro código não é entrada", [P.lerEntrada(null), P.lerEntrada({ x: 1 }), P.lerEntrada({ fm: { v: 9 } })], [null, null, null]);
t("n lixo vira 0", P.lerEntrada({ fm: { v: 1, n: -3, tela: P.TELA_LISTA } }).n, 0);

const existe = (tela) => tela.creatureId !== "apagada";
t("abre na lista sem histórico", P.telaInicial(null, existe), P.TELA_LISTA);
t("recarregar reabre a Ficha",
  P.telaInicial(P.estadoDaEntrada({ n: 1, tela: { name: "aftyFicha", creatureId: "c1" } }), existe),
  { name: "aftyFicha", creatureId: "c1", encounterId: null });
t("a Ficha apagada cai na lista",
  P.telaInicial(P.estadoDaEntrada({ n: 1, tela: { name: "aftyFicha", creatureId: "apagada" } }), existe), P.TELA_LISTA);
t("um existe que quebra cai na lista", P.telaInicial(P.estadoDaEntrada({ n: 1, tela: { name: "encounters" } }), () => { throw new Error("x"); }), P.TELA_LISTA);
t("a abertura guarda o estado de outro código",
  P.estadoDeAbertura({ outro: 1 }, P.TELA_LISTA), { outro: 1, fm: { v: 1, n: 0, tela: P.TELA_LISTA } });

/* Lista, Ficha, criador da Ficha, Salvar: volta à Ficha, e o Voltar da Ficha volta à lista. */
{
  const h = historico();
  h.replaceState(P.estadoDeAbertura(h.state, P.TELA_LISTA));
  aplicar(h, P.planoDeIr(h.state, { name: "aftyFicha", creatureId: "c1" }));
  aplicar(h, P.planoDeIr(h.state, { name: "builder", creatureId: "c1" }));
  t("três telas empilhadas", [h.tamanho, P.lerEntrada(h.state).n, telaDe(h)], [3, 2, "builder"]);
  aplicar(h, P.planoDeVoltar(h.state));
  t("Salvar no criador volta à Ficha", telaDe(h), "aftyFicha");
  aplicar(h, P.planoDeVoltar(h.state));
  t("o Voltar da Ficha volta à lista", [telaDe(h), P.lerEntrada(h.state).n], ["dashboard", 0]);
  const plano = P.planoDeVoltar(h.state);
  t("na lista o Voltar dos botões não sai do site", plano.metodo, "replace");
}

/* Um painel por cima: o Voltar o fecha e a tela fica. */
{
  const h = historico();
  h.replaceState(P.estadoDeAbertura(h.state, P.TELA_LISTA));
  aplicar(h, P.planoDeIr(h.state, { name: "aftyFicha", creatureId: "c1" }));
  aplicar(h, P.planoDaCamada(h.state, "camada-1"));
  t("o painel empilha com a mesma tela", [telaDe(h), P.lerEntrada(h.state).camada], ["aftyFicha", "camada-1"]);
  t("com o painel no topo", P.camadaNoTopo(h.state, "camada-1"), true);
  h.back();
  t("o Voltar desfaz o painel", P.camadaSaiu(h.state, "camada-1"), true);
  t("e a tela continua a Ficha", telaDe(h), "aftyFicha");
}

/* Ir para outra tela de dentro de um painel troca a entrada do painel, sem deixar painel morto no meio. */
{
  const h = historico();
  h.replaceState(P.estadoDeAbertura(h.state, P.TELA_LISTA));
  aplicar(h, P.planoDaCamada(h.state, "camada-7"));
  const plano = P.planoDeIr(h.state, { name: "builder", sistemaNovo: "player" });
  t("de dentro de um painel ir troca", plano.metodo, "replace");
  aplicar(h, plano);
  t("o painel saiu da pilha", [h.tamanho, P.camadaNoTopo(h.state, "camada-7"), telaDe(h)], [2, false, "builder"]);
  aplicar(h, P.planoDeVoltar(h.state));
  t("o Voltar do criador novo volta à lista", telaDe(h), "dashboard");
}

/* Dois painéis: o Voltar fecha só o de cima. */
{
  const h = historico();
  h.replaceState(P.estadoDeAbertura(h.state, { name: "encounter", encounterId: "e1" }));
  aplicar(h, P.planoDaCamada(h.state, "a"));
  aplicar(h, P.planoDaCamada(h.state, "b"));
  h.back();
  t("o de cima fecha", P.camadaSaiu(h.state, "b"), true);
  t("o de baixo fica", P.camadaSaiu(h.state, "a"), false);
}

/* O criador da 2.5.2 troca sem empilhar: o Voltar do aparelho sai da página e o aviso de sair sem salvar protege. */
{
  const h = historico();
  h.replaceState(P.estadoDeAbertura(h.state, P.TELA_LISTA));
  aplicar(h, P.planoDeSubstituir(h.state, { name: "builder", creatureId: "c252" }));
  t("o criador da 2.5.2 não empilha", [h.tamanho, telaDe(h)], [1, "builder"]);
  const plano = P.planoDeVoltar(h.state);
  t("o Salvar dele troca de volta pela lista", [plano.metodo, P.lerEntrada(plano.estado).tela.name], ["replace", "dashboard"]);
}

/* ---------- 2. as ligações ---------- */
const APP = lê("../src/App.jsx");
t("o App usa a pilha", APP.includes("usePilhaDeTelas({ existe: telaPodeReabrir })"), true);
t("o App não troca mais de tela por setView", /setView\(/.test(APP), false);
t("o criador da 2.5.2 entra por substituir", APP.includes("(da252 ? substituir : ir)"), true);
t("a tela que sumiu troca, sem voltar no histórico", (APP.match(/substituir\(TELA_LISTA\)/g) ?? []).length >= 2, true);
t("o Voltar do Encontro volta aos Encontros", APP.includes("onVoltar={voltarAosEncontros}"), true);
t("o criador da 2.5.2 nunca reabre do histórico", APP.includes('if (t.name === "builder") return t.creatureId ? !!ficha && !!sistemaGravado(ficha) : aftyMode;'), true);
t("os dois diálogos do App são camadas",
  APP.includes("useCamadaDeVoltar(escolhendoTipo,") && APP.includes("useCamadaDeVoltar(!!importeRecusado,"), true);

const camada = "useCamadaDeVoltar(";
t("a folha de baixo é camada", lê("../src/celular/FolhaInferior.jsx").includes(camada), true);
t("o painel flutuante da G2 é camada (menos a dica)", lê("../src/systems/afty/ficha/efeitos/pecas.jsx").includes("useCamadaDeVoltar(!dica, onFechar)"), true);
t("o diálogo do Encontro é camada", lê("../src/systems/afty/encontros/telas/pecas-encontro.jsx").includes("useCamadaDeVoltar(true, onFechar)"), true);
const G2 = lê("../src/systems/afty/ficha/AftyFichaG2.jsx");
t("Busca e Aparência da G2 são camadas", G2.includes("useCamadaDeVoltar(buscaAberta,") && G2.includes("useCamadaDeVoltar(aparenciaAberta,"), true);
const JOG = lê("../src/nuvem/sala-ui/TelaDoJogador.jsx");
t("a ficha, o colega e a gaveta da Sala são camadas",
  ["useCamadaDeVoltar(!!aberta,", "useCamadaDeVoltar(!!colega,", "useCamadaDeVoltar(painelAberto && !larga(),"].every((x) => JOG.includes(x)), true);

const RASC = lê("../src/systems/afty/afty-rascunho.js");
t("o rascunho grava o pendente ao sair", RASC.includes('window.addEventListener("pagehide", gravarPendente)') && RASC.includes("gravarPendente();"), true);
t("o rascunho salvo nunca é regravado (nem pela espera, nem ao sair)", RASC.includes("draftJson === jsonSalvo.current) return;") && RASC.includes("u.draftJson !== jsonSalvo.current") && RASC.includes("jsonSalvo.current = ultimo.current?.draftJson"), true);
t("o Salvar e o Descartar zeram o pendente na hora", (RASC.match(/ultimo\.current = \{ \.\.\.ultimo\.current, pendente: false \}/g) ?? []).length, 2);

for (const [nome, texto] of [["pilha.js", lê("../src/celular/pilha.js")], ["camadas.js", lê("../src/celular/camadas.js")], ["usar-pilha-de-telas.js", lê("../src/celular/usar-pilha-de-telas.js")]]) {
  t(`${nome} sem travessão`, new RegExp("\\u2014").test(texto), false);
}
t("pilha.js é folha", /^import /m.test(lê("../src/celular/pilha.js")), false);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
