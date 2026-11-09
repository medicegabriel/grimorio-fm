/* CX6: FRENESI DA INVOCAÇÃO E PROTEGER INVOCAÇÃO. Livro p.97 e p.99. Duas fichas reais (a dona Controlador e uma aliada sem a Habilidade),
   sessões reais, `opId`, recusas, uma vez por rodada, salvar e reabrir, e o efeito no número da invocação. */
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
const C = await import(R + "ficha/ficha-controlador.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
aplicarAddons([]);

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

const ficha = (habilidades) => {
  const c = createBlankAfty();
  c.core.nivel = 12; c.core.nd = 12; c.core.tipo = "misto"; c.core.patamar = "comum"; c.core.origem = { id: "inato" };
  c.attributes = { forca: 10, destreza: 10, constituicao: 12, inteligencia: 12, sabedoria: 14, presenca: 18 };
  c.especializacoes = [{ id: "controlador", nivel: 12 }];
  c.habilidades = habilidades;
  c.invocacoes = [{ ...INV.createBlankInvocacao("segundo", "shikigami"), id: "INV1", nome: "Nue" }];
  return c;
};
const COMUM = ["ctr_treinamento_em_controle"];
const dona = ficha([...COMUM, "ctr_frenesi_da_invocacao", "ctr_proteger_invocacao"]);
const dD = deriveAfty(dona);
const nova = (d) => ({ ...S.aplicaPatchCombate(S.sessaoEmBranco(d), { ativo: true }), rodada: 2, peAtual: 100 });
let n = 0;
const op = () => `op_cx6_${(n += 1)}`;
const linha = (s) => S.estadoDaInvocacao(s, "INV1");
const invDe = (c, s) => deriveAfty({ ...c }, { invocacoes: s.invocacoes }).invocacoes.lista.find((i) => i.id === "INV1");

/* ---------- FRENESI ---------- */
let s = S.invocaNaMesa(nova(dD), dD, "INV1");
const antes = invDe(dona, s);
const idFrenesi = op();
const r1 = C.ativaFrenesi(s, dD, "INV1", { opId: idFrenesi });
t("Frenesi aplicado", [r1.aplicado, linha(r1.sessao).frenesi], [true, true]);
const depois = invDe(dona, r1.sessao);
t("Frenesi: -5 de Defesa", depois.defesa - antes.defesa, -5);
t("Frenesi: aparece como parcela nomeada no hover", depois.fontes.defesa.some((p) => p.label === "Frenesi da Invocação" && p.valor === -5), true);
const trAntes = antes.testes.resistencias ?? antes.testes.trs ?? null;
const trDepois = depois.testes.resistencias ?? depois.testes.trs ?? null;
const soma = (lista) => (lista ?? []).reduce((a, x) => a + (x.bonus ?? x.total ?? 0), 0);
t("Frenesi: -5 em cada teste de resistência", soma(trDepois) - soma(trAntes), -5 * (trAntes?.length ?? 0));
t("mesmo opId: repetida, sem nova aplicação", [C.ativaFrenesi(r1.sessao, dD, "INV1", { opId: idFrenesi }).repetida], [true]);
const segunda = C.ativaFrenesi(r1.sessao, dD, "INV1", { opId: op() });
t("só uma vez por rodada", [segunda.aplicado, segunda.erro, segunda.sessao === r1.sessao], [false, "Frenesi Já Usado Nesta Rodada", true]);
t("sem opId: recusa", C.ativaFrenesi(s, dD, "INV1", {}).erro, "Sem Identidade da Operação");
t("fora de campo: recusa", C.ativaFrenesi(nova(dD), dD, "INV1", { opId: op() }).erro, "Invocação Fora de Campo");

// Salvar e reabrir.
const reaberta = S.normalizaSessao(JSON.parse(JSON.stringify(r1.sessao)));
t("salvar e reabrir: o Frenesi continua", linha(reaberta).frenesi, true);
t("salvar e reabrir: a Defesa continua menor", invDe(dona, reaberta).defesa, depois.defesa);

// A virada da rodada apaga o Frenesi e devolve o uso.
const virou = S.proximaRodada(r1.sessao, dD).sessao;
t("a virada da rodada apaga o Frenesi", linha(virou).frenesi, false);
t("a Defesa volta ao normal", invDe(dona, virou).defesa, antes.defesa);
t("na rodada nova o Frenesi pode ser usado de novo", C.ativaFrenesi(virou, dD, "INV1", { opId: op() }).aplicado, true);

// Dissipar ou descansar apaga também.
t("sair de campo apaga o Frenesi", linha(S.saiDeCampo(r1.sessao, "INV1")).frenesi, false);
t("cair apaga o Frenesi", linha(S.aplicaDanoInvocacao(r1.sessao, "INV1", 9999, antes.pv, antes.regras)).frenesi, false);
t("descansar apaga o Frenesi", linha(S.descansar(r1.sessao, dD)).frenesi, false);

// Quem não tem a Habilidade.
const aliada = ficha(COMUM);
const dA = deriveAfty(aliada);
const sA = S.invocaNaMesa(nova(dA), dA, "INV1");
t("sem a Habilidade: recusa", C.ativaFrenesi(sA, dA, "INV1", { opId: op() }).erro, "Sem Frenesi da Invocação");
t("a ficha sem a Habilidade não ganha penalidade", invDe(aliada, sA).defesa, invDe(aliada, S.invocaNaMesa(nova(dA), dA, "INV1")).defesa);

/* ---------- PROTEGER INVOCAÇÃO ---------- */
const uso = (d) => d.invocacoes.lista.find((i) => i.id === "INV1").opcoesDeUso.map((o) => [o.id, o.valor]);
const bt = dD.bt ?? dD.maestria;
const modP = dD.mods.presenca;
const modS = dD.mods.sabedoria;
t("sem a Proteção Avançada: d6 e o dano inteiro", uso(dD), [
  ["proteger_reducao", `${bt}d6 + ${modP} ou ${bt}d6 + ${modS}`],
  ["proteger_sacrificio", "Dano Inteiro"],
]);
const avancada = ficha([...COMUM, "ctr_proteger_invocacao", "ctr_protecao_avancada_de_invocacao"]);
const dV = deriveAfty(avancada);
t("com a Proteção Avançada: d8, metade e Ação Livre", uso(dV), [
  ["proteger_reducao", `${bt}d8 + ${modP} ou ${bt}d8 + ${modS}`],
  ["proteger_sacrificio", "Metade do Dano"],
  ["protecao_livre", "2 PE"],
]);
t("quem não tem Proteger Invocação não vê as opções", uso(dA), []);

const sP = S.invocaNaMesa(nova(dD), dD, "INV1");
const semAtributo = C.protegeInvocacao(sP, dD, { opId: op() });
t("sem escolher o atributo: recusa", semAtributo.erro, "Escolha Presença ou Sabedoria");
const rng = () => 0.5;   // d6 vira 4 (piso(0.5*6)+1)
const idP = op();
const p1 = C.protegeInvocacao(sP, dD, { opId: idP, atributo: "presenca", rng });
t("reduz Xd6 + modificador de Presença", [p1.aplicado, p1.faces, p1.dados.length, p1.reducao], [true, 6, bt, bt * 4 + modP]);
t("a mesma operação é repetida", C.protegeInvocacao(p1.sessao, dD, { opId: idP, atributo: "presenca", rng }).repetida, true);
const p2 = C.protegeInvocacao(p1.sessao, dD, { opId: op(), atributo: "sabedoria", rng });
t("a reação é uma por rodada", [p2.aplicado, p2.erro], [false, "Reação Já Usada Nesta Rodada"]);
const pS = C.protegeInvocacao(sP, dD, { opId: op(), atributo: "sabedoria", rng });
t("com Sabedoria usa o outro modificador", pS.reducao, bt * 4 + modS);
t("Ação Livre sem a Proteção Avançada: recusa", C.protegeInvocacao(sP, dD, { opId: op(), atributo: "presenca", livre: true, rng }).erro, "Ação Livre Pede a Proteção Avançada");
t("quem não tem Proteger Invocação: recusa", C.protegeInvocacao(sA, dA, { opId: op(), atributo: "presenca", rng }).erro, "Sem Proteger Invocação");

const sV = S.invocaNaMesa(nova(dV), dV, "INV1");
const pV = C.protegeInvocacao(sV, dV, { opId: op(), atributo: "presenca", rng });
t("Proteção Avançada: d8", [pV.faces, pV.reducao], [8, bt * 5 + modP]);
const livre = C.protegeInvocacao(sV, dV, { opId: op(), atributo: "presenca", livre: true, rng });
t("Ação Livre custa 2 PE", [livre.aplicado, sV.peAtual - livre.sessao.peAtual], [true, 2]);
t("a Ação Livre não gasta a reação", C.protegeInvocacao(livre.sessao, dV, { opId: op(), atributo: "presenca", rng }).aplicado, true);
t("sem PE: recusa e nada é gasto", (() => {
  const r = C.protegeInvocacao({ ...sV, peAtual: 1 }, dV, { opId: op(), atributo: "presenca", livre: true, rng });
  return [r.erro, r.sessao.peAtual];
})(), ["PE Insuficiente", 1]);

t("o sacrifício leva o dano inteiro sem a Proteção Avançada", C.danoPeloSacrificio(dD, 31), 31);
t("o sacrifício leva metade, para baixo, com a Proteção Avançada", C.danoPeloSacrificio(dV, 31), 15);

if (bad.length) {
  console.error(`FALHARAM ${bad.length} DE ${ok + bad.length}`);
  for (const b of bad) console.error("  " + b.slice(0, 300));
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
