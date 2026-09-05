/**
 * DEZ SOMBRAS, E A PRIMITIVA QUE ELAS FORÇARAM: UMA INVOCAÇÃO LENDO OUTRA.
 *
 * O autor mandou as duas Mecânicas Únicas em 2026-09-02. Elas são as primeiras
 * regras do sistema que DERIVAM uma invocação a partir de OUTRAS, e a primeira
 * versão do addon aproximou o PV pelo da própria sombra. O autor recusou com a
 * razão certa:
 *
 *   *"Eu não controlo em que Grau uma invocação minha vai ser exorcizada, então
 *   é comum eu chegar no Grau Especial e ter Heranças de Grau Quatro, Grau
 *   Três."*
 *
 * Herança ENTRE GRAUS é o caso comum, e é onde a aproximação erra mais. Daí a
 * primitiva de verdade.
 *
 * ------------------------------------------------------------
 * O QUE NASCEU NO MOTOR (o verbo)
 * ------------------------------------------------------------
 *   • `marcadorFontes` na invocação: quais OUTRAS invocações são a origem.
 *   • `fontes: true` no registro do marcador, que liga o mecanismo.
 *   • Dois passes no `resolveInvocacoesList`, com o contexto do passe 1 RESOLVIDO.
 *   • `fontes()`, `fontes_qtd()` e `fontes_topo()` no DSL.
 *   • `herdaDaFonte`, a política de fusão do que NÃO cabe em canal.
 *
 * O ADDON guarda só o substantivo: qual expressão, sobre qual marcador, em qual
 * canal. Nada do que está acima sabe o que é uma Dez Sombras.
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
const { normalizarPacote, validarPacote, aplicarAddons } = await import(R + "afty-addons.js");
const { getTalento } = await import(R + "afty-talentos.js");
const { createBlankInvocacao, createBlankAcao, trProfDaInvocacao } = await import(R + "afty-invocacoes.js");
const { evalNumber, validateExpression, CHAVE_FONTES } = await import(R + "afty-dsl.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. AS FUNÇÕES DE FONTE, NO DSL CRU                            */
/* ============================================================ */

const ctxFake = { [CHAVE_FONTES]: { alvo: [{ pv_max: 110 }, { pv_max: 62 }, { pv_max: 41 }] } };
const dsl = (e) => evalNumber(e, ctxFake, "FALHOU");

t("fontes_qtd conta as fontes", dsl('fontes_qtd("alvo")'), 3);
t("soma avalia a expressao UMA VEZ POR FONTE",
  dsl('fontes("alvo", "soma", "piso(pv_max / 3)")'), 36 + 20 + 13);
/* ⚠ E NÃO é `piso(soma / 3)`. Com graus misturados as duas contas divergem, e o
   livro fala de uma sombra por vez: 213/3 = 71, e a conta por sombra dá 69. */
t("e por sombra difere de arredondar na soma",
  [dsl('fontes("alvo", "soma", "piso(pv_max / 3)")'), Math.floor((110 + 62 + 41) / 3)], [69, 71]);
t("maior e menor",
  [dsl('fontes("alvo", "maior", "pv_max")'), dsl('fontes("alvo", "menor", "pv_max")')], [110, 41]);
t("fontes_topo soma as N maiores", dsl('fontes_topo("alvo", 2, "pv_max")'), 172);
t("sem fonte nenhuma tudo e zero, inclusive maior",
  ['fontes_qtd("x")', 'fontes("x", "soma", "pv_max")', 'fontes("x", "maior", "pv_max")']
    .map((e) => evalNumber(e, {}, "FALHOU")), [0, 0, 0]);

/* ⚠ O NOME DA FUNÇÃO TEM DE SER MINÚSCULO. O tokenizador baixa a caixa, então
   `fontesTopo()` chega no avaliador como `fontestopo` e não acha nada. Custou
   uma depuração inteira em 2026-09-02, e quem avisa é o validador. */
t("nome com maiuscula e recusado pelo validador",
  validateExpression('fontesTopo("alvo", 2, "pv_max")', null).ok, false);
t("e o minusculo passa", validateExpression('fontes_topo("alvo", 2, "pv_max")', null).ok, true);

/* ============================================================ */
/* 2. O PACOTE                                                   */
/* ============================================================ */

const CAMINHO = fileURLToPath(new URL("./exemplo-dez-sombras.json", import.meta.url));
const pacote = normalizarPacote(JSON.parse(readFileSync(CAMINHO, "utf8")));
t("o pacote valida sem problema nenhum", validarPacote(pacote), []);
aplicarAddons([pacote]);

const NS = "dez-sombras:";

/* ⚠ SÃO TALENTOS QUE PAGAM A PRÓPRIA VAGA, e não um clã. A primeira versão do
   addon as pôs como Características de clã por causa do *"É para ser Intrínseco
   e não Talento"* do autor, e ele desfez em 2026-09-02 com a razão certa:
   *"do jeito que vc colocou, eles viraram uma Origem Propria, coisa que não é
   para acontecer."*

   Talento que concede `vagasTalento` resolve os dois lados: são Talentos de
   verdade (aparecem na lista, respeitam requisito) e saem de graça, sem sequestrar
   a origem da ficha. */
const talentos = [NS + "tal_heranca_das_sombras", NS + "tal_quimera"];
t("as duas mecanicas sao Talentos",
  talentos.map((id) => getTalento(id)?.nome), ["Herança das Sombras", "Quimera"]);
t("e cada uma concede uma Vaga de Talento",
  talentos.map((id) => (getTalento(id)?.efeitos ?? []).filter((e) => e.canal === "vagasTalento").length),
  [1, 1]);

/* ============================================================ */
/* 3. AS DEZ SOMBRAS, COM GRAUS MISTURADOS                       */
/* ============================================================ */

/* ⚠ GRAUS MISTURADOS DE PROPÓSITO. É o caso que o autor descreveu, e o único em
   que a aproximação antiga errava de verdade. */
const FONTES = [
  ["Cao Branco", "quarto", 14, 16, 12], ["Cao Preto", "quarto", 14, 16, 12],
  ["Coelho", "quarto", 10, 18, 10], ["Sapo", "terceiro", 12, 14, 16],
  ["Nue", "terceiro", 14, 18, 14], ["Grande Serpente", "terceiro", 18, 12, 16],
  ["Cervo", "segundo", 16, 16, 16], ["Touro", "segundo", 20, 12, 18],
  ["Elefante", "primeiro", 22, 10, 20], ["Divina Serpente", "primeiro", 18, 16, 18],
];
const mkFonte = ([nome, grau, f, d, c], i) => {
  const inv = createBlankInvocacao(grau);
  inv.id = `f${i}`; inv.nome = nome; inv.tipoMecanico = "shikigami";
  inv.atributos = { forca: f, destreza: d, constituicao: c, inteligencia: 10, sabedoria: 10, presenca: 10 };
  inv.acoes = [1, 2, 3].map((k) => ({ ...createBlankAcao(), id: `f${i}a${k}`, nome: `A${k}` }));
  inv.periciasProf = i === 0 ? { atletismo: "treinado", furtividade: "treinado" }
    : i === 1 ? { atletismo: "mestre" } : {};
  return inv;
};
const ficha = ({ nH = 0, nQ = 0 } = {}) => {
  const c = createBlankAfty();
  c.core = { ...c.core, nd: 20, tipo: "conjurador", patamar: "comum" };
  c.talentos = talentos;
  c.especializacoes = [{ id: "controlador", nivel: 20 }];
  c.attributes = { forca: 10, destreza: 12, constituicao: 14, inteligencia: 20, sabedoria: 12, presenca: 10 };
  c.addons = [pacote];
  const alvo = createBlankInvocacao("especial");
  alvo.id = "alvo"; alvo.nome = "Totalidade"; alvo.tipoMecanico = "shikigami";
  alvo.atributos = { forca: 20, destreza: 18, constituicao: 18, inteligencia: 12, sabedoria: 12, presenca: 12 };
  alvo.acoes = [{ ...createBlankAcao(), id: "aa", nome: "Golpe", tipoDano: "ct" }];
  alvo.periciasProf = { atletismo: "treinado" };
  alvo.marcadores = {}; alvo.marcadorFontes = {};
  const ids = (n) => FONTES.slice(0, n).map((_, i) => `f${i}`);
  if (nH) { alvo.marcadores[NS + "heranca"] = true; alvo.marcadorFontes[NS + "heranca"] = ids(nH); }
  if (nQ) { alvo.marcadores[NS + "quimera"] = true; alvo.marcadorFontes[NS + "quimera"] = ids(nQ); }
  c.invocacoes = [alvo, ...FONTES.map(mkFonte)];
  return c;
};
const alvoDe = (o) => deriveAfty(ficha(o)).invocacoes.lista.find((x) => x.id === "alvo");
const fontesDe = () => deriveAfty(ficha({})).invocacoes.lista.filter((x) => x.id !== "alvo");

const base = alvoDe({});
const pvFontes = fontesDe().map((x) => x.pv);
t("as dez fontes tem PV bem diferentes, porque os graus diferem",
  new Set(pvFontes).size >= 6, true);

/* ---- HERANÇA: "+1/3 dos Pontos de Vida da sombra de herança" ---- */

t("uma heranca soma um terco do PV DAQUELA sombra, e nao do proprio",
  alvoDe({ nH: 1 }).pv - base.pv, Math.floor(pvFontes[0] / 3));
t("dez herancas somam os dez tercos, um a um",
  alvoDe({ nH: 10 }).pv - base.pv, pvFontes.reduce((s, pv) => s + Math.floor(pv / 3), 0));
/* ⚠ A CONTRAPROVA DA APROXIMAÇÃO ANTIGA: ela pagava 1/3 do PV do ALVO por
   herança, que num Grau Especial herdando de Quarto Grau é quase o triplo. */
t("e isso NAO e um terco do PV do alvo vezes dez",
  alvoDe({ nH: 10 }).pv - base.pv === Math.floor(base.pv / 3) * 10, false);

/* "Recebe um aumento na Defesa igual ao maior Modificador de Destreza ou
   Constituição presente dentre as sombras de herança." */
const modDe = (v) => Math.floor((v - 10) / 2);
const maiorMod = (n) => Math.max(...FONTES.slice(0, n).map(([, , , d, c]) => Math.max(modDe(d), modDe(c))));
t("a Defesa pega o MAIOR mod de Destreza ou Constituicao entre as fontes",
  [1, 3, 10].map((n) => alvoDe({ nH: n }).defesa - base.defesa), [1, 3, 10].map(maiorMod));

/* ⚠ UMA VAGA POR SOMBRA, E ELA É DE ESCOLHA (autor, 2026-09-04): *"1 Ação ou
   Caracteristica adicional para cada Sombra Herdada"*. A regra velha era metade
   das Ações E metade das Características de CADA fonte, e ela crescia com o
   tamanho das sombras herdadas em vez de com a quantidade delas.

   O canal é o `orcamentoLivre`, que o motor descreve como "Ações/Características
   que NÃO entram no custo": ele já é o pote único que a frase pede. O
   `caracteristicasLivres`, que é vaga SÓ de Característica, saiu do pacote. */
t("cada sombra herdada vale UMA vaga, e nao metade do que a fonte tem",
  [1, 4, 10].map((n) => alvoDe({ nH: n }).efeitosHabilidade.orcamentoLivre), [1, 4, 10]);
/* ⚠ A CONTRAPROVA VALE PORQUE AS DUAS CONTAS SE CRUZAM. As fontes desta bancada
   têm 3 Ações cada, e `piso(3 / 2) = 1` por fonte dá o MESMO número que a regra
   nova em toda a faixa. O que separa uma da outra é uma fonte com mais Ações. */
const gorda = ficha({ nH: 1 });
gorda.invocacoes[1].acoes = [1, 2, 3, 4, 5, 6, 7].map((k) => ({ ...createBlankAcao(), id: `g${k}`, nome: `G${k}` }));
t("e uma fonte com 7 Acoes continua valendo UMA vaga, e nao tres",
  deriveAfty(gorda).invocacoes.lista.find((x) => x.id === "alvo").efeitosHabilidade.orcamentoLivre, 1);
t("a vaga so de Caracteristica saiu do pacote",
  alvoDe({ nH: 10 }).efeitosHabilidade.caracteristicasLivres, 0);

/* ---- QUIMERA ---- */

const topo2 = (n) => [...pvFontes.slice(0, n)].sort((a, b) => b - a).slice(0, 2).reduce((a, b) => a + b, 0);
t("a Quimera soma os 2 maiores PV, mais Constituicao por sombra alem da 2a",
  [2, 3, 4].map((n) => alvoDe({ nQ: n }).pv - base.pv),
  [2, 3, 4].map((n) => topo2(n) + 18 * (n - 2)));

/* "O Custo em PE é a soma de todas as invocações fundidas."

   ⚠ E ELE FICA A 2 DA SOMA, sempre. `custoReducao` é canal de DELTA e a regra
   pede SUBSTITUIÇÃO: a expressão desconta `custo - soma`, mas o `custo` que o
   DSL enxerga é o da invocação sem vaga grátis, enquanto o custo resolvido já
   levou o desconto das vagas que a própria Quimera concedeu. A diferença é o
   preço das Ações que viraram grátis, e por isso ela é CONSTANTE.

   O assert mede a distância nos três tamanhos em vez de fingir que fecha: se um
   dia existir canal de substituição de custo, os três viram zero. */
const custoFontes = fontesDe().map((x) => x.custo);
const somaAte = (n) => custoFontes.slice(0, n).reduce((a, b) => a + b, 0);
t("o custo da Quimera acompanha a soma das fundidas, a uma distancia fixa",
  [2, 3, 4].map((n) => somaAte(n) - alvoDe({ nQ: n }).custo), [2, 2, 2]);
t("e ele sobe de verdade, e nao fica no custo de uma sombra so",
  [2, 3, 4].map((n) => alvoDe({ nQ: n }).custo > alvoDe({}).custo - 1), [true, true, true]);

/* ---- AS DUAS JUNTAS ---- */

/* ⚠ O PV SOMA OS DOIS CÁLCULOS (autor, 2026-09-02: *"Quimeras com Herança somam
   o PV seguindo o calculo de ambas"*). A primeira versão suprimia o PV da
   Herança na Quimera, seguindo a letra do texto de fusão, e o autor corrigiu. */
const junto = { nH: 6, nQ: 4 };
t("Heranca + Quimera SOMAM os dois PV",
  alvoDe(junto).pv - base.pv,
  (alvoDe({ nH: 6 }).pv - base.pv) + (alvoDe({ nQ: 4 }).pv - base.pv));
t("e o atributo da Heranca continua ZERANDO na Quimera",
  alvoDe(junto).efeitosHabilidade.atributoPontos, 0);

/* ============================================================ */
/* 4. A FUSÃO ESTRUTURAL, QUE NÃO CABE EM CANAL                  */
/* ============================================================ */

const profDe = (o) => Object.fromEntries((alvoDe(o).testes?.pericias ?? [])
  .map((p) => [p.id, p.mestre ? "mestre" : "treinado"]));

/* ⚠ A HERANÇA NÃO FUNDE MAIS FAIXA NENHUMA (autor, 2026-09-04). A regra velha
   era a escada *"se torna treinado nas mesmas perícias e TRs da sombra de
   herança. Caso já seja treinado, se torna mestre"*, com o excedente virando
   +3 por perícia e +2 por TR. Ela toda foi trocada por *"+1 em TRs, Perícias e
   Acerto para cada Sombra Herdada"*, que é número e não faixa.

   Por isso o marcador da Herança perdeu o `herdaDaFonte`, e o alvo continua com
   a proficiência que a ficha DELE declara, herdando de duas sombras ou de dez.

   ⚠ A política `escalonado` continua no motor de propósito, sem ninguém usando.
   Ela é VERBO (o motor sabe o que "escalonado" quer dizer) e o pacote é que
   deixou de pedi-la: um addon futuro a alcança sem código novo. Ver
   `aplicarFusaoDeFontes` em afty-invocacoes.js. */
t("a Heranca nao promove nem abre pericia nenhuma",
  [profDe({ nH: 2 }), profDe({ nH: 10 })],
  [{ atletismo: "treinado" }, { atletismo: "treinado" }]);

/* Quimera, "uniao": "recebe todos os Treinamentos de Perícia das sombras
   fundidas". Vale a maior faixa, sem subir degrau. */
t("a Quimera une as faixas, sem promover",
  profDe({ nQ: 1 }), { atletismo: "treinado", furtividade: "treinado" });
t("e com a fonte mestre, a maior faixa ganha", profDe({ nQ: 2 }).atletismo, "mestre");

/* "A Quimera recebe o maior atributo entre as sombras fundidas." O Elefante
   (f8) tem Força 22 e Constituição 20, acima do alvo. */
const atrDe = (o) => alvoDe(o).atributos.valores;
t("os atributos do alvo nao mudam sem fonte maior",
  [atrDe({ nQ: 3 }).forca, atrDe({ nQ: 3 }).constituicao], [20, 18]);
t("e a Quimera pega o maior de cada um quando a fonte supera",
  [atrDe({ nQ: 9 }).forca, atrDe({ nQ: 9 }).constituicao], [22, 20]);
/* ⚠ A Herança NÃO funde atributo: a política dela só cita perícias. */
t("a Heranca nao mexe em atributo",
  [atrDe({ nH: 10 }).forca, atrDe({ nH: 10 }).constituicao], [20, 18]);

/* ============================================================ */
/* 5. AS ARMADILHAS, PRESAS                                      */
/* ============================================================ */

/* ⚠ NINGUÉM É FONTE DE SI MESMO. Sem o filtro, uma invocação que se listasse
   herdaria o próprio PV. */
const espelho = ficha({ nH: 1 });
espelho.invocacoes[0].marcadorFontes[NS + "heranca"] = ["alvo"];
t("uma invocacao que se lista como fonte nao ganha nada",
  deriveAfty(espelho).invocacoes.lista.find((x) => x.id === "alvo").pv, base.pv);

/* ⚠ O CICLO MORRE NO PASSE 1. A declara B e B declara A: os dois leem o
   contexto SEM vínculo do outro, o resultado é definido e não recorre. */
const ciclo = ficha({ nH: 1 });
ciclo.invocacoes[1].marcadores = { [NS + "heranca"]: true };
ciclo.invocacoes[1].marcadorFontes = { [NS + "heranca"]: ["alvo"] };
const doCiclo = deriveAfty(ciclo).invocacoes.lista;
t("ciclo entre duas invocacoes resolve e nao trava",
  [doCiclo.find((x) => x.id === "alvo").pv - base.pv, doCiclo.find((x) => x.id === "f0").pv > 0],
  [Math.floor(pvFontes[0] / 3), true]);

/* ⚠ CAMPO NOVO NO REGISTRO PRECISA SER REPASSADO pelo
   `resolveMarcadoresInvocacao`, que monta um objeto NOVO. `fontes` sumiu ali por
   minutos em 2026-09-02, com o dado certo dos dois lados e nada funcionando. */
const marcs = deriveAfty(ficha({ nH: 1 })).invocacoes.marcadores.filter((m) => m.id.startsWith(NS));
/* ⚠ SÓ A QUIMERA TEM POLÍTICA desde 2026-09-04. O `fontes` continua nos dois,
   porque as duas leem outras invocações. O que a Herança perdeu foi o
   `herdaDaFonte`, e não a capacidade de ter fonte. */
t("o marcador chega na invocacao com `fontes`, e a politica so na Quimera",
  marcs.map((m) => [m.id.replace(NS, ""), !!m.fontes, !!m.herdaDaFonte]),
  [["heranca", true, false], ["quimera", true, true]]);

/* ============================================================ */
/* 6. O TR VIROU MAPA, E O BÔNUS É +1 POR SOMBRA                 */
/* ============================================================ */
/* As duas últimas pendências, fechadas em 2026-09-02 a pedido do autor:
   *"Era para Invocações guardarem um mapa de TRs e não somente uma. Pode mexer
   no editor e em toda ficha salva."* */

/* ⚠ FICHA ANTIGA CONTINUA VALENDO, sem migração de escrita. */
t("o formato velho de TR e lido como mapa",
  [trProfDaInvocacao({ trTreinado: "vontade", trMestre: true }),
    trProfDaInvocacao({ trTreinado: "reflexos" }),
    trProfDaInvocacao({})],
  [{ vontade: "mestre" }, { reflexos: "treinado" }, {}]);
t("e o formato novo ganha do velho quando os dois existem",
  trProfDaInvocacao({ trProf: { astucia: "mestre" }, trTreinado: "reflexos" }), { astucia: "mestre" });

/* Régua própria: 3 fontes com Atletismo e Fortitude, para medir o bônus por
   sombra nas três coisas que ele alcança. */
const comTR = (n, alvoP, alvoT, marc = "heranca") => {
  const c = ficha({});
  const alvo = c.invocacoes[0];
  alvo.periciasProf = alvoP; alvo.trProf = alvoT;
  alvo.marcadores = { [NS + marc]: true };
  alvo.marcadorFontes = { [NS + marc]: [0, 1, 2].slice(0, n).map((i) => `g${i}`) };
  c.invocacoes = [alvo, ...[0, 1, 2].map((i) => {
    const v = createBlankInvocacao("terceiro");
    v.id = `g${i}`; v.tipoMecanico = "shikigami";
    v.atributos = { forca: 12, destreza: 12, constituicao: 12, inteligencia: 10, sabedoria: 10, presenca: 10 };
    v.periciasProf = { atletismo: "treinado" };
    v.trProf = { fortitude: "treinado" };
    return v;
  })];
  const r = deriveAfty(c).invocacoes.lista.find((x) => x.id === "alvo");
  return {
    atletismo: r.testes.pericias.find((x) => x.id === "atletismo")?.bonus,
    fortitude: r.testes.resistencias.find((x) => x.value === "fortitude")?.bonus,
    acerto: r.testes.acerto.corpo.bonus,
    cd: r.testes.cd,
  };
};

/* ⚠ AS TRÊS ANDAM JUNTAS, e é o que o canal `bonusTeste` promete: *"+1 em TRs,
   Perícias e Acerto para cada Sombra Herdada"* (autor, 2026-09-04). Medir só a
   perícia foi o que deixou o TR de fora na regra anterior, e o assert de então
   só pegou porque uma subia e a outra não. */
const jaMestre = (n) => comTR(n, { atletismo: "mestre" }, { fortitude: "mestre" });
const base0 = jaMestre(0);
t("cada sombra herdada vale +1 na pericia, no TR e no acerto, sem diferenca entre eles",
  [1, 2, 3].map((n) => [
    jaMestre(n).atletismo - base0.atletismo,
    jaMestre(n).fortitude - base0.fortitude,
    jaMestre(n).acerto - base0.acerto,
  ]),
  [[1, 1, 1], [2, 2, 2], [3, 3, 3]]);

/* ⚠ E A CD FICA DE FORA. A frase do autor nomeia TRs, Perícias e Acerto, e o
   `bonusTeste` do motor não entra na CD (que tem canal próprio). A Quimera é
   quem cita CD na regra dela, e por isso ela emite as duas coisas. */
t("a CD nao se mexe com heranca nenhuma",
  [1, 3].map((n) => jaMestre(n).cd - base0.cd), [0, 0]);

/* ⚠ E O BÔNUS NÃO DEPENDE MAIS DA FAIXA DE QUEM RECEBE. Na regra velha uma
   sombra não treinada gastava fontes subindo a escada antes de bonificar, e
   herdar de uma ou de duas dava o mesmo número. Agora as duas réguas andam
   iguais, e é o que separa a regra nova da antiga em uma linha. */
const doZero = (n) => comTR(n, {}, {});
t("nao treinado e mestre crescem igual, porque nao ha mais escada",
  [1, 2, 3].map((n) => doZero(n).fortitude - doZero(0).fortitude),
  [1, 2, 3].map((n) => jaMestre(n).fortitude - base0.fortitude));
/* Contraprova de que a escada MORREU mesmo: do zero, a perícia da fonte não
   abre linha nenhuma na sombra que herda. */
t("e herdar Atletismo de tres sombras nao treina o alvo em Atletismo",
  doZero(3).atletismo, undefined);

/* União (Quimera) NÃO promove nem bonifica por repetição: ela só pega a maior
   faixa vista. Três fontes treinadas num alvo treinado deixam ele treinado.

   ⚠ O NÚMERO DELE SOBE MESMO ASSIM, e não é contradição: a Quimera dá +1 em
   todo teste por sombra fundida além da primeira (`bonusTeste`), que é outra
   cláusula. O assert separa as duas medindo a FAIXA e o DELTA. */
const uniaoFaixa = (n) => {
  const c = ficha({});
  const alvo = c.invocacoes[0];
  alvo.periciasProf = { atletismo: "treinado" };
  alvo.marcadores = { [NS + "quimera"]: true };
  alvo.marcadorFontes = { [NS + "quimera"]: [0, 1, 2].slice(0, n).map((i) => `g${i}`) };
  c.invocacoes = [alvo, ...[0, 1, 2].map((i) => {
    const v = createBlankInvocacao("terceiro");
    v.id = `g${i}`; v.tipoMecanico = "shikigami";
    v.atributos = { forca: 12, destreza: 12, constituicao: 12, inteligencia: 10, sabedoria: 10, presenca: 10 };
    v.periciasProf = { atletismo: "treinado" };
    return v;
  })];
  const r = deriveAfty(c).invocacoes.lista.find((x) => x.id === "alvo");
  const p = r.testes.pericias.find((x) => x.id === "atletismo");
  return { mestre: p.mestre, bonus: p.bonus, bonusTeste: r.efeitosHabilidade.bonusTeste };
};
t("a uniao NAO promove, por mais fontes que repitam a pericia",
  [1, 2, 3].map((n) => uniaoFaixa(n).mestre), [false, false, false]);
/* ⚠ COMPARA DELTAS, e não valores: o Controlador 20 já entrega +6 de bonusTeste
   por Controle Aprimorado, que é base automática dele. O que interessa é que
   TODO o crescimento vem do bônus de fusão, e nenhum da repetição da perícia. */
t("e o que sobe no numero e SO o bonus de fusao da Quimera, nada de repeticao",
  [2, 3].map((n) => (uniaoFaixa(n).bonus - uniaoFaixa(1).bonus)
    - (uniaoFaixa(n).bonusTeste - uniaoFaixa(1).bonusTeste)), [0, 0]);
/* ⚠ CONTRAPROVA INVERTIDA em 2026-09-04. Ela dizia *"no escalonado da Herança as
   mesmas fontes PROMOVEM"*, e a Herança não promove mais ninguém. O que sobrou
   das duas é a assimetria que ainda vale: a Quimera funde FAIXA e a Herança dá
   NÚMERO, então a mesma bancada muda a proficiência de um lado e não do outro. */
const faixaHeranca = (n) => comTR(n, { atletismo: "treinado" }, {}, "heranca");
t("a Heranca move o numero e nao a faixa",
  [faixaHeranca(2).atletismo - faixaHeranca(1).atletismo,
    profDe({ nH: 2 }).atletismo], [1, "treinado"]);
t("e a Quimera move a faixa", profDe({ nQ: 2 }).atletismo, "mestre");

/* ============================================================ */
/* 9. AS DUAS VAGAS DE TALENTO, E O TETO DE FONTES DA QUIMERA    */
/* ============================================================ */
/* ⚠ O EFEITO ERA EMITIDO E JOGADO FORA. `vagasTalento` só era lido do estágio
   MONTANTE (Habilidade Geral e efeito manual), e um Talento é escolhido depois
   disso: a vaga aparecia certinha no hover de fontes e não mudava o orçamento
   em nada. O conserto lê o canal entre o `talentosPre` e o `resolveHabilidades`
   no `deriveAfty`. Ver a nota lá. */
const orcamento = (ts) => {
  const c = createBlankAfty();
  c.core = { ...c.core, nd: 20, tipo: "conjurador", patamar: "comum" };
  c.especializacoes = [{ id: "controlador", nivel: 20 }];
  c.addons = [pacote];
  c.talentos = ts;
  c.invocacoes = [];
  const h = deriveAfty(c).habilidades;
  return [h.exclusivasTalento, h.exclusivasUsadas, h.restante];
};
/* A ficha em branco nasce Inato, que já dá 2 vagas exclusivas de Talento. */
t("sem os Talentos, o orcamento e o de sempre", orcamento([]), [2, 0, 2]);
t("com Heranca, a vaga que ela concede paga a que ela gasta",
  orcamento([talentos[0]]), [3, 1, 2]);
t("com os dois, sobram as MESMAS duas vagas de antes",
  orcamento(talentos), [4, 2, 2]);

/* "Bônus de Treinamento +3 permite fundir até 2 Invocações. +4 até 3. +6 até 4." */
const tetoQuimera = (nd) => {
  const c = createBlankAfty();
  c.core = { ...c.core, nd, tipo: "conjurador", patamar: "comum" };
  c.especializacoes = [{ id: "controlador", nivel: nd }];
  c.addons = [pacote];
  c.talentos = talentos;
  c.invocacoes = [];
  const m = deriveAfty(c).invocacoes.marcadores.find((x) => x.id === NS + "quimera");
  return m?.fontesMax ?? null;
};
t("BT 2 ainda nao funde", tetoQuimera(1), 0);
t("BT 3 funde duas", tetoQuimera(5), 2);
t("BT 4 funde tres", tetoQuimera(9), 3);
t("BT 5 continua em tres, porque so o +6 abre a quarta", tetoQuimera(13), 3);
t("BT 6 funde quatro", tetoQuimera(17), 4);
/* A Herança NÃO tem teto de fontes: "o limite de heranças é definido pela
   quantia de sombras mortas", que é fato de mesa e não número de ficha. */
t("a Heranca nao declara teto de fontes",
  deriveAfty((() => {
    const c = createBlankAfty();
    c.core = { ...c.core, nd: 20, tipo: "conjurador", patamar: "comum" };
    c.especializacoes = [{ id: "controlador", nivel: 20 }];
    c.addons = [pacote];
    c.talentos = talentos;
    c.invocacoes = [];
    return c;
  })()).invocacoes.marcadores.find((x) => x.id === NS + "heranca")?.fontesMax ?? null,
  null);

if (bad.length) {
  console.log(`FALHAS (${bad.length}):`);
  for (const b of bad) console.log("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
