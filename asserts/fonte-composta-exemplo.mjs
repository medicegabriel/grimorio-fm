/**
 * Fonte COMPOSTA neutra para os testes dos mecanismos (composição por sistema e por
 * ajuste, hidratação, absorção, registro e instalação). Ela é montada só com conteúdo
 * dos pacotes públicos do repositório, e por isso os testes que sobem com o projeto
 * não dependem de nenhum pacote privado. Não é rodada pelo lançador: o nome não
 * começa com `t-`.
 */
import { readFileSync } from "node:fs";

const antigo = (id) => JSON.parse(readFileSync(new URL("../addons/" + id + ".json", import.meta.url), "utf8"));

export const ID_EXEMPLO = "exemplo-composto";

/** Um objeto novo a cada chamada: o teste pode mexer nele à vontade. */
export function fonteExemplo() {
  const alto = antigo("player-alto-nivel-afty");
  return {
    id: ID_EXEMPLO,
    nome: "Exemplo Composto",
    versao: "1.0.0",
    autor: "Teste",
    paraRaw: "afty",
    descricao: "Fonte neutra de teste dos mecanismos de pacote composto.",
    resumo: "Fonte neutra de teste dos pacotes compostos",
    categoria: "regras",
    ajustes: [
      { id: "modoForte", tipo: "interruptor", rotulo: "Modo Forte", padrao: false, sistemas: ["player"] },
      { id: "talentosIniciais", tipo: "inteiro", rotulo: "Talentos Iniciais", min: 0, max: 4, padrao: 1, regrasAfty: "talentosIniciais" },
    ],
    absorve: ["alma-do-afty", "talentos-iniciais", "treino-de-tr", "talentos-de-estilo", "regras-grimorio", "ascendendo-alem-dos-ceus"],
    parciais: [
      { id: "player-progressao-epica", sistemas: ["player"], aviso: "Falta no exemplo: o orçamento de Interlúdios." },
    ],
    migra: {
      modoForte: { ligaSeTem: ["ascendendo-alem-dos-ceus"] },
      talentosIniciais: { copiaDe: "talentos-iniciais", regrasAfty: "talentosIniciais", senao: 0 },
    },
    incompativeis: ["criacao-de-armas"],
    regrasAfty: { trNoLimiteDePericias: true },
    acrescenta: {
      talentos: antigo("talentos-de-estilo").acrescenta.talentos,
      treinamentos: antigo("treino-de-tr").acrescenta.treinamentos,
    },
    porSistema: {
      player: {
        regrasAfty: { almaComoAfty: true, multiplicadorPvFinal: 2 },
        libera: ["soPorAddon:len_versatilidade_extrema", "soPorAddon:tal_alma_livre", "soPorAddon:atributo"],
        substitui: {
          melhoriasSuperiores: alto.substitui.melhoriasSuperiores.slice(0, 2),
          lendarias: alto.substitui.lendarias.slice(0, 2),
          treinosEspeciais: antigo("treino-de-habilidade-afty").substitui.treinosEspeciais,
        },
      },
      afty: {},
    },
    porAjuste: {
      modoForte: { player: { regrasAfty: { multiplicadorPvFinal: 3, pontosAtributoPorCiclo: 3 } } },
    },
  };
}
