import fs from 'node:fs';const p='asserts/t-fang-especializacoes.mjs';let s=fs.readFileSync(p,'utf8').replace("const {catalogoImitacao,", "const {getHabilidade,avaliarAcessoHabilidade}=await import(R+'afty-habilidades.js');\nconst {catalogoImitacao,");s=s.replace(" const c=ficha(sistema);",` const crit=ficha(sistema,12);crit.habilidades=['res_roubo_de_habilidade'];crit.escolhasHabilidade={res_roubo_de_habilidade:['cmb_critico_aperfeicoado']};const critD=deriveAfty(crit);
 const context={niveisPorEspec:critD.habilidades.niveisPorEspec,escolhidas:critD.habilidades.efetivas,roubadas:critD.habilidades.roubadas,nivelPorHabilidade:critD.habilidades.nivelPorHabilidade};
 igual(critD.habilidades.efetivas.includes('cmb_critico_melhorado'),false);
 igual(avaliarAcessoHabilidade(getHabilidade('cmb_critico_aperfeicoado'),context).ok,true);
 igual(avaliarAcessoHabilidade(getHabilidade('cmb_critico_aperfeicoado'),{niveisPorEspec:{combatente:12},escolhidas:[]}).ok,false);
 igual(avaliarAcessoHabilidade(getHabilidade('cmb_critico_aperfeicoado'),{...context,nivelPorHabilidade:{cmb_critico_aperfeicoado:2}}).nivelOk,false);
 const c=ficha(sistema);`);fs.writeFileSync(p,s);
