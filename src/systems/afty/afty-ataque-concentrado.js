import { comFormulasDeDano, gruposDaLinha } from "./afty-dano";
import { resolverEfeitosDanoFinal, valorCanalEscopos } from "./afty-efeitos";

const inteiro = (v) => Math.max(0, Math.trunc(Number(v) || 0));

// Decisão do autor em 2026-10-05: estes dados pertencem a um único golpe,
// a uma manobra ou ao golpe do aliado. Atroz, Pistoleiro e Execução Silenciosa
// são pagos por ataque e participam das metades, assim como os bônus duradouros.
const FONTES_FORA = new Set([
  "lut_manobra_ajuste", "lut_manobra_desarme", "lut_manobras_finalizadoras",
  "res_ataque_furtivo", "res_arremetida_encoberta", "res_golpe_impactante",
  "buff:aliados_bancada",
]);

export function fonteParticipaDoConcentrado(fonte, origensDaFonte = (id) => [id]) {
  return !origensDaFonte(fonte?.origem).some((id) => FONTES_FORA.has(id));
}

export function efeitoDeAtaqueConcentrado(efeito, origensDaFonte = (id) => [id]) {
  return efeito?.canal === "dadosDano"
    && origensDaFonte(efeito.origem).includes("cmb_ataque_concentrado");
}

/**
 * Roda depois de Auxiliares, Sintonizada e Aptidões. Soma os dados elegíveis por
 * tamanho antes de calcular as metades. O crítico é calculado separadamente,
 * antes de dobrar os dados, para incluir Mortal, Fatal e os bônus só no crítico.
 * Nenhuma concentração passa a fazer parte da base das seguintes.
 */
export function aplicarAtaqueConcentradoNoDano(dano, {
  efeitos = [], contexto = {}, jaAplicado = {}, vezes = 0,
} = {}) {
  const n = inteiro(vezes);
  if (!n || !efeitos.length) return dano;
  return { ...dano, entradas: (dano?.entradas ?? []).map((linha) => {
    if (!["arma", "basico"].includes(linha.fonte)) return linha;
    const grupos = gruposDaLinha(linha);
    const escopos = linha.escoposDano ?? [linha.fonte];
    const avaliar = (dados) => inteiro(valorCanalEscopos(
      resolverEfeitosDanoFinal(efeitos, contexto, dados, jaAplicado), "dadosDano", escopos,
    ));
    if (!avaliar(2)) return linha;
    const bonusNoModo = (critico) => {
      const porFaces = new Map();
      for (const g of grupos) {
        if (g.momento === "apos" || g.concentra === false || (!critico && g.apenasCritico)) continue;
        const dados = inteiro(g.dadosConcentraveis ?? g.dados);
        const faces = inteiro(critico && g.facesCritico ? g.facesCritico : g.faces);
        if (dados && faces > 1) porFaces.set(faces, (porFaces.get(faces) ?? 0) + dados);
      }
      const bonus = new Map([...porFaces].map(([faces, dados]) => [faces, avaliar(dados)]));
      // O mínimo é um dado por concentração para o ataque inteiro, não para
      // cada fonte adicional ou tamanho de dado.
      const soma = [...bonus.values()].reduce((s, v) => s + v, 0);
      if (porFaces.size && soma < n) {
        const maior = Math.max(...porFaces.keys());
        bonus.set(maior, (bonus.get(maior) ?? 0) + n - soma);
      }
      return bonus;
    };
    const normal = bonusNoModo(false);
    const critico = bonusNoModo(true);
    const adicionais = [...new Set([...normal.keys(), ...critico.keys()])]
      .sort((a, b) => b - a)
      .map((faces) => {
        const dados = normal.get(faces) ?? 0;
        const dadosCritico = critico.get(faces) ?? 0;
        return {
          nome: "Ataque Concentrado", dados: dados || dadosCritico, faces, fixo: 0,
          momento: "durante", multiplica: true, naPartes: true, concentra: false,
          ...(!dados ? { apenasCritico: true } : dados !== dadosCritico ? { dadosCritico } : {}),
        };
      }).filter((g) => g.dados > 0);
    if (!adicionais.length) return linha;
    const dadosExtras = [...normal.values()].reduce((s, v) => s + v, 0);
    const media = Math.floor([...normal].reduce((s, [faces, qtd]) => s + qtd * (faces + 1) / 2, 0));
    const dadosDaArma = grupos.filter((g) => ["Ataque", "Golpe Especial"].includes(g.nome) && !g.apenasCritico)
      .reduce((s, g) => s + inteiro(g.dadosConcentraveis ?? g.dados), 0);
    const extrasDaArma = dadosDaArma ? Math.max(n, avaliar(dadosDaArma)) : 0;
    const partes = adicionais.map((g) => ({
      label: `${g.nome}${g.apenasCritico ? " (Só no Crítico)" : ""}`,
      texto: `+${g.dados}d${g.faces}${g.dadosCritico != null ? ` (${g.dadosCritico}d${g.faces} no crítico)` : ""}`,
      categoria: "critavel",
    }));
    return comFormulasDeDano({
      ...linha,
      dados: inteiro(linha.dados) + dadosExtras,
      dadosExtras: inteiro(linha.dadosExtras) + dadosExtras,
      dadosPropriosArma: inteiro(linha.dadosPropriosArma) + extrasDaArma,
      total: (linha.total ?? 0) + media,
      gruposDano: [...grupos, ...adicionais],
      partes: [
        ...(linha.partes ?? []), ...partes,
        ...((linha.partes ?? []).some((p) => p.categoria === "total") && media
          ? [{ label: "Ataque Concentrado (média)", valor: media, categoria: "total" }] : []),
      ],
    });
  }) };
}
