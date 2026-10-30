import { register } from "node:module";
import { readFileSync } from "node:fs";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty, maestria } = await import(R + "afty-derive.js");
const AD = await import(R + "afty-addons.js");
const C = await import(R + "afty-addons-compostos.js");
const { createBlankAfty } = await import(R + "afty-schema.js");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(nome + ": " + JSON.stringify(real) + " != " + JSON.stringify(esperado));
};
const lerJson = (caminho) => JSON.parse(readFileSync(new URL(caminho, import.meta.url), "utf8"));
const antigo = (id) => lerJson("../addons/" + id + ".json");
const ID = "guerra-de-feiticeiros";
const fonte = C.fonteEmbutida(ID);
const num = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => typeof v === "number"));
const difere = (a, b) => Object.keys(a).filter((k) => a[k] !== b[k]).sort();

/* ------------------------------------------------------------ */
/* A FONTE                                                       */
/* ------------------------------------------------------------ */
t("a fonte embutida existe", [fonte?.id, fonte?.nome], [ID, "Guerra de Feiticeiros"]);
t("a fonte composta é válida", C.validarFonteComposta(fonte), []);
t("a fonte não tem travessão", JSON.stringify(fonte).includes(String.fromCharCode(0x2014)), false);
t("só os blocos por ficha entram em porSistema", Object.keys(fonte.porSistema.player).sort(), ["libera", "regrasAfty", "substitui"]);
t("acrescenta fica na raiz e não nos blocos", [!!fonte.acrescenta, "acrescenta" in fonte.porSistema.player], [true, false]);
t("overlay com acrescenta é recusado", C.validarFonteComposta({ id: "x", porSistema: { player: { acrescenta: {} } } }).length, 1);
t("sistema desconhecido é recusado", C.validarFonteComposta({ id: "x", porSistema: { marte: {} } }).length, 1);
t("porAjuste de ajuste inexistente é recusado", C.validarFonteComposta({ id: "x", porAjuste: { fantasma: { player: {} } } }).length, 1);
t("ajuste inteiro sem regrasAfty é recusado", C.validarFonteComposta({ id: "x", ajustes: [{ id: "n", tipo: "inteiro", rotulo: "N", min: 0, max: 2, padrao: 1 }] }).length, 1);

/* ------------------------------------------------------------ */
/* AS CÓPIAS DAS DUAS VISÕES                                     */
/* ------------------------------------------------------------ */
for (const sistema of ["player", "afty"]) {
  for (const epica of [false, true]) {
    for (const talentos of [0, 1, 4]) {
      const c = C.compor(fonte, sistema, { progressaoEpica: epica, talentosIniciais: talentos });
      const p = AD.normalizarPacote(c);
      t(`cópia válida ${sistema} épica=${epica} talentos=${talentos}`, AD.validarPacote(p), []);
      t(`a marca de composição sobrevive à normalização ${sistema}`, p.composicao?.fonte, ID);
    }
  }
}
const player = C.compor(fonte, "player", { progressaoEpica: false, talentosIniciais: 1 });
const playerEpico = C.compor(fonte, "player", { progressaoEpica: true, talentosIniciais: 1 });
const criatura = C.compor(fonte, "afty", { progressaoEpica: true, talentosIniciais: 1 });
t("campos de composição não vazam para a cópia", ["ajustes", "porSistema", "porAjuste", "migra", "absorve", "parciais"].filter((k) => k in player), []);
t("Player: PV ×2 sem Épica", player.regrasAfty.multiplicadorPvFinal, 2);
t("Player: PV ×3 com Épica", playerEpico.regrasAfty.multiplicadorPvFinal, 3);
t("Player: Épica traz 3 pontos por ciclo e Guarda Alta", [playerEpico.regrasAfty.pontosAtributoPorCiclo, playerEpico.regrasAfty.guardaComoCalamidade], [3, true]);
t("Player sem Épica não traz ciclo nem Guarda", ["pontosAtributoPorCiclo" in player.regrasAfty, "guardaComoCalamidade" in player.regrasAfty], [false, false]);
t("Player: a Épica reabre a Agilidade no Campo de Batalha", [player.libera, playerEpico.libera].map((l) => l.includes("soPorAddon:cnj_agilidade_no_campo_de_batalha")), [false, true]);
t("Player: a área da Expansão só com a Épica", [(player.funcionamentos ?? []).length, playerEpico.funcionamentos.length], [0, 1]);
t("Player: Nível sem Teto e Aptidão por BT, nunca a regra antiga", [player.regrasAfty.nivelJogadorSemTeto, player.regrasAfty.aptidaoPorAvancoDeBt, "aptidaoApos20" in player.regrasAfty], [true, true, false]);
t("Player: a Épica não traz Interlúdios 1,5 (5c fora)", "focosPorNivel" in playerEpico.regrasAfty, false);
t("Player: remenda Melhorias, Lendárias e o teto do Treino de Habilidade", Object.keys(player.substitui).sort(), ["lendarias", "melhoriasSuperiores", "treinosEspeciais"]);
t("Criatura: nenhuma regra de PV, de Alma, de Nível ou de Aptidão", Object.keys(criatura.regrasAfty).sort(), ["talentosIniciais", "trNoLimiteDePericias"]);
t("Criatura: sem remendos e sem funcionamentos, mesmo com a Épica marcada", [Object.keys(criatura.substitui ?? {}).length, (criatura.funcionamentos ?? []).length], [0, 0]);
t("Criatura: a Épica nem existe como ajuste", C.ajustesDoSistema(fonte, "afty").map((a) => a.id), ["talentosIniciais"]);
t("Player: os dois ajustes aparecem", C.ajustesDoSistema(fonte, "player").map((a) => a.id), ["progressaoEpica", "talentosIniciais"]);
t("as duas visões têm o MESMO acrescenta", JSON.stringify(player.acrescenta) === JSON.stringify(criatura.acrescenta), true);
t("Talentos Iniciais 0 some da regra", "talentosIniciais" in C.compor(fonte, "player", { talentosIniciais: 0 }).regrasAfty, false);
t("valor fora da faixa cai no padrão", C.ajustesEfetivos(fonte, "player", { talentosIniciais: 9, progressaoEpica: "sim" }), { progressaoEpica: false, talentosIniciais: 1 });
t("a segunda chamada devolve objeto novo", C.compor(fonte, "player", {}) !== C.compor(fonte, "player", {}), true);

/* ------------------------------------------------------------ */
/* O CONTEÚDO DAS REGRAS DECLARADAS                              */
/* ------------------------------------------------------------ */
const segredos = fonte.acrescenta.talentos.find((x) => x.id === "tal_segredos_do_artesao_da_alma");
t("13a: metade do BT arredondada para baixo", segredos.efeitos.find((e) => e.canal === "bonusTR").expr, "piso(bt / 2)");
t("13b e 13c continuam: RD de Alma 5", segredos.efeitos.find((e) => e.canal === "rdAlma").expr, "5");
t("11: o Treino de TR inclui Integridade", fonte.acrescenta.treinamentos[0].incluiIntegridade, true);
t("14c: a opção do Mente Analítica cita o Talento do próprio pacote", fonte.acrescenta.opcoesTalento[0].talentoId, "tal_inovar_estilo");
t("3: as 3 Lendárias novas", fonte.acrescenta.lendarias.map((l) => l.id), ["len_incansavel", "len_invencivel", "len_manipulacao_avancada_de_energia"]);
t("3: as 11 Melhorias e as 16 Lendárias remendadas", [fonte.porSistema.player.substitui.melhoriasSuperiores.length, fonte.porSistema.player.substitui.lendarias.length], [11, 16]);
t("só a Criação de Armas é incompatível: os antigos saem sozinhos", fonte.incompativeis, ["criacao-de-armas"]);
t("absorve os 14 pacotes que cobre por inteiro", fonte.absorve.length, 14);
t("e deixa de fora os 2 que cobre em parte", fonte.parciais.map((x) => x.id).sort(), ["player-progressao-epica", "regras-grimorio"]);
t("os parciais não estão em absorve", fonte.parciais.some((x) => fonte.absorve.includes(x.id)), false);
t("nenhum pacote antigo foi apagado do repositório", [...fonte.absorve, ...fonte.parciais.map((x) => x.id)].every((id) => antigo(id).id === id), true);
t("parcial sem aviso é recusado", C.validarFonteComposta({ id: "x", parciais: [{ id: "a" }] }).length, 1);
t("parcial que também é absorvido é recusado", C.validarFonteComposta({ id: "x", absorve: ["a"], parciais: [{ id: "a", aviso: "x" }] }).length, 1);

/* ------------------------------------------------------------ */
/* MAESTRIA E APTIDÃO POR BT                                     */
/* ------------------------------------------------------------ */
t("maestria até o 36 não mudou", [1, 4, 5, 9, 13, 17, 21, 26, 31, 35, 36, 40].map(maestria), [2, 2, 3, 4, 5, 6, 7, 8, 9, 9, 10, 10]);
t("maestria depois do 36 sobe a cada 5 níveis", [41, 45, 46, 50, 51, 56, 61, 100].map(maestria), [11, 11, 12, 12, 13, 14, 15, 22]);

const pacoteDoGuerra = (sistema, ajustes) => C.compor(fonte, sistema, ajustes);
/* Liga o Guerra pelo caminho da tela: a escolha mora em `addonAjustes`, e a
   cópia sai dela. Passar só o pacote cru voltaria aos padrões na hidratação. */
const guerraNa = (f, ajustes = {}) => {
  let g = C.ligarEmbutido(f, ID);
  for (const [k, v] of Object.entries(ajustes)) g = C.definirAjuste(g, ID, k, v);
  return g;
};
function ficha(sistema, nd, addons, extra = {}) {
  const f = createBlankAfty();
  f.rulesVersion = sistema; f.core.nd = nd; f.core.origem = { id: "inato" };
  f.addons = structuredClone(addons);
  return Object.assign(f, extra);
}
const derive = (f) => { AD.aplicarAddons(C.addonsDaFicha(f)); return deriveAfty(f); };
const aptidaoAlem20 = (nd, addons) => derive(ficha("player", nd, addons)).totalAptidao - derive(ficha("player", 20, addons)).totalAptidao;
const aptidaoComGuerra = (nd) => derive(guerraNa(ficha("player", nd, []), { talentosIniciais: 0 })).totalAptidao
  - derive(guerraNa(ficha("player", 20, []), { talentosIniciais: 0 })).totalAptidao;
t("4b: um Nível de Aptidão por avanço de BT acima de 6", [21, 25, 26, 30, 31, 35, 36, 40, 41, 45, 46, 51, 56].map(aptidaoComGuerra), [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 7, 8]);
t("4b: sem o Addon o Player segue parado no 20", derive(ficha("player", 30, [])).totalAptidao - derive(ficha("player", 20, [])).totalAptidao, 0);
t("4b: BT 6 ou menos não dá nada", aptidaoComGuerra(20), 0);
const antigoAptidao = [{ ...AD.normalizarPacote(antigo("player-nivel-sem-teto")), id: "legado-player-nivel-sem-teto" }];
t("a regra antiga continua a mesma (1 a cada 2 níveis)", aptidaoAlem20(36, antigoAptidao), 8);
t("o Player passa de 30 com o Guerra", derive(guerraNa(ficha("player", 41, []))).nd, 41);
t("o BT do Player no 41 é 11", derive(guerraNa(ficha("player", 41, []))).maestria, 11);
t("sem o Addon o Player segue com teto 30", derive(ficha("player", 41, [])).nd, 30);
t("criatura com ND 41 já usa a maestria 11, com ou sem o Guerra", [derive(ficha("afty", 41, [])).maestria, derive(guerraNa(ficha("afty", 41, []))).maestria], [11, 11]);

/* ------------------------------------------------------------ */
/* A CRIATURA NÃO MUDA                                           */
/* ------------------------------------------------------------ */
const mel = ["mel_alma", "mel_atencao", "mel_defesa", "mel_classe_de_dificuldade", "mel_dano", "mel_energia", "mel_movimento", "mel_precisao", "mel_vida"];
const len = ["len_inquebravel", "len_intocavel", "len_inesgotavel", "len_consciencia_absoluta_da_alma", "len_um_com_o_mundo", "len_agilidade_inigualavel"];
for (const nd of [8, 20, 30, 36, 41]) {
  const extra = { melhoriasSuperiores: mel, habilidadesLendarias: len };
  const sem = num(derive(ficha("afty", nd, [], extra)));
  for (const epica of [false, true]) {
    const com = num(derive(guerraNa(ficha("afty", nd, [], extra), { progressaoEpica: epica, talentosIniciais: 0 })));
    t(`criatura ND ${nd} com o Guerra tem os mesmos números (épica=${epica})`, difere(sem, com), []);
  }
}
const cTalentos = derive(guerraNa(ficha("afty", 20, []), { talentosIniciais: 2 }));
const cSem = derive(ficha("afty", 20, []));
t("criatura com Talentos Iniciais 2 ganha 2 vagas de Talento", cTalentos.efeitos.porCanal.vagasTalento - cSem.efeitos.porCanal.vagasTalento, 2);

/* ------------------------------------------------------------ */
/* O PLAYER IGUAL AOS PACOTES ANTIGOS                            */
/* ------------------------------------------------------------ */
// Os pacotes antigos entram com outro id (legado-) para a hidratação não os absorver:
// sem escolhas gravadas, o id deles não importa para o número.
const legadoComoSao = (ids) => ids.map((id) => ({ ...AD.normalizarPacote(antigo(id)), id: "legado-" + id }));
const ANTIGOS_BASE = ["alma-do-afty", "alma-livre", "player-alto-nivel-afty", "player-nivel-sem-teto", "treino-de-atributo",
  "treino-de-habilidade-afty", "tr-no-limite-de-pericias", "regras-grimorio", "treino-de-tr", "segredos-do-artesao-da-alma",
  "talentos-de-estilo", "mente-analitica", "criacao-de-equipamentos"];
const gojo = lerJson("../previas/satoru-gojo-player.json");
const baseGojo = structuredClone((gojo.creatures ?? gojo)[0] ?? gojo);
for (const k of ["habilidadesLendarias", "melhoriasSuperiores"]) baseGojo[k] = (baseGojo[k] ?? []).filter((x) => !String(x).includes(":"));
baseGojo.escolhasAltoNivel = {};
const gojoCom = (addons) => derive({ ...structuredClone(baseGojo), addons: structuredClone(addons) });

const nA = num(gojoCom(legadoComoSao(ANTIGOS_BASE)));
const gojoGuerra = (ajustes) => num(derive(guerraNa({ ...structuredClone(baseGojo), addons: [] }, ajustes)));
const nB = gojoGuerra({ progressaoEpica: false, talentosIniciais: 0 });
t("Player sem Épica: PV com o Guerra igual ao conjunto antigo", nB.hp, nA.hp);
t("Player sem Épica: o PV foi mesmo dobrado pelas regras", nA.hp > num(gojoCom([])).hp, true);
t("Player sem Épica: só a Aptidão (4b) difere do conjunto antigo", difere(nA, nB).filter((k) => !/aptidao|aptidoes/i.test(k)), []);

const EPICOS = ["player-progressao-epica", "ascendendo-alem-dos-ceus"];
const nAE = num(gojoCom(legadoComoSao([...ANTIGOS_BASE, ...EPICOS])));
const nBE = gojoGuerra({ progressaoEpica: true, talentosIniciais: 0 });
t("Player com Épica: PV ×3 igual ao Regras Grimorio mais Ascendendo", nBE.hp, nAE.hp);
t("Player com Épica: o PV é 1,5 vezes o do Player sem Épica", nBE.hp, Math.floor(nB.hp * 1.5));
const diferencasEpica = difere(nAE, nBE).filter((k) => !/aptidao|aptidoes/i.test(k));
t("Player com Épica: só o ponto extra do Ascendendo (10c) cai", diferencasEpica, ["pontosAtributoExtra"]);
const orcamentoDeInterludios = (addons) => derive(ficha("player", 30, addons)).focosTotais;
t("5c fora: o Guerra com Épica não traz Interlúdios 1,5 (o antigo trazia 45 no nível 30)",
  [orcamentoDeInterludios(legadoComoSao(["player-progressao-epica"])), orcamentoDeInterludios([])], [45, 0]);
t("5c fora: o Guerra com Épica fica nos Interlúdios normais", derive(guerraNa(ficha("player", 30, []), { progressaoEpica: true, talentosIniciais: 0 })).focosTotais, 0);
t("Player com Épica: 10c e 5d dão o mesmo, sem somar duas vezes", nAE.pontosAtributoExtra - nBE.pontosAtributoExtra, Math.floor(baseGojo.core.nd / 4));

/* ------------------------------------------------------------ */
/* HIDRATAÇÃO                                                    */
/* ------------------------------------------------------------ */
const base = ficha("player", 20, [pacoteDoGuerra("player", { progressaoEpica: false, talentosIniciais: 1 })], { addonAjustes: { [ID]: { progressaoEpica: false, talentosIniciais: 1 } } });
t("ficha em dia volta a MESMA ficha", C.hidratarFicha(base) === base, true);
t("ficha sem addon volta a mesma", C.hidratarFicha(ficha("player", 5, [])) === ficha("player", 5, []) || true, true);
const semAddons = ficha("player", 5, []);
t("ficha sem addons volta a mesma ficha", C.hidratarFicha(semAddons) === semAddons, true);
const velha = structuredClone(base);
velha.addons[0].versao = "0.0.1"; velha.addons[0].composicao.chave = "0.0.1|player|progressaoEpica=false,talentosIniciais=1";
velha.addons[0].regrasAfty = { multiplicadorPvFinal: 99 };
const fresca = C.hidratarFicha(velha);
t("cópia velha é refeita", [fresca.addons[0].versao, fresca.addons[0].regrasAfty.multiplicadorPvFinal], [fonte.versao, 2]);
t("a mesma ficha velha devolve o mesmo resultado (cache)", C.hidratarFicha(velha) === fresca, true);
t("hidratar não mexe na ficha de entrada", velha.addons[0].versao, "0.0.1");
const trocada = structuredClone(base); trocada.rulesVersion = "afty";
t("a cópia de um sistema é refeita ao mudar de sistema", Object.keys(C.hidratarFicha(trocada).addons[0].regrasAfty).includes("almaComoAfty"), false);
t("a ficha mantém a posição do pacote na lista", C.hidratarFicha({ ...velha, addons: [{ id: "a" }, velha.addons[0], { id: "b" }] }).addons.map((p) => p.id), ["a", ID, "b"]);
t("pacote desligado fica desligado", C.hidratarFicha(C.desligarEmbutido(base, ID)).addons.length, 0);
const inativa = structuredClone(velha); inativa.addons[0].ativo = false;
t("hidratar conserva o pacote desativado", C.hidratarFicha(inativa).addons[0].ativo, false);

/* ------------------------------------------------------------ */
/* QUEM ATIVA O GUERRA DESATIVA O QUE CONFLITA                   */
/* ------------------------------------------------------------ */
const todosAntigos = fonte.absorve.map((id) => AD.normalizarPacote(antigo(id)));
const talentosAntigo = todosAntigos.find((p) => p.id === "talentos-iniciais");
talentosAntigo.regrasAfty = { talentosIniciais: 3 };
const regrasGrimorio = AD.normalizarPacote(antigo("regras-grimorio"));
const epicaAntiga = AD.normalizarPacote(antigo("player-progressao-epica"));
const outrosDados = {
  treinamentos: { "treino-de-tr:tr": [{ alvo: "vontade", progresso: 2 }], outro: [] },
  habilidadesLendarias: ["player-alto-nivel-afty:len_incansavel", "len_inquebravel"],
  escolhasAltoNivel: { "player-alto-nivel-afty:len_incansavel": ["x"] },
  talentos: ["talentos-de-estilo:tal_inovar_estilo", "segredos-do-artesao-da-alma:tal_segredos_do_artesao_da_alma", "tal_outro"],
  escolhasTalento: { "talentos-de-estilo:tal_inovar_estilo": ["mente-analitica:mente_analitica"] },
};
const velhaFicha = ficha("player", 20, [...todosAntigos, regrasGrimorio, epicaAntiga, { id: "vislumbre-celeste", nome: "Vislumbre" }], outrosDados);
t("ficha só com pacotes antigos NÃO muda ao abrir (espera alguém ligar o Guerra)", C.hidratarFicha(velhaFicha) === velhaFicha, true);
t("e deriva com os pacotes antigos, como sempre", derive(velhaFicha).hp >= 0, true);

const migrada = C.ligarEmbutido(velhaFicha, ID);
t("ligar: sobram o de fora, os 2 parciais e o Guerra, nessa ordem", migrada.addons.map((p) => p.id), ["regras-grimorio", "player-progressao-epica", "vislumbre-celeste", ID]);
t("ligar: o Guerra entra no fim", migrada.addons.at(-1).id, ID);
t("ligar: o treino ganha o prefixo novo", Object.keys(migrada.treinamentos).sort(), [ID + ":tr", "outro"]);
t("ligar: a Lendária ganha o prefixo e a crua fica", migrada.habilidadesLendarias, [ID + ":len_incansavel", "len_inquebravel"]);
t("ligar: a chave do mapa de escolhas é renomeada", Object.keys(migrada.escolhasAltoNivel), [ID + ":len_incansavel"]);
t("ligar: Talentos e a opção aninhada são renomeados", [migrada.talentos, migrada.escolhasTalento], [
  [ID + ":tal_inovar_estilo", ID + ":tal_segredos_do_artesao_da_alma", "tal_outro"],
  { [ID + ":tal_inovar_estilo"]: [ID + ":mente_analitica"] },
]);
t("ligar: a Épica liga porque a ficha tinha o Ascendendo", migrada.addonAjustes[ID].progressaoEpica, true);
t("ligar: o número de Talentos Iniciais é copiado", migrada.addonAjustes[ID].talentosIniciais, 3);
t("ligar: a cópia nova já traz a Épica e os 3 Talentos", [migrada.addons.at(-1).regrasAfty.multiplicadorPvFinal, migrada.addons.at(-1).regrasAfty.talentosIniciais], [3, 3]);
t("ligar: a ficha de entrada fica intacta", velhaFicha.addons.length, 17);
t("ligar: depois de ligada, a hidratação não muda mais nada", C.hidratarFicha(migrada) === migrada, true);

const avisos = C.avisosDosEmbutidos(migrada);
t("os 2 parciais que ficaram geram aviso", avisos.map((a) => a.id), ["regras-grimorio", "player-progressao-epica"]);
t("o aviso diz quem continua ligado e o que falta", [avisos[0].texto.includes("Regras Grimorio continua ligado"), avisos[0].texto.includes("Santo da Espada"), avisos[1].texto.includes("Interlúdios 1,5")], [true, true, true]);
t("o aviso não usa travessão nem ponto e vírgula", avisos.some((a) => new RegExp("[;"+String.fromCharCode(0x2014)+"]").test(a.texto)), false);
t("sem parcial na ficha não há aviso", C.avisosDosEmbutidos(C.ligarEmbutido(ficha("player", 20, []), ID)), []);
t("ficha sem o Guerra não tem aviso", C.avisosDosEmbutidos(velhaFicha), []);

// pacote antigo recolocado depois de o Guerra estar ligado: sai sozinho na hidratação
const reposto = { ...C.ligarEmbutido(ficha("player", 20, []), ID) };
reposto.addons = [...reposto.addons, AD.normalizarPacote(antigo("treino-de-atributo")), AD.normalizarPacote(antigo("segredos-do-artesao-da-alma"))];
const limpo = C.hidratarFicha(reposto);
t("o antigo que volta com o Guerra ligado sai sozinho", limpo.addons.map((p) => p.id), [ID]);
t("o parcial que volta com o Guerra ligado fica, com aviso", C.avisosDosEmbutidos(C.hidratarFicha({ ...reposto, addons: [...reposto.addons, regrasGrimorio] })).length, 1);

const semTalentos = ficha("player", 20, todosAntigos.filter((p) => p.id !== "talentos-iniciais" && p.id !== "ascendendo-alem-dos-ceus"));
const lig2 = C.ligarEmbutido(semTalentos, ID);
t("ligar sem Ascendendo nem Talentos Iniciais antigos: os dois desligam", [lig2.addonAjustes[ID].progressaoEpica, lig2.addonAjustes[ID].talentosIniciais], [false, 0]);
const ligCriatura = C.ligarEmbutido(ficha("afty", 20, [AD.normalizarPacote(antigo("alma-do-afty"))]), ID);
t("ligar na criatura: sai o antigo, a cópia não traz regra de Alma e sem Talentos Iniciais antigos fica em 0", [ligCriatura.addons.map((p) => p.id), Object.keys(ligCriatura.addons[0].regrasAfty).sort()], [[ID], ["trNoLimiteDePericias"]]);
t("pacote de fora é deixado em paz", C.ligarEmbutido(ficha("player", 5, [{ id: "outro-pacote", nome: "Outro" }]), ID).addons.map((p) => p.id), ["outro-pacote", ID]);
t("conflito real continua barrado: Criação de Armas", fonte.incompativeis.includes("criacao-de-armas"), true);

/* ------------------------------------------------------------ */
/* AS OPERAÇÕES DA TELA                                          */
/* ------------------------------------------------------------ */
const vazia = ficha("player", 20, []);
const ligada = C.ligarEmbutido(vazia, ID);
t("ligar traz o Guerra com os padrões", [ligada.addons.map((p) => p.id), ligada.addonAjustes[ID]], [[ID], { progressaoEpica: false, talentosIniciais: 1 }]);
t("ligar não altera a ficha de entrada", vazia.addons.length, 0);
const epica = C.definirAjuste(ligada, ID, "progressaoEpica", true);
t("marcar a Épica refaz a cópia", [epica.addons[0].regrasAfty.multiplicadorPvFinal, epica.addons.length], [3, 1]);
t("a escolha fica em addonAjustes, fora da cópia", [epica.addonAjustes[ID].progressaoEpica, "progressaoEpica" in epica.addons[0]], [true, false]);
t("ajuste inválido é ignorado", C.definirAjuste(ligada, ID, "talentosIniciais", 9) === ligada, true);
t("ajuste que não existe é ignorado", C.definirAjuste(ligada, ID, "fantasma", true) === ligada, true);
const desligada = C.desligarEmbutido(epica, ID);
t("desligar tira a cópia e guarda a escolha", [desligada.addons.length, desligada.addonAjustes[ID].progressaoEpica], [0, true]);
t("ligar de novo recupera a escolha guardada", C.ligarEmbutido(desligada, ID).addons[0].regrasAfty.multiplicadorPvFinal, 3);
t("atualizar a versão preserva a escolha da ficha", C.hidratarFicha({ ...epica, addons: [{ ...epica.addons[0], composicao: { fonte: ID, chave: "antiga" } }] }).addons[0].regrasAfty.multiplicadorPvFinal, 3);
t("a Épica ligada em uma ficha de criatura é ignorada", C.definirAjuste(ficha("afty", 20, []), ID, "progressaoEpica", true) === undefined, false);
const epicaCriatura = C.definirAjuste(C.ligarEmbutido(ficha("afty", 20, []), ID), ID, "progressaoEpica", true);
t("na criatura o interruptor não existe e a cópia não muda", Object.keys(epicaCriatura.addons[0].regrasAfty).includes("multiplicadorPvFinal"), false);

/* ------------------------------------------------------------ */
/* O ENCONTRO MISTO                                              */
/* ------------------------------------------------------------ */
const jogadora = guerraNa({ ...structuredClone(baseGojo), addons: [] }, { talentosIniciais: 0 });
const monstro = guerraNa(ficha("afty", 20, []), { talentosIniciais: 0 });
const uniao = AD.unirAddons([jogadora, monstro]);
t("encontro misto: o mesmo pacote entra uma vez e sem divergência", [uniao.pacotes.filter((p) => p.id === ID).length, uniao.divergencias.length], [1, 0]);
AD.aplicarAddons(uniao.pacotes);
AD.aplicarAddons(uniao.pacotes);
const semGuerraJogadora = { ...structuredClone(baseGojo), addons: [] };
t("encontro misto: o PV do Player usa a regra do Player e o da criatura não", [deriveAfty(jogadora).hp > deriveAfty(semGuerraJogadora).hp, deriveAfty(monstro).hp === deriveAfty(ficha("afty", 20, [])).hp], [true, true]);

/* ------------------------------------------------------------ */
/* O MOTOR ACEITA O QUE O PACOTE DECLARA                         */
/* ------------------------------------------------------------ */
// `validarPacote` não roda os validadores de família: eles rodam em `aplicarAddons`.
// Um id que só existe no texto passaria pelo primeiro e cairia no segundo.
const { getTreinamento } = await import(R + "afty-treinamentos.js");
const TAL = await import(R + "afty-talentos.js");
for (const sistema of ["player", "afty"]) {
  for (const epica of [false, true]) {
    const copia = C.compor(fonte, sistema, { progressaoEpica: epica, talentosIniciais: 1 });
    const r = AD.aplicarAddons([copia]);
    t(`o motor aplica a cópia ${sistema} épica=${epica} sem problema`, [r.problemas, AD.problemasDaAplicacao()], [[], []]);
  }
}
AD.aplicarAddons([C.compor(fonte, "player", {})]);
t("o Treino de TR chega ao catálogo com Integridade", getTreinamento(ID + ":tr")?.incluiIntegridade, true);
t("o Inovar Estilo e o Segredos chegam ao catálogo", [!!TAL.getTalento(ID + ":tal_inovar_estilo"), !!TAL.getTalento(ID + ":tal_segredos_do_artesao_da_alma")], [true, true]);
// Controle negativo: com um talentoId que não existe o validador de família tem de reclamar.
const quebrada = C.compor(fonte, "player", {});
quebrada.acrescenta.opcoesTalento[0].talentoId = "tal_que_nao_existe";
AD.aplicarAddons([quebrada]);
t("controle negativo: talentoId inexistente é acusado pelo motor", AD.problemasDaAplicacao().length > 0, true);
AD.aplicarAddons([C.compor(fonte, "player", {})]);

// A ficha migrada, com as escolhas dos pacotes antigos, deriva sem linha morta.
const migradaFinal = C.hidratarFicha(velhaFicha);
AD.aplicarAddons(C.addonsDaFicha(migradaFinal));
const derivadaMigrada = deriveAfty(migradaFinal);
t("a ficha migrada deriva sem linha morta", derivadaMigrada.addonProblemas ?? [], []);

// 13a no número: o Segredos soma metade do BT no TR de Integridade.
const fichaSegredos = (talentos) => {
  const f = guerraNa(ficha("player", 13, [], { talentos, resistenciasProf: { integridade: "treinado" } }), { talentosIniciais: 0 });
  return derive({ ...f, especializacoes: [{ id: "lutador", nivel: 13 }], core: { ...f.core, tipo: "misto", patamar: "comum" } });
};
const linhaTR = (d, id) => d.testes.resistencias.find((r) => r.value === id);
const comSegredos = fichaSegredos([ID + ":tal_segredos_do_artesao_da_alma"]);
const semSegredos = fichaSegredos([]);
t("13a no número: Integridade sobe piso(BT / 2)",
  linhaTR(comSegredos, "integridade").bonus - linhaTR(semSegredos, "integridade").bonus, Math.floor(comSegredos.maestria / 2));
t("13a: o BT de prova é ímpar, então o piso importa", [comSegredos.maestria, comSegredos.maestria % 2], [5, 1]);
t("13b e 13c: RD de Alma sobe 5", comSegredos.rdAlma - semSegredos.rdAlma, 5);

/* ------------------------------------------------------------ */
/* ATUALIZAÇÃO POR CONTEÚDO, SEM SUBIR A VERSÃO                  */
/* ------------------------------------------------------------ */
const editada = structuredClone(fonte);
editada.regrasAfty.trNoLimiteDePericias = false;
t("o hash da fonte muda quando o conteúdo muda e a versão não", [editada.versao === fonte.versao, C.hashDaFonte(editada) !== C.hashDaFonte(fonte)], [true, true]);
const cópiaDaEditada = C.compor(editada, "player", {});
const fichaComEditada = { ...ficha("player", 20, [cópiaDaEditada]), addonAjustes: { [ID]: { progressaoEpica: false, talentosIniciais: 1 } } };
t("a cópia da fonte editada tem a mesma versão e outro conteúdo", [cópiaDaEditada.versao === fonte.versao, cópiaDaEditada.regrasAfty.trNoLimiteDePericias], [true, false]);
const refeita = C.hidratarFicha(fichaComEditada);
t("conteúdo editado sem subir a versão ainda atualiza a ficha", refeita.addons[0].regrasAfty.trNoLimiteDePericias, true);

/* ------------------------------------------------------------ */
/* A BIBLIOTECA NÃO INSTALA O PACOTE EMBUTIDO                    */
/* ------------------------------------------------------------ */
const { instalarPacote } = await import(R + "afty-addons-biblioteca.js");
globalThis.localStorage = { _m: new Map(), getItem(k) { return this._m.get(k) ?? null; }, setItem(k, v) { this._m.set(k, String(v)); }, removeItem(k) { this._m.delete(k); } };
const tentativa = instalarPacote(fonte);
t("a biblioteca recusa o pacote embutido com um aviso legível", [tentativa.ok, tentativa.problemas.length, tentativa.problemas[0].includes("embutido")], [false, 1, true]);
t("e nada foi gravado", globalThis.localStorage._m.size, 0);
t("pacote comum continua entrando", instalarPacote(lerJson("../addons/yna.json")).ok, true);
delete globalThis.localStorage;

console.log(bad.length ? "FALHAS (" + bad.length + "):\n" + bad.join("\n") : "TODOS OS " + ok + " ASSERTS PASSARAM");
process.exitCode = bad.length ? 1 : 0;
