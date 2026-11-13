import { register } from 'node:module';
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const root = new URL('../../src/systems/afty/', import.meta.url).href;
const { deriveAfty } = await import(root + 'afty-derive.js');
const { createBlankAfty } = await import(root + 'afty-schema.js');
const F = await import(root + 'afty-feiticos.js');
const { rolarTeste } = await import(root + 'ficha/ficha-rolagem.js');
const { preparaRolagemArma } = await import(root + 'afty-propriedades-armas.js');
const ficha = (anatomias = [], nivel = 10, classe = 'lutador') => {
  const c = createBlankAfty();
  c.rulesVersion = 'player';
  c.name = 'CX1 isolada';
  c.core = { ...c.core, nd: nivel, origem: { id: 'feto_amaldicoado_hibrido', anatomias } };
  c.especializacoes = [{ id: classe, nivel }];
  c.attributes = { forca: 14, destreza: 14, constituicao: 14, inteligencia: 12, sabedoria: 12, presenca: 10 };
  return c;
};
const basico = c => deriveAfty(c).dano.entradas.find(x => x.id === 'basico');
for (const anatomia of ['arma_natural', 'articulacoes_extensas', 'corpo_especializado', 'bracos_extras']) {
  const c = ficha([anatomia]);
  const d = deriveAfty(c);
  console.log(anatomia, JSON.stringify({ dado: basico(c).texto, alcance: basico(c).alcance,
    atletismo: d.testes.pericias.find(x => x.id === 'atletismo'),
    anatomias: c.core.origem.anatomias }));
}
console.log('basico sem anatomia', basico(ficha()).texto);
for (const refs of [[], ['it_bracelete_do_vigor'], ['it_bracelete_do_vigor', 'it_bracelete_do_vigor'], ['it_bracelete_do_vigor', 'it_ombreiras_do_vigor_superior']]) {
  const c = ficha();
  c.equipamentos = { itens: refs.map((refId, i) => ({ uid: `cx1-${i}`, tipo: 'item', refId, qtd: 1, equipado: true })) };
  console.log('itens', refs, deriveAfty(c).hp);
}
console.log('passiva defesa 5', F.calcularFeiticoPassivo({ tipo: 'passivo', nivel: 5, categoriaPassivo: 'defesa' }, { sistema: 'player' }).valor);
const linha = basico(ficha());
const desc = preparaRolagemArma({ tipo: 'teste', rotulo: 'Ataque Básico · Acerto', bonus: linha.acerto, margem: linha.margemCritico, linhaArma: linha });
for (const natural of [1, 20]) {
  const r = rolarTeste(desc, () => (natural - 1) / 20);
  console.log('percurso real ataque', JSON.stringify({ natural, sucesso: r.sucesso, critico: r.critico, pifia: r.pifia }));
}
const armada = ficha();
armada.equipamentos = { itens: [{ uid: 'cx1-bastao', tipo: 'arma', refId: 'arm_bastao', qtd: 1, equipado: true }] };
for (const [natural, defesaAlvo] of [[20, 100], [1, 1]]) {
  const d = deriveAfty(armada, { propriedadesArmas: { porArma: { 'cx1-bastao': { defesaAlvo } } } });
  const e = d.dano.entradas.find(x => x.id === 'arm_bastao');
  const pedido = preparaRolagemArma({ tipo: 'teste', rotulo: 'Bastão · Acerto', bonus: e.acerto, margem: e.margemCritico, linhaArma: e });
  const r = rolarTeste(pedido, () => (natural - 1) / 20);
  console.log('ampla com Defesa do Alvo', JSON.stringify({ natural, defesaAlvo, total: r.total, sucesso: r.sucesso, critico: r.critico }));
}
