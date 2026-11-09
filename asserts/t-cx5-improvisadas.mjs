/**
 * CX5: ARMAS IMPROVISADAS E FONTES EXTERNAS (Livro p.325 e p.326).
 * As duas tabelas conferidas contra o Livro, as contas do texto, e a garantia de que a arma improvisada NÃO entrou no seletor
 * da Técnica Marcial (decisão do autor, docs/afty-tecnicas-marciais.md item 17).
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AI = await import(R + "afty-armas-improvisadas.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

t("as cinco categorias da p.325 com dano e Força", AI.ARMAS_IMPROVISADAS.map((a) => [a.nome, `${a.dano.dados}d${a.dano.faces}`, a.forca, a.exemplo]), [
  ["Minúscula", "1d4", 4, "Um lápis"], ["Pequena", "1d6", 8, "Cadeira"], ["Média", "1d10", 14, "Armário"], ["Grande", "3d8", 20, "Carro"], ["Enorme", "4d12", 26, "Ônibus"],
]);
t("as cinco linhas da p.326", AI.FONTES_EXTERNAS.map((f) => `${f.dano.dados}d${f.dano.faces}`), ["1d10", "2d10", "4d10", "10d10", "20d10"]);
t("o padrão é Pequeno ou menor", AI.TAMANHO_MAXIMO_PADRAO, "pequena");

const cadeira = AI.danoDaArmaImprovisada({ tamanho: "pequena", modForca: 3, forca: 16 });
t("cadeira com +3 de Força: 1d6 + 3", [cadeira.texto, cadeira.dados, cadeira.faces, cadeira.fixo], ["1d6 + 3", 1, 6, 3]);
t("Força 16 maneja a cadeira (exige 8)", [cadeira.forcaNecessaria, cadeira.abaixoDaForca, cadeira.acimaDoPadrao], [8, false, false]);
t("o modificador negativo também soma", AI.danoDaArmaImprovisada({ tamanho: "minuscula", modForca: -2 }).texto, "1d4 - 2");
t("sem modificador não escreve fixo", AI.danoDaArmaImprovisada({ tamanho: "media" }).texto, "1d10");
const carro = AI.danoDaArmaImprovisada({ tamanho: "grande", modForca: 5, forca: 12 });
t("carro com Força 12: 3d8 + 5, abaixo da Força 20 e acima do tamanho padrão", [carro.texto, carro.abaixoDaForca, carro.acimaDoPadrao], ["3d8 + 5", true, true]);
t("Força 20 maneja o carro", AI.danoDaArmaImprovisada({ tamanho: "grande", forca: 20 }).abaixoDaForca, false);
t("o Narrador sobe uma categoria (armário muito pesado dá dano de objeto grande)", AI.danoDaArmaImprovisada({ tamanho: "media", ajuste: 1 }).texto, "3d8");
t("e desce uma", AI.danoDaArmaImprovisada({ tamanho: "media", ajuste: -1 }).texto, "1d6");
t("preso às pontas da tabela", [AI.tamanhoAjustado("minuscula", -5).id, AI.tamanhoAjustado("enorme", 5).id], ["minuscula", "enorme"]);
t("tamanho desconhecido", [AI.danoDaArmaImprovisada({ tamanho: "gigante" }), AI.tamanhoAjustado("x")], [null, null]);
t("a arma recebe o dano que você causou", [AI.danoNaArma(9), AI.danoNaArma(-4), AI.danoNaArma("x")], [9, 0, 0]);

// A Técnica Marcial segue sem arma improvisada (decisão do autor). Conferência de superfície: o texto da derivação não a menciona.
for (const sistema of ["player", "afty"]) {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum", origem: { id: "inato" } };
  f.especializacoes = [{ id: "restringido", nivel: 10 }];
  const d = deriveAfty(f);
  const texto = JSON.stringify(d.tecnicasMarciais ?? {}).toLowerCase();
  t(`${sistema}: a derivação da Técnica Marcial segue sem arma improvisada`, texto.includes("improvisad"), false);
}

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
