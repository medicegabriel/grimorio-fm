/* CX6: ESPERA APÓS A DISSIPAÇÃO POR DANO (N15). Livro p.257: "Quando um shikigami é dissipado, ele pode ser invocado novamente no seu
   próximo turno". A espera conta em TURNOS DO DONO (`uso.acoes.turno`), e não em rodadas, vale só no combate e só para a queda por
   dano de quem estava em campo. O retorno voluntário (guardada) nunca espera. Marionete, Corpo e Maldição seguem as regras do tipo. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const INV = await import(R + "afty-invocacoes.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
aplicarAddons([]);

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

function ficha(tipo = "shikigami") {
  const c = createBlankAfty();
  c.core.nd = 10;
  c.core.tipo = "misto";
  c.core.patamar = "comum";
  c.core.origem = { id: "inato" };
  c.especializacoes = [{ id: "controlador", nivel: 10 }];
  c.invocacoes = [{ ...INV.createBlankInvocacao("segundo", tipo), id: "INV1", nome: "Nue" }];
  return c;
}

const entra = (sessao, derived) => S.invocaNaMesa(sessao, derived, "INV1");
const pvDe = (derived) => derived.invocacoes.lista.find((i) => i.id === "INV1");
const linha = (sessao) => S.estadoDaInvocacao(sessao, "INV1");
const entrada = (sessao, derived) => S.entradaDaInvocacao(sessao, pvDe(derived));
const comTurnos = (sessao, turno) => ({ ...sessao, uso: { ...(sessao.uso ?? {}), acoes: { ...(sessao.uso?.acoes ?? {}), turno } } });

/* ============================================================ */
/* O CASO DO LIVRO: cair na rodada 2 e reinvocar na mesma rodada                     */
/* ============================================================ */
const c = ficha();
const d = deriveAfty(c);
const inv = pvDe(d);
let s = S.aplicaPatchCombate(S.sessaoEmBranco(d), { ativo: true });
s = { ...s, rodada: 2, peAtual: 100 };
s = comTurnos(s, 2);
s = entra(s, d);
t("entrou em campo", linha(s).estado, "ativa");
t("a entrada não guarda espera", linha(s).aguardaAteTurno, null);

s = S.aplicaDanoInvocacao(s, "INV1", inv.pv, inv.pv, inv.regras);
t("caiu: dissipada", linha(s).estado, "dissipada");
t("a espera termina no turno seguinte do dono", linha(s).aguardaAteTurno, 3);
const mesmaRodada = entrada(s, d);
t("mesma rodada: recusa", mesmaRodada.permitida, false);
t("mesma rodada: motivo", mesmaRodada.motivo, "Aguarda o Próximo Turno");
t("a recusa não grava nada", S.invocaNaMesa(s, d, "INV1"), s);

/* Rodada seguinte, mas o turno do DONO ainda não veio (o turno do inimigo): continua esperando. */
const rodada3 = { ...s, rodada: 3 };
t("rodada 3 sem o turno do dono: ainda espera", entrada(rodada3, d).permitida, false);

/* O turno do dono começa. */
const turno3 = comTurnos(rodada3, 3);
t("turno 3 do dono: pode voltar", entrada(turno3, d).permitida, true);
const volta = entra(turno3, d);
t("voltou em campo", linha(volta).estado, "ativa");
t("voltou com metade do PV", linha(volta).pvAtual, Math.floor(inv.pv / 2));
t("a espera some ao entrar", linha(volta).aguardaAteTurno, null);
t("pagou o custo de novo", volta.peAtual, turno3.peAtual - inv.custo);

/* Cair durante o PRÓPRIO turno do dono também espera o seguinte. */
let proprio = comTurnos({ ...S.aplicaPatchCombate(S.sessaoEmBranco(d), { ativo: true }), rodada: 4, peAtual: 100 }, 5);
proprio = entra(proprio, d);
proprio = S.aplicaDanoInvocacao(proprio, "INV1", inv.pv, inv.pv, inv.regras);
t("queda no turno do dono: espera o 6", linha(proprio).aguardaAteTurno, 6);
t("no mesmo turno: recusa", entrada(proprio, d).permitida, false);

/* ============================================================ */
/* O QUE NÃO ESPERA                                                                   */
/* ============================================================ */
// Voluntário: guardada volta sem custo e sem espera, na mesma rodada.
let vol = comTurnos({ ...S.aplicaPatchCombate(S.sessaoEmBranco(d), { ativo: true }), rodada: 2, peAtual: 100 }, 2);
vol = entra(vol, d);
vol = S.saiDeCampo(vol, "INV1");
t("voluntário: guardada", linha(vol).estado, "guardada");
const voltaVol = entrada(vol, d);
t("voluntário volta na mesma rodada", voltaVol.permitida, true);
t("voluntário volta sem custo", voltaVol.custo.total, 0);
t("voluntário volta com o mesmo PV (nulo é cheio)", voltaVol.pvInicial, linha(vol).pvAtual);

// Fora de combate (rodada 0, combate desligado): não existe turno para esperar.
let fora = { ...S.sessaoEmBranco(d), peAtual: 100 };
fora = entra(fora, d);
fora = S.aplicaDanoInvocacao(fora, "INV1", inv.pv, inv.pv, inv.regras);
t("fora de combate: dissipada", linha(fora).estado, "dissipada");
t("fora de combate: sem espera gravada", linha(fora).aguardaAteTurno, null);
t("fora de combate: volta na hora", entrada(fora, d).permitida, true);

// Exorcizada (dano acima do máximo) é terminal: o motivo é o estado, e não a espera.
let exo = comTurnos({ ...S.aplicaPatchCombate(S.sessaoEmBranco(d), { ativo: true }), rodada: 2, peAtual: 100 }, 2);
exo = entra(exo, d);
exo = S.aplicaDanoInvocacao(exo, "INV1", inv.pv * 3, inv.pv, inv.regras);
t("excedente: exorcizada", linha(exo).estado, "exorcizada");
t("exorcizada: motivo do estado", entrada(exo, d).motivo, "Exorcizada");

// Dano numa dissipada (já fora) não reabre a espera nem a empurra.
let dobra = s;
dobra = S.aplicaDanoInvocacao(dobra, "INV1", 5, inv.pv, inv.regras);
t("dano em quem já caiu não muda a espera", linha(dobra).aguardaAteTurno, 3);

// O atalho de ligar um auxílio também respeita a espera.
const atalho = S.alternaAuxilioInvocacao(s, "INV1", "A1", true);
t("atalho do auxílio não traz de volta", linha(atalho).estado, "dissipada");
const atalhoLivre = S.alternaAuxilioInvocacao(turno3, "INV1", "A1", true);
t("atalho do auxílio vale depois da espera", linha(atalhoLivre).estado, "ativa");

/* ============================================================ */
/* O DESCANSO ZERA A CONTAGEM DE TURNOS, E A ESPERA VAI JUNTO                           */
/* ============================================================ */
const descansada = S.descansar(s, d).sessao ?? S.descansar(s, d);
t("descanso: o contador de turnos zera", (descansada.uso?.acoes?.turno ?? 0), 0);
t("descanso: a espera some", linha(descansada).aguardaAteTurno, null);
t("descanso: a invocação pode entrar", entrada({ ...descansada, peAtual: 100 }, d).permitida, true);

/* ============================================================ */
/* PERSISTÊNCIA: a espera sobrevive à normalização (salvar e reabrir)                   */
/* ============================================================ */
const reaberta = S.normalizaSessao(JSON.parse(JSON.stringify(s)));
t("salvar e reabrir: a espera continua", linha(reaberta).aguardaAteTurno, 3);
t("salvar e reabrir: continua recusando", entrada(reaberta, d).permitida, false);
// Sessão antiga, sem o campo.
const antiga = JSON.parse(JSON.stringify(s));
delete antiga.invocacoes.INV1.aguardaAteTurno;
t("sessão antiga: lê sem espera", linha(S.normalizaSessao(antiga)).aguardaAteTurno, null);

/* ============================================================ */
/* DUAS FICHAS: o Encontro da dona e da aliada não vazam a espera                        */
/* ============================================================ */
const cB = createBlankAfty();
cB.core.nd = 10; cB.core.tipo = "combatente"; cB.core.patamar = "comum"; cB.core.origem = { id: "inato" };
const dB = deriveAfty(cB);
const sB = S.aplicaPatchCombate(S.sessaoEmBranco(dB), { ativo: true });
t("a outra ficha não tem invocação nem espera", Object.keys(sB.invocacoes ?? {}), []);

/* ============================================================ */
/* TIPOS: a Marionete e o Corpo usam as regras do tipo, sem a espera do shikigami      */
/* ============================================================ */
for (const tipo of ["marionete", "corpo", "maldicao"]) {
  const cT = ficha(tipo);
  const dT = deriveAfty(cT);
  const invT = dT.invocacoes.lista.find((i) => i.id === "INV1");
  if (!invT) { bad.push(`tipo ${tipo}: invocação não resolveu`); continue; }
  let sT = comTurnos({ ...S.aplicaPatchCombate(S.sessaoEmBranco(dT), { ativo: true }), rodada: 2, peAtual: 100 }, 2);
  sT = S.invocaNaMesa(sT, dT, "INV1");
  sT = S.aplicaDanoInvocacao(sT, "INV1", invT.pv, invT.pv, invT.regras);
  t(`${tipo}: não grava a espera do shikigami`, S.estadoDaInvocacao(sT, "INV1").aguardaAteTurno, null);
}

/* ============================================================ */
/* A CONTA DA AÇÃO INVOCAR: só avisa, nunca bloqueia (autor, 2026-11-06)                */
/* ============================================================ */
const { contaEntradasNaRodada, resumoDasEntradas } = await import(R + "ficha/ficha-invocacao-campo.js");
const cTres = ficha();
cTres.invocacoes = ["INV1", "INV2", "INV3"].map((id) => ({ ...INV.createBlankInvocacao("segundo", "shikigami"), id, nome: id }));
const dTres = deriveAfty(cTres);
const porAcao = dTres.invocacoes.controle.invocarPorAcao;
t("sem Treinamento em Controle a ação traz duas", porAcao, 2);
let sTres = comTurnos({ ...S.aplicaPatchCombate(S.sessaoEmBranco(dTres), { ativo: true }), rodada: 2, peAtual: 200 }, 2);
sTres = S.invocaNaMesa(sTres, dTres, "INV1");
sTres = S.invocaNaMesa(sTres, dTres, "INV2");
t("duas entradas: dentro do número", resumoDasEntradas(Object.values(sTres.invocacoes), 2, porAcao).excede, false);
sTres = S.invocaNaMesa(sTres, dTres, "INV3");
const resumo3 = resumoDasEntradas(Object.values(sTres.invocacoes), 2, porAcao);
t("três entradas: passa do número", [resumo3.entradas, resumo3.excede, resumo3.acoesNecessarias], [3, true, 2]);
t("a entrada passou mesmo assim (só avisa)", S.estadoDaInvocacao(sTres, "INV3").estado, "ativa");
t("outra rodada: ninguém conta", contaEntradasNaRodada(Object.values(sTres.invocacoes), 3), 0);
t("fora do combate (rodada 0): ninguém conta", contaEntradasNaRodada(Object.values(sTres.invocacoes), 0), 0);
t("a tela lê a rodada pela linha", S.estadoDaInvocacao(sTres, "INV1").rodadaDaSessao, 2);
const salva = S.normalizaSessao(JSON.parse(JSON.stringify(sTres)));
t("salvar e reabrir: mesma conta", resumoDasEntradas(Object.values(salva.invocacoes), 2, porAcao).entradas, 3);
const concentrado = resumoDasEntradas(Object.values(sTres.invocacoes), 2, 1);
t("Controle Concentrado: uma por ação", [concentrado.excede, concentrado.acoesNecessarias], [true, 3]);

if (bad.length) {
  console.error(`FALHARAM ${bad.length} DE ${ok + bad.length}`);
  for (const b of bad) console.error("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
