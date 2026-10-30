import assert from 'node:assert/strict';
import fs from 'node:fs';
import { register } from 'node:module';
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
const { deriveAfty } = await import('../src/systems/afty/afty-derive.js');
const { createBlankAfty } = await import('../src/systems/afty/afty-schema.js');
const { trocarCopiaImitacao } = await import('../src/systems/afty/afty-imitacao.js');
// Recorte dos campos da exportação do autor que afetam a margem e a Imitação.
const c = createBlankAfty();
c.rulesVersion = 'player';
c.core.nd = 30;
c.core.origem = { id: 'gemeos', escolhas: { verdadeiras_origens: ['vo_restringido_fisico_abencoado'] }, irmaoMorto: true };
c.especializacoes = [{ id: 'restringido', nivel: 15 }];
c.habilidades = ['res_imitacao', 'res_imitacao_perfeita', 'res_tecnicas_de_memorizacao'];
c.habilidadesLendarias = ['len_atingir_apice'];
c.escolhasAltoNivel = { len_atingir_apice: ['api_fluxo_invencivel'] };
c.imitacaoAprendidas = [
  { tipo: 'passiva', id: 'cmb_critico_aperfeicoado', escolhas: [] },
  { tipo: 'estilo', id: 'cmb_estilo_do_duelista', escolhas: [] },
  { tipo: 'ativa', id: 'cmb_mestre_da_postura', escolhas: ['cmb_postura_da_devastacao', 'cmb_postura_do_ceu'] },
  { tipo: 'manobra', id: 'lut_manobra_desarme', escolhas: [] },
  { tipo: 'ativa', id: 'cmb_preparacao_rapida', escolhas: [] },
];
c.escolhasHabilidade = Object.fromEntries(c.imitacaoAprendidas.map(x => [x.id, x.escolhas]));
c.combate = { ativo: true, fluxoInvencivel: true, manobraDesarme: true,
  imitacao: { copia: { tipo: 'manobra', id: 'lut_manobra_desarme', escolhas: [], aprendida: true }, esperandoTurno: true, aviso: null } };
c.equipamentos.itens = [{ uid: 'eq_mv631cpt_2', tipo: 'arma', refId: 'arm_espada_longa', qtd: 1, equipado: true,
  fa: { grau: 'especial', encantamentos: ['enc_arma_precisa', 'enc_arma_potente', 'enc_arma_armazenadora', 'enc_arma_certeira'], habilidadeUnica: '' } }];
const resumir = d => ({ copia: d.imitacao.copia?.id, aprendida: d.imitacao.aprendidas.some(x => x.id === 'cmb_critico_aperfeicoado'),
  entradas: d.dano.entradas.map(e => ({ nome: e.nome, margem: e.margemCritico, fontes: e.partesMargemCritico })) });
const atual = deriveAfty(c);
const ativada = deriveAfty({ ...c, combate: { ...c.combate,
  ...trocarCopiaImitacao(c.combate, { ...c.imitacaoAprendidas[0], aprendida: true }) } });
assert.equal(atual.imitacao.aprendidas.some(x => x.id === 'cmb_critico_aperfeicoado'), true);
assert.equal(atual.imitacao.copia.id, 'lut_manobra_desarme');
assert.deepEqual(atual.dano.entradas.map(e => e.margemCritico), [18, 17]);
assert.equal(atual.dano.entradas.some(e => e.partesMargemCritico.some(p => p.label === 'Crítico Aperfeiçoado')), false);
assert.deepEqual(ativada.dano.entradas.map(e => e.margemCritico), [16, 15]);
assert.equal(ativada.dano.entradas.every(e => e.partesMargemCritico.some(p => p.label === 'Crítico Aperfeiçoado' && p.valor === -2)), true);
const report = { atual: resumir(atual), aoImitarCritico: resumir(ativada), verificacoes: 6 };
fs.writeFileSync('.audit/critico-imitacao-fang-diagnostico.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
