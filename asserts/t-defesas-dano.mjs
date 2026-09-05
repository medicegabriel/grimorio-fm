/* DEFESAS POR TIPO DE DANO — Imunidade, Resistência, RD, Vulnerabilidade.

   A aba nasceu em 2026-09-02, a pedido do autor, e fechou a metade que faltava
   da pendência de 2026-08-31: o motor não sabia mirar um tipo de dano, e a ficha
   não tinha onde mostrar "RD 6 contra Queimante".

   O que este arquivo mede, em ordem:

     1. AS DUAS ENTRADAS. A ficha (a aba) e o Motor (os quatro canais novos), e
        as duas chegam na mesma linha.

     2. ⚠ A RD EFETIVA JUNTA QUATRO PARCELAS, e não só o canal novo. A RD Geral
        alcança todo tipo MENOS alma, a Física soma nos três físicos e a da Alma
        só existe para o dano na alma. Mostrar só o `rdTipo` daria um número
        menor que o verdadeiro, justo na tela feita para consultá-lo.

     3. ⚠ O CONFLITO NÃO É RESOLVIDO, E ISSO É O COMPORTAMENTO ESPERADO. Dois
        estados no mesmo tipo levantam AVISO e os dois continuam na lista. A
        regra de desempate é do livro e o autor não a escreveu: escolher um
        vencedor aqui esconderia a pergunta dentro de um número plausível.
        Se um dia a regra existir, ESTE assert é o que tem de mudar primeiro.

     4. O SANEAMENTO. Forma curta, forma longa, estado inválido e tipo que não
        existe mais (um Addon pode ter sido desligado depois da ficha salva). */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { sanearDefesasDano, ESTADOS_DEFESA } = await import(R + "afty-defesas-dano.js");
const { TIPOS_DANO, CATEGORIAS_DANO } = await import(R + "afty-equipamentos.js");
const TIPOS_FISICOS = CATEGORIAS_DANO.find((c) => c.id === "fisico").tipos;

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const ficha = ({ efeitos = [], defesas = null, habs = [], nd = 20 } = {}) => {
  const c = createBlankAfty();
  c.rulesVersion = "player";
  c.core = { ...c.core, nd, tipo: "combatente", patamar: "comum", tecnicaEfeitos: efeitos };
  c.especializacoes = [{ id: "lutador", nivel: nd }];
  c.habilidades = habs;
  c.attributes = { forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 };
  c.equipamentos = { itens: [] };
  if (defesas) c.defesasDano = defesas;
  return c;
};
const linha = (d, tipo) => d.defesasDano.porTipo[tipo];

/* ============================================================ */
/* 1. AS DUAS ENTRADAS                                           */
/* ============================================================ */

const daFicha = deriveAfty(ficha({ defesas: { queimante: { estado: "imune", rd: 5 } } }));
t("a aba liga o estado", linha(daFicha, "queimante").estados, ["imune"]);
t("e a fonte dele diz Ficha",
  linha(daFicha, "queimante").fontesEstado.imune, [{ label: "Ficha", valor: 1 }]);
t("e a RD da aba entra em rdProprio", linha(daFicha, "queimante").rdProprio, 5);

/* Os quatro canais, um por um. `tecnicaEfeitos` é o Motor livre da ficha, que é
   a porta mais curta para provar um canal sem depender de catálogo. */
const doMotor = deriveAfty(ficha({ efeitos: [
  { canal: "imunidadeDano", alvo: "queimante", expr: "1" },
  { canal: "resistenciaDano", alvo: "psiquico", expr: "1" },
  { canal: "vulnerabilidadeDano", alvo: "congelante", expr: "1" },
  { canal: "rdTipo", alvo: "acido", expr: "7" },
] }));
t("imunidadeDano acende a Imunidade", linha(doMotor, "queimante").estados, ["imune"]);
t("resistenciaDano acende a Resistência", linha(doMotor, "psiquico").estados, ["resistente"]);
t("vulnerabilidadeDano acende a Vulnerabilidade", linha(doMotor, "congelante").estados, ["vulneravel"]);
t("rdTipo entra na RD própria", linha(doMotor, "acido").rdProprio, 7);
/* ⚠ E NÃO VAZA PARA OS VIZINHOS: o alvo é o tipo, e um canal que ignorasse o
   alvo daria a mesma imunidade aos quinze. */
t("e nenhum deles alcança outro tipo",
  ["im", "sonico", "radiante", "venenoso"].map((x) => linha(doMotor, x).estados.length), [0, 0, 0, 0]);
t("nem a RD por tipo", linha(doMotor, "sonico").rdProprio, 0);

/* `ativas` é o que a Ficha e o Preview mostram: quinze linhas em branco não são
   resultado. */
t("só o que tem alguma coisa entra em ativas",
  doMotor.defesasDano.ativas.map((l) => l.tipo).sort(), ["acido", "congelante", "psiquico", "queimante"]);

/* ============================================================ */
/* 2. A RD EFETIVA, PARCELA POR PARCELA                          */
/* ============================================================ */

/* Corpo Supremo (Lutador 16°) é a régua boa porque ele mexe nas DUAS RDs de
   uma vez: "redução de dano igual a metade do seu nível de personagem contra
   dano cortante, perfurante e de impacto [...] Contra os outros tipos de dano
   não escolhidos, a redução de dano é igual a 1/4 do seu nível." */
const semCS = deriveAfty(ficha({ nd: 20 }));
const comCS = deriveAfty(ficha({ nd: 20, habs: ["lut_corpo_supremo"] }));
const ganho = (tipo) => linha(comCS, tipo).rd - linha(semCS, tipo).rd;
t("contra os três FÍSICOS o ganho é metade do nível",
  TIPOS_FISICOS.map(ganho), [10, 10, 10]);
t("e contra o resto é um quarto",
  ["queimante", "psiquico", "venenoso"].map(ganho), [5, 5, 5]);

/* ⚠ A ALMA NÃO RECEBE A RD GERAL. Ela tem canal próprio justamente porque a
   Geral cobre todo tipo EXCETO alma (autor, 2026-07-29). Uma linha de alma que
   somasse a Geral daria uma RD que a criatura não tem. */
const comGeral = deriveAfty(ficha({ efeitos: [{ canal: "rdGeral", expr: "9" }] }));
t("a RD Geral alcança o Queimante", linha(comGeral, "queimante").rd - linha(deriveAfty(ficha({})), "queimante").rd, 9);
t("e NÃO alcança a Alma", linha(comGeral, "alma").rd, 0);
const comAlma = deriveAfty(ficha({ efeitos: [{ canal: "rdAlma", expr: "4" }] }));
t("a RD a Alma só existe na Alma",
  [linha(comAlma, "alma").rd, linha(comAlma, "queimante").rd - linha(deriveAfty(ficha({})), "queimante").rd], [4, 0]);

/* As partes são o que o hover mostra. Um número certo com detalhamento errado é
   bug, e por isso o rótulo de cada parcela entra no assert. */
const partes = deriveAfty(ficha({
  defesas: { ct: { estado: null, rd: 2 } },
  efeitos: [{ canal: "rdGeral", expr: "3" }, { canal: "rdFisico", expr: "4" }, { canal: "rdTipo", alvo: "ct", expr: "1" }],
}));
/* ⚠ A parcela "RD Geral" é o TOTAL da RD Geral, e não só o que o Motor somou:
   é isso que o hover tem de mostrar. Por isso a régua é o delta contra a mesma
   ficha sem os efeitos, e não um número absoluto (a criatura já tem RD Geral de
   base pelo Tipo e pelo equipamento). */
const semPartes = deriveAfty(ficha({}));
const geralBase = semPartes.rdGeral;
t("o hover do Cortante lista as quatro parcelas, nesta ordem",
  linha(partes, "ct").partes.map((p) => p.label),
  ["Ficha", "Técnica", "RD Geral", "RD Física"]);
t("e cada valor é a parcela inteira, não o pedaço novo",
  linha(partes, "ct").partes.map((p) => p.valor), [2, 1, geralBase + 3, 4]);
t("e a soma das partes bate com o total",
  linha(partes, "ct").partes.reduce((a, p) => a + p.valor, 0), linha(partes, "ct").rd);

/* ============================================================ */
/* 3. O CONFLITO AVISA, E NÃO ESCOLHE                            */
/* ============================================================ */

const conflito = deriveAfty(ficha({
  defesas: { queimante: { estado: "vulneravel", rd: 0 } },
  efeitos: [{ canal: "imunidadeDano", alvo: "queimante", expr: "1" }],
}));
t("os DOIS estados sobrevivem", linha(conflito, "queimante").estados, ["imune", "vulneravel"]);
t("a linha se marca como conflito", linha(conflito, "queimante").conflito, true);
t("e sai um aviso nomeando os dois",
  conflito.defesasDano.avisos, [{ tipo: "queimante", texto: "Queimante: Imunidade e Vulnerabilidade ao mesmo tempo" }]);
t("sem conflito não há aviso nenhum", daFicha.defesasDano.avisos.length, 0);

/* ============================================================ */
/* 4. O SANEAMENTO                                               */
/* ============================================================ */

t("a forma curta vira a longa",
  sanearDefesasDano({ ct: "resistente" }, TIPOS_DANO), { ct: { estado: "resistente", rd: 0 } });
t("estado inválido cai, e a RD do lado fica",
  sanearDefesasDano({ im: { estado: "lixo", rd: "4" } }, TIPOS_DANO), { im: { estado: null, rd: 4 } });
t("tipo que não existe é descartado", sanearDefesasDano({ inventado: "imune" }, TIPOS_DANO), {});
t("entrada vazia não é guardada", sanearDefesasDano({ pf: { estado: null, rd: 0 } }, TIPOS_DANO), {});
t("RD negativa vira zero, e a entrada some", sanearDefesasDano({ pf: { estado: null, rd: -3 } }, TIPOS_DANO), {});
t("lixo não quebra", [sanearDefesasDano(null, TIPOS_DANO), sanearDefesasDano("x", TIPOS_DANO)], [{}, {}]);

/* ============================================================ */
/* 5. A COBERTURA                                                */
/* ============================================================ */

/* Uma linha por tipo do livro, sempre: a aba é a tabela inteira, e um tipo que
   sumisse dela viraria uma defesa que ninguém consegue anotar. */
const todas = deriveAfty(ficha({}));
t("há uma linha para cada tipo de dano",
  todas.defesasDano.linhas.length, Object.keys(TIPOS_DANO).length);
t("e as quatro categorias do livro estão representadas",
  [...new Set(todas.defesasDano.linhas.map((l) => l.categoriaId))],
  ["fisico", "elemental", "etereo", "biologico"]);
t("os três estados são excludentes no catálogo", ESTADOS_DEFESA.length, 3);

if (bad.length) {
  console.log(`FALHAS (${bad.length}):`);
  for (const b of bad) console.log("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
