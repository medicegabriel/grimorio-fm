import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { marcasDeEntradas, buildCriaturaDslContext } = await import(R + "afty-efeitos.js");
const { evalNumber, CHAVE_MARCAS, normalizarMarca } = await import(R + "afty-dsl.js");
const { vocabularioDsl } = await import(R + "afty-dsl-vocabulario.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ---- marcasDeEntradas isolado ---- */
t("vazio", marcasDeEntradas([]), {});
t("sem argumento", marcasDeEntradas(), {});
t("nulos ignorados", marcasDeEntradas([null, undefined, 0]), {});
t("familia conta", marcasDeEntradas([{ familia: "habilidade" }, { familia: "habilidade" }]), { habilidade: 2 });
t("tags contam", marcasDeEntradas([{ tags: ["a", "b"] }, { tags: ["a"] }]), { a: 2, b: 1 });
t("especializacao conta", marcasDeEntradas([{ familia: "habilidade", especializacaoId: "lutador" }]),
  { habilidade: 1, lutador: 1 });
t("tag normalizada", marcasDeEntradas([{ tags: ["Adaptação"] }, { tags: [" adaptacao "] }]), { adaptacao: 2 });
t("tags nao-lista ignorada", marcasDeEntradas([{ tags: "abc", familia: "talento" }]), { talento: 1 });
t("tag vazia ignorada", marcasDeEntradas([{ tags: ["", "  ", null] }]), {});
t("tag igual a familia SOMA", marcasDeEntradas([{ tags: ["talento"], familia: "talento" }]), { talento: 2 });

/* ---- ponta a ponta pelo deriveAfty ---- */
const base = () => {
  const c = createBlankAfty();
  c.core.nd = 12;
  c.core.tipo = "combatente";
  c.especializacoes = [{ id: "lutador", nivel: 12 }];
  return c;
};

const semNada = base();
const d0 = deriveAfty(semNada);
t("derive nao quebrou", typeof d0.hp, "number");

// Duas habilidades de Lutador na ficha.
const comDuas = base();
comDuas.habilidades = ["lut_corpo_treinado", "lut_reflexo_evasivo"];
const d1 = deriveAfty(comDuas);
t("derive com habilidades nao quebrou", typeof d1.hp, "number");

/* O contexto do DSL não sai do derive, então recrio o mapa do mesmo jeito que o
   derive recria, para conferir o número que `contar` enxergaria. */
const ctxDe = (marcas) => buildCriaturaDslContext({ nd: 12, bt: 5, marcas });
const m2 = { habilidade: 2, lutador: 2 };
t("contar familia", evalNumber('contar("habilidade")', ctxDe(m2)), 2);
t("contar especializacao", evalNumber('contar("lutador")', ctxDe(m2)), 2);
t("contar outra especializacao", evalNumber('contar("combatente")', ctxDe(m2)), 0);
t("O CASO DO AUTOR com 2 na ficha", evalNumber('2 + contar("lutador") - 1', ctxDe(m2)), 3);
t("mesma conta com 5 na ficha", evalNumber('2 + contar("x") - 1', ctxDe({ x: 5 })), 6);
t("contexto sem marcas devolve 0", evalNumber('contar("lutador")', buildCriaturaDslContext({ nd: 1 })), 0);

/* ---- o mapa não vaza para o seletor de variáveis ---- */
const ctxComMarcas = ctxDe({ adaptacao: 3 });
t("chave interna existe no contexto", CHAVE_MARCAS in ctxComMarcas, true);
/* ⚠ O `{ contar: true }` e obrigatorio desde 2026-08-20: o grupo Marcas e de
   ADDON, e nao aparece para quem nao pediu a primitiva. Ver t-primitivas. */
const grupos = vocabularioDsl(ctxComMarcas, [], { contar: true });
const todosOsNomes = grupos.flatMap((g) => (g.itens || []).map((i) => i.nome));
t("chave interna NAO aparece no seletor", todosOsNomes.some((n) => n.startsWith("#")), false);
t("seletor continua listando variavel normal", todosOsNomes.includes("nd"), true);

/* ---- a normalização é a mesma dos dois lados ---- */
t("normalizarMarca casa com a chave gravada",
  evalNumber('contar("Adaptação")', ctxDe(marcasDeEntradas([{ tags: ["ADAPTACAO"] }]))), 1);
t("normalizarMarca exposta", normalizarMarca(" Adaptação "), "adaptacao");

/* ---- o autor consegue DESCOBRIR o contar() no seletor ---- */
const { DSL_FUNCOES } = await import(R + "afty-dsl-vocabulario.js");
t("contar esta na lista de funcoes do seletor",
  DSL_FUNCOES.some((f) => f.nome.startsWith("contar")), true);
t("e insere a chamada com as aspas prontas",
  DSL_FUNCOES.find((f) => f.nome.startsWith("contar")).insere, 'contar("")');

const comGrupo = vocabularioDsl(ctxDe({ eco: 3, lutador: 5 }), [], { contar: true });
const grupoMarcas = comGrupo.find((g) => g.id === "marcas");
t("o grupo Marcas existe quando ha marcas", !!grupoMarcas, true);
t("cada marca vira a chamada pronta",
  grupoMarcas.itens.map((i) => i.nome), ['contar("eco")', 'contar("lutador")']);
t("com a contagem atual do lado", grupoMarcas.itens.map((i) => i.valor), [3, 5]);
t("e o grupo SOME quando nao ha marca nenhuma",
  vocabularioDsl(buildCriaturaDslContext({ nd: 1 }), [], { contar: true }).some((g) => g.id === "marcas"), false);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
