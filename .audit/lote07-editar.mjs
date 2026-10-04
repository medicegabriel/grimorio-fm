import fs from 'node:fs';
function edit(file, changes) {
  let s = fs.readFileSync(file, 'utf8');
  const nl = s.includes('\r\n') ? '\r\n' : '\n';
  for (let [before, after] of changes) {
    before = before.replaceAll('\n', nl); after = after.replaceAll('\n', nl);
    if (s.split(before).length !== 2) throw Error('Trecho nao unico: ' + file + ': ' + before.slice(0, 65));
    s = s.replace(before, after);
  }
  fs.writeFileSync(file, s);
}
edit('src/systems/afty/afty-derive.js', [[
'  const idsDaMesa = [',
`  /* Hoste Amaldiçoada (autor, 2026-10-03): o par conta como uma nos dois
     limites. Só agrupamos duas Hostes com vínculo recíproco e ambas em campo.
     Quando uma sai, a outra volta a ocupar a vaga por seu próprio id. */
  const hordasDaMesa = (Array.isArray(creature?.hordas) ? creature.hordas : [])
    .filter((h) => !(h?.hoste && h.parId && h.id > h.parId
      && contaInvocacoesEmCampo(opcoes.invocacoes, [\`horda:\${h.id}\`]) > 0
      && (creature.hordas ?? []).some((par) => par?.id === h.parId
        && par.hoste && par.parId === h.id
        && contaInvocacoesEmCampo(opcoes.invocacoes, [\`horda:\${par.id}\`]) > 0)));
  const idsHordasDaMesa = hordasDaMesa.map((h) => \`horda:\${h?.id}\`);
  const hordasEmCampo = opcoes.invocacoes
    ? contaInvocacoesEmCampo(opcoes.invocacoes, idsHordasDaMesa) : null;
  const idsDaMesa = [`
], [
'    ...(Array.isArray(creature?.hordas) ? creature.hordas : []).map((h) => `horda:${h?.id}`),',
'    ...idsHordasDaMesa,'
], [
'    ...resolveInvocacoesList(creature?.invocacoes, donoInvoc), controle,',
'    ...resolveInvocacoesList(creature?.invocacoes, donoInvoc), controle,\n    emCampo: invocacoesEmCampo,'
], [
'  const hordas = resolveHordasList(creature?.hordas, creature?.invocacoes, donoInvoc);',
'  const hordas = {\n    ...resolveHordasList(creature?.hordas, creature?.invocacoes, donoInvoc),\n    emCampo: hordasEmCampo,\n  };'
]]);
edit('src/systems/afty/ficha/abas/AbaInvocacoes.jsx', [[
`  /* Quem ocupa vaga em campo é decidido pelo ESTADO (2026-09-30): a Marionete
     quebrada ainda conta até ser recolhida, e o Corpo desativado não conta. */
  const emCampo = [
    ...invocacoes.map((i) => i.id),
    ...[...fusaoDe.keys()],
    ...gruposNucleos.map((g) => g.mesaId),
    ...hordas.map((h) => h.mesaId),
  ].filter((id) => estadoDe(id).contaNoCampo).length;
  /* As Hordas em campo contra o limite delas: o par da Hoste conta como uma. */
  const hordasEmCampo = hordas.filter((h) => estadoDe(h.mesaId).estado === "ativa");
  const nHordasEmCampo = hordasEmCampo.filter((h) => !(h.hoste && h.parId
    && hordasEmCampo.some((o) => o.id === h.parId) && h.id > h.parId)).length;`,
`  /* A mesma contagem que o Motor lê: o par da Hoste ocupa uma vaga nos dois
     limites (autor, 2026-10-03). O estado ainda decide quem está em campo. */
  const emCampo = derived.invocacoes?.emCampo ?? 0;
  const nHordasEmCampo = derived.hordas?.emCampo ?? 0;`
], [
'Conta como uma no limite de hordas com o par',
'Conta como uma nos limites de Hordas e Invocações com o par'
]]);
edit('src/systems/afty/afty-invocacoes.js', [[
` * dissipada no mesmo combate. O PV máximo NÃO cai com os membros perdidos (ver a
 * pergunta em docs/a-fazer.md).`,
` * dissipada no mesmo combate. O PV máximo NÃO cai com os membros perdidos
 * (confirmado pelo autor em 2026-10-03).`
]]);
