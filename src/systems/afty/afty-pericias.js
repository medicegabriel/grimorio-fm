/**
 * ============================================================
 * PERÍCIAS E TESTES — GRIMÓRIO AFTY
 * ============================================================
 * Conteúdo é DADO (ver roadmap). Transcrição VERBATIM da seção "LISTA DE
 * PERÍCIAS" (tabela Perícia / Atributo Chave / Requer Treinamento? /
 * Complementar) e das descrições individuais, mandadas pelo autor em
 * 2026-07-27.
 *
 * Colunas do livro → campos:
 *   • atributo: chave do Atributo Chave (Força→forca, Presença→presenca, etc.).
 *   • requerTreinamento: a perícia só pode ser usada se a criatura for treinada
 *     nela (coluna "Requer Treinamento?" = Sim).
 *   • complementar: perícia que NÃO entra por padrão no jogo, opcional por
 *     campanha (coluna "Complementar" = Sim). Também é possível remover perícias
 *     padrão (ex.: Tecnologia numa campanha de época), a critério do Mestre.
 *   • descricao / exemplos / nota: os três parágrafos de cada verbete.
 *
 * Ordem = a da tabela do livro (alfabética). Ids estáveis, snake_case sem acento.
 *
 * ⚠ VERBATIM, com os deslizes do livro preservados: "quebrar amarras o
 * segurando" (Atletismo) e "mudar os fatos enquanto contra o que aconteceu"
 * (Enganação). O travessão em Tecnologia também é do original.
 *
 * ============================================================
 * OS TRÊS TIPOS DE TESTE (autor, 2026-07-27)
 * ============================================================
 * Perícias, Jogadas de Ataque e Testes de Resistência compartilham a MESMA
 * forma: `d20 + mod do atributo + metade do nível + bônus de treinamento
 * (se treinado) + outros bônus`. O que este arquivo devolve é a parte fixa
 * (tudo menos o d20). Ver `resolveTestes`.
 *
 * Os Testes de Resistência (os 5 nomeados) moram em AFTY_RESISTENCIAS, em
 * ./afty-schema.js, porque outros sistemas já os liam de lá.
 * ============================================================
 */

// As duas listas cruas vêm de um módulo FOLHA para não fechar ciclo com
// afty-origens.js, que as lê durante a própria inicialização. Ver o cabeçalho de lá.
import { AFTY_PERICIAS, AFTY_ATAQUES } from "./afty-pericias-catalogo";
export { AFTY_PERICIAS, AFTY_ATAQUES };
import { AFTY_ATTRS, AFTY_RESISTENCIAS } from "./afty-schema";
import {
  valorCanal, detalhesDoCanal, valorCanalEscopos, detalhesDoCanalEscopos, escoposDaArma,
  resolverEfeitosDanoFinal,
} from "./afty-efeitos";
// Quem separa a régua da criatura da do jogador nos três testes.
import { regraDo } from "./afty-sistema";
/* A escada de dados da ficha de jogador. Na criatura nada disto roda: lá o dano
   é fórmula fechada e o dado da tabela da arma não entra. */
import {
  moverNivel, maiorDadoDe, maximoDe, lerDado, ESCADAS_DESARMADO_NO_MOTOR,
} from "./afty-niveis-dano";
// O pacote de perícias e TR que a Classe inicial concede, na ficha de jogador.
/* `vagasDoPacote` e não o `totalPericiasDoJogador`: o total do jogador agora sai
   da SOMA das parcelas do hover, e o pacote é uma delas. As duas contas têm de
   dar no mesmo número, e há assert comparando. */
import { vagasDoPacote, pacoteInicialDaFicha } from "./afty-especializacoes";

/* AFTY_PERICIAS mora em ./afty-pericias-catalogo.js e é reexportado no topo. */

const BY_ID = Object.fromEntries(AFTY_PERICIAS.map((p) => [p.id, p]));
export const getPericia = (id) => BY_ID[id] || null;

/* ============================================================ */
/* CATÁLOGO DA FICHA                                             */
/* ============================================================ */
/*
 * O catálogo do livro continua imutável em afty-pericias-catalogo.js. A ficha
 * pode acrescentar perícias de homebrew e escolher a ORDEM, porque duas mesas
 * organizam o mesmo catálogo de formas diferentes.
 *
 * ⚠ AS PERÍCIAS DO LIVRO ESTÃO TODAS NA FICHA, SEMPRE (autor, 2026-08-30).
 * `periciasOrdem` diz só a ORDEM, e não quem entra: a lista salva de uma ficha
 * antiga recebe de volta as que faltam, cada uma na posição que ocupa no
 * catálogo. Antes entravam só as padrão e as três complementares ficavam num
 * painel de sugestões, que saiu junto com esta regra.
 *
 * ⚠ E POR ISSO NÃO EXISTE MAIS REMOVER PERÍCIA DO LIVRO: sem o painel de
 * sugestões não haveria como trazê-la de volta. Só as personalizadas saem, e o
 * botão Nova perícia as refaz.
 */

const ATTR_KEYS = new Set(AFTY_ATTRS.map((a) => a.key));
const CUSTOM_PREFIX = "custom_";

const textoSeguro = (valor, max = 80) => String(valor ?? "").trim().slice(0, max);

export function normalizarPericiasPersonalizadas(creature) {
  const lista = Array.isArray(creature?.periciasPersonalizadas) ? creature.periciasPersonalizadas : [];
  const ids = new Set(AFTY_PERICIAS.map((p) => p.id));
  const out = [];
  for (const item of lista) {
    const id = textoSeguro(item?.id, 100);
    const nome = textoSeguro(item?.nome) || "Nova perícia";
    const atributo = ATTR_KEYS.has(item?.atributo) ? item.atributo : "inteligencia";
    if (!id.startsWith(CUSTOM_PREFIX) || ids.has(id)) continue;
    ids.add(id);
    out.push({ id, nome, atributo, personalizada: true });
  }
  return out;
}

export function novaPericiaPersonalizada() {
  const token = globalThis.crypto?.randomUUID?.().replaceAll("-", "_")
    ?? `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  return { id: `${CUSTOM_PREFIX}${token}`, nome: "Nova perícia", atributo: "inteligencia" };
}

export function idsPericiasAtivas(creature) {
  const personalizadas = normalizarPericiasPersonalizadas(creature);
  const disponiveis = new Set([
    ...AFTY_PERICIAS.map((p) => p.id),
    ...personalizadas.map((p) => p.id),
  ]);
  const ordemBruta = Array.isArray(creature?.periciasOrdem) ? creature.periciasOrdem : [];
  const vistos = new Set();
  const ordem = [];
  for (const id of ordemBruta) {
    if (!disponiveis.has(id) || vistos.has(id)) continue;
    vistos.add(id);
    ordem.push(id);
  }
  /* Toda perícia do livro que a ordem salva não citar entra aqui, LOGO DEPOIS
     da vizinha de catálogo mais próxima que já está na lista. Empilhá-las no
     fim jogaria Direção, Sobrevivência e Teologia para baixo de tudo em toda
     ficha feita antes de 2026-08-30, que é quando elas passaram a entrar. */
  for (let i = 0; i < AFTY_PERICIAS.length; i++) {
    const id = AFTY_PERICIAS[i].id;
    if (vistos.has(id)) continue;
    vistos.add(id);
    let pos = 0;
    for (let j = i - 1; j >= 0; j--) {
      const anterior = ordem.indexOf(AFTY_PERICIAS[j].id);
      if (anterior >= 0) { pos = anterior + 1; break; }
    }
    ordem.splice(pos, 0, id);
  }
  // Uma perícia personalizada de uma ficha importada não pode desaparecer só
  // porque uma versão antiga ainda não gravava a ordem explicitamente.
  for (const p of personalizadas) {
    if (!vistos.has(p.id)) ordem.push(p.id);
  }
  return ordem;
}

/* ============================================================ */
/* OFÍCIO REPETIDO                                               */
/* ============================================================ */
/*
 * ⚠ CONTAGEM ÍMPAR GANHA UM OFÍCIO A MAIS (autor, 2026-08-30). A tela mostra
 * as perícias em duas colunas, e um número ímpar deixa uma delas mais curta.
 * O desempate é um Ofício, e não uma linha vazia, porque Ofício é a única
 * perícia que o personagem pode ter mais de uma vez: são vinte no livro (par),
 * então o extra só aparece quando a ficha cria uma perícia personalizada.
 *
 * ⚠ E ELE É UM OFÍCIO DE VERDADE (autor, 2026-08-30): tem proficiência
 * própria e Ofícios escolhidos próprios, então dá para ser Treinado num e
 * Mestre em outro. Por isso ele NÃO some quando a contagem volta a ser par: uma
 * linha treinada que evapora levaria a vaga gasta junto, calada.
 */

const OFICIO_ID = "oficio";
const OFICIO_EXTRA = /^oficio__(\d+)$/;

/** Este id é um Ofício (o do livro ou um dos repetidos)? */
export const ehPericiaOficio = (id) => id === OFICIO_ID || OFICIO_EXTRA.test(String(id ?? ""));

/**
 * Os Ofícios escolhidos numa linha de Ofício.
 *
 * `periciaOficios` é um objeto id para lista de nomes. O formato ANTIGO era uma
 * lista solta, que valia para o Ofício do livro, e antes dele um `periciaOficio`
 * de nome único. Os três são lidos aqui para nenhuma ficha salva perder o que
 * escolheu, e a normalização do schema converte na abertura.
 */
export function oficiosDaFicha(creature, id = OFICIO_ID) {
  const bruto = creature?.periciaOficios;
  let lista = [];
  if (Array.isArray(bruto)) lista = id === OFICIO_ID ? bruto : [];
  else if (bruto && typeof bruto === "object") lista = bruto[id] ?? [];
  else if (id === OFICIO_ID && creature?.periciaOficio) lista = [creature.periciaOficio];
  return [...new Set((Array.isArray(lista) ? lista : []).map((n) => textoSeguro(n)).filter(Boolean))];
}

/** O Ofício repetido guarda alguma coisa? É o que o mantém na ficha. */
const oficioExtraOcupado = (creature, id) => {
  const prof = creature?.pericias?.[id];
  return prof === "treinado" || prof === "mestre" || oficiosDaFicha(creature, id).length > 0;
};

export function catalogoPericiasDaFicha(creature) {
  const personalizadas = normalizarPericiasPersonalizadas(creature);
  const porId = new Map([
    ...AFTY_PERICIAS.map((p) => [p.id, p]),
    ...personalizadas.map((p) => [p.id, p]),
  ]);
  const lista = idsPericiasAtivas(creature).map((id) => porId.get(id)).filter(Boolean);

  const base = porId.get(OFICIO_ID);
  if (!base) return lista;
  const oficioExtra = (n) => ({ ...base, id: `oficio__${n}`, oficioExtra: true });
  /* ⚠ A CLASSE PODE EXIGIR MAIS DE UMA LINHA DE OFÍCIO (2026-08-31). O
     Combatente e o Conjurador treinam DOIS Ofícios, e a linha repetida só
     nascia depois de alguém escrever algo nela: a segunda concessão da Classe
     não teria onde pousar, e a ficha mostraria uma perícia concedida a menos
     sem dizer nada. O mínimo vem do próprio pacote, que é onde o número mora. */
  const minimo = pacoteInicialDaFicha(creature?.especializacoes)?.periciasOficios ?? 0;
  // Os que já carregam escolha ficam, par ou ímpar.
  const extras = [];
  for (let n = 2; n <= minimo || oficioExtraOcupado(creature, `oficio__${n}`); n++) extras.push(oficioExtra(n));
  // E o desempate, que é sempre no máximo um: acrescentar uma linha já vira a
  // contagem para par.
  if ((lista.length + extras.length) % 2 === 1) extras.push(oficioExtra(extras.length + 2));
  if (extras.length === 0) return lista;
  /* ⚠ O EXTRA ENTRA LOGO ABAIXO DO OFÍCIO DO LIVRO (autor, 2026-08-30), e não no
     fim da lista: os dois são a mesma perícia, e separá-los faria o segundo
     parecer outra coisa. Se o Ofício do livro tiver sido arrastado, os extras
     vão junto com ele. */
  const at = lista.findIndex((x) => x.id === OFICIO_ID);
  const corte = at >= 0 ? at + 1 : lista.length;
  return [...lista.slice(0, corte), ...extras, ...lista.slice(corte)];
}

/* ============================================================ */
/* PROFICIÊNCIA                                                  */
/* ============================================================ */
/* Duas faixas: Treinado soma o Bônus de Treinamento (== Maestria) cheio,
   Mestre soma ele mais metade. Mora aqui porque vale para os três tipos de
   teste e para as Invocações, que re-exportam daqui. */

export const PROFICIENCIAS = [
  { value: "treinado", label: "Treinado" },
  { value: "mestre",   label: "Mestre" },
];

export const bonusProficiencia = (bt, prof) =>
  prof === "mestre" ? bt + Math.floor(bt / 2) : (prof === "treinado" ? bt : 0);

/** Custo em vagas: Mestre vale 2, Treinado vale 1, destreinado 0. */
export const custoProficiencia = (prof) => (prof === "mestre" ? 2 : prof === "treinado" ? 1 : 0);

/** Vagas gastas por um mapa { [id]: "treinado" | "mestre" }. */
export const usoPericias = (periciasProf = {}) =>
  Object.values(periciasProf || {}).reduce((s, p) => s + custoProficiencia(p), 0);

/* `periciasPadrao` saiu em 2026-08-30: as complementares deixaram de ficar de
   fora da ficha, então "as que entram por default" virou o catálogo inteiro. */
/** Perícias complementares (opcionais por campanha). */
export const periciasComplementares = () => AFTY_PERICIAS.filter((p) => p.complementar);

/**
 * Perícias que uma INVOCAÇÃO pode ser treinada: as comuns (padrão), exceto
 * Ofício (o livro proíbe treinar Invocação em Ofício). Complementares ficam de
 * fora por serem opcionais de campanha.
 */
export const periciasParaInvocacao = () =>
  AFTY_PERICIAS.filter((p) => !p.complementar && p.id !== "oficio");

/* ============================================================ */
/* OS TRÊS TIPOS DE TESTE                                        */
/* ============================================================ */

/* AFTY_ATAQUES mora em ./afty-pericias-catalogo.js e é reexportado no topo. */

/* ============================================================ */
/* MANOBRAS                                                      */
/* ============================================================ */
/* "Manobras são as ações: Agarrar, Derrubar, Desarmar e Empurrar. Todas
   envolvendo Testes de Atletismo e Acrobacia." (autor, 2026-07-28)

   Texto verbatim de cada uma, na Lista de Ações Comuns:

   • AGARRAR  — "teste de Atletismo contra um teste de Atletismo ou Acrobacia
     do alvo [...] a criatura alvo recebe a condição Agarrado, podendo repetir
     o teste no começo do turno dela para escapar."
   • DERRUBAR — "teste de Atletismo contra o Atletismo ou Acrobacia do alvo
     [...] o alvo é derrubado, recebendo a condição Caído."
   • DESARMAR — "rolagem de Atletismo ou Acrobacia, forçando o alvo a realizar
     também uma rolagem com a mesma perícia."
   • EMPURRAR — "teste de Atletismo contra um teste de Atletismo ou Acrobacia
     do alvo [...] empurra a criatura em uma distância de 1,5 metros,
     aumentando em +1,5m para cada 5 pontos que seu resultado seja maior do
     que o do alvo."

   Quem EXECUTA usa Atletismo, menos o Desarmar, que deixa escolher. Quem
   RESISTE sempre escolhe entre as duas. Onde há escolha, vale o MAIOR: é a
   mesma leitura que o autor deu para "Int ou Sabedoria" e para o traço Fineza. */

export const EMPURRAO_BASE = 1.5;

export const AFTY_MANOBRAS = [
  { id: "agarrar",  nome: "Agarrar",  pericia: "atletismo" },
  { id: "derrubar", nome: "Derrubar", pericia: "atletismo" },
  { id: "desarmar", nome: "Desarmar", pericia: "melhor",
    nota: "o alvo resiste com a MESMA perícia que você escolher" },
  { id: "empurrar", nome: "Empurrar", pericia: "atletismo", empurrao: true },
];

/* ============================================================ */
/* DANO DO ATAQUE BÁSICO                                         */
/* ============================================================ */
/* Fórmulas da planilha do autor (2026-07-27). A lógica é ao contrário do
   habitual: primeiro se calcula o DANO TOTAL alvo, depois a quantidade de dados
   e o tipo de dado, e o DANO FIXO é o resto que falta para a média da rolagem
   bater no total. Por isso "4d10+7" e não "dado + modificador".

   Células da planilha, já resolvidas com o autor:
     A55 → atributo-chave do ataque (escolha da ficha). I55 é o modificador dele
     A57 → o dado, que sai do PATAMAR (Comum d8, Desafio d10, os dois de cima d12)
     A59 → grau da arma, que dá o dano adicional
   "Lacaio" e "Grau Zero" saíram do sistema, e "Maldição" é o Beyond. */

/** Média de cada dado, usada para converter o total em dano fixo. */
export const MEDIA_DADO = { d6: 3.5, d8: 4.5, d10: 5.5, d12: 6.5 };

/** O dado do ataque sai do Patamar. */
export const DADO_POR_PATAMAR = { comum: "d8", desafio: "d10", calamidade: "d12", beyond: "d12" };

/**
 * Coeficientes do Dano Total por Patamar: `nd × ND + escala × (mod + Aptidão CL)`.
 * O modificador e o Nível de Aptidão em Controle e Leitura andam sempre juntos.
 */
export const COEF_DANO_PATAMAR = {
  comum:      { nd: 2, escala: 1 },
  desafio:    { nd: 3, escala: 2 },
  calamidade: { nd: 4, escala: 2 },
  beyond:     { nd: 4, escala: 3 },
};

/**
 * Dano adicional pelo Grau da Ferramenta Amaldiçoada da arma.
 *
 * "Desarmado" é o caso sem Ferramenta nenhuma, e soma ZERO (autor,
 * 2026-07-27): arma comum, sem Ferramenta, não ganha nada aqui.
 * O Grau Especial é 20, não 40, depois que o Grau Zero saiu do sistema.
 */
/* O rank de cada grau de Ferramenta, e o rótulo dele. Repetidos aqui em vez de
   importados de afty-equipamentos.js porque este arquivo é lido pelo resolvedor
   de dano e aquele importa deste: a seta aponta para cá. O assert compara as
   duas listas, então uma divergir falha. */
export const RANK_DO_GRAU = { quarto: 1, terceiro: 2, segundo: 3, primeiro: 4, especial: 5 };
const GRAU_LABEL = { 1: "Quarto Grau", 2: "Terceiro Grau", 3: "Segundo Grau", 4: "Primeiro Grau", 5: "Grau Especial" };

/** Os tamanhos de dado que uma regra pode nomear ("1d6 de dano", "2d10"). */
export const FACES_NOMEADAS = [12, 10, 8, 6, 4, 3];

export const DANO_ADICIONAL_ARMA = [
  { value: "desarmado", label: "Desarmado",     valor: 0 },
  { value: "quarto",    label: "Quarto Grau",   valor: 4 },
  { value: "terceiro",  label: "Terceiro Grau", valor: 8 },
  { value: "segundo",   label: "Segundo Grau",  valor: 12 },
  { value: "primeiro",  label: "Primeiro Grau", valor: 16 },
  { value: "especial",  label: "Grau Especial", valor: 20 },
];
const ARMA_BY_VALUE = Object.fromEntries(DANO_ADICIONAL_ARMA.map((a) => [a.value, a]));

/** Texto de exibição do dano: "4d10+7", "4d10-2" ou "4d10" quando o fixo é zero. */
export const textoDeDano = (dados, dado, fixo) =>
  `${dados}${dado}${fixo > 0 ? `+${fixo}` : fixo < 0 ? `−${Math.abs(fixo)}` : ""}`;

/**
 * Uma linha de dano. Todas as fontes usam ESTA conta: o dano listado na tabela
 * da arma e o "1d8" do Corpo Treinado não entram (autor, 2026-07-27). Da arma
 * vêm só o Alcance, as Propriedades e o grau da Ferramenta Amaldiçoada.
 *
 * `niveisDano` soma no ND, e SÓ para dano: "um ND 17 com 3 Níveis de Dano,
 * para unicamente DANO, seria considerado um ND 20" (autor, 2026-07-27).
 *
 * ⚠ A quantidade de dados é `modificador + 1`, então um atributo-chave com
 * modificador negativo zeraria a rolagem. Fica no piso de 1 dado (assumido, a
 * planilha não trata o caso).
 *
 * ⚠ DADO DE DANO ADICIONAL entra DEPOIS do dano fixo, e não antes. É a única
 * ordem em que ele aumenta o dano: o fixo é justamente o resto que falta para a
 * média bater no total, então um dado a mais dentro da conta só trocaria dano
 * fixo por variância, com a média intacta. Somando por fora, cada dado extra
 * acrescenta a média dele. Por isso "1 dado de dano adicional" (Lutador
 * Superior) e "Nível de Dano" (Corpo Treinado) são coisas DIFERENTES.
 */
function linhaDeDano({
  nd, patamar, modChave, atributo, cl, grauArma, niveisDano, bonus,
  dadosExtras = 0, margemBase = 20, reducaoMargem = 0, ignoraRD = 0,
  removeResistencia = false, fontes = [],
}) {
  const coef = COEF_DANO_PATAMAR[patamar];
  const arma = ARMA_BY_VALUE[grauArma] ?? ARMA_BY_VALUE.desarmado;
  const ndDano = nd + niveisDano;

  const total = coef.nd * ndDano + coef.escala * modChave + coef.escala * cl + arma.valor + bonus;
  const dado = DADO_POR_PATAMAR[patamar] ?? "d8";
  const dadosBase = Math.max(1, modChave + 1);
  const fixo = Math.ceil(total - dadosBase * MEDIA_DADO[dado]);
  const dados = dadosBase + Math.max(0, dadosExtras);

  const rotuloAttr = (k) => AFTY_ATTRS.find((a) => a.key === k)?.label ?? k;
  return {
    atributo, dado, dados, dadosBase, dadosExtras, fixo, total, niveisDano,
    grauArma: arma.value,
    // Margem de crítico: o piso é 2 (crítico só em 20 natural seria margem 20,
    // e reduzir sem limite chegaria a acertar crítico em qualquer rolagem).
    margemCritico: Math.max(2, margemBase - reducaoMargem),
    ignoraRD, removeResistencia,
    texto: textoDeDano(dados, dado, fixo),
    partes: [
      { label: niveisDano ? `Nível ${nd} + ${niveisDano} × ${coef.nd}` : `Nível × ${coef.nd}`,
        valor: coef.nd * ndDano },
      { label: `${rotuloAttr(atributo)} × ${coef.escala}`, valor: coef.escala * modChave },
      ...(cl ? [{ label: `Controle e Leitura × ${coef.escala}`, valor: coef.escala * cl }] : []),
      ...(arma.valor ? [{ label: arma.label, valor: arma.valor }] : []),
      ...fontes,
    ],
  };
}

/**
 * Texto de uma linha, montado a partir dos grupos de dados mais o fixo.
 * Serve às duas fórmulas: na criatura `dadosGrupos` tem um grupo só.
 */
const textoDaLinha = (grupos, fixo) => {
  const partes = grupos.filter((g) => g.qtd > 0).map((g) => `${g.qtd}d${g.faces}`);
  const corpo = partes.join(" + ");
  if (!corpo) return String(fixo);
  if (fixo > 0) return `${corpo} + ${fixo}`;
  if (fixo < 0) return `${corpo} − ${Math.abs(fixo)}`;
  return corpo;
};

/**
 * Uma linha de dano da FICHA DE JOGADOR (autor, 2026-08-31): *"Eles seguem o
 * DANO DA ARMA, assim como está em equipamentos + Modificador de Atributo fixo
 * no final."*
 *
 * Nada da fórmula da criatura sobrevive aqui. Some o `coefND × ND`, some o
 * `escala × mod`, some a Aptidão Controle e Leitura (autor: "sai do jogador"), e
 * some o dano adicional por Grau da Ferramenta (autor: *"Grau da Arma não
 * fornece +Acerto ou +Dano para Jogador. Só fornece os Bônus de Encantamentos
 * como Potente"*). O que sobra é o dado impresso, movido pelos Níveis de Dano,
 * mais o modificador e os bônus fixos.
 *
 * ⚠ O MODIFICADOR ENTRA UMA VEZ SÓ, e não uma por dado. Uma Espada Colossal
 * (2d8) com Força +4 é `2d8 + 4`, e não `2d8 + 8`.
 *
 * ⚠ OS BÔNUS FIXOS SOMAM COM O MODIFICADOR (autor), então o canal `danoBonus` e
 * os 45 emissores dele continuam valendo, no mesmo lugar da conta.
 *
 * ⚠ O DADO EXTRA USA O MAIOR DADO DO NÍVEL, verbatim do livro: "ao receber +1
 * dado com uma arma que causa 1d12 + 1d6, você receberia 1d12 de dano
 * adicional". Por isso ele entra no grupo do maior dado, e não num grupo novo.
 */
function linhaDeDanoJogador({
  dadoBase, niveis, modChave, atributo, bonus, fonteDado, grauRank = 0,
  dadosExtras = 0, margemBase = 20, reducaoMargem = 0, ignoraRD = 0,
  removeResistencia = false, fontes = [],
}) {
  const movido = moverNivel(dadoBase, niveis) ?? moverNivel("1d3", 0);
  const maiorDado = maiorDadoDe(movido) || 3;
  const extras = Math.max(0, Math.trunc(dadosExtras));
  // O extra cai no grupo do maior dado. Se por algum motivo não houver grupo
  // nenhum (o degrau "1", que é dano fixo), ele abre um.
  const grupos = movido.dados.map((d) => ({ ...d }));
  const alvoExtra = grupos.find((g) => g.faces === maiorDado);
  if (extras) {
    if (alvoExtra) alvoExtra.qtd += extras;
    else grupos.push({ qtd: extras, faces: maiorDado });
  }
  /* O `fixo` do degrau só existe no pé da escada ("1 de dano"), e soma junto.

     ⚠ O GRAU DA FERRAMENTA SOMA AQUI, e é escada própria (autor, 2026-09-01):
     *"Arma de Jogador recebe +1 de Dano Fixo por Grau. Grau Especial = +5 Dano
     Fixo. Quarto Grau = +1 Dano Fixo."* É o RANK, e não a tabela da criatura
     (4, 8, 12, 16, 20). Ver a divergência `danoFixoPorGrau`. */
  const grau = Math.max(0, Math.trunc(grauRank));
  const fixo = modChave + bonus + grau + (movido.fixo ?? 0);
  const dadosTotais = grupos.reduce((s, g) => s + g.qtd, 0);
  const rotuloAttr = (k) => AFTY_ATTRS.find((a) => a.key === k)?.label ?? k;
  return {
    atributo,
    // `dado` e `dados` seguem existindo para quem já os lia (o chip de delta da
    // aba Buffs, e o `dados_dano_final` do Motor). Valem o MAIOR dado do nível e
    // a contagem total, que é o que aquelas duas leituras querem dizer.
    dado: `d${maiorDado}`,
    dados: dadosTotais,
    dadosBase: dadosTotais - extras,
    dadosExtras: extras,
    dadosGrupos: grupos,
    fixo,
    /* O `total` do jogador é a MÉDIA esperada, e não um alvo: aqui não existe
       número-alvo, o dado é a regra. Quem o lê é o chip de delta da aba Buffs,
       que compara duas versões da mesma linha. Piso para baixo, regra da casa. */
    total: Math.floor(grupos.reduce((s, g) => s + g.qtd * (g.faces + 1) / 2, 0) + fixo),
    niveisDano: niveis,
    grauArma: "desarmado",
    maximo: maximoDe({ dados: grupos, fixo }),
    margemCritico: Math.max(2, margemBase - reducaoMargem),
    ignoraRD, removeResistencia,
    texto: textoDaLinha(grupos, fixo),
    /* ⚠ O RODAPÉ DO HOVER É A EXPRESSÃO, e não o `total`. O painel de fontes
       fecha com uma linha "Total", e na criatura o número ali é a conta que as
       parcelas somam. No jogador as parcelas são `1d8` e `+4`, e um "Total 8"
       embaixo delas leria como se a soma desse 8. Quem soma parcela de dado é o
       dado, então o rodapé mostra a rolagem. */
    totalFontes: textoDaLinha(grupos, fixo),
    /* ⚠ A PRIMEIRA LINHA É O DADO IMPRESSO, e não o resultado. As duas mostravam
       o resultado, e aí o hover dizia "Dano da Arma 1d12 + 1d4" numa espada de
       1d8: o número certo com a fonte errada, que é o bug do `defesaAtributo`.
       O degrau só aparece quando existe, e é ele que carrega o resultado. */
    partes: [
      { label: fonteDado ?? "Dano da Arma", texto: textoDaLinha(lerDado(dadoBase)?.dados ?? [], 0) },
      ...(niveis
        ? [{ label: `Níveis de Dano (${niveis > 0 ? "+" : ""}${niveis})`, texto: movido.texto }]
        : []),
      { label: rotuloAttr(atributo), valor: modChave },
      ...(grau ? [{ label: `${GRAU_LABEL[grau] ?? "Grau"} da Ferramenta`, valor: grau }] : []),
      ...fontes,
    ],
  };
}

/**
 * Resolve UMA linha de dano por fonte (autor, 2026-07-27): o Ataque Básico
 * (que engloba Desarmado, Faixas, Manoplas e o Corpo Treinado) e mais uma para
 * cada arma equipada.
 *
 * ⚠ Nem o GRAU nem o ATRIBUTO são escolha da ficha (autor, 2026-07-27). O grau
 * é o da Ferramenta Amaldiçoada DAQUELA arma, e o Ataque Básico só sobe de grau
 * com Manoplas ou Faixas equipadas. O atributo vem da arma: Força no corpo a
 * corpo, Destreza a distância, e com o traço Fineza vale o maior dos dois.
 *
 * ctx = { nd, patamar, mods, aptidaoCL, efeitos, efeitosLinhaDano,
 *         contextoDsl, armas, grauBasico, acertoGrauBasico, fontesAcertoBasico,
 *         escoposBasicoExtra, finezaBasico, ataques }.
 * `armas` = [{ id, nome, grauArma, acertoGrau, alcance, propriedades, fineza,
 * distancia }], montado pelo deriveAfty a partir dos equipamentos.
 *
 * Os cinco campos do golpe básico descrevem o item de pugilato equipado que o
 * define (ver o deriveAfty): o grau dele, o Acerto dele, as fontes de Acerto que não
 * são o grau, o id para os efeitos de item alcançarem a linha, e a Fineza.
 *
 * `nivelDano` e `danoBonus` aceitam alvo: sem alvo valem para todas as fontes,
 * com alvo (`basico` ou o id da arma) valem só naquela linha.
 *
 * ⚠ O ACERTO fecha AQUI, e não na aba de Testes (autor, 2026-08-01). O grau da
 * Ferramenta dá +1 de Acerto por degrau, e esse bônus é DAQUELA arma: somá-lo no
 * Ataque da categoria faria duas armas de graus diferentes disputarem o mesmo
 * número. Então a linha mostra o ataque da categoria (Corpo a Corpo ou A
 * Distância, já resolvido em resolveTestes) mais o grau da própria arma.
 */
export function resolveDano(creature, ctx = {}) {
  const nd = Math.max(1, Math.trunc(Number(ctx.nd) || 1));
  const patamar = COEF_DANO_PATAMAR[ctx.patamar] ? ctx.patamar : "comum";
  const mods = ctx.mods || {};
  const ef = ctx.efeitos || null;
  const cl = Math.max(0, Math.trunc(Number(ctx.aptidaoCL) || 0));
  const modDe = (k) => Math.trunc(Number(mods[k]) || 0);
  const rotuloAttr = (k) => AFTY_ATTRS.find((a) => a.key === k)?.label ?? k;
  const tecnicas = ctx.tecnicasCombate ?? {};
  const armasTecnicas = new Set(Array.isArray(tecnicas.armas) ? tecnicas.armas : []);
  const atributoTecnicas = tecnicas.atributo === "sabedoria" ? "sabedoria" : "inteligencia";
  const btTecnicas = Math.max(0, Math.trunc(Number(tecnicas.bt) || 0));
  /* Na ficha de jogador a proficiência de ataque vem da ARMA, e não da marca
     por tipo. Ver `proficienciaPorArma` em afty-sistema.js. */
  const armaDecide = regraDo(ctx.sistema, "proficienciaPorArma") === "player";
  /* ⚠ NA FICHA DE JOGADOR O DANO É O DA ARMA, e não a fórmula da criatura
     (autor, 2026-08-31). Ver `danoPorArma` em afty-sistema.js e a escada em
     afty-niveis-dano.js. */
  const danoPorArma = regraDo(ctx.sistema, "danoPorArma") === "player";

  // `alvo` aqui é sempre a LISTA de escopos da fonte (ver escoposDaArma): uma
  // arma responde pelo id, por "arma", pela categoria, pelo grupo e por cada
  // propriedade. O Ataque Básico responde só por "basico".
  const canal = (c, escopos) => (ef ? valorCanalEscopos(ef, c, escopos) : 0);
  /* Canal com alvo próprio dentro do resolvedor de dano. O `canal` acima é
     escopado por FONTE de dano; estes dois miram um alvo nomeado, que hoje é o
     tamanho do dado (`d6`) do canal `dadosNomeados`. */
  const bonusDeEfeitoDano = (c, alvo) => (ef ? valorCanal(ef, c, alvo) : 0);
  const fontesDeDano = (c, alvo) =>
    (ef ? detalhesDoCanal(ef, c, alvo) : []).map((d) => ({ label: d.nome, valor: d.valor }));
  // `true` no fim pede os SUPLANTADOS junto: são os perdedores do pool
  // exclusivo, que o hover mostra riscados. Só o hover os quer, e é por isso que
  // o `canal` logo acima segue sem eles: quem soma não pode contá-los.
  const fontesDe = (c, escopos) =>
    (ef ? detalhesDoCanalEscopos(ef, c, escopos, true) : []).map((dd) => ({
      label: dd.nome, valor: dd.valor, ...(dd.suplantado ? { suplantado: true } : {}),
    }));

  // Força por padrão, Destreza a distância, e o maior dos dois quando a arma
  // tem Fineza (ou quando uma habilidade concede a mesma permissão, como o
  // Corpo Treinado: "você pode escolher usar tanto Força quanto Destreza").
  const atributoDe = ({ distancia, fineza }) => {
    if (distancia) return "destreza";
    return fineza && modDe("destreza") > modDe("forca") ? "destreza" : "forca";
  };

  const alcanceDe = (alcance, bonusCorpo = 0) => {
    const mult = Math.max(1, Number(ctx.alcanceMult) || 1);
    if (alcance) {
      const curto = alcance.curto * mult;
      const longo = alcance.longo * mult;
      return { curto, longo, texto: `${curto}m / ${longo}m` };
    }
    const metros = (Math.max(0, Number(ctx.alcanceCorpo) || 0) + Math.max(0, Number(bonusCorpo) || 0)) * mult;
    return metros ? { curto: metros, longo: metros, texto: `${String(metros).replace(".", ",")}m` } : null;
  };

  const facesDaPropriedade = (propriedades, id) => {
    const valor = propriedades.find((p) => p.id === id)?.valor;
    const faces = Math.trunc(Number(String(valor ?? "").replace(/^d/i, "")));
    return faces > 1 ? faces : 0;
  };

  const aplicaCriticoDaArma = (linha, propriedades, extras = 0) => {
    const base = linha.gruposDano?.[0];
    if (!base) return linha;
    const fatal = facesDaPropriedade(propriedades, "fatal");
    const mortal = facesDaPropriedade(propriedades, "mortal");
    if (fatal > base.faces) base.facesCritico = fatal;
    else if (fatal) linha.gruposDano.push({
      nome: "Fatal", dados: 1, faces: fatal, fixo: 0,
      momento: "durante", multiplica: false, apenasCritico: true, entraRaioNegro: true,
    });
    if (mortal) linha.gruposDano.push({
      nome: "Mortal", dados: 1, faces: mortal, fixo: 0,
      momento: "durante", multiplica: false, apenasCritico: true, entraRaioNegro: true,
    });
    if (extras > 0) linha.gruposDano.push({
      nome: "Destruidora", dados: extras, faces: base.faces, fixo: 0,
      momento: "durante", multiplica: false, apenasCritico: true, entraRaioNegro: true,
    });
    return linha;
  };

  const monta = (escopos, atributo, grauArma, margemBase, dadoBase = null, fonteDado = null) => {
    const dadosExtras = Math.max(0, Math.trunc(canal("dadosDano", escopos)));
    const detalhesDados = ef ? detalhesDoCanalEscopos(ef, "dadosDano", escopos) : [];
    const dadosAtroz = detalhesDados
      .filter((d) => d.origem === "cmb_golpe_especial")
      .reduce((s, d) => s + Math.max(0, Math.trunc(Number(d.valor) || 0)), 0);
    /* ⚠ NO JOGADOR O NÍVEL DE DANO PODE SER NEGATIVO, e na criatura não. Lá ele
       soma no ND e um valor negativo tiraria dano de uma fórmula que não o
       prevê. Aqui ele é degrau de escada, e o livro descreve explicitamente a
       descida ("habilidades, normalmente de inimigos, que podem diminuir o nível
       de dano de uma arma"), com piso em 1 de dano. */
    const niveisCrus = Math.trunc(canal("nivelDano", escopos));
    /* ⚠ AS ESCADAS DO DESARMADO SÃO DESCONTADAS AQUI. Na criatura elas viram
       degrau de ND porque não há dado base nenhum; no jogador o dado base sai do
       texto da própria habilidade, então contá-las de novo somaria o mesmo ganho
       duas vezes. Ver ESCADAS_DESARMADO_NO_MOTOR em afty-niveis-dano.js. */
    const descontoEscada = !danoPorArma ? 0 : (ef ? detalhesDoCanalEscopos(ef, "nivelDano", escopos) : [])
      .filter((d) => ESCADAS_DESARMADO_NO_MOTOR
        .some((x) => x.origem === d.origem && x.nome === d.nome))
      .reduce((s, d) => s + Math.trunc(Number(d.valor) || 0), 0);
    const linha = danoPorArma ? linhaDeDanoJogador({
      dadoBase: dadoBase ?? "1d3",
      fonteDado,
      grauRank: RANK_DO_GRAU[grauArma] ?? 0,
      atributo, modChave: modDe(atributo),
      niveis: niveisCrus - descontoEscada,
      bonus: canal("danoBonus", escopos),
      dadosExtras,
      margemBase,
      reducaoMargem: Math.trunc(canal("margemCritico", escopos)),
      ignoraRD: Math.max(0, Math.trunc(canal("ignoraRD", escopos))),
      removeResistencia: canal("removeResistencia", escopos) > 0,
      fontes: fontesDe("danoBonus", escopos),
    }) : linhaDeDano({
      nd, patamar, atributo, modChave: modDe(atributo), cl, grauArma,
      niveisDano: Math.max(0, niveisCrus),
      bonus: canal("danoBonus", escopos),
      dadosExtras,
      margemBase,
      reducaoMargem: Math.trunc(canal("margemCritico", escopos)),
      ignoraRD: Math.max(0, Math.trunc(canal("ignoraRD", escopos))),
      removeResistencia: canal("removeResistencia", escopos) > 0,
      fontes: fontesDe("danoBonus", escopos),
    });
    // Dado extra não é número, então entra no detalhamento como texto.
    for (const d of detalhesDados) {
      linha.partes.push({ label: d.nome, texto: `+${d.valor}${linha.dado}` });
    }

    // `dados_dano_final` só existe depois que ESTA linha física fechou. A
    // passagem tardia recebe a quantidade anterior ao próprio efeito, então
    // `dadosDano = dados_dano_final` dobra os dados uma única vez, sem recursão.
    const tardios = resolverEfeitosDanoFinal(
      ctx.efeitosLinhaDano,
      ctx.contextoDsl,
      linha.dados,
      ef?.aplicado,
    );
    const dadosTardios = Math.max(0, Math.trunc(valorCanalEscopos(tardios, "dadosDano", escopos)));
    const bonusTardio = Math.trunc(valorCanalEscopos(tardios, "danoBonus", escopos));
    linha.dados += dadosTardios;
    linha.dadosExtras += dadosTardios;
    linha.fixo += bonusTardio;
    linha.total += bonusTardio;
    if (danoPorArma) {
      /* O dado tardio também vale o MAIOR dado do nível, então ele engorda o
         grupo do maior dado em vez de abrir grupo novo. */
      const maior = Number(String(linha.dado).replace(/^d/i, ""));
      const alvo = linha.dadosGrupos.find((g) => g.faces === maior);
      if (dadosTardios) {
        if (alvo) alvo.qtd += dadosTardios;
        else linha.dadosGrupos.push({ qtd: dadosTardios, faces: maior });
      }
      linha.total += Math.floor(dadosTardios * (maior + 1) / 2);
      linha.texto = textoDaLinha(linha.dadosGrupos, linha.fixo);
      linha.totalFontes = linha.texto;
    } else {
      linha.texto = textoDeDano(linha.dados, linha.dado, linha.fixo);
    }
    for (const d of detalhesDoCanalEscopos(tardios, "dadosDano", escopos, true)) {
      linha.partes.push({
        label: d.nome,
        texto: `${d.valor >= 0 ? "+" : ""}${d.valor}${linha.dado}`,
        ...(d.suplantado ? { suplantado: true } : {}),
      });
    }
    for (const d of detalhesDoCanalEscopos(tardios, "danoBonus", escopos, true)) {
      linha.partes.push({
        label: d.nome,
        valor: d.valor,
        ...(d.suplantado ? { suplantado: true } : {}),
      });
    }
    /* DADOS COM TAMANHO PRÓPRIO (canal `dadosNomeados`): "1d6 de dano", "2d10".
       Eles entram como GRUPO, e não como média no dano fixo, porque o tamanho é
       do texto da regra e nunca muda. Um grupo por tamanho, na ordem do maior
       para o menor, e cada um nomeado pela fonte quando ela é única — é o que
       faz a linha ler "1d8 + 1d6 + 4" em vez de "1d8 + 7".

       ⚠ ELES MULTIPLICAM NO CRÍTICO. A regra do autor é "só os dados, o fixo não
       dobra", e um d6 é dado. Enquanto eles eram média no `danoBonus`, viravam
       fixo e não dobravam: trocar o canal conserta a rolagem E o crítico. */
    const gruposNomeados = FACES_NOMEADAS
      .map((faces) => ({ faces, qtd: Math.trunc(bonusDeEfeitoDano("dadosNomeados", `d${faces}`)) }))
      .filter((g) => g.qtd > 0)
      .map((g) => {
        const fontes = fontesDeDano("dadosNomeados", `d${g.faces}`);
        return {
          nome: fontes.length === 1 ? fontes[0].label : "Dano Adicional",
          dados: g.qtd, faces: g.faces, fixo: 0,
          momento: "durante", multiplica: true,
        };
      });

    /* ⚠ UM GRUPO POR TAMANHO DE DADO na ficha de jogador, porque um degrau da
       escada pode ter dois (`1d12 + 1d4`). Todos multiplicam no crítico, e o
       fixo não, que é a regra do autor: "Só os Dados, o fixo não dobra". O fixo
       viaja no primeiro grupo para não ser somado duas vezes. */
    const facesDoDado = Number(String(linha.dado).replace(/^d/i, ""));
    linha.gruposDano = danoPorArma
      ? linha.dadosGrupos
        .filter((g) => g.qtd > 0)
        .map((g, i) => ({
          nome: "Ataque",
          dados: g.faces === facesDoDado ? Math.max(0, g.qtd - dadosAtroz) : g.qtd,
          faces: g.faces,
          fixo: i === 0 ? linha.fixo : 0,
          momento: "durante", multiplica: true,
          /* ⚠ `incluidoNoTexto` NOS GRUPOS DEPOIS DO PRIMEIRO, e não é detalhe.
             A aba Ações desenha um chip para cada grupo além do primeiro
             (`gruposDano.slice(1)`), porque na criatura todo grupo extra é
             mesmo um extra: Fatal, Mortal, Destruidora, Golpe Especial. No
             jogador o segundo grupo é a segunda METADE do degrau (o `1d4` de
             `1d12 + 1d4`), que já está escrito no texto da linha. Sem esta
             marca a Ficha mostrava `1d12 + 1d4 + 4` e um chip `+1d4` ao lado,
             e o mesmo dado aparecia duas vezes. */
          ...(i > 0 ? { incluidoNoTexto: true } : {}),
        }))
        .concat(dadosAtroz ? [{
          nome: "Golpe Especial", dados: dadosAtroz, faces: facesDoDado, fixo: 0,
          momento: "durante", multiplica: false, entraRaioNegro: false, incluidoNoTexto: true,
        }] : [])
        .concat(gruposNomeados)
      : [
        {
          nome: "Ataque", dados: Math.max(0, linha.dados - dadosAtroz),
          faces: facesDoDado, fixo: linha.fixo,
          momento: "durante", multiplica: true,
        },
        ...(dadosAtroz ? [{
          nome: "Golpe Especial", dados: dadosAtroz, faces: facesDoDado, fixo: 0,
          momento: "durante", multiplica: false, entraRaioNegro: false, incluidoNoTexto: true,
        }] : []),
        ...gruposNomeados,
      ];
    /* O TEXTO da linha passa a mostrar os dados nomeados, nos dois sistemas. Sem
       isso o grupo existiria na rolagem e não apareceria na linha, que é o mesmo
       silêncio de antes por outro caminho. */
    if (gruposNomeados.length) {
      const extra = gruposNomeados.map((g) => `${g.dados}d${g.faces}`).join(" + ");
      linha.texto = `${linha.texto} + ${extra}`;
      if (linha.totalFontes) linha.totalFontes = `${linha.totalFontes} + ${extra}`;
      linha.partes = [
        ...linha.partes,
        ...gruposNomeados.map((g) => ({ label: g.nome, texto: `${g.dados}d${g.faces}` })),
      ];
      // A média entra no `total`, que é o número que o chip de delta da aba
      // Buffs compara. Piso para baixo, regra da casa.
      linha.total = Math.floor(
        linha.total + gruposNomeados.reduce((acc, g) => acc + g.dados * (g.faces + 1) / 2, 0),
      );
    }
    return linha;
  };

  // Ataque da categoria, já resolvido em resolveTestes. A linha soma o grau da
  // arma por cima disso para fechar o número que o jogador rola.
  //
  // `escopos` traz o canal `acertoArma`, que é o Acerto de UMA fonte: o
  // `bonusAcerto` mira a jogada de ataque inteira, e quem diz "com a arma
  // escolhida" (Treino de Manejo de Arma) vazaria para as outras armas da mesma
  // categoria se usasse aquele canal.
  const ataques = Array.isArray(ctx.ataques) ? ctx.ataques : [];
  /* `treinadaNaArma` só chega no jogador, e é o que devolve o Bônus de
     Treinamento à linha depois de o `resolveTestes` o ter tirado do tipo de
     ataque. `null` = decide o tipo, como sempre foi na criatura. */
  const acertoDe = (ataqueId, grauBonus, escopos, fontes = [], atributoForcado = null,
    treinadaNaArma = null) => {
    const atq = ataques.find((a) => a.id === ataqueId);
    if (!atq) return null;
    /* ⚠ NÃO SOMA EM CIMA DE UM ATAQUE QUE JÁ ESTÁ TREINADO. O Amaldiçoado é
       sempre treinado e já traz o BT dentro do `atq.bonus`: somar de novo aqui
       daria BT dobrado numa arma de técnica. */
    const btDaArma = (treinadaNaArma && !atq.treinado) ? btTecnicas : 0;
    // As fontes de encantamento saem do total do grau para aparecerem com o
    // nome delas no hover: o resto é o rank, que é a Ferramenta em si.
    const doEncantamento = fontes.reduce((s, f) => s + (f.valor ?? 0), 0);
    const doGrau = grauBonus - doEncantamento;
    const doMotor = Math.trunc(canal("acertoArma", escopos));
    const bonusAtaque = atributoForcado
      ? atq.bonus - modDe(atq.atributo) - (atq.treinado ? btTecnicas : 0)
        + modDe(atributoForcado) + btTecnicas
      : atq.bonus;
    const partesAtaque = atributoForcado
      ? [
        { label: rotuloAttr(atributoForcado), valor: modDe(atributoForcado) },
        ...atq.partes.slice(1).filter((p) => !String(p.label).startsWith("Maestria")),
        ...(btTecnicas ? [{ label: "Maestria", valor: btTecnicas }] : []),
      ]
      : atq.partes;
    return {
      acerto: bonusAtaque + grauBonus + doMotor + btDaArma,
      acertoAtaque: atq.nome,
      partesAcerto: [
        ...partesAtaque,
        ...(btDaArma ? [{ label: "Maestria (Treinado na Arma)", valor: btDaArma }] : []),
        ...(doGrau ? [{ label: "Grau da Ferramenta", valor: doGrau }] : []),
        ...fontes,
        ...fontesDe("acertoArma", escopos),
      ],
    };
  };

  // Fineza no golpe básico vem de duas portas: o canal (Corpo Treinado, "você
  // pode escolher usar tanto Força quanto Destreza") e a propriedade do item de
  // pugilato que define o golpe (Soco Inglês).
  const finezaDesarmado = valorCanal(ef, "finezaAtaque", "corpo") > 0 || !!ctx.finezaBasico;
  // ⚠ O Ataque Básico responde por "basico" MAIS o id do item de pugilato
  // equipado, quando existe um. É por esse id que o encantamento com `alvoItem`
  // (Potente, Poderosa, Penetrante) chega no golpe: sem ele o efeito era gravado
  // com o alvo do item, ninguém escutava, e o encantamento ainda descia o grau.
  const escoposBasico = [
    ...escoposDaArma(null),
    ...(Array.isArray(ctx.escoposBasicoExtra) ? ctx.escoposBasicoExtra : []),
  ];
  const entradas = [
    // Desarmado não tem margem de crítico listada em lugar nenhum: é 20.
    { id: "basico", nome: "Ataque Básico", fonte: "basico", alcance: alcanceDe(null), propriedades: [],
      /* ⚠ O DADO DO DESARMADO CHEGA PRONTO do deriveAfty (`ctx.dadoBasico`), e
         não é decidido aqui: ele sai do Corpo Treinado, das Armas Naturais ou do
         1d3 padrão, que são leituras da FICHA e não do canal. Ver
         `dadoDesarmado` em afty-niveis-dano.js. Na criatura ele é ignorado. */
      ...monta(escoposBasico, atributoDe({ fineza: finezaDesarmado }), ctx.grauBasico, 20,
        ctx.dadoBasico ?? "1d3", ctx.fonteDadoBasico ?? "Golpe Desarmado"),
      // Manoplas e Faixas são o Ataque Básico, então o grau delas entra aqui.
      // As `fontesAcertoBasico` são o que o encantamento somou por fora do grau:
      // elas saem do total do grau e aparecem com o nome próprio no hover.
      /* O Ataque Básico usa a Manopla ou Faixa equipada, e a proficiência dela é
         a que vale. Sem item de pugilato, `treinadaBasico` é falso e o golpe
         desarmado não soma BT no jogador. */
      ...acertoDe("corpo", Math.max(0, Math.trunc(Number(ctx.acertoGrauBasico) || 0)),
        escoposBasico, ctx.fontesAcertoBasico ?? [], null,
        armaDecide ? !!ctx.treinadaBasico : null) },
  ];

  for (const a of Array.isArray(ctx.armas) ? ctx.armas : []) {
    // Marcial concedida (Arma Dedicada) entra na lista de propriedades como
    // qualquer outra, marcada como concedida para a UI poder diferenciar.
    // ⚠ Entra ANTES dos escopos: `prop:marcial` tem de valer para a concedida
    // também, senão a Arma Dedicada não seria alvo de quem mira Marcial.
    const dedicada = valorCanal(ef, "propMarcial", a.id) > 0;
    const propriedades = [...(a.propriedades ?? [])];
    if (dedicada && !propriedades.some((p) => p.id === "marcial")) {
      propriedades.push({ id: "marcial", nome: "Marcial", valor: true, rotulo: "Marcial", concedida: true });
    }
    const escopos = escoposDaArma({ ...a, propriedades });
    const usaTecnicas = armasTecnicas.has(a.id);
    const atributo = usaTecnicas ? atributoTecnicas : atributoDe(a);
    const linhaArma = {
      id: a.id, nome: a.nome, fonte: "arma",
      alcance: alcanceDe(a.alcance, a.alcanceBonusCorpo), propriedades,
      grupo: a.grupo ?? null, categoria: a.categoria ?? null, tipoDano: a.tipoDano ?? null,
      dedicada,
      elegivelDedicada: !!a.elegivelDedicada,
      /* O dado impresso da arma, já resolvido pelo manejo escolhido na ficha
         (uma mão ou duas, nas versáteis). Só o jogador o usa. */
      ...monta(escopos, atributo, a.grauArma, a.critico ?? 20, a.dadoArma ?? null, "Dano da Arma"),
      // A ficha escolhe entre o ataque físico da categoria e o Ataque
      // Amaldiçoado. O atributo do dano continua vindo da arma.
      ...acertoDe(a.ataqueId ?? (a.distancia ? "distancia" : "corpo"),
        Math.max(0, Math.trunc(Number(a.acertoGrau) || 0)), escopos, a.fontesAcerto ?? [],
        usaTecnicas ? atributoTecnicas : null,
        armaDecide ? !!a.treinada : null),
    };
    entradas.push(aplicaCriticoDaArma(linhaArma, propriedades, a.criticoExtraDados));
  }
  return { entradas };
}

/**
 * Orçamento de treinos (autor, 2026-07-27):
 * `3 + maior modificador entre Inteligência e Sabedoria + rank do Grau + outros`.
 * O rank do Grau da criatura é 1 no Quarto e PARA NO 5, no Semi-Grau Especial
 * (autor, 2026-08-19): os quatro graus acima dele não somam mais nada aqui. Sai
 * do ND (ver grauFeiticeiro em ./afty-equipamentos.js). Mestre custa 2 vagas.
 *
 * ⚠ **Perícias E Testes de Resistência gastam deste mesmo caixa** (autor,
 * 2026-07-27). Jogadas de Ataque não.
 */
export function totalPericias({ modInt = 0, modSab = 0, grauRank = 1, bonus = 0 } = {}) {
  return 3 + Math.max(modInt, modSab) + Math.max(0, Math.trunc(grauRank)) + Math.max(0, Math.trunc(bonus));
}

/**
 * Resolve os três tipos de teste da criatura. Os três somam
 * `mod do atributo + uma escala de nível + bônus de treinamento + outros`,
 * e o que sai daqui é essa parte fixa (tudo menos o d20).
 *
 * ⚠ A ESCALA DE NÍVEL NÃO É A MESMA NOS TRÊS (planilha do autor, 2026-07-27):
 *   • **Testes de Resistência** usam a escala por TIPO, a mesma da CD e da
 *     Defesa. Ver `escala` em AFTY_RESISTENCIAS.
 *   • **Jogadas de Ataque** usam `INT(ND/1,5)`, igual para todo Tipo (a mesma
 *     escala fixa da Integridade), mais a Maestria cheia se treinado. Sem
 *     faixa de Mestre: a fórmula do autor só testa "treinado".
 *   • **Perícias** seguem em `metade do ND`, que é a fórmula do JOGADOR no
 *     livro. **PENDENTE:** as outras duas tinham fórmula própria da criatura,
 *     então esta provavelmente também tem. Perguntado, sem resposta ainda.
 *
 * ctx = { nd, bt, mods, tecnicaAttr, grauRank, escalaCD, escalaDefesa, bonusVagas,
 *         efeitos, penalidadeDestreza }.
 */
export function resolveTestes(creature, ctx = {}) {
  const nd = Math.max(1, Math.trunc(Number(ctx.nd) || 1));
  const bt = Math.max(0, Math.trunc(Number(ctx.bt) || 0));
  const mods = ctx.mods || {};
  const meioNivel = Math.floor(nd / 2);
  const modDe = (attr) => Math.trunc(Number(mods[attr]) || 0);
  const bonusDe = (attr, prof) => modDe(attr) + meioNivel + bonusProficiencia(bt, prof);

  // Escalas de nível. `cd` e `defesa` vêm prontas do deriveAfty (são as mesmas
  // da CD e da Defesa, não recalculo aqui), e a `fixa` é INT(ND/1,5), usada
  // pela Integridade e por TODAS as Jogadas de Ataque.
  /* ⚠ NO JOGADOR AS TRÊS ESCALAS VIRAM UMA: a metade do nível. O livro escreve
     uma fórmula por tipo de teste e as três dizem "metade do nível do
     personagem". Na criatura são três réguas diferentes, e é a planilha do autor
     de 2026-07-27 que as separa. Ver `escalaDosTestes` em afty-sistema.js. */
  const meiaEscala = regraDo(ctx.sistema, "escalaDosTestes") === "player";
  const escalaFixa = meiaEscala ? meioNivel : Math.floor(nd / 1.5);
  const ESCALA_TR = meiaEscala
    ? { cd: meioNivel, defesa: meioNivel, fixa: meioNivel }
    : {
      cd: Math.trunc(Number(ctx.escalaCD) || 0),
      defesa: Math.trunc(Number(ctx.escalaDefesa) || 0),
      fixa: escalaFixa,
    };
  // A fonte que a UI mostra é a DIVISÃO de verdade, não o nome da escala
  // (autor, 2026-07-27): os cinco TRs aparecem como "Nível ÷ N", e o N muda
  // com o Tipo nos quatro primeiros. Integridade é sempre ÷ 1,5.
  const divisorTexto = (d) => String(d).replace(".", ",");
  const ESCALA_ROTULO = meiaEscala
    ? { cd: "Metade do Nível", defesa: "Metade do Nível", fixa: "Metade do Nível" }
    : {
      cd: `Nível ÷ ${divisorTexto(ctx.divisorCD ?? 1.5)}`,
      defesa: `Nível ÷ ${divisorTexto(ctx.divisorDefesa ?? 1.5)}`,
      fixa: "Nível ÷ 1,5",
    };

  const profBruta = creature?.pericias && typeof creature.pericias === "object" ? creature.pericias : {};
  const valida = (p) => (p === "treinado" || p === "mestre" ? p : null);

  // Motor de Automação: bônus e proficiência concedidos por Treinamentos,
  // Habilidades e afins. `ef` é o resultado já aplicado, vindo do deriveAfty.
  const ef = ctx.efeitos || null;
  const bonusDeEfeito = (canal, alvo) => (ef ? valorCanal(ef, canal, alvo) : 0);
  // Uma parcela por FONTE, para o hover mostrar de onde veio cada número.
  // Com os suplantados (perdedores do pool exclusivo), que o hover risca.
  const partesDeEfeito = (canal, alvo) =>
    (ef ? detalhesDoCanal(ef, canal, alvo, true) : []).map((d) => ({
      label: d.nome, valor: d.valor, ...(d.suplantado ? { suplantado: true } : {}),
    }));

  /* Perícia e TR respondem por DOIS alvos: o próprio id e o atributo que usam
     (`atr:destreza`). As Dádivas do Céu do Restringido são escritas assim,
     "bônus em teste de perícia ou resistência usando destreza", e listar as
     perícias uma a uma no conteúdo seria lista copiada à mão que envelhece. */
  const escoposDe = (id, atributo) => [id, `atr:${atributo}`];
  const bonusPorAtributo = (canal, id, atributo) =>
    (ef ? valorCanalEscopos(ef, canal, escoposDe(id, atributo)) : 0);
  const partesPorAtributo = (canal, id, atributo) =>
    (ef ? detalhesDoCanalEscopos(ef, canal, escoposDe(id, atributo), true) : [])
      .map((d) => ({ label: d.nome, valor: d.valor, ...(d.suplantado ? { suplantado: true } : {}) }));
  const rotuloAttr = (k) => AFTY_ATTRS.find((a) => a.key === k)?.label ?? k;

  /* Penalidade de armadura e escudo, cumulativa (autor, 2026-08-01). Vale só em
     "testes de perícia que utilizam Destreza", que é o que o livro escreve:
     não pega Teste de Resistência nem Jogada de Ataque. Chega como número
     negativo. */
  const penalidadeEquip = Math.min(0, Math.trunc(Number(ctx.penalidadeDestreza) || 0));
  const penalidadeDe = (atributo) => (atributo === "destreza" ? penalidadeEquip : 0);
  const partePenalidade = (atributo) =>
    (penalidadeDe(atributo) ? [{ label: "Armadura e Escudo", valor: penalidadeEquip }] : []);

  const parteProficiencia = (prof) => {
    const v = bonusProficiencia(bt, prof);
    if (!prof) return [];
    return [{ label: prof === "mestre" ? "Maestria (Mestre)" : "Maestria", valor: v }];
  };
  // Proficiência concedida NUNCA rebaixa a escolhida: fica a maior das duas.
  const FAIXA = { treinado: 1, mestre: 2 };
  const NOME_FAIXA = { 1: "treinado", 2: "mestre" };
  /* ⚠ O PACOTE DA CLASSE CONCEDE **TR**, e não perícia (autor, 2026-08-30 para o
     TR, 2026-08-31 para tirar a perícia: *"Não era para FORÇAR as perícias já
     que tem escolhas e coisa do gênero"*).

     O TR é concedido porque o livro escreve em caixa alta que eles "NÃO PODEM
     SER ESCOLHIDOS DE FORMA LIVRE". A perícia é o contrário: o pacote decide
     QUANTAS e o jogador decide QUAIS, e mesmo a parte que o livro nomeia tem
     escolha dentro (qual Ofício, qual faixa).

     Entra pela MESMA porta do treino concedido pelo Motor: a faixa resolvida
     sobe, a escolhida não, então a linha fica verde, não gasta vaga de novo e
     não pode ser desmarcada ali. */
  const automaticas = (lista) => new Set(Array.isArray(lista) ? lista : []);
  const trDoPacote = automaticas(ctx.pacoteInicial?.trAutomaticos);
  const profComEfeito = (canal, id, escolhida, concedidaPeloPacote = false) => {
    const concedida = Math.trunc(bonusDeEfeito(canal, id));
    const nivel = Math.max(
      FAIXA[escolhida] ?? 0,
      Math.min(2, Math.max(0, concedida)),
      concedidaPeloPacote ? 1 : 0,
    );
    return NOME_FAIXA[nivel] ?? null;
  };

  // `requerTreinamento` e `complementar` seguem no catálogo (são a tabela do
  // livro e o filtro das Invocações depende deles), mas NÃO viram marcação na
  // tela: o autor tirou as duas da UI em 2026-07-27. Quem precisa da regra lê
  // a `nota` verbatim dentro da descrição.
  const catalogoPericias = catalogoPericiasDaFicha(creature);
  const pericias = catalogoPericias.map((p) => {
    /* Cada linha de Ofício tem os Ofícios DELA: o do livro guarda os seus e
       cada repetido guarda os seus, senão as duas linhas mostrariam o mesmo
       nome e a segunda não serviria para nada. */
    const oficios = ehPericiaOficio(p.id) ? oficiosDaFicha(creature, p.id) : [];
    /* ⚠ OFÍCIO É INTELIGÊNCIA, E PONTO (autor, 2026-08-30). Ele era a única
       perícia com atributo variável: usava Sabedoria quando o modificador dela
       fosse maior, o que fazia o número da linha mudar sozinho ao mexer num
       atributo que não é o dela. O atributo agora vem do catálogo, como o das
       outras dezenove. */
    const atributo = p.atributo;
    const nome = oficios.length > 0
      ? `${p.nome} (${oficios.join(", ")})`
      : p.nome;
    const escolhida = valida(profBruta[p.id]);
    const prof = profComEfeito("proficienciaPericia", p.id, escolhida);
    return {
      ...p,
      nome,
      atributo,
      prof,
      // A faixa que a FICHA escolheu, separada da resolvida: é ela que gasta
      // vaga. O treino concedido de fora já foi pago (com Focos, no caso do
      // Treino de Perícia) e não pode cobrar de novo.
      profEscolhida: escolhida,
      // `concedida` marca o treino que veio de fora, para a UI poder mostrar
      // que aquela faixa não é desmarcável ali.
      concedida: !!prof && prof !== escolhida,
      bonus: bonusDe(atributo, prof) + bonusPorAtributo("bonusPericia", p.id, atributo)
        + penalidadeDe(atributo),
      partes: [
        { label: rotuloAttr(atributo), valor: modDe(atributo) },
        /* "ND" é vocabulário de criatura, e a ficha de jogador tem Nível. O
           número é o mesmo, e o rótulo passa a bater com o dos TR e dos Ataques,
           que já dizem "Metade do Nível" no jogador. */
        { label: meiaEscala ? "Metade do Nível" : "Metade do ND", valor: meioNivel },
        ...parteProficiencia(prof),
        ...partePenalidade(atributo),
        ...partesPorAtributo("bonusPericia", p.id, atributo),
      ],
    };
  });

  const trBruta = creature?.resistenciasProf && typeof creature.resistenciasProf === "object"
    ? creature.resistenciasProf : {};
  /* DADOS SOMADOS AO TR (canal `dadosTR`), quando a regra escreve um dado em vez
     de um número ("adicionar 2d3 ao resultado"). O alvo do canal é o DADO, então
     eles valem em todo TR e a lista é montada uma vez só, fora do map. */
  const dadosNoTR = FACES_NOMEADAS
    .map((faces) => ({ faces, qtd: Math.trunc(bonusDeEfeito("dadosTR", `d${faces}`)) }))
    .filter((g) => g.qtd > 0);
  const textoDosDadosTR = dadosNoTR.map((g) => `${g.qtd}d${g.faces}`).join(" + ");
  const partesDosDadosTR = FACES_NOMEADAS.flatMap((faces) =>
    partesDeEfeito("dadosTR", `d${faces}`).map((x) => ({ label: x.label, texto: `${x.valor}d${faces}` })));

  const bonusDoTR = (r, prof) => modDe(r.atributo) + (ESCALA_TR[r.escala] ?? 0)
    + bonusProficiencia(bt, prof) + bonusPorAtributo("bonusTR", r.value, r.atributo);

  const resistencias = AFTY_RESISTENCIAS.map((r) => {
    // Mesma anatomia das perícias: a faixa ESCOLHIDA é a que gasta vaga, e a
    // resolvida ainda soma o que foi concedido de fora (Teste de Resistência
    // Mestre e afins). Sem os dois campos a UI trataria todo TR treinado como
    // concessão externa, pintava de verde e não deixava desmarcar.
    const escolhida = valida(trBruta[r.value]);
    const prof = profComEfeito("proficienciaTR", r.value, escolhida, trDoPacote.has(r.value));
    return {
      ...r,
      prof,
      profEscolhida: escolhida,
      concedida: !!prof && prof !== escolhida,
      // Escala por Tipo no lugar da metade do nível, ver o cabeçalho da função.
      bonus: bonusDoTR(r, prof),
      // Só quem é mestre num TR consegue sucesso crítico nele (superar a CD
      // por 10 ou mais ignora dano e condições).
      critico: prof === "mestre",
      // Margem necessária para o sucesso crítico. Parte de 20 e desce com a
      // Melhoria de Resistência e os Treinamentos Completos de Agilidade e
      // Resistência. Piso de 2, igual à margem do ataque.
      margemCritico: Math.max(2, 20 - Math.trunc(bonusDeEfeito("margemCriticoTR", r.value))),
      /* Os dados extras viajam ao lado do bônus, e não dentro dele: o bônus é o
         que soma sempre, e o dado é uma rolagem a mais. Quem mostra junta os
         dois num texto ("+7 + 2d3") e quem rola soma as duas coisas. */
      dadosExtras: dadosNoTR,
      textoBonus: textoDosDadosTR
        ? `${bonusDoTR(r, prof) >= 0 ? "+" : "−"}${Math.abs(bonusDoTR(r, prof))} + ${textoDosDadosTR}`
        : null,
      partes: [
        { label: rotuloAttr(r.atributo), valor: modDe(r.atributo) },
        { label: ESCALA_ROTULO[r.escala] ?? "Escala de Nível", valor: ESCALA_TR[r.escala] ?? 0 },
        ...parteProficiencia(prof),
        ...partesPorAtributo("bonusTR", r.value, r.atributo),
        ...partesDosDadosTR,
      ],
    };
  });

  // Ataque = mod do atributo + INT(ND/1,5) + Maestria se treinado. Sem faixa de
  // Mestre: a fórmula do autor só testa "treinado", e é a Maestria cheia.
  const atqBruta = creature?.ataquesProf && typeof creature.ataquesProf === "object" ? creature.ataquesProf : {};
  const fineza = !!creature?.ataqueFineza;
  /* ⚠ NO JOGADOR A MARCA POR TIPO NÃO DECIDE. Quem decide é a arma manejada,
     na linha dela (ver `acertoDe` em resolveDano). O Amaldiçoado escapa porque o
     livro escreve "você é sempre treinado" na fórmula dele, e é o `sempreTreinado`
     que já estava no catálogo. */
  const armaDecide = regraDo(ctx.sistema, "proficienciaPorArma") === "player";
  const ataques = AFTY_ATAQUES.map((a) => {
    const treinado = a.sempreTreinado || (!armaDecide && !!atqBruta[a.id]);
    // Fineza libera o atributo alternativo do ataque. Vem da arma manejada
    // (a marcação da ficha) ou de uma habilidade que dá a mesma permissão
    // ("você pode escolher usar tanto Força quanto Destreza", Corpo Treinado).
    // Sendo escolha livre e sem custo, vale o MAIOR dos dois modificadores.
    const liberado = a.atributoFineza
      && (fineza || bonusDeEfeito("finezaAtaque", a.id) > 0);
    const attr = a.id === "amaldicoado"
      ? (ctx.tecnicaAttr || "inteligencia")
      : (liberado && modDe(a.atributoFineza) > modDe(a.atributo) ? a.atributoFineza : a.atributo);
    return {
      ...a,
      atributo: attr,
      treinado,
      bonus: modDe(attr) + escalaFixa + (treinado ? bt : 0) + bonusDeEfeito("bonusAcerto", a.id),
      partes: [
        { label: rotuloAttr(attr), valor: modDe(attr) },
        { label: ESCALA_ROTULO.fixa, valor: escalaFixa },
        ...(treinado ? [{ label: "Maestria", valor: bt }] : []),
        ...partesDeEfeito("bonusAcerto", a.id),
      ],
    };
  });

  // ---------- Manobras (Agarrar, Derrubar, Desarmar, Empurrar) ----------
  // São testes de perícia, então aproveitam o bônus de perícia já resolvido
  // acima (atributo + escala + treino + efeitos). O que entra por cima é o
  // canal próprio delas.
  const bonusPericiaDe = (id) => pericias.find((p) => p.id === id)?.bonus ?? 0;
  const atletismo = bonusPericiaDe("atletismo");
  const acrobacia = bonusPericiaDe("acrobacia");
  const melhorDasDuas = Math.max(atletismo, acrobacia);
  const nomePericia = (id) => catalogoPericias.find((p) => p.id === id)?.nome ?? id;

  const manobras = AFTY_MANOBRAS.map((m) => {
    const usaMelhor = m.pericia === "melhor";
    const baseExec = usaMelhor ? melhorDasDuas : bonusPericiaDe(m.pericia);
    const rotuloExec = usaMelhor
      ? (acrobacia > atletismo ? nomePericia("acrobacia") : nomePericia("atletismo"))
      : nomePericia(m.pericia);
    return {
      ...m,
      // Executar a manobra.
      executar: baseExec + bonusDeEfeito("bonusManobra", m.id),
      periciaUsada: rotuloExec,
      partesExecutar: [
        { label: rotuloExec, valor: baseExec },
        ...partesDeEfeito("bonusManobra", m.id),
      ],
      // Resistir a ela: quem resiste sempre escolhe entre as duas.
      resistir: melhorDasDuas + bonusDeEfeito("resistirManobra", m.id),
      partesResistir: [
        { label: acrobacia > atletismo ? nomePericia("acrobacia") : nomePericia("atletismo"), valor: melhorDasDuas },
        ...partesDeEfeito("resistirManobra", m.id),
      ],
      // Só o Empurrar tem distância. "+1,5m para cada 5 pontos" fica na mesa:
      // depende da margem da rolagem.
      distancia: m.empurrao ? EMPURRAO_BASE + bonusDeEfeito("distanciaEmpurrao") : null,
    };
  });

  /* ⚠ O JOGADOR NÃO USA O MAIOR DOS DOIS, ele ESCOLHE um na criação: "você pode
     escolher entre os atributos Inteligência ou Sabedoria [...] Esta escolha não
     pode ser modificada nem revertida". A criatura pega `max(modInt, modSab)`,
     que é o contrário. O orçamento dela também soma 3 fixo e o rank do Grau, e
     o do jogador soma o pacote da Classe inicial. */
  /* ⚠ O TOTAL É A SOMA DAS FONTES, e não uma conta paralela (autor, 2026-08-30:
     "quando eu passar o mouse por cima da Quantidade de Perícias, me mostre a
     Fonte dela"). Número certo com detalhamento errado é bug, e a única forma de
     isso não acontecer é o número sair das parcelas. O assert compara a soma com
     a fórmula original das duas fórmulas. */
  const bonusOutros = Math.max(0, Math.trunc(Number(ctx.bonusVagas) || 0));
  const partesBonus = partesDeEfeito("vagasPericia");
  const somaBonus = partesBonus.reduce((acc, x) => acc + (Number(x.valor) || 0), 0);
  const partesOrcamento = [];
  if (ctx.pacoteInicial !== undefined) {
    /* Jogador: o pacote da Classe inicial mais o MAIOR modificador entre INT e
       SAB, que é a mesma régua da criatura.

       ⚠ ERA ESCOLHA PERMANENTE até 2026-08-31, num campo `periciaAtributo` que
       o jogador nunca conseguiu preencher: nenhuma tela do criador oferecia a
       escolha, então o padrão `"inteligencia"` do schema valia para TODA ficha
       de jogador e a Sabedoria não contava nunca. O autor corrigiu a regra:
       *"a quantidade de perícias é o maior modificador de atributo entre
       Inteligência ou Sabedoria e não só Inteligência"*.

       O campo continua no schema e deixou de ser lido. Se a escolha permanente
       voltar a valer, ela precisa de tela antes de voltar a decidir número. */
    const melhor = modDe("sabedoria") > modDe("inteligencia") ? "sabedoria" : "inteligencia";
    if (ctx.pacoteInicial) {
      partesOrcamento.push({
        label: `${ctx.pacoteInicial.classeNome} (Pacote)`,
        valor: vagasDoPacote(ctx.pacoteInicial),
      });
    }
    /* O piso em zero é do jogador e não da criatura, e fica como estava: o
       autor corrigiu QUAL atributo entra, não o que um modificador negativo
       faz com o orçamento. */
    partesOrcamento.push({
      label: rotuloAttr(melhor),
      valor: Math.max(0, modDe(melhor)),
    });
  } else {
    // Criatura: 3 + o MAIOR entre INT e SAB + o rank do Grau do Feiticeiro.
    const melhor = modDe("sabedoria") > modDe("inteligencia") ? "sabedoria" : "inteligencia";
    partesOrcamento.push({ label: "Base", valor: 3 });
    partesOrcamento.push({ label: rotuloAttr(melhor), valor: modDe(melhor) });
    partesOrcamento.push({ label: "Grau do Feiticeiro", valor: Math.max(0, Math.trunc(ctx.grauRank ?? 1)) });
  }
  /* As parcelas por fonte só entram se fecharem com o número que o `deriveAfty`
     apurou. Um canal com expressão negativa faria as duas contas divergirem, e
     aí vale mais uma linha honesta e sem nome do que um detalhamento errado. */
  if (bonusOutros > 0) {
    if (somaBonus === bonusOutros) partesOrcamento.push(...partesBonus);
    else partesOrcamento.push({ label: "Outros", valor: bonusOutros });
  }
  const total = partesOrcamento.reduce((acc, x) => acc + (Number(x.valor) || 0), 0);
  // Perícias E Testes de Resistência dividem as mesmas vagas (autor,
  // 2026-07-27). Jogadas de Ataque ficam fora: elas não têm faixa de Mestre e
  // o treino delas é com a arma que a criatura maneja.
  //
  /* ⚠ NO JOGADOR O TR NÃO GASTA NADA, e o livro escreve isso em caixa alta:
     "TESTES DE RESISTÊNCIA NÃO PODEM SER ESCOLHIDOS DE FORMA LIVRE, SENDO
     RECEBIDO POR ESPECIALIZAÇÃO, TALENTOS E OUTRAS FONTES. [...] E não contam
     para o Limite de Pericias."

     O gasto continua CALCULADO no jogador, e só não entra na soma: ele é o que
     a tela usa para saber que aquele TR foi marcado à mão numa ficha onde marcar
     não devia ser possível. Zerar a variável esconderia o sintoma. */
  const trForaDoCaixa = regraDo(ctx.sistema, "trForaDoOrcamento") === "player";
  const gastoPericias = pericias.reduce((s, p) => s + custoProficiencia(p.profEscolhida), 0);
  const gastoResistencias = resistencias.reduce((s, r) => s + custoProficiencia(r.profEscolhida), 0);
  const gastos = gastoPericias + (trForaDoCaixa ? 0 : gastoResistencias);

  return {
    pericias,
    resistencias,
    ataques,
    manobras,
    orcamento: {
      total, gastos, pericias: gastoPericias, resistencias: gastoResistencias,
      restante: total - gastos, excedeu: gastos > total,
      // Uma linha por fonte, para o hover do contador.
      partes: partesOrcamento,
      // A tela precisa saber se deve mostrar o TR dentro do medidor.
      trNoOrcamento: !trForaDoCaixa,
    },
    // Atenção = 10 + o bônus de Percepção (Percepção passiva).
    atencao: 10 + (pericias.find((p) => p.id === "percepcao")?.bonus ?? 0),
  };
}

/** Validador de conteúdo (mesmo papel de validarCatalogoAptidoes). */
export function validarCatalogoPericias() {
  const erros = [];
  const ids = new Set();
  const nomes = new Set();
  const attrKeys = new Set(AFTY_ATTRS.map((a) => a.key));
  for (const p of AFTY_PERICIAS) {
    if (ids.has(p.id)) erros.push(`id duplicado: ${p.id}`);
    ids.add(p.id);
    if (nomes.has(p.nome)) erros.push(`nome duplicado: ${p.nome}`);
    nomes.add(p.nome);
    if (!p.nome) erros.push(`${p.id}: sem nome`);
    if (!attrKeys.has(p.atributo)) erros.push(`${p.id}: atributo inválido "${p.atributo}"`);
  }
  return erros;
}
