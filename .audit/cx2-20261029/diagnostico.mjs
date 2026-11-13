import { register } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const R = new URL('../../src/systems/afty/', import.meta.url);
const { deriveAfty } = await import(new URL('afty-derive.js', R));
const { createBlankAfty } = await import(new URL('afty-schema.js', R));
const F = await import(new URL('afty-feiticos.js', R));
const ficha = (origem, nivel = 12) => {
  const c = createBlankAfty();
  c.rulesVersion = 'player';
  c.name = 'CX2 diagnóstico isolado';
  c.core = { ...c.core, nd: nivel, tipo: 'conjurador', patamar: 'comum', origem };
  c.especializacoes = [{ id: 'conjurador', nivel }];
  c.attributes = { forca: 10, destreza: 12, constituicao: 14, inteligencia: 16, sabedoria: 14, presenca: 10 };
  c.feiticos = [{ ...F.createBlankFeitico(), id: 'teste', nome: 'Marca CX2', nivel: 1, tipo: 'dano' }];
  return c;
};
for (const origem of [
  { id: 'inato', marcaRegistrada: 'teste' },
  { id: 'herdado', cla: 'cla_zenin', focados: [{ id: 'teste', modo: 'dano' }] },
  { id: 'herdado', cla: 'cla_kamo' },
  { id: 'herdado', cla: 'cla_inumaki' },
  { id: 'derivado' },
  { id: 'feto_amaldicoado_hibrido', anatomias: ['carapaca_mutante'], anatomiasConfig: { carapaca_mutante: { tipoDano: 'ct' } } },
  { id: 'corpo_amaldicoado_mutante' },
]) {
  const c = ficha(origem);
  const d = deriveAfty(c);
  console.log(JSON.stringify({ origem, hp: d.hp, custo: d.feiticos.lista[0]?.custoPE, dano: d.feiticos.lista[0]?.valor,
    mesa: d.mesa, cura: d.cura.linhas.map(x=>x.id), defesas: d.defesasDano,
    aptidoes: d.aptidoes, origemResolvida: d.origem }));
}
const arquivos = ['afty-origens.js','afty-anatomias.js','afty-talentos.js','afty-efeitos-conteudo.js','afty-feiticos.js','afty-cura.js','afty-derive.js','AftyCreatureBuilder.jsx','ficha/ficha-conteudo.js','ficha/AftyFicha.jsx','encontros/PainelDeCombatente.jsx'];
mkdirSync(new URL('originais/', import.meta.url), { recursive: true });
for (const arq of arquivos) writeFileSync(new URL('originais/' + arq.replaceAll('/', '_'), import.meta.url), readFileSync(new URL(arq, R)));
