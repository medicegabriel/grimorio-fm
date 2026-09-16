/* ============================================================ */
/* CRIAÇÃO DE EQUIPAMENTOS (Addon), FASE 4: ENCANTAMENTO DE GRAU ESPECIAL */
/* ============================================================ */
/*
 * A seção "Encantamentos de Grau Especial" do guia Criação de Equipamentos e
 * Itens 2.5.2, copiado sem mudança em `docs/afty-criacao-equipamentos-fonte.md`.
 * As perguntas e respostas estão em `docs/afty-criacao-equipamentos-decisoes.md`.
 *
 * As decisões do autor, todas de 2026-09-14:
 *   • O Encantamento de Grau Especial É a Habilidade Única da Ferramenta de Grau
 *     Especial, e a conta do guia aparece SÓ nela, e OPCIONAL: *"Deixe o Guia
 *     Novo como Opcional. Alguns efeitos unicos não são númericos ou são
 *     diferentes do guia atual"*. As linhas da conta SOMAM com as livres.
 *   • "Mod. de Atr." é escolha do jogador, UM ATRIBUTO POR EFEITO, e o valor
 *     acompanha o modificador atual.
 *   • RD (Grupo) é uma categoria de dano.
 *   • Níveis de Dano, Crítico e Ignorar RD valem na própria arma quando a
 *     Ferramenta é arma, e em toda linha de dano quando não é.
 *   • OBS²: cada efeito é dividido pela quantidade. O primeiro vale cheio, e cada
 *     efeito a mais escolhe entre entrar na divisão ou trazer a penalidade de
 *     metade do BT e valer cheio.
 *   • Melhorar um Encantamento Padrão dobra no Motor quando der, e conta como um
 *     efeito para a divisão e para a penalidade.
 *   • Técnica Inata: vincular um Feitiço, com avisos e contador de usos.
 *   • GUARDADOS PARA DEPOIS, porque ainda passam por revisão de outro
 *     colaborador: Alcance, o Tipo de Dano da Técnica e a Interação com Aptidões.
 *
 * ⚠ MÓDULO FOLHA, sem import nenhum. O `afty-equipamentos.js` o chama dentro do
 * `resolveFerramenta`.
 */

/* ------------------------------------------------------------ */
/* O TEXTO DO GUIA (verbatim, sem a marcação do documento)        */
/* ------------------------------------------------------------ */

export const TEXTO_ENCANTAMENTO = {
  abertura: "Um Encantamento de Grau Especial pode garantir bônus numéricos simples, os quais são aplicados ao usuário enquanto ele utiliza a Ferramenta, seguindo a tabela abaixo:",
  melhorar: "Você pode escolher melhorar um Encantamento Padrão, como Armazenadora, em vez de aplicar um dos efeitos acima, podendo dobrar seu valor numérico ou dobrar a quantidade de usos do encantamento, com exceção de Potente e Sintonizada, os quais não podem ser melhorados.",
  divisao: "Se seu Encantamento de Grau Especial for conceder mais de um dos bônus acima ao mesmo tempo, você pode dividir o valor total que receberia de todos os efeitos pela quantidade de efeitos adicionados no total (Mínimo 0). Você também pode, em vez disso, receber uma penalidade em um valor igual a metade do seu BT baseado em um dos valores da tabela para receber um efeito adicional. Ao fazer isso, a escolha de penalidade deve fazer sentido ao efeito adicionado (Como reduzir RD de um Grupo inteiro para ganhar o efeito de Níveis de Dano).",
  semHabilidades: "Encantamentos não podem conceder Habilidades de Especialização ou Talentos.",
  semRepetir: "Efeitos adicionados não podem ser repetidos.",
};

export const TEXTO_TECNICA_INATA = {
  feitico: "Você pode colocar um feitiço seu como Encantamento especial, o qual não terá custo para utilização. Ele ficará disponível para a utilização a partir de seu equipamento, podendo ser conjurado uma quantidade de vezes igual a metade do seu BT. Ele pode ser um Feitiço Auxiliar, Transformação, Cura ou Dano e deve seguir todas as regras de criação de feitiços. Feitiços aplicados em um Encantamento não podem ter seu Alcance reduzido, devido ao fato de que o Feitiço sempre é aplicado no Alcance da Ferramenta (Revestimentos e Escudos são considerados como 1,5m para esse efeito) e não podem receber benefícios de pré-requisito.        O Nível do Feitiço aplicado sempre deve ser 5.",
  condicoes: "Não pode ser usado um Feitiço que aplique condições Fortes ou Extremas",
  conjurar: "Utilizar um feitiço a partir do Encantamento é uma ação de Conjurar e não Atacar.",
  auxiliar: "Se for um Feitiço Auxiliar, ele sempre é considerado como Duradouro, não podendo ter os efeitos de uma Imediata ou Sustentada, durante uma quantidade de rodadas igual a metade do seu BT.",
};

/* ------------------------------------------------------------ */
/* A TABELA DE INTERAÇÕES SIMPLES                                 */
/* ------------------------------------------------------------ */
/* `guia` é o rótulo como está na tabela do documento (com o espaço duplo do
   original), e `label` é o da tela. `divisor` é o "/ 2" ou "/ 5" da fórmula, e
   `metros` marca o "1,5 * (...)". `escopoArma` marca o que vale na própria arma.

   ⚠ Alcance fica com `implementado: false`: o autor pediu para guardar, e não há
   canal de alcance na ficha. */
export const TABELA_INTERACOES = [
  { id: "tr", guia: "TR (Específico)", label: "TR (Específico)", divisor: 2, alvo: "tr" },
  { id: "iniciativaAtencao", guia: "Iniciativa e  Atenção", label: "Iniciativa e Atenção", divisor: 2 },
  { id: "rdGrupo", guia: "RD (Grupo)", label: "RD (Grupo)", divisor: 2, alvo: "categoria" },
  { id: "defesa", guia: "Defesa", label: "Defesa", divisor: 2 },
  { id: "acerto", guia: "Acerto(Geral)", label: "Acerto (Geral)", divisor: 2 },
  { id: "critico", guia: "Crítico", label: "Crítico", divisor: 5, escopoArma: true },
  { id: "deslocamento", guia: "Deslocamento", label: "Deslocamento", divisor: 2, metros: true },
  { id: "cd", guia: "Classe de Dificuldade", label: "Classe de Dificuldade", divisor: 1 },
  { id: "periciaGrupo", guia: "Perícia(Grupo do Atr.)", label: "Perícia (Grupo do Atributo)", divisor: 2 },
  { id: "ignorarRd", guia: "Ignorar RD", label: "Ignorar RD", divisor: 1, escopoArma: true },
  { id: "niveisDano", guia: "Níveis de Dano", label: "Níveis de Dano", divisor: 1, escopoArma: true },
  { id: "alcance", guia: "Alcance", label: "Alcance", divisor: 2, metros: true, implementado: false },
];
const INTERACAO = Object.fromEntries(TABELA_INTERACOES.map((l) => [l.id, l]));

/** O efeito que não é linha de tabela: melhorar um Encantamento Padrão. */
export const EFEITO_MELHORAR = "melhorar";
export const MODOS_MELHORAR = [
  { value: "valor", label: "Dobrar Valor" },
  { value: "usos", label: "Dobrar Usos" },
];
export const ENCANTAMENTOS_SEM_MELHORIA = ["enc_arma_potente", "enc_arma_sintonizada"];

/** O que o seletor oferece: a tabela implementada e a melhoria. */
export const efeitosDoEncantamento = () => [
  ...TABELA_INTERACOES.filter((l) => l.implementado !== false).map((l) => ({ value: l.id, label: l.label })),
  { value: EFEITO_MELHORAR, label: "Melhorar Encantamento Padrão" },
];

/* Os tipos de Feitiço que a Técnica Inata aceita: "Auxiliar, Transformação, Cura
   ou Dano". A Transformação é Especial de subtipo transformação. */
export const TIPOS_FEITICO_TECNICA = ["auxiliar", "curativo", "dano"];
export const SUBTIPO_TRANSFORMACAO = "transformacao";
export const FORCAS_PROIBIDAS = ["forte", "extrema"];

/* ------------------------------------------------------------ */
/* A RECEITA NA FERRAMENTA                                       */
/* ------------------------------------------------------------ */
/* `fa.guiaUnica = { ligada, efeitos: [{ tipo, atributo, alvo, penalidade,
   encantamento, modo }], feitico }`. A penalidade é `{ tipo, alvo }` ou `null`. */

const texto = (v) => (typeof v === "string" ? v : "");
const ATRIBUTOS = ["forca", "destreza", "constituicao", "inteligencia", "sabedoria", "presenca"];

function saneiaPenalidade(p) {
  if (!p || typeof p !== "object") return null;
  // ⚠ Escolhida e ainda sem tipo, fica marcada e a conta avisa. Zerar aqui
  // desligava o chip da Penalidade no mesmo clique que o ligava.
  if (!p.tipo) return { tipo: "", alvo: "", atributo: "" };
  if (!INTERACAO[p.tipo] || INTERACAO[p.tipo].implementado === false) return null;
  return { tipo: p.tipo, alvo: texto(p.alvo), atributo: ATRIBUTOS.includes(p.atributo) ? p.atributo : "" };
}

/** A receita saneada, ou `null` quando a Ferramenta não a tem. */
export function saneiaReceitaUnica(bruta) {
  if (!bruta || typeof bruta !== "object" || Array.isArray(bruta)) return null;
  const efeitos = (Array.isArray(bruta.efeitos) ? bruta.efeitos : [])
    .filter((e) => e && typeof e === "object")
    .map((e, i) => {
      const ehMelhorar = e.tipo === EFEITO_MELHORAR;
      const linha = INTERACAO[e.tipo];
      if (!ehMelhorar && (!linha || linha.implementado === false)) return { tipo: "" };
      return {
        tipo: e.tipo,
        atributo: ATRIBUTOS.includes(e.atributo) ? e.atributo : "",
        alvo: texto(e.alvo),
        // O primeiro efeito vale cheio e nunca traz penalidade.
        penalidade: i > 0 ? saneiaPenalidade(e.penalidade) : null,
        ...(ehMelhorar ? {
          encantamento: texto(e.encantamento),
          modo: MODOS_MELHORAR.some((m) => m.value === e.modo) ? e.modo : "valor",
        } : {}),
      };
    });
  return { ligada: !!bruta.ligada, efeitos, feitico: texto(bruta.feitico) };
}

export const novaReceitaUnica = () => ({ ligada: true, efeitos: [], feitico: "" });

/* ------------------------------------------------------------ */
/* AS LINHAS                                                     */
/* ------------------------------------------------------------ */

/** A expressão do valor cheio de um efeito, lida do modificador na hora. */
const exprCheia = (linha, atributo) => `max(0, piso(mod_${atributo} / ${linha.divisor}))`;

/**
 * As linhas do Motor que a receita emite, no formato das linhas da Habilidade
 * Única (`{ canal, alvo?, expr }`), e as melhorias de Encantamento Padrão.
 *
 * `armaId` é o id da arma quando a Ferramenta é uma arma, e é o alvo de Níveis
 * de Dano, Crítico e Ignorar RD. `tiposDaCategoria(cat)` devolve os tipos de dano
 * de uma categoria, que este módulo não conhece.
 *
 * ⚠ A DIVISÃO É POR EFEITO, com piso: o valor de cada um é dividido pela
 * quantidade de efeitos que entram na divisão (todos menos os que trouxeram
 * penalidade), e o Deslocamento divide os degraus de 1,5m.
 */
export function linhasDaReceitaUnica(receita, { armaId = null, tiposDaCategoria = () => [] } = {}) {
  const r = saneiaReceitaUnica(receita);
  const vazio = { linhas: [], melhorias: [], avisos: [] };
  if (!r || !r.ligada) return vazio;
  const avisos = [];
  const vistos = new Set();
  const validos = [];
  r.efeitos.forEach((e) => {
    if (!e.tipo) return;
    if (vistos.has(e.tipo)) { avisos.push({ id: `repetido:${e.tipo}`, texto: "Efeito repetido" }); return; }
    vistos.add(e.tipo);
    validos.push(e);
  });
  const naDivisao = validos.filter((e, i) => i === 0 || !e.penalidade).length || 1;

  const emitir = (tipo, { atributo, alvo }, expr, linhas) => {
    const escopo = armaId ? { alvo: armaId } : {};
    switch (tipo) {
      case "tr": if (alvo) linhas.push({ canal: "bonusTR", alvo, expr }); break;
      case "iniciativaAtencao":
        linhas.push({ canal: "iniciativa", expr }, { canal: "atencao", expr });
        break;
      case "rdGrupo":
        for (const t of alvo ? tiposDaCategoria(alvo) : []) linhas.push({ canal: "rdTipo", alvo: t, expr });
        break;
      case "defesa": linhas.push({ canal: "defesa", expr }); break;
      case "acerto": linhas.push({ canal: "bonusAcerto", expr }); break;
      case "critico": linhas.push({ canal: "margemCritico", ...escopo, expr }); break;
      case "deslocamento": linhas.push({ canal: "movimento", expr }); break;
      case "cd": linhas.push({ canal: "cd", expr }); break;
      case "periciaGrupo": if (atributo) linhas.push({ canal: "bonusPericia", alvo: `atr:${atributo}`, expr }); break;
      case "ignorarRd": linhas.push({ canal: "ignoraRD", ...escopo, expr }); break;
      case "niveisDano": linhas.push({ canal: "nivelDano", ...escopo, expr }); break;
      default: break;
    }
  };

  const linhas = [];
  const melhorias = [];
  validos.forEach((e, i) => {
    const comPenalidade = i > 0 && !!e.penalidade;
    if (e.tipo === EFEITO_MELHORAR) {
      if (!e.encantamento) avisos.push({ id: `melhorarSem:${i}`, texto: "Melhoria sem encantamento" });
      else if (ENCANTAMENTOS_SEM_MELHORIA.includes(e.encantamento)) avisos.push({ id: `melhorarProibido:${i}`, texto: "Potente e Sintonizada não podem ser melhorados" });
      else melhorias.push({ encantamento: e.encantamento, modo: e.modo });
    } else {
      const linha = INTERACAO[e.tipo];
      if (!e.atributo) avisos.push({ id: `atributo:${e.tipo}`, texto: `${linha.label} sem atributo` });
      else if (linha.alvo && !e.alvo) avisos.push({ id: `alvo:${e.tipo}`, texto: `${linha.label} sem alvo` });
      else {
        const cheia = exprCheia(linha, e.atributo);
        const dividida = naDivisao > 1 && !comPenalidade ? `piso(${cheia} / ${naDivisao})` : cheia;
        emitir(e.tipo, e, linha.metros ? `1.5 * ${dividida}` : dividida, linhas);
      }
    }
    if (comPenalidade) {
      const p = e.penalidade;
      const lp = INTERACAO[p.tipo];
      const valor = `-piso(bt / 2)`;
      if (!lp) avisos.push({ id: `penalidade:${i}`, texto: "Penalidade sem efeito" });
      else if (lp.alvo && !p.alvo) avisos.push({ id: `penalidadeAlvo:${i}`, texto: `Penalidade em ${lp.label} sem alvo` });
      else if (p.tipo === "periciaGrupo" && !p.atributo) avisos.push({ id: `penalidadeAtributo:${i}`, texto: `Penalidade em ${lp.label} sem atributo` });
      else emitir(p.tipo, p, lp.metros ? `1.5 * ${valor}` : valor, linhas);
    }
  });
  return { linhas, melhorias, avisos };
}

/**
 * Os avisos do Feitiço vinculado pela Técnica Inata, na ordem do guia. O Feitiço
 * é o objeto gravado na ficha. `null` quando não há vínculo.
 */
export function avisosDoFeiticoVinculado(feitico) {
  if (!feitico) return null;
  const avisos = [];
  const transformacao = feitico.tipo === "especial" && feitico.especialSubtipo === SUBTIPO_TRANSFORMACAO;
  if (!TIPOS_FEITICO_TECNICA.includes(feitico.tipo) && !transformacao) {
    avisos.push({ id: "tipo", texto: "O Feitiço precisa ser Auxiliar, Transformação, Cura ou Dano" });
  }
  if (String(feitico.nivel) !== "5") avisos.push({ id: "nivel", texto: "O Feitiço precisa ser Nível 5" });
  const forcas = (Array.isArray(feitico.condicoes) ? feitico.condicoes : []).map((c) => c?.forca);
  if (feitico.tipo !== "curativo" && forcas.some((f) => FORCAS_PROIBIDAS.includes(f))) {
    avisos.push({ id: "condicao", texto: "O Feitiço aplica condição Forte ou Extrema" });
  }
  return avisos;
}

/** Quantas vezes o Feitiço vinculado pode ser conjurado: metade do BT, para baixo. */
export const usosDoFeiticoVinculado = (bt) => Math.max(0, Math.floor((Number(bt) || 0) / 2));

/** O id do estado de faixa que conta os usos do Feitiço de uma Ferramenta. */
export const estadoUsosFeitico = (uid) => `unicaFeitico_${uid}`;
