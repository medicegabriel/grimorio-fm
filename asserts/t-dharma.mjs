import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const { createBlankAfty } = await import("../src/systems/afty/afty-schema.js");
const { deriveAfty } = await import("../src/systems/afty/afty-derive.js");
const { sessaoEmBranco, proximaRodada, descansar, aparaSessao } = await import("../src/systems/afty/ficha/ficha-sessao.js");
const { normalizarPacote, validarPacote, aplicarAddons } = await import("../src/systems/afty/afty-addons.js");
const {
  normalizaDharma, adicionarDharma, configurarDharma, girarDharma, anotarDharma,
  registrarDanoDharma, encerrarTurnoDharma, avancarRodadaDharma, efeitosDharma, limiteCuraDharma, resultadosDharma,
} = await import("../src/systems/afty/afty-dharma.js");
let total = 0;
const t = (actual, expected, message) => { assert.deepEqual(actual, expected, message); total++; };
const pacote = normalizarPacote(JSON.parse(readFileSync(new URL("../addons/grande-roda-dharma.json", import.meta.url), "utf8")));
t(validarPacote(pacote), [], "addon importável");
const c = createBlankAfty(); c.addons = [pacote]; c.core.nd = 30;
aplicarAddons(c.addons);
const base = deriveAfty(c);
t(base.dharma.ativo, true, "gate por criatura");
t(deriveAfty({ ...c, addons: [] }).dharma.ativo, false, "outra criatura sem addon");
t(deriveAfty({ ...c, rulesVersion: "2.5.2" }).dharma.ativo, false, "gate por rulesVersion");
const d = { ...base, nd: 30, maestria: 8, mods: { ...base.mods, constituicao: 10 }, hp: 1000 };
let s = { ...sessaoEmBranco(d), hpAtual: 100, rodada: 1 };
function add(tipo, nome, tipoDano = "") {
  s = adicionarDharma(s, d, { tipo, nome, tipoDano });
  return s.dharma.entradas.at(-1).id;
}
const geral = add("geral", "Fogo");
const fogo = add("defesa", "Fogo", "queimante");
const gelo = add("defesa", "Gelo", "congelante");
const atq = add("ataque", "Sukuna");
const ex = add("existencia", "Sukuna");
const outro = add("existencia", "Gojo");
t(adicionarDharma(s, d, { tipo: "defesa", nome: "Alma", tipoDano: "alma" }), s, "alma proibida");
t(adicionarDharma(s, d, { tipo: "defesa", nome: "Reversa", tipoDano: "energia_reversa" }), s, "reversa proibida");
t(adicionarDharma(s, d, { tipo: "geral", nome: " FÓGO " }), s, "duplicata normalizada");
t(adicionarDharma(s, d, { tipo: "defesa", nome: "Outro fogo", tipoDano: "queimante" }), s, "duplicata de dano");
t(girarDharma(s, d, outro), s, "um alvo de existência por vez");
s = anotarDharma(s, d, geral, { dano: 500, notas: "Domínio" });
t(limiteCuraDharma(d), 300, "ND vezes mod Constituição");
t(limiteCuraDharma({ nd: 20, mods: { constituicao: -1 } }), 0, "limite não negativo");
for (let rodada = 1; rodada <= 3; rodada++) {
  s = { ...s, rodada };
  for (const id of [geral, fogo, gelo, atq, ex]) {
    s = girarDharma(s, d, id); s = girarDharma(s, d, id);
    t(girarDharma(s, d, id), s, "terceiro giro bloqueado por entrada");
  }
  t(s.dharma.entradas.find((e) => e.id === gelo).giros, rodada * 2, "gelo independente do fogo");
}
t(s.hpAtual, 400, "cura Geral automática limitada a 300");
t(s.dharma.entradas.find((e) => e.id === geral).curaGeral, 300, "registro de cura");
t(girarDharma({ ...s, rodada: 4 }, d, geral).hpAtual, 400, "cura não repete no teto");
t(anotarDharma(s, d, geral, { dano: 999 }).dharma.entradas[0].dano, 500, "dano fechado após giro seis");
s = configurarDharma(s, d, { alvo: "Sukuna", fenomeno: geral });
let efeitos = efeitosDharma(c, s.dharma);
t(efeitos.filter((e) => e.canal === "dadosDano").reduce((n, e) => n + Number(e.expr), 0), 4, "Ataque e Existência somam quatro dados");
t(efeitos.some((e) => e.canal === "rdGeral" && e.expr === "2 * bt"), true, "Geral RD dobro BT");
t(efeitos.some((e) => e.canal === "rdTipo" && e.alvo === "queimante"), true, "Defesa RD acumula com Geral");
t(efeitosDharma({ ...c, addons: [] }, s.dharma), [], "estado órfão inerte");
const calculado = deriveAfty(c, { dharma: s.dharma });
t(calculado.testes.ataques[0].bonus - base.testes.ataques[0].bonus, 2 * base.maestria, "acerto no derive real");
t(calculado.rdGeral - base.rdGeral, 2 * base.maestria, "RD Geral no derive real");
t(calculado.defesasDano.porTipo.queimante.rd - base.defesasDano.porTipo.queimante.rd, 3 * base.maestria, "Geral e Defesa somam RD real");
t(calculado.defesasDano.porTipo.queimante.estados, ["imune"], "imunidade da roda sem conflito com sua resistência anterior");
// Marco 2: RD acumulada antes de resistência e imunidade, com BTs diferentes.
for (const [nd, bt] of [[17, 6], [30, 8]]) {
  const criatura = { ...c, core: { ...c.core, nd } };
  const semRoda = deriveAfty(criatura);
  const estado = { ...s.dharma, entradas: s.dharma.entradas.map((e) => ({ ...e, giros: 2 })) };
  const comRoda = deriveAfty(criatura, { dharma: estado });
  const semFenomeno = deriveAfty(criatura, { dharma: { ...estado, fenomeno: "" } });
  t(semRoda.maestria, bt, `BT da ficha ND ${nd}`);
  t(comRoda.defesasDano.porTipo.queimante.rd - semRoda.defesasDano.porTipo.queimante.rd, 3 * bt, `Geral e Defesa somam ${3 * bt} RD com BT ${bt}`);
  t(comRoda.defesasDano.porTipo.ct.rd - semRoda.defesasDano.porTipo.ct.rd, 2 * bt, "tipo sem adaptação recebe apenas Geral");
  t(semFenomeno.defesasDano.porTipo.queimante.rd - semRoda.defesasDano.porTipo.queimante.rd, bt, "sem fenômeno selecionado recebe apenas Defesa");
  t(comRoda.rdAlma - semRoda.rdAlma, 2 * bt, "Geral cobre caminho separado de Alma sem conceder Defesa de Alma");
  t(resultadosDharma(estado.entradas.find((e) => e.id === geral), semRoda)[0], `RD ${2 * bt}`, "resultado de Geral acompanha BT");
  t(resultadosDharma(estado.entradas.find((e) => e.id === fogo), semRoda)[0], `RD ${bt}`, "resultado de Defesa acompanha BT");
}
s = configurarDharma(s, d, { alvo: "Gojo", fenomeno: "" });
efeitos = efeitosDharma(c, s.dharma);
t(efeitos.some((e) => ["bonusAcerto", "dadosDano", "rdGeral"].includes(e.canal)), false, "não vaza para outro alvo ou fenômeno");
const curado = registrarDanoDharma(s, d, fogo, 0);
t(curado.hpAtual, 424, "imunidade cura três BT por exposição");
t(curado.dharma.entradas.find((e) => e.id === fogo).curaPendente, false, "sem dano não agenda cura do turno");
let parcial = { ...s, dharma: { ...s.dharma, entradas: s.dharma.entradas.map((e) => e.id === fogo ? { ...e, giros: 4 } : e) } };
parcial = registrarDanoDharma(parcial, d, fogo, 10);
parcial = registrarDanoDharma(parcial, d, fogo, 20);
t(parcial.hpAtual, 400, "registro não desconta dano duas vezes");
parcial = encerrarTurnoDharma(parcial, d);
t(parcial.hpAtual, 416, "cura uma vez por tipo por turno");
t(encerrarTurnoDharma(parcial, d).hpAtual, 416, "não repete encerramento");
t(registrarDanoDharma({ ...s, hpAtual: 999 }, d, fogo, 0).hpAtual, 1000, "cura não ultrapassa PV máximo");
t(aparaSessao(s, d).dharma, normalizaDharma(s.dharma), "persistência na normalização");
t(descansar(s, d).dharma.entradas, [], "descanso encerra cena");
let automatico = configurarDharma(s, d, { existencia: outro });
automatico = anotarDharma(automatico, d, outro, { confronto: true });
for (let i = 0; i < 6; i++) automatico = avancarRodadaDharma({ ...automatico, rodada: 10 + i }, d);
t(automatico.dharma.entradas.find((e) => e.id === outro).giros, 1, "seis rodadas de confronto geram giro");
automatico = anotarDharma(automatico, d, outro, { confronto: false });
t(automatico.dharma.entradas.find((e) => e.id === outro).rodadasConfronto, 0, "interrupção zera consecutivas");
t(proximaRodada(s, d).sessao.dharma.entradas[0].giros, 6, "virada mantém giros completos");
t(normalizaDharma({ entradas: [null, {}, { id: "x", tipo: "defesa", nome: "Alma", tipoDano: "alma" }] }).entradas, [], "estado malformado saneado");
const semAddon = { ...d, dharma: { ativo: false } };
t(girarDharma(s, semAddon, outro), s, "sem addon não gira");
t(registrarDanoDharma(s, semAddon, fogo, 0), s, "sem addon não cura");
const persistida = JSON.parse(JSON.stringify(s));
t(normalizaDharma(persistida.dharma), normalizaDharma(s.dharma), "serialização conserva dano, giros e notas");
console.log(`TODOS OS ${total} ASSERTS PASSARAM`);
