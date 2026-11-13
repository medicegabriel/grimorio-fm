import { register } from "node:module";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const R = new URL("../../src/systems/afty/", import.meta.url);
const { deriveAfty } = await import(new URL("afty-derive.js", R));
const { createBlankAfty } = await import(new URL("afty-schema.js", R));
const { aplicarAddons } = await import(new URL("afty-addons.js", R));
const { criarEncontro, criarCombatente, definirIniciativa } = await import(new URL("encontros/afty-encontro.js", R));
aplicarAddons([]);

function ficha(sistema, nome, desafia = false) {
 const c = createBlankAfty(); c.id = nome; c.name = nome; c.rulesVersion = sistema; c.core.nd = 12; c.attrMethod = "fixos";
 c.attributes = { forca: 13, destreza: 12, constituicao: 13, inteligencia: 8, sabedoria: 12, presenca: 15 };
 c.core.origem = { id: "inato", bonusAtributos: { presenca: 2, forca: 1 } }; c.core.atributosBonus = { presenca: 2 };
 c.especializacoes = [{ id: "combatente", nivel: 12 }]; c.pericias = { intimidacao: "treinado", intuicao: "treinado" };
 c.habilidadesGerais = sistema === "afty" ? ["ger_especializacao"] : [];
 c.talentos = desafia ? ["tal_provocacao_desafiadora"] : [];
 return c;
}

const browser = await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] });
const resultados = [];
try {
 for (const sistema of ["player", "afty"]) for (const largura of [1440, 390]) {
  const c = ficha(sistema, "CX3 Desafiante", true), a = ficha(sistema, "CX3 Provocado"), b = ficha(sistema, "CX3 Terceiro");
  const encontro = criarEncontro({ nome: "CX3 Provocar na Mesa" });
  encontro.combatentes = [c,a,b].map((f,i) => definirIniciativa(criarCombatente(f, { derived: deriveAfty(f) }),30-i*10));
  const [idC,idA,idB] = encontro.combatentes.map(x => x.id);
  const ctx = await browser.newContext({ viewport: { width: largura, height: 1000 }, isMobile: largura === 390, hasTouch: largura === 390 });
  await ctx.addInitScript(({ sistema,c,encontro }) => {
   if (localStorage.getItem("cx3-provocar")) return;
   localStorage.setItem("cx3-provocar","1");
   localStorage.setItem("fm_creatures_"+sistema+"_v1",JSON.stringify([c]));
   localStorage.setItem("afty_encontros_v1",JSON.stringify([encontro]));
  }, { sistema,c,encontro });
  const page = await ctx.newPage(), erros = [];
  page.setDefaultTimeout(8000);
  page.on("pageerror", e => erros.push(e.message));
  const abrir = async () => {
   await page.getByRole("button",{name:"Encontros",exact:true}).click();
   await page.getByText(encontro.nome,{exact:true}).click();
  };
  const focar = async nome => {
   if (largura === 390) await page.getByRole("button",{name:"Iniciativa",exact:true}).click();
   await page.getByText(nome,{exact:true}).filter({visible:true}).first().click();
  };
  const avancar = () => page.getByRole("button",{name:"Próximo Turno",exact:true}).click();
  const acoes = () => page.getByRole("tab",{name:"Ações",exact:true}).click();
  const le = () => page.evaluate(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0]);
  const vicia = async (el, numeros) => {
   await page.evaluate(ns => {
    globalThis.cx3Random = Math.random;
    let i = 0;
    Math.random = () => ns[Math.min(i++,ns.length-1)];
   }, numeros);
   try { await el.click(); } finally { await page.evaluate(() => { Math.random = globalThis.cx3Random; delete globalThis.cx3Random; }); }
  };

  await page.goto("http://127.0.0.1:5193/"+sistema,{waitUntil:"networkidle"});
  await abrir(); await page.getByRole("button",{name:"Começar",exact:true}).click(); await focar(c.name); await acoes();
  const quota = Math.floor(deriveAfty(c).mods.presenca / 2);
  assert.ok(quota > 0);
  const livre = page.getByRole("checkbox",{name:"Ação Livre ("+quota+"/"+quota+")",exact:true});
  await livre.check();
  await page.getByRole("combobox",{name:"Alvo de Provocar",exact:true}).selectOption(idA);
  await page.getByRole("spinbutton",{name:"Distância para Provocar",exact:true}).fill("9");
  await vicia(page.getByRole("button",{name:"Rolar Provocar",exact:true}),[0.999,0]);
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[0].sessao.log.some(r => r.contextoConteudo?.tipo === "provocar"));
  const antes = (await le()).combatentes[0].sessao;
  assert.equal(antes.uso.acoes.gastas.comum,0);
  assert.equal(antes.usos["longo:tal_provocacao_desafiadora"],1);
  await page.reload({waitUntil:"networkidle"}); await abrir(); await focar(c.name); await acoes();
  await page.getByRole("button",{name:"Concluir Provocação",exact:true}).click();
  await page.waitForFunction(() => Object.values(JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[1].sessao.uso.ativos).some(a=>a.origem==="provocar"));

  await avancar(); await focar(a.name); await acoes();
  const alvoAtaque = page.getByRole("combobox",{name:"Alvo Antes de Rolar Ataque",exact:true});
  const obrigacao = page.getByText("Ataque Pendente Contra "+c.name,{exact:true});
  await obrigacao.waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await alvoAtaque.scrollIntoViewIfNeeded();
  await page.screenshot({path:".audit/cx3-20261102/"+sistema+"-"+largura+"-provocar-encontro.png"});
  const linha = deriveAfty(a).dano.entradas.find(l=>l.fonte==="basico");
  const acerto = page.locator('[id="afty-item-dano:'+linha.id+'"]').getByRole("button",{name:"+"+linha.acerto,exact:true});
  await acerto.click();
  await page.getByRole("alert").filter({hasText:"Selecione o Alvo Antes de Rolar"}).waitFor();
  const modos = [];
  for (const id of [idB,idC]) {
   await alvoAtaque.selectOption(id);
   await vicia(acerto,[0,0]);
   await page.waitForFunction(n => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[1].sessao.log.filter(r=>r.tipoTeste==="ataque").length===n,modos.length+1);
   const s = (await le()).combatentes[1].sessao, ata = s.log.find(r=>r.tipoTeste==="ataque");
   assert.equal(ata.d20.length,2);
   modos.push(ata.modo);
   await page.getByRole("combobox",{name:"Ataque a Confirmar"}).selectOption(ata.id);
   const bound = page.getByRole("combobox",{name:"Alvo do Ataque",exact:true});
   assert.equal(await bound.inputValue(),id);
   assert.equal(await bound.isDisabled(),true);
   await page.getByRole("button",{name:"Confirmar Ataque e Aplicar Dano",exact:true}).click();
   await page.waitForFunction(id => JSON.parse(localStorage.getItem("afty_encontros_v1"))[0].combatentes[1].sessao.log.some(r=>r.ataqueId===id && r.ataque?.acertou===false),ata.id);
   if (id === idB) await obrigacao.waitFor();
   else await obrigacao.waitFor({state:"hidden"});
  }
  assert.deepEqual(modos,["desvantagem","vantagem"]);
  await avancar();
  assert.equal((await le()).ativoId,idB);
  assert.ok((await le()).combatentes[1].sessao.uso.ativos["provocar:"+idC]);
  await avancar();
  assert.equal((await le()).ativoId,idC);
  assert.equal((await le()).combatentes[1].sessao.uso.ativos["provocar:"+idC],undefined);
  assert.deepEqual(erros,[]);
  resultados.push({sistema,largura,recarga:true,modos,prazo:true,obrigacao:true});
  console.log(sistema,largura,"Provocar OK");
  await ctx.close();
 }
} finally {
 await writeFile(new URL("browser-provocar-resultados.json",import.meta.url),JSON.stringify(resultados,null,2));
 await browser.close();
}
