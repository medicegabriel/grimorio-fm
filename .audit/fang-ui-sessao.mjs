import fs from 'node:fs';
const painel='src/systems/afty/encontros/PainelDeCombatente.jsx';const baseline=JSON.parse(fs.readFileSync('.audit/fang-correcoes-baseline.json','utf8'));baseline[painel]=fs.readFileSync(painel,'utf8');fs.writeFileSync('.audit/fang-correcoes-baseline.json',JSON.stringify(baseline));
for(const f of ['src/systems/afty/ficha/AftyFicha.jsx',painel]){
let s=fs.readFileSync(f,'utf8');const base=f.includes('encontros/')?'../ficha/':'./';
s=s.replace('import { rolarTeste, rolarDano }', `import PainelEspecializacoes from "${base}PainelEspecializacoes";\nimport { prepararRolagemEspecializacao, registrarAtaqueEspecializacao, aplicarCuraRoladaEspecializacao } from "${base}ficha-especializacoes";\nimport { rolarTeste, rolarDano }`);
s=s.replace('  const rolar = useCallback((desc) => {', '  const rolar = useCallback((desc) => {\n    desc = prepararRolagemEspecializacao({ ...desc, modo }, sessao, derived);\n    if (!desc) return null;');
s=s.replace('      return proxima;\n    });\n    return r;', '      proxima = registrarAtaqueEspecializacao(proxima, desc, derived);\n      proxima = aplicarCuraRoladaEspecializacao(proxima, desc, r, derived);\n      return proxima;\n    });\n    return r;');
s=s.replace('      <AbaAcoes\n', `      <AbaAcoes\n        especializacoes={<PainelEspecializacoes derived={derived} sessao={sessao} onSessao=${f.includes('encontros/')?'{onSessao}':'{atualiza}'} />}\n`);
s=s.replace('aplicaDano(s, -n)', 'aplicaDano(s, -n, derived)').replace('aplicaDano(s, n)', 'aplicaDano(s, n, derived)');
if(f.includes('AftyFicha')){
s=s.replace('  carregarSessao, salvarSessao, aparaSessao,','  carregarSessao, salvarSessao, aparaSessao, iniciaTurnoFicha,');
s=s.replace('onNovoTurnoArmas={() => atualiza((s) => iniciaTurnoArmas(s))}', 'onNovoTurnoArmas={derived.habilidades.canonicas?.some((id) => id.startsWith("res_")) ? null : () => atualiza((s) => iniciaTurnoFicha(s, derived))}');
s=s.replace('marcaErroDaArma, iniciaTurnoArmas, danoDaAmpla', 'marcaErroDaArma, danoDaAmpla');
}
fs.writeFileSync(f,s);
}
const f='src/systems/afty/ficha/abas/AbaAcoes.jsx';let s=fs.readFileSync(f,'utf8');s=s.replace('  golpeEspecial = null,', '  golpeEspecial = null, especializacoes = null,');s=s.replace('      {adaptacao}', '      {especializacoes}\n      {adaptacao}');fs.writeFileSync(f,s);
