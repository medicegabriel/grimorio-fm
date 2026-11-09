/**
 * CX5: TEXTO DO TRAÇO ESPECIAL DA ARMA CRIADA (fila "O traço Especial da arma criada
 * não aparece fora da bancada").
 *
 * A arma do livro responde pelo id de `ARMA_ESPECIAIS`. A arma criada guarda o texto
 * em `criacao.especialTexto` (bancada de Pontos de Criação) ou na receita do guia, e
 * agora responde por si na `descricao`, que é o que a linha do inventário e a Ficha
 * Final leem. A arma sem o traço Especial não ganha texto nenhum.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const EQ = await import(R + "afty-equipamentos.js");
const { createBlankAfty } = await import(R + "afty-schema.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const TEXTO = "Ao acertar, a lâmina solta uma fagulha que ilumina o alvo.";
const arma = (extra = {}) => ({ id: "armc_teste", nome: "Lâmina Fagulha", classe: "simples", categoria: "corpo", props: { especial: true }, ...extra });
const ficha = (armas) => {
  const c = createBlankAfty();
  c.core.nd = 8;
  c.armasCustom = armas;
  c.equipamentos = { itens: armas.map((a, i) => ({ uid: `a${i}`, tipo: "arma", refId: a.id, qtd: 1, equipado: true })) };
  return c;
};

// 1. Texto guardado na bancada (`criacao.especialTexto`).
{
  const c = ficha([arma({ criacao: { especialTexto: TEXTO } })]);
  const def = EQ.getEquipamento("arma", "armc_teste", c);
  t("a arma criada responde pelo texto da bancada", EQ.textoEspecialDaArma(def), TEXTO);
  t("e a descrição, que é o que a Ficha lê, traz o mesmo texto", def.descricao, TEXTO);
  const entrada = deriveAfty(c).equip.entradas[0];
  t("o derive entrega a arma com a descrição", entrada.def.descricao, TEXTO);
}

// 2. O texto some quando a propriedade Especial é desmarcada.
{
  const c = ficha([arma({ props: {}, criacao: { especialTexto: TEXTO } })]);
  const def = EQ.getEquipamento("arma", "armc_teste", c);
  t("sem a propriedade Especial não há texto", EQ.textoEspecialDaArma(def), "");
  t("nem descrição inventada", def.descricao, undefined);
}

// 3. Texto só de espaços não cria descrição.
{
  const c = ficha([arma({ criacao: { especialTexto: "   " } })]);
  const def = EQ.getEquipamento("arma", "armc_teste", c);
  t("texto em branco não vira descrição", def.descricao, undefined);
}

// 4. A arma do livro continua respondendo pelo id.
{
  const alabarda = EQ.ARMAS.find((a) => a.id === "arm_alabarda");
  t("a Alabarda do livro responde pelo traço do catálogo", EQ.textoEspecialDaArma(alabarda).startsWith("De lâmina curva"), true);
  t("arma sem traço devolve vazio", EQ.textoEspecialDaArma(EQ.ARMAS.find((a) => a.id === "arm_adaga")), "");
  t("def nulo devolve vazio", EQ.textoEspecialDaArma(null), "");
}

// 5. Ida e volta em JSON e a fila de armas intactas.
{
  const c = JSON.parse(JSON.stringify(ficha([arma({ criacao: { especialTexto: TEXTO } })])));
  t("o texto sobrevive ao ida e volta em JSON", EQ.getEquipamento("arma", "armc_teste", c).descricao, TEXTO);
  t("o catálogo do livro não é alterado", EQ.ARMAS.every((a) => a.custom !== true), true);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
