import { register } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const dir = resolve('docs/revisao-automacao');
const ler = nome => JSON.parse(readFileSync(resolve(dir, nome), 'utf8'));
const gravar = (nome, v) => writeFileSync(resolve(dir, nome), JSON.stringify(v, null, 2).replaceAll(String.fromCharCode(0x2014), '\\u2014') + '\n');
const inicial = JSON.parse(readFileSync('.audit/sync-github-2026-10-12-proposta.json', 'utf8'));
const addons = [...new Set(inicial.adicionados.filter(a => a.item.addon).map(a => a.item.addon))].sort();
const campanha = ler('campanha.json'), escopo = ler('escopo.json'), fontes = ler('fontes.json');
const donos = {};
addons.forEach((arquivo, i) => {
  const lote = `AD-${54 + i}`;
  const pacote = JSON.parse(readFileSync(resolve('addons', arquivo), 'utf8'));
  donos[arquivo] = lote;
  if (campanha.lotes.some(l => l.lote === lote)) throw Error('Lote já existe: ' + lote);
  campanha.lotes.push({ lote, nome: `Addon: ${pacote.nome}`, fase: 'Addons', estado: 'NÃO REVISADO', auditoria: 'NÃO EXECUTADA', dependencias: ['M05', 'M04', 'M02'], registro: `${lote}/registro.json`, proprietario: `executor do lote ${lote}` });
  fontes.lotes[lote] = { fontes: [], nota: 'Pacote recebido do GitHub em 2026-10-12. Fonte externa ainda não localizada nesta campanha; integração não aprova a regra.' };
});
escopo.modulos['afty-dharma.js'] = donos['grande-roda-dharma.json'];
escopo.modulos['afty-olhinhos-lu.js'] = donos['olhinhos-lu.json'];
gravar('campanha.json', campanha); gravar('escopo.json', escopo); gravar('fontes.json', fontes);
const { coletarInventario } = await import('../scripts/revisao-automacao/inventario.mjs');
const { construirProposta, aplicarProposta } = await import('../scripts/revisao-automacao/reconciliar.mjs');
const vivo = await coletarInventario(), inventario = ler('inventario.json');
const proposta = construirProposta({ vivo, inventario, escopo });
if (proposta.errosColeta.length || proposta.removidos.length) throw Error('Reconciliação exige exame adicional');
const antigas = new Map(inventario.itens.map(i => [i.chave, i.proprietario]));
for (const a of proposta.adicionados) proposta.decisoes.adicoes[a.chave] = a.item.addon ? donos[a.item.addon] : a.proprietarioSugerido;
for (let passo = 0; passo < 5; passo++) for (const a of proposta.adicionados) {
  const vinculo = a.item.referencia ?? a.item.pai;
  const dono = proposta.decisoes.adicoes[vinculo] ?? antigas.get(vinculo);
  if (dono) proposta.decisoes.adicoes[a.chave] = dono;
}
for (const a of proposta.adicionados) if (!proposta.decisoes.adicoes[a.chave]) throw Error('Sem dono: ' + a.chave);
proposta.decisoes.justificativaAtualizacao = 'Integração dos 17 commits a0cefc2..e8faae3 com o trabalho local preservado. Novos pacotes registrados em AD-54 a AD-68, novos módulos vinculados aos seus mecanismos. Atualizações conservam os proprietários e estados anteriores. Sem remoções, sem aprovação ou auditoria de regras.';
aplicarProposta({ proposta, vivo, inventario, campanha, escopo });
writeFileSync('.audit/sync-github-2026-10-12-proposta-aplicavel.json', JSON.stringify(proposta, null, 2).replaceAll(String.fromCharCode(0x2014), '\\u2014') + '\n');
console.log(JSON.stringify({ novosLotes: donos, adicoes: proposta.adicionados.length, alterados: proposta.alterados.length, removidos: proposta.removidos.length }, null, 2));
