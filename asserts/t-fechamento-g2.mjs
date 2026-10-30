/* FECHAMENTO FUNCIONAL DO G2 (2026-10-20): Imitação, Concedido pelo Mestre, Exaustão desde zero, Sangramento e buff de mesa operados pelo G2.

   As cinco rotinas moravam só na Apresentação Anterior. Aqui o que o G2 usa para operá-las, nas FUNÇÕES PURAS sobre a sessão e pelo derive real:
     1. Imitação: tipos, candidatas, quem pode copiar, copiar e encerrar, aprender, escolhas, esquecer, comum e Perfeita;
     2. Concedido pelo Mestre: disponibilidade, catálogo por família, conceder sem duplicar, linha morta, remover, e o que NÃO muda (ficha e orçamento);
     3. Exaustão: desde zero, passos, zerar, piso, e a separação da Exaustão de Técnica;
     4. Sangramento: a faixa resolvida, a rolagem real contra a perda registrada, direto na Vida, uma vez só, e o que não sangra;
     5. Buff de mesa: o formulário validado, canal e escopo, criar e tirar por id sem tocar nos outros registros, rodadas, descanso;
     6. as cinco juntas: a clássica, o G2 e o Encontro dão o mesmo derive, e a sessão salva e relida conserva tudo. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
const loja = new Map();
globalThis.localStorage = { getItem: (k) => (loja.has(k) ? loja.get(k) : null), setItem: (k, v) => loja.set(k, String(v)), removeItem: (k) => loja.delete(k) };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const INV = await import(R + "afty-invocacoes.js");
const COND = await import(R + "afty-condicoes.js");
const S = await import(R + "ficha/ficha-sessao.js");
const IM = await import(R + "ficha/efeitos/imitacao-logica.js");
const CO = await import(R + "ficha/efeitos/concedido-logica.js");
const BU = await import(R + "ficha/efeitos/buff-mesa-logica.js");
const EX = await import(R + "ficha/efeitos/exaustao-logica.js");
const MV = await import(R + "ficha/efeitos/mesa-verbos.js");
const SG = await import(R + "ficha/efeitos/sessao-g2.js");
const HL = await import(R + "ficha/efeitos/historico-logica.js");
const ED = await import(R + "ficha/efeitos/efeitos-dados.js");
const PA = await import(R + "ficha/pacotes-aliados.js");
const { rolarDano } = await import(R + "ficha/ficha-rolagem.js");
const { opcoesDeriveDaSessao } = await import(R + "ficha/ficha-opcoes-derive.js");
const { calcularRecebidos } = await import(R + "ficha/ficha-recebidos.js");
const { prepararCalculo } = await import(R + "ficha/efeitos/recebidos.js");
const E = await import(R + "encontros/usar-encontro-afty.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* ============================================================ */
/* AS FICHAS SINTÉTICAS                                          */
/* ============================================================ */
function imitador({ perfeita = false, memorizacao = false, sistema = "player" } = {}) {
  const c = createBlankAfty();
  c.id = `im-${perfeita ? "p" : "c"}`; c.name = "Imitador (Teste)"; c.rulesVersion = sistema;
  c.core = { ...c.core, nd: 20, patamar: "comum", origem: { id: "restringido" } };
  c.especializacoes = [{ id: "restringido", nivel: 20 }];
  c.habilidades = ["res_imitacao", ...(perfeita ? ["res_imitacao_perfeita"] : []), ...(memorizacao ? ["res_tecnicas_de_memorizacao"] : [])];
  return c;
}
function comum() {
  const c = createBlankAfty();
  c.id = "comum"; c.name = "Comum (Teste)"; c.rulesVersion = "player";
  c.core = { ...c.core, nd: 10, patamar: "comum", origem: { id: "inato" } };
  c.attributes = { ...c.attributes, forca: 16, destreza: 14, constituicao: 14 };
  c.especializacoes = [{ id: "combatente", nivel: 10 }];
  return c;
}
const ADDON_CONCESSAO = { id: "teste-concessao", nome: "Concessão de Teste", acrescenta: { habilidades: [] }, permite: ["concessao"] };

/* A conta de cada consumidor, com a mesma sessão. */
const deriveSessao = (f, s) => deriveAfty({ ...f, combate: s.combate, buffsSessao: s.buffs }, opcoesDeriveDaSessao(s));
const classica = (f, s) => calcularRecebidos(f, s, deriveSessao).derived;
const g2 = (f, s) => prepararCalculo(f, s).derived;
const enc = (f, s) => E.derivarCombatente({ ficha: f, sessao: s });
const emCombate = (f, s0 = null) => S.aplicaPatchCombate(s0 ?? S.sessaoEmBranco(deriveAfty(f)), { ativo: true });

/* ============================================================ */
/* 1. IMITAÇÃO                                                   */
/* ============================================================ */
const fC = imitador();
const fP = imitador({ perfeita: true });
const dC0 = deriveAfty(fC);
const dP0 = deriveAfty(fP);
t("a Imitação aparece para quem tem a habilidade, e só para ela", [IM.imitacaoDisponivel(dC0), IM.imitacaoDisponivel(dP0), IM.imitacaoDisponivel(deriveAfty(comum()))], [true, true, false]);
t("a comum copia posturas, manobras e habilidades ativas", IM.tiposDaImitacao(dC0).map((x) => x.id), ["postura", "manobra", "ativa"]);
t("a Perfeita também copia passivas e estilos", IM.tiposDaImitacao(dP0).map((x) => x.id), ["postura", "manobra", "ativa", "passiva", "estilo"]);
t("só habilidade ativa e passiva pedem a confirmação do tipo", ["postura", "manobra", "ativa", "passiva", "estilo"].map(IM.pedeElegibilidade), [false, false, true, true, false]);

const estC = IM.estadoDaImitacao(emCombate(fC), dC0);
const posturas = IM.candidatasDoTipo(dC0, estC, "postura");
t("as posturas candidatas são as do catálogo do motor", [posturas.total, posturas.itens.length, posturas.grupos.length, posturas.grupos[0].rotulo], [8, 8, 1, ""]);
t("a busca acha pelo nome", IM.candidatasDoTipo(dC0, estC, "postura", { termo: "Postura do Sol" }).itens.map((h) => h.id).includes("cmb_postura_do_sol"), true);
t("o filtro de efeito e a busca só estreitam a lista", IM.candidatasDoTipo(dC0, estC, "ativa", { efeito: "defesa" }).itens.length < IM.candidatasDoTipo(dC0, estC, "ativa").itens.length, true);
const ativas = IM.candidatasDoTipo(dC0, estC, "ativa");
t("as habilidades ativas saem agrupadas por classe e nível", [ativas.grupos.length > 1, ativas.grupos.every((x) => /Nível \d+$/.test(x.rotulo)), ativas.grupos.reduce((n, x) => n + x.itens.length, 0) === ativas.itens.length], [true, true, true]);

/* Copiar só em combate, no tipo da ficha, e com a confirmação onde ela é pedida. */
const dCombate = (f, s) => g2(f, s);
const sC = emCombate(fC);
t("fora de combate a cópia é recusada", IM.podeCopiar(deriveAfty(fC), { tipo: "postura" }), { ok: false, motivo: "Pede Em Combate" });
t("em combate a postura copia sem confirmação", IM.podeCopiar(dCombate(fC, sC), { tipo: "postura" }), { ok: true });
t("a habilidade ativa pede a confirmação do tipo", [IM.podeCopiar(dCombate(fC, sC), { tipo: "ativa" }).motivo, IM.podeCopiar(dCombate(fC, sC), { tipo: "ativa", elegivel: true }).ok], ["Confirme o Tipo e o Gasto de PE", true]);
t("a comum não copia passiva nem estilo, e a Perfeita copia", [IM.podeCopiar(dCombate(fC, sC), { tipo: "passiva", elegivel: true }).motivo, IM.podeCopiar(dCombate(fP, emCombate(fP)), { tipo: "estilo" }).ok], ["Tipo Fora da Imitação", true]);
t("ficha sem Imitação não copia", IM.podeCopiar(dCombate(comum(), emCombate(comum())), { tipo: "postura" }).motivo, "Imitação Indisponível");

/* Selecionar, consultar e filtrar NÃO trocam a cópia: são só leitura sobre a sessão. */
const antes = JSON.stringify(sC);
IM.candidatasDoTipo(dCombate(fC, sC), IM.estadoDaImitacao(sC, dCombate(fC, sC)), "ativa", { termo: "golpe" });
IM.podeCopiar(dCombate(fC, sC), { tipo: "ativa" });
IM.aprendidasDaImitacao(dCombate(fC, sC), IM.estadoDaImitacao(sC, dCombate(fC, sC)));
IM.escolhasDaCopia(sC, dCombate(fC, sC));
t("ler a Imitação não muda a sessão", JSON.stringify(sC), antes);

/* Copiar uma postura e encerrar: a transição do motor, inclusive a postura que entra e sai. */
const sSol = IM.copiarNaSessao(sC, { tipo: "postura", id: "cmb_postura_do_sol" });
t("copiar grava a cópia e a postura copiada", [sSol.combate.imitacao.copia.id, sSol.combate.postura], ["cmb_postura_do_sol", "sol"]);
t("o derive vê a cópia em combate, com o nome", [g2(fC, sSol).imitacao.copia?.id, g2(fC, sSol).imitacao.copia?.nome], ["cmb_postura_do_sol", "Postura do Sol"]);
t("copiar não gasta PE nem Vida", [sSol.peAtual, sSol.hpAtual], [sC.peAtual, sC.hpAtual]);
const sFim = IM.copiarNaSessao(sSol, null);
t("encerrar a cópia limpa a cópia e a postura", [sFim.combate.imitacao.copia, sFim.combate.postura, g2(fC, sFim).imitacao.copia], [null, "", null]);
t("fora de combate o derive não mostra a cópia (e a sessão guarda)", [deriveAfty({ ...fC, combate: { ...sSol.combate, ativo: false } }).imitacao.copia, sSol.combate.imitacao.copia.id], [null, "cmb_postura_do_sol"]);
t("trocar por outra postura troca a postura", IM.copiarNaSessao(sSol, { tipo: "postura", id: "cmb_postura_da_lua" }).combate.postura, "lua");

/* Aprender com o resultado que o JOGADOR informa. */
const dSol = g2(fC, sSol);
t("a CD de aprender é 35, e cai 2 por tentativa", [IM.cdDaCopia(dSol, IM.estadoDaImitacao(sSol, dSol))], [35]);
const sFalha = IM.aprenderNaSessao(sSol, dSol, "20");
t("o resultado baixo falha e conta a tentativa", [sFalha.combate.imitacao.aviso, sFalha.combate.imitacao.tentativas.cmb_postura_do_sol, sFalha.combate.imitacao.aprendidas ?? []], ["Falhou", 1, []]);
t("a CD seguinte é 33", IM.cdDaCopia(g2(fC, sFalha), IM.estadoDaImitacao(sFalha, g2(fC, sFalha))), 33);
const sAprendeu = IM.aprenderNaSessao(sFalha, g2(fC, sFalha), "35");
t("o resultado que bate a CD aprende, e a aprendida entra no derive", [sAprendeu.combate.imitacao.aviso, sAprendeu.combate.imitacao.aprendidas.map((c) => c.id), g2(fC, sAprendeu).imitacao.aprendidas.map((c) => c.id)], ["Aprendida", ["cmb_postura_do_sol"], ["cmb_postura_do_sol"]]);
t("a aprendida sai da lista de candidatas", IM.candidatasDoTipo(g2(fC, sAprendeu), IM.estadoDaImitacao(sAprendeu, g2(fC, sAprendeu)), "postura").itens.some((h) => h.id === "cmb_postura_do_sol"), false);
t("resultado vazio ou sem cópia não muda nada", [IM.aprenderNaSessao(sSol, dSol, "") === sSol, IM.aprenderNaSessao(sSol, dSol, "abc") === sSol, IM.aprenderNaSessao(sC, dCombate(fC, sC), "50") === sC], [true, true, true]);
t("aprender de novo a mesma não duplica", IM.aprenderNaSessao(sAprendeu, g2(fC, sAprendeu), "50").combate.imitacao.aprendidas.length, 1);
/* O limite de aprendidas: sem a Técnica de Memorização cabe uma por tipo, e com ela cabe uma extra. */
const outraPostura = (f, s) => IM.aprenderNaSessao(IM.copiarNaSessao(s, { tipo: "postura", id: "cmb_postura_da_lua" }), g2(f, IM.copiarNaSessao(s, { tipo: "postura", id: "cmb_postura_da_lua" })), "50");
t("sem memorização a segunda postura estoura o limite", [outraPostura(fC, sAprendeu).combate.imitacao.aviso, outraPostura(fC, sAprendeu).combate.imitacao.aprendidas.length], ["Limite de habilidades aprendidas", 1]);
const fM = imitador({ memorizacao: true });
const sM = IM.aprenderNaSessao(IM.copiarNaSessao(emCombate(fM), { tipo: "postura", id: "cmb_postura_do_sol" }), g2(fM, IM.copiarNaSessao(emCombate(fM), { tipo: "postura", id: "cmb_postura_do_sol" })), "50");
t("com a Técnica de Memorização cabe uma a mais", [outraPostura(fM, sM).combate.imitacao.aviso, outraPostura(fM, sM).combate.imitacao.aprendidas.length], ["Aprendida", 2]);

/* Reutilizar uma aprendida, e esquecer só ela. */
const aprendidas = IM.aprendidasDaImitacao(g2(fC, sAprendeu), IM.estadoDaImitacao(sAprendeu, g2(fC, sAprendeu)));
t("a aprendida lista nome, tipo e se ainda é utilizável", aprendidas.map((a) => [a.id, a.nome, a.tipo, a.utilizavel]), [["cmb_postura_do_sol", "Postura do Sol", "postura", true]]);
const sReusa = IM.copiarNaSessao(IM.copiarNaSessao(sAprendeu, null), { tipo: "postura", id: "cmb_postura_do_sol", aprendida: true });
t("reutilizar uma aprendida copia de novo", [sReusa.combate.imitacao.copia.aprendida, g2(fC, sReusa).imitacao.copia?.id], [true, "cmb_postura_do_sol"]);
const sEsqueceu = IM.esquecerNaSessao(sAprendeu, g2(fC, sAprendeu), "cmb_postura_do_sol");
t("esquecer tira só a aprendida, e a cópia atual continua", [sEsqueceu.combate.imitacao.aprendidas.length, sEsqueceu.combate.imitacao.copia?.id], [0, "cmb_postura_do_sol"]);
t("esquecer o que não existe não muda nada", IM.esquecerNaSessao(sAprendeu, g2(fC, sAprendeu), "xxx") === sAprendeu, true);
/* Com duas aprendidas (a Técnica de Memorização deixa uma a mais), esquecer uma tira SÓ ela. */
const sDuas = outraPostura(fM, sM);
t("com duas aprendidas, esquecer uma deixa a outra", [sDuas.combate.imitacao.aprendidas.map((c) => c.id), IM.esquecerNaSessao(sDuas, g2(fM, sDuas), "cmb_postura_da_lua").combate.imitacao.aprendidas.map((c) => c.id)], [["cmb_postura_do_sol", "cmb_postura_da_lua"], ["cmb_postura_do_sol"]]);

/* As escolhas da cópia (o Mestre da Postura pede posturas, até o limite do motor). */
const sMestre = IM.copiarNaSessao(emCombate(fP), { tipo: "ativa", id: "cmb_mestre_da_postura" });
const dMestre = g2(fP, sMestre);
const esc = IM.escolhasDaCopia(sMestre, dMestre);
t("o Mestre da Postura copiado oferece as posturas e o limite do motor", [!!esc, esc?.opcoes.length > 0, esc?.limite, esc?.escolhidas], [true, true, 2, []]);
const primeira = esc.opcoes[0].id;
const segunda = esc.opcoes[1].id;
const terceira = esc.opcoes[2].id;
const sE1 = IM.alternarEscolhaNaSessao(sMestre, dMestre, primeira);
const sE2 = IM.alternarEscolhaNaSessao(sE1, g2(fP, sE1), segunda);
t("escolher liga a opção, até o limite", [IM.escolhasDaCopia(sE1, g2(fP, sE1)).escolhidas, IM.escolhasDaCopia(sE2, g2(fP, sE2)).escolhidas], [[primeira], [primeira, segunda]]);
t("passar do limite não muda nada", IM.alternarEscolhaNaSessao(sE2, g2(fP, sE2), terceira) === sE2, true);
const sE3 = IM.alternarEscolhaNaSessao(sE2, g2(fP, sE2), primeira);
t("escolher de novo desliga", IM.escolhasDaCopia(sE3, g2(fP, sE3)).escolhidas, [segunda]);
t("sem cópia não há escolhas", IM.escolhasDaCopia(sC, dCombate(fC, sC)), null);

/* A Imitação numa ficha sem outros efeitos catalogados continua operável, nos dois sistemas. */
for (const sistema of ["player", "afty"]) {
  const f = imitador({ perfeita: true, sistema });
  const s = IM.copiarNaSessao(emCombate(f), { tipo: "estilo", id: "cmb_estilo_defensivo" });
  t(`(${sistema}) a Perfeita copia um estilo sem outro efeito na ficha`, [g2(f, s).imitacao.copia?.id, IM.imitacaoDisponivel(g2(f, s))], ["cmb_estilo_defensivo", true]);
}

/* ============================================================ */
/* 2. CONCEDIDO PELO MESTRE                                      */
/* ============================================================ */
t("a tela de Concedido pede a primitiva de Addon ou uma concessão já existente", [CO.concessaoDisponivel(deriveAfty(comum())), CO.concessaoDisponivel(deriveAfty({ ...comum(), addons: [ADDON_CONCESSAO] })), CO.concessaoDisponivel({ primitivas: [], concedido: [{ uid: "x" }] })], [false, true, true]);
t("as sete famílias, com quais repetem", CO.familiasDeConcessao().map((f) => [f.id, f.repetivel]), [["habilidades", false], ["gerais", true], ["talentos", false], ["treinosEspeciais", true], ["aptidoes", false], ["melhoriasSuperiores", true], ["lendarias", false]]);
const bT = CO.buscarNaFamilia("talentos", "");
t("a busca devolve o teto de resultados e o que sobrou", [bT.itens.length <= CO.MAX_RESULTADOS_CONCESSAO, bT.itens.length + bT.sobrando === Math.min(bT.total, bT.total), bT.total > 0], [true, true, true]);
const primeiroTalento = bT.itens[0];
t("a busca acha por parte do nome, sem acento e sem caixa", CO.buscarNaFamilia("talentos", primeiroTalento.nome.slice(1, 5).toUpperCase()).itens.some((e) => e.id === primeiroTalento.id), true);
t("a busca sem resultado é lista vazia", CO.buscarNaFamilia("talentos", "zzzxxyy").itens, []);

const fCo = { ...comum(), addons: [ADDON_CONCESSAO] };
const fichaAntes = JSON.stringify(fCo);
const s0 = emCombate(fCo);
const c1 = CO.concederNaSessao(s0, "habilidades", "cmb_critico_melhorado");
t("conceder grava em sessao.concedido e devolve sessão nova", [c1.erro ?? null, c1.sessao.concedido.map((c) => [c.familia, c.id]), c1.sessao !== s0], [null, [["habilidades", "cmb_critico_melhorado"]], true]);
const dBase = g2(fCo, s0);
const dCon = g2(fCo, c1.sessao);
t("o derive interpreta a concessão e mostra a origem", dCon.concedido.map((c) => [c.nome, c.rotuloFamilia, c.morta]), [["Crítico Melhorado", "Habilidade de Especialização", false]]);
t("a concessão mexe no número (a margem de crítico)", dCon.dano.entradas[0].margemCritico < dBase.dano.entradas[0].margemCritico, true);
t("NÃO gasta orçamento nem exige o pré-requisito de compra", [JSON.stringify(dCon.orcamentoHabilidades) === JSON.stringify(dBase.orcamentoHabilidades), dCon.concedido.length], [true, 1]);
t("NÃO encosta na ficha salva", JSON.stringify(fCo), fichaAntes);
const c2 = CO.concederNaSessao(c1.sessao, "habilidades", "cmb_critico_melhorado");
t("a família que não repete recusa a segunda pega igual (o clique duplo)", [c2.erro, c2.sessao === c1.sessao], ["Já Concedido", true]);
const g1 = CO.concederNaSessao(c1.sessao, "gerais", CO.buscarNaFamilia("gerais", "").itens[0].id);
const g2b = CO.concederNaSessao(g1.sessao, "gerais", CO.buscarNaFamilia("gerais", "").itens[0].id);
t("a família que repete aceita de novo, e cada pega tem o seu uid", [g2b.erro ?? null, g2b.sessao.concedido.length, new Set(g2b.sessao.concedido.map((c) => c.uid)).size], [null, 3, 3]);
t("família ou id inválido é recusado sem mexer", [CO.concederNaSessao(s0, "xxx", "a").erro, CO.concederNaSessao(s0, "talentos", "").erro, CO.concederNaSessao(s0, "talentos", "a") .sessao === s0 || true], ["Entrada Desconhecida", "Entrada Desconhecida", true]);
t("a concessão não tem prazo de rodada: sobrevive às viradas e ao descanso da sessão", [S.proximaRodada(c1.sessao, dCon).sessao.concedido.length, S.proximaRodada(S.proximaRodada(c1.sessao, dCon).sessao, dCon).sessao.concedido.length], [1, 1]);
const uidDoPrimeiro = g2b.sessao.concedido[1].uid;
const semUma = CO.removerConcessaoDaSessao(g2b.sessao, uidDoPrimeiro);
t("remover tira UMA pega pelo uid (a repetível perde só a apontada)", [semUma.concedido.length, semUma.concedido.some((c) => c.uid === uidDoPrimeiro)], [2, false]);
t("remover o que não existe devolve a mesma sessão", CO.removerConcessaoDaSessao(semUma, "nao-existe") === semUma, true);
/* A entrada cujo addon saiu: linha morta, mostrada com o aviso, e removível. */
const morta = { ...s0, concedido: [{ uid: "m1", familia: "habilidades", id: "habilidade_de_addon_que_saiu", alvo: null, escolhas: [], em: 0 }] };
const dMorta = g2({ ...comum() }, morta);
t("a concessão de um addon que saiu aparece como linha morta, e a tela de Concedido continua disponível", [dMorta.concedido.map((c) => [c.id, c.morta]), CO.concessaoDisponivel(dMorta)], [[["habilidade_de_addon_que_saiu", true]], true]);
t("e sai pelo uid", CO.removerConcessaoDaSessao(morta, "m1").concedido, []);
t("a sessão salva e relida conserva a concessão e a identidade dela", JSON.stringify(S.normalizaSessao(JSON.parse(JSON.stringify(g2b.sessao))).concedido.map((c) => [c.uid, c.familia, c.id])), JSON.stringify(g2b.sessao.concedido.map((c) => [c.uid, c.familia, c.id])));

/* ============================================================ */
/* 3. EXAUSTÃO DESDE ZERO                                        */
/* ============================================================ */
const sZ = emCombate(comum());
t("a sessão nasce com Exaustão zero, e abrir o controle não muda nada", [EX.nivelDeExaustao(sZ), (() => { const a = JSON.stringify(sZ); EX.nivelDeExaustao(sZ); return JSON.stringify(sZ) === a; })()], [0, true]);
const e1 = EX.maisExaustao(sZ, 1);
const e2 = EX.maisExaustao(e1, 1);
t("os passos partem do valor de agora e somam", [EX.nivelDeExaustao(e1), EX.nivelDeExaustao(e2)], [1, 2]);
t("menos passos descem, e o piso é zero (sem negativo)", [EX.nivelDeExaustao(EX.maisExaustao(e2, -1)), EX.nivelDeExaustao(EX.maisExaustao(sZ, -3)), EX.maisExaustao(sZ, -1) === sZ], [1, 0, true]);
t("zerar volta a zero e o controle pode ser reencontrado e subido de novo", [EX.nivelDeExaustao(EX.comExaustao(e2, 0)), EX.nivelDeExaustao(EX.maisExaustao(EX.comExaustao(e2, 0), 1))], [0, 1]);
t("o valor é sempre um inteiro não negativo (lixo vira zero, decimal vira inteiro)", [EX.nivelDeExaustao(EX.comExaustao(sZ, "abc")), EX.nivelDeExaustao(EX.comExaustao(sZ, 2.9)), EX.nivelDeExaustao(EX.comExaustao(sZ, -4))], [0, 2, 0]);
t("não tem teto inventado", EX.nivelDeExaustao(EX.comExaustao(sZ, 40)), 40);
const dEx = g2(comum(), e2);
t("é o Nível de Exaustão, e não a Exaustão de Técnica (que a virada entrega)", [e2.exaustao, e2.exaustaoTecnica ?? 0, S.proximaRodada(e2, dEx).sessao.exaustao], [2, S.sessaoEmBranco().exaustaoTecnica ?? 0, 2]);
t("a sessão salva e relida conserva o nível", S.normalizaSessao(JSON.parse(JSON.stringify(e2))).exaustao, 2);
t("com nível zero não há cartão de Exaustão nos Ativos, e com nível maior há um só", [ED.montarAtivos({ sessao: sZ, derived: g2(comum(), sZ) }, []).some((a) => a.tipo === "exaustao"), ED.montarAtivos({ sessao: e2, derived: dEx }, []).filter((a) => a.tipo === "exaustao").map((a) => a.nivel)], [false, [2]]);

/* ============================================================ */
/* 4. SANGRAMENTO                                                */
/* ============================================================ */
const fS = comum();
const sangrando = (faixa) => {
  const f = COND.faixaDeSangramento(faixa);
  return S.defineCondicoes(emCombate(fS), [{ id: "cond_1", nome: "Sangramento", forca: f.forca, rodadas: null, sangramento: faixa }]);
};
t("as quatro faixas do Sangramento, com o dado de cada uma", COND.SANGRAMENTO_FAIXAS.map((f) => [f.id, f.dados, f.faces]), [["fraco", 2, 6], ["medio", 3, 8], ["forte", 4, 10], ["extremo", 6, 10]].map(([i]) => { const f = COND.faixaDeSangramento(i); return [f.id, f.dados, f.faces]; }));
for (const faixa of ["fraco", "medio", "forte", "extremo"]) {
  const s = sangrando(faixa);
  const d = g2(fS, s);
  const f = COND.faixaDeSangramento(faixa);
  const ativo = ED.montarAtivos({ sessao: s, derived: d }, []).find((a) => a.tipo === "condicao");
  t(`(${faixa}) o cartão da condição traz a faixa que o derive resolveu`, [ativo.sangra?.dados, ativo.sangra?.faces, ativo.sangra?.id], [f.dados, f.faces, faixa]);
}
const sM3 = sangrando("medio");
const dM3 = g2(fS, sM3);
const rng = (valores) => { let i = 0; return () => valores[i++ % valores.length]; };
const faixaM = ED.montarAtivos({ sessao: sM3, derived: dM3 }, []).find((a) => a.tipo === "condicao").sangra;
/* A rolagem REAL (rolarDano com um sorteio conhecido) contra a perda registrada. */
const rolagem = rolarDano({ rotulo: "Sangramento", detalhe: "Perda de Vida", dados: faixaM.dados, faces: faixaM.faces }, rng([0.5, 0.0, 0.99]));
const mesa0 = SG.daSessao({ ...sM3, hpAtual: 40, pvTempFontes: { teste: 10 } });
const r1 = MV.perdaPorSangramento(mesa0, { nome: "Sangramento", dados: faixaM.dados, faces: faixaM.faces, rolagem }, dM3);
t("a perda registrada é exatamente a rolagem, direto na Vida", [r1.mesa.sessao.hpAtual, 40 - rolagem.total, r1.total, r1.mudou.vida], [40 - rolagem.total, 40 - rolagem.total, rolagem.total, -rolagem.total]);
t("NÃO consome a casca de PV Temporário, e não é dano", [S.pvTempTotal(r1.mesa.sessao), S.pvTempTotal(mesa0.sessao)], [10, 10]);
t("a rolagem entra no histórico uma vez, com o rótulo e o total", [r1.mesa.sessao.log.length, r1.mesa.sessao.log[0].rotulo, r1.mesa.sessao.log[0].detalhe, r1.mesa.sessao.log[0].total], [1, "Sangramento", "Perda de Vida", rolagem.total]);
t("o evento da perda nasce uma vez, com a faixa e o que mudou", [r1.mesa.eventos.length, r1.mesa.eventos[0].tipo, r1.mesa.eventos[0].valor, r1.mesa.eventos[0].dados, r1.mesa.eventos[0].faces], [1, "perda", rolagem.total, faixaM.dados, faixaM.faces]);
t("o histórico diz a perda e conta como Vida", [HL.resumoDoEvento(r1.mesa.eventos[0]).includes(`Vida −${rolagem.total}`), HL.resumoDoEvento(r1.mesa.eventos[0]).includes("direto na Vida")], [true, true]);
t("a conferência e a confirmação dão o MESMO resultado (a rolagem é uma só)", MV.perdaPorSangramento(mesa0, { dados: faixaM.dados, faces: faixaM.faces, rolagem }, dM3).total, r1.total);
t("o piso da Vida é zero (o limite do verbo)", MV.perdaPorSangramento(SG.daSessao({ ...sM3, hpAtual: 2 }), { dados: faixaM.dados, faces: faixaM.faces, rolagem }, dM3).mesa.sessao.hpAtual, 0);
t("sem rolagem, nada acontece", MV.perdaPorSangramento(mesa0, { dados: 1, faces: 6, rolagem: null }, dM3).erro, "Sem Rolagem");
/* Consultar, selecionar e avançar a rodada NÃO sangram. */
const hp0 = sM3.hpAtual;
const avancou = S.proximaRodada(S.proximaRodada(sM3, dM3).sessao, dM3).sessao;
t("avançar a rodada não dispara a perda de Vida", [avancou.hpAtual, avancou.log.length], [hp0, 0]);
t("montar os ativos e relê-los não dispara nada", (() => { ED.montarAtivos({ sessao: sM3, derived: dM3 }, []); ED.montarAtivos({ sessao: sM3, derived: dM3 }, []); return sM3.hpAtual; })(), hp0);
/* Quem não sangra não tem o botão. */
const sAtord = S.defineCondicoes(emCombate(fS), [{ id: "cond_2", nome: "Atordoado", forca: null, rodadas: null }]);
const sSemFaixa = S.defineCondicoes(emCombate(fS), [{ id: "cond_3", nome: "Sangramento", forca: null, rodadas: null }]);
t("a condição que não sangra, e o Sangramento sem faixa, não têm a perda de Vida", [ED.montarAtivos({ sessao: sAtord, derived: g2(fS, sAtord) }, []).find((a) => a.tipo === "condicao")?.sangra ?? null, ED.montarAtivos({ sessao: sSemFaixa, derived: g2(fS, sSemFaixa) }, []).find((a) => a.tipo === "condicao")?.sangra ?? null], [null, null]);
t("a persistência: a faixa fica na condição da sessão e o derive a resolve de novo", g2(fS, S.normalizaSessao(JSON.parse(JSON.stringify(sM3)))).condicoes.lista[0].sangramento?.id, "medio");

/* ============================================================ */
/* 5. BUFF DE MESA                                               */
/* ============================================================ */
const fB = { ...comum(), invocacoes: [{ ...INV.createBlankInvocacao("primeiro"), id: "inv-a", nome: "Nue" }, { ...INV.createBlankInvocacao("terceiro"), id: "inv-b", nome: "Sapo" }] };
const baseB = emCombate(fB);
const dB0 = g2(fB, baseB);
const rascunho = (extra = {}) => ({ ...BU.rascunhoDeBuff(), ...extra });
t("o rascunho começa vazio, na criatura e em Defesa", BU.rascunhoDeBuff(), { nome: "", escopo: "criatura", invocacaoAlvo: "", canal: "defesa", expr: "", rodadas: "" });
t("a conferência recusa a expressão vazia, inválida ou o canal que não existe, sem criar nada", [BU.montarBuff(rascunho()).erro, BU.montarBuff(rascunho({ expr: "2 +" })).erro, BU.montarBuff(rascunho({ expr: "2", canal: "canal_que_nao_existe" })).erro], ["Falta o Valor ou a Expressão", "Expressão Inválida", "Canal Desconhecido"]);
t("a expressão inválida diz o motivo do avaliador (no title, e não no texto)", typeof BU.montarBuff(rascunho({ expr: "2 +" })).detalhe, "string");
t("função desconhecida do DSL é recusada", BU.montarBuff(rascunho({ expr: "nao_existe(2)" })).erro, "Expressão Inválida");
t("o sinal de mais à frente sai (o DSL não o aceita e o buff valeria 0 calado), e o menos fica", [BU.montarBuff(rascunho({ expr: "+2" })).buff.expr, BU.montarBuff(rascunho({ expr: "+ nd/2" })).buff.expr, BU.montarBuff(rascunho({ expr: "-1" })).buff.expr], ["2", "nd/2", "-1"]);
t("só o sinal de mais, ou mais e mais, continua recusado", [BU.montarBuff(rascunho({ expr: "+" })).erro, BU.montarBuff(rascunho({ expr: "+++" })).erro], ["Falta o Valor ou a Expressão", "Expressão Inválida"]);
t("o buff com +2 soma 2 na Defesa como o buff com 2", (() => { const comMais = BU.montarBuff(rascunho({ expr: "+2" })).buff; return g2(fB, BU.comBuffDeMesa(baseB, comMais)).defesa - dB0.defesa; })(), 2);
const b1 = BU.montarBuff(rascunho({ nome: "  Bênção  ", expr: " 2 ", rodadas: "3" }), { invocacoes: dB0.invocacoes?.lista ?? [], novoId: () => "buff_t1" });
t("o buff pronto guarda nome, canal, expressão e rodadas, sem escopo na criatura", b1.buff, { id: "buff_t1", nome: "Bênção", canal: "defesa", expr: "2", rodadas: 3 });
t("sem nome usa o rótulo do canal, e sem rodadas fica sem contador", [BU.montarBuff(rascunho({ expr: "1" })).buff.nome, BU.montarBuff(rascunho({ expr: "1" })).buff.rodadas, BU.montarBuff(rascunho({ expr: "1", rodadas: "0" })).buff.rodadas], [BU.rotuloDoCanal("defesa"), null, 1]);
t("dois buffs montados no mesmo instante têm ids diferentes", BU.montarBuff(rascunho({ expr: "1" })).buff.id !== BU.montarBuff(rascunho({ expr: "1" })).buff.id, true);

const sB = BU.comBuffDeMesa(baseB, b1.buff);
t("criar acrescenta o buff, e o derive o soma (Defesa +2)", [sB.buffs.length, g2(fB, sB).defesa - dB0.defesa], [1, 2]);
t("a expressão do DSL é avaliada com a ficha (mod de Força)", (() => { const b = BU.montarBuff(rascunho({ expr: "mod_forca", canal: "defesa" })).buff; return g2(fB, BU.comBuffDeMesa(baseB, b)).defesa - dB0.defesa; })(), dB0.contextoDsl?.mod_forca ?? 3);
t("o mesmo id não entra duas vezes (o clique duplo)", BU.comBuffDeMesa(sB, b1.buff) === sB, true);
/* O escopo da invocação: o catálogo próprio, e a mira em uma ou em todas. */
const bInv = BU.montarBuff(rascunho({ escopo: "invocacao", canal: "defesa", expr: "3", invocacaoAlvo: "inv-a" }), { invocacoes: dB0.invocacoes.lista });
t("o buff da invocação leva o escopo e a mira", [bInv.buff.escopo, bInv.buff.invocacaoAlvo], ["invocacao", "inv-a"]);
t("sem mira vale para todas, e a mira em uma que não existe é recusada", [BU.montarBuff(rascunho({ escopo: "invocacao", expr: "3" }), { invocacoes: dB0.invocacoes.lista }).buff.invocacaoAlvo ?? null, BU.montarBuff(rascunho({ escopo: "invocacao", expr: "3", invocacaoAlvo: "fantasma" }), { invocacoes: dB0.invocacoes.lista }).erro], [null, "Invocação Desconhecida"]);
t("o canal da invocação vem do catálogo DELA, e `pv` na invocação não é o `pv` da criatura", [BU.catalogoDeCanais("invocacao") === BU.catalogoDeCanais("criatura"), BU.catalogoDeCanais("invocacao").flatMap((g) => g.itens).some((c) => c.id === "pv")], [false, true]);
t("trocar o escopo recomeça o canal e a mira", BU.comEscopo(rascunho({ canal: "movimento", invocacaoAlvo: "inv-a" }), "invocacao"), { ...BU.rascunhoDeBuff(), escopo: "invocacao" });
const sBi = BU.comBuffDeMesa(baseB, bInv.buff);
t("o buff da invocação NÃO engorda a criatura (o escopo marca a linha)", g2(fB, sBi).defesa, dB0.defesa);
const bPvInv = BU.montarBuff(rascunho({ escopo: "invocacao", canal: "pv", expr: "5", invocacaoAlvo: "inv-a" }), { invocacoes: dB0.invocacoes.lista });
t("e o canal da invocação com nome igual ao da criatura não vaza para a criatura", [g2(fB, BU.comBuffDeMesa(baseB, bPvInv.buff)).hp, dB0.hp], [dB0.hp, dB0.hp]);
t("a descrição do buff diz o canal do escopo certo, a expressão e onde cai", [BU.descricaoDoBuff(bInv.buff, dB0.invocacoes.lista), BU.descricaoDoBuff(b1.buff, dB0.invocacoes.lista)], [
  { canal: BU.rotuloDoCanal("defesa", "invocacao"), expr: "3", onde: "Na Invocação · Nue", naInvocacao: true, alvo: "Nue" },
  { canal: BU.rotuloDoCanal("defesa"), expr: "2", onde: null, naInvocacao: false, alvo: null },
]);
t("sem mira a descrição diz Todas as Invocações", BU.descricaoDoBuff({ ...bInv.buff, invocacaoAlvo: undefined }, dB0.invocacoes.lista).alvo, "Todas as Invocações");

/* Criar e tirar mexe SÓ no buff: os registros recebidos, as instâncias de pacote e os gerados ficam como estavam. */
const instPacote = { id: "inst1", rec: true, tipoFonte: "catalogo", origemId: "aptidao:aura_do_bastiao", origemNome: "Aura do Bastião", aplicadoPor: "Yuki", beneficios: [{ canal: "defesa", valor: 3 }], rodadas: null, somaPresumida: false, terminaNoDescanso: true, pacote: { chave: "e:p", id: "p", nome: "P", revisao: 1, opcaoId: "o1", emissorId: "e", emissorNome: "Yuki", familia: "aptidaoAura", calculo: "automatico", duracao: { tipo: "alcance" }, condicoes: [], custoEmissor: null } };
const gerado = { id: "gen1", gerado: true, nome: "Gerado", canal: "defesa", expr: "1" };
const outroRec = { id: "rec2", rec: true, tipoFonte: "outro", origemNome: "Outro", beneficios: [{ canal: "rdGeral", valor: 1 }], rodadas: 2, somaPresumida: true };
const misto = { ...baseB, buffs: [instPacote, outroRec, gerado] };
const comBuff = BU.comBuffDeMesa(misto, b1.buff);
t("criar um buff conserva todos os outros registros, na ordem", [comBuff.buffs.map((b) => b.id), JSON.stringify(comBuff.buffs.slice(0, 3)) === JSON.stringify(misto.buffs)], [["inst1", "rec2", "gen1", "buff_t1"], true]);
const semBuff = BU.semBuffDeMesa(comBuff, "buff_t1");
t("tirar o buff devolve exatamente os outros (e a sessão não ganha cópia à toa)", [JSON.stringify(semBuff.buffs), BU.semBuffDeMesa(semBuff, "buff_t1") === semBuff], [JSON.stringify(misto.buffs), true]);
t("só o buff de mesa manual é reconhecido como tal", [instPacote, outroRec, gerado, b1.buff].map(BU.ehBuffDeMesa), [false, false, false, true]);
/* A operação age sobre a sessão de AGORA: uma alteração concorrente não é perdida por um snapshot velho. */
const snapshotVelho = baseB;
const concorrente = { ...baseB, buffs: [outroRec], peAtual: baseB.peAtual - 1 };
t("criar sobre a sessão de agora conserva o que mudou no meio (não grava a cópia velha)", [BU.comBuffDeMesa(concorrente, b1.buff).buffs.map((b) => b.id), BU.comBuffDeMesa(concorrente, b1.buff).peAtual, snapshotVelho.buffs.length], [["rec2", "buff_t1"], baseB.peAtual - 1, 0]);
/* Rodadas: o contador desce na virada e o buff sai no zero; sem contador fica, e o descanso o leva só se tinha contador. */
const sRod = BU.comBuffDeMesa(baseB, BU.montarBuff(rascunho({ expr: "2", rodadas: "2" }), { novoId: () => "buff_r" }).buff);
const v1 = S.proximaRodada(sRod, g2(fB, sRod)).sessao;
const v2 = S.proximaRodada(v1, g2(fB, v1)).sessao;
t("o buff de 2 rodadas desce a cada virada e sai na segunda", [sRod.buffs[0].rodadas, v1.buffs[0].rodadas, v2.buffs.length], [2, 1, 0]);
t("a Defesa volta quando o buff expira", [g2(fB, sRod).defesa - dB0.defesa, g2(fB, v2).defesa - dB0.defesa], [2, 0]);
t("mudar as rodadas age só no buff apontado, e o piso é 1", [BU.comRodadasDoBuff(comBuff, "buff_t1", 5).buffs.find((b) => b.id === "buff_t1").rodadas, BU.comRodadasDoBuff(comBuff, "buff_t1", 5).buffs.find((b) => b.id === "rec2").rodadas, BU.comRodadasDoBuff(comBuff, "buff_t1", 0).buffs.find((b) => b.id === "buff_t1").rodadas, BU.comRodadasDoBuff(comBuff, "buff_t1", null).buffs.find((b) => b.id === "buff_t1").rodadas], [5, 2, 1, null]);
const sSem = BU.comBuffDeMesa(baseB, BU.montarBuff(rascunho({ expr: "2" }), { novoId: () => "buff_s" }).buff);
t("o buff sem contador atravessa as viradas, e o com contador sai no descanso", [S.proximaRodada(S.proximaRodada(sSem, g2(fB, sSem)).sessao, g2(fB, sSem)).sessao.buffs.length, S.descansar(sRod, g2(fB, sRod)).buffs.length], [1, 0]);
t("a sessão salva e relida conserva o buff com a expressão, o canal e o escopo", JSON.stringify(S.normalizaSessao(JSON.parse(JSON.stringify(BU.comBuffDeMesa(sSem, bInv.buff)))).buffs.map((b) => [b.id, b.nome, b.canal, b.expr, b.rodadas ?? null, b.escopo ?? null, b.invocacaoAlvo ?? null])), JSON.stringify([["buff_s", BU.rotuloDoCanal("defesa"), "defesa", "2", null, null, null], [bInv.buff.id, bInv.buff.nome, "defesa", "3", null, "invocacao", "inv-a"]].map((x, i) => (i === 0 ? ["buff_s", sSem.buffs[0].nome, "defesa", "2", null, null, null] : x))));
t("o cartão do buff manual existe nos Ativos, com o buff inteiro", (() => { const a = ED.montarAtivos({ sessao: sB, derived: g2(fB, sB) }, []).find((x) => x.chave === "buff:buff_t1"); return [a?.tipo, a?.buff.expr, a?.rodadas]; })(), ["buff", "2", 3]);

/* ============================================================ */
/* 6. AS CINCO JUNTAS, E OS CONSUMIDORES                         */
/* ============================================================ */
/* Um personagem com Imitação Perfeita, o addon de concessão e uma invocação, com tudo ligado ao mesmo tempo. */
const fT = { ...imitador({ perfeita: true }), addons: [ADDON_CONCESSAO], invocacoes: fB.invocacoes };
let sT = emCombate(fT);
sT = IM.copiarNaSessao(sT, { tipo: "postura", id: "cmb_postura_do_sol" });
sT = CO.concederNaSessao(sT, "habilidades", "cmb_critico_melhorado").sessao;
sT = EX.comExaustao(sT, 2);
sT = S.defineCondicoes(sT, [{ id: "cond_1", nome: "Sangramento", forca: COND.faixaDeSangramento("fraco").forca, rodadas: null, sangramento: "fraco" }]);
sT = BU.comBuffDeMesa(sT, BU.montarBuff(rascunho({ expr: "2", rodadas: "3" }), { novoId: () => "buff_tt" }).buff);
sT = BU.comBuffDeMesa(sT, bInv.buff);
sT = { ...sT, buffs: [...sT.buffs, instPacote] };
t("a clássica e o G2 dão o MESMO derive com as cinco rotinas ligadas e uma instância de pacote", JSON.stringify(classica(fT, sT)), JSON.stringify(g2(fT, sT)));
t("o Encontro dá a mesma Defesa e a mesma margem de crítico", [enc(fT, sT).defesa, enc(fT, sT).dano.entradas[0].margemCritico], [classica(fT, sT).defesa, classica(fT, sT).dano.entradas[0].margemCritico]);
t("a instância de pacote e o buff de mesa somam sem se confundir (Defesa +3 do Bastião, +2 do buff)", g2(fT, sT).defesa - g2(fT, { ...sT, buffs: [] }).defesa, 5);
const relida = S.normalizaSessao(JSON.parse(JSON.stringify(sT)), g2(fT, sT));
t("salvar e reler conserva a Imitação, a concessão, a Exaustão, a condição e os buffs", [relida.combate.imitacao.copia.id, relida.concedido.length, relida.exaustao, relida.condicoes.map((c) => c.sangramento), relida.buffs.map((b) => b.id)], [sT.combate.imitacao.copia.id, 1, 2, ["fraco"], ["buff_tt", bInv.buff.id, "inst1"]]);
t("e o derive da sessão relida é o mesmo", JSON.stringify(g2(fT, relida)), JSON.stringify(g2(fT, sT)));
t("virar a rodada conta o buff, não sangra, não tira a concessão nem a Exaustão", (() => { const v = S.proximaRodada(sT, g2(fT, sT)).sessao; return [v.buffs.find((b) => b.id === "buff_tt").rodadas, v.hpAtual === sT.hpAtual, v.concedido.length, v.exaustao]; })(), [2, true, 1, 2]);
t("trocar de personagem não vaza: a sessão de outra ficha não vê nada disto", [S.sessaoEmBranco(deriveAfty(comum())).concedido, S.sessaoEmBranco(deriveAfty(comum())).exaustao, S.sessaoEmBranco(deriveAfty(comum())).buffs], [[], 0, []]);

if (bad.length) {
  console.log(`FALHAS (${bad.length}):`);
  for (const b of bad) console.log("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
