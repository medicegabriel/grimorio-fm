/**
 * CRIAÇÃO DE EQUIPAMENTOS (Addon), fase 2: ARMAS.
 *
 * A seção Armas do guia "Criação de Equipamentos e Itens 2.5.2", com o alcance e
 * as Propriedades Especiais. Fonte em `docs/afty-criacao-equipamentos-fonte.md`,
 * módulo em `afty-criacao-equipamentos-armas.js`.
 *
 * As decisões do autor, todas de 2026-09-14:
 *   Fatal e Mortal: "d8 (1) > d10 (2) > d12 (3) e por ai vai. Não tem d4 e d6".
 *   "Não existe pesada abaixo de 12. E não permita o Pesada 15."
 *   Arremessável, Alcance e Emperrar são de graça.
 *   O 1.5x do Dano Desarmado é "Para calculo de propriedades".
 *   A tabela de alcance lê o grau da Ferramenta. Sem Ferramenta vale o 4° Grau, e
 *   o "-" repete o maior. A tabela sai da Classe.
 *   Recarga vale só a faixa mais estreita. Subir o Custo, uma vez só.
 *   O dado é calculado e vira mostrador. Espaços continuam livres. A conta dá o
 *   dado de uma mão, e o de duas é um degrau acima.
 *   Sem o Addon a arma continua com o dado da conta.
 *   Propriedade Especial com quantos efeitos quiser, e o +2 alcança Perícia, TR,
 *   Iniciativa e Dano.
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. As tabelas e o texto contra a fonte.
 * 2. Os preços de cada propriedade, com as faixas de Pesada e Recarga.
 * 3. A conta, com os casos que o guia descreve.
 * 4. O alcance: a tabela certa, a diagonal e o "-".
 * 5. O saneamento da arma com e sem receita.
 * 6. O `deriveAfty` inteiro: dado, alcance pelo grau e os efeitos da Especial.
 * 7. O pacote e a primitiva.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
import { readFileSync } from "node:fs";

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const EQ = await import(R + "afty-equipamentos.js");
const CA = await import(R + "afty-criacao-equipamentos-armas.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const pacote = A.normalizarPacote(
  JSON.parse(readFileSync(new URL("../addons/criacao-de-equipamentos.json", import.meta.url), "utf8")),
);
const fonte = readFileSync(new URL("../docs/afty-criacao-equipamentos-fonte.md", import.meta.url), "utf8")
  .replace(/\*/g, "").replace(/\\/g, "");

/* ============================================================ */
/* 1. AS TABELAS E O TEXTO                                       */
/* ============================================================ */
t("a tabela de Armas", CA.TABELA_ARMA.map((l) => [l.custo, l.dano, l.critico, l.peso]),
  [[1, "1d12", 20, 1], [2, "2d10", 20, 2], [3, "2d12", 20, 3], [4, "3d10", 20, 4]]);
t("o parágrafo das Armas é o da fonte", fonte.includes(CA.TEXTO_ARMAS), true);
for (const [id, texto] of Object.entries(CA.OBSERVACOES_ARMAS)) {
  t(`a Observação ${id} é a da fonte`, fonte.includes(texto), true);
}
t("o texto do alcance é o da fonte", fonte.includes(CA.TEXTO_ALCANCE), true);
t("o texto da Arma de Fogo é o da fonte", fonte.includes(CA.TEXTO_ARMA_DE_FOGO), true);
for (const [id, texto] of Object.entries(CA.TEXTO_PROPRIEDADES_ESPECIAIS)) {
  t(`o texto da Propriedade Especial (${id}) é o da fonte`, fonte.includes(texto), true);
}
for (const t2 of Object.values(CA.TABELAS_ALCANCE)) {
  t(`o nome da tabela "${t2.nome.slice(0, 12)}" é o da fonte`, fonte.includes(t2.nome), true);
}

/* A tabela de propriedades do guia, célula a célula. As de faixa ficam fora. */
t("as propriedades de preço fixo", CA.NIVEIS_PROPRIEDADE, {
  ampla: -1, aparar: -1, apunhaladora: -1, fineza: 0, duas_maos: 1, dupla: -2, energica: -1,
  estendida: -1, especial: 0, versatil: -1, leve: 0, marcial: -1, modular: -1, oscilante: -1,
});
const idsDoCatalogo = new Set(EQ.ARMA_PROPRIEDADES.map((p) => p.id));
for (const id of [...Object.keys(CA.NIVEIS_PROPRIEDADE), "fatal", "mortal", "pesada", "recarga", ...CA.PROPRIEDADES_GRATIS]) {
  t(`${id} existe no catálogo de propriedades`, idsDoCatalogo.has(id), true);
}

/* ============================================================ */
/* 2. AS FAIXAS                                                  */
/* ============================================================ */
t("Fatal e Mortal: d8 1, d10 2, d12 3, sem d4 e d6", CA.PASSO_DADO_PROPRIEDADE, { "1d8": 1, "1d10": 2, "1d12": 3 });
t("Pesada: os valores oferecidos, sem o 15", CA.PESADA_VALORES, [12, 13, 14, 16, 17, 18, 19, 20]);
t("Pesada: o crédito de cada valor",
  [11, 12, 14, 15, 16, 20, 21].map(CA.creditoDaPesada), [0, 1, 1, 0, 2, 2, 0]);
t("Recarga: só a faixa mais estreita",
  [30, 13, 12, 8, 7, 5, 2, 1, 0].map(CA.creditoDaRecarga), [1, 1, 2, 2, 3, 3, 3, 3, 0]);
t("Dano Desarmado: 1.5x o Custo, para baixo, mínimo 1", [1, 2, 3, 4].map(CA.niveisDoDesarmado), [1, 3, 4, 6]);

/* ============================================================ */
/* 3. A CONTA                                                    */
/* ============================================================ */
const arma = (p = {}) => ({
  id: "armc_t", nome: "T", classe: "simples", categoria: "corpo", dano: { dado: "1d6", tipo: "ct" },
  critico: 20, custo: 2, grupo: "espada", props: {}, niveis: {}, ...p,
});
const conta = (p) => CA.contaDaArmaPorNivel(arma(p));
const avisos = (p) => conta(p).avisos.map((a) => a.id);

t("Custo 1 limpo é o 1d12", conta({ custo: 1 }).dado, "1d12");
t("Custo 2 limpo é o 2d10", conta({}).dado, "2d10");
t("Custo 4 limpo mantém o 3d10 impresso", conta({ custo: 4 }).dado, "3d10");
t("Custo 4 com Ampla desce pela escada", conta({ custo: 4, props: { ampla: true } }).dado, "2d12 + 1d4");
const c1 = conta({ critico: 19, props: { marcial: true, modular: "pf", duas_maos: true } });
t("Custo 2 com Marcial, Modular, Duas Mãos e Crítico 19", [c1.gasto, c1.credito, c1.reducao, c1.dado], [3, 1, 2, "1d12 + 1d4"]);
t("o crédito nunca sobe o dado acima do Custo",
  conta({ props: { duas_maos: true, pesada: 20, recarga: 1 } }).dado, "2d10");
t("Dupla custa 2", conta({ props: { dupla: true } }).gasto, 2);
t("Fineza, Leve e Especial não custam nada", conta({ props: { fineza: true, leve: true, especial: true } }).gasto, 0);
t("Arremessável, Alcance e Emperrar são de graça",
  conta({ props: { arremessavel: [6, 18], alcance: [9, 18], emperrar: true } }).gasto, 0);
t("Fatal d12 custa 3", conta({ props: { fatal: "1d12" } }).gasto, 3);
t("Mortal d6 avisa e custa 1", [conta({ props: { mortal: "1d6" } }).gasto, avisos({ props: { mortal: "1d6" } })], [1, ["mortalDado"]]);
t("Pesada 15 avisa e não credita", [conta({ props: { pesada: 15 } }).credito, avisos({ props: { pesada: 15 } })], [0, ["pesadaValor"]]);
t("Fineza e Pesada juntas avisam", avisos({ props: { fineza: true, pesada: 14 } }), ["finezaPesada"]);
t("Estabilidade avisa que não está no guia", avisos({ props: { estabilidade: 14 } }), ["estabilidadeFora"]);
t("Complexa dá +1", conta({ classe: "complexa", props: { ampla: true } }).dado, "2d10");
t("Crítico 18 custa 2", conta({ critico: 18 }).gasto, 2);

const ant = conta({ custo: 3, niveis: { custoAnterior: true }, props: { ampla: true, aparar: true } });
t("Custo 3 com o dado do Custo 2 e +2", [ant.dadoBase, ant.credito, ant.dado], ["2d10", 2, "2d10"]);
t("o Custo 1 não tem Custo anterior", [conta({ custo: 1, niveis: { custoAnterior: true } }).dado, avisos({ custo: 1, niveis: { custoAnterior: true } })],
  ["1d12", ["custoAnteriorC1"]]);

t("Versátil: a conta é o dado de uma mão, e o de duas um degrau acima",
  (({ dado, duasMaos }) => [dado, duasMaos])(conta({ custo: 1, props: { versatil: true } })), ["1d10", "1d12"]);

const des = conta({ custo: 2, niveis: { desarmado: true }, props: { marcial: true, ampla: true } });
t("Dano Desarmado: 3 Níveis no Custo 2, sem dado", [des.desarmado, des.nivelBase, des.dado, des.avisos], [true, 3, null, []]);
t("Dano Desarmado acima dos Níveis avisa",
  avisos({ custo: 1, niveis: { desarmado: true }, props: { marcial: true, ampla: true } }), ["desarmadoExcedido"]);
t("propriedade demais para o dado avisa e para no degrau 1",
  (({ dado, avisos: a }) => [dado, a.map((x) => x.id)])(conta({ custo: 1, critico: 18,
    props: { ampla: true, aparar: true, apunhaladora: true, dupla: true, energica: true, estendida: true, marcial: true } })),
  ["1", ["dadoExcedido"]]);

t("Arma de Fogo sem Emperrar e sem Recarga avisa", avisos({ grupo: "tiro", categoria: "distancia" }), ["fogoEmperrar", "fogoRecarga"]);
t("com as duas, não avisa", avisos({ grupo: "tiro", categoria: "distancia", props: { emperrar: true, recarga: 12 } }), []);
t("dano que não é Físico avisa", avisos({ dano: { dado: "1d6", tipo: "queimante" } }), ["tipoFisico"]);

/* ============================================================ */
/* 4. ALCANCE                                                    */
/* ============================================================ */
t("De Arremesso usa a tabela 1, mesmo Complexa",
  CA.tabelaDeAlcance({ categoria: "arremesso", classe: "complexa" }), 1);
t("A Distância Simples usa a 1 e Complexa a 2",
  [CA.tabelaDeAlcance({ categoria: "distancia", classe: "simples" }), CA.tabelaDeAlcance({ categoria: "distancia", classe: "complexa" })], [1, 2]);
t("Corpo a corpo não tem tabela", CA.tabelaDeAlcance({ categoria: "corpo" }), null);

/* A escolha pela Classe bate com todas as armas a distância e de arremesso do livro. */
const esperadoDoLivro = { arm_arco_curto: 1, arm_besta_leve: 1, arm_pistola: 1, arm_arco_longo: 2, arm_besta_pesada: 2, arm_escopeta: 2, arm_rifle: 2 };
for (const [id, tab] of Object.entries(esperadoDoLivro)) {
  const def = EQ.ARMAS.find((a) => a.id === id);
  if (def) t(`${def.nome} cai na tabela ${tab}`, CA.tabelaDeAlcance(def), tab);
}

/* As duas tabelas andam na diagonal: o Custo c no grau g é o Custo 1 no grau c+g-1. */
for (const [n, tab] of Object.entries(CA.TABELAS_ALCANCE)) {
  let diagonal = true;
  tab.linhas.forEach((linha, c) => linha.forEach((cel, g) => {
    const alvo = tab.linhas[0][c + g];
    if (cel && JSON.stringify(cel) !== JSON.stringify(alvo)) diagonal = false;
    if (!cel && c + g < 5) diagonal = false;
  }));
  t(`a tabela ${n} anda na diagonal, e o "-" é só onde passaria do topo`, diagonal, true);
}
const alc = CA.alcancePorGrau({ categoria: "distancia", classe: "simples", custo: 2 });
t("Custo 2 Simples por grau, com o \"-\" repetindo o maior", alc,
  { quarto: [18, 21], terceiro: [21, 27], segundo: [27, 36], primeiro: [36, 48], especial: [36, 48] });
t("Custo 4 Complexa", CA.alcancePorGrau({ categoria: "distancia", classe: "complexa", custo: 4 }),
  { quarto: [90, 120], terceiro: [120, 240], segundo: [120, 240], primeiro: [120, 240], especial: [120, 240] });

/* ============================================================ */
/* 5. O SANEAMENTO DA ARMA                                       */
/* ============================================================ */
const bruta = (p = {}) => ({ ...arma(p), id: "armc_s" });
const s1 = EQ.saneiaArmaCustom(bruta({ critico: 19, props: { marcial: true } }));
t("com receita o dado digitado deixa de valer", s1.dano.dado, "1d12 + 1d4");
t("e a receita fica na arma", s1.niveis, { custoAnterior: false, desarmado: false, especiais: [] });
const semReceita = bruta({ critico: 19, props: { marcial: true } });
delete semReceita.niveis;
t("sem receita a arma é a de sempre", EQ.saneiaArmaCustom(semReceita).dano, { dado: "1d6", tipo: "ct" });
t("o dado de duas mãos sai da conta", EQ.saneiaArmaCustom(bruta({ props: { versatil: true } })).dano,
  { dado: "1d12 + 1d6", duasMaos: "1d12 + 1d8", tipo: "ct" });
const sd = EQ.saneiaArmaCustom(bruta({ categoria: "distancia", classe: "complexa", custo: 3 }));
t("a distância: o alcance do 4° Grau vira a propriedade", sd.props.alcance, [60, 90]);
t("e o de cada grau vai junto", sd.alcancePorGrau.primeiro, [120, 240]);
const sDes = EQ.saneiaArmaCustom(bruta({ niveis: { desarmado: true }, grupo: "espada" }));
t("Dano Desarmado vira Pugilato sem dado", [sDes.grupo, sDes.dano], ["pugilato", { desarmado: true, tipo: "ct" }]);
t("o Custo 4 passa por fora da lista de dados", EQ.saneiaArmaCustom(bruta({ custo: 4 })).dano.dado, "3d10");
t("a receita tolera lixo", CA.saneiaReceitaNiveis({ custoAnterior: 1, especiais: [null, { tipo: "x" }, { tipo: "cenario", texto: 3 }] }),
  { custoAnterior: true, desarmado: false, especiais: [{ tipo: "cenario", texto: "" }] });
t("receita que não é objeto é nenhuma", [CA.saneiaReceitaNiveis(null), CA.saneiaReceitaNiveis([]), CA.saneiaReceitaNiveis("x")], [null, null, null]);
t("o bônus da Especial para em +2", CA.saneiaReceitaNiveis({ especiais: [{ tipo: "bonus", rolagem: "tr", alvo: "vontade", valor: 9 }] }).especiais[0].valor, 2);

/* A Propriedade Especial só emite com a propriedade marcada, e sem alvo não emite. */
const especiais = [
  { tipo: "bonus", rolagem: "pericia", alvo: "percepcao", valor: 2 },
  { tipo: "bonus", rolagem: "tr", alvo: "", valor: 2 },
  { tipo: "bonus", rolagem: "iniciativa", valor: 1 },
  { tipo: "bonus", rolagem: "dano", valor: 2 },
  { tipo: "treinoPericias", alvos: ["furtividade", "furtividade"] },
  { tipo: "treinoTR", alvo: "vontade" },
  { tipo: "cenario", texto: "Terreno Difícil no quadrado do alvo" },
];
t("os efeitos da Especial viram as linhas do Motor",
  CA.efeitosDaEspecial({ id: "armc_e", props: { especial: true }, niveis: { especiais } }), [
    { canal: "bonusPericia", alvo: "percepcao", expr: "2" },
    { canal: "iniciativa", expr: "1" },
    { canal: "danoBonus", alvo: "armc_e", expr: "2" },
    { canal: "proficienciaPericia", alvo: "furtividade", expr: "1" },
    { canal: "proficienciaTR", alvo: "vontade", expr: "1" },
  ]);
t("sem a propriedade Especial, nenhum", CA.efeitosDaEspecial({ id: "armc_e", props: {}, niveis: { especiais } }), []);
t("o texto do Cenário fica na arma",
  EQ.saneiaArmaCustom(bruta({ props: { especial: true }, niveis: { especiais } })).especialTexto, "Terreno Difícil no quadrado do alvo");

/* ============================================================ */
/* 6. O DERIVE                                                   */
/* ============================================================ */
const ficha = (sistema, { armas = [], itens = [], addon = true } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 10 };
  f.armasCustom = armas;
  f.equipamentos = { itens };
  if (addon) f.addons = [pacote];
  return f;
};
const arco = {
  id: "armc_arco", nome: "Arco Criado", classe: "complexa", categoria: "distancia", dano: { dado: "1d6", tipo: "pf" },
  critico: 20, custo: 2, grupo: "arco", props: { especial: true }, niveis: { especiais },
};
const espada = { id: "armc_esp", nome: "Espada Criada", classe: "simples", categoria: "corpo", dano: { dado: "1d4", tipo: "ct" },
  critico: 19, custo: 2, grupo: "espada", props: { marcial: true }, niveis: {} };
const equipada = (refId, uid, fa = null) => ({ uid, tipo: "arma", refId, qtd: 1, equipado: true, ...(fa ? { fa } : {}) });
const linha = (d, id) => d.dano.entradas.find((e) => e.id === id);

const semNada = deriveAfty(ficha("player"));
const dj = deriveAfty(ficha("player", { armas: [arco, espada], itens: [equipada("armc_arco", "a1"), equipada("armc_esp", "a2")] }));
t("jogador: a espada criada rola o dado da conta", linha(dj, "armc_esp").partes[0].texto, "1d12 + 1d4");
t("jogador: o arco sem Ferramenta usa o 4° Grau", [linha(dj, "armc_arco").alcance.curto, linha(dj, "armc_arco").alcance.longo], [30, 60]);
t("jogador: o +2 de Dano da Especial entra só na linha do arco", [
  linha(dj, "armc_arco").partes.some((p) => p.label === "Arco Criado" && p.valor === 2),
  linha(dj, "armc_esp").partes.some((p) => p.label === "Arco Criado"),
], [true, false]);
t("jogador: +2 em Percepção", dj.testes.pericias.find((p) => p.id === "percepcao").bonus
  - semNada.testes.pericias.find((p) => p.id === "percepcao").bonus, 2);
t("jogador: +1 de Iniciativa", dj.iniciativa - semNada.iniciativa, 1);
t("jogador: treinado em Furtividade e em Vontade", [
  dj.testes.pericias.find((p) => p.id === "furtividade").prof,
  dj.testes.resistencias.find((r) => r.value === "vontade").prof,
], ["treinado", "treinado"]);

const comFa = deriveAfty(ficha("player", { armas: [arco], itens: [equipada("armc_arco", "a1", { grau: "primeiro", encantamentos: [], habilidadeUnica: "" })] }));
t("jogador: com Ferramenta de Primeiro Grau, a coluna do 1° Grau", linha(comFa, "armc_arco").alcance.texto, "120m / 240m");
const guardado = deriveAfty(ficha("player", { armas: [arco], itens: [{ ...equipada("armc_arco", "a1"), equipado: false }] }));
t("carregado e desequipado, a Especial não conta", guardado.iniciativa - semNada.iniciativa, 0);

const semAddon = deriveAfty(ficha("player", { addon: false, armas: [arco, espada], itens: [equipada("armc_arco", "a1"), equipada("armc_esp", "a2")] }));
t("sem o Addon a arma continua com o dado da conta", linha(semAddon, "armc_esp").partes[0].texto, "1d12 + 1d4");
t("e a Especial continua valendo", semAddon.iniciativa - deriveAfty(ficha("player", { addon: false })).iniciativa, 1);

const dc = deriveAfty(ficha("afty", { armas: [arco], itens: [equipada("armc_arco", "a1")] }));
t("criatura: a Especial também vale", dc.iniciativa - deriveAfty(ficha("afty")).iniciativa, 1);
t("criatura: o alcance também sai da tabela", linha(dc, "armc_arco").alcance.texto, "30m / 60m");

/* ============================================================ */
/* 7. O PACOTE                                                   */
/* ============================================================ */
t("a primitiva está registrada", A.PRIMITIVAS.some((p) => p.id === "armasPorNivel"), true);
t("o pacote valida", A.validarPacote(pacote), []);
t("instalado, a ficha enxerga a bancada", A.primitivasDaCriatura({ addons: [pacote] }).includes("armasPorNivel"), true);

/* ============================================================ */
if (bad.length) {
  console.log(`FALHAS (${bad.length}):`);
  for (const b of bad) console.log("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
