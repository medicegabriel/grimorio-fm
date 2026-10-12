/* REVISÃO P01 (2026-10-07): o requisito de atributo da Multiclasse.

   Livro de Regras 2.5.2, página 47: "Para o fazer, você deve atender os
   requisitos para Multiclasse especificados nas características da outra
   especialização que deseja." O catálogo declarava `{ attrs, valor }` e nenhum
   resolvedor lia. Na ficha de jogador o requisito agora vale (divergência
   `requisitoMulticlasse`): o seletor do criador não deixa entrar, e a ficha que
   já tem a classe sem o requisito recebe aviso, sem perder nada. Na criatura a
   pergunta está com o autor, e o comportamento continua o de antes.

   Limiar antes, no e depois (15, 16, 17), permanente contra temporário, e a
   classe inicial, que não paga requisito nenhum. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const E = await import(R + "afty-especializacoes.js");
const S = await import(R + "afty-sistema.js");
const { createBlankAfty } = await import(R + "afty-schema.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const attrs = (extra = {}) => ({ forca: 14, destreza: 14, constituicao: 14, inteligencia: 12, sabedoria: 12, presenca: 14, ...extra });

/* ---- a função, com os requisitos do livro (páginas 49, 63, 78, 90 e 102) ---- */
t("Conjurador pede INT ou SAB 16", E.faltaRequisitoMulticlasse("conjurador", attrs()), { attrs: ["inteligencia", "sabedoria"], valor: 16 });
for (const [v, esperado] of [[15, false], [16, true], [17, true]]) {
  t(`Conjurador com INT ${v}`, E.faltaRequisitoMulticlasse("conjurador", attrs({ inteligencia: v })) === null, esperado);
  t(`Conjurador com SAB ${v} (basta UM dos dois)`, E.faltaRequisitoMulticlasse("conjurador", attrs({ sabedoria: v })) === null, esperado);
}
t("Lutador pede FOR ou DES 16", E.faltaRequisitoMulticlasse("lutador", attrs())?.attrs, ["forca", "destreza"]);
t("Combatente pede FOR ou DES 16", E.faltaRequisitoMulticlasse("combatente", attrs({ destreza: 16 })), null);
t("Suporte pede PRE ou SAB 16", E.faltaRequisitoMulticlasse("suporte", attrs())?.attrs, ["presenca", "sabedoria"]);
t("Controlador pede PRE ou SAB 16", E.faltaRequisitoMulticlasse("controlador", attrs({ presenca: 16 })), null);
t("Restringido não passa por aqui (a proibição é outra trava)", E.faltaRequisitoMulticlasse("restringido", attrs()), null);
t("Especialização sem requisito declarado não é barrada", E.faltaRequisitoMulticlasse("id_inexistente", attrs()), null);

/* ---- a lista: a inicial (a primeira) nunca paga ---- */
t("Lutador inicial + Conjurador sem INT/SAB 16: só o Conjurador falta",
  E.multiclassesSemRequisito([{ id: "lutador", nivel: 2 }, { id: "conjurador", nivel: 2 }], attrs()).map((x) => x.id), ["conjurador"]);
t("Conjurador INICIAL com INT 12 (e FOR 16 para o Lutador) não falta nada",
  E.multiclassesSemRequisito([{ id: "conjurador", nivel: 2 }, { id: "lutador", nivel: 2 }], attrs({ forca: 16 })), []);

/* ---- pelo derive, nos dois sistemas ---- */
const ficha = (sistema, esp, a, efeitos = []) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd: 4, tipo: "combatente", patamar: "comum", tecnicaEfeitos: efeitos };
  c.especializacoes = esp;
  c.attributes = a;
  return c;
};
const MULTI = [{ id: "lutador", nivel: 2 }, { id: "conjurador", nivel: 2 }];
t("Player: o derive avisa a multiclasse sem requisito",
  deriveAfty(ficha("player", MULTI, attrs())).especializacoes.semRequisito.map((x) => [x.id, x.valor]), [["conjurador", 16]]);
t("Player: com INT 16 não avisa", deriveAfty(ficha("player", MULTI, attrs({ inteligencia: 16 }))).especializacoes.semRequisito, []);
t("Player: o aviso não tira a classe da ficha",
  deriveAfty(ficha("player", MULTI, attrs())).especializacoes.escolhidas.map((e) => e.id), ["lutador", "conjurador"]);
t("Afty: a criatura não é cobrada (aguarda o autor)", deriveAfty(ficha("afty", MULTI, attrs())).especializacoes.semRequisito, []);
t("a divergência separa os dois", [S.regraDo("afty", "requisitoMulticlasse"), S.regraDo("player", "requisitoMulticlasse")], ["afty", "player"]);

/* Permanente conta, temporário não: o requisito é pré-requisito. */
t("Player: +2 de INT PERMANENTE chega a 16 e atende",
  deriveAfty(ficha("player", MULTI, attrs({ inteligencia: 14 }), [{ canal: "atributo", alvo: "inteligencia", expr: "2" }]))
    .especializacoes.semRequisito, []);
t("Player: +2 de INT TEMPORÁRIO não atende",
  deriveAfty(ficha("player", MULTI, attrs({ inteligencia: 14 }), [{ canal: "atributo", alvo: "inteligencia", expr: "2", duracao: "temporaria" }]))
    .especializacoes.semRequisito.map((x) => x.id), ["conjurador"]);
t("Player: uma classe só não tem multiclasse para cobrar",
  deriveAfty(ficha("player", [{ id: "conjurador", nivel: 4 }], attrs())).especializacoes.semRequisito, []);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
