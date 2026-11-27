/* O BÔNUS DE DANO DA CONJURAÇÃO APRIMORADA NO PLAYER (2026-11-23).

   Feedback do lançamento: "como suporte ele adiciona o bônus de conjuração aprimorada de especialista em
   técnica". O bônus entrava em todo Feitiço de Dano sem olhar o sistema. O autor decidiu "Só no Player":
   a criatura segue com o bônus grátis de 2026-08-06, e o jogador só soma com a habilidade.

   Divergência `conjuracaoAprimoradaNoDano` em afty-sistema.js. O que este arquivo prende:
     1. o Suporte do jogador não soma, o Conjurador soma, e a multiclasse com Conjurador soma;
     2. a criatura soma com qualquer classe, como antes;
     3. a cópia remendada do Especialista em Estilo é marcada `remendada` e não conta. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
import { readFileSync } from "node:fs";

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { createBlankFeitico, bonusConjuracaoAprimorada } = await import(R + "afty-feiticos.js");
const S = await import(R + "afty-sistema.js");
const AD = await import(R + "afty-addons.js");
const HAB = await import(R + "afty-habilidades.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* Nível 5 com Presença 20 (modificador 5) e um Feitiço de Dano de Nível 2: o bônus do livro é o
   Modificador de Atributo, então a linha com bônus é "7d8+5" e sem bônus é "7d8". */
const ficha = (sistema, classes) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 5, tipo: "conjurador", patamar: "comum", tecnicaAttr: "presenca" };
  f.especializacoes = classes;
  f.attributes = { ...f.attributes, presenca: 20 };
  f.feiticos = [{ ...createBlankFeitico(), id: "f1", nome: "Raio", tipo: "dano", nivel: 2, resolucao: "tr", alvo: "unico", acao: "comum" }];
  return f;
};
const dano = (sistema, classes) => deriveAfty(ficha(sistema, classes)).feiticos.lista[0].valor;

t("a divergencia existe e esta ligada", S.DIVERGENCIAS.find((d) => d.id === "conjuracaoAprimoradaNoDano")?.ativa, true);
t("o jogador usa o ramo player", S.regraDo("player", "conjuracaoAprimoradaNoDano"), "player");
t("a criatura usa o ramo afty", S.regraDo("afty", "conjuracaoAprimoradaNoDano"), "afty");

t("o Suporte do jogador NAO soma o bonus", dano("player", [{ id: "suporte", nivel: 5 }]), "7d8");
t("o Combatente do jogador tambem nao", dano("player", [{ id: "combatente", nivel: 5 }]), "7d8");
t("o Conjurador do jogador soma", dano("player", [{ id: "conjurador", nivel: 5 }]), "7d8+5");
t("Suporte com Conjurador em multiclasse soma",
  dano("player", [{ id: "suporte", nivel: 3 }, { id: "conjurador", nivel: 2 }]), "7d8+5");

t("a criatura Suporte segue somando", dano("afty", [{ id: "suporte", nivel: 5 }]), "7d8+5");
t("a criatura Conjurador segue somando", dano("afty", [{ id: "conjurador", nivel: 5 }]), "7d8+5");

t("so o false explicito desliga a funcao", bonusConjuracaoAprimorada(2, { modTecnica: 5, nd: 5 }), 5);
t("e com false ela devolve zero", bonusConjuracaoAprimorada(2, { modTecnica: 5, nd: 5, conjuracaoAprimorada: false }), 0);

/* A herdeira que reescreve a habilidade. */
const PACOTE = JSON.parse(readFileSync(new URL("../addons/especialista-em-estilo.json", import.meta.url), "utf8"));
t("o Especialista em Estilo entra", AD.aplicarAddons([PACOTE]).problemas, []);
const clone = HAB.getHabilidade("especialista-em-estilo:esp_estilo__cnj_conjuracao_aprimorada");
t("o clone da Conjuracao Aprimorada existe", !!clone, true);
t("e vem marcado como remendado", clone?.remendada, true);
t("e continua dizendo de onde veio", HAB.habilidadeHerdadaDe(clone?.id), "cnj_conjuracao_aprimorada");
const clonesSemRemendo = HAB.AFTY_HABILIDADES.filter((h) => h.herdadaPor === "especialista-em-estilo:esp_estilo" && !h.remendada);
t("a herdeira tem clones sem remendo, e eles nao ganham a marca", clonesSemRemendo.length > 0, true);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
