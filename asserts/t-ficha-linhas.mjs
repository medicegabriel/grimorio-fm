/* A LINHA DA FICHA FINAL: o que ela mostra (2026-10-03, Lote 01).

   Três consertos que este arquivo prende:
   • a CATEGORIA da Aptidão volta à linha, pelo nome curto (`tab`). Ela lia
     `.nome`, que a categoria não tem, e a marca sumia calada nas 85 Aptidões;
   • as ANATOMIAS escolhidas viram linha no grupo Origem, logo abaixo da
     característica que abre o pool, com o texto do LIVRO (`textoLivro`), e pelo
     MESMO filtro do Motor (`anatomiasEscolhidas`): a Ficha nunca mostra uma
     Anatomia que o Motor não soma;
   • as MARCAS da linha saem da linha fechada em linha estreita. Era `hidden
     sm:inline-flex` num `.afty-chip`, e o `display` do chip, fora de camada,
     vencia o `hidden`. A medida de verdade é no navegador; aqui fica a trava de
     que a armadilha não volta.

   Tudo nos DOIS sistemas: a Ficha Final é a mesma no /Afty e no /Player. */
import { readFileSync, readdirSync, statSync } from "node:fs";
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
const AN = await import(R + "afty-anatomias.js");
const FC = await import(R + "ficha/ficha-conteudo.js");

const lerPacote = (nome) => JSON.parse(readFileSync(new URL(`../addons/${nome}`, import.meta.url), "utf8"));
const YNA = A.normalizarPacote(lerPacote("yna.json"));
const ABERRACAO = A.normalizarPacote(lerPacote("aberracao-humanizada.json"));
A.aplicarAddons([YNA, ABERRACAO]);

let ok = 0;
const falhas = [];
const t = (nome, real, esperado) => {
  const a = JSON.stringify(real);
  const b = JSON.stringify(esperado);
  if (a === b) ok += 1;
  else falhas.push(`${nome}\n     esperado ${b}\n     veio     ${a}`);
};

const ficha = ({ sistema = "afty", nd = 10, origem = "feto_amaldicoado_hibrido", cla = null, anatomias = [], aptidoes = [], addons = [] } = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd, tipo: "conjurador", patamar: "comum" };
  c.core.origem = { id: origem, ...(cla ? { cla } : {}), ...(anatomias.length ? { anatomias } : {}) };
  c.aptidoesAmaldicoadas = aptidoes;
  c.addons = addons;
  return c;
};
const conteudo = (c) => FC.conteudoDaFicha(c, deriveAfty(c));
const doGrupo = (itens, grupo) => itens.filter((i) => i.grupo === grupo);
const rotulos = (i) => (i?.tags ?? []).map((m) => m.label);
const instintoNoMotor = (c) => (deriveAfty(c).efeitos?.detalhes ?? [])
  .filter((x) => x.canal === "iniciativa" && x.nome === "Instinto Sanguinário").length;

/* ============================================================ */
/* 1. A CATEGORIA DA APTIDÃO                                     */
/* ============================================================ */
t("toda Aptidão do catálogo tem categoria com nome curto (nenhuma marca some calada)",
  AP.AFTY_APTIDOES.filter((a) => !AP.getCategoriaAptidao(a.categoria)?.tab).map((a) => a.id), []);

/* A primeira Aptidão de cada categoria, para a linha ser montada pelo caminho
   de verdade (derive e depois Ficha). Requisito não atendido não tira a Aptidão
   da lista, só põe o aviso, então todas chegam. */
const umaPorCategoria = new Map();
for (const a of AP.AFTY_APTIDOES) {
  if (!umaPorCategoria.has(a.categoria)) umaPorCategoria.set(a.categoria, a.id);
}
t("as sete categorias estão cobertas abaixo",
  [...umaPorCategoria.keys()].sort(), AP.APTIDAO_CATEGORIAS.map((c) => c.id).sort());

for (const sistema of ["afty", "player"]) {
  const S = `[${sistema}]`;
  const c = ficha({ sistema, aptidoes: [...umaPorCategoria.values()] });
  const linhas = doGrupo(conteudo(c), "aptidao");
  t(`${S} a primeira marca da linha é o nome curto da categoria`,
    linhas.map((i) => [i.id, rotulos(i)[0]]),
    linhas.map((i) => [i.id, AP.getCategoriaAptidao(AP.getAptidao(i.id).categoria).tab]));
  t(`${S} e as sete chegaram à Ficha`, linhas.length, umaPorCategoria.size);
}
t("o nome é o curto, e não o longo",
  rotulos(doGrupo(conteudo(ficha({ aptidoes: [umaPorCategoria.get("especiais")] })), "aptidao")[0])[0], "Especiais");

/* ============================================================ */
/* 2. AS ANATOMIAS                                               */
/* ============================================================ */
t("as 15 Anatomias têm o texto do livro", AN.ANATOMIAS.filter((a) => !a.textoLivro).map((a) => a.id), []);
t("o texto do livro não é o resumo do criador",
  AN.ANATOMIAS.filter((a) => a.textoLivro === a.descricao).map((a) => a.id), []);
const TRAVESSAO = String.fromCharCode(0x2014);
t("nenhum texto de Anatomia tem travessão",
  AN.ANATOMIAS.filter((a) => a.textoLivro.includes(TRAVESSAO) || a.descricao.includes(TRAVESSAO)).map((a) => a.id), []);
t("um trecho conferido no livro (p. 35), letra por letra",
  AN.getAnatomia("instinto_sanguinario").textoLivro,
  "Em sua essência há um instinto por sangue e violência. Você adiciona o seu bônus de treinamento na sua Iniciativa; enquanto em uma cena de combate, você também adiciona seu bônus de treinamento na sua Atenção.");

for (const sistema of ["afty", "player"]) {
  const S = `[${sistema}]`;

  /* ---------- Feto Amaldiçoado Híbrido (o livro) ---------- */
  const feto = ficha({ sistema, anatomias: ["instinto_sanguinario", "olhos_sombrios"] });
  const origem = doGrupo(conteudo(feto), "origem");
  t(`${S} Feto: as Anatomias entram logo abaixo do Físico Amaldiçoado`,
    origem.map((i) => i.chave),
    ["origem:bonus_atributo", "origem:heranca_maldita", "origem:fisico_amaldicoado",
      "anatomia:instinto_sanguinario", "anatomia:olhos_sombrios", "origem:vigor_maldito"]);
  const olhos = origem.find((i) => i.chave === "anatomia:olhos_sombrios");
  t(`${S} Feto: a linha traz o nome e o texto do livro`,
    [olhos?.nome, olhos?.texto], ["Olhos Sombrios", AN.getAnatomia("olhos_sombrios").textoLivro]);
  t(`${S} Feto: a marca diz que é Anatomia`, rotulos(olhos), ["Anatomia"]);
  t(`${S} Feto: sem contador e sem número de mesa`, [olhos?.usos, olhos?.numeros], [null, []]);
  t(`${S} Feto: a busca acha a Anatomia pelo nome`,
    FC.filtraConteudo(conteudo(feto), "olhos sombrios").map((i) => i.chave), ["anatomia:olhos_sombrios"]);
  t(`${S} Feto: a busca acha pelo texto do livro também`,
    FC.filtraConteudo(conteudo(feto), "escuridao leve").map((i) => i.chave), ["anatomia:olhos_sombrios"]);
  t(`${S} Feto: o que a Ficha mostra é o que o Motor soma`, instintoNoMotor(feto), 1);

  t(`${S} Feto sem Anatomia escolhida: nenhuma linha a mais`,
    conteudo(ficha({ sistema })).filter((i) => i.chave.startsWith("anatomia:")).length, 0);
  t(`${S} Feto com id órfão: a linha some e a ficha abre`,
    conteudo(ficha({ sistema, anatomias: ["nao_existe", "pernas_extras"] }))
      .filter((i) => i.chave.startsWith("anatomia:")).map((i) => i.chave), ["anatomia:pernas_extras"]);

  /* ---------- Origem sem pool: os ids gravados não valem ---------- */
  const trocou = ficha({ sistema, origem: "inato", anatomias: ["instinto_sanguinario"] });
  t(`${S} origem sem pool: a Ficha não mostra a Anatomia gravada`,
    conteudo(trocou).filter((i) => i.chave.startsWith("anatomia:")).length, 0);
  t(`${S} origem sem pool: e o Motor também não soma (o mesmo filtro)`, instintoNoMotor(trocou), 0);
  t(`${S} o filtro compartilhado responde igual aos dois`,
    [O.anatomiasEscolhidas(feto), O.anatomiasEscolhidas(trocou)], [["instinto_sanguinario", "olhos_sombrios"], []]);

  /* ---------- Kitsune (addon yna.json) ---------- */
  const kitsune = ficha({ sistema, origem: "yna:kitsune", cla: "yna:linhagem_getsurin", anatomias: ["olhos_sombrios"], addons: [YNA] });
  const origemK = doGrupo(conteudo(kitsune), "origem").map((i) => i.chave);
  const iInari = origemK.indexOf("origem:heranca_de_inari");
  t(`${S} Kitsune: a Anatomia entra logo abaixo da Herança de Inari`,
    [iInari >= 0, origemK[iInari + 1]], [true, "anatomia:olhos_sombrios"]);
  t(`${S} Kitsune: o mesmo texto do livro, porque o pool é o do Feto`,
    conteudo(kitsune).find((i) => i.chave === "anatomia:olhos_sombrios")?.texto, AN.getAnatomia("olhos_sombrios").textoLivro);

  /* ---------- Aberração Humanizada (addon) ---------- */
  const aberracao = ficha({ sistema, origem: "aberracao-humanizada:aberracao_humanizada", anatomias: ["sangue_toxico"], addons: [ABERRACAO] });
  t(`${S} Aberração Humanizada: o pool do Feto também vira linha`,
    conteudo(aberracao).filter((i) => i.chave.startsWith("anatomia:")).map((i) => i.chave), ["anatomia:sangue_toxico"]);
}

/* ============================================================ */
/* 3. AS MARCAS EM LINHA ESTREITA                                */
/* ============================================================ */
/* ⚠ A ARMADILHA: `.afty-chip` declara `display` fora de camada, então qualquer
   `hidden` do Tailwind no mesmo elemento perde, sem sintoma. Esconder um chip
   tem de ser por uma classe própria no ficha.css. */
const AFTY = new URL("../src/systems/afty/", import.meta.url);
const jsx = [];
const varre = (dir) => {
  for (const nome of readdirSync(dir)) {
    const p = new URL(nome, dir);
    if (statSync(p).isDirectory()) varre(new URL(`${nome}/`, dir));
    else if (nome.endsWith(".jsx")) jsx.push(p);
  }
};
varre(AFTY);
const chipEscondidoPeloTailwind = [];
for (const p of jsx) {
  for (const m of readFileSync(p, "utf8").matchAll(/className="([^"]*)"/g)) {
    const classes = m[1].split(/\s+/);
    if (classes.includes("afty-chip") && classes.some((c) => /^([\w-]+:)*hidden$/.test(c))) {
      chipEscondidoPeloTailwind.push(`${p.pathname.split("/afty/").pop()}: ${m[1]}`);
    }
  }
}
t("nenhum .afty-chip usa o hidden do Tailwind (ele perde para o display do chip)", chipEscondidoPeloTailwind, []);

const itemDeFicha = readFileSync(new URL("ficha/ItemDeFicha.jsx", AFTY), "utf8");
t("as marcas da linha fechada levam a classe que o container esconde",
  itemDeFicha.includes('className="afty-chip afty-marca-fechada"'), true);

const css = readFileSync(new URL("ficha/ficha.css", AFTY), "utf8");
const bloco = css.match(/@container itemficha \(max-width: 560px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
t("a regra mede a LINHA (@container itemficha), e não a janela, e esconde as marcas",
  /\.afty-marca-fechada\s*\{\s*display:\s*none/.test(bloco.replace(/\.afty-mesa-fechada,\s*/, "")), true);
t("e vem DEPOIS do .afty-chip, que tem o mesmo peso",
  css.indexOf("@container itemficha (max-width: 560px)") > css.indexOf(".afty-chip {"), true);

if (falhas.length) {
  console.log(`${falhas.length} FALHA(S) de ${ok + falhas.length}:\n`);
  for (const f of falhas) console.log(` ✗ ${f}\n`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
