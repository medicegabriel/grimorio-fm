import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { CONTROLE, coletarInventario, lerJson } from "../scripts/revisao-automacao/inventario.mjs";
import { construirProposta, aplicarProposta } from "../scripts/revisao-automacao/reconciliar.mjs";
const ler = (nome) => lerJson(resolve(CONTROLE, nome));
const salvar = (nome, dado) => writeFileSync(resolve(CONTROLE, nome), JSON.stringify(dado, null, 2).replaceAll(String.fromCharCode(0x2014), "\\u2014") + "\n");
const inventario = ler("inventario.json"), escopo = ler("escopo.json"), campanha = ler("campanha.json");
const vivo = await coletarInventario();
const arquivos = new Set(["src/systems/afty/afty-cura.js", "src/systems/afty/afty-efeitos.js"]);
const controle = new Set(["estado", "situacao", "fonteFamilia", "justificativaRemocao", "renomeadoPara", "reconciliacao"]);
const limitado = { ...vivo, itens: [
  ...inventario.itens.filter((i) => i.situacao !== "REMOVIDO" && !arquivos.has(i.arquivo))
    .map((i) => Object.fromEntries(Object.entries(i).filter(([k]) => !controle.has(k)))),
  ...vivo.itens.filter((i) => arquivos.has(i.arquivo) || i.chave.startsWith("addon::cura-aperfeicoada-feiticos.json::")),
] };
const proposta = construirProposta({ vivo: limitado, inventario, escopo });
if (proposta.adicionados.length !== 15 || proposta.alterados.length !== 4 || proposta.removidos.length)
  throw Error("Reconciliação deve conter somente 13 entradas do addon, 2 do canal e 4 atualizações de catálogo.");
const dono = "AD-53";
if (campanha.lotes.some((l) => l.lote === dono)) throw Error("AD-53 já existe.");
campanha.lotes.push({ lote: dono, nome: "Addon: Feitiços de Cura Aperfeiçoada", fase: "Addons", estado: "NÃO REVISADO", auditoria: "NÃO EXECUTADA", dependencias: ["M01", "M02", "M04", "M05", "SUP-06"], registro: "AD-53/registro.json", proprietario: "executor do lote AD-53" });
proposta.decisoes.adicoes = Object.fromEntries(proposta.adicionados.map((i) => [i.chave, i.chave.startsWith("addon::") ? dono : i.proprietarioSugerido]));
proposta.decisoes.justificativaAtualizacao = "Pedido do autor em 2026-10-12: dois Feitiços Passivos de Nível 5, limite 4 e repetição até superar o limite. Canal genérico rerrolaCuraContinua. Registro restrito ao addon e canal, preservando conteúdo e estados anteriores.";
const caminho = ".audit/cura-feiticos-proposta-aplicada.json";
writeFileSync(caminho, JSON.stringify(proposta, null, 2) + "\n");
const registros = campanha.lotes.map((l) => resolve(CONTROLE, l.lote, "registro.json")).filter(existsSync).map(lerJson);
const resultado = aplicarProposta({ proposta, vivo: limitado, inventario, escopo, campanha, registros });
const fontes = ler("fontes.json");
for (const i of proposta.adicionados) fontes.itens[i.chave] = { proprietario: proposta.decisoes.adicoes[i.chave], estado: "DA CASA", fontes: [], nota: "Homebrew confirmado pelo autor em 2026-10-12. Contrato em docs/afty-cura-feiticos.md, sem aprovação independente de auditoria." };
const reconciliacao = ler("reconciliacao.json");
(reconciliacao.historico ??= []).push({ data: new Date().toISOString(), proposta: caminho, assinatura: proposta.assinatura, justificativa: proposta.decisoes.justificativaAtualizacao, ...resultado.resumo });
salvar("inventario.json", resultado.inventario); salvar("escopo.json", resultado.escopo); salvar("campanha.json", resultado.campanha); salvar("fontes.json", fontes); salvar("reconciliacao.json", reconciliacao);
for (const registro of resultado.registros) salvar(registro.lote + "/registro.json", registro);
console.log(JSON.stringify(resultado.resumo));
