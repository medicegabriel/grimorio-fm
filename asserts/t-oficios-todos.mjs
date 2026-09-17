/**
 * TODOS OS OFÍCIOS NUM EFEITO SÓ, 2026-09-17
 *
 * Autor: *"Coloque também no Motor de Automação em Perícia algo para selecionar
 * TODOS OS OFÍCIOS. Preciso fazer uma Habilidade que me dá bônus em OFÍCIO de
 * forma geral, e preciso selecionar um por um."*
 *
 * O alvo `oficio:todos` é escopo, igual ao `atr:destreza`. O que este arquivo
 * prende é o que some calado: uma linha de Ofício repetida que fica sem o bônus,
 * uma perícia que não é Ofício que ganha o bônus junto, e um hover que mostra o
 * total sem dizer de onde ele veio.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const P = await import(R + "afty-pericias.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ficha = (efeitos, extra = {}) => {
  const f = createBlankAfty();
  return {
    ...f,
    core: { ...f.core, nd: 10, tipo: "misto", patamar: "comum", tecnicaEfeitos: efeitos },
    attributes: { forca: 12, destreza: 12, constituicao: 12, inteligencia: 16, sabedoria: 12, presenca: 12 },
    periciasOficiosExtras: ["oficio__2", "oficio__3"],
    ...extra,
  };
};
const porId = (f) => Object.fromEntries(deriveAfty(f).testes.pericias.map((p) => [p.id, p]));

t("o alvo é escopo, e não id de perícia", P.ehPericiaOficio(P.ALVO_TODOS_OFICIOS), false);

for (const sistema of ["afty", "player"]) {
  const sem = porId(ficha([], { rulesVersion: sistema }));
  const com = porId(ficha([{ canal: "bonusPericia", alvo: P.ALVO_TODOS_OFICIOS, expr: "3" }], { rulesVersion: sistema }));

  const oficios = Object.keys(com).filter((id) => P.ehPericiaOficio(id));
  t(`[${sistema}] a ficha tem as três linhas de Ofício`, oficios.sort(), ["oficio", "oficio__2", "oficio__3"]);
  for (const id of oficios) {
    t(`[${sistema}] ${id} ganha +3`, com[id].bonus - sem[id].bonus, 3);
    // A parcela nova, e não a do atributo (Inteligência 16 também dá +3).
    const rotulos = new Set(sem[id].partes.map((p) => p.label));
    t(`[${sistema}] ${id} mostra a fonte no hover`,
      com[id].partes.filter((p) => !rotulos.has(p.label)).map((p) => p.valor), [3]);
  }
  const outras = Object.keys(com).filter((id) => !P.ehPericiaOficio(id));
  t(`[${sistema}] nenhuma outra perícia muda`,
    outras.filter((id) => com[id].bonus !== sem[id].bonus), []);

  /* O efeito que mira UM Ofício continua só nele, e os dois somam. */
  const umSo = porId(ficha([
    { canal: "bonusPericia", alvo: "oficio__2", expr: "1" },
    { canal: "bonusPericia", alvo: P.ALVO_TODOS_OFICIOS, expr: "3" },
  ], { rulesVersion: sistema }));
  t(`[${sistema}] Ofício mirado soma com o de todos`, umSo.oficio__2.bonus - sem.oficio__2.bonus, 4);
  t(`[${sistema}] o Ofício do livro fica só com o de todos`, umSo.oficio.bonus - sem.oficio.bonus, 3);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
