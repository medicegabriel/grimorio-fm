/**
 * ============================================================
 * MODELO DE DADOS: FICHA DE CRIATURA - F&M 2.5
 * ============================================================
 * Separação entre dados ESTÁTICOS (definidos na criação)
 * e dados DINÂMICOS (alterados durante combate).
 * Essa separação permite "resetar" a ficha ao estado inicial
 * sem perder a configuração original.
 * ============================================================
 */

const CreatureSchema = {
  // ---------- IDENTIFICAÇÃO ----------
  id: "uuid-v4-gerado",
  name: "Maldição Especial do Desastre",
  createdAt: "2026-04-17T10:00:00Z",
  updatedAt: "2026-04-17T10:00:00Z",
  portraitUrl: null, // opcional, imagem da criatura

  // ---------- DEFINIÇÃO BASE (ESTÁTICO) ----------
  core: {
    grau: "1", // "4", "3", "2", "1", "especial"
    nd: 15, // Nível de Desafio (1-30 dependendo do patamar)
    patamar: "calamidade", // "lacaio" | "capanga" | "comum" | "desafio" | "calamidade"
    difficulty: "intermediario", // "iniciante" | "intermediario" | "experiente"
    origin: {
      type: "maldicao", // "maldicao" | "feiticeiro" | "nao_feiticeiro" | "restringido" | "corpo_amaldicoado"
      subtype: "medo", // para maldições: "comum"|"medo"|"vingativo"|"vingativo_imaginario"|"enfermo"
      hasAumentoEnergia: true,
    },
    size: "medio", // minusculo, pequeno, medio, grande, enorme, colossal
    bonusTreinamento: 5, // calculado a partir do ND (+2 a +6)
  },

  // ---------- ATRIBUTOS (ESTÁTICO) ----------
  attributes: {
    forca: 14,
    destreza: 18,
    constituicao: 22,
    inteligencia: 16,
    sabedoria: 14,
    presenca: 18,
  },

  // ---------- NÍVEIS DE APTIDÃO (ESTÁTICO) ----------
  aptidoes: {
    ea: 5,   // Energia Amaldiçoada
    cl: 4,   // Controle e Leitura
    bar: 2,  // Barreira
    dom: 3,  // Domínio
    er: 0,   // Energia Reversa
  },

  // ---------- STATS CALCULADOS (ESTÁTICO) ----------
  // Preenchido automaticamente via tabelas, mas editável
  stats: {
    hpMax: 2700,
    peMax: 45,
    defesa: 22,
    atencao: 29,
    iniciativa: 17,
    deslocamento: 18, // em metros
    espaco: 1.5,
    guardaInabavalMax: 39, // vida temp recebida todo início de rodada
    rdGeral: 12,
    rdIrredutivel: 9,
    ignorarRd: 10,
    vidaTempPorAtaque: 8,
    resistenciaParcialMax: 5,
    resistenciaTotalMax: 3,
  },

  // ---------- TESTES DE RESISTÊNCIA (ESTÁTICO) ----------
  saves: {
    astucia: 22,
    fortitude: 24,
    reflexos: 20,
    vontade: 20,
    integridade: 18, // alma (opcional)
  },

  // ---------- PERÍCIAS (ESTÁTICO) ----------
  skills: [
    { name: "Atletismo", mod: 20, mastered: true },
    { name: "Feitiçaria", mod: 25, mastered: true },
    { name: "Percepção", mod: 18, mastered: false },
  ],

  // ---------- RESISTÊNCIAS / IMUNIDADES (ESTÁTICO) ----------
  defenses: {
    resistencias: [
      { tipo: "queimante", nivel: "forte" },
    ],
    imunidades: [
      { tipo: "veneno", nivel: "extrema" },
    ],
    vulnerabilidades: [
      { tipo: "energia_reversa", nivel: "forte" },
    ],
    condicoesImunes: ["envenenado", "doenca"],
  },

  // ---------- AÇÕES (ESTÁTICO) ----------
  actions: {
    total: {
      comum: 5,
      rapida: 2,
      bonus: 1,
      movimento: 1,
      reacao: 1,
    },
    list: [
      {
        id: "act-1",
        name: "Garra Lacerante",
        type: "comum", // comum | bonus | rapida | movimento | reacao | livre
        cost: 0, // PE
        attackType: "acerto", // acerto | tr_individual | tr_area
        toHit: 23,
        cd: null,
        trType: null, // "fortitude" | "reflexos" etc
        damage: {
          average: 70,
          roll: "6d10+37",
          type: "cortante",
        },
        range: "1.5m",
        area: null,
        conditions: [], // ex: [{ name: "sangramento", level: "fraca" }]
        description: "Ataque corpo a corpo com garras afiadas.",
      },
    ],
  },

  // ---------- CARACTERÍSTICAS / DOTES / APTIDÕES ----------
  features: [
    {
      id: "feat-1",
      category: "geral", // geral | especial | dote_geral | dote_amaldicoado | aptidao | treinamento
      name: "Fluxo",
      description: "Após errar 3 ataques, recebe +5 de acerto no próximo turno.",
      trigger: "passiva", // passiva | rodada | condicional
    },
  ],

  // ---------- NOTAS DO NARRADOR ----------
  narratorNotes: "",

  // ============================================================
  //                  ESTADO DE COMBATE (DINÂMICO)
  // ============================================================
  // Tudo que muda durante o combate fica aqui.
  // Ao "resetar", apenas essa parte é restaurada.
  combatState: {
    isActive: false,
    hpCurrent: 2700,
    peCurrent: 45,
    guardaInabavalCurrent: 39,
    resistenciaParcialUsed: 0,
    resistenciaTotalUsed: 0,
    integridadeCurrent: 100, // % de alma, se usar mecânica
    activeConditions: [
      // { id, name, level, duration, appliedAt, notes }
    ],
    temporaryHp: 0,
    isInDesafiandoMorte: false,
    missCounter: 0, // para feature "Fluxo"
    customCounters: [
      // { id, label, current, max } — para features custom
    ],
    combatLog: [
      // { timestamp, type, message } — histórico de alterações
    ],
  },
};

export default CreatureSchema;
