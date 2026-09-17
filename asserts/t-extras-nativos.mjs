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
const recursosEsperados = ["aliados_bancada", "alma_estados_automatico", "comidas_bancada"];
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
  ...base, combate: { ativo: true, aliados_protetor: "mestre" },
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
  combate: { ativo: true, aliados_combatente: "mestre", aliados_golpe_combatente: true },
});
const basicoSem = dentroSemNada.dano.entradas.find((e) => e.nome === "Ataque Básico");
const basicoCom = comCombatenteMestre.dano.entradas.find((e) => e.nome === "Ataque Básico");
t("golpe do Combatente Mestre soma 3d12 no texto do Ataque Básico",
  basicoCom.texto, `${basicoSem.texto} + 3d12`);

// 5) Sem o toggle "golpe da rodada" ligado, o dado NÃO aparece mesmo com a
//    graduação escolhida (é "uma vez por rodada", não passivo).
const comCombatenteSemGolpe = deriveAfty({
  ...base, combate: { ativo: true, aliados_combatente: "mestre" },
});
t("sem o toggle de golpe, nada muda no Ataque Básico",
  comCombatenteSemGolpe.dano.entradas.find((e) => e.nome === "Ataque Básico").texto, basicoSem.texto);

// 6) Assassino Iniciante e Veterano dão o MESMO 1d6 (sem empilhar errado);
//    Mestre dá 2d6.
const assIniciante = deriveAfty({
  ...base, combate: { ativo: true, aliados_assassino: "iniciante", aliados_golpe_assassino: true },
}).dano.entradas.find((e) => e.nome === "Ataque Básico").texto;
const assMestre = deriveAfty({
  ...base, combate: { ativo: true, aliados_assassino: "mestre", aliados_golpe_assassino: true },
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
const comida = (refeicoes, bt) => deriveAfty({
  ...base, combate: { ativo: true, comidas_refeicoes: refeicoes, ...(bt != null ? { comidas_bt: bt } : {}) },
});
t("Refeição Reforçada dá +2 de Defesa", comida(["reforcada"]).defesa - dentroSemNada.defesa, 2);
t("Refeição Picante dá +2 nas jogadas de ataque",
  acertoDe(comida(["picante"]), "amaldicoado") - acertoDe(dentroSemNada, "amaldicoado"), 2);
// [Maestria do cozinheiro, Nível de exemplo, Grau, Leve, Revigorante]
for (const [bt, nivel, grau, leve, pv] of [
  [2, 1, "Quarto", 3, 5], [3, 5, "Terceiro", 6, 10], [4, 9, "Segundo", 9, 15],
  [5, 13, "Primeiro", 12, 20], [6, 17, "Especial", 15, 25], [8, 30, "Especial", 15, 25],
  [10, 36, "Especial", 15, 25],
]) {
  t(`Maestria ${bt} (Nível ${nivel}) e o Grau ${grau}: a Maestria sobe no mesmo Nível`, maestria(nivel), bt);
  t(`Leve no Grau ${grau} (Maestria ${bt}) dá +${leve} m`,
    comida(["leve"], bt).movimento - dentroSemNada.movimento, leve);
  t(`Revigorante no Grau ${grau} (Maestria ${bt}) dá ${pv} PV temporários`,
    comida(["revigorante"], bt).pvTemporario, pv);
  t(`Energética com Maestria ${bt} dá ${bt} PE temporários`,
    comida(["energetica"], bt).peTemporario.combate.reduce((s, x) => s + x.valor, 0), bt);
}
t("Leve sem a Maestria do cozinheiro preenchida não dá nada",
  comida(["leve"]).movimento - dentroSemNada.movimento, 0);
t("Revigorante sem a Maestria do cozinheiro preenchida não dá nada",
  comida(["revigorante"]).pvTemporario, 0);

// 9) OS 3 NATIVOS SAÍRAM DO POOL `funcionamentoBasico` em 2026-09-13: uma
//    Técnica principal e o Aliado Protetor agora SOMAM na Defesa, em vez de
//    só o maior contar (que era o comportamento antigo do pool exclusivo).
const comTecnicaEDoisAliados = deriveAfty({
  ...base,
  core: { ...base.core, tecnicaEfeitos: [{ canal: "defesa", expr: "5" }] },
  combate: { ativo: true, aliados_protetor: "mestre" },
});
t("Técnica (+5) e Aliado Protetor Mestre (+3) SOMAM na Defesa (8), não competem mais",
  comTecnicaEDoisAliados.defesa - dentroSemNada.defesa, 8);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
