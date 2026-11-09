import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R=new URL("../src/systems/afty/",import.meta.url).href;
const {deriveAfty}=await import(R+"afty-derive.js");
const {createBlankAfty}=await import(R+"afty-schema.js");
const {aplicarAddons}=await import(R+"afty-addons.js");
const {rolarTeste,rolarDano}=await import(R+"ficha/ficha-rolagem.js");
const {confirmaAtaqueConteudo}=await import(R+"ficha/ficha-conteudo-combate.js");
const {opcoesConcentrarAura,limiteConcentrarAura,usaConcentrarAura}=await import(R+"ficha/ficha-conteudo-concentrar-aura.js");
const S=await import(R+"ficha/ficha-sessao.js");
const {linhasDeEstado}=await import(R+"ficha/ficha-buffs.js");
let ok=0,seq=0;
const erros=[],t=(n,a,b)=>JSON.stringify(a)===JSON.stringify(b)?ok++:erros.push(n+": "+JSON.stringify(a)+" != "+JSON.stringify(b));
const p=()=>({opId:"concentrar-aura-"+ ++seq});
const inicio=d=>({...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d),d),d),rodada:1});
aplicarAddons([]);

function ficha(sistema,id,auras) {
 const c=createBlankAfty();c.rulesVersion=sistema;c.id=id;c.name=id;c.core.nd=12;c.attrMethod="fixos";
 c.attributes={forca:15,destreza:14,constituicao:13,inteligencia:10,sabedoria:12,presenca:8};
 c.core.origem={id:"inato",bonusAtributos:{forca:2,destreza:1}};c.especializacoes=[{id:"combatente",nivel:12}];
 c.habilidadesGerais=sistema==="afty"?["ger_especializacao",...(auras?["ger_aptidao"]:[])]:[];
 c.pericias={feiticaria:"treinado"};
 if(auras){c.aptidoes={cl:0,er:0,au:2,dom:0,bar:0};c.aptidoesAmaldicoadas=["aura_drenadora","aura_reforcada","aura_embacada","concentrar_aura"];}
 c.equipamentos.itens=[{uid:"espada",tipo:"arma",refId:"arm_espada_curta",qtd:1,equipado:true}];
 return c;
}
for(const sistema of ["player","afty"]){
 const c=ficha(sistema,"a",true),ca=ficha(sistema,"b",false),d0=deriveAfty(c),da=deriveAfty(ca);
 const s=inicio(d0),sa=inicio(da);
 const d=s=>deriveAfty({...c,combate:s.combate,buffsSessao:s.buffs});
 const teste=(n,a,b)=>t(sistema+" "+n,a,b);
 const auras=["aura_reforcada","aura_drenadora"],e={auras,emSeuTurno:true};
 teste("limite de 1 + AU",limiteConcentrarAura(d0),3);
 teste("a bancada conserva o estado, e Buffs usa o cliente da Aptidão",
  [d0.combate.estadosExtras.some(e=>e.id==="concentrarAura"),linhasDeEstado(d0).some(e=>e.id==="concentrarAura")],[true,false]);
 teste("seleção contém duas passivas conhecidas e não inclui a ativa",opcoesConcentrarAura(d0).map(a=>a.id),[...auras].reverse());
 teste("recusa aura ativável",usaConcentrarAura(s,d0,{...e,auras:["aura_embacada"]},p()).sessao===s,true);
 teste("recusa lista vazia, repetida ou não adquirida",
  [[],[auras[0],auras[0]],["aura_macica"]].every(ids=>usaConcentrarAura(s,d0,{...e,auras:ids},p()).sessao===s),true);
 teste("recusa fora de combate e fora do turno",
  [usaConcentrarAura(S.sessaoEmBranco(d0),d0,e,p()).aplicado,usaConcentrarAura(s,d0,{...e,emSeuTurno:false},p()).aplicado],[false,false]);
 const id=p(), uso=usaConcentrarAura(s,d0,e,id);
 if(!uso.aplicado)throw Error(uso.erro);
 const depois=d(uso.sessao);
 teste("Livre não gasta ações base nem energia",[uso.sessao.uso.acoes.livres.concentrar_aura,uso.sessao.uso.acoes.gastas,uso.sessao.peAtual],
  [1,s.uso.acoes.gastas,s.peAtual]);
 teste("apenas auras escolhidas suspensas",[depois.combate.concentrarAura,d0.rdFisico-depois.rdFisico],[auras,4]);
 teste("uma rodada com restauração nativa",uso.sessao.uso.ativos.concentrar_aura.duracao,{tipo:"rodadas",restantes:1});
 teste("repetir identidade é inerte",usaConcentrarAura(uso.sessao,depois,e,id).repetida,true);
 teste("outra ativação na rodada é recusada",usaConcentrarAura(uso.sessao,depois,e,p()).aplicado,false);
 const lida=S.normalizaSessao(JSON.parse(JSON.stringify(uso.sessao)),depois),dl=d(lida);
 const linha=dl.dano.entradas.find(l=>l.id==="arm_espada_curta");
 const extra=linha.gruposDano.find(g=>g.nome==="Concentrar Aura");
 teste("dados por aura, tipo Energético, sem dobrar no crítico",[extra.dados,extra.faces,extra.momento,extra.multiplica,extra.tipoDano],[2,8,"apos",false,"energetico"]);
 const ataque=rolarTeste({rotulo:linha.nome,tipoTeste:"ataque",linhaArma:linha,bonus:linha.acerto},()=>0.999);
 const dano=rolarDano({rotulo:linha.nome,linhaArma:linha,grupos:linha.gruposDano,critico:true},()=>0.5);
 const comAtaque=S.registraRolagem(S.registraRolagem(lida,ataque),dano);
 const confirma=confirmaAtaqueConteudo(comAtaque,dl,sa,da,{ataqueId:ataque.id,danoId:dano.id,alvoId:ca.id},p());
 if(!confirma.aplicado)throw Error(confirma.erro);
 teste("confirmação aplica Energético separado do tipo da arma",
  confirma.calculos.map(g=>[g.tipoDano,g.base]),[["ct",dano.gruposRolados.find(g=>g.tipoDano==="ct" || g.tipoDano==null).total],["energetico",10]]);
 const falha=rolarTeste({rotulo:linha.nome,tipoTeste:"ataque",linhaArma:linha,bonus:linha.acerto},()=>0);
 const errou=confirmaAtaqueConteudo(S.registraRolagem(lida,falha),dl,sa,da,{ataqueId:falha.id,alvoId:ca.id},p());
 teste("erro não causa dano e conserva a rodada",[errou.ataque.acertou,errou.calculos.length,errou.sessao.uso.ativos.concentrar_aura.duracao.restantes],[false,0,1]);
 const prox=S.proximaRodada(lida,dl).sessao, dprox=d(prox);
 teste("rodada seguinte restaura a RD, remove dados e desliga o uso",
  [dprox.combate.concentrarAura,dprox.rdFisico,dprox.dano.entradas.some(l=>l.gruposDano.some(g=>g.nome==="Concentrar Aura")),!!prox.uso.ativos.concentrar_aura],
  [[],d0.rdFisico,false,false]);
}
if(erros.length){console.error(erros.join("\n"));process.exitCode=1;}else console.log("TODOS OS "+ok+" ASSERTS PASSARAM");
