/* REQUISITO DE TREINO EM PERÍCIA E EM TESTE DE RESISTÊNCIA, 2026-09-01.

   O `nota` só EXIBE, e existe para pré-requisito de sistema que ainda não havia
   sido construído. Perícias e TRs existem desde julho, e 31 requisitos de
   Habilidade e de Talento continuavam como `nota`, decorativos. O autor mandou
   fechar: *"fazer os Requisitos serem REALMENTE necessários. Pode fazer a
   varredura."*

   ⚠ AS APTIDÕES JÁ TINHAM FEITO ESTA CONVERSÃO em 2026-07-30, com o `pericia`
   escrito à mão dentro do afty-aptidoes.js. Fechar as outras duas famílias
   transformaria uma cópia em três, então a leitura desceu para o
   afty-pericias-catalogo.js, que é FOLHA, e as três a chamam.

   O que este arquivo mede:

     1. NÃO SOBROU NOTA CONVERSÍVEL. Toda nota que ainda existe é medida contra
        uma lista nomeada: nota nova que peça treino falha aqui.
     2. CADA FORMA DO REQUISITO, nas duas direções (reprova sem, aprova com).
     3. ⚠ A FAIXA CONCEDIDA PELO MOTOR VALE. Quem ganhou Mestre em Furtividade de
        uma habilidade atende ao requisito sem ter gasto vaga.
     4. ⚠ FALTA DE CONTEXTO NÃO É FALTA DE TREINO. Sem o mapa, o requisito cai
        para não verificável em vez de trancar a ficha. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const {
  AFTY_HABILIDADES, getHabilidade, avaliarAcessoHabilidade, validarCatalogoHabilidades,
} = await import(R + "afty-habilidades.js");
const {
  AFTY_TALENTOS, getTalento, avaliarAcessoTalento, validarCatalogoTalentos,
} = await import(R + "afty-talentos.js");
const { AFTY_APTIDOES, validarCatalogoAptidoes } = await import(R + "afty-aptidoes.js");
const { avaliarRequisitoDeTreino, conferirRequisitoDeTreino } = await import(R + "afty-pericias-catalogo.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. NÃO SOBROU NOTA CONVERSÍVEL                                */
/* ============================================================ */

/* ⚠ ESTA LISTA É O PORTÃO. As notas que ficam não pedem treino: elas pedem
   sistema que não existe (conjurar Feitiço) ou citam uma habilidade pelo NOME em
   vez do id, que é outro problema e está em a-fazer.md. Uma nota NOVA que peça
   "Treinado em X" cai aqui, e é o aviso de que a conversão foi esquecida. */
const NOTAS_QUE_FICAM = [
  "Possuir Feitiços",                        // Adepto de Feitiçaria: não é perícia
  "Capacidade de Conjurar Feitiços Nível 4", // Técnica Máxima: sistema de Feitiço
  "Ápice Corporal Humano",                   // Fluxo Invencível: cita nome sem id
  "Agilidade no Campo de Batalha",           // Rei do Tabuleiro: idem, e está em a-fazer.md
];
const textoDaNota = (r) => r.texto ?? r.label ?? "";
const notasVivas = [];
for (const lista of [AFTY_HABILIDADES, AFTY_TALENTOS, AFTY_APTIDOES]) {
  for (const h of lista) {
    for (const r of h.requisitos || []) {
      if (r?.tipo === "nota") notasVivas.push(textoDaNota(r));
    }
  }
}
t("nenhuma nota fora da lista nomeada",
  [...new Set(notasVivas)].filter((n) => !NOTAS_QUE_FICAM.includes(n)), []);
/* E o contrário: nota que PEDE treino e continuou nota. A palavra "Treinado",
   "Treinamento" ou "Mestre" é o sinal, e nenhuma das que ficam a usa. */
t("nenhuma nota viva fala de treino",
  notasVivas.filter((n) => /treinad|treinament|mestre/i.test(n)), []);

/* Os três validadores de catálogo passam limpos, agora que conferem o id da
   perícia, do TR e do Ofício de cada requisito. */
t("validador das Habilidades limpo", validarCatalogoHabilidades(), []);
t("validador dos Talentos limpo", validarCatalogoTalentos(), []);
t("validador das Aptidoes limpo", validarCatalogoAptidoes(), []);

/* E ele PEGA um id errado, senão passar limpo não prova nada. */
t("conferir reprova pericia inexistente",
  !!conferirRequisitoDeTreino({ tipo: "pericia", pericia: "arqueria" }), true);
t("conferir reprova TR inexistente",
  !!conferirRequisitoDeTreino({ tipo: "resistencia", resistencia: "sorte" }), true);
t("conferir reprova periciaOr de um item so",
  !!conferirRequisitoDeTreino({ tipo: "periciaOr", pericias: ["historia"] }), true);
t("conferir aprova o que existe",
  conferirRequisitoDeTreino({ tipo: "pericia", pericia: "furtividade" }), null);

/* ============================================================ */
/* 2. CADA FORMA, NAS DUAS DIREÇÕES                              */
/* ============================================================ */

const ficha = (o = {}) => {
  const { pericias = {}, trs = {}, oficios = {}, habilidades = [], classe = "suporte" } = o;
  const c = createBlankAfty();
  c.rulesVersion = "player";
  c.core = { ...c.core, nd: 20, tipo: "combatente", patamar: "comum" };
  c.especializacoes = [{ id: classe, nivel: 20 }];
  c.habilidades = habilidades;
  c.pericias = pericias;
  c.resistenciasProf = trs;
  c.periciaOficios = oficios;
  c.attributes = { forca: 10, destreza: 10, constituicao: 16, inteligencia: 10, sabedoria: 10, presenca: 10 };
  return c;
};
/* Todas as Classes com nível 20 no contexto: este arquivo mede o requisito de
   TREINO, e não o de nível, que t-lutador-nivel.mjs já cobre. */
const ctxHab = (d) => ({
  niveisPorEspec: {
    lutador: 20, combatente: 20, conjurador: 20, suporte: 20, controlador: 20, restringido: 20,
  },
  escolhidas: [], attrEff: d.attrEff, aptidoes: [],
  periciaProf: d.periciaProf, resistenciaProf: d.resistenciaProf, periciaOficios: d.periciaOficios,
});
const ctxTal = (d) => ({
  nd: 20, attrEff: d.attrEff, talentos: [], aptidoes: [],
  origemId: "herdado", origensQualificadas: ["herdado", "inato"],
  periciaProf: d.periciaProf, resistenciaProf: d.resistenciaProf, periciaOficios: d.periciaOficios,
});

/** Reprova sem, aprova com. É o par que prova que o requisito virou real. */
const par = (rotulo, avaliar, entrada, sem, com) => {
  const a = avaliar(entrada, deriveAfty(ficha(sem)));
  const b = avaliar(entrada, deriveAfty(ficha(com)));
  t(`${rotulo} reprova sem e aprova com`, [a.ok, b.ok], [false, true]);
};
const hab = (id) => (x, d) => avaliarAcessoHabilidade(getHabilidade(id), ctxHab(d));
const tal = (id) => (x, d) => avaliarAcessoTalento(getTalento(id), ctxTal(d));

/* ---- `pericia`, treinado e mestre ---- */
par("Sombra Viva (Treinado em Furtividade)", hab("cmb_sombra_viva"), null,
  {}, { pericias: { furtividade: "treinado" } });
/* ⚠ MESTRE NÃO SE SATISFAZ COM TREINADO, e é o par que separa as duas faixas. */
par("Assassinar (Mestre em Furtividade)", hab("cmb_assassinar"), null,
  { pericias: { furtividade: "treinado" } }, { pericias: { furtividade: "mestre" } });
par("Deboche Desconcertante (Treinado em Intimidacao)", hab("lut_deboche_desconcertante"), null,
  {}, { pericias: { intimidacao: "treinado" } });
par("Pressao do Medico (Mestre em Medicina)", hab("sup_pressao_do_medico"), null,
  { pericias: { medicina: "treinado" } }, { pericias: { medicina: "mestre" } });
par("Feiticaria Implementada (Treinado em Feiticaria)", hab("cmb_feiticaria_implementada"), null,
  {}, { pericias: { feiticaria: "treinado" } });

/* ---- `resistencia`: os TRs, que a perícia não cobre ---- */
par("Alma Quieta (Treinado em Vontade)", hab("lut_alma_quieta"), null,
  {}, { trs: { vontade: "treinado" } });
par("Corpo Sincronizado (Treinado em Fortitude)", hab("lut_corpo_sincronizado"), null,
  {}, { trs: { fortitude: "treinado" } });
par("Mente em Paz (Treinado em Astucia)", hab("lut_mente_em_paz"), null,
  {}, { trs: { astucia: "treinado" } });
par("Primeiro Disparo (Treinado em Reflexos)", hab("cnj_primeiro_disparo"), null,
  {}, { trs: { reflexos: "treinado" } });
/* ⚠ TR E PERÍCIA SÃO MAPAS DIFERENTES. Ser Mestre em toda perícia não dá o TR. */
t("perícia nenhuma satisfaz um requisito de TR",
  avaliarAcessoHabilidade(getHabilidade("lut_alma_quieta"),
    ctxHab(deriveAfty(ficha({ pericias: { intuicao: "mestre", ocultismo: "mestre" } })))).ok,
  false);

/* ---- `oficio`: um Ofício NOMEADO ---- */
par("Criar Medicina (Oficio Ferramentas de Medico)", hab("sup_criar_medicina"), null,
  { pericias: { oficio: "treinado" }, oficios: { oficio: ["Ferreiro"] } },
  { pericias: { oficio: "treinado" }, oficios: { oficio: ["Ferramentas de Médico"] } });
/* ⚠ A COMPARAÇÃO É NORMALIZADA: o nome é texto livre digitado pelo jogador, e
   acento e caixa não podem decidir um pré-requisito. */
t("o nome do Oficio compara sem acento e sem caixa",
  avaliarAcessoHabilidade(getHabilidade("sup_criar_medicina"), ctxHab(deriveAfty(ficha({
    pericias: { oficio: "treinado" }, oficios: { oficio: ["  ferramentas de medico "] },
  })))).ok, true);
/* E ter o Ofício certo SEM treino não basta. */
t("o Oficio certo sem treino nao basta",
  avaliarAcessoHabilidade(getHabilidade("sup_criar_medicina"), ctxHab(deriveAfty(ficha({
    oficios: { oficio: ["Ferramentas de Médico"] },
  })))).ok, false);

/* ---- `oficios`: quantos, e não quais ---- */
par("Mestre da Criacao (dois Oficios)", tal("tal_mestre_da_criacao"), null,
  { pericias: { oficio: "treinado" } },
  { pericias: { oficio: "treinado", oficio__2: "treinado" } });

/* ---- `periciaAtributo`: qualquer perícia daquele atributo ---- */
par("Discurso Motivador (alguma pericia de Presenca)", tal("tal_discurso_motivador"), null,
  { pericias: { acrobacia: "mestre", medicina: "mestre" } },
  { pericias: { intimidacao: "treinado" } });
/* O pool sai do catálogo pelo atributo, então QUALQUER uma das de Presença serve. */
t("Enganacao e Persuasao tambem servem",
  ["enganacao", "persuasao", "performance"].map((p) =>
    avaliarAcessoTalento(getTalento("tal_discurso_motivador"),
      ctxTal(deriveAfty(ficha({ pericias: { [p]: "treinado" } })))).ok),
  [true, true, true]);

/* ---- `periciaOr`: basta uma das duas ---- */
t("Manual de Tecnica aceita Historia OU Ocultismo",
  ["historia", "ocultismo"].map((p) =>
    avaliarRequisitoDeTreino(
      { tipo: "periciaOr", pericias: ["historia", "ocultismo"], nivel: "treinado" },
      { periciaProf: { [p]: "treinado" } },
    ).ok),
  [true, true]);
t("e reprova quem nao tem nenhuma das duas",
  avaliarRequisitoDeTreino(
    { tipo: "periciaOr", pericias: ["historia", "ocultismo"], nivel: "treinado" },
    { periciaProf: { medicina: "mestre" } },
  ).ok, false);

/* ============================================================ */
/* 3. A FAIXA CONCEDIDA PELO MOTOR VALE                          */
/* ============================================================ */

/* ⚠ LÊ A PROFICIÊNCIA RESOLVIDA, e não a marcada na ficha. A Anatomia Olhos
   Sombrios (Feto Amaldiçoado Híbrido) diz "você se torna treinado em Percepção",
   e quem a tem atende ao requisito da Mira Destrutiva sem ter gasto vaga de
   perícia nenhuma. Se este assert falhar, o requisito passou a ler a ficha CRUA e
   virou cobrança dupla: o jogador pagaria de novo pelo que já ganhou. */
const comAnatomia = (anatomias) => {
  const c = ficha({ classe: "combatente" });
  c.core = { ...c.core, origem: { id: "feto_amaldicoado_hibrido", anatomias } };
  return deriveAfty(c);
};
const semApt = comAnatomia([]);
const comApt = comAnatomia(["olhos_sombrios"]);
t("a ficha nao marcou Percepcao em nenhum dos dois", semApt.periciaProf.percepcao, null);
t("mas a Anatomia a concede treinada", comApt.periciaProf.percepcao, "treinado");
t("e a concedida ja atende a Mira Destrutiva", [
  avaliarAcessoHabilidade(getHabilidade("cmb_mira_destrutiva"), ctxHab(semApt)).ok,
  avaliarAcessoHabilidade(getHabilidade("cmb_mira_destrutiva"), ctxHab(comApt)).ok,
], [false, true]);
/* ⚠ E TREINADO NÃO VIRA MESTRE por tabela: a mesma concessão não abre os
   Sentidos Aguçados, que pedem Mestre em Percepção. */
t("mas nao atende quem pede MESTRE em Percepcao",
  avaliarAcessoHabilidade(getHabilidade("cnj_sentidos_agucados"), ctxHab(comApt)).ok, false);

/* ============================================================ */
/* 4. FALTA DE CONTEXTO NÃO É FALTA DE TREINO                    */
/* ============================================================ */

/* Uma tela que esqueça de passar o mapa não pode trancar a ficha do jogador: o
   requisito vira NÃO VERIFICÁVEL, exibe e deixa passar. É a mesma política do
   `aptidao` dos Talentos e da referência pendente do `habilidade`. */
const semMapa = avaliarAcessoHabilidade(getHabilidade("cmb_assassinar"), {
  niveisPorEspec: { combatente: 20 }, escolhidas: [],
});
t("sem periciaProf o requisito nao bloqueia", semMapa.ok, true);
t("e ele se declara nao verificavel",
  semMapa.extras.map((e) => [e.label, e.verificavel]), [["Mestre em Furtividade", false]]);
const semTR = avaliarAcessoHabilidade(getHabilidade("lut_alma_quieta"), {
  niveisPorEspec: { lutador: 20 }, escolhidas: [], periciaProf: {},
});
t("e o mesmo vale para o TR, que tem mapa proprio",
  [semTR.ok, semTR.extras[0].verificavel], [true, false]);

/* ============================================================ */
/* 5. O RÓTULO É O QUE O JOGADOR LÊ NO CHIP                      */
/* ============================================================ */

const rot = (req) => avaliarRequisitoDeTreino(req, { periciaProf: {}, resistenciaProf: {}, periciaOficios: {} }).label;
t("os rotulos saem por extenso e com acento", [
  rot({ tipo: "pericia", pericia: "furtividade", nivel: "mestre" }),
  rot({ tipo: "pericia", pericia: "prestidigitacao", nivel: "treinado" }),
  rot({ tipo: "resistencia", resistencia: "astucia", nivel: "treinado" }),
  rot({ tipo: "oficio", nome: "Ferramentas de Ferreiro", nivel: "treinado" }),
  rot({ tipo: "oficios", quantidade: 2, nivel: "treinado" }),
  rot({ tipo: "oficios", quantidade: 1, nivel: "treinado" }),
  rot({ tipo: "periciaAtributo", attr: "presenca", nivel: "treinado" }),
  rot({ tipo: "periciaOr", pericias: ["historia", "ocultismo"], nivel: "treinado" }),
], [
  "Mestre em Furtividade",
  "Treinado em Prestidigitação",
  "Treinado em Astúcia",
  "Treinado em Ferramentas de Ferreiro",
  "Treinado em 2 Ofícios",
  "Treinado em 1 Ofício",
  "Treinado em alguma perícia de Presença",
  "Treinado em História ou Ocultismo",
]);

/* Tipo que não é de treino devolve `null`, e é assim que os três avaliadores
   sabem que a pergunta não é deles. */
t("tipo alheio devolve null", avaliarRequisitoDeTreino({ tipo: "atributo", attr: "forca" }, {}), null);
t("e requisito vazio tambem", avaliarRequisitoDeTreino(undefined, {}), null);

/* ============================================================ */

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
