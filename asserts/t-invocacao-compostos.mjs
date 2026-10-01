/* OS COMPOSTOS DE INVOCAÇÃO (Etapa 9 da atualização de 2026-09-30).

   O que este arquivo garante, pelo Livro ("Criando Hordas"), pelo *Mecânicas para
   Invocações 2.5.2* e pelas decisões do autor (DA-06, DA-13, PV-02, PV-03, PV-18,
   PV-19):

   1. HORDA: o líder e os membros saem da lista resolvida, com o passe de fontes
      (E-07); os limites (membros pelo limite em campo, o grau do líder, quem não
      compõe) (E-02); a Hoste Amaldiçoada; o Líder de Horda; e a mesa (Criar Horda
      com PE, metade dos membros na metade da vida, exorcismo no golpe grande, a
      queda a 0, a saída só no fim do combate e o líder reaproveitado).
   2. QUIMERA: a regra do Mecânicas ao lado da do addon, sem conversão calada, e a
      mesa (uma por cena, componentes na queda).
   3. CORPO DE MÚLTIPLOS NÚCLEOS: as validações, a entidade única na mesa e o
      Trocar Núcleo mantendo o PV.
   4. MECHA: os requisitos, a ficha, a casca da menor, a queda e o Separar.
   5. O descanso desfaz os compostos, e a cena nova os libera de novo. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const D = await import(R + "afty-derive.js");
const S = await import(R + "afty-schema.js");
const I = await import(R + "afty-invocacoes.js");
const TIPOS = await import(R + "afty-invocacoes-tipos.js");
const SES = await import(R + "ficha/ficha-sessao.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const inv = (id, nome, tipo, grau, extra = {}) => ({ ...I.createBlankInvocacao(grau, tipo), id, nome, ...extra });
const carac = (subtipo, extra = {}) => ({ ...I.createBlankCaracteristica(), id: `c-${subtipo}`, nome: subtipo, subtipo, ...extra });
const DONO = { nd: 10, bt: 4, nivelControlador: 10, nivelControladorReal: 10 };

/** Um Controlador com o Disperso (Criar Horda) e a Hoste, no nível pedido. */
const controlador = (nivel, invocacoes, extra = {}) => {
  const c = S.createBlankAfty();
  c.core = { ...c.core, nd: nivel };
  c.especializacoes = [{ id: "controlador", nivel }];
  c.habilidades = ["ctr_apogeu", "ctr_hoste_amaldicoada"];
  c.escolhasHabilidade = { ctr_apogeu: ["ctr_controle_disperso"] };
  c.invocacoes = invocacoes;
  return { ...c, ...extra };
};
const sessaoCom = (linhas = {}, extra = {}) => ({ ...SES.sessaoEmBranco(), invocacoes: linhas, peAtual: 60, rodada: 0, ...extra });
const linha = (s, id) => SES.estadoDaInvocacao(s, id);

/* ============================================================ */
/* 1. HORDA                                                      */
/* ============================================================ */
/* E-07: um marcador com `fontes` dá ao líder um terço do PV da fonte. Fora da
   lista (a resolução solta de antes), o bônus sumia dentro da horda. */
const MARC = { id: "heranca_x", label: "Herança X", limite: 9, fontes: true };
const EFEITO = { canal: "pv", expr: 'fontes("heranca_x", "soma", "piso(pv_max / 3)")', quando: "marc_heranca_x", nome: "Herança X" };
const lider = inv("L", "Lobo", "shikigami", "segundo", { marcadores: { heranca_x: true }, marcadorFontes: { heranca_x: ["F"] } });
const fonte = inv("F", "Sombra", "shikigami", "primeiro");
const membroA = inv("A", "Rato", "shikigami", "quarto");
const membroB = inv("B", "Corvo", "shikigami", "terceiro");
const fichasH = [lider, fonte, membroA, membroB];
const donoH = { ...DONO, marcadores: [MARC], efeitos: [EFEITO], limiteCampo: 3 };
const listaH = I.resolveInvocacoesList(fichasH, donoH).lista;
const pvLiderLista = listaH.find((r) => r.id === "L").pv;
const pvLiderSolto = I.resolveInvocacao(lider, donoH).pv;
const horda = { ...I.createBlankHorda(), id: "h1", nome: "Matilha", liderId: "L", membroIds: ["A", "B"] };
const resH = I.resolveHorda(horda, fichasH, donoH);
t("E-07: o fonte da o terco ao lider so na lista", pvLiderLista > pvLiderSolto, true);
t("E-07: e a horda le o PV do lider da lista",
  resH.pv, pvLiderLista + Math.floor(listaH.find((r) => r.id === "A").pv / 2) + Math.floor(listaH.find((r) => r.id === "B").pv / 2));
t("a horda traz a Defesa, a RD e os testes do lider",
  [resH.defesa, resH.testes?.cd != null, resH.rdContraAlvoUnico], [listaH.find((r) => r.id === "L").defesa, true, 10]);
t("e quem esta dentro", resH.componentesIds, ["L", "A", "B"]);

/* E-02: os limites. */
const quatroMembros = { ...horda, membroIds: ["A", "B", "F"] };
t("E-02: membros acima do limite em campo avisam",
  I.resolveHorda({ ...horda, liderId: "F", membroIds: ["A", "B", "L"] }, fichasH, { ...donoH, limiteCampo: 2 }).warnings
    .some((w) => w.startsWith("Membros: 3 de 2")), true);
t("E-02: sem roster (dono sem Controlador), nada a conferir",
  I.resolveHorda(quatroMembros, fichasH, DONO).warnings.some((w) => w.startsWith("Membros:")), false);
const especial = inv("E", "Dragão", "shikigami", "especial");
t("o lider de Grau Especial nao vale",
  I.resolveHorda({ ...horda, liderId: "E" }, [...fichasH, especial], donoH).valido, false);
t("na Hoste o lider desce um grau: Primeiro nao lidera, Segundo sim",
  [I.resolveHorda({ ...horda, liderId: "F", membroIds: ["A"], hoste: true }, fichasH, { ...donoH, hosteAmaldicoada: true }).valido,
    I.resolveHorda({ ...horda, hoste: true }, fichasH, { ...donoH, hosteAmaldicoada: true }).valido],
  [false, true]);
t("os lideres elegiveis com e sem a Hoste",
  [I.lideresElegiveis(fichasH).map((i) => i.id), I.lideresElegiveis(fichasH, { hoste: true }).map((i) => i.id)],
  [["L", "F", "A", "B"], ["L", "A", "B"]]);
t("Hoste sem a Habilidade avisa",
  I.resolveHorda({ ...horda, hoste: true }, fichasH, donoH).warnings.includes("Hoste Amaldiçoada sem a Habilidade."), true);
const par = I.resolveHordasList([
  { ...horda, id: "h1", hoste: true, parId: "h2" },
  { ...horda, id: "h2", liderId: "B", membroIds: ["A"], hoste: true, parId: "h1" },
  { ...horda, id: "h3", hoste: true, parId: "h1" },
], fichasH, { ...donoH, hosteAmaldicoada: true });
t("o par da Hoste se confere dos dois lados",
  par.lista.map((h) => h.warnings.some((w) => w.startsWith("Hoste Amaldiçoada:"))), [false, false, true]);
t("um nucleo de Corpo de Multiplos Nucleos nao compoe Horda",
  [I.membrosElegiveis(fichasH, lider, { excluidos: ["A"] }).map((i) => i.id),
    I.resolveHorda(horda, fichasH, { ...donoH, nucleosIds: ["A"] }).valido],
  [["B"], false]);
t("quem saiu na metade: metade para baixo, do menor grau, o ultimo primeiro",
  [I.membrosQueSaem([{ id: "a", rank: 2 }, { id: "b", rank: 1 }, { id: "c", rank: 1 }, { id: "d", rank: 2 }, { id: "e", rank: 3 }]),
    I.membrosQueSaem([{ id: "a", rank: 1 }])],
  [["c", "b"], []]);
const comMesa = (s) => I.resolveHorda(horda, fichasH, { ...donoH, sessaoInvocacoes: s });
t("as escalas contam so os membros ativos",
  [comMesa({ "horda:h1": { estado: "ativa", membrosAtivos: ["A", "B"] } }).escala.danoNiveis,
    comMesa({ "horda:h1": { estado: "ativa", membrosAtivos: ["B"] } }).escala.danoNiveis],
  [2, 1]);
t("o PV maximo nao cai com os membros que sairam",
  comMesa({ "horda:h1": { estado: "ativa", membrosAtivos: ["B"] } }).pv, resH.pv);
t("o lider reaproveitado: metade do PV maximo",
  comMesa({ "horda:h1": { pvMaxMetade: true } }).pv, Math.floor(resH.pv / 2));

/* Líder de Horda: a Característica do membro escolhido entra no líder. */
const inteligente = carac("inteligente");
const liderLH = { ...lider, caracteristicas: [inteligente, carac("liderHorda")] };
const membroDef = { ...membroB, caracteristicas: [carac("defesa", { id: "cd1", nome: "Casca" })] };
const fichasLH = [liderLH, fonte, membroA, membroDef];
const hordaLH = { ...horda, liderHorda: { membroId: "B", caracId: "cd1" } };
const semLH = I.resolveHorda({ ...horda }, fichasLH, donoH);
const comLH = I.resolveHorda(hordaLH, fichasLH, donoH);
/* O valor da Característica sai do grau de quem a TEM: no líder de Segundo Grau,
   a Defesa vale 3 (no membro de Terceiro, valia 2). */
t("Lider de Horda: a Defesa do membro entra no lider, no grau dele",
  [comLH.defesa - semLH.defesa, comLH.liderHorda?.caracNome], [3, "Casca"]);
t("e sai quando o membro deixa a horda",
  I.resolveHorda(hordaLH, fichasLH, { ...donoH, sessaoInvocacoes: { "horda:h1": { estado: "ativa", membrosAtivos: ["A"] } } }).defesa,
  semLH.defesa);
t("sem a Caracteristica no lider, a escolha so avisa",
  I.resolveHorda(hordaLH, fichasH, donoH).warnings.includes("Líder de Horda escolhido sem a Característica no líder."), true);

/* A mesa da Horda, pelo derive e pela sessão. */
const ctrH = controlador(10, fichasH, { hordas: [horda] });
const dH = D.deriveAfty(ctrH, { invocacoes: {} });
const mesaH = SES.invocacaoDaMesa(dH, "horda:h1");
t("a Horda entra na mesa com o custo dela", [!!mesaH?.horda, mesaH?.custo], [true, dH.hordas.lista[0].custo]);
const s0 = sessaoCom();
const entrada = SES.entradaDaInvocacao(s0, mesaH);
t("Criar Horda cobra o PE e leva as componentes",
  [entrada.permitida, entrada.custo.total, entrada.componentes], [true, mesaH.custo, ["L", "A", "B"]]);
t("componente em campo trava a horda",
  SES.entradaDaInvocacao(sessaoCom({ A: { estado: "ativa" } }), mesaH).motivo, "Componente Indisponível");
const s1 = SES.invocaNaMesa(s0, dH, "horda:h1");
t("em campo, ela conta como uma invocacao",
  TIPOS.contaInvocacoesEmCampo(s1.invocacoes, ["L", "F", "A", "B", "horda:h1"]), 1);
t("e o PE saiu", s1.peAtual, 60 - mesaH.custo);
t("o membro na horda nao entra sozinho",
  SES.entradaDaInvocacao(s1, I.resolveInvocacao(membroA, DONO)).motivo, "Na Horda");
const dH1 = D.deriveAfty(ctrH, { invocacoes: s1.invocacoes });
const pvH = SES.invocacaoDaMesa(dH1, "horda:h1").pv;
const metade = Math.floor(pvH / 2);
/* Da vida cheia até a metade é sempre um golpe de metade da vida (que exorciza),
   então a queda comum vem de um arranhão antes. */
const sArranhao = SES.aplicaDanoNaMesa(s1, dH1, "horda:h1", 5);
const sMeio = SES.aplicaDanoNaMesa(sArranhao, dH1, "horda:h1", pvH - 5 - metade);
t("na metade da vida, a horda perde metade dos membros (o de menor grau)",
  [linha(sMeio, "horda:h1").membrosAtivos, linha(sMeio, "A").estado, linha(sMeio, "A").retorno, linha(sMeio, "B").estado],
  [["B"], "dissipada", 0.5, "fora"]);
t("e so uma vez", SES.aplicaDanoNaMesa(sMeio, dH1, "horda:h1", 1).invocacoes["horda:h1"].membrosAtivos, ["B"]);
const sGolpe = SES.aplicaDanoNaMesa(s1, dH1, "horda:h1", metade + 1);
t("um golpe de metade da vida que cruza o limiar exorciza quem sai",
  linha(sGolpe, "A").estado, "exorcizada");
const sFim = SES.aplicaDanoNaMesa(sMeio, dH1, "horda:h1", pvH);
t("a 0 PV a horda acaba: o lider e quem sobrou caem pela regra do tipo",
  [linha(sFim, "horda:h1").estado, linha(sFim, "L").estado, linha(sFim, "B").estado], ["fora", "dissipada", "dissipada"]);
t("e o lider fica marcado", sFim.lideresDeHordaDissolvida, ["L"]);
t("a horda nova do mesmo lider nasce com metade do PV maximo",
  SES.entradaDaInvocacao({ ...s0, lideresDeHordaDissolvida: ["L"] }, mesaH).pvMaxMetade, true);
t("so sai por vontade no fim do combate",
  [linha(SES.saiDeCampo({ ...s1, rodada: 2 }, "horda:h1"), "horda:h1").estado, linha(SES.saiDeCampo(s1, "horda:h1"), "horda:h1").estado],
  ["ativa", "fora"]);

/* ============================================================ */
/* 2. QUIMERA                                                    */
/* ============================================================ */
t("Quimera nova nasce do Mecanicas, e a gravada sem regra segue do addon",
  [I.createBlankQuimera().regra, I.regraDaQuimera({}), I.regraDaQuimera({ regra: "mecanicas" })], ["mecanicas", "addon", "mecanicas"]);
t("quantas funde pelo nivel REAL de Controlador",
  [4, 5, 9, 13, 20].map(I.limiteDeQuimeraMecanicas), [0, 2, 3, 4, 4]);
const ATR = { forca: 12, destreza: 12, constituicao: 12, inteligencia: 8, sabedoria: 8, presenca: 8 };
const p = inv("P", "Cervo", "shikigami", "terceiro", { atributos: ATR, acoes: [{ ...I.createBlankAcao(), id: "ap", nome: "Chifrada" }] });
const q2 = inv("Q", "Tigre", "shikigami", "terceiro", {
  atributos: ATR,
  acoes: [{ ...I.createBlankAcao(), id: "aq1", nome: "Garra" }, { ...I.createBlankAcao(), id: "aq2", nome: "Rugido" }, { ...I.createBlankAcao(), id: "aq3", nome: "Salto" }],
});
const fichasQ = [p, q2];
const qm = { ...I.createBlankQuimera(), id: "q", nome: "Agito", principalId: "P", fundidasIds: ["Q"] };
const donoQ = { ...DONO, nivelControladorReal: 5 };
const listaQ = I.resolveInvocacoesList(fichasQ, donoQ).lista;
const pvP = listaQ[0].pv;
const pvQ = listaQ[1].pv;
const rq = I.resolveQuimera(qm, fichasQ, donoQ);
t("PV: a principal, mais um terco dos outros, menos o grau vezes os adicionais",
  rq.pv, pvP + Math.floor(pvQ / 3) - 2 * 1);
t("e o hover fecha com o numero", rq.resolvida.fontes.pv.reduce((s, x) => s + x.valor, 0), rq.pv);
const rp = listaQ[0];
t("+1 por componente em Ataque, CD e Pericias, -1 em Defesa e TR",
  [rq.resolvida.testes.acerto.corpo.bonus - rp.testes.acerto.corpo.bonus, rq.resolvida.testes.cd - rp.testes.cd,
    rq.resolvida.defesa - rp.defesa, rq.resolvida.testes.resistencias[1].bonus - rp.testes.resistencias[1].bonus],
  [2, 2, -2, -2]);
t("a RD nao fica negativa", rq.resolvida.rd.geral, 0);
t("o custo e a soma dos custos base", rq.custo, 4 + 4);
t("sem escolhas, so as Acoes da principal", rq.resolvida.acoes.map((a) => a.nome), ["Chifrada"]);
const comEscolhas = I.resolveQuimera({ ...qm, escolhas: { Q: [{ tipo: "acao", id: "aq1" }, { tipo: "acao", id: "aq2" }, { tipo: "acao", id: "aq3" }] } }, fichasQ, donoQ);
t("ate duas escolhas por adicional, e a terceira avisa",
  [comEscolhas.resolvida.acoes.map((a) => a.nome), comEscolhas.warnings.some((w) => w.includes("3 escolhas"))],
  [["Chifrada", "Garra", "Rugido"], true]);
t("e as escolhas nao custam nem estouram o orcamento",
  [comEscolhas.custo, comEscolhas.resolvida.orcamento.usados <= comEscolhas.resolvida.orcamento.total], [8, true]);
t("abaixo do nivel 5 avisa", I.resolveQuimera(qm, fichasQ, DONO.nivelControladorReal ? { ...DONO, nivelControladorReal: 4 } : DONO).warnings[0],
  "Quimera pede 5 níveis de Controlador.");
t("so funde Shikigamis",
  I.resolveQuimera({ ...qm, fundidasIds: ["M"] }, [...fichasQ, inv("M", "Boneco", "marionete", "terceiro")], donoQ).warnings
    .some((w) => w.includes("só funde Shikigamis")), true);
t("o grau e o maior das componentes",
  I.resolveQuimera({ ...qm, fundidasIds: ["S"] }, [...fichasQ, inv("S", "Serpente", "shikigami", "segundo", { atributos: ATR })], donoQ).resolvida.grau,
  "segundo");
const addon = I.resolveQuimera({ ...qm, regra: undefined, nivel: 2 }, fichasQ, donoQ);
t("a Quimera do addon segue a regra dela (soma - 10)", addon.pv, pvP + pvQ - 10);

/* A mesa da Quimera: uma por cena, e a queda chega nas componentes. */
const ctrQ = controlador(5, fichasQ, { quimeras: [qm, { ...qm, id: "q2", nome: "Outra" }] });
const dQ = D.deriveAfty(ctrQ, { invocacoes: {} });
const mesaQ = SES.invocacaoDaMesa(dQ, "quimera:q");
const sQ = SES.invocaNaMesa(sessaoCom(), dQ, "quimera:q");
t("a Quimera entra e marca a cena", [linha(sQ, "quimera:q").estado, sQ.quimeraDaCena], ["ativa", "quimera:q"]);
t("uma Quimera por cena", SES.entradaDaInvocacao(sQ, SES.invocacaoDaMesa(dQ, "quimera:q2")).motivo, "Uma Quimera por Cena");
const sQd = SES.aplicaDanoNaMesa(sQ, dQ, "quimera:q", mesaQ.pv);
t("dissipada, a regra comum vale para as componentes",
  [linha(sQd, "quimera:q").estado, linha(sQd, "P").estado, linha(sQd, "Q").retorno], ["dissipada", "dissipada", 0.5]);
const sQe = SES.aplicaDanoNaMesa(sQ, dQ, "quimera:q", mesaQ.pv * 2 + 1);
t("exorcizada, as componentes ficam bloqueadas ate o fim da cena",
  [linha(sQe, "quimera:q").estado, linha(sQe, "P").bloqueadaAteFimDaCena, linha(sQe, "P").terminal], ["exorcizada", true, false]);
const cenaNova = SES.iniciaCombate(sQe, dQ);
t("a cena nova libera as componentes, a Quimera e a marca da cena",
  [linha(cenaNova, "P").bloqueadaAteFimDaCena, linha(cenaNova, "quimera:q").estado, cenaNova.quimeraDaCena], [false, "fora", null]);

/* ============================================================ */
/* 3. CORPO DE MÚLTIPLOS NÚCLEOS                                 */
/* ============================================================ */
const na = inv("N1", "Núcleo Rubi", "corpo", "terceiro", { natureza: "boneco", atributos: ATR });
const nb = inv("N2", "Núcleo Safira", "corpo", "terceiro", { natureza: "boneco", atributos: ATR });
const grupo = { ...I.createBlankNucleos(), id: "g", nome: "Panda", nucleoIds: ["N1", "N2"] };
const rg = I.resolveMultiplosNucleos(grupo, [na, nb], donoQ);
t("dois Corpos iguais formam o grupo, sem aviso", [rg.valido, rg.warnings], [true, []]);
t("a mesa ve uma entidade so, com o primeiro nucleo ativo",
  [rg.resolvida.id, rg.resolvida.nucleoAtivo, rg.resolvida.componentesIds], ["nucleos:g", "N1", ["N1", "N2"]]);
const diferentes = I.resolveMultiplosNucleos(grupo, [na, { ...nb, grau: "segundo", natureza: "biologico" }], DONO);
t("grau, natureza e PV diferentes avisam, e o nivel 5 tambem",
  ["mesmo grau", "mesmo tipo de Corpo", "mesmo PV", "5 níveis"].map((s) => diferentes.warnings.some((w) => w.includes(s))),
  [true, true, true, false]);
t("abaixo do nivel 5 avisa",
  I.resolveMultiplosNucleos(grupo, [na, nb], { ...DONO, nivelControladorReal: 4 }).warnings[0], "Múltiplos Núcleos pede 5 níveis de Controlador.");
t("os nucleos nao compoem Horda", I.idsDeNucleos([grupo]), ["N1", "N2"]);
const ctrN = controlador(5, [na, nb], { multiplosNucleos: [grupo] });
const dN = D.deriveAfty(ctrN, { invocacoes: {} });
const sN = SES.invocaNaMesa(sessaoCom(), dN, "nucleos:g");
t("o grupo entra como um so e conta como uma",
  [linha(sN, "nucleos:g").estado, TIPOS.contaInvocacoesEmCampo(sN.invocacoes, ["N1", "N2", "nucleos:g"])], ["ativa", 1]);
const dN1 = D.deriveAfty(ctrN, { invocacoes: sN.invocacoes });
const ferido = SES.aplicaDanoNaMesa(sN, dN1, "nucleos:g", 5);
const trocado = SES.trocaNucleo(ferido, dN1, "nucleos:g");
t("Trocar Nucleo muda a ficha e mantem o PV atual",
  [linha(trocado, "nucleos:g").nucleoAtivo, linha(trocado, "nucleos:g").pvAtual], ["N2", linha(ferido, "nucleos:g").pvAtual]);
t("e o derive desenha o novo nucleo",
  D.deriveAfty(ctrN, { invocacoes: trocado.invocacoes }).multiplosNucleos.lista[0].resolvida.nome, "Panda");
t("o nucleo dentro do grupo nao entra sozinho", SES.entradaDaInvocacao(sN, I.resolveInvocacao(na, DONO)).motivo, "Nos Núcleos");

/* ============================================================ */
/* 4. MECHA                                                      */
/* ============================================================ */
const grande = carac("tamanho", { tamanho: "grande" });
const m1 = inv("M1", "Robô Alfa", "marionete", "terceiro", { caracteristicas: [grande], acoes: [{ ...I.createBlankAcao(), id: "x1", nome: "Soco" }] });
const m2 = inv("M2", "Robô Beta", "marionete", "quarto", { caracteristicas: [grande], acoes: [{ ...I.createBlankAcao(), id: "x2", nome: "Chute" }] });
const m3 = inv("M3", "Robô Médio", "marionete", "quarto");
const ctrM = controlador(5, [m1, m2, m3]);
const ativas = { M1: { estado: "ativa" }, M2: { estado: "ativa", pvAtual: 7 }, M3: { estado: "ativa" } };
const sM = sessaoCom(ativas);
const dM = D.deriveAfty(ctrM, { invocacoes: sM.invocacoes });
t("o tamanho do Controlador sai do campo que ja existe (PV-19)", dM.tamanho, "medio");
t("Mecha: duas Marionetes ativas, do mesmo tamanho, maiores que o Controlador",
  [SES.mechaPermitido(sM, dM, "M1", "M2").permitido, SES.mechaPermitido(sM, dM, "M1", "M3").motivo,
    SES.mechaPermitido(sessaoCom({ ...ativas, M2: { estado: "fora" } }), dM, "M1", "M2").motivo],
  [true, "Tamanhos Diferentes", "As Duas Precisam Estar Ativas"]);
t("pede 5 niveis reais de Controlador",
  SES.mechaPermitido(sM, D.deriveAfty(controlador(4, [m1, m2]), { invocacoes: sM.invocacoes }), "M1", "M2").motivo, "Pede 5 Níveis de Controlador");
const pvM1 = dM.invocacoes.lista.find((r) => r.id === "M1").pv;
const sMe = SES.formaMecha(sM, dM, "M2", "M1");
t("a maior da o PV, e a menor vira a casca com o PV atual dela",
  [linha(sMe, "mecha").maiorId, linha(sMe, "mecha").pvAtual, linha(sMe, "mecha").pvTempFontes[TIPOS.FONTE_PV_MECHA]],
  ["M1", pvM1, 7]);
t("as duas seguem ativas: o Mecha conta como duas",
  TIPOS.contaInvocacoesEmCampo(sMe.invocacoes, ["M1", "M2", "M3"]), 3);
const dMe = D.deriveAfty(ctrM, { invocacoes: sMe.invocacoes });
t("a ficha do Mecha: um tamanho acima, as Acoes das duas, sem alma",
  [dMe.mecha.tamanho, dMe.mecha.acoes.map((a) => a.nome), dMe.mecha.temAlma], ["enorme", ["Soco", "Chute"], false]);
t("as componentes ficam presas no Mecha", [linha(sMe, "M1").emComposto, linha(SES.saiDeCampo(sMe, "M1"), "M1").estado], ["mecha", "ativa"]);
const sCasca = SES.aplicaDanoNaMesa(sMe, dMe, "mecha", 7);
t("a casca acaba: a menor quebra, e o Mecha segue",
  [linha(sCasca, "M2").estado, linha(sCasca, "mecha").menorQuebrada, linha(sCasca, "mecha").pvAtual], ["quebrada", true, pvM1]);
t("e as Acoes dela saem da ficha",
  D.deriveAfty(ctrM, { invocacoes: sCasca.invocacoes }).mecha.acoes.map((a) => a.nome), ["Soco"]);
const sQueda = SES.aplicaDanoNaMesa(sCasca, D.deriveAfty(ctrM, { invocacoes: sCasca.invocacoes }), "mecha", pvM1);
t("a 0 PV a maior quebra, e o Mecha se desfaz",
  [linha(sQueda, "M1").estado, linha(sQueda, "mecha").estado], ["quebrada", "fora"]);
const sSep = SES.separaMecha(SES.aplicaDanoNaMesa(sMe, dMe, "mecha", 3));
t("Separar: a maior fica com o PV do Mecha, e a menor com a casca",
  [linha(sSep, "M1").pvAtual, linha(sSep, "M2").pvAtual, linha(sSep, "mecha").estado], [pvM1, 4, "fora"]);
t("sair de campo com o Mecha e separar", linha(SES.saiDeCampo(sMe, "mecha"), "mecha").estado, "fora");

/* ============================================================ */
/* 5. O DESCANSO DESFAZ OS COMPOSTOS                             */
/* ============================================================ */
const descansou = SES.descansar({ ...sMe, invocacoes: { ...sMe.invocacoes, ...s1.invocacoes }, quimeraDaCena: "quimera:q" }, dMe);
t("o descanso desfaz o Mecha e a Horda, e zera a cena",
  [linha(descansou, "mecha").estado, linha(descansou, "horda:h1").estado, descansou.quimeraDaCena, descansou.lideresDeHordaDissolvida],
  ["fora", "fora", null, []]);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
