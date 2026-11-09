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

/* A tabela de regras: as três do personagem da Guilda (2026-11-09), e nada mais. */
t("três regras da mesa", G.REGRAS_DA_MESA.map((r) => r.id), ["carteiraDaGuilda", "grauEspecialNo17", "abaPropriedades"]);
t("tabela válida", G.validarRegrasDaMesa(), []);
t("as três são só do personagem", G.REGRAS_DA_MESA.map((r) => r.sistemas), [["player"], ["player"], ["player"]]);
t("regra desconhecida é base", G.regraDaMesa({ mesa: "eradeouro" }, "qualquer"), "base");
for (const id of ["carteiraDaGuilda", "grauEspecialNo17", "abaPropriedades"]) {
  t(`${id}: personagem da Guilda`, G.regraDaMesa({ mesa: "eradeouro", rulesVersion: "player" }, id), "eradeouro");
  t(`${id}: criatura da Guilda é base`, G.regraDaMesa({ mesa: "eradeouro", rulesVersion: "afty" }, id), "base");
  t(`${id}: personagem sem mesa é base`, G.regraDaMesa({ rulesVersion: "player" }, id), "base");
}
t("rulesVersion em maiúscula ainda é personagem", G.carteiraDaGuilda({ mesa: "eradeouro", rulesVersion: "Player" }), true);

/* A CRIATURA da Guilda deriva IDÊNTICO a uma sem a marca: as regras da mesa são só do personagem. */
{
  const f = createBlankAfty();
  f.rulesVersion = "afty"; f.id = "x"; f.core.nd = 12; f.core.nivel = 12;
  const g = G.comMesa(f, "eradeouro");
  t("deriva igual com mesa (afty)", JSON.stringify(deriveAfty(g)) === JSON.stringify(deriveAfty(f)), true);
  t("sistema segue o rulesVersion (afty)", S.sistemaDaFicha(g), "afty");
}
/* O PERSONAGEM da Guilda tira o Nível do XP: sem XP nenhum é o Nível 1, mesmo com 12 digitado. */
{
  const f = createBlankAfty();
  f.rulesVersion = "player"; f.id = "x"; f.core.nd = 12; f.core.nivel = 12;
  const g = G.comMesa(f, "eradeouro");
  t("sistema segue o rulesVersion (player)", S.sistemaDaFicha(g), "player");
  t("personagem sem mesa fica no 12", deriveAfty(f).nd, 12);
  t("personagem da Guilda sem XP é Nível 1", deriveAfty(g).nd, 1);
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


/* Os addons oficiais: a lista, a trava (só na ficha com mesa) e o JSON de cada um.
   A Carteira da Guilda SAIU da lista (2026-11-09): o personagem tem a embutida. */
t("trava na ficha da Guilda", G.addonTravado({ mesa: "eradeouro" }, "cofre-de-feiticos"), true);
t("sem mesa não trava", G.addonTravado({}, "cofre-de-feiticos"), false);
t("a Carteira da Guilda não é mais oficial", G.ADDONS_OFICIAIS_IDS.includes("carteira-da-guilda"), false);
t("nem travada", G.addonTravado({ mesa: "eradeouro" }, "carteira-da-guilda"), false);
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
t("cinco oficiais", G.ADDONS_OFICIAIS_IDS.length, 5);
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

/* ============================================================ */
/* A CARTEIRA EMBUTIDA DO PERSONAGEM DA GUILDA (2026-11-09)       */
/* ============================================================ */
const AD = await import(A + "afty-addons.js");
const C = await import(A + "afty-carteira.js");
t("tabelas da Carteira da Guilda válidas", G.validarCarteiraDaGuilda(), []);

const fichaDaGuilda = (entradas, extra = {}) => ({
  ...createBlankAfty(), id: "g1", rulesVersion: "player", mesa: "eradeouro",
  carteira: { entradas, gastos: [] }, ...extra,
});
const comXp = (xp) => fichaDaGuilda([
  { id: "e1", nome: "", xp, dinheiro: 0, interludios: 0, tipo: "", guilda: { tipo: "evento", id: "personalizado" } },
]);

/* A tabela do autor ESCRITA À MÃO: Nível, XP, o "+N" e o Grau. Só o XP virou dado
   no código. O "+N" é a Maestria do derive e o Grau é o do feiticeiro, e é aqui que
   uma divergência futura entre as três colunas aparece. */
const TABELA_DO_AUTOR = [
  [1, 0, 2, "Quarto Grau"], [2, 20, 2, "Quarto Grau"], [3, 40, 2, "Quarto Grau"], [4, 60, 2, "Quarto Grau"],
  [5, 80, 3, "Terceiro Grau"], [6, 100, 3, "Terceiro Grau"], [7, 120, 3, "Terceiro Grau"], [8, 140, 3, "Terceiro Grau"],
  [9, 160, 4, "Segundo Grau"], [10, 180, 4, "Segundo Grau"], [11, 200, 4, "Segundo Grau"], [12, 220, 4, "Segundo Grau"],
  [13, 240, 5, "Primeiro Grau"], [14, 260, 5, "Primeiro Grau"], [15, 280, 5, "Primeiro Grau"], [16, 300, 5, "Primeiro Grau"],
  [17, 500, 6, "Grau Especial"], [18, 700, 6, "Grau Especial"], [19, 900, 6, "Grau Especial"], [20, 1250, 6, "Grau Especial"],
];
for (const [nivel, xp, bt, grau] of TABELA_DO_AUTOR) {
  const d = deriveAfty(comXp(xp));
  t(`${xp} de XP é o Nível ${nivel}`, d.nd, nivel);
  t(`o Nível ${nivel} tem +${bt}`, d.maestria, bt);
  t(`o Nível ${nivel} é ${grau}`, d.grauFeiticeiro.label, grau);
  t(`nivelDaFicha concorda no ${nivel}`, AD.nivelDaFicha(comXp(xp)), nivel);
  if (xp > 0) t(`um centavo antes do ${nivel} ainda é o ${nivel - 1}`, AD.nivelDaFicha(comXp(xp - 0.01)), nivel - 1);
}
t("acima de 1250 fica no 20", AD.nivelDaFicha(comXp(99999)), 20);
t("o extrato mostra o mesmo nível", deriveAfty(comXp(220)).carteira.nivel, 12);
t("o extrato diz o próximo degrau", deriveAfty(comXp(300)).carteira.proximo, { nivel: 17, xp: 500, falta: 200 });
t("no 20 não há próximo", deriveAfty(comXp(1250)).carteira.proximo, null);
const ext0 = deriveAfty(comXp(0)).carteira;
t("o extrato sabe que é da Guilda", [ext0.guilda, ext0.alimentaNivel, ext0.alimentaFocos], [true, true, true]);
const g17 = deriveAfty(comXp(500)).grauFeiticeiro;
t("o Grau Especial da Guilda é só o nome", [g17.value, g17.rank, g17.ordem], ["semiEspecial", 5, 5]);

/* Equivalência: o Nível 12 pelo XP deriva IGUAL ao Nível 12 digitado, fora o extrato.
   E a contraprova, senão dois derives iguais por acaso passariam. */
const semExtrato = (d) => JSON.stringify({ ...d, carteira: null });
const digitado = { ...createBlankAfty(), id: "g1", rulesVersion: "player" };
digitado.core = { ...digitado.core, nd: 12 };
t("o XP da Guilda vale o mesmo que o nível digitado", semExtrato(deriveAfty(comXp(220))) === semExtrato(deriveAfty(digitado)), true);
t("contraprova: o Nível 1 não é o 12", semExtrato(deriveAfty(comXp(0))) === semExtrato(deriveAfty(digitado)), false);

/* Contraprovas: fora da Guilda o XP não manda, e a criatura da Guilda segue o ND. */
const foraDaGuilda = { ...comXp(500) };
delete foraDaGuilda.mesa;
foraDaGuilda.core = { ...foraDaGuilda.core, nd: 17 };
t("fora da Guilda o XP não manda", deriveAfty({ ...foraDaGuilda, core: { ...foraDaGuilda.core, nd: 3 } }).nd, 3);
t("fora da Guilda o 17 é Semi-Grau Especial", deriveAfty(foraDaGuilda).grauFeiticeiro.label, "Semi-Grau Especial");
const criaturaDaGuilda = { ...comXp(500), rulesVersion: "afty" };
criaturaDaGuilda.core = { ...criaturaDaGuilda.core, nd: 17 };
t("a criatura da Guilda segue o ND digitado", deriveAfty(criaturaDaGuilda).nd, 17);
t("e o nome do Afty no 17", deriveAfty(criaturaDaGuilda).grauFeiticeiro.label, "Semi-Grau Especial");
t("e sem a Carteira da Guilda", deriveAfty(criaturaDaGuilda).carteira.guilda, false);

/* As linhas que a Missão e o Evento preenchem. O Fim de Semana multiplica SÓ o XP, e quebrado. */
t("Fácil", G.linhaDaGuilda("missao", "facil"),
  { nome: "", xp: 1, dinheiro: 100, interludios: 0, tipo: "", guilda: { tipo: "missao", id: "facil" } });
t("Fácil no Fim de Semana", G.linhaDaGuilda("missao", "facil", true),
  { nome: "", xp: 1.5, dinheiro: 100, interludios: 0, tipo: "", guilda: { tipo: "missao", id: "facil", fimDeSemana: true } });
const numeros = (l) => [l.xp, l.dinheiro, l.interludios];
t("Médio", numeros(G.linhaDaGuilda("missao", "medio")), [3, 200, 0]);
t("Médio no Fim de Semana", G.linhaDaGuilda("missao", "medio", true).xp, 4.5);
t("Difícil", numeros(G.linhaDaGuilda("missao", "dificil")), [5, 350, 0]);
t("Difícil no Fim de Semana", G.linhaDaGuilda("missao", "dificil", true).xp, 7.5);
t("Extremo", numeros(G.linhaDaGuilda("missao", "extremo")), [10, 800, 1]);
t("Extremo no Fim de Semana", numeros(G.linhaDaGuilda("missao", "extremo", true)), [15, 800, 1]);
t("só a Extrema dá Foco", G.MISSOES_ERA_DE_OURO.map((m) => m.focos), [0, 0, 0, 1]);
t("Semanal", numeros(G.linhaDaGuilda("evento", "semanal")), [20, 1500, 2]);
t("Semanal no Fim de Semana", numeros(G.linhaDaGuilda("evento", "semanal", true)), [30, 1500, 2]);
t("Lendário", numeros(G.linhaDaGuilda("evento", "lendario")), [200, 4000, 4]);
t("Lendário no Fim de Semana", G.linhaDaGuilda("evento", "lendario", true).xp, 300);
t("Personalizado nasce zerado", numeros(G.linhaDaGuilda("evento", "personalizado")), [0, 0, 0]);
t("Missão desconhecida", G.linhaDaGuilda("missao", "x"), null);
t("tipo desconhecido", G.linhaDaGuilda("sessao", "facil"), null);
t("a Missão é travada", G.linhaTravada({ tipo: "missao", id: "facil" }), true);
t("o Evento não", G.linhaTravada({ tipo: "evento", id: "semanal" }), false);
t("Missão que sumiu da tabela destrava", G.linhaTravada({ tipo: "missao", id: "velha" }), false);
t("rótulos da linha",
  [G.rotuloDaLinhaDaGuilda({ tipo: "missao", id: "medio" }), G.rotuloDaLinhaDaGuilda({ tipo: "evento", id: "lendario" }), G.rotuloDaLinhaDaGuilda(undefined)],
  ["Missão Média", "Evento Lendário", null]);

/* O extrato soma as linhas lançadas, e os Focos de Interlúdio viram o orçamento de Focos. */
const lancadas = [
  { id: "m1", ...G.linhaDaGuilda("missao", "extremo") },
  { id: "m2", ...G.linhaDaGuilda("missao", "facil", true) },
  { id: "e1", ...G.linhaDaGuilda("evento", "semanal", true) },
];
const dl = deriveAfty(fichaDaGuilda(lancadas));
t("XP somado com o Fim de Semana quebrado", dl.carteira.xpTotal, 41.5);
t("Ichibuban somados", dl.carteira.ganho, 2400);
t("Focos de Interlúdio viram o orçamento de Focos", dl.focosTotais, 3);
t("41,5 de XP é o Nível 3", dl.nd, 3);
t("treze Fáceis no Fim de Semana ainda não dão o Nível 2", AD.nivelDaFicha(fichaDaGuilda(
  Array.from({ length: 13 }, (_, i) => ({ id: `f${i}`, ...G.linhaDaGuilda("missao", "facil", true) })))), 1);

/* O saneador da Carteira carrega a marca, larga a torta, e a marca não vira aviso de tipo. */
const extM = C.resolveCarteira({ carteira: { entradas: [
  { id: "a", ...G.linhaDaGuilda("missao", "facil", true) },
  { id: "b", xp: 2, guilda: { tipo: 3 } },
] } });
t("o saneador guarda a marca", extM.entradas[0].guilda, { tipo: "missao", id: "facil", fimDeSemana: true });
t("e larga a marca torta", "guilda" in extM.entradas[1], false);
t("a marca não vira aviso de tipo", extM.avisos, []);
t("sem a tabela da Guilda o extrato não é da Guilda", extM.guilda, false);

/* O filtro da lista da Guilda é pela marca (Missões, Eventos), e o do addon segue o tipo. */
const mistura = [{ id: "a", guilda: { tipo: "missao", id: "facil" } }, { id: "b", guilda: { tipo: "evento", id: "semanal" } }, { id: "c", tipo: "jogada" }];
const porMarca = (tipo) => C.filtraLinhasCarteira(mistura, { tipo, tipos: G.FILTROS_DA_GUILDA, tipoDe: (l) => l?.guilda?.tipo }).map((l) => l.id);
t("filtro Missões", porMarca("missao"), ["a"]);
t("filtro Eventos", porMarca("evento"), ["b"]);
t("filtro Todos", porMarca("todos"), ["a", "b", "c"]);
t("sem tipoDe o filtro segue o tipo", C.filtraLinhasCarteira(mistura, { tipo: "jogada" }).map((l) => l.id), ["c"]);

/* A ficha da Guilda que nasceu com o addon Carteira da Guilda: a tabela da mesa vence a dele. */
const carteiraAntiga = normalizarPacote(JSON.parse(readFileSync(new URL("../addons/carteira-da-guilda.json", import.meta.url), "utf8")));
const comAddonAntigo = { ...comXp(10), addons: [carteiraAntiga] };
t("com o addon antigo, a tabela da Guilda vence", AD.nivelDaFicha(comAddonAntigo), 1);
const addonForaDaGuilda = { ...comAddonAntigo };
delete addonForaDaGuilda.mesa;
t("fora da Guilda o addon segue a tabela dele", AD.nivelDaFicha(addonForaDaGuilda), 4);

/* As abas: a Carteira abre também pela mesa, e a Propriedades só por ela. */
const builder = readFileSync(new URL("../src/systems/afty/AftyCreatureBuilder.jsx", import.meta.url), "utf8");
t("a aba Carteira abre também pela mesa",
  /\{ id: "carteira",\s+label: "Carteira", primitiva: "carteira", mesa: "carteiraDaGuilda" \}/.test(builder), true);
t("a aba Propriedades abre só pela mesa",
  /\{ id: "propriedades",\s+label: "Propriedades", mesa: "abaPropriedades" \}/.test(builder), true);
t("e a aba Propriedades é desenhada", builder.includes('tabAtiva === "propriedades"'), true);
const oficiaisFonte = readFileSync(new URL("../src/systems/eradeouro/pacotes-oficiais.js", import.meta.url), "utf8");
t("os oficiais não carregam mais a Carteira da Guilda", oficiaisFonte.includes("carteira-da-guilda.json"), false);

const textosDaGuilda = JSON.stringify([G.MISSOES_ERA_DE_OURO, G.EVENTOS_ERA_DE_OURO, G.FILTROS_DA_GUILDA, G.MOEDA_ERA_DE_OURO]);
t("textos da Carteira da Guilda sem travessão nem ponto e vírgula", new RegExp("[\u2014;]").test(textosDaGuilda), false);

if (bad.length) {
  console.error(`FALHARAM ${bad.length}:\n` + bad.join("\n"));
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
