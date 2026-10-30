import { register } from "node:module";
register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}", import.meta.url);
import { createHash } from "node:crypto";
const R = new URL("../../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const ATUAL = await import(R + "ficha/ficha-sessao.js");
const BASE = await import(R + "ficha/ficha-sessao.BASE-TEMP.js");

const ficha = createBlankAfty();
ficha.rulesVersion = "player";
ficha.core = { ...ficha.core, nd: 30, tipo: "combatente", patamar: "comum" };
ficha.especializacoes = [{ id: "combatente", nivel: 20 }, { id: "conjurador", nivel: 10 }];
ficha.habilidades = ["cmb_assumir_postura", "cmb_preparacao_rapida", "cmb_mestre_da_postura"];
ficha.escolhasHabilidade = { cmb_assumir_postura: ["cmb_postura_do_sol"] };
ficha.habilidadesLendarias = ["len_atingir_apice"];
ficha.escolhasAltoNivel = { len_atingir_apice: ["api_invencivel_sob_o_sol"] };
const com = deriveAfty({ ...ficha, combate: { ativo: true, invencivelSobOSol: true, invencivelRodadas: 1 } });
const derivedComRenovacao = { ...com, peTemporario: { rodada: [{ chave: "treino:rodada", nome: "Treino de Controle de Energia", valor: 4 }], combate: [] } };
const derivedSemRenovacao = { ...com, peTemporario: { rodada: [], combate: [] } };

const base = (sobre = {}, combate = {}) => ({ ...ATUAL.sessaoEmBranco(com), rodada: 1, combate: { ativo: true, ...combate }, ...sobre });
const cenarios = {
  "0 PE com renovação paga a manutenção": { s: base({ peAtual: 0 }, { invencivelSobOSol: true, invencivelRodadas: 1 }), d: derivedComRenovacao },
  "sem renovação, Energia suficiente": { s: base({ peAtual: 20 }, { invencivelSobOSol: true, invencivelRodadas: 1 }), d: derivedSemRenovacao },
  "renovação parcial e reserva completam": { s: base({ peAtual: 10, peTempFontes: { "treino:rodada": 1 } }, { invencivelSobOSol: true, invencivelRodadas: 2 }), d: derivedComRenovacao },
  "sem Energia suficiente": { s: base({ peAtual: 3 }, { invencivelSobOSol: true, invencivelRodadas: 1, invencivelPendenteExaustao: true }), d: derivedSemRenovacao },
  "fim da duração (quarta rodada)": { s: base({ peAtual: 20 }, { invencivelSobOSol: true, invencivelRodadas: 4, invencivelPendenteExaustao: true }), d: derivedSemRenovacao },
  "Exaustão pendente depois de encerrar à mão": { s: base({ peAtual: 20 }, { invencivelSobOSol: false, invencivelPendenteExaustao: true }), d: derivedSemRenovacao },
  "virada sem cobrança": { s: base({ peAtual: 20 }, {}), d: derivedSemRenovacao },
};
const h = (v) => createHash("sha256").update(JSON.stringify(v)).digest("hex").slice(0, 16);
let tudoIgual = true;
for (const [nome, { s, d }] of Object.entries(cenarios)) {
  const a = ATUAL.proximaRodada(s, d);
  const b = BASE.proximaRodada(s, d);
  const igual = JSON.stringify(a.sessao) === JSON.stringify(b.sessao) && JSON.stringify(a.expirou) === JSON.stringify(b.expirou);
  tudoIgual &&= igual;
  const antes = ATUAL.peTempTotal(s) + s.peAtual, depois = ATUAL.peTempTotal(a.sessao) + a.sessao.peAtual;
  console.log(`\n${nome}\n  mesma sessão e expirou que a base: ${igual} | hash ${h(b.sessao)} ${h(a.sessao)}`);
  console.log(`  saldo líquido de PE: ${antes} -> ${depois} (diferença ${depois - antes})`);
  console.log(`  registro: ${JSON.stringify(a.registro)}`);
  console.log(`  peAtual ${a.sessao.peAtual} casca ${JSON.stringify(a.sessao.peTempFontes)} exaustao ${a.sessao.exaustao} combate.inv ${a.sessao.combate.invencivelSobOSol}/${a.sessao.combate.invencivelRodadas}/${a.sessao.combate.invencivelPendenteExaustao}`);
}
console.log("\nTODOS OS CENÁRIOS IGUAIS À BASE:", tudoIgual);
