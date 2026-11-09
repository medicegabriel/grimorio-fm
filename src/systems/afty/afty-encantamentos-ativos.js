/**
 * ============================================================
 * OS 16 ENCANTAMENTOS ATIVOS DE UNIFORME E ESCUDO (CX5, 2026-11-06)
 * ============================================================
 * Livro p.154 (Cargas de Encantamento), p.158 (Escudos) e p.159 e 160 (Uniformes). Os 11 encantamentos
 * PASSIVOS das duas listas já entram no Motor enquanto o item está equipado (`afty-equipamentos.js`). Estes
 * 16 dependem de reação, carga, ataque ou de outra criatura, e a descrição de cada um continua VERBATIM no
 * catálogo. Aqui mora só o que a mesa FAZ: a ação, a carga, o limite e os números que a ficha sabe calcular.
 * A operação que lê esta tabela é `ficha/ficha-encantamentos.js`.
 *
 * ⚠ MÓDULO FOLHA, ZERO IMPORTS (mesma razão de `afty-itens-uso.js`).
 *
 * ------------------------------------------------------------
 * O QUE A FICHA RESOLVE E O QUE ELA NÃO RESOLVE
 * ------------------------------------------------------------
 * A ficha confere o acesso (equipado, pré-requisito, carga, reação, uma vez por turno), gasta a carga e a
 * reação UMA vez, registra a duração e devolve os NÚMEROS (CD, dados, distância, chance de falha). O que
 * acontece com OUTRA criatura (o TR de quem foi empurrado, o dano em quem agarra) é da mesa: a ficha não
 * decide fatos narrativos nem conhece a posição de ninguém. A aplicação em outra ficha é do CX6 (Pacotes).
 *
 *   cargas     true: gasta uma carga do POOL DA FERRAMENTA. O número de cargas é o BT e é compartilhado por
 *              todos os encantamentos com cargas da mesma ferramenta (p.154). Volta no descanso
 *   acao       "livre" | "movimento" | "reacao" | "bonus", conferida pelo contrato de uso
 *   limite     { por: "turno", max } como "uma vez por turno" do Distorcivo
 *   duracao    { ate } do estado que o uso deixa ligado
 *   ativa      false: não há operação, o encantamento é um GATILHO PASSIVO e só tem números (Escaldante)
 *   numeros    (ctx) => objeto. ctx = { bt, cd, modCon, movimento, grau, dadoDoEscudo }
 *   lembretes  o que a regra pede e a ficha NÃO resolve, em frases curtas
 * ============================================================
 */

export const TIPOS_DE_TR_DO_ESTIMULANTE = ["fortitude", "reflexos", "vontade"];

export const ENCANTAMENTOS_ATIVOS = Object.freeze({
  /* ---------- UNIFORME ---------- */
  enc_unif_aeronauta: {
    tipo: "uniforme", acao: "reacao", duracao: { ate: "cena" },
    numeros: () => ({ quedaPorTurno: 6 }),
    lembretes: ["Planar encerra quando chegar ao chão"],
  },
  enc_unif_distorcivo: {
    tipo: "uniforme", cargas: true, acao: "livre", limite: { por: "turno", max: 1 },
    numeros: () => ({ deslocamento: 6, semAtaqueDeOportunidade: true }),
    lembretes: ["Ver ou perceber para onde se move"],
  },
  enc_unif_escaldante: {
    tipo: "uniforme", ativa: false,
    // O texto não diz qual TR. Decisão do autor (2026-11-06): Fortitude, como o Repulsor e o Revestido com Espinhos.
    numeros: ({ bt, cd }) => ({ tr: "fortitude", cd, dados: Math.floor(bt / 2), faces: 6, metadeNoSucesso: true, refazNoInicioDoTurno: true }),
    lembretes: ["Vale para quem agarra o portador ou é agarrado por ele"],
  },
  enc_unif_estimulante: {
    tipo: "uniforme", cargas: true, acao: "reacao",
    parametros: [{ id: "tr", tipo: "opcao", opcoes: TIPOS_DE_TR_DO_ESTIMULANTE, rotulo: "Teste de Resistência" }],
    numeros: (ctx, valores) => ({ vantagemEm: valores?.tr ?? null }),
  },
  enc_unif_impulso: {
    tipo: "uniforme", cargas: true, acao: "movimento",
    // O texto não traz a CD do TR de Reflexos. Decisão do autor (2026-11-06): a CD da ficha do portador.
    numeros: ({ movimento, cd }) => ({ linha: 2 * movimento, dano: "1d10", porMetros: 6, tr: "reflexos", cd, metadeNoSucesso: true }),
  },
  enc_unif_repulsor: {
    tipo: "uniforme", cargas: true, acao: "reacao",
    numeros: ({ cd }) => ({ raio: 1.5, tr: "fortitude", cd, empurra: 3, empurraNoSucesso: 1.5 }),
    lembretes: ["Reação a um ataque corpo a corpo"],
  },
  enc_unif_revestido_espinhos: {
    tipo: "uniforme", ativa: false,
    numeros: ({ bt, cd, modCon }) => ({ tr: "fortitude", cd, dados: bt, faces: 6, fixo: modCon, tipo: "perfurante", metadeNoSucesso: true }),
    lembretes: ["Vale contra ataque corpo a corpo de agressor adjacente"],
  },
  enc_unif_ricochete: {
    tipo: "uniforme", cargas: true, acao: "reacao", duracao: { ate: "inicioDoProximoTurno" },
    numeros: () => ({ chanceDeFalha: 50, chancePassiva: 20, d10AteOu: 5, d10PassivoAteOu: 2 }),
    lembretes: ["Reação a um ataque a distância"],
  },

  /* ---------- ESCUDO ---------- */
  enc_esc_espinhoso: { tipo: "escudo", ataque: true, niveisDeDano: 1, numeros: () => ({ niveisDeDano: 1 }) },
  enc_esc_destruidor: { tipo: "escudo", ataque: true, niveisDeDano: 2, numeros: () => ({ niveisDeDano: 2 }) },
  enc_esc_avassalador: { tipo: "escudo", ataque: true, niveisDeDano: 3, numeros: () => ({ niveisDeDano: 3 }) },
  enc_esc_disco: {
    tipo: "escudo", ativa: false, numeros: () => ({ arremesso: { alcance: 6, maximo: 18 } }),
  },
  enc_esc_bloqueador: {
    tipo: "escudo", ativa: false, numeros: () => ({ meiaCoberturaAtras: 1.5 }),
    lembretes: ["O efeito é de outra criatura"],
  },
  enc_esc_esponja: {
    tipo: "escudo", acao: "reacao",
    parametros: [{ id: "queda", tipo: "bool", exige: true, rotulo: "Queda ou Dano de Estrutura" }],
    numeros: ({ grau }) => ({ reducao: grau >= 4 ? 20 : grau === 3 ? 15 : 10 }),
  },
  enc_esc_expansao: {
    tipo: "escudo", acao: "bonus", duracao: { ate: "cena" },
    numeros: () => ({ distancia: 1.5, criaturas: 1 }),
    lembretes: ["O efeito é de outra criatura"],
  },
  enc_esc_intangivel: {
    tipo: "escudo", ativa: false, numeros: () => ({ naoOcupaMao: true }),
    lembretes: ["Não permite empunhar ou carregar outros objetos"],
  },
});

/** Os ids dos 16, na ordem do livro: oito de Uniforme e oito de Escudo. */
export const IDS_ATIVOS = Object.freeze(Object.keys(ENCANTAMENTOS_ATIVOS));
export const encantamentoAtivo = (id) => ENCANTAMENTOS_ATIVOS[id] ?? null;
