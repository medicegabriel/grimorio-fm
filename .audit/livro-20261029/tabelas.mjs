import fs from 'node:fs';
import {register} from 'node:module';
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}',import.meta.url);
const root=new URL('../../src/systems/afty/',import.meta.url).href;
await import(root+'afty-derive.js');
const F=await import(root+'afty-feiticos.js');
const raw=fs.readFileSync(new URL('../../../F&M 2.5.2 - Livro de Regras.md',import.meta.url),'utf8');
const tabs=[]; let page=0, current=null, lineNo=0;
for(const line of raw.split(/\r?\n/)) {
  lineNo++;
  const m=line.match(/<!-- página (\d+) -->/); if(m)page=Number(m[1]);
  if(line.startsWith('|')) {
    if(!current){current={page,line:lineNo,rows:[]};tabs.push(current);}
    current.rows.push(line.split('|').slice(1,-1).map(x=>x.trim()));
  } else current=null;
}
const t=(p,n=0)=>tabs.filter(x=>x.page===p)[n];
const parse=s=>{
  s=s.trim();
  if(/^[-–]+$/.test(s))return null;
  const dice=s.match(/^(\d+)d(\d+)/);if(dice)return[Number(dice[1]),Number(dice[2])];
  if(/^[+-]?\d+(?:,\d+)?(?:\s*(?:DEF|RD|CD|Metros|Pontos|N[íi]ve(?:l|is)(?: de Dano)?|m|Rodadas?))?$/.test(s))return Number(s.match(/^[+-]?\d+(?:,\d+)?/)[0].replace(',','.'));
  return s;
};
const result=[];
function compare(nome,table,actual,cols){
  const failures=[];let cells=0;
  for(const row of table.rows.slice(2)){
    const k=/Máxima/.test(row[0])?'max':row[0].match(/\d+/)?.[0] ?? ({Zero:'0',Um:'1',Dois:'2',Três:'3',Quatro:'4',Cinco:'5'})[row[0]];if(k==null)continue;
    for(const [column,field] of cols){
      const expected=parse(row[column]);
      const got=field==null?actual[k]:actual[k]?.[field];
      cells++;
      if(JSON.stringify(expected)!==JSON.stringify(got))failures.push({nivel:k,column,expected,got});
    }
  }
  result.push({nome,pagina:table.page,linha:table.line,cells,failures});
}
for(const [name,p,n] of [['defesa',218,0],['rd',219,0],['atributo',219,1],['tr',220,0],['rolagem',220,1],['movimento',221,0],['danoDurante',221,1],['danoApos',222,0],['danoFixo',222,1],['niveisDano',223,0],['margemCritico',223,1],['negacaoRd',224,0],['cd',224,1],['prejuizoRolagem',225,0],['ataque',225,1],['alcanceCaC',226,0],['alcanceDistancia',227,0]])compare('Auxiliar '+name,t(p,n),F.AUX_TABELAS[name],[[1,'imediata'],[2,'duradoura'],[3,'sustentada']]);
compare('Dano único TR',t(205),F.DANO_UNICO_TR,[[1,null]]);
compare('Dano único Ataque',t(205),F.DANO_UNICO_ATAQUE,[[2,null]]);
compare('Dano área',t(206),F.DANO_AREA_TR,[[1,null]]);
compare('Alcance',t(205,1),F.ALCANCE_POR_NIVEL,[[1,null]]);
compare('Área',t(206,1),F.AREA_POR_NIVEL,[[1,null]]);
compare('Cura único',t(228),F.CURA_UNICO,[[1,null]]);
compare('Cura área',t(228),F.CURA_AREA,[[2,null]]);
compare('Custo PE',t(199),F.FEITICO_CUSTO_PE,[[1,null]]);
compare('Reserva PE Passiva',t(235),Object.fromEntries([0,1,2,3,4,5].map(n=>[n,F.custoPeMaximoDaPassiva(n)])),[[1,null]]);
compare('Nível de dano Passivo',t(236,1),F.PASSIVO_NIVEL_DANO,[[1,null]]);
fs.writeFileSync(new URL('./tabelas.json',import.meta.url),JSON.stringify(result,null,2));
console.log(JSON.stringify({comparacoes:result.length,celulas:result.reduce((s,r)=>s+r.cells,0),divergencias:result.filter(r=>r.failures.length)},null,2));
