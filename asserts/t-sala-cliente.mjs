/* O CLIENTE DA SALA (`src/nuvem/sala-*.js`, Encontro Unificado, etapa 7b, 2026-11-18): as peças puras.

   O tempo real, o conflito de versão contra o banco e as duas contas ficam na prova de ponta a ponta (Playwright, registrada
   no progresso). Aqui, o que decide sem rede:
     1. o Apelido Opaco (decisão do autor, 2026-11-18): uma criatura Oculta que age num personagem não deixa o id nem o
        detalhe da rolagem na sessão que o dono lê, e o aparelho do Mestre volta ao id de verdade;
     2. o id do personagem na Sala carrega o id da ficha (o ausente acha a ficha sem a linha da ficha, que o banco apaga);
     3. a mesclagem das duas pontas: a diferença de um lado por cima da versão do outro não perde nenhum dos dois;
     4. o Encontro Finalizado de quem não é o Mestre: o Registro que ele recebeu, o personagem ligado com a sessão final, os
        outros como marcadores, frases sem ponto e vírgula e sem travessão, e o Encontro passa pelo saneamento;
     5. o cache da Sala fica fora da nuvem pessoal (prefixo `sala_`);
     6. a ação em grupo devolve as operações que mediu (o registro da Sala as grava). */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  key: (i) => [...mem.keys()][i] ?? null,
  get length() { return mem.size; },
};
const A = new URL("../src/systems/afty/", import.meta.url).href;
const E = A + "encontros/";
const N = new URL("../src/nuvem/", import.meta.url).href;
const { deriveAfty } = await import(A + "afty-derive.js");
const { createBlankAfty } = await import(A + "afty-schema.js");
const S = await import(A + "ficha/ficha-sessao.js");
await import(E + "motores/index.js");
const M = await import(E + "modelo.js");
const O = await import(E + "operacoes.js");
const { redutorDoEncontro: R, mundoDe } = await import(E + "redutor.js");
const { reaplicarSobre } = await import(E + "usar-encontro.js");
const Oc = await import(N + "sala-oculto.js");
const C = await import(N + "sala-cliente.js");
const F = await import(N + "sala-fechamento.js");
const Cfg = await import(N + "nuvem-config.js");
const { readFileSync, readdirSync } = await import("node:fs");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};
let n = 0;
const gerarId = (p) => `${p}_t${n++}`;
let relogio = 9000;
const agora = () => relogio++;

/* ---------- as fichas ---------- */
const comCore = (core, extra) => {
  const f = createBlankAfty();
  return { ...f, ...extra, core: { ...f.core, ...core } };
};
const liaF = comCore({ nd: 5 }, { id: "lia-1", name: "Lia", rulesVersion: "player", system: "player", especializacoes: [{ id: "combatente", nivel: 5 }] });
const ogroF = comCore({ nd: 12, tipo: "combatente", origem: { id: "inato" } }, { id: "ogro", name: "Ogro Escondido", rulesVersion: "afty" });
const dLia = deriveAfty(liaF);
const dOgro = deriveAfty(ogroF);

/* ============================================================ */
/* 1. O Apelido Opaco                                            */
/* ============================================================ */
{
  const SEGREDO = "segredo-da-sala";
  t("o apelido é estável para o mesmo id e segredo", Oc.apelidoDe(SEGREDO, "c_ogro"), Oc.apelidoDe(SEGREDO, "c_ogro"));
  t("o apelido muda com o segredo", Oc.apelidoDe(SEGREDO, "c_ogro") === Oc.apelidoDe("outro", "c_ogro"), false);
  t("o apelido não contém o id", Oc.apelidoDe(SEGREDO, "c_ogro").includes("ogro"), false);
  t("o apelido tem o prefixo", Oc.ehApelido(Oc.apelidoDe(SEGREDO, "c_ogro")), true);

  const mapa = new Map([["x", "y"]]);
  const sem = { a: [1, "z"], b: { c: "w" } };
  t("trocarIds devolve o MESMO objeto quando nada muda", Oc.trocarIds(sem, mapa) === sem, true);
  t("trocarIds troca valor e chave, em profundidade", Oc.trocarIds({ x: ["x", { k: "x" }], o: "x" }, mapa), { y: ["y", { k: "y" }], o: "y" });
  // O Provocar marca o uso no alvo com o id de quem provocou dentro do texto.
  const idOgro = "cmb_lx9k2_3_ab1cd";
  const ap = Oc.apelidoDe(SEGREDO, idOgro);
  const provocado = { uso: { ativos: { [`provocar:${idOgro}`]: { id: `provocar:${idOgro}`, origem: "provocar" } } }, log: [{ contextoConteudo: { fonteId: idOgro } }] };
  const provDono = Oc.sessaoParaODono(provocado, { segredo: SEGREDO, ocultos: [idOgro] });
  t("o id dentro de um texto também vira apelido (chave e valor)", JSON.stringify(provDono).includes(idOgro), false);
  t("e o texto guarda o apelido no lugar", Object.keys(provDono.uso.ativos), [`provocar:${ap}`]);
  t("o Mestre volta ao texto de verdade", Oc.sessaoDoMestre(provDono, { segredo: SEGREDO, ids: [idOgro, "pj:lia-1"] }), provocado);

  // O Ogro, Oculto, põe um Efeito de 2 rodadas na Lia, com a rolagem dele. É o caminho da operação genérica (a G2 embutida).
  let m = mundoDe(M.criarEncontro({ grupo: "site", id: "e7b", agora }), {}, { "lia-1": liaF });
  m = R(m, { tipo: "ADICIONAR", combatente: M.criarPersonagem(liaF, { chave: "fm_creatures_player_v1", derived: dLia, id: "pj:lia-1", dono: { conta: "conta-jogador", papel: "jogador" } }), sessao: S.sessaoEmBranco(dLia), iniciativa: 12 });
  m = R(m, { tipo: "ADICIONAR", combatente: M.criarCriatura(ogroF, { derived: dOgro, id: "c_ogro" }), iniciativa: 15 });
  t("a criatura nasce Oculta", M.combatenteDe(m.encontro, "c_ogro").visao, "oculta");
  const r = O.operar(m, {
    tipo: "sessao", alvo: "pj:lia-1",
    autor: { conta: "conta-mestre", papel: "mestre", combatente: "c_ogro" },
    entrada: { rolagem: { rotulo: "Garra do Ogro Escondido", total: 14 }, valor: 14 },
    passo: (s) => ({ ...s, buffs: [...(s.buffs ?? []), { id: "bv", nome: "Veneno", canal: "defesa", expr: "-2", rodadas: 2 }] }),
  }, { derivados: { "pj:lia-1": dLia, c_ogro: dOgro }, gerarId, agora });
  t("a operação do Ogro aplicou", r.ok, true);
  const sessaoMestre = r.mundo.sessoes["lia-1"];
  t("na sessão do Mestre o Efeito guarda o id do Ogro (a duração desce no turno dele)", sessaoMestre.buffs.find((b) => b.id === "bv").aplicadorId, "c_ogro");
  t("e o histórico da Lia guarda o Ogro como autor", sessaoMestre.historico[0].autor.combatente, "c_ogro");

  const ocultos = m.encontro.combatentes.filter((c) => c.tipo !== "personagem" && c.visao === "oculta").map((c) => c.id);
  const doDono = Oc.sessaoParaODono(sessaoMestre, { segredo: SEGREDO, ocultos });
  const texto = JSON.stringify(doDono);
  t("na sessão que sobe para o dono, nenhum id do Ogro", texto.includes("c_ogro"), false);
  t("nenhum nome do Ogro (o rótulo da rolagem saiu)", texto.includes("Ogro"), false);
  t("o Efeito leva o apelido", doDono.buffs.find((b) => b.id === "bv").aplicadorId, Oc.apelidoDe(SEGREDO, "c_ogro"));
  t("o valor rolado fica no histórico", doDono.historico[0].entrada.valor, 14);
  t("o histórico segue com o id da operação (o Desfazer acha)", doDono.historico[0].id, sessaoMestre.historico[0].id);
  const deVolta = Oc.sessaoDoMestre(doDono, { segredo: SEGREDO, ids: m.encontro.combatentes.map((c) => c.id) });
  t("o aparelho do Mestre volta ao id de verdade", deVolta.buffs.find((b) => b.id === "bv").aplicadorId, "c_ogro");
  t("e o histórico também", deVolta.historico[0].autor.combatente, "c_ogro");
  t("sem Oculta, a sessão sobe como está (o mesmo objeto)", Oc.sessaoParaODono(sessaoMestre, { segredo: SEGREDO, ocultos: [] }) === sessaoMestre, true);
  const aberto = Oc.sessaoParaODono(sessaoMestre, { segredo: SEGREDO, ocultos: ["c_outro"] });
  t("criatura que não está Oculta não é trocada", aberto.buffs.find((b) => b.id === "bv").aplicadorId, "c_ogro");
}

/* ============================================================ */
/* 2. O id do personagem na Sala                                 */
/* ============================================================ */
t("o id carrega o id da ficha", Oc.idDoPersonagem("lia-1"), "pj:lia-1");
t("com sufixo, quando colidiu", Oc.idDoPersonagem("lia-1", "ab12"), "pj:lia-1:ab12");
t("id de ficha fora do formato não vira id da Sala", Oc.idDoPersonagem("lia 1"), null);
t("o ausente acha a ficha pelo id", Oc.fichaIdDoCombatente("pj:lia-1", ["outra", "lia-1"]), "lia-1");
t("e pelo id com sufixo", Oc.fichaIdDoCombatente("pj:lia-1:ab12", ["lia-1"]), "lia-1");
t("o id mais longo vence (ficha com dois-pontos)", Oc.fichaIdDoCombatente("pj:a:b", ["a", "a:b"]), "a:b");
t("ficha que o aparelho não tem não é achada", Oc.fichaIdDoCombatente("pj:lia-1", ["lia-2"]), null);
t("combatente que não é personagem da Sala", Oc.fichaIdDoCombatente("c_ogro", ["c_ogro"]), null);

/* ============================================================ */
/* 3. A mesclagem das duas pontas                                */
/* ============================================================ */
{
  const base = S.normalizaSessao({ ...S.sessaoEmBranco(dLia), log: [{ id: "l0", texto: "antes" }] }, dLia);
  // O Mestre tirou 5 de Vida (versão do banco). O jogador, ao mesmo tempo, gastou 2 PE e tomou 1 de dano (versão local).
  const doMestre = { ...base, hpAtual: base.hpAtual - 5, historico: [{ id: "op_m", delta: [] }] };
  const doJogador = { ...base, hpAtual: base.hpAtual - 1, peAtual: base.peAtual - 2, log: [{ id: "l1", texto: "dano" }, ...base.log] };
  const junta = reaplicarSobre(doMestre, base, doJogador);
  t("mesclagem: o PE do jogador fica", junta.peAtual, base.peAtual - 2);
  t("mesclagem: a Vida mexida dos dois lados soma as duas mudanças (-5 e -1)", junta.hpAtual, base.hpAtual - 6);
  t("mesclagem: o histórico do Mestre fica", junta.historico.map((h) => h.id), ["op_m"]);
  t("mesclagem: o registro do jogador entra", junta.log.map((l) => l.id), ["l1", "l0"]);
  t("mesclagem: sem mudança de fora, a versão local vai como está", reaplicarSobre(base, base, doJogador) === doJogador, true);
  t("estavel ignora a ordem das chaves", C.estavel({ b: 1, a: [1, { d: 2, c: 3 }] }), C.estavel({ a: [1, { c: 3, d: 2 }], b: 1 }));
}

/* ============================================================ */
/* 4. O Encontro Finalizado de um membro                         */
/* ============================================================ */
{
  const pub = (seq, especie, publica, estado_pedido = null) => ({ seq, especie, publica, estado_pedido, criado_em: "2026-11-18T12:00:00Z" });
  const retrato = {
    salaId: "sala-1",
    eu: { conta: "conta-jogador", papel: "jogador" },
    sala: { id: "sala-1", codigo: "K7QX2M", nome: "A Ponte", criada_em: "2026-11-18T11:00:00Z", fechada_em: "2026-11-18T13:00:00Z" },
    membros: { "conta-jogador": { conta: "conta-jogador", nome: "Bia" }, "conta-mestre": { conta: "conta-mestre", nome: "Gabi" } },
    estado: { rodada: 3 },
    resumos: {
      "pj:lia-1": { combatente: "pj:lia-1", tipo: "personagem", dono: "conta-jogador", nome: "Lia", lado: "jogador", posicao: 2 },
      c_vulto: { combatente: "c_vulto", tipo: "criatura", dono: null, nome: "Vulto", lado: "inimigo", visao: "barra", posicao: 1 },
    },
    publicas: {
      1: pub(1, "sistema", { especie: "sistema", autor: { conta: "conta-mestre", papel: "mestre" }, evento: "comecar", rodada: 1 }),
      2: pub(2, "operacao", { especie: "operacao", autor: { conta: "conta-mestre", papel: "mestre" }, tipo: "dano", alvo: { id: "pj:lia-1", nome: "Lia" }, valor: 7 }),
      3: pub(3, "chat", { especie: "chat", autor: { conta: "conta-jogador", papel: "jogador" }, texto: "Aguenta" }),
      4: pub(4, "pedido", { especie: "pedido", autor: { conta: "conta-jogador", papel: "jogador" }, tipo: "cura", alvo: { id: "c_vulto", nome: "Vulto" }, valor: 3 }, "recusado"),
      5: pub(5, "sistema", { especie: "sistema", autor: { conta: "conta-mestre", papel: "mestre" }, evento: "turno", rodada: 2, combatente: { id: "c_vulto", nome: "Vulto" } }),
    },
    operacoes: {
      10: { seq: 10, especie: "operacao", autor: "conta-mestre", criado_em: "x", dados: { id: "op1", tipo: "dano", delta: [{ caminho: ["hpAtual"] }], registros: [1] } },
      11: { seq: 11, especie: "chat", autor: "conta-jogador", criado_em: "x", dados: { id: "ch1", texto: "Aguenta" } },
      12: { seq: 12, especie: "operacao", autor: "conta-mestre", criado_em: "x", dados: { id: "op2", tipo: "cura" } },
    },
    recebidasAoVivo: { 10: true },
  };
  const reg = F.registroParaGuardar(retrato);
  t("registro do membro: as públicas em ordem", reg.publicas.map((p) => p.seq), [1, 2, 3, 4, 5]);
  t("registro do membro: as completas que chegaram ao vivo ou que ele escreveu, nunca as outras", reg.completas.map((o) => o.seq), [10, 11]);
  t("registro guardado sem o delta e os registros", Object.keys(reg.completas[0].dados).sort(), ["id", "tipo"]);
  t("registro do Mestre: todas as completas", F.registroParaGuardar(retrato, { ehMestre: true }).completas.map((o) => o.seq), [10, 11, 12]);

  const sessaoFinal = { ...S.sessaoEmBranco(dLia), hpAtual: 9 };
  const fin = F.finalizadoDoMembro({ retrato, grupo: "site", meus: [{ combatente: "pj:lia-1", fichaId: "lia-1", chave: "fm_creatures_player_v1", sessao: sessaoFinal }], registro: reg, agora: 5 });
  t("Finalizado: id estável pela Sala", fin.id, "sala_sala-1");
  t("Finalizado: status e rodada", [fin.status, fin.rodada, fin.nome], ["finalizado", 3, "A Ponte"]);
  t("Finalizado: o personagem ligado à ficha do aparelho, com a sessão final", [fin.combatentes[0].fichaRef, fin.combatentes[0].sessaoFinal.hpAtual], [{ chave: "fm_creatures_player_v1", id: "lia-1" }, 9]);
  t("Finalizado: o resto como marcador, na visão que tinha", fin.combatentes.slice(1).map((c) => [c.id, c.tipo, c.visao]), [["c_vulto", "marcador", "barra"]]);
  t("Finalizado: as frases do Registro, da mais nova para a mais antiga", fin.log.map((l) => l.mensagem), [
    "Turno de Vulto.", "Pedido Recusado: Cura 3 em Vulto.", "Bia: Aguenta", "Dano: 7 em Lia.", "Combate iniciado.",
  ]);
  t("Finalizado: frases sem ponto e vírgula e sem travessão", fin.log.some((l) => l.mensagem.includes(";") || l.mensagem.includes(String.fromCharCode(0x2014))), false);
  const norm = M.normalizarEncontro(JSON.parse(JSON.stringify(fin)));
  t("Finalizado passa pelo saneamento do Encontro", !!norm && norm.combatentes.length === 2, true);
  t("o saneamento guarda a sessão final do personagem da Sala", norm.combatentes[0].sessaoFinal?.hpAtual, 9);
  t("e guarda o Registro da Sala", norm.registroSala.publicas.length, 5);

  t("frase de rolagem", F.fraseDaPublica({ especie: "rolagem", publica: { combatente: { nome: "Lia" }, rotulo: "Acerto", total: 17 } }), "Lia: Acerto 17.");
  t("frase de rodada", F.fraseDaPublica({ especie: "sistema", publica: { evento: "rodada", rodada: 4 } }), "Rodada 4 iniciada.");
  t("frase de operação sem valor (Barra e Só Nome escondem o PE)", F.fraseDaPublica({ especie: "operacao", publica: { tipo: "gastarPe", alvo: { nome: "Vulto" } } }), "Gastar PE: em Vulto.");

  // Gravar na lista: põe no topo, e de novo troca (não duplica).
  localStorage.setItem("afty_encontros_site_v1", JSON.stringify([{ id: "outro", versao: 2 }]));
  F.gravarNaLista("site", fin);
  F.gravarNaLista("site", { ...fin, nome: "A Ponte (de novo)" });
  const lista = JSON.parse(localStorage.getItem("afty_encontros_site_v1"));
  t("gravar na lista duas vezes não duplica", lista.map((e) => e.id), ["sala_sala-1", "outro"]);
  t("jaNaLista acha o Finalizado", F.jaNaLista("site", "sala-1")?.id, "sala_sala-1");
  // O membro presente no fechamento: a sessão final vai para a loja, o Finalizado para a lista, e a Sala fica marcada.
  localStorage.setItem("fm_creatures_player_v1", JSON.stringify([liaF]));
  const g = F.gravarFinalizadoDoMembro({ ...retrato, fichas: { "pj:lia-1": { sessao: { dados: sessaoFinal, versao: 4 } } } }, "site");
  t("gravarFinalizadoDoMembro: gravou com o personagem", [g.ok, g.personagens], [true, 1]);
  t("a sessão final chegou à chave da ficha", JSON.parse(localStorage.getItem("fm_ficha_sessao_afty_v1:lia-1")).hpAtual, 9);
  t("a Sala ficou marcada como recebida", F.salasRecebidas().has("sala-1"), true);
  F.marcarRecebida("sala-1");
  t("marcar duas vezes não repete", JSON.parse(localStorage.getItem(F.CHAVE_SALAS_RECEBIDAS)).length, 1);
  t("o registro de recebidas vai para a nuvem pessoal (prefixo afty_)", Cfg.chaveDaPessoa(F.CHAVE_SALAS_RECEBIDAS), true);
  t("jaNaLista acha o Encontro do Mestre que abriu a Sala", (() => {
    localStorage.setItem("afty_encontros_v1", JSON.stringify([{ id: "enc_m", sala: { id: "sala-2" } }]));
    return F.jaNaLista("afty", "sala-2")?.id;
  })(), "enc_m");
}

/* ============================================================ */
/* 5. O cache da Sala fora da nuvem pessoal                      */
/* ============================================================ */
t("a chave do cache começa com sala_", C.CHAVE_CACHE("abc").startsWith("sala_"), true);
t("e a nuvem pessoal não a leva", Cfg.chaveDaPessoa(C.CHAVE_CACHE("abc")), false);

/* ============================================================ */
/* 6. A ação em grupo devolve as operações                       */
/* ============================================================ */
{
  let m = mundoDe(M.criarEncontro({ grupo: "site", id: "e7g", agora }), {}, {});
  m = R(m, { tipo: "ADICIONAR", combatente: M.criarCriatura(ogroF, { derived: dOgro, id: "c_o1" }), iniciativa: 3 });
  m = R(m, { tipo: "ADICIONAR", combatente: M.criarCriatura(ogroF, { derived: dOgro, id: "c_o2" }), iniciativa: 2 });
  const g = O.acaoEmGrupo(m, { acao: "dano", valor: 4, alvos: ["c_o1", "c_o2"], autor: { conta: "conta-mestre", papel: "mestre", combatente: null } },
    { derivados: { c_o1: dOgro, c_o2: dOgro }, gerarId, agora });
  t("a ação em grupo devolve uma operação por alvo", g.operacoes.map((o) => [o.alvo, o.tipo, o.grupo === g.grupo]), [["c_o1", "dano", true], ["c_o2", "dano", true]]);
  t("e os resultados de sempre", g.resultados.map((x) => x.ok), [true, true]);
}

/* ============================================================ */
/* 7. A escrita com versão (o conflito sem rede de verdade)      */
/* ============================================================ */
{
  const semEspera = () => Promise.resolve();
  const ERRO = (codigo, extra = {}) => Object.assign(new Error(codigo), { codigo, ...extra });
  // O banco falso: uma linha, com versão, e um roteiro de respostas para cada gravação.
  const banco = (inicial, roteiro = []) => {
    const b = { linha: { ...inicial }, gravacoes: [], local: { ...inicial } };
    b.deps = {
      lerAtual: () => b.local,
      guardar: (l) => { b.local = { ...b.local, ...l }; },
      esquecer: () => { b.local = null; },
      gravar: async (dados, versao) => {
        b.gravacoes.push({ dados, versao });
        const passo = roteiro.shift();
        if (passo) return passo(dados, versao);
        if (versao !== b.linha.versao) throw ERRO("Versão Mudou", { detalhe: String(b.linha.versao) });
        b.linha = { dados, versao: versao + 1, atualizado_por: "eu" };
        return b.linha.versao;
      },
      lerLinha: async () => ({ ...b.linha }),
      conta: "eu",
      esperar: semEspera,
    };
    return b;
  };
  const menosPe = (remota) => ({ ...remota, pe: remota.pe - 2 });

  // Outro aparelho gravou (Vida 25, versão 2) depois da versão que este conhecia (versão 1).
  {
    const b = banco({ dados: { hp: 30, pe: 10 }, versao: 1 });
    b.linha = { dados: { hp: 25, pe: 10 }, versao: 2, atualizado_por: "outro" };
    const r = await C.gravarComVersao(b.deps, menosPe);
    t("conflito: a segunda gravação vai com a versão nova", b.gravacoes.map((g) => g.versao), [1, 2]);
    t("conflito: a transformação foi aplicada sobre a versão do outro (Vida dele, PE nosso)", r.dados, { hp: 25, pe: 8 });
    t("conflito: o banco fica com as duas mudanças", [b.linha.dados, b.linha.versao], [{ hp: 25, pe: 8 }, 3]);
  }
  // A gravação chegou ao banco, mas a resposta se perdeu (sem rede): a mudança não pode entrar duas vezes.
  {
    let b;
    b = banco({ dados: { hp: 30, pe: 10 }, versao: 1 }, [
      (dados) => { b.linha = { dados, versao: 2, atualizado_por: "eu" }; throw ERRO("Sem Conexão", { rede: true }); },
    ]);
    const r = await C.gravarComVersao(b.deps, menosPe);
    t("resposta perdida: uma gravação só", b.gravacoes.length, 1);
    t("resposta perdida: o PE caiu UMA vez", [r.dados, r.versao], [{ hp: 30, pe: 8 }, 2]);
  }
  // Sem rede de verdade: espera e grava quando volta.
  {
    const b = banco({ dados: { hp: 30, pe: 10 }, versao: 1 }, [() => { throw ERRO("Sem Conexão", { rede: true }); }]);
    const r = await C.gravarComVersao(b.deps, menosPe);
    t("sem rede: grava na volta", [b.gravacoes.length, r.dados, b.linha.versao], [2, { hp: 30, pe: 8 }, 2]);
  }
  // Nada a mudar: não grava.
  {
    const b = banco({ dados: { hp: 30, pe: 10 }, versao: 1 });
    const r = await C.gravarComVersao(b.deps, (x) => ({ pe: x.pe, hp: x.hp }));
    t("mesmo texto (em outra ordem): não grava", [b.gravacoes.length, r.mudou], [0, false]);
  }
  // O conflito que nunca acaba desiste com "Versão Mudou".
  {
    const b = banco({ dados: { hp: 30, pe: 10 }, versao: 1 });
    b.deps.lerLinha = async () => { b.linha = { dados: { hp: b.linha.dados.hp - 1, pe: 10 }, versao: b.linha.versao + 1, atualizado_por: "outro" }; return { ...b.linha }; };
    b.deps.gravar = async (dados, versao) => { b.gravacoes.push(versao); throw ERRO("Versão Mudou"); };
    let erro = null;
    try { await C.gravarComVersao(b.deps, menosPe); } catch (e) { erro = e.codigo; }
    t("conflito sem fim: desiste depois das tentativas", [erro, b.gravacoes.length], ["Versão Mudou", 6]);
  }
  // Erro que não é de versão nem de rede sobe na hora (Sem Permissão, Sala Fechada).
  {
    const b = banco({ dados: { hp: 30, pe: 10 }, versao: 1 }, [() => { throw ERRO("Sala Fechada"); }]);
    let erro = null;
    try { await C.gravarComVersao(b.deps, menosPe); } catch (e) { erro = e.codigo; }
    t("erro do banco sobe sem tentar de novo", [erro, b.gravacoes.length], ["Sala Fechada", 1]);
  }
}

/* ============================================================ */
/* 8. Nada de travessão nos arquivos da Sala                     */
/* ============================================================ */
{
  const pasta = new URL("../src/nuvem/", import.meta.url);
  const arquivos = readdirSync(pasta).filter((f) => /^(sala-[^/]*.js|Sala[^/]*.jsx)$/.test(f));
  t("os arquivos da Sala existem", arquivos.length >= 7, true);
  t("nenhum U+2014 nos arquivos da Sala", arquivos.filter((f) => readFileSync(new URL(f, pasta), "utf8").includes(String.fromCharCode(0x2014))), []);
}

/* ============================================================ */
/* 9. Revisão final (8b, 2026-11-18)                             */
/* ============================================================ */
{
  const SE = await import(N + "sala-encontro.js");
  const SEG = "segredo-8b";
  const OC = "cmb_oculta_8b";
  const ids = ["cmb_aberta_8b", OC, "pj:lia-1"];
  const opc = { segredo: SEG, ids, ocultos: [OC] };
  const ap = Oc.apelidoDe(SEG, OC);

  // A criatura Aberta com uma condição Aplicada Por uma Oculta: o que sobe não tem o id de verdade.
  const base = { hpAtual: 30, buffs: [{ id: "b1", nome: "Lento", rodadas: 2, aplicadorId: OC }] };
  const sobe = SE.sessaoQueSobe({ remota: null, base: null, local: base, ...opc });
  t("8b: criatura sobe sem o id da Oculta", JSON.stringify(sobe).includes(OC), false);
  t("8b: criatura sobe com o apelido", sobe.buffs[0].aplicadorId, ap);
  t("8b: o Mestre traduz de volta", Oc.sessaoDoMestre(sobe, opc), base);
  // Sem edição: a versão do banco (com apelido) contra a base na vista do Mestre não parece edição.
  t("8b: apelido do banco não vira edição", SE.sessaoQueSobe({ remota: sobe, base, local: base, ...opc }), sobe);
  // Alguém gravou no meio (o co-Mestre tirou 4) e o Mestre tirou 5: os dois ficam, e o apelido segue.
  const remota = { ...sobe, hpAtual: 26 };
  const local = { ...base, hpAtual: 25 };
  const junto = SE.sessaoQueSobe({ remota, base, local, ...opc });
  t("8b: mesclagem relativa por cima da versão do banco", [junto.hpAtual, junto.buffs[0].aplicadorId], [21, ap]);

  // O Tentar de Novo: os passos guardados vão em ordem por cima da versão de agora, e voltam com o apelido.
  const lia0 = { hpAtual: 40, buffs: [] };
  const p1 = (s) => reaplicarSobre(s, lia0, { ...lia0, hpAtual: 35 });
  const p2 = (s) => reaplicarSobre(s, lia0, { ...lia0, buffs: [{ id: "b2", nome: "Marcado", rodadas: 1, aplicadorId: OC }] });
  const agoraNoBanco = { hpAtual: 38, buffs: [] };
  const refeito = SE.sessaoDoJogadorQueSobe({ remota: agoraNoBanco, passos: [p1, p2], ...opc });
  t("8b: Tentar de Novo refaz os dois passos", [refeito.hpAtual, refeito.buffs.length], [33, 1]);
  t("8b: Tentar de Novo sobe com o apelido", refeito.buffs[0].aplicadorId, ap);

  // Mais Nova Vence: a sessão final da Sala só entra se a do aparelho não foi gravada depois.
  const arm = new Map();
  const armazem = { getItem: (k) => (arm.has(k) ? arm.get(k) : null) };
  const chave = S.chaveDaSessao("lia-1");
  const m = { fichaId: "lia-1", sessaoEm: 1000 };
  t("8b: sem sessão no aparelho, a da Sala entra", F.salaMaisNova(m, armazem), true);
  arm.set(chave, JSON.stringify({ atualizadoEm: 900 }));
  t("8b: aparelho mais velho, a da Sala entra", F.salaMaisNova(m, armazem), true);
  arm.set(chave, JSON.stringify({ atualizadoEm: 1500 }));
  t("8b: aparelho mexido depois da Sala, fica o do aparelho", F.salaMaisNova(m, armazem), false);
  t("8b: o fechamento também é régua", F.salaMaisNova(m, armazem, new Date(2000).toISOString()), true);
  t("8b: sem data da Sala, a da Sala entra", F.salaMaisNova({ fichaId: "lia-1" }, armazem), true);
}

if (bad.length) {
  console.log(bad.join("\n"));
  console.log(`\n${bad.length} FALHA(S), ${ok} passaram`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
