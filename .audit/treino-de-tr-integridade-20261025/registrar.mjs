import assert from "node:assert/strict";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { coletarInventario, lerJson, hashDado } from "../../scripts/revisao-automacao/inventario.mjs";
import { construirProposta, aplicarProposta } from "../../scripts/revisao-automacao/reconciliar.mjs";

const raiz = new URL("../../", import.meta.url);
const arq = (nome) => new URL(`docs/revisao-automacao/${nome}`, raiz);
const propostaArq = arq(`G00/rechecagem/proposta-treino-de-tr-integridade-20261025${process.argv[2] === "atualizar" ? "-02" : ""}.json`);
const pertence = (i) => i.chave.startsWith("addon::treino-de-tr.json::");
const gravar = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2).replaceAll(String.fromCharCode(0x2014), "\\u2014") + "\n");
const vivo = await coletarInventario();
const inventario = lerJson(arq("inventario.json"));
const escopo = lerJson(arq("escopo.json"));
const campanha = lerJson(arq("campanha.json"));
const vivoDoPacote = { ...vivo, itens: vivo.itens.filter(pertence) };
const inventarioDoPacote = { ...inventario, itens: inventario.itens.filter(pertence) };
const contexto = { vivo: vivoDoPacote, inventario: inventarioDoPacote, escopo };

if (!["aplicar", "atualizar"].includes(process.argv[2])) {
  assert.equal(existsSync(propostaArq), false, "Preservar propostas anteriores");
  const p = construirProposta(contexto);
  p.decisoes = {
    adicoes: Object.fromEntries(p.adicionados.map((i) => [i.chave, "TRE-03"])),
    remocoes: {},
    justificativaAtualizacao: "Correção explícita do autor em 2026-10-25: Faltou Integridade no Treino de TR. Versão 1.1.0 habilita o quinto TR somente nessa linha. Reconciliação restrita ao pacote."
  };
  gravar(propostaArq, p);
  console.log(JSON.stringify({ adicionados: p.adicionados.map((i) => i.chave), alterados: p.alterados.map((i) => i.chave), removidos: p.removidos, erros: p.errosColeta }));
} else {
  if (process.argv[2] === "atualizar") {
    const anterior = lerJson(arq("G00/rechecagem/proposta-treino-de-tr-integridade-20261025.json"));
    const nova = construirProposta(contexto);
    assert.deepEqual(nova.adicionados, anterior.adicionados);
    assert.deepEqual(nova.removidos, anterior.removidos);
    assert.deepEqual(nova.alterados, anterior.alterados, "Preservar o mesmo conjunto de alterações revisado");
    nova.decisoes = anterior.decisoes;
    assert.equal(existsSync(propostaArq), false);
    gravar(propostaArq, nova);
  }
  const proposta = lerJson(propostaArq);
  const resultado = aplicarProposta({ ...contexto, proposta, campanha });
  assert.equal(resultado.resumo.removidos, 0);
  assert.deepEqual(resultado.campanha, campanha, "Campanha preservada");
  const antesAlheios = inventario.itens.filter((i) => !pertence(i));
  const novos = { ...inventario, itens: [...antesAlheios, ...resultado.inventario.itens].sort((a, b) => a.chave.localeCompare(b.chave)) };
  assert.deepEqual(novos.itens.filter((i) => !pertence(i)), antesAlheios, "Itens alheios preservados");
  const fontes = lerJson(arq("fontes.json"));
  const fontesAlheias = Object.fromEntries(Object.entries(fontes.itens).filter(([k]) => !pertence({ chave: k })));
  const modeloFonte = fontes.itens["addon::treino-de-tr.json::acrescenta.treinamentos::tr"];
  for (const item of resultado.inventario.itens) {
    const fonte = fontes.itens[item.chave] ?? structuredClone(modeloFonte);
    fonte.decisaoAutor = modeloFonte.decisaoAutor.includes("Faltou Integridade")
      ? modeloFonte.decisaoAutor : modeloFonte.decisaoAutor + " Correção explícita do autor: Faltou Integridade no Treino de TR.";
    fontes.itens[item.chave] = fonte;
  }
  assert.deepEqual(Object.fromEntries(Object.entries(fontes.itens).filter(([k]) => !pertence({ chave: k }))), fontesAlheias);
  const rec = lerJson(arq("reconciliacao.json"));
  rec.historico.push({ data: new Date().toISOString(), proposta: `docs/revisao-automacao/G00/rechecagem/proposta-treino-de-tr-integridade-20261025${process.argv[2] === "atualizar" ? "-02" : ""}.json`, assinatura: proposta.assinatura, justificativa: proposta.decisoes.justificativaAtualizacao, ...resultado.resumo });
  for (const nome of ["inventario.json", "escopo.json", "fontes.json", "reconciliacao.json"]) writeFileSync(new URL(`antes-${nome}`, import.meta.url), readFileSync(arq(nome)));
  gravar(arq("inventario.json"), novos);
  gravar(arq("escopo.json"), resultado.escopo);
  gravar(arq("fontes.json"), fontes);
  gravar(arq("reconciliacao.json"), rec);
  assert.equal(hashDado(lerJson(arq("campanha.json"))), hashDado(campanha));
  console.log(JSON.stringify({ ...resultado.resumo, itensPacote: resultado.inventario.itens.length, campanhaPreservada: true, itensAlheiosPreservados: true, fontesAlheiasPreservadas: true }));
}
