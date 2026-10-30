import fs from 'node:fs';
import {register} from 'node:module';
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}',import.meta.url);
const R=new URL('../../src/systems/afty/',import.meta.url);
const {deriveAfty}=await import(new URL('afty-derive.js',R));
const {calcularRecebidos}=await import(new URL('ficha/ficha-recebidos.js',R));
const P=await import(new URL('ficha/pacotes-aliados.js',R));
const F=await import(new URL('ficha/pacotes-familias.js',R));
const S=await import(new URL('ficha/ficha-sessao.js',R));
const {fichas}=JSON.parse(fs.readFileSync('.audit/pacotes-aliados-20261019/fichas.json','utf8'));
const receptor=fichas.receptor;
const df=(f,s)=>deriveAfty({...f,combate:s.combate,buffsSessao:s.buffs});
const out={geradoEm:new Date().toISOString(),checks:[]};
const check=(id,real,esperado,dados)=>out.checks.push({id,real,esperado,dados,ok:JSON.stringify(real)===JSON.stringify(esperado)});
const reg=(id,v,quando)=>({id,rec:true,tipoFonte:'catalogo',origemId:'aptidao:aura_do_bastiao',origemNome:id,beneficios:[{canal:'defesa',valor:v,...(quando?{quando}:{})}]});
for(const ativo of [false,true]){
 const s={combate:{ativo},buffs:[]};const base=df(receptor,s).defesa;
 const all={...s,buffs:[reg('menor',3),reg('maior',5,'em_combate')]};const calc=calcularRecebidos(receptor,all,df);
 check('origem igual escolhe maior elegivel, combate '+ativo,calc.derived.defesa-base,ativo?5:3,{base,defesa:calc.derived.defesa,analise:calc.analise});
}
const suporte={...fichas.suporteA,feiticos:[{id:'ataque-unico',nome:'Precisao para um ataque',tipo:'auxiliar',nivel:1,efeitoAux:'ataque',duracaoAux:'imediata',umGolpe:true}]};
const found=F.fontesParaAliados(suporte,deriveAfty(suporte),{emissorId:'codex'}).fontes.find(x=>x.chave==='feitico|ataque-unico');
if(found){const x=found.resolver();out.umAtaque=x;}
const arquivo=JSON.parse(fs.readFileSync('.audit/pacotes-aliados-20261019/pacote-yuki-rev1.json','utf8'));const l=P.lerArquivoDePacote(arquivo);const bib=P.gravarNaBiblioteca([],l.pacote,[],new Date().toISOString()).biblioteca;
check('biblioteca relida preserva todas opcoes',P.bibliotecaDaFicha({pacotesRecebidos:bib})[0].opcoes.length,l.pacote.opcoes.length);
const entry=bib[0],op=entry.opcoes.find(x=>x.nome==='Escudo Dourado'),inst=P.instanciaDaOpcao(entry,op,{id:'codex-inst'});
const s={...S.sessaoEmBranco(deriveAfty(receptor)),combate:{ativo:true},buffs:[inst]};const snapshot=JSON.stringify(inst);const revised=structuredClone(entry);revised.revisao++;revised.opcoes.find(x=>x.id===op.id).beneficios[0].valor+=3;
const newer=P.gravarNaBiblioteca(bib,revised,[],new Date().toISOString()).biblioteca;
check('atualizar biblioteca conserva instancia ativa',JSON.stringify(inst),snapshot);
check('nova ativacao usa revisao nova',P.instanciaDaOpcao(newer[0],newer[0].opcoes.find(x=>x.id===op.id),{id:'nova'}).beneficios[0].valor,inst.beneficios[0].valor+3);
check('descanso conserva biblioteca e tira instancia temporaria',[P.bibliotecaDaFicha({pacotesRecebidos:newer}).length,S.descansar(s,calcularRecebidos(receptor,s,df).derived).buffs.length],[1,0]);
fs.writeFileSync('.audit/reconferencia-codex-pacotes-20261020/provas.json',JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
