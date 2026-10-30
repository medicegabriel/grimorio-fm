import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { coletarInventario, hashDado } from "../../scripts/revisao-automacao/inventario.mjs";
import { construirProposta, aplicarProposta } from "../../scripts/revisao-automacao/reconciliar.mjs";

const raiz = new URL("../../", import.meta.url);
const controle = (nome) => new URL(`docs/revisao-automacao/${nome}`, raiz);
const pertence = (item) => item.chave.startsWith("addon::retracao-de-dominio.json::");
const sufixo = process.argv[3] ?? "";
assert.ok(/^(?:-\d{2})?$/.test(sufixo), "Sufixo de tentativa inválido");
const propostaNome = `.audit/retracao-de-dominio-20261025/proposta-chaves-novas${sufixo}.json`;
const propostaUrl = new URL(propostaNome, raiz);
const json = (dado) => JSON.stringify(dado, null, 2).replaceAll(String.fromCharCode(0x2014), "\\u2014") + "\n";
const nomes = ["inventario.json", "escopo.json", "fontes.json", "reconciliacao.json", "campanha.json"];

// A coleta pode demorar. Os controles são relidos somente depois dela e antes
// de preparar qualquer escrita, para preservar o trabalho de outros chats.
const vivo = await coletarInventario();
const bytes = new Map(nomes.map((nome) => [nome, readFileSync(controle(nome))]));
const dados = Object.fromEntries([...bytes].map(([nome, valor]) => [nome, JSON.parse(valor.toString("utf8").replace(/^\uFEFF/, ""))]));
const inventario = dados["inventario.json"];
const escopo = dados["escopo.json"];
const campanha = dados["campanha.json"];
assert.equal(campanha.lotes.find((l) => l.lote === "APT-09")?.nome, "Aptidões de Domínio");

const antigas = new Set(inventario.itens.map((item) => item.chave));
const novas = vivo.itens.filter((item) => pertence(item) && !antigas.has(item.chave));
assert.ok(novas.length > 0, "Nenhuma chave nova do addon para registrar");
const limitado = { ...vivo, itens: novas };
const vazio = { ...inventario, itens: [] };
const contexto = { vivo: limitado, inventario: vazio, escopo };

if (process.argv[2] !== "aplicar") {
  assert.equal(existsSync(propostaUrl), false, "Preservar proposta anterior");
  const proposta = construirProposta(contexto);
  assert.equal(proposta.errosColeta.length, 0, "A coleta precisa estar íntegra");
  proposta.decisoes = {
    adicoes: Object.fromEntries(proposta.adicionados.map((item) => [item.chave, "APT-09"])),
    remocoes: {},
    justificativaAtualizacao: "Pedido humano em 2026-10-25: criar Retração de Domínio como Aptidão que requer Dom 3, com ativação manual e ganho de 20% dos máximos de PV e PE, somando a diferença aos atuais. Registro restrito às chaves novas de addons/retracao-de-dominio.json. Proprietário APT-09, Aptidões de Domínio. Regra da casa, sem aprovação de regra, execução ou auditoria. Todos os dados anteriores permanecem preservados.",
  };
  writeFileSync(propostaUrl, json(proposta), { flag: "wx" });
  console.log(JSON.stringify({ adicionados: proposta.adicionados.map((item) => item.chave), alterados: proposta.alterados, removidos: proposta.removidos, erros: proposta.errosColeta }));
} else {
  const proposta = JSON.parse(readFileSync(propostaUrl, "utf8"));
  const resultado = aplicarProposta({ ...contexto, proposta, campanha });
  assert.equal(resultado.resumo.alterados, 0);
  assert.equal(resultado.resumo.removidos, 0);
  assert.deepEqual(resultado.campanha, campanha, "Campanha preservada");
  assert.ok(resultado.inventario.itens.every((item) => pertence(item) && !antigas.has(item.chave)
    && item.proprietario === "APT-09" && item.estado === "NÃO REVISADO"));

  const inventarioNovo = { ...inventario, itens: [...inventario.itens, ...resultado.inventario.itens]
    .sort((a, b) => a.chave.localeCompare(b.chave)) };
  for (const item of inventario.itens) assert.deepEqual(inventarioNovo.itens.find((atual) => atual.chave === item.chave), item);
  const escopoAnterior = structuredClone(escopo);
  for (const item of novas) delete resultado.escopo.proprietarios[item.chave];
  assert.deepEqual(resultado.escopo, escopoAnterior, "Escopo anterior preservado");
  for (const item of novas) resultado.escopo.proprietarios[item.chave] = "APT-09";

  const fontes = dados["fontes.json"];
  const fontesAnteriores = structuredClone(fontes);
  const decisaoAutor = "Faça um Addon chamado \"Retração de Domínio\" que funciona de maneira bem similar a uma Expansão de Domínio. É uma Aptidão que requer \"Dom 3\". Ela precisa ser ativa como se fosse um buff, ou uma expansão. E quando ativada, o jogador recebe 20% de HP Máximo e PE Máximo. Recebendo a diferença no PV e PE atual.";
  for (const item of resultado.inventario.itens) {
    assert.equal(fontes.itens[item.chave], undefined, "Não sobrescrever fonte anterior");
    fontes.itens[item.chave] = {
      proprietario: "APT-09",
      estado: "DA CASA",
      decisaoAutor,
      fontes: [{ caminho: "Conversa do autor em 2026-10-25", versao: "Pedido humano desta tarefa",
        local: "Criação de Retração de Domínio, Aptidão de Dom 3", tipo: "decisão do autor",
        papel: "Regra da casa de ampliação ativável de PV e PE máximos e ganho da diferença aos atuais" }],
      nota: "Identidade e pedido humano registrados. Conteúdo NÃO REVISADO, sem aprovação de regra, implementação ou auditoria.",
    };
  }
  const fontesSemNovas = structuredClone(fontes);
  for (const item of novas) delete fontesSemNovas.itens[item.chave];
  assert.deepEqual(fontesSemNovas, fontesAnteriores, "Fontes anteriores preservadas");
  const reconciliacao = dados["reconciliacao.json"];
  const reconciliacaoAnterior = structuredClone(reconciliacao);
  reconciliacao.historico.push({ data: new Date().toISOString(), proposta: propostaNome,
    assinatura: proposta.assinatura, justificativa: proposta.decisoes.justificativaAtualizacao, ...resultado.resumo });
  const reconciliacaoSemNova = structuredClone(reconciliacao);
  reconciliacaoSemNova.historico.pop();
  assert.deepEqual(reconciliacaoSemNova, reconciliacaoAnterior, "Histórico anterior preservado");

  const saidas = new Map([["inventario.json", inventarioNovo], ["escopo.json", resultado.escopo],
    ["fontes.json", fontes], ["reconciliacao.json", reconciliacao]]);
  const verificarBytes = () => {
    for (const [nome, esperado] of bytes) assert.ok(readFileSync(controle(nome)).equals(esperado),
      `Corrida detectada em ${nome}, escrita interrompida sem forçar`);
  };
  verificarBytes();
  for (const [nome, valor] of bytes) writeFileSync(new URL(`antes-registro${sufixo}-${nome}`, import.meta.url), valor, { flag: "wx" });
  for (const [nome, dado] of saidas) writeFileSync(new URL(`resultado-registro${sufixo}-${nome}`, import.meta.url), json(dado), { flag: "wx" });
  for (const [nome, dado] of saidas) {
    const texto = json(dado);
    verificarBytes();
    writeFileSync(controle(nome), texto);
    bytes.set(nome, Buffer.from(texto));
  }
  verificarBytes();
  assert.equal(hashDado(JSON.parse(readFileSync(controle("campanha.json"), "utf8"))), hashDado(campanha));
  const resumo = { ...resultado.resumo, campanhaPreservada: true, itensAnterioresPreservados: inventario.itens.length,
    fontesAnterioresPreservadas: Object.keys(fontesAnteriores.itens).length, novasChaves: novas.map((item) => item.chave) };
  writeFileSync(new URL(`registro-resumo${sufixo}.json`, import.meta.url), json(resumo), { flag: "wx" });
  console.log(JSON.stringify(resumo));
}
