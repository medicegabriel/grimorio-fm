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
 * ⚠ DESDE 2026-10-03 O IMPORTADOR NÃO LANÇA MAIS POR NOME. O autor escolheu o
 * "Nome de Reserva": a ficha sem nome entra como "Sem nome", a mesma palavra do
 * `nomeParaGravar`, e as fichas antigas exportadas com `name: ""` voltam a
 * entrar. As duas pontas seguem medidas aqui, porque são duas cópias da mesma
 * regra (a 2.5.2 não importa nada do Afty) e cópia diverge calada. O que nem é
 * objeto (null, número, lista) continua derrubando o pacote.
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
/* ⚠ Espaço em branco é o caso traiçoeiro: até 2026-10-03 o importador ACEITAVA
   `"   "`, porque para ele bastava ser string não vazia, e a ficha entrava com um
   nome invisível. Hoje os dois lados tratam `"   "` como sem nome. */
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

/* Devolve os NOMES com que as fichas entraram, e não só a contagem: o que se
   prova é que a ficha atravessa E com que nome ela chega do outro lado. */
const importa = (creature) => {
  try {
    return parseImportText(JSON.stringify([creature])).creatures.map((c) => c.name);
  } catch {
    return "REJEITADA";
  }
};

const emBranco = createBlankAfty();
t("a ficha em branco NASCE sem nome", emBranco.name, "");
t("e o importador a recebe como Sem nome", importa(emBranco), ["Sem nome"]);

/* ⚠ O QUE O `handleSave` FAZ, medido: com a regra aplicada, atravessa igual. */
const gravada = { ...emBranco, name: nomeParaGravar(emBranco.name), id: "x1" };
t("com a regra do handleSave, ela importa", importa(gravada), ["Sem nome"]);
/* ⚠ AS DUAS CÓPIAS DIZEM A MESMA PALAVRA. Se uma delas mudar o texto de reserva,
   a ficha salva sem nome e a ficha antiga importada passam a ter nomes
   diferentes para a mesma ideia, e é esta linha que acusa. */
t("o importador e o criador usam a mesma palavra",
  importa({ ...emBranco, name: "" })[0], nomeParaGravar(""));

/* E o mesmo para uma ficha de jogador, que é onde o autor topou com o bug. */
const jogador = { ...createBlankAfty(), rulesVersion: "player", id: "x2" };
t("jogador sem nome entra como Sem nome", importa(jogador), ["Sem nome"]);
t("jogador com a regra aplicada importa",
  importa({ ...jogador, name: nomeParaGravar(jogador.name) }), ["Sem nome"]);

/* Os casos que o importador antigo reprovava junto com o vazio. */
t("só espaços entra como Sem nome", importa({ ...emBranco, name: "   " }), ["Sem nome"]);
t("nome ausente entra como Sem nome", importa({ id: "x3" }), ["Sem nome"]);
t("nome que não é texto entra como Sem nome", importa({ id: "x4", name: 7 }), ["Sem nome"]);
/* ⚠ O IMPORTADOR NÃO APARA NOME DE VERDADE. Ele só troca o que está vazio, para
   a 2.5.2 seguir recebendo o nome exatamente como foi exportado. */
t("nome de verdade passa intacto, com as pontas", importa({ id: "x5", name: " Lobo " }), [" Lobo "]);

/* ============================================================ */
/* 3. UMA FICHA SEM NOME NÃO DERRUBA MAIS O PACOTE               */
/* ============================================================ */
/* ⚠ ERA ESTE O TAMANHO DO ESTRAGO até 2026-10-03: o importador LANÇAVA em vez
   de pular, e quem exportava cinco fichas com uma sem nome perdia as cinco. */

const pacote = (lista) => {
  try {
    return parseImportText(JSON.stringify(lista)).creatures.map((c) => c.name);
  } catch {
    return "PACOTE INTEIRO REJEITADO";
  }
};
const fichas = (nomes) => nomes.map((n, i) => ({ ...createBlankAfty(), name: n, id: `p${i}` }));

t("três fichas com nome entram as três", pacote(fichas(["Ana", "Bia", "Caio"])), ["Ana", "Bia", "Caio"]);
t("uma sem nome no meio entra como Sem nome, e as outras junto",
  pacote(fichas(["Ana", "", "Caio"])), ["Ana", "Sem nome", "Caio"]);
t("e com a regra do criador aplicada antes, o mesmo resultado",
  pacote(fichas(["Ana", "", "Caio"].map(nomeParaGravar))), ["Ana", "Sem nome", "Caio"]);

/* ⚠ O QUE NEM É FICHA CONTINUA DERRUBANDO. O autor escolheu só o nome de
   reserva, e não "pular e avisar": uma entrada nula no meio do pacote é JSON
   editado à mão, e o erro segue dizendo qual é. */
for (const lixo of [null, 7, "Ana", []]) {
  t(`entrada ${JSON.stringify(lixo)} no meio derruba o pacote`,
    pacote([...fichas(["Ana"]), lixo]), "PACOTE INTEIRO REJEITADO");
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
