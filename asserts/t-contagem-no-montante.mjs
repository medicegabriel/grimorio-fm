/* `contar()` e `tem_*` em efeito de Origem (V2): quem lê o que a ficha TEM desce
   ao estágio principal, onde a contagem existe. No montante as duas valiam zero,
   calado.

   Pacote NEUTRO escrito aqui dentro, de propósito: este arquivo é público.

   O que fica preso:
   • efeito de Origem com `contar("marca")` soma de verdade;
   • efeito de Origem com `quando: tem_<talento>` liga só com o talento;
   • efeito que NÃO lê a ficha continua no montante (nada se move à toa);
   • canal de VAGA e de pré-contexto segue preso no montante mesmo lendo a
     contagem (seria circular), e a contagem lá vale zero;
   • texto entre aspas não conta como leitura. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const E = await import(R + "afty-efeitos.js");

let ok = 0;
const falhas = [];
const t = (nome, real, esperado) => {
  const a = JSON.stringify(real);
  const b = JSON.stringify(esperado);
  if (a === b) ok += 1;
  else falhas.push(`${nome}\n     esperado ${b}\n     veio     ${a}`);
};

/* ============================================================ */
/* 1. A SEPARAÇÃO, EM UNIDADE                                    */
/* ============================================================ */
const sep = (efs) => {
  const { montante, bancada } = E.separarEfeitosDeBancada(efs, { nd: 1, bt: 2 });
  return { montante: montante.map((e) => e.nome), bancada: bancada.map((e) => e.nome) };
};
t("contar() desce", sep([{ canal: "bonusPericia", alvo: "atletismo", expr: "contar(\"x\")", nome: "a" }]),
  { montante: [], bancada: ["a"] });
t("contar() no quando desce", sep([{ canal: "bonusPericia", alvo: "atletismo", expr: "2", quando: "contar(\"x\") >= 1", nome: "a" }]),
  { montante: [], bancada: ["a"] });
t("tem_* desce", sep([{ canal: "bonusPericia", alvo: "atletismo", expr: "2", quando: "tem_tal_afinidade_com_tecnica", nome: "a" }]),
  { montante: [], bancada: ["a"] });
t("conta pura continua no montante", sep([{ canal: "bonusPericia", alvo: "atletismo", expr: "nd + bt", nome: "a" }]),
  { montante: ["a"], bancada: [] });
t("a palavra entre aspas não é leitura", sep([{ canal: "bonusPericia", alvo: "atletismo", expr: "2", quando: "nd >= 1", nome: "a", etiqueta: "contar(\"x\") tem_y" }]),
  { montante: ["a"], bancada: [] });
t("vaga que lê contar() fica no montante", sep([{ canal: "vagasTalento", expr: "contar(\"x\")", nome: "v" }]),
  { montante: ["v"], bancada: [] });
t("vaga que lê tem_* fica no montante", sep([{ canal: "vagasHabilidade", expr: "tem_tal_afinidade_com_tecnica", nome: "v" }]),
  { montante: ["v"], bancada: [] });
t("pontos de Aptidão e pré-contexto também ficam", sep([
  { canal: "pontosAptidao", expr: "contar(\"x\")", nome: "p" },
  { canal: "nivelAptidao", alvo: "dom", expr: "contar(\"x\")", nome: "n" },
]), { montante: ["p", "n"], bancada: [] });
t("o atributo (a perda de Presença) desce", sep([{ canal: "atributo", alvo: "presenca", expr: "-contar(\"x\")", nome: "pr" }]),
  { montante: [], bancada: ["pr"] });

/* ============================================================ */
/* 2. A FICHA, DE PONTA A PONTA                                  */
/* ============================================================ */
const PACOTE = {
  id: "montante-teste",
  nome: "Montante de Teste",
  versao: "1.0.0",
  autor: "teste",
  paraRaw: "afty",
  descricao: "Pacote neutro dos asserts de contagem no montante.",
  resumo: "Contagem no montante",
  categoria: "origens",
  acrescenta: {
    origens: [
      {
        id: "leitora",
        nome: "Leitora",
        lore: "Origem de teste.",
        caracteristicas: [
          { id: "fixa", nome: "Fixa", descricao: "Conta.", tags: ["item_contado"] },
        ],
        efeitos: [
          { canal: "bonusPericia", alvo: "atletismo", expr: "contar(\"item_contado\")", nome: "Por Contagem" },
          { canal: "bonusPericia", alvo: "acrobacia", expr: "3", quando: "tem_tal_afinidade_com_tecnica", nome: "Por Presença" },
          { canal: "bonusPericia", alvo: "furtividade", expr: "1", nome: "Fixo" },
        ],
      },
    ],
    talentos: [
      { id: "marcador", nome: "Marcador", grupo: "geral", descricao: "Marca.", tags: ["item_contado"] },
    ],
  },
};
const pacote = A.normalizarPacote(PACOTE);
t("o pacote valida", A.validarPacote(PACOTE), []);
A.aplicarAddons([pacote]);

const ficha = ({ sistema = "afty", talentos = [] } = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd: 5, tipo: "conjurador", patamar: "comum" };
  c.core.origem = { id: "montante-teste:leitora" };
  c.addons = [pacote];
  c.talentos = talentos;
  return c;
};
const parcela = (c, nome) => (deriveAfty(c).efeitos?.detalhes ?? [])
  .filter((x) => x.nome === nome).map((x) => x.valor);

const MARCADOR = "montante-teste:marcador";
for (const sistema of ["afty", "player"]) {
  const S = `[${sistema}]`;
  t(`${S} contar() na Origem: 1 da fixa, sem talento`, parcela(ficha({ sistema }), "Por Contagem"), [1]);
  t(`${S} contar() na Origem: 1 da fixa + 1 do talento`, parcela(ficha({ sistema, talentos: [MARCADOR] }), "Por Contagem"), [2]);
  t(`${S} tem_* sem o talento: não liga`, parcela(ficha({ sistema }), "Por Presença"), []);
  t(`${S} tem_* com o talento: liga`, parcela(ficha({ sistema, talentos: ["tal_afinidade_com_tecnica"] }), "Por Presença"), [3]);
  t(`${S} o efeito fixo não se mexe`, parcela(ficha({ sistema, talentos: [MARCADOR] }), "Fixo"), [1]);
}

A.aplicarAddons([]);

if (falhas.length) {
  console.log(`${falhas.length} FALHA(S) de ${ok + falhas.length}:\n`);
  for (const f of falhas) console.log(` x ${f}\n`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
