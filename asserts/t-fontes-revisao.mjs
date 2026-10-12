import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { hashFonte, chaveFonte, verificarLivro, paginaImpressa, validarFontesRegistro } from "../scripts/revisao-automacao/fontes.mjs";

let ok = 0;
function t(nome, acao) { acao(); ok++; console.log("ok " + nome); }
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "revisao-fonte-"));
const repo = path.join(temp, "repo");
fs.mkdirSync(repo);
const livro = path.join(temp, "F&M 2.5.2 - Livro de Regras.md");
const proveniencia = path.join(temp, "correcoes.md");
const texto = "Nota da conversão\n<!-- página 1 -->\nTítulo\n| Valor | Regra |\n| 2 | Texto |\nContinuação\n<!-- página 2 -->\nOutro trecho";
fs.writeFileSync(livro, texto);
fs.writeFileSync(proveniencia, "Correção conferida");
const politica = { livroRegras: { caminho: livro, proveniencia, sha256: hashFonte(livro), paginasImpressas: { inicio: 1, fim: 2 } } };
const hashes = { [livro]: politica.livroRegras.sha256 };
function registro() {
  return {
    estado: "IMPLEMENTADO, AGUARDA AUDITORIA",
    fonteLivroRegras: { caminho: livro, sha256: politica.livroRegras.sha256 },
    base: { hashesIniciais: { ...hashes }, hashesFinais: { ...hashes } },
    parcelas: [{ parcela: "Bônus", fontes: [{ caminho: livro, versao: "2.5.2; sha256=" + politica.livroRegras.sha256, paginaImpressa: 1, marcadorPagina: "<!-- página 1 -->", local: "Página impressa 1" }] }],
    auditoria: { hashesExaminados: {} }
  };
}
try {
  t("texto e sequência de páginas confirmados", () => assert.equal(verificarLivro(politica).paginas, 2));
  t("texto antes do primeiro marcador não recebe página inventada", () => assert.equal(paginaImpressa(texto, 1), null));
  t("tabela usa último marcador acima", () => assert.equal(paginaImpressa(texto, 5), 1));
  t("continuação usa a mesma página", () => assert.equal(paginaImpressa(texto, 6), 1));
  t("próximo marcador muda a página", () => assert.equal(paginaImpressa(texto, 8), 2));
  t("linha fora do texto é rejeitada", () => assert.throws(() => paginaImpressa(texto, 99)));
  t("fonte canônica externa tem chave absoluta", () => assert.equal(chaveFonte(repo, livro, politica), livro));
  t("proveniência externa autorizada", () => assert.equal(chaveFonte(repo, proveniencia, politica), proveniencia));
  t("arquivo no repositório conserva chave relativa", () => assert.equal(chaveFonte(repo, "docs/a.md", politica), "docs/a.md"));
  t("cópia na pasta pai não ganha autorização", () => assert.equal(chaveFonte(repo, path.join(temp, "antigo.md"), politica), null));
  t("registro da fonte e marcador válidos", () => assert.deepEqual(validarFontesRegistro(registro(), politica, hashes, true), []));
  t("lote do livro precisa de parcela que cite o Markdown", () => { const r = registro(); r.parcelas = []; assert.ok(validarFontesRegistro(r, politica, hashes, true).length); });
  t("versão anterior em parcela é recusada", () => { const r = registro(); r.parcelas[0].fontes[0].versao = "2.5.2"; assert.ok(validarFontesRegistro(r, politica, hashes).length); });
  t("mesma edição com hash trocado é recusada", () => { const r = registro(); r.fonteLivroRegras.sha256 = "antigo"; assert.ok(validarFontesRegistro(r, politica, hashes).length); });
  t("página com marcador divergente é recusada", () => { const r = registro(); r.parcelas[0].fontes[0].marcadorPagina = "<!-- página 2 -->"; assert.ok(validarFontesRegistro(r, politica, hashes).length); });
  t("hash externo faltante impede aprovação", () => assert.ok(validarFontesRegistro(registro(), politica, {}).length));
  t("auditoria precisa examinar o hash do livro", () => { const r = registro(); r.estado = "APROVADO"; assert.ok(validarFontesRegistro(r, politica, hashes).length); r.auditoria.hashesExaminados = { ...hashes }; assert.deepEqual(validarFontesRegistro(r, politica, hashes), []); });
  t("PDF usado sozinho é recusado", () => { const r = registro(); r.parcelas[0].fontes = [{ caminho: "public/docs/F&M 2.5.2 - Livro de Regras.pdf" }]; assert.ok(validarFontesRegistro(r, politica, hashes).length); });
  t("desempate documentado conserva Markdown principal", () => { const r = registro(); r.parcelas[0].fontes.push({ caminho: "public/docs/F&M 2.5.2 - Livro de Regras.pdf", uso: "desempate", motivoDesempate: "Conferir símbolo de uma tabela." }); assert.deepEqual(validarFontesRegistro(r, politica, hashes), []); });
  t("cópia anterior do Markdown é recusada", () => { const r = registro(); r.parcelas[0].fontes[0].caminho = path.join(repo, "F&M 2.5.2 - Livro de Regras.md"); assert.ok(validarFontesRegistro(r, politica, hashes).length); });
  t("fonte malformada gera erro em vez de derrubar validação", () => { const r = registro(); r.parcelas[0].fontes[0].caminho = undefined; assert.ok(validarFontesRegistro(r, politica, hashes, true).length); });
  t("mudança de bytes é recusada", () => { fs.writeFileSync(livro, texto + "\nMudança"); assert.equal(verificarLivro(politica).erros[0].codigo, "HASH_FONTE_DIVERGENTE"); });
  t("páginas fora de ordem são recusadas mesmo com hash atualizado", () => { fs.writeFileSync(livro, "<!-- página 2 -->\n<!-- página 1 -->"); const p = structuredClone(politica); p.livroRegras.sha256 = hashFonte(livro); assert.equal(verificarLivro(p).erros[0].codigo, "MARCADORES_INVALIDOS"); });
  t("fonte removida é recusada", () => { fs.unlinkSync(livro); assert.equal(verificarLivro(politica).erros[0].codigo, "FONTE_INDISPONIVEL"); });
  console.log("TODOS OS " + ok + " ASSERTS PASSARAM");
} finally {
  const rel = path.relative(os.tmpdir(), temp);
  if (!rel.startsWith("..") && path.basename(temp).startsWith("revisao-fonte-")) fs.rmSync(temp, { recursive: true, force: true });
}
