/* Concessão vinda da sessão — a primitiva 8.3 dos Addons.
   Cobre as três decisões do autor (2026-08-20): vale para tudo, NÃO gasta vaga,
   e é estado de sessão que não encosta na ficha. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const C = await import(R + "afty-concessao.js");
const AD = await import(R + "afty-addons.js");
const { AFTY_HABILIDADES } = await import(R + "afty-habilidades.js");
const { AFTY_TALENTOS } = await import(R + "afty-talentos.js");
const { HABILIDADES_GERAIS } = await import(R + "afty-gerais.js");
const { MELHORIAS_SUPERIORES, HABILIDADES_LENDARIAS } = await import(R + "afty-alto-nivel.js");
const { AFTY_TREINOS_ESPECIAIS, focosDeTreinosEspeciais } = await import(R + "afty-treinos-especiais.js");
const { AFTY_APTIDOES } = await import(R + "afty-aptidoes.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. A TABELA DE FAMÍLIAS                                       */
/* ============================================================ */

t("sao 7 familias", C.FAMILIAS_CONCESSAO.length, 7);
t("ids unicos", new Set(C.FAMILIAS_CONCESSAO.map((f) => f.id)).size, 7);
t("rotulos unicos", new Set(C.FAMILIAS_CONCESSAO.map((f) => f.rotulo)).size, 7);
t("familia desconhecida devolve null", C.familiaDeConcessao("xxx"), null);
t("familia conhecida resolve", C.familiaDeConcessao("talentos")?.rotulo, "Talento");

/* Toda família tem catálogo NÃO VAZIO e um `get` que acha a primeira entrada
   dele. É a checagem que pega import errado e acessor trocado de uma vez. */
for (const f of C.FAMILIAS_CONCESSAO) {
  const cat = f.catalogo();
  t(`${f.id}: catalogo tem entrada`, Array.isArray(cat) && cat.length > 0, true);
  t(`${f.id}: get acha a 1a`, f.get(cat[0].id)?.id, cat[0].id);
  t(`${f.id}: get de id fantasma`, f.get("nao_existe_mesmo"), null);
}

/* ============================================================ */
/* 2. NORMALIZAÇÃO                                               */
/* ============================================================ */

t("nao-array vira vazio", C.normalizaConcedido(null), []);
t("string vira vazio", C.normalizaConcedido("abc"), []);
t("familia desconhecida cai fora", C.normalizaConcedido([{ familia: "x", id: "a" }]).length, 0);
t("id vazio cai fora", C.normalizaConcedido([{ familia: "talentos", id: "  " }]).length, 0);
t("entrada nula cai fora", C.normalizaConcedido([null, 3, { familia: "talentos", id: "a" }]).length, 1);
t("id ganha trim", C.normalizaConcedido([{ familia: "talentos", id: " a " }])[0].id, "a");

/* ⚠ ID ÓRFÃO PASSA: linha morta é MOSTRADA, não apagada (decisão 4). Quem
   separa uma coisa da outra é o problemasDeConcessao. */
t("id fora do catalogo SOBREVIVE",
  C.normalizaConcedido([{ familia: "talentos", id: "fantasma" }]).length, 1);
t("e e reportado como problema",
  C.problemasDeConcessao([{ familia: "talentos", id: "fantasma" }]).length, 1);
t("id de verdade nao e problema",
  C.problemasDeConcessao([{ familia: "talentos", id: AFTY_TALENTOS[0].id }]).length, 0);
t("o problema diz a familia",
  C.problemasDeConcessao([{ familia: "talentos", id: "fantasma" }])[0].rotulo, "Talento");

/* uid: sem ele o botao de remover nao saberia QUAL pega de uma repetivel tirar */
const semUid = C.normalizaConcedido([{ familia: "talentos", id: "a" }, { familia: "talentos", id: "b" }]);
t("uid nasce quando falta", semUid.every((c) => !!c.uid), true);
t("uid nasce DIFERENTE", semUid[0].uid !== semUid[1].uid, true);
t("uid gravado e preservado",
  C.normalizaConcedido([{ uid: "meu", familia: "talentos", id: "a" }])[0].uid, "meu");

/* ============================================================ */
/* 3. AGRUPAMENTO                                                */
/* ============================================================ */

const agr = C.agrupaConcedido([
  { familia: "habilidades", id: "h1" },
  { familia: "talentos", id: "t1" },
  { familia: "habilidades", id: "h2" },
]);
t("agrupa tem as 7 chaves sempre", Object.keys(agr).length, 7);
t("familia sem nada vem vazia, nao ausente", agr.lendarias, []);
t("agrupa junta a familia", agr.habilidades, ["h1", "h2"]);
t("agrupa preserva a ordem", agr.habilidades[0], "h1");

/* ⚠ O Treino Especial sai como objeto, que e o shape da lista dele na ficha. */
const agrT = C.agrupaConcedido([{ familia: "treinosEspeciais", id: "tes_x", alvo: "atletismo" }]);
t("treino sai como objeto", agrT.treinosEspeciais, [{ id: "tes_x", alvo: "atletismo" }]);
t("treino sem alvo vira null", C.agrupaConcedido([{ familia: "treinosEspeciais", id: "y" }]).treinosEspeciais[0].alvo, null);
t("as outras saem como id cru", typeof C.agrupaConcedido([{ familia: "talentos", id: "z" }]).talentos[0], "string");

/* ============================================================ */
/* 4. ACRESCENTAR E TIRAR                                        */
/* ============================================================ */

const l0 = [];
const l1 = C.comConcessao(l0, "talentos", AFTY_TALENTOS[0].id);
t("comConcessao acrescenta", l1.length, 1);
t("comConcessao NAO muda a lista de entrada", l0.length, 0);
t("familia invalida nao acrescenta", C.comConcessao(l1, "xxx", "a").length, 1);
t("id vazio nao acrescenta", C.comConcessao(l1, "talentos", "").length, 1);

/* Repetivel: a MESMA pega duas vezes, e tirar uma deixa a outra. */
const rep = C.comConcessao(C.comConcessao([], "gerais", "ger_x"), "gerais", "ger_x");
t("repetivel aceita o mesmo id duas vezes", rep.length, 2);
t("uids diferentes na repetida", rep[0].uid !== rep[1].uid, true);
const repMenos = C.semConcessao(rep, rep[0].uid);
t("semConcessao tira SO uma", repMenos.length, 1);
t("e tira a certa", repMenos[0].uid, rep[1].uid);
t("uid inexistente nao tira nada", C.semConcessao(rep, "nada").length, 2);

/* ============================================================ */
/* 5. A LISTA PARA A TELA                                        */
/* ============================================================ */

const paraTela = C.concessoesDaSessao([
  { familia: "talentos", id: AFTY_TALENTOS[0].id },
  { familia: "talentos", id: "fantasma" },
]);
t("tela: nome resolvido", paraTela[0].nome, AFTY_TALENTOS[0].nome);
t("tela: viva nao e morta", paraTela[0].morta, false);
t("tela: morta e marcada", paraTela[1].morta, true);
t("tela: morta cai no id, para dar o que procurar", paraTela[1].nome, "fantasma");
t("tela: rotulo da familia vem junto", paraTela[0].rotuloFamilia, "Talento");

/* ============================================================ */
/* 6. PONTA A PONTA: O CONCEDIDO VALE                            */
/* ============================================================ */

const nova = (nd = 20) => {
  const c = createBlankAfty();
  c.core.nd = nd;
  c.core.tipo = "combatente";
  return c;
};

/* Uma criatura crua, e a MESMA criatura com uma concessao. A ficha e a mesma
   nas duas: o que muda esta no `opcoes`, que e o ponto todo da decisao. */
const crua = nova();
const hab = AFTY_HABILIDADES.find((h) => h.especializacaoId);
const dCrua = deriveAfty(crua);
const dCom = deriveAfty(crua, { concedido: [{ familia: "habilidades", id: hab.id }] });

t("crua nao tem a habilidade", dCrua.habilidades.escolhidas.includes(hab.id), false);
t("concedida ENTRA nas escolhidas", dCom.habilidades.escolhidas.includes(hab.id), true);
t("e NAO entra nas selecionadas", dCom.habilidades.selecionadas.includes(hab.id), false);
t("e aparece nas concedidas", dCom.habilidades.concedidas.includes(hab.id), true);

/* ⚠ A DECISAO "DE GRACA": o orcamento tem de ficar IDENTICO ao da ficha crua.

   ⚠ O QUE SE MEDE E O `orcamentoHabilidades`, e nao o `habilidades`. Existem
   DOIS objetos de orcamento no derivado, e so o primeiro chega na tela. O
   `habilidades.comum` conta so o canal `vagasHabilidade`, entao ele e zero na
   maioria das fichas e o `habilidades.excedeu` fica true em QUALQUER criatura
   com uma habilidade, addon ou nao. Comparar aquele campo passava a toa. Ver a
   entrada dos dois orcamentos em docs/a-fazer.md. */
t("de graca: gastos identicos", dCom.orcamentoHabilidades.gastos, dCrua.orcamentoHabilidades.gastos);
t("de graca: restante identico", dCom.orcamentoHabilidades.restante, dCrua.orcamentoHabilidades.restante);
t("de graca: excedeu identico", dCom.orcamentoHabilidades.excedeu, dCrua.orcamentoHabilidades.excedeu);
t("de graca: nao entrou no excedido", dCom.orcamentoHabilidades.excedeu, false);
/* E o interno tambem nao pode mudar, mesmo sendo campo que ninguem mostra. */
t("de graca: o interno tambem nao muda", dCom.habilidades.gastos, dCrua.habilidades.gastos);

/* ⚠ A DECISAO "NUNCA FICHA": a criatura de entrada nao pode ter sido tocada. */
t("a ficha nao foi tocada", (crua.habilidades ?? []).length, 0);
t("a ficha nao ganhou campo novo", "concedido" in crua, false);

/* O derivado REPORTA o que foi concedido, para as duas telas mostrarem. */
t("derivado lista o concedido", dCom.concedido.length, 1);
t("derivado da o nome", dCom.concedido[0].nome, hab.nome);
t("criatura sem concessao lista vazio", dCrua.concedido, []);
t("deriveAfty sem opcoes nenhuma nao quebra", deriveAfty(nova()).concedido, []);
t("deriveAfty com concedido lixo nao quebra", deriveAfty(nova(), { concedido: "abc" }).concedido, []);

/* ============================================================ */
/* 7. AS OUTRAS SEIS FAMÍLIAS, UMA A UMA                         */
/* ============================================================ */

/* Talento */
const tal = AFTY_TALENTOS[0];
const dTal = deriveAfty(crua, { concedido: [{ familia: "talentos", id: tal.id }] });
t("talento concedido vale", dTal.talentos.escolhidas.includes(tal.id), true);
t("talento concedido e de graca", dTal.talentos.gastos, deriveAfty(crua).talentos.gastos);
t("talento concedido e reportado", dTal.talentos.concedidos, [tal.id]);

/* Habilidade Geral */
const ger = HABILIDADES_GERAIS[0];
const dGer = deriveAfty(crua, { concedido: [{ familia: "gerais", id: ger.id }] });
t("geral concedida vale", dGer.gerais.escolhidas.some((g) => g.id === ger.id), true);
t("geral concedida e de graca", dGer.gerais.gastos, deriveAfty(crua).gerais.gastos);
t("geral concedida e reportada", dGer.gerais.concedidas[ger.id], 1);

/* ⚠ Geral concedida NAO apara no teto: conceder nao e comprar. Duas pegas de
   uma Geral cujo teto seria 1 continuam sendo duas. */
const gerTeto = HABILIDADES_GERAIS.find((g) => deriveAfty(crua).gerais.maxVezes[g.id] === 1);
if (gerTeto) {
  const dDuas = deriveAfty(crua, {
    concedido: [{ familia: "gerais", id: gerTeto.id }, { familia: "gerais", id: gerTeto.id }],
  });
  t("geral concedida NAO apara no teto",
    dDuas.gerais.escolhidas.find((g) => g.id === gerTeto.id)?.vezes, 2);
  t("e as duas sao de graca", dDuas.gerais.gastos, deriveAfty(crua).gerais.gastos);
}

/* Aptidão Amaldiçoada */
const apt = AFTY_APTIDOES[0];
const dApt = deriveAfty(crua, { concedido: [{ familia: "aptidoes", id: apt.id }] });
t("aptidao concedida entra na ficha que o motor enxerga",
  dApt.aptidoesEscolhidas?.includes(apt.id) ?? dApt.aptidao?.escolhidas?.includes(apt.id) ?? null, true);

/* ⚠ O Restringido NAO tem aptidao nenhuma, nem dada pelo mestre. */
const restr = nova();
restr.core.tipo = "restringido";
const dRestr = deriveAfty(restr, { concedido: [{ familia: "aptidoes", id: apt.id }] });
t("Restringido recusa aptidao concedida",
  (dRestr.aptidoesEscolhidas ?? dRestr.aptidao?.escolhidas ?? []).includes(apt.id), false);

/* Alto Nível: precisa de ND 21+ para as vagas existirem */
const alto = nova(30);
const dAltoCru = deriveAfty(alto);
const mel = MELHORIAS_SUPERIORES[0];
const dMel = deriveAfty(alto, { concedido: [{ familia: "melhoriasSuperiores", id: mel.id }] });
t("melhoria concedida vale", dMel.altoNivel.melhorias.escolhidas.some((m) => m.id === mel.id), true);
t("melhoria concedida e de graca", dMel.altoNivel.melhorias.gastos, dAltoCru.altoNivel.melhorias.gastos);
t("melhoria concedida e reportada", dMel.altoNivel.melhorias.concedidas[mel.id], 1);

const len = HABILIDADES_LENDARIAS[0];
const dLen = deriveAfty(alto, { concedido: [{ familia: "lendarias", id: len.id }] });
t("lendaria concedida vale", dLen.altoNivel.lendarias.escolhidas.includes(len.id), true);
t("lendaria concedida e de graca", dLen.altoNivel.lendarias.gastos, dAltoCru.altoNivel.lendarias.gastos);
t("lendaria concedida e reportada", dLen.altoNivel.lendarias.concedidas, [len.id]);

/* Treino Especial. O teste e pelo EFEITO, porque o Treino nao tem bloco proprio
   no derivado: `tes_feitico` emite no canal `vagasFeitico`, que desagua na vaga
   exclusiva de Feitico do orcamento de Habilidades. */
const tesF = AFTY_TREINOS_ESPECIAIS.find((x) => x.id === "tes_feitico");
const vagaF = (d) => d.orcamentoHabilidades.exclusivasFeitico;
const antesTes = vagaF(deriveAfty(crua));
const dTes = deriveAfty(crua, { concedido: [{ familia: "treinosEspeciais", id: tesF.id }] });
t("treino concedido concede a vaga", vagaF(dTes), antesTes + 1);

/* ⚠ A pega CONCEDIDA e a COMPRADA tem de dar exatamente o mesmo numero: se
   divergirem, o motor tem dois caminhos para a mesma regra. */
const compradoTes = { ...crua, treinosEspeciais: [{ id: tesF.id, alvo: null }] };
t("concedido == comprado, no efeito",
  vagaF(dTes), vagaF(deriveAfty(compradoTes)));

/* ⚠ Mas NAO no preco. O Foco e o orcamento do Treino, e o concedido nao encosta
   nele, porque ele nem entra na lista da ficha. */
t("comprado custa Foco", focosDeTreinosEspeciais(compradoTes), 1);
t("concedido NAO custa Foco", focosDeTreinosEspeciais(crua), 0);

/* ⚠ E nao apara no teto. No ND 20 o teto de compra e 1 + piso(20/5) = 5, e
   cinco concessoes passam disso sem serem aparadas: conceder nao e comprar. */
const dTes7 = deriveAfty(crua, {
  concedido: Array.from({ length: 7 }, () => ({ familia: "treinosEspeciais", id: tesF.id })),
});
t("treino concedido NAO apara no teto", vagaF(dTes7), antesTes + 7);
t("a compra, essa, APARA no teto",
  vagaF(deriveAfty({ ...crua, treinosEspeciais: Array.from({ length: 7 }, () => ({ id: tesF.id })) })),
  antesTes + 5);

/* ============================================================ */
/* 8. CONCESSÃO DE ADDON                                         */
/* ============================================================ */
/* O caso REAL da 8.3: o mestre concede uma habilidade que so existe porque um
   addon a trouxe. Sem isto a primitiva serviria so ao raw, e o Ciclo de
   Adaptacao e justamente conteudo de mesa. */

AD.limparAddons();
const PACOTE = {
  id: "teste-concessao",
  nome: "Teste de Concessao",
  versao: "1.0.0",
  acrescenta: {
    habilidades: [{
      id: "adaptada",
      nome: "Forma Adaptada",
      descricao: "Habilidade que so existe por addon.",
      especializacaoId: "lutador",
      tipo: "passiva",
      nivel: 1,
      efeitos: [{ canal: "rdGeral", expr: "5" }],
    }],
  },
};
AD.aplicarAddons([PACOTE]);
const idAddon = "teste-concessao:adaptada";
t("a habilidade do addon existe", !!C.familiaDeConcessao("habilidades").get(idAddon), true);

const dAddon = deriveAfty(crua, { concedido: [{ familia: "habilidades", id: idAddon }] });
t("habilidade de ADDON pode ser concedida", dAddon.habilidades.escolhidas.includes(idAddon), true);
t("e o efeito dela CHEGA no numero", dAddon.rdGeral - deriveAfty(crua).rdGeral, 5);
t("e continua de graca", dAddon.habilidades.gastos, deriveAfty(crua).habilidades.gastos);

/* ⚠ O ADDON SAI DO AR e a sessao fica com a concessao orfa: LINHA MORTA. A
   ficha tem de abrir do mesmo jeito, que e a decisao 4 do autor. */
AD.limparAddons();
const dOrfa = deriveAfty(crua, { concedido: [{ familia: "habilidades", id: idAddon }] });
t("addon fora do ar: a ficha AINDA deriva", typeof dOrfa.hp, "number");
t("a concessao orfa e marcada morta", dOrfa.concedido[0].morta, true);
t("e nao entra nas escolhidas", dOrfa.habilidades.escolhidas.includes(idAddon), false);
t("e o numero volta ao de antes", dOrfa.rdGeral, deriveAfty(crua).rdGeral);

/* ---- limpeza, para nao deixar o mundo sujo ---- */
AD.limparAddons();
t("mundo limpo no fim", AFTY_HABILIDADES.some((h) => h.id === idAddon), false);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);

/* sai diferente de zero quando falha, para o lancador e o CI enxergarem */
process.exitCode = bad.length ? 1 : 0;
