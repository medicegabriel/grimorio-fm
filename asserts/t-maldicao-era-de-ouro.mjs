/* MALDIÇÃO - ERA DE OURO v2 (2026-09-22): virou ORIGEM PRÓPRIA que se divide em
   Tipo, como o Herdado se divide em Clã. A v1 (7 Talentos soltos) tinha um
   problema real: o jogador tinha de ACHAR os Talentos numa lista de dezenas,
   sem nenhum seletor dedicado, e o autor pediu para mover tudo para a aba de
   escolher Origem.

   ⚠ POR QUE UMA ORIGEM NOVA, E NÃO A `maldicao` DO RAW REMENDADA: assim ela
   tem nome e Tipos próprios e some do seletor de quem não instala o Addon.
   `variacaoDe: "maldicao"` (mais `VARIACOES_ACEITAS` em afty-origens.js) faz
   `origemMae()` resolver para "maldicao" em toda pergunta estrutural, e é
   assim que as 18 Aptidões de Maldição do raw (`APTIDAO_CATEGORIAS`, categoria
   travada em `origemId: "maldicao"`) e qualquer Talento com
   `requisitos: [{tipo:"origem", id:"maldicao"}]` continuam alcançáveis.

   ⚠ O MURO NOVO, e como este addon o resolve: `getCla()` só conhecia
   `CLAS_HERDADO`. Uma origem de Addon que se divide declara os Tipos em DOIS
   lugares (`acrescenta.origens[].clas`, que a TELA lê para desenhar os
   botões, e `acrescenta.clas`, que entra em `CLAS_HERDADO` de verdade e é o
   que `getCla()` acha primeiro) com o MESMO id nos dois, e `afty-origens.js`
   ganhou `caminhosDeId: ["clas[].id"]` na família `origens` para o id nested
   ganhar o mesmo prefixo do pacote que o id do topo ganha, e os dois baterem.
   `getCla()` também ganhou uma segunda busca (varrer `origem.clas` de
   qualquer origem) como rede de segurança. */
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
const O = await import(R + "afty-origens.js");

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
const ORIGEM_ID = `${NS}maldicao_era_de_ouro`;
const TIPO = {
  comum: `${NS}tipo_comum`,
  medo: `${NS}tipo_medo`,
  vingativo: `${NS}tipo_vingativo`,
  vingativoImaginario: `${NS}tipo_vingativo_imaginario`,
  enfermo: `${NS}tipo_enfermo`,
};

/* ============================================================ */
/* 1. A ORIGEM E O MURO DO getCla                                */
/* ============================================================ */
const origem = O.getOrigem(ORIGEM_ID);
t("a origem existe, com o namespace do pacote", !!origem, true);
t("e diz de qual origem do raw ela varia", origem?.variacaoDe, "maldicao");
t("origemMae resolve para a origem do raw (destrava Aptidao de Maldicao e Talentos de Origem)",
  O.origemMae(ORIGEM_ID), "maldicao");
t("a origem tem 5 Tipos, na ordem do livro",
  O.clasDaOrigem(ORIGEM_ID)?.map((c) => c.id),
  [TIPO.comum, TIPO.medo, TIPO.vingativo, TIPO.vingativoImaginario, TIPO.enfermo]);

for (const [nome, id] of Object.entries(TIPO)) {
  const cla = O.getCla(id);
  t(`getCla acha o Tipo ${nome} de verdade (com caracteristicas, nao so o stub do picker)`,
    [!!cla, Array.isArray(cla?.caracteristicas) && cla.caracteristicas.length > 0], [true, true]);
}
t("o rotulo do seletor e Tipo, nao Cla (e o artigo e 'um')", [origem?.clasRotulo, origem?.clasArtigo], ["Tipo", "um"]);

/* ============================================================ */
/* 2. A FICHA                                                    */
/* ============================================================ */
const ficha = ({ nd = 10, origemId = ORIGEM_ID, cla = null, caracteristicasAmaldicoadas = [] } = {}) => {
  const c = createBlankAfty();
  c.core = { ...c.core, nd, tipo: "conjurador", patamar: "comum" };
  c.core.origem = { id: origemId, ...(cla ? { cla } : {}) };
  c.addons = [pacote];
  c.caracteristicasAmaldicoadas = caracteristicasAmaldicoadas;
  return c;
};
const outraOrigem = () => deriveAfty(ficha({ origemId: "inato" }));

/* ============================================================ */
/* 3. A ORIGEM INTEIRA VALE MESMO SEM ESCOLHER TIPO               */
/* ============================================================ */
/* Nada aqui e doCla: Bonus em Atributo, Natureza, Restricao e Anatomia sao da
   ORIGEM, e so a caracteristica exclusiva de cada Tipo fica no cla. */
for (const nd of [1, 2, 3, 4, 5, 10, 11, 20]) {
  const d = deriveAfty(ficha({ nd }));
  const base = deriveAfty(ficha({ nd, origemId: "inato" }));
  t(`nivel ${nd}, sem Tipo: PE ja e o certo (nivel impar), so por ter a Origem`,
    d.pe - base.pe, Math.floor((nd + 1) / 2));
}
const dSemTipo = deriveAfty(ficha({ nd: 20 }));
t("sem Tipo: vagasAptidao 1 + (10) + (15), no nd 20 vale 3",
  dSemTipo.totalAptidoesAmaldicoadas - outraOrigem().totalAptidoesAmaldicoadas, 3);
t("sem Tipo: vaga de Caracteristica Amaldicoada ja abre (Anatomia e da Origem)",
  dSemTipo.caracteristicasAmaldicoadas.vagas, 1 + Math.floor(20 / 5));
t("sem Tipo: Bonus em Atributo (distribuir 4, max 3) ja esta na lista de caracteristicas efetivas",
  O.caracteristicasEfetivas(ficha({ nd: 1 })).some((c) => c.bonus?.distribuir === 4 && c.bonus?.maxPorAtributo === 3), true);
t("sem Tipo: reduzNivelAptidao continua zero (e so do Tipo De Medo)",
  dSemTipo.reduzNivelAptidao, 0);

/* ============================================================ */
/* 4. ESCOLHER UM TIPO                                            */
/* ============================================================ */
const dComum = deriveAfty(ficha({ nd: 10, cla: TIPO.comum }));
const dSemTipoNd10 = deriveAfty(ficha({ nd: 10 }));
t("Tipo Comum nao soma PE nem vaga a mais (e so identidade, mesmo total da Origem sozinha)",
  [dComum.pe, dComum.totalAptidoesAmaldicoadas], [dSemTipoNd10.pe, dSemTipoNd10.totalAptidoesAmaldicoadas]);

t("sem o Tipo De Medo, reduzNivelAptidao e zero", dSemTipoNd10.reduzNivelAptidao, 0);
const dMedo = deriveAfty(ficha({ nd: 10, cla: TIPO.medo }));
t("com o Tipo De Medo, reduzNivelAptidao sobe 1 (mais largo que 'um grupo', nunca mais estreito)",
  dMedo.reduzNivelAptidao, 1);
t("e o PE do Tipo De Medo continua o da Origem (a caracteristica dele nao mexe em PE)",
  dMedo.pe, dSemTipoNd10.pe);

for (const [nome, id] of Object.entries(TIPO)) {
  t(`Tipo ${nome}: a ficha crua guarda o id certo em core.origem.cla`, ficha({ cla: id }).core.origem.cla, id);
  // Escolher o Tipo nao quebra o derive (todo mundo deriva sem excecao).
  t(`Tipo ${nome}: deriva sem excecao`, typeof deriveAfty(ficha({ nd: 7, cla: id })).pe, "number");
}

/* ============================================================ */
/* 5. O POOL DE CARACTERÍSTICAS AMALDIÇOADAS (18, sem mudanca)   */
/* ============================================================ */
t("sao 18 caracteristicas amaldicoadas no catalogo", CA.AFTY_CARACTERISTICAS_AMALDICOADAS.length, 18);
t("todas tem nome e descricao", CA.AFTY_CARACTERISTICAS_AMALDICOADAS.every((c) => c.nome && c.descricao), true);

const CA_ID = (id) => `${NS}ca_${id}`;
const comPool = (nd, escolhidas) => deriveAfty(ficha({ nd, caracteristicasAmaldicoadas: escolhidas }));

t("nivel 1: 1 vaga", comPool(1, []).caracteristicasAmaldicoadas.vagas, 1);
t("nivel 4: ainda 1 vaga (so sobe a cada 5)", comPool(4, []).caracteristicasAmaldicoadas.vagas, 1);
t("nivel 5: 2 vagas", comPool(5, []).caracteristicasAmaldicoadas.vagas, 2);
t("nivel 20: 5 vagas", comPool(20, []).caracteristicasAmaldicoadas.vagas, 5);

const dCarac = comPool(10, [CA_ID("pernas_extras"), CA_ID("olhos_adicionais"), CA_ID("instinto_sanguinario")]);
t("3 escolhidas, dentro da vaga (3 de 3): nao excede",
  [dCarac.caracteristicasAmaldicoadas.usadas, dCarac.caracteristicasAmaldicoadas.excedeu], [3, false]);
t("Pernas Extras soma 4,5m de deslocamento", dCarac.movimento - comPool(10, []).movimento, 4.5);
t("Instinto Sanguinario soma o BT na Iniciativa", dCarac.iniciativa - comPool(10, []).iniciativa, dCarac.maestria);

const dExcesso = comPool(1, [CA_ID("pernas_extras"), CA_ID("olhos_adicionais")]);
t("2 escolhidas com 1 vaga so: excede, mas NAO trava (mesma regra do resto do sistema)",
  [dExcesso.caracteristicasAmaldicoadas.usadas, dExcesso.caracteristicasAmaldicoadas.vagas, dExcesso.caracteristicasAmaldicoadas.excedeu],
  [2, 1, true]);
t("mesmo excedendo, os efeitos das duas continuam somando (a mesa que corta)",
  dExcesso.movimento - comPool(1, []).movimento, 4.5);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
