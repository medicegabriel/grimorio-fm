import { readFileSync, writeFileSync } from 'node:fs';
const path = '.audit/lote09-registrar.mjs';
const texto = readFileSync(path, 'utf8');
const inicio = texto.indexOf('const registro = ');
const fim = texto.indexOf('if (registro.includes', inicio);
if (inicio < 0 || fim < 0) throw new Error('Registro ausente');
writeFileSync(path, texto.slice(0, inicio) + "const registro = '\n' + readFileSync('.audit/lote09-sessao.md', 'utf8').replace(/\\r\\n/g, '\\n');\n" + texto.slice(fim));
