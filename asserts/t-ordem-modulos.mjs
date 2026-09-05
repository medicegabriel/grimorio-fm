/* A ORDEM DE AVALIAÇÃO DOS MÓDULOS, que quebrou o app em 2026-09-02.

   ⚠ ESTE ARQUIVO NÃO MEDE REGRA NENHUMA DO LIVRO. Ele mede o GRAFO DE IMPORTS,
   e existe porque o app inteiro ficou em tela branca com

       Uncaught ReferenceError: Cannot access 'ARMA_GRUPOS' before initialization

   e nenhum dos 2547 asserts pegou. A razão de não pegarem é o próprio arnês: os
   asserts importam `afty-derive.js` na primeira linha, e o afty-derive puxa o
   `afty-habilidades` ANTES do `afty-equipamentos`, que é justamente a ordem que
   funciona. O navegador entra por outra porta.

   ------------------------------------------------------------
   O CICLO, QUE É ANTIGO E NÃO É DE NINGUÉM EM PARTICULAR
   ------------------------------------------------------------
     afty-equipamentos -> afty-efeitos -> afty-combate -> afty-habilidades
                       -> afty-equipamentos   (ARMA_GRUPOS, linha 50)

   Ele nunca estourou porque `afty-habilidades` SEMPRE entrava primeiro: aí o
   `afty-equipamentos` termina de avaliar antes do corpo do habilidades rodar.
   Invertida a ordem, o corpo do habilidades roda com o equipamentos no meio da
   avaliação, e `ARMA_GRUPOS` ainda está na zona morta do `const`.

   Quem inverteu foi a aba de Defesas: o `AftyCreatureBuilder.jsx` a importa lá
   no topo, e ela importava o `afty-equipamentos`.

   ------------------------------------------------------------
   O QUE ESTE ARQUIVO GARANTE
   ------------------------------------------------------------
   Que os módulos FOLHA continuam folha. Cada um deles é carregado PRIMEIRO, num
   processo em que mais nada foi importado, que é a única forma de reproduzir a
   entrada do navegador.

   ⚠ Um import novo num destes arquivos derruba este assert, e é para derrubar
   mesmo: o custo de descobrir isso aqui é um teste vermelho, e o de descobrir
   no navegador é o app inteiro em branco. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const R = new URL("../src/systems/afty/", import.meta.url).href;

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

/* Os módulos que SÃO folha, e a razão de cada um. Acrescentar um aqui é de
   graça; tirar um daqui pede saber por que ele deixou de precisar ser. */
const FOLHAS = [
  ["afty-defesas-dano.js", "a aba de Defesas entra cedo no AftyCreatureBuilder"],
  ["afty-catarse.js", "o painel da Loja de Catarse entra cedo no AftyCreatureBuilder"],
  ["afty-pericias-catalogo.js", "os três catálogos de requisito o chamam"],
  ["afty-schema.js", "todo mundo cria ficha em branco"],
  ["afty-dsl.js", "o avaliador não pode depender de conteúdo"],
  ["afty-sistema.js", "regraDo() é lido de dentro dos catálogos"],
];

/* 1. NENHUM IMPORT, lido do próprio texto do arquivo. É a garantia estrutural:
      um módulo sem import não tem como entrar num ciclo. */
for (const [arquivo, porque] of FOLHAS) {
  const texto = readFileSync(fileURLToPath(R + arquivo), "utf8");
  const imports = texto.split("\n")
    .map((l) => l.trim())
    .filter((l) => /^import\s/.test(l) || /^\}\s*from\s/.test(l));
  t(`${arquivo} nao importa nada (${porque})`, imports, []);
}

/* 2. E CARREGA SOZINHO. O teste de cima é sintático; este é o comportamento.
      Um `import()` dinâmico dentro do módulo passaria pelo primeiro e morreria
      aqui. Cada folha entra num processo LIMPO, porque uma vez que qualquer
      outro módulo tenha sido importado a ordem já está resolvida e o teste
      deixaria de medir o que quer. */
const { execFileSync } = await import("node:child_process");
const shim = "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\\\".\\\")&&!s.endsWith(\\\".js\\\"))return n(s+\\\".js\\\",c);throw e}}";
for (const [arquivo] of FOLHAS) {
  const codigo = `import { register } from "node:module";`
    + `register("${shim}", import.meta.url);`
    + `await import(${JSON.stringify(R + arquivo)});`
    + `console.log("ok");`;
  let saida;
  try {
    saida = execFileSync(process.execPath, ["--input-type=module", "-e", codigo], { encoding: "utf8" }).trim();
  } catch (e) {
    saida = `QUEBROU: ${String(e.stderr ?? e.message).split("\n").find((l) => /Error/.test(l)) ?? "?"}`;
  }
  t(`${arquivo} carrega sozinho, sem mais nada importado`, saida, "ok");
}

/* 3. A CONTRAPROVA: o ciclo REALMENTE existe, e a folha é o que protege dele.
      Entrar pelo `afty-equipamentos` primeiro é a ordem ruim, e ela tem de
      continuar funcionando também (ninguém a proíbe, ela só não pode ser a
      única que funciona). Se um dia alguém desfizer o ciclo de verdade, este
      assert continua verde: ele não exige que o ciclo exista. */
const codigoEquip = `import { register } from "node:module";`
  + `register("${shim}", import.meta.url);`
  + `await import(${JSON.stringify(R + "afty-equipamentos.js")});`
  + `const m = await import(${JSON.stringify(R + "afty-habilidades.js")});`
  + `console.log(m.AFTY_HABILIDADES.length > 0 ? "ok" : "vazio");`;
let saidaEquip;
try {
  saidaEquip = execFileSync(process.execPath, ["--input-type=module", "-e", codigoEquip],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
} catch (e) {
  saidaEquip = `QUEBROU: ${String(e.stderr ?? e.message).split("\n").find((l) => /Error/.test(l))?.trim() ?? "?"}`;
}
/* ⚠ AQUI A EXPECTATIVA É FROUXA DE PROPÓSITO, e aceita os DOIS desfechos.

   Entrar pelo `afty-equipamentos` ainda quebra hoje: o conserto de 2026-09-02
   foi tirar a aba de Defesas desse caminho, e NÃO desfazer o ciclo. Desfazê-lo
   exige mexer no `OPCAO_ESCOLHA_NOME`, um IIFE de escopo de módulo que varre
   todas as opções de escolha do catálogo.

   Um assert que EXIGISSE a quebra ficaria vermelho no dia em que alguém
   consertasse o ciclo, que é punir a melhoria. Então o que se cobra é outra
   coisa: ou carrega, ou quebra pelo motivo QUE JÁ CONHECEMOS. Uma quebra nova,
   com outra variável, é sintoma de um segundo ciclo e aí sim tem de acender. */
t("ou o afty-equipamentos carrega primeiro, ou quebra so pelo motivo conhecido",
  saidaEquip === "ok" || (saidaEquip.startsWith("QUEBROU") && saidaEquip.includes("ARMA_GRUPOS")), true);

if (bad.length) {
  console.log(`FALHAS (${bad.length}):`);
  for (const b of bad) console.log("  " + b);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
