/* AS PREFERÊNCIAS DA FICHA QUE MORAM NO PERSONAGEM (integração do G2, 2026-10-17).

   `creature.preferenciasFicha.estatisticasCabecalho` = { versao, ordem, ocultas }. É do PERSONAGEM (viaja no export e no import, sobrevive a editar no
   criador) e só de APRESENTAÇÃO: nenhum valor, fonte ou regra muda. Aqui: a normalização (padrão quando não configurado, lixo descartado, ids repetidos
   removidos, ids ausentes ignorados na tela e mantidos, ids novos acrescentados, Restaurar Padrão), o campo do personagem (preserva os outros
   subcampos), a lista de estatísticas (os MESMOS ids de sempre, que são gancho de tema) e a viagem pelo export e pelo import. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty, mesclaFichaAfty } = await import(R + "afty-schema.js");
const E = await import(R + "ficha/efeitos/estatisticas.js");
const P = await import(R + "ficha/ficha-preferencias.js");
const IO = await import(new URL("../src/components/io-utils.js", import.meta.url).href);

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ---------- a lista de estatísticas: os ids de sempre ---------- */
const ficha = createBlankAfty();
ficha.core = { ...ficha.core, nd: 12, tipo: "misto", patamar: "desafio" };
const derived = deriveAfty({ ...ficha, combate: { ativo: false } });
const stats = E.statsDaFicha(derived);
const ids = stats.map((s) => s.id);
t("começa por Defesa, CD e RD Geral, como a Ficha sempre mostrou", ids.slice(0, 3), ["defesa", "cd", "rd-geral"]);
t("termina em Movimento, Iniciativa, Atenção e Maestria", ids.slice(-4), ["movimento", "iniciativa", "atencao", "maestria"]);
t("o Preparo não é estatística (é recurso que se gasta)", ids.includes("preparo"), false);
t("os ids não se repetem", new Set(ids).size, ids.length);
t("cada estatística tem rótulo e valor", stats.every((s) => typeof s.k === "string" && s.k && s.v != null), true);
t("Iniciativa e Maestria vêm com sinal", [stats.find((s) => s.id === "iniciativa").v, stats.find((s) => s.id === "maestria").v].every((v) => /^[+−]/.test(String(v))), true);
t("só a RD que existe aparece (RD Física some quando é 0)", ids.includes("rd-fisica") === (derived.rdFisico > 0), true);

/* ---------- normalização ---------- */
t("nunca configurou: vale a apresentação de sempre", E.aplicaPreferencia(stats, null).padrao, true);
t("nunca configurou: todas visíveis, na ordem de sempre", E.aplicaPreferencia(stats, undefined).visiveis.map((s) => s.id), ids);
t("lixo (texto, número, lista, objeto vazio) vale como nunca configurou", ["x", 3, [], {}, { ordem: "a", ocultas: 5 }, { ordem: [1, {}], ocultas: [null] }].map((x) => E.normalizaPreferencia(x)), [null, null, null, null, null, null]);
t("a preferência válida ganha a versão", E.normalizaPreferencia({ ordem: ["cd"], ocultas: [] }), { versao: 1, ordem: ["cd"], ocultas: [] });
t("ids repetidos removidos", E.normalizaPreferencia({ ordem: ["cd", "cd", "defesa"], ocultas: ["cd", "cd"] }), { versao: 1, ordem: ["cd", "defesa"], ocultas: ["cd"] });
t("o que não é texto é descartado", E.normalizaPreferencia({ ordem: ["cd", 4, null, { a: 1 }], ocultas: [] }).ordem, ["cd"]);
t("id grande demais é descartado", E.normalizaPreferencia({ ordem: ["x".repeat(41), "cd"], ocultas: [] }).ordem, ["cd"]);

/* ids ausentes: ignorados na tela, mantidos para voltar */
const comAusente = E.aplicaPreferencia(stats, { ordem: ["fantasma", "maestria", "defesa"], ocultas: [] });
t("id que a ficha não tem é ignorado na tela", comAusente.todas.some((s) => s.id === "fantasma"), false);
t("a ordem guardada manda, e o resto entra no fim", comAusente.todas.slice(0, 2).map((s) => s.id), ["maestria", "defesa"]);
t("estatística nova (que a preferência nunca viu) entra no fim, visível, sem duplicar", [comAusente.todas.length, comAusente.todas.at(-1).visivel], [ids.length, true]);
const movido = E.move(stats, { ordem: ["fantasma", "defesa", "cd"], ocultas: [] }, "defesa", 1);
t("mover mantém o id ausente onde estava", movido.ordem.slice(0, 3), ["fantasma", "cd", "defesa"]);

/* ocultar: nunca recoloca no "+N" */
const oculta = E.alternaVisivel(stats, null, "cd");
t("ocultar guarda a escolha", oculta.ocultas, ["cd"]);
t("o ocultado não está entre os visíveis (então nunca vira excesso de largura)", E.aplicaPreferencia(stats, oculta).visiveis.some((s) => s.id === "cd"), false);
t("a configuração ainda lista o ocultado (para mostrar de novo)", E.aplicaPreferencia(stats, oculta).todas.find((s) => s.id === "cd")?.visivel, false);
t("mostrar de novo tira da lista de ocultas", E.alternaVisivel(stats, oculta, "cd")?.ocultas ?? [], []);
t("mover pelas bordas não muda nada", E.move(stats, null, "defesa", -1), null);
t("Restaurar Padrão apaga a preferência", E.restauraPadrao(), null);
const foto = JSON.stringify(oculta);
E.aplicaPreferencia(stats, oculta);
E.move(stats, oculta, "cd", 1);
E.alternaVisivel(stats, oculta, "defesa");
t("as funções não alteram a preferência que recebem", JSON.stringify(oculta), foto);

/* ---------- o campo do personagem ---------- */
t("o personagem em branco nasce sem preferência", createBlankAfty().preferenciasFicha, null);
t("a criatura sem o campo (antiga) lê como nunca configurou", [P.preferenciasDaFicha({}), P.estatisticasDoCabecalho({})], [{}, null]);
t("lixo no campo não derruba a leitura", [P.preferenciasDaFicha({ preferenciasFicha: "x" }), P.estatisticasDoCabecalho({ preferenciasFicha: { estatisticasCabecalho: 7 } })], [{}, null]);
const gravada = P.comEstatisticasDoCabecalho(null, { ordem: ["cd", "defesa"], ocultas: ["maestria"] });
t("gravar cria o campo com a versão", gravada, { estatisticasCabecalho: { versao: 1, ordem: ["cd", "defesa"], ocultas: ["maestria"] } });
const comOutros = { outraCoisa: { a: 1 }, estatisticasCabecalho: { versao: 1, ordem: ["cd"], ocultas: [] } };
t("gravar preserva os outros subcampos", P.comEstatisticasDoCabecalho(comOutros, { ordem: ["defesa"], ocultas: [] }), { outraCoisa: { a: 1 }, estatisticasCabecalho: { versao: 1, ordem: ["defesa"], ocultas: [] } });
t("Restaurar Padrão tira só o subcampo e preserva o resto", P.comEstatisticasDoCabecalho(comOutros, null), { outraCoisa: { a: 1 } });
t("sem mais nenhum subcampo o campo todo volta a nulo", P.comEstatisticasDoCabecalho({ estatisticasCabecalho: { versao: 1, ordem: ["cd"], ocultas: [] } }, null), null);
t("a entrada não é alterada", comOutros, { outraCoisa: { a: 1 }, estatisticasCabecalho: { versao: 1, ordem: ["cd"], ocultas: [] } });

/* ---------- viagem: salvar, editar no criador, exportar, importar, dois sistemas ---------- */
for (const sistema of ["afty", "player"]) {
  const c = createBlankAfty();
  c.id = `pref-${sistema}`;
  c.name = `Preferência ${sistema}`;
  c.rulesVersion = sistema;
  c.preferenciasFicha = gravada;
  /* O criador mescla a criatura que abriu (`mesclaFichaAfty`) e salva o resultado: o campo que ele não conhece fica como estava. */
  t(`${sistema}: o criador preserva o campo ao mesclar e salvar`, mesclaFichaAfty(c).preferenciasFicha, gravada);
  const texto = IO.serializeExport([c]);
  const volta = IO.parseImportText(texto);
  const criatura = (volta.creatures ?? volta)[0];
  t(`${sistema}: exportar e importar leva a preferência`, criatura.preferenciasFicha, gravada);
  t(`${sistema}: e a rota (o sistema) não muda por causa dela`, [criatura.rulesVersion, P.estatisticasDoCabecalho(criatura)], [sistema, { versao: 1, ordem: ["cd", "defesa"], ocultas: ["maestria"] }]);
  const d = deriveAfty({ ...mesclaFichaAfty(criatura), combate: { ativo: false } });
  const sem = E.aplicaPreferencia(E.statsDaFicha(d), P.estatisticasDoCabecalho(criatura));
  t(`${sistema}: a preferência só muda a apresentação (a ordem e a visibilidade)`, [sem.visiveis.slice(0, 2).map((s) => s.id), sem.visiveis.some((s) => s.id === "maestria")], [["cd", "defesa"], false]);
}
t("a preferência de um personagem não vaza para o outro", [P.estatisticasDoCabecalho({ preferenciasFicha: gravada }), P.estatisticasDoCabecalho({})].map((x) => x === null), [false, true]);

console.log(bad.length ? `FALHAS (${bad.length}):\n${bad.join("\n")}` : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
