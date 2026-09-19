/* QUIMERA, A FUSÃO DE INVOCAÇÕES COMO PASSIVA DE NÍVEL 2 A 4 (2026-09-19).

   Addon puro, sem código novo: usa o mecanismo de fontes que a Quimera das Dez
   Sombras já usa (marcador com `fontes`, `herdaDaFonte` e `fontes()` do DSL).
   O que muda em relação àquela:

     • O PV é a soma do PV de TODAS as fundidas menos 10, e não os dois maiores.
     • O teto de fusões vem do Nível da Passiva (2, 3 ou 4), e não do Bônus de
       Treinamento. O marcador só enxerga Talento, Habilidade, Origem e Clã, então
       cada nível virou um Talento que paga a própria vaga, com o marcador dele.

   ⚠ Os ids do pacote levam o namespace `quimera:`. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const { getTalento } = await import(R + "afty-talentos.js");
const { createBlankInvocacao, createBlankAcao } = await import(R + "afty-invocacoes.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const pacote = AD.normalizarPacote(JSON.parse(readFileSync(new URL("../addons/quimera.json", import.meta.url), "utf8")));
t("o pacote valida sem problema nenhum", AD.validarPacote(pacote), []);
AD.aplicarAddons([pacote]);

const NS = "quimera:";
const NIVEIS = [2, 3, 4];
const talentoDe = (n) => `${NS}tal_quimera_${n}`;
const marcadorDe = (n) => `${NS}passiva_${n}`;

/* ============================================================ */
/* 1. O CATÁLOGO                                                 */
/* ============================================================ */
t("um Talento por nivel de Passiva",
  NIVEIS.map((n) => getTalento(talentoDe(n))?.nome),
  ["Quimera (Passiva de Nível 2)", "Quimera (Passiva de Nível 3)", "Quimera (Passiva de Nível 4)"]);
t("cada Talento concede a vaga que ele gasta",
  NIVEIS.map((n) => (getTalento(talentoDe(n)).efeitos ?? []).filter((e) => e.canal === "vagasTalento").length),
  [1, 1, 1]);
t("o texto do livro chega inteiro",
  NIVEIS.every((n) => getTalento(talentoDe(n)).descricao.includes("Agito, invocado por Sukuna")
    && getTalento(talentoDe(n)).descricao.includes("igual a soma do HP de cada Invocação fundido - 10")), true);

/* ============================================================ */
/* 2. O ORÇAMENTO DE TALENTO                                     */
/* ============================================================ */
const orcamento = (ts) => {
  const c = createBlankAfty();
  c.core = { ...c.core, nd: 20, tipo: "conjurador", patamar: "comum" };
  c.especializacoes = [{ id: "controlador", nivel: 20 }];
  c.addons = [pacote];
  c.talentos = ts;
  c.invocacoes = [];
  const h = deriveAfty(c).habilidades;
  return [h.exclusivasTalento, h.exclusivasUsadas, h.restante];
};
t("sem o Talento, o orcamento e o de sempre", orcamento([]), [2, 0, 2]);
t("com um Talento de Quimera a vaga que ele concede paga a que ele gasta",
  orcamento([talentoDe(3)]), [3, 1, 2]);

/* ============================================================ */
/* 3. O MARCADOR E O TETO DE FUSÕES                              */
/* ============================================================ */
const marcadoresDe = (ts) => {
  const c = createBlankAfty();
  c.core = { ...c.core, nd: 20, tipo: "conjurador", patamar: "comum" };
  c.especializacoes = [{ id: "controlador", nivel: 20 }];
  c.addons = [pacote];
  c.talentos = ts;
  c.invocacoes = [];
  return deriveAfty(c).invocacoes.marcadores.filter((m) => m.id.startsWith(NS));
};
t("sem Talento nenhum nao ha marcador de Quimera", marcadoresDe([]).length, 0);
t("com o Talento de Nivel 2 o teto e 2 fusoes",
  marcadoresDe([talentoDe(2)]).map((m) => [m.id, m.fontesMax, m.limite, m.fontes]),
  [[marcadorDe(2), 2, 1, true]]);
t("com o de Nivel 3 o teto e 3",
  marcadoresDe([talentoDe(3)]).map((m) => [m.id, m.fontesMax]), [[marcadorDe(3), 3]]);
t("com o de Nivel 4 o teto e 4",
  marcadoresDe([talentoDe(4)]).map((m) => [m.id, m.fontesMax]), [[marcadorDe(4), 4]]);
t("so se enxerga o marcador do Talento que a ficha tem",
  marcadoresDe([talentoDe(2), talentoDe(4)]).map((m) => m.id).sort(), [marcadorDe(2), marcadorDe(4)]);
t("so uma Quimera por cena: o limite de cada marcador e 1",
  marcadoresDe(NIVEIS.map(talentoDe)).map((m) => m.limite), [1, 1, 1]);
t("a politica de fusao pede a uniao das faixas e o maior atributo",
  marcadoresDe([talentoDe(3)])[0].herdaDaFonte,
  { pericias: "uniao", tr: "uniao", ataque: "uniao", atributos: "maior" });

/* ============================================================ */
/* 4. A FUSÃO                                                    */
/* ============================================================ */
const FONTES = [
  ["Cervo Circular", "segundo", 16, 16, 16], ["Tigre Funebre", "segundo", 20, 12, 18],
  ["Grande Serpente", "terceiro", 18, 12, 16], ["Nue", "terceiro", 14, 18, 14],
];
const mkFonte = ([nome, grau, f, d, c], i) => {
  const inv = createBlankInvocacao(grau);
  inv.id = `f${i}`; inv.nome = nome; inv.tipoMecanico = "shikigami";
  inv.atributos = { forca: f, destreza: d, constituicao: c, inteligencia: 10, sabedoria: 10, presenca: 10 };
  inv.acoes = [1, 2, 3].map((k) => ({ ...createBlankAcao(), id: `f${i}a${k}`, nome: `A${k}` }));
  inv.periciasProf = i === 0 ? { atletismo: "treinado", furtividade: "treinado" }
    : i === 1 ? { atletismo: "mestre" } : {};
  return inv;
};
const ficha = ({ nivel = 4, nQ = 0 } = {}) => {
  const c = createBlankAfty();
  c.core = { ...c.core, nd: 20, tipo: "conjurador", patamar: "comum" };
  c.talentos = [talentoDe(nivel)];
  c.especializacoes = [{ id: "controlador", nivel: 20 }];
  c.attributes = { forca: 10, destreza: 12, constituicao: 14, inteligencia: 20, sabedoria: 12, presenca: 10 };
  c.addons = [pacote];
  const alvo = createBlankInvocacao("especial");
  alvo.id = "alvo"; alvo.nome = "Agito"; alvo.tipoMecanico = "shikigami";
  alvo.atributos = { forca: 12, destreza: 12, constituicao: 12, inteligencia: 12, sabedoria: 12, presenca: 12 };
  alvo.acoes = [{ ...createBlankAcao(), id: "aa", nome: "Golpe", tipoDano: "ct" }];
  alvo.periciasProf = { atletismo: "treinado" };
  alvo.marcadores = {}; alvo.marcadorFontes = {};
  if (nQ) {
    alvo.marcadores[marcadorDe(nivel)] = true;
    alvo.marcadorFontes[marcadorDe(nivel)] = FONTES.slice(0, nQ).map((_, i) => `f${i}`);
  }
  c.invocacoes = [alvo, ...FONTES.map(mkFonte)];
  return c;
};
const alvoDe = (o) => deriveAfty(ficha(o)).invocacoes.lista.find((x) => x.id === "alvo");
const fontesDe = () => deriveAfty(ficha({})).invocacoes.lista.filter((x) => x.id !== "alvo");
const base = alvoDe({});
const pvFontes = fontesDe().map((x) => x.pv);
const custoFontes = fontesDe().map((x) => x.custo);
const soma = (v, n) => v.slice(0, n).reduce((a, b) => a + b, 0);

/* "A Vida Máxima de uma Quimera é igual a soma do HP de cada Invocação fundido
   - 10." */
t("as quatro fontes tem PV diferentes, porque os graus diferem", new Set(pvFontes).size >= 2, true);
t("o PV da Quimera e a soma do PV de todas as fundidas menos 10",
  [2, 3, 4].map((n) => alvoDe({ nQ: n }).pv), [2, 3, 4].map((n) => soma(pvFontes, n) - 10));
t("e nao os dois maiores, como nas Dez Sombras",
  alvoDe({ nQ: 4 }).pv === soma(pvFontes, 4) - 10
    && alvoDe({ nQ: 4 }).pv !== [...pvFontes].sort((a, b) => b - a).slice(0, 2).reduce((a, b) => a + b, 0), true);
t("sem fusao o PV e o proprio, e o marcador ligado sem fonte nao muda nada",
  alvoDe({ nQ: 0 }).pv, base.pv);

/* "O Custo em PE é a soma de todas as invocações fundidas." */
t("o custo da Quimera e a soma das fundidas, exato",
  [2, 3, 4].map((n) => alvoDe({ nQ: n }).custo), [2, 3, 4].map((n) => soma(custoFontes, n)));

/* "+1 ... para cada Invocação fundida além da primeira." */
const efeitos = (n) => alvoDe({ nQ: n }).efeitosHabilidade;
for (const canal of ["cd", "defesa", "danoNivel", "orcamentoLivre"]) {
  t(`+1 em ${canal} por fundida alem da primeira`,
    [1, 2, 3, 4].map((n) => (efeitos(n)[canal] ?? 0) - (base.efeitosHabilidade[canal] ?? 0)), [0, 1, 2, 3]);
}
t("+1 em Acerto, TR e Pericia por fundida alem da primeira",
  [1, 2, 3, 4].map((n) => efeitos(n).bonusTeste - base.efeitosHabilidade.bonusTeste), [0, 1, 2, 3]);

/* "A Quimera recebe todos os Treinamentos de Perícia, Acerto e TR das
   invocações fundidas." Vale a maior faixa, sem subir degrau. */
const profDe = (o) => Object.fromEntries((alvoDe(o).testes?.pericias ?? [])
  .map((p) => [p.id, p.mestre ? "mestre" : "treinado"]));
t("a Quimera une as pericias treinadas das fundidas",
  [profDe({ nQ: 1 }).atletismo, profDe({ nQ: 1 }).furtividade], ["treinado", "treinado"]);
t("e a maior faixa ganha", profDe({ nQ: 2 }).atletismo, "mestre");

/* "A Quimera recebe o maior atributo entre as Invocações fundidas." */
const atrDe = (o) => alvoDe(o).atributos.valores;
t("o maior atributo entre as fundidas, atributo por atributo",
  [atrDe({ nQ: 4 }).forca, atrDe({ nQ: 4 }).destreza, atrDe({ nQ: 4 }).constituicao],
  [20, 18, 18]);
t("o alvo sem fusao fica com os proprios",
  [atrDe({ nQ: 0 }).forca, atrDe({ nQ: 0 }).constituicao], [12, 12]);

/* Nada vaza para outra invocacao da ficha. */
const outra = deriveAfty(ficha({ nQ: 4 })).invocacoes.lista.find((x) => x.id === "f0");
t("a fonte nao herda nada da Quimera", outra.pv, pvFontes[0]);

/* ============================================================ */
/* 5. A INDEPENDÊNCIA DOS TRÊS NÍVEIS                            */
/* ============================================================ */
/* O marcador do Nivel 2 so alimenta os efeitos do Talento de Nivel 2. Com o
   Talento de Nivel 3 na ficha, ligar o marcador do 2 nao faz nada. */
{
  const c = ficha({ nivel: 3, nQ: 0 });
  c.invocacoes[0].marcadores = { [marcadorDe(2)]: true };
  c.invocacoes[0].marcadorFontes = { [marcadorDe(2)]: ["f0", "f1"] };
  const r = deriveAfty(c).invocacoes.lista.find((x) => x.id === "alvo");
  t("marcador de um nivel que a ficha nao tem nao da PV", r.pv, base.pv);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
