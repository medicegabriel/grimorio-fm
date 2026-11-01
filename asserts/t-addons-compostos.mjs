/**
 * Os mecanismos do pacote COMPOSTO, com uma fonte neutra (fonte-composta-exemplo.mjs).
 * Nada aqui depende de pacote privado: o conteúdo de um pacote composto real é
 * testado à parte, no arquivo privado de quem o tem.
 */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);

/* O registro lê o armazenamento do navegador na primeira vez que alguém pergunta. */
const guardado = new Map();
let recusarGravacao = false;
globalThis.localStorage = {
  getItem: (k) => guardado.get(k) ?? null,
  setItem(k, v) { if (recusarGravacao) throw new Error("cota"); guardado.set(k, String(v)); },
  removeItem: (k) => { guardado.delete(k); },
};
const CHAVE_FONTES = "fm_addons_compostos_afty_v1";
const CHAVE_BIBLIOTECA = "fm_addons_afty_v1";

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const AD = await import(R + "afty-addons.js");
const C = await import(R + "afty-addons-compostos.js");
const B = await import(R + "afty-addons-biblioteca.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { getTreinamento } = await import(R + "afty-treinamentos.js");
const TAL = await import(R + "afty-talentos.js");
const { fonteExemplo, ID_EXEMPLO: ID } = await import("./fonte-composta-exemplo.mjs");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(nome + ": " + JSON.stringify(real) + " != " + JSON.stringify(esperado));
};
const antigo = (id) => JSON.parse(readFileSync(new URL("../addons/" + id + ".json", import.meta.url), "utf8"));
const antigoNormal = (id) => AD.normalizarPacote(antigo(id));
function ficha(sistema, nd, addons, extra = {}) {
  const f = createBlankAfty();
  f.rulesVersion = sistema; f.core.nd = nd; f.core.origem = { id: "inato" };
  f.addons = structuredClone(addons);
  return Object.assign(f, extra);
}
const derive = (f) => { AD.aplicarAddons(C.addonsDaFicha(f)); return deriveAfty(f); };
const pvDe = (f) => derive(f).regrasAfty.multiplicadorPvFinal;

/* ------------------------------------------------------------ */
/* A FONTE                                                       */
/* ------------------------------------------------------------ */
const ex = fonteExemplo();
t("a fonte neutra é válida", C.validarFonteComposta(ex), []);
t("overlay com acrescenta é recusado", C.validarFonteComposta({ id: "x", porSistema: { player: { acrescenta: {} } } }).length, 1);
t("sistema desconhecido é recusado", C.validarFonteComposta({ id: "x", porSistema: { marte: {} } }).length, 1);
t("porAjuste de ajuste inexistente é recusado", C.validarFonteComposta({ id: "x", porAjuste: { fantasma: { player: {} } } }).length, 1);
t("ajuste inteiro sem regrasAfty é recusado", C.validarFonteComposta({ id: "x", ajustes: [{ id: "n", tipo: "inteiro", rotulo: "N", min: 0, max: 2, padrao: 1 }] }).length, 1);
t("parcial sem aviso é recusado", C.validarFonteComposta({ id: "x", parciais: [{ id: "a" }] }).length, 1);
t("parcial que também é absorvido é recusado", C.validarFonteComposta({ id: "x", absorve: ["a"], parciais: [{ id: "a", aviso: "x" }] }).length, 1);
t("parcial com sistema desconhecido é recusado", C.validarFonteComposta({ id: "x", parciais: [{ id: "a", aviso: "x", sistemas: ["marte"] }] }).length, 1);
t("parcial com sistema conhecido é aceito", C.validarFonteComposta({ id: "x", parciais: [{ id: "a", aviso: "x", sistemas: ["player"] }] }), []);
const PROIBIDOS = new RegExp("[;" + String.fromCharCode(0x2014) + "]");
t("a fonte não tem travessão nem ponto e vírgula nos textos", PROIBIDOS.test(JSON.stringify(ex)), false);
t("reconhece o que tem campos de composição", [ex, { id: "x", ajustes: [] }, { id: "x", absorve: [] }].map(C.temComposicao), [true, true, true]);
t("não confunde pacote comum, cópia de ficha nem lixo", [antigo("yna"), { composicao: { fonte: "x", chave: "y" } }, null, [], "texto"].map(C.temComposicao), [false, false, false, false, false]);

/* ------------------------------------------------------------ */
/* SEM A FONTE INSTALADA: o que todo mundo que não tem o JSON vê */
/* ------------------------------------------------------------ */
C.recarregarFontesCompostas();
t("sem fonte instalada não há fonte nenhuma", [C.fontesCompostas(), C.ehComposto(ID), C.fonteComposta(ID)], [[], false, null]);
const copiaPlayer = C.compor(ex, "player", { modoForte: false, talentosIniciais: 1 });
const comCopia = ficha("player", 20, [copiaPlayer], { addonAjustes: { [ID]: { modoForte: false, talentosIniciais: 1 } } });
t("a ficha que chega com a cópia fica como está, sem hidratar", C.hidratarFicha(comCopia) === comCopia, true);
t("e continua funcionando com as regras que a cópia carrega", pvDe(comCopia), 2);
t("ligar sem a fonte não faz nada", C.ligarComposto(ficha("player", 20, []), ID).addons.length, 0);
t("mexer num ajuste sem a fonte não faz nada", C.definirAjuste(comCopia, ID, "modoForte", true) === comCopia, true);
t("sem a fonte não há aviso de parcial", C.avisosDosCompostos(comCopia), []);

/* ------------------------------------------------------------ */
/* O REGISTRO: instalar, guardar, recarregar e remover           */
/* ------------------------------------------------------------ */
t("registrar grava e devolve gravou", C.registrarFonteComposta(ex).gravou, true);
t("a fonte instalada aparece", [C.ehComposto(ID), C.fontesCompostas().map((f) => f.id)], [true, [ID]]);
t("a fonte instalada é uma cópia, não o objeto de quem registrou", [C.fonteComposta(ID) === ex, JSON.stringify(C.fonteComposta(ID)) === JSON.stringify(ex)], [false, true]);
t("a fonte mora na chave própria e fora da biblioteca", [JSON.parse(guardado.get(CHAVE_FONTES)).map((f) => f.id), guardado.has(CHAVE_BIBLIOTECA)], [[ID], false]);
C.recarregarFontesCompostas();
t("depois de recarregar a fonte volta do armazenamento", C.fontesCompostas().map((f) => f.id), [ID]);
guardado.set(CHAVE_FONTES, "{isto nao e json");
C.recarregarFontesCompostas();
t("armazenamento ilegível vira registro vazio, sem lançar", C.fontesCompostas(), []);
guardado.set(CHAVE_FONTES, JSON.stringify([{ id: "" }, null, 7, ex, { id: "so-ajustes", ajustes: [{ id: "a", tipo: "marte", rotulo: "A" }] }]));
C.recarregarFontesCompostas();
t("entrada inválida é descartada e a válida fica", C.fontesCompostas().map((f) => f.id), [ID]);
t("remover tira do registro e do armazenamento", [C.removerFonteComposta(ID), C.ehComposto(ID), JSON.parse(guardado.get(CHAVE_FONTES))], [true, false, []]);
t("remover o que não está devolve falso", C.removerFonteComposta(ID), false);

/* ------------------------------------------------------------ */
/* AS CÓPIAS POR SISTEMA                                         */
/* ------------------------------------------------------------ */
for (const sistema of ["player", "afty"]) {
  for (const forte of [false, true]) {
    for (const talentos of [0, 1, 4]) {
      const c = C.compor(ex, sistema, { modoForte: forte, talentosIniciais: talentos });
      const p = AD.normalizarPacote(c);
      t(`cópia válida ${sistema} forte=${forte} talentos=${talentos}`, AD.validarPacote(p), []);
      t(`a marca de composição sobrevive à normalização ${sistema}`, p.composicao?.fonte, ID);
    }
  }
}
const player = C.compor(ex, "player", { modoForte: false, talentosIniciais: 1 });
const playerForte = C.compor(ex, "player", { modoForte: true, talentosIniciais: 1 });
const criatura = C.compor(ex, "afty", { modoForte: true, talentosIniciais: 1 });
t("campos de composição não vazam para a cópia", ["ajustes", "porSistema", "porAjuste", "migra", "absorve", "parciais"].filter((k) => k in player), []);
t("Player: PV ×2 sem o interruptor e ×3 com ele", [player.regrasAfty.multiplicadorPvFinal, playerForte.regrasAfty.multiplicadorPvFinal], [2, 3]);
t("o interruptor só traz o que declara", [pontos(player), pontos(playerForte)], [false, 3]);
function pontos(c) { return c.regrasAfty.pontosAtributoPorCiclo ?? false; }
t("Player: remenda o que a fonte declara", Object.keys(player.substitui).sort(), ["lendarias", "melhoriasSuperiores", "treinosEspeciais"]);
t("Criatura: só as regras da raiz e dos ajustes que valem nela", Object.keys(criatura.regrasAfty).sort(), ["talentosIniciais", "trNoLimiteDePericias"]);
t("Criatura: sem remendos mesmo com o interruptor marcado", Object.keys(criatura.substitui ?? {}).length, 0);
t("o interruptor de Player nem existe como ajuste da criatura", C.ajustesDoSistema(ex, "afty").map((a) => a.id), ["talentosIniciais"]);
t("Player: os dois ajustes aparecem", C.ajustesDoSistema(ex, "player").map((a) => a.id), ["modoForte", "talentosIniciais"]);
t("as duas visões têm o MESMO acrescenta", JSON.stringify(player.acrescenta) === JSON.stringify(criatura.acrescenta), true);
t("inteiro em 0 some da regra", "talentosIniciais" in C.compor(ex, "player", { talentosIniciais: 0 }).regrasAfty, false);
t("valor fora da faixa cai no padrão", C.ajustesEfetivos(ex, "player", { talentosIniciais: 9, modoForte: "sim" }), { modoForte: false, talentosIniciais: 1 });
t("a segunda chamada devolve objeto novo", C.compor(ex, "player", {}) !== C.compor(ex, "player", {}), true);
for (const sistema of ["player", "afty"]) {
  const r = AD.aplicarAddons([C.compor(ex, sistema, { modoForte: true, talentosIniciais: 1 })]);
  t(`o motor aplica a cópia ${sistema} sem problema`, [r.problemas, AD.problemasDaAplicacao()], [[], []]);
}
AD.aplicarAddons([C.compor(ex, "player", {})]);
t("o Treino e o Talento do pacote chegam ao catálogo com o prefixo dele", [!!getTreinamento(ID + ":tr"), !!TAL.getTalento(ID + ":tal_inovar_estilo")], [true, true]);

/* ------------------------------------------------------------ */
/* HIDRATAÇÃO, COM A FONTE INSTALADA                             */
/* ------------------------------------------------------------ */
C.registrarFonteComposta(ex, { persistir: false });
const base = ficha("player", 20, [player], { addonAjustes: { [ID]: { modoForte: false, talentosIniciais: 1 } } });
t("ficha em dia volta a MESMA ficha", C.hidratarFicha(base) === base, true);
const semAddons = ficha("player", 5, []);
t("ficha sem addons volta a mesma ficha", C.hidratarFicha(semAddons) === semAddons, true);
const velha = structuredClone(base);
velha.addons[0].versao = "0.0.1"; velha.addons[0].composicao.chave = "0.0.1|player|modoForte=false,talentosIniciais=1";
velha.addons[0].regrasAfty = { multiplicadorPvFinal: 99 };
const fresca = C.hidratarFicha(velha);
t("cópia velha é refeita", [fresca.addons[0].versao, fresca.addons[0].regrasAfty.multiplicadorPvFinal], [ex.versao, 2]);
t("a mesma ficha velha devolve o mesmo resultado (cache)", C.hidratarFicha(velha) === fresca, true);
t("hidratar não mexe na ficha de entrada", velha.addons[0].versao, "0.0.1");
const trocada = structuredClone(base); trocada.rulesVersion = "afty";
t("a cópia de um sistema é refeita ao mudar de sistema", Object.keys(C.hidratarFicha(trocada).addons[0].regrasAfty).includes("almaComoAfty"), false);
t("a ficha mantém a posição do pacote na lista", C.hidratarFicha({ ...velha, addons: [{ id: "a" }, velha.addons[0], { id: "b" }] }).addons.map((p) => p.id), ["a", ID, "b"]);
t("pacote desligado fica desligado", C.hidratarFicha(C.desligarComposto(base, ID)).addons.length, 0);
const inativa = structuredClone(velha); inativa.addons[0].ativo = false;
t("hidratar conserva o pacote desativado", C.hidratarFicha(inativa).addons[0].ativo, false);

/* ⚠ A GERAÇÃO DO REGISTRO. O resultado da hidratação é guardado por ficha. Sem o contador
   de geração, instalar uma versão nova no meio da sessão não refaria a ficha que já foi lida. */
const v2 = fonteExemplo(); v2.versao = "1.0.1"; v2.regrasAfty.trNoLimiteDePericias = false;
C.registrarFonteComposta(v2, { persistir: false });
const refeita = C.hidratarFicha(velha);
t("fonte nova instalada na sessão refaz a ficha que já estava em cache", [refeita !== fresca, refeita.addons[0].versao, refeita.addons[0].regrasAfty.trNoLimiteDePericias], [true, "1.0.1", false]);
C.registrarFonteComposta(ex, { persistir: false });
t("e voltar à versão anterior também refaz", C.hidratarFicha(velha).addons[0].versao, ex.versao);
C.removerFonteComposta(ID, { persistir: false });
t("sem a fonte a ficha fica como está, com a cópia velha", C.hidratarFicha(velha) === velha, true);
C.registrarFonteComposta(ex, { persistir: false });

const editada = fonteExemplo(); editada.regrasAfty.trNoLimiteDePericias = false;
t("o hash da fonte muda quando o conteúdo muda e a versão não", [editada.versao === ex.versao, C.hashDaFonte(editada) !== C.hashDaFonte(ex)], [true, true]);
const copiaDaEditada = C.compor(editada, "player", {});
const fichaComEditada = ficha("player", 20, [copiaDaEditada], { addonAjustes: { [ID]: { modoForte: false, talentosIniciais: 1 } } });
t("a cópia da fonte editada tem a mesma versão e outro conteúdo", [copiaDaEditada.versao === ex.versao, copiaDaEditada.regrasAfty.trNoLimiteDePericias], [true, false]);
t("conteúdo editado sem subir a versão ainda atualiza a ficha", C.hidratarFicha(fichaComEditada).addons[0].regrasAfty.trNoLimiteDePericias, true);

/* ------------------------------------------------------------ */
/* QUEM LIGA O COMPOSTO DESLIGA O QUE CONFLITA                   */
/* ------------------------------------------------------------ */
const todosAntigos = ex.absorve.map(antigoNormal);
todosAntigos.find((p) => p.id === "talentos-iniciais").regrasAfty = { talentosIniciais: 3 };
const regrasGrimorio = antigoNormal("regras-grimorio");
const epicaAntiga = antigoNormal("player-progressao-epica");
const ascendendo = antigoNormal("ascendendo-alem-dos-ceus");
const outrosDados = {
  treinamentos: { "treino-de-tr:tr": [{ alvo: "vontade", progresso: 2 }], outro: [] },
  talentos: ["talentos-de-estilo:tal_inovar_estilo", "tal_outro"],
  escolhasTalento: { "talentos-de-estilo:tal_inovar_estilo": ["x"] },
};
const velhaFicha = ficha("player", 20, [...todosAntigos, epicaAntiga, { id: "vislumbre-celeste", nome: "Vislumbre" }], outrosDados);
t("ficha só com pacotes antigos NÃO muda ao abrir, mesmo com a fonte instalada", C.hidratarFicha(velhaFicha) === velhaFicha, true);
const migrada = C.ligarComposto(velhaFicha, ID);
t("ligar: sobram o parcial, o de fora e o composto, nessa ordem", migrada.addons.map((p) => p.id), ["player-progressao-epica", "vislumbre-celeste", ID]);
t("ligar: o treino ganha o prefixo novo", Object.keys(migrada.treinamentos).sort(), [ID + ":tr", "outro"]);
t("ligar: o Talento e a escolha dele são renomeados", [migrada.talentos, Object.keys(migrada.escolhasTalento)], [[ID + ":tal_inovar_estilo", "tal_outro"], [ID + ":tal_inovar_estilo"]]);
t("ligar: o interruptor liga porque a ficha tinha o pacote que o declara", migrada.addonAjustes[ID].modoForte, true);
t("ligar: o número de Talentos Iniciais é copiado do pacote antigo", migrada.addonAjustes[ID].talentosIniciais, 3);
t("ligar: a cópia nova já traz o interruptor e os 3 Talentos", [migrada.addons.at(-1).regrasAfty.multiplicadorPvFinal, migrada.addons.at(-1).regrasAfty.talentosIniciais], [3, 3]);
t("ligar: a ficha de entrada fica intacta", velhaFicha.addons.length, 8);
t("ligar: depois de ligada, a hidratação não muda mais nada", C.hidratarFicha(migrada) === migrada, true);

const avisos = C.avisosDosCompostos(migrada);
t("o parcial que ficou gera aviso", avisos.map((a) => a.id), ["player-progressao-epica"]);
t("o aviso diz quem continua ligado e o que falta", [avisos[0].texto.includes("Progressão Épica continua ligado"), avisos[0].texto.includes("Interlúdios")], [true, true]);
t("o aviso não usa travessão nem ponto e vírgula", PROIBIDOS.test(avisos[0].texto), false);
t("sem parcial na ficha não há aviso", C.avisosDosCompostos(C.ligarComposto(ficha("player", 20, []), ID)), []);
t("ficha sem o composto não tem aviso", C.avisosDosCompostos(velhaFicha), []);
const comEpicaAntiga = (sistema) => C.ligarComposto(ficha(sistema, 20, [epicaAntiga]), ID);
t("o aviso do parcial aparece no Player", C.avisosDosCompostos(comEpicaAntiga("player")).map((a) => a.id), ["player-progressao-epica"]);
t("e NÃO aparece na criatura", C.avisosDosCompostos(comEpicaAntiga("afty")), []);

const reposto = { ...C.ligarComposto(ficha("player", 20, []), ID) };
reposto.addons = [...reposto.addons, antigoNormal("talentos-iniciais"), antigoNormal("treino-de-tr")];
t("o antigo que volta com o composto ligado sai sozinho", C.hidratarFicha(reposto).addons.map((p) => p.id), [ID]);
t("o parcial que volta com o composto ligado fica, com aviso", C.avisosDosCompostos(C.hidratarFicha({ ...reposto, addons: [...reposto.addons, epicaAntiga] })).length, 1);
const semTalentos = ficha("player", 20, todosAntigos.filter((p) => p.id !== "talentos-iniciais" && p.id !== "ascendendo-alem-dos-ceus"));
const lig2 = C.ligarComposto(semTalentos, ID);
t("ligar sem o pacote do interruptor nem o de Talentos: os dois desligam", [lig2.addonAjustes[ID].modoForte, lig2.addonAjustes[ID].talentosIniciais], [false, 0]);
const ligCriatura = C.ligarComposto(ficha("afty", 20, [antigoNormal("alma-do-afty")]), ID);
t("ligar na criatura: sai o antigo e a cópia não traz regra de Alma", [ligCriatura.addons.map((p) => p.id), Object.keys(ligCriatura.addons[0].regrasAfty).sort()], [[ID], ["trNoLimiteDePericias"]]);
t("pacote de fora é deixado em paz", C.ligarComposto(ficha("player", 5, [{ id: "outro-pacote", nome: "Outro" }]), ID).addons.map((p) => p.id), ["outro-pacote", ID]);
t("conflito real continua declarado", ex.incompativeis, ["criacao-de-armas"]);

/* O PV de quem tinha pacotes antigos de PV não dobra nem some ao ligar (Player) */
const soRG = ficha("player", 30, [regrasGrimorio]);
const rgMaisAsc = ficha("player", 30, [regrasGrimorio, ascendendo]);
t("Player com o pacote de PV ×2 mantém o PV ao ligar", [pvDe(soRG), pvDe(C.ligarComposto(soRG, ID))], [2, 2]);
t("Player com os dois pacotes de PV (×3) mantém o PV ao ligar", [pvDe(rgMaisAsc), pvDe(C.ligarComposto(rgMaisAsc, ID))], [3, 3]);
t("o pacote de PV absorvido sai da ficha ao ligar", C.ligarComposto(rgMaisAsc, ID).addons.map((p) => p.id), [ID]);
const jaLigada = C.ligarComposto(ficha("player", 30, []), ID);
t("ficha que já tinha o composto com o pacote antigo ao lado volta a ×2 ao hidratar", pvDe(C.hidratarFicha({ ...jaLigada, addons: [...jaLigada.addons, regrasGrimorio] })), 2);
const criaturaComRG = ficha("afty", 30, [regrasGrimorio]);
t("Criatura: a fonte não multiplica PV nela, então sai do ×2 para o PV do Patamar", [pvDe(criaturaComRG), pvDe(C.ligarComposto(criaturaComRG, ID))], [2, 1]);

/* ------------------------------------------------------------ */
/* AS OPERAÇÕES DA TELA                                          */
/* ------------------------------------------------------------ */
const vazia = ficha("player", 20, []);
const ligada = C.ligarComposto(vazia, ID);
t("ligar traz o pacote com os padrões", [ligada.addons.map((p) => p.id), ligada.addonAjustes[ID]], [[ID], { modoForte: false, talentosIniciais: 1 }]);
t("ligar não altera a ficha de entrada", vazia.addons.length, 0);
const forte = C.definirAjuste(ligada, ID, "modoForte", true);
t("marcar o interruptor refaz a cópia", [forte.addons[0].regrasAfty.multiplicadorPvFinal, forte.addons.length], [3, 1]);
t("a escolha fica em addonAjustes, fora da cópia", [forte.addonAjustes[ID].modoForte, "modoForte" in forte.addons[0]], [true, false]);
t("ajuste inválido é ignorado", C.definirAjuste(ligada, ID, "talentosIniciais", 9) === ligada, true);
t("ajuste que não existe é ignorado", C.definirAjuste(ligada, ID, "fantasma", true) === ligada, true);
const desligada = C.desligarComposto(forte, ID);
t("desligar tira a cópia e guarda a escolha", [desligada.addons.length, desligada.addonAjustes[ID].modoForte], [0, true]);
t("ligar de novo recupera a escolha guardada", C.ligarComposto(desligada, ID).addons[0].regrasAfty.multiplicadorPvFinal, 3);
const forteCriatura = C.definirAjuste(C.ligarComposto(ficha("afty", 20, []), ID), ID, "modoForte", true);
t("na criatura o interruptor não existe e a cópia não muda", Object.keys(forteCriatura.addons[0].regrasAfty).includes("multiplicadorPvFinal"), false);
const cTal = derive(C.definirAjuste(C.ligarComposto(ficha("afty", 20, []), ID), ID, "talentosIniciais", 2));
const cSem = derive(ficha("afty", 20, []));
t("criatura com Talentos Iniciais 2 ganha 2 vagas de Talento", cTal.efeitos.porCanal.vagasTalento - cSem.efeitos.porCanal.vagasTalento, 2);

/* ------------------------------------------------------------ */
/* INSTALAR PELA BIBLIOTECA                                      */
/* ------------------------------------------------------------ */
C.removerFonteComposta(ID, { persistir: false });
guardado.clear();
C.recarregarFontesCompostas();
const inst = B.instalarPacote(fonteExemplo());
t("o JSON composto instala e vai para o registro, não para a lista", [inst.ok, inst.composto, C.ehComposto(ID), B.lerBiblioteca().length], [true, true, true, 0]);
t("a fonte instalada ficou na chave própria", JSON.parse(guardado.get(CHAVE_FONTES)).map((f) => f.id), [ID]);
const denovo = B.instalarPacote(fonteExemplo());
t("instalar de novo sem substituir é recusado com texto legível", [denovo.ok, denovo.problemas[0].includes("já está instalado")], [false, true]);
const atualizado = fonteExemplo(); atualizado.versao = "1.0.1";
t("instalar de novo substituindo é atualizar", [B.instalarPacote(atualizado, { substituir: true }).ok, C.fonteComposta(ID).versao], [true, "1.0.1"]);
const copiaSolta = B.instalarPacote(C.compor(ex, "player", {}));
t("a cópia que uma ficha carrega NÃO se instala", [copiaSolta.ok, copiaSolta.problemas[0].includes("cópia que uma ficha carrega")], [false, true]);
const quebrado = fonteExemplo(); quebrado.id = "quebrado"; quebrado.porAjuste = { fantasma: { player: {} } };
const rQuebrado = B.instalarPacote(quebrado);
t("fonte com problema na estrutura é recusada e não entra", [rQuebrado.ok, C.ehComposto("quebrado")], [false, false]);
const invalidoNaVisao = fonteExemplo(); invalidoNaVisao.id = "invalido-na-visao"; invalidoNaVisao.regrasAfty = { inventada: true };
const rVisao = B.instalarPacote(invalidoNaVisao);
t("cada visão da fonte precisa ser um pacote válido", [rVisao.ok, C.ehComposto("invalido-na-visao"), rVisao.problemas.some((p) => p.startsWith("Ficha de Player:")), rVisao.problemas.some((p) => p.startsWith("Ficha de criatura:"))], [false, false, true, true]);
t("pacote comum continua entrando na lista e não toca o registro", [B.instalarPacote(antigo("yna")).ok, B.lerBiblioteca().map((p) => p.id), C.fontesCompostas().map((f) => f.id)], [true, ["yna"], [ID]]);
const comumDeMesmoId = { id: "mesmo-id", nome: "Comum", versao: "1.0.0", descricao: "Pacote comum de teste." };
B.instalarPacote(comumDeMesmoId);
const compostoDeMesmoId = fonteExemplo(); compostoDeMesmoId.id = "mesmo-id";
t("o composto de mesmo id tira o comum da lista", [B.instalarPacote(compostoDeMesmoId).ok, B.lerBiblioteca().map((p) => p.id)], [true, ["yna"]]);
B.removerPacote("mesmo-id");
const doTexto = B.instalarDeTexto(JSON.stringify(fonteExemplo()), { substituir: true });
t("o JSON colado como texto instala o composto", [doTexto.ok, doTexto.composto], [true, true]);
recusarGravacao = true;
const semGravar = fonteExemplo(); semGravar.id = "sem-gravar";
const rCota = B.instalarPacote(semGravar);
t("armazenamento recusando: não instala e a sessão não mostra o que sumiria", [rCota.ok, C.ehComposto("sem-gravar"), rCota.problemas[0].includes("Não foi possível gravar")], [false, false, true]);
const atualizadoSemGravar = fonteExemplo(); atualizadoSemGravar.versao = "9.9.9";
const versaoAntes = C.fonteComposta(ID).versao;
t("falha ao atualizar mantém a versão que já estava", [B.instalarPacote(atualizadoSemGravar, { substituir: true }).ok, C.fonteComposta(ID).versao], [false, versaoAntes]);
recusarGravacao = false;
B.removerPacote(ID);
t("remover tira a fonte do registro e do armazenamento", [C.ehComposto(ID), JSON.parse(guardado.get(CHAVE_FONTES)).map((f) => f.id)], [false, []]);
t("a ficha que tinha a cópia segue com ela depois de remover", C.hidratarFicha(comCopia) === comCopia, true);

console.log(bad.length ? "FALHAS (" + bad.length + "):\n" + bad.join("\n") : "TODOS OS " + ok + " ASSERTS PASSARAM");
process.exitCode = bad.length ? 1 : 0;
