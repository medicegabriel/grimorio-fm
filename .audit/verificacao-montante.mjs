import { register } from 'node:module';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}',import.meta.url);
const R=new URL('../src/systems/afty/',import.meta.url).href;
const D=await import(R+'afty-derive.js');
const SC=await import(R+'afty-schema.js');
const EF=await import(R+'afty-efeitos.js');
const EC=await import(R+'afty-efeitos-conteudo.js');
const O=await import(R+'afty-origens.js');
const T=await import(R+'afty-treinamentos.js');
const A=await import(R+'afty-addons.js');
const CONT=await import(R+'afty-contadores-origem.js');
const H=await import(R+'afty-habilidades.js');
const ES=await import(R+'afty-especializacoes.js');
const AP=await import(R+'afty-aptidoes.js');
const PC=await import(R+'afty-pericias-catalogo.js'); const TAL=await import(R+'afty-talentos.js');
const vars=()=>({
 pericias:PC.AFTY_PERICIAS.map(p=>p.id),resistencias:SC.AFTY_RESISTENCIAS.map(r=>r.value),
 habilidades:[...H.AFTY_HABILIDADES,...TAL.AFTY_TALENTOS,...AP.AFTY_APTIDOES].map(h=>h.id),especializacoes:ES.AFTY_ESPECIALIZACOES.map(e=>e.id),
 opcoesAptidao:AP.AFTY_APTIDOES.flatMap(a=>(a.opcoes?.valores||[]).map(o=>'opt_'+a.id+'_'+o.id))
});
const records=[];let scanned=0;const packages=[];
const scan=(root,source,ctx,treino=false,path='')=>{
 if(!root||typeof root!=='object')return;
 if(root.canal && (root.expr!=null||root.valor!=null)){
  scanned++;
  let e={...root};
  if(treino){e={canal:root.canal,expr:String(root.expr??'0')};if(e.expr.startsWith('escolha:'))return;}
  const s=EF.separarEfeitosDeBancada([e],ctx);
  if(EF.efeitoLeBancada(e,ctx))records.push({source,path,stage:s.bancada.length?'principal':'montante',budget:/vagas|pontosAptidao|proficiencia|focos|nivelAptidao|limiteAptidao/.test(e.canal),effect:e});
  return;
 }
 for(const [key,value] of Object.entries(root)){
  if(/efeitosInvocacao|estadosCombate|resultados|mesa/.test(key))continue;
  scan(value,source,ctx,treino,path+(path?'.':'')+key);
 }
};
A.aplicarAddons([]);
const ctx=EF.buildCriaturaDslContext({nd:10,bt:4,vocabulario:vars()});
for(const key of ['GERAL_EFEITOS','ORIGEM_EFEITOS','CLA_EFEITOS','ANATOMIA_EFEITOS'])scan(EC[key],'nativo:'+key,ctx);
scan(O.ORIGEM_ESCOLHA_EFEITOS,'nativo:ORIGEM_ESCOLHA_EFEITOS',ctx);
scan(O.AFTY_ORIGENS_CATALOG,'nativo:origens',ctx);
scan(O.CLAS_HERDADO,'nativo:clas',ctx);
scan(T.AFTY_TREINAMENTOS,'nativo:treinamentos',ctx,true);
for(const file of readdirSync('addons').filter(f=>f.endsWith('.json'))){
 const p=A.normalizarPacote(JSON.parse(readFileSync('addons/'+file,'utf8')));
 packages.push(file);A.aplicarAddons([p]);
 const allCounters=Object.fromEntries((p.contadoresOrigem??[]).map(c=>[(p.id+':'+c.id).toLowerCase().replace(/[^a-z0-9_]/g,'_'),0]));
 // Counter names are also obtained through the real collector for every origin.
 for(const origin of p.acrescenta?.origens??[]){
  const c=SC.createBlankAfty();c.addons=[p];c.core.origem={id:origin.id};
  Object.assign(allCounters,CONT.origemContadoresDslVars(c));
 }
 const red=EF.buildCriaturaDslContext({nd:10,bt:4,vocabulario:vars(),origemContadoresVars:allCounters});
 for(const mode of ['acrescenta','substitui'])for(const fam of ['origens','clas','treinamentos','gerais','habilidadesGerais','treinosEspeciais']){
  scan(p[mode]?.[fam],'addons/'+file+':'+mode+'.'+fam,red,fam==='treinamentos');
 }
}
A.aplicarAddons([]);
writeFileSync('.audit/verificacao-evidencias/montante-inventario.json',JSON.stringify({scanned,packages,records},null,2));
console.log(JSON.stringify({scanned,packages:packages.length,records},null,2));


