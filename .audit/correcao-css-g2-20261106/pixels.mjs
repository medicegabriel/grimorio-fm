import {chromium} from 'playwright';import fs from 'node:fs';
const dir=new URL('.',import.meta.url),nav=await chromium.launch({channel:'chrome'}),p=await nav.newPage(),out=[];
for(const a of fs.readdirSync(dir).filter(f=>f.endsWith('-5344.png'))){
 const b=a.replace('-5344.png','-5345.png');
 const r=await p.evaluate(async([a,b])=>{
  const carrega=s=>new Promise(ok=>{const i=new Image();i.onload=()=>ok(i);i.src='data:image/png;base64,'+s});
  const [ia,ib]=await Promise.all([carrega(a),carrega(b)]);
  const le=i=>{const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const g=c.getContext('2d');g.drawImage(i,0,0);return g.getImageData(0,0,c.width,c.height).data};
  const A=le(ia),B=le(ib);let n=0,x0=ia.width,y0=ia.height,x1=0,y1=0;
  for(let i=0;i<A.length;i+=4)if(A[i]!==B[i]||A[i+1]!==B[i+1]||A[i+2]!==B[i+2]){n++;let x=i/4%ia.width,y=Math.floor(i/4/ia.width);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
  return{pixels:n,total:ia.width*ia.height,caixa:n?[x0,y0,x1,y1]:null};
 },[fs.readFileSync(new URL(a,dir)).toString('base64'),fs.readFileSync(new URL(b,dir)).toString('base64')]);
 out.push({caso:a.replace('-5344.png',''),...r});console.log(`${out.at(-1).caso}: ${r.pixels} px`);
}
fs.writeFileSync(new URL('pixels.json',dir),JSON.stringify(out,null,2));await nav.close();
