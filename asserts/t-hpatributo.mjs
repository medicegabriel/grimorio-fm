import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { EFEITO_CANAIS, getCanal, EFEITO_CANAL_GRUPOS } = await import(R + "afty-efeitos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ---- o canal existe e é irmão do defesaAtributo ---- */
t("canal existe", !!getCanal("hpAtributo"), true);
t("canal pede alvo de atributo", getCanal("hpAtributo").alvo, "atributo");
t("mesmo alvo do irmao", getCanal("hpAtributo").alvo, getCanal("defesaAtributo").alvo);
t("nao caiu em Outros",
  EFEITO_CANAL_GRUPOS.find((g) => g.itens.some((c) => c.id === "hpAtributo"))?.label,
  "Atributos e Aptidões");
t("id unico", EFEITO_CANAIS.filter((c) => c.id === "hpAtributo").length, 1);

/* ---- ponta a ponta ----
   ND 12, Combatente. Constituição e Força escolhidas à mão para o modificador
   de cada uma ser conhecido: o PV muda em ND × (mod novo - mod velho). */
const criatura = (attrs, efeitos) => {
  const c = createBlankAfty();
  c.core.nd = 12;
  c.core.tipo = "combatente";
  c.attributes = { ...c.attributes, ...attrs };
  if (efeitos) c.core.tecnicaEfeitos = efeitos;
  return c;
};

const ATTRS = { forca: 18, destreza: 10, constituicao: 12, inteligencia: 10, sabedoria: 10, presenca: 10 };
// mod Força +4, mod Constituição +1. ND 12, então trocar vale 12 × (4 - 1) = 36
// na base, e o Comum multiplica o PV por 1.

const semTroca = deriveAfty(criatura(ATTRS, null));
const comForca = deriveAfty(criatura(ATTRS, [{ canal: "hpAtributo", alvo: "forca", expr: "1" }]));
t("trocar para Forca sobe o PV em ND x delta", comForca.hp - semTroca.hp, 12 * (4 - 1));

/* Trocar para um atributo PIOR não faz nada: "você pode optar". */
const comInt = deriveAfty(criatura(ATTRS, [{ canal: "hpAtributo", alvo: "inteligencia", expr: "1" }]));
t("trocar para atributo pior nao muda nada", comInt.hp, semTroca.hp);

/* Duas trocas concedidas: vale a melhor. */
const duas = deriveAfty(criatura(ATTRS, [
  { canal: "hpAtributo", alvo: "inteligencia", expr: "1" },
  { canal: "hpAtributo", alvo: "forca", expr: "1" },
]));
t("com duas concedidas vale a melhor", duas.hp, comForca.hp);

/* Expressão que avalia a zero NÃO concede. */
const desligada = deriveAfty(criatura(ATTRS, [{ canal: "hpAtributo", alvo: "forca", expr: "0" }]));
t("expressao zero nao concede", desligada.hp, semTroca.hp);

/* Condição com `quando` liga e desliga a troca. */
const comQuando = (nd) => {
  const c = criatura(ATTRS, [{ canal: "hpAtributo", alvo: "forca", expr: "1", quando: "nd >= 20" }]);
  c.core.nd = nd;
  return deriveAfty(c);
};
const cru = (nd) => { const c = criatura(ATTRS, null); c.core.nd = nd; return deriveAfty(c); };
t("quando falso nao troca", comQuando(12).hp, cru(12).hp);
t("quando verdadeiro troca", comQuando(20).hp - cru(20).hp, 20 * (4 - 1));

/* SUBSTITUI, não soma: pelo canal `hp` a mesma intenção daria outro número. */
const somado = deriveAfty(criatura(ATTRS, [{ canal: "hp", alvo: null, expr: "12 * mod_forca" }]));
t("somar pelo canal hp NAO e a mesma coisa", somado.hp === comForca.hp, false);

/* ---- o hover conta a verdade ---- */
const linhas = comForca.partes.hp.map((l) => l.label);
t("hover nomeia o atributo trocado",
  linhas.some((l) => String(l).includes("no lugar da Constituição")), true);
t("hover nao mostra mais a Constituicao crua",
  linhas.includes("Constituição × ND"), false);
t("hover sem troca continua na Constituicao",
  semTroca.partes.hp.map((l) => l.label).includes("Constituição × ND"), true);
t("hover mostra a fonte que substituiu",
  comForca.partes.hp.some((l) => l.texto === "substitui"), true);

/* ---- Patamar e Alma continuam multiplicando por cima da troca ---- */
const beyond = (efeitos) => {
  const c = criatura(ATTRS, efeitos);
  c.core.patamar = "beyond";
  return deriveAfty(c);
};
t("a troca escala com o Patamar", beyond([{ canal: "hpAtributo", alvo: "forca", expr: "1" }]).hp - beyond(null).hp,
  12 * (4 - 1) * 4);

/* ---- ficha suja ---- */
for (const lixo of [null, undefined, {}, { core: null }]) {
  try { deriveAfty(lixo); ok++; } catch (e) { bad.push(`ficha suja: ${e.message}`); }
}
t("alvo invalido nao derruba",
  typeof deriveAfty(criatura(ATTRS, [{ canal: "hpAtributo", alvo: "nao_existe", expr: "1" }])).hp, "number");
/* ALVO AUSENTE = vale para TODOS, que é a convenção do motor. Aqui isso dá
   exatamente o texto do autor, "para um a minha escolha": vale o melhor dos
   seis, e o hover nomeia qual foi. */
const semAlvo = deriveAfty(criatura(ATTRS, [{ canal: "hpAtributo", expr: "1" }]));
t("alvo ausente escolhe o melhor dos seis", semAlvo.hp, comForca.hp);
t("alvo ausente nomeia o escolhido no hover",
  semAlvo.partes.hp.some((l) => String(l.label).includes("Força × ND (no lugar da Constituição)")), true);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
