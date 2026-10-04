import fs from 'node:fs';
const origem=fs.readFileSync('.audit/lote09-documentar-final.mjs','utf8');
const parte=origem.slice(origem.indexOf("trocar(ficha,'tem descanso"));
const cabecalho=`import fs from 'node:fs';
const ficha='docs/afty-ficha-final.md';
function trocar(p,de,para){let s=fs.readFileSync(p,'utf8');const nl=s.includes('\\r\\n')?'\\r\\n':'\\n';de=de.replace(/\\n/g,nl);para=para.replace(/\\n/g,nl);if(!s.includes(de))throw Error('Trecho ausente: '+p);fs.writeFileSync(p,s.replace(de,para));}
`;
fs.writeFileSync('.audit/lote09-documentar-restante.mjs',cabecalho+parte);
