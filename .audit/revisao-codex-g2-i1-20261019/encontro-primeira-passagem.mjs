import fs from 'node:fs';
import {register} from 'node:module';
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}',import.meta.url);
const R=new URL('../../src/systems/afty/',import.meta.url);
const {mesclaFichaAfty}=await import(new URL('afty-schema.js',R));
const {deriveAfty}=await import(new URL('afty-derive.js',R));
const {aplicarAddons}=await import(new URL('afty-addons.js',R));
const {sessaoEmBranco,proximaRodada}=await import(new URL('ficha/ficha-sessao.js',R));
const {derivarCombatente,derivarComCache}=await import(new URL('encontros/usar-encontro-afty.js',R));
const amostras=JSON.parse(fs.readFileSync('C:/Projetos/Grimorio/prototipos/ficha-final-v2/dados/amostras.json','utf8')).amostras;
const out=[];
function check(id,real,esperado){out.push({id,real,esperado,ok:JSON.stringify(real)===JSON.stringify(esperado)});}
for(const id of ['minamoto','player30','calamidade']){
 const ficha=mesclaFichaAfty(amostras.find(x=>x.id===id).ficha);aplicarAddons(ficha.addons??[]);
 const sessao={...sessaoEmBranco(deriveAfty(ficha)),combate:{ativo:true},rodada:1};const c={id:'codex-'+id,ficha,sessao};
 const base=derivarCombatente(c).defesa;const before=JSON.stringify(c);
 const rec={id:'recebido',rec:true,tipoFonte:'feitico',origemNome:'Protecao',beneficios:[{canal:'defesa',valor:7}],rodadas:2};
 const novo={...c,sessao:{...sessao,buffs:[rec]}};
 check(id+' base em cache',derivarComCache(c,0).defesa,base);
 check(id+' registro invalida cache',derivarComCache(novo,0).defesa,base+7);
 check(id+' sem registro novamente',derivarComCache(c,0).defesa,base);
 const cats=[2,3].map((valor,n)=>({...rec,id:'catalogo'+n,tipoFonte:'catalogo',origemId:'aptidao:aura_do_bastiao',aplicadoPor:'aliado'+n,beneficios:[{canal:'defesa',valor}]}));
 check(id+' maior catalogo no encontro',derivarCombatente({...c,sessao:{...sessao,buffs:cats}}).defesa,base+3);
 const v1=proximaRodada(novo.sessao,derivarCombatente(novo)).sessao;
 check(id+' primeiro prazo',derivarCombatente({...c,sessao:v1}).defesa,base+7);
 const v2=proximaRodada(v1,derivarCombatente({...c,sessao:v1})).sessao;
 check(id+' expiracao invalida cache',derivarComCache({...c,sessao:v2},0).defesa,base);
 check(id+' consultas preservam combatente e registro',[JSON.stringify(c),rec.rodadas],[before,2]);
}
fs.writeFileSync('.audit/revisao-codex-g2-i1-20261019/encontro.json',JSON.stringify(out,null,2));
console.log(out.filter(x=>x.ok).length+'/'+out.length);for(const x of out.filter(x=>!x.ok))console.log(x);process.exitCode=out.some(x=>!x.ok)?1:0;
