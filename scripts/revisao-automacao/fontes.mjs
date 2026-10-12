import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export function hashFonte(arquivo) {
  try { return crypto.createHash("sha256").update(fs.readFileSync(arquivo)).digest("hex"); } catch { return null; }
}
const normalizar = arquivo => typeof arquivo === "string" ? path.resolve(arquivo).replaceAll("\\", "/").toLowerCase() : "";
export function fontesExternas(politica) {
  return [politica.livroRegras.caminho, politica.livroRegras.proveniencia];
}
// Só os dois caminhos de leitura explicitamente escolhidos pelo autor entram fora do repo.
export function chaveFonte(repo, arquivo, politica) {
  const abs = path.resolve(repo, arquivo);
  const rel = path.relative(path.resolve(repo), abs);
  if (rel !== ".." && !rel.startsWith(".." + path.sep) && !path.isAbsolute(rel)) return rel.replaceAll("\\", "/");
  return fontesExternas(politica).find(f => normalizar(f) === normalizar(abs)) ?? null;
}
export function verificarLivro(politica) {
  const caminho = politica.livroRegras.caminho, sha256 = hashFonte(caminho);
  const falha=(codigo,mensagem)=>({caminho,sha256,leituraConfirmada:false,estado:"INDISPONÍVEL",erros:[{codigo,arquivo:caminho,mensagem}]});
  if(sha256===null)return falha("FONTE_INDISPONIVEL","Livro de Regras externo não está acessível; verificar fonte antes de aprovar a regra.");
  if(sha256!==politica.livroRegras.sha256)return falha("HASH_FONTE_DIVERGENTE","Fonte não corresponde ao SHA-256 autorizado.");
  let texto;
  try {texto=fs.readFileSync(caminho,"utf8");} catch {return falha("FONTE_INDISPONIVEL","Não foi possível ler a fonte externa.");}
  const paginas=[...texto.matchAll(/^<!-- página (\d+) -->\r?$/gm)].map(m=>Number(m[1]));
  const {inicio,fim}=politica.livroRegras.paginasImpressas;
  if(paginas.length!==fim-inicio+1||paginas.some((p,i)=>p!==inicio+i))return falha("MARCADORES_INVALIDOS","Marcadores de página ausentes, repetidos ou fora de ordem.");
  return {caminho,sha256,paginas:paginas.length,leituraConfirmada:true,estado:"DISPONÍVEL",erros:[]};
}
// linha é a linha real, começando em 1. O último marcador acima dela define a página.
export function paginaImpressa(texto, linha) {
  const linhas = texto.split(/\r?\n/);
  if (!Number.isInteger(linha) || linha < 1 || linha > linhas.length) throw new Error("Linha fora do texto.");
  let pagina = null;
  for (const l of linhas.slice(0, linha)) {
    const marcador = /^<!-- página (\d+) -->$/.exec(l);
    if (marcador) pagina = Number(marcador[1]);
  }
  return pagina;
}
export function validarFontesRegistro(registro, politica, hashesAtuais, exigeLivro = false, { verificarDisponibilidade = true } = {}) {
  const erros = [], livro = politica.livroRegras;
  const versao = registro.fonteLivroRegras;
  if (versao?.caminho !== livro.caminho || versao?.sha256 !== livro.sha256) erros.push("Versão da fonte do Livro de Regras ausente ou divergente.");
  if (registro.base?.hashesIniciais?.[livro.caminho] !== livro.sha256) erros.push("Hash inicial da fonte externa ausente ou divergente.");
  if (registro.base?.hashesFinais?.[livro.caminho] !== livro.sha256) erros.push("Hash final da fonte externa ausente ou divergente.");
  if (verificarDisponibilidade && hashesAtuais?.[livro.caminho] !== livro.sha256) erros.push("A fonte externa mudou ou não está acessível.");
  if (registro.estado === "APROVADO" && registro.auditoria?.hashesExaminados?.[livro.caminho] !== livro.sha256) erros.push("Auditoria não cobre a versão da fonte externa.");
  let temLivro = false;
  for (const parcela of registro.parcelas ?? []) {
    const fontes = parcela.fontes ?? [];
    const markdown = fontes.filter(f => normalizar(f.caminho) === normalizar(livro.caminho));
    temLivro ||= markdown.length > 0;
    for (const fonte of fontes) {
      const nome = path.basename((fonte.caminho ?? "").replaceAll("\\", "/"));
      if (/Livro de Regras\.md$/i.test(nome) && !markdown.includes(fonte)) erros.push("Cópia de Markdown não autorizada: " + parcela.parcela);
      if (/Livro de Regras\.pdf$/i.test(nome) && (!markdown.length || fonte.uso !== "desempate" || !fonte.motivoDesempate?.trim())) erros.push("PDF do Livro de Regras usado sem desempate documentado e fonte Markdown: " + parcela.parcela);
    }
    for (const fonte of markdown) {
      if (fonte.sha256 !== livro.sha256 && !fonte.versao?.includes(livro.sha256)) erros.push("Parcela usa versão de Markdown não autorizada: " + parcela.parcela);
      const paginas = Array.isArray(fonte.paginaImpressa) ? fonte.paginaImpressa : [fonte.paginaImpressa];
      const marcadores = Array.isArray(fonte.marcadorPagina) ? fonte.marcadorPagina : [fonte.marcadorPagina];
      if (!paginas.length || paginas.length !== marcadores.length || paginas.some((p, i) => !Number.isInteger(p) || p < livro.paginasImpressas.inicio || p > livro.paginasImpressas.fim || marcadores[i] !== "<!-- página " + p + " -->")) erros.push("Citação sem página impressa e marcador correspondente: " + parcela.parcela);
    }
  }
  if (exigeLivro && !temLivro) erros.push("Lote mapeado para o Livro de Regras sem parcela que cite o Markdown.");
  return erros;
}
