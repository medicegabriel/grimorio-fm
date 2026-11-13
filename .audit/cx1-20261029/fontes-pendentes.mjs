import { coletarInventario, lerJson, CONTROLE } from '../../scripts/revisao-automacao/inventario.mjs';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
const vivo = await coletarInventario();
const fontes = lerJson(resolve(CONTROLE, 'fontes.json'));
const diagnostico = { remendos: vivo.itens.filter(i => i.tipo === 'remendo').length,
  ausentes: vivo.itens.filter(i => !Object.hasOwn(fontes.itens, i.chave)).map(i => ({ chave: i.chave, proprietario: i.proprietario })),
  erros: vivo.erros };
writeFileSync(new URL('./fontes-pendentes.json', import.meta.url), JSON.stringify(diagnostico, null, 2));
console.log(JSON.stringify({ remendos: diagnostico.remendos, ausentes: diagnostico.ausentes.length,
  addons: diagnostico.ausentes.filter(i => i.chave.startsWith('addon')).length,
  erros: diagnostico.erros.length }));
