/* GUARDA INABALÁVEL, 2026-08-26.

   A característica dos patamares Calamidade e Beyond, que existia como TODO no
   `afty-derive.js` desde julho ("depende do contador de ataques consecutivos,
   CU9") e como `derived.guarda = null`.

   O texto do autor, e o que cada pedaço virou:

     "inimigos de patamar Calamidade receberão um aumento de +5 na sua CA e em
      TRs no início da rodada, o qual será reduzido em 2 a cada ataque ou
      habilidade que ele sofra, independentemente de ser atingido, falhar ou ter
      sucesso no TR. Para inimigos de patamar Beyond, o aumento temporário em CA
      e TRs será de +10, também sendo reduzido a cada golpe."

     "O bônus se encerra previamente com a realização de um Raio Negro, a
      aplicação das condições Desprevenido, Desorientado, Confuso, Incapacitado,
      Exposto, Fragilizado, Atordoado, Paralisado ou Inconsciente ou a perda dos
      PVs temporários recebidos por essa característica."

     "A Guarda possui 5 x ND de Vida Temporaria para Inimigos Calamidade e
      10 x ND para Inimigos Beyond. E, caso a Vida Temporaria da Guarda chegue a
      0, a guarda é quebrada perdendo seus efeitos."

   E as quatro respostas que fecharam o comportamento de mesa:

     1. as duas metades VOLTAM CHEIAS a cada rodada;
     2. a Vida entra no MESMO POTE do PV Temporário e ACUMULA com as outras
        fontes dele;
     3. enquanto durar a condição, perde o bônus E os PVs temporários, e depois
        volta no início da rodada normalmente;
     4. "Incapacitado" foi RETIRADA do sistema, então são oito condições e não
        nove;
     5. ⚠ (segunda passada) o BÔNUS CHEGANDO A ZERO pelos golpes também quebra a
        Guarda, e quebrar leva o PV Temporário junto. São 3 golpes no Calamidade
        e 5 no Beyond, e é o caminho normal de derrubá-la.

   ⚠ Este arquivo prova NÚMERO, e não aparência. Render não se testa aqui, e o
   teste visual é o deploy. */
import { readFileSync } from "node:fs";
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const EF = await import(R + "afty-efeitos.js");
const FEI = await import(R + "afty-feiticos.js");
const SES = await import(R + "ficha/ficha-sessao.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* Um Combatente ND 12, e o patamar é o que muda de caso para caso. Combatente
   porque é o Tipo com a Defesa mais alta, então uma Defesa que não se mexeu
   aparece na hora. */
const ficha = (patamar) => {
  const c = createBlankAfty();
  c.core.nd = 12;
  c.core.tipo = "combatente";
  c.core.patamar = patamar;
  c.core.origem = { id: "inato" };
  return c;
};
const der = (patamar, guarda) => deriveAfty(ficha(patamar), guarda ? { guarda } : {});

/* ============================================================ */
/* 1. Os dois canais existem e estão no grupo Defesa             */
/* ============================================================ */
/* Nascem sem cliente, de propósito: foi a falta de DESTINO que deixou o Treino
   de Domínios sem automação nenhuma até esta mesma data. */

for (const id of ["guardaBonus", "guardaVida"]) {
  t(`canal ${id} existe`, EF.EFEITO_CANAIS.some((c) => c.id === id), true);
}
const grupoDefesa = EF.EFEITO_CANAL_GRUPOS.find((g) => g.label === "Defesa");
t("os dois canais estao no grupo Defesa",
  ["guardaBonus", "guardaVida"].every((id) => grupoDefesa.itens.some((c) => c.id === id)), true);
/* Canal fora de grupo nomeado cai em "Outros", e "Outros" tem de ficar vazio. */
t("nenhum canal ficou sem grupo", EF.canaisSemGrupo(), []);

/* ============================================================ */
/* 2. Quem NÃO é Calamidade nem Beyond não tem Guarda            */
/* ============================================================ */

for (const patamar of ["comum", "desafio"]) {
  const g = der(patamar).guarda;
  t(`${patamar} nao tem Guarda`, [g.ativa, g.bonusMax, g.vidaMax], [false, 0, 0]);
  t(`${patamar} nunca fica no ar`, g.noAr, false);
}

/* ============================================================ */
/* 3. Os tetos, medidos: +5 e 5 × ND, +10 e 10 × ND              */
/* ============================================================ */

const calam = der("calamidade").guarda;
t("Calamidade: bonus maximo 5", calam.bonusMax, 5);
t("Calamidade: Vida 5 x ND (ND 12)", calam.vidaMax, 60);
t("Calamidade tem Guarda", calam.ativa, true);

const beyond = der("beyond").guarda;
t("Beyond: bonus maximo 10", beyond.bonusMax, 10);
t("Beyond: Vida 10 x ND (ND 12)", beyond.vidaMax, 120);

/* O passo é o 2 do texto, e ele é dado e não número solto no meio do código. */
t("o passo por golpe e 2", calam.passoPorGolpe, 2);

/* ============================================================ */
/* 4. ⚠ A ESCADA DA PLANILHA, golpe a golpe                      */
/* ============================================================ */
/* A planilha (afty-formulas-base.md) tinha a Guarda como
     Calamidade: SWITCH(CU9; 0;5; 1;3; 2;1; 3;0; 4;0; 5;0)
     Beyond:     SWITCH(CU9; 0;10; 1;8; 2;6; 3;4; 4;2; 5;0)
   com `CU9` sendo o contador de golpes sofridos. Isto é a mesma escada, e o
   assert existe para provar que a regra nova REPRODUZ a tabela velha em vez de
   substituí-la por outra coisa parecida. */

const escada = (patamar, vida) => [0, 1, 2, 3, 4, 5]
  .map((golpes) => der(patamar, { golpes, vida }).guarda.bonus);

t("Calamidade repete a escada da planilha", escada("calamidade", 60), [5, 3, 1, 0, 0, 0]);
t("Beyond repete a escada da planilha", escada("beyond", 120), [10, 8, 6, 4, 2, 0]);

/* ⚠ E ZERAR O BÔNUS PELOS GOLPES QUEBRA. Este assert media o contrário até a
   segunda passada do autor, e a correção dele é o motivo de o arquivo existir:
   moer o bônus até zero é o caminho normal de derrubar a Guarda, não um estado
   intermediário. O degrau exato é onde a escada chega a zero. */
const moida = der("calamidade", { golpes: 3, vida: 60 }).guarda;
t("zerar o bonus pelos golpes quebra a Guarda",
  [moida.bonus, moida.noAr, moida.motivo], [0, false, "Bônus Zerado"]);
/* Um golpe antes, ela ainda está de pé com o último ponto de bônus. */
const quaseMoida = der("calamidade", { golpes: 2, vida: 60 }).guarda;
t("um golpe antes ela continua de pe", [quaseMoida.bonus, quaseMoida.noAr], [1, true]);
/* No Beyond o degrau é o quinto, e não o terceiro. */
t("o Beyond aguenta quatro golpes",
  [der("beyond", { golpes: 4, vida: 120 }).guarda.noAr,
   der("beyond", { golpes: 5, vida: 120 }).guarda.noAr], [true, false]);

/* ⚠ A CAUSA é nomeada, e não a consequência. Quando os golpes quebram, a casca
   é destruída junto, então `vida` também é zero: o motivo tem de dizer "Bônus
   Zerado" e não "Vida Temporária", senão o hover conta a história ao contrário. */
t("a causa vence a consequencia no motivo",
  der("calamidade", { golpes: 3, vida: 0 }).guarda.motivo, "Bônus Zerado");

/* ============================================================ */
/* 5. O bônus CHEGA na Defesa e nos CINCO TRs                    */
/* ============================================================ */
/* É o ponto todo da característica, e o que o `derived.guarda` sozinho não
   provaria: "um aumento de +5 na sua CA e em TRs". */

const semGuarda = der("calamidade", { golpes: 0, vida: 0 });     // Vida 0 = fora do ar
const comGuarda = der("calamidade", { golpes: 0, vida: 60 });
t("a Defesa sobe 5 com a Guarda no ar", comGuarda.defesa - semGuarda.defesa, 5);

const trDe = (d) => d.testes.resistencias.map((r) => r.bonus);
const delta = trDe(comGuarda).map((v, i) => v - trDe(semGuarda)[i]);
t("os CINCO TRs sobem 5", delta, [5, 5, 5, 5, 5]);
t("e sao mesmo cinco", trDe(comGuarda).length, 5);

/* O Beyond sobe 10, e o desgaste chega junto: dois golpes deixam +6. */
const bDois = der("beyond", { golpes: 2, vida: 120 });
const bFora = der("beyond", { golpes: 0, vida: 0 });
t("Beyond com dois golpes soma 6 na Defesa", bDois.defesa - bFora.defesa, 6);
t("Beyond com dois golpes soma 6 nos TRs", trDe(bDois).map((v, i) => v - trDe(bFora)[i]), [6, 6, 6, 6, 6]);

/* ⚠ E o HOVER fecha a conta. Número certo com detalhamento errado é bug (é a
   lição do `defesaAtributo`, 2026-08-24). */
const somaPartes = (lista) => (lista ?? []).reduce((s, p) => s + (p.valor ?? 0), 0);
t("o hover da Defesa soma a Defesa", somaPartes(comGuarda.partes.defesa), comGuarda.defesa);
t("a Guarda aparece nomeada no hover da Defesa",
  comGuarda.partes.defesa.some((p) => p.label === "Guarda Inabalável" && p.valor === 5), true);
t("o hover do bonus corrente fecha", somaPartes(der("calamidade", { golpes: 1, vida: 60 }).partes.guardaAtual), 3);
t("o hover da Vida fecha", somaPartes(comGuarda.partes.guardaVida), 60);
/* Os dois TETOS, que são o que o Preview do criador mostra. */
t("o hover do teto do bonus fecha", somaPartes(comGuarda.partes.guardaBonus), comGuarda.guarda.bonusMax);
t("o hover do teto da Vida fecha no Beyond", somaPartes(der("beyond").partes.guardaVida), 120);
/* ⚠ E o hover fecha TAMBEM com a Guarda quebrada, onde o bonus e zero: o leitor
   tem de ver o teto e a perda, e nao um zero sem explicacao. */
const quebrada = der("calamidade", { golpes: 0, vida: 0 });
t("o hover fecha com a Guarda quebrada", somaPartes(quebrada.partes.guardaAtual), 0);
t("e nomeia o motivo", quebrada.partes.guardaAtual.map((x) => x.label),
  ["Teto da Rodada", "Vida Temporária"]);

/* Sem sessão nenhuma (o criador, o Preview) a Guarda sai fora do ar e não
   mexe em número: fora de combate não há guarda erguida. */
t("sem sessao a Guarda nao soma na Defesa", der("calamidade").defesa, semGuarda.defesa);
t("mas o TETO continua a mostra", der("calamidade").guarda.bonusMax, 5);

/* ============================================================ */
/* 6. As OITO condições, e a que o autor tirou                   */
/* ============================================================ */

t("sao oito condicoes", SES.CONDICOES_QUEBRAM_GUARDA.length, 8);
/* ⚠ "Incapacitado" está no texto do livro e NÃO entra: o autor a retirou do
   sistema em 2026-08-26. Ela nunca existiu no CONDICOES_CATALOGO, e este assert
   é o que impede alguém de "consertar" isso lendo só o texto da regra. */
t("Incapacitado ficou de fora", SES.CONDICOES_QUEBRAM_GUARDA.includes("Incapacitado"), false);

/* ⚠ E as oito têm de EXISTIR no catálogo, senão a lista envelhece calada: uma
   condição renomeada no CONDICOES_CATALOGO deixaria a Guarda inquebrável por
   ela sem sintoma nenhum. É a mesma armadilha do requisito `nota`. */
const doCatalogo = new Set(Object.values(FEI.CONDICOES_CATALOGO).flat());
for (const nome of SES.CONDICOES_QUEBRAM_GUARDA) {
  t(`${nome} existe no catalogo de condicoes`, doCatalogo.has(nome), true);
}

/* ============================================================ */
/* 7. O CICLO INTEIRO, na sessão                                 */
/* ============================================================ */

const dCalam = der("calamidade");
const guardaDe = (s) => deriveAfty(ficha("calamidade"), { guarda: SES.entradaDaGuarda(s) }).guarda;

let s = SES.sessaoEmBranco(dCalam);
t("a sessao nasce sem Guarda erguida", [SES.pvTempTotal(s), guardaDe(s).noAr], [0, false]);

/* A cena começa: as duas metades entram. */
s = SES.iniciaCombate({ ...s, rodada: 1 }, dCalam);
t("o comeco da cena ergue a Guarda", [guardaDe(s).vida, guardaDe(s).bonus, guardaDe(s).noAr], [60, 5, true]);
t("e a Vida esta no pote do PV Temporario", SES.pvTempTotal(s), 60);
t("com o nome da fonte", Object.keys(s.pvTempFontes), [SES.FONTE_GUARDA]);

/* Dois golpes: o bônus cai 4 e a Vida não se mexe. Golpe não é dano. */
s = SES.sofreGolpeNaGuarda(SES.sofreGolpeNaGuarda(s, dCalam), dCalam);
t("dois golpes derrubam o bonus para 1", guardaDe(s).bonus, 1);
t("e a Vida continua cheia", guardaDe(s).vida, 60);

/* Desfazer um golpe contado a mais. */
t("desfazer devolve o bonus", guardaDe(SES.desfazGolpeNaGuarda(s)).bonus, 3);

/* ⚠ O TERCEIRO GOLPE QUEBRA, E LEVA A CASCA JUNTO. É a correção do autor na
   segunda passada, e é a diferença entre a Guarda ser um desgaste e ser uma
   coisa que o grupo derruba. */
const sMoida = SES.sofreGolpeNaGuarda(s, dCalam);
t("o terceiro golpe quebra a Guarda",
  [guardaDe(sMoida).noAr, guardaDe(sMoida).bonus, guardaDe(sMoida).motivo],
  [false, 0, "Bônus Zerado"]);
t("e a casca se perde junto", [guardaDe(sMoida).vida, SES.pvTempTotal(sMoida)], [0, 0]);
/* E o dano seguinte desce inteiro no PV, porque não há mais casca. */
t("o dano seguinte desce inteiro no PV",
  SES.aplicaDano(sMoida, 20).hpAtual, dCalam.hp - 20);
/* Desfazer NÃO ressuscita a casca, e é por isso que as telas desabilitam o
   botão com a Guarda quebrada. A rodada seguinte é quem reergue. */
t("desfazer nao ressuscita a casca", guardaDe(SES.desfazGolpeNaGuarda(sMoida)).vida, 0);
t("mas a rodada seguinte reergue tudo",
  (() => { const r = SES.proximaRodada(sMoida, dCalam).sessao; return [guardaDe(r).vida, guardaDe(r).bonus]; })(),
  [60, 5]);
/* Sem `derived` o contador sobe e a casca fica: quem não calculou a ficha não
   sabe o teto, então não sabe se aquele golpe quebrou. */
t("sem derived o golpe nao quebra nada", SES.pvTempTotal(SES.sofreGolpeNaGuarda(s)), 60);

/* Dano de 25: come a casca e não desce no PV. */
s = SES.aplicaDano(s, 25);
t("o dano come a casca primeiro", [guardaDe(s).vida, s.hpAtual], [35, dCalam.hp]);

/* Dano que ESTOURA a casca: o resto desce no PV e a Guarda quebra. */
s = SES.aplicaDano(s, 50);
t("estourar a casca desce o resto no PV", s.hpAtual, dCalam.hp - 15);
t("e quebra a Guarda", [guardaDe(s).noAr, guardaDe(s).bonus, guardaDe(s).motivo],
  [false, 0, "Vida Temporária"]);

/* A rodada seguinte reergue as duas metades: é a resposta 1 do autor. */
s = SES.proximaRodada(s, dCalam).sessao;
t("a rodada seguinte reergue a Guarda",
  [guardaDe(s).vida, guardaDe(s).bonus, guardaDe(s).golpes, guardaDe(s).noAr], [60, 5, 0, true]);

/* ⚠ E ela TOPA, não acumula: a rodada 3 continua com 60 e não com 120. */
s = SES.proximaRodada(s, dCalam).sessao;
t("a Vida topa em vez de acumular", SES.pvTempTotal(s), 60);

/* ============================================================ */
/* 8. Raio Negro e condições                                     */
/* ============================================================ */

/* O Raio Negro derruba as DUAS metades, e é evento: a rodada seguinte devolve. */
let sRaio = SES.encerraGuarda(s);
t("o Raio Negro derruba as duas metades",
  [guardaDe(sRaio).noAr, guardaDe(sRaio).vida, guardaDe(sRaio).motivo], [false, 0, "Raio Negro"]);
sRaio = SES.proximaRodada(sRaio, dCalam).sessao;
t("e a rodada seguinte devolve tudo", [guardaDe(sRaio).vida, guardaDe(sRaio).bonus], [60, 5]);

/* A condição derruba, e enquanto ela durar NADA volta. Resposta 3 do autor. */
let sCond = SES.defineCondicoes(s, [{ id: "c1", nome: "Atordoado", forca: "extrema", rodadas: null }]);
t("a condicao derruba as duas metades",
  [guardaDe(sCond).noAr, guardaDe(sCond).vida, guardaDe(sCond).motivo], [false, 0, "Atordoado"]);
sCond = SES.proximaRodada(sCond, dCalam).sessao;
t("e a rodada NAO reergue debaixo da condicao",
  [guardaDe(sCond).vida, guardaDe(sCond).bonus], [0, 0]);

/* Saída a condição, a rodada seguinte volta ao normal. */
sCond = SES.proximaRodada(SES.defineCondicoes(sCond, []), dCalam).sessao;
t("saida a condicao, a rodada volta ao normal", [guardaDe(sCond).vida, guardaDe(sCond).bonus], [60, 5]);

/* ⚠ TIRAR A CONDIÇÃO NO MEIO DA RODADA NÃO DEVOLVE A VIDA. A condição
   DESTRÓI, não suspende: "depois, volta no início da rodada normalmente". */
const sDestruida = SES.defineCondicoes(
  SES.defineCondicoes(s, [{ id: "c1", nome: "Exposto", forca: "forte", rodadas: null }]),
  [],
);
t("tirar a condicao no meio da rodada nao devolve a Vida", guardaDe(sDestruida).vida, 0);

/* Uma condição que NÃO está na lista não encosta na Guarda. */
const sOutra = SES.defineCondicoes(s, [{ id: "c2", nome: "Envenenado", forca: "media", rodadas: null }]);
t("condicao fora da lista nao derruba a Guarda", [guardaDe(sOutra).noAr, guardaDe(sOutra).vida], [true, 60]);

/* ⚠ O Desprevenido do Ritual Estendido conta, e conta porque é gravado com o
   mesmo NOME. Não é efeito colateral, é a regra: quem fica Desprevenido perde a
   Guarda, tenha ficado por um Feitiço inimigo ou pelo próprio Ritual. */
const sRitual = SES.defineCondicoes(s, [{ id: "ritual:desprevenido", nome: "Desprevenido", forca: "fraca", rodadas: null }]);
t("o Desprevenido do Ritual Estendido derruba a Guarda", guardaDe(sRitual).motivo, "Desprevenido");

/* ============================================================ */
/* 9. O descanso e quem não tem Guarda                           */
/* ============================================================ */

t("o descanso zera a casca e o contador",
  (() => {
    const d = SES.descansar(SES.sofreGolpeNaGuarda(s, dCalam), dCalam);
    return [SES.pvTempTotal(d), d.guardaGolpes, d.guardaEncerrada];
  })(), [0, 0, false]);

/* Uma criatura Comum passa pelo ciclo inteiro sem ganhar casca nenhuma. */
const dComum = deriveAfty(ficha("comum"));
const sComum = SES.proximaRodada(SES.iniciaCombate(SES.sessaoEmBranco(dComum), dComum), dComum).sessao;
t("o Comum nunca ganha casca de Guarda", SES.pvTempTotal(sComum), 0);

/* ⚠ E uma criatura que DEIXOU de ser Calamidade (o autor baixou o patamar no
   criador com a sessão aberta) perde a casca no vira-rodada, em vez de ficar com
   60 de PV temporário órfão para sempre. */
const sOrfa = SES.proximaRodada({ ...s }, dComum).sessao;
t("baixar o patamar limpa a casca da Guarda", SES.pvTempTotal(sOrfa), 0);

/* ============================================================ */
/* 10. A migração do `pvTempAtual` velho                         */
/* ============================================================ */
/* Sessão gravada antes de hoje tem um NÚMERO. Ele vira fonte com nome, e não é
   descartado: quem estava no meio de uma luta não perde a casca ao recarregar. */

const migrada = SES.normalizaSessao({ pvTempAtual: 7 }, dCalam);
t("o pvTempAtual velho vira fonte", SES.pvTempTotal(migrada), 7);
t("e nao vira Guarda", migrada.pvTempFontes[SES.FONTE_GUARDA], undefined);
t("sessao nova nasce com o mapa vazio", SES.normalizaSessao({}, dCalam).pvTempFontes, {});

/* ⚠ A GUARDA DRENA PRIMEIRO. Assunção anotada em a-fazer.md: o autor disse que
   a Vida soma com as outras cascas e não disse em que ordem o dano as come. */
const doisPotes = { ...s, pvTempFontes: { "PV Temporário": 10, [SES.FONTE_GUARDA]: 60 } };
const depois = SES.aplicaDano(doisPotes, 60);
t("a Guarda drena antes da outra casca",
  [depois.pvTempFontes[SES.FONTE_GUARDA], depois.pvTempFontes["PV Temporário"]], [undefined, 10]);

/* ============================================================ */
/* 11. As duas telas compartilham o componente                   */
/* ============================================================ */
/* Assert de ARQUIVO, e não de lógica, pelo mesmo motivo do `Vital`: assert de
   lógica não pega duplicação de componente, e foi duplicação que fez o Combat
   Tracker divergir da Ficha na casca de PE, em 2026-08-26. */

const fonte = (caminho) => readFileSync(new URL(`../src/systems/afty/${caminho}`, import.meta.url), "utf8");
for (const tela of ["ficha/AftyFicha.jsx", "encontros/PainelDeCombatente.jsx"]) {
  const src = fonte(tela);
  t(`${tela} importa a Guarda compartilhada`, src.includes('from "../ui/guarda"'), true);
  t(`${tela} nao declara uma Guarda propria`, src.includes("function Guarda({"), false);
  /* ⚠ E as duas escrevem condição pelo `defineCondicoes`. Escrever o campo cru
     deixaria o chefe com a Guarda de pé debaixo de um Atordoado, naquela tela. */
  t(`${tela} grava condicao pelo defineCondicoes`, src.includes("defineCondicoes(s, condicoes)"), true);
  /* A casca da Guarda tem de aparecer na barra de PV: ela é o mesmo pote. */
  t(`${tela} soma as fontes na barra de PV`, src.includes("temp={pvTempTotal(sessao)}"), true);
  /* ⚠ O golpe leva o `derived` junto. Sem ele o contador sobe, a Guarda NÃO
     quebra no terceiro golpe e a casca fica de pé, naquela tela só. */
  t(`${tela} manda o derived no golpe`, src.includes("sofreGolpeNaGuarda(s, derived)"), true);
}
/* E as duas mandam a Guarda corrente para o derive, senão o bônus não chega na
   Defesa daquela tela. */
t("a Ficha manda a Guarda ao derive", fonte("ficha/AftyFicha.jsx").includes("guarda: entradaDaGuarda("), true);
t("o Encontro manda a Guarda ao derive", fonte("encontros/usar-encontro-afty.js").includes("guarda: entradaDaGuarda("), true);

/* ⚠ E as classes da tira entram no CONTRATO DE TEMA. Classe que a Ficha desenha
   e o contrato não lista é classe que o usuário só descobre inspecionando o
   HTML, e aí ele escreve CSS em cima de um nome que ninguém prometeu manter. */
const TEMA = fonte("ficha/ficha-tema.js");
for (const cls of [".afty-guarda", ".afty-guarda-valor", ".afty-guarda-vida",
  ".afty-guarda-quebrada", ".afty-guarda-botao"]) {
  t(`${cls} esta no contrato de tema`, TEMA.includes(`seletor: "${cls}"`), true);
}

/* ⚠ E a marca de Quebrada NÃO é chip de aviso. O autor pediu o roxo do sistema
   em 2026-08-26: âmbar é para o que pede ação, e uma Guarda caída é o resultado
   da luta. Este assert existe para ninguém "padronizar" a marca de volta em
   chip, que é o caminho por onde ela veio. */
const GUARDA = fonte("ui/guarda.jsx");
t("Quebrada nao usa o chip de aviso", GUARDA.includes('className="afty-chip"'), false);
t("Quebrada usa a marca propria", GUARDA.includes('className="afty-guarda-quebrada"'), true);

const CSS = fonte("ficha/ficha.css");
const regra = CSS.slice(CSS.indexOf(".afty-guarda-quebrada {"));
const corpo = regra.slice(0, regra.indexOf("}"));
t("a marca e roxa", corpo.includes("var(--afty-destaque-texto)"), true);
t("sem borda e sem pilula", corpo.includes("border"), false);
t("e sem o ambar de aviso", corpo.includes("--afty-aviso"), false);

/* ⚠ A tira alinha pela LINHA DE BASE. Com `center` o bônus (1,0625rem) flutuava
   ~1,6px em relação ao "0 / 145" (0,75rem) ao lado, porque caixas de alturas
   diferentes centradas não põem as bases no mesmo lugar, e número se lê pela
   base. O autor apontou em 2026-08-26, por captura de tela. */
const tira = CSS.slice(CSS.indexOf(".afty-guarda {"));
t("a tira alinha pela linha de base", tira.slice(0, tira.indexOf("}")).includes("align-items: baseline"), true);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
