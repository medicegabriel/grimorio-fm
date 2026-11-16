/* A CONSULTA NA FICHA FINAL (2026-11-14): Interlúdios, Votos e Resistências por Tipo de Dano, só para leitura.
   Os jogadores abriam o criador só para reler o Treino de Energia Reversa, os Votos e a RD contra um tipo. */
import { register } from "node:module";
import assert from "node:assert/strict";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { deriveAfty: derive } = await import("../src/systems/afty/afty-derive.js");
const { createBlankAfty } = await import("../src/systems/afty/afty-schema.js");
const AD = await import("../src/systems/afty/afty-addons.js");
const { conteudoDaFicha, GRUPOS } = await import("../src/systems/afty/ficha/ficha-conteudo.js");
const { alvosExtrasDaBusca } = await import("../src/systems/afty/ficha/abas-g2/busca-g2.js");
const { montarRepertorio } = await import("../src/systems/afty/ficha/efeitos/repertorio.js");
const deriveAfty = (f) => { AD.aplicarAddons(f.addons ?? []); return derive(f); };

let checks = 0;
const t = (nome, real, esperado) => {
  try { assert.deepEqual(JSON.parse(JSON.stringify(real)), esperado); checks++; }
  catch (e) { console.error(`FALHOU: ${nome}`); throw e; }
};

for (const sistema of ["player", "afty"]) {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core.nd = 20;
  f.treinamentos = { energia_reversa: 2 };
  f.treinosEspeciais = ["tes_feitico", "tes_feitico"];
  f.votos = {
    contratuais: [{ id: "c1", texto: "Proteger a vila", participantes: [{ nome: "Yuki" }] }],
    mecanicos: [
      { id: "m1", nome: "Olhos Vendados", narrativa: "Nunca enxerga.", beneficio: { texto: "+2 Percepção", efeitos: [] }, maleficio: { texto: "Cego", efeitos: [] } },
      { id: "m2", nome: "", narrativa: "", beneficio: { texto: "", efeitos: [] }, maleficio: { texto: "", efeitos: [] } },
      { id: "m3", nome: "Terceiro", narrativa: "", beneficio: { texto: "", efeitos: [] }, maleficio: { texto: "", efeitos: [] } },
    ],
  };
  f.defesasDano = { queimante: { estado: "imune", rd: 3 } };
  const d = deriveAfty(f);
  const itens = conteudoDaFicha(f, d);
  const nomes = (g) => itens.filter((i) => i.grupo === g).map((i) => i.nome);

  /* Treinos: toda linha aparece, e não só as marcadas com `exibirNaFicha`. */
  t(`${sistema}: Energia Reversa nas duas etapas`, nomes("treinamento").filter((n) => n.startsWith("Treino de Energia Reversa")),
    ["Treino de Energia Reversa: 1ª Etapa", "Treino de Energia Reversa: 2ª Etapa"]);
  const especial = itens.find((i) => i.chave === "treinoEspecial:tes_feitico");
  t(`${sistema}: Treino Especial com as vezes`, [especial?.nome, especial?.tags], ["Treinamento para Feitiço", [{ label: "2×", tipo: "vezes" }]]);
  t(`${sistema}: Treino Especial com o texto do catálogo`, especial?.texto.length > 0, true);

  /* Votos: um grupo próprio, Mecânicos antes dos Contratuais. */
  t(`${sistema}: grupo Votos existe`, GRUPOS.some((g) => g.id === "voto"), true);
  t(`${sistema}: ordem e nomes dos Votos`, nomes("voto"), ["Olhos Vendados", "Voto Sem Nome", "Terceiro", "Voto Contratual 1"]);
  const m1 = itens.find((i) => i.chave === "voto:m1");
  t(`${sistema}: texto do Mecânico`, m1.texto, "Nunca enxerga.\n\n**Benefício**\n+2 Percepção\n\n**Malefício**\nCego");
  t(`${sistema}: marca do Mecânico`, m1.tags.map((x) => x.label), ["Mecânico"]);
  const c1 = itens.find((i) => i.chave === "voto:c1");
  t(`${sistema}: texto do Contratual`, c1.texto, "Proteger a vila\n\n**Participantes**\nYuki");
  const bt = d.maestria;
  t(`${sistema}: aviso só depois do BT`, itens.filter((i) => i.grupo === "voto" && i.tags[0]?.label === "Mecânico").map((i) => i.aviso),
    [0, 1, 2].map((k) => (k < bt ? null : "Fora do Limite de BT")));

  /* O repertório do G2 é o que a aba Habilidades desenha: ele levava só os seis primeiros grupos, e Treinamentos e Votos ficavam fora. */
  const rep = montarRepertorio(f, d);
  const gruposRep = new Set(rep.todas.map((e) => e.grupo));
  t(`${sistema}: repertório do G2 leva Treinamentos e Votos`, [gruposRep.has("treinamento"), gruposRep.has("voto")], [true, true]);
  t(`${sistema}: seção com o rótulo do grupo`, rep.secoes.find((s) => s.id === "voto")?.rotulo, "Votos");

  /* Resistências: a busca global chega na linha do tipo, com a RD e o estado no detalhe. */
  const q = d.defesasDano.linhas.find((l) => l.tipo === "queimante");
  const alvo = alvosExtrasDaBusca(d).find((a) => a.chave === "defesa:queimante");
  t(`${sistema}: busca aponta Perícias`, alvo?.aba, "pericias");
  t(`${sistema}: detalhe da busca`, alvo?.detalhe, `RD ${q.rd}, Imune`);
  t(`${sistema}: um destino por tipo`, alvosExtrasDaBusca(d).filter((a) => a.chave.startsWith("defesa:")).length, d.defesasDano.linhas.length);
}

/* Ficha sem nada: nenhum Voto e nenhum Treino aparecem. */
{
  const f = createBlankAfty();
  const itens = conteudoDaFicha(f, deriveAfty(f));
  t("ficha vazia sem Votos", itens.filter((i) => i.grupo === "voto").length, 0);
  t("ficha vazia sem Treinos", itens.filter((i) => i.grupo === "treinamento").length, 0);
}

/* Mais Mecânicos que o BT: o que passa do limite leva o aviso, e o Proposto não ocupa vaga nem leva aviso. */
{
  const f = createBlankAfty();
  f.core.nd = 1;
  const vazio = () => ({ texto: "", efeitos: [] });
  const mec = (id, extra = {}) => ({ id, nome: id, narrativa: "", beneficio: vazio(), maleficio: vazio(), ...extra });
  const d0 = deriveAfty(f);
  const bt = d0.maestria;
  f.votos = { contratuais: [], mecanicos: [
    mec("proposto", { tipo: "proprio", estado: "proposto" }),
    ...Array.from({ length: bt + 1 }, (_, k) => mec(`m${k}`)),
  ] };
  const itens = conteudoDaFicha(f, deriveAfty(f)).filter((i) => i.grupo === "voto");
  t("BT baixo: o Proposto sem aviso", itens[0].aviso, null);
  t("BT baixo: só o último passa do limite", itens.slice(1).map((i) => i.aviso),
    Array.from({ length: bt + 1 }, (_, k) => (k < bt ? null : "Fora do Limite de BT")));
}

console.log(`TODOS OS ${checks} ASSERTS PASSARAM`);
