/* Pacote Nascido dos "Sonhos": origem, os sete Talentos de Origem, Cajado e os
   quatro Funcionamentos Básicos da técnica de Merlim. A Reserva Ilimitada entrou
   em 2026-09-11, com o pacote subindo para 0.2.0. */
import { readFileSync } from "node:fs";
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty, maestria } = await import(R + "afty-derive.js");
const { createBlankAfty, funcionamentosDaFicha } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const O = await import(R + "afty-origens.js");
const T = await import(R + "afty-talentos.js");
const E = await import(R + "afty-equipamentos.js");
const { valorCanal } = await import(R + "afty-efeitos.js");

/* O pacote vem do JSON, que é o mesmo texto que se cola no campo Instalar. */
const SONHOS = JSON.parse(
  readFileSync(new URL("../addons/nascido-dos-sonhos.json", import.meta.url), "utf8"),
);

let ok = 0;
const falhas = [];
const t = (nome, real, esperado) => {
  const a = JSON.stringify(real);
  const b = JSON.stringify(esperado);
  if (a === b) ok += 1;
  else falhas.push(`${nome}\n     esperado ${b}\n     veio     ${a}`);
};

const pacote = A.normalizarPacote(SONHOS);
t("pacote válido", A.validarPacote(SONHOS), []);
A.aplicarAddons([pacote]);

const NS = "nascido-dos-sonhos:";
const ORIGEM = NS + "orig_nascido_dos_sonhos";
const CULTIVADOR = NS + "tal_cultivador_de_sonhos";
const SABEDORIA = NS + "tal_sabedoria_inata";
const TRANSFORMACAO = NS + "tal_transformacao_feerica";
const PRODIGIO = NS + "tal_prodigio_inato";
const CORPO = NS + "tal_corpo_feerico";
const IMAGINACAO = NS + "tal_imaginacao_lucida";
const RESERVA = NS + "tal_reserva_ilimitada";
const CAJADO = NS + "cajado_grande_mago";

/* ---------- Catálogo ---------- */
t("origem instalada", O.getOrigem(ORIGEM)?.nome, "Nascido dos “Sonhos”");
t("origem aparece no seletor", O.AFTY_ORIGENS.some((o) => o.value === ORIGEM), true);
t("as quatro características", O.getOrigem(ORIGEM).caracteristicas.map((c) => c.nome),
  ["Bônus em Atributo", "Natureza Onírica", "Benção Amaldiçoada", "Sonhos Humanos"]);
for (const [id, nome] of [
  [CULTIVADOR, "Cultivador de Sonhos"],
  [SABEDORIA, "Sabedoria Inata"],
  [TRANSFORMACAO, "Transformação Féerica"],
  [PRODIGIO, "Prodígio Inato"],
  [CORPO, "Corpo Féerico"],
  [IMAGINACAO, "Imaginação Lúcida"],
  [RESERVA, "Reserva Ilimitada"],
]) {
  t(`talento ${nome} instalado`, T.getTalento(id)?.nome, nome);
  t(`talento ${nome} é de Origem`, T.getTalento(id)?.grupo, "origem");
}
t("Cajado instalado", E.getEquipamento("arma", CAJADO)?.nome, "Cajado do Grande Mago");
t("Cajado é versátil", E.getEquipamento("arma", CAJADO)?.props?.versatil, true);

/* ---------- Ficha base ---------- */
const ficha = (nd = 10) => {
  const c = createBlankAfty();
  c.core.nd = nd;
  c.core.origem = { id: ORIGEM, escolhas: {}, pools: {} };
  c.addons = [pacote];
  return c;
};
/* ⚠ A BASE DE COMPARAÇÃO É A MESMA FICHA COM `origem: {}`, e não uma ficha em
   branco: o `createBlankAfty` já nasce Inato, que sozinho concede +1 vaga de
   Feitiço e +2 de Talento. Medido contra ele, todo delta desta origem sairia
   uma vaga menor, calado. */
const semOrigem = (nd = 10) => {
  const c = ficha(nd);
  c.core.origem = {};
  return c;
};

/* ---------- Bônus em Atributo ---------- */
const base = ficha();
const dBase = deriveAfty(base);
t("Presença recebe os 2 pontos fixos", dBase.attrBonus?.presenca, 2);
t("o ponto solto NÃO cai sozinho em nenhum atributo",
  Object.entries(dBase.attrBonus ?? {}).filter(([k, v]) => k !== "presenca" && v), []);

const comPonto = ficha();
comPonto.core.origem.bonusAtributos = { destreza: 1 };
t("o ponto solto entra onde a ficha alocar",
  deriveAfty(comPonto).attrBonus?.destreza, 1);

/* ---------- Benção Amaldiçoada ---------- */
/* "1 PE adicional a cada nível par" e "1 feitiço adicional, +1 a cada 5 níveis
   até o 20". Medidos contra a MESMA ficha sem a origem, e não contra um número
   escrito à mão: o que a origem promete é o DELTA. */
for (const nd of [1, 2, 3, 10, 19, 20, 25]) {
  const com = deriveAfty(ficha(nd));
  const sem = deriveAfty(semOrigem(nd));
  t(`PE extra no ND ${nd}`, com.pe - sem.pe, Math.floor(nd / 2));
  t(`vagas de Feitiço no ND ${nd}`,
    valorCanal(com.efeitos, "vagasFeitico") - valorCanal(sem.efeitos, "vagasFeitico"),
    1 + (nd >= 5) + (nd >= 10) + (nd >= 15) + (nd >= 20));
}

/* ---------- Sabedoria Inata ---------- */
/* Mesmo texto da Noção e Preparação, e portanto a mesma decisão do autor
   (2026-07-29): o bônus vale para TODO TR, e não só contra aptidão. */
for (const [nd, esperado] of [[4, 2], [9, 3], [13, 4], [17, 5], [20, 5]]) {
  const c = ficha(nd);
  c.talentos = [SABEDORIA];
  const com = deriveAfty(c);
  const sem = deriveAfty(ficha(nd));
  t(`Sabedoria Inata no ND ${nd}`,
    com.testes.resistencias[0].bonus - sem.testes.resistencias[0].bonus, esperado);
}

/* ---------- Corpo Féerico ---------- */
const feerico = ficha();
feerico.talentos = [CORPO];
t("Corpo Féerico soma 3m", deriveAfty(feerico).movimento - dBase.movimento, 3);

/* ---------- Imaginação Lúcida ---------- */
for (const nd of [1, 5, 10, 20]) {
  const c = ficha(nd);
  c.talentos = [IMAGINACAO];
  t(`Imaginação Lúcida no ND ${nd}`,
    deriveAfty(c).cd - deriveAfty(ficha(nd)).cd, Math.floor(maestria(nd) / 2));
}

/* ---------- Reserva Ilimitada ---------- */
/* Autor, 2026-09-11: *"recebendo +3 PE máximos, recebendo +1 PE adicional a
   cada nível ímpar"*. Os ímpares contam de 1 até o nível atual, retroativos, que
   é a mesma leitura que a Benção Amaldiçoada deste pacote já faz para "a cada
   nível par" (`piso(nd / 2)`). O DELTA é medido contra a mesma ficha, com a
   origem e sem o Talento, e não contra um número escrito à mão. */
t("a descrição é a do autor, verbatim", T.getTalento(RESERVA)?.descricao,
  "Assim como um sonho nunca parece alcançar seu fim, suas reservas parecem inesgotáveis aos olhos daqueles que o observam, fazendo até mesmo maldições de alto grau confundirem sua presença com a de um ser muito acima da humanidade, recebendo +3 PE máximos, recebendo +1 PE adicional a cada nível ímpar");
for (const [nd, esperado] of [[1, 4], [2, 4], [3, 5], [4, 5], [5, 6], [10, 8], [19, 13], [20, 13], [25, 16], [30, 18]]) {
  const c = ficha(nd);
  c.talentos = [RESERVA];
  t(`Reserva Ilimitada no ND ${nd}`, deriveAfty(c).pe - deriveAfty(ficha(nd)).pe, esperado);
}

/* ⚠ A PROVA DE QUE AS DUAS METADES SE ENCAIXAM. A Benção dá +1 nos pares e a
   Reserva +1 nos ímpares, então juntas elas dão +1 em TODO nível, mais os 3
   fixos. Se uma das duas contar o nível errado (a Reserva pular o nível 1, ou
   a Benção contar o 1), a soma sai com um buraco ou uma sobra e isto fica
   vermelho. */
for (const nd of [1, 2, 7, 12, 30]) {
  const c = ficha(nd);
  c.talentos = [RESERVA];
  t(`Benção mais Reserva dão 3 + nível no ND ${nd}`,
    deriveAfty(c).pe - deriveAfty(semOrigem(nd)).pe, 3 + nd);
}

/* A parcela sai com o nome do Talento no hover do PE, e não somada por baixo de
   outra linha. */
const reserva10 = ficha(10);
reserva10.talentos = [RESERVA];
const dReserva10 = deriveAfty(reserva10);
t("a Reserva Ilimitada aparece no hover do PE",
  dReserva10.partes.pe.filter((p) => /Reserva Ilimitada/.test(p.label)).map((p) => p.valor), [8]);
t("e as parcelas do hover fecham com o PE",
  dReserva10.partes.pe.reduce((soma, p) => soma + (p.valor ?? 0), 0), dReserva10.pe);

/* ⚠ O PACOTE É DE FICHA DE PLAYER, e o assert acima roda em ficha de criatura
   (o `createBlankAfty` nasce `afty`). O canal `pe` é o mesmo nos dois sistemas,
   mas isso é afirmação, e aqui ela vira medida. */
const jogador = (nd, talentos) => {
  const c = ficha(nd);
  c.rulesVersion = "player";
  c.especializacoes = [{ id: "conjurador", nivel: nd }];
  c.talentos = talentos;
  return deriveAfty(c);
};
for (const nd of [1, 6, 15]) {
  t(`no jogador de nível ${nd} a Reserva também soma`,
    jogador(nd, [RESERVA]).pe - jogador(nd, []).pe, 3 + Math.ceil(nd / 2));
}

/* ---------- Prodígio Inato ---------- */
/* As opções reusam os ids `tal_estudo_<trilha>` do raw de propósito: o
   `coletarEfeitosDeEscolha` só lê o ESCOLHA_EFEITOS, então um id novo nasceria
   mudo. Este assert é o que prende essa dependência. */
const prodigio = ficha(9);
prodigio.talentos = [PRODIGIO];
prodigio.escolhasTalento = { [PRODIGIO]: ["tal_estudo_au", "tal_estudo_dom"] };
const dProdigio = deriveAfty(prodigio);
t("Prodígio Inato sobe Aura", valorCanal(dProdigio.efeitos, "nivelAptidao", "au"), 1);
t("Prodígio Inato sobe Domínio", valorCanal(dProdigio.efeitos, "nivelAptidao", "dom"), 1);
t("Prodígio Inato não sobe o resto",
  ["cl", "bar", "er"].map((k) => valorCanal(dProdigio.efeitos, "nivelAptidao", k)), [0, 0, 0]);

/* ---------- Requisitos ---------- */
const ctx = (extra = {}) => ({ nd: 20, origemId: ORIGEM, origensQualificadas: [ORIGEM], ...extra });
t("Talento de Origem exige a origem",
  T.avaliarAcessoTalento(T.getTalento(CORPO), { nd: 20, origemId: "inato", origensQualificadas: ["inato"] }).ok, false);
t("Talento de Origem passa com a origem",
  T.avaliarAcessoTalento(T.getTalento(CORPO), ctx()).ok, true);
t("Sabedoria Inata exige Mestre em Feitiçaria",
  T.avaliarAcessoTalento(T.getTalento(SABEDORIA), ctx({ periciaProf: { feiticaria: "treinado" } })).ok, false);
t("Sabedoria Inata passa com Mestre em Feitiçaria",
  T.avaliarAcessoTalento(T.getTalento(SABEDORIA), ctx({ periciaProf: { feiticaria: "mestre" } })).ok, true);
t("Transformação Féerica exige Aura Controlada",
  T.avaliarAcessoTalento(T.getTalento(TRANSFORMACAO), ctx({ aptidoes: [] })).ok, false);
t("Transformação Féerica passa com Aura Controlada",
  T.avaliarAcessoTalento(T.getTalento(TRANSFORMACAO), ctx({ aptidoes: ["aura_controlada"] })).ok, true);
t("Reserva Ilimitada exige a origem",
  T.avaliarAcessoTalento(T.getTalento(RESERVA), { nd: 20, origemId: "inato", origensQualificadas: ["inato"] }).ok, false);
t("Reserva Ilimitada não tem ND mínimo",
  T.avaliarAcessoTalento(T.getTalento(RESERVA), ctx({ nd: 1 })).ok, true);
t("Cultivador de Sonhos exige ND 12",
  T.avaliarAcessoTalento(T.getTalento(CULTIVADOR), ctx({ nd: 11 })).ok, false);
t("Prodígio Inato traz a nota de mesa",
  T.avaliarAcessoTalento(T.getTalento(PRODIGIO), ctx()).extras.some((e) => !e.verificavel), true);

/* ---------- Funcionamentos Básicos ---------- */
const fbs = funcionamentosDaFicha(base).filter((f) => f.deAddon);
t("os quatro Funcionamentos chegam na ficha", fbs.map((f) => f.nome), [
  "Merlim, o Criador de Reis",
  "Mecânica Única: Clarividência",
  "Mecânica Única: Avatar de Avalon",
  "Mecânica Única: O Mago das Flores",
]);
t("nenhum deles carrega efeito de Motor", fbs.every((f) => f.efeitos.length === 0), true);
t("a Clarividência traz a tabela da Íris",
  fbs[1].descricao.includes("| +8 | 50 PE | 20 |"), true);

/* ---------- Desinstalar não deixa resto ---------- */
A.aplicarAddons([]);
t("origem some ao desinstalar", O.getOrigem(ORIGEM), null);
t("talento some ao desinstalar", T.getTalento(CORPO), null);
t("a Reserva Ilimitada some junto", T.getTalento(RESERVA), null);
t("arma some ao desinstalar", E.getEquipamento("arma", CAJADO), null);

if (falhas.length) {
  console.error(`FALHOU ${falhas.length} de ${ok + falhas.length}:\n  - ${falhas.join("\n  - ")}`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
