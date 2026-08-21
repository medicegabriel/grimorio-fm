import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const AD = await import(R + "afty-addons.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { evalNumber } = await import(R + "afty-dsl.js");

let ok = 0; const bad = [];
const t = (n, r, e) => { if (JSON.stringify(r) === JSON.stringify(e)) ok++; else bad.push(`${n}: ${JSON.stringify(r)} != ${JSON.stringify(e)}`); };

const UMA = (id, tags) => ({
  id, nome: id, especializacaoId: "lutador", tipo: "base", nivel: 1,
  descricao: "x", requisitos: [], tags,
});
const P = {
  id: "mesa", nome: "Mesa", versao: "1.0.0",
  acrescenta: { habilidades: [UMA("a", ["eco"]), UMA("b", ["eco"]), UMA("c", ["raro"])] },
};

t("sem addon, nenhuma marca declarada", AD.marcasDeclaradas(), []);
AD.aplicarAddons([P]);
const dec = Object.fromEntries(AD.marcasDeclaradas().map((m) => [m.marca, m.quantas]));
t("declaradas contam as entradas do pacote", dec, { eco: 2, raro: 1 });

const ficha = (habs) => {
  const c = createBlankAfty();
  c.core.nd = 12; c.core.tipo = "combatente";
  c.especializacoes = [{ id: "lutador", nivel: 12 }];
  c.habilidades = habs; c.addons = [P];
  return c;
};

/* A criatura pega UMA de "eco" e nenhuma de "raro". */
const d = deriveAfty(ficha(["mesa:a"]));
const rdCom = (expr) => {
  const c = ficha(["mesa:a"]);
  c.core.tecnicaEfeitos = [{ canal: "rdGeral", expr }];
  return deriveAfty(c).rdGeral - d.rdGeral;
};
t("marca que a criatura TEM conta certo", rdCom('contar("eco")'), 1);
t("marca declarada e nao usada vale ZERO, e nao quebra", rdCom('contar("raro")'), 0);
t("marca que ninguem declarou tambem vale zero", rdCom('contar("nunca")'), 0);

/* A que importa: a marca declarada e nao usada APARECE no seletor, com zero. */
const { vocabularioDsl } = await import(R + "afty-dsl-vocabulario.js");
const { buildCriaturaDslContext } = await import(R + "afty-efeitos.js");
const grupo = (marcas) =>
  vocabularioDsl(buildCriaturaDslContext({ nd: 12, marcas }), [], { contar: true }).find((g) => g.id === "marcas");

const comZero = grupo({ eco: 1, raro: 0 });
t("o seletor lista as duas", comZero.itens.map((i) => i.nome), ['contar("eco")', 'contar("raro")']);
t("e mostra o zero da que nao e usada", comZero.itens.map((i) => i.valor), [1, 0]);

AD.limparAddons();
t("depois de desinstalar, nada declarado", AD.marcasDeclaradas(), []);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
