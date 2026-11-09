import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { usaCuraConteudo, usaSintonizacaoVital, curasParaSintonizar } = await import(R + "ficha/ficha-conteudo-uso.js");
const { rolarDano } = await import(R + "ficha/ficha-rolagem.js");
let ok = 0, seq = 0;
const bad = [], t = (n, a, b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : bad.push(`${n}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
const p = () => ({ opId: `sintonizacao-${++seq}`, registraAcao: true });
function ficha(sistema, id) {
  const c = createBlankAfty(); c.id = id; c.name = id; c.rulesVersion = sistema; c.core.nd = 6;
  c.attrMethod = "fixos"; c.attributes = { forca: 14, destreza: 12, constituicao: 13, inteligencia: 10, sabedoria: 15, presenca: 8 };
  c.core.origem = { id: "inato", bonusAtributos: { forca: 2, sabedoria: 1 } };
  c.especializacoes = [{ id: "suporte", nivel: 6 }]; c.pericias = { medicina: "treinado", feiticaria: "treinado" };
  c.habilidades = ["sup_suporte_em_combate", "sup_sintonizacao_vital"];
  c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : []; return c;
}
aplicarAddons([]);
for (const sistema of ["player", "afty"]) {
  const c = ficha(sistema, "suporte"), ca = ficha(sistema, "primeiro"), cb = ficha(sistema, "segundo");
  const d = deriveAfty(c), da = deriveAfty(ca), db = deriveAfty(cb);
  const inicio = d => ({ ...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d), d), d), rodada: 1 });
  const s = { ...inicio(d), hpAtual: d.hp - 20 }, sa = { ...inicio(da), hpAtual: da.hp - 6 }, sb = { ...inicio(db), hpAtual: 1 };
  const turnoEmCurso = { id: "suporte", rodada: 1, turno: s.uso.acoes.turno };
  const cura = (entrada = {}, inicial = s) => {
    let i = 0;
    return usaCuraConteudo(inicial, d, { id: "cura_suporte_em_combate", aliado: true, alvoId: "primeiro", turnoEmCurso,
      rng: () => [0.6, 0.7][i++], ...entrada }, p(), { sessao: sa, derived: da });
  };
  const r = cura(); if (!r.aplicado) throw Error(r.erro);
  const entrada = { curaId: r.rolagem.id, alvoId: "segundo", emAlcance: true, descontarPE: true, turnoEmCurso };
  const externo = (s, e = {}, pedido = p(), alvo = { sessao: sb, derived: db }, der = d) => usaSintonizacaoVital(s, der, { ...entrada, ...e }, pedido, alvo);
  t(`${sistema} origem, nível, habilidades e orçamento válidos`, [d.habilidades.inacessiveis, d.habilidades.excedeu, da.habilidades.inacessiveis], [[], false, []]);
  t(`${sistema} cura real de vinte recupera apenas seis`, [r.cura, r.sessaoAlvo.hpAtual - sa.hpAtual, r.rolagem.contextoCura.valor, r.rolagem.contextoCura.recuperado], [20, 6, 20, 6]);
  t(`${sistema} recibo identifica aliado, uso e turno`, [r.rolagem.contextoCura.alvoId, r.rolagem.contextoCura.aliado, curasParaSintonizar(r.sessao, turnoEmCurso).map(r => r.id)], ["primeiro", true, [r.rolagem.id]]);
  const pedido = p(), rr = externo(r.sessao, {}, pedido); if (!rr.aplicado) throw Error(rr.erro);
  t(`${sistema} decisão: segunda criatura recebe dez`, [rr.cura, rr.sessaoAlvo.hpAtual - sb.hpAtual, rr.registro.recuperado], [10, 10, 10]);
  t(`${sistema} custo três pertence ao suporte`, [r.sessao.peAtual - rr.sessao.peAtual, rr.sessaoAlvo.peAtual], [3, sb.peAtual]);
  t(`${sistema} decisão: sem outra ação de qualquer participante`, [rr.sessao.uso.acoes, rr.sessaoAlvo.uso.acoes], [r.sessao.uso.acoes, sb.uso.acoes]);
  t(`${sistema} fontes usam cura anterior ao teto`, rr.registro.fontes, [{ label: r.rolagem.rotulo, valor: 20 }, { label: "Sintonização Vital", texto: "Metade da Cura" }]);
  t(`${sistema} conserva rolagem e registra vínculo único`, [rr.sessao.log.find(x => x.id === r.rolagem.id).dados, rr.sessao.log.find(x => x.id === r.rolagem.id).sintonizacaoVital.valor], [r.rolagem.dados, 10]);
  t(`${sistema} confirmação repetida não debita`, externo(rr.sessao, {}, pedido).repetida, true);
  t(`${sistema} nova operação não repete a mesma cura`, externo(rr.sessao).sessao === rr.sessao, true);
  t(`${sistema} segunda cura não gera cascata`, curasParaSintonizar(rr.sessao, turnoEmCurso), []);
  const lida = S.normalizaSessao(JSON.parse(JSON.stringify(rr.sessao)), d), alvoLido = S.normalizaSessao(JSON.parse(JSON.stringify(rr.sessaoAlvo)), db);
  t(`${sistema} vínculo e custo persistem`, [lida.peAtual, lida.uso.acoes, alvoLido.hpAtual, externo(lida).sessao === lida], [rr.sessao.peAtual, rr.sessao.uso.acoes, 11, true]);
  const propia = usaSintonizacaoVital(r.sessao, d, { ...entrada, alvoId: null }, p());
  t(`${sistema} pode curar o próprio suporte`, [propia.aplicado, propia.sessao.hpAtual - r.sessao.hpAtual, r.sessao.peAtual - propia.sessao.peAtual, propia.sessao.uso.acoes], [true, 10, 3, r.sessao.uso.acoes]);
  t(`${sistema} fonte original recebe marca também na cura própria`, curasParaSintonizar(propia.sessao, turnoEmCurso), []);
  const cap = externo(r.sessao, {}, p(), { sessao: { ...sb, hpAtual: db.hp - 2 }, derived: db });
  t(`${sistema} segunda cura também respeita teto de PV`, [cap.cura, cap.sessaoAlvo.hpAtual, cap.registro.recuperado], [10, db.hp, 2]);
  const manual = externo(r.sessao, { descontarPE: false });
  t(`${sistema} política manual mantém cobrança explícita`, [manual.aplicado, manual.sessao.peAtual, manual.custo.pe.naoDescontado], [true, r.sessao.peAtual, 3]);
  for (const [nome, e] of [["sem alcance", { emAlcance: false }], ["mesmo destinatário", { alvoId: "primeiro" }], ["alvo sem identidade", { alvoId: null }], ["cura inexistente", { curaId: "ausente" }], ["outro turno em curso", { turnoEmCurso: { ...turnoEmCurso, id: "outro" } }], ["nova sequência de turno", { turnoEmCurso: { ...turnoEmCurso, turno: turnoEmCurso.turno + 1 } }], ["sem contexto do Encontro", { turnoEmCurso: null }]]) {
    t(`${sistema} ${nome} recusa sem cobrar`, externo(r.sessao, e).sessao === r.sessao, true);
  }
  const pobre = { ...r.sessao, peAtual: 2, peTemp: [] };
  t(`${sistema} sem PE não cura nem cobra`, externo(pobre).sessao === pobre, true);
  for (const estado of ["morto", "morrendo"]) {
    const incapaz = { ...r.sessao, hpAtual: 0, vital: { ...r.sessao.vital, estado } };
    t(`${sistema} suporte ${estado} não aciona a segunda cura`, externo(incapaz).sessao === incapaz, true);
  }
  const morto = { ...sb, vital: { ...sb.vital, estado: "morto" } };
  t(`${sistema} não revive corpo morto`, externo(r.sessao, {}, p(), { sessao: morto, derived: db }).sessao === r.sessao, true);
  for (const nome of ["Atordoado", "Paralisado", "Inconsciente", "Indefeso"]) {
    const impedida = S.defineCondicoes(r.sessao, [{ id: nome, nome }]);
    t(`${sistema} ${nome} recusa sem custo`, externo(impedida).sessao === impedida, true);
  }
  const semHab = deriveAfty({ ...c, habilidades: ["sup_suporte_em_combate"] });
  t(`${sistema} exige habilidade atual`, externo(r.sessao, {}, p(), undefined, semHab).sessao === r.sessao, true);
  const baixo = deriveAfty({ ...c, core: { ...c.core, nd: 2 }, especializacoes: [{ id: "suporte", nivel: 2 }] });
  t(`${sistema} habilidade inacessível não aplica`, externo(r.sessao, {}, p(), undefined, baixo).sessao === r.sessao, true);
  t(`${sistema} nova rodada invalida a janela`, curasParaSintonizar(S.proximaRodada(r.sessao, d).sessao, turnoEmCurso), []);
  t(`${sistema} novo turno invalida a janela`, curasParaSintonizar(S.iniciaTurnoFicha(r.sessao, d), turnoEmCurso), []);
  t(`${sistema} cura a não aliado não libera`, curasParaSintonizar(cura({ aliado: false }).sessao, turnoEmCurso), []);
  t(`${sistema} alvo não identificado não libera`, curasParaSintonizar(cura({ alvoId: null }).sessao, turnoEmCurso), []);
  const dados = rolarDano({ rotulo: "Cura Avulsa", tom: "cura", dados: 2, faces: 12, fixo: 3 }, () => 0.9);
  t(`${sistema} rolagem avulsa não prova cura`, curasParaSintonizar(S.registraRolagem(s, dados), turnoEmCurso), []);
  const originalSemOp = { ...r.sessao, uso: { ...r.sessao.uso, ops: [] } };
  t(`${sistema} recibo sem a operação original não libera`, curasParaSintonizar(originalSemOp, turnoEmCurso), []);
  t(`${sistema} falta identidade não altera`, usaSintonizacaoVital(r.sessao, d, entrada).sessao === r.sessao, true);
}
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
