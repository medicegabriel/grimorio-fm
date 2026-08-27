/* A EXPANSÃO DE DOMÍNIO PASSA A LER O MOTOR, 2026-08-26.

   As quatro respostas do autor na varredura dos Interlúdios:

     1. "Domínio passa a ler o Motor", e junto veio a fórmula que faltava:
        Conflito de Domínio = 1d10 + Nível de Domínio + metade do ND + Outros.
        Os "Outros" são o canal `conflitoDominio`, e a 1ª e a 3ª etapa do Treino
        de Domínios são as duas primeiras fontes dele.
     2. "Precisamos de arrumar algum local para colocar a Vida, RD e Máximo de
        Paredes." A Técnica de Barreira nunca teve tela: o que a ficha mostrava
        era o PV do DOMO, e o domo é doze paredes.
     3. O PE Temporário funciona como o da 2.5.2: mesma barra do PE, pintada por
        cima com outra cor.
     4. Modificação Completa é SÓ PRÊMIO do Treino de Domínios, e não entra no
        catálogo como aptidão comprável.

   E as três da segunda rodada de perguntas (2026-08-26, mais tarde):

     5. o cálculo de barreira segue o texto das DUAS aptidões, e ele fica
        `10 + (ND × Nível de Barreira) + Outros` com Paredes Resistentes;
     6. ⚠ TUDO QUE É BARREIRA VALE UM NÚMERO DE PAREDES: a Cortina vale 3 e a
        Expansão de Domínio vale 12. O 12 estava marcado "A CONFIRMAR" desde a
        portabilidade, e a Cortina não tinha número nenhum;
     7. o Conflito de Domínio mora junto com a Expansão, e a casca de PE tem de
        aparecer na Ficha Final E no Combat Tracker.

   ⚠ O que este arquivo NÃO cobre é a aparência. Não dá para testar render aqui,
   e o teste visual é o deploy. O que se prova é o NÚMERO chegando. */
import { readFileSync } from "node:fs";
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

/* A sessão da Ficha lê `localStorage` ao carregar. Aqui não existe, e o módulo
   engole a falha, mas as funções puras que interessam nem chegam lá. */
globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const DOM = await import(R + "afty-dominios.js");
const EF = await import(R + "afty-efeitos.js");
const APT = await import(R + "afty-aptidoes.js");
const TRE = await import(R + "afty-treinamentos.js");
const SES = await import(R + "ficha/ficha-sessao.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* Um Conjurador ND 20 com DOM 5, BAR 3 e uma expansão Completa escrita. */
const ficha = (treinamentos = {}, extra = {}) => {
  const c = createBlankAfty();
  c.core.nd = 20;
  c.core.tipo = "conjurador";
  c.core.patamar = "comum";
  c.core.origem = { id: "inato" };
  c.aptidoes = { dom: 5, bar: 3 };
  c.aptidoesAmaldicoadas = [
    "tecnicas_de_barreira", "expansao_de_dominio_incompleta", "expansao_de_dominio_completa",
  ];
  c.dominios = [{ id: "d1", nome: "Teste", versao: "completa", efeitos: [] }];
  c.treinamentos = treinamentos;
  return { ...c, ...extra };
};
const dom = (treinamentos) => deriveAfty(ficha(treinamentos)).dominios;

/* ============================================================ */
/* 1. Os seis canais existem e estão no passe pós-aptidão        */
/* ============================================================ */

const NOVOS = ["pvParede", "rdParede", "maxParedes", "areaDominio", "efeitosDominio", "conflitoDominio"];
for (const id of NOVOS) {
  t(`canal ${id} existe`, EF.EFEITO_CANAIS.some((c) => c.id === id), true);
  /* ⚠ Sem isto o canal existe e não chega: o `resumoDominios` roda ANTES do
     estágio principal, e a fonte mais provável é uma Linha de Treinamento, que
     entra pelo montante. É o mesmo encaixe do `imbuicoesEstilo`. */
  t(`canal ${id} roda no passe pos-aptidao`, EF.CANAIS_POS_APTIDAO.includes(id), true);
}
t("o peTemporario tambem existe", EF.EFEITO_CANAIS.some((c) => c.id === "peTemporario"), true);
/* Ele NÃO é pós-aptidão: quem o consome é a sessão, depois de tudo. */
t("mas ele nao e pos-aptidao", EF.CANAIS_POS_APTIDAO.includes("peTemporario"), false);

/* Todo canal novo tem de estar num grupo, senão some do seletor do Motor. */
const agrupados = new Set(EF.EFEITO_CANAL_GRUPOS.flatMap((g) => g.itens.map((i) => i.id)));
for (const id of [...NOVOS, "peTemporario"]) t(`${id} esta agrupado`, agrupados.has(id), true);

/* ============================================================ */
/* 2. O Treino de Domínios deixou de ser a linha de zero         */
/* ============================================================ */

const LINHA_DOM = TRE.getTreinamento("dominios");
const declaradosDom = LINHA_DOM.etapas.reduce((n, e) => n + (e.efeitos?.length ?? 0), 0);
t("as 4 etapas de Dominios declaram efeito agora", declaradosDom, 4);

const base = dom({});
const d1 = dom({ dominios: 1 });
const d2 = dom({ dominios: 2 });
const d3 = dom({ dominios: 3 });
const d4 = dom({ dominios: 4 });

/* 1ª e 3ª: +1 no Conflito cada. */
t("sem treino o conflito e DOM 5 + metade do ND 20", base.conflito.bonus, 15);
t("a 1a etapa soma 1", d1.conflito.bonus, 16);
t("a 2a nao mexe no conflito", d2.conflito.bonus, 16);
t("a 3a soma outro", d3.conflito.bonus, 17);
t("o dado e 1d10", [base.conflito.dados, base.conflito.faces], [1, 10]);

/* 2ª: +3 metros de área. ⚠ Metros, e não vezes o Bônus de Treinamento. */
t("sem treino a area da Completa e 9 metros", base.lista[0].area, "9 metros");
t("a 2a etapa poe 3 metros", d2.lista[0].area, "12 metros");
t("e o TEXTO do dominio diz o mesmo numero",
  d2.lista[0].texto.includes("área esférica de 12 metros"), true);

/* 4ª: +1 efeito. */
t("DOM 5 comporta 3 efeitos", base.maxEfeitos, 3);
t("a 4a etapa poe mais um", d4.maxEfeitos, 4);

/* As partes do hover nomeiam a fonte, e as duas pegas do Conflito aparecem
   separadas: elas são etapas diferentes da mesma linha. */
t("o hover do conflito mostra as duas etapas",
  d4.conflito.partes.map((p) => p.label),
  ["Nível de Aptidão em Domínio", "Metade do Nível de Desafio", "Treino de Domínios", "Treino de Domínios"]);

/* ⚠ O Conflito é da CRIATURA, e não de uma expansão: ele existe sem nenhuma
   escrita na ficha. Quem confronta é o feiticeiro. */
const semExpansao = createBlankAfty();
semExpansao.core.nd = 20;
semExpansao.core.tipo = "conjurador";
semExpansao.core.origem = { id: "inato" };
semExpansao.aptidoes = { dom: 3 };
const dSem = deriveAfty(semExpansao).dominios;
t("o conflito existe sem expansao escrita", dSem.conflito.bonus, 13);
t("e a lista de expansoes esta vazia", dSem.lista.length, 0);

/* Sem Nível de Domínio nenhum o bônus é só a metade do ND, e a tela é quem
   decide não mostrar. O motor não esconde número. */
const semDom = createBlankAfty();
semDom.core.nd = 10;
semDom.core.tipo = "combatente";
semDom.core.origem = { id: "inato" };
t("sem DOM o conflito e so metade do ND", deriveAfty(semDom).dominios.conflito.bonus, 5);

/* ============================================================ */
/* 3. Técnicas de Barreira ganhou números próprios               */
/* ============================================================ */

t("a base da parede e 5 + BAR x metade do ND", base.barreira.pvParede, 5 + 3 * 10);
t("sem fonte a parede nao tem RD", base.barreira.rdParede, 0);
t("e o maximo e as 6 do livro", base.barreira.maxParedes, 6);
t("a aptidao e o que faz a barreira existir", base.barreira.tem, true);

const b1 = dom({ barreiras: 1 });
const b3 = dom({ barreiras: 3 });
const b4 = dom({ barreiras: 4 });
t("a 1a etapa poe 10 de PV na parede", b1.barreira.pvParede - base.barreira.pvParede, 10);
/* ⚠ 30, e não 20. A 2ª etapa da linha sobe o Nível de Aptidão em Barreiras em 1,
   e o PV da parede é 5 + BAR × metade do ND: com o ND 20, um nível de BAR vale
   mais 10 sozinho. As três etapas somam 10 + 10 (do BAR) + 10. */
t("a 3a poe outros 10, e o nivel de BAR poe mais 10",
  b3.barreira.pvParede - base.barreira.pvParede, 30);
t("e o BAR subiu mesmo", deriveAfty(ficha({ barreiras: 3 })).aptidao.efetivo.bar, 4);
t("a 4a poe 2 no maximo de paredes", b4.barreira.maxParedes, 8);
/* O Completo dá RD igual ao Nível de Aptidão em Barreiras, e o valor sai da
   FICHA (`bar`), não de uma constante. Com a 2ª etapa o BAR já subiu para 4. */
t("o Completo da RD igual ao BAR", b4.barreira.rdParede, 4);

/* ⚠ O DOMO SOBE JUNTO, e é a consequência mais cara desta leva: ele vale
   `PAREDES_NO_DOMO × pvDaParede`, então +20 por parede é +240 no domo. Está
   anotado como pergunta ao autor em docs/a-fazer.md. */
t("o domo vale 12 paredes", base.lista[0].pvBarreira, DOM.PAREDES_NO_DOMO * base.barreira.pvParede);
t("e o Treino de Barreiras sobe o domo junto",
  b3.lista[0].pvBarreira - base.lista[0].pvBarreira, DOM.PAREDES_NO_DOMO * 30);

/* Sem a aptidão os números continuam calculáveis, e a tela é quem some. */
const semBarreira = createBlankAfty();
semBarreira.core.nd = 20;
semBarreira.core.tipo = "conjurador";
semBarreira.core.origem = { id: "inato" };
t("sem a aptidao o card nao aparece", deriveAfty(semBarreira).dominios.barreira.tem, false);

/* ---- A CORTINA vale 3 paredes, e o DOMO vale 12 (autor, 2026-08-26) ---- */
/* ⚠ A parede é a UNIDADE, e as duas estruturas maiores são múltiplos dela. É o
   que faz o Treino de Barreiras e as Paredes Resistentes alcançarem as três de
   uma vez, sem regra separada para cada. */
t("a cortina vale 3 paredes", base.barreira.pvCortina, 3 * base.barreira.pvParede);
t("e o domo vale 12", base.lista[0].pvBarreira, 12 * base.barreira.pvParede);
t("as constantes dizem o mesmo", [DOM.PAREDES_NA_CORTINA, DOM.PAREDES_NO_DOMO], [3, 12]);

/* ⚠ Ela só APARECE para quem tem a aptidão, e o número existe de qualquer jeito:
   o motor não esconde valor, a tela é que decide mostrar. */
t("sem a aptidao a cortina nao aparece", base.barreira.temCortina, false);
const comCortina = (() => {
  const c = ficha({});
  c.aptidoesAmaldicoadas = [...c.aptidoesAmaldicoadas, "cortina"];
  return deriveAfty(c).dominios;
})();
t("com a aptidao ela aparece", comCortina.barreira.temCortina, true);
t("e o numero e o mesmo", comCortina.barreira.pvCortina, base.barreira.pvCortina);

/* O hover da Cortina é o da parede com a multiplicação no fim, e não uma conta
   paralela: o leitor tem de ver de onde sai a parede antes do × 3. */
t("o hover da cortina termina na multiplicacao",
  base.barreira.partesPvCortina.at(-1), { label: "× 3 paredes", texto: "× 3" });
t("e comeca pelas partes da parede",
  base.barreira.partesPvCortina.slice(0, -1), base.barreira.partesPvParede);

/* ---- A FÓRMULA das duas aptidões, verbatim ---- */
/* Técnicas de Barreira → 5 + (metade do ND × BAR) + Outros
   Paredes Resistentes  → 10 + (ND × BAR) + Outros

   ⚠ O autor reconfirmou a segunda em 2026-08-26, escrita assim:
   "[ 10 + (ND * Nível de Barreira) + Outros ] usando Paredes Resistentes". */
const comPR = (treinamentos = {}) => {
  const c = ficha(treinamentos);
  c.aptidoesAmaldicoadas = [...c.aptidoesAmaldicoadas, "paredes_resistentes"];
  return deriveAfty(c);
};
const dPR = comPR();
t("sem Paredes Resistentes: 5 + metade do ND x BAR", base.barreira.pvParede, 5 + 10 * 3);
t("com Paredes Resistentes: 10 + ND x BAR", dPR.dominios.barreira.pvParede, 10 + 20 * 3);

/* E com o Treino completo o "Outros" entra: +20 do canal, e o BAR subiu para 4
   pela 2ª etapa. O número que o autor escreveria: 10 + (20 × 4) + 20. */
const dPRTreino = comPR({ barreiras: 4 });
t("o BAR sobe com a 2a etapa", dPRTreino.aptidao.efetivo.bar, 4);
t("e a formula fecha em 110", dPRTreino.dominios.barreira.pvParede, 10 + 20 * 4 + 20);
t("a cortina acompanha", dPRTreino.dominios.barreira.pvCortina, 3 * 110);
t("e o domo tambem", dPRTreino.dominios.lista[0].pvBarreira, 12 * 110);

/* As funções puras, medidas direto. */
t("rdDaParede sem fonte e zero", DOM.rdDaParede(0), 0);
t("maxParedes parte de 6", DOM.maxParedes(0), DOM.PAREDES_BASE);
t("pvCortina e tres vezes a parede",
  DOM.pvCortina(3, 20, true, 5), 3 * DOM.pvDaParede(3, 20, true, 5));
t("area em metros e numero", DOM.areaDominioMetros("completa", 2, false, 3), 12);
t("versao desconhecida devolve nulo", DOM.areaDominioMetros("nao_existe", 2), null);
/* ⚠ maxEfeitos NÃO abre vaga em quem não tem Domínio: com DOM 0 a expansão não
   existe, e somar daria vaga numa coisa que não está no ar. */
t("maxEfeitos com DOM 0 continua zero mesmo com bonus", DOM.maxEfeitos(0, 5), 0);
t("e com DOM 1 o bonus entra", DOM.maxEfeitos(1, 2), 3);

/* ============================================================ */
/* 4. PE Temporário: a casca que usa a barra do PE               */
/* ============================================================ */

const comCE = (etapas) => {
  const c = createBlankAfty();
  c.core.nd = 20; c.core.tipo = "conjurador"; c.core.patamar = "comum";
  c.core.origem = { id: "inato" };
  c.treinamentos = { controle_energia: etapas };
  return deriveAfty(c);
};
const dCE = comCE(4);
t("a 2a etapa entrega na CENA", dCE.peTemporario.combate.map((x) => x.valor), [4]);
t("e o Completo entrega por RODADA", dCE.peTemporario.rodada.map((x) => x.valor), [3]);
t("sem o treino nao ha casca", comCE(0).peTemporario.tem, false);

/* ⚠ A CHAVE leva o gatilho junto. As duas metades vêm da MESMA linha e o
   `efeitosDeTreino` carimba o mesmo nome nas duas: com o nome como chave, a
   regra do "topa, não acumula" comia uma delas e a rodada 1 dava 4 em vez de 7. */
t("as duas fontes tem chaves diferentes",
  [dCE.peTemporario.combate[0].chave, dCE.peTemporario.rodada[0].chave],
  ["combate:Treino de Controle de Energia", "rodada:Treino de Controle de Energia"]);

let s = SES.sessaoEmBranco(dCE);
const peCheio = dCE.pe;
t("a sessao nasce sem casca", SES.peTempTotal(s), 0);
t("e na rodada 0", s.rodada, 0);

/* Sair da rodada 0 é COMEÇAR A CENA: as duas cascas entram. */
s = SES.proximaRodada(s, dCE).sessao;
t("a rodada 1 entrega cena mais rodada", SES.peTempTotal(s), 7);
t("e o PE normal nao foi tocado", s.peAtual, peCheio);

/* O gasto come a casca PRIMEIRO. */
s = SES.gastaPe(s, 5);
t("gastar 5 come so a casca", [SES.peTempTotal(s), s.peAtual], [2, peCheio]);

/* A rodada seguinte devolve a fonte de rodada ao teto, e NÃO soma. A de cena
   não volta: ela é uma vez por cena. */
s = SES.proximaRodada(s, dCE).sessao;
t("a rodada 2 topa a fonte de rodada", SES.peTempTotal(s), 3);
s = SES.proximaRodada(s, dCE).sessao;
t("e a rodada 3 nao acumula", SES.peTempTotal(s), 3);

/* O que a casca não cobre desce no PE normal. */
s = SES.gastaPe(s, 10);
t("gasto maior que a casca desce no PE", [SES.peTempTotal(s), s.peAtual], [0, peCheio - 7]);

/* O descanso zera a casca e a rodada. */
s = SES.descansar(s, dCE);
t("o descanso zera a casca", SES.peTempTotal(s), 0);
t("e devolve o PE", s.peAtual, peCheio);
t("e volta para a rodada 0", s.rodada, 0);

/* A casca sobrevive ao recarregar, e lixo no armazenamento não a quebra. */
const salva = { ...SES.sessaoEmBranco(dCE), peTempFontes: { "rodada:X": 3, ruim: 0, "": 9 } };
t("a normalizacao guarda a fonte boa e joga o lixo fora",
  SES.normalizaSessao(JSON.parse(JSON.stringify(salva)), dCE).peTempFontes, { "rodada:X": 3 });
t("e um mapa invalido vira vazio",
  SES.normalizaSessao({ peTempFontes: [1, 2] }, dCE).peTempFontes, {});

/* ⚠ Sem `derived` nada acontece, que é o mesmo cuidado do `descansar`: quem não
   conseguiu calcular a ficha não sabe quanto entregar. */
const semDerived = SES.proximaRodada(SES.sessaoEmBranco(dCE), null).sessao;
t("sem derived a rodada nao entrega casca", SES.peTempTotal(semDerived), 0);
t("mas a rodada anda", semDerived.rodada, 1);

/* O Restringido chega no MESMO canal pelo Potencial Físico, porque a Estamina É
   o PE. As duas linhas nunca convivem: uma é só dele, a outra é fora dele. */
const restr = createBlankAfty();
restr.core.nd = 20; restr.core.tipo = "restringido"; restr.core.origem = { id: "restringido" };
restr.treinamentos = { potencial_fisico: 4 };
const dR = deriveAfty(restr);
t("o Potencial Fisico Completo entrega por rodada", dR.peTemporario.rodada.map((x) => x.valor), [3]);
t("e nao entrega na cena", dR.peTemporario.combate, []);

/* ============================================================ */
/* 5. Modificação Completa é SÓ PRÊMIO                           */
/* ============================================================ */
/* ⚠ Decisão do autor em 2026-08-26. Ela NÃO entra no catálogo de Aptidões, e por
   isso ninguém pode gastar vaga nela: quem a tem, ganhou do Treino de Domínios.
   O `grant` morto que ela declarava saiu, e o que ficou é o texto verbatim no
   `detalhe`, que é o caminho que já funcionava. */
t("nao existe aptidao Modificacao Completa no catalogo",
  APT.AFTY_APTIDOES.some((a) => a.nome === "Modificação Completa"), false);
const completoDom = TRE.getTreinamento("dominios").completo;
t("o grant morto saiu do Completo", completoDom.grant ?? null, null);
t("e o texto verbatim continua no detalhe",
  completoDom.detalhe.startsWith("Seu controle sobre os domínios é tão refinado"), true);
t("o beneficio continua dizendo que concede",
  completoDom.beneficio.includes("Você recebe a aptidão amaldiçoada Modificação Completa."), true);

/* ============================================================ */
/* 6. As duas telas usam O MESMO Vital                           */
/* ============================================================ */
/* ⚠ ASSERT DE ARQUIVO, e ele existe por um bug real. O painel de Encontros tinha
   uma CÓPIA do componente, e as duas já haviam divergido: o conserto da casca
   sobreposta entrou só na da Ficha, e o Combat Tracker ficou com a versão em que
   a faixa temporária sumia com a barra cheia. O autor pediu a casca "na Ficha
   Final e no Combat Tracker", e a extração é o que faz as duas andarem juntas.

   É a mesma história do fontes.jsx, extraído em 2026-08-05 pelo mesmo motivo. */
const fonte = (caminho) => readFileSync(new URL(`../src/systems/afty/${caminho}`, import.meta.url), "utf8");
const TELAS = ["ficha/AftyFicha.jsx", "encontros/PainelDeCombatente.jsx"];
for (const tela of TELAS) {
  const src = fonte(tela);
  t(`${tela} importa o Vital compartilhado`, src.includes('import { Vital } from "../ui/vital"'), true);
  t(`${tela} nao declara um Vital proprio`, src.includes("function Vital({"), false);
}
/* E o compartilhado tem as três coisas que a divergência havia comido. */
const VITAL = fonte("ui/vital.jsx");
t("o Vital pinta a casca por cima", VITAL.includes("afty-vital-casca"), true);
t("a cor da casca segue o vital", VITAL.includes('tipo === "pe" ? "var(--afty-petemp)"'), true);
t("e o rotulo da casca e parametro", VITAL.includes("rotuloTemp"), true);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
