/* AS REGRAS DE AÇÃO DO ADICIONAIS PARA INVOCAÇÕES (Etapa 11 da atualização de 2026-09-30).

   "Regras Intrínsecas" e "Regras de Reação":
     - Manobra e Condição não podem ser Ação Simples;
     - Reduzir Cura: Complexa, 8 PE (1/3) ou 10 PE (metade), e deve pedir TR;
     - Cobertura: Meia (4 PE, Terceiro Grau) e 3/4 (6 PE, Segundo Grau), como
       Reação, e sem Cobertura Total (PV-04: custo e grau mínimo);
     - a Reação Simples Auxiliar vale 1,5 vez. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
await import(R + "afty-derive.js");
const I = await import(R + "afty-invocacoes.js");

let ok = 0;
const bad = [];
const t = (nome, real, esp) => {
  if (JSON.stringify(real) === JSON.stringify(esp)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esp)}`);
};

const DONO = { nd: 9, bt: 4, nivelControlador: 9 };
const inv = (grau) => ({ ...I.createBlankInvocacao(grau, "shikigami"), id: "X", nome: "X" });
const acao = (extra) => ({ ...I.createBlankAcao(), id: "a", nome: "A", ...extra });
const res = (a, grau = "segundo") => I.resolveAcao(a, inv(grau), DONO);

t("a Acao em branco traz as marcas desligadas",
  (({ reacao, manobra, especial }) => [reacao, manobra, especial])(I.createBlankAcao()), [false, false, ""]);

/* Reação. */
const defesaSimples = res(acao({ classe: "simples", familia: "auxilio", auxilioSub: "defesa" }));
const defesaReacao = res(acao({ classe: "simples", familia: "auxilio", auxilioSub: "defesa", reacao: true }));
t("a Reacao Simples Auxiliar vale 1,5 vez, para baixo",
  [defesaReacao.valor, defesaReacao.valorSemReacao, defesaReacao.reacao], [Math.floor(defesaSimples.valor * 1.5), defesaSimples.valor, true]);
const complexa = res(acao({ classe: "complexa", familia: "auxilio", auxilioSub: "defesa" }));
t("a Reacao Complexa nao multiplica",
  res(acao({ classe: "complexa", familia: "auxilio", auxilioSub: "defesa", reacao: true })).valor, complexa.valor);
t("o ataque em Reacao nao tem valor a multiplicar",
  res(acao({ classe: "simples", familia: "ataque", reacao: true })).valorSemReacao, undefined);

/* Manobra e Condição. */
t("Manobra nao pode ser Simples",
  [res(acao({ classe: "simples", manobra: true })).warnings.includes("Manobra não pode ser Ação Simples."),
    res(acao({ classe: "complexa", manobra: true })).warnings.includes("Manobra não pode ser Ação Simples.")],
  [true, false]);
t("Condicao nao pode ser aplicada por Acao Simples",
  res(acao({ classe: "simples", familia: "auxilio", auxilioSub: "defesa", custoPE: 2, beneficiosCusto: [{ tipo: "condicao", nivel: "fraca" }] }))
    .warnings.includes("Condição não pode ser aplicada por Ação Simples."), true);

/* Reduzir Cura. */
const reducao = (extra) => res(acao({ especial: "reducaoCura", ataqueTipo: "tr", ...extra }));
t("Reduzir Cura em 1/3 custa 8 PE, e pela metade 10",
  [reducao({}).custoPE, reducao({ reducaoCura: "metade" }).custoPE, reducao({}).especial.rotulo], [8, 10, "Reduz Cura em 1/3"]);
t("e nao e Acao com Custo", reducao({}).acaoComCusto, false);
t("deve ser Complexa e pedir TR",
  [reducao({ classe: "simples" }).warnings.includes("Reduzir Cura é Ação Complexa."),
    reducao({ ataqueTipo: "jogada" }).warnings.includes("Reduzir Cura deve pedir TR."),
    reducao({}).warnings.length],
  [true, true, 0]);

/* Cobertura. */
const cobertura = (tipo, grau) => res(acao({ especial: "cobertura", cobertura: tipo, classe: "simples", familia: "auxilio", auxilioSub: "defesa" }), grau);
t("Meia Cobertura: 4 PE, e e Reacao", [cobertura("meia", "terceiro").custoPE, cobertura("meia", "terceiro").reacao], [4, true]);
t("Cobertura 3/4: 6 PE", cobertura("tresQuartos", "segundo").custoPE, 6);
t("a Cobertura Simples Auxiliar tambem vale 1,5 vez",
  cobertura("meia", "terceiro").valor, Math.floor(res(acao({ classe: "simples", familia: "auxilio", auxilioSub: "defesa" }), "terceiro").valor * 1.5));
t("o grau minimo: Terceiro para a Meia, Segundo para a 3/4",
  [cobertura("meia", "quarto").warnings.some((w) => w.includes("pede Terceiro Grau")),
    cobertura("tresQuartos", "terceiro").warnings.some((w) => w.includes("pede Segundo Grau")),
    cobertura("tresQuartos", "segundo").warnings.some((w) => w.includes("pede"))],
  [true, true, false]);

/* A Ação herdada leva o nome da sombra até a Ficha. */
t("a Acao recebida por Heranca diz de quem veio",
  res(acao({ herancaDe: "Tigre" })).herancaDe, "Tigre");

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
if (bad.length) process.exitCode = 1;
