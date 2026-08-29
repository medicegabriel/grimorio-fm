/* O DOMÍNIO SIMPLES ganhou área e custo em PE (2026-08-28), e com eles as três
   etapas do Treino de Novo Estilo das Sombras que viviam só no texto do card:

     2ª  "A área do seu Domínio Simples aumenta em 3 metros."
     3ª  "O custo para erguer um Domínio Simples é reduzido em um valor igual a
          seu Nível de Aptidão em Domínio, com mínimo de 1."
     4ª  "Reduz o custo de sustentação do Novo Estilo das Sombras em um valor
          igual a Metade de Sua Maestria."

   As duas decisões do autor no mesmo dia, e as duas estão medidas aqui:
     1. o modelo de custo é SÓ DO ADDON. O livro cru usa Concentração e
        Durabilidade e não cobra nada por rodada, então a sustentação nasce em
        zero e só o remendo a liga;
     2. o piso de 1 PE vale para a 4ª etapa também, mas ele NÃO inventa custo:
        quem não imbuiu Técnica nenhuma continua pagando zero.

   O mecanismo do remendo está em t-remendo.mjs e o conteúdo do pacote em
   t-estilo-conteudo.mjs. Aqui são os números. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
import { readFileSync } from "node:fs";

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const APT = await import(R + "afty-aptidoes.js");
const EF = await import(R + "afty-efeitos.js");
const DS = await import(R + "afty-dominio-simples.js");

const PACOTE = JSON.parse(
  readFileSync(new URL("./exemplo-estilo-liberado.json", import.meta.url), "utf8"),
);

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const TREINO = "estilo-liberado:novo_estilo_das_sombras";
const CANAIS = ["areaDominioSimples", "custoErguerDominio", "custoSustentarDominio", "custoSustentarEstilo"];

/* ============================================================ */
/* 1. Os quatro canais existem e rodam no passe certo            */
/* ============================================================ */

for (const id of CANAIS) {
  t(`o canal ${id} existe`, EF.EFEITO_CANAIS.some((c) => c.id === id), true);
  /* ⚠ TÊM de estar no passe pós-aptidão. No pré-contexto a variável `dom` ainda
     não existe, e no estágio principal o resolvedor já rodou: nos dois casos o
     efeito seria descartado calado, que é a armadilha de sempre. */
  t(`e roda no passe pos-aptidao`, EF.CANAIS_POS_APTIDAO.includes(id), true);
}
/* Canal fora de grupo cai em "Outros" no seletor do Motor, e some do olho de
   quem procura. Os quatro moram em Barreira e Domínio. */
const grupoBD = EF.EFEITO_CANAL_GRUPOS.find((g) => g.label === "Barreira e Domínio");
t("os quatro estao no grupo Barreira e Dominio",
  CANAIS.every((id) => grupoBD.itens.some((c) => c.id === id)), true);

/* ============================================================ */
/* 2. O livro CRU: área e 5 PE, e sustentação nenhuma            */
/* ============================================================ */

const fichaCrua = (nd, dom) => {
  const c = createBlankAfty();
  c.core.nd = nd;
  c.core.origem = { id: "sem_tecnica" };
  c.aptidoes = { dom };
  c.aptidoesAmaldicoadas = ["dominio_simples"];
  return deriveAfty(c);
};

const cru = fichaCrua(12, 3).dominioSimples;
t("a criatura tem a aptidao", cru.tem, true);
t("area = 1,5 + Nivel de Dominio x 1,5", cru.area, 6);
t("erguer custa os 5 PE do livro", cru.custoErguer, 5);
/* ⚠ A decisão do autor: sem o Addon NÃO existe custo por rodada. O texto do
   livro usa Concentração e Durabilidade, e cobrar 2 PE aqui seria pôr na ficha
   de todo mundo um custo que o livro dela não menciona. */
t("o livro cru NAO tem sustentacao", cru.sustenta, false);
t("e ela vale zero", [cru.custoSustentar, cru.custoSustentarEstilo], [0, 0]);

t("com DOM 0 a area e so a base", fichaCrua(12, 0).dominioSimples.area, 1.5);
t("com DOM 5 a area sobe junto", fichaCrua(12, 5).dominioSimples.area, 9);

/* Sem a aptidão não há Domínio Simples, e o card não é montado. */
const semAptidao = (() => {
  const c = createBlankAfty();
  c.core.nd = 12;
  c.core.origem = { id: "inato" };
  c.aptidoes = { dom: 3 };
  return deriveAfty(c);
})();
t("quem nao tem a aptidao nao tem Dominio Simples", semAptidao.dominioSimples.tem, false);

/* ============================================================ */
/* 3. Com o Addon: o modelo de custo inteiro                     */
/* ============================================================ */

t("o pacote passa no validador", AD.validarPacote(PACOTE), []);
t("e aplica sem problema", AD.aplicarAddons([PACOTE]).problemas, []);

/* O remendo é troca de CAMPO: ele entrega a tabela inteira, e não meia. */
t("o remendo trouxe a tabela de custo",
  APT.getAptidao("dominio_simples").dominioSimples,
  { areaBase: 1.5, areaPorDom: 1.5, erguer: 5, erguerPorEstilo: 1, sustentar: 2, sustentarPorEstilos: 2 });

/* `etapas` é quantas etapas do Treino a criatura pegou, e `imb` quantas vezes a
   Técnica de Estilo está imbuída no Domínio Simples (estado de combate). */
const com = (etapas, dom, imb = 0, nd = 12) => {
  const c = createBlankAfty();
  c.core.nd = nd;
  c.core.origem = { id: "sem_tecnica" };
  c.addons = [PACOTE];
  c.aptidoes = { dom };
  c.aptidoesAmaldicoadas = ["dominio_simples"];
  if (etapas) c.treinamentos = { [TREINO]: etapas };
  if (imb) {
    c.estilosSombra = [{ id: "acerto", tipo: "tabela" }];
    c.combate = { ativo: true, estilo_ativo: true, estilo_acerto: imb };
  }
  return deriveAfty(c);
};

const base = com(0, 3);
t("o Addon liga a sustentacao", base.dominioSimples.sustenta, true);
t("2 PE por rodada, do dominio", base.dominioSimples.custoSustentar, 2);
t("sem Tecnica imbuida o Estilo nao custa nada", base.dominioSimples.custoSustentarEstilo, 0);
t("e a area continua a do livro", base.dominioSimples.area, 6);

/* "Para cada efeito de estilo escolhido, aumente em 1 PE o custo para erguer". */
t("cada Tecnica imbuida sobe 1 PE no erguer", com(0, 5, 3).dominioSimples.custoErguer, 8);
t("e a conta acompanha a combinacao", com(0, 5, 5).dominioSimples.custoErguer, 10);

/* "1 PE para cada Dois Estilos adicionados". Três fecham UM par, e o
   arredondamento para baixo é a regra geral do Afty. */
t("duas Tecnicas custam 1 PE de sustento", com(0, 5, 2).dominioSimples.custoSustentarEstilo, 1);
t("tres Tecnicas continuam custando 1", com(0, 5, 3).dominioSimples.custoSustentarEstilo, 1);
t("quatro custam 2", com(0, 5, 4).dominioSimples.custoSustentarEstilo, 2);
t("uma so nao fecha par", com(0, 5, 1).dominioSimples.custoSustentarEstilo, 0);

/* ============================================================ */
/* 4. As TRÊS etapas que este trabalho tirou do texto            */
/* ============================================================ */

/* 2ª etapa: "A área do seu Domínio Simples aumenta em 3 metros." */
t("a 1a etapa nao mexe na area", com(1, 3).dominioSimples.area, 6);
t("a 2a etapa soma 3 metros", com(2, 3).dominioSimples.area, 9);
t("e ela soma DEPOIS do Nivel de Dominio", com(2, 5).dominioSimples.area, 12);

/* 3ª etapa: erguer reduzido pelo Nível de Aptidão em Domínio, mínimo 1. */
t("a 2a etapa ainda nao baixa o erguer", com(2, 3).dominioSimples.custoErguer, 5);
t("a 3a etapa reduz pelo Nivel de Dominio", com(3, 3).dominioSimples.custoErguer, 2);
/* ⚠ O "com mínimo de 1" do texto. Com DOM 5 a redução comeria os 5 PE inteiros. */
t("e o minimo de 1 segura o erguer", com(3, 5).dominioSimples.custoErguer, 1);
t("com a Tecnica imbuida o piso deixa de morder", com(3, 5, 3).dominioSimples.custoErguer, 3);

/* 4ª etapa: sustentação do ESTILO reduzida em metade da Maestria (ND 12 = 4). */
t("a Maestria do ND 12 e 4", com(4, 5).maestria, 4);
t("a 4a etapa nao inventa custo com zero Tecnicas",
  com(4, 5).dominioSimples.custoSustentarEstilo, 0);
/* ⚠ A metade que a resposta do autor separou: o piso de 1 PE vale para o que se
   PAGA. Com 4 Técnicas a base é 2, a redução é 2, e o piso segura em 1. */
t("com 4 Tecnicas o piso segura em 1", com(4, 5, 4).dominioSimples.custoSustentarEstilo, 1);
t("com 6 Tecnicas a reducao aparece", com(4, 5, 6).dominioSimples.custoSustentarEstilo, 1);
/* ⚠ Sem o Completo as vagas param no Nível de Aptidão em Domínio, então as 6
   imbuições pedidas viram 5 e o sustento cai junto. O custo acompanha o que
   COUBE, e não o que a bancada pediu. */
t("sem o Completo as vagas aparam as imbuicoes", com(3, 5, 6).dominioSimples.imbuicoes, 5);
t("e as 5 que couberam custam 2 sem a 4a etapa",
  com(3, 5, 6).dominioSimples.custoSustentarEstilo, 2);
/* A 4ª etapa NÃO toca a sustentação do domínio em si: o texto dela diz "do Novo
   Estilo das Sombras", e são duas linhas separadas na regra do autor. */
t("a 4a etapa nao mexe nos 2 PE do dominio", com(4, 5, 6).dominioSimples.custoSustentar, 2);

/* ============================================================ */
/* 5. O hover não pode mentir                                    */
/* ============================================================ */
/* Número certo com detalhamento errado é bug: a soma das parcelas TEM de fechar
   o total, inclusive quando o piso morde. É para isso que ele vira parcela. */

const soma = (partes) => partes.reduce((s, p) => s + (p.valor ?? 0), 0);
const confereHover = (nome, d) => {
  const ds = d.dominioSimples;
  t(`${nome}: as fontes da area somam a area`, soma(ds.partesArea), ds.area);
  t(`${nome}: as fontes do erguer somam o erguer`, soma(ds.partesErguer), ds.custoErguer);
  t(`${nome}: as fontes do sustento somam`, soma(ds.partesSustentar), ds.custoSustentar);
  t(`${nome}: as fontes do sustento do Estilo somam`,
    soma(ds.partesSustentarEstilo), ds.custoSustentarEstilo);
};
confereHover("cru", fichaCrua(12, 3));
confereHover("addon sem treino", com(0, 5, 3));
confereHover("treino inteiro", com(4, 5, 6));
confereHover("piso mordendo no erguer", com(3, 5));
confereHover("piso mordendo no Estilo", com(4, 5, 4));

/* E o piso aparece NOMEADO, para o leitor saber por que a conta parou. */
const comPiso = com(3, 5).dominioSimples.partesErguer;
t("o piso vira uma parcela com nome",
  comPiso.some((p) => p.label === "Piso de 1 PE"), true);
t("e ele nao aparece quando nao morde",
  com(3, 3).dominioSimples.partesErguer.some((p) => p.label === "Piso de 1 PE"), false);
/* A redução entra NEGATIVA: ela abaixa a conta, e um valor positivo no painel
   diria o contrário do que o número faz. */
t("a reducao do Treino entra negativa",
  comPiso.find((p) => p.label.includes("Estilo"))?.valor < 0, true);

/* ============================================================ */
/* 6. O validador de catálogo                                    */
/* ============================================================ */

t("o catalogo de Aptidoes continua valido", APT.validarCatalogoAptidoes(), []);
t("uma tabela ausente e legitima", DS.validarCatalogoDominioSimples([{ id: "x" }]), []);
t("campo desconhecido e recusado",
  DS.validarCatalogoDominioSimples([{ id: "x", dominioSimples: { areaBse: 1 } }]).length, 1);
t("numero negativo e recusado",
  DS.validarCatalogoDominioSimples([{ id: "x", dominioSimples: { erguer: -1 } }]).length, 1);
/* Erguer zero seria mentira: o piso de 1 PE do sistema o levantaria de volta. */
t("erguer zero e recusado",
  DS.validarCatalogoDominioSimples([{ id: "x", dominioSimples: { erguer: 0 } }]).length, 1);
t("tabela que nao e objeto e recusada",
  DS.validarCatalogoDominioSimples([{ id: "x", dominioSimples: [1, 2] }]).length, 1);

/* Entrada suja não quebra o resolvedor: campo inválido cai no padrão. É a mesma
   convenção do resto do sistema, e o validador acima é quem faz barulho. */
const sujo = DS.resolveDominioSimples({
  def: { dominioSimples: { areaBase: "abc", erguer: null, sustentar: 2 } },
  tem: true, dom: 2,
});
t("campo invalido cai no padrao", [sujo.area, sujo.custoErguer], [4.5, 5]);
t("e o campo valido ao lado dele sobrevive", sujo.custoSustentar, 2);

/* ============================================================ */

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
