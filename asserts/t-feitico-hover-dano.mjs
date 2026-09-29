/* O hover do Dano no criador e o saldo do Somente Condição (autor, 2026-09-29).
   As parcelas de Dados têm de somar o número mostrado, e no Somente Condição
   as condições GASTAM dados, como no Feitiço comum. */
import { register } from "node:module";

register(
  "data:text/javascript,export async function resolve(s,c,n){try{return await n(s,c)}catch(e){if(s.startsWith(\".\")&&!s.endsWith(\".js\"))return n(s+\".js\",c);throw e}}",
  import.meta.url,
);

const R = new URL("../src/systems/afty/", import.meta.url).href;
const { calcularFeiticoDano, createBlankFeitico } = await import(R + "afty-feiticos.js");

let ok = 0;
const bad = [];
const t = (nome, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok += 1;
  else bad.push(`${nome}\n  real:     ${JSON.stringify(real)}\n  esperado: ${JSON.stringify(esperado)}`);
};

// Soma as linhas de dados (entre a seção Dados e a próxima seção), ignorando suplantadas.
const numDe = (texto) => {
  const m = /^([+−]?)([\d,]+)d\d+/.exec(texto);
  if (!m) return NaN;
  const n = Number(m[2].replace(",", "."));
  return m[1] === "−" ? -n : n;
};
function somaDados(partes) {
  let soma = 0; let dentro = false; let subtotal = null;
  for (const p of partes) {
    if (p.secao) { dentro = p.secao === "Dados"; if (dentro) subtotal = numDe(p.texto); continue; }
    if (!dentro || p.suplantado) continue;
    soma += numDe(p.texto);
  }
  return { soma: Math.round(soma * 100) / 100, subtotal };
}
function somaSemSecao(partes) {
  return Math.round(partes.filter((p) => !p.suplantado).reduce((s, p) => s + numDe(p.texto), 0) * 100) / 100;
}
const feitico = (extra) => ({ ...createBlankFeitico(), tipo: "dano", ...extra, trocas: { ...createBlankFeitico().trocas, ...(extra.trocas || {}) } });
const ctx = { nd: 20, cdBase: 20, modTecnica: 4 };

// 1. Nível 3, Resistência, Alvo Único, Comum = 12d8.
{
  const c = calcularFeiticoDano(feitico({ nivel: 3, resolucao: "tr", alvo: "unico", acao: "comum" }), ctx);
  const { soma, subtotal } = somaDados(c.hoverDano.partes);
  t("base: dados", c.dados, 12);
  t("base: soma = subtotal", soma, subtotal);
  t("base: subtotal = dados", subtotal, c.dados);
  t("base: rótulo base", c.hoverDano.partes[1], { label: "Nível 3", texto: "12d8" });
  t("base: total", c.hoverDano.total, c.dano);
  t("base: sem Critável", c.hoverDano.partes.filter((p) => p.secao).map((p) => p.secao), ["Dados", "Fixo"]);
  t("base: fixo = Conjuração", c.hoverDano.partes.find((p) => p.label === "Conjuração Aprimorada")?.valor, 8);
}

// 2. Trocas, requisito, condições, empurrão.
{
  const c = calcularFeiticoDano(feitico({
    nivel: 3, resolucao: "tr", alvo: "unico", acao: "completa", requisito: "medio",
    trocas: { cd: 2, alcance: -6, empurraoDados: 1 },
    condicoes: [{ nome: "Abalado", forca: "fraca" }], sangramento: "fraco",
  }), ctx);
  const { soma, subtotal } = somaDados(c.hoverDano.partes);
  t("trocas: soma = subtotal", soma, subtotal);
  t("trocas: subtotal = dados", subtotal, c.dados);
  t("trocas: linhas", c.hoverDano.partes.map((p) => p.label ?? p.secao).slice(0, 9),
    ["Dados", "Nível 3", "Ação Completa", "Requisito Médio", "CD +2", "Alcance −6 m", "Empurrão 6 m", "Abalado", "Sangramento Fraca"]);
}

// 3. Área com meio dado: 6m de alcance e arredondamento.
{
  const c = calcularFeiticoDano(feitico({ nivel: 3, alvo: "area", formaArea: "linha", acao: "comum", trocas: { alcance: 6 } }), ctx);
  const { soma, subtotal } = somaDados(c.hoverDano.partes);
  t("área: soma = subtotal", soma, subtotal);
  t("área: subtotal = dados", subtotal, c.dados);
  t("área: meio dado", c.hoverDano.partes.find((p) => p.label === "Alcance +6 m")?.texto, "−0,5d12");
  t("área: arredondamento", c.hoverDano.partes.find((p) => p.label === "Arredondamento")?.texto, "−0,5d12");
  t("área: linha", c.hoverDano.partes.find((p) => p.label === "Linha")?.texto, "+2d12");
}

// 4. Teto das trocas: reduzir demais não passa do teto.
{
  const c = calcularFeiticoDano(feitico({ nivel: 2, resolucao: "tr", alvo: "unico", acao: "comum", trocas: { cd: -3, alcance: -12 } }), ctx);
  const { soma, subtotal } = somaDados(c.hoverDano.partes);
  t("teto: soma = subtotal", soma, subtotal);
  t("teto: subtotal = dados", subtotal, c.dados);
  t("teto: linha", !!c.hoverDano.partes.find((p) => p.label === "Teto das Trocas"), true);
}

// 5. Piso de 1 dado.
{
  const c = calcularFeiticoDano(feitico({ nivel: 1, resolucao: "tr", alvo: "unico", acao: "bonus", trocas: { cd: 2 } }), ctx);
  const { soma, subtotal } = somaDados(c.hoverDano.partes);
  t("piso: dados", c.dados, 1);
  t("piso: soma = subtotal", soma, subtotal);
  t("piso: faltam", c.faltamDados > 0, true);
}

// 6. Múltiplos Disparos: fecha em um disparo.
{
  const c = calcularFeiticoDano(feitico({ nivel: 3, subtipo: "multiplos", resolucao: "ataque", alvo: "unico", acao: "comum", disparos: 3 }), ctx);
  const { soma, subtotal } = somaDados(c.hoverDano.partes);
  t("múltiplos: subtotal = porDisparo", subtotal, c.disparos.porDisparo);
  t("múltiplos: soma = subtotal", soma, subtotal);
  t("múltiplos: total", c.hoverDano.total, c.dano);
}

// 7. Destrutivo.
{
  const c = calcularFeiticoDano(feitico({ nivel: 5, subtipo: "destrutivo", alvo: "area", acao: "ritual", ignorarResistencias: true, morteDireta: true }), ctx);
  const { soma, subtotal } = somaDados(c.hoverDano.partes);
  t("destrutivo: soma = subtotal", soma, subtotal);
  t("destrutivo: subtotal = dados", subtotal, c.dados);
}

// 8. Somente Condição: exemplo do autor. Nível 3 TR único Comum 12d8, Cego −5, CD +2 → 5.
{
  const c = calcularFeiticoDano(feitico({
    nivel: 3, resolucao: "tr", alvo: "unico", acao: "comum", focoCondicao: true,
    trocas: { cd: 2 }, condicoes: [{ nome: "Cego", forca: "forte" }],
  }), ctx);
  t("foco: a distribuir", c.dadosADistribuir, 5);
  t("foco: sem hover de dano", c.hoverDano, null);
  t("foco: soma do hover", somaSemSecao(c.hoverADistribuir.partes), 5);
  t("foco: total", c.hoverADistribuir.total, "5d8");
  t("foco: faltam 0", c.faltamDados, 0);
  t("foco: dano texto", c.dano, "Somente Condição");
}
// 8b. Somente Condição com falta.
{
  const c = calcularFeiticoDano(feitico({
    nivel: 1, resolucao: "tr", alvo: "unico", acao: "comum", focoCondicao: true,
    condicoes: [{ nome: "Agarrado", forca: "media" }, { nome: "Abalado", forca: "fraca" }],
  }), ctx);
  t("foco falta: a distribuir", c.dadosADistribuir, -1);
  t("foco falta: faltam", c.faltamDados, 1);
  t("foco falta: total", c.hoverADistribuir.total, "−1d8");
}
// 8c. Somente Condição com saldo zerado não acusa falta.
{
  const c = calcularFeiticoDano(feitico({
    nivel: 1, resolucao: "tr", alvo: "unico", acao: "comum", focoCondicao: true,
    condicoes: [{ nome: "Agarrado", forca: "media" }],
  }), ctx);
  t("foco zero: a distribuir", c.dadosADistribuir, 0);
  t("foco zero: faltam", c.faltamDados, 0);
  t("foco zero: sem aviso de falta", c.avisos.some((a) => a.startsWith("Faltam")), false);
}
// 9. Feitiço comum ainda paga as condições igual.
{
  const c = calcularFeiticoDano(feitico({ nivel: 3, resolucao: "tr", alvo: "unico", acao: "comum", condicoes: [{ nome: "Cego", forca: "forte" }] }), ctx);
  t("comum: 12 − 5", c.dados, 7);
  t("comum: sem a distribuir", c.dadosADistribuir, null);
}

console.log(bad.length
  ? `FALHAS (${bad.length}):\n${bad.join("\n")}`
  : `TODOS OS ${ok} ASSERTS PASSARAM`);
process.exitCode = bad.length ? 1 : 0;
