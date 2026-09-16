/** Condição corporal. Estrutura baseada no módulo afty-vislumbre-celeste.js.
 * Textos fornecidos pelo autor, decisões em docs/afty-olhos-agulha.md.
 * Módulo folha: nenhuma dependência de catálogo ou da interface.
 */
export const AGULHA_OLHOS = "olhosAgulhaRestantes";
export const AGULHA_USOS = "olhosAgulha:olhar";
export const AGULHA_VOTO = "Voto Contratual: Lealdade Inviolável";
export const AGULHA_TEXTO = "Os Olhos de Agulha são uma condição corporal intrínseca do Clã Akutame, assim como o portador dos Seis Olhos está destinado a proteger a portadora do Plasma Estelar. O portador dos Olhos de Agulha, nasce com um pacto intrínseco para proteger o atual Santo da Espada, dando ao usuário um dever inquebrável e a capacidade de enxergar de forma aguçada cada mínimo detalhe.\n\nAo começar com os Olhos de Agulha, você abdica do seu livre arbítrio e recebe obrigatoriamente o Voto Contratual: Lealdade Inviolável. Em compensação, o usuário recebe os seguintes efeitos.\n\n- Metade do seu Bônus de Treinamento em Rolagens de Percepção.\n- Se torna imune às condições: Cego.(A menos que seja por ferimento complexo)\n\nCaso venha a perder um Olho, os benefícios são cortados pela metade. Caso venha a perder ambos, você perde acesso aos benefícios. Ainda precisando seguir à risca o Voto Contratual.";
export const AGULHA_HABILIDADES_TEXTO = "Usuários perspicazes dos Olhos de Agulha são capazes de expandir suas capacidades, evoluindo além do comum e explorando outras capacidades que o mesmo pode o fornecer. Nesta seção, você poderá encontrar habilidades ativas e passivas para os Olhos de Agulha, descritas nas mesmas o nível de liberação mínimo para sua utilização.";
export const AGULHA_HABILIDADES = [
  {
    id: "olhos-de-agulha:olhar", chave: "olhar", nome: "Olhar que Não Falha", niveis: [2, 4],
    textos: {
      2: "Sua visão começa a captar detalhes que escapam ao olho comum. Você recebe Metade do BT como Vantagem em testes de Percepção vezes por descanso longo, pode realizar um teste de percepção com vantagem(expressões, movimentos sutis, itens escondidos à vista).Seu PE Máximo diminui em 4.",
      4: "A quantidade de Vantagens passa a ser BT vezes por descanso longo, pode realizar um teste de percepção com vantagem. Seu PE Máximo diminui em 8.",
    },
  },
  {
    id: "olhos-de-agulha:precisao", chave: "precisao", nome: "Precisão Infalível", niveis: [3],
    textos: { 3: "Com um olhar superior a maioria dos homens, ataques a longa distância se tornaram algo cotidiano para você. Quando atacando alvos além do alcance normal (p. 307), você não recebe Desvantagem. Seu PE Máximo diminui em 6." },
  },
  {
    id: "olhos-de-agulha:visao", chave: "visao", nome: "Olhos que Tudo Veem", niveis: [3],
    textos: { 3: "Seu campo de visão se expande consideravelmente. Você pode realizar testes de Percepção para notar coisas além do alcance normal de visão (até o Dobro da distância usual). Além de receber visão às cegas de 12m. Seu PE Máximo diminui em 6." },
  },
];

const inteiro = (v, padrao = 0) => Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : padrao;
export const habilidadeOcularAgulha = (feitico) => feitico?.tipo === "passivo"
  ? AGULHA_HABILIDADES.find((h) => h.id === feitico.id) ?? null : null;
export const olhosAgulhaRestantes = (creature) => Math.max(0, Math.min(2,
  inteiro(creature?.combate?.[AGULHA_OLHOS] ?? creature?.core?.[AGULHA_OLHOS] ?? 2, 2)));

/** Passivas comuns: vagas e custo seguem a lista de Feitiços da ficha. */
export function modeloPassivaAgulha(id, nivel) {
  const def = AGULHA_HABILIDADES.find((h) => h.id === id);
  if (!def?.niveis.includes(nivel)) return null;
  return { id, nome: def.nome, tipo: "passivo", nivel, descricao: def.textos[nivel], efeitosPassivo: [], variacaoDe: null };
}

export function resolveOlhosAgulha(creature, { tem = false, bt = 0, nivelMax = 1 } = {}) {
  const olhos = olhosAgulhaRestantes(creature);
  const fator = olhos / 2;
  const habilidades = AGULHA_HABILIDADES.map((def) => {
    const f = (creature?.feiticos ?? []).find((x) => x.id === def.id && x.tipo === "passivo" && !x.variacaoDe);
    const nivel = f && def.niveis.includes(Number(f.nivel)) ? Number(f.nivel) : 0;
    return { ...def, nivel, ativa: tem && olhos > 0 && nivel > 0 && nivel <= nivelMax };
  });
  const olhar = habilidades.find((h) => h.chave === "olhar");
  const visao = habilidades.find((h) => h.chave === "visao");
  const precisao = habilidades.find((h) => h.chave === "precisao");
  const treino = Math.max(0, inteiro(bt));
  return {
    tem, olhos, nivelMax, habilidades,
    pericia: tem ? Math.floor(Math.floor(treino / 2) * fator) : 0,
    usosMax: olhar.ativa ? Math.floor((olhar.nivel === 4 ? treino : Math.floor(treino / 2)) * fator) : 0,
    visaoCega: visao.ativa ? Math.floor(12 * fator) : 0,
    visaoAmpliada: visao.ativa && olhos === 2,
    imuneCego: tem && olhos > 0,
    precisao: precisao.ativa,
  };
}

/** O bônus corporal acumula com Feitiços. Nunca integra o pool exclusivo. */
export function efeitosOlhosAgulha(v) {
  if (!v.tem) return [];
  return v.pericia ? [{ canal: "bonusPericia", alvo: "percepcao", expr: String(v.pericia), nome: "Olhos de Agulha", origem: "olhos_agulha" }] : [];
}

export const usosAgulhaGastos = (sessao) => Math.max(0, inteiro(sessao?.usos?.[AGULHA_USOS]));
export function usarOlharAgulha(sessao, maximo) {
  const gastos = usosAgulhaGastos(sessao);
  if (gastos >= maximo) return sessao;
  return { ...sessao, usos: { ...sessao.usos, [AGULHA_USOS]: gastos + 1 } };
}
export function devolverOlharAgulha(sessao) {
  return { ...sessao, usos: { ...sessao.usos, [AGULHA_USOS]: Math.max(0, usosAgulhaGastos(sessao) - 1) } };
}
export function definirOlhosAgulha(sessao, olhos) {
  return { ...sessao, combate: { ...sessao.combate, [AGULHA_OLHOS]: Math.max(0, Math.min(2, inteiro(olhos, 2))) } };
}
