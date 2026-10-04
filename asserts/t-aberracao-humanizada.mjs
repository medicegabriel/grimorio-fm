import { readFileSync } from "node:fs";
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const O = await import(R + "afty-origens.js");
const AP = await import(R + "afty-aptidoes.js");
const TR = await import(R + "afty-treinamentos.js");
const TAL = await import(R + "afty-talentos.js");

const pacote = A.normalizarPacote(JSON.parse(readFileSync(new URL("../addons/aberracao-humanizada.json", import.meta.url), "utf8")));
const erros = [];
let ok = 0;
function t(nome, real, esperado) {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok += 1;
  else erros.push(nome + ": " + JSON.stringify(real) + " != " + JSON.stringify(esperado));
}

t("pacote válido", A.validarPacote(pacote), []);
A.aplicarAddons([pacote]);

const ID = "aberracao-humanizada:aberracao_humanizada";
function ficha({ nd = 1, origem = ID, er = 0, escolhidas = [], talentos = [], sistema = "afty" } = {}) {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd, tipo: "conjurador", patamar: "comum" };
  c.core.origem = { id: origem };
  c.addons = [pacote];
  c.aptidoes = { ...c.aptidoes, er };
  c.aptidoesAmaldicoadas = escolhidas;
  c.talentos = talentos;
  return c;
}

const origem = O.getOrigem(ID);
t("origem instalada", origem?.nome, "Aberração Humanizada");
t("quatro características", origem?.caracteristicas?.map((c) => c.id),
  ["bonus_atributo", "heranca_maldita", "fisico_amaldicoado", "natureza_amaldicoada"]);
t("bônus distribuível", origem?.caracteristicas?.[0]?.bonus, { distribuir: 3, maxPorAtributo: 2 });
t("Anatomia no nível 1 e a cada 5", origem?.caracteristicas?.[2]?.poolAnatomia,
  { base: 1, porNivel: 5 });
t("limite natural 30 nos seis atributos",
  Object.values(deriveAfty(ficha()).attrLimiteEfetivo), [30, 30, 30, 30, 30, 30]);

for (const nd of [1, 5, 10, 15]) {
  const d = deriveAfty(ficha({ nd }));
  const base = deriveAfty(ficha({ nd, origem: "inato" }));
  t("Natureza concede PE no nível " + nd, d.pe - base.pe, nd);
  t("Natureza concede vagas no nível " + nd,
    d.totalAptidoesAmaldicoadas - base.totalAptidoesAmaldicoadas,
    1 + Number(nd >= 10) + Number(nd >= 15));
}
const abas = (c) => AP.abasAptidao(c).map((a) => a.id);
t("Maldição e Energia Reversa aparecem juntas", abas(ficha()).slice(-3),
  ["energia_reversa", "maldicao", "especiais"]);
t("Player também abre as duas categorias",
  ["energia_reversa", "maldicao"].every((id) => abas(ficha({ sistema: "player" })).includes(id)), true);
t("Player também recebe limite 30 nos seis atributos",
  Object.values(deriveAfty(ficha({ sistema: "player" })).attrLimiteEfetivo).every((limite) => limite === 30), true);
t("outra origem não herda a aba", abas(ficha({ origem: "inato" })).includes("maldicao"), false);
t("Maldição padrão continua sem Energia Reversa", abas(ficha({ origem: "maldicao" })).includes("energia_reversa"), false);
t("trilha ER disponível", AP.trilhasDaCriatura(ficha()).some((trilha) => trilha.key === "er"), true);
t("treino ER disponível", TR.treinamentosDaOrigem(O.origemEstrutural(ficha()), null, ficha()).some((treino) => treino.id === "energia_reversa"), true);
const dupla = deriveAfty(ficha({ nd: 10, er: 2, escolhidas: ["energia_reversa", "mal_estoque_ampliado"] }));
t("nível ER alocado", dupla.aptidao.efetivo.er, 2);
t("aptidões dos dois grupos válidas",
  ["energia_reversa", "mal_estoque_ampliado"].every((id) => dupla.aptidoesEscolhidas.includes(id)), true);

const talentosDoFeto = ["tal_fisico_aperfeicoado", "tal_reposicao_sanguinea"];
t("liberação declarada só para Talentos de Origem", origem?.qualificaTalentosDeOrigem,
  ["feto_amaldicoado_hibrido"]);
t("não qualifica para outras regras do Feto",
  O.origensQualificadas(ficha()).includes("feto_amaldicoado_hibrido"), false);
for (const sistema of ["afty", "player"]) {
  for (const id of talentosDoFeto) {
    const acesso = (nd, origemId) => TAL.avaliarAcessoTalento(TAL.getTalento(id), {
      nd,
      origemId,
      origensQualificadas: O.origensQualificadas(ficha({ nd, origem: origemId, sistema })),
    }).ok;
    t(sistema + ": " + id + " abre no nível 6", acesso(6, ID), true);
    t(sistema + ": " + id + " mantém o piso de nível 6", acesso(5, ID), false);
    t(sistema + ": " + id + " não abre para Inato", acesso(6, "inato"), false);
  }
  t(sistema + ": os dois Talentos escolhidos são acessíveis na ficha",
    deriveAfty(ficha({ nd: 6, talentos: talentosDoFeto, sistema })).talentos.inacessiveis, []);
}
A.aplicarAddons([]);
t("origem removida com o addon", O.getOrigem(ID), null);
if (erros.length) {
  for (const erro of erros) console.error(erro);
  process.exit(1);
}
console.log("TODOS OS " + ok + " ASSERTS PASSARAM");

