/* A ocupação do cabeçalho em cada largura: a altura de cada parte e do todo, e se o nome foi cortado. */
import { fichas, sessoes, contexto, abre, passo, check, foto, encerra } from "./lib.mjs";
const larguras = (process.env.LARGURAS ?? "390,480,600,768,1024,1440").split(",").map(Number);
passo("cabeçalho");
const tab = [];
for (const k of (process.env.FICHAS ?? "ima,mestre,minamoto,player30").split(",")) {
  for (const largura of larguras) {
    const { ctx, p } = await contexto({ lista: [fichas[k]], largura, altura: largura < 500 ? 844 : 900, sessoesIniciais: sessoes });
    await abre(p, "player", fichas[k].name);
    const m = await p.evaluate(() => {
      const h = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().height) : null; };
      const nome = document.querySelector(".e-nome");
      return { total: h(".e-cabeca"), placa: h(".e-placa"), ident: h(".e-ident"), recursos: h(".e-recursos"), faixa: h(".e-faixa"), stats: h(".e-stats"), agora: h(".e-agora"), nome: h(".e-nome"), nomeCortado: nome ? nome.scrollWidth > nome.clientWidth + 1 : null, vh: innerHeight,
        medidores: document.querySelectorAll(".e-recursos .m-medidor").length,
        sangra: [...document.querySelectorAll("#afty-ficha .e-cabeca *")].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1); }).length };
    });
    tab.push({ k, largura, ...m, pct: Math.round((m.total / m.vh) * 100) });
    check(`${k}-${largura}-sem-sangria`, m.sangra === 0, m);
    if (process.env.FOTO) await foto(p, `cabeca-${k}-${largura}`);
    await ctx.close();
  }
}
console.log("k largura | total placa ident recursos faixa agora | meds | %vh");
for (const r of tab) console.log(`${r.k.padEnd(9)} ${String(r.largura).padStart(4)} | ${r.total} ${r.placa} ${r.ident} ${r.recursos} ${r.faixa} ${r.agora} | ${r.medidores} | ${r.pct}% ${r.nomeCortado ? "NOME CORTADO" : ""}`);
await encerra();
