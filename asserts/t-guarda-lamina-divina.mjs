import { register } from "node:module";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { deriveAfty } = await import("../src/systems/afty/afty-derive.js");
const { createBlankAfty } = await import("../src/systems/afty/afty-schema.js");
const AD = await import("../src/systems/afty/afty-addons.js");
const TR = await import("../src/systems/afty/afty-treinamentos.js");
const EQ = await import("../src/systems/afty/afty-equipamentos.js");
const { conteudoDaFicha } = await import("../src/systems/afty/ficha/ficha-conteudo.js");
const pacote = AD.normalizarPacote(JSON.parse(readFileSync(new URL("../addons/guarda-da-lamina-divina.json", import.meta.url), "utf8")));
const id = "guarda-da-lamina-divina:guarda";
let checks = 0;
const eq = (a, b) => { assert.deepEqual(a, b); checks++; };
eq(AD.validarPacote(pacote), []);
const espada = EQ.ARMAS.find((a) => a.grupo === "espada" && a.dano?.dado === "1d8");
const faca = EQ.ARMAS.find((a) => a.grupo === "faca" && a.dano?.dado === "1d6");
assert(espada && faca);
const ficha = (progresso, sistema = "player", prof = null) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema; f.core.nd = 13;
  f.attributes.sabedoria = 14; f.attributes.destreza = 22; f.attrLimite.destreza = 22;
  f.addons = [pacote]; f.treinamentos = { [id]: progresso };
  f.pericias = prof ? { percepcao: prof } : {};
  f.equipamentos.itens = [
    { uid: "espada", tipo: "arma", refId: espada.id, qtd: 1, equipado: true },
    { uid: "faca", tipo: "arma", refId: faca.id, qtd: 1, equipado: true },
  ];
  return f;
};
const derive = (f) => { AD.aplicarAddons(f.addons ?? []); return deriveAfty(f); };
const per = (d) => d.testes.pericias.find((p) => p.id === "percepcao");
const dano = (d, alvo) => d.dano.entradas.find((e) => e.id === alvo);
for (const sistema of ["player", "afty"]) {
  const base = derive(ficha(0, sistema));
  const um = derive(ficha(1, sistema));
  eq(dano(um, "basico"), dano(base, "basico"));
  eq(dano(um, faca.id), dano(base, faca.id));
  eq(per(um).bonus, per(base).bonus);
  eq(um.defesa, base.defesa);
  if (sistema === "player") {
    eq(dano(base, espada.id).gruposDano[0].faces, 8);
    eq(dano(um, espada.id).gruposDano[0].faces, 10);
  } else eq(JSON.stringify(dano(um, espada.id)) !== JSON.stringify(dano(base, espada.id)), true);
  const dois = derive(ficha(2, sistema));
  eq(per(dois).bonus - per(um).bonus, 2);
  for (const prof of [null, "treinado", "mestre"]) {
    const anterior = derive(ficha(2, sistema, prof));
    const f = ficha(3, sistema, prof);
    const textoAntes = JSON.stringify(f);
    const tres = derive(f);
    eq(per(tres).prof, "mestre");
    eq(JSON.stringify(f), textoAntes);
    if (prof === "mestre") eq(per(tres).bonus - per(anterior).bonus, 2);
    else {
      eq(per(tres).bonus, per(derive(ficha(0, sistema, "mestre"))).bonus + 2);
    }
    const guardada = structuredClone(f);
    guardada.equipamentos.itens[0].equipado = false;
    const sem = derive(guardada);
    eq(per(sem).prof, prof);
    const zero = structuredClone(guardada); zero.treinamentos[id] = 0;
    const semBase = derive(zero);
    eq(per(sem).bonus, per(semBase).bonus);
    eq(sem.defesa, semBase.defesa);
  }
  const tres = derive(ficha(3, sistema));
  const quatro = derive(ficha(4, sistema));
  eq(quatro.defesa - tres.defesa, 3);
  const dupla = ficha(4, sistema);
  dupla.equipamentos.itens.push({ uid: "segunda", tipo: "arma", refId: espada.id, qtd: 1, equipado: true });
  const d = derive(dupla);
  eq(d.defesa, quatro.defesa);
  eq(per(d).bonus, per(quatro).bonus);
  const semAddon = ficha(4, sistema); semAddon.addons = [];
  const sem = derive(semAddon);
  eq(sem.defesa, base.defesa);
  eq(per(sem).bonus, per(base).bonus);
  eq(conteudoDaFicha(ficha(4, sistema), quatro).filter((e) => e.grupo === "treinamento").length, 5);
}
AD.aplicarAddons([pacote]);
eq(TR.focosGastos({ [id]: 4 }), 7);
const linha = TR.getTreinamento(id);
eq(TR.avaliarRequisito(linha.etapas[2].requisito, { attrEff: { sabedoria: 13 } }).ok, false);
eq(TR.avaliarRequisito(linha.etapas[2].requisito, { attrEff: { sabedoria: 14 } }).ok, true);
const requisitos = (destreza, sabedoria) => linha.etapas[3].requisito.every((r) =>
  TR.avaliarRequisito(r, { attrEff: { destreza, sabedoria } }).ok);
eq(requisitos(21, 14), false);
eq(requisitos(22, 13), false);
eq(requisitos(22, 14), true);
const semEspada = ficha(4); semEspada.equipamentos.itens[0].refId = "nao-existe";
const des = derive(semEspada);
const semTreino = structuredClone(semEspada); semTreino.treinamentos[id] = 0;
eq(des.defesa, derive(semTreino).defesa);
eq(per(des).bonus, per(derive(semTreino)).bonus);
console.log(`TODOS OS ${checks} ASSERTS PASSARAM`);
