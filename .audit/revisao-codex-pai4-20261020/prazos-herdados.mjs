import fs from 'node:fs';
import {register} from 'node:module';
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}',import.meta.url);
const raiz=new URL('../../src/systems/afty/',import.meta.url);
const {deriveAfty}=await import(new URL('afty-derive.js',raiz));
const P=await import(new URL('ficha/pacotes-aliados.js',raiz));
const S=await import(new URL('ficha/ficha-sessao.js',raiz));
const F=await import(new URL('ficha/pacotes-familias.js',raiz));
const {calcularRecebidos}=await import(new URL('ficha/ficha-recebidos.js',raiz));
const {opcoesDeriveDaSessao}=await import(new URL('ficha/ficha-opcoes-derive.js',raiz));
const dir=new URL('./',import.meta.url);
const {fichas}=JSON.parse(fs.readFileSync(new URL('fichas.json',dir),'utf8'));
const fonte={...fichas.suporteA,feiticos:[{id:'misto',nome:'Prazos Herdados Codex',tipo:'auxiliar',nivel:1,multiplosAtivo:true,duracaoMult:'imediata',acaoMult:'reacao',efeitosMult:[{id:'d',efeito:'defesa'},{id:'t',efeito:'tr'}]}]};
const resolvedor=F.fontesParaAliados(fonte,deriveAfty(fonte),{emissorId:'codex-herdado'}).porChave;
const r=F.resolverItem({fonte:'feitico|misto',escolhas:{}},resolvedor);
const {arquivo}=P.montarArquivo({pacote:{id:'codex-herdado',nome:'Prazos Herdados Codex'},emissorId:'codex-herdado',emissor:{nome:fonte.name,sistema:'player'},opcoes:[F.paraArquivo('misto',r)],agora:new Date().toISOString()});
// Representacao equivalente: o prazo comum e de uma rodada. So Defesa tem excecao por ataque.
arquivo.opcoes[0].duracao={tipo:'rodadas',rodadas:1};
delete arquivo.opcoes[0].beneficios.find(b=>b.canal==='bonusTR').duracao;
const lido=P.lerArquivoDePacote(arquivo,{conhecidos:F.conhecidosDaFicha()});
const bib=lido.ok?P.gravarNaBiblioteca([],lido.pacote,lido.recusadas,new Date().toISOString()).biblioteca:null;
if(!bib?.length)throw new Error('Leitura recusou: '+JSON.stringify(lido));
const inst=P.instanciaDaOpcao(bib[0],bib[0].opcoes[0],{id:'codex-inst-herdada'});
const receptor=fichas.receptor;
const deriveSessao=(f,s)=>deriveAfty({...f,combate:s.combate,buffsSessao:s.buffs},opcoesDeriveDaSessao(s));
const d0=deriveAfty({...receptor,combate:{ativo:true}});
const base={...S.sessaoEmBranco(d0),combate:{ativo:true},rodada:1};
const lerNumeros=s=>{const d=calcularRecebidos(receptor,s,deriveSessao).derived;return {defesa:d.defesa,reflexos:d.testes.resistencias.find(x=>x.value==='reflexos').bonus};};
let s={...base,buffs:[inst]};
const passos=[];
for(let i=0;i<4;i++){
 passos.push({rodada:s.rodada,numeros:lerNumeros(s),instancias:s.buffs});
 s=S.proximaRodada(s,d0).sessao;
}
const esperado=lerNumeros(base);
const out={geradoEm:new Date().toISOString(),arquivo,leitura:{ok:lido.ok,recusadas:lido.recusadas},base:esperado,inst,passos,criterios:{defesaPreservada:passos[1].numeros.defesa===esperado.defesa+3,trExpira:passos[1].numeros.reflexos===esperado.reflexos}};
fs.writeFileSync(new URL('prazos-herdados.json',dir),JSON.stringify(out,null,2));
console.log(JSON.stringify({leitura:out.leitura,inst,base:out.base,passos:passos.map(x=>({rodada:x.rodada,numeros:x.numeros})),criterios:out.criterios},null,2));
