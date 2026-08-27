/* O CONTEÚDO do addon "Estilo das Sombras Liberado", pedido pelo autor em
   2026-08-22: reescrever o Domínio Simples, criar a Linha de Treinamento do
   Novo Estilo das Sombras e trazer quatro Talentos de Origem, dois deles
   reescritos por cima do livro.

   As quatro decisões dele no mesmo dia:
     1. os dois Talentos que já existem no raw ficam como estão, e quem os
        reescreve é o Addon (por isso `substitui`, e não conserto no catálogo);
     2. quem instala o Addon alcança o Treino e os Talentos mesmo sem ser Sem
        Técnica (liberação `qualificaSemTecnica`);
     3. "uma Técnica de Estilo adicional" é vaga EXCLUSIVA de Estilo, e um
        Feitiço não pode gastá-la (canal `vagasEstilo`);
     4. o Completo SOMA outro Nível de Domínio às imbuições, e não substitui o
        total (canal `imbuicoesEstilo`, expressão `dom`).

   O mecanismo do remendo está em t-remendo.mjs, e a liberação do Estilo em
   t-estilo-liberado.mjs. Aqui é só o conteúdo. */
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
const TAL = await import(R + "afty-talentos.js");
const TRE = await import(R + "afty-treinamentos.js");
const APT = await import(R + "afty-aptidoes.js");
const OR = await import(R + "afty-origens.js");

const PACOTE = JSON.parse(
  readFileSync(new URL("./exemplo-estilo-liberado.json", import.meta.url), "utf8"),
);

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const P = "estilo-liberado:";
const TREINO = `${P}novo_estilo_das_sombras`;
const COLETA = `${P}coleta_de_talismas`;
const EXPANSAO = `${P}expansao_de_estilo`;
const ESTUDO = "tal_estudo_amaldicoado";
const NOCAO = "tal_nocao_e_preparacao";

/* O raw, guardado antes de instalar, para o teste de volta no fim. */
const RAW = {
  dominio: APT.getAptidao("dominio_simples").descricao,
  estudoEscolha: TAL.getTalento(ESTUDO).escolha?.id,
  nocao: TAL.getTalento(NOCAO).descricao,
  talentos: TAL.AFTY_TALENTOS.length,
  linhas: TRE.AFTY_TREINAMENTOS.length,
};

/* ============================================================ */
/* 0. Instala                                                    */
/* ============================================================ */

t("o pacote do autor passa no validador", AD.validarPacote(PACOTE), []);
t("e aplica sem problema", AD.aplicarAddons([PACOTE]).problemas, []);

const ficha = (nd, origemId, comAddon = true) => {
  const c = createBlankAfty();
  c.core.nd = nd;
  c.core.origem = { id: origemId };
  c.especializacoes = [{ id: "lutador", nivel: nd }];
  if (comAddon) c.addons = [PACOTE];
  return c;
};
const ctxTal = (c) => {
  const d = deriveAfty(c);
  return {
    nd: d.nd, attrEff: d.attrEff, origemId: c.core.origem?.id ?? null,
    origensQualificadas: OR.origensQualificadas(c),
    aptidoes: d.aptidoesEscolhidas, talentos: c.talentos ?? [],
  };
};
const alcanca = (c, id) => TAL.avaliarAcessoTalento(TAL.getTalento(id), ctxTal(c)).ok;

/* ============================================================ */
/* 1. Domínio Simples remendado                                  */
/* ============================================================ */

const dom = APT.getAptidao("dominio_simples");
t("o Dominio Simples ganhou a sustentacao em PE",
  dom.descricao.includes("pagar 2 PE para sustentar o dominio simples".replace("dominio", "domínio")), true);
/* ⚠ O parágrafo de Concentração e Durabilidade SAIU. Era o segundo do texto do
   livro, e o texto novo do autor não o traz. */
t("a Durabilidade saiu do texto", dom.descricao.includes("Durabilidade"), false);
t("e a Concentracao junto", dom.descricao.includes("Concentra"), false);
t("o primeiro paragrafo ficou igual ao livro",
  dom.descricao.split("\n\n")[0].startsWith("Conhecido originalmente"), true);
t("e a secao do Estilo entrou", dom.descricao.includes("Novo Estilo das Sombras"), true);

/* Remendo é troca de CAMPO: o que não foi citado continua sendo o do livro. */
t("os requisitos continuam os do livro", dom.requisitos, [
  { tipo: "trilha", trilha: "bar", valor: 1 },
  { tipo: "nd", valor: 5 },
]);
t("a categoria tambem", dom.categoria, "especiais");
t("e a Aptidao sabe quem a remendou", dom.remendadoPor?.[0]?.id, "estilo-liberado");
t("o catalogo de Aptidoes nao cresceu",
  APT.AFTY_APTIDOES.filter((a) => a.id === "dominio_simples").length, 1);

/* ============================================================ */
/* 2. A Linha de Treinamento                                     */
/* ============================================================ */

const linha = TRE.getTreinamento(TREINO);
t("a linha existe", linha?.nome, "Treino de Novo Estilo das Sombras");
t("o catalogo de Linhas cresceu UMA", TRE.AFTY_TREINAMENTOS.length, RAW.linhas + 1);
t("quatro etapas", linha.etapas.length, 4);
t("os focos sao 1-1-1-2", linha.etapas.map((e) => e.focos), [1, 1, 1, 2]);
t("a 1a pede Dominio Simples", linha.etapas[0].requisito, { tipo: "aptidao", id: "dominio_simples" });
t("a 3a pede DOM 3", linha.etapas[2].requisito, { tipo: "trilha", trilha: "dom", valor: 3 });
t("a 4a pede DOM 5", linha.etapas[3].requisito, { tipo: "trilha", trilha: "dom", valor: 5 });

/* ⚠ `soDaOrigem` é a trava POSITIVA, e ela é nova: até 2026-08-22 só existia a
   negativa (`foraDaOrigem`). "Esse treino só pode ser realizado por um Sem
   Técnica." */
const semTec = ficha(12, "sem_tecnica");
const lutador = ficha(12, "inato", false);
const lutadorAddon = ficha(12, "inato");
const temLinha = (c) =>
  TRE.treinamentosDaOrigem(c.core.origem.id, OR.origensQualificadas(c)).some((l) => l.id === TREINO);
t("Sem Tecnica ve a linha", temLinha(semTec), true);
t("um Inato sem o addon NAO ve", temLinha(lutador), false);
t("um Inato COM o addon ve", temLinha(lutadorAddon), true);
/* ⚠ Eram 12 para todo mundo ate 2026-08-26, quando o Potencial Fisico ganhou a
   trava dele: ele e a SEGUNDA linha com soDaOrigem, e a primeira do livro. Um
   Inato ve 11 das 12, e o Restringido continua vendo as 7 dele. */
t("o Inato ve 11 das 12 linhas do livro",
  TRE.treinamentosDaOrigem("inato").filter((l) => !String(l.id).includes(":")).length, 11);
t("e a que falta e o Potencial Fisico",
  TRE.treinamentosDaOrigem("inato").some((l) => l.id === "potencial_fisico"), false);
t("o Restringido ve o Potencial Fisico",
  TRE.treinamentosDaOrigem("restringido").some((l) => l.id === "potencial_fisico"), true);

/* Os requisitos de etapa: aptidão e trilha eram `nota` (só exibiam) até hoje. */
const reqAptidao = (temAptidao) => TRE.avaliarRequisito(
  { tipo: "aptidao", id: "dominio_simples" },
  { aptidoes: temAptidao ? ["dominio_simples"] : [] },
);
t("sem a aptidao o requisito TRAVA", reqAptidao(false).ok, false);
t("com a aptidao ele abre", reqAptidao(true).ok, true);
t("e ele e verificavel", reqAptidao(true).verificavel, true);
t("o rotulo e o nome da aptidao", reqAptidao(true).label, "Domínio Simples");
/* ⚠ Sem contexto ele CAI PARA NÃO VERIFICÁVEL em vez de reprovar: falta de dado
   não é falta de aptidão, e reprovar esconderia a etapa de quem a tem. */
t("sem contexto nao trava", TRE.avaliarRequisito({ tipo: "aptidao", id: "dominio_simples" }, {}).ok, true);
t("mas se marca como nao verificavel",
  TRE.avaliarRequisito({ tipo: "aptidao", id: "dominio_simples" }, {}).verificavel, false);

const reqTrilha = (n) => TRE.avaliarRequisito(
  { tipo: "trilha", trilha: "dom", valor: 3 }, { niveisAptidao: { dom: n } },
);
t("DOM 2 nao passa no requisito de 3", reqTrilha(2).ok, false);
t("DOM 3 passa", reqTrilha(3).ok, true);
t("o rotulo nomeia a trilha", reqTrilha(3).label, "Nível de Aptidão em Domínio 3");

/* ============================================================ */
/* 3. Os números do Treino                                       */
/* ============================================================ */

const comTreino = (etapas, nd = 12, dominio = 3) => {
  const c = ficha(nd, "sem_tecnica");
  c.aptidoes = { dom: dominio };
  c.aptidoesAmaldicoadas = ["dominio_simples"];
  if (etapas) c.treinamentos = { [TREINO]: etapas };
  return deriveAfty(c);
};

const zero = comTreino(0);
t("sem o treino nao ha vaga exclusiva de Estilo", zero.orcamentoHabilidades.exclusivasEstilo, 0);
t("e as imbuicoes sao o Nivel de Aptidao em Dominio", zero.estilo.vagas, 3);

const etapa1 = comTreino(1);
t("a 1a etapa da UMA vaga exclusiva de Estilo", etapa1.orcamentoHabilidades.exclusivasEstilo, 1);
t("que entra no contador total", etapa1.orcamentoHabilidades.total, zero.orcamentoHabilidades.total + 1);
t("e nao vira vaga de Feitico", etapa1.orcamentoHabilidades.exclusivasFeitico, 0);
t("as imbuicoes nao mudaram", etapa1.estilo.vagas, 3);

/* ⚠ O COMPLETO SOMA (decisão do autor): com DOM 3 são 3 + 3, e não "vira 6
   ignorando o resto". A diferença aparece no dia em que outra fonte somar. */
const completo = comTreino(4);
t("o Completo dobra as imbuicoes", completo.estilo.vagas, 6);
t("e as tres etapas anteriores continuam valendo",
  completo.orcamentoHabilidades.exclusivasEstilo, 1);
t("com DOM 5 o Completo da 10", comTreino(4, 12, 5).estilo.vagas, 10);
t("com DOM 0 o Completo nao inventa vaga", comTreino(4, 12, 0).estilo.vagas, 0);

/* ============================================================ */
/* 4. Os quatro Talentos de Origem                               */
/* ============================================================ */

t("o catalogo de Talentos cresceu DOIS", TAL.AFTY_TALENTOS.length, RAW.talentos + 2);
t("Coleta de Talismas existe", TAL.getTalento(COLETA)?.nome, "Coleta de Talismãs");
t("Expansao de Estilo existe", TAL.getTalento(EXPANSAO)?.nome, "Expansão de Estilo");
t("os dois sao de Origem",
  [TAL.getTalento(COLETA).grupo, TAL.getTalento(EXPANSAO).grupo], ["origem", "origem"]);

/* A liberação `qualificaSemTecnica` é o que abre os quatro fora do Sem Técnica.
   Ela é SEPARADA do `estiloSombras` de propósito: uma solta o Estilo, a outra
   solta os pré-requisitos de origem. */
t("Sem Tecnica alcanca Coleta", alcanca(semTec, COLETA), true);
t("Inato sem addon NAO alcanca", alcanca(lutador, COLETA), false);
t("Inato com addon alcanca", alcanca(lutadorAddon, COLETA), true);
t("o addon qualifica como Sem Tecnica",
  OR.origensQualificadas(lutadorAddon), ["inato", "sem_tecnica"]);
t("e nao mexe na origem propria", lutadorAddon.core.origem.id, "inato");

/* Coleta de Talismãs não tem requisito de nível: o texto só pede a origem. */
t("Coleta nao pede nivel", TAL.getTalento(COLETA).requisitos, [{ tipo: "origem", id: "sem_tecnica" }]);
t("e alcanca desde o ND 1", alcanca(ficha(1, "sem_tecnica"), COLETA), true);

/* Expansão de Estilo pede origem, Domínio Simples e Nível 6. */
const comDominio = (nd, origemId = "sem_tecnica") => {
  const c = ficha(nd, origemId);
  c.aptidoes = { dom: 1, bar: 1 };
  c.aptidoesAmaldicoadas = ["dominio_simples"];
  return c;
};
/* ⚠ O SEM TÉCNICA JÁ TEM O DOMÍNIO SIMPLES DE GRAÇA a partir do Nível 4, pelo
   Empenho Implacável, então nele o requisito passa sozinho. Quem mostra a trava
   é quem destravou por Addon: esse compra a aptidão, e é a decisão do autor de
   2026-08-21. */
t("Sem Tecnica no ND 8 ja tem o Dominio de graca",
  ctxTal(ficha(8, "sem_tecnica")).aptidoes, ["dominio_simples"]);
t("e por isso Expansao abre nele", alcanca(ficha(8, "sem_tecnica"), EXPANSAO), true);
t("um Inato com o addon NAO tem o Dominio", ctxTal(ficha(8, "inato")).aptidoes, []);
t("e Expansao trava nele", alcanca(ficha(8, "inato"), EXPANSAO), false);
t("abre quando ele compra a aptidao", alcanca(comDominio(8, "inato"), EXPANSAO), true);
t("mas nao antes do Nivel 6", alcanca(comDominio(5), EXPANSAO), false);

const expansaoEm = (nd) => {
  const c = comDominio(nd);
  c.talentos = [EXPANSAO];
  return deriveAfty(c).orcamentoHabilidades.exclusivasEstilo;
};
t("Expansao da 1 vaga de Estilo no ND 6", expansaoEm(6), 1);
t("continua 1 no ND 13", expansaoEm(13), 1);
t("e vira 2 no ND 14", expansaoEm(14), 2);

/* ============================================================ */
/* 5. Estudo Amaldiçoado, remendado e repetível                  */
/* ============================================================ */

const estudo = TAL.getTalento(ESTUDO);
t("o texto novo fala em aptidao a escolha",
  estudo.descricao.includes("uma aptidão amaldiçoada a sua escolha"), true);
/* ⚠ A escolha aninhada do livro (duas trilhas) SAI. O pool novo é feito de
   Aptidões, e o lugar de um pool de Aptidões é a aba de Aptidões: o Talento
   entrega VAGA e a escolha acontece lá, com os pré-requisitos valendo. */
t("a escolha aninhada do livro sumiu", estudo.escolha, null);
t("e o livro tinha uma", RAW.estudoEscolha, "estudo_aptidao");
t("o teto de repeticao e a maestria", estudo.maxVezesExpr, "maestria");
t("e o ND deixou de ser exigido", estudo.requisitos, [{ tipo: "origem", id: "sem_tecnica" }]);

const comEstudo = (nd, vezes) => {
  const c = ficha(nd, "sem_tecnica");
  c.talentos = Array(vezes).fill(ESTUDO);
  return deriveAfty(c);
};
const base12 = ficha(12, "sem_tecnica");
const vagasBase = deriveAfty(base12).totalAptidoesAmaldicoadas;

t("uma pega da uma Vaga de Aptidao",
  comEstudo(12, 1).totalAptidoesAmaldicoadas, vagasBase + 1);
t("tres pegas dao tres", comEstudo(12, 3).totalAptidoesAmaldicoadas, vagasBase + 3);
t("e cada pega custa uma vaga de Talento",
  comEstudo(12, 3).talentos.gastos, 3);
t("`escolhidas` continua SEM repeticao", comEstudo(12, 3).talentos.escolhidas, [ESTUDO]);
t("e `vezes` e quem conta", comEstudo(12, 3).talentos.vezes, { [ESTUDO]: 3 });

/* O teto é a Maestria, e o aparo é de LEITURA: baixar o ND devolve a pega
   excedente em vez de apagá-la da ficha. */
t("no ND 12 a maestria e 4", comEstudo(12, 1).talentos.maxVezes[ESTUDO], 4);
t("cinco pegas param em quatro", comEstudo(12, 5).talentos.vezes[ESTUDO], 4);
t("e o excesso nao vira vaga", comEstudo(12, 5).totalAptidoesAmaldicoadas, vagasBase + 4);
t("no ND 1 a maestria e 2", comEstudo(1, 1).talentos.maxVezes[ESTUDO], 2);

/* ============================================================ */
/* 6. Noção e Preparação, remendado                              */
/* ============================================================ */

t("os niveis do texto viraram 9, 14 e 19",
  TAL.getTalento(NOCAO).descricao.includes("Nos níveis 9, 14 e 19"), true);

/* ⚠ O NÚMERO TAMBÉM TROCOU, e este é o assert que importa: o efeito do raw mora
   num MAPA fora do catálogo (`TALENTO_EFEITOS`), chaveado pelo id, e o id não
   muda num remendo. Sem a regra "remendo com `efeitos` vence o mapa", o texto
   diria 9/14/19 e o motor continuaria somando em 8/12/16, calado. */
const trDe = (nd, comTalento) => {
  const c = ficha(nd, "sem_tecnica");
  if (comTalento) c.talentos = [NOCAO];
  return deriveAfty(c).testes.resistencias.find((r) => r.value === "vontade").bonus;
};
const delta = (nd) => trDe(nd, true) - trDe(nd, false);
t("ND 4 da +2", delta(4), 2);
t("ND 8 ainda da +2", delta(8), 2);
t("ND 9 da +3", delta(9), 3);
t("ND 13 ainda da +3", delta(13), 3);
t("ND 14 da +4", delta(14), 4);
t("ND 19 da +5", delta(19), 5);

/* ============================================================ */
/* 7. Desinstalar devolve o livro                                */
/* ============================================================ */

AD.limparAddons();
t("o Dominio Simples volta ao texto do livro",
  APT.getAptidao("dominio_simples").descricao, RAW.dominio);
t("o Estudo recupera a escolha aninhada", TAL.getTalento(ESTUDO).escolha?.id, RAW.estudoEscolha);
t("e perde o teto de repeticao", TAL.getTalento(ESTUDO).maxVezesExpr, undefined);
t("a Nocao volta a 8, 12 e 16", TAL.getTalento(NOCAO).descricao, RAW.nocao);
t("os dois Talentos novos somem", TAL.AFTY_TALENTOS.length, RAW.talentos);
t("a Linha nova tambem", TRE.AFTY_TREINAMENTOS.length, RAW.linhas);
t("e o Treino nao resolve mais", TRE.getTreinamento(TREINO), null);

/* ⚠ A ficha NÃO é destruída. A pega repetida vira uma pega só (o teto do raw é
   1), e o id gravado continua lá para voltar sozinho se o addon voltar. */
const orfa = ficha(12, "sem_tecnica", false);
orfa.talentos = [ESTUDO, ESTUDO, ESTUDO];
t("sem o addon o Estudo vira uma pega so", deriveAfty(orfa).talentos.vezes[ESTUDO], 1);
t("e a ficha guarda as tres", orfa.talentos.length, 3);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
