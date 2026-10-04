import fs from 'node:fs';
const arquivo = 'asserts/t-suporte-revisao.mjs';
const atual = fs.readFileSync(arquivo, 'utf8');
const eol = atual.includes('\r\n') ? '\r\n' : '\n';
const alvo = 'console.log(bad.length ?';
if (atual.split(alvo).length !== 2) throw new Error('Saída do assert não única');
const bloco = `/* 7. SUPORTE ABSOLUTO, ATRIBUTO DA CD DE ESPECIALIZAÇÃO.
   Autor, 2026-10-03: Presença ou Sabedoria nos dois sistemas. A Técnica em
   Inteligência tem modificador diferente para expor a regressão no número. */
for (const sistema of ["afty", "player"]) {
  for (const [presenca, sabedoria, esperado] of [[18, 14, 4], [12, 16, 3]]) {
    const c = createBlankAfty();
    c.rulesVersion = sistema;
    c.core.nd = 20; c.core.nivel = 20; c.core.tecnicaAttr = "inteligencia";
    c.especializacoes = [{ id: "suporte", nivel: 20 }];
    c.habilidades = ["sup_suporte_em_combate", "sup_suporte_absoluto"];
    c.attrMethod = "fixos";
    c.attributes = { forca: 10, destreza: 10, constituicao: 10, inteligencia: 20, presenca, sabedoria };
    const d = deriveAfty(c);
    const cura = d.cura.linhas.find((l) => l.id === "cura_suporte_em_combate");
    const tag = \`[\${sistema}] PRE \${presenca}, SAB \${sabedoria}\`;
    t(\`\${tag}: Técnica em Inteligência tem modificador diferente\`, d.modTecnica, 5);
    t(\`\${tag}: Suporte Absoluto soma Presença ou Sabedoria com fonte única\`,
      cura?.partesFixas.filter((p) => p.label === "Suporte Absoluto").map((p) => p.valor), [esperado]);
  }
}

`;
fs.writeFileSync(arquivo, atual.replace(alvo, bloco.replace(/\r?\n/g, eol) + alvo));
console.log('Caso do Suporte Absoluto adicionado para os dois sistemas e os dois atributos.');
