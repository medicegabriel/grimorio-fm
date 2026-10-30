import { register } from "node:module";
import { readFileSync } from "node:fs";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const AD = await import(R + "afty-addons.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { resumoAtributos } = await import(R + "afty-atributos.js");
const ler = (id) => AD.normalizarPacote(JSON.parse(readFileSync(new URL("../addons/" + id + ".json", import.meta.url), "utf8")));
const PACOTE = ler("player-nivel-sem-teto");
const EPICO = ler("player-progressao-epica");
let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(nome + ": " + JSON.stringify(real) + " != " + JSON.stringify(esperado));
};
const ficha = (nd, addons = [PACOTE], sistema = "player") => {
  const f = createBlankAfty(); f.rulesVersion = sistema; f.core.nd = nd;
  f.core.origem = { id: "inato" }; f.focosLivres = 12; f.addons = structuredClone(addons); return f;
};
const derive = (f) => { AD.aplicarAddons(f.addons); return deriveAfty(f); };

t("Pacote válido", AD.validarPacote(PACOTE), []);
t("Campo sem teto com o pacote", AD.nivelMaximoDaFicha(ficha(25)), null);
t("Campo com teto sem o pacote", AD.nivelMaximoDaFicha(ficha(25, [])), 30);
for (const n of [20, 25, 30, 31, 35, 40]) {
  const f = ficha(n); const d = derive(f);
  t("Nível efetivo " + n, [AD.nivelDaFicha(f), d.nd], [n, n]);
  t("Aptidão a cada dois níveis " + n, d.totalAptidao - derive(ficha(20)).totalAptidao, Math.floor((n - 20) / 2));
  // O resto da Progressão Épica NÃO vem junto.
  t("Interlúdios seguem o campo digitado " + n, d.focosTotais, 12);
  t("Interlúdios sem fórmula " + n, d.regrasAfty.focosPorNivel ?? null, null);
  t("Pontos de atributo normais " + n, resumoAtributos(f).pontosNivel, Math.floor(n / 4) * 2);
}
const semPacote = ficha(25, []);
t("Sem o pacote, Aptidão para no 20", derive(semPacote).totalAptidao, derive(ficha(20, [])).totalAptidao);
t("Sem o pacote, nível apara no 30", AD.nivelDaFicha(ficha(35, [])), 30);
t("Junto da Progressão Épica, as regras se unem sem dobrar",
  derive(ficha(35, [PACOTE, EPICO])).totalAptidao, derive(ficha(35, [EPICO])).totalAptidao);
const afty = derive(ficha(35, [PACOTE], "afty"));
t("Na criatura nada muda", [afty.nd, afty.totalAptidao], [derive(ficha(35, [], "afty")).nd, derive(ficha(35, [], "afty")).totalAptidao]);

if (bad.length) {
  console.error(bad.join("\n"));
  process.exit(1);
}
console.log("TODOS OS " + ok + " ASSERTS PASSARAM");
