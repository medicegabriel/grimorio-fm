import assert from 'node:assert/strict';
import { register } from 'node:module';
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}',import.meta.url);
const R=new URL('../src/systems/afty/',import.meta.url).href;
const {deriveAfty}=await import(R+'afty-derive.js');
const {createBlankAfty}=await import(R+'afty-schema.js');
const {getHabilidade,avaliarAcessoHabilidade}=await import(R+'afty-habilidades.js');
const {catalogoImitacao,idsPossuidosNaImitacao,trocarCopiaImitacao}=await import(R+'afty-imitacao.js');
const {aplicarAddons}=await import(R+'afty-addons.js');
const {rolarTeste,rolarDano}=await import(R+'ficha/ficha-rolagem.js');
const {sessaoEmBranco,proximaRodada,aplicaDano,alteraEstadoCombate}=await import(R+'ficha/ficha-sessao.js');
const {prepararRolagemEspecializacao,registrarAtaqueEspecializacao,recursosDeEspecializacao}=await import(R+'ficha/ficha-especializacoes.js');
let n=0;const igual=(a,b)=>{assert.deepEqual(a,b);n++;};
function ficha(sistema,nivel=20){const c=createBlankAfty();c.rulesVersion=sistema;c.core.nd=nivel;c.core.origem={id:'restringido'};c.especializacoes=[{id:'restringido',nivel}];return c;}
for(const sistema of ['afty','player']){
 for(const nivel of [2,6,12,16,20]){
  const c=ficha(sistema,nivel);c.habilidades=['res_roubo_de_habilidade'];const base=deriveAfty(c);
  c.escolhasHabilidade={res_roubo_de_habilidade:['lut_corpo_calejado']};const d=deriveAfty(c);
  igual(d.hp-base.hp,nivel);igual(d.habilidades.contextosPorHabilidade.lut_corpo_calejado.esc_lutador,nivel);
  igual(d.especializacoes.escolhidas.some(x=>x.id==='lutador'),false);
 }
 const crit=ficha(sistema,16);crit.habilidades=['res_roubo_de_habilidade'];crit.escolhasHabilidade={res_roubo_de_habilidade:['cmb_critico_aperfeicoado']};const critD=deriveAfty(crit);
 const context={niveisPorEspec:critD.habilidades.niveisPorEspec,escolhidas:critD.habilidades.efetivas,roubadas:critD.habilidades.roubadas,nivelPorHabilidade:critD.habilidades.nivelPorHabilidade};
 igual(critD.habilidades.efetivas.includes('cmb_critico_melhorado'),false);
 igual(critD.dano.entradas[0].margemCritico,18);
 const ambas=deriveAfty({...crit,escolhasHabilidade:{res_roubo_de_habilidade:['cmb_critico_aperfeicoado','cmb_critico_melhorado']}});igual(ambas.dano.entradas[0].margemCritico,18);
 igual(avaliarAcessoHabilidade(getHabilidade('cmb_critico_aperfeicoado'),context).ok,false);
 igual(critD.habilidades.inacessiveis.includes('cmb_critico_aperfeicoado'),true);
 igual(critD.habilidades.escolhas.porHab.res_roubo_de_habilidade.bloqueadas.includes('cmb_critico_aperfeicoado'),true);
 igual(critD.habilidades.escolhas.porHab.res_roubo_de_habilidade.motivosBloqueio.cmb_critico_aperfeicoado,'Requer Crítico Melhorado');
 igual(ambas.habilidades.inacessiveis.includes('cmb_critico_aperfeicoado'),false);
 igual(ambas.habilidades.escolhas.porHab.res_roubo_de_habilidade.bloqueadas.includes('cmb_critico_aperfeicoado'),false);
 const inversa=deriveAfty({...crit,escolhasHabilidade:{res_roubo_de_habilidade:['cmb_critico_melhorado','cmb_critico_aperfeicoado']}});
 igual(inversa.habilidades.inacessiveis.includes('cmb_critico_aperfeicoado'),false);
 const copiada=deriveAfty({...ficha(sistema,16),habilidades:['res_imitacao','res_imitacao_perfeita'],combate:{ativo:true,...trocarCopiaImitacao({}, {id:'cmb_critico_aperfeicoado',tipo:'passiva'})}});
 igual(copiada.habilidades.efetivas.includes('cmb_critico_melhorado'),false);
 igual(copiada.habilidades.inacessiveis.includes('cmb_critico_aperfeicoado'),false);
 igual(copiada.dano.entradas[0].margemCritico,18);
 const copiaBaixoNivel=deriveAfty({...ficha(sistema,2),habilidades:['res_imitacao','res_imitacao_perfeita'],combate:{ativo:true,...trocarCopiaImitacao({}, {id:'cmb_critico_aperfeicoado',tipo:'passiva'})}});
 igual(copiaBaixoNivel.habilidades.inacessiveis.includes('cmb_critico_aperfeicoado'),false);
 igual(copiaBaixoNivel.dano.entradas[0].margemCritico,18);
 igual(avaliarAcessoHabilidade(getHabilidade('cmb_critico_aperfeicoado'),{niveisPorEspec:{combatente:16},escolhidas:[]}).ok,false);
 igual(avaliarAcessoHabilidade(getHabilidade('cmb_critico_aperfeicoado'),{...context,nivelPorHabilidade:{cmb_critico_aperfeicoado:2}}).nivelOk,false);
 const c=ficha(sistema);c.habilidades=['res_roubo_de_habilidade','res_imitacao','res_imitacao_perfeita'];
 c.escolhasHabilidade={res_roubo_de_habilidade:['cmb_guarda_estudada','lut_corpo_supremo'],cmb_guarda_estudada:['cmb_guarda_vontade'],lut_corpo_supremo:['lut_supremo_queimante']};
 const d=deriveAfty(c);igual(d.habilidades.escolhas.mapa.cmb_guarda_estudada,['cmb_guarda_vontade']);igual(d.defesasDano.porTipo.queimante.rd>=10,true);
 const owned=idsPossuidosNaImitacao(d,[{id:'cmb_critico_melhorado',tipo:'passiva'}]);
 igual(owned.has('lut_corpo_supremo'),true);igual(owned.has('cmb_guarda_estudada'),true);igual(owned.has('cmb_critico_melhorado'),true);
 const disponiveis=catalogoImitacao('ativa').filter(h=>!owned.has(h.id));igual(disponiveis.some(h=>h.id==='cmb_surto_de_acao'),true);
 const ativos={ativo:true,...trocarCopiaImitacao({}, {id:'cmb_critico_melhorado',tipo:'passiva'})};
 const dc=deriveAfty({...c,combate:ativos});let s={...sessaoEmBranco(dc),combate:ativos};
 s=proximaRodada(s,dc).sessao;igual(s.combate.imitacao.copia.id,'cmb_critico_melhorado');
 s=proximaRodada(s,deriveAfty({...c,combate:s.combate})).sessao;igual(s.combate.imitacao.copia,null);
 igual(s.peAtual,dc.pe);
 const c2=ficha(sistema);c2.habilidades=['res_precisao_forcada','res_instintos_agucados','res_ainda_de_pe'];c2.combate={ativo:true};const d2=deriveAfty(c2);
 let s2={...sessaoEmBranco(d2),combate:{ativo:true}};
 igual(recursosDeEspecializacao(s2,d2).reacoes,2);igual(recursosDeEspecializacao({...s2,peAtual:d2.pe/2},d2).reacoes,1);
 const estado={id:'precisaoForcada',umaVezPorRodada:true};s2=alteraEstadoCombate(s2,estado,true,d2);
 const desc={tipo:'dano',linhaArma:{ataqueId:'corpo'},dados:2,faces:6,fixo:3};const preparado=prepararRolagemEspecializacao(desc,s2,d2);
 igual(rolarDano(preparado,()=>0).total,15);s2=registrarAtaqueEspecializacao(s2,desc,d2);igual(s2.combate.precisaoForcada,false);
 igual(alteraEstadoCombate(s2,estado,true,d2).combate.precisaoForcada,false);
 const ferido=aplicaDano(s2,d2.hp+9,d2);igual(ferido.hpAtual,0);igual(ferido.especializacaoSessao.pvNegativos,9);igual(ferido.especializacaoSessao.quedaPendente,true);
}
const p=idsPossuidosNaImitacao({habilidades:{efetivas:['addon__lut_corpo_supremo'],canonicas:['lut_corpo_supremo'],escolhas:{mapa:{x:['cmb_estilo_defensivo']}}},talentos:{escolhas:{mapa:{x:['cmb_postura_da_terra']}}}},[{id:'lut_ataque_inconsequente'}]);
for(const id of ['addon__lut_corpo_supremo','lut_corpo_supremo','cmb_estilo_defensivo','cmb_postura_da_terra','lut_ataque_inconsequente'])igual(p.has(id),true);
igual(idsPossuidosNaImitacao(null).size,0);
igual(rolarTeste({bonus:5,minimoNatural:8},()=>0).total,13);igual(rolarTeste({bonus:5,minimoNatural:8},()=>0).naturalOriginal,1);
aplicarAddons([]);
console.log(`TODOS OS ${n} ASSERTS PASSARAM`);


