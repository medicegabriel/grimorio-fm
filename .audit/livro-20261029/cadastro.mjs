import fs from 'node:fs';
import {register} from 'node:module';
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}',import.meta.url);
const root=new URL('../../src/systems/afty/',import.meta.url).href;
await import(root+'afty-derive.js');
const H=await import(root+'afty-habilidades.js');
const T=await import(root+'afty-talentos.js');
const A=await import(root+'afty-aptidoes.js');
const E=await import(root+'afty-equipamentos.js');
const norm=s=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[^a-z0-9]/gi,'').toLowerCase();
const rows=[];let page=0;
for(const [i,line] of fs.readFileSync(new URL('../../../F&M 2.5.2 - Livro de Regras.md',import.meta.url),'utf8').split(/\r?\n/).entries()){
  const m=line.match(/<!-- página (\d+) -->/);if(m)page=Number(m[1]);
  const h=line.match(/^#{1,3} (.+)/);if(h)rows.push({nome:h[1],page,line:i+1});
}
const defs=[['habilidades',49,126,H.AFTY_HABILIDADES],['talentos',163,170,T.AFTY_TALENTOS],['aptidoes',174,194,A.AFTY_APTIDOES]];
const result=[];
for(const [family,from,to,list] of defs){
  for(const r of rows.filter(r=>r.page>=from&&r.page<=to)){
    const match=list.filter(x=>norm(x.nome.replace(/^\[2\.0\]\s*/,''))===norm(r.nome));
    result.push({...r,familia:family,catalogo:match.map(x=>x.id)});
  }
}
const eq={armas:E.ARMAS.length,itensEspeciais:E.ITENS_ESPECIAIS.length,kits:E.KITS_FERRAMENTAS.length,encArma:E.ENCANTAMENTOS_ARMA.length,encEscudo:E.ENCANTAMENTOS_ESCUDO.length,encUniforme:E.ENCANTAMENTOS_UNIFORME.length};
fs.writeFileSync(new URL('./cadastro.json',import.meta.url),JSON.stringify({comparacaoDeNomes:result,equipamentos:eq},null,2));
for(const [family]of defs){const rr=result.filter(x=>x.familia===family);console.log(`${family}: ${rr.filter(x=>x.catalogo.length).length} cabeçalhos com nome localizado`);console.log('Cabeçalhos sem igualdade literal: '+JSON.stringify(rr.filter(x=>!x.catalogo.length)));}
console.log(JSON.stringify(eq));
