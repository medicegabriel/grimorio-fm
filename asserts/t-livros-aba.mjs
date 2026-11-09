/* ABA DOS LIVROS NO CELULAR, 2026-11-08.

   O botão flutuante dos Livros (`PdfFab`, em `src/components/`, somente-leitura)
   cobria o bônus da perícia, o custo de PE e o Crítico na borda direita. O
   conserto mora no `ficha.css` e se pendura no `aria-label` do botão, porque o
   componente não tem classe própria.

   Este arquivo lê os dois como TEXTO e recusa o rótulo mudar sem a regra
   acompanhar. Se mudar, a regra deixa de casar calada e o botão volta a cobrir
   valores. Não prova pixel. */
import { readFileSync } from "node:fs";

const lê = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const CSS = lê("../src/systems/afty/ficha/ficha.css");
const FAB = lê("../src/components/PdfFab.jsx");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

t("o botão ainda se chama '... documentos'", /aria-label=\{open \? "Fechar documentos" : "Abrir documentos"\}/.test(FAB), true);
t("o botão ainda diz se está aberto", FAB.includes("aria-expanded={open}"), true);
t("a regra mira o rótulo", CSS.includes('button[aria-label$=" documentos"][aria-expanded="false"]'), true);
t("a regra recolhe só fechado e só no celular", CSS.includes("transform: translateX(1rem)") && CSS.includes("@media (max-width: 640px)"), true);
t("a G2 fica de fora", CSS.includes(':not([data-afty-estrutura="g2"])'), true);
t("o CSS aponta para este assert", CSS.includes("t-livros-aba"), true);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
