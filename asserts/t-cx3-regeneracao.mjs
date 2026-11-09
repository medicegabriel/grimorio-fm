import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { criarEncontro, criarCombatente, definirIniciativa } = await import(R + "encontros/afty-encontro.js");
const { redutorDeEncontro } = await import(R + "encontros/usar-encontro-afty.js");
const { opcoesDeriveDaSessao } = await import(R + "ficha/ficha-opcoes-derive.js");
let ok = 0;
const bad = [], t = (nome, real, esperado) => JSON.stringify(real) === JSON.stringify(esperado) ? ok++ : bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
const ficha = (sistema, nivel = 20) => {
  aplicarAddons([]);
  const c = createBlankAfty(); c.rulesVersion = sistema; c.id = "sobrevivente"; c.name = "Sobrevivente"; c.core.nd = nivel;
  c.attrMethod = "fixos"; c.attributes = { forca: 14, destreza: 12, constituicao: 15, inteligencia: 10, sabedoria: 13, presenca: 8 };
  c.core.origem = { id: "inato", bonusAtributos: { constituicao: 2, destreza: 1 } }; c.attrNivel = {};
  c.especializacoes = [{ id: "lutador", nivel }]; c.pericias = { atletismo: "treinado", feiticaria: "treinado" };
  c.habilidades = ["lut_sobrevivente"]; c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
  return c;
};
const comRng = (fn) => { const anterior = Math.random; Math.random = () => 0.999; try { return fn(); } finally { Math.random = anterior; } };
for (const sistema of ["player", "afty"]) {
  for (const [nivel, dados] of [[4, 1], [8, 2], [12, 3], [16, 4], [20, 5]]) {
    const c = ficha(sistema, nivel), d = deriveAfty(c), s = { ...S.sessaoEmBranco(d), hpAtual: 1 };
    t(`${sistema} Sobrevivente ${nivel} admissível`, d.habilidades.inacessiveis, []);
    t(`${sistema} Sobrevivente ${nivel} conta própria`, [d.conteudoRegeneracoes.lut_sobrevivente.pedido.dados, d.conteudoRegeneracoes.lut_sobrevivente.pedido.faces, d.conteudoRegeneracoes.lut_sobrevivente.pedido.fixo], [dados, 6, 3]);
    const turno = S.iniciaTurnoFicha(s, d, () => 0.999);
    t(`${sistema} Sobrevivente ${nivel} cura no início do turno`, turno.hpAtual, 1 + dados * 6 + 3);
    t(`${sistema} Sobrevivente ${nivel} rolagem e identidade`, [turno.log[0].rotulo, turno.log[0].tom, turno.log[0].dados.length], ["Sobrevivente", "cura", dados]);
    t(`${sistema} Sobrevivente ${nivel} conserva fontes da cura`, turno.log[0].fontes.map((x) => x.label), ["Sobrevivente", "Sobrevivente"]);
    t(`${sistema} Sobrevivente ${nivel} sem gasto de PE ou ação`, [turno.peAtual, turno.uso.acoes.gastas], [s.peAtual, { comum: 0, bonus: 0, movimento: 0 }]);
    const metade = { ...s, hpAtual: Math.ceil(d.hp / 2) }, acima = S.iniciaTurnoFicha(metade, d, () => 0.999);
    t(`${sistema} Sobrevivente ${nivel} só abaixo da metade`, [acima.hpAtual, acima.log.length], [metade.hpAtual, 0]);
    const inconsciente = S.defineCondicoes(s, [{ id: "inconsciente", nome: "Inconsciente" }]);
    t(`${sistema} Sobrevivente ${nivel} não cura Inconsciente`, S.iniciaTurnoFicha(inconsciente, d).hpAtual, s.hpAtual);
    const paralisado = S.defineCondicoes(s, [{ id: "paralisado", nome: "Paralisado" }]);
    t(`${sistema} Sobrevivente ${nivel} não exige gastar ação`, S.iniciaTurnoFicha(paralisado, d, () => 0.999).hpAtual, turno.hpAtual);
    const portas = S.aplicaDano({ ...s, hpAtual: 10 }, 20, d);
    t(`${sistema} Sobrevivente ${nivel} não tira das Portas`, [S.iniciaTurnoFicha(portas, d).hpAtual, S.iniciaTurnoFicha(portas, d).vital.saldo], [0, portas.vital.saldo]);
    const morto = S.aplicaDano(s, 9999, d);
    t(`${sistema} Sobrevivente ${nivel} não ressuscita`, [morto.vital.estado, S.iniciaTurnoFicha(morto, d).hpAtual], ["morto", 0]);
    const sem = deriveAfty({ ...c, habilidades: [] });
    t(`${sistema} Sobrevivente ${nivel} exige fonte atual`, S.iniciaTurnoFicha(s, sem).hpAtual, 1);
    const relida = S.normalizaSessao(JSON.parse(JSON.stringify(turno)), d);
    t(`${sistema} Sobrevivente ${nivel} releitura não cura de novo`, [relida.hpAtual, relida.log.length], [turno.hpAtual, turno.log.length]);
    const rodada = comRng(() => S.proximaRodada(s, d).sessao);
    t(`${sistema} Sobrevivente ${nivel} rodada da ficha entrega uma cura`, [rodada.hpAtual, rodada.log.filter((r) => r.rotulo === "Sobrevivente").length], [turno.hpAtual, 1]);
  }
  const c = ficha(sistema), d = deriveAfty(c), outro = { ...c, id: "outro", name: "Outro" };
  let encontro = criarEncontro({ nome: "Regeneração" });
  encontro.combatentes = [c, outro].map((f, i) => { const a = definirIniciativa(criarCombatente(f, { derived: d }), i ? 10 : 20); return { ...a, sessao: { ...a.sessao, hpAtual: 1 } }; });
  const derivados = Object.fromEntries(encontro.combatentes.map((a) => [a.id, d]));
  const inicio = comRng(() => redutorDeEncontro(encontro, { tipo: "COMECAR", derivados }));
  t(`${sistema} primeiro turno de Encontro cura só o ativo`, inicio.combatentes.map((a) => a.sessao.hpAtual), [34, 1]);
  t(`${sistema} primeiro turno nativo é iniciado uma vez`, inicio.combatentes.map((a) => a.sessao.uso.acoes.turno), [1, 0]);
  const proximo = comRng(() => redutorDeEncontro(inicio, { tipo: "PROXIMO_TURNO", derivados }));
  t(`${sistema} turno seguinte cura só o próximo`, proximo.combatentes.map((a) => a.sessao.hpAtual), [34, 34]);
  t(`${sistema} cura do primeiro não duplica ao passar turno`, proximo.combatentes[0].sessao.log.filter((r) => r.rotulo === "Sobrevivente").length, 1);
  const voltou = redutorDeEncontro(inicio, { tipo: "COMECAR", derivados });
  t(`${sistema} combate já iniciado não inicia outro turno`, voltou === inicio, true);

  const res = ficha(sistema); res.core.origem = { id: "restringido" }; res.core.tipo = "restringido";
  res.especializacoes = [{ id: "restringido", nivel: 20 }]; res.habilidades = ["res_corpo_de_aco", "res_roubo_de_habilidade"];
  res.escolhasHabilidade = { res_roubo_de_habilidade: ["lut_sobrevivente"] }; res.combate = { ...res.combate, ativo: true, corpoDeAco: 1, machucado: true };
  const dr = deriveAfty(res), sr = { ...S.sessaoEmBranco(dr), combate: dr.combate, hpAtual: 1 };
  t(`${sistema} Corpo de Aço com Sobrevivente roubado admissível`, dr.habilidades.inacessiveis, []);
  t(`${sistema} duas fontes conservam faces próprias`, [dr.conteudoRegeneracoes.res_corpo_de_aco.pedido.faces, dr.conteudoRegeneracoes.lut_sobrevivente.pedido.faces], [8, 6]);
  const rr = S.iniciaTurnoFicha(sr, dr, () => 0.999), dadosAco = dr.conteudoRegeneracoes.res_corpo_de_aco.pedido.dados, dadosSobrev = dr.conteudoRegeneracoes.lut_sobrevivente.pedido.dados;
  t(`${sistema} duas fontes produzem rolagens próprias`, rr.log.filter((r) => r.tom === "cura").map((r) => r.rotulo).sort(), ["Corpo de Aço", "Sobrevivente"]);
  t(`${sistema} Corpo de Aço não usa faces da outra regeneração`, rr.log.find((r) => r.rotulo === "Corpo de Aço").total, dadosAco * 8 + dr.mods.constituicao);
  t(`${sistema} Sobrevivente não usa faces do Corpo de Aço`, rr.log.find((r) => r.rotulo === "Sobrevivente").total, dadosSobrev * 6 + dr.mods.constituicao);
  t(`${sistema} estado relido conserva cada cura`, S.normalizaSessao(JSON.parse(JSON.stringify(rr)), dr).log.filter((r) => r.tom === "cura").length, 2);
  const ds = deriveAfty({ ...res, combate: { ...res.combate, corpoDeAco: 0 } }, opcoesDeriveDaSessao({ ...sr, combate: { ...sr.combate, corpoDeAco: 0 } }));
  const desligada = S.iniciaTurnoFicha({ ...sr, combate: { ...sr.combate, corpoDeAco: 0 } }, ds, () => 0.999);
  t(`${sistema} desligar Corpo de Aço conserva só Sobrevivente`, desligada.log.filter((r) => r.tom === "cura").map((r) => r.rotulo), ["Sobrevivente"]);
}
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
