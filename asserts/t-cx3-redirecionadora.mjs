import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const S = await import(R + "ficha/ficha-sessao.js");
const C = await import(R + "ficha/ficha-conteudo-combate.js");
const P = await import(R + "afty-propriedades-armas.js");
const { prepararRolagem } = await import(R + "ficha/abas-g2/rolagem-g2.js");
const { rolarTeste, rolarDano } = await import(R + "ficha/ficha-rolagem.js");
const { opcoesDeriveDaSessao } = await import(R + "ficha/ficha-opcoes-derive.js");
const { registraAtaqueRecebido } = await import(R + "ficha/ficha-combate-eventos.js");
let ok = 0, seq = 0;
const bad = [], t = (n, a, b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : bad.push(`${n}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
const p = () => ({ opId: `redirecionadora-${++seq}`, registraAcao: true });
function ficha(sistema, arma = "arm_arco_curto") {
  const c = createBlankAfty(); c.id = `aura-${++seq}`; c.name = c.id; c.rulesVersion = sistema; c.core.nd = 12;
  c.attrMethod = "fixos"; c.attributes = { forca: 14, destreza: 15, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
  c.core.origem = { id: "inato", bonusAtributos: { forca: 1, destreza: 2 } }; c.especializacoes = [{ id: "combatente", nivel: 12 }];
  c.pericias = { pontaria: "treinado", feiticaria: "treinado" }; c.ataquesProf = { corpo: true, distancia: true };
  c.aptidoes = { au: 3, cl: 0, er: 0, bar: 0, dom: 0 }; c.aptidoesAmaldicoadas = ["aura_redirecionadora"];
  c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao", "ger_aptidao"] : [];
  c.equipamentos.itens = [{ uid: "arma", tipo: "arma", refId: arma, qtd: 1, equipado: true }]; return c;
}
const atual = (c, s) => deriveAfty({ ...c, combate: s.combate, buffsSessao: s.buffs }, opcoesDeriveDaSessao(s));
const inicio = d => ({ ...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d), d), d), rodada: 1 });
function rola(s, d, pedido, rng) {
  const pronta = prepararRolagem(pedido, { sessao: s, derived: d }); if (!pronta.ok) throw Error(pronta.etapa);
  const naMesa = pedido.contextoTurno?.emCurso ? { ...pronta.pronta, contextoTurno: { ...pronta.pronta.contextoTurno, emCurso: pedido.contextoTurno.emCurso } } : pronta.pronta;
  const r = naMesa.tipo === "dano" ? rolarDano(naMesa, rng) : rolarTeste(naMesa, rng);
  return { sessao: P.registraRolagemArma(S.registraRolagem(s, r), pronta.desc, r), rolagem: r };
}
aplicarAddons([]);
for (const sistema of ["player", "afty"]) {
 for (const arma of ["arm_arco_curto", "arm_pistola", "arm_azagaia"]) {
  const c = ficha(sistema, arma), ca = ficha(sistema), cb = ficha(sistema), d = deriveAfty(c), da = deriveAfty(ca), db = deriveAfty(cb);
  const s = inicio(d), sa = inicio(da), sb = inicio(db), linha = d.dano.entradas.find(l => l.id === arma);
  t(`${sistema} ${arma} aquisição e orçamento admissíveis`, [d.aptidao.disponiveisConteudo.includes("aura_redirecionadora"), d.habilidades.inacessiveis, d.habilidades.excedeu, d.aptidao.efetivo.au], [true, [], false, 3]);
  const entrada = { armaId: arma, chaveArma: linha.chaveArma, alvoId: ca.id, descontarPE: true }, pedido = p();
  const preparada = C.preparaAuraRedirecionadora(s, d, entrada, pedido); if (!preparada.aplicado) throw Error(preparada.erro);
  t(`${sistema} ${arma} imbuir paga dois e não gasta outra ação`, [s.peAtual - preparada.sessao.peAtual, preparada.sessao.uso.acoes], [2, s.uso.acoes]);
  t(`${sistema} ${arma} pagamento idempotente`, C.preparaAuraRedirecionadora(preparada.sessao, d, entrada, pedido).repetida, true);
  const primeira = rola(preparada.sessao, atual(c, preparada.sessao), preparada.pedidoRolagem, () => 0);
  const r1 = primeira.rolagem, d1 = atual(c, primeira.sessao), antesArma = P.estadoDaArma(primeira.sessao.propriedadesArmas, linha);
  t(`${sistema} ${arma} usa a primeira jogada nativa`, [r1.natural, antesArma.ataques, antesArma.gastos], [1, 1, arma === "arm_pistola" ? 1 : 0]);
  const a = C.confirmaAtaqueConteudo(primeira.sessao, d1, sa, da, { ataqueId: r1.id, alvoId: ca.id, inimigo: true }, p());
  if (!a.aplicado) throw Error(a.erro);
  t(`${sistema} ${arma} autor: primeira falha mantém desastre e sequência A`, [a.ataque.acertou, a.ataque.desastre, a.sessaoAlvo.uso.sequencia.ataques, a.sessaoAlvo.hpAtual], [false, true, 1, sa.hpAtual]);
  const eventosA = a.sessao.log.find(r => r.rotulo === "Ataque Confirmado" && r.ataqueId === r1.id);
  t(`${sistema} ${arma} primeira falha guarda evento de desastre`, eventosA.eventos.some(e => e.tipo === "desastre"), true);
  const redEntrada = { ataqueId: r1.id, alvoId: cb.id, em6mDoPrimeiro: true, rng: () => 0.999 }, redPedido = p();
  for (const estado of ["morto", "morrendo"]) {
    const inicial = { ...s, hpAtual: 0, vital: { ...s.vital, estado } }, aposFalha = { ...a.sessao, hpAtual: 0, vital: { ...a.sessao.vital, estado } };
    t(`${sistema} ${arma} ${estado} não imbui`, C.preparaAuraRedirecionadora(inicial, d, entrada, p()).sessao === inicial, true);
    t(`${sistema} ${arma} ${estado} não redireciona`, C.rolaRedirecionamentoAura(aposFalha, atual(c, aposFalha), { ...redEntrada, rng: () => { throw Error("Não Deve Rolar"); } }, p()).sessao === aposFalha, true);
  }
  const b = C.rolaRedirecionamentoAura(a.sessao, atual(c, a.sessao), redEntrada, redPedido); if (!b.aplicado) throw Error(b.erro);
  t(`${sistema} ${arma} bônus AU3 é dois e recebe fonte`, [b.bonus, b.rolagem.bonus - r1.bonus, b.rolagem.fontes.at(-1)], [2, 2, { label: "Aura Redirecionadora", valor: 2 }]);
  t(`${sistema} ${arma} duas jogadas distintas ligadas ao mesmo projétil`, [b.rolagem.id !== r1.id, b.rolagem.contextoConteudo.ataqueOriginalId, b.rolagem.contextoConteudo.alvoId], [true, r1.id, cb.id]);
  t(`${sistema} ${arma} mantém número, munição e emperramento`, [P.estadoDaArma(b.sessao.propriedadesArmas, linha).ataques, P.estadoDaArma(b.sessao.propriedadesArmas, linha).gastos, P.estadoDaArma(b.sessao.propriedadesArmas, linha).emperrada], [antesArma.ataques, antesArma.gastos, antesArma.emperrada]);
  t(`${sistema} ${arma} sem nova ação ou PE na segunda jogada`, [b.sessao.peAtual, b.sessao.uso.acoes], [a.sessao.peAtual, a.sessao.uso.acoes]);
  t(`${sistema} ${arma} primeira falha e seus eventos não são alterados`, b.sessao.log.find(r => r.id === eventosA.id), eventosA);
  t(`${sistema} ${arma} repetir redirecionamento não altera`, C.rolaRedirecionamentoAura(b.sessao, atual(c, b.sessao), redEntrada, redPedido).repetida, true);
  t(`${sistema} ${arma} impede terceira jogada com outra identidade`, C.rolaRedirecionamentoAura(b.sessao, atual(c, b.sessao), redEntrada, p()).sessao === b.sessao, true);
  const d2 = atual(c, b.sessao), descDano = C.danoDoRedirecionamentoAura(b.sessao, d2);
  if (!descDano) throw Error("Sem dano da nova jogada");
  const dano = rola(b.sessao, d2, descDano, () => 0.5);
  t(`${sistema} ${arma} dano usa o novo crítico sem outro disparo`, [dano.rolagem.critico, P.estadoDaArma(dano.sessao.propriedadesArmas, linha).ataques, P.estadoDaArma(dano.sessao.propriedadesArmas, linha).gastos], [true, 1, antesArma.gastos]);
  const ce = { ataqueId: b.rolagem.id, danoId: dano.rolagem.id, alvoId: cb.id, inimigo: true };
  const final = C.confirmaAtaqueConteudo(dano.sessao, atual(c, dano.sessao), sb, db, ce, p()); if (!final.aplicado) throw Error(final.erro);
  t(`${sistema} ${arma} confirmação B conta só em B e aplica dano`, [final.ataque.acertou, final.sessaoAlvo.uso.sequencia.ataques, final.sessaoAlvo.hpAtual < sb.hpAtual, a.sessaoAlvo.uso.sequencia.ataques], [true, 1, true, 1]);
  t(`${sistema} ${arma} duas confirmações e uma cobrança de munição`, [final.sessao.log.filter(r => r.rotulo === "Ataque Confirmado").length, P.estadoDaArma(final.sessao.propriedadesArmas, linha).gastos], [2, antesArma.gastos]);
  t(`${sistema} ${arma} segundo alvo não pode ser substituído na confirmação`, C.confirmaAtaqueConteudo(dano.sessao, atual(c, dano.sessao), sa, da, { ...ce, alvoId: ca.id }, p()).sessao === dano.sessao, true);
  const lida = S.normalizaSessao(JSON.parse(JSON.stringify(final.sessao)), d2);
  t(`${sistema} ${arma} duas etapas e custos persistem`, [lida.peAtual, lida.log.filter(r => r.rotulo === "Ataque Confirmado").length, P.estadoDaArma(lida.propriedadesArmas, linha).gastos, C.falhasParaAuraRedirecionadora(lida).length], [final.sessao.peAtual, 2, antesArma.gastos, 0]);
  t(`${sistema} ${arma} redirecionar sem falha confirmada não cobra`, C.rolaRedirecionamentoAura(primeira.sessao, d1, redEntrada, p()).sessao === primeira.sessao, true);
  for (const [nome, extra] of [["sem alcance", { em6mDoPrimeiro: false }], ["mesmo alvo", { alvoId: ca.id }], ["sem alvo", { alvoId: null }], ["outro ataque", { ataqueId: "ausente" }]]) t(`${sistema} ${arma} ${nome} não altera`, C.rolaRedirecionamentoAura(a.sessao, d1, { ...redEntrada, ...extra }, p()).sessao === a.sessao, true);
  const fora = S.proximaRodada(a.sessao, d1).sessao;
  t(`${sistema} ${arma} fora da rodada não redireciona`, C.rolaRedirecionamentoAura(fora, atual(c, fora), redEntrada, p()).sessao === fora, true);
  const sem = deriveAfty({ ...c, aptidoesAmaldicoadas: [] });
  t(`${sistema} ${arma} retirar Aptidão impede ativação e nova jogada`, [C.preparaAuraRedirecionadora(s, sem, entrada, p()).sessao === s, C.rolaRedirecionamentoAura(a.sessao, sem, redEntrada, p()).sessao === a.sessao], [true, true]);
  const pobre = { ...s, peAtual: 1 };
  t(`${sistema} ${arma} PE insuficiente não prepara nem rola`, C.preparaAuraRedirecionadora(pobre, d, entrada, p()).sessao === pobre, true);
  t(`${sistema} ${arma} sem identidade não prepara`, C.preparaAuraRedirecionadora(s, d, entrada).sessao === s, true);
  const manual = C.preparaAuraRedirecionadora(s, d, { ...entrada, descontarPE: false }, p());
  t(`${sistema} ${arma} política manual não esconde custo`, [manual.aplicado, manual.sessao.peAtual, manual.custo.pe.naoDescontado], [true, s.peAtual, 2]);
  for (const nome of ["Atordoado", "Inconsciente", "Paralisado", "Indefeso"]) {
    const impedida = S.defineCondicoes(s, [{ id: nome, nome }]);
    t(`${sistema} ${arma} ${nome} impede preparo`, C.preparaAuraRedirecionadora(impedida, d, entrada, p()).sessao === impedida, true);
  }
  // A pistola realmente emperrou na primeira falha, e recusa novo disparo.
  if (arma !== "arm_pistola") {
    const outra = rola(a.sessao, atual(c, a.sessao), preparada.pedidoRolagem, () => 0.5);
    t(`${sistema} ${arma} projétil superado por novo ataque não volta`, C.rolaRedirecionamentoAura(outra.sessao, atual(c, outra.sessao), redEntrada, p()).sessao === outra.sessao, true);
  } else t(`${sistema} pistola emperrada recusa outro disparo antes de cobrar`, C.preparaAuraRedirecionadora(a.sessao, atual(c, a.sessao), entrada, p()).sessao === a.sessao, true);
 }
 {
  const c = ficha(sistema), ca = ficha(sistema), cb = ficha(sistema), d = deriveAfty(c), da = deriveAfty(ca), db = deriveAfty(cb);
  const s = inicio(d), sa = inicio(da), sb = inicio(db), linha = d.dano.entradas.find(l => l.id === "arm_arco_curto");
  const pr = C.preparaAuraRedirecionadora(s, d, { armaId: linha.id, chaveArma: linha.chaveArma, alvoId: ca.id, descontarPE: true }, p());
  const turnoEmCurso = { id: "turno-da-mesa", rodada: 1, turno: 7 };
  const primeiro = rola(pr.sessao, atual(c, pr.sessao), { ...pr.pedidoRolagem, contextoTurno: { rodada: 1, turno: s.uso.acoes.turno, emCurso: turnoEmCurso } }, () => 0.999);
  const falha = C.confirmaAtaqueConteudo(primeiro.sessao, atual(c, primeiro.sessao), sa, da, { ataqueId: primeiro.rolagem.id, alvoId: ca.id, camuflagem: "leve", camuflagemD10: 1 }, p());
  if (!falha.aplicado) throw Error(falha.erro);
  t(`${sistema} falha real por camuflagem apesar do vinte habilita Aura`, [primeiro.rolagem.natural, falha.ataque.acertou, C.falhasParaAuraRedirecionadora(falha.sessao).length], [20, false, 1]);
  const e = { ataqueId: primeiro.rolagem.id, alvoId: cb.id, em6mDoPrimeiro: true, turnoEmCurso, rng: () => 0 };
  for (const ctx of [null, { ...turnoEmCurso, id: "outro" }, { ...turnoEmCurso, turno: 8 }, { ...turnoEmCurso, rodada: 2 }]) t(`${sistema} contexto global diferente recusa`, C.rolaRedirecionamentoAura(falha.sessao, atual(c, falha.sessao), { ...e, turnoEmCurso: ctx }, p()).sessao === falha.sessao, true);
  const segunda = C.rolaRedirecionamentoAura(falha.sessao, atual(c, falha.sessao), e, p()); if (!segunda.aplicado) throw Error(segunda.erro);
  t(`${sistema} segunda tentativa pode falhar e não oferece dano`, [segunda.rolagem.natural, C.danoDoRedirecionamentoAura(segunda.sessao, atual(c, segunda.sessao))], [1, null]);
  const resultado = C.confirmaAtaqueConteudo(segunda.sessao, atual(c, segunda.sessao), sb, db, { ataqueId: segunda.rolagem.id, alvoId: cb.id }, p());
  t(`${sistema} desastre da segunda mantém eventos próprios de B`, [resultado.aplicado, resultado.ataque.desastre, resultado.sessaoAlvo.uso.sequencia.ataques, resultado.sessaoAlvo.hpAtual], [true, true, 1, sb.hpAtual]);
  const dano = rola(primeiro.sessao, atual(c, primeiro.sessao), { tipo: "dano", rotulo: linha.nome, grupos: linha.gruposDano, linhaArma: linha, modoDano: "critico" }, () => 0.5);
  const acerto = C.confirmaAtaqueConteudo(dano.sessao, atual(c, dano.sessao), sa, da, { ataqueId: primeiro.rolagem.id, danoId: dano.rolagem.id, alvoId: ca.id }, p());
  t(`${sistema} acertar de primeira não libera redirecionamento`, [acerto.aplicado, acerto.ataque.acertou, C.falhasParaAuraRedirecionadora(acerto.sessao).length], [true, true, 0]);
 }
 const c = ficha(sistema, "arm_lanca"), d = deriveAfty(c), s = inicio(d), linha = d.dano.entradas.find(l => l.id === "arm_lanca");
 t(`${sistema} Arremessável sem linha arremessada continua corpo`, [linha.categoria, C.armasParaAuraRedirecionadora(d).length, C.preparaAuraRedirecionadora(s, d, { armaId: linha.id, chaveArma: linha.chaveArma }, p()).sessao === s], ["corpo", 0, true]);
 const baixa = ficha(sistema); baixa.attributes.destreza = 12; const db = deriveAfty(baixa), sb = inicio(db), l = db.dano.entradas.find(l => l.id === "arm_arco_curto");
 t(`${sistema} Destreza insuficiente não ativa`, C.preparaAuraRedirecionadora(sb, db, { armaId: l.id, chaveArma: l.chaveArma }, p()).sessao === sb, true);
 const sequencia = registraAtaqueRecebido(inicio(d), d, { acertou: false }, p());
 t(`${sistema} usa a sequência nativa do alvo`, sequencia.sequencia.ataques, 1);
}
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
