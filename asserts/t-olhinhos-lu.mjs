import { register } from "node:module";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { deriveAfty } = await import("../src/systems/afty/afty-derive.js");
const { createBlankAfty } = await import("../src/systems/afty/afty-schema.js");
const AD = await import("../src/systems/afty/afty-addons.js");
const { conteudoDaFicha } = await import("../src/systems/afty/ficha/ficha-conteudo.js");
const { resolveTestes } = await import("../src/systems/afty/afty-pericias.js");
const { aplicarEfeitos } = await import("../src/systems/afty/afty-efeitos.js");
const { LENDARIA_EFEITOS, TALENTO_EFEITOS } = await import("../src/systems/afty/afty-efeitos-conteudo.js");
const { descansar, sessaoEmBranco } = await import("../src/systems/afty/ficha/ficha-sessao.js");
const { derivarCombatente } = await import("../src/systems/afty/encontros/usar-encontro-afty.js");
const pacote = AD.normalizarPacote(JSON.parse(readFileSync(new URL("../addons/olhinhos-lu.json", import.meta.url))));
let checks = 0;
const eq = (a, b) => { assert.deepEqual(a, b); checks++; };
const { ESTADO_OLHOS_LU: olho, ESTADO_ATENCAO_LU: atencao, alteraOlhinhosLu, resolveOlhinhosLu } = await import("../src/systems/afty/afty-olhinhos-lu.js");
const derive = (f, opcoes = {}) => { AD.aplicarAddons(f.addons ?? []); return deriveAfty({ ...f, combate: { ...f.combate, ...opcoes.combate } }, opcoes); };
eq(AD.validarPacote(pacote), []);
for (const sistema of ["afty", "player"]) {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core.nd = 20;
  f.aptidoes = { cl: 3 };
  f.addons = [pacote];
  f.core.tecnicaEfeitos = [
    { canal: "bonusPericia", alvo: "percepcao", expr: "7" },
    { canal: "bonusPericia", alvo: "intuicao", expr: "2" },
    { canal: "atencao", expr: "4" },
  ];
  const original = JSON.stringify(f);
  const base = derive(f);
  const pericia = (d, id) => d.testes.pericias.find((p) => p.id === id);
  const fechado = derive(f, { combate: { [olho]: 1 } });
  eq(pericia(fechado, "intuicao").bonus - pericia(base, "intuicao").bonus, 9);
  eq(fechado.atencao, base.atencao);
  const trocado = derive(f, { combate: { [olho]: 1, [atencao]: 1 } });
  eq(trocado.atencao, 10 + pericia(fechado, "intuicao").bonus + 7 + 4);
  eq(pericia(trocado, "intuicao").bonus, pericia(fechado, "intuicao").bonus);
  eq(pericia(trocado, "percepcao").bonus, pericia(base, "percepcao").bonus);
  eq(trocado.testes.orcamento, base.testes.orcamento);
  eq(trocado.partes.atencao.reduce((s, p) => s + (p.valor ?? 0), 0), trocado.atencao);
  eq(trocado.testes.atencaoPericia, "intuicao");
  eq(derive(f, { combate: { [atencao]: 1 } }).atencao, base.atencao);
  eq(trocado.combate.estadosExtras.filter(e => [olho, atencao].includes(e.id)).length, 2);
  eq(conteudoDaFicha(f, trocado).find((i) => i.grupo === "corporal").texto, pacote.descricao);
  eq(JSON.stringify(f), original);
  const removido = { ...f, addons: [], combate: { [olho]: 1, [atencao]: 1 } };
  const semAddon = derive(removido);
  eq(semAddon.atencao, base.atencao);
  eq(semAddon.olhinhosLu.tem, false);
  const gravado = JSON.parse(JSON.stringify({ ...f, combate: { [olho]: 1, [atencao]: 1 } }));
  eq(derive(gravado).atencao, trocado.atencao);
  eq(derive(gravado, { combate: { [olho]: 0 } }).atencao, base.atencao);
  const sessao = { ...sessaoEmBranco(trocado), combate: { [olho]: 1, [atencao]: 1 } };
  eq(descansar(sessao, trocado).combate[olho], 1);
  eq(derivarCombatente({ ficha: f, sessao }).atencao, trocado.atencao);
  eq(derive(f, { combate: { [olho]: true, [atencao]: true, ativo: true } }).atencao, trocado.atencao);
  eq(trocado.olhinhosLu.bonusIntuicao, 9);
  eq(alteraOlhinhosLu(sessao, olho, false).combate[olho], false);
  eq(alteraOlhinhosLu(sessao, atencao, false).combate[olho], 1);
  const antiga = { ...f, origemContadores: {
    "olhinhos-lu:olhos_fechados": 1, "olhinhos-lu:atencao_intuicao": 1,
  } };
  eq(derive(antiga).atencao, trocado.atencao);
  eq(derive(antiga, { combate: { [olho]: false } }).atencao, base.atencao);
}
// Ofertas, treino concedido, bônus global e dados são transferidos só na cópia
// usada por Atenção. A entrada da ficha e os efeitos não são alterados.
const f = createBlankAfty();
const ef = aplicarEfeitos([
  { canal: "periciaAtencao", alvo: "intuicao", expr: "1" },
  { canal: "bonusPericia", alvo: "percepcao", expr: "5", nome: "Talento" },
  { canal: "bonusPericia", expr: "2", nome: "Geral" },
  { canal: "proficienciaPericia", alvo: "percepcao", expr: "2", nome: "Lendária" },
  { canal: "dadosPericia", alvo: "percepcao:d4", expr: "1" },
]);
const antes = JSON.stringify(ef);
const d = resolveTestes(f, { nd: 10, bt: 4, mods: {}, efeitos: ef });
const i = d.pericias.find((p) => p.id === "intuicao");
eq(d.atencao, 10 + i.bonus + 5 + 6);
eq(d.atencaoPartes.filter((p) => p.label === "Geral").length, 1);
eq(d.pericias.find((p) => p.id === "intuicao").dadosExtras, undefined);
eq(JSON.stringify(ef), antes);
const fixo = aplicarEfeitos([
  { canal: "periciaAtencao", alvo: "intuicao", expr: "1" },
  { canal: "periciaFixa", alvo: "percepcao", expr: "60", nome: "Oferta" },
]);
eq(resolveTestes(f, { nd: 10, bt: 4, mods: {}, efeitos: fixo }).atencao, 70);
const iguais = aplicarEfeitos([
  { canal: "periciaAtencao", alvo: "intuicao", expr: "1" },
  { canal: "proficienciaPericia", alvo: "intuicao", expr: "1" },
  { canal: "proficienciaPericia", alvo: "percepcao", expr: "1" },
]);
eq(resolveTestes(f, { nd: 10, bt: 4, mods: {}, efeitos: iguais }).atencao,
  resolveTestes(f, { nd: 10, bt: 4, mods: {}, efeitos: iguais, semTrocaAtencao: true }).atencao);
const reais = aplicarEfeitos([
  { canal: "periciaAtencao", alvo: "intuicao", expr: "1" },
  ...LENDARIA_EFEITOS.len_um_com_o_mundo,
  ...TALENTO_EFEITOS.tal_atencao_infalivel,
]);
const dr = resolveTestes(f, { nd: 10, bt: 4, mods: {}, efeitos: reais });
eq(dr.atencao, dr.pericias.find((p) => p.id === "intuicao").bonus + 20);
eq(resolveOlhinhosLu({ tem: true, fechados: true, cl: 1.5 }).bonusIntuicao, 5);
console.log(`TODOS OS ${checks} ASSERTS PASSARAM`);
