import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { CONTROLE, coletarInventario, lerJson } from "../scripts/revisao-automacao/inventario.mjs";
import { construirProposta, aplicarProposta } from "../scripts/revisao-automacao/reconciliar.mjs";
const ler = (nome) => lerJson(resolve(CONTROLE, nome));
const salvar = (nome, dado) => writeFileSync(resolve(CONTROLE, nome), JSON.stringify(dado, null, 2)
  .replaceAll(String.fromCharCode(0x2014), "\\u2014") + "\n");
const inventario = ler("inventario.json"), escopo = ler("escopo.json"), campanha = ler("campanha.json");
const vivo = await coletarInventario();
const anteriores = new Map(inventario.itens.map((i) => [i.chave, i]));
const controles = new Set(["estado", "situacao", "fonteFamilia", "justificativaRemocao", "renomeadoPara", "reconciliacao"]);
const limitado = { ...vivo, itens: vivo.itens.map((i) => {
  // Preserva as seis mudanças anteriores de Gerais, fora deste pedido.
  const antigo = anteriores.get(i.chave);
  return i.arquivo === "src/systems/afty/afty-gerais.js" && antigo
    ? Object.fromEntries(Object.entries(antigo).filter(([k]) => !controles.has(k))) : i;
}) };
const proposta = construirProposta({ vivo: limitado, inventario, escopo });
if (proposta.adicionados.length !== 5 || proposta.removidos.length || proposta.alterados.length !== 6)
  throw Error("A reconciliação deve conter somente 5 adições e 6 atualizações de Cura Aperfeiçoada.");
proposta.decisoes.adicoes = Object.fromEntries(proposta.adicionados.map((i) => [i.chave, i.proprietarioSugerido]));
proposta.decisoes.justificativaAtualizacao = "Automatização de Cura Aperfeiçoada solicitada pelo autor em 2026-10-12. Canal rerrolaCura e efeito do Suporte, mantendo donos e estados anteriores. Mudanças anteriores de Gerais fora do escopo.";
const caminho = ".audit/cura-aperfeicoada-proposta-aplicada.json";
writeFileSync(caminho, JSON.stringify(proposta, null, 2) + "\n");
const registros = campanha.lotes.map((l) => resolve(CONTROLE, l.lote, "registro.json")).filter(existsSync).map(lerJson);
const resultado = aplicarProposta({ proposta, vivo: limitado, inventario, escopo, campanha, registros });
const fontes = ler("fontes.json");
for (const i of proposta.adicionados) fontes.itens[i.chave] = {
  proprietario: i.proprietarioSugerido,
  estado: i.proprietarioSugerido === "SUP-06" ? "LOCALIZADA" : "DA CASA",
  fontes: i.proprietarioSugerido === "SUP-06" ? [{
    arquivo: "C:/Projetos/Grimorio/F&M 2.5.2 - Livro de Regras.md",
    versao: "1d0713d52c818a9ab9f47b883d9887a0d227d174d30ffcce358874669a7a733a",
    paginaImpressa: 109, marcadorPagina: "<!-- página 109 -->",
  }] : [],
  nota: "Automatização solicitada pelo autor em 2026-10-12. Contrato em docs/afty-ficha-final.md. Localização e identidade não aprovam auditoria.",
};
const rec = ler("reconciliacao.json");
(rec.historico ??= []).push({ data: new Date().toISOString(), proposta: caminho,
  assinatura: proposta.assinatura, justificativa: proposta.decisoes.justificativaAtualizacao, ...resultado.resumo });
salvar("inventario.json", resultado.inventario); salvar("escopo.json", resultado.escopo);
salvar("campanha.json", resultado.campanha); salvar("fontes.json", fontes); salvar("reconciliacao.json", rec);
for (const registro of resultado.registros) salvar(registro.lote + "/registro.json", registro);
console.log(JSON.stringify(resultado.resumo));
