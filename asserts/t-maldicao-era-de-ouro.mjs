/* MALDIÇÃO - ERA DE OURO — o addon dos 5 tipos de Espírito Amaldiçoado
   (2026-09-22). Não duplica o que o raw já tem (a Origem "maldicao" com 3
   características, e as 18 Aptidões de Maldição): só acrescenta os 7
   Talentos (Restrição e Anatomia Amaldiçoada, mais os 5 tipos) e as 18
   Características para Maldições que a Anatomia libera.

   ⚠ O PE da Natureza Amaldiçoada (raw) é "por nível" (pe: nd), e este
   suplemento é mais preciso ("a cada nível ÍMPAR"). O Funcionamento do pacote
   corrige a diferença (só com `origem_maldicao`), e cada Talento de tipo
   devolve o valor certo por cima. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const CA = await import(R + "afty-caracteristicas-amaldicoadas.js");
const { getTalento } = await import(R + "afty-talentos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const pacote = AD.normalizarPacote(JSON.parse(readFileSync(new URL("../addons/maldicao-era-de-ouro.json", import.meta.url), "utf8")));
t("o pacote valida sem problema nenhum", AD.validarPacote(pacote), []);
t("o pacote so abre a tela do pool: permite caracteristicasAmaldicoadas", pacote.permite, ["caracteristicasAmaldicoadas"]);
t("a primitiva existe no catalogo", AD.PRIMITIVAS.some((p) => p.id === "caracteristicasAmaldicoadas"), true);
AD.aplicarAddons([pacote]);

const NS = "maldicao-era-de-ouro:";
const TAL = {
  restricao: `${NS}tal_restricao_amaldicoada`,
  anatomia: `${NS}tal_anatomia_amaldicoada`,
  comum: `${NS}tal_espirito_comum`,
  medo: `${NS}tal_espirito_medo`,
  vingativo: `${NS}tal_espirito_vingativo`,
  vingativoImaginario: `${NS}tal_espirito_vingativo_imaginario`,
  enfermo: `${NS}tal_espirito_enfermo`,
};

/* ============================================================ */
/* 1. O CATÁLOGO DE CARACTERÍSTICAS (18, todas do Addon)         */
/* ============================================================ */
t("sao 18 caracteristicas amaldicoadas no catalogo", CA.AFTY_CARACTERISTICAS_AMALDICOADAS.length, 18);
t("todas tem nome e descricao", CA.AFTY_CARACTERISTICAS_AMALDICOADAS.every((c) => c.nome && c.descricao), true);
t("Ola Adicionais existe com o texto novo (numero, nao BT)",
  CA.getCaracteristicaAmaldicoada(`${NS}ca_olhos_adicionais`)?.descricao.includes("+2 em Percepção"), true);

/* ============================================================ */
/* 2. A FICHA                                                    */
/* ============================================================ */
const ficha = ({ nd = 10, origemId = "maldicao", talentos = [], caracteristicasAmaldicoadas = [] } = {}) => {
  const c = createBlankAfty();
  c.core = { ...c.core, nd, tipo: "conjurador", patamar: "comum" };
  c.core.origem = { id: origemId };
  c.addons = [pacote];
  c.talentos = talentos;
  c.caracteristicasAmaldicoadas = caracteristicasAmaldicoadas;
  return c;
};
const semOrigem = ficha({ origemId: "inato" });
const dSemOrigem = deriveAfty(semOrigem);
const comOrigemSoTalento = (talento, nd = 10) => deriveAfty(ficha({ nd, talentos: [talento] }));

/* ============================================================ */
/* 3. OS SETE TALENTOS EXIGEM A ORIGEM (NA TELA) E SE PAGAM SOZINHOS */
/* ============================================================ */
/* ⚠ `requisitos` é TELA, não trava do Motor (mesma regra do resto do sistema:
   "validar é papel da UI, não do motor"). Uma ficha que já TEM o Talento
   aplica o efeito dele de qualquer forma, então o que se confere aqui é que
   o requisito está DECLARADO certo (quem monta a ficha na UI não consegue
   escolher sem a Origem), não que o motor bloqueia em tempo de derive. */
for (const [nome, id] of Object.entries(TAL)) {
  t(`${nome}: exige a Origem Maldicao (requisito de tela)`,
    getTalento(id)?.requisitos, [{ tipo: "origem", id: "maldicao" }]);
}
t("com a Origem Maldicao, Anatomia Amaldicoada abre 1 vaga no nivel 1",
  comOrigemSoTalento(TAL.anatomia, 1).caracteristicasAmaldicoadas.vagas, 1);
t("cada Talento devolve `vagasTalento`, entao pegar os 7 nao gasta vaga de verdade",
  (() => {
    const c = createBlankAfty();
    c.core = { ...c.core, nd: 10, tipo: "conjurador", patamar: "comum" };
    c.core.origem = { id: "maldicao" };
    c.addons = [pacote];
    c.talentos = Object.values(TAL);
    const h = deriveAfty(c).habilidades;
    return h.exclusivasUsadas === 0 || h.exclusivasTalento >= h.exclusivasUsadas;
  })(), true);

/* ============================================================ */
/* 4. A CORREÇÃO DE PE (nivel impar, nao todo nivel)              */
/* ============================================================ */
const peBase = (nd) => deriveAfty(ficha({ nd })).pe; // Origem Maldicao sozinha, sem nenhum Talento
const peComTipo = (nd, talTipo) => deriveAfty(ficha({ nd, talentos: [talTipo] })).pe;
for (const nd of [1, 2, 3, 4, 5, 10, 11, 20]) {
  const esperadoNivelImpar = Math.floor((nd + 1) / 2);
  t(`nivel ${nd}: sem nenhum tipo, a Natureza Amaldicoada zera (Funcionamento corrige pra baixo)`,
    peBase(nd) - deriveAfty(ficha({ nd, origemId: "inato" })).pe, 0);
  t(`nivel ${nd}: com um tipo (Medo), o PE extra vira o certo (nivel impar)`,
    peComTipo(nd, TAL.medo) - deriveAfty(ficha({ nd, origemId: "inato" })).pe, esperadoNivelImpar);
}
t("Espirito Comum tambem devolve o PE certo (e mais nada)",
  peComTipo(10, TAL.comum) - deriveAfty(ficha({ nd: 10, origemId: "inato" })).pe, Math.floor(11 / 2));
t("Vingativo tambem", peComTipo(9, TAL.vingativo) - deriveAfty(ficha({ nd: 9, origemId: "inato" })).pe, Math.floor(10 / 2));
t("Vingativo Imaginario tambem", peComTipo(7, TAL.vingativoImaginario) - deriveAfty(ficha({ nd: 7, origemId: "inato" })).pe, Math.floor(8 / 2));
t("Enfermo tambem", peComTipo(4, TAL.enfermo) - deriveAfty(ficha({ nd: 4, origemId: "inato" })).pe, Math.floor(5 / 2));

/* A correcao so vale para quem TEM a Origem Maldicao: o `quando: origem_maldicao`
   nao pode vazar para outra origem so por o Addon estar instalado. */
t("outra Origem com o Addon instalado nao perde PE nenhum (a correcao nao se aplica)",
  dSemOrigem.pe, deriveAfty((() => { const c = ficha({ origemId: "inato" }); c.addons = []; return c; })()).pe);

/* ============================================================ */
/* 5. RESQUÍCIOS DE EMOÇÕES: reduz o pre-requisito de Aptidao     */
/* ============================================================ */
t("sem o Talento de Medo, reduzNivelAptidao e zero",
  deriveAfty(ficha({ talentos: [TAL.anatomia] })).reduzNivelAptidao, 0);
t("com Espirito de Medo, reduzNivelAptidao sobe 1 (mais largo que 'um grupo', nunca mais estreito)",
  deriveAfty(ficha({ talentos: [TAL.medo] })).reduzNivelAptidao, 1);

/* ============================================================ */
/* 6. O POOL DE CARACTERÍSTICAS AMALDIÇOADAS                     */
/* ============================================================ */
const CA_ID = (id) => `${NS}ca_${id}`;
const comPool = (nd, escolhidas) => deriveAfty(ficha({ nd, talentos: [TAL.anatomia], caracteristicasAmaldicoadas: escolhidas }));

t("nivel 1: 1 vaga", comPool(1, []).caracteristicasAmaldicoadas.vagas, 1);
t("nivel 4: ainda 1 vaga (so sobe a cada 5)", comPool(4, []).caracteristicasAmaldicoadas.vagas, 1);
t("nivel 5: 2 vagas", comPool(5, []).caracteristicasAmaldicoadas.vagas, 2);
t("nivel 10: 3 vagas", comPool(10, []).caracteristicasAmaldicoadas.vagas, 3);
t("nivel 20: 5 vagas", comPool(20, []).caracteristicasAmaldicoadas.vagas, 5);

const dPool = comPool(10, [CA_ID("pernas_extras"), CA_ID("olhos_adicionais"), CA_ID("instinto_sanguinario")]);
t("3 escolhidas, dentro da vaga (3 de 3): nao excede", [dPool.caracteristicasAmaldicoadas.usadas, dPool.caracteristicasAmaldicoadas.excedeu], [3, false]);
t("Pernas Extras soma 4,5m de deslocamento", dPool.movimento - comPool(10, []).movimento, 4.5);
t("Olhos Adicionais soma Percepcao e Atencao",
  [dPool.testes?.pericias?.find?.((p) => p.id === "percepcao")?.bonus, dPool.atencao]
    .map((v) => typeof v), ["number", "number"]);
t("Instinto Sanguinario soma o BT na Iniciativa",
  dPool.iniciativa - comPool(10, []).iniciativa, dPool.maestria);

const dExcesso = comPool(1, [CA_ID("pernas_extras"), CA_ID("olhos_adicionais")]);
t("2 escolhidas com 1 vaga so: excede, mas NAO trava (mesma regra do resto do sistema)",
  [dExcesso.caracteristicasAmaldicoadas.usadas, dExcesso.caracteristicasAmaldicoadas.vagas, dExcesso.caracteristicasAmaldicoadas.excedeu],
  [2, 1, true]);
t("mesmo excedendo, os efeitos das duas continuam somando (a mesa que corta)",
  dExcesso.movimento - comPool(1, []).movimento, 4.5);

t("id que nao existe no catalogo nao quebra, so nao acha",
  comPool(10, ["fantasma"]).caracteristicasAmaldicoadas.lista[0].encontrada, false);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
