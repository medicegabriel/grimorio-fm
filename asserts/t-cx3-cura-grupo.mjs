import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const S = await import(R + "ficha/ficha-sessao.js");
const O = await import(R + "ficha/ficha-conteudo-uso.js");
let ok = 0, seq = 0;
const bad = [], t = (n, a, b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : bad.push(`${n}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
const p = () => ({ opId: `cura-grupo-${++seq}` });

function ficha(sistema, id, origem = "inato") {
 const c = createBlankAfty(); c.id = id; c.name = id; c.rulesVersion = sistema; c.core.nd = 20; c.attrMethod = "fixos";
 c.attributes = { forca: 14, destreza: 12, constituicao: 13, inteligencia: 10, sabedoria: 15, presenca: 8 };
 c.core.origem = { id: origem, bonusAtributos: { sabedoria: 2, destreza: 1 } }; c.attrNivel.sabedoria = 3;
 c.especializacoes = [{ id: "combatente", nivel: 20 }]; c.pericias = { feiticaria: "treinado" };
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao", "ger_aptidao"] : [];
 if (id === "curador") {
  c.aptidoes = { cl: 3, er: 4, au: 0, dom: 0, bar: 0 };
  c.aptidoesAmaldicoadas = ["energia_reversa", "liberacao_de_energia_reversa", "cura_em_grupo"];
 }
 return c;
}
const inicia = d => ({ ...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d), d), d), rodada: 1 });
aplicarAddons([]);

for (const sistema of ["player", "afty"]) {
 const c = ficha(sistema, "curador"), d = deriveAfty(c);
 const d1 = deriveAfty(ficha(sistema, "aliado")), d2 = deriveAfty(ficha(sistema, "hibrido", "feto_amaldicoado_hibrido"));
 const s = { ...inicia(d), hpAtual: d.hp - 20 }, s1 = { ...inicia(d1), hpAtual: d1.hp - 2 }, s2 = { ...inicia(d2), hpAtual: d2.hp - 10 };
 const grupo = [{ id: "curador", sessao: s, derived: d }, { id: "aliado", sessao: s1, derived: d1 }, { id: "hibrido", sessao: s2, derived: d2 }];
 const turnoEmCurso = { id: "curador", rodada: 1, turno: s.uso.acoes.turno };
 const entrada = { voceId: "curador", alvoIds: grupo.map(a => a.id), turnoEmCurso, blocos: 1, todosEmAlcance: true, rng: () => 0.5 };
 const fonte = d.cura.linhas.find(l => l.id === "cura_energia_reversa");
 t(`${sistema} aquisição válida`, [d.aptidao.disponiveisConteudo.includes("cura_em_grupo"), d.habilidades.inacessiveis, d.habilidades.excedeu], [true, [], false]);
 t(`${sistema} teto de Cura em Grupo vem da linha de PER`, fonte.blocos, 5);
 t(`${sistema} alcance acompanha ER 4`, O.alcanceCuraEmGrupo(d).valor, 10.5);
 t(`${sistema} Herança é origem efetiva no destinatário`, !!d2.origensUso.heranca, true);
 const id = p(), rolada = O.rolaCuraEmGrupo(s, d, grupo, entrada, id);
 if (!rolada.aplicado) throw Error(rolada.erro);
 const outraCura = O.usaCuraConteudo(s, d, { id: "cura_energia_reversa", blocos: 1, rng: entrada.rng }, p());
 t(`${sistema} a única rolagem usa a cura nativa`, [rolada.rolagem.total, rolada.rolagem.dados], [outraCura.rolagem.total, outraCura.rolagem.dados]);
 t(`${sistema} um PER e uma ação comum`, [s.peAtual - rolada.sessao.peAtual, rolada.sessao.uso.acoes.gastas], [2, { comum: 1, bonus: 0, movimento: 0 }]);
 t(`${sistema} só rolar não cura nenhum destinatário`, [rolada.sessao.hpAtual, rolada.sessoesAlvo], [s.hpAtual, undefined]);
 t(`${sistema} repetir o mesmo op não cobra`, O.rolaCuraEmGrupo(rolada.sessao, d, grupo, entrada, id).repetida, true);
 for (const patch of [{ blocos: 6 }, { blocos: 1.5 }, { todosEmAlcance: false }, { turnoEmCurso: { ...turnoEmCurso, id: "aliado" } }, { alvoIds: ["aliado", "aliado", "curador"] }]) {
  t(`${sistema} recusa antes de pagar: ${Object.keys(patch)[0]} ${Object.values(patch)[0]}`, O.rolaCuraEmGrupo(s, d, grupo, { ...entrada, ...patch, rng: () => { throw Error("Não Deve Rolar"); } }, p()).sessao === s, true);
 }
 const soComLiberacao = deriveAfty({ ...c, aptidoesAmaldicoadas: c.aptidoesAmaldicoadas.slice(0, 2) });
 t(`${sistema} Liberação sem Cura em Grupo não autoriza`, O.rolaCuraEmGrupo(s, soComLiberacao, grupo, entrada, p()).aplicado, false);
 const mal = deriveAfty(ficha(sistema, "mal", "maldicao"));
 const comMaldicao = [grupo[0], grupo[1], { ...grupo[2], derived: mal }];
 t(`${sistema} Maldição bloqueia antes de gastar`, O.rolaCuraEmGrupo(s, d, comMaldicao, entrada, p()).erro, "Energia Reversa Não Cura Maldições");
 t(`${sistema} sem PE não inicia`, O.rolaCuraEmGrupo({ ...s, peAtual: 0 }, d, grupo, entrada, p()).aplicado, false);

 const relida = S.normalizaSessao(JSON.parse(JSON.stringify(rolada.sessao)), d);
 const parcelas = { curador: 5, aliado: rolada.rolagem.total - 10, hibrido: 5 };
 const e = { voceId: entrada.voceId, curaId: rolada.rolagem.id, turnoEmCurso, parcelas };
 const preservadas = JSON.stringify(grupo);
 const fim = O.aplicaCuraEmGrupo(relida, grupo, e, p());
 if (!fim.aplicado) throw Error(fim.erro);
 t(`${sistema} salva entre rolagem e aplicação`, fim.sessao.log.find(r => r.id === e.curaId).consequenciasAplicadas, true);
 t(`${sistema} parcela própria usa a sessão já paga`, [fim.sessao.hpAtual - s.hpAtual, fim.sessao.peAtual, fim.sessao.uso.acoes], [5, relida.peAtual, relida.uso.acoes]);
 t(`${sistema} teto de PV e Herança por destinatário`, [fim.sessoesAlvo.aliado.hpAtual, fim.sessoesAlvo.hibrido.hpAtual - s2.hpAtual], [d1.hp, 2]);
 t(`${sistema} registra parcela antes das reduções e recuperação final`, fim.distribuicao.map(x => [x.parcela, x.valor, x.recuperado]), [[5, 5, 5], [parcelas.aliado, parcelas.aliado, 2], [5, 2, 2]]);
 t(`${sistema} entradas permanecem intactas`, JSON.stringify(grupo), preservadas);
 t(`${sistema} não repete depois de aplicar`, O.aplicaCuraEmGrupo(fim.sessao, grupo, e, p()).aplicado, false);
 t(`${sistema} não conclui depois do turno`, O.aplicaCuraEmGrupo(relida, grupo, { ...e, turnoEmCurso: { ...turnoEmCurso, turno: turnoEmCurso.turno + 1 } }, p()).aplicado, false);
 t(`${sistema} destinatário que saiu invalida a transação`, O.aplicaCuraEmGrupo(relida, grupo.slice(0, 2), e, p()).sessao === relida, true);
 t(`${sistema} revalida origem na aplicação`, O.aplicaCuraEmGrupo(relida, comMaldicao, e, p()).sessao === relida, true);
 const errada = O.aplicaCuraEmGrupo(relida, grupo, { ...e, parcelas: { ...parcelas, aliado: parcelas.aliado + 1 } }, p());
 t(`${sistema} divisão incorreta não aplica parcialmente`, [errada.sessao === relida, errada.sessoesAlvo], [true, undefined]);
}

if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
