import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const { trocarCopiaImitacao } = await import(R + "afty-imitacao.js");
const { posturaAtivaConteudo, assumePosturaConteudo } = await import(R + "ficha/ficha-conteudo-posturas.js");
const { usaAcaoLuaConteudo, preparaOportunidadeConteudo } = await import(R + "ficha/ficha-conteudo-manobras.js");
const { bloqueioDeOportunidadeConteudo } = await import(R + "ficha/ficha-conteudo-acesso.js");
const { gastaAcao } = await import(R + "ficha/ficha-acoes.js");
const { opcoesDeriveDaSessao } = await import(R + "ficha/ficha-opcoes-derive.js");
const S = await import(R + "ficha/ficha-sessao.js");
let ok = 0, seq = 0;
const bad = [], t = (n, a, b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : bad.push(`${n}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
const p = () => ({ opId: `lua-${++seq}`, registraAcao: true });
function ficha(sistema) {
  const c = createBlankAfty(); c.id = "lua"; c.rulesVersion = sistema; c.core.nd = 12; c.name = "CX3 Lua";
  c.attrMethod = "fixos"; c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
  c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } }; c.especializacoes = [{ id: "combatente", nivel: 12 }];
  c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : []; c.habilidades = ["cmb_assumir_postura"];
  c.escolhasHabilidade = { cmb_assumir_postura: ["cmb_postura_da_lua", "cmb_postura_do_sol"] }; c.pericias = { feiticaria: "treinado" };
  return c;
}
const atual = (c, s) => deriveAfty({ ...c, combate: s.combate, buffsSessao: s.buffs }, opcoesDeriveDaSessao(s));
const inicio = d => ({ ...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d), d), d), rodada: 1 });
const entrada = { comando: "andar", distancia: 4.5, emSeuTurno: true };
aplicarAddons([]);
for (const sistema of ["player", "afty"]) {
  const c = ficha(sistema), base = deriveAfty(c), si = inicio(base);
  const entrar = assumePosturaConteudo(si, base, { postura: "lua" }, p());
  if (!entrar.aplicado) throw Error(entrar.erro);
  const s = entrar.sessao, d = atual(c, s), fonte = posturaAtivaConteudo(s, d, "lua");
  t(`${sistema} ficha admissível`, [d.habilidades.inacessiveis, d.habilidades.excedeu, d.testes.orcamento.excedeu], [[], false, false]);
  t(`${sistema} fonte real da postura`, [fonte.id, fonte.nome, fonte.apice], ["cmb_postura_da_lua", "Postura da Lua", false]);
  let esgotada = s; for (const acao of ["comum", "movimento"]) esgotada = gastaAcao(esgotada, d, acao).sessao;
  const snapshot = JSON.stringify(esgotada), pedido = p(), andar = usaAcaoLuaConteudo(esgotada, d, entrada, pedido);
  if (!andar.aplicado) throw Error(andar.erro);
  t(`${sistema} Andar registra distância e fontes do derivado`, [andar.registro.deslocamento, andar.registro.fontesMovimento], [4.5, d.partes.movimento]);
  t(`${sistema} usa Livre sem PE nem ação normal`, [andar.acao, andar.sessao.peAtual, andar.sessao.uso.acoes.gastas], ["livre", s.peAtual, esgotada.uso.acoes.gastas]);
  t(`${sistema} ação tem identidade nativa por rodada`, andar.sessao.uso.acoes.livres["cmb_postura_da_lua:andar"], 1);
  t(`${sistema} original preservado`, JSON.stringify(esgotada), snapshot);
  t(`${sistema} repetição da operação`, usaAcaoLuaConteudo(andar.sessao, d, entrada, pedido).repetida, true);
  t(`${sistema} nova identidade não repete a Livre`, usaAcaoLuaConteudo(andar.sessao, d, entrada, p()).sessao === andar.sessao, true);
  const des = usaAcaoLuaConteudo(andar.sessao, d, { ...entrada, comando: "desengajar" }, p());
  if (!des.aplicado) throw Error(des.erro);
  t(`${sistema} Desengajar distinto permitido`, [des.acao, des.sessao.peAtual, des.sessao.uso.acoes.gastas], ["livre", s.peAtual, esgotada.uso.acoes.gastas]);
  t(`${sistema} uso nativo tem fonte/comando/prazo`, [des.sessao.uso.ativos["cmb_postura_da_lua:desengajar"].origem, des.sessao.uso.ativos["cmb_postura_da_lua:desengajar"].parametros.comando, des.sessao.uso.ativos["cmb_postura_da_lua:desengajar"].duracao], ["cmb_postura_da_lua", "desengajar", { tipo: "fimDoTurno" }]);
  t(`${sistema} proteção independente do atacante`, bloqueioDeOportunidadeConteudo(des.sessao, null), "Desengajar Impede esta Oportunidade");
  const salvo = S.normalizaSessao(JSON.parse(JSON.stringify(des.sessao)), d);
  t(`${sistema} salvamento mantém proteção e livres`, [bloqueioDeOportunidadeConteudo(salvo, "outro"), salvo.uso.acoes.livres], ["Desengajar Impede esta Oportunidade", des.sessao.uso.acoes.livres]);
  const depois = S.encerraTurnoFicha(salvo, d);
  t(`${sistema} fim do turno encerra proteção`, bloqueioDeOportunidadeConteudo(depois, "outro"), null);
  t(`${sistema} turno encerrado recusa`, usaAcaoLuaConteudo(depois, d, entrada, p()).sessao === depois, true);
  const turno = S.iniciaTurnoFicha(depois, d);
  t(`${sistema} novo turno na mesma rodada não repete Livre`, usaAcaoLuaConteudo(turno, d, entrada, p()).sessao === turno, true);
  const rodada = S.iniciaTurnoFicha(S.proximaRodada(salvo, d).sessao, d);
  t(`${sistema} rodada recupera Livre`, usaAcaoLuaConteudo(rodada, atual(c, rodada), entrada, p()).aplicado, true);
  const semPE = { ...s, peAtual: 0 };
  t(`${sistema} exige identidade mesmo sem custo`, usaAcaoLuaConteudo(semPE, d, entrada, {}).erro, "Sem Identidade da Operação");
  t(`${sistema} ação gratuita não pede PE`, usaAcaoLuaConteudo(semPE, d, entrada, p()).aplicado, true);
  t(`${sistema} não dispensa marcação da Livre`, usaAcaoLuaConteudo(s, d, entrada, { ...p(), registraAcao: false }).sessao.uso.acoes.livres["cmb_postura_da_lua:andar"], 1);
  for (const e of [{ comando: "esconder" }, { comando: "atacar" }, { emSeuTurno: false }, { distancia: d.movimento + 1 }, { distancia: -1 }, { distancia: null }, { distancia: "" }, { distancia: Infinity }]) t(`${sistema} entrada inválida ${JSON.stringify(e)}`, usaAcaoLuaConteudo(s, d, { ...entrada, ...e }, p()).sessao === s, true);
  for (const nome of ["Atordoado", "Paralisado", "Inconsciente", "Indefeso", "Caído"]) {
    const incapaz = S.defineCondicoes(s, [{ id: nome, nome }]);
    t(`${sistema} ${nome} recusa sem consumir`, usaAcaoLuaConteudo(incapaz, atual(c, incapaz), entrada, p()).sessao === incapaz, true);
  }
  for (const estado of ["morto", "morrendo"]) {
    const incapaz = { ...s, hpAtual: 0, vital: { ...s.vital, estado } };
    t(`${sistema} ${estado} recusa`, usaAcaoLuaConteudo(incapaz, d, entrada, p()).sessao === incapaz, true);
  }
  const sem = { ...c, habilidades: [], escolhasHabilidade: {}, combate: s.combate };
  t(`${sistema} estado bruto não concede postura`, posturaAtivaConteudo(s, deriveAfty(sem), "lua"), null);
  t(`${sistema} outra postura não concede`, posturaAtivaConteudo({ ...s, combate: { ...s.combate, postura: "sol" } }, d, "lua"), null);
  const segundo = { ...s, combate: { ...s.combate, postura: "sol", postura2: "lua" } };
  t(`${sistema} segundo espaço exige Mestre`, posturaAtivaConteudo(segundo, atual(c, segundo), "lua"), null);
  const mestre = { ...c, core: { ...c.core, nd: 16 }, especializacoes: [{ id: "combatente", nivel: 16 }], habilidades: [...c.habilidades, "cmb_mestre_da_postura"] };
  const dm = atual(mestre, segundo);
  t(`${sistema} Mestre no nível válido`, dm.habilidades.inacessiveis, []);
  t(`${sistema} segundo espaço com Mestre`, posturaAtivaConteudo(segundo, dm, "lua")?.id, "cmb_postura_da_lua");
  const atacante = inicio(base), ataque = { armaId: "basico", alvoId: c.id, atacanteId: "atacante", emAlcance: true };
  const recusada = preparaOportunidadeConteudo(atacante, base, ataque, p(), { sessao: salvo, derived: d });
  t(`${sistema} oportunidade recusada antes da reação`, [recusada.aplicado, recusada.sessao === atacante], [false, true]);
  const im = ficha(sistema); im.core.origem = { id: "restringido" }; im.core.tipo = "restringido"; im.especializacoes = [{ id: "restringido", nivel: 12 }];
  im.habilidades = ["res_imitacao"]; im.escolhasHabilidade = {}; im.combate = { ativo: true, ...trocarCopiaImitacao({}, { id: "cmb_postura_da_lua", tipo: "postura" }) };
  const di = deriveAfty(im), sim = { ...inicio(di), combate: im.combate };
  t(`${sistema} Imitação admissível`, [di.habilidades.inacessiveis, di.imitacao.copia?.id], [[], "cmb_postura_da_lua"]);
  t(`${sistema} Imitação realiza Livre`, usaAcaoLuaConteudo(sim, di, entrada, p()).aplicado, true);
  const ap = ficha(sistema); ap.core.nd = 30; ap.especializacoes = [{ id: "combatente", nivel: 20 }, { id: "conjurador", nivel: 10 }];
  ap.habilidades.push("cmb_preparacao_rapida", "cmb_mestre_da_postura"); if (sistema === "afty") ap.habilidadesGerais.push("ger_habilidade_lendaria");
  ap.habilidadesLendarias = ["len_atingir_apice"]; ap.escolhasAltoNivel = { len_atingir_apice: ["api_invencivel_sob_o_sol"] };
  ap.escolhasHabilidade = { cmb_assumir_postura: ["cmb_postura_do_sol"] }; ap.combate = { ativo: true, invencivelSobOSol: true, invencivelRodadas: 1 };
  const da = deriveAfty(ap), sap = { ...inicio(da), combate: ap.combate };
  t(`${sistema} Ápice dá postura não aprendida`, [posturaAtivaConteudo(sap, da, "lua")?.apice, usaAcaoLuaConteudo(sap, da, entrada, p()).aplicado], [true, true]);
  for (const falsa of [{ ...ap, habilidadesLendarias: [], escolhasAltoNivel: {} }, { ...ap, habilidades: ["cmb_assumir_postura"] }, { ...ap, core: { ...ap.core, nd: 20 }, especializacoes: [{ id: "combatente", nivel: 20 }] }]) t(`${sistema} Ápice inválido não concede Lua`, posturaAtivaConteudo(sap, deriveAfty(falsa), "lua"), null);
}
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
