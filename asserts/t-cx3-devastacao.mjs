import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R+"afty-derive.js");
const { createBlankAfty } = await import(R+"afty-schema.js");
const { aplicarAddons } = await import(R+"afty-addons.js");
const { rolarTeste,rolarDano } = await import(R+"ficha/ficha-rolagem.js");
const { assumePosturaConteudo } = await import(R+"ficha/ficha-conteudo-posturas.js");
const { ativacaoDevastacao,devastacaoContra } = await import(R+"ficha/ficha-conteudo-devastacao.js");
const { confirmaAtaqueConteudo } = await import(R+"ficha/ficha-conteudo-combate.js");
const { derivarCombatente } = await import(R+"encontros/usar-encontro-afty.js");
const S = await import(R+"ficha/ficha-sessao.js");
let ok = 0,seq=0;
const erros=[], t=(n,a,b)=>JSON.stringify(a)===JSON.stringify(b)?ok++:erros.push(n+": "+JSON.stringify(a)+" != "+JSON.stringify(b));
const p=()=>({opId:"devastacao-"+ ++seq,registraAcao:true});
aplicarAddons([]);

function ficha(sistema,id,postura) {
 const c=createBlankAfty(); c.id=id; c.name=id; c.rulesVersion=sistema; c.core.nd=12; c.attrMethod="fixos";
 c.attributes={forca:15,destreza:14,constituicao:13,inteligencia:10,sabedoria:12,presenca:8};
 c.core.origem={id:"inato",bonusAtributos:{forca:2,destreza:1}}; c.especializacoes=[{id:"combatente",nivel:12}];
 c.habilidadesGerais=sistema==="afty"?["ger_especializacao"]:[];
 c.habilidades=postura?["cmb_assumir_postura"]:[];
 c.escolhasHabilidade=postura?{cmb_assumir_postura:["cmb_postura_da_devastacao","cmb_postura_do_sol"]}:{};
 c.pericias={feiticaria:"treinado"};
 c.equipamentos.itens=[{uid:"espada",tipo:"arma",refId:"arm_espada_curta",qtd:1,equipado:true}];
 return c;
}
const inicio=d=>({...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d),d),d),rodada:1});
for (const sistema of ["player","afty"]) {
 const c=ficha(sistema,"Devastação",true), ca=ficha(sistema,"A",false), cb=ficha(sistema,"B",false);
 const d0=deriveAfty(c), a0=deriveAfty(ca), b0=deriveAfty(cb);
 const alvo={...inicio(a0),buffs:[{id:"rd-teste",nome:"RD da Mesa",canal:"rdGeral",expr:"6",rodadas:null}]};
 const da=derivarCombatente({ficha:ca,sessao:alvo}), db=deriveAfty(cb);
 const t0=inicio(d0), ini=p();
 const entrada=assumePosturaConteudo(t0,d0,{postura:"devastacao"},ini);
 if (!entrada.aplicado) throw Error(entrada.erro);
 const s={...entrada.sessao,combate:{...entrada.sessao.combate,devastacaoPilha:2}};
 const de=s=>derivarCombatente({ficha:c,sessao:s});
 const d=de(s), linha=d=>d.dano.entradas.find(l=>l.id==="arm_espada_curta");
 const testa=(n,a,b)=>t(sistema+" "+n,a,b);
 testa("identidade da ativação em CL1",ativacaoDevastacao(s),ini.opId);
 const manual=deriveAfty({...c,combate:s.combate});
 testa("pilha manual mantém fórmula da ficha avulsa",[linha(manual).acerto-linha(d).acerto,(linha(manual).ignoraRD??0)-(linha(d).ignoraRD??0)],[2,4]);
 testa("Encontro da postura nova neutraliza a pilha manual",d.combate.devastacaoPilha,0);
 const legado={...s,uso:{...s.uso,ativos:{...s.uso.ativos,cmb_assumir_postura:{...s.uso.ativos.cmb_assumir_postura,parametros:{}}}}};
 testa("Encontro de sessão antiga conserva pilha manual",[ativacaoDevastacao(legado),de(legado).combate.devastacaoPilha],[null,2]);

 function rola(s, alvoId, {natural=14, bonus, semPostura=false}={}) {
  const d=de(s), l=linha(d), a=alvoId==="A"?da:db;
  const ataque=rolarTeste({rotulo:l.nome,tipoTeste:"ataque",linhaArma:l,bonus:bonus??a.defesa-11,
   contextoTurno:{devastacao:semPostura?null:ativacaoDevastacao(s)}},()=>(natural-0.5)/20);
  const dano=rolarDano({rotulo:l.nome,grupos:l.gruposDano,linhaArma:l},()=>0.999);
  const log=S.registraRolagem(S.registraRolagem(s,ataque),dano);
  return {ataque,dano,sessao:log,d};
 }
 const confirma=(r,alvoId)=>confirmaAtaqueConteudo(r.sessao,r.d,alvoId==="A"?alvo:inicio(b0),alvoId==="A"?da:db,
   {ataqueId:r.ataque.id,danoId:r.dano.id,alvoId,inimigo:true},p());
 const ataca=(s,alvoId,e)=>confirma(rola(s,alvoId,e),alvoId);
 const p1=ataca(s,"A");
 if(!p1.aplicado)throw Error(p1.erro);
 testa("primeiro acerto arma uma pilha futura",[p1.ataque.acertou,p1.sessao.log[0].devastacao.acerto,p1.sessao.log[0].devastacao.pilha],[true,0,1]);
 const mesma=ataca(p1.sessao,"A",{natural:1});
 testa("erro contra o mesmo alvo conserva a pilha",[mesma.ataque.acertou,mesma.sessao.log[0].devastacao.pilha],[false,1]);
 const lida=S.normalizaSessao(JSON.parse(JSON.stringify(mesma.sessao)),d);
 const antes=rola(lida,"A",{natural:10}), p2=confirma(antes,"A");
 testa("após salvar +1 transforma a jogada em acerto",[antes.ataque.total,p2.ataque.acertou,p2.sessao.log[0].totalAtaque],[da.defesa-1,true,da.defesa]);
 testa("ignora 2 da RD no segundo acerto",p2.calculos.reduce((s,x)=>s+x.final,0)-p1.calculos.reduce((s,x)=>s+x.final,0),2);
 let atual=p2;
 for(let i=0;i<d.maestria+1;i++) atual=ataca(atual.sessao,"A");
 testa("teto de BT e dobro em redução",[atual.sessao.log[0].devastacao.pilha,atual.sessao.log[0].devastacao.ignoraRD],[d.maestria,2*d.maestria]);
 const errouB=ataca(atual.sessao,"B",{natural:1});
 testa("trocar para B limpa a pilha antes do erro",[errouB.sessao.log[0].devastacao.acerto,errouB.sessao.log[0].devastacao.pilha],[0,0]);
 const voltouA=ataca(errouB.sessao,"A");
 testa("voltar ao alvo original não recupera pilhas",[voltouA.sessao.log[0].devastacao.acerto,voltouA.sessao.log[0].devastacao.pilha],[0,1]);
 const golpeVelho=ataca(voltouA.sessao,"A",{semPostura:true,natural:10});
 testa("rolagem sem identidade não usa nem soma pilha",[golpeVelho.ataque.acertou,golpeVelho.sessao.log[0].devastacao??null],[false,null]);
 let ss=S.iniciaTurnoFicha(S.encerraTurnoFicha(voltouA.sessao,d),d);
 const sol=assumePosturaConteudo(ss,de(ss),{postura:"sol"},p());
 if(!sol.aplicado)throw Error(sol.erro);
 ss=S.iniciaTurnoFicha(S.encerraTurnoFicha(sol.sessao,de(sol.sessao)),de(sol.sessao));
 const nova=assumePosturaConteudo(ss,de(ss),{postura:"devastacao"},p());
 if(!nova.aplicado)throw Error(nova.erro);
 const n=ataca(nova.sessao,"A");
 testa("reativar a postura abre nova pilha",[n.sessao.log[0].devastacao.acerto,n.sessao.log[0].devastacao.pilha],[0,1]);
 testa("ataque com identidade de postura encerrada não usa bônus",
  devastacaoContra(nova.sessao,de(nova.sessao),antes.ataque,"A"),null);
}
if(erros.length){console.error(erros.join("\n"));process.exitCode=1;}else console.log("TODOS OS "+ok+" ASSERTS PASSARAM");
