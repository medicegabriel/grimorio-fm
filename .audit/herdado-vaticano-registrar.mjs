import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { CONTROLE, coletarInventario, lerJson } from "../scripts/revisao-automacao/inventario.mjs";
import { construirProposta, aplicarProposta } from "../scripts/revisao-automacao/reconciliar.mjs";

const ler = (nome) => lerJson(resolve(CONTROLE, nome));
const salvar = (nome, dado) => writeFileSync(resolve(CONTROLE, nome),
  JSON.stringify(dado, null, 2).replaceAll(String.fromCharCode(0x2014), "\\u2014") + "\n");
const inventario = ler("inventario.json");
const escopo = ler("escopo.json");
const campanha = ler("campanha.json");
const vivo = await coletarInventario();
const prefixo = "addon::herdado-vaticano.json::";
const camposControle = new Set(["estado", "situacao", "fonteFamilia", "justificativaRemocao", "renomeadoPara", "reconciliacao"]);
// Esta reconciliação registra somente o addon solicitado. Mudanças anteriores
// de outros conteúdos conservam os hashes e estados registrados na entrada.
const limitado = { ...vivo, itens: [
  ...inventario.itens.filter((i) => i.situacao !== "REMOVIDO").map((i) =>
    Object.fromEntries(Object.entries(i).filter(([k]) => !camposControle.has(k)))),
  ...vivo.itens.filter((i) => i.chave.startsWith(prefixo)),
] };
const proposta = construirProposta({ vivo: limitado, inventario, escopo });
if (proposta.adicionados.length !== 25 || proposta.removidos.length || proposta.alterados.length)
  throw Error("A proposta deve conter somente as 25 novas entradas do Vaticano.");
const dono = "AD-52";
if (campanha.lotes.some((l) => l.lote === dono)) throw Error("AD-52 já existe.");
campanha.lotes.push({
  lote: dono, nome: "Addon: Herdado Vaticano", fase: "Addons",
  estado: "NÃO REVISADO", auditoria: "NÃO EXECUTADA",
  dependencias: ["M05", "M04", "M02", "SIS-02"],
  registro: "AD-52/registro.json", proprietario: "executor do lote AD-52",
});
proposta.decisoes.adicoes = Object.fromEntries(proposta.adicionados.map((i) => [i.chave, dono]));
proposta.decisoes.justificativaAtualizacao = "Pedido do autor em 2026-10-12: addon Herdado Vaticano. Registro restrito às 25 novas entradas, preservando conteúdo e estados anteriores. Teologia confirmada pelo autor como equivalente a Religião.";
const caminhoProposta = ".audit/herdado-vaticano-proposta-aplicada.json";
writeFileSync(caminhoProposta, JSON.stringify(proposta, null, 2) + "\n");
const resultado = aplicarProposta({ proposta, vivo: limitado, inventario, campanha, escopo });
const fontes = ler("fontes.json");
for (const i of proposta.adicionados) fontes.itens[i.chave] = {
  proprietario: dono, estado: "DA CASA", fontes: [],
  nota: "Homebrew solicitado pelo autor em 2026-10-12. Regra em docs/afty-herdado-vaticano.md. Registro de identidade e decisão, sem aprovação de auditoria.",
};
const reconciliacao = ler("reconciliacao.json");
(reconciliacao.historico ??= []).push({
  data: new Date().toISOString(), proposta: caminhoProposta, assinatura: proposta.assinatura,
  justificativa: proposta.decisoes.justificativaAtualizacao, ...resultado.resumo,
});
salvar("inventario.json", resultado.inventario);
salvar("escopo.json", resultado.escopo);
salvar("campanha.json", resultado.campanha);
salvar("fontes.json", fontes);
salvar("reconciliacao.json", reconciliacao);
console.log(JSON.stringify(resultado.resumo));
