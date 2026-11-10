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
const CP = await import(A + "afty-addons-compostos.js");
const { aplicarAddons } = await import(A + "afty-addons.js");
/* Como o criador e a Ficha fazem: o mundo recebe os addons da ficha, nativos inclusive. */
const derivarNoMundo = (f) => { aplicarAddons(CP.addonsDaFicha(f)); return deriveAfty(f); };

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

/* A tabela de regras: três do personagem da Guilda e três da Guilda inteira (2026-11-09). */
t("as regras da mesa", G.REGRAS_DA_MESA.map((r) => r.id), [
  "carteiraDaGuilda", "grauEspecialNo17", "abaPropriedades", "limiteDeAcessorios", "treinoDeTrDuasVezes", "maldicaoDaGuilda",
]);
t("tabela válida", G.validarRegrasDaMesa(), []);
t("as três primeiras são só do personagem, e as outras valem nos dois",
  G.REGRAS_DA_MESA.map((r) => r.sistemas ?? null), [["player"], ["player"], ["player"], null, null, null]);
t("regra desconhecida é base", G.regraDaMesa({ mesa: "eradeouro" }, "qualquer"), "base");
for (const id of ["carteiraDaGuilda", "grauEspecialNo17", "abaPropriedades"]) {
  t(`${id}: personagem da Guilda`, G.regraDaMesa({ mesa: "eradeouro", rulesVersion: "player" }, id), "eradeouro");
  t(`${id}: criatura da Guilda é base`, G.regraDaMesa({ mesa: "eradeouro", rulesVersion: "afty" }, id), "base");
  t(`${id}: personagem sem mesa é base`, G.regraDaMesa({ rulesVersion: "player" }, id), "base");
}
for (const id of ["limiteDeAcessorios", "treinoDeTrDuasVezes", "maldicaoDaGuilda"]) {
  t(`${id}: personagem da Guilda`, G.regraDaMesa({ mesa: "eradeouro", rulesVersion: "player" }, id), "eradeouro");
  t(`${id}: criatura da Guilda`, G.regraDaMesa({ mesa: "eradeouro", rulesVersion: "afty" }, id), "eradeouro");
  t(`${id}: sem mesa é base`, G.regraDaMesa({ rulesVersion: "afty" }, id), "base");
}
t("rulesVersion em maiúscula ainda é personagem", G.carteiraDaGuilda({ mesa: "eradeouro", rulesVersion: "Player" }), true);

/* A CRIATURA da Guilda deriva IGUAL a uma criatura de fora com os MESMOS pacotes: o que a
   Guilda muda nela são os nativos, e nenhuma regra de personagem. */
{
  const f = createBlankAfty();
  f.rulesVersion = "afty"; f.id = "x"; f.core.nd = 12; f.core.nivel = 12;
  const g = G.comMesa(f, "eradeouro");
  const foraComOsMesmos = { ...f, addons: CP.hidratarFicha(g).addons };
  /* O limite de Acessórios é regra da mesa, e é a única diferença: vai à parte. */
  const semLimite = (d) => JSON.stringify({ ...d, equip: { ...d.equip, acessorios: null } });
  t("deriva igual com mesa (afty)", semLimite(derivarNoMundo(g)) === semLimite(derivarNoMundo(foraComOsMesmos)), true);
  t("e o limite de Acessórios é o da Guilda", [derivarNoMundo(g).equip.acessorios.limite, derivarNoMundo(foraComOsMesmos).equip.acessorios.limite], [4, null]);
  t("contraprova: sem os nativos deriva diferente", semLimite(derivarNoMundo(g)) === semLimite(derivarNoMundo(f)), false);
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


/* Os pacotes NATIVOS da Guilda (2026-11-09). Substituem os addons oficiais, que nasciam
   como cópia congelada, ligados e travados. A Carteira da Guilda não está entre eles. */
const { readFileSync, existsSync } = await import("node:fs");
const { normalizarPacote, validarPacote, addonsVisiveisDaCriatura } = await import(A + "afty-addons.js");
const lerPacote = (id) => JSON.parse(readFileSync(new URL("../addons/" + id + ".json", import.meta.url), "utf8"));
t("os oito nativos, na ordem", G.NATIVOS_DA_GUILDA_IDS, [
  "regras-grimorio", "cofre-de-feiticos", "alma-livre", "atencao-so-percepcao", "pericias-era-de-ouro",
  "treino-testes-de-resistencia", "regras-da-era-de-ouro", "maldicao-era-de-ouro",
]);
t("a Carteira da Guilda não é nativa", G.NATIVOS_DA_GUILDA_IDS.includes("carteira-da-guilda"), false);
t("nativo na ficha da Guilda", G.addonNativo({ mesa: "eradeouro" }, "cofre-de-feiticos"), true);
t("sem mesa não é nativo", G.addonNativo({}, "cofre-de-feiticos"), false);
t("addon de fora não é nativo", G.addonNativo({ mesa: "eradeouro" }, "alma-do-afty"), false);
t("os addons oficiais saíram", ["ADDONS_OFICIAIS_IDS", "addonTravado"].filter((k) => k in G), []);
t("o pacotes-oficiais.js saiu", existsSync(new URL("../src/systems/eradeouro/pacotes-oficiais.js", import.meta.url)), false);
const atencao = normalizarPacote(JSON.parse(JSON.stringify(G.PACOTE_ATENCAO_SO_PERCEPCAO)));
t("atencao liga a regra", atencao.regrasAfty?.atencaoSoPercepcao, true);

/* A hidratação põe os nativos na ficha da Guilda, criatura e personagem, e só nela. */
const guildaP = { ...createBlankAfty(), id: "n1", rulesVersion: "player", mesa: "eradeouro" };
const guildaC = { ...createBlankAfty(), id: "n2", rulesVersion: "afty", mesa: "eradeouro" };
const foraDaMesa = { ...createBlankAfty(), id: "n3", rulesVersion: "player" };
const idsHidratados = (f) => (CP.hidratarFicha(f).addons ?? []).map((p) => p.id);
t("o personagem da Guilda ganha os nativos", idsHidratados(guildaP), G.NATIVOS_DA_GUILDA_IDS);
t("a criatura da Guilda também", idsHidratados(guildaC), G.NATIVOS_DA_GUILDA_IDS);
t("fora da Guilda nada entra", idsHidratados(foraDaMesa), []);
t("a mesma ficha devolve a mesma hidratação", CP.hidratarFicha(guildaP) === CP.hidratarFicha(guildaP), true);
t("hidratar o hidratado não muda nada", CP.hidratarFicha(CP.hidratarFicha(guildaP)) === CP.hidratarFicha(guildaP), true);
t("a régua do criador também os tem", CP.hidratarNativos(guildaP).addons.length, G.NATIVOS_DA_GUILDA_IDS.length);
for (const p of CP.hidratarFicha(guildaP).addons) t(`o nativo ${p.id} é um pacote válido`, validarPacote(p), []);
{
  /* A ficha que nasceu com os oficiais (cópia congelada) e com o addon que a pessoa ligou. */
  const velha = { ...guildaP, addons: [
    { ...normalizarPacote(lerPacote("cofre-de-feiticos")), versao: "0.0.1" },
    normalizarPacote(lerPacote("carteira-da-guilda")),
  ] };
  const hv = CP.hidratarFicha(velha).addons;
  t("a cópia velha do nativo sai, e a em dia entra", hv.filter((p) => p.id === "cofre-de-feiticos").map((p) => p.versao),
    [lerPacote("cofre-de-feiticos").versao]);
  t("os nativos ficam na frente", hv.slice(0, G.NATIVOS_DA_GUILDA_IDS.length).map((p) => p.id), G.NATIVOS_DA_GUILDA_IDS);
  t("o addon que a ficha escolheu fica", hv.at(-1)?.id, "carteira-da-guilda");
  t("a marca da Ficha mostra só o escolhido", addonsVisiveisDaCriatura(velha).map((p) => p.id), ["carteira-da-guilda"]);
}

/* As perícias Guerra e Nobreza, vindas do pacote para dentro da ficha. */
const P = await import(A + "afty-pericias.js");
aplicarAddons([]);
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
/* Com e sem o pacote, numa ficha FORA da Guilda: dentro dela as duas são nativas. */
const fpFora = { ...fp };
delete fpFora.mesa;
const d0 = deriveAfty({ ...fpFora, addons: [] });
const d1 = deriveAfty(fpFora);
const linha = (d, nome) => d.testes?.pericias?.find((x) => x.nome === nome);
t("na Guilda as duas vêm nativas, mesmo sem o pacote na lista", !!linha(deriveAfty({ ...fp, addons: [] }), "Guerra"), true);
t("Guerra aparece nos testes", !!linha(d1, "Guerra"), true);
t("Nobreza aparece nos testes", !!linha(d1, "Nobreza"), true);
const nobPre = deriveAfty({ ...fp, periciaAtributoManual: { [nobreza.id]: "presenca" } });
t("Nobreza troca para Presença", linha(nobPre, "Nobreza")?.atributo, "presenca");
t("as outras perícias não mudam", JSON.stringify(d0.testes.pericias.map((x) => [x.id, x.bonus])) === JSON.stringify(d1.testes.pericias.filter((x) => !/^custom_/.test(x.id)).map((x) => [x.id, x.bonus])), true);

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
// O limite de Acessórios também é regra da mesa, e é conferido à parte.
const semExtrato = (d) => JSON.stringify({ ...d, carteira: null, equip: { ...d.equip, acessorios: null } });
/* O digitado leva os MESMOS pacotes (os nativos): a única diferença é de onde vem o nível. */
const digitado = { ...createBlankAfty(), id: "g1", rulesVersion: "player", addons: CP.hidratarFicha(comXp(220)).addons };
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
const nativosFonte = readFileSync(new URL("../src/systems/eradeouro/pacotes-nativos.js", import.meta.url), "utf8");
t("os nativos não carregam a Carteira da Guilda", nativosFonte.includes("carteira-da-guilda.json"), false);
const appFonte = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
t("o App não manda mais cópia de addon na ficha nova", /addonsIniciais=|pacotesOficiais/.test(appFonte), false);

/* ============================================================ */
/* TREINO DE PERÍCIA, ITENS, TREINO DE TR E A MALDIÇÃO (2026-11-09) */
/* ============================================================ */
const TRE = await import(A + "afty-treinamentos.js");
const ORI = await import(A + "afty-origens.js");
const TAL = await import(A + "afty-talentos.js");

/* A 4ª etapa do Treino de Perícia: metade do BT na Guilda, o sucesso garantido fora dela.
   Nível 9 (BT 4) nos dois: na Guilda pelo XP da Carteira, fora pelo campo. */
const fichaPericia = (naGuilda, progresso) => {
  const f = { ...createBlankAfty(), id: "tp", rulesVersion: "player" };
  f.core = { ...f.core, nd: 9 };
  f.treinamentos = { pericia: [{ alvo: "atletismo", progresso }] };
  if (naGuilda) {
    f.mesa = "eradeouro";
    f.carteira = { entradas: [{ id: "e", nome: "", xp: 160, dinheiro: 0, interludios: 0, tipo: "" }], gastos: [] };
  }
  return f;
};
const atletismo = (f) => derivarNoMundo(f).testes.pericias.find((x) => x.id === "atletismo")?.bonus;
t("os dois no Nível 9", [derivarNoMundo(fichaPericia(true, 4)).nd, derivarNoMundo(fichaPericia(false, 4)).nd], [9, 9]);
t("na Guilda a 4ª etapa soma metade do BT", atletismo(fichaPericia(true, 4)) - atletismo(fichaPericia(true, 3)), 2);
t("fora da Guilda ela segue sem número", atletismo(fichaPericia(false, 4)) - atletismo(fichaPericia(false, 3)), 0);
aplicarAddons([]);
const periciaDoLivro = JSON.parse(JSON.stringify(TRE.getTreinamento("pericia")));
aplicarAddons(CP.addonsDaFicha(guildaP));
const periciaDaGuilda = TRE.getTreinamento("pericia");
t("o catálogo da Guilda mostra a etapa nova", periciaDaGuilda.etapas[3].beneficio,
  "Você adiciona metade do seu bônus de treinamento em testes da perícia escolhida.");
t("as três primeiras etapas são as do livro", JSON.stringify(periciaDaGuilda.etapas.slice(0, 3)) === JSON.stringify(periciaDoLivro.etapas.slice(0, 3)), true);
t("o Completo é o do livro", periciaDaGuilda.completo.beneficio, periciaDoLivro.completo.beneficio);
t("e a linha diz quem a remendou", periciaDaGuilda.remendadoPor?.length > 0, true);
aplicarAddons([]);
t("fora da Guilda o catálogo é o do livro", TRE.getTreinamento("pericia").etapas[3].beneficio.startsWith("Uma vez por cena"), true);

/* O Talento Costas Largas e o limite de 4 Acessórios equipados. */
const ID_COSTAS = "regras-da-era-de-ouro:costas_largas";
aplicarAddons(CP.addonsDaFicha(guildaP));
t("o Costas Largas existe na Guilda", [TAL.getTalento(ID_COSTAS)?.nome, TAL.getTalento(ID_COSTAS)?.grupo], ["Costas Largas", "geral"]);
t("ele é livre", TAL.getTalento(ID_COSTAS)?.requisitos, []);
t("ele soma 2 no limite", TAL.limiteAcessoriosDosTalentos({ talentos: [ID_COSTAS] }), 2);
t("a descrição sem travessão nem ponto e vírgula", new RegExp("[\u2014;]").test(TAL.getTalento(ID_COSTAS)?.descricao ?? ";"), false);
aplicarAddons([]);
t("fora da Guilda ele não existe", TAL.getTalento(ID_COSTAS), null);
const ACESSORIOS = ["it_brinco_da_comunicacao", "it_chaveiro_canalizador", "it_amuleto_do_vislumbre", "it_faixa_de_foco", "it_bracelete_do_vigor"];
const comAcessorios = (base, quantos = 5, talentos = []) => ({
  ...base, talentos,
  equipamentos: { ...(base.equipamentos ?? {}), itens: ACESSORIOS.slice(0, quantos).map((refId, i) => ({ uid: `u${i}`, tipo: "item", refId, qtd: 1, equipado: true })) },
});
const d5 = derivarNoMundo(comAcessorios(guildaC));
t("conta os vestidos e o limite", d5.equip.acessorios, { vestidos: 5, limite: 4 });
t("o quinto passa do limite", d5.equip.entradas.filter((e) => e.acimaDoLimite).map((e) => e.refId), ["it_bracelete_do_vigor"]);
t("e não vale: o Bracelete do Vigor não dá PV", d5.hp, derivarNoMundo(comAcessorios(guildaC, 4)).hp);
t("a bancada avisa", d5.equip.avisos.some((a) => a.startsWith("1 Acessório equipado passa do limite de 4")), true);
const d5c = derivarNoMundo(comAcessorios(guildaC, 5, [ID_COSTAS]));
t("com Costas Largas o limite é 6", d5c.equip.acessorios, { vestidos: 5, limite: 6 });
t("e o Bracelete do Vigor vale", d5c.hp > d5.hp && !d5c.equip.entradas.some((e) => e.acimaDoLimite), true);
const dFora = derivarNoMundo(comAcessorios(foraDaMesa));
t("fora da Guilda não há limite", [dFora.equip.acessorios.limite, dFora.equip.entradas.some((e) => e.acimaDoLimite)], [null, false]);
t("o personagem da Guilda também tem o limite", derivarNoMundo(comAcessorios(guildaP)).equip.acessorios.limite, 4);
const guardado = comAcessorios(guildaC);
guardado.equipamentos.itens[4].equipado = false;
t("o Acessório guardado não conta", derivarNoMundo(guardado).equip.acessorios.vestidos, 4);

/* O Treino de Testes de Resistência em no máximo 2 TRs na Guilda. */
const ID_TR = "treino-testes-de-resistencia:testes_de_resistencia";
const tresTRs = (base) => ({ ...base, treinamentos: { [ID_TR]: [
  { alvo: "fortitude", progresso: 1 }, { alvo: "reflexos", progresso: 1 }, { alvo: "vontade", progresso: 1 },
] } });
const pacoteTR = normalizarPacote(lerPacote("treino-testes-de-resistencia"));
const foraComTR = { ...foraDaMesa, addons: [pacoteTR] };
aplicarAddons(CP.addonsDaFicha(guildaP));
t("o teto da Guilda é 2", TRE.tetoDeInstancias(TRE.getTreinamento(ID_TR), guildaP), 2);
t("na criatura da Guilda também", TRE.tetoDeInstancias(TRE.getTreinamento(ID_TR), guildaC), 2);
t("fora da Guilda não há teto", TRE.tetoDeInstancias(TRE.getTreinamento(ID_TR), foraDaMesa), null);
t("outra Linha repetível não ganha teto", TRE.tetoDeInstancias(TRE.getTreinamento("pericia"), guildaP), null);
t("na Guilda só 2 cobram Foco", TRE.focosGastos(tresTRs(guildaP).treinamentos, null, null, tresTRs(guildaP)), 2);
t("fora as 3 cobram", TRE.focosGastos(tresTRs(foraComTR).treinamentos, null, null, tresTRs(foraComTR)), 3);
const prof = (d, id) => d.testes.resistencias.find((r) => r.value === id)?.prof;
const dTR = derivarNoMundo(tresTRs(guildaP));
const dSemTR = derivarNoMundo(guildaP);
t("na Guilda as duas primeiras treinam", [prof(dTR, "fortitude"), prof(dTR, "reflexos")], ["treinado", "treinado"]);
t("e a terceira não vale", prof(dTR, "vontade"), prof(dSemTR, "vontade"));
t("contraprova: fora da Guilda a terceira treina", prof(derivarNoMundo(tresTRs(foraComTR)), "vontade"), "treinado");

/* A Maldição: na Guilda só a Era de Ouro, que é nativa. O seletor lê a ficha hidratada, como o criador. */
aplicarAddons(CP.addonsDaFicha(guildaP));
const ID_MALDICAO_EDO = "maldicao-era-de-ouro:maldicao_era_de_ouro";
const origensDe = (f) => ORI.origensDoSistema(CP.hidratarFicha(f)).map((o) => o.value);
t("na Guilda a Maldição do livro sai do seletor", origensDe(guildaP).includes("maldicao"), false);
t("e a Maldição Era de Ouro entra", origensDe(guildaP).includes(ID_MALDICAO_EDO), true);
t("na criatura da Guilda também", [origensDe(guildaC).includes("maldicao"), origensDe(guildaC).includes(ID_MALDICAO_EDO)], [false, true]);
const jaMaldicao = { ...guildaP, core: { ...guildaP.core, origem: { id: "maldicao" } } };
t("a ficha da Guilda que já é Maldição do livro a mantém", origensDe(jaMaldicao).includes("maldicao"), true);
aplicarAddons([]);
t("fora da Guilda a do livro segue", origensDe(foraDaMesa).includes("maldicao"), true);

const textosDaGuilda = JSON.stringify([G.MISSOES_ERA_DE_OURO, G.EVENTOS_ERA_DE_OURO, G.FILTROS_DA_GUILDA, G.MOEDA_ERA_DE_OURO]);
t("textos da Carteira da Guilda sem travessão nem ponto e vírgula", new RegExp("[\u2014;]").test(textosDaGuilda), false);

if (bad.length) {
  console.error(`FALHARAM ${bad.length}:\n` + bad.join("\n"));
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
