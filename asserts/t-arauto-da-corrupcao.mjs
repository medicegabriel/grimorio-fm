/**
 * ORIGEM ARAUTO DA CORRUPÇÃO, por Addon (autor, 2026-09-12).
 *
 * Pedido: *"Faça um addon para a Origem abaixo, o quê for dificil de programar
 * deixa somente como TEXTO e programe a base como PE por Nível, deixa a TAG DE
 * PROGRAMADO no que tiver sido automatizado."*
 *
 * O que é programado, e leva `[Programado]` no nome (mesma posição da tag `[2.0]`
 * das versões antigas do livro, que aparece em todo lugar que mostra o nome):
 *   • Bônus de Atributo: 3 pontos, máximo 2 no mesmo atributo.
 *   • Vosso Jardim: +1 PE a cada nível par. A imunidade e o Corrompimento no
 *     crítico ficam de texto.
 *   • Corpo Transbordante: Bônus de Treinamento em Atletismo e +1 PV por nível.
 *
 * Todo o resto gasta, conta ou multiplica CORRUPÇÃO, e o sistema não tem essa
 * mecânica em lugar nenhum. Fica como texto, sem número inventado.
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. O pacote valida e instala.
 * 2. Os números das três partes programadas, nos dois sistemas.
 * 3. ⚠ A TAG NÃO MENTE: todo nome com `[Programado]` move número, e nenhum nome
 *    sem a tag move. É o DECLARADO contra o EMITIDO, porque uma tag que envelhece
 *    diria que algo está ligado sem estar, ou esconderia algo que está.
 */
import { readFileSync } from "node:fs";
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const O = await import(R + "afty-origens.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const cru = JSON.parse(readFileSync(new URL("../addons/arauto-da-corrupcao.json", import.meta.url), "utf8"));
const pacote = A.normalizarPacote(cru);

/* ============================================================ */
/* 1. O PACOTE                                                   */
/* ============================================================ */
t("o pacote valida", A.validarPacote(cru), []);
t("e instala sem problema", A.aplicarAddons([pacote]).problemas ?? [], []);

const ORIGEM = "arauto-da-corrupcao:arauto_da_corrupcao";
const origem = O.getOrigem(ORIGEM);
t("a origem entra no catálogo", origem?.nome, "Arauto da Corrupção");
t("e no seletor", O.AFTY_ORIGENS.some((o) => o.value === ORIGEM), true);
t("as quatro características, com a tag nas programadas", origem.caracteristicas.map((c) => c.nome), [
  "[Programado] Bônus de Atributo",
  "[Programado] Vosso Jardim",
  "Consumindo Esse Mal",
  "Características Únicas",
]);
const unicas = origem.caracteristicas.find((c) => c.escolha)?.escolha;
t("as quatro Características Únicas cabem juntas", [unicas.vagas, unicas.opcoes.length], [4, 4]);
t("nenhum texto de tela com travessão ou ponto e vírgula",
  JSON.stringify(cru.acrescenta).match(/[—;]/g), null);

/* ============================================================ */
/* 2. OS NÚMEROS                                                 */
/* ============================================================ */
const ficha = (sistema, nd, { arauto = true, bonus = {}, unicasEscolhidas = [] } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd };
  f.addons = [pacote];
  f.core.origem = arauto
    ? { id: ORIGEM, bonusAtributos: bonus, escolhas: { arauto_caracteristicas_unicas: unicasEscolhidas }, pools: {} }
    : {};
  return f;
};
const atletismo = (d) => d.testes.pericias.find((p) => p.id === "atletismo")?.bonus;

for (const s of ["player", "afty"]) {
  /* Vosso Jardim: "+1 de PE a cada nível par". Mesma ficha sem origem de base. */
  t(`${s}: +1 PE a cada nível par`,
    [1, 2, 3, 4, 5, 6, 20].map((nd) => deriveAfty(ficha(s, nd)).pe - deriveAfty(ficha(s, nd, { arauto: false })).pe),
    [0, 1, 1, 2, 2, 3, 10]);

  /* Bônus de Atributo: +2 num e +1 noutro. */
  t(`${s}: os pontos distribuídos chegam nos atributos`,
    (({ forca, destreza }) => [forca, destreza])(deriveAfty(ficha(s, 5, { bonus: { forca: 2, destreza: 1 } })).attrBonus),
    [2, 1]);

  /* Corpo Transbordante: BT em Atletismo e +1 PV por nível, só quando marcada. */
  const sem = deriveAfty(ficha(s, 8));
  const com = deriveAfty(ficha(s, 8, { unicasEscolhidas: ["arauto_corpo_transbordante"] }));
  t(`${s}: Corpo Transbordante soma a Maestria em Atletismo`, atletismo(com) - atletismo(sem), com.maestria);
  t(`${s}: e +1 PV por nível`, com.hp - sem.hp, 8);
}

/* ============================================================ */
/* 3. A TAG NÃO MENTE                                            */
/* ============================================================ */
/* Cada parte isolada, contra a origem sem nada: o que ela move. A distribuição
   do Bônus de Atributo e o PE do Vosso Jardim são da ORIGEM (não dá para ligar
   um sem o outro), então elas se medem pelo campo de cada uma. */
const CAMPOS = ["hp", "pe", "defesa", "cd", "iniciativa", "movimento", "atencao"];
const foto = (d) => [...CAMPOS.map((k) => d[k]), atletismo(d), JSON.stringify(d.attrBonus)];
const base = foto(deriveAfty(ficha("player", 8)));
for (const opcao of unicas.opcoes) {
  const move = JSON.stringify(foto(deriveAfty(ficha("player", 8, { unicasEscolhidas: [opcao.id] })))) !== JSON.stringify(base);
  t(`a tag de "${opcao.nome}" bate com o que ela move`, move, opcao.nome.startsWith("[Programado]"));
}
t("o Vosso Jardim move o PE",
  deriveAfty(ficha("player", 8)).pe !== deriveAfty(ficha("player", 8, { arauto: false })).pe, true);
t("o Bônus de Atributo move os atributos",
  JSON.stringify(deriveAfty(ficha("player", 8, { bonus: { sabedoria: 2 } })).attrBonus) !== JSON.stringify(deriveAfty(ficha("player", 8)).attrBonus),
  true);
t("a característica de mesa é marcada como mesa, e sem tag",
  origem.caracteristicas.filter((c) => c.mesa).map((c) => c.nome), ["Consumindo Esse Mal"]);

/* ============================================================ */
console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
