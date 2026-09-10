/**
 * CRIAÇÃO DE ARMAS: a métrica de Pontos de Criação.
 *
 * Padrão escrito pelo autor e entregue em 2026-09-09. O pacote é
 * `addons/criacao-de-armas.json`, e ele não traz dado nenhum: a métrica inteira
 * é verbo do motor (`afty-criacao-armas.js`), e o que o addon acrescenta é o
 * `permite`, ou seja, a bancada na tela.
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. OS ESPELHOS. O módulo é FOLHA e não importa nada, então ele carrega uma
 *    cópia da escada de dados, da faixa de crítico, do teto de custo e dos
 *    tipos físicos. Cada uma é comparada aqui com a original do livro: sem isto
 *    a cópia envelhece calada, que é o defeito que o `t-carteira.mjs` já pega
 *    na tabela de XP.
 * 2. TODA PROPRIEDADE DO LIVRO TEM DESTINO. Ou ela tem preço, ou rende PC, ou é
 *    avaliada pela mesa, ou está declarada fora do padrão. Uma propriedade nova
 *    que ninguém precificar apareceria na bancada custando zero, sem aviso.
 * 3. AS CONTAS DO PADRÃO, uma a uma, com o verbatim do autor no comentário.
 * 4. O `permite` NÃO MOVE NÚMERO. Uma ficha com arma criada e o pacote
 *    instalado deriva IDÊNTICA à mesma ficha sem o pacote. É a promessa inteira
 *    do campo, e aqui ela é medida com a arma equipada.
 * 5. A BANCADA EXCEDE E AVISA, e nunca corrige. Estourar um limite deixa o
 *    número gravado onde estava, com aviso, que é a convenção de todo orçamento
 *    do projeto.
 * 6. O bloco `criacao` sobrevive ao saneamento, e uma arma que nunca passou
 *    pela bancada não ganha o campo.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { normalizarPacote, validarPacote, PRIMITIVAS, primitivasDaCriatura, liberacoesDaCriatura } = await import(R + "afty-addons.js");
const CA = await import(R + "afty-criacao-armas.js");
const {
  ARMA_DADOS, ARMA_CRITICOS, CUSTOS, ARMA_PROPRIEDADES, CATEGORIAS_DANO, ARMAS,
  saneiaArmaCustom, armasCustomDaFicha, grauFeiticeiro,
} = await import(R + "afty-equipamentos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const pacote = normalizarPacote(
  JSON.parse(readFileSync(new URL("../addons/criacao-de-armas.json", import.meta.url), "utf8")),
);

/** Uma arma custom saneada, com os padrões da bancada. */
const arma = (patch = {}) => saneiaArmaCustom({
  id: "armc_t",
  nome: "Teste",
  classe: "simples",
  categoria: "corpo",
  dano: { dado: "1d6", tipo: "ct" },
  critico: 20,
  espacos: 1,
  custo: 1,
  grupo: "espada",
  props: {},
  ...patch,
});
const orc = (patch = {}, opcoes = {}) => CA.orcamentoDaArma(arma(patch), opcoes);
const avisos = (o) => o.avisos.map((a) => a.id).sort();

const simples = CA.classificacaoDaArma("simples");
const tatica = CA.classificacaoDaArma("complexa");

/* ============================================================ */
/* 1. OS ESPELHOS DO LIVRO                                       */
/* ============================================================ */
/* ⚠ O MÓDULO É FOLHA E NÃO IMPORTA NADA, senão fecha o ciclo que deixou o app
   em tela branca em 2026-09-02 (ver `t-ordem-modulos.mjs`). O preço da folha é
   a cópia, e o preço da cópia é este bloco. */
/* ⚠ A ESCADA DE DADOS DEIXOU DE SER ESPELHO em 2026-09-09, e este bloco mudou de
   sentido: em vez de comparar duas listas, ele prova que a métrica LÊ a escada
   de Níveis de Dano do livro. A primeira versão cobrava o índice da lista de
   seis dados do editor, e o autor achou o buraco pela porta certa: numa arma
   Tática a opção "Dano" do limite do custo não comprava nada, porque a lista
   acabava antes do limite. */
t("o primeiro degrau é o 1d4", CA.DADO_INICIAL, ARMA_DADOS[0]);
t("o crítico base é o maior da faixa do livro", CA.CRITICO_BASE, Math.max(...ARMA_CRITICOS));
t("e o piso é o menor", CA.CRITICO_PISO, Math.min(...ARMA_CRITICOS));
t("o teto de custo é o do livro", CA.CUSTO_TETO, Math.max(...CUSTOS));
t("os tipos físicos são os da categoria do livro",
  CA.TIPOS_FISICOS, CATEGORIAS_DANO.find((c) => c.id === "fisico").tipos);

/* As duas classificações escrevem no MESMO campo `classe` das armas do livro
   (autor, 2026-09-09: a Tática é a Complexa). Um valor novo aqui criaria uma
   arma que é Complexa para a proficiência e Tática para a criação. */
t("as classificações usam as classes que o catálogo já tem",
  CA.CLASSIFICACOES_ARMA.map((c) => c.value).sort(),
  [...new Set(ARMAS.map((a) => a.classe))].sort());
t("classe desconhecida cai na Simples, e não quebra",
  CA.classificacaoDaArma("inventada").value, "simples");

/* ⚠ TODA PROPRIEDADE DO LIVRO TEM DESTINO. Sem isto, uma propriedade nova
   entraria na bancada custando zero e ninguém veria. */
const idsLivro = ARMA_PROPRIEDADES.map((p) => p.id).sort();
const idsMetrica = [
  ...Object.keys(CA.PC_PROPRIEDADE),
  ...CA.PROPRIEDADES_DE_CREDITO,
  ...CA.PROPRIEDADES_AVALIADAS,
  ...CA.PROPRIEDADES_FORA_DO_PADRAO,
].sort();
t("toda propriedade do livro tem destino na métrica", idsMetrica, idsLivro);
t("e a métrica não inventa propriedade nenhuma",
  idsMetrica.filter((id) => !idsLivro.includes(id)), []);
t("os rótulos da bancada são os nomes do livro",
  ARMA_PROPRIEDADES.filter((p) => CA.ROTULOS_PROPRIEDADE[p.id] !== p.nome).map((p) => p.id), []);

/* ============================================================ */
/* 2. AS DUAS CLASSIFICAÇÕES                                     */
/* ============================================================ */
/* Verbatim: "Armas Simples: 8 PC [...] Máximo de 6 PC em Propriedades e 4 PC em
   Dano, com seu custo máximo sendo 2" e "Armas Táticas: 12 PC [...] Máximo de 8
   PC em Propriedades e 6 PC em Dano, com seu custo máximo sendo 3". */
t("Simples: 8 PC, 6 de propriedades, 4 de dano, custo 2",
  [simples.pc, simples.limiteProp, simples.limiteDano, simples.custoMax], [8, 6, 4, 2]);
t("Tática: 12 PC, 8 de propriedades, 6 de dano, custo 3",
  [tatica.pc, tatica.limiteProp, tatica.limiteDano, tatica.custoMax], [12, 8, 6, 3]);
t("e o rótulo da Complexa na bancada é Tática", tatica.label, "Tática");

/* ============================================================ */
/* 3. O DADO DE DANO                                             */
/* ============================================================ */
/* Verbatim: "Para cada 1 PC o dado de dano da arma subirá em 1 nível, começando
   sem dano igual a faixas até chegar no limite máximo permitido pela
   classificação da arma." */
/* ⚠ A LISTA DO EDITOR É A ESCADA, desde 2026-09-09 (autor: *"Segue o Nível de
   Dano"*). Cada dado oferecido custa exatamente a posição dele, o que é a forma
   mais direta de dizer que as duas coisas são a MESMA escada: se um dia a lista
   voltar a ser escrita à mão, esta linha quebra. */
t("cada dado oferecido custa a posição dele",
  ARMA_DADOS.map(CA.pcDoDado), ARMA_DADOS.map((_, i) => i + 1));
t("a lista começa no 1d4 e termina no 3d12 da Bazuca",
  [ARMA_DADOS[0], ARMA_DADOS.at(-1)], ["1d4", "3d12"]);
/* ⚠ OS DADOS IMPRESSOS DO LIVRO CONTINUAM ACEITOS, mesmo sem serem oferecidos.
   São o dado de armas do catálogo e de toda arma própria salva antes da troca:
   recusá-los apagaria o dano dessas armas na leitura seguinte. */
t("o dado impresso do livro sobrevive ao saneamento",
  ["2d4", "2d6", "2d8", "2d10", "3d12"].map((d) => arma({ dano: { dado: d, tipo: "ct" } }).dano.dado),
  ["2d4", "2d6", "2d8", "2d10", "3d12"]);
t("e o que não é dado nenhum cai no padrão",
  arma({ dano: { dado: "7d3", tipo: "ct" } }).dano.dado, "1d6");
/* ⚠ O 2d6 CUSTA O MESMO QUE O 1d12, e é o coração da correção. Os dois têm
   resultado máximo 12, e a tabela impressa escreve a célula como "1d12 ou 2d6":
   é o MESMO Nível de Dano escrito de duas formas. Cobrar 6 por um e 5 pelo outro
   vendia o mesmo dano por preços diferentes. */
t("2d6 e 1d12 são o mesmo nível", [CA.pcDoDado("2d6"), CA.pcDoDado("1d12")], [5, 5]);
t("2d4 é o mesmo que 1d8", [CA.pcDoDado("2d4"), CA.pcDoDado("1d8")], [3, 3]);
t("e 2d8 é o degrau seguinte ao 1d12", CA.pcDoDado("2d8"), 6);
t("dado desconhecido é zero, que é o sem dano das Faixas", CA.pcDoDado("nada"), 0);

/* ⚠ A PROVA DE QUE O LIMITE DO PADRÃO FOI ESCRITO NESTA ESCADA, e a razão de a
   correção não ser chute: o limite de Dano da Tática cai EXATAMENTE em cima da
   maior arma corpo a corpo do livro. Com a escada velha, que parava no 2d6, a
   Espada Colossal era grande demais para a própria classificação dela.

   ⚠ A ARMA DE FOGO FICA DE FORA da varredura, porque o padrão a exclui por
   escrito. Sem esse filtro a maior "simples" seria a Pistola. */
const maiorDoLivro = (classe) => ARMAS
  .filter((a) => a.classe === classe && a.dano?.dado && a.categoria === "corpo")
  .reduce((maior, a) => (CA.pcDoDado(a.dano.dado) > CA.pcDoDado(maior.dano.dado) ? a : maior));
t("a maior arma Tática do livro fecha em cima do limite",
  [maiorDoLivro("complexa").nome, CA.pcDoDado(maiorDoLivro("complexa").dano.dado)],
  ["Espada Colossal", tatica.limiteDano]);
/* A Simples não tem arma no teto dela: a maior corpo a corpo é 1d8, e o limite 4
   deixa um degrau de folga. É o degrau que a opção "Dano" do custo 2 compra. */
t("e a maior Simples fica um degrau abaixo do limite",
  CA.pcDoDado(maiorDoLivro("simples").dano.dado), simples.limiteDano - 1);
t("o dado que cada PC compra",
  [1, 4, 5, 6, 7].map(CA.dadoDePc), ["1d4", "1d10", "1d12", "1d12 + 1d4", "1d12 + 1d6"]);
t("o 1d6 da arma padrão custa 2 PC", orc().gastos.dano, 2);
t("o limite de dano da Simples deixa passar o 1d10",
  avisos(orc({ dano: { dado: "1d10", tipo: "ct" } })), []);
t("e barra o 1d12", avisos(orc({ dano: { dado: "1d12", tipo: "ct" } })), ["dano"]);
t("na Tática o 2d6 cabe",
  avisos(orc({ classe: "complexa", custo: 3, dano: { dado: "2d6", tipo: "ct" } })).includes("dano"), false);

/* ============================================================ */
/* 4. A MARGEM DE CRÍTICO                                        */
/* ============================================================ */
/* Verbatim: "Para cada 3 PC gastos em Margem se reduzirá em um o valor
   necessário para um crítico na arma. Com o limite igual a metade do custo da
   arma + 1 para cada dois níveis de dado menores que 1d12." */
t("três PC por redução", CA.PC_POR_MARGEM, 3);
t("o 19 custa 3 e o 18 custa 6",
  [orc({ critico: 19 }).gastos.margem, orc({ critico: 18 }).gastos.margem], [3, 6]);
t("níveis abaixo do 1d12",
  ["1d4", "1d6", "1d8", "1d10", "1d12", "2d6"].map(CA.niveisAbaixoDe1d12), [4, 3, 2, 1, 0, 0]);
t("custo 4 com 1d12 dá dois", CA.limiteDeMargem(4, "1d12"), 2);
t("custo 1 com 1d12 dá zero", CA.limiteDeMargem(1, "1d12"), 0);
t("custo 1 com 1d6 dá um", CA.limiteDeMargem(1, "1d6"), 1);
t("custo 2 com 1d4 daria três e o piso 18 apara em dois", CA.limiteDeMargem(2, "1d4"), 2);
t("margem além do limite avisa", avisos(orc({ critico: 18 })), ["margem"]);
t("e dentro dele não", avisos(orc({ critico: 19 })), []);
/* ⚠ 18 É O PISO (autor, 2026-09-09). O sistema guarda 20, 19 e 18, e o
   saneamento devolve 20 para qualquer outra coisa, então não há como comprar
   uma quarta redução nem por acidente. */
t("o saneamento recusa margem abaixo de 18", arma({ critico: 17 }).critico, 20);

/* ============================================================ */
/* 5. O CUSTO                                                    */
/* ============================================================ */
/* Verbatim: "Toda arma ganhará pontos de criação extras iguais ao seu custo,
   sendo que, no custo 2 e 4, se recebe um de limite de gasto adicional para
   Propriedades ou Dano à sua escolha." */
t("o custo vira PC", [1, 2, 3, 4].map((c) => orc({ custo: c }).pool.custo), [1, 2, 3, 4]);
t("o custo 1 não dá limite extra", orc({ custo: 1 }).bonus, { propriedades: 0, dano: 0 });
t("o custo 2 dá um", orc({ custo: 2 }).bonus, { propriedades: 1, dano: 0 });
t("o custo 3 continua com o do custo 2", orc({ custo: 3 }).bonus, { propriedades: 1, dano: 0 });
t("o custo 4 dá dois", orc({ custo: 4 }).bonus, { propriedades: 2, dano: 0 });
t("e cada um vai para onde a pessoa escolheu",
  orc({ custo: 4, criacao: { bonus2: "dano", bonus4: "propriedades" } }).bonus,
  { propriedades: 1, dano: 1 });
t("o limite escolhido entra no limite de gasto",
  orc({ custo: 4, criacao: { bonus2: "dano", bonus4: "dano" } }).limites.dano, 6);
/* Custo acima do máximo da classificação avisa, e não é corrigido. */
t("Simples com custo 3 avisa", avisos(orc({ custo: 3 })), ["custo"]);
t("Tática com custo 3 não avisa", avisos(orc({ classe: "complexa", custo: 3 })), []);

/* ============================================================ */
/* 6. A ARMA DE TÉCNICA                                          */
/* ============================================================ */
/* Verbatim: "Para cada vez que o usuário subir de grau, o custo de sua arma irá
   subir em 1. Começando com custo 1 no grau 4 e terminando em custo 4 no grau
   1. Assim como Receberá o dobro de PC e limites provindas deste custo." */
t("o custo sai do grau do usuário", [1, 2, 3, 4].map(CA.custoDeTecnica), [1, 2, 3, 4]);
/* ⚠ ACIMA DO PRIMEIRO GRAU O CUSTO PARA EM 4. A escada do padrão acaba ali, e 4
   é o teto de custo de todo item do sistema. */
t("os graus Especiais ficam no 4", [5, 6, 7, 8, 9].map(CA.custoDeTecnica), [4, 4, 4, 4, 4]);
t("o grau da criatura por ND casa com a escada",
  [1, 5, 9, 13, 17].map((nd) => CA.custoDeTecnica(grauFeiticeiro(nd).ordem)), [1, 2, 3, 4, 4]);

const tec = (patch = {}, grauOrdem = 4) => CA.orcamentoDaArma(
  arma({ classe: "complexa", custo: 4, criacao: { tecnica: true }, ...patch }),
  { grauOrdem },
);
t("no Primeiro Grau ela tem custo 4", tec().custo, 4);
t("no Quarto Grau ela tem custo 1", tec({}, 1).custo, 1);
t("e o PC do custo vem dobrado", [tec({}, 1).pool.custo, tec().pool.custo], [2, 8]);
t("o limite extra do custo também dobra", tec().bonus, { propriedades: 4, dano: 0 });
/* ⚠ A TÉCNICA PASSA POR CIMA DO CUSTO MÁXIMO DA CLASSIFICAÇÃO. A Tática para no
   3 e a escada de técnica termina no 4: cobrar os dois deixaria toda arma de
   técnica de Primeiro Grau avisando para sempre, sem nada a corrigir. */
t("e ela não avisa por passar do custo máximo", avisos(tec()).includes("custo"), false);
t("a arma comum no mesmo custo 4 avisa",
  avisos(orc({ classe: "complexa", custo: 4 })), ["custo"]);

/* ============================================================ */
/* 7. OS ESPAÇOS                                                 */
/* ============================================================ */
/* Verbatim: "Para cada 1 de Espaço, acima de 1, que a arma gaste que não seja
   pela propriedade pesada, se recebe 1 PC extra. Limitado pelo custo da arma e
   narrativa." */
t("um espaço não rende nada", orc({ espacos: 1 }).pool.espaco, 0);
t("dois espaços rendem um", orc({ espacos: 2 }).pool.espaco, 1);
t("o custo apara o rendimento",
  [orc({ espacos: 5, custo: 1 }).pool.espaco, orc({ espacos: 5, classe: "complexa", custo: 3 }).pool.espaco],
  [1, 3]);
t("e o excedente avisa", avisos(orc({ espacos: 5, custo: 1 })), ["espacoLimite"]);
/* ⚠ O ESPAÇO QUE A PESADA COBROU NÃO RENDE DE NOVO, senão o mesmo espaço seria
   pago duas vezes. É a piada do prédio nas costas, no texto do padrão. */
t("o espaço da Pesada sai da conta",
  CA.orcamentoDaArma(arma({ classe: "complexa", custo: 3, espacos: 3, props: { pesada: 18 } })).pool.espaco, 0);

/* ============================================================ */
/* 8. A PESADA                                                   */
/* ============================================================ */
/* Verbatim: "A cada 4 atributos acima de 10 necessários em Força para se
   utilizar esta arma se recebe 1 PC extra para gastar na arma. Com um limite
   igual ao custo da arma - 1. No entanto, para cada PC extra, aumente em 1 o
   espaço gasto da arma." */
t("Força 14 rende um", CA.creditoDeAtributoExigido(14, 4), 1);
t("Força 18 rende dois", CA.creditoDeAtributoExigido(18, 4), 2);
t("Força 13 ainda não rende", CA.creditoDeAtributoExigido(13, 4), 0);
t("o custo menos um apara", [1, 2, 3, 4].map((c) => CA.creditoDeAtributoExigido(30, c)), [0, 1, 2, 3]);
const pesada = CA.orcamentoDaArma(arma({ classe: "complexa", custo: 3, espacos: 3, props: { pesada: 18 } }));
t("a Pesada entra no bolso das Propriedades, negativa", pesada.gastos.propriedades, -2);
t("e ela não avisa quando os espaços acompanham", avisos(pesada), []);
t("Pesada sem os espaços avisa",
  avisos(CA.orcamentoDaArma(arma({ classe: "complexa", custo: 3, espacos: 1, props: { pesada: 18 } })))
    .includes("pesadaEspacos"), true);
t("Pesada em arma de custo 1 não rende, e avisa",
  avisos(orc({ props: { pesada: 18 } })), ["pesadaLimite"]);

/* ============================================================ */
/* 8.1 A ESTABILIDADE                                            */
/* ============================================================ */
/* Verbatim: "Estabilidade [X]: -Y PC | A cada 4 atributos acima de 10
   necessários em Destreza para se utilizar esta arma se recebe 1 PC extra para
   gastar na arma. Com um limite igual ao custo da arma - 1."

   ⚠ ELA NÃO ESTÁ NA LISTA DE PROPRIEDADES DO LIVRO: chegou com o padrão de
   criação, em 2026-09-09, e o efeito em jogo veio da resposta do autor no mesmo
   dia ("é a mesma coisa que Pesada, só que para Destreza"). Por isso ela é
   entrada do CATÁLOGO e não do addon: quem não instala o pacote continua
   podendo marcá-la, como marca a Pesada. */
const estab = ARMA_PROPRIEDADES.find((p) => p.id === "estabilidade");
t("a Estabilidade existe no catálogo, e pede um número", [!!estab, estab?.param], [true, "numero"]);
t("o texto dela é o da Pesada com o atributo trocado",
  estab.descricao, ARMA_PROPRIEDADES.find((p) => p.id === "pesada").descricao
    .replace(/Força/g, "Destreza").replace("arma pesada", "arma com estabilidade"));

/* ⚠ A CONTA É A MESMA DAS DUAS, e por isso é uma função só. Duas contas iguais
   escritas em dois lugares divergem no primeiro conserto. */
const estabilidade = CA.orcamentoDaArma(arma({ classe: "complexa", custo: 3, props: { estabilidade: 18 } }));
t("a Estabilidade rende igual à Pesada", estabilidade.gastos.propriedades, -2);
t("e ela também é aparada pelo custo menos um",
  avisos(orc({ props: { estabilidade: 18 } })), ["estabilidadeLimite"]);

/* ⚠ A ÚNICA DIFERENÇA: a Estabilidade NÃO aumenta o espaço da arma. Numa arma de
   um espaço a Pesada avisa que faltam espaços e a Estabilidade não, e o crédito
   de espaço da Pesada é comido pela cobrança dela. */
t("a Estabilidade não pede espaço nenhum",
  avisos(CA.orcamentoDaArma(arma({ classe: "complexa", custo: 3, espacos: 1, props: { estabilidade: 18 } }))), []);
t("e o espaço da arma continua rendendo com ela marcada",
  CA.orcamentoDaArma(arma({ classe: "complexa", custo: 3, espacos: 3, props: { estabilidade: 18 } })).pool.espaco, 2);
t("com a Pesada junto, só o espaço DELA sai da conta",
  CA.orcamentoDaArma(arma({ classe: "complexa", custo: 3, espacos: 3, props: { pesada: 18, estabilidade: 18 } })).pool.espaco, 0);
t("e as duas rendem, cada uma no bolso das Propriedades",
  CA.orcamentoDaArma(arma({ classe: "complexa", custo: 3, espacos: 3, props: { pesada: 18, estabilidade: 18 } })).gastos.propriedades, -4);

/* ============================================================ */
/* 9. AS PROPRIEDADES                                            */
/* ============================================================ */
t("o preço de cada uma",
  [CA.PC_PROPRIEDADE.ampla, CA.PC_PROPRIEDADE.aparar, CA.PC_PROPRIEDADE.energica,
    CA.PC_PROPRIEDADE.estendida, CA.PC_PROPRIEDADE.fineza, CA.PC_PROPRIEDADE.duas_maos],
  [3, 2, 2, 2, 1, -1]);
/* ⚠ DUAS MÃOS "RETIRA PC GASTOS", e por isso ela entra NO BOLSO das
   Propriedades, e não no bolo geral: ela abre espaço debaixo do limite de 6. */
t("Duas Mãos desconta do bolso das Propriedades",
  orc({ props: { duas_maos: true, ampla: true } }).gastos.propriedades, 2);
t("e o total sobe junto", orc({ props: { duas_maos: true } }).sobra, orc().sobra + 1);

/* Alcance: "para cada ponto desta propriedade a arma ganha 12 de alcance em seu
   acerto", e o limite de PC é o custo da arma. */
t("o PC do Alcance sai do alcance gravado",
  [[12, 24], [24, 48], [36, 72]].map((p) => CA.pcDeAlcance(p, CA.METROS_ALCANCE)), [1, 2, 3]);
t("o da Arremessável sai de seis em seis",
  [[6, 18], [12, 36]].map((p) => CA.pcDeAlcance(p, CA.METROS_ARREMESSAVEL)), [1, 2]);
t("meio degrau arredonda para cima", CA.pcDeAlcance([13, 26], CA.METROS_ALCANCE), 2);
t("Alcance só entra em arma de arremesso",
  avisos(orc({ classe: "complexa", custo: 3, props: { alcance: [12, 24] } })), ["alcanceCategoria"]);
t("e na de arremesso não avisa",
  avisos(orc({ classe: "complexa", custo: 3, categoria: "arremesso", props: { alcance: [36, 72] } })), []);
t("Alcance além do custo avisa",
  avisos(orc({ classe: "complexa", custo: 3, categoria: "arremesso", props: { alcance: [48, 96] } })),
  ["alcancePc"]);
t("Arremessável além do custo avisa",
  avisos(orc({ props: { arremessavel: [12, 36] } })), ["arremessavelPc"]);

/* Fatal e Mortal: "1 PC dá mortal d8 e 2 PC dá mortal d12", e as duas só entram
   em arma complexa. */
t("Mortal d8 custa 1 e d12 custa 2",
  [orc({ classe: "complexa", props: { mortal: "1d8" } }).gastos.propriedades,
    orc({ classe: "complexa", props: { mortal: "1d12" } }).gastos.propriedades],
  [1, 2]);
t("Fatal na Simples avisa", avisos(orc({ props: { fatal: "1d8" } })), ["fatalClasse"]);
t("Fatal na Tática não avisa", avisos(orc({ classe: "complexa", props: { fatal: "1d8" } })), []);
t("dado fora do padrão avisa",
  avisos(orc({ classe: "complexa", props: { mortal: "1d10" } })), ["mortalDado"]);

/* Modular: "Cada 1 PC adiciona uma opção de dano FÍSICO à arma." */
t("Modular com tipo físico não avisa", avisos(orc({ props: { modular: "im" } })), []);
t("Modular com tipo que não é físico avisa", avisos(orc({ props: { modular: "acido" } })), ["modular"]);
t("e a lista de físicos pode vir de fora, para o addon de tipo de dano caber",
  avisos(CA.orcamentoDaArma(arma({ props: { modular: "acido" } }), { tiposFisicos: ["acido"] })), []);

/* Emperrar e Recarga são de arma de fogo, e o padrão as deixou de fora. */
t("propriedade fora do padrão não tem preço",
  orc({ props: { emperrar: true } }).gastos.propriedades, 0);
t("e ela avisa", avisos(orc({ props: { emperrar: true, recarga: 2 } })), ["fora_emperrar", "fora_recarga"]);

/* A Especial é avaliada pela mesa, e pode comer a arma inteira. */
t("a Especial cobra o que a mesa avaliou",
  orc({ props: { especial: true }, criacao: { especialPc: 5 } }).gastos.especial, 5);
t("Especial sem avaliação avisa", avisos(orc({ props: { especial: true } })), ["especial"]);
t("ela pode comer os PC inteiros, como nas Faixas",
  orc({ props: { especial: true }, criacao: { especialPc: 9 } }).sobra, -2);

/* ============================================================ */
/* 10. UMA ARMA INTEIRA, DE PONTA A PONTA                        */
/* ============================================================ */
/* Uma Tática de custo 3, dois espaços, 1d10, margem 19, com Marcial, Fineza e
   Ampla. É o caminho que a bancada percorre numa arma de verdade. */
const inteira = CA.orcamentoDaArma(arma({
  classe: "complexa",
  custo: 3,
  espacos: 2,
  dano: { dado: "1d10", tipo: "ct" },
  critico: 19,
  props: { marcial: true, fineza: true, ampla: true },
}));
t("o bolso: 12 de base, 3 do custo e 1 do espaço",
  [inteira.pool.base, inteira.pool.custo, inteira.pool.espaco, inteira.pool.total], [12, 3, 1, 16]);
t("o gasto: 4 de dado, 3 de margem e 5 de propriedades",
  [inteira.gastos.dano, inteira.gastos.margem, inteira.gastos.propriedades, inteira.gastos.total],
  [4, 3, 5, 12]);
t("a sobra", inteira.sobra, 4);
t("os limites, já com o extra do custo 3", [inteira.limites.dano, inteira.limites.propriedades], [6, 9]);
t("e nenhum aviso", avisos(inteira), []);
/* ⚠ A ORDEM DO EXTRATO É A DA MÉTRICA, e não a ordem em que a pessoa clicou. A
   arma acima marcou Marcial, Fineza e Ampla nesta ordem, e o extrato sai
   alfabético, que é a ordem da tabela de preços. */
t("o extrato tem uma linha por fonte de gasto, em ordem estável",
  inteira.linhas.map((l) => l.id), ["dano", "margem", "ampla", "fineza", "marcial"]);

/* ============================================================ */
/* 11. O BLOCO `criacao` NA ARMA                                 */
/* ============================================================ */
t("arma que nunca passou pela bancada não ganha o campo", "criacao" in arma(), false);
t("e a que passou guarda o bloco",
  arma({ criacao: { tecnica: true, especialPc: 3, especialTexto: "Corta o vento", bonus2: "dano" } }).criacao,
  { tecnica: true, especialPc: 3, especialTexto: "Corta o vento", bonus2: "dano", bonus4: "propriedades" });
t("lixo no bloco vira o padrão",
  arma({ criacao: { tecnica: "sim", especialPc: -5, bonus2: "outro" } }).criacao,
  { tecnica: false, especialPc: 0, especialTexto: "", bonus2: "propriedades", bonus4: "propriedades" });
t("bloco que não é objeto some", arma({ criacao: 7 }).criacao, undefined);
t("a arma continua atravessando a ficha inteira",
  armasCustomDaFicha({ armasCustom: [{ ...arma({ criacao: { tecnica: true } }) }] })[0].criacao.tecnica, true);

/* ============================================================ */
/* 12. O PACOTE, E A PROMESSA DO `permite`                       */
/* ============================================================ */
t("o pacote valida sem problema nenhum", validarPacote(pacote), []);
t("ele pede a primitiva da bancada", pacote.permite, ["criacaoArmas"]);
t("a primitiva existe no registro", PRIMITIVAS.some((p) => p.id === "criacaoArmas"), true);
t("ele não libera regra nenhuma", pacote.libera, []);
t("não traz catálogo nenhum", Object.keys(pacote.acrescenta), []);
t("nem remendo nenhum", Object.keys(pacote.substitui), []);

const base = () => {
  const f = createBlankAfty();
  f.core.nd = 13;
  f.core.tipo = "combatente";
  f.armasCustom = [arma({
    classe: "complexa",
    custo: 3,
    espacos: 2,
    dano: { dado: "1d10", tipo: "ct" },
    critico: 19,
    props: { marcial: true, fineza: true, ampla: true },
    criacao: { tecnica: true, especialPc: 2 },
  })];
  f.equipamentos = { itens: [{ uid: "eq_1", tipo: "arma", refId: "armc_t", qtd: 1, equipado: true }] };
  return f;
};
const crua = base();
const comAddon = { ...base(), addons: [pacote] };

t("sem addon a criatura não vê a bancada", primitivasDaCriatura(crua), []);
t("com o addon ela vê", primitivasDaCriatura(comAddon), ["criacaoArmas"]);
t("e nenhuma liberação vem junto", liberacoesDaCriatura(comAddon), []);

const dCrua = deriveAfty(crua);
const dAddon = deriveAfty(comAddon);
/* ⚠ ESTA É A PROMESSA DO `permite`, e ela é medida com a arma EQUIPADA: a
   bancada conta Pontos de Criação e não escreve regra nenhuma, então instalar o
   pacote não pode mover um número da ficha. */
for (const k of ["hp", "pe", "defesa", "cd", "rdGeral", "movimento", "iniciativa", "nd"]) {
  t(`a bancada não mexe em ${k}`, dAddon[k], dCrua[k]);
}
t("nem no inventário resolvido", JSON.stringify(dAddon.equip), JSON.stringify(dCrua.equip));
t("nem na carga", JSON.stringify(dAddon.carga), JSON.stringify(dCrua.carga));
/* E o extrato existe sem o addon, pela mesma razão da Carteira: uma ficha que
   perdeu o pacote não pode devolver zero e deixar a pessoa achar que o trabalho
   dela sumiu. */
t("o orçamento é calculável sem addon nenhum",
  CA.orcamentoDaArma(armasCustomDaFicha(crua)[0], { grauOrdem: 4 }).pool.total, 21);

/* ============================================================ */
/* 13. A TELA                                                    */
/* ============================================================ */
/* ⚠ ASSERT NÃO RENDERIZA, então o que dá para prender aqui é o PORTÃO: a
   bancada tem de estar atrás do `usePrimitiva`, senão ela vaza para a tela de
   quem nunca instalou nada, que é o bug de 2026-08-20. */
const builder = readFileSync(
  fileURLToPath(new URL("../src/systems/afty/AftyCreatureBuilder.jsx", import.meta.url)),
  "utf8",
);
t("a bancada está atrás da primitiva", builder.includes('usePrimitiva("criacaoArmas")'), true);
t("e ela é renderizada no editor de arma", builder.includes("<BancadaDeArma"), true);
/* A Especial só entra na lista de propriedades com a bancada ligada: sem ela
   não há onde guardar preço nem texto, e a caixa marcaria um campo morto. */
t("a Especial depende da bancada",
  builder.includes('bancada || p.id !== "especial"'), true);
/* O custo da arma de técnica vira mostrador, e é escrito pelo efeito. */
t("o custo de técnica é escrito, e não só mostrado",
  builder.includes("custoDeTecnica(grauOrdem)"), true);

const painel = readFileSync(
  fileURLToPath(new URL("../src/systems/afty/ui/BancadaDeArma.jsx", import.meta.url)),
  "utf8",
);
/* O caractere de aviso na TELA é proibido por regra própria do eslint, e em
   comentário ele continua livre. Quem prende isso é o lint, e o que sobra para
   este arquivo é o ícone estar mesmo lá. */
t("o aviso da bancada usa o ícone do lucide", painel.includes("<AlertTriangle"), true);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
