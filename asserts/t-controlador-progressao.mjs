/* O CONTROLADOR NÍVEL A NÍVEL, E A MESA DELE (Etapa 7 da atualização de 2026-09-30).

   O que este arquivo garante:
   1. o roster nos níveis 1, 4, 5, 6, 9, 10, 12, 13, 17, 18 e 20 (recebidas,
      comandos separados, grau máximo, e o Disperso e o Concentrado);
   2. os dois níveis de Controlador com nomes distintos (real e escalonamento);
   3. o Controle Sintonizado (+1 em acerto e dano por invocação em campo);
   4. o Concentrar Poder só com UMA invocação no total em campo (decisão do autor);
   5. a Reserva para Invocação (E-01), a Autonomia e a Resistência Sobrecarregada
      na entrada, e o Fantoche Supremo uma vez por descanso;
   6. o Controle Aprimorado: o bônus por grau e as Aptidões de Controle e Leitura
      pela invocação, sem as duas que o texto exclui (E-04). */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const D = await import(R + "afty-derive.js");
const S = await import(R + "afty-schema.js");
const H = await import(R + "afty-habilidades.js");
const I = await import(R + "afty-invocacoes.js");
const SES = await import(R + "ficha/ficha-sessao.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. O ROSTER NÍVEL A NÍVEL                                     */
/* ============================================================ */
const NIVEIS = [1, 4, 5, 6, 9, 10, 12, 13, 17, 18, 20];
const roster = (nivel, estilo = null) => H.resolveControleInvocacoes({
  escolhidasIds: ["ctr_treinamento_em_controle", ...(estilo ? ["ctr_apogeu"] : [])],
  escolhasMapa: estilo ? { ctr_apogeu: [estilo] } : {},
  nivelControlador: nivel,
});
t("Recebidas: 2, e mais uma no 3, 6, 9, 10, 12, 15 e 18 (maximo 9)",
  NIVEIS.map((n) => roster(n).iniciais), [2, 3, 3, 4, 5, 6, 7, 7, 8, 9, 9]);
t("Comandos sobem no 6, 12 e 18",
  NIVEIS.map((n) => roster(n).comandos), [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4]);
t("e as Complexas e as Simples andam juntas",
  NIVEIS.every((n) => roster(n).comandosComplexas === roster(n).comandos && roster(n).comandosSimples === roster(n).comandos), true);
t("o limite em campo com o Treinamento e 2 em todo nivel",
  NIVEIS.map((n) => roster(n).limiteCampo), Array(NIVEIS.length).fill(2));
t("o grau maximo pelo nivel",
  NIVEIS.map((n) => I.grausDisponiveis(n).at(-1)),
  ["quarto", "quarto", "terceiro", "terceiro", "segundo", "segundo", "segundo", "primeiro", "especial", "especial", "especial"]);
const disperso = (n) => roster(n, "ctr_controle_disperso");
t("Disperso: em campo, por acao, hordas e hordas por acao, antes e depois do 12",
  [6, 12].map((n) => [disperso(n).limiteCampo, disperso(n).invocarPorAcao, disperso(n).limiteHordas, disperso(n).hordasPorAcao]),
  [[3, 3, 1, 1], [4, 4, 2, 2]]);
t("sem Disperso nao ha hordas por acao", roster(12).hordasPorAcao, 0);
t("Concentrado: uma por acao, e como Acao Livre",
  [roster(6, "ctr_controle_concentrado").invocarPorAcao, roster(6, "ctr_controle_concentrado").invocarAcaoLivre], [1, true]);

/* ============================================================ */
/* 2. OS DOIS NÍVEIS                                             */
/* ============================================================ */
const multi = S.createBlankAfty();
multi.core.nivel = 20;
multi.especializacoes = [{ id: "controlador", nivel: 6 }, { id: "lutador", nivel: 14 }];
const dMulti = D.deriveAfty(multi);
t("Controlador 6 num ND 20: real 6 e escalonamento 20",
  [dMulti.invocacoes.nivelControladorReal, dMulti.invocacoes.nivelEscalonamentoControlador], [6, 20]);

/* ============================================================ */
/* 3 E 4. A MESA: SINTONIZADO E CONCENTRAR PODER                 */
/* ============================================================ */
const ctr20 = (habs, estilo, invs) => {
  const c = S.createBlankAfty();
  c.core.nivel = 20;
  c.especializacoes = [{ id: "controlador", nivel: 20 }];
  c.habilidades = habs;
  c.escolhasHabilidade = estilo ? { ctr_apogeu: [estilo] } : {};
  c.invocacoes = invs;
  return c;
};
const inv = (id, extra = {}) => ({ ...I.createBlankInvocacao("especial"), id, nome: id, ...extra });
const BASE = ["ctr_treinamento_em_controle", "ctr_apogeu"];
const ativa = { estado: "ativa", emCampo: true };

const sint = ctr20(BASE, "ctr_controle_sintonizado", [inv("a"), inv("b")]);
const acertoCorpo = (d) => d.testes.ataques.find((x) => x.id === "corpo")?.bonus ?? 0;
const semMesa = D.deriveAfty(sint);
const umaEmCampo = D.deriveAfty(sint, { invocacoes: { a: ativa } });
const duasEmCampo = D.deriveAfty(sint, { invocacoes: { a: ativa, b: ativa } });
t("Sintonizado: +1 de acerto por invocacao em campo",
  [acertoCorpo(umaEmCampo) - acertoCorpo(semMesa), acertoCorpo(duasEmCampo) - acertoCorpo(semMesa)], [1, 2]);
t("e o hover nomeia o Sintonizado",
  JSON.stringify(duasEmCampo.testes.ataques.find((x) => x.id === "corpo")).includes("Controle Sintonizado"), true);
const semSint = D.deriveAfty(ctr20(BASE, "ctr_controle_disperso", [inv("a")]), { invocacoes: { a: ativa } });
t("outro estilo nao ganha nada", acertoCorpo(semSint), acertoCorpo(D.deriveAfty(ctr20(BASE, "ctr_controle_disperso", [inv("a")]))));

const CONC = [...BASE, "ctr_concentrar_poder"];
const conc = ctr20(CONC, "ctr_controle_concentrado", [inv("a", { marcadores: { concentrar_poder: true } }), inv("b")]);
const pvA = (d) => d.invocacoes.lista.find((x) => x.id === "a").pv;
const pvSemConc = D.deriveAfty(ctr20(CONC, "ctr_controle_concentrado", [inv("a"), inv("b")])).invocacoes.lista[0].pv;
t("Concentrar Poder no criador (sem mesa): a marcada recebe os +30 de PV do nivel 18",
  pvA(D.deriveAfty(conc)) - pvSemConc, 30);
t("na mesa, com UMA invocacao em campo, recebe",
  pvA(D.deriveAfty(conc, { invocacoes: { a: ativa } })) - pvSemConc, 30);
t("com DUAS em campo, mesmo so uma marcada, nao recebe (DA-15)",
  pvA(D.deriveAfty(conc, { invocacoes: { a: ativa, b: ativa } })) - pvSemConc, 0);
t("e a variavel do marcador apaga junto (e o que os addons leem)",
  I.buildInvocacaoDslContext(inv("a", { marcadores: { concentrar_poder: true } }), {
    marcadores: H.resolveMarcadoresInvocacao({ escolhidasIds: ["ctr_concentrar_poder"], ctxDono: { bt: 6 } }),
    invocacoesEmCampo: 2,
  }).marc_concentrar_poder, 0);

/* ============================================================ */
/* 5. A ENTRADA COM AS OPÇÕES DO CONTROLADOR                     */
/* ============================================================ */
const mesa = (c, sess) => ({ d: D.deriveAfty(c, { invocacoes: sess.invocacoes }), s: sess });
const sessaoCom = (c, pe = 100) => ({ ...SES.sessaoEmBranco(D.deriveAfty(c)), peAtual: pe });

// Reserva para Invocação
const res = ctr20([...BASE, "ctr_reserva_para_invocacao"], null, [inv("a"), inv("b"), inv("c")]);
const dRes = D.deriveAfty(res);
t("a Reserva aparece no roster", dRes.invocacoes.controle.reserva, true);
let s = SES.ativaReservaInvocacao(sessaoCom(res), "metade");
t("Reserva pela Metade: vale para duas entradas", s.reservaInvocacao, { usada: true, modo: "metade", restantes: 2 });
const e1 = SES.entradaDaInvocacao(s, SES.invocacaoDaMesa(dRes, "a"));
t("a entrada custa a metade (12 vira 6) e diz por que",
  [e1.custo.total, e1.custo.partes.some((p) => p.label === "Reserva para Invocação" && p.valor === -6), e1.via], [6, true, "reserva"]);
s = SES.invocaNaMesa(s, dRes, "a");
s = SES.invocaNaMesa(s, dRes, "b");
t("duas entradas pela metade gastam 12 de PE, e a Reserva acaba", [s.peAtual, s.reservaInvocacao.modo], [88, null]);
t("a terceira paga cheio", SES.entradaDaInvocacao(s, SES.invocacaoDaMesa(dRes, "c")).custo.total, 12);
t("uma vez por descanso: a segunda ativacao nao faz nada", SES.ativaReservaInvocacao(s, "gratis"), s);
const sDesc = SES.descansar({ ...s, buffs: [], condicoes: [] }, dRes);
t("o descanso devolve a Reserva", sDesc.reservaInvocacao, { usada: false, modo: null, restantes: 0 });
const sGratis = SES.ativaReservaInvocacao(sessaoCom(res), "gratis");
t("Reserva Sem Custo: uma entrada de graca",
  [SES.entradaDaInvocacao(sGratis, SES.invocacaoDaMesa(dRes, "a")).custo.total, sGratis.reservaInvocacao.restantes], [0, 1]);

// Autonomia e Resistência Sobrecarregada
const opc = ctr20([...BASE, "ctr_autonomia", "ctr_invocacoes_resistentes", "ctr_resistencia_sobrecarregada"], null, [inv("a")]);
const dOpc = D.deriveAfty(opc);
const opcoes = SES.invocacaoDaMesa(dOpc, "a").opcoesDeUso;
t("as opcoes de uso trazem o custo em numero",
  opcoes.map((o) => [o.id, o.custo, o.quando]), [["autonomia", 10, "entrada"], ["sobrecarga", 3, "entrada"]]);
let so = sessaoCom(opc);
so = SES.alternaOpcaoDeEntrada(so, "a", "autonomia", true);
so = SES.alternaOpcaoDeEntrada(so, "a", "sobrecarga", true);
const eOpc = SES.entradaDaInvocacao(so, SES.invocacaoDaMesa(dOpc, "a"));
t("a entrada soma Autonomia (10) e Sobrecarga (3) ao custo (12)", eOpc.custo.total, 25);
so = SES.invocaNaMesa(so, dOpc, "a");
const dEmCampo = D.deriveAfty(opc, { invocacoes: so.invocacoes });
const rEmCampo = SES.invocacaoDaMesa(dEmCampo, "a");
t("em campo: a Autonomia vale, e o PV maximo sobe 30 com a parcela da Sobrecarga",
  [rEmCampo.autonomiaAtiva, rEmCampo.pv - SES.invocacaoDaMesa(dOpc, "a").pv,
    rEmCampo.fontes.pv.some((p) => p.label === "Resistência Sobrecarregada" && p.valor === 30)], [true, 30, true]);
t("as parcelas do PV fecham com a Sobrecarga", rEmCampo.fontes.pv.reduce((x, p) => x + (p.valor ?? 0), 0), rEmCampo.pv);
t("as opcoes marcadas se gastam na entrada", SES.estadoDaInvocacao(so, "a").opcoesDeEntrada, {});
const soFora = SES.saiDeCampo(so, "a");
t("fora de campo, a Sobrecarga e a Autonomia somem",
  [SES.invocacaoDaMesa(D.deriveAfty(opc, { invocacoes: soFora.invocacoes }), "a").pv, SES.estadoDaInvocacao(soFora, "a").autonomia],
  [SES.invocacaoDaMesa(dOpc, "a").pv, false]);
const malOpc = ctr20([...BASE, "ctr_autonomia"], null, [{ ...inv("m"), tipoMecanico: "maldicao" }]);
t("a Autonomia da Maldicao e paga no inicio do combate, e nao se marca na entrada",
  SES.invocacaoDaMesa(D.deriveAfty(malOpc), "m").opcoesDeUso.find((o) => o.id === "autonomia")?.quando, "inicioCombate");

// Fantoche Supremo
const fan = ctr20([...BASE, "ctr_fantoche_supremo"], null, [inv("a", { marcadores: { fantoche_supremo: true } })]);
const dFan = D.deriveAfty(fan);
let sf = SES.invocaNaMesa(sessaoCom(fan), dFan, "a");
sf = SES.saiDeCampo(sf, "a");
t("Fantoche Supremo: a segunda entrada no mesmo descanso e recusada",
  SES.entradaDaInvocacao(sf, SES.invocacaoDaMesa(dFan, "a")).motivo, "Fantoche Supremo: Uma Vez por Descanso");
t("e o descanso libera de novo",
  SES.entradaDaInvocacao(SES.descansar({ ...sf, buffs: [], condicoes: [] }, dFan), SES.invocacaoDaMesa(dFan, "a")).permitida, true);

/* ============================================================ */
/* 6. CONTROLE APRIMORADO                                        */
/* ============================================================ */
const efe = H.efeitosInvocacaoControlador(["ctr_controle_aprimorado"], {});
t("+2 a +6 em testes pelo grau",
  ["quarto", "terceiro", "segundo", "primeiro", "especial"].map((g) =>
    I.resolveInvocacao({ ...I.createBlankInvocacao(g), id: "x" }, { nd: 1, bt: 2, efeitos: efe }).bonusTesteHabilidade),
  [2, 3, 4, 5, 6]);
const apr = ctr20([...BASE, "ctr_controle_aprimorado"], null, [inv("a")]);
apr.aptidoesAmaldicoadas = ["canalizar_em_golpe", "punho_divergente", "emocao_da_petala_decadente"];
const aptsInv = D.deriveAfty(apr).invocacoes.lista[0].aptidoesDoControlador.map((a) => a.id);
t("as Aptidoes de Controle e Leitura pela invocacao, sem Punho Divergente e Emocao da Petala Decadente",
  [aptsInv.includes("canalizar_em_golpe"), aptsInv.includes("punho_divergente"), aptsInv.includes("emocao_da_petala_decadente")],
  [true, false, false]);
/* O Controle Aprimorado é automático no nível 4: um Controlador 3 ainda não o tem. */
const nivel3 = { ...apr, core: { ...apr.core, nd: 3 }, especializacoes: [{ id: "controlador", nivel: 3 }], habilidades: [] };
t("sem Controle Aprimorado (Controlador 3) a lista e vazia",
  D.deriveAfty(nivel3).invocacoes.lista[0].aptidoesDoControlador, []);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
