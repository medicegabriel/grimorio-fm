import guerra from "../../../addons/guerra-de-feiticeiros.json" with { type: "json" };
import equipamentos from "../../../addons/criacao-de-equipamentos.json" with { type: "json" };
import { aceitaFichaEclesiastes } from "./regras";

const regrasDoJogador = guerra.porSistema.player;
const TALENTOS_INICIAIS_PADRAO = 0;
const ajustesDaEdicao = {
  progressaoEpica: { rotulo: "Calamidade" },
  talentosIniciais: { padrao: TALENTOS_INICIAIS_PADRAO },
};
export const ID_TREINO_TR_ECLESIASTES = `${guerra.id}:tr`;

// Mantém os IDs do addon original para aproveitar as escolhas de fichas antigas.
export const GUERRA_NATIVA = {
  ...guerra,
  ajustes: guerra.ajustes.map((ajuste) => ({ ...ajuste, ...ajustesDaEdicao[ajuste.id] })),
  acrescenta: {
    ...guerra.acrescenta,
    treinamentos: guerra.acrescenta.treinamentos.map((treino) => treino.id === "tr" ? {
      ...treino,
      etapas: treino.etapas.map((etapa) => etapa.n === 4 ? { ...etapa, beneficio: treino.completo.beneficio } : etapa),
      completo: {
        beneficio: "Alcançando o ápice do seu conhecimento sobre esse Teste de Resistência, você quebra os limites do imaginável no uso dele. Você recebe metade do seu bônus de treinamento ao realizar o Teste de Resistência escolhido.",
        efeitos: [{ canal: "bonusTR", alvo: "instancia", expr: "piso(bt / 2)" }],
      },
    } : treino),
  },
  absorve: guerra.absorve.filter((id) => id !== equipamentos.id),
  permite: guerra.permite.filter((id) => !equipamentos.permite.includes(id)),
  libera: guerra.libera.filter((id) => !equipamentos.libera.includes(id)),
  incompativeis: guerra.incompativeis.filter((id) => !equipamentos.incompativeis.includes(id)),
  migra: {
    ...guerra.migra,
    talentosIniciais: {
      ...guerra.migra.talentosIniciais,
      senao: TALENTOS_INICIAIS_PADRAO,
    },
  },
  porSistema: {
    ...guerra.porSistema,
    player: {
      ...regrasDoJogador,
      substitui: {
        ...regrasDoJogador.substitui,
        treinosEspeciais: regrasDoJogador.substitui.treinosEspeciais.map((treino) => treino.id === "tes_habilidade"
          ? { ...treino, descricao: treino.descricao.replace("12 + metade do seu nível", "12") }
          : treino),
      },
    },
  },
};

export const guerraNativaNaFicha = (ficha, id) =>
  id === GUERRA_NATIVA.id && aceitaFichaEclesiastes(ficha);
