import { readFileSync, writeFileSync } from 'node:fs';
const arquivo = 'src/systems/afty/ui/fontes.jsx';
const texto = readFileSync(arquivo, 'utf8');
const antes = '        onFocus={() => { if (lista.length) abrir(); }}';
if (texto.split(antes).length !== 2) throw new Error('Foco não único');
const nl = texto.includes('\r\n') ? '\r\n' : '\n';
const depois = `        // No toque, o clique abre o painel. Abrir também pelo foco faria esse
        // mesmo clique fechá-lo. Hover e foco visível de teclado seguem abrindo.
        onFocus={(e) => { if (lista.length && (temHover() || e.currentTarget.matches(":focus-visible"))) abrir(); }}`.replace(/\n/g, nl);
writeFileSync(arquivo, texto.replace(antes, depois), 'utf8');
