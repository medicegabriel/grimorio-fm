/* Alma do Grimório Afty na Ficha de Player (2026-10-12).

   O verbo `regrasAfty.almaComoAfty` troca a Alma do jogador, que é uma pilha do
   tamanho do PV, pela da criatura: "100 Máximo + Outros" (autor), em porcentagem,
   multiplicando o PV. A conta tem duas metades, e as duas são medidas aqui: o
   TETO no `deriveAfty` e o CORRENTE nos verbos de `ficha/ficha-sessao.js`, que
   perguntavam o sistema e passaram a perguntar o `almaPilha` do derivado.

   ⚠ A FICHA DE CRIATURA É O CONTROLE: com ou sem o Addon, nada dela muda. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { validarPacote, normalizarPacote } = await import(R + "afty-addons.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const SE = await import(R + "ficha/ficha-sessao.js");

const ALMA = JSON.parse(readFileSync(new URL("../addons/alma-do-afty.json", import.meta.url), "utf8"));

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. O PACOTE                                                   */
/* ============================================================ */
t("o Addon é válido", validarPacote(ALMA), []);
t("o normalizador preserva o verbo", normalizarPacote(ALMA).regrasAfty.almaComoAfty, true);
t("verbo que não é booleano é recusado",
  validarPacote({ ...ALMA, regrasAfty: { almaComoAfty: "sim" } }).length > 0, true);

/* Mesma ficha do t-alma-jogador: Nível 26, Combatente, 162 de PV base. */
const ficha = (sistema, { addon = false, len = [] } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 26, tipo: "misto", patamar: "comum" };
  f.especializacoes = [{ id: "combatente", nivel: 26 }];
  f.habilidadesLendarias = len;
  f.addons = addon ? [ALMA] : [];
  return f;
};
const LENDA = ["len_consciencia_absoluta_da_alma"];

/* ============================================================ */
/* 2. O TETO: 100 MÁXIMO + OUTROS                                */
/* ============================================================ */
const pilha = deriveAfty(ficha("player"));
const afty = deriveAfty(ficha("player", { addon: true }));

t("controle: sem o Addon a Alma do jogador é o PV", [pilha.almaMax, pilha.hp], [162, 162]);
t("controle: sem o Addon a Alma é pilha", pilha.almaPilha, true);
t("com o Addon a Alma é 100", afty.almaMax, 100);
t("com o Addon a Alma deixa de ser pilha", afty.almaPilha, false);
t("em 100 o PV não muda", afty.hp, pilha.hp);
t("e o hover do PV não ganha linha de Alma",
  afty.partes.hp.some((p) => p.label === "Integridade da Alma"), false);

/* Os Outros: a Lendária soma 25 na Alma e vira porcento no PV, igual à criatura. */
const pilhaLenda = deriveAfty(ficha("player", { len: LENDA }));
const aftyLenda = deriveAfty(ficha("player", { addon: true, len: LENDA }));
t("controle: sem o Addon a Lendária soma 25 pontos de PV", pilhaLenda.hp, 187);
t("com o Addon a Lendária leva a Alma a 125", aftyLenda.almaMax, 125);
t("e o PV a ×1,25", aftyLenda.hp, Math.round(162 * 1.25));
t("o hover mostra o multiplicador da Alma",
  aftyLenda.partes.hp.some((p) => p.label === "Integridade da Alma" && p.texto === "×1,25"), true);
t("e a Lendária não vira parcela somada do PV",
  aftyLenda.partes.hp.some((p) => p.label === "Consciência Absoluta da Alma"), false);

/* ============================================================ */
/* 3. EM JOGO: A ALMA FERIDA É PORCENTAGEM                       */
/* ============================================================ */
const fA = ficha("player", { addon: true });
let s = SE.normalizaSessao(null, afty);
t("a sessão nasce com a Alma cheia em 100", [s.almaAtual, s.almaMaxVisto], [100, 100]);
s = SE.aplicaDanoNaAlma(s, 40, afty);
const ferida = deriveAfty(fA, { almaAtual: s.almaAtual });
t("40 de Dano na Alma: 60 de 100", [s.almaAtual, ferida.almaMax], [60, 100]);
t("o PV máximo cai para 60%", ferida.hp, Math.round(162 * 0.6));
t("o Dano na Alma NÃO desconta a Vida corrente", s.hpAtual, afty.hp);
t("e não aparece como parcela negativa no hover",
  ferida.partes.hp.some((p) => p.label === "Dano na Alma"), false);
t("o multiplicador aparece no lugar dela",
  ferida.partes.hp.some((p) => p.label === "Integridade da Alma" && p.texto === "×0,6"), true);

/* Controle do jogador sem o Addon: o mesmo dano desce a Vida junto. */
let sp = SE.normalizaSessao(null, pilha);
sp = SE.aplicaDanoNaAlma(sp, 40, pilha);
t("controle: sem o Addon o Dano na Alma desce a Vida", sp.hpAtual, pilha.hp - 40);

/* A cura e o campo de digitar passam pelos mesmos verbos. */
const curada = SE.curaAlma(s, 30, afty);
t("a cura sobe só a Alma", [curada.almaAtual, curada.hpAtual], [90, s.hpAtual]);
const digitada = SE.defineAlma(SE.normalizaSessao(null, afty), 70, afty);
t("digitar 70 tira 30 da Alma e nada da Vida", [digitada.almaAtual, digitada.hpAtual], [70, afty.hp]);

/* ============================================================ */
/* 4. INSTALAR E DESINSTALAR NO MEIO DA CAMPANHA                 */
/* ============================================================ */
/* Uma sessão de pilha (162 de 162) que passa a usar o Addon apara em 100, e quem
   desinstala volta à pilha cheia pelo ganho do máximo. */
const reabre = (sessao, f) => {
  const d = deriveAfty(f, { almaAtual: sessao.almaAtual });
  return SE.aparaSessao(SE.normalizaSessao(sessao, d), d);
};
const antiga = SE.normalizaSessao(null, pilha);
const instalou = reabre(antiga, fA);
t("instalar apara a Alma em 100", [instalou.almaAtual, instalou.almaMaxVisto], [100, 100]);
const desinstalou = reabre(instalou, ficha("player"));
t("desinstalar devolve a pilha cheia", [desinstalou.almaAtual, desinstalou.almaMaxVisto], [162, 162]);

/* O máximo que sobe com o Addon segue a criatura: não soma na corrente. */
const subiu = reabre(SE.normalizaSessao(null, afty), ficha("player", { addon: true, len: LENDA }));
const subiuCriatura = reabre(
  SE.normalizaSessao(null, deriveAfty(ficha("afty"))), ficha("afty", { len: LENDA }));
t("com o Addon a Lendária no meio da campanha age como na criatura",
  [subiu.almaAtual, subiu.almaMaxVisto], [subiuCriatura.almaAtual, subiuCriatura.almaMaxVisto]);

/* ============================================================ */
/* 5. A CRIATURA NÃO MUDA                                        */
/* ============================================================ */
const campos = (d) => [d.almaMax, d.almaMult, d.almaPilha, d.hp];
t("criatura: o Addon não muda nada",
  campos(deriveAfty(ficha("afty", { addon: true }))), campos(deriveAfty(ficha("afty"))));
t("criatura: nem com a Lendária",
  campos(deriveAfty(ficha("afty", { addon: true, len: LENDA }))), campos(deriveAfty(ficha("afty", { len: LENDA }))));
t("criatura: a Alma segue sendo 100", deriveAfty(ficha("afty")).almaMax, 100);

/* Jogador com o Addon e criatura saem com a MESMA Alma e o MESMO multiplicador. */
t("jogador com o Addon e criatura: mesma Alma e mesmo multiplicador",
  [aftyLenda.almaMax, aftyLenda.almaMult],
  [deriveAfty(ficha("afty", { len: LENDA })).almaMax, deriveAfty(ficha("afty", { len: LENDA })).almaMult]);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
