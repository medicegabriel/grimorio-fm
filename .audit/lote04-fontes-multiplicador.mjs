import { readFileSync, writeFileSync } from 'node:fs';
const trocar = (arquivo, antes, depois) => {
 const texto = readFileSync(arquivo, 'utf8'); const nl = texto.includes('\r\n') ? '\r\n' : '\n';
 antes = antes.replace(/\r?\n/g, nl); depois = depois.replace(/\r?\n/g, nl);
 if (texto.split(antes).length !== 2) throw new Error(`Trecho não único em ${arquivo}`);
 writeFileSync(arquivo, texto.replace(antes, depois), 'utf8');
};
trocar('src/systems/afty/afty-pericias.js',
 '      ...(mult > 1 ? [{ label: "Multiplicador de Alcance", texto: `×${br(mult)}` }] : []),',
 `      ...(mult > 1 ? [{
        label: ctx.contextoDsl?.invencivel_sob_osol ? "Invencível sob o Sol" : "Postura do Céu",
        texto: \`×\${br(mult)}\`,
      }] : []),`);
trocar('asserts/t-alcance-corpo-a-corpo.mjs',
 '  t(`${sistema}: bônus à distância entra antes do dobro do Céu`, alcance(ceu, ARMAS[1]), [78, 138]);',
 `  t(\`\${sistema}: bônus à distância entra antes do dobro do Céu\`, alcance(ceu, ARMAS[1]), [78, 138]);
  t(\`\${sistema}: o dobro tem o nome da Postura no hover\`, fonte(ceu, "basico", "Postura do Céu"), [{ label: "Postura do Céu", texto: "×2" }]);
  const apice = ficha(sistema, { extensas: true, combate: { invencivelSobOSol: true } });
  apice.core.nd = 30;
  apice.especializacoes = [{ id: "combatente", nivel: 20 }, { id: "conjurador", nivel: 10 }];
  apice.habilidadesLendarias = ["len_atingir_apice"];
  apice.escolhasAltoNivel = { len_atingir_apice: ["api_invencivel_sob_o_sol"] };
  const sol = deriveAfty(apice);
  t(\`\${sistema}: o Ápice dobra o alcance com Articulações\`, alcance(sol, "basico"), [6, 6]);
  t(\`\${sistema}: o dobro do Ápice tem o nome da fonte no hover\`, fonte(sol, "basico", "Invencível sob o Sol"), [{ label: "Invencível sob o Sol", texto: "×2" }]);`);
trocar('.audit/lote04-browser.mjs',
 "const context = await browser.newContext({ viewport: { width: largura, height: 1000 } });",
 "const context = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });");
trocar('.audit/lote04-browser.mjs', '   await botao.hover();', '   if (largura === 390) await botao.tap(); else await botao.hover();');
trocar('.audit/lote04-browser.mjs',
 "   await page.screenshot({ path: `.audit/lote04-shots/${rota}-${largura}-${nomeArquivo}.png`, fullPage: true });\n   await page.mouse.move(0, 0);",
 "   await page.screenshot({ path: `.audit/lote04-shots/${rota}-${largura}-${nomeArquivo}.png` });\n   if (largura === 390) await botao.tap(); else await page.mouse.move(0, 0);");
// Só o parágrafo desta sessão muda, depois de reler o arquivo compartilhado.
trocar('docs/afty-status.md', '`t-alcance-corpo-a-corpo.mjs` novo, 91 asserts,', '`t-alcance-corpo-a-corpo.mjs` novo, 97 asserts,');
console.log('Fontes do multiplicador identificadas.');
