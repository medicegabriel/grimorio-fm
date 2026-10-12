/* Progressão das duas Habilidades Gerais aprovada pelo autor em 2026-10-10.
   As expectativas são a tabela aprovada, exercitada no motor completo. */
import { register } from "node:module";
register(
  'data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}',
  import.meta.url,
);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { resolveGerais } = await import(R + "afty-gerais.js");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

const ficha = (nd, vezes = 0, sistema = "afty") => {
  const c = createBlankAfty();
  c.core.nd = nd;
  c.rulesVersion = sistema;
  c.habilidadesGerais = [
    ...Array(vezes).fill("ger_especializacao"),
    ...Array(vezes).fill("ger_aptidao"),
  ];
  return c;
};
const vagas = (d) => [d.habilidades.comum, d.totalAptidoesAmaldicoadas];

// ND inicial/final, Maestria, teto/ganho/máximo de Especialização e de Aptidão.
const TABELA = [
  [1, 4, 2, 1, 2, 2, 1, 2, 2],
  [5, 8, 3, 2, 2, 4, 1, 3, 3],
  [9, 12, 4, 2, 3, 6, 2, 4, 8],
  [13, 16, 5, 3, 3, 9, 2, 5, 10],
  [17, 20, 6, 3, 4, 12, 3, 6, 18],
  [21, 25, 7, 4, 4, 16, 3, 6, 18],
  [26, 30, 8, 4, 5, 20, 4, 6, 24],
  [31, 35, 9, 5, 5, 25, 4, 6, 24],
  [36, 40, 10, 5, 6, 30, 5, 6, 30],
];
for (const [inicio, fim, maestria, teto, porCompra, maximo, tetoApt, porCompraApt, maximoApt] of TABELA) {
  for (const nd of [inicio, fim]) {
    const c = ficha(nd, 10);
    const antes = JSON.stringify(c);
    const d = deriveAfty(c);
    t(`ND ${nd}: Maestria`, d.maestria, maestria);
    t(`ND ${nd}: tetos das duas Gerais`,
      [d.gerais.maxVezes.ger_especializacao, d.gerais.maxVezes.ger_aptidao], [teto, tetoApt]);
    t(`ND ${nd}: orçamento máximo das duas`, vagas(d), [maximo, maximoApt]);
    t(`ND ${nd}: só as compras permitidas gastam o contador`, d.gerais.gastos, teto + tetoApt);
    t(`ND ${nd}: aparo não grava na ficha`, JSON.stringify(c), antes);
    t(`ND ${nd}: uma compra de cada`, vagas(deriveAfty(ficha(nd, 1))), [porCompra, porCompraApt]);
    t(`ND ${nd}: sem compras não recebe vagas`, vagas(deriveAfty(ficha(nd))), [0, 0]);
  }
}

const antiga = ficha(35, 4);
t("ND 35: quatro compras antigas continuam valendo", vagas(deriveAfty(antiga)), [20, 24]);
antiga.core.nd = 36;
t("ND 36: subir não compra a quinta automaticamente", vagas(deriveAfty(antiga)), [24, 24]);
t("ND 35 e 36: Especialização sobe cinco e Aptidão libera a quinta compra",
  [vagas(deriveAfty(ficha(35, 5))), vagas(deriveAfty(ficha(36, 5)))], [[25, 24], [30, 30]]);

const baixada = ficha(31, 5);
baixada.core.nd = 26;
t("baixar para ND 26 apara a quinta só na leitura", vagas(deriveAfty(baixada)), [20, 24]);
t("as dez entradas gravadas sobrevivem", baixada.habilidadesGerais.length, 10);
baixada.core.nd = 31;
t("voltar ao ND 31 restaura só a quinta Especialização", vagas(deriveAfty(baixada)), [25, 24]);
baixada.core.nd = 36;
t("no ND 36 a quinta Aptidão gravada volta a valer", vagas(deriveAfty(baixada)), [30, 30]);

const concedida = resolveGerais(ficha(5, 2), {
  nd: 5, maestria: 3, concedidos: ["ger_especializacao", "ger_aptidao"],
});
t("concessão de sessão continua fora do teto de compra",
  concedida.escolhidas.map((g) => [g.id, g.vezes]), [["ger_especializacao", 3], ["ger_aptidao", 2]]);
t("concessão de sessão continua gratuita", concedida.gastos, 3);

for (const nd of [5, 21, 31, 36]) {
  const sem = deriveAfty(ficha(nd, 0, "player"));
  const com = deriveAfty(ficha(nd, 10, "player"));
  t(`Player ND ${nd}: Gerais gravadas continuam inertes`, vagas(com), vagas(sem));
  t(`Player ND ${nd}: Geral não gasta contador`, com.gerais.gastos, 0);
}
const restr = ficha(31, 5);
restr.core.tipo = "restringido";
restr.core.origem = { id: "restringido" };
t("Restringido continua sem Aptidões", deriveAfty(restr).totalAptidoesAmaldicoadas, 0);

if (bad.length) {
  console.error(bad.join("\n"));
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
