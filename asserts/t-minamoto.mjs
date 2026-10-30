/* CLÃ MINAMOTO (addon, 2026-10-13).

   Um clã do Herdado do livro, lido de `addons/minamoto.json`, com os três
   Talentos de Origem dele. Mesmo molde do Sugawara e do Akutame da Era de Ouro,
   com duas diferenças que este arquivo prende:
     • o Feitiço do Potencial Lendário NÃO para no nível 20 (autor: "continua
       escalando de 5 em 5 níveis infinitamente"), então é `1 + piso(nd / 5)`;
     • o clã não tem Treinamentos de Clã, e por isso não dá vaga de perícia. */
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
const MIN = ler("minamoto");
t("o pacote valida", A.validarPacote(MIN), []);
const pMIN = A.normalizarPacote(MIN);
t("aplicar não relata problema", A.aplicarAddons([pMIN]).length ?? 0, 0);

const MINAMOTO = "minamoto:cla_minamoto";
const tal = (id) => `minamoto:${id}`;
const LIVRO = ["cla_gojo", "cla_inumaki", "cla_kamo", "cla_zenin"];
t("o clã entra no Herdado do livro", O.clasDaOrigem("herdado").map((c) => c.id), [...LIVRO, MINAMOTO]);
t("com as três características",
  O.getCla(MINAMOTO)?.caracteristicas?.map((c) => c.id),
  ["bonus_atributo", "potencial_lendario", "talento_minamoto"]);
t("os 3 Talentos, no grupo Origem",
  ["tal_fundamentos_imponentes", "tal_compreensao_avancada", "tal_postura_do_matador_de_yokai"]
    .map((id) => TAL.getTalento(tal(id))?.grupo),
  Array(3).fill("origem"));
t("o requisito de clã ganha o prefixo do pacote",
  TAL.getTalento(tal("tal_fundamentos_imponentes"))?.requisitos?.[0], { tipo: "cla", id: MINAMOTO });

// Junto da Era de Ouro, que tem Talentos com os MESMOS ids crus: o prefixo separa.
const pHEO = A.normalizarPacote(ler("herdado-era-de-ouro"));
A.aplicarAddons([pMIN, pHEO]);
t("convive com a Era de Ouro sem trocar de Talento",
  [TAL.getTalento(tal("tal_fundamentos_imponentes"))?.requisitos?.[0]?.id,
    TAL.getTalento("herdado-era-de-ouro:tal_fundamentos_imponentes")?.requisitos?.[0]?.id],
  [MINAMOTO, "herdado-era-de-ouro:cla_sugawara"]);
A.aplicarAddons([pMIN]);

/* ============================================================ */
/* 2. A FICHA, NOS DOIS SISTEMAS                                 */
/* ============================================================ */
const soma = (d, canal, alvo = null) =>
  EFE.detalhesDoCanal(d.efeitos, canal, alvo).reduce((s, l) => s + (Number(l.valor) || 0), 0);

for (const sistema of ["player", "afty"]) {
  const ficha = ({ cla = null, nd = 10, talentos = [], escolhasTalento = {}, combate } = {}) => {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.core = { ...c.core, nd, tipo: "combatente", patamar: "comum", origem: { id: "herdado", cla, escolhas: {} } };
    c.especializacoes = [{ id: "lutador", nivel: nd }];
    c.attrMethod = "fixos";
    c.attributes = { forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 10 };
    c.addons = [pMIN];
    c.talentos = talentos;
    c.escolhasTalento = escolhasTalento;
    if (combate) c.combate = combate;
    return c;
  };
  const tag = (s) => `${sistema}: ${s}`;
  const semCla = deriveAfty(ficha());
  const meio = Math.floor(semCla.maestria / 2);
  const ataque = (d, id) => d.testes.ataques.find((a) => a.id === id)?.bonus;
  const min = deriveAfty(ficha({ cla: MINAMOTO }));

  // Bônus em Atributo: livre, e não um par
  const bonus = O.caracteristicasEfetivas(ficha({ cla: MINAMOTO })).find((c) => c.id === "bonus_atributo")?.bonus;
  t(tag("Bônus em Atributo: 3 pontos livres, 2 no máximo"), [bonus?.distribuir, bonus?.maxPorAtributo, bonus?.entre], [3, 2, undefined]);
  t(tag("sem Treinamentos de Clã, sem vaga de perícia"), soma(min, "vagasPericia") - soma(semCla, "vagasPericia"), 0);

  // Potencial Lendário
  t(tag("Potencial Lendário: 1 PE por nível par"), soma(min, "pe") - soma(semCla, "pe"), 5);
  const feiticos = (nd) => soma(deriveAfty(ficha({ cla: MINAMOTO, nd })), "vagasFeitico")
    - soma(deriveAfty(ficha({ nd })), "vagasFeitico");
  t(tag("Potencial Lendário: Feitiço no 1 e a cada 5 níveis"),
    [1, 4, 5, 10, 19, 20].map(feiticos), [1, 1, 2, 3, 4, 5]);
  t(tag("Potencial Lendário: e segue depois do 20"), [24, 25, 30].map(feiticos), [5, 6, 7]);

  // Talento Minamoto
  t(tag("Talento Minamoto: metade do BT no Acerto, nos três ataques"),
    ["corpo", "distancia", "amaldicoado"].map((id) => ataque(min, id) - ataque(semCla, id)), [meio, meio, meio]);
  t(tag("Talento Minamoto: e na Defesa"), min.defesa - semCla.defesa, meio);
  t(tag("Talento Minamoto: com o nome no hover"),
    min.partes.defesa.some((p) => p.label === "Talento Minamoto" && p.valor === meio), true);

  // Requisito de clã
  const fundamentosId = tal("tal_fundamentos_imponentes");
  t(tag("Fundamentos Imponentes: só o Minamoto"),
    [MINAMOTO, "cla_gojo"].map((cla) => deriveAfty(ficha({ cla, talentos: [fundamentosId] })).talentos.inacessiveis.includes(fundamentosId)),
    [false, true]);
  t(tag("Fundamentos Imponentes: e só a partir do nível 6"),
    deriveAfty(ficha({ cla: MINAMOTO, nd: 5, talentos: [fundamentosId] })).talentos.inacessiveis.includes(fundamentosId), true);

  // Fundamentos Imponentes
  const fundamentos = deriveAfty(ficha({ cla: MINAMOTO, talentos: [fundamentosId] }));
  t(tag("Fundamentos Imponentes: metade do BT na CD"), fundamentos.cd - min.cd, meio);
  t(tag("Fundamentos Imponentes: e no Acerto Amaldiçoado só"),
    ["corpo", "amaldicoado"].map((id) => ataque(fundamentos, id) - ataque(min, id)), [0, meio]);

  // Compreensão Avançada: duas trilhas diferentes
  const compreensao = tal("tal_compreensao_avancada");
  const comp = deriveAfty(ficha({ cla: MINAMOTO, talentos: [compreensao],
    escolhasTalento: { [compreensao]: ["min_compreensao_cl", "min_compreensao_er", "min_compreensao_au"] } }));
  t(tag("Compreensão Avançada: +1 nas escolhidas"),
    [comp.aptidao.concedido.cl, comp.aptidao.concedido.er], [1, 1]);
  t(tag("Compreensão Avançada: a terceira passa da conta"), comp.talentos.escolhas.porTal[compreensao].excedeu, true);

  // Postura do Matador de Yokai: o interruptor de combate
  const postura = tal("tal_postura_do_matador_de_yokai");
  const ESTADO = "minamoto:alvo_defesa_maior";
  const desl = deriveAfty(ficha({ cla: MINAMOTO, talentos: [postura], combate: { ativo: true } }));
  const lig = deriveAfty(ficha({ cla: MINAMOTO, talentos: [postura], combate: { ativo: true, [ESTADO]: true } }));
  t(tag("Postura: o interruptor só aparece com o Talento"),
    [BUF.linhasDeEstado(lig).some((e) => e.id === ESTADO),
      BUF.linhasDeEstado(deriveAfty(ficha({ cla: MINAMOTO, combate: { ativo: true } }))).some((e) => e.id === ESTADO)],
    [true, false]);
  t(tag("Postura: ligado, metade do BT no ataque armado e não no amaldiçoado"),
    ["corpo", "distancia", "amaldicoado"].map((id) => ataque(lig, id) - ataque(desl, id)), [meio, meio, 0]);
}

A.limparAddons();
console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
