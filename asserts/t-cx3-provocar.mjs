import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const { preparaRolagemArma } = await import(R + "afty-propriedades-armas.js");
const { rolarTeste } = await import(R + "ficha/ficha-rolagem.js");
const { rolaSorte, escolheSorte } = await import(R + "ficha/ficha-conteudo-uso.js");
const { confirmaAtaqueConteudo } = await import(R + "ficha/ficha-conteudo-combate.js");
const { criarEncontro, criarCombatente, definirIniciativa } = await import(R + "encontros/afty-encontro.js");
const { redutorDeEncontro } = await import(R + "encontros/usar-encontro-afty.js");
const P = await import(R + "ficha/ficha-conteudo-provocar.js");
const S = await import(R + "ficha/ficha-sessao.js");

let ok = 0, seq = 0;
const erros = [], t = (nome,a,b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : erros.push(nome + ": " + JSON.stringify(a) + " != " + JSON.stringify(b));
const pedido = () => ({ opId: "provocacao-" + ++seq });
const TALENTO = "tal_provocacao_desafiadora";
aplicarAddons([]);

function ficha(sistema, id, desafia) {
 const c = createBlankAfty(); c.rulesVersion = sistema; c.id = id; c.name = id; c.attrMethod = "fixos"; c.core.nd = 12;
 c.attributes = { forca: 13, destreza: 12, constituicao: 13, inteligencia: 8, sabedoria: 12, presenca: 15 };
 c.core.origem = { id: "inato", bonusAtributos: { presenca: 2, forca: 1 } };
 c.core.atributosBonus = { presenca: 2 };
 c.especializacoes = [{ id: "combatente", nivel: 12 }];
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
 c.talentos = [ ...(desafia ? [TALENTO] : []), "tal_favorecido_pela_sorte" ];
 c.pericias = { intimidacao: "treinado", intuicao: "treinado" };
 return c;
}
const nova = d => ({ ...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d), d), d), rodada: 1 });
const copia = (s,d) => S.normalizaSessao(JSON.parse(JSON.stringify(s)),d);

for (const sistema of ["player", "afty"]) {
 const c = ficha(sistema,"provocador",true), ca = ficha(sistema,"alvo",false), cb = ficha(sistema,"terceiro",false);
 const d = deriveAfty(c), da = deriveAfty(ca), db = deriveAfty(cb);
 const s = nova(d), sa = nova(da), sb = nova(db);
 const entrada = { emSeuTurno: true, voceId: c.id, alvoId: ca.id, distancia: 9, oposicao: "intuicao", rng: () => 0.999, rngAlvo: () => 0 };
 const rola = (e = {}, base = s, alvo = sa, de = d) => P.rolaProvocar(base,de,alvo,da,{ ...entrada,...e },pedido());
 const conclui = (r,e = {},de = d) => P.concluiProvocar(r.sessao,de,r.sessaoAlvo,da,{ ...entrada,rolagemId: r.provocador.id,...e },pedido());
 const teste = (n,a,b) => t(sistema + " " + n,a,b);

 teste("Talento acessível", d.talentos.inacessiveis, []);
 teste("limite é metade do MOD PRE", P.usosLivresDeProvocar(s,d).max, Math.floor(d.mods.presenca / 2));
 teste("fora de alcance não gasta ação", rola({ distancia: 9.01 }).sessao === s, true);
 teste("fora do turno não gasta ação", rola({ emSeuTurno: false }).sessao === s, true);
 const fechado = S.encerraTurnoFicha(s,d);
 teste("turno encerrado recusa início de disputa", rola({},fechado).sessao === fechado,true);
 teste("sem oposição permitida não gasta ação", rola({ oposicao: "atletismo" }).sessao === s, true);
 teste("Provocação Livre exige Talento", rola({ livre: true },sa,s,da).aplicado, false);

 const comum = rola();
 if (!comum.aplicado) throw Error(comum.erro);
 teste("ação comum e testes dos dois lados", [comum.sessao.uso.acoes.gastas.comum, comum.provocador.periciaId, comum.alvo.periciaId], [1,"intimidacao","intuicao"]);
 teste("oposição não gasta ação do alvo", comum.sessaoAlvo.uso.acoes.gastas, sa.uso.acoes.gastas);
 teste("bônus usa a linha nativa de Provocar", comum.provocador.bonus, d.testes.manobras.find(m=>m.id==="provocar").executar);
 teste("só uma disputa pendente", rola({ livre: true }, comum.sessao, comum.sessaoAlvo).aplicado, false);
 teste("disputa persiste após recarga", P.provocacoesPendentes(copia(comum.sessao,d)).map(r=>r.id), [comum.provocador.id]);
 teste("alvo diferente não consome recibo", conclui(comum,{ alvoId: cb.id }).aplicado, false);
 teste("fim do turno invalida disputa pendente", conclui({ ...comum,sessao:S.encerraTurnoFicha(comum.sessao,d) }).aplicado, false);
 const sorte = rolaSorte(comum.sessao,d,{id:comum.provocador.id,rng:()=>0.45},pedido());
 teste("escolha de Sorte bloqueia o efeito", conclui({ ...comum,sessao:sorte.sessao }).aplicado,false);
 const escolheu = escolheSorte(sorte.sessao,d,{id:comum.provocador.id,escolha:"original"},pedido());
 const sucesso = conclui({ ...comum,sessao:escolheu.sessao });
 if (!sucesso.aplicado) throw Error(sucesso.erro);
 teste("sucesso arma somente o alvo, com obrigação", [sucesso.sucesso,P.provocacoesAtivas(sucesso.sessao).length,P.provocacoesSemAtaque(sucesso.sessaoAlvo).length], [true,0,1]);
 teste("sem repetir consequência", conclui({ ...comum,sessao:sucesso.sessao,sessaoAlvo:sucesso.sessaoAlvo }).aplicado, false);
 const falha = conclui(rola({ rng:()=>0,rngAlvo:()=>0.999, oposicao:"intimidacao" }));
 teste("oposição vencedora não gera efeito", [falha.sucesso,P.provocacoesAtivas(falha.sessaoAlvo).length],[false,0]);
 const semTalento = conclui(rola({},s,sa,da),{},da);
 teste("Provocar comum sem o Talento afeta modo sem obrigação", [P.provocacoesAtivas(semTalento.sessaoAlvo).length,P.provocacoesSemAtaque(semTalento.sessaoAlvo).length],[1,0]);

 const leve = rola({ livre:true });
 if (!leve.aplicado) throw Error(leve.erro);
 teste("Livre não gasta Comum nem PE", [leve.sessao.uso.acoes.gastas.comum,leve.sessao.peAtual,P.usosLivresDeProvocar(leve.sessao,d).restantes], [0,s.peAtual,P.usosLivresDeProvocar(s,d).max-1]);
 teste("Descanso restaura a quota", P.usosLivresDeProvocar(S.descansar(leve.sessao,d),d).restantes,P.usosLivresDeProvocar(s,d).max);
 teste("virada de rodada conserva a quota gasta", P.usosLivresDeProvocar(S.proximaRodada(leve.sessao,d).sessao,d).restantes,P.usosLivresDeProvocar(leve.sessao,d).restantes);
 const gastos = { ...s, usos: { "longo:tal_provocacao_desafiadora": P.usosLivresDeProvocar(s,d).max } };
 teste("quota vazia recusa uso Livre", rola({livre:true},gastos).sessao === gastos,true);

 const alvoProvocado = copia(sucesso.sessaoAlvo,da), ativas = P.provocacoesAtivas(alvoProvocado);
 const linha = da.dano.entradas.find(l=>l.fonte==="basico");
 const desc = { tipo:"teste",tipoTeste:"ataque",rotulo:linha.nome,linhaArma:linha,bonus:linha.acerto };
 const preparado = (alvoId,p = desc) => preparaRolagemArma(P.ataqueSobProvocacao(p,ativas,alvoId));
 const dados = (p,rng=()=>0) => rolarTeste(p,rng);
 teste("sem alvo a preparação recusa", P.ataqueSobProvocacao(desc,ativas,""),null);
 teste("dois dados em vantagem contra o provocador", [preparado(c.id).modo,dados(preparado(c.id)).d20.length],["vantagem",2]);
 teste("dois dados em desvantagem contra terceiro", [preparado(cb.id).modo,dados(preparado(cb.id)).d20.length],["desvantagem",2]);
 teste("modo oposto cancela", preparado(c.id,{...desc,modo:"desvantagem"}).modo,"normal");
 teste("outras fontes do Motor cancelam", preparado(cb.id,{...desc,linhaArma:{...linha,vantagemAtaque:{vantagem:true}}}).modo,"normal");
 const ataque = dados(preparado(c.id)), saAtaque = S.registraRolagem(alvoProvocado,ataque);
 const aplica = (alvoId,base = saAtaque) => confirmaAtaqueConteudo(base,da,s,d,{ataqueId:ataque.id,alvoId},pedido());
 teste("recusa trocar o alvo após rolar", aplica(cb.id).sessao === saAtaque,true);
 const confirmada = aplica(c.id);
 teste("erro confirmado satisfaz a obrigação e conserva o modo", [confirmada.ataque.acertou,P.provocacoesSemAtaque(confirmada.sessao).length,P.provocacoesAtivas(confirmada.sessao).length],[false,0,1]);

 const encontro = criarEncontro({nome:"Provocação"});
 encontro.combatentes = [c,ca,cb].map((f,i)=>definirIniciativa(criarCombatente(f,{derived:[d,da,db][i]}),30-i*10));
 const derivados = Object.fromEntries(encontro.combatentes.map((x,i)=>[x.id,[d,da,db][i]]));
 const iniciado = redutorDeEncontro(encontro,{ tipo:"COMECAR", derivados });
 const original = iniciado.combatentes[0].id, destino = iniciado.combatentes[1].id, terceiro = iniciado.combatentes[2].id;
 const etapa = P.rolaProvocar(iniciado.combatentes[0].sessao,d,iniciado.combatentes[1].sessao,da,
  {...entrada,voceId:original,alvoId:destino},pedido());
 if (!etapa.aplicado) throw Error(etapa.erro);
 const fim = conclui(etapa,{voceId:original,alvoId:destino});
 if (!fim.aplicado) throw Error(fim.erro);
 const mesa = { ...iniciado,combatentes: iniciado.combatentes.map((x,i)=>i<2?{...x,sessao:i?fim.sessaoAlvo:fim.sessao}:x) };
 const avanca = e => redutorDeEncontro(e,{tipo:"PROXIMO_TURNO",derivados});
 const primeiro = avanca(mesa), segundo = avanca(primeiro), retorno = avanca(segundo);
 teste("turnos do alvo e de terceiro conservam efeito", [primeiro.ativoId,segundo.ativoId,P.provocacoesAtivas(segundo.combatentes[1].sessao).length],[destino,terceiro,1]);
 teste("efeito termina no início do turno do provocador", [retorno.ativoId,P.provocacoesAtivas(retorno.combatentes[1].sessao).length],[original,0]);
}

if (erros.length) { console.error(erros.join("\n")); process.exitCode = 1; }
else console.log("TODOS OS "+ok+" ASSERTS PASSARAM");
