import { register } from "node:module";
register(
  'data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}',
  import.meta.url,
);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { COMBATE_ESTADOS } = await import(R + "afty-combate.js");
const { sessaoEmBranco, alteraEstadoCombate, proximaRodada } = await import(R + "ficha/ficha-sessao.js");
let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

for (const sistema of ["afty", "player"]) {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd: 30, tipo: "restringido", patamar: "comum" };
  c.especializacoes = [{ id: "restringido", nivel: 30 }];
  c.habilidadesLendarias = ["len_atingir_apice"];
  c.escolhasAltoNivel = { len_atingir_apice: ["api_fluxo_invencivel"] };
  c.combate = { ativo: true };
  c.equipamentos = { itens: ["arm_espada_curta", "arm_arco_curto"].map((refId) => ({
    uid: refId, tipo: "arma", refId, qtd: 1, equipado: true,
  })) };
  // A base final fica ímpar nos dois sistemas, mesmo com escalas diferentes.
  c.core.tecnicaEfeitos = [{ canal: "bonusAcerto", alvo: "corpo", expr: sistema === "player" ? "2" : "3" }];
  const sem = deriveAfty(c);
  const ligada = { ...c, combate: { ativo: true, fluxoInvencivel: true } };
  const com = deriveAfty(ligada);
  const acerto = sem.testes.ataques.find((a) => a.id === "corpo").bonus;
  t(`${sistema}: cenário cobre metade fracionária`, Math.abs(acerto % 2), 1);
  t(`${sistema}: Ápice reconhecido`, com.altoNivel.apiceId, "api_fluxo_invencivel");
  t(`${sistema}: Defesa`, com.defesa - sem.defesa, 12);
  t(`${sistema}: RD geral`, com.rdGeral - sem.rdGeral, 30);
  t(`${sistema}: todos os TRs`, com.testes.resistencias.map((r, i) => r.bonus - sem.testes.resistencias[i].bonus), [12, 12, 12, 12, 12]);
  t(`${sistema}: todas as jogadas de ataque`, com.testes.ataques.map((a, i) => a.bonus - sem.testes.ataques[i].bonus), sem.testes.ataques.map(() => Math.floor(acerto / 2)));
  t(`${sistema}: dano básico`, com.dano.entradas[0].fixo - sem.dano.entradas[0].fixo, acerto);
  t(`${sistema}: acerto básico`, com.dano.entradas[0].acerto - sem.dano.entradas[0].acerto, Math.floor(acerto / 2));
  t(`${sistema}: margem`, com.dano.entradas[0].margemCritico, sem.dano.entradas[0].margemCritico - 2);
  const grupo = com.dano.entradas[0].gruposDano.find((g) => g.nome === "Fluxo Invencível");
  t(`${sistema}: dois dados somente no crítico`, [grupo?.dados, grupo?.apenasCritico, grupo?.multiplica], [2, true, true]);
  t(`${sistema}: ataque adicional`, com.ataquesExtras - sem.ataquesExtras, 1);
  t(`${sistema}: armas equipadas presentes`, com.dano.entradas.length, 3);
  for (let i = 1; i < com.dano.entradas.length; i++) {
    t(`${sistema}: arma ${i} recebe dano uma vez`, com.dano.entradas[i].fixo - sem.dano.entradas[i].fixo, acerto);
    t(`${sistema}: arma ${i} recebe acerto`, com.dano.entradas[i].acerto - sem.dano.entradas[i].acerto, Math.floor(acerto / 2));
    t(`${sistema}: arma ${i} recebe crítico`, com.dano.entradas[i].margemCritico, sem.dano.entradas[i].margemCritico - 2);
  }
  t(`${sistema}: acerto com fonte`, com.testes.ataques[0].partes.some((p) => p.label === "Fluxo Invencível" && p.valor === Math.floor(acerto / 2)), true);
  t(`${sistema}: fora de combate`, deriveAfty({ ...ligada, combate: { ativo: false, fluxoInvencivel: true } }).combate.fluxoInvencivel, false);
  t(`${sistema}: sem Ápice`, deriveAfty({ ...ligada, habilidadesLendarias: [] }).combate.fluxoInvencivel, false);
  t(`${sistema}: desligar restaura os valores`, deriveAfty({ ...ligada, combate: c.combate }).testes.ataques, sem.testes.ataques);
  const estado = COMBATE_ESTADOS.find((e) => e.id === "fluxoInvencivel");
  let sessao = { ...sessaoEmBranco(sem), peAtual: 20, combate: { ativo: true } };
  sessao = alteraEstadoCombate(sessao, estado, true);
  sessao = proximaRodada(sessao, com).sessao;
  t(`${sistema}: controle manual de custo, duração e exaustão`, [sessao.peAtual, sessao.exaustao, sessao.combate.fluxoInvencivel], [20, 0, true]);
}
console.log(bad.length ? `FALHAS (${bad.length}):\n${bad.join("\n")}` : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
