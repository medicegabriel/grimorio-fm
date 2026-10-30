import { register } from "node:module";
import { readFileSync } from "node:fs";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const AD = await import(R + "afty-addons.js");
const TE = await import(R + "afty-treinos-especiais.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const PACOTE = AD.normalizarPacote(JSON.parse(readFileSync(new URL("../addons/treino-de-habilidade-afty.json", import.meta.url), "utf8")));
let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(nome + ": " + JSON.stringify(real) + " != " + JSON.stringify(esperado));
};
const ficha = (nd, addons = [PACOTE], sistema = "player") => {
  const f = createBlankAfty(); f.rulesVersion = sistema; f.core.nd = nd;
  f.core.origem = { id: "inato" }; f.addons = structuredClone(addons); return f;
};
const tetos = (f) => { AD.aplicarAddons(f.addons); return TE.tetosDeTreinoEspecial(f); };

t("Pacote válido", AD.validarPacote(PACOTE), []);
AD.aplicarAddons([PACOTE]);
t("Catálogo remendado continua válido", TE.validarCatalogoTreinosEspeciais(), []);
t("Remendo anotado", TE.getTreinoEspecial("tes_habilidade").remendadoPor?.map((r) => r.id), ["treino-de-habilidade-afty"]);
t("Texto fala da escada nova", TE.getTreinoEspecial("tes_habilidade").descricao.includes("a cada 10 níveis seguintes"), true);

// O teto do Afty: 1 + piso(Nível / 10), sem parar.
for (const [n, esperado] of [[1, 1], [9, 1], [10, 2], [19, 2], [20, 3], [29, 3], [30, 4]]) {
  t("Player com o pacote, nível " + n, tetos(ficha(n)).tes_habilidade, esperado);
  t("Igual à criatura, nível " + n, tetos(ficha(n)).tes_habilidade, tetos(ficha(n, [], "afty")).tes_habilidade);
}
// Acima do 30 quem decide é o teto de NÍVEL do Player: sozinho, o pacote para no 4.
t("Sem teto de nível, o Player apara no 30", tetos(ficha(40)).tes_habilidade, 4);
const SEM_TETO = AD.normalizarPacote(JSON.parse(readFileSync(new URL("../addons/player-nivel-sem-teto.json", import.meta.url), "utf8")));
for (const [n, esperado] of [[40, 5], [55, 6]]) {
  t("Com o Nível sem Teto, nível " + n, tetos(ficha(n, [PACOTE, SEM_TETO])).tes_habilidade, esperado);
  t("Igual à criatura, nível " + n, tetos(ficha(n, [PACOTE, SEM_TETO])).tes_habilidade, tetos(ficha(n, [], "afty")).tes_habilidade);
}
// Sem o pacote, o Player para no 2.
for (const [n, esperado] of [[9, 1], [10, 2], [20, 2], [30, 2]]) {
  t("Player sem o pacote, nível " + n, tetos(ficha(n, [])).tes_habilidade, esperado);
}
// Os outros dois Treinos Especiais não mudam.
t("Feitiço segue sem teto", tetos(ficha(30)).tes_feitico, null);
t("Aptidão segue parando no 2", tetos(ficha(30)).tes_aptidao, 2);
// Na criatura nada muda.
t("Criatura igual com e sem o pacote", tetos(ficha(30, [PACOTE], "afty")), tetos(ficha(30, [], "afty")));

// As pegas dentro do teto valem e viram vaga, e a excedente é aparada.
const f = ficha(30);
f.treinosEspeciais = Array.from({ length: 5 }, () => ({ id: "tes_habilidade" }));
AD.aplicarAddons(f.addons);
t("Quatro pegas no 30, a quinta é aparada", TE.vezesPorTreinoEspecial(f).tes_habilidade, 4);
const vagas = deriveAfty(f).efeitos.detalhes.filter((d) => d.canal === "vagasHabilidade" && d.origem === "tes_habilidade").length;
t("Quatro vagas de Habilidade no Motor", vagas, 4);
t("Interlúdios contam as quatro pegas", TE.focosDeTreinosEspeciais(f), 4);
const semPacote = ficha(30, []);
semPacote.treinosEspeciais = f.treinosEspeciais;
AD.aplicarAddons([]);
t("Sem o pacote, as mesmas pegas aparam em 2", TE.vezesPorTreinoEspecial(semPacote).tes_habilidade, 2);

if (bad.length) {
  console.error(bad.join("\n"));
  process.exit(1);
}
console.log("TODOS OS " + ok + " ASSERTS PASSARAM");
