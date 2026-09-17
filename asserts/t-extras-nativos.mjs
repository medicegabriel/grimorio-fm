import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty, maestria } = await import(R + "afty-derive.js");
const { createBlankAfty, funcionamentosDaFicha } = await import(R + "afty-schema.js");
const { RECURSOS_BUFF_NATIVOS, efeitosDaAlmaAtual } = await import(R + "afty-extras-nativos.js");
const { efeitosDaTecnica, efeitosDosBuffsNativos } = await import(R + "afty-efeitos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

const base = createBlankAfty();

// 1) Os tres recursos nativos pertencem a Buffs e nao integram os
// Funcionamentos Basicos da ficha nem o pool exclusivo deles.
const recursosEsperados = [
  "aliados_bancada", "alma_estados_automatico", "armeiro_bancada", "comidas_bancada",
];
t("recursos nativos listados em Buffs",
  RECURSOS_BUFF_NATIVOS.map((f) => f.id).sort(), recursosEsperados);
t("recursos nativos ausentes dos Funcionamentos Basicos",
  funcionamentosDaFicha(base).some((f) => recursosEsperados.includes(f.id)), false);
t("nenhum efeito nativo entra na tecnica vazia", efeitosDaTecnica(base).length, 0);
t("a penalidade automatica da Alma tem origem de Buff",
  efeitosDaAlmaAtual(20, 100)[0]?.origem, "buff:alma_estados_automatico");
const efeitosBuffs = efeitosDosBuffsNativos();
t("Buffs nativos mantem efeitos mecanicos", efeitosBuffs.length > 0, true);
t("efeitos nativos tem origem de Buff e nao disputam Funcionamento Basico",
  efeitosBuffs.every((e) => e.origem.startsWith("buff:") && !e.exclusivo), true);
t("nenhum addon instalado", base.addons ?? [], []);

// 2) Fora de combate, nada de Aliados/Comidas conta (bench zerado).
const foraDeCombate = deriveAfty(base);
const dentroSemNada = deriveAfty({ ...base, combate: { ativo: true } });
t("defesa igual fora e dentro sem escolher nada", dentroSemNada.defesa, foraDeCombate.defesa);

// 3) Protetor Mestre: +3 Defesa, +2 em TODOS os TRs.
const comProtetorMestre = deriveAfty({
  ...base, combate: { ativo: true, aliados_escolhidos: ["protetor"], aliados_protetor: "mestre" },
});
t("Protetor Mestre dá +3 de Defesa", comProtetorMestre.defesa - dentroSemNada.defesa, 3);
const resistenciaDe = (d, id) => d.testes.resistencias.find((r) => r.value === id)?.bonus;
t("Protetor Mestre dá +2 em TODOS os TRs (Reflexos)",
  resistenciaDe(comProtetorMestre, "reflexos") - resistenciaDe(dentroSemNada, "reflexos"), 2);
t("Protetor Mestre dá +2 em TODOS os TRs (Vontade)",
  resistenciaDe(comProtetorMestre, "vontade") - resistenciaDe(dentroSemNada, "vontade"), 2);

// 4) Combatente Mestre + Golpe da rodada: dado NOMEADO 3d12 na linha do
//    Ataque Básico (não mais a média 19,5 achatada em danoBonus).
const comCombatenteMestre = deriveAfty({
  ...base,
  combate: { ativo: true, aliados_escolhidos: ["combatente"], aliados_combatente: "mestre", aliados_golpe_combatente: true },
});
const basicoSem = dentroSemNada.dano.entradas.find((e) => e.nome === "Ataque Básico");
const basicoCom = comCombatenteMestre.dano.entradas.find((e) => e.nome === "Ataque Básico");
t("golpe do Combatente Mestre soma 3d12 no texto do Ataque Básico",
  basicoCom.texto, `${basicoSem.texto} + 3d12`);

// 5) Sem o toggle "golpe da rodada" ligado, o dado NÃO aparece mesmo com a
//    graduação escolhida (é "uma vez por rodada", não passivo).
const comCombatenteSemGolpe = deriveAfty({
  ...base, combate: { ativo: true, aliados_escolhidos: ["combatente"], aliados_combatente: "mestre" },
});
t("sem o toggle de golpe, nada muda no Ataque Básico",
  comCombatenteSemGolpe.dano.entradas.find((e) => e.nome === "Ataque Básico").texto, basicoSem.texto);

// 6) Assassino Iniciante e Veterano dão o MESMO 1d6 (sem empilhar errado);
//    Mestre dá 2d6.
const assIniciante = deriveAfty({
  ...base, combate: { ativo: true, aliados_escolhidos: ["assassino"], aliados_assassino: "iniciante", aliados_golpe_assassino: true },
}).dano.entradas.find((e) => e.nome === "Ataque Básico").texto;
const assMestre = deriveAfty({
  ...base, combate: { ativo: true, aliados_escolhidos: ["assassino"], aliados_assassino: "mestre", aliados_golpe_assassino: true },
}).dano.entradas.find((e) => e.nome === "Ataque Básico").texto;
t("Assassino Iniciante soma 1d6", assIniciante, `${basicoSem.texto} + 1d6`);
t("Assassino Mestre soma 2d6", assMestre, `${basicoSem.texto} + 2d6`);

// 7) Estados da Alma: os limites são frações do máximo da ficha, não
//    valores absolutos. Fora de combate a penalidade continua valendo.
const almaCheia = deriveAfty(base, { almaAtual: 100 });
const almaDanificada = deriveAfty(base, { almaAtual: 60 });
const almaInstavel = deriveAfty(base, { almaAtual: 40 });
const almaCritica = deriveAfty(base, { almaAtual: 10 });
const periciaDe = (d, id) => d.testes.pericias.find((p) => p.id === id)?.bonus;
const acertoDe = (d, id) => d.testes.ataques.find((a) => a.id === id)?.bonus;
t("Alma Danificada (<75%) penaliza -3 na Percepção",
  periciaDe(almaCheia, "percepcao") - periciaDe(almaDanificada, "percepcao"), 3);
t("Alma Instável (<50%) penaliza -6 na Percepção",
  periciaDe(almaCheia, "percepcao") - periciaDe(almaInstavel, "percepcao"), 6);
t("Alma Crítica (<25%) penaliza -8 na Percepção",
  periciaDe(almaCheia, "percepcao") - periciaDe(almaCritica, "percepcao"), 8);
t("Alma Crítica (<25%) penaliza -8 no Acerto Amaldiçoado",
  acertoDe(almaCheia, "amaldicoado") - acertoDe(almaCritica, "amaldicoado"), 8);
t("Fora de combate a Alma continua penalizando",
  deriveAfty({ ...base, combate: { ativo: false } }, { almaAtual: 10 }).testes.ataques.find((a) => a.id === "amaldicoado").bonus,
  almaCritica.testes.ataques.find((a) => a.id === "amaldicoado").bonus);

// Um Combatente 19 sem bônus de Constituição tem 120 PV e 120 de Alma.
// Os limites são 90, 60 e 30 pontos, com a penalidade só ABAIXO deles.
const playerAlmaBase = {
  ...base, rulesVersion: "player", system: "player",
  core: { ...base.core, nd: 19 },
  especializacoes: [{ id: "combatente", nivel: 19 }],
};
const playerAlmaCheia = deriveAfty(playerAlmaBase);
t("Player tem Alma máxima igual aos 120 PV", playerAlmaCheia.almaMax, 120);
const playerAlmaEm = (atual) => deriveAfty(playerAlmaBase, { almaAtual: atual });
for (const [atual, penalidade] of [
  [120, 0], [90, 0], [89, -3], [60, -3],
  [59, -6], [30, -6], [29, -8],
]) {
  t("Player com Alma " + atual + "/120 aplica " + penalidade + " na Percepção",
    periciaDe(playerAlmaEm(atual), "percepcao") - periciaDe(playerAlmaCheia, "percepcao"),
    penalidade);
}
const playerAlmaCritica = playerAlmaEm(29);
t("Player crítico também penaliza o TR",
  resistenciaDe(playerAlmaCritica, "reflexos") - resistenciaDe(playerAlmaCheia, "reflexos"), -8);
t("Player crítico também penaliza o Acerto",
  acertoDe(playerAlmaCritica, "amaldicoado") - acertoDe(playerAlmaCheia, "amaldicoado"), -8);
t("A fonte da penalidade continua no Motor",
  playerAlmaCritica.efeitos.detalhes.some((e) => e.nome === "Estados da Alma (automático)" && e.canal === "bonusPericia" && e.valor === -8),
  true);

// A criatura também pode ter máximo acima de 100. A régua é o máximo real.
const aftyAlmaMaior = { ...base, alma: { ...base.alma, max: 160 } };
const aftyAlmaCheia = deriveAfty(aftyAlmaMaior, { almaAtual: 160 });
t("Afty preserva o máximo de Alma 160", aftyAlmaCheia.almaMax, 160);
for (const [atual, penalidade] of [[120, 0], [119, -3], [79, -6], [39, -8]]) {
  t("Afty com Alma " + atual + "/160 aplica " + penalidade,
    periciaDe(deriveAfty(aftyAlmaMaior, { almaAtual: atual }), "percepcao")
      - periciaDe(aftyAlmaCheia, "percepcao"),
    penalidade);
}

// 8) Comidas, pelo texto das Ferramentas de Cozinheiro.
//    ⚠ LEVE E REVIGORANTE ESCALAM POR GRAU, e não por ponto de Maestria (autor,
//    2026-09-16: "meu colaborador programou errado"). Os graus vêm por Nível
//    (1 Quarto, 5 Terceiro, 9 Segundo, 13 Primeiro, 17+ Especial), e a Maestria
//    sobe nos mesmos níveis, então o controle `comidas_bt` segue sendo o único.
const comida = (refeicoes, bt, grau) => deriveAfty({
  ...base,
  combate: {
    ativo: true,
    comidas_refeicoes: refeicoes,
    ...(bt != null ? { comidas_bt: bt } : {}),
    ...(grau ? { comidas_grau: grau } : {}),
  },
});
const peDe = (d) => d.peTemporario.combate.reduce((s, x) => s + x.valor, 0);
t("Refeição Reforçada dá +2 de Defesa", comida(["reforcada"]).defesa - dentroSemNada.defesa, 2);
t("Refeição Picante dá +2 nas jogadas de ataque",
  acertoDe(comida(["picante"]), "amaldicoado") - acertoDe(dentroSemNada, "amaldicoado"), 2);

/* ⚠ O GRAU É CONTROLE PRÓPRIO desde 2026-09-17 (autor: *"informando o grau e
   BT indo ate 8, perceba que alguns se definem com grau outros com BT"*). São
   duas escadas do livro: a Leve e a Revigorante sobem por GRAU do cozinheiro,
   a Energética e a Nutritiva pelo BÔNUS DE TREINAMENTO dele. Com um controle
   só, uma das duas sempre saía errada. */
// [Grau escolhido, Leve em metros, Revigorante em PV]
for (const [grau, leve, pv] of [
  ["quarto", 3, 5], ["terceiro", 6, 10], ["segundo", 9, 15],
  ["primeiro", 12, 20], ["especial", 15, 25],
]) {
  t(`Leve no Grau ${grau} dá +${leve} m`,
    comida(["leve"], 0, grau).movimento - dentroSemNada.movimento, leve);
  t(`Revigorante no Grau ${grau} dá ${pv} PV temporários`,
    comida(["revigorante"], 0, grau).pvTemporario, pv);
}
/* O Grau escolhido MANDA sobre o derivado: com Bônus de Treinamento 8 o
   derivado daria Especial, e o Quarto escolhido continua valendo 3 m. */
t("o Grau escolhido vence o derivado do Bônus de Treinamento",
  comida(["leve"], 8, "quarto").movimento - dentroSemNada.movimento, 3);

/* O DERIVADO É RESERVA, para a sessão gravada entre 2026-09-16 e 2026-09-17,
   quando o Grau saía do Bônus de Treinamento, não perder o bônus ao abrir. */
for (const [bt, nivel, grau, leve, pv] of [
  [2, 1, "Quarto", 3, 5], [3, 5, "Terceiro", 6, 10], [4, 9, "Segundo", 9, 15],
  [5, 13, "Primeiro", 12, 20], [6, 17, "Especial", 15, 25], [8, 30, "Especial", 15, 25],
]) {
  t(`Maestria ${bt} (Nível ${nivel}) e o Grau ${grau}: a Maestria sobe no mesmo Nível`, maestria(nivel), bt);
  t(`sem Grau escolhido, a Maestria ${bt} ainda dá a Leve do ${grau} (+${leve} m)`,
    comida(["leve"], bt).movimento - dentroSemNada.movimento, leve);
  t(`sem Grau escolhido, a Maestria ${bt} ainda dá a Revigorante do ${grau} (${pv} PV)`,
    comida(["revigorante"], bt).pvTemporario, pv);
  t(`Energética com Bônus de Treinamento ${bt} dá ${bt} PE temporários`,
    peDe(comida(["energetica"], bt)), bt);
}
/* O teto do controle é 8 (autor, 2026-09-17), então pedir mais é aparado. */
t("o Bônus de Treinamento do cozinheiro para em 8", peDe(comida(["energetica"], 10)), 8);
t("Leve sem Grau nem Maestria não dá nada",
  comida(["leve"]).movimento - dentroSemNada.movimento, 0);
t("Revigorante sem Grau nem Maestria não dá nada",
  comida(["revigorante"]).pvTemporario, 0);

// 9) OS 3 NATIVOS SAÍRAM DO POOL `funcionamentoBasico` em 2026-09-13: uma
//    Técnica principal e o Aliado Protetor agora SOMAM na Defesa, em vez de
//    só o maior contar (que era o comportamento antigo do pool exclusivo).
const comTecnicaEDoisAliados = deriveAfty({
  ...base,
  core: { ...base.core, tecnicaEfeitos: [{ canal: "defesa", expr: "5" }] },
  combate: { ativo: true, aliados_escolhidos: ["protetor"], aliados_protetor: "mestre" },
});
t("Técnica (+5) e Aliado Protetor Mestre (+3) SOMAM na Defesa (8), não competem mais",
  comTecnicaEDoisAliados.defesa - dentroSemNada.defesa, 8);

/* ============================================================ */
/* 10. O LIMITE DE ALIADOS POR GRAU DE FEITICEIRO (2026-09-17)   */
/* ============================================================ */
/* Verbatim do livro: *"Personagens de Quarto Grau não podem ter aliados.
   Personagens de Terceiro e Segundo Grau podem ter um aliado. Personagens de
   Primeiro Grau podem ter dois aliados. Personagens de Grau Especial podem ter
   três aliados."* */
const comNd = (nd, combate = {}) => deriveAfty({
  ...base, core: { ...base.core, nd }, combate: { ativo: true, ...combate },
});
const seletorDe = (d) => d.combate.estadosExtras.find((e) => e.id === "aliados_escolhidos");
for (const [nd, grau, max] of [
  [1, "quarto", 0], [5, "terceiro", 1], [9, "segundo", 1],
  [13, "primeiro", 2], [17, "semiEspecial", 3], [21, "baixoEspecial", 3],
]) {
  const d = comNd(nd);
  t(`ND ${nd} é o grau ${grau}`, d.grauFeiticeiro.value, grau);
  t(`o ${grau} permite ${max} aliado(s)`, seletorDe(d)?.maxSelecionados ?? 0, max);
}
/* Quarto Grau não ganha nem o seletor: uma linha que só pode ficar vazia é
   ruído na bancada. */
t("o Quarto Grau não tem seletor de aliados", seletorDe(comNd(1)), undefined);
t("e nem as linhas de graduação",
  comNd(1).combate.estadosExtras.some((e) => e.id === "aliados_protetor"), false);

/* ⚠ O TETO É APARADO DE VERDADE, e não só sugerido na tela: escolher três num
   Terceiro Grau deixa um. Quem apara é o `resolveCombate`. */
t("o Terceiro Grau que escolhe três aliados fica com um",
  comNd(5, { aliados_escolhidos: ["protetor", "analista", "medico"] }).combate.aliados_escolhidos.length, 1);
t("o Primeiro Grau fica com dois",
  comNd(13, { aliados_escolhidos: ["protetor", "analista", "medico"] }).combate.aliados_escolhidos.length, 2);

/* ⚠ E O LIMITE MEXE NO NÚMERO, que é o que o torna real. A graduação continua
   gravada quando o aliado sai do seletor (para a linha poder ser limpa), então
   sem esta trava uma ficha com cinco graduações somaria as cinco. */
const protetorSemEscolher = deriveAfty({
  ...base, combate: { ativo: true, aliados_protetor: "mestre" },
});
t("a graduação sem o aliado escolhido NÃO dá bônus nenhum",
  protetorSemEscolher.defesa, dentroSemNada.defesa);

/* ============================================================ */
/* 11. ARMEIRO, Ferramentas de Ferreiro (2026-09-17)             */
/* ============================================================ */
/* Verbatim: *"Uma arma melhorada adiciona +2 em jogadas de ataque realizadas
   com ela; um escudo melhorado adiciona metade do bônus de treinamento do
   ferreiro na RD concedida enquanto empunhado."* */
const ferreiro = (melhorias, bt) => deriveAfty({
  ...base,
  combate: { ativo: true, armeiro_melhorias: melhorias, ...(bt != null ? { armeiro_bt: bt } : {}) },
});
t("arma melhorada dá +2 em jogadas de ataque",
  acertoDe(ferreiro(["arma"], 6), "amaldicoado") - acertoDe(dentroSemNada, "amaldicoado"), 2);
t("e o +2 da arma não depende do Bônus de Treinamento do ferreiro",
  acertoDe(ferreiro(["arma"]), "amaldicoado") - acertoDe(dentroSemNada, "amaldicoado"), 2);
for (const [bt, rd] of [[0, 0], [2, 1], [3, 1], [4, 2], [6, 3], [8, 4]]) {
  t(`escudo melhorado com Bônus de Treinamento ${bt} soma ${rd} de RD Geral`,
    ferreiro(["escudo"], bt).rdGeral - dentroSemNada.rdGeral, rd);
}
t("sem melhoria marcada, o ferreiro não muda nada",
  [ferreiro([], 8).rdGeral, acertoDe(ferreiro([], 8), "amaldicoado")],
  [dentroSemNada.rdGeral, acertoDe(dentroSemNada, "amaldicoado")]);
t("as duas melhorias juntas valem as duas",
  [
    ferreiro(["arma", "escudo"], 8).rdGeral - dentroSemNada.rdGeral,
    acertoDe(ferreiro(["arma", "escudo"], 8), "amaldicoado") - acertoDe(dentroSemNada, "amaldicoado"),
  ],
  [4, 2]);
/* Fora de combate a bancada zera, como todo estado dela. */
t("fora de combate o ferreiro não vale",
  deriveAfty({ ...base, combate: { ativo: false, armeiro_melhorias: ["escudo"], armeiro_bt: 8 } }).rdGeral,
  foraDeCombate.rdGeral);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
