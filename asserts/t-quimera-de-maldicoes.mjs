/* QUIMERA DE MALDIÇÕES (addon, 2026-10-14).

   O pacote `addons/quimera-de-maldicoes.json` traz a Quimera do Mecânicas numa aba
   própria (primitiva `abaQuimeras`) e deixa ela fundir Maldições Domadas
   (liberação `quimeraDeMaldicoes`). As decisões do autor:
     • Maldição funde só com Maldição, sem misturar com Shikigami;
     • cada Maldição soma o custo base do grau dela, que sozinha ela não tem;
     • continua pedindo 5 níveis de Controlador (2, 3 e 4 nos níveis 5, 9 e 13);
     • a aba é própria, no criador, na Ficha Final e no Encontro.
   E a leitura que veio junto: a Quimera de Maldições cai pela regra da Maldição
   (exorcizada a 0 PV), e as componentes ficam presas até o fim da cena. */
import { readFileSync } from "node:fs";
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const S = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const I = await import(R + "afty-invocacoes.js");
const SES = await import(R + "ficha/ficha-sessao.js");
const FC = await import(R + "ficha/ficha-conteudo.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. O PACOTE                                                   */
/* ============================================================ */
const QM = JSON.parse(readFileSync(new URL("../addons/quimera-de-maldicoes.json", import.meta.url), "utf8"));
t("o pacote valida", A.validarPacote(QM), []);
t("autor, sistema-alvo e versão", [QM.autor, QM.paraRaw, QM.versao], ["Templas", "afty", "1.0.0"]);
t("sem travessão no pacote", /\u2014/.test(JSON.stringify(QM)), false);
const P = A.normalizarPacote(QM);
t("aplicar não relata problema", A.aplicarAddons([P]).problemas, []);
t("a primitiva da aba e a liberação existem", [
  A.PRIMITIVAS.some((p) => p.id === "abaQuimeras"), A.LIBERACOES.some((l) => l.id === "quimeraDeMaldicoes"),
], [true, true]);
t("a ficha com o pacote enxerga as duas", [
  A.primitivasDaCriatura({ addons: [P] }).includes("abaQuimeras"),
  A.liberacoesDaCriatura({ addons: [P] }).includes("quimeraDeMaldicoes"),
], [true, true]);

/* ============================================================ */
/* 2. A FUSÃO (motor)                                            */
/* ============================================================ */
const ATR = { forca: 12, destreza: 12, constituicao: 12, inteligencia: 8, sabedoria: 8, presenca: 8 };
const inv = (id, nome, tipo, grau, extra = {}) => ({ ...I.createBlankInvocacao(grau, tipo), id, nome, atributos: ATR, ...extra });
const maldA = inv("MA", "Maldição de Medo", "maldicao", "terceiro");
const maldB = inv("MB", "Maldição Vingativa", "maldicao", "terceiro");
const maldC = inv("MC", "Maldição Enferma", "maldicao", "segundo");
const shikA = inv("SA", "Cervo", "shikigami", "terceiro");
const shikB = inv("SB", "Tigre", "shikigami", "terceiro");
const boneco = inv("MR", "Boneco", "marionete", "terceiro");
const fichas = [maldA, maldB, maldC, shikA, shikB, boneco];
const quimera = (principalId, fundidasIds) => ({ ...I.createBlankQuimera(), id: "q", nome: "Fusão", principalId, fundidasIds });
const DONO = { nd: 10, bt: 4, nivelControlador: 10, nivelControladorReal: 10 };
const LIB = { ...DONO, quimeraDeMaldicoes: true };
const custoBase = (grau) => I.AFTY_INV_GRAUS.find((g) => g.value === grau).custoBase;

const semAddon = I.resolveQuimera(quimera("MA", ["MB"]), fichas, DONO);
t("sem o addon, Maldição avisa que a Quimera só funde Shikigamis",
  semAddon.warnings.filter((w) => w.includes("só funde Shikigamis")).length, 2);
t("e sem o addon a Maldição não soma custo base", semAddon.custo, 0);

const deMaldicoes = I.resolveQuimera(quimera("MA", ["MB"]), fichas, LIB);
t("com o addon, duas Maldições fundem sem aviso", deMaldicoes.warnings, []);
t("e a Quimera de Maldições é válida e do tipo Maldição",
  [deMaldicoes.valido, deMaldicoes.resolvida.familia], [true, "maldicao"]);
t("cada Maldição soma o custo base do grau dela", deMaldicoes.custo, 2 * custoBase("terceiro"));
t("o hover do custo diz que é a soma dos custos base",
  deMaldicoes.resolvida.fontes?.custo?.[0], { label: "Quimera (Soma dos Custos Base)", valor: 2 * custoBase("terceiro") });
const tres = I.resolveQuimera(quimera("MA", ["MB", "MC"]), fichas, LIB);
t("três Maldições no Controlador 10, com o maior grau", [tres.total, tres.resolvida.grau, tres.warnings], [3, "segundo", []]);
t("e o custo soma os três graus", tres.custo, 2 * custoBase("terceiro") + custoBase("segundo"));
const listaBase = I.resolveInvocacoesList(fichas, { ...DONO, efeitos: [] }).lista;
const pvDe = (id) => listaBase.find((r) => r.id === id).pv;
t("o PV segue a fórmula do Mecânicas (principal + um terço dos outros - grau × adicionais)",
  deMaldicoes.pv, pvDe("MA") + Math.floor(pvDe("MB") / 3) - 2 * 1);

t("com o addon, Maldição não mistura com Shikigami",
  I.resolveQuimera(quimera("MA", ["SA"]), fichas, LIB).warnings, ["Cervo: a Quimera não mistura Shikigamis e Maldições."]);
t("nem Shikigami com Maldição",
  I.resolveQuimera(quimera("SA", ["MA"]), fichas, LIB).warnings, ["Maldição de Medo: a Quimera não mistura Shikigamis e Maldições."]);
t("Marionete continua de fora",
  I.resolveQuimera(quimera("MA", ["MR"]), fichas, LIB).warnings, ["Boneco: Quimera só funde Shikigamis ou Maldições."]);
const shikSem = I.resolveQuimera(quimera("SA", ["SB"]), fichas, DONO);
const shikCom = I.resolveQuimera(quimera("SA", ["SB"]), fichas, LIB);
t("a Quimera de Shikigamis não muda com o addon",
  [shikCom.pv, shikCom.custo, shikCom.warnings], [shikSem.pv, shikSem.custo, []]);
t("e continua pedindo 5 níveis de Controlador",
  I.resolveQuimera(quimera("MA", ["MB"]), fichas, { ...LIB, nivelControladorReal: 4 }).warnings[0], "Quimera pede 5 níveis de Controlador.");
t("no 5 funde duas, e a terceira avisa",
  I.resolveQuimera(quimera("MA", ["MB", "MC"]), fichas, { ...LIB, nivelControladorReal: 5 }).warnings,
  ["O Controlador funde até 2 Invocações, contando a principal."]);

/* ============================================================ */
/* 3. A FICHA, NOS DOIS SISTEMAS                                 */
/* ============================================================ */
for (const sistema of ["player", "afty"]) {
  const tag = (s) => `${sistema}: ${s}`;
  const ficha = ({ comPacote = true, nivel = 10, quimeras = [quimera("MA", ["MB"])] } = {}) => {
    const c = S.createBlankAfty();
    c.rulesVersion = sistema;
    c.core = { ...c.core, nd: nivel };
    c.especializacoes = [{ id: "controlador", nivel }];
    c.invocacoes = fichas;
    c.quimeras = quimeras;
    c.addons = comPacote ? [P] : [];
    return c;
  };
  const com = deriveAfty(ficha());
  const sem = deriveAfty(ficha({ comPacote: false }));
  const qCom = com.quimeras.lista[0];
  t(tag("com o pacote a Quimera de Maldições sai sem aviso"), [qCom.valido, qCom.warnings], [true, []]);
  t(tag("e paga o custo base dos graus"), qCom.custo, 2 * custoBase("terceiro"));
  t(tag("sem o pacote ela avisa"), sem.quimeras.lista[0].warnings.some((w) => w.includes("só funde Shikigamis")), true);
  t(tag("a aba própria vem da primitiva"), [com.primitivas.includes("abaQuimeras"), sem.primitivas.includes("abaQuimeras")], [true, false]);

  // A busca leva a Quimera para a aba dela.
  const alvo = (d) => FC.alvosDeBusca(d).find((x) => x.id === "quimera:q")?.aba;
  t(tag("a busca abre a aba Quimeras com o pacote, e Invocações sem"), [alvo(com), alvo(sem)], ["quimeras", "invocacoes"]);

  // A mesa: a Quimera de Maldições cai pela regra da Maldição.
  const mesa = SES.invocacaoDaMesa(com, "quimera:q");
  const sessao = { ...SES.sessaoEmBranco(), peAtual: 60, rodada: 0 };
  const dentro = SES.invocaNaMesa(sessao, com, "quimera:q");
  const linha = (s, id) => SES.estadoDaInvocacao(s, id);
  t(tag("a Quimera entra e marca a cena"), [linha(dentro, "quimera:q").estado, dentro.quimeraDaCena], ["ativa", "quimera:q"]);
  const caiu = SES.aplicaDanoNaMesa(dentro, com, "quimera:q", mesa.pv);
  t(tag("a 0 PV ela é exorcizada, e as componentes ficam presas até o fim da cena, sem morrer"),
    [linha(caiu, "quimera:q").estado, linha(caiu, "MA").bloqueadaAteFimDaCena, linha(caiu, "MB").bloqueadaAteFimDaCena, linha(caiu, "MA").terminal],
    ["exorcizada", true, true, false]);
  const shik = deriveAfty(ficha({ quimeras: [quimera("SA", ["SB"])] }));
  const dentroS = SES.invocaNaMesa(sessao, shik, "quimera:q");
  const caiuS = SES.aplicaDanoNaMesa(dentroS, shik, "quimera:q", SES.invocacaoDaMesa(shik, "quimera:q").pv);
  t(tag("a de Shikigamis segue dissipando, com as componentes"),
    [linha(caiuS, "quimera:q").estado, linha(caiuS, "SA").estado], ["dissipada", "dissipada"]);
}

if (bad.length) {
  console.error(bad.join("\n"));
  console.error(`\n${bad.length} FALHARAM, ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
