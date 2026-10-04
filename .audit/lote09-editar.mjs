import { readFileSync, writeFileSync } from 'node:fs';
const editar = (path, alteracoes) => {
  let texto = readFileSync(path, 'utf8');
  for (const [antes, depois, todas = false] of alteracoes) {
    const a = antes.replace(/\n/g, texto.includes('\r\n') ? '\r\n' : '\n');
    const d = depois.replace(/\n/g, texto.includes('\r\n') ? '\r\n' : '\n');
    if (!texto.includes(a)) throw new Error('Trecho ausente em ' + path + ': ' + antes);
    texto = todas ? texto.split(a).join(d) : texto.replace(a, d);
  }
  writeFileSync(path, texto);
};
editar('src/systems/afty/afty-derive.js', [
  ['     apagado da ficha. Com o Fundamento só fora de campo, a mesa marca os\n     Feitiços e o resto continua (ver docs/a-fazer.md). */', '     apagado da ficha. Fora de campo, a mesa bloqueia também o Funcionamento e\n     as Passivas (decisão do autor, 2026-10-03). O criador não tem esse estado. */'],
  ['semTecnicaPerdida', 'semTecnicaBloqueada', true],
  ['const semTecnicaBloqueada = (lista) => (tecnicaInata.perdida ?', 'const semTecnicaBloqueada = (lista) => (tecnicaInata.bloqueada ?'],
]);
editar('src/systems/afty/afty-invocacoes.js', [
  [' *   foraDeCampo  há mesa, e o Fundamento não está em campo. Só a mesa sabe disso,\n *                e o criador nunca vê.', ' *   foraDeCampo  há mesa, e o Fundamento não está em campo. Bloqueia Feitiços,\n *                Funcionamento e Passivas enquanto ele estiver fora. Só a mesa\n *                sabe disso, e o criador nunca vê (autor, 2026-10-03).'],
]);
editar('src/systems/afty/ficha/abas/AbaInvocacoes.jsx', [
  ['      {cssDosShikigamis && <style>{cssDosShikigamis}</style>}', '      {cssDosShikigamis && <style>{cssDosShikigamis}</style>}\n\n      {derived.tecnicaInata?.bloqueada && (\n        <div className="afty-aviso flex items-center gap-2" role="status">\n          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />\n          <span>Técnica Inata Indisponível: {derived.tecnicaInata.motivo}</span>\n        </div>\n      )}'],
]);
editar('asserts/t-invocacao-tipos-especiais.mjs', [
  ['      (e só os Feitiços quando ele está fora de campo), e a Iniciativa própria.', '      ou está fora de campo na mesa, e a Iniciativa própria.'],
  ['t("fora de campo, os Feiticos ficam marcados e os numeros nao mudam",', 't("fora de campo, os Feiticos ficam marcados e Funcionamento e Passivas param",'],
  ['[["Fundamento Fora de Campo", "Fundamento Fora de Campo"], true, true]);', '[["Fundamento Fora de Campo", "Fundamento Fora de Campo"], false, false]);'],
]);
console.log('Decisão 1 aplicada.');
