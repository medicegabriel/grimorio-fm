/* Ciclo de Adaptação do Mahoraga. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { createBlankAfty } = await import(R + "afty-schema.js");
const { deriveAfty } = await import(R + "afty-derive.js");
const { aplicarAddons, normalizarPacote, validarPacote } = await import(R + "afty-addons.js");
const { sessaoEmBranco, proximaRodada } = await import(R + "ficha/ficha-sessao.js");
const {
  girarAdaptacao, escolherAdaptacaoNarrativa, escolherAdaptacaoMecanica, habilidadesDeAcerto,
  origensDiretasDasAdaptacoes, resetarAdaptacao,
} = await import(R + "afty-adaptacao.js");
const { CICLO_ADAPTACAO_MAHORAGA } = await import(R + "addons/ciclo-adaptacao-mahoraga.js");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok += 1;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

const pacote = normalizarPacote(CICLO_ADAPTACAO_MAHORAGA);
t("pacote valido", validarPacote(pacote), []);
t("primitiva preservada", pacote.permite, ["adaptacao"]);
t("configuracao preservada", pacote.adaptacoes.length, 1);
t("ciclo exige a primitiva", validarPacote({ ...pacote, permite: [] }).length > 0, true);

const criatura = createBlankAfty();
criatura.core.nd = 20;
criatura.addons = [pacote];
aplicarAddons(criatura.addons);

let sessao = sessaoEmBranco();
let d = deriveAfty(criatura, { concedido: sessao.concedido, adaptacoes: sessao.adaptacoes });
const chave = d.adaptacoes[0].chave;
t("painel liberado", d.primitivas.includes("adaptacao"), true);
t("ciclo chega ao derivado", d.adaptacoes[0].nome, "Roda de Adaptação");

sessao = girarAdaptacao(sessao, d, chave);
t("primeiro giro concede", sessao.concedido.length, 1);
t("primeiro giro inicia ciclo", sessao.adaptacoes[chave].giros, 1);
t("primeira rodada guardada", sessao.adaptacoes[chave].primeiraRodada, 0);

d = deriveAfty(criatura, { concedido: sessao.concedido, adaptacoes: sessao.adaptacoes });
const rodada = proximaRodada(sessao, d).sessao;
t("rodada gira automaticamente", rodada.adaptacoes[chave].giros, 2);
t("rodada concede outra habilidade", rodada.concedido.length, 2);

sessao = sessaoEmBranco();
d = deriveAfty(criatura, { concedido: [], adaptacoes: {} });
for (let i = 0; i < 5; i += 1) {
  sessao = girarAdaptacao(sessao, d, chave);
  d = deriveAfty(criatura, { concedido: sessao.concedido, adaptacoes: sessao.adaptacoes });
}
t("quinto giro cria marco", sessao.adaptacoes[chave].pendentes, 1);
t("quinto giro nao concede", sessao.concedido.length, 4);

sessao = escolherAdaptacaoMecanica(sessao, d, chave);
t("mecanica consome marco", sessao.adaptacoes[chave].pendentes, 0);
t("primeira mecanica passiva", sessao.adaptacoes[chave].mecanica.modo, "passiva");
const passiva = sessao.adaptacoes[chave].mecanica.bonusAcerto;
d = deriveAfty(criatura, { concedido: sessao.concedido, adaptacoes: sessao.adaptacoes });
t("mecanica entra no motor", d.efeitos.detalhes.some((e) => e.nome === "Adaptação Mecânica"), true);

let narrativa = sessaoEmBranco();
narrativa.adaptacoes[chave] = {
  giros: 5, primeiraRodada: 0, ultimaRodadaAutomatica: 0, pendentes: 1,
  narrativas: [], mecanica: null, ganhos: [],
};
narrativa = escolherAdaptacaoNarrativa(narrativa, chave, "Cortar");
t("narrativa guarda texto", narrativa.adaptacoes[chave].narrativas[0].texto, "Cortar");
t("narrativa vira requisito", narrativa.adaptacoes[chave].narrativas.length, 1);
narrativa.adaptacoes[chave].pendentes = 1;
narrativa = escolherAdaptacaoMecanica(narrativa, d, chave);
t("segunda mecanica ativa", narrativa.adaptacoes[chave].mecanica.modo, "ativa");
t("uma narrativa e facil", narrativa.adaptacoes[chave].mecanica.requisitoNome, "Fácil");
t("ativa inteira supera metade", narrativa.adaptacoes[chave].mecanica.bonusAcerto >= passiva, true);

let impossivel = sessaoEmBranco();
impossivel.adaptacoes[chave] = {
  giros: 25, primeiraRodada: 0, ultimaRodadaAutomatica: 0, pendentes: 1,
  narrativas: [1, 2, 3, 4].map((n) => ({ id: `n${n}`, giro: n * 5, texto: String(n) })),
  mecanica: null, ganhos: [],
};
impossivel = escolherAdaptacaoMecanica(impossivel, d, chave);
const mi = impossivel.adaptacoes[chave].mecanica;
t("quatro narrativas e impossivel", mi.requisitoNome, "Impossível");
t("impossivel usa acao completa", mi.acao, "completa");
t("impossivel aplica as tres melhorias", mi.melhorias,
  ["Ação Completa", "Pressão Amaldiçoada", "Ruptura Absoluta"]);
t("impossivel ignora rd", mi.ignoraRD > 0, true);

/* Escolha aninhada concedida passa pelo resolvedor. */
const escolha = deriveAfty(criatura, {
  concedido: [{
    familia: "habilidades", id: "lut_empolgacao", escolhas: ["lut_manobra_ajuste"],
  }],
});
t("escolha de acerto entra junto", escolha.habilidades.escolhas.mapa.lut_empolgacao,
  ["lut_manobra_ajuste"]);

/* Pré-requisito que não dá Acerto ocupa um giro próprio. */
const ateArmas = habilidadesDeAcerto().map((x) => x.habilidade.id);
const indiceArmas = ateArmas.indexOf("lut_armas_absolutas");
const comAnteriores = createBlankAfty();
comAnteriores.core.nd = 20;
comAnteriores.addons = [pacote];
comAnteriores.habilidades = ateArmas.slice(0, indiceArmas);
let sessaoReq = sessaoEmBranco();
let dReq = deriveAfty(comAnteriores, { concedido: [], adaptacoes: {} });
sessaoReq = girarAdaptacao(sessaoReq, dReq, chave);
t("raiz do pre requisito vem antes", sessaoReq.concedido[0].id, "lut_dedicacao_em_arma");
t("alvo ainda nao veio", sessaoReq.concedido.some((c) => c.id === "lut_armas_absolutas"), false);
dReq = deriveAfty(comAnteriores, { concedido: sessaoReq.concedido, adaptacoes: sessaoReq.adaptacoes });
sessaoReq = girarAdaptacao(sessaoReq, dReq, chave);
dReq = deriveAfty(comAnteriores, { concedido: sessaoReq.concedido, adaptacoes: sessaoReq.adaptacoes });
t("segundo pre requisito vem depois", sessaoReq.concedido[1].id, "lut_um_com_a_arma");
sessaoReq = girarAdaptacao(sessaoReq, dReq, chave);
t("alvo vem no giro seguinte", sessaoReq.concedido.some((c) => c.id === "lut_armas_absolutas"), true);

/* A roda aplica a Habilidade recebida sem exigir o interruptor normal dela. */
const poolAcerto = habilidadesDeAcerto();
const indiceImpacto = poolAcerto.findIndex((x) => x.habilidade.id === "lut_impacto_misto");
const direta = createBlankAfty();
direta.core.nd = 20;
direta.addons = [pacote];
direta.habilidades = poolAcerto.slice(0, indiceImpacto).map((x) => x.habilidade.id);
let sessaoDireta = sessaoEmBranco();
let dDireta = deriveAfty(direta, { concedido: [], adaptacoes: {} });
sessaoDireta = girarAdaptacao(sessaoDireta, dDireta, chave);
t("giro alcanca habilidade com gatilho", sessaoDireta.concedido[0].id, "lut_impacto_misto");
t("origem do ganho fica direta", origensDiretasDasAdaptacoes(direta, sessaoDireta.adaptacoes),
  ["lut_impacto_misto"]);
dDireta = deriveAfty(direta, {
  concedido: sessaoDireta.concedido, adaptacoes: sessaoDireta.adaptacoes,
});
t("acerto do giro entra sem ativar", dDireta.efeitos.detalhes.some((e) => (
  e.origem === "lut_impacto_misto" && e.canal === "bonusAcerto" && e.valor === 2
)), true);
t("efeito irmao entra sem ativar", dDireta.efeitos.detalhes.some((e) => (
  e.origem === "lut_impacto_misto" && e.canal === "danoBonus" && e.valor === 2
)), true);
const concessaoComum = deriveAfty(direta, {
  concedido: [{ familia: "habilidades", id: "lut_impacto_misto" }], adaptacoes: {},
});
t("concessao comum ainda exige ativacao", concessaoComum.efeitos.detalhes.some((e) => (
  e.origem === "lut_impacto_misto"
)), false);

/* Encerrar o combate limpa o ciclo e só as concessões produzidas por ele. */
let sessaoReset = sessaoEmBranco();
sessaoReset.concedido = [{
  uid: "manual", familia: "talentos", id: "tal_adepto_de_briga", escolhas: [], em: 1,
}];
let dReset = deriveAfty(criatura, { concedido: sessaoReset.concedido, adaptacoes: {} });
sessaoReset = girarAdaptacao(sessaoReset, dReset, chave);
dReset = deriveAfty(criatura, {
  concedido: sessaoReset.concedido, adaptacoes: sessaoReset.adaptacoes,
});
sessaoReset = girarAdaptacao(sessaoReset, dReset, chave);
t("ganho guarda concessao exata", !!sessaoReset.adaptacoes[chave].ganhos[0].concessaoUid, true);
t("reset parte de dois giros", sessaoReset.adaptacoes[chave].giros, 2);
const resetada = resetarAdaptacao(sessaoReset, chave);
t("reset zera estado do ciclo", resetada.adaptacoes[chave], undefined);
t("reset tira concessoes da roda", resetada.concedido.some((c) => c.familia === "habilidades"), false);
t("reset preserva concessao alheia", resetada.concedido.map((c) => c.uid), ["manual"]);
t("reset sem ciclo nao altera sessao", resetarAdaptacao(resetada, chave), resetada);

const legado = structuredClone(sessaoReset);
for (const ganho of legado.adaptacoes[chave].ganhos) delete ganho.concessaoUid;
const legadoResetado = resetarAdaptacao(legado, chave);
t("reset reconhece giros antigos", legadoResetado.concedido.map((c) => c.uid), ["manual"]);

if (bad.length) {
  console.error(`FALHOU t-adaptacao (${bad.length})`);
  for (const erro of bad) console.error(`  ${erro}`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
