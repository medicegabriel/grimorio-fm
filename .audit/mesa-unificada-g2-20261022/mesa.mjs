import { chromium } from 'playwright';
import { abre, aba, passo, check, foto, encerra, espera, etapa, sessaoGravada, dados, navegador, DIR } from './lib.mjs';
const semCarimbo = s => JSON.stringify({...s, atualizadoEm: 0});
const barra = await chromium.launch({channel:'chrome', ignoreDefaultArgs:['--hide-scrollbars']});
const casos = [
  {ficha:'mesa',largura:1115,altura:1235},
  {ficha:'mesa',largura:1280,altura:800,painel:true},
  {ficha:'tipica',largura:1280,altura:800,painel:true},
  {ficha:'mesa',largura:768,altura:1024,painel:true},
  {ficha:'mesa',largura:390,altura:844,toque:true},
  {ficha:'mesa',largura:2560,altura:1440,painel:true},
];
for(const c of casos){
  passo(`Mesa ${c.ficha} ${c.largura}${c.painel?'-compacta':''}`);
  const {ctx,p}=await abre({...c,nav:barra});
  if(c.painel) await p.locator('button.f-acesso[aria-controls="g-painel"]').click();
  await espera(p,200);
  const m=await p.locator('.m-mesa').evaluate(el=>({
    largura:el.getBoundingClientRect().width,altura:el.getBoundingClientRect().height,
    pagina:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    itens:[...el.querySelectorAll('.m-celula')].map(e=>({id:e.dataset.mCelula,
      nome:e.querySelector('.m-celula-titulo').textContent,
      alvos:[...e.querySelectorAll('button')].map(b=>({nome:b.getAttribute('aria-label')||b.textContent,h:b.getBoundingClientRect().height})),
      cortados:[...e.querySelectorAll('.m-celula-titulo,.m-celula-estado')].filter(n=>n.scrollWidth>n.clientWidth+1).map(n=>n.textContent),
      sobreposto:(()=>{const a=e.querySelector('.m-celula-acao,.m-gatilhos');return !!a&&e.querySelector('.m-celula-nome').getBoundingClientRect().right>a.getBoundingClientRect().left;})()
    }))
  }));
  etapa.medidas=m;
  check('todos os nomes e estados completos, sem sobreposição dos controles',m.itens.length===(c.ficha==='mesa'?9:4)&&m.itens.every(e=>e.cortados.length===0&&!e.sobreposto),m.itens);
  check('sem estouro horizontal',m.pagina===0,m.pagina);
  check('áreas de toque com 40 px e áreas do ponteiro com 32 px ou mais',m.itens.every(e=>e.alvos.every(a=>a.h>=(c.toque?40:32))),m.itens.flatMap(e=>e.alvos));
  if(c.largura===768)check('a coluna útil tem realmente 331 px',m.largura===331,m.largura);
  if(c.ficha==='tipica'){
    const fundo=await p.locator('[data-m-secao="dano"] .m-linha').first().evaluate(el=>el.getBoundingClientRect().bottom);
    check('Dano continua inteiro na primeira tela de 800 px',fundo<=800,fundo);
  }
  await p.mouse.move(1,1);
  if(c.largura===1115)await p.locator('.m-mesa').screenshot({path:`${DIR}capturas/mesa-escuro.png`});
  else await foto(p,`mesa-${c.ficha}-${c.largura}${c.painel?'-compacta':''}`,{fullPage:c.toque});
  check('sem erro de página',etapa.erros.length===0,etapa.erros);
  await ctx.close();
}
await barra.close();

passo('Consultar, teclado e controles diretos');
{
  const {ctx,p}=await abre({ficha:'mesa'});
  const antes=await sessaoGravada(p,'mesa');
  const bf=p.locator('[data-m-celula="bloodfeast"] .m-celula-nome');
  await bf.focus(); await p.keyboard.press('Enter');
  const campo=p.locator('#m-corpo-bloodfeast input[aria-label="Ações"]');
  await campo.fill('3'); await bf.click(); await aba(p,'pericias'); await aba(p,'acoes'); await bf.click();
  check('nome acessível preservado e rascunho retido ao fechar e trocar de aba',await bf.getAttribute('aria-label')==='Bloodfeast'&&await campo.inputValue()==='3');
  await bf.click();
  check('consultar e editar o rascunho não altera a sessão',semCarimbo(await sessaoGravada(p,'mesa'))===semCarimbo(antes));
  for(const [id,inicial,alternativa,estado] of [
    ['vislumbre','Descobrir','Cobrir','Olhos Descobertos'],
    ['olhinhosLu','Fechar Olhos','Abrir Olhos','Olhos Fechados'],
    ['manipulacaoCeu','Ligar Aura','Desligar Aura','Aura 20%'],
  ]){
    const cel=p.locator(`[data-m-celula="${id}"]`);
    await cel.getByRole('button',{name:inicial,exact:true}).click();
    check(`${inicial}: o controle atualiza o estado visível`,(await cel.textContent()).includes(estado));
    await cel.getByRole('button',{name:alternativa,exact:true}).click();
    check(`${alternativa}: o controle retorna ao estado inicial`,await cel.getByRole('button',{name:inicial,exact:true}).isVisible());
  }
  const treino=p.locator('[data-m-celula="treinos"] button');
  await treino.click(); check('Treinos continua operável',await treino.getAttribute('aria-pressed')==='true'); await treino.click();
  const antesDoGolpe=await sessaoGravada(p,'mesa');
  await p.locator('[data-m-celula="golpe"]').getByRole('button',{name:'Montar Golpe',exact:true}).click();
  check('Golpe mantém a Preparação existente',await p.locator('[data-preparo-golpe]').isVisible());
  await p.locator('[data-voltar-preparo]').click();
  check('Voltar não aplica marcas nem cobra recurso',semCarimbo(await sessaoGravada(p,'mesa'))===semCarimbo(antesDoGolpe));
  await p.locator('button.e-combate').click();
  const aura=p.locator('[data-m-celula="manipulacaoCeu"] .m-celula-acao');
  check('fora de combate, Ligar Aura mantém a recusa do painel',!await aura.isEnabled()&&await aura.getAttribute('title')==='Disponível em combate');
  check('o estado continua associado ao nome para o teclado',await bf.getAttribute('aria-describedby')==='m-estado-bloodfeast');
  check('sem erro de página',etapa.erros.length===0,etapa.erros);
  await ctx.close();
}

passo('Pendência real na sessão sintética');
{
  const c=dados.fichas.mesa;
  const pacote=c.addons.find(a=>a.permite?.includes('adaptacao')&&a.adaptacoes?.length);
  const ciclo=pacote.adaptacoes[0],chave=`${pacote.id}:${ciclo.id}`;
  const seed=structuredClone(dados.sessoes[c.id]);
  seed.adaptacoes={[chave]:{giros:ciclo.intervalo??5,pendentes:1,narrativas:[]}};
  const {ctx,p}=await abre({ficha:'mesa',sessao:seed});
  const nome=p.locator('[data-m-celula="adaptacao"] .m-celula-nome');
  check('a pendência abre o painel completo automaticamente',await nome.getAttribute('aria-expanded')==='true'&&await p.locator('#m-corpo-adaptacao').isVisible());
  check('cabeçalho e entrada mostram o aviso',await p.locator('.m-mesa-topo .m-pendente').textContent()==='1 Pendente'&&(await p.locator('[data-m-celula="adaptacao"] .m-pendente').textContent()).includes('1'));
  const antes=await sessaoGravada(p,'mesa');
  await nome.click(); await aba(p,'pericias'); await aba(p,'acoes');
  check('fechar vale até surgir outra pendência, sem aplicar benefício',await nome.getAttribute('aria-expanded')==='false'&&semCarimbo(await sessaoGravada(p,'mesa'))===semCarimbo(antes));
  await p.locator('.m-mesa').screenshot({path:`${DIR}capturas/mesa-pendente.png`});
  check('sem erro de página',etapa.erros.length===0,etapa.erros);
  await ctx.close();
}
for(const tema of ['claro','minamoto','css']){
  passo(`Mesa no tema ${tema}`);
  const {ctx,p}=await abre({ficha:'mesa',tema,largura:1115,altura:1235});
  await p.mouse.move(1,1);
  await p.locator('.m-mesa').screenshot({path:`${DIR}capturas/mesa-${tema}.png`});
  check('os nove acessos permanecem visíveis',await p.locator('.m-celula:visible').count()===9);
  check('sem erro de página',etapa.erros.length===0,etapa.erros);
  await ctx.close();
}
await encerra('mesa');
