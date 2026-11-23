import assert from "node:assert/strict";
import { register } from "node:module";

register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const { deriveAfty } = await import("../src/systems/afty/afty-derive.js");
const { createBlankAfty } = await import("../src/systems/afty/afty-schema.js");
const { especializacoesDisponiveis, especializacoesRecusadas } = await import("../src/systems/afty/afty-especializacoes.js");
const { caracteristicasEfetivas } = await import("../src/systems/afty/afty-origens.js");
const { prepararFichaEclesiastes } = await import("../src/systems/eclesiastes/regras.js");

const permitidas = ["lutador", "combatente", "conjurador", "suporte"];
const classes = (ficha) => especializacoesDisponiveis(ficha.core.origem.id, [], ficha).map((e) => e.id);
const fisico = (ficha) => caracteristicasEfetivas(ficha).find((c) => c.id === "fisico_abencoado").descricao;
const removidas = (ficha) => especializacoesRecusadas(ficha).map((e) => e.id);
let total = 0;

function confere(real, esperado, mensagem) {
  assert.deepEqual(real, esperado, mensagem);
  total++;
}

for (const sistema of ["afty", "player"]) {
  const ficha = createBlankAfty();
  ficha.rulesVersion = sistema;
  Object.assign(ficha.core, { tipo: "restringido", nd: 10, origem: { id: "restringido" } });
  ficha.especializacoes = [{ id: "restringido", nivel: 10 }];
  const eclesiastes = prepararFichaEclesiastes(ficha);
  const antiga = deriveAfty(eclesiastes);

  confere(classes(ficha), ["restringido"], `Catálogo compartilhado de ${sistema}`);
  confere(deriveAfty(ficha).especializacoes.obrigatoria, "restringido", `Classe obrigatória de ${sistema} no catálogo compartilhado`);
  confere(classes(eclesiastes), permitidas, `Opções da origem Restringido de ${sistema} em Eclesiastes`);
  confere(antiga.especializacoes.obrigatoria, null, `Escolha livre em Eclesiastes para ${sistema}`);
  confere(antiga.especializacoes.escolhidas, [], `Classe removida de ${sistema} sem substituição automática`);
  confere(removidas(eclesiastes), ["restringido"], `Aviso da classe removida para ${sistema}`);
  confere(antiga.recursoLabel, "Estamina", `Estamina de ${sistema} antes da nova escolha`);
  confere(fisico(ficha).includes("acesso a especialização Restringido"), true, `Texto do catálogo compartilhado para ${sistema}`);
  confere(fisico(eclesiastes).includes("acesso a especialização Restringido"), false, `Texto vigente em Eclesiastes para ${sistema}`);

  for (const id of permitidas) {
    const atual = deriveAfty({ ...eclesiastes, especializacoes: [{ id, nivel: 10 }] });
    confere(atual.especializacoes.escolhidas.map((e) => e.id), [id], `Escolha de ${id} para ${sistema}`);
    confere(atual.recursoLabel, "Estamina", `Estamina de ${sistema} com ${id}`);
  }

  const multiclasse = deriveAfty({
    ...eclesiastes,
    especializacoes: [{ id: "lutador", nivel: 4 }, { id: "suporte", nivel: 6 }],
  });
  confere(multiclasse.especializacoes.escolhidas.map(({ id, nivel }) => [id, nivel]),
    [["lutador", 4], ["suporte", 6]], `Multiclasse de ${sistema} em Eclesiastes`);

  const inato = { ...eclesiastes, core: { ...eclesiastes.core, tipo: "combatente", origem: { id: "inato" } } };
  confere(classes(inato), permitidas, `Catálogo do Inato de ${sistema} em Eclesiastes`);
  confere(deriveAfty(inato).recursoLabel, "Energia", `Classe revogada não muda o recurso do Inato de ${sistema}`);
}

const jogador = createBlankAfty();
jogador.rulesVersion = "player";
jogador.core.origem = {
  id: "gemeos",
  escolhas: { verdadeiras_origens: ["vo_restringido_fisico_abencoado"] },
};
jogador.especializacoes = [{ id: "lutador", nivel: 1 }];
const gemeo = prepararFichaEclesiastes(jogador);
const caracteristicas = caracteristicasEfetivas(gemeo);
const copia = caracteristicas.find((c) => c.id === "vo_fisico_abencoado");
const opcao = caracteristicas.find((c) => c.id === "verdadeiras_origens")
  .escolha.opcoes.find((o) => o.id === "vo_restringido_fisico_abencoado");
confere(copia.descricao.includes("acesso a especialização Restringido"), false, "Descrição da característica copiada");
confere(opcao.descricao.includes("acesso a especialização Restringido"), false, "Descrição da opção de Verdadeiras Origens");
confere(deriveAfty(gemeo).recursoLabel, "Estamina", "Estamina do Gêmeo com Físico Abençoado");

console.log(`TODOS OS ${total} ASSERTS PASSARAM`);
