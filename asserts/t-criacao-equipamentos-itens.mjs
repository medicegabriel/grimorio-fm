/**
 * CRIAÇÃO DE EQUIPAMENTOS (Addon), fase 3: ITENS DE CUSTO, e o TALISMÃ DO ÁPICE.
 *
 * A seção "Criação de Itens de Custo" do guia, copiado sem mudança em
 * `docs/afty-criacao-equipamentos-fonte.md`. Módulos: `afty-criacao-equipamentos-
 * itens.js` e `afty-talisma-apice.js`.
 *
 * As decisões do autor, todas de 2026-09-14:
 *   Passivo ou Ativo por item. O Ativo aparece pronto e a mesa aplica, e só ele
 *   escolhe a forma (Arremessável, Área, Totem ou Selo). Acerto e Dano miram um
 *   tipo de ataque, e a CD vale na CD única. Ficam fora: Cura, Condição, Curar
 *   Condição, Tipo de Percepção, Brinco Comunicador, Reduzir Exaustão, e os
 *   bônus de Alcance e de Área. Entram Maximizar Atributo e Mudar Tipo de Dano.
 *   A tabela é o bônus que o item dá, e o tópico é a área e o alcance do item.
 *   O Talismã do Ápice é programado: "Vira 30, se possuir a Habilidade Lendaria
 *   que aumenta em +2. Fica como 32", conta 10 rodadas e desliga sozinho, e a
 *   quantidade é à mão.
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. As quatro tabelas e os tópicos, célula a célula, contra a fonte.
 * 2. O que cada Custo e cada modo oferecem, e o saneamento.
 * 3. As linhas do Motor do item Passivo, e o `deriveAfty` nos dois sistemas.
 * 4. O escopo de tipo de ataque, no Ataque Básico e nas armas.
 * 5. O Talismã do Ápice: estado, 30, 32, hover, fora de combate e as rodadas.
 * 6. O pacote.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
import { readFileSync } from "node:fs";

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty, AFTY_ATTRS } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const EF = await import(R + "afty-efeitos.js");
const IT = await import(R + "afty-criacao-equipamentos-itens.js");
const AP = await import(R + "afty-talisma-apice.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { AFTY_ATAQUES } = await import(R + "afty-pericias-catalogo.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const pacote = A.normalizarPacote(
  JSON.parse(readFileSync(new URL("../addons/criacao-de-equipamentos.json", import.meta.url), "utf8")),
);
const fonte = readFileSync(new URL("../docs/afty-criacao-equipamentos-fonte.md", import.meta.url), "utf8")
  .replace(/\*/g, "").replace(/\\/g, "");

/* ============================================================ */
/* 1. AS TABELAS CONTRA A FONTE                                  */
/* ============================================================ */
/* Lê as quatro tabelas do próprio documento, par a par (rótulo, valor), e
   compara com o módulo. Uma célula mexida num dos dois lados fica vermelha. */
const ROTULO_FONTE = {
  "Acerto(Especificar)": "acerto", "CD(Especificar)": "cd", "Perícia(Especificar)": "pericia", "Dano": "dano",
  "Alcance": "alcance", "PE(Energia ou Estamina)": "pe", "PV Máximo": "pvMaximo", "PV Máxima": "pvMaximo",
  "Tipo de Percepção": "tipoPercepcao", "Curar Condição": "curarCondicao", "Deslocamento": "deslocamento",
  "Atributo": "atributo", "Treinamento(Perícia)": "treinamento", "Mestre(Perícia)": "mestre", "Área": "area",
  "TR(Especificar)": "tr", "Ofício(Especificar)": "oficio", "Brinco Comunicador": "brinco", "Reduzir Exaustão": "reduzirExaustao",
};
const lerCelula = (v) => {
  const s = v.trim();
  if (s === "-") return null;
  const m = s.match(/^\+?(\d+(?:,\d+)?)m?$/);
  return m ? Number(m[1].replace(",", ".")) : s;
};
const doDocumento = {};
for (const custo of [1, 2, 3, 4]) {
  const ini = fonte.indexOf(`# Itens de Custo ${custo}`);
  const fim = fonte.indexOf("# ", ini + 5);
  const linhas = fonte.slice(ini, fim === -1 ? undefined : fim).split("\n").filter((l) => l.startsWith("|"));
  for (const l of linhas.slice(2)) {
    const cel = l.split("|").slice(1, -1).map((c) => c.trim());
    for (let i = 0; i + 1 < cel.length; i += 2) {
      const id = ROTULO_FONTE[cel[i]];
      if (!id) continue;
      (doDocumento[id] ??= [])[custo - 1] = lerCelula(cel[i + 1]);
    }
  }
}
t("as 18 linhas foram achadas no documento", Object.keys(doDocumento).length, 18);
for (const linha of IT.TABELA_ITENS_CUSTO) {
  t(`a linha ${linha.id} é a do guia`, linha.valores, doDocumento[linha.id]);
}
for (const [custo, topicos] of Object.entries(IT.TOPICOS_FORMA)) {
  for (const [forma, texto] of Object.entries(topicos)) {
    t(`o tópico ${forma} do Custo ${custo} é o da fonte`, fonte.includes(texto), true);
  }
}
for (const [id, texto] of Object.entries(IT.TEXTO_ITENS_CUSTO)) t(`o texto ${id} é o da fonte`, fonte.includes(texto), true);
t("o texto do Maximizar é o da fonte", fonte.includes(IT.TEXTO_MAXIMIZAR), true);

/* Os números das formas são os que os tópicos escrevem. */
const numerosDo = (texto) => (texto.match(/\d+(?:,\d+)?/g) ?? []).map((n) => Number(n.replace(",", ".")));
for (const c of [1, 2, 3, 4]) {
  t(`Custo ${c}: alcance do arremessável`, IT.ALCANCE_ARREMESSAVEL[c], numerosDo(IT.TOPICOS_FORMA[c].arremessavel)[0]);
  t(`Custo ${c}: área do item`, IT.AREA_DO_ITEM[c], numerosDo(IT.TOPICOS_FORMA[c].area)[0]);
  t(`Custo ${c}: totem`, [IT.TOTEM[c].pv, IT.TOTEM[c].defesa, IT.TOTEM[c].area], numerosDo(IT.TOPICOS_FORMA[c].totem));
}
t("os tipos de ataque são os da ficha", IT.ATAQUES_ITEM.map((a) => a.value), AFTY_ATAQUES.map((a) => a.id));
t("os atributos do Ápice são os da ficha", AP.OPCOES_APICE.map((o) => o.id), AFTY_ATTRS.map((a) => a.key));

/* ============================================================ */
/* 2. O QUE CADA CUSTO OFERECE                                   */
/* ============================================================ */
const ofer = (c, m) => IT.efeitosOferecidos(c, m).map((e) => e.value);
t("ficam fora os que o autor tirou",
  ["alcance", "area", "tipoPercepcao", "curarCondicao", "brinco", "reduzirExaustao"].filter((id) => ofer(4, "ativo").includes(id)), []);
t("Custo 1 Passivo", ofer(1, "passivo"), ["acerto", "cd", "pericia", "dano", "pe", "pvMaximo", "deslocamento", "tr", "oficio"]);
t("Atributo só a partir do Custo 3", [ofer(2, "passivo").includes("atributo"), ofer(3, "passivo").includes("atributo")], [false, true]);
t("Treinamento no 2, Mestre no 3", [ofer(1, "passivo").includes("treinamento"), ofer(2, "passivo").includes("treinamento"),
  ofer(2, "passivo").includes("mestre"), ofer(3, "passivo").includes("mestre")], [false, true, false, true]);
t("Maximizar Atributo só no Custo 4 Ativo", [ofer(3, "ativo").includes("maximizarAtributo"),
  ofer(4, "passivo").includes("maximizarAtributo"), ofer(4, "ativo").includes("maximizarAtributo")], [false, false, true]);
t("Mudar Tipo de Dano só no Ativo", [ofer(1, "passivo").includes("mudarTipoDano"), ofer(1, "ativo").includes("mudarTipoDano")], [false, true]);
t("Mudar Tipo de Dano alcança mais categorias a cada Custo",
  [1, 2, 3, 4].map((c) => IT.CATEGORIAS_MUDAR_DANO[c].length), [1, 2, 3, 3]);

const bruto = (p = {}) => ({ id: "itcc_t", nome: "Anel", categoria: "acessorio", custo: 3, modo: "passivo", efeito: "", alvo: "", alvos: [], ...p });
t("efeito que o Custo não tem sai", IT.saneiaItemCusto(bruto({ custo: 2, efeito: "atributo" })).efeito, "");
t("o Treinamento guarda quantas perícias o Custo dá",
  [2, 3, 4].map((c) => IT.saneiaItemCusto(bruto({ custo: c, efeito: "treinamento", alvos: ["a", "b", "c", "d", "e"] })).alvos.length), [1, 2, 4]);
t("o Passivo não tem forma, o Ativo sim",
  [IT.saneiaItemCusto(bruto({ forma: "area" })).forma, IT.saneiaItemCusto(bruto({ modo: "ativo", forma: "area" })).forma], [null, "area"]);
t("id de fora do molde é recusado", IT.saneiaItemCusto({ id: "acsu_x" }), null);
t("o resumo do Ativo", IT.resumoDoItemCusto(IT.saneiaItemCusto(bruto({ modo: "ativo", custo: 4, forma: "totem", efeito: "maximizarAtributo" }))),
  "Totem ou Selo, 40 PV, Defesa 25, área de 9m. Maximizar Atributo por 10 rodadas");
t("o resumo do Mestre não mostra a quantidade como valor",
  IT.resumoDoItemCusto(IT.saneiaItemCusto(bruto({ custo: 4, efeito: "mestre", alvos: ["atletismo", "percepcao"] })), { pericia: { atletismo: "Atletismo", percepcao: "Percepção" } }),
  "Mestre (Atletismo e Percepção)");

/* ============================================================ */
/* 3. O PASSIVO NO MOTOR                                         */
/* ============================================================ */
const ef = (p) => IT.efeitoDoItemCusto(IT.saneiaItemCusto(bruto(p)));
t("Acerto", ef({ efeito: "acerto", alvo: "distancia" }), { aplicado: true, motor: [{ canal: "bonusAcerto", alvo: "distancia", expr: "3" }] });
t("CD", ef({ efeito: "cd" }).motor, [{ canal: "cd", expr: "3" }]);
t("Dano mira o tipo de ataque", ef({ efeito: "dano", alvo: "corpo" }).motor, [{ canal: "danoBonus", alvo: "atq:corpo", expr: "6" }]);
t("PV Máximo sai pelo campo dos itens do livro", ef({ efeito: "pvMaximo" }), { aplicado: true, hpMax: 20 });
t("Atributo também", ef({ efeito: "atributo", alvo: "sabedoria" }), { aplicado: true, atributo: { sabedoria: 2 } });
t("Mestre é faixa 2", ef({ custo: 4, efeito: "mestre", alvos: ["atletismo", "percepcao"] }).motor.map((m) => m.expr), ["2", "2"]);
t("Deslocamento em metros", ef({ efeito: "deslocamento" }).motor, [{ canal: "movimento", expr: "4.5" }]);
t("o Ativo não emite nada", ef({ modo: "ativo", efeito: "cd" }), null);
t("sem alvo, nada", ef({ efeito: "pericia" }), null);

const ficha = (sistema, { itens = [], addon = true, equipado = true, extra = {} } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 10 };
  f.itensCustoCriados = itens;
  f.equipamentos = { itens: itens.map((it, i) => ({ uid: `i${i}`, tipo: "item", refId: it.id, qtd: 1, equipado })) };
  if (addon) f.addons = [pacote];
  return Object.assign(f, extra);
};
const pericia = (d, id) => d.testes.pericias.find((p) => p.id === id);
const passivos = [
  bruto({ id: "itcc_1", efeito: "cd" }),
  bruto({ id: "itcc_2", efeito: "pericia", alvo: "furtividade" }),
  bruto({ id: "itcc_3", efeito: "pe" }),
  bruto({ id: "itcc_4", efeito: "pvMaximo" }),
  bruto({ id: "itcc_5", efeito: "deslocamento" }),
  bruto({ id: "itcc_6", custo: 4, efeito: "treinamento", alvos: ["atletismo", "percepcao", "medicina", "intuicao"] }),
  bruto({ id: "itcc_7", efeito: "dano", alvo: "corpo" }),
];
for (const sis of ["player", "afty"]) {
  const base = deriveAfty(ficha(sis));
  const d = deriveAfty(ficha(sis, { itens: passivos }));
  t(`${sis}: CD +3`, d.cd - base.cd, 3);
  t(`${sis}: Furtividade +3`, pericia(d, "furtividade").bonus - pericia(base, "furtividade").bonus, 3);
  t(`${sis}: PE +10`, d.pe - base.pe, 10);
  t(`${sis}: Movimento +4,5`, d.movimento - base.movimento, 4.5);
  t(`${sis}: treinado nas quatro perícias`, ["atletismo", "percepcao", "medicina", "intuicao"].map((id) => pericia(d, id).prof),
    ["treinado", "treinado", "treinado", "treinado"]);
  t(`${sis}: Dano +6 no Ataque Básico, que é Corpo a Corpo`, d.dano.entradas[0].fixo - base.dano.entradas[0].fixo, 6);
  t(`${sis}: PV Máximo sobe`, d.hp > base.hp, true);
  const des = deriveAfty(ficha(sis, { itens: passivos, equipado: false }));
  t(`${sis}: desequipado não conta`, [des.cd - base.cd, des.pe - base.pe], [0, 0]);
  const semAddon = deriveAfty(ficha(sis, { itens: passivos, addon: false }));
  t(`${sis}: sem o Addon não conta`, [semAddon.cd - deriveAfty(ficha(sis, { addon: false })).cd], [0]);
  const ativo = deriveAfty(ficha(sis, { itens: [bruto({ id: "itcc_a", modo: "ativo", efeito: "cd" })] }));
  t(`${sis}: o Ativo equipado não soma`, ativo.cd - base.cd, 0);
}
t("PV Máximo +20 no jogador", deriveAfty(ficha("player", { itens: [bruto({ efeito: "pvMaximo" })] })).hp - deriveAfty(ficha("player")).hp, 20);
t("o item entra no catálogo com o resumo", deriveAfty(ficha("player", { itens: [bruto({ efeito: "cd" })] })).equip.entradas[0].def.descricao, "CD +3");
t("a categoria decide os espaços (Talismã ocupa meio)",
  deriveAfty(ficha("player", { itens: [bruto({ categoria: "talisma", efeito: "cd" })] })).carga.espacosUsados
  - deriveAfty(ficha("player")).carga.espacosUsados, 0.5);

/* ============================================================ */
/* 4. O ESCOPO DE TIPO DE ATAQUE                                 */
/* ============================================================ */
t("a arma responde pelo tipo de ataque dela", EF.escoposDaArma({ id: "x", ataqueId: "amaldicoado" }).includes("atq:amaldicoado"), true);
const comArma = (alvo) => {
  const f = ficha("player", { itens: [bruto({ efeito: "dano", alvo })] });
  f.armasCustom = [{ id: "armc_d", nome: "Arco", classe: "simples", categoria: "distancia", dano: { dado: "1d6", tipo: "pf" }, critico: 20, custo: 1, grupo: "arco", props: {} }];
  f.equipamentos.itens.push({ uid: "a", tipo: "arma", refId: "armc_d", qtd: 1, equipado: true });
  const d = deriveAfty(f);
  return [d.dano.entradas.find((e) => e.id === "armc_d").fixo, d.dano.entradas[0].fixo];
};
const semBonus = (() => {
  const f = ficha("player");
  f.armasCustom = [{ id: "armc_d", nome: "Arco", classe: "simples", categoria: "distancia", dano: { dado: "1d6", tipo: "pf" }, critico: 20, custo: 1, grupo: "arco", props: {} }];
  f.equipamentos.itens.push({ uid: "a", tipo: "arma", refId: "armc_d", qtd: 1, equipado: true });
  const d = deriveAfty(f);
  return [d.dano.entradas.find((e) => e.id === "armc_d").fixo, d.dano.entradas[0].fixo];
})();
t("Dano A Distância soma no arco e não no básico", comArma("distancia").map((v, i) => v - semBonus[i]), [6, 0]);
t("Dano Corpo a Corpo soma no básico e não no arco", comArma("corpo").map((v, i) => v - semBonus[i]), [0, 6]);

/* ============================================================ */
/* 5. O TALISMÃ DO ÁPICE                                         */
/* ============================================================ */
const talismaLivro = (extra = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = "player";
  f.core = { ...f.core, nd: 10 };
  f.equipamentos = { itens: [{ uid: "t", tipo: "item", refId: AP.ITEM_TALISMA_APICE, qtd: 1, equipado: false }] };
  return Object.assign(f, extra);
};
const estadoApice = (d) => d.combate.estadosExtras.find((e) => e.id === AP.ESTADO_APICE);
t("carregar o talismã do livro abre o estado", !!estadoApice(deriveAfty(talismaLivro())), true);
t("sem talismã, nada", !!estadoApice(deriveAfty(ficha("player"))), false);
const criado = bruto({ id: "itcc_ap", modo: "ativo", custo: 4, forma: "arremessavel", efeito: "maximizarAtributo" });
t("o item criado de Custo 4 que maximiza também abre", !!estadoApice(deriveAfty(ficha("player", { itens: [criado], equipado: false }))), true);
t("mas não sem o Addon", !!estadoApice(deriveAfty(ficha("player", { itens: [criado], addon: false }))), false);

const sem = deriveAfty(talismaLivro({ combate: { ativo: true } }));
const com = deriveAfty(talismaLivro({ combate: { ativo: true, [AP.ESTADO_APICE]: "presenca", talismaApiceRodadas: 4 } }));
t("a Presença vira 30", [sem.attrEff.presenca, com.attrEff.presenca], [10, 30]);
t("os outros atributos não se mexem", ["forca", "destreza", "constituicao", "inteligencia", "sabedoria"]
  .filter((k) => sem.attrEff[k] !== com.attrEff[k]), []);
t("o modificador acompanha", com.testes.pericias.find((p) => p.id === "persuasao")?.bonus > sem.testes.pericias.find((p) => p.id === "persuasao")?.bonus, true);
const soma = (partes) => partes.reduce((s, p) => s + (Number(p.valor) || 0), 0);
const cortado = (partes) => partes.filter((p) => p.texto).reduce((s, p) => s + Math.abs(Number(String(p.texto).replace("−", "-")) || 0), 0);
t("o hover fecha a conta com a parcela do Ápice",
  soma(com.partesAtributo.presenca) - cortado(com.partesAtributo.presenca), com.attrEff.presenca);
t("a rodada chega à Ficha", com.combate.talismaApiceRodadas, 4);
t("fora de combate o Ápice não vale",
  deriveAfty(talismaLivro({ combate: { ativo: false, [AP.ESTADO_APICE]: "presenca" } })).attrEff.presenca, 10);

/* "Vira 30, se possuir a Habilidade Lendaria que aumenta em +2. Fica como 32." */
const lendaria = (atr) => ({
  core: { ...createBlankAfty().core, nd: 30, tipo: "combatente", patamar: "comum" },
  especializacoes: [{ id: "combatente", nivel: 20 }, { id: "conjurador", nivel: 10 }],
  habilidadesLendarias: ["len_aperfeicoamento_de_atributo"],
  escolhasAltoNivel: { len_aperfeicoamento_de_atributo: [atr] },
});
const comLendaria = deriveAfty(talismaLivro({ ...lendaria("forca"), combate: { ativo: true, [AP.ESTADO_APICE]: "forca" } }));
t("com o Aperfeiçoamento de Atributo na Força, a Força vai a 32", comLendaria.attrEff.forca, 32);
const outroAtr = deriveAfty(talismaLivro({ ...lendaria("destreza"), combate: { ativo: true, [AP.ESTADO_APICE]: "forca" } }));
t("com a Lendária em outro atributo, a Força fica em 30", outroAtr.attrEff.forca, 30);

/* As rodadas, pela sessão da Ficha. */
const estado = { id: AP.ESTADO_APICE };
const emCombate = () => ({ ...S.sessaoEmBranco(sem), combate: { ativo: true } });
let s = S.alteraEstadoCombate(emCombate(), estado, "forca");
t("ligar começa na rodada 1", [s.combate[AP.ESTADO_APICE], s.combate.talismaApiceRodadas], ["forca", 1]);
s = S.alteraEstadoCombate(s, estado, "destreza");
t("trocar o atributo mantém a contagem", [s.combate[AP.ESTADO_APICE], s.combate.talismaApiceRodadas], ["destreza", 1]);
let voltas = 0;
while (s.combate[AP.ESTADO_APICE] && voltas < 20) {
  s = S.proximaRodada(s, com).sessao;
  voltas += 1;
}
t("desliga sozinho na virada da décima rodada", [voltas, s.combate.talismaApiceRodadas], [10, 0]);
let s2 = S.alteraEstadoCombate(emCombate(), estado, "forca");
s2 = S.aplicaPatchCombate(s2, { ativo: false });
t("encerrar o combate desliga", [s2.combate[AP.ESTADO_APICE], s2.combate.talismaApiceRodadas], [null, 0]);
const s3 = S.alteraEstadoCombate(emCombate(), estado, null);
t("desligar zera", s3.combate.talismaApiceRodadas, 0);
const s4 = S.descansar(S.alteraEstadoCombate(emCombate(), estado, "forca"), com);
t("descansar desliga", s4.combate[AP.ESTADO_APICE], null);

/* ============================================================ */
/* 6. O PACOTE                                                   */
/* ============================================================ */
t("o pacote libera a fase 3", pacote.libera.includes("itensDeCusto"), true);
t("a liberação está registrada", A.LIBERACOES.some((l) => l.id === "itensDeCusto"), true);
t("o pacote valida", A.validarPacote(pacote), []);

/* ============================================================ */
if (bad.length) {
  console.log(`FALHAS (${bad.length}):`);
  for (const b of bad) console.log("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
