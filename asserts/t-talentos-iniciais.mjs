import { register } from "node:module";
import { readFileSync } from "node:fs";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const AD = await import(R + "afty-addons.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { valorCanal } = await import(R + "afty-efeitos.js");
const { normalizarRegrasAfty, validarRegrasAfty } = await import(R + "afty-regras-addon.js");
const pacote = JSON.parse(readFileSync(new URL("../addons/talentos-iniciais.json", import.meta.url), "utf8"));
let ok = 0; const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(nome + ": " + JSON.stringify(real) + " != " + JSON.stringify(esperado));
};
const ficha = (sistema, quantidade) => {
  const c = createBlankAfty(); c.rulesVersion = sistema; c.core.nd = 1;
  c.especializacoes = [{ id: "lutador", nivel: 1 }];
  c.addons = quantidade == null ? [] : [{ ...structuredClone(pacote), regrasAfty: { talentosIniciais: quantidade } }];
  return c;
};
const derive = (c) => { AD.aplicarAddons(c.addons); return deriveAfty(c); };
t("JSON instalável", AD.validarPacote(pacote), []);
t("Quantidade inicial", pacote.regrasAfty.talentosIniciais, 1);
for (const n of [0, 5, -1, 1.5, "2", true, null]) {
  t("Recusa quantidade " + JSON.stringify(n), validarRegrasAfty({ talentosIniciais: n }).length, 1);
  t("Não calcula quantidade inválida " + JSON.stringify(n), normalizarRegrasAfty({ talentosIniciais: n }), {});
}
for (const sistema of ["player", "afty"]) {
  const base = derive(ficha(sistema));
  for (const quantidade of [1, 2, 3, 4]) {
    const c = ficha(sistema, quantidade); const d = derive(c);
    t(sistema + ": vagas adicionais " + quantidade, d.habilidades.exclusivasTalento - base.habilidades.exclusivasTalento, quantidade);
    t(sistema + ": pilha comum preservada " + quantidade, d.habilidades.comum, base.habilidades.comum);
    t(sistema + ": canal sem duplicar " + quantidade, valorCanal(d.efeitos, "vagasTalento"), d.habilidades.exclusivasTalento);
    t(sistema + ": escolhe manualmente " + quantidade, d.talentos.escolhidas, []);
    const outra = ficha(sistema);
    t(sistema + ": encontro não empresta bônus " + quantidade, deriveAfty(outra).habilidades.exclusivasTalento, base.habilidades.exclusivasTalento);
  }
  const c = ficha(sistema, 4);
  c.talentos = ["tal_ataque_infalivel", "tal_atencao_infalivel", "tal_guarda_infalivel", "tal_saltador_constante"];
  const d = derive(c);
  t(sistema + ": quatro talentos no exclusivo", d.habilidades.exclusivasUsadas, 4);
  t(sistema + ": não consome comum", d.habilidades.gastosNoComum, 0);
  t(sistema + ": fonte identificada", d.efeitos.detalhes.some((f) => f.canal === "vagasTalento" && f.origem === "talentos-iniciais" && f.nome === "Talentos Iniciais" && f.valor === 4), true);
  c.core.funcionamentosAdicionais = [{ id: "tal_extra", nome: "Outro bônus", efeitos: [{ canal: "vagasTalento", expr: "2" }] }];
  t(sistema + ": acumula com outras fontes", derive(c).habilidades.exclusivasTalento - base.habilidades.exclusivasTalento, 6);
  c.addons = [];
  t(sistema + ": remoção tira só o addon", derive(c).habilidades.exclusivasTalento - base.habilidades.exclusivasTalento, 2);
}
const salva = JSON.parse(JSON.stringify(ficha("player", 3)));
t("Quantidade acompanha exportação", AD.normalizarPacote(salva.addons[0]).regrasAfty.talentosIniciais, 3);
t("Bônus sobrevive à reimportação", derive(salva).habilidades.exclusivasTalento - derive(ficha("player")).habilidades.exclusivasTalento, 3);
AD.limparAddons();
console.log(bad.length ? "FALHAS (" + bad.length + "):\n" + bad.join("\n") : "TODOS OS " + ok + " ASSERTS PASSARAM");
process.exitCode = bad.length ? 1 : 0;
