/* REVISÃO M05 (2026-10-07): Addons, isolamento entre fichas e namespace.

   Prende os quatro achados confirmados do lote, com pacotes sintéticos de id e
   valor próprios (o número 7 e o 3 são parâmetros da prova, não regra do livro):

   - F01: o `substitui` de uma ficha não muda os números de outra no Encontro
     misto (seção 3 do docs/afty-addons.md, camada da criatura).
   - F02: a Base de um pacote só é concedida a quem carrega o pacote.
   - F03: referência local aninhada ganha namespace (`requisitos[].ids[]` das
     Lendárias e `requisitos[].habId` das Habilidades).
   - P04: as chaves de `remendaHabilidades` de mãe do próprio pacote.

   Cada cenário roda nos dois sistemas, por `rulesVersion`, e nas duas ordens. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const AD = await import(R + "afty-addons.js");
const H = await import(R + "afty-habilidades.js");
const TAL = await import(R + "afty-talentos.js");
const AN = await import(R + "afty-alto-nivel.js");
const { createBlankAfty } = await import(R + "afty-schema.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* F01: o remendo é da ficha que carrega o pacote                */
/* ============================================================ */

const TALENTO = "tal_nocao_e_preparacao";
const remendo = (id, defesa) => ({
  id, nome: `Remendo ${id}`, versao: "1",
  substitui: { talentos: [{ id: TALENTO, efeitos: [{ canal: "defesa", expr: String(defesa) }] }] },
});
const fichaComTalento = (sistema, addons) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd: 12, tipo: "combatente", patamar: "comum", origem: { id: "sem_tecnica" } };
  c.especializacoes = [{ id: "combatente", nivel: 12 }];
  c.talentos = [TALENTO];
  c.addons = addons;
  return c;
};
const fontesDeDefesa = (d) => (d.efeitos?.detalhes ?? [])
  .filter((x) => x.canal === "defesa" && x.origem === TALENTO).map((x) => x.valor);

for (const [sa, sb] of [["afty", "player"], ["player", "afty"], ["afty", "afty"], ["player", "player"]]) {
  const A = fichaComTalento(sa, [remendo("m05-remendo", 7)]);
  const B = fichaComTalento(sb, []);
  AD.aplicarAddons([]);
  const bSozinha = deriveAfty(B);
  AD.aplicarAddons([remendo("m05-remendo", 7)]);
  const aSozinha = deriveAfty(A);
  for (const ordem of [[A, B], [B, A]]) {
    AD.aplicarAddons(AD.unirAddons(ordem).pacotes);
    const epocaAntes = AD.epocaAddons();
    const bNoEncontro = deriveAfty(B);
    const aNoEncontro = deriveAfty(A);
    const rotulo = `A ${sa} / B ${sb}, ${ordem[0] === A ? "A primeiro" : "B primeiro"}`;
    t(`F01 ${rotulo}: B sem o pacote fica igual`, bNoEncontro.defesa, bSozinha.defesa);
    t(`F01 ${rotulo}: e o hover de B não traz o remendo`, fontesDeDefesa(bNoEncontro), fontesDeDefesa(bSozinha));
    t(`F01 ${rotulo}: A com o pacote conserva o remendo`, aNoEncontro.defesa, aSozinha.defesa);
    t(`F01 ${rotulo}: e o +7 está no hover de A`, fontesDeDefesa(aNoEncontro).includes(7), true);
    t(`F01 ${rotulo}: o escopo não mexe na época`, AD.epocaAddons(), epocaAntes);
    t(`F01 ${rotulo}: e o mundo volta à união depois`, TAL.getTalento(TALENTO).remendadoPor?.map((p) => p.id), ["m05-remendo"]);
  }
}

/* Dois pacotes remendando a MESMA entrada, um em cada ficha: cada uma vê o seu. */
{
  const A = fichaComTalento("afty", [remendo("m05-a", 7)]);
  const B = fichaComTalento("player", [remendo("m05-b", 3)]);
  AD.aplicarAddons(AD.unirAddons([A, B]).pacotes);
  t("F01 dois remendos na mesma entrada: A vê só o seu", fontesDeDefesa(deriveAfty(A)), [7]);
  t("F01 e B vê só o seu", fontesDeDefesa(deriveAfty(B)), [3]);
  t("F01 e o mundo segue com os dois", TAL.getTalento(TALENTO).remendadoPor?.map((p) => p.id), ["m05-a", "m05-b"]);
}

/* Sem remendo no ar o escopo nem reconstrói (o caso comum, custo zero). */
{
  AD.aplicarAddons([]);
  let chamou = 0;
  const r = AD.comEscopoDaFicha(createBlankAfty(), () => { chamou += 1; return 42; });
  t("F01 sem remendo no ar o escopo só roda a função", [r, chamou, AD.remendosNoCatalogo()], [42, 1, []]);
}

/* O escopo devolve o mundo anterior mesmo quando a função estoura. */
{
  const A = fichaComTalento("afty", [remendo("m05-remendo", 7)]);
  AD.aplicarAddons([remendo("m05-remendo", 7)]);
  let estourou = false;
  try { AD.comEscopoDaFicha(createBlankAfty(), () => { throw new Error("x"); }); } catch { estourou = true; }
  t("F01 erro dentro do escopo ainda restaura o remendo", [estourou, AD.remendosNoCatalogo()], [true, ["m05-remendo"]]);
  // Escopo aninhado de outra ficha volta ao escopo de fora, e não ao mundo.
  const dentro = AD.comEscopoDaFicha(createBlankAfty(), () => {
    const antes = AD.remendosNoCatalogo();
    const interno = AD.comEscopoDaFicha(A, () => AD.remendosNoCatalogo());
    return [antes, interno, AD.remendosNoCatalogo()];
  });
  t("F01 escopo aninhado volta ao de fora", dentro, [[], ["m05-remendo"], []]);
}

/* ============================================================ */
/* F02: Base de addon só para quem tem o pacote                  */
/* ============================================================ */

const pacoteBase = (defesa) => ({
  id: "m05-base", nome: "Base de Teste", versao: "1",
  acrescenta: { habilidades: [{
    id: "bonus_base", nome: "Base da Mesa", descricao: "Teste", especializacaoId: "lutador",
    tipo: "base", nivel: 1, requisitos: [], efeitos: [{ canal: "defesa", expr: String(defesa) }],
  }] },
});
const fichaLutador = (sistema, addons) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd: 1, tipo: "combatente", patamar: "comum" };
  c.especializacoes = [{ id: "lutador", nivel: 1 }];
  c.addons = addons;
  return c;
};
for (const defesa of [3, 7]) {
  const A = fichaLutador("player", [pacoteBase(defesa)]);
  const B = fichaLutador("player", []);
  AD.aplicarAddons([]);
  const bSozinha = deriveAfty(B).defesa;
  AD.aplicarAddons([pacoteBase(defesa)]);
  const aSozinha = deriveAfty(A).defesa;
  AD.aplicarAddons(AD.unirAddons([A, B]).pacotes);
  t(`F02 (+${defesa}) a Base de A não é concedida a B`,
    H.habilidadesConcedidasPelasEspecializacoes([{ id: "lutador", nivel: 1 }], "player", AD.pacotesDaFicha(B))
      .includes("m05-base:bonus_base"), false);
  t(`F02 (+${defesa}) e é concedida a A`,
    H.habilidadesConcedidasPelasEspecializacoes([{ id: "lutador", nivel: 1 }], "player", AD.pacotesDaFicha(A))
      .includes("m05-base:bonus_base"), true);
  t(`F02 (+${defesa}) Defesa de B igual com e sem o vizinho`, deriveAfty(B).defesa, bSozinha);
  t(`F02 (+${defesa}) Defesa de A igual sozinha e no Encontro`, deriveAfty(A).defesa, aSozinha);
  t(`F02 (+${defesa}) a Base soma o próprio número em A`, aSozinha - bSozinha, defesa);
}
/* No Afty a Base só é concedida quando é `automatica`, e a regra do pacote é a mesma. */
{
  const auto = { ...pacoteBase(5), acrescenta: { habilidades: [{ ...pacoteBase(5).acrescenta.habilidades[0], automatica: true }] } };
  const A = fichaLutador("afty", [auto]);
  const B = fichaLutador("afty", []);
  AD.aplicarAddons([]);
  const bSozinha = deriveAfty(B).defesa;
  AD.aplicarAddons(AD.unirAddons([A, B]).pacotes);
  t("F02 Afty: Base automática de A não chega a B", deriveAfty(B).defesa, bSozinha);
  t("F02 Afty: e chega a A", deriveAfty(A).defesa - bSozinha, 5);
}
/* Sem o conjunto de pacotes a função continua sem filtro (quem chama sem ficha). */
t("F02 chamada sem ficha não filtra",
  H.habilidadesConcedidasPelasEspecializacoes([{ id: "lutador", nivel: 1 }], "player").includes("m05-base:bonus_base"), true);

/* ============================================================ */
/* F03 e P04: referências locais aninhadas                       */
/* ============================================================ */

{
  const p = { id: "m05-refs", nome: "Refs", versao: "1", acrescenta: { lendarias: [
    { id: "a", nome: "A", descricao: "a" }, { id: "b", nome: "B", descricao: "b" },
    { id: "c", nome: "C", descricao: "c", requisitos: [{ tipo: "lendariaOr", ids: ["a", "b", "len_inquebravel"] }] },
  ] } };
  const r = AD.aplicarAddons([p]);
  t("F03a pacote de Lendárias aceito", r.problemas, []);
  t("F03a a lista do lendariaOr ganha o namespace, e o id do livro fica cru",
    AN.getHabilidadeLendaria("m05-refs:c")?.requisitos?.[0]?.ids, ["m05-refs:a", "m05-refs:b", "len_inquebravel"]);
}

const habPacote = (extra = {}) => ({
  id: "m05-esc", nome: "Esc", versao: "1", acrescenta: { habilidades: [
    { id: "mae", nome: "Mae", descricao: "m", especializacaoId: "lutador", tipo: "base", nivel: 1, requisitos: [],
      escolha: { id: "e", label: "E", niveis: [1], opcoes: [{ id: "o1", nome: "O1", descricao: "o" }] } },
    { id: "irma", nome: "Irma", descricao: "i", especializacaoId: "lutador", tipo: "nivel", nivel: 2,
      requisitos: [{ tipo: "escolha", habId: "mae", opcaoId: "o1", label: "Mae O1" }] },
  ] },
  ...extra,
});
{
  const r = AD.aplicarAddons([habPacote()]);
  t("F03b pacote aceito sem problema de validador", r.problemas, []);
  t("F03b o habId do requisito escolha ganha o namespace", H.getHabilidade("m05-esc:irma")?.requisitos?.[0]?.habId, "m05-esc:mae");
  t("F03b e o opcaoId (opção da mãe) fica cru", H.getHabilidade("m05-esc:irma")?.requisitos?.[0]?.opcaoId, "o1");
}

/* P04: a herdeira de uma mãe do PRÓPRIO pacote remenda pelo id local. */
{
  const p = { id: "m05-her", nome: "Herança", versao: "1", acrescenta: {
    especializacoes: [
      { id: "mae_esp", nome: "Mãe" },
      { id: "filha_esp", nome: "Filha", herdaDe: "mae_esp",
        remendaHabilidades: { golpe: { descricao: "Remendado pela filha" } } },
    ],
    habilidades: [
      { id: "golpe", nome: "Golpe", descricao: "Original", especializacaoId: "mae_esp", tipo: "base", nivel: 1, requisitos: [] },
    ],
  } };
  AD.aplicarAddons([p]);
  const clone = H.AFTY_HABILIDADES.find((h) => h.herdadaDe === "m05-her:golpe");
  t("P04 a herdeira tem o clone da habilidade da mãe", !!clone, true);
  t("P04 e o remendo escrito pelo id local chega ao clone", clone?.descricao, "Remendado pela filha");
  t("P04 a mãe continua com o texto original", H.getHabilidade("m05-her:golpe")?.descricao, "Original");
}

AD.limparAddons();
console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
