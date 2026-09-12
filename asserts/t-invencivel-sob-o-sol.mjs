import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { alteraEstadoCombate, aplicaPatchCombate, proximaRodada, sessaoEmBranco } =
  await import(R + "ficha/ficha-sessao.js");

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

const sem = deriveAfty({ ...ficha, combate: { ativo: true } });
const com = deriveAfty({ ...ficha, combate: { ativo: true, invencivelSobOSol: true,
  invencivelRodadas: 1 } });
t("Ápice escolhido pela ficha", com.altoNivel.apiceId, "api_invencivel_sob_o_sol");
t("Defesa soma 12 do Ápice e 3 da Lua não aprendida", com.defesa - sem.defesa, 15);
t("todas as resistências recebem ao menos 12", Object.keys(sem.testes.resistencias)
  .every((id) => com.testes.resistencias[id].bonus - sem.testes.resistencias[id].bonus >= 12), true);
t("o Ápice liga imunidade a críticos", com.combate.imuneCritico, true);
t("a Terra do Ápice impede movimento forçado", com.combate.imuneMovimentoForcado, true);
t("fora do Ápice não há imunidade a críticos", sem.combate.imuneCritico, false);
t("o Sol não aprendido concede um dado", com.dano.entradas[0].dados - sem.dano.entradas[0].dados, 1);
t("o Sol não aprendido concede acerto", com.dano.entradas[0].acerto - sem.dano.entradas[0].acerto, 2);
t("o Céu não aprendido concede perícias", com.testes.pericias[0].bonus - sem.testes.pericias[0].bonus, 2);
t("o Céu não aprendido dobra alcance", com.dano.entradas[0].alcance.curto,
  2 * sem.dano.entradas[0].alcance.curto);
t("Céu concede preparo", com.pontosPreparo - sem.pontosPreparo, 2);
t("Ápice reduz margem", com.dano.entradas[0].margemCritico,
  sem.dano.entradas[0].margemCritico - 1);
const solAtivo = deriveAfty({ ...ficha, combate: { ativo: true, postura: "sol",
  invencivelSobOSol: true } });
t("postura ocupada não duplica o Sol", [solAtivo.dano.entradas[0].acerto,
  solAtivo.dano.entradas[0].dados, solAtivo.defesa],
  [com.dano.entradas[0].acerto, com.dano.entradas[0].dados, com.defesa]);
const solSemApice = deriveAfty({ ...ficha, combate: { ativo: true, postura: "sol" } });
t("penalidade normal do Sol continua sem o Ápice", solSemApice.defesa - sem.defesa, -4);
const semEscolha = deriveAfty({ ...ficha, habilidadesLendarias: [],
  combate: { ativo: true, invencivelSobOSol: true } });
t("estado guardado sem Ápice escolhido não dá bônus", semEscolha.combate.invencivelSobOSol, false);

let s = sessaoEmBranco(sem);
s = { ...s, peAtual: 20, combate: { ativo: true } };
s = alteraEstadoCombate(s, { id: "invencivelSobOSol" }, true);
t("ativação paga 4 PE e abre primeira rodada", [s.peAtual, s.combate.invencivelRodadas], [16, 1]);
for (let n = 1; n <= 3; n++) {
  s = proximaRodada(s, com).sessao;
  t(`virada ${n}: PE, Exaustão e contador`,
    [s.peAtual, s.exaustao, s.combate.invencivelRodadas, s.combate.invencivelSobOSol],
    [16 - 4 * n, n, n + 1, true]);
}
t("Terra entrega PV temporário no começo do turno", s.pvTempFontes["Invencível sob o Sol · Postura da Terra"], 30);
s = proximaRodada(s, com).sessao;
t("quarta rodada encerra sem quinto pagamento",
  [s.peAtual, s.exaustao, s.combate.invencivelRodadas, s.combate.invencivelSobOSol],
  [4, 4, 0, false]);

const semPe = alteraEstadoCombate({ ...sessaoEmBranco(sem), peAtual: 3,
  combate: { ativo: true } }, { id: "invencivelSobOSol" }, true);
t("não ativa sem os 4 PE", semPe.combate.invencivelSobOSol, undefined);
const cancelada = aplicaPatchCombate(alteraEstadoCombate({ ...sessaoEmBranco(sem), peAtual: 8,
  combate: { ativo: true } }, { id: "invencivelSobOSol" }, true), { ativo: false });
t("encerrar combate cobra Exaustão pendente uma vez",
  [cancelada.exaustao, cancelada.combate.invencivelSobOSol], [1, false]);
t("encerrar combate de novo não duplica Exaustão",
  aplicaPatchCombate(cancelada, { ativo: false }).exaustao, 1);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
