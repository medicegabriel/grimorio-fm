/* Descanso repara uma Marionete escolhida (autor, 2026-10-03). */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const I = await import(R + "afty-invocacoes.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { redutorDeEncontro } = await import(R + "encontros/usar-encontro-afty.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
aplicarAddons([]);
let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};
const linha = (s, id) => S.estadoDaInvocacao(s, id);
const vitais = (s, id) => {
  const e = linha(s, id);
  return [e.estado, e.pvAtual, e.quedas, e.retorno];
};
for (const sistema of ["afty", "player"]) {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core.nd = 10; c.core.nivel = 10;
  c.especializacoes = [{ id: "controlador", nivel: 10 }];
  const grande = { ...I.createBlankCaracteristica(), id: "grande", subtipo: "tamanho", tamanho: "grande" };
  const inv = (id, tipo = "marionete", extra = {}) => ({ ...I.createBlankInvocacao("quarto", tipo), id, nome: id, ...extra });
  c.invocacoes = [inv("A", "marionete", { caracteristicas: [grande] }), inv("B"),
    inv("C", "marionete", { caracteristicas: [grande] }), inv("D"), inv("H"),
    inv("S", "shikigami"), inv("F", "tecnica", { fundamento: true }), inv("O", "corpo", { natureza: "boneco" })];
  const d = deriveAfty(c, { invocacoes: {} });
  const s = { ...S.sessaoEmBranco(d), hpAtual: 1, peAtual: 2, rodada: 4, usos: { "hab:exemplo": 1 },
    invocacoes: {
      A: { estado: "ativa", pvAtual: 4, quedas: 1, auras: { aura: true }, pvTempFontes: { Mesa: 2 } },
      B: { estado: "recolhida", pvAtual: 0, quedas: 2, retorno: 0.25 },
      C: { estado: "guardada", pvAtual: 7, quedas: 1 },
      D: { estado: "destruida", pvAtual: 0, quedas: 3 },
      S: { estado: "dissipada", pvAtual: 0, retorno: 0.5 },
      F: { estado: "morta", pvAtual: 0, exorcismos: 2 },
      O: { estado: "desativada", pvAtual: -2 },
    },
  };
  const salvo = JSON.stringify(s);
  t(sistema + ": seleção só mostra Marionetes que precisam de reparo", S.marionetesParaReparo(s, d).map((i) => i.id), ["A", "B", "C"]);
  const descansou = S.descansar(s, d, { marioneteId: "B" });
  t(sistema + ": a escolhida recolhida fica disponível, cheia e sem quedas", vitais(descansou, "B"), ["fora", null, 0, null]);
  t(sistema + ": a ativa não escolhida conserva estado, PV e quedas", vitais(descansou, "A"), ["ativa", 4, 1, null]);
  t(sistema + ": a guardada não escolhida conserva estado, PV e quedas", vitais(descansou, "C"), ["guardada", 7, 1, null]);
  t(sistema + ": a destruída não recebe reparo", vitais(descansou, "D"), ["destruida", 0, 3, null]);
  t(sistema + ": as outras invocações continuam recuperando no descanso",
    [vitais(descansou, "S"), vitais(descansou, "O")], [["fora", null, 0, null], ["fora", null, 0, null]]);
  t(sistema + ": o Fundamento morto continua morto", linha(descansou, "F").estado, "morta");
  t(sistema + ": os recursos e usos do dono recuperam junto",
    [descansou.hpAtual, descansou.peAtual, descansou.rodada, descansou.usos], [d.hp, d.pe, 0, {}]);
  t(sistema + ": efeitos de cena expiram mesmo na Marionete não escolhida",
    [linha(descansou, "A").auras, linha(descansou, "A").pvTempFontes], [{}, {}]);
  t(sistema + ": sem escolha não repara nenhuma Marionete",
    ["A", "B", "C", "D"].map((id) => vitais(S.descansar(s, d), id)), ["A", "B", "C", "D"].map((id) => vitais(s, id)));
  for (const id of ["D", "S", "inexistente", ["A", "B"]]) {
    t(sistema + ": escolha inválida não repara nenhuma: " + JSON.stringify(id),
      ["A", "B", "C", "D"].map((i) => vitais(S.descansar(s, d, { marioneteId: id }), i)),
      ["A", "B", "C", "D"].map((i) => vitais(s, i)));
  }
  const ativa = S.descansar(s, d, { marioneteId: "A" });
  t(sistema + ": escolhida ativa continua em campo e é reparada", vitais(ativa, "A"), ["ativa", null, 0, null]);
  t(sistema + ": a recolhida não escolhida conserva a fração de reconstrução", vitais(ativa, "B"), ["recolhida", 0, 2, 0.25]);
  t(sistema + ": uma quebrada escolhida também volta cheia",
    vitais(S.descansar({ ...s, invocacoes: { ...s.invocacoes, B: { ...s.invocacoes.B, estado: "quebrada" } } }, d, { marioneteId: "B" }), "B"), ["fora", null, 0, null]);
  t(sistema + ": próxima escolha deixa a primeira fora da lista", S.marionetesParaReparo(descansou, d).map((i) => i.id), ["A", "C"]);
  t(sistema + ": descanso sem derivados permanece intacto", S.descansar(s, null, { marioneteId: "A" }), s);
  const antiga = { ...s, invocacoes: { A: { emCampo: true, pvAtual: 3, quedas: 1 }, B: { abatida: true, pvAtual: 0, quedas: 2 } } };
  t(sistema + ": sessão antiga conserva PV e retorno da não escolhida",
    vitais(S.descansar(antiga, d, { marioneteId: "A" }), "B"), ["dissipada", 0, 2, 0.5]);
  const m = S.formaMecha({ ...s, invocacoes: { ...s.invocacoes, C: { estado: "ativa", pvAtual: 7, quedas: 1 } } }, d, "A", "C");
  const dm = deriveAfty(c, { invocacoes: m.invocacoes });
  const ferido = S.aplicaDanoNaMesa(m, dm, "mecha", 5);
  const reparouA = S.descansar(ferido, dm, { marioneteId: "A" });
  t(sistema + ": descanso separa o Mecha antes do reparo",
    [linha(reparouA, "mecha").estado, linha(reparouA, "A").pvAtual, linha(reparouA, "C").pvAtual], ["fora", null, 2]);
  const reparouC = S.descansar(ferido, dm, { marioneteId: "C" });
  t(sistema + ": escolher a menor conserva o PV da principal",
    [linha(reparouC, "A").pvAtual, linha(reparouC, "C").pvAtual], [4, null]);
  const coletivo = redutorDeEncontro({ combatentes: [{ id: "c1", sessao: s }, { id: "c2", sessao: s }, { id: "sem", sessao: s }] },
    { tipo: "DESCANSAR_TODOS", derivados: { c1: d, c2: d }, marionetes: { c1: "A", c2: "B" } });
  t(sistema + ": descanso coletivo respeita uma escolha por combatente",
    coletivo.combatentes.slice(0, 2).map((c) => [vitais(c.sessao, "A"), vitais(c.sessao, "B")]),
    [[["ativa", null, 0, null], ["recolhida", 0, 2, 0.25]], [["ativa", 4, 1, null], ["fora", null, 0, null]]]);
  t(sistema + ": descanso coletivo conserva combatente sem derivados", coletivo.combatentes[2].sessao, s);
  t(sistema + ": nenhuma operação altera a sessão original", JSON.stringify(s), salvo);
}
console.log(bad.length ? `FALHAS (${bad.length}):\n${bad.join("\n")}` : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
