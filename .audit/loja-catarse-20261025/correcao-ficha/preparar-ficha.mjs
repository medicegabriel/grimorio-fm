import fs from 'node:fs';
import assert from 'node:assert/strict';
import {register} from 'node:module';
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}',import.meta.url);
const {prepararImportacao}=await import('../importacao-chrollo.js');
const {deriveAfty}=await import('../../../src/systems/afty/afty-derive.js');
const {aplicarAddons}=await import('../../../src/systems/afty/afty-addons.js');
const arquivo='C:/Users/gabri/.codex/attachments/f786826d-b686-4ec8-b302-4a32858fdd8f/Texto colado.txt';
const entrada=JSON.parse(fs.readFileSync(arquivo,'utf8'));
const original=structuredClone(entrada.creatures[0]);
const plano=prepararImportacao(entrada.creatures);
assert.deepEqual(plano.conflitos,[]);
const corrigida=plano.ficha;
aplicarAddons(original.addons);
const antes=deriveAfty(original);
const depois=deriveAfty(corrigida);
assert.equal(corrigida.id,original.id);
assert.deepEqual(corrigida.especializacoes,original.especializacoes);
assert.deepEqual(corrigida.habilidades,original.habilidades);
assert.deepEqual(corrigida.habilidadesLendarias,original.habilidadesLendarias);
assert.deepEqual(corrigida.addons,original.addons);
assert.equal(antes.attrEff.constituicao,depois.attrEff.constituicao);
assert.equal(depois.attrEff.constituicao,28);
assert.equal(depois.attrLimiteEfetivo.constituicao,26);
assert.equal(depois.catarse.restante,495);
assert.equal(depois.altoNivel.lendarias.total,antes.altoNivel.lendarias.total+3);
assert.equal(depois.altoNivel.lendarias.total,5);
assert.equal(depois.altoNivel.lendarias.gastos,4);
assert.equal(depois.altoNivel.lendarias.restante,1);
assert.equal(corrigida.catarse.compras.find(c=>c.familia==='habilidadesOutraClasse').quantidade,2);
assert.equal(corrigida.core.funcionamentosAdicionais.some(f=>f.nome==='Loja de Catarse'),false);
assert.equal(depois.catarse.efeitos.find(e=>e.canal==='atributo'&&e.alvo==='constituicao').expr,'6');
assert.equal(depois.catarse.efeitos.find(e=>e.canal==='limiteAtributo'&&e.alvo==='constituicao').expr,'6');
const normalizar=c=>{
  const copia=structuredClone(c);delete copia.catarse;
  copia.core.funcionamentosAdicionais=copia.core.funcionamentosAdicionais.filter(f=>f.nome!=='Loja de Catarse');
  return copia;
};
assert.deepEqual(normalizar(corrigida),normalizar(original));
assert.equal(prepararImportacao(plano.biblioteca).jaAplicado,true);
const exportado={...entrada,exportedAt:new Date().toISOString(),creatures:plano.biblioteca};
const saida='C:/Projetos/Grimorio/outputs/Chrollo-catarse-corrigida.json';
fs.writeFileSync(saida,JSON.stringify(exportado,null,2)+'\n');
const relatorio={arquivo:saida,id:corrigida.id,constituicao:depois.attrEff.constituicao,
  limiteConstituicao:depois.attrLimiteEfetivo.constituicao,escolhasOutraClasse:2,
  lendarias:{antes:antes.altoNivel.lendarias.total,total:depois.altoNivel.lendarias.total,
    escolhidas:depois.altoNivel.lendarias.gastos,restante:depois.altoNivel.lendarias.restante},
  saldo:depois.catarse.restante,demaisCamposPreservados:true,
  compras:corrigida.catarse.compras.length,unidades:corrigida.catarse.compras.reduce((s,c)=>s+c.quantidade,0)};
fs.writeFileSync(new URL('ficha-validada.json',import.meta.url),JSON.stringify(relatorio,null,2)+'\n');
console.log(JSON.stringify(relatorio,null,2));
