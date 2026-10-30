import { register } from "node:module";
import { readFileSync, readdirSync } from "node:fs";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
await import(R + "afty-derive.js");
const L = await import(R + "afty-addons-lista.js");
const LL = await import(R + "afty-lista-lateral.js");
const AD = await import(R + "afty-addons.js");
const C = await import(R + "afty-addons-compostos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(nome + ": " + JSON.stringify(real) + " != " + JSON.stringify(esperado));
};
const DASH = String.fromCharCode(0x2014);

/* ------------------------------------------------------------ */
/* OS PACOTES DO REPOSITORIO                                     */
/* ------------------------------------------------------------ */
const pasta = new URL("../addons/", import.meta.url);
const arquivos = readdirSync(pasta).filter((f) => f.endsWith(".json")).sort();
const pacotes = arquivos.map((f) => ({ arquivo: f, json: JSON.parse(readFileSync(new URL(f, pasta), "utf8")) }));
const validas = L.CATEGORIAS_DE_ADDON.map((c) => c.value);

t("a lista de categorias tem as 7 de uso mais Outros", validas, ["regras", "origens", "treinos", "talentos", "equipamentos", "tecnicas", "ferramentas", "outros"]);
/* Faltar o resumo NÃO reprova: a lista usa o recurso automático, e quem acrescenta um Addon (os
   colaboradores também) não precisa saber do campo. O que está DECLARADO é validado. */
const semResumo = pacotes.filter((p) => !String(p.json.resumo ?? "").trim()).map((p) => p.arquivo);
if (semResumo.length) console.log("AVISO: " + semResumo.length + " Addon(s) sem resumo, a lista usa o automático: " + semResumo.join(", "));
t("categoria declarada é uma das conhecidas", pacotes.filter((p) => p.json.categoria !== undefined && !validas.includes(p.json.categoria)).map((p) => p.arquivo), []);
t("nenhum Addon cai em Outros, nem pela categoria automática", pacotes.filter((p) => L.categoriaDe(p.json) === "outros").map((p) => p.arquivo), []);
t(`todo resumo declarado cabe em ${L.RESUMO_MAX} caracteres`, pacotes.filter((p) => (p.json.resumo ?? "").length > L.RESUMO_MAX).map((p) => p.arquivo), []);
t("o resumo declarado cabe em uma linha de lista (até 110)", pacotes.filter((p) => (p.json.resumo ?? "").length > 110).map((p) => p.arquivo + " " + p.json.resumo.length), []);
t("todo pacote continua válido com os campos novos", pacotes.filter((p) => AD.validarPacote(AD.normalizarPacote(p.json)).length > 0 && p.json.id !== "guerra-de-feiticeiros").map((p) => p.arquivo), []);
t("o normalizador guarda resumo e categoria", pacotes.every((p) => { const n = AD.normalizarPacote(p.json); return n.resumo === (p.json.resumo ?? "") && n.categoria === (p.json.categoria ?? ""); }), true);

/* A GUARDA DE REDAÇÃO. Os sinais de texto de IA da página "Signs of AI writing" da Wikipedia,
   no que vale para uma linha curta e factual em português: vocabulário de elogio, verbo de
   presença no lugar de "é" e "tem", paralelismo negativo, gerúndio de comentário no fim da frase,
   conectivo de abertura, travessão, ponto e vírgula, negrito e emoji. */
const VICIOS = [
  [/\b(serve como|funciona como um|atua como)\b/i, "verbo de presença no lugar de 'é' ou 'tem'"],
  [/\b(oferece|oferecendo|apresenta|proporciona|proporcionando|conta com|dispõe de)\b/i, "verbo inflado"],
  [/\b(permite|permitindo|garante|garantindo|possibilita|possibilitando)\b/i, "verbo de permissão genérico"],
  [/\b(poderos[oa]s?|robust[oa]s?|inovador[a]?s?|fundamental|crucial|essencial|vibrante|rico em|diversos?|variad[oa]s?|incrível|excepcional|impressionante)\b/i, "elogio ou adjetivo vago"],
  [/\b(não (apenas|só|somente)|mais do que (apenas|só))\b/i, "paralelismo negativo"],
  [/\b(além disso|adicionalmente|ademais|vale destacar|vale ressaltar|é importante notar)\b/i, "conectivo de abertura"],
  [/,\s+(garantindo|permitindo|oferecendo|proporcionando|tornando|refletindo|contribuindo|reforçando|destacando|evidenciando|simbolizando|promovendo)\b/i, "gerúndio de comentário no fim"],
  [/\b(no coração de|rico patrimônio|testemunho de|marco importante|paisagem|cenário em constante)\b/i, "linguagem de significado ou promocional"],
  [/\b(experiência (de jogo )?(mais )?(rica|imersiva|dinâmica)|mais dinâmic[oa]|mais imersiv[oa])\b/i, "fecho de avaliação"],
  [new RegExp("[;" + DASH + "]"), "travessão ou ponto e vírgula"],
  [/\*\*|__|`/, "marcação de negrito ou código"],
  [/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, "emoji"],
  [/[“”‘’]/, "aspas curvas"],
];
const textosNovos = pacotes.filter((p) => p.json.resumo).map((p) => ({ onde: p.arquivo + " resumo", texto: p.json.resumo }));
// a descrição só entra na guarda nos 11 pacotes que ganharam uma nesta rodada
const COM_DESCRICAO_NOVA = ["arsenal-de-ryuma", "ciclo-adaptacao-mahoraga", "flugel", "guarda-da-lamina-divina", "lime-neds", "manipulacao-do-ceu", "olhos-de-agulha", "reavaliacao", "the-crimsom-queen", "treino-de-cacada", "treino-de-escudos"];
for (const p of pacotes) if (COM_DESCRICAO_NOVA.includes(p.json.id)) textosNovos.push({ onde: p.arquivo + " descricao", texto: p.json.descricao });
const achados = [];
for (const { onde, texto } of textosNovos) for (const [re, motivo] of VICIOS) if (re.test(texto)) achados.push(`${onde}: ${motivo}`);
t("nenhum resumo ou descrição nova traz os sinais de texto de IA", achados, []);
t("nenhum resumo repete o nome do pacote como definição", pacotes.filter((p) => String(p.json.resumo ?? "").toLowerCase().startsWith(p.json.nome.toLowerCase() + " é")).map((p) => p.arquivo), []);
t("as 11 descrições novas existem e têm mais de 40 caracteres", COM_DESCRICAO_NOVA.filter((id) => (pacotes.find((p) => p.json.id === id)?.json.descricao ?? "").length < 40), []);
// controle negativo da guarda: ela tem de reprovar texto com os vícios
const ruim = "Oferece uma experiência mais dinâmica, garantindo diversas opções; além disso, serve como base " + DASH + " poderosa.";
t("controle negativo: a guarda pega o texto cheio de vícios", VICIOS.filter(([re]) => re.test(ruim)).length >= 6, true);

/* ------------------------------------------------------------ */
/* CATEGORIA E RESUMO AUTOMÁTICOS                                */
/* ------------------------------------------------------------ */
t("categoria declarada vale", L.categoriaDe({ categoria: "treinos", acrescenta: { origens: [{ nome: "x" }] } }), "treinos");
t("categoria desconhecida cai no automático", L.categoriaDe({ categoria: "marte", acrescenta: { origens: [{ nome: "x" }] } }), "origens");
t("automático: origem, clã, treino, talento, arma, feitiço, aba, regra, nada",
  [
    L.categoriaDe({ acrescenta: { origens: [{}] } }), L.categoriaDe({ acrescenta: { clas: [{}] } }),
    L.categoriaDe({ acrescenta: { treinamentos: [{}] } }), L.categoriaDe({ acrescenta: { talentos: [{}] } }),
    L.categoriaDe({ acrescenta: { armas: [{}] } }), L.categoriaDe({ feiticos: [{}] }),
    L.categoriaDe({ permite: ["pacto"] }), L.categoriaDe({ regrasAfty: { almaComoAfty: true } }), L.categoriaDe({}),
  ],
  ["origens", "origens", "treinos", "talentos", "equipamentos", "tecnicas", "ferramentas", "regras", "outros"]);
t("resumo declarado vale", L.resumoDe({ resumo: "  Faz isso  ", descricao: "Outra coisa." }), "Faz isso");
t("sem resumo, a primeira frase da descrição", L.resumoDe({ descricao: "Primeira frase aqui. Segunda frase." }), "Primeira frase aqui.");
t("frase longa é cortada na palavra, com reticências", L.resumoDe({ descricao: "palavra ".repeat(40) }).endsWith("…"), true);
t("o corte não passa de 110", L.resumoDe({ descricao: "palavra ".repeat(40) }).length <= 110, true);
t("sem descrição nem resumo, vazio", L.resumoDe({}), "");
t("resumo declarado acima do teto é cortado", L.resumoDe({ resumo: "x ".repeat(200) }).length <= L.RESUMO_MAX, true);

/* ------------------------------------------------------------ */
/* OS ITENS                                                      */
/* ------------------------------------------------------------ */
const guerra = C.fonteEmbutida("guerra-de-feiticeiros");
const yna = AD.normalizarPacote(pacotes.find((p) => p.json.id === "yna").json);
const hcorp = AD.normalizarPacote(pacotes.find((p) => p.json.id === "h-corp").json);
const antigo = AD.normalizarPacote(pacotes.find((p) => p.json.id === "regras-grimorio").json);
const copiaGuerra = C.compor(guerra, "player", {});
const itens = L.montarItens({
  biblioteca: [yna, hcorp, { ...yna, nome: "Duplicado" }],
  naFicha: [copiaGuerra, antigo],
  embutidos: [guerra],
  estadoDe: { "regras-grimorio": { estado: "só na ficha" }, yna: { estado: "desatualizado", versaoBiblioteca: "2.0.0" } },
  avisosDe: { "regras-grimorio": ["Continua ligado."] },
  barradoDe: (p) => (p.id === "h-corp" ? ["Criação de Armas"] : []),
});
const porId = (id) => itens.find((i) => i.id === id);
t("cada id aparece uma vez", itens.map((i) => i.id), ["guerra-de-feiticeiros", "yna", "h-corp", "regras-grimorio"]);
t("o embutido usa a fonte do app e vem marcado", [porId("guerra-de-feiticeiros").embutido, porId("guerra-de-feiticeiros").pacote === guerra], [true, true]);
t("ligado é o que a ficha carrega", itens.map((i) => i.ligado), [true, false, false, true]);
t("a categoria vira o tipo do item", itens.map((i) => i.tipo), ["regras", "origens", "origens", "regras"]);
t("pacote só na ficha fica fora da biblioteca", [porId("regras-grimorio").foraDaBiblioteca, porId("regras-grimorio").naBiblioteca], [true, false]);
t("pacote da biblioteca está nela", [porId("yna").naBiblioteca, porId("yna").foraDaBiblioteca], [true, false]);
t("aviso do parcial chega ao item", porId("regras-grimorio").avisos, ["Continua ligado."]);
t("desatualizado vira aviso", porId("yna").avisos, ["A biblioteca tem a versão 2.0.0."]);
t("pacote barrado avisa quem barra e não está ligado", porId("h-corp").avisos, ["Não liga junto com Criação de Armas."]);
t("o filtro Ligados", itens.filter(FILTROS_PASSA("ligados")).map((i) => i.id), ["guerra-de-feiticeiros", "regras-grimorio"]);
t("o filtro Aviso", itens.filter(FILTROS_PASSA("aviso")).map((i) => i.id), ["yna", "h-corp", "regras-grimorio"]);
function FILTROS_PASSA(id) { return L.FILTROS_DE_ADDON.find((f) => f.id === id).aplica; }
t("a busca acha pelo nome de uma entrada que o pacote acrescenta", L.textoDeBuscaDoAddon(porId("h-corp")).includes("Zodíaco") || L.textoDeBuscaDoAddon(porId("h-corp")).includes("Boulos"), true);
t("a busca acha por uma palavra que só a descrição tem", L.textoDeBuscaDoAddon(porId("yna")).includes(String(porId("yna").pacote.descricao).split(" ").at(-2)), true);
t("a busca acha pelo resumo e pela categoria", [L.textoDeBuscaDoAddon(porId("yna")).includes("Kitsune"), L.textoDeBuscaDoAddon(porId("yna")).includes("Origens e Clãs")], [true, true]);

/* ------------------------------------------------------------ */
/* O QUE O PACOTE MUDA                                           */
/* ------------------------------------------------------------ */
const rotulos = { familia: (id) => ({ talentos: "Talento", treinamentos: "Linha de Treinamento", melhoriasSuperiores: "Melhoria Superior", lendarias: "Habilidade Lendária", treinosEspeciais: "Treino Especial", opcoesTalento: "Opção de Talento" })[id] ?? id, liberacao: (id) => id, primitiva: (id) => "Prim " + id };
const secoes = L.oQueMuda(copiaGuerra, rotulos);
t("seções do Guerra no Player", secoes.map((s) => s.titulo), ["Acrescenta", "Remenda", "Regras", "Libera"]);
t("a seção Regras traz as regras em português", secoes.find((s) => s.titulo === "Regras").linhas.includes("PV Final ×2"), true);
t("a seção Acrescenta nomeia as entradas, no plural certo", secoes[0].linhas.some((l) => l.startsWith("3 Talentos: ")), true);
t("singular quando há um só", secoes[0].linhas.some((l) => l.startsWith("1 Linha de Treinamento: ")), true);
t("plural de rótulo composto", secoes.find((s) => s.titulo === "Remenda").linhas, ["11 Melhorias Superiores", "16 Habilidades Lendárias", "1 Treino Especial"]);
t("os ids de reabertura viram nomes", secoes.find((s) => s.titulo === "Libera").linhas.filter((l) => l.startsWith("Reabre")), ["Reabre Versatilidade Extrema", "Reabre Alma Livre", "Reabre Atributo"]);
t("a criatura não vê as regras de PV", L.oQueMuda(C.compor(guerra, "afty", {}), rotulos).find((s) => s.titulo === "Regras").linhas.some((l) => l.startsWith("PV Final")), false);
t("o que não tem conteúdo não vira seção", L.oQueMuda({ acrescenta: {} }, rotulos), []);
t("lista com mais de 6 nomes diz quantos faltam", L.oQueMuda({ acrescenta: { talentos: Array.from({ length: 9 }, (_, i) => ({ nome: "T" + i })) } }, rotulos)[0].linhas[0].endsWith("e mais 3"), true);
t("pluralização das 19 famílias de Addon",
  ["Origem", "Clã do Herdado", "Aptidão Amaldiçoada", "Especialização", "Tipo de Dano", "Arma", "Habilidade de Especialização", "Marcador de Invocação", "Característica Amaldiçoada", "Linha de Treinamento", "Treino Especial", "Opção de Talento", "Melhoria Superior", "Habilidade Lendária", "Habilidade Ápice", "Condição", "Talento", "Escudo", "Uniforme"].map(L.pluralizaRotulo),
  ["Origens", "Clãs do Herdado", "Aptidões Amaldiçoadas", "Especializações", "Tipos de Dano", "Armas", "Habilidades de Especialização", "Marcadores de Invocação", "Características Amaldiçoadas", "Linhas de Treinamento", "Treinos Especiais", "Opções de Talento", "Melhorias Superiores", "Habilidades Lendárias", "Habilidades Ápice", "Condições", "Talentos", "Escudos", "Uniformes"]);
t("humanizaId", ["len_versatilidade_extrema", "tal_alma_livre", "cnj_agilidade_no_campo_de_batalha", "atributo"].map(L.humanizaId), ["Versatilidade Extrema", "Alma Livre", "Agilidade no Campo de Batalha", "Atributo"]);

/* ------------------------------------------------------------ */
/* A DESCRIÇÃO EM BLOCOS DE LEITURA                              */
/* ------------------------------------------------------------ */
t("frases: corta em ponto, exclamação e interrogação seguidos de maiúscula", L.frases("Dobra o PV. Quanto? Muito! Fim."), ["Dobra o PV.", "Quanto?", "Muito!", "Fim."]);
t("frases: abreviatura não termina a frase", L.frases("Treino Cônjuge Pt. 2 continua o anterior. Veja ex. aqui. Fim."), ["Treino Cônjuge Pt. 2 continua o anterior.", "Veja ex. aqui.", "Fim."]);
t("frases: decimal e sigla no meio ficam inteiros", L.frases("Soma 1,5 m de alcance. Vale com BT 6 ou mais."), ["Soma 1,5 m de alcance.", "Vale com BT 6 ou mais."]);
t("frases: texto sem pontuação final é uma frase só", L.frases("Sem ponto final"), ["Sem ponto final"]);
t("frases: vazio", [L.frases(""), L.frases(null)], [[], []]);
t("parecidas: a mesma coisa dita de dois jeitos", L.parecidas("Devolve o Talento Alma Livre à lista de Talentos da Ficha de Player.", "Devolve o Talento Alma Livre à lista do Player"), true);
t("parecidas: frases diferentes não", L.parecidas("Dobra o PV final sem dobrar a Alma.", "Fontes que consultam o PV Máximo usam o valor anterior."), false);

const longa = "Primeira frase do texto longo. Segunda frase do texto longo. Terceira frase do texto longo. Quarta frase do texto longo. Quinta frase do texto longo. Vale nos dois sistemas.";
const blocosLonga = L.blocosDaDescricao(longa);
t("a descrição de um parágrafo só vira vários, de até duas frases", blocosLonga.map((b) => b.tipo + ":" + L.frases(b.texto).length), ["p:2", "p:2", "p:2"]);
t("a frase curta do fim cola no parágrafo anterior", blocosLonga.at(-1).texto.endsWith("Vale nos dois sistemas."), true);
t("nenhuma frase se perde na divisão", blocosLonga.map((b) => b.texto).join(" "), longa);
t("descrição curta é um parágrafo", L.blocosDaDescricao("Uma frase só.").length, 1);
t("quebra de linha do autor é respeitada e a lista com traço vira item", L.blocosDaDescricao("Abre:\n- um\n- dois\nFecha.").map((b) => b.tipo), ["p", "item", "item", "p"]);
t("a primeira frase que só repete o resumo sai", L.blocosDaDescricao("Dobra o PV final sem dobrar a Alma. Fontes usam o valor anterior.", { resumo: "Dobra o PV final sem dobrar a Alma e isenta as Passivas" }).map((b) => b.texto), ["Fontes usam o valor anterior."]);
t("sem resumo nada sai", L.blocosDaDescricao("Dobra o PV final sem dobrar a Alma. Fontes usam o valor anterior.").length, 1);
t("só a primeira linha é comparada com o resumo", L.blocosDaDescricao("Outra coisa aqui.\nDobra o PV final sem dobrar a Alma.", { resumo: "Dobra o PV final sem dobrar a Alma e mais" }).length, 2);
t("descrição vazia não dá bloco", L.blocosDaDescricao(""), []);
const recorte = L.recortaBlocos(L.blocosDaDescricao("Palavra palavra palavra. ".repeat(40)), 200);
t("o recorte entra até passar do limite e diz que há mais", [recorte.visiveis.length < L.blocosDaDescricao("Palavra palavra palavra. ".repeat(40)).length, recorte.resto], [true, true]);
t("o recorte de um texto curto não tem resto", L.recortaBlocos(L.blocosDaDescricao("Curto.")), { visiveis: [{ tipo: "p", texto: "Curto." }], resto: false });
t("o recorte sempre mostra ao menos um bloco", L.recortaBlocos([{ tipo: "p", texto: "x".repeat(900) }, { tipo: "p", texto: "y" }], 100).visiveis.length, 1);
// Uma frase só, de mais de 420 caracteres e sem ponto e vírgula, não tem onde ser cortada sem mudar o sentido. O que a divisão
// garante é que várias frases nunca se juntem num parágrafo de mais de 450.
t("nenhum parágrafo de várias frases do repositório passa de 450", pacotes.flatMap((p) => L.blocosDaDescricao(p.json.descricao, { resumo: p.json.resumo }).filter((b) => b.tipo === "p" && b.texto.length > 450 && L.frases(b.texto).length > 1).map(() => p.arquivo)), []);
t("o item guarda se o resumo é declarado", [porId("yna").resumoDeclarado, L.montarItens({ naFicha: [{ id: "x", nome: "X", descricao: "Texto. Mais." }] })[0].resumoDeclarado], [true, false]);

/* ------------------------------------------------------------ */
/* A LISTA LATERAL ESTENDIDA                                     */
/* ------------------------------------------------------------ */
const base = [
  { id: "a", nome: "Alfa", tipo: "x", nivel: 0, texto: "banana" },
  { id: "b", nome: "Beta", tipo: "y", nivel: 0, texto: "maçã" },
  { id: "c", nome: "Gama", tipo: "x", nivel: 0, texto: "pera", fixo: true },
];
const tipos = [{ value: "x", label: "X" }, { value: "y", label: "Y" }];
const ids = (r) => r.grupos.flatMap((g) => g.itens.map((i) => i.id));
t("sem as opções novas nada muda (busca pelo nome)", ids(LL.organizarLista(base, { termo: "alf", agrupar: false })), ["a"]);
t("textoDe troca o que a busca varre", ids(LL.organizarLista(base, { termo: "maca", textoDe: (i) => i.texto })), ["b"]);
t("a busca varre o texto novo e não mais o nome", ids(LL.organizarLista(base, { termo: "alfa", textoDe: (i) => i.texto })), []);
t("predicados filtram além do Tipo", ids(LL.organizarLista(base, { predicados: [(i) => i.tipo === "x"] })), ["a", "c"]);
t("predicado e Tipo juntos", ids(LL.organizarLista(base, { predicados: [(i) => i.id !== "a"], tiposAtivos: ["x"] })), ["c"]);
t("destaque sem agrupar vai para o começo", ids(LL.organizarLista(base, { destaqueDe: (i) => i.fixo, agrupar: false })), ["c", "a", "b"]);
const agrupado = LL.organizarLista(base, { destaqueDe: (i) => i.fixo, rotuloDestaque: "Fixos", agrupar: true, tipos });
t("destaque agrupado é o primeiro grupo, com o rótulo", agrupado.grupos.map((g) => [g.tipo, g.rotulo, g.itens.map((i) => i.id)]), [[LL.TIPO_DESTAQUE, "Fixos", ["c"]], ["x", "X", ["a"]], ["y", "Y", ["b"]]]);
t("o destaque não aparece de novo no grupo do Tipo", agrupado.grupos.flatMap((g) => g.itens).length, 3);
t("destaque que o filtro esconde some e não deixa grupo vazio", LL.organizarLista(base, { destaqueDe: (i) => i.fixo, agrupar: true, tipos, termo: "alfa" }).grupos.map((g) => g.tipo), ["x"]);
t("o total conta tudo e o visível conta o filtrado", [LL.organizarLista(base, { termo: "alf" }).total, LL.organizarLista(base, { termo: "alf" }).visiveis], [3, 1]);
t("as setas andam na ordem visível com o destaque na frente", LL.vizinhoNaLista(agrupado.grupos, "c", 1), "a");

console.log(bad.length ? "FALHAS (" + bad.length + "):\n" + bad.join("\n") : "TODOS OS " + ok + " ASSERTS PASSARAM");
process.exitCode = bad.length ? 1 : 0;
