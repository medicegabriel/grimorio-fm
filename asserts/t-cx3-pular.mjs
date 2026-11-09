import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const { rolaSorte, escolheSorte } = await import(R + "ficha/ficha-conteudo-uso.js");
const P = await import(R + "ficha/ficha-conteudo-salto.js");
const S = await import(R + "ficha/ficha-sessao.js");
const { rolarTeste, rolarDano } = await import(R + "ficha/ficha-rolagem.js");
const { confirmaAtaqueConteudo, bonusSaltadorContra } = await import(R + "ficha/ficha-conteudo-combate.js");
let ok = 0, seq = 0;
const bad = [], t = (n, a, b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : bad.push(`${n}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
const p = () => ({ opId: `pular-${++seq}` });

function ficha(sistema, classe = "combatente") {
 const c = createBlankAfty(); c.rulesVersion = sistema; c.core.nd = 12; c.attrMethod = "fixos";
 c.attributes = { forca: 15, destreza: 14, constituicao: 13, inteligencia: 10, sabedoria: 12, presenca: 8 };
 c.core.origem = { id: "inato", bonusAtributos: { forca: 2, destreza: 1 } }; c.especializacoes = [{ id: classe, nivel: 12 }];
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao", "ger_aptidao"] : [];
 c.pericias = { atletismo: "treinado", acrobacia: "treinado", feiticaria: "treinado" };
 c.talentos = ["tal_saltador_constante", "tal_favorecido_pela_sorte"];
 c.aptidoes = { cl: 3, er: 0, au: 0, dom: 0, bar: 0 }; c.aptidoesAmaldicoadas = ["estimulo_muscular"];
 return c;
}
const inicia = d => ({ ...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d), d), d), rodada: 1 });
const entrada = { direcao: "horizontal", emSeuTurno: true };
aplicarAddons([]);

for (const sistema of ["player", "afty"]) {
 const c = ficha(sistema), d = deriveAfty(c), s = inicia(d);
 t(`${sistema} requisitos e orçamento válidos`, [d.talentos.inacessiveis, d.habilidades.excedeu, d.testes.orcamento.excedeu], [[], false, false]);
 t(`${sistema} modificador 3 dá 6 m, depois 7,5 m`, [P.alcancePular(s, d).comum, P.alcancePular(s, d).superior], [6, 7.5]);
 const tentativa = p(), salto = P.iniciaPulo(s, d, entrada, tentativa);
 if (!salto.aplicado) throw Error(salto.erro);
 t(`${sistema} pulo sem teste usa Movimento`, [salto.sessao.uso.acoes.gastas, salto.rolagem.tipo], [{ comum: 0, bonus: 0, movimento: 1 }, "info"]);
 t(`${sistema} repetir id é inerte`, P.iniciaPulo(salto.sessao, d, entrada, tentativa).repetida, true);
 t(`${sistema} pulo pendente não permite outro`, P.iniciaPulo(salto.sessao, d, entrada, p()).sessao === salto.sessao, true);
 t(`${sistema} salto livre ainda não disponível`, P.puloLivreDisponivel(salto.sessao, d), null);
 const conclui = (r, extra = {}) => P.concluiPulo(r.sessao, d, { puloId: r.rolagem.id, distancia: 6, ...extra }, p());
 t(`${sistema} exceder a distância preserva rolagem`, conclui(salto, { distancia: 6.1 }).sessao === salto.sessao, true);
 const perto = conclui(salto, { paredeAoFim: true });
 t(`${sistema} aterrissagem e parede registradas`, [perto.distancia, P.puloLivreDisponivel(perto.sessao, d)?.id], [6, salto.rolagem.id]);
 const outro = P.iniciaPulo(perto.sessao, d, { ...entrada, direcao: "vertical", livre: true }, p());
 if (!outro.aplicado) throw Error(outro.erro);
 t(`${sistema} pulo livre corta a distância e conserva ações comuns`, [P.resultadoPulo(outro.rolagem).maximo, outro.sessao.uso.acoes.gastas, outro.rolagem.contextoPulo.direcao], [3, perto.sessao.uso.acoes.gastas, "vertical"]);
 const repetiu = conclui(outro, { distancia: 3, paredeAoFim: true });
 t(`${sistema} segundo pulo não encadeia outro livre`, P.iniciaPulo(repetiu.sessao, d, { ...entrada, livre: true }, p()).aplicado, false);
 t(`${sistema} falta de parede impede livre`, P.iniciaPulo(conclui(salto).sessao, d, { ...entrada, livre: true }, p()).aplicado, false);
 t(`${sistema} fora do turno recusa`, P.iniciaPulo(s, d, { ...entrada, emSeuTurno: false }, p()).aplicado, false);
 t(`${sistema} intervalo ausente não gasta Movimento`, P.iniciaPulo(s, { ...d, mods: { ...d.mods, forca: -2 } }, entrada, p()).sessao === s, true);
 t(`${sistema} sem faixa superior após +10`, P.iniciaPulo(s, { ...d, mods: { ...d.mods, forca: 10 } }, { ...entrada, pericia: "atletismo" }, p()).aplicado, false);
 t(`${sistema} Acrobacia depende de Acrobata`, P.iniciaPulo(s, d, { ...entrada, pericia: "acrobacia" }, p()).aplicado, false);


 // O alvo só é conhecido ao confirmar. O ajuste do d20 pode decidir o acerto.
 const linha = d.dano.entradas.find(l => l.fonte === "basico");
 const sa = inicia(d);
 const alvo = "alvo", outroAlvo = "outro";
 const rola = (sessao, rng = () => 0.45) => {
  const ataque = rolarTeste({ rotulo: linha.nome, tipoTeste: "ataque", linhaArma: linha, bonus: d.defesa - 11 }, rng);
  const dano = rolarDano({ rotulo: linha.nome, linhaArma: linha, grupos: linha.gruposDano }, () => 0.5);
  return { ataque, dano, sessao: S.registraRolagem(S.registraRolagem(sessao, ataque), dano) };
 };
 const confirma = (r, alvoId = alvo, sessaoAlvo = sa) => confirmaAtaqueConteudo(r.sessao, d, sessaoAlvo, d,
  { ataqueId: r.ataque.id, danoId: r.dano.id, alvoId, inimigo: true }, p());
 const durante = rola(salto.sessao);
 const aterrissou = P.concluiPulo(durante.sessao, d, { puloId: salto.rolagem.id, distancia: 6, alvoId: alvo, paredeAoFim: true }, p());
 t(`${sistema} Saltador arma o alvo em Pular comum`, aterrissou.sessao.uso.pendencias[0].elegivel.contraAlvo, alvo);
 t(`${sistema} ataque antes da aterrissagem não recebe nem gasta o bônus`,
  [confirma({ ...durante, sessao: aterrissou.sessao }).ataque.acertou,
   confirma({ ...durante, sessao: aterrissou.sessao }).sessao.uso.pendencias.length], [false, 1]);
 const depois = rola(S.normalizaSessao(JSON.parse(JSON.stringify(aterrissou.sessao)), d));
 const contraOutro = confirma(depois, outroAlvo);
 t(`${sistema} alvo diferente não gasta bônus`, [contraOutro.ataque.acertou, contraOutro.sessao.uso.pendencias.length], [false, 1]);
 const maisUm = rola(contraOutro.sessao);
 const acerto = confirma(maisUm);
 const recibo = acerto.sessao.log[0];
 t(`${sistema} primeiro ataque ao alvo acerta com +2 e causa MOD FOR`,
  [acerto.ataque.acertou, recibo.totalAtaque, recibo.fontesSaltador.map(x => x.valor), acerto.calculos.reduce((soma, x) => soma + x.base, 0)],
  [true, maisUm.ataque.total + 2, [2, d.mods.forca], maisUm.dano.total + d.mods.forca]);
 t(`${sistema} ataque seguinte não tem ajuste`, confirma(rola(acerto.sessao), alvo, acerto.sessaoAlvo).ataque.acertou, false);
 const falhaSaltador = confirma(rola(aterrissou.sessao, () => 0));
 t(`${sistema} desastre consome o benefício sem causar dano`,
  [falhaSaltador.ataque.desastre, falhaSaltador.sessao.uso.pendencias.length, falhaSaltador.sessaoAlvo.hpAtual], [true, 0, sa.hpAtual]);
 const aposTurno = rola(S.encerraTurnoFicha(aterrissou.sessao, d));
 t(`${sistema} Saltador expira ao terminar o turno`, bonusSaltadorContra(aposTurno.sessao, d, aposTurno.ataque.id, alvo), null);
 const livreComAlvo = P.iniciaPulo(aterrissou.sessao, d, { ...entrada, livre: true }, p());
 const segundoPulo = P.concluiPulo(livreComAlvo.sessao, d, { puloId: livreComAlvo.rolagem.id, distancia: 3, alvoId: alvo }, p());
 const acertoSegundoPulo = confirma(rola(segundoPulo.sessao));
 t(`${sistema} Pular Livre também habilita o benefício, sem acumular dois bônus`,
  [acertoSegundoPulo.ataque.acertou, acertoSegundoPulo.sessao.log[0].fontesSaltador.map(x => x.valor), acertoSegundoPulo.sessao.uso.pendencias.length],
  [true, [2, d.mods.forca], 0]);

 const testa = P.iniciaPulo(s, d, { ...entrada, pericia: "atletismo", rng: () => 0 }, p());
 const falha = conclui(testa, { distancia: 1 });
 t(`${sistema} falha percorre faixa comum e aterrissa caído`, [falha.distancia, falha.caiu, falha.sessao.condicoes.at(-1).nome], [6, true, "Caído"]);
 t(`${sistema} não pula enquanto caído`, P.iniciaPulo(falha.sessao, d, entrada, p()).aplicado, false);
 const rerrolada = rolaSorte(testa.sessao, d, { id: testa.rolagem.id, rng: () => 0.999 }, p());
 t(`${sistema} Sorte pendente bloqueia consequência`, P.concluiPulo(rerrolada.sessao, d, { puloId: testa.rolagem.id, distancia: 6 }, p()).aplicado, false);
 const escolhida = escolheSorte(rerrolada.sessao, d, { id: testa.rolagem.id, escolha: "novo" }, p());
 const relida = S.normalizaSessao(JSON.parse(JSON.stringify(escolhida.sessao)), d);
 const sucesso = P.concluiPulo(relida, d, { puloId: testa.rolagem.id, distancia: 7.5 }, p());
 t(`${sistema} sucesso após Sorte e recarga usa faixa superior`, [sucesso.aplicado, sucesso.distancia, sucesso.caiu], [true, 7.5, false]);
 t(`${sistema} fim do turno expira recibo pendente`, P.concluiPulo(S.encerraTurnoFicha(testa.sessao, d), d, { puloId: testa.rolagem.id, distancia: 6 }, p()).aplicado, false);
 t(`${sistema} não conclui o mesmo pulo duas vezes`, P.concluiPulo(sucesso.sessao, d, { puloId: testa.rolagem.id, distancia: 6 }, p()).aplicado, false);

 const forte = P.iniciaPulo(s, d, { ...entrada, estimulo: true }, p());
 t(`${sistema} Estímulo dobra o pulo e paga 1 PE junto do Movimento`, [P.resultadoPulo(forte.rolagem).maximo, s.peAtual - forte.sessao.peAtual, forte.sessao.uso.acoes.gastas.movimento], [12, 1, 1]);
 const sSemPe = { ...s, peAtual: 0, peTempFontes: {} };
 t(`${sistema} Estímulo recusado não gasta Movimento`, P.iniciaPulo(sSemPe, d, { ...entrada, estimulo: true }, p()).sessao === sSemPe, true);
 const concluidoForte = conclui(forte);
 t(`${sistema} mesma rodada respeita o contador de Estímulo`, P.iniciaPulo(concluidoForte.sessao, d, { ...entrada, estimulo: true }, p()).sessao === concluidoForte.sessao, true);

 const l = ficha(sistema, "lutador"); l.habilidades = ["lut_acrobata"]; l.core.origem.bonusAtributos = { destreza: 2, forca: 1 };
 const dl = deriveAfty(l), sl = inicia(dl), atl = P.iniciaPulo(sl, dl, { ...entrada, pericia: "acrobacia", rng: () => 0.999 }, p());
 t(`${sistema} Acrobata real troca a tabela por Destreza e autoriza teste`, [dl.habilidades.inacessiveis, P.alcancePular(sl, dl).atributo, atl.rolagem.periciaId], [[], "destreza", "acrobacia"]);
 const h = ficha(sistema); h.core.origem.id = "feto_amaldicoado_hibrido"; h.talentos = ["tal_fisico_aperfeicoado"]; h.escolhasTalento = { tal_fisico_aperfeicoado: ["tal_fisico_pulo"] };
 const dh = deriveAfty(h);
 t(`${sistema} escolha Pulo de Físico Aperfeiçoado aumenta metade`, [dh.talentos.inacessiveis, P.alcancePular(inicia(dh), dh).comum], [[], 9]);
 const r = ficha(sistema, "restringido"); r.core.origem = { id: "restringido" }; r.core.tipo = "restringido";
 r.habilidades = ["res_restrito_pelos_ceus"]; r.escolhasHabilidade = { res_restrito_pelos_ceus: ["res_dadiva_forca_devastadora"] };
 const dr = deriveAfty(r);
 t(`${sistema} Força Devastadora acrescenta os 3 m nativos`, P.alcancePular(inicia(dr), dr).comum, P.alcancePular(inicia(dr), { ...dr, configuracaoEspecializacao: {} }).comum + 3);
}

if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
