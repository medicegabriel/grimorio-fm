/* Marcas de Origem (V1): característica de origem, de clã e opção escolhida
   dentro delas passam a gerar marca para o `contar()`, pela `tags` escrita.

   Pacote NEUTRO escrito aqui dentro, de propósito: este arquivo é público e
   nunca lê o conteúdo privado de nenhuma mesa.

   O que fica preso:
   • só a marca ESCRITA conta, sem marca automática de família, então
     `contar("origem")` e afins não passam a existir;
   • opção NÃO escolhida não conta, e opção escolhida conta uma vez;
   • a marca declarada por origem de Addon aparece no seletor antes de a ficha
     usá-la, e nos dois sistemas. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");

let ok = 0;
const falhas = [];
const t = (nome, real, esperado) => {
  const a = JSON.stringify(real);
  const b = JSON.stringify(esperado);
  if (a === b) ok += 1;
  else falhas.push(`${nome}\n     esperado ${b}\n     veio     ${a}`);
};

const PACOTE = {
  id: "marcas-teste",
  nome: "Marcas de Teste",
  versao: "1.0.0",
  autor: "teste",
  paraRaw: "afty",
  descricao: "Pacote neutro dos asserts de marca de origem.",
  resumo: "Marca de origem",
  categoria: "origens",
  acrescenta: {
    origens: [
      {
        id: "marcada",
        nome: "Marcada",
        lore: "Origem de teste.",
        clasRotulo: "Distinção",
        clasArtigo: "uma",
        clas: [{ id: "distincao", nome: "Distinção de Teste" }],
        caracteristicas: [
          { id: "fixa", nome: "Fixa", descricao: "Conta como item marcado.", tags: ["item_marcado"] },
          {
            id: "escolhe", nome: "Escolhe", descricao: "Escolha com opções marcadas.",
            escolha: {
              id: "esc_marcada", label: "Escolha Marcada", vagas: 2,
              opcoes: [
                { id: "op_marcada_a", nome: "Marcada A", descricao: "Conta.", tags: ["item_marcado"] },
                { id: "op_marcada_b", nome: "Marcada B", descricao: "Conta.", tags: ["item_marcado"] },
                { id: "op_neutra", nome: "Neutra", descricao: "Não conta." },
              ],
            },
          },
        ],
      },
    ],
    clas: [
      {
        id: "distincao",
        nome: "Distinção de Teste",
        lore: "Clã de teste.",
        caracteristicas: [
          { id: "do_cla", nome: "Do Clã", descricao: "Marca pelo clã.", tags: ["item_marcado"] },
        ],
      },
    ],
    talentos: [
      {
        id: "leitor",
        nome: "Leitor de Marca",
        grupo: "geral",
        descricao: "Soma uma perícia por marca.",
        tags: ["item_marcado"],
        efeitos: [{ canal: "bonusPericia", alvo: "atletismo", expr: "contar(\"item_marcado\")", nome: "Leitor" }],
      },
    ],
  },
};

const pacote = A.normalizarPacote(PACOTE);
t("o pacote valida sem problema", A.validarPacote(PACOTE), []);
A.aplicarAddons([pacote]);

const ORIGEM = "marcas-teste:marcada";
const CLA = "marcas-teste:distincao";
const LEITOR = "marcas-teste:leitor";

const ficha = ({ sistema = "afty", origem = ORIGEM, cla = null, escolhidas = [], talentos = [LEITOR], addons = [pacote] } = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd: 5, tipo: "conjurador", patamar: "comum" };
  c.core.origem = { id: origem, ...(cla ? { cla } : {}), escolhas: { esc_marcada: escolhidas } };
  c.addons = addons;
  c.talentos = talentos;
  return c;
};
/* O talento marca a si mesmo ("item_marcado") e lê a contagem: o que sobra do
   `contar` depois de tirar o próprio talento é o que as origens somaram. */
const leitura = (c) => {
  const d = deriveAfty(c);
  return (d.efeitos?.detalhes ?? [])
    .filter((x) => x.canal === "bonusPericia" && x.alvo === "atletismo" && x.nome === "Leitor")
    .map((x) => x.valor);
};

for (const sistema of ["afty", "player"]) {
  const S = `[${sistema}]`;
  t(`${S} só o próprio talento marca: 1`, leitura(ficha({ sistema, origem: "inato" })), [1]);
  t(`${S} característica fixa da origem marca: 1 do talento + 1 da fixa`, leitura(ficha({ sistema })), [2]);
  t(`${S} uma opção escolhida marca a mais`, leitura(ficha({ sistema, escolhidas: ["op_marcada_a"] })), [3]);
  t(`${S} duas opções escolhidas marcam duas vezes`, leitura(ficha({ sistema, escolhidas: ["op_marcada_a", "op_marcada_b"] })), [4]);
  t(`${S} opção sem etiqueta não marca`, leitura(ficha({ sistema, escolhidas: ["op_marcada_a", "op_neutra"] })), [3]);
  t(`${S} característica do clã marca`, leitura(ficha({ sistema, cla: CLA })), [3]);
  t(`${S} clã e opção se somam`, leitura(ficha({ sistema, cla: CLA, escolhidas: ["op_marcada_a"] })), [4]);
  t(`${S} sem o talento, a contagem não aparece em lugar nenhum`, leitura(ficha({ sistema, talentos: [] })), []);
}

t("opção repetida no gravado conta uma vez só",
  leitura(ficha({ escolhidas: ["op_marcada_a", "op_marcada_a"] })), [3]);

/* Nenhuma marca automática de família saiu da origem. */
const familias = () => {
  const c = ficha({ talentos: ["marcas-teste:leitor"], escolhidas: ["op_marcada_a"] });
  const d = deriveAfty(c);
  return d.marcas ?? null;
};
t("derived não expõe uma marca 'origem' de graça", familias()?.origem ?? 0, 0);

/* O seletor já oferece a marca declarada pela origem, antes do uso. */
const declaradas = A.marcasDeclaradas().map((m) => m.marca);
t("a marca vinda de característica, de clã e de opção está no seletor", declaradas.includes("item_marcado"), true);
const quantas = A.marcasDeclaradas().find((m) => m.marca === "item_marcado")?.quantas;
t("conta a declaração da característica, das duas opções, do clã e do talento", quantas, 5);

/* Controle: sem o pacote, nada muda. */
A.aplicarAddons([]);
t("sem o pacote, a marca some do seletor", A.marcasDeclaradas().some((m) => m.marca === "item_marcado"), false);

if (falhas.length) {
  console.log(`${falhas.length} FALHA(S) de ${ok + falhas.length}:\n`);
  for (const f of falhas) console.log(` x ${f}\n`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
