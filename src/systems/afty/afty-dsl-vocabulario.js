/**
 * ============================================================
 * VOCABULÁRIO DO DSL — o que existe, e quanto vale AGORA
 * ============================================================
 * Nasceu em 2026-08-10, a pedido do autor: *"O DSL mostrando os valores e
 * derivados não existe em nenhum lugar no Grimório Afty. Com eu precisando
 * adivinhar o nome das variáveis."*
 *
 * O `docs/automacao-dsl.md` espelha só o fm-dsl da 2.5.2, e o Afty acrescenta a
 * maior parte do vocabulário em `buildCriaturaDslContext`. Dentro do app não
 * havia nada: quem escrevia uma expressão tinha de lembrar o nome de cor.
 *
 * ------------------------------------------------------------
 * ⚠ ELE CLASSIFICA O CONTEXTO REAL, e não mantém uma lista paralela
 * ------------------------------------------------------------
 * A entrada é o próprio objeto que o `evalNumber` consome. Cada chave cai em
 * exatamente UM grupo, e o que nenhuma regra reconhece cai em "Outras" em vez de
 * sumir. É de propósito: uma lista escrita à mão envelheceria calada no dia em
 * que alguém somasse uma variável ao contexto, e o seletor passaria a mentir
 * sobre o que existe. Aqui, variável nova aparece sozinha.
 *
 * ------------------------------------------------------------
 * ⚠ AS FAMÍLIAS GRANDES MOSTRAM SÓ O QUE É VERDADE (autor, 2026-08-10)
 * ------------------------------------------------------------
 * `tem_*` tem uma entrada por habilidade do catálogo, e são ~497 numa criatura
 * qualquer: despejá-las todas afogaria os 15 valores que interessam. O grupo
 * marcado com `sobPedido` lista só as que não valem zero, e a BUSCA alcança as
 * outras, para escrever condição sobre habilidade que a criatura ainda não tem.
 * O cabeçalho do grupo mostra `visíveis de total`, então o que está escondido
 * nunca fica invisível.
 * ============================================================
 */

import { COMBATE_VARS } from "./afty-combate";

/* Nomes EXATOS, na ordem em que devem aparecer. O que estiver aqui sai do
   alcance das regras de prefixo mais abaixo. */
const POR_NOME = [
  {
    id: "nucleo",
    label: "Núcleo",
    nomes: [
      ["nd", "Nível de Desafio"],
      ["bt", "Bônus de Treinamento"],
      ["maestria", "Maestria, o mesmo valor do Bônus de Treinamento"],
      ["grau", "Grau de feiticeiro, Quarto 1 até Especial 5"],
      ["vez", "Qual repetição está sendo avaliada"],
      ["alma_atual", "Integridade da Alma"],
      ["rd_escudo", "RD base do escudo equipado"],
    ],
  },
  {
    id: "atributos",
    label: "Atributos",
    nomes: [
      ["forca", "Valor de Força"], ["mod_forca", "Modificador de Força"],
      ["destreza", "Valor de Destreza"], ["mod_destreza", "Modificador de Destreza"],
      ["constituicao", "Valor de Constituição"], ["mod_constituicao", "Modificador de Constituição"],
      ["inteligencia", "Valor de Inteligência"], ["mod_inteligencia", "Modificador de Inteligência"],
      ["sabedoria", "Valor de Sabedoria"], ["mod_sabedoria", "Modificador de Sabedoria"],
      ["presenca", "Valor de Presença"], ["mod_presenca", "Modificador de Presença"],
      ["mod_int_ou_sab", "O maior entre os modificadores de Inteligência e Sabedoria"],
      ["mod_pre_ou_sab", "O maior entre os modificadores de Presença e Sabedoria"],
    ],
  },
  {
    id: "aptidoes",
    label: "Níveis de Aptidão",
    nomes: [
      ["dom", "Domínio"], ["au", "Aura"], ["cl", "Controle e Leitura"],
      ["bar", "Barreira"], ["er", "Energia Reversa"],
    ],
  },
  {
    id: "tecnica",
    label: "Técnica",
    nomes: [
      ["mod_tecnica", "Modificador do atributo da Técnica"],
      ["tecnica_forca", "A Técnica usa Força"],
      ["tecnica_destreza", "A Técnica usa Destreza"],
      ["tecnica_constituicao", "A Técnica usa Constituição"],
      ["tecnica_inteligencia", "A Técnica usa Inteligência"],
      ["tecnica_sabedoria", "A Técnica usa Sabedoria"],
      ["tecnica_presenca", "A Técnica usa Presença"],
    ],
  },
  {
    id: "identidade",
    label: "Patamar e Tipo",
    nomes: [
      ["patamar_comum", "É do patamar Comum"], ["patamar_desafio", "É do patamar Desafio"],
      ["patamar_calamidade", "É do patamar Calamidade"], ["patamar_beyond", "É do patamar Beyond"],
      ["tipo_combatente", "É do Tipo Combatente"], ["tipo_misto", "É do Tipo Misto"],
      ["tipo_conjurador", "É do Tipo Conjurador"], ["tipo_restringido", "É do Tipo Restringido"],
    ],
  },
  {
    id: "gemeos",
    label: "Gêmeos Feiticeiros",
    nomes: [
      ["irmao_morto", "O irmão morreu, o segundo estágio da Restrição Celestial"],
      ["iniciativa_irmao", "Bônus de Iniciativa do outro gêmeo"],
    ],
  },
];

/* Regras de PREFIXO, da mais específica para a mais geral. A ordem importa:
   `prof_tr_` tem de ser testada antes de `prof_`, senão um Teste de Resistência
   entraria no grupo de Perícias. */
const POR_PREFIXO = [
  { id: "resistencias", label: "Testes de Resistência", prefixo: "prof_tr_", sobPedido: true },
  { id: "pericias", label: "Perícias", prefixo: "prof_", sobPedido: true },
  { id: "habilidades", label: "Habilidades e Talentos", prefixo: "tem_", sobPedido: true },
  { id: "nivelEspec", label: "Nível por Especialização", prefixo: "nivel_" },
  { id: "escEspec", label: "Escalonamento por Especialização", prefixo: "esc_" },
  { id: "opcaoAptidao", label: "Escolhas de Aptidão", prefixo: "opt_", sobPedido: true },
  { id: "estilo", label: "Estilo das Sombras", prefixo: "estilo_" },
];

const GRUPO_COMBATE = { id: "combate", label: "Simulação de Combate" };
const GRUPO_LINHA = { id: "linha", label: "Linha de Dano" };
const GRUPO_OUTRAS = { id: "outras", label: "Outras" };

/* Variáveis que só existem DEPOIS que a linha de dano fecha. Elas não estão no
   contexto geral, e mesmo assim precisam aparecer: quem escreve um efeito de
   Feitiço precisa saber que elas existem. Ver `efeitoUsaDadosDanoFinal`. */
const VARS_LINHA = [
  ["dados_dano_final", "Quantos dados a linha vai rolar, já fechada"],
  ["nivel_feitico", "Nível do Feitiço sendo conjurado"],
];

const COMBATE = new Set(COMBATE_VARS);

/** Onde esta variável mora. Uma chave cai em exatamente um grupo. */
function grupoDaVariavel(nome, extras) {
  for (const g of POR_NOME) {
    if (g.nomes.some(([n]) => n === nome)) return g.id;
  }
  if (COMBATE.has(nome) || extras.has(nome)) return GRUPO_COMBATE.id;
  for (const r of POR_PREFIXO) {
    if (nome.startsWith(r.prefixo)) return r.id;
  }
  // `em_postura_sol` e companhia: booleanas de família da bancada, que o
  // COMBATE_VARS já cobre, mas o prefixo pega o que nascer fora dele.
  if (nome.startsWith("em_")) return GRUPO_COMBATE.id;
  return GRUPO_OUTRAS.id;
}

const numero = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * O vocabulário agrupado, com o valor de cada variável no contexto dado.
 *
 * @param ctx     o objeto que o `evalNumber` consome (`derived.contextoDsl`)
 * @param extras  ids dos `estadosExtras` da bancada, que são de instância e não
 *                de catálogo, então não estão no `COMBATE_VARS`
 * @returns `[{ id, label, sobPedido, itens: [{ nome, valor, nota }] }]`
 */
export function vocabularioDsl(ctx = {}, extras = []) {
  const idsExtras = new Set((Array.isArray(extras) ? extras : []).map((e) => e?.id).filter(Boolean));
  const notaDe = new Map();
  for (const g of POR_NOME) for (const [n, nota] of g.nomes) notaDe.set(n, nota);
  for (const [n, nota] of VARS_LINHA) notaDe.set(n, nota);

  const balde = new Map();
  const guarda = (grupoId, item) => {
    if (!balde.has(grupoId)) balde.set(grupoId, []);
    balde.get(grupoId).push(item);
  };

  for (const nome of Object.keys(ctx)) {
    guarda(grupoDaVariavel(nome, idsExtras), {
      nome,
      valor: numero(ctx[nome]),
      nota: notaDe.get(nome) ?? null,
    });
  }
  for (const [nome, nota] of VARS_LINHA) {
    // ⚠ Valor `null`, e não zero: elas não têm valor fora de uma linha de dano, e
    // mostrar 0 faria o jogador achar que a expressão dele daria zero.
    guarda(GRUPO_LINHA.id, { nome, valor: null, nota });
  }

  // A ordem dos grupos é a de declaração, e dentro de cada um a ordem é a
  // declarada (nos por-nome) ou alfabética (nas famílias, que são catálogo).
  const ordemDeclarada = (g) => {
    const itens = balde.get(g.id) ?? [];
    const pos = new Map(g.nomes.map(([n], i) => [n, i]));
    return [...itens].sort((a, b) => (pos.get(a.nome) ?? 999) - (pos.get(b.nome) ?? 999));
  };

  const saida = [
    ...POR_NOME.map((g) => ({ id: g.id, label: g.label, sobPedido: false, itens: ordemDeclarada(g) })),
    { ...GRUPO_COMBATE, sobPedido: false, itens: (balde.get(GRUPO_COMBATE.id) ?? []).sort(porNome) },
    ...POR_PREFIXO.map((r) => ({
      id: r.id,
      label: r.label,
      sobPedido: !!r.sobPedido,
      itens: (balde.get(r.id) ?? []).sort(porNome),
    })),
    { ...GRUPO_LINHA, sobPedido: false, itens: balde.get(GRUPO_LINHA.id) ?? [] },
    { ...GRUPO_OUTRAS, sobPedido: false, itens: (balde.get(GRUPO_OUTRAS.id) ?? []).sort(porNome) },
  ];
  return saida.filter((g) => g.itens.length);
}

const porNome = (a, b) => a.nome.localeCompare(b.nome);

/** As funções do DSL, para o seletor oferecer o que não é variável. */
export const DSL_FUNCOES = [
  { nome: "metade(x)", insere: "metade()", nota: "Metade de x" },
  { nome: "dobro(x)", insere: "dobro()", nota: "Dobro de x" },
  { nome: "piso(x)", insere: "piso()", nota: "Arredonda para baixo" },
  { nome: "teto(x)", insere: "teto()", nota: "Arredonda para cima" },
  { nome: "arredonda(x)", insere: "arredonda()", nota: "Arredonda ao inteiro mais próximo" },
  { nome: "abs(x)", insere: "abs()", nota: "Valor absoluto" },
  { nome: "min(a, b)", insere: "min()", nota: "O menor valor" },
  { nome: "max(a, b)", insere: "max()", nota: "O maior valor" },
];
