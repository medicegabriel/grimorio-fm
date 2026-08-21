/* Crescimento Corporal repetível, distância por tamanho e a relíquia da Yamata. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { ITENS_ESPECIAIS } = await import(R + "afty-equipamentos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const crescimento = (opcoes = []) => {
  const c = createBlankAfty();
  c.core.nd = 10;
  c.aptidoesAmaldicoadas = opcoes.map(() => "mal_crescimento_corporal");
  c.aptidaoOpcoesRepetidas = { mal_crescimento_corporal: opcoes };
  return deriveAfty(c);
};

const medio = crescimento();
const uma = crescimento(["aumentar"]);
const duas = crescimento(["aumentar", "aumentar"]);
const menores = crescimento(["diminuir", "diminuir"]);
const anuladas = crescimento(["aumentar", "diminuir"]);

t("sem efeito parte de Medio", medio.tamanho, "medio");
t("primeira aquisicao aumenta uma categoria", uma.tamanho, "grande");
t("segunda aquisicao chega a Enorme", duas.tamanho, "enorme");
t("duas reducoes chegam a Minusculo", menores.tamanho, "minusculo");
t("aquisicoes opostas se anulam", anuladas.tamanho, "medio");
t("PV nao repete na segunda aquisicao", duas.hp, uma.hp);
t("Enorme ocupa e alcanca 4,5m", duas.tamanhoEspacoAlcance, 4.5);

const entradaPingente = (estado = {}) => ({
  uid: "eq_pingente_teste",
  tipo: "item",
  refId: "evento_yamata_pingente_amaterasu",
  qtd: 9,
  equipado: true,
  ...estado,
});
const yamata = (estado = {}, extras = []) => {
  const c = createBlankAfty();
  c.name = "Yamata";
  c.equipamentos.itens = [entradaPingente(estado), ...extras];
  return deriveAfty(c);
};
const valores = (d) => Object.values(d.attrEff);

const sombra = yamata();
const sol = yamata({ solDireto: true });
const conjuntoManual = yamata({ conjuntoSagradoCompleto: true });
const guardado = yamata({ solDireto: true, equipado: false });

t("sem sol nao concede atributo", valores(sombra), [10, 10, 10, 10, 10, 10]);
t("sob o sol concede +2 em todos", valores(sol), [12, 12, 12, 12, 12, 12]);
t("marcador do conjunto mantem o sol", valores(conjuntoManual), [12, 12, 12, 12, 12, 12]);
t("guardado nao concede o bonus", valores(guardado), [10, 10, 10, 10, 10, 10]);
t("reliquia unica apara quantidade importada", sol.equip.entradas[0].qtd, 1);

const pingenteDef = ITENS_ESPECIAIS.find((item) => item.id === "evento_yamata_pingente_amaterasu");
t("catalogo marca a reliquia pessoal",
  [pingenteDef?.categoria, pingenteDef?.custo, pingenteDef?.evento, pingenteDef?.exclusivoDe, pingenteDef?.unico],
  ["acessorio", 4, true, "Yamata", true]);

/* Quando os outros dois itens chegarem, a coleção passa a ligar o sol sem o
   marcador manual. O processo do assert é isolado, então o catálogo pode ser
   estendido aqui e volta ao tamanho original antes de sair. */
const inicioCatalogo = ITENS_ESPECIAIS.length;
ITENS_ESPECIAIS.push(
  { id: "teste_tesouro_2", nome: "Tesouro 2", categoria: "acessorio", custo: 4,
    descricao: "Teste", colecao: "tesouros_sagrados_japao" },
  { id: "teste_tesouro_3", nome: "Tesouro 3", categoria: "acessorio", custo: 4,
    descricao: "Teste", colecao: "tesouros_sagrados_japao" },
);
const conjuntoAutomatico = yamata({}, [
  { uid: "eq_t2", tipo: "item", refId: "teste_tesouro_2", qtd: 1, equipado: false },
  { uid: "eq_t3", tipo: "item", refId: "teste_tesouro_3", qtd: 1, equipado: false },
]);
ITENS_ESPECIAIS.length = inicioCatalogo;
t("tres tesouros carregados ligam o sol", valores(conjuntoAutomatico), [12, 12, 12, 12, 12, 12]);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
