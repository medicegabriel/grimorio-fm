/* O pacote real Treino de TR conserva a progressão do Treino de Perícia:
   Treinado na 1ª etapa, Mestre na 3ª, custos 1/1/1/2 e benefícios manuais
   nas demais etapas. Exercita as duas fichas sem mudar o treino anterior. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty, mesclaFichaAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");
const TR = await import(R + "afty-treinamentos.js");
const { serializeExport, parseImportText } = await import("../src/components/io-utils.js");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};
const ler = (nome) => JSON.parse(readFileSync(new URL(`../addons/${nome}.json`, import.meta.url), "utf8"));
const bruto = ler("treino-de-tr");
const pacote = AD.normalizarPacote(bruto);
const anterior = AD.normalizarPacote(ler("treino-testes-de-resistencia"));
const ID = "treino-de-tr:tr";
const ANTIGO = "treino-testes-de-resistencia:testes_de_resistencia";
const ALVOS = ["fortitude", "reflexos", "vontade", "astucia", "integridade"];

AD.aplicarAddons([]);
const nativas = structuredClone(TR.AFTY_TREINAMENTOS);
const pericia = structuredClone(TR.getTreinamento("pericia"));
t("o JSON real valida", AD.validarPacote(bruto), []);
t("normalizar novamente preserva o treino", AD.normalizarPacote(pacote).acrescenta, pacote.acrescenta);
t("a instalação não acusa problemas", AD.aplicarAddons([pacote]).problemas, []);
const linha = TR.getTreinamento(ID);
t("o treino é acrescentado com namespace e alvo de TR", [linha?.nome, linha?.repetivel, linha?.alvoTipo],
  ["Treino de TR", true, "tr"]);
t("Integridade é habilitada somente na nova linha", [linha.incluiIntegridade, anterior.acrescenta.treinamentos[0].incluiIntegridade === true],
  [true, false]);
t("as linhas nativas são preservadas", TR.AFTY_TREINAMENTOS.filter((l) => !l.id.includes(":")), nativas);
t("etapas, custos e requisitos iguais aos de Perícia",
  linha.etapas.map(({ n, focos, requisito }) => ({ n, focos, requisito })),
  pericia.etapas.map(({ n, focos, requisito }) => ({ n, focos, requisito })));
t("as quatro etapas não têm requisito", linha.etapas.map((e) => e.requisito), [null, null, null, null]);
for (const n of [1, 3]) {
  const etapa = linha.etapas[n - 1];
  const efeitosPericia = pericia.etapas[n - 1].efeitos;
  t(`${n}ª etapa: concessão e caso já seja usam a mesma faixa da Perícia`,
    etapa.efeitos.map((e) => [e.canal, e.alvo, Number(e.expr)]),
    [["proficienciaTRCasoJa", "instancia", efeitosPericia.find((e) => e.tipo === "profPericia").valor]]);
  t(`${n}ª etapa: o bônus condicional acompanha a faixa de Perícia`,
    Number(etapa.efeitos[0].expr), efeitosPericia.find((e) => e.tipo === "pericia").quandoProf);
}
t("2ª, 4ª e Completo conservam benefícios manuais sem efeito numérico",
  [linha.etapas[1], linha.etapas[3], linha.completo].map((e) => e.efeitos ?? []), [[], [], []]);
t("os cinco TR têm rótulos próprios", ALVOS.map((a) => TR.rotuloAlvo(linha, a)),
  ["Fortitude", "Reflexos", "Vontade", "Astúcia", "Integridade"]);
t("o custo acumulado acompanha a Perícia", [1, 2, 3, 4].map((p) => TR.focosDaLinha(linha, p)),
  [1, 2, 3, 4].map((p) => TR.focosDaLinha(pericia, p)));

const instancia = (alvo, progresso) => [{ alvo, progresso }];
const ficha = (sistema = "player", treinamentos = {}, opcoes = {}) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.name = "Treino de TR";
  f.core = { ...f.core, nd: opcoes.nivel ?? 8, tipo: "misto", patamar: "comum", origem: { id: "inato" } };
  f.attributes = { forca: 10, destreza: 12, constituicao: 14, inteligencia: 10, sabedoria: 12, presenca: 10 };
  f.especializacoes = [{ id: "combatente", nivel: f.core.nd }];
  f.trDaClasse = opcoes.classe ?? [];
  f.treinamentos = treinamentos;
  f.addons = structuredClone(opcoes.addons ?? [pacote]);
  if (opcoes.prof) f.resistenciasProf = opcoes.prof;
  if (opcoes.efeitos) f.core.tecnicaEfeitos = opcoes.efeitos;
  return f;
};
const tr = (d, alvo) => d.testes.resistencias.find((r) => r.value === alvo);
const parcela = (r) => r.partes.filter((p) => p.label.startsWith("Treino de TR (")).map((p) => p.valor);
const resumir = (d) => d.testes.resistencias.map(({ value, prof, bonus, margemCritico }) =>
  ({ value, prof, bonus, margemCritico }));

for (const sistema of ["afty", "player"]) {
  const base = deriveAfty(ficha(sistema));
  for (const alvo of ALVOS) {
    const etapas = [1, 2, 3, 4].map((p) => deriveAfty(ficha(sistema, { [ID]: instancia(alvo, p) })));
    const resultados = etapas.map((d) => tr(d, alvo));
    t(`${sistema}/${alvo}: o Treinado vem na 1ª e o Mestre só na 3ª`, resultados.map((r) => r.prof),
      ["treinado", "treinado", "mestre", "mestre"]);
    t(`${sistema}/${alvo}: a própria concessão não compra +1 nem +2`, resultados.map(parcela), [[], [], [], []]);
    t(`${sistema}/${alvo}: 2ª e 4ª não aumentam o bônus`,
      [resultados[1].bonus - resultados[0].bonus, resultados[3].bonus - resultados[2].bonus], [0, 0]);
    t(`${sistema}/${alvo}: o Completo conserva margem 20`, resultados[3].margemCritico, 20);
    t(`${sistema}/${alvo}: os outros TR não mudam`,
      resumir(etapas[3]).filter((r) => r.value !== alvo), resumir(base).filter((r) => r.value !== alvo));
  }

  for (const alvo of ["vontade", "integridade"]) for (const faixa of [1, 2]) {
    const efeitos = [{ canal: "proficienciaTR", alvo, expr: String(faixa) }];
    const fonte = tr(deriveAfty(ficha(sistema, {}, { efeitos })), alvo);
    const e1 = tr(deriveAfty(ficha(sistema, { [ID]: instancia(alvo, 1) }, { efeitos })), alvo);
    const e3 = tr(deriveAfty(ficha(sistema, { [ID]: instancia(alvo, 3) }, { efeitos })), alvo);
    t(`${sistema}/${alvo}: fonte legítima na faixa ${faixa} dá +1 na 1ª`,
      [e1.prof, e1.bonus - fonte.bonus, parcela(e1)], [faixa === 1 ? "treinado" : "mestre", 1, [1]]);
    t(`${sistema}/${alvo}: fonte legítima na faixa ${faixa} concede Mestre ou soma +2 na 3ª`,
      [e3.prof, parcela(e3)], ["mestre", faixa === 1 ? [1] : [1, 2]]);
    if (faixa === 2) t(`${sistema}/${alvo}: fonte Mestre recebe +3 acumulado`, e3.bonus - fonte.bonus, 3);
  }

  const varias = { [ID]: [{ alvo: "fortitude", progresso: 1 }, { alvo: "astucia", progresso: 3 }, { alvo: "reflexos", progresso: 4 }] };
  const d = deriveAfty(ficha(sistema, varias));
  t(`${sistema}: instâncias distintas mantêm seus progressos`, ALVOS.map((a) => tr(d, a).prof),
    ["treinado", "mestre", null, "mestre", null]);
  t(`${sistema}: os focos somam 1 + 3 + 5`, TR.focosGastos(varias), 9);
  t(`${sistema}: instalar sem treinar não altera TR`, resumir(base),
    resumir(deriveAfty(ficha(sistema, {}, { addons: [] }))));
}

for (const [nivel, faixa, bonus] of [[8, "treinado", [1]], [13, "mestre", [1, 2]]]) {
  const opcoes = { nivel, classe: ["fortitude"] };
  const base = tr(deriveAfty(ficha("player", {}, opcoes)), "fortitude");
  const e1 = tr(deriveAfty(ficha("player", { [ID]: instancia("fortitude", 1) }, opcoes)), "fortitude");
  const e3 = tr(deriveAfty(ficha("player", { [ID]: instancia("fortitude", 3) }, opcoes)), "fortitude");
  t(`player nível ${nivel}: a Classe é fonte ${faixa}`, base.prof, faixa);
  t(`player nível ${nivel}: a 1ª soma +1 sobre a Classe`, [e1.bonus - base.bonus, parcela(e1)], [1, [1]]);
  t(`player nível ${nivel}: a 3ª respeita a faixa da Classe`, [e3.prof, parcela(e3)], ["mestre", bonus]);
}
{
  const marcado = tr(deriveAfty(ficha("player", { [ID]: instancia("vontade", 1) },
    { prof: { vontade: "treinado" } })), "vontade");
  t("player: marcar à mão não compra +1", [marcado.prof, marcado.semFonte, parcela(marcado)], ["treinado", false, []]);
  const base = deriveAfty(ficha("afty", {}, { prof: { vontade: "treinado" } }));
  const pago = deriveAfty(ficha("afty", { [ID]: instancia("vontade", 1) }, { prof: { vontade: "treinado" } }));
  t("afty: marca paga compra +1 e mantém o custo de TR",
    [tr(pago, "vontade").bonus - tr(base, "vontade").bonus, pago.testes.orcamento.resistencias],
    [1, base.testes.orcamento.resistencias]);
}

AD.aplicarAddons([pacote]);
t("normalização elimina alvo repetido e progresso zero", TR.normalizeTreinamentos({ [ID]: [
  { alvo: "vontade", progresso: 1 }, { alvo: "vontade", progresso: 4 }, { alvo: "astucia", progresso: 0 },
] }), { [ID]: instancia("vontade", 1) });
{
  const original = ficha("player", { [ID]: [{ alvo: "vontade", progresso: 3 }, { alvo: "reflexos", progresso: 1 }, { alvo: "integridade", progresso: 4 }] });
  const reimportada = mesclaFichaAfty(parseImportText(serializeExport([original])).creatures[0]);
  t("exportar e importar preserva pacote e instâncias", [reimportada.addons, reimportada.treinamentos],
    [original.addons, original.treinamentos]);
  t("exportar e importar conserva os resultados", resumir(deriveAfty(reimportada)), resumir(deriveAfty(original)));
}

t("os dois pacotes instalam juntos sem conflito", AD.aplicarAddons([pacote, anterior]).problemas, []);
t("os dois ids coexistem sem remendar a Perícia", [!!TR.getTreinamento(ID), !!TR.getTreinamento(ANTIGO), TR.getTreinamento("pericia")],
  [true, true, pericia]);
for (const sistema of ["afty", "player"]) {
  const opcoes = { addons: [pacote, anterior] };
  const d = deriveAfty(ficha(sistema, {
    [ID]: instancia("vontade", 4), [ANTIGO]: instancia("astucia", 4),
  }, opcoes));
  t(`${sistema}: novo Completo conserva 20 e o anterior reduz a margem para 18`,
    [tr(d, "vontade").prof, tr(d, "vontade").margemCritico, tr(d, "astucia").prof, tr(d, "astucia").margemCritico],
    ["mestre", 20, "mestre", 18]);
}

AD.aplicarAddons([]);
t("desinstalar retira somente a linha do addon", [TR.getTreinamento(ID), TR.AFTY_TREINAMENTOS], [null, nativas]);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
