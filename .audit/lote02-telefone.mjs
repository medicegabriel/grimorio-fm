import { readFileSync, writeFileSync } from "node:fs";
let s = readFileSync(".audit/lote02-layout.mjs", "utf8");
s = s.replace('for (const largura of [1440, 390])', 'for (const largura of [390])');
s = s.replace('viewport: { width: largura, height: 900 }', 'viewport: { width: largura, height: 900 }, isMobile: true, hasTouch: true');
writeFileSync(".audit/lote02-layout-telefone.mjs", s);
