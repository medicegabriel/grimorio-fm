/* A liberação `gemeosMaldicao` e a ORIGEM ESTRUTURAL.

   Pedido do autor em 2026-08-29: *"liberar Origem de Maldição para Gêmeos.
   Fazendo com que ele siga as regras de Maldição de não ter Energia Reversa,
   porém ter a aba de Aptidões de Maldição e etc."*

   As quatro decisões dele no mesmo dia:
     1. o gatilho é COPIAR em Verdadeiras Origens, e não ter o Addon;
     2. a Natureza Amaldiçoada copiada traz os NÚMEROS dela, e não só o texto;
     3. as DUAS características de Maldição disparam a regra;
     4. a Linha de Treinamento de Energia Reversa some junto.

   ⚠ A invariante que este arquivo persegue é a IGUALDADE com uma Maldição de
   verdade. "Seguir as regras de Maldição" não é uma lista de consequências que
   eu escolhi: é ficar idêntico a quem já é, nos pontos que a origem decide. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
import { readFileSync } from "node:fs";

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const OR = await import(R + "afty-origens.js");
const AP = await import(R + "afty-aptidoes.js");
const TRE = await import(R + "afty-treinamentos.js");

const PACOTE = JSON.parse(
  readFileSync(new URL("./exemplo-gemeos-maldicao.json", import.meta.url), "utf8"),
);

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const NATUREZA = "vo_maldicao_natureza_amaldicoada";
const METAFISICA = "vo_maldicao_existencia_metafisica";

/* ============================================================ */
/* 1. A liberação e o pacote                                     */
/* ============================================================ */

t("a liberacao existe", AD.LIBERACOES.some((l) => l.id === "gemeosMaldicao"), true);
t("o pacote so libera", PACOTE.libera, ["gemeosMaldicao"]);
t("e nao acrescenta nada", PACOTE.acrescenta, undefined);
t("passa no validador", AD.validarPacote(PACOTE), []);
t("e aplica sem problema", AD.aplicarAddons([PACOTE]).problemas, []);

/* ============================================================ */
/* 2. As fichas                                                  */
/* ============================================================ */

const monta = (nd, origemId, { escolha = null, addon = true, aptidoes = null } = {}) => {
  const c = createBlankAfty();
  c.core.nd = nd;
  c.core.origem = { id: origemId, escolhas: escolha ? { verdadeiras_origens: [escolha] } : {} };
  c.especializacoes = [{ id: "lutador", nivel: nd }];
  if (aptidoes) c.aptidoes = aptidoes;
  if (addon) c.addons = [PACOTE];
  return c;
};
const gemeo = (escolha, extra) => monta(12, "gemeos", { escolha, ...extra });
const opcoesVO = (c) =>
  OR.caracteristicasEfetivas(c).find((x) => x.escolha?.id === "verdadeiras_origens")?.escolha.opcoes ?? [];
const daMaldicao = (c) => opcoesVO(c).filter((o) => o.origemId === "maldicao").map((o) => o.id);

/* ============================================================ */
/* 3. A lista de Verdadeiras Origens                             */
/* ============================================================ */

t("sem o addon a Maldicao nao aparece", daMaldicao(gemeo(null, { addon: false })), []);
/* ⚠ DUAS, e não três: a Maldição tem Bônus em Atributo, Existência Metafísica e
   Natureza Amaldiçoada, e o filtro genérico tira o Bônus em Atributo de toda
   origem. Igual ao que aconteceu com o Sem Técnica em 2026-08-21. */
t("com o addon aparecem as DUAS", daMaldicao(gemeo(null)), [METAFISICA, NATUREZA]);
t("e o Bonus em Atributo nao entra",
  daMaldicao(gemeo(null)).some((id) => id.includes("bonus_atributo")), false);

const semAddon = opcoesVO(gemeo(null, { addon: false })).length;
t("o addon acrescenta exatamente 2 opcoes", opcoesVO(gemeo(null)).length, semAddon + 2);
/* As outras três proibidas continuam fora: soltar a Maldição não solta o resto. */
for (const proibida of ["derivado", "gemeos"]) {
  t(`${proibida} continua proibida`,
    opcoesVO(gemeo(null)).some((o) => o.origemId === proibida), false);
}
t("Sem Tecnica continua proibida sem a liberacao DELE",
  opcoesVO(gemeo(null)).some((o) => o.origemId === "sem_tecnica"), false);

/* ⚠ A escolha continua sendo UMA. O `vagas` da característica não foi tocado. */
const cardVO = (c) => OR.caracteristicasEfetivas(c).find((x) => x.escolha?.id === "verdadeiras_origens");
t("continua uma escolha so", cardVO(gemeo(null)).escolha.vagas ?? 1, 1);

/* O catálogo é compartilhado entre criaturas: o addon de uma não pode vazar
   para a outra. Duas fichas derivadas na mesma sessão, de propósito. */
const comAddon = gemeo(null);
const semAddonFicha = gemeo(null, { addon: false });
t("uma ficha nao contamina a outra",
  [daMaldicao(comAddon).length, daMaldicao(semAddonFicha).length], [2, 0]);

/* ============================================================ */
/* 4. `origemEstrutural`                                         */
/* ============================================================ */

t("criatura nula nao quebra", OR.origemEstrutural(null), null);
t("uma Maldicao de verdade e Maldicao", OR.origemEstrutural(monta(12, "maldicao")), "maldicao");
t("um Inato e Inato", OR.origemEstrutural(monta(12, "inato")), "inato");
t("um Gemeo sem escolha e Gemeos", OR.origemEstrutural(gemeo(null)), "gemeos");
t("que copiou de outra origem continua Gemeos",
  OR.origemEstrutural(gemeo("vo_inato_tecnica_inata")), "gemeos");

/* ⚠ AS DUAS CARACTERÍSTICAS DISPARAM (decisão do autor). A Existência
   Metafísica é puro julgamento de mesa e não tem número nenhum, mas copiá-la
   diz que a criatura É uma maldição, que é o que a estrutura pergunta. */
t("copiar a Natureza Amaldicoada vira Maldicao", OR.origemEstrutural(gemeo(NATUREZA)), "maldicao");
t("copiar a Existencia Metafisica tambem", OR.origemEstrutural(gemeo(METAFISICA)), "maldicao");

/* ⚠ SEM O ADDON A ESCOLHA NÃO RESOLVE, e por isso a estrutura volta sozinha. A
   trava mora num lugar só (`verdadeiraOrigemEscolhida`), e não duplicada aqui. */
t("sem o addon o id gravado nao vale",
  OR.origemEstrutural(gemeo(NATUREZA, { addon: false })), "gemeos");
t("mas o id continua na ficha",
  gemeo(NATUREZA, { addon: false }).core.origem.escolhas.verdadeiras_origens, [NATUREZA]);

/* ============================================================ */
/* 5. A igualdade com uma Maldição de verdade                    */
/* ============================================================ */

const maldicaoReal = monta(12, "maldicao", { addon: false });
const trilhas = (c) => deriveAfty(c).trilhasAptidao.map((x) => x.key);
const abas = (c) => AP.abasAptidao(c).map((a) => a.id);

t("a Maldicao real nao tem Energia Reversa", trilhas(maldicaoReal), ["au", "cl", "bar", "dom"]);
t("o Gemeo que copiou tambem nao", trilhas(gemeo(NATUREZA)), trilhas(maldicaoReal));
t("nem o que copiou a Metafisica", trilhas(gemeo(METAFISICA)), trilhas(maldicaoReal));
t("o Gemeo comum tem as cinco", trilhas(gemeo(null)), ["au", "cl", "bar", "dom", "er"]);

/* A aba de Maldição OCUPA o lugar da de Energia Reversa, e não se soma a ela. */
t("a Maldicao real troca a aba", abas(maldicaoReal),
  ["aura", "controle_leitura", "barreiras", "dominio", "maldicao", "especiais"]);
t("o Gemeo que copiou tem a mesma barra", abas(gemeo(NATUREZA)), abas(maldicaoReal));
t("e a Metafisica tambem", abas(gemeo(METAFISICA)), abas(maldicaoReal));
t("as duas nunca aparecem juntas",
  abas(gemeo(NATUREZA)).filter((a) => a === "energia_reversa" || a === "maldicao"), ["maldicao"]);
t("o Gemeo comum continua com Energia Reversa",
  abas(gemeo(null)).includes("energia_reversa"), true);

/* A Linha de Treinamento de Energia Reversa tem `foraDaOrigem: ["maldicao"]`. */
const temTreinoER = (c) =>
  TRE.treinamentosDaOrigem(OR.origemEstrutural(c), OR.origensQualificadas(c))
    .some((l) => l.id === "energia_reversa");
t("a Maldicao real nao ve a Linha de Energia Reversa", temTreinoER(maldicaoReal), false);
t("o Gemeo que copiou tambem nao", temTreinoER(gemeo(NATUREZA)), false);
t("o Gemeo comum ve", temTreinoER(gemeo(null)), true);
t("e sem o addon ele volta a ver", temTreinoER(gemeo(NATUREZA, { addon: false })), true);

/* ⚠ E o resto das linhas NÃO se perde junto. O `foraDaOrigem` da Maldição lista
   só a Energia Reversa, e o do Restringido é outro assunto. */
t("as outras linhas continuam",
  TRE.treinamentosDaOrigem("maldicao").some((l) => l.id === "barreiras"), true);

/* ⚠ O FOCO PRESO NA LINHA PERDIDA VOLTA, que é o que já acontece com a Maldição
   de verdade: o aparo é de leitura, e a ficha guarda o progresso. */
const comTreinoER = gemeo(NATUREZA);
comTreinoER.treinamentos = { energia_reversa: 3 };
t("o treino gravado nao gasta Foco", TRE.focosGastos(
  comTreinoER.treinamentos, OR.origemEstrutural(comTreinoER), OR.origensQualificadas(comTreinoER),
), 0);
t("mas continua gravado", comTreinoER.treinamentos.energia_reversa, 3);
const gemeoComum = gemeo(null);
gemeoComum.treinamentos = { energia_reversa: 3 };
t("num Gemeo comum ele gasta", TRE.focosGastos(
  gemeoComum.treinamentos, OR.origemEstrutural(gemeoComum), OR.origensQualificadas(gemeoComum),
), 3);

/* Nível de Aptidão em Energia Reversa alocado: sai ZERADO, e não some da ficha. */
const comER = gemeo(NATUREZA, { aptidoes: { er: 3, au: 2 } });
t("o nivel de ER zera", deriveAfty(comER).aptidao.efetivo.er, 0);
t("as outras trilhas ficam", deriveAfty(comER).aptidao.efetivo.au, 2);
t("e a ficha guarda o que foi alocado", comER.aptidoes.er, 3);
t("o Gemeo comum mantem o nivel", deriveAfty(gemeo(null, { aptidoes: { er: 3 } })).aptidao.efetivo.er, 3);

/* ============================================================ */
/* 6. A Natureza Amaldiçoada copiada, com número                 */
/* ============================================================ */
/* ⚠ ESTE É O CAMINHO NOVO. Até 2026-08-29 toda característica copiada em
   Verdadeiras Origens entrava só como TEXTO: `ORIGEM_EFEITOS` é chaveado pela
   origem inteira e não desce à característica. Ninguém tinha reparado porque
   nenhuma das copiáveis tinha número. */

const vagas = (c) => deriveAfty(c).totalAptidoesAmaldicoadas;
const peMax = (c) => deriveAfty(c).pe;

const base = gemeo(null);
t("um Gemeo comum nao tem vaga de Aptidao", vagas(base), 0);
/* 1 + (nd >= 10) + (nd >= 15): no ND 12 são duas. */
t("a Natureza copiada da 2 vagas no ND 12", vagas(gemeo(NATUREZA)), 2);
t("uma so no ND 9", vagas(monta(9, "gemeos", { escolha: NATUREZA })), 1);
t("e tres no ND 15", vagas(monta(15, "gemeos", { escolha: NATUREZA })), 3);
t("a Metafisica nao da vaga nenhuma", vagas(gemeo(METAFISICA)), 0);

t("a Natureza copiada da +1 PE por nivel", peMax(gemeo(NATUREZA)) - peMax(base), 12);
t("a Metafisica nao mexe no PE", peMax(gemeo(METAFISICA)), peMax(base));

/* Os dois canais são cópia literal de `ORIGEM_EFEITOS.maldicao`, então a
   invariante é a IGUALDADE com quem tem a origem de verdade. */
t("o mesmo numero de vagas da Maldicao real", vagas(gemeo(NATUREZA)), vagas(maldicaoReal));
/* ⚠ A Maldição de verdade recebe o mesmo +1 PE por nível, mas o TOTAL dela não
   bate com o do Gêmeo por outro motivo: as duas origens dão bônus de atributo
   diferentes, e Constituição entra no PE. O que tem de ser igual é o SALTO. */
t("e o mesmo salto de PE que a origem de verdade da",
  peMax(gemeo(NATUREZA)) - peMax(base), 12);

/* Sem o addon a escolha não resolve, então os números somem junto com ela. */
t("sem o addon nao ha vaga", vagas(gemeo(NATUREZA, { addon: false })), 0);
t("nem PE a mais", peMax(gemeo(NATUREZA, { addon: false })), peMax(base));

/* ============================================================ */
/* 7. A característica aparece na ficha                          */
/* ============================================================ */

const nomes = (c) => OR.caracteristicasEfetivas(c).map((x) => x.id);
t("a copiada entra com o prefixo vo_", nomes(gemeo(NATUREZA)).includes("vo_natureza_amaldicoada"), true);
t("e a Metafisica tambem", nomes(gemeo(METAFISICA)).includes("vo_existencia_metafisica"), true);
t("sem o addon nao entra", nomes(gemeo(NATUREZA, { addon: false })).includes("vo_natureza_amaldicoada"), false);
t("as do proprio Gemeo continuam la", nomes(gemeo(NATUREZA)).includes("restricao_celestial"), true);

/* ============================================================ */
/* 8. Desinstalar                                                */
/* ============================================================ */

AD.limparAddons();
t("a liberacao continua no catalogo do motor",
  AD.LIBERACOES.some((l) => l.id === "gemeosMaldicao"), true);
/* ⚠ A liberação é lida DA CRIATURA, e não do mundo aplicado: num Encontro misto
   o mundo é a união de todos, e quem não tem o pacote não pode herdar a regra. */
t("mas a criatura sem o pacote nao a tem",
  AD.liberacoesDaCriatura(gemeo(null, { addon: false })), []);
t("e a com o pacote tem", AD.liberacoesDaCriatura(gemeo(null)), ["gemeosMaldicao"]);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
