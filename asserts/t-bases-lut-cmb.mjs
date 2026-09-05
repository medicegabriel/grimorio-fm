/* AS HABILIDADES BASE DE LUTADOR E COMBATENTE, medidas uma a uma.

   Nasceu da varredura de 2026-09-01, que conferiu as 13 contra o texto verbatim
   do livro e achou quatro furos. O que este arquivo mede, em ordem:

     1. O PORTÃO. Base não tem pré-requisito nenhum além do nível da Classe, e o
        nível é o REAL daquela Classe, nunca o ND nem o de escalonamento.

     2. CADA DEGRAU DE CADA BASE. Os números saem do deriveAfty de verdade, num
        nível de cada lado de cada degrau escrito no livro.

     3. ⚠ "ARMA MARCIAL" NÃO É "CORPO A CORPO". Corpo Treinado e Gosto pela Luta
        dizem "desarmadas ou com armas marciais", e até 2026-09-01 miravam o TIPO
        de ataque `corpo`: sobrava para a Espada Grande, que não é Marcial, e
        faltava no dano do Bastão e do Nunchaku Pesado, que são Marciais SEM a
        propriedade Fineza. Marcial é a PROPRIEDADE, e o escopo é `prop:marcial`.

     4. ⚠ AS TRÊS LINHAS DAS ARTES DO COMBATE TÊM PISO DE 1 (autor, 2026-09-01:
        *"Sempre é no Mínimo 1"*). Com Sabedoria 8, que é o mínimo do point-buy,
        elas viravam penalidade: zero dado na Execução Silenciosa e −1 de Defesa
        no Golpe Descendente.

   ⚠ A escada do dado desarmado do Corpo Treinado NÃO é medida aqui: ela mora em
   t-niveis-dano.mjs, junto das outras duas fontes de desarmado. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { AFTY_HABILIDADES, habilidadesConcedidasPelasEspecializacoes } = await import(R + "afty-habilidades.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* Ficha de JOGADOR, onde toda Base é concedida ao alcançar o nível da Classe
   (divergência `basesAutomaticas`). É o sistema em que estas habilidades chegam
   sozinhas, então é onde os degraus se medem sem escolher nada. */
const ficha = (espId, nivel, opcoes = {}) => {
  const { sab = 10, forca = 10, destreza = 10, armas = [], combate = null, sistema = "player" } = opcoes;
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: nivel, tipo: "combatente", patamar: "comum" };
  f.especializacoes = Array.isArray(espId) ? espId : [{ id: espId, nivel }];
  f.attributes = { forca, destreza, constituicao: 10, inteligencia: 10, sabedoria: sab, presenca: 10 };
  if (armas.length) {
    f.equipamentos = { itens: armas.map((refId, i) => ({ id: `e${i}`, tipo: "arma", refId, qtd: 1, equipado: true })) };
  }
  if (combate) f.combate = { ativo: true, ...combate };
  return f;
};
const linha = (d, id) => d.dano.entradas.find((x) => x.id === id);
const trDe = (d, id) => d.testes.resistencias.find((r) => (r.id ?? r.value) === id)?.bonus;

/* ============================================================ */
/* 1. O PORTÃO                                                   */
/* ============================================================ */

const BASES = AFTY_HABILIDADES.filter(
  (h) => h.tipo === "base" && ["lutador", "combatente"].includes(h.especializacaoId),
);

t("Lutador tem 7 Bases e Combatente tem 6", [
  BASES.filter((h) => h.especializacaoId === "lutador").map((h) => h.nivel),
  BASES.filter((h) => h.especializacaoId === "combatente").map((h) => h.nivel),
], [[1, 1, 2, 4, 5, 11, 20], [1, 1, 4, 4, 6, 20]]);

/* ⚠ NENHUMA TEM PRÉ-REQUISITO, e isso não é decoração: a concessão automática do
   jogador (`habilidadesConcedidasPelasEspecializacoes`) olha SÓ o nível, e não
   chama o `avaliarAcessoHabilidade`. Uma Base que ganhasse `requisitos` passaria
   por cima dele calada, então o dia em que este assert falhar é o dia de ensinar
   a concessão a cobrar o requisito. */
t("nenhuma Base de Lutador ou Combatente tem requisito extra",
  BASES.filter((h) => (h.requisitos || []).length).map((h) => h.id), []);

/* O nível é o REAL daquela Classe. Numa multiclasse Lutador 4 / Combatente 16 o
   escalonamento do Lutador é 12, e mesmo assim Gosto pela Luta (5°) não chega. */
const mc = [{ id: "lutador", nivel: 4 }, { id: "combatente", nivel: 16 }];
const concedidasMc = habilidadesConcedidasPelasEspecializacoes(mc, "player");
t("Lutador 4 recebe as quatro Bases ate o 4 nivel",
  concedidasMc.filter((id) => id.startsWith("lut_")),
  ["lut_corpo_treinado", "lut_empolgacao", "lut_reflexo_evasivo", "lut_implemento_marcial"]);
t("e Gosto pela Luta (5) fica de fora, apesar do escalonamento 12",
  concedidasMc.includes("lut_gosto_pela_luta"), false);
t("Combatente 16 recebe cinco das seis, e Autossuficiente (20) fica de fora",
  concedidasMc.filter((id) => id.startsWith("cmb_")).length, 5);

/* Na CRIATURA só as duas marcadas `automatica` chegam sozinhas. */
t("na criatura so Empolgacao e Artes do Combate sao automaticas",
  habilidadesConcedidasPelasEspecializacoes(mc, "afty"),
  ["lut_empolgacao", "cmb_artes_do_combate"]);

/* ============================================================ */
/* 2. OS DEGRAUS DE CADA BASE                                    */
/* ============================================================ */

/* Reflexo Evasivo (2°): "redução de dano a todo tipo, exceto alma, igual a
   metade do seu nível de Lutador". A RD Geral é justamente a que não cobre alma. */
for (const [nivel, rd] of [[2, 1], [4, 2], [11, 5], [20, 10]]) {
  const d = deriveAfty(ficha("lutador", nivel));
  t(`Reflexo Evasivo no ${nivel} da ${rd} de RD Geral`, d.rdGeral, rd);
  t("e nao toca a RD a Alma", d.rdAlma, 0);
}
t("no 1 nivel ele ainda nao chegou", deriveAfty(ficha("lutador", 1)).rdGeral, 0);

/* Implemento Marcial (4°), nas DUAS Classes: "+2 na CD [...] aumenta em 1 nos
   níveis 8° e 16°". Medido como diferença contra o nível de baixo, porque a CD
   sobe com o nível por conta própria. */
for (const classe of ["lutador", "combatente"]) {
  const cd = (n) => deriveAfty(ficha(classe, n)).cd;
  t(`Implemento Marcial do ${classe} entra com +2 no 4`, cd(4) - cd(3), 2 + 1);
  t(`e sobe mais 1 no 8`, cd(8) - cd(7), 1 + 1);
  t(`e mais 1 no 16`, cd(16) - cd(15), 1 + 1);
}

/* Gosto pela Luta (5°): "+2 em jogadas de ataque desarmadas ou com armas
   marciais e +1 em rolagens de Fortitude e de dano. Nos níveis 8, 12, 16 e 20 o
   bônus em jogadas de ataque aumenta em +1, enquanto nos níveis 9, 13 e 17 o
   bônus em Fortitude e dano aumenta em +1." */
const fortSem = (n) => trDe(deriveAfty(ficha("restringido", n)), "fortitude");
const fortCom = (n) => trDe(deriveAfty(ficha("lutador", n)), "fortitude");
for (const [nivel, bonus] of [[4, 0], [5, 1], [8, 1], [9, 2], [12, 2], [13, 3], [16, 3], [17, 4], [20, 4]]) {
  t(`Gosto pela Luta soma ${bonus} em Fortitude no nivel ${nivel}`, fortCom(nivel) - fortSem(nivel), bonus);
}
for (const [nivel, bonus] of [[4, 0], [5, 1], [9, 2], [13, 3], [17, 4], [20, 4]]) {
  const b = linha(deriveAfty(ficha("lutador", nivel)), "basico");
  const parte = b.partes.find((p) => p.label === "Gosto pela Luta");
  t(`e ${bonus} no dano no nivel ${nivel}`, parte?.valor ?? 0, bonus);
}

/* Empolgação Máxima (11°): "Os seus dados de empolgação se tornam 2d4, 2d6, 2d8
   e 3d6, respectivamente." A tabela é a mesma estrutura dos dois lados. */
const tabelaEm = (n) => deriveAfty(ficha("lutador", n)).empolgacao.tabela.map((x) => x.dado);
t("ate o 10 a Empolgacao roda a tabela base", tabelaEm(10), ["1d4", "1d6", "2d4", "2d6"]);
t("e do 11 em diante a Maxima troca as quatro", tabelaEm(11), ["2d4", "2d6", "2d8", "3d6"]);

/* Lutador Superior (20°): "Seus ataques desarmados causam 1 dado de dano
   adicional [...] você inicia todo combate com um Nível de Empolgação a mais." */
t("Lutador Superior sobe a Empolgacao inicial para 2", deriveAfty(ficha("lutador", 20)).empolgacao.inicial, 2);
t("e antes dele o combate comeca no 1", deriveAfty(ficha("lutador", 19)).empolgacao.inicial, 1);
t("e soma um dado no desarmado", [
  linha(deriveAfty(ficha("lutador", 19)), "basico").dadosExtras,
  linha(deriveAfty(ficha("lutador", 20)), "basico").dadosExtras,
], [0, 1]);
/* ⚠ SÓ NO DESARMADO. O Autossuficiente do Combatente é quem diz "todos seus
   ataques", e os dois usam o mesmo canal com alvos diferentes. */
t("e o dado dele NAO chega na arma",
  linha(deriveAfty(ficha("lutador", 20, { armas: ["arm_espada_grande"] })), "arm_espada_grande").dadosExtras, 0);

/* Artes do Combate (1°): "Pontos de Preparo igual ao seu nível de Especialista
   em Combate + Modificador de Sabedoria." */
for (const [nivel, sab, preparo] of [[1, 10, 1], [1, 18, 5], [6, 14, 8], [20, 20, 25]]) {
  t(`Pontos de Preparo no ${nivel} com Sabedoria ${sab}`, deriveAfty(ficha("combatente", nivel, { sab })).pontosPreparo, preparo);
}
t("e quem nao e Combatente nao tem nenhum", deriveAfty(ficha("lutador", 20)).pontosPreparo, 0);

/* Golpe Especial (4°): as quatro propriedades que viram número, cada uma no seu
   interruptor da bancada. As outras sete são alvo, alcance, vantagem, condição,
   ação ou dano em si mesmo, e estão anotadas no catálogo de efeitos. */
const cmb20 = (combate) => deriveAfty(ficha("combatente", 20, { sab: 10, combate }));
const base20 = cmb20({});
t("Atroz soma um dado", linha(cmb20({ golpeAtroz: true }), "basico").dadosExtras - linha(base20, "basico").dadosExtras, 1);
t("Letal desce 1 na margem de critico",
  linha(base20, "basico").margemCritico - linha(cmb20({ golpeLetal: true }), "basico").margemCritico, 1);
t("Penetrante ignora metade do nivel de personagem",
  linha(cmb20({ golpePenetrante: true }), "basico").ignoraRD, 10);
t("Desfocado tira 4 por pega, cumulativo ate tres",
  [1, 2, 3].map((n) => linha(base20, "basico").acerto - linha(cmb20({ golpeDesfocado: n }), "basico").acerto),
  [4, 8, 12]);

/* Autossuficiente (20°): "todos seus ataques causam um dado de dano adicional".
   ⚠ Sem alvo, ao contrário do Lutador Superior: a arma recebe também. */
const autoSem = deriveAfty(ficha("combatente", 19, { armas: ["arm_espada_grande"] }));
const autoCom = deriveAfty(ficha("combatente", 20, { armas: ["arm_espada_grande"] }));
t("Autossuficiente soma um dado no desarmado E na arma", [
  linha(autoCom, "basico").dadosExtras - linha(autoSem, "basico").dadosExtras,
  linha(autoCom, "arm_espada_grande").dadosExtras - linha(autoSem, "arm_espada_grande").dadosExtras,
], [1, 1]);

/* Repertório do Especialista (1°): a escolha aninhada solta 1 Estilo no nível 1,
   mais um no 6 e outro no 12. Empolgação solta DUAS no 1, mais uma no 6, 12 e 18,
   e no 18 o Lutador conhece as cinco Manobras. */
const vagasDe = (espId, nivel, habId) =>
  deriveAfty(ficha(espId, nivel)).habilidades.escolhas.porHab[habId]?.allowance;
t("Estilos do Repertorio por nivel",
  [1, 5, 6, 11, 12, 20].map((n) => vagasDe("combatente", n, "cmb_repertorio_do_especialista")),
  [1, 1, 2, 2, 3, 3]);
t("Manobras de Empolgacao por nivel",
  [1, 5, 6, 11, 12, 17, 18, 20].map((n) => vagasDe("lutador", n, "lut_empolgacao")),
  [2, 2, 3, 3, 4, 4, 5, 5]);

/* Estilo Duplo (autor, 2026-09-01): "+1 em rolagens de dano, o qual aumenta em
   +1 nos níveis 4, 8, 12 e 16", enquanto lutando com duas armas.
   ⚠ A outra metade dele ("o seu bônus de atributo no dano do ataque com a
   segunda arma") continua de mesa: a ficha tem uma linha por ARMA e não por MÃO. */
const duplo = (nivel, ligado) => {
  const f = ficha("combatente", nivel, { armas: ["arm_espada_curta"] });
  f.escolhasHabilidade = { cmb_repertorio_do_especialista: ["cmb_estilo_duplo"] };
  f.combate = { ativo: true, ...(ligado ? { lutandoComDuasArmas: true } : {}) };
  return linha(deriveAfty(f), "arm_espada_curta").fixo;
};
t("o Estilo Duplo sobe o dano nos degraus 4, 8, 12 e 16",
  [1, 3, 4, 7, 8, 11, 12, 15, 16, 20].map((n) => duplo(n, true) - duplo(n, false)),
  [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
/* ⚠ E ELE É INTERRUPTOR, não passiva: desligado não soma nada. */
t("e desligado ele nao soma nada", duplo(20, false), duplo(20, false));
t("quem escolheu OUTRO Estilo nao recebe o bonus do Duplo", (() => {
  const f = ficha("combatente", 20, { armas: ["arm_espada_curta"] });
  f.escolhasHabilidade = { cmb_repertorio_do_especialista: ["cmb_estilo_defensivo"] };
  f.combate = { ativo: true, lutandoComDuasArmas: true };
  return linha(deriveAfty(f), "arm_espada_curta").fixo;
})(), duplo(20, false));

/* ============================================================ */
/* 3. "ARMA MARCIAL" NÃO É "CORPO A CORPO"                       */
/* ============================================================ */

/* Força 10 (mod 0) contra Destreza 18 (mod +4): a Fineza concedida só aparece se
   ela realmente trocar o atributo.

   As três armas escolhidas cobrem os três casos:
     • Bastão            Marcial, SEM a propriedade Fineza
     • Espada Grande     NÃO Marcial, corpo a corpo, complexa
     • Adaga             Marcial COM Fineza, o caso que já funcionava */
const ARMAS = ["arm_bastao", "arm_espada_grande", "arm_adaga", "arm_nunchaku_pesado"];
const comLut = deriveAfty(ficha("lutador", 20, { forca: 10, destreza: 18, armas: ARMAS }));
const semLut = deriveAfty(ficha("restringido", 20, { forca: 10, destreza: 18, armas: ARMAS }));
const attrDe = (d, id) => linha(d, id).atributo;
const acertoDe = (d, id) => linha(d, id).acerto;

/* A régua: sem Lutador nenhuma delas tem Fineza concedida, e a Adaga já usava
   Destreza no dano pela propriedade dela. */
t("sem Lutador so a Adaga usa Destreza no dano",
  ARMAS.map((id) => attrDe(semLut, id)), ["forca", "forca", "destreza", "forca"]);

/* Corpo Treinado: "usar tanto Força quanto Destreza nos seus ataques desarmados
   e ataques com armas marciais". */
t("o Corpo Treinado da Destreza no dano das tres Marciais",
  ["arm_bastao", "arm_adaga", "arm_nunchaku_pesado"].map((id) => attrDe(comLut, id)),
  ["destreza", "destreza", "destreza"]);
t("e no acerto delas tambem",
  ["arm_bastao", "arm_adaga", "arm_nunchaku_pesado"]
    .map((id) => linha(comLut, id).partesAcerto[0].label),
  ["Destreza", "Destreza", "Destreza"]);
t("e no Ataque Basico", attrDe(comLut, "basico"), "destreza");

/* ⚠ E NÃO CHEGA NA ESPADA GRANDE. É o furo que existia até 2026-09-01: mirando o
   tipo `corpo`, toda arma de corpo a corpo levava Destreza de brinde. */
t("mas NAO chega na Espada Grande, que nao e Marcial", attrDe(comLut, "arm_espada_grande"), "forca");
t("nem no acerto dela", linha(comLut, "arm_espada_grande").partesAcerto[0].label, "Força");

/* Gosto pela Luta: mesma frase, mesmo recorte. O +6 do 20° nível sai por linha. */
const gostoEm = (d, id) => linha(d, id).partesAcerto.find((p) => p.label === "Gosto pela Luta")?.valor ?? 0;
t("Gosto pela Luta soma 6 de acerto no desarmado e nas Marciais",
  ["basico", "arm_bastao", "arm_adaga", "arm_nunchaku_pesado"].map((id) => gostoEm(comLut, id)),
  [6, 6, 6, 6]);
t("e nada na Espada Grande", gostoEm(comLut, "arm_espada_grande"), 0);
t("o acerto da Espada Grande fica igual ao de quem nao e Lutador",
  acertoDe(comLut, "arm_espada_grande"), acertoDe(semLut, "arm_espada_grande"));

/* ⚠ O DANO E A FORTITUDE NÃO TÊM RECORTE. A frase prende "desarmadas ou com
   armas marciais" só nas jogadas de ATAQUE, então o +4 de dano do 20° nível cai
   em toda linha, Espada Grande incluída. */
t("mas o bonus de DANO dele nao tem recorte, e alcanca a Espada Grande",
  linha(comLut, "arm_espada_grande").partes.find((p) => p.label === "Gosto pela Luta")?.valor, 4);

/* ============================================================ */
/* 4. O PISO DE 1 DAS ARTES DO COMBATE                           */
/* ============================================================ */

/* Sabedoria 8 é o mínimo do point-buy, então mod −1 é ficha comum. */
const dadosNomeadosDe = (d) => {
  const g = linha(d, "basico").gruposDano ?? [];
  return g.filter((x) => x.faces === 6).reduce((s, x) => s + x.dados, 0);
};
for (const [sab, esperado] of [[6, 1], [8, 1], [10, 1], [14, 2], [18, 3], [20, 3]]) {
  const d = deriveAfty(ficha("combatente", 20, { sab, combate: { arteExecucaoSilenciosa: true } }));
  t(`Execucao Silenciosa com Sabedoria ${sab} rola ${esperado}d6`, dadosNomeadosDe(d), esperado);
}

const defesaDescendente = (sab) => {
  const sem = deriveAfty(ficha("combatente", 20, { sab })).defesa;
  const com = deriveAfty(ficha("combatente", 20, { sab, combate: { arteGolpeDescendente: true } })).defesa;
  return com - sem;
};
for (const [sab, esperado] of [[6, 1], [8, 1], [10, 1], [14, 1], [18, 2]]) {
  t(`Golpe Descendente com Sabedoria ${sab} soma ${esperado} de Defesa`, defesaDescendente(sab), esperado);
}

for (const [sab, esperado] of [[4, 1], [6, 1], [8, 1], [10, 1], [14, 3]]) {
  t(`Pontos de Preparo no 1 nivel com Sabedoria ${sab}`,
    deriveAfty(ficha("combatente", 1, { sab })).pontosPreparo, esperado);
}

/* ============================================================ */

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
