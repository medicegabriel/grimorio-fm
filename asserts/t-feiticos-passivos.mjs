/**
 * A PASSIVA COBRA PE MÁXIMO, e só na Ficha de Jogador.
 *
 * Autor, 2026-09-09: *"Passivas precisam gastar PE Máximo igual ao Dobro do
 * Nível delas. Nível 0 = 0, Nível 1 = 2, Nível 2 = 4, Nível 5 = 10. Para cada
 * passiva, se gasta PE Máximo."*
 *
 * É o primeiro pedaço do tipo "passivo", que estava no schema desde sempre sem
 * calculador nenhum e que o autor tinha adiado por escrito em 2026-08-09 (*"Os
 * Especiais e Passivos deixamos para depois. Com calma."*).
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. A TABELA DO AUTOR, os quatro pontos que ele deu, mais os dois que ele não
 *    deu e que saem da mesma regra (3 e 4).
 * 2. ⚠ NÃO É A `FEITICO_CUSTO_PE`. As duas empatam no Nível 1 (2 PE) e divergem
 *    em todo o resto, e a de cima é custo POR USO. Este assert as compara de
 *    propósito: no dia em que alguém "unificar" as duas tabelas, fica vermelho.
 * 3. TÉCNICA MÁXIMA VALE 12 (autor, na mesma conversa), tratando "max" como
 *    Nível 6, que é o que o resto do arquivo já faz.
 * 4. É DIVERGÊNCIA. A criatura do /Afty não paga nada, e o PE dela não muda com
 *    Passiva nenhuma. É a contraprova mais importante daqui.
 * 5. CADA PASSIVA COBRA A SUA ("para cada passiva"), então quatro delas somam.
 * 6. VARIAÇÃO DE LIBERAÇÃO NÃO COBRA. Ela é o mesmo Feitiço declarado de outro
 *    jeito e já não gasta vaga no orçamento.
 * 7. O HOVER TEM UMA LINHA POR PASSIVA, com o nome dela, e as parcelas do PE
 *    fecham com o total. Total certo com detalhamento errado é bug, e esta é a
 *    terceira vez que essa regra é medida no PE (ver `Quantidade de PE` e
 *    `Mod. da Técnica` no mesmo hover).
 * 8. ⚠ O PE MÁXIMO PODE FICAR NEGATIVO (autor: *"Pode ficar negativo"*), e a
 *    pilha CORRENTE da sessão não. Os três caminhos de sessão aparam em zero, e
 *    o `sessaoEmBranco` era o único que não aparava até esta mudança.
 * 9. SÓ O TIPO "passivo" COBRA. Um Feitiço de Dano de Nível 5 não tira nada do
 *    máximo, senão a regra teria virado imposto sobre todo o repertório.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const F = await import(R + "afty-feiticos.js");
const S = await import(R + "afty-sistema.js");
const SES = await import(R + "ficha/ficha-sessao.js");
const { conteudoDaFicha } = await import(R + "ficha/ficha-conteudo.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const passiva = (nome, nivel) => ({ ...F.createBlankFeitico(), nome, tipo: "passivo", nivel });

/** Ficha de Conjurador, igual dos dois lados menos o `rulesVersion`. */
function ficha(sistema, feiticos, nivel = 12) {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.name = "Cobaia";
  f.core = { ...f.core, nd: nivel, tipo: "misto", patamar: "comum",
    origem: { ...(f.core.origem ?? {}), id: "inato" } };
  f.especializacoes = [{ id: "conjurador", nivel }];
  f.attributes = { forca: 10, destreza: 14, constituicao: 14, inteligencia: 16, sabedoria: 12, presenca: 12 };
  f.feiticos = feiticos;
  return deriveAfty(f);
}
const pe = (sistema, feiticos, nivel = 12) => ficha(sistema, feiticos, nivel).pe;

/* ============================================================ */
/* 1. A TABELA DO AUTOR                                          */
/* ============================================================ */

/* Os quatro pontos que ele deu, na ordem em que ele os escreveu. */
t("Nível 0 custa 0", F.custoPeMaximoDaPassiva(0), 0);
t("Nível 1 custa 2", F.custoPeMaximoDaPassiva(1), 2);
t("Nível 2 custa 4", F.custoPeMaximoDaPassiva(2), 4);
t("Nível 5 custa 10", F.custoPeMaximoDaPassiva(5), 10);

/* E os dois que ele NÃO deu saem da mesma regra, sem interpolação nenhuma. */
t("Nível 3 custa 6", F.custoPeMaximoDaPassiva(3), 6);
t("Nível 4 custa 8", F.custoPeMaximoDaPassiva(4), 8);

/* ⚠ Técnica Máxima é o degrau acima do 5 e vale 6 no arquivo inteiro. */
t("Técnica Máxima custa 12", F.custoPeMaximoDaPassiva("max"), 12);

/* Lixo não vira custo. O `nivel` é campo digitado, e um valor sujo numa ficha
   velha não pode virar NaN dentro da conta do PE. */
t("nivel indefinido custa 0", F.custoPeMaximoDaPassiva(undefined), 0);
t("nivel lixo custa 0", F.custoPeMaximoDaPassiva("abacaxi"), 0);
t("nivel negativo custa 0", F.custoPeMaximoDaPassiva(-3), 0);

/* ============================================================ */
/* 2. ⚠ NÃO É A TABELA DE CUSTO POR USO                          */
/* ============================================================ */

/* As duas existem, são sobre PE, e são DIFERENTES. Elas empatam no Nível 1 por
   coincidência, e é justamente esse empate que torna o engano plausível. */
t("a de custo por uso continua sendo a do livro",
  F.FEITICO_CUSTO_PE, { 0: 0, 1: 2, 2: 5, 3: 8, 4: 12, 5: 20, max: 25 });
t("as duas empatam SÓ no nivel 1",
  [0, 1, 2, 3, 4, 5, "max"].filter((n) => F.FEITICO_CUSTO_PE[n] === F.custoPeMaximoDaPassiva(n)),
  [0, 1]);
/* O zero empata porque as duas são zero, e isso é acordo e não regra comum. */
t("no nivel 2 elas ja divergem", [F.FEITICO_CUSTO_PE[2], F.custoPeMaximoDaPassiva(2)], [5, 4]);
t("e na Tecnica Maxima a distancia e a maior",
  [F.FEITICO_CUSTO_PE.max, F.custoPeMaximoDaPassiva("max")], [25, 12]);

/* ============================================================ */
/* 3. É DIVERGÊNCIA, E A CONTRAPROVA É A CRIATURA                */
/* ============================================================ */

t("a divergencia esta na tabela e ligada",
  S.DIVERGENCIAS.find((d) => d.id === "passivaCustaPeMaximo")?.ativa, true);
t("e ela e de REGRA, porque muda numero",
  S.DIVERGENCIAS.find((d) => d.id === "passivaCustaPeMaximo")?.tipo, "regra");
t("o ramo do jogador e o do jogador", S.regraDo("player", "passivaCustaPeMaximo"), "player");
t("e o da criatura e o da criatura", S.regraDo("afty", "passivaCustaPeMaximo"), "afty");

const quatro = [passiva("Olho Bom", 1), passiva("Pele Dura", 5), passiva("Tique", 0), passiva("Ápice", "max")];

/* ⚠ A CONTRAPROVA. A criatura do /Afty tem as MESMAS quatro Passivas e o PE dela
   não se mexe. Sem este assert, ligar a regra no lugar errado (no canal `pe`, por
   exemplo) passaria despercebido: o número do jogador sairia certo e o da
   criatura mudaria calado. */
t("a criatura nao paga nada pelas quatro", pe("afty", quatro), pe("afty", []));
t("e o jogador paga 2 + 10 + 0 + 12", pe("player", []) - pe("player", quatro), 24);

/* A função também responde direto, e responde zero na criatura. */
t("peMaximoDasPassivas devolve zero no afty", F.peMaximoDasPassivas(quatro, "afty"), { total: 0, linhas: [] });
t("e 24 no player", F.peMaximoDasPassivas(quatro, "player").total, 24);

/* ============================================================ */
/* 4. "PARA CADA PASSIVA"                                        */
/* ============================================================ */

t("uma Passiva de nivel 3 tira 3 vezes 2",
  pe("player", []) - pe("player", [passiva("A", 3)]), 6);
t("duas iguais tiram o dobro",
  pe("player", []) - pe("player", [passiva("A", 3), passiva("B", 3)]), 12);
t("tres iguais tiram o triplo",
  pe("player", []) - pe("player", [passiva("A", 3), passiva("B", 3), passiva("C", 3)]), 18);

/* Nível 0 é de graça E não vira linha. Uma linha de valor zero no hover é ruído,
   e é a mesma régua do "o que vale zero não aparece nem como zero". */
t("a Passiva de nivel 0 nao cobra", pe("player", [passiva("Tique", 0)]), pe("player", []));
t("e nao entra na lista de linhas",
  F.peMaximoDasPassivas([passiva("Tique", 0)], "player").linhas, []);

/* ⚠ SÓ O TIPO "passivo". Um Dano de Nível 5 custa 20 PE por uso e zero do máximo. */
const dano5 = { ...F.createBlankFeitico(), nome: "Raio", tipo: "dano", nivel: 5 };
t("o Feitico de Dano nao encosta no PE Maximo", pe("player", [dano5]), pe("player", []));

/* ⚠ VARIAÇÃO DE LIBERAÇÃO NÃO COBRA. Ela aponta o original em `variacaoDe` e é o
   mesmo Feitiço dito de outro jeito. Cobrasse aqui, declarar uma variação
   pagaria o PE Máximo duas vezes pela mesma característica. */
const original = passiva("Pele Dura", 5);
const variacao = { ...passiva("Pele Dura (aberta)", 5), variacaoDe: original.id };
t("a variacao nao paga de novo",
  pe("player", [original, variacao]), pe("player", [original]));

/* ============================================================ */
/* 5. O HOVER, UMA LINHA POR PASSIVA                             */
/* ============================================================ */

const d = ficha("player", quatro);
const linhasPassiva = d.partes.pe.filter((p) => /\(Passiva\)$/.test(p.label));

t("tres linhas, e nao quatro (o nivel 0 nao entra)", linhasPassiva.length, 3);
t("cada uma leva o NOME da Passiva",
  linhasPassiva.map((p) => p.label),
  ["Olho Bom (Passiva)", "Pele Dura (Passiva)", "Ápice (Passiva)"]);
t("e o valor de cada uma e negativo",
  linhasPassiva.map((p) => p.valor), [-2, -10, -12]);

/* ⚠ AS PARCELAS FECHAM COM O TOTAL. É a regra que o `defesaAtributo` e a
   `Quantidade de PE` já custaram: número certo com detalhamento errado é bug. */
t("as parcelas do hover somam o PE",
  d.partes.pe.reduce((soma, p) => soma + (p.valor ?? 0), 0), d.pe);

/* E na criatura o hover não ganha linha nenhuma, porque não há parcela. */
t("o hover da criatura nao tem linha de Passiva",
  ficha("afty", quatro).partes.pe.filter((p) => /\(Passiva\)$/.test(p.label)), []);

/* ============================================================ */
/* 6. A LINHA DO FEITIÇO CARREGA O NÚMERO                        */
/* ============================================================ */

/* ⚠ A TELA NÃO RECALCULA. O `custoPeMaximo` sai pronto do motor, pela mesma
   convenção do resto da linha, senão o card do criador e a linha da Ficha
   divergem na primeira errata. */
const porNome = Object.fromEntries(d.feiticos.lista.map((l) => [l.nome, l.custoPeMaximo]));
t("a linha de cada Passiva traz o custo dela",
  porNome, { "Olho Bom": 2, "Pele Dura": 10, "Tique": null, "Ápice": 12 });
t("e na criatura a linha nao traz numero nenhum",
  ficha("afty", quatro).feiticos.lista.map((l) => l.custoPeMaximo), [null, null, null, null]);

/* ============================================================ */
/* 7. ⚠ O MÁXIMO PODE FICAR NEGATIVO, A PILHA CORRENTE NÃO       */
/* ============================================================ */

/* Decisão do autor, perguntada antes de escrever: *"Pode ficar negativo"*. Um
   Nível 1 com três Passivas caras é o caso extremo, e ele existe. */
const afundado = ficha("player", [passiva("A", 5), passiva("B", 5), passiva("C", "max")], 1);
t("o PE Maximo afunda abaixo de zero", afundado.pe < 0, true);
t("e o hover continua fechando com ele",
  afundado.partes.pe.reduce((soma, p) => soma + (p.valor ?? 0), 0), afundado.pe);

/* ⚠ OS TRÊS CAMINHOS DE SESSÃO APARAM EM ZERO. O `sessaoEmBranco` era o único
   que não aparava, e a diferença não tinha como aparecer antes desta regra:
   nada podia derivar negativo. Com ela, um combatente novo num Encontro nascia
   com o PE corrente negativo (o `afty-encontro.js` monta a sessão por ali e não
   chama `aparaSessao` na criação). */
const nova = SES.sessaoEmBranco(afundado);
t("sessaoEmBranco apara o PE corrente em zero", nova.peAtual, 0);
t("aparaSessao tambem", SES.aparaSessao(nova, afundado).peAtual, 0);
t("descansar tambem", SES.descansar(nova, afundado).peAtual, 0);
/* E o PV não foi de carona: ele nunca pôde ser negativo e continua igual. */
t("o PV da sessao continua sendo o PV derivado", nova.hpAtual, afundado.hp);

/* ============================================================ */
/* 8. A FICHA FINAL: A PASSIVA NÃO MORA NA LISTA DE FEITIÇOS     */
/* ============================================================ */

/* ⚠ ESTA SEÇÃO EXISTE PORQUE EU ERREI DE TELA. O número foi escrito primeiro na
   linha de Feitiço da aba Ações, que é onde os outros cinco tipos aparecem, e lá
   ele era CÓDIGO MORTO: o `AbaAcoes` filtra `f.tipo !== "passivo"` desde sempre,
   e a Passiva tem seção própria ("Passivos e Características") na aba
   Habilidades. Assert não renderiza, e foi o navegador que pegou.

   Aqui fica preso o lugar CERTO, para o número não sumir da tela num refactor
   sem nada ficar vermelho. */

function fichaDaCriatura(sistema) {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.name = "Cobaia";
  f.core = { ...f.core, nd: 12, tipo: "misto", patamar: "comum",
    origem: { ...(f.core.origem ?? {}), id: "inato" } };
  f.especializacoes = [{ id: "conjurador", nivel: 12 }];
  f.attributes = { forca: 10, destreza: 14, constituicao: 14, inteligencia: 16, sabedoria: 12, presenca: 12 };
  f.feiticos = [passiva("Olho Bom", 1), passiva("Pele Dura", 5), passiva("Tique", 0)];
  return f;
}

const rotulos = (sistema) => {
  const cru = fichaDaCriatura(sistema);
  return conteudoDaFicha(cru, deriveAfty(cru))
    .filter((i) => i.grupo === "passivo")
    .map((i) => [i.nome, i.tags.map((t) => t.label)]);
};

t("no jogador cada Passiva leva o nivel E o custo",
  rotulos("player"),
  [["Olho Bom", ["Nível 1", "-2 PE"]],
   ["Pele Dura", ["Nível 5", "-10 PE"]],
   ["Tique", ["Nível 0"]]]);

/* ⚠ A CONTRAPROVA DE TELA. Na criatura a mesma lista sai só com o nível. */
t("na criatura sai so o nivel",
  rotulos("afty"),
  [["Olho Bom", ["Nível 1"]],
   ["Pele Dura", ["Nível 5"]],
   ["Tique", ["Nível 0"]]]);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
