/* A rota /EraDeOuro: a mesa da Guilda e o isolamento do armazenamento. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
const A = new URL("../src/systems/afty/", import.meta.url).href;
const E = new URL("../src/systems/eradeouro/", import.meta.url).href;
const { deriveAfty } = await import(A + "afty-derive.js");
const { createBlankAfty } = await import(A + "afty-schema.js");
const S = await import(A + "afty-sistema.js");
const B = await import(A + "encontros/fundamento-biblioteca.js");
const G = await import(E + "era-de-ouro.js");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

/* A rota, sem diferenciar maiúscula, com ou sem barra final. */
t("rota /EraDeOuro", G.ehRotaEraDeOuro("/EraDeOuro"), true);
t("rota /eradeouro/", G.ehRotaEraDeOuro("/eradeouro/"), true);
t("rota /ERADEOURO", G.ehRotaEraDeOuro("/ERADEOURO"), true);
t("rota /EraDeOuro/x não", G.ehRotaEraDeOuro("/EraDeOuro/x"), false);
t("rota /Afty não", G.ehRotaEraDeOuro("/Afty"), false);
t("rota vazia", G.ehRotaEraDeOuro(undefined), false);

/* A mesa NÃO é sistema: ninguém grava "eradeouro" no rulesVersion. */
t("eradeouro não está em SISTEMAS", S.SISTEMA_IDS.includes("eradeouro"), false);
t("sistemaGravado recusa eradeouro", S.sistemaGravado({ rulesVersion: "eradeouro" }), null);
t("mesaDaFicha lê o campo", G.mesaDaFicha({ mesa: "eradeouro" }), "eradeouro");
t("mesaDaFicha sem campo", G.mesaDaFicha({}), null);
t("mesaDaFicha lixo", G.mesaDaFicha({ mesa: "outra" }), null);
t("comMesa carimba e não troca o sistema", G.comMesa({ rulesVersion: "player" }, "eradeouro"),
  { rulesVersion: "player", mesa: "eradeouro" });
t("comMesa sem mesa não mexe", G.comMesa({ rulesVersion: "afty" }, null), { rulesVersion: "afty" });

/* A tabela de regras começa vazia, e vazia nada desvia. */
t("tabela vazia", G.REGRAS_DA_MESA.length, 0);
t("tabela válida", G.validarRegrasDaMesa(), []);
t("regra desconhecida é base", G.regraDaMesa({ mesa: "eradeouro" }, "qualquer"), "base");

/* Uma ficha da Guilda deriva IDÊNTICO a uma sem a marca, nos dois sistemas. */
for (const sistema of ["afty", "player"]) {
  const f = createBlankAfty();
  f.rulesVersion = sistema; f.id = "x"; f.core.nd = 12; f.core.nivel = 12;
  const g = G.comMesa(f, "eradeouro");
  t(`deriva igual com mesa (${sistema})`, JSON.stringify(deriveAfty(g)) === JSON.stringify(deriveAfty(f)), true);
  t(`sistema segue o rulesVersion (${sistema})`, S.sistemaDaFicha(g), sistema);
}

/* O vocabulário e as palavras neutras da lista que mistura os dois tipos. */
const v = G.vocabularioDeFichas();
t("vocab nova", v.nova, "Nova Ficha");
t("vocab contagem 1", v.contagem(1), "1 ficha");
t("vocab contagem 3", v.contagem(3), "3 fichas");
t("vocab importadas", v.importadas(2), "2 fichas importadas com sucesso.");
const p = S.palavrasDoSistema("ficha");
t("palavras ficha", [p.nome, p.Plural, p.g("Nenhum", "Nenhuma")], ["ficha", "Fichas", "Nenhuma"]);
t("palavras afty intactas", S.palavrasDoSistema("afty").nome, "criatura");
t("palavras player intactas", S.palavrasDoSistema("player").nome, "personagem");
const texto = JSON.stringify(v) + JSON.stringify(Object.values(G.ERA_DE_OURO));
t("sem travessão nem ponto e vírgula na UI", /[—;]/.test(texto), false);

/* O Fundamento perdido grava na biblioteca da ROTA, e não na do sistema da ficha. */
const memoria = (inicial) => {
  const m = new Map(Object.entries(inicial));
  return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, val) => { m.set(k, val); } };
};
const ficha = { id: "c1", name: "Ana", rulesVersion: "player", fundamentosPerdidos: [{ invocacaoId: "i1" }] };
const comb = [{ criaturaId: "c1", nome: "Ana", ficha }];
const guilda = memoria({
  fm_creatures_eradeouro_v1: JSON.stringify([{ id: "c1", name: "Ana", rulesVersion: "player" }]),
  fm_creatures_player_v1: JSON.stringify([{ id: "c1", name: "Ana", rulesVersion: "player" }]),
});
const r = B.sincronizarFundamentosNaBiblioteca(comb, guilda, "eradeouro");
t("grava na biblioteca da Guilda", r.gravadas.length, 1);
t("devolve o namespace", r.gravadas[0]?.namespace, "eradeouro");
t("a da Guilda ganhou a perda", JSON.parse(guilda.m.get("fm_creatures_eradeouro_v1"))[0].fundamentosPerdidos?.length, 1);
t("a do Player ficou intacta", JSON.parse(guilda.m.get("fm_creatures_player_v1"))[0].fundamentosPerdidos, undefined);
const sem = memoria({ fm_creatures_player_v1: JSON.stringify([{ id: "c1", name: "Ana", rulesVersion: "player" }]) });
const r2 = B.sincronizarFundamentosNaBiblioteca(comb, sem);
t("sem namespace segue o sistema", r2.gravadas[0]?.namespace, undefined);
t("sem namespace grava no Player", JSON.parse(sem.m.get("fm_creatures_player_v1"))[0].fundamentosPerdidos?.length, 1);


/* Os addons oficiais: a lista, a trava (só na ficha com mesa) e o JSON de cada um. */
t("trava na ficha da Guilda", G.addonTravado({ mesa: "eradeouro" }, "carteira-da-guilda"), true);
t("sem mesa não trava", G.addonTravado({}, "carteira-da-guilda"), false);
t("addon de fora não trava", G.addonTravado({ mesa: "eradeouro" }, "alma-do-afty"), false);
const { readFileSync } = await import("node:fs");
const { normalizarPacote } = await import(A + "afty-addons.js");
for (const id of G.ADDONS_OFICIAIS_IDS.filter((x) => !["atencao-so-percepcao", "pericias-era-de-ouro"].includes(x))) {
  const cru = JSON.parse(readFileSync(new URL("../addons/" + id + ".json", import.meta.url), "utf8"));
  t("json oficial " + id, normalizarPacote(cru).id, id);
}
const atencao = normalizarPacote(JSON.parse(JSON.stringify(G.PACOTE_ATENCAO_SO_PERCEPCAO)));
t("atencao liga a regra", atencao.regrasAfty?.atencaoSoPercepcao, true);

/* As perícias Guerra e Nobreza, vindas do pacote para dentro da ficha. */
const P = await import(A + "afty-pericias.js");
const { aplicarAddons } = await import(A + "afty-addons.js");
aplicarAddons([]);
t("seis oficiais", G.ADDONS_OFICIAIS_IDS.length, 6);
const pacP = normalizarPacote(JSON.parse(JSON.stringify(G.PACOTE_PERICIAS_ERA_DE_OURO)));
t("pacote guarda as duas perícias", pacP.pericias.map((x) => x.id), ["guerra", "nobreza"]);
const fp = { ...createBlankAfty(), id: "p1", rulesVersion: "player", mesa: "eradeouro", addons: [pacP] };
const cat = P.catalogoPericiasDaFicha(fp);
const guerra = cat.find((x) => x.nome === "Guerra");
const nobreza = cat.find((x) => x.nome === "Nobreza");
t("Guerra é de Inteligência", guerra?.atributo, "inteligencia");
t("Nobreza padrão Inteligência", nobreza?.atributo, "inteligencia");
t("Nobreza aceita INT ou PRE", nobreza?.atributosPermitidos, ["inteligencia", "presenca"]);
t("Guerra sem lista de troca", guerra?.atributosPermitidos, undefined);
t("não são personalizadas editáveis", [guerra?.personalizada, nobreza?.personalizada], [undefined, undefined]);
t("lista segue par", cat.length % 2, 0);
t("ficha sem o pacote não tem", P.catalogoPericiasDaFicha({ ...fp, addons: [] }).some((x) => x.nome === "Guerra"), false);
const d0 = deriveAfty({ ...fp, addons: [] });
const d1 = deriveAfty(fp);
const linha = (d, nome) => d.testes?.pericias?.find((x) => x.nome === nome);
t("Guerra aparece nos testes", !!linha(d1, "Guerra"), true);
t("Nobreza aparece nos testes", !!linha(d1, "Nobreza"), true);
const nobPre = deriveAfty({ ...fp, periciaAtributoManual: { [nobreza.id]: "presenca" } });
t("Nobreza troca para Presença", linha(nobPre, "Nobreza")?.atributo, "presenca");
t("as outras perícias não mudam", JSON.stringify(d0.testes.pericias.map((x) => [x.id, x.total])) === JSON.stringify(d1.testes.pericias.filter((x) => !/^custom_/.test(x.id)).map((x) => [x.id, x.total])), true);

if (bad.length) {
  console.error(`FALHARAM ${bad.length}:\n` + bad.join("\n"));
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
