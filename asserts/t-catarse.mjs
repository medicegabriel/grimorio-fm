/**
 * LOJA DE CATARSE: a moeda da mesa, e as duas coisas que ela compra.
 *
 * Pedido do autor em 2026-09-04. O pacote é `exemplo-loja-de-catarse.json`, e
 * ele traz SÓ a tabela de preços: a Loja inteira é verbo do motor, e o que o
 * addon acrescenta é o `permite` mais os números.
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. A ANOTAÇÃO ACUMULA. É a razão de a Loja existir e a única coisa que a
 *    separa do Funcionamento Básico, que faz o oposto. Um assert de valor
 *    sozinho não prova nada aqui: o teste compara as DUAS fontes no MESMO canal
 *    com o MESMO valor, e mede se o resultado é a soma ou o maior.
 * 2. As vagas chegam nos orçamentos, inclusive nos DOIS canais que nasceram
 *    com ela (`vagasMelhoria` e `vagasLendaria`).
 * 3. A vaga NÃO destrava o Alto Nível: comprar não substitui a Habilidade Geral.
 * 4. O gasto é reportado e nunca corrigido, que é a convenção do projeto.
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
const { normalizarPacote, validarPacote, precosDeCatarse, PRIMITIVAS } = await import(R + "afty-addons.js");
const C = await import(R + "afty-catarse.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const CAMINHO = fileURLToPath(new URL("./exemplo-loja-de-catarse.json", import.meta.url));
const pacote = normalizarPacote(JSON.parse(readFileSync(CAMINHO, "utf8")));

/* ============================================================ */
/* 1. O PACOTE E A PRIMITIVA                                     */
/* ============================================================ */
t("o pacote valida sem problema nenhum", validarPacote(pacote), []);
t("ele pede a primitiva da Loja", pacote.permite, ["catarse"]);
t("e a primitiva existe no registro",
  PRIMITIVAS.some((p) => p.id === "catarse"), true);
/* ⚠ O PREÇO É DADO DE PACOTE, e não constante do módulo. Mudar quanto custa um
   Talento não pode pedir código, que é a tese inteira dos Addons. */
t("os preços saem do addon, e não do módulo",
  precosDeCatarse({ addons: [pacote] }).talentos, 3);
t("sem addon nenhum não há preço", precosDeCatarse({ addons: [] }), {});
/* Com dois pacotes declarando a mesma família vence o MENOR, para a ordem de
   instalação não decidir por acidente. */
t("com dois pacotes, o menor preço vence",
  precosDeCatarse({ addons: [pacote, { catarse: { precos: { talentos: 1 } } }] }).talentos, 1);

/* O catálogo de famílias se valida, e o `canal: null` do texto é EXPLÍCITO. */
t("o catálogo de famílias não tem erro", C.validarCatalogoCatarse(), []);
t("a família de texto declara canal null, e não o omite",
  [C.getCatarseFamilia("texto").canal, "canal" in C.getCatarseFamilia("texto")], [null, true]);
t("família desconhecida devolve null em vez de quebrar",
  C.getCatarseFamilia("nao_existe"), null);

/* ============================================================ */
/* 2. A FICHA DE PROVA                                           */
/* ============================================================ */
const ficha = ({ compras = [], saldo = 30, nd = 24, tecnica = null, gerais = true } = {}) => {
  const f = createBlankAfty();
  f.core.nd = nd; f.core.nivel = nd;
  f.especializacoes = [{ id: "lutador", nivel: nd }];
  f.attributes = { forca: 16, destreza: 14, constituicao: 16, inteligencia: 12, sabedoria: 12, presenca: 12 };
  f.addons = [pacote];
  f.catarse = { saldo, compras };
  if (tecnica) f.core.tecnicaEfeitos = tecnica;
  // O Alto Nível só abre com a Habilidade Geral correspondente, e a vaga
  // comprada precisa de um portão aberto para virar número.
  if (gerais) f.habilidadesGerais = ["ger_melhoria_superior", "ger_habilidade_lendaria"];
  return deriveAfty(f);
};

const COMPRAS = [
  { id: "c1", familia: "talentos", nome: "Talento extra", custo: 3 },
  { id: "c2", familia: "melhoriasSuperiores", nome: "Melhoria extra", custo: 6 },
  { id: "c3", familia: "lendarias", nome: "Lendária extra", custo: 8 },
  { id: "c4", familia: "aptidoes", nome: "Aptidão extra", custo: 4 },
];
const sem = ficha({});
const com = ficha({ compras: COMPRAS });

t("o extrato fecha: ganho, gasto e restante",
  [com.catarse.ganho, com.catarse.gasto, com.catarse.restante, com.catarse.excedeu],
  [30, 21, 9, false]);
/* ⚠ UMA COMPRA VALE UMA VAGA, e não `custo` vagas. Confundir os dois faria um
   Talento caro render vários, que é o erro mais fácil deste módulo. */
t("cada compra vale UMA vaga, e o preço não vira quantidade",
  com.catarse.porCanal,
  { vagasTalento: 1, vagasMelhoria: 1, vagasLendaria: 1, vagasAptidao: 1 });

/* ============================================================ */
/* 3. AS VAGAS CHEGAM NOS ORÇAMENTOS                             */
/* ============================================================ */
/* ⚠ `vagasMelhoria` e `vagasLendaria` NASCERAM AQUI. Antes desta data o
   orçamento das duas saía SÓ do ND, sem canal nenhum somando por cima: era a
   única dupla de orçamento fechada para o Motor, e por isso nem Addon nem
   Habilidade conseguiam dar uma vaga delas. */
t("Melhoria Superior: a vaga comprada soma no total",
  [sem.altoNivel.melhorias.total, com.altoNivel.melhorias.total], [2, 3]);
t("Habilidade Lendária: idem",
  [sem.altoNivel.lendarias.total, com.altoNivel.lendarias.total], [2, 3]);
/* E as duas parcelas ficam SEPARADAS no derivado, para o hover poder dizer o
   que veio do nível e o que veio da Loja. */
t("e o que veio do ND fica separado do que veio do canal",
  [com.altoNivel.melhorias.vagasND, com.altoNivel.melhorias.vagasCanal,
    com.altoNivel.lendarias.vagasND, com.altoNivel.lendarias.vagasCanal],
  [2, 1, 2, 1]);
t("Talento: a vaga comprada soma nas exclusivas",
  [sem.habilidades.exclusivasTalento, com.habilidades.exclusivasTalento], [2, 3]);

/* ⚠ COMPRAR NÃO DESTRAVA O ALTO NÍVEL. O portão é a Habilidade Geral mais o ND,
   e a vaga é QUANTIDADE. Somar por fora do portão faria uma compra de loja
   valer mais do que a Habilidade Geral que o livro exige. */
const semGeral = ficha({ compras: COMPRAS, gerais: false });
t("sem a Habilidade Geral, a vaga comprada não vira Melhoria nenhuma",
  [semGeral.altoNivel.melhorias.total, semGeral.altoNivel.lendarias.total], [0, 0]);
/* E a vaga continua sendo emitida: o que falta é o portão, e não o canal. */
t("mas o canal continua emitindo, para o aviso poder dizer o que falta",
  semGeral.catarse.porCanal.vagasMelhoria, 1);
/* Abaixo do ND 21 não há Alto Nível nenhum, comprado ou não. */
t("no ND 12 a compra também não abre Alto Nível",
  ficha({ compras: COMPRAS, nd: 12 }).altoNivel.melhorias.total, 0);

/* ============================================================ */
/* 4. A ANOTAÇÃO COM MOTOR, E A ÚNICA COISA QUE IMPORTA NELA     */
/* ============================================================ */
/* ⚠ ESTE É O ASSERT QUE JUSTIFICA O MÓDULO. O autor pediu com todas as letras
   *"que se ACUMULA com Técnicas e etc"*, e o sistema já tinha duas fontes de
   efeito escrito (Funcionamento Básico e Passivo do jogador) que fazem o
   OPOSTO: as duas carregam `exclusivo` e disputam o maior valor por canal.

   Medir só "a Loja deu +5" não prova nada, porque o exclusivo também daria +5
   sozinho. O que separa as duas é o comportamento quando as DUAS existem no
   mesmo canal, e é isso que este bloco mede. */
const TECNICA = [{ canal: "defesa", expr: "5" }];
const ANOTACAO = {
  id: "cx", familia: "texto", nome: "Sopro do Vazio", custo: 5,
  texto: "Você respira o vazio e ele responde.",
  efeitos: [{ canal: "defesa", expr: "5" }],
};
const base = ficha({}).defesa;
const soTecnica = ficha({ tecnica: TECNICA }).defesa;
const soLoja = ficha({ compras: [ANOTACAO] }).defesa;
const asDuas = ficha({ tecnica: TECNICA, compras: [ANOTACAO] }).defesa;

t("sozinha, cada uma dá os mesmos +5",
  [soTecnica - base, soLoja - base], [5, 5]);
t("JUNTAS, elas SOMAM (a Loja não entra no pool exclusivo)",
  asDuas - base, 10);

/* CONTRAPROVA, e ela é o que dá sentido ao assert de cima: dois Funcionamentos
   Básicos no mesmo canal NÃO somam, porque os dois são do pool exclusivo. Se um
   dia a Loja ganhar `exclusivo` por engano, o assert de cima cai para 5 e este
   continua em 5, e a diferença entre os dois números é o diagnóstico. */
const doisExclusivos = (() => {
  const f = createBlankAfty();
  f.core.nd = 24; f.core.nivel = 24;
  f.especializacoes = [{ id: "lutador", nivel: 24 }];
  f.attributes = { forca: 16, destreza: 14, constituicao: 16, inteligencia: 12, sabedoria: 12, presenca: 12 };
  f.habilidadesGerais = ["ger_melhoria_superior", "ger_habilidade_lendaria"];
  f.core.tecnicaEfeitos = TECNICA;
  f.core.funcionamentosAdicionais = [{ id: "fb2", nome: "Outro", efeitos: [{ canal: "defesa", expr: "5" }] }];
  return deriveAfty(f).defesa;
})();
t("e dois Funcionamentos Básicos entre si continuam NÃO somando",
  doisExclusivos - base, 5);

/* A parcela leva o nome que a pessoa ESCREVEU, e não "Loja de Catarse": é o que
   ela procura no hover quando o número não bate. */
t("o hover nomeia a compra, e não a Loja",
  (ficha({ compras: [ANOTACAO] }).partes?.defesa ?? []).some((p) => p.label === "Sopro do Vazio"), true);

/* A anotação pode emitir QUALQUER canal, porque é o Motor inteiro na mão do
   jogador. Um canal de dano prova que ela não está presa aos de orçamento. */
t("a anotação alcança canal que não é de vaga",
  (() => {
    const a = { ...ANOTACAO, efeitos: [{ canal: "danoBonus", expr: "3" }] };
    const d = ficha({ compras: [a] });
    const b = ficha({});
    const dano = (x) => x.dano.entradas.find((e) => e.id === "basico")?.fixo ?? 0;
    return dano(d) - dano(b);
  })(), 3);

/* ⚠ E SÓ A FAMÍLIA `texto` CARREGA EFEITO. Uma compra de Talento com `efeitos`
   escritos à mão não pode virar um canal grátis por fora do preço da anotação. */
t("família que não é texto tem os efeitos descartados",
  C.normalizaCompraCatarse({
    familia: "talentos", custo: 1, efeitos: [{ canal: "defesa", expr: "99" }],
  }).efeitos, []);

/* ============================================================ */
/* 5. O QUE ELE REPORTA E NÃO CORRIGE                            */
/* ============================================================ */
const estourou = ficha({ compras: [{ id: "x", familia: "talentos", custo: 99 }], saldo: 5 });
t("gastar mais do que tem AVISA, e não apaga compra nenhuma",
  [estourou.catarse.excedeu, estourou.catarse.restante, estourou.catarse.compras.length],
  [true, -94, 1]);
/* ⚠ CUSTO NEGATIVO É RECUSADO, e não aparado. Ele seria uma compra que DÁ
   Catarse, e o saldo viraria uma máquina de fazer moeda a partir de uma linha
   de lista. */
t("custo negativo vira zero, e nunca crédito",
  C.normalizaCompraCatarse({ familia: "talentos", custo: -50 }).custo, 0);

/* Linha morta: família que não existe mais NÃO some, e o gasto dela continua
   contando. Sumir devolveria Catarse ao jogador sem ninguém pedir. */
const morta = ficha({ compras: [{ id: "m", familia: "familia_que_sumiu", custo: 7 }] });
t("compra de família desconhecida vira linha morta, e o gasto fica",
  [morta.catarse.compras.length, morta.catarse.mortas.length, morta.catarse.gasto],
  [0, 1, 7]);
t("e ela avisa, em vez de sumir calada",
  morta.catarse.avisos.some((a) => a.includes("família conhecida")), true);

/* A pendência conhecida do `vagasHabilidade` é DECLARADA, e não escondida: o
   canal existe, a compra funciona, e o contador da aba Habilidades ainda não o
   soma (ver docs/a-fazer.md, entrada de 2026-08-20). */
t("a família de Habilidade declara a pendência do canal",
  typeof C.getCatarseFamilia("habilidades").canalComPendencia, "string");
t("e a Loja avisa quando alguém compra por ele",
  ficha({ compras: [{ id: "h", familia: "habilidades", custo: 3 }] })
    .catarse.avisos.some((a) => a.includes("contador")), true);

/* ============================================================ */
/* 6. FICHA SEM A LOJA NÃO MUDA UM NÚMERO                        */
/* ============================================================ */
/* ⚠ O MESMO INVARIANTE DO `permite`: a primitiva vive no motor sempre, e quem
   não pediu não pode sentir. Aqui a garantia é mais forte que a de tela, porque
   a Loja emite CANAL: uma ficha sem `catarse` tem de derivar idêntica. */
const crua = (() => {
  const f = createBlankAfty();
  f.core.nd = 24; f.core.nivel = 24;
  f.especializacoes = [{ id: "lutador", nivel: 24 }];
  f.attributes = { forca: 16, destreza: 14, constituicao: 16, inteligencia: 12, sabedoria: 12, presenca: 12 };
  f.habilidadesGerais = ["ger_melhoria_superior", "ger_habilidade_lendaria"];
  return f;
})();
const semCampo = deriveAfty(crua);
const comCampoVazio = deriveAfty({ ...crua, catarse: { saldo: 0, compras: [] } });
t("ficha sem o campo e ficha com o campo vazio dão os mesmos stats",
  [semCampo.hp, semCampo.defesa, semCampo.pe, semCampo.cd],
  [comCampoVazio.hp, comCampoVazio.defesa, comCampoVazio.pe, comCampoVazio.cd]);
t("e o extrato de quem não usa fica zerado",
  [semCampo.catarse.ganho, semCampo.catarse.gasto, semCampo.catarse.efeitos.length], [0, 0, 0]);

/* ============================================================ */
/* 7. EDITAR SAI DO RASCUNHO, E NÃO DO DERIVADO                  */
/* ============================================================ */
/* ⚠ ESTE BLOCO NASCEU DO PRIMEIRO DEFEITO DA ABA, em 2026-09-04. O autor:
   *"O Motor de Automação da aba de Catarse não está funcionando"*, e não
   funcionava mesmo: a aba desenhava as linhas editáveis a partir de
   `derived.catarse.compras`, que é a lista JÁ SANEADA.

   O `normalizaCompraCatarse` descarta efeito sem canal, e com razão. Só que a
   linha que o botão "+ Efeito" cria nasce vazia: ela entrava no rascunho, o
   derive a descartava, e a aba re-renderizava sem ela. A linha sumia antes de
   dar tempo de digitar o canal, e o Motor nunca recebia nada. Da tela, isso é
   "o botão não faz nada".

   ⚠ ASSERT NÃO RENDERIZA, então ele não alcança "a linha some da tela". O que
   ele alcança é a CAUSA, lendo o TEXTO do arquivo: é a mesma técnica que o
   `t-ordem-modulos.mjs` usa para provar que uma folha não importa nada. Não é
   elegante, e é a diferença entre este defeito ter guarda e não ter. */
/* ⚠ OS COMENTARIOS SAEM ANTES DE MEDIR, e a primeira versao deste assert
   esqueceu: o proprio comentario que explica o defeito CITA
   `derived.catarse.compras`, entao a busca casava com a explicacao em vez de
   com o codigo. Um assert que le texto tem de ler o que EXECUTA. */
const semComentarios = (txt) => txt
  .replace(/\/\*[\s\S]*?\*\//g, " ")
  .replace(/(^|[^:])\/\/.*/g, "$1 ");
const telaCatarse = semComentarios(readFileSync(
  fileURLToPath(new URL("../src/systems/afty/AftyTabCatarse.jsx", import.meta.url)),
  "utf8",
));
t("a lista editável da aba sai do rascunho",
  /const compras = Array\.isArray\(draft\?\.catarse\?\.compras\)/.test(telaCatarse), true);
/* ⚠ O DERIVADO NÃO PODE VOLTAR A SER A FONTE DA LISTA. Ele é lido de propósito
   para os NÚMEROS (gasto, restante, avisos, preços), então o assert não proíbe
   a palavra: ele proíbe a leitura da LISTA DE COMPRAS. */
t("e o derivado não é lido como lista de compras",
  /derived\.catarse\??\.compras/.test(telaCatarse), false);

/* O saldo tem o mesmo problema pela mesma razão: apagar o campo para digitar
   outro número passa por string vazia, e o derivado devolveria 0 no meio. */
t("o saldo do campo também sai do rascunho",
  /const saldo = draft\?\.catarse\?\.saldo/.test(telaCatarse), true);

/* ⚠ E O CAMINHO DE EDIÇÃO NÃO SANEIA. O `patchCatarse` do criador cortava
   `saldo` e `custo` a cada tecla, que come o mesmo estado intermediário. Quem
   sanea é o resolvedor, e ele já trata NaN, negativo e lixo. */
const builder = semComentarios(readFileSync(
  fileURLToPath(new URL("../src/systems/afty/AftyCreatureBuilder.jsx", import.meta.url)),
  "utf8",
));
const corpoPatch = builder.slice(
  builder.indexOf("const patchCatarse"),
  builder.indexOf("const patchTecnicasCombate"),
);
t("o patchCatarse não corta número no caminho de edição",
  /Math\.trunc|Math\.max/.test(corpoPatch), false);

/* Contraprova de que o resolvedor continua fazendo o trabalho dele: o lixo que
   o caminho de edição deixa passar morre aqui. */
t("e o resolvedor sanea o que o caminho deixou passar",
  [C.normalizaCompraCatarse({ familia: "talentos", custo: "3a" }).custo,
    C.normalizaCompraCatarse({ familia: "talentos", custo: "" }).custo,
    C.normalizaCompraCatarse({ familia: "talentos", custo: "5" }).custo],
  [0, 0, 5]);
t("saldo vazio ou sujo vira zero no extrato, sem quebrar",
  [deriveAfty({ ...crua, catarse: { saldo: "", compras: [] } }).catarse.ganho,
    deriveAfty({ ...crua, catarse: { saldo: "12", compras: [] } }).catarse.ganho],
  [0, 12]);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
