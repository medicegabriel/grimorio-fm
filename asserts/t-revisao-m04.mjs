/* REVISÃO M04 (2026-10-07): ferramentas do jogador, autoria de efeitos.

   Prende o achado A03 (o mesmo do M03-D07): o estado de combate escrito num
   pacote de addon perdia `umaVezPorRodada`, `exclusivoCom` e `custoPE`, que o
   nativo usa. Os três agora chegam ao estado derivado e a sessão os consome
   pelo mesmo `alteraEstadoCombate` do nativo. O portão de instalação confere a
   forma dos três.

   As provas usam dois estados de nomes próprios (`foco` e `reserva`) e custos
   diferentes (2 e 3), para o resultado seguir os dados e não um id do livro. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const AD = await import(R + "afty-addons.js");
const S = await import(R + "ficha/ficha-sessao.js");
const DSL = await import(R + "afty-dsl.js");
const { createBlankAfty } = await import(R + "afty-schema.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const pacote = (custoFoco = 2, custoReserva = "1 + 2") => ({
  id: "m04-repro", nome: "Repro de Estados", versao: "1",
  estadosCombate: [
    { id: "foco", label: "Foco Próprio", tipo: "bool", umaVezPorRodada: true, exclusivoCom: ["reserva"], custoPE: custoFoco },
    { id: "reserva", label: "Reserva Própria", tipo: "bool", custoPE: custoReserva, exclusivoCom: ["foco", "cmb_raw_qualquer"] },
  ],
});

/* ---- o descritor derivado ---- */
for (const [cf, cr, esperadoReserva] of [[2, "1 + 2", 3], [4, 0, 0]]) {
  const c = createBlankAfty();
  c.addons = [pacote(cf, cr)];
  const est = AD.estadosCombateDeAddon(c, 5, { avaliar: (expr) => DSL.evalNumber(expr, {}, 0) });
  const foco = est.find((e) => e.id === "m04-repro:foco");
  const reserva = est.find((e) => e.id === "m04-repro:reserva");
  t(`A03 (custo ${cf}) umaVezPorRodada chega ao derivado`, foco?.umaVezPorRodada, true);
  t(`A03 (custo ${cf}) exclusivoCom chega prefixado`, foco?.exclusivoCom, ["m04-repro:reserva"]);
  t(`A03 (custo ${cf}) e o id do livro fica cru`, reserva?.exclusivoCom, ["m04-repro:foco", "cmb_raw_qualquer"]);
  t(`A03 (custo ${cf}) custoPE numérico`, foco?.custoPE, cf);
  t(`A03 (custo ${cf}) custoPE por expressão`, reserva?.custoPE, esperadoReserva);
  t(`A03 (custo ${cf}) estado sem a marca não ganha umaVezPorRodada`, reserva?.umaVezPorRodada ?? false, false);
}

/* ---- pelo derive, nos dois sistemas ---- */
for (const sistema of ["afty", "player"]) {
  AD.aplicarAddons([pacote()]);
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.addons = [pacote()];
  c.combate = { ativo: true };
  const d = deriveAfty(c);
  const extras = d.combate?.estadosExtras ?? [];
  const foco = extras.find((e) => e.id === "m04-repro:foco");
  t(`A03 (${sistema}) o estado de addon aparece com os três campos`,
    [foco?.umaVezPorRodada, foco?.exclusivoCom, foco?.custoPE], [true, ["m04-repro:reserva"], 2]);

  /* ---- a sessão consome os campos, como no nativo ---- */
  let sessao = { ...S.sessaoEmBranco(d), rodada: 1, combate: { ativo: true, "m04-repro:reserva": true } };
  const reserva = extras.find((e) => e.id === "m04-repro:reserva");
  sessao = S.alteraEstadoCombate(sessao, foco, true);
  t(`A03 (${sistema}) ligar Foco desliga Reserva`, [sessao.combate["m04-repro:foco"], sessao.combate["m04-repro:reserva"]], [true, false]);
  sessao = S.alteraEstadoCombate(sessao, foco, false);
  const depois = S.alteraEstadoCombate(sessao, foco, true);
  t(`A03 (${sistema}) a segunda ativação na mesma rodada é recusada`, depois.combate["m04-repro:foco"], false);
  const novaRodada = S.alteraEstadoCombate({ ...sessao, rodada: 2 }, foco, true);
  t(`A03 (${sistema}) e volta a valer na rodada seguinte`, novaRodada.combate["m04-repro:foco"], true);
  const semLimite = S.alteraEstadoCombate(S.alteraEstadoCombate(sessao, reserva, true), reserva, false);
  t(`A03 (${sistema}) o estado sem limite liga de novo na mesma rodada`,
    S.alteraEstadoCombate(semLimite, reserva, true).combate["m04-repro:reserva"], true);
  t(`A03 (${sistema}) o custoPE é exibição: ligar não desconta PE (decisão vigente)`,
    S.alteraEstadoCombate({ ...sessao, peAtual: 10 }, reserva, true).peAtual, 10);
}

/* ---- o portão de instalação ---- */
const ruins = (estado) => AD.validarPacote({ id: "m04-x", nome: "X", versao: "1", estadosCombate: [{ id: "a", label: "A", ...estado }] });
t("A03 umaVezPorRodada precisa ser booleano", ruins({ umaVezPorRodada: "sim" }).length > 0, true);
t("A03 exclusivoCom precisa ser lista de ids", ruins({ exclusivoCom: "b" }).length > 0, true);
t("A03 custoPE negativo é recusado", ruins({ custoPE: -1 }).length > 0, true);
t("A03 custoPE com expressão quebrada é recusado", ruins({ custoPE: "nd +" }).length > 0, true);
t("A03 os três válidos passam", ruins({ umaVezPorRodada: true, exclusivoCom: ["b"], custoPE: "piso(nd / 2)" }), []);

/* ============================================================ */
/* A04: uma linha de CURA nova, com nome e id próprios           */
/* ============================================================ */
/* A entrada de catálogo declara `fonteCura` e escreve os números pelos canais de
   cura mirando o PRÓPRIO id (local, que ganha o namespace). O teste reproduz o
   Revigorar (Combatente, página 68) com outro nome, outro id e o dado trocado
   (d8 e d10), sem adquirir `cmb_revigorar` e sem herdar a identidade dele. */
const vigor = (faces) => ({
  id: "m04-cura", nome: "Cura de Teste", versao: "1",
  acrescenta: { habilidades: [{
    id: "retomar_vigor", nome: "Retomar o Vigor", descricao: "Teste", especializacaoId: "combatente",
    tipo: "nivel", nivel: 2, requisitos: [],
    fonteCura: { alcance: "Você" },
    efeitos: [
      { canal: "curaDados", alvo: "retomar_vigor", expr: "1 + piso(esc_combatente / 4)" },
      { canal: "curaFaces", alvo: "retomar_vigor", expr: String(faces) },
      { canal: "curaFixa", alvo: "retomar_vigor", expr: "dobro(mod_constituicao) + maestria" },
      { canal: "curaUsos", alvo: "retomar_vigor", expr: "maestria" },
    ],
  }] },
});
const fichaCura = (sistema, habs, addons, nivel = 8) => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd: nivel, tipo: "combatente", patamar: "comum" };
  c.especializacoes = [{ id: "combatente", nivel }];
  c.attributes = { forca: 10, destreza: 10, constituicao: 16, inteligencia: 10, sabedoria: 10, presenca: 10 };
  c.habilidades = habs;
  c.addons = addons;
  return c;
};
const linhaCura = (d, id) => (d.cura?.linhas ?? []).find((l) => l.id === id) ?? null;
for (const sistema of ["afty", "player"]) {
  for (const faces of [8, 10]) {
    AD.aplicarAddons([vigor(faces)]);
    const r = AD.validarPacote(vigor(faces));
    t(`A04 (${sistema} d${faces}) o pacote é aceito`, r, []);
    const propria = linhaCura(deriveAfty(fichaCura(sistema, ["m04-cura:retomar_vigor"], [vigor(faces)])), "m04-cura:retomar_vigor");
    t(`A04 (${sistema} d${faces}) a linha nova existe com o nome dela`, propria?.nome ?? null, "Retomar o Vigor");
    t(`A04 (${sistema} d${faces}) e o alcance declarado`, propria?.alcance ?? null, "Você");
    t(`A04 (${sistema} d${faces}) com os dados e as faces dela`, [propria?.dados, propria?.dado], [3, `d${faces}`]);
    const nativa = linhaCura(deriveAfty(fichaCura(sistema, ["cmb_revigorar"], [])), "cura_revigorar");
    t(`A04 (${sistema} d${faces}) o fixo e os usos batem com o Revigorar nativo`,
      [propria?.fixo ?? propria?.fixoBase, propria?.usos], [nativa?.fixo ?? nativa?.fixoBase, nativa?.usos]);
    t(`A04 (${sistema} d${faces}) sem adquirir, não há linha`,
      linhaCura(deriveAfty(fichaCura(sistema, [], [vigor(faces)])), "m04-cura:retomar_vigor"), null);
    t(`A04 (${sistema} d${faces}) e o Revigorar nativo não aparece por tabela`,
      linhaCura(deriveAfty(fichaCura(sistema, ["m04-cura:retomar_vigor"], [vigor(faces)])), "cura_revigorar"), null);
  }
}
t("A04 alcance fora da lista é recusado na instalação",
  AD.validarPacote({ ...vigor(8), acrescenta: { habilidades: [{ ...vigor(8).acrescenta.habilidades[0], fonteCura: { alcance: "Longe" } }] } })
    .some((p) => p.includes("fonteCura")), true);

AD.limparAddons();
console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
