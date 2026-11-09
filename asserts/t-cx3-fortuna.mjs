import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const { trocarCopiaImitacao } = await import(R + "afty-imitacao.js");
const { rolarTeste, rolarDano } = await import(R + "ficha/ficha-rolagem.js");
const { rerrolaFortuna, dadosDisponiveisFortuna, rerrolaTreinoPericia, rerrolaTesteDeClasse } = await import(R + "ficha/ficha-conteudo-testes.js");
const { rolaSorte, escolheSorte } = await import(R + "ficha/ficha-conteudo-uso.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { comOperacao } = await import(R + "ficha/ficha-uso-estado.js");
let ok = 0, seq = 0;
const bad = [], t = (nome, real, esp) => JSON.stringify(real) === JSON.stringify(esp) ? ok++ : bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
const p = () => ({ opId: `fortuna-${++seq}`, registraAcao: true });
const rng = (...ns) => { let i = 0; return () => ns[i++]; };
function ficha(sistema) {
  const c = createBlankAfty(); c.rulesVersion = sistema; c.name = "CX3 Fortuna"; c.core.nd = 12;
  c.attrMethod = "fixos"; c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
  c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } };
  c.especializacoes = [{ id: "combatente", nivel: 12 }]; c.pericias = { feiticaria: "treinado", acrobacia: "treinado" };
  c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
  c.habilidades = ["cmb_assumir_postura", "cmb_indomavel"];
  c.escolhasHabilidade = { cmb_assumir_postura: ["cmb_postura_da_fortuna", "cmb_postura_do_sol"] };
  c.combate = { ...c.combate, ativo: true, postura: "fortuna" };
  c.talentos = ["tal_favorecido_pela_sorte"]; c.treinamentos = { pericia: [{ alvo: "acrobacia", progresso: 4 }] }; c.focosLivres = 10;
  aplicarAddons(c.addons); return c;
}
for (const sistema of ["player", "afty"]) {
  const c = ficha(sistema), d = deriveAfty(c);
  const s = { ...S.iniciaCombate(S.sessaoEmBranco(d), d), combate: structuredClone(c.combate), rodada: 1 };
  t(`${sistema} ficha admissível`, [d.habilidades.inacessiveis, d.habilidades.excedeu, d.talentos.inacessiveis], [[], false, []]);
  t(`${sistema} fonte da escolha e BT`, [d.maestria, d.conteudoPosturaFortuna?.ativa, d.conteudoPosturaFortuna?.max, d.conteudoPosturaFortuna?.partes[0].label], [4, true, 2, "Postura da Fortuna"]);
  const baixo = rolarTeste({ rotulo: "Acrobacia", periciaId: "acrobacia", bonus: 7, dados: [{ qtd: 1, faces: 6 }], cd: 22,
    fontes: [{ label: "Fonte Original", valor: 7 }], contextoConteudo: { tipo: "teste-proprio" }, contextoTurno: { rodada: 1, turno: 0 } }, rng(0.5, 0.05));
  const original = S.registraRolagem(s, baixo), copia = JSON.stringify(original), ped = p();
  const um = rerrolaFortuna(original, d, { id: baixo.id, indice: 0, rng: () => 0.85 }, ped);
  if (!um.aplicado) throw new Error(`${sistema}: ${um.erro}`);
  t(`${sistema} repete apenas o d20`, [um.rolagem.d20, um.rolagem.extras, um.rolagem.bonus, um.rolagem.total, um.rolagem.sucesso], [[18], baixo.extras, 7, 29, true]);
  t(`${sistema} conserva contexto e identidade`, [um.rolagem.id, um.rolagem.ts, um.rolagem.contextoConteudo, um.rolagem.contextoTurno, um.rolagem.formula], [baixo.id, baixo.ts, baixo.contextoConteudo, baixo.contextoTurno, baixo.formula]);
  t(`${sistema} conserva fonte e registra tentativa`, [um.rolagem.fontes[0], um.rolagem.fontes.at(-1).label, um.rolagem.fortuna[0]], [baixo.fontes[0], "Postura da Fortuna", { chave: "base:normal:0", indice: 0, anterior: 2, novo: 18, mantido: 18 }]);
  t(`${sistema} uma entrada sem mudar original`, [um.sessao.log.filter((r) => r.id === baixo.id).length, JSON.stringify(original) === copia], [1, true]);
  t(`${sistema} sem ação ou custo`, [um.sessao.uso.acoes, um.sessao.peAtual, um.sessao.usos["rodada:uso:cmb_postura_da_fortuna"]], [s.uso.acoes, s.peAtual, 1]);
  t(`${sistema} identidade impede duplicação`, rerrolaFortuna(um.sessao, d, { id: baixo.id, indice: 0 }, ped).repetida, true);
  const menor = rerrolaFortuna(original, d, { id: baixo.id, indice: 0, rng: () => 0 }, p());
  t(`${sistema} mantém maior mesmo baixo`, [menor.rolagem.d20, menor.rolagem.total], [[2], baixo.total]);
  t(`${sistema} dado baixo já repetido não repete`, rerrolaFortuna(menor.sessao, d, { id: baixo.id, indice: 0 }, p()).sessao === menor.sessao, true);
  const relida = S.normalizaSessao(JSON.parse(JSON.stringify(menor.sessao)), d);
  t(`${sistema} salvamento conserva bloqueio e contador`, [dadosDisponiveisFortuna(relida, d, relida.log[0]), relida.usos["rodada:uso:cmb_postura_da_fortuna"]], [[], 1]);
  const segundo = rolarTeste({ rotulo: "Atletismo", bonus: 3 }, () => 0.15);
  const comSegundo = S.registraRolagem(um.sessao, segundo), dois = rerrolaFortuna(comSegundo, d, { id: segundo.id, indice: 0, rng: () => 0.5 }, p());
  t(`${sistema} BT inclusivo permite quatro`, [dois.aplicado, dois.rolagem.d20], [true, [11]]);
  const outro = rolarTeste({ rotulo: "Astúcia", bonus: 1 }, () => 0.1), esgotada = S.registraRolagem(dois.sessao, outro);
  t(`${sistema} metade de BT é limite conjunto`, rerrolaFortuna(esgotada, d, { id: outro.id, indice: 0 }, p()).sessao === esgotada, true);
  const rodada = S.proximaRodada(esgotada, d).sessao;
  t(`${sistema} rodada nova devolve quota`, rerrolaFortuna(rodada, d, { id: outro.id, indice: 0, rng: () => 0.5 }, p()).aplicado, true);
  t(`${sistema} rodada nova não libera mesmo dado`, rerrolaFortuna(rodada, d, { id: baixo.id, indice: 0 }, p()).sessao === rodada, true);
  const alto = rolarTeste({ rotulo: "Teste", bonus: 0 }, () => 0.2), comAlto = S.registraRolagem(s, alto);
  t(`${sistema} acima de BT recusa sem gasto`, rerrolaFortuna(comAlto, d, { id: alto.id, indice: 0 }, p()).sessao === comAlto, true);
  for (const modo of ["vantagem", "desvantagem"]) {
    const r = rolarTeste({ rotulo: "Dois D20", bonus: 2, modo, cd: 15 }, rng(0.05, 0.1));
    const a = rerrolaFortuna(S.registraRolagem(s, r), d, { id: r.id, indice: 0, rng: () => 0.9 }, p());
    t(`${sistema} ${modo} troca apenas índice escolhido`, [a.rolagem.d20, a.rolagem.natural, a.rolagem.descartado, a.rolagem.sucesso], [[19, 3], modo === "vantagem" ? 19 : 3, modo === "vantagem" ? 1 : 0, modo === "vantagem"]);
    const b = rerrolaFortuna(a.sessao, d, { id: r.id, indice: 1, rng: () => 0.95 }, p());
    t(`${sistema} ${modo} pode repetir outro dado`, [b.aplicado, b.rolagem.d20, b.rolagem.natural], [true, [19, 20], modo === "vantagem" ? 20 : 19]);
  }
  const piso = rolarTeste({ rotulo: "Mínimo", bonus: 3, minimoNatural: 10 }, () => 0.05);
  const pisoBase = S.registraRolagem(s, piso), pisoBaixo = rerrolaFortuna(pisoBase, d, { id: piso.id, indice: 0, rng: () => 0.1 }, p());
  t(`${sistema} compara dado cru antes do piso`, [pisoBaixo.aplicado, pisoBaixo.rolagem.d20, pisoBaixo.rolagem.natural, pisoBaixo.rolagem.naturalOriginal], [true, [3], 10, 3]);
  const pisoAlto = rerrolaFortuna(pisoBase, d, { id: piso.id, indice: 0, rng: () => 0.8 }, p());
  t(`${sistema} piso antigo não fica no recibo`, [pisoAlto.rolagem.natural, "naturalOriginal" in pisoAlto.rolagem], [17, false]);
  for (const [tipoTeste, novo, cd, sucesso, critico] of [["ataque", 20, 100, true, true], ["ataque", 18, 100, false, false], ["teste", 20, 100, false, true], ["ataque", 1, 0, false, false]]) {
    const r = rolarTeste({ rotulo: "Teste", bonus: 0, tipoTeste, margem: 18, cd }, () => 0);
    const a = rerrolaFortuna(S.registraRolagem(s, r), d, { id: r.id, indice: 0, rng: () => (novo - 1) / 20 }, p());
    t(`${sistema} preserva regra nativa ${tipoTeste} ${novo} CD${cd}`, [a.rolagem.natural, a.rolagem.sucesso, a.rolagem.critico, a.rolagem.pifia], [novo, sucesso, critico, novo === 1]);
  }
  for (const alteracao of [{ consequenciasAplicadas: true }, { rotulo: "Concentração" }, { sorte: { escolha: null } }, { tipo: "info" }, { d20: [0] }]) {
    const ss = { ...original, log: [{ ...baixo, ...alteracao }] };
    t(`${sistema} recusa registro indisponível ${JSON.stringify(alteracao)}`, rerrolaFortuna(ss, d, { id: baixo.id, indice: 0 }, p()).sessao === ss, true);
  }
  const confirmado = comOperacao(original, { id: `ataque-confirmado:${baixo.id}`, tipo: "ataque" });
  t(`${sistema} ataque confirmado não muda`, rerrolaFortuna(confirmado, d, { id: baixo.id, indice: 0 }, p()).sessao === confirmado, true);
  const dano = rolarDano({ rotulo: "D20 de Dano", dados: 1, faces: 20 }, () => 0);
  const sd = S.registraRolagem(s, dano);
  t(`${sistema} não trata dano como teste`, rerrolaFortuna(sd, d, { id: dano.id, indice: 0 }, p()).sessao === sd, true);
  for (const indice of [-1, 1, 0.5, "0"]) t(`${sistema} recusa índice ${indice}`, rerrolaFortuna(original, d, { id: baixo.id, indice }, p()).sessao === original, true);
  t(`${sistema} exige identidade`, rerrolaFortuna(original, d, { id: baixo.id, indice: 0 }).sessao === original, true);
  for (const combate of [{ ativo: true, postura: "sol" }, { ativo: false, postura: "fortuna" }, { ativo: true, postura2: "fortuna" }]) {
    const dd = deriveAfty({ ...c, combate }), ss = { ...original, combate };
    t(`${sistema} exige postura efetiva ${JSON.stringify(combate)}`, rerrolaFortuna(ss, dd, { id: baixo.id, indice: 0 }, p()).sessao === ss, true);
  }
  const semEscolha = deriveAfty({ ...c, escolhasHabilidade: { cmb_assumir_postura: ["cmb_postura_do_sol"] } });
  t(`${sistema} estado bruto não concede postura`, semEscolha.conteudoPosturaFortuna, null);
  for (const nome of ["Caído", "Inconsciente", "Atordoado", "Paralisado", "Indefeso"]) {
    const ss = { ...original, condicoes: [{ id: "impede", nome }] };
    t(`${sistema} ${nome} impede postura normal`, rerrolaFortuna(ss, d, { id: baixo.id, indice: 0 }, p()).sessao === ss, true);
  }
  const mestre = structuredClone(c); mestre.core.nd = 16; mestre.especializacoes[0].nivel = 16; mestre.habilidades.push("cmb_mestre_da_postura"); mestre.combate = { ativo: true, postura: "sol", postura2: "fortuna" };
  const dm = deriveAfty(mestre), sm = { ...original, combate: mestre.combate };
  t(`${sistema} Mestre aceita segundo slot`, [dm.habilidades.inacessiveis, rerrolaFortuna(sm, dm, { id: baixo.id, indice: 0 }, p()).aplicado], [[], true]);
  mestre.combate.postura = "fortuna";
  t(`${sistema} dois slots não duplicam quota`, deriveAfty(mestre).conteudoPosturaFortuna.max, Math.floor(dm.maestria / 2));
  const fortunaSorte = rolaSorte(menor.sessao, d, { id: baixo.id, rng: () => 0.1 }, p());
  t(`${sistema} Sorte pendente recusa`, rerrolaFortuna(fortunaSorte.sessao, d, { id: baixo.id, indice: 0 }, p()).sessao === fortunaSorte.sessao, true);
  const sorteOriginal = escolheSorte(fortunaSorte.sessao, d, { id: baixo.id, escolha: "original" }, p());
  t(`${sistema} Sorte mantendo dado não libera Fortuna`, rerrolaFortuna(sorteOriginal.sessao, d, { id: baixo.id, indice: 0 }, p()).aplicado, false);
  const sorteNova = escolheSorte(fortunaSorte.sessao, d, { id: baixo.id, escolha: "novo" }, p());
  t(`${sistema} novo dado de Sorte recebe sua tentativa`, rerrolaFortuna(sorteNova.sessao, d, { id: baixo.id, indice: 0, rng: () => 0 }, p()).aplicado, true);
  const treinoBaixo = rerrolaTreinoPericia(menor.sessao, d, { id: baixo.id, rng: () => 0 }, p());
  t(`${sistema} Treino mantendo dado não libera Fortuna`, rerrolaFortuna(treinoBaixo.sessao, d, { id: baixo.id, indice: 0 }, p()).aplicado, false);
  const treinoNovo = rerrolaTreinoPericia(menor.sessao, d, { id: baixo.id, rng: () => 0.15 }, p());
  t(`${sistema} novo dado de Treino recebe sua tentativa`, rerrolaFortuna(treinoNovo.sessao, d, { id: baixo.id, indice: 0, rng: () => 0 }, p()).aplicado, true);
  const tr = { ...baixo, resistenciaId: "vontade", rotulo: "Vontade", cd: 100, sucesso: false };
  const st = S.registraRolagem(s, tr), ft = rerrolaFortuna(st, d, { id: tr.id, indice: 0, rng: () => 0 }, p());
  const classeVelha = rerrolaTesteDeClasse(ft.sessao, d, { id: tr.id, antesConsequencias: true, rng: () => 0 }, p());
  t(`${sistema} classe mantendo rolagem conserva bloqueio`, rerrolaFortuna(classeVelha.sessao, d, { id: tr.id, indice: 0 }, p()).aplicado, false);
  const classeNova = rerrolaTesteDeClasse(ft.sessao, d, { id: tr.id, antesConsequencias: true, rng: rng(0.5, 0.15) }, p());
  t(`${sistema} nova rolagem de classe tem novo dado`, rerrolaFortuna(classeNova.sessao, d, { id: tr.id, indice: 0, rng: () => 0 }, p()).aplicado, true);
  const im = ficha(sistema); im.core.origem = { id: "restringido" }; im.core.tipo = "restringido"; im.especializacoes = [{ id: "restringido", nivel: 12 }]; im.habilidades = ["res_imitacao"]; im.escolhasHabilidade = {};
  im.combate = { ativo: true, ...trocarCopiaImitacao({}, { id: "cmb_postura_da_fortuna", tipo: "postura" }) };
  const di = deriveAfty(im), si = { ...original, combate: im.combate };
  t(`${sistema} Imitação usa concessão nativa válida`, [di.habilidades.inacessiveis, di.imitacao.copia?.id, di.conteudoPosturaFortuna?.ativa], [[], "cmb_postura_da_fortuna", true]);
  t(`${sistema} Fortuna imitada pode repetir`, rerrolaFortuna(si, di, { id: baixo.id, indice: 0 }, p()).aplicado, true);
  const imMestre = { ...im, core: { ...im.core, nd: 20 }, especializacoes: [{ id: "restringido", nivel: 20 }], habilidades: ["res_imitacao", "res_imitacao_perfeita"],
    combate: { ativo: true, postura: "sol", postura2: "fortuna", imitacao: { copia: { id: "cmb_mestre_da_postura", tipo: "passiva", escolhas: ["cmb_postura_da_fortuna", "cmb_postura_do_sol"] } } } };
  const dim = deriveAfty(imMestre);
  t(`${sistema} Mestre da Postura imitado conserva escolhas`, [dim.habilidades.inacessiveis, dim.conteudoPosturaFortuna?.ativa], [[], true]);
  const ap = ficha(sistema); ap.core.nd = 30; ap.especializacoes = [{ id: "combatente", nivel: 20 }, { id: "conjurador", nivel: 10 }]; ap.habilidades.push("cmb_preparacao_rapida", "cmb_mestre_da_postura");
  if (sistema === "afty") ap.habilidadesGerais.push("ger_habilidade_lendaria");
  ap.habilidadesLendarias = ["len_atingir_apice"]; ap.escolhasAltoNivel = { len_atingir_apice: ["api_invencivel_sob_o_sol"] };
  ap.escolhasHabilidade = { cmb_assumir_postura: ["cmb_postura_do_sol"] }; ap.combate = { ativo: true, invencivelSobOSol: true, invencivelRodadas: 1 };
  const da = deriveAfty(ap), sa = { ...original, combate: ap.combate };
  t(`${sistema} Ápice respeita decisão das oito posturas`, [da.altoNivel.apiceId, da.combate.invencivelSobOSol, da.conteudoPosturaFortuna?.ativa, da.conteudoPosturaFortuna?.apice], ["api_invencivel_sob_o_sol", true, true, true]);
  t(`${sistema} Ápice sem escolha Fortuna rerrola`, rerrolaFortuna(sa, da, { id: baixo.id, indice: 0 }, p()).aplicado, true);
  t(`${sistema} Ápice exige requisitos atuais`, deriveAfty({ ...ap, habilidades: ["cmb_assumir_postura"] }).conteudoPosturaFortuna, null);
  t(`${sistema} Ápice exige nível de Atingir`, deriveAfty({ ...ap, core: { ...ap.core, nd: 20 }, especializacoes: [{ id: "combatente", nivel: 20 }] }).conteudoPosturaFortuna, null);
  const falsa = deriveAfty({ ...ap, habilidadesLendarias: [], escolhasAltoNivel: {} });
  t(`${sistema} estado bruto não inventa Ápice`, falsa.conteudoPosturaFortuna, null);
}
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
