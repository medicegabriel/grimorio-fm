import { readFileSync, writeFileSync } from 'node:fs';
const path = '.audit/lote09-browser.mjs';
let t = readFileSync(path, 'utf8');
t = t.replaceAll("locator('[data-afty-stat=\"defesa\"]')", "locator('[data-afty-stat=\"defesa\"]').first()");
t = t.replaceAll("locator('[data-afty-stat=\"rd-geral\"]')", "locator('[data-afty-stat=\"rd-geral\"]').first()");
writeFileSync(path, t);
