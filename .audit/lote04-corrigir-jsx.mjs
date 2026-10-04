import { readFileSync, writeFileSync } from 'node:fs';
const arquivo = 'src/systems/afty/ui/fontes.jsx';
let texto = readFileSync(arquivo, 'utf8');
texto = texto.replace(/        \/\/ No toque, o clique abre o painel\. Abrir também pelo foco faria esse\r?\n        \/\/ mesmo clique fechá-lo\. Hover e foco visível de teclado seguem abrindo\.\r?\n/, '');
writeFileSync(arquivo, texto, 'utf8');
