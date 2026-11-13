import fs from 'node:fs';
const de=new URL('../revisao-claude-g2-css-20261105/',import.meta.url),para=new URL('.',import.meta.url);
fs.mkdirSync(new URL('capturas/',para),{recursive:true});fs.mkdirSync(new URL('base/',para),{recursive:true});
for(const nome of ['persistencia.mjs','isolamento.mjs','lacunas-app.mjs']) {
 let s=fs.readFileSync(new URL(nome,de),'utf8').replaceAll('5343','5346');
 if(nome==='isolamento.mjs')s=s.replaceAll('5342','5345');
 if(nome==='persistencia.mjs')s=s.replace('  await p.locator(\'.afty-busca button[aria-label="Fechar"]\').click().catch(() => {});','');
 if(nome==='persistencia.mjs')s=s
   .replaceAll('u.hostname === "127.0.0.1"','(u.hostname === "127.0.0.1" && !u.pathname.startsWith("/_vercel/"))')
   .replaceAll('new URL(rt.request().url()).hostname === "127.0.0.1"','(new URL(rt.request().url()).hostname === "127.0.0.1" && !new URL(rt.request().url()).pathname.startsWith("/_vercel/"))');
 fs.writeFileSync(new URL(nome,para),s);
}
fs.writeFileSync(new URL('fechamento-dependencias.mjs',para),fs.readFileSync(new URL('fechamento-dependencias.mjs',de)));
for(const nome of ['layout.mjs','interacao-abas.mjs','mesa.mjs','lib.mjs']) {
 let s=fs.readFileSync(new URL('../mesa-unificada-g2-20261022/'+nome,import.meta.url),'utf8').replaceAll('5330','5345');
 if(nome==='lib.mjs')s=s.replace('await chromium.launch({ channel: "chrome" })','await chromium.launch({ channel: "chrome", ignoreDefaultArgs: ["--hide-scrollbars"] })');
 fs.writeFileSync(new URL(nome,para),s);
}
