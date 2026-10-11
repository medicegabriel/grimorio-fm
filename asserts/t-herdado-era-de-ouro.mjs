/* HERDADO DA ERA DE OURO (addon, 2026-10-11).

   A origem do suplemento Era de Ouro, lida de `addons/herdado-era-de-ouro.json`.
   Uma origem PRÓPRIA (autor: não conta como o Herdado do livro) que se divide
   em três clãs, Fujiwara, Sugawara e Akutame, mais os 7 Talentos de Origem.
   Prende os dois pedaços de motor que ela pediu:
     • `concedeAptidoes` num Talento: o Desabrochar do Conhecimento Herdado dá a
       Emoção da Pétala Decadente sem vaga e sem o pré-requisito dela;
     • o clã de uma origem de Addon não vaza mais para o Herdado do livro. Desde
       2026-09-22 os 5 Tipos da Maldição Era de Ouro apareciam no seletor de
       clãs do Herdado e como cópia de Herdado no Verdadeiras Origens. */
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
const TAL = await import(R + "afty-talentos.js");
const EFE = await import(R + "afty-efeitos.js");
const BUF = await import(R + "ficha/ficha-buffs.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. O PACOTE                                                   */
/* ============================================================ */
const ler = (n) => JSON.parse(readFileSync(new URL(`../addons/${n}.json`, import.meta.url), "utf8"));
const HEO = ler("herdado-era-de-ouro");
t("o pacote valida", A.validarPacote(HEO), []);
t("autor e sistema-alvo", [HEO.autor, HEO.paraRaw], ["Templas", "afty"]);
const pHEO = A.normalizarPacote(HEO);
const pMEO = A.normalizarPacote(ler("maldicao-era-de-ouro"));
t("aplicar não relata problema", A.aplicarAddons([pHEO]).length ?? 0, 0);

const ORIGEM = "herdado-era-de-ouro:herdado_era_de_ouro";
const FUJIWARA = "herdado-era-de-ouro:cla_fujiwara";
const SUGAWARA = "herdado-era-de-ouro:cla_sugawara";
const AKUTAME = "herdado-era-de-ouro:cla_akutame";
const tal = (id) => `herdado-era-de-ouro:${id}`;
t("a origem existe, com o nome", O.getOrigem(ORIGEM)?.nome, "Herdado da Era de Ouro");
t("os três clãs, com a definição inteira",
  O.clasDaOrigem(ORIGEM).map((c) => [c.id, c.caracteristicas?.length]),
  [[FUJIWARA, 3], [SUGAWARA, 3], [AKUTAME, 3]]);
t("é origem própria: não responde como o Herdado", O.origemMae(ORIGEM), ORIGEM);
t("os 7 Talentos, no grupo Origem",
  ["tal_manuscrito_ancestral", "tal_desabrochar_do_conhecimento_herdado", "tal_fortes_conviccoes",
    "tal_arsenal_do_maior_cla", "tal_fundamentos_imponentes", "tal_compreensao_avancada",
    "tal_postura_do_matador_de_yokai"].map((id) => TAL.getTalento(tal(id))?.grupo),
  Array(7).fill("origem"));
t("o requisito de clã ganha o prefixo do pacote",
  TAL.getTalento(tal("tal_fortes_conviccoes"))?.requisitos?.[0], { tipo: "cla", id: FUJIWARA });

/* ============================================================ */
/* 2. O CLÃ DE ORIGEM DE ADDON NÃO VAZA PARA O HERDADO           */
/* ============================================================ */
const LIVRO = ["cla_gojo", "cla_inumaki", "cla_kamo", "cla_zenin"];
A.aplicarAddons([pHEO, pMEO]);
t("o Herdado do livro segue com os 4 clãs dele", O.clasDaOrigem("herdado").map((c) => c.id), LIVRO);
t("e a Maldição Era de Ouro com os 5 Tipos dela",
  O.clasDaOrigem("maldicao-era-de-ouro:maldicao_era_de_ouro").map((c) => c.id.split(":")[1]),
  ["tipo_comum", "tipo_medo", "tipo_vingativo", "tipo_vingativo_imaginario", "tipo_enfermo"]);
t("o clã solto de Addon (família `clas`) continua indo para o Herdado",
  (() => {
    A.aplicarAddons([A.normalizarPacote(ler("sugawara")), pHEO]);
    return O.clasDaOrigem("herdado").map((c) => c.id);
  })(),
  [...LIVRO, "sugawara:cla_sugawara"]);
A.aplicarAddons([pHEO, pMEO]);
const vo = O.getOrigem("gemeos").caracteristicas
  .find((c) => c.escolha?.id === "verdadeiras_origens").escolha.opcoes;
t("o Gêmeo não copia Tipo de Maldição como se fosse Herdado",
  vo.filter((o) => String(o.claId ?? "").startsWith("maldicao-era-de-ouro:")).length, 0);
t("e copia do clã Era de Ouro pela origem certa",
  vo.filter((o) => o.claId === FUJIWARA).map((o) => [o.origemId, o.caracteristicaId]),
  [[ORIGEM, "treinamentos_cla"], [ORIGEM, "foco_no_poder"]]);
A.aplicarAddons([pHEO]);

/* ============================================================ */
/* 3. A FICHA, NOS DOIS SISTEMAS                                 */
/* ============================================================ */
const soma = (d, canal, alvo = null) =>
  EFE.detalhesDoCanal(d.efeitos, canal, alvo).reduce((s, l) => s + (Number(l.valor) || 0), 0);

for (const sistema of ["player", "afty"]) {
  const ficha = ({ cla = null, nd = 10, escolhas = {}, talentos = [], escolhasTalento = {}, combate, origem = ORIGEM, pericias = {} } = {}) => {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.core = { ...c.core, nd, tipo: "combatente", patamar: "comum", origem: { id: origem, cla, escolhas } };
    c.especializacoes = [{ id: "lutador", nivel: nd }];
    c.attrMethod = "fixos";
    c.attributes = { forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 };
    c.addons = [pHEO];
    c.talentos = talentos;
    c.escolhasTalento = escolhasTalento;
    c.pericias = pericias;
    if (combate) c.combate = combate;
    return c;
  };
  const tag = (s) => `${sistema}: ${s}`;
  const semCla = deriveAfty(ficha());
  const bt = semCla.maestria;
  const meio = Math.floor(bt / 2);
  const ataque = (d, id) => d.testes.ataques.find((a) => a.id === id)?.bonus;

  // Fujiwara
  const fuji = deriveAfty(ficha({ cla: FUJIWARA }));
  t(tag("Fujiwara: o par do Bônus em Atributo"),
    O.caracteristicasEfetivas(ficha({ cla: FUJIWARA })).find((c) => c.id === "bonus_atributo")?.bonus?.entre,
    ["constituicao", "sabedoria"]);
  t(tag("Fujiwara: +2 vagas de treino"), soma(fuji, "vagasPericia") - soma(semCla, "vagasPericia"), 2);
  t(tag("Fujiwara: as promessas do Herdado somem com o clã"),
    O.caracteristicasEfetivas(ficha({ cla: FUJIWARA })).map((c) => c.id),
    ["bonus_atributo", "treinamentos_cla", "foco_no_poder"]);

  // Sugawara
  const suga = deriveAfty(ficha({ cla: SUGAWARA }));
  t(tag("Sugawara: o par do Bônus em Atributo"),
    O.caracteristicasEfetivas(ficha({ cla: SUGAWARA })).find((c) => c.id === "bonus_atributo")?.bonus?.entre,
    ["inteligencia", "sabedoria"]);
  t(tag("Sugawara: 1 PE por nível par"), soma(suga, "pe") - soma(semCla, "pe"), 5);
  t(tag("Sugawara: Feitiço no 1, 5 e 10"), soma(suga, "vagasFeitico") - soma(semCla, "vagasFeitico"), 3);

  // Akutame
  const aku9 = deriveAfty(ficha({ cla: AKUTAME, nd: 9, escolhas: { akutame_mestre: ["akutame_mestre_atletismo"] } }));
  t(tag("Akutame: treinado em Atletismo e Feitiçaria, e a escolha do 10 ainda fechada"),
    [aku9.periciaProf.atletismo, aku9.periciaProf.feiticaria], ["treinado", "treinado"]);
  const aku = deriveAfty(ficha({ cla: AKUTAME, escolhas: { akutame_mestre: ["akutame_mestre_feiticaria"] } }));
  t(tag("Akutame: mestre na escolhida no nível 10"),
    [aku.periciaProf.atletismo, aku.periciaProf.feiticaria], ["treinado", "mestre"]);
  t(tag("Akutame: metade do BT no Acerto, nos três ataques"),
    ["corpo", "distancia", "amaldicoado"].map((id) => ataque(aku, id) - ataque(semCla, id)), [meio, meio, meio]);
  t(tag("Akutame: e na Defesa"), aku.defesa - semCla.defesa, meio);

  // Desabrochar do Conhecimento Herdado: o verbo novo
  const PETALA = "emocao_da_petala_decadente";
  const desabrochar = deriveAfty(ficha({ nd: 4, talentos: [tal("tal_desabrochar_do_conhecimento_herdado")] }));
  t(tag("Desabrochar: a Pétala Decadente chega, no ND 4 e sem Cobrir-se"),
    [desabrochar.aptidoesEscolhidas.includes(PETALA), desabrochar.aptidoesConcedidas.includes(PETALA)], [true, true]);
  t(tag("Desabrochar: com o Talento como fonte"),
    desabrochar.aptidoesConcedidasTalento,
    [{ id: PETALA, fonte: "Desabrochar do Conhecimento Herdado", talentoId: tal("tal_desabrochar_do_conhecimento_herdado") }]);
  t(tag("Desabrochar: o Talento vale"), desabrochar.talentos.inacessiveis.includes(tal("tal_desabrochar_do_conhecimento_herdado")), false);
  t(tag("sem o Talento a Aptidão não vem"), deriveAfty(ficha({ nd: 4 })).aptidoesEscolhidas.includes(PETALA), false);
  t(tag("no Herdado do livro o Talento sai inacessível"),
    deriveAfty(ficha({ nd: 4, origem: "herdado", talentos: [tal("tal_desabrochar_do_conhecimento_herdado")] }))
      .talentos.inacessiveis.includes(tal("tal_desabrochar_do_conhecimento_herdado")), true);

  // Requisito de clã
  const fortes = tal("tal_fortes_conviccoes");
  t(tag("Fortes Convicções: só o Fujiwara"),
    [FUJIWARA, SUGAWARA].map((cla) => deriveAfty(ficha({ cla, talentos: [fortes] })).talentos.inacessiveis.includes(fortes)),
    [false, true]);

  // Fundamentos Imponentes
  const fundamentos = deriveAfty(ficha({ cla: SUGAWARA, talentos: [tal("tal_fundamentos_imponentes")] }));
  t(tag("Fundamentos Imponentes: metade do BT na CD"), fundamentos.cd - suga.cd, meio);
  t(tag("Fundamentos Imponentes: e no Acerto Amaldiçoado só"),
    ["corpo", "amaldicoado"].map((id) => ataque(fundamentos, id) - ataque(suga, id)), [0, meio]);

  // Compreensão Avançada: duas trilhas diferentes
  const compreensao = tal("tal_compreensao_avancada");
  const comp = deriveAfty(ficha({ cla: SUGAWARA, talentos: [compreensao],
    escolhasTalento: { [compreensao]: ["heo_compreensao_cl", "heo_compreensao_er", "heo_compreensao_au"] } }));
  t(tag("Compreensão Avançada: +1 nas escolhidas"),
    [comp.aptidao.concedido.cl, comp.aptidao.concedido.er], [1, 1]);
  t(tag("Compreensão Avançada: a terceira passa da conta"), comp.talentos.escolhas.porTal[compreensao].excedeu, true);

  // Postura do Matador de Yokai: o interruptor de combate
  const postura = tal("tal_postura_do_matador_de_yokai");
  const ESTADO = "herdado-era-de-ouro:alvo_defesa_maior";
  const desl = deriveAfty(ficha({ cla: AKUTAME, talentos: [postura], combate: { ativo: true } }));
  const lig = deriveAfty(ficha({ cla: AKUTAME, talentos: [postura], combate: { ativo: true, [ESTADO]: true } }));
  // A porta de dono é a da lista que a Ficha e a Simulação desenham.
  t(tag("Postura: o interruptor só aparece com o Talento"),
    [BUF.linhasDeEstado(lig).some((e) => e.id === ESTADO),
      BUF.linhasDeEstado(deriveAfty(ficha({ cla: AKUTAME, combate: { ativo: true } }))).some((e) => e.id === ESTADO)],
    [true, false]);
  t(tag("Postura: ligado, metade do BT no ataque armado e não no amaldiçoado"),
    ["corpo", "distancia", "amaldicoado"].map((id) => ataque(lig, id) - ataque(desl, id)), [meio, meio, 0]);

  // Manuscrito Ancestral: a recarga da Técnica Máxima
  const manuscrito = tal("tal_manuscrito_ancestral");
  const comManuscrito = (nd) => deriveAfty(ficha({ nd, talentos: [manuscrito], pericias: { historia: "treinado" } }));
  t(tag("Manuscrito: −1 na recarga só com acesso ao Nível 5"),
    [soma(comManuscrito(13), "recargaTecnicaMaxima"), soma(comManuscrito(17), "recargaTecnicaMaxima")], [0, -1]);
  t(tag("Manuscrito: vale com História treinada"), comManuscrito(17).talentos.inacessiveis.includes(manuscrito), false);
}

/* ============================================================ */
/* 4. O VALIDADOR DO VERBO                                       */
/* ============================================================ */
const quebrado = JSON.parse(JSON.stringify(HEO));
quebrado.id = "heo-quebrado";
quebrado.acrescenta.talentos[1].concedeAptidoes = ["nao_existe"];
A.aplicarAddons([A.normalizarPacote(quebrado)]);
t("Aptidão inexistente no concedeAptidoes é relatada",
  TAL.validarCatalogoTalentos().some((p) => p.includes("concedeAptidoes") && p.includes("nao_existe")), true);

A.limparAddons();
console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
