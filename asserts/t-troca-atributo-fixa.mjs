/* Troca FIXA do atributo de uma perícia por característica de Origem (2026-11-07):
   `trocaAtributoPericia: { periciaId, atributoId }`, sem escolha. A troca por
   escolha (Flugel) continua como estava.

   Pacote NEUTRO escrito aqui dentro, de propósito. */
import { register } from "node:module";
register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { deriveAfty } = await import(R + "afty-derive.js");
const { createBlankAfty } = await import(R + "afty-schema.js");
const A = await import(R + "afty-addons.js");

let ok = 0;
const falhas = [];
const t = (nome, real, esperado) => {
  const a = JSON.stringify(real);
  const b = JSON.stringify(esperado);
  if (a === b) ok += 1;
  else falhas.push(`${nome}\n     esperado ${b}\n     veio     ${a}`);
};

const PACOTE = {
  id: "troca-teste",
  nome: "Troca de Teste",
  versao: "1.0.0",
  autor: "teste",
  paraRaw: "afty",
  descricao: "Pacote neutro dos asserts da troca fixa de atributo.",
  resumo: "Troca fixa",
  categoria: "origens",
  acrescenta: {
    origens: [
      {
        id: "trocadora",
        nome: "Trocadora",
        lore: "Origem de teste.",
        caracteristicas: [
          {
            id: "forca_no_lugar",
            nome: "Força no Lugar",
            descricao: "Usa Força como atributo-chave de Intimidação.",
            trocaAtributoPericia: { periciaId: "intimidacao", atributoId: "forca" },
          },
        ],
      },
      { id: "comum", nome: "Comum", lore: "Origem de teste.", caracteristicas: [{ id: "x", nome: "X", descricao: "Texto." }] },
    ],
  },
};
const pacote = A.normalizarPacote(PACOTE);
t("o pacote valida", A.validarPacote(PACOTE), []);
A.aplicarAddons([pacote]);

const ficha = (origem, sistema = "afty") => {
  const c = createBlankAfty();
  c.rulesVersion = sistema;
  c.core = { ...c.core, nd: 5, tipo: "combatente", patamar: "comum" };
  c.core.origem = { id: origem };
  c.addons = [pacote];
  c.attributes = { ...(c.attributes || {}), forca: 20, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, presenca: 6 };
  return c;
};
const intim = (c) => deriveAfty(c).testes.pericias.find((p) => p.id === "intimidacao");

for (const sistema of ["afty", "player"]) {
  const S = `[${sistema}]`;
  const com = intim(ficha("troca-teste:trocadora", sistema));
  const sem = intim(ficha("troca-teste:comum", sistema));
  t(`${S} com a troca, Intimidação usa a Força`, com?.atributo, "forca");
  t(`${S} sem a troca, segue a Presença do livro`, sem?.atributo, "presenca");
  t(`${S} Força 20 contra Presença 6: o bônus sobe`, (com?.bonus ?? 0) > (sem?.bonus ?? 0), true);
}

A.aplicarAddons([]);

if (falhas.length) {
  console.log(`${falhas.length} FALHA(S) de ${ok + falhas.length}:\n`);
  for (const f of falhas) console.log(` x ${f}\n`);
  process.exit(1);
}
console.log(`TODOS OS ${ok} ASSERTS PASSARAM`);
