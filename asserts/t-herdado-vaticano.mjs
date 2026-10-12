import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";

register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const O = await import(R + "afty-origens.js");
const T = await import(R + "afty-talentos.js");
const { curaNoGasto } = await import(R + "afty-cura.js");
const { valorCanal } = await import(R + "afty-efeitos.js");

let ok = 0;
const t = (nome, real, esperado) => {
  assert.deepEqual(real, esperado, nome);
  ok++;
};
const pacote = A.normalizarPacote(JSON.parse(readFileSync(
  new URL("../addons/herdado-vaticano.json", import.meta.url), "utf8",
)));
const CLA = "herdado-vaticano:cla_vaticano";
const TAL = "herdado-vaticano:tal_cura_perfeita";
t("pacote válido", A.validarPacote(pacote), []);
A.aplicarAddons([pacote]);
t("Vaticano aparece entre os clãs do Herdado", O.clasDaOrigem("herdado").some((c) => c.id === CLA), true);
t("três pontos totalmente livres", O.getCla(CLA).caracteristicas[0].bonus, { distribuir: 3, maxPorAtributo: 3 });
const talento = T.getTalento(TAL);
t("talento de Origem", talento.grupo, "origem");
const permite = (nd, claId = CLA, origemId = "herdado") => talento.requisitos.every((r) =>
  T.avaliarRequisitoTalento(r, { nd, claId, origemId }).ok);
t("nível 7 não pode comprar", permite(7), false);
t("nível 8 pode comprar", permite(8), true);
t("outro Herdado não pode comprar", permite(8, "cla_gojo"), false);
t("outra origem não pode comprar", permite(8, CLA, "inato"), false);

const ficha = (sistema, perfeita = false) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core.nd = 8;
  c.core.origem = { id: "herdado", cla: CLA, bonusAtributos: { sabedoria: 3 } };
  c.attributes = Object.fromEntries(Object.keys(c.attributes).map((k) => [k, 10]));
  c.addons = [pacote];
  c.especializacoes = [{ id: "combatente", nivel: 8 }];
  c.habilidades = ["cmb_revigorar"];
  c.aptidoesAmaldicoadas = ["energia_reversa"];
  c.aptidoes.er = 2;
  c.talentos = perfeita ? [TAL] : [];
  return c;
};
for (const sistema of ["afty", "player"]) {
  A.aplicarAddons([pacote]);
  const c = ficha(sistema);
  const antes = JSON.stringify(c);
  const base = deriveAfty(c);
  const perfeita = deriveAfty(ficha(sistema, true));
  t(sistema + ": três pontos no mesmo atributo", base.attrEff.sabedoria, 13);
  t(sistema + ": perícias concedidas", ["teologia", "ocultismo"].map((id) =>
    base.testes.pericias.find((p) => p.id === id)?.prof), ["treinado", "treinado"]);
  t(sistema + ": perícias não consomem vagas", base.testes.orcamento.gastos, 0);
  const mestre = ficha(sistema);
  mestre.pericias = { teologia: "mestre", ocultismo: "treinado" };
  t(sistema + ": Mestre paga apenas diferença", deriveAfty(mestre).testes.orcamento.gastos, 1);
  t(sistema + ": nível gratuito em ER", [perfeita.aptidao.efetivo.er, perfeita.aptidao.concedido.er,
    perfeita.aptidao.gastos], [3, 1, base.aptidao.gastos]);
  const teto = ficha(sistema, true);
  teto.aptidoes.er = 5;
  t(sistema + ": ER respeita teto normal", deriveAfty(teto).aptidao.efetivo.er, 5);
  for (const id of ["cura_energia_reversa", "cura_revigorar"]) {
    const linha = base.cura.linhas.find((l) => l.id === id);
    const melhor = perfeita.cura.linhas.find((l) => l.id === id);
    assert.ok(linha && melhor, sistema + ": fonte de cura presente " + id);
    for (const blocos of [1, 2]) {
      const cura = curaNoGasto(linha, blocos);
      const curaPerfeita = curaNoGasto(melhor, blocos);
      t(sistema + ": +1 por dado " + id + " gasto " + blocos, cura.fixo - linha.fixoBase, cura.dados);
      t(sistema + ": +2 por dado " + id + " gasto " + blocos, curaPerfeita.fixo - melhor.fixoBase, 2 * curaPerfeita.dados);
    }
  }
  const extra = ficha(sistema, true);
  extra.core.tecnicaEfeitos = [{ canal: "curaPorDado", expr: "3", nome: "Outra fonte" }];
  t(sistema + ": preserva outras fontes de cura", valorCanal(deriveAfty(extra).efeitos, "curaPorDado"), 5);
  const semAptidao = ficha(sistema, true);
  semAptidao.aptidoesAmaldicoadas = [];
  t(sistema + ": nível não compra Aptidão automaticamente", deriveAfty(semAptidao).cura.linhas.some((l) => l.id === "cura_energia_reversa"), false);
  const desligada = ficha(sistema, true);
  desligada.addons = [];
  A.aplicarAddons([]);
  const off = deriveAfty(desligada);
  t(sistema + ": desligar remove cura", valorCanal(off.efeitos, "curaPorDado"), 0);
  t(sistema + ": desligar remove nível gratuito", off.aptidao.concedido.er, 0);
  t(sistema + ": ficha original intacta", JSON.stringify(c), antes);
}
A.aplicarAddons([]);
t("clã removido do catálogo", O.getCla(CLA), null);
t("talento removido do catálogo", T.getTalento(TAL), null);
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
