/* Lacunas apontadas pelo consultor, parte do executor (5341):
   L1 tabela da receita `.e-g2` (onde o prefixo vale, onde quebra, onde o elemento já é .e-g2)
   L2 imagem de fundo no G2 (camada, controles, data URI)
   L3 saneiaCss (@import e </style>)
   L4 S1 1280x800 com a compacta e a barra real, três temas
   L5 Esc na clássica
   L6 fixtures com invocações */
import { abre, aba, abas, passo, check, foto, encerra, espera, etapa, dados, CAPTURAS, DIR } from "./lib.mjs";
import fs from "node:fs";

const src = fs.readFileSync(new URL("../../src/systems/afty/ficha/ficha-tema.js", import.meta.url), "utf8");
const bloco = (n) => src.slice(src.indexOf(`export const ${n}`), src.indexOf("];", src.indexOf(`export const ${n}`)));
const contrato = [...bloco("CONTRATO_DE_CLASSES").matchAll(/seletor: "((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].replace(/\\"/g, '"'));
const attrs = [...bloco("ATRIBUTOS_DOC").matchAll(/seletor: "((?:[^"\\]|\\.)*)"/g)].map((m) => m[1].replace(/\\"/g, '"').replace(/=\\?"[^"]*"/, ""));
const seletores = [...new Set([...contrato, ...attrs])];

const abrirPainel = async (p) => { await p.locator('button[aria-label="Mais opções da ficha"]').click(); await espera(p, 200); await p.getByRole("menuitem", { name: "Aparência" }).click(); await p.locator(".afty-busca").waitFor(); await espera(p, 200); };

/* ---------- L1 ---------- */
passo("L1 tabela da receita .e-g2");
{
  const acum = {};
  const coleta = async (p) => {
    const r = await p.evaluate((seletores) => Object.fromEntries(seletores.map((s) => { try { return [s, [document.querySelectorAll(s).length, document.querySelectorAll(`.e-g2 ${s}`).length, document.querySelectorAll(`${s}.e-g2`).length]]; } catch { return [s, [0, 0, 0]]; } })), seletores);
    for (const [s, v] of Object.entries(r)) { const a = (acum[s] ??= [0, 0, 0]); for (let i = 0; i < 3; i++) a[i] = Math.max(a[i], v[i]); }
  };
  for (const ficha of ["mesa", "conjurador", "arsenal", "criatura"]) {
    const { ctx, p } = await abre({ ficha, query: "tema=escuro" });
    for (const a of await abas(p)) { await aba(p, a); await coleta(p); }
    await aba(p, "acoes"); await p.locator(".f-acesso").first().click(); await espera(p, 350); await coleta(p); await p.locator(".f-acesso").first().click();
    await p.locator('button[aria-label="Mais opções da ficha"]').click(); await espera(p, 250); await coleta(p);
    await p.keyboard.press("Escape");
    await abrirPainel(p); await coleta(p);
    await p.locator('.afty-busca button[aria-label="Fechar"]').click();
    await p.keyboard.press("Control+K"); await espera(p, 300); await coleta(p);
    await ctx.close();
  }
  const cls = { prefixa: [], mista: [], semPrefixo: [], mesmoElemento: [], ausente: [] };
  for (const [s, [plain, pref, same]] of Object.entries(acum)) {
    if (plain === 0) cls.ausente.push(s);
    else if (same > 0 && pref === 0) cls.mesmoElemento.push(s);
    else if (pref === plain) cls.prefixa.push(s);
    else if (pref === 0) cls.semPrefixo.push(s);
    else cls.mista.push(`${s} (${pref} de ${plain} sob .e-g2)`);
  }
  fs.writeFileSync(`${DIR}receita-tabela.json`, JSON.stringify({ acum, cls }, null, 2));
  etapa.medidas = Object.fromEntries(Object.entries(cls).map(([k, v]) => [k, v.length]));
  console.log(JSON.stringify(etapa.medidas));
  console.log("mesmoElemento:", cls.mesmoElemento.join(" "));
  console.log("semPrefixo:", cls.semPrefixo.join(" "));
  console.log("mista:", cls.mista.join(" | "));
  check("a tabela foi montada", Object.keys(acum).length > 100);
}

/* ---------- L2 ---------- */
passo("L2 imagem de fundo no G2");
{
  const { ctx, p } = await abre({ ficha: "mesa", query: "tema=escuro" });
  let pedidos = 0;
  await p.route("http://127.0.0.1:5341/fundo-teste.png", (r) => { pedidos++; r.fulfill({ contentType: "image/png", body: fs.readFileSync(`${CAPTURAS}vitrine-vitral-390-pericias.png`) }); });
  await abrirPainel(p);
  const campo = p.getByLabel("Endereço da imagem de fundo");
  await campo.fill("http://127.0.0.1:5341/fundo-teste.png"); await espera(p, 600);
  await p.locator(".afty-busca").getByRole("button", { name: "Caber" }).click();
  await p.locator('input[aria-label="Opacidade da imagem"]').fill("100"); await espera(p, 400);
  const m = await p.evaluate(() => {
    const raiz = document.getElementById("afty-ficha"); const cs = getComputedStyle(raiz);
    const vars = Object.fromEntries(["--afty-imagem", "--afty-imagem-opacidade", "--afty-imagem-opacidade-ambiente", "--afty-imagem-opacidade-banner", "--afty-imagem-encaixe"].map((k) => [k, cs.getPropertyValue(k).trim().slice(0, 60)]));
    const pinta = [];
    for (const e of [raiz, ...raiz.querySelectorAll("*")]) for (const ps of [null, "::before", "::after"]) { const c = getComputedStyle(e, ps); if (c.backgroundImage.includes("fundo-teste.png")) { const r = e.getBoundingClientRect(); pinta.push({ sel: `${e.tagName.toLowerCase()}${[...e.classList].slice(0, 3).map((x) => "." + x).join("")}${ps ?? ""}`, opac: c.opacity, tam: c.backgroundSize, w: Math.round(r.width), h: Math.round(r.height) }); } }
    return { vars, pinta: pinta.slice(0, 8) };
  });
  etapa.medidas = m; etapa.medidas.pedidos = pedidos;
  console.log(JSON.stringify(m));
  check("o endereço da imagem chega às variáveis do tema", /fundo-teste\.png/.test(m.vars["--afty-imagem"]) && m.vars["--afty-imagem-encaixe"] === "contain", m.vars);
  check("a imagem é pedida de verdade", pedidos >= 1, pedidos);
  check("alguma camada do G2 pinta a imagem", m.pinta.length > 0, m.pinta);
  const placa = await p.evaluate(() => { const e = document.querySelector(".e-cabeca"); return e ? getComputedStyle(e).backgroundImage.includes("fundo-teste.png") : null; });
  etapa.medidas.placaMostraAImagem = placa;
  await p.locator('.afty-busca button[aria-label="Fechar"]').click(); await espera(p, 300);
  await foto(p, "l2-imagem-de-fundo-g2");
  /* data URI: urlSegura tira `;` e espaços */
  await abrirPainel(p);
  await p.getByLabel("Endereço da imagem de fundo").fill("data:image/png;base64,AAAA"); await espera(p, 400);
  const v = await p.evaluate(() => getComputedStyle(document.getElementById("afty-ficha")).getPropertyValue("--afty-imagem").trim());
  etapa.medidas.dataUri = v;
  check("data URI não chega como data URI (o ponto e vírgula é removido)", !/^url\("data:image\/png;base64/.test(v), v);
  check("sem erro de página", etapa.erros.length === 0, etapa.erros);
  await ctx.close();
}

/* ---------- L3 ---------- */
passo("L3 saneiaCss no G2");
{
  const { ctx, p } = await abre({ ficha: "mesa", query: "tema=escuro" });
  await abrirPainel(p);
  await p.locator("textarea[aria-label='CSS personalizado']").fill('@import url("https://example.com/x.css");\n.e-g2 .afty-nome { color: #0f0; }\n</style><b id="xss">x</b>');
  await espera(p, 400);
  const r = await p.evaluate(() => ({ estilos: [...document.querySelectorAll("#afty-ficha > style")].map((s) => s.textContent), xss: !!document.getElementById("xss"), cor: getComputedStyle(document.querySelector(".afty-nome")).color }));
  etapa.medidas = { estilos: r.estilos.map((t) => t.length), xss: r.xss, cor: r.cor };
  check("@import some do <style> injetado", !r.estilos.some((t) => /@import/.test(t)), r.estilos.map((t) => t.slice(0, 80)));
  check("</style> não escapa para o HTML (nenhum <b id=xss>)", r.xss === false, r.xss);
  check("o resto do CSS continua valendo", r.cor === "rgb(0, 255, 0)", r.cor);
  await ctx.close();
}

/* ---------- L4 ---------- */
passo("L4 S1 1280x800 com a compacta e a barra real");
for (const [rotulo, query] of [["padrao", "tema=escuro"], ["vitral", "css=demo-vitral"], ["papel", "css=demo-papel"]]) {
  const { ctx, p } = await abre({ ficha: "tipica", query, largura: 1280, altura: 800 });
  const f = p.locator('button.f-acesso[aria-controls="g-painel"]');
  if (await f.count() && (await f.getAttribute("aria-pressed")) !== "true") { await f.click(); await espera(p, 400); }
  await aba(p, "acoes"); await p.evaluate(() => window.scrollTo(0, 0)); await espera(p, 250);
  const m = await p.evaluate(() => { const l = document.querySelector('[data-m-linha^="dano:"]'); const r = l?.getBoundingClientRect(); return { danoFundo: r ? Math.round(r.bottom) : null, janela: innerHeight, util: Math.round(document.querySelector("[data-m-aba]")?.getBoundingClientRect().width ?? 0), pagina: document.documentElement.scrollWidth - document.documentElement.clientWidth }; });
  etapa.medidas[rotulo] = m;
  console.log(`  ${rotulo}`, JSON.stringify(m));
  check(`${rotulo}: primeira linha de Dano dentro da primeira tela (${m.danoFundo} de ${m.janela})`, m.danoFundo != null && m.danoFundo <= m.janela, m);
  check(`${rotulo}: sem estouro horizontal`, m.pagina <= 0, m);
  await foto(p, `l4-s1-1280x800-${rotulo}`);
  await ctx.close();
}

/* ---------- L5 ---------- */
passo("L5 Esc e foco na clássica");
{
  const { ctx, p } = await abre({ ficha: "mesa", query: "tema=escuro&modo=classica" });
  await p.getByRole("button", { name: /Aparência/ }).first().click(); await p.locator(".afty-busca textarea[aria-label='CSS personalizado']").waitFor();
  await p.keyboard.press("Escape"); await espera(p, 300);
  const aberto = await p.locator(".afty-busca textarea[aria-label='CSS personalizado']").count();
  const role = await p.locator(".afty-busca").getAttribute("role");
  check("Esc fecha o painel de Aparência na clássica", aberto === 0, { aberto });
  check("o painel declara role=dialog na clássica", role === "dialog", role);
  await ctx.close();
}

/* ---------- L6 ---------- */
passo("L6 fixtures com invocações");
{
  const r = Object.fromEntries(Object.entries(dados.fichas).map(([k, f]) => [k, (f.invocacoes ?? []).length]));
  etapa.medidas = r;
  console.log(JSON.stringify(r));
  check("alguma fixture tem invocações (senão a aparência de invocação fica declarada como não testada)", Object.values(r).some((n) => n > 0), r);
}
await encerra("lacunas-executor");
