/* NOVO ESTILO DAS SOMBRAS: a validação da Expansão (DA-07, autor 2026-10-04).

   "Um ERRO não deve conceder benefício mecânico. Mas também NÃO deve apagar os
   dados digitados pelo usuário." E: "prefira bloquear a ativação da configuração
   inválida em vez de escolher silenciosamente quais efeitos excedentes funcionam."

   Por isso cada caso confere as três coisas: o erro aparece, o número final não
   muda, e os dados continuam na ficha. AVISO e INFO não bloqueiam. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const EST = await import(R + "afty-estilo-sombras.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

let seq = 0;
const compra = (efeitoId, escolha = null) => ({ uid: `u${++seq}`, efeitoId, ...(escolha ? { escolha } : {}) });
const tecnica = (id, efeitos, extra = {}) => ({ ...EST.createBlankTecnicaEstilo(), id, nome: id, efeitos, ...extra });
const ficha = (sistema, estilos, { nd = 9, dom = 3, ativa = null } = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core.nd = nd;
  c.core.origem = { id: "sem_tecnica" };
  c.aptidoes = { dom };
  c.estilosSombra = estilos;
  c.combate = { ativo: true, estilo_ativo: true, ...(ativa ? { estilo_tecnica: ativa } : {}) };
  return c;
};
const da = (sistema, estilos, opts) => deriveAfty(ficha(sistema, estilos, opts));
const ganhoDefesa = (sistema, estilos, id, opts = {}) =>
  da(sistema, estilos, { ...opts, ativa: id }).defesa - da(sistema, estilos, opts).defesa;
const codigos = (r, nivel) => r.validacao.filter((v) => v.nivel === nivel).map((v) => v.codigo);

for (const sistema of ["afty", "player"]) {
  /* Excesso de efeitos: DOM 3 e quatro compras. */
  const excesso = tecnica("x", [compra("defesa"), compra("dano"), compra("dano"), compra("cd")]);
  const rx = da(sistema, [excesso]).estilo.tecnicas[0];
  t(`${sistema}: quatro efeitos em DOM 3 e erro`, [codigos(rx, "erro"), rx.validacao[0].texto], [["limite"], "Efeitos: 4 de 3."]);
  t(`${sistema}: e a Tecnica inteira fica sem efeito`, [rx.mecanicamenteValida, ganhoDefesa(sistema, [excesso], "x")], [false, 0]);
  t(`${sistema}: e os dados ficam`, rx.efeitos.length, 4);
  t(`${sistema}: com Exaustao 1 a mesma Tecnica vale`,
    ganhoDefesa(sistema, [{ ...excesso, exaustao: 1 }], "x") > 0, true);

  /* Teto de compras: Defesa tem teto 2. */
  const teto = tecnica("teto", [compra("defesa"), compra("defesa"), compra("defesa")]);
  const rt = da(sistema, [teto]).estilo.tecnicas[0];
  t(`${sistema}: tres Defesas passam do teto`, [codigos(rt, "erro"), rt.validacao[0].texto], [["teto"], "Aumento de Defesa: 3 compras, o teto é 2."]);
  t(`${sistema}: e nao dao Defesa`, ganhoDefesa(sistema, [teto], "teto"), 0);

  /* Escolha pendente: TR sem TR. */
  const semEscolha = tecnica("sem", [compra("defesa"), compra("tr")]);
  const rs = da(sistema, [semEscolha]).estilo.tecnicas[0];
  t(`${sistema}: TR sem TR escolhido e erro`, [codigos(rs, "erro"), rs.validacao[0].texto], [["escolha"], "Aumento de TR: falta escolher o TR."]);
  t(`${sistema}: e bloqueia ate a Defesa da mesma Tecnica`, ganhoDefesa(sistema, [semEscolha], "sem"), 0);

  /* Efeito desconhecido. */
  t(`${sistema}: efeito desconhecido e erro`,
    codigos(da(sistema, [tecnica("d", [compra("inventado")])]).estilo.tecnicas[0], "erro"), ["efeito"]);

  /* Progressão estourada: no Nível 4 cabem 2, e a terceira invalida TODAS. */
  const tres = [tecnica("a", [compra("defesa")]), tecnica("b", [compra("dano")]), tecnica("c", [compra("cd")])];
  const dp = da(sistema, tres, { nd: 4, dom: 1 });
  t(`${sistema}: tres Tecnicas no Nivel 4 sao erro do Estilo`,
    [dp.estilo.validacao.map((v) => v.texto), dp.estilo.tecnicas.map((x) => x.mecanicamenteValida)],
    [["Técnicas de Estilo: 3 de 2."], [false, false, false]]);
  t(`${sistema}: e nem a primeira da Defesa`, ganhoDefesa(sistema, tres, "a", { nd: 4, dom: 1 }), 0);
  t(`${sistema}: com duas, a primeira vale`, ganhoDefesa(sistema, tres.slice(0, 2), "a", { nd: 4, dom: 1 }) > 0, true);

  /* AVISO e INFO não bloqueiam. */
  const especial = tecnica("esp", [compra("defesa"), compra("especial")], {
    especial: { texto: "Lâmina de energia", linhas: [{ canal: "iniciativa", expr: "1" }], confirmacoes: {} },
  });
  const re = da(sistema, [especial]).estilo.tecnicas[0];
  t(`${sistema}: o Efeito Especial e aviso, e o gatilho da borda e o Auxiliar sao info`,
    [codigos(re, "erro"), codigos(re, "aviso"), codigos(re, "info")], [[], ["especial"], ["borda", "auxiliar"]]);
  t(`${sistema}: e a Tecnica com aviso vale, com a linha do Especial`,
    [ganhoDefesa(sistema, [especial], "esp"),
      da(sistema, [especial], { ativa: "esp" }).iniciativa - da(sistema, [especial]).iniciativa],
    [Math.floor(da(sistema, []).maestria / 2), 1]);

  /* A linha do Especial não pode escrever a vaga do próprio Estilo. */
  const circular = tecnica("circ", [compra("especial")], {
    especial: { texto: "", linhas: [{ canal: "vagasEstilo", expr: "5" }], confirmacoes: {} },
  });
  t(`${sistema}: o Especial escrevendo vagasEstilo e erro`,
    codigos(da(sistema, [circular]).estilo.tecnicas[0], "erro"), ["canal"]);
  t(`${sistema}: e a vaga nao sobe`, da(sistema, [circular], { ativa: "circ" }).estilo.progressao.total, 3);

  /* A Técnica de Estilo Especial (tipo) não tem limite de efeitos nem gatilho
     da borda: ela é aplicação, e não pacote. */
  const tipoEspecial = tecnica("te", [], {
    tipo: "especial", especial: { texto: "Lua Nebulosa", linhas: [], confirmacoes: {} },
  });
  const rte = da(sistema, [tipoEspecial]).estilo.tecnicas[0];
  t(`${sistema}: a Tecnica Especial so avisa`,
    [codigos(rte, "erro"), codigos(rte, "aviso"), codigos(rte, "info"), rte.mecanicamenteValida],
    [[], ["especial"], [], true]);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
