/**
 * A LISTA DE PERÍCIAS DA FICHA — 2026-08-30
 *
 * Três decisões do autor no mesmo dia, e todas mexem em quem entra na lista:
 *   1. todas as perícias do livro ficam à mostra (o painel de Sugestões saiu),
 *   2. contagem ímpar ganha um Ofício a mais, para as duas colunas fecharem,
 *   3. só perícia personalizada pode ser removida.
 *
 * O que este arquivo prende é o que some calado: uma ficha antiga que perde a
 * ordem, um Ofício repetido que evapora levando a vaga gasta junto, e um Ofício
 * que mostra a escolha do vizinho.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty, mesclaFichaAfty } = await import(R + "afty-schema.js");
const P = await import(R + "afty-pericias.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ficha = (extra = {}) => {
  const f = createBlankAfty();
  f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum" };
  f.attributes = { forca: 12, destreza: 12, constituicao: 12, inteligencia: 16, sabedoria: 12, presenca: 12 };
  return { ...f, ...extra };
};
const idsDe = (f) => P.catalogoPericiasDaFicha(f).map((p) => p.id);

/* ============================================================ */
/* 1. TODAS AS PERÍCIAS DO LIVRO, SEMPRE                         */
/* ============================================================ */

const COMPLEMENTARES = P.periciasComplementares().map((p) => p.id);
t("o livro tem tres complementares", COMPLEMENTARES.length, 3);

const branca = idsDe(ficha());
t("a ficha em branco traz as vinte do livro", branca.length, P.AFTY_PERICIAS.length);
t("e as complementares estao entre elas",
  COMPLEMENTARES.every((id) => branca.includes(id)), true);
t("na ordem do catalogo", branca, P.AFTY_PERICIAS.map((p) => p.id));

/* ⚠ VINTE É PAR, e é por isso que o Ofício de desempate não aparece numa ficha
   nova. Se o livro ganhar uma perícia, ele passa a aparecer sozinho, e este
   assert é quem conta a história. */
t("vinte e par, entao nao ha Oficio de desempate", branca.length % 2, 0);
t("e so ha um Oficio", branca.filter((id) => P.ehPericiaOficio(id)).length, 1);

/* ⚠ A FICHA SALVA ANTES DE HOJE só tem as dezessete padrão gravadas, e as três
   que faltam voltam NA POSIÇÃO DELAS. Empilhá-las no fim jogaria Direção,
   Sobrevivência e Teologia para baixo de tudo em toda ficha existente. */
const antiga = idsDe(ficha({
  periciasOrdem: P.AFTY_PERICIAS.filter((p) => !p.complementar).map((p) => p.id),
}));
t("a ficha antiga recebe as complementares de volta", antiga, P.AFTY_PERICIAS.map((p) => p.id));

/* E a ordem escolhida pela mesa continua valendo: quem foi arrastado para o
   topo fica no topo, e a que faltava entra ao lado da vizinha de catálogo. */
const reordenada = idsDe(ficha({ periciasOrdem: ["teologia", "atletismo", "acrobacia"] }));
const posDe = (lista, id) => lista.indexOf(id);
t("a ordem escolhida sobrevive, uma perto da outra",
  [posDe(reordenada, "teologia") < posDe(reordenada, "atletismo"),
    posDe(reordenada, "atletismo") < posDe(reordenada, "acrobacia")],
  [true, true]);
t("e Direcao entra logo depois de Atletismo, a vizinha de catalogo",
  reordenada[posDe(reordenada, "atletismo") + 1], "direcao");
t("sem perder ninguem", [...reordenada].sort(), [...P.AFTY_PERICIAS.map((p) => p.id)].sort());

/* Uma ordem com lixo dentro (id que não existe, id repetido) não quebra e não
   duplica linha. */
const suja = idsDe(ficha({ periciasOrdem: ["atletismo", "atletismo", "nao_existe", "teologia"] }));
t("id repetido e id inventado somem", suja.length, P.AFTY_PERICIAS.length);
t("e a ordem pedida continua de pe", posDe(suja, "atletismo") < posDe(suja, "teologia"), true);

/* ============================================================ */
/* 2. O OFÍCIO DE DESEMPATE                                      */
/* ============================================================ */

const comCustom = (n, extra = {}) => ficha({
  periciasPersonalizadas: Array.from({ length: n }, (_, i) => ({
    id: `custom_x${i}`, nome: `Homebrew ${i}`, atributo: "inteligencia",
  })),
  ...extra,
});

const impar = idsDe(comCustom(1));
t("uma personalizada deixa a conta impar e entra um Oficio", impar.length, 22);
/* ⚠ ELE ENTRA LOGO ABAIXO DO OFÍCIO DO LIVRO (autor, 2026-08-30), e não no fim
   da lista: os dois são a mesma perícia. */
t("o extra vem logo depois do Oficio do livro",
  impar[impar.indexOf("oficio") + 1], "oficio__2");
t("e agora sao dois Oficios", impar.filter((id) => P.ehPericiaOficio(id)).length, 2);

/* Se o Ofício do livro foi arrastado, os extras vão junto com ele. */
const arrastado = idsDe(comCustom(1, { periciasOrdem: ["oficio", "atletismo"] }));
t("o extra segue o Oficio para onde ele for",
  arrastado[arrastado.indexOf("oficio") + 1], "oficio__2");
t("e o Oficio subiu na lista, como a ordem pedia",
  arrastado.indexOf("oficio") < arrastado.indexOf("atletismo"), true);

t("duas personalizadas fecham par sozinhas", idsDe(comCustom(2)).length, 22);
t("e sem Oficio extra", idsDe(comCustom(2)).includes("oficio__2"), false);

/* ⚠ O EXTRA QUE JÁ TEM ESCOLHA NÃO SOME. Sem isso, criar a segunda perícia
   personalizada apagaria da tela um Ofício treinado, e a vaga gasta nele iria
   junto sem ninguém avisar. */
const ocupado = comCustom(2, { pericias: { oficio__2: "mestre" } });
const idsOcupado = idsDe(ocupado);
t("o Oficio extra treinado fica mesmo com a conta par", idsOcupado.includes("oficio__2"), true);
t("e o desempate vira o proximo, que a conta virou impar de novo",
  idsOcupado.slice(idsOcupado.indexOf("oficio"), idsOcupado.indexOf("oficio") + 3),
  ["oficio", "oficio__2", "oficio__3"]);
t("sao 24 linhas, par de novo", idsOcupado.length, 24);

/* Guardar Ofícios (sem treinar) também segura a linha. */
t("escolher um Oficio na linha extra tambem a segura",
  idsDe(comCustom(2, { periciaOficios: { oficio__2: ["Ferreiro"] } })).includes("oficio__2"), true);

/* O id do extra nunca colide com uma personalizada, que usa outro prefixo. */
t("o id do extra nao e de personalizada", "oficio__2".startsWith("custom_"), false);
t("e ehPericiaOficio reconhece os dois",
  [P.ehPericiaOficio("oficio"), P.ehPericiaOficio("oficio__2"), P.ehPericiaOficio("oficios"),
    P.ehPericiaOficio("atletismo"), P.ehPericiaOficio(null)],
  [true, true, false, false, false]);

/* ============================================================ */
/* 3. CADA OFÍCIO É UM OFÍCIO DE VERDADE                         */
/* ============================================================ */

/* ⚠ PROFICIÊNCIA PRÓPRIA E OFÍCIOS PRÓPRIOS (autor, 2026-08-30): dá para ser
   Treinado num e Mestre em outro. Se as duas linhas lessem a mesma chave, a
   segunda não serviria para nada. */
const dosDois = deriveAfty(comCustom(1, {
  pericias: { oficio: "treinado", oficio__2: "mestre" },
  periciaOficios: { oficio: ["Ferreiro"], oficio__2: ["Cozinheiro"] },
})).testes;
const linhaOficio = (id) => dosDois.pericias.find((p) => p.id === id);

t("cada linha tem a sua proficiencia",
  [linhaOficio("oficio").prof, linhaOficio("oficio__2").prof], ["treinado", "mestre"]);
t("e o seu nome",
  [linhaOficio("oficio").nome, linhaOficio("oficio__2").nome],
  ["Ofício (Ferreiro)", "Ofício (Cozinheiro)"]);
t("os numeros diferem, porque Mestre soma mais",
  linhaOficio("oficio__2").bonus > linhaOficio("oficio").bonus, true);

/* ⚠ E ELE GASTA VAGA. O orçamento soma a lista MOSTRADA, então uma linha que
   sumisse levaria o gasto junto, e o medidor mentiria para menos. */
const semExtra = deriveAfty(comCustom(1, { pericias: { oficio: "treinado" } })).testes.orcamento;
const comExtra = deriveAfty(comCustom(1, {
  pericias: { oficio: "treinado", oficio__2: "mestre" },
})).testes.orcamento;
t("o Oficio extra gasta as vagas dele", comExtra.pericias - semExtra.pericias, 2);

/* ⚠ OFÍCIO É INTELIGÊNCIA, E PONTO (autor, 2026-08-30). Ele era a única perícia
   com atributo variável, e trocava para Sabedoria quando o modificador dela fosse
   maior: o número da linha mudava sozinho ao mexer num atributo que não é o dela. */
const sabAlta = deriveAfty(ficha({
  attributes: { forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 20, presenca: 10 },
})).testes.pericias;
const oficioSab = sabAlta.find((x) => x.id === "oficio");
t("Ofício segue em Inteligência mesmo com Sabedoria maior", oficioSab.atributo, "inteligencia");
t("e o hover nomeia Inteligência", oficioSab.partes[0].label, "Inteligência");
t("nenhuma perícia troca de atributo sozinha",
  sabAlta.every((x) => x.atributo === (P.getPericia(x.id.replace(/__\d+$/, ""))?.atributo ?? x.atributo)), true);

/* Os três formatos de `periciaOficios` que já existiram em ficha salva. */
t("formato novo: objeto por id",
  P.oficiosDaFicha({ periciaOficios: { oficio: ["Ferreiro"], oficio__2: ["Cozinheiro"] } }, "oficio__2"),
  ["Cozinheiro"]);
t("formato antigo: lista solta vale para o Oficio do livro",
  [P.oficiosDaFicha({ periciaOficios: ["Ferreiro"] }),
    P.oficiosDaFicha({ periciaOficios: ["Ferreiro"] }, "oficio__2")],
  [["Ferreiro"], []]);
t("formato mais antigo: nome unico", P.oficiosDaFicha({ periciaOficio: "Ferreiro" }), ["Ferreiro"]);
t("nome repetido e espaco em branco somem",
  P.oficiosDaFicha({ periciaOficios: { oficio: ["Ferreiro", " Ferreiro ", "  ", ""] } }),
  ["Ferreiro"]);

/* A migração da abertura converte os dois formatos antigos, e não perde nada. */
t("a abertura migra a lista solta",
  mesclaFichaAfty({ periciaOficios: ["Ferreiro", "Cozinheiro"] }).periciaOficios,
  { oficio: ["Ferreiro", "Cozinheiro"] });
t("e o nome unico", mesclaFichaAfty({ periciaOficio: "Ferreiro" }).periciaOficios, { oficio: ["Ferreiro"] });
t("ficha nova abre com o mapa vazio", mesclaFichaAfty({}).periciaOficios, {});
t("e o formato novo passa inteiro",
  mesclaFichaAfty({ periciaOficios: { oficio__2: ["Cozinheiro"] } }).periciaOficios,
  { oficio__2: ["Cozinheiro"] });

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
