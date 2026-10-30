/* Treino de Atributo na Ficha de Player (2026-10-12): o pacote que reabre a Linha
   que saiu do jogador em 2026-09-01. O mecanismo (`foraDoJogador` mais a
   liberação `soPorAddon:atributo`) é medido no bloco 12 do `t-sistema.mjs`, com
   um pacote de mentira. Aqui quem é medido é o JSON de verdade. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { validarPacote, normalizarPacote, liberacoesDaCriatura } = await import(R + "afty-addons.js");
const { createBlankAfty, mesclaFichaAfty } = await import(R + "afty-schema.js");
const { deriveAfty } = await import(R + "afty-derive.js");
const { treinamentosDaOrigem } = await import(R + "afty-treinamentos.js");

const ler = (nome) => JSON.parse(readFileSync(new URL(`../addons/${nome}.json`, import.meta.url), "utf8"));
const PACOTE = ler("treino-de-atributo");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

t("o pacote é válido", validarPacote(PACOTE), []);
t("e só libera, sem acrescentar nem remendar",
  Object.keys(PACOTE).filter((k) => ["acrescenta", "substitui", "permite", "regrasAfty"].includes(k)), []);
t("a liberação sobrevive ao normalizador", normalizarPacote(PACOTE).libera, ["soPorAddon:atributo"]);
t("texto de tela sem travessão nem ponto e vírgula", /[—;]/.test(PACOTE.descricao), false);

const ficha = (sistema, addons = [], treinamentos = undefined) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum", origem: { id: "inato" } };
  f.especializacoes = [{ id: "conjurador", nivel: 10 }];
  f.attributes = { forca: 14, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 };
  f.addons = addons;
  if (treinamentos) f.treinamentos = treinamentos;
  return mesclaFichaAfty(f);
};
const naLista = (f) => treinamentosDaOrigem("inato", null, f).some((l) => l.id === "atributo");

/* A porta. */
t("a criatura lê a liberação", liberacoesDaCriatura(ficha("player", [PACOTE])), ["soPorAddon:atributo"]);
t("no jogador sem o pacote a Linha não aparece", naLista(ficha("player")), false);
t("no jogador com o pacote ela aparece", naLista(ficha("player", [PACOTE])), true);
t("na criatura ela aparece com ou sem o pacote",
  [naLista(ficha("afty")), naLista(ficha("afty", [PACOTE]))], [true, true]);
t("o pacote não abre as outras quatro portas",
  liberacoesDaCriatura(ficha("player", [PACOTE])).filter((id) => id !== "soPorAddon:atributo"), []);

/* O número. A Linha devolvida é a mesma do livro, então a ficha de jogador com
   o pacote soma igual à criatura. */
for (const sistema of ["player", "afty"]) {
  const base = deriveAfty(ficha(sistema, [PACOTE]));
  const meia = deriveAfty(ficha(sistema, [PACOTE], { atributo: [{ alvo: "forca", progresso: 2 }] }));
  const cheia = deriveAfty(ficha(sistema, [PACOTE], { atributo: [{ alvo: "forca", progresso: 4 }] }));
  t(`${sistema}: duas etapas somam 2 na Força`, meia.attrEff.forca - base.attrEff.forca, 2);
  t(`${sistema}: as quatro somam 4`, cheia.attrEff.forca - base.attrEff.forca, 4);
  t(`${sistema}: a meia Linha não mexe no limite`, meia.attrLimiteEfetivo.forca - base.attrLimiteEfetivo.forca, 0);
  t(`${sistema}: o Completo sobe o limite em 2`, cheia.attrLimiteEfetivo.forca - base.attrLimiteEfetivo.forca, 2);
  t(`${sistema}: e não toca nos outros atributos`, cheia.attrEff.destreza, base.attrEff.destreza);
}

/* Duas instâncias em atributos diferentes, que é o "uma vez por atributo". */
{
  const base = deriveAfty(ficha("player", [PACOTE]));
  const duas = deriveAfty(ficha("player", [PACOTE], {
    atributo: [{ alvo: "forca", progresso: 1 }, { alvo: "sabedoria", progresso: 3 }],
  }));
  t("player: duas instâncias somam cada uma no seu atributo",
    [duas.attrEff.forca - base.attrEff.forca, duas.attrEff.sabedoria - base.attrEff.sabedoria], [1, 3]);
}

/* ⚠ Desinstalar não confisca: a ficha que já treinou continua vendo a Linha e
   somando, pela terceira porta do `filtraForaDoJogador` (decisão do autor). */
{
  const semPacote = ficha("player", [], { atributo: [{ alvo: "forca", progresso: 2 }] });
  t("player: sem o pacote a Linha já treinada continua na lista", naLista(semPacote), true);
  t("player: e continua somando",
    deriveAfty(semPacote).attrEff.forca - deriveAfty(ficha("player")).attrEff.forca, 2);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
