import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const base='http://127.0.0.1:5198';
const out='.audit/barra-dados-shots';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'});
const report=[];
let current;
try {
  for (const route of ['Afty','Player']) {
    for (const [width,height] of [[320,568],[390,900],[640,360],[641,900],[1024,900],[1440,900]]) {
      const context=await browser.newContext({viewport:{width,height},hasTouch:width<=640});
      const page=await context.newPage();current=page;page.setDefaultTimeout(10000);
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(base+'/'+route);
      await page.evaluate(async system=>{
        const {createBlankAfty}=await import('/src/systems/afty/afty-schema.js');
        const {rolarTeste}=await import('/src/systems/afty/ficha/ficha-rolagem.js');
        const creature={...createBlankAfty(),id:'teste-barra-dados',name:'Teste da barra',rulesVersion:system,
          aparencia:{ligado:true,css:'.afty-log-modo { letter-spacing: 0.04em; }'}};
        localStorage.setItem('fm_creatures_'+system+'_v1',JSON.stringify([creature]));
        localStorage.setItem('fm_ficha_sessao_afty_v1:teste-barra-dados',JSON.stringify({log:Array.from({length:30},()=>rolarTeste({rotulo:'Teste de Força',bonus:4},()=>0.55))}));
      },route.toLowerCase());
      await page.reload();
      await page.getByText('Teste da barra',{exact:true}).first().click();
      const bar=page.locator('.afty-log');
      await bar.waitFor();
      assert.equal(await bar.evaluate(e=>e.closest('header')!==null),true);
      assert.equal(await page.getByRole('button',{name:'Desligar o CSS personalizado',exact:true}).count(),1);
      // A rolagem da página compacta o cabeçalho em telas baixas.
      await page.evaluate(()=>window.scrollTo(0,300));
      await page.waitForTimeout(1000);
      const geometry=await bar.evaluate(e=>{
        const rect=e.getBoundingClientRect();
        const tabs=document.querySelector('.afty-abas').getBoundingClientRect();
        const book=document.querySelector('[aria-label="Abrir documentos"]').getBoundingClientRect();
        const css=document.querySelector('[aria-label="Desligar o CSS personalizado"]').getBoundingClientRect();
        const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
        return {top:rect.top,bottom:rect.bottom,height:rect.height,underTabs:rect.top>=tabs.bottom-1,
          bookOverlap:overlap(rect,book),cssOverlap:overlap(rect,css),scroll:document.documentElement.scrollWidth>innerWidth,
          visibleControls:Array.from(e.querySelectorAll('button')).filter(b=>b.offsetWidth>0).every(b=>b.getBoundingClientRect().right<=innerWidth)};
      });
      assert.equal(geometry.underTabs,true);
      assert.equal(geometry.bookOverlap,false);
      assert.equal(geometry.cssOverlap,false);
      assert.equal(geometry.scroll,false);
      assert.equal(geometry.visibleControls,true);
      assert.ok(geometry.bottom<=height,JSON.stringify({route,width,height,geometry}));
      assert.equal(await page.locator('.afty-log-ultima .afty-rolagem-total').innerText(),'16');
      const headerBefore=await page.locator('.afty-cabecalho').boundingBox();
      await page.getByRole('button',{name:'Abrir o histórico',exact:true}).click();
      assert.equal(await page.locator('.afty-log-corpo .afty-rolagem').count(),30);
      const headerAfter=await page.locator('.afty-cabecalho').boundingBox();
      assert.ok(Math.abs(headerAfter.height-headerBefore.height)<1);
      assert.equal(await page.getByRole('button',{name:'Limpar o histórico',exact:true}).isVisible(),true);
      const popup=await page.locator('.afty-log-corpo').boundingBox();
      assert.ok(popup.y+popup.height<=height+1,JSON.stringify({route,width,height,popup}));
      await page.locator('.afty-log-corpo').evaluate(e=>e.scrollTo(0,e.scrollHeight));
      assert.ok(await page.locator('.afty-log-corpo').evaluate(e=>e.scrollTop>0));
      assert.equal(await page.locator('.afty-log-ultima .afty-rolagem-total').innerText(),'16');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.afty-log-corpo').isVisible(),false);
      assert.equal(await page.getByRole('button',{name:'Abrir o histórico',exact:true}).evaluate(e=>document.activeElement===e),true);
      await page.getByRole('button',{name:'Abrir o histórico',exact:true}).click();
      await page.getByRole('button',{name:'Abrir documentos',exact:true}).click();
      assert.equal(await page.locator('.afty-log-corpo').isVisible(),false);
      await page.getByRole('button',{name:'Fechar documentos',exact:true}).click();
      await page.getByRole('button',{name:'Vantagem',exact:true}).click();
      assert.equal(await page.getByRole('button',{name:'Vantagem',exact:true}).getAttribute('aria-pressed'),'true');
      await page.getByRole('button',{name:'Abrir o histórico',exact:true}).click();
      await page.getByRole('button',{name:'Limpar o histórico',exact:true}).click();
      assert.equal(await page.locator('.afty-log-corpo').isVisible(),false);
      assert.equal(await page.getByRole('button',{name:'Abrir o histórico',exact:true}).isDisabled(),true);
      assert.ok((await page.locator('.afty-log-ultima').innerText()).includes('Sem rolagens'));
      // Uma rolagem real repõe o resumo e mantém o modo selecionado.
      await page.locator('button.afty-rolavel').first().click();
      assert.equal(await page.locator('.afty-log-ultima .afty-rolagem').count(),1);
      assert.equal(await page.getByRole('button',{name:'Abrir o histórico',exact:true}).isEnabled(),true);
      assert.ok((await page.locator('.afty-log-ultima').innerText()).includes('Van'));
      await page.getByRole('button',{name:'Abrir o histórico',exact:true}).click();
      assert.equal(await page.locator('.afty-log-corpo .afty-rolagem').count(),1);
      if ([390,1440].includes(width)) await page.screenshot({path:out+'/'+route+'-'+width+'-historico.png'});
      await page.keyboard.press('Escape');
      if ([390,1440].includes(width)) await page.screenshot({path:out+'/'+route+'-'+width+'.png'});
      await page.getByRole('button',{name:'Desligar o CSS personalizado',exact:true}).click();
      assert.equal(await page.getByRole('button',{name:'Desligar o CSS personalizado',exact:true}).count(),0);
      assert.equal(await bar.isVisible(),true);
      assert.deepEqual(errors,[]);
      report.push({route,width,height,geometry,popup,passed:true});
      console.log('PASS',route,width,height);
      await context.close();
    }
  }
} catch(error) {
  await current?.screenshot({path:out+'/failure.png'});
  throw error;
} finally {
  await writeFile('.audit/barra-dados-report.json',JSON.stringify(report,null,2));
  await browser.close();
}
