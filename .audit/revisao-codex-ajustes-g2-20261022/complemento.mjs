import fs from 'node:fs';
import { chromium } from 'playwright';
import { navegador, abre, aba, passo, check, foto, encerra, espera, etapa, sessaoGravada } from './lib.mjs';
const esperados = JSON.parse(fs.readFileSync(new URL('raio-negro-esperados.json', import.meta.url), 'utf8'));
const normaliza = x => x.replace(/\s/g, '');
const semCarimbo = s => JSON.stringify({ ...s, atualizadoEm: 0 });
const mede = p => p.locator('[data-m-secao="dano"]').evaluate(sec => {
  const rect = e => { const r=e.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height,b:r.bottom}; };
  return { largura:sec.getBoundingClientRect().width, pagina:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    linhas:[...sec.querySelectorAll('.m-linha')].map(e=>({id:e.dataset.mLinha, nome:e.querySelector('.m-nome').textContent,
      linha:rect(e), titulo:rect(e.querySelector('.m-linha-nome')), metas:rect(e.querySelector('.m-metas')),
      acerto:rect(e.querySelector('.m-acoes>.m-rolar')), dano:rect(e.querySelector('.m-rolar-dano')),
      formula:e.querySelector('.m-rolar-dano .m-rolar-num').textContent,
      cortados:[...e.querySelectorAll('.m-nome,.m-meta,.m-rolar-num')].filter(n=>n.scrollWidth>n.clientWidth+1 || n.scrollHeight>n.clientHeight+1).map(n=>n.textContent)
    }))};
});
const comBarra = await chromium.launch({channel:'chrome',ignoreDefaultArgs:['--hide-scrollbars']});
for (const c of [{w:768,h:1024,painel:true},{w:390,h:844,toque:true},{w:1024,h:768,painel:true},{w:1280,h:800,painel:true},{w:2560,h:1440}]) {
  passo(`Raio Negro sintético ${c.w}${c.painel?'-compacta':''}`);
  const ctx=await comBarra.newContext({viewport:{width:c.w,height:c.h},hasTouch:!!c.toque,isMobile:!!c.toque});
  const p=await ctx.newPage();
  p.on('pageerror',e=>etapa.erros.push(e.message));
  await p.route('**/*',rt=>new URL(rt.request().url()).hostname==='127.0.0.1'?rt.continue():rt.abort());
  await p.goto('http://127.0.0.1:5331/?ficha=arsenal&tema=escuro');
  const sec=p.locator('[data-m-secao="dano"]');
  await sec.waitFor();
  if(c.painel) await p.locator('button.f-acesso[aria-controls="g-painel"]').click();
  await p.locator('.m-indice-item').filter({hasText:/^Dano/}).click();
  await espera(p,700);
  await sec.getByRole('radio',{name:'Raio Negro',exact:true}).click();
  await espera(p,200);
  const m=await mede(p); etapa.medidas=m;
  check('as cinco fórmulas exibidas são as do motor vigente', m.linhas.length===5 && m.linhas.every(l=>normaliza(l.formula)===normaliza(esperados.linhas.find(e=>`dano:${e.id}`===l.id).formula)));
  check('Acerto e Dano dividem as colunas entre todas as armas', ['acerto','dano'].every(k=>Math.max(...m.linhas.map(l=>l[k].x))-Math.min(...m.linhas.map(l=>l[k].x))<1));
  check('o arranjo da seção é o mesmo para as cinco armas', new Set(m.linhas.map(l=>l.dano.y>=l.metas.b-1?'abaixo':'lado')).size===1);
  check('nomes, metas e fórmulas completos, sem estouro',m.pagina===0 && m.linhas.every(l=>l.cortados.length===0),m);
  check('alvos mantêm o mínimo da modalidade',m.linhas.every(l=>l.acerto.h>=(c.toque?40:34) && l.dano.h>=(c.toque?40:34)));
  if(c.w===768) check('a coluna de 331 px foi realmente exercitada',m.largura===331,m.largura);
  await foto(p,`rn-${c.w}${c.painel?'-compacta':''}`);
  check('sem erro de página',etapa.erros.length===0,etapa.erros);
  await ctx.close();
}
await comBarra.close();

passo('Foco, fontes e callbacks atuais depois de reter as três abas');
const {ctx,p}=await abre({ficha:'arsenal',sorte:0.5});
await aba(p,'pericias');
await p.getByRole('radio',{name:/^Mestre/}).click();
await p.getByRole('searchbox',{name:'Buscar perícia pelo nome ou atributo'}).fill('zzzz');
await aba(p,'equipamentos');
await p.locator('.afty-log-modo[data-afty-modo="desvantagem"]').click();
const antes=await sessaoGravada(p,'arsenal');
await p.keyboard.press('Control+k');
await p.locator('.afty-busca input').fill('Concentração');
await p.locator('.afty-busca-item').filter({hasText:'Concentração'}).filter({hasText:'Manobras'}).click();
await espera(p,800);
check('buscar com filtro vazio não grava nem rola',semCarimbo(await sessaoGravada(p,'arsenal'))===semCarimbo(antes));
check('o filtro Mestre e o texto local foram retidos',await p.getByRole('searchbox',{name:'Buscar perícia pelo nome ou atributo'}).inputValue()==='zzzz' && await p.getByRole('radio',{name:/^Mestre/}).getAttribute('aria-checked')==='true');
const cartao=p.locator('[data-m-linha="manobra:concentracao"]');
await cartao.locator('button.afty-rolavel').click();
const atual=await sessaoGravada(p,'arsenal');
check('um clique usa a Desvantagem selecionada enquanto a aba estava oculta',atual.log.length===antes.log.length+1 && atual.log[0].modo==='desvantagem',atual.log[0]);
await cartao.locator('button.afty-rolavel').press('Tab');
await p.keyboard.press('Shift+Tab');
await espera(p,400);
check('fontes abrem pelo foco no cartão movido',await p.locator('.afty-fontes-flutuante').count()===1);
await p.keyboard.press('1');
await espera(p,350);
const oculto=await p.evaluate(()=>({foco:document.activeElement?.dataset.aftyAba,hidden:document.querySelector('[data-aba-g2="pericias"]').hidden,inert:document.querySelector('[data-aba-g2="pericias"]').hasAttribute('inert'),fontes:document.querySelectorAll('.afty-fontes-flutuante').length,ancoras:document.querySelectorAll('[id^="afty-item-manobra:"]').length,acoes:document.querySelectorAll('[data-aba-g2="acoes"] [id^="afty-item-manobra:"]').length}));
etapa.medidas.oculto=oculto;
check('foco saiu da aba oculta e fontes fecharam',oculto.foco==='acoes' && oculto.hidden && oculto.inert && oculto.fontes===0,oculto);
check('oito âncoras únicas, nenhuma em Ações',oculto.ancoras===8 && oculto.acoes===0,oculto);
await p.locator('.afty-log-modo[data-afty-modo="vantagem"]').click();
await p.keyboard.press('Control+k');
await p.locator('.afty-busca input').fill('Agarrar');
await p.locator('.afty-busca-item').filter({hasText:'Agarrar'}).filter({hasText:'Manobras'}).click();
await espera(p,700);
const agarrar=p.locator('[data-m-linha="manobra:agarrar"]');
await agarrar.locator('button.afty-rolavel').nth(1).click();
const fim=await sessaoGravada(p,'arsenal');
check('Resistir usa a Vantagem atual no retorno, uma única vez',fim.log.length===atual.log.length+1 && fim.log[0].modo==='vantagem',fim.log[0]);
await foto(p,'callback-retorno-pericias');
check('sem erro de página',etapa.erros.length===0,etapa.erros);
await ctx.close();
await encerra('complemento');
