import assert from "node:assert/strict";
import { register } from "node:module";
import guerra from "../addons/guerra-de-feiticeiros.json" with { type: "json" };
import equipamentos from "../addons/criacao-de-equipamentos.json" with { type: "json" };
import talentosIniciais from "../addons/talentos-iniciais.json" with { type: "json" };
import progressaoEpica from "../addons/ascendendo-alem-dos-ceus.json" with { type: "json" };

register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const A = await import("../src/systems/afty/afty-addons.js");
const C = await import("../src/systems/afty/afty-addons-compostos.js");
const { regrasAftyDaCriatura } = await import("../src/systems/afty/afty-regras-addon.js");
const { createBlankAfty } = await import("../src/systems/afty/afty-schema.js");
const { focosGastos } = await import("../src/systems/afty/afty-treinamentos.js");
const { deriveAfty } = await import("../src/systems/afty/afty-derive.js");
const { getTalento } = await import("../src/systems/afty/afty-talentos.js");
const { getTreinoEspecial, cdDoTreinoEspecial } = await import("../src/systems/afty/afty-treinos-especiais.js");
const { prepararFichaEclesiastes } = await import("../src/systems/eclesiastes/regras.js");
const { ID_TREINO_TR_ECLESIASTES } = await import("../src/systems/eclesiastes/pacotes-nativos.js");
const { rerrolaTesteDeTreino, testesParaRerrolarTreino } = await import("../src/systems/afty/ficha/ficha-conteudo-testes.js");
const { rolarTeste } = await import("../src/systems/afty/ficha/ficha-rolagem.js");
const { registraRolagem, sessaoEmBranco } = await import("../src/systems/afty/ficha/ficha-sessao.js");
const { pedidoTeste } = await import("../src/systems/afty/ficha/abas-g2/rolagens-acoes.js");

let total = 0;
function confere(real, esperado, mensagem) {
  assert.deepEqual(real, esperado, mensagem);
  total++;
}

function ficha(sistema) {
  const base = { ...createBlankAfty(), rulesVersion: sistema };
  base.core = { ...base.core, nd: 35, origem: { id: "inato" } };
  if (sistema === "player") base.especializacoes = [{ id: "lutador", nivel: 35 }];
  return base;
}

const id = guerra.id;
const jogador = prepararFichaEclesiastes(ficha("player"));
const criatura = prepararFichaEclesiastes(ficha("afty"));
for (const fichaDaEdicao of [jogador, criatura]) {
  const [nativo] = C.addonsDaFicha(fichaDaEdicao);
  const original = C.compor(guerra, fichaDaEdicao.rulesVersion);
  confere(nativo.id, id, "Pacote nativo aplicado sem fonte instalada");
  const { talentosIniciais: padraoDoAddon, ...regrasDoAddon } = original.regrasAfty;
  confere(nativo.regrasAfty, regrasDoAddon, "Regras herdadas com a exceção dos Talentos Iniciais");
  confere(padraoDoAddon, 1, "Addon original conserva o padrão 1");
  confere(C.hidratarFicha(fichaDaEdicao).addonAjustes[id].talentosIniciais, 0, "Ficha de Eclesiastes começa com 0 Talentos Iniciais");
  confere({ ...nativo.acrescenta, treinamentos: original.acrescenta.treinamentos }, original.acrescenta, "Talentos, lendárias e opções herdadas");
  const [treinoTr] = nativo.acrescenta.treinamentos;
  const [treinoTrOriginal] = original.acrescenta.treinamentos;
  confere(treinoTr.etapas.slice(0, 3), treinoTrOriginal.etapas.slice(0, 3), "Três primeiras etapas do Treino de TR herdadas");
  confere(treinoTr.etapas[3].beneficio, treinoTrOriginal.completo.beneficio, "Rerrolagem de TR movida para a quarta etapa");
  confere(nativo.substitui.lendarias, original.substitui.lendarias, "Remendos de lendárias herdados");
  confere(nativo.permite, [], "Primitivas de equipamentos ausentes");
  confere(nativo.libera, original.libera.filter((item) => !equipamentos.libera.includes(item)), "Liberações de equipamentos ausentes");
  confere(nativo.incompativeis, [], "Criação de Armas pode ser instalada separadamente");
  confere(A.addonsVisiveisDaCriatura(fichaDaEdicao), [], "Nativos ausentes da lista de Addons");
  confere(C.desligarComposto(fichaDaEdicao, id), fichaDaEdicao, "O pacote nativo é obrigatório");
  confere(A.aplicarAddons([nativo]).problemas, [], "Catálogos do pacote nativo são válidos");
}

for (const original of [jogador, criatura]) {
  const c = { ...original, core: { ...original.core, nd: 16 }, especializacoes: [], focosLivres: 10 };
  const fichaComTreino = (progresso) => ({ ...c, treinamentos: { [ID_TREINO_TR_ECLESIASTES]: [{ alvo: "fortitude", progresso }] } });
  const parcial = deriveAfty(fichaComTreino(3));
  const completo = deriveAfty(fichaComTreino(4));
  const bonus = (d, tr) => d.testes.resistencias.find((r) => r.value === tr).bonus;
  confere([completo.maestria, bonus(completo, "fortitude") - bonus(parcial, "fortitude"), bonus(completo, "vontade") - bonus(parcial, "vontade")],
    [5, 2, 0], "BT ímpar soma metade arredondada só ao TR escolhido");
  const beneficios = completo.beneficiosTreinamento.filter((item) => item.id.startsWith(`${ID_TREINO_TR_ECLESIASTES}:`));
  confere(beneficios.some((item) => /sucesso garantido/i.test(item.texto)), false, "Sucesso garantido ausente da Ficha Final");

  const baixo = rolarTeste(pedidoTeste({ nome: "Fortitude", resistenciaId: "fortitude", bonus: bonus(completo, "fortitude"), dados: [{ qtd: 1, faces: 3 }] }), () => 0.1);
  const outro = rolarTeste({ rotulo: "Vontade", resistenciaId: "vontade" }, () => 0.1);
  const noLimite = rolarTeste({ rotulo: "Fortitude", resistenciaId: "fortitude" }, () => 0.2);
  const sessao = [baixo, outro, noLimite].reduce(registraRolagem, sessaoEmBranco(completo));
  confere(testesParaRerrolarTreino(sessao, parcial, "fortitude", true), [], "A terceira etapa não habilita rerrolagem");
  confere(testesParaRerrolarTreino(sessao, completo, "fortitude", true).map((r) => r.id), [baixo.id], "Só o TR escolhido com d20 abaixo de 5 é elegível");
  const pedido = { id: baixo.id, alvo: "fortitude", tr: true };
  const novo = rerrolaTesteDeTreino(sessao, completo, { ...pedido, rng: () => 0.7 }, { opId: "tr-maior" });
  confere([novo.rolagem.natural, novo.rolagem.total, novo.rolagem.somaExtras], [15, 15 + baixo.bonus + baixo.somaExtras, baixo.somaExtras], "Rerrolagem muda só o d20 e conserva o bônus e os dados extras");
  confere(rerrolaTesteDeTreino(sessao, completo, { ...pedido, rng: () => 0 }, { opId: "tr-menor" }).rolagem.natural, baixo.natural, "Rerrolagem menor conserva o d20 original");
  confere(rerrolaTesteDeTreino(novo.sessao, completo, pedido, { opId: "tr-repetido" }).aplicado, false, "Um teste já repetido não pode rerrolar de novo");
}

const antigo = {
  ...jogador,
  especializacoes: [{ id: "conjurador", nivel: 35 }],
  trDaClasse: ["astucia"],
  trSegundo: "astucia",
};
const antigoAstucia = {
  ...antigo,
  resistenciasProf: { astucia: "mestre" },
  treinamentos: { [ID_TREINO_TR_ECLESIASTES]: [{ alvo: "astucia", progresso: 4 }] },
};
const semAstucia = deriveAfty(antigo);
const comAstuciaSalva = deriveAfty(antigoAstucia);
confere(comAstuciaSalva.testes.trDaClasse.daClasse, ["vontade"], "Vontade concedida como única opção da classe");
confere(comAstuciaSalva.testes.trDaClasse.opcoesSegundo, ["reflexos", "fortitude", "integridade"], "Segundo TR só oferece resistências da edição");
confere(comAstuciaSalva.testes.orcamento, semAstucia.testes.orcamento, "Proficiência antiga não gasta vagas");
confere(comAstuciaSalva.contextoDsl.prof_tr_astucia, 0, "Proficiência antiga não é lida pelo Motor");
confere(comAstuciaSalva.beneficiosTreinamento, semAstucia.beneficiosTreinamento, "Treino antigo não gera benefícios");
confere(A.comEscopoDaFicha(antigoAstucia, () => focosGastos(antigoAstucia.treinamentos, "inato", null, antigoAstucia)),
  0, "Treino antigo não gasta Focos");

A.limparAddons();
const derivado = deriveAfty(jogador);
confere(derivado.nd, 35, "Jogador de Eclesiastes ultrapassa o teto de 30");
confere(deriveAfty(ficha("player")).nd, 30, "O jogador padrão continua com teto de 30");
confere(derivado.regrasAfty.multiplicadorPvFinal, 2, "Duplicação de PV aplicada");
confere(deriveAfty(criatura).regrasAfty.multiplicadorPvFinal, 1, "Criatura segue com o multiplicador dela");
const comVagasIniciais = C.definirAjuste(jogador, id, "talentosIniciais", 2);
const reaberta = JSON.parse(JSON.stringify(comVagasIniciais));
confere(deriveAfty(reaberta).habilidades.exclusivasTalento - derivado.habilidades.exclusivasTalento, 2, "Quantidade escolhida tem efeito e sobrevive ao salvamento");
const epico = C.definirAjuste(jogador, id, "progressaoEpica", true);
confere(deriveAfty(epico).regrasAfty.multiplicadorPvFinal, 3, "Progressão Épica triplica o PV");
confere(regrasAftyDaCriatura(epico).guardaComoCalamidade, true, "Progressão Épica habilita Guarda de Calamidade");
confere(C.addonsDaFicha(epico)[0].funcionamentos[0].id, "calamidade", "Progressão Épica habilita o funcionamento de Calamidade");
confere(C.definirAjuste(criatura, id, "progressaoEpica", true), criatura, "Criatura não recebe o ajuste de Progressão Épica");

const treinoBase = getTreinoEspecial("tes_habilidade").tetoJogador;
for (const grupo of [[criatura, jogador], [jogador, criatura]]) {
  A.aplicarAddons(A.unirAddons(grupo).pacotes);
  A.comEscopoDaFicha(jogador, () => {
    const treino = getTreinoEspecial("tes_habilidade");
    confere(treino.tetoJogador, null, "Jogador tem Treinamento para Habilidade sem teto");
    confere(cdDoTreinoEspecial(treino, jogador), 12, "A CD de Eclesiastes prevalece");
    confere(treino.descricao.includes("CD igual a 12,"), true, "Descrição acompanha a CD");
    confere(!!getTalento(id + ":tal_estilo_proprio"), true, "Catálogo apresenta os novos Talentos");
  });
  confere(A.comEscopoDaFicha(criatura, () => getTreinoEspecial("tes_habilidade").tetoJogador),
    treinoBase, "O remendo de jogador não passa para criatura em Encontro misto");
}

C.registrarFonteComposta(guerra, { persistir: false });
const legado = {
  ...jogador,
  addons: [
    { ...C.compor(guerra, "player"), ativo: false },
    { ...talentosIniciais, regrasAfty: { talentosIniciais: 3 } },
    progressaoEpica,
    equipamentos,
    { id: "talentos-de-estilo" },
  ],
  talentos: ["talentos-de-estilo:tal_estilo_proprio"],
};
const migrado = C.hidratarFicha(legado);
confere(migrado.addons.map((p) => p.id), [id, equipamentos.id], "Migração absorve os antigos cobertos e preserva equipamentos separados");
confere(migrado.addonAjustes[id], { progressaoEpica: true, talentosIniciais: 3 }, "Preserva ajustes de fichas antigas");
confere(migrado.talentos, [id + ":tal_estilo_proprio"], "Preserva escolhas com o prefixo do catálogo nativo");
confere(A.primitivasDaCriatura(migrado), equipamentos.permite, "Addon de equipamentos separado continua funcional");
confere(A.primitivasDaCriatura(jogador), [], "Fonte instalada não substitui a versão nativa");
confere(C.hidratarFicha(migrado), migrado, "Hidratação repetida é estável");
confere(A.primitivasDaCriatura(C.ligarComposto(ficha("player"), id)), equipamentos.permite, "Guerra de Feiticeiros fora de Eclesiastes mantém seus recursos");

console.log(`TODOS OS ${total} ASSERTS PASSARAM`);
