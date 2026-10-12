/* REVISÃO CMB-02 (2026-10-07): Atroz e Penetrante só onde há ataque.

   Página 65: "Quando realizar um ataque, ou arte do combate que envolva um
   ataque". Atroz (+1 dado) e Penetrante (ignora RD de metade do nível) não
   declaravam alvo, e todo efeito sem alvo cai em todo Feitiço de dano,
   inclusive no resolvido por TR, que não tem ataque. Isso é errado em qualquer
   leitura. O alvo agora é arma, Ataque Básico e Feitiço com jogada de ataque,
   que conserva o comportamento de antes onde a regra ainda espera o autor
   (Golpe em Feitiço, docs/a-fazer.md). */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const FE = await import(R + "afty-feiticos.js");
const { createBlankAfty } = await import(R + "afty-schema.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ARMA = "arm_espada_curta";
const ficha = (sistema, nivel, resolucao, marcas = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: nivel, tipo: "combatente", patamar: "comum" };
  f.especializacoes = [{ id: "combatente", nivel }];
  f.habilidades = ["cmb_golpe_especial"];
  f.attributes = { forca: 16, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 14, presenca: 10 };
  f.equipamentos = { itens: [{ id: "e0", tipo: "arma", refId: ARMA, qtd: 1, equipado: true }] };
  f.feiticos = [{ ...FE.createBlankFeitico(), id: "fx", nome: "Raio", tipo: "dano", nivel: 1, resolucao }];
  f.combate = { ativo: true, ...marcas };
  return f;
};
const feitico = (d) => d.feiticos.lista.find((x) => x.id === "fx").rolagens[0];
const linhaArma = (d) => d.dano.entradas.find((x) => x.id === ARMA);

for (const sistema of ["player", "afty"]) {
  for (const nivel of [4, 8, 12]) {
    const semTr = deriveAfty(ficha(sistema, nivel, "tr"));
    const comTr = deriveAfty(ficha(sistema, nivel, "tr", { golpeAtroz: true, golpePenetrante: true }));
    t(`(${sistema} ${nivel}) Atroz NÃO soma dado no Feitiço de TR`, feitico(comTr).dados, feitico(semTr).dados);
    t(`(${sistema} ${nivel}) e não aparece no hover dele`,
      feitico(comTr).partes.map((p) => p.label).filter((l) => /Golpe/.test(l)), []);
    t(`(${sistema} ${nivel}) Penetrante NÃO entra no Feitiço de TR`, feitico(comTr).ignoraRD ?? 0, feitico(semTr).ignoraRD ?? 0);

    const semAt = deriveAfty(ficha(sistema, nivel, "ataque"));
    const comAt = deriveAfty(ficha(sistema, nivel, "ataque", { golpeAtroz: true, golpePenetrante: true }));
    t(`(${sistema} ${nivel}) no Feitiço de ATAQUE o Atroz continua (pergunta aberta)`, feitico(comAt).dados - feitico(semAt).dados, 1);

    t(`(${sistema} ${nivel}) na arma o Atroz soma 1 dado`, linhaArma(comTr).dados - linhaArma(semTr).dados, 1);
    t(`(${sistema} ${nivel}) e o Penetrante ignora metade do nível`, linhaArma(comTr).ignoraRD - linhaArma(semTr).ignoraRD, Math.floor(nivel / 2));
  }
}

/* ============================================================ */
/* Preciso: "Recebe vantagem no ataque."                         */
/* ============================================================ */
/* A marca era só custo: a rolagem do Acerto seguia o modo escolhido à mão.
   Agora Preciso é estado de bancada como Atroz, emite `vantagemAtaque` na linha
   de arma e de Ataque Básico, e a preparação da rolagem combina o modo à mão, o
   do Motor e o da arma pela regra da página 282: vantagem e desvantagem não
   acumulam, e uma de cada se anulam. */
const S = await import(R + "ficha/ficha-sessao.js");
const PA = await import(R + "afty-propriedades-armas.js");
for (const sistema of ["player", "afty"]) {
  const sem = deriveAfty(ficha(sistema, 8, "tr"));
  const marcada = S.marcaPropriedadeGolpe({ combate: { ativo: true } }, "preciso", true);
  t(`(${sistema}) marcar Preciso liga o estado de bancada`, marcada.combate.golpePreciso, true);
  const com = deriveAfty(ficha(sistema, 8, "tr", { golpePreciso: true }));
  t(`(${sistema}) sem Preciso a arma não tem vantagem do Motor`, !!linhaArma(sem).vantagemAtaque?.vantagem, false);
  t(`(${sistema}) com Preciso a linha da arma tem vantagem`, linhaArma(com).vantagemAtaque?.vantagem, true);
  t(`(${sistema}) e o Ataque Básico também`, com.dano.entradas.find((x) => x.id === "basico")?.vantagemAtaque?.vantagem, true);
  t(`(${sistema}) a fonte nomeia o Golpe`, (linhaArma(com).vantagemAtaque?.fontes ?? []).length > 0, true);
  const desc = { tipo: "teste", rotulo: "Acerto", bonus: 5, linhaArma: linhaArma(com) };
  t(`(${sistema}) a rolagem com o modo normal sai com vantagem`, PA.preparaRolagemArma(desc, "normal").modo, "vantagem");
  t(`(${sistema}) desvantagem à mão anula a vantagem do Preciso`, PA.preparaRolagemArma(desc, "desvantagem").modo, "normal");
  t(`(${sistema}) vantagem à mão não vira duas`, PA.preparaRolagemArma(desc, "vantagem").modo, "vantagem");
  t(`(${sistema}) sem Preciso o modo à mão manda`,
    PA.preparaRolagemArma({ ...desc, linhaArma: linhaArma(sem) }, "normal").modo, "normal");
  t(`(${sistema}) o Encontro chama sem modo e recebe a vantagem`, PA.preparaRolagemArma(desc).modo, "vantagem");
}
t("a regra de combinar: vantagem e desvantagem se anulam",
  [PA.modoCombinado("normal", { vantagem: true, desvantagem: true }), PA.modoCombinado("vantagem", { desvantagem: true }),
    PA.modoCombinado("normal", { desvantagem: true }), PA.modoCombinado("desvantagem", { desvantagem: true })],
  ["normal", "normal", "desvantagem", "desvantagem"]);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
