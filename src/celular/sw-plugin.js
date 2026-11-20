/* ============================================================
   O PLUGIN DO SERVICE WORKER (etapa E9 do app Era de Ouro, 2026-11-20)
   ============================================================
   Só no `vite build`. Lê o grafo de pedaços do build, monta a lista de pré-carga (`listaDePrecache`, em `sw-regras.js`), troca
   as marcas do `sw-modelo.js` e grava `sw.js` na raiz do `dist/`. Sem biblioteca nova.

   ⚠ O DESLIGAMENTO SEM QUEBRAR: um build com `VITE_SW_DESLIGADO=1` grava no lugar um `sw.js` que apaga os caches do app e se
   desregistra. O `/sw.js` nunca é apagado do site (um navegador que não acha o arquivo segue com o worker velho), e nunca se usa
   o cabeçalho `Clear-Site-Data: storage`, que apagaria as fichas do `localStorage`. Ver S-88 em `docs/normas-site.md`.
   ============================================================ */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { destinoDoPedido, listaDePrecache } from "./sw-regras.js";

export const SW_DESLIGADO = `/* Service worker do app Era de Ouro, DESLIGADO (VITE_SW_DESLIGADO=1). Apaga os caches do app e sai. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("message", (e) => { if (e.data?.tipo === "versao") e.ports?.[0]?.postMessage({ versao: "desligado" }); });
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => /^ouro-/.test(n)).map((n) => caches.delete(n))))
      .then(() => self.registration.unregister()),
  );
});
`;

/** O grafo do build, no formato que `listaDePrecache` lê, a partir do `bundle` do Rollup. */
export function grafoDoBundle(bundle) {
  const grafo = {};
  for (const [arquivo, item] of Object.entries(bundle)) {
    if (item.type !== "chunk") continue;
    grafo[arquivo] = {
      modulo: item.facadeModuleId ?? null,
      entrada: !!item.isEntry,
      imports: item.imports ?? [],
      dinamicos: item.dynamicImports ?? [],
      css: [...(item.viteMetadata?.importedCss ?? [])],
      arquivos: [...(item.viteMetadata?.importedAssets ?? [])],
    };
  }
  return grafo;
}

/** O texto do `sw.js` de uma versão. */
export function textoDoWorker({ modelo, versao, precache }) {
  return modelo
    .replace("__VERSAO__", versao)
    .replace("/*__PRECACHE__*/ []", JSON.stringify(precache))
    .replace(/\/\*__DESTINO__\*\/ \(\) => "ignorar"/, () => destinoDoPedido.toString());
}

export function pluginDoServiceWorker({ versao, desligado = false }) {
  return {
    name: "fm-service-worker",
    apply: "build",
    /* No `writeBundle`, e não no `generateBundle`: lá ainda existem os pedaços só de CSS, que o Vite apaga depois, e a lista
       pediria um arquivo que não chega ao servidor (e o `addAll` da instalação falharia inteiro). */
    writeBundle(opcoes, bundle) {
      const texto = desligado
        ? SW_DESLIGADO
        : textoDoWorker({
          modelo: readFileSync(new URL("./sw-modelo.js", import.meta.url), "utf8"),
          versao,
          precache: listaDePrecache(grafoDoBundle(bundle)),
        });
      writeFileSync(join(opcoes.dir ?? "dist", "sw.js"), texto);
    },
  };
}
