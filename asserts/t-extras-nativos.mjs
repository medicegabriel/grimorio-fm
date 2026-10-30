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
/* ⚠ A MELHORIA É DO ITEM (2026-10-26): a arma melhorada é `acertoArma` com o
   escopo `arma`, e o escudo melhorado é `rdEscudo`. A versão de 2026-09-17 somava
   +2 em `bonusAcerto` (vazava para o Feitiço) e a metade do BT em `rdGeral` (RD
   Geral até no jogador, e até sem escudo na mão). */
const itemNaMao = (tipo, refId) => ({
  equipamentos: { ...base.equipamentos, itens: [{ uid: "i-" + refId, tipo, refId, qtd: 1, equipado: true, fa: { grau: "quarto", encantamentos: [] } }] },
});
const comEscudo = itemNaMao("escudo", "esc_medio");
const comArma = itemNaMao("arma", "arm_espada_curta");
const ferreiro = (melhorias, bt, extra = {}) => deriveAfty({
  ...base, ...extra,
  combate: { ativo: true, armeiro_melhorias: melhorias, ...(bt != null ? { armeiro_bt: bt } : {}) },
});
const semFerreiro = (extra = {}) => deriveAfty({ ...base, ...extra, combate: { ativo: true } });
const linhaDe = (d, nome) => d.dano.entradas.find((e) => e.nome === nome);
t("arma melhorada soma +2 no acerto da linha da arma",
  linhaDe(ferreiro(["arma"], 6, comArma), "Espada Curta").acerto - linhaDe(semFerreiro(comArma), "Espada Curta").acerto, 2);
t("e o +2 da arma não depende do Bônus de Treinamento do ferreiro",
  linhaDe(ferreiro(["arma"], null, comArma), "Espada Curta").acerto - linhaDe(semFerreiro(comArma), "Espada Curta").acerto, 2);
t("o +2 da arma não entra no Ataque Básico",
  linhaDe(ferreiro(["arma"], 6, comArma), "Ataque Básico").acerto, linhaDe(semFerreiro(comArma), "Ataque Básico").acerto);
t("o +2 da arma não entra no Acerto Amaldiçoado, o do Feitiço",
  acertoDe(ferreiro(["arma"], 6, comArma), "amaldicoado"), acertoDe(semFerreiro(comArma), "amaldicoado"));
t("nem nas jogadas de ataque de corpo a corpo e a distância",
  [acertoDe(ferreiro(["arma"], 6, comArma), "corpo"), acertoDe(ferreiro(["arma"], 6, comArma), "distancia")],
  [acertoDe(semFerreiro(comArma), "corpo"), acertoDe(semFerreiro(comArma), "distancia")]);
for (const [bt, rd] of [[0, 0], [2, 1], [3, 1], [4, 2], [6, 3], [8, 4]]) {
  t(`escudo melhorado com Bônus de Treinamento ${bt} soma ${rd} na RD do escudo (RD Geral na criatura)`,
    ferreiro(["escudo"], bt, comEscudo).rdGeral - semFerreiro(comEscudo).rdGeral, rd);
}
t("sem escudo na mão, o escudo melhorado não soma RD nenhuma",
  [ferreiro(["escudo"], 8).rdGeral, ferreiro(["escudo"], 8).rdFisico],
  [dentroSemNada.rdGeral, dentroSemNada.rdFisico]);
const comoJogador = (extra = {}) => ({ ...extra, rulesVersion: "player", system: "player" });
t("no jogador a melhoria do escudo soma em RD Física, que é onde a RD do escudo mora",
  [
    ferreiro(["escudo"], 6, comoJogador(comEscudo)).rdFisico - semFerreiro(comoJogador(comEscudo)).rdFisico,
    ferreiro(["escudo"], 6, comoJogador(comEscudo)).rdGeral - semFerreiro(comoJogador(comEscudo)).rdGeral,
  ],
  [3, 0]);
t("no jogador, sem escudo na mão, a melhoria não soma nada",
  ferreiro(["escudo"], 8, comoJogador()).rdFisico, semFerreiro(comoJogador()).rdFisico);
t("sem melhoria marcada, o ferreiro não muda nada",
  [ferreiro([], 8, { ...comEscudo, ...comArma }).rdGeral, linhaDe(ferreiro([], 8, comArma), "Espada Curta").acerto],
  [semFerreiro({ ...comEscudo, ...comArma }).rdGeral, linhaDe(semFerreiro(comArma), "Espada Curta").acerto]);
const armaEEscudo = { equipamentos: { ...base.equipamentos, itens: [...comArma.equipamentos.itens, ...comEscudo.equipamentos.itens] } };
t("as duas melhorias juntas valem as duas",
  [
    ferreiro(["arma", "escudo"], 8, armaEEscudo).rdGeral - semFerreiro(armaEEscudo).rdGeral,
    linhaDe(ferreiro(["arma", "escudo"], 8, armaEEscudo), "Espada Curta").acerto - linhaDe(semFerreiro(armaEEscudo), "Espada Curta").acerto,
  ],
  [4, 2]);
/* Fora de combate a bancada zera, como todo estado dela. */
t("fora de combate o ferreiro não vale",
  deriveAfty({ ...base, ...comEscudo, combate: { ativo: false, armeiro_melhorias: ["escudo"], armeiro_bt: 8 } }).rdGeral,
  deriveAfty({ ...base, ...comEscudo }).rdGeral);

/* ============================================================ */
/* 12. AUXILIAR: o teto de perícias segue a graduação (2026-10-26) */
/* ============================================================ */
/* Verbatim: *"Estar acompanhado por um auxiliar o permite adicionar +2 em duas
   perícias quaisquer. Um veterano permite adicionar +2 em três perícias
   quaisquer. Um mestre permite adicionar +2 em quatro perícias."* Antes o motor
   aceitava as quatro em qualquer graduação. */
const quatroPericias = ["acrobacia", "atletismo", "furtividade", "percepcao"];
const auxiliar = (graduacao, pericias) => deriveAfty({
  ...base,
  combate: { ativo: true, aliados_escolhidos: ["auxiliar"], aliados_auxiliar: graduacao, aliados_auxiliar_pericias: pericias },
});
const quaisSobem = (d) => periciasQueSobem(dentroSemNada, d);
function periciasQueSobem(antes, depois) {
  return depois.testes.pericias
    .filter((p) => p.bonus !== periciaDe(antes, p.id))
    .map((p) => `${p.id}+${p.bonus - periciaDe(antes, p.id)}`);
}
t("Auxiliar Iniciante com quatro marcadas só reforça as duas primeiras",
  quaisSobem(auxiliar("iniciante", quatroPericias)), ["acrobacia+2", "atletismo+2"]);
t("Auxiliar Veterano reforça três", quaisSobem(auxiliar("veterano", quatroPericias)).length, 3);
t("Auxiliar Mestre reforça quatro", quaisSobem(auxiliar("mestre", quatroPericias)).length, 4);
t("o teto chega à tela: o seletor das perícias declara 2, 3 e 4",
  ["iniciante", "veterano", "mestre"].map((g) => auxiliar(g, []).combate.estadosExtras
    .find((e) => e.id === "aliados_auxiliar_pericias").maxSelecionados),
  [2, 3, 4]);
t("sem graduação o Auxiliar não reforça perícia nenhuma",
  quaisSobem(auxiliar(null, quatroPericias)), []);
t("fora de combate o teto também chega à tela",
  deriveAfty({ ...base, combate: { ativo: false, aliados_auxiliar: "veterano" } }).combate.estadosExtras
    .find((e) => e.id === "aliados_auxiliar_pericias").maxSelecionados, 3);

/* ============================================================ */
/* 13. GOLPE DA RODADA: o dado entra na linha que o livro cita    */
/* ============================================================ */
/* Combatente: *"um ataque corpo-a-corpo"*. Disparador: *"um ataque a
   distância"*. O Elementalista cita Feitiço e técnica marcial e fica em todas as
   linhas até a linha de Feitiço ler `dadosNomeados` (ver docs/a-fazer.md). */
const duasArmas = { equipamentos: { ...base.equipamentos, itens: [
  { uid: "c", tipo: "arma", refId: "arm_espada_curta", qtd: 1, equipado: true, fa: { grau: "quarto", encantamentos: [] } },
  { uid: "d", tipo: "arma", refId: "arm_arco_curto", qtd: 1, equipado: true, fa: { grau: "quarto", encantamentos: [] } },
] } };
const golpe = (tipo, graduacao) => deriveAfty({
  ...base, ...duasArmas,
  combate: { ativo: true, aliados_escolhidos: [tipo], [`aliados_${tipo}`]: graduacao, [`aliados_golpe_${tipo}`]: true },
});
const textoDe = (d, nome) => linhaDe(d, nome).texto;
const semGolpe = deriveAfty({ ...base, ...duasArmas, combate: { ativo: true } });
const combatente = golpe("combatente", "mestre");
t("o Combatente soma 3d12 na espada e no Ataque Básico, que são corpo a corpo",
  [textoDe(combatente, "Espada Curta"), textoDe(combatente, "Ataque Básico")],
  [`${textoDe(semGolpe, "Espada Curta")} + 3d12`, `${textoDe(semGolpe, "Ataque Básico")} + 3d12`]);
t("e não soma no arco, que é a distância", textoDe(combatente, "Arco Curto"), textoDe(semGolpe, "Arco Curto"));
const disparador = golpe("disparador", "veterano");
t("o Disparador soma 2d10 no arco", textoDe(disparador, "Arco Curto"), `${textoDe(semGolpe, "Arco Curto")} + 2d10`);
t("e não soma na espada nem no Ataque Básico",
  [textoDe(disparador, "Espada Curta"), textoDe(disparador, "Ataque Básico")],
  [textoDe(semGolpe, "Espada Curta"), textoDe(semGolpe, "Ataque Básico")]);
t("o hover da espada lista a fonte do Combatente e o do arco não",
  [
    linhaDe(combatente, "Espada Curta").partes.some((p) => p.texto === "3d12"),
    linhaDe(combatente, "Arco Curto").partes.some((p) => p.texto === "3d12"),
  ],
  [true, false]);
/* ⚠ O ELEMENTALISTA SAIU DAS LINHAS DE ARMA (autor, 2026-10-26): o livro cita um
   Feitiço ou técnica marcial, não a arma, e o dado entra só no PRIMEIRO ataque
   dessas duas coisas (medido em t-tecnicas-marciais.mjs, bloco 10). */
const elementalista = golpe("elementalista", "mestre");
t("o Elementalista não soma em linha de arma nenhuma",
  [textoDe(elementalista, "Espada Curta"), textoDe(elementalista, "Arco Curto"), textoDe(elementalista, "Ataque Básico")],
  [textoDe(semGolpe, "Espada Curta"), textoDe(semGolpe, "Arco Curto"), textoDe(semGolpe, "Ataque Básico")]);
t("e o hover da espada não lista o dado dele",
  linhaDe(elementalista, "Espada Curta").partes.some((p) => p.texto === "5d12"), false);

/* ============================================================ */
/* 14. REVIGORANTE: o PV Temporário entra na tabela de concessões   */
/* ============================================================ */
/* Antes a origem `buff:comidas_bancada` não estava em `PV_TEMP`, e a Ficha a
   tratava como "Regra de concessão não revisada", sem dono, então nenhum cartão
   a mostrava nem oferecia Registrar na Vida. */
const { beneficiosPvTemp, pvDoAtivo, donoPvDoGrupo } = await import(R + "ficha/efeitos/efeitos-dados.js");
const comRevigorante = deriveAfty({
  ...base, core: { ...base.core, nd: 13 },
  combate: { ativo: true, comidas_refeicoes: ["revigorante"], comidas_grau: "primeiro" },
});
const pvDaRefeicao = [...beneficiosPvTemp({
  derived: comRevigorante, sessao: { combate: {}, pvTempFontes: {}, rodada: 1 }, mesa: { pvConcessoes: {} },
}).values()];
t("a Revigorante concede 20 PV temporários no Primeiro Grau", pvDaRefeicao.map((b) => b.concede), [20]);
t("a concessão é por uso, tem regra revisada e pode ser registrada na Vida",
  pvDaRefeicao.map((b) => [b.regra, b.naoRevisada, b.podeRegistrar]), [["uso", false, true]]);
const grupoDasComidas = { item: null, raiz: { id: "comidas_refeicoes" } };
t("o dono do benefício é o estado raiz do grupo das Comidas, que não tem item",
  [donoPvDoGrupo(grupoDasComidas), pvDaRefeicao[0].dono], ["comidas_refeicoes", "comidas_refeicoes"]);
t("o cartão do grupo das Comidas encontra o benefício, e o de outro grupo não",
  [
    !!pvDoAtivo({ grupo: grupoDasComidas }, new Map(pvDaRefeicao.map((b) => [b.beneficio, b]))),
    !!pvDoAtivo({ grupo: { item: null, raiz: { id: "sintonizada" } } }, new Map(pvDaRefeicao.map((b) => [b.beneficio, b]))),
  ],
  [true, false]);
t("o item de repertório continua mandando quando existe",
  donoPvDoGrupo({ item: { id: "cmb_espirito_de_luta" }, raiz: { id: "x" } }), "cmb_espirito_de_luta");

/* ============================================================ */
/* 15. A ABA DESENHA OS TRÊS NÍVEIS DOS ALIADOS (2026-10-26)       */
/* ============================================================ */
/* O Aliado é seletor, graduação e Golpe da rodada (ou as perícias do Auxiliar).
   O `organizaEstados` só dava à raiz os filhos DIRETOS, então os cinco estados
   do terceiro nível nunca chegavam à tela: não havia como ligar o Golpe da
   rodada do Combatente, nem marcar as perícias do Auxiliar. */
const { organizaEstados } = await import(R + "ficha/ficha-estados.js");
const extrasDoPrimeiroGrau = comNd(13).combate.estadosExtras;
const grupoDosAliados = (termo = "") => organizaEstados(extrasDoPrimeiroGrau, termo)
  .blocosDaSub.outros.flatMap((b) => b.grupos).find((g) => g.pai.id === "aliados_escolhidos");
t("a raiz dos Aliados leva as oito graduações e os cinco estados do terceiro nível, em profundidade",
  grupoDosAliados().filhos.map((f) => f.id),
  ["aliados_analista", "aliados_protetor", "aliados_assassino", "aliados_golpe_assassino",
    "aliados_combatente", "aliados_golpe_combatente", "aliados_disparador", "aliados_golpe_disparador",
    "aliados_elementalista", "aliados_golpe_elementalista", "aliados_auxiliar", "aliados_auxiliar_pericias",
    "aliados_medico"]);
t("procurar \"golpe da rodada\" traz as graduações e o seletor, e só os golpes que casam",
  grupoDosAliados("golpe da rodada").filhos.map((f) => f.id),
  ["aliados_assassino", "aliados_golpe_assassino", "aliados_combatente", "aliados_golpe_combatente",
    "aliados_disparador", "aliados_golpe_disparador", "aliados_elementalista", "aliados_golpe_elementalista"]);
t("procurar \"perícias\" traz só o Auxiliar e as perícias dele",
  grupoDosAliados("perícias").filhos.map((f) => f.id), ["aliados_auxiliar", "aliados_auxiliar_pericias"]);
t("procurar \"combatente\" não puxa os irmãos de outro tipo de aliado",
  grupoDosAliados("combatente").filhos.map((f) => f.id), ["aliados_combatente", "aliados_golpe_combatente"]);
t("os estados de dois níveis continuam com a cadeia curta (Comidas)",
  organizaEstados(extrasDoPrimeiroGrau, "").blocosDaSub.interludio.flatMap((b) => b.grupos)
    .find((g) => g.pai.id === "comidas_refeicoes").filhos.map((f) => f.id),
  ["comidas_grau", "comidas_bt"]);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
