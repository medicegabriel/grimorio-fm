import { contexto, abre, adicionar, emCombate, espera, foto, sessao, fichas, passo, check, noTopo, estouro, encerra } from './lib.mjs';

// Prova independente da regressão mais sensível: montador denso, confirmação
// por ponteiro e teclado, com as novas regras de contêiner do catálogo.
for (const largura of [390, 1024, 1440]) {
  passo(`Codex: Golpe denso e confirmação em ${largura}`);
  const f = { ...fichas.minamoto, id: `codex-golpe-${largura}`, name: `Golpe Denso ${largura} (Auditoria Codex)` };
  const { ctx, p } = await contexto({ lista: [f], largura, altura: 844 });
  try {
    await abre(p, 'player', f.name);
    await emCombate(p);
    await adicionar(p);
    await p.locator('[data-busca-catalogo]').fill('Golpe Especial');
    await p.getByRole('button', { name: 'Ativar Golpe Especial', exact: true }).click();
    for (const id of ['amplo', 'atroz', 'impactante', 'longo', 'penetrante', 'preciso', 'sacrificio']) {
      await p.locator(`[data-golpe="${id}"]`).click();
    }
    const antes = await sessao(p, f.id);
    const botao = p.locator('[data-preparo-golpe] [data-confirmar]');
    check('Confirmação liberada para sete propriedades', !(await botao.isDisabled()));
    await botao.scrollIntoViewIfNeeded();
    check('Ponteiro chega ao botão', (await noTopo(p, '[data-preparo-golpe] [data-confirmar]'))?.ok);
    const overflow = await estouro(p);
    check('Sem vazamento no montador denso', overflow.pagina <= 1 && overflow.raiz <= 1 && overflow.culpados.length === 0, overflow);
    await foto(p, `codex-golpe-denso-${largura}`);
    if (largura === 1024) { await botao.focus(); await p.keyboard.press('Enter'); }
    else await botao.click();
    await p.locator('[data-chave-ativo="especializacao:cmb_golpe_especial"]').waitFor();
    const depois = await sessao(p, f.id);
    check('Só um golpe gravado', (depois.operacoes?.reusos?.['especializacao:cmb_golpe_especial'] ?? 0) === (antes.operacoes?.reusos?.['especializacao:cmb_golpe_especial'] ?? 0) + 1, { antes: antes.operacoes?.reusos, depois: depois.operacoes?.reusos });
    check('Sete propriedades no cartão', /7 Propriedades/.test(await p.locator('[data-chave-ativo="especializacao:cmb_golpe_especial"]').textContent()));
    check('Houve pagamento de PE', depois.peAtual < antes.peAtual || JSON.stringify(depois.peTempFontes) !== JSON.stringify(antes.peTempFontes), { antes: antes.peAtual, depois: depois.peAtual });
    const snapshot = JSON.stringify(depois);
    await p.locator('[data-chave-ativo="especializacao:cmb_golpe_especial"]').click();
    await espera(p, 500);
    check('Consultar depois de confirmar não aplica outra vez', JSON.stringify(await sessao(p, f.id)) === snapshot);
  } finally { await ctx.close(); }
}

await encerra();
