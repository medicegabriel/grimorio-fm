/**
 * BALANCEADA E MARCIAL SÓ NAS QUATRO MANOBRAS, 2026-09-29
 *
 * Os dois encantamentos escreviam `bonusManobra` sem alvo. Desde que o card virou
 * "Outros" (2026-09-15) o sem alvo vale para oito linhas, e os dois passaram a dar
 * +2 em Concentração, Fintar, Provocar e até no Teste de Morte, que é d20 puro.
 *
 * Decisões do autor na mesma conversa:
 *   - vale nos dois sistemas;
 *   - duas armas Balanceadas empunhadas dão +2, e não +4;
 *   - "testes de manobras" da Balanceada pega executar E resistir. O Marcial diz
 *     "para realizar manobras" e fica só no executar.
 *
 * O alvo novo é `manobra:todas`, escopo que só as quatro Manobras atendem.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const P = await import(R + "afty-pericias.js");
const E = await import(R + "afty-equipamentos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const QUATRO = ["agarrar", "derrubar", "desarmar", "empurrar"];
const NOMEADOS = ["concentracao", "fintar", "provocar", "morte"];

const ficha = (itens = [], extra = {}) => {
  const f = createBlankAfty();
  f.core.nd = 10;
  f.core.tipo = "combatente";
  f.core.patamar = "comum";
  f.especializacoes = [{ id: "combatente", nivel: 10 }];
  f.attrMethod = "fixos";
  f.attributes = { forca: 14, destreza: 14, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 };
  f.equipamentos = { itens };
  return { ...f, ...extra };
};
let seq = 0;
const arma = (refId, encantamentos, extra = {}) => ({
  uid: `a${++seq}`, tipo: "arma", refId, qtd: 1, equipado: true,
  ...(encantamentos ? { fa: { grau: "primeiro", encantamentos } } : {}), ...extra,
});
const uniforme = (encantamentos) => ({
  uid: `u${++seq}`, tipo: "uniforme", refId: "unif_comum", qtd: 1, equipado: true,
  fa: { grau: "primeiro", encantamentos },
});
const linhas = (f) => Object.fromEntries(deriveAfty(f).testes.manobras.map((m) => [m.id, m]));
/* Quanto cada linha mudou contra a mesma ficha sem o item, nos dois lados. */
const delta = (com, sem, lado) => Object.fromEntries(
  Object.keys(sem).map((id) => [id, (com[id][lado] ?? 0) - (sem[id][lado] ?? 0)]),
);
const so = (ids, valor) => Object.fromEntries(
  [...QUATRO, ...NOMEADOS].map((id) => [id, ids.includes(id) ? valor : 0]),
);

t("o alvo é o do catálogo de perícias", P.ALVO_QUATRO_MANOBRAS, "manobra:todas");
t("a Balanceada não acumula", E.getEncantamento("enc_arma_balanceada").naoAcumula, true);
t("a Canalizadora não acumula", E.getEncantamento("enc_arma_canalizadora").naoAcumula, true);
t("a Otimizada não acumula", E.getEncantamento("enc_arma_otimizada").naoAcumula, true);

for (const sistema of ["afty", "player"]) {
  const tag = `[${sistema}]`;
  const f = (itens, extra = {}) => ficha(itens, { rulesVersion: sistema, ...extra });
  const nu = linhas(f([arma("arm_espada_curta", [])]));

  /* ============================================================ */
  /* 1. BALANCEADA                                                 */
  /* ============================================================ */
  const bal = linhas(f([arma("arm_espada_curta", ["enc_arma_balanceada"])]));
  t(`${tag} Balanceada: +2 ao executar, só nas quatro`, delta(bal, nu, "executar"), so(QUATRO, 2));
  t(`${tag} Balanceada: +2 ao resistir, só nas quatro`, delta(bal, nu, "resistir"), so(QUATRO, 2));
  t(`${tag} Balanceada: o hover diz de onde veio`,
    bal.agarrar.partesExecutar.map((p) => p.label).slice(1), ["Espada Curta (Balanceada)"]);
  t(`${tag} Balanceada: o Teste de Morte segue d20 puro`, bal.morte.partesExecutar, []);

  const guardada = linhas(f([arma("arm_espada_curta", ["enc_arma_balanceada"], { equipado: false })]));
  t(`${tag} Balanceada guardada não dá nada`, delta(guardada, nu, "executar"), so([], 0));

  const duas = linhas(f([
    arma("arm_espada_curta", ["enc_arma_balanceada"]),
    arma("arm_adaga", ["enc_arma_balanceada"]),
  ]));
  t(`${tag} duas armas Balanceadas dão +2, e não +4`, delta(duas, nu, "executar"), so(QUATRO, 2));
  t(`${tag} duas Balanceadas: +2 ao resistir também`, delta(duas, nu, "resistir"), so(QUATRO, 2));
  t(`${tag} duas Balanceadas: uma parcela só no hover`,
    duas.empurrar.partesExecutar.length - nu.empurrar.partesExecutar.length, 1);

  /* O Manejo Especial concede a propriedade a toda arma empunhada. Comprada numa
     e concedida noutra, continua sendo UMA Balanceada. */
  const manejo = {
    habilidades: ["cmb_manejo_especial"],
    escolhasHabilidade: { cmb_manejo_especial: ["me_enc_arma_balanceada"] },
  };
  const soManejo = linhas(f([arma("arm_espada_curta", null), arma("arm_adaga", null)], manejo));
  t(`${tag} Manejo Especial com Balanceada: +2 nas quatro`, delta(soManejo, nu, "executar"), so(QUATRO, 2));
  const mista = linhas(f([arma("arm_espada_curta", ["enc_arma_balanceada"]), arma("arm_adaga", null)], manejo));
  t(`${tag} comprada numa e concedida noutra: +2`, delta(mista, nu, "executar"), so(QUATRO, 2));
  t(`${tag} comprada numa e concedida noutra: +2 ao resistir`, delta(mista, nu, "resistir"), so(QUATRO, 2));

  /* Canalizadora e Otimizada seguem a Balanceada nos dois sistemas
     (autor, 2026-10-03): o bônus do portador entra uma vez só. */
  for (const [id, stat, nome] of [
    ["enc_arma_canalizadora", "cd", "Canalizadora"],
    ["enc_arma_otimizada", "iniciativa", "Otimizada"],
  ]) {
    const sem = deriveAfty(f([arma("arm_espada_curta", []), arma("arm_adaga", [])]));
    const duasEncantadas = deriveAfty(f([
      arma("arm_espada_curta", [id]), arma("arm_adaga", [id]),
    ]));
    t(`${tag} duas armas com ${nome}: +2, e não +4`, duasEncantadas[stat] - sem[stat], 2);
    t(`${tag} duas armas com ${nome}: uma fonte no hover`,
      duasEncantadas.partes[stat].filter((p) => p.label.includes(`(${nome})`)).map((p) => p.valor), [2]);
    const compradaEConcedida = deriveAfty(f([
      arma("arm_espada_curta", [id]), arma("arm_adaga", null),
    ], {
      habilidades: ["cmb_manejo_especial"],
      escolhasHabilidade: { cmb_manejo_especial: [`me_${id}`] },
    }));
    t(`${tag} ${nome} comprada e concedida pelo Manejo Especial: +2`,
      compradaEConcedida[stat] - sem[stat], 2);
  }

  /* ============================================================ */
  /* 2. MARCIAL                                                    */
  /* ============================================================ */
  const semUnif = linhas(f([uniforme([])]));
  const marcial = linhas(f([uniforme(["enc_unif_marcial"])]));
  t(`${tag} Marcial: +2 ao executar, só nas quatro`, delta(marcial, semUnif, "executar"), so(QUATRO, 2));
  t(`${tag} Marcial: "para realizar" não mexe no resistir`, delta(marcial, semUnif, "resistir"), so([], 0));

  /* Os dois somam: são encantamentos diferentes, em itens diferentes. */
  const juntos = linhas(f([arma("arm_espada_curta", ["enc_arma_balanceada"]), uniforme(["enc_unif_marcial"])]));
  t(`${tag} Balanceada e Marcial somam`, delta(juntos, nu, "executar"), so(QUATRO, 4));

  /* ============================================================ */
  /* 3. O ALVO ESCRITO À MÃO                                       */
  /* ============================================================ */
  const comMotor = (efeitos) => linhas(f([arma("arm_espada_curta", [])], {
    core: { ...ficha().core, tecnicaEfeitos: efeitos },
  }));
  const quatro = comMotor([
    { canal: "bonusManobra", alvo: P.ALVO_QUATRO_MANOBRAS, expr: "3" },
    { canal: "resistirManobra", alvo: P.ALVO_QUATRO_MANOBRAS, expr: "1" },
  ]);
  t(`${tag} manobra:todas escrito no Motor: executar`, delta(quatro, nu, "executar"), so(QUATRO, 3));
  t(`${tag} manobra:todas escrito no Motor: resistir`, delta(quatro, nu, "resistir"), so(QUATRO, 1));
  /* O sem alvo continua valendo para as oito linhas: é o que o canal promete. */
  const todos = comMotor([{ canal: "bonusManobra", expr: "3" }]);
  t(`${tag} sem alvo continua pegando as oito`, delta(todos, nu, "executar"), so([...QUATRO, ...NOMEADOS], 3));
  /* E o alvo pontual soma com o das quatro, como o Ofício mirado soma com o de todos. */
  const pontual = comMotor([
    { canal: "bonusManobra", alvo: "desarmar", expr: "1" },
    { canal: "bonusManobra", alvo: P.ALVO_QUATRO_MANOBRAS, expr: "3" },
  ]);
  t(`${tag} Desarmar mirado soma com o das quatro`, pontual.desarmar.executar - nu.desarmar.executar, 4);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
