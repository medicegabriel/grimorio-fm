/**
 * ATRIBUTO FANG (2026-10-12)
 *
 * Pedido do autor: *"Altera o Método de Rolagem de definição de Atributo. Para
 * permitir que Inteligência chegue até a Base de 19 ao invés de 18. Com isso, o
 * Atributo de Inteligência aumenta o Limite de Atributo sempre em 1. Até mesmo
 * caso o Atributo já esteja em 30. Ficando com Limite 31. Ou Limite 33 caso
 * possua Aperfeiçoamento de Atributo."*
 *
 * Leituras do autor no mesmo dia: o 19 é só o teto do CAMPO (a rolagem segue
 * 4d6), o +1 no Limite vale só no Método Rolagem, e o raw passou a travar a
 * Base da Rolagem em 3 a 18 nos dois sistemas.
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
const AD = await import(R + "afty-addons.js");
const AT = await import(R + "afty-atributos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const pacote = JSON.parse(readFileSync(new URL("../addons/atributo-fang.json", import.meta.url), "utf8"));
t("o pacote valida", AD.validarPacote(pacote), []);
t("e aplica sem problema", AD.aplicarAddons([pacote]).problemas, []);

const base = { forca: 10, destreza: 12, constituicao: 14, inteligencia: 18, sabedoria: 10, presenca: 10 };
const ficha = ({ addon = true, metodo = "rolagem", int = 18, nivel = 0, passivo = null, lendaria = false, sistema = "player" } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.attrMethod = metodo;
  f.core = { ...f.core, nd: lendaria ? 30 : 20, tipo: "misto", patamar: "comum" };
  f.attributes = { ...base, inteligencia: int };
  f.attrNivel = nivel ? { inteligencia: nivel } : {};
  f.especializacoes = lendaria
    ? [{ id: "combatente", nivel: 20 }, { id: "conjurador", nivel: 10 }]
    : [{ id: "conjurador", nivel: 20 }];
  if (addon) f.addons = [pacote];
  if (passivo != null) {
    f.feiticos = [{
      id: "fp_limite", nome: "Quebra de Limite", tipo: "passivo",
      efeitosPassivo: [{ canal: "limiteAtributo", alvo: "inteligencia", expr: String(passivo) }],
    }];
  }
  if (lendaria) {
    f.habilidadesLendarias = ["len_aperfeicoamento_de_atributo"];
    f.escolhasAltoNivel = { len_aperfeicoamento_de_atributo: ["inteligencia"] };
  }
  return f;
};
const soma = (partes) => (partes || []).reduce((s, p) => s + (Number(p.valor) || 0), 0);
const cortado = (partes) => (partes || []).filter((p) => p.texto)
  .reduce((s, p) => s + Math.abs(Number(String(p.texto).replace("−", "-")) || 0), 0);

/* ============================================================ */
/* 1. O CAMPO DE BASE NA ROLAGEM                                 */
/* ============================================================ */
t("o raw trava a Rolagem em 18", AT.rolagemMaxDe(ficha({ addon: false }), "inteligencia"), 18);
t("com o Addon a Inteligência vai a 19", AT.rolagemMaxDe(ficha(), "inteligencia"), 19);
t("e os outros seguem em 18", AT.rolagemMaxDe(ficha(), "forca"), 18);
const avisos = (f) => AT.resumoAtributos(f).warnings.filter((w) => /fora da faixa/.test(w));
t("19 de INT sem o Addon avisa", avisos(ficha({ addon: false, int: 19 })), ["Inteligência: base 19 fora da faixa 3 a 18."]);
t("19 de INT com o Addon não avisa", avisos(ficha({ int: 19 })), []);
t("20 de INT com o Addon avisa", avisos(ficha({ int: 20 })), ["Inteligência: base 20 fora da faixa 3 a 19."]);
t("19 de Força com o Addon avisa", avisos({ ...ficha(), attributes: { ...base, forca: 19 } }), ["Força: base 19 fora da faixa 3 a 18."]);
t("abaixo de 3 avisa", avisos(ficha({ addon: false, int: 2 })), ["Inteligência: base 2 fora da faixa 3 a 18."]);
t("Compra por Pontos não ganha o aviso da Rolagem", avisos(ficha({ metodo: "pontos", int: 19 })).some((w) => /3 a/.test(w)), false);

/* ============================================================ */
/* 2. O LIMITE SOBE EM 1, SÓ NA ROLAGEM                          */
/* ============================================================ */
const cru = deriveAfty(ficha({ addon: false }));
const fang = deriveAfty(ficha());
t("sem o Addon, Limite 20", cru.attrLimiteEfetivo.inteligencia, 20);
t("com o Addon, Limite 21", fang.attrLimiteEfetivo.inteligencia, 21);
t("os outros limites não mexem", ["forca", "destreza", "constituicao", "sabedoria", "presenca"]
  .filter((k) => cru.attrLimiteEfetivo[k] !== fang.attrLimiteEfetivo[k]), []);
t("fora da Rolagem o Limite não sobe", deriveAfty(ficha({ metodo: "pontos", int: 15 })).attrLimiteEfetivo.inteligencia, 20);
t("nos Valores Fixos também não", deriveAfty(ficha({ metodo: "fixos", int: 15 })).attrLimiteEfetivo.inteligencia, 20);
t("o valor alocado alcança o 21", deriveAfty(ficha({ int: 19, nivel: 2 })).attrEff.inteligencia, 21);
t("e o 22 é aparado nele", deriveAfty(ficha({ int: 19, nivel: 3 })).attrPerda.inteligencia, 1);
t("vale na criatura também", deriveAfty(ficha({ sistema: "afty" })).attrLimiteEfetivo.inteligencia, 21);

/* ============================================================ */
/* 3. FURA O 30 E O 32                                           */
/* ============================================================ */
const trinta = deriveAfty(ficha({ passivo: 10, nivel: 12 }));
t("Limite 30 pelo Motor vira 31", trinta.attrLimiteEfetivo.inteligencia, 31);
t("e o valor chega a 30 (18 + 12)", trinta.attrEff.inteligencia, 30);
const trintaUm = deriveAfty(ficha({ passivo: 10, nivel: 13 }));
t("e a 31 com um ponto a mais", [trintaUm.attrEff.inteligencia, trintaUm.attrPerda.inteligencia], [31, 0]);
const absurdo = deriveAfty(ficha({ passivo: 50, nivel: 40 }));
t("o teto do sistema vira 31", [absurdo.attrLimiteEfetivo.inteligencia, absurdo.attrEff.inteligencia], [31, 31]);
t("sem o Addon o mesmo caso para em 30",
  deriveAfty(ficha({ addon: false, passivo: 50, nivel: 40 })).attrLimiteEfetivo.inteligencia, 30);

const semLend = deriveAfty({ ...ficha({ addon: false, passivo: 50, nivel: 40, lendaria: true }) });
const comLend = deriveAfty(ficha({ passivo: 50, nivel: 40, lendaria: true }));
t("com Aperfeiçoamento sem o Addon, Limite 32", semLend.attrLimiteEfetivo.inteligencia, 32);
t("com Aperfeiçoamento e o Addon, Limite 33", comLend.attrLimiteEfetivo.inteligencia, 33);
t("e o valor chega a 33", comLend.attrEff.inteligencia, 33);

/* ============================================================ */
/* 4. O HOVER FECHA A CONTA E NOMEIA O ADDON                     */
/* ============================================================ */
for (const [nome, d] of [["21", fang], ["31", trinta], ["teto", absurdo], ["33", comLend]]) {
  t(`o hover do limite fecha a conta (${nome})`,
    soma(d.partesLimite.inteligencia) - cortado(d.partesLimite.inteligencia), d.attrLimiteEfetivo.inteligencia);
  t(`e o do valor também (${nome})`,
    soma(d.partesAtributo.inteligencia) - cortado(d.partesAtributo.inteligencia), d.attrEff.inteligencia);
}
t("a parcela leva o nome do Addon",
  fang.partesLimite.inteligencia.find((p) => p.label === "Atributo Fang")?.valor, 1);

/* ============================================================ */
/* 5. O VALIDADOR                                                */
/* ============================================================ */
const com = (rolagem) => AD.validarPacote({ ...pacote, atributos: { inteligencia: { rolagem } } }).length > 0;
t("baseMax abaixo de 18 é recusado", com({ baseMax: 17 }), true);
t("baseMax fracionado é recusado", com({ baseMax: 19.5 }), true);
t("limite zero é recusado", com({ limite: 0 }), true);
t("rolagem em lista é recusada", com([19]), true);
t("só o baseMax é aceito", com({ baseMax: 20 }), false);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
