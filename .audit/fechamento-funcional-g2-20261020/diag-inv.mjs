import { fichas, sessoes, contexto, abre, passo, espera, foto, encerra } from "./lib.mjs";
passo("inv");
const { p } = await contexto({ lista: [fichas.invocador], largura: 1440, altura: 900, sessoesIniciais: sessoes });
await abre(p, "player", fichas.invocador.name);
await p.locator('[data-afty-aba="invocacoes"]').click(); await espera(p, 600);
await foto(p, "inv-aba");
console.log(JSON.stringify(await p.evaluate(() => ({
  stats: [...document.querySelectorAll("#afty-painel [data-afty-stat]")].map((e) => e.getAttribute("data-afty-stat") + "=" + e.textContent.trim()),
  botoes: [...document.querySelectorAll("#afty-painel button")].slice(0, 25).map((b) => (b.textContent.trim().slice(0, 40)) + "|" + [...b.attributes].map((a) => a.name).filter((n) => n.startsWith("data-")).join(",")),
  linhas: [...document.querySelectorAll("#afty-painel [data-chave-inv], #afty-painel [data-inv]")].length,
})), null, 1));
await encerra();
