import { register } from "node:module";
import { readFileSync } from "node:fs";
import assertBruto from "node:assert/strict";

/* ⚠ O LANÇADOR SÓ ACEITA A FRASE `TODOS OS <n> ASSERTS PASSARAM` (ver
   `asserts/rodar.mjs`), então este arquivo precisava contar. Ele nasceu com
   `node:assert` cru e uma frase própria no fim, e por isso o `npm run asserts`
   o marcava como FALHOU mesmo quando ele passava inteiro.

   O `node:assert` continua sendo quem decide: ele LANÇA na falha, e o lançador
   também olha o código de saída. O contador aqui só existe para a linha final. */
let ok = 0;
const contar = (fn) => (...args) => { fn(...args); ok += 1; };
const assert = {
  equal: contar(assertBruto.equal),
  notEqual: contar(assertBruto.notEqual),
  deepEqual: contar(assertBruto.deepEqual),
  ok: contar(assertBruto.ok),
};
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const { deriveAfty } = await import("../src/systems/afty/afty-derive.js");
const { createBlankAfty } = await import("../src/systems/afty/afty-schema.js");
const { aplicarAddons, validarPacote, limparAddons } = await import("../src/systems/afty/afty-addons.js");
const { getEquipamento, novaEntradaEquip } = await import("../src/systems/afty/afty-equipamentos.js");
const { estadoForma, alteraArmaTransformavel: altera, avancaArmasTransformaveis, bonusDaForma, armasTransformaveis } = await import("../src/systems/afty/afty-armas-transformaveis.js");
const { PRIMITIVAS, primitivasDaCriatura } = await import("../src/systems/afty/afty-addons.js");
const { gastaPe, proximaRodada, iniciaCombate } = await import("../src/systems/afty/ficha/ficha-sessao.js");
const alteraArmaTransformavel = (s, a, e) => altera(s, a, e, gastaPe);
const pacote = JSON.parse(readFileSync(new URL("../addons/azamaru.json", import.meta.url), "utf8"));
assert.deepEqual(validarPacote(pacote), []);
assert.deepEqual(aplicarAddons([pacote]).problemas, []);
const ficha = createBlankAfty();
ficha.core.nd = 13;
ficha.addons = [pacote];
const id = "azamaru:azamaru";
const def = getEquipamento("arma", id, ficha);
ficha.equipamentos.itens = [novaEntradaEquip("arma", id, def)];
let sessao = { peAtual: 50, rodada: 1, combate: { ativo: true } };
const derivar = () => deriveAfty({ ...ficha, combate: sessao.combate });
const base = derivar();
const arma = base.armasTransformaveis[0];
assert.ok(arma);
assert.equal(arma.bt, 5);
sessao = alteraArmaTransformavel(sessao, arma, "reunir");
assert.equal(sessao.peAtual, 50);
assert.equal(estadoForma(sessao.combate, id).clones, 5);
const reunida = derivar();
/* ⚠ A RÉGUA MUDOU EM 2026-09-07 (autor): *"Reduza os Bônus da Azamaru para 8 de
   Defesa e remova o Reflexos."* Esta ficha tem Maestria 5, então a conta antiga
   (2 × clones) daria 10, e é exatamente esse caso que o teto de 8 corta. */
assert.equal(reunida.defesa - base.defesa, 8);
const reflexos = (d) => d.testes.resistencias.find((r) => r.value === "reflexos").bonus;
assert.equal(reflexos(reunida) - reflexos(base), 0);
const dano = (d) => d.dano.entradas.find((e) => e.id === id);
assert.equal(dano(reunida).ignoraTodaRD, true);
assert.equal(dano(reunida).ignoraImunidade, true);
assert.equal(dano(reunida).removeResistencia, true);
assert.equal(dano(base).ignoraTodaRD, false);
assert.equal(getEquipamento("arma", id, { ...ficha, combate: sessao.combate }).props.pesada, undefined);
/* Um clone a menos com Maestria 5 continua no teto: 4 clones ainda dão 8. */
sessao = alteraArmaTransformavel(sessao, arma, "golpe");
assert.equal(derivar().defesa - base.defesa, 8);
/* O segundo já sai do teto: 3 clones dão 6. */
sessao = alteraArmaTransformavel(sessao, arma, "golpe");
assert.equal(derivar().defesa - base.defesa, 6);
sessao = alteraArmaTransformavel(sessao, arma, "todos");
assert.equal(estadoForma(sessao.combate, id).reserva, 5);
assert.equal(derivar().defesa, base.defesa);
assert.notEqual(dano(derivar()).texto, dano(reunida).texto);
sessao = alteraArmaTransformavel(sessao, arma, "acerto");
assert.equal(estadoForma(sessao.combate, id).reserva, 1);
sessao = avancaArmasTransformaveis({ ...sessao, rodada: 2 });
assert.equal(estadoForma(sessao.combate, id).reserva, 0);
sessao = alteraArmaTransformavel(sessao, arma, "dividir");
assert.equal(alteraArmaTransformavel(sessao, arma, "reunir"), sessao);
sessao = { ...sessao, rodada: 3 };
sessao = alteraArmaTransformavel(sessao, arma, "reunir");
assert.equal(sessao.peAtual, 45);
sessao = avancaArmasTransformaveis(sessao, true);
assert.equal(estadoForma(sessao.combate, id).usos, 0);
sessao = alteraArmaTransformavel(sessao, arma, "reunir");
assert.equal(sessao.peAtual, 45);
const semArma = deriveAfty({ ...ficha, equipamentos: { itens: [] }, combate: sessao.combate });
assert.deepEqual(semArma.armasTransformaveis, []);
assert.deepEqual(deriveAfty({ ...ficha, addons: [], combate: sessao.combate }).armasTransformaveis, []);
const pc = def.criacao;
assert.equal(pc.pcDano + pc.pcCritico + pc.pcPropriedades, pc.pcTotal);
assert.ok(pc.pcDano <= pc.limiteDano && pc.pcPropriedades <= pc.limitePropriedades);
const custos = { fineza: 1, marcial: 1, dupla: 1, apunhaladora: 1, energica: 2,
  mortal: 2, oscilante: 1, ampla: 3, duas_maos: -1 };
for (const props of [def.props, def.formas.reunida.props]) {
  assert.equal(Object.keys(props).reduce((n, k) => n + custos[k], 0), pc.pcPropriedades);
}
ficha.rulesVersion = "player";
const jogador = derivar();
assert.ok(dano(jogador).gruposDano.some((g) => g.faces === 12));
assert.equal(dano(jogador).margemCritico, 18);
assert.equal(dano(jogador).ignoraTodaRD, true);
sessao = alteraArmaTransformavel(sessao, arma, "livre");
sessao = alteraArmaTransformavel(sessao, arma, "acerto");
assert.equal(estadoForma(sessao.combate, id).reserva, 1);
sessao = proximaRodada({ ...sessao, buffs: [], condicoes: [] }, jogador).sessao;
assert.equal(estadoForma(sessao.combate, id).reserva, 0);
sessao = alteraArmaTransformavel(sessao, arma, "dividir");
sessao = { ...sessao, rodada: sessao.rodada + 1, peAtual: 0 };
assert.equal(alteraArmaTransformavel(sessao, arma, "reunir"), sessao);
sessao.peTempFontes = { teste: 5 };
sessao = alteraArmaTransformavel(sessao, arma, "reunir");
assert.equal(sessao.peAtual, 0);
assert.equal(Object.values(sessao.peTempFontes).reduce((n, v) => n + v, 0), 0);
sessao = iniciaCombate(sessao, jogador);
assert.equal(estadoForma(sessao.combate, id).usos, 0);
assert.equal(estadoForma(sessao.combate, id).clones, 0);

/* ============================================================ */
/* REUNIR DEPOIS DE DIVIDIR, FORA DE COMBATE                     */
/* ============================================================ */
/* O autor em 2026-09-07: *"Quando eu clico em Reunir, e depois clico em
   Dividir. Eu não consigo Reunir novamente."*

   A Ficha abre na RODADA 0, que quer dizer "nenhuma cena em andamento", e o
   contador só sobe quando o jogador vira a rodada à mão. `dividir` gravava
   `dividida: sessao.rodada`, e `reunir` recusa quando `dividida === rodada`:
   fora de combate isso é `0 === 0` para sempre, e nada faz a rodada 0 passar. */
const arma0 = { id: "azamaru", nome: "Azamaru", bt: 4 };
let fora = { rodada: 0, peAtual: 30, peTempFontes: {}, combate: {} };
fora = altera(fora, arma0, "reunir", gastaPe);
assert.equal(estadoForma(fora.combate, arma0.id).reunida, true);
fora = altera(fora, arma0, "dividir", gastaPe);
assert.equal(estadoForma(fora.combate, arma0.id).reunida, false);
/* ⚠ O `-1` é o mesmo "nunca dividida" do `estadoForma`, e ele nunca casa com
   rodada nenhuma. Sem isto o valor gravado era 0. */
assert.equal(estadoForma(fora.combate, arma0.id).dividida, -1);
fora = altera(fora, arma0, "reunir", gastaPe);
assert.equal(estadoForma(fora.combate, arma0.id).reunida, true);

/* ⚠ E A REGRA DO LIVRO CONTINUA INTEIRA DENTRO DA CENA: dividiu na rodada 3, só
   reúne na 4. O conserto acima não podia comprar isto de volta. */
let cena = { rodada: 3, peAtual: 30, peTempFontes: {}, combate: {} };
cena = altera(cena, arma0, "reunir", gastaPe);
cena = altera(cena, arma0, "dividir", gastaPe);
assert.equal(estadoForma(cena.combate, arma0.id).dividida, 3);
assert.equal(altera(cena, arma0, "reunir", gastaPe), cena);          // mesma rodada: recusa
const naProxima = altera({ ...cena, rodada: 4 }, arma0, "reunir", gastaPe);
assert.equal(estadoForma(naProxima.combate, arma0.id).reunida, true); // rodada seguinte: passa

/* ============================================================ */
/* O QUE ENTROU EM 2026-09-07                                    */
/* ============================================================ */

/* A PRIMITIVA. O verbo mora no motor, mas os dois canais que ele abriu
   apareciam no seletor de todo mundo, com zero addons instalados. É a lição do
   `hpAtributo`, e agora o pacote precisa pedir. */
assert.ok(PRIMITIVAS.some((p) => p.id === "armaTransformavel"));
assert.deepEqual(pacote.permite, ["armaTransformavel"]);
assert.deepEqual(primitivasDaCriatura({ addons: [pacote] }), ["armaTransformavel"]);
/* ⚠ Quem NÃO tem o pacote não enxerga nada. */
assert.deepEqual(primitivasDaCriatura({ addons: [] }), []);

/* O BÔNUS TEM UM DONO SÓ. O painel mostra estes números e os efeitos os emitem,
   e antes a fórmula estava escrita só dentro dos efeitos.

   ⚠ A RÉGUA DE 2026-09-07: 2 de Defesa por clone com TETO 8, o Reflexos fora, e
   1 dado a cada 2 de Defesa dissipada, terminando em 4. Os dois números que o
   autor nomeou (8 e 4) caem exatos na Maestria 4. */
assert.deepEqual(bonusDaForma({ clones: 4, reserva: 0 }), { defesa: 8, dados: 0 });
assert.deepEqual(bonusDaForma({ clones: 0, reserva: 4 }), { defesa: 0, dados: 4 });
assert.deepEqual(bonusDaForma({ clones: 2, reserva: 2 }), { defesa: 4, dados: 2 });
/* ⚠ O TETO SEGURA ACIMA DA MAESTRIA 4, que é onde "reduza para 8" reduz algo. */
assert.deepEqual(bonusDaForma({ clones: 6, reserva: 6 }), { defesa: 8, dados: 4 });
/* ⚠ E O REFLEXOS NÃO EXISTE MAIS: o campo saiu, e não virou zero. */
assert.equal("reflexos" in bonusDaForma({ clones: 4, reserva: 4 }), false);
/* Lixo não derruba: o painel chama isto a cada render. */
assert.deepEqual(bonusDaForma(null), { defesa: 0, dados: 0 });
assert.deepEqual(bonusDaForma({ clones: "x", reserva: -3 }), { defesa: 0, dados: 0 });

/* FICHA SUJA NÃO DERRUBA O DERIVE. Este módulo roda dentro do `deriveAfty`, e o
   contrato do projeto é que ficha salva sempre abre. Os três campos que ele lê
   podem chegar como qualquer coisa. */
assert.deepEqual(armasTransformaveis({ equipamentos: { itens: "nao-e-lista" } }, [], 4), []);
assert.deepEqual(armasTransformaveis({ equipamentos: { itens: [{ tipo: "arma", equipado: true, refId: "azamaru" }] }, addons: "nao-e-lista" }, undefined, 4), []);
assert.deepEqual(armasTransformaveis(null, null, 4), []);
assert.deepEqual(armasTransformaveis({ equipamentos: { itens: [null, 7] } }, [], 4), []);

limparAddons();
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
