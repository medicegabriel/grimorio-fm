/* A Mesa do Mestre da Guilda (2026-11-11): o modelo das entradas e a Vida e o PE pela sessão da Ficha. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
/* Um localStorage de memória: a sessão da Ficha e a mesa gravam nele. */
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
};
const A = new URL("../src/systems/afty/", import.meta.url).href;
const E = new URL("../src/systems/eradeouro/", import.meta.url).href;
await import(A + "afty-derive.js");
const { createBlankAfty } = await import(A + "afty-schema.js");
const { salvarSessao, carregarSessao } = await import(A + "ficha/ficha-sessao.js");
const M = await import(E + "mesa-do-mestre.js");
const S = await import(E + "mesa-do-mestre-sessao.js");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

const ogro = { ...createBlankAfty(), id: "c1", name: "Ogro", rulesVersion: "afty", mesa: "eradeouro" };
const yuji = { ...createBlankAfty(), id: "c1", name: "Yuji", rulesVersion: "player", mesa: "eradeouro" };
const da252 = { id: "x", name: "Velha" };
const porId = new Map([[ogro.id, ogro]]);
let n = 0;
const gerarId = () => `mesa_t${n++}`;

/* ---------- o modelo ---------- */
t("mesa vazia", M.mesaVazia(), { versao: 1, entradas: [] });
t("lixo vira mesa vazia", M.normalizaMesa({ entradas: "x" }), M.mesaVazia());
t("entrada inválida sai e repetida também", M.normalizaMesa({ entradas: [
  { id: "a", tipo: "lista", fichaId: "c1" }, { id: "a", tipo: "lista", fichaId: "c2" }, { id: "b", tipo: "outra" }, null,
] }).entradas.map((e) => e.id), ["a"]);

let mesa = M.adicionarDaLista(M.mesaVazia(), ["c1", "c1", ""]);
t("da lista entra uma vez", mesa.entradas, [{ id: "lista_c1", tipo: "lista", fichaId: "c1" }]);
t("adicionar de novo não duplica", M.adicionarDaLista(mesa, ["c1"]) === mesa, true);

const imp = M.importarNaMesa(mesa, [yuji, da252], { aceita: (f) => !!f.rulesVersion, gerarId });
mesa = imp.mesa;
t("a 2.5.2 fica de fora", imp.recusadas, 1);
const importada = mesa.entradas[1];
t("a importada ganha id novo e guarda a origem", [importada.ficha.id, importada.origemId, importada.ficha.name], ["mesa_t0", "c1", "Yuji"]);
t("e não colide com a ficha da lista de mesmo id", M.idDaSessao(mesa.entradas[0]) !== M.idDaSessao(importada), true);
t("a sessão da lista é a da Ficha Final", M.idDaSessao(mesa.entradas[0]), "c1");
t("grupos", mesa.entradas.map((e) => M.grupoDaFicha(M.fichaDaEntrada(e, porId))), ["criatura", "jogador"]);
t("a ficha apagada da lista sai da mesa", M.semFichasApagadas(mesa, []).entradas.map((e) => e.tipo), ["importada"]);
t("sem nada apagado a mesa é a mesma", M.semFichasApagadas(mesa, ["c1"]) === mesa, true);

const nova = M.atualizarImportada(mesa, importada.id, { ...yuji, id: "c9", name: "Yuji Nível 5" });
t("atualizar troca a ficha e mantém o id", [nova.entradas[1].ficha.name, nova.entradas[1].ficha.id, nova.entradas[1].origemId], ["Yuji Nível 5", "mesa_t0", "c9"]);
t("atualizar uma da lista não faz nada", M.atualizarImportada(mesa, "lista_c1", yuji) === mesa, true);

const rem = M.removerDaMesa(mesa, mesa.entradas.map((e) => e.id));
t("tirar tudo", rem.mesa.entradas, []);
t("só a sessão da importada é apagada", rem.sessoesAApagar, ["mesa_t0"]);
t("metade arredonda para baixo", [M.metade(7), M.metade(1), M.metade(-3), M.metade("x")], [3, 0, 0, 0]);

t("gravar e ler", (M.salvarMesa(mesa), M.carregarMesa()), M.normalizaMesa(mesa));
t("a chave é da Guilda", mem.has("fm_mesa_mestre_eradeouro_v1"), true);

/* ---------- a Vida e o PE ---------- */
const itens = () => mesa.entradas.map((e) => ({ id: e.id, idSessao: M.idDaSessao(e), ficha: M.fichaDaEntrada(e, porId) }));
let d = S.derivarMesa(itens());
const v0 = d.lista_c1.vital;
t("a sessão nova nasce cheia", [v0.pv === v0.pvMax, v0.pe === v0.peMax, v0.pvMax > 0], [true, true, true]);
const aplica = (acao, valor) => S.aplicarNaMesa(d.lista_c1.sessao, d.lista_c1.derived, acao, valor);
t("Dano", S.resumoVital(aplica("dano", 50), d.lista_c1.derived).pv, v0.pvMax - 50);
t("Dano pela Metade", S.resumoVital(aplica("danoMetade", 51), d.lista_c1.derived).pv, v0.pvMax - 25);
t("Gastar PE", S.resumoVital(aplica("gastaPe", 10), d.lista_c1.derived).pe, v0.peMax - 10);
t("Recuperar PE não passa do máximo", S.resumoVital(aplica("recuperaPe", 10), d.lista_c1.derived).pe, v0.peMax);
t("ação desconhecida não mexe", aplica("qualquer", 5) === d.lista_c1.sessao, true);
const ferido = S.aplicarNaMesa(S.aplicarNaMesa(d.lista_c1.sessao, d.lista_c1.derived, "dano", 100), d.lista_c1.derived, "gastaPe", 30);
t("Cura não passa do máximo", S.resumoVital(S.aplicarNaMesa(ferido, d.lista_c1.derived, "cura", 9999), d.lista_c1.derived).pv, v0.pvMax);
t("Recuperar PE devolve", S.resumoVital(S.aplicarNaMesa(ferido, d.lista_c1.derived, "recuperaPe", 5), d.lista_c1.derived).pe, v0.peMax - 25);
const descansado = S.resumoVital(S.aplicarNaMesa(ferido, d.lista_c1.derived, "descanso", 0), d.lista_c1.derived);
t("Descansar enche os dois", [descansado.pv, descansado.pe], [v0.pvMax, v0.peMax]);
const caido = S.resumoVital(S.aplicarNaMesa(ferido, d.lista_c1.derived, "dano", 99999), d.lista_c1.derived);
t("0 de PV é Caído", [caido.pv, caido.caido], [0, true]);
t("ficha sem Vida máxima não é Caída", S.resumoVital({ hpAtual: 0 }, { hp: 0 }).caido, false);

/* A mesma sessão da Ficha Final: o que a mesa grava, a Ficha lê, e o contrário. */
salvarSessao("c1", ferido);
t("a Ficha lê o dano da mesa", carregarSessao("c1").hpAtual, v0.pvMax - 100);
d = S.derivarMesa(itens());
t("e a mesa lê o que está gravado", [d.lista_c1.vital.pv, d.lista_c1.vital.pe], [v0.pvMax - 100, v0.peMax - 30]);
t("a sessão editada na tela vence a gravada", S.derivarMesa(itens().map((i) => ({ ...i, sessaoEditada: i.id === "lista_c1" ? d.lista_c1.sessao : undefined })))
  .lista_c1.vital.pv, v0.pvMax - 100);
t("a importada tem sessão própria", d[importada.id].sessao !== d.lista_c1.sessao, true);

/* ---------- as telas ---------- */
const app = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
t("o botão Mestre só na Guilda", app.includes('onGoToMestre={mesa ? () => setView({ name: "mestre" }) : undefined}'), true);
const dash = readFileSync(new URL("../src/components/Dashboard.jsx", import.meta.url), "utf8");
t("o Dashboard só desenha o botão com a prop", dash.includes("{onGoToMestre && ("), true);
const tela = readFileSync(new URL("../src/systems/eradeouro/MesaDoMestre.jsx", import.meta.url), "utf8");
t("a tela sem travessão", new RegExp("\\u2014").test(tela), false);
t("as seis ações", ["Dano", "Dano pela Metade", "Cura", "Gastar PE", "Recuperar PE", "Descansar"].every((r) => tela.includes(`rotulo: "${r}"`)), true);

if (bad.length) {
  console.error(`FALHARAM ${bad.length}:\n` + bad.join("\n"));
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
