/* ============================================================
   O PLUGIN DAS PORTAS DE PRÉ-CARGA (2026-11-26, fila "Carregamento")
   ============================================================
   Só no `vite build`. Lê o grafo de pedaços do build (o mesmo `grafoDoBundle` do service worker, só lido), monta as listas
   das portas (`portasDoGrafo`, em `portas-regras.js`) e as grava no `index.html` do `dist/` como um bloco de dados. Quem lê é
   `pre-carga.js`. No `npm run dev` não há bloco, e a pré-carga não faz nada.

   No `writeBundle`, e não no `transformIndexHtml`, pelo mesmo motivo do `sw-plugin.js`: antes dele ainda existem os pedaços só
   de CSS, que o Vite apaga depois, e a lista pediria um arquivo que não chega ao servidor.

   ⚠ O service worker do /EraDeOuro guarda a página pelo endereço, então o bloco viaja junto e o worker não precisa mudar
   (S-87 e S-88 de docs/normas-site.md).
   ============================================================ */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { grafoDoBundle } from "./sw-plugin.js";
import { htmlComPortas, portasDoGrafo, PORTAS_DE_PRE_CARGA } from "./portas-regras.js";

export function pluginDasPortas() {
  return {
    name: "fm-portas-de-pre-carga",
    apply: "build",
    writeBundle(opcoes, bundle) {
      const dir = opcoes.dir ?? "dist";
      const arquivoHtml = join(dir, "index.html");
      if (!existsSync(arquivoHtml)) return;
      const grafo = grafoDoBundle(bundle);
      const portas = portasDoGrafo(grafo);
      for (const porta of PORTAS_DE_PRE_CARGA) {
        if (!portas[porta.id]?.length) this.warn(`a porta "${porta.id}" saiu vazia: o módulo ${porta.modulo} não está no build`);
      }
      // Um arquivo listado que não existe viraria um 404 em toda abertura: aí o build para.
      const faltando = Object.values(portas).flat().filter((p) => !existsSync(join(dir, p.slice(1))));
      if (faltando.length) this.error(`as portas de pré-carga listam arquivos que não existem: ${faltando.join(", ")}`);
      // A Ficha sem o motor não adianta: avisa se o afty-derive saiu da porta (virou import() de dentro da Ficha, por exemplo).
      const comMotor = portas.ficha?.some((p) => (bundle[p.slice(1)]?.moduleIds ?? []).some((m) => /afty-derive\.js$/.test(String(m))));
      if (portas.ficha?.length && !comMotor) this.warn("a porta da Ficha não traz o afty-derive");
      if (portas.app?.length && !portas.app.some((p) => p.endsWith(".css"))) this.warn("a porta do App não traz CSS");
      if (!Object.values(grafo).some((no) => no.entrada)) this.warn("o build não tem entrada: as portas não descontam a abertura");
      writeFileSync(arquivoHtml, htmlComPortas(readFileSync(arquivoHtml, "utf8"), portas));
    },
  };
}
