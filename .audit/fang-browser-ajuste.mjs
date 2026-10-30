import fs from 'node:fs';
let s=fs.readFileSync('.audit/fang-browser.mjs','utf8');s=s.replace("console.log((await page.getByRole('button').allTextContents()).slice(0,35));", "await page.getByRole('tab',{name:'Buffs',exact:true}).click();");fs.writeFileSync('.audit/fang-browser.mjs',s);
