/**
 * ============================================================
 * EXPANSÕES DE DOMÍNIO — construtor
 * ============================================================
 * PORTADO de `src/components/fm-domain-calc.js` (grimório 2.5.2) em 2026-07-30,
 * a pedido do autor: "Faça a aba de Expansões de Domínio parecido com o quê foi
 * feito na 2.5.2. Lá ficou um ótimo resultado, e é bem próximo do que vamos
 * fazer aqui."
 *
 * ⚠ A 2.5.2 é SOMENTE-LEITURA, então isto é cópia adaptada, e não import. A
 * estrutura (versões, efeitos por categoria, Fortalecer, Acerto Garantido, texto
 * final) veio de lá inteira. O que MUDOU para o Afty está marcado com `⚠ AFTY:`
 * ao longo do arquivo, e é sempre por o livro do Afty dizer outra coisa.
 *
 * ------------------------------------------------------------
 * O QUE O LIVRO DO AFTY CONFIRMA (e bate com a 2.5.2)
 * ------------------------------------------------------------
 * De `afty-aptidoes.js`, verbatim:
 *
 *  • Incompleta: "pagar 15PE", "área igual a 4,5 metros multiplicado pelo seu
 *    bônus de treinamento", "dura, por padrão, uma quantidade de rodadas igual a
 *    1 + seu nível de aptidão em domínio".
 *  • Completa: "pagar 20PE", "cria uma área esférica de 9 metros", "dura, por
 *    padrão, uma quantidade de rodadas igual a 3 + seu nível de aptidão em
 *    domínio".
 *  • Acerto Garantido: "aumenta o seu custo em 5 pontos de energia amaldiçoada",
 *    e "não conta para o máximo" de efeitos.
 *  • Sem Barreiras: "mesmos efeitos e custo de uma expansão completa com acerto
 *    garantido, mas não levanta barreiras, tendo um alcance superior".
 *
 * ------------------------------------------------------------
 * ⚠ O GUIA DE CRIAÇÃO CHEGOU (2026-10-08), e confirma quase tudo
 * ------------------------------------------------------------
 * Até 2026-10-08 este cabeçalho dizia que o "Guia de Criação de Expansões de
 * Domínio" nunca tinha sido enviado, e que as tabelas eram as da 2.5.2 sem
 * confirmação. O Livro 2.5.2 em Markdown traz o Guia inteiro, e a conferência
 * linha a linha deu:
 *
 *  1. As onze TABELAS de efeito batem número a número com o Livro.
 *  2. O limite de efeitos por DOM (1 no 1-2, 2 no 3-4, 3 no 5) é do Livro.
 *  3. Fortalecer é do Livro ("aplique metade do efeito como um bônus adicional"),
 *     e passou a somar `piso(base / 2)` por fortalecimento (DA-12), sem o
 *     `Math.round` de antes.
 *  4. O teto de DOM 3 da Incompleta é do Livro.
 *  5. Os efeitos base são do Livro, e a execução é "ação comum" (DA-10), e não as
 *     "Duas Ações Comuns" que a tela da 2.5.2 escrevia.
 *  6. A Sem Barreiras NÃO tem domo, Totem nem a área de `9 m × BT` no Livro
 *     (DA-11): a ficha LEGACY que os tinha segue com eles, e a oficial não.
 *
 * As decisões do autor de 2026-10-08 estão em docs/afty-tecnica-maxima-dominio.md.
 *
 * ⚠ ESTE MÓDULO NÃO IMPORTA NADA, e deve continuar assim. O que ele precisa de
 * outro catálogo (as Condições, os tipos de dano) chega por parâmetro do derive.
 * ============================================================
 */

/* ------------------------------------------------------------ */
/* VERSÕES                                                       */
/* ------------------------------------------------------------ */
/**
 * ⚠ AFTY: a versão é destravada pela APTIDÃO, e não pelo ND solto como na
 * 2.5.2. No Afty cada versão é uma Aptidão de Domínio com pré-requisito próprio,
 * e ter o ND não basta: é preciso ter gastado a vaga. O ND continua no catálogo
 * como o mínimo da aptidão, e fica aqui só para a UI saber explicar o que falta.
 */
export const DOMINIO_VERSOES = [
  { key: "incompleta",    label: "Incompleta",    aptidao: "expansao_de_dominio_incompleta",  ndMin: 8 },
  { key: "completa",      label: "Completa",      aptidao: "expansao_de_dominio_completa",    ndMin: 10 },
  { key: "sem_barreiras", label: "Sem Barreiras", aptidao: "expansao_de_dominio_sem_barreiras", ndMin: 20 },
];

const VERSAO_BY_KEY = Object.fromEntries(DOMINIO_VERSOES.map((v) => [v.key, v]));
export const getVersaoDominio = (key) => VERSAO_BY_KEY[key] ?? null;
export const rotuloVersao = (key) => VERSAO_BY_KEY[key]?.label ?? "";

/** A aptidão que destrava o Acerto Garantido, que é opcional e some sem ela. */
export const APTIDAO_ACERTO_GARANTIDO = "acerto_garantido";

/* ⚠ DOIS REGIMES DE EXPANSÃO (DA-11, 2026-10-08). A Expansão gravada antes desta
   data não tem `regra` e segue LEGACY só no que a Sem Barreiras tinha de herança
   da 2.5.2 (área de 9 m × BT e o Totem de 12 paredes). A nova nasce com
   `regra: "oficial"`, e trocar a versão no editor também a marca. Todo o resto
   (custo, Acerto Garantido, Fortalecer, RD por tipo) vale igual para as duas:
   é correção de regra, não regime. */
export const REGRA_DOMINIO_OFICIAL = "oficial";
export const ehDominioLegacy = (dominio) => dominio?.regra !== REGRA_DOMINIO_OFICIAL;

/**
 * O Acerto Garantido que VALE nesta Expansão:
 *   • só com a Aptidão `acerto_garantido` (o JSON antigo com `ativo` não basta);
 *   • nunca na Incompleta (DA-14);
 *   • na Completa, quando a pessoa o liga;
 *   • na Sem Barreiras, sempre: ele é inerente à versão.
 */
export function acertoGarantidoValido(dominio, versao, temAptidao) {
  if (!temAptidao) return false;
  if (versao === "sem_barreiras") return true;
  if (versao === "completa") return !!dominio?.acertoGarantido?.ativo;
  return false;
}

/* ------------------------------------------------------------ */
/* ACERTO GARANTIDO ESTRUTURADO (Etapa 8, 2026-10-08)            */
/* ------------------------------------------------------------ */
/**
 * O Livro (Guia de Criação, "Acerto Garantido"): "é apenas um efeito, no qual é
 * especificado antecipadamente". Pode ser um grupo de Feitiços ("Apenas Feitiços
 * nível 5"), ataques armados ou desarmados, condições garantidas ("como
 * Paralisia ou Atordoamento, mas não Desmembramento"), "desde informações até um
 * voto geral obrigatório". O não letal troca o golpe pela Abertura de 0,2
 * Segundos.
 *
 * Forma gravada: `{ ativo, tipo, escopo, referencias, letalidade, descricao }`.
 *   • `escopo`: o grupo em texto ("Apenas Feitiços copiados");
 *   • `referencias`: ids de Feitiço (tipo `feiticos`) ou nomes de Condição
 *     (tipo `condicao`);
 *   • `letalidade`: `letal` ou `nao_letal`.
 *
 * ⚠ A FORMA ANTIGA ERA `{ ativo, escopo }`, com o escopo em frase livre ("O que
 * se torna garantido"). Sem `tipo` gravado ela continua no MODO ANTERIOR
 * (`tipo: null`): a frase vira a `descricao`, e a Ficha a escreve como sempre
 * escreveu. O `escopo` gravado fica intocado no JSON. Ela só vira estruturada
 * quando a pessoa escolhe um tipo no editor.
 */
export const AG_TIPOS = [
  { value: "feiticos", label: "Grupo de Feitiços", letalidade: "letal" },
  { value: "ataque_armado", label: "Ataque Armado", letalidade: "letal" },
  { value: "ataque_desarmado", label: "Ataque Desarmado", letalidade: "letal" },
  { value: "condicao", label: "Condição", letalidade: "letal" },
  { value: "informacao", label: "Informação", letalidade: "nao_letal" },
  { value: "voto", label: "Voto", letalidade: "nao_letal" },
  { value: "outro", label: "Outro", letalidade: "letal" },
];
const AG_TIPO_BY_VALUE = Object.fromEntries(AG_TIPOS.map((t) => [t.value, t]));
export const rotuloTipoAcerto = (tipo) => AG_TIPO_BY_VALUE[tipo]?.label ?? "Outro";
export const AG_LETALIDADES = [
  { value: "letal", label: "Letal" },
  { value: "nao_letal", label: "Não Letal" },
];
// "mas não Desmembramento": a única condição que o Acerto Garantido não causa.
export const AG_CONDICAO_PROIBIDA = "Desmembramento";

export function normalizaAcertoGarantido(ag) {
  const a = ag && typeof ag === "object" ? ag : {};
  const legado = a.tipo == null;
  const escopo = typeof a.escopo === "string" ? a.escopo : "";
  return {
    ...a,
    ativo: !!a.ativo,
    tipo: AG_TIPO_BY_VALUE[a.tipo] ? a.tipo : legado ? null : "outro",
    escopo,
    referencias: Array.isArray(a.referencias) ? a.referencias.filter((x) => typeof x === "string" && x) : [],
    letalidade: a.letalidade === "nao_letal" ? "nao_letal" : "letal",
    descricao: typeof a.descricao === "string" ? a.descricao : legado ? escopo : "",
  };
}

/** O patch de troca de tipo: a letalidade segue a sugestão do tipo novo, e as
    referências do tipo velho (ids de Feitiço, nomes de Condição) saem. */
export function patchTipoAcerto(ag, tipo) {
  const atual = normalizaAcertoGarantido(ag);
  return {
    ...atual,
    tipo,
    letalidade: AG_TIPO_BY_VALUE[tipo]?.letalidade ?? atual.letalidade,
    referencias: tipo === atual.tipo ? atual.referencias : [],
  };
}

/**
 * O Acerto Garantido que vale, pronto para tela: `null` quando não vale.
 * `nomesFeiticos` é o mapa id → nome da ficha, que chega do derive.
 */
export function resumoAcertoGarantido(dominio, versao, temAptidao, { nomesFeiticos = {} } = {}) {
  if (!acertoGarantidoValido(dominio, versao, temAptidao)) return null;
  const ag = normalizaAcertoGarantido(dominio?.acertoGarantido);
  const referencias = ag.tipo === "feiticos"
    ? ag.referencias.map((id) => ({ id, nome: nomesFeiticos[id] ?? null }))
    : ag.referencias.map((nome) => ({ id: nome, nome }));
  return {
    tipo: ag.tipo,
    legado: ag.tipo == null,
    rotuloTipo: rotuloTipoAcerto(ag.tipo),
    escopo: ag.escopo.trim(),
    referencias,
    letal: ag.letalidade !== "nao_letal",
    descricao: ag.descricao.trim(),
    // Só o não letal ganha a Abertura de 0,2 Segundos (Livro).
    abertura: ag.letalidade === "nao_letal",
  };
}

/**
 * EXAUSTÃO DE TÉCNICA, em rodadas de técnica inutilizável depois que a Expansão
 * é desmanchada (Livro): Incompleta 1, Completa 2, Completa com Acerto Garantido
 * 4, Sem Barreiras 5. `comAcertoGarantido` é o Acerto Garantido que VALE.
 */
export function exaustaoTecnicaDaVersao(versao, comAcertoGarantido = false) {
  if (versao === "incompleta") return 1;
  if (versao === "completa") return comAcertoGarantido ? 4 : 2;
  if (versao === "sem_barreiras") return 5;
  return 0;
}

/** A versão tem domo? A Sem Barreiras oficial não (DA-11), a LEGACY tinha Totem. */
export const temDomo = (versao, legacy = false) =>
  versao === "incompleta" || versao === "completa" || (versao === "sem_barreiras" && legacy);

/** As versões que a criatura REALMENTE tem, pelas aptidões escolhidas. */
export function versoesDisponiveis(aptidoesEscolhidas = []) {
  const tem = new Set(aptidoesEscolhidas);
  return DOMINIO_VERSOES.filter((v) => tem.has(v.aptidao)).map((v) => ({ value: v.key, label: v.label }));
}

/** A melhor versão que a criatura tem, para o padrão de um domínio novo. */
export function versaoPadrao(aptidoesEscolhidas = []) {
  const disp = versoesDisponiveis(aptidoesEscolhidas);
  return disp.length ? disp[disp.length - 1].value : "";
}

/** A versão do domínio, caindo na melhor disponível se a gravada não valer mais. */
export function resolveVersao(dominio, aptidoesEscolhidas = []) {
  const disp = versoesDisponiveis(aptidoesEscolhidas).map((v) => v.value);
  if (dominio?.versao && disp.includes(dominio.versao)) return dominio.versao;
  return versaoPadrao(aptidoesEscolhidas);
}

/* ------------------------------------------------------------ */
/* CUSTO, DURAÇÃO E ÁREA (tudo confirmado pelo livro do Afty)    */
/* ------------------------------------------------------------ */
export const DOMINIO_CUSTO_BASE = { incompleta: 15, completa: 20, sem_barreiras: 20 };
export const CUSTO_ACERTO_GARANTIDO = 5;

/**
 * O custo-base da Expansão, antes do canal `custoPE`.
 *
 * ⚠ A SEM BARREIRAS CUSTA 25 SEMPRE (2026-10-08): "possui os mesmos efeitos e
 * custo de uma expansão completa com acerto garantido". Até aqui ela custava 20
 * quando a pessoa não ligava o Acerto Garantido, e ele é inerente à versão.
 */
export const custoDominio = (versao, comAcertoGarantido = false) =>
  (DOMINIO_CUSTO_BASE[versao] ?? 0)
  + (comAcertoGarantido || versao === "sem_barreiras" ? CUSTO_ACERTO_GARANTIDO : 0);

/** Incompleta: 1 + DOM. Completa e Sem Barreiras: 3 + DOM. */
export const duracaoDominio = (dom = 0, versao) =>
  (versao === "incompleta" ? 1 : 3) + Math.max(0, Math.trunc(Number(dom) || 0));

const num = (n) => (Number.isInteger(n) ? `${n}` : String(n).replace(".", ","));
const metros = (n) => `${num(n)} metros`;

/**
 * O RAIO da expansão, em metros e como número.
 *
 * Incompleta: 4,5 m × Bônus de Treinamento. Completa: 9 m.
 * Sem Barreiras: 9 m × BT (herdado da 2.5.2, o livro do Afty só diz "alcance
 * superior" sem dar o número).
 *
 * ⚠ `bonus` é o canal `areaDominio` do Motor, e entra DEPOIS da conta de
 * versão, e não dentro dela: a 2ª etapa do Treino de Domínios diz "A área da sua
 * Expansão de Domínio aumenta em 3 metros", e são 3 metros, não 3 vezes o BT.
 * Pelo mesmo motivo ele entra depois do dobro do Sem Barreiras.
 *
 * O piso é ZERO e não negativo: um efeito de mesa que encolha a expansão além do
 * tamanho dela não a vira do avesso.
 */
export function areaDominioMetros(versao, bt = 2, dobraArea = false, bonus = 0, { legacy = true } = {}) {
  const b = Math.max(1, Math.trunc(Number(bt) || 1));
  const extra = Number(bonus) || 0;
  let base = 0;
  if (versao === "incompleta") base = 4.5 * b;
  else if (versao === "completa") base = 9;
  /* ⚠ A SEM BARREIRAS OFICIAL NÃO TEM NÚMERO (DA-11, 2026-10-08). O Livro diz só
     "alcance superior para o acerto garantido", e o `9 m × BT` era herança da
     2.5.2. A LEGACY segue com ele. A oficial devolve `null`, que a tela escreve
     como "Definida pela Mesa". */
  else if (versao === "sem_barreiras") {
    if (!legacy) return null;
    base = 9 * b * (dobraArea ? 2 : 1);
  } else return null;
  return Math.max(0, base + extra);
}

/** O texto da área da Sem Barreiras oficial, que não tem número (DA-11). */
export const AREA_DEFINIDA_PELA_MESA = "Definida pela Mesa";

/** O mesmo, já escrito ("13,5 metros"). Versão desconhecida devolve texto vazio. */
export function areaDominio(versao, bt = 2, dobraArea = false, bonus = 0, opcoes = {}) {
  const m = areaDominioMetros(versao, bt, dobraArea, bonus, opcoes);
  if (m == null) return versao === "sem_barreiras" ? AREA_DEFINIDA_PELA_MESA : "";
  return metros(m);
}

/**
 * A CONTESTAÇÃO DE DOMÍNIO (Livro, Regras sobre Domínios), em números:
 *   • "uma área equivalente à metade do padrão da sua expansão";
 *   • "no começo de toda rodada, você causa dano na barreira da expansão igual ao
 *     seu Nível de Aptidão em Domínio multiplicado por 25 se for Incompleta ou 50
 *     se for Completa";
 *   • com a barreira em 75% passa uma pessoa, em 50% qualquer uma.
 * Só a Incompleta e a Completa contestam. A Sem Barreiras devolve `null`.
 * A aplicação no domo do outro é manual (DA-19): a sessão não conhece o outro.
 */
export function contestacaoDoDominio(versao, { dom = 0, bt = 2, bonusArea = 0 } = {}) {
  if (versao !== "incompleta" && versao !== "completa") return null;
  const m = areaDominioMetros(versao, bt, false, bonusArea);
  const d = Math.max(0, Math.trunc(Number(dom) || 0));
  return {
    area: m == null ? "" : metros(m / 2),
    danoPorRodada: d * (versao === "incompleta" ? 25 : 50),
    patamares: [
      { fracao: 0.75, texto: "Passa Uma Pessoa" },
      { fracao: 0.5, texto: "Passa Qualquer Um" },
    ],
  };
}

/* ------------------------------------------------------------ */
/* PV DA BARREIRA                                                */
/* ------------------------------------------------------------ */
/**
 * ⚠ AQUI AFTY E 2.5.2 DIVERGEM, e é a divergência mais concreta que a leitura
 * achou. A derivação é a mesma nas duas: o domo vale o DOBRO das seis paredes da
 * aptidão Técnicas de Barreira, ou seja `12 × pvDaParede`. O que mudou foi o PV
 * da parede.
 *
 *   2.5.2: parede = 15 + BAR × metade do ND.
 *   AFTY (`afty-aptidoes.js`, verbatim):
 *     Técnicas de Barreira → "vida igual a 5 + seu nível de aptidão em Barreiras
 *       multiplicado por metade do seu nível de personagem"
 *     Paredes Resistentes  → "passam a ser 10 + seu nível de aptidão em Barreiras
 *       multiplicado pelo seu nível de personagem"
 *
 * Esta função segue o AFTY, porque é o texto que o autor mandou. E como Paredes
 * Resistentes existe no Afty e não muda nada na 2.5.2, ela entra aqui: quem a
 * pegou tem parede melhor, então tem domo melhor.
 *
 * ⚠ A CONFIRMAR: que o domo continua valendo 12 paredes no Afty. O "dobro das
 * seis paredes" é regra da 2.5.2, e o livro do Afty não repete a conta.
 */
/**
 * ⚠ TUDO QUE É BARREIRA VALE UM NÚMERO DE PAREDES (autor, 2026-08-26):
 * *"Cortina usa a vida 3 de Paredes e Domínio usa a vida de 12 Paredes"*.
 *
 * A parede da aptidão Técnicas de Barreira é a UNIDADE, e as duas estruturas
 * maiores são múltiplos dela. Isso é o que faz o Treino de Barreiras e as
 * Paredes Resistentes alcançarem as três de uma vez, sem regra separada para
 * cada uma: melhorar a parede melhora tudo que é feito de paredes.
 *
 * O 12 do domo já estava aqui, herdado da 2.5.2 ("o dobro das seis paredes"), e
 * ficou marcado "A CONFIRMAR" desde a portabilidade porque o livro do Afty não
 * repete a conta. O autor confirmou junto com a Cortina.
 */
export const PAREDES_NA_CORTINA = 3;
export const PAREDES_NO_DOMO = 12;

/** Quantas paredes a Técnica de Barreira ergue de uma vez. Verbatim: "até 6 paredes". */
export const PAREDES_BASE = 6;

/**
 * O PV de UMA parede, e a régua de tudo que é barreira. VERBATIM das duas
 * aptidões, e o autor reconfirmou a fórmula em 2026-08-26:
 *
 *   Técnicas de Barreira → 5 + (metade do ND × Nível de Barreira) + Outros
 *   Paredes Resistentes  → 10 + (ND × Nível de Barreira) + Outros
 *
 * ⚠ `bonus` é o "Outros": o canal `pvParede` do Motor. Ele entra POR PAREDE, e
 * por isso alcança a Cortina três vezes e o domo doze. O Treino de Barreiras dá
 * +10 na 1ª e mais +10 na 3ª.
 */
export function pvDaParede(bar = 0, nd = 0, temParedesResistentes = false, bonus = 0) {
  const b = Math.max(0, Math.trunc(Number(bar) || 0));
  const n = Math.max(0, Math.trunc(Number(nd) || 0));
  const base = temParedesResistentes ? 10 + b * n : 5 + b * Math.floor(n / 2);
  return Math.max(0, base + (Math.trunc(Number(bonus)) || 0));
}

/** A CORTINA vale 3 paredes. */
export const pvCortina = (bar = 0, nd = 0, temParedesResistentes = false, bonus = 0) =>
  PAREDES_NA_CORTINA * pvDaParede(bar, nd, temParedesResistentes, bonus);

/** O DOMO da Expansão de Domínio vale 12 paredes. */
export const pvBarreira = (bar = 0, nd = 0, temParedesResistentes = false, bonus = 0) =>
  PAREDES_NO_DOMO * pvDaParede(bar, nd, temParedesResistentes, bonus);

/**
 * RD de cada parede. ⚠ NÃO EXISTIA antes de 2026-08-26: o livro não dá RD a
 * parede nenhuma, e quem a concede é o Completo do Treino de Barreiras ("toda
 * parede que criar recebe RD igual ao seu Nível de Aptidão em Barreiras"). Sem
 * fonte no Motor o valor é ZERO, que é o que o livro diz.
 */
export const rdDaParede = (bonus = 0) => Math.max(0, Math.trunc(Number(bonus)) || 0);

/**
 * Máximo de paredes erguidas de uma vez: as 6 da aptidão mais o canal
 * `maxParedes` (a 4ª etapa do Treino de Barreiras dá +2).
 */
export const maxParedes = (bonus = 0) =>
  Math.max(0, PAREDES_BASE + (Math.trunc(Number(bonus)) || 0));

/* ------------------------------------------------------------ */
/* CONFLITO DE DOMÍNIO                                           */
/* ------------------------------------------------------------ */
/**
 * A rolagem de confronto e contestação de expansões, dada pelo autor em
 * 2026-08-26:
 *
 *   1d10 + Nível de Aptidão em Domínio + metade do ND + Outros
 *
 * "Outros" é o canal `conflitoDominio` do Motor, e a 1ª e a 3ª etapa do Treino
 * de Domínios são as duas primeiras fontes dele (+1 cada). Até esta data as duas
 * etapas não tinham onde escrever, porque a ROLAGEM não existia em lugar nenhum
 * do sistema.
 *
 * ⚠ Metade do ND é PISO, pela regra geral de arredondamento do Afty.
 *
 * ⚠ NÃO depende de haver uma expansão montada na ficha: quem confronta é a
 * CRIATURA, e o número existe desde que ela tenha Nível de Aptidão em Domínio.
 * Por isso ele mora no resumo e não em cada linha de domínio.
 *
 * Devolve o bônus, as partes para o hover de fontes e a anatomia do dado, que é
 * o que a Ficha precisa para rolar sem remontar nada.
 */
export const CONFLITO_FACES = 10;

export function conflitoDeDominio({ dom = 0, nd = 0, bonus = 0 } = {}) {
  const d = Math.max(0, Math.trunc(Number(dom) || 0));
  const n = Math.max(0, Math.trunc(Number(nd) || 0));
  const outros = Math.trunc(Number(bonus)) || 0;
  const metadeND = Math.floor(n / 2);
  const partes = [
    { label: "Nível de Aptidão em Domínio", valor: d },
    { label: "Metade do Nível de Desafio", valor: metadeND },
  ];
  return {
    dados: 1,
    faces: CONFLITO_FACES,
    bonus: d + metadeND + outros,
    outros,
    partes,
  };
}

/* ------------------------------------------------------------ */
/* LIMITE DE EFEITOS                                             */
/* ------------------------------------------------------------ */
/**
 * ⚠ A ESCADA é SEM FONTE NO AFTY. Herdada da 2.5.2: DOM 1-2 → 1, 3-4 → 2, 5 → 3.
 *
 * ⚠ `bonus` é o canal `efeitosDominio` (2026-08-26), e a 4ª etapa do Treino de
 * Domínios é a primeira a usá-lo ("Você pode colocar um efeito adicional em sua
 * expansão de domínio"). Ele soma por cima da escada, e NÃO abre vaga em quem
 * não tem Domínio nenhum: com DOM 0 a expansão não existe, e somar aqui daria
 * vaga numa coisa que não está no ar.
 */
export function maxEfeitos(dom = 0, bonus = 0) {
  const d = Math.trunc(Number(dom) || 0);
  const base = d >= 5 ? 3 : d >= 3 ? 2 : d >= 1 ? 1 : 0;
  if (!base) return 0;
  return Math.max(0, base + (Math.trunc(Number(bonus)) || 0));
}

/** Livro: "Uma Expansão de Domínio Incompleta não pode receber benefícios acima
    do nível de aptidão 3". */
export function domEfetivo(dom = 0, versao) {
  const d = Math.max(0, Math.min(5, Math.trunc(Number(dom) || 0)));
  return versao === "incompleta" ? Math.min(d, 3) : d;
}

/**
 * FORTALECER (Livro, e DA-12 de 2026-10-08): "fortalecê-lo quando receberia um
 * novo, ao invés de criar outro... aplique metade do efeito como um bônus
 * adicional ao efeito escolhido".
 *
 *   • cada fortalecimento ocupa 1 vaga a mais, e pode repetir com outra vaga;
 *   • cada um soma `piso(base / 2)` do valor BASE da tabela, sem composição:
 *     base 5 fica 7 com um e 9 com dois, e nunca 5 × 1,5 × 1,5;
 *   • metro anda na grade de 1,5 m, então a metade de 3 m é 1,5 m.
 *
 * ⚠ ERA UM BOOLEANO até 2026-10-08 (`fortalecido`), que custava 2 vagas e
 * multiplicava por 1,5 com `Math.round` (Defesa 3 virava 5). A ficha antiga com
 * `fortalecido: true` é lida como UM fortalecimento, e o valor passa a ser o do
 * Livro (Defesa 3 vira 4).
 */
/* Teto de segurança do número gravado, e não regra do Livro: quem trava de verdade
   é o limite de efeitos (cada fortalecimento gasta uma vaga). Um JSON com 99 não
   vira um efeito cinquenta vezes maior. */
export const MAX_FORTALECIMENTOS = 4;
export function fortalecimentosDe(efeito) {
  const n = Math.trunc(Number(efeito?.fortalecimentos));
  if (Number.isFinite(n) && n > 0) return Math.min(n, MAX_FORTALECIMENTOS);
  return efeito?.fortalecido ? 1 : 0;
}
export const custoEmVagas = (efeito) => 1 + fortalecimentosDe(efeito);
export const vagasUsadas = (efeitos = []) => efeitos.reduce((n, e) => n + custoEmVagas(e), 0);

// A grandeza com `n` fortalecimentos: base + n × piso(base / 2).
const F = (base, n) => base + Math.max(0, Math.trunc(Number(n) || 0)) * Math.floor(base / 2);
// O mesmo em metros, na grade de 1,5 m.
const FM = (base, n) => base + Math.max(0, Math.trunc(Number(n) || 0)) * (Math.floor(base / 2 / 1.5) * 1.5);
const plural = (n, um, varios) => (n === 1 ? um : varios);

/**
 * O EFEITO AMBIENTAL DE CONDIÇÕES pela Gerência de Dano por Condições do Livro
 * (2026-10-08): cada condição custa dados do orçamento do DOM. A Extrema não
 * existe aqui: a tabela de Expansão libera só Fracas, Médias e Fortes.
 */
export const CUSTO_CONDICAO_AMBIENTAL = { fraca: 1, media: 3, forte: 5 };
// Por DOM efetivo: 1 só Fracas, 2 até Médias, 3 em diante até Fortes.
export const CONDICAO_AMBIENTAL_FORCAS = [["fraca"], ["fraca", "media"], ["fraca", "media", "forte"]];

/* ============================================================ */
/* TABELAS DE EFEITO, conferidas com o Livro                     */
/* ============================================================ */
/* ⚠ ATÉ 2026-10-08 ESTE CABEÇALHO DIZIA "herdadas da 2.5.2, sem fonte Afty"
   (E-18). O Guia de Criação de Expansão do Livro existe, e as onze tabelas batem
   com ele linha a linha (ver `docs/afty-tecnica-maxima-dominio.md`). */
/* Cada tipo tem `resolve(idx, fortalecido)` e devolve:
     valor  — a grandeza curta, que a UI mostra ao lado do seletor
     frase  — a frase inteira, que entra no Texto Final
     motor  — como o efeito vira canal do Motor de Automação (ou ausente,
              quando ele age sobre INIMIGO e não sobre a própria ficha)
   idx = domEfetivo - 1 (0 a 4). */
export const DOMINIO_EFEITOS = {
  amp_tecnica: {
    label: "Amplificação de Técnica",
    desc: "Amplifica diretamente a sua técnica amaldiçoada dentro da expansão.",
    tipos: {
      dano: {
        label: "Aumento de Dano",
        resolve: (i, f) => {
          const dados = F([1, 2, 3, 4, 5][i], f);
          const fixo = F([5, 5, 10, 10, 15][i], f);
          const valor = `+${dados} ${plural(dados, "dado", "dados")} de dano e +${fixo} de dano fixo`;
          return {
            valor,
            frase: `Todos os seus Feitiços de dano recebem ${valor}.`,
            motor: [
              { canal: "dadosDano", alvo: "feitico", expr: String(dados) },
              { canal: "danoBonus", alvo: "feitico", expr: String(fixo) },
            ],
          };
        },
      },
      cd: {
        label: "Aumento de CD",
        resolve: (i, f) => {
          const n = F([2, 4, 6, 8, 10][i], f);
          return {
            valor: `+${n} de CD`,
            frase: `Todos os seus Feitiços têm a CD para resistir aumentada em ${n}.`,
            /* ⚠ `cdFeitico`, e não `cd` (DA-13, 2026-10-08): o Livro fala dos
               Feitiços, e o `cd` subia junto a CD de Aptidão e de Habilidade. */
            motor: [{ canal: "cdFeitico", expr: String(n) }],
          };
        },
      },
      negacao_rd: {
        label: "Negação de Redução de Dano",
        resolve: (i, f) => {
          const rd = F([3, 6, 10, 12, 15][i], f);
          const resist = i >= 3;
          const valor = `${resist ? "resistentes perdem a resistência, " : ""}-${rd} RD`;
          return {
            valor,
            frase: `Seus Feitiços ignoram ${rd} de RD dos alvos${resist ? ", e inimigos resistentes perdem a resistência" : ""}.`,
            motor: [
              { canal: "ignoraRD", alvo: "feitico", expr: String(rd) },
              ...(resist ? [{ canal: "removeResistencia", alvo: "feitico", expr: "1" }] : []),
            ],
          };
        },
      },
    },
  },
  amp_corporal: {
    label: "Amplificação Corporal",
    desc: "Afeta diretamente o usuário, deixando-o mais forte.",
    tipos: {
      dano: {
        label: "Aumento de Dano",
        resolve: (i, f) => {
          const niveis = F([2, 4, 6, 8, 10][i], f);
          const fixo = F([5, 5, 10, 10, 15][i], f);
          const valor = `+${niveis} níveis de dano e +${fixo} de dano fixo`;
          return {
            valor,
            frase: `Todos os seus ataques armados e desarmados recebem ${valor}.`,
            motor: [
              { canal: "nivelDano", alvo: "arma", expr: String(niveis) },
              { canal: "nivelDano", alvo: "basico", expr: String(niveis) },
              { canal: "danoBonus", alvo: "arma", expr: String(fixo) },
              { canal: "danoBonus", alvo: "basico", expr: String(fixo) },
            ],
          };
        },
      },
      atributo: {
        label: "Aumento de Atributo",
        resolve: (i, f) => {
          const n = F([2, 4, 6, 8, 10][i], f);
          const valor = `+${n} em dois atributos físicos distintos`;
          return {
            valor,
            frase: `Você recebe ${valor} (até o limite de 30).`,
            // O alvo sai da escolha do jogador (`atributos`), não da tabela.
            motorAtributo: n,
          };
        },
      },
      rd: {
        label: "Redução de Dano",
        resolve: (i, f) => {
          const rd = F([3, 6, 9, 12, 15][i], f);
          const tipos = [3, 3, 4, 4, 5][i];
          const valor = `+${rd} de RD contra ${tipos} tipos de dano`;
          return {
            valor,
            frase: `Você recebe ${valor} (escolhidos na criação).`,
            /* ⚠ RD POR TIPO desde 2026-10-08. Até aqui ela entrava como RD GERAL
               (todo tipo de dano), à espera do canal `rdTipo`, que já existia. A
               linha sai por TIPO ESCOLHIDO no `efeitosDoDominio`, até `tiposMax`.
               O Fortalecer sobe a RD, e não a quantidade de tipos. */
            motorRdTipo: rd,
            tiposMax: tipos,
          };
        },
      },
      defesa: {
        label: "Defesa",
        resolve: (i, f) => {
          const n = F([3, 5, 7, 9, 12][i], f);
          return {
            valor: `+${n} de Defesa`,
            frase: `Você recebe +${n} de Defesa enquanto a expansão durar.`,
            motor: [{ canal: "defesa", expr: String(n) }],
          };
        },
      },
      negacao_rd: {
        label: "Negação de Redução de Dano (golpes)",
        resolve: (i, f) => {
          const rd = F([3, 6, 10, 12, 15][i], f);
          const resist = i >= 3;
          const valor = `${resist ? "resistentes perdem a resistência, " : ""}-${rd} RD`;
          return {
            valor,
            frase: `Seus golpes ignoram ${rd} de RD dos alvos${resist ? ", e inimigos resistentes perdem a resistência" : ""}.`,
            motor: [
              { canal: "ignoraRD", alvo: "arma", expr: String(rd) },
              { canal: "ignoraRD", alvo: "basico", expr: String(rd) },
              ...(resist ? [
                { canal: "removeResistencia", alvo: "arma", expr: "1" },
                { canal: "removeResistencia", alvo: "basico", expr: "1" },
              ] : []),
            ],
          };
        },
      },
    },
  },
  ambiental: {
    label: "Efeito Ambiental",
    desc: "Efeito passivo e constante dentro do ambiente da expansão.",
    // Nenhum entra no Motor: os três agem sobre as criaturas hostis, e não
    // sobre a ficha de quem expandiu.
    tipos: {
      dano: {
        label: "Dano Ambiental",
        resolve: (i, f) => {
          const n = F([1, 2, 2, 2, 3][i], f);
          const d = [10, 8, 10, 12, 10][i];
          const fixo = F([10, 15, 20, 25, 35][i], f);
          const valor = `${n}d${d} + ${fixo}`;
          return {
            valor,
            frase: `Todas as criaturas hostis dentro do domínio recebem ${valor} de dano (tipo a escolher) a cada rodada.`,
          };
        },
      },
      condicoes: {
        label: "Condições",
        /* A Gerência de Dano por Condições do Livro: cada condição CUSTA dados
           (Fraca 1, Média 3, Forte 5), e o DOM dá o orçamento e as forças. A
           Extrema nunca entra por aqui. "Você não pode adicionar esta aptidão
           mais do que uma vez" (ver `validarDominio`). */
        unico: true,
        resolve: (i, f) => {
          const dados = F([2, 4, 6, 8, 12][i], f);
          const forcas = CONDICAO_AMBIENTAL_FORCAS[Math.min(i, CONDICAO_AMBIENTAL_FORCAS.length - 1)];
          const faixas = [
            "fracas",
            "fracas ou médias",
            "fracas, médias ou fortes",
            "fracas, médias ou fortes",
            "fracas, médias ou fortes",
          ][i];
          return {
            valor: `condições ${faixas} (${dados} dados)`,
            frase: `Toda criatura hostil faz um TR no começo do turno, e em uma falha recebe uma condição (${faixas}). São ${dados} dados para distribuir, e as condições duram 1 rodada.`,
            dadosCondicao: dados,
            forcasCondicao: forcas,
          };
        },
      },
      lentidao: {
        label: "Lentidão",
        resolve: (i, f) => {
          // O Fortalecer anda na grade de 1,5 m: a metade de 3 m é 1,5 m.
          const m = FM([3, 6, 9, 12, 18][i], f);
          return {
            valor: `reduz ${num(m)} m`,
            frase: `Toda criatura hostil no domínio tem o movimento reduzido em ${num(m)} m, e fica incapaz de se mover se chegar a 0.`,
          };
        },
      },
    },
  },
  especial: {
    label: "Efeito Especial",
    desc: "Mecânica única definida entre jogador e Narrador.",
    tipos: {},
    livre: true,
  },
};

export const DOMINIO_CATEGORIAS = Object.entries(DOMINIO_EFEITOS)
  .map(([value, cat]) => ({ value, label: cat.label }));

export const tiposDaCategoria = (categoria) => {
  const cat = DOMINIO_EFEITOS[categoria];
  if (!cat || cat.livre) return [];
  return Object.entries(cat.tipos).map(([value, t]) => ({ value, label: t.label }));
};

export const categoriaLivre = (categoria) => !!DOMINIO_EFEITOS[categoria]?.livre;

/**
 * Os efeitos de TODA expansão aberta, do Livro ("ao abrir uma expansão de
 * domínio, você recebe os seguintes efeitos"). Aqui mora só o TEXTO: os que
 * viram número entram no Motor por `efeitosDoDominio` e pelo pré-contexto.
 *
 * Cada um tem TÍTULO separado do corpo porque o texto final é renderizado em
 * bullets de "Título. corpo", com o título em destaque. Sem a separação o bullet
 * inteiro sairia em negrito, que é o que acontece quando a frase não tem ponto
 * no meio.
 */
export const DOMINIO_EFEITOS_BASE = [
  { titulo: "Níveis de Aptidão", texto: "Você recebe +2 em todos os níveis de aptidão, exceto Barreira e Domínio, podendo passar do limite. Exige ter ao menos Nível 1 na aptidão." },
  { titulo: "Confronto de Domínio", texto: "Você recebe +2 em testes de Confronto de Domínio." },
  { titulo: "Movimento", texto: "Seu movimento dobra dentro da própria expansão." },
  { titulo: "Custo de Feitiço", texto: "O custo dos seus Feitiços dentro da expansão é reduzido em um valor igual ao seu Nível de DOM." },
  { titulo: "Benefício de Ritual", texto: "Todos os seus Feitiços recebem um benefício de ritual, escolhido por categoria (Dano, Especiais, Auxiliares e Cura)." },
];

export const DOMINIO_RITUAL_CATEGORIAS = [
  { key: "dano", label: "Dano" },
  { key: "especial", label: "Especiais" },
  { key: "auxiliar", label: "Auxiliares" },
  { key: "curativo", label: "Cura" },
];

const normalizaBeneficiosRitual = (beneficios) => Object.fromEntries(
  DOMINIO_RITUAL_CATEGORIAS.map(({ key }) => [key, String(beneficios?.[key] ?? "")]),
);

/**
 * O benefício básico "Níveis de Aptidão" precisa entrar ANTES do contexto
 * principal do Motor, porque `au`, `cl` e `er` são variáveis do próprio DSL.
 * Por isso ele fica separado dos efeitos escolhidos da expansão, que dependem
 * do DOM efetivo e são resolvidos mais tarde.
 *
 * A regra só alcança uma trilha em que a criatura já tenha ao menos Nível 1.
 * O chamador entrega os níveis resolvidos sem a própria expansão, evitando que
 * o bônus se habilite sozinho numa trilha zerada.
 */
export function efeitosDeAptidaoDoDominio(
  creature,
  { aptidoesEscolhidas = [], niveisAptidao = {} } = {},
) {
  // Só com a Expansão VALENDO: em Confronto ela ainda não está completa (DA-15).
  if (!expansaoDominioNoAr(creature, aptidoesEscolhidas)) return [];
  const ativo = dominioEmUso(creature, aptidoesEscolhidas);

  const nome = `${ativo.nome || "Expansão de Domínio"}: Níveis de Aptidão`;
  return ["au", "cl", "er"].flatMap((alvo) => {
    if ((niveisAptidao?.[alvo] ?? 0) < 1) return [];
    const base = {
      alvo,
      expr: "2",
      nome,
      origem: ativo.id,
      duracao: "temporaria",
    };
    return [
      { ...base, canal: "nivelAptidao" },
      { ...base, canal: "limiteAptidao" },
    ];
  });
}

/* ------------------------------------------------------------ */
/* RESOLUÇÃO DE UM EFEITO                                        */
/* ------------------------------------------------------------ */
const defDoTipo = (efeito) => DOMINIO_EFEITOS[efeito?.categoria]?.tipos?.[efeito?.tipo] ?? null;

const resolvido = (efeito, dom, versao) => {
  const t = defDoTipo(efeito);
  if (!t) return null;
  return t.resolve(Math.max(0, domEfetivo(dom, versao) - 1), fortalecimentosDe(efeito));
};

/** A resolução inteira de um efeito (valor, frase, teto de tipos, orçamento de
    Condições), para o editor. `null` no Efeito Especial e no desconhecido. */
export const resolucaoDoEfeito = (efeito, dom, versao) =>
  (categoriaLivre(efeito?.categoria) ? null : resolvido(efeito, dom, versao));

/** Grandeza curta do efeito. Vazia no Efeito Especial, que não tem tabela. */
export function valorDoEfeito(efeito, dom, versao) {
  if (!efeito || categoriaLivre(efeito.categoria)) return "";
  return resolvido(efeito, dom, versao)?.valor ?? "";
}

export function rotuloDoEfeito(efeito) {
  const cat = DOMINIO_EFEITOS[efeito?.categoria];
  if (!cat) return "Efeito";
  if (cat.livre) return cat.label;
  const t = cat.tipos?.[efeito?.tipo];
  return t ? `${cat.label}: ${t.label}` : cat.label;
}

/* ------------------------------------------------------------ */
/* MODELO DE DADOS                                               */
/* ------------------------------------------------------------ */
let seq = 0;
export function novoEfeitoDominio(categoria = "amp_tecnica") {
  seq += 1;
  return {
    id: `dfx_${Date.now().toString(36)}_${seq}`,
    categoria,
    tipo: categoriaLivre(categoria) ? "" : Object.keys(DOMINIO_EFEITOS[categoria].tipos)[0],
    nome: "",
    descricao: "",
    // Quantas vezes o efeito foi fortalecido (DA-12). Ver `fortalecimentosDe`.
    fortalecimentos: 0,
    // Escolhas que a tabela não captura:
    //  atributos — os dois físicos do "Aumento de Atributo"
    //  rdTipos:    os tipos de dano protegidos pela "Redução de Dano" (lista
    //              de ids de tipo desde 2026-10-08, era texto livre)
    //  condicoes:  as condições do Efeito Ambiental, `{ nome, forca }`
    atributos: [],
    rdTipos: [],
    condicoes: [],
  };
}

/** Os atributos físicos elegíveis para o Aumento de Atributo. */
export const ATRIBUTOS_FISICOS = [
  { value: "forca",        label: "Força" },
  { value: "destreza",     label: "Destreza" },
  { value: "constituicao", label: "Constituição" },
];

export function novoDominio(versao = "") {
  seq += 1;
  return {
    id: `dom_${Date.now().toString(36)}_${seq}`,
    // Toda Expansão criada desde 2026-10-08 nasce oficial (DA-11).
    regra: REGRA_DOMINIO_OFICIAL,
    nome: "",
    versao,
    aparencia: "",
    efeitos: [],
    beneficiosRitual: normalizaBeneficiosRitual(null),
    // O tipo mais comum do Livro ("Feitiços específicos") é o padrão da nova.
    acertoGarantido: { ativo: false, tipo: "feiticos", escopo: "", referencias: [], letalidade: "letal", descricao: "" },
  };
}

/** Um efeito gravado, lido no formato de hoje sem perder o que ele guardava. */
function normalizaEfeito(e = {}) {
  const base = DOMINIO_EFEITOS[e.categoria] ? novoEfeitoDominio(e.categoria) : novoEfeitoDominio();
  return {
    ...base,
    ...e,
    fortalecimentos: fortalecimentosDe(e),
    atributos: Array.isArray(e.atributos) ? e.atributos : [],
    /* ⚠ O TEXTO LIVRE DE ANTES fica em `rdTiposTexto`, e a RD por tipo só sai
       com a lista preenchida (2026-10-08). Apagar o texto perderia o que a
       pessoa tinha escrito. */
    rdTipos: Array.isArray(e.rdTipos) ? e.rdTipos.filter((x) => typeof x === "string" && x) : [],
    rdTiposTexto: typeof e.rdTipos === "string" ? e.rdTipos : String(e.rdTiposTexto ?? ""),
    condicoes: Array.isArray(e.condicoes)
      ? e.condicoes.filter((c) => c && typeof c.nome === "string" && c.nome && typeof c.forca === "string")
      : [],
    // O Motor opcional do Efeito Especial (DA-20): linhas `{ canal, expr, alvo? }`.
    motor: Array.isArray(e.motor) ? e.motor.filter((m) => m && typeof m.canal === "string") : [],
  };
}

export function normalizeDominio(d = {}) {
  return {
    ...novoDominio(),
    ...d,
    /* ⚠ O REGIME NÃO VEM DO `novoDominio` (DA-11): uma Expansão gravada antes de
       2026-10-08 não tem `regra`, e herdar o "oficial" da fábrica apagaria a
       diferença calada. */
    regra: d.regra === REGRA_DOMINIO_OFICIAL ? REGRA_DOMINIO_OFICIAL : null,
    efeitos: Array.isArray(d.efeitos) ? d.efeitos.map(normalizaEfeito) : [],
    beneficiosRitual: normalizaBeneficiosRitual(d.beneficiosRitual),
    acertoGarantido: normalizaAcertoGarantido(d.acertoGarantido),
  };
}

export const listaDominios = (creature) =>
  (Array.isArray(creature?.dominios) ? creature.dominios : []).map(normalizeDominio);

/**
 * Qual expansão a sessão está usando. A ficha final grava o id diretamente no
 * estado `dominioAtivo`. O booleano antigo continua válido: usa a escolha do
 * criador ou, quando só existe uma expansão, a única opção possível.
 */
export function dominioEmUso(creature, aptidoesEscolhidas = []) {
  const lista = listaDominios(creature);
  const estado = creature?.combate?.dominioAtivo;
  const candidatos = [
    typeof estado === "string" ? estado : null,
    creature?.dominioAtivoId,
    lista.length === 1 ? lista[0].id : null,
  ].filter(Boolean);
  const ativo = candidatos
    .map((id) => lista.find((dominio) => dominio.id === id))
    .find((dominio) => dominio && resolveVersao(dominio, aptidoesEscolhidas));
  return ativo ?? null;
}

/* ------------------------------------------------------------ */
/* FASES DA EXPANSÃO NO AR (2026-10-08)                          */
/* ------------------------------------------------------------ */
/**
 * A Expansão aberta passa por fases, guardadas na sessão em
 * `combate.dominioFase`, separadas do id em `combate.dominioAtivo`:
 *
 *   • `ativa`: completa e valendo, com tudo (efeitos base, efeitos e Acerto
 *     Garantido);
 *   • `confronto`: ainda não completa, e o Livro manda: "Você não receberá
 *     esses efeitos caso esteja num Confronto de Domínio" (DA-15);
 *   • `estendido`: Confronto Estendido, as duas manifestadas e NADA valendo até
 *     um lado vencer (DA-15);
 *   • `contestando`: o contestador recebe só as regras da Contestação, e nenhum
 *     benefício da própria Expansão (DA-15).
 *
 * ⚠ SESSÃO ANTIGA, SEM FASE, VALE `ativa`: era o único estado que existia, e
 * regravar a sessão de ninguém é a regra.
 */
export const FASES_DOMINIO = ["ativa", "confronto", "estendido", "contestando"];

export function faseDoDominio(creature) {
  const c = creature?.combate;
  if (!c?.ativo || !c?.dominioAtivo) return null;
  return FASES_DOMINIO.includes(c.dominioFase) ? c.dominioFase : "ativa";
}

/** A Expansão está no ar E valendo? É o portão de todo benefício dela. */
export function expansaoDominioNoAr(creature, aptidoesEscolhidas = []) {
  return faseDoDominio(creature) === "ativa" && !!dominioEmUso(creature, aptidoesEscolhidas);
}

/** Benefícios gratuitos de Ritual da expansão que está realmente em uso. */
export function beneficiosRitualDoDominio(creature, aptidoesEscolhidas = []) {
  if (!expansaoDominioNoAr(creature, aptidoesEscolhidas)) return normalizaBeneficiosRitual(null);
  const ativo = dominioEmUso(creature, aptidoesEscolhidas);
  return normalizaBeneficiosRitual(ativo.beneficiosRitual);
}

/* ------------------------------------------------------------ */
/* CORPO EM ESTRUTURA                                            */
/* ------------------------------------------------------------ */
/* ⚠ AS DUAS TELAS LEEM ISTO, e não uma string. Até 2026-09-11 a Ficha e o
   criador recebiam um parágrafo pronto (`textoDoDominio`), herança da 2.5.2, e o
   criador o desmontava de volta com uma regex sobre o marcador "●". Duas
   consequências, as duas caras: a área, a duração e o PV saíam DUAS vezes na
   tela (na linha e na prosa), e o que é DESTA expansão ficava no fim, depois de
   cinco efeitos que são iguais em toda expansão.

   Aqui só mora TEXTO. Os números (área, duração, PV e custo) já estão em campos
   próprios do resumo e a tela os desenha de lá, então o descompasso entre o
   número da linha e o número da prosa deixa de existir por construção. */

/** A execução da Expansão de Domínio, igual em toda versão. ⚠ Era "Duas Ações
    Comuns" até 2026-10-08, texto que veio da tela da 2.5.2. O Livro: "Todos os
    domínios são utilizados como ação comum, necessitam de duas mãos livres e
    capacidade de fala" (DA-10). */
export const DOMINIO_EXECUCAO = "Ação Comum";
export const DOMINIO_REQUISITOS_EXECUCAO = "Duas Mãos Livres e Capacidade de Fala";

/* A Sem Barreiras oficial não tem domo nem número de área (DA-11). O que o Livro
   dá é isto, e é o que a Ficha mostra no lugar do domo. */
const ALCANCE_SEM_BARREIRAS =
  "Superior, definido pela mesa. O Acerto Garantido pode até superar as barreiras de " +
  "outras expansões de domínio, atacando-as por fora.";

/* ⚠ Verbatim do texto que a 2.5.2 escrevia no parágrafo do domo. Ele virou item
   da lista "Toda Expansão" em vez de sumir junto com a prosa, porque é REGRA e
   não número: a resistência do interior não aparece em lugar nenhum da linha. */
const DOMO_INTERIOR =
  "Caso a expansão seja atacada pelo seu interior, ela é resistente a todos os tipos de dano. " +
  "A resistência do interior de domínios não pode ser ignorada.";

const FRASE_APLICACAO_AG =
  "Ele é aplicado no início de cada turno contra todos os alvos legíveis dentro do " +
  "alcance, uma vez por rodada para cada um.";
const FRASE_ACERTA_AG =
  "Jogadas de ataque sempre acertam e Testes de Resistência sempre falham, a não ser que " +
  "algum efeito aumente o sucesso.";
const FRASE_CONDICAO_AG =
  "As condições causadas por ele duram 1 rodada. Quem passa 2 rodadas no total com uma " +
  "condição de Incapacitação recupera uma ação e metade da ação de movimento por rodada.";
// Livro: "força você a fazer um teste de feitiçaria contra a atenção de todos".
export const FRASE_ABERTURA_02 =
  "Faça um teste de Feitiçaria contra a Atenção de todos. No sucesso, eles não podem " +
  "realizar reações contra a expansão, nem mesmo os Golpes de Oportunidade ao expandir.";

/* O que se torna garantido, em frase, por tipo. */
function alvoDoAcerto(r) {
  const nomes = r.referencias.map((x) => x.nome).filter(Boolean).join(", ");
  const comEscopo = (base) => (r.escopo ? `${base} (${r.escopo})` : base);
  switch (r.tipo) {
    case "feiticos": return [r.escopo, nomes].filter(Boolean).join(": ") || "um grupo de Feitiços";
    case "ataque_armado": return comEscopo("ataques armados");
    case "ataque_desarmado": return comEscopo("ataques desarmados");
    case "condicao": return nomes || "uma condição";
    default: return r.descricao || r.escopo;
  }
}

/**
 * O texto do Acerto Garantido no corpo da Expansão.
 *
 * ⚠ O MODO ANTERIOR (`legado`) escreve exatamente o que a Ficha sempre escreveu,
 * frase por frase. É o que impede uma Expansão antiga de mudar de texto só por
 * a ficha ser aberta depois de 2026-10-08.
 */
function textoAcertoGarantido(r) {
  if (r.legado) {
    const alvo = r.descricao
      ? `Enquanto dentro do seu domínio, ${r.descricao} se torna garantido`
      : "Enquanto dentro do seu domínio, você escolhe antecipadamente um efeito (uma técnica, ataque ou condição) para se tornar garantido";
    return (
      `${alvo}: ele é aplicado no início de cada turno contra todos os alvos legíveis dentro do ` +
      "alcance, uma vez por rodada para cada um. Jogadas de ataque sempre acertam e Testes de " +
      "Resistência sempre falham, e qualquer condição causada por ele dura 1 rodada."
    );
  }
  const alvo = String(alvoDoAcerto(r) ?? "").replace(/[.\s]+$/, "");
  const partes = [`Garantido dentro do seu domínio: ${alvo || "o efeito escolhido"}.`, FRASE_APLICACAO_AG];
  if (["feiticos", "ataque_armado", "ataque_desarmado", "condicao"].includes(r.tipo)) partes.push(FRASE_ACERTA_AG);
  if (r.tipo === "condicao") partes.push(FRASE_CONDICAO_AG);
  // A descrição livre dos tipos estruturados vem depois da regra, como nota da pessoa.
  if (r.descricao && !["informacao", "voto", "outro"].includes(r.tipo)) partes.push(r.descricao);
  return partes.join(" ");
}

/** Um efeito escolhido, como item: título, categoria e o texto dele. */
function itemDoEfeito(efeito, dom, versao) {
  const cat = DOMINIO_EFEITOS[efeito?.categoria];
  if (!cat) return null;
  const nome = efeito.nome?.trim();
  if (cat.livre) {
    /* Sem texto fica sem texto. O "(efeito a descrever)" da prosa era enchimento,
       e na lista o título sozinho já diz que o efeito existe. */
    return { id: efeito.id, titulo: nome || cat.label, categoria: cat.label, texto: efeito.descricao?.trim() || "" };
  }
  const t = cat.tipos?.[efeito.tipo];
  if (!t) return null;
  const r = resolvido(efeito, dom, versao);
  return {
    id: efeito.id,
    titulo: nome || t.label,
    categoria: cat.label,
    texto: efeito.descricao?.trim() || r?.frase || "",
  };
}

/**
 * O corpo da expansão: `{ execucao, proprios, base, aparencia }`.
 *
 * `proprios` são os efeitos DESTA expansão, na ordem da ficha, mais o Acerto
 * Garantido quando ligado. `base` são os cinco efeitos de toda expansão aberta,
 * mais a regra do domo nas versões que TÊM domo (a Sem Barreiras tem Totem, e o
 * PV dele já está na linha).
 *
 * ⚠ Os efeitos base continuam saindo prontos, e isso é decisão do autor
 * (2026-07-30): na 2.5.2 eles ficavam só no formulário.
 */
export function corpoDoDominio(dominio, { dom = 0, versao, temAcertoGarantido = true, nomesFeiticos = {} } = {}) {
  const d = normalizeDominio(dominio);
  const v = versao || d.versao;
  const legacy = ehDominioLegacy(d);
  const vazio = {
    execucao: DOMINIO_EXECUCAO, requisitosExecucao: DOMINIO_REQUISITOS_EXECUCAO,
    proprios: [], base: [], aparencia: "",
  };
  if (!v) return vazio;
  const proprios = d.efeitos.map((e) => itemDoEfeito(e, dom, v)).filter(Boolean);
  // Só o Acerto Garantido que VALE (Aptidão, versão): o JSON antigo com `ativo`
  // numa Incompleta ou sem a Aptidão não aparece como efeito (2026-10-08).
  const ag = resumoAcertoGarantido(d, v, temAcertoGarantido, { nomesFeiticos });
  if (ag) {
    proprios.push({
      id: "acerto_garantido",
      titulo: "Acerto Garantido",
      // O modo anterior mostrava a frase do escopo como categoria, e continua.
      categoria: ag.legado ? ag.descricao : `${ag.rotuloTipo}${ag.letal ? "" : " · Não Letal"}`,
      texto: textoAcertoGarantido(ag),
    });
    if (ag.abertura) {
      proprios.push({ id: "abertura_02", titulo: "Abertura de 0,2 Segundos", categoria: "", texto: FRASE_ABERTURA_02 });
    }
  }
  const base = DOMINIO_EFEITOS_BASE.map((b) => ({ titulo: b.titulo, texto: b.texto }));
  if (temDomo(v, legacy) && v !== "sem_barreiras") base.push({ titulo: "Domo", texto: DOMO_INTERIOR });
  if (v === "sem_barreiras" && !legacy) base.push({ titulo: "Alcance do Acerto Garantido", texto: ALCANCE_SEM_BARREIRAS });
  return { ...vazio, proprios, base, aparencia: d.aparencia?.trim() ?? "" };
}

/* ------------------------------------------------------------ */
/* PONTE COM O MOTOR DE AUTOMAÇÃO                                */
/* ------------------------------------------------------------ */
/**
 * Os efeitos do domínio que caem sobre a PRÓPRIA ficha viram efeitos do Motor,
 * ligados ao estado `dominio_ativo` da bancada de Simulação de Combate. Os que
 * agem sobre criaturas hostis (todos os Ambientais) e os que não têm canal
 * (Negação de RD dos Feitiços) seguem só como texto, igual à 2.5.2.
 *
 * ⚠ Só o domínio marcado como ATIVO na ficha entra. Uma criatura pode ter várias
 * expansões escritas, e expandir é uma de cada vez.
 */
export function efeitosDoDominio(creature, { dom = 0, aptidoesEscolhidas = [], canalPermitido = null } = {}) {
  /* ⚠ A FASE (2026-10-08): o `quando: "dominio_ativo"` das linhas lê só o id
     da bancada, e ligaria tudo durante um Confronto. O portão é este (DA-15). */
  if (!expansaoDominioNoAr(creature, aptidoesEscolhidas)) return [];
  const ativo = dominioEmUso(creature, aptidoesEscolhidas);
  const versao = resolveVersao(ativo, aptidoesEscolhidas);
  if (!versao) return [];

  const out = [];
  const marca = (canal, expr, nome) => ({
    canal, expr, nome, origem: ativo.id,
    quando: "dominio_ativo", duracao: "temporaria",
  });

  const nomeBase = `${ativo.nome || "Expansão de Domínio"}: Efeito básico`;
  out.push(marca("movimentoMult", "2", nomeBase));
  /* ⚠ O ALVO É OBRIGATÓRIO AQUI desde 2026-09-09, quando o `custoPE` ganhou
     alcance. O texto desta linha é *"O custo dos seus Feitiços dentro da
     expansão é reduzido em um valor igual ao seu Nível de DOM"*, e sem o alvo
     ela passaria a baratear Domínio Simples, Estilo e Invocação junto. */
  out.push({ ...marca("custoPE", "dom", nomeBase), alvo: "feitico" });

  for (const efeito of ativo.efeitos) {
    /* O Efeito Especial entra pelas linhas de Motor que a pessoa escreveu (DA-20),
       só nos canais que o derive permite. Sem a função, nada entra. */
    if (categoriaLivre(efeito.categoria)) {
      if (typeof canalPermitido !== "function") continue;
      const nome = `${ativo.nome || "Expansão de Domínio"}: ${efeito.nome?.trim() || "Efeito Especial"}`;
      for (const m of efeito.motor ?? []) {
        if (!canalPermitido(m.canal) || !String(m.expr ?? "").trim()) continue;
        out.push({ ...marca(m.canal, String(m.expr), nome), ...(m.alvo ? { alvo: m.alvo } : {}) });
      }
      continue;
    }
    const r = resolvido(efeito, dom, versao);
    if (!r) continue;
    const nome = `${ativo.nome || "Expansão de Domínio"}: ${rotuloDoEfeito(efeito)}`;
    for (const m of r.motor ?? []) {
      out.push({ ...marca(m.canal, m.expr, nome), ...(m.alvo ? { alvo: m.alvo } : {}) });
    }
    // O Aumento de Atributo precisa dos dois atributos que o jogador escolheu,
    // então ele não cabe no `motor` da tabela, que é fixo.
    if (r.motorAtributo) {
      const alvos = (Array.isArray(efeito.atributos) ? efeito.atributos.filter(Boolean) : []).slice(0, 2);
      for (const alvo of alvos) out.push({ ...marca("atributo", String(r.motorAtributo), nome), alvo });
    }
    /* A RD Corporal sai por TIPO ESCOLHIDO (2026-10-08), até o teto do DOM. O
       texto livre antigo (`rdTiposTexto`) não vira número: sem a lista, a RD
       fica fora, e o `validarDominio` avisa. */
    if (r.motorRdTipo) {
      const tipos = [...new Set(efeito.rdTipos ?? [])].slice(0, r.tiposMax);
      for (const alvo of tipos) out.push({ ...marca("rdTipo", String(r.motorRdTipo), nome), alvo });
    }
  }
  return out;
}

/**
 * A AMPLIFICAÇÃO DE TÉCNICA da Expansão no ar, em números, para os Especiais de
 * dano (Golpeador e Dano na Alma) (2026-10-08, E-10).
 *
 * ⚠ POR QUE NÃO PELO ALVO `feitico` DO MOTOR. O Feitiço de Dano já lê essas
 * linhas por escopo, numa avaliação por linha que só ele faz (o Foco Amaldiçoado
 * escreve no mesmo alvo com `dados_dano_final`). Ensinar o Golpeador a ler o
 * alvo genérico mudaria também aquele número. A Expansão diz "todos os seus
 * Feitiços", então ela chega aos Especiais por aqui, explícita, e só ela.
 */
export function amplificacaoDeTecnica(creature, { dom = 0, aptidoesEscolhidas = [] } = {}) {
  if (!expansaoDominioNoAr(creature, aptidoesEscolhidas)) return null;
  const ativo = dominioEmUso(creature, aptidoesEscolhidas);
  const versao = resolveVersao(ativo, aptidoesEscolhidas);
  let dados = 0, fixo = 0, ignoraRD = 0, removeResistencia = false;
  for (const efeito of ativo.efeitos) {
    if (efeito.categoria !== "amp_tecnica") continue;
    for (const m of resolvido(efeito, dom, versao)?.motor ?? []) {
      if (m.alvo !== "feitico") continue;
      const valor = Math.trunc(Number(m.expr) || 0);
      if (m.canal === "dadosDano") dados += valor;
      else if (m.canal === "danoBonus") fixo += valor;
      else if (m.canal === "ignoraRD") ignoraRD += valor;
      else if (m.canal === "removeResistencia") removeResistencia = removeResistencia || valor > 0;
    }
  }
  if (!dados && !fixo && !ignoraRD && !removeResistencia) return null;
  return {
    nome: `${ativo.nome || "Expansão de Domínio"}: Amplificação de Técnica`,
    dados, fixo, ignoraRD, removeResistencia,
  };
}

/* ------------------------------------------------------------ */
/* VALIDAÇÃO DE UMA EXPANSÃO (DA-17, 2026-10-08)                 */
/* ------------------------------------------------------------ */
/* A chave MECÂNICA de um efeito, para achar a duplicata IDÊNTICA. Dois efeitos da
   mesma categoria são legítimos quando forem diferentes (Livro: "É possível
   colocar mais de um efeito do mesmo tipo, mas eles devem ainda ser
   diferentes"). Idêntico é: mesma categoria, mesmo tipo e as mesmas escolhas. */
function chaveMecanica(e) {
  if (categoriaLivre(e.categoria)) {
    return `${e.categoria}|${String(e.nome ?? "").trim()}|${String(e.descricao ?? "").trim()}`;
  }
  const ordenado = (lista) => [...(lista ?? [])].map(String).sort().join(",");
  const conds = (e.condicoes ?? []).map((c) => `${c.forca}:${c.nome}`);
  return `${e.categoria}|${e.tipo}|${ordenado(e.atributos)}|${ordenado(e.rdTipos)}|${ordenado(conds)}`;
}

/**
 * A validação de uma Expansão, em três níveis. ERRO deixa a Expansão sem abrir,
 * com os dados preservados (DA-17). AVISO e INFO não travam.
 *
 * `ctx`: `{ dom, versao, maxEfeitos, temAcertoGarantido, versaoGravada,
 * condicoesValidas }`. `condicoesValidas` é o mapa força → nomes do catálogo
 * real (`CONDICOES_CATALOGO`), que chega do derive porque este módulo não
 * importa nada. Pelo mesmo motivo chegam `nomesFeiticos` (id → nome, para o
 * Acerto Garantido de Feitiços) e `canalPermitido` (o filtro de canais do Motor
 * do Efeito Especial).
 */
export function validarDominio(dominio, {
  dom = 0, versao, maxEfeitos = 0, temAcertoGarantido = false, condicoesValidas = null,
  nomesFeiticos = null, canalPermitido = null,
} = {}) {
  const d = normalizeDominio(dominio);
  const v = versao || d.versao;
  const out = [];
  const erro = (codigo, texto) => out.push({ nivel: "erro", codigo, texto });
  const aviso = (codigo, texto) => out.push({ nivel: "aviso", codigo, texto });

  if (!v) erro("versao", "Nenhuma versão de Expansão disponível.");
  else if (d.versao && d.versao !== v) aviso("versao", `${rotuloVersao(d.versao)} indisponível, usando ${rotuloVersao(v)}.`);

  const usadas = vagasUsadas(d.efeitos);
  if (usadas > maxEfeitos) erro("limite", `Efeitos de Expansão: ${usadas} de ${maxEfeitos}.`);

  const vistas = new Set();
  let condicoes = 0;
  for (const e of d.efeitos) {
    const chave = chaveMecanica(e);
    if (vistas.has(chave)) erro("duplicata", `${rotuloDoEfeito(e)} repetido.`);
    vistas.add(chave);
    if (categoriaLivre(e.categoria)) {
      aviso("especial", `${e.nome?.trim() || "Efeito Especial"}: requer aprovação do Narrador.`);
      if (fortalecimentosDe(e)) aviso("fortalecer", `${e.nome?.trim() || "Efeito Especial"}: o fortalecimento é decidido pela mesa.`);
      continue;
    }
    const r = resolvido(e, dom, v);
    if (!r) { erro("efeito", `Efeito desconhecido: ${e.categoria}.`); continue; }
    if (e.categoria === "amp_corporal" && e.tipo === "atributo") {
      const atributos = new Set((e.atributos ?? []).filter(Boolean));
      if (atributos.size < 2) erro("atributos", "Aumento de Atributo: escolha dois atributos físicos distintos.");
    }
    if (r.motorRdTipo != null) {
      const tipos = new Set(e.rdTipos ?? []);
      if (tipos.size > r.tiposMax) erro("rdTipos", `Redução de Dano: ${tipos.size} tipos de ${r.tiposMax}.`);
      else if (tipos.size === 0) aviso("rdTipos", "Redução de Dano: escolha os tipos de dano.");
    }
    if (r.dadosCondicao != null) {
      condicoes += 1;
      const gasto = (e.condicoes ?? []).reduce((s, c) => s + (CUSTO_CONDICAO_AMBIENTAL[c.forca] ?? 0), 0);
      if (gasto > r.dadosCondicao) erro("condicoesDados", `Condições: ${gasto} dados de ${r.dadosCondicao}.`);
      for (const c of e.condicoes ?? []) {
        if (!r.forcasCondicao.includes(c.forca)) erro("condicaoForca", `${c.nome}: condição ${c.forca === "extrema" ? "Extrema" : "forte demais"} para este Domínio.`);
        else if (condicoesValidas && !(condicoesValidas[c.forca] ?? []).includes(c.nome)) erro("condicaoNome", `${c.nome}: condição desconhecida.`);
      }
      if ((e.condicoes ?? []).length === 0) aviso("condicoes", "Condições: escolha as condições.");
    }
  }
  if (condicoes > 1) erro("condicoesRepetidas", "O Efeito Ambiental de Condições só entra uma vez.");

  if (d.acertoGarantido?.ativo && v === "incompleta") {
    aviso("acertoIncompleta", "Acerto Garantido indisponível na Expansão Incompleta.");
  } else if ((d.acertoGarantido?.ativo || v === "sem_barreiras") && !temAcertoGarantido) {
    aviso("acertoAptidao", "Acerto Garantido indisponível sem a Aptidão.");
  }

  /* O ACERTO GARANTIDO ESTRUTURADO (Etapa 8). Só o que vale é conferido: o
     desligado ou sem Aptidão não pesa na abertura. */
  const ag = resumoAcertoGarantido(d, v, temAcertoGarantido, { nomesFeiticos: nomesFeiticos ?? {} });
  if (ag && !ag.legado) {
    if (ag.tipo === "condicao") {
      if (ag.referencias.some((x) => x.nome === AG_CONDICAO_PROIBIDA)) {
        erro("acertoDesmembramento", "Acerto Garantido: Desmembramento não pode ser garantido.");
      }
      if (ag.referencias.length === 0) aviso("acertoCondicao", "Acerto Garantido: escolha a condição.");
    }
    if (ag.tipo === "feiticos") {
      if (!ag.escopo && ag.referencias.length === 0) aviso("acertoFeiticos", "Acerto Garantido: escolha o grupo de Feitiços.");
      if (nomesFeiticos && ag.referencias.some((x) => x.nome == null)) {
        aviso("acertoFeiticoSumiu", "Acerto Garantido: um Feitiço escolhido não existe mais na ficha.");
      }
    }
    // DA-20: a modalidade livre vale com o Narrador, como o Efeito Especial.
    if (["informacao", "voto", "outro"].includes(ag.tipo)) {
      if (!ag.descricao) aviso("acertoDescricao", "Acerto Garantido: descreva o efeito.");
      if (ag.tipo === "outro") aviso("acertoLivre", "Acerto Garantido Livre: requer aprovação do Narrador.");
    }
  }

  /* O MOTOR OPCIONAL DO EFEITO ESPECIAL (DA-20). Canal desconhecido ou fora da
     lista permitida não entra no Motor: a linha fica gravada e a tela avisa. */
  if (typeof canalPermitido === "function") {
    for (const e of d.efeitos) {
      if (!categoriaLivre(e.categoria)) continue;
      for (const m of e.motor ?? []) {
        if (!canalPermitido(m.canal)) aviso("motorCanal", `${e.nome?.trim() || "Efeito Especial"}: o canal ${m.canal || "vazio"} não vale numa Expansão.`);
        else if (!String(m.expr ?? "").trim()) aviso("motorExpr", `${e.nome?.trim() || "Efeito Especial"}: linha do Motor sem expressão.`);
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------ */
/* VALIDADOR                                                     */
/* ------------------------------------------------------------ */
export function validarCatalogoDominios() {
  const erros = [];
  for (const [catId, cat] of Object.entries(DOMINIO_EFEITOS)) {
    if (!cat.label) erros.push(`categoria ${catId} sem label`);
    if (cat.livre) continue;
    if (!Object.keys(cat.tipos ?? {}).length) erros.push(`categoria ${catId} sem tipos`);
    for (const [tipoId, t] of Object.entries(cat.tipos ?? {})) {
      if (typeof t.resolve !== "function") { erros.push(`${catId}.${tipoId} sem resolve`); continue; }
      // As tabelas têm cinco degraus (DOM 1 a 5), e um buraco viraria NaN calado.
      for (let i = 0; i < 5; i++) {
        // Zero, um e dois fortalecimentos (DA-12).
        for (const f of [0, 1, 2]) {
          const r = t.resolve(i, f);
          if (!r?.valor || !r?.frase) erros.push(`${catId}.${tipoId} no DOM ${i + 1}${f ? ` com ${f} fortalecimento(s)` : ""} sem valor ou frase`);
          if (/NaN|undefined/.test(`${r?.valor}${r?.frase}`)) erros.push(`${catId}.${tipoId} no DOM ${i + 1}${f ? ` com ${f} fortalecimento(s)` : ""} produz NaN`);
        }
      }
    }
  }
  for (const v of DOMINIO_VERSOES) {
    if (DOMINIO_CUSTO_BASE[v.key] == null) erros.push(`versão ${v.key} sem custo base`);
  }
  return erros;
}
