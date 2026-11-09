import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons, validarPacote } = await import(R + "afty-addons.js");
const { getTalento } = await import(R + "afty-talentos.js");
const { criarEncontro, criarCombatente, definirIniciativa } = await import(R + "encontros/afty-encontro.js");
const { redutorDeEncontro } = await import(R + "encontros/usar-encontro-afty.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { opcoesDeriveDaSessao } = await import(R + "ficha/ficha-opcoes-derive.js");
const { prepararRolagem } = await import(R + "ficha/abas-g2/rolagem-g2.js");
const { rolarTeste, rolarDano } = await import(R + "ficha/ficha-rolagem.js");
const P = await import(R + "afty-propriedades-armas.js");
const { confirmaAtaqueConteudo } = await import(R + "ficha/ficha-conteudo-combate.js");
const M = await import(R + "ficha/ficha-conteudo-manobras.js");
const { usa, encerraUso } = await import(R + "ficha/ficha-uso.js");
const { umaReserva } = await import(R + "ficha/efeitos/efeitos-dados.js");
const { assumePosturaConteudo } = await import(R + "ficha/ficha-conteudo-posturas.js");
let ok = 0, seq = 0;
const bad = [], t = (n, a, b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : bad.push(`${n}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
const p = () => ({ opId: `cortes-${++seq}`, registraAcao: true });
const id = "tal_especialista_em_cortes";
function ficha(sistema, nome, alvo = false) {
 const c = createBlankAfty(); c.id = nome; c.name = nome; c.rulesVersion = sistema; c.core.nd = alvo ? 20 : 12; c.attrMethod = "fixos";
 c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
 c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } }; c.especializacoes = [{ id: "combatente", nivel: c.core.nd }]; c.pericias = { feiticaria: "treinado" };
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
 c.talentos = alvo ? [] : [id, "tal_tecnicas_do_sentinela"]; c.escolhasTalento = alvo ? {} : { [id]: [getTalento(id).escolha.opcoes[0].id] };
 c.equipamentos.itens = [{ uid: "espada", tipo: "arma", refId: "arm_espada_curta", qtd: 1, equipado: true }]; return c;
}
const atual = (c, s) => deriveAfty({ ...c, combate: s.combate, buffsSessao: s.buffs }, opcoesDeriveDaSessao(s));
function cena(sistema, alteraAlvo = null, alteraAtacante = null) {
 const cs = [ficha(sistema, "cortador-a"), ficha(sistema, "cortador-b"), ficha(sistema, "alvo", true)]; alteraAlvo?.(cs[2]); alteraAtacante?.(cs[0]);
 const ds = cs.map(c => deriveAfty(c)); let e = criarEncontro({ nome: "Cortes" });
 e.combatentes = cs.map((c, i) => definirIniciativa(criarCombatente(c, { derived: ds[i] }), 30 - i * 10));
 const derivados = Object.fromEntries(e.combatentes.map((c, i) => [c.id, ds[i]])); e = redutorDeEncontro(e, { tipo: "COMECAR", derivados });
 return { cs, ds, e, derivados };
}
const turnoDe = e => ({ id: e.ativoId, rodada: e.rodada, turno: e.combatentes.find(c => c.id === e.ativoId).sessao.uso.acoes.turno });
const patch = (e, id, sessao) => ({ ...e, combatentes: e.combatentes.map(c => c.id === id ? { ...c, sessao } : c) });
function ataca(s, d, sa, da, alvoId, turno, natural = 20, pedido = null, armaId = "arm_espada_curta") {
 const linha = d.dano.entradas.find(l => l.id === armaId);
 const prova = prepararRolagem(pedido ?? { tipo: "teste", rotulo: linha.nome, bonus: linha.acerto, margem: linha.margemCritico, linhaArma: linha }, { sessao: s, derived: d });
 if (!prova.ok) throw Error(prova.etapa);
 const teste = rolarTeste({ ...prova.pronta, contextoTurno: { ...prova.pronta.contextoTurno, emCurso: turno } }, () => (natural - 1) / 20);
 s = P.registraRolagemArma(S.registraRolagem(s, teste), prova.desc, teste);
 const linhaDano = d.dano.entradas.find(l => l.id === armaId), desc = { tipo: "dano", rotulo: linhaDano.nome, grupos: linhaDano.gruposDano, modoDano: teste.critico ? "critico" : "normal", linhaArma: linhaDano };
 const dano = rolarDano(desc, () => 0.5); s = P.registraRolagemArma(S.registraRolagem(s, dano), desc, dano);
 const r = confirmaAtaqueConteudo(s, d, sa, da, { ataqueId: teste.id, danoId: dano.id, alvoId }, p()); if (!r.aplicado) throw Error(r.erro);
 return { ...r, teste, dano };
}
aplicarAddons([]);
for (const sistema of ["player", "afty"]) {
 const f = cena(sistema), [a, b, alvo] = f.e.combatentes, [d, db, da] = f.ds, turno = turnoDe(f.e);
 const atk = ataca(a.sessao, d, alvo.sessao, da, alvo.id, turno), entrada = { ataqueId: atk.teste.id, alvoId: alvo.id, voceId: a.id, turnoEmCurso: turno }, pedido = p();
 const r = M.aplicaCorteConteudo(atk.sessao, d, atk.sessaoAlvo, da, entrada, pedido); if (!r.aplicado) throw Error(r.erro);
 const ativoId = `${id}:${a.id}`, mov = atual(f.cs[2], r.sessaoAlvo);
 t(`${sistema} aquisição válida e dano cortante realmente infligido`, [d.talentos.inacessiveis, d.habilidades.inacessiveis, d.habilidades.excedeu, atk.calculos.some(c => c.tipoDano === "ct" && c.final > 0)], [[], [], false, true]);
 t(`${sistema} movimento reduzido em quatro e meio com fonte`, [mov.movimento, mov.efeitos.detalhes.some(e => e.canal === "movimento" && e.nome === "Especialista em Cortes" && e.valor === -4.5)], [da.movimento - 4.5, true]);
 t(`${sistema} operação não altera PE, ação, PV ou dano anterior`, [r.sessao.peAtual, r.sessao.uso.acoes, r.sessaoAlvo.hpAtual, r.sessao.log.find(x => x.id === atk.dano.id)], [atk.sessao.peAtual, atk.sessao.uso.acoes, atk.sessaoAlvo.hpAtual, atk.dano]);
 t(`${sistema} prazo vincula emissor e uso nativo`, [r.sessaoAlvo.uso.ativos[ativoId].origem, r.sessaoAlvo.uso.ativos[ativoId].parametros.fonteId], [id, a.id]);
 t(`${sistema} identidade não duplica`, M.aplicaCorteConteudo(r.sessao, d, r.sessaoAlvo, mov, entrada, pedido).repetida, true);
 t(`${sistema} outra operação não repete no mesmo turno`, M.aplicaCorteConteudo(r.sessao, d, r.sessaoAlvo, mov, entrada, p()).sessao === r.sessao, true);
 const salva = S.normalizaSessao(JSON.parse(JSON.stringify(r.sessaoAlvo)), mov);
 t(`${sistema} grupo e emissor persistem`, [atual(f.cs[2], salva).movimento, salva.buffs.find(x => x.nome === "Especialista em Cortes").grupoNaoAcumula, salva.uso.ativos[ativoId].parametros], [da.movimento - 4.5, id, r.sessaoAlvo.uso.ativos[ativoId].parametros]);
 for (const e of [{ alvoId: b.id }, { voceId: null }, { ataqueId: "ausente" }, { turnoEmCurso: null }, { turnoEmCurso: { ...turno, turno: turno.turno + 1 } }, { turnoEmCurso: { ...turno, id: b.id } }]) t(`${sistema} contexto errado não aplica`, M.aplicaCorteConteudo(atk.sessao, d, atk.sessaoAlvo, da, { ...entrada, ...e }, p()).sessao === atk.sessao, true);
 const sem = deriveAfty({ ...f.cs[0], talentos: [] });
 t(`${sistema} exige Talento atual`, M.aplicaCorteConteudo(atk.sessao, sem, atk.sessaoAlvo, da, entrada, p()).sessao === atk.sessao, true);
 const baixo = deriveAfty({ ...f.cs[0], core: { ...f.cs[0].core, nd: 7 }, especializacoes: [{ id: "combatente", nivel: 7 }] });
 t(`${sistema} requisito ND8 é real`, M.aplicaCorteConteudo(atk.sessao, baixo, atk.sessaoAlvo, da, entrada, p()).sessao === atk.sessao, true);
 t(`${sistema} sem identidade não altera`, M.aplicaCorteConteudo(atk.sessao, d, atk.sessaoAlvo, da, entrada).sessao === atk.sessao, true);
 for (const nome of ["Atordoado", "Inconsciente", "Paralisado", "Indefeso"]) {
  const incapaz = S.defineCondicoes(atk.sessao, [{ id: nome, nome }]); t(`${sistema} ${nome} recusa`, M.aplicaCorteConteudo(incapaz, d, atk.sessaoAlvo, da, entrada, p()).sessao === incapaz, true);
 }
 const errou = ataca(a.sessao, d, alvo.sessao, da, alvo.id, turno, 1);
 t(`${sistema} erro não libera a redução`, M.aplicaCorteConteudo(errou.sessao, d, errou.sessaoAlvo, da, { ...entrada, ataqueId: errou.teste.id }, p()).sessao === errou.sessao, true);
 const rd = cena(sistema, c => { c.buffsSessao = [{ id: "rd", nome: "RD de Teste", canal: "rdGeral", expr: "1000" }]; });
 const [ar, , tr] = rd.e.combatentes, sr = { ...tr.sessao, buffs: rd.cs[2].buffsSessao }, dr = atual(rd.cs[2], sr), zero = ataca(ar.sessao, rd.ds[0], sr, dr, tr.id, turnoDe(rd.e));
 t(`${sistema} acerto absorvido não inflige dano cortante`, [zero.ataque.acertou, zero.calculos.every(c => c.final === 0), M.aplicaCorteConteudo(zero.sessao, rd.ds[0], zero.sessaoAlvo, dr, { ...entrada, voceId: ar.id, alvoId: tr.id, ataqueId: zero.teste.id, turnoEmCurso: turnoDe(rd.e) }, p()).sessao === zero.sessao], [true, true, true]);
 const pv = umaReserva(alvo.sessao, "casca-cortes", "Casca de Teste", 1000);
 const naCasca = ataca(a.sessao, d, pv, da, alvo.id, turno);
 t(`${sistema} dano cortante em PV temporário ainda é dano`, [naCasca.sessaoAlvo.hpAtual, M.aplicaCorteConteudo(naCasca.sessao, d, naCasca.sessaoAlvo, da, { ...entrada, ataqueId: naCasca.teste.id }, p()).aplicado], [alvo.sessao.hpAtual, true]);
 let e = patch(patch(f.e, a.id, r.sessao), alvo.id, r.sessaoAlvo);
 e = redutorDeEncontro(e, { tipo: "PROXIMO_TURNO", derivados: f.derivados });
 t(`${sistema} início do turno de outro não encerra`, [e.ativoId, atual(f.cs[2], e.combatentes[2].sessao).movimento], [b.id, da.movimento - 4.5]);
 const cb = e.combatentes[1], ct = e.combatentes[2], turnoB = turnoDe(e);
 const batk = ataca(cb.sessao, db, ct.sessao, atual(f.cs[2], ct.sessao), ct.id, turnoB);
 const br = M.aplicaCorteConteudo(batk.sessao, db, batk.sessaoAlvo, atual(f.cs[2], batk.sessaoAlvo), { ataqueId: batk.teste.id, alvoId: ct.id, voceId: cb.id, turnoEmCurso: turnoB }, p()); if (!br.aplicado) throw Error(br.erro);
 const dm = atual(f.cs[2], br.sessaoAlvo), detalhes = dm.efeitos.detalhes.filter(x => x.canal === "movimento" && x.nome === "Especialista em Cortes");
 t(`${sistema} duas fontes mantêm um único prejuízo e suas fontes`, [dm.movimento, detalhes.length, detalhes.filter(x => x.suplantado).length], [da.movimento - 4.5, 2, 1]);
 const manual = encerraUso(br.sessaoAlvo, dm, ativoId, p());
 t(`${sistema} encerrar uma cópia conserva a outra`, atual(f.cs[2], manual.sessao).movimento, da.movimento - 4.5);
 const reacao = M.preparaReacaoSentinela(r.sessao, d, br.sessao, db, { voceId: a.id, atacanteId: b.id, ataqueId: batk.teste.id, armaId: "arm_espada_curta", chaveArma: d.dano.entradas.find(l => l.id === "arm_espada_curta").chaveArma, emAlcanceEGatilhoAtual: true }, p()); if (!reacao.aplicado) throw Error(reacao.erro);
 const contraB = ataca(reacao.sessao, d, br.sessao, db, b.id, turnoB, 20, reacao.pedidoRolagem);
 const ar2 = M.aplicaCorteConteudo(contraB.sessao, d, contraB.sessaoAlvo, db, { ataqueId: contraB.teste.id, alvoId: b.id, voceId: a.id, turnoEmCurso: turnoB }, p()); if (!ar2.aplicado) throw Error(ar2.erro);
 t(`${sistema} outro turno permite corte por reação real`, [ar2.sessao.uso.acoes, atual(f.cs[1], ar2.sessaoAlvo).movimento], [contraB.sessao.uso.acoes, db.movimento - 4.5]);
 e = patch(patch(patch(e, a.id, ar2.sessao), b.id, ar2.sessaoAlvo), alvo.id, br.sessaoAlvo);
 const forcada = redutorDeEncontro(e, { tipo: "NOVA_RODADA", derivados: f.derivados });
 t(`${sistema} rodada sem início do emissor mantém todas as cópias`, Object.values(forcada.combatentes[2].sessao.uso.ativos).filter(x => x.origem === id).length, 2);
 const turnoAlvo = redutorDeEncontro(e, { tipo: "PROXIMO_TURNO", derivados: f.derivados });
 t(`${sistema} início do alvo não é o prazo do emissor`, [turnoAlvo.ativoId, atual(f.cs[2], turnoAlvo.combatentes[2].sessao).movimento], [alvo.id, da.movimento - 4.5]);
 const voltaA = redutorDeEncontro(turnoAlvo, { tipo: "PROXIMO_TURNO", derivados: f.derivados });
 t(`${sistema} começo de A remove suas cópias em dois alvos`, [voltaA.ativoId, voltaA.combatentes[1].sessao.uso.ativos[ativoId], voltaA.combatentes[2].sessao.uso.ativos[ativoId]], [a.id, undefined, undefined]);
 t(`${sistema} começo de A conserva a cópia de B`, atual(f.cs[2], voltaA.combatentes[2].sessao).movimento, da.movimento - 4.5);
 const voltaB = redutorDeEncontro(voltaA, { tipo: "PROXIMO_TURNO", derivados: f.derivados });
 t(`${sistema} começo de B encerra a última cópia`, [atual(f.cs[2], voltaB.combatentes[2].sessao).movimento, voltaB.combatentes[2].sessao.buffs.filter(x => x.nome === "Especialista em Cortes").length], [da.movimento, 0]);
 const removida = redutorDeEncontro(voltaA, { tipo: "REMOVER", id: b.id });
 t(`${sistema} remover emissor limpa sua cópia`, atual(f.cs[2], removida.combatentes.find(c => c.id === alvo.id).sessao).movimento, da.movimento);
 const fim = redutorDeEncontro(e, { tipo: "ENCERRAR" });
 t(`${sistema} encerrar combate limpa as reduções`, [atual(f.cs[2], fim.combatentes[2].sessao).movimento, fim.combatentes[2].sessao.buffs.filter(x => x.nome === "Especialista em Cortes").length], [da.movimento, 0]);
 const addon = { id: "cortes-nd-mesa", nome: "Requisito de Cortes", paraRaw: "afty", substitui: { talentos: [{ id, requisitos: [{ tipo: "nd", valor: 20 }] }] } };
 t(`${sistema} remendo é válido`, validarPacote(addon), []); aplicarAddons([addon]);
 const inac = deriveAfty({ ...f.cs[0], addons: [addon] });
 t(`${sistema} requisito remendado é respeitado`, M.aplicaCorteConteudo(atk.sessao, inac, atk.sessaoAlvo, da, entrada, p()).sessao === atk.sessao, true); aplicarAddons([]);
 for (const estado of ["morto", "morrendo"]) {
  const incapaz = { ...atk.sessao, hpAtual: 0, vital: { ...atk.sessao.vital, estado } };
  t(`${sistema} fonte ${estado} não ativa`, M.aplicaCorteConteudo(incapaz, d, atk.sessaoAlvo, da, entrada, p()).sessao === incapaz, true);
 }
 for (const [nome, armaId, buffs] of [["impacto", "basico", []], ["misto com corte absorvido", "arm_chicote_espinhento", [{ id: "rd-corte", nome: "RD Cortante de Teste", canal: "rdTipo", alvo: "ct", expr: "1000" }]]]) {
  const z = cena(sistema, c => { c.buffsSessao = buffs; }, c => { if (armaId !== "basico") c.equipamentos.itens[0].refId = armaId; });
  const [za, , zt] = z.e.combatentes, st = { ...zt.sessao, buffs }, dt = atual(z.cs[2], st), zd = z.ds[0], tt = turnoDe(z.e);
  const hit = ataca(za.sessao, zd, st, dt, zt.id, tt, 20, null, armaId);
  t(`${sistema} ${nome} tem dano positivo de outro tipo`, hit.calculos.some(x => x.tipoDano !== "ct" && x.final > 0), true);
  t(`${sistema} ${nome} não usa dano bruto cortante como prova`, M.aplicaCorteConteudo(hit.sessao, zd, hit.sessaoAlvo, dt, { ataqueId: hit.teste.id, alvoId: zt.id, voceId: za.id, turnoEmCurso: tt }, p()).sessao === hit.sessao, true);
 }
 {
  const z = cena(sistema, null, c => { c.equipamentos.itens[0].refId = "arm_faca_de_arremesso"; });
  const [za, , zt] = z.e.combatentes, base = z.ds[0].dano.entradas.find(l => l.id === "arm_faca_de_arremesso");
  const ss = P.configuraArmaNaSessao(za.sessao, base, "tipoDano", "ct"), zd = atual(z.cs[0], ss), dt = z.ds[2], tt = turnoDe(z.e);
  const hit = ataca(ss, zd, zt.sessao, dt, zt.id, tt, 20, null, "arm_faca_de_arremesso");
  const rr = M.aplicaCorteConteudo(hit.sessao, zd, hit.sessaoAlvo, dt, { ataqueId: hit.teste.id, alvoId: zt.id, voceId: za.id, turnoEmCurso: tt }, p());
  t(`${sistema} cláusula opcional admite arremesso cortante real`, [zd.dano.entradas.find(l => l.id === "arm_faca_de_arremesso").categoria, rr.aplicado, atual(z.cs[2], rr.sessaoAlvo).movimento], ["arremesso", true, dt.movimento - 4.5]);
 }
 {
  const z = cena(sistema); let mesa = z.e;
  for (let i = 0; i < 2; i++) mesa = redutorDeEncontro(mesa, { tipo: "PROXIMO_TURNO", derivados: z.derivados });
  const [za, , zt] = mesa.combatentes, zd = z.ds[0], dt = z.ds[2], tt = turnoDe(mesa), linha = zd.dano.entradas.find(l => l.id === "arm_espada_curta");
  const op = M.preparaOportunidadeConteudo(za.sessao, zd, { armaId: linha.id, chaveArma: linha.chaveArma, voceId: za.id, alvoId: zt.id, fonte: "sentinela", gatilhoValido: true }, p(), { sessao: zt.sessao, derived: dt });
  if (!op.aplicado) throw Error(op.erro);
  const hit = ataca(op.sessao, zd, zt.sessao, dt, zt.id, tt, 20, op.pedidoRolagem);
  const rr = M.aplicaCorteConteudo(hit.sessao, zd, hit.sessaoAlvo, atual(z.cs[2], hit.sessaoAlvo), { ataqueId: hit.teste.id, alvoId: zt.id, voceId: za.id, turnoEmCurso: tt }, p());
  t(`${sistema} Sentinela e Cortes, fontes diferentes, somam normalmente`, [rr.aplicado, atual(z.cs[2], rr.sessaoAlvo).movimento], [true, Math.max(0, dt.movimento - 9)]);
 }
 {
  const z = cena(sistema, c => { c.habilidades = ["cmb_assumir_postura"]; c.escolhasHabilidade = { cmb_assumir_postura: ["cmb_postura_da_terra"] }; }); let mesa = z.e;
  for (let i = 0; i < 2; i++) mesa = redutorDeEncontro(mesa, { tipo: "PROXIMO_TURNO", derivados: z.derivados });
  const target = mesa.combatentes[2], postura = assumePosturaConteudo(target.sessao, z.ds[2], { postura: "terra" }, p()); if (!postura.aplicado) throw Error(postura.erro);
  mesa = patch(mesa, target.id, postura.sessao); mesa = redutorDeEncontro(mesa, { tipo: "PROXIMO_TURNO", derivados: z.derivados });
  const [za, , zt] = mesa.combatentes, zd = atual(z.cs[0], za.sessao), dt = atual(z.cs[2], zt.sessao), tt = turnoDe(mesa);
  const hit = ataca(za.sessao, zd, zt.sessao, dt, zt.id, tt), rr = M.aplicaCorteConteudo(hit.sessao, zd, hit.sessaoAlvo, dt, { ataqueId: hit.teste.id, alvoId: zt.id, voceId: za.id, turnoEmCurso: tt }, p());
  t(`${sistema} redução numérica não é movimento forçado`, [dt.efeitos.porCanal.imunidadeMovimentoForcado > 0, rr.aplicado, atual(z.cs[2], rr.sessaoAlvo).movimento, rr.sessaoAlvo.combate.postura, !!rr.sessaoAlvo.uso.ativos.cmb_assumir_postura], [true, true, dt.movimento - 4.5, "terra", true]);
 }
}
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
