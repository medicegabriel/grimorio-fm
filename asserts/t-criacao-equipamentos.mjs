/**
 * CRIAÇÃO DE EQUIPAMENTOS (Addon), fase 1: Revestimentos e Escudos criados.
 *
 * O guia "Criação de Equipamentos e Itens 2.5.2" (autor, 2026-09-14), copiado
 * sem mudança em `docs/afty-criacao-equipamentos-fonte.md`. O pacote é
 * `addons/criacao-de-equipamentos.json`, e ele só LIBERA.
 *
 * As decisões do autor que o texto não dá, todas de 2026-09-14:
 *   "Consome 2 de Defesa para adicionar +2 em duas pericias / rd. Logo um CUsto
 *    4 poderia ter 6 de Defesa e -4 de Penalidade e +2 em Atletismo e RD"
 *   Só UM degrau por Revestimento. A RD é a RD por Tipo. Os espaços seguem o
 *   Custo ("Custo 4 vira 6 Espaços, seguindo o padrão de subida"). Na criatura a
 *   Defesa é o Custo menos o degrau. O dado do escudo sobe um degrau por Custo, e
 *   o Custo 4 fica com 1d10. Convive com a Criação de Armas e não liga junto.
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. O pacote, as duas liberações e a incompatibilidade.
 * 2. As tabelas do guia, e a fórmula da penalidade batendo com a coluna.
 * 3. Os Custos 1 a 3 são os itens do LIVRO, número a número.
 * 4. As contas do Revestimento com a troca, com o exemplo do autor.
 * 5. O saneamento das escolhas e o catálogo da ficha.
 * 6. O `deriveAfty` inteiro nos dois sistemas, com e sem o Addon.
 * 7. A trava entre pacotes, simétrica, e o aviso da ficha que chega com os dois.
 */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
import { readFileSync } from "node:fs";

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");
const EQ = await import(R + "afty-equipamentos.js");
const CE = await import(R + "afty-criacao-equipamentos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const lerPacote = (arquivo) => A.normalizarPacote(
  JSON.parse(readFileSync(new URL(`../addons/${arquivo}`, import.meta.url), "utf8")),
);
const pacote = lerPacote("criacao-de-equipamentos.json");
const armas = lerPacote("criacao-de-armas.json");

/* ============================================================ */
/* 1. O PACOTE                                                   */
/* ============================================================ */
t("o pacote valida sem problema nenhum", A.validarPacote(pacote), []);
t("ele libera as duas da fase 1 e a da fase 3", pacote.libera, ["revestimentosCriados", "escudosCriados", "itensDeCusto"]);
t("e pede as primitivas das fases 2 e 4", pacote.permite, ["armasPorNivel", "encantamentoGuia"]);
t("declara a Criação de Armas", pacote.incompativeis, ["criacao-de-armas"]);
t("as duas liberações estão registradas",
  ["revestimentosCriados", "escudosCriados"].map((id) => A.LIBERACOES.some((l) => l.id === id)), [true, true]);
t("instalado, a ficha tem as três",
  A.liberacoesDaCriatura({ addons: [pacote] }), ["revestimentosCriados", "escudosCriados", "itensDeCusto"]);
t("cada tipo criado aponta para a sua", CE.LIBERACAO_DO_CRIADO,
  { revestimento: "revestimentosCriados", escudo: "escudosCriados", itemCusto: "itensDeCusto" });

/* ============================================================ */
/* 2. AS TABELAS DO GUIA                                         */
/* ============================================================ */
/* Transcritas da fonte. Mexer numa célula aqui é mexer no texto do autor. */
t("a tabela de Revestimentos",
  CE.TABELA_REVESTIMENTO.map((l) => [l.custo, l.defesa, l.penalidade]),
  [[1, 2, 0], [2, 4, -2], [3, 6, -4], [4, 8, -6]]);
t("a tabela de Escudos",
  CE.TABELA_ESCUDO.map((l) => [l.custo, l.rd, l.penalidade]),
  [[1, 2, -1], [2, 4, -2], [3, 6, -4], [4, 8, -6]]);
for (const l of CE.TABELA_REVESTIMENTO) {
  t(`a fórmula "(Defesa - 2)" dá a coluna no Custo ${l.custo}`, CE.penalidadeDaDefesa(l.defesa), l.penalidade);
}
t("a fórmula nunca dá penalidade positiva", [0, 1, 2].map(CE.penalidadeDaDefesa).every((p) => p === 0), true);

const fonte = readFileSync(new URL("../docs/afty-criacao-equipamentos-fonte.md", import.meta.url), "utf8");
/* O texto da constante é o da fonte sem a marcação: tira os asteriscos e as
   barras de escape do Markdown e procura a frase inteira. */
const semMarcacao = fonte.replace(/\*/g, "").replace(/\\/g, "");
t("o texto dos Revestimentos é o da fonte", semMarcacao.includes(CE.TEXTO_REVESTIMENTOS), true);
for (const paragrafo of CE.TEXTO_ESCUDOS.split("\n\n")) {
  t(`o texto dos Escudos é o da fonte (${paragrafo.slice(0, 20)})`, semMarcacao.includes(paragrafo), true);
}

/* ============================================================ */
/* 3. OS CUSTOS 1 A 3 SÃO O LIVRO                                */
/* ============================================================ */
/* ⚠ É a prova de que as tabelas do guia foram escritas em cima do catálogo, e é o
   que sustenta as duas decisões do autor que completam o Custo 4 (6 espaços e
   1d10): elas seguem o degrau dos três de baixo. */
const livroUnif = ["unif_revestimento_leve", "unif_revestimento_medio", "unif_revestimento_robusto"]
  .map((id) => EQ.UNIFORME_MODIFICACOES.find((m) => m.id === id));
livroUnif.forEach((m, i) => {
  const n = CE.numerosDoRevestimento({ custo: i + 1 });
  t(`Revestimento Custo ${i + 1} é o ${m.nome}`,
    [n.defesa, n.penalidade, n.espacos, n.custo], [m.defesa, m.penalidade, m.espacos, m.custo]);
});
const livroEsc = ["esc_leve", "esc_medio", "esc_pesado"].map((id) => EQ.ESCUDOS.find((e) => e.id === id));
livroEsc.forEach((e, i) => {
  const n = CE.numerosDoEscudo({ custo: i + 1 });
  t(`Escudo Custo ${i + 1} é o ${e.nome}`,
    [n.rd, n.penalidade, n.dado, n.tipoDano, n.espacos, n.custo],
    [e.rdEscudo, e.penalidade, e.dano.dado, e.dano.tipo, e.espacos, e.custo]);
});
t("o Custo 4 completa as duas escadas", [CE.ESPACOS_REVESTIMENTO[4], CE.DADO_ESCUDO[4]], [6, "1d10"]);

/* ============================================================ */
/* 4. A TROCA DO REVESTIMENTO                                    */
/* ============================================================ */
const r4 = CE.numerosDoRevestimento({ custo: 4, troca: true });
t("o exemplo do autor: Custo 4 com troca", [r4.defesa, r4.penalidade], [6, -4]);
t("os espaços seguem o Custo mesmo com a troca", r4.espacos, 6);
t("na criatura, Custo menos o degrau", r4.defesaCriatura, 3);
t("sem troca, a criatura recebe o Custo", CE.numerosDoRevestimento({ custo: 4 }).defesaCriatura, 4);
t("Custo 2 com troca", (({ defesa, penalidade, defesaCriatura }) => [defesa, penalidade, defesaCriatura])(
  CE.numerosDoRevestimento({ custo: 2, troca: true })), [2, 0, 1]);
t("o Custo 1 não troca: não tem aumento de Defesa",
  CE.numerosDoRevestimento({ custo: 1, troca: true }), CE.numerosDoRevestimento({ custo: 1 }));
t("Custo fora da tabela cai no 1", [0, 5, "x", null, 2.7].map(CE.custoDeCriacao), [1, 1, 1, 1, 2]);

/* ============================================================ */
/* 5. ESCOLHAS E CATÁLOGO                                        */
/* ============================================================ */
t("no máximo duas escolhas", CE.saneiaEscolhasDaTroca([
  { tipo: "pericia", alvo: "atletismo" }, { tipo: "rd", alvo: "queimante" }, { tipo: "pericia", alvo: "furtividade" },
]).length, 2);
t("a mesma escolha não entra duas vezes (máximo de +2 por Perícia ou RD)", CE.saneiaEscolhasDaTroca([
  { tipo: "pericia", alvo: "atletismo" }, { tipo: "pericia", alvo: "atletismo" }, { tipo: "rd", alvo: "ct" },
]), [{ tipo: "pericia", alvo: "atletismo" }, { tipo: "rd", alvo: "ct" }]);
t("tipo desconhecido sai", CE.saneiaEscolhasDaTroca([{ tipo: "defesa", alvo: "x" }]), []);
t("o seletor vazio fica na ficha", CE.saneiaEscolhasDaTroca([{ tipo: "rd", alvo: "" }]), [{ tipo: "rd", alvo: "" }]);
t("e não vira efeito", CE.efeitosDoRevestimento({ troca: true, escolhas: [{ tipo: "rd", alvo: "" }] }), []);
t("as escolhas viram as linhas do Motor",
  CE.efeitosDoRevestimento({ troca: true, escolhas: [{ tipo: "pericia", alvo: "atletismo" }, { tipo: "rd", alvo: "queimante" }] }),
  [{ canal: "bonusPericia", alvo: "atletismo", expr: "2" }, { canal: "rdTipo", alvo: "queimante", expr: "2" }]);
t("sem a troca, nenhuma linha",
  CE.efeitosDoRevestimento({ troca: false, escolhas: [{ tipo: "pericia", alvo: "atletismo" }] }), []);

const rev = (patch = {}) => CE.novoRevestimentoCriado({ nome: "Colete", custo: 4, ...patch });
const esc = (patch = {}) => CE.novoEscudoCriado({ nome: "Broquel", custo: 4, ...patch });
t("o novo Revestimento nasce no molde", [CE.novoRevestimentoCriado().id.startsWith("revc_"), CE.novoRevestimentoCriado().custo], [true, 1]);
t("o novo Escudo nasce no molde", [CE.novoEscudoCriado().id.startsWith("escc_"), CE.novoEscudoCriado().custo], [true, 1]);
t("sem nome ganha um", [
  CE.revestimentoCriadoParaCatalogo({ id: "revc_a", nome: "  " }).nome,
  CE.escudoCriadoParaCatalogo({ id: "escc_a" }).nome,
], ["Revestimento sem Nome", "Escudo sem Nome"]);
t("id de fora do molde é recusado", [
  CE.revestimentoCriadoParaCatalogo({ id: "escc_a" }), CE.escudoCriadoParaCatalogo({ id: "acsu_a" }),
], [null, null]);
const um = rev({ id: "revc_um" });
t("id repetido entra uma vez", EQ.revestimentosCriadosDaFicha({ revestimentosCriados: [um, um] }).length, 1);
t("o criado entra no catálogo de Uniformes",
  EQ.catalogoDoTipo("uniforme", { revestimentosCriados: [um] }).some((u) => u.id === "revc_um"), true);
t("e o escudo no de Escudos",
  EQ.catalogoDoTipo("escudo", { escudosCriados: [esc({ id: "escc_um" })] }).some((e) => e.id === "escc_um"), true);
t("sem ficha, o catálogo é o do livro", EQ.catalogoDoTipo("uniforme").length, EQ.UNIFORME_MODIFICACOES.length);

/* ============================================================ */
/* 6. O DERIVE INTEIRO                                           */
/* ============================================================ */
const ficha = (sistema, { revestimentos = [], escudos = [], addon = true, equipado = true, fa = null } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 10, tipo: "misto", patamar: "comum" };
  f.revestimentosCriados = revestimentos;
  f.escudosCriados = escudos;
  f.equipamentos = {
    itens: [
      ...revestimentos.map((r, i) => ({ uid: `u${i}`, tipo: "uniforme", refId: r.id, qtd: 1, equipado })),
      ...escudos.map((e, i) => ({ uid: `e${i}`, tipo: "escudo", refId: e.id, qtd: 1, equipado, ...(fa ? { fa } : {}) })),
    ],
  };
  if (addon) f.addons = [pacote];
  return f;
};
const vazio = (sistema, addon = true) => deriveAfty(ficha(sistema, { addon }));
const atletismo = (d) => d.testes.pericias.find((p) => p.id === "atletismo")?.bonus;
const rdQueimante = (d) => d.defesasDano.porTipo.queimante.rdProprio;
const escolhasDoAutor = [{ tipo: "pericia", alvo: "atletismo" }, { tipo: "rd", alvo: "queimante" }];

/* ⚠ Liberar sem criar nada não muda número nenhum. */
for (const sis of ["afty", "player"]) {
  const com = vazio(sis, true);
  const sem = vazio(sis, false);
  t(`${sis}: o Addon sozinho não mexe na ficha`,
    [com.defesa, com.hp, com.pe, com.rdGeral, com.rdFisico, com.equip.penalidadeDestreza, com.carga.espacosUsados],
    [sem.defesa, sem.hp, sem.pe, sem.rdGeral, sem.rdFisico, sem.equip.penalidadeDestreza, sem.carga.espacosUsados]);
}

/* O Revestimento. */
for (const [sis, semTroca, comTroca] of [["player", 8, 6], ["afty", 4, 3]]) {
  const base = vazio(sis);
  const d = deriveAfty(ficha(sis, { revestimentos: [rev()] }));
  const dt = deriveAfty(ficha(sis, { revestimentos: [rev({ troca: true, escolhas: escolhasDoAutor })] }));
  t(`${sis}: Custo 4 sem troca, Defesa`, d.defesa - base.defesa, semTroca);
  t(`${sis}: Custo 4 com troca, Defesa`, dt.defesa - base.defesa, comTroca);
  t(`${sis}: penalidade sem e com troca`, [d.equip.penalidadeDestreza, dt.equip.penalidadeDestreza], [-6, -4]);
  t(`${sis}: +2 em Atletismo com a troca`, atletismo(dt) - atletismo(base), 2);
  t(`${sis}: +2 de RD contra Queimante com a troca`, rdQueimante(dt) - rdQueimante(base), 2);
  t(`${sis}: sem a troca, Atletismo não muda`, atletismo(d) - atletismo(base), 0);
  t(`${sis}: ocupa 6 espaços`, dt.carga.espacosUsados - base.carga.espacosUsados, 6);
}

/* Sem o Addon: continua carregado e equipado, e deixa de contar. */
for (const sis of ["afty", "player"]) {
  const base = vazio(sis, false);
  const d = deriveAfty(ficha(sis, { addon: false, revestimentos: [rev({ troca: true, escolhas: escolhasDoAutor })] }));
  t(`${sis} sem o Addon: Defesa, penalidade e Atletismo parados`,
    [d.defesa - base.defesa, d.equip.penalidadeDestreza, atletismo(d) - atletismo(base)], [0, 0, 0]);
  t(`${sis} sem o Addon: os espaços continuam contando`, d.carga.espacosUsados - base.carga.espacosUsados, 6);
  const entrada = d.equip.entradas[0];
  t(`${sis} sem o Addon: a entrada segue equipada e marcada`, [entrada.equipado, entrada.semAddon, entrada.def.nome], [true, true, "Colete"]);
  t(`${sis} sem o Addon: nenhum aviso de equipamento desconhecido`, d.equip.avisos, []);
}
t("desequipado não conta", (() => {
  const base = vazio("player");
  return deriveAfty(ficha("player", { equipado: false, revestimentos: [rev()] })).defesa - base.defesa;
})(), 0);

/* O Escudo. */
for (const [sis, campo, outro] of [["player", "rdFisico", "rdGeral"], ["afty", "rdGeral", "rdFisico"]]) {
  const base = vazio(sis);
  const d = deriveAfty(ficha(sis, { escudos: [esc()] }));
  t(`${sis}: Escudo Custo 4 soma 8 na ${campo}`, d[campo] - base[campo], 8);
  t(`${sis}: e nada na ${outro}`, d[outro] - base[outro], 0);
  t(`${sis}: penalidade do Escudo Custo 4`, d.equip.penalidadeDestreza, -6);
  t(`${sis}: o Escudo ocupa 2`, d.carga.espacosUsados - base.carga.espacosUsados, 2);
  const semAddon = deriveAfty(ficha(sis, { addon: false, escudos: [esc()] }));
  t(`${sis} sem o Addon: o Escudo não dá RD`, semAddon[campo] - vazio(sis, false)[campo], 0);
}
t("o Escudo criado vira Ferramenta Amaldiçoada como qualquer outro", (() => {
  const base = vazio("player");
  const d = deriveAfty(ficha("player", { escudos: [esc()], fa: { grau: "segundo", encantamentos: [], habilidadeUnica: "" } }));
  return d.rdFisico - base.rdFisico;
})(), 8 + 3);
t("as duas liberações são independentes", (() => {
  const soEscudo = { ...pacote, libera: ["escudosCriados"] };
  const f = ficha("player", { revestimentos: [rev()], escudos: [esc()] });
  f.addons = [soEscudo];
  const d = deriveAfty(f);
  const base = vazio("player", false);
  return [d.defesa - base.defesa, d.rdFisico - base.rdFisico];
})(), [0, 8]);

/* ============================================================ */
/* 7. OS PACOTES QUE NÃO LIGAM JUNTOS                            */
/* ============================================================ */
t("a Criação de Armas não declara nada", armas.incompativeis, []);
t("mesmo assim a trava pega dos dois lados", [
  A.incompativeisCom(pacote, [armas]).map((p) => p.id),
  A.incompativeisCom(armas, [pacote]).map((p) => p.id),
], [["criacao-de-armas"], ["criacao-de-equipamentos"]]);
t("o próprio pacote não se barra", A.incompativeisCom(pacote, [pacote]), []);
t("com outro pacote qualquer, liga", A.incompativeisCom(pacote, [lerPacote("carteira-da-guilda.json")]), []);
t("normaliza para minúsculas e sem repetir",
  A.normalizarPacote({ incompativeis: [" Criacao-De-Armas ", "criacao-de-armas", 3] }).incompativeis, ["criacao-de-armas"]);
t("o validador recusa o próprio id", A.validarPacote({ ...pacote, incompativeis: [pacote.id] }).length, 1);
t("e id fora do formato", A.validarPacote({ ...pacote, incompativeis: ["Não Vale"] }).length, 1);

const comOsDois = createBlankAfty();
comOsDois.rulesVersion = "player";
comOsDois.addons = [pacote, armas];
t("a ficha com os dois acusa um par", A.incompativeisNaFicha(comOsDois).map(([a, b]) => [a.id, b.id]),
  [["criacao-de-equipamentos", "criacao-de-armas"]]);
const problemas = deriveAfty(comOsDois).addonProblemas.filter((p) => p.familia === "incompativeis");
t("e o aviso chega ao derive", problemas.map((p) => p.motivo),
  ['Os addons "Criação de Equipamentos" e "Criação de Armas" não ligam juntos no mesmo personagem.']);
t("com um só, nenhum aviso",
  deriveAfty({ ...comOsDois, addons: [pacote] }).addonProblemas.filter((p) => p.familia === "incompativeis"), []);

/* ============================================================ */
if (bad.length) {
  console.log(`FALHAS (${bad.length}):`);
  for (const b of bad) console.log("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
