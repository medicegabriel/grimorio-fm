import { register } from "node:module";
import { readFileSync } from "node:fs";
register("data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}", import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-olhos-agulha.js");
const { validarPacote } = await import(R + "afty-addons.js");
const { sessaoEmBranco, descansar, normalizaSessao } = await import(R + "ficha/ficha-sessao.js");
const pacote = JSON.parse(readFileSync(new URL("../addons/olhos-de-agulha.json", import.meta.url), "utf8"));
let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};
const modelo = (chave, nivel) => A.modeloPassivaAgulha(`olhos-de-agulha:${chave}`, nivel);
function ficha(sistema = "player", olhos = 2, nivel = 17) {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: nivel, tipo: "conjurador", [A.AGULHA_OLHOS]: olhos, origem: { id: "inato" } };
  f.especializacoes = [{ id: "conjurador", nivel: 1 }];
  f.addons = [pacote];
  f.feiticos = [modelo("olhar", 4), modelo("precisao", 3), modelo("visao", 3)];
  return f;
}
const per = (d) => d.testes.pericias.find((p) => p.id === "percepcao").bonus;
t("pacote válido", validarPacote(pacote), []);
t("versão inválida não cria passiva", modelo("olhar", 3), null);
for (const sistema of ["afty", "player"]) {
  const f = ficha(sistema);
  const base = deriveAfty({ ...f, addons: [], feiticos: [] });
  for (const olhos of [2, 1, 0]) {
    const d = deriveAfty({ ...f, combate: { ativo: false, [A.AGULHA_OLHOS]: olhos } });
    t(`${sistema} ${olhos} olhos: custo total 20`, d.pe, base.pe - 20);
    t(`${sistema} ${olhos} olhos: bônus`, per(d) - per(base), [0, 1, 3][olhos]);
    t(`${sistema} ${olhos} olhos: usos`, d.olhosAgulha.usosMax, [0, 3, 6][olhos]);
    t(`${sistema} ${olhos} olhos: visão`, d.olhosAgulha.visaoCega, [0, 6, 12][olhos]);
    t(`${sistema} ${olhos} olhos: imunidade e precisão`, [d.olhosAgulha.imuneCego, d.olhosAgulha.precisao], [olhos > 0, olhos > 0]);
    t(`${sistema} ${olhos} olhos: fontes de PE fecham`, d.partes.pe.reduce((n, p) => n + (p.valor ?? 0), 0), d.pe);
  }
  const menor = deriveAfty({ ...f, feiticos: [modelo("olhar", 2)] });
  t(`${sistema} nível 2 cobra 4`, menor.pe, base.pe - 4);
  t(`${sistema} nível 2 tem metade BT usos`, menor.olhosAgulha.usosMax, 3);
  const simples = deriveAfty({ ...f, feiticos: [] });
  t(`${sistema} condição básica gratuita`, simples.pe, base.pe);
  t(`${sistema} sem escolhas não ganha usos`, simples.olhosAgulha.usosMax, 0);
  t(`${sistema} escolheu três passivas`, deriveAfty(f).feiticos.gastos, 3);
  t(`${sistema} sem pacote não recebe condição`, deriveAfty({ ...f, addons: [] }).olhosAgulha.tem, false);
  const empilha = deriveAfty({ ...f, core: { ...f.core, tecnicaEfeitos: [{ canal: "bonusPericia", alvo: "percepcao", expr: "2" }] } });
  t(`${sistema} acumula com técnica`, per(empilha) - per(deriveAfty(f)), 2);
}
const bloqueada = deriveAfty(ficha("player", 2, 4));
t("nível do personagem 4 não libera ocular 4", bloqueada.olhosAgulha.nivelMax, 2);
t("passivas inacessíveis sem benefícios", bloqueada.olhosAgulha.habilidades.map((h) => h.ativa), [false, false, false]);
const antecipada = ficha("player", 2, 7);
antecipada.especializacoes = [{ id: "conjurador", nivel: 7 }];
t("antecipa com liberação de conjurador", deriveAfty(antecipada).olhosAgulha.precisao, true);
const impar = A.resolveOlhosAgulha({ ...ficha(), combate: { [A.AGULHA_OLHOS]: 1 } }, { tem: true, bt: 5, nivelMax: 4 });
t("metades arredondadas para baixo", [impar.pericia, impar.usosMax], [1, 2]);
const d = deriveAfty(ficha());
let s = sessaoEmBranco(d);
s = A.definirOlhosAgulha(s, 1);
s = A.usarOlharAgulha(s, 1);
t("uso é marcado", A.usosAgulhaGastos(s), 1);
t("não ultrapassa limite", A.usosAgulhaGastos(A.usarOlharAgulha(s, 1)), 1);
t("devolver uso", A.usosAgulhaGastos(A.devolverOlharAgulha(s)), 0);
t("devolver não fica negativo", A.usosAgulhaGastos(A.devolverOlharAgulha(A.devolverOlharAgulha(s))), 0);
const recarregada = normalizaSessao(JSON.parse(JSON.stringify(s)), d);
t("sessão preserva usos", A.usosAgulhaGastos(recarregada), 1);
t("sessão preserva olho perdido", recarregada.combate[A.AGULHA_OLHOS], 1);
const descansada = descansar(s, d);
t("descanso recupera usos", A.usosAgulhaGastos(descansada), 0);
t("descanso não recupera olho perdido", descansada.combate[A.AGULHA_OLHOS], 1);
console.log(bad.length ? `FALHAS (${bad.length}):\n${bad.join("\n")}` : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
