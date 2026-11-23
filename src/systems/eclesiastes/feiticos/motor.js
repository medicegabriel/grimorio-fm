/**
 * PASSIVOS DE ECLESIASTES NO MOTOR (2026-11-23)
 *
 * Um Passivo compra Efeitos Auxiliares, e cada um vira uma linha do Motor do
 * Afty no MESMO formato dos Passivos de hoje (`efeitosDosPassivos`,
 * `afty-efeitos.js`): origem `feitico:<id>` (a que a Exaustão de Técnica e a
 * Técnica Inata bloqueada suprimem) e a família `feiticoAuxiliarPassivo`, então
 * bônus de Feitiços diferentes na mesma característica disputam o pool e vale o
 * maior (decisão do autor, 2026-11-22).
 *
 * ⚠ A RD É LÍQUIDA NO AGREGADO, NUNCA POR FEITIÇO. O texto manda usar só a
 * maior entre RD Geral, por Grupo e por Tipo, e o autor restringiu isso às RDs
 * de Feitiço. O canal `rdTipo` SOMA com `rdGeral`, então um Feitiço com RD Geral
 * 8 e outro com RD contra Fogo 12 dariam 20 se cada um emitisse a sua. Aqui sai
 * uma `rdGeral` com a maior Geral (G) e, por tipo, `rdTipo` = max(0, T − G),
 * onde T é a maior entre Grupo e Tipo que alcança aquele tipo.
 *
 * Os efeitos que dependem de interruptor (Condicional e Semiativo) só entram
 * com o estado ligado, lido de `creature.combate` como os Auxiliares ligados de
 * hoje (só valem com Em Combate). O derive refaz a conta a cada clique.
 */

export const estadoDoPassivoEcl = (id) => `passivoEcl_${id}`;

const ehLigado = (creature, id) => !!(creature?.combate?.ativo && creature.combate[estadoDoPassivoEcl(id)]);

/** Os efeitos de um Passivo que valem agora. */
export function efeitosVigentesDoPassivo(creature, calc) {
  const f = calc.feitico;
  const modo = f.passivo.modo;
  const ligado = ehLigado(creature, f.id);
  return calc.efeitos.filter((e) => {
    if (e.sentido !== "bonus" || !e.valor) return false;
    if (modo === "condicional" && e.condicional) return ligado;
    if (modo === "semiativo" && e.ativado) return ligado;
    return true;
  });
}

/**
 * Linhas do Motor de todos os Passivos de Eclesiastes da ficha.
 * `calculados`: [{ f, calc }] do `calcularFeiticosEcl`. `tiposDaCategoria(id)`: os
 * tipos de dano de um grupo (vem do derive, que já importa o equipamentos).
 */
export function linhasDoMotorEcl(creature, calculados, { tiposDaCategoria = () => [] } = {}) {
  const linhas = [];
  let rdGeral = null;
  const rdPorTipo = new Map();
  for (const { calc } of calculados) {
    const f = calc.feitico;
    if (f.natureza !== "passivo") continue;
    const nome = f.nome.trim() || "Passivo";
    const temporario = f.passivo.modo !== "permanente";
    const base = { origem: `feitico:${f.id}`, nome, exclusivo: "feiticoAuxiliarPassivo" };
    const linha = (canal, valor, alvo, e) => {
      const ef = { ...base, canal, expr: String(valor) };
      if (alvo) ef.alvo = alvo;
      if (temporario && (e.condicional || e.ativado)) ef.duracao = "temporaria";
      linhas.push(ef);
    };
    for (const e of efeitosVigentesDoPassivo(creature, calc)) {
      if (e.efeito === "rdGeral") {
        if (!rdGeral || e.valor > rdGeral.valor) rdGeral = { valor: e.valor, base };
        continue;
      }
      if (e.efeito === "rdTipo" || e.efeito === "rdGrupo") {
        const tipos = e.efeito === "rdTipo" ? [e.escolha].filter(Boolean) : tiposDaCategoria(e.escolha);
        for (const tipo of tipos) {
          const atual = rdPorTipo.get(tipo);
          if (!atual || e.valor > atual.valor) rdPorTipo.set(tipo, { valor: e.valor, base });
        }
        continue;
      }
      if (!e.canal) continue;
      if (e.efeito === "atributoLimite") {
        linha("atributo", e.valor, e.escolha, e);
        linha("limiteAtributo", e.valor, e.escolha, e);
        continue;
      }
      const precisaEscolha = e.efeito === "tr" || e.efeito === "pericia" || e.efeito === "atributo" || e.efeito === "limiteAtributo";
      if (precisaEscolha && !e.escolha) continue;
      linha(e.canal, e.valor, precisaEscolha ? e.escolha : null, e);
    }
  }
  const g = rdGeral?.valor ?? 0;
  if (rdGeral) linhas.push({ ...rdGeral.base, canal: "rdGeral", expr: String(g) });
  for (const [tipo, { valor, base }] of rdPorTipo) {
    const liquido = Math.max(0, valor - g);
    if (liquido) linhas.push({ ...base, canal: "rdTipo", alvo: tipo, expr: String(liquido) });
  }
  return linhas;
}

/** Os interruptores dos Passivos Condicional e Semiativo, no formato de `estadosExtras`. */
export function estadosDosPassivosEcl(calculados) {
  return calculados
    .filter(({ calc }) => calc.feitico.natureza === "passivo" && calc.feitico.passivo.modo !== "permanente")
    .map(({ calc }) => ({
      id: estadoDoPassivoEcl(calc.feitico.id),
      label: calc.feitico.nome.trim() || "Passivo",
      tipo: "bool",
    }));
}
