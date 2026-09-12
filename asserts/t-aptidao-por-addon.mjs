/**
 * APTIDÃO CONCEDIDA POR ADDON, e o pacote Faixas de Sif (autor, 2026-09-12).
 *
 * Pedido: *"um dos efeitos da Habilidade Única (criada com o Narrador) é receber
 * a Aptidão Amaldiçoada de Maldição 'Armas Naturais Aprimorada' mesmo sem ser
 * uma Maldição. Faça um Addon para tal."*
 *
 * As três decisões, por pergunta:
 *   1. Só com as Faixas EQUIPADAS, como todo efeito de Habilidade Única.
 *   2. Concede Armas Naturais E Armas Naturais Aprimoradas, porque a segunda
 *      exige a primeira no livro e as escadas das duas somam.
 *   3. Vale nos dois sistemas.
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. O pacote valida, e o campo `concedeAptidoes` SOBREVIVE ao normalizador (a
 *    biblioteca grava o pacote normalizado, e campo desconhecido some calado).
 * 2. A concessão liga e desliga com o item equipado, nos dois sistemas.
 * 3. As regras de concessão por nome: não gasta vaga, conta para requisito de
 *    terceiros, some no Restringido, não vaza para quem não tem o addon.
 * 4. O NÚMERO, contra o `deriveAfty` inteiro: dado desarmado, Nível de Dano e
 *    Fineza. Aptidão que entra na lista e não mexe em número seria o efeito
 *    descartado calado.
 * 5. A fonte que a tela escreve, e o namespace de Aptidão do próprio pacote.
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

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const cru = JSON.parse(readFileSync(new URL("../addons/faixas-de-sif.json", import.meta.url), "utf8"));
const pacote = A.normalizarPacote(cru);
const AMBAS = ["mal_armas_naturais", "mal_armas_naturais_aprimoradas"];

/* ============================================================ */
/* 1. O PACOTE                                                   */
/* ============================================================ */
t("o pacote valida sem problema nenhum", A.validarPacote(pacote), []);
t("o campo sobrevive ao normalizador", pacote.concedeAptidoes,
  [{ aptidoes: AMBAS, enquantoEquipado: "arm_faixas" }]);
t("e sobrevive a uma segunda normalização", A.normalizarPacote(pacote).concedeAptidoes, pacote.concedeAptidoes);
t("o item citado existe no catálogo", EQ.getEquipamento("arma", "arm_faixas")?.nome, "Faixas");

const soConcede = (concedeAptidoes) => ({ id: "teste", nome: "Teste", paraRaw: "afty", concedeAptidoes });
t("pacote que só concede não é pacote vazio", A.validarPacote(soConcede([{ aptidoes: ["mal_armas_naturais"] }])), []);
t("Aptidão inexistente é recusada",
  A.validarPacote(soConcede([{ aptidoes: ["mal_asas_de_papel"] }])).some((p) => p.includes("inexistente")), true);
t("lista vazia é recusada",
  A.validarPacote(soConcede([{ aptidoes: [] }])).some((p) => p.includes("vazia")), true);
t("sem item, a concessão não tem condição",
  A.normalizarPacote(soConcede([{ aptidoes: ["mal_armas_naturais"] }])).concedeAptidoes[0].enquantoEquipado, null);

/* ============================================================ */
/* 2. EQUIPADO LIGA, DESEQUIPADO DESLIGA                         */
/* ============================================================ */
const ficha = (sistema, { equipado = true, addon = true, nd = 9, attributes = null, origem = null } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd, ...(origem ? { origem: { id: origem } } : {}) };
  if (attributes) f.attributes = { ...f.attributes, ...attributes };
  if (addon) f.addons = [pacote];
  f.equipamentos = { itens: [{ uid: "faixa_1", tipo: "arma", refId: "arm_faixas", qtd: 1, equipado }] };
  return f;
};
const aptidoes = (f) => deriveAfty(f).aptidoesEscolhidas;

for (const s of ["player", "afty"]) {
  t(`${s}: equipada concede as duas`, aptidoes(ficha(s)), AMBAS);
  t(`${s}: desequipada não concede nada`, aptidoes(ficha(s, { equipado: false })), []);
  t(`${s}: sem o addon, equipada não concede nada`, aptidoes(ficha(s, { addon: false })), []);
  const outroItem = ficha(s);
  outroItem.equipamentos.itens.push({ uid: "manopla", tipo: "arma", refId: "arm_manoplas", qtd: 1, equipado: true });
  outroItem.equipamentos.itens[0].equipado = false;
  t(`${s}: outro item equipado não serve`, aptidoes(outroItem), []);
}

/* ============================================================ */
/* 3. AS REGRAS DE CONCESSÃO POR NOME                            */
/* ============================================================ */
const d = deriveAfty(ficha("player"));
t("as duas entram como concedidas", d.aptidoesConcedidas, AMBAS);
t("e nenhuma é da origem nem da Especialização",
  [d.aptidoesConcedidasOrigem, d.aptidoesConcedidasEspecializacao], [[], []]);
/* A Aprimorada pede Nível 5 e Armas Naturais. Concedida, entra no Nível 1. */
t("ignora o pré-requisito de Nível", aptidoes(ficha("player", { nd: 1 })), AMBAS);
/* O Restringido não tem Aptidão nenhuma, nem dada por item. Ele é o Tipo na
   criatura e a Especialização no jogador, e não a origem. */
const restringidoCriatura = ficha("afty");
restringidoCriatura.core.tipo = "restringido";
t("some no Restringido da criatura", aptidoes(restringidoCriatura), []);
const restringidoJogador = ficha("player");
restringidoJogador.especializacoes = [{ id: "restringido", nivel: 9 }];
t("some no Restringido do jogador", aptidoes(restringidoJogador), []);
/* Encontro misto: derivar quem tem e depois quem não tem não pode vazar. */
deriveAfty(ficha("afty"));
t("não vaza para o vizinho sem addon", aptidoes(ficha("afty", { addon: false })), []);
/* Marcada à mão E concedida não duplica. */
const marcada = ficha("player");
marcada.aptidoesAmaldicoadas = ["mal_armas_naturais"];
t("marcada à mão não duplica", aptidoes(marcada), AMBAS);

/* ============================================================ */
/* 4. O NÚMERO                                                   */
/* ============================================================ */
const basico = (f) => deriveAfty(f).dano.entradas.find((e) => e.id === "basico");

/* Jogador, Nível 9: a Aprimorada faz o dado desarmado ser 2d10, e o "+1 nível de
   dano no 8" sobe um degrau. As escadas são o dado BASE no jogador e por isso
   não somam de novo (ESCADAS_DESARMADO_NO_MOTOR). */
const comJogador = basico(ficha("player"));
t("jogador: o dado base é o da Aprimorada", comJogador.partes[0], { label: "Armas Naturais Aprimoradas", texto: "2d10" });
t("jogador: e sobe um Nível de Dano", comJogador.niveisDano, 1);
t("jogador: o golpe fica 1d12 + 1d10", comJogador.texto, "1d12 + 1d10");
t("jogador: desequipada o golpe volta ao desarmado",
  basico(ficha("player", { equipado: false })).niveisDano, 0);

/* Criatura, ND 9: as escadas SÃO Nível de Dano. Armas Naturais sobe 2 (5 e 9),
   a Aprimorada sobe 3 (o "se torna 1d10", mais 5 e 9) e o bônus sobe 1 (8). */
const niveisCriatura = (opcoes) => basico(ficha("afty", opcoes)).niveisDano;
t("criatura: as três linhas somam seis Níveis de Dano",
  niveisCriatura() - niveisCriatura({ equipado: false }), 6);

/* A Fineza das Armas Naturais é a razão de conceder as duas: sem ela, o golpe de
   quem tem Destreza alta seguiria na Força. */
const destro = { forca: 10, destreza: 18 };
t("com as Faixas, o golpe usa a Destreza", basico(ficha("player", { attributes: destro })).atributo, "destreza");
t("sem elas, volta à Força", basico(ficha("player", { attributes: destro, equipado: false })).atributo, "forca");

/* ⚠ E A FINEZA DA MALDIÇÃO DE VERDADE, sem addon nenhum. Ela estava morta desde
   2026-09-01: a linha mirava `corpo`, e o canal passou a ser lido pelo escopo da
   linha. Nenhuma Maldição atacava com Destreza, e nada avisava. */
const maldicao = createBlankAfty();
maldicao.rulesVersion = "afty";
maldicao.core = { ...maldicao.core, nd: 9, origem: { id: "maldicao" } };
maldicao.attributes = { ...maldicao.attributes, ...destro };
maldicao.aptidoesAmaldicoadas = ["mal_armas_naturais"];
t("a Maldição com Armas Naturais usa a Destreza", basico(maldicao).atributo, "destreza");

/* O canal de Fineza é lido pelo escopo da linha. Alvo de TIPO de ataque nele é
   linha declarada que ninguém escuta, que foi exatamente o defeito acima. */
const CONTEUDO = await import(R + "afty-efeitos-conteudo.js");
const linhasDeFineza = Object.entries(CONTEUDO)
  .filter(([, v]) => v && typeof v === "object" && !Array.isArray(v))
  .flatMap(([mapa, v]) => Object.entries(v).flatMap(([id, linhas]) =>
    (Array.isArray(linhas) ? linhas : [])
      .filter((l) => l?.canal === "finezaAtaque")
      .map((l) => ({ onde: `${mapa}.${id}`, alvo: l.alvo }))));
/* Varredura que não acha nada passa sempre. As três do livro têm de aparecer. */
t("a varredura enxerga as linhas de Fineza do livro", linhasDeFineza.length >= 3, true);
t("nenhuma linha de Fineza mira tipo de ataque",
  linhasDeFineza.filter((l) => ["corpo", "distancia", "amaldicoado"].includes(l.alvo)).map((l) => l.onde), []);

/* ============================================================ */
/* 5. A FONTE E O NAMESPACE                                      */
/* ============================================================ */
t("a fonte é o item, e o pacote vai junto",
  d.aptidoesConcedidasAddon.map((c) => [c.id, c.fonte, c.item, c.addonNome]),
  AMBAS.map((id) => [id, "Faixas", "Faixas", "Faixas de Sif"]));
t("sem item, a fonte é o nome do pacote",
  A.aptidoesConcedidasPorAddon({ addons: [soConcede([{ aptidoes: ["mal_armas_naturais"] }])] })
    .map((c) => c.fonte), ["Teste"]);
/* Aptidão do próprio pacote ganha o namespace, como toda referência a irmão. */
const comPropria = {
  ...soConcede([{ aptidoes: ["garras_de_sif", "mal_armas_naturais"] }]),
  acrescenta: { aptidoes: [{ id: "garras_de_sif", nome: "Garras de Sif" }] },
};
t("a Aptidão do pacote ganha o namespace e a do livro fica crua",
  A.aptidoesConcedidasPorAddon({ addons: [comPropria] }).map((c) => c.id),
  ["teste:garras_de_sif", "mal_armas_naturais"]);
t("e o validador aceita a própria", A.validarPacote(comPropria).some((p) => p.includes("inexistente")), false);

/* ============================================================ */
if (bad.length) {
  console.log(`FALHAS (${bad.length}):`);
  for (const b of bad) console.log("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
