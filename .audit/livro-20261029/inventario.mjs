import fs from 'node:fs';
import { register } from 'node:module';
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const root = new URL('../../src/systems/afty/', import.meta.url).href;
await import(root + 'afty-derive.js');
const E = await import(root + 'afty-efeitos-conteudo.js');
const defs = [
  ['habilidades', 'afty-habilidades.js', 'AFTY_HABILIDADES', 'HABILIDADE_EFEITOS'],
  ['talentos', 'afty-talentos.js', 'AFTY_TALENTOS', 'TALENTO_EFEITOS'],
  ['aptidoes', 'afty-aptidoes.js', 'AFTY_APTIDOES', 'APTIDAO_EFEITOS'],
  ['origens', 'afty-origens.js', 'AFTY_ORIGENS_CATALOG', 'ORIGEM_EFEITOS'],
  ['clas', 'afty-origens.js', 'CLAS_HERDADO', 'CLA_EFEITOS'],
  ['anatomias', 'afty-anatomias.js', 'ANATOMIAS', 'ANATOMIA_EFEITOS'],
];
const result = {};
for (const [family, file, key, effectMap] of defs) {
  const mod = await import(root + file);
  result[family] = mod[key].map(x => ({...x, mapaEfeitos: E[effectMap]?.[x.id] || []}));
}
// Snapshot de diagnóstico, sem substituir o texto original dos catálogos.
fs.writeFileSync(new URL('./catalogos.json', import.meta.url), JSON.stringify(result, null, 2).replace(/\u2014/g, ','));
for (const [family, list] of Object.entries(result)) {
  console.log(`${family}: ${list.length}`);
  for (const x of list) {
    if (process.argv[2] && process.argv[2] !== family) continue;
    const flags = ['mesa', 'parcial', 'usos', 'cura', 'especializacaoId', 'categoria'].filter(k => x[k] != null).map(k => `${k}=${JSON.stringify(x[k])}`).join(' ');
    console.log(`${x.id} | ${x.nome} | efeitos=${x.mapaEfeitos.length} ${flags}`);
    if (process.argv.includes('--texto')) console.log(x.textoLivro || x.descricao);
    for (const c of x.caracteristicas || []) if (c.mesa || c.parcial) console.log(`  ${c.id}: ${c.parcial || 'mesa'}`);
  }
}
