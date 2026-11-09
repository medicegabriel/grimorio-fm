import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const { aplicarAddons } = await import(R + "afty-addons.js");
const { rolarDano } = await import(R + "ficha/ficha-rolagem.js");
const { criarEncontro, criarCombatente, definirIniciativa } = await import(R+"encontros/afty-encontro.js");
const { redutorDeEncontro } = await import(R+"encontros/usar-encontro-afty.js");
const { usaCuraConteudo, conteudoComAlvo, curasParaSintonizar, usaSintonizacaoVital } = await import(R + "ficha/ficha-conteudo-uso.js");
const M = await import(R + "ficha/ficha-conteudo-medicina.js");
const S = await import(R + "ficha/ficha-sessao.js");
let ok = 0, seq = 0;
const erros = [], t = (nome,a,b) => JSON.stringify(a) === JSON.stringify(b) ? ok++ : erros.push(nome + ": " + JSON.stringify(a) + " != " + JSON.stringify(b));
const pedido = () => ({ opId: "medicina-" + ++seq, registraAcao: true });
const ID = "sup_medicina_infalivel", CURA = "cura_suporte_em_combate";
aplicarAddons([]);

function ficha(sistema,id,medicina = true) {
 const c = createBlankAfty(); c.rulesVersion = sistema; c.id = id; c.name = id; c.core.nd = medicina ? 12 : 6; c.attrMethod = "fixos";
 c.attributes = { forca: 14, destreza: 12, constituicao: 13, inteligencia: 10, sabedoria: 15, presenca: 8 };
 c.core.origem = { id: "inato", bonusAtributos: { forca: 2, sabedoria: 1 } };
 c.especializacoes = [{ id: "suporte", nivel: c.core.nd }];
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
 c.habilidades = ["sup_suporte_em_combate","sup_sintonizacao_vital", ...(medicina && sistema === "afty" ? [ID] : [])];
 c.pericias = { medicina:"treinado",feiticaria:"treinado" };
 return c;
}
const inicia = d => ({ ...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d),d),d), rodada: 1 });
const copia = (s,d) => S.normalizaSessao(JSON.parse(JSON.stringify(s)),d);

for (const sistema of ["player","afty"]) {
 const c = ficha(sistema,"cura"), ca = ficha(sistema,"alvo",false), cb = ficha(sistema,"outro",false);
 const d = deriveAfty(c), da = deriveAfty(ca), db = deriveAfty(cb);
 const s = { ...inicia(d), hpAtual: d.hp - 20 }, sa = { ...inicia(da), hpAtual: da.hp - 6 }, sb = { ...inicia(db), hpAtual: 1 };
 const emCurso = { id:c.id, rodada:1, turno:s.uso.acoes.turno };
 const entrada = { id:CURA, aliado:true, alvoId:ca.id, turnoEmCurso:emCurso, aguardarMedicina:true, rng:()=>0.25 };
 const externo = { sessao:sa,derived:da };
 const rola = (e = {},base = s,de = d,alvo = externo) => usaCuraConteudo(base,de,{ ...entrada,...e },pedido(),alvo);
 const testa = (n,a,b) => t(sistema+" "+n,a,b);
 testa("acesso válido em cada versão", [d.habilidades.efetivas.includes(ID),d.habilidades.inacessiveis,d.habilidades.excedeu],[true,[],false]);
 const quota = M.usosMedicinaInfalivel(s,d);
 testa("quota usa metade do nível de Suporte mais BT", quota.max,6+d.maestria);
 testa("cura em nível abaixo de 10 não prepara Medicina", rola({},sa,da).sessao === sa,true);
 testa("uso imediato conserva a via anterior", [rola({aguardarMedicina:false}).sessaoAlvo.hpAtual, M.curasMedicinaPendentes(rola({aguardarMedicina:false}).sessao).length],[da.hp,0]);

 const pendente = rola();
 if (!pendente.aplicado) throw Error(pendente.erro);
 const { rolagem } = pendente;
 const lida = copia(pendente.sessao,d), alvoLido = copia(pendente.sessaoAlvo,da);
 const e = { operacao:"concluiCuraMedicina",curaId:rolagem.id,alvoId:ca.id,turnoEmCurso:emCurso,indices:[0,1] };
 const aplica = (s1 = lida,p = pedido(),extras = {},alvo = alvoLido) => conteudoComAlvo(s1,d,alvo,da,{...e,...extras},p);
 const dados = M.dadosParaMedicina(rolagem);
 const ganho = dados.slice(0,2).reduce((s,x)=>s+x.faces-x.valor,0);
 testa("paga a ação e o uso da cura, sem alterar PV nem quota de Medicina",
  [pendente.sessao.uso.acoes.gastas.bonus,pendente.sessaoAlvo.hpAtual,M.usosMedicinaInfalivel(pendente.sessao,d).restantes],[1,sa.hpAtual,quota.max]);
 testa("dados e destinatário pendentes persistem", [M.curasMedicinaPendentes(lida)[0]?.id,dados.length,rolagem.contextoCura.alvoId],[rolagem.id,rolagem.dados.length,ca.id]);
 testa("Sintonização espera a cura", curasParaSintonizar(lida,emCurso),[]);
 testa("recusa alvo diferente sem gastar", aplica(lida,pedido(),{alvoId:cb.id}).sessao === lida,true);
 testa("recusa dado duplicado", aplica(lida,pedido(),{indices:[0,0]}).sessao === lida,true);
 testa("recusa índice fora dos dados", aplica(lida,pedido(),{indices:[999]}).sessao === lida,true);
 testa("recusa turno diferente", aplica(lida,pedido(),{turnoEmCurso:{...emCurso,turno:2}}).sessao === lida,true);
 const semQuota = S.marcaUso(lida,quota,quota.max);
 testa("quota alterada antes de aplicar recusa o gasto", aplica(semQuota).sessao === semQuota,true);
 const feito = pedido(), final = aplica(lida,feito);
 if (!final.aplicado) throw Error(final.erro);
 testa("maximiza dois dados da mesma rolagem", [final.rolagem.id,final.rolagem.total,final.rolagem.dados.slice(0,2),final.rolagem.gruposRolados.reduce((s,g)=>s+g.total,0)],
  [rolagem.id,rolagem.total+ganho,dados.slice(0,2).map(x=>x.faces),rolagem.total+ganho]);
 testa("dois usos sem outra ação, PE ou uso da cura", [M.usosMedicinaInfalivel(final.sessao,d).restantes, final.sessao.uso.acoes,final.sessao.peAtual],
  [quota.max-2,pendente.sessao.uso.acoes,pendente.sessao.peAtual]);
 testa("aplica o teto apenas ao recuperar PV", [final.rolagem.contextoCura.recuperado,final.sessaoAlvo.hpAtual,final.rolagem.contextoCura.valor],
  [6,da.hp,rolagem.total+ganho]);
 testa("registra a versão final única nos dois históricos", [final.sessao.log.filter(x=>x.id===rolagem.id).length,final.sessaoAlvo.log.find(x=>x.id===rolagem.id)?.total],
  [1,final.rolagem.total]);
 testa("repetição não reaplica", [aplica(final.sessao,feito).repetida,aplica(final.sessao).aplicado],[true,false]);
 const sintoniza = usaSintonizacaoVital(final.sessao,d,{ curaId:rolagem.id,alvoId:cb.id,emAlcance:true,turnoEmCurso:emCurso,descontarPE:true },pedido(),{sessao:sb,derived:db});
 testa("Sintonização lê a cura ajustada antes do teto", sintoniza.cura,Math.floor((rolagem.total+ganho)/2));
 const sem = aplica(lida,pedido(),{indices:[]});
 testa("pode aplicar sem gastar Medicina", [sem.cura,M.usosMedicinaInfalivel(sem.sessao,d).restantes],[rolagem.total,quota.max]);
 testa("encerrar turno invalida a escolha", M.curasMedicinaPendentes(S.encerraTurnoFicha(lida,d)).length,0);
 const descansou = S.descansar(final.sessao,d);
 testa("descanso limpa a pendência e repõe a quota", [M.curasMedicinaPendentes(descansou).length,M.usosMedicinaInfalivel(descansou,d).restantes],[0,quota.max]);

 const avulsa = { ...S.sessaoEmBranco(d),hpAtual: d.hp-30 };
 const propria = rola({alvoId:null,turnoEmCurso:null},avulsa,d,null);
 if (!propria.aplicado) throw Error(propria.erro);
 const curaPropria = M.concluiCuraComMedicina(copia(propria.sessao,d),d,{curaId:propria.rolagem.id,indices:[0]},pedido());
 testa("ficha avulsa conclui cura própria após recarga", [curaPropria.aplicado,curaPropria.rolagem.contextoCura.alvoId,curaPropria.sessao.hpAtual],
  [true,null,Math.min(d.hp,avulsa.hpAtual+curaPropria.cura)]);
 testa("descansar apaga a escolha em ficha avulsa", M.curasMedicinaPendentes(S.descansar(propria.sessao,d)).length,0);

 const cf=ficha(sistema,"Fluxo");
 if(sistema==="afty")cf.habilidadesGerais.push("ger_aptidao");
 cf.aptidoes={au:0,cl:3,er:3,dom:0,bar:0};
 cf.aptidoesAmaldicoadas=["energia_reversa","fluxo_constante","liberacao_de_energia_reversa"];
 const df=deriveAfty(cf), sf={...inicia(df),hpAtual:df.hp-40};
 const ef={id:"cura_energia_reversa",fluxo:true,blocos:1,rng:()=>0.25};
 const curaFluxo=(base, extra, alvo=null)=>usaCuraConteudo(base,df,{...ef,...extra},pedido(),alvo);
 const livre=curaFluxo(sf,{inicioTurno:true});
 if(!livre.aplicado)throw Error(livre.erro);
 testa("Fluxo Livre e Reação são alternativas",curaFluxo(livre.sessao,{reduziuVida:true}).sessao===livre.sessao,true);
 testa("Fluxo não cura aliado pela Liberação",curaFluxo(sf,{inicioTurno:true,alvoId:ca.id},externo).sessao===sf,true);
 testa("Fluxo exige só um gatilho",curaFluxo(sf,{inicioTurno:true,reduziuVida:true}).sessao===sf,true);
 const livreMedicina=curaFluxo(sf,{inicioTurno:true,aguardarMedicina:true});
 if(!livreMedicina.aplicado)throw Error(livreMedicina.erro);
 const livreFeito=M.concluiCuraComMedicina(livreMedicina.sessao,df,{curaId:livreMedicina.rolagem.id,indices:[0]},pedido());
 testa("Medicina em Fluxo Livre preserva cota e custa um uso",
  [livreFeito.aplicado,livreFeito.sessao.uso.acoes.livres["fluxo:inicioTurno"],sf.peAtual-livreFeito.sessao.peAtual,livreFeito.sessao.usos["hab:"+ID]],
  [true,1,2,1]);

 const encontro=criarEncontro({nome:"Fluxo"});
 encontro.combatentes=[ca,cf].map((f,i)=>definirIniciativa(criarCombatente(f,{derived:[da,df][i]}),20-i*10));
 const [outroId,fluxoId]=encontro.combatentes.map(x=>x.id);
 const derivados={[outroId]:da,[fluxoId]:df};
 const mesa=redutorDeEncontro(encontro,{tipo:"COMECAR",derivados});
 const turno={id:outroId,rodada:mesa.rodada,turno:mesa.combatentes[0].sessao.uso.acoes.turno};
 const antes={...mesa.combatentes[1].sessao,hpAtual:df.hp-40};
 const reacao=curaFluxo(antes,{reduziuVida:true,aguardarMedicina:true,emSeuTurno:false,turnoEmCurso:turno});
 if(!reacao.aplicado)throw Error(reacao.erro);
 const comReacao={...mesa,combatentes:[mesa.combatentes[0],{...mesa.combatentes[1],sessao:reacao.sessao}]};
 const resposta=(s,t)=>M.concluiCuraComMedicina(s,df,{curaId:reacao.rolagem.id,indices:[0],turnoEmCurso:t},pedido());
 const lidoFluxo=copia(reacao.sessao,df), aplicadoFluxo=resposta(lidoFluxo,turno);
 testa("Reação de Fluxo ajusta dado no turno em curso sem gastar outra reação",
  [aplicadoFluxo.aplicado,aplicadoFluxo.sessao.uso.acoes,antes.peAtual-aplicadoFluxo.sessao.peAtual],
  [true,reacao.sessao.uso.acoes,2]);
 testa("confirmação de reação recusa turno diferente",resposta(lidoFluxo,{...turno,id:fluxoId}).sessao===lidoFluxo,true);
 const passou=redutorDeEncontro(comReacao,{tipo:"PROXIMO_TURNO",derivados});
 testa("virada do turno do oponente encerra escolha pendente",
  [passou.ativoId,M.curasMedicinaPendentes(passou.combatentes[1].sessao).length],[fluxoId,0]);
 const forcou=redutorDeEncontro(comReacao,{tipo:"NOVA_RODADA",derivados});
 testa("rodada forçada também libera o uso pendente",
  M.curasMedicinaPendentes(forcou.combatentes[1].sessao).length,0);
}

const mistos = rolarDano({rotulo:"Cura",tom:"cura",grupos:[{dados:1,faces:6},{dados:2,faces:10}],detalharDados:true},()=>0);
t("rolador informa faces de cada grupo",[...M.dadosParaMedicina(mistos).map(x=>x.faces)],[6,10,10]);

if (erros.length) { console.error(erros.join("\n")); process.exitCode = 1; }
else console.log("TODOS OS "+ok+" ASSERTS PASSARAM");
