import fs from 'node:fs';
function trocar(arquivo, antes, depois) {
  const atual = fs.readFileSync(arquivo, 'utf8');
  const eol = atual.includes('\r\n') ? '\r\n' : '\n';
  antes = antes.replace(/\r?\n/g, eol); depois = depois.replace(/\r?\n/g, eol);
  if (atual.split(antes).length !== 2) throw new Error(`Trecho não único: ${arquivo}`);
  fs.writeFileSync(arquivo, atual.replace(antes, depois));
}
trocar('src/systems/afty/afty-efeitos-conteudo.js',
`  // Avançada sobre o Cobrir-se). O Afty tem uma CD só, a Amaldiçoada, então o
  // "atributo escolhido para CD" é o \`mod_tecnica\`.
  sup_suporte_absoluto: [
    { canal: "curaUsos", alvo: "cura_suporte_em_combate", expr: "mod_pre_ou_sab" },
    { canal: "curaFixa", expr: "mod_tecnica" },`,
`  // Avançada sobre o Cobrir-se). A CD de especialização do Suporte usa Presença
  // ou Sabedoria: \`mod_pre_ou_sab\` na cura também (autor, 2026-10-03, nos dois).
  sup_suporte_absoluto: [
    { canal: "curaUsos", alvo: "cura_suporte_em_combate", expr: "mod_pre_ou_sab" },
    { canal: "curaFixa", expr: "mod_pre_ou_sab" },`);
trocar('src/systems/afty/afty-feiticos.js',
` * ⚠ ASSUNÇÃO ANOTADA: a leitura alternativa é que "todo nível" inclua o 1°, e aí
 * um Conjurador de 1° nível teria TRÊS Feitiços. Ela foi descartada porque
 * contradiz "por padrão, inicia com dois Feitiços" na mesma página. As duas
 * leituras só divergem a partir do 3° nível. Anotada em docs/a-fazer.md.`,
` * Autor, 2026-10-03: confirmado \`n - 1\` na Ficha de Player. O 1° nível mantém
 * os dois Feitiços iniciais, e cada subida de nível concede um novo. Os marcos
 * do 10 e do 20 continuam somando.`);
console.log('Suporte Absoluto corrigido. Comentário da progressão de Feitiços registra a confirmação do autor.');
