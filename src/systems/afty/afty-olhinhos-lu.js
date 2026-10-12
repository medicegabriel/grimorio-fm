// Condição corporal no padrão do Vislumbre Celeste. Módulo folha.
export const ESTADO_OLHOS_LU = "olhinhosLuFechados";
export const ESTADO_ATENCAO_LU = "olhinhosLuAtencao";
export const OLHINHOS_LU_NOME = "Olhinhos Lu( Corpo Principal )";
export const OLHINHOS_LU_TEXTO = "Enquanto de olhos estiverem fechados de alguma forma, o Coded Gigas fornece os seguintes efeitos:\n\nPRO:\n- Enquanto com os olhos fechados Ciel recebe 3x seu Nível de Controle e Leitura em Intuição. (Arredondado para Cima)\n\n- Pode mudar o Calculo de Atenção para usar Intuição, além de poder trocar Testes de Percepção por Intuição.\n\n- Consegue enxergar por Técnicas de Barreiras, além de conseguir ativamente ver os Limites de um Domínio e enxergar o Domínio Inato das pessoas.";

// A leitura ignora Em Combate, como olhosDescobertos do Vislumbre Celeste.
// Os campos antigos ficam apenas como fallback de fichas já preparadas.
export function estadoOlhinhosLu(creature) {
  const combate = creature?.combate ?? {};
  const antigos = creature?.origemContadores ?? {};
  return {
    fechados: !!(combate[ESTADO_OLHOS_LU] ?? antigos["olhinhos-lu:olhos_fechados"]),
    usarIntuicao: !!(combate[ESTADO_ATENCAO_LU] ?? antigos["olhinhos-lu:atencao_intuicao"]),
  };
}

export function estadosDosOlhinhosLu({ tem = false } = {}) {
  if (!tem) return [];
  return [
    { id: ESTADO_OLHOS_LU, label: "Olhos fechados", tipo: "bool", title: OLHINHOS_LU_TEXTO },
    { id: ESTADO_ATENCAO_LU, label: "Atenção com Intuição", tipo: "bool" },
  ].map((e) => ({ ...e, dono: { id: "olhinhosLu", label: OLHINHOS_LU_NOME } }));
}

export function efeitosDosOlhinhosLu({ tem = false, fechados = false, usarIntuicao = false } = {}) {
  if (!tem || !fechados) return [];
  return [
    { canal: "bonusPericia", alvo: "intuicao", expr: "teto(3 * cl)" },
    ...(usarIntuicao ? [{ canal: "periciaAtencao", alvo: "intuicao", expr: "1" }] : []),
  ].map((e) => ({ ...e, origem: "olhinhos_lu", nome: "Olhinhos Lu", duracao: "permanente" }));
}

export function resolveOlhinhosLu({ tem = false, fechados = false, usarIntuicao = false, cl = 0 } = {}) {
  const nivel = Math.max(0, Number(cl) || 0);
  return {
    tem, fechados, usarIntuicao, cl: nivel,
    bonusIntuicao: tem && fechados ? Math.ceil(3 * nivel) : 0,
    atencaoIntuicao: tem && fechados && usarIntuicao,
    nome: OLHINHOS_LU_NOME, texto: OLHINHOS_LU_TEXTO,
  };
}

export function alteraOlhinhosLu(sessao, id, valor) {
  if (![ESTADO_OLHOS_LU, ESTADO_ATENCAO_LU].includes(id)) return sessao;
  return { ...sessao, combate: { ...(sessao?.combate ?? {}), [id]: !!valor } };
}
