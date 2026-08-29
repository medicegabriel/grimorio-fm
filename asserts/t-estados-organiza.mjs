/* ORGANIZAÇÃO DOS ESTADOS DA ABA BUFFS, 2026-08-28.

   A aba desenhava os 54 estados de combate numa lista só, na ordem do catálogo.
   Numa criatura de ND 40 medida isso dá 46 linhas e 40 caixas de primeiro
   nível, com as três ou quatro LIGADAS espalhadas no meio das apagadas, sem
   filtro, sem divisão e sem grupo.

   O `organizaEstados` é a resposta, e o ponto dele é não inventar dimensão
   nenhuma: as duas que organizam a aba já estavam escritas nos dados.

     O DONO     sai do mesmo `requer*` que a aba já usa para decidir se a linha
                aparece.
     A FAMÍLIA  sai do RÓTULO: 33 dos 54 se chamam `Família · Parte`.

   Este arquivo prova as duas contas e as bordas delas. Prova NÚMERO e ESTRUTURA,
   e não aparência.

   ⚠ O derive entra PRIMEIRO, e não é enfeite: `afty-habilidades.js` importado
   como primeiro módulo do processo estoura o ciclo com `afty-combate.js`. Ver
   docs/a-fazer.md, "Importar afty-habilidades.js PRIMEIRO estoura um ciclo". */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
await import(R + "afty-derive.js");
const { COMBATE_ESTADOS } = await import(R + "afty-combate.js");
const { organizaEstados, donoDoEstado, familiaEParte } = await import(R + "ficha/ficha-estados.js");
const { estaLigado } = await import(R + "ficha/ficha-buffs.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const acha = (id) => COMBATE_ESTADOS.find((e) => e.id === id);
const rotulos = (blocos) => blocos.map((b) => [b.familia, b.grupos.map((g) => g.pai.rotulo)]);

/* ============================================================ */
/* 1. FAMÍLIA E PARTE, PELO RÓTULO                               */
/* ============================================================ */

t("quebra no separador", familiaEParte("Manobra · Ajuste"), { familia: "Manobra", parte: "Ajuste" });
t("rótulo sem separador não tem família",
  familiaEParte("Brutalidade"), { familia: null, parte: "Brutalidade" });
t("só o PRIMEIRO separador conta",
  familiaEParte("Golpe Especial · Atroz · Extra"), { familia: "Golpe Especial", parte: "Atroz · Extra" });
t("vazio não quebra", familiaEParte(undefined), { familia: null, parte: "" });

/* A convenção existe mesmo, e em quantidade: se um dia ela sumir do catálogo,
   este número cai e o cabeçalho de família deixa de valer a pena. */
t("a convenção cobre 33 dos 54",
  COMBATE_ESTADOS.filter((e) => familiaEParte(e.label).familia).length, 33);

/* ============================================================ */
/* 2. O DONO DE CADA ESTADO                                      */
/* ============================================================ */

t("por requerHabilidade, a Especialização",
  donoDoEstado(acha("brutalidade")), { id: "lutador", label: "Lutador" });
t("a Postura é do Combatente",
  donoDoEstado(acha("postura")), { id: "combatente", label: "Combatente" });
/* A Manobra de Empolgação chega por `requerEscolha`, e o dono dela é a
   Especialização de quem OFERECE a escolha, e não um balde "Escolhas". */
t("por requerEscolha, a Especialização de quem oferece",
  donoDoEstado(acha("manobraAjuste")), { id: "lutador", label: "Lutador" });
t("Aptidão vai para o balde das Aptidões",
  donoDoEstado({ requerAptidao: "regeneracao" }), { id: "aptidao", label: "Aptidões" });
t("Talento vai para o balde dos Talentos",
  donoDoEstado({ requerTalento: "tal_x" }), { id: "talento", label: "Talentos" });
t("sem requisito nenhum cai em Outras",
  donoDoEstado({ id: "x", label: "X" }), { id: "outras", label: "Outras" });
/* Os `estadosExtras` nascem no derive sem `requer*`, então podem dizer o dono. */
t("o `dono` declarado manda em tudo",
  donoDoEstado({ dono: { id: "estilo", label: "Estilo" }, requerAptidao: "regeneracao" }),
  { id: "estilo", label: "Estilo" });

/* TODO estado do catálogo tem dono achável. Um `requerHabilidade` apontando
   para id que não existe mais cairia em "Outras" calado, e o balde encheria sem
   ninguém ver. */
t("nenhum estado do catálogo cai em Outras",
  COMBATE_ESTADOS.filter((e) => donoDoEstado(e).id === "outras").map((e) => e.id), []);

/* ============================================================ */
/* 3. A ÁRVORE: SUB-ABAS, BLOCOS E PARENTESCO                    */
/* ============================================================ */

/* Uma amostra pequena e escrita à mão, para a estrutura ficar legível no teste.
   As quatro Manobras são família com quatro membros, a Brutalidade é raiz com
   dois filhos, e o Impacto Misto não tem família nenhuma. */
const amostra = [
  acha("manobraAjuste"), acha("manobraDesarme"), acha("manobraEsquiva"),
  acha("brutalidade"), acha("brutalidadePE"), acha("brutalidadePilha"),
  acha("impactoMisto"),
].filter(Boolean);
t("a amostra montou", amostra.length, 7);

const arv = organizaEstados(amostra, "");
t("uma sub-aba só, o Lutador", arv.subs.map((s) => [s.id, s.quantos]), [["lutador", 5]]);
t("a contagem da sub-aba conta RAÍZES, não filhos",
  arv.subs[0].quantos, 5);

t("os blocos, com a família virando cabeçalho", rotulos(arv.blocosDaSub.lutador), [
  ["Manobra", ["Ajuste", "Desarme", "Esquiva"]],
  [null, ["Brutalidade", "Impacto Misto"]],
]);

/* Os dois filhos da Brutalidade continuam dentro dela, e não viraram raiz. */
const brut = arv.blocosDaSub.lutador[1].grupos.find((g) => g.pai.id === "brutalidade");
t("a Brutalidade guardou os dois filhos",
  brut.filhos.map((f) => f.id), ["brutalidadePE", "brutalidadePilha"]);

/* O pai é o cabeçalho dos filhos dele, então o nome dele sai do rótulo dos dois:
   dentro da caixa "Brutalidade", "Brutalidade · Pilhas" é só "Pilhas". */
t("o filho perde o nome do pai", brut.filhos.map((f) => f.rotulo), ["PE Extra", "Pilhas"]);
t("e o label do catálogo continua inteiro",
  brut.filhos.map((f) => f.label), ["Brutalidade · PE Extra", "Brutalidade · Pilhas"]);

/* ⚠ Só encurta com igualdade EXATA. O "Surto de Adrenalina" tem filhos chamados
   "Surto · Absoluto", e cortar por prefixo parecido esconderia que são duas
   palavras diferentes. */
const surto = organizaEstados(
  [acha("surtoAdrenalina"), acha("adrenalinaAbsoluta")].filter(Boolean), "",
);
t("família parecida com o pai NÃO encurta",
  surto.blocosDaSub.restringido[0].grupos[0].filhos.map((f) => f.rotulo),
  ["Surto · Absoluto"]);

/* O rótulo do catálogo continua inteiro no `label`, e é ele que vira o `title`
   da linha: o `rotulo` é só o que a tela desenha. */
t("o label do catálogo sobrevive ao encurtamento",
  arv.blocosDaSub.lutador[0].grupos[0].pai.label, "Manobra · Ajuste");

/* ============================================================ */
/* 4. FAMÍLIA DE UM SÓ NÃO VIRA CABEÇALHO                        */
/* ============================================================ */
/* "Duelando" em cima de "Uma Arma, Mão Livre" agrupa zero linhas e ainda rouba
   a palavra do rótulo. Com um membro só, a linha fica inteira. */

const soUma = organizaEstados([acha("manobraAjuste"), acha("impactoMisto")], "");
t("família de um membro não abre bloco", rotulos(soUma.blocosDaSub.lutador), [
  [null, ["Manobra · Ajuste", "Impacto Misto"]],
]);

/* ============================================================ */
/* 5. O FILTRO                                                   */
/* ============================================================ */

/* Casa contra o rótulo INTEIRO: a palavra "manobra" sumiu das linhas, que agora
   se chamam "Ajuste" e "Desarme", e procurar por ela tem de achar as três. */
t("o filtro acha pela família, que já não está na linha",
  rotulos(organizaEstados(amostra, "manobra").blocosDaSub.lutador),
  [["Manobra", ["Ajuste", "Desarme", "Esquiva"]]]);

t("acha pela parte", rotulos(organizaEstados(amostra, "desarme").blocosDaSub.lutador),
  [[null, ["Manobra · Desarme"]]]);

t("sem acento e sem caixa",
  rotulos(organizaEstados(amostra, "IMPACTO").blocosDaSub.lutador), [[null, ["Impacto Misto"]]]);

t("termos somam, não trocam",
  rotulos(organizaEstados(amostra, "manobra ajuste").blocosDaSub.lutador),
  [[null, ["Manobra · Ajuste"]]]);

t("filtro que não casa com nada devolve nada",
  organizaEstados(amostra, "xyz").subs, []);

/* ⚠ O PARENTESCO SOBREVIVE AO FILTRO, nos dois sentidos. Um filho que casa
   sozinho traz o pai, senão apareceria solto e sem a caixa que diz de quem ele
   é. E um pai que casa leva os filhos, senão o filtro esconderia parte do que a
   linha faz. */
const pilhas = organizaEstados(amostra, "pilhas");
t("filho que casa traz o pai junto",
  rotulos(pilhas.blocosDaSub.lutador), [[null, ["Brutalidade"]]]);
t("e continua sendo filho, não virou raiz",
  pilhas.blocosDaSub.lutador[0].grupos[0].filhos.map((f) => f.id), ["brutalidadePilha"]);

const pai = organizaEstados(amostra, "brutalidade");
t("pai que casa leva os dois filhos",
  pai.blocosDaSub.lutador[0].grupos[0].filhos.map((f) => f.id),
  ["brutalidadePE", "brutalidadePilha"]);

/* ============================================================ */
/* 6. A CRIATURA CHEIA: A AULA DE NÚMEROS DA AUDITORIA           */
/* ============================================================ */
/* O catálogo inteiro, que é o pior caso possível da aba. Prova que a divisão
   por dono não deixa nenhuma sub-aba do tamanho da lista original. */

const tudo = organizaEstados(COMBATE_ESTADOS, "");
const maior = Math.max(...tudo.subs.map((s) => s.quantos));
t("nenhuma sub-aba passa de 20 raízes", maior <= 20, true);
t("as sub-abas somam as raízes todas",
  tudo.subs.reduce((a, s) => a + s.quantos, 0),
  COMBATE_ESTADOS.filter((e) => !e.requerEstado
    || !COMBATE_ESTADOS.some((x) => x.id === e.requerEstado)).length);
/* A ordem é a DO CATÁLOGO, e não alfabética nem por tamanho: a primeira sub-aba
   é a da primeira raiz escrita no arquivo. Trocar isso mexeria em qual divisão
   abre sozinha ao entrar na aba. */
t("e são seis divisões, na ordem do catálogo",
  tudo.subs.map((s) => s.id),
  ["lutador", "combatente", "conjurador", "restringido", "talento", "aptidao"]);

/* Nenhum estado se perde no caminho: toda raiz de toda sub-aba, somada aos
   filhos, devolve o catálogo inteiro. É o assert que pega um bloco esquecido. */
const desenhados = new Set();
for (const blocos of Object.values(tudo.blocosDaSub)) {
  for (const b of blocos) {
    for (const g of b.grupos) {
      desenhados.add(g.pai.id);
      for (const f of g.filhos) desenhados.add(f.id);
    }
  }
}
t("todo estado do catálogo é desenhado uma vez", desenhados.size, COMBATE_ESTADOS.length);

/* ============================================================ */
/* 7. LIGADOS AGORA LÊ O MESMO CRITÉRIO DO DELTA                 */
/* ============================================================ */
/* A seção do topo mostra exatamente as linhas para as quais o `deltaDosEstados`
   calcula um chip. Se as duas divergirem, a seção lista linha sem chip ou
   esconde linha que tem. O `estaLigado` exportado é o que amarra as duas. */

t("bool ligado", estaLigado({ tipo: "bool" }, true), true);
t("bool desligado", estaLigado({ tipo: "bool" }, false), false);
t("faixa no piso não conta", estaLigado({ tipo: "faixa", min: 1 }, 1), false);
t("faixa acima do piso conta", estaLigado({ tipo: "faixa", min: 1 }, 2), true);
t("opcao sem escolha", estaLigado({ tipo: "opcao" }, null), false);
t("opcao escolhida", estaLigado({ tipo: "opcao" }, "devastacao"), true);
t("multi vazio não conta", estaLigado({ tipo: "multi" }, []), false);
t("multi com um conta", estaLigado({ tipo: "multi" }, ["aura_lacerante"]), true);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
