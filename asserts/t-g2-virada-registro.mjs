/* A VIRADA DE RODADA E O REGISTRO DELA (integração do G2, 2026-10-17).

   Renovação e cobrança são FATOS SEPARADOS. Renovar 4 PE temporários e pagar 4 de manutenção deixa o saldo líquido igual, e quem infere a cobrança
   comparando o saldo de antes com o de depois diria "nada cobrado". `proximaRodada` agora devolve, além de `{ sessao, expirou }`, o campo aditivo
   `registro`, anotado NO PONTO EM QUE CADA COISA ACONTECE:

     renovou        [{ chave, de, para }]   a casca que a virada entregou
     pagou          [{ id, nome, valor, casca, reserva }]   o que a virada cobrou de PE, e de onde saiu
     encerrou       [{ id, nome, motivo }]  o estado que a virada desligou
     exaustaoGanha  a Exaustão que a virada entregou

   É observabilidade pura. A prova de que NADA mudou na mecânica está em duas camadas: (1) os números abaixo são os da execução ANTERIOR (módulo da
   base, comparado cenário a cenário na entrega: mesma sessão, mesmo `expirou`), e (2) o assert de conservação, que reconstrói o saldo de PE só pelo
   registro (saldo de antes, mais o que foi renovado, menos o que foi pago, é o saldo de depois) e por isso pega qualquer divergência futura. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const loja = new Map();
globalThis.localStorage = {
  getItem: (k) => (loja.has(k) ? loja.get(k) : null),
  setItem: (k, v) => loja.set(k, String(v)),
  removeItem: (k) => loja.delete(k),
};

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { avancarRodada } = await import(R + "ficha/efeitos/mesa-verbos.js");
const { avancaRodadaComRegistro, daSessao } = await import(R + "ficha/efeitos/sessao-g2.js");
const { projetarViradas } = await import(R + "ficha/efeitos/g2-linha-do-tempo.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ficha = createBlankAfty();
ficha.rulesVersion = "player";
ficha.core = { ...ficha.core, nd: 30, tipo: "combatente", patamar: "comum" };
ficha.especializacoes = [{ id: "combatente", nivel: 20 }, { id: "conjurador", nivel: 10 }];
ficha.habilidades = ["cmb_assumir_postura", "cmb_preparacao_rapida", "cmb_mestre_da_postura"];
ficha.escolhasHabilidade = { cmb_assumir_postura: ["cmb_postura_do_sol"] };
ficha.habilidadesLendarias = ["len_atingir_apice"];
ficha.escolhasAltoNivel = { len_atingir_apice: ["api_invencivel_sob_o_sol"] };
const com = deriveAfty({ ...ficha, combate: { ativo: true, invencivelSobOSol: true, invencivelRodadas: 1 } });
const TREINO = { chave: "treino:rodada", nome: "Treino de Controle de Energia", valor: 4 };
const comRenovacao = { ...com, peTemporario: { rodada: [TREINO], combate: [] } };
const semRenovacao = { ...com, peTemporario: { rodada: [], combate: [] } };
const base = (sobre = {}, combate = {}) => ({ ...S.sessaoEmBranco(com), rodada: 1, combate: { ativo: true, ...combate }, ...sobre });
const INV = { id: "invencivelSobOSol", nome: "Invencível sob o Sol" };
const saldo = (s) => Math.max(0, s.peAtual) + S.peTempTotal(s);

/* Cada cenário: a sessão de partida, o derive e o que a execução ANTERIOR produziu (peAtual, casca, Exaustão, e o estado do Invencível). */
const CENARIOS = [
  { nome: "0 PE principal, a renovação paga a manutenção", s: base({ peAtual: 0 }, { invencivelSobOSol: true, invencivelRodadas: 1 }), d: comRenovacao,
    sessao: { peAtual: 0, casca: {}, exaustao: 0, inv: [true, 2, true] },
    registro: { renovou: [{ chave: TREINO.chave, de: 0, para: 4 }], pagou: [{ ...INV, valor: 4, casca: { [TREINO.chave]: 4 }, reserva: 0 }], encerrou: [], exaustaoGanha: 0 } },
  { nome: "sem renovação, com Energia suficiente", s: base({ peAtual: 20 }, { invencivelSobOSol: true, invencivelRodadas: 1 }), d: semRenovacao,
    sessao: { peAtual: 16, casca: {}, exaustao: 0, inv: [true, 2, true] },
    registro: { renovou: [], pagou: [{ ...INV, valor: 4, casca: {}, reserva: 4 }], encerrou: [], exaustaoGanha: 0 } },
  { nome: "renovação parcial: a casca renovada paga e a reserva fica", s: base({ peAtual: 10, peTempFontes: { [TREINO.chave]: 1 } }, { invencivelSobOSol: true, invencivelRodadas: 2 }), d: comRenovacao,
    sessao: { peAtual: 10, casca: {}, exaustao: 0, inv: [true, 3, true] },
    registro: { renovou: [{ chave: TREINO.chave, de: 1, para: 4 }], pagou: [{ ...INV, valor: 4, casca: { [TREINO.chave]: 4 }, reserva: 0 }], encerrou: [], exaustaoGanha: 0 } },
  { nome: "sem Energia suficiente: encerra e entrega a Exaustão pendente", s: base({ peAtual: 3 }, { invencivelSobOSol: true, invencivelRodadas: 1, invencivelPendenteExaustao: true }), d: semRenovacao,
    sessao: { peAtual: 3, casca: {}, exaustao: 1, inv: [false, 0, false] },
    registro: { renovou: [], pagou: [], encerrou: [{ ...INV, motivo: "semEnergia" }], exaustaoGanha: 1 } },
  { nome: "fim da duração (a quarta rodada)", s: base({ peAtual: 20 }, { invencivelSobOSol: true, invencivelRodadas: 4, invencivelPendenteExaustao: true }), d: semRenovacao,
    sessao: { peAtual: 20, casca: {}, exaustao: 1, inv: [false, 0, false] },
    registro: { renovou: [], pagou: [], encerrou: [{ ...INV, motivo: "quartaRodada" }], exaustaoGanha: 1 } },
  { nome: "Exaustão pendente depois de encerrar à mão", s: base({ peAtual: 20 }, { invencivelSobOSol: false, invencivelPendenteExaustao: true }), d: semRenovacao,
    sessao: { peAtual: 20, casca: {}, exaustao: 1, inv: [false, 0, false] },
    registro: { renovou: [], pagou: [], encerrou: [{ ...INV, motivo: "desligadoAMao" }], exaustaoGanha: 1 } },
  { nome: "virada sem cobrança", s: base({ peAtual: 20 }, {}), d: semRenovacao,
    sessao: { peAtual: 20, casca: {}, exaustao: 0, inv: [undefined, undefined, undefined] },
    registro: { renovou: [], pagou: [], encerrou: [], exaustaoGanha: 0 } },
];

for (const c of CENARIOS) {
  const r = S.proximaRodada(c.s, c.d);
  const f = r.sessao;
  t(`${c.nome}: o retorno ganhou o campo e manteve os de sempre`, [Object.keys(r).sort(), Array.isArray(r.expirou)], [["expirou", "registro", "sessao"], true]);
  t(`${c.nome}: a mecânica é a da execução anterior`, [f.rodada, f.peAtual, f.peTempFontes, f.exaustao, [f.combate.invencivelSobOSol, f.combate.invencivelRodadas, f.combate.invencivelPendenteExaustao]],
    [2, c.sessao.peAtual, c.sessao.casca, c.sessao.exaustao, c.sessao.inv]);
  t(`${c.nome}: o registro diz o que a virada realmente fez`, r.registro, c.registro);
  /* A conservação: o saldo de depois sai só do registro. É o que o saldo líquido NÃO consegue dizer (renovar 4 e pagar 4 dá diferença zero). */
  const renovado = r.registro.renovou.reduce((n, x) => n + (x.para - x.de), 0);
  const pago = r.registro.pagou.reduce((n, x) => n + x.valor, 0);
  t(`${c.nome}: saldo antes mais renovado menos pago é o saldo depois`, saldo(c.s) + renovado - pago, saldo(f));
  t(`${c.nome}: cada pagamento diz de onde saiu, e a soma fecha o valor`, r.registro.pagou.every((x) => Object.values(x.casca).reduce((a, b) => a + b, 0) + x.reserva === x.valor), true);
  /* A nota do histórico lê o registro, nunca a diferença dos saldos. */
  const nota = avancarRodada(daSessao(c.s), c.d).nota;
  t(`${c.nome}: a nota cobra o que foi pago`, nota.cobrado.map((x) => [x.nome, x.valor]), c.registro.pagou.map((x) => [x.nome, x.valor]));
  t(`${c.nome}: a nota entrega a renovação, o encerramento e a Exaustão`, [nota.casca, nota.encerrou.map((x) => x.motivo), nota.exaustao],
    [renovado, c.registro.encerrou.map((x) => x.motivo), c.registro.exaustaoGanha]);
}

/* O caso que quebrava a inferência: renovar 4 e pagar 4 deixa o saldo líquido igual, e a nota continua dizendo 4 PE cobrados. */
{
  const c = CENARIOS[0];
  const r = S.proximaRodada(c.s, c.d);
  t("renovar 4 e pagar 4: o saldo líquido não muda", saldo(r.sessao) - saldo(c.s), 0);
  t("renovar 4 e pagar 4: a nota diz 4 PE cobrados da casca", avancarRodada(daSessao(c.s), c.d).nota.cobrado, [{ nome: INV.nome, valor: 4, casca: 4, reserva: 0 }]);
}

/* A virada da Ficha é a MESMA que a Linha do Tempo projeta: o botão e a previsão dão a mesma sessão (o `operacoes` é só o registro do botão). */
for (const c of CENARIOS.slice(0, 2)) {
  const botao = avancaRodadaComRegistro(c.s, c.d);
  const { operacoes, ...semOperacoes } = botao;
  const previsao = projetarViradas(ficha, c.s, c.d, 1)[1].sessao;
  t(`${c.nome}: o botão e a Linha do Tempo dão a mesma virada`,
    [semOperacoes.rodada, semOperacoes.peAtual, semOperacoes.peTempFontes, semOperacoes.exaustao, semOperacoes.combate, semOperacoes.pvTempFontes],
    [previsao.rodada, previsao.peAtual, previsao.peTempFontes, previsao.exaustao, previsao.combate, previsao.pvTempFontes]);
  t(`${c.nome}: o botão registra o evento com a rodada e o horário reais`, [operacoes.eventos[0].tipo, operacoes.eventos[0].nota.rodada, typeof operacoes.eventos[0].ts], ["rodada", 2, "number"]);
}

/* A renovação da Postura da Terra pelo Invencível é a mesma reserva da Terra registrada à mão: o botão e a previsão dão o mesmo acabamento. */
{
  const c = CENARIOS[1];
  const botao = avancaRodadaComRegistro(c.s, c.d);
  t("a Terra do Invencível fica anotada como concessão da ficha nesta rodada", [botao.operacoes.pvConcessoes.terra?.pelaFicha, botao.operacoes.pvConcessoes.terra?.rodada], [true, 2]);
}

/* O Encontro segue chamando o verbo com `preservarTurnoArmas`: o registro não muda o alcance dos resets de turno. */
{
  const s = base({ peAtual: 20 }, { invencivelSobOSol: true, invencivelRodadas: 1 });
  const a = S.proximaRodada(s, semRenovacao, { preservarTurnoArmas: true });
  const b = S.proximaRodada(s, semRenovacao);
  t("preservarTurnoArmas continua aceito e devolve o registro", [Object.keys(a).sort(), a.registro.pagou.length, b.registro.pagou.length], [["expirou", "registro", "sessao"], 1, 1]);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n${bad.join("\n")}` : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
