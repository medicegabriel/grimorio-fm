/* O ADDON `prodigio` (2026-10-12).

   Pedido do autor: *"Faça um Addon chamado Prodigio. Que concede +2 PV e PE
   (Pontos de Energia ou Pontos de Estamina a depender da Origem) por Nível."*

   Um Funcionamento do pacote com duas linhas, `hp` e `pe`, ambas 2 × ND. Não
   há canal de Estamina: o Restringido paga Estamina na mesma pilha do PE e a
   tela só troca o rótulo. Este arquivo prende:

     1. O pacote valida.
     2. PV e PE sobem exatamente 2 × Nível, nos dois sistemas, com Tipo comum
        e com Tipo Restringido (Estamina).
     3. Sem o addon, nada muda. */
import { register } from "node:module";
import { readFileSync } from "node:fs";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

globalThis.localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const AD = await import(R + "afty-addons.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const bruto = JSON.parse(readFileSync(new URL("../addons/prodigio.json", import.meta.url), "utf8"));
const pacote = AD.normalizarPacote(bruto);
t("o pacote valida sem problema nenhum", AD.validarPacote(pacote), []);
AD.aplicarAddons([pacote]);

const ficha = (nivel, { sistema, tipo, addon }) => {
  const f = createBlankAfty();
  f.rulesVersion = sistema;
  f.core = { ...f.core, nd: nivel, tipo, patamar: "comum" };
  /* No jogador quem tira a energia é a Especialização, não o Tipo. */
  if (sistema === "player" && tipo === "restringido") f.especializacoes = [{ id: "restringido", nivel: nivel }];
  if (addon) f.addons = [pacote];
  return f;
};
const pvpe = (d) => [d.hp, d.pe];

for (const sistema of ["player", "afty"]) {
  for (const tipo of ["misto", "restringido"]) {
    for (const nivel of [1, 5, 12, 20]) {
      const sem = deriveAfty(ficha(nivel, { sistema, tipo, addon: false }));
      const com = deriveAfty(ficha(nivel, { sistema, tipo, addon: true }));
      t(`${sistema} ${tipo} ${nivel}: o recurso é ${tipo === "restringido" ? "Estamina" : "Energia"}`,
        com.recursoLabel, tipo === "restringido" ? "Estamina" : "Energia");
      const [hs, ps] = pvpe(sem);
      const [hc, pc] = pvpe(com);
      t(`${sistema} ${tipo} ${nivel}: PV e PE sobem 2 × Nível`, [hc - hs, pc - ps], [2 * nivel, 2 * nivel]);
    }
  }
}

console.log(`t-prodigio: ${ok} ok, ${bad.length} falha(s)`);
if (bad.length) { for (const b of bad) console.log("  ✗ " + b); process.exit(1); }
