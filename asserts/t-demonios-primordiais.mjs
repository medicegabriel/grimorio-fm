/**
 * ============================================================
 * Addon Demônios Primordiais (2026-10-31)
 * ============================================================
 * A origem Demônio Primordial lida de `addons/demonios-primordiais.json`: o
 * Nível de Medo (contador de origem que começa em 4, o `inicio` novo), os
 * benefícios (+2 em todos os atributos, 1 Habilidade e 1 Aptidão adicionais), a
 * Trilha Demoníaca com os cinco estágios no número de mesa e as três Aptidões
 * Demoníacas (a linha de cura rolável e a faixa do Fluxo Sanguíneo Constante).
 * Roda nos dois sistemas.
 */
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
const EFE = await import(R + "afty-efeitos.js");
const BUF = await import(R + "ficha/ficha-buffs.js");
const AP = await import(R + "afty-aptidoes.js");
const CO = await import(R + "afty-contadores-origem.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* 1. O PACOTE                                                   */
/* ============================================================ */
const DEMONIO = JSON.parse(readFileSync(new URL("../addons/demonios-primordiais.json", import.meta.url), "utf8"));
t("o pacote valida", A.validarPacote(DEMONIO), []);
t("autor, sistema-alvo e versão", [DEMONIO.autor, DEMONIO.paraRaw, DEMONIO.versao], ["Templas", "afty", "1.0.0"]);
t("sem travessão no pacote", new RegExp(String.fromCharCode(0x2014)).test(JSON.stringify(DEMONIO)), false);
const P = A.normalizarPacote(DEMONIO);
t("aplicar não relata problema", A.aplicarAddons([P]).problemas, []);

const PK = "demonios-primordiais";
const id = (x) => `${PK}:${x}`;
const ORIGEM = id("demonio_primordial");
const MEDO = id("nivel_de_medo");
const origem = O.getOrigem(ORIGEM);
t("a origem, com as 8 características", [origem?.nome, origem?.caracteristicas.map((c) => c.id)], [
  "Demônio Primordial",
  ["beneficios_de_origem", "niveis_de_medo", "trilha_demonio_primordial", "medo_i_existencia_ancestral",
    "medo_ii_autoridade_conceitual", "medo_iii_medo_instintivo", "medo_iv_calamidade_viva", "medo_v_terror_primordial"],
]);
t("a recomendação de um por campanha fica em restrição", origem.restricoes.length, 1);
t("as três Aptidões Demoníacas ficam em Especiais, presas à origem", ["regeneracao_demoniaca", "cura_demoniaca_aprimorada", "fluxo_sanguineo_constante"]
  .map((x) => [AP.getAptidao(id(x))?.categoria, AP.getAptidao(id(x))?.requisitos?.[0]?.id]),
  [["especiais", ORIGEM], ["especiais", id("regeneracao_demoniaca")], ["especiais", id("regeneracao_demoniaca")]]);

/* A validação nova: contador com `inicio` fora da faixa e Aptidão sem `trilha`. */
const pacoteX = (extra) => ({ id: "pacote-x", nome: "X", versao: "1.0.0", paraRaw: "afty", ...extra });
t("inicio fora da faixa é recusado", A.validarPacote(pacoteX({
  contadoresOrigem: [{ id: "c", label: "C", tipo: "contador", min: 0, max: 5, inicio: 9 }],
})).some((p) => p.includes("inicio")), true);
t("inicio dentro da faixa passa", A.validarPacote(pacoteX({
  contadoresOrigem: [{ id: "c", label: "C", tipo: "contador", min: 0, max: 5, inicio: 4 }],
})), []);

/* ============================================================ */
/* 2. A FICHA, NOS DOIS SISTEMAS                                 */
/* ============================================================ */
const soma = (d, canal, alvo = null) =>
  EFE.detalhesDoCanal(d.efeitos, canal, alvo).reduce((s, l) => s + (Number(l.valor) || 0), 0);

for (const sistema of ["player", "afty"]) {
  const tag = (s) => `${sistema}: ${s}`;
  const ficha = ({ nd = 10, medo = undefined, aptidoes = [], combate, comOrigem = true } = {}) => {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.core = { ...c.core, nd, tipo: "combatente", patamar: "comum", origem: comOrigem ? { id: ORIGEM, escolhas: {} } : { id: null, escolhas: {} } };
    c.especializacoes = [{ id: "lutador", nivel: nd }];
    c.attrMethod = "fixos";
    c.attributes = { forca: 10, destreza: 10, constituicao: 14, inteligencia: 8, sabedoria: 10, presenca: 12 };
    c.addons = [P];
    c.aptidoes = { au: 0, cl: 3, bar: 0, dom: 0, er: 0 };
    c.aptidoesAmaldicoadas = aptidoes.map(id);
    if (medo !== undefined) c.origemContadores = { [MEDO]: medo };
    if (combate) c.combate = combate;
    return c;
  };
  const resultado = (d, carac, label) => (d.mesa?.[`origem:${carac}`]?.resultados ?? []).find((r) => r.label === label);
  const base = deriveAfty(ficha());

  // Os benefícios da origem
  t(tag("+2 em todos os atributos"), O.resolveOrigemAttrBonus(ficha()),
    { forca: 2, destreza: 2, constituicao: 2, inteligencia: 2, sabedoria: 2, presenca: 2 });
  t(tag("1 Habilidade de Especialização e 1 Aptidão Amaldiçoada a mais"),
    [soma(base, "vagasHabilidade"), soma(base, "vagasAptidao")], [1, 1]);
  t(tag("sem a origem não há benefício nem contador"),
    [soma(deriveAfty(ficha({ comOrigem: false })), "vagasAptidao"), CO.contadoresOrigemDeAddon(ficha({ comOrigem: false })).length], [0, 0]);

  // O Nível de Medo começa em 4 e o contador respeita a faixa
  const contador = CO.contadoresOrigemDeAddon(ficha()).find((c) => c.id === MEDO);
  t(tag("o contador: faixa de 0 a 5 e início em 4"), [contador?.min, contador?.max, contador?.inicio], [0, 5, 4]);
  t(tag("ficha que nunca mexeu no contador vale 4"), CO.valorContadorOrigem(ficha(), MEDO, contador), 4);
  t(tag("o 0 gravado é 0, e não volta para 4"), CO.valorContadorOrigem(ficha({ medo: 0 }), MEDO, contador), 0);
  t(tag("sem o contador à mão o valor é o gravado ou 0"), CO.valorContadorOrigem(ficha(), MEDO), 0);
  t(tag("o teto é 5"), CO.clampContadorOrigem(contador, 9), 5);

  // Os estágios da Trilha, pelo Nível de Medo
  t(tag("Nível de Medo 4: estágios I a IV abertos, o V fechado"),
    ["medo_i_existencia_ancestral", "medo_ii_autoridade_conceitual", "medo_iii_medo_instintivo", "medo_iv_calamidade_viva", "medo_v_terror_primordial"]
      .map((c) => resultado(base, c, "Estágio").texto),
    ["Desbloqueado", "Desbloqueado", "Desbloqueado", "Desbloqueado", "Bloqueado"]);
  t(tag("a condição Esquecido só no Nível 0"),
    [resultado(deriveAfty(ficha({ medo: 0 })), "niveis_de_medo", "Condição").texto, resultado(base, "niveis_de_medo", "Condição").texto],
    ["Esquecido", "Sem a Condição Esquecido"]);
  const d5 = deriveAfty(ficha({ medo: 5 }));
  const d0 = deriveAfty(ficha({ medo: 0 }));
  t(tag("Nível 0: nenhum estágio e nenhum número"),
    [resultado(d0, "medo_i_existencia_ancestral", "Estágio").texto, resultado(d0, "medo_ii_autoridade_conceitual", "Redução de CD").valor,
      resultado(d0, "medo_iv_calamidade_viva", "Dano Adicional na Falha").valor], ["Bloqueado", 0, 0]);
  t(tag("I: ND máximo afetado é metade do nível"), resultado(base, "medo_i_existencia_ancestral", "ND Máximo Afetado").valor, 5);
  t(tag("II: reduz a CD pelo Nível de Medo e os dados pelo BT"),
    [resultado(base, "medo_ii_autoridade_conceitual", "Redução de CD").valor, resultado(base, "medo_ii_autoridade_conceitual", "Dados de Dano Reduzidos").valor],
    [4, base.maestria]);
  t(tag("IV: dano adicional é o Nível de Medo mais o mod. de Presença"),
    [resultado(base, "medo_iv_calamidade_viva", "Dano Adicional na Falha").valor, resultado(d5, "medo_iv_calamidade_viva", "Dano Adicional na Falha").valor],
    [4 + 2, 5 + 2]);
  t(tag("V: só no Nível 5, e reduz a RD pelo BT"),
    [resultado(d5, "medo_v_terror_primordial", "Estágio").texto, resultado(d5, "medo_v_terror_primordial", "Redução de RD").valor],
    ["Desbloqueado", d5.maestria]);

  // A Regeneração Demoníaca: a linha de cura rolável
  const regen = (d) => d.cura.linhas.find((l) => l.id === id("regeneracao_demoniaca"));
  t(tag("sem a Aptidão não há linha de cura"), regen(base), undefined);
  const dr = deriveAfty(ficha({ aptidoes: ["regeneracao_demoniaca"] }));
  // ND 10: 2d6 + 1d6 por PE. Constituição 14 mais o +2 da origem: mod +3. CL 3: teto de 2 + metade = 3 PE.
  t(tag("Regeneração Demoníaca: 3d6 por PE, no teto de 3 PE, com o mod. uma vez"),
    [regen(dr).texto, regen(dr).textoNoMaximo, regen(dr).unidade.pontosUsaveis, regen(dr).alcance], ["3d6", "9d6+3", 3, "Você"]);
  t(tag("nos níveis 15 e 20 sobe 1d6 por PE"),
    [deriveAfty(ficha({ nd: 15, aptidoes: ["regeneracao_demoniaca"] })).cura.linhas.find((l) => l.id === id("regeneracao_demoniaca")).texto,
      deriveAfty(ficha({ nd: 20, aptidoes: ["regeneracao_demoniaca"] })).cura.linhas.find((l) => l.id === id("regeneracao_demoniaca")).texto],
    ["4d6", "5d6"]);
  t(tag("o hover da cura cita a Aptidão"),
    EFE.detalhesDoCanal(dr.efeitos, "curaDados", id("regeneracao_demoniaca")).map((x) => x.nome), ["Regeneração Demoníaca"]);

  // Cura Demoníaca Aprimorada: d8, dobro do mod., teto de 2 + CL
  const dap = deriveAfty(ficha({ aptidoes: ["regeneracao_demoniaca", "cura_demoniaca_aprimorada"] }));
  t(tag("Aprimorada: d8, o dobro do mod. e o teto de 2 + CL (5 PE)"),
    [regen(dap).dado, regen(dap).textoNoMaximo, regen(dap).unidade.pontosUsaveis], ["d8", "15d8+6", 5]);

  // Fluxo Sanguíneo Constante: a faixa de PE e a regeneração do turno
  const estadoFaixa = (d) => BUF.linhasDeEstado(d).find((e) => e.id === id("pe_regeneracao"));
  t(tag("sem o Fluxo a faixa não existe"), estadoFaixa(dr), undefined);
  const dfl = deriveAfty(ficha({ aptidoes: ["regeneracao_demoniaca", "fluxo_sanguineo_constante"], combate: { ativo: true, [id("pe_regeneracao")]: 3 } }));
  t(tag("com o Fluxo a faixa vai de 0 a 2 + metade de CL"), [estadoFaixa(dfl)?.tipo, estadoFaixa(dfl)?.max], ["faixa", 3]);
  t(tag("3 PE gastos: 9d6 no início do turno, mais o mod."), [dfl.regeneracao.dados, dfl.regeneracao.dado, dfl.regeneracao.fixo], [9, "d6", 3]);
  const dflOff = deriveAfty(ficha({ aptidoes: ["regeneracao_demoniaca", "fluxo_sanguineo_constante"], combate: { ativo: true } }));
  t(tag("sem PE gasto o Fluxo não regenera"), dflOff.regeneracao.dados, 0);
  const dtudo = deriveAfty(ficha({ aptidoes: ["regeneracao_demoniaca", "cura_demoniaca_aprimorada", "fluxo_sanguineo_constante"], combate: { ativo: true, [id("pe_regeneracao")]: 3 } }));
  t(tag("com a Aprimorada o Fluxo rola d8 e soma o dobro do mod."), [dtudo.regeneracao.dado, dtudo.regeneracao.fixo], ["d8", 6]);
}

if (bad.length) {
  console.log(bad.join("\n"));
  console.log(`\n${bad.length} FALHARAM, ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
