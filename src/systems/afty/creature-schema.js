/**
 * ============================================================
 * MODELO DE DADOS: CRIATURA — GRIMÓRIO AFTY (homebrew)
 * ============================================================
 * ESPECIFICAÇÃO v0 — rascunho para reação, ainda NÃO ligado ao app.
 *
 * Este é um SISTEMA próprio, não uma versão da 2.5.2. A forma do
 * documento é diferente. Só a casca (Tela Inicial, Encontros,
 * Modelos, pastas, storage) é compartilhada.
 *
 * Princípio central (igual à 2.5.2): GUARDA-SE ESCOLHAS, NUNCA
 * RESULTADOS. HP, Defesa, Acerto, Dano — tudo é recalculado por
 * derive() a cada abertura da ficha. Aqui só ficam as escolhas.
 *
 * Diferença crucial do motor: os cálculos do Afty são FÓRMULA
 * MATEMÁTICA (nível 1→∞, sem teto), não lookup em tabela.
 *
 * Campos marcados [TBD] têm forma provisória, a confirmar com o
 * livro do Afty. Campos [FIM] só entram nas fases finais.
 * ============================================================
 */

const AftyCreatureSchema = {
  // ---------- IDENTIFICAÇÃO ----------
  id: "uuid-v4",
  system: "afty",          // discrimina o sistema — o dashboard usa pra abrir o builder/ficha certos
  rulesVersion: "afty",    // já plantado no storage; redundante com system por ora, mantido por consistência
  name: "Nome da Criatura",
  createdAt: "2026-07-14T00:00:00Z",
  updatedAt: "2026-07-14T00:00:00Z",
  editLog: [],
  portraitUrl: null,
  portraitFocus: { x: 50, y: 50 },

  // ---------- NÚCLEO / ARQUÉTIPO (ESTÁTICO) ----------
  core: {
    // O TIPO é o DRIVER do cálculo. Cada tipo pende para um perfil de stats.
    // combatente → mais Defesa/RD | conjurador → mais CD/derivado | misto → equilíbrio
    // restringido → perfil próprio (menos recursos, condições especiais)
    tipo: "combatente",    // "combatente" | "misto" | "conjurador" | "restringido"

    // Nível total. 1 → ∞. SEM teto. É o principal insumo das fórmulas.
    nivel: 20,

    tamanho: "medio",      // reaproveita a escala de tamanho da 2.5.2

    // Origens do Afty diferem das da 2.5.2 — forma provisória. [TBD]
    origem: {
      type: null,          // ids das origens do Afty
      subtype: null,
      opcoes: {},          // escolhas dependentes da origem
    },
  },

  // ---------- ATRIBUTOS (ESTÁTICO) ----------
  // Assunção v0: mesmos 6 atributos da 2.5.2. Confirmar. [TBD]
  attributes: {
    forca: 10,
    destreza: 10,
    constituicao: 10,
    inteligencia: 10,
    sabedoria: 10,
    presenca: 10,
  },

  // ---------- ESPECIALIZAÇÕES (classes) + MULTICLASSE (ESTÁTICO) ----------
  // Regra: até 2 especializações; soma dos níveis === core.nivel.
  // NÃO alteram cálculo diretamente — só destravam/escalam Habilidades.
  // O validador do builder garante: length <= 2 && sum(nivel) === core.nivel.
  especializacoes: [
    { id: "esp-exemplo-a", nivel: 12 },
    { id: "esp-exemplo-b", nivel: 8 },
  ],

  // ---------- HABILIDADES DE ESPECIALIZAÇÃO (ex-Dotes) (ESTÁTICO) ----------
  // Cada habilidade PERTENCE a uma especialização, exige pré-req de nível
  // NELA, e escala com esse nível (e outros fatores). Guarda-se só o pick +
  // escolhas do usuário; o efeito mecânico vive no catálogo de conteúdo.
  habilidades: [
    {
      id: "hab-exemplo",
      especializacaoId: "esp-exemplo-a", // dona da habilidade (define o pré-req/escala)
      escolhas: {},                       // sub-escolhas quando a habilidade pede
    },
  ],

  // ---------- ITENS: EQUIPAR + SLOTS (ESTÁTICO) ----------
  // Itens ocupam Espaços. Podem ter Encantamentos e Encantamentos Especiais.
  // TUDO realimenta os cálculos (Defesa/Acerto/Dano) via lista de efeitos
  // (reaproveita a DSL de modificadores já existente no projeto).
  itens: [
    {
      id: "item-exemplo",
      name: "Item Exemplo",
      equipped: true,
      espacos: 2,                      // Espaços de Itens que ocupa
      slot: null,                      // slot de equipamento, se houver [TBD]
      encantamentos: [                 // { id, escolhas } — efeitos comuns
        { id: "enc-exemplo", escolhas: {} },
      ],
      encantamentosEspeciais: [        // { id, escolhas } — efeitos especiais
        { id: "enc-esp-exemplo", escolhas: {} },
      ],
      // Efeitos crus opcionais (modificadores diretos) além dos encantamentos.
      efeitos: [],                     // usa a mesma DSL de fm-modifiers
    },
  ],

  // ---------- PERÍCIAS / TESTES (ESTÁTICO) ---------- [TBD forma exata]
  skills: [],   // { name, mod, mastered } — provisório, espelha 2.5.2
  saves: {},    // provisório

  // ---------- AÇÕES E CARACTERÍSTICAS (ESTÁTICO) ---------- [FIM]
  // Padrão do JOGADOR (quase 100% compatíveis criatura↔jogador). 100% diferentes
  // das atuais da 2.5.2, mais complexas. Exceção: Ataque Básico tem dano
  // simplificado na criatura (facilita cálculo manual na mesa).
  // Estrutura detalhada trabalhada nas fases finais — placeholder por ora.
  acoes: [],
  caracteristicas: [],

  // ---------- ALTO NÍVEL (21+) ---------- [FIM]
  // Só relevantes quando core.nivel >= 21. Abas próprias no builder/ficha.
  melhoriasSuperiores: [],   // Melhorias Superiores
  habilidadesLendarias: [],  // Habilidades Lendárias

  // ---------- STATS DERIVADOS (CACHE, calculado por derive()) ----------
  // Preenchido por fórmula a partir de tipo + nivel + attributes + itens +
  // habilidades. Editável como override, igual à 2.5.2. Nunca é a fonte da
  // verdade — pode ser recomputado a qualquer momento.
  stats: {
    hpMax: 0, peMax: 0,
    defesa: 0, rdGeral: 0,
    cd: 0, acerto: 0,
    iniciativa: 0, deslocamento: 0,
    // ... demais derivados conforme as fórmulas do Afty forem definidas
    espacosItensMax: 0,   // capacidade total de Espaços de Itens (derivada)
  },

  narratorNotes: "",

  // ============================================================
  //                  ESTADO DE COMBATE (DINÂMICO)
  // ============================================================
  combatState: {
    isActive: false,
    hpCurrent: 0,
    peCurrent: 0,
    activeConditions: [],
    customCounters: [],
    combatLog: [],
  },
};

export default AftyCreatureSchema;
