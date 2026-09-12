import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty, funcionamentosDaFicha } = await import(R + "afty-schema.js");
const { funcionamentosComNativos } = await import(R + "afty-extras-nativos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

const base = createBlankAfty();

// 1) `funcionamentosDaFicha` crua (afty-schema.js) continua sem os nativos —
//    ela é FOLHA travada por t-ordem-modulos.mjs (zero imports). Só o
//    wrapper `funcionamentosComNativos` (afty-extras-nativos.js) os inclui.
t("funcionamentosDaFicha crua NÃO leva os nativos (afty-schema.js é folha)",
  funcionamentosDaFicha(base).some((f) => f.nativo), false);
const lista = funcionamentosComNativos(base);
t("aliados/alma/comidas aparecem sem addon, via funcionamentosComNativos",
  lista.filter((f) => f.nativo).map((f) => f.id).sort(),
  ["aliados_bancada", "alma_estados_automatico", "comidas_bancada"]);
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

// 7) Estados da Alma: penalidade automática por alma_atual, SEM precisar
//    ligar nenhum estado de combate (nem "Em Combate").
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
t("Fora de combate a Alma continua penalizando (não depende de 'Em Combate')",
  deriveAfty({ ...base, combate: { ativo: false } }, { almaAtual: 10 }).testes.ataques.find((a) => a.id === "amaldicoado").bonus,
  almaCritica.testes.ataques.find((a) => a.id === "amaldicoado").bonus);

// 8) Comidas: Reforçada +2 Defesa, Revigorante escala com o Grau.
const comComidaReforcada = deriveAfty({
  ...base, combate: { ativo: true, comidas_refeicoes: ["reforcada"] },
});
t("Refeição Reforçada dá +2 de Defesa", comComidaReforcada.defesa - dentroSemNada.defesa, 2);
const comRevigoranteQuarto = deriveAfty({
  ...base, combate: { ativo: true, comidas_refeicoes: ["revigorante"], comidas_grau: "quarto" },
}).pvTemporario ?? null;

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
console.log("pvTemporario (Revigorante, grau 4º):", comRevigoranteQuarto);
process.exitCode = bad.length ? 1 : 0;
