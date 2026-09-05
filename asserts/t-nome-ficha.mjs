/**
 * FICHA SEM NOME NÃO SAI DO APP E NÃO VOLTA — 2026-09-05
 *
 * ============================================================
 * O BUG QUE DEU ORIGEM A ESTE ARQUIVO
 * ============================================================
 * O autor publicou uma atualização e as fichas novas passaram a falhar na
 * IMPORTAÇÃO, com "Criatura inválida:" seguido do JSON inteiro. O JSON estava
 * saudável: colocando um nome nele, importa e deriva sem um arranhão (PV 33,
 * PE 15, Defesa 15, CD 17, batendo com o snapshot gravado na própria ficha).
 *
 * O culpado era um campo só: `"name": ""`.
 *
 * ⚠ E O ESTRAGO É MAIOR QUE UMA FICHA. O `parseImportText` da 2.5.2 **LANÇA**
 * quando acha uma criatura sem nome, em vez de pular: uma ficha sem nome no meio
 * de um pacote derruba a importação inteira, levando junto todas as outras que
 * vieram no mesmo arquivo. Quem exporta cinco fichas e tem uma sem nome perde as
 * cinco.
 *
 * ⚠ O CRIADOR NÃO EXIGIA NOME. O `createBlankAfty` nasce com `name: ""` e o
 * `handleSave` gravava o rascunho como estava, então dava para montar a ficha
 * toda, salvar, exportar e só descobrir o problema do outro lado.
 *
 * ============================================================
 * POR QUE ESTE ASSERT IMPORTA O `io-utils.js` DA 2.5.2
 * ============================================================
 * Porque o contrato é DELE. Reescrever aqui a regra ("nome não pode ser vazio")
 * mediria a minha cópia da regra, e no dia em que o importador mudar de ideia
 * este arquivo continuaria verde mentindo. Importar de `src/components/` é
 * permitido: o que a regra da casa proíbe é EDITAR.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const C = new URL("../src/components/", import.meta.url).href;
const { createBlankAfty, nomeParaGravar } = await import(R + "afty-schema.js");
const { parseImportText } = await import(C + "io-utils.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. A REGRA                                                    */
/* ============================================================ */

t("nome vazio vira Sem nome", nomeParaGravar(""), "Sem nome");
t("só espaços também", nomeParaGravar("   "), "Sem nome");
/* ⚠ Espaço em branco é o caso traiçoeiro: o importador ACEITA `"   "`, porque
   para ele basta ser string não vazia. A ficha entraria com um nome invisível e
   sumiria na lista do Dashboard. Aparar aqui resolve os dois de uma vez. */
t("nulo", nomeParaGravar(null), "Sem nome");
t("indefinido", nomeParaGravar(undefined), "Sem nome");
t("número vira texto", nomeParaGravar(7), "7");
t("nome de verdade passa intacto", nomeParaGravar("Amigo Lobo"), "Amigo Lobo");
/* Apara as pontas, e só as pontas: o nome do autor pode ter espaço no meio. */
t("apara as pontas", nomeParaGravar("  Amigo Lobo  "), "Amigo Lobo");
t("mas não o meio", nomeParaGravar("Amigo  Lobo"), "Amigo  Lobo");

/* ============================================================ */
/* 2. O CONTRATO DE VERDADE, MEDIDO CONTRA O IMPORTADOR          */
/* ============================================================ */
/* Este é o bloco que justifica o arquivo. Ele não pergunta "o nome ficou certo",
   pergunta "a ficha ATRAVESSA a importação". */

const importa = (creature) => {
  try {
    const r = parseImportText(JSON.stringify([creature]));
    return r.creatures.length;
  } catch {
    return "REJEITADA";
  }
};

const emBranco = createBlankAfty();
t("a ficha em branco NASCE sem nome", emBranco.name, "");
t("e por isso ela seria rejeitada na importação", importa(emBranco), "REJEITADA");

/* ⚠ O QUE O `handleSave` FAZ, medido: com a regra aplicada, atravessa. */
const gravada = { ...emBranco, name: nomeParaGravar(emBranco.name), id: "x1" };
t("com a regra do handleSave, ela importa", importa(gravada), 1);

/* E o mesmo para uma ficha de jogador, que é onde o autor topou com o bug. */
const jogador = { ...createBlankAfty(), rulesVersion: "player", id: "x2" };
t("jogador sem nome é rejeitado", importa(jogador), "REJEITADA");
t("jogador com a regra aplicada importa",
  importa({ ...jogador, name: nomeParaGravar(jogador.name) }), 1);

/* ============================================================ */
/* 3. UMA FICHA SEM NOME DERRUBA O PACOTE INTEIRO                */
/* ============================================================ */
/* ⚠ É ESTE O TAMANHO DO ESTRAGO, e é o que faz a correção valer a pena. O
   importador LANÇA em vez de pular, então a ficha sem nome não falha sozinha. */

const pacote = (nomes) => {
  const lista = nomes.map((n, i) => ({ ...createBlankAfty(), name: n, id: `p${i}` }));
  try {
    return parseImportText(JSON.stringify(lista)).creatures.length;
  } catch {
    return "PACOTE INTEIRO REJEITADO";
  }
};

t("três fichas com nome entram as três", pacote(["Ana", "Bia", "Caio"]), 3);
t("uma sem nome no meio derruba as três",
  pacote(["Ana", "", "Caio"]), "PACOTE INTEIRO REJEITADO");
t("e com a regra aplicada as três entram",
  pacote(["Ana", "", "Caio"].map(nomeParaGravar)), 3);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
