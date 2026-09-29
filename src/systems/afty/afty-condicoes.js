import { CONDICOES_CATALOGO, SANGRAMENTO, SANGRAMENTO_FORCA } from "./afty-feiticos";

/**
 * ============================================================
 * CONDIÇÕES: a força, o texto do livro e o que cada uma faz no número
 * ============================================================
 * As 26 condições existem no Afty desde sempre como NOME dentro de uma lista de
 * força, em `CONDICOES_CATALOGO`. Um Feitiço guarda `{ nome, forca }`, e a sessão
 * da Ficha guarda `{ id, nome, forca, rodadas }`.
 *
 * O módulo nasceu em 2026-08-28 como terreno preparado, com o `CONDICAO_TEXTOS`
 * vazio esperando o autor. Os textos chegaram em 2026-09-21, junto com o pedido
 * de automatizar: *"considere os efeitos númericos delas de maneira automatica e
 * conte as rodadas que faltam para acabar na Ficha Final"*.
 *
 * ⚠ CONDIÇÕES NÃO ACUMULAM ENTRE SI (autor, 2026-09-21, em caixa alta):
 * *"PARALISADO (-10 DE DEFESA) E DESPREVINIDO (-3 DE DEFESA) FICA COMO -10 DE
 * DEFESA E NÃO COMO -13"*. É a regra do livro também: *"Condições com os mesmos
 * efeitos não se acumulam, aplique apenas os mais severos"*. A disputa é POR
 * NÚMERO EXATO, e não por condição: Cego dá -5 em Percepção e Envenenado dá -2 em
 * toda perícia, então Percepção fica em -5 e as outras perícias em -2. Por isso
 * o `*` de cada alvo é EXPANDIDO nos ids concretos antes da disputa, e o que sai
 * para o Motor é uma linha por número, com o vencedor. Quem perdeu vai para o
 * hover riscado, no mesmo formato do pool exclusivo (`suplantado`).
 *
 * ⚠ CONDIÇÃO SOMA COM O RESTO. A disputa é só entre condições: um buff de +2 na
 * Defesa com Paralisado dá -8. Por isso elas NÃO entram no pool exclusivo do
 * Motor, que na criatura é plano e as faria brigar com um Feitiço Auxiliar.
 *
 * ⚠ CONDIÇÃO QUE CITA OUTRA A APLICA (Agarrado deixa Desprevenido e Imóvel). A
 * inclusão é recursiva (Cego inclui Surpreso, que inclui Desprevenido), e a
 * condição incluída conta UMA vez só: marcada à mão e por inclusão, é a mesma.
 *
 * ⚠ O QUE NÃO É NÚMERO FICA NO RESUMO E NO TEXTO. "Não pode realizar ações",
 * "falha em testes envolvendo a visão", "+3 de Defesa contra ataques a distância"
 * dependem do que está acontecendo na mesa. O `resumo` diz isso numa linha, que
 * é o que o cartão e o catálogo mostram (autor, 2026-09-22: "Deixar como uma
 * lista não fala nada sobre nenhuma das condições"), e o texto do livro fica a
 * um toque. Ver docs/afty-condicoes.md.
 *
 * ⚠ Leitura LAZY do catálogo, como em todo módulo que consulta um catálogo
 * remendável: um Addon pode acrescentar condição (família `condicoes`), e um
 * mapa montado no topo congelaria o estado anterior à instalação.
 * ============================================================
 */

/**
 * As quatro forças, em ordem. O `nivel` é o que a tela mostra como degrau: a
 * chave crua ("media") é de código, e o jogador lê "Média" e vê que ela é a
 * segunda de quatro.
 *
 * ⚠ A ORDEM É A DA GRAVIDADE, e é ela que ordena a lista aplicada: com três
 * condições em cima da criatura, a que mais dói tem de estar no topo.
 */
export const FORCAS_CONDICAO = [
  { id: "fraca",   label: "Fraca",   nivel: 1 },
  { id: "media",   label: "Média",   nivel: 2 },
  { id: "forte",   label: "Forte",   nivel: 3 },
  { id: "extrema", label: "Extrema", nivel: 4 },
];

const FORCA_POR_ID = Object.fromEntries(FORCAS_CONDICAO.map((f) => [f.id, f]));

/**
 * As três ESPECIAIS do livro: Indefeso, Invisível e Surpreso.
 *
 * ⚠ ELAS NÃO ENTRAM NO `CONDICOES_CATALOGO`, e é de propósito. O catálogo é a
 * lista de níveis, e o livro diz que *"as condições não especificadas aqui não
 * podem ser aplicadas de nenhuma forma"*: um Feitiço não pode impor Surpreso.
 * Mas elas existem na mesa (Cego deixa Surpreso, Indefeso é Imóvel e Atordoado, e
 * Invisível vem de habilidade), então a Ficha e a bancada as oferecem num grupo
 * à parte, sem degrau.
 */
export const CONDICOES_ESPECIAIS = ["Indefeso", "Invisível", "Surpreso"];
export const FORCA_ESPECIAL = { id: "especial", label: "Especial", nivel: 0 };

/** Os seis grupos do livro. Só rótulo: nenhuma regra lê o grupo. */
export const GRUPOS_CONDICAO = {
  fisica: "Física",
  incapacitacao: "Incapacitação",
  mental: "Mental",
  movimento: "Movimento",
  sensorial: "Sensorial",
  vulnerabilidade: "Vulnerabilidade",
};

/**
 * O QUE CADA CONDIÇÃO DIZ, chaveado pelo NOME exato do catálogo. Verbatim do
 * autor (2026-09-21), sem o "Nome (Força)." do começo, que a linha já mostra.
 *
 * ⚠ DUAS TROCAS DE PONTUAÇÃO, pela regra de tela do autor (nunca travessão nem
 * ponto e vírgula): o travessão do Lento virou vírgula, e o ponto e vírgula do
 * Sangramento virou ponto. As palavras são as do livro.
 *
 * ⚠ NOME COM ACENTO E CAIXA EXATOS. O `validarCatalogoCondicoes` recusa chave
 * que não case, porque uma chave errada não daria erro nenhum: a condição só
 * apareceria sem texto, calada.
 */
export const CONDICAO_TEXTOS = {
  // ---------- Físicas ----------
  "Condenado": { grupo: "fisica", texto: "Um personagem condenado tem o custo em PE de todas as suas habilidades aumentado em 1." },
  "Engasgando": { resumo: "Mudo, precisa segurar o ar", grupo: "fisica", texto: "O alvo fica mudo e precisa segurar o Ar." },
  "Enjoado": { resumo: "Não converte ações na Hierarquia de Ações", grupo: "fisica", texto: "Um personagem enjoado não pode converter suas ações dentro da Hierarquia de Ações." },
  "Envenenado": { grupo: "fisica", texto: "Recebe -2 em jogadas de ataque, testes de resistência e testes de perícia enquanto o veneno durar." },
  "Sangramento": { resumo: "Perde vida no início do turno, TR de Fortitude no fim encerra", grupo: "fisica", texto: "Um personagem com sangramento recebe perda de vida no início de seu turno, e deve realizar um teste de resistência de Fortitude no final dele. Em uma falha, a condição persiste. Em um sucesso, a condição se encerra. A CD e a perda de vida do sangramento dependem do causador da condição (veja página 213)." },
  "Sofrendo": { resumo: "-5 em Prestidigitação para rituais", grupo: "fisica", texto: "Você está sofrendo de uma dor horrível. Você recebe -5 em testes de concentração e em testes de Prestidigitação para realizar rituais e perde 3 metros de movimento." },
  // ---------- Incapacitação ----------
  "Atordoado": { resumo: "Sem ações e reações", grupo: "incapacitacao", texto: "O personagem fica desprevenido e não pode realizar ações ou reações." },
  "Inconsciente": { resumo: "Sem ações e reações, ataques contra ele acertam e são críticos", grupo: "incapacitacao", texto: "O personagem não pode realizar ações ou reações e fica caído. Larga tudo que estiver segurando e não pode falar. Falha automaticamente em testes de resistência de Reflexos, todo ataque realizado contra ela acerta e é considerado um acerto crítico. Uma criatura inconsciente que não esteja nas portas da morte é desperta se tomar dano ou uma criatura gastar uma ação comum para a chacoalhar." },
  "Paralisado": { resumo: "Só ações mentais, corpo a corpo que acerta é crítico", grupo: "incapacitacao", texto: "O personagem não pode realizar ações ou reações, exceto ações completamente mentais. O personagem recebe -10 de Defesa, falha automaticamente em testes de resistência de Reflexos e todo ataque corpo a corpo que acerte o personagem é considerado um acerto crítico." },
  "Indefeso": { resumo: "Pode ser morto com uma ação completa de quem o toca", grupo: "incapacitacao", texto: "Uma criatura fica Imóvel e atordoado. Se estiver com uma criatura indefesa ao seu alcance de toque você pode gastar uma ação completa e, se o fizer, pode matá-la ou causar um Ferimento Complexo na criatura indefesa." },
  // ---------- Mentais ----------
  "Abalado": { grupo: "mental", texto: "O personagem sofre -1 em jogadas de ataque e testes de perícia." },
  "Amedrontado": { grupo: "mental", texto: "O personagem sofre -3 em jogadas de ataque e testes de perícia. Os prejuízos desta condição não se acumulam com os de Abalado, sendo uma evolução direta dela." },
  "Aterrorizado": { resumo: "Não se aproxima por vontade própria de quem causou a condição", grupo: "mental", texto: "Não pode se aproximar voluntariamente da criatura que infligiu a condição." },
  "Confuso": { resumo: "Move-se ao acaso, -4 em Fortitude e Atletismo para se manter de pé", grupo: "mental", texto: "Um personagem confuso se comporta da maneira aleatória. Você sofre -4 em testes de Fortitude e Atletismo para se manter de pé e, logo após se movimentar 1,5 metros rode 1d4 (1: frente, 2: trás, 3: direita ou 4: esquerda) você se move 3 metros nessa direção. Repita o processo em um intervalo de 1,5 metros de movimento voluntário entre as rolagens. Se sua movimentação permitir, rode 1d6 ao invés de 1d4 (onde 5 é para baixo e 6 para cima)." },
  "Enfeitiçado": { resumo: "-2 em todo teste contra quem o enfeitiçou", grupo: "mental", texto: "A criatura enfeitiçada recebe um prejuízo de -2 em todos os testes que realizar contra quem a enfeitiçou." },
  // ---------- Movimento ----------
  "Agarrado": { resumo: "Ataque a distância contra ele tem 50% de acertar o alvo errado", grupo: "movimento", texto: "Enquanto agarrado, o personagem fica desprevenido e imóvel. Um personagem fazendo um ataque à distância contra uma criatura envolvida em uma ação de agarrar, tem 50% de chance de acertar o alvo errado (1 a 5 em 1d10). Se um personagem agarrando se mover a criatura agarrada acompanha ele." },
  "Caído": { resumo: "+3 de Defesa contra ataques a distância, levantar custa uma ação de movimento", grupo: "movimento", texto: "O personagem sofre -3 em ataques corpo a corpo e só pode se mover 4,5 metros, rastejando, ou utilizar uma ação de movimento para se levantar. Além disso, se estiver caído no chão você tem -3 de Defesa contra ataques corpo a corpo, mas recebe +3 de Defesa contra ataques a distância. Um personagem caído que esteja voando imediatamente perde seu deslocamento de voo até que fique de pé." },
  "Enredado": { grupo: "movimento", texto: "Tem o deslocamento reduzido à metade e recebe -2 na sua Defesa e em rolagens de ataque." },
  "Imóvel": { resumo: "Não anda, esgueira, levanta nem pula", grupo: "movimento", texto: "A criatura se torna incapaz de utilizar as Ações de Movimento Andar, Esgueirar, Levantar e Pular, porém pode usar Sacar e ações que gastem seu movimento, mas que não te deslocam para outro ponto, como a aptidão Canalizar em Golpe. Além disso, você não pode receber Deslocamento de qualquer fonte." },
  "Lento": { grupo: "movimento", texto: "Toda forma de movimento do personagem, como seu valor de Deslocamento, é reduzida pela metade." },
  // ---------- Sensoriais ----------
  "Cego": { resumo: "Falha em testes de visão, alvos dos seus ataques têm Camuflagem Total", grupo: "sensorial", texto: "O personagem fica Surpreso e Lento, falha em qualquer teste envolvendo a visão e sofre -5 em Percepção. Todos os alvos de seus ataques recebem Camuflagem Total (50% de chance de desviar do ataque automaticamente). Você é considerado cego enquanto estiver em uma área de Escuridão Total, a menos que algo lhe permita ver no escuro." },
  "Desorientado": { resumo: "Sem reações contra a próxima ação ofensiva e ataques de oportunidade", grupo: "sensorial", texto: "Fica incapaz de utilizar reações contra a próxima ação ofensiva realizada contra você ou ataques de oportunidade. A condição se encerra após seu efeito ser realizado." },
  "Desprevenido": { grupo: "sensorial", texto: "O personagem sofre -3 na Defesa e em Testes de Resistência de Reflexos. Você fica desprevenido contra inimigos que não possa ver mas saiba que estão perto." },
  "Invisível": { resumo: "Não pode ser visto, Esconder como Ação Livre, vantagem na Iniciativa", grupo: "sensorial", texto: "O personagem não pode ser visto, recebe +10 em testes de Furtividade e, ao receber a condição, pode utilizar Esconder como uma Ação Livre. Caso esteja Invisível durante a rolagem de Iniciativa, você possui vantagem nela." },
  "Surdo": { resumo: "Falha em testes de audição", grupo: "sensorial", texto: "O personagem falha em qualquer teste envolvendo a audição e sofre -5 em rolagens de Iniciativa. Caso já esteja em combate, seu valor atual de Iniciativa também é reduzido em -5, alterando a ordem dos turnos." },
  "Surpreso": { resumo: "Sem reações contra quem o surpreendeu", grupo: "sensorial", texto: "O personagem fica Desprevenido e não pode realizar reações contra uma criatura que o deixou surpreso. Uma criatura Surpreendida ou que não saiba da existência do perigo fica surpresa contra ele." },
  // ---------- Vulnerabilidade ----------
  "Exposto": { resumo: "Ataques contra ele: +4 e dano extra igual ao nível do atacante", grupo: "vulnerabilidade", texto: "Jogadas de Ataque contra a criatura recebem +4 e, caso acertem, seus ataques causam dano adicional igual ao nível do atacante, em cada rolagem de dano." },
  "Fragilizado": { grupo: "vulnerabilidade", texto: "Seus valores de Redução de Dano são reduzidos a zero, assim como suas resistências são anuladas (imunidades não são anuladas). Enquanto possuir esta condição, você não pode ter sua Redução de Dano aumentada e nem se tornar resistente a nada." },
  // A única frase que o livro tem para ele está na lista de níveis.
  "Desmembramento": { resumo: "Tratado como condição por Feitiços", texto: "Desmembramento não é uma condição, porém é tratada como uma por Feitiços." },
};

/**
 * O QUE CADA CONDIÇÃO FAZ NO NÚMERO. Só o que o texto escreve como número fixo
 * e sempre valendo. Os campos:
 *
 *   mods       `[alvo, valor]`. Alvos: `defesa`, `iniciativa`, `tr:<id>`,
 *              `pericia:<id>`, `ataque:<id>` e `manobra:<id>`. O `*` vale para
 *              todos os ids daquele tipo e é expandido antes da disputa.
 *   inclui     as condições que esta aplica junto.
 *   movimento  `metade`, `menos` (metros), `teto` (metros) ou `zero`.
 *   rdZero     Fragilizado: toda RD vai a zero e a resistência é anulada.
 *   custoPE    quanto o custo em PE de TODO gasto sobe (Condenado).
 *   falha      TRs em que a criatura falha automaticamente.
 *   perdaVida  o Sangramento: a perda vem da faixa escolhida ao aplicar.
 *
 * ⚠ DECISÕES DE LEITURA, a confirmar com o autor (docs/a-fazer.md):
 *   • Caído entra como -3 na Defesa, que é como o próprio livro o conta no
 *     exemplo "enredado e caído sofre -3 na Defesa, não -5". O +3 contra ataque a
 *     distância fica no texto.
 *   • Os -5 do Sofrendo valem na Concentração, que é o teste nomeado do Motor. Os
 *     -5 em Prestidigitação só valem para ritual, e ficam no texto.
 *   • Os -4 do Confuso são só "para se manter de pé", e ficam no texto.
 *   • Exposto é número do ATACANTE, e fica no texto.
 */
export const CONDICAO_EFEITOS = {
  "Abalado":      { mods: [["ataque:*", -1], ["pericia:*", -1]] },
  "Caído":        { mods: [["ataque:corpo", -3], ["defesa", -3]], movimento: { teto: 4.5 } },
  "Desprevenido": { mods: [["defesa", -3], ["tr:reflexos", -3]] },
  "Sangramento":  { perdaVida: true },
  "Sofrendo":     { mods: [["manobra:concentracao", -5]], movimento: { menos: 3 } },
  "Agarrado":     { inclui: ["Desprevenido", "Imóvel"] },
  "Amedrontado":  { mods: [["ataque:*", -3], ["pericia:*", -3]] },
  "Condenado":    { custoPE: 1 },
  "Enredado":     { mods: [["defesa", -2], ["ataque:*", -2]], movimento: { metade: true } },
  "Envenenado":   { mods: [["ataque:*", -2], ["tr:*", -2], ["pericia:*", -2]] },
  "Lento":        { movimento: { metade: true } },
  "Surdo":        { mods: [["iniciativa", -5]] },
  "Cego":         { inclui: ["Surpreso", "Lento"], mods: [["pericia:percepcao", -5]] },
  "Fragilizado":  { rdZero: true },
  "Imóvel":       { movimento: { zero: true } },
  "Atordoado":    { inclui: ["Desprevenido"] },
  "Inconsciente": { inclui: ["Caído"], falha: ["reflexos"] },
  "Paralisado":   { mods: [["defesa", -10]], falha: ["reflexos"] },
  "Indefeso":     { inclui: ["Imóvel", "Atordoado"] },
  "Invisível":    { mods: [["pericia:furtividade", 10]] },
  "Surpreso":     { inclui: ["Desprevenido"] },
};

/** As quatro faixas do Sangramento, com o dado de cada uma (`SANGRAMENTO`). */
export const SANGRAMENTO_FAIXAS = [
  { id: "fraco",   label: "Fraco" },
  { id: "medio",   label: "Médio" },
  { id: "forte",   label: "Forte" },
  { id: "extremo", label: "Extremo" },
].map((f) => ({ ...f, dados: SANGRAMENTO[f.id][0], faces: SANGRAMENTO[f.id][1], forca: SANGRAMENTO_FORCA[f.id] }));

/** A faixa de Sangramento pelo id, ou `null`. */
export const faixaDeSangramento = (id) => SANGRAMENTO_FAIXAS.find((f) => f.id === id) ?? null;

/** Toda condição do catálogo, achatada, com a força de cada uma. */
function todasAsCondicoes() {
  const out = [];
  for (const f of FORCAS_CONDICAO) {
    for (const nome of CONDICOES_CATALOGO[f.id] ?? []) out.push({ nome, forca: f });
  }
  return out;
}

/**
 * A ficha de uma condição pelo NOME: força, degrau e texto, se houver.
 *
 * Devolve algo mesmo para nome desconhecido, e isso não é descuido: uma condição
 * gravada na sessão pode ter vindo de um Addon que foi desinstalado, e nesse
 * caso ela continua sendo um rótulo válido em cima da criatura. Ver a nota de
 * "não há linha morta para condição" em `afty-feiticos.js`.
 */
export function fichaDaCondicao(nome, forcaId = null) {
  const achada = todasAsCondicoes().find((c) => c.nome === nome);
  const especial = !achada && CONDICOES_ESPECIAIS.includes(nome);
  const forca = achada?.forca ?? (especial ? FORCA_ESPECIAL : null) ?? FORCA_POR_ID[forcaId] ?? null;
  const texto = CONDICAO_TEXTOS[nome] ?? null;
  return {
    nome,
    forcaId: forca?.id ?? null,
    forcaLabel: forca?.label ?? null,
    nivel: forca?.nivel ?? 0,
    resumo: texto?.resumo ?? null,
    descricao: texto?.texto ?? null,
    grupo: texto?.grupo ? GRUPOS_CONDICAO[texto.grupo] : null,
    // Do catálogo, ou de um Addon que sumiu. A tela não muda por isso, mas o
    // seletor não pode oferecer o que não existe mais.
    doCatalogo: !!achada || especial,
    especial,
  };
}

/**
 * As condições agrupadas por força, para o seletor mostrar o degrau de cada uma.
 * Com `especiais`, as três de fora da lista de níveis entram num grupo no fim:
 * a Ficha e a bancada as oferecem, o editor de Feitiço não.
 */
export function condicoesPorForca({ especiais = false } = {}) {
  const grupos = FORCAS_CONDICAO.map((f) => ({
    ...f,
    condicoes: (CONDICOES_CATALOGO[f.id] ?? []).map((nome) => fichaDaCondicao(nome)),
  })).filter((g) => g.condicoes.length > 0);
  if (!especiais) return grupos;
  return [...grupos, { ...FORCA_ESPECIAL, condicoes: CONDICOES_ESPECIAIS.map((nome) => fichaDaCondicao(nome)) }];
}

/* ============================================================ */
/* A ENTRADA: sessão da Ficha ou bancada do criador               */
/* ============================================================ */

/**
 * A lista de condições que chega ao derive, saneada. Aceita o objeto da sessão
 * (`{ id, nome, forca, rodadas, sangramento }`) e, por folga, o nome solto.
 *
 * ⚠ O ID REPETIDO SAI, e o NOME repetido fica. Duas marcações de Envenenado são
 * duas durações diferentes na mesa, e a disputa cuida de não somar as duas.
 */
export function normalizaCondicoes(lista) {
  if (!Array.isArray(lista)) return [];
  const vistos = new Set();
  const out = [];
  lista.forEach((c, i) => {
    const bruta = typeof c === "string" ? { nome: c } : c;
    const nome = typeof bruta?.nome === "string" ? bruta.nome.trim() : "";
    if (!nome) return;
    const id = typeof bruta.id === "string" && bruta.id ? bruta.id : `cond_${i}`;
    if (vistos.has(id)) return;
    vistos.add(id);
    const rodadas = bruta.rodadas != null && Number.isFinite(Number(bruta.rodadas))
      ? Math.max(1, Math.trunc(Number(bruta.rodadas)))
      : null;
    out.push({
      id, nome,
      forca: typeof bruta.forca === "string" ? bruta.forca : null,
      rodadas,
      sangramento: faixaDeSangramento(bruta.sangramento)?.id ?? null,
    });
  });
  return out;
}

/* ============================================================ */
/* A DISPUTA                                                     */
/* ============================================================ */

/* O prefixo do alvo vira canal do Motor. `defesa` e `iniciativa` não têm alvo. */
const CANAL_DO_ALVO = {
  defesa: "defesa", iniciativa: "iniciativa",
  tr: "bonusTR", pericia: "bonusPericia", ataque: "bonusAcerto", manobra: "bonusManobra",
};

const ROTULO_TODOS = { tr: "Testes de Resistência", pericia: "Perícias", ataque: "Ataques" };
/* Os alvos pontuais do catálogo têm nome fixo, para o catálogo descrever a
   condição sem uma ficha na mão (`descreveCondicao`). Com ficha, o nome da
   perícia vem dela, e é o mesmo. */
const ROTULO_FIXO = {
  defesa: "Defesa", iniciativa: "Iniciativa",
  "ataque:corpo": "Ataques Corpo a Corpo", "ataque:distancia": "Ataques a Distância",
  "manobra:concentracao": "Concentração",
  "tr:reflexos": "Reflexos", "pericia:percepcao": "Percepção", "pericia:furtividade": "Furtividade",
};

/**
 * Um degrau de 1,5 m para baixo: o movimento anda em quadrados, e o Afty
 * arredonda para baixo (autor, 2026-07-18). 10,5 pela metade dá 4,5, e não 5,25.
 */
const pisoDoQuadrado = (m) => Math.max(0, Math.floor(m / 1.5 + 1e-9) * 1.5);

/** O que cada regra de movimento faz com o valor de entrada. */
function movimentoDaRegra(regra, base) {
  if (regra.zero) return 0;
  if (regra.metade) return pisoDoQuadrado(base / 2);
  if (regra.menos != null) return Math.max(0, base - regra.menos);
  if (regra.teto != null) return Math.min(base, regra.teto);
  return base;
}

const textoMetros = (m) => `${String(m).replace(".", ",")}m`;
const sinal = (n) => (n > 0 ? `+${n}` : String(n));

/**
 * As condições que uma condição aplica, ela primeiro. Recursivo, com guarda de
 * ciclo: um Addon que escrevesse A inclui B inclui A não trava o derive.
 */
function expandeInclusoes(nome, vistos = new Set()) {
  if (vistos.has(nome)) return [];
  vistos.add(nome);
  const out = [nome];
  for (const inc of CONDICAO_EFEITOS[nome]?.inclui ?? []) out.push(...expandeInclusoes(inc, vistos));
  return out;
}

/**
 * Resolve as condições em cima da criatura.
 *
 * `alvos` traz os ids concretos de cada tipo, com o nome para a tela:
 *   `{ pericias: [{ id, nome }], trs: [{ id, nome }], ataques: [{ id, nome }] }`.
 * Quem monta é o derive, porque as perícias dependem da ficha (Ofícios e
 * perícias personalizadas).
 *
 * Devolve:
 *   ativas      uma entrada por condição marcada, com o que ela faz e se perdeu
 *   efeitos     as linhas VENCEDORAS, prontas para o Motor
 *   suplantados as perdedoras, no formato de `detalhes`, para o hover riscar
 *   movimento   `(base) => { valor, partes, fonte }`
 *   fragilizado o nome de quem zerou a RD, ou `null`
 *   falhas      `{ [trId]: [nomes] }`, os TRs de falha automática
 */
export function resolveCondicoes(lista, alvos = {}) {
  const entradas = normalizaCondicoes(lista);
  const IDS = { pericia: alvos.pericias ?? [], tr: alvos.trs ?? [], ataque: alvos.ataques ?? [] };

  const rotuloDoAlvo = (spec) => {
    if (ROTULO_FIXO[spec]) return ROTULO_FIXO[spec];
    const [tipo, id] = spec.split(":");
    if (id === "*") return ROTULO_TODOS[tipo] ?? spec;
    return (IDS[tipo] ?? []).find((x) => x.id === id)?.nome ?? id;
  };
  /* O alvo em pares concretos `{ canal, alvo }`. Um id que a ficha não conhece
     (perícia de Addon desinstalado) sai sem par, e a condição não quebra. */
  const concretos = (spec) => {
    const [tipo, id] = spec.split(":");
    const canal = CANAL_DO_ALVO[tipo];
    if (!canal) return [];
    if (id == null) return [{ canal, alvo: null }];
    if (id === "*") return (IDS[tipo] ?? []).map((x) => ({ canal, alvo: x.id }));
    if (IDS[tipo] && !IDS[tipo].some((x) => x.id === id)) return [];
    return [{ canal, alvo: id }];
  };

  /* ---- As FONTES: cada condição que vale, contando as incluídas uma vez ----
     A marcada à mão vem antes da incluída, para o hover dizer "Desprevenido" e
     não "Desprevenido (Agarrado)" quando as duas estão marcadas. */
  const fontes = [];
  const porNome = new Map();
  const registra = (nome, via) => {
    if (porNome.has(nome)) return;
    const f = { nome, via, rotulo: via ? `${nome} (${via})` : nome };
    porNome.set(nome, f);
    fontes.push(f);
  };
  for (const e of entradas) registra(e.nome, null);
  for (const e of entradas) {
    for (const inc of expandeInclusoes(e.nome).slice(1)) registra(inc, e.nome);
  }

  /* ---- A disputa, por número exato e por sinal ----
     Penalidade fica com a PIOR, bônus com o MAIOR, e os dois vencedores somam:
     é a mesma regra do pool exclusivo (autor, 2026-07-30), aplicada só entre
     condições. No empate vence quem chegou primeiro. */
  const disputas = new Map();
  const entra = (k, item) => {
    if (!disputas.has(k)) disputas.set(k, []);
    disputas.get(k).push(item);
  };
  for (const f of fontes) {
    const def = CONDICAO_EFEITOS[f.nome] ?? {};
    for (const [spec, valor] of def.mods ?? []) {
      for (const par of concretos(spec)) {
        entra(`${par.canal}|${par.alvo ?? "*"}|${valor < 0 ? "-" : "+"}`, { ...par, valor, fonte: f, spec });
      }
    }
    if (def.custoPE) {
      // Canal de REDUÇÃO: aumentar o custo é reduzir negativo. Os cinco leitores
      // somam o aumento DEPOIS do piso de 1 PE (ver `custoEmPe`).
      entra("custoPE|*|-", { canal: "custoPE", alvo: null, valor: -Math.abs(def.custoPE), fonte: f, spec: "custoPE" });
    }
  }

  const efeitos = [];
  const suplantados = [];
  const ganhou = new Set();       // `${nome}|${spec}` que venceu em pelo menos um número
  const vencedores = new Map();   // chave da disputa -> vencedor, para o ajuste da Concentração
  const perdedor = (it, valor = it.valor) => ({
    canal: it.canal, alvo: it.alvo, valor,
    origem: `condicao:${it.fonte.nome}`, nome: it.fonte.rotulo, duracao: "temporaria",
    furaTeto: false, semCredito: false, suplantado: true,
  });
  for (const [k, itens] of disputas) {
    const negativo = k.endsWith("|-");
    const vencedor = itens.reduce((a, b) => ((negativo ? b.valor < a.valor : b.valor > a.valor) ? b : a));
    vencedores.set(k, vencedor);
    for (const it of itens) {
      if (it !== vencedor) { suplantados.push(perdedor(it)); continue; }
      ganhou.add(`${it.fonte.nome}|${it.spec}`);
      efeitos.push({
        canal: it.canal, alvo: it.alvo, expr: String(it.valor),
        origem: `condicao:${it.fonte.nome}`, nome: it.fonte.rotulo, duracao: "temporaria",
      });
    }
  }

  /* ⚠ A CONCENTRAÇÃO É UM TR DE FORTITUDE (ver `AFTY_MANOBRAS`), então a
     penalidade que uma condição põe na Fortitude JÁ chega nela pela base. Os -5
     do Sofrendo por cima dos -2 do Envenenado dariam -7, e a regra é -5: a linha
     da Concentração leva só o que PASSA do que a Fortitude já tirou. */
  const conc = vencedores.get("bonusManobra|concentracao|-");
  const fort = vencedores.get("bonusTR|fortitude|-");
  if (conc && fort) {
    const linha = efeitos.find((e) => e.canal === "bonusManobra" && e.alvo === "concentracao" && e.expr === String(conc.valor));
    const falta = Math.min(0, conc.valor - fort.valor);
    if (falta === 0) {
      efeitos.splice(efeitos.indexOf(linha), 1);
      suplantados.push(perdedor(conc));
      ganhou.delete(`${conc.fonte.nome}|${conc.spec}`);
    } else {
      linha.expr = String(falta);
      linha.nome = `${conc.fonte.rotulo} (${conc.valor} sem acumular)`;
    }
  }

  /* ---- Movimento: vale o MENOR resultado, e não uma soma ----
     "Aplique apenas os mais severos". Lento e Enredado são a mesma metade, e
     Imóvel zera por cima de qualquer um. */
  const regrasMov = fontes
    .filter((f) => CONDICAO_EFEITOS[f.nome]?.movimento)
    .map((f) => ({ fonte: f, regra: CONDICAO_EFEITOS[f.nome].movimento }));
  const movimento = (base) => {
    if (!regrasMov.length) return { valor: base, partes: [], fonte: null };
    const candidatos = regrasMov.map((r) => ({ ...r, valor: movimentoDaRegra(r.regra, base) }));
    const vencedor = candidatos.reduce((a, b) => (b.valor < a.valor ? b : a));
    const partes = candidatos
      .filter((c) => c.valor !== base)
      .map((c) => ({
        label: c.fonte.rotulo, valor: c.valor - base,
        ...(c === vencedor ? {} : { suplantado: true }),
      }));
    const mudou = vencedor.valor !== base;
    return {
      valor: vencedor.valor, partes,
      fonte: mudou ? vencedor.fonte.rotulo : null,
      nome: mudou ? vencedor.fonte.nome : null,
    };
  };

  const fragil = fontes.find((f) => CONDICAO_EFEITOS[f.nome]?.rdZero) ?? null;

  const falhas = {};
  for (const f of fontes) {
    for (const tr of CONDICAO_EFEITOS[f.nome]?.falha ?? []) {
      (falhas[tr] ??= []).push(f.rotulo);
    }
  }

  /* ---- O que a TELA mostra em cada linha ----
     Os números de cada condição, com os das incluídas dentro, marcados como
     suplantados quando perderam em TODO número que tocam. */
  const efeitosDaFonte = (f) => {
    const def = CONDICAO_EFEITOS[f.nome] ?? {};
    const out = [];
    for (const [spec, valor] of def.mods ?? []) {
      if (!concretos(spec).length) continue;
      out.push({
        chave: `${f.nome}|${spec}`, rotulo: rotuloDoAlvo(spec), texto: sinal(valor),
        suplantado: !ganhou.has(`${f.nome}|${spec}`),
      });
    }
    if (def.movimento) {
      const r = def.movimento;
      out.push({
        chave: `${f.nome}|movimento`, rotulo: "Movimento",
        texto: r.zero ? "0m" : r.metade ? "Metade" : r.menos != null ? `-${textoMetros(r.menos)}` : `Até ${textoMetros(r.teto)}`,
        suplantado: false,
      });
    }
    if (def.custoPE) {
      out.push({ chave: `${f.nome}|custoPE`, rotulo: "Custo em PE", texto: sinal(def.custoPE), suplantado: !ganhou.has(`${f.nome}|custoPE`) });
    }
    if (def.rdZero) {
      out.push({ chave: `${f.nome}|rd`, rotulo: "RD", texto: "Zerada", suplantado: fragil !== f });
      out.push({ chave: `${f.nome}|resistencia`, rotulo: "Resistências", texto: "Anuladas", suplantado: fragil !== f });
    }
    for (const tr of def.falha ?? []) {
      out.push({ chave: `${f.nome}|falha:${tr}`, rotulo: rotuloDoAlvo(`tr:${tr}`), texto: "Falha Automática", suplantado: false });
    }
    return out;
  };

  const ativas = entradas.map((e) => {
    const ficha = fichaDaCondicao(e.nome, e.forca);
    const faixa = CONDICAO_EFEITOS[e.nome]?.perdaVida ? faixaDeSangramento(e.sangramento) : null;
    const forcaFaixa = faixa ? FORCA_POR_ID[faixa.forca] : null;
    const incluidas = expandeInclusoes(e.nome).slice(1);
    /* Os números das incluídas entram SEM o nome delas ao lado (2026-09-22):
       "Defesa (Desprevenido) -3" em cada número empilhava o mesmo sufixo três
       vezes na linha. Quem veio de onde fica dito uma vez, em `inclui`, e o
       hover do número continua dizendo a fonte inteira. */
    const herdadas = incluidas.flatMap((nome) => efeitosDaFonte(porNome.get(nome))
      .map((x) => ({ ...x, chave: `${e.id}|${x.chave}` })));
    return {
      ...ficha,
      // O Sangramento tem a força da faixa escolhida, e não a do catálogo.
      ...(forcaFaixa ? { forcaId: forcaFaixa.id, forcaLabel: forcaFaixa.label, nivel: forcaFaixa.nivel } : {}),
      id: e.id,
      rodadas: e.rodadas,
      sangramento: faixa,
      inclui: incluidas,
      efeitos: [
        ...(faixa ? [{ chave: `${e.id}|perda`, rotulo: "Perda de Vida", texto: `${faixa.dados}d${faixa.faces}`, suplantado: false }] : []),
        ...efeitosDaFonte(porNome.get(e.nome)).map((x) => ({ ...x, chave: `${e.id}|${x.chave}` })),
        ...herdadas,
      ],
    };
  });

  return { ativas, efeitos, suplantados, movimento, fragilizado: fragil?.rotulo ?? null, falhas, vazio: entradas.length === 0 };
}

/**
 * O que uma condição faz, SEM ficha nenhuma: é o que o catálogo mostra antes de
 * alguém escolher (autor, 2026-09-22: a lista de nomes "não fala nada sobre
 * nenhuma das condições ou mostra o que elas fazem").
 *
 * Devolve `{ efeitos, inclui, resumo }`. Os `efeitos` são os números dela, no
 * mesmo formato da linha de uma condição aplicada, e as incluídas entram com o
 * número DELAS, porque é o que a criatura sofre de fato ao receber a condição.
 * Quem veio de onde fica em `inclui`, que a tela diz uma vez.
 */
export function descreveCondicao(nome) {
  const rotulo = (spec) => {
    if (ROTULO_FIXO[spec]) return ROTULO_FIXO[spec];
    const [tipo, id] = spec.split(":");
    return id === "*" ? (ROTULO_TODOS[tipo] ?? spec) : id;
  };
  const daFonte = (n) => {
    const def = CONDICAO_EFEITOS[n] ?? {};
    const out = [];
    for (const [spec, valor] of def.mods ?? []) {
      out.push({ chave: `${n}|${spec}`, rotulo: rotulo(spec), texto: sinal(valor) });
    }
    if (def.movimento) {
      const r = def.movimento;
      out.push({
        chave: `${n}|movimento`, rotulo: "Movimento",
        texto: r.zero ? "0m" : r.metade ? "Metade" : r.menos != null ? `-${textoMetros(r.menos)}` : `Até ${textoMetros(r.teto)}`,
      });
    }
    if (def.custoPE) out.push({ chave: `${n}|custoPE`, rotulo: "Custo em PE", texto: sinal(def.custoPE) });
    if (def.rdZero) {
      out.push({ chave: `${n}|rd`, rotulo: "RD", texto: "Zerada" });
      out.push({ chave: `${n}|resistencia`, rotulo: "Resistências", texto: "Anuladas" });
    }
    for (const tr of def.falha ?? []) {
      out.push({ chave: `${n}|falha:${tr}`, rotulo: rotulo(`tr:${tr}`), texto: "Falha Automática" });
    }
    if (def.perdaVida) out.push({ chave: `${n}|perda`, rotulo: "Perda de Vida", texto: "2d6 a 6d10" });
    return out;
  };
  const incluidas = expandeInclusoes(nome).slice(1);
  return {
    efeitos: [...daFonte(nome), ...incluidas.flatMap((inc) => daFonte(inc))],
    inclui: incluidas,
    resumo: CONDICAO_TEXTOS[nome]?.resumo ?? null,
  };
}

/** "Desprevenido e Imóvel": a lista de inclusões como a tela a escreve. */
export const listaComE = (nomes) => (nomes.length < 2
  ? (nomes[0] ?? "")
  : `${nomes.slice(0, -1).join(", ")} e ${nomes.at(-1)}`);

/**
 * Marca, nas linhas da tela, qual regra de movimento venceu. Fica FORA do
 * `resolveCondicoes` porque o vencedor depende do movimento de entrada, e o
 * derive só o conhece depois de o Motor rodar: Caído (até 4,5m) não muda nada em
 * quem já anda 3m, e Sofrendo (-3m) ganha da metade em quem anda 4,5m.
 */
export function marcaMovimentoNasLinhas(ativas, nomeVencedor) {
  return ativas.map((a) => ({
    ...a,
    efeitos: a.efeitos.map((x) => (x.chave.endsWith("|movimento")
      ? { ...x, suplantado: x.chave.split("|").at(-2) !== nomeVencedor }
      : x)),
  }));
}

/* ============================================================ */
/* VALIDADOR                                                     */
/* ============================================================ */

/**
 * Validador de conteúdo, no mesmo papel de `validarCatalogoAptidoes`.
 *
 * Confere o casamento das chaves dos dois mapas com os nomes do catálogo (e das
 * especiais), porque é justamente a que vai errar: um texto escrito para
 * "Enfeitiçado" e gravado como "Enfeiticado" não daria erro nenhum, a condição
 * só apareceria sem texto.
 */
export function validarCatalogoCondicoes() {
  const erros = [];
  const nomes = new Set([...todasAsCondicoes().map((c) => c.nome), ...CONDICOES_ESPECIAIS]);

  for (const [nome, def] of Object.entries(CONDICAO_TEXTOS)) {
    if (!nomes.has(nome)) {
      erros.push(`CONDICAO_TEXTOS: "${nome}" não existe em CONDICOES_CATALOGO`);
      continue;
    }
    if (!def?.texto) erros.push(`CONDICAO_TEXTOS: "${nome}" não tem texto`);
    if (def?.grupo && !GRUPOS_CONDICAO[def.grupo]) erros.push(`CONDICAO_TEXTOS: "${nome}" tem grupo desconhecido "${def.grupo}"`);
  }

  for (const [nome, def] of Object.entries(CONDICAO_EFEITOS)) {
    if (!nomes.has(nome)) erros.push(`CONDICAO_EFEITOS: "${nome}" não existe em CONDICOES_CATALOGO`);
    for (const inc of def.inclui ?? []) {
      if (!nomes.has(inc)) erros.push(`CONDICAO_EFEITOS: "${nome}" inclui "${inc}", que não existe`);
    }
    for (const [spec] of def.mods ?? []) {
      if (!CANAL_DO_ALVO[spec.split(":")[0]]) erros.push(`CONDICAO_EFEITOS: "${nome}" mira "${spec}", que não é alvo conhecido`);
    }
  }

  // Nome repetido em duas forças: a condição apareceria duas vezes no seletor e
  // a força dela dependeria da ordem de leitura.
  const vistos = new Set();
  for (const c of todasAsCondicoes()) {
    if (vistos.has(c.nome)) erros.push(`CONDICOES_CATALOGO: "${c.nome}" aparece em mais de uma força`);
    vistos.add(c.nome);
  }
  return erros;
}
