/* TÉCNICA MÁXIMA: concessão, orçamento e validação (autor, 2026-10-08).

   DA-01: a identidade é `nivel: "max"`. DA-02: a oficial (`regraTecnicaMaxima:
   "oficial"`) exige a vaga exclusiva `vagasTecnicaMaxima` e não gasta vaga de
   Feitiço; a LEGACY (gravada antes, sem a marca) segue no orçamento comum.
   DA-04: naturezas permitidas, Personalizado com AVISO, Passivo e Itens
   proibidos. DA-09: os requisitos da Aptidão checados de verdade. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const F = await import(R + "afty-feiticos.js");
const APT = await import(R + "afty-aptidoes.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

let seq = 0;
const feitico = (extra = {}) => ({ ...F.createBlankFeitico(), id: `f${++seq}`, nome: `F${seq}`, ...extra });
const oficial = (extra = {}) => feitico({ nivel: "max", regraTecnicaMaxima: "oficial", ...extra });
const ficha = (sistema, feiticos, { nd = 13, mestre = true, aptidao = true, extra = {} } = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core.nd = nd;
  c.core.origem = { id: "inato" };
  c.pericias = mestre ? { feiticaria: "mestre" } : {};
  c.aptidoesAmaldicoadas = aptidao ? ["tecnica_maxima"] : [];
  c.feiticos = feiticos;
  return Object.assign(c, extra);
};
const tm = (d) => d.feiticos.tecnicasMaximas;
const linha = (d, nome) => d.feiticos.lista.find((l) => l.nome === nome);
const codigos = (l) => (l?.tecnicaMaxima?.validacao ?? []).map((v) => `${v.nivel}:${v.codigo}`);

/* ============================================================ */
/* IDENTIDADE E REGIME                                           */
/* ============================================================ */
t("max é Técnica Máxima", F.ehTecnicaMaxima({ nivel: "max" }), true);
t("nível 5 não é", F.ehTecnicaMaxima({ nivel: 5 }), false);
t("sem a marca é LEGACY", [F.ehTecnicaMaximaLegacy({ nivel: "max" }), F.ehTecnicaMaximaOficial({ nivel: "max" })], [true, false]);
t("com a marca é oficial", [F.ehTecnicaMaximaOficial({ nivel: "max", regraTecnicaMaxima: "oficial" }), F.ehTecnicaMaximaLegacy({ nivel: "max", regraTecnicaMaxima: "oficial" })], [true, false]);
t("a marca sozinha não faz Técnica Máxima", F.ehTecnicaMaximaOficial({ nivel: 5, regraTecnicaMaxima: "oficial" }), false);

/* ============================================================ */
/* A APTIDÃO E O REQUISITO DE NÍVEL DE FEITIÇO (DA-09)           */
/* ============================================================ */
const reqNivel = APT.getAptidao("tecnica_maxima").requisitos.find((r) => r.tipo === "nivelFeitico");
t("o requisito de Nível 4 é checado", reqNivel, { tipo: "nivelFeitico", valor: 4 });
t("acesso 4 cumpre", APT.avaliarRequisitoAptidao(reqNivel, { nivelFeiticoMax: 4 }).ok, true);
t("acesso 3 não cumpre", APT.avaliarRequisitoAptidao(reqNivel, { nivelFeiticoMax: 3 }).ok, false);
t("sem o acesso no contexto não trava", APT.avaliarRequisitoAptidao(reqNivel, {}), { ok: true, verificavel: false, label: "Conjurar Feitiços Nível 4" });
t("o catálogo de Aptidões segue íntegro", APT.validarCatalogoAptidoes(), []);

for (const sistema of ["afty", "player"]) {
  /* ============================================================ */
  /* CONCESSÃO E ORÇAMENTO                                         */
  /* ============================================================ */
  const comum = feitico({ nome: "Comum", nivel: 3 });
  const base = deriveAfty(ficha(sistema, [comum]));
  const comTM = deriveAfty(ficha(sistema, [comum, oficial({ nome: "TM" })]));
  t(`${sistema}: a Aptidão concede 1 vaga`, [tm(base).total, tm(base).usadas, tm(base).livres], [1, 0, 1]);
  t(`${sistema}: a oficial não gasta vaga de Feitiço`, comTM.feiticos.gastos, base.feiticos.gastos);
  t(`${sistema}: a oficial não gasta o contador`, comTM.orcamentoHabilidades.restante, base.orcamentoHabilidades.restante);
  t(`${sistema}: a oficial ocupa a vaga própria`, [tm(comTM).usadas, tm(comTM).livres, tm(comTM).excedeu], [1, 0, false]);
  t(`${sistema}: a oficial vale`, [linha(comTM, "TM").tecnicaMaxima.oficial, linha(comTM, "TM").tecnicaMaxima.valida], [true, true]);
  t(`${sistema}: a fonte da vaga no hover`, tm(comTM).partes.map((p) => p.valor), [1]);

  const semApt = deriveAfty(ficha(sistema, [comum, oficial({ nome: "TM" })], { aptidao: false }));
  t(`${sistema}: sem a Aptidão não há vaga`, [tm(semApt).total, tm(semApt).excedeu], [0, true]);
  t(`${sistema}: sem a Aptidão a oficial fica salva e inválida`,
    [semApt.feiticos.lista.length, linha(semApt, "TM").tecnicaMaxima.valida, codigos(linha(semApt, "TM"))], [2, false, ["erro:vaga"]]);
  t(`${sistema}: e continua fora do orçamento comum`, semApt.feiticos.gastos, base.feiticos.gastos);

  const duas = deriveAfty(ficha(sistema, [oficial({ nome: "A" }), oficial({ nome: "B" })]));
  t(`${sistema}: a segunda oficial passa da vaga`, [tm(duas).usadas, tm(duas).excedeu], [2, true]);
  t(`${sistema}: só a excedente fica inválida`, [linha(duas, "A").tecnicaMaxima.valida, linha(duas, "B").tecnicaMaxima.valida], [true, false]);

  /* A concessão EXPLÍCITA de outra fonte (DA-02): o canal, sem a Aptidão. */
  const peloCanal = ficha(sistema, [oficial({ nome: "TM" })], { aptidao: false });
  peloCanal.core.tecnicaEfeitos = [{ canal: "vagasTecnicaMaxima", expr: "1" }];
  const dc = deriveAfty(peloCanal);
  t(`${sistema}: o canal concede a vaga sem a Aptidão`, [tm(dc).total, linha(dc, "TM").tecnicaMaxima.valida], [1, true]);

  /* ============================================================ */
  /* LEGACY (DA-02)                                                */
  /* ============================================================ */
  const comLegacy = deriveAfty(ficha(sistema, [comum, feitico({ nome: "Antiga", nivel: "max" })], { aptidao: false }));
  t(`${sistema}: a LEGACY gasta o orçamento comum, como sempre`, comLegacy.feiticos.gastos, base.feiticos.gastos + 1);
  t(`${sistema}: a LEGACY não ocupa a vaga oficial`, tm(comLegacy).usadas, 0);
  t(`${sistema}: a LEGACY vale sem a Aptidão`, [linha(comLegacy, "Antiga").tecnicaMaxima.legacy, linha(comLegacy, "Antiga").tecnicaMaxima.valida], [true, true]);

  /* ============================================================ */
  /* REQUISITOS DA APTIDÃO (DA-09)                                 */
  /* ============================================================ */
  const semMestre = deriveAfty(ficha(sistema, [oficial({ nome: "TM" })], { mestre: false }));
  t(`${sistema}: sem Mestre em Feitiçaria a oficial é inválida`,
    [linha(semMestre, "TM").tecnicaMaxima.valida, codigos(linha(semMestre, "TM"))], [false, ["erro:requisito"]]);
  const acesso3 = deriveAfty(ficha(sistema, [oficial({ nome: "TM" })], { nd: 9 }));
  t(`${sistema}: com acesso só ao Nível 3 a oficial é inválida`,
    [acesso3.feiticos.nivelMax, linha(acesso3, "TM").tecnicaMaxima.valida], [3, false]);

  /* ============================================================ */
  /* NATUREZAS (DA-04)                                             */
  /* ============================================================ */
  const naturezas = [
    ["Dano", { tipo: "dano" }, []],
    ["Auxiliar", { tipo: "auxiliar" }, []],
    ["Curativo", { tipo: "curativo" }, []],
    ["Golpeador", { tipo: "especial", especialSubtipo: "golpeador" }, []],
    ["Dano na Alma", { tipo: "especial", especialSubtipo: "danoAlma" }, []],
    ["Shikigami", { tipo: "especial", especialSubtipo: "shikigami" }, []],
    ["Transformação", { tipo: "especial", especialSubtipo: "transformacao" }, []],
    ["Invisibilidade", { tipo: "especial", especialSubtipo: "invisibilidade" }, []],
    ["Personalizado", { tipo: "personalizado" }, ["aviso:manual"]],
    ["Passivo", { tipo: "passivo" }, ["erro:natureza"]],
    ["Criação de Itens", { tipo: "especial", especialSubtipo: "itens" }, ["erro:natureza"]],
  ];
  for (const [nome, campos, esperado] of naturezas) {
    const d = deriveAfty(ficha(sistema, [oficial({ nome: "TM", ...campos })]));
    t(`${sistema}: natureza ${nome}`, codigos(linha(d, "TM")), esperado);
  }
}

/* ============================================================ */
/* A PORTA DA EXPANSÃO EM TIPO DE ESPECIAL (DA-18)               */
/* ============================================================ */
/* O Feitiço aberto só para chegar na Expansão sai junto, e qualquer campo
   preenchido o mantém. O id, o Tipo e o Tipo de Especial são cliques de
   navegação, não conteúdo. */
{
  const rascunho = { ...F.createBlankFeitico(), tipo: "especial", especialSubtipo: "shikigami" };
  t("porta: rascunho de Especial é descartável", F.feiticoEmBranco(rascunho), true);
  t("porta: com nome fica", F.feiticoEmBranco({ ...rascunho, nome: "Algo" }), false);
  t("porta: com nível mexido fica", F.feiticoEmBranco({ ...rascunho, nivel: 3 }), false);
  t("porta: com campo a mais fica", F.feiticoEmBranco({ ...rascunho, regraTecnicaMaxima: "oficial" }), false);
  t("porta: nada não é rascunho", F.feiticoEmBranco(null), false);
  const extras = (tm, exp) => F.opcoesExtrasDeEspecial({ tecnicasMaximas: tm, temExpansao: exp }).bloqueadas;
  t("porta: sem Aptidão as duas ficam trancadas", extras(null, false), [F.OPCAO_TECNICA_MAXIMA, F.OPCAO_EXPANSAO_DOMINIO]);
  t("porta: com vaga e Expansão as duas abrem", extras({ total: 1, livres: 1 }, true), []);
  t("porta: vaga ocupada tranca só a Técnica Máxima", extras({ total: 1, livres: 0 }, true), [F.OPCAO_TECNICA_MAXIMA]);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
