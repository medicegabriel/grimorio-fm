/* TÉCNICA MÁXIMA: o custo de 25 e o que mexe nele (autor, 2026-10-08).

   DA-06: as reduções e os aumentos genéricos de Feitiço valem sobre a base de 25
   (Dominância, Manipulação Perfeita, Expansão de Domínio, `custoPE`, Condenado),
   com o piso geral de 1 PE. Sem lista duplicada de redutores.

   ⚠ ESTA SUÍTE PRENDE TAMBÉM UM CONSERTO DO MESMO DIA: nenhuma linha `custoPE`
   do estágio principal chegava ao Feitiço desde 2026-09-09 (o canal mudou para o
   passe pós-Aptidão, e o Feitiço lê o agregado final). A redução de um
   Funcionamento e a da Expansão de Domínio sumiam caladas. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const F = await import(R + "afty-feiticos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const tm = { ...F.createBlankFeitico(), id: "tm", nome: "TM", nivel: "max", regraTecnicaMaxima: "oficial" };
const comum = { ...F.createBlankFeitico(), id: "c", nome: "Comum", nivel: 3 };

/* ============================================================ */
/* AS REDUÇÕES DE ESCOLHA, PELA FUNÇÃO DE SEMPRE                 */
/* ============================================================ */
for (const nd of [13, 17]) {
  const ctx = { nd, nivelConjurador: 0, cdBase: 20, modTecnica: 4, efeitos: { detalhes: [] }, bonusTreinamento: 5, feiticos: [tm] };
  const base = F.calcularFeitico(tm, ctx);
  const reduz = (extra) => F.aplicaReducoesCustoFeitico(tm, base, { ...ctx, ...extra }).custoPE;
  t(`ND ${nd}: base 25`, base.custoPEBase, 25);
  t(`ND ${nd}: Dominância tira 3 (metade do nível 6, para cima)`,
    reduz({ habilidades: ["cnj_dominancia_em_feitico"], reducoesCustoFeitico: { dominancia: "tm" } }), 22);
  t(`ND ${nd}: Manipulação Perfeita deixa a metade, para baixo (25 vira 12)`,
    reduz({ habilidades: ["cnj_manipulacao_perfeita"], reducoesCustoFeitico: { manipulacao: ["tm"] } }), 12);
  t(`ND ${nd}: as duas juntas`,
    reduz({ habilidades: ["cnj_dominancia_em_feitico", "cnj_manipulacao_perfeita"], reducoesCustoFeitico: { dominancia: "tm", manipulacao: ["tm"] } }), 9);
}

/* ============================================================ */
/* O CANAL `custoPE`, PELO DERIVE, NOS DOIS SISTEMAS             */
/* ============================================================ */
for (const sistema of ["afty", "player"]) {
  const ficha = (efeitos = [], extra = {}) => {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.core.nd = 13;
    c.core.origem = { id: "inato" };
    c.pericias = { feiticaria: "mestre" };
    c.aptidoesAmaldicoadas = ["tecnica_maxima"];
    c.core.tecnicaEfeitos = efeitos;
    c.feiticos = [tm, comum];
    return Object.assign(c, extra);
  };
  const custo = (d, id) => d.feiticos.lista.find((l) => l.id === id).custoPE;
  const d0 = deriveAfty(ficha());
  t(`${sistema}: sem nada, 25 e 8`, [custo(d0, "tm"), custo(d0, "c")], [25, 8]);
  const red = deriveAfty(ficha([{ canal: "custoPE", alvo: "feitico", expr: "2" }]));
  t(`${sistema}: redução de Feitiço chega à TM e ao comum (o conserto)`, [custo(red, "tm"), custo(red, "c")], [23, 6]);
  t(`${sistema}: com a fonte no hover`, red.feiticos.lista.find((l) => l.id === "tm").reducoesCustoPE, [{ fonte: "Técnica", valor: 2 }]);
  const aum = deriveAfty(ficha([{ canal: "custoPE", expr: "-1" }]));
  t(`${sistema}: aumento sem alvo (o jeito do Condenado) soma depois`, [custo(aum, "tm"), custo(aum, "c")], [26, 9]);
  const outra = deriveAfty(ficha([{ canal: "custoPE", alvo: "invocacao", expr: "5" }]));
  t(`${sistema}: redução de outro gasto não alcança`, custo(outra, "tm"), 25);
  const piso = deriveAfty(ficha([{ canal: "custoPE", alvo: "feitico", expr: "40" }]));
  t(`${sistema}: o piso de 1 PE continua`, [custo(piso, "tm"), custo(piso, "c")], [1, 1]);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
