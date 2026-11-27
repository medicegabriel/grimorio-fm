/* O TEXTO DA AÇÃO DA CRIATURA DA 2.5.2 NO ENCONTRO (2026-11-23).

   Feedback do lançamento: "não consigo ver o que a expansão do Jogo faz, tenho que ir na ficha fora do encontro".
   O `PainelCriatura252` lia só `description` e `finalTextManual`, e a Ação montada pelos campos tem os dois vazios:
   o texto dela é GERADO pelo `resolveActionFinalText`, que é o que a ficha da 2.5.2 mostra. O adaptador agora expõe
   `textoDaAcao`, e este arquivo prende que ele devolve o texto da ficha, sem travessão. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
import { readFileSync } from "node:fs";

const R = new URL("../src/systems/afty/", import.meta.url).href;
await import(R + "afty-derive.js");
const V = await import(R + "encontros/motores/m252-vital.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const j = JSON.parse(readFileSync(new URL("../src/data/enciclopedia-digital-0.1.json", import.meta.url), "utf8"));
const lista = Array.isArray(j) ? j : (j.creatures ?? Object.values(j).find(Array.isArray));
const jogo = lista.find((x) => x.name === "Jogo");
const acao = (prefixo) => jogo.actions.list.find((a) => a.name.startsWith(prefixo));

const caixao = acao("Caixão da Montanha de Ferro");
t("a Expansao do Jogo nao tem texto gravado", [caixao.description ?? "", caixao.finalTextManual ?? ""], ["", ""]);
const texto = V.textoDaAcao(caixao, jogo.name);
t("e o adaptador monta o texto dela", texto.length > 200, true);
t("com a barreira do dominio", texto.includes("540 pontos de vida"), true);
t("e o Efeito Especial", texto.includes("Vire Cinzas"), true);
t("sem travessao", texto.includes(String.fromCharCode(0x2014)), false);

const sopro = acao("Sopro Carbonizador");
t("a Acao de TR montada pelos campos tambem ganha texto", V.textoDaAcao(sopro, jogo.name).includes("Fortitude"), true);

const geiseres = acao("Gêiseres Vulcânicos");
t("a Acao com descricao gravada segue com texto", V.textoDaAcao(geiseres, jogo.name).length > 0, true);

t("todas as oito Acoes do Jogo tem texto", jogo.actions.list.every((a) => V.textoDaAcao(a, jogo.name).length > 0), true);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
