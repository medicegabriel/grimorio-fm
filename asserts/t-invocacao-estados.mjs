/* OS ESTADOS DE UMA INVOCAÇÃO NA MESA (Etapa 3 da atualização de 2026-09-30).

   Eram três booleanos (`emCampo`, `abatida`, `exorcizada`). Agora o estado é um
   nome só, e a queda segue as regras do TIPO (`transicaoDeQueda`), que vêm de
   `REGRAS_POR_TIPO`:
     Shikigami   0 PV: dissipada (volta com ½). Excedente: exorcizada.
     Técnica     0 PV: dissipada. Excedente: 1º vira dissipação, 2º mata.
     Maldição    0 PV: exorcizada.
     Marionete   0 PV: quebrada (½, depois ¼), e a 3ª queda destrói.
     Corpo       0 PV: desativado, PV negativo até −máximo, aí destruído.

   E a ENTRADA EM CAMPO, uma só para invocar e ativar, que desconta o PE do dono
   e recusa o que ele não cobre (decisão do autor, 2026-09-30). */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const INV = await import(R + "afty-invocacoes.js");
const TIPOS = await import(R + "afty-invocacoes-tipos.js");
const SES = await import(R + "ficha/ficha-sessao.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const regras = (tipo) => TIPOS.regrasDoTipoValor(tipo);
const vazia = { invocacoes: {}, peAtual: 0, peTempFontes: {}, rodada: 0 };
const linha = (s) => SES.estadoDaInvocacao(s, "X");
const resumo = (s) => { const e = linha(s); return [e.estado, e.pvAtual, e.retorno]; };
const com = (partial) => ({ ...vazia, invocacoes: { X: partial } });

/* ============================================================ */
/* 1. A LEITURA DO FORMATO ANTIGO (sem conversão pelo tipo)       */
/* ============================================================ */
t("linha antiga em campo vira ativa", linha(com({ emCampo: true })).estado, "ativa");
t("linha antiga abatida vira dissipada, voltando com metade",
  [linha(com({ abatida: true })).estado, linha(com({ abatida: true })).retorno], ["dissipada", 0.5]);
t("linha antiga exorcizada vira exorcizada", linha(com({ exorcizada: true, abatida: true })).estado, "exorcizada");
t("linha sem nada e fora de campo", linha(com({})).estado, "fora");
t("os booleanos continuam derivados do estado",
  (({ emCampo, abatida, exorcizada }) => [emCampo, abatida, exorcizada])(linha(com({ abatida: true }))),
  [false, true, false]);
const normalizada = SES.normalizaSessao({ invocacoes: { X: { abatida: true, pvAtual: 4 } } });
t("o normalizador da sessao le o antigo do mesmo jeito, e grava o estado",
  [normalizada.invocacoes.X.estado, normalizada.invocacoes.X.retorno, normalizada.invocacoes.X.abatida],
  ["dissipada", 0.5, true]);
t("a linha de tela traz rotulo, morte permanente e vaga em campo",
  (({ rotulo, terminal, contaNoCampo }) => [rotulo, terminal, contaNoCampo])(linha(com({ emCampo: true }))),
  ["Em Campo", false, true]);

/* ============================================================ */
/* 2. AS QUEDAS POR TIPO                                         */
/* ============================================================ */
const MAX = 20;
const golpe = (tipo, partial, dano) =>
  SES.aplicaDanoInvocacao(com({ estado: "ativa", ...partial }), "X", dano, MAX, regras(tipo));

// Shikigami
t("Shikigami a 0 PV fica dissipada, voltando com metade", resumo(golpe("shikigami", {}, 20)), ["dissipada", 0, 0.5]);
t("Shikigami com excedente IGUAL ao maximo so dissipa (tem de ser superior)",
  resumo(golpe("shikigami", {}, 40)), ["dissipada", 0, 0.5]);
t("Shikigami com excedente superior ao maximo e exorcizada",
  linha(golpe("shikigami", {}, 41)).estado, "exorcizada");
t("cair limpa auxilios e casca",
  (({ auxilios, pvTempFontes }) => [auxilios, pvTempFontes])(linha(golpe("shikigami", { auxilios: { a: true } }, 20))),
  [{}, {}]);

// Técnica
const tec1 = golpe("tecnica", {}, 41);
t("Tecnica: o 1o exorcismo vira dissipacao, com metade da vida",
  [...resumo(tec1), linha(tec1).exorcismos], ["dissipada", 0, 0.5, 1]);
const tec2 = SES.aplicaDanoInvocacao(
  SES.poeInvocacaoEmCampo(tec1, "X", true, MAX), "X", 50, MAX, regras("tecnica"));
t("Tecnica: o 2o exorcismo antes do descanso mata", [linha(tec2).estado, linha(tec2).exorcismos], ["morta", 2]);
t("Tecnica: dissipacao normal (0 PV sem excedente) nao conta exorcismo",
  [linha(golpe("tecnica", {}, 20)).estado, linha(golpe("tecnica", {}, 20)).exorcismos], ["dissipada", 0]);
const tecDescansou = SES.descansar({ ...tec1, hpAtual: 0, buffs: [], condicoes: [] }, { hp: 10, pe: 10 });
t("Tecnica: o descanso zera os exorcismos", linha(tecDescansou).exorcismos, 0);
t("e a morte nao volta com descanso",
  linha(SES.descansar({ ...tec2, buffs: [], condicoes: [] }, { hp: 10, pe: 10 })).estado, "morta");

// Maldição
t("Maldicao a 0 PV e exorcizada na hora", linha(golpe("maldicao", {}, 20)).estado, "exorcizada");
t("e uma linha antiga de Maldicao abatida NAO e convertida",
  linha(com({ abatida: true })).estado, "dissipada");

// Marionete
const mar1 = golpe("marionete", {}, 20);
t("Marionete: 1a queda, quebrada, volta com metade",
  [...resumo(mar1), linha(mar1).quedas], ["quebrada", 0, 0.5, 1]);
t("Marionete quebrada ainda ocupa vaga em campo", linha(mar1).contaNoCampo, true);
t("golpe em quem ja esta a 0 nao conta outra queda",
  linha(SES.aplicaDanoInvocacao(mar1, "X", 5, MAX, regras("marionete"))).quedas, 1);
const mar1r = SES.recolheInvocacao(mar1, "X");
t("recolhida deixa de ocupar vaga", [linha(mar1r).estado, linha(mar1r).contaNoCampo], ["recolhida", false]);
const mar1c = SES.reconstroiInvocacao(mar1r, "X", MAX);
t("reconstruida fica fora, com metade da vida", resumo(mar1c), ["fora", 10, null]);
const mar2 = SES.aplicaDanoInvocacao(SES.poeInvocacaoEmCampo(mar1c, "X", true, MAX), "X", 10, MAX, regras("marionete"));
t("Marionete: 2a queda volta com um quarto", [...resumo(mar2), linha(mar2).quedas], ["quebrada", 0, 0.25, 2]);
const mar2c = SES.reconstroiInvocacao(mar2, "X", MAX);
t("reconstruida da 2a, com um quarto da vida", resumo(mar2c), ["fora", 5, null]);
const mar3 = SES.aplicaDanoInvocacao(SES.poeInvocacaoEmCampo(mar2c, "X", true, MAX), "X", 5, MAX, regras("marionete"));
t("Marionete: a 3a queda destroi", [linha(mar3).estado, linha(mar3).quedas], ["destruida", 3]);
t("Marionete com excedente superior ao maximo e destruida de uma vez",
  linha(golpe("marionete", {}, 41)).estado, "destruida");
t("so a quebrada e recolhida (recolher em campo nao faz nada)",
  linha(SES.recolheInvocacao(com({ estado: "ativa" }), "X")).estado, "ativa");

// Corpo
const cor = golpe("corpo", {}, 25);
t("Corpo: desativado, com PV negativo", resumo(cor), ["desativada", -5, null]);
t("Corpo desativado nao ocupa vaga em campo", linha(cor).contaNoCampo, false);
t("Corpo segue podendo ser atacado e desce mais",
  linha(SES.aplicaDanoInvocacao(cor, "X", 10, MAX, regras("corpo"))).pvAtual, -15);
t("Corpo a −PV maximo e destruido (nucleo quebrado)",
  linha(SES.aplicaDanoInvocacao(cor, "X", 15, MAX, regras("corpo"))).estado, "destruida");
t("Corpo curado ate 0 continua desativado",
  resumo(SES.aplicaCuraInvocacao(cor, "X", 5, MAX, regras("corpo"))), ["desativada", 0, null]);
t("Corpo curado acima de 0 volta a funcionar",
  resumo(SES.aplicaCuraInvocacao(cor, "X", 8, MAX, regras("corpo"))), ["ativa", 3, null]);
t("o campo da barra aceita PV negativo no Corpo, ate −maximo",
  resumo(SES.defineVitalInvocacao(com({ estado: "ativa" }), "X", "pv", -50, MAX, regras("corpo"))),
  ["destruida", -20, null]);
t("e nos outros tipos o campo para em zero",
  resumo(SES.defineVitalInvocacao(com({ estado: "ativa" }), "X", "pv", -50, MAX, regras("shikigami"))),
  ["dissipada", 0, 0.5]);

// Morte permanente
t("morte permanente nao toma dano, nao cura e nao muda de PV",
  [linha(SES.aplicaDanoInvocacao(com({ estado: "exorcizada", pvAtual: 0 }), "X", 5, MAX)).pvAtual,
    linha(SES.aplicaCuraInvocacao(com({ estado: "destruida", pvAtual: 0 }), "X", 5, MAX)).pvAtual,
    linha(SES.defineVitalInvocacao(com({ estado: "morta", pvAtual: 0 }), "X", "pv", 9, MAX)).pvAtual],
  [0, 0, 0]);
t("e a ficha nao some da sessao", Object.keys(golpe("shikigami", {}, 41).invocacoes), ["X"]);

/* ============================================================ */
/* 3. A ENTRADA EM CAMPO, COM PE                                 */
/* ============================================================ */
const invDe = (tipo, extra = {}) => ({
  id: "X", pv: MAX, custo: 4, fontes: { custo: [{ label: "Quarto Grau (Base)", valor: 4 }] },
  tipoMecanico: tipo, regras: regras(tipo), ...extra,
});
const comPe = (pe, partial = {}, temp = {}) => ({ ...vazia, peAtual: pe, peTempFontes: temp, invocacoes: { X: partial } });

const e1 = SES.entradaDaInvocacao(comPe(10), invDe("shikigami"));
t("entrada permitida, com custo, verbo e o sinal de invocacao",
  [e1.permitida, e1.verbo, e1.custo.total, e1.contaComoInvocar, e1.via], [true, "Invocar", 4, true, "invocar"]);
t("ativar e o verbo dos tipos que se ativam",
  ["maldicao", "marionete", "corpo", "tecnica"].map((x) => SES.entradaDaInvocacao(comPe(10), invDe(x)).verbo),
  ["Ativar", "Ativar", "Ativar", "Invocar"]);
const s1 = SES.entraEmCampo(comPe(10), "X", e1);
t("entrar desconta o PE e poe em campo", [s1.peAtual, linha(s1).estado], [6, "ativa"]);
t("e registra a entrada", linha(s1).ultimaEntrada, { via: "invocar", rodada: 0, custo: 4 });
const sCasca = SES.entraEmCampo(comPe(10, {}, { Casca: 3 }), "X",
  SES.entradaDaInvocacao(comPe(10, {}, { Casca: 3 }), invDe("shikigami")));
t("a casca de PE paga primeiro", [sCasca.peAtual, sCasca.peTempFontes], [9, {}]);
const sem = SES.entradaDaInvocacao(comPe(3), invDe("shikigami"));
t("PE insuficiente recusa, e mostra o custo", [sem.permitida, sem.motivo, sem.custo.total], [false, "PE Insuficiente", 4]);
t("e gravar uma entrada recusada nao muda nada", SES.entraEmCampo(comPe(3), "X", sem), comPe(3));
t("PE e casca juntos cobrem", SES.entradaDaInvocacao(comPe(2, {}, { C: 2 }), invDe("shikigami")).permitida, true);
t("ja em campo nao entra de novo", SES.entradaDaInvocacao(comPe(10, { estado: "ativa" }), invDe("shikigami")).motivo, "Já Em Campo");
t("morte permanente nao entra", SES.entradaDaInvocacao(comPe(10, { estado: "destruida" }), invDe("marionete")).motivo, "Destruída");
t("quebrada pede reconstrucao", SES.entradaDaInvocacao(comPe(10, { estado: "quebrada" }), invDe("marionete")).motivo, "Precisa Ser Reconstruída");
t("Corpo desativado nao e ativado, so curado", SES.entradaDaInvocacao(comPe(10, { estado: "desativada" }), invDe("corpo")).motivo, "Núcleo Desativado");

/* E-06: dissipar por vontade e voltar SEM custo, com o mesmo PV (Livro). */
const guardada = SES.saiDeCampo(comPe(10, { estado: "ativa", pvAtual: 13, auxilios: { a: true } }), "X");
t("sair de campo por vontade guarda o PV e derruba os auxilios",
  [linha(guardada).estado, linha(guardada).pvAtual, linha(guardada).auxilios], ["guardada", 13, {}]);
const volta = SES.entradaDaInvocacao(guardada, invDe("shikigami"));
t("a volta da guardada e sem custo, com o mesmo PV (E-06)",
  [volta.permitida, volta.custo.total, volta.pvInicial, volta.via], [true, 0, 13, "retornoVoluntario"]);
t("e nao gasta PE", SES.entraEmCampo(guardada, "X", volta).peAtual, 10);

/* Quem caiu volta com a fração. */
const caiu = golpe("shikigami", {}, 20);
t("quem caiu volta com metade do maximo", SES.entradaDaInvocacao({ ...caiu, peAtual: 10 }, invDe("shikigami")).pvInicial, 10);
t("e paga o custo de novo", SES.entradaDaInvocacao({ ...caiu, peAtual: 10 }, invDe("shikigami")).custo.total, 4);

/* ============================================================ */
/* 4. O DESCANSO                                                 */
/* ============================================================ */
const varias = {
  ...vazia, buffs: [], condicoes: [],
  invocacoes: {
    a: { estado: "dissipada", pvAtual: 0, retorno: 0.5 },
    b: { estado: "ativa", pvAtual: 3 },
    c: { estado: "exorcizada", pvAtual: 0 },
    d: { estado: "quebrada", pvAtual: 0, quedas: 2, retorno: 0.25 },
    e: { estado: "guardada", pvAtual: 7 },
  },
};
const desc = SES.descansar(varias, { hp: 10, pe: 10 });
const est = (id) => SES.estadoDaInvocacao(desc, id);
t("o descanso devolve quem caiu ao Fora de Campo, cheio",
  ["a", "d", "e"].map((id) => [est(id).estado, est(id).pvAtual, est(id).retorno]),
  [["fora", null, null], ["fora", null, null], ["fora", null, null]]);
t("quem estava em campo continua", est("b").estado, "ativa");
t("a morte permanente continua", est("c").estado, "exorcizada");
t("as quedas da Marionete zeram (o botao de descanso devolve tudo)", est("d").quedas, 0);

/* ============================================================ */
/* 5. COMPATIBILIDADE E PONTA A PONTA                            */
/* ============================================================ */
t("o verbo antigo liga e desliga sem cobrar PE",
  [linha(SES.poeInvocacaoEmCampo(comPe(10), "X", true, MAX)).estado,
    SES.poeInvocacaoEmCampo(comPe(10), "X", true, MAX).peAtual], ["ativa", 10]);
t("auxilio ligado traz ao campo quem pode voltar",
  linha(SES.alternaAuxilioInvocacao(com({ estado: "guardada" }), "X", "a", true)).estado, "ativa");
t("e nao traz quem esta quebrado nem morto",
  [linha(SES.alternaAuxilioInvocacao(com({ estado: "quebrada" }), "X", "a", true)).estado,
    linha(SES.alternaAuxilioInvocacao(com({ estado: "exorcizada" }), "X", "a", true)).estado],
  ["quebrada", "exorcizada"]);

const criatura = createBlankAfty();
criatura.invocacoes = [
  { ...INV.createBlankInvocacao("quarto", "shikigami"), id: "S", nome: "Sapo" },
  { ...INV.createBlankInvocacao("quarto", "corpo"), id: "C", nome: "Boneco" },
];
const d0 = deriveAfty(criatura);
const s0 = SES.sessaoEmBranco(d0);
const custoS = INV.resolveInvocacao(criatura.invocacoes[0], { nd: d0.nd ?? 1, bt: 2 }).custo;
const s0b = SES.invocaNaMesa({ ...s0, peAtual: 20 }, d0, "S");
t("pela ficha inteira: invocar desconta o custo da resolvida",
  [s0b.peAtual, SES.estadoDaInvocacao(s0b, "S").estado], [20 - custoS, "ativa"]);
const dCampo = deriveAfty(criatura, { invocacoes: s0b.invocacoes });
t("e o resolvido enxerga a invocacao em campo", dCampo.invocacoes.lista.find((i) => i.id === "S").emCampo, true);
const s0c = SES.aplicaDanoInvocacao(s0b, "C", 999, 18, SES.invocacaoDaMesa(d0, "C").regras);
t("o Corpo pela ficha inteira usa as regras dele", SES.estadoDaInvocacao(s0c, "C").estado, "destruida");
const aparado = SES.aparaSessao({ ...s0, invocacoes: { C: { estado: "desativada", pvAtual: -5 } } }, d0);
t("o apara mantem o PV negativo do Corpo", SES.estadoDaInvocacao(aparado, "C").pvAtual, -5);
const aparadoS = SES.aparaSessao({ ...s0, invocacoes: { S: { estado: "ativa", pvAtual: -5 } } }, d0);
t("e leva a zero o negativo dos outros tipos", SES.estadoDaInvocacao(aparadoS, "S").pvAtual, 0);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
