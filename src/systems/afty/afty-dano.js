const inteiro = (valor, min = 0) => Math.max(min, Math.trunc(Number(valor) || 0));

export function gruposDaLinha(linha = {}) {
  if (Array.isArray(linha.gruposDano) && linha.gruposDano.length) return linha.gruposDano;
  return [{
    nome: linha.nome || "Ataque",
    dados: inteiro(linha.dados),
    faces: inteiro(String(linha.dado ?? linha.faces ?? 6).replace(/^d/i, ""), 2),
    fixo: Math.trunc(Number(linha.fixo) || 0),
    momento: "durante",
    multiplica: true,
  }];
}

export const grupoMultiplicavel = (grupo) =>
  grupo?.momento !== "apos" && grupo?.multiplica !== false;

const termoDoGrupo = (grupo, multiplicadorDados = 1, modo = "normal") => {
  const dados = inteiro(grupo?.dados) * multiplicadorDados;
  const faces = inteiro(modo === "critico" && grupo?.facesCritico ? grupo.facesCritico : grupo?.faces, 2);
  const fixo = Math.trunc(Number(grupo?.fixo) || 0);
  const partes = [];
  if (dados) partes.push(`${dados}d${faces}`);
  if (fixo) partes.push(String(fixo));
  return partes.join(" + ").replace(/\+ -/g, "− ") || "0";
};

export function formulaModoDano(grupos, modo = "normal") {
  const lista = (Array.isArray(grupos) ? grupos : [])
    .filter((g) => modo === "critico" || !g.apenasCritico);
  if (modo === "critico") {
    return lista.map((g) => termoDoGrupo(g, grupoMultiplicavel(g) ? 2 : 1, modo)).join(" + ");
  }
  if (modo === "raio_negro") {
    const dentro = lista.filter(grupoMultiplicavel).map((g) => termoDoGrupo(g)).join(" + ") || "0";
    const fora = lista.filter((g) => !grupoMultiplicavel(g)).map((g) => termoDoGrupo(g)).join(" + ");
    return `(${dentro}) ÷ 2 × 3${fora ? ` + ${fora}` : ""}`;
  }
  return lista.map((g) => termoDoGrupo(g)).join(" + ");
}

export function comFormulasDeDano(linha) {
  const gruposDano = gruposDaLinha(linha);
  return {
    ...linha,
    gruposDano,
    formulaNormal: formulaModoDano(gruposDano, "normal"),
    formulaCritico: formulaModoDano(gruposDano, "critico"),
    formulaRaioNegro: formulaModoDano(gruposDano, "raio_negro"),
  };
}
