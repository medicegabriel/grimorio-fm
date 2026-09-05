/**
 * O EFEITO DE ITEM QUE O MOTOR SABE LER TEM DE ESTAR LIGADO — 2026-09-05
 *
 * ============================================================
 * O BUG QUE DEU ORIGEM A ESTE ARQUIVO
 * ============================================================
 * O **Amuleto do Vislumbre** diz *"além de um bônus de +2 em rolagens de
 * Percepção"* e estava gravado com `aplicado: false`. O consumidor, em
 * `resolveEquipamentos`, é um `if (ef?.aplicado && condicaoAtiva)`: a linha
 * inteira era jogada fora, sem erro, sem aviso e sem sintoma na tela.
 *
 * Pior que o bug: o log MENTIA. A sessão de 2026-08-01 registrou que o Amuleto
 * e o Sob Medida tinham entrado juntos quando as Perícias ganharam canal. Só o
 * Sob Medida entrou. Um dado inerte e um dado ligado se parecem no grep, e a
 * única forma de a diferença aparecer é medindo o número no derivado.
 *
 * ============================================================
 * A REGRA QUE ESTE ARQUIVO PRENDE
 * ============================================================
 * ⚠ Um item que declara `efeito.pericia` NOMEIA a perícia, então nunca tem
 * bloqueio: o canal `bonusPericia` existe desde 2026-07-29. Se ele está com
 * `aplicado: false`, é esquecimento, e não decisão.
 *
 * ⚠ As duas Pulseiras continuam inertes COM RAZÃO, e é por isso que a regra
 * mira o campo `pericia` e não a palavra "perícia": elas usam `periciaTreinada`
 * e `periciaMestre`, que concedem TREINO numa perícia *à escolha do jogador*, e
 * escolha de item não tem tela em lugar nenhum. Elas são o controle do teste: se
 * um dia alguém as ligar por engano, a última seção fica vermelha.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const EQ = await import(R + "afty-equipamentos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. TODO `efeito.pericia` DO CATÁLOGO ESTÁ LIGADO              */
/* ============================================================ */

/* ⚠ O catálogo por tipo NÃO é exportado, então a varredura junta as quatro
   listas públicas. Item novo entra aqui sozinho: é essa a razão de o teste
   varrer o catálogo em vez de listar os dois itens que hoje têm o campo. */
const comPericia = [
  ...EQ.ARMAS, ...EQ.UNIFORME_MODIFICACOES, ...EQ.ESCUDOS, ...EQ.ITENS_ESPECIAIS,
].filter((def) => def?.efeito?.pericia);

t("o catálogo tem itens com bônus de perícia nomeada", comPericia.length > 0, true);

for (const def of comPericia) {
  t(`${def.nome} não fica inerte`, def.efeito.aplicado, true);
}

/* ============================================================ */
/* 2. E O NÚMERO CHEGA NO DERIVADO, QUE É O QUE O `aplicado`     */
/*    SOZINHO NÃO PROVA                                          */
/* ============================================================ */
/* ⚠ Ler só o catálogo não bastaria. O `aplicado: true` é a INTENÇÃO, e o que
   este bloco mede é a CHEGADA: equipar o item e ver a perícia subir. Foi
   exatamente a distância entre as duas coisas que segurou o bug por um mês. */

const comItem = (itemId, tipo) => {
  const c = createBlankAfty();
  c.core.nd = 12;
  c.core.tipo = "combatente";
  c.especializacoes = [{ id: "combatente", nivel: 12 }];
  c.equipamentos = itemId
    ? { itens: [{ uid: "i1", refId: itemId, tipo, qtd: 1, equipado: true }] }
    : { itens: [] };
  return deriveAfty(c);
};

/* ⚠ A perícia mora em `derived.testes.pericias`, e o número dela é `bonus`. A
   medida é a DIFERENÇA com e sem o item, e não o valor absoluto: assim ela não
   quebra no dia em que a base da perícia mudar por outro motivo. */
const bonusDe = (itemId, tipo, pericia) => {
  const alvo = (d) => (d.testes?.pericias ?? []).find((p) => p.id === pericia);
  const com = alvo(comItem(itemId, tipo));
  const sem = alvo(comItem(null, tipo));
  if (!com || !sem) return "perícia não encontrada no derivado";
  return com.bonus - sem.bonus;
};

/* O Amuleto do Vislumbre: *"além de um bônus de +2 em rolagens de Percepção"*. */
t("Amuleto do Vislumbre soma +2 em Percepção", bonusDe("it_amuleto_do_vislumbre", "item", "percepcao"), 2);
t("e não vaza para outra perícia", bonusDe("it_amuleto_do_vislumbre", "item", "atletismo"), 0);

/* O Sob Medida, que é o que sempre funcionou: *"você recebe +2 em testes de
   Acrobacia e Furtividade"*. Ele está aqui como a linha de comparação. */
t("Sob Medida soma +2 em Acrobacia", bonusDe("unif_sob_medida", "uniforme", "acrobacia"), 2);
t("Sob Medida soma +2 em Furtividade", bonusDe("unif_sob_medida", "uniforme", "furtividade"), 2);

/* ============================================================ */
/* 3. AS DUAS PULSEIRAS SEGUEM INERTES, E É DE PROPÓSITO         */
/* ============================================================ */
/* Elas concedem treino numa perícia À ESCOLHA, e item não tem tela de escolha.
   Ligar uma delas sem construir a escolha faria o motor treinar perícia nenhuma
   e a ficha prometer o que não entrega. Quando a tela existir, este bloco é o
   primeiro a mudar. */

for (const id of ["it_pulseira_magistral", "it_pulseira_primacial"]) {
  const def = EQ.ITENS_ESPECIAIS.find((i) => i.id === id);
  t(`${id} existe no catálogo`, !!def, true);
  t(`${id} não nomeia perícia`, !def?.efeito?.pericia, true);
  t(`${id} continua inerte, esperando a tela de escolha`, def?.efeito?.aplicado ?? false, false);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
