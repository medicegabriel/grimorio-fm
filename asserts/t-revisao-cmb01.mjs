/* REVISÃO CMB-01 (2026-10-07): o mesmo Estilo de Combate por duas fontes.

   O Talento Adepto de Combate empresta o pool dos Estilos e o catálogo diz que
   "quem pega os dois não recebe em dobro". A coleta era uma por pool, e
   Defensivo pelo Repertório e pelo Adepto dava +12 de Defesa no nível 16 (+6
   e +6). A opção agora declara `naoAcumulaEntreFontes`, e o coletor genérico põe
   as linhas dela num grupo que não acumula: vale o maior.

   O que NÃO muda e também é medido: Estilos DIFERENTES nas duas fontes somam, e
   uma escolha de atributo que outros pais também usam continua acumulando. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const EF = await import(R + "afty-efeitos.js");
const H = await import(R + "afty-habilidades.js");
const T = await import(R + "afty-talentos.js");
const { createBlankAfty } = await import(R + "afty-schema.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ficha = (sistema, nivel, repertorio, adepto) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd: nivel, tipo: "combatente", patamar: "comum" };
  c.especializacoes = [{ id: "combatente", nivel }];
  c.habilidades = ["cmb_repertorio_do_especialista"];
  c.escolhasHabilidade = { cmb_repertorio_do_especialista: repertorio };
  if (adepto) {
    c.talentos = ["tal_adepto_de_combate"];
    c.escolhasTalento = { tal_adepto_de_combate: adepto };
    c.pericias = { ...(c.pericias || {}), intuicao: { treino: "mestre" } };
  }
  return c;
};
const doEstilo = (d, id, canal = "defesa") => (d.efeitos?.detalhes ?? [])
  .filter((x) => x.canal === canal && x.origem === id && !x.suplantado).reduce((s, x) => s + x.valor, 0);

for (const sistema of ["player", "afty"]) {
  for (const [nivel, esperado] of [[1, 2], [4, 3], [8, 4], [16, 6]]) {
    const so = deriveAfty(ficha(sistema, nivel, ["cmb_estilo_defensivo"], null));
    const dois = deriveAfty(ficha(sistema, nivel, ["cmb_estilo_defensivo"], ["cmb_estilo_defensivo"]));
    t(`(${sistema}, nível ${nivel}) Defensivo só pelo Repertório vale +${esperado}`, doEstilo(so, "cmb_estilo_defensivo"), esperado);
    t(`(${sistema}, nível ${nivel}) e pelos dois continua +${esperado}`, doEstilo(dois, "cmb_estilo_defensivo"), esperado);
    t(`(${sistema}, nível ${nivel}) a Defesa final não dobra`, dois.defesa, so.defesa);
  }
  const dois = deriveAfty(ficha(sistema, 16, ["cmb_estilo_defensivo"], ["cmb_estilo_defensivo"]));
  t(`(${sistema}) o hover mostra a cópia do Adepto suplantada, e não some`,
    (dois.efeitos?.detalhes ?? []).filter((x) => x.canal === "defesa" && x.origem === "cmb_estilo_defensivo").map((x) => !!x.suplantado).sort(),
    [false, true]);
  /* Estilos DIFERENTES somam: Defensivo pelo Repertório e Distante pelo Adepto. */
  const diferentes = deriveAfty(ficha(sistema, 16, ["cmb_estilo_defensivo"], ["cmb_estilo_distante"]));
  t(`(${sistema}) Estilos diferentes nas duas fontes continuam valendo os dois`,
    [doEstilo(diferentes, "cmb_estilo_defensivo"), doEstilo(diferentes, "cmb_estilo_distante", "bonusAcerto") > 0], [6, true]);
}

/* O pool marca todos os oito, e as duas fontes leem o mesmo pool. */
t("os oito Estilos carregam a marca", H.ESTILOS_DE_COMBATE.map((e) => e.naoAcumulaEntreFontes), Array(8).fill(true));
t("o Adepto empresta o mesmo pool", T.getTalento("tal_adepto_de_combate").escolha.opcoes === H.ESTILOS_DE_COMBATE, true);

/* Opção SEM a marca continua acumulando entre pais diferentes (o mecanismo é opt-in). */
{
  const catalogo = {
    pai_a: { id: "pai_a", nome: "A", escolha: { opcoes: [{ id: "opc_x", nome: "X", efeitos: [{ canal: "defesa", expr: "1" }] }] } },
    pai_b: { id: "pai_b", nome: "B", escolha: { opcoes: [{ id: "opc_x", nome: "X", efeitos: [{ canal: "defesa", expr: "1" }] }] } },
  };
  const efs = EF.coletarEfeitosDeEscolha({ pai_a: ["opc_x"], pai_b: ["opc_x"] }, {}, catalogo);
  t("opção sem a marca: duas linhas, sem grupo", efs.map((e) => e.grupoNaoAcumula ?? null), [null, null]);
  t("e somam", EF.resolverExclusivos(EF.aplicarEfeitos(efs, {})).porCanal.defesa, 2);
  const marcado = {
    pai_a: { ...catalogo.pai_a, escolha: { opcoes: [{ ...catalogo.pai_a.escolha.opcoes[0], naoAcumulaEntreFontes: true }] } },
    pai_b: { ...catalogo.pai_b, escolha: { opcoes: [{ ...catalogo.pai_b.escolha.opcoes[0], naoAcumulaEntreFontes: true }] } },
  };
  const efs2 = EF.coletarEfeitosDeEscolha({ pai_a: ["opc_x"], pai_b: ["opc_x"] }, {}, marcado);
  t("opção de addon com a marca: vale uma vez", EF.resolverExclusivos(EF.aplicarEfeitos(efs2, {})).porCanal.defesa, 1);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
