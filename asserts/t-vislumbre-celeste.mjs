/**
 * VISLUMBRE CELESTE: a Condição Corporal dos Seis Olhos.
 *
 * Conteúdo do autor, entregue em 2026-09-09. O pacote é
 * `addons/vislumbre-celeste.json`, e ele é `permite` puro: a condição é ganha de
 * graça, sem entrada de catálogo, então quem tem o pacote tem os olhos.
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. ⚠ OS DOIS BLOCOS NUNCA SOMAM JUNTOS. O texto diz *"substituindo-os pelos
 *    seguintes"*, e quem decide qual está de pé é a ficha: só o bloco ativo é
 *    emitido. Se um dia os dois saírem na mesma lista, todo bônus dobra.
 * 2. ⚠ CONDIÇÃO CORPORAL SOMA. É a frase do autor: *"logo se soma os efeitos com
 *    Feitiços e etc"*. O bônus dele não pode entrar no pool exclusivo, onde
 *    vale o maior valor em vez da soma.
 * 3. ELE É DE GRAÇA: não gasta o contador da aba Habilidades, nem vaga de
 *    Talento, de Aptidão ou de Feitiço.
 * 4. A redução de PE alcança TODO gasto, que é a resposta do autor sobre o
 *    alcance. Medida no Domínio Simples, que nenhum `custoPE` alcançava antes.
 * 5. Desinstalar devolve a ficha ao que era.
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
const { validarPacote, primitivasDaCriatura, PRIMITIVAS, aplicarAddons } = await import(R + "afty-addons.js");
const V = await import(R + "afty-vislumbre-celeste.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const PACOTE = JSON.parse(
  readFileSync(new URL("../addons/vislumbre-celeste.json", import.meta.url), "utf8"),
);

/* ============================================================ */
/* 1. O PACOTE                                                   */
/* ============================================================ */
t("o pacote valida sem problema nenhum", validarPacote(PACOTE), []);
t("ele pede a primitiva", PACOTE.permite, ["vislumbreCeleste"]);
t("a primitiva existe no registro", PRIMITIVAS.some((p) => p.id === "vislumbreCeleste"), true);
t("ele não libera regra nenhuma", PACOTE.libera ?? [], []);
/* ⚠ E NÃO TRAZ CATÁLOGO. A condição é de graça e não é entrada: ter o pacote É
   ter os olhos (autor, 2026-09-09). */
t("nem traz entrada de catálogo", PACOTE.acrescenta ?? {}, {});

/* ============================================================ */
/* 2. AS CONTAS DOS DOIS BLOCOS                                  */
/* ============================================================ */
const coberto = (cl) => V.resolveVislumbre({ tem: true, cl, descoberto: false });
const descoberto = (cl) => V.resolveVislumbre({ tem: true, cl, descoberto: true });

/* "reduzirá o valor gasto igual à metade de seu Nível de Aptidão de CL" contra
   "igual á seu Nível de Aptidão de CL". A metade é para BAIXO, regra da casa. */
t("coberto reduz metade do CL", [0, 1, 2, 3, 4, 5].map((c) => coberto(c).reducaoPe), [0, 0, 1, 1, 2, 2]);
t("descoberto reduz o CL inteiro", [0, 1, 2, 3, 4, 5].map((c) => descoberto(c).reducaoPe), [0, 1, 2, 3, 4, 5]);

/* "percepção às cegas com alcance padrão de 9m [...] +4,5m" contra "18m [...] +9m". */
t("a visão coberta", [0, 1, 4].map((c) => coberto(c).visao), [9, 13.5, 27]);
t("a visão descoberta", [0, 1, 4].map((c) => descoberto(c).visao), [18, 27, 54]);
/* ⚠ O MEIO METRO NÃO É ARREDONDADO. A regra do piso vale para fórmula de
   sistema, e não para distância: o livro mede em 1,5m, 4,5m e 7,5m. */
t("e o meio metro sobrevive", coberto(1).visao, 13.5);

/* "+1 em Percepção e Feitiçaria, para cada nível de CL" contra "+2". */
t("a perícia coberta", [0, 3, 5].map((c) => coberto(c).pericia), [0, 3, 5]);
t("a perícia descoberta", [0, 3, 5].map((c) => descoberto(c).pericia), [0, 6, 10]);
t("e são duas perícias", V.VISLUMBRE_PERICIAS, ["percepcao", "feiticaria"]);

/* "CD 20 + 5 para cada grau acima do 4". A ordem 1 é o Quarto Grau. */
t("a CD da Ler Técnica por grau", [1, 2, 3, 4, 5].map(V.cdLerTecnica), [20, 25, 30, 35, 40]);

/* "1 Nvl de Aptidão adicional, recebendo +1 nos Níveis 5, 15 e 25", que o autor
   leu como QUATRO: um na criação e um por marco. */
t("a Compreensão do Jujutsu", [1, 4, 5, 14, 15, 24, 25, 30].map(V.compreensaoDoJujutsu),
  [1, 1, 2, 2, 3, 3, 4, 4]);
t("e a expressão do Motor diz a mesma coisa",
  V.EXPR_COMPREENSAO, "1 + (nd >= 5) + (nd >= 15) + (nd >= 25)");

t("a Fadiga enche em 4", V.FADIGA_MAXIMA, 4);
t("e ela avisa quando enche",
  [V.resolveVislumbre({ tem: true, fadiga: 3 }).fadigaCheia,
    V.resolveVislumbre({ tem: true, fadiga: 4 }).fadigaCheia], [false, true]);

/* ============================================================ */
/* 3. ⚠ OS DOIS BLOCOS NUNCA SOMAM JUNTOS                        */
/* ============================================================ */
const efeitos = V.efeitosDoVislumbre({ tem: true });
t("sem a condição não há efeito nenhum", V.efeitosDoVislumbre({ tem: false }), []);
/* ⚠ UM BLOCO POR VEZ, E ESTRUTURALMENTE. A primeira versão emitia os dois e
   deixava um `quando` decidir, e não funcionava: o `custoPE` é lido no passe
   PÓS-APTIDÃO, que roda antes de a bancada de combate existir, e lá a variável
   do estado ainda não nasceu. Os dois caíam calados. Agora quem decide é a ficha,
   e só o bloco de pé é emitido: são três efeitos, mais a Compreensão. */
t("são três efeitos, mais a Compreensão", efeitos.length, 4);
t("e nenhum depende de um `quando`", efeitos.filter((e) => e.quando), []);
const nomes = (lista) => lista.map((e) => e.nome).join(" | ");
t("coberto emite o bloco coberto",
  nomes(V.efeitosDoVislumbre({ tem: true, descoberto: false })).includes("Olhos Cobertos"), true);
t("descoberto emite o outro",
  nomes(V.efeitosDoVislumbre({ tem: true, descoberto: true })).includes("Olhos Descobertos"), true);
/* ⚠ E NUNCA OS DOIS. Se um dia os dois nomes saírem na mesma lista, "substituindo-os
   pelos seguintes" virou soma, e todo bônus dobra. */
t("e nunca os dois na mesma lista",
  [false, true].map((d) => {
    const n = nomes(V.efeitosDoVislumbre({ tem: true, descoberto: d }));
    return n.includes("Olhos Cobertos") && n.includes("Olhos Descobertos");
  }), [false, false]);
t("a Compreensão vale sempre, nos dois estados",
  [false, true].map((d) => V.efeitosDoVislumbre({ tem: true, descoberto: d })
    .filter((e) => e.canal === "pontosAptidao").length), [1, 1]);
/* ⚠ O NOME DA FONTE É CURTO, a pedido do autor (2026-09-09). Ele era
   "Vislumbre Celeste: Olhos Descobertos · Visão Absoluta" e empurrava o número
   para fora da linha do hover. A fonte precisa dizer QUEM deu o bônus, e quem
   deu é o estado dos olhos. */
t("o nome da fonte é só o estado dos olhos",
  [...new Set(V.efeitosDoVislumbre({ tem: true, descoberto: true }).map((e) => e.nome))].sort(),
  ["Compreensão do Jujutsu", "Olhos Descobertos"]);
t("e coberto diz a outra metade",
  [...new Set(V.efeitosDoVislumbre({ tem: true, descoberto: false }).map((e) => e.nome))].sort(),
  ["Compreensão do Jujutsu", "Olhos Cobertos"]);

/* ============================================================ */
/* 3.1 A FADIGA NA SESSÃO, E A CONVERSÃO                         */
/* ============================================================ */
/* ⚠ "IMEDIATAMENTE" É AUTOMÁTICO. O quarto ponto nunca fica na tela: ele vira
   Exaustão e a contagem recomeça no zero, que é o que o texto manda. */
const fadigaDe = (s) => s.combate[V.ESTADO_FADIGA];
let ses = { combate: {}, exaustao: 0 };
ses = V.acumulaFadiga(ses, 1);
t("o primeiro ponto entra", [fadigaDe(ses), ses.exaustao], [1, 0]);
ses = V.acumulaFadiga(ses, 1);
ses = V.acumulaFadiga(ses, 1);
t("o terceiro ainda é Fadiga", [fadigaDe(ses), ses.exaustao], [3, 0]);
ses = V.acumulaFadiga(ses, 1);
t("o quarto vira Exaustão e zera a contagem", [fadigaDe(ses), ses.exaustao], [0, 1]);
t("e a contagem recomeça", fadigaDe(V.acumulaFadiga(ses, 1)), 1);
t("devolver ponto não passa de zero",
  fadigaDe(V.acumulaFadiga({ combate: { [V.ESTADO_FADIGA]: 0 } }, -1)), 0);
t("e ela não quebra com sessão vazia", fadigaDe(V.acumulaFadiga(null, 1)), 1);

/* ⚠ OS DOIS ESTADOS IGNORAM O `ativo` DA BANCADA. Todo outro estado é zerado
   fora de combate, porque todo outro estado é DE combate. Uma Condição Corporal
   não liga e desliga com a iniciativa, e sem isto o painel da Ficha teria duas
   verdades: o botão aceso e os números do bloco coberto. */
t("os olhos valem fora de combate",
  V.olhosDescobertos({ combate: { [V.ESTADO_DESCOBERTO]: true } }), true);
t("e a Fadiga também",
  V.fadigaAtual({ combate: { [V.ESTADO_FADIGA]: 3 } }), 3);
t("a Fadiga é aparada no teto", V.fadigaAtual({ combate: { [V.ESTADO_FADIGA]: 9 } }), 4);
t("alternar os olhos não mexe em mais nada",
  V.alternaOlhos({ combate: { x: 1 }, exaustao: 2 }, true),
  { combate: { x: 1, [V.ESTADO_DESCOBERTO]: true }, exaustao: 2 });

/* ⚠ A REDUÇÃO DE PE NÃO TEM ALVO, e é o que a faz valer para TODO gasto. */
t("a redução de PE não mira gasto nenhum",
  efeitos.filter((e) => e.canal === "custoPE").every((e) => e.alvo == null), true);

/* ============================================================ */
/* 4. NA FICHA, DE PONTA A PONTA                                 */
/* ============================================================ */
const base = (comAddon, olhos = false) => {
  const f = createBlankAfty();
  f.core.nd = 20;
  f.core.tipo = "conjurador";
  f.core.origem = { id: "herdado" };
  f.especializacoes = [{ id: "conjurador", nivel: 10 }];
  f.aptidoes = { au: 0, cl: 4, bar: 0, dom: 3, er: 0 };
  f.aptidoesEscolhidas = ["dominio_simples"];
  f.combate = { ativo: true, [V.ESTADO_DESCOBERTO]: olhos };
  if (comAddon) f.addons = [PACOTE];
  return f;
};
const derivarCom = (comAddon, olhos = false) => {
  aplicarAddons(comAddon ? [PACOTE] : []);
  return deriveAfty(base(comAddon, olhos));
};

const crua = derivarCom(false);
const comCoberto = derivarCom(true, false);
const comDescoberto = derivarCom(true, true);

t("sem addon a criatura não vê a primitiva", primitivasDaCriatura(base(false)), []);
t("com o addon ela vê", primitivasDaCriatura(base(true)), ["vislumbreCeleste"]);
t("e o card só existe com ela",
  [crua.vislumbre.tem, comCoberto.vislumbre.tem], [false, true]);

const pericia = (d, id) => d.testes.pericias.find((p) => p.id === id)?.bonus;
/* Com CL 4: coberto dá +4, descoberto dá +8. */
t("a Percepção sobe 4 com os olhos cobertos",
  pericia(comCoberto, "percepcao") - pericia(crua, "percepcao"), 4);
t("e 8 com eles descobertos",
  pericia(comDescoberto, "percepcao") - pericia(crua, "percepcao"), 8);
t("a Feitiçaria acompanha",
  [pericia(comCoberto, "feiticaria") - pericia(crua, "feiticaria"),
    pericia(comDescoberto, "feiticaria") - pericia(crua, "feiticaria")], [4, 8]);
/* ⚠ E NUNCA OS DOIS JUNTOS: 4 + 8 daria 12, e é o número que apareceria se o
   `quando` de um dos blocos parasse de valer. */
t("os dois blocos nunca somam juntos",
  pericia(comDescoberto, "percepcao") - pericia(crua, "percepcao") === 12, false);

/* A redução de PE alcança o Domínio Simples, que é a prova do alcance amplo. */
t("o custo de erguer cai com os olhos cobertos",
  comCoberto.dominioSimples.custoErguer, Math.max(1, crua.dominioSimples.custoErguer - 2));
t("e cai mais com eles descobertos",
  comDescoberto.dominioSimples.custoErguer, Math.max(1, crua.dominioSimples.custoErguer - 4));

/* A Compreensão do Jujutsu: no ND 20 são três (criação, 5 e 15). */
t("a Compreensão chega no orçamento de NÍVEIS de Aptidão",
  comCoberto.totalAptidao - crua.totalAptidao, 3);

/* ⚠ DE GRAÇA. O contador da aba Habilidades não se move, e nem as vagas. */
t("o contador da aba não se move",
  comDescoberto.orcamentoHabilidades.total, crua.orcamentoHabilidades.total);
t("nem o gasto dele", comDescoberto.orcamentoHabilidades.gastos, crua.orcamentoHabilidades.gastos);

/* Os dois estados aparecem na bancada, e só para quem tem a condição. */
const extras = (d) => (d.combate.estadosExtras ?? []).map((e) => e.id);
t("os dois estados aparecem",
  [extras(comCoberto).includes(V.ESTADO_DESCOBERTO), extras(comCoberto).includes(V.ESTADO_FADIGA)],
  [true, true]);
t("e não aparecem sem o addon",
  [extras(crua).includes(V.ESTADO_DESCOBERTO), extras(crua).includes(V.ESTADO_FADIGA)],
  [false, false]);

/* ============================================================ */
/* 5. DESINSTALAR DEVOLVE A FICHA                                */
/* ============================================================ */
const depois = derivarCom(false);
for (const k of ["hp", "pe", "defesa", "cd", "rdGeral", "movimento", "iniciativa", "nd"]) {
  t(`sem o addon, ${k} volta ao que era`, depois[k], crua[k]);
}
t("e a Percepção volta", pericia(depois, "percepcao"), pericia(crua, "percepcao"));

/* ============================================================ */
/* 6. A TELA                                                     */
/* ============================================================ */
/* ⚠ ASSERT NÃO RENDERIZA, então o que dá para prender é o PORTÃO e o LUGAR. A
   aba Habilidades ramifica o layout por origem, e o card é montado uma vez e
   consumido pelos três ramos: é a lição do Estilo Marcial. */
const builder = readFileSync(
  fileURLToPath(new URL("../src/systems/afty/AftyCreatureBuilder.jsx", import.meta.url)),
  "utf8",
);
t("o card é montado UMA vez", (builder.match(/<VislumbreCard/g) ?? []).length, 1);
t("e consumido pelos três ramos da aba", (builder.match(/\{vislumbre\}/g) ?? []).length, 3);
t("quem decide se ele aparece é o derived",
  builder.includes("derived.vislumbre?.tem"), true);
/* O lugar que o autor pediu: abaixo do Funcionamento Básico e acima dos
   Feitiços. No ramo que tem os dois, a ordem do JSX é essa. */
const ramo = builder.slice(builder.indexOf("<PerfilAmaldicoadoCard"));
t("no ramo com Funcionamento Básico ele vem antes dos Feitiços",
  ramo.indexOf("{vislumbre}") < ramo.indexOf("{feiticosCard}"), true);

/* O painel da Ficha Final: ele mora na aba AÇÕES, e não em Buffs (autor,
   2026-09-09: "para eu não precisar ir para Buffs o tempo inteiro"). */
const ficha = readFileSync(
  fileURLToPath(new URL("../src/systems/afty/ficha/AftyFicha.jsx", import.meta.url)),
  "utf8",
);
t("a Ficha monta o painel", ficha.includes("<PainelDoVislumbre"), true);
t("e o entrega para a aba de Ações", /vislumbre=\{<PainelDoVislumbre/.test(ficha), true);
const abaAcoes = readFileSync(
  fileURLToPath(new URL("../src/systems/afty/ficha/abas/AbaAcoes.jsx", import.meta.url)),
  "utf8",
);
t("a aba de Ações desenha o nó", abaAcoes.includes("{vislumbre}"), true);
const painel = readFileSync(
  fileURLToPath(new URL("../src/systems/afty/ficha/PainelDoVislumbre.jsx", import.meta.url)),
  "utf8",
);
t("o painel tem o botão dos olhos e os dois contadores",
  [painel.includes("alternaOlhos"), painel.includes("acumulaFadiga"), painel.includes("exaustao")],
  [true, true, true]);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
