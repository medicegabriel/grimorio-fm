/* A SESSÃO NOVA NASCE COM OS ADDONS DA FICHA (2026-11-21).

   O defeito: a Ficha (G2 e Clássica) e o Encontro montavam a sessão nova com um
   `deriveAfty(ficha)` cru, sem aplicar antes os addons DAQUELA ficha. Os máximos
   da sessão (PV, PE e a Alma) saíam do catálogo que estivesse no ar. Na Guilda a
   Alma Livre faz da Alma uma pilha igual ao PV, então todo PV que vinha de addon
   virava "Dano na Alma" que o Descansar não devolvia. Caso que pegou: a prévia do
   Sun Wukong, com o Desenvolvimento Físico da Maldição Era de Ouro em
   Constituição, abria com 1872 de PV contra 2184 do `deriveAfty`.

   Este arquivo prende as duas metades:
     • a conta: sessão montada pelo `comAddons` não tem Dano na Alma, e a montada
       sem os addons tem (é o que mostra que o caminho importa);
     • os três pontos de montagem (G2, Clássica e Encontro) aplicam os addons da
       ficha antes do derive. O gancho é de React e não roda aqui, por isso a
       trava é no texto do código. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

// A sessão lê e grava no localStorage. Um mapa em memória basta, e nada sai do processo.
const memoria = new Map();
globalThis.localStorage = {
  getItem: (k) => (memoria.has(k) ? memoria.get(k) : null),
  setItem: (k, v) => memoria.set(k, String(v)),
  removeItem: (k) => memoria.delete(k),
  key: (i) => [...memoria.keys()][i] ?? null,
  get length() { return memoria.size; },
  clear: () => memoria.clear(),
};

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const C = await import(R + "afty-addons-compostos.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { comAddons } = await import(R + "ficha/efeitos/ponte.js");
const { prepararCalculo } = await import(R + "ficha/efeitos/recebidos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const NS = "maldicao-era-de-ouro:";
let seq = 0;
/* Uma ficha da Guilda cujo PV depende de addon: a Constituição sobe 4 pelo
   Desenvolvimento Físico, que só existe com o pacote nativo Maldição Era de Ouro. */
const fichaDaGuilda = (rulesVersion) => {
  const c = createBlankAfty();
  c.rulesVersion = rulesVersion;
  c.id = `t-sessao-montagem-${++seq}`;
  c.mesa = "eradeouro";
  c.core = { ...c.core, tipo: "combatente", patamar: "calamidade", nd: 26, origem: { id: `${NS}maldicao_era_de_ouro` } };
  c.attributes = { ...c.attributes, constituicao: 14 };
  c.caracteristicasAmaldicoadas = [`${NS}ca_desenvolvimento_fisico`];
  c.caracteristicasAmaldicoadasAlvos = { [`${NS}ca_desenvolvimento_fisico`]: { atributo: "constituicao" } };
  return C.hidratarFicha(c);
};
const danoNaAlma = (d) => (d.partes?.hp ?? []).filter((p) => p.label === "Dano na Alma").map((p) => p.valor);

for (const sistema of ["afty", "player"]) {
  /* 1. O caminho de hoje: os addons da ficha no ar antes do derive da montagem. */
  const ficha = fichaDaGuilda(sistema);
  const montagem = comAddons(ficha, () => deriveAfty(ficha));
  const sessao = S.carregarSessao(ficha.id, montagem);
  const calculo = prepararCalculo(ficha, sessao).derived;
  t(`${sistema}: o Desenvolvimento Fisico chega na montagem (Constituicao acima dos 14 da base)`, montagem.attrEff.constituicao > 14, true);
  t(`${sistema}: com os addons na montagem, a Ficha mostra o PV do derive`, calculo.hp, montagem.hp);
  t(`${sistema}: com os addons na montagem, sem Dano na Alma`, danoNaAlma(calculo), []);

  /* 2. O caminho antigo: a montagem com o catálogo cru. É o que mostra que a
     ordem importa, e por isso o teste 1 não passa por acaso. */
  const crua = fichaDaGuilda(sistema);
  AD.aplicarAddons([]);
  const montagemCrua = deriveAfty(crua);
  const sessaoCrua = S.carregarSessao(crua.id, montagemCrua);
  const calculoCrua = prepararCalculo(crua, sessaoCrua).derived;
  t(`${sistema}: sem os addons a montagem perde o +4 de Constituicao`, montagemCrua.attrEff.constituicao, 14);
  if (sistema === "afty") {
    t("afty: sem os addons a sessao nasce com Alma menor que a do calculo", sessaoCrua.almaAtual < calculo.almaMax, true);
    t("afty: e a Ficha mostrava o PV a menos como Dano na Alma", danoNaAlma(calculoCrua).length, 1);
  }
}

/* 3. Os três pontos de montagem aplicam os addons da ficha antes do derive. */
const fonte = (caminho) => readFileSync(new URL(`../src/systems/afty/${caminho}`, import.meta.url), "utf8");
const g2 = fonte("ficha/AftyFichaG2.jsx");
t("G2: a montagem da sessao passa pelo comAddons",
  /useSessaoDaLoja\(alvoId, \(\) => comAddons\(ficha, \(\) => deriveAfty\(ficha\)\)/.test(g2), true);
const classica = fonte("ficha/AftyFichaClassica.jsx");
t("Classica: a montagem da sessao aplica os addons antes do derive",
  /useSessaoDaLoja\(alvoId, \(\) => \{\s*aplicarAddons\(addonsEmDiaDaFicha\(ficha\)\);\s*return deriveAfty\(ficha\);/.test(classica), true);
const encontro = fonte("encontros/usar-encontro.js");
t("Encontro: o derive inicial da sessao aplica os addons",
  /aplicarAddons\(unirAddons\(\[f\]\)\.pacotes\), deriveAfty\(f\)/.test(encontro), true);
t("Encontro: o combatente novo aplica os addons antes do derive",
  /aplicarAddons\(unirAddons\(\[ficha\]\)\.pacotes\); derived = deriveAfty\(ficha\)/.test(encontro), true);
t("Encontro: nenhum derive cru de montagem sobrou", /f \? deriveAfty\(f\) : null/.test(encontro), false);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exit(bad.length ? 1 : 0);
