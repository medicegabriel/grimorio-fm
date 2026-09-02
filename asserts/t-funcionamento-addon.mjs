import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty, funcionamentosDaFicha } = await import(R + "afty-schema.js");
const { normalizarPacote, validarPacote } = await import(R + "afty-addons.js");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else bad.push(`${nome}: ${JSON.stringify(real)} != ${JSON.stringify(esperado)}`);
};

const PACOTE = {
  id: "minha-tecnica",
  nome: "Minha Técnica",
  versao: "1.0.0",
  paraRaw: "afty",
  funcionamentos: [{
    id: "nucleo",
    nome: "Núcleo Particular",
    descricao: "Texto particular.",
    efeitos: [{ canal: "rdGeral", expr: "3" }],
  }],
};

t("pacote só com Funcionamento Básico é válido", validarPacote(PACOTE), []);
const pacote = normalizarPacote(PACOTE);
t("normalização preserva o Funcionamento", pacote.funcionamentos.length, 1);

const sem = createBlankAfty();
const com = createBlankAfty();
com.addons = [pacote];

t("criatura sem pacote só tem o principal", funcionamentosDaFicha(sem).length, 1);
const lista = funcionamentosDaFicha(com);
t("criatura com pacote recebe o adicional", lista.length, 2);
t("id do Funcionamento recebe namespace", lista[1].id, "minha-tecnica:nucleo");
t("Funcionamento de addon é marcado", lista[1].deAddon, true);
t("texto vem do pacote", lista[1].descricao, "Texto particular.");

const rdSem = deriveAfty(sem).rdGeral;
const rdCom = deriveAfty(com).rdGeral;
t("efeito do Funcionamento passa pelo deriveAfty", rdCom - rdSem, 3);

const outra = createBlankAfty();
t("efeito não vaza para outra criatura", deriveAfty(outra).rdGeral, rdSem);

t("id repetido é recusado", validarPacote({
  ...PACOTE,
  funcionamentos: [PACOTE.funcionamentos[0], PACOTE.funcionamentos[0]],
}).length > 0, true);
t("Funcionamento vazio é recusado", validarPacote({
  ...PACOTE,
  funcionamentos: [{ id: "vazio", nome: "Vazio" }],
}).length > 0, true);
t("efeitos precisam ser lista", validarPacote({
  ...PACOTE,
  funcionamentos: [{ id: "x", nome: "X", descricao: "X", efeitos: {} }],
}).length > 0, true);

console.log(bad.length ? `FALHAS (${bad.length}):\n` + bad.join("\n") : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
