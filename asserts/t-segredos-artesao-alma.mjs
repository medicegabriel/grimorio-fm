/* O ADDON `segredos-do-artesao-da-alma` (2026-10-25).

   Um Talento Geral com texto do autor (não está no livro): soma o BT no TR de
   Integridade, dá 5 de RD a Dano na Alma, e libera o reparo do núcleo de um
   Corpo Amaldiçoado Mutante, que é de mesa e não tem automação. Pede Nível 10 e
   Treinado em Integridade. Este arquivo prende:

     1. O pacote valida, o Talento é Geral e o texto é o do autor.
     2. O requisito: só abre com Nível 10 E Integridade treinada, e conta o TR
        que vem de fora (o Alma Inquebrável serve).
     3. ⚠ O número: o bônus de Integridade sobe EXATAMENTE o BT, nos dois
        sistemas, e nenhum outro TR se mexe.
     4. A RD a Dano na Alma sobe 5 e ACUMULA com a do Alma Inquebrável.
     5. Sem o Talento, ou sem o addon, nada muda. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const TAL = await import(R + "afty-talentos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. O PACOTE                                                   */
/* ============================================================ */
const bruto = JSON.parse(readFileSync(new URL("../addons/segredos-do-artesao-da-alma.json", import.meta.url), "utf8"));
const PACOTE = AD.normalizarPacote(bruto);
t("o pacote valida sem problema nenhum", AD.validarPacote(PACOTE), []);
t("o pacote só acrescenta um Talento", Object.keys(bruto.acrescenta), ["talentos"]);
t("texto de tela sem travessão nem ponto e vírgula",
  new RegExp(`[${String.fromCharCode(0x2014)};]`).test(JSON.stringify(bruto)), false);

const ID = "segredos-do-artesao-da-alma:tal_segredos_do_artesao_da_alma";
AD.aplicarAddons([PACOTE]);
const talento = TAL.getTalento(ID);
t("o Talento existe, Geral, com o nome do autor", [talento?.nome, talento?.grupo], ["Segredos do Artesão da Alma", "geral"]);
t("o texto é o do autor, inteiro",
  talento?.descricao.startsWith("Se aventurando por conhecimentos proibidos, você desvenda uma parte considerável dos segredos da alma")
  && talento.descricao.endsWith("2 para cada dia que se passou desde que o núcleo foi destruído."), true);
t("e traz os números do texto", ["recebe seu BT em Integridade", "5 de RD a dano na alma", "20 + nível do corpo amaldiçoado mutante"]
  .map((trecho) => talento.descricao.includes(trecho)), [true, true, true]);

/* ============================================================ */
/* 2. O REQUISITO                                                */
/* ============================================================ */
const passa = (o) => TAL.avaliarAcessoTalento(TAL.getTalento(ID), { nd: o.nd, attrEff: {}, resistenciaProf: o.tr ?? {} });
t("Nível 10 e Integridade treinada abre", passa({ nd: 10, tr: { integridade: "treinado" } }).ok, true);
t("Integridade mestre também serve", passa({ nd: 10, tr: { integridade: "mestre" } }).ok, true);
t("Nível 9 não abre", passa({ nd: 9, tr: { integridade: "treinado" } }).ok, false);
t("sem treino em Integridade não abre", passa({ nd: 10 }).ok, false);
t("treino em outro TR não serve", passa({ nd: 10, tr: { vontade: "treinado" } }).ok, false);
t("os dois requisitos aparecem no card",
  passa({ nd: 10 }).extras.map((e) => e.label), ["Nível 10", "Treinado em Integridade"]);

/* ============================================================ */
/* A FICHA DE PROVA                                              */
/* ============================================================ */
const ficha = ({ sistema = "player", nd = 12, addon = true, talentos = [], tr = {} } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd, tipo: "misto", patamar: "comum" };
  f.attributes = { forca: 12, destreza: 12, constituicao: 16, inteligencia: 12, sabedoria: 12, presenca: 12 };
  f.especializacoes = [{ id: "lutador", nivel: nd }];
  f.resistenciasProf = tr;
  f.talentos = talentos;
  f.addons = addon ? [PACOTE] : [];
  AD.aplicarAddons(f.addons);
  return deriveAfty(f);
};
const linha = (d, id) => d.testes.resistencias.find((r) => r.value === id);

/* ============================================================ */
/* 3. O NÚMERO                                                   */
/* ============================================================ */
for (const sistema of ["player", "afty"]) {
  const sem = ficha({ sistema, tr: { integridade: "treinado" } });
  const com = ficha({ sistema, tr: { integridade: "treinado" }, talentos: [ID] });
  const bt = com.maestria;
  t(`${sistema}: o BT é positivo`, bt > 0, true);
  t(`${sistema}: Integridade sobe exatamente o BT`, linha(com, "integridade").bonus - linha(sem, "integridade").bonus, bt);
  t(`${sistema}: e o hover diz de onde veio`,
    linha(com, "integridade").partes.some((p) => p.label === "Segredos do Artesão da Alma" && p.valor === bt), true);
  t(`${sistema}: nenhum outro TR muda`,
    ["reflexos", "fortitude", "vontade", "astucia"].map((id) => linha(com, id).bonus), ["reflexos", "fortitude", "vontade", "astucia"].map((id) => linha(sem, id).bonus));
  t(`${sistema}: nem as perícias`, com.testes.pericias.map((p) => p.bonus), sem.testes.pericias.map((p) => p.bonus));
  t(`${sistema}: a RD a Dano na Alma sobe 5`, com.rdAlma - sem.rdAlma, 5);
  /* O Alma Inquebrável soma a RD de 1/4 do nível, e os dois acumulam. */
  const dois = ficha({ sistema, talentos: [ID, "tal_alma_inquebravel"] });
  const so = ficha({ sistema, talentos: ["tal_alma_inquebravel"] });
  t(`${sistema}: acumula com a RD do Alma Inquebrável`, [so.rdAlma, dois.rdAlma - so.rdAlma], [3, 5]);
}

/* ============================================================ */
/* 5. SEM O TALENTO OU SEM O ADDON NADA MUDA                     */
/* ============================================================ */
{
  const base = ficha({ addon: false });
  const soAddon = ficha();
  t("o addon instalado sem o Talento escolhido não muda nada",
    [soAddon.rdAlma, linha(soAddon, "integridade").bonus], [base.rdAlma, linha(base, "integridade").bonus]);
  AD.aplicarAddons([]);
  t("sem o addon o Talento não existe", TAL.getTalento(ID), null);
}

AD.aplicarAddons([]);

console.log(bad.length ? bad.join("\n") : "");
if (bad.length) {
  console.log(`${bad.length} FALHARAM, ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
