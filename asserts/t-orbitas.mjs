/* As órbitas do retrato (2026-11-10): régua, validação do pacote, contagem de pegas
   repetidas e isolamento por ficha. Pacote neutro, escrito aqui dentro. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const O = await import(R + "afty-orbitas.js");

let ok = 0;
const falhas = [];
const t = (nome, real, esperado) => {
  const a = JSON.stringify(real);
  const b = JSON.stringify(esperado);
  if (a === b) ok += 1;
  else falhas.push(`${nome}\n     esperado ${b}\n     veio     ${a}`);
};

// A régua
t("sem configuração: inativa", O.resolveOrbitas(null, { x: 3 }).ativo, false);
t("conta e desenha igual abaixo do máximo", (({ contagem, gemas }) => [contagem, gemas])(O.resolveOrbitas({ marca: "x" }, { x: 3 })), [3, 3]);
t("apara no máximo padrão de 20", (({ contagem, gemas }) => [contagem, gemas])(O.resolveOrbitas({ marca: "x" }, { x: 25 })), [25, 20]);
t("máximo próprio", O.resolveOrbitas({ marca: "x", maximo: 5 }, { x: 9 }).gemas, 5);
t("o teto duro é 30", O.resolveOrbitas({ marca: "x", maximo: 99 }, { x: 99 }).gemas, 30);
t("pele desconhecida cai na padrão", O.resolveOrbitas({ marca: "x", pele: "nada" }, {}).pele, "carmim");

// O pacote
const pacote = (extra = {}) => ({
  id: "orb-teste", nome: "Órbitas de Teste", versao: "1.0.0", autor: "Teste", paraRaw: "afty",
  descricao: "Pacote neutro.", resumo: "Teste", categoria: "talentos",
  orbitas: { marca: "pedra", maximo: 6, pele: "carmim" },
  acrescenta: { talentos: [{
    id: "tal_pedra", nome: "Pedra", grupo: "geral", maxVezes: 6, tags: ["pedra"], descricao: "Uma pedra.",
    efeitos: [{ canal: "vagasTalento", expr: "1", nome: "Pedra" }], requisitos: [],
  }] },
  ...extra,
});
t("o pacote valida", A.validarPacote(pacote()), []);
t("marca vazia é recusada", A.validarPacote(pacote({ orbitas: { marca: "" } })).length > 0, true);
t("máximo não inteiro é recusado", A.validarPacote(pacote({ orbitas: { marca: "pedra", maximo: 2.5 } })).length > 0, true);
t("pele desconhecida é recusada", A.validarPacote(pacote({ orbitas: { marca: "pedra", pele: "x" } })).length > 0, true);
const norm = A.normalizarPacote(pacote());
t("o normalizador guarda o campo", norm.orbitas, { marca: "pedra", maximo: 6, pele: "carmim" });
A.aplicarAddons([norm]);

const ficha = (n, addons) => {
  const c = createBlankAfty();
  c.core = { ...c.core, nd: 9, tipo: "combatente", patamar: "comum" };
  c.addons = addons;
  c.talentos = Array.from({ length: n }, () => "orb-teste:tal_pedra");
  return c;
};
for (const n of [0, 1, 3, 9]) {
  t(`${n} pegas do mesmo Talento viram ${Math.min(n, 6)} gemas`, deriveAfty(ficha(n, [norm])).orbitas.gemas, Math.min(n, 6));
}
t("a ficha sem o pacote não desenha", deriveAfty(ficha(3, [])).orbitas.ativo, false);

if (falhas.length) {
  console.log(falhas.join("\n"));
  console.log(`\n${falhas.length} FALHA(S), ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
