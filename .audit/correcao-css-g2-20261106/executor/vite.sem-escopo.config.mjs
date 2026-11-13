import postcss from 'postcss';
import base from './vite.config.mjs';
export default {...base,plugins:[{name:'prova-sem-escopo',enforce:'pre',transform(code,id){
 if(!/\/(efeitos-g2|abas-g2)\.css$/.test(id.replaceAll('\\','/')))return null;
 const r=postcss.parse(code);r.walkAtRules('scope',s=>s.replaceWith(...s.nodes));
 return {code:r.toString(),map:null};
}},...base.plugins]};
