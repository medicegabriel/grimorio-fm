/**
 * CRIAÇÃO DE EQUIPAMENTOS (Addon), fase 4: ENCANTAMENTO DE GRAU ESPECIAL.
 *
 * A seção "Encantamentos de Grau Especial" do guia, copiado sem mudança em
 * `docs/afty-criacao-equipamentos-fonte.md`. Módulo:
 * `afty-criacao-equipamentos-encantamento.js`.
 *
 * As decisões do autor, todas de 2026-09-14:
 *   É a Habilidade Única da Ferramenta de Grau Especial, só nela, e a conta é
 *   OPCIONAL e soma com as linhas livres. Um atributo por efeito, acompanhando o
 *   modificador. RD (Grupo) é uma categoria de dano. Níveis de Dano, Crítico e
 *   Ignorar RD valem na própria arma, ou em tudo quando o item não é arma. O
 *   primeiro efeito vale cheio, e cada efeito a mais escolhe entre a divisão e a
 *   penalidade de metade do BT. A melhoria de Encantamento Padrão dobra no Motor
 *   e conta como efeito. A Técnica Inata vincula um Feitiço, com avisos e usos. A
 *   penalidade de RD reduz a RD TOTAL contra os tipos do grupo, sem ficar abaixo
 *   de zero. Alcance, o Tipo de Dano da Técnica e a Interação com Aptidões ficam
 *   guardados para depois.
 *
 * ------------------------------------------------------------
 * O QUE ESTE ARQUIVO PRENDE
 * ------------------------------------------------------------
 * 1. A tabela e os textos contra a fonte.
 * 2. O saneamento da receita.
 * 3. As linhas: valor cheio, divisão, penalidade, alvos e avisos.
 * 4. O `deriveAfty`: escudo e arma de Grau Especial, livres somando, melhoria,
 *    receita desligada, sem o Addon, e a criatura.
 * 5. A RD por Tipo negativa reduzindo a RD total, com o hover fechando a conta.
 * 6. O Feitiço vinculado: avisos, usos, o estado e o descanso.
 * 7. O pacote.
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
const EN = await import(R + "afty-criacao-equipamentos-encantamento.js");
const S = await import(R + "ficha/ficha-sessao.js");

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
/* 1. A TABELA E OS TEXTOS                                       */
/* ============================================================ */
/* Lê a tabela de Interações Simples do documento, par a par, e confere o
   divisor e o "1,5 *" de cada linha. */
const ini = fonte.indexOf("## Interações Simples");
const bloco = fonte.slice(ini, fonte.indexOf("OBS:", ini)).split("\n").filter((l) => l.startsWith("|")).slice(2);
const doDocumento = {};
for (const l of bloco) {
  const cel = l.split("|").slice(1, -1).map((c) => c.trim());
  for (let i = 0; i + 1 < cel.length; i += 2) {
    const div = cel[i + 1].match(/\/ (\d)/);
    doDocumento[cel[i]] = { divisor: div ? Number(div[1]) : 1, metros: cel[i + 1].includes("1,5") };
  }
}
t("as 12 linhas foram achadas no documento", Object.keys(doDocumento).length, 12);
for (const linha of EN.TABELA_INTERACOES) {
  t(`a linha ${linha.id} é a do guia`, { divisor: linha.divisor, metros: !!linha.metros }, doDocumento[linha.guia]);
}
for (const [id, texto] of Object.entries(EN.TEXTO_ENCANTAMENTO)) t(`o texto ${id} é o da fonte`, fonte.includes(texto), true);
for (const [id, texto] of Object.entries(EN.TEXTO_TECNICA_INATA)) t(`o texto da Técnica Inata ${id} é o da fonte`, fonte.includes(texto), true);
t("Alcance fica guardado", EN.efeitosDoEncantamento().some((e) => e.value === "alcance"), false);
t("a melhoria é oferecida", EN.efeitosDoEncantamento().some((e) => e.value === EN.EFEITO_MELHORAR), true);

/* ============================================================ */
/* 2. O SANEAMENTO                                               */
/* ============================================================ */
const sr = EN.saneiaReceitaUnica({
  ligada: 1,
  efeitos: [
    { tipo: "defesa", atributo: "sabedoria", penalidade: { tipo: "cd" } },
    { tipo: "alcance", atributo: "sabedoria" },
    { tipo: "melhorar", encantamento: "enc_x", modo: "inventado" },
    { tipo: "cd", atributo: "nada", penalidade: { tipo: "alcance" } },
  ],
});
t("o primeiro efeito nunca tem penalidade", sr.efeitos[0].penalidade, null);
t("Alcance vira espaço vazio", sr.efeitos[1].tipo, "");
t("a melhoria cai em Dobrar Valor", sr.efeitos[2].modo, "valor");
t("atributo inválido sai, e penalidade em Alcance também", [sr.efeitos[3].atributo, sr.efeitos[3].penalidade], ["", null]);
t("penalidade escolhida sem tipo fica marcada", EN.saneiaReceitaUnica({ efeitos: [{ tipo: "defesa" }, { tipo: "cd", penalidade: { tipo: "" } }] }).efeitos[1].penalidade,
  { tipo: "", alvo: "", atributo: "" });
t("receita que não é objeto é nenhuma", [EN.saneiaReceitaUnica(null), EN.saneiaReceitaUnica([])], [null, null]);

/* ============================================================ */
/* 3. AS LINHAS                                                  */
/* ============================================================ */
const tipos = { elemental: ["acido", "congelante", "chocante", "queimante", "sonico"] };
const L = (efeitos, extra = {}) => EN.linhasDaReceitaUnica({ ligada: true, efeitos, ...extra },
  { armaId: extra.armaId ?? null, tiposDaCategoria: (c) => tipos[c] ?? [] });

t("um efeito vale cheio", L([{ tipo: "defesa", atributo: "sabedoria" }]).linhas,
  [{ canal: "defesa", expr: "max(0, piso(mod_sabedoria / 2))" }]);
t("dois efeitos se dividem", L([{ tipo: "defesa", atributo: "sabedoria" }, { tipo: "cd", atributo: "presenca" }]).linhas, [
  { canal: "defesa", expr: "piso(max(0, piso(mod_sabedoria / 2)) / 2)" },
  { canal: "cd", expr: "piso(max(0, piso(mod_presenca / 1)) / 2)" },
]);
t("com penalidade, os dois valem cheio e a penalidade entra", L([
  { tipo: "defesa", atributo: "sabedoria" },
  { tipo: "niveisDano", atributo: "forca", penalidade: { tipo: "rdGrupo", alvo: "elemental" } },
]).linhas, [
  { canal: "defesa", expr: "max(0, piso(mod_sabedoria / 2))" },
  { canal: "nivelDano", expr: "max(0, piso(mod_forca / 1))" },
  ...tipos.elemental.map((alvo) => ({ canal: "rdTipo", alvo, expr: "-piso(bt / 2)" })),
]);
t("três efeitos, um com penalidade: os outros dois dividem por 2", L([
  { tipo: "defesa", atributo: "sabedoria" }, { tipo: "cd", atributo: "sabedoria" },
  { tipo: "acerto", atributo: "sabedoria", penalidade: { tipo: "defesa" } },
]).linhas.map((l) => l.expr), [
  "piso(max(0, piso(mod_sabedoria / 2)) / 2)", "piso(max(0, piso(mod_sabedoria / 1)) / 2)",
  "max(0, piso(mod_sabedoria / 2))", "-piso(bt / 2)",
]);
t("Deslocamento anda de 1,5 em 1,5", L([{ tipo: "deslocamento", atributo: "destreza" }]).linhas[0].expr, "1.5 * max(0, piso(mod_destreza / 2))");
t("Iniciativa e Atenção são duas linhas", L([{ tipo: "iniciativaAtencao", atributo: "sabedoria" }]).linhas.map((l) => l.canal), ["iniciativa", "atencao"]);
t("Perícia do Grupo do Atributo", L([{ tipo: "periciaGrupo", atributo: "destreza" }]).linhas[0].alvo, "atr:destreza");
t("RD (Grupo) cobre a categoria", L([{ tipo: "rdGrupo", atributo: "constituicao", alvo: "elemental" }]).linhas.map((l) => l.alvo), tipos.elemental);
t("Níveis de Dano, Crítico e Ignorar RD miram a arma", L([
  { tipo: "niveisDano", atributo: "forca" }, { tipo: "critico", atributo: "forca", penalidade: { tipo: "defesa" } },
  { tipo: "ignorarRd", atributo: "forca", penalidade: { tipo: "defesa" } },
], { armaId: "arm_x" }).linhas.filter((l) => l.canal !== "defesa").map((l) => l.alvo), ["arm_x", "arm_x", "arm_x"]);
t("e em tudo quando o item não é arma", L([{ tipo: "niveisDano", atributo: "forca" }]).linhas[0].alvo, undefined);
t("efeito repetido avisa e não conta duas vezes", (({ linhas, avisos }) => [linhas.length, avisos.map((a) => a.id)])(
  L([{ tipo: "defesa", atributo: "sabedoria" }, { tipo: "defesa", atributo: "forca" }])), [1, ["repetido:defesa"]]);
t("sem atributo avisa", L([{ tipo: "cd" }]).avisos.map((a) => a.id), ["atributo:cd"]);
t("sem alvo avisa e não emite", (({ linhas, avisos }) => [linhas.length, avisos.map((a) => a.id)])(
  L([{ tipo: "tr", atributo: "sabedoria" }])), [0, ["alvo:tr"]]);
t("penalidade incompleta avisa, sai da divisão e não emite", (({ linhas, avisos }) => [linhas.map((l) => l.expr), avisos.map((a) => a.id)])(L([
  { tipo: "defesa", atributo: "sabedoria" },
  { tipo: "cd", atributo: "sabedoria", penalidade: { tipo: "" } },
  { tipo: "acerto", atributo: "sabedoria", penalidade: { tipo: "rdGrupo" } },
  { tipo: "critico", atributo: "sabedoria", penalidade: { tipo: "periciaGrupo" } },
])), [["max(0, piso(mod_sabedoria / 2))", "max(0, piso(mod_sabedoria / 1))", "max(0, piso(mod_sabedoria / 2))", "max(0, piso(mod_sabedoria / 5))"],
  ["penalidade:1", "penalidadeAlvo:2", "penalidadeAtributo:3"]]);
t("Potente não pode ser melhorado", L([{ tipo: "melhorar", encantamento: "enc_arma_potente" }]).avisos.map((a) => a.id), ["melhorarProibido:0"]);
t("a melhoria conta na divisão", L([{ tipo: "defesa", atributo: "sabedoria" }, { tipo: "melhorar", encantamento: "enc_esc_reforcado" }]).linhas[0].expr,
  "piso(max(0, piso(mod_sabedoria / 2)) / 2)");
t("desligada não gera nada", EN.linhasDaReceitaUnica({ ligada: false, efeitos: [{ tipo: "defesa", atributo: "sabedoria" }] }),
  { linhas: [], melhorias: [], avisos: [] });

/* ============================================================ */
/* 4. O DERIVE                                                   */
/* ============================================================ */
const ficha = (sistema, { tipo = "escudo", refId = "esc_medio", guia = null, livres = [], encantamentos = [], addon = true, grau = "especial", extra = {} } = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: 10 };
  f.attributes = { forca: 16, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 20, presenca: 10 };
  f.equipamentos = { itens: [{ uid: "f1", tipo, refId, qtd: 1, equipado: true,
    fa: { grau, encantamentos, habilidadeUnica: "", habilidadeEfeitos: livres, ...(guia ? { guiaUnica: guia } : {}) } }] };
  if (addon) f.addons = [pacote];
  return Object.assign(f, extra);
};
const base = deriveAfty(ficha("player"));
t("jogador: Defesa +2 com Sabedoria 20", deriveAfty(ficha("player", { guia: { ligada: true, efeitos: [{ tipo: "defesa", atributo: "sabedoria" }] } })).defesa - base.defesa, 2);
t("as linhas livres somam com a conta", deriveAfty(ficha("player", {
  guia: { ligada: true, efeitos: [{ tipo: "defesa", atributo: "sabedoria" }] },
  livres: [{ canal: "cd", expr: "3" }],
})).cd - base.cd, 3);
t("a conta desligada não soma", deriveAfty(ficha("player", { guia: { ligada: false, efeitos: [{ tipo: "defesa", atributo: "sabedoria" }] } })).defesa - base.defesa, 0);
t("sem o Addon a receita continua valendo", deriveAfty(ficha("player", { addon: false, guia: { ligada: true, efeitos: [{ tipo: "defesa", atributo: "sabedoria" }] } })).defesa
  - deriveAfty(ficha("player", { addon: false })).defesa, 2);
t("fora do Grau Especial a receita não vale", deriveAfty(ficha("player", { grau: "primeiro", guia: { ligada: true, efeitos: [{ tipo: "defesa", atributo: "sabedoria" }] } })).defesa
  - deriveAfty(ficha("player", { grau: "primeiro" })).defesa, 0);

const semRef = deriveAfty(ficha("player", { encantamentos: ["enc_esc_reforcado"] }));
const comRef = deriveAfty(ficha("player", { encantamentos: ["enc_esc_reforcado"], guia: { ligada: true, efeitos: [{ tipo: "melhorar", encantamento: "enc_esc_reforcado", modo: "valor" }] } }));
t("jogador: a melhoria dobra o Reforçado na RD Física", comRef.rdFisico - semRef.rdFisico, 2);
const usosRef = deriveAfty(ficha("player", { encantamentos: ["enc_esc_reforcado"], guia: { ligada: true, efeitos: [{ tipo: "melhorar", encantamento: "enc_esc_reforcado", modo: "usos" }] } }));
t("dobrar usos não mexe no número", usosRef.rdFisico - semRef.rdFisico, 0);

/* A arma de Grau Especial: Níveis de Dano só nela. */
const comArma = (guia) => {
  const f = ficha("player", { tipo: "arma", refId: "arm_espada_curta", guia });
  f.equipamentos.itens.push({ uid: "f2", tipo: "arma", refId: "arm_adaga", qtd: 1, equipado: true });
  return deriveAfty(f);
};
const armaBase = comArma(null);
const armaNiveis = comArma({ ligada: true, efeitos: [{ tipo: "niveisDano", atributo: "forca" }] });
const dadosDe = (d, id) => d.dano.entradas.find((e) => e.id === id)?.niveisDano ?? d.dano.entradas.find((e) => e.id === id)?.dados;
t("Níveis de Dano +3 (Força 16) só na arma do item", [
  dadosDe(armaNiveis, "arm_espada_curta") !== dadosDe(armaBase, "arm_espada_curta"),
  dadosDe(armaNiveis, "arm_adaga") === dadosDe(armaBase, "arm_adaga"),
], [true, true]);

t("criatura: Defesa +2 também", deriveAfty(ficha("afty", { guia: { ligada: true, efeitos: [{ tipo: "defesa", atributo: "sabedoria" }] } })).defesa
  - deriveAfty(ficha("afty")).defesa, 2);

/* ============================================================ */
/* 5. A RD POR TIPO NEGATIVA                                     */
/* ============================================================ */
/* Na criatura a RD do escudo é RD Geral, e a penalidade de RD (Grupo) desconta
   dela nos tipos do grupo. Cortante, fora do grupo, fica como estava. */
const guiaPen = { ligada: true, efeitos: [
  { tipo: "defesa", atributo: "sabedoria" },
  { tipo: "niveisDano", atributo: "forca", penalidade: { tipo: "rdGrupo", alvo: "elemental" } },
] };
const cBase = deriveAfty(ficha("afty"));
const cPen = deriveAfty(ficha("afty", { guia: guiaPen }));
const linhaTipo = (d, tipo) => d.defesasDano.porTipo[tipo];
t("a penalidade desconta da RD total contra os Elementais", linhaTipo(cBase, "queimante").rd - linhaTipo(cPen, "queimante").rd, 2);
t("e não mexe nos Físicos", linhaTipo(cPen, "ct").rd, linhaTipo(cBase, "ct").rd);
const soma = (partes) => partes.reduce((s, p) => s + (Number(p.valor) || 0), 0);
t("o hover fecha a conta", soma(linhaTipo(cPen, "queimante").partes), linhaTipo(cPen, "queimante").rd);
const pPen = deriveAfty(ficha("player", { guia: guiaPen }));
t("jogador sem RD elemental: fica em zero", linhaTipo(pPen, "queimante").rd, 0);
t("e o hover mostra o piso", soma(linhaTipo(pPen, "queimante").partes), 0);

/* ============================================================ */
/* 6. O FEITIÇO VINCULADO                                        */
/* ============================================================ */
t("Nível 3 avisa", EN.avisosDoFeiticoVinculado({ tipo: "dano", nivel: 3 }).map((a) => a.id), ["nivel"]);
t("Nível 5 Dano passa", EN.avisosDoFeiticoVinculado({ tipo: "dano", nivel: 5 }), []);
t("Transformação passa", EN.avisosDoFeiticoVinculado({ tipo: "especial", especialSubtipo: "transformacao", nivel: 5 }), []);
t("Passivo avisa", EN.avisosDoFeiticoVinculado({ tipo: "passivo", nivel: 5 }).map((a) => a.id), ["tipo"]);
t("condição Forte avisa", EN.avisosDoFeiticoVinculado({ tipo: "dano", nivel: 5, condicoes: [{ forca: "forte" }] }).map((a) => a.id), ["condicao"]);
t("no Curativo a condição é a que ele REMOVE, e não avisa",
  EN.avisosDoFeiticoVinculado({ tipo: "curativo", nivel: 5, condicoes: [{ forca: "extrema" }] }), []);
t("usos: metade do BT, para baixo", [2, 3, 4, 5].map(EN.usosDoFeiticoVinculado), [1, 1, 2, 2]);

const comFeitico = (extraGuia = {}, equipado = true) => {
  const f = ficha("player", { guia: { ligada: true, efeitos: [], feitico: "fe1", ...extraGuia },
    extra: { feiticos: [{ id: "fe1", nome: "Rajada", tipo: "dano", nivel: 5 }] } });
  f.equipamentos.itens[0].equipado = equipado;
  return deriveAfty(f);
};
const dF = comFeitico();
t("o vínculo chega na Ferramenta", dF.equip.entradas[0].fa.feiticoVinculado, { id: "fe1", nome: "Rajada", tipo: "dano", usos: 2, avisos: [] });
const estado = dF.combate.estadosExtras.find((e) => e.id === EN.estadoUsosFeitico("f1"));
t("equipada, os usos viram faixa", [estado?.tipo, estado?.max, estado?.zeraNoDescanso], ["faixa", 2, true]);
t("guardada, não há faixa", comFeitico({}, false).combate.estadosExtras.some((e) => e.id === EN.estadoUsosFeitico("f1")), false);
t("guardada, o aviso continua na bancada", !!comFeitico({}, false).equip.entradas[0].fa.feiticoVinculado, true);
t("Feitiço que sumiu avisa", comFeitico({ feitico: "fe9" }).equip.entradas[0].fa.feiticoVinculado.avisos.map((a) => a.id), ["sumiu"]);
let s = { ...S.sessaoEmBranco(dF), combate: { ativo: true, [EN.estadoUsosFeitico("f1")]: 2 } };
t("a virada de rodada NÃO devolve os usos", S.proximaRodada({ ...s, rodada: 1 }, dF).sessao.combate[EN.estadoUsosFeitico("f1")], 2);
s = S.descansar(s, dF);
t("o descanso devolve os usos", s.combate[EN.estadoUsosFeitico("f1")], 0);

/* ============================================================ */
/* 7. O PACOTE                                                   */
/* ============================================================ */
t("o pacote pede a primitiva da fase 4", pacote.permite.includes("encantamentoGuia"), true);
t("a primitiva está registrada", A.PRIMITIVAS.some((p) => p.id === "encantamentoGuia"), true);
t("o pacote valida", A.validarPacote(pacote), []);

/* ============================================================ */
if (bad.length) {
  console.log(`FALHAS (${bad.length}):`);
  for (const b of bad) console.log("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
