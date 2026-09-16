/* ============================================================ */
/* CRIAÇÃO DE EQUIPAMENTOS (Addon)                               */
/* ============================================================ */
/*
 * O guia "Criação de Equipamentos e Itens 2.5.2", entregue pelo autor em
 * 2026-09-14. O arquivo original está copiado sem mudança nenhuma em
 * `docs/afty-criacao-equipamentos-fonte.md`, e é de lá que o texto das próximas
 * fases tem de sair. O guia de sistema está em `docs/afty-criacao-equipamentos.md`.
 *
 * FASE 1: Revestimentos e Escudos criados. As fases 2 (Armas), 3 (Itens de
 * Custo) e 4 (Encantamento de Grau Especial) ainda não existem.
 *
 * ⚠ AO CONTRÁRIO DA BANCADA DE PONTOS DE CRIAÇÃO, ESTA TABELA DECIDE O NÚMERO.
 * A bancada de `afty-criacao-armas.js` só conta uma arma que a pessoa já podia
 * escrever campo por campo, e por isso é `permite`. Aqui a ficha grava o Custo
 * e a troca, e a Defesa, a RD, a penalidade, o dado e os espaços saem das
 * contas abaixo na LEITURA. Um número que muda a ficha é regra, e por isso o
 * pacote é `libera` (ver `LIBERACOES` em `afty-addons.js`), no molde dos
 * Acessórios Únicos da Benção do Grão Mestre da Forja.
 *
 * ⚠ MÓDULO FOLHA, sem import nenhum. O `afty-equipamentos.js` o chama dentro do
 * `catalogoDoTipo`, e um import de volta fecharia um ciclo com ele. Ver
 * `asserts/t-ordem-modulos.mjs`.
 */

/* ------------------------------------------------------------ */
/* O TEXTO DO GUIA (verbatim, com os erros de digitação)          */
/* ------------------------------------------------------------ */
/* O autor pediu em 2026-09-14 que o texto fosse transcrito como está: *"quando
   eu achar o problema peço eu peço para vc corrigir"*. O "+no" e o
   "RD(Especifico)" são do original. A marcação de negrito saiu, porque ela é
   formatação do documento e não palavra. */

export const TEXTO_REVESTIMENTOS =
  "Diferente das Armas, Revestimentos e Armaduras são equipamentos com uma criação mais fácil, podendo variar por custo e penalidade. Por padrão, todo Revestimento e Armadura recebe uma penalidade igual ao (Valor do Bônus de Defesa do Revestimento - 2) a suas perícias de Destreza. A única forma de aumentar a Defesa recebida é aumentando o custo. Como o Revestimento Sob Medida, você também pode adicionar efeitos especiais, podendo adicionar +no em uma Perícias ou RD(Especifico), com um máximo de +2 por Perícia ou RD, sacrificando o aumento de Defesa que você receberia ao aumentar o custo. Benefícios que não envolvam valores numéricos também podem ser adicionados, porém isso deve ser conversado com seu Narrador.";

export const TEXTO_ESCUDOS =
  "Escudos seguem as mesmas regras dos Revestimentos e das Armaduras. O Custo 1 de Escudo, no entanto, possui uma regra diferente do Custo 1 de Revestimento, no qual deve ter penalidades aplicadas desde o início.\n\nEscudos, por padrão, diferente dos Revestimentos, não podem ter efeitos especiais aplicados neles.";

/* ------------------------------------------------------------ */
/* AS TABELAS                                                    */
/* ------------------------------------------------------------ */

export const CUSTOS_CRIACAO = [1, 2, 3, 4];

/** A tabela de Revestimentos e Armaduras do guia. */
export const TABELA_REVESTIMENTO = [
  { custo: 1, defesa: 2, penalidade: 0 },
  { custo: 2, defesa: 4, penalidade: -2 },
  { custo: 3, defesa: 6, penalidade: -4 },
  { custo: 4, defesa: 8, penalidade: -6 },
];

/** A tabela de Escudos do guia. A coluna do guia se chama "RD(Física)". */
export const TABELA_ESCUDO = [
  { custo: 1, rd: 2, penalidade: -1 },
  { custo: 2, rd: 4, penalidade: -2 },
  { custo: 3, rd: 6, penalidade: -4 },
  { custo: 4, rd: 8, penalidade: -6 },
];

/* ⚠ O QUE O GUIA NÃO DIZ, e o autor decidiu em 2026-09-14. Cada linha abaixo é
   resposta a uma pergunta, e nenhuma é leitura do texto.

   • Espaços do Revestimento: *"Custo 4 vira 6 Espaços, seguindo o padrão de
     subida"*. O 0, 2 e 4 são os do Leve, Médio e Robusto do livro, e os
     espaços seguem o Custo mesmo com a troca.
   • Dado do escudo: um degrau por Custo, seguindo o livro (Leve 1d4, Médio
     1d6, Pesado 1d8), e o Custo 4 fica com 1d10. O tipo é Impacto, que é o
     dos escudos do livro (autor, 2026-07-22).
   • Espaços do escudo: 2, que é a regra geral de carregamento para todo
     escudo. */
export const ESPACOS_REVESTIMENTO = { 1: 0, 2: 2, 3: 4, 4: 6 };
export const DADO_ESCUDO = { 1: "1d4", 2: "1d6", 3: "1d8", 4: "1d10" };
export const TIPO_DANO_ESCUDO = "im";
export const ESPACOS_ESCUDO = 2;

/* ⚠ A TROCA DO REVESTIMENTO (autor, 2026-09-14): *"Consome 2 de Defesa para
   adicionar +2 em duas pericias / rd. Logo um Custo 4 poderia ter 6 de Defesa e
   -4 de Penalidade e +2 em Atletismo e RD"*.

   • UM degrau só por Revestimento, perguntado na mesma data.
   • Só a partir do Custo 2: o texto troca o "aumento de Defesa que você
     receberia ao aumentar o custo", e o Custo 1 não tem aumento.
   • A penalidade sai da Defesa que SOBROU, que é o que o exemplo dele mostra.
   • A RD é a RD por Tipo (canal `rdTipo`), perguntado na mesma data.
   • "com um máximo de +2 por Perícia ou RD": as duas escolhas não se repetem. */
export const DEFESA_DA_TROCA = 2;
export const BONUS_DA_TROCA = 2;
export const ESCOLHAS_DA_TROCA = 2;
export const CUSTO_MINIMO_TROCA = 2;

/** O que cada escolha da troca pode ser, e o canal do Motor onde ela soma. */
export const TIPOS_ESCOLHA_TROCA = [
  { value: "pericia", label: "Perícia", canal: "bonusPericia" },
  { value: "rd", label: "RD por Tipo", canal: "rdTipo" },
];
const CANAL_DA_ESCOLHA = Object.fromEntries(TIPOS_ESCOLHA_TROCA.map((t) => [t.value, t.canal]));

/* ------------------------------------------------------------ */
/* AS CONTAS                                                     */
/* ------------------------------------------------------------ */

/** Um Custo de criação válido. Qualquer coisa fora de 1 a 4 cai no 1. */
export function custoDeCriacao(valor) {
  const n = Math.trunc(Number(valor));
  return CUSTOS_CRIACAO.includes(n) ? n : 1;
}

/**
 * A penalidade de um Revestimento pela fórmula do texto: *"uma penalidade igual
 * ao (Valor do Bônus de Defesa do Revestimento - 2)"*. Nunca positiva.
 *
 * ⚠ É A FÓRMULA, e não a coluna, que vale para a Defesa depois da troca. Há
 * assert conferindo que as duas dão o mesmo número em toda linha da tabela.
 */
export const penalidadeDaDefesa = (defesa) => -Math.max(0, defesa - 2);

/**
 * Os números de um Revestimento criado.
 *
 * `defesaCriatura` é o que vale na ficha de CRIATURA, onde a Defesa do uniforme
 * é o Custo (divergência `defesaUniforme`). Com a troca ela desce 1, que é o
 * que o Sob Medida do livro já faz lá: Custo 2 e Defesa 1 (autor, 2026-09-14).
 */
export function numerosDoRevestimento({ custo, troca } = {}) {
  const c = custoDeCriacao(custo);
  const linha = TABELA_REVESTIMENTO.find((l) => l.custo === c);
  const trocou = !!troca && c >= CUSTO_MINIMO_TROCA;
  const defesa = linha.defesa - (trocou ? DEFESA_DA_TROCA : 0);
  return {
    custo: c,
    troca: trocou,
    defesa,
    defesaCriatura: c - (trocou ? 1 : 0),
    penalidade: penalidadeDaDefesa(defesa),
    espacos: ESPACOS_REVESTIMENTO[c],
  };
}

/** Os números de um Escudo criado. */
export function numerosDoEscudo({ custo } = {}) {
  const c = custoDeCriacao(custo);
  const linha = TABELA_ESCUDO.find((l) => l.custo === c);
  return {
    custo: c,
    rd: linha.rd,
    penalidade: linha.penalidade,
    dado: DADO_ESCUDO[c],
    tipoDano: TIPO_DANO_ESCUDO,
    espacos: ESPACOS_ESCUDO,
  };
}

/* ------------------------------------------------------------ */
/* NA FICHA                                                      */
/* ------------------------------------------------------------ */
/* `creature.revestimentosCriados` e `creature.escudosCriados`. A ficha guarda só
   o que a pessoa escolhe (nome, Custo, a troca e as duas escolhas). Todo número
   sai das contas acima na leitura, e por isso não existe número gravado que
   possa discordar da tabela. */

export const PREFIXO_REVESTIMENTO = "revc_";
export const PREFIXO_ESCUDO = "escc_";

let seq = 0;
const idNovo = (prefixo) => {
  seq += 1;
  return `${prefixo}${Date.now().toString(36)}_${seq}`;
};

/** Um Revestimento criado novo: Custo 1, sem nome e sem troca. */
export const novoRevestimentoCriado = (patch = {}) => ({
  id: idNovo(PREFIXO_REVESTIMENTO), nome: "", custo: 1, troca: false, escolhas: [], ...patch,
});

/** Um Escudo criado novo: Custo 1 e sem nome. */
export const novoEscudoCriado = (patch = {}) => ({
  id: idNovo(PREFIXO_ESCUDO), nome: "", custo: 1, ...patch,
});

/**
 * As escolhas da troca, saneadas: no máximo duas, cada uma com tipo conhecido e
 * alvo preenchido, sem repetir o mesmo tipo e alvo.
 *
 * ⚠ ESCOLHA SEM ALVO FICA, e não vira efeito. Ela é o seletor que a pessoa
 * acabou de abrir, e jogá-la fora na leitura faria o campo sumir antes de ela
 * escolher. Quem ignora o vazio é `efeitosDoRevestimento`.
 */
export function saneiaEscolhasDaTroca(brutas) {
  const lista = Array.isArray(brutas) ? brutas : [];
  const out = [];
  const vistos = new Set();
  for (const b of lista) {
    if (out.length >= ESCOLHAS_DA_TROCA) break;
    if (!b || typeof b !== "object" || !CANAL_DA_ESCOLHA[b.tipo]) continue;
    const alvo = typeof b.alvo === "string" ? b.alvo : "";
    const chave = `${b.tipo}:${alvo}`;
    if (alvo && vistos.has(chave)) continue;
    if (alvo) vistos.add(chave);
    out.push({ tipo: b.tipo, alvo });
  }
  return out;
}

/** As linhas do Motor que a troca de um Revestimento emite. */
export function efeitosDoRevestimento({ troca, escolhas } = {}) {
  if (!troca) return [];
  return saneiaEscolhasDaTroca(escolhas)
    .filter((e) => e.alvo)
    .map((e) => ({ canal: CANAL_DA_ESCOLHA[e.tipo], alvo: e.alvo, expr: String(BONUS_DA_TROCA) }));
}

const nomeDe = (bruto, reserva) => String(bruto?.nome ?? "").trim() || reserva;

/**
 * Um Revestimento criado no formato de uma entrada de `UNIFORME_MODIFICACOES`,
 * ou `null` quando nem o id se salva.
 *
 * ⚠ O FORMATO É O DO CATÁLOGO, e é isso que dispensa verbo novo no motor. O
 * `resolveEquipamentos` já lê `defesa`, `defesaCriatura`, `penalidade`,
 * `espacos` e `efeito.motor` de toda modificação de uniforme.
 */
export function revestimentoCriadoParaCatalogo(bruto) {
  if (!bruto || typeof bruto !== "object") return null;
  if (typeof bruto.id !== "string" || !bruto.id.startsWith(PREFIXO_REVESTIMENTO)) return null;
  const n = numerosDoRevestimento(bruto);
  const escolhas = n.troca ? saneiaEscolhasDaTroca(bruto.escolhas) : [];
  const motor = efeitosDoRevestimento({ troca: n.troca, escolhas });
  return {
    id: bruto.id,
    nome: nomeDe(bruto, "Revestimento sem Nome"),
    defesa: n.defesa,
    defesaCriatura: n.defesaCriatura,
    penalidade: n.penalidade,
    custo: n.custo,
    espacos: n.espacos,
    descricao: "",
    troca: n.troca,
    escolhas,
    ...(motor.length ? { efeito: { aplicado: true, motor } } : {}),
    criado: "revestimento",
    custom: true,
  };
}

/** Um Escudo criado no formato de uma entrada de `ESCUDOS`, ou `null`. */
export function escudoCriadoParaCatalogo(bruto) {
  if (!bruto || typeof bruto !== "object") return null;
  if (typeof bruto.id !== "string" || !bruto.id.startsWith(PREFIXO_ESCUDO)) return null;
  const n = numerosDoEscudo(bruto);
  return {
    id: bruto.id,
    nome: nomeDe(bruto, "Escudo sem Nome"),
    dano: { dado: n.dado, tipo: n.tipoDano },
    rdEscudo: n.rd,
    penalidade: n.penalidade,
    custo: n.custo,
    espacos: n.espacos,
    ocupaMao: true,
    descricao: "",
    criado: "escudo",
    custom: true,
  };
}

/** A liberação que faz cada tipo criado valer. Ver `LIBERACOES`. */
export const LIBERACAO_DO_CRIADO = {
  revestimento: "revestimentosCriados",
  escudo: "escudosCriados",
  // A fase 3 (`afty-criacao-equipamentos-itens.js`) segue a mesma porta.
  itemCusto: "itensDeCusto",
};
