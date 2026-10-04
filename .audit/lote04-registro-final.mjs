import { readFileSync, writeFileSync } from 'node:fs';
const arquivo = 'docs/afty-status.md';
const texto = readFileSync(arquivo, 'utf8');
const antes = 'para ligar `NumeroComFontes` nesse valor. Duas entradas saíram da fila';
const depois = 'para ligar `NumeroComFontes` nesse valor. Em `ui/fontes.jsx`, o foco de toque deixa a abertura para o clique, enquanto hover e foco visível de teclado continuam abrindo. Isso corrige o primeiro toque, que antes abria pelo foco e fechava pelo clique. O multiplicador agora leva o nome de Postura do Céu ou Invencível sob o Sol no painel. Duas entradas saíram da fila';
if (texto.split(antes).length !== 2) throw new Error('Trecho não único');
const atualizado = texto.replace(antes, depois).replace('A característica aparece na aba Habilidades com o texto do livro. Sem rolagem horizontal, erro de página ou erro de console. Capturas, relatório e roteiro em `.audit/lote04-*`.', 'A característica aparece na aba Habilidades com o texto do livro. No telefone emulado, o primeiro toque abre o painel e o segundo fecha, e Tab com Shift+Tab confirma a abertura por teclado. Sem rolagem horizontal, erro de página ou erro de console. Capturas, relatório e roteiro em `.audit/lote04-*`.');
writeFileSync(arquivo, atualizado, 'utf8');
