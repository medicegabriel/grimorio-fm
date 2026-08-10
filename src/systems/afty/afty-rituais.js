/**
 * ============================================================
 * CONJURAÇÃO EM RITUAL
 * ============================================================
 * Regra-base e catálogo de Melhorias de Ritual, transcritos do livro enviado
 * pelo autor em 2026-08-09. Este módulo não lê React nem armazenamento. Ele
 * recebe a ação-base e a configuração daquele uso e devolve números fechados
 * para os calculadores e para a Ficha Final.
 *
 * A ação `ritual` já existia no Afty para Destrutivos e Cataclísmicos. Ela
 * significa Ritual Estendido obrigatório. Para as demais ações, `ativo` indica
 * que o personagem decidiu aumentar a conjuração naquele uso.
 * ============================================================
 */

export const RITUAL_MELHORIAS = [
  {
    id: "ajusteAlvos",
    nome: "Ajuste de Alvos",
    max: 1,
    descricao:
      "Você pode aplicar esta melhoria em um Feitiço em área, prevenindo certas criaturas de " +
      "serem alvos. Ao escolher Ajuste de Alvos, escolha uma quantidade de criaturas igual a 2 " +
      "+ o nível do Feitiço para terem um sucesso garantido no Teste de Resistência dele.",
  },
  {
    id: "aumentoAlcance",
    nome: "Aumento de Alcance",
    max: 1,
    descricao:
      "O alcance do Feitiço é aumentado em um valor igual a 1,5 metros multiplicado pelo nível " +
      "do Feitiço.",
  },
  {
    id: "aumentoDano",
    nome: "Aumento de Dano",
    max: 2,
    descricao:
      "Você aumenta o dano causado pelo feitiço. Para cada vez que colocar esta melhoria, seu " +
      "feitiço causará dano adicional igual a 4 multiplicado pelo nível dele. Você pode escolher " +
      "esta melhoria até duas vezes.",
  },
  {
    id: "aumentoPrecisao",
    nome: "Aumento de Precisão",
    max: 2,
    descricao:
      "Você aumenta a precisão do feitiço. Para cada vez que escolher esta melhoria, você recebe " +
      "+2 na rolagem de ataque do Feitiço. Você pode escolher esta melhoria até duas vezes.",
  },
  {
    id: "conversaoSustento",
    nome: "Conversão de Sustento",
    max: 1,
    descricao:
      "Você modifica o método para manter o feitiço. Quando utilizar um feitiço sustentado, caso " +
      "escolha essa melhoria, ele deixa de ser Sustentado mas exige passa a exigir Concentração.",
  },
  {
    id: "expansaoArea",
    nome: "Expansão de Área",
    max: 2,
    descricao:
      "Você expande a área afetada pelo feitiço. Um feitiço em área com esta melhoria tem a sua " +
      "área expandida em 1,5 metros para cada vez que for escolhida (ou 4,5 metros caso seja em " +
      "linha). Você pode escolher esta melhoria até duas vezes.",
  },
  {
    id: "potencializacaoDificuldade",
    nome: "Potencialização de Dificuldade",
    max: 2,
    descricao:
      "Você potencializa o feitiço, de maneira a ser mais difícil resistir aos seus efeitos. Para " +
      "cada vez que escolher esta melhoria, a CD do feitiço aumenta em 2. Você pode escolher esta " +
      "melhoria até duas vezes.",
  },
  {
    id: "potencializacaoEfeito",
    nome: "Potencialização de Efeito",
    max: 1,
    descricao:
      "Você potencializa o efeito do seu feitiço. Um feitiço com esta melhoria tem um dos seus " +
      "benefícios numéricos (aumento de DEF, RD, bônus em rolagem etc.) aumentado em um valor " +
      "igual ao nível do feitiço caso seja Imediata ou em metade do nível do feitiço caso seja " +
      "Duradoura ou Sustentada. Para efeitos que concedam dados adicionais, você aumenta o nível " +
      "dos dados adicionais em 6 caso seja Imediata ou em 3 caso seja Duradoura ou Sustentada.",
  },
];

export const RITUAL_MELHORIA_BY_ID = Object.fromEntries(
  RITUAL_MELHORIAS.map((melhoria) => [melhoria.id, melhoria]),
);

const ACAO_SEGUINTE = {
  bonus: "comum",
  comum: "completa",
  completa: "ritual",
  ritual: "ritual",
};

const inteiroNaoNegativo = (valor) => Math.max(0, Math.trunc(Number(valor) || 0));

export function nivelNumericoRitual(nivel) {
  return nivel === "max" ? 6 : inteiroNaoNegativo(nivel);
}

export function normalizaMelhoriasRitual(melhorias) {
  const origem = melhorias && typeof melhorias === "object" ? melhorias : {};
  return Object.fromEntries(RITUAL_MELHORIAS.map((def) => [
    def.id,
    Math.min(def.max, inteiroNaoNegativo(origem[def.id])),
  ]));
}

export function quantidadeMelhoriasRitual(melhorias) {
  return Object.values(normalizaMelhoriasRitual(melhorias)).reduce((soma, valor) => soma + valor, 0);
}

export function cdConjuracaoRitual(nivel, melhorias) {
  const n = nivelNumericoRitual(nivel);
  return 10 + (n === 0 ? 1 : 2 * n) + 2 * inteiroNaoNegativo(melhorias);
}

/**
 * Resolve a configuração de UM uso.
 *
 * `extraRitualista` apenas amplia o limite. A ficha é quem controla os usos por
 * Descanso Longo e só o oferece para quem possui a habilidade.
 */
export function resolveRitual({
  nivel, acaoBase, configuracao, extraRitualista = false, dispensaTeste = false,
} = {}) {
  const config = configuracao && typeof configuracao === "object" ? configuracao : {};
  const base = acaoBase || "comum";
  const forcado = base === "ritual";
  const proibido = base === "reacao";
  const ativo = !proibido && (forcado || !!config.ativo);
  const estendido = ativo && (forcado || base === "completa");
  const limiteBase = !ativo ? 0 : estendido ? 5 : base === "bonus" ? 1 : 2;
  const limiteExtra = ativo && extraRitualista ? 1 : 0;
  const melhorias = ativo ? normalizaMelhoriasRitual(config.melhorias) : normalizaMelhoriasRitual(null);
  const quantidade = quantidadeMelhoriasRitual(melhorias);
  const limite = limiteBase + limiteExtra;
  return {
    ativo,
    forcado,
    proibido,
    estendido,
    acaoBase: base,
    acaoFinal: ativo ? ACAO_SEGUINTE[base] ?? base : base,
    limiteBase,
    limiteExtra,
    limite,
    melhorias,
    quantidade,
    restante: limite - quantidade,
    excedeu: quantidade > limite,
    cd: ativo && !estendido && !dispensaTeste ? cdConjuracaoRitual(nivel, quantidade) : null,
    dispensaTeste: ativo && !estendido && !!dispensaTeste,
    exigeTeste: ativo && !estendido && !dispensaTeste,
  };
}

/** Números diretos das melhorias, antes de cada calculador aplicar seu escopo. */
export function bonusRitual(ritual, nivel) {
  const m = ritual?.melhorias ?? {};
  const n = nivelNumericoRitual(nivel);
  return {
    alvosProtegidos: m.ajusteAlvos ? 2 + n : 0,
    alcance: (m.aumentoAlcance || 0) * 1.5 * n,
    dano: (m.aumentoDano || 0) * 4 * n,
    acerto: (m.aumentoPrecisao || 0) * 2,
    converteSustento: (m.conversaoSustento || 0) > 0,
    expansaoArea: m.expansaoArea || 0,
    cd: (m.potencializacaoDificuldade || 0) * 2,
    potencializaEfeito: (m.potencializacaoEfeito || 0) > 0,
  };
}
