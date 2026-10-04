/* O DESENVOLVIMENTO INESPERADO DO DERIVADO (divergência `desenvolvimentoNoNivel`, 2026-10-01).

   "A cada quatro níveis, recebe um ponto de atributo adicional e aumenta em 1 o
   limite do atributo escolhido."

   Na criatura cada ponto do quadro sobe o valor e o limite do mesmo atributo.
   No jogador o ponto entra livre no contador de Pontos de Nível, e o quadro fica
   só com o +1 de limite por escolha. Relato do autor: o jogador Derivado não
   recebia o ponto, e a ficha "considera como se fosse Inato". A ficha salva não
   migra: o mapa gravado vira a escolha de limite, e o valor volta como ponto
   livre no contador. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { resumoAtributos } = await import(R + "afty-atributos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ficha = (sistema, { nd = 8, origem = "derivado", desenvolvimento = {}, attrNivel = {}, attributes } = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core.nd = nd;
  c.core.origem = { id: origem, desenvolvimento };
  c.attributes = attributes ?? { forca: 15, destreza: 14, constituicao: 13, inteligencia: 12, sabedoria: 10, presenca: 8 };
  c.attrNivel = attrNivel;
  return c;
};
const nivelTotal = (c) => {
  const d = deriveAfty(c);
  return resumoAtributos(c, d.attrLimiteEfetivo, d.attrPerda, d.attrNivelExtra).nivelTotal;
};
const temParte = (partes, label) => (partes ?? []).some((p) => p.label === label);

/* 1. Na criatura nada muda: o ponto sobe valor e limite. */
const criatura = deriveAfty(ficha("afty", { desenvolvimento: { constituicao: 2 } }));
t("criatura: o ponto sobe o valor", criatura.attrEff.constituicao, 15);
t("criatura: e o limite", criatura.attrLimiteEfetivo.constituicao, 22);
t("criatura: o quadro e de valor e limite", criatura.desenvolvimentoSoLimite, false);
t("criatura: nenhum ponto de nivel a mais", criatura.attrNivelExtra, 0);
t("criatura: o contador do ND 8 segue 4", nivelTotal(ficha("afty")), 4);
t("criatura: o hover do valor nomeia o Desenvolvimento",
  temParte(criatura.partesAtributo.constituicao, "Desenvolvimento Inesperado"), true);

/* 2. No jogador o ponto vai para os Pontos de Nível. */
const jogador = deriveAfty(ficha("player", { desenvolvimento: { constituicao: 2 } }));
t("jogador: o quadro nao sobe o valor", jogador.attrEff.constituicao, 13);
t("jogador: e sobe o limite", jogador.attrLimiteEfetivo.constituicao, 22);
t("jogador: o quadro e so de limite", jogador.desenvolvimentoSoLimite, true);
t("jogador: dois pontos de nivel a mais no 8", jogador.attrNivelExtra, 2);
t("jogador: o contador do Nivel 8 vai de 4 para 6", nivelTotal(ficha("player")), 6);
t("jogador: o hover do valor nao nomeia o Desenvolvimento",
  temParte(jogador.partesAtributo.constituicao, "Desenvolvimento Inesperado"), false);
t("jogador: o hover do limite nomeia",
  temParte(jogador.partesLimite.constituicao, "Desenvolvimento Inesperado"), true);
t("jogador: o valor do quadro some do attrDesenv (chip e reserva do criador)", jogador.attrDesenv, {});
t("jogador: o limite fica em attrDesenvLimite", jogador.attrDesenvLimite, { constituicao: 2 });

/* 3. A cadência: um ponto a cada quatro níveis. */
t("jogador: a cadencia por nivel",
  [3, 4, 7, 12, 20].map((nd) => deriveAfty(ficha("player", { nd })).attrNivelExtra), [0, 1, 1, 3, 5]);

/* 4. Só o Derivado. */
const inato = deriveAfty(ficha("player", { origem: "inato" }));
t("jogador Inato: nenhum ponto a mais", [inato.attrNivelExtra, inato.desenvolvimentoSoLimite], [0, false]);
t("jogador Inato: o contador do Nivel 8 segue 4", nivelTotal(ficha("player", { origem: "inato" })), 4);

/* 5. O ponto livre e o limite trabalham juntos: a Constituição sobe a 22 pelos
   pontos de nível, e só cabe porque o quadro abriu o limite. */
const junto = (desenvolvimento) => deriveAfty(ficha("player", {
  attributes: { forca: 10, destreza: 10, constituicao: 15, inteligencia: 10, sabedoria: 10, presenca: 10 },
  attrNivel: { constituicao: 7 }, desenvolvimento,
}));
t("com o limite aberto, a Constituicao chega a 22", junto({ constituicao: 2 }).attrEff.constituicao, 22);
t("sem ele, para no 20", junto({}).attrEff.constituicao, 20);

/* 6. A ficha salva com pontos no quadro antigo não perde o que tinha de limite,
   e o valor volta como ponto livre: o contador mostra os 2 de sobra. */
const salva = ficha("player", { desenvolvimento: { forca: 2 } });
const dSalva = deriveAfty(salva);
const rSalva = resumoAtributos(salva, dSalva.attrLimiteEfetivo, dSalva.attrPerda, dSalva.attrNivelExtra);
t("ficha salva: o limite gravado continua", dSalva.attrLimiteEfetivo.forca, 22);
t("ficha salva: o valor volta ao contador", [rSalva.nivelUsado, rSalva.nivelTotal], [0, 6]);
t("ficha salva: nenhum aviso de excesso", rSalva.warnings.length, 0);

/* 7. O resumo sem o extra segue igual (quem não passa o quarto argumento). */
t("resumoAtributos sem o extra", resumoAtributos(ficha("player")).nivelTotal, 4);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
