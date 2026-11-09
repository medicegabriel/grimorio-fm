/* CX6: OS PODERES DO CONTROLADOR QUE DEPENDEM DE POSIÇÃO. A posição é declarada pela mesa num contador da bancada
   (autor, 2026-11-06). Guarda Viva (Livro p.97), Rede de Detecção e Combate em Alcateia (p.99) leem o contador pelo Motor.
   Camuflagem Aprimorada, Táticas de Alcateia e Flanco Avançado mexem no inimigo e seguem como texto de mesa. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const POS = await import(R + "afty-controlador-posicao.js");
aplicarAddons([]);

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

const CTR = (nivel) => [{ id: "controlador", nivel }];
const ficha = (nivel, habilidades, combate = {}) => {
  const c = createBlankAfty();
  c.core.nivel = nivel;
  c.core.nd = nivel;
  c.attributes = { forca: 10, destreza: 10, constituicao: 12, inteligencia: 12, sabedoria: 14, presenca: 18 };
  c.especializacoes = CTR(nivel);
  c.habilidades = habilidades;
  c.equipamentos = { itens: [{ id: "e0", tipo: "arma", refId: "arm_adaga", qtd: 1, equipado: true }] };
  c.tecnicasCombate = { armas: ["arm_adaga"], atributo: "presenca" };
  c.combate = { ativo: true, ...combate };
  return c;
};
const base = ["ctr_treinamento_em_controle"];

/* ---------- O CONTADOR EXISTE SÓ PARA QUEM TEM O PODER ---------- */
const { COMBATE_ESTADOS } = await import(R + "afty-combate.js");
const estadoDe = (id) => COMBATE_ESTADOS.find((e) => e.id === id);
t("o contador a 3 m é uma faixa de Guarda Viva e Rede de Detecção", [estadoDe("invocacoes_a_3m")?.tipo, estadoDe("invocacoes_a_3m")?.requerHabilidade], ["faixa", ["ctr_guarda_viva", "ctr_rede_de_deteccao"]]);
t("o contador do alcance é uma faixa de Combate em Alcateia", [estadoDe("invocacoes_no_alcance")?.tipo, estadoDe("invocacoes_no_alcance")?.requerHabilidade], ["faixa", "ctr_combate_em_alcateia"]);
const guarda = deriveAfty(ficha(8, [...base, "ctr_guarda_viva"], { invocacoes_a_3m: 2 }));
t("o valor declarado chega à bancada resolvida", guarda.combate.invocacoes_a_3m, 2);
const acima = deriveAfty(ficha(8, [...base, "ctr_guarda_viva"], { invocacoes_a_3m: 9 }));
t("o contador para no limite em campo (2 com Treinamento em Controle)", acima.combate.invocacoes_a_3m, 2);
t("o roster confirma o limite em campo", acima.invocacoes.controle.limiteCampo, 2);

/* ---------- GUARDA VIVA: +1 de Defesa por invocação a 3 m ---------- */
const d0 = deriveAfty(ficha(8, [...base, "ctr_guarda_viva"], { invocacoes_a_3m: 0 }));
const d2 = deriveAfty(ficha(8, [...base, "ctr_guarda_viva"], { invocacoes_a_3m: 2 }));
t("Guarda Viva: duas invocações somam 2 de Defesa", d2.defesa - d0.defesa, 2);
const fora = deriveAfty({ ...ficha(8, [...base, "ctr_guarda_viva"], { invocacoes_a_3m: 2 }), combate: { ativo: false, invocacoes_a_3m: 2 } });
t("fora de Em Combate o contador não vale", fora.defesa, d0.defesa);
const semHab = deriveAfty(ficha(8, base, { invocacoes_a_3m: 2 }));
t("sem a habilidade o valor gravado não vale", semHab.defesa, d0.defesa);

/* O teto é o limite em campo: Treinamento em Controle dá 2, e o contador não passa. */
t("a tela lê o mesmo teto pelo derive", estadoDe("invocacoes_a_3m").max(guarda), 2);

/* ---------- REDE DE DETECÇÃO: +2 Percepção e +2 Atenção por invocação ---------- */
const r0 = deriveAfty(ficha(8, [...base, "ctr_rede_de_deteccao"], { invocacoes_a_3m: 0 }));
const r2 = deriveAfty(ficha(8, [...base, "ctr_rede_de_deteccao"], { invocacoes_a_3m: 2 }));
const perc = (d) => d.testes.pericias.find((p) => p.id === "percepcao").bonus;
t("Rede de Detecção: +4 em Percepção com duas", perc(r2) - perc(r0), 4);
t("Rede de Detecção: a Atenção sobe pela Percepção (+4) e pela linha própria (+4), como o livro soma", r2.atencao - r0.atencao, 8);

/* Os dois poderes juntos usam o MESMO contador. */
const dois = deriveAfty(ficha(8, [...base, "ctr_guarda_viva", "ctr_rede_de_deteccao"], { invocacoes_a_3m: 1 }));
const doisZero = deriveAfty(ficha(8, [...base, "ctr_guarda_viva", "ctr_rede_de_deteccao"], { invocacoes_a_3m: 0 }));
t("juntos: um contador, +1 de Defesa", dois.defesa - doisZero.defesa, 1);
t("juntos: um contador, +4 de Atenção com uma invocação (2 da Percepção e 2 da linha própria)", dois.atencao - doisZero.atencao, 4);

/* ---------- COMBATE EM ALCATEIA: +1 nível de dano por invocação, só nas armas de Técnicas de Combate ---------- */
const alc = (n, extra = []) => deriveAfty(ficha(12, [...base, "ctr_tecnicas_de_combate", "ctr_apogeu", "ctr_combate_em_alcateia", ...extra], { invocacoes_no_alcance: n }));
const efs = (d) => (d.efeitos?.detalhes ?? []).filter((e) => e.origem === "ctr_combate_em_alcateia");
t("sem invocação no alcance não há efeito", efs(alc(0)).length, 0);
t("com duas, a arma escolhida ganha 2 níveis", efs(alc(2)).map((e) => [e.canal, e.alvo, e.valor]), [["nivelDano", "arm_adaga", 2]]);
const puro = POS.efeitosCombateEmAlcateia({ armas: ["a", "b"] }, { ativo: true, invocacoes_no_alcance: 3 }, ["ctr_combate_em_alcateia"]);
t("uma linha por arma escolhida", puro.map((e) => [e.alvo, e.expr]), [["a", "3"], ["b", "3"]]);
t("sem a habilidade nada", POS.efeitosCombateEmAlcateia({ armas: ["a"] }, { ativo: true, invocacoes_no_alcance: 3 }, []), []);
t("combate desligado nada", POS.efeitosCombateEmAlcateia({ armas: ["a"] }, { ativo: false, invocacoes_no_alcance: 3 }, ["ctr_combate_em_alcateia"]), []);
t("valor lixo vira zero", POS.efeitosCombateEmAlcateia({ armas: ["a"] }, { ativo: true, invocacoes_no_alcance: "x" }, ["ctr_combate_em_alcateia"]), []);
t("valor negativo vira zero", POS.efeitosCombateEmAlcateia({ armas: ["a"] }, { ativo: true, invocacoes_no_alcance: -2 }, ["ctr_combate_em_alcateia"]), []);

/* ---------- O QUE CONTINUA DE MESA ---------- */
const emMesa = ["ctr_camuflagem_aprimorada", "ctr_taticas_de_alcateia", "ctr_flanco_avancado"];
for (const id of emMesa) {
  const d = deriveAfty(ficha(12, [...base, "ctr_taticas_de_alcateia", id], { invocacoes_a_3m: 3, invocacoes_no_alcance: 3 }));
  t(`${id}: não muda a ficha do dono`, (d.efeitos?.detalhes ?? []).filter((e) => e.origem === id).length, 0);
}

if (bad.length) {
  console.error(`FALHARAM ${bad.length} DE ${ok + bad.length}`);
  for (const b of bad) console.error("  " + b.slice(0, 300));
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
