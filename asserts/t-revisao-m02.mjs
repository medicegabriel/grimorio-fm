/* REVISÃO M02 (2026-10-07): Motor, estágios, acúmulo e rastreabilidade.

   Prende o achado A02: o `atributo` resolve em dois estágios (permanente e
   temporário) e o pool exclusivo conserva o maior. O número já saía certo; o
   hover é que somava a fonte permanente e a temporária inteiras (17 para uma
   Força 15). A parcela do vencedor do segundo estágio agora é o que ele RENDEU,
   e o `declarado` guarda o valor da fonte. As parcelas fecham o total. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const EF = await import(R + "afty-efeitos.js");
const { createBlankAfty } = await import(R + "afty-schema.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ficha = (sistema, efeitos, base = 10) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd: 5, tecnicaEfeitos: efeitos };
  c.attributes = { forca: base, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 };
  return c;
};
const somaDasParcelas = (d, k) => (d.partesAtributo?.[k] ?? [])
  .filter((p) => !p.suplantado && typeof p.valor === "number").reduce((s, p) => s + p.valor, 0);

for (const sistema of ["afty", "player"]) {
  for (const [perm, temp] of [[2, 5], [3, 4], [1, 6]]) {
    const d = deriveAfty(ficha(sistema, [
      { canal: "atributo", alvo: "forca", expr: String(perm) },
      { canal: "atributo", alvo: "forca", expr: String(temp), duracao: "temporaria" },
    ]));
    const efetivo = 10 + Math.max(perm, temp);
    t(`A02 (${sistema}) +${perm} permanente e +${temp} temporário dão Força ${efetivo}`, d.atributos?.forca ?? d.attrEff?.forca, efetivo);
    t(`A02 (${sistema}) e as parcelas do hover somam ${efetivo}`, somaDasParcelas(d, "forca"), efetivo);
    const det = (d.efeitos?.detalhes ?? []).filter((x) => x.canal === "atributo" && x.alvo === "forca" && !x.suplantado);
    t(`A02 (${sistema}) a temporária rende ${temp - perm} e declara ${temp}`,
      det.filter((x) => x.duracao === "temporaria").map((x) => [x.valor, x.declarado]), [[temp - perm, temp]]);
    t(`A02 (${sistema}) o permanente continua o que os requisitos veem`, d.attrPermanente?.forca, 10 + perm);
  }
  /* Temporária MENOR que a permanente: não entra, e a parcela dela é suplantada. */
  const d = deriveAfty(ficha(sistema, [
    { canal: "atributo", alvo: "forca", expr: "5" },
    { canal: "atributo", alvo: "forca", expr: "2", duracao: "temporaria" },
  ]));
  t(`A02 (${sistema}) temporária menor não soma`, [d.atributos?.forca ?? d.attrEff?.forca, somaDasParcelas(d, "forca")], [15, 15]);
}

/* A função sozinha: o `declarado` só aparece quando o rendimento é diferente. */
{
  const a = { exclusivos: [{ canal: "atributo", alvo: "forca", valor: 5, exclusivo: "funcionamentoBasico", grupo: "g", origem: "x", nome: "X" }] };
  const sem = EF.resolverExclusivos(a);
  t("A02 estágio único: sem declarado", sem.detalhes.map((x) => [x.valor, x.declarado ?? null]), [[5, null]]);
  const com = EF.resolverExclusivos(a, { [EF.chaveExclusiva("atributo", "forca", 5, "g")]: 2 });
  t("A02 segundo estágio: rende 3 e declara 5", com.detalhes.map((x) => [x.valor, x.declarado ?? null]), [[3, 5]]);
}

// Blocos de Técnicas também preservam o rendimento de cada estágio no hover.
for (const sinal of [1, -1]) {
  const grupo = "g";
  const itens = [2, 5].map((valor, i) => ({ canal: "atributo", alvo: "forca", valor: sinal * valor,
    exclusivo: "estiloSombra", grupo, bloco: "tecnicas", origem: `t${i}`, nome: `T${i}` }));
  const res = EF.resolverExclusivos({ exclusivos: itens }, {
    [EF.chaveExclusiva("atributo", "forca", sinal * 3, grupo)]: sinal * 3,
  });
  t(`Bloco ${sinal}: total acrescenta somente quatro`, res.porAlvo.atributo.forca, sinal * 4);
  t(`Bloco ${sinal}: parcelas fecham o rendimento`, res.detalhes.reduce((s, e) => s + e.valor, 0), sinal * 4);
  t(`Bloco ${sinal}: valores declarados preservados`, res.detalhes.map((e) => e.declarado ?? e.valor), itens.map((e) => e.valor));
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
