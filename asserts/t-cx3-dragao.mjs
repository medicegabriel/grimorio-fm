import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const { prepararRolagem } = await import(R + "ficha/abas-g2/rolagem-g2.js");
const { rolarTeste, rolarDano } = await import(R + "ficha/ficha-rolagem.js");
const { registraRolagemArma } = await import(R + "afty-propriedades-armas.js");
const { opcoesDeriveDaSessao } = await import(R + "ficha/ficha-opcoes-derive.js");
const { assumePosturaConteudo } = await import(R + "ficha/ficha-conteudo-posturas.js");
const { confirmaAtaqueConteudo, armaCanalizacao } = await import(R + "ficha/ficha-conteudo-combate.js");
const { preparaOportunidadeConteudo } = await import(R + "ficha/ficha-conteudo-manobras.js");
const { trocarCopiaImitacao } = await import(R + "afty-imitacao.js");
const { rolaSorte, escolheSorte } = await import(R + "ficha/ficha-conteudo-uso.js");
const D = await import(R + "ficha/ficha-conteudo-dragao.js");
const S = await import(R + "ficha/ficha-sessao.js");
let ok = 0, seq = 0;
const bad = [], t = (n, a, b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : bad.push(`${n}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
const p = () => ({ opId: `dragao-${++seq}`, registraAcao: true });
function ficha(sistema, id) {
 const c = createBlankAfty(); c.id = id; c.name = id; c.rulesVersion = sistema; c.core.nd = 12; c.attrMethod = "fixos";
 c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
 c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } }; c.especializacoes = [{ id: "combatente", nivel: 12 }];
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : []; c.habilidades = id === "atacante" ? ["cmb_assumir_postura"] : [];
 c.escolhasHabilidade = id === "atacante" ? { cmb_assumir_postura: ["cmb_postura_do_dragao", "cmb_postura_do_sol"] } : {};
 c.pericias = { feiticaria: "treinado" }; c.equipamentos.itens = [{ uid: "espada", tipo: "arma", refId: "arm_espada_curta", equipado: true, qtd: 1 }];
 if (id === "vizinho") c.talentos = ["tal_favorecido_pela_sorte"]; return c;
}
const atual = (c, s) => deriveAfty({ ...c, combate: s.combate, buffsSessao: s.buffs }, opcoesDeriveDaSessao(s));
const inicio = d => ({ ...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d), d), d), rodada: 1 });
function ataque(sistema, { antesDaPostura = false, errou = false, reacao = false, canalizada = false, postura = "propria" } = {}) {
 const c = ficha(sistema, "atacante"), ca = ficha(sistema, "original"), cb = ficha(sistema, "vizinho");
 if (reacao) c.talentos = ["tal_perceber_oportunidade"];
 if (postura === "imitacao") {
  c.core.origem = { id: "restringido" }; c.core.tipo = "restringido"; c.especializacoes = [{ id: "restringido", nivel: 12 }];
  c.habilidades = ["res_imitacao"]; c.escolhasHabilidade = {};
  c.combate = { ativo: true, ...trocarCopiaImitacao({}, { id: "cmb_postura_do_dragao", tipo: "postura" }) };
 }
 if (postura === "apice") {
  c.core.nd = 30; c.especializacoes = [{ id: "combatente", nivel: 20 }, { id: "conjurador", nivel: 10 }];
  c.habilidades.push("cmb_preparacao_rapida", "cmb_mestre_da_postura"); if (sistema === "afty") c.habilidadesGerais.push("ger_habilidade_lendaria");
  c.habilidadesLendarias = ["len_atingir_apice"]; c.escolhasAltoNivel = { len_atingir_apice: ["api_invencivel_sob_o_sol"] };
  c.escolhasHabilidade = { cmb_assumir_postura: ["cmb_postura_do_sol"] }; c.combate = { ativo: true, invencivelSobOSol: true, invencivelRodadas: 1 };
 }
 if (canalizada) {
  c.core.nd = 20; c.especializacoes[0].nivel = 20;
  c.aptidoes = { cl: 4, au: 1, er: 2, dom: 0, bar: 0 };
  c.aptidoesAmaldicoadas = ["canalizar_em_golpe", "energia_reversa", "liberacao_de_energia_reversa", "canalizar_energia_reversa"];
  if (sistema === "afty") c.habilidadesGerais.push("ger_aptidao");
  ca.core.origem = { id: "maldicao" }; cb.core.origem = { id: "maldicao" };
 }
 const d0 = deriveAfty(c), da = deriveAfty(ca), db = deriveAfty(cb), turno = { id: reacao ? "original" : "atacante", rodada: 1, turno: 0 };
 let s = inicio(d0); const sb = inicio(db), sa = inicio(da);
 if (postura !== "propria") s = { ...s, combate: c.combate };
 else if (!antesDaPostura) s = assumePosturaConteudo(s, d0, { postura: "dragao" }, p()).sessao;
 if (canalizada) {
  const uso = armaCanalizacao(s, atual(c, s), { reversa: true, descontarPE: true }, p());
  if (!uso.aplicado) throw Error(uso.erro);
  s = uso.sessao;
 }
 let d = atual(c, s); const linha = d.dano.entradas.find(l => l.id === "arm_espada_curta");
 let pedidoAtaque = { tipo: "teste", rotulo: linha.nome, linhaArma: linha, bonus: linha.acerto, margem: linha.margemCritico };
 if (reacao) {
  const uso = preparaOportunidadeConteudo(s, d, { armaId: linha.id, chaveArma: linha.chaveArma, voceId: c.id, alvoId: ca.id, gatilhoValido: true }, p(), { sessao: sa, derived: da });
  if (!uso.aplicado) throw Error(uso.erro);
  s = uso.sessao; pedidoAtaque = uso.pedidoRolagem;
 }
 const prova = prepararRolagem(pedidoAtaque, { sessao: s, derived: d });
 if (!prova.ok) throw Error(prova.etapa);
 const r = rolarTeste({ ...prova.pronta, contextoTurno: { ...prova.pronta.contextoTurno, emCurso: turno } }, () => errou ? 0 : 0.999);
 s = registraRolagemArma(S.registraRolagem(s, r), prova.desc, r);
 let dano = null;
 if (!errou) {
  d = atual(c, s); const l = d.dano.entradas.find(l => l.id === "arm_espada_curta");
  const prep = prepararRolagem({ tipo: "dano", rotulo: l.nome, grupos: l.gruposDano, linhaArma: l, modoDano: "critico" }, { sessao: s, derived: d });
  if (!prep.ok) throw Error(prep.etapa); dano = rolarDano(prep.pronta, () => 0.5); s = registraRolagemArma(S.registraRolagem(s, dano), prep.desc, dano);
 }
 const confirmado = confirmaAtaqueConteudo(s, d, sa, da, { ataqueId: r.id, danoId: dano?.id, alvoId: "original", inimigo: true }, p());
 if (!confirmado.aplicado) throw Error(confirmado.erro);
 s = confirmado.sessao;
 if (antesDaPostura) s = assumePosturaConteudo(s, atual(c, s), { postura: "dragao" }, p()).sessao;
 d = atual(c, s);
 return { c, ca, cb, d, da, db, s, sa: confirmado.sessaoAlvo, sb, turno, r, confirmado,
  entrada: { ataqueId: r.id, voceId: "atacante", alvoId: "vizinho", inimigo: true, em1_5mDoAlvo: true, turnoEmCurso: turno, rngAlvo: () => 0 } };
}
aplicarAddons([]);
for (const sistema of ["player", "afty"]) {
 const a = ataque(sistema), { s, d, sb, db, entrada } = a;
 t(`${sistema} ficha e escolhas admissíveis`, [d.habilidades.inacessiveis, d.habilidades.excedeu, d.testes.orcamento.excedeu, db.talentos.inacessiveis], [[], false, false, []]);
 t(`${sistema} pedido preserva postura e turno`, [a.r.contextoTurno.posturaDragao, a.r.contextoTurno.emCurso], [true, a.turno]);
 t(`${sistema} ataque confirmado elegível`, D.ataquesParaDragao(s, d, a.turno).map(x => x.ataqueId), [a.r.id]);
 const pedido = p(), rola = D.rolaDragaoConteudo(s, d, sb, db, entrada, pedido);
 if (!rola.aplicado) throw Error(rola.erro);
 t(`${sistema} TR na sessão do inimigo`, [rola.rolagem.resistenciaId, rola.rolagem.cd, rola.sessaoAlvo.log[0].id], ["fortitude", d.cd, rola.rolagem.id]);
 t(`${sistema} não cobra ação ou recurso`, [rola.sessao.uso.acoes, rola.sessao.peAtual, rola.sessaoAlvo.uso.acoes, rola.sessaoAlvo.hpAtual], [s.uso.acoes, s.peAtual, sb.uso.acoes, sb.hpAtual]);
 t(`${sistema} repete operação sem rolar`, D.rolaDragaoConteudo(rola.sessao, d, rola.sessaoAlvo, db, entrada, pedido).repetida, true);
 t(`${sistema} par ataque/inimigo não repete`, D.rolaDragaoConteudo(rola.sessao, d, rola.sessaoAlvo, db, entrada, p()).sessao === rola.sessao, true);
 const e = { ...entrada, testeId: rola.rolagem.id }, fim = D.aplicaDragaoConteudo(rola.sessao, d, rola.sessaoAlvo, db, e, p());
 if (!fim.aplicado) throw Error(fim.erro);
 const original = a.confirmado.calculos[0].final, metade = Math.floor(original / 2), rd = db.defesasDano.porTipo.ct.rd;
 t(`${sistema} metade usa dano final recebido`, [fim.tr.resultado, fim.calculos[0].base, fim.calculos[0].tipoDano], ["falha", metade, "ct"]);
 t(`${sistema} defesas próprias do secundário`, [fim.calculos[0].final, sb.hpAtual - fim.sessaoAlvo.hpAtual], [Math.max(0, metade - rd), Math.max(0, metade - rd)]);
 t(`${sistema} original conserva seu dano`, a.sa.hpAtual, a.da.hp - original);
 t(`${sistema} não gera segundo ataque ou sequência`, [fim.sessaoAlvo.uso.sequencia.ataques, fim.sessao.uso.acoes], [0, s.uso.acoes]);
 t(`${sistema} marca consequência no TR`, fim.sessaoAlvo.log.find(r => r.id === rola.rolagem.id).consequenciasAplicadas, true);
 t(`${sistema} resultado não repete com outra operação`, D.aplicaDragaoConteudo(fim.sessao, d, fim.sessaoAlvo, db, e, p()).sessao === fim.sessao, true);
 const sorte = rolaSorte(rola.sessaoAlvo, db, { id: rola.rolagem.id, rng: () => 0.999 }, p());
 if (!sorte.aplicado) throw Error(sorte.erro);
 t(`${sistema} Sorte pendente recusa consequência`, D.aplicaDragaoConteudo(rola.sessao, d, sorte.sessao, db, e, p()).sessao === rola.sessao, true);
 const escolhida = escolheSorte(sorte.sessao, db, { id: rola.rolagem.id, escolha: "novo" }, p());
 if (!escolhida.aplicado) throw Error(escolhida.erro);
 const resistiu = D.aplicaDragaoConteudo(rola.sessao, d, escolhida.sessao, db, e, p());
 t(`${sistema} usa rerrolagem atual antes da consequência`, [resistiu.aplicado, resistiu.tr?.resultado, resistiu.sessaoAlvo?.hpAtual, resistiu.calculos], [true, "sucesso", sb.hpAtual, []]);
 t(`${sistema} Sorte após consequência é recusada`, rolaSorte(fim.sessaoAlvo, db, { id: rola.rolagem.id }, p()).aplicado, false);
 const relida = S.normalizaSessao(JSON.parse(JSON.stringify(rola.sessao)), d), alvoRelido = S.normalizaSessao(JSON.parse(JSON.stringify(rola.sessaoAlvo)), db);
 t(`${sistema} salvar entre TR e dano funciona`, D.aplicaDragaoConteudo(relida, d, alvoRelido, db, e, p()).sessaoAlvo.hpAtual, fim.sessaoAlvo.hpAtual);
 const dbCobrir = deriveAfty({ ...a.cb, aptidoes: { ...a.cb.aptidoes, cl: 1 }, aptidoesAmaldicoadas: ["cobrir_se"] });
 const dbReacao = { ...dbCobrir, defesasDano: { ...dbCobrir.defesasDano,
  porTipo: { ...dbCobrir.defesasDano.porTipo, ct: { estados: [], rd: 0 } } } };
 const emCurso = { ...e, mesa: { origemId: e.voceId, turnoEmCurso: e.turnoEmCurso } }, q = p();
 const consultar = (patch = {}, sa = alvoRelido) => D.aplicaDragaoConteudo(relida, d, sa, dbReacao, { ...emCurso, ...patch }, q);
 const escolha = consultar();
 t(`${sistema} abre reação de Dragão sem gravar dano ou consequência`, [escolha.aplicado, escolha.sessao === relida,
  escolha.sessaoAlvo, escolha.janelaReacao?.opcoes.map((o) => o.id)], [false, true, undefined, ["cobrir"]]);
 const resposta = { id: "cobrir", pe: 1, chave: escolha.janelaReacao.chave };
 const recusaFonte = consultar({ mesa: { ...emCurso.mesa, origemId: "outra" }, janelaReacao: resposta });
 t(`${sistema} reage apenas ao emissor conferido no recibo`, [recusaFonte.aplicado, recusaFonte.sessaoAlvo], [false, undefined]);
 const cobriu = consultar({ janelaReacao: resposta });
 t(`${sistema} desconta cobertura e aplica metade ao mesmo tempo`, [cobriu.aplicado, cobriu.sessaoAlvo?.peAtual,
  cobriu.sessaoAlvo?.hpAtual, cobriu.sessao?.log[0].reacaoDano?.pv],
 [true, alvoRelido.peAtual - 1, alvoRelido.hpAtual - Math.max(0, metade - 4), 4]);
 t(`${sistema} reação e dano do Dragão não repetem`,
  D.aplicaDragaoConteudo(cobriu.sessao, d, cobriu.sessaoAlvo, dbReacao, { ...emCurso, janelaReacao: resposta }, q).repetida, true);
 for (const [n, patch] of [["primeiro alvo", { alvoId: "original" }], ["próprio atacante", { alvoId: "atacante" }], ["não inimigo", { inimigo: false }], ["fora de alcance", { em1_5mDoAlvo: false }], ["outra rodada", { turnoEmCurso: { ...a.turno, rodada: 2 } }], ["outro turno", { turnoEmCurso: { ...a.turno, turno: 1 } }], ["modo inválido", { modoAlvo: "qualquer" }]]) t(`${sistema} ${n} recusa antes de dado`, D.rolaDragaoConteudo(s, d, sb, db, { ...entrada, ...patch, rngAlvo: () => { throw Error("Não Deve Rolar"); } }, p()).sessao === s, true);
 t(`${sistema} sem identidade recusa`, D.rolaDragaoConteudo(s, d, sb, db, entrada, {}).sessao === s, true);
 t(`${sistema} concluir contra outro alvo recusa`, D.aplicaDragaoConteudo(rola.sessao, d, rola.sessaoAlvo, db, { ...e, alvoId: "outro" }, p()).sessao === rola.sessao, true);
 t(`${sistema} concluir depois de mudar turno recusa`, D.aplicaDragaoConteudo(rola.sessao, d, rola.sessaoAlvo, db, { ...e, turnoEmCurso: { ...a.turno, turno: 1 } }, p()).sessao === rola.sessao, true);
 const antes = ataque(sistema, { antesDaPostura: true });
 t(`${sistema} entrar depois do ataque não concede Dragão`, D.rolaDragaoConteudo(antes.s, antes.d, antes.sb, antes.db, antes.entrada, p()).sessao === antes.s, true);
 const erro = ataque(sistema, { errou: true }), trErro = D.rolaDragaoConteudo(erro.s, erro.d, erro.sb, erro.db, erro.entrada, p());
 if (!trErro.aplicado) throw Error(trErro.erro);
 const fimErro = D.aplicaDragaoConteudo(trErro.sessao, erro.d, trErro.sessaoAlvo, erro.db, { ...erro.entrada, testeId: trErro.rolagem.id }, p());
 t(`${sistema} ataque errado faz TR mas não inventa dano`, [fimErro.aplicado, fimErro.calculos, fimErro.sessaoAlvo.hpAtual], [true, [], erro.sb.hpAtual]);
 const protegido = { ...db, defesasDano: { ...db.defesasDano, porTipo: { ...db.defesasDano.porTipo, ct: { ...db.defesasDano.porTipo.ct, estados: ["imune"], conflito: false } } } };
 const imune = D.aplicaDragaoConteudo(rola.sessao, d, rola.sessaoAlvo, protegido, e, p());
 t(`${sistema} imunidade do secundário respeitada pelo núcleo`, [imune.aplicado, imune.sessaoAlvo.hpAtual, imune.calculos[0].final], [true, sb.hpAtual, 0]);
 const conflito = { ...db, defesasDano: { ...db.defesasDano, porTipo: { ...db.defesasDano.porTipo, ct: { ...db.defesasDano.porTipo.ct, estados: ["resistente", "vulneravel"], conflito: true } } } };
 const recusada = D.aplicaDragaoConteudo(rola.sessao, d, rola.sessaoAlvo, conflito, e, p());
 t(`${sistema} conflito não aplica parcialmente`, [recusada.aplicado, recusada.sessao === rola.sessao, recusada.sessaoAlvo], [false, true, undefined]);
 t(`${sistema} desempate de mesa usa o núcleo`, D.aplicaDragaoConteudo(rola.sessao, d, rola.sessaoAlvo, conflito, { ...e, desempate: "nenhum" }, p()).sessaoAlvo.hpAtual, fim.sessaoAlvo.hpAtual);
 const semHabilidade = deriveAfty({ ...a.c, habilidades: [], escolhasHabilidade: {}, combate: s.combate });
 t(`${sistema} escolha sem pai acessível recusa`, D.rolaDragaoConteudo(s, semHabilidade, sb, db, entrada, p()).sessao === s, true);
 t(`${sistema} alvo morto não recebe TR`, D.rolaDragaoConteudo(s, d, { ...sb, vital: { ...sb.vital, estado: "morto" } }, db, entrada, p()).aplicado, false);
 const outro = D.rolaDragaoConteudo(fim.sessao, d, sb, db, { ...entrada, alvoId: "outro" }, p());
 t(`${sistema} o mesmo ataque resolve outro inimigo`, outro.aplicado, true);
 const fimOutro = D.aplicaDragaoConteudo(outro.sessao, d, outro.sessaoAlvo, db, { ...entrada, alvoId: "outro", testeId: outro.rolagem.id }, p());
 t(`${sistema} segundo inimigo recebe seu próprio dano`, fimOutro.sessaoAlvo.hpAtual, fim.sessaoAlvo.hpAtual);
 for (const variacao of [{ reacao: true }, { postura: "imitacao" }, { postura: "apice" }]) {
  const x = ataque(sistema, variacao);
  const tr = D.rolaDragaoConteudo(x.s, x.d, x.sb, x.db, x.entrada, p());
  t(`${sistema} Dragão em ${Object.keys(variacao)[0]} ${Object.values(variacao)[0]}`, [x.d.habilidades.inacessiveis, tr.aplicado], [[], true]);
 }
 const m = ataque(sistema, { canalizada: true });
 const misto = D.rolaDragaoConteudo(m.s, m.d, m.sb, m.db, m.entrada, p());
 const em = { ...m.entrada, testeId: misto.rolagem.id };
 t(`${sistema} ataque misto confirmado por tipo`, m.confirmado.calculos.map(g => g.tipoDano), ["ct", "energia_reversa"]);
 const mf = D.aplicaDragaoConteudo(misto.sessao, m.d, misto.sessaoAlvo, m.db, em, p());
 t(`${sistema} Dragão misto conserva tipos e metade`, [mf.aplicado, mf.calculos?.map(g => g.tipoDano), mf.calculos?.reduce((n, g) => n + g.base, 0)],
  [true, ["ct", "energia_reversa"], Math.floor(m.confirmado.calculos.reduce((n, g) => n + g.final, 0) / 2)]);
 const limite = D.aplicaDragaoConteudo(misto.sessao, m.d, misto.sessaoAlvo, db, em, p());
 t(`${sistema} reversa em secundário de outra origem fica com a mesa`, [limite.sessao === misto.sessao, limite.erro], [true, "Dano de Energia Reversa do Dragão Requer Resolução na Mesa"]);
 const resistente = ficha(sistema, "vizinho"); resistente.core.nd = 20; resistente.especializacoes[0].nivel = 20;
 resistente.attributes.forca = 13; resistente.attributes.constituicao = 15;
 resistente.core.origem.bonusAtributos = { constituicao: 2, destreza: 1 }; resistente.attrNivel.constituicao = 3;
 const dt = deriveAfty(resistente), st = inicio(dt);
 const resistencia = D.rolaDragaoConteudo(m.s, m.d, st, dt, { ...m.entrada, rngAlvo: () => 0.999 }, p());
 const sucesso = D.aplicaDragaoConteudo(resistencia.sessao, m.d, resistencia.sessaoAlvo, dt, { ...m.entrada, testeId: resistencia.rolagem.id }, p());
 t(`${sistema} sucesso sem dano independe da origem`, [sucesso.tr?.resultado, sucesso.sessaoAlvo?.hpAtual], ["sucesso", st.hpAtual]);
}
t("dois tipos ímpares deixam a distribuição em aberto", D.metadesDoDragao([{ tipoDano: "ct", final: 5 }, { tipoDano: "queimante", final: 7 }]), null);
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
