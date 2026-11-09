/* CL3: DOMÍNIOS E BARREIRAS. Confronto e Contestação entre dois participantes (p.185 e 186), Paredes, Cortinas e a Cesta Oca
   de Vime (p.188 e 189), com duas fichas reais e duas sessões reais. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const S = await import(R + "ficha/ficha-sessao.js");
const D = await import(R + "ficha/ficha-dominio-confronto.js");
const B = await import(R + "ficha/ficha-barreiras.js");
const BE = await import(R + "ficha/ficha-barreiras-estado.js");
const C = await import(R + "ficha/ficha-concentracao.js");
const U = await import(R + "ficha/ficha-uso-estado.js");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};
let n = 0;
const op = () => `op_d_${(n += 1)}`;

/* ============================================================ */
/* FICHAS                                                         */
/* ============================================================ */
const ficha = ({ dom = 5, bar = 3, versao = "completa", nd = 20, extraApt = [] } = {}) => {
  const c = createBlankAfty();
  c.core.nd = nd;
  c.core.tipo = "conjurador";
  c.core.patamar = "comum";
  c.core.origem = { id: "inato" };
  c.aptidoes = { dom, bar };
  c.aptidoesAmaldicoadas = [
    "tecnicas_de_barreira", "cortina", "barreira_rapida", "cesta_oca_de_vime",
    "expansao_de_dominio_incompleta", "expansao_de_dominio_completa", ...extraApt,
  ];
  c.dominios = [{ id: "d1", nome: "Expansão", versao, efeitos: [] }];
  return c;
};
const emCombate = (derived) => S.aplicaPatchCombate(S.sessaoEmBranco(derived), { ativo: true });
const parte = (id, nome, c, sessao) => {
  const derived = deriveAfty(c);
  return { id, nome, sessao: sessao ?? emCombate(derived), derived };
};

/* ============================================================ */
/* 1. RESOLVER O CONFRONTO (puro)                                  */
/* ============================================================ */
const p = (dom, bonus, versao = "completa", nome = "x") => ({ id: nome, nome, dom, bonus, versao });
const res = (a, b, extra = {}) => D.resolveConfronto({ desafiante: a, defensor: b, ...extra });

const igual = res(p(4, 14, "completa", "A"), p(4, 10, "completa", "B"), { d10: { desafiante: 5, defensor: 5 } });
t("mesmo DOM: teste decide, 19 contra 15 fica estendido", [igual.resultado, igual.totais], ["estendido", { desafiante: 19, defensor: 15 }]);
t("mesmo DOM: 5 ou mais de diferença vence", res(p(4, 15), p(4, 10), { d10: { desafiante: 5, defensor: 5 } }).vencedor, "desafiante");
t("mesmo DOM: 4 de diferença não basta", res(p(4, 14), p(4, 10), { d10: { desafiante: 5, defensor: 5 } }).resultado, "estendido");
t("mesmo DOM: o defensor também vence por 5", res(p(4, 10), p(4, 15), { d10: { desafiante: 5, defensor: 5 } }).vencedor, "defensor");
t("mesmo DOM sem rolagem pede o d10 e traz os bônus", (({ resultado, necessitaRolagem, bonus }) => [resultado, necessitaRolagem, bonus])(res(p(4, 14), p(4, 10))), ["pendente-rolagem", true, { desafiante: 14, defensor: 10 }]);
t("o d10 fora de 1 a 10 é recusado", res(p(4, 14), p(4, 10), { d10: { desafiante: 11, defensor: 5 } }).resultado, "impossivel");
t("modo contraAtiva dá +2 ao defensor", res(p(4, 14), p(4, 10), { modo: "contraAtiva", d10: { desafiante: 5, defensor: 5 } }).totais, { desafiante: 19, defensor: 17 });
t("modo reação não dá +2 a ninguém", res(p(4, 14), p(4, 10), { modo: "reacao", d10: { desafiante: 5, defensor: 5 } }).totais, { desafiante: 19, defensor: 15 });
t("DOM superior vence na hora, sem teste", (({ resultado, vencedor, via }) => [resultado, vencedor, via])(res(p(5, 0), p(3, 99))), ["vitoria", "desafiante", "nivel"]);
t("DOM superior do defensor vence na hora", res(p(3, 99), p(5, 0)).vencedor, "defensor");
t("DOM menor por 1 e bônus maior por 5: o desafiante confronta com teste", res(p(3, 20), p(4, 10)).resultado, "pendente-rolagem");
t("DOM menor por 1 e bônus maior por 4: perde na hora", res(p(3, 14), p(4, 10)).vencedor, "defensor");
t("DOM menor por 2 não tem exceção", res(p(2, 99), p(4, 10)).vencedor, "defensor");
t("a exceção do DOM-1 é só de quem confronta: o defensor com menos DOM perde", res(p(4, 10), p(3, 99)).vencedor, "desafiante");
t("contra Expansão ativa, DOM menor vira Contestação", res(p(3, 99), p(5, 0), { modo: "contraAtiva" }).resultado, "contestacao");
t("contra Expansão ativa, Incompleta vira Contestação", res(p(3, 0, "incompleta"), p(3, 0), { modo: "contraAtiva" }).resultado, "contestacao");
t("em reação a Incompleta não confronta", res(p(3, 0, "incompleta"), p(3, 0)).resultado, "impossivel");
t("a Incompleta do defensor perde na hora", (({ vencedor, via }) => [vencedor, via])(res(p(3, 0), p(5, 99, "incompleta"))), ["desafiante", "incompleta"]);
t("duas Incompletas não se confrontam", res(p(3, 0, "incompleta"), p(3, 0, "incompleta")).resultado, "impossivel");
t("Completa contra Sem Barreiras exige o usuário preso", res(p(4, 0), p(4, 0, "sem_barreiras")).resultado, "impossivel");
t("Completa contra Sem Barreiras com o usuário preso", res(p(4, 0), p(4, 0, "sem_barreiras"), { presoNaBarreira: true }).resultado, "pendente-rolagem");
t("modo desconhecido é recusado", res(p(4, 0), p(4, 0), { modo: "x" }).resultado, "impossivel");
t("sem Expansão não há confronto", res({ id: "a", dom: 4, bonus: 1, versao: null }, p(4, 0)).resultado, "impossivel");
const r10 = D.rolaConfronto(() => 0.999);
t("rolaConfronto fica entre 1 e 10", [r10.desafiante, r10.defensor], [10, 10]);
t("rolaConfronto mínimo é 1", D.rolaConfronto(() => 0).desafiante, 1);

/* ============================================================ */
/* 2. O CONFRONTO ENTRE DUAS FICHAS                               */
/* ============================================================ */
const cA = ficha({ dom: 4 });
const cB = ficha({ dom: 4 });
const dA = deriveAfty(cA);
const dB = deriveAfty(cB);
t("a ficha tem Conflito e Expansão", [dA.dominios.lista.length, dA.dominios.conflito.bonus], [1, 4 + 10]);

// B abre a Expansão (está ativando). A reage.
const sB0 = S.abreExpansao(emCombate(dB), dB.dominios.lista[0]);
t("B está com a Expansão ativa", S.expansaoNaSessao(sB0).fase, "ativa");
const pa = parte("A", "Ana", cA);
const pb = { id: "B", nome: "Beto", sessao: sB0, derived: dB };
t("o participante traz o bônus sem o +2 embutido", [D.participanteDeDominio(pb).bonus, D.participanteDeDominio(pb).fase], [14, "ativa"]);

const o1 = op();
const ini = D.iniciaConfronto({ modo: "reacao", desafiante: pa, defensor: pb, opId: o1 });
t("iniciar aplica", ini.ok && ini.aplicado, true);
t("o desafiante abre e entra em confronto", [S.expansaoNaSessao(ini.desafiante).fase, ini.desafiante.combate.dominioConfronto.lado], ["confronto", "desafiante"]);
t("o defensor entra em confronto", [S.expansaoNaSessao(ini.defensor).fase, ini.defensor.combate.dominioConfronto.contra], ["confronto", "A"]);
t("o PE do desafiante foi pago", pa.sessao.peAtual - ini.desafiante.peAtual, 20);
t("a Reação do Confronto fica gasta", Object.keys(ini.desafiante.uso.acoes.reacoes), [D.ACAO_DE_CONFRONTO_ID]);
t("perde a Ação Comum do próximo turno", ini.desafiante.uso.acoes.semComum, true);
t("o início do turno gasta a Ação Comum", U.iniciaTurnoNoUso(ini.desafiante).uso.acoes.gastas.comum, 1);
t("e a flag some depois do turno", "semComum" in U.iniciaTurnoNoUso(ini.desafiante).uso.acoes, false);
t("em confronto a Expansão não vale", [dA.dominios.lista.length > 0, ini.desafiante.combate.dominioFase], [true, "confronto"]);
const repetido = D.iniciaConfronto({ modo: "reacao", desafiante: { ...pa, sessao: ini.desafiante }, defensor: { ...pb, sessao: ini.defensor }, opId: o1 });
t("repetir o opId é repetida e não muda as sessões", [repetido.repetida, repetido.desafiante === ini.desafiante, repetido.defensor === ini.defensor], [true, true, true]);
t("sem opId recusa", D.iniciaConfronto({ desafiante: pa, defensor: pb }).codigo, "sem-opid");
const semDefensor = D.iniciaConfronto({ desafiante: pa, defensor: { ...pb, sessao: emCombate(dB) }, opId: op() });
t("defensor sem Expansão aberta recusa e devolve as sessões como entraram", [semDefensor.codigo, semDefensor.desafiante === pa.sessao], ["defensor-sem-expansao", true]);

// Vitória do desafiante
const pa1 = { ...pa, sessao: ini.desafiante };
const pb1 = { ...pb, sessao: ini.defensor };
const o2 = op();
const vit = D.aplicaResultadoDoConfronto({ desafiante: pa1, defensor: pb1, resultado: "desafiante", opId: o2 });
t("vitória completa a Expansão do vencedor", [S.expansaoNaSessao(vit.desafiante).fase, vit.desafiante.combate.dominioConfronto], ["ativa", undefined]);
t("o perdedor fecha a Expansão", S.expansaoNaSessao(vit.defensor), null);
t("o perdedor ganha a Exaustão de Técnica da versão", vit.defensor.exaustaoTecnica.restantes, 2);
t("o vencedor não ganha Exaustão", vit.desafiante.exaustaoTecnica, null);
t("o vínculo do perdedor sai", vit.defensor.combate.dominioConfronto, undefined);
const vit2 = D.aplicaResultadoDoConfronto({ desafiante: { ...pa1, sessao: vit.desafiante }, defensor: { ...pb1, sessao: vit.defensor }, resultado: "desafiante", opId: o2 });
t("aplicar o resultado duas vezes não repete", [vit2.repetida, vit2.desafiante === vit.desafiante], [true, true]);
t("outro resultado depois de decidido é recusado", D.aplicaResultadoDoConfronto({ desafiante: { ...pa1, sessao: vit.desafiante }, defensor: { ...pb1, sessao: vit.defensor }, resultado: "defensor", opId: op() }).codigo, "sem-confronto");
t("sem vínculo no mesmo confronto recusa", D.aplicaResultadoDoConfronto({ desafiante: pa, defensor: pb, resultado: "desafiante", opId: op() }).codigo, "sem-confronto");
t("resultado inválido recusa", D.aplicaResultadoDoConfronto({ desafiante: pa1, defensor: pb1, resultado: "x", opId: op() }).codigo, "resultado-invalido");

// Empate estendido
const est = D.aplicaResultadoDoConfronto({ desafiante: pa1, defensor: pb1, resultado: "estendido", opId: op() });
t("estendido: as duas seguem abertas, nada valendo", [S.expansaoNaSessao(est.desafiante).fase, S.expansaoNaSessao(est.defensor).fase], ["estendido", "estendido"]);
t("estendido mantém os vínculos", [!!D.confrontoDe(est.desafiante), !!D.confrontoDe(est.defensor)], [true, true]);

// Resolver pelo combate: dano ao usuário vai ao domo, o domo cai, o outro é restaurado
const pa2 = { ...pa, sessao: est.desafiante };
const pb2 = { ...pb, sessao: est.defensor };
const antes = S.expansaoNaSessao(pb2.sessao).pvDomo;
const dano = D.danoDoUsuarioNoDominio(pb2.sessao, 100, { opId: op() });
t("o dano ao usuário chega pela metade ao domo", [dano.chegouAoDomo, antes - S.expansaoNaSessao(dano.sessao).pvDomo], [50, 50]);
t("fora do confronto o dano ao usuário não vai ao domo", D.danoDoUsuarioNoDominio(vit.desafiante, 100, { opId: op() }).foraDoConfronto, true);
const caido = S.defineDomo(dano.sessao, 0);
t("o domo a zero fecha a Expansão do usuário", S.expansaoNaSessao(caido), null);
const rec = D.reconciliaConfronto({ a: { ...pa2, id: "A" }, b: { id: "B", sessao: caido } });
t("o sobrevivente é restaurado: Acerto Garantido e efeitos valem de novo", [S.expansaoNaSessao(rec.a).fase, rec.restaurou], ["ativa", "A"]);
t("os vínculos somem", [rec.a.combate.dominioConfronto, rec.b.combate.dominioConfronto], [undefined, undefined]);
t("o que caiu por domo cobra a Exaustão", caido.exaustaoTecnica.restantes, 2);
const rec2 = D.reconciliaConfronto({ a: { id: "A", sessao: rec.a }, b: { id: "B", sessao: rec.b } });
t("reconciliar de novo não muda nada", [rec2.aplicado, rec2.a === rec.a, rec2.b === rec.b], [false, true, true]);
const incons = D.derrubaDominioDoInconsciente({ sessao: pb2.sessao, derived: dB }, { opId: op() });
t("o usuário inconsciente perde o domínio na hora", [S.expansaoNaSessao(incons.sessao), incons.sessao.exaustaoTecnica.restantes], [null, 2]);
t("fora do confronto o inconsciente não derruba", D.derrubaDominioDoInconsciente({ sessao: vit.desafiante, derived: dA }, { opId: op() }).foraDoConfronto, true);

// Modo contra Expansão ativa: a Reação não é usada, é a Ação Comum
const sB1 = S.abreExpansao(emCombate(dB), dB.dominios.lista[0]);
const ini2 = D.iniciaConfronto({ modo: "contraAtiva", desafiante: parte("A", "Ana", cA), defensor: { id: "B", nome: "Beto", sessao: sB1, derived: dB }, opId: op() });
t("contra Expansão ativa gasta a Ação Comum, não a Reação", [ini2.desafiante.uso.acoes.gastas.comum, ini2.desafiante.uso.acoes.semComum], [1, undefined]);

/* ============================================================ */
/* 3. A CONTESTAÇÃO                                               */
/* ============================================================ */
const cC = ficha({ dom: 3, versao: "completa" });
const dC = deriveAfty(cC);
const cAlvo = ficha({ dom: 5 });
const dAlvo = deriveAfty(cAlvo);
const sAlvo = S.abreExpansao(emCombate(dAlvo), dAlvo.dominios.lista[0]);
const pc = parte("C", "Cris", cC);
const pal = { id: "X", nome: "Xavier", sessao: sAlvo, derived: dAlvo };
t("Completa de DOM menor pode contestar", D.podeContestar(D.participanteDeDominio(pc), D.participanteDeDominio(pal)).ok, true);
t("Completa de DOM igual ou maior não contesta", D.podeContestar({ versao: "completa", dom: 5 }, { aberta: true, temDomo: true, dom: 5 }).ok, false);
t("Incompleta sempre contesta o que está ativo", D.podeContestar({ versao: "incompleta", dom: 5 }, { aberta: true, temDomo: true, dom: 1 }).ok, true);
t("Sem Barreiras não contesta", D.podeContestar({ versao: "sem_barreiras", dom: 3 }, { aberta: true, temDomo: true, dom: 5 }).ok, false);
t("sem domínio ativo não há o que contestar", D.podeContestar({ versao: "incompleta", dom: 1 }, { aberta: false, temDomo: true, dom: 5 }).ok, false);
t("alvo sem domo não é contestável", D.podeContestar({ versao: "incompleta", dom: 1 }, { aberta: true, temDomo: false, dom: 5 }).ok, false);
t("sem confirmar as mãos recusa", D.iniciaContestacao({ contestador: pc, alvo: pal, maosLivres: false, opId: op() }).codigo, "requisito-nao-confirmado");
const o3 = op();
const ic = D.iniciaContestacao({ contestador: pc, alvo: pal, maosLivres: true, opId: o3, rodada: 1 });
t("a Contestação abre", ic.ok && ic.aplicado, true);
t("o contestador entra na fase contestando, concentrado", [S.expansaoNaSessao(ic.contestador).fase, U.usoDe(ic.contestador).concentracao.id.startsWith("contestacao:")], ["contestando", true]);
t("o alvo registra quem o contesta", D.contestacaoDe(ic.alvo).contestadores.map((x) => x.id), ["C"]);
t("o Acerto Garantido fica suprimido por quem contesta", D.acertoGarantidoSuprimidoPor(ic.alvo).map((x) => x.nome), ["Cris"]);
t("a Contestação gasta a Ação Comum", ic.contestador.uso.acoes.gastas.comum, 1);
t("repetir o opId não repete", D.iniciaContestacao({ contestador: { ...pc, sessao: ic.contestador }, alvo: { ...pal, sessao: ic.alvo }, maosLivres: true, opId: o3 }).repetida, true);

const o4 = op();
const rd1 = D.avancaContestacao({ contestador: { ...pc, sessao: ic.contestador }, alvo: { ...pal, sessao: ic.alvo }, opId: o4, rodada: 2 });
const vidaDomo = dAlvo.dominios.lista[0].pvBarreira;
t("o dano da rodada: DOM × 50 na Completa", rd1.dano, 3 * 50);
t("o domo perde esse dano", [rd1.pvAntes, rd1.pvDepois], [vidaDomo, vidaDomo - 150]);
t("com 270 de 420 (64%) uma pessoa já passa", rd1.passagem, "uma-pessoa");
t("a mesma rodada não conta duas vezes", D.avancaContestacao({ contestador: { ...pc, sessao: rd1.contestador }, alvo: { ...pal, sessao: rd1.alvo }, opId: op(), rodada: 2 }).jaContada, true);
t("repetir o opId não repete o dano", D.avancaContestacao({ contestador: { ...pc, sessao: rd1.contestador }, alvo: { ...pal, sessao: rd1.alvo }, opId: o4, rodada: 3 }).repetida, true);
t("a passagem abre pela vida do domo", [D.passagemDaBarreira(300, 400), D.passagemDaBarreira(200, 400), D.passagemDaBarreira(201, 400), D.passagemDaBarreira(301, 400)], ["uma-pessoa", "qualquer", "uma-pessoa", "fechada"]);
let ctx = { contestador: rd1.contestador, alvo: rd1.alvo };
let ultima = null;
for (let rodada = 3; rodada <= 6; rodada += 1) {
  ultima = D.avancaContestacao({ contestador: { ...pc, sessao: ctx.contestador }, alvo: { ...pal, sessao: ctx.alvo }, opId: op(), rodada });
  ctx = { contestador: ultima.contestador, alvo: ultima.alvo };
}
t("com 600 de dano o domo de 420 caiu", [ultima.alvoCaiu, S.expansaoNaSessao(ctx.alvo)], [true, null]);
t("o alvo que caiu cobra a Exaustão", ctx.alvo.exaustaoTecnica.restantes, 2);
t("a Concentração quebrada pede para encerrar a Contestação", [D.contestacaoPerdeuAConcentracao(ic.contestador), D.contestacaoPerdeuAConcentracao(C.perdeConcentracao(ic.contestador, dC).sessao)], [false, true]);
const fim = D.encerraContestacao({ contestador: { ...pc, sessao: ic.contestador }, alvo: { ...pal, sessao: ic.alvo }, opId: op() });
t("encerrar fecha a Expansão do contestador com Exaustão", [S.expansaoNaSessao(fim.contestador), fim.contestador.exaustaoTecnica.restantes], [null, 2]);
t("encerrar solta a Concentração", U.usoDe(fim.contestador).concentracao, null);
t("encerrar limpa o registro do alvo", D.contestacaoDe(fim.alvo), null);
t("sem Contestação não há o que encerrar", D.encerraContestacao({ contestador: pc, alvo: pal, opId: op() }).codigo, "sem-contestacao");

/* ============================================================ */
/* 4. PAREDES E CORTINAS                                          */
/* ============================================================ */
const cb = ficha({ bar: 3, nd: 20 });
const db = deriveAfty(cb);
let sb = emCombate(db);
t("o derive entrega o PV da parede, a RD e o máximo", [db.dominios.barreira.pvParede, db.dominios.barreira.maxParedes, db.dominios.barreira.pvCortina], [35, 6, 105]);
const ob = op();
const er = B.erguerParedes(sb, db, { quantidade: 4, opId: ob });
t("erguer 4 paredes", [er.aplicado, BE.barreirasDe(er.sessao).paredes.length], [true, 4]);
t("cada parede traz o PV e a RD do derive", BE.barreirasDe(er.sessao).paredes[0], { id: `parede_${ob}_1`, pv: 35, pvMax: 35, rd: 0, desde: 0 });
t("o custo é 1 PE por parede, sem debitar na política manual", [er.custo.pe.pedido, er.custo.pe.naoDescontado, er.sessao.peAtual === sb.peAtual], [4, 4, true]);
t("a política confirmada debita", sb.peAtual - B.erguerParedes(sb, db, { quantidade: 4, opId: op(), cobranca: "confirmada" }).sessao.peAtual, 4);
t("repetir o opId devolve a mesma sessão", B.erguerParedes(er.sessao, db, { quantidade: 4, opId: ob }).sessao === er.sessao, true);
t("mais que o máximo de uma vez recusa", B.erguerParedes(sb, db, { quantidade: 7, opId: op() }).codigo, "parametro-invalido");
t("zero paredes recusa", B.erguerParedes(sb, db, { quantidade: 0, opId: op() }).aplicado, false);
t("sem Energia recusa", B.erguerParedes({ ...sb, peAtual: 2 }, db, { quantidade: 4, opId: op() }).codigo, "sem-energia");
t("sem a aptidão recusa", B.erguerParedes(sb, deriveAfty({ ...cb, aptidoesAmaldicoadas: [] }), { quantidade: 1, opId: op() }).aplicado, false);
t("sem opId recusa", B.erguerParedes(sb, db, { quantidade: 1 }).codigo, "sem-opid");
t("com Barreira Rápida a ação é bônus", B.descritorDasParedes(deriveAfty(ficha({ bar: 3 }))).acao, "bonus");
const semRapida = deriveAfty({ ...cb, aptidoesAmaldicoadas: cb.aptidoesAmaldicoadas.filter((x) => x !== "barreira_rapida") });
t("sem Barreira Rápida a ação é comum", B.descritorDasParedes(semRapida).acao, "comum");
const comAcao = B.erguerParedes(sb, semRapida, { quantidade: 2, opId: op(), registraAcao: true });
t("erguer registra a ação comum", comAcao.sessao.uso.acoes.gastas.comum, 1);
t("manipular gasta a ação", B.manipularBarreiras(sb, db, { opId: op(), registraAcao: true }).sessao.uso.acoes.gastas.bonus, 1);

const idP = BE.barreirasDe(er.sessao).paredes[0].id;
const d1 = B.danoNaBarreira(er.sessao, idP, 20, { opId: op() });
t("dano na parede", [d1.liquido, d1.pv, d1.destruida], [20, 15, false]);
const d2 = B.danoNaBarreira(d1.sessao, idP, 100, { opId: op() });
t("a zero a parede é destruída e sai", [d2.destruida, BE.barreirasDe(d2.sessao).paredes.length], [true, 3]);
t("dano em id que não existe recusa", B.danoNaBarreira(er.sessao, "nada", 5, { opId: op() }).codigo, "barreira-inexistente");
const dRepete = op();
const dr1 = B.danoNaBarreira(er.sessao, idP, 5, { opId: dRepete });
t("repetir o id do dano não fere de novo", B.danoNaBarreira(dr1.sessao, idP, 5, { opId: dRepete }).repetida, true);
const comRd = { ...er.sessao, barreiras: { paredes: [{ id: "p", pv: 35, pvMax: 35, rd: 5, desde: 0 }], cortinas: [] } };
t("a RD da parede abate o dano", B.danoNaBarreira(comRd, "p", 8, { opId: op() }).liquido, 3);
t("RD maior que o dano não fere", B.danoNaBarreira(comRd, "p", 4, { opId: op() }).pv, 35);
t("retirar a parede à mão", BE.barreirasDe(B.removeBarreira(er.sessao, idP, { opId: op() }).sessao).paredes.length, 3);

t("Cortina: 1 PE por bloco de 9 m, mínimo 1", [B.custoDaCortina(9), B.custoDaCortina(10), B.custoDaCortina(18), B.custoDaCortina(4.5), B.custoDaCortina(0)], [1, 2, 2, 1, 0]);
const oc = op();
const ct = B.criarCortina(sb, db, { area: 27, nome: "Rua", condicoes: ["Prende não feiticeiros"], opId: oc });
t("a Cortina custa 3 PE por 27 m", ct.custo.pe.pedido, 3);
t("a Cortina vale três paredes e RD zero", (({ pv, pvMax, rd, area }) => [pv, pvMax, rd, area])(BE.barreirasDe(ct.sessao).cortinas[0]), [105, 105, 0, 27]);
t("as condições da Cortina são texto da mesa", BE.barreirasDe(ct.sessao).cortinas[0].condicoes, ["Prende não feiticeiros"]);
t("Cortina sem área recusa", B.criarCortina(sb, db, { area: 0, opId: op() }).codigo, "area-invalida");
t("Cortina sem a aptidão recusa", B.criarCortina(sb, deriveAfty({ ...cb, aptidoesAmaldicoadas: ["tecnicas_de_barreira"] }), { area: 9, opId: op() }).aplicado, false);
const dc = B.danoNaBarreira(ct.sessao, `cortina_${oc}`, 105, { opId: op() });
t("a Cortina quebra normalmente", [dc.destruida, BE.barreirasDe(dc.sessao).cortinas.length, dc.tipo], [true, 0, "cortina"]);
t("o descanso desmancha as barreiras", BE.barreirasDe(S.descansar(er.sessao, db)).paredes.length, 0);
t("o estado sobrevive ao JSON da sessão", BE.barreirasDe(S.normalizaSessao(JSON.parse(JSON.stringify(er.sessao)), db)).paredes.length, 4);
t("sessão antiga sem o campo abre sem barreiras", BE.barreirasDe(S.normalizaSessao({ hpAtual: 5 }, db)), { paredes: [], cortinas: [] });
t("lixo vira o padrão", BE.normalizaBarreiras({ paredes: [{ id: 1 }, null, { id: "ok", pv: 99, pvMax: 10 }], cortinas: "x" }), { paredes: [{ id: "ok", pv: 10, pvMax: 10, rd: 0, desde: 0 }], cortinas: [] });

/* ============================================================ */
/* 5. CESTA OCA DE VIME                                           */
/* ============================================================ */
t("Durabilidade é BAR mais 1", B.durabilidadeDaCesta(db), 4);
const oce = op();
const ce = B.usarCesta(sb, db, { opId: oce, registraAcao: true });
t("a Cesta ativa", ce.aplicado, true);
t("a Cesta custa 3 PE", ce.custo.pe.pedido, 3);
t("a Cesta usa a ação bônus", ce.sessao.uso.acoes.gastas.bonus, 1);
t("a Cesta guarda a Durabilidade", B.estadoDaCesta(ce.sessao), { ativa: true, durabilidade: 4, selo: false, maos: 0 });
t("a Cesta ocupa o espaço de Concentração", U.usoDe(ce.sessao).concentracao.id, "cesta_oca_de_vime");
t("a Cesta protege do Acerto Garantido", [B.cestaProtegeDoAcertoGarantido(sb), B.cestaProtegeDoAcertoGarantido(ce.sessao)], [false, true]);
t("já ativa não ativa de novo", B.usarCesta(ce.sessao, db, { opId: op() }).codigo, "ja-ativo");
t("em reação exige confirmar a Expansão", B.usarCesta(sb, db, { como: "reacao", opId: op() }).codigo, "requisito-nao-confirmado");
const ceR = B.usarCesta(sb, db, { como: "reacao", contraExpansao: true, opId: op(), registraAcao: true });
t("em reação à Expansão gasta a reação", [ceR.aplicado, Object.keys(ceR.sessao.uso.acoes.reacoes)], [true, ["cesta_oca_de_vime"]]);
t("sem a aptidão não ativa", B.usarCesta(sb, deriveAfty({ ...cb, aptidoesAmaldicoadas: [] }), { opId: op() }).aplicado, false);
t("sem Energia não ativa", B.usarCesta({ ...sb, peAtual: 1 }, db, { opId: op() }).codigo, "sem-energia");
t("a Cesta cai no fim do combate", B.estadoDaCesta(S.aplicaPatchCombate(ce.sessao, { ativo: false })).ativa, false);

// Falha de concentração: perde 1 de Durabilidade em vez de cair
let sc = C.abreTesteDeConcentracao(ce.sessao, "dano", { dano: 20 }).sessao;
let falha = C.resolveTesteDeConcentracao(sc, db, { total: 1, opId: op() });
t("falha de concentração desce 1 de Durabilidade e mantém a Cesta", [falha.sucesso, falha.mantida, falha.durabilidade, B.estadoDaCesta(falha.sessao).ativa], [false, true, 3, true]);
t("a Concentração segue ocupada", U.usoDe(falha.sessao).concentracao.id, "cesta_oca_de_vime");
t("o teste pendente foi consumido", U.usoDe(falha.sessao).teste, null);
let acaba = falha.sessao;
for (let i = 0; i < 2; i += 1) {
  acaba = C.abreTesteDeConcentracao(acaba, "dano", { dano: 20 }).sessao;
  acaba = C.resolveTesteDeConcentracao(acaba, db, { total: 1, opId: op() }).sessao;
}
t("duas falhas a mais deixam 1 de Durabilidade", B.estadoDaCesta(acaba).durabilidade, 1);
acaba = C.abreTesteDeConcentracao(acaba, "dano", { dano: 20 }).sessao;
const quebra = C.resolveTesteDeConcentracao(acaba, db, { total: 1, opId: op() });
t("a última falha quebra a Cesta", [quebra.quebrou, B.estadoDaCesta(quebra.sessao).ativa, U.usoDe(quebra.sessao).concentracao], [true, false, null]);
const sucesso = C.resolveTesteDeConcentracao(C.abreTesteDeConcentracao(ce.sessao, "dano", { dano: 20 }).sessao, db, { total: 99, opId: op() });
t("passar no teste não gasta Durabilidade", [sucesso.sucesso, B.estadoDaCesta(sucesso.sessao).durabilidade], [true, 4]);

// Início do turno: Acerto Garantido e o selo
const t1 = B.iniciaTurnoDaCesta(ce.sessao, { acertoGarantido: true, opId: op() });
t("o Acerto Garantido que atingiria tira 1 de Durabilidade", [t1.durabilidade, t1.perdeu], [3, true]);
const t2 = B.iniciaTurnoDaCesta(ce.sessao, { acertoGarantido: true, mantemSelo: true, opId: op() });
t("com o selo mantido a Durabilidade não cai", [t2.durabilidade, t2.selo, t2.perdeu], [4, true, false]);
t("o selo ocupa as duas mãos", B.maosOcupadasPelaCesta(t2.sessao), 2);
t("sem selo as mãos ficam livres", B.maosOcupadasPelaCesta(t1.sessao), 0);
t("sem Acerto Garantido nada cai", B.iniciaTurnoDaCesta(ce.sessao, { opId: op() }).durabilidade, 4);
t("sem Cesta o início do turno não falha", B.iniciaTurnoDaCesta(sb, { acertoGarantido: true, opId: op() }).semCesta, true);
let queda = ce.sessao;
let ultimoTurno = null;
for (let i = 0; i < 4; i += 1) {
  ultimoTurno = B.iniciaTurnoDaCesta(queda, { acertoGarantido: true, opId: op() });
  queda = ultimoTurno.sessao;
}
t("a quarta perda quebra e o portador recebe o Acerto Garantido", [ultimoTurno.quebrou, ultimoTurno.recebeAcertoGarantido, B.estadoDaCesta(queda).ativa], [true, true, false]);
const opT = op();
t("repetir o opId do turno não gasta de novo", B.iniciaTurnoDaCesta(B.iniciaTurnoDaCesta(ce.sessao, { acertoGarantido: true, opId: opT }).sessao, { acertoGarantido: true, opId: opT }).repetida, true);
t("sem opId o turno da Cesta recusa", B.iniciaTurnoDaCesta(ce.sessao, {}).codigo, "sem-opid");

/* ============================================================ */
/* 6. DUAS FICHAS, SEM VAZAMENTO                                   */
/* ============================================================ */
const fa = ficha({ dom: 5, bar: 3 });
const fb = ficha({ dom: 2, bar: 1, nd: 8 });
const a1 = JSON.stringify(deriveAfty(fa).dominios);
const b1 = JSON.stringify(deriveAfty(fb).dominios);
const a2 = JSON.stringify(deriveAfty(fa).dominios);
t("derivar A, B, A dá o mesmo A", a1, a2);
t("as duas fichas têm domínios diferentes", a1 === b1, false);
const sessA = emCombate(deriveAfty(fa));
const sessB = emCombate(deriveAfty(fb));
const comParedesA = B.erguerParedes(sessA, deriveAfty(fa), { quantidade: 2, opId: op() }).sessao;
t("as paredes de A não aparecem na sessão de B", BE.barreirasDe(sessB).paredes.length, 0);
t("o PV da parede segue a ficha de cada um", [BE.barreirasDe(comParedesA).paredes[0].pv, B.erguerParedes(sessB, deriveAfty(fb), { quantidade: 1, opId: op() }).sessao.barreiras.paredes[0].pv], [35, 5 + 1 * 4]);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
