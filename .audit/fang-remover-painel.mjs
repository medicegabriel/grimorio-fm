import fs from 'node:fs';
for(const f of ['src/systems/afty/ficha/AftyFicha.jsx','src/systems/afty/encontros/PainelDeCombatente.jsx']) {
let s=fs.readFileSync(f,'utf8').replace(/^import PainelEspecializacoes[^\n]*\n/m,'').replace(/^\s*especializacoes=\{<PainelEspecializacoes[^\n]*\n/m,'');
s=s.replace('onNovoTurnoArmas={derived.habilidades.canonicas?.some((id) => id.startsWith("res_")) ? null : () => atualiza((s) => iniciaTurnoFicha(s, derived))}', 'onNovoTurnoArmas={() => atualiza((s) => iniciaTurnoFicha(s, derived))}');
fs.writeFileSync(f,s);
}
const f='src/systems/afty/ficha/abas/AbaAcoes.jsx';let s=fs.readFileSync(f,'utf8').replace('  golpeEspecial = null, especializacoes = null,','  golpeEspecial = null,').replace('      {especializacoes}\n','');fs.writeFileSync(f,s);
