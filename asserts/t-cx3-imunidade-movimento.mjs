import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons, validarPacote } = await import(R + "afty-addons.js");
const { trocarCopiaImitacao } = await import(R + "afty-imitacao.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { rolarTeste, rolarDano } = await import(R + "ficha/ficha-rolagem.js");
const { confirmaAtaqueConteudo } = await import(R + "ficha/ficha-conteudo-combate.js");
const M = await import(R + "ficha/ficha-conteudo-manobras.js");
const { aplicaCriticoDeGrupo } = await import(R + "ficha/ficha-conteudo-uso.js");
const { recursosDeEspecializacao } = await import(R + "ficha/ficha-especializacoes.js");
const { prepararRolagem } = await import(R + "ficha/abas-g2/rolagem-g2.js");
const { opcoesDeriveDaSessao } = await import(R + "ficha/ficha-opcoes-derive.js");
const { usa } = await import(R + "ficha/ficha-uso.js");
let ok = 0, seq = 0;
const bad = [], t = (n, a, b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : bad.push(`${n}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
const p = () => ({ opId: `imune-mov-${++seq}`, registraAcao: true });
const imune = (d, s = {}) => recursosDeEspecializacao(s, d).imuneMovimentoForcado;
const atual = (c, s) => deriveAfty({ ...c, combate: s.combate, buffsSessao: s.buffs }, opcoesDeriveDaSessao(s));
function ficha(sistema) {
  const c = createBlankAfty(); c.id = "imune-atacante"; c.name = "CX3 Movimento"; c.rulesVersion = sistema; c.core.nd = 20;
  c.attrMethod = "fixos"; c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
  c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } };
  c.especializacoes = [{ id: "combatente", nivel: 20 }]; c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
  c.pericias = { atletismo: "mestre", acrobacia: "treinado", feiticaria: "treinado" };
  return c;
}
function terra(sistema) {
  const c = ficha(sistema); c.id = "imune-alvo"; c.habilidades = ["cmb_assumir_postura"];
  c.escolhasHabilidade = { cmb_assumir_postura: ["cmb_postura_da_terra", "cmb_postura_do_sol"] };
  c.combate = { ativo: true, postura: "terra" }; return c;
}
function inicio(c) {
  const d = deriveAfty(c), s = { ...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d), d), d), combate: { ...c.combate, ativo: true } };
  return { d, s };
}
function ataque(c, ca, { arma = "basico", zero = false } = {}) {
  if (arma !== "basico") {
    c = structuredClone(c); c.equipamentos.itens = [{ uid: "imune-arma", tipo: "arma", refId: arma, qtd: 1, equipado: true }];
    c.treinamentos = { manejo_arma: [{ alvo: arma, progresso: 3 }] }; c.focosLivres = 15;
  }
  if (zero) ca = { ...ca, buffsSessao: [{ id: "protecao", nome: "Proteção do Ensaio", canal: "rdGeral", expr: "1000" }] };
  const { d, s: limpa } = inicio(c), { d: da, s: sa } = inicio(ca), linha = d.dano.entradas.find(l => l.id === arma);
  const teste = rolarTeste({ rotulo: linha.nome, bonus: linha.acerto, margem: linha.margemCritico, tipoTeste: "ataque", linhaArma: linha }, () => 0.999);
  const dano = rolarDano({ rotulo: linha.nome, grupos: linha.gruposDano, critico: true, linhaArma: linha }, () => 0.4);
  const s = S.registraRolagem(S.registraRolagem(limpa, teste), dano);
  const r = confirmaAtaqueConteudo(s, d, sa, da, { ataqueId: teste.id, danoId: dano.id, alvoId: ca.id }, p());
  if (!r.aplicado) throw Error(r.erro);
  return { d, da, s: r.sessao, sa: r.sessaoAlvo, teste, dano, linha };
}
aplicarAddons([]);
for (const sistema of ["player", "afty"]) {
  const alvo = terra(sistema), { d: dt, s: st } = inicio(alvo);
  t(`${sistema} Terra válida`, [dt.habilidades.inacessiveis, dt.habilidades.excedeu, dt.testes.orcamento.excedeu, dt.combate.postura], [[], false, false, "terra"]);
  t(`${sistema} imunidade vem do Motor`, [dt.efeitos.porCanal.imunidadeMovimentoForcado, imune(dt, st)], [1, true]);
  t(`${sistema} fonte própria`, dt.efeitos.detalhes.filter(e => e.canal === "imunidadeMovimentoForcado").map(e => [e.origem, e.nome, e.valor]), [["cmb_postura_da_terra", "Assumir Postura (Postura da Terra)", 1]]);
  t(`${sistema} conserva Fortitude e PV temporário`, dt.efeitos.detalhes.filter(e => e.origem === "cmb_postura_da_terra" && e.canal !== "imunidadeMovimentoForcado").map(e => [e.canal, e.valor]), [["bonusTR", dt.maestria], ["pvTemporario", dt.nd]]);
  const relida = S.normalizaSessao(JSON.parse(JSON.stringify(st)), dt);
  t(`${sistema} imunidade persiste pela postura nativa`, imune(atual(alvo, relida), relida), true);
  for (const nome of ["Caído", "Atordoado", "Inconsciente", "Paralisado", "Indefeso"]) {
    const caiu = S.defineCondicoes({ ...st, combate: { ...st.combate, postura2: "sol" } }, [{ id: nome, nome }]);
    t(`${sistema} ${nome} encerra ambos os espaços`, [caiu.combate.postura, caiu.combate.postura2], [null, null]);
    t(`${sistema} ${nome} retira imunidade normal`, imune(atual(alvo, caiu), caiu), false);
    const levantou = S.defineCondicoes(caiu, []);
    t(`${sistema} remover ${nome} não restaura postura`, imune(atual(alvo, levantou), levantou), false);
  }
  const antigaCaida = S.normalizaSessao(JSON.parse(JSON.stringify({ ...st, condicoes: ["Caído"] })), dt);
  t(`${sistema} sessão antiga caída não restaura postura`, [antigaCaida.combate.postura, imune(atual(alvo, antigaCaida), antigaCaida)], [null, false]);
  const alerta = S.defineCondicoes(st, [{ id: "abalado", nome: "Abalado" }]);
  t(`${sistema} outra condição conserva postura`, alerta.combate, st.combate);
  t(`${sistema} fora do combate não permanece`, imune(deriveAfty({ ...alvo, combate: { ativo: false, postura: "terra" } })), false);
  t(`${sistema} troca de postura remove sinal`, imune(deriveAfty({ ...alvo, combate: { ativo: true, postura: "sol" } })), false);
  t(`${sistema} estado sem escolha não concede`, imune(deriveAfty({ ...alvo, escolhasHabilidade: {} })), false);
  t(`${sistema} estado sem pai não concede`, imune(deriveAfty({ ...alvo, habilidades: [] })), false);
  t(`${sistema} segundo slot sem Mestre não concede`, imune(deriveAfty({ ...alvo, combate: { ativo: true, postura: "sol", postura2: "terra" } })), false);
  const mestre = deriveAfty({ ...alvo, habilidades: [...alvo.habilidades, "cmb_mestre_da_postura"], combate: { ativo: true, postura: "sol", postura2: "terra" } });
  t(`${sistema} segundo slot válido concede`, [mestre.habilidades.inacessiveis, imune(mestre)], [[], true]);
  const res = ficha(sistema); res.id = alvo.id; res.core.origem = { id: "restringido" }; res.core.tipo = "restringido";
  res.especializacoes = [{ id: "restringido", nivel: 20 }]; res.habilidades = ["res_barreira_inamovivel"];
  const dr = deriveAfty(res);
  t(`${sistema} Barreira válida e com fonte`, [dr.habilidades.inacessiveis, imune(dr), dr.efeitos.detalhes.filter(e => e.canal === "imunidadeMovimentoForcado").map(e => e.nome)], [[], true, ["Barreira Inamovível"]]);
  t(`${sistema} Barreira não exige combate`, imune(deriveAfty({ ...res, combate: { ativo: false } })), true);
  t(`${sistema} Barreira removida não permanece`, imune(deriveAfty({ ...res, habilidades: [] })), false);
  t(`${sistema} Barreira sem nível recusa`, imune(deriveAfty({ ...res, core: { ...res.core, nd: 4 }, especializacoes: [{ id: "restringido", nivel: 4 }] })), false);
  const copia = { ...res, habilidades: ["res_imitacao"], combate: { ativo: true, ...trocarCopiaImitacao({}, { id: "cmb_postura_da_terra", tipo: "postura" }) } };
  const di = deriveAfty(copia);
  t(`${sistema} Imitação usa o mesmo efeito`, [di.habilidades.inacessiveis, di.imitacao.copia?.id, imune(di)], [[], "cmb_postura_da_terra", true]);
  const mestreImitado = deriveAfty({ ...copia, habilidades: ["res_imitacao", "res_imitacao_perfeita"], combate: { ativo: true, postura: "sol", postura2: "terra",
    imitacao: { copia: { id: "cmb_mestre_da_postura", tipo: "passiva", escolhas: ["cmb_postura_da_terra", "cmb_postura_do_sol"] } } } });
  t(`${sistema} Mestre imitado admite Terra no segundo espaço`, [mestreImitado.habilidades.inacessiveis, imune(mestreImitado)], [[], true]);
  const barreiraImitada = deriveAfty({ ...copia, habilidades: ["res_imitacao", "res_imitacao_perfeita"], combate: { ativo: true,
    imitacao: { copia: { id: "res_barreira_inamovivel", tipo: "passiva" } } } });
  t(`${sistema} cópia fora do pool não concede Barreira`, [barreiraImitada.imitacao.copia, imune(barreiraImitada)], [null, false]);
  const ap = terra(sistema); ap.core.nd = 30; ap.especializacoes = [{ id: "combatente", nivel: 20 }, { id: "conjurador", nivel: 10 }];
  ap.habilidades.push("cmb_preparacao_rapida", "cmb_mestre_da_postura");
  ap.habilidadesGerais.push(...(sistema === "afty" ? ["ger_habilidade_lendaria"] : []));
  ap.habilidadesLendarias = ["len_atingir_apice"]; ap.escolhasAltoNivel = { len_atingir_apice: ["api_invencivel_sob_o_sol"] };
  ap.escolhasHabilidade = { cmb_assumir_postura: ["cmb_postura_do_sol"] }; ap.combate = { ativo: true, invencivelSobOSol: true, invencivelRodadas: 1 };
  const dap = deriveAfty(ap);
  t(`${sistema} Ápice concede Terra não aprendida`, [dap.altoNivel.apiceId, imune(dap), dap.efeitos.porCanal.imunidadeMovimentoForcado], ["api_invencivel_sob_o_sol", true, 1]);
  t(`${sistema} Ápice tem fonte própria`, dap.efeitos.detalhes.find(e => e.canal === "imunidadeMovimentoForcado").origem, "api_invencivel_sob_o_sol");
  const ambos = deriveAfty({ ...ap, escolhasHabilidade: alvo.escolhasHabilidade, combate: { ...ap.combate, postura: "terra" } });
  t(`${sistema} duas fontes concedem uma imunidade`, [ambos.efeitos.porCanal.imunidadeMovimentoForcado, imune(ambos)], [2, true]);
  t(`${sistema} slot bruto não aprendido não suprime Terra do Ápice`, imune(deriveAfty({ ...ap, combate: { ...ap.combate, postura: "terra" } })), true);
  const apCaido = S.defineCondicoes({ ...st, combate: { ...ap.combate, postura: "terra" } }, [{ id: "caido", nome: "Caído" }]);
  t(`${sistema} cair encerra postura normal mas conserva Ápice`, [apCaido.combate.postura, apCaido.combate.invencivelSobOSol, imune(atual(ap, apCaido), apCaido)], [null, true, true]);
  const resCaido = S.defineCondicoes({ ...st, combate: {} }, [{ id: "caido", nome: "Caído" }]);
  t(`${sistema} cair não remove Barreira`, imune(atual(res, resCaido), resCaido), true);
  t(`${sistema} Ápice sem concessão não concede sinal`, imune(deriveAfty({ ...ap, habilidadesLendarias: [], escolhasAltoNivel: {} })), false);
  t(`${sistema} Ápice exige habilidades atuais`, imune(deriveAfty({ ...ap, habilidades: ["cmb_assumir_postura"] })), false);
  t(`${sistema} Ápice exige nível de Atingir`, imune(deriveAfty({ ...ap, core: { ...ap.core, nd: 20 }, especializacoes: [{ id: "combatente", nivel: 20 }] })), false);
  const remendo = { id: "imune-remendo", nome: "Imunidade do Ensaio", paraRaw: "afty", substitui: { habilidades: [{ id: "res_barreira_inamovivel", efeitos: [] }] } };
  t(`${sistema} remendo admissível`, validarPacote(remendo), []);
  aplicarAddons([remendo]);
  t(`${sistema} retirar efeito pelo Addon é respeitado`, imune(deriveAfty({ ...res, addons: [remendo] })), false);
  aplicarAddons([]);
  const negativo = deriveAfty({ ...alvo, buffsSessao: [{ id: "retira", nome: "Retira Imunidade", canal: "imunidadeMovimentoForcado", expr: "-1" }] });
  t(`${sistema} soma do Motor governa o sinal`, [negativo.efeitos.porCanal.imunidadeMovimentoForcado, imune(negativo)], [0, false]);

  for (const [talento, arma] of [["tal_especialista_em_concussao", "basico"], ["tal_mestre_dos_chicotes", "arm_chicote"]]) {
    const c = ficha(sistema); c.talentos = [talento]; const f = ataque(c, alvo, { arma });
    t(`${sistema} ${talento} ataque e dano são confirmados`, [f.d.talentos.inacessiveis, f.s.log.some(r => r.rotulo === "Ataque Confirmado" && r.ataque.acertou), f.sa.hpAtual < f.da.hp], [[], true, true]);
    const sa = usa(f.sa, f.da, { id: "foco", nome: "Foco", concentracao: true, duracao: { ate: "cena" } }, p()).sessao;
    const antes = JSON.stringify(sa), entrada = { talento, ataqueId: f.teste.id, alvoId: alvo.id, distancia: 3, espacoDesocupado: true, rng: () => { throw Error("Não Deve Rolar"); } };
    const r = M.deslocaAlvoTalento(f.s, f.d, sa, f.da, entrada, p());
    t(`${sistema} ${talento} recusa movimento sem gastar limite`, [r.aplicado, r.erro, r.sessao === f.s], [false, "Alvo Imune a Movimento Forçado", true]);
    t(`${sistema} ${talento} não altera concentração/dano/estado do alvo`, JSON.stringify(sa), antes);
    t(`${sistema} ${talento} sem movimento preserva operação anterior`, M.deslocaAlvoTalento(f.s, f.d, sa, f.da, { ...entrada, distancia: 0, rng: () => 0 }, p()).deslocamento, 0);
    const livre = deriveAfty({ ...alvo, combate: { ativo: true, postura: "sol" } });
    t(`${sistema} ${talento} desligar Terra permite movimento`, M.deslocaAlvoTalento(f.s, f.d, sa, livre, { ...entrada, rng: () => 0 }, p()).aplicado, true);
    t(`${sistema} ${talento} Barreira também bloqueia`, M.deslocaAlvoTalento(f.s, f.d, sa, dr, entrada, p()).erro, "Alvo Imune a Movimento Forçado");
    t(`${sistema} ${talento} Ápice também bloqueia`, M.deslocaAlvoTalento(f.s, f.d, sa, dap, entrada, p()).erro, "Alvo Imune a Movimento Forçado");
  }
  for (const arma of ["arm_bastao", "arm_lanca"]) {
    const f = ataque(ficha(sistema), alvo, { arma });
    t(`${sistema} crítico de ${arma} tem concessão real`, !!f.linha.efeitoCritico?.deslocamento, true);
    const r = aplicaCriticoDeGrupo(f.s, f.d, f.sa, f.da, { ataqueId: f.teste.id, acertou: true, distancia: 3 }, p());
    t(`${sistema} crítico de ${arma} não desloca nem consome`, [r.erro, r.sessao === f.s], ["Alvo Imune a Movimento Forçado", true]);
    t(`${sistema} dano principal de ${arma} permanece`, f.sa.hpAtual < f.da.hp, true);
  }
  const briga = ficha(sistema); briga.talentos = ["tal_adepto_de_briga"];
  const b = ataque(briga, alvo, { zero: true });
  const e = { ataqueId: b.teste.id, alvoId: alvo.id, manobra: "empurrar", periciaAlvo: "acrobacia", rngAtacante: () => 0.999, rngAlvo: () => 0 };
  t(`${sistema} Briga válida com dano nativo zero`, [b.d.talentos.inacessiveis, b.s.log.find(r => r.rotulo === "Ataque Confirmado").calculos.every(v => v.final === 0)], [[], true]);
  const neg = M.rolaManobraDeBriga(b.s, b.d, b.sa, b.da, e, p());
  t(`${sistema} Briga Empurrar não cobra ação livre`, [neg.erro, neg.sessao === b.s], ["Alvo Imune a Movimento Forçado", true]);
  const derruba = M.rolaManobraDeBriga(b.s, b.d, b.sa, b.da, { ...e, manobra: "derrubar" }, p());
  if (!derruba.aplicado) throw Error(derruba.erro);
  t(`${sistema} Derrubar continua permitido`, M.aplicaManobraDeBriga(derruba.sessao, b.d, derruba.sessaoAlvo, b.da, e, p()).sessaoAlvo.condicoes.at(-1).nome, "Caído");
  const semTerra = deriveAfty({ ...alvo, combate: { ativo: true, postura: "sol" } });
  const pendente = M.rolaManobraDeBriga(b.s, b.d, b.sa, semTerra, e, p());
  const lida = S.normalizaSessao(JSON.parse(JSON.stringify(pendente.sessao)), b.d), lidaAlvo = S.normalizaSessao(JSON.parse(JSON.stringify(pendente.sessaoAlvo)), b.da);
  const agoraImune = M.aplicaManobraDeBriga(lida, b.d, lidaAlvo, b.da, e, p());
  t(`${sistema} Briga revalida após disputa salva`, [agoraImune.erro, agoraImune.sessao === lida, lidaAlvo.condicoes.length], ["Alvo Imune a Movimento Forçado", true, 0]);
  t(`${sistema} sem imunidade a disputa continua válida`, M.aplicaManobraDeBriga(lida, b.d, lidaAlvo, semTerra, e, p()).aplicado, true);
  const escudo = ficha(sistema); escudo.talentos = ["tal_tecnicas_ofensivas_de_escudo"];
  escudo.equipamentos.itens = [{ uid: "escudo", tipo: "escudo", refId: "esc_medio", qtd: 1, equipado: true }];
  const { d: de, s: se } = inicio(escudo), linha = de.dano.entradas.find(l => l.id === "basico");
  const pronta = prepararRolagem({ tipo: "teste", rotulo: linha.nome, linhaArma: linha, bonus: linha.acerto, margem: linha.margemCritico }, { sessao: se, derived: de });
  if (!pronta.ok) throw Error(pronta.etapa);
  const golpe = rolarTeste(pronta.pronta, () => 0), comGolpe = S.registraRolagem(se, golpe);
  const ee = { ...e, ataqueId: golpe.id, emSeuTurno: true, emAlcanceEscudo: true, escolha: "caido", rng: () => { throw Error("Não Pode Causar Dano"); } };
  const recusado = M.rolaEmpurraoEscudo(comGolpe, de, st, dt, ee, p());
  t(`${sistema} Escudo não gasta bônus contra imune`, [de.talentos.inacessiveis, recusado.erro, recusado.sessao === comGolpe], [[], "Alvo Imune a Movimento Forçado", true]);
  const er = M.rolaEmpurraoEscudo(comGolpe, de, st, semTerra, ee, p());
  if (!er.aplicado) throw Error(er.erro);
  const antesAlvo = JSON.stringify(er.sessaoAlvo);
  const ef = M.aplicaEmpurraoEscudo(er.sessao, de, er.sessaoAlvo, dt, ee, p());
  t(`${sistema} Escudo revalida antes de dano/Caído`, [ef.erro, ef.sessao === er.sessao, JSON.stringify(er.sessaoAlvo) === antesAlvo], ["Alvo Imune a Movimento Forçado", true, true]);
  const permitido = M.aplicaEmpurraoEscudo(er.sessao, de, er.sessaoAlvo, semTerra, { ...ee, rng: () => 0 }, p());
  t(`${sistema} Escudo sem imunidade mantém efeito completo`, [permitido.aplicado, permitido.distancia > 0, permitido.sessaoAlvo.condicoes.at(-1).nome, permitido.calculo.base], [true, true, "Caído", permitido.dano.total]);
}
aplicarAddons([]);
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
