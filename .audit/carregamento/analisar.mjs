/* Lê medicoes/<rotulo>.json e imprime a cascata de um cenário (a corrida mediana pelo LCP). */
import { readFileSync } from "node:fs";
const [rotulo, cenario, modo = "cascata"] = process.argv.slice(2);
if (!/^[a-zA-Z0-9_-]+$/.test(rotulo ?? "") || !cenario) {
  throw new Error("Uso: node analisar.mjs <rotulo> <cenario:perfil> [resumo|cascata]");
}
const j = JSON.parse(readFileSync(new URL(`./medicoes/${rotulo}.json`, import.meta.url)));
if (!Array.isArray(j[cenario])) throw new Error(`Cenário ausente na medição: ${cenario}.`);
const corridas = j[cenario].filter((r) => !r.erro);
if (!corridas.length) throw new Error(`Nenhuma corrida concluída em ${cenario}.`);
corridas.sort((a, b) => (a.lcp?.t ?? 0) - (b.lcp?.t ?? 0));
const r = corridas[Math.floor(corridas.length / 2)];
if (modo === "resumo") {
  console.log(JSON.stringify({ ttfb: r.ttfb, dcl: r.dcl, load: r.load, pinturas: r.pinturas, lcp: r.lcp, lcps: r.lcps, cls: r.cls, desl: r.deslocamentos,
    marcas: r.marcas, root: r.rootVazioAte, carregando: [r.carregandoVisto, r.carregandoSaiu], tarefas: r.tarefas, caixas: r.caixas,
    fundo: [r.htmlFundo, r.bodyFundo], clique: r.cliqueAteOrigem, nuvem: r.pedidosNuvem, nuvem1: r.pedidosNuvemPrimeira, retrato: r.chavesRetrato,
    depois: r.depoisDe10s, quadros: r.quadros?.slice(0, 40) }, null, 1));
} else {
  /* Níveis: um pedido está no nível N+1 se começa depois que algum pedido do nível N terminou. */
  const rs = [...r.recursos].sort((a, b) => a.ini - b.ini);
  const niveis = [];
  for (const x of rs) {
    let n = 0;
    for (let k = 0; k < niveis.length; k++) if (niveis[k].some((y) => y.fim <= x.ini + 2)) n = k + 1;
    (niveis[n] ??= []).push(x);
  }
  console.log(`doc: ttfb ${r.ttfb} fim ${r.docFim}`);
  niveis.forEach((nv, i) => {
    const kb = Math.round(nv.reduce((a, x) => a + (x.transf || 0), 0) / 1024);
    const ini = Math.min(...nv.map((x) => x.ini)); const fim = Math.max(...nv.map((x) => x.fim));
    const grandes = nv.filter((x) => x.transf > 4000 || x.corpo > 40000).map((x) => `${x.nome.split("/").pop().slice(0, 34)}(${Math.round(x.transf / 1024)}k/${Math.round(x.corpo / 1024)}k)`);
    console.log(`nível ${i + 1}: ${nv.length} pedidos, ${kb} KB, ${ini}..${fim} ms  ${grandes.join(" ")}`);
  });
  const total = rs.reduce((a, x) => a + (x.transf || 0), 0);
  const corpo = rs.reduce((a, x) => a + (x.corpo || 0), 0);
  console.log(`total: ${rs.length} pedidos, ${Math.round(total / 1024)} KB na rede, ${Math.round(corpo / 1024)} KB descomprimidos`);
}
