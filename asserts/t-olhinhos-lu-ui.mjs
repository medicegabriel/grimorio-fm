import { register } from "node:module";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
register('data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(".")&&!s.endsWith(".js"))return n(s+".js",c);throw e}}', import.meta.url);
globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { createBlankAfty } = await import("../src/systems/afty/afty-schema.js");
const { deriveAfty } = await import("../src/systems/afty/afty-derive.js");
const { aplicarAddons, normalizarPacote } = await import("../src/systems/afty/afty-addons.js");
const { ESTADO_OLHOS_LU, ESTADO_ATENCAO_LU } = await import("../src/systems/afty/afty-olhinhos-lu.js");
const pacote = normalizarPacote(JSON.parse(readFileSync(new URL("../addons/olhinhos-lu.json", import.meta.url))));
let checks = 0;
const ok = (v) => { assert.ok(v); checks++; };
const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
try {
  const { default: Card } = await server.ssrLoadModule("/src/systems/afty/ui/OlhinhosLuCard.jsx");
  const { default: Painel } = await server.ssrLoadModule("/src/systems/afty/ficha/PainelOlhinhosLu.jsx");
  const { default: Acoes } = await server.ssrLoadModule("/src/systems/afty/ficha/abas/AbaAcoes.jsx");
  for (const sistema of ["afty", "player"]) {
    const f = createBlankAfty();
    f.rulesVersion = sistema;
    f.core.nd = 20;
    f.aptidoes.cl = 3;
    f.addons = [pacote];
    aplicarAddons(f.addons);
    for (const fechados of [false, true]) {
      f.combate = { ativo: false, [ESTADO_OLHOS_LU]: fechados, [ESTADO_ATENCAO_LU]: true };
      const derived = deriveAfty(f);
      const painel = React.createElement(Painel, { derived, onSessao: () => {} });
      const card = renderToStaticMarkup(React.createElement(Card, { olhinhos: derived.olhinhosLu }));
      ok(card.includes(fechados ? "Olhos fechados" : "Olhos abertos"));
      ok(card.includes(fechados ? "+9" : "+0"));
      const html = renderToStaticMarkup(React.createElement(Acoes, {
        derived, olhinhosLu: painel, abertos: new Set(), rolar: () => {},
      }));
      ok((html.match(/data-afty-painel="olhinhos-lu"/g) ?? []).length === 1);
      ok(html.includes("Atenção com Intuição"));
      ok(html.includes(`Atenção ${derived.atencao}`));
      ok(/disabled=""[^>]*aria-pressed="false"[^>]*>Atenção com Intuição/.test(html) === !fechados);
      ok(!html.includes("Recursos de Origem"));
    }
    f.addons = [];
    aplicarAddons([]);
    const derived = deriveAfty(f);
    ok(renderToStaticMarkup(React.createElement(Card, { olhinhos: derived.olhinhosLu })) === "");
    ok(renderToStaticMarkup(React.createElement(Painel, { derived })) === "");
  }
} finally {
  await server.close();
}
console.log(`TODOS OS ${checks} ASSERTS PASSARAM`);
