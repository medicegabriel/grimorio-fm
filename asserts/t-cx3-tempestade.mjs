import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R=new URL("../src/systems/afty/",import.meta.url).href;
const {deriveAfty}=await import(R+"afty-derive.js");
const {createBlankAfty}=await import(R+"afty-schema.js");
const {aplicarAddons}=await import(R+"afty-addons.js");
const {rolarTeste,rolarDano}=await import(R+"ficha/ficha-rolagem.js");
const {rolaSorte,escolheSorte}=await import(R+"ficha/ficha-conteudo-uso.js");
const {confirmaAtaqueConteudo}=await import(R+"ficha/ficha-conteudo-combate.js");
const {assumePosturaConteudo,posturaAtivaConteudo}=await import(R+"ficha/ficha-conteudo-posturas.js");
const T=await import(R+"ficha/ficha-conteudo-tempestade.js");
const S=await import(R+"ficha/ficha-sessao.js");
let ok=0,seq=0;
const erros=[],t=(n,a,b)=>JSON.stringify(a)===JSON.stringify(b)?ok++:erros.push(n+": "+JSON.stringify(a)+" != "+JSON.stringify(b));
const p=()=>({opId:"tempestade-"+ ++seq,registraAcao:true});
const inicio=d=>({...S.iniciaTurnoFicha(S.iniciaCombate(S.sessaoEmBranco(d),d),d),rodada:1});
aplicarAddons([]);

function ficha(sistema,id) {
 const c=createBlankAfty(); c.id=id;c.name=id;c.rulesVersion=sistema;c.core.nd=12;c.attrMethod="fixos";
 c.attributes={forca:15,destreza:14,constituicao:13,inteligencia:10,sabedoria:12,presenca:8};
 c.core.origem={id:"inato",bonusAtributos:{forca:2,destreza:1}};c.especializacoes=[{id:"combatente",nivel:12}];
 c.habilidadesGerais=sistema==="afty"?["ger_especializacao"]:[];
 c.habilidades=["cmb_assumir_postura"];c.escolhasHabilidade={cmb_assumir_postura:["cmb_postura_da_tempestade","cmb_postura_do_sol"]};
 c.talentos=["tal_favorecido_pela_sorte"];c.pericias={feiticaria:"treinado"};
 c.equipamentos.itens=[{uid:"espada",tipo:"arma",refId:"arm_espada_curta",qtd:1,equipado:true}];
 return c;
}
for(const sistema of ["player","afty"]){
 const c=ficha(sistema,"a"),ca=ficha(sistema,"b"),d0=deriveAfty(c),da=deriveAfty(ca);
 const base=inicio(d0),a0=inicio(da),ps=assumePosturaConteudo(base,d0,{postura:"tempestade"},p());
 if(!ps.aplicado)throw Error(ps.erro);
 const s=ps.sessao,d=deriveAfty({...c,combate:s.combate});
 const alvoPostura=assumePosturaConteudo(a0,da,{postura:"sol"},p()).sessao;
 const linha=d.dano.entradas.find(l=>l.id==="arm_espada_curta");
 const teste=(n,a,b)=>t(sistema+" "+n,a,b);
 const turnoEmCurso={id:c.id,rodada:s.rodada,turno:s.uso.acoes.turno};
 const entrada={alvoId:ca.id,turnoEmCurso,rngAlvo:()=>0};
 function acerto({caido=false,erro=false,postura=true,turno=turnoEmCurso}={}){
  const a=rolarTeste({rotulo:linha.nome,linhaArma:linha,tipoTeste:"ataque",bonus:linha.acerto,
    contextoTurno:{posturaTempestade:postura&&!!posturaAtivaConteudo(s,d,"tempestade"),emCurso:turno}},()=>erro?0:0.999);
  const dano=rolarDano({rotulo:linha.nome,linhaArma:linha,grupos:linha.gruposDano,modoDano:"critico"},()=>0);
  const pronto=S.registraRolagem(S.registraRolagem(s,a),dano);
  const alvo=caido?S.defineCondicoes(alvoPostura,[{id:"ja-caido",nome:"Caído",rodadas:null}]):alvoPostura;
  const r=confirmaAtaqueConteudo(pronto,d,alvo,da,{ataqueId:a.id,danoId:dano.id,alvoId:ca.id},p());
  if(!r.aplicado)throw Error(r.erro);
  return {r,entrada:{...entrada,ataqueId:a.id,turnoEmCurso:turno}};
 }
 const v=acerto();
 const rola=(v,e={})=>T.rolaTempestade(v.r.sessao,d,v.r.sessaoAlvo,da,{...v.entrada,...e},p());
 teste("cada acerto com alvo autoriza seu TR",T.acertosParaTempestade(v.r.sessao,d,turnoEmCurso).map(r=>r.ataqueId),[v.entrada.ataqueId]);
 teste("ataque errado não autoriza",rola(acerto({erro:true})).aplicado,false);
 teste("ataque antes da postura não autoriza",rola(acerto({postura:false})).aplicado,false);
 teste("alvo já caído no acerto fica no ramo de Imóvel",rola(acerto({caido:true})).aplicado,false);
 teste("outro alvo não usa o acerto",rola(v,{alvoId:"terceiro"}).aplicado,false);
 teste("outro turno não usa o acerto",rola(v,{turnoEmCurso:{...turnoEmCurso,turno:99}}).aplicado,false);
 const r=rola(v);
 if(!r.aplicado)throw Error(r.erro);
 teste("Fortitude usa a CD da fonte e fica pendente no alvo",[r.rolagem.cd,r.rolagem.resistenciaId,r.sessaoAlvo.condicoes],[d.cd,"fortitude",v.r.sessaoAlvo.condicoes]);
 teste("TR não gasta ação ou PE",[r.sessao.uso.acoes,r.sessao.peAtual],[v.r.sessao.uso.acoes,v.r.sessao.peAtual]);
 teste("um único TR por ataque",T.rolaTempestade(r.sessao,d,r.sessaoAlvo,da,v.entrada,p()).aplicado,false);
 const lida=S.normalizaSessao(JSON.parse(JSON.stringify(r.sessao)),d),la=S.normalizaSessao(JSON.parse(JSON.stringify(r.sessaoAlvo)),da);
 const aplica=(sa=la,op=p(),sr=lida)=>T.aplicaTempestade(sr,d,sa,da,v.entrada,op);
 const sorte=rolaSorte(la,da,{id:r.rolagem.id,rng:()=>0.999},p());
 teste("Sorte exige escolha antes de aplicar a queda",aplica(sorte.sessao).aplicado,false);
 const escolheu=escolheSorte(sorte.sessao,da,{id:r.rolagem.id,escolha:"novo"},p());
 const resistiu=aplica(escolheu.sessao);
 teste("sucesso com Sorte evita a queda",[resistiu.caiu,resistiu.sessaoAlvo.condicoes],[false,la.condicoes]);
 const pronto=aplica();
 if(!pronto.aplicado)throw Error(pronto.erro);
 teste("falha aplica Caído nativo, encerra postura e preserva PV",
  [pronto.sessaoAlvo.condicoes.at(-1).nome,pronto.sessaoAlvo.combate.postura,pronto.sessaoAlvo.hpAtual],["Caído",null,la.hpAtual]);
 teste("teste aplicado não repete a consequência",aplica(pronto.sessaoAlvo,p(),pronto.sessao).aplicado,false);
 const reacao=acerto({turno:{id:ca.id,rodada:s.rodada,turno:a0.uso.acoes.turno}});
 teste("acerto fora do próprio turno também aciona o TR",rola(reacao).aplicado,true);
}
if(erros.length){console.error(erros.join("\n"));process.exitCode=1;}else console.log("TODOS OS "+ok+" ASSERTS PASSARAM");
