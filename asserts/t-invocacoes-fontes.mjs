/* AS FONTES DOS NÚMEROS DA INVOCAÇÃO, 2026-09-03.

   O autor, sobre a Ficha Final da aba de Invocações:

     *"quando eu passo o mouse em cima, não aparece os valores."*

   Não aparecia porque nunca existiu: a aba montava o `NumeroComFontes` com
   `valor` e `total` e NUNCA com `partes`, então a lista de fontes saía vazia e o
   painel não abria. Todo número derivado do Afty mostra as fontes dele no hover,
   e os da Invocação eram os únicos de fora.

   ⚠ E O QUE ESTE ARQUIVO PROVA NÃO É QUE A LISTA EXISTE, É QUE ELA FECHA.
   Uma parcela esquecida entrega um painel que soma menos que o número acima
   dele, e esse é o bug pior dos dois: o número certo com o detalhamento errado
   é mais difícil de perceber do que o hover que não abre. Cada assert abaixo
   compara SOMA DAS PARCELAS contra o número que a tela mostra.

   ⚠ Este arquivo prova NÚMERO, e não aparência. Render não se testa aqui. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const INV = await import(R + "afty-invocacoes.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};
const soma = (lista) => (lista || []).reduce((n, p) => n + (Number(p.valor) || 0), 0);
/* Uma parcela sem rótulo é uma linha em branco no painel, e sem valor numérico
   ela não entra na soma: as duas seriam um painel que mente sem falhar a soma. */
const bemFormadas = (lista) =>
  Array.isArray(lista) && lista.length > 0
  && lista.every((p) => typeof p.label === "string" && p.label.length > 0 && Number.isFinite(Number(p.valor)));

/* ============================================================ */
/* A FICHA DE PROVA                                              */
/* ============================================================ */
/* Um Controlador de nível 20 com as habilidades que mexem em cada canal:
   Concentrar Poder (PV, Defesa, TR, dano), Fantoche Supremo (PV, Defesa,
   Deslocamento), Invocações Econômicas (custo) e as Melhorias Agressividade,
   Resistência e Precisão. Sem elas as listas teriam uma parcela só e o assert
   provaria pouco. */
const ficha = createBlankAfty();
ficha.name = "Controlador das Fontes";
ficha.core.nd = 20;
ficha.core.nivel = 20;
ficha.especializacoes = [{ id: "controlador", nivel: 20 }];
ficha.core.atributos = {
  forca: 12, destreza: 18, constituicao: 16, inteligencia: 18, sabedoria: 16, presenca: 18,
};
ficha.habilidades = [
  "ctr_concentrar_poder", "ctr_companheiro_amaldicoado", "ctr_fantoche_supremo",
  "ctr_invocacoes_economicas", "ctr_melhoria_de_controlador",
];
ficha.escolhasHabilidade = {
  ctr_melhoria_de_controlador: [
    "ctr_melhoria_agressividade", "ctr_melhoria_resistencia", "ctr_melhoria_precisao",
  ],
};

const alvo = INV.createBlankInvocacao("especial", "tecnica");
alvo.id = "inv-fontes";
alvo.nome = "Yamata no Orochi";
alvo.atributos = {
  forca: 10, destreza: 20, constituicao: 18, inteligencia: 16, sabedoria: 18, presenca: 10,
};
alvo.periciasProf = { acrobacia: "mestre", ocultismo: "treinado" };
alvo.trProf = { reflexos: "mestre", fortitude: "treinado" };
alvo.marcadores = {
  concentrar_poder: true, fantoche_supremo: true, invocacoes_economicas: true,
  mel_agressividade: true, mel_resistencia: true, mel_precisao: true,
};
alvo.marcadorOpcoes = { mel_precisao: "acerto" };
/* Uma Característica de RD e uma de Vida: as duas entram nas fontes por um
   caminho próprio (o agregado das passivas), e não pelo canal de Habilidade. */
const cRd = INV.createBlankCaracteristica();
cRd.nome = "Pelagem Densa"; cRd.subtipo = "rd"; cRd.rdTipo = "ct";
const cPv = INV.createBlankCaracteristica();
cPv.nome = "Corpo Colossal"; cPv.subtipo = "vida";
alvo.caracteristicas = [cRd, cPv];
/* Um Auxílio de Defesa em si mesma, para o assert alcançar o auxílio LIGADO:
   ele entra na Defesa e some dela quando o jogador desliga, e sem uma parcela
   nomeada o número cairia sem nada explicando. */
const aux = INV.createBlankAcao();
aux.id = "acao-guarda";
aux.nome = "Guarda de Escamas"; aux.familia = "auxilio"; aux.auxilioSub = "defesa";
aux.alvoAuxilio = "invocacao"; aux.classe = "simples";
alvo.acoes = [aux];

ficha.invocacoes = [alvo];

/* Sessão com a invocação em campo e o auxílio LIGADO: é o único estado em que
   `auxiliosLigadosDa` devolve fonte, e portanto o único que prova a parcela. */
const sessao = { invocacoes: { "inv-fontes": { emCampo: true, auxilios: { "acao-guarda": true } } } };
/* ⚠ A OPÇÃO SE CHAMA `invocacoes` no `deriveAfty`, e vira `sessaoInvocacoes`
   lá dentro. Passar o nome de dentro por fora deixa a invocação fora de campo,
   e aí nenhum auxílio liga. */
const d = deriveAfty(ficha, { invocacoes: sessao.invocacoes });
const inv = d.invocacoes.lista.find((x) => x.id === "inv-fontes");

t("a invocação de prova resolveu", !!inv, true);

/* ============================================================ */
/* 1. OS NÚMEROS DO STAT BLOCK                                   */
/* ============================================================ */
const F = inv.fontes || {};

t("PV: as fontes somam o PV", soma(F.pv), inv.pv);
t("PV: toda parcela tem rótulo e valor", bemFormadas(F.pv), true);
t("PV: a Característica de Vida aparece pelo nome",
  (F.pv || []).some((p) => p.label === "Corpo Colossal"), true);
t("PV: a base do grau aparece separada da Constituição e do ND",
  (F.pv || []).slice(0, 3).map((p) => p.label),
  ["Grau Especial (Base)", "Constituição", "Nível de Desafio"]);

t("Defesa: as fontes somam a Defesa", soma(F.defesa), inv.defesa);
t("Defesa: toda parcela tem rótulo e valor", bemFormadas(F.defesa), true);
/* ⚠ O AUXÍLIO LIGADO TEM DE APARECER PELO NOME DA AÇÃO. Ele é o único número
   da ficha que o jogador desliga com um clique, e um "+5" anônimo no painel
   deixaria o desaparecimento dele sem explicação. */
t("Defesa: o auxílio ligado aparece pelo nome da Ação",
  (F.defesa || []).some((p) => p.label === "Guarda de Escamas"), true);

t("Deslocamento: as fontes somam o Deslocamento", soma(F.deslocamento), inv.deslocamento);
t("Deslocamento: toda parcela tem rótulo e valor", bemFormadas(F.deslocamento), true);

t("RD Geral: as fontes somam a RD Geral", soma(F.rdGeral), inv.rd.geral);

/* A RD por tipo é a da Característica MAIS a Geral, porque a Geral "cobre todos
   os tipos": o número que vale contra aquele tipo é a soma dos dois. */
for (const linha of inv.rd.porTipo) {
  t(`RD ${linha.label}: as fontes somam o total do tipo`,
    soma(F.rdPorTipo?.[linha.chave]), linha.total);
  t(`RD ${linha.label}: a Característica aparece pelo nome`,
    (F.rdPorTipo?.[linha.chave] || []).some((p) => p.label === "Pelagem Densa"), true);
}

/* ⚠ O CUSTO DESCE, e por isso a parcela dele é NEGATIVA. A base é o custo do
   grau e a redução entra abatendo: uma parcela positiva somaria ao invés de
   abater, e o painel fecharia num número maior do que o botão de invocar. */
t("Custo: as fontes somam o custo", soma(F.custo), inv.custo);
t("Custo: a redução entra como parcela negativa",
  (F.custo || []).some((p) => p.valor < 0), true);

/* ⚠ AS DUAS ÚLTIMAS FILAS DO CARD, e elas NASCERAM em 2026-09-04, quando o
   autor perguntou *"pq passar o Mouse em Cima não mostra o calculo base? E só
   coisas extras?"*. Orçamento e Vagas de Perícia eram as únicas filas do card
   sem lista de fontes nenhuma, então a tela montava a explicação delas a partir
   dos canais e a base sumia. */
t("Orçamento: as fontes somam o total", soma(F.orcamento), inv.orcamento.total);
t("Orçamento: a base do grau e os adicionais aparecem separados",
  (F.orcamento || []).slice(0, 2).map((p) => p.label),
  ["Grau Especial (Base)", "Adicionais do Grau"]);
/* ⚠ E `caracteristicasLivres` NÃO ENTRA, porque ele é o pool EXCLUSIVO de
   Característica e corre por fora do `total`. O painel antigo o listava junto,
   e por isso fechava num número maior do que a fila mostrava. */
t("Orçamento: a vaga exclusiva de Característica fica FORA da soma",
  [(F.orcamento || []).some((p) => /Grátis|Exclusiv/i.test(p.label)),
    inv.orcamento.exclusivas >= 0], [false, true]);

t("Vagas de Perícia: as fontes somam a allowance", soma(F.vagasPericia), inv.pericias.allowance);
t("Vagas de Perícia: toda parcela tem rótulo e valor", bemFormadas(F.vagasPericia), true);
t("Vagas de Perícia: a base e o atributo aparecem, e nao so o canal",
  (F.vagasPericia || []).slice(0, 2).map((p) => p.label),
  ["Base", "Inteligência ou Sabedoria"]);

/* ============================================================ */
/* 2. OS TESTES                                                  */
/* ============================================================ */
const T = inv.testes;

t("CD: as parcelas somam a CD", soma(T.cdPartes), T.cd);
t("CD: toda parcela tem rótulo e valor", bemFormadas(T.cdPartes), true);

for (const [tipo, linha] of Object.entries(T.acerto)) {
  t(`Ataque ${tipo}: as parcelas somam o bônus`, soma(linha.partes), linha.bonus);
  t(`Ataque ${tipo}: toda parcela tem rótulo e valor`, bemFormadas(linha.partes), true);
}
/* Só o tipo TREINADO recebe a Maestria, e a parcela tem de sumir do outro:
   é a diferença entre os dois números, e o painel que a mostrasse nos dois
   estaria explicando um bônus que a linha não tem. */
t("Ataque: a Maestria só aparece no tipo treinado",
  [
    T.acerto.corpo.partes.some((p) => p.label === "Maestria"),
    T.acerto.distancia.partes.some((p) => p.label === "Maestria"),
  ],
  [true, false]);

for (const r of T.resistencias) {
  t(`TR ${r.label}: as parcelas somam o bônus`, soma(r.partes), r.bonus);
  t(`TR ${r.label}: toda parcela tem rótulo e valor`, bemFormadas(r.partes), true);
}
/* Mestre soma 1,5x a Maestria, e o rótulo diz qual das duas faixas é: sem isso
   o jogador vê "+9" numa ficha de Maestria +6 e não sabe de onde saiu a metade. */
t("TR: a faixa de Mestre se identifica no rótulo",
  T.resistencias.find((r) => r.value === "reflexos").partes
    .some((p) => p.label === "Maestria (Mestre)"), true);
t("TR: a faixa de Treinado se identifica no rótulo",
  T.resistencias.find((r) => r.value === "fortitude").partes
    .some((p) => p.label === "Maestria"), true);
/* O Concentrar Poder é o único bônus que vale SÓ para Testes de Resistência, e
   por isso ele é a prova de que os dois canais não se misturaram. */
t("TR: o bônus só de TR aparece no TR",
  T.resistencias.every((r) => r.partes.some((p) => p.label === "Concentrar Poder")), true);
t("Perícia: e não aparece na perícia",
  T.pericias.every((p) => !p.partes.some((x) => x.label === "Concentrar Poder")), true);

for (const p of T.pericias) {
  t(`Perícia ${p.nome}: as parcelas somam o bônus`, soma(p.partes), p.bonus);
  t(`Perícia ${p.nome}: toda parcela tem rótulo e valor`, bemFormadas(p.partes), true);
}

/* ============================================================ */
/* 3. A INVOCAÇÃO PELADA                                         */
/* ============================================================ */
/* ⚠ SEM DONO NENHUM AS LISTAS TÊM DE FECHAR IGUAL. É o caso do Encontro, onde
   a ficha do combatente pode chegar sem as habilidades do Controlador, e é onde
   um `dono.bt` ausente viraria uma parcela `undefined` que quebra a soma. */
const pelada = INV.resolveInvocacao(INV.createBlankInvocacao("quarto"), {});
t("Sem dono: PV fecha", soma(pelada.fontes.pv), pelada.pv);
t("Sem dono: Defesa fecha", soma(pelada.fontes.defesa), pelada.defesa);
t("Sem dono: Deslocamento fecha", soma(pelada.fontes.deslocamento), pelada.deslocamento);
t("Sem dono: Custo fecha", soma(pelada.fontes.custo), pelada.custo);
t("Sem dono: CD fecha", soma(pelada.testes.cdPartes), pelada.testes.cd);
t("Sem dono: os TRs fecham",
  pelada.testes.resistencias.every((r) => soma(r.partes) === r.bonus), true);
t("Sem dono: a Maestria não vira parcela zero na Defesa",
  pelada.fontes.defesa.some((p) => p.label === "Maestria"), false);

/* ============================================================ */
/* 4. AS FÓRMULAS NÃO MUDARAM                                    */
/* ============================================================ */
/* ⚠ `pvInvocacao` e `defesaInvocacao` viraram a SOMA de uma lista de parcelas
   nesta leva, e essa é a hora em que uma tabela de grau se perde. Um valor por
   grau, contra a tabela do livro. */
const donoBT = { nd: 20, bt: 6 };
const pvDe = (grau, con) => INV.pvInvocacao(
  { grau, atributos: { constituicao: con } }, { nd: 20 },
);
t("PV por grau segue a tabela",
  ["quarto", "terceiro", "segundo", "primeiro", "especial"].map((g) => pvDe(g, 18)),
  [10 + 9 + 20, 25 + 9 + 20, 40 + 18 + 20, 60 + 18 + 30, 80 + 18 + 40]);
t("Defesa por grau segue a tabela",
  ["quarto", "terceiro", "segundo", "primeiro", "especial"]
    .map((g) => INV.defesaInvocacao({ grau: g, atributos: { destreza: 20 } }, donoBT)),
  [10 + 5 + 6, 12 + 5 + 6, 16 + 5 + 6, 20 + 5 + 6, 24 + 5 + 6]);


/* ============================================================ */
/* 5. A CARACTERÍSTICA DE PROFICIÊNCIA EM TR                     */
/* ============================================================ */
/* Autor, 2026-09-03: *"Invocações de Segundo Grau podem fazer uma Característica
   pra se tornar Treinado em um TR. Invocações de Grau Especial podem fazer uma
   Característica para se tornar Mestre em um TR."*

   As três decisões dele, e cada uma tem assert porque nenhuma sai do texto:
   "de Segundo Grau" vale do Segundo para cima, o Especial SÓ dá Mestre, e o
   Mestre não cobra Treinado antes. */
const comCaracTR = (grau, trTipo, extras = {}) => {
  const i = INV.createBlankInvocacao(grau);
  i.trProf = { reflexos: "treinado" };
  Object.assign(i, extras);
  const c = INV.createBlankCaracteristica();
  c.nome = "Vontade de Ferro"; c.subtipo = "resistencia"; c.trTipo = trTipo;
  i.caracteristicas = [c];
  return INV.resolveInvocacao(i, { nd: 20, bt: 6 });
};
const faixaDe = (r, id) => {
  const linha = r.testes.resistencias.find((x) => x.value === id);
  return linha.mestre ? "mestre" : linha.treinado ? "treinado" : null;
};

t("Quarto Grau não treina TR por Característica", faixaDe(comCaracTR("quarto", "fortitude"), "fortitude"), null);
t("Terceiro Grau também não", faixaDe(comCaracTR("terceiro", "fortitude"), "fortitude"), null);
t("Segundo Grau treina", faixaDe(comCaracTR("segundo", "fortitude"), "fortitude"), "treinado");
/* ⚠ "DE SEGUNDO GRAU" É "DE SEGUNDO GRAU OU SUPERIOR" (autor, 2026-09-03). A
   leitura literal deixaria o Primeiro Grau sem uma opção que o grau ABAIXO
   dele tem, e foi por isso que a pergunta foi feita. */
t("Primeiro Grau treina também", faixaDe(comCaracTR("primeiro", "fortitude"), "fortitude"), "treinado");
t("Grau Especial vai a Mestre", faixaDe(comCaracTR("especial", "fortitude"), "fortitude"), "mestre");

/* ⚠ O MESTRE NÃO COBRA TREINADO ANTES. Fortitude não está no `trProf` da ficha
   em nenhum destes casos, e o Especial a leva direto a Mestre. */
t("o Mestre não exige Treinado antes",
  comCaracTR("especial", "fortitude").testes.resistencias.find((r) => r.value === "fortitude").mestre, true);

/* E a vaga base continua livre: a Característica não gasta a escolha da ficha. */
t("a Característica não gasta a vaga base de TR",
  INV.usoTR(INV.trProfDaInvocacao({ trProf: { reflexos: "treinado" } })), INV.TR_VAGAS_BASE);

/* ⚠ A CARACTERÍSTICA NUNCA REBAIXA. Reflexos já é Mestre na ficha; uma
   Característica de Segundo Grau apontada para ele daria "treinado", e o
   `Math.max` das faixas é o que impede a queda. */
t("a Característica não rebaixa um TR que a ficha já dominava",
  faixaDe(comCaracTR("segundo", "reflexos", { trProf: { reflexos: "mestre" } }), "reflexos"), "mestre");

/* O hover diz DE ONDE veio a faixa. Sem o nome, o jogador vê a Maestria num TR
   que ele não treinou na ficha e não tem como descobrir a origem. */
t("a parcela nomeia a Característica que concedeu a faixa",
  comCaracTR("especial", "fortitude").testes.resistencias
    .find((r) => r.value === "fortitude").partes
    .some((p) => p.label === "Maestria (Mestre) · Vontade de Ferro"), true);
t("e a faixa escolhida na ficha segue sem nome de fonte",
  comCaracTR("especial", "fortitude").testes.resistencias
    .find((r) => r.value === "reflexos").partes
    .some((p) => p.label === "Maestria"), true);

/* As parcelas continuam fechando com o número, que é a regra desta suíte. */
t("com faixa concedida, as parcelas do TR ainda somam o bônus",
  comCaracTR("especial", "fortitude").testes.resistencias
    .every((r) => soma(r.partes) === r.bonus), true);

/* Grau que não alcança AVISA, em vez de silenciar: uma Característica gasta
   vaga de orçamento, e uma que não faz nada tem de aparecer. */
t("o grau que não alcança vira aviso",
  comCaracTR("quarto", "fortitude").warnings.some((w) => w.includes("não pode treinar")), true);
t("e sem TR escolhido também",
  comCaracTR("especial", "").warnings.some((w) => w.includes("Escolha o Teste de Resistência")), true);
/* Integridade não é treinável por Invocação (regra do capítulo). */
t("Integridade não é treinável",
  comCaracTR("especial", "integridade").warnings.some((w) => w.includes("não pode ser treinado")), true);

/* Duas no MESMO TR são o mesmo efeito e não acumulam: vale a maior, com aviso.
   Em TRs diferentes convivem, como duas RDs de tipos diferentes. */
const duasNoMesmo = (() => {
  const i = INV.createBlankInvocacao("especial");
  const a = INV.createBlankCaracteristica();
  a.nome = "Vontade de Ferro"; a.subtipo = "resistencia"; a.trTipo = "fortitude";
  const b2 = INV.createBlankCaracteristica();
  b2.nome = "Couro Grosso"; b2.subtipo = "resistencia"; b2.trTipo = "fortitude";
  i.caracteristicas = [a, b2];
  return INV.resolveInvocacao(i, { nd: 20, bt: 6 });
})();
t("duas Características no mesmo TR avisam",
  duasNoMesmo.warnings.some((w) => w.includes("não acumulam")), true);
t("e o TR fica Mestre uma vez só", faixaDe(duasNoMesmo, "fortitude"), "mestre");

const duasEmTRsDiferentes = (() => {
  const i = INV.createBlankInvocacao("especial");
  const a = INV.createBlankCaracteristica();
  a.nome = "Vontade de Ferro"; a.subtipo = "resistencia"; a.trTipo = "fortitude";
  const b2 = INV.createBlankCaracteristica();
  b2.nome = "Mente Limpa"; b2.subtipo = "resistencia"; b2.trTipo = "vontade";
  i.caracteristicas = [a, b2];
  return INV.resolveInvocacao(i, { nd: 20, bt: 6 });
})();
t("em TRs diferentes as duas valem",
  [faixaDe(duasEmTRsDiferentes, "fortitude"), faixaDe(duasEmTRsDiferentes, "vontade")],
  ["mestre", "mestre"]);
t("e não avisam nada de acúmulo",
  duasEmTRsDiferentes.warnings.some((w) => w.includes("não acumulam")), false);

/* A tabela do grau cobre os cinco, e os dois de baixo são `null` EXPLÍCITO:
   chave ausente daria `undefined` com o mesmo efeito por acidente. */
t("a tabela do grau tem os cinco graus",
  Object.keys(INV.INV_CARACT_TR_PROF).sort(),
  ["especial", "primeiro", "quarto", "segundo", "terceiro"]);
t("e o validador de tabelas aceita a nova",
  INV.validarCatalogoInvocacoes().filter((e) => e.includes("INV_CARACT_TR_PROF")), []);

/* ============================================================ */
/* O PISO EM ZERO DAS VAGAS DE PERÍCIA                           */
/* ============================================================ */
/* ⚠ A allowance corta em zero (`Math.max(0, base + adic)`), e um painel que
   ignorasse o corte somaria MENOS do que o número mostrado. Com Inteligência e
   Sabedoria em 1 o mod é −5, a metade dele é −3, e a conta crua fica em −1.
   A parcela "Piso em zero" é o que faz o painel fechar sem mentir sobre a
   fórmula: ela mostra que o corte existiu, em vez de escondê-lo somando errado. */
const fraca = (() => {
  const i = INV.createBlankInvocacao("quarto");
  i.atributos = { forca: 10, destreza: 10, constituicao: 10, inteligencia: 1, sabedoria: 1, presenca: 10 };
  return INV.resolveInvocacao(i, { nd: 20, bt: 6 });
})();
t("a allowance nunca fica negativa", fraca.pericias.allowance, 0);
t("e as parcelas fecham no zero, com o corte declarado",
  [soma(fraca.fontes.vagasPericia),
    fraca.fontes.vagasPericia.some((p) => p.label === "Piso em zero")],
  [0, true]);
/* Contraprova: sem o corte, a mesma lista não teria a linha e fecharia em −1. */
t("e sem o corte a conta crua daria -1",
  soma(fraca.fontes.vagasPericia.filter((p) => p.label !== "Piso em zero")), -1);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
