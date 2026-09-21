/* Pacote Sem Técnica - Liberto: a origem de Addon que VARIA o Sem Técnica.

   Mede duas coisas, e as duas pelo MESMO JSON que a pessoa cola na aba Addons:

   1. O verbo `variacaoDe` (afty-origens.js, `origemMae`). A origem do pacote
      ganha um id próprio (`sem-tecnica-liberto:liberto`), e sem o verbo cada
      trava que pergunta "é Sem Técnica?" respondia não, calada: Feitiços
      abertos, Estilo das Sombras fechado e nenhum Talento de Origem do Sem
      Técnica. Aqui cada trava é conferida contra o Sem Técnica do livro.
   2. O conteúdo: Bônus em Atributo, Inquebrável e cada degrau do Caminho até o
      Fim no nível em que ele abre, e nem um antes.

   ⚠ O `variacaoDe` só aceita o Sem Técnica. Uma variação de outra origem é
   relatada pelo validador e responde como ela mesma, e isso também é medido. */
import { readFileSync } from "node:fs";
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const O = await import(R + "afty-origens.js");
const T = await import(R + "afty-talentos.js");
const E = await import(R + "afty-especializacoes.js");

const LIBERTO = JSON.parse(
  readFileSync(new URL("../addons/sem-tecnica-liberto.json", import.meta.url), "utf8"),
);

let ok = 0;
const falhas = [];
const t = (nome, real, esperado) => {
  const a = JSON.stringify(real);
  const b = JSON.stringify(esperado);
  if (a === b) ok += 1;
  else falhas.push(`${nome}\n     esperado ${b}\n     veio     ${a}`);
};

const ID = "sem-tecnica-liberto:liberto";
const pacote = A.normalizarPacote(LIBERTO);
t("pacote válido", A.validarPacote(LIBERTO), []);
t("instala sem problema de validador", A.aplicarAddons([pacote]).problemas, []);
t("origem instalada com o nome do pacote", O.getOrigem(ID)?.nome, "Sem Técnica - Liberto");
t("a origem aparece no seletor", O.AFTY_ORIGENS.some((o) => o.value === ID), true);

/* ---------------- o verbo ---------------- */
t("a mãe do Liberto é o Sem Técnica", O.origemMae(ID), "sem_tecnica");
t("origem do livro é mãe de si mesma", O.origemMae("sem_tecnica"), "sem_tecnica");
t("origem sem variação responde ela mesma", O.origemMae("inato"), "inato");
t("sem origem, sem mãe", O.origemMae(null), null);

/** Uma ficha do Liberto no nível pedido, com as escolhas dadas. */
const liberto = (nd, escolhas = {}, extra = {}) => {
  const c = createBlankAfty();
  c.core.nd = nd;
  c.addons = [pacote];
  c.core.origem = { id: ID, escolhas };
  return Object.assign(c, extra);
};
const semTecnica = (nd, extra = {}) => {
  const c = createBlankAfty();
  c.core.nd = nd;
  c.core.origem = { id: "sem_tecnica", escolhas: {} };
  return Object.assign(c, extra);
};
/** A soma de um canal vinda SÓ do Liberto (a origem ou as opções dela). */
const linhas = (d) => d.efeitos.detalhes ?? [];
const doLiberto = (d, canal, alvo = null) => linhas(d)
  .filter((e) => e.canal === canal && (alvo == null || e.alvo === alvo))
  .filter((e) => e.origem === ID || String(e.origem).startsWith("lib_"))
  .reduce((s, e) => s + e.valor, 0);

for (const sistema of ["afty", "player"]) {
  const rv = { rulesVersion: sistema };
  const d3 = deriveAfty(liberto(3, {}, rv));
  const d4 = deriveAfty(liberto(4, {}, rv));
  const st4 = deriveAfty(semTecnica(4, rv));
  t(`${sistema}: Liberto não cria Feitiço, como o Sem Técnica`,
    [d4.feiticos.tiposPermitidos, d4.feiticos.mostraCard],
    [st4.feiticos.tiposPermitidos, st4.feiticos.mostraCard]);
  t(`${sistema}: o card de Feitiços fica fechado`, d4.feiticos.mostraCard, false);
  t(`${sistema}: Estilo das Sombras fechado no nível 3`, d3.estilo.disponivel, false);
  t(`${sistema}: Estilo das Sombras abre no nível 4`, d4.estilo.disponivel, true);
  t(`${sistema}: Domínio Simples só a partir do 4`,
    [d3.aptidoesEscolhidas.includes("dominio_simples"), d4.aptidoesEscolhidas.includes("dominio_simples")],
    [false, true]);
  t(`${sistema}: Domínio Simples concedido pela origem, sem vaga`,
    d4.aptidoesConcedidasOrigem.includes("dominio_simples"), true);
  t(`${sistema}: TR de Vontade treinado desde o 1`,
    deriveAfty(liberto(1, {}, rv)).testes.resistencias.find((r) => r.value === "vontade").prof, "treinado");
  t(`${sistema}: o Liberto não herda os Estudos Dedicados`, doLiberto(d4, "vagasPericia"), 0);
}

/* ---------------- qualificação e estrutura ---------------- */
const quali = liberto(8);
t("conta como Sem Técnica para qualificar", O.origensQualificadas(quali), [ID, "sem_tecnica"]);
t("a estrutura é a do Sem Técnica", O.origemEstrutural(quali), "sem_tecnica");
t("alcança o Talento de Origem do Sem Técnica",
  T.avaliarRequisitoTalento({ tipo: "origem", id: "sem_tecnica" }, { origensQualificadas: O.origensQualificadas(quali) }).ok,
  true);
t("veta o Especialista em Técnicas",
  E.especializacoesDisponiveis(ID, O.origensQualificadas(quali)).some((e) => e.id === "conjurador"), false);
t("e o Sem Técnica do livro segue vetando",
  E.especializacoesDisponiveis("sem_tecnica", O.origensQualificadas(semTecnica(8))).some((e) => e.id === "conjurador"), false);

/* ---------------- Bônus em Atributo ---------------- */
const bonus = O.caracteristicasEfetivas(liberto(1)).find((c) => c.id === "bonus_atributo")?.bonus;
t("Bônus em Atributo: 4 pontos, até 3 no mesmo", bonus, { distribuir: 4, maxPorAtributo: 3 });
const distribuido = liberto(1);
distribuido.core.origem.bonusAtributos = { forca: 3, destreza: 1 };
t("os pontos distribuídos entram no atributo", O.resolveOrigemAttrBonus(distribuido), { forca: 3, destreza: 1 });

/* ---------------- Inquebrável: troca de atributo ---------------- */
const inq = deriveAfty(liberto(1, { lib_inq_pericia: ["lib_inq_per_intuicao"], lib_inq_atributo: ["lib_inq_atr_forca"] }));
t("Inquebrável troca o atributo da perícia escolhida",
  inq.testes.pericias.find((p) => p.id === "intuicao").atributo, "forca");
t("e só dela", inq.testes.pericias.find((p) => p.id === "percepcao").atributo, "sabedoria");
t("sem escolher o atributo, nada troca",
  deriveAfty(liberto(1, { lib_inq_pericia: ["lib_inq_per_intuicao"] })).testes.pericias.find((p) => p.id === "intuicao").atributo,
  "sabedoria");

/* ---------------- Caminho até o Fim ---------------- */
const TUDO = {
  lib_n1: ["lib_n1_talento"],
  lib_n3: ["lib_n3_tr_fortitude"],
  lib_n13: ["lib_n13_per_percepcao"],
  lib_n17_pericia: ["lib_n17_per_atletismo"],
  lib_n17_jogada: ["lib_n17_atq_corpo"],
};
const em = (nd, escolhas = TUDO) => deriveAfty(liberto(nd, escolhas));

t("nível 1: Talento vira vaga exclusiva de Talento", doLiberto(em(1), "vagasTalento"), 1);
t("nível 1: a outra opção vira vaga de Aptidão",
  [doLiberto(em(1, { lib_n1: ["lib_n1_aptidao"] }), "vagasAptidao"), doLiberto(em(1, { lib_n1: ["lib_n1_aptidao"] }), "vagasTalento")],
  [1, 0]);
t("nível 1: só uma das duas", O.resolveEscolhasOrigem(liberto(1, { lib_n1: ["lib_n1_talento", "lib_n1_aptidao"] }), 1).porEscolha?.lib_n1?.excedeu, true);

t("nível 2: o degrau do 3 ainda não vale", doLiberto(em(2), "bonusTR", "fortitude"), 0);
t("nível 3: +2 no TR escolhido", doLiberto(em(3), "bonusTR", "fortitude"), 2);
t("nível 3: ou +2 na perícia escolhida",
  doLiberto(em(3, { lib_n3: ["lib_n3_per_furtividade"] }), "bonusPericia", "furtividade"), 2);
t("nível 3: o degrau do 13 ainda não vale", doLiberto(em(3), "bonusPericia", "percepcao"), 0);

t("nível 5: nenhuma Habilidade de Especialização a mais", doLiberto(em(5), "vagasHabilidade"), 0);
t("nível 6: uma Habilidade de Especialização a mais", doLiberto(em(6), "vagasHabilidade"), 1);
t("nível 19: continua uma só", doLiberto(em(19), "vagasHabilidade"), 1);

t("nível 9: nenhuma Técnica de Estilo a mais", em(9).orcamentoHabilidades.exclusivasEstilo, 0);
t("nível 10: uma Técnica de Estilo a mais", em(10).orcamentoHabilidades.exclusivasEstilo, 1);
t("nível 15: duas", em(15).orcamentoHabilidades.exclusivasEstilo, 2);
t("a vaga é de Estilo, e não de Feitiço", em(15).orcamentoHabilidades.exclusivasFeitico, 0);

t("nível 13: +5 na perícia escolhida", doLiberto(em(13), "bonusPericia", "percepcao"), 5);
t("nível 16: o degrau do 17 ainda não vale",
  [doLiberto(em(16), "bonusPericia", "atletismo"), doLiberto(em(16), "bonusAcerto", "corpo")], [0, 0]);
t("nível 17: +3 na perícia e +2 no ataque escolhidos",
  [doLiberto(em(17), "bonusPericia", "atletismo"), doLiberto(em(17), "bonusAcerto", "corpo")], [3, 2]);
t("nível 17: ou +2 no TR",
  doLiberto(em(17, { lib_n17_jogada: ["lib_n17_tr_reflexos"] }), "bonusTR", "reflexos"), 2);
t("o bônus do 17 chega no teste",
  em(17).testes.pericias.find((p) => p.id === "atletismo").bonus
    - em(17, { ...TUDO, lib_n17_pericia: [] }).testes.pericias.find((p) => p.id === "atletismo").bonus,
  3);

const area = (nd) => em(nd).dominioSimples.partesArea.find((p) => p.label === "Caminho até o Fim")?.valor ?? 0;
t("nível 18: o Domínio Simples ainda não cresce", area(18), 0);
t("nível 19: o Domínio Simples cresce 3,5 m", area(19), 3.5);
t("e o crescimento soma na área", em(19).dominioSimples.area - em(18).dominioSimples.area, 3.5);

/* O hover nomeia a característica e a opção, e não só a opção. */
t("o hover diz de onde veio o +5",
  linhas(em(13)).find((e) => e.origem === "lib_n13_per_percepcao")?.nome, "Caminho até o Fim (Percepção)");
t("o TR de Vontade tem o nome da característica",
  linhas(em(1)).find((e) => e.canal === "proficienciaTR" && e.origem === ID)?.nome, "Inquebrável");

/* ---------------- Verdadeiras Origens ---------------- */
const gemeo = (pacotes) => {
  const c = createBlankAfty();
  c.core.nd = 5;
  c.addons = pacotes;
  c.core.origem = { id: "gemeos", escolhas: {} };
  return c;
};
const opcoesVO = (c) => O.caracteristicasEfetivas(c)
  .find((x) => x.escolha?.id === "verdadeiras_origens")?.escolha.opcoes.map((o) => o.id) ?? [];
t("o Gêmeo não copia do Liberto, como não copia do Sem Técnica",
  opcoesVO(gemeo([pacote])).some((id) => id.includes("liberto")), false);
const soltaGemeos = A.normalizarPacote({ id: "solta-gemeos", nome: "Solta Gêmeos", paraRaw: "afty", libera: ["gemeosSemTecnica"] });
A.aplicarAddons([pacote, soltaGemeos]);
t("com o Sem Técnica solto, o Liberto vem junto",
  opcoesVO(gemeo([pacote, soltaGemeos])).filter((id) => id.includes("liberto")),
  [`vo_${ID}_inquebravel`, `vo_${ID}_caminho_ate_o_fim`]);
A.aplicarAddons([pacote]);

/* ---------------- a mãe fora da lista ---------------- */
for (const [mae, trecho] of [["restringido", "ainda não aceita restringido"], ["nao_existe", "não é do livro"]]) {
  const ruim = structuredClone(LIBERTO);
  ruim.acrescenta.origens[0].variacaoDe = mae;
  const { problemas } = A.aplicarAddons([A.normalizarPacote(ruim)]);
  t(`variacaoDe "${mae}" é relatada`, problemas.flatMap((p) => p.problemas).some((m) => m.includes(trecho)), true);
  t(`variacaoDe "${mae}" é ignorada, e a origem responde como ela mesma`, O.origemMae(ID), ID);
}
A.aplicarAddons([]);
t("sem o pacote a origem some", O.getOrigem(ID), null);
t("e o Sem Técnica do livro não mudou", O.origemMae("sem_tecnica"), "sem_tecnica");

if (falhas.length) {
  console.error(`FALHOU ${falhas.length} de ${ok + falhas.length}:\n  - ${falhas.join("\n  - ")}`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
